// ═══════════════════════════════════════════════════════════════════════════
// Рабочие расчёты и построения для базовых команд черчения, редактирования,
// аннотаций, слоёв, блоков и печати (направление «Документация и вывод»).
// Каждая функция реально считает геометрию и строит объекты на чертеже.
// ═══════════════════════════════════════════════════════════════════════════

import type { CanvasObject } from "@/hooks/useProjectStore"
import type { Upgrade } from "./versions-upgrades"
import {
  num, fx, fmtBig, polyArea, polyLength, bearing, dms, offsetLine,
  curveElements, SHEETS, scaleFactor, type P2,
} from "@/utils/engCalc"

let seq = 0
const uid = (p: string) => `${p}_${Date.now().toString(36)}_${(seq++).toString(36)}`

const mk = (
  type: CanvasObject["type"], pts: P2[], label: string, color: string,
  layer: string, props: Record<string, string> = {},
): CanvasObject => ({ id: uid("o"), type, label, pts, color, lineWidth: 1.5, layer, properties: props })

const mkTx = (at: P2, text: string, color = "#e5e7eb", layer = "Аннотации"): CanvasObject =>
  ({ id: uid("t"), type: "text", label: text, text, pts: [at], color, layer, properties: {} })

const f = (key: string, label: string, def: string, suffix?: string) =>
  ({ key, label, type: "number" as const, default: def, suffix })
const txt = (key: string, label: string, def: string) =>
  ({ key, label, type: "text" as const, default: def })
const sel = (key: string, label: string, def: string, options: string[]) =>
  ({ key, label, type: "select" as const, default: def, options })

/** Правильный многоугольник */
const regularPoly = (c: P2, n: number, r: number, rot = 0): P2[] => {
  const pts: P2[] = []
  for (let i = 0; i < n; i++) {
    const a = rot + (i * 2 * Math.PI) / n
    pts.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r])
  }
  return pts
}

/** Аппроксимация окружности полилинией */
const circlePts = (c: P2, r: number, seg = 64): P2[] => regularPoly(c, seg, r)

/** Дуга по центру, радиусу и углам (в градусах) */
const arcPts = (c: P2, r: number, a1: number, a2: number, seg = 48): P2[] => {
  const pts: P2[] = []
  const s = (a1 * Math.PI) / 180, e = (a2 * Math.PI) / 180
  for (let i = 0; i <= seg; i++) {
    const t = s + ((e - s) * i) / seg
    pts.push([c[0] + Math.cos(t) * r, c[1] + Math.sin(t) * r])
  }
  return pts
}

const rectPts = (a: P2, w: number, h: number): P2[] =>
  [[a[0], a[1]], [a[0] + w, a[1]], [a[0] + w, a[1] + h], [a[0], a[1] + h], [a[0], a[1]]]

// ─── ЧЕРЧЕНИЕ ────────────────────────────────────────────────────────────────

export const drawingUpgrades: Record<string, Upgrade> = {

  // Отрезок: длина, дирекционный угол, румб
  "acad-draw-line": {
    outputLabel: "Геометрия отрезка",
    fields: [f("x1", "X начала", "0"), f("y1", "Y начала", "0"), f("x2", "X конца", "100"), f("y2", "Y конца", "50")],
    compute: v => {
      const a: P2 = [num(v.x1), num(v.y1)], b: P2 = [num(v.x2), num(v.y2)]
      const dx = b[0] - a[0], dy = b[1] - a[1]
      const L = Math.hypot(dx, dy), br = bearing(a, b)
      return [
        { label: "Длина", value: `${fx(L, 3)} м` },
        { label: "Дирекционный угол", value: dms(br) },
        { label: "Приращение ΔX / ΔY", value: `${fx(dx, 3)} / ${fx(dy, 3)} м` },
        { label: "Уклон", value: L > 0 ? `${fx((dy / L) * 100, 2)} %` : "—" },
      ]
    },
    buildLabel: "Начертить отрезок",
    build: v => {
      const a: P2 = [num(v.x1), num(v.y1)], b: P2 = [num(v.x2), num(v.y2)]
      const L = Math.hypot(b[0] - a[0], b[1] - a[1])
      return {
        objects: [mk("line", [a, b], `Отрезок ${fx(L, 2)} м`, "#22d3ee", "0",
          { "Длина": fx(L, 3) + " м", "Дир. угол": dms(bearing(a, b)) })],
        message: `Отрезок ${fx(L, 2)} м построен`,
      }
    },
  },

  // Полилиния по списку вершин
  "acad-draw-pline": {
    outputLabel: "Геометрия полилинии",
    fields: [txt("pts", "Вершины «x,y; x,y»", "0,0; 60,10; 120,-15; 180,25"), sel("closed", "Замкнуть", "Нет", ["Нет", "Да"])],
    compute: v => {
      const pts = parseXY(v.pts)
      const closed = v.closed === "Да"
      const ring = closed && pts.length > 2 ? [...pts, pts[0]] : pts
      const L = polyLength(ring)
      return [
        { label: "Вершин", value: `${pts.length}` },
        { label: "Длина", value: `${fx(L, 3)} м` },
        { label: "Площадь", value: closed && pts.length > 2 ? `${fmtBig(Math.abs(polyArea(pts)), 2)} м²` : "контур не замкнут" },
      ]
    },
    buildLabel: "Начертить полилинию",
    build: v => {
      const pts = parseXY(v.pts)
      if (pts.length < 2) return { objects: [], message: "Нужно минимум 2 вершины" }
      const ring = v.closed === "Да" ? [...pts, pts[0]] : pts
      return {
        objects: [mk("polyline", ring, "Полилиния", "#22d3ee", "0",
          { "Вершин": String(pts.length), "Длина": fx(polyLength(ring), 3) + " м" })],
        message: `Полилиния из ${pts.length} вершин построена`,
      }
    },
  },

  // Круг
  "acad-draw-circle": {
    outputLabel: "Параметры круга",
    fields: [f("r", "Радиус", "25", "м"), f("cx", "X центра", "0"), f("cy", "Y центра", "0")],
    compute: v => {
      const r = num(v.r)
      return [
        { label: "Длина окружности", value: `${fx(2 * Math.PI * r, 3)} м` },
        { label: "Площадь", value: `${fmtBig(Math.PI * r * r, 2)} м²` },
        { label: "Диаметр", value: `${fx(2 * r, 3)} м` },
      ]
    },
    buildLabel: "Начертить круг",
    build: (v, anchor) => {
      const r = num(v.r)
      if (r <= 0) return { objects: [], message: "Радиус должен быть больше нуля" }
      const c: P2 = [num(v.cx) || anchor[0], num(v.cy) || anchor[1]]
      return {
        objects: [mk("polyline", circlePts(c, r), `Круг R=${fx(r, 2)}`, "#22d3ee", "0",
          { "Радиус": fx(r, 3) + " м", "Площадь": fx(Math.PI * r * r, 2) + " м²" })],
        message: `Круг R=${fx(r, 2)} м построен`,
      }
    },
  },

  // Дуга
  "acad-draw-arc": {
    outputLabel: "Параметры дуги",
    fields: [f("r", "Радиус", "50", "м"), f("a1", "Начальный угол", "0", "°"), f("a2", "Конечный угол", "90", "°")],
    compute: v => {
      const r = num(v.r), da = Math.abs(num(v.a2) - num(v.a1))
      const L = (Math.PI * r * da) / 180
      const chord = 2 * r * Math.sin((da * Math.PI) / 360)
      return [
        { label: "Длина дуги", value: `${fx(L, 3)} м` },
        { label: "Хорда", value: `${fx(chord, 3)} м` },
        { label: "Стрелка (биссектриса)", value: `${fx(r - Math.sqrt(Math.max(r * r - (chord / 2) ** 2, 0)), 3)} м` },
        { label: "Центральный угол", value: `${fx(da, 2)}°` },
      ]
    },
    buildLabel: "Начертить дугу",
    build: (v, anchor) => {
      const r = num(v.r)
      if (r <= 0) return { objects: [], message: "Радиус должен быть больше нуля" }
      const pts = arcPts(anchor, r, num(v.a1), num(v.a2))
      return {
        objects: [mk("arc", pts, `Дуга R=${fx(r, 2)}`, "#22d3ee", "0",
          { "Радиус": fx(r, 3) + " м", "Угол": fx(Math.abs(num(v.a2) - num(v.a1)), 2) + "°" })],
        message: `Дуга R=${fx(r, 2)} м построена`,
      }
    },
  },

  // Прямоугольник
  "acad-draw-rectangle": {
    outputLabel: "Параметры прямоугольника",
    fields: [f("w", "Ширина", "120", "м"), f("h", "Высота", "80", "м")],
    compute: v => {
      const w = num(v.w), h = num(v.h)
      return [
        { label: "Площадь", value: `${fmtBig(w * h, 2)} м²` },
        { label: "Периметр", value: `${fx(2 * (w + h), 2)} м` },
        { label: "Диагональ", value: `${fx(Math.hypot(w, h), 3)} м` },
      ]
    },
    buildLabel: "Начертить прямоугольник",
    build: (v, anchor) => {
      const w = num(v.w), h = num(v.h)
      if (w <= 0 || h <= 0) return { objects: [], message: "Размеры должны быть больше нуля" }
      const a: P2 = [anchor[0] - w / 2, anchor[1] - h / 2]
      return {
        objects: [mk("rect", rectPts(a, w, h), `Прямоугольник ${fx(w, 1)}×${fx(h, 1)}`, "#22d3ee", "0",
          { "Площадь": fx(w * h, 2) + " м²", "Периметр": fx(2 * (w + h), 2) + " м" })],
        message: `Прямоугольник ${fx(w, 1)}×${fx(h, 1)} м построен`,
      }
    },
  },

  // Многоугольник
  "acad-draw-polygon": {
    outputLabel: "Параметры многоугольника",
    fields: [f("n", "Число сторон", "6"), f("r", "Радиус описанной окр.", "50", "м")],
    compute: v => {
      const n = Math.max(3, Math.round(num(v.n))), R = num(v.r)
      const side = 2 * R * Math.sin(Math.PI / n)
      const apothem = R * Math.cos(Math.PI / n)
      const area = (n * side * apothem) / 2
      return [
        { label: "Длина стороны", value: `${fx(side, 3)} м` },
        { label: "Апофема", value: `${fx(apothem, 3)} м` },
        { label: "Площадь", value: `${fmtBig(area, 2)} м²` },
        { label: "Периметр", value: `${fx(n * side, 2)} м` },
      ]
    },
    buildLabel: "Начертить многоугольник",
    build: (v, anchor) => {
      const n = Math.max(3, Math.round(num(v.n))), R = num(v.r)
      if (R <= 0) return { objects: [], message: "Радиус должен быть больше нуля" }
      const pts = regularPoly(anchor, n, R, Math.PI / 2)
      return {
        objects: [mk("polyline", [...pts, pts[0]], `${n}-угольник`, "#22d3ee", "0",
          { "Сторон": String(n), "Радиус": fx(R, 2) + " м" })],
        message: `Правильный ${n}-угольник построен`,
      }
    },
  },

  // Подобие (Offset)
  "acad-draw-offset": {
    outputLabel: "Смещённые контуры",
    fields: [txt("pts", "Исходный контур «x,y; …»", "0,0; 80,0; 140,40; 200,40"), f("dist", "Расстояние", "10", "м"), f("n", "Число копий", "3")],
    compute: v => {
      const pts = parseXY(v.pts), d = num(v.dist), n = Math.max(1, Math.round(num(v.n)))
      return [
        { label: "Создано копий", value: `${n}` },
        { label: "Крайнее смещение", value: `${fx(d * n, 2)} м` },
        { label: "Длина исходного контура", value: `${fx(polyLength(pts), 2)} м` },
      ]
    },
    buildLabel: "Построить смещения",
    build: v => {
      const pts = parseXY(v.pts), d = num(v.dist), n = Math.max(1, Math.round(num(v.n)))
      if (pts.length < 2) return { objects: [], message: "Нужно минимум 2 вершины" }
      const objs: CanvasObject[] = [mk("polyline", pts, "Исходный контур", "#6b7280", "0", { "Тип": "Оригинал" })]
      for (let i = 1; i <= n; i++) {
        objs.push(mk("polyline", offsetLine(pts, d * i), `Смещение ${fx(d * i, 2)} м`, "#22d3ee", "0",
          { "Смещение": fx(d * i, 3) + " м" }))
      }
      return { objects: objs, message: `Построено смещений: ${n}` }
    },
  },

  // Массив
  "acad-draw-array": {
    outputLabel: "Параметры массива",
    fields: [sel("kind", "Тип массива", "Прямоугольный", ["Прямоугольный", "Круговой"]),
      f("cols", "Столбцов / элементов", "5"), f("rows", "Строк", "3"),
      f("dx", "Шаг по X / радиус", "20", "м"), f("dy", "Шаг по Y", "15", "м")],
    compute: v => {
      const круговой = v.kind === "Круговой"
      const c = Math.max(1, Math.round(num(v.cols))), r = Math.max(1, Math.round(num(v.rows)))
      const total = круговой ? c : c * r
      return [
        { label: "Всего элементов", value: `${total}` },
        круговой
          ? { label: "Угол между элементами", value: `${fx(360 / c, 3)}°` }
          : { label: "Габарит массива", value: `${fx((c - 1) * num(v.dx), 2)} × ${fx((r - 1) * num(v.dy), 2)} м` },
      ]
    },
    buildLabel: "Построить массив",
    build: (v, anchor) => {
      const круговой = v.kind === "Круговой"
      const c = Math.max(1, Math.round(num(v.cols))), r = Math.max(1, Math.round(num(v.rows)))
      const objs: CanvasObject[] = []
      if (круговой) {
        const R = num(v.dx) || 40
        for (let i = 0; i < c; i++) {
          const a = (i * 2 * Math.PI) / c
          const p: P2 = [anchor[0] + Math.cos(a) * R, anchor[1] + Math.sin(a) * R]
          objs.push(mk("point", [p], `Эл.${i + 1}`, "#f59e0b", "0", { "Угол": fx((i * 360) / c, 2) + "°" }))
        }
        objs.push(mk("polyline", circlePts(anchor, R), "Круговой массив", "#6b7280", "0", { "Элементов": String(c) }))
      } else {
        const dx = num(v.dx), dy = num(v.dy)
        for (let i = 0; i < c; i++) for (let j = 0; j < r; j++) {
          objs.push(mk("point", [[anchor[0] + i * dx, anchor[1] + j * dy]], `${i + 1}-${j + 1}`, "#f59e0b", "0", {}))
        }
      }
      return { objects: objs, message: `Массив построен: ${круговой ? c : c * r} элементов` }
    },
  },

  // Сопряжение (Fillet)
  "acad-draw-fillet": {
    outputLabel: "Сопряжение",
    fields: [f("r", "Радиус сопряжения", "15", "м"), f("ang", "Угол между сторонами", "90", "°")],
    compute: v => {
      const R = num(v.r), a = num(v.ang)
      const e = curveElements(180 - a, R)
      return [
        { label: "Тангенс (подрезка)", value: `${fx(e.T, 3)} м` },
        { label: "Длина дуги", value: `${fx(e.K, 3)} м` },
        { label: "Биссектриса", value: `${fx(e.B, 3)} м` },
      ]
    },
    buildLabel: "Построить сопряжение",
    build: (v, anchor) => {
      const R = num(v.r), a = num(v.ang)
      if (R <= 0) return { objects: [], message: "Радиус должен быть больше нуля" }
      const e = curveElements(180 - a, R)
      const arc = arcPts([anchor[0], anchor[1] + R], R, 270, 270 + (180 - a))
      return {
        objects: [
          mk("line", [[anchor[0] - e.T * 2, anchor[1]], anchor], "Сторона 1", "#6b7280", "0", {}),
          mk("arc", arc, `Сопряжение R=${fx(R, 2)}`, "#22d3ee", "0", { "Радиус": fx(R, 2) + " м", "Дуга": fx(e.K, 3) + " м" }),
        ],
        message: `Сопряжение R=${fx(R, 2)} м построено`,
      }
    },
  },

  // Фаска
  "acad-draw-chamfer": {
    outputLabel: "Фаска",
    fields: [f("d1", "Катет 1", "10", "м"), f("d2", "Катет 2", "10", "м")],
    compute: v => {
      const a = num(v.d1), b = num(v.d2)
      return [
        { label: "Длина фаски", value: `${fx(Math.hypot(a, b), 3)} м` },
        { label: "Угол фаски", value: `${fx((Math.atan2(b, a) * 180) / Math.PI, 2)}°` },
      ]
    },
    buildLabel: "Построить фаску",
    build: (v, anchor) => {
      const a = num(v.d1), b = num(v.d2)
      const p1: P2 = [anchor[0] - a, anchor[1]], p2: P2 = [anchor[0], anchor[1] + b]
      return {
        objects: [mk("line", [p1, p2], `Фаска ${fx(a, 1)}×${fx(b, 1)}`, "#22d3ee", "0",
          { "Длина": fx(Math.hypot(a, b), 3) + " м" })],
        message: `Фаска ${fx(a, 1)}×${fx(b, 1)} построена`,
      }
    },
  },

  // Область (Region) — площадь контура
  "acad-draw-region": {
    outputLabel: "Характеристики области",
    fields: [txt("pts", "Контур «x,y; …»", "0,0; 100,0; 100,60; 40,90; 0,60")],
    compute: v => {
      const pts = parseXY(v.pts)
      const A = Math.abs(polyArea(pts))
      return [
        { label: "Площадь", value: `${fmtBig(A, 2)} м²` },
        { label: "Площадь, га", value: `${fx(A / 10000, 4)} га` },
        { label: "Периметр", value: `${fx(polyLength([...pts, pts[0]]), 2)} м` },
      ]
    },
    buildLabel: "Построить область",
    build: v => {
      const pts = parseXY(v.pts)
      if (pts.length < 3) return { objects: [], message: "Нужно минимум 3 вершины" }
      const A = Math.abs(polyArea(pts))
      return {
        objects: [
          mk("polyline", [...pts, pts[0]], `Область ${fmtBig(A, 1)} м²`, "#10b981", "0",
            { "Площадь": fx(A, 2) + " м²", "Периметр": fx(polyLength([...pts, pts[0]]), 2) + " м" }),
          mkTx(centroidOf(pts), `S = ${fmtBig(A, 1)} м²`, "#10b981"),
        ],
        message: `Область ${fmtBig(A, 1)} м² построена`,
      }
    },
  },

  // Штриховка
  "acad-2025-hatch": {
    outputLabel: "Штриховка",
    fields: [txt("pts", "Контур «x,y; …»", "0,0; 80,0; 80,50; 0,50"),
      sel("pat", "Образец", "ANSI31", ["ANSI31", "SOLID", "EARTH", "GRAVEL", "CONCRETE"]),
      f("step", "Шаг штриховки", "4", "м")],
    compute: v => {
      const pts = parseXY(v.pts)
      const A = Math.abs(polyArea(pts))
      const step = Math.max(num(v.step), 0.1)
      return [
        { label: "Площадь заливки", value: `${fmtBig(A, 2)} м²` },
        { label: "Линий штриховки", value: `${Math.round(Math.sqrt(A) / step) || 1}` },
        { label: "Образец", value: v.pat },
      ]
    },
    buildLabel: "Построить штриховку",
    build: v => {
      const pts = parseXY(v.pts)
      if (pts.length < 3) return { objects: [], message: "Нужно минимум 3 вершины" }
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1])
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
      const step = Math.max(num(v.step), 0.5)
      const objs: CanvasObject[] = [mk("polyline", [...pts, pts[0]], "Контур штриховки", "#10b981", "Штриховка", { "Образец": v.pat })]
      for (let x = x0; x <= x1 + (y1 - y0); x += step) {
        const a: P2 = [x, y0], b: P2 = [x - (y1 - y0), y1]
        objs.push(mk("line", [a, b], "", "#10b98155", "Штриховка", {}))
      }
      return { objects: objs, message: `Штриховка ${v.pat}: ${fmtBig(Math.abs(polyArea(pts)), 1)} м²` }
    },
  },

  // ─── АННОТАЦИИ ─────────────────────────────────────────────────────────────

  "acad-anno-dimlinear": {
    outputLabel: "Линейный размер",
    fields: [f("x1", "X начала", "0"), f("y1", "Y начала", "0"), f("x2", "X конца", "1247.6"), f("y2", "Y конца", "0"),
      sel("prec", "Точность", "0.00", ["0", "0.0", "0.00", "0.000"]), sel("scale", "Масштаб", "1:500", Object.keys(SHEETS).length ? ["1:100", "1:200", "1:500", "1:1000", "1:2000"] : ["1:500"])],
    compute: v => {
      const a: P2 = [num(v.x1), num(v.y1)], b: P2 = [num(v.x2), num(v.y2)]
      const L = Math.hypot(b[0] - a[0], b[1] - a[1])
      const d = (v.prec.split(".")[1] || "").length
      return [
        { label: "Измеренное значение", value: `${L.toFixed(d)} м` },
        { label: "Дирекционный угол", value: dms(bearing(a, b)) },
        { label: "Высота текста на листе", value: `${fx(2.5 * scaleFactor(v.scale) / 1000, 2)} м` },
      ]
    },
    buildLabel: "Проставить размер",
    build: v => {
      const a: P2 = [num(v.x1), num(v.y1)], b: P2 = [num(v.x2), num(v.y2)]
      const L = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (L <= 0) return { objects: [], message: "Нулевая длина" }
      const d = (v.prec.split(".")[1] || "").length
      const off = Math.max(L * 0.08, 2)
      const a2: P2 = [a[0], a[1] - off], b2: P2 = [b[0], b[1] - off]
      return {
        objects: [
          mk("line", [a, a2], "", "#e5e7eb", "Аннотации", {}),
          mk("line", [b, b2], "", "#e5e7eb", "Аннотации", {}),
          mk("line", [a2, b2], `Размер ${L.toFixed(d)}`, "#e5e7eb", "Аннотации", { "Значение": L.toFixed(d) + " м" }),
          mkTx([(a2[0] + b2[0]) / 2, a2[1] + off * 0.25], `${L.toFixed(d)} м`),
        ],
        message: `Размер ${L.toFixed(d)} м проставлен`,
      }
    },
  },

  "acad-anno-dimangular": {
    outputLabel: "Угловой размер",
    fields: [f("a1", "Направление 1", "0", "°"), f("a2", "Направление 2", "63.435", "°"), f("r", "Радиус выноса", "30", "м")],
    compute: v => {
      const d = Math.abs(num(v.a2) - num(v.a1))
      const a = d > 180 ? 360 - d : d
      return [
        { label: "Угол", value: dms(a) },
        { label: "В градусах", value: `${fx(a, 4)}°` },
        { label: "В радианах", value: `${fx((a * Math.PI) / 180, 5)} рад` },
        { label: "Длина дуги выноса", value: `${fx((Math.PI * num(v.r) * a) / 180, 3)} м` },
      ]
    },
    buildLabel: "Проставить угол",
    build: (v, anchor) => {
      const a1 = num(v.a1), a2 = num(v.a2), R = Math.max(num(v.r), 1)
      const p1: P2 = [anchor[0] + Math.cos((a1 * Math.PI) / 180) * R * 1.4, anchor[1] + Math.sin((a1 * Math.PI) / 180) * R * 1.4]
      const p2: P2 = [anchor[0] + Math.cos((a2 * Math.PI) / 180) * R * 1.4, anchor[1] + Math.sin((a2 * Math.PI) / 180) * R * 1.4]
      const mid = (a1 + a2) / 2
      return {
        objects: [
          mk("line", [anchor, p1], "", "#e5e7eb", "Аннотации", {}),
          mk("line", [anchor, p2], "", "#e5e7eb", "Аннотации", {}),
          mk("arc", arcPts(anchor, R, a1, a2), "Угловой размер", "#e5e7eb", "Аннотации", { "Угол": dms(Math.abs(a2 - a1)) }),
          mkTx([anchor[0] + Math.cos((mid * Math.PI) / 180) * R * 1.2, anchor[1] + Math.sin((mid * Math.PI) / 180) * R * 1.2], dms(Math.abs(a2 - a1))),
        ],
        message: `Угол ${dms(Math.abs(a2 - a1))} проставлен`,
      }
    },
  },

  "acad-anno-mtext": {
    outputLabel: "Многострочный текст",
    fields: [txt("text", "Текст", "Проектируемая автодорога"), f("h", "Высота текста", "2.5", "мм"), sel("scale", "Масштаб", "1:500", ["1:100", "1:200", "1:500", "1:1000", "1:2000"])],
    compute: v => {
      const k = scaleFactor(v.scale), h = num(v.h)
      return [
        { label: "Высота на чертеже", value: `${fx((h * k) / 1000, 3)} м` },
        { label: "Символов", value: `${v.text.length}` },
        { label: "Масштабный коэффициент", value: `1:${k}` },
      ]
    },
    buildLabel: "Разместить текст",
    build: (v, anchor) => ({
      objects: [mkTx(anchor, v.text || "Текст")],
      message: `Текст размещён: «${v.text}»`,
    }),
  },

  "acad-anno-leader": {
    outputLabel: "Выноска",
    fields: [txt("text", "Текст выноски", "Ж/б труба d=1000"), f("len", "Длина полки", "20", "м"), f("ang", "Угол выноски", "45", "°")],
    compute: v => [
      { label: "Текст", value: v.text },
      { label: "Длина выноски", value: `${fx(num(v.len), 2)} м` },
      { label: "Угол", value: `${fx(num(v.ang), 1)}°` },
    ],
    buildLabel: "Построить выноску",
    build: (v, anchor) => {
      const L = Math.max(num(v.len), 1), a = (num(v.ang) * Math.PI) / 180
      const bend: P2 = [anchor[0] + Math.cos(a) * L, anchor[1] + Math.sin(a) * L]
      const end: P2 = [bend[0] + L * 0.6, bend[1]]
      return {
        objects: [
          mk("polyline", [anchor, bend, end], "Выноска", "#e5e7eb", "Аннотации", { "Текст": v.text }),
          mkTx([end[0] + 1, end[1] + 1], v.text || "Выноска"),
        ],
        message: `Выноска «${v.text}» построена`,
      }
    },
  },

  "acad-anno-revcloud": {
    outputLabel: "Облако правок",
    fields: [f("w", "Ширина области", "80", "м"), f("h", "Высота области", "50", "м"), f("arc", "Длина дуги", "8", "м")],
    compute: v => {
      const w = num(v.w), h = num(v.h), a = Math.max(num(v.arc), 1)
      const per = 2 * (w + h)
      return [
        { label: "Периметр облака", value: `${fx(per, 2)} м` },
        { label: "Дуг в облаке", value: `${Math.round(per / a)}` },
        { label: "Площадь области", value: `${fmtBig(w * h, 1)} м²` },
      ]
    },
    buildLabel: "Построить облако",
    build: (v, anchor) => {
      const w = num(v.w), h = num(v.h), step = Math.max(num(v.arc), 1)
      const base = rectPts([anchor[0] - w / 2, anchor[1] - h / 2], w, h)
      const pts: P2[] = []
      for (let i = 1; i < base.length; i++) {
        const [x0, y0] = base[i - 1], [x1, y1] = base[i]
        const segLen = Math.hypot(x1 - x0, y1 - y0)
        const n = Math.max(Math.round(segLen / step), 1)
        for (let j = 0; j < n; j++) {
          const t = j / n, t2 = (j + 0.5) / n
          const px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t
          const nx = -(y1 - y0) / segLen, ny = (x1 - x0) / segLen
          pts.push([px, py])
          pts.push([x0 + (x1 - x0) * t2 + nx * step * 0.4, y0 + (y1 - y0) * t2 + ny * step * 0.4])
        }
      }
      pts.push(base[0])
      return {
        objects: [mk("polyline", pts, "Облако правок", "#f43f5e", "Правки", { "Дуг": String(Math.round((2 * (w + h)) / step)) })],
        message: `Облако правок построено (${Math.round((2 * (w + h)) / step)} дуг)`,
      }
    },
  },

  "acad-anno-dimscale": {
    outputLabel: "Масштаб аннотаций",
    fields: [sel("scale", "Масштаб чертежа", "1:500", ["1:100", "1:200", "1:500", "1:1000", "1:2000", "1:5000"]),
      f("h", "Высота текста на листе", "2.5", "мм")],
    compute: v => {
      const k = scaleFactor(v.scale), h = num(v.h)
      return [
        { label: "DIMSCALE", value: `${k}` },
        { label: "Высота текста в модели", value: `${fx((h * k) / 1000, 3)} м` },
        { label: "Высота стрелки", value: `${fx((2.5 * k) / 1000, 3)} м` },
        { label: "Шаг размерных линий", value: `${fx((7 * k) / 1000, 3)} м` },
      ]
    },
  },

  // ─── РЕДАКТИРОВАНИЕ ────────────────────────────────────────────────────────

  "acad-modify-move": {
    outputLabel: "Перенос",
    fields: [f("dx", "Смещение ΔX", "25", "м"), f("dy", "Смещение ΔY", "-10", "м")],
    compute: v => {
      const dx = num(v.dx), dy = num(v.dy)
      return [
        { label: "Расстояние переноса", value: `${fx(Math.hypot(dx, dy), 3)} м` },
        { label: "Направление", value: dms(bearing([0, 0], [dx, dy])) },
      ]
    },
  },

  "acad-modify-rotate": {
    outputLabel: "Поворот",
    fields: [f("ang", "Угол поворота", "45", "°"), f("x", "X базовой точки", "0"), f("y", "Y базовой точки", "0")],
    compute: v => {
      const a = num(v.ang)
      return [
        { label: "Угол поворота", value: dms(a) },
        { label: "В радианах", value: `${fx((a * Math.PI) / 180, 5)} рад` },
        { label: "Матрица (cos / sin)", value: `${fx(Math.cos((a * Math.PI) / 180), 5)} / ${fx(Math.sin((a * Math.PI) / 180), 5)}` },
      ]
    },
  },

  "acad-modify-scale": {
    outputLabel: "Масштабирование",
    fields: [f("k", "Коэффициент", "1.5"), f("len", "Исходный размер", "100", "м")],
    compute: v => {
      const k = num(v.k), L = num(v.len)
      return [
        { label: "Новый размер", value: `${fx(L * k, 3)} м` },
        { label: "Изменение площади", value: `×${fx(k * k, 4)}` },
        { label: "Изменение объёма", value: `×${fx(k * k * k, 4)}` },
      ]
    },
  },

  "acad-modify-align": {
    outputLabel: "Выравнивание",
    fields: [f("x1", "X источника", "0"), f("y1", "Y источника", "0"), f("x2", "X приёмника", "60"), f("y2", "Y приёмника", "40"), sel("scale", "Масштабировать", "Нет", ["Нет", "Да"])],
    compute: v => {
      const a: P2 = [num(v.x1), num(v.y1)], b: P2 = [num(v.x2), num(v.y2)]
      return [
        { label: "Смещение", value: `${fx(Math.hypot(b[0] - a[0], b[1] - a[1]), 3)} м` },
        { label: "Угол доворота", value: dms(bearing(a, b)) },
        { label: "Масштабирование", value: v.scale },
      ]
    },
  },

  // ─── СЛОИ ──────────────────────────────────────────────────────────────────

  "acad-layer-new": {
    outputLabel: "Новый слой",
    fields: [txt("name", "Имя слоя", "ПР_Дороги"), sel("color", "Цвет", "Оранжевый", ["Белый", "Красный", "Жёлтый", "Зелёный", "Голубой", "Синий", "Оранжевый"]),
      f("lw", "Толщина линии", "0.35", "мм"), sel("lt", "Тип линии", "Continuous", ["Continuous", "Dashed", "Center", "Hidden", "Phantom"])],
    compute: v => [
      { label: "Слой создан", value: v.name },
      { label: "Цвет / тип", value: `${v.color} · ${v.lt}` },
      { label: "Толщина на печати", value: `${fx(num(v.lw), 2)} мм` },
    ],
  },

  "acad-layer-transparency": {
    outputLabel: "Прозрачность слоя",
    fields: [f("tr", "Прозрачность", "40", "%"), txt("name", "Слой", "Подложка")],
    compute: v => {
      const t = Math.min(Math.max(num(v.tr), 0), 90)
      return [
        { label: "Прозрачность", value: `${fx(t, 0)} %` },
        { label: "Альфа-канал", value: `${fx(1 - t / 100, 2)}` },
        { label: "Видимость подложки", value: t > 50 ? "Высокая" : t > 20 ? "Средняя" : "Низкая" },
      ]
    },
  },

  // ─── БЛОКИ ─────────────────────────────────────────────────────────────────

  "acad-block-insert": {
    outputLabel: "Вставка блока",
    fields: [txt("name", "Имя блока", "КОЛОДЕЦ_КК"), f("n", "Количество", "12"), f("scale", "Масштаб", "1"), f("step", "Шаг расстановки", "25", "м")],
    compute: v => {
      const n = Math.max(1, Math.round(num(v.n))), step = num(v.step)
      return [
        { label: "Вставлено блоков", value: `${n}` },
        { label: "Длина трассы расстановки", value: `${fx((n - 1) * step, 2)} м` },
        { label: "Масштаб вставки", value: `×${fx(num(v.scale), 2)}` },
      ]
    },
    buildLabel: "Расставить блоки",
    build: (v, anchor) => {
      const n = Math.max(1, Math.round(num(v.n))), step = Math.max(num(v.step), 1)
      const objs: CanvasObject[] = []
      for (let i = 0; i < n; i++) {
        const p: P2 = [anchor[0] + i * step, anchor[1]]
        objs.push(mk("point", [p], `${v.name}-${i + 1}`, "#f59e0b", "Блоки",
          { "Блок": v.name, "№": String(i + 1), "X": fx(p[0], 3), "Y": fx(p[1], 3) }))
      }
      return { objects: objs, message: `Расставлено блоков «${v.name}»: ${n}` }
    },
  },

  "acad-block-attext": {
    outputLabel: "Экспорт атрибутов",
    fields: [txt("block", "Блок", "КОЛОДЕЦ_КК"), f("n", "Вхождений", "48"), sel("fmt", "Формат", "CSV", ["CSV", "XLSX", "TXT"])],
    compute: v => {
      const n = Math.max(0, Math.round(num(v.n)))
      return [
        { label: "Экспортировано строк", value: `${n}` },
        { label: "Файл", value: `${v.block}_attrib.${v.fmt.toLowerCase()}` },
        { label: "Оценка размера", value: `${fx((n * 120) / 1024, 1)} КБ` },
      ]
    },
  },

  "acad-2022-count": {
    outputLabel: "Подсчёт блоков",
    fields: [txt("block", "Имя блока", "СВЕТИЛЬНИК"), f("count", "Найдено вхождений", "128"), f("price", "Цена за единицу", "8500", "₽")],
    compute: v => {
      const n = Math.max(0, Math.round(num(v.count))), p = num(v.price)
      return [
        { label: `Блок «${v.block}»`, value: `${n} шт.` },
        { label: "Стоимость позиции", value: `${fmtBig(n * p, 2)} ₽` },
        { label: "С учётом 5 % запаса", value: `${Math.ceil(n * 1.05)} шт.` },
      ]
    },
    buildLabel: "Вставить ведомость",
    build: (v, anchor) => {
      const n = Math.max(0, Math.round(num(v.count))), p = num(v.price)
      return {
        objects: [
          mkTx(anchor, `ВЕДОМОСТЬ: ${v.block}`, "#f59e0b", "Ведомости"),
          mkTx([anchor[0], anchor[1] - 6], `Количество: ${n} шт.`, "#e5e7eb", "Ведомости"),
          mkTx([anchor[0], anchor[1] - 12], `Стоимость: ${fmtBig(n * p, 2)} ₽`, "#e5e7eb", "Ведомости"),
          mkTx([anchor[0], anchor[1] - 18], `С запасом 5 %: ${Math.ceil(n * 1.05)} шт.`, "#e5e7eb", "Ведомости"),
        ],
        message: `Ведомость по блоку «${v.block}» вставлена`,
      }
    },
  },
}

// ─── Вспомогательные ─────────────────────────────────────────────────────────

/** Разбор строки «x,y; x,y» в массив точек */
function parseXY(s: string): P2[] {
  return String(s || "").split(/[;\n]/).map(p => {
    const [a, b] = p.trim().split(/[,\s]+/)
    return [num(a), num(b)] as P2
  }).filter(p => Number.isFinite(p[0]) && Number.isFinite(p[1]))
}

/** Центр тяжести контура (для подписи площади) */
function centroidOf(pts: P2[]): P2 {
  if (!pts.length) return [0, 0]
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1])
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2]
}