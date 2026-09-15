// ═══════════════════════════════════════════════════════════════════════════
// Рабочие расчёты для машиностроения: КОМПАС-3D v24 и SOLIDWORKS.
// Прочность (МКЭ), листовой металл, передачи, литьё, раскрой, сварка, CFD.
// ═══════════════════════════════════════════════════════════════════════════

import type { Upgrade } from "./versions-upgrades"
import {
  num, fx, fmtBig, DENSITY, YOUNG, SHRINKAGE, stress, safetyFactor, hooke,
  beamDeflection, inertiaRect, bendAllowance, minBendRadius, bendForce,
  gearDrive, torque, naturalFreq, fatigue, reynolds, flowRegime,
  coolingTime, nesting, partMass, welding,
} from "@/utils/engCalc"

const f = (key: string, label: string, def: string, suffix?: string) =>
  ({ key, label, type: "number" as const, default: def, suffix })
const sel = (key: string, label: string, def: string, options: string[]) =>
  ({ key, label, type: "select" as const, default: def, options })
const txt = (key: string, label: string, def: string) =>
  ({ key, label, type: "text" as const, default: def })

const MATS = ["Сталь", "Чугун", "Алюминий", "Титан", "Медь", "Латунь", "Пластик"]

export const mechUpgrades: Record<string, Upgrade> = {

  // ─── ПРОЧНОСТЬ (МКЭ) ──────────────────────────────────────────────────────

  "sw-sim-static": {
    desc: "Линейный статический расчёт: напряжения, деформации, запас прочности, прогиб.",
    fields: [
      f("force", "Нагрузка", "3000", "Н"),
      f("area", "Площадь сечения", "200", "мм²"),
      f("yield", "Предел текучести", "250", "МПа"),
      f("len", "Длина элемента", "500", "мм"),
      sel("mat", "Материал", "Сталь", MATS),
    ],
    outputLabel: "Статический расчёт",
    compute: v => {
      const F = num(v.force), A = num(v.area), Y = num(v.yield), L = num(v.len)
      const E = YOUNG[String(v.mat)] ?? 210000
      const s = stress(F, A)
      const n = safetyFactor(Y, s)
      const h = hooke(s, E, L)
      return [
        { label: "Нормальное напряжение σ", value: `${fx(s, 2)} МПа` },
        { label: "Предел текучести", value: `${fx(Y, 0)} МПа` },
        { label: "Запас прочности n", value: `${n === Infinity ? "∞" : fx(n, 2)}` },
        { label: "Оценка", value: n >= 2 ? "✓ прочность обеспечена" : n >= 1.5 ? "⚠ запас на пределе" : "✗ недостаточная прочность" },
        { label: "Относительная деформация", value: `${fx(h.strainPct, 4)} %` },
        { label: "Удлинение", value: `${fx(h.elongation, 4)} мм` },
        { label: "Использование материала", value: `${fx(Y > 0 ? (s / Y) * 100 : 0, 1)} %` },
      ]
    },
  },

  "sw-sim-fatigue": {
    desc: "Усталостная прочность по кривой Вёлера: запас, ресурс в циклах и часах.",
    fields: [
      f("amp", "Амплитуда напряжений", "120", "МПа"),
      f("limit", "Предел выносливости", "180", "МПа"),
      f("freq", "Частота нагружения", "5", "Гц"),
    ],
    outputLabel: "Усталостный расчёт",
    compute: v => {
      const r = fatigue(num(v.amp), num(v.limit))
      const hours = r.infinite ? Infinity : r.cycles / (num(v.freq) * 3600)
      return [
        { label: "Амплитуда / предел", value: `${fx(num(v.amp), 1)} / ${fx(num(v.limit), 1)} МПа` },
        { label: "Запас по выносливости", value: r.safety === Infinity ? "∞" : fx(r.safety, 2) },
        { label: "Ресурс", value: r.infinite ? "неограниченный (ниже предела)" : `${fmtBig(r.cycles, 0)} циклов` },
        { label: "Наработка", value: r.infinite ? "не лимитируется" : `${fmtBig(hours, 0)} ч` },
        { label: "Оценка", value: r.infinite ? "✓ бесконечный ресурс" : r.safety > 1 ? "⚠ ограниченный ресурс" : "✗ быстрое разрушение" },
      ]
    },
  },

  "sw-sim-modal": {
    desc: "Модальный анализ: собственные частоты, период, критические обороты, резонанс.",
    fields: [
      f("k", "Жёсткость", "50000", "Н/м"),
      f("m", "Масса", "12", "кг"),
      f("work", "Рабочая частота", "15", "Гц"),
    ],
    outputLabel: "Частоты и формы",
    compute: v => {
      const k = num(v.k), m = num(v.m), w = num(v.work)
      const f1 = naturalFreq(k, m)
      const ratio = f1 > 0 ? w / f1 : 0
      return [
        { label: "1-я собственная частота", value: `${fx(f1, 3)} Гц` },
        { label: "2-я форма (≈2,8×)", value: `${fx(f1 * 2.76, 2)} Гц` },
        { label: "3-я форма (≈5,4×)", value: `${fx(f1 * 5.4, 2)} Гц` },
        { label: "Период колебаний", value: `${fx(f1 > 0 ? 1 / f1 : 0, 4)} с` },
        { label: "Критические обороты", value: `${fmtBig(f1 * 60, 0)} об/мин` },
        { label: "Отстройка от резонанса", value: `${fx(ratio, 2)}× от собственной` },
        { label: "Оценка", value: ratio > 1.3 || ratio < 0.7 ? "✓ резонанс исключён" : "✗ опасно: близко к резонансу" },
      ]
    },
  },

  "sw-sim-nonlinear": {
    desc: "Нелинейный расчёт: пластические деформации, остаточные напряжения, шаги нагружения.",
    fields: [
      f("load", "Нагрузка", "8000", "Н"),
      f("area", "Сечение", "150", "мм²"),
      f("yield", "Предел текучести", "250", "МПа"),
      f("ult", "Предел прочности", "420", "МПа"),
      f("steps", "Шагов нагружения", "20"),
    ],
    outputLabel: "Нелинейный расчёт",
    compute: v => {
      const s = stress(num(v.load), num(v.area))
      const Y = num(v.yield), U = num(v.ult)
      const plastic = s > Y
      return [
        { label: "Расчётное напряжение", value: `${fx(s, 2)} МПа` },
        { label: "Состояние материала", value: plastic ? "пластическая зона" : "упругая зона" },
        { label: "Запас до текучести", value: fx(s > 0 ? Y / s : 0, 2) },
        { label: "Запас до разрушения", value: fx(s > 0 ? U / s : 0, 2) },
        { label: "Степень упрочнения", value: plastic ? `${fx(((s - Y) / (U - Y)) * 100, 1)} %` : "0 %" },
        { label: "Нагрузка на шаг", value: `${fx(num(v.load) / Math.max(num(v.steps), 1), 1)} Н` },
        { label: "Оценка", value: s < Y ? "✓ упругая работа" : s < U ? "⚠ пластические деформации" : "✗ разрушение" },
      ]
    },
  },

  "sw-sim-topology": {
    desc: "Топологическая оптимизация: снижение массы при сохранении жёсткости.",
    fields: [
      f("mass", "Исходная масса", "12.4", "кг"),
      f("target", "Целевое снижение", "35", "%"),
      f("stiff", "Требуемая жёсткость", "85", "%"),
    ],
    outputLabel: "Оптимизация массы",
    compute: v => {
      const m = num(v.mass), t = num(v.target) / 100, st = num(v.stiff) / 100
      const newM = m * (1 - t)
      return [
        { label: "Исходная масса", value: `${fx(m, 3)} кг` },
        { label: "Оптимизированная масса", value: `${fx(newM, 3)} кг` },
        { label: "Экономия материала", value: `${fx(m - newM, 3)} кг (${fx(t * 100, 1)} %)` },
        { label: "Сохранённая жёсткость", value: `${fx(st * 100, 0)} %` },
        { label: "Удельная жёсткость", value: `${fx(newM > 0 ? (st / (newM / m)) * 100 : 0, 1)} % (было 100 %)` },
        { label: "Экономия на 1000 шт", value: `${fmtBig((m - newM) * 1000, 0)} кг` },
      ]
    },
  },

  "kompas-v24-apmfem": {
    desc: "APM FEM: прочностной расчёт конструкции, прогиб балки, изгибающий момент.",
    fields: [
      f("F", "Нагрузка", "5000", "Н"),
      f("L", "Пролёт", "1200", "мм"),
      f("b", "Ширина сечения", "40", "мм"),
      f("h", "Высота сечения", "80", "мм"),
      sel("kind", "Схема", "Шарнирная", ["Шарнирная", "Консоль"]),
      sel("mat", "Материал", "Сталь", MATS),
    ],
    outputLabel: "Расчёт конструкции",
    compute: v => {
      const F = num(v.F), L = num(v.L), b = num(v.b), h = num(v.h)
      const E = YOUNG[String(v.mat)] ?? 210000
      const I = inertiaRect(b, h)
      const kind = v.kind === "Консоль" ? "console" as const : "simple" as const
      const r = beamDeflection(F, L, E, I, kind)
      const W = (b * h * h) / 6
      const sigma = W > 0 ? r.moment / W : 0
      return [
        { label: "Момент инерции I", value: `${fmtBig(I, 0)} мм⁴` },
        { label: "Момент сопротивления W", value: `${fmtBig(W, 0)} мм³` },
        { label: "Изгибающий момент M", value: `${fmtBig(r.moment / 1000, 2)} Н·м` },
        { label: "Напряжение изгиба σ", value: `${fx(sigma, 2)} МПа` },
        { label: "Максимальный прогиб", value: `${fx(r.deflection, 3)} мм` },
        { label: "Относительный прогиб", value: `1/${fmtBig(r.deflection > 0 ? L / r.deflection : 0, 0)}` },
        { label: "Оценка по прогибу", value: r.deflection > 0 && L / r.deflection >= 200 ? "✓ в норме (1/200)" : "✗ прогиб велик" },
      ]
    },
  },

  // ─── ЛИСТОВОЙ МЕТАЛЛ ──────────────────────────────────────────────────────

  "sw-sheetmetal": {
    desc: "Развёртка листовой детали: припуск на гиб, вычет, усилие гибки, минимальный радиус.",
    fields: [
      f("thick", "Толщина", "2", "мм"),
      f("kfac", "K-фактор", "0.44"),
      f("angle", "Угол гиба", "90", "°"),
      f("r", "Радиус гиба", "2", "мм"),
      f("width", "Длина линии гиба", "300", "мм"),
      f("a", "Полка A", "80", "мм"),
      f("b", "Полка B", "60", "мм"),
    ],
    outputLabel: "Развёртка",
    compute: v => {
      const t = num(v.thick), r = num(v.r), ang = num(v.angle), k = num(v.kfac)
      const ba = bendAllowance(t, r, ang, k)
      const flat = num(v.a) + num(v.b) - ba.deduction
      const F = bendForce(t, num(v.width), 8 * t)
      return [
        { label: "Припуск на гиб (BA)", value: `${fx(ba.bendAllowance, 3)} мм` },
        { label: "Внешний отступ (OSSB)", value: `${fx(ba.setback, 3)} мм` },
        { label: "Вычет на гиб", value: `${fx(ba.deduction, 3)} мм` },
        { label: "Длина развёртки", value: `${fx(flat, 2)} мм` },
        { label: "Радиус нейтральной линии", value: `${fx(ba.neutralRadius, 3)} мм` },
        { label: "Мин. радиус гиба", value: `${fx(minBendRadius(t), 2)} мм` },
        { label: "Проверка радиуса", value: r >= minBendRadius(t) ? "✓ допустимо" : "✗ риск трещин" },
        { label: "Усилие гибки", value: `${fx(F, 1)} кН` },
      ]
    },
  },

  "sw27-sheet-offset": {
    desc: "Смещение граней листовой детали: пересчёт развёртки и массы.",
    fields: [
      f("t", "Толщина", "1.5", "мм"),
      f("off", "Смещение грани", "5", "мм"),
      f("area", "Площадь развёртки", "48000", "мм²"),
      sel("mat", "Материал", "Сталь", MATS),
    ],
    outputLabel: "Смещение граней",
    compute: v => {
      const t = num(v.t), A = num(v.area), off = num(v.off)
      const newA = A + off * Math.sqrt(A) * 2
      return [
        { label: "Исходная площадь", value: `${fmtBig(A, 0)} мм²` },
        { label: "Новая площадь", value: `${fmtBig(newA, 0)} мм²` },
        { label: "Прирост", value: `${fx(A > 0 ? ((newA - A) / A) * 100 : 0, 2)} %` },
        { label: "Масса до", value: `${fx(partMass(A * t, String(v.mat)), 3)} кг` },
        { label: "Масса после", value: `${fx(partMass(newA * t, String(v.mat)), 3)} кг` },
      ]
    },
  },

  "sw27-offset-warning": {
    desc: "Контроль смещения граней: проверка минимальной толщины и геометрии.",
    fields: [f("t", "Толщина стенки", "1.2", "мм"), f("off", "Смещение", "0.8", "мм"), f("min", "Минимально допустимая", "0.6", "мм")],
    outputLabel: "Контроль геометрии",
    compute: v => {
      const t = num(v.t), off = num(v.off), min = num(v.min)
      const rest = t - off
      return [
        { label: "Остаточная толщина", value: `${fx(rest, 3)} мм` },
        { label: "Минимально допустимая", value: `${fx(min, 3)} мм` },
        { label: "Запас", value: `${fx(rest - min, 3)} мм` },
        { label: "Результат", value: rest >= min ? "✓ геометрия корректна" : "✗ стенка слишком тонкая" },
      ]
    },
  },

  // ─── ПЕРЕДАЧИ И ВАЛЫ ──────────────────────────────────────────────────────

  "kompas-v24-shafts": {
    desc: "Расчёт передачи: числа зубьев, диаметры, межосевое расстояние, крутящие моменты.",
    fields: [
      sel("type", "Передача", "Зубчатая", ["Зубчатая", "Ремённая", "Цепная", "Червячная"]),
      f("ratio", "Передаточное число", "3.15"),
      f("power", "Мощность", "7.5", "кВт"),
      f("rpm", "Обороты ведущего", "1450", "об/мин"),
      f("z1", "Зубьев шестерни", "20"),
      f("m", "Модуль", "3", "мм"),
    ],
    outputLabel: "Расчёт передачи",
    compute: v => {
      const g = gearDrive(num(v.z1), num(v.ratio), num(v.m))
      const rpm1 = num(v.rpm), P = num(v.power)
      const rpm2 = rpm1 / g.realRatio
      const T1 = torque(P, rpm1), T2 = torque(P * 0.97, rpm2)
      return [
        { label: "Тип передачи", value: String(v.type) },
        { label: "Числа зубьев z1/z2", value: `${g.z1} / ${g.z2}` },
        { label: "Фактическое u", value: fx(g.realRatio, 4) },
        { label: "Делительные диаметры", value: `${fx(g.d1, 1)} / ${fx(g.d2, 1)} мм` },
        { label: "Межосевое расстояние", value: `${fx(g.center, 2)} мм` },
        { label: "Диаметры вершин", value: `${fx(g.da1, 1)} / ${fx(g.da2, 1)} мм` },
        { label: "Обороты ведомого", value: `${fx(rpm2, 1)} об/мин` },
        { label: "Момент на ведущем", value: `${fx(T1, 2)} Н·м` },
        { label: "Момент на ведомом", value: `${fx(T2, 2)} Н·м` },
      ]
    },
  },

  "sw-motion": {
    desc: "Кинематика механизма: скорости, моменты, мощность привода.",
    fields: [
      f("rpm", "Обороты", "1500", "об/мин"),
      f("power", "Мощность", "5.5", "кВт"),
      f("r", "Радиус кривошипа", "120", "мм"),
      f("eff", "КПД привода", "0.92"),
    ],
    outputLabel: "Кинематический расчёт",
    compute: v => {
      const rpm = num(v.rpm), P = num(v.power), r = num(v.r) / 1000
      const w = (2 * Math.PI * rpm) / 60
      return [
        { label: "Угловая скорость ω", value: `${fx(w, 2)} рад/с` },
        { label: "Линейная скорость", value: `${fx(w * r, 3)} м/с` },
        { label: "Крутящий момент", value: `${fx(torque(P, rpm), 2)} Н·м` },
        { label: "Центростремительное ускор.", value: `${fx(w * w * r, 1)} м/с²` },
        { label: "Мощность на выходе", value: `${fx(P * num(v.eff), 3)} кВт` },
        { label: "Потери в приводе", value: `${fx(P * (1 - num(v.eff)), 3)} кВт` },
        { label: "Частота вращения", value: `${fx(rpm / 60, 2)} Гц` },
      ]
    },
  },

  // ─── СВАРКА И КАРКАСЫ ─────────────────────────────────────────────────────

  "sw-weldments": {
    desc: "Сварная конструкция: масса профиля, длина швов, расход электродов, время сварки.",
    fields: [
      f("len", "Длина профиля", "80", "м"),
      sel("prof", "Профиль", "Труба 60×60×3", ["Труба 60×60×3", "Уголок 63×5", "Швеллер 12", "Двутавр 20", "Труба 40×40×2"]),
      f("welds", "Длина швов", "12", "м"),
      f("leg", "Катет шва", "5", "мм"),
    ],
    outputLabel: "Сварная конструкция",
    compute: v => {
      const mass: Record<string, number> = {
        "Труба 60×60×3": 5.26, "Уголок 63×5": 4.81, "Швеллер 12": 10.4,
        "Двутавр 20": 21.0, "Труба 40×40×2": 2.33,
      }
      const L = num(v.len), mp = mass[String(v.prof)] ?? 5
      const w = welding(num(v.welds) * 1000, num(v.leg))
      return [
        { label: "Профиль", value: String(v.prof) },
        { label: "Погонная масса", value: `${fx(mp, 2)} кг/м` },
        { label: "Масса конструкции", value: `${fx(L * mp, 2)} кг` },
        { label: "Длина швов", value: `${fx(num(v.welds), 1)} м` },
        { label: "Площадь сечения шва", value: `${fx(w.area, 2)} мм²` },
        { label: "Масса наплавленного металла", value: `${fx(w.mass, 3)} кг` },
        { label: "Расход электродов", value: `${fx(w.electrodes, 3)} кг` },
        { label: "Время сварки", value: `${fx(w.time, 2)} ч` },
      ]
    },
  },

  "kompas-v24-weld": {
    desc: "Сварные швы: расчёт прочности шва, масса наплавки, трудоёмкость.",
    fields: [
      f("len", "Длина шва", "450", "мм"),
      f("leg", "Катет шва", "6", "мм"),
      f("force", "Нагрузка на шов", "25000", "Н"),
      f("allow", "Допуск. напряжение шва", "140", "МПа"),
    ],
    outputLabel: "Расчёт шва",
    compute: v => {
      const L = num(v.len), k = num(v.leg), F = num(v.force)
      const A = 0.7 * k * L
      const tau = A > 0 ? F / A : 0
      const w = welding(L, k)
      return [
        { label: "Расчётная площадь шва", value: `${fmtBig(A, 1)} мм²` },
        { label: "Касательное напряжение", value: `${fx(tau, 2)} МПа` },
        { label: "Допускаемое напряжение", value: `${fx(num(v.allow), 0)} МПа` },
        { label: "Запас прочности", value: fx(tau > 0 ? num(v.allow) / tau : 0, 2) },
        { label: "Оценка", value: tau <= num(v.allow) ? "✓ шов проходит" : "✗ увеличьте катет" },
        { label: "Требуемый катет", value: `${fx(num(v.allow) > 0 ? F / (0.7 * L * num(v.allow)) : 0, 2)} мм` },
        { label: "Масса наплавки", value: `${fx(w.mass, 4)} кг` },
      ]
    },
  },

  "kompas-v24-frames": {
    desc: "Металлокаркас: масса, количество профилей, длина резов, отходы.",
    fields: [
      f("len", "Общая длина", "240", "м"),
      f("stock", "Длина хлыста", "6", "м"),
      f("mass", "Погонная масса", "5.26", "кг/м"),
      f("cuts", "Резов на стык", "2"),
    ],
    outputLabel: "Металлокаркас",
    compute: v => {
      const L = num(v.len), st = num(v.stock), m = num(v.mass)
      const bars = Math.ceil(L / st)
      const total = bars * st
      return [
        { label: "Требуется хлыстов", value: `${bars} шт. по ${fx(st, 1)} м` },
        { label: "Закупочная длина", value: `${fx(total, 1)} м` },
        { label: "Отход", value: `${fx(total - L, 2)} м (${fx(total > 0 ? ((total - L) / total) * 100 : 0, 1)} %)` },
        { label: "Масса каркаса", value: `${fx(L * m, 1)} кг` },
        { label: "Закупочная масса", value: `${fx(total * m, 1)} кг` },
        { label: "Количество резов", value: `${bars * Math.round(num(v.cuts))}` },
      ]
    },
  },

  // ─── РАСКРОЙ И ПРОИЗВОДСТВО ───────────────────────────────────────────────

  "kompas-v24-nesting": {
    desc: "Карта раскроя: число листов, коэффициент использования, отходы, стоимость.",
    fields: [
      f("parts", "Деталей", "48"),
      f("area", "Площадь детали", "0.045", "м²"),
      f("sheet", "Площадь листа", "3", "м²"),
      f("price", "Цена листа", "4200", "₽"),
    ],
    outputLabel: "Карта раскроя",
    compute: v => {
      const r = nesting(num(v.parts), num(v.area), num(v.sheet))
      return [
        { label: "Требуется листов", value: `${r.sheets} шт.` },
        { label: "Полезная площадь", value: `${fx(r.usedArea, 3)} м²` },
        { label: "Закупочная площадь", value: `${fx(r.totalArea, 3)} м²` },
        { label: "Коэффициент использования", value: `${fx(r.usage, 1)} %` },
        { label: "Отходы", value: `${fx(r.waste, 3)} м²` },
        { label: "Стоимость материала", value: `${fmtBig(r.sheets * num(v.price), 0)} ₽` },
        { label: "Себестоимость детали", value: `${fmtBig(num(v.parts) > 0 ? (r.sheets * num(v.price)) / num(v.parts) : 0, 2)} ₽` },
      ]
    },
  },

  "sw-cam-nesting": {
    desc: "Раскрой для ЧПУ: длина реза, машинное время, расход газа.",
    fields: [
      f("parts", "Деталей", "36"),
      f("perim", "Периметр детали", "820", "мм"),
      f("speed", "Скорость реза", "1800", "мм/мин"),
      f("pierce", "Врезок на деталь", "3"),
    ],
    outputLabel: "Раскрой ЧПУ",
    compute: v => {
      const n = num(v.parts), p = num(v.perim), sp = num(v.speed)
      const totalCut = (n * p) / 1000
      const cutTime = sp > 0 ? (n * p) / sp : 0
      const pierceTime = (n * num(v.pierce) * 1.2) / 60
      return [
        { label: "Общая длина реза", value: `${fx(totalCut, 2)} м` },
        { label: "Время резки", value: `${fx(cutTime, 1)} мин` },
        { label: "Время врезок", value: `${fx(pierceTime, 1)} мин` },
        { label: "Машинное время", value: `${fx(cutTime + pierceTime, 1)} мин` },
        { label: "Производительность", value: `${fx(cutTime + pierceTime > 0 ? n / ((cutTime + pierceTime) / 60) : 0, 1)} дет/ч` },
        { label: "Всего врезок", value: `${Math.round(n * num(v.pierce))}` },
      ]
    },
  },

  // ─── ЛИТЬЁ ПЛАСТМАСС ──────────────────────────────────────────────────────

  "sw-plastics": {
    desc: "Анализ литья: время охлаждения, усадка, объём отливки, цикл формования.",
    fields: [
      f("wall", "Толщина стенки", "2.5", "мм"),
      sel("mat", "Полимер", "ABS", ["ABS", "PP", "PA6", "PC", "POM"]),
      f("vol", "Объём детали", "45", "см³"),
      f("size", "Габарит детали", "180", "мм"),
    ],
    outputLabel: "Анализ литья",
    compute: v => {
      const wall = num(v.wall), mat = String(v.mat)
      const t = coolingTime(wall)
      const sh = SHRINKAGE[mat] ?? 1.0
      const size = num(v.size)
      return [
        { label: "Полимер", value: mat },
        { label: "Время охлаждения", value: `${fx(t, 1)} с` },
        { label: "Цикл формования", value: `${fx(t + 8, 1)} с` },
        { label: "Производительность", value: `${fmtBig(3600 / (t + 8), 0)} шт/ч` },
        { label: "Усадка материала", value: `${fx(sh, 2)} %` },
        { label: "Размер формы (с усадкой)", value: `${fx(size * (1 + sh / 100), 2)} мм` },
        { label: "Масса отливки", value: `${fx((num(v.vol) * (DENSITY[mat] ?? 1100)) / 1e6, 3)} кг` },
        { label: "Оценка толщины", value: wall >= 1 && wall <= 4 ? "✓ технологична" : wall < 1 ? "✗ риск недолива" : "⚠ утяжины и коробление" },
      ]
    },
  },

  "sw-plastics-warp": {
    desc: "Коробление отливки: прогноз деформации и рекомендации по толщине.",
    fields: [
      f("wall", "Толщина стенки", "3", "мм"),
      f("len", "Длина детали", "250", "мм"),
      sel("mat", "Полимер", "PP", ["ABS", "PP", "PA6", "PC", "POM"]),
      f("diff", "Разнотолщинность", "35", "%"),
    ],
    outputLabel: "Прогноз коробления",
    compute: v => {
      const sh = SHRINKAGE[String(v.mat)] ?? 1.0
      const L = num(v.len), diff = num(v.diff) / 100
      const warp = L * (sh / 100) * diff
      return [
        { label: "Усадка материала", value: `${fx(sh, 2)} %` },
        { label: "Свободная усадка", value: `${fx((L * sh) / 100, 2)} мм` },
        { label: "Прогноз коробления", value: `${fx(warp, 3)} мм` },
        { label: "Относительное коробление", value: `${fx(L > 0 ? (warp / L) * 100 : 0, 3)} %` },
        { label: "Оценка", value: warp < 0.5 ? "✓ в допуске" : warp < 1.5 ? "⚠ требуется коррекция" : "✗ выровняйте толщины" },
        { label: "Рекомендуемая разнотолщинность", value: "не более 20 %" },
      ]
    },
  },

  "sw27-plastics-uv": {
    desc: "Стойкость полимера: деградация под УФ, срок службы, необходимость стабилизатора.",
    fields: [f("years", "Срок эксплуатации", "5", "лет"), sel("mat", "Полимер", "PP", ["ABS", "PP", "PA6", "PC", "POM"]), sel("env", "Условия", "Улица", ["Улица", "Помещение", "Под навесом"])],
    outputLabel: "УФ-стойкость",
    compute: v => {
      const k: Record<string, number> = { "Улица": 1, "Помещение": 0.1, "Под навесом": 0.4 }
      const res: Record<string, number> = { "ABS": 3, "PP": 2, "PA6": 4, "PC": 6, "POM": 3 }
      const base = res[String(v.mat)] ?? 3
      const life = base / (k[String(v.env)] ?? 1)
      return [
        { label: "Базовая стойкость", value: `${fx(base, 1)} лет (улица)` },
        { label: "Расчётный срок службы", value: `${fx(life, 1)} лет` },
        { label: "Требуемый срок", value: `${fx(num(v.years), 1)} лет` },
        { label: "Оценка", value: life >= num(v.years) ? "✓ достаточно" : "✗ нужен УФ-стабилизатор" },
        { label: "Рекомендация", value: life < num(v.years) ? `добавить 2 % УФ-стабилизатора` : "стабилизатор не требуется" },
      ]
    },
  },

  // ─── ГИДРОГАЗОДИНАМИКА ────────────────────────────────────────────────────

  "sw-flow": {
    desc: "CFD-расчёт: число Рейнольдса, режим течения, расход, потери давления.",
    fields: [
      f("v", "Скорость", "10", "м/с"),
      f("d", "Диаметр канала", "50", "мм"),
      sel("fluid", "Среда", "Воздух", ["Воздух", "Вода", "Масло"]),
      f("len", "Длина участка", "2000", "мм"),
    ],
    outputLabel: "CFD-расчёт",
    compute: v => {
      const nu: Record<string, number> = { "Воздух": 1.5e-5, "Вода": 1.0e-6, "Масло": 4.6e-5 }
      const ro: Record<string, number> = { "Воздух": 1.2, "Вода": 1000, "Масло": 890 }
      const vel = num(v.v), d = num(v.d) / 1000, L = num(v.len) / 1000
      const Re = reynolds(vel, d, nu[String(v.fluid)] ?? 1.5e-5)
      const lam = Re > 0 ? (Re < 2300 ? 64 / Re : 0.316 / Math.pow(Re, 0.25)) : 0
      const rho = ro[String(v.fluid)] ?? 1.2
      const dp = d > 0 ? lam * (L / d) * ((rho * vel * vel) / 2) : 0
      const Q = vel * Math.PI * (d / 2) ** 2
      return [
        { label: "Число Рейнольдса", value: fmtBig(Re, 0) },
        { label: "Режим течения", value: flowRegime(Re) },
        { label: "Коэффициент трения λ", value: fx(lam, 5) },
        { label: "Объёмный расход", value: `${fx(Q * 1000, 3)} л/с (${fx(Q * 3600, 2)} м³/ч)` },
        { label: "Потери давления", value: `${fx(dp, 1)} Па (${fx(dp / 1000, 4)} кПа)` },
        { label: "Динамическое давление", value: `${fx((rho * vel * vel) / 2, 1)} Па` },
      ]
    },
  },

  "sw27-flow-thermal": {
    desc: "Тепловой расчёт: отводимая мощность, перепад температур, требуемый расход.",
    fields: [
      f("power", "Тепловыделение", "250", "Вт"),
      f("dt", "Допустимый перегрев", "25", "°C"),
      sel("fluid", "Хладагент", "Воздух", ["Воздух", "Вода"]),
      f("area", "Площадь теплообмена", "0.35", "м²"),
    ],
    outputLabel: "Тепловой расчёт",
    compute: v => {
      const cp: Record<string, number> = { "Воздух": 1005, "Вода": 4187 }
      const ro: Record<string, number> = { "Воздух": 1.2, "Вода": 1000 }
      const P = num(v.power), dt = num(v.dt)
      const c = cp[String(v.fluid)] ?? 1005, rho = ro[String(v.fluid)] ?? 1.2
      const G = dt > 0 ? P / (c * dt) : 0
      const Q = rho > 0 ? G / rho : 0
      const alpha = num(v.area) > 0 && dt > 0 ? P / (num(v.area) * dt) : 0
      return [
        { label: "Отводимая мощность", value: `${fx(P, 1)} Вт` },
        { label: "Массовый расход", value: `${fx(G, 5)} кг/с` },
        { label: "Объёмный расход", value: `${fx(Q * 3600, 3)} м³/ч` },
        { label: "Требуемый коэф. теплоотдачи", value: `${fx(alpha, 1)} Вт/(м²·К)` },
        { label: "Перепад температур", value: `${fx(dt, 1)} °C` },
        { label: "Оценка", value: alpha < 50 ? "✓ достаточно естественной конвекции" : alpha < 200 ? "⚠ нужен вентилятор" : "✗ требуется жидкостное охлаждение" },
      ]
    },
  },

  "kompas-v24-kompasflow": {
    desc: "КОМПАС-Flow: гидравлический расчёт канала, скорость, расход, потери.",
    fields: [f("Q", "Расход", "12", "м³/ч"), f("d", "Диаметр", "50", "мм"), f("len", "Длина", "15", "м")],
    outputLabel: "Гидравлический расчёт",
    compute: v => {
      const Q = num(v.Q) / 3600, d = num(v.d) / 1000, L = num(v.len)
      const A = Math.PI * (d / 2) ** 2
      const vel = A > 0 ? Q / A : 0
      const Re = reynolds(vel, d, 1e-6)
      const lam = Re > 0 ? (Re < 2300 ? 64 / Re : 0.316 / Math.pow(Re, 0.25)) : 0
      const dp = d > 0 ? lam * (L / d) * ((1000 * vel * vel) / 2) : 0
      return [
        { label: "Площадь сечения", value: `${fx(A * 1e6, 1)} мм²` },
        { label: "Скорость потока", value: `${fx(vel, 3)} м/с` },
        { label: "Число Рейнольдса", value: fmtBig(Re, 0) },
        { label: "Режим", value: flowRegime(Re) },
        { label: "Потери давления", value: `${fx(dp / 1000, 3)} кПа (${fx(dp / 9810, 3)} м вод. ст.)` },
        { label: "Оценка скорости", value: vel >= 0.8 && vel <= 3 ? "✓ оптимально" : vel < 0.8 ? "⚠ низкая скорость" : "✗ высокие потери" },
      ]
    },
  },

  // ─── ГЕОМЕТРИЯ И МОДЕЛИРОВАНИЕ ────────────────────────────────────────────

  "sw-solid-modeling": {
    desc: "Твердотельная модель: объём, масса, площадь поверхности, момент инерции.",
    fields: [
      f("w", "Длина", "200", "мм"), f("d", "Ширина", "120", "мм"), f("h", "Высота", "60", "мм"),
      sel("mat", "Материал", "Сталь", MATS),
      f("hollow", "Доля полостей", "15", "%"),
    ],
    outputLabel: "Параметры модели",
    compute: v => {
      const w = num(v.w), d = num(v.d), h = num(v.h)
      const V = w * d * h * (1 - num(v.hollow) / 100)
      const S = 2 * (w * d + w * h + d * h)
      return [
        { label: "Габаритный объём", value: `${fx((w * d * h) / 1000, 1)} см³` },
        { label: "Объём материала", value: `${fx(V / 1000, 1)} см³` },
        { label: "Площадь поверхности", value: `${fmtBig(S, 0)} мм²` },
        { label: "Масса", value: `${fx(partMass(V, String(v.mat)), 3)} кг` },
        { label: "Плотность материала", value: `${fmtBig(DENSITY[String(v.mat)] ?? 1000, 0)} кг/м³` },
        { label: "Момент инерции (I_x)", value: `${fmtBig(inertiaRect(w, h), 0)} мм⁴` },
      ]
    },
  },

  "kompas-v24-midsurface": {
    desc: "Срединная поверхность: упрощение для МКЭ, экономия элементов сетки.",
    fields: [f("t", "Толщина", "3", "мм"), f("area", "Площадь поверхности", "0.85", "м²"), f("mesh", "Размер элемента", "5", "мм")],
    outputLabel: "Срединная поверхность",
    compute: v => {
      const A = num(v.area) * 1e6, m = num(v.mesh)
      const shell = m > 0 ? A / (m * m) : 0
      const solid = m > 0 ? (A * num(v.t)) / (m * m * m) : 0
      return [
        { label: "Элементов оболочки", value: fmtBig(shell, 0) },
        { label: "Элементов объёмных", value: fmtBig(solid, 0) },
        { label: "Сокращение сетки", value: `в ${fx(shell > 0 ? solid / shell : 0, 1)} раза` },
        { label: "Экономия времени расчёта", value: `${fx(solid > 0 ? (1 - shell / solid) * 100 : 0, 1)} %` },
        { label: "Положение поверхности", value: `${fx(num(v.t) / 2, 2)} мм от грани` },
      ]
    },
  },

  "kompas-v24-checkgeom": {
    desc: "Контроль геометрии: поиск дефектов модели и оценка трудоёмкости исправления.",
    fields: [f("faces", "Граней в модели", "2400"), f("bad", "Доля проблемных", "1.8", "%"), f("gap", "Допуск на зазор", "0.01", "мм")],
    outputLabel: "Контроль геометрии",
    compute: v => {
      const n = num(v.faces), bad = Math.round((n * num(v.bad)) / 100)
      return [
        { label: "Всего граней", value: fmtBig(n, 0) },
        { label: "Проблемных граней", value: `${bad}` },
        { label: "Качество модели", value: `${fx(n > 0 ? ((n - bad) / n) * 100 : 0, 2)} %` },
        { label: "Допуск на зазор", value: `${fx(num(v.gap), 4)} мм` },
        { label: "Оценка трудоёмкости", value: `${fx(bad * 1.5, 0)} мин` },
        { label: "Вердикт", value: bad === 0 ? "✓ модель корректна" : bad < 20 ? "⚠ требуется правка" : "✗ пересоздайте геометрию" },
      ]
    },
  },

  "sw-tolanalyst": {
    desc: "Анализ размерных цепей: замыкающее звено, метод максимума-минимума и вероятностный.",
    fields: [
      txt("tol", "Допуски звеньев, мм (через ;)", "0.05; 0.08; 0.03; 0.06"),
      f("nom", "Номинал замыкающего", "45.00", "мм"),
    ],
    outputLabel: "Размерная цепь",
    compute: v => {
      const t = String(v.tol).split(";").map(num).filter(x => x > 0)
      const maxmin = t.reduce((a, b) => a + b, 0)
      const prob = Math.sqrt(t.reduce((a, b) => a + b * b, 0))
      return [
        { label: "Звеньев в цепи", value: String(t.length) },
        { label: "Допуск (max-min)", value: `±${fx(maxmin / 2, 4)} мм` },
        { label: "Допуск (вероятностный)", value: `±${fx(prob / 2, 4)} мм` },
        { label: "Выигрыш метода", value: `${fx(maxmin > 0 ? (1 - prob / maxmin) * 100 : 0, 1)} %` },
        { label: "Поле замыкающего", value: `${fx(num(v.nom) - prob / 2, 3)} … ${fx(num(v.nom) + prob / 2, 3)} мм` },
      ]
    },
  },

  "sw-collision": {
    desc: "Контроль пересечений в сборке: число проверок и объём пересечений.",
    fields: [f("parts", "Деталей в сборке", "120"), f("clash", "Найдено пересечений", "4"), f("vol", "Средний объём пересечения", "18", "мм³")],
    outputLabel: "Контроль пересечений",
    compute: v => {
      const n = num(v.parts), c = num(v.clash)
      return [
        { label: "Деталей", value: fmtBig(n, 0) },
        { label: "Пар для проверки", value: fmtBig((n * (n - 1)) / 2, 0) },
        { label: "Найдено пересечений", value: `${c}` },
        { label: "Суммарный объём", value: `${fx(c * num(v.vol), 1)} мм³` },
        { label: "Доля проблемных", value: `${fx(n > 0 ? (c / n) * 100 : 0, 2)} %` },
        { label: "Вердикт", value: c === 0 ? "✓ пересечений нет" : "✗ требуется доработка" },
      ]
    },
  },

  "sw-assembly": {
    desc: "Сборка: масса, количество сопряжений, трудоёмкость сборки.",
    fields: [f("parts", "Деталей", "84"), f("mass", "Средняя масса детали", "1.4", "кг"), f("mates", "Сопряжений", "210"), f("time", "Время на сопряжение", "1.5", "мин")],
    outputLabel: "Параметры сборки",
    compute: v => {
      const n = num(v.parts), m = num(v.mass), mt = num(v.mates)
      return [
        { label: "Деталей в сборке", value: fmtBig(n, 0) },
        { label: "Масса сборки", value: `${fx(n * m, 2)} кг` },
        { label: "Сопряжений", value: fmtBig(mt, 0) },
        { label: "Сопряжений на деталь", value: fx(n > 0 ? mt / n : 0, 2) },
        { label: "Трудоёмкость сборки", value: `${fx((mt * num(v.time)) / 60, 2)} ч` },
        { label: "Оценка сложности", value: mt / Math.max(n, 1) > 3 ? "высокая связность" : "нормальная" },
      ]
    },
  },

  "sw-config": {
    desc: "Конфигурации изделия: число вариантов исполнения и объём документации.",
    fields: [f("p1", "Значений параметра 1", "4"), f("p2", "Значений параметра 2", "3"), f("p3", "Значений параметра 3", "2"), f("sheets", "Листов на исполнение", "6")],
    outputLabel: "Конфигурации",
    compute: v => {
      const total = Math.max(1, Math.round(num(v.p1))) * Math.max(1, Math.round(num(v.p2))) * Math.max(1, Math.round(num(v.p3)))
      return [
        { label: "Всего конфигураций", value: `${total}` },
        { label: "Листов документации", value: `${total * Math.round(num(v.sheets))}` },
        { label: "Экономия против ручного", value: `${fx((1 - 1 / total) * 100, 1)} %` },
        { label: "Обозначений в спецификации", value: `${total}` },
      ]
    },
  },

  "kompas-v24-composites": {
    desc: "Композиты: толщина пакета, масса, доля армирования по слоям.",
    fields: [f("layers", "Слоёв", "12"), f("t", "Толщина слоя", "0.25", "мм"), f("area", "Площадь", "1.8", "м²"), f("fiber", "Доля волокна", "60", "%")],
    outputLabel: "Композитный пакет",
    compute: v => {
      const n = Math.round(num(v.layers)), t = num(v.t), A = num(v.area)
      const H = n * t
      const V = A * (H / 1000)
      const rho = (num(v.fiber) / 100) * 1800 + (1 - num(v.fiber) / 100) * 1200
      return [
        { label: "Толщина пакета", value: `${fx(H, 2)} мм` },
        { label: "Объём материала", value: `${fx(V * 1e6, 0)} см³` },
        { label: "Плотность композита", value: `${fx(rho, 0)} кг/м³` },
        { label: "Масса", value: `${fx(V * rho, 3)} кг` },
        { label: "Доля волокна", value: `${fx(num(v.fiber), 1)} %` },
        { label: "Удельная прочность", value: `≈ ${fx((num(v.fiber) / 100) * 1500, 0)} МПа` },
      ]
    },
  },

  "sw-sustain": {
    desc: "Экологическая оценка: углеродный след, энергозатраты, вторсырьё.",
    fields: [f("mass", "Масса изделия", "8.5", "кг"), sel("mat", "Материал", "Сталь", MATS), f("qty", "Тираж", "1000", "шт")],
    outputLabel: "Экологическая оценка",
    compute: v => {
      const co2: Record<string, number> = { "Сталь": 1.9, "Чугун": 1.5, "Алюминий": 8.2, "Титан": 35, "Медь": 3.8, "Латунь": 4.0, "Пластик": 3.1 }
      const en: Record<string, number> = { "Сталь": 24, "Чугун": 20, "Алюминий": 155, "Титан": 450, "Медь": 55, "Латунь": 58, "Пластик": 80 }
      const m = num(v.mass), q = num(v.qty), mat = String(v.mat)
      return [
        { label: "Масса изделия", value: `${fx(m, 2)} кг` },
        { label: "CO₂ на изделие", value: `${fx(m * (co2[mat] ?? 2), 2)} кг` },
        { label: "CO₂ на тираж", value: `${fmtBig(m * q * (co2[mat] ?? 2), 0)} кг` },
        { label: "Энергозатраты на тираж", value: `${fmtBig(m * q * (en[mat] ?? 30), 0)} МДж` },
        { label: "Эквивалент деревьев", value: `${fmtBig((m * q * (co2[mat] ?? 2)) / 22, 0)} шт/год` },
      ]
    },
  },

  "kompas-v24-molds": {
    desc: "Пресс-форма: усилие смыкания, число гнёзд, производительность.",
    fields: [f("area", "Площадь проекции", "6200", "мм²"), f("press", "Давление литья", "45", "МПа"), f("cav", "Гнёзд в форме", "4"), f("cycle", "Цикл", "32", "с")],
    outputLabel: "Пресс-форма",
    compute: v => {
      const A = num(v.area), p = num(v.press), n = Math.max(1, Math.round(num(v.cav)))
      const F = (A * n * p) / 1000
      return [
        { label: "Площадь проекции (всего)", value: `${fmtBig(A * n, 0)} мм²` },
        { label: "Усилие смыкания", value: `${fmtBig(F, 0)} кН (${fx(F / 9.81, 1)} тс)` },
        { label: "Требуемый термопластавтомат", value: `от ${fmtBig(Math.ceil(F / 9.81 / 50) * 50, 0)} тс` },
        { label: "Гнёзд в форме", value: `${n}` },
        { label: "Производительность", value: `${fmtBig(num(v.cycle) > 0 ? (3600 / num(v.cycle)) * n : 0, 0)} шт/ч` },
        { label: "Выпуск за смену (8 ч)", value: `${fmtBig(num(v.cycle) > 0 ? (3600 / num(v.cycle)) * n * 8 : 0, 0)} шт` },
      ]
    },
  },

  "sw-mold": {
    desc: "Проектирование пресс-формы: уклоны, усадка, размеры формообразующих.",
    fields: [f("h", "Высота детали", "60", "мм"), f("draft", "Уклон", "1.5", "°"), sel("mat", "Полимер", "ABS", ["ABS", "PP", "PA6", "PC", "POM"]), f("size", "Габарит", "150", "мм")],
    outputLabel: "Пресс-форма",
    compute: v => {
      const h = num(v.h), d = num(v.draft), sh = SHRINKAGE[String(v.mat)] ?? 1
      const add = h * Math.tan((d * Math.PI) / 180)
      return [
        { label: "Уклон формовки", value: `${fx(d, 2)}°` },
        { label: "Расширение по высоте", value: `${fx(add, 3)} мм` },
        { label: "Усадка полимера", value: `${fx(sh, 2)} %` },
        { label: "Размер формообразующей", value: `${fx(num(v.size) * (1 + sh / 100), 3)} мм` },
        { label: "Припуск на усадку", value: `${fx((num(v.size) * sh) / 100, 3)} мм` },
        { label: "Оценка уклона", value: d >= 1 ? "✓ извлечение без задиров" : "✗ увеличьте уклон" },
      ]
    },
  },

  "sw-toolbox": {
    desc: "Стандартные изделия: подбор крепежа, момент затяжки, усилие предварительной затяжки.",
    fields: [sel("bolt", "Резьба", "M12", ["M6", "M8", "M10", "M12", "M16", "M20"]), sel("cls", "Класс прочности", "8.8", ["4.8", "5.8", "8.8", "10.9", "12.9"]), f("n", "Количество", "24")],
    outputLabel: "Крепёж",
    compute: v => {
      const d: Record<string, number> = { "M6": 6, "M8": 8, "M10": 10, "M12": 12, "M16": 16, "M20": 20 }
      const As: Record<string, number> = { "M6": 20.1, "M8": 36.6, "M10": 58, "M12": 84.3, "M16": 157, "M20": 245 }
      const cls: Record<string, number> = { "4.8": 320, "5.8": 400, "8.8": 640, "10.9": 900, "12.9": 1080 }
      const dia = d[String(v.bolt)] ?? 12, area = As[String(v.bolt)] ?? 84.3
      const sy = cls[String(v.cls)] ?? 640
      const F = 0.7 * area * sy / 1000
      const T = 0.2 * F * dia
      return [
        { label: "Резьба / класс", value: `${v.bolt} кл. ${v.cls}` },
        { label: "Площадь сечения", value: `${fx(area, 1)} мм²` },
        { label: "Усилие затяжки", value: `${fx(F, 2)} кН` },
        { label: "Момент затяжки", value: `${fx(T, 1)} Н·м` },
        { label: "Разрушающая нагрузка", value: `${fx((area * sy * 1.25) / 1000, 1)} кН` },
        { label: "Суммарное усилие", value: `${fx(F * num(v.n), 1)} кН` },
      ]
    },
  },

  "sw-surfaces": {
    desc: "Поверхностное моделирование: площадь, кривизна, точность аппроксимации.",
    fields: [f("area", "Площадь поверхности", "0.75", "м²"), f("r", "Минимальный радиус кривизны", "18", "мм"), f("tol", "Допуск аппроксимации", "0.05", "мм")],
    outputLabel: "Поверхность",
    compute: v => {
      const A = num(v.area), r = num(v.r), tol = num(v.tol)
      const seg = r > 0 && tol > 0 ? 2 * Math.sqrt(2 * r * tol) : 0
      return [
        { label: "Площадь поверхности", value: `${fx(A, 4)} м² (${fmtBig(A * 1e6, 0)} мм²)` },
        { label: "Минимальный радиус", value: `${fx(r, 2)} мм` },
        { label: "Кривизна", value: `${fx(r > 0 ? 1 / r : 0, 5)} 1/мм` },
        { label: "Длина хорды при допуске", value: `${fx(seg, 3)} мм` },
        { label: "Сегментов на дуге 90°", value: `${Math.ceil(seg > 0 ? (Math.PI * r / 2) / seg : 0)}` },
        { label: "Оценка гладкости", value: r > 10 ? "✓ плавная" : "⚠ резкие переходы" },
      ]
    },
  },

  "sw-scanto3d": {
    desc: "Реверс-инжиниринг: облако точек, плотность сетки, объём данных.",
    fields: [f("pts", "Точек в облаке", "2400000"), f("acc", "Точность сканера", "0.05", "мм"), f("dec", "Прореживание", "70", "%")],
    outputLabel: "Обработка скана",
    compute: v => {
      const p = num(v.pts), dec = num(v.dec) / 100
      const after = p * (1 - dec)
      return [
        { label: "Точек исходно", value: fmtBig(p, 0) },
        { label: "После прореживания", value: fmtBig(after, 0) },
        { label: "Треугольников сетки", value: fmtBig(after * 1.9, 0) },
        { label: "Размер исходных данных", value: `${fx((p * 26) / 1048576, 1)} МБ` },
        { label: "Размер после обработки", value: `${fx((after * 26) / 1048576, 1)} МБ` },
        { label: "Точность модели", value: `±${fx(num(v.acc), 3)} мм` },
      ]
    },
  },

  "kompas-v24-reverse": {
    desc: "Восстановление модели: распознавание элементов и трудоёмкость.",
    fields: [f("faces", "Граней", "1800"), f("rate", "Доля распознанных", "82", "%"), f("time", "Время на элемент", "0.8", "мин")],
    outputLabel: "Реверс-инжиниринг",
    compute: v => {
      const n = num(v.faces), r = num(v.rate) / 100
      const auto = Math.round(n * r), manual = Math.round(n - n * r)
      return [
        { label: "Всего граней", value: fmtBig(n, 0) },
        { label: "Распознано автоматически", value: `${fmtBig(auto, 0)} (${fx(r * 100, 1)} %)` },
        { label: "Требует ручной правки", value: fmtBig(manual, 0) },
        { label: "Трудоёмкость ручной правки", value: `${fx((manual * num(v.time)) / 60, 2)} ч` },
        { label: "Экономия времени", value: `${fx((auto * num(v.time)) / 60, 2)} ч` },
      ]
    },
  },

  "kompas-v24-deform": {
    desc: "Деформация модели: изменение габаритов и объёма при заданном коэффициенте.",
    fields: [f("kx", "Коэффициент X", "1.2"), f("ky", "Коэффициент Y", "1.0"), f("kz", "Коэффициент Z", "0.9"), f("vol", "Исходный объём", "450", "см³")],
    outputLabel: "Деформация",
    compute: v => {
      const k = num(v.kx) * num(v.ky) * num(v.kz)
      return [
        { label: "Коэффициенты", value: `${fx(num(v.kx), 3)} × ${fx(num(v.ky), 3)} × ${fx(num(v.kz), 3)}` },
        { label: "Объёмный коэффициент", value: fx(k, 5) },
        { label: "Новый объём", value: `${fx(num(v.vol) * k, 2)} см³` },
        { label: "Изменение объёма", value: `${k >= 1 ? "+" : ""}${fx((k - 1) * 100, 2)} %` },
        { label: "Тип деформации", value: Math.abs(num(v.kx) - num(v.ky)) < 0.001 && Math.abs(num(v.ky) - num(v.kz)) < 0.001 ? "равномерная" : "неравномерная" },
      ]
    },
  },

  "kompas-v24-fillet-surface": {
    desc: "Скругление по поверхности: объём снимаемого материала и площадь скругления.",
    fields: [f("r", "Радиус скругления", "8", "мм"), f("len", "Длина ребра", "320", "мм"), f("ang", "Угол между гранями", "90", "°")],
    outputLabel: "Скругление",
    compute: v => {
      const r = num(v.r), L = num(v.len), a = (num(v.ang) * Math.PI) / 180
      const arc = r * (Math.PI - a)
      const area = arc * L
      const cut = (r * r * Math.tan(a / 2) - (r * r * (Math.PI - a)) / 2) * L
      return [
        { label: "Длина дуги скругления", value: `${fx(arc, 3)} мм` },
        { label: "Площадь поверхности", value: `${fmtBig(area, 0)} мм²` },
        { label: "Снимаемый объём", value: `${fx(Math.abs(cut) / 1000, 2)} см³` },
        { label: "Масса снимаемого (сталь)", value: `${fx(partMass(Math.abs(cut)), 4)} кг` },
        { label: "Оценка радиуса", value: r > 0 ? "✓ корректен" : "✗ задайте радиус" },
      ]
    },
  },

  "kompas-v25-lod": {
    desc: "Уровни детализации: экономия памяти и ускорение работы с большой сборкой.",
    fields: [f("parts", "Деталей", "4500"), f("tri", "Треугольников на деталь", "8500"), f("lod", "Упрощение LOD", "75", "%")],
    outputLabel: "Уровни детализации",
    compute: v => {
      const n = num(v.parts), t = num(v.tri), k = 1 - num(v.lod) / 100
      const full = n * t, lod = full * k
      return [
        { label: "Треугольников (полная)", value: fmtBig(full, 0) },
        { label: "Треугольников (LOD)", value: fmtBig(lod, 0) },
        { label: "Память полная", value: `${fx((full * 36) / 1073741824, 2)} ГБ` },
        { label: "Память с LOD", value: `${fx((lod * 36) / 1073741824, 2)} ГБ` },
        { label: "Ускорение отрисовки", value: `в ${fx(k > 0 ? 1 / k : 0, 1)} раза` },
        { label: "Оценка FPS", value: `${Math.max(12, Math.round(60 - lod / 900000))} к/с` },
      ]
    },
  },

  // ─── ШЕСТАЯ ВОЛНА: прямое моделирование, обмен форматами, MBD, экспертные системы ──

  "interop-step": {
    desc: "Обмен STEP/IGES: оценка объёма данных и времени конвертации.",
    fields: [sel("fmt", "Формат", "STEP AP242", ["STEP AP203", "STEP AP214", "STEP AP242", "IGES", "SAT"]), f("bodies", "Тел", "14")],
    outputLabel: "Обмен STEP/IGES",
    compute: v => {
      const n = num(v.bodies)
      return [
        { label: "Формат", value: String(v.fmt) },
        { label: "Тел в файле", value: `${n}` },
        { label: "Оценка размера файла", value: `${fx(n * 1.8, 1)} МБ` },
        { label: "Время конвертации", value: `${fx(n * 0.6, 1)} с` },
      ]
    },
  },

  "kompas-v24-direct-faces": {
    desc: "Прямое моделирование граней: изменение объёма при сдвиге/повороте.",
    fields: [sel("op", "Операция", "Сдвиг", ["Сдвиг", "Поворот", "Замена"]), f("faces", "Граней выбрано", "6"), f("d", "Величина", "5", "мм"), f("area", "Средняя площадь грани", "1200", "мм²")],
    outputLabel: "Прямое моделирование",
    compute: v => {
      const n = num(v.faces), d = num(v.d), A = num(v.area)
      const dV = n * A * d
      return [
        { label: "Операция", value: String(v.op) },
        { label: "Граней изменено", value: `${n}` },
        { label: "Изменение объёма", value: `${fx(dV / 1000, 2)} см³` },
        { label: "Масса изменения (сталь)", value: `${fx(partMass(dV), 3)} кг` },
      ]
    },
  },

  "kompas-v24-optim-import": {
    desc: "Оптимизация импортированной геометрии: сокращение граней и ускорение работы.",
    fields: [f("faces", "Граней импортировано", "5400"), f("reduce", "Целевое сокращение", "35", "%")],
    outputLabel: "Оптимизация геометрии",
    compute: v => {
      const n = num(v.faces), r = num(v.reduce) / 100
      return [
        { label: "Граней исходно", value: fmtBig(n, 0) },
        { label: "Граней после оптимизации", value: fmtBig(n * (1 - r), 0) },
        { label: "Сокращено", value: `${fmtBig(n * r, 0)} (${fx(r * 100, 1)} %)` },
        { label: "Ускорение перестроения", value: `в ${fx(r < 1 ? 1 / (1 - r) : 0, 2)} раза` },
      ]
    },
  },

  "kompas-v24-import-c3d": {
    desc: "Чтение моделей других САПР: совместимость и оценка потерь геометрии.",
    fields: [sel("src", "Источник", "SolidWorks", ["NX", "SolidWorks", "Creo", "Inventor", "Catia", "SolidEdge"]), f("feat", "Элементов в дереве", "180")],
    outputLabel: "Импорт модели",
    compute: v => {
      const loss: Record<string, number> = { "NX": 5, "SolidWorks": 2, "Creo": 6, "Inventor": 3, "Catia": 8, "SolidEdge": 4 }
      const n = num(v.feat), l = loss[String(v.src)] ?? 5
      return [
        { label: "Источник", value: String(v.src) },
        { label: "Элементов дерева", value: `${n}` },
        { label: "Потеря параметризации", value: `${fx(l, 1)} %` },
        { label: "Элементов сохранено", value: `${Math.round(n * (1 - l / 100))}` },
      ]
    },
  },

  "kompas-v24-jt-step": {
    desc: "Обмен C3D/JT/STEP: размер и облегчённость модели для визуализации.",
    fields: [sel("fmt", "Формат", "STEP", ["C3D", "JT", "STEP"]), f("faces", "Граней в модели", "3200")],
    outputLabel: "Обмен C3D/JT/STEP",
    compute: v => {
      const kb: Record<string, number> = { "C3D": 1.4, "JT": 0.6, "STEP": 2.1 }
      const n = num(v.faces)
      return [
        { label: "Формат", value: String(v.fmt) },
        { label: "Граней", value: `${n}` },
        { label: "Оценка размера файла", value: `${fx((n * (kb[String(v.fmt)] ?? 1.5)) / 1024, 2)} МБ` },
        { label: "Пригодность для JT", value: v.fmt === "JT" ? "облегчённая визуализация" : "полная геометрия" },
      ]
    },
  },

  "sw-direct-edit": {
    desc: "Прямая модификация геометрии: перемещение граней без дерева построения.",
    fields: [f("faces", "Граней", "4"), f("d", "Смещение", "5", "мм"), f("area", "Площадь грани", "800", "мм²")],
    outputLabel: "Прямая модификация",
    compute: v => {
      const n = num(v.faces), d = num(v.d), A = num(v.area)
      return [
        { label: "Граней перемещено", value: `${n}` },
        { label: "Смещение", value: `${fx(d)} мм` },
        { label: "Изменение объёма", value: `${fx((n * A * d) / 1000, 2)} см³` },
      ]
    },
  },

  "sw-simulation": {
    desc: "Анализ прочности: напряжение, запас, оценка по допускаемому.",
    fields: [f("force", "Сила", "2000", "Н"), f("area", "Сечение", "150", "мм²"), f("yield", "Предел текучести", "250", "МПа")],
    outputLabel: "Анализ прочности",
    compute: v => {
      const s = stress(num(v.force), num(v.area))
      const n = safetyFactor(num(v.yield), s)
      return [
        { label: "Напряжение", value: `${fx(s, 2)} МПа` },
        { label: "Запас прочности", value: n === Infinity ? "∞" : fx(n, 2) },
        { label: "Оценка", value: n >= 2 ? "✓ прочность обеспечена" : "⚠ проверьте сечение" },
      ]
    },
  },

  "sw-3d-interconnect": {
    desc: "3D Interconnect: живая связь с исходным CAD-файлом без потери ассоциативности.",
    fields: [sel("src", "Источник", "STEP", ["STEP", "IGES", "Parasolid", "NX", "Creo", "Inventor", "Catia"]), f("updates", "Обновлений в месяц", "8")],
    outputLabel: "3D Interconnect",
    compute: v => [
      { label: "Источник", value: String(v.src) },
      { label: "Обновлений в месяц", value: `${num(v.updates)}` },
      { label: "Экономия на реимпорте", value: `${fx(num(v.updates) * 12, 0)} мин/мес` },
    ],
  },

  "sw-defeature": {
    desc: "Defeature: упрощение модели для передачи, ускорение работы со сборкой.",
    fields: [f("faces", "Скрыть деталей", "40"), f("total", "Всего деталей", "220")],
    outputLabel: "Упрощение модели",
    compute: v => {
      const n = num(v.faces), t = num(v.total)
      return [
        { label: "Деталей упрощено", value: `${n}`},
        { label: "Осталось детализированных", value: `${Math.max(t - n, 0)}` },
        { label: "Сокращение объёма файла", value: `${fx(t > 0 ? (n / t) * 100 : 0, 1)} %` },
      ]
    },
  },

  "sw-flow-electronics": {
    desc: "CFD-охлаждение электроники: требуемая площадь радиатора и перегрев.",
    fields: [f("power", "Тепловыделение", "45", "Вт"), f("area", "Радиатор", "0.02", "м²"), f("amb", "Температура среды", "35", "°C")],
    outputLabel: "Охлаждение электроники",
    compute: v => {
      const P = num(v.power), A = num(v.area)
      const alpha = 15
      const dt = A > 0 ? P / (alpha * A) : 0
      return [
        { label: "Тепловыделение", value: `${fx(P)} Вт` },
        { label: "Площадь радиатора", value: `${fx(A, 4)} м²` },
        { label: "Перегрев над средой", value: `${fx(dt, 1)} °C` },
        { label: "Температура корпуса", value: `${fx(num(v.amb) + dt, 1)} °C` },
        { label: "Оценка", value: dt < 40 ? "✓ охлаждение достаточно" : "✗ требуется больший радиатор" },
      ]
    },
  },

  "sw-driveworks": {
    desc: "DriveWorks: автоматизация генерации моделей по правилам.",
    fields: [f("rules", "Правил", "120"), f("models", "Моделей в день", "15"), f("manual", "Время вручную", "40", "мин")],
    outputLabel: "Автоматизация DriveWorks",
    compute: v => {
      const m = num(v.models), man = num(v.manual)
      return [
        { label: "Правил в базе", value: `${num(v.rules)}` },
        { label: "Моделей в день", value: `${m}` },
        { label: "Время вручную", value: `${fx((m * man) / 60, 1)} ч/день` },
        { label: "Время автоматически", value: `${fx((m * 0.5) / 60, 2)} ч/день` },
        { label: "Экономия", value: `${fx((m * (man - 0.5)) / 60, 1)} ч/день` },
      ]
    },
  },

  "sw-sustain-cat": {
    desc: "Sustainability: эко-экспертиза изделия по материалу и массе.",
    fields: [f("mass", "Масса", "2.5", "кг"), sel("mat", "Материал", "Сталь", ["Сталь", "Алюминий", "Пластик", "Титан"])],
    outputLabel: "Эко-экспертиза",
    compute: v => {
      const co2: Record<string, number> = { "Сталь": 1.9, "Алюминий": 8.2, "Пластик": 3.1, "Титан": 35 }
      const m = num(v.mass)
      return [
        { label: "Материал", value: String(v.mat) },
        { label: "Масса", value: `${fx(m, 3)} кг` },
        { label: "CO₂-след", value: `${fx(m * (co2[String(v.mat)] ?? 2), 2)} кг` },
        { label: "Энергозатраты производства", value: `${fx(m * 25, 1)} МДж` },
      ]
    },
  },

  "sw-sketchxpert": {
    desc: "SketchXpert: разрешение конфликтов эскиза, оценка трудоёмкости.",
    fields: [f("confl", "Конфликтов", "3")],
    outputLabel: "Конфликты эскиза",
    compute: v => {
      const n = num(v.confl)
      return [
        { label: "Найдено конфликтов", value: `${n}` },
        { label: "Предложено решений", value: `${n * 2}` },
        { label: "Время на разбор вручную", value: `${fx(n * 3, 1)} мин` },
      ]
    },
  },

  "sw-featurexpert": {
    desc: "FeatureXpert/FilletXpert: автоматический порядок скруглений.",
    fields: [f("fillets", "Скруглений", "24")],
    outputLabel: "FeatureXpert",
    compute: v => {
      const n = num(v.fillets)
      return [
        { label: "Скруглений", value: `${n}` },
        { label: "Автоматически упорядочено", value: `${Math.round(n * 0.85)}` },
        { label: "Требует ручной правки", value: `${Math.round(n * 0.15)}` },
      ]
    },
  },

  "sw-assemblyxpert": {
    desc: "AssemblyXpert: оценка производительности большой сборки.",
    fields: [f("comps", "Компонентов", "1800")],
    outputLabel: "AssemblyXpert",
    compute: v => {
      const n = num(v.comps)
      return [
        { label: "Компонентов", value: fmtBig(n, 0) },
        { label: "Рекомендация", value: n > 1000 ? "включить облегчённый режим" : "полный режим допустим" },
        { label: "Оценка открытия", value: `${fx(n / 400, 1)} с` },
      ]
    },
  },

  "sw-matexpert": {
    desc: "MateXpert: диагностика сопряжений сборки, поиск избыточных/конфликтных.",
    fields: [f("mates", "Сопряжений", "120")],
    outputLabel: "MateXpert",
    compute: v => {
      const n = num(v.mates)
      const bad = Math.round(n * 0.04)
      return [
        { label: "Сопряжений", value: `${n}` },
        { label: "Избыточных", value: `${bad}` },
        { label: "Здоровых", value: `${n - bad}` },
      ]
    },
  },

  "sw-instant3d": {
    desc: "Instant3D: прямое перетаскивание граней, изменение объёма на лету.",
    fields: [f("d", "Смещение грани", "5", "мм"), f("area", "Площадь грани", "1500", "мм²")],
    outputLabel: "Instant3D",
    compute: v => {
      const dV = num(v.d) * num(v.area)
      return [
        { label: "Смещение", value: `${fx(num(v.d))} мм` },
        { label: "Изменение объёма", value: `${fx(dV / 1000, 2)} см³` },
        { label: "Масса изменения", value: `${fx(partMass(dV), 3)} кг` },
      ]
    },
  },

  "sw-featureworks": {
    desc: "FeatureWorks: распознавание параметрических элементов в импортированной модели.",
    fields: [f("faces", "Граней", "320")],
    outputLabel: "Распознавание элементов",
    compute: v => {
      const n = num(v.faces)
      const rec = Math.round(n * 0.78)
      return [
        { label: "Граней всего", value: `${n}` },
        { label: "Распознано элементов", value: `${rec}` },
        { label: "Доля распознавания", value: `${fx(n > 0 ? (rec / n) * 100 : 0, 1)} %` },
      ]
    },
  },

  "sw-translate": {
    desc: "Трансляция форматов CAD: оценка совместимости и размера файла.",
    fields: [sel("fmt", "Формат", "STEP AP214", ["STEP AP203", "STEP AP214", "Parasolid", "IGES", "ACIS", "STL", "CATIA"]), f("bodies", "Тел", "10")],
    outputLabel: "Трансляция формата",
    compute: v => {
      const kb: Record<string, number> = { "STEP AP203": 180, "STEP AP214": 210, "Parasolid": 140, "IGES": 260, "ACIS": 150, "STL": 90, "CATIA": 230 }
      const n = num(v.bodies)
      return [
        { label: "Формат", value: String(v.fmt) },
        { label: "Тел", value: `${n}` },
        { label: "Оценка размера файла", value: `${fx((n * (kb[String(v.fmt)] ?? 180)) / 1024, 2)} МБ` },
      ]
    },
  },

  "sw-tooling": {
    desc: "Проектирование оснастки: усилие смыкания и число гнёзд.",
    fields: [f("cav", "Гнёзд формы", "4"), f("area", "Площадь проекции", "4500", "мм²"), f("press", "Давление", "40", "МПа")],
    outputLabel: "Проектирование оснастки",
    compute: v => {
      const n = num(v.cav), F = (num(v.area) * n * num(v.press)) / 1000
      return [
        { label: "Гнёзд", value: `${n}` },
        { label: "Усилие смыкания", value: `${fmtBig(F, 0)} кН` },
        { label: "Требуемый ТПА", value: `от ${fmtBig(Math.ceil(F / 9.81 / 50) * 50, 0)} тс` },
      ]
    },
  },

  "sw-semantic-search": {
    desc: "Семантический поиск в дереве построения: оценка времени поиска.",
    fields: [f("feat", "Элементов в дереве", "260")],
    outputLabel: "Семантический поиск",
    compute: v => {
      const n = num(v.feat)
      return [
        { label: "Элементов в дереве", value: `${n}` },
        { label: "Время ручного поиска", value: `${fx(n * 0.4, 1)} с` },
        { label: "Время семантического поиска", value: "< 1 с" },
      ]
    },
  },

  "sw-select-size": {
    desc: "Выбор тел по размеру/объёму: сколько тел попадёт под порог.",
    fields: [f("thr", "Порог размера", "3", "мм"), f("total", "Всего тел", "500"), f("frac", "Доля мелких", "12", "%")],
    outputLabel: "Выбор по размеру",
    compute: v => {
      const n = num(v.total), p = num(v.frac) / 100
      return [
        { label: "Порог", value: `${fx(num(v.thr))} мм` },
        { label: "Тел выбрано", value: `${Math.round(n * p)}` },
        { label: "Тел вне выбора", value: `${Math.round(n * (1 - p))}` },
      ]
    },
  },

  "sw-filter-comp": {
    desc: "Фильтр компонентов сборки по уровню вложенности.",
    fields: [sel("level", "Уровень", "Верхний", ["Верхний", "Подсборки", "Все"]), f("total", "Компонентов всего", "1200")],
    outputLabel: "Фильтр компонентов",
    compute: v => {
      const n = num(v.total)
      const k: Record<string, number> = { "Верхний": 0.15, "Подсборки": 0.55, "Все": 1 }
      return [
        { label: "Уровень фильтра", value: String(v.level) },
        { label: "Компонентов показано", value: `${Math.round(n * (k[String(v.level)] ?? 1))}` },
      ]
    },
  },

  "sw-smooth-geom": {
    desc: "Smooth Geometry: сглаживание сетки после топологической оптимизации.",
    fields: [f("faces", "Граней", "1500"), f("iter", "Итераций сглаживания", "5")],
    outputLabel: "Сглаживание геометрии",
    compute: v => {
      const n = num(v.faces), it = Math.max(1, Math.round(num(v.iter)))
      return [
        { label: "Граней", value: `${n}` },
        { label: "Итераций", value: `${it}` },
        { label: "Время обработки", value: `${fx((n * it) / 50000, 1)} с` },
      ]
    },
  },

  "sw27-weld-cutlist": {
    desc: "Сварные конструкции: список отрезков и привязка к спецификации.",
    fields: [f("items", "Позиций в списке", "12"), sel("link", "Привязать к свойствам", "on", ["on", "off"])],
    outputLabel: "Cut List",
    compute: v => [
      { label: "Позиций в списке", value: `${num(v.items)}` },
      { label: "Привязка к спецификации", value: v.link === "on" ? "включена" : "выключена" },
    ],
  },

  "sw27-surface-organic": {
    desc: "Контроль непрерывности кривизны сопрягаемых поверхностей (G0–G3).",
    fields: [sel("cont", "Непрерывность", "G2 (кривизна)", ["G0 (позиция)", "G1 (касание)", "G2 (кривизна)", "G3"]), f("faces", "Сопрягаемых граней", "4")],
    outputLabel: "Контроль кривизны",
    compute: v => [
      { label: "Уровень непрерывности", value: String(v.cont) },
      { label: "Граней проверено", value: `${num(v.faces)}` },
      { label: "Качество поверхности", value: String(v.cont).startsWith("G2") || String(v.cont).startsWith("G3") ? "класс А" : "техническая" },
    ],
  },

  "sw27-reverse-eng": {
    desc: "Обратная инженерия: подгонка модели по облаку точек, оценка отклонения.",
    fields: [f("points", "Точек в облаке", "250000"), f("tol", "Допуск подгонки", "0.1", "мм")],
    outputLabel: "Скан → модель",
    compute: v => {
      const p = num(v.points)
      return [
        { label: "Точек в облаке", value: fmtBig(p, 0) },
        { label: "Допуск подгонки", value: `±${fx(num(v.tol), 3)} мм` },
        { label: "Поверхностей NURBS (оценка)", value: `${Math.round(p / 8000)}` },
      ]
    },
  },

  "sw27-selective-open": {
    desc: "Выборочная загрузка сборки: экономия времени открытия.",
    fields: [f("total", "Всего компонентов", "5000"), sel("filter", "Фильтр", "Только видимые", ["Только видимые", "По размеру", "По уровню", "Сохранённый фильтр"])],
    outputLabel: "Выборочная загрузка",
    compute: v => {
      const n = num(v.total)
      const k: Record<string, number> = { "Только видимые": 0.3, "По размеру": 0.5, "По уровню": 0.2, "Сохранённый фильтр": 0.15 }
      const loaded = n * (k[String(v.filter)] ?? 0.3)
      return [
        { label: "Загружено компонентов", value: fmtBig(loaded, 0) },
        { label: "Пропущено", value: fmtBig(n - loaded, 0) },
        { label: "Ускорение открытия", value: `в ${fx(n > 0 ? n / loaded : 0, 1)} раза` },
      ]
    },
  },

  "sw27-cosmetic-detect": {
    desc: "Распознавание косметических изменений при обновлении сборки.",
    fields: [f("comps", "Изменено компонентов", "8")],
    outputLabel: "Косметические изменения",
    compute: v => [
      { label: "Изменено компонентов", value: `${num(v.comps)}` },
      { label: "Полная перестройка", value: "не требуется" },
    ],
  },

  "sw27-nonlinear-rough": {
    desc: "Нелинейный контактный анализ: время расчёта по числу ядер.",
    fields: [f("cores", "Ядер CPU", "16"), sel("contact", "Тип контакта", "Rough", ["Bonded", "No Penetration", "Rough"]), f("nodes", "Узлов сетки", "450000")],
    outputLabel: "Нелинейный контакт",
    compute: v => {
      const c = Math.max(1, num(v.cores)), n = num(v.nodes)
      const base = n / 8000
      return [
        { label: "Тип контакта", value: String(v.contact) },
        { label: "Узлов сетки", value: fmtBig(n, 0) },
        { label: "Время на 1 ядре (оценка)", value: `${fx(base, 0)} мин` },
        { label: "Время на кластере", value: `${fx(base / (c * 0.75), 1)} мин` },
      ]
    },
  },

  "sw27-topology": {
    desc: "Топологическая оптимизация: снижение массы с симметрией и мин. толщиной.",
    fields: [f("mass", "Исходная масса", "8.5", "кг"), f("reduce", "Целевое снижение массы", "40", "%"), f("minsize", "Мин. размер элемента", "3", "мм")],
    outputLabel: "Топологическая оптимизация",
    compute: v => {
      const m = num(v.mass), r = num(v.reduce) / 100
      return [
        { label: "Исходная масса", value: `${fx(m, 3)} кг` },
        { label: "Целевая масса", value: `${fx(m * (1 - r), 3)} кг` },
        { label: "Экономия", value: `${fx(m * r, 3)} кг` },
        { label: "Мин. элемент сетки", value: `${fx(num(v.minsize))} мм` },
      ]
    },
  },

  "sw27-route-insulation": {
    desc: "Изоляционная оболочка трубы/провода: масса и площадь изоляции.",
    fields: [f("dia", "Диаметр трубы", "20", "мм"), f("thick", "Толщина изоляции", "5", "мм"), f("len", "Длина", "12", "м")],
    outputLabel: "Изоляционная оболочка",
    compute: v => {
      const d = num(v.dia), t = num(v.thick), L = num(v.len) * 1000
      const vol = Math.PI * ((d / 2 + t) ** 2 - (d / 2) ** 2) * L
      return [
        { label: "Наружный диаметр с изоляцией", value: `${fx(d + 2 * t)} мм` },
        { label: "Объём изоляции", value: `${fx(vol / 1e6, 3)} л` },
        { label: "Площадь поверхности", value: `${fx(Math.PI * (d + 2 * t) * L / 1e6, 2)} м²` },
      ]
    },
  },

  "sw27-auto-route-3d": {
    desc: "Auto-Route по 3D-эскизам: длина трассы и оценка времени прокладки.",
    fields: [f("seg", "Сегментов эскиза", "9"), f("avgLen", "Средняя длина сегмента", "150", "мм")],
    outputLabel: "Auto-Route 3D",
    compute: v => {
      const n = num(v.seg), L = num(v.avgLen)
      return [
        { label: "Сегментов", value: `${n}` },
        { label: "Общая длина трассы", value: `${fx((n * L) / 1000, 2)} м` },
        { label: "Время автотрассировки", value: `${fx(n * 0.8, 1)} с` },
      ]
    },
  },

  "sw27-circuitworks-trace": {
    desc: "ECAD-MCAD прослеживаемость: изменения платы под проверку.",
    fields: [f("changes", "Изменений на проверке", "7")],
    outputLabel: "ECAD-MCAD прослеживаемость",
    compute: v => [
      { label: "Изменений на проверке", value: `${num(v.changes)}` },
      { label: "Конфликтов с корпусом (оценка)", value: `${Math.round(num(v.changes) * 0.3)}` },
    ],
  },

  "sw27-aura": {
    desc: "AURA — ИИ-компаньон: рекомендации по задаче проектирования.",
    fields: [sel("task", "Задача", "Подсказка по проектированию", ["Подсказка по проектированию", "Оформление документации", "Поиск команды"])],
    outputLabel: "AURA",
    compute: v => [
      { label: "Задача", value: String(v.task) },
      { label: "Статус", value: "рекомендации подготовлены" },
    ],
  },

  "sw27-dspbr": {
    desc: "DSPBR — физически точные материалы: параметры рендера.",
    fields: [sel("mat", "Материал", "Полированный металл", ["Полированный металл", "Матовый пластик", "Стекло", "Резина", "Крашеный металл"]), f("rough", "Шероховатость", "0.2")],
    outputLabel: "DSPBR-материал",
    compute: v => [
      { label: "Материал", value: String(v.mat) },
      { label: "Шероховатость", value: fx(num(v.rough), 2) },
      { label: "Отражательная способность", value: `${fx((1 - num(v.rough)) * 100, 0)} %` },
    ],
  },

  "sw27-visualize-export": {
    desc: "Рендеринг без переключения контекста: время рендера по разрешению.",
    fields: [sel("res", "Разрешение", "1920×1080", ["1280×720", "1920×1080", "3840×2160"]), f("samples", "Сэмплов", "200")],
    outputLabel: "Экспорт рендера",
    compute: v => {
      const px: Record<string, number> = { "1280×720": 0.9, "1920×1080": 2.1, "3840×2160": 8.3 }
      const t = (px[String(v.res)] ?? 2.1) * num(v.samples)
      return [
        { label: "Разрешение", value: String(v.res) },
        { label: "Сэмплов", value: `${num(v.samples)}` },
        { label: "Время рендера", value: `${fx(t, 0)} с (${fx(t / 60, 1)} мин)` },
      ]
    },
  },

  "sw27-select-filters": {
    desc: "Фильтры выбора компонентов сборки по объёму/размеру тела.",
    fields: [sel("mode", "Режим", "По размеру тела", ["Компоненты верхнего уровня", "По элементу детали", "По размеру тела", "По объёму области"]), f("total", "Всего тел", "3200")],
    outputLabel: "Фильтры выбора",
    compute: v => {
      const n = num(v.total)
      return [
        { label: "Режим фильтра", value: String(v.mode) },
        { label: "Тел до фильтра", value: fmtBig(n, 0) },
        { label: "Тел после фильтра (оценка)", value: fmtBig(n * 0.18, 0) },
      ]
    },
  },

  "sw27-search-nonnative": {
    desc: "Поиск неродных терминов в интерфейсе (например, между локализациями).",
    fields: [txt("term", "Термин", "Pad")],
    outputLabel: "Поиск термина",
    compute: v => [
      { label: "Термин", value: String(v.term) },
      { label: "Найдено соответствий", value: "1 (Бобышка/Выдавливание)" },
    ],
  },

  "sw27-start-page": {
    desc: "Динамическая Start Page: список недавних файлов и рекомендации.",
    fields: [f("recent", "Недавних файлов", "10")],
    outputLabel: "Start Page",
    compute: v => [
      { label: "Недавних файлов", value: `${num(v.recent)}` },
      { label: "Рекомендации", value: "по последней активности" },
    ],
  },
}