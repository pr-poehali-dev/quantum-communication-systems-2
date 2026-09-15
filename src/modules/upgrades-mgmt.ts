// ═══════════════════════════════════════════════════════════════════════════
// Рабочие расчёты для направления «Управление проектами»: совместная работа,
// PDM, себестоимость, синхронизация, производительность платформы.
// ═══════════════════════════════════════════════════════════════════════════

import type { Upgrade } from "./versions-upgrades"
import { num, fx, fmtBig } from "@/utils/engCalc"

const f = (key: string, label: string, def: string, suffix?: string) =>
  ({ key, label, type: "number" as const, default: def, suffix })
const sel = (key: string, label: string, def: string, options: string[]) =>
  ({ key, label, type: "select" as const, default: def, options })
const txt = (key: string, label: string, def: string) =>
  ({ key, label, type: "text" as const, default: def })

export const mgmtUpgrades: Record<string, Upgrade> = {
  // ─── ФИНАЛЬНАЯ ВОЛНА: AutoCAD AI-функции, КОМПАС и SolidWorks документация ──

  "acad-2022-trace": {
    desc: "Слой трассировки для рецензирования: объём правок и трудоёмкость разбора.",
    fields: [txt("author", "Автор", "Рецензент"), sel("color", "Цвет разметки", "Красный", ["Красный", "Синий", "Зелёный", "Оранжевый"]), f("marks", "Правок внесено", "12")],
    outputLabel: "Слой трассировки",
    compute: v => [
      { label: "Автор / цвет", value: `${v.author}, ${v.color}` },
      { label: "Правок на слое", value: `${num(v.marks)}` },
      { label: "Время на разбор", value: `${fx(num(v.marks) * 1.5, 1)} мин` },
    ],
  },

  "acad-2024-smartblocks": {
    desc: "Smart Blocks Placement: рекомендованные точки вставки блока по чертежу.",
    fields: [txt("block", "Блок", "РОЗЕТКА"), f("candidates", "Найдено мест", "24")],
    outputLabel: "Smart Blocks Placement",
    compute: v => [
      { label: "Блок", value: String(v.block) },
      { label: "Рекомендовано мест", value: `${num(v.candidates)}` },
    ],
  },

  "acad-2024-replace": {
    desc: "Замена блоков: сколько вхождений будет заменено и трудоёмкость вручную.",
    fields: [txt("from", "Из блока", "СТАРЫЙ"), txt("to", "В блок", "НОВЫЙ"), f("n", "Вхождений", "16")],
    outputLabel: "Замена блоков",
    compute: v => {
      const n = num(v.n)
      return [
        { label: "Замена", value: `«${v.from}» → «${v.to}»` },
        { label: "Заменено вхождений", value: `${n}` },
        { label: "Экономия времени", value: `${fx(n * 0.8, 1)} мин (было бы вручную)` },
      ]
    },
  },

  "acad-2025-assist": {
    desc: "ИИ-ассистент: обработка запроса и оценка времени ответа.",
    fields: [txt("q", "Вопрос", "Как построить массив?")],
    outputLabel: "Autodesk Assistant",
    compute: v => [
      { label: "Запрос", value: String(v.q) },
      { label: "Статус", value: "ответ подготовлен" },
    ],
  },

  "acad-2025-smartblocks-search": {
    desc: "Smart Blocks Search & Convert: поиск похожих блоков для конвертации.",
    fields: [f("matches", "Найдено совпадений", "7")],
    outputLabel: "Search & Convert",
    compute: v => [
      { label: "Найдено совпадений", value: `${num(v.matches)}` },
      { label: "Готово к конвертации", value: `${num(v.matches)} блоков` },
    ],
  },

  "acad-2026-smarter": {
    desc: "Object Detection: автоматическая кластеризация похожих объектов на чертеже.",
    fields: [f("found", "Кластеров найдено", "5"), f("objs", "Объектов на кластер", "18")],
    outputLabel: "Object Detection",
    compute: v => {
      const n = num(v.found), o = num(v.objs)
      return [
        { label: "Кластеров найдено", value: `${n}` },
        { label: "Объектов всего", value: `${n * o}` },
      ]
    },
  },

  "acad-2026-markup": {
    desc: "Markup Import & Assist v2: авто-применение распознанной разметки.",
    fields: [sel("auto", "Авто-применить", "on", ["on", "off"]), f("marks", "Правок распознано", "9")],
    outputLabel: "Markup Assist v2",
    compute: v => [
      { label: "Правок распознано", value: `${num(v.marks)}` },
      { label: "Авто-применение", value: v.auto === "on" ? "включено" : "выключено" },
    ],
  },

  "acad-2027-ai-layout": {
    desc: "AI Auto-Layout листов: генерация компоновки листов под подшивку.",
    fields: [f("sheets", "Листов сгенерировать", "8")],
    outputLabel: "AI Auto-Layout",
    compute: v => {
      const n = num(v.sheets)
      return [
        { label: "Листов сгенерировано", value: `${n}` },
        { label: "Экономия времени", value: `${fx(n * 12, 0)} мин` },
      ]
    },
  },

  "acad-2027-genai": {
    desc: "Generative Detailing: генерация узла по текстовому запросу.",
    fields: [txt("prompt", "Запрос", "Узел примыкания кровли")],
    outputLabel: "Generative Detailing",
    compute: v => [
      { label: "Запрос", value: String(v.prompt) },
      { label: "Статус", value: "вариант узла сгенерирован" },
    ],
  },

  "kompas-v24-ugo": {
    desc: "Точка вставки УГО: условное графическое обозначение по ГОСТ.",
    fields: [txt("elem", "Обозначение", "Задвижка")],
    outputLabel: "УГО",
    compute: v => [{ label: "Вставлено обозначение", value: String(v.elem) }],
  },

  "kompas-v24-techblocks": {
    desc: "Технологические блоки: массовая замена по библиотеке типовых решений.",
    fields: [f("count", "Блоков заменить", "36")],
    outputLabel: "Технологические блоки",
    compute: v => [
      { label: "Заменено блоков", value: `${num(v.count)}` },
      { label: "Экономия времени", value: `${fx(num(v.count) * 1.2, 1)} мин` },
    ],
  },

  "kompas-v24-spec-report": {
    desc: "Шаблоны отчётов ТХ: настройка колонок и оценка объёма отчёта.",
    fields: [f("cols", "Колонок", "8"), f("rows", "Строк данных", "120")],
    outputLabel: "Шаблон отчёта",
    compute: v => {
      const c = num(v.cols), r = num(v.rows)
      return [
        { label: "Колонок / строк", value: `${c} / ${r}` },
        { label: "Ячеек в отчёте", value: `${c * r}` },
      ]
    },
  },

  "kompas-v25-proj-depth": {
    desc: "Глубина проецирования: пересчёт видимого объёма при заданной глубине.",
    fields: [f("depth", "Глубина проекции", "50", "мм"), f("total", "Полная глубина модели", "200", "мм")],
    outputLabel: "Глубина проецирования",
    compute: v => {
      const d = num(v.depth), t = num(v.total)
      return [
        { label: "Видимая глубина", value: `${fx(d)} мм` },
        { label: "Доля от полной модели", value: `${fx(t > 0 ? (d / t) * 100 : 0, 1)} %` },
      ]
    },
  },

  "sw-drawing": {
    desc: "Ассоциативные чертежи: количество видов, соответствие стандарту оформления.",
    fields: [f("views", "Видов на листе", "4"), sel("std", "Стандарт", "ГОСТ", ["ГОСТ", "ISO", "ANSI", "DIN"])],
    outputLabel: "Ассоциативный чертёж",
    compute: v => [
      { label: "Видов на листе", value: `${num(v.views)}` },
      { label: "Стандарт оформления", value: String(v.std) },
    ],
  },

  "sw-bom": {
    desc: "Спецификация по ЕСКД: позиций, оценка листов спецификации.",
    fields: [f("pos", "Позиций", "42"), sel("fmt", "Формат", "Чертёж SW", ["Чертёж SW", "Excel"])],
    outputLabel: "Спецификация",
    compute: v => {
      const n = num(v.pos)
      return [
        { label: "Позиций в спецификации", value: `${n}` },
        { label: "Листов (по 20 поз.)", value: `${Math.max(1, Math.ceil(n / 20))}` },
        { label: "Формат", value: String(v.fmt) },
      ]
    },
  },

  "sw-mbd": {
    desc: "Бесчертёжные технологии (MBD): плотность размеров на модели.",
    fields: [f("dims", "Размеров", "24")],
    outputLabel: "MBD-модель",
    compute: v => [{ label: "Размеров на модели", value: `${num(v.dims)}` }],
  },

  "sw-dxf-cnc": {
    desc: "Экспорт 2D DXF/DWG для ЧПУ: количество деталей и оценка времени экспорта.",
    fields: [f("parts", "Деталей", "12")],
    outputLabel: "Экспорт DXF для ЧПУ",
    compute: v => {
      const n = num(v.parts)
      return [
        { label: "Деталей экспортировано", value: `${n}` },
        { label: "Время экспорта", value: `${fx(n * 2, 1)} с` },
      ]
    },
  },

  "sw-print3d": {
    desc: "Печать на 3D-принтере: подготовка модели и оценка размера файла.",
    fields: [sel("fmt", "Формат", "3MF", ["AMF", "3MF", "STL"]), f("tri", "Треугольников", "85000")],
    outputLabel: "Печать 3D",
    compute: v => {
      const kb: Record<string, number> = { "AMF": 60, "3MF": 45, "STL": 80 }
      const n = num(v.tri)
      return [
        { label: "Формат", value: String(v.fmt) },
        { label: "Треугольников", value: fmtBig(n, 0) },
        { label: "Оценка размера файла", value: `${fx((n * (kb[String(v.fmt)] ?? 60)) / 1e6, 2)} МБ` },
      ]
    },
  },

  "sw-composer": {
    desc: "Composer: интерактивные электронные технические руководства (ИЭТР).",
    fields: [f("steps", "Шагов сборки", "24")],
    outputLabel: "Composer (ИЭТР)",
    compute: v => {
      const n = num(v.steps)
      return [
        { label: "Шагов сборки", value: `${n}` },
        { label: "Время подготовки", value: `${fx(n * 3, 0)} мин` },
      ]
    },
  },

  "sw-inspection": {
    desc: "Inspection: контрольные карты качества, число контролируемых размеров.",
    fields: [f("dims", "Контролируемых размеров", "56")],
    outputLabel: "Контрольная карта",
    compute: v => {
      const n = num(v.dims)
      return [
        { label: "Контролируемых размеров", value: `${n}` },
        { label: "Время контроля партии", value: `${fx(n * 1.5, 0)} мин` },
      ]
    },
  },

  "sw-mbd-std": {
    desc: "MBD-модель: плотность аннотаций PMI на изделии.",
    fields: [f("pmi", "Аннотаций PMI", "40")],
    outputLabel: "MBD-аннотации",
    compute: v => [{ label: "Аннотаций PMI", value: `${num(v.pmi)}` }],
  },

  "sw-cam": {
    desc: "CAM: программирование ЧПУ, оценка времени генерации УП по элементам.",
    fields: [sel("op", "Обработка", "Фрезерная", ["Фрезерная", "Токарная", "Токарно-фрезерная", "Электроэрозионная"]), f("feat", "Элементов", "18")],
    outputLabel: "CAM программа",
    compute: v => {
      const n = num(v.feat)
      return [
        { label: "Тип обработки", value: String(v.op) },
        { label: "Элементов", value: `${n}` },
        { label: "Время генерации УП", value: `${fx(n * 4, 0)} мин` },
      ]
    },
  },

  "sw-design-checker": {
    desc: "Design Checker: контроль соответствия стандартам предприятия.",
    fields: [f("sheets", "Документов", "48")],
    outputLabel: "Design Checker",
    compute: v => {
      const n = num(v.sheets)
      const issues = Math.round(n * 0.08)
      return [
        { label: "Проверено документов", value: `${n}` },
        { label: "Найдено нарушений", value: `${issues}` },
        { label: "Соответствие СтП", value: `${fx(n > 0 ? ((n - issues) / n) * 100 : 0, 1)} %` },
      ]
    },
  },

  "sw-cam-verify": {
    desc: "Верификация УП: симуляция станка по кадрам G-кода, оценка времени обработки.",
    fields: [f("lines", "Кадров G-кода", "12000")],
    outputLabel: "Верификация УП",
    compute: v => {
      const n = num(v.lines)
      return [
        { label: "Кадров G-кода", value: fmtBig(n, 0) },
        { label: "Время симуляции", value: `${fx(n / 2000, 1)} мин` },
        { label: "Оценка машинного времени", value: `${fx(n / 800, 1)} мин` },
      ]
    },
  },

  "sw-cam-cut": {
    desc: "Резка (лазер/плазма/гидроабразив): время реза по технологии.",
    fields: [sel("type", "Технология", "Лазер", ["Лазер", "Плазма", "Гидроабразив"]), f("len", "Длина реза", "3200", "мм")],
    outputLabel: "Программа резки",
    compute: v => {
      const speed: Record<string, number> = { "Лазер": 3000, "Плазма": 2000, "Гидроабразив": 150 }
      const s = speed[String(v.type)] ?? 2000
      const t = num(v.len) / s
      return [
        { label: "Технология", value: String(v.type) },
        { label: "Длина реза", value: `${fx(num(v.len))} мм` },
        { label: "Время резки", value: `${fx(t, 1)} мин` },
      ]
    },
  },

  "sw-estd": {
    desc: "Техпроцессы по ЕСТД: число операций и оценка листов карты техпроцесса.",
    fields: [f("ops", "Операций", "18")],
    outputLabel: "Техпроцесс ЕСТД",
    compute: v => {
      const n = num(v.ops)
      return [
        { label: "Операций", value: `${n}` },
        { label: "Листов карты", value: `${Math.max(1, Math.ceil(n / 6))}` },
      ]
    },
  },

  "sw-norming": {
    desc: "Материальное и трудовое нормирование: время на партию и годовой фонд.",
    fields: [f("tpiece", "Штучное время", "12", "мин"), f("qty", "Партия", "500", "шт")],
    outputLabel: "Нормирование",
    compute: v => {
      const t = num(v.tpiece), q = num(v.qty)
      return [
        { label: "Штучное время", value: `${fx(t)} мин` },
        { label: "Время на партию", value: `${fx((t * q) / 60, 1)} ч` },
        { label: "Смен (по 8 ч)", value: `${fx((t * q) / 60 / 8, 1)}` },
      ]
    },
  },

  "sw-autogen-drawing": {
    desc: "Авточертёж по 3D-модели: количество проекций и экономия времени.",
    fields: [f("views", "Проекций", "3")],
    outputLabel: "Авточертёж",
    compute: v => {
      const n = num(v.views)
      return [
        { label: "Проекций сгенерировано", value: `${n}` },
        { label: "Экономия времени", value: `${fx(n * 8, 0)} мин` },
      ]
    },
  },

  "sw-shopfloor": {
    desc: "Shop Floor Programmer: программирование на станке, число операций.",
    fields: [f("ops", "Операций", "24")],
    outputLabel: "Shop Floor",
    compute: v => [
      { label: "Операций запрограммировано", value: `${num(v.ops)}` },
      { label: "Время подготовки", value: `${fx(num(v.ops) * 2, 0)} мин` },
    ],
  },

  "sw27-autogen-drawing": {
    desc: "Автогенерация чертежей с GD&T и спецификацией: полнота автоматизации.",
    fields: [sel("views", "Проекций", "3 + изометрия", ["2 + изометрия", "3 + изометрия", "Все виды"]), sel("gdt", "Рамки GD&T и базы", "on", ["on", "off"]), sel("bom", "Спецификация", "off", ["on", "off"])],
    outputLabel: "Автогенерация чертежей",
    compute: v => [
      { label: "Набор проекций", value: String(v.views) },
      { label: "GD&T", value: v.gdt === "on" ? "включено" : "выключено" },
      { label: "Спецификация", value: v.bom === "on" ? "включена" : "выключена" },
    ],
  },

  "sw27-magnetic-lines": {
    desc: "Магнитные линии для аннотаций: выравнивание выносок/размеров вдоль линии.",
    fields: [sel("type", "Тип аннотаций", "Примечания", ["Выноски", "Примечания", "Сварочные символы", "Размеры", "Символы ревизий"]), f("count", "Аннотаций на линии", "6")],
    outputLabel: "Магнитные линии",
    compute: v => [
      { label: "Тип аннотаций", value: String(v.type) },
      { label: "Выровнено на линии", value: `${num(v.count)}` },
    ],
  },

  "sw27-dim-breaks": {
    desc: "Разрывы размерных линий на пересечениях: число обработанных пересечений.",
    fields: [f("cross", "Пересечений", "14")],
    outputLabel: "Разрывы размеров",
    compute: v => [{ label: "Разрывов добавлено", value: `${num(v.cross)}` }],
  },

  "sw27-pdf-layers": {
    desc: "Экспорт в PDF со слоями: состав включённых слоёв для печати.",
    fields: [sel("dims", "Слой размеров", "on", ["on", "off"]), sel("hidden", "Слой скрытых линий", "on", ["on", "off"]), sel("comments", "Слой комментариев", "off", ["on", "off"])],
    outputLabel: "PDF со слоями",
    compute: v => {
      const layers = [v.dims === "on" && "Размеры", v.hidden === "on" && "Скрытые линии", v.comments === "on" && "Комментарии"].filter(Boolean)
      return [
        { label: "Слоёв в PDF", value: `${layers.length}` },
        { label: "Состав", value: layers.join(", ") || "нет активных слоёв" },
      ]
    },
  },

  "sw27-route-bom": {
    desc: "Сводная спецификация маршрутов (труб/кабелей) по подсборкам.",
    fields: [f("subs", "Подсборок", "5"), f("items", "Позиций на подсборку", "8")],
    outputLabel: "Спецификация маршрутов",
    compute: v => {
      const s = num(v.subs), i = num(v.items)
      return [
        { label: "Подсборок", value: `${s}` },
        { label: "Всего позиций", value: `${s * i}` },
      ]
    },
  },

  "sw27-floating-windows": {
    desc: "Плавающие окна чертежей: многомониторная работа, оценка удобства.",
    fields: [f("win", "Открыто окон", "3")],
    outputLabel: "Плавающие окна",
    compute: v => [{ label: "Открыто окон чертежей", value: `${num(v.win)}` }],
  },

  "sw-dimxpert": {
    desc: "DimXpert: автоматическая простановка размеров и допусков по элементам модели.",
    fields: [f("feat", "Элементов", "30"), f("tolPct", "Доля элементов с допуском", "35", "%")],
    outputLabel: "Простановка размеров",
    compute: v => {
      const n = num(v.feat), tol = Math.round(n * (num(v.tolPct) / 100))
      return [
        { label: "Проставлено размеров", value: `${n}` },
        { label: "Из них с допусками", value: `${tol}` },
        { label: "Экономия времени", value: `${fx(n * 1.2, 0)} мин` },
      ]
    },
  },


  "acad-2022-share": {
    desc: "Общий доступ к чертежу: срок действия ссылки, число участников, ограничение прав.",
    fields: [sel("mode", "Права", "Просмотр", ["Просмотр", "Редактирование"]), f("users", "Ожидается участников", "6"), f("days", "Срок действия ссылки", "7", "дн.")],
    outputLabel: "Общий доступ",
    compute: v => {
      const n = num(v.users), days = num(v.days)
      return [
        { label: "Режим доступа", value: String(v.mode) },
        { label: "Участников", value: `${n}` },
        { label: "Срок действия", value: `${fx(days, 0)} дн.` },
        { label: "Истекает", value: `через ${fx(days, 0)} дн.` },
        { label: "Рекомендация", value: v.mode === "Редактирование" && n > 5 ? "⚠ ограничьте число редакторов" : "✓ безопасно" },
      ]
    },
  },

  "acad-2024-activityinsights": {
    desc: "Activity Insights: аналитика активности в проекте за период.",
    fields: [f("days", "За период", "30", "дн."), f("sessions", "Сессий работы", "84"), f("users", "Активных пользователей", "6")],
    outputLabel: "Аналитика активности",
    compute: v => {
      const days = num(v.days), s = num(v.sessions), u = num(v.users)
      return [
        { label: "Период", value: `${fx(days, 0)} дн.` },
        { label: "Сессий работы", value: `${s}` },
        { label: "Активных пользователей", value: `${u}` },
        { label: "Сессий в день", value: fx(days > 0 ? s / days : 0, 1) },
        { label: "Сессий на пользователя", value: fx(u > 0 ? s / u : 0, 1) },
      ]
    },
  },

  "acad-2026-perf": {
    desc: "Оценка ускорения открытия файла: время загрузки до и после оптимизации.",
    fields: [f("mb", "Размер файла", "180", "МБ"), f("boost", "Прирост скорости", "35", "%")],
    outputLabel: "Ускорение открытия",
    compute: v => {
      const mb = num(v.mb), boost = num(v.boost) / 100
      const before = mb / 12
      const after = before * (1 - boost)
      return [
        { label: "Размер файла", value: `${fx(mb, 0)} МБ` },
        { label: "Время открытия (было)", value: `${fx(before, 1)} с` },
        { label: "Время открытия (стало)", value: `${fx(after, 1)} с` },
        { label: "Экономия", value: `${fx(before - after, 1)} с (${fx(boost * 100, 0)} %)` },
        { label: "На 50 открытий в день", value: `${fx(((before - after) * 50) / 60, 1)} мин/день` },
      ]
    },
  },

  "acad-2027-cloudsync": {
    desc: "Совместное редактирование в облаке: задержка синхронизации, нагрузка на канал.",
    fields: [f("users", "Участников", "4"), f("ping", "Задержка сети", "45", "мс"), f("ops", "Операций в минуту на юзера", "12")],
    outputLabel: "Облачная совместная работа",
    compute: v => {
      const n = num(v.users), ping = num(v.ping), ops = num(v.ops)
      const totalOps = n * ops
      const sync = ping * Math.log2(Math.max(n, 2))
      return [
        { label: "Участников сессии", value: `${n}` },
        { label: "Операций синхронизации/мин", value: fmtBig(totalOps, 0) },
        { label: "Задержка отображения правки", value: `${fx(sync, 0)} мс` },
        { label: "Пропускная способность", value: `${fx((totalOps * 2) / 60, 2)} КБ/с` },
        { label: "Оценка комфортности", value: sync < 150 ? "✓ плавно" : sync < 400 ? "⚠ заметные задержки" : "✗ нужен канал быстрее" },
      ]
    },
  },

  "civil-2027-digital-twin": {
    desc: "Синхронизация цифрового двойника: объём телеметрии с датчиков IoT.",
    fields: [f("sensors", "Датчиков", "36"), f("freq", "Частота опроса", "10", "с"), f("bytes", "Байт на пакет", "128")],
    outputLabel: "Цифровой двойник",
    compute: v => {
      const n = num(v.sensors), freq = num(v.freq), b = num(v.bytes)
      const perHour = n * (3600 / freq) * b
      return [
        { label: "Датчиков подключено", value: `${n}` },
        { label: "Пакетов в час", value: fmtBig(n * (3600 / freq), 0) },
        { label: "Трафик в час", value: `${fx(perHour / 1024, 1)} КБ` },
        { label: "Трафик в сутки", value: `${fx((perHour * 24) / 1048576, 2)} МБ` },
        { label: "Трафик в месяц", value: `${fx((perHour * 24 * 30) / 1073741824, 3)} ГБ` },
      ]
    },
  },

  "interop-cloud-format": {
    desc: "Пакетная конвертация форматов: время обработки, размер результата.",
    fields: [f("files", "Файлов", "48"), sel("to", "В формат", "IFC4", ["DWG 2018", "IFC4", "PDF", "STEP", "LandXML"]), f("avgMb", "Средний размер файла", "12", "МБ")],
    outputLabel: "Пакетная конвертация",
    compute: v => {
      const n = num(v.files), mb = num(v.avgMb)
      const kTime: Record<string, number> = { "DWG 2018": 2, "IFC4": 5, "PDF": 3, "STEP": 6, "LandXML": 4 }
      const t = kTime[String(v.to)] ?? 4
      return [
        { label: "Файлов в пакете", value: `${n}` },
        { label: "Целевой формат", value: String(v.to) },
        { label: "Время на файл", value: `${fx(t + mb / 20, 1)} с` },
        { label: "Общее время конвертации", value: `${fx((n * (t + mb / 20)) / 60, 1)} мин` },
        { label: "Итоговый объём", value: `${fmtBig(n * mb * 0.85, 0)} МБ` },
      ]
    },
  },

  "sw-edrawings": {
    desc: "Согласование в eDrawings: сжатие модели, время загрузки для рецензента.",
    fields: [f("mb", "Размер исходной модели", "85", "МБ"), sel("mode", "Режим", "Просмотр", ["Просмотр", "Измерения", "Разметка"]), f("users", "Рецензентов", "5")],
    outputLabel: "Согласование модели",
    compute: v => {
      const mb = num(v.mb), n = num(v.users)
      const compressed = mb * 0.12
      return [
        { label: "Исходный размер", value: `${fx(mb, 1)} МБ` },
        { label: "Размер eDrawings", value: `${fx(compressed, 1)} МБ (сжатие ×8)` },
        { label: "Время загрузки (10 Мбит/с)", value: `${fx((compressed * 8) / 10, 1)} с` },
        { label: "Режим", value: String(v.mode) },
        { label: "Рецензентов", value: `${n}` },
        { label: "Суммарный трафик рассылки", value: `${fx(compressed * n, 1)} МБ` },
      ]
    },
  },

  "sw-pdm": {
    desc: "PDM: структура документооборота, статусы, версионность.",
    fields: [f("docs", "Документов", "1240"), sel("stage", "Статус", "В работе", ["В работе", "На проверке", "Утверждён", "В архиве"]), f("rev", "Средняя ревизий на документ", "3.2")],
    outputLabel: "Управление данными",
    compute: v => {
      const n = num(v.docs), rev = num(v.rev)
      return [
        { label: "Документов в системе", value: fmtBig(n, 0) },
        { label: "Текущий статус выборки", value: String(v.stage) },
        { label: "Средняя версионность", value: fx(rev, 1) },
        { label: "Всего версий в хранилище", value: fmtBig(n * rev, 0) },
        { label: "Оценка объёма (5 МБ/версия)", value: `${fmtBig((n * rev * 5) / 1024, 1)} ГБ` },
      ]
    },
  },

  "sw-manage": {
    desc: "Manage: проекты и процессы согласования, загрузка команды.",
    fields: [f("tasks", "Задач", "85"), f("team", "Участников команды", "12"), f("days", "Срок проекта", "45", "дн.")],
    outputLabel: "Проекты и процессы",
    compute: v => {
      const t = num(v.tasks), team = num(v.team), d = num(v.days)
      return [
        { label: "Задач в проекте", value: `${t}` },
        { label: "Задач на участника", value: fx(team > 0 ? t / team : 0, 1) },
        { label: "Задач в день (план)", value: fx(d > 0 ? t / d : 0, 2) },
        { label: "Требуемая скорость закрытия", value: `${fx(d > 0 ? t / d : 0, 2)} задач/день` },
        { label: "Оценка загрузки", value: team > 0 && t / team > 15 ? "⚠ высокая нагрузка" : "✓ норма" },
      ]
    },
  },

  "sw-task-scheduler": {
    desc: "Автоматизация по расписанию: пакетная обработка файлов, время выполнения.",
    fields: [f("files", "Файлов в пакете", "150"), f("perFile", "Секунд на файл", "8")],
    outputLabel: "Задачи по расписанию",
    compute: v => {
      const n = num(v.files), t = num(v.perFile)
      return [
        { label: "Файлов в пакете", value: `${n}` },
        { label: "Время на файл", value: `${fx(t, 1)} с` },
        { label: "Общее время выполнения", value: `${fx((n * t) / 60, 1)} мин` },
        { label: "Рекомендуемый запуск", value: n * t > 3600 ? "ночью, вне рабочих часов" : "в любое время" },
      ]
    },
  },

  "sw-esign": {
    desc: "ЭЦП: объём документов на подпись, оценка времени обработки.",
    fields: [f("docs", "Документов на подпись", "32"), f("perDoc", "Секунд на подпись", "12")],
    outputLabel: "ЭЦП и защита данных",
    compute: v => {
      const n = num(v.docs), t = num(v.perDoc)
      return [
        { label: "Документов", value: `${n}` },
        { label: "Время на пакет", value: `${fx((n * t) / 60, 1)} мин` },
        { label: "Подписей в час (макс.)", value: fmtBig(3600 / t, 0) },
        { label: "Статус защиты", value: "✓ ЭЦП и хэш-контроль целостности" },
      ]
    },
  },

  "sw-erp-cost": {
    desc: "Данные для ERP: себестоимость изделия по материалам, работе и накладным.",
    fields: [f("mat", "Материал", "1200", "₽"), f("labor", "Работа", "2400", "₽"), f("overhead", "Накладные расходы", "25", "%"), f("qty", "Тираж", "500", "шт")],
    outputLabel: "Себестоимость",
    compute: v => {
      const mat = num(v.mat), labor = num(v.labor), oh = num(v.overhead) / 100, q = num(v.qty)
      const direct = mat + labor
      const full = direct * (1 + oh)
      return [
        { label: "Прямые затраты", value: `${fmtBig(direct, 0)} ₽` },
        { label: "Накладные расходы", value: `${fmtBig(direct * oh, 0)} ₽` },
        { label: "Полная себестоимость", value: `${fmtBig(full, 0)} ₽/шт` },
        { label: "Себестоимость тиража", value: `${fmtBig(full * q, 0)} ₽` },
        { label: "Доля материала", value: `${fx((mat / full) * 100, 1)} %` },
      ]
    },
  },

  "sw27-web-share": {
    desc: "Обмен ссылками на 3D-модели: объём просмотров, права доступа.",
    fields: [sel("access", "Доступ", "Просмотр + комментарии", ["Только просмотр", "Просмотр + комментарии"]), f("views", "Ожидаемых просмотров", "40")],
    outputLabel: "Обмен ссылками",
    compute: v => [
      { label: "Уровень доступа", value: String(v.access) },
      { label: "Ожидаемые просмотры", value: `${num(v.views)}` },
      { label: "Требуется регистрация", value: v.access === "Просмотр + комментарии" ? "да, для комментариев" : "нет" },
    ],
  },

  "sw27-pdm-sync": {
    desc: "Синхронизация представлений PDM: папки, объём передачи, время.",
    fields: [f("folders", "Папок к синхронизации", "36"), f("filesPerFolder", "Файлов в папке", "45"), f("speedMbps", "Скорость канала", "50", "Мбит/с")],
    outputLabel: "Синхронизация PDM",
    compute: v => {
      const folders = num(v.folders), fpf = num(v.filesPerFolder), speed = num(v.speedMbps)
      const totalFiles = folders * fpf
      const totalMb = totalFiles * 3
      return [
        { label: "Всего файлов", value: fmtBig(totalFiles, 0) },
        { label: "Оценка объёма", value: `${fmtBig(totalMb, 0)} МБ` },
        { label: "Время синхронизации", value: `${fx((totalMb * 8) / speed / 60, 1)} мин` },
      ]
    },
  },

  "sw27-offline-mode": {
    desc: "Автономный режим: буфер несинхронизированных изменений при нестабильной сети.",
    fields: [sel("state", "Соединение", "Нестабильное", ["Онлайн", "Нестабильное", "Отсутствует"]), f("changes", "Изменений в очереди", "18")],
    outputLabel: "Автономный режим",
    compute: v => {
      const c = num(v.changes)
      const risk = v.state === "Отсутствует" ? "высокий" : v.state === "Нестабильное" ? "средний" : "низкий"
      return [
        { label: "Состояние соединения", value: String(v.state) },
        { label: "Изменений в очереди", value: `${c}` },
        { label: "Риск конфликта версий", value: risk },
        { label: "Рекомендация", value: v.state !== "Онлайн" ? "работайте локально, синхронизация автоматическая" : "изменения применяются мгновенно" },
      ]
    },
  },
}