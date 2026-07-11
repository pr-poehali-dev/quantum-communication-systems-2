// ── Мини-ядро САПР: параметрические тела, меши, проекция, масс-характеристики ──

export type Vec3 = [number, number, number]

export interface Mesh {
  vertices: Vec3[]
  faces: number[][]      // индексы вершин (полигоны, обычно 3-4)
}

export type SolidKind =
  | "box"            // параллелепипед (выдавливание прямоугольника)
  | "cylinder"       // цилиндр (выдавливание/вращение круга)
  | "cone"           // конус
  | "sphere"         // сфера (вращение)
  | "prism"          // призма (выдавливание N-угольника)
  | "torus"          // тор
  | "revolve"        // тело вращения профиля (демо — бочка)

export interface Feature {
  id: number
  kind: SolidKind
  name: string
  op: "Выдавливание" | "Вращение" | "По сечениям" | "Кинематическая" | "Объектная"
  // параметры
  w: number          // ширина / диаметр
  d: number          // глубина
  h: number          // высота / длина
  sides: number      // граней для призмы
  material: string
  color: string
  visible: boolean
  // положение
  pos: Vec3
}

export const MATERIALS: Record<string, { ru: string; density: number; color: string }> = {
  steel:   { ru: "Сталь 45",        density: 7850, color: "#8a94a6" },
  alu:     { ru: "Алюминий Д16",    density: 2700, color: "#b8c0cc" },
  brass:   { ru: "Латунь ЛС59",     density: 8500, color: "#c9a441" },
  cast:    { ru: "Чугун СЧ20",      density: 7200, color: "#5b6470" },
  plastic: { ru: "Пластик ABS",     density: 1050, color: "#e2725b" },
  titan:   { ru: "Титан ВТ6",       density: 4430, color: "#9aa7b0" },
}

// ── Генераторы мешей ──────────────────────────────────────────────────────
function boxMesh(w: number, d: number, h: number): Mesh {
  const x = w / 2, y = d / 2, z = h / 2
  const vertices: Vec3[] = [
    [-x, -y, -z], [x, -y, -z], [x, y, -z], [-x, y, -z],
    [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z],
  ]
  const faces = [
    [0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4],
    [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7],
  ]
  return { vertices, faces }
}

function cylinderMesh(r: number, h: number, seg = 24, r2 = r): Mesh {
  const vertices: Vec3[] = []
  const faces: number[][] = []
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * Math.PI * 2
    vertices.push([Math.cos(a) * r, Math.sin(a) * r, -h / 2])
  }
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * Math.PI * 2
    vertices.push([Math.cos(a) * r2, Math.sin(a) * r2, h / 2])
  }
  for (let i = 0; i < seg; i++) {
    const n = (i + 1) % seg
    faces.push([i, n, seg + n, seg + i])
  }
  // крышки (триангуляция веером)
  for (let i = 1; i < seg - 1; i++) faces.push([0, i, i + 1])
  for (let i = 1; i < seg - 1; i++) faces.push([seg, seg + i + 1, seg + i])
  return { vertices, faces }
}

function sphereMesh(r: number, seg = 16): Mesh {
  const vertices: Vec3[] = []
  const faces: number[][] = []
  const rings = seg
  for (let i = 0; i <= rings; i++) {
    const phi = (i / rings) * Math.PI
    for (let j = 0; j <= seg; j++) {
      const th = (j / seg) * Math.PI * 2
      vertices.push([r * Math.sin(phi) * Math.cos(th), r * Math.sin(phi) * Math.sin(th), r * Math.cos(phi)])
    }
  }
  const cols = seg + 1
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < seg; j++) {
      const a = i * cols + j
      faces.push([a, a + 1, a + cols + 1, a + cols])
    }
  }
  return { vertices, faces }
}

function torusMesh(R: number, r: number, seg = 24, seg2 = 12): Mesh {
  const vertices: Vec3[] = []
  const faces: number[][] = []
  for (let i = 0; i < seg; i++) {
    const u = (i / seg) * Math.PI * 2
    for (let j = 0; j < seg2; j++) {
      const v = (j / seg2) * Math.PI * 2
      vertices.push([(R + r * Math.cos(v)) * Math.cos(u), (R + r * Math.cos(v)) * Math.sin(u), r * Math.sin(v)])
    }
  }
  for (let i = 0; i < seg; i++) {
    for (let j = 0; j < seg2; j++) {
      const a = i * seg2 + j
      const b = ((i + 1) % seg) * seg2 + j
      const c = ((i + 1) % seg) * seg2 + (j + 1) % seg2
      const dd = i * seg2 + (j + 1) % seg2
      faces.push([a, b, c, dd])
    }
  }
  return { vertices, faces }
}

function prismMesh(r: number, h: number, sides: number): Mesh {
  return cylinderMesh(r, h, Math.max(3, sides))
}

export function buildMesh(f: Feature): Mesh {
  switch (f.kind) {
    case "box": return boxMesh(f.w, f.d, f.h)
    case "cylinder": return cylinderMesh(f.w / 2, f.h)
    case "cone": return cylinderMesh(f.w / 2, f.h, 24, 0.5)
    case "sphere": return sphereMesh(f.w / 2)
    case "prism": return prismMesh(f.w / 2, f.h, f.sides)
    case "torus": return torusMesh(f.w / 2, f.d / 2)
    case "revolve": return cylinderMesh(f.w / 2, f.h, 24, f.w / 2.6)
    default: return boxMesh(f.w, f.d, f.h)
  }
}

// ── Масс-центровочные характеристики (аналитические приближения) ───────────
export function volumeOf(f: Feature): number {
  // в мм³
  const r = f.w / 2
  switch (f.kind) {
    case "box": return f.w * f.d * f.h
    case "cylinder": return Math.PI * r * r * f.h
    case "cone": return (Math.PI * r * r * f.h) / 3 * 1.3
    case "sphere": return (4 / 3) * Math.PI * r ** 3
    case "prism": {
      const n = Math.max(3, f.sides)
      const area = 0.5 * n * r * r * Math.sin((2 * Math.PI) / n)
      return area * f.h
    }
    case "torus": return 2 * Math.PI ** 2 * (f.w / 2) * (f.d / 2) ** 2
    case "revolve": return Math.PI * r * r * f.h * 0.82
    default: return f.w * f.d * f.h
  }
}

export interface MassProps {
  volume: number      // см³
  mass: number        // кг
  area: number        // см² (приближённо)
  cog: Vec3           // центр тяжести, мм
  ix: number; iy: number; iz: number   // моменты инерции, кг·см²
}

export function massProps(features: Feature[]): MassProps {
  let volMm = 0, mass = 0, area = 0
  let cx = 0, cy = 0, cz = 0
  features.filter(f => f.visible).forEach(f => {
    const v = volumeOf(f)
    const dens = MATERIALS[f.material]?.density ?? 7850
    const m = (v / 1e9) * dens // кг
    volMm += v
    mass += m
    // площадь поверхности приближённо через объём
    area += Math.pow(v, 2 / 3) * 6
    cx += f.pos[0] * m; cy += f.pos[1] * m; cz += f.pos[2] * m
  })
  const cog: Vec3 = mass > 0 ? [cx / mass, cy / mass, cz / mass] : [0, 0, 0]
  const inertia = mass * 100 // упрощённо кг·см²
  return {
    volume: +(volMm / 1000).toFixed(2),
    mass: +mass.toFixed(3),
    area: +(area / 100).toFixed(1),
    cog: [+cog[0].toFixed(1), +cog[1].toFixed(1), +cog[2].toFixed(1)],
    ix: +(inertia * 1.0).toFixed(1), iy: +(inertia * 1.2).toFixed(1), iz: +(inertia * 0.9).toFixed(1),
  }
}

// ── Проекция 3D → 2D (орбитальная камера) ──────────────────────────────────
export function project(
  p: Vec3, offset: Vec3, yaw: number, pitch: number, scale: number, W: number, H: number
): { x: number; y: number; z: number } {
  const [px, py, pz] = [p[0] + offset[0], p[1] + offset[1], p[2] + offset[2]]
  // поворот вокруг Z (yaw)
  const cx = Math.cos(yaw), sx = Math.sin(yaw)
  const x1 = px * cx - py * sx
  const y1 = px * sx + py * cx
  const z1 = pz
  // поворот вокруг X (pitch)
  const cp = Math.cos(pitch), sp = Math.sin(pitch)
  const y2 = y1 * cp - z1 * sp
  const z2 = y1 * sp + z1 * cp
  return { x: W / 2 + x1 * scale, y: H / 2 - z2 * scale, z: y2 }
}

// ── Форматы обмена (метаданные для UI) ─────────────────────────────────────
export const EXCHANGE_3D = ["STEP (.step)", "Parasolid (.x_t)", "ACIS (.sat)", "IGES (.igs)", "STL (.stl)", "OBJ (.obj)", "JT (.jt)"]
export const EXCHANGE_2D = ["DWG (.dwg)", "DXF (.dxf)", "PDF (.pdf)"]
export const CAD_IMPORT = ["SolidWorks", "Autodesk Inventor", "Solid Edge", "Creo", "NX", "CATIA"]
