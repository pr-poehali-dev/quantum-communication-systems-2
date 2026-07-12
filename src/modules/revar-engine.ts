// ── BIM-движок для Revar (Revit + ArchiCAD 2-в-1) ──────────────────────────

export type Discipline = "arch" | "struct" | "mep"
export type ElemKind =
  | "wall" | "curtain" | "slab" | "roof" | "column" | "beam"
  | "door" | "window" | "stair" | "railing" | "furniture" | "morph"
  | "duct" | "pipe" | "cable" | "fixture" | "terrain"

export interface BimElement {
  id: number
  kind: ElemKind
  name: string
  discipline: Discipline
  level: number             // индекс этажа
  x: number; y: number      // положение / начало (мм в плане, масштаб условный)
  x2?: number; y2?: number  // конец (для линейных: стены, балки, трубы)
  w?: number                // толщина / ширина
  h?: number                // высота элемента (мм)
  material: string
  color: string
  layers?: number           // кол-во слоёв (многослойная стена)
  hostId?: number           // окна/двери привязаны к стене
}

export interface Level {
  id: number
  name: string
  elevation: number         // отметка, мм
}

export interface Discipl { id: Discipline; ru: string; icon: string; color: string }

export const DISCIPLINES: Discipl[] = [
  { id: "arch", ru: "Архитектура", icon: "Building2", color: "#2563eb" },
  { id: "struct", ru: "Конструкции", icon: "Frame", color: "#e11d48" },
  { id: "mep", ru: "Инженерия (ОВК/ВК/ЭОМ)", icon: "Waves", color: "#059669" },
]

// Библиотека семейств / элементов (как в Revit families / ArchiCAD library)
export interface FamilyDef { kind: ElemKind; name: string; icon: string; discipline: Discipline; w: number; h: number; material: string; color: string; linear?: boolean; hosted?: boolean }

export const FAMILIES: FamilyDef[] = [
  // Архитектура
  { kind: "wall", name: "Стена (многослойная)", icon: "Square", discipline: "arch", w: 250, h: 3000, material: "brick", color: "#c8a27a", linear: true },
  { kind: "wall", name: "Стена из бруса", icon: "Square", discipline: "arch", w: 200, h: 3000, material: "wood", color: "#b5793a", linear: true },
  { kind: "curtain", name: "Навесная стена", icon: "PanelsTopLeft", discipline: "arch", w: 80, h: 3000, material: "glass", color: "#7fd4e8", linear: true },
  { kind: "slab", name: "Перекрытие", icon: "RectangleHorizontal", discipline: "arch", w: 200, h: 200, material: "concrete", color: "#9aa2ac" },
  { kind: "roof", name: "Крыша", icon: "Triangle", discipline: "arch", w: 300, h: 300, material: "metal", color: "#8896a6" },
  { kind: "door", name: "Дверь", icon: "DoorOpen", discipline: "arch", w: 900, h: 2100, material: "wood", color: "#7a5230", hosted: true },
  { kind: "window", name: "Окно", icon: "AppWindow", discipline: "arch", w: 1200, h: 1400, material: "glass", color: "#8fd0e6", hosted: true },
  { kind: "stair", name: "Лестница (StairMAKER)", icon: "Footprints", discipline: "arch", w: 1200, h: 3000, material: "concrete", color: "#a6adb6" },
  { kind: "railing", name: "Ограждение", icon: "Fence", discipline: "arch", w: 60, h: 1000, material: "metal", color: "#7f8b99", linear: true },
  { kind: "furniture", name: "Мебель", icon: "Armchair", discipline: "arch", w: 700, h: 800, material: "wood", color: "#9c6b3f" },
  { kind: "morph", name: "MORPH (свободная форма)", icon: "Blend", discipline: "arch", w: 600, h: 600, material: "concrete", color: "#b48ee0" },
  { kind: "terrain", name: "3D-сетка (геоподоснова)", icon: "Mountain", discipline: "arch", w: 4000, h: 100, material: "ground", color: "#8fae6b" },
  // Конструкции
  { kind: "column", name: "Колонна", icon: "Columns3", discipline: "struct", w: 400, h: 3000, material: "concrete", color: "#8a929c" },
  { kind: "beam", name: "Балка", icon: "Minus", discipline: "struct", w: 300, h: 500, material: "steel", color: "#5c6b7a", linear: true },
  // MEP
  { kind: "duct", name: "Воздуховод (ОВК)", icon: "Wind", discipline: "mep", w: 300, h: 300, material: "steel", color: "#f59e0b", linear: true },
  { kind: "pipe", name: "Труба (ВК)", icon: "Waypoints", discipline: "mep", w: 100, h: 100, material: "steel", color: "#06b6d4", linear: true },
  { kind: "cable", name: "Кабель-лоток (ЭОМ)", icon: "Cable", discipline: "mep", w: 150, h: 80, material: "metal", color: "#a855f7", linear: true },
  { kind: "fixture", name: "Сантех-прибор", icon: "Bath", discipline: "mep", w: 500, h: 400, material: "ceramic", color: "#e2e8f0" },
]

export const MATERIALS_BIM: Record<string, { ru: string; color: string; density: number }> = {
  brick: { ru: "Кирпич", color: "#c8a27a", density: 1800 },
  concrete: { ru: "Бетон", color: "#9aa2ac", density: 2400 },
  wood: { ru: "Дерево", color: "#b5793a", density: 600 },
  steel: { ru: "Сталь", color: "#5c6b7a", density: 7850 },
  metal: { ru: "Металл", color: "#8896a6", density: 7000 },
  glass: { ru: "Стекло", color: "#8fd0e6", density: 2500 },
  ceramic: { ru: "Керамика", color: "#e2e8f0", density: 2300 },
  ground: { ru: "Грунт", color: "#8fae6b", density: 1600 },
}

export const IFC_FORMATS = ["IFC 4 (.ifc)", "3DM Rhino (.3dm)", "SketchUp (.skp)", "OBJ (.obj)", "STEP (.step)", "DWG (.dwg)"]

// Длина линейного элемента (в метрах)
export function elemLength(e: BimElement): number {
  if (e.x2 === undefined || e.y2 === undefined) return 0
  return +(Math.hypot(e.x2 - e.x, e.y2 - e.y) / 1000).toFixed(2)
}

// Спецификация: агрегируем по типам
export interface ScheduleRow { name: string; kind: string; count: number; qty: string; material: string }
export function buildSchedule(elems: BimElement[]): ScheduleRow[] {
  const map = new Map<string, ScheduleRow & { _q: number }>()
  elems.forEach(e => {
    const key = e.name
    const linear = e.x2 !== undefined
    const q = linear ? elemLength(e) : 1
    const cur = map.get(key)
    if (cur) { cur.count++; cur._q += q }
    else map.set(key, { name: e.name, kind: e.kind, count: 1, qty: "", material: MATERIALS_BIM[e.material]?.ru ?? e.material, _q: q })
  })
  return [...map.values()].map(r => {
    const linear = ["wall", "beam", "duct", "pipe", "cable", "curtain", "railing"].includes(r.kind)
    return { name: r.name, kind: r.kind, count: r.count, material: r.material, qty: linear ? `${r._q.toFixed(1)} м` : `${r.count} шт` }
  })
}

// Оценки для анализа
export function analyzeBuilding(elems: BimElement[], levels: Level[]) {
  const walls = elems.filter(e => e.kind === "wall" || e.kind === "curtain")
  const windows = elems.filter(e => e.kind === "window")
  const wallLen = walls.reduce((s, e) => s + elemLength(e), 0)
  const floorArea = +(estimateFootprint(elems) / 1e6).toFixed(1)  // м²
  const totalArea = +(floorArea * levels.length).toFixed(1)
  const winArea = windows.length * 1.68
  const glazingRatio = wallLen > 0 ? Math.min(60, Math.round((winArea / (wallLen * 3)) * 100)) : 0
  return {
    footprint: floorArea,
    totalArea,
    wallLength: +wallLen.toFixed(1),
    windows: windows.length,
    glazingRatio,
    // энергетика (условные модели)
    heatLoss: Math.round(totalArea * 55 + winArea * 120),        // Вт
    energyClass: glazingRatio > 45 ? "C" : glazingRatio > 25 ? "B" : "A",
    insolation: Math.max(1.5, +(windows.length * 0.6).toFixed(1)),// ч/сут
    evacTime: +(Math.sqrt(totalArea) * 0.9 / (levels.length || 1) + 0.5).toFixed(1), // мин
    co2: Math.round(totalArea * 12),                             // кг CO2/год условно
  }
}

function estimateFootprint(elems: BimElement[]): number {
  // грубая площадь по габаритам плановых точек, мм²
  const pts: [number, number][] = []
  elems.forEach(e => { pts.push([e.x, e.y]); if (e.x2 !== undefined) pts.push([e.x2, e.y2!]) })
  if (pts.length < 3) return 40000 * 1000
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1])
  return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys)) || 40000 * 1000
}
