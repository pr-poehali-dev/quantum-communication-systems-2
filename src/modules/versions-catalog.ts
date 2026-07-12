// ═══════════════════════════════════════════════════════════════════════════
// Полный реестр функций AutoCAD и AutoCAD Civil 3D, версии 2022 → 2027.
// Каждая функция привязана к направлению работы (совпадает с DIRECTIONS в Dashboard).
// product: "acad" — AutoCAD, "civil" — Civil 3D.
// ═══════════════════════════════════════════════════════════════════════════

export type ProductId = "acad" | "civil"
export type DirId = "infra" | "survey" | "networks" | "bim" | "mechanical" | "docs" | "management"
export type VersionId = "2022" | "2023" | "2024" | "2025" | "2026" | "2027"
export type CategoryId =
  | "draw" | "modify" | "modeling3d" | "annotation" | "collab"
  | "corridor" | "surface" | "network" | "coords" | "bim" | "ai" | "platform"
  | "layers" | "blocks" | "xref" | "plot" | "interop" | "survey"

export interface CategoryMeta { id: CategoryId; label: string; icon: string; color: string }

export const CATEGORIES: CategoryMeta[] = [
  { id: "draw", label: "Черчение", icon: "PenLine", color: "#0078d4" },
  { id: "modify", label: "Редактирование", icon: "Move", color: "#7c3aed" },
  { id: "layers", label: "Слои и свойства", icon: "Layers3", color: "#0ea5e9" },
  { id: "blocks", label: "Блоки и атрибуты", icon: "Boxes", color: "#f59e0b" },
  { id: "xref", label: "Внешние ссылки (Xref)", icon: "Link2", color: "#6366f1" },
  { id: "plot", label: "Печать и публикация", icon: "Printer", color: "#e11d48" },
  { id: "interop", label: "Интеграция и обмен форматами", icon: "Puzzle", color: "#0d9488" },
  { id: "modeling3d", label: "3D-моделирование", icon: "Box", color: "#0891b2" },
  { id: "annotation", label: "Аннотации и оформление", icon: "Type", color: "#059669" },
  { id: "collab", label: "Совместная работа", icon: "Users", color: "#d97706" },
  { id: "corridor", label: "Коридоры и трассы", icon: "RoadHorizon", color: "#f97316" },
  { id: "surface", label: "Поверхности и рельеф", icon: "Mountain", color: "#10b981" },
  { id: "network", label: "Инженерные сети", icon: "Network", color: "#3b82f6" },
  { id: "coords", label: "Координаты и геодезия", icon: "Globe", color: "#14b8a6" },
  { id: "survey", label: "Геодезия и съёмка (COGO)", icon: "MapPin", color: "#0284c7" },
  { id: "bim", label: "BIM и IFC", icon: "Building2", color: "#8b5cf6" },
  { id: "ai", label: "ИИ и автоматизация", icon: "Bot", color: "#ec4899" },
  { id: "platform", label: "Платформа и производительность", icon: "Gauge", color: "#64748b" },
]

export interface VersionFeature {
  id: string
  product: ProductId
  version: VersionId
  dir: DirId
  category: CategoryId
  name: string
  desc: string
  icon: string
  isNew?: boolean
  command?: string
}

export const PRODUCTS: { id: ProductId; label: string; short: string; color: string }[] = [
  { id: "acad", label: "AutoCAD", short: "ACAD", color: "#d13438" },
  { id: "civil", label: "AutoCAD Civil 3D", short: "C3D", color: "#0078d4" },
]

export const VERSIONS: VersionId[] = ["2022", "2023", "2024", "2025", "2026", "2027"]

export const DIR_LABELS: Record<DirId, string> = {
  infra: "Инфраструктура и дороги",
  survey: "Геодезия и изыскания",
  networks: "Инженерные сети",
  bim: "BIM и архитектура",
  mechanical: "Машиностроение / САПР",
  docs: "Документация и вывод",
  management: "Управление проектами",
}

// Тип поля для рабочего инструмента функции
export interface ToolField {
  key: string
  label: string
  type: "text" | "number" | "select" | "toggle"
  default?: string
  options?: string[]
  suffix?: string
}

export interface VersionFeatureFull extends VersionFeature {
  fields: ToolField[]
  outputLabel: string
  // функция расчёта результата по значениям полей
  compute?: (v: Record<string, string>) => { label: string; value: string }[]
}

// На входе category необязательна — она достраивается автоматически по id.
type RawFeature = Omit<VersionFeatureFull, "category"> & { category?: CategoryId }

const num = (v: string) => parseFloat((v || "0").replace(",", ".")) || 0

// Автоопределение категории по id функции (порядок правил = приоритет)
const detectCategory = (id: string): CategoryId => {
  const s = id
  // Civil-специфика проверяется раньше общих правил
  if (/^survey|cogo|-survey|traverse|figure|total-station|leveling|adjust|geodetic|gnss|astro/.test(s)) return "survey"
  if (/corridor|profile|-align|road|transition|superelev/.test(s)) return "corridor"
  if (/surface|grading|aoi|dtm|relative/.test(s)) return "surface"
  if (/pressure|drainage|network|parts/.test(s)) return "network"
  if (/coord|transform/.test(s)) return "coords"
  // Интеграция и обмен форматами (раньше bim, т.к. содержит ifc)
  if (/^interop|import|export|-dwg|-dxf|-ifc|landxml|-shp|-kml|geojson|-rvt|-step|-dgn|format/.test(s)) return "interop"
  if (/property-set|solids|-bim|viewer|model-viewer|ifc/.test(s)) return "bim"
  // Печать и публикация
  if (/plot|-print|layout|-pdf|dwf|publish|sheetset|-ctb|-stb|page-setup|batch-plot/.test(s)) return "plot"
  // Слои / блоки / внешние ссылки
  if (/xref|external-ref|underlay|clip|overlay|attach/.test(s)) return "xref"
  if (/layer|laymrg|laydel|layiso|layfrz|layon|layoff|l-props|property-paint/.test(s)) return "layers"
  if (/block|-attrib|battman|attdef|attext|wblock|dynblock/.test(s)) return "blocks"
  // Аннотации раньше черчения (dimlinear содержит "line")
  if (/anno|dim|mtext|leader|table|field|revcloud|-text|count/.test(s)) return "annotation"
  // Редактирование раньше черчения (offset/array/fillet/chamfer — команды правки)
  if (/modify|move|rotate|scale|mirror|copy|offset|array|fillet|chamfer|trim|extend|stretch|erase|explode/.test(s)) return "modify"
  if (/3d|extrude|revolve|sweep|loft|solid|union|subtract|intersect|mesh|render/.test(s)) return "modeling3d"
  if (/draw|line|pline|circle|arc|rect|polygon|spline|region|hatch/.test(s)) return "draw"
  if (/ai|assist|smart|gen|bot|detect|markup|object|replace/.test(s)) return "ai"
  if (/share|coedit|collab|activity|insights|cloud|twin|docs|push/.test(s)) return "collab"
  return "platform"
}

// ─── Реестр (сырой, без category) ────────────────────────────────────────────
const RAW_FEATURES: RawFeature[] = [

  // ═══════════════ AutoCAD 2022 ═══════════════
  {
    id: "acad-2022-trace", product: "acad", version: "2022", dir: "docs",
    name: "Trace (Трассировка)", command: "TRACE",
    desc: "Безопасное пространство для рецензирования и разметки чертежа без изменения оригинала.",
    icon: "PenLine", outputLabel: "Слой трассировки",
    fields: [
      { key: "author", label: "Автор", type: "text", default: "Рецензент" },
      { key: "color", label: "Цвет разметки", type: "select", default: "Красный", options: ["Красный", "Синий", "Зелёный", "Оранжевый"] },
    ],
    compute: v => [{ label: "Трассировка создана", value: `${v.color}, автор: ${v.author}` }],
  },
  {
    id: "acad-2022-count", product: "acad", version: "2022", dir: "docs",
    name: "Count (Подсчёт блоков)", command: "COUNT",
    desc: "Автоматический подсчёт вхождений блоков и объектов с выводом в таблицу.",
    icon: "Hash", outputLabel: "Результат подсчёта",
    fields: [
      { key: "block", label: "Имя блока", type: "text", default: "СВЕТИЛЬНИК" },
      { key: "count", label: "Найдено вхождений", type: "number", default: "48" },
    ],
    compute: v => [{ label: `Блок «${v.block}»`, value: `${v.count} шт.` }],
  },
  {
    id: "acad-2022-share", product: "acad", version: "2022", dir: "management",
    name: "Share (Общий доступ)", command: "SHARE",
    desc: "Создание ссылки на копию чертежа для просмотра или редактирования в браузере.",
    icon: "Share2", outputLabel: "Ссылка доступа",
    fields: [
      { key: "mode", label: "Права", type: "select", default: "Просмотр", options: ["Просмотр", "Редактирование"] },
    ],
    compute: v => [{ label: "Ссылка создана", value: `Режим: ${v.mode}` }],
  },
  {
    id: "acad-2022-pushbutton", product: "acad", version: "2022", dir: "bim",
    name: "Push to Autodesk Docs", command: "PUSHTOAUTODESKDOCS",
    desc: "Публикация подшивки листов в облако Autodesk Docs как PDF.",
    icon: "CloudUpload", outputLabel: "Публикация",
    fields: [{ key: "sheets", label: "Листов в подшивке", type: "number", default: "12" }],
    compute: v => [{ label: "Опубликовано", value: `${v.sheets} листов в PDF` }],
  },

  // ═══════════════ AutoCAD 2023 ═══════════════
  {
    id: "acad-2023-mtext", product: "acad", version: "2023", dir: "docs",
    name: "My Insights / Markup Import", command: "MARKUPASSIST",
    desc: "Импорт разметки с бумаги или PDF и умное сопоставление правок с чертежом.",
    icon: "Sparkles", isNew: true, outputLabel: "Импорт разметки",
    fields: [{ key: "marks", label: "Обнаружено правок", type: "number", default: "9" }],
    compute: v => [{ label: "Правки распознаны", value: `${v.marks} шт.` }],
  },
  {
    id: "acad-2023-count-toolbar", product: "acad", version: "2023", dir: "docs",
    name: "Count — панель и поля", command: "COUNT",
    desc: "Панель Count, вставка динамических полей подсчёта в таблицы и выноски.",
    icon: "ListOrdered", outputLabel: "Поле подсчёта",
    fields: [{ key: "field", label: "Имя поля", type: "text", default: "Count_Двери" }],
    compute: v => [{ label: "Поле вставлено", value: v.field }],
  },
  {
    id: "acad-2023-3dgraphics", product: "acad", version: "2023", dir: "bim",
    name: "Новая 3D-графика", command: "3DORBIT",
    desc: "Движок отображения с аппаратным ускорением для больших 3D-моделей.",
    icon: "Box", isNew: true, outputLabel: "Производительность",
    fields: [{ key: "objects", label: "Объектов в модели", type: "number", default: "250000" }],
    compute: v => [{ label: "FPS оценка", value: `${Math.max(24, Math.round(60 - num(v.objects) / 20000))} к/с` }],
  },

  // ═══════════════ AutoCAD 2024 ═══════════════
  {
    id: "acad-2024-smartblocks", product: "acad", version: "2024", dir: "docs",
    name: "Smart Blocks: Placement", command: "BLOCKSPLACEMENT",
    desc: "ИИ-размещение блоков: подсказки положения на основе предыдущих вставок.",
    icon: "Wand2", isNew: true, outputLabel: "Размещение",
    fields: [{ key: "block", label: "Блок", type: "text", default: "РОЗЕТКА" }],
    compute: v => [{ label: "ИИ-подсказка", value: `Размещение «${v.block}» предложено` }],
  },
  {
    id: "acad-2024-replace", product: "acad", version: "2024", dir: "docs",
    name: "Smart Blocks: Replace", command: "BLOCKREPLACE",
    desc: "Замена одного блока другим с сохранением масштаба и поворота.",
    icon: "Repeat", isNew: true, outputLabel: "Замена блоков",
    fields: [
      { key: "from", label: "Из блока", type: "text", default: "СТАРЫЙ" },
      { key: "to", label: "В блок", type: "text", default: "НОВЫЙ" },
      { key: "n", label: "Вхождений", type: "number", default: "16" },
    ],
    compute: v => [{ label: "Заменено", value: `${v.n}: ${v.from} → ${v.to}` }],
  },
  {
    id: "acad-2024-activityinsights", product: "acad", version: "2024", dir: "management",
    name: "Activity Insights", command: "ACTIVITYINSIGHTS",
    desc: "Журнал версий и событий чертежа: кто и когда что менял.",
    icon: "History", isNew: true, outputLabel: "Журнал",
    fields: [{ key: "days", label: "За период, дней", type: "number", default: "30" }],
    compute: v => [{ label: "Событий в журнале", value: `${Math.round(num(v.days) * 7)}` }],
  },

  // ═══════════════ AutoCAD 2025 ═══════════════
  {
    id: "acad-2025-assist", product: "acad", version: "2025", dir: "docs",
    name: "Autodesk Assistant (ИИ)", command: "ASSISTANT",
    desc: "ИИ-помощник: ответы по командам, генерация подсказок прямо в интерфейсе.",
    icon: "Bot", isNew: true, outputLabel: "Ответ ассистента",
    fields: [{ key: "q", label: "Вопрос", type: "text", default: "Как построить массив?" }],
    compute: v => [{ label: "Ассистент", value: `Ответ на: «${v.q}»` }],
  },
  {
    id: "acad-2025-smartblocks-search", product: "acad", version: "2025", dir: "docs",
    name: "Smart Blocks: Search & Convert", command: "BLOCKCONVERT",
    desc: "Поиск похожей геометрии и преобразование её в блок автоматически.",
    icon: "Search", isNew: true, outputLabel: "Преобразование",
    fields: [{ key: "matches", label: "Найдено совпадений", type: "number", default: "7" }],
    compute: v => [{ label: "Преобразовано в блоки", value: `${v.matches} шт.` }],
  },
  {
    id: "acad-2025-hatch", product: "acad", version: "2025", dir: "docs",
    name: "Улучшенные штриховки", command: "HATCH",
    desc: "Ускоренная генерация и предпросмотр штриховок на сложных контурах.",
    icon: "Grid3x3", outputLabel: "Штриховка",
    fields: [
      { key: "pattern", label: "Образец", type: "select", default: "ANSI31", options: ["ANSI31", "SOLID", "GRAVEL", "AR-CONC"] },
      { key: "scale", label: "Масштаб", type: "number", default: "1.0" },
    ],
    compute: v => [{ label: "Штриховка", value: `${v.pattern}, м=${v.scale}` }],
  },

  // ═══════════════ AutoCAD 2026 ═══════════════
  {
    id: "acad-2026-smarter", product: "acad", version: "2026", dir: "docs",
    name: "Smart Blocks: Object Detection", command: "OBJECTDETECT",
    desc: "ИИ распознаёт повторяющиеся объекты чертежа и предлагает их как блоки.",
    icon: "ScanSearch", isNew: true, outputLabel: "Распознавание",
    fields: [{ key: "found", label: "Кластеров найдено", type: "number", default: "5" }],
    compute: v => [{ label: "Кандидатов в блоки", value: `${v.found}` }],
  },
  {
    id: "acad-2026-markup", product: "acad", version: "2026", dir: "docs",
    name: "Markup Import & Assist v2", command: "MARKUPASSIST",
    desc: "Улучшенное распознавание рукописной разметки и авто-применение правок.",
    icon: "PenTool", isNew: true, outputLabel: "Разметка",
    fields: [{ key: "auto", label: "Авто-применить", type: "toggle", default: "on" }],
    compute: v => [{ label: "Режим", value: v.auto === "on" ? "Авто-применение правок" : "Ручной обзор" }],
  },
  {
    id: "acad-2026-perf", product: "acad", version: "2026", dir: "management",
    name: "Ускорение открытия файлов", command: "OPEN",
    desc: "Многопоточное открытие и регенерация больших DWG-файлов.",
    icon: "Gauge", isNew: true, outputLabel: "Скорость",
    fields: [{ key: "mb", label: "Размер файла, МБ", type: "number", default: "180" }],
    compute: v => [{ label: "Время открытия", value: `~${Math.max(1, Math.round(num(v.mb) / 60))} с` }],
  },

  // ═══════════════ AutoCAD 2027 ═══════════════
  {
    id: "acad-2027-ai-layout", product: "acad", version: "2027", dir: "docs",
    name: "AI Auto-Layout листов", command: "AILAYOUT",
    desc: "Автоматическая компоновка видовых экранов и рамок по содержимому модели.",
    icon: "LayoutTemplate", isNew: true, outputLabel: "Компоновка",
    fields: [{ key: "sheets", label: "Листов сгенерировать", type: "number", default: "8" }],
    compute: v => [{ label: "Скомпоновано", value: `${v.sheets} листов` }],
  },
  {
    id: "acad-2027-cloudsync", product: "acad", version: "2027", dir: "management",
    name: "Realtime Cloud Co-editing", command: "COEDIT",
    desc: "Совместное редактирование одного DWG в реальном времени несколькими пользователями.",
    icon: "Users", isNew: true, outputLabel: "Соредактирование",
    fields: [{ key: "users", label: "Участников", type: "number", default: "4" }],
    compute: v => [{ label: "Сессия", value: `${v.users} участников онлайн` }],
  },
  {
    id: "acad-2027-genai", product: "acad", version: "2027", dir: "docs",
    name: "Generative Detailing", command: "GENDETAIL",
    desc: "Генеративное создание узлов и деталировки по текстовому запросу.",
    icon: "Sparkles", isNew: true, outputLabel: "Генерация",
    fields: [{ key: "prompt", label: "Запрос", type: "text", default: "Узел примыкания кровли" }],
    compute: v => [{ label: "Сгенерировано", value: v.prompt }],
  },

  // ═══════════════ Civil 3D 2022 ═══════════════
  {
    id: "civil-2022-pressure", product: "civil", version: "2022", dir: "networks",
    name: "Динамические напорные сети", command: "CREATEPRESSURENETWORK",
    desc: "Напорные трубопроводы с динамической связью с профилем и планом.",
    icon: "Waves", outputLabel: "Напорная сеть",
    fields: [
      { key: "d", label: "Диаметр", type: "number", default: "315", suffix: "мм" },
      { key: "l", label: "Длина", type: "number", default: "420", suffix: "м" },
      { key: "q", label: "Расход", type: "number", default: "35", suffix: "л/с" },
    ],
    compute: v => {
      const a = Math.PI * Math.pow(num(v.d) / 2000, 2)
      const speed = a > 0 ? num(v.q) / 1000 / a : 0
      return [{ label: "Скорость потока", value: `${speed.toFixed(2)} м/с` }, { label: "Объём трубы", value: `${(a * num(v.l) * 1000).toFixed(1)} л` }]
    },
  },
  {
    id: "civil-2022-corridor-clip", product: "civil", version: "2022", dir: "infra",
    name: "Corridor: клиппинг областей", command: "CORRIDORREGION",
    desc: "Обрезка и исключение областей коридора для сложных развязок.",
    icon: "Scissors", outputLabel: "Область коридора",
    fields: [{ key: "from", label: "ПК начало", type: "number", default: "0" }, { key: "to", label: "ПК конец", type: "number", default: "150" }],
    compute: v => [{ label: "Длина области", value: `${num(v.to) - num(v.from)} м` }],
  },
  {
    id: "civil-2022-relative", product: "civil", version: "2022", dir: "survey",
    name: "Relative-to-surface аннотации", command: "ADDSURFACELABEL",
    desc: "Метки высот относительно поверхности сравнения в профилях.",
    icon: "Tag", outputLabel: "Аннотация",
    fields: [{ key: "sta", label: "Пикет", type: "number", default: "75" }, { key: "elev", label: "Отметка", type: "number", default: "142.5" }],
    compute: v => [{ label: `ПК ${v.sta}`, value: `${v.elev} м` }],
  },

  // ═══════════════ Civil 3D 2023 ═══════════════
  {
    id: "civil-2023-corridor-extract", product: "civil", version: "2023", dir: "infra",
    name: "Извлечение элементов коридора", command: "CORRIDOREXTRACT",
    desc: "Извлечение линков, точек и фигур коридора как самостоятельных объектов.",
    icon: "Layers", isNew: true, outputLabel: "Извлечение",
    fields: [
      { key: "type", label: "Что извлечь", type: "select", default: "Feature Lines", options: ["Feature Lines", "Точки COGO", "Grading", "3D-полилинии"] },
      { key: "n", label: "Элементов", type: "number", default: "24" },
    ],
    compute: v => [{ label: `Извлечено (${v.type})`, value: `${v.n} шт.` }],
  },
  {
    id: "civil-2023-property-sets", product: "civil", version: "2023", dir: "bim",
    name: "Наборы свойств (Property Sets)", command: "PROPERTYSETS",
    desc: "Присвоение BIM-атрибутов объектам Civil для экспорта в IFC.",
    icon: "ListTree", isNew: true, outputLabel: "Атрибуты",
    fields: [{ key: "set", label: "Набор свойств", type: "text", default: "Дорога_IFC" }, { key: "props", label: "Кол-во свойств", type: "number", default: "8" }],
    compute: v => [{ label: `«${v.set}»`, value: `${v.props} свойств` }],
  },
  {
    id: "civil-2023-offset-profile", product: "civil", version: "2023", dir: "infra",
    name: "Профили смещения (Offset Profiles)", command: "OFFSETPROFILE",
    desc: "Автоматическое создание профилей по линиям смещения от оси.",
    icon: "Spline", isNew: true, outputLabel: "Профиль смещения",
    fields: [{ key: "offset", label: "Смещение", type: "number", default: "3.5", suffix: "м" }],
    compute: v => [{ label: "Создан профиль", value: `смещение ${v.offset} м` }],
  },

  // ═══════════════ Civil 3D 2024 ═══════════════
  {
    id: "civil-2024-grading-opt", product: "civil", version: "2024", dir: "survey",
    name: "Оптимизация вертикальной планировки", command: "GRADINGOPTIMIZATION",
    desc: "ИИ-оптимизация Grading для баланса выемки/насыпи с учётом ограничений.",
    icon: "Mountain", isNew: true, outputLabel: "Баланс земмасс",
    fields: [
      { key: "cut", label: "Выемка", type: "number", default: "3200", suffix: "м³" },
      { key: "fill", label: "Насыпь", type: "number", default: "2800", suffix: "м³" },
    ],
    compute: v => [{ label: "Дисбаланс", value: `${num(v.cut) - num(v.fill)} м³` }, { label: "Оптимизация", value: `${Math.round(Math.abs(num(v.cut) - num(v.fill)) / Math.max(1, num(v.cut)) * 100)}% к вывозу` }],
  },
  {
    id: "civil-2024-corridor-transition", product: "civil", version: "2024", dir: "infra",
    name: "Плавные переходы коридора", command: "CORRIDORTRANSITION",
    desc: "Управление переходами сборок между областями коридора.",
    icon: "GitMerge", isNew: true, outputLabel: "Переход",
    fields: [{ key: "len", label: "Длина перехода", type: "number", default: "25", suffix: "м" }],
    compute: v => [{ label: "Переход создан", value: `${v.len} м` }],
  },
  {
    id: "civil-2024-pressure-parts", product: "civil", version: "2024", dir: "networks",
    name: "Расширенный каталог напорных частей", command: "PRESSUREPARTS",
    desc: "Новые фитинги, задвижки и отводы для напорных сетей.",
    icon: "Wrench", isNew: true, outputLabel: "Каталог",
    fields: [{ key: "part", label: "Деталь", type: "select", default: "Отвод 45°", options: ["Отвод 45°", "Отвод 90°", "Тройник", "Задвижка", "Переходник"] }],
    compute: v => [{ label: "Добавлено", value: v.part }],
  },

  // ═══════════════ Civil 3D 2025 ═══════════════
  {
    id: "civil-2025-profile-view-plus", product: "civil", version: "2025", dir: "infra",
    name: "Profile View+ (улучшенный вид профиля)", command: "PROFILEVIEWPLUS",
    desc: "Переработанные виды профиля: сетки, полосы данных, стилизация.",
    icon: "AreaChart", isNew: true, outputLabel: "Вид профиля",
    fields: [
      { key: "vexag", label: "Вертикальный масштаб", type: "number", default: "10" },
      { key: "sta0", label: "ПК начало", type: "number", default: "0" },
      { key: "sta1", label: "ПК конец", type: "number", default: "500" },
    ],
    compute: v => [{ label: "Длина вида", value: `${num(v.sta1) - num(v.sta0)} м` }, { label: "Верт. увеличение", value: `${v.vexag}×` }],
  },
  {
    id: "civil-2025-model-viewer", product: "civil", version: "2025", dir: "bim",
    name: "3D-просмотрщик модели", command: "MODELVIEWER",
    desc: "Быстрый 3D-просмотр коридоров, поверхностей и сетей без экспорта.",
    icon: "Box", isNew: true, outputLabel: "3D-модель",
    fields: [{ key: "layers", label: "Слоёв модели", type: "number", default: "12" }],
    compute: v => [{ label: "Модель собрана", value: `${v.layers} слоёв` }],
  },
  {
    id: "civil-2025-coord-transform", product: "civil", version: "2025", dir: "survey",
    name: "Трансформация координат", command: "COORDTRANSFORM",
    desc: "Пересчёт между СК (МСК, WGS84, UTM, СК-42/95) с грид-сдвигами.",
    icon: "Globe", isNew: true, outputLabel: "Пересчёт координат",
    fields: [
      { key: "x", label: "X (исходная)", type: "number", default: "6234512.34" },
      { key: "y", label: "Y (исходная)", type: "number", default: "534123.87" },
      { key: "to", label: "Целевая СК", type: "select", default: "WGS84", options: ["WGS84", "UTM 37N", "МСК-50", "СК-42"] },
    ],
    compute: v => [{ label: `→ ${v.to}`, value: `X=${(num(v.x) + 12.5).toFixed(2)} Y=${(num(v.y) - 7.3).toFixed(2)}` }],
  },

  // ═══════════════ Civil 3D 2026 ═══════════════
  {
    id: "civil-2026-drainage", product: "civil", version: "2026", dir: "networks",
    name: "Проектирование дренажа (Drainage Design)", command: "DRAINAGEDESIGN",
    desc: "Расчёт и трассировка ливневых сетей по методу рационального стока.",
    icon: "Droplets", isNew: true, outputLabel: "Дренаж",
    fields: [
      { key: "area", label: "Площадь водосбора", type: "number", default: "1.2", suffix: "га" },
      { key: "c", label: "Коэф. стока C", type: "number", default: "0.65" },
      { key: "i", label: "Интенсивность", type: "number", default: "80", suffix: "л/с·га" },
    ],
    compute: v => [{ label: "Расчётный расход Q", value: `${(num(v.c) * num(v.i) * num(v.area)).toFixed(1)} л/с` }],
  },
  {
    id: "civil-2026-surface-aoi", product: "civil", version: "2026", dir: "survey",
    name: "Поверхность по области интереса (AOI)", command: "SURFACEAOI",
    desc: "Генерация поверхности только внутри заданной области для скорости.",
    icon: "Crop", isNew: true, outputLabel: "Поверхность AOI",
    fields: [{ key: "area", label: "Площадь области", type: "number", default: "4.5", suffix: "га" }, { key: "pts", label: "Точек", type: "number", default: "18000" }],
    compute: v => [{ label: "Треугольников TIN", value: `~${Math.round(num(v.pts) * 1.9)}` }],
  },
  {
    id: "civil-2026-corridor-solids", product: "civil", version: "2026", dir: "bim",
    name: "Твёрдотельные коридоры (Solids)", command: "CORRIDORSOLIDS",
    desc: "Экспорт коридора как 3D-solids для BIM-координации и IFC.",
    icon: "Boxes", isNew: true, outputLabel: "3D-тела",
    fields: [{ key: "codes", label: "Кодов формы", type: "number", default: "9" }],
    compute: v => [{ label: "Создано тел", value: `${v.codes}` }],
  },

  // ═══════════════ Civil 3D 2027 ═══════════════
  {
    id: "civil-2027-ai-corridor", product: "civil", version: "2027", dir: "infra",
    name: "AI Corridor Assistant", command: "AICORRIDOR",
    desc: "Генеративный подбор сборок и параметров коридора по нормативам.",
    icon: "Bot", isNew: true, outputLabel: "ИИ-коридор",
    fields: [
      { key: "cat", label: "Категория дороги", type: "select", default: "II", options: ["I", "II", "III", "IV", "V"] },
      { key: "speed", label: "Расч. скорость", type: "number", default: "100", suffix: "км/ч" },
    ],
    compute: v => [{ label: "Предложена сборка", value: `Категория ${v.cat}, ${v.speed} км/ч` }],
  },
  {
    id: "civil-2027-cloud-surface", product: "civil", version: "2027", dir: "survey",
    name: "Cloud Surface Processing", command: "CLOUDSURFACE",
    desc: "Облачная обработка облаков точек в поверхности без нагрузки на ПК.",
    icon: "CloudCog", isNew: true, outputLabel: "Облачная обработка",
    fields: [{ key: "pts", label: "Точек, млн", type: "number", default: "120" }],
    compute: v => [{ label: "Обработано в облаке", value: `${v.pts} млн точек` }],
  },
  {
    id: "civil-2027-digital-twin", product: "civil", version: "2027", dir: "management",
    name: "Digital Twin Sync", command: "TWINSYNC",
    desc: "Синхронизация проекта с цифровым двойником и данными IoT-датчиков.",
    icon: "RefreshCw", isNew: true, outputLabel: "Цифровой двойник",
    fields: [{ key: "sensors", label: "Датчиков", type: "number", default: "36" }],
    compute: v => [{ label: "Синхронизировано", value: `${v.sensors} источников данных` }],
  },
  {
    id: "civil-2027-gen-network", product: "civil", version: "2027", dir: "networks",
    name: "Generative Network Routing", command: "GENNETWORK",
    desc: "Генеративная трассировка инженерных сетей с обходом коллизий.",
    icon: "Network", isNew: true, outputLabel: "Трассировка сети",
    fields: [
      { key: "start", label: "Узел старт", type: "text", default: "КНС-1" },
      { key: "end", label: "Узел финиш", type: "text", default: "Выпуск-3" },
    ],
    compute: v => [{ label: "Маршрут построен", value: `${v.start} → ${v.end}` }],
  },

  // ═══════════════ AutoCAD — ЧЕРЧЕНИЕ (2022–2027) ═══════════════
  {
    id: "acad-draw-line", product: "acad", version: "2022", dir: "docs",
    name: "Отрезок (Line)", command: "LINE",
    desc: "Построение отрезков по координатам с расчётом длины и угла.",
    icon: "Minus", outputLabel: "Отрезок",
    fields: [
      { key: "x1", label: "X начала", type: "number", default: "0" },
      { key: "y1", label: "Y начала", type: "number", default: "0" },
      { key: "x2", label: "X конца", type: "number", default: "100" },
      { key: "y2", label: "Y конца", type: "number", default: "50" },
    ],
    compute: v => {
      const dx = num(v.x2) - num(v.x1), dy = num(v.y2) - num(v.y1)
      return [
        { label: "Длина", value: `${Math.hypot(dx, dy).toFixed(3)} мм` },
        { label: "Угол", value: `${((Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360).toFixed(2)}°` },
      ]
    },
  },
  {
    id: "acad-draw-pline", product: "acad", version: "2022", dir: "docs",
    name: "Полилиния (Polyline)", command: "PLINE",
    desc: "Замкнутая полилиния: расчёт периметра и площади по числу вершин.",
    icon: "Spline", outputLabel: "Полилиния",
    fields: [
      { key: "n", label: "Вершин", type: "number", default: "6" },
      { key: "side", label: "Средняя сторона", type: "number", default: "40", suffix: "мм" },
    ],
    compute: v => {
      const n = Math.max(3, num(v.n)), s = num(v.side)
      const area = (n * s * s) / (4 * Math.tan(Math.PI / n))
      return [{ label: "Периметр", value: `${(n * s).toFixed(1)} мм` }, { label: "Площадь", value: `${area.toFixed(1)} мм²` }]
    },
  },
  {
    id: "acad-draw-circle", product: "acad", version: "2022", dir: "docs",
    name: "Круг (Circle)", command: "CIRCLE",
    desc: "Построение окружности с расчётом длины и площади.",
    icon: "Circle", outputLabel: "Круг",
    fields: [{ key: "r", label: "Радиус", type: "number", default: "25", suffix: "мм" }],
    compute: v => {
      const r = num(v.r)
      return [{ label: "Длина окружности", value: `${(2 * Math.PI * r).toFixed(2)} мм` }, { label: "Площадь", value: `${(Math.PI * r * r).toFixed(2)} мм²` }]
    },
  },
  {
    id: "acad-draw-arc", product: "acad", version: "2022", dir: "docs",
    name: "Дуга (Arc)", command: "ARC",
    desc: "Дуга по радиусу и углу: длина дуги и площадь сектора.",
    icon: "Spline", outputLabel: "Дуга",
    fields: [
      { key: "r", label: "Радиус", type: "number", default: "30", suffix: "мм" },
      { key: "ang", label: "Угол", type: "number", default: "90", suffix: "°" },
    ],
    compute: v => {
      const r = num(v.r), a = num(v.ang) * Math.PI / 180
      return [{ label: "Длина дуги", value: `${(r * a).toFixed(2)} мм` }, { label: "Площадь сектора", value: `${(0.5 * r * r * a).toFixed(2)} мм²` }]
    },
  },
  {
    id: "acad-draw-rectangle", product: "acad", version: "2022", dir: "docs",
    name: "Прямоугольник (Rectangle)", command: "RECTANG",
    desc: "Прямоугольник по сторонам: периметр, площадь, диагональ.",
    icon: "Square", outputLabel: "Прямоугольник",
    fields: [
      { key: "w", label: "Ширина", type: "number", default: "120", suffix: "мм" },
      { key: "h", label: "Высота", type: "number", default: "80", suffix: "мм" },
    ],
    compute: v => {
      const w = num(v.w), h = num(v.h)
      return [{ label: "Площадь", value: `${(w * h).toFixed(1)} мм²` }, { label: "Периметр", value: `${(2 * (w + h)).toFixed(1)} мм` }, { label: "Диагональ", value: `${Math.hypot(w, h).toFixed(2)} мм` }]
    },
  },
  {
    id: "acad-draw-polygon", product: "acad", version: "2022", dir: "docs",
    name: "Многоугольник (Polygon)", command: "POLYGON",
    desc: "Правильный многоугольник по вписанной окружности.",
    icon: "Hexagon", outputLabel: "Многоугольник",
    fields: [
      { key: "n", label: "Сторон", type: "number", default: "6" },
      { key: "r", label: "Радиус вписанной", type: "number", default: "50", suffix: "мм" },
    ],
    compute: v => {
      const n = Math.max(3, num(v.n)), r = num(v.r)
      const side = 2 * r * Math.tan(Math.PI / n)
      const area = n * r * side / 2
      return [{ label: "Сторона", value: `${side.toFixed(2)} мм` }, { label: "Площадь", value: `${area.toFixed(1)} мм²` }]
    },
  },
  {
    id: "acad-draw-offset", product: "acad", version: "2023", dir: "docs",
    name: "Подобие (Offset)", command: "OFFSET",
    desc: "Создание параллельной копии на заданном расстоянии.",
    icon: "Copy", outputLabel: "Подобие",
    fields: [
      { key: "dist", label: "Расстояние", type: "number", default: "10", suffix: "мм" },
      { key: "n", label: "Число копий", type: "number", default: "3" },
    ],
    compute: v => [{ label: "Создано копий", value: `${v.n}` }, { label: "Общее смещение", value: `${num(v.dist) * num(v.n)} мм` }],
  },
  {
    id: "acad-draw-array", product: "acad", version: "2023", dir: "docs",
    name: "Массив (Array)", command: "ARRAY",
    desc: "Прямоугольный массив объектов: строки × столбцы.",
    icon: "Grid3x3", outputLabel: "Массив",
    fields: [
      { key: "rows", label: "Строк", type: "number", default: "4" },
      { key: "cols", label: "Столбцов", type: "number", default: "6" },
      { key: "dr", label: "Шаг по строке", type: "number", default: "20", suffix: "мм" },
      { key: "dc", label: "Шаг по столбцу", type: "number", default: "20", suffix: "мм" },
    ],
    compute: v => [
      { label: "Всего копий", value: `${num(v.rows) * num(v.cols)}` },
      { label: "Габарит", value: `${(num(v.cols) - 1) * num(v.dc)} × ${(num(v.rows) - 1) * num(v.dr)} мм` },
    ],
  },
  {
    id: "acad-draw-fillet", product: "acad", version: "2024", dir: "docs",
    name: "Сопряжение (Fillet)", command: "FILLET",
    desc: "Скругление угла дугой заданного радиуса.",
    icon: "Spline", outputLabel: "Сопряжение",
    fields: [{ key: "r", label: "Радиус", type: "number", default: "8", suffix: "мм" }],
    compute: v => [{ label: "Длина дуги (90°)", value: `${(num(v.r) * Math.PI / 2).toFixed(2)} мм` }],
  },
  {
    id: "acad-draw-chamfer", product: "acad", version: "2024", dir: "docs",
    name: "Фаска (Chamfer)", command: "CHAMFER",
    desc: "Снятие фаски по двум катетам.",
    icon: "Scissors", outputLabel: "Фаска",
    fields: [
      { key: "a", label: "Катет 1", type: "number", default: "5", suffix: "мм" },
      { key: "b", label: "Катет 2", type: "number", default: "5", suffix: "мм" },
    ],
    compute: v => [{ label: "Длина фаски", value: `${Math.hypot(num(v.a), num(v.b)).toFixed(2)} мм` }],
  },
  {
    id: "acad-draw-spline", product: "acad", version: "2025", dir: "docs",
    name: "Сплайн (Spline)", command: "SPLINE",
    desc: "Гладкая NURBS-кривая по контрольным точкам.",
    icon: "Spline", outputLabel: "Сплайн",
    fields: [{ key: "pts", label: "Точек", type: "number", default: "8" }],
    compute: v => [{ label: "Сегментов", value: `${Math.max(1, num(v.pts) - 1)}` }, { label: "Степень", value: "3 (кубический)" }],
  },
  {
    id: "acad-draw-region", product: "acad", version: "2026", dir: "docs",
    name: "Область (Region)", command: "REGION",
    desc: "Преобразование замкнутого контура в область для булевых операций.",
    icon: "SquareDashedBottom", outputLabel: "Область",
    fields: [{ key: "loops", label: "Замкнутых контуров", type: "number", default: "2" }],
    compute: v => [{ label: "Создано областей", value: `${v.loops}` }],
  },

  // ═══════════════ AutoCAD — АННОТАЦИИ (2022–2027) ═══════════════
  {
    id: "acad-anno-dimlinear", product: "acad", version: "2022", dir: "docs",
    name: "Линейный размер (Dimlinear)", command: "DIMLINEAR",
    desc: "Линейный размер с округлением до точности и масштабом аннотаций.",
    icon: "Ruler", outputLabel: "Размер",
    fields: [
      { key: "val", label: "Измеренное", type: "number", default: "1247.6", suffix: "мм" },
      { key: "prec", label: "Точность", type: "select", default: "0", options: ["0", "0.0", "0.00", "0.000"] },
    ],
    compute: v => {
      const d = (v.prec.split(".")[1] || "").length
      return [{ label: "Размерное число", value: `${num(v.val).toFixed(d)}` }]
    },
  },
  {
    id: "acad-anno-dimangular", product: "acad", version: "2022", dir: "docs",
    name: "Угловой размер (Dimangular)", command: "DIMANGULAR",
    desc: "Угловой размер между двумя линиями.",
    icon: "Triangle", outputLabel: "Угол",
    fields: [
      { key: "a1", label: "Направление 1", type: "number", default: "0", suffix: "°" },
      { key: "a2", label: "Направление 2", type: "number", default: "63.5", suffix: "°" },
    ],
    compute: v => [{ label: "Угол", value: `${Math.abs(num(v.a2) - num(v.a1)).toFixed(2)}°` }],
  },
  {
    id: "acad-anno-mtext", product: "acad", version: "2023", dir: "docs",
    name: "Многострочный текст (Mtext)", command: "MTEXT",
    desc: "Текстовый блок с расчётом высоты в бумаге под масштаб.",
    icon: "Type", outputLabel: "Текст",
    fields: [
      { key: "h", label: "Высота текста", type: "number", default: "2.5", suffix: "мм" },
      { key: "scale", label: "Масштаб чертежа 1:", type: "number", default: "100" },
    ],
    compute: v => [{ label: "Высота в модели", value: `${(num(v.h) * num(v.scale)).toFixed(1)} мм` }],
  },
  {
    id: "acad-anno-leader", product: "acad", version: "2023", dir: "docs",
    name: "Мультивыноска (Mleader)", command: "MLEADER",
    desc: "Выноска с полкой и текстовым содержимым.",
    icon: "MessageSquare", outputLabel: "Выноска",
    fields: [{ key: "txt", label: "Текст выноски", type: "text", default: "Отм. чистого пола" }],
    compute: v => [{ label: "Выноска создана", value: v.txt }],
  },
  {
    id: "acad-anno-table", product: "acad", version: "2024", dir: "docs",
    name: "Таблица (Table)", command: "TABLE",
    desc: "Таблица данных с расчётом числа ячеек.",
    icon: "Table", outputLabel: "Таблица",
    fields: [
      { key: "rows", label: "Строк", type: "number", default: "10" },
      { key: "cols", label: "Столбцов", type: "number", default: "5" },
    ],
    compute: v => [{ label: "Ячеек", value: `${num(v.rows) * num(v.cols)}` }],
  },
  {
    id: "acad-anno-field", product: "acad", version: "2024", dir: "docs",
    name: "Поле (Field)", command: "FIELD",
    desc: "Динамическое поле, автоматически обновляющее значение.",
    icon: "Braces", outputLabel: "Поле",
    fields: [{ key: "type", label: "Тип поля", type: "select", default: "Площадь", options: ["Площадь", "Периметр", "Дата", "Имя файла", "Автор"] }],
    compute: v => [{ label: "Поле вставлено", value: v.type }],
  },
  {
    id: "acad-anno-dimscale", product: "acad", version: "2025", dir: "docs",
    name: "Аннотативность (Annotative)", command: "OBJECTSCALE",
    desc: "Расчёт видимого размера аннотации при нескольких масштабах.",
    icon: "Scaling", outputLabel: "Масштабы",
    fields: [
      { key: "h", label: "Высота в бумаге", type: "number", default: "3", suffix: "мм" },
      { key: "scale", label: "Масштаб вида 1:", type: "number", default: "50" },
    ],
    compute: v => [{ label: "Размер в модели", value: `${num(v.h) * num(v.scale)} мм` }],
  },
  {
    id: "acad-anno-revcloud", product: "acad", version: "2026", dir: "docs",
    name: "Облако пометок (Revcloud)", command: "REVCLOUD",
    desc: "Облако пометок для указания правок на чертеже.",
    icon: "Cloud", outputLabel: "Облако",
    fields: [{ key: "arc", label: "Длина дуги", type: "number", default: "15", suffix: "мм" }],
    compute: v => [{ label: "Облако создано", value: `дуга ${v.arc} мм` }],
  },
  {
    id: "acad-anno-dimstyle", product: "acad", version: "2027", dir: "docs",
    name: "Стиль размеров (Dimstyle)", command: "DIMSTYLE",
    desc: "Настройка размерного стиля по ГОСТ/ISO.",
    icon: "Settings2", outputLabel: "Стиль",
    fields: [{ key: "std", label: "Стандарт", type: "select", default: "ГОСТ 2.307", options: ["ГОСТ 2.307", "ISO-25", "ANSI", "DIN"] }],
    compute: v => [{ label: "Стиль применён", value: v.std }],
  },

  // ═══════════════ AutoCAD — РЕДАКТИРОВАНИЕ (2022–2027) ═══════════════
  {
    id: "acad-modify-move", product: "acad", version: "2022", dir: "docs",
    name: "Перенос (Move)", command: "MOVE",
    desc: "Перемещение объектов на вектор смещения.",
    icon: "Move", outputLabel: "Перенос",
    fields: [
      { key: "dx", label: "Смещение X", type: "number", default: "50" },
      { key: "dy", label: "Смещение Y", type: "number", default: "-30" },
    ],
    compute: v => [{ label: "Длина вектора", value: `${Math.hypot(num(v.dx), num(v.dy)).toFixed(2)} мм` }, { label: "Угол", value: `${((Math.atan2(num(v.dy), num(v.dx)) * 180 / Math.PI + 360) % 360).toFixed(1)}°` }],
  },
  {
    id: "acad-modify-rotate", product: "acad", version: "2022", dir: "docs",
    name: "Поворот (Rotate)", command: "ROTATE",
    desc: "Поворот объектов вокруг базовой точки на заданный угол.",
    icon: "RotateCw", outputLabel: "Поворот",
    fields: [{ key: "ang", label: "Угол", type: "number", default: "45", suffix: "°" }],
    compute: v => [{ label: "Поворот", value: `${v.ang}° (${(num(v.ang) * Math.PI / 180).toFixed(4)} рад)` }],
  },
  {
    id: "acad-modify-scale", product: "acad", version: "2022", dir: "docs",
    name: "Масштаб (Scale)", command: "SCALE",
    desc: "Масштабирование объектов с расчётом изменения площади.",
    icon: "Scaling", outputLabel: "Масштаб",
    fields: [{ key: "k", label: "Коэффициент", type: "number", default: "1.5" }],
    compute: v => [{ label: "Линейный", value: `${v.k}×` }, { label: "Площадь", value: `${(num(v.k) * num(v.k)).toFixed(2)}×` }],
  },
  {
    id: "acad-modify-mirror", product: "acad", version: "2023", dir: "docs",
    name: "Зеркало (Mirror)", command: "MIRROR",
    desc: "Зеркальное отражение объектов относительно оси.",
    icon: "FlipHorizontal", outputLabel: "Зеркало",
    fields: [{ key: "axis", label: "Ось", type: "select", default: "Вертикальная", options: ["Вертикальная", "Горизонтальная", "Наклонная"] }],
    compute: v => [{ label: "Отражено", value: `относительно оси: ${v.axis}` }],
  },
  {
    id: "acad-modify-trim", product: "acad", version: "2023", dir: "docs",
    name: "Обрезка (Trim)", command: "TRIM",
    desc: "Обрезка объектов по режущим кромкам (быстрый режим).",
    icon: "Scissors", outputLabel: "Обрезка",
    fields: [{ key: "n", label: "Объектов обрезать", type: "number", default: "5" }],
    compute: v => [{ label: "Обрезано", value: `${v.n} объектов` }],
  },
  {
    id: "acad-modify-extend", product: "acad", version: "2024", dir: "docs",
    name: "Удлинение (Extend)", command: "EXTEND",
    desc: "Удлинение объектов до граничных кромок.",
    icon: "MoveHorizontal", outputLabel: "Удлинение",
    fields: [{ key: "d", label: "Удлинение", type: "number", default: "18", suffix: "мм" }],
    compute: v => [{ label: "Удлинено на", value: `${v.d} мм` }],
  },
  {
    id: "acad-modify-stretch", product: "acad", version: "2024", dir: "docs",
    name: "Растяжение (Stretch)", command: "STRETCH",
    desc: "Растяжение части объектов рамкой выбора.",
    icon: "Maximize2", outputLabel: "Растяжение",
    fields: [{ key: "d", label: "Величина", type: "number", default: "25", suffix: "мм" }],
    compute: v => [{ label: "Растянуто", value: `${v.d} мм` }],
  },
  {
    id: "acad-modify-align", product: "acad", version: "2025", dir: "docs",
    name: "Выравнивание (Align)", command: "ALIGN",
    desc: "Совмещение объекта по паре точек с опциональным масштабом.",
    icon: "AlignHorizontalJustifyCenter", outputLabel: "Выравнивание",
    fields: [{ key: "scale", label: "Масштабировать", type: "toggle", default: "off" }],
    compute: v => [{ label: "Режим", value: v.scale === "on" ? "С масштабированием" : "Без масштаба" }],
  },
  {
    id: "acad-modify-explode", product: "acad", version: "2026", dir: "docs",
    name: "Расчленение (Explode)", command: "EXPLODE",
    desc: "Разбиение блоков и полилиний на примитивы.",
    icon: "Split", outputLabel: "Расчленение",
    fields: [{ key: "n", label: "Вершин полилинии", type: "number", default: "8" }],
    compute: v => [{ label: "Получено отрезков", value: `${Math.max(1, num(v.n) - 1)}` }],
  },

  // ═══════════════ AutoCAD — 3D-МОДЕЛИРОВАНИЕ (2022–2027) ═══════════════
  {
    id: "acad-3d-extrude", product: "acad", version: "2022", dir: "bim",
    name: "Выдавливание (Extrude)", command: "EXTRUDE",
    desc: "Создание тела выдавливанием контура на высоту.",
    icon: "Box", outputLabel: "Тело выдавливания",
    fields: [
      { key: "area", label: "Площадь профиля", type: "number", default: "1200", suffix: "мм²" },
      { key: "h", label: "Высота", type: "number", default: "300", suffix: "мм" },
    ],
    compute: v => [{ label: "Объём", value: `${(num(v.area) * num(v.h) / 1000).toFixed(1)} см³` }],
  },
  {
    id: "acad-3d-revolve", product: "acad", version: "2022", dir: "bim",
    name: "Вращение (Revolve)", command: "REVOLVE",
    desc: "Тело вращения профиля вокруг оси (теорема Гульдина).",
    icon: "RefreshCw", outputLabel: "Тело вращения",
    fields: [
      { key: "area", label: "Площадь профиля", type: "number", default: "500", suffix: "мм²" },
      { key: "rc", label: "R центра тяжести", type: "number", default: "40", suffix: "мм" },
      { key: "ang", label: "Угол", type: "number", default: "360", suffix: "°" },
    ],
    compute: v => [{ label: "Объём", value: `${(num(v.area) * 2 * Math.PI * num(v.rc) * (num(v.ang) / 360) / 1000).toFixed(1)} см³` }],
  },
  {
    id: "acad-3d-sweep", product: "acad", version: "2023", dir: "bim",
    name: "Сдвиг по траектории (Sweep)", command: "SWEEP",
    desc: "Тело протягиванием профиля вдоль пути.",
    icon: "Spline", outputLabel: "Тело сдвига",
    fields: [
      { key: "area", label: "Площадь профиля", type: "number", default: "314", suffix: "мм²" },
      { key: "len", label: "Длина пути", type: "number", default: "1500", suffix: "мм" },
    ],
    compute: v => [{ label: "Объём", value: `${(num(v.area) * num(v.len) / 1000).toFixed(1)} см³` }],
  },
  {
    id: "acad-3d-loft", product: "acad", version: "2023", dir: "bim",
    name: "По сечениям (Loft)", command: "LOFT",
    desc: "Тело по набору поперечных сечений.",
    icon: "Layers", outputLabel: "Тело по сечениям",
    fields: [{ key: "sections", label: "Сечений", type: "number", default: "4" }],
    compute: v => [{ label: "Переходов", value: `${Math.max(1, num(v.sections) - 1)}` }],
  },
  {
    id: "acad-3d-union", product: "acad", version: "2024", dir: "bim",
    name: "Объединение (Union)", command: "UNION",
    desc: "Булево объединение тел.",
    icon: "Combine", outputLabel: "Объединение",
    fields: [
      { key: "v1", label: "Объём тела 1", type: "number", default: "1200", suffix: "см³" },
      { key: "v2", label: "Объём тела 2", type: "number", default: "800", suffix: "см³" },
      { key: "overlap", label: "Пересечение", type: "number", default: "150", suffix: "см³" },
    ],
    compute: v => [{ label: "Итоговый объём", value: `${(num(v.v1) + num(v.v2) - num(v.overlap)).toFixed(0)} см³` }],
  },
  {
    id: "acad-3d-subtract", product: "acad", version: "2024", dir: "bim",
    name: "Вычитание (Subtract)", command: "SUBTRACT",
    desc: "Булево вычитание одного тела из другого.",
    icon: "Minus", outputLabel: "Вычитание",
    fields: [
      { key: "v1", label: "Объём основы", type: "number", default: "2000", suffix: "см³" },
      { key: "v2", label: "Объём выреза", type: "number", default: "450", suffix: "см³" },
    ],
    compute: v => [{ label: "Итоговый объём", value: `${Math.max(0, num(v.v1) - num(v.v2)).toFixed(0)} см³` }],
  },
  {
    id: "acad-3d-intersect", product: "acad", version: "2025", dir: "bim",
    name: "Пересечение (Intersect)", command: "INTERSECT",
    desc: "Оставить только общий объём тел.",
    icon: "SquaresIntersect", outputLabel: "Пересечение",
    fields: [{ key: "overlap", label: "Общий объём", type: "number", default: "320", suffix: "см³" }],
    compute: v => [{ label: "Результат", value: `${v.overlap} см³` }],
  },
  {
    id: "acad-3d-mesh", product: "acad", version: "2026", dir: "bim",
    name: "Сеть (Mesh)", command: "MESH",
    desc: "Полигональная сеть со сглаживанием.",
    icon: "Grid3x3", outputLabel: "Сеть",
    fields: [
      { key: "u", label: "Разбиений U", type: "number", default: "12" },
      { key: "w", label: "Разбиений V", type: "number", default: "12" },
    ],
    compute: v => [{ label: "Граней", value: `${num(v.u) * num(v.w)}` }],
  },
  {
    id: "acad-3d-render", product: "acad", version: "2027", dir: "bim",
    name: "Визуализация (Render)", command: "RENDER",
    desc: "Фотореалистичная визуализация сцены.",
    icon: "Image", isNew: true, outputLabel: "Рендер",
    fields: [
      { key: "w", label: "Ширина", type: "number", default: "1920", suffix: "px" },
      { key: "h", label: "Высота", type: "number", default: "1080", suffix: "px" },
      { key: "q", label: "Качество", type: "select", default: "Высокое", options: ["Черновик", "Среднее", "Высокое", "Presentation"] },
    ],
    compute: v => [{ label: "Разрешение", value: `${num(v.w)}×${num(v.h)} (${(num(v.w) * num(v.h) / 1e6).toFixed(1)} Мпикс)` }, { label: "Качество", value: v.q }],
  },

  // ═══════════════ AutoCAD — СЛОИ И СВОЙСТВА (2022–2027) ═══════════════
  {
    id: "acad-layer-new", product: "acad", version: "2022", dir: "docs",
    name: "Диспетчер слоёв (Layer)", command: "LAYER",
    desc: "Создание и настройка слоёв: цвет, тип линии, вес, печать.",
    icon: "Layers3", outputLabel: "Слой",
    fields: [
      { key: "name", label: "Имя слоя", type: "text", default: "Оси" },
      { key: "color", label: "Цвет", type: "select", default: "Красный", options: ["Красный", "Жёлтый", "Зелёный", "Голубой", "Синий", "Белый"] },
      { key: "lw", label: "Вес линии", type: "select", default: "0.25", options: ["0.13", "0.18", "0.25", "0.35", "0.50", "0.70"] },
    ],
    compute: v => [{ label: `Слой «${v.name}»`, value: `${v.color}, ${v.lw} мм` }],
  },
  {
    id: "acad-layer-iso", product: "acad", version: "2022", dir: "docs",
    name: "Изоляция слоёв (Layiso)", command: "LAYISO",
    desc: "Изоляция выбранных слоёв, остальные затемняются или гасятся.",
    icon: "EyeOff", outputLabel: "Изоляция",
    fields: [{ key: "n", label: "Слоёв изолировать", type: "number", default: "3" }],
    compute: v => [{ label: "Изолировано", value: `${v.n} слоёв` }],
  },
  {
    id: "acad-layer-merge", product: "acad", version: "2023", dir: "docs",
    name: "Объединение слоёв (Laymrg)", command: "LAYMRG",
    desc: "Перенос объектов из одних слоёв в другой и удаление пустых.",
    icon: "Combine", outputLabel: "Объединение слоёв",
    fields: [
      { key: "from", label: "Из слоёв", type: "number", default: "4" },
      { key: "to", label: "В слой", type: "text", default: "Основной" },
    ],
    compute: v => [{ label: "Объединено", value: `${v.from} → «${v.to}»` }],
  },
  {
    id: "acad-layer-state", product: "acad", version: "2024", dir: "docs",
    name: "Состояния слоёв (LayerState)", command: "LAYERSTATE",
    desc: "Сохранение и восстановление наборов видимости/свойств слоёв.",
    icon: "Save", outputLabel: "Состояние слоёв",
    fields: [{ key: "name", label: "Имя состояния", type: "text", default: "Печать_План" }],
    compute: v => [{ label: "Состояние сохранено", value: v.name }],
  },
  {
    id: "acad-layer-freeze-vp", product: "acad", version: "2025", dir: "docs",
    name: "Замораживание в ВЭ (VPFreeze)", command: "VPLAYER",
    desc: "Управление видимостью слоёв по видовым экранам листа.",
    icon: "Snowflake", outputLabel: "Слои в ВЭ",
    fields: [{ key: "n", label: "Заморозить слоёв", type: "number", default: "2" }],
    compute: v => [{ label: "В видовом экране", value: `скрыто ${v.n} слоёв` }],
  },
  {
    id: "acad-layer-transparency", product: "acad", version: "2026", dir: "docs",
    name: "Прозрачность слоя", command: "LAYER",
    desc: "Настройка прозрачности слоя для подложек и заливок.",
    icon: "Blend", outputLabel: "Прозрачность",
    fields: [{ key: "t", label: "Прозрачность", type: "number", default: "40", suffix: "%" }],
    compute: v => [{ label: "Непрозрачность", value: `${100 - num(v.t)}%` }],
  },

  // ═══════════════ AutoCAD — БЛОКИ И АТРИБУТЫ (2022–2027) ═══════════════
  {
    id: "acad-block-define", product: "acad", version: "2022", dir: "docs",
    name: "Создание блока (Block)", command: "BLOCK",
    desc: "Определение блока из выбранных объектов с базовой точкой.",
    icon: "Boxes", outputLabel: "Блок",
    fields: [
      { key: "name", label: "Имя блока", type: "text", default: "ДВЕРЬ_900" },
      { key: "objs", label: "Объектов", type: "number", default: "6" },
    ],
    compute: v => [{ label: `Блок «${v.name}»`, value: `из ${v.objs} объектов` }],
  },
  {
    id: "acad-block-insert", product: "acad", version: "2022", dir: "docs",
    name: "Вставка блока (Insert)", command: "INSERT",
    desc: "Вставка блока с масштабом и поворотом.",
    icon: "PackagePlus", outputLabel: "Вставка",
    fields: [
      { key: "sx", label: "Масштаб", type: "number", default: "1" },
      { key: "rot", label: "Поворот", type: "number", default: "0", suffix: "°" },
    ],
    compute: v => [{ label: "Вставлен", value: `м=${v.sx}, поворот ${v.rot}°` }],
  },
  {
    id: "acad-block-attdef", product: "acad", version: "2023", dir: "docs",
    name: "Атрибут блока (Attdef)", command: "ATTDEF",
    desc: "Добавление текстового атрибута в определение блока.",
    icon: "Tag", outputLabel: "Атрибут",
    fields: [
      { key: "tag", label: "Тег", type: "text", default: "МАРКА" },
      { key: "val", label: "Значение по умолч.", type: "text", default: "М1" },
    ],
    compute: v => [{ label: `Атрибут ${v.tag}`, value: v.val }],
  },
  {
    id: "acad-block-attext", product: "acad", version: "2024", dir: "docs",
    name: "Извлечение атрибутов (Dataextraction)", command: "DATAEXTRACTION",
    desc: "Экспорт атрибутов блоков в таблицу или CSV/XLS.",
    icon: "TableProperties", outputLabel: "Извлечение",
    fields: [
      { key: "blocks", label: "Блоков", type: "number", default: "120" },
      { key: "attrs", label: "Атрибутов на блок", type: "number", default: "4" },
    ],
    compute: v => [{ label: "Строк в таблице", value: `${v.blocks}` }, { label: "Ячеек данных", value: `${num(v.blocks) * num(v.attrs)}` }],
  },
  {
    id: "acad-block-dynamic", product: "acad", version: "2025", dir: "docs",
    name: "Динамический блок (BEdit)", command: "BEDIT",
    desc: "Параметры и операции: растяжение, массив, поворот, видимость.",
    icon: "SlidersHorizontal", outputLabel: "Динамический блок",
    fields: [{ key: "states", label: "Состояний видимости", type: "number", default: "3" }],
    compute: v => [{ label: "Вариантов блока", value: `${v.states}` }],
  },
  {
    id: "acad-block-battman", product: "acad", version: "2026", dir: "docs",
    name: "Диспетчер атрибутов (Battman)", command: "BATTMAN",
    desc: "Массовое редактирование атрибутов существующих блоков.",
    icon: "Settings2", outputLabel: "Атрибуты",
    fields: [{ key: "n", label: "Блоков обновить", type: "number", default: "48" }],
    compute: v => [{ label: "Обновлено", value: `${v.n} блоков` }],
  },
  {
    id: "acad-block-wblock", product: "acad", version: "2027", dir: "docs",
    name: "Запись блока в файл (Wblock)", command: "WBLOCK",
    desc: "Экспорт блока в отдельный DWG-файл для библиотеки.",
    icon: "FileOutput", outputLabel: "Экспорт блока",
    fields: [{ key: "name", label: "Имя файла", type: "text", default: "Дверь_900.dwg" }],
    compute: v => [{ label: "Сохранён файл", value: v.name }],
  },

  // ═══════════════ AutoCAD — ВНЕШНИЕ ССЫЛКИ (Xref) (2022–2027) ═══════════════
  {
    id: "acad-xref-attach", product: "acad", version: "2022", dir: "docs",
    name: "Присоединение Xref (Attach)", command: "XATTACH",
    desc: "Присоединение внешнего DWG как ссылки с масштабом и путём.",
    icon: "Link2", outputLabel: "Внешняя ссылка",
    fields: [
      { key: "file", label: "Файл", type: "text", default: "Генплан.dwg" },
      { key: "type", label: "Тип", type: "select", default: "Наложение", options: ["Наложение", "Вставка"] },
    ],
    compute: v => [{ label: `Присоединён ${v.file}`, value: v.type }],
  },
  {
    id: "acad-xref-clip", product: "acad", version: "2023", dir: "docs",
    name: "Подрезка Xref (Clip)", command: "XCLIP",
    desc: "Обрезка отображаемой области внешней ссылки контуром.",
    icon: "Crop", outputLabel: "Подрезка",
    fields: [{ key: "shape", label: "Контур", type: "select", default: "Прямоугольник", options: ["Прямоугольник", "Полилиния"] }],
    compute: v => [{ label: "Подрезка", value: v.shape }],
  },
  {
    id: "acad-xref-manager", product: "acad", version: "2024", dir: "docs",
    name: "Диспетчер ссылок (XrefMgr)", command: "EXTERNALREFERENCES",
    desc: "Управление всеми внешними ссылками: обновление, отсоединение, пути.",
    icon: "FolderTree", outputLabel: "Диспетчер ссылок",
    fields: [
      { key: "attached", label: "Присоединено", type: "number", default: "5" },
      { key: "missing", label: "Не найдено", type: "number", default: "1" },
    ],
    compute: v => [{ label: "Активных ссылок", value: `${Math.max(0, num(v.attached) - num(v.missing))} из ${v.attached}` }],
  },
  {
    id: "acad-xref-underlay", product: "acad", version: "2025", dir: "docs",
    name: "Подложка PDF/DGN (Underlay)", command: "PDFATTACH",
    desc: "Подключение PDF, DGN, DWF или изображения как подложки.",
    icon: "FileImage", outputLabel: "Подложка",
    fields: [{ key: "type", label: "Тип подложки", type: "select", default: "PDF", options: ["PDF", "DGN", "DWF", "Изображение"] }],
    compute: v => [{ label: "Подложка подключена", value: v.type }],
  },
  {
    id: "acad-xref-bind", product: "acad", version: "2026", dir: "docs",
    name: "Внедрение Xref (Bind)", command: "XBIND",
    desc: "Внедрение внешней ссылки в чертёж как блока.",
    icon: "PackageCheck", outputLabel: "Внедрение",
    fields: [{ key: "file", label: "Ссылка", type: "text", default: "Сети_ВК.dwg" }],
    compute: v => [{ label: "Внедрено в чертёж", value: v.file }],
  },
  {
    id: "acad-xref-compare", product: "acad", version: "2027", dir: "docs",
    name: "Сравнение Xref (XCompare)", command: "XREFCOMPARE",
    desc: "Подсветка изменений между версиями внешней ссылки.",
    icon: "GitCompare", isNew: true, outputLabel: "Сравнение",
    fields: [{ key: "changes", label: "Изменений найдено", type: "number", default: "14" }],
    compute: v => [{ label: "Различий", value: `${v.changes}` }],
  },

  // ═══════════════ AutoCAD — ПЕЧАТЬ И ПУБЛИКАЦИЯ (2022–2027) ═══════════════
  {
    id: "acad-plot-layout", product: "acad", version: "2022", dir: "docs",
    name: "Компоновка листа (Layout)", command: "LAYOUT",
    desc: "Создание листа с рамкой и основной надписью под формат.",
    icon: "LayoutTemplate", outputLabel: "Лист",
    fields: [
      { key: "fmt", label: "Формат", type: "select", default: "A1", options: ["A0", "A1", "A2", "A3", "A4"] },
      { key: "orient", label: "Ориентация", type: "select", default: "Альбомная", options: ["Альбомная", "Книжная"] },
    ],
    compute: v => {
      const sizes: Record<string, [number, number]> = { A0: [841, 1189], A1: [594, 841], A2: [420, 594], A3: [297, 420], A4: [210, 297] }
      const [a, b] = sizes[v.fmt] || [594, 841]
      const [w, h] = v.orient === "Альбомная" ? [Math.max(a, b), Math.min(a, b)] : [Math.min(a, b), Math.max(a, b)]
      return [{ label: "Размер листа", value: `${w}×${h} мм` }]
    },
  },
  {
    id: "acad-plot-vport", product: "acad", version: "2022", dir: "docs",
    name: "Видовой экран (MView)", command: "MVIEW",
    desc: "Видовой экран на листе с расчётом масштаба вида.",
    icon: "SquareDashed", outputLabel: "Видовой экран",
    fields: [
      { key: "model", label: "Размер в модели", type: "number", default: "50000", suffix: "мм" },
      { key: "paper", label: "Размер на листе", type: "number", default: "500", suffix: "мм" },
    ],
    compute: v => {
      const s = num(v.model) / Math.max(1, num(v.paper))
      return [{ label: "Масштаб", value: `1:${Math.round(s)}` }]
    },
  },
  {
    id: "acad-plot-pagesetup", product: "acad", version: "2023", dir: "docs",
    name: "Параметры листа (PageSetup)", command: "PAGESETUP",
    desc: "Настройка устройства печати, формата и стиля печати листа.",
    icon: "Settings2", outputLabel: "Параметры печати",
    fields: [
      { key: "device", label: "Устройство", type: "select", default: "DWG To PDF.pc3", options: ["DWG To PDF.pc3", "PublishToWeb JPG.pc3", "Плоттер HP T1700", "Системный принтер"] },
      { key: "ctb", label: "Стиль печати", type: "select", default: "monochrome.ctb", options: ["monochrome.ctb", "acad.ctb", "Grayscale.ctb", "GOST.stb"] },
    ],
    compute: v => [{ label: "Устройство", value: v.device }, { label: "Стиль", value: v.ctb }],
  },
  {
    id: "acad-plot-print", product: "acad", version: "2023", dir: "docs",
    name: "Печать (Plot)", command: "PLOT",
    desc: "Вывод листа на печать/PDF с областью и масштабом.",
    icon: "Printer", outputLabel: "Печать",
    fields: [
      { key: "area", label: "Область", type: "select", default: "Лист", options: ["Лист", "Экран", "Рамка", "Границы"] },
      { key: "scale", label: "Масштаб печати", type: "select", default: "1:1", options: ["1:1", "1:2", "1:5", "1:10", "Вписать"] },
    ],
    compute: v => [{ label: "Печать области", value: `${v.area}, ${v.scale}` }],
  },
  {
    id: "acad-plot-pdf", product: "acad", version: "2024", dir: "docs",
    name: "Экспорт в PDF (ExportPDF)", command: "EXPORTPDF",
    desc: "Умный PDF со слоями, поиском текста и гиперссылками.",
    icon: "FileText", outputLabel: "PDF",
    fields: [
      { key: "sheets", label: "Листов", type: "number", default: "12" },
      { key: "dpi", label: "Разрешение", type: "select", default: "600", options: ["150", "300", "600", "1200"] },
      { key: "layers", label: "Слои в PDF", type: "toggle", default: "on" },
    ],
    compute: v => [{ label: "Создан PDF", value: `${v.sheets} стр., ${v.dpi} dpi` }, { label: "Слои", value: v.layers === "on" ? "включены" : "сведены" }],
  },
  {
    id: "acad-plot-dwf", product: "acad", version: "2024", dir: "docs",
    name: "Экспорт в DWF (ExportDWF)", command: "EXPORTDWF",
    desc: "Компактный DWF/DWFx для рассылки и просмотра.",
    icon: "FileOutput", outputLabel: "DWF",
    fields: [{ key: "type", label: "Формат", type: "select", default: "DWFx", options: ["DWF", "DWFx", "DWF (сжатый)"] }],
    compute: v => [{ label: "Экспортировано", value: v.type }],
  },
  {
    id: "acad-plot-sheetset", product: "acad", version: "2025", dir: "docs",
    name: "Подшивка листов (SheetSet)", command: "SHEETSET",
    desc: "Управление комплектом листов проекта, автонумерация и штампы.",
    icon: "Files", outputLabel: "Подшивка",
    fields: [
      { key: "sheets", label: "Листов в комплекте", type: "number", default: "34" },
      { key: "start", label: "Начальный №", type: "number", default: "1" },
    ],
    compute: v => [{ label: "Диапазон листов", value: `№${v.start}…${num(v.start) + num(v.sheets) - 1}` }],
  },
  {
    id: "acad-plot-batch", product: "acad", version: "2025", dir: "docs",
    name: "Пакетная печать (Publish)", command: "PUBLISH",
    desc: "Печать всей подшивки в один PDF или на плоттер пакетом.",
    icon: "Layers", outputLabel: "Пакетная печать",
    fields: [
      { key: "sheets", label: "Листов", type: "number", default: "34" },
      { key: "sec", label: "Время на лист", type: "number", default: "4", suffix: "с" },
    ],
    compute: v => [{ label: "Оценка времени", value: `~${Math.ceil(num(v.sheets) * num(v.sec) / 60)} мин` }],
  },
  {
    id: "acad-plot-transmittal", product: "acad", version: "2026", dir: "docs",
    name: "Комплект передачи (eTransmit)", command: "ETRANSMIT",
    desc: "Сбор чертежа со всеми ссылками, шрифтами и стилями в архив.",
    icon: "Package", outputLabel: "Комплект",
    fields: [
      { key: "xrefs", label: "Внешних ссылок", type: "number", default: "6" },
      { key: "fonts", label: "Шрифтов SHX", type: "number", default: "3" },
    ],
    compute: v => [{ label: "Файлов в архиве", value: `${1 + num(v.xrefs) + num(v.fonts)}` }],
  },
  {
    id: "acad-plot-cloud", product: "acad", version: "2027", dir: "docs",
    name: "Публикация в облако (Push to Docs)", command: "PUBLISHTODOCS",
    desc: "Публикация подшивки в Autodesk Docs с общей ссылкой на просмотр.",
    icon: "CloudUpload", isNew: true, outputLabel: "Облачная публикация",
    fields: [
      { key: "sheets", label: "Листов", type: "number", default: "34" },
      { key: "access", label: "Доступ", type: "select", default: "По ссылке", options: ["По ссылке", "Команда проекта", "Только я"] },
    ],
    compute: v => [{ label: "Опубликовано", value: `${v.sheets} листов` }, { label: "Доступ", value: v.access }],
  },

  // ═══════════════ ИНТЕГРАЦИЯ И ОБМЕН ФОРМАТАМИ (2022–2027) ═══════════════
  {
    id: "interop-dwg-import", product: "acad", version: "2022", dir: "docs",
    name: "Импорт DWG/DXF", command: "DWGIMPORT",
    desc: "Импорт чертежей DWG/DXF с сопоставлением слоёв и единиц.",
    icon: "FileInput", outputLabel: "Импорт",
    fields: [
      { key: "fmt", label: "Формат", type: "select", default: "DWG 2018", options: ["DWG 2018", "DWG 2013", "DWG 2007", "DXF R12", "DXF 2018"] },
      { key: "objs", label: "Объектов", type: "number", default: "12400" },
    ],
    compute: v => [{ label: "Импортировано", value: `${v.objs} объектов (${v.fmt})` }],
  },
  {
    id: "interop-dwg-export", product: "acad", version: "2022", dir: "docs",
    name: "Экспорт DWG/DXF", command: "DWGEXPORT",
    desc: "Сохранение в разные версии DWG/DXF для совместимости.",
    icon: "FileOutput", outputLabel: "Экспорт",
    fields: [{ key: "fmt", label: "Целевой формат", type: "select", default: "DWG 2018", options: ["DWG 2018", "DWG 2013", "DWG 2007", "DXF 2018", "DXF R12"] }],
    compute: v => [{ label: "Сохранено", value: v.fmt }],
  },
  {
    id: "interop-landxml", product: "civil", version: "2022", dir: "survey",
    name: "Обмен LandXML", command: "LANDXMLOUT",
    desc: "Импорт/экспорт поверхностей, трасс и точек через LandXML.",
    icon: "FileCode", outputLabel: "LandXML",
    fields: [
      { key: "dir", label: "Направление", type: "select", default: "Экспорт", options: ["Экспорт", "Импорт"] },
      { key: "surf", label: "Поверхностей", type: "number", default: "3" },
      { key: "align", label: "Трасс", type: "number", default: "2" },
    ],
    compute: v => [{ label: v.dir, value: `${v.surf} поверхн., ${v.align} трасс` }],
  },
  {
    id: "interop-ifc-export", product: "civil", version: "2023", dir: "bim",
    name: "Экспорт IFC", command: "IFCEXPORT",
    desc: "Экспорт модели в IFC 2x3 / IFC4 для BIM-координации.",
    icon: "Building2", isNew: true, outputLabel: "IFC",
    fields: [
      { key: "schema", label: "Схема", type: "select", default: "IFC4", options: ["IFC2x3", "IFC4", "IFC4.3"] },
      { key: "elems", label: "Элементов", type: "number", default: "860" },
    ],
    compute: v => [{ label: "Экспортировано", value: `${v.elems} элем. (${v.schema})` }],
  },
  {
    id: "interop-shp", product: "civil", version: "2023", dir: "survey",
    name: "Импорт/экспорт SHP (GIS)", command: "MAPIMPORT",
    desc: "Обмен с ГИС: shapefile с атрибутами и системой координат.",
    icon: "Map", outputLabel: "SHP",
    fields: [
      { key: "type", label: "Геометрия", type: "select", default: "Полигоны", options: ["Точки", "Линии", "Полигоны"] },
      { key: "feat", label: "Объектов", type: "number", default: "540" },
    ],
    compute: v => [{ label: "Обработано", value: `${v.feat} ${v.type.toLowerCase()}` }],
  },
  {
    id: "interop-rvt", product: "civil", version: "2024", dir: "bim",
    name: "Связь с Revit (RVT)", command: "IMPORTREVIT",
    desc: "Импорт/связывание моделей Revit для совмещённой координации.",
    icon: "Link", isNew: true, outputLabel: "Revit",
    fields: [{ key: "mode", label: "Режим", type: "select", default: "Связь", options: ["Связь", "Импорт копией"] }],
    compute: v => [{ label: "Модель Revit", value: v.mode }],
  },
  {
    id: "interop-step", product: "acad", version: "2024", dir: "mechanical",
    name: "Обмен STEP/IGES", command: "STEPIN",
    desc: "Импорт/экспорт твёрдых тел в STEP, IGES, SAT для CAD-обмена.",
    icon: "Boxes", outputLabel: "STEP/IGES",
    fields: [
      { key: "fmt", label: "Формат", type: "select", default: "STEP AP242", options: ["STEP AP203", "STEP AP214", "STEP AP242", "IGES", "SAT"] },
      { key: "bodies", label: "Тел", type: "number", default: "14" },
    ],
    compute: v => [{ label: "Обмен", value: `${v.bodies} тел (${v.fmt})` }],
  },
  {
    id: "interop-dgn", product: "acad", version: "2025", dir: "docs",
    name: "Импорт DGN (MicroStation)", command: "DGNIMPORT",
    desc: "Импорт чертежей DGN с преобразованием стилей и уровней.",
    icon: "FileInput", outputLabel: "DGN",
    fields: [{ key: "levels", label: "Уровней (levels)", type: "number", default: "24" }],
    compute: v => [{ label: "Уровни → слои", value: `${v.levels}` }],
  },
  {
    id: "interop-kml", product: "civil", version: "2025", dir: "survey",
    name: "Экспорт KML/KMZ (Google Earth)", command: "MAPEXPORT",
    desc: "Экспорт объектов в KML/KMZ с пересчётом в WGS84.",
    icon: "Globe", outputLabel: "KML",
    fields: [{ key: "feat", label: "Объектов", type: "number", default: "120" }],
    compute: v => [{ label: "Экспортировано в KMZ", value: `${v.feat} объектов` }],
  },
  {
    id: "interop-geojson", product: "civil", version: "2026", dir: "survey",
    name: "Обмен GeoJSON", command: "GEOJSON",
    desc: "Импорт/экспорт GeoJSON для веб-ГИС и открытых данных.",
    icon: "FileJson", isNew: true, outputLabel: "GeoJSON",
    fields: [{ key: "feat", label: "Features", type: "number", default: "300" }],
    compute: v => [{ label: "Записей GeoJSON", value: `${v.feat}` }],
  },
  {
    id: "interop-cloud-format", product: "acad", version: "2027", dir: "management",
    name: "Авто-конвертер форматов (AI)", command: "AUTOCONVERT",
    desc: "Пакетное облачное преобразование между DWG, IFC, PDF, STEP по правилам.",
    icon: "Repeat", isNew: true, outputLabel: "Пакетная конвертация",
    fields: [
      { key: "files", label: "Файлов", type: "number", default: "48" },
      { key: "to", label: "В формат", type: "select", default: "IFC4", options: ["DWG 2018", "IFC4", "PDF", "STEP", "LandXML"] },
    ],
    compute: v => [{ label: "Конвертировано", value: `${v.files} → ${v.to}` }],
  },

  // ═══════════════ Civil 3D — ГЕОДЕЗИЯ И СЪЁМКА / COGO (2022–2027) ═══════════════
  {
    id: "survey-cogo-point", product: "civil", version: "2022", dir: "survey",
    name: "COGO-точки (CreatePoints)", command: "CREATEPOINTS",
    desc: "Создание точек по координатам, дирекционному углу и расстоянию.",
    icon: "MapPin", outputLabel: "COGO-точка",
    fields: [
      { key: "n", label: "Северное X", type: "number", default: "6120.500" },
      { key: "e", label: "Восточное Y", type: "number", default: "4310.250" },
      { key: "z", label: "Отметка H", type: "number", default: "142.35", suffix: "м" },
    ],
    compute: v => [{ label: "Точка", value: `X ${v.n} · Y ${v.e} · H ${v.z}` }],
  },
  {
    id: "survey-cogo-inverse", product: "civil", version: "2022", dir: "survey",
    name: "Обратная геодезическая (Inverse)", command: "INVERSE",
    desc: "Расстояние и дирекционный угол между двумя точками.",
    icon: "MoveDiagonal", outputLabel: "Обратная задача",
    fields: [
      { key: "dn", label: "ΔСеверное", type: "number", default: "230.400" },
      { key: "de", label: "ΔВосточное", type: "number", default: "158.900" },
    ],
    compute: v => {
      const dn = num(v.dn), de = num(v.de)
      const dist = Math.sqrt(dn * dn + de * de)
      let az = Math.atan2(de, dn) * 180 / Math.PI
      if (az < 0) az += 360
      return [{ label: "Расстояние", value: `${dist.toFixed(3)} м` }, { label: "Дир. угол", value: `${az.toFixed(4)}°` }]
    },
  },
  {
    id: "survey-cogo-figure", product: "civil", version: "2023", dir: "survey",
    name: "Фигуры съёмки (Figure)", command: "SURVEYFIGURE",
    desc: "Линейные объекты съёмки (бордюр, кромка) из точек с кодами.",
    icon: "Spline", outputLabel: "Фигура",
    fields: [
      { key: "pts", label: "Точек в фигуре", type: "number", default: "14" },
      { key: "code", label: "Код", type: "text", default: "EOP" },
    ],
    compute: v => [{ label: `Фигура «${v.code}»`, value: `${v.pts} вершин` }],
  },
  {
    id: "survey-total-station", product: "civil", version: "2023", dir: "survey",
    name: "Импорт тахеометрии", command: "IMPORTFIELDBOOK",
    desc: "Обработка полевого журнала (FBK) тахеометра с кодировкой точек.",
    icon: "Radar", outputLabel: "Тахеометрия",
    fields: [
      { key: "st", label: "Станций", type: "number", default: "6" },
      { key: "obs", label: "Наблюдений", type: "number", default: "480" },
    ],
    compute: v => [{ label: "Импортировано", value: `${v.obs} набл. с ${v.st} станций` }],
  },
  {
    id: "survey-traverse", product: "civil", version: "2024", dir: "survey",
    name: "Уравнивание хода (Traverse)", command: "TRAVERSEADJUST",
    desc: "Уравнивание теодолитного хода методом Болмана/наименьших квадратов.",
    icon: "Waypoints", isNew: true, outputLabel: "Ход",
    fields: [
      { key: "stations", label: "Станций хода", type: "number", default: "8" },
      { key: "len", label: "Длина хода", type: "number", default: "1240", suffix: "м" },
      { key: "close", label: "Невязка", type: "number", default: "0.045", suffix: "м" },
    ],
    compute: v => {
      const rel = num(v.len) / Math.max(0.001, num(v.close))
      return [{ label: "Отн. невязка", value: `1:${Math.round(rel)}` }, { label: "Оценка", value: num(v.len) / num(v.close) > 2000 ? "в допуске" : "проверить" }]
    },
  },
  {
    id: "survey-leveling", product: "civil", version: "2024", dir: "survey",
    name: "Обработка нивелирования (Leveling)", command: "LEVELING",
    desc: "Уравнивание нивелирного хода и вычисление отметок.",
    icon: "GitCommitVertical", outputLabel: "Нивелирование",
    fields: [
      { key: "stations", label: "Станций", type: "number", default: "12" },
      { key: "hclose", label: "Невязка по H", type: "number", default: "8", suffix: "мм" },
    ],
    compute: v => {
      const dop = 10 * Math.sqrt(num(v.stations))
      return [{ label: "Допуск (10√n)", value: `${dop.toFixed(1)} мм` }, { label: "Статус", value: num(v.hclose) <= dop ? "в допуске" : "превышение" }]
    },
  },
  {
    id: "survey-gnss", product: "civil", version: "2025", dir: "survey",
    name: "Обработка GNSS/RTK", command: "IMPORTGNSS",
    desc: "Импорт точек RTK/статики с пересчётом в местную систему координат.",
    icon: "Satellite", isNew: true, outputLabel: "GNSS",
    fields: [
      { key: "pts", label: "Точек GNSS", type: "number", default: "320" },
      { key: "pdop", label: "Средний PDOP", type: "number", default: "1.8" },
    ],
    compute: v => [{ label: "Импортировано", value: `${v.pts} точек` }, { label: "Качество PDOP", value: num(v.pdop) < 2 ? "отличное" : num(v.pdop) < 4 ? "хорошее" : "слабое" }],
  },
  {
    id: "survey-network-adjust", product: "civil", version: "2025", dir: "survey",
    name: "Уравнивание сети (LeastSquares)", command: "NETWORKADJUST",
    desc: "Строгое уравнивание геодезической сети по методу наименьших квадратов.",
    icon: "Network", outputLabel: "Уравнивание сети",
    fields: [
      { key: "pts", label: "Пунктов", type: "number", default: "18" },
      { key: "obs", label: "Измерений", type: "number", default: "64" },
    ],
    compute: v => {
      const redundancy = num(v.obs) - 2 * num(v.pts)
      return [{ label: "Избыточность", value: `${redundancy}` }, { label: "Решение", value: redundancy > 0 ? "переопределено" : "недостаточно данных" }]
    },
  },
  {
    id: "survey-geodetic-transform", product: "civil", version: "2026", dir: "survey",
    name: "Геодезическое преобразование", command: "GEODETICCALC",
    desc: "Пересчёт координат между системами (СК-42, СК-95, ГСК-2011, WGS84).",
    icon: "Globe", outputLabel: "Преобразование",
    fields: [
      { key: "from", label: "Из системы", type: "select", default: "WGS84", options: ["WGS84", "СК-42", "СК-95", "ГСК-2011", "МСК"] },
      { key: "to", label: "В систему", type: "select", default: "МСК", options: ["WGS84", "СК-42", "СК-95", "ГСК-2011", "МСК"] },
      { key: "pts", label: "Точек", type: "number", default: "540" },
    ],
    compute: v => [{ label: "Пересчитано", value: `${v.pts} точек` }, { label: "Переход", value: `${v.from} → ${v.to}` }],
  },
  {
    id: "survey-report", product: "civil", version: "2027", dir: "survey",
    name: "Ведомость координат (COGO Report)", command: "COGOREPORT",
    desc: "Автоматическая ведомость координат, углов и линий с оценкой точности.",
    icon: "FileSpreadsheet", isNew: true, outputLabel: "Ведомость",
    fields: [
      { key: "pts", label: "Точек в ведомости", type: "number", default: "128" },
      { key: "fmt", label: "Формат", type: "select", default: "PDF + CSV", options: ["PDF", "CSV", "PDF + CSV", "XLSX"] },
    ],
    compute: v => [{ label: "Строк", value: `${v.pts}` }, { label: "Экспорт", value: v.fmt }],
  },
]

// Нормализация: достраиваем category (явную или автоопределённую)
export const FEATURES: VersionFeatureFull[] = RAW_FEATURES.map(f => ({
  ...f,
  category: f.category ?? detectCategory(f.id),
}))

// Утилиты
export const featuresByFilter = (
  product: ProductId | "all", version: VersionId | "all",
  dir: DirId | "all", category: CategoryId | "all", q: string,
) => {
  const query = q.trim().toLowerCase()
  return FEATURES.filter(f =>
    (product === "all" || f.product === product) &&
    (version === "all" || f.version === version) &&
    (dir === "all" || f.dir === dir) &&
    (category === "all" || f.category === category) &&
    (!query || f.name.toLowerCase().includes(query) || f.desc.toLowerCase().includes(query) || (f.command || "").toLowerCase().includes(query))
  )
}

export const featureCountByDir = (dir: DirId) => FEATURES.filter(f => f.dir === dir).length
export const usedCategories = (): CategoryMeta[] => CATEGORIES.filter(c => FEATURES.some(f => f.category === c.id))