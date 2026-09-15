// ═══════════════════════════════════════════════════════════════════════════
// Рабочие расчёты для документации: ИИ-инструменты, редактирование, слои,
// блоки, внешние ссылки (Xref), компоновка и печать листов.
// ═══════════════════════════════════════════════════════════════════════════

import type { Upgrade } from "./versions-upgrades"
import { num, fx, fmtBig, SHEETS } from "@/utils/engCalc"

const f = (key: string, label: string, def: string, suffix?: string) =>
  ({ key, label, type: "number" as const, default: def, suffix })
const sel = (key: string, label: string, def: string, options: string[]) =>
  ({ key, label, type: "select" as const, default: def, options })
const txt = (key: string, label: string, def: string) =>
  ({ key, label, type: "text" as const, default: def })

export const docs2Upgrades: Record<string, Upgrade> = {

  // ─── ИИ-ИНСТРУМЕНТЫ ────────────────────────────────────────────────────────

  "acad-2022-trace": {
    desc: "Трассировка: слой рецензирования, объём правок, статус согласования.",
    fields: [txt("author", "Автор", "Рецензент"), sel("color", "Цвет разметки", "Красный", ["Красный", "Синий", "Зелёный", "Оранжевый"]), f("marks", "Отметок", "8")],
    outputLabel: "Слой трассировки",
    compute: v => [
      { label: "Автор", value: String(v.author) },
      { label: "Цвет разметки", value: String(v.color) },
      { label: "Отметок внесено", value: `${num(v.marks)}` },
      { label: "Оригинал", value: "не изменён (отдельный слой)" },
    ],
  },

  "acad-2024-smartblocks": {
    desc: "Умная расстановка блоков: автопривязка к похожим позициям.",
    fields: [txt("block", "Блок", "РОЗЕТКА"), f("found", "Похожих позиций найдено", "24")],
    outputLabel: "Smart Blocks Placement",
    compute: v => {
      const n = num(v.found)
      return [
        { label: "Блок", value: String(v.block) },
        { label: "Похожих позиций", value: `${n}` },
        { label: "Автоматически расставлено", value: `${Math.round(n * 0.85)}` },
        { label: "Экономия времени", value: `≈${fx(n * 1.2, 0)} мин` },
      ]
    },
  },

  "acad-2024-replace": {
    desc: "Массовая замена блоков: пересчёт вхождений и обновление атрибутов.",
    fields: [txt("from", "Из блока", "СТАРЫЙ"), txt("to", "В блок", "НОВЫЙ"), f("n", "Вхождений", "16")],
    outputLabel: "Smart Blocks Replace",
    compute: v => {
      const n = num(v.n)
      return [
        { label: "Заменено вхождений", value: `${n}` },
        { label: "Из блока → в блок", value: `${v.from} → ${v.to}` },
        { label: "Время выполнения", value: `${fx(n * 0.3, 1)} с` },
      ]
    },
  },

  "acad-2025-assist": {
    desc: "ИИ-ассистент: обработка запроса пользователя по интерфейсу и командам.",
    fields: [txt("q", "Вопрос", "Как построить массив?")],
    outputLabel: "Autodesk Assistant",
    compute: v => [{ label: "Запрос", value: String(v.q) }, { label: "Статус", value: "обработан, дан ответ с примером команды" }],
  },

  "acad-2025-smartblocks-search": {
    desc: "Поиск похожей геометрии и конвертация в динамические блоки.",
    fields: [f("matches", "Найдено совпадений", "7")],
    outputLabel: "Smart Blocks Search",
    compute: v => {
      const n = num(v.matches)
      return [
        { label: "Совпадений найдено", value: `${n}` },
        { label: "Сконвертировано в блоки", value: `${n}` },
        { label: "Экономия объёма файла", value: `≈${fx(n * 8, 0)} КБ` },
      ]
    },
  },

  "acad-2026-smarter": {
    desc: "Распознавание объектов (Object Detection): группировка похожей геометрии.",
    fields: [f("found", "Кластеров найдено", "5"), f("objPerCluster", "Объектов в кластере", "12")],
    outputLabel: "Object Detection",
    compute: v => {
      const c = num(v.found), o = num(v.objPerCluster)
      return [
        { label: "Кластеров найдено", value: `${c}` },
        { label: "Всего объектов сгруппировано", value: `${c * o}` },
        { label: "Готово к преобразованию в блоки", value: `${c}` },
      ]
    },
  },

  "acad-2026-markup": {
    desc: "Импорт разметки v2: автоприменение распознанных правок.",
    fields: [sel("auto", "Авто-применить", "on", ["on", "off"]), f("marks", "Правок распознано", "14")],
    outputLabel: "Markup Import v2",
    compute: v => {
      const n = num(v.marks)
      return [
        { label: "Правок распознано", value: `${n}` },
        { label: "Режим", value: v.auto === "on" ? "автоприменение" : "требуется подтверждение" },
        { label: "Применено", value: v.auto === "on" ? `${n}` : "0 (ожидает проверки)" },
      ]
    },
  },

  "acad-2027-ai-layout": {
    desc: "ИИ-раскладка листов: автоматическое размещение видов по формату.",
    fields: [f("sheets", "Листов сгенерировать", "8"), sel("fmt", "Формат", "A1", ["A0", "A1", "A2", "A3"])],
    outputLabel: "AI Auto-Layout",
    compute: v => {
      const n = num(v.sheets)
      return [
        { label: "Листов сгенерировано", value: `${n}` },
        { label: "Формат", value: String(v.fmt) },
        { label: "Время генерации", value: `${fx(n * 3, 0)} с` },
        { label: "Экономия времени вручную", value: `≈${fx(n * 12, 0)} мин` },
      ]
    },
  },

  "acad-2027-genai": {
    desc: "Генеративная детализация узла по текстовому запросу.",
    fields: [txt("prompt", "Запрос", "Узел примыкания кровли")],
    outputLabel: "Generative Detailing",
    compute: v => [{ label: "Запрос", value: String(v.prompt) }, { label: "Статус", value: "сгенерирован эскиз узла с аннотациями" }],
  },

  "acad-draw-spline": {
    desc: "Сплайн: длина кривой по опорным точкам, гладкость.",
    fields: [f("pts", "Точек", "8"), f("span", "Габарит по X", "200", "мм")],
    outputLabel: "Сплайн",
    compute: v => {
      const n = num(v.pts), span = num(v.span)
      return [
        { label: "Опорных точек", value: `${n}` },
        { label: "Оценка длины кривой", value: `${fx(span * 1.15, 1)} мм` },
        { label: "Степень непрерывности", value: "C2 (гладкая)" },
      ]
    },
  },

  // ─── АННОТАЦИИ ─────────────────────────────────────────────────────────────

  "acad-anno-table": {
    desc: "Таблица: размеры, число ячеек, оценка площади на листе.",
    fields: [f("rows", "Строк", "10"), f("cols", "Столбцов", "5"), f("rh", "Высота строки", "8", "мм"), f("cw", "Ширина столбца", "30", "мм")],
    outputLabel: "Таблица",
    compute: v => {
      const r = num(v.rows), c = num(v.cols)
      return [
        { label: "Ячеек всего", value: `${r * c}` },
        { label: "Габарит таблицы", value: `${fx(c * num(v.cw), 0)} × ${fx(r * num(v.rh), 0)} мм` },
        { label: "Площадь на листе", value: `${fmtBig(c * num(v.cw) * r * num(v.rh), 0)} мм²` },
      ]
    },
  },

  "acad-anno-field": {
    desc: "Динамическое поле: тип данных и автообновление при изменении чертежа.",
    fields: [sel("type", "Тип поля", "Площадь", ["Площадь", "Периметр", "Дата", "Имя файла", "Автор"])],
    outputLabel: "Поле",
    compute: v => [
      { label: "Тип поля", value: String(v.type) },
      { label: "Обновление", value: "автоматическое при изменении объекта" },
    ],
  },

  "acad-anno-dimstyle": {
    desc: "Стиль размеров по стандарту: параметры оформления.",
    fields: [sel("std", "Стандарт", "ГОСТ 2.307", ["ГОСТ 2.307", "ISO-25", "ANSI", "DIN"])],
    outputLabel: "Стиль размеров",
    compute: v => {
      const p: Record<string, string> = {
        "ГОСТ 2.307": "стрелки 45°, текст над линией", "ISO-25": "стрелки открытые, текст по центру",
        "ANSI": "стрелки закрытые, дробные дюймы", "DIN": "стрелки 15°, десятичные мм",
      }
      return [{ label: "Стандарт", value: String(v.std) }, { label: "Оформление", value: p[String(v.std)] ?? "—" }]
    },
  },

  // ─── РЕДАКТИРОВАНИЕ ────────────────────────────────────────────────────────

  "acad-modify-mirror": {
    desc: "Зеркальное отражение: ось симметрии и сохранение оригинала.",
    fields: [sel("axis", "Ось", "Вертикальная", ["Вертикальная", "Горизонтальная", "Наклонная"]), f("keep", "Сохранить оригинал", "1")],
    outputLabel: "Зеркало",
    compute: v => [
      { label: "Ось отражения", value: String(v.axis) },
      { label: "Оригинал", value: num(v.keep) ? "сохранён" : "удалён" },
    ],
  },

  "acad-modify-trim": {
    desc: "Обрезка объектов по границе: количество и экономия узлов.",
    fields: [f("n", "Объектов обрезать", "5")],
    outputLabel: "Обрезка",
    compute: v => [{ label: "Объектов обрезано", value: `${num(v.n)}` }, { label: "Режущая кромка", value: "по выбранной границе" }],
  },

  "acad-modify-extend": {
    desc: "Удлинение объекта до границы: новая длина.",
    fields: [f("len", "Текущая длина", "80", "мм"), f("d", "Удлинение", "18", "мм")],
    outputLabel: "Удлинение",
    compute: v => {
      const L = num(v.len), d = num(v.d)
      return [
        { label: "Исходная длина", value: `${fx(L, 2)} мм` },
        { label: "Удлинение", value: `${fx(d, 2)} мм` },
        { label: "Новая длина", value: `${fx(L + d, 2)} мм` },
      ]
    },
  },

  "acad-modify-stretch": {
    desc: "Растяжение выбранных узлов на заданную величину.",
    fields: [f("d", "Величина", "25", "мм"), f("nodes", "Узлов захвачено", "3")],
    outputLabel: "Растяжение",
    compute: v => [
      { label: "Величина растяжения", value: `${fx(num(v.d), 2)} мм` },
      { label: "Узлов затронуто", value: `${num(v.nodes)}` },
    ],
  },

  "acad-modify-explode": {
    desc: "Расчленение полилинии на отдельные примитивы.",
    fields: [f("n", "Вершин полилинии", "8")],
    outputLabel: "Расчленение",
    compute: v => {
      const n = num(v.n)
      return [
        { label: "Вершин полилинии", value: `${n}` },
        { label: "Получено отрезков/дуг", value: `${Math.max(n - 1, 0)}` },
      ]
    },
  },

  // ─── СЛОИ ──────────────────────────────────────────────────────────────────

  "acad-layer-iso": {
    desc: "Изоляция слоёв: сколько слоёв скрыто временно.",
    fields: [f("n", "Слоёв изолировать", "3"), f("total", "Всего слоёв в чертеже", "24")],
    outputLabel: "Изоляция слоёв",
    compute: v => {
      const n = num(v.n), t = num(v.total)
      return [
        { label: "Слоёв изолировано", value: `${n}` },
        { label: "Слоёв скрыто временно", value: `${Math.max(t - n, 0)}` },
        { label: "Восстановление", value: "командой LAYUNISO" },
      ]
    },
  },

  "acad-layer-merge": {
    desc: "Объединение слоёв: перенос объектов в целевой слой.",
    fields: [f("from", "Из слоёв", "4"), txt("to", "В слой", "Основной"), f("objs", "Объектов на слой", "35")],
    outputLabel: "Объединение слоёв",
    compute: v => {
      const n = num(v.from), o = num(v.objs)
      return [
        { label: "Слоёв объединено", value: `${n}` },
        { label: "Целевой слой", value: String(v.to) },
        { label: "Объектов перенесено", value: `${n * o}` },
        { label: "Исходные слои", value: "удалены" },
      ]
    },
  },

  "acad-layer-state": {
    desc: "Сохранённое состояние слоёв: снимок видимости для быстрого переключения.",
    fields: [txt("name", "Имя состояния", "Печать_План"), f("layers", "Слоёв в снимке", "18")],
    outputLabel: "Состояние слоёв",
    compute: v => [
      { label: "Имя состояния", value: String(v.name) },
      { label: "Слоёв сохранено", value: `${num(v.layers)}` },
      { label: "Восстановление", value: "мгновенное через диспетчер" },
    ],
  },

  "acad-layer-freeze-vp": {
    desc: "Заморозка слоёв в видовом экране: индивидуально для листа.",
    fields: [f("n", "Заморозить слоёв", "2"), f("vports", "Видовых экранов", "3")],
    outputLabel: "Заморозка в ВЭ",
    compute: v => [
      { label: "Слоёв заморожено", value: `${num(v.n)}` },
      { label: "Видовых экранов", value: `${num(v.vports)}` },
      { label: "Влияние", value: "только на текущий ВЭ, модель не затронута" },
    ],
  },

  // ─── БЛОКИ ─────────────────────────────────────────────────────────────────

  "acad-block-define": {
    desc: "Создание блока: базовая точка, состав, экономия объёма файла.",
    fields: [txt("name", "Имя блока", "ДВЕРЬ_900"), f("objs", "Объектов", "6"), f("uses", "Планируемых вставок", "24")],
    outputLabel: "Блок создан",
    compute: v => {
      const objs = num(v.objs), uses = num(v.uses)
      return [
        { label: "Имя блока", value: String(v.name) },
        { label: "Объектов в блоке", value: `${objs}` },
        { label: "Планируемых вставок", value: `${uses}` },
        { label: "Экономия против копирования", value: `≈${fx(objs * uses * 0.15, 0)} КБ` },
      ]
    },
  },

  "acad-block-attdef": {
    desc: "Атрибут блока: тег, значение по умолчанию, видимость.",
    fields: [txt("tag", "Тег", "МАРКА"), txt("val", "Значение по умолч.", "М1")],
    outputLabel: "Атрибут блока",
    compute: v => [{ label: "Тег", value: String(v.tag) }, { label: "Значение по умолчанию", value: String(v.val) }],
  },

  "acad-block-dynamic": {
    desc: "Динамический блок: состояния видимости, экономия числа блоков.",
    fields: [f("states", "Состояний видимости", "3"), f("staticBlocks", "Статичных блоков заменено", "6")],
    outputLabel: "Динамический блок",
    compute: v => {
      const s = num(v.states), b = num(v.staticBlocks)
      return [
        { label: "Состояний видимости", value: `${s}` },
        { label: "Заменено статичных блоков", value: `${b}` },
        { label: "Сокращение библиотеки", value: `в ${fx(b, 0)} раз` },
      ]
    },
  },

  "acad-block-battman": {
    desc: "Диспетчер атрибутов: массовое обновление значений блоков.",
    fields: [f("n", "Блоков обновить", "48")],
    outputLabel: "Battman",
    compute: v => {
      const n = num(v.n)
      return [{ label: "Блоков обновлено", value: `${n}` }, { label: "Время выполнения", value: `${fx(n * 0.2, 1)} с` }]
    },
  },

  "acad-block-wblock": {
    desc: "Запись блока в отдельный файл: размер и готовность к повторному использованию.",
    fields: [txt("name", "Имя файла", "Дверь_900.dwg"), f("objs", "Объектов в блоке", "6")],
    outputLabel: "Wblock",
    compute: v => [
      { label: "Файл", value: String(v.name) },
      { label: "Объектов", value: `${num(v.objs)}` },
      { label: "Оценка размера", value: `${fx(num(v.objs) * 4.5, 1)} КБ` },
    ],
  },

  // ─── ВНЕШНИЕ ССЫЛКИ (XREF) ─────────────────────────────────────────────────

  "acad-xref-attach": {
    desc: "Присоединение внешней ссылки: тип связи и путь обновления.",
    fields: [txt("file", "Файл", "Генплан.dwg"), sel("type", "Тип", "Наложение", ["Наложение", "Вставка"])],
    outputLabel: "Присоединение Xref",
    compute: v => [
      { label: "Файл", value: String(v.file) },
      { label: "Тип связи", value: String(v.type) },
      { label: "Обновление", value: v.type === "Наложение" ? "при каждом открытии" : "фиксируется при вставке" },
    ],
  },

  "acad-xref-clip": {
    desc: "Подрезка внешней ссылки: показ только нужной области.",
    fields: [sel("shape", "Контур", "Прямоугольник", ["Прямоугольник", "Полилиния"]), f("area", "Площадь показа", "1200", "м²")],
    outputLabel: "Подрезка Xref",
    compute: v => [
      { label: "Контур подрезки", value: String(v.shape) },
      { label: "Площадь показа", value: `${fx(num(v.area), 0)} м²` },
      { label: "Данные вне контура", value: "скрыты, не удалены" },
    ],
  },

  "acad-xref-manager": {
    desc: "Диспетчер внешних ссылок: статус присоединённых файлов.",
    fields: [f("attached", "Присоединено", "5"), f("missing", "Не найдено", "1")],
    outputLabel: "Диспетчер Xref",
    compute: v => {
      const a = num(v.attached), m = num(v.missing)
      return [
        { label: "Присоединено ссылок", value: `${a}` },
        { label: "Не найдено (ошибка пути)", value: `${m}` },
        { label: "Статус", value: m === 0 ? "✓ все ссылки в порядке" : "✗ проверьте пути к файлам" },
      ]
    },
  },

  "acad-xref-underlay": {
    desc: "Подложка PDF/DGN/изображения: масштаб привязки.",
    fields: [sel("type", "Тип подложки", "PDF", ["PDF", "DGN", "DWF", "Изображение"]), f("scale", "Масштаб привязки", "1")],
    outputLabel: "Подложка",
    compute: v => [{ label: "Тип подложки", value: String(v.type) }, { label: "Масштаб привязки", value: `×${fx(num(v.scale), 2)}` }],
  },

  "acad-xref-bind": {
    desc: "Внедрение внешней ссылки в чертёж: преобразование в блок.",
    fields: [txt("file", "Ссылка", "Сети_ВК.dwg"), f("objs", "Объектов во внешней ссылке", "340")],
    outputLabel: "Внедрение Xref",
    compute: v => [
      { label: "Файл", value: String(v.file) },
      { label: "Объектов внедрено", value: `${num(v.objs)}` },
      { label: "Результат", value: "стал локальным блоком, связь разорвана" },
    ],
  },

  "acad-xref-compare": {
    desc: "Сравнение версий внешней ссылки: найденные изменения.",
    fields: [f("changes", "Изменений найдено", "14")],
    outputLabel: "Сравнение Xref",
    compute: v => {
      const n = num(v.changes)
      return [
        { label: "Изменений найдено", value: `${n}` },
        { label: "Добавлено", value: `≈${Math.round(n * 0.4)}` },
        { label: "Удалено", value: `≈${Math.round(n * 0.25)}` },
        { label: "Изменено", value: `≈${Math.round(n * 0.35)}` },
      ]
    },
  },

  // ─── ПЕЧАТЬ И КОМПОНОВКА ───────────────────────────────────────────────────

  "acad-plot-layout": {
    desc: "Компоновка листа: формат, ориентация, рабочая область.",
    fields: [sel("fmt", "Формат", "A1", ["A0", "A1", "A2", "A3", "A4"]), sel("orient", "Ориентация", "Альбомная", ["Альбомная", "Книжная"])],
    outputLabel: "Компоновка листа",
    compute: v => {
      const [w, h] = SHEETS[String(v.fmt)] ?? SHEETS.A1
      const [pw, ph] = v.orient === "Альбомная" ? [Math.max(w, h), Math.min(w, h)] : [Math.min(w, h), Math.max(w, h)]
      return [
        { label: "Формат", value: `${v.fmt} (${w}×${h} мм)` },
        { label: "Ориентация", value: String(v.orient) },
        { label: "Размер листа", value: `${pw}×${ph} мм` },
        { label: "Рабочая область (поля 10 мм)", value: `${pw - 20}×${ph - 20} мм` },
      ]
    },
  },

  "acad-plot-vport": {
    desc: "Видовой экран: масштаб между моделью и листом.",
    fields: [f("model", "Размер в модели", "50000", "мм"), f("paper", "Размер на листе", "500", "мм")],
    outputLabel: "Видовой экран",
    compute: v => {
      const m = num(v.model), p = num(v.paper)
      const sc = p > 0 ? m / p : 0
      return [
        { label: "Масштаб видового экрана", value: `1:${fx(sc, 0)}` },
        { label: "Коэффициент масштабирования", value: fx(p > 0 ? p / m : 0, 6) },
      ]
    },
  },

  "acad-plot-pagesetup": {
    desc: "Параметры листа: устройство печати и стиль оформления.",
    fields: [sel("device", "Устройство", "DWG To PDF.pc3", ["DWG To PDF.pc3", "PublishToWeb JPG.pc3", "Плоттер HP T1700", "Системный принтер"]), sel("ctb", "Стиль печати", "monochrome.ctb", ["monochrome.ctb", "acad.ctb", "Grayscale.ctb", "GOST.stb"])],
    outputLabel: "Параметры листа",
    compute: v => [{ label: "Устройство", value: String(v.device) }, { label: "Стиль печати", value: String(v.ctb) }],
  },

  "acad-plot-print": {
    desc: "Печать: область, масштаб, оценка времени на плоттере.",
    fields: [sel("area", "Область", "Лист", ["Лист", "Экран", "Рамка", "Границы"]), sel("scale", "Масштаб печати", "1:1", ["1:1", "1:2", "1:5", "1:10", "Вписать"])],
    outputLabel: "Печать",
    compute: v => [
      { label: "Область печати", value: String(v.area) },
      { label: "Масштаб печати", value: String(v.scale) },
      { label: "Оценка времени", value: "≈45 с на лист А1" },
    ],
  },

  "acad-plot-pdf": {
    desc: "Экспорт в PDF: разрешение, слои, оценка размера итогового файла.",
    fields: [f("sheets", "Листов", "12"), sel("dpi", "Разрешение", "600", ["150", "300", "600", "1200"]), sel("layers", "Слои в PDF", "on", ["on", "off"])],
    outputLabel: "Экспорт PDF",
    compute: v => {
      const n = num(v.sheets), dpi = num(v.dpi)
      const mbPerSheet = (dpi / 300) ** 2 * 1.8
      return [
        { label: "Листов", value: `${n}` },
        { label: "Разрешение", value: `${dpi} dpi` },
        { label: "Слои сохранены", value: v.layers === "on" ? "да" : "нет (растр)" },
        { label: "Размер на лист", value: `${fx(mbPerSheet, 1)} МБ` },
        { label: "Общий размер PDF", value: `${fx(n * mbPerSheet, 1)} МБ` },
      ]
    },
  },

  "acad-plot-dwf": {
    desc: "Экспорт в DWF: компактный формат для просмотра без CAD.",
    fields: [sel("type", "Формат", "DWFx", ["DWF", "DWFx", "DWF (сжатый)"]), f("sheets", "Листов", "10")],
    outputLabel: "Экспорт DWF",
    compute: v => {
      const n = num(v.sheets)
      const k: Record<string, number> = { "DWF": 0.4, "DWFx": 0.35, "DWF (сжатый)": 0.15 }
      return [
        { label: "Формат", value: String(v.type) },
        { label: "Листов", value: `${n}` },
        { label: "Размер на лист", value: `${fx(k[String(v.type)] ?? 0.35, 2)} МБ` },
        { label: "Общий размер", value: `${fx(n * (k[String(v.type)] ?? 0.35), 1)} МБ` },
      ]
    },
  },

  "acad-plot-sheetset": {
    desc: "Подшивка листов: нумерация комплекта и оглавление.",
    fields: [f("sheets", "Листов в комплекте", "34"), f("start", "Начальный №", "1")],
    outputLabel: "Подшивка листов",
    compute: v => {
      const n = num(v.sheets), s = num(v.start)
      return [
        { label: "Листов в комплекте", value: `${n}` },
        { label: "Нумерация", value: `${s} … ${s + n - 1}` },
        { label: "Оглавление сгенерировано", value: "✓ автоматически" },
      ]
    },
  },

  "acad-plot-batch": {
    desc: "Пакетная печать: оценка общего времени публикации.",
    fields: [f("sheets", "Листов", "34"), f("sec", "Время на лист", "4", "с")],
    outputLabel: "Пакетная печать",
    compute: v => {
      const n = num(v.sheets), t = num(v.sec)
      return [
        { label: "Листов в пакете", value: `${n}` },
        { label: "Время на лист", value: `${fx(t, 1)} с` },
        { label: "Общее время", value: `${fx((n * t) / 60, 1)} мин` },
      ]
    },
  },

  "acad-plot-transmittal": {
    desc: "Комплект передачи: упаковка чертежа со всеми зависимостями.",
    fields: [f("xrefs", "Внешних ссылок", "6"), f("fonts", "Шрифтов SHX", "3"), f("mainMb", "Размер основного файла", "8", "МБ")],
    outputLabel: "Комплект передачи",
    compute: v => {
      const x = num(v.xrefs), fo = num(v.fonts), m = num(v.mainMb)
      const total = m + x * 1.5 + fo * 0.1
      return [
        { label: "Внешних ссылок включено", value: `${x}` },
        { label: "Шрифтов включено", value: `${fo}` },
        { label: "Общий размер архива", value: `${fx(total, 1)} МБ` },
        { label: "Готовность к передаче", value: "✓ все зависимости упакованы" },
      ]
    },
  },

  "acad-plot-cloud": {
    desc: "Публикация в облако: доступ и объём загружаемых данных.",
    fields: [f("sheets", "Листов", "34"), sel("access", "Доступ", "По ссылке", ["По ссылке", "Команда проекта", "Только я"])],
    outputLabel: "Публикация в облако",
    compute: v => {
      const n = num(v.sheets)
      return [
        { label: "Листов опубликовано", value: `${n}` },
        { label: "Уровень доступа", value: String(v.access) },
        { label: "Оценка загрузки", value: `${fx(n * 1.8, 1)} МБ` },
      ]
    },
  },

  "interop-dwg-import": {
    desc: "Импорт DWG: версия формата, совместимость, оценка потерь.",
    fields: [sel("ver", "Версия DWG", "2018", ["2013", "2018", "2024"]), f("objs", "Объектов", "4500")],
    outputLabel: "Импорт DWG",
    compute: v => [
      { label: "Версия", value: `AutoCAD ${v.ver}` },
      { label: "Объектов", value: `${num(v.objs)}` },
      { label: "Совместимость", value: "полная (открытый формат)" },
    ],
  },

  "interop-dwg-export": {
    desc: "Экспорт DWG: целевая версия и размер файла.",
    fields: [sel("ver", "Версия DWG", "2018", ["2013", "2018", "2024"]), f("mb", "Размер исходного файла", "22", "МБ")],
    outputLabel: "Экспорт DWG",
    compute: v => [
      { label: "Целевая версия", value: `AutoCAD ${v.ver}` },
      { label: "Размер файла", value: `${fx(num(v.mb), 1)} МБ` },
    ],
  },

  "interop-dgn": {
    desc: "Обмен MicroStation DGN: уровни соответствуют слоям AutoCAD.",
    fields: [f("levels", "Уровней DGN", "18")],
    outputLabel: "Обмен DGN",
    compute: v => [{ label: "Уровней DGN", value: `${num(v.levels)}` }, { label: "Соответствие", value: "1 уровень = 1 слой AutoCAD" }],
  },

  "kompas-v24-ugo": {
    desc: "Условные графические обозначения: библиотека УГО по ГОСТ.",
    fields: [f("count", "Вставлено УГО", "45"), sel("std", "Стандарт", "ГОСТ 2.721", ["ГОСТ 2.721", "ГОСТ 2.780", "ГОСТ 21.204"])],
    outputLabel: "УГО",
    compute: v => [{ label: "Вставлено УГО", value: `${num(v.count)}` }, { label: "Стандарт", value: String(v.std) }],
  },

  "kompas-v24-techblocks": {
    desc: "Технологические блоки: типовые операции техпроцесса.",
    fields: [f("ops", "Операций", "12"), f("timePerOp", "Мин на операцию", "8")],
    outputLabel: "Технологические блоки",
    compute: v => {
      const n = num(v.ops), t = num(v.timePerOp)
      return [{ label: "Операций", value: `${n}` }, { label: "Общее время техпроцесса", value: `${fx((n * t) / 60, 2)} ч` }]
    },
  },

  "kompas-v24-spec-report": {
    desc: "Отчёт по спецификации: позиции, масса, состав изделия.",
    fields: [f("items", "Позиций в спецификации", "38"), f("mass", "Суммарная масса", "145", "кг")],
    outputLabel: "Отчёт по спецификации",
    compute: v => [
      { label: "Позиций", value: `${num(v.items)}` },
      { label: "Суммарная масса изделия", value: `${fx(num(v.mass), 2)} кг` },
      { label: "Средняя масса позиции", value: `${fx(num(v.items) > 0 ? num(v.mass) / num(v.items) : 0, 3)} кг` },
    ],
  },

  "kompas-v25-proj-depth": {
    desc: "Проекции с учётом глубины: оценка числа видов и скрытых линий.",
    fields: [f("views", "Видов на чертеже", "4"), f("hidden", "Скрытых линий на вид", "12")],
    outputLabel: "Проекции",
    compute: v => [
      { label: "Видов", value: `${num(v.views)}` },
      { label: "Скрытых линий всего", value: `${num(v.views) * num(v.hidden)}` },
    ],
  },

  "sw-drawing": {
    desc: "Чертёж по 3D-модели: количество видов и автообновление.",
    fields: [f("views", "Видов на чертеже", "6"), f("dims", "Размеров", "24")],
    outputLabel: "Чертёж по модели",
    compute: v => [
      { label: "Видов создано", value: `${num(v.views)}` },
      { label: "Размеров проставлено", value: `${num(v.dims)}` },
      { label: "Связь с 3D-моделью", value: "живая, обновляется автоматически" },
    ],
  },

  "sw-bom": {
    desc: "Спецификация (BOM): позиции, масса, стоимость изделия.",
    fields: [f("items", "Позиций", "42"), f("mass", "Масса изделия", "18.5", "кг"), f("cost", "Стоимость", "24500", "₽")],
    outputLabel: "Спецификация BOM",
    compute: v => [
      { label: "Позиций в BOM", value: `${num(v.items)}` },
      { label: "Масса изделия", value: `${fx(num(v.mass), 2)} кг` },
      { label: "Стоимость изделия", value: `${fmtBig(num(v.cost), 0)} ₽` },
    ],
  },

  "sw-mbd": {
    desc: "MBD: аннотации в 3D-модели без чертежа, число PMI-элементов.",
    fields: [f("pmi", "PMI-аннотаций", "35")],
    outputLabel: "Model-Based Definition",
    compute: v => [{ label: "PMI-аннотаций", value: `${num(v.pmi)}` }, { label: "Чертёж не требуется", value: "✓ данные полностью в 3D" }],
  },

  "sw-dxf-cnc": {
    desc: "Экспорт DXF для ЧПУ: контуры реза и совместимость с раскроем.",
    fields: [f("contours", "Контуров", "24")],
    outputLabel: "DXF для ЧПУ",
    compute: v => [{ label: "Контуров экспортировано", value: `${num(v.contours)}` }, { label: "Формат", value: "DXF R12 (совместим с раскройными станками)" }],
  },

  "sw-print3d": {
    desc: "Печать 3D: объём модели, время печати, расход филамента.",
    fields: [f("vol", "Объём модели", "45", "см³"), f("layer", "Высота слоя", "0.2", "мм"), f("speed", "Скорость печати", "60", "мм/с")],
    outputLabel: "3D-печать",
    compute: v => {
      const V = num(v.vol), l = num(v.layer)
      const mass = V * 1.24
      const time = V / (l * 8 * (num(v.speed) / 60))
      return [
        { label: "Объём модели", value: `${fx(V, 1)} см³` },
        { label: "Масса (PLA)", value: `${fx(mass, 1)} г` },
        { label: "Оценка времени печати", value: `${fx(time / 60, 1)} ч` },
      ]
    },
  },

  "sw-composer": {
    desc: "Composer: инструкции по сборке из 3D-модели, число кадров.",
    fields: [f("steps", "Шагов сборки", "18")],
    outputLabel: "Composer",
    compute: v => [{ label: "Шагов инструкции", value: `${num(v.steps)}` }, { label: "Формат", value: "интерактивный HTML + PDF" }],
  },

  "sw-inspection": {
    desc: "Inspection: план контроля качества, число контролируемых размеров.",
    fields: [f("dims", "Контролируемых размеров", "22")],
    outputLabel: "Inspection",
    compute: v => [
      { label: "Контролируемых размеров", value: `${num(v.dims)}` },
      { label: "Балонные номера", value: "проставлены автоматически" },
    ],
  },

  "sw-mbd-std": {
    desc: "MBD по стандарту: допуски и посадки согласно ГОСТ/ISO.",
    fields: [sel("std", "Стандарт", "ГОСТ", ["ГОСТ", "ISO 1101", "ASME Y14.5"]), f("tol", "Допусков задано", "16")],
    outputLabel: "MBD-стандарт",
    compute: v => [{ label: "Стандарт", value: String(v.std) }, { label: "Допусков задано", value: `${num(v.tol)}` }],
  },

  "sw-cam": {
    desc: "CAM: генерация траекторий обработки, число переходов.",
    fields: [f("ops", "Операций обработки", "8"), f("time", "Машинное время", "35", "мин")],
    outputLabel: "CAM-обработка",
    compute: v => [
      { label: "Операций обработки", value: `${num(v.ops)}` },
      { label: "Машинное время", value: `${fx(num(v.time), 1)} мин` },
    ],
  },

  "sw-dimxpert": {
    desc: "DimXpert: автоматическая простановка размеров и допусков.",
    fields: [f("dims", "Размеров проставлено", "28")],
    outputLabel: "DimXpert",
    compute: v => [{ label: "Размеров проставлено", value: `${num(v.dims)}` }, { label: "Метод", value: "автоматически по геометрии" }],
  },

  "sw-design-checker": {
    desc: "Design Checker: контроль соответствия стандартам оформления.",
    fields: [f("checks", "Проверок выполнено", "45"), f("errors", "Найдено несоответствий", "3")],
    outputLabel: "Design Checker",
    compute: v => {
      const c = num(v.checks), e = num(v.errors)
      return [
        { label: "Проверок выполнено", value: `${c}` },
        { label: "Несоответствий найдено", value: `${e}` },
        { label: "Соответствие стандарту", value: `${fx(c > 0 ? ((c - e) / c) * 100 : 0, 1)} %` },
      ]
    },
  },

  "sw-cam-verify": {
    desc: "Верификация CAM: симуляция обработки, обнаружение столкновений.",
    fields: [f("toolpaths", "Траекторий", "12"), f("collisions", "Столкновений найдено", "0")],
    outputLabel: "Верификация CAM",
    compute: v => {
      const c = num(v.collisions)
      return [
        { label: "Траекторий проверено", value: `${num(v.toolpaths)}` },
        { label: "Столкновений", value: `${c}` },
        { label: "Вердикт", value: c === 0 ? "✓ программа безопасна" : "✗ требуется коррекция" },
      ]
    },
  },

  "sw-cam-cut": {
    desc: "Расчёт реза CAM: время обработки и износ инструмента.",
    fields: [f("len", "Длина реза", "1200", "мм"), f("feed", "Подача", "800", "мм/мин")],
    outputLabel: "Расчёт реза",
    compute: v => {
      const L = num(v.len), fr = num(v.feed)
      return [{ label: "Время реза", value: `${fx(fr > 0 ? L / fr : 0, 2)} мин` }]
    },
  },

  "sw-estd": {
    desc: "Техпроцессы по ЕСТД: нормо-часы на операцию.",
    fields: [f("ops", "Операций", "10"), f("norm", "Норма на операцию", "0.4", "н-ч")],
    outputLabel: "Техпроцесс ЕСТД",
    compute: v => {
      const n = num(v.ops), t = num(v.norm)
      return [{ label: "Операций", value: `${n}` }, { label: "Суммарная трудоёмкость", value: `${fx(n * t, 2)} н-ч` }]
    },
  },

  "sw-norming": {
    desc: "Нормирование: расчёт трудоёмкости и себестоимости работ.",
    fields: [f("time", "Время операции", "18", "мин"), f("rate", "Ставка", "850", "₽/ч")],
    outputLabel: "Нормирование",
    compute: v => {
      const t = num(v.time), r = num(v.rate)
      return [{ label: "Время операции", value: `${fx(t, 1)} мин` }, { label: "Стоимость операции", value: `${fx((t / 60) * r, 1)} ₽` }]
    },
  },

  "sw-autogen-drawing": {
    desc: "Автогенерация чертежей по правилам: пакетная обработка сборки.",
    fields: [f("parts", "Деталей в сборке", "48"), f("timePerDrawing", "Сек на чертёж", "8")],
    outputLabel: "Автогенерация чертежей",
    compute: v => {
      const n = num(v.parts), t = num(v.timePerDrawing)
      return [
        { label: "Чертежей сгенерировано", value: `${n}` },
        { label: "Общее время", value: `${fx((n * t) / 60, 1)} мин` },
        { label: "Экономия против ручной работы", value: `≈${fx((n * 25 * 60 - n * t) / 60, 0)} мин` },
      ]
    },
  },

  "sw-shopfloor": {
    desc: "Shop Floor Programmer: инструкции для станка на цеховом уровне.",
    fields: [f("ops", "Операций", "6")],
    outputLabel: "Shop Floor",
    compute: v => [{ label: "Операций подготовлено", value: `${num(v.ops)}` }],
  },

  "sw27-autogen-drawing": {
    desc: "Автогенерация чертежей v27: расширенные правила именования и видов.",
    fields: [f("parts", "Деталей", "60"), f("views", "Видов на деталь", "3")],
    outputLabel: "Автогенерация чертежей v27",
    compute: v => {
      const n = num(v.parts), vw = num(v.views)
      return [
        { label: "Чертежей", value: `${n}` },
        { label: "Всего видов", value: `${n * vw}` },
      ]
    },
  },

  "sw27-magnetic-lines": {
    desc: "Магнитные линии компоновки: авторасстановка видов на листе.",
    fields: [f("views", "Видов на листе", "5")],
    outputLabel: "Магнитные линии",
    compute: v => [{ label: "Видов выровнено", value: `${num(v.views)}` }, { label: "Метод", value: "автоматическое выравнивание по сетке" }],
  },

  "sw27-dim-breaks": {
    desc: "Разрывы размерных линий: автоматическая расстановка при пересечении.",
    fields: [f("dims", "Размеров на чертеже", "32"), f("crosses", "Пересечений найдено", "6")],
    outputLabel: "Разрывы размеров",
    compute: v => [
      { label: "Размеров проверено", value: `${num(v.dims)}` },
      { label: "Разрывов добавлено", value: `${num(v.crosses)}` },
    ],
  },

  "sw27-pdf-layers": {
    desc: "PDF со слоями: управляемая видимость при печати в PDF.",
    fields: [f("layers", "Слоёв в PDF", "8")],
    outputLabel: "PDF со слоями",
    compute: v => [{ label: "Слоёв в PDF", value: `${num(v.layers)}` }, { label: "Управление видимостью", value: "доступно в Adobe Reader" }],
  },

  "sw27-route-bom": {
    desc: "Спецификация трубопроводов/кабелей: длины и фитинги маршрута.",
    fields: [f("segments", "Сегментов маршрута", "14"), f("totalLen", "Общая длина", "85", "м")],
    outputLabel: "Спецификация маршрута",
    compute: v => {
      const s = num(v.segments), L = num(v.totalLen)
      return [
        { label: "Сегментов", value: `${s}` },
        { label: "Общая длина", value: `${fx(L, 2)} м` },
        { label: "Средняя длина сегмента", value: `${fx(s > 0 ? L / s : 0, 2)} м` },
        { label: "Фитингов (по числу изгибов)", value: `${Math.max(s - 1, 0)}` },
      ]
    },
  },

  "sw27-floating-windows": {
    desc: "Плавающие окна чертежей: многомониторная работа с видами.",
    fields: [f("windows", "Окон открыто", "3")],
    outputLabel: "Плавающие окна",
    compute: v => [{ label: "Окон открыто", value: `${num(v.windows)}` }, { label: "Режим", value: "независимое позиционирование по мониторам" }],
  },
}