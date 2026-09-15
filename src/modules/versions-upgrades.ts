// ═══════════════════════════════════════════════════════════════════════════
// Рабочие расчёты и построения для функций версий 2022–2027.
// Накладываются на каталог по id функции: заменяют поля, расчёт и добавляют
// действие на чертеже. Формулы — СП 34.13330, СП 32.13330, ГОСТ Р 21.1101.
// ═══════════════════════════════════════════════════════════════════════════

import type { ToolField, VersionFeatureFull } from "./versions-catalog"
import type { BuildResult } from "@/utils/featureActions"
import {
  num, fx, fmtBig, curveElements, minRadius, clothoidLength, clothoidParam,
  stoppingSight, vertCurve, superelevation, station,
  manning, minPipeSlope, selectDiameter, stormFlow, headLoss, gravityProfile,
  gridEarthwork, compaction, contourLevels, prismoid, sectionArea, avgAreaVolume,
  traverseAdjust, levelingCheck, rmse, forwardGeo, inverseGeo, dms,
  sheetCount, scaleFactor, SHEETS, polyArea, polyLength,
  type P2,
} from "@/utils/engCalc"
import {
  buildPoints, buildTraverse, buildFromBearing, buildAlignment, buildRoadEdges,
  buildCorridor, buildCurve, buildContours, buildBoundary, buildEarthworkGrid,
  buildPipeline, buildSheets, buildTable, buildLabel,
  buildSegment, buildCircle, buildRect, buildPolygon, buildArray, buildOffsets,
  buildBlockInsert, buildSolidFootprint, buildTransform,
} from "@/utils/featureActions"
import { drawingUpgrades } from "./upgrades-drawing"
import { mechUpgrades } from "./upgrades-mech"

type V = Record<string, string>
type Rows = { label: string; value: string }[]

export interface Upgrade {
  fields?: ToolField[]
  outputLabel?: string
  compute?: (v: V) => Rows
  build?: (v: V, anchor: P2) => BuildResult
  buildLabel?: string
  desc?: string
}

const f = (key: string, label: string, def: string, suffix?: string): ToolField =>
  ({ key, label, type: "number", default: def, suffix })
const sel = (key: string, label: string, def: string, options: string[]): ToolField =>
  ({ key, label, type: "select", default: def, options })
const txt = (key: string, label: string, def: string): ToolField =>
  ({ key, label, type: "text", default: def })

/** Разбор строки координат «x,y» или «x y; x y» */
const parsePts = (s: string): P2[] =>
  String(s || "").split(/[;\n]/).map(p => {
    const [a, b] = p.trim().split(/[,\s]+/)
    return [num(a), num(b)] as P2
  }).filter(p => Number.isFinite(p[0]) && Number.isFinite(p[1]) && (p[0] !== 0 || p[1] !== 0))

/** Прямая трасса от точки вставки — если пользователь не задал геометрию */
const defaultAxis = (a: P2, len: number): P2[] => {
  const pts: P2[] = []
  const seg = Math.max(len / 6, 1)
  for (let i = 0; i <= 6; i++) {
    const x = a[0] - len / 2 + seg * i
    const y = a[1] + Math.sin(i * 0.7) * (len * 0.06)
    pts.push([x, y])
  }
  return pts
}

// ═══════════════════════════════════════════════════════════════════════════
// ГЕОДЕЗИЯ И СЪЁМКА
// ═══════════════════════════════════════════════════════════════════════════

const surveyUpgrades: Record<string, Upgrade> = {
  // Уравнивание теодолитного хода
  "survey-traverse": {
    desc: "Уравнивание замкнутого теодолитного хода: угловая и линейная невязки, допуски по инструкции.",
    fields: [
      txt("pts", "Координаты станций (x,y через ;)", "0,0; 120,15; 190,110; 60,140"),
      f("acc", "Точность прибора", "5", "″"),
    ],
    outputLabel: "Уравнивание хода",
    compute: v => {
      const pts = parsePts(v.pts)
      if (pts.length < 3) return [{ label: "Ошибка", value: "нужно минимум 3 станции" }]
      const r = traverseAdjust(pts, num(v.acc))
      return [
        { label: "Станций в ходе", value: String(r.n) },
        { label: "Периметр хода", value: `${fx(r.perimeter)} м` },
        { label: "Сумма углов (факт)", value: dms(r.sumAngles) },
        { label: "Сумма углов (теория)", value: dms(r.theoryAngles) },
        { label: "Угловая невязка fβ", value: `${dms(r.fAngle)} (доп. ${dms(r.tolAngle)})` },
        { label: "Оценка по углам", value: r.angleOk ? "✓ в допуске" : "✗ превышение" },
        { label: "Абсолютная невязка", value: `${fx(r.fAbs, 3)} м` },
        { label: "Относительная невязка", value: r.relative === Infinity ? "1:∞" : `1:${Math.round(r.relative)}` },
        { label: "Оценка хода", value: r.relOk ? "✓ допустимо (не грубее 1:2000)" : "✗ грубее 1:2000" },
      ]
    },
    build: (v, a) => {
      const pts = parsePts(v.pts)
      return buildTraverse(pts.length >= 3 ? pts : defaultAxis(a, 200))
    },
    buildLabel: "Построить ход",
  },

  // Точки COGO из ведомости
  "survey-cogo-point": {
    desc: "Создание точек COGO по ведомости координат с кодами и отметками.",
    fields: [
      txt("list", "Ведомость (x,y,z через ;)", "0,0,125.4; 45,12,126.1; 88,35,127.8; 120,70,129.2"),
      txt("code", "Код точки", "СЪЁМКА"),
    ],
    outputLabel: "Точки COGO",
    compute: v => {
      const rows = String(v.list).split(";").map(s => s.trim().split(/[,\s]+/).map(num))
      const zs = rows.map(r => r[2] || 0)
      return [
        { label: "Создано точек", value: String(rows.length) },
        { label: "Мин. отметка", value: `${fx(Math.min(...zs))} м` },
        { label: "Макс. отметка", value: `${fx(Math.max(...zs))} м` },
        { label: "Превышение", value: `${fx(Math.max(...zs) - Math.min(...zs))} м` },
        { label: "Код", value: String(v.code) },
      ]
    },
    build: v => {
      const rows = String(v.list).split(";").map(s => s.trim().split(/[,\s]+/).map(num))
      return buildPoints(rows.map((r, i) => ({ x: r[0], y: r[1], z: r[2] || 0, name: `${i + 1}`, code: String(v.code) })))
    },
    buildLabel: "Поставить точки",
  },

  // Прямая и обратная геодезическая задача
  "civil-2025-coord-transform": {
    desc: "Прямая и обратная геодезическая задача: вынос точки по дирекционному углу и расстоянию.",
    fields: [
      f("x", "X исходной", "0"), f("y", "Y исходной", "0"),
      f("br", "Дирекционный угол", "45.0000", "°"),
      f("d", "Расстояние", "150.00", "м"),
    ],
    outputLabel: "Разбивочные элементы",
    compute: v => {
      const from: P2 = [num(v.x), num(v.y)]
      const to = forwardGeo(from, num(v.br), num(v.d))
      const inv = inverseGeo(from, to)
      return [
        { label: "X вынесенной точки", value: fx(to[0], 3) },
        { label: "Y вынесенной точки", value: fx(to[1], 3) },
        { label: "Дир. угол (контроль)", value: dms(inv.bearing) },
        { label: "Расстояние (контроль)", value: `${fx(inv.distance, 3)} м` },
        { label: "Приращение ΔX", value: `${fx(to[0] - from[0], 3)} м` },
        { label: "Приращение ΔY", value: `${fx(to[1] - from[1], 3)} м` },
      ]
    },
    build: v => buildFromBearing([num(v.x), num(v.y)], num(v.br), num(v.d)),
    buildLabel: "Вынести в натуру",
  },

  // Нивелирный ход
  "civil-2022-relative": {
    desc: "Проверка нивелирного хода: невязка превышений и допуск для технического нивелирования.",
    fields: [
      f("h1", "Отметка начального Rp", "125.430", "м"),
      f("h2", "Отметка конечного Rp", "131.870", "м"),
      f("sum", "Сумма превышений", "6.452", "м"),
      f("len", "Длина хода", "1.8", "км"),
    ],
    outputLabel: "Нивелирный ход",
    compute: v => {
      const r = levelingCheck(num(v.h1), num(v.h2), num(v.sum), num(v.len))
      return [
        { label: "Теоретическое превышение", value: `${fx(num(v.h2) - num(v.h1), 3)} м` },
        { label: "Невязка fh", value: `${fx(r.fMm, 1)} мм` },
        { label: "Допуск 50мм·√L", value: `±${fx(r.tolMm, 1)} мм` },
        { label: "Оценка", value: r.ok ? "✓ ход в допуске" : "✗ невязка превышает допуск" },
        { label: "Поправка на станцию", value: `${fx(-r.fMm / Math.max(num(v.len) * 10, 1), 2)} мм` },
      ]
    },
  },

  // Точность съёмки
  "civil-2027-cloud-surface": {
    desc: "Оценка точности съёмки: средняя квадратическая погрешность ряда измерений.",
    fields: [txt("vals", "Измерения (через ;)", "125.43; 125.45; 125.41; 125.44; 125.42")],
    outputLabel: "Оценка точности",
    compute: v => {
      const vals = String(v.vals).split(";").map(num).filter(Number.isFinite)
      const m = vals.reduce((a, b) => a + b, 0) / Math.max(vals.length, 1)
      const s = rmse(vals)
      return [
        { label: "Число измерений", value: String(vals.length) },
        { label: "Среднее значение", value: fx(m, 3) },
        { label: "СКП одного измерения", value: `±${fx(s * 1000, 1)} мм` },
        { label: "СКП среднего", value: `±${fx((s / Math.sqrt(Math.max(vals.length, 1))) * 1000, 1)} мм` },
        { label: "Размах", value: `${fx((Math.max(...vals) - Math.min(...vals)) * 1000, 1)} мм` },
      ]
    },
  },

  // Площадь и периметр участка
  "civil-2026-surface-aoi": {
    desc: "Площадь, периметр и объём по контуру участка работ (формула Гаусса).",
    fields: [
      txt("pts", "Контур участка (x,y через ;)", "0,0; 150,0; 150,100; 60,130; 0,80"),
      f("base", "Базовая отметка", "125.00", "м"),
      f("avg", "Средняя отметка поверхности", "127.40", "м"),
    ],
    outputLabel: "Характеристики участка",
    compute: v => {
      const pts = parsePts(v.pts)
      const A = polyArea(pts)
      const h = num(v.avg) - num(v.base)
      return [
        { label: "Площадь участка", value: `${fmtBig(A)} м² (${fx(A / 10000, 3)} га)` },
        { label: "Периметр", value: `${fx(polyLength([...pts, pts[0]]))} м` },
        { label: "Вершин контура", value: String(pts.length) },
        { label: "Средняя рабочая отметка", value: `${fx(h)} м` },
        { label: "Объём (площадь × отметка)", value: `${fmtBig(A * h)} м³` },
      ]
    },
    build: v => buildBoundary(parsePts(v.pts), "Граница участка работ"),
    buildLabel: "Построить контур",
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// ДОРОГИ И ТРАССЫ
// ═══════════════════════════════════════════════════════════════════════════

const roadUpgrades: Record<string, Upgrade> = {
  // Круговая кривая в плане
  "civil-2023-corridor-extract": {
    desc: "Расчёт элементов круговой кривой в плане: тангенс, длина, биссектриса, домер.",
    fields: [
      f("angle", "Угол поворота", "32.5000", "°"),
      f("R", "Радиус кривой", "600", "м"),
      f("V", "Расчётная скорость", "100", "км/ч"),
      f("pk", "Пикетаж вершины ВУ", "1250", "м"),
    ],
    outputLabel: "Элементы круговой кривой",
    compute: v => {
      const e = curveElements(num(v.angle), num(v.R))
      const Rmin = minRadius(num(v.V))
      const L = clothoidLength(num(v.V), num(v.R))
      const pk = num(v.pk)
      return [
        { label: "Тангенс T", value: `${fx(e.T)} м` },
        { label: "Длина кривой K", value: `${fx(e.K)} м` },
        { label: "Биссектриса Б", value: `${fx(e.B)} м` },
        { label: "Домер Д", value: `${fx(e.D)} м` },
        { label: "Начало кривой НК", value: station(pk - e.T) },
        { label: "Конец кривой КК", value: station(pk - e.T + e.K) },
        { label: "Мин. радиус при V", value: `${fx(Rmin)} м` },
        { label: "Проверка радиуса", value: num(v.R) >= Rmin ? "✓ удовлетворяет СП 34.13330" : "✗ радиус мал для этой скорости" },
        { label: "Переходная кривая L", value: `${fx(L)} м (A=${fx(clothoidParam(num(v.R), L))})` },
      ]
    },
    build: (v, a) => buildCurve(a, 0, num(v.angle), num(v.R)),
    buildLabel: "Построить кривую",
  },

  // Трасса с пикетажем
  "civil-2023-offset-profile": {
    desc: "Построение трассы с разбивкой пикетажа и линий смещения от оси.",
    fields: [
      f("len", "Длина трассы", "600", "м"),
      f("step", "Шаг пикетов", "100", "м"),
      f("off", "Смещение от оси", "3.50", "м"),
      f("i", "Продольный уклон", "25", "‰"),
    ],
    outputLabel: "Трасса и пикетаж",
    compute: v => {
      const L = num(v.len), st = num(v.step), i = num(v.i) / 1000
      return [
        { label: "Длина трассы", value: `${fx(L)} м` },
        { label: "Пикетов", value: String(Math.floor(L / st) + 1) },
        { label: "Конечный пикет", value: station(L) },
        { label: "Смещение линии", value: `${fx(num(v.off))} м` },
        { label: "Длина линии смещения", value: `${fx(L)} м` },
        { label: "Перепад отметок", value: `${fx(L * i)} м` },
        { label: "Уклон", value: `${fx(num(v.i), 1)} ‰ (${fx(i * 100)} %)` },
      ]
    },
    build: (v, a) => {
      const axis = defaultAxis(a, num(v.len))
      const al = buildAlignment(axis, "Трасса", num(v.step))
      const ed = buildRoadEdges(axis, num(v.off) * 2)
      return { objects: [...al.objects, ...ed.objects], message: `${al.message}; ${ed.message}` }
    },
    buildLabel: "Построить трассу",
  },

  // Вираж и уширение
  "civil-2024-corridor-transition": {
    desc: "Расчёт виража: поперечный уклон, отгон виража, уширение на кривой.",
    fields: [
      f("V", "Расчётная скорость", "100", "км/ч"),
      f("R", "Радиус кривой", "600", "м"),
      f("w", "Ширина проезжей части", "7.50", "м"),
      f("imax", "Макс. уклон виража", "60", "‰"),
    ],
    outputLabel: "Вираж и уширение",
    compute: v => {
      const V = num(v.V), R = num(v.R), w = num(v.w)
      const i = superelevation(V, R, num(v.imax) / 1000)
      const L = clothoidLength(V, R)
      const ush = R > 0 ? (w * w) / (2 * R) + (0.1 * V) / Math.sqrt(R) : 0
      return [
        { label: "Уклон виража", value: `${fx(i * 1000, 1)} ‰ (${fx(i * 100)} %)` },
        { label: "Длина отгона виража", value: `${fx(L)} м` },
        { label: "Уширение на кривой", value: `${fx(ush)} м` },
        { label: "Ширина с уширением", value: `${fx(w + ush)} м` },
        { label: "Превышение кромки", value: `${fx((w / 2) * i, 3)} м` },
        { label: "Уклон отгона", value: `${fx(L > 0 ? ((w / 2) * i * 1000) / L : 0, 2)} ‰` },
      ]
    },
  },

  // Вертикальная кривая
  "civil-2025-profile-view-plus": {
    desc: "Расчёт вертикальной кривой продольного профиля и видимости.",
    fields: [
      f("i1", "Уклон входящий", "25", "‰"),
      f("i2", "Уклон исходящий", "-18", "‰"),
      f("R", "Радиус верт. кривой", "10000", "м"),
      f("V", "Расчётная скорость", "100", "км/ч"),
    ],
    outputLabel: "Вертикальная кривая",
    compute: v => {
      const i1 = num(v.i1) / 1000, i2 = num(v.i2) / 1000
      const c = vertCurve(i1, i2, num(v.R))
      const S = stoppingSight(num(v.V))
      const type = i1 > i2 ? "Выпуклая" : "Вогнутая"
      const Rmin = type === "Выпуклая" ? (S * S) / 2 : (S * S) / 4
      return [
        { label: "Тип кривой", value: type },
        { label: "Разность уклонов", value: `${fx(c.deltaI * 1000, 1)} ‰` },
        { label: "Длина кривой", value: `${fx(c.L)} м` },
        { label: "Тангенс", value: `${fx(c.T)} м` },
        { label: "Биссектриса", value: `${fx(c.bisector, 3)} м` },
        { label: "Расстояние видимости", value: `${fx(S)} м` },
        { label: "Мин. радиус по видимости", value: `${fmtBig(Rmin, 0)} м` },
        { label: "Проверка", value: num(v.R) >= Rmin ? "✓ видимость обеспечена" : "✗ увеличьте радиус" },
      ]
    },
  },

  // Коридор и земляные работы по нему
  "civil-2026-corridor-solids": {
    desc: "Коридор: объёмы земляных работ по поперечникам, откосы, площадь занимаемых земель.",
    fields: [
      f("len", "Длина участка", "500", "м"),
      f("w", "Ширина полотна", "12.00", "м"),
      f("h", "Средняя рабочая отметка", "1.80", "м"),
      f("m", "Заложение откоса 1:m", "1.5"),
      f("step", "Шаг поперечников", "20", "м"),
    ],
    outputLabel: "Объёмы по коридору",
    compute: v => {
      const L = num(v.len), w = num(v.w), h = num(v.h), m = num(v.m), st = num(v.step)
      const A = sectionArea(w, h, m)
      const n = Math.floor(L / st) + 1
      const areas = Array.from({ length: n }, (_, i) => A * (0.75 + 0.5 * Math.sin(i * 0.5)))
      const Vol = avgAreaVolume(areas, st)
      const pr = prismoid(areas[0], A, areas[areas.length - 1], L)
      const c = compaction(Vol)
      const widthTop = w + 2 * m * h
      return [
        { label: "Площадь поперечника", value: `${fx(A)} м²` },
        { label: "Ширина по верху откосов", value: `${fx(widthTop)} м` },
        { label: "Поперечников", value: String(n) },
        { label: "Объём (средние площади)", value: `${fmtBig(Vol)} м³` },
        { label: "Объём (призматоид)", value: `${fmtBig(pr)} м³` },
        { label: "С учётом разрыхления", value: `${fmtBig(c.loose)} м³` },
        { label: "Площадь занимаемых земель", value: `${fmtBig(widthTop * L)} м² (${fx((widthTop * L) / 10000, 2)} га)` },
      ]
    },
    build: (v, a) => buildCorridor(defaultAxis(a, num(v.len)), num(v.w), num(v.m) * num(v.h)),
    buildLabel: "Построить коридор",
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// ПОВЕРХНОСТИ И ЦМР
// ═══════════════════════════════════════════════════════════════════════════

const surfaceUpgrades: Record<string, Upgrade> = {
  // Картограмма земляных масс
  "civil-2024-grading-opt": {
    desc: "Картограмма земляных масс по сетке квадратов: выемка, насыпь, баланс, вывоз грунта.",
    fields: [
      f("cols", "Квадратов по X", "6"),
      f("rows", "Квадратов по Y", "4"),
      f("a", "Сторона квадрата", "20", "м"),
      f("hmax", "Макс. рабочая отметка", "1.20", "м"),
      f("kr", "Коэф. разрыхления", "1.15"),
    ],
    outputLabel: "Баланс земляных масс",
    compute: v => {
      const cols = Math.max(2, Math.round(num(v.cols))), rows = Math.max(2, Math.round(num(v.rows)))
      const a = num(v.a), hmax = num(v.hmax)
      const grid = Array.from({ length: rows + 1 }, (_, i) =>
        Array.from({ length: cols + 1 }, (_, j) => hmax * Math.sin((i + j) * 0.6)))
      const r = gridEarthwork(grid, a)
      const c = compaction(Math.abs(r.balance), num(v.kr))
      return [
        { label: "Площадь планировки", value: `${fmtBig(cols * rows * a * a)} м²` },
        { label: "Объём насыпи", value: `${fmtBig(r.fill)} м³` },
        { label: "Объём выемки", value: `${fmtBig(r.cut)} м³` },
        { label: "Баланс", value: `${r.balance > 0 ? "недостаток" : "избыток"} ${fmtBig(Math.abs(r.balance))} м³` },
        { label: "Вывоз с разрыхлением", value: `${fmtBig(c.loose)} м³` },
        { label: "Рейсов самосвала (10 м³)", value: String(Math.ceil(c.loose / 10)) },
      ]
    },
    build: (v, a) => buildEarthworkGrid([a[0] - (num(v.cols) * num(v.a)) / 2, a[1] - (num(v.rows) * num(v.a)) / 2],
      Math.max(2, Math.round(num(v.cols))), Math.max(2, Math.round(num(v.rows))), num(v.a)),
    buildLabel: "Построить сетку",
  },

  // Горизонтали
  "civil-2026-drainage": {
    desc: "Горизонтали рельефа: сечение, количество, уклон поверхности, заложение.",
    fields: [
      f("min", "Минимальная отметка", "120.00", "м"),
      f("max", "Максимальная отметка", "138.50", "м"),
      f("step", "Сечение рельефа", "0.50", "м"),
      f("dist", "Заложение (между горизонт.)", "12.00", "м"),
    ],
    outputLabel: "Горизонтали рельефа",
    compute: v => {
      const lv = contourLevels(num(v.min), num(v.max), num(v.step))
      const i = num(v.dist) > 0 ? num(v.step) / num(v.dist) : 0
      const major = lv.filter(z => Math.abs(z % (num(v.step) * 5)) < 1e-6).length
      return [
        { label: "Превышение рельефа", value: `${fx(num(v.max) - num(v.min))} м` },
        { label: "Всего горизонталей", value: String(lv.length) },
        { label: "Утолщённых (каждая 5-я)", value: String(major) },
        { label: "Уклон поверхности", value: `${fx(i * 1000, 1)} ‰ (${fx(i * 100)} %)` },
        { label: "Угол наклона", value: dms((Math.atan(i) * 180) / Math.PI) },
        { label: "Крутизна откоса", value: `1:${fx(i > 0 ? 1 / i : 0, 1)}` },
      ]
    },
    build: (v, a) => buildContours(a, num(v.min), num(v.max), num(v.step)),
    buildLabel: "Построить горизонтали",
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// ИНЖЕНЕРНЫЕ СЕТИ И ДРЕНАЖ
// ═══════════════════════════════════════════════════════════════════════════

const networkUpgrades: Record<string, Upgrade> = {
  // Гидравлика самотёчной сети
  "civil-2022-pressure": {
    desc: "Гидравлический расчёт самотёчного трубопровода по формуле Маннинга.",
    fields: [
      f("D", "Диаметр трубы", "300", "мм"),
      f("i", "Уклон", "5.0", "‰"),
      sel("mat", "Материал", "Полиэтилен", ["Полиэтилен", "Бетон", "Чугун", "Керамика", "Сталь"]),
      f("fill", "Наполнение h/D", "0.70"),
      f("len", "Длина участка", "180", "м"),
    ],
    outputLabel: "Гидравлический расчёт",
    compute: v => {
      const nMap: Record<string, number> = { "Полиэтилен": 0.010, "Бетон": 0.014, "Чугун": 0.013, "Керамика": 0.013, "Сталь": 0.012 }
      const D = num(v.D) / 1000, i = num(v.i) / 1000
      const n = nMap[v.mat] ?? 0.013
      const r = manning(D, i, n, num(v.fill))
      const imin = minPipeSlope(num(v.D))
      return [
        { label: "Пропускная способность Q", value: `${fx(r.Q * 1000, 2)} л/с (${fx(r.Q, 4)} м³/с)` },
        { label: "Скорость потока v", value: `${fx(r.v)} м/с` },
        { label: "Площадь живого сечения", value: `${fx(r.area, 4)} м²` },
        { label: "Гидравлический радиус", value: `${fx(r.R, 4)} м` },
        { label: "Мин. уклон (незаиливающий)", value: `${fx(imin * 1000, 2)} ‰` },
        { label: "Проверка уклона", value: i >= imin ? "✓ самоочищение обеспечено" : "✗ уклон мал, возможно заиливание" },
        { label: "Проверка скорости", value: r.v >= 0.7 && r.v <= 4 ? "✓ 0,7–4 м/с (норма)" : r.v < 0.7 ? "✗ ниже 0,7 м/с" : "✗ выше 4 м/с (износ)" },
        { label: "Падение на участке", value: `${fx(num(v.len) * i)} м` },
      ]
    },
    build: (v, a) => {
      const L = num(v.len)
      return buildPipeline([[a[0] - L / 2, a[1]], [a[0], a[1] + L * 0.12], [a[0] + L / 2, a[1]]],
        num(v.D) / 1000, String(v.mat), num(v.i) / 1000)
    },
    buildLabel: "Построить сеть",
  },

  // Подбор диаметра и ливневые стоки
  "civil-2023-property-sets": {
    desc: "Расчёт дождевого стока и подбор диаметра коллектора (СП 32.13330).",
    fields: [
      f("area", "Площадь водосбора", "12000", "м²"),
      f("q20", "Интенсивность q20", "80", "л/с·га"),
      f("psi", "Коэф. стока ψ", "0.65"),
      f("t", "Время концентрации", "10", "мин"),
      f("i", "Уклон коллектора", "5.0", "‰"),
    ],
    outputLabel: "Ливневая канализация",
    compute: v => {
      const s = stormFlow(num(v.area), num(v.q20), num(v.psi), num(v.t))
      const i = num(v.i) / 1000
      const D = selectDiameter(s.Q, i, 0.013, 0.7)
      const r = manning(D, i, 0.013, 0.7)
      return [
        { label: "Площадь водосбора", value: `${fx(num(v.area) / 10000, 3)} га` },
        { label: "Расчётная интенсивность", value: `${fx(s.intensity, 1)} л/с·га` },
        { label: "Расчётный расход Q", value: `${fx(s.Q * 1000, 2)} л/с` },
        { label: "Подобранный диаметр", value: `Ø${fx(D * 1000, 0)} мм` },
        { label: "Пропускная способность", value: `${fx(r.Q * 1000, 2)} л/с` },
        { label: "Скорость", value: `${fx(r.v)} м/с` },
        { label: "Запас пропускной способности", value: `${fx(s.Q > 0 ? ((r.Q - s.Q) / s.Q) * 100 : 0, 1)} %` },
      ]
    },
  },

  // Профиль сети по колодцам
  "civil-2024-pressure-parts": {
    desc: "Продольный профиль самотёчной сети: отметки лотков и глубины заложения колодцев.",
    fields: [
      f("start", "Отметка лотка начальная", "125.400", "м"),
      f("ground", "Отметка земли", "128.200", "м"),
      f("i", "Уклон", "5.0", "‰"),
      txt("lens", "Длины участков (через ;)", "45; 52; 38; 60"),
    ],
    outputLabel: "Профиль сети",
    compute: v => {
      const lens = String(v.lens).split(";").map(num).filter(n => n > 0)
      const prof = gravityProfile(num(v.start), num(v.i) / 1000, lens)
      const last = prof[prof.length - 1]
      const rows: Rows = prof.map(p => ({
        label: `Колодец К-${p.no} (L=${fx(p.len, 0)} м)`,
        value: `лоток ${fx(p.bottom, 3)} м, глубина ${fx(num(v.ground) - p.bottom)} м`,
      }))
      return [
        { label: "Всего участков", value: String(lens.length) },
        { label: "Общая длина сети", value: `${fx(lens.reduce((a, b) => a + b, 0))} м` },
        ...rows,
        { label: "Падение по сети", value: `${fx(num(v.start) - (last?.bottom ?? 0), 3)} м` },
        { label: "Макс. глубина заложения", value: `${fx(num(v.ground) - (last?.bottom ?? 0))} м` },
      ]
    },
    build: (v, a) => {
      const lens = String(v.lens).split(";").map(num).filter(n => n > 0)
      const pts: P2[] = [[a[0], a[1]]]
      lens.forEach((L, i) => pts.push([pts[i][0] + L, a[1] + Math.sin(i) * 8]))
      return buildPipeline(pts, 0.3, "Полиэтилен", num(v.i) / 1000)
    },
    buildLabel: "Построить профиль",
  },

  // Напорный трубопровод
  "civil-2027-gen-network": {
    desc: "Напорный трубопровод: потери напора по длине и требуемый напор насоса.",
    fields: [
      f("Q", "Расход", "45", "л/с"),
      f("D", "Диаметр", "200", "мм"),
      f("L", "Длина", "850", "м"),
      f("dz", "Геодезическая высота подъёма", "18.5", "м"),
      f("lam", "Коэф. гидр. трения λ", "0.03"),
    ],
    outputLabel: "Напорный расчёт",
    compute: v => {
      const Q = num(v.Q) / 1000, D = num(v.D) / 1000
      const A = (Math.PI * D * D) / 4
      const vel = A > 0 ? Q / A : 0
      const hl = headLoss(num(v.L), D, vel, num(v.lam))
      const hloc = hl * 0.1
      const H = num(v.dz) + hl + hloc
      return [
        { label: "Скорость в трубе", value: `${fx(vel)} м/с` },
        { label: "Потери по длине", value: `${fx(hl)} м` },
        { label: "Местные потери (10%)", value: `${fx(hloc)} м` },
        { label: "Геодезический подъём", value: `${fx(num(v.dz))} м` },
        { label: "Требуемый напор насоса", value: `${fx(H)} м` },
        { label: "Мощность насоса (КПД 0,7)", value: `${fx((9.81 * Q * H) / 0.7, 2)} кВт` },
        { label: "Проверка скорости", value: vel >= 0.9 && vel <= 3 ? "✓ экономичный диапазон" : "✗ вне 0,9–3 м/с" },
      ]
    },
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// ДОКУМЕНТАЦИЯ И ЧЕРТЕЖИ
// ═══════════════════════════════════════════════════════════════════════════

const docsUpgrades: Record<string, Upgrade> = {
  // Раскладка листов
  "acad-2022-pushbutton": {
    desc: "Раскладка листов вдоль трассы: количество, охват, масштаб (ГОСТ Р 21.1101).",
    fields: [
      f("len", "Длина трассы", "2400", "м"),
      sel("sheet", "Формат листа", "A3", ["A0", "A1", "A2", "A3", "A4"]),
      sel("scale", "Масштаб", "1:500", ["1:100", "1:200", "1:500", "1:1000", "1:2000"]),
      f("ov", "Перекрытие листов", "10", "%"),
    ],
    outputLabel: "Раскладка листов",
    compute: v => {
      const sc = scaleFactor(String(v.scale))
      const r = sheetCount(num(v.len), String(v.sheet), sc, num(v.ov))
      const [w, h] = SHEETS[String(v.sheet)] ?? SHEETS.A3
      return [
        { label: "Формат", value: `${v.sheet} (${w}×${h} мм)` },
        { label: "Масштаб", value: String(v.scale) },
        { label: "Охват одного листа", value: `${fx(r.coverage)} м` },
        { label: "Требуется листов", value: String(r.count) },
        { label: "Длина трассы", value: `${fmtBig(num(v.len))} м` },
        { label: "Натурный размер листа", value: `${fx((w / 1000) * sc)} × ${fx((h / 1000) * sc)} м` },
      ]
    },
    build: (v, a) => {
      const sc = scaleFactor(String(v.scale))
      const [w, h] = SHEETS[String(v.sheet)] ?? SHEETS.A3
      const r = sheetCount(num(v.len), String(v.sheet), sc, num(v.ov))
      const L = num(v.len)
      return buildSheets([[a[0] - L / 2, a[1]], [a[0] + L / 2, a[1]]], r.count, (w / 1000) * sc, (h / 1000) * sc)
    },
    buildLabel: "Разложить листы",
  },

  // Ведомость объёмов работ
  "acad-2022-count": {
    desc: "Ведомость объёмов работ: подсчёт количества, стоимости и итога по смете.",
    fields: [
      txt("items", "Позиции (имя,кол-во,ед,цена через ;)", "Светильник,48,шт,12500; Опора,24,шт,34000; Кабель,860,м,320"),
      f("k", "Коэф. непредвиденных", "1.05"),
    ],
    outputLabel: "Ведомость объёмов",
    compute: v => {
      const items = String(v.items).split(";").map(s => {
        const [name, qty, unit, price] = s.trim().split(",")
        return { name: name || "—", qty: num(qty), unit: unit || "шт", price: num(price) }
      }).filter(i => i.name !== "—")
      const rows: Rows = items.map(i => ({
        label: `${i.name} (${fx(i.qty, 0)} ${i.unit})`,
        value: `${fmtBig(i.qty * i.price, 0)} ₽`,
      }))
      const total = items.reduce((a, i) => a + i.qty * i.price, 0)
      return [
        ...rows,
        { label: "Итого по ведомости", value: `${fmtBig(total, 0)} ₽` },
        { label: `С непредвиденными ×${v.k}`, value: `${fmtBig(total * num(v.k), 0)} ₽` },
        { label: "НДС 20%", value: `${fmtBig(total * num(v.k) * 0.2, 0)} ₽` },
        { label: "Всего с НДС", value: `${fmtBig(total * num(v.k) * 1.2, 0)} ₽` },
      ]
    },
    build: v => {
      const items = String(v.items).split(";").map(s => {
        const [name, qty, unit, price] = s.trim().split(",")
        return { label: `${name} (${fx(num(qty), 0)} ${unit || "шт"})`, value: `${fmtBig(num(qty) * num(price), 0)} р.` }
      })
      return buildTable([0, 0], "ВЕДОМОСТЬ ОБЪЁМОВ РАБОТ", items)
    },
    buildLabel: "Разместить ведомость",
  },

  // Масштаб и размеры на чертеже
  "acad-2023-count-toolbar": {
    desc: "Пересчёт размеров между натурой и чертежом для заданного масштаба.",
    fields: [
      sel("scale", "Масштаб", "1:500", ["1:100", "1:200", "1:500", "1:1000", "1:2000", "1:5000"]),
      f("real", "Размер в натуре", "250.00", "м"),
      f("paper", "Размер на бумаге", "50.0", "мм"),
      f("text", "Высота текста на бумаге", "2.5", "мм"),
    ],
    outputLabel: "Пересчёт масштаба",
    compute: v => {
      const sc = scaleFactor(String(v.scale))
      return [
        { label: "Масштабный коэффициент", value: `1:${sc}` },
        { label: "Натура → бумага", value: `${fx(num(v.real))} м = ${fx((num(v.real) * 1000) / sc, 1)} мм` },
        { label: "Бумага → натура", value: `${fx(num(v.paper), 1)} мм = ${fx((num(v.paper) * sc) / 1000)} м` },
        { label: "Высота текста в натуре", value: `${fx((num(v.text) * sc) / 1000)} м` },
        { label: "Точность масштаба", value: `${fx((0.1 * sc) / 1000, 3)} м (0,1 мм)` },
        { label: "1 см на чертеже", value: `${fx(sc / 100)} м в натуре` },
      ]
    },
  },

  // Подписи объектов
  "acad-2023-mtext": {
    desc: "Автоматические выноски и подписи объектов с расчётными значениями.",
    fields: [
      txt("label", "Текст подписи", "ПК 12+50 H=142,35"),
      f("x", "X размещения", "0"),
      f("y", "Y размещения", "0"),
      f("h", "Высота текста", "2.5", "мм"),
      sel("scale", "Масштаб", "1:500", ["1:100", "1:200", "1:500", "1:1000"]),
    ],
    outputLabel: "Аннотация",
    compute: v => {
      const sc = scaleFactor(String(v.scale))
      return [
        { label: "Текст", value: String(v.label) },
        { label: "Позиция", value: `X=${fx(num(v.x), 2)}, Y=${fx(num(v.y), 2)}` },
        { label: "Высота в натуре", value: `${fx((num(v.h) * sc) / 1000)} м` },
        { label: "Длина текста", value: `${fx((String(v.label).length * num(v.h) * 0.7 * sc) / 1000)} м` },
      ]
    },
    build: v => buildLabel([num(v.x), num(v.y)], String(v.label)),
    buildLabel: "Поставить выноску",
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// ВТОРАЯ ВОЛНА: геодезия (COGO), обмен форматами, планировка
// ═══════════════════════════════════════════════════════════════════════════

const wave2: Record<string, Upgrade> = {
  // Обратная геодезическая задача
  "survey-cogo-inverse": {
    desc: "Обратная геодезическая задача: дирекционный угол, румб и расстояние между точками.",
    fields: [
      f("x1", "X точки 1", "0"), f("y1", "Y точки 1", "0"),
      f("x2", "X точки 2", "125.400"), f("y2", "Y точки 2", "86.750"),
    ],
    outputLabel: "Обратная задача",
    compute: v => {
      const a: P2 = [num(v.x1), num(v.y1)], b: P2 = [num(v.x2), num(v.y2)]
      const r = inverseGeo(a, b)
      const q = r.bearing
      const rumb = q <= 90 ? `СВ ${dms(q)}` : q <= 180 ? `ЮВ ${dms(180 - q)}` : q <= 270 ? `ЮЗ ${dms(q - 180)}` : `СЗ ${dms(360 - q)}`
      return [
        { label: "Расстояние", value: `${fx(r.distance, 3)} м` },
        { label: "Дирекционный угол", value: dms(r.bearing) },
        { label: "Румб", value: rumb },
        { label: "Приращение ΔX", value: `${fx(b[0] - a[0], 3)} м` },
        { label: "Приращение ΔY", value: `${fx(b[1] - a[1], 3)} м` },
        { label: "Обратный дир. угол", value: dms((r.bearing + 180) % 360) },
      ]
    },
    build: v => buildFromBearing([num(v.x1), num(v.y1)],
      inverseGeo([num(v.x1), num(v.y1)], [num(v.x2), num(v.y2)]).bearing,
      inverseGeo([num(v.x1), num(v.y1)], [num(v.x2), num(v.y2)]).distance),
    buildLabel: "Построить линию",
  },

  // Нивелирный ход постанционно
  "survey-leveling": {
    desc: "Обработка нивелирного хода: невязка, допуск, поправки и отметки связующих точек.",
    fields: [
      f("h1", "Отметка Rp начального", "125.430", "м"),
      f("h2", "Отметка Rp конечного", "131.870", "м"),
      txt("dh", "Превышения (через ;)", "1.245; 2.108; 1.532; 1.567"),
      f("len", "Длина хода", "1.8", "км"),
    ],
    outputLabel: "Обработка нивелирования",
    compute: v => {
      const dh = String(v.dh).split(";").map(num)
      const sum = dh.reduce((a, b) => a + b, 0)
      const r = levelingCheck(num(v.h1), num(v.h2), sum, num(v.len))
      const corr = -r.f / Math.max(dh.length, 1)
      let z = num(v.h1)
      const rows: Rows = dh.map((d, i) => {
        z += d + corr
        return { label: `Точка ${i + 1} (h=${fx(d, 3)})`, value: `H = ${fx(z, 3)} м` }
      })
      return [
        { label: "Сумма превышений", value: `${fx(sum, 3)} м` },
        { label: "Теоретическая сумма", value: `${fx(num(v.h2) - num(v.h1), 3)} м` },
        { label: "Невязка fh", value: `${fx(r.fMm, 1)} мм (доп. ±${fx(r.tolMm, 1)} мм)` },
        { label: "Оценка", value: r.ok ? "✓ в допуске" : "✗ превышение допуска" },
        { label: "Поправка на превышение", value: `${fx(corr * 1000, 2)} мм` },
        ...rows,
      ]
    },
  },

  // Уравнивание сети
  "survey-network-adjust": {
    desc: "Оценка точности геодезической сети: СКП, предельная погрешность, доверительный интервал.",
    fields: [
      txt("vals", "Измерения (через ;)", "125.432; 125.445; 125.418; 125.440; 125.427"),
      f("t", "Коэф. надёжности", "2.5"),
    ],
    outputLabel: "Уравнивание сети",
    compute: v => {
      const vals = String(v.vals).split(";").map(num).filter(Number.isFinite)
      const m = vals.reduce((a, b) => a + b, 0) / Math.max(vals.length, 1)
      const s = rmse(vals)
      const sm = s / Math.sqrt(Math.max(vals.length, 1))
      return [
        { label: "Число измерений n", value: String(vals.length) },
        { label: "Уравненное значение", value: `${fx(m, 4)} м` },
        { label: "СКП измерения m", value: `±${fx(s * 1000, 2)} мм` },
        { label: "СКП среднего M", value: `±${fx(sm * 1000, 2)} мм` },
        { label: "Предельная погрешность", value: `±${fx(num(v.t) * s * 1000, 2)} мм` },
        { label: "Доверительный интервал", value: `${fx(m - num(v.t) * sm, 4)} … ${fx(m + num(v.t) * sm, 4)} м` },
        { label: "Относительная точность", value: `1:${fmtBig(m > 0 && s > 0 ? Math.round(m / s) : 0, 0)}` },
      ]
    },
  },

  // Отчёт по съёмке
  "survey-report": {
    desc: "Ведомость координат по контуру: приращения, дирекционные углы, длины сторон, площадь.",
    fields: [txt("pts", "Точки контура (x,y через ;)", "0,0; 120,15; 190,110; 60,140")],
    outputLabel: "Ведомость координат",
    compute: v => {
      const pts = parsePts(v.pts)
      if (pts.length < 3) return [{ label: "Ошибка", value: "нужно минимум 3 точки" }]
      const rows: Rows = pts.map((p, i) => {
        const nx = pts[(i + 1) % pts.length]
        return {
          label: `${i + 1}→${((i + 1) % pts.length) + 1}`,
          value: `d=${fx(Math.hypot(nx[0] - p[0], nx[1] - p[1]))} м, α=${dms(inverseGeo(p, nx).bearing)}`,
        }
      })
      const A = polyArea(pts)
      return [
        ...rows,
        { label: "Периметр", value: `${fx(polyLength([...pts, pts[0]]))} м` },
        { label: "Площадь", value: `${fmtBig(A)} м² (${fx(A / 10000, 4)} га)` },
      ]
    },
    build: v => buildBoundary(parsePts(v.pts), "Контур съёмки"),
    buildLabel: "Построить контур",
  },

  // Обмен LandXML
  "interop-landxml": {
    desc: "Оценка объёма данных при обмене LandXML: точки, поверхности, трассы, размер файла.",
    fields: [
      f("pts", "Точек съёмки", "18000"),
      f("surf", "Поверхностей", "3"),
      f("align", "Трасс", "2"),
      sel("dir", "Направление", "Экспорт", ["Экспорт", "Импорт"]),
    ],
    outputLabel: "Обмен LandXML",
    compute: v => {
      const p = num(v.pts)
      const tin = Math.round(p * 1.93)
      const size = (p * 78 + tin * 46) / 1048576
      return [
        { label: "Точек", value: fmtBig(p, 0) },
        { label: "Треугольников TIN", value: fmtBig(tin, 0) },
        { label: "Поверхностей / трасс", value: `${v.surf} / ${v.align}` },
        { label: "Размер файла XML", value: `${fx(size)} МБ` },
        { label: "В сжатом виде (zip)", value: `${fx(size * 0.18)} МБ` },
        { label: "Время операции", value: `~${fx(p / 24000 + num(v.surf) * 1.5, 1)} с` },
      ]
    },
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// ТРЕТЬЯ ВОЛНА: черчение — реальная геометрия прямо на холсте
// ═══════════════════════════════════════════════════════════════════════════

const drawUpgrades: Record<string, Upgrade> = {
  "acad-draw-line": {
    desc: "Построение отрезка по координатам: длина, угол наклона, приращения, румб.",
    fields: [f("x1", "X начала", "0"), f("y1", "Y начала", "0"), f("x2", "X конца", "100"), f("y2", "Y конца", "50")],
    outputLabel: "Отрезок",
    compute: v => {
      const a: P2 = [num(v.x1), num(v.y1)], b: P2 = [num(v.x2), num(v.y2)]
      const r = inverseGeo(a, b)
      const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI
      return [
        { label: "Длина отрезка", value: `${fx(r.distance, 3)} мм` },
        { label: "Угол к оси X", value: dms((ang + 360) % 360) },
        { label: "Дирекционный угол", value: dms(r.bearing) },
        { label: "Приращение ΔX", value: `${fx(b[0] - a[0], 3)} мм` },
        { label: "Приращение ΔY", value: `${fx(b[1] - a[1], 3)} мм` },
        { label: "Середина отрезка", value: `${fx((a[0] + b[0]) / 2, 2)}, ${fx((a[1] + b[1]) / 2, 2)}` },
      ]
    },
    build: v => buildSegment([num(v.x1), num(v.y1)], [num(v.x2), num(v.y2)]),
    buildLabel: "Начертить отрезок",
  },

  "acad-draw-circle": {
    desc: "Окружность: длина, площадь, диаметр, площадь вписанного и описанного квадрата.",
    fields: [f("r", "Радиус", "25", "мм"), f("x", "X центра", "0"), f("y", "Y центра", "0")],
    outputLabel: "Окружность",
    compute: v => {
      const r = num(v.r)
      return [
        { label: "Диаметр", value: `${fx(2 * r)} мм` },
        { label: "Длина окружности", value: `${fx(2 * Math.PI * r)} мм` },
        { label: "Площадь круга", value: `${fmtBig(Math.PI * r * r)} мм²` },
        { label: "Вписанный квадрат", value: `${fx(r * Math.SQRT2)} мм (сторона)` },
        { label: "Описанный квадрат", value: `${fx(2 * r)} мм (сторона)` },
        { label: "Центр", value: `${fx(num(v.x), 2)}, ${fx(num(v.y), 2)}` },
      ]
    },
    build: v => buildCircle([num(v.x), num(v.y)], num(v.r)),
    buildLabel: "Начертить круг",
  },

  "acad-draw-rectangle": {
    desc: "Прямоугольник: периметр, площадь, диагональ, соотношение сторон.",
    fields: [f("w", "Ширина", "120", "мм"), f("h", "Высота", "80", "мм"), f("x", "X центра", "0"), f("y", "Y центра", "0")],
    outputLabel: "Прямоугольник",
    compute: v => {
      const w = num(v.w), h = num(v.h)
      return [
        { label: "Площадь", value: `${fmtBig(w * h)} мм²` },
        { label: "Периметр", value: `${fx(2 * (w + h))} мм` },
        { label: "Диагональ", value: `${fx(Math.hypot(w, h))} мм` },
        { label: "Соотношение сторон", value: `1 : ${fx(h > 0 ? w / h : 0, 3)}` },
        { label: "Угол диагонали", value: dms((Math.atan2(h, w) * 180) / Math.PI) },
      ]
    },
    build: v => buildRect([num(v.x), num(v.y)], num(v.w), num(v.h)),
    buildLabel: "Начертить прямоугольник",
  },

  "acad-draw-polygon": {
    desc: "Правильный многоугольник: сторона, площадь, углы, радиусы вписанной и описанной.",
    fields: [f("n", "Число сторон", "6"), f("r", "Радиус описанной", "50", "мм"), f("x", "X центра", "0"), f("y", "Y центра", "0")],
    outputLabel: "Многоугольник",
    compute: v => {
      const n = Math.max(3, Math.round(num(v.n))), R = num(v.r)
      const side = 2 * R * Math.sin(Math.PI / n)
      const r = R * Math.cos(Math.PI / n)
      return [
        { label: "Длина стороны", value: `${fx(side)} мм` },
        { label: "Радиус вписанной (апофема)", value: `${fx(r)} мм` },
        { label: "Площадь", value: `${fmtBig((n * side * r) / 2)} мм²` },
        { label: "Периметр", value: `${fx(n * side)} мм` },
        { label: "Внутренний угол", value: dms(((n - 2) * 180) / n) },
        { label: "Центральный угол", value: dms(360 / n) },
      ]
    },
    build: v => buildPolygon([num(v.x), num(v.y)], num(v.n), num(v.r)),
    buildLabel: "Начертить многоугольник",
  },

  "acad-draw-offset": {
    desc: "Подобие: серия параллельных контуров с заданным шагом смещения.",
    fields: [f("dist", "Расстояние", "10", "мм"), f("n", "Число копий", "3"), f("size", "Размер базового контура", "80", "мм")],
    outputLabel: "Подобие",
    compute: v => {
      const d = num(v.dist), n = Math.max(1, Math.round(num(v.n))), s = num(v.size)
      return [
        { label: "Создано копий", value: String(n) },
        { label: "Шаг смещения", value: `${fx(d)} мм` },
        { label: "Суммарное смещение", value: `${fx(d * n)} мм` },
        { label: "Габарит внешнего контура", value: `${fx(s + 2 * d * n)} мм` },
        { label: "Прирост площади", value: `${fmtBig((s + 2 * d * n) ** 2 - s * s)} мм²` },
      ]
    },
    build: (v, a) => {
      const s = num(v.size) / 2
      const base: P2[] = [[a[0] - s, a[1] - s], [a[0] + s, a[1] - s], [a[0] + s, a[1] + s], [a[0] - s, a[1] + s], [a[0] - s, a[1] - s]]
      return buildOffsets(base, num(v.dist), num(v.n))
    },
    buildLabel: "Построить подобия",
  },

  "acad-draw-array": {
    desc: "Прямоугольный массив: количество элементов, габариты, суммарный шаг.",
    fields: [f("rows", "Строк", "4"), f("cols", "Столбцов", "6"), f("dr", "Шаг по строке", "20", "мм"), f("dc", "Шаг по столбцу", "20", "мм")],
    outputLabel: "Массив",
    compute: v => {
      const R = Math.max(1, Math.round(num(v.rows))), C = Math.max(1, Math.round(num(v.cols)))
      const W = (C - 1) * num(v.dc), H = (R - 1) * num(v.dr)
      return [
        { label: "Всего элементов", value: String(R * C) },
        { label: "Габарит массива", value: `${fx(W)} × ${fx(H)} мм` },
        { label: "Площадь охвата", value: `${fmtBig(W * H)} мм²` },
        { label: "Диагональ массива", value: `${fx(Math.hypot(W, H))} мм` },
        { label: "Плотность", value: `${fx(W * H > 0 ? (R * C) / (W * H / 1e6) : 0, 1)} шт/м²` },
      ]
    },
    build: (v, a) => buildArray(a, num(v.rows), num(v.cols), num(v.dr), num(v.dc)),
    buildLabel: "Построить массив",
  },

  "acad-draw-fillet": {
    desc: "Сопряжение: длина дуги, координаты точек касания, срезаемая площадь.",
    fields: [f("r", "Радиус сопряжения", "8", "мм"), f("ang", "Угол между сторонами", "90", "°")],
    outputLabel: "Сопряжение",
    compute: v => {
      const r = num(v.r), a = (num(v.ang) * Math.PI) / 180
      const T = r / Math.tan(a / 2)
      const K = r * (Math.PI - a)
      return [
        { label: "Длина дуги сопряжения", value: `${fx(K)} мм` },
        { label: "Расстояние до точки касания", value: `${fx(T)} мм` },
        { label: "Срезаемая площадь", value: `${fx(T * T * Math.tan(a / 2) - (r * r * (Math.PI - a)) / 2)} мм²` },
        { label: "Угол дуги", value: dms(180 - num(v.ang)) },
        { label: "Хорда сопряжения", value: `${fx(2 * r * Math.sin((Math.PI - a) / 2))} мм` },
      ]
    },
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// ЧЕТВЁРТАЯ ВОЛНА: редактирование, 3D-тела, слои, блоки
// ═══════════════════════════════════════════════════════════════════════════

const editUpgrades: Record<string, Upgrade> = {
  "acad-modify-move": {
    desc: "Перенос объектов: вектор смещения, азимут, новые координаты базовой точки.",
    fields: [f("dx", "Смещение X", "50"), f("dy", "Смещение Y", "-30"), f("x", "X базовой точки", "0"), f("y", "Y базовой точки", "0")],
    outputLabel: "Перенос",
    compute: v => {
      const dx = num(v.dx), dy = num(v.dy)
      return [
        { label: "Длина вектора", value: `${fx(Math.hypot(dx, dy), 3)} мм` },
        { label: "Угол к оси X", value: dms(((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360) },
        { label: "Дирекционный угол", value: dms(inverseGeo([0, 0], [dx, dy]).bearing) },
        { label: "Новая X", value: fx(num(v.x) + dx, 3) },
        { label: "Новая Y", value: fx(num(v.y) + dy, 3) },
      ]
    },
    build: (v, a) => {
      const s = 40
      const base: P2[] = [[a[0] - s, a[1] - s], [a[0] + s, a[1] - s], [a[0] + s, a[1] + s], [a[0] - s, a[1] + s], [a[0] - s, a[1] - s]]
      return buildTransform(base, num(v.dx), num(v.dy), 0, 1)
    },
    buildLabel: "Показать перенос",
  },

  "acad-modify-rotate": {
    desc: "Поворот объектов: угол в градусах и радианах, смещение точки на заданном радиусе.",
    fields: [f("ang", "Угол поворота", "45", "°"), f("r", "Радиус точки от центра", "100", "мм")],
    outputLabel: "Поворот",
    compute: v => {
      const a = num(v.ang), r = num(v.r)
      const rad = (a * Math.PI) / 180
      return [
        { label: "Угол поворота", value: dms(a) },
        { label: "В радианах", value: `${fx(rad, 6)} рад` },
        { label: "Длина дуги перемещения", value: `${fx(r * Math.abs(rad), 3)} мм` },
        { label: "Хорда перемещения", value: `${fx(2 * r * Math.sin(Math.abs(rad) / 2), 3)} мм` },
        { label: "Новые координаты точки", value: `${fx(r * Math.cos(rad), 3)}, ${fx(r * Math.sin(rad), 3)}` },
      ]
    },
    build: (v, a) => {
      const s = 40
      const base: P2[] = [[a[0] - s, a[1] - s], [a[0] + s, a[1] - s], [a[0] + s, a[1] + s], [a[0] - s, a[1] + s], [a[0] - s, a[1] - s]]
      return buildTransform(base, 0, 0, num(v.ang), 1)
    },
    buildLabel: "Показать поворот",
  },

  "acad-modify-scale": {
    desc: "Масштабирование: изменение длин, площадей и объёмов, пересчёт размеров.",
    fields: [f("k", "Коэффициент", "1.5"), f("L", "Исходный размер", "120", "мм"), f("A", "Исходная площадь", "9600", "мм²")],
    outputLabel: "Масштабирование",
    compute: v => {
      const k = num(v.k)
      return [
        { label: "Линейный масштаб", value: `${fx(k, 3)}×` },
        { label: "Масштаб площади", value: `${fx(k * k, 3)}×` },
        { label: "Масштаб объёма", value: `${fx(k * k * k, 3)}×` },
        { label: "Новый размер", value: `${fx(num(v.L) * k, 2)} мм` },
        { label: "Новая площадь", value: `${fmtBig(num(v.A) * k * k)} мм²` },
        { label: "Изменение площади", value: `${k >= 1 ? "+" : ""}${fx((k * k - 1) * 100, 1)} %` },
      ]
    },
    build: (v, a) => {
      const s = 40
      const base: P2[] = [[a[0] - s, a[1] - s], [a[0] + s, a[1] - s], [a[0] + s, a[1] + s], [a[0] - s, a[1] + s], [a[0] - s, a[1] - s]]
      return buildTransform(base, 0, 0, 0, num(v.k))
    },
    buildLabel: "Показать масштаб",
  },

  "acad-3d-extrude": {
    desc: "Выдавливание: объём тела, масса по плотности, площадь поверхности.",
    fields: [
      f("w", "Ширина профиля", "40", "мм"), f("d", "Глубина профиля", "30", "мм"),
      f("h", "Высота выдавливания", "300", "мм"),
      sel("mat", "Материал", "Сталь", ["Сталь", "Бетон", "Алюминий", "Дерево", "Пластик"]),
    ],
    outputLabel: "Тело выдавливания",
    compute: v => {
      const ro: Record<string, number> = { "Сталь": 7850, "Бетон": 2400, "Алюминий": 2700, "Дерево": 650, "Пластик": 1200 }
      const w = num(v.w), d = num(v.d), h = num(v.h)
      const Vmm = w * d * h
      const Vm = Vmm / 1e9
      const S = 2 * (w * d) + 2 * h * (w + d)
      return [
        { label: "Площадь профиля", value: `${fmtBig(w * d)} мм²` },
        { label: "Объём тела", value: `${fx(Vmm / 1000, 1)} см³ (${fx(Vm, 6)} м³)` },
        { label: "Площадь поверхности", value: `${fmtBig(S)} мм²` },
        { label: "Материал", value: String(v.mat) },
        { label: "Масса", value: `${fx(Vm * (ro[String(v.mat)] ?? 1000), 3)} кг` },
        { label: "Отношение H/ширина", value: fx(w > 0 ? h / w : 0, 2) },
      ]
    },
    build: (v, a) => buildSolidFootprint(a, num(v.w), num(v.d), num(v.h), "Тело выдавливания"),
    buildLabel: "Построить габарит",
  },

  "acad-3d-revolve": {
    desc: "Тело вращения по теореме Гульдина: объём, площадь поверхности, масса.",
    fields: [
      f("area", "Площадь профиля", "500", "мм²"),
      f("rc", "R центра тяжести", "40", "мм"),
      f("ang", "Угол вращения", "360", "°"),
      f("per", "Периметр профиля", "90", "мм"),
    ],
    outputLabel: "Тело вращения",
    compute: v => {
      const A = num(v.area), rc = num(v.rc), ang = num(v.ang), per = num(v.per)
      const k = ang / 360
      const V = 2 * Math.PI * rc * A * k
      const S = 2 * Math.PI * rc * per * k
      return [
        { label: "Путь центра тяжести", value: `${fx(2 * Math.PI * rc * k, 2)} мм` },
        { label: "Объём (Гульдин)", value: `${fx(V / 1000, 2)} см³` },
        { label: "Площадь поверхности", value: `${fmtBig(S)} мм²` },
        { label: "Угол вращения", value: dms(ang) },
        { label: "Габаритный диаметр", value: `${fx(2 * rc)} мм` },
        { label: "Масса (сталь)", value: `${fx((V / 1e9) * 7850, 3)} кг` },
      ]
    },
    build: (v, a) => buildSolidFootprint(a, 2 * num(v.rc), 2 * num(v.rc), num(v.area) / 10, "Тело вращения"),
    buildLabel: "Построить габарит",
  },

  "acad-layer-new": {
    desc: "Создание слоя по ГОСТ: вес линии, толщина на печати, масштаб типа линии.",
    fields: [
      txt("name", "Имя слоя", "Оси"),
      sel("color", "Цвет", "Красный", ["Красный", "Жёлтый", "Зелёный", "Голубой", "Синий", "Белый"]),
      sel("lw", "Вес линии", "0.25", ["0.13", "0.18", "0.25", "0.35", "0.50", "0.70", "1.00"]),
      sel("scale", "Масштаб чертежа", "1:500", ["1:100", "1:200", "1:500", "1:1000"]),
    ],
    outputLabel: "Параметры слоя",
    compute: v => {
      const lw = num(v.lw), sc = scaleFactor(String(v.scale))
      return [
        { label: "Имя слоя", value: String(v.name) },
        { label: "Цвет / вес линии", value: `${v.color}, ${fx(lw, 2)} мм` },
        { label: "Толщина в натуре", value: `${fx((lw * sc) / 1000, 3)} м` },
        { label: "Масштаб типа линии", value: fx(sc / 1000, 3) },
        { label: "Длина штриха в натуре", value: `${fx((3 * sc) / 1000, 2)} м` },
        { label: "Рекомендация ГОСТ", value: lw >= 0.5 ? "основная линия" : lw >= 0.25 ? "тонкая линия" : "вспомогательная" },
      ]
    },
  },

  "acad-block-insert": {
    desc: "Вставка блоков: количество, шаг расстановки, габариты ряда, длина трассы установки.",
    fields: [
      txt("name", "Имя блока", "СВЕТИЛЬНИК"),
      f("sx", "Масштаб", "1"), f("rot", "Поворот", "0", "°"),
      f("n", "Количество", "8"), f("step", "Шаг расстановки", "30", "м"),
    ],
    outputLabel: "Расстановка блоков",
    compute: v => {
      const n = Math.max(1, Math.round(num(v.n))), st = num(v.step)
      return [
        { label: "Блок", value: String(v.name) },
        { label: "Количество", value: `${n} шт.` },
        { label: "Шаг расстановки", value: `${fx(st)} м` },
        { label: "Длина ряда", value: `${fx((n - 1) * st)} м` },
        { label: "Масштаб / поворот", value: `${fx(num(v.sx), 2)}× / ${dms(num(v.rot))}` },
        { label: "Плотность", value: `${fx(st > 0 ? 1000 / st : 0, 1)} шт/км` },
      ]
    },
    build: (v, a) => buildBlockInsert(a, String(v.name), num(v.sx), num(v.rot), num(v.n), num(v.step)),
    buildLabel: "Расставить блоки",
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// Сводная карта усилений
// ═══════════════════════════════════════════════════════════════════════════

export const UPGRADES: Record<string, Upgrade> = {
  ...surveyUpgrades,
  ...roadUpgrades,
  ...surfaceUpgrades,
  ...networkUpgrades,
  ...docsUpgrades,
  ...wave2,
  ...drawUpgrades,
  ...editUpgrades,
}

/** Применить усиление к функции каталога */
export const applyUpgrade = (feat: VersionFeatureFull): VersionFeatureFull => {
  const u = UPGRADES[feat.id]
  if (!u) return feat
  return {
    ...feat,
    desc: u.desc ?? feat.desc,
    fields: u.fields ?? feat.fields,
    outputLabel: u.outputLabel ?? feat.outputLabel,
    compute: u.compute ?? feat.compute,
    build: u.build ?? feat.build,
    buildLabel: u.buildLabel ?? feat.buildLabel,
  }
}

/** Есть ли у функции реальный расчёт и/или построение */
export const isUpgraded = (id: string): boolean => Boolean(UPGRADES[id])
export const hasBuild = (id: string): boolean => Boolean(UPGRADES[id]?.build)