// ═══════════════════════════════════════════════════════════════════════════
// Рабочие расчёты для BIM/3D-визуализации, инженерных сетей (Routing/HVAC/
// Electrical) и геодезии (тахеометрия, GNSS, обмен ГИС-форматами).
// ═══════════════════════════════════════════════════════════════════════════

import type { Upgrade } from "./versions-upgrades"
import {
  num, fx, fmtBig, minRadius, clothoidLength, superelevation, partMass,
} from "@/utils/engCalc"
import { buildPipeline, buildSolidFootprint, buildPoints } from "@/utils/featureActions"

const f = (key: string, label: string, def: string, suffix?: string) =>
  ({ key, label, type: "number" as const, default: def, suffix })
const sel = (key: string, label: string, def: string, options: string[]) =>
  ({ key, label, type: "select" as const, default: def, options })
const txt = (key: string, label: string, def: string) =>
  ({ key, label, type: "text" as const, default: def })

export const bimUpgrades: Record<string, Upgrade> = {

  // ─── BIM / 3D-МОДЕЛИРОВАНИЕ ────────────────────────────────────────────────

  "acad-3d-sweep": {
    desc: "Тело сдвига профиля по траектории: объём, масса, площадь боковой поверхности.",
    fields: [f("area", "Площадь профиля", "314", "мм²"), f("len", "Длина пути", "1500", "мм"), f("per", "Периметр профиля", "63", "мм")],
    outputLabel: "Тело сдвига",
    compute: v => {
      const A = num(v.area), L = num(v.len), per = num(v.per)
      const V = A * L
      return [
        { label: "Объём тела", value: `${fx(V / 1000, 1)} см³` },
        { label: "Боковая поверхность", value: `${fmtBig(per * L, 0)} мм²` },
        { label: "Масса (сталь)", value: `${fx(partMass(V), 3)} кг` },
      ]
    },
    buildLabel: "Показать габарит",
    build: (v, a) => buildSolidFootprint(a, Math.sqrt(num(v.area)) * 2, Math.sqrt(num(v.area)) * 2, num(v.len), "Тело сдвига"),
  },

  "acad-3d-loft": {
    desc: "Тело по сечениям (Loft): оценка объёма по числу и площади сечений.",
    fields: [f("sections", "Сечений", "4"), f("avgArea", "Средняя площадь сечения", "600", "мм²"), f("h", "Общая высота", "400", "мм")],
    outputLabel: "Тело по сечениям",
    compute: v => {
      const n = Math.max(2, Math.round(num(v.sections))), A = num(v.avgArea), h = num(v.h)
      const V = A * h
      return [
        { label: "Сечений", value: `${n}` },
        { label: "Оценка объёма", value: `${fx(V / 1000, 1)} см³` },
        { label: "Масса (пластик)", value: `${fx(partMass(V, "Пластик"), 3)} кг` },
        { label: "Плавность (сечений/100мм)", value: fx((n / h) * 100, 2) },
      ]
    },
    buildLabel: "Показать габарит",
    build: (v, a) => buildSolidFootprint(a, Math.sqrt(num(v.avgArea)) * 2, Math.sqrt(num(v.avgArea)) * 2, num(v.h), "Тело по сечениям"),
  },

  "acad-3d-union": {
    desc: "Булево объединение тел: итоговый объём с учётом общей части.",
    fields: [f("v1", "Объём тела 1", "1200", "см³"), f("v2", "Объём тела 2", "800", "см³"), f("overlap", "Пересечение", "150", "см³")],
    outputLabel: "Объединение",
    compute: v => {
      const v1 = num(v.v1), v2 = num(v.v2), ov = num(v.overlap)
      return [
        { label: "Объём объединения", value: `${fx(v1 + v2 - ov, 1)} см³` },
        { label: "Экономия от пересечения", value: `${fx(ov, 1)} см³` },
        { label: "Масса результата (сталь)", value: `${fx(partMass((v1 + v2 - ov) * 1000), 3)} кг` },
      ]
    },
  },

  "acad-3d-subtract": {
    desc: "Булево вычитание: объём результата после выреза.",
    fields: [f("v1", "Объём основы", "2000", "см³"), f("v2", "Объём выреза", "450", "см³")],
    outputLabel: "Вычитание",
    compute: v => {
      const v1 = num(v.v1), v2 = num(v.v2)
      return [
        { label: "Объём результата", value: `${fx(Math.max(v1 - v2, 0), 1)} см³` },
        { label: "Доля удалённого материала", value: `${fx(v1 > 0 ? (v2 / v1) * 100 : 0, 1)} %` },
        { label: "Масса результата (сталь)", value: `${fx(partMass(Math.max(v1 - v2, 0) * 1000), 3)} кг` },
      ]
    },
  },

  "acad-3d-intersect": {
    desc: "Булево пересечение тел: объём общей части.",
    fields: [f("overlap", "Общий объём", "320", "см³")],
    outputLabel: "Пересечение",
    compute: v => [
      { label: "Объём пересечения", value: `${fx(num(v.overlap), 1)} см³` },
      { label: "Масса (сталь)", value: `${fx(partMass(num(v.overlap) * 1000), 3)} кг` },
    ],
  },

  "acad-3d-mesh": {
    desc: "Полигональная сеть: число граней и оценка объёма данных.",
    fields: [f("u", "Разбиений U", "12"), f("w", "Разбиений V", "12")],
    outputLabel: "Сеть (Mesh)",
    compute: v => {
      const u = Math.max(1, Math.round(num(v.u))), w = Math.max(1, Math.round(num(v.w)))
      const faces = u * w * 2
      return [
        { label: "Вершин сетки", value: `${(u + 1) * (w + 1)}` },
        { label: "Граней (треугольников)", value: `${faces}` },
        { label: "Оценка размера", value: `${fx((faces * 36) / 1024, 1)} КБ` },
      ]
    },
  },

  "acad-3d-render": {
    desc: "Визуализация модели: время рендера по разрешению и качеству.",
    fields: [f("w", "Ширина", "1920", "px"), f("h", "Высота", "1080", "px"), sel("q", "Качество", "Высокое", ["Черновик", "Среднее", "Высокое", "Presentation"])],
    outputLabel: "Визуализация",
    compute: v => {
      const px = num(v.w) * num(v.h)
      const k: Record<string, number> = { "Черновик": 0.3, "Среднее": 1, "Высокое": 3, "Presentation": 8 }
      const t = (px / 1e6) * (k[String(v.q)] ?? 1) * 4
      return [
        { label: "Разрешение", value: `${num(v.w)}×${num(v.h)} (${fx(px / 1e6, 1)} МП)` },
        { label: "Качество", value: String(v.q) },
        { label: "Время рендера", value: `${fx(t, 1)} с` },
      ]
    },
  },

  "acad-2023-3dgraphics": {
    desc: "Аппаратный движок отображения: FPS-оценка и требования к видеопамяти.",
    fields: [f("objects", "Объектов в модели", "250000")],
    outputLabel: "Производительность 3D",
    compute: v => {
      const n = num(v.objects)
      return [
        { label: "Объектов в модели", value: fmtBig(n, 0) },
        { label: "Оценка FPS", value: `${Math.max(24, Math.round(60 - n / 20000))} к/с` },
        { label: "Видеопамять (оценка)", value: `${fx((n * 180) / 1048576, 1)} МБ` },
      ]
    },
  },

  "civil-2025-model-viewer": {
    desc: "3D-просмотрщик: FPS-оценка по числу слоёв и объектов модели.",
    fields: [f("layers", "Слоёв модели", "12"), f("objs", "Объектов на слой", "800")],
    outputLabel: "3D-просмотр",
    compute: v => {
      const total = num(v.layers) * num(v.objs)
      return [
        { label: "Всего объектов", value: fmtBig(total, 0) },
        { label: "Оценка FPS", value: `${Math.max(15, Math.round(60 - total / 15000))} к/с` },
        { label: "Память видеокарты", value: `${fx((total * 2.4) / 1024, 1)} МБ` },
      ]
    },
  },

  "kompas-v24-render": {
    desc: "Фотореалистичная визуализация: время рендера по разрешению и качеству.",
    fields: [sel("res", "Разрешение", "Full HD", ["HD", "Full HD", "2K", "4K"]), sel("quality", "Качество", "Высокое", ["Черновик", "Среднее", "Высокое", "Финальное"])],
    outputLabel: "Визуализация",
    compute: v => {
      const px: Record<string, number> = { "HD": 1.3, "Full HD": 2.1, "2K": 3.7, "4K": 8.3 }
      const k: Record<string, number> = { "Черновик": 0.4, "Среднее": 1, "Высокое": 2.5, "Финальное": 6 }
      const t = (px[String(v.res)] ?? 2) * (k[String(v.quality)] ?? 1) * 8
      return [
        { label: "Разрешение / качество", value: `${v.res} / ${v.quality}` },
        { label: "Время рендера кадра", value: `${fx(t, 1)} с` },
      ]
    },
  },

  "sw-render": {
    desc: "PhotoView 360: время рендера сцены по разрешению.",
    fields: [sel("res", "Разрешение", "Full HD", ["HD", "Full HD", "2K", "4K"])],
    outputLabel: "Фотореалистичный рендер",
    compute: v => {
      const px: Record<string, number> = { "HD": 1.3, "Full HD": 2.1, "2K": 3.7, "4K": 8.3 }
      const t = (px[String(v.res)] ?? 2) * 12
      return [
        { label: "Разрешение", value: String(v.res) },
        { label: "Время рендера", value: `${fx(t, 1)} с` },
      ]
    },
  },

  "sw-visualize": {
    desc: "Visualize: время рендера по разрешению и числу сэмплов.",
    fields: [sel("res", "Разрешение", "4K", ["Full HD", "2K", "4K", "8K"]), f("samples", "Сэмплов", "512")],
    outputLabel: "Visualize рендер",
    compute: v => {
      const px: Record<string, number> = { "Full HD": 2.1, "2K": 3.7, "4K": 8.3, "8K": 33 }
      const t = (px[String(v.res)] ?? 8) * (num(v.samples) / 100)
      return [
        { label: "Разрешение", value: String(v.res) },
        { label: "Сэмплов", value: `${num(v.samples)}` },
        { label: "Время рендера", value: `${fx(t, 0)} с (${fx(t / 60, 1)} мин)` },
      ]
    },
  },

  "interop-ifc-export": {
    desc: "Экспорт IFC: элементов, схема, оценка объёма данных.",
    fields: [sel("schema", "Схема", "IFC4", ["IFC2x3", "IFC4", "IFC4.3"]), f("elems", "Элементов", "860")],
    outputLabel: "Экспорт IFC",
    compute: v => {
      const n = num(v.elems)
      return [
        { label: "Схема", value: String(v.schema) },
        { label: "Элементов экспортировано", value: fmtBig(n, 0) },
        { label: "Оценка размера файла", value: `${fx((n * 2.4) / 1024, 2)} МБ` },
      ]
    },
  },

  "interop-rvt": {
    desc: "Связь с Revit: режим подключения и обновление модели.",
    fields: [sel("mode", "Режим", "Связь", ["Связь", "Импорт копией"]), f("elems", "Элементов в модели", "1200")],
    outputLabel: "Связь с Revit",
    compute: v => [
      { label: "Режим", value: String(v.mode) },
      { label: "Элементов", value: `${num(v.elems)}` },
      { label: "Обновление", value: v.mode === "Связь" ? "автоматическое при изменении" : "вручную по запросу" },
    ],
  },

  "kompas-v24-ifc-classes": {
    desc: "IFC: авто-классификация инженерных элементов по разделу проекта.",
    fields: [sel("section", "Раздел", "ОВ", ["ОВ", "ВК", "ТХ", "ЭОМ"]), f("elems", "Элементов", "320")],
    outputLabel: "Классификация IFC",
    compute: v => {
      const cls: Record<string, string> = { "ОВ": "IfcDuctSegment / IfcAirTerminal", "ВК": "IfcPipeSegment / IfcValve", "ТХ": "IfcFlowSegment", "ЭОМ": "IfcCableCarrierSegment" }
      return [
        { label: "Раздел", value: String(v.section) },
        { label: "IFC-классы", value: cls[String(v.section)] ?? "IfcElement" },
        { label: "Элементов классифицировано", value: `${num(v.elems)}` },
      ]
    },
  },

  "civil-2022-corridor-clip": {
    desc: "Клиппинг областей коридора по пикетажу: длина и площадь выделенного участка.",
    fields: [f("from", "ПК начало", "0", "м"), f("to", "ПК конец", "150", "м"), f("w", "Ширина коридора", "12", "м")],
    outputLabel: "Область коридора",
    compute: v => {
      const L = num(v.to) - num(v.from)
      return [
        { label: "Длина участка", value: `${fx(L)} м` },
        { label: "Площадь области", value: `${fmtBig(L * num(v.w))} м²` },
        { label: "От ПК", value: `${fx(num(v.from))} до ${fx(num(v.to))}` },
      ]
    },
  },

  "civil-2027-ai-corridor": {
    desc: "ИИ-помощник коридора: рекомендации по геометрии для категории дороги.",
    fields: [sel("cat", "Категория дороги", "II", ["I", "II", "III", "IV", "V"]), f("speed", "Расч. скорость", "100", "км/ч")],
    outputLabel: "AI Corridor",
    compute: v => {
      const V = num(v.speed)
      const Rmin = minRadius(V)
      const L = clothoidLength(V, Rmin)
      return [
        { label: "Категория / скорость", value: `${v.cat} / ${V} км/ч` },
        { label: "Рекомендуемый мин. радиус", value: `${fx(Rmin)} м` },
        { label: "Переходная кривая", value: `${fx(L)} м` },
        { label: "Рекомендуемый вираж", value: `${fx(superelevation(V, Rmin) * 1000, 1)} ‰` },
      ]
    },
  },

  // ─── ИНЖЕНЕРНЫЕ СЕТИ (Routing / HVAC / Electrical) ─────────────────────────

  "kompas-v24-pipes": {
    desc: "Проектирование трубопроводов: гидравлика, масса трассы, материал.",
    fields: [f("dn", "Диаметр DN", "100", "мм"), f("len", "Длина трассы", "24", "м"), sel("mat", "Материал", "Сталь", ["Сталь", "Нержавейка", "ПНД", "Медь"])],
    outputLabel: "Трубопровод",
    compute: v => {
      const dn = num(v.dn), L = num(v.len)
      const wallT: Record<string, number> = { "Сталь": 4, "Нержавейка": 3, "ПНД": 6, "Медь": 1.5 }
      const ro: Record<string, number> = { "Сталь": 7850, "Нержавейка": 7900, "ПНД": 950, "Медь": 8930 }
      const t = wallT[String(v.mat)] ?? 4
      const vol = Math.PI * ((dn / 2 + t) ** 2 - (dn / 2) ** 2) * L * 1000
      const mass = (vol * (ro[String(v.mat)] ?? 7850)) / 1e9
      return [
        { label: "Диаметр / материал", value: `DN${fx(dn, 0)} ${v.mat}` },
        { label: "Толщина стенки", value: `${fx(t, 1)} мм` },
        { label: "Масса трассы", value: `${fx(mass, 2)} кг` },
        { label: "Объём внутри трубы", value: `${fx(Math.PI * (dn / 2) ** 2 * L / 1e6, 3)} м³` },
      ]
    },
    buildLabel: "Построить трассу",
    build: (v, a) => {
      const L = num(v.len)
      return buildPipeline([[a[0] - L / 2, a[1]], [a[0], a[1] + L * 0.1], [a[0] + L / 2, a[1]]], num(v.dn) / 1000, String(v.mat), 0.003)
    },
  },

  "kompas-v24-pid": {
    desc: "Технологическая схема P&ID: число элементов и оценка листов.",
    fields: [f("elems", "Элементов на схеме", "85"), txt("mat", "Материал труб", "Ст20")],
    outputLabel: "Схема P&ID",
    compute: v => {
      const n = num(v.elems)
      return [
        { label: "Элементов на схеме", value: `${n}` },
        { label: "Материал труб", value: String(v.mat) },
        { label: "Оценка листов A1", value: `${Math.max(1, Math.ceil(n / 40))}` },
      ]
    },
  },

  "sw-flow-hvac": {
    desc: "HVAC-расчёт микроклимата: требуемый расход воздуха по кратности обмена.",
    fields: [f("vol", "Объём помещения", "120", "м³"), f("ach", "Кратность обмена", "3", "1/ч")],
    outputLabel: "HVAC-расчёт",
    compute: v => {
      const V = num(v.vol), ach = num(v.ach)
      const Q = V * ach
      return [
        { label: "Объём помещения", value: `${fx(V)} м³` },
        { label: "Требуемый расход воздуха", value: `${fx(Q)} м³/ч` },
        { label: "Расход в л/с", value: `${fx(Q / 3.6, 1)} л/с` },
        { label: "Мощность вентилятора (оценка)", value: `${fx((Q * 250) / 3600, 0)} Вт` },
      ]
    },
  },

  "sw-electrical-schematic": {
    desc: "2D-схема электрики: число цепей и оценка листов документации.",
    fields: [f("wires", "Цепей", "64")],
    outputLabel: "Электросхема",
    compute: v => {
      const n = num(v.wires)
      return [
        { label: "Цепей на схеме", value: `${n}` },
        { label: "Листов A3 (оценка)", value: `${Math.max(1, Math.ceil(n / 30))}` },
      ]
    },
  },

  "sw-electrical-3d": {
    desc: "3D-компоновка электрошкафа: число аппаратов и оценка габарита щита.",
    fields: [f("comp", "Аппаратов", "38")],
    outputLabel: "Электрошкаф 3D",
    compute: v => {
      const n = num(v.comp)
      const rows = Math.ceil(n / 6)
      return [
        { label: "Аппаратов", value: `${n}` },
        { label: "DIN-реек", value: `${rows}` },
        { label: "Высота щита (оценка)", value: `${fx(rows * 150 + 200, 0)} мм` },
      ]
    },
  },

  "sw-routing": {
    desc: "Трассировка трубопроводов/кабелей: длина, масса, время прокладки.",
    fields: [sel("type", "Тип", "Трубопровод", ["Трубопровод", "Трубки", "Электрожгут"]), f("len", "Длина", "18", "м")],
    outputLabel: "Трассировка",
    compute: v => {
      const L = num(v.len)
      const kg: Record<string, number> = { "Трубопровод": 3.2, "Трубки": 0.4, "Электрожгут": 0.6 }
      return [
        { label: "Тип трассы", value: String(v.type) },
        { label: "Длина", value: `${fx(L)} м` },
        { label: "Масса трассы", value: `${fx(L * (kg[String(v.type)] ?? 1), 2)} кг` },
      ]
    },
  },

  "sw-circuitworks": {
    desc: "Обмен с ECAD: перенос компонентов платы в MCAD-сборку.",
    fields: [f("comps", "Компонентов платы", "240")],
    outputLabel: "Обмен с ECAD",
    compute: v => [
      { label: "Компонентов на плате", value: `${num(v.comps)}` },
      { label: "Перенесено в 3D-сборку", value: `${num(v.comps)}` },
    ],
  },

  // ─── ГИС / ОБМЕН ГЕОДАННЫМИ ─────────────────────────────────────────────────

  "interop-shp": {
    desc: "Импорт/экспорт SHP (GIS): объектов, тип геометрии, оценка объёма.",
    fields: [sel("type", "Геометрия", "Полигоны", ["Точки", "Линии", "Полигоны"]), f("feat", "Объектов", "540")],
    outputLabel: "Обмен SHP",
    compute: v => {
      const n = num(v.feat)
      const kb: Record<string, number> = { "Точки": 0.03, "Линии": 0.4, "Полигоны": 0.9 }
      return [
        { label: "Геометрия", value: String(v.type) },
        { label: "Объектов", value: fmtBig(n, 0) },
        { label: "Оценка размера SHP", value: `${fx(n * (kb[String(v.type)] ?? 0.4), 1)} КБ` },
      ]
    },
  },

  "interop-kml": {
    desc: "Экспорт KML/KMZ для Google Earth: объектов и оценка объёма архива.",
    fields: [f("feat", "Объектов", "120")],
    outputLabel: "Экспорт KML",
    compute: v => {
      const n = num(v.feat)
      return [
        { label: "Объектов", value: `${n}` },
        { label: "Размер KML", value: `${fx(n * 0.6, 1)} КБ` },
        { label: "Размер KMZ (сжатый)", value: `${fx(n * 0.6 * 0.3, 1)} КБ` },
      ]
    },
  },

  "interop-geojson": {
    desc: "Обмен GeoJSON: количество features и оценка размера файла.",
    fields: [f("feat", "Features", "300")],
    outputLabel: "Обмен GeoJSON",
    compute: v => {
      const n = num(v.feat)
      return [
        { label: "Features", value: `${n}` },
        { label: "Оценка размера", value: `${fx((n * 0.35) / 1024, 2)} МБ` },
      ]
    },
  },

  "survey-cogo-figure": {
    desc: "Фигура съёмки: замкнутый контур по коду с числом точек и периметром.",
    fields: [f("pts", "Точек в фигуре", "14"), txt("code", "Код", "EOP")],
    outputLabel: "Фигура съёмки",
    compute: v => {
      const n = Math.max(3, Math.round(num(v.pts)))
      return [
        { label: "Код фигуры", value: String(v.code) },
        { label: "Точек в контуре", value: `${n}` },
        { label: "Сегментов", value: `${n}` },
      ]
    },
    buildLabel: "Построить фигуру",
    build: (v, a) => {
      const n = Math.max(3, Math.round(num(v.pts)))
      const r = 30
      const pts = Array.from({ length: n }, (_, i) => {
        const t = (i / n) * 2 * Math.PI
        return { x: a[0] + Math.cos(t) * r, y: a[1] + Math.sin(t) * r }
      })
      return buildPoints(pts.map((p, i) => ({ ...p, name: `${v.code}-${i + 1}`, code: String(v.code) })))
    },
  },

  "survey-total-station": {
    desc: "Импорт тахеометрии: станций, наблюдений, средняя нагрузка на станцию.",
    fields: [f("st", "Станций", "6"), f("obs", "Наблюдений", "480")],
    outputLabel: "Импорт тахеометрии",
    compute: v => {
      const st = Math.max(1, Math.round(num(v.st))), obs = num(v.obs)
      return [
        { label: "Станций", value: `${st}` },
        { label: "Наблюдений", value: fmtBig(obs, 0) },
        { label: "Наблюдений на станцию", value: fx(obs / st, 1) },
        { label: "Время полевых работ (оценка)", value: `${fx(obs * 1.2 / 60, 1)} ч` },
      ]
    },
  },

  "survey-gnss": {
    desc: "Обработка GNSS/RTK: точность по PDOP, оценка качества измерений.",
    fields: [f("pts", "Точек GNSS", "320"), f("pdop", "Средний PDOP", "1.8")],
    outputLabel: "Обработка GNSS",
    compute: v => {
      const pdop = num(v.pdop)
      const acc = pdop * 8
      return [
        { label: "Точек", value: `${num(v.pts)}` },
        { label: "Средний PDOP", value: fx(pdop, 2) },
        { label: "Оценка точности планового положения", value: `±${fx(acc, 1)} мм` },
        { label: "Качество геометрии спутников", value: pdop < 2 ? "✓ отличное" : pdop < 4 ? "⚠ приемлемое" : "✗ слабое" },
      ]
    },
  },

  "survey-geodetic-transform": {
    desc: "Геодезическое преобразование систем координат: параметры и объём точек.",
    fields: [sel("from", "Из системы", "WGS84", ["WGS84", "СК-42", "СК-95", "ГСК-2011", "МСК"]), sel("to", "В систему", "МСК", ["WGS84", "СК-42", "СК-95", "ГСК-2011", "МСК"]), f("pts", "Точек", "540")],
    outputLabel: "Преобразование координат",
    compute: v => [
      { label: "Направление", value: `${v.from} → ${v.to}` },
      { label: "Точек пересчитано", value: `${num(v.pts)}` },
      { label: "Метод", value: v.from === v.to ? "не требуется" : "7-параметрическое (Гельмерта)" },
    ],
  },
}