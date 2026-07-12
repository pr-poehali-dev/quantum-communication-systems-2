// ═══════════════════════════════════════════════════════════════════════════
// Полный реестр функций AutoCAD и AutoCAD Civil 3D, версии 2022 → 2027.
// Каждая функция привязана к направлению работы (совпадает с DIRECTIONS в Dashboard).
// product: "acad" — AutoCAD, "civil" — Civil 3D.
// ═══════════════════════════════════════════════════════════════════════════

export type ProductId = "acad" | "civil"
export type DirId = "infra" | "survey" | "networks" | "bim" | "mechanical" | "docs" | "management"
export type VersionId = "2022" | "2023" | "2024" | "2025" | "2026" | "2027"

export interface VersionFeature {
  id: string
  product: ProductId
  version: VersionId
  dir: DirId
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

const num = (v: string) => parseFloat((v || "0").replace(",", ".")) || 0

// ─── Реестр ────────────────────────────────────────────────────────────────
export const FEATURES: VersionFeatureFull[] = [

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
]

// Утилиты
export const featuresByFilter = (product: ProductId | "all", version: VersionId | "all", dir: DirId | "all", q: string) => {
  const query = q.trim().toLowerCase()
  return FEATURES.filter(f =>
    (product === "all" || f.product === product) &&
    (version === "all" || f.version === version) &&
    (dir === "all" || f.dir === dir) &&
    (!query || f.name.toLowerCase().includes(query) || f.desc.toLowerCase().includes(query) || (f.command || "").toLowerCase().includes(query))
  )
}

export const featureCountByDir = (dir: DirId) => FEATURES.filter(f => f.dir === dir).length