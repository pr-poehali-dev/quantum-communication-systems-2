// ─── Расчёт земляных объёмов по точкам (навалы, кучи, выемки) ──────────────────
// Метод: триангуляция Делоне по точкам + суммирование призм над базовой плоскостью.
import { delaunayTriangulation, type Point3D, type TinTriangle } from "@/modules/civil3d-engine"

export interface VolumePoint { x: number; y: number; z: number; code?: string; no?: string | number }

export type VolumeBase =
  | { kind: "min" }                       // от минимальной отметки выделения
  | { kind: "fixed"; elevation: number }  // от заданной отметки
  | { kind: "surface"; getZ: (x: number, y: number) => number | null } // между поверхностями

export interface VolumeResult {
  fill: number        // насыпь / навал (объём выше базы), м³
  cut: number         // выемка (объём ниже базы), м³
  net: number         // fill - cut, м³
  area2d: number      // площадь основания (проекция), м²
  area3d: number      // площадь поверхности, м²
  triangles: number   // число треугольников
  minZ: number
  maxZ: number
  baseElev: number    // применённая базовая отметка (для min/fixed)
  pointCount: number
}

export interface Pile {
  id: string
  name: string
  color: string
  points: VolumePoint[]
  result: VolumeResult
}

const area2dTri = (a: Point3D, b: Point3D, c: Point3D) =>
  Math.abs((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)) / 2

const area3dTri = (a: Point3D, b: Point3D, c: Point3D) => {
  const ux = b.x - a.x, uy = b.y - a.y, uz = b.z - a.z
  const vx = c.x - a.x, vy = c.y - a.y, vz = c.z - a.z
  const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx
  return Math.sqrt(cx * cx + cy * cy + cz * cz) / 2
}

/** Расчёт объёмов по набору точек относительно выбранной базы. */
export function computeVolume(points: VolumePoint[], base: VolumeBase): VolumeResult {
  const empty: VolumeResult = { fill: 0, cut: 0, net: 0, area2d: 0, area3d: 0, triangles: 0, minZ: 0, maxZ: 0, baseElev: 0, pointCount: points.length }
  if (points.length < 3) return empty

  const zs = points.map(p => p.z)
  const minZ = Math.min(...zs)
  const maxZ = Math.max(...zs)
  const baseElev = base.kind === "min" ? minZ : base.kind === "fixed" ? base.elevation : 0

  const tris: TinTriangle[] = delaunayTriangulation(points.map(p => ({ x: p.x, y: p.y, z: p.z })))

  let fill = 0, cut = 0, area2d = 0, area3d = 0

  for (const t of tris) {
    const a2 = area2dTri(t.a, t.b, t.c)
    if (a2 <= 0) continue
    area2d += a2
    area3d += area3dTri(t.a, t.b, t.c)

    // Высота над базой в каждой вершине
    const dh = (p: Point3D) => {
      if (base.kind === "surface") {
        const bz = base.getZ(p.x, p.y)
        return bz == null ? 0 : p.z - bz
      }
      return p.z - baseElev
    }
    const h1 = dh(t.a), h2 = dh(t.b), h3 = dh(t.c)

    // Если все одного знака — простая призма
    if (h1 >= 0 && h2 >= 0 && h3 >= 0) {
      fill += a2 * (h1 + h2 + h3) / 3
    } else if (h1 <= 0 && h2 <= 0 && h3 <= 0) {
      cut += a2 * (-(h1 + h2 + h3)) / 3
    } else {
      // Смешанная призма — численно по подвыборке
      const N = 6
      let sPos = 0, sNeg = 0, cnt = 0
      for (let i = 0; i <= N; i++) for (let j = 0; j <= N - i; j++) {
        const u = i / N, v = j / N, w = 1 - u - v
        const h = h1 * w + h2 * u + h3 * v
        if (h >= 0) sPos += h; else sNeg += -h
        cnt++
      }
      fill += a2 * (sPos / cnt)
      cut += a2 * (sNeg / cnt)
    }
  }

  return {
    fill: +fill.toFixed(2),
    cut: +cut.toFixed(2),
    net: +(fill - cut).toFixed(2),
    area2d: +area2d.toFixed(2),
    area3d: +area3d.toFixed(2),
    triangles: tris.length,
    minZ: +minZ.toFixed(3),
    maxZ: +maxZ.toFixed(3),
    baseElev: +baseElev.toFixed(3),
    pointCount: points.length,
  }
}

/** Группировка точек по коду (COD) — автоматические «кучки» по кодификации. */
export function groupByCode(points: VolumePoint[]): Record<string, VolumePoint[]> {
  const groups: Record<string, VolumePoint[]> = {}
  for (const p of points) {
    const key = (p.code || "Без кода").toString().trim() || "Без кода"
    ;(groups[key] ||= []).push(p)
  }
  return groups
}

const PILE_COLORS = ["#f59e0b", "#22d3ee", "#a855f7", "#ef4444", "#10b981", "#3b82f6", "#ec4899", "#84cc16"]
export const pileColor = (i: number) => PILE_COLORS[i % PILE_COLORS.length]

/** Point-in-polygon (луч) для лассо-выделения. Полигон в тех же координатах, что и точки. */
export function pointInPolygon(x: number, y: number, poly: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1]
    const intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = true
  }
  return inside
}

export const fmtM3 = (v: number) => v.toLocaleString("ru-RU", { maximumFractionDigits: 1 }) + " м³"
