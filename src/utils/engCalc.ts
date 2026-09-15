// ═══════════════════════════════════════════════════════════════════════════
// Библиотека инженерных расчётов: геодезия, дороги, поверхности, сети,
// документация. Используется рабочими функциями версий 2022–2027.
// Формулы по СП 34.13330, СП 32.13330, ГОСТ Р 21.1101, Маннинга, Шези.
// ═══════════════════════════════════════════════════════════════════════════

export type Row = { label: string; value: string }
export type P2 = [number, number]
export type P3 = [number, number, number]

export const num = (v: string | number | undefined): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0
  const n = parseFloat(String(v ?? "0").replace(",", ".").replace(/\s/g, ""))
  return Number.isFinite(n) ? n : 0
}

export const fx = (n: number, d = 2): string =>
  Number.isFinite(n) ? n.toFixed(d).replace(".", ",") : "—"

/** Разделитель тысяч для крупных чисел */
export const fmtBig = (n: number, d = 2): string => {
  if (!Number.isFinite(n)) return "—"
  const [i, f] = n.toFixed(d).split(".")
  const s = i.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  return f ? `${s},${f}` : s
}

// ─── Геометрия ────────────────────────────────────────────────────────────────

export const dist2 = (a: P2, b: P2): number => Math.hypot(b[0] - a[0], b[1] - a[1])

export const dist3 = (a: P3, b: P3): number =>
  Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])

/** Длина ломаной */
export const polyLength = (pts: P2[]): number => {
  let s = 0
  for (let i = 1; i < pts.length; i++) s += dist2(pts[i - 1], pts[i])
  return s
}

/** Площадь по формуле Гаусса (шнуровки), м² */
export const polyArea = (pts: P2[]): number => {
  const n = pts.length
  if (n < 3) return 0
  let s = 0
  for (let i = 0; i < n; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[(i + 1) % n]
    s += x1 * y2 - x2 * y1
  }
  return Math.abs(s) / 2
}

/** Периметр замкнутого контура */
export const polyPerimeter = (pts: P2[]): number => {
  if (pts.length < 2) return 0
  return polyLength(pts) + dist2(pts[pts.length - 1], pts[0])
}

/** Центр тяжести контура */
export const centroid = (pts: P2[]): P2 => {
  if (!pts.length) return [0, 0]
  const sx = pts.reduce((a, p) => a + p[0], 0)
  const sy = pts.reduce((a, p) => a + p[1], 0)
  return [sx / pts.length, sy / pts.length]
}

/** Дирекционный угол в градусах (0 = север, по часовой) */
export const bearing = (a: P2, b: P2): number => {
  const d = (Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI
  return (d + 360) % 360
}

/** Градусы → «123°45'30"» */
export const dms = (deg: number): string => {
  const d = Math.floor(Math.abs(deg))
  const mF = (Math.abs(deg) - d) * 60
  const m = Math.floor(mF)
  const s = Math.round((mF - m) * 60)
  const sign = deg < 0 ? "-" : ""
  return `${sign}${d}°${String(m).padStart(2, "0")}'${String(s).padStart(2, "0")}"`
}

/** Точка внутри полигона (луч) */
export const inPoly = (x: number, y: number, poly: P2[]): boolean => {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

// ─── Геодезия ─────────────────────────────────────────────────────────────────

/** Прямая геодезическая задача: от точки по дир. углу и расстоянию */
export const forwardGeo = (from: P2, bearingDeg: number, d: number): P2 => {
  const r = (bearingDeg * Math.PI) / 180
  return [from[0] + d * Math.sin(r), from[1] + d * Math.cos(r)]
}

/** Обратная задача: дир. угол + расстояние */
export const inverseGeo = (a: P2, b: P2) => ({
  bearing: bearing(a, b),
  distance: dist2(a, b),
})

/**
 * Уравнивание замкнутого теодолитного хода.
 * Возвращает невязки и допуск по инструкции (2·t·√n, t — точность прибора).
 */
export const traverseAdjust = (pts: P2[], accuracySec = 5) => {
  const n = pts.length
  const perim = polyPerimeter(pts)
  // Угловая невязка: сумма внутр. углов должна быть 180°(n-2)
  let sumAng = 0
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n], cur = pts[i], next = pts[(i + 1) % n]
    let a = bearing(cur, next) - bearing(cur, prev)
    a = ((a % 360) + 360) % 360
    sumAng += a
  }
  const theory = 180 * (n - 2)
  const fAng = sumAng - theory
  const tolAng = (2 * accuracySec * Math.sqrt(n)) / 3600 // в градусах
  // Линейная невязка хода (замыкание)
  const fx_ = pts.reduce((a, p, i) => a + (pts[(i + 1) % n][0] - p[0]), 0)
  const fy_ = pts.reduce((a, p, i) => a + (pts[(i + 1) % n][1] - p[1]), 0)
  const fAbs = Math.hypot(fx_, fy_)
  const rel = fAbs > 0 ? perim / fAbs : Infinity
  return {
    n, perimeter: perim, sumAngles: sumAng, theoryAngles: theory,
    fAngle: fAng, tolAngle: tolAng, angleOk: Math.abs(fAng) <= tolAng,
    fx: fx_, fy: fy_, fAbs, relative: rel, relOk: rel >= 2000,
  }
}

/** Ведомость координат с приращениями */
export const coordTable = (pts: P2[]) =>
  pts.map((p, i) => {
    const nx = pts[(i + 1) % pts.length]
    return {
      no: i + 1, x: p[0], y: p[1],
      dx: nx[0] - p[0], dy: nx[1] - p[1],
      dist: dist2(p, nx), bearing: bearing(p, nx),
    }
  })

/** Средняя квадратическая погрешность ряда измерений */
export const rmse = (vals: number[]): number => {
  if (vals.length < 2) return 0
  const m = vals.reduce((a, b) => a + b, 0) / vals.length
  const s = vals.reduce((a, b) => a + (b - m) ** 2, 0)
  return Math.sqrt(s / (vals.length - 1))
}

/** Нивелирный ход: невязка и допуск fh = 50мм·√L(км) (техническое нивелирование) */
export const levelingCheck = (hStart: number, hEnd: number, sumDh: number, lengthKm: number) => {
  const f = sumDh - (hEnd - hStart)
  const tol = (50 * Math.sqrt(Math.max(lengthKm, 0.001))) / 1000 // в метрах
  return { f, tol, ok: Math.abs(f) <= tol, fMm: f * 1000, tolMm: tol * 1000 }
}

// ─── Дороги и трассы ──────────────────────────────────────────────────────────

/**
 * Элементы круговой кривой по углу поворота и радиусу.
 * T — тангенс, K — длина кривой, B — биссектриса, D — домер.
 */
export const curveElements = (angleDeg: number, R: number) => {
  const a = (Math.abs(angleDeg) * Math.PI) / 180
  const T = R * Math.tan(a / 2)
  const K = R * a
  const B = R * (1 / Math.cos(a / 2) - 1)
  const D = 2 * T - K
  return { T, K, B, D, angle: Math.abs(angleDeg), R }
}

/**
 * Минимальный радиус кривой в плане (СП 34.13330):
 * R = V² / (127·(i_поп + µ)), V км/ч.
 */
export const minRadius = (V: number, superelev = 0.04, friction = 0.15): number =>
  (V * V) / (127 * (superelev + friction))

/** Длина переходной кривой (клотоида): L = V³/(47·R·I), I — нарастание ц/б ускорения */
export const clothoidLength = (V: number, R: number, I = 0.5): number =>
  R > 0 ? (V * V * V) / (47 * R * I) : 0

/** Параметр клотоиды A = √(R·L) */
export const clothoidParam = (R: number, L: number): number => Math.sqrt(Math.max(R * L, 0))

/** Расстояние видимости для остановки (СП 34.13330) */
export const stoppingSight = (V: number, slope = 0, friction = 0.3, react = 1.5): number => {
  const v = V / 3.6
  return v * react + (v * v) / (2 * 9.81 * (friction + slope))
}

/** Вертикальная кривая: длина по разности уклонов и радиусу */
export const vertCurve = (i1: number, i2: number, R: number) => {
  const d = Math.abs(i1 - i2)
  const L = R * d
  const T = L / 2
  const bis = (T * T) / (2 * R)
  return { L, T, bisector: bis, deltaI: d, R }
}

/** Вираж: уклон по радиусу и скорости, ограничен максимумом */
export const superelevation = (V: number, R: number, maxI = 0.06, friction = 0.15): number => {
  if (R <= 0) return 0
  const i = (V * V) / (127 * R) - friction
  return Math.min(Math.max(i, 0.02), maxI)
}

/** Пикетаж: 1250.5 → «ПК12+50,50» */
export const station = (m: number): string => {
  const pk = Math.floor(m / 100)
  const plus = m - pk * 100
  return `ПК${pk}+${plus.toFixed(2).padStart(5, "0").replace(".", ",")}`
}

/** Уклон в промилле */
export const slopePromille = (dh: number, len: number): number => (len > 0 ? (dh / len) * 1000 : 0)

/** Разбивка трассы на пикеты с координатами */
export const stationPoints = (pts: P2[], step = 100): { s: number; p: P2 }[] => {
  const out: { s: number; p: P2 }[] = []
  if (pts.length < 2) return out
  const total = polyLength(pts)
  for (let s = 0; s <= total; s += step) {
    let acc = 0
    for (let i = 1; i < pts.length; i++) {
      const seg = dist2(pts[i - 1], pts[i])
      if (acc + seg >= s) {
        const t = seg > 0 ? (s - acc) / seg : 0
        out.push({ s, p: [
          pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t,
          pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t,
        ] })
        break
      }
      acc += seg
    }
  }
  return out
}

/** Смещённая линия (офсет) от оси */
export const offsetLine = (pts: P2[], offset: number): P2[] =>
  pts.map((p, i) => {
    const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, pts.length - 1)]
    const dx = b[0] - a[0], dy = b[1] - a[1]
    const L = Math.hypot(dx, dy) || 1
    return [p[0] + (dy / L) * offset, p[1] - (dx / L) * offset] as P2
  })

// ─── Земляные работы и поверхности ────────────────────────────────────────────

/** Объём призматоидом: V = L/6·(A1 + 4Am + A2) */
export const prismoid = (A1: number, Am: number, A2: number, L: number): number =>
  (L / 6) * (A1 + 4 * Am + A2)

/** Объём средними площадями между сечениями */
export const avgAreaVolume = (areas: number[], step: number): number => {
  let v = 0
  for (let i = 1; i < areas.length; i++) v += ((areas[i - 1] + areas[i]) / 2) * step
  return v
}

/** Площадь поперечника трапецией: низ b, высота h, заложение m */
export const sectionArea = (b: number, h: number, m = 1.5): number => h * (b + m * h)

/**
 * Картограмма земляных масс по сетке квадратов.
 * grid — рабочие отметки (проект − факт) по узлам, a — сторона квадрата.
 */
export const gridEarthwork = (grid: number[][], a: number) => {
  let fill = 0, cut = 0
  const rows = grid.length, cols = grid[0]?.length ?? 0
  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < cols - 1; j++) {
      const h = [grid[i][j], grid[i][j + 1], grid[i + 1][j], grid[i + 1][j + 1]]
      const pos = h.filter(v => v > 0), neg = h.filter(v => v < 0)
      const A = a * a
      if (neg.length === 0) fill += (A * h.reduce((s, v) => s + v, 0)) / 4
      else if (pos.length === 0) cut += (A * Math.abs(h.reduce((s, v) => s + v, 0))) / 4
      else {
        const sp = pos.reduce((s, v) => s + v, 0), sn = Math.abs(neg.reduce((s, v) => s + v, 0))
        const t = sp + sn || 1
        fill += (A * sp * sp) / (4 * t)
        cut += (A * sn * sn) / (4 * t)
      }
    }
  }
  return { fill, cut, balance: fill - cut }
}

/** Объём между поверхностью и базой (призмы по точкам) */
export const surfaceVolume = (pts: P3[], baseZ: number) => {
  if (pts.length < 3) return { fill: 0, cut: 0, area: 0, balance: 0 }
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1])
  const area = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys))
  const cell = pts.length > 0 ? area / pts.length : 0
  let fill = 0, cut = 0
  pts.forEach(p => {
    const d = p[2] - baseZ
    if (d > 0) fill += d * cell
    else cut += -d * cell
  })
  return { fill, cut, area, balance: fill - cut }
}

/** Статистика поверхности: отметки, уклоны */
export const surfaceStats = (pts: P3[]) => {
  if (!pts.length) return { minZ: 0, maxZ: 0, avgZ: 0, range: 0, count: 0 }
  const zs = pts.map(p => p[2])
  const minZ = Math.min(...zs), maxZ = Math.max(...zs)
  return {
    minZ, maxZ, avgZ: zs.reduce((a, b) => a + b, 0) / zs.length,
    range: maxZ - minZ, count: pts.length,
  }
}

/** Отметки горизонталей с заданным сечением рельефа */
export const contourLevels = (minZ: number, maxZ: number, step: number): number[] => {
  const out: number[] = []
  if (step <= 0) return out
  const start = Math.ceil(minZ / step) * step
  for (let z = start; z <= maxZ; z += step) out.push(Math.round(z * 1000) / 1000)
  return out
}

/** Коэффициент уплотнения / разрыхления грунта */
export const compaction = (volume: number, kRazr = 1.15, kUpl = 0.95) => ({
  loose: volume * kRazr,
  compacted: volume * kUpl,
  transport: volume * kRazr,
})

// ─── Инженерные сети и гидравлика ─────────────────────────────────────────────

/** Площадь живого сечения круглой трубы при наполнении h/D */
export const pipeFlowArea = (D: number, fill = 1): number => {
  const h = D * Math.min(Math.max(fill, 0.01), 1)
  const r = D / 2
  const theta = 2 * Math.acos(Math.max(Math.min((r - h) / r, 1), -1))
  return (r * r * (theta - Math.sin(theta))) / 2
}

/** Смоченный периметр круглой трубы */
export const wettedPerimeter = (D: number, fill = 1): number => {
  const h = D * Math.min(Math.max(fill, 0.01), 1)
  const r = D / 2
  const theta = 2 * Math.acos(Math.max(Math.min((r - h) / r, 1), -1))
  return r * theta
}

/**
 * Расход по Маннингу: Q = (1/n)·A·R^(2/3)·i^(1/2).
 * D — диаметр, м; i — уклон; n — шероховатость; fill — наполнение h/D.
 */
export const manning = (D: number, slope: number, n = 0.013, fill = 1) => {
  const A = pipeFlowArea(D, fill)
  const P = wettedPerimeter(D, fill)
  const R = P > 0 ? A / P : 0
  const i = Math.max(slope, 0.00001)
  const v = (1 / n) * Math.pow(R, 2 / 3) * Math.sqrt(i)
  return { Q: v * A, v, area: A, R, perimeter: P }
}

/** Минимальный (незаиливающий) уклон трубы: i = 1/D(мм) по СП 32.13330 */
export const minPipeSlope = (Dmm: number): number => (Dmm > 0 ? 1 / Dmm : 0)

/** Подбор диаметра под расход по ряду стандартных диаметров */
export const selectDiameter = (Q: number, slope: number, n = 0.013, fill = 0.7): number => {
  const std = [0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 2.0]
  for (const D of std) if (manning(D, slope, n, fill).Q >= Q) return D
  return std[std.length - 1]
}

/** Расход дождевых вод (метод предельных интенсивностей, СП 32.13330) */
export const stormFlow = (area: number, q20: number, psi: number, t = 10, n = 0.65) => {
  const q = q20 * Math.pow(20 / Math.max(t, 1), n)
  return { Q: (psi * q * area) / 10000, intensity: q }
}

/** Потери напора по длине (Дарси–Вейсбах) */
export const headLoss = (L: number, D: number, v: number, lambda = 0.03): number =>
  D > 0 ? lambda * (L / D) * ((v * v) / (2 * 9.81)) : 0

/** Профиль самотёчной сети по колодцам */
export const gravityProfile = (start: number, slope: number, lengths: number[]) => {
  const out: { no: number; len: number; top: number; bottom: number; depth: number }[] = []
  let z = start
  lengths.forEach((L, i) => {
    const b = z - L * slope
    out.push({ no: i + 1, len: L, top: z, bottom: b, depth: L * slope })
    z = b
  })
  return out
}

// ─── Документация и ведомости ─────────────────────────────────────────────────

/** Масштабный коэффициент: «1:500» → 500 */
export const scaleFactor = (s: string): number => num(String(s).split(":")[1] || s) || 1

/** Размер листа в мм */
export const SHEETS: Record<string, [number, number]> = {
  A0: [1189, 841], A1: [841, 594], A2: [594, 420], A3: [420, 297], A4: [297, 210],
}

/** Сколько листов нужно на участок трассы */
export const sheetCount = (lengthM: number, sheet = "A3", scale = 500, overlapPct = 10) => {
  const [w] = SHEETS[sheet] ?? SHEETS.A3
  const cover = (w / 1000) * scale * (1 - overlapPct / 100)
  return { count: Math.max(1, Math.ceil(lengthM / cover)), coverage: cover }
}

/** Ведомость объёмов: суммы и итог со стоимостью */
export const boq = (items: { name: string; qty: number; unit: string; price?: number }[]) => {
  const total = items.reduce((a, i) => a + i.qty * (i.price ?? 0), 0)
  return { items, total, count: items.length }
}

// ═══════════════════════════════════════════════════════════════════════════
// Машиностроение: прочность, листовой металл, передачи, литьё, CFD, раскрой
// ═══════════════════════════════════════════════════════════════════════════

/** Плотность материалов, кг/м³ */
export const DENSITY: Record<string, number> = {
  "Сталь": 7850, "Чугун": 7200, "Алюминий": 2700, "Титан": 4500,
  "Медь": 8960, "Латунь": 8500, "Пластик": 1100,
  "ABS": 1050, "PP": 905, "PA6": 1140, "PC": 1200, "POM": 1410,
}

/** Модуль упругости (Юнга) материалов, МПа */
export const YOUNG: Record<string, number> = {
  "Сталь": 210000, "Чугун": 110000, "Алюминий": 70000, "Титан": 110000,
  "Медь": 120000, "Латунь": 100000, "Пластик": 2500,
}

/** Усадка материалов при литье, % */
export const SHRINKAGE: Record<string, number> = {
  "Сталь": 2.0, "Чугун": 1.0, "Алюминий": 1.2, "Титан": 1.5,
  "Медь": 1.6, "Латунь": 1.5, "Пластик": 0.5,
  "ABS": 0.5, "PP": 1.8, "PA6": 1.2, "PC": 0.6, "POM": 2.0,
}

/** Нормальное напряжение σ = F / A (МПа при Н и мм²) */
export const stress = (force: number, area: number): number => (area > 0 ? force / area : 0)

/** Коэффициент запаса прочности n = предел / напряжение */
export const safetyFactor = (limit: number, s: number): number => (s > 0 ? limit / s : Infinity)

/** Закон Гука: деформация и удлинение стержня */
export const hooke = (s: number, E: number, L: number) => {
  const strain = E > 0 ? s / E : 0
  return { strainPct: strain * 100, elongation: strain * L }
}

/** Момент инерции прямоугольного сечения, мм⁴ */
export const inertiaRect = (b: number, h: number): number => (b * h ** 3) / 12

/** Прогиб балки: шарнирная (simple) или консольная (console) схема */
export const beamDeflection = (F: number, L: number, E: number, I: number, kind: "simple" | "console") => {
  const moment = kind === "console" ? F * L : (F * L) / 4
  const deflection = E > 0 && I > 0
    ? (kind === "console" ? (F * L ** 3) / (3 * E * I) : (F * L ** 3) / (48 * E * I))
    : 0
  return { moment, deflection }
}

/** Припуск на гиб листового металла (K-фактор) */
export const bendAllowance = (t: number, r: number, angDeg: number, k: number) => {
  const ang = (angDeg * Math.PI) / 180
  const neutralRadius = r + k * t
  const bendAllowanceV = ang * neutralRadius
  const setback = (r + t) * Math.tan(ang / 2)
  const deduction = 2 * setback - bendAllowanceV
  return { bendAllowance: bendAllowanceV, setback, deduction, neutralRadius }
}

/** Минимальный радиус гиба (≈ толщина металла) */
export const minBendRadius = (t: number): number => t

/** Усилие гибки (V-образный штамп), кН */
export const bendForce = (t: number, width: number, vOpening: number): number =>
  vOpening > 0 ? (0.6 * 500 * width * t * t) / vOpening / 1000 : 0

/** Расчёт зубчатой передачи по модулю и числу зубьев шестерни */
export const gearDrive = (z1: number, ratio: number, m: number) => {
  const z2 = Math.round(z1 * ratio)
  const realRatio = z2 / z1
  const d1 = m * z1, d2 = m * z2
  return { z1, z2, realRatio, d1, d2, da1: d1 + 2 * m, da2: d2 + 2 * m, center: (d1 + d2) / 2 }
}

/** Крутящий момент по мощности (кВт) и оборотам (об/мин), Н·м */
export const torque = (powerKw: number, rpm: number): number =>
  rpm > 0 ? (powerKw * 1000 * 60) / (2 * Math.PI * rpm) : 0

/** Собственная частота колебаний одномассовой системы, Гц */
export const naturalFreq = (k: number, m: number): number =>
  m > 0 ? (1 / (2 * Math.PI)) * Math.sqrt(k / m) : 0

/** Усталостная прочность: запас и ресурс по упрощённой кривой Вёлера */
export const fatigue = (amp: number, limit: number) => {
  const infinite = amp <= limit
  const safety = amp > 0 ? limit / amp : Infinity
  const cycles = infinite ? Infinity : 2e6 * (limit / amp) ** 3
  return { infinite, safety, cycles }
}

/** Число Рейнольдса Re = v·d/ν */
export const reynolds = (v: number, d: number, nu: number): number => (nu > 0 ? (v * d) / nu : 0)

/** Режим течения по числу Рейнольдса */
export const flowRegime = (Re: number): string =>
  Re < 2300 ? "Ламинарный" : Re < 4000 ? "Переходный" : "Турбулентный"

/** Время охлаждения отливки/детали при литье пластмасс, с */
export const coolingTime = (wallMm: number): number => 2.5 * wallMm * wallMm

/** Раскрой листов: число листов, использование, отходы */
export const nesting = (parts: number, partArea: number, sheetArea: number) => {
  const usedArea = parts * partArea
  const perSheet = sheetArea > 0 ? Math.floor(sheetArea / partArea) : 0
  const sheets = perSheet > 0 ? Math.ceil(parts / perSheet) : 0
  const totalArea = sheets * sheetArea
  const usage = totalArea > 0 ? (usedArea / totalArea) * 100 : 0
  return { sheets, usedArea, totalArea, usage, waste: totalArea - usedArea }
}

/** Масса детали по объёму (мм³) и материалу, кг */
export const partMass = (volumeMm3: number, mat = "Сталь"): number =>
  (volumeMm3 * (DENSITY[mat] ?? 7850)) / 1e9 * 1000

/** Расчёт сварного шва: площадь, масса наплавки, расход электродов, время */
export const welding = (lengthMm: number, legMm: number) => {
  const area = 0.5 * legMm * legMm
  const volume = area * lengthMm
  const mass = (volume * 7850) / 1e9
  const electrodes = mass * 1.6
  const time = lengthMm / 1000 / 0.25
  return { area, mass, electrodes, time }
}