// ═══════════════════════════════════════════════════════════════════════════
// Действия функций на чертеже: превращают результат расчёта в реальные
// объекты холста (трассы, точки, линии, поверхности, трубы, ведомости).
// ═══════════════════════════════════════════════════════════════════════════

import type { CanvasObject } from "@/hooks/useProjectStore"
import {
  type P2, offsetLine, stationPoints, forwardGeo, curveElements,
  contourLevels, station, polyLength,
} from "./engCalc"

let seq = 0
const uid = (p: string) => `${p}_${Date.now().toString(36)}_${(seq++).toString(36)}`

export type BuildResult = { objects: CanvasObject[]; message: string }

/** Базовая точка вставки, если на чертеже пусто */
const ORIGIN: P2 = [0, 0]

/** Центр существующих объектов — чтобы новое строилось рядом с чертежом */
export const anchorOf = (objs: CanvasObject[]): P2 => {
  const pts = objs.flatMap(o => o.pts)
  if (!pts.length) return ORIGIN
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1])
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2]
}

const mkLine = (pts: P2[], label: string, color: string, layer: string, props: Record<string, string> = {}, type: CanvasObject["type"] = "polyline"): CanvasObject => ({
  id: uid("obj"), type, label, pts, color, lineWidth: 1.5, layer, properties: props,
})

const mkPoint = (p: P2, label: string, color: string, layer: string, props: Record<string, string> = {}): CanvasObject => ({
  id: uid("pt"), type: "point", label, pts: [p], color, layer, properties: props,
})

const mkText = (p: P2, text: string, color: string, layer: string): CanvasObject => ({
  id: uid("tx"), type: "text", label: text, text, pts: [p], color, layer, properties: {},
})

// ─── Геодезия ─────────────────────────────────────────────────────────────────

/** Точки COGO по ведомости координат */
export const buildPoints = (list: { x: number; y: number; z?: number; name?: string; code?: string }[], layer = "Точки"): BuildResult => ({
  objects: list.map((p, i) => ({
    ...mkPoint([p.x, p.y], p.name || `${i + 1}`, "#f59e0b", layer, {
      "X": p.x.toFixed(3), "Y": p.y.toFixed(3), "H": (p.z ?? 0).toFixed(3),
      "Код": p.code || "", "Тип": "Точка COGO",
    }),
    z: p.z ?? 0,
  })),
  message: `Создано точек: ${list.length}`,
})

/** Теодолитный ход: замкнутый контур + точки станций */
export const buildTraverse = (pts: P2[], layer = "Геодезия"): BuildResult => {
  const objs: CanvasObject[] = [
    mkLine([...pts, pts[0]], "Теодолитный ход", "#14b8a6", layer, { "Тип": "Ход", "Станций": String(pts.length) }),
    ...pts.map((p, i) => mkPoint(p, `Ст.${i + 1}`, "#14b8a6", layer, { "Тип": "Станция", "X": p[0].toFixed(3), "Y": p[1].toFixed(3) })),
  ]
  return { objects: objs, message: `Ход построен: ${pts.length} станций` }
}

/** Разбивка по дир. углу и расстоянию (прямая задача) */
export const buildFromBearing = (from: P2, bearingDeg: number, dist: number, layer = "Разбивка"): BuildResult => {
  const to = forwardGeo(from, bearingDeg, dist)
  return {
    objects: [
      mkLine([from, to], `Вынос ${dist.toFixed(2)} м`, "#22d3ee", layer, { "Дир. угол": bearingDeg.toFixed(4) + "°", "Расстояние": dist.toFixed(3) + " м" }, "line"),
      mkPoint(to, "Вынесенная точка", "#f59e0b", layer, { "X": to[0].toFixed(3), "Y": to[1].toFixed(3) }),
    ],
    message: `Точка вынесена на ${dist.toFixed(2)} м`,
  }
}

// ─── Дороги и трассы ──────────────────────────────────────────────────────────

/** Трасса с пикетажем */
export const buildAlignment = (pts: P2[], name = "Трасса", step = 100, layer = "Трассы"): BuildResult => {
  const marks = stationPoints(pts, step)
  const objs: CanvasObject[] = [
    mkLine(pts, name, "#f97316", layer, { "Тип": "Трасса", "Длина": polyLength(pts).toFixed(2) + " м" }, "alignment"),
    ...marks.map(m => mkPoint(m.p, station(m.s), "#fb923c", layer, { "Тип": "Пикет", "Пикетаж": station(m.s) })),
  ]
  return { objects: objs, message: `Трасса ${polyLength(pts).toFixed(1)} м, пикетов: ${marks.length}` }
}

/** Кромки проезжей части по оси */
export const buildRoadEdges = (axis: P2[], width: number, layer = "Дороги"): BuildResult => {
  const half = width / 2
  return {
    objects: [
      mkLine(offsetLine(axis, half), `Кромка левая +${half} м`, "#22c55e", layer, { "Смещение": `+${half} м` }),
      mkLine(offsetLine(axis, -half), `Кромка правая −${half} м`, "#22c55e", layer, { "Смещение": `-${half} м` }),
    ],
    message: `Кромки построены, ширина ${width} м`,
  }
}

/** Коридор: ось, кромки, откосы (линии выхода на рельеф) */
export const buildCorridor = (axis: P2[], width: number, slopeW: number, layer = "Коридор"): BuildResult => {
  const h = width / 2
  return {
    objects: [
      mkLine(axis, "Ось коридора", "#f97316", layer, { "Тип": "Ось" }, "corridor"),
      mkLine(offsetLine(axis, h), "Кромка ЛЕВ", "#22c55e", layer, {}),
      mkLine(offsetLine(axis, -h), "Кромка ПРАВ", "#22c55e", layer, {}),
      mkLine(offsetLine(axis, h + slopeW), "Откос ЛЕВ (выход на рельеф)", "#a3a3a3", layer, {}),
      mkLine(offsetLine(axis, -(h + slopeW)), "Откос ПРАВ (выход на рельеф)", "#a3a3a3", layer, {}),
    ],
    message: `Коридор: полотно ${width} м + откосы ${slopeW} м`,
  }
}

/** Круговая кривая в плане по вершине угла */
export const buildCurve = (vertex: P2, b1: number, b2: number, R: number, layer = "Трассы"): BuildResult => {
  const angle = ((b2 - b1 + 540) % 360) - 180
  const e = curveElements(angle, R)
  const nz = e.T
  const pNZ = forwardGeo(vertex, (b1 + 180) % 360, nz)
  const pKZ = forwardGeo(vertex, b2, nz)
  const steps = 24
  const arc: P2[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const br = b1 + angle * t
    arc.push(forwardGeo(pNZ, br, (e.K * t)))
  }
  return {
    objects: [
      mkLine(arc, `Кривая R=${R} м`, "#f97316", layer, {
        "Радиус": R.toFixed(0) + " м", "Угол поворота": Math.abs(angle).toFixed(4) + "°",
        "Тангенс T": e.T.toFixed(2) + " м", "Длина K": e.K.toFixed(2) + " м",
        "Биссектриса Б": e.B.toFixed(2) + " м", "Домер Д": e.D.toFixed(2) + " м",
      }, "arc"),
      mkPoint(pNZ, "НК (начало кривой)", "#fb923c", layer, {}),
      mkPoint(vertex, "ВУ (вершина угла)", "#ef4444", layer, {}),
      mkPoint(pKZ, "КК (конец кривой)", "#fb923c", layer, {}),
    ],
    message: `Кривая R=${R} м, K=${e.K.toFixed(1)} м, T=${e.T.toFixed(1)} м`,
  }
}

// ─── Поверхности и рельеф ─────────────────────────────────────────────────────

/** Горизонтали рельефа с заданным сечением */
export const buildContours = (center: P2, minZ: number, maxZ: number, step: number, size = 200, layer = "Горизонтали"): BuildResult => {
  const levels = contourLevels(minZ, maxZ, step)
  const objs = levels.map((z, i) => {
    const r = (size / 2) * (1 - i / Math.max(levels.length, 1)) + 8
    const pts: P2[] = []
    for (let a = 0; a <= 360; a += 15) {
      const rad = (a * Math.PI) / 180
      const wob = 1 + 0.12 * Math.sin(rad * 3 + i)
      pts.push([center[0] + Math.cos(rad) * r * wob, center[1] + Math.sin(rad) * r * wob])
    }
    const major = Math.abs(z % (step * 5)) < 1e-6
    return mkLine(pts, `Горизонталь ${z.toFixed(2)}`, major ? "#16a34a" : "#4ade80", layer, {
      "Отметка": z.toFixed(2) + " м", "Тип": major ? "Утолщённая" : "Основная",
    })
  })
  return { objects: objs, message: `Горизонталей: ${levels.length}, сечение ${step} м` }
}

/** Граница поверхности / участка работ */
export const buildBoundary = (pts: P2[], name: string, layer = "Границы"): BuildResult => ({
  objects: [mkLine([...pts, pts[0]], name, "#10b981", layer, { "Тип": "Граница" }, "surface")],
  message: `Граница «${name}» построена`,
})

/** Сетка квадратов для картограммы земляных масс */
export const buildEarthworkGrid = (origin: P2, cols: number, rows: number, a: number, layer = "Картограмма"): BuildResult => {
  const objs: CanvasObject[] = []
  for (let i = 0; i <= cols; i++)
    objs.push(mkLine([[origin[0] + i * a, origin[1]], [origin[0] + i * a, origin[1] + rows * a]], `Сетка V${i}`, "#64748b", layer, {}, "line"))
  for (let j = 0; j <= rows; j++)
    objs.push(mkLine([[origin[0], origin[1] + j * a], [origin[0] + cols * a, origin[1] + j * a]], `Сетка H${j}`, "#64748b", layer, {}, "line"))
  return { objects: objs, message: `Сетка ${cols}×${rows}, сторона ${a} м` }
}

// ─── Инженерные сети ──────────────────────────────────────────────────────────

/** Трубопровод с колодцами */
export const buildPipeline = (pts: P2[], D: number, material: string, slope: number, layer = "Сети"): BuildResult => {
  const objs: CanvasObject[] = [
    mkLine(pts, `Труба Ø${(D * 1000).toFixed(0)} ${material}`, "#3b82f6", layer, {
      "Диаметр": (D * 1000).toFixed(0) + " мм", "Материал": material,
      "Уклон": (slope * 1000).toFixed(1) + " ‰", "Длина": polyLength(pts).toFixed(2) + " м",
    }, "pipe"),
    ...pts.map((p, i) => mkPoint(p, `К-${i + 1}`, "#60a5fa", layer, { "Тип": "Колодец", "№": String(i + 1) })),
  ]
  return { objects: objs, message: `Сеть ${polyLength(pts).toFixed(1)} м, колодцев: ${pts.length}` }
}

// ─── Документация ─────────────────────────────────────────────────────────────

/** Рамки листов вдоль трассы */
export const buildSheets = (axis: P2[], count: number, w: number, h: number, layer = "Листы"): BuildResult => {
  const marks = stationPoints(axis, Math.max(polyLength(axis) / Math.max(count, 1), 1))
  const objs = marks.slice(0, count).map((m, i) =>
    mkLine([
      [m.p[0] - w / 2, m.p[1] - h / 2], [m.p[0] + w / 2, m.p[1] - h / 2],
      [m.p[0] + w / 2, m.p[1] + h / 2], [m.p[0] - w / 2, m.p[1] + h / 2],
      [m.p[0] - w / 2, m.p[1] - h / 2],
    ], `Лист ${i + 1}`, "#e11d48", layer, { "Лист": String(i + 1), "Пикетаж": station(m.s) }, "rect"))
  return { objects: objs, message: `Рамок листов: ${objs.length}` }
}

/** Текстовая ведомость на чертеже */
export const buildTable = (at: P2, title: string, rows: { label: string; value: string }[], layer = "Ведомости"): BuildResult => {
  const objs: CanvasObject[] = [mkText(at, title, "#ffffff", layer)]
  rows.forEach((r, i) => objs.push(mkText([at[0], at[1] - (i + 1) * 6], `${r.label}: ${r.value}`, "#cbd5e1", layer)))
  return { objects: objs, message: `Ведомость «${title}» размещена` }
}

// ─── Базовые примитивы черчения ───────────────────────────────────────────────

/** Отрезок по координатам */
export const buildSegment = (a: P2, b: P2, layer = "0"): BuildResult => ({
  objects: [mkLine([a, b], `Отрезок ${Math.hypot(b[0] - a[0], b[1] - a[1]).toFixed(2)}`, "#22d3ee", layer, {
    "Длина": Math.hypot(b[0] - a[0], b[1] - a[1]).toFixed(3),
    "Начало": `${a[0].toFixed(2)}, ${a[1].toFixed(2)}`,
    "Конец": `${b[0].toFixed(2)}, ${b[1].toFixed(2)}`,
  }, "line")],
  message: `Отрезок ${Math.hypot(b[0] - a[0], b[1] - a[1]).toFixed(2)} построен`,
})

/** Окружность */
export const buildCircle = (c: P2, r: number, layer = "0"): BuildResult => {
  const pts: P2[] = []
  for (let a = 0; a <= 360; a += 6) {
    const t = (a * Math.PI) / 180
    pts.push([c[0] + Math.cos(t) * r, c[1] + Math.sin(t) * r])
  }
  const o = mkLine(pts, `Круг R=${r}`, "#22d3ee", layer, {
    "Радиус": r.toFixed(3), "Длина окружности": (2 * Math.PI * r).toFixed(3),
    "Площадь": (Math.PI * r * r).toFixed(3),
  }, "circle")
  o.radius = r
  return { objects: [o], message: `Окружность R=${r} построена` }
}

/** Прямоугольник */
export const buildRect = (c: P2, w: number, h: number, layer = "0"): BuildResult => ({
  objects: [mkLine([
    [c[0] - w / 2, c[1] - h / 2], [c[0] + w / 2, c[1] - h / 2],
    [c[0] + w / 2, c[1] + h / 2], [c[0] - w / 2, c[1] + h / 2],
    [c[0] - w / 2, c[1] - h / 2],
  ], `Прямоугольник ${w}×${h}`, "#22d3ee", layer, {
    "Ширина": w.toFixed(2), "Высота": h.toFixed(2),
    "Площадь": (w * h).toFixed(2), "Периметр": (2 * (w + h)).toFixed(2),
  }, "rect")],
  message: `Прямоугольник ${w}×${h} построен`,
})

/** Правильный многоугольник */
export const buildPolygon = (c: P2, n: number, r: number, layer = "0"): BuildResult => {
  const k = Math.max(3, Math.round(n))
  const pts: P2[] = []
  for (let i = 0; i <= k; i++) {
    const t = (i / k) * 2 * Math.PI - Math.PI / 2
    pts.push([c[0] + Math.cos(t) * r, c[1] + Math.sin(t) * r])
  }
  const side = 2 * r * Math.sin(Math.PI / k)
  return {
    objects: [mkLine(pts, `${k}-угольник`, "#22d3ee", layer, {
      "Сторон": String(k), "Радиус описанной": r.toFixed(3),
      "Длина стороны": side.toFixed(3),
      "Площадь": ((k * side * r * Math.cos(Math.PI / k)) / 2).toFixed(3),
    })],
    message: `Правильный ${k}-угольник построен`,
  }
}

/** Прямоугольный массив объектов (точками) */
export const buildArray = (c: P2, rows: number, cols: number, dr: number, dc: number, layer = "0"): BuildResult => {
  const R = Math.max(1, Math.round(rows)), C = Math.max(1, Math.round(cols))
  const objs: CanvasObject[] = []
  const x0 = c[0] - ((C - 1) * dc) / 2, y0 = c[1] - ((R - 1) * dr) / 2
  for (let i = 0; i < R; i++)
    for (let j = 0; j < C; j++)
      objs.push(mkPoint([x0 + j * dc, y0 + i * dr], `Э${i + 1}-${j + 1}`, "#f59e0b", layer, {
        "Строка": String(i + 1), "Столбец": String(j + 1),
      }))
  return { objects: objs, message: `Массив ${R}×${C}: ${objs.length} элементов` }
}

/** Концентрические подобия контура */
export const buildOffsets = (base: P2[], dist: number, count: number, layer = "0"): BuildResult => {
  const objs: CanvasObject[] = []
  for (let k = 1; k <= Math.max(1, Math.round(count)); k++)
    objs.push(mkLine(base.map((p, i) => {
      const a = base[Math.max(i - 1, 0)], b = base[Math.min(i + 1, base.length - 1)]
      const dx = b[0] - a[0], dy = b[1] - a[1]
      const L = Math.hypot(dx, dy) || 1
      return [p[0] + (dy / L) * dist * k, p[1] - (dx / L) * dist * k] as P2
    }), `Подобие ${k} (${(dist * k).toFixed(1)})`, "#7c3aed", layer, { "Смещение": (dist * k).toFixed(3) }))
  return { objects: objs, message: `Создано подобий: ${objs.length}` }
}

/** Выноска с подписью */
export const buildLabel = (at: P2, text: string, layer = "Аннотации"): BuildResult => ({
  objects: [
    mkLine([at, [at[0] + 14, at[1] + 10]], "Выноска", "#059669", layer, {}, "line"),
    mkText([at[0] + 15, at[1] + 11], text, "#34d399", layer),
  ],
  message: `Подпись добавлена: ${text}`,
})