// ═══════════════════════════════════════════════════════════════════════════
// Рабочие расчёты для направления «BIM и архитектура»: 3D-моделирование,
// рендеринг, обмен IFC/RVT, производительность визуализации.
// ═══════════════════════════════════════════════════════════════════════════

import type { Upgrade } from "./versions-upgrades"
import { num, fx, fmtBig } from "@/utils/engCalc"
import { buildSolidFootprint } from "@/utils/featureActions"

const f = (key: string, label: string, def: string, suffix?: string) =>
  ({ key, label, type: "number" as const, default: def, suffix })
const sel = (key: string, label: string, def: string, options: string[]) =>
  ({ key, label, type: "select" as const, default: def, options })

export const bimUpgrades: Record<string, Upgrade> = {

  "acad-2023-3dgraphics": {
    desc: "Оценка производительности отображения 3D-модели по числу объектов.",
    fields: [f("objects", "Объектов в модели", "250000")],
    outputLabel: "Производительность 3D",
    compute: v => {
      const n = num(v.objects)
      const fps = Math.max(24, Math.round(60 - n / 20000))
      return [
        { label: "Объектов в сцене", value: fmtBig(n, 0) },
        { label: "Оценка FPS", value: `${fps} к/с` },
        { label: "Комфортность работы", value: fps >= 45 ? "✓ плавно" : fps >= 30 ? "⚠ приемлемо" : "✗ рекомендуется LOD" },
        { label: "Память видеокарты (оценка)", value: `${fx((n * 180) / 1048576, 1)} МБ` },
      ]
    },
  },

  "civil-2025-model-viewer": {
    desc: "3D-просмотрщик: нагрузка на видеопамять по числу слоёв модели.",
    fields: [f("layers", "Слоёв модели", "12"), f("objPerLayer", "Объектов на слой", "4500")],
    outputLabel: "3D-просмотрщик",
    compute: v => {
      const layers = num(v.layers), per = num(v.objPerLayer)
      const total = layers * per
      return [
        { label: "Слоёв модели", value: `${layers}` },
        { label: "Всего объектов", value: fmtBig(total, 0) },
        { label: "Оценка FPS", value: `${Math.max(20, Math.round(60 - total / 15000))} к/с` },
        { label: "Рекомендация", value: total > 200000 ? "включите LOD для дальних слоёв" : "оптимизация не требуется" },
      ]
    },
  },

  "acad-3d-sweep": {
    desc: "Сдвиг по траектории: объём и масса тела произвольного профиля.",
    fields: [f("area", "Площадь профиля", "314", "мм²"), f("len", "Длина пути", "1500", "мм")],
    outputLabel: "Тело по траектории",
    compute: v => {
      const A = num(v.area), L = num(v.len)
      const V = A * L
      return [
        { label: "Объём тела", value: `${fx(V / 1000, 1)} см³` },
        { label: "Площадь боковой поверхности", value: `≈${fmtBig(2 * Math.sqrt(Math.PI * A) * L, 0)} мм²` },
        { label: "Масса (сталь)", value: `${fx((V / 1e9) * 7850, 3)} кг` },
      ]
    },
    build: (v, a) => buildSolidFootprint(a, Math.sqrt(num(v.area)) * 1.13, Math.sqrt(num(v.area)) * 1.13, num(v.len), "Тело по траектории"),
    buildLabel: "Построить габарит",
  },

  "acad-3d-loft": {
    desc: "Тело по сечениям: оценка объёма при линейной интерполяции площадей.",
    fields: [f("sections", "Сечений", "4"), f("area1", "Площадь первого сечения", "800", "мм²"), f("area2", "Площадь последнего", "300", "мм²"), f("len", "Общая высота", "400", "мм")],
    outputLabel: "Тело по сечениям",
    compute: v => {
      const n = Math.max(2, Math.round(num(v.sections))), a1 = num(v.area1), a2 = num(v.area2), L = num(v.len)
      const avg = (a1 + a2) / 2
      const V = avg * L
      return [
        { label: "Сечений", value: `${n}` },
        { label: "Средняя площадь", value: `${fx(avg, 1)} мм²` },
        { label: "Объём (приближённо)", value: `${fx(V / 1000, 1)} см³` },
        { label: "Конусность", value: `${fx(a1 > 0 ? ((a1 - a2) / a1) * 100 : 0, 1)} %` },
      ]
    },
  },

  "acad-3d-union": {
    desc: "Булево объединение тел: итоговый объём с учётом пересечения.",
    fields: [f("v1", "Объём тела 1", "1200", "см³"), f("v2", "Объём тела 2", "800", "см³"), f("overlap", "Пересечение", "150", "см³")],
    outputLabel: "Объединение тел",
    compute: v => {
      const v1 = num(v.v1), v2 = num(v.v2), ov = num(v.overlap)
      return [
        { label: "Объём тела 1", value: `${fx(v1, 1)} см³` },
        { label: "Объём тела 2", value: `${fx(v2, 1)} см³` },
        { label: "Пересечение", value: `${fx(ov, 1)} см³` },
        { label: "Итоговый объём (Union)", value: `${fx(v1 + v2 - ov, 1)} см³` },
        { label: "Экономия материала", value: `${fx(ov, 1)} см³` },
      ]
    },
  },

  "acad-3d-subtract": {
    desc: "Булево вычитание: остаточный объём после удаления материала.",
    fields: [f("v1", "Объём заготовки", "1500", "см³"), f("v2", "Объём вычитаемого", "400", "см³")],
    outputLabel: "Вычитание тел",
    compute: v => {
      const v1 = num(v.v1), v2 = num(v.v2)
      return [
        { label: "Объём заготовки", value: `${fx(v1, 1)} см³` },
        { label: "Объём удаляемого", value: `${fx(v2, 1)} см³` },
        { label: "Остаточный объём", value: `${fx(Math.max(v1 - v2, 0), 1)} см³` },
        { label: "Процент удаления", value: `${fx(v1 > 0 ? (v2 / v1) * 100 : 0, 1)} %` },
      ]
    },
  },

  "acad-3d-intersect": {
    desc: "Булево пересечение: общий объём двух тел.",
    fields: [f("v1", "Объём тела 1", "1200", "см³"), f("v2", "Объём тела 2", "900", "см³"), f("union", "Объём объединения", "1750", "см³")],
    outputLabel: "Пересечение тел",
    compute: v => {
      const v1 = num(v.v1), v2 = num(v.v2), u = num(v.union)
      const inter = Math.max(v1 + v2 - u, 0)
      return [
        { label: "Общий объём (Intersect)", value: `${fx(inter, 1)} см³` },
        { label: "Доля от тела 1", value: `${fx(v1 > 0 ? (inter / v1) * 100 : 0, 1)} %` },
        { label: "Доля от тела 2", value: `${fx(v2 > 0 ? (inter / v2) * 100 : 0, 1)} %` },
      ]
    },
  },

  "acad-3d-mesh": {
    desc: "Полигональная сетка: число граней, вершин, объём данных.",
    fields: [f("u", "Разбиений U", "12"), f("w", "Разбиений V", "12")],
    outputLabel: "Полигональная сеть",
    compute: v => {
      const u = Math.max(1, Math.round(num(v.u))), w = Math.max(1, Math.round(num(v.w)))
      const faces = u * w, verts = (u + 1) * (w + 1)
      return [
        { label: "Граней сетки", value: fmtBig(faces, 0) },
        { label: "Вершин", value: fmtBig(verts, 0) },
        { label: "Треугольников (после триангуляции)", value: fmtBig(faces * 2, 0) },
        { label: "Объём данных", value: `${fx((verts * 12 + faces * 2 * 12) / 1024, 1)} КБ` },
      ]
    },
  },

  "acad-3d-render": {
    desc: "Визуализация: время рендера и размер кадра по разрешению и качеству.",
    fields: [f("w", "Ширина", "1920", "px"), f("h", "Высота", "1080", "px"), sel("q", "Качество", "Высокое", ["Черновик", "Среднее", "Высокое", "Presentation"])],
    outputLabel: "Визуализация",
    compute: v => {
      const w = num(v.w), h = num(v.h)
      const k: Record<string, number> = { "Черновик": 0.5, "Среднее": 2, "Высокое": 6, "Presentation": 18 }
      const px = w * h
      const t = (px / 2073600) * (k[String(v.q)] ?? 6)
      return [
        { label: "Разрешение", value: `${fx(w, 0)}×${fx(h, 0)} (${fmtBig(px, 0)} px)` },
        { label: "Качество", value: String(v.q) },
        { label: "Время рендера", value: `${fx(t, 1)} мин` },
        { label: "Размер кадра (PNG)", value: `${fx((px * 3) / 1048576, 1)} МБ` },
      ]
    },
  },

  "kompas-v24-render": {
    desc: "Фотореалистичная визуализация: оценка времени по разрешению и качеству.",
    fields: [sel("res", "Разрешение", "Full HD", ["HD", "Full HD", "2K", "4K"]), sel("quality", "Качество", "Высокое", ["Черновик", "Среднее", "Высокое", "Финальное"])],
    outputLabel: "Фотореализм",
    compute: v => {
      const px: Record<string, number> = { "HD": 1280 * 720, "Full HD": 1920 * 1080, "2K": 2560 * 1440, "4K": 3840 * 2160 }
      const k: Record<string, number> = { "Черновик": 0.4, "Среднее": 1.5, "Высокое": 5, "Финальное": 15 }
      const p = px[String(v.res)] ?? 2073600
      const t = (p / 2073600) * (k[String(v.quality)] ?? 5)
      return [
        { label: "Разрешение", value: String(v.res) },
        { label: "Пикселей", value: fmtBig(p, 0) },
        { label: "Время рендера", value: `${fx(t, 1)} мин` },
        { label: "Размер файла", value: `${fx((p * 3) / 1048576, 1)} МБ` },
      ]
    },
  },

  "sw-render": {
    desc: "Фотореалистичный рендеринг PhotoView: время обработки сцены.",
    fields: [sel("res", "Разрешение", "Full HD", ["HD", "Full HD", "2K", "4K"])],
    outputLabel: "PhotoView рендер",
    compute: v => {
      const px: Record<string, number> = { "HD": 1280 * 720, "Full HD": 1920 * 1080, "2K": 2560 * 1440, "4K": 3840 * 2160 }
      const p = px[String(v.res)] ?? 2073600
      return [
        { label: "Разрешение", value: String(v.res) },
        { label: "Время рендера (оценка)", value: `${fx((p / 2073600) * 4, 1)} мин` },
        { label: "Размер файла", value: `${fx((p * 3) / 1048576, 1)} МБ` },
      ]
    },
  },

  "sw-visualize": {
    desc: "Visualize: рендер с трассировкой лучей, время по сэмплам.",
    fields: [sel("res", "Разрешение", "4K", ["Full HD", "2K", "4K", "8K"]), f("samples", "Сэмплов", "512")],
    outputLabel: "Visualize рендер",
    compute: v => {
      const px: Record<string, number> = { "Full HD": 1920 * 1080, "2K": 2560 * 1440, "4K": 3840 * 2160, "8K": 7680 * 4320 }
      const p = px[String(v.res)] ?? 8294400, s = num(v.samples)
      const t = (p * s) / 3.5e9
      return [
        { label: "Разрешение", value: String(v.res) },
        { label: "Сэмплов", value: `${s}` },
        { label: "Время рендера GPU", value: `${fx(t, 1)} мин` },
        { label: "Размер кадра (EXR)", value: `${fx((p * 12) / 1048576, 1)} МБ` },
      ]
    },
  },

  "interop-ifc-export": {
    desc: "Экспорт IFC: объём модели, схема, оценка размера файла.",
    fields: [sel("schema", "Схема", "IFC4", ["IFC2x3", "IFC4", "IFC4.3"]), f("elems", "Элементов", "860")],
    outputLabel: "Экспорт IFC",
    compute: v => {
      const n = num(v.elems)
      return [
        { label: "Схема", value: String(v.schema) },
        { label: "Элементов модели", value: fmtBig(n, 0) },
        { label: "Оценка размера файла", value: `${fx((n * 4.2) / 1024, 2)} МБ` },
        { label: "Совместимость", value: v.schema === "IFC4.3" ? "инфраструктура (дороги, мосты)" : "здания" },
      ]
    },
  },

  "interop-rvt": {
    desc: "Связь с Revit: режим импорта и объём синхронизируемых данных.",
    fields: [sel("mode", "Режим", "Связь", ["Связь", "Импорт копией"]), f("elems", "Элементов модели", "1200")],
    outputLabel: "Связь с Revit",
    compute: v => {
      const n = num(v.elems)
      return [
        { label: "Режим", value: String(v.mode) },
        { label: "Элементов", value: fmtBig(n, 0) },
        { label: "Обновление при изменении", value: v.mode === "Связь" ? "автоматическое" : "требуется повторный импорт" },
        { label: "Оценка размера", value: `${fx((n * 3.5) / 1024, 2)} МБ` },
      ]
    },
  },

  "kompas-v24-ifc-classes": {
    desc: "IFC-классы инженерных разделов: автоклассификация элементов ОВ/ВК/ТХ/ЭОМ.",
    fields: [sel("section", "Раздел", "ОВ", ["ОВ", "ВК", "ТХ", "ЭОМ"]), f("elems", "Элементов", "320")],
    outputLabel: "IFC-классы",
    compute: v => {
      const classes: Record<string, string> = {
        "ОВ": "IfcDuctSegment, IfcAirTerminal", "ВК": "IfcPipeSegment, IfcValve",
        "ТХ": "IfcFlowSegment, IfcTank", "ЭОМ": "IfcCableCarrierSegment, IfcOutlet",
      }
      return [
        { label: "Раздел", value: String(v.section) },
        { label: "Классы IFC", value: classes[String(v.section)] ?? "—" },
        { label: "Элементов классифицировано", value: `${num(v.elems)}` },
      ]
    },
  },
}
