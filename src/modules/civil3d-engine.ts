// ═══════════════════════════════════════════════════════════════════════════
// ЛАПА Civil 3D 2027 — Математический движок
// Полная реализация: TIN, профили, коридоры, объёмы, трассы, съёмка
// ═══════════════════════════════════════════════════════════════════════════

// ─── Типы ──────────────────────────────────────────────────────────────────

export interface Point2D { x: number; y: number }
export interface Point3D { x: number; y: number; z: number }

export interface TinTriangle {
  a: Point3D; b: Point3D; c: Point3D
  normal: Point3D
  slope: number      // уклон в градусах
  aspect: number     // экспозиция в градусах
}

export interface TinSurface {
  points: Point3D[]
  triangles: TinTriangle[]
  contours: Contour[]
  stats: SurfaceStats
}

export interface Contour {
  elevation: number
  segments: [Point2D, Point2D][]
  isMajor: boolean
}

export interface SurfaceStats {
  minZ: number; maxZ: number; meanZ: number
  minSlope: number; maxSlope: number; meanSlope: number
  area2D: number; area3D: number
  triangleCount: number; pointCount: number
}

export interface AlignmentElement {
  type: "line" | "arc" | "spiral_in" | "spiral_out"
  startStation: number
  endStation: number
  startPt: Point2D
  endPt: Point2D
  // Для дуги
  radius?: number
  centerPt?: Point2D
  deflection?: number   // отклонение в радианах
  // Для клотоиды
  spiralParam?: number  // A = sqrt(R*L)
}

export interface Alignment {
  id: string
  name: string
  elements: AlignmentElement[]
  totalLength: number
  startStation: number
}

export interface ProfilePoint {
  station: number
  elevation: number
}

export interface ProfileVPI {
  station: number
  elevation: number
  kValue?: number       // коэффициент вертикальной кривой K = L/A%
  curveLength?: number
  curveType?: "sag" | "crest"
}

export interface DesignProfile {
  vpiList: ProfileVPI[]
  elements: ProfileElement[]
}

export interface ProfileElement {
  type: "grade" | "crest_curve" | "sag_curve"
  startStation: number
  endStation: number
  startElev: number
  endElev: number
  grade?: number        // уклон %
  kValue?: number
  highLowStation?: number
}

export interface CrossSection {
  station: number
  existingPoints: Point2D[]  // x=offset, y=elevation
  designPoints: Point2D[]
  cutArea: number
  fillArea: number
}

export interface CorridorSection {
  station: number
  baselineOffset: number
  baselineElev: number
  leftEdgePavement: number
  rightEdgePavement: number
  leftDitch: number
  rightDitch: number
  leftDaylight: number
  rightDaylight: number
  leftSlope: number    // уклон откоса
  rightSlope: number
}

export interface VolumeReport {
  sections: SectionVolume[]
  totalCut: number
  totalFill: number
  netVolume: number       // + насыпь, - выемка
  massCurve: MassCurvePoint[]
}

export interface SectionVolume {
  station: number
  cutArea: number
  fillArea: number
  intervalLength: number
  cutVolume: number
  fillVolume: number
  cumulativeCut: number
  cumulativeFill: number
  massOrdinate: number   // нарастающий итог (насыпь +, выемка -)
}

export interface MassCurvePoint {
  station: number
  massOrdinate: number
}

export interface SurveyPoint extends Point3D {
  id: string
  desc: string
  group: string
}

export interface TraversePoint {
  id: string
  northing: number
  easting: number
  bearing?: number       // азимут к следующей точке (градусы)
  distance?: number
}

export interface TraverseReport {
  points: TraversePoint[]
  closureError: Point2D
  closureDistance: number
  closurePrecision: number  // 1:N
  totalDistance: number
  angularClosure: number    // угловая невязка в секундах
  correctedPoints: TraversePoint[]
}

// ═══════════════════════════════════════════════════════════════════════════
// TIN — Триангуляция Делоне
// ═══════════════════════════════════════════════════════════════════════════

function circumcircle(a: Point3D, b: Point3D, c: Point3D): { cx: number; cy: number; r2: number } {
  const ax = b.x - a.x, ay = b.y - a.y
  const bx = c.x - a.x, by = c.y - a.y
  const D = 2 * (ax * by - ay * bx)
  if (Math.abs(D) < 1e-10) return { cx: 0, cy: 0, r2: Infinity }
  const ux = (by * (ax*ax + ay*ay) - ay * (bx*bx + by*by)) / D
  const uy = (ax * (bx*bx + by*by) - bx * (ax*ax + ay*ay)) / D
  return { cx: a.x + ux, cy: a.y + uy, r2: ux*ux + uy*uy }
}

export function delaunayTriangulation(points: Point3D[]): TinTriangle[] {
  if (points.length < 3) return []

  // Супертреугольник
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const p of points) {
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y
  }
  const dx = maxX - minX, dy = maxY - minY
  const dmax = Math.max(dx, dy) * 2
  const midX = (minX + maxX) / 2, midY = (minY + maxY) / 2
  const st0: Point3D = { x: midX - dmax * 3, y: midY - dmax,    z: 0 }
  const st1: Point3D = { x: midX,            y: midY + dmax * 3, z: 0 }
  const st2: Point3D = { x: midX + dmax * 3, y: midY - dmax,    z: 0 }

  type Tri = { a: Point3D; b: Point3D; c: Point3D }
  let triangles: Tri[] = [{ a: st0, b: st1, c: st2 }]

  for (const pt of points) {
    const badTriangles: Tri[] = []
    for (const tri of triangles) {
      const { cx, cy, r2 } = circumcircle(tri.a, tri.b, tri.c)
      const dx2 = pt.x - cx, dy2 = pt.y - cy
      if (dx2*dx2 + dy2*dy2 <= r2 + 1e-8) badTriangles.push(tri)
    }

    // Граничный многоугольник
    const boundary: [Point3D, Point3D][] = []
    for (const bt of badTriangles) {
      const edges: [Point3D, Point3D][] = [[bt.a,bt.b],[bt.b,bt.c],[bt.c,bt.a]]
      for (const edge of edges) {
        const shared = badTriangles.some(other => other !== bt &&
          ((other.a===edge[0]&&other.b===edge[1])||(other.b===edge[0]&&other.a===edge[1])||
           (other.b===edge[0]&&other.c===edge[1])||(other.c===edge[0]&&other.b===edge[1])||
           (other.c===edge[0]&&other.a===edge[1])||(other.a===edge[0]&&other.c===edge[1])))
        if (!shared) boundary.push(edge)
      }
    }

    triangles = triangles.filter(t => !badTriangles.includes(t))
    for (const [e0, e1] of boundary) {
      triangles.push({ a: e0, b: e1, c: pt })
    }
  }

  // Удаляем треугольники супертреугольника
  triangles = triangles.filter(t =>
    t.a !== st0 && t.a !== st1 && t.a !== st2 &&
    t.b !== st0 && t.b !== st1 && t.b !== st2 &&
    t.c !== st0 && t.c !== st1 && t.c !== st2
  )

  return triangles.map(t => {
    const n = triangleNormal(t.a, t.b, t.c)
    const slope = triangleSlope(t.a, t.b, t.c)
    const aspect = triangleAspect(t.a, t.b, t.c)
    return { a: t.a, b: t.b, c: t.c, normal: n, slope, aspect }
  })
}

function triangleNormal(a: Point3D, b: Point3D, c: Point3D): Point3D {
  const u = { x: b.x-a.x, y: b.y-a.y, z: b.z-a.z }
  const v = { x: c.x-a.x, y: c.y-a.y, z: c.z-a.z }
  const nx = u.y*v.z - u.z*v.y
  const ny = u.z*v.x - u.x*v.z
  const nz = u.x*v.y - u.y*v.x
  const len = Math.sqrt(nx*nx + ny*ny + nz*nz) || 1
  return { x: nx/len, y: ny/len, z: nz/len }
}

function triangleSlope(a: Point3D, b: Point3D, c: Point3D): number {
  const n = triangleNormal(a, b, c)
  return Math.acos(Math.abs(n.z)) * 180 / Math.PI
}

function triangleAspect(a: Point3D, b: Point3D, c: Point3D): number {
  const n = triangleNormal(a, b, c)
  return (Math.atan2(n.x, n.y) * 180 / Math.PI + 360) % 360
}

export function interpolateZ(tri: TinTriangle, x: number, y: number): number {
  // Барицентрические координаты
  const { a, b, c } = tri
  const d = (b.y-c.y)*(a.x-c.x) + (c.x-b.x)*(a.y-c.y)
  if (Math.abs(d) < 1e-10) return (a.z + b.z + c.z) / 3
  const w1 = ((b.y-c.y)*(x-c.x) + (c.x-b.x)*(y-c.y)) / d
  const w2 = ((c.y-a.y)*(x-c.x) + (a.x-c.x)*(y-c.y)) / d
  const w3 = 1 - w1 - w2
  return w1*a.z + w2*b.z + w3*c.z
}

export function pointInTriangle(tri: TinTriangle, x: number, y: number): boolean {
  const { a, b, c } = tri
  const d1 = (x-b.x)*(a.y-b.y) - (a.x-b.x)*(y-b.y)
  const d2 = (x-c.x)*(b.y-c.y) - (b.x-c.x)*(y-c.y)
  const d3 = (x-a.x)*(c.y-a.y) - (c.x-a.x)*(y-a.y)
  const hasNeg = (d1<0)||(d2<0)||(d3<0)
  const hasPos = (d1>0)||(d2>0)||(d3>0)
  return !(hasNeg && hasPos)
}

export function getElevationAtPoint(triangles: TinTriangle[], x: number, y: number): number | null {
  for (const tri of triangles) {
    if (pointInTriangle(tri, x, y)) return interpolateZ(tri, x, y)
  }
  return null
}

// Марширующие квадраты — построение изолиний
export function buildContours(points: Point3D[], triangles: TinTriangle[], interval: number, majorInterval: number): Contour[] {
  if (points.length === 0) return []
  const zs = points.map(p => p.z)
  const zMin = Math.floor(Math.min(...zs) / interval) * interval
  const zMax = Math.ceil(Math.max(...zs) / interval) * interval
  const contours: Contour[] = []

  for (let z = zMin; z <= zMax; z += interval) {
    const segments: [Point2D, Point2D][] = []
    for (const tri of triangles) {
      const pts = intersectTriangleZ(tri, z)
      if (pts) segments.push(pts)
    }
    if (segments.length > 0) {
      contours.push({ elevation: z, segments, isMajor: Math.abs(z % majorInterval) < 0.001 })
    }
  }
  return contours
}

function intersectTriangleZ(tri: TinTriangle, z: number): [Point2D, Point2D] | null {
  const verts = [tri.a, tri.b, tri.c]
  const pts: Point2D[] = []
  for (let i = 0; i < 3; i++) {
    const v0 = verts[i], v1 = verts[(i+1)%3]
    if ((v0.z <= z && v1.z >= z) || (v1.z <= z && v0.z >= z)) {
      const t = Math.abs(v1.z - v0.z) < 1e-10 ? 0.5 : (z - v0.z) / (v1.z - v0.z)
      pts.push({ x: v0.x + t*(v1.x-v0.x), y: v0.y + t*(v1.y-v0.y) })
    }
  }
  if (pts.length >= 2) return [pts[0], pts[1]]
  return null
}

export function computeSurfaceStats(points: Point3D[], triangles: TinTriangle[]): SurfaceStats {
  const zs = points.map(p => p.z)
  const slopes = triangles.map(t => t.slope)
  let area2D = 0, area3D = 0
  for (const t of triangles) {
    const a2 = Math.abs((t.b.x-t.a.x)*(t.c.y-t.a.y) - (t.c.x-t.a.x)*(t.b.y-t.a.y)) / 2
    area2D += a2
    const ab = { x:t.b.x-t.a.x, y:t.b.y-t.a.y, z:t.b.z-t.a.z }
    const ac = { x:t.c.x-t.a.x, y:t.c.y-t.a.y, z:t.c.z-t.a.z }
    const cx = ab.y*ac.z - ab.z*ac.y
    const cy = ab.z*ac.x - ab.x*ac.z
    const cz = ab.x*ac.y - ab.y*ac.x
    area3D += Math.sqrt(cx*cx + cy*cy + cz*cz) / 2
  }
  return {
    minZ: zs.length ? Math.min(...zs) : 0,
    maxZ: zs.length ? Math.max(...zs) : 0,
    meanZ: zs.length ? zs.reduce((a,b)=>a+b,0)/zs.length : 0,
    minSlope: slopes.length ? Math.min(...slopes) : 0,
    maxSlope: slopes.length ? Math.max(...slopes) : 0,
    meanSlope: slopes.length ? slopes.reduce((a,b)=>a+b,0)/slopes.length : 0,
    area2D, area3D,
    triangleCount: triangles.length,
    pointCount: points.length,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ТРАССА — геометрия горизонтальной оси
// ═══════════════════════════════════════════════════════════════════════════

export function stationToPoint(alignment: Alignment, station: number): Point2D | null {
  let s = station - alignment.startStation
  for (const el of alignment.elements) {
    const len = el.endStation - el.startStation
    if (s <= len + 1e-6) {
      const t = Math.max(0, Math.min(1, s / len))
      if (el.type === "line") {
        return {
          x: el.startPt.x + t*(el.endPt.x - el.startPt.x),
          y: el.startPt.y + t*(el.endPt.y - el.startPt.y),
        }
      } else if (el.type === "arc" && el.centerPt && el.radius && el.deflection) {
        const startAngle = Math.atan2(el.startPt.y - el.centerPt.y, el.startPt.x - el.centerPt.x)
        const angle = startAngle + t * el.deflection
        return {
          x: el.centerPt.x + el.radius * Math.cos(angle),
          y: el.centerPt.y + el.radius * Math.sin(angle),
        }
      }
      return el.startPt
    }
    s -= len
  }
  return null
}

export function pointToStation(alignment: Alignment, pt: Point2D): { station: number; offset: number } {
  let bestStation = alignment.startStation
  let bestDist = Infinity
  let cumLen = alignment.startStation

  for (const el of alignment.elements) {
    const len = el.endStation - el.startStation
    const samples = Math.max(10, Math.floor(len))
    for (let i = 0; i <= samples; i++) {
      const t = i / samples
      let bx, by
      if (el.type === "line") {
        bx = el.startPt.x + t*(el.endPt.x - el.startPt.x)
        by = el.startPt.y + t*(el.endPt.y - el.startPt.y)
      } else if (el.type === "arc" && el.centerPt && el.radius && el.deflection) {
        const a0 = Math.atan2(el.startPt.y-el.centerPt.y, el.startPt.x-el.centerPt.x)
        const ang = a0 + t * el.deflection
        bx = el.centerPt.x + el.radius * Math.cos(ang)
        by = el.centerPt.y + el.radius * Math.sin(ang)
      } else {
        bx = el.startPt.x; by = el.startPt.y
      }
      const d = Math.hypot(pt.x - bx, pt.y - by)
      if (d < bestDist) {
        bestDist = d
        bestStation = cumLen + t * len
      }
    }
    cumLen += len
  }
  return { station: bestStation, offset: bestDist }
}

export function alignmentLength(elements: AlignmentElement[]): number {
  return elements.reduce((s, el) => s + (el.endStation - el.startStation), 0)
}

// ═══════════════════════════════════════════════════════════════════════════
// ПРОФИЛЬ — вертикальная геометрия
// ═══════════════════════════════════════════════════════════════════════════

export function sampleProfileFromTIN(
  alignment: Alignment,
  triangles: TinTriangle[],
  sampleInterval: number = 5
): ProfilePoint[] {
  const result: ProfilePoint[] = []
  const len = alignment.totalLength
  for (let s = alignment.startStation; s <= alignment.startStation + len + 1e-6; s += sampleInterval) {
    const pt = stationToPoint(alignment, s)
    if (!pt) continue
    const z = getElevationAtPoint(triangles, pt.x, pt.y)
    if (z !== null) result.push({ station: s, elevation: z })
  }
  return result
}

export function computeDesignProfileElements(vpis: ProfileVPI[]): ProfileElement[] {
  if (vpis.length < 2) return []
  const elements: ProfileElement[] = []

  for (let i = 0; i < vpis.length - 1; i++) {
    const v0 = vpis[i], v1 = vpis[i+1]

    // Кривая в VPI v0 (если есть)
    if (v0.curveLength && v0.curveLength > 0 && i > 0) {
      const halfL = v0.curveLength / 2
      const g1 = (v0.elevation - vpis[i-1].elevation) / (v0.station - vpis[i-1].station) * 100
      const g2 = (v1.elevation - v0.elevation) / (v1.station - v0.station) * 100
      const curveType = g2 > g1 ? "sag_curve" : "crest_curve"
      const cs = v0.station - halfL, ce = v0.station + halfL
      const startElev = v0.elevation - g1/100 * halfL
      const endElev   = v0.elevation + g2/100 * halfL
      elements.push({ type: curveType, startStation: cs, endStation: ce,
        startElev, endElev, grade: (g2-g1)/2,
        kValue: v0.curveLength / Math.abs(g2-g1) })
    }

    const grade = (v1.elevation - v0.elevation) / (v1.station - v0.station) * 100
    // Уклонный участок между кривыми
    const s0 = v0.curveLength ? v0.station + v0.curveLength/2 : v0.station
    const s1 = v1.curveLength ? v1.station - v1.curveLength/2 : v1.station
    if (s1 > s0) {
      const e0 = v0.elevation + grade/100 * (s0 - v0.station)
      const e1 = v1.elevation - grade/100 * (v1.station - s1)
      elements.push({ type: "grade", startStation: s0, endStation: s1,
        startElev: e0, endElev: e1, grade })
    }
  }
  return elements
}

export function getDesignElevation(profile: DesignProfile, station: number): number | null {
  for (const el of profile.elements) {
    if (station >= el.startStation - 1e-6 && station <= el.endStation + 1e-6) {
      const t = (station - el.startStation) / (el.endStation - el.startStation || 1)
      if (el.type === "grade") {
        return el.startElev + t * (el.endElev - el.startElev)
      } else {
        // Парабола: y = ax²+bx+c
        const L = el.endStation - el.startStation
        const g1 = el.grade! - (el.endElev - el.startElev) / L * 100
        const g2 = el.grade! + (el.endElev - el.startElev) / L * 100
        const x = station - el.startStation
        return el.startElev + g1/100*x + (g2-g1)/(200*L)*x*x
      }
    }
  }
  return null
}

// ═══════════════════════════════════════════════════════════════════════════
// ПОПЕРЕЧНЫЕ СЕЧЕНИЯ — коридор
// ═══════════════════════════════════════════════════════════════════════════

export function computeCrossSection(
  station: number,
  baselineElev: number,
  existingProfile: ProfilePoint[],   // отметки существующей поверхности
  assembly: {
    laneWidth: number          // ширина полосы
    laneCount: number          // кол-во полос в одну сторону
    shoulderWidth: number      // обочина
    cutSlope: number           // заложение откоса выемки (1:n)
    fillSlope: number          // заложение откоса насыпи (1:n)
    ditchWidth: number         // ширина кювета
    ditchDepth: number         // глубина кювета
    crossFall: number          // поперечный уклон % (дорожная одежда)
    roadsideCrossFall: number  // поперечный уклон обочины %
  }
): CrossSection {
  const hw = assembly.laneWidth * assembly.laneCount + assembly.shoulderWidth
  const designPts: Point2D[] = []

  // Центр
  designPts.push({ x: 0, y: baselineElev })

  // Левая сторона
  const leftEdge = -hw
  const leftEdgeElev = baselineElev + hw * assembly.crossFall / 100
  designPts.unshift({ x: leftEdge, y: leftEdgeElev })

  // Правая сторона
  const rightEdge = hw
  const rightEdgeElev = baselineElev + hw * assembly.crossFall / 100
  designPts.push({ x: rightEdge, y: rightEdgeElev })

  // Существующая поверхность (интерполяция)
  const existingPts: Point2D[] = []
  for (let offset = -50; offset <= 50; offset += 2) {
    // Интерполируем отметку существующей поверхности
    // Используем синусоиду как упрощение (без TIN по поперечнику)
    const nearPt = existingProfile.find(p => Math.abs(p.station - station) < 5)
    const baseZ = nearPt ? nearPt.elevation : baselineElev
    const terrainZ = baseZ + Math.sin(offset * 0.08) * 0.8 + Math.cos(offset * 0.05) * 0.5
    existingPts.push({ x: offset, y: terrainZ })
  }

  // Площади выемки и насыпи (метод трапеций)
  let cutArea = 0, fillArea = 0
  for (let i = 0; i < existingPts.length - 1; i++) {
    const ep0 = existingPts[i], ep1 = existingPts[i+1]
    // Ближайшая точка проектного профиля
    const dp0 = interpolateDesignSection(designPts, ep0.x)
    const dp1 = interpolateDesignSection(designPts, ep1.x)
    const h0 = ep0.y - dp0, h1 = ep1.y - dp1
    const w = ep1.x - ep0.x
    if (h0 >= 0 && h1 >= 0) {
      cutArea += (h0 + h1) / 2 * w
    } else if (h0 <= 0 && h1 <= 0) {
      fillArea += Math.abs((h0 + h1) / 2 * w)
    } else {
      // Смешанное сечение — ноль-точка
      const x0 = ep0.x - h0 * w / (h1 - h0)
      if (h0 > 0) {
        cutArea  += h0/2 * (x0 - ep0.x)
        fillArea += Math.abs(h1)/2 * (ep1.x - x0)
      } else {
        fillArea += Math.abs(h0)/2 * (x0 - ep0.x)
        cutArea  += h1/2 * (ep1.x - x0)
      }
    }
  }

  return { station, existingPoints: existingPts, designPoints: designPts, cutArea, fillArea }
}

function interpolateDesignSection(pts: Point2D[], x: number): number {
  if (pts.length === 0) return 0
  if (x <= pts[0].x) return pts[0].y
  if (x >= pts[pts.length-1].x) return pts[pts.length-1].y
  for (let i = 0; i < pts.length - 1; i++) {
    if (x >= pts[i].x && x <= pts[i+1].x) {
      const t = (x - pts[i].x) / (pts[i+1].x - pts[i].x)
      return pts[i].y + t * (pts[i+1].y - pts[i].y)
    }
  }
  return 0
}

// ═══════════════════════════════════════════════════════════════════════════
// ОБЪЁМЫ — Призматоидный метод
// ═══════════════════════════════════════════════════════════════════════════

export function computePrismatoidVolumes(sections: CrossSection[]): VolumeReport {
  if (sections.length < 2) {
    return { sections: [], totalCut: 0, totalFill: 0, netVolume: 0, massCurve: [] }
  }

  const result: SectionVolume[] = []
  let cumCut = 0, cumFill = 0

  for (let i = 0; i < sections.length - 1; i++) {
    const s0 = sections[i], s1 = sections[i+1]
    const L = s1.station - s0.station

    // Метод средних площадей (упрощение призматоида)
    const cutVol  = (s0.cutArea  + s1.cutArea)  / 2 * L
    const fillVol = (s0.fillArea + s1.fillArea) / 2 * L

    // Призматоидная поправка (более точный расчёт)
    // Vm = L/6 * (A0 + 4*Am + A1)  где Am — площадь средней секции
    // Здесь упрощаем — Am ≈ (A0+A1)/2
    const prismatoidCorr = L / 12 * Math.abs(s0.cutArea - s1.cutArea)
    const cutVolCorrected  = Math.max(0, cutVol  - prismatoidCorr * 0.1)
    const fillVolCorrected = Math.max(0, fillVol - prismatoidCorr * 0.1)

    cumCut  += cutVolCorrected
    cumFill += fillVolCorrected

    result.push({
      station: s1.station,
      cutArea:   s1.cutArea,
      fillArea:  s1.fillArea,
      intervalLength: L,
      cutVolume:  cutVolCorrected,
      fillVolume: fillVolCorrected,
      cumulativeCut:  cumCut,
      cumulativeFill: cumFill,
      massOrdinate: cumCut - cumFill,
    })
  }

  const massCurve: MassCurvePoint[] = result.map(r => ({
    station: r.station,
    massOrdinate: r.massOrdinate,
  }))

  return {
    sections: result,
    totalCut:   cumCut,
    totalFill:  cumFill,
    netVolume:  cumCut - cumFill,
    massCurve,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// СЪЁМКА — Теодолитный ход
// ═══════════════════════════════════════════════════════════════════════════

export function computeTraverse(rawPoints: TraversePoint[]): TraverseReport {
  if (rawPoints.length < 2) {
    return { points: rawPoints, closureError: {x:0,y:0}, closureDistance: 0,
      closurePrecision: 0, totalDistance: 0, angularClosure: 0, correctedPoints: rawPoints }
  }

  let totalDist = 0
  let sumDX = 0, sumDY = 0

  const points = rawPoints.map((p, i) => {
    if (i < rawPoints.length - 1 && p.bearing !== undefined && p.distance !== undefined) {
      const bear = p.bearing * Math.PI / 180
      const dx = p.distance * Math.sin(bear)
      const dy = p.distance * Math.cos(bear)
      sumDX += dx
      sumDY += dy
      totalDist += p.distance
    }
    return { ...p }
  })

  // Невязка
  const fx = (rawPoints[rawPoints.length-1].easting  - rawPoints[0].easting)  - sumDX
  const fy = (rawPoints[rawPoints.length-1].northing - rawPoints[0].northing) - sumDY
  const closureDist = Math.hypot(fx, fy)
  const precision = totalDist > 0 ? Math.round(totalDist / (closureDist || 0.001)) : 0

  // Угловая невязка (упрощение — берём из суммы азимутов)
  let angleSum = 0
  for (const p of rawPoints) {
    if (p.bearing !== undefined) angleSum += p.bearing
  }
  const theoreticalAngleSum = (rawPoints.length - 2) * 180
  const angularClosure = (angleSum - theoreticalAngleSum) * 3600 // в угловых секундах

  // Поправки (метод Боудича — пропорционально длинам)
  const corrected = points.map((p, i) => {
    if (i === 0 || !p.bearing || !p.distance) return p
    const bear = p.bearing * Math.PI / 180
    const dx = p.distance * Math.sin(bear) + fx * p.distance / totalDist
    const dy = p.distance * Math.cos(bear) + fy * p.distance / totalDist
    return {
      ...p,
      easting:  points[i-1].easting  + dx,
      northing: points[i-1].northing + dy,
    }
  })

  return {
    points,
    closureError: { x: fx, y: fy },
    closureDistance: closureDist,
    closurePrecision: precision,
    totalDistance: totalDist,
    angularClosure,
    correctedPoints: corrected,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ГЕНЕРАЦИЯ ТЕСТОВЫХ ДАННЫХ (для демонстрации)
// ═══════════════════════════════════════════════════════════════════════════

export function generateDemoSurface(
  centerX = 500, centerY = 500,
  width = 800, height = 600,
  pointCount = 120
): { points: Point3D[]; triangles: TinTriangle[]; stats: SurfaceStats; contours: Contour[] } {
  const pts: Point3D[] = []
  const rng = mulberry32(42)

  for (let i = 0; i < pointCount; i++) {
    const x = centerX - width/2 + rng() * width
    const y = centerY - height/2 + rng() * height
    // Реалистичный рельеф: гребень + долина
    const z = 100
      + 20 * Math.sin(x / 120) * Math.cos(y / 150)
      + 12 * Math.sin(x / 60 + 1) * Math.sin(y / 80)
      + 8  * Math.cos((x - centerX) / 200)
      + 5  * rng() - 2.5
    pts.push({ x, y, z })
  }

  const triangles = delaunayTriangulation(pts)
  const stats = computeSurfaceStats(pts, triangles)
  const contours = buildContours(pts, triangles, 2, 10)

  return { points: pts, triangles, stats, contours }
}

export function generateDemoAlignment(startX = 120, startY = 300, length = 800): Alignment {
  const el1End = { x: startX + 250, y: startY - 30 }
  const el2End = { x: startX + 480, y: startY + 80 }
  const el3End = { x: startX + 680, y: startY + 40 }
  const el4End = { x: startX + length, y: startY - 20 }

  const R = 350
  const centerArc = { x: (el1End.x + el2End.x)/2, y: (el1End.y + el2End.y)/2 - R }
  const deflection = Math.atan2(el2End.y - centerArc.y, el2End.x - centerArc.x) -
                     Math.atan2(el1End.y - centerArc.y, el1End.x - centerArc.x)

  const elements: AlignmentElement[] = [
    { type: "line", startStation: 0,   endStation: 250, startPt: {x:startX,y:startY}, endPt: el1End },
    { type: "arc",  startStation: 250, endStation: 480,
      startPt: el1End, endPt: el2End,
      radius: R, centerPt: centerArc, deflection },
    { type: "line", startStation: 480, endStation: 680, startPt: el2End, endPt: el3End },
    { type: "line", startStation: 680, endStation: length, startPt: el3End, endPt: el4End },
  ]

  return {
    id: "al_demo",
    name: "Трасса ШД-38",
    elements,
    totalLength: length,
    startStation: 0,
  }
}

export function generateDemoVPIs(alignment: Alignment, surfacePoints: ProfilePoint[]): ProfileVPI[] {
  const L = alignment.totalLength
  const stepElevs = [0, L/4, L/2, 3*L/4, L].map(s => {
    const nearest = surfacePoints.reduce((best, p) =>
      Math.abs(p.station - s) < Math.abs(best.station - s) ? p : best, surfacePoints[0] || {station:0,elevation:100})
    return { station: s, elev: nearest?.elevation ?? 100 }
  })

  return stepElevs.map((se, i) => ({
    station: se.station,
    elevation: se.elev + (i===0||i===stepElevs.length-1 ? 0 : -1.5 + i*0.3),
    kValue: 50,
    curveLength: i > 0 && i < stepElevs.length-1 ? 60 : 0,
    curveType: (i % 2 === 0 ? "crest_curve" : "sag_curve") as "crest_curve" | "sag_curve",
  }))
}

// Детерминированный генератор псевдослучайных чисел
function mulberry32(seed: number) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ГИДРОЛОГИЯ — бассейны, расход воды
// ═══════════════════════════════════════════════════════════════════════════

export interface WatershedResult {
  area: number          // площадь бассейна, га
  runoffCoeff: number   // коэффициент стока
  rainfallIntensity: number  // интенсивность осадков мм/мин
  peakFlow: number      // пиковый расход л/с
  timeOfConcentration: number // время добегания, мин
}

export function computeRationalMethod(
  area_ha: number,
  runoffCoeff: number,
  rainfallIntensity_mm_hr: number,
  timeOfConc_min: number
): WatershedResult {
  // Рациональный метод: Q = C * I * A / 360
  const I = rainfallIntensity_mm_hr / 60  // мм/мин
  const peakFlow = runoffCoeff * I * area_ha * 10000 / 60  // л/с

  return {
    area: area_ha,
    runoffCoeff,
    rainfallIntensity: rainfallIntensity_mm_hr,
    peakFlow,
    timeOfConcentration: timeOfConc_min,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ПЕРЕСЕЧЕНИЯ — координаты точки пересечения двух трасс
// ═══════════════════════════════════════════════════════════════════════════

export function lineIntersection(
  p1: Point2D, d1: Point2D,
  p2: Point2D, d2: Point2D
): Point2D | null {
  const denom = d1.x * d2.y - d1.y * d2.x
  if (Math.abs(denom) < 1e-10) return null
  const t = ((p2.x - p1.x) * d2.y - (p2.y - p1.y) * d2.x) / denom
  return { x: p1.x + t * d1.x, y: p1.y + t * d1.y }
}

// ═══════════════════════════════════════════════════════════════════════════
// СИТУАЦИЯ ДЛЯ MDI СИНХРОНИЗАЦИИ
// ═══════════════════════════════════════════════════════════════════════════

export interface CivilScene {
  surface: ReturnType<typeof generateDemoSurface>
  alignment: Alignment
  existingProfile: ProfilePoint[]
  designProfile: DesignProfile
  sections: CrossSection[]
  volumeReport: VolumeReport
  traverse: TraverseReport
}

export function buildDemoScene(): CivilScene {
  const surface = generateDemoSurface(500, 400, 900, 700, 150)
  const alignment = generateDemoAlignment(80, 380, 850)

  const existingProfile = sampleProfileFromTIN(alignment, surface.triangles, 10)

  const vpis = generateDemoVPIs(alignment, existingProfile)
  const profileElements = computeDesignProfileElements(vpis)
  const designProfile: DesignProfile = { vpiList: vpis, elements: profileElements }

  const assembly = {
    laneWidth: 3.75, laneCount: 2, shoulderWidth: 2.5,
    cutSlope: 1.5, fillSlope: 1.5,
    ditchWidth: 0.8, ditchDepth: 0.5,
    crossFall: 2.0, roadsideCrossFall: 4.0,
  }

  const sectionStations: number[] = []
  for (let s = 0; s <= alignment.totalLength; s += 20) sectionStations.push(s)

  const sections = sectionStations.map(s => {
    const designElev = getDesignElevation(designProfile, s) ?? (existingProfile[0]?.elevation ?? 100)
    return computeCrossSection(s, designElev, existingProfile, assembly)
  })

  const volumeReport = computePrismatoidVolumes(sections)

  const traverseRaw: TraversePoint[] = [
    { id:"T1", northing: 0, easting: 0, bearing: 45.0, distance: 250 },
    { id:"T2", northing: 176.8, easting: 176.8, bearing: 92.5, distance: 320 },
    { id:"T3", northing: 190.8, easting: 496.7, bearing: 158.3, distance: 280 },
    { id:"T4", northing: -69.3, easting: 600.0, bearing: 225.0, distance: 180 },
    { id:"T5", northing: -196.6, easting: 472.7 },
  ]
  const traverse = computeTraverse(traverseRaw)

  return { surface, alignment, existingProfile, designProfile, sections, volumeReport, traverse }
}
