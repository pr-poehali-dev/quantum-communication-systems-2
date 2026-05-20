import { useRef, useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Icon from "@/components/ui/icon"

// ─── Types ─────────────────────────────────────────────────────────────────

interface TreeNode {
  id: string; label: string; icon: string; color?: string
  children?: TreeNode[]; expanded?: boolean
}

interface Alignment {
  id: string; name: string; color: string
  pts: [number, number][]
}

interface CorridorRow {
  alignment: string; profile: string; assembly: string
}

interface FeatureLine {
  name: string; assembly: string
}

interface CorridorDef {
  name: string; description: string; style: string
  codeStyle: string; layer: string; template: string
  targetSurface: string; rows: CorridorRow[]; features: FeatureLine[]
}

// ─── Additional dialog types ────────────────────────────────────────────────

interface SurfaceDef {
  name: string; description: string; type: "TIN" | "Grid"
  style: string; layer: string; gridX: string; gridY: string
  pointFiles: { name: string; format: string }[]
}

interface AlignmentDef {
  name: string; description: string; type: string
  startStation: string; stationIncrement: string
  style: string; layer: string
  elements: { type: "line" | "curve" | "spiral"; length: string; radius: string; Az: string; A: string }[]
}

interface ProfileDef {
  name: string; alignment: string; surface: string
  description: string; style: string; layer: string
  pvcs: { station: string; elev: string; k: string }[]
}

interface SubassemblyItem {
  id: string; name: string; side: "Левый" | "Правый" | "Обе стороны"; type: string
  params: Record<string, string>
}

interface AssemblyDef {
  name: string; description: string; style: string; layer: string
  markerStyle: string; defaultOffset: string; defaultElevAdj: string
  subassemblies: SubassemblyItem[]
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TREE: TreeNode[] = [
  {
    id: "project", label: "Главная парковка_Финал", icon: "FolderOpen", expanded: true, children: [
      { id: "points", label: "Точки", icon: "MapPin", color: "#f59e0b" },
      { id: "ptgroups", label: "Группы точек", icon: "Users", color: "#f59e0b" },
      {
        id: "surfaces", label: "Поверхности", icon: "Mountain", color: "#4ade80", expanded: true, children: [
          { id: "s1", label: "Существующая поверхность", icon: "Triangle", color: "#4ade80" },
          { id: "s2", label: "Проектная поверхность", icon: "Triangle", color: "#60a5fa" },
        ]
      },
      {
        id: "alignments", label: "Трассы", icon: "Route", color: "#f97316", expanded: true, children: [
          { id: "a1", label: "Трасса ШД-38", icon: "Minus", color: "#ef4444" },
          { id: "a2", label: "Ул. Трумана", icon: "Minus", color: "#a855f7" },
          { id: "a3", label: "Бордюр периметра", icon: "Minus", color: "#06b6d4" },
        ]
      },
      { id: "featurelines", label: "Характерные линии", icon: "Spline", color: "#ec4899" },
      { id: "sites", label: "Площадки", icon: "LayoutGrid", color: "#84cc16" },
      { id: "catchments", label: "Водосборные бассейны", icon: "Droplets", color: "#60a5fa" },
      { id: "pipenet", label: "Трубопроводные сети", icon: "Network", color: "#6366f1" },
      { id: "pressnet", label: "Напорные сети", icon: "Gauge", color: "#8b5cf6" },
      { id: "bridges", label: "Мосты", icon: "Milestone", color: "#f59e0b" },
      { id: "turnouts", label: "Разъезды и пересечения", icon: "ArrowLeftRight", color: "#94a3b8" },
      {
        id: "corridors", label: "Коридоры", icon: "Navigation", color: "#f97316", expanded: true, children: [
          { id: "c1", label: "Дорога и парковочная зона", icon: "Minus", color: "#f97316" },
        ]
      },
      { id: "assemblies", label: "Типовые сечения", icon: "Layers", color: "#94a3b8" },
      { id: "subassemblies", label: "Подсечения", icon: "Layers2", color: "#94a3b8" },
      { id: "intersections", label: "Пересечения", icon: "Plus", color: "#f43f5e" },
      { id: "survey", label: "Геодезия", icon: "Compass", color: "#10b981" },
      { id: "vfg", label: "Группы видовых рамок", icon: "RectangleHorizontal", color: "#64748b" },
    ]
  },
  {
    id: "datasrc", label: "Ярлыки данных []", icon: "Database", expanded: false, children: [
      { id: "ds1", label: "Поверхности", icon: "Mountain", color: "#4ade80" },
      { id: "ds2", label: "Трассы", icon: "Route", color: "#f97316" },
      { id: "ds3", label: "Трубопроводные сети", icon: "Network", color: "#6366f1" },
      { id: "ds4", label: "Напорные сети", icon: "Gauge", color: "#8b5cf6" },
      { id: "ds5", label: "Коридоры", icon: "Navigation", color: "#f97316" },
      { id: "ds6", label: "Группы видовых рамок", icon: "RectangleHorizontal", color: "#64748b" },
    ]
  },
]

const ALIGNMENTS: Alignment[] = [
  { id: "sh38", name: "Трасса ШД-38", color: "#ef4444", pts: [[80,60],[160,90],[260,110],[370,95],[460,80],[540,70],[630,85],[720,100],[810,88],[880,72]] },
  { id: "truman", name: "Ул. Трумана", color: "#a855f7", pts: [[100,180],[200,190],[310,185],[420,195],[530,188],[640,200],[740,195],[840,188]] },
  { id: "perimeter", name: "Бордюр периметра", color: "#06b6d4", pts: [[180,120],[220,130],[270,160],[290,210],[280,260],[250,300],[210,320],[170,310],[140,280],[130,240],[140,190],[160,155],[180,120]] },
]

const ASSEMBLIES = ["Трасса ШД-38", "Ул. Трумана", "Тротуар", "Бордюр проезжей ч. Лев.", "Бордюр проезжей ч. Пр.", "Парковочный бордюр", "Бордюр периметра", "V-образный лоток"]
const PROFILES: Record<string, string[]> = {
  "Трасса ШД-38": ["ПРОЕКТ_ШД-38", "Сущ. профиль"],
  "Ул. Трумана": ["Проект_Трумана", "Сущ. профиль"],
  "*Нет*": ["*Нет*"],
}
const SURFACES = ["<нет>", "Существующая поверхность", "Проектная поверхность"]
const STYLES = ["Базовый", "Все подписи", "Без отображения"]
const CODE_STYLES = ["Все коды", "Без отображения", "Коды дорог"]

const FEATURE_LINES: FeatureLine[] = [
  { name: "Тротуар_Периметр_01", assembly: "Тротуар" },
  { name: "Парк_Бордюр_04", assembly: "Парковочный бордюр" },
  { name: "Бордюр пр.ч. Лев. 8", assembly: "Бордюр проезжей ч. Лев." },
  { name: "Бордюр пр.ч. Лев. 7", assembly: "Бордюр проезжей ч. Лев." },
  { name: "Бордюр пр.ч. Лев. 6", assembly: "Парковочный бордюр" },
  { name: "Бордюр пр.ч. Пр. 4", assembly: "Бордюр периметра" },
  { name: "Бордюр пр.ч. Пр. 3", assembly: "Бордюр проезжей ч. Пр." },
  { name: "Бордюр пр.ч. Пр. 2", assembly: "Бордюр проезжей ч. Пр." },
]

const MENU_ITEMS = ["Главная","Вставка","Аннотации","Редактирование","Анализ","Вид","Управление","Вывод","Геодезия","Ж/д путь","Прозрачность","InfraWorks","Совместная работа","Справка","Надстройки","Инструменты Express","Отслеживание транспорта","Избранные приложения","Геолокация"]

// size: "lg" = большая кнопка с иконкой сверху, "sm" = маленькая кнопка строчкой
interface RibbonItem { label: string; icon: string; size: "lg" | "sm"; drop?: string }
interface RibbonGroup { label: string; items: RibbonItem[] }

const TOOLBAR_BY_MENU: Record<string, RibbonGroup[]> = {
  "Главная": [
    { label: "Палитры", items: [
      { label: "Пространство инструментов", icon: "PanelLeft", size: "lg", drop: "Пространство инструментов ▾" },
      { label: "Диспетчер проекта", icon: "FolderOpen", size: "sm" },
      { label: "Оптимизация", icon: "Sliders", size: "sm" },
    ]},
    { label: "Вертикальная планировка", items: [
      { label: "Оптимизация планировки", icon: "Mountain", size: "lg" },
    ]},
    { label: "Создать топооснову", items: [
      { label: "Точки", icon: "MapPin", size: "lg", drop: "Точки ▾" },
      { label: "Поверхности", icon: "Triangle", size: "lg", drop: "Поверхности ▾" },
      { label: "Хар. линия", icon: "Spline", size: "sm", drop: "Характерная линия ▾" },
      { label: "Теодолит. ход", icon: "Navigation", size: "sm", drop: "Теодолитный ход ▾" },
    ]},
    { label: "Создать проект", items: [
      { label: "Трасса", icon: "Route", size: "lg", drop: "Трасса ▾" },
      { label: "Пересечения", icon: "GitMerge", size: "sm", drop: "Пересечения ▾" },
      { label: "Профиль", icon: "TrendingUp", size: "sm", drop: "Профиль ▾" },
      { label: "Тип. сечение", icon: "Layers", size: "sm", drop: "Типовое сечение ▾" },
      { label: "Коридор", icon: "RectangleHorizontal", size: "lg", drop: "Коридор ▾" },
      { label: "Труб. сеть", icon: "Network", size: "sm", drop: "Трубопроводная сеть ▾" },
    ]},
    { label: "Профиль и поперечники", items: [
      { label: "Вид профиля", icon: "BarChart2", size: "lg", drop: "Вид профиля ▾" },
      { label: "Виды попереч.", icon: "AlignJustify", size: "sm", drop: "Виды поперечников ▾" },
      { label: "Линии образцов", icon: "Minus", size: "sm" },
    ]},
    { label: "Черчение", items: [
      { label: "Черчение", icon: "Pen", size: "lg", drop: "Черчение ▾" },
    ]},
    { label: "Редактирование", items: [
      { label: "Перенести", icon: "Move", size: "sm" },
      { label: "Копировать", icon: "Copy", size: "sm", drop: "Копировать ▾" },
      { label: "Повернуть", icon: "RotateCw", size: "sm" },
      { label: "Зеркало", icon: "FlipHorizontal", size: "sm" },
      { label: "Обрезать", icon: "Scissors", size: "sm", drop: "Обрезать ▾" },
      { label: "Растянуть", icon: "Maximize2", size: "sm" },
      { label: "Масштаб", icon: "ZoomIn", size: "sm" },
      { label: "Массив", icon: "LayoutGrid", size: "sm", drop: "Массив ▾" },
      { label: "Сопряжение", icon: "CircleDot", size: "sm" },
    ]},
    { label: "Слои", items: [
      { label: "Слои", icon: "Layers2", size: "lg", drop: "Слои ▾" },
      { label: "Сделать текущим", icon: "Check", size: "sm" },
      { label: "Совместить слои", icon: "Merge", size: "sm" },
    ]},
    { label: "Буфер обмена", items: [
      { label: "Вставить", icon: "ClipboardPaste", size: "lg", drop: "Вставить ▾" },
    ]},
  ],
  "Вставка": [
    { label: "Блоки", items: [
      { label: "Вставить", icon: "Package", size: "lg", drop: "Вставить ▾" },
      { label: "Создать блок", icon: "PackagePlus", size: "sm" },
      { label: "Редактировать блок", icon: "PackageOpen", size: "sm" },
    ]},
    { label: "Ссылки", items: [
      { label: "Присоединить", icon: "Paperclip", size: "lg", drop: "Присоединить ▾" },
      { label: "Обрезать", icon: "Scissors", size: "sm" },
    ]},
    { label: "Импорт", items: [
      { label: "Импорт", icon: "Download", size: "lg", drop: "Импорт ▾" },
      { label: "LandXML", icon: "FileCode", size: "sm" },
      { label: "Облако точек", icon: "Cloud", size: "sm" },
    ]},
    { label: "Система координат", items: [
      { label: "Назначить СК", icon: "Globe", size: "lg", drop: "Назначить ▾" },
      { label: "Преобразовать", icon: "RefreshCw", size: "sm" },
    ]},
  ],
  "Аннотации": [
    { label: "Текст", items: [
      { label: "Многострочный", icon: "Type", size: "lg", drop: "Многострочный ▾" },
      { label: "Однострочный", icon: "Minus", size: "sm" },
      { label: "Редактировать", icon: "Pencil", size: "sm" },
    ]},
    { label: "Размеры", items: [
      { label: "Линейный", icon: "Ruler", size: "lg", drop: "Линейный ▾" },
      { label: "Угловой", icon: "Combine", size: "sm" },
      { label: "Радиус", icon: "Circle", size: "sm" },
      { label: "Выноска", icon: "MessageSquare", size: "sm", drop: "Выноска ▾" },
    ]},
    { label: "Марки", items: [
      { label: "Добавить марки", icon: "Tag", size: "lg", drop: "Добавить марки ▾" },
      { label: "Стиль марки", icon: "Tags", size: "sm" },
      { label: "Таблица", icon: "Table", size: "sm", drop: "Таблица ▾" },
    ]},
  ],
  "Редактирование": [
    { label: "Изменить", items: [
      { label: "Перенести", icon: "Move", size: "lg" },
      { label: "Копировать", icon: "Copy", size: "sm", drop: "Копировать ▾" },
      { label: "Повернуть", icon: "RotateCw", size: "sm" },
      { label: "Зеркало", icon: "FlipHorizontal", size: "sm" },
      { label: "Масштаб", icon: "ZoomIn", size: "sm" },
    ]},
    { label: "Изменить размер", items: [
      { label: "Обрезать", icon: "Scissors", size: "lg", drop: "Обрезать ▾" },
      { label: "Растянуть", icon: "Maximize2", size: "sm" },
      { label: "Разбить", icon: "Split", size: "sm" },
      { label: "Соединить", icon: "Link", size: "sm" },
    ]},
    { label: "Массив", items: [
      { label: "Прямоугольный", icon: "LayoutGrid", size: "lg", drop: "Прямоугольный ▾" },
      { label: "Круговой", icon: "RefreshCw", size: "sm", drop: "Круговой ▾" },
      { label: "По траектории", icon: "GitBranch", size: "sm", drop: "По траектории ▾" },
    ]},
    { label: "3D", items: [
      { label: "3D-перенос", icon: "Box", size: "sm" },
      { label: "3D-поворот", icon: "RefreshCcw", size: "sm" },
      { label: "3D-зеркало", icon: "Layers", size: "sm" },
    ]},
  ],
  "Анализ": [
    { label: "Поверхности", items: [
      { label: "Анализ уклонов", icon: "TrendingUp", size: "lg", drop: "Анализ уклонов ▾" },
      { label: "Анализ высот", icon: "BarChart2", size: "sm", drop: "Анализ высот ▾" },
      { label: "Водосборы", icon: "Droplets", size: "sm", drop: "Водосборы ▾" },
      { label: "Разрезы", icon: "ScanLine", size: "sm", drop: "Разрезы ▾" },
    ]},
    { label: "Коридоры", items: [
      { label: "Объёмы", icon: "Database", size: "lg", drop: "Объёмы ▾" },
      { label: "Ведомость", icon: "FileSpreadsheet", size: "sm", drop: "Ведомость объёмов ▾" },
    ]},
    { label: "Сети", items: [
      { label: "Гидравлика", icon: "Gauge", size: "lg", drop: "Гидравлика ▾" },
      { label: "Инспекция", icon: "Search", size: "sm", drop: "Инспекция ▾" },
    ]},
    { label: "Отчёты", items: [
      { label: "Отчёт", icon: "FileText", size: "lg", drop: "Генерировать отчёт ▾" },
    ]},
  ],
  "Вид": [
    { label: "Виды", items: [
      { label: "Сверху", icon: "Square", size: "lg" },
      { label: "Изометрия ЮЗ", icon: "Box", size: "sm", drop: "Изометрия ЮЗ ▾" },
      { label: "Пользовательский", icon: "Monitor", size: "sm", drop: "Пользовательский ▾" },
    ]},
    { label: "Визуальный стиль", items: [
      { label: "2D Каркас", icon: "Grid", size: "sm" },
      { label: "Тонирование", icon: "Sun", size: "sm" },
      { label: "Реалистичный", icon: "Image", size: "sm" },
    ]},
    { label: "Видовые экраны", items: [
      { label: "1 экран", icon: "Square", size: "sm" },
      { label: "2 экрана", icon: "Columns2", size: "sm", drop: "2 видовых экрана ▾" },
      { label: "4 экрана", icon: "LayoutGrid", size: "sm" },
    ]},
    { label: "Навигация", items: [
      { label: "Орбита", icon: "RefreshCw", size: "sm", drop: "Орбита ▾" },
      { label: "Панорама", icon: "Hand", size: "sm" },
      { label: "Зум", icon: "ZoomIn", size: "sm", drop: "Зум ▾" },
    ]},
    { label: "Палитры", items: [
      { label: "Свойства", icon: "Info", size: "sm" },
      { label: "Слои", icon: "Layers", size: "sm" },
      { label: "П. инструментов", icon: "PanelLeft", size: "sm" },
    ]},
  ],
  "Управление": [
    { label: "Параметры", items: [
      { label: "Параметры чертежа", icon: "Settings", size: "lg" },
      { label: "Единицы и зона", icon: "Globe", size: "sm" },
      { label: "Общие параметры", icon: "SlidersHorizontal", size: "sm" },
    ]},
    { label: "Стили", items: [
      { label: "Параметры объекта", icon: "Palette", size: "lg" },
      { label: "Диспетчер стилей", icon: "Paintbrush", size: "sm", drop: "Диспетчер стилей марок ▾" },
    ]},
    { label: "Запись действий", items: [
      { label: "Запись", icon: "Circle", size: "sm" },
      { label: "Воспроизведение", icon: "Play", size: "sm" },
      { label: "Редактировать", icon: "Edit", size: "sm" },
    ]},
    { label: "Стандарты САПР", items: [
      { label: "Настройка", icon: "Wrench", size: "sm" },
      { label: "Проверка", icon: "CheckCircle", size: "sm" },
      { label: "Преобразователь", icon: "ArrowLeftRight", size: "sm" },
    ]},
  ],
  "Вывод": [
    { label: "Печать", items: [
      { label: "Печать", icon: "Printer", size: "lg", drop: "Печать ▾" },
      { label: "Пакетная печать", icon: "PrinterCheck", size: "sm" },
      { label: "Просмотр", icon: "Eye", size: "sm" },
    ]},
    { label: "Экспорт", items: [
      { label: "PDF", icon: "FileDown", size: "lg", drop: "PDF ▾" },
      { label: "DWF", icon: "File", size: "sm", drop: "DWF ▾" },
      { label: "LandXML", icon: "FileCode", size: "sm" },
      { label: "IFC", icon: "FileJson", size: "sm" },
    ]},
    { label: "Публикация", items: [
      { label: "Autodesk Docs", icon: "Cloud", size: "lg" },
      { label: "Комплекты листов", icon: "BookOpen", size: "sm", drop: "Комплекты листов ▾" },
    ]},
    { label: "Отправить в", items: [
      { label: "InfraWorks", icon: "Building2", size: "sm" },
      { label: "Navisworks", icon: "Cube", size: "sm" },
      { label: "Revit", icon: "Home", size: "sm" },
    ]},
  ],
  "Геодезия": [
    { label: "Точки", items: [
      { label: "Создать точки", icon: "MapPin", size: "lg", drop: "Создать точки ▾" },
      { label: "Группы точек", icon: "Group", size: "sm", drop: "Группы точек ▾" },
      { label: "Импорт точек", icon: "Import", size: "sm" },
      { label: "Редактировать точки", icon: "Edit", size: "sm" },
    ]},
    { label: "База данных", items: [
      { label: "Открыть БД", icon: "Database", size: "lg", drop: "Открыть БД ▾" },
      { label: "Импорт данных", icon: "Download", size: "sm" },
      { label: "Экспорт данных", icon: "Upload", size: "sm" },
    ]},
    { label: "Теодолитный ход", items: [
      { label: "Редактор хода", icon: "Navigation", size: "lg" },
      { label: "Отчёт о невязке", icon: "FileText", size: "sm" },
      { label: "Уравнивание", icon: "BarChart", size: "sm" },
    ]},
    { label: "Поверхности", items: [
      { label: "TIN-поверхность", icon: "Triangle", size: "lg", drop: "TIN-поверхность ▾" },
      { label: "Grid-поверхность", icon: "Grid", size: "sm", drop: "Grid-поверхность ▾" },
    ]},
  ],
  "Ж/д путь": [
    { label: "Трасса", items: [
      { label: "Трасса ж/д", icon: "Train", size: "lg", drop: "Трасса ж/д ▾" },
      { label: "Кант", icon: "ArrowUpDown", size: "sm", drop: "Кант ▾" },
      { label: "Расположение", icon: "Map", size: "sm" },
    ]},
    { label: "Проект", items: [
      { label: "Проект пути", icon: "RailSymbol", size: "lg", drop: "Проект пути ▾" },
      { label: "Разъезды", icon: "GitFork", size: "sm", drop: "Разъезды и пересечения ▾" },
      { label: "Мосты", icon: "Milestone", size: "sm", drop: "Мосты ▾" },
    ]},
    { label: "Профиль", items: [
      { label: "Профиль ж/д", icon: "TrendingUp", size: "lg", drop: "Профиль ж/д ▾" },
      { label: "Точки уклонов", icon: "Dot", size: "sm" },
    ]},
  ],
  "Прозрачность": [
    { label: "Точка", items: [
      { label: "Номер точки", icon: "Hash", size: "sm" },
      { label: "Имя точки", icon: "Tag", size: "sm" },
      { label: "Объект точки", icon: "MapPin", size: "sm", drop: "Объект точки ▾" },
    ]},
    { label: "Пикет/Смещение", items: [
      { label: "Пикет и смещение", icon: "Milestone", size: "lg", drop: "Пикет и смещение ▾" },
      { label: "Пикет профиля", icon: "TrendingUp", size: "sm" },
    ]},
    { label: "Уклон", items: [
      { label: "Уклон и расстояние", icon: "TrendingDown", size: "sm" },
      { label: "Уклон от точки", icon: "ArrowUpRight", size: "sm" },
      { label: "Дирекционный угол", icon: "Compass", size: "sm" },
    ]},
  ],
  "InfraWorks": [
    { label: "Обмен данными", items: [
      { label: "Отправить в InfraWorks", icon: "Send", size: "lg" },
      { label: "Синхронизировать", icon: "RefreshCw", size: "sm" },
      { label: "Обновить модель", icon: "Download", size: "sm" },
    ]},
    { label: "Проект", items: [
      { label: "Открыть в InfraWorks", icon: "ExternalLink", size: "lg" },
      { label: "Сравнить варианты", icon: "GitCompare", size: "sm" },
    ]},
  ],
  "Совместная работа": [
    { label: "ЛАПА Облако", items: [
      { label: "Открыть из облака", icon: "CloudDownload", size: "lg" },
      { label: "Сохранить в облако", icon: "CloudUpload", size: "sm" },
      { label: "Поделиться", icon: "Share2", size: "sm" },
    ]},
    { label: "Совм. редактирование", items: [
      { label: "Включить совм. режим", icon: "Users", size: "lg" },
      { label: "Зафиксировать", icon: "Lock", size: "sm" },
      { label: "Снять фиксацию", icon: "Unlock", size: "sm" },
    ]},
    { label: "Ярлыки данных", items: [
      { label: "Создать ярлык", icon: "Link", size: "lg", drop: "Создать ярлык ▾" },
      { label: "Изменить ярлык", icon: "Edit", size: "sm" },
      { label: "Рабочая папка", icon: "Folder", size: "sm" },
    ]},
  ],
  "Надстройки": [
    { label: "Отслеживание транспорта", items: [
      { label: "Добавить транспорт", icon: "Car", size: "lg", drop: "Добавить транспорт ▾" },
      { label: "Симуляция", icon: "Play", size: "sm" },
      { label: "Траектория", icon: "Route", size: "sm" },
    ]},
    { label: "Расширения", items: [
      { label: "Управление", icon: "Package", size: "lg", drop: "Управление расширениями ▾" },
      { label: "Менеджер приложений", icon: "AppWindow", size: "sm" },
    ]},
  ],
  "Инструменты Express": [
    { label: "Блоки", items: [
      { label: "Супер штриховка", icon: "PaintBucket", size: "lg" },
      { label: "Конверт. текст", icon: "Type", size: "sm" },
      { label: "Блок", icon: "Package", size: "sm", drop: "Блок ▾" },
    ]},
    { label: "Текст", items: [
      { label: "Текст по дуге", icon: "RefreshCw", size: "sm" },
      { label: "Выравнивание", icon: "AlignLeft", size: "sm", drop: "Выравнивание текста ▾" },
    ]},
    { label: "Слои", items: [
      { label: "Перебор слоёв", icon: "List", size: "sm" },
      { label: "Заморозить", icon: "Snowflake", size: "sm" },
      { label: "Изолировать", icon: "Focus", size: "sm", drop: "Изолировать слой ▾" },
    ]},
  ],
  "Отслеживание транспорта": [
    { label: "Маршруты", items: [
      { label: "Добавить маршрут", icon: "Route", size: "lg", drop: "Добавить маршрут ▾" },
      { label: "Редактировать", icon: "Edit", size: "sm" },
      { label: "Удалить маршрут", icon: "Trash2", size: "sm" },
    ]},
    { label: "ТС", items: [
      { label: "Библиотека ТС", icon: "Car", size: "lg", drop: "Библиотека ТС ▾" },
      { label: "Польз. ТС", icon: "Truck", size: "sm" },
    ]},
    { label: "Симуляция", items: [
      { label: "Запустить", icon: "Play", size: "lg" },
      { label: "Анимация", icon: "Film", size: "sm" },
    ]},
  ],
  "Избранные приложения": [
    { label: "Приложения", items: [
      { label: "Raster Design", icon: "Image", size: "sm" },
      { label: "Point Layout", icon: "MapPin", size: "sm" },
      { label: "CAiCE Tools", icon: "Wrench", size: "sm" },
    ]},
    { label: "Сервис", items: [
      { label: "Сравнение DWG", icon: "GitCompare", size: "sm" },
      { label: "Очистить", icon: "Trash2", size: "sm", drop: "Очистить ▾" },
      { label: "Проверка", icon: "CheckCircle", size: "sm" },
    ]},
  ],
  "Геолокация": [
    { label: "Онлайн-карты", items: [
      { label: "Карта вкл.", icon: "Map", size: "lg" },
      { label: "Тип карты", icon: "MapPin", size: "sm", drop: "Тип карты ▾" },
      { label: "Захват области", icon: "Crop", size: "sm" },
    ]},
    { label: "Местоположение", items: [
      { label: "Задать местоположение", icon: "LocateFixed", size: "lg", drop: "Задать местоположение ▾" },
      { label: "Изменить местополож.", icon: "MapPinned", size: "sm" },
    ]},
    { label: "Координаты", items: [
      { label: "Переопубликовать", icon: "Upload", size: "sm", drop: "Переопубликовать ▾" },
      { label: "Обновить координаты", icon: "RefreshCw", size: "sm" },
      { label: "Экспорт KML", icon: "FileDown", size: "sm" },
    ]},
  ],
}

const TOOLBAR_GROUPS = TOOLBAR_BY_MENU["Главная"]

const DROPDOWN_ITEMS: Record<string, string[]> = {
  // Главная
  "Пространство инструментов ▾": ["Диспетчер","Параметры","Геодезия","Инструменты"],
  "Свойства ▾": ["Свойства объекта","Быстрые свойства","Циклический выбор"],
  "Точки ▾": ["Создать точки — вручную","Создать точки — интерполяция","Создать точки — по трассе","Создать точки — по поверхности","Импорт точек","Группы точек","Редактировать точки"],
  "Поверхности ▾": ["Создать поверхность (TIN)","Создать поверхность (Grid)","Из точек","Из горизонталей","Редактировать поверхность","Свойства поверхности","Экспорт поверхности"],
  "Характерная линия ▾": ["Создать характерную линию","Из объектов","Редактировать отметки","Сопряжение","Свойства хар. линии"],
  "Теодолитный ход ▾": ["Редактор хода","Отчёт о невязке","Импорт хода"],
  "Трасса ▾": ["Создать трассу — компоновка","Из объектов","Из полилинии","Редактировать геометрию","Свойства трассы","Редактор критериев проектирования"],
  "Пересечения ▾": ["Создать пересечение","Редактировать пересечение","Мастер пересечения"],
  "Профиль ▾": ["Профиль из поверхности","Создать профиль — компоновка","Редактировать геометрию профиля","Свойства профиля","Наложить профиль"],
  "Типовое сечение ▾": ["Создать типовое сечение","Редактировать","Свойства","Импорт типового сечения"],
  "Коридор ▾": ["Создать коридор","Редактировать коридор","Свойства коридора","Целевые объекты","Перестроить коридор"],
  "Трубопроводная сеть ▾": ["Создать сеть","Редактировать сеть","Свойства сети","Производство планов"],
  "Вид профиля ▾": ["Создать вид профиля","Создать несколько видов","Редактировать стиль","Совмещённые виды"],
  "Виды поперечников ▾": ["Создать вид поперечника","Создать несколько видов","Редактировать стиль","Набор полос"],
  "Черчение ▾": ["Полилиния","Отрезок","Дуга","Окружность","Прямоугольник","Сплайн","Штриховка","Текст"],
  "Копировать ▾": ["Копировать","С базовой точкой","Копировать в буфер"],
  "Обрезать ▾": ["Обрезать","Удлинить","Разбить в точке","Разбить"],
  "Массив ▾": ["Прямоугольный массив","Круговой массив","Массив по траектории"],
  "Слои": ["Диспетчер слоёв"],
  "Слои ▾": ["Диспетчер слоёв","Создать слой","Заморозить","Изолировать слой","Совместить слои"],
  "Вставить ▾": ["Вставить","Вставить как блок","Вставить на исходные координаты"],
  // Вставка
  "Присоединить ▾": ["Присоединить DWG","Вставить изображение","Вставить PDF","Вставить облако точек"],
  "Импорт ▾": ["LandXML","IFC","Shapefile","DEM/GeoTIFF","Облако точек (RCP/RCS)","Данные съёмки"],
  "Назначить ▾": ["Назначить систему координат","Из карты","Ввести вручную"],
  // Аннотации
  "Многострочный ▾": ["Создать мтекст","Редактировать стиль","Поле"],
  "Линейный ▾": ["Линейный","Параллельный","От базы","Цепочечный"],
  "Выноска ▾": ["Мультивыноска","Быстрая выноска","Допуск формы"],
  "Стиль текста ▾": ["Новый стиль","Изменить","Импорт из чертежа"],
  "Стиль размеров ▾": ["Новый стиль","Изменить","Переопределить","Сравнить"],
  "Таблица ▾": ["Вставить таблицу","Из связанных данных","Экспорт в CSV"],
  "Добавить марки ▾": ["Марки трасс","Марки профилей","Марки поперечников","Марки участков","Марки поверхностей","Марки трубопроводов"],
  "Редактировать марку ▾": ["Перевернуть марку","Перенести марку","Сбросить марку","Удалить переопределение"],
  // Редактирование
  "Прямоугольный ▾": ["Прямоугольный массив","Массив по траектории","Круговой массив"],
  "Круговой ▾": ["Круговой массив","Массив по траектории"],
  "По траектории ▾": ["Массив по траектории","Редактировать массив"],
  // Анализ
  "Анализ уклонов ▾": ["Анализ уклонов","Анализ стрелок уклонов","Пользовательские горизонтали"],
  "Анализ высот ▾": ["Анализ высот","Водосборы","Пользовательские горизонтали"],
  "Водосборы ▾": ["Анализ водосборов","Площадь водосбора","Путь стока"],
  "Разрезы ▾": ["Линии образцов","Виды поперечников","Свойства поперечника"],
  "Объёмы ▾": ["Объёмы по коридору","Между поверхностями","Ведомость объёмов","Ведомость земляных работ"],
  "Ведомость объёмов ▾": ["Диспетчер ВО","Вычислить материалы","Единичные расценки","Экспорт"],
  "Гидравлика ▾": ["Запустить гидравлический расчёт","Подбор труб","Отчёт по ливневой канализации"],
  "Инспекция ▾": ["Проверить сеть","Найти нарушения","Отчёт по сети"],
  "Генерировать отчёт ▾": ["Сводный отчёт","Отчёт по поверхности","Отчёт по коридору","Отчёт по сети","Отчёт по трассе"],
  // Вид
  "Пользовательский ▾": ["Сохранить вид","Восстановить вид","Диспетчер видов"],
  "2 видовых экрана ▾": ["Горизонтально","Вертикально"],
  "Орбита ▾": ["Свободная орбита","Ограниченная орбита","Непрерывная орбита"],
  "Зум ▾": ["Вписать всё","Окном","Масштаб","Центр","Предыдущий"],
  "Изометрия ЮЗ ▾": ["ЮЗ изометрия","ЮВ изометрия","СВ изометрия","СЗ изометрия","Сверху","Спереди","Справа"],
  // Управление
  "Диспетчер стилей марок ▾": ["Трассы","Профили","Коридоры","Трубопроводы","Сооружения","Поверхности"],
  // Вывод
  "Печать ▾": ["Печать","Быстрая печать","Пакетная печать"],
  "DWF ▾": ["Публикация в DWF","Публикация в 3D DWF"],
  "PDF ▾": ["Текущий лист","Все листы","Выбранные листы","PDF высокого качества"],
  "Комплекты листов ▾": ["Открыть комплект","Новый комплект","Опубликовать комплект"],
  // Геодезия
  "Создать точки ▾": ["Вручную","По координатам","Из файла CSV","По трассе","По поверхности","По геометрии","Интерполяция"],
  "Группы точек ▾": ["Создать группу точек","Редактировать группу","Удалить группу","Свойства"],
  "Открыть БД ▾": ["Новая база данных съёмки","Открыть существующую","Импорт данных съёмки","Экспорт данных съёмки"],
  "TIN-поверхность ▾": ["Из точек","Из фигур","Из горизонталей","Из файла DEM","Редактировать TIN"],
  "Grid-поверхность ▾": ["Из файла","Из TIN-поверхности","Параметры сетки"],
  // Ж/д путь
  "Трасса ж/д ▾": ["Создать трассу ж/д","Из полилинии","Редактировать трассу ж/д"],
  "Кант ▾": ["Создать кант","Редактировать кант","Свойства канта"],
  "Проект пути ▾": ["Расположение пути","Профиль ж/д","Проект канта"],
  "Разъезды и пересечения ▾": ["Создать разъезд","Создать пересечение","Редактировать"],
  "Мосты ▾": ["Создать мост","Редактировать мост","Свойства моста"],
  "Профиль ж/д ▾": ["Создать профиль ж/д","Редактировать профиль","Свойства профиля"],
  "Поперечник ж/д ▾": ["Создать поперечник","Редактировать","Виды поперечников"],
  // Прозрачность
  "Объект точки ▾": ["Номер точки","Имя точки","Объект точки"],
  "Пикет и смещение ▾": ["Пикет и смещение","Пикет профиля и отметка","Смещение поперечника и отметка"],
  // Надстройки / Express
  "Библиотека ТС ▾": ["Легковой автомобиль","Грузовик (фура)","Автобус","Пожарная машина","Пользовательский"],
  "Блок ▾": ["Список блоков","Супер штриховка","Конвертировать текст в блок","Разбить блок"],
  "Выравнивание текста ▾": ["По левому краю","По центру","По правому краю","Вписать","Выровнять"],
  "Сплющить ▾": ["Сплющить","На отметку","Конвертировать в полилинию"],
  "Изолировать слой ▾": ["Изолировать слой","Снять изоляцию","Перебор слоёв"],
  "Добавить транспорт ▾": ["Добавить транспорт","Изменить транспорт","Удалить транспорт"],
  "Управление расширениями ▾": ["Установленные расширения","Найти расширения","Обновить"],
  // Геолокация
  "Тип карты ▾": ["Спутник","Схема","Гибрид","Рельеф"],
  "Задать местоположение ▾": ["С карты","По ГНСС","Ввести вручную"],
  "Переопубликовать ▾": ["Переопубликовать DWG","Переопубликовать PDF"],
  // Совместная работа
  "Создать ярлык ▾": ["Поверхности","Трассы","Трубопроводные сети","Коридоры","Группы видовых рамок"],
  // Очистить (Express)
  "Очистить ▾": ["Очистить всё","Блоки","Слои","Стили текста","Стили размеров"],
}

// ─── Canvas drawing ──────────────────────────────────────────────────────────

function drawCanvas(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  visLayers: Record<string, boolean>, zoom: number,
  panX: number, panY: number, viewMode: string
) {
  ctx.clearRect(0, 0, W, H)
  const bg = viewMode === "wireframe" ? "#1a1a2e" : "#f0ede8"
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

  ctx.save()
  ctx.translate(panX, panY)
  ctx.scale(zoom, zoom)

  // grid
  if (visLayers.grid) {
    ctx.strokeStyle = viewMode === "wireframe" ? "rgba(80,120,180,0.2)" : "rgba(180,160,140,0.4)"
    ctx.lineWidth = 0.5 / zoom
    for (let x = -200; x < 1200; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, -100); ctx.lineTo(x, 800); ctx.stroke()
    }
    for (let y = -100; y < 800; y += 50) {
      ctx.beginPath(); ctx.moveTo(-200, y); ctx.lineTo(1200, y); ctx.stroke()
    }
  }

  // terrain contours
  if (visLayers.surfaces) {
    const contourColors = viewMode === "wireframe"
      ? ["rgba(100,200,100,0.3)","rgba(120,220,120,0.4)","rgba(80,180,80,0.3)"]
      : ["rgba(160,140,100,0.35)","rgba(140,120,80,0.3)","rgba(180,160,120,0.25)"]
    contourColors.forEach((col, ci) => {
      ctx.strokeStyle = col; ctx.lineWidth = (1 + ci * 0.3) / zoom
      for (let i = 0; i < 8; i++) {
        ctx.beginPath()
        const yBase = 30 + i * 40 + ci * 12
        ctx.moveTo(-50, yBase)
        for (let x = -50; x <= 980; x += 20) {
          const y = yBase + Math.sin(x * 0.018 + i) * 18 + Math.cos(x * 0.008 + ci) * 10
          ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
    })
  }

  // alignments
  if (visLayers.alignments) {
    ALIGNMENTS.forEach(al => {
      if (al.pts.length < 2) return
      ctx.beginPath()
      ctx.moveTo(al.pts[0][0], al.pts[0][1])
      for (let i = 1; i < al.pts.length; i++) ctx.lineTo(al.pts[i][0], al.pts[i][1])
      if (al.id === "perimeter") ctx.closePath()
      ctx.strokeStyle = al.color; ctx.lineWidth = 2.5 / zoom; ctx.stroke()
      // stations
      al.pts.forEach((pt, i) => {
        if (i % 2 === 0) {
          ctx.beginPath(); ctx.arc(pt[0], pt[1], 3 / zoom, 0, Math.PI * 2)
          ctx.fillStyle = al.color; ctx.fill()
        }
      })
      // label
      const mid = al.pts[Math.floor(al.pts.length / 2)]
      ctx.fillStyle = al.color; ctx.font = `bold ${11 / zoom}px monospace`
      ctx.fillText(al.name, mid[0] + 5, mid[1] - 6)
    })
  }

  // corridors / hatching
  if (visLayers.corridors) {
    ctx.save()
    ctx.globalAlpha = 0.18
    const grad = ctx.createLinearGradient(80, 60, 880, 100)
    grad.addColorStop(0, "#f97316"); grad.addColorStop(1, "#fb923c")
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.moveTo(80, 50); ctx.lineTo(880, 62); ctx.lineTo(880, 95); ctx.lineTo(80, 78)
    ctx.closePath(); ctx.fill()
    ctx.globalAlpha = 0.12
    ctx.fillStyle = "#a855f7"
    ctx.beginPath()
    ctx.moveTo(100, 170); ctx.lineTo(840, 178); ctx.lineTo(840, 205); ctx.lineTo(100, 198)
    ctx.closePath(); ctx.fill()
    ctx.restore()
  }

  // parking lot outline
  if (visLayers.sites) {
    ctx.strokeStyle = viewMode === "wireframe" ? "#facc15" : "#ca8a04"
    ctx.lineWidth = 1.5 / zoom; ctx.setLineDash([6 / zoom, 3 / zoom])
    ctx.beginPath()
    ctx.moveTo(140, 120); ctx.lineTo(300, 120); ctx.lineTo(300, 330)
    ctx.lineTo(140, 330); ctx.closePath(); ctx.stroke()
    ctx.setLineDash([])
    // parking stalls
    ctx.strokeStyle = viewMode === "wireframe" ? "rgba(250,204,21,0.5)" : "rgba(202,138,4,0.5)"
    ctx.lineWidth = 0.8 / zoom
    for (let y = 140; y < 320; y += 22) {
      ctx.beginPath(); ctx.moveTo(140, y); ctx.lineTo(300, y); ctx.stroke()
    }
    for (let x = 160; x < 300; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 120); ctx.lineTo(x, 330); ctx.stroke()
    }
  }

  // pipe network
  if (visLayers.pipenet) {
    ctx.strokeStyle = "#6366f1"; ctx.lineWidth = 2 / zoom
    const pipePts: [number,number][] = [[120,280],[180,275],[240,268],[300,260],[360,255],[420,258],[480,265]]
    ctx.beginPath(); ctx.moveTo(pipePts[0][0], pipePts[0][1])
    pipePts.slice(1).forEach(p => ctx.lineTo(p[0], p[1])); ctx.stroke()
    pipePts.forEach(p => {
      ctx.beginPath(); ctx.arc(p[0], p[1], 4/zoom, 0, Math.PI*2)
      ctx.fillStyle="#6366f1"; ctx.fill()
    })
  }

  // points
  if (visLayers.points) {
    const pts: [number,number,string][] = [[95,55,"1001"],[305,108,"1002"],[485,78,"1003"],[680,92,"1004"],[870,68,"1005"]]
    pts.forEach(([x,y,lbl]) => {
      ctx.beginPath(); ctx.arc(x, y, 4/zoom, 0, Math.PI*2)
      ctx.fillStyle="#f59e0b"; ctx.fill()
      ctx.strokeStyle="white"; ctx.lineWidth=1/zoom; ctx.stroke()
      ctx.fillStyle="#f59e0b"; ctx.font=`${9/zoom}px monospace`
      ctx.fillText(lbl, x+5, y-4)
    })
  }

  // axis
  ctx.strokeStyle = "rgba(100,100,100,0.6)"; ctx.lineWidth = 1/zoom
  ctx.beginPath(); ctx.moveTo(-30,380); ctx.lineTo(0,380); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(-30,380); ctx.lineTo(-30,350); ctx.stroke()
  ctx.fillStyle="#666"; ctx.font=`${9/zoom}px sans-serif`
  ctx.fillText("X",2,383); ctx.fillText("Z",-33,348)

  ctx.restore()

  // ── Profile View (top-right panel, like Civil 3D) ──────────────────────────
  const pvX = W * 0.53, pvY = 12, pvW = W * 0.44, pvH = 90
  // outer border
  ctx.fillStyle = viewMode === "wireframe" ? "#111122" : "#fafaf5"
  ctx.fillRect(pvX, pvY, pvW, pvH)
  ctx.strokeStyle = "#60a5fa"; ctx.lineWidth = 1; ctx.strokeRect(pvX, pvY, pvW, pvH)
  // grid inside profile view
  ctx.strokeStyle = viewMode === "wireframe" ? "rgba(100,120,200,0.25)" : "rgba(160,160,120,0.3)"
  ctx.lineWidth = 0.5
  for (let gx = pvX + 20; gx < pvX + pvW; gx += 20) {
    ctx.beginPath(); ctx.moveTo(gx, pvY); ctx.lineTo(gx, pvY + pvH); ctx.stroke()
  }
  for (let gy = pvY + 15; gy < pvY + pvH; gy += 15) {
    ctx.beginPath(); ctx.moveTo(pvX, gy); ctx.lineTo(pvX + pvW, gy); ctx.stroke()
  }
  // station ticks at bottom
  ctx.strokeStyle = "#6b7280"; ctx.lineWidth = 0.8
  for (let t = 0; t <= 10; t++) {
    const tx = pvX + 10 + t * (pvW - 20) / 10
    ctx.beginPath(); ctx.moveTo(tx, pvY + pvH - 10); ctx.lineTo(tx, pvY + pvH); ctx.stroke()
    ctx.fillStyle = "#6b7280"; ctx.font = "7px monospace"
    ctx.fillText(`${t * 100}`, tx - 8, pvY + pvH - 2)
  }
  // existing ground profile (red/pink line)
  ctx.beginPath(); ctx.strokeStyle = "#f87171"; ctx.lineWidth = 1.5
  const egPts = [0,4,8,6,12,10,7,5,9,11,8].map((v, i) => ({
    x: pvX + 10 + i * (pvW - 20) / 10,
    y: pvY + 20 + (15 - v * 2)
  }))
  egPts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
  ctx.stroke()
  // design profile (orange line)
  ctx.beginPath(); ctx.strokeStyle = "#fb923c"; ctx.lineWidth = 2
  const dpPts = [2,5,9,9,9,8,7,7,8,10,9].map((v, i) => ({
    x: pvX + 10 + i * (pvW - 20) / 10,
    y: pvY + 20 + (15 - v * 2)
  }))
  dpPts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
  ctx.stroke()
  // label
  ctx.fillStyle = viewMode==="wireframe"?"#60a5fa":"#1d4ed8"; ctx.font = "bold 8px Arial"
  ctx.fillText("Вторая улица  ВП  0+000 м ... 1000 м", pvX + 4, pvY + 10)

  // ── Second profile view (below) ──────────────────────────────────────────
  const pv2Y = pvY + pvH + 8
  const pv2H = 72
  ctx.fillStyle = viewMode === "wireframe" ? "#111122" : "#fafaf5"
  ctx.fillRect(pvX, pv2Y, pvW * 0.75, pv2H)
  ctx.strokeStyle = "#818cf8"; ctx.lineWidth = 1; ctx.strokeRect(pvX, pv2Y, pvW * 0.75, pv2H)
  ctx.strokeStyle = viewMode === "wireframe" ? "rgba(100,120,200,0.2)" : "rgba(140,140,100,0.25)"
  ctx.lineWidth = 0.5
  for (let gx = pvX + 18; gx < pvX + pvW * 0.75; gx += 18) {
    ctx.beginPath(); ctx.moveTo(gx, pv2Y); ctx.lineTo(gx, pv2Y + pv2H); ctx.stroke()
  }
  for (let gy = pv2Y + 12; gy < pv2Y + pv2H; gy += 12) {
    ctx.beginPath(); ctx.moveTo(pvX, gy); ctx.lineTo(pvX + pvW * 0.75, gy); ctx.stroke()
  }
  // station ticks
  for (let t = 0; t <= 8; t++) {
    const tx = pvX + 8 + t * (pvW * 0.75 - 16) / 8
    ctx.strokeStyle="#6b7280"; ctx.lineWidth=0.8
    ctx.beginPath(); ctx.moveTo(tx, pv2Y + pv2H - 8); ctx.lineTo(tx, pv2Y + pv2H); ctx.stroke()
    ctx.fillStyle="#6b7280"; ctx.font="7px monospace"
    ctx.fillText(`${t * 80}`, tx - 6, pv2Y + pv2H - 1)
  }
  ctx.beginPath(); ctx.strokeStyle = "#f87171"; ctx.lineWidth = 1.5
  const eg2 = [3,6,9,8,7,10,9,8,11].map((v,i)=>({
    x: pvX + 8 + i*(pvW*0.75-16)/8, y: pv2Y+15+(12-v*1.5)
  }))
  eg2.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y)); ctx.stroke()
  ctx.beginPath(); ctx.strokeStyle = "#fb923c"; ctx.lineWidth = 2
  const dp2 = [4,7,9,9,8,9,9,8,10].map((v,i)=>({
    x: pvX + 8 + i*(pvW*0.75-16)/8, y: pv2Y+15+(12-v*1.5)
  }))
  dp2.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y)); ctx.stroke()
  ctx.fillStyle = viewMode==="wireframe"?"#818cf8":"#4f46e5"; ctx.font="bold 8px Arial"
  ctx.fillText("Ул. Трумана  ВП  0+000 м ... 640 м", pvX + 4, pv2Y + 9)

  ctx.restore()
}

// ─── Surface Dialog ──────────────────────────────────────────────────────────

function SurfaceDialog({ onClose, onOK }: { onClose: () => void; onOK: (d: SurfaceDef) => void }) {
  const SURF_STYLES = ["Стандарт", "Горизонтали 1м", "Горизонтали 5м", "Без отображения", "Анализ уклонов"]
  const [def, setDef] = useState<SurfaceDef>({
    name: "Существующая поверхность", description: "", type: "TIN",
    style: "Горизонтали 1м", layer: "C-TOPO-SURF", gridX: "10", gridY: "10",
    pointFiles: [{ name: "Точки_съёмки.csv", format: "CSV (N,E,Z,Desc)" }],
  })
  const [tab, setTab] = useState<"info" | "build" | "analysis">("info")
  const [addFile, setAddFile] = useState("")
  const [addFormat, setAddFormat] = useState("CSV (N,E,Z,Desc)")
  const FORMATS = ["CSV (N,E,Z,Desc)", "TXT (X,Y,Z)", "LandXML", "DEM/GeoTIFF", "Облако точек RCP"]

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
        className="bg-[#f0f0f0] border border-gray-400 shadow-2xl w-[560px] max-h-[90vh] overflow-y-auto"
        style={{ fontFamily: "Arial, sans-serif", fontSize: 12 }}>
        <div className="flex items-center justify-between bg-[#0078d4] px-3 py-1.5">
          <span className="text-white font-bold text-sm">Создать поверхность</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 w-5 h-5 flex items-center justify-center">✕</button>
        </div>
        {/* Tabs */}
        <div className="flex border-b border-gray-300 bg-[#e8e8e8]">
          {(["info","build","analysis"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-xs font-semibold border-r border-gray-300 transition-colors ${tab===t?"bg-white text-blue-700":"text-gray-600 hover:bg-gray-100"}`}>
              {t==="info"?"Информация":t==="build"?"Построение":"Анализ"}
            </button>
          ))}
        </div>
        <div className="p-3 space-y-2">
          {tab === "info" && <>
            <div className="flex items-center gap-2">
              <label className="w-28 text-xs text-gray-700 shrink-0">Тип поверхности:</label>
              <div className="flex gap-3">
                {(["TIN","Grid"] as const).map(t => (
                  <label key={t} className="flex items-center gap-1 text-xs cursor-pointer">
                    <input type="radio" checked={def.type===t} onChange={() => setDef(d=>({...d,type:t}))} />
                    <span className="font-semibold">{t}</span>
                    <span className="text-gray-500">{t==="TIN"?"— триангуляция":"— регулярная сетка"}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-28 text-xs text-gray-700 shrink-0">Название:</label>
              <input value={def.name} onChange={e=>setDef(d=>({...d,name:e.target.value}))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
              <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">⋯</button>
            </div>
            <div className="flex items-start gap-2">
              <label className="w-28 text-xs text-gray-700 shrink-0 mt-1">Описание:</label>
              <textarea value={def.description} onChange={e=>setDef(d=>({...d,description:e.target.value}))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white h-10 resize-none" />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-28 text-xs text-gray-700 shrink-0">Стиль:</label>
              <select value={def.style} onChange={e=>setDef(d=>({...d,style:e.target.value}))} className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
                {SURF_STYLES.map(s=><option key={s}>{s}</option>)}
              </select>
              <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">⋯</button>
              <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">✎</button>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-28 text-xs text-gray-700 shrink-0">Слой:</label>
              <input value={def.layer} onChange={e=>setDef(d=>({...d,layer:e.target.value}))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
            </div>
            {def.type==="Grid" && <div className="flex items-center gap-2">
              <label className="w-28 text-xs text-gray-700 shrink-0">Шаг сетки (м):</label>
              <span className="text-xs text-gray-600">X:</span>
              <input value={def.gridX} onChange={e=>setDef(d=>({...d,gridX:e.target.value}))} className="w-16 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
              <span className="text-xs text-gray-600">Y:</span>
              <input value={def.gridY} onChange={e=>setDef(d=>({...d,gridY:e.target.value}))} className="w-16 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
            </div>}
          </>}

          {tab === "build" && <>
            <div className="border border-gray-400 bg-white">
              <div className="bg-[#d0d0d0] px-2 py-1 flex items-center gap-1 font-bold text-xs border-b border-gray-400">
                <span className="text-blue-600">▼</span> Источники данных
              </div>
              <div className="flex items-center gap-1 bg-[#e8e8e8] border-b border-gray-300 text-xs font-semibold px-2 py-0.5">
                <span className="flex-1">Файл / источник</span>
                <span className="w-40">Формат</span>
              </div>
              <div className="max-h-36 overflow-y-auto">
                {def.pointFiles.map((f,i) => (
                  <div key={i} className={`flex items-center px-2 py-1 text-xs border-b border-gray-100 ${i%2===0?"bg-white":"bg-gray-50"}`}>
                    <span className="flex-1 text-blue-700 font-mono">{f.name}</span>
                    <span className="w-40 text-gray-600">{f.format}</span>
                    <button onClick={() => setDef(d=>({...d,pointFiles:d.pointFiles.filter((_,j)=>j!==i)}))}
                      className="text-gray-400 hover:text-red-500 ml-2 text-xs">✕</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <div className="text-xs text-gray-600 mb-0.5">Файл:</div>
                <input value={addFile} onChange={e=>setAddFile(e.target.value)} placeholder="имя_файла.csv" className="w-full border border-gray-400 px-2 py-0.5 text-xs bg-white" />
              </div>
              <div className="w-44">
                <div className="text-xs text-gray-600 mb-0.5">Формат:</div>
                <select value={addFormat} onChange={e=>setAddFormat(e.target.value)} className="w-full border border-gray-400 px-1 py-0.5 text-xs bg-white">
                  {FORMATS.map(f=><option key={f}>{f}</option>)}
                </select>
              </div>
              <button onClick={() => { if(addFile){setDef(d=>({...d,pointFiles:[...d.pointFiles,{name:addFile,format:addFormat}]}));setAddFile("")}}}
                className="px-3 py-1 bg-[#0078d4] text-white text-xs border border-blue-700 hover:bg-blue-700">Добавить</button>
            </div>
            <p className="text-[10px] text-gray-500">После добавления источников нажмите ОК — поверхность будет построена и добавлена в дерево проекта.</p>
          </>}

          {tab === "analysis" && <>
            <div className="space-y-2">
              {[
                { label: "Анализ уклонов", desc: "Диапазоны уклонов с цветовой заливкой по категориям", icon: "🎨" },
                { label: "Анализ высот", desc: "Градиентная заливка по отметкам от min до max", icon: "📊" },
                { label: "Стрелки уклонов", desc: "Направление стока воды по рельефу", icon: "↓" },
                { label: "Водосборные бассейны", desc: "Автоматическое разбиение на водосборные зоны", icon: "💧" },
              ].map(a => (
                <label key={a.label} className="flex items-start gap-2 p-2 border border-gray-200 bg-white rounded cursor-pointer hover:bg-blue-50 transition-colors">
                  <input type="checkbox" className="mt-0.5 accent-blue-600" />
                  <span className="text-lg leading-none">{a.icon}</span>
                  <div>
                    <div className="text-xs font-semibold text-gray-800">{a.label}</div>
                    <div className="text-[10px] text-gray-500">{a.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </>}
        </div>
        <div className="flex justify-end gap-2 px-3 pb-3">
          <button onClick={() => onOK(def)} className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">ОК</button>
          <button onClick={onClose} className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">Отмена</button>
          <button className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">Справка</button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Alignment Dialog ─────────────────────────────────────────────────────────

function AlignmentDialog({ onClose, onOK }: { onClose: () => void; onOK: (d: AlignmentDef) => void }) {
  const AL_TYPES = ["Осевая линия дороги","Пешеходная дорожка","Рельсовый путь","Бордюрная линия","Произвольная"]
  const AL_STYLES = ["Базовый","Автодорога","Ж/д путь","Без отображения"]
  const [def, setDef] = useState<AlignmentDef>({
    name: "Трасса-1", description: "", type: AL_TYPES[0],
    startStation: "0+00", stationIncrement: "20",
    style: "Автодорога", layer: "C-ROAD-ALIGN",
    elements: [
      { type: "line", length: "250.00", radius: "—", Az: "45°12′30″", A: "—" },
      { type: "spiral", length: "60.00", radius: "300", Az: "—", A: "60" },
      { type: "curve", length: "314.16", radius: "300", Az: "—", A: "—" },
      { type: "spiral", length: "60.00", radius: "300", Az: "—", A: "60" },
      { type: "line", length: "180.00", radius: "—", Az: "105°45′00″", A: "—" },
    ],
  })
  const [tab, setTab] = useState<"info"|"geom"|"station">("info")
  const TYPE_LABELS: Record<string,string> = { line: "Прямая", curve: "Круговая кривая", spiral: "Клотоида" }
  const TYPE_COLORS: Record<string,string> = { line: "text-blue-700", curve: "text-orange-600", spiral: "text-green-700" }

  const addElement = (type: "line"|"curve"|"spiral") => {
    setDef(d=>({...d, elements:[...d.elements, { type, length:"100.00", radius: type==="line"?"—":"500", Az: type==="line"?"0°00′00″":"—", A: type==="spiral"?"50":"—" }]}))
  }
  const removeEl = (i: number) => setDef(d=>({...d, elements:d.elements.filter((_,j)=>j!==i)}))

  const totalLength = def.elements.reduce((s,e) => s + (parseFloat(e.length)||0), 0)

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
        className="bg-[#f0f0f0] border border-gray-400 shadow-2xl w-[600px] max-h-[90vh] overflow-y-auto"
        style={{ fontFamily: "Arial, sans-serif", fontSize: 12 }}>
        <div className="flex items-center justify-between bg-[#0078d4] px-3 py-1.5">
          <span className="text-white font-bold text-sm">Создать трассу</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 w-5 h-5 flex items-center justify-center">✕</button>
        </div>
        <div className="flex border-b border-gray-300 bg-[#e8e8e8]">
          {(["info","geom","station"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`px-4 py-1.5 text-xs font-semibold border-r border-gray-300 transition-colors ${tab===t?"bg-white text-blue-700":"text-gray-600 hover:bg-gray-100"}`}>
              {t==="info"?"Информация":t==="geom"?"Геометрия элементов":"Пикетаж"}
            </button>
          ))}
        </div>
        <div className="p-3 space-y-2">
          {tab==="info" && <>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0">Название:</label>
              <input value={def.name} onChange={e=>setDef(d=>({...d,name:e.target.value}))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
              <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">⋯</button>
            </div>
            <div className="flex items-start gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0 mt-1">Описание:</label>
              <textarea value={def.description} onChange={e=>setDef(d=>({...d,description:e.target.value}))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white h-10 resize-none" />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0">Тип трассы:</label>
              <select value={def.type} onChange={e=>setDef(d=>({...d,type:e.target.value}))} className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
                {AL_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0">Стиль:</label>
              <select value={def.style} onChange={e=>setDef(d=>({...d,style:e.target.value}))} className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
                {AL_STYLES.map(s=><option key={s}>{s}</option>)}
              </select>
              <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">✎</button>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0">Слой:</label>
              <input value={def.layer} onChange={e=>setDef(d=>({...d,layer:e.target.value}))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
            </div>
            <div className="flex items-center gap-2 mt-1 p-2 bg-blue-50 border border-blue-200 rounded">
              <span className="text-xs text-blue-700 font-semibold">Общая длина трассы:</span>
              <span className="text-xs font-mono font-bold text-blue-900">{totalLength.toFixed(2)} м</span>
            </div>
          </>}

          {tab==="geom" && <>
            <div className="border border-gray-400 bg-white">
              <div className="bg-[#d0d0d0] px-2 py-1 flex items-center gap-1 font-bold text-xs border-b border-gray-400">
                <span className="text-blue-600">▼</span> Элементы геометрии
                <div className="ml-auto flex gap-1">
                  {([["line","Пр"],["curve","КК"],["spiral","КЛ"]] as [string,string][]).map(([t,l])=>(
                    <button key={t} onClick={()=>addElement(t as "line"|"curve"|"spiral")}
                      className="px-2 py-0.5 bg-[#0078d4] text-white text-[10px] hover:bg-blue-700">+ {l}</button>
                  ))}
                </div>
              </div>
              <table className="w-full text-xs">
                <thead className="bg-[#e8e8e8] border-b border-gray-300">
                  <tr>
                    <th className="px-2 py-1 text-left font-semibold border-r border-gray-200 w-8">#</th>
                    <th className="px-2 py-1 text-left font-semibold border-r border-gray-200 w-28">Тип</th>
                    <th className="px-2 py-1 text-left font-semibold border-r border-gray-200">Длина (м)</th>
                    <th className="px-2 py-1 text-left font-semibold border-r border-gray-200">R (м)</th>
                    <th className="px-2 py-1 text-left font-semibold border-r border-gray-200">Азимут / A</th>
                    <th className="px-1 py-1 w-6"></th>
                  </tr>
                </thead>
                <tbody>
                  {def.elements.map((el,i)=>(
                    <tr key={i} className={i%2===0?"bg-white":"bg-gray-50"}>
                      <td className="px-2 py-1 border-r border-gray-100 text-gray-500">{i+1}</td>
                      <td className={`px-2 py-1 border-r border-gray-100 font-semibold ${TYPE_COLORS[el.type]}`}>{TYPE_LABELS[el.type]}</td>
                      <td className="px-1 py-0.5 border-r border-gray-100">
                        <input value={el.length} onChange={e=>{const els=[...def.elements];els[i]={...els[i],length:e.target.value};setDef(d=>({...d,elements:els}))}}
                          className="w-full bg-transparent outline-none text-xs font-mono" />
                      </td>
                      <td className="px-1 py-0.5 border-r border-gray-100">
                        <input value={el.radius} onChange={e=>{const els=[...def.elements];els[i]={...els[i],radius:e.target.value};setDef(d=>({...d,elements:els}))}}
                          className="w-full bg-transparent outline-none text-xs font-mono" disabled={el.type==="line"} />
                      </td>
                      <td className="px-1 py-0.5 border-r border-gray-100 font-mono text-[10px] text-gray-600">
                        {el.type==="line"?el.Az:el.type==="spiral"?`A=${el.A}`:"—"}
                      </td>
                      <td className="px-1 py-0.5">
                        <button onClick={()=>removeEl(i)} className="text-gray-400 hover:text-red-500">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#e8e8e8] border-t border-gray-300">
                  <tr><td colSpan={2} className="px-2 py-1 text-xs font-bold">Итого:</td>
                    <td className="px-2 py-1 text-xs font-bold font-mono">{totalLength.toFixed(2)}</td>
                    <td colSpan={3}></td></tr>
                </tfoot>
              </table>
            </div>
          </>}

          {tab==="station" && <>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <label className="w-36 text-xs text-gray-700 shrink-0">Начало пикетажа:</label>
                <input value={def.startStation} onChange={e=>setDef(d=>({...d,startStation:e.target.value}))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white font-mono" />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-36 text-xs text-gray-700 shrink-0">Шаг пикетажа (м):</label>
                <input value={def.stationIncrement} onChange={e=>setDef(d=>({...d,stationIncrement:e.target.value}))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white font-mono" />
              </div>
            </div>
            <div className="border border-gray-300 bg-white p-3 rounded space-y-1">
              <div className="text-xs font-semibold text-gray-700 mb-2">Разбивочные элементы:</div>
              {def.elements.map((el,i) => {
                const pk = def.elements.slice(0,i).reduce((s,e)=>s+(parseFloat(e.length)||0),0)
                return (
                  <div key={i} className="flex gap-2 text-xs text-gray-600 font-mono">
                    <span className="w-6 text-gray-400">{i+1}.</span>
                    <span className={`w-28 font-semibold ${TYPE_COLORS[el.type]}`}>{TYPE_LABELS[el.type]}</span>
                    <span>ПК {(pk/100).toFixed(0).padStart(2,"0")}+{String(pk%100).padStart(2,"0")} … ПК {((pk+(parseFloat(el.length)||0))/100).toFixed(0).padStart(2,"0")}+{String(Math.round((pk+(parseFloat(el.length)||0))%100)).padStart(2,"0")}</span>
                    <span className="text-gray-400 ml-auto">{el.length} м</span>
                  </div>
                )
              })}
              <div className="border-t border-gray-200 mt-2 pt-2 flex gap-2 text-xs font-bold">
                <span className="text-gray-600">Конец трассы:</span>
                <span className="font-mono text-blue-700">ПК {(totalLength/100).toFixed(0).padStart(2,"0")}+{String(Math.round(totalLength%100)).padStart(2,"0")}</span>
              </div>
            </div>
          </>}
        </div>
        <div className="flex justify-end gap-2 px-3 pb-3">
          <button onClick={()=>onOK(def)} className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">ОК</button>
          <button onClick={onClose} className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">Отмена</button>
          <button className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">Справка</button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Profile Dialog ───────────────────────────────────────────────────────────

function ProfileDialog({ onClose, onOK, alignments }: { onClose: () => void; onOK: (d: ProfileDef) => void; alignments: string[] }) {
  const PROF_STYLES = ["Базовый","Профиль разработки","Существующий рельеф","Без отображения"]
  const [def, setDef] = useState<ProfileDef>({
    name: "Проект_Трасса-1", alignment: alignments[0] || "Трасса ШД-38",
    surface: "Существующая поверхность", description: "", style: "Профиль разработки", layer: "C-ROAD-PROF",
    pvcs: [
      { station: "0+00", elev: "120.50", k: "—" },
      { station: "2+50", elev: "125.80", k: "40" },
      { station: "5+00", elev: "122.30", k: "60" },
      { station: "8+00", elev: "118.90", k: "35" },
      { station: "10+00", elev: "121.40", k: "—" },
    ],
  })
  const [tab, setTab] = useState<"info"|"pvc"|"preview">("info")
  const [newSt, setNewSt] = useState(""); const [newEl, setNewEl] = useState(""); const [newK, setNewK] = useState("—")

  const addPVC = () => {
    if (!newSt || !newEl) return
    setDef(d=>({...d, pvcs: [...d.pvcs, {station:newSt, elev:newEl, k:newK}].sort((a,b)=>{
      const parse = (s:string) => { const [pk,m]=s.split("+"); return +(pk||0)*100+(+(m||0)) }
      return parse(a.station)-parse(b.station)
    })}))
    setNewSt(""); setNewEl(""); setNewK("—")
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
        className="bg-[#f0f0f0] border border-gray-400 shadow-2xl w-[580px] max-h-[90vh] overflow-y-auto"
        style={{ fontFamily: "Arial, sans-serif", fontSize: 12 }}>
        <div className="flex items-center justify-between bg-[#0078d4] px-3 py-1.5">
          <span className="text-white font-bold text-sm">Создать профиль разработки</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 w-5 h-5 flex items-center justify-center">✕</button>
        </div>
        <div className="flex border-b border-gray-300 bg-[#e8e8e8]">
          {(["info","pvc","preview"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`px-4 py-1.5 text-xs font-semibold border-r border-gray-300 transition-colors ${tab===t?"bg-white text-blue-700":"text-gray-600 hover:bg-gray-100"}`}>
              {t==="info"?"Информация":t==="pvc"?"Точки ВК":"Предпросмотр"}
            </button>
          ))}
        </div>
        <div className="p-3 space-y-2">
          {tab==="info" && <>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0">Трасса:</label>
              <select value={def.alignment} onChange={e=>setDef(d=>({...d,alignment:e.target.value}))} className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
                {alignments.map(a=><option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0">Поверхность рельефа:</label>
              <select value={def.surface} onChange={e=>setDef(d=>({...d,surface:e.target.value}))} className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
                {["Существующая поверхность","Проектная поверхность"].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0">Название профиля:</label>
              <input value={def.name} onChange={e=>setDef(d=>({...d,name:e.target.value}))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0">Стиль:</label>
              <select value={def.style} onChange={e=>setDef(d=>({...d,style:e.target.value}))} className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
                {PROF_STYLES.map(s=><option key={s}>{s}</option>)}
              </select>
              <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">✎</button>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0">Слой:</label>
              <input value={def.layer} onChange={e=>setDef(d=>({...d,layer:e.target.value}))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
            </div>
          </>}

          {tab==="pvc" && <>
            <div className="border border-gray-400 bg-white">
              <div className="bg-[#d0d0d0] px-2 py-1 flex items-center gap-1 font-bold text-xs border-b border-gray-400">
                <span className="text-blue-600">▼</span> Вертикальные кривые (ВК)
              </div>
              <table className="w-full text-xs">
                <thead className="bg-[#e8e8e8] border-b border-gray-300">
                  <tr>
                    <th className="px-2 py-1 text-left font-semibold border-r border-gray-200">Пикет</th>
                    <th className="px-2 py-1 text-left font-semibold border-r border-gray-200">Отметка (м)</th>
                    <th className="px-2 py-1 text-left font-semibold border-r border-gray-200">Параметр K</th>
                    <th className="w-6"></th>
                  </tr>
                </thead>
                <tbody>
                  {def.pvcs.map((pvc,i)=>(
                    <tr key={i} className={i%2===0?"bg-white":"bg-gray-50"}>
                      <td className="px-1 py-0.5 border-r border-gray-100">
                        <input value={pvc.station} onChange={e=>{const p=[...def.pvcs];p[i]={...p[i],station:e.target.value};setDef(d=>({...d,pvcs:p}))}}
                          className="w-full bg-transparent outline-none font-mono text-xs" />
                      </td>
                      <td className="px-1 py-0.5 border-r border-gray-100">
                        <input value={pvc.elev} onChange={e=>{const p=[...def.pvcs];p[i]={...p[i],elev:e.target.value};setDef(d=>({...d,pvcs:p}))}}
                          className="w-full bg-transparent outline-none font-mono text-xs" />
                      </td>
                      <td className="px-1 py-0.5 border-r border-gray-100">
                        <input value={pvc.k} onChange={e=>{const p=[...def.pvcs];p[i]={...p[i],k:e.target.value};setDef(d=>({...d,pvcs:p}))}}
                          className="w-full bg-transparent outline-none font-mono text-xs" />
                      </td>
                      <td className="px-1"><button onClick={()=>setDef(d=>({...d,pvcs:d.pvcs.filter((_,j)=>j!==i)}))} className="text-gray-400 hover:text-red-500">✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 items-end">
              <div><div className="text-xs text-gray-600 mb-0.5">Пикет:</div><input value={newSt} onChange={e=>setNewSt(e.target.value)} placeholder="0+00" className="w-20 border border-gray-400 px-2 py-0.5 text-xs bg-white font-mono" /></div>
              <div><div className="text-xs text-gray-600 mb-0.5">Отметка:</div><input value={newEl} onChange={e=>setNewEl(e.target.value)} placeholder="120.00" className="w-20 border border-gray-400 px-2 py-0.5 text-xs bg-white font-mono" /></div>
              <div><div className="text-xs text-gray-600 mb-0.5">K:</div><input value={newK} onChange={e=>setNewK(e.target.value)} placeholder="—" className="w-14 border border-gray-400 px-2 py-0.5 text-xs bg-white font-mono" /></div>
              <button onClick={addPVC} className="px-3 py-1 bg-[#0078d4] text-white text-xs border border-blue-700 hover:bg-blue-700">+ ВК</button>
            </div>
          </>}

          {tab==="preview" && <>
            <div className="bg-[#1a1a2e] rounded border border-gray-600 p-2" style={{height:160}}>
              <svg width="100%" height="100%" viewBox="0 0 520 140">
                <line x1="20" y1="120" x2="500" y2="120" stroke="#444" strokeWidth="1"/>
                {def.pvcs.map((_,i)=>{
                  const x = 20 + i*(480/(def.pvcs.length-1||1))
                  return <line key={i} x1={x} y1="118" x2={x} y2="124" stroke="#666" strokeWidth="1"/>
                })}
                {def.pvcs.map((p,i)=>{
                  const x = 20 + i*(480/(def.pvcs.length-1||1))
                  const minE = Math.min(...def.pvcs.map(p=>parseFloat(p.elev)||0))
                  const maxE = Math.max(...def.pvcs.map(p=>parseFloat(p.elev)||0))
                  const range = maxE-minE || 1
                  const y = 110 - ((parseFloat(p.elev)||0)-minE)/range*80
                  return <text key={i} x={x} y="133" fill="#6b7280" fontSize="7" textAnchor="middle">{p.station}</text>
                })}
                <polyline
                  points={def.pvcs.map((p,i)=>{
                    const x = 20 + i*(480/(def.pvcs.length-1||1))
                    const minE = Math.min(...def.pvcs.map(p=>parseFloat(p.elev)||0))
                    const maxE = Math.max(...def.pvcs.map(p=>parseFloat(p.elev)||0))
                    const range = maxE-minE || 1
                    const y = 110 - ((parseFloat(p.elev)||0)-minE)/range*80
                    return `${x},${y}`
                  }).join(" ")}
                  fill="none" stroke="#f97316" strokeWidth="2"/>
                {def.pvcs.map((p,i)=>{
                  const x = 20 + i*(480/(def.pvcs.length-1||1))
                  const minE = Math.min(...def.pvcs.map(p=>parseFloat(p.elev)||0))
                  const maxE = Math.max(...def.pvcs.map(p=>parseFloat(p.elev)||0))
                  const range = maxE-minE || 1
                  const y = 110 - ((parseFloat(p.elev)||0)-minE)/range*80
                  return <g key={i}>
                    <circle cx={x} cy={y} r="3" fill="#f97316"/>
                    <text x={x} y={y-6} fill="#fb923c" fontSize="7" textAnchor="middle">{p.elev}</text>
                  </g>
                })}
                <text x="20" y="12" fill="#9ca3af" fontSize="8">Профиль: {def.name}</text>
              </svg>
            </div>
            <p className="text-[10px] text-gray-500 text-center">Предпросмотр продольного профиля. Оранжевая линия — профиль разработки.</p>
          </>}
        </div>
        <div className="flex justify-end gap-2 px-3 pb-3">
          <button onClick={()=>onOK(def)} className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">ОК</button>
          <button onClick={onClose} className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">Отмена</button>
          <button className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">Справка</button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Tree node component ─────────────────────────────────────────────────────

function TreeItem({ node, depth, selected, onSelect, onToggle, onAction }: {
  node: TreeNode; depth: number; selected: string | null
  onSelect: (id: string) => void; onToggle: (id: string) => void
  onAction?: (node: TreeNode) => void
}) {
  return (
    <>
      <div
        className={`flex items-center gap-0.5 cursor-pointer select-none transition-colors
          ${selected === node.id ? "bg-[#0078d4]" : "hover:bg-[#2a2a3e]"}`}
        style={{ paddingLeft: `${depth * 16 + 2}px`, paddingTop: 1, paddingBottom: 1, paddingRight: 4 }}
        onClick={() => onSelect(node.id)}
        onDoubleClick={() => { if (node.children) onToggle(node.id); else onAction?.(node) }}
        onContextMenu={e => { e.preventDefault(); onAction?.(node) }}
      >
        {/* expand arrow */}
        <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
          {node.children ? (
            <Icon name={node.expanded ? "ChevronDown" : "ChevronRight"} size={11}
              className="text-gray-400"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); onToggle(node.id) }} />
          ) : null}
        </span>
        {/* node icon */}
        <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
          <Icon name={node.icon} size={14} style={{ color: node.color || "#94a3b8" }} fallback="File" />
        </span>
        {/* label */}
        <span className="text-[12px] leading-5 text-gray-100 truncate ml-0.5">{node.label}</span>
      </div>
      {node.expanded && node.children?.map(child => (
        <TreeItem key={child.id} node={child} depth={depth + 1} selected={selected}
          onSelect={onSelect} onToggle={onToggle} onAction={onAction} />
      ))}
    </>
  )
}

// ─── Assembly Dialog ──────────────────────────────────────────────────────────

const ASSEMBLY_TEMPLATES = [
  {
    id: "road2",
    name: "2-полосная дорога (7 м)",
    description: "Автодорога III категории. Проезжая часть 7 м, обочины 2×2 м, откосы 1:1.5",
    preview: [
      { x: -100, y: 0, label: "" }, { x: -55, y: 0 }, { x: -35, y: 0 }, { x: 0, y: 0 }, { x: 35, y: 0 }, { x: 55, y: 0 }, { x: 100, y: 0 },
      { x: -55, y: 8 }, { x: 55, y: 8 },
    ],
    subassemblies: [
      { id: "sa1", name: "ПолосаДвижения", side: "Левый" as const, type: "Полоса движения", params: { "Ширина": "3.5", "Уклон, %": "-2.5", "Глубина покрытия, м": "0.18" } },
      { id: "sa2", name: "ПолосаДвижения", side: "Правый" as const, type: "Полоса движения", params: { "Ширина": "3.5", "Уклон, %": "2.5", "Глубина покрытия, м": "0.18" } },
      { id: "sa3", name: "Обочина", side: "Левый" as const, type: "Обочина укреплённая", params: { "Ширина": "2.0", "Уклон, %": "-4.0", "Тип укрепления": "Засев травой" } },
      { id: "sa4", name: "Обочина", side: "Правый" as const, type: "Обочина укреплённая", params: { "Ширина": "2.0", "Уклон, %": "4.0", "Тип укрепления": "Засев травой" } },
      { id: "sa5", name: "ОткосНасыпи", side: "Левый" as const, type: "Откос насыпи", params: { "Заложение": "1.5", "Высота, м": "авто" } },
      { id: "sa6", name: "ОткосНасыпи", side: "Правый" as const, type: "Откос насыпи", params: { "Заложение": "1.5", "Высота, м": "авто" } },
    ] as SubassemblyItem[]
  },
  {
    id: "road4",
    name: "4-полосная магистраль (28 м)",
    description: "Магистральная улица районного значения. Разделительная полоса 4 м, 4 полосы по 3.5 м",
    subassemblies: [
      { id: "sa1", name: "ПолосаДвижения_Л1", side: "Левый" as const, type: "Полоса движения", params: { "Ширина": "3.5", "Уклон, %": "-2.0" } },
      { id: "sa2", name: "ПолосаДвижения_Л2", side: "Левый" as const, type: "Полоса движения", params: { "Ширина": "3.5", "Уклон, %": "-2.0" } },
      { id: "sa3", name: "ПолосаДвижения_П1", side: "Правый" as const, type: "Полоса движения", params: { "Ширина": "3.5", "Уклон, %": "2.0" } },
      { id: "sa4", name: "ПолосаДвижения_П2", side: "Правый" as const, type: "Полоса движения", params: { "Ширина": "3.5", "Уклон, %": "2.0" } },
      { id: "sa5", name: "РазделительнаяПолоса", side: "Обе стороны" as const, type: "Разделительная полоса", params: { "Ширина": "2.0", "Тип": "Газон с бордюром" } },
      { id: "sa6", name: "Бордюр", side: "Левый" as const, type: "Бордюр", params: { "Тип": "Бортовой камень 100×300" } },
      { id: "sa7", name: "Бордюр", side: "Правый" as const, type: "Бордюр", params: { "Тип": "Бортовой камень 100×300" } },
      { id: "sa8", name: "Тротуар", side: "Левый" as const, type: "Тротуар", params: { "Ширина": "3.0", "Уклон, %": "-2.0" } },
      { id: "sa9", name: "Тротуар", side: "Правый" as const, type: "Тротуар", params: { "Ширина": "3.0", "Уклон, %": "2.0" } },
    ] as SubassemblyItem[]
  },
  {
    id: "ramp",
    name: "Съезд / пандус",
    description: "Съезд с дороги или пандус. Переменная ширина, сопряжение с основной трассой",
    subassemblies: [
      { id: "sa1", name: "ПолосаСъезда", side: "Правый" as const, type: "Полоса движения", params: { "Ширина": "4.5", "Уклон, %": "2.5" } },
      { id: "sa2", name: "Кромка", side: "Правый" as const, type: "Обочина укреплённая", params: { "Ширина": "1.0", "Уклон, %": "6.0" } },
      { id: "sa3", name: "ОткосСъезда", side: "Правый" as const, type: "Откос насыпи", params: { "Заложение": "2.0" } },
    ] as SubassemblyItem[]
  },
  {
    id: "railway",
    name: "Ж/д насыпь (1 путь)",
    description: "Однопутная ж/д насыпь по нормам СП 119. Балластный слой, берма, откос 1:1.5",
    subassemblies: [
      { id: "sa1", name: "Балласт", side: "Обе стороны" as const, type: "Балластный слой", params: { "Ширина основания, м": "4.6", "Глубина, м": "0.45", "Материал": "Щебень фр.25-60" } },
      { id: "sa2", name: "Берма", side: "Левый" as const, type: "Берма", params: { "Ширина": "0.5" } },
      { id: "sa3", name: "Берма", side: "Правый" as const, type: "Берма", params: { "Ширина": "0.5" } },
      { id: "sa4", name: "ОткосНасыпи_Л", side: "Левый" as const, type: "Откос насыпи", params: { "Заложение": "1.5" } },
      { id: "sa5", name: "ОткосНасыпи_П", side: "Правый" as const, type: "Откос насыпи", params: { "Заложение": "1.5" } },
      { id: "sa6", name: "КюветНасыпи_Л", side: "Левый" as const, type: "Кювет", params: { "Ширина дна": "0.4", "Глубина": "0.6", "Заложение": "1.5" } },
      { id: "sa7", name: "КюветНасыпи_П", side: "Правый" as const, type: "Кювет", params: { "Ширина дна": "0.4", "Глубина": "0.6", "Заложение": "1.5" } },
    ] as SubassemblyItem[]
  },
  {
    id: "canal",
    name: "Открытый канал (трапеция)",
    description: "Ирригационный или дренажный канал трапециевидного сечения. Укрепление откосов",
    subassemblies: [
      { id: "sa1", name: "ДноКанала", side: "Обе стороны" as const, type: "Дно канала", params: { "Ширина дна, м": "2.0", "Поперечный уклон, %": "0.0" } },
      { id: "sa2", name: "ОткосКанала_Л", side: "Левый" as const, type: "Откос выемки", params: { "Заложение": "1.5", "Укрепление": "Монолитный бетон" } },
      { id: "sa3", name: "ОткосКанала_П", side: "Правый" as const, type: "Откос выемки", params: { "Заложение": "1.5", "Укрепление": "Монолитный бетон" } },
      { id: "sa4", name: "БерегоукреплениеТело_Л", side: "Левый" as const, type: "Берма", params: { "Ширина": "2.0" } },
      { id: "sa5", name: "БерегоукреплениеТело_П", side: "Правый" as const, type: "Берма", params: { "Ширина": "2.0" } },
    ] as SubassemblyItem[]
  },
]

const SA_TYPES = [
  "Полоса движения","Обочина укреплённая","Обочина грунтовая",
  "Откос насыпи","Откос выемки","Бордюр","Тротуар",
  "Велодорожка","Разделительная полоса","Кювет",
  "Балластный слой","Берма","Дно канала","Газон",
  "Слой дорожной одежды","Субосновной слой",
]

function drawAssemblyPreview(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  subs: SubassemblyItem[]
) {
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = "#1a1a2e"; ctx.fillRect(0, 0, W, H)
  const cx = W / 2, cy = H * 0.55, sc = W / 22

  // ground line
  ctx.strokeStyle = "#4b5563"; ctx.lineWidth = 1; ctx.setLineDash([4, 3])
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke()
  ctx.setLineDash([])

  // center mark
  ctx.strokeStyle = "#6b7280"; ctx.lineWidth = 0.8
  ctx.beginPath(); ctx.moveTo(cx, cy - 6); ctx.lineTo(cx, cy + 6); ctx.stroke()
  ctx.fillStyle = "#9ca3af"; ctx.font = "8px monospace"; ctx.textAlign = "center"
  ctx.fillText("ОЛ", cx, cy - 9)

  // count left/right widths
  let leftW = 0, rightW = 0
  subs.forEach(s => {
    const w = parseFloat(s.params["Ширина"] || s.params["Ширина основания, м"] || "3") * sc
    if (s.side === "Левый") leftW += w
    else if (s.side === "Правый") rightW += w
    else { leftW += w / 2; rightW += w / 2 }
  })

  // draw surface shape
  const COLORS: Record<string, string> = {
    "Полоса движения": "#374151",
    "Обочина укреплённая": "#4b5563",
    "Обочина грунтовая": "#6b7280",
    "Откос насыпи": "#78350f",
    "Откос выемки": "#92400e",
    "Бордюр": "#1f2937",
    "Тротуар": "#6b7280",
    "Велодорожка": "#1e40af",
    "Разделительная полоса": "#14532d",
    "Кювет": "#1e3a5f",
    "Балластный слой": "#374151",
    "Берма": "#4b5563",
    "Дно канала": "#1e3a5f",
    "Газон": "#14532d",
    "Слой дорожной одежды": "#1c1917",
    "Субосновной слой": "#292524",
  }
  const LABELS: Record<string, string> = {
    "Полоса движения": "ПД", "Обочина укреплённая": "Об", "Откос насыпи": "Отк",
    "Откос выемки": "Отк", "Бордюр": "Бд", "Тротуар": "Тр",
    "Разделительная полоса": "РП", "Кювет": "Кв", "Балластный слой": "Бл",
    "Берма": "Бм", "Дно канала": "Дн", "Газон": "Гз",
  }

  let lx = cx, rx = cx
  subs.forEach(s => {
    const w = parseFloat(s.params["Ширина"] || s.params["Ширина основания, м"] || "3") * sc
    const slope = parseFloat(s.params["Заложение"] || "0")
    const isSlope = s.type.includes("Откос") || s.type === "Кювет" || s.type === "Дно канала"
    const col = COLORS[s.type] || "#374151"
    const depth = 14

    const drawSide = (startX: number, dir: 1 | -1) => {
      const x0 = startX, x1 = startX + dir * w
      const slopeH = isSlope ? Math.min(w * 0.7, 20) : 0
      ctx.fillStyle = col
      ctx.beginPath()
      ctx.moveTo(x0, cy)
      ctx.lineTo(x1, cy - slopeH)
      ctx.lineTo(x1, cy - slopeH + depth)
      ctx.lineTo(x0, cy + depth)
      ctx.closePath(); ctx.fill()
      ctx.strokeStyle = "#60a5fa"; ctx.lineWidth = 0.5; ctx.stroke()
      ctx.fillStyle = "#d1d5db"; ctx.font = "7px Arial"; ctx.textAlign = "center"
      ctx.fillText(LABELS[s.type] || s.type.slice(0, 2), (x0 + x1) / 2, cy - slopeH / 2 + 4)
      // dimension
      ctx.strokeStyle = "#4b5563"; ctx.lineWidth = 0.5
      ctx.beginPath(); ctx.moveTo(x0, cy - slopeH - 8); ctx.lineTo(x1, cy - slopeH - 8); ctx.stroke()
      ctx.fillStyle = "#9ca3af"; ctx.font = "7px monospace"; ctx.textAlign = "center"
      ctx.fillText(`${(w / sc).toFixed(1)}м`, (x0 + x1) / 2, cy - slopeH - 11)
      return x1
    }

    if (s.side === "Левый") { lx = drawSide(lx, -1) }
    else if (s.side === "Правый") { rx = drawSide(rx, 1) }
    else { lx = drawSide(lx, -1); rx = drawSide(rx, 1) }
  })

  // road surface top
  ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(lx, cy); ctx.lineTo(cx, cy); ctx.lineTo(rx, cy); ctx.stroke()
}

function AssemblyDialog({ onClose, onOK }: {
  onClose: () => void
  onOK: (d: AssemblyDef) => void
}) {
  const [tab, setTab] = useState<"info" | "subs" | "template" | "params">("template")
  const [def, setDef] = useState<AssemblyDef>({
    name: "Типовое сечение 1",
    description: "",
    style: "Базовый",
    layer: "С-ДОРОГА-ТС",
    markerStyle: "Базовый",
    defaultOffset: "0.000",
    defaultElevAdj: "0.000",
    subassemblies: ASSEMBLY_TEMPLATES[0].subassemblies,
  })
  const [selSub, setSelSub] = useState<string | null>(null)
  const [selTemplate, setSelTemplate] = useState<string>("road2")
  const canvasRef2 = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = canvasRef2.current; if (!c) return
    c.width = c.offsetWidth; c.height = c.offsetHeight
    const ctx = c.getContext("2d")!
    drawAssemblyPreview(ctx, c.width, c.height, def.subassemblies)
  }, [def.subassemblies, tab])

  const applyTemplate = (id: string) => {
    const tpl = ASSEMBLY_TEMPLATES.find(t => t.id === id)
    if (!tpl) return
    setSelTemplate(id)
    setDef(d => ({ ...d, name: tpl.name, description: tpl.description, subassemblies: tpl.subassemblies }))
  }

  const addSub = () => {
    const ns: SubassemblyItem = {
      id: `sa_${Date.now()}`, name: "НовоеПодсечение", side: "Правый", type: "Полоса движения",
      params: { "Ширина": "3.5", "Уклон, %": "2.0" }
    }
    setDef(d => ({ ...d, subassemblies: [...d.subassemblies, ns] }))
    setSelSub(ns.id)
  }

  const removeSub = (id: string) => {
    setDef(d => ({ ...d, subassemblies: d.subassemblies.filter(s => s.id !== id) }))
    setSelSub(null)
  }

  const updateSub = (id: string, patch: Partial<SubassemblyItem>) => {
    setDef(d => ({ ...d, subassemblies: d.subassemblies.map(s => s.id === id ? { ...s, ...patch } : s) }))
  }

  const updateParam = (id: string, key: string, val: string) => {
    setDef(d => ({ ...d, subassemblies: d.subassemblies.map(s => s.id === id ? { ...s, params: { ...s.params, [key]: val } } : s) }))
  }

  const selSubData = def.subassemblies.find(s => s.id === selSub)

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
        className="bg-[#f0f0f0] border border-gray-400 shadow-2xl flex flex-col"
        style={{ fontFamily: "Arial, sans-serif", fontSize: 12, width: 700, maxHeight: "92vh" }}>

        {/* Title */}
        <div className="flex items-center justify-between bg-[#0078d4] px-3 py-1.5 flex-shrink-0">
          <span className="text-white font-bold text-sm">Создать типовое сечение (Assembly)</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 w-5 h-5 flex items-center justify-center">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-300 bg-[#e8e8e8] flex-shrink-0">
          {([["template","Типовые схемы"],["info","Информация"],["subs","Подсечения"],["params","Параметры"]] as [typeof tab, string][]).map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-xs font-semibold border-r border-gray-300 transition-colors ${tab === t ? "bg-white text-blue-700 border-b-2 border-blue-600" : "text-gray-600 hover:bg-gray-100"}`}>
              {l}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* ─── Типовые схемы ─── */}
          {tab === "template" && (
            <div className="flex h-full" style={{ minHeight: 380 }}>
              {/* Template list */}
              <div className="w-56 border-r border-gray-300 bg-[#f8f8f8] flex-shrink-0">
                <div className="bg-[#d8d8d8] px-2 py-1 text-[10px] font-bold text-gray-600 uppercase tracking-wide border-b border-gray-300">
                  Выберите схему
                </div>
                {ASSEMBLY_TEMPLATES.map(tpl => (
                  <div key={tpl.id} onClick={() => applyTemplate(tpl.id)}
                    className={`px-3 py-2 cursor-pointer border-b border-gray-200 transition-colors ${selTemplate === tpl.id ? "bg-[#cce4ff] border-l-2 border-l-blue-600" : "hover:bg-gray-100"}`}>
                    <div className="text-xs font-semibold text-gray-800">{tpl.name}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{tpl.description.slice(0, 55)}…</div>
                  </div>
                ))}
              </div>
              {/* Preview + info */}
              <div className="flex-1 flex flex-col p-3 gap-2">
                {/* Canvas preview */}
                <div className="border border-gray-400 bg-[#1a1a2e] rounded" style={{ height: 140 }}>
                  <canvas ref={canvasRef2} className="w-full h-full block" style={{ borderRadius: 4 }} />
                </div>
                {/* Template description */}
                {(() => {
                  const tpl = ASSEMBLY_TEMPLATES.find(t => t.id === selTemplate)
                  return tpl ? (
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-gray-800">{tpl.name}</div>
                      <div className="text-[11px] text-gray-600">{tpl.description}</div>
                      <div className="border border-gray-300 bg-white rounded">
                        <div className="bg-[#e0e0e0] px-2 py-0.5 text-[10px] font-bold text-gray-700 border-b border-gray-300">
                          Состав подсечений ({tpl.subassemblies.length} эл.)
                        </div>
                        <div className="max-h-28 overflow-y-auto">
                          {tpl.subassemblies.map((s, i) => (
                            <div key={i} className={`flex items-center px-2 py-1 text-[11px] border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                              <span className="w-5 text-gray-400 text-[10px]">{i + 1}.</span>
                              <span className="w-40 font-mono text-gray-700">{s.name}</span>
                              <span className="flex-1 text-gray-500">{s.type}</span>
                              <span className={`text-[10px] px-1 rounded ${s.side === "Левый" ? "bg-blue-100 text-blue-700" : s.side === "Правый" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                                {s.side}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null
                })()}
                <button onClick={() => setTab("subs")}
                  className="self-start mt-auto px-4 py-1 bg-[#0078d4] text-white text-xs font-semibold hover:bg-blue-700 rounded">
                  Применить схему и редактировать →
                </button>
              </div>
            </div>
          )}

          {/* ─── Информация ─── */}
          {tab === "info" && (
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <label className="w-36 text-xs text-gray-700 shrink-0">Название:</label>
                <input value={def.name} onChange={e => setDef(d => ({ ...d, name: e.target.value }))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
                <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">⋯</button>
              </div>
              <div className="flex items-start gap-2">
                <label className="w-36 text-xs text-gray-700 shrink-0 mt-1">Описание:</label>
                <textarea value={def.description} onChange={e => setDef(d => ({ ...d, description: e.target.value }))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white h-12 resize-none" />
              </div>
              {[
                ["Стиль типового сечения:", "style", ["Базовый","Без отображения","Разработка","Существующий"]],
                ["Стиль маркеров:", "markerStyle", ["Базовый","Точки","Без маркеров"]],
              ].map(([lbl, field, opts]) => (
                <div key={field as string} className="flex items-center gap-2">
                  <label className="w-36 text-xs text-gray-700 shrink-0">{lbl as string}</label>
                  <select value={(def as Record<string,string>)[field as string]} onChange={e => setDef(d => ({ ...d, [field as string]: e.target.value }))} className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
                    {(opts as string[]).map(o => <option key={o}>{o}</option>)}
                  </select>
                  <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">✎</button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <label className="w-36 text-xs text-gray-700 shrink-0">Слой:</label>
                <input value={def.layer} onChange={e => setDef(d => ({ ...d, layer: e.target.value }))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
              </div>
              <div className="flex gap-3">
                {[["Смещение по умолчанию:", "defaultOffset"],["Поправка по высоте:", "defaultElevAdj"]].map(([lbl, field]) => (
                  <div key={field} className="flex items-center gap-1 flex-1">
                    <label className="text-xs text-gray-700 shrink-0">{lbl}</label>
                    <input value={(def as Record<string,string>)[field]} onChange={e => setDef(d => ({ ...d, [field]: e.target.value }))} className="w-20 border border-gray-400 px-2 py-0.5 text-xs bg-white font-mono" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Подсечения ─── */}
          {tab === "subs" && (
            <div className="flex" style={{ minHeight: 380 }}>
              {/* Left: list */}
              <div className="w-64 border-r border-gray-300 flex flex-col flex-shrink-0">
                <div className="bg-[#d8d8d8] px-2 py-1 flex items-center justify-between border-b border-gray-300">
                  <span className="text-[10px] font-bold text-gray-700 uppercase">Подсечения</span>
                  <div className="flex gap-1">
                    <button onClick={addSub} className="px-2 py-0.5 bg-[#0078d4] text-white text-[10px] hover:bg-blue-700">+ Добавить</button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {def.subassemblies.map((s, i) => (
                    <div key={s.id} onClick={() => setSelSub(s.id)}
                      className={`flex items-center px-2 py-1.5 cursor-pointer border-b border-gray-100 transition-colors ${selSub === s.id ? "bg-[#cce4ff]" : i % 2 === 0 ? "bg-white hover:bg-blue-50" : "bg-gray-50 hover:bg-blue-50"}`}>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-800 truncate">{s.name}</div>
                        <div className="text-[10px] text-gray-500">{s.type}</div>
                      </div>
                      <span className={`text-[9px] px-1 rounded mr-1 flex-shrink-0 ${s.side === "Левый" ? "bg-blue-100 text-blue-700" : s.side === "Правый" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                        {s.side === "Левый" ? "Л" : s.side === "Правый" ? "П" : "ОС"}
                      </span>
                      <button onClick={e => { e.stopPropagation(); removeSub(s.id) }} className="text-gray-400 hover:text-red-500 text-xs ml-1">✕</button>
                    </div>
                  ))}
                </div>
              </div>
              {/* Right: editor + preview */}
              <div className="flex-1 flex flex-col gap-2 p-3">
                {/* Preview */}
                <div className="border border-gray-400 bg-[#1a1a2e] rounded" style={{ height: 120 }}>
                  <canvas ref={canvasRef2} className="w-full h-full block" style={{ borderRadius: 4 }} />
                </div>
                {selSubData ? (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-gray-700 border-b border-gray-300 pb-1">{selSubData.name} — редактирование</div>
                    <div className="flex items-center gap-2">
                      <label className="w-28 text-xs text-gray-700 shrink-0">Имя:</label>
                      <input value={selSubData.name} onChange={e => updateSub(selSubData.id, { name: e.target.value })} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="w-28 text-xs text-gray-700 shrink-0">Тип подсечения:</label>
                      <select value={selSubData.type} onChange={e => updateSub(selSubData.id, { type: e.target.value })} className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
                        {SA_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="w-28 text-xs text-gray-700 shrink-0">Сторона:</label>
                      <select value={selSubData.side} onChange={e => updateSub(selSubData.id, { side: e.target.value as SubassemblyItem["side"] })} className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
                        {["Левый","Правый","Обе стороны"].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="border border-gray-300 bg-white">
                      <div className="bg-[#e8e8e8] px-2 py-0.5 text-[10px] font-bold text-gray-700 border-b border-gray-300">Параметры</div>
                      {Object.entries(selSubData.params).map(([k, v]) => (
                        <div key={k} className="flex items-center px-2 py-1 border-b border-gray-100">
                          <span className="w-40 text-xs text-gray-700">{k}:</span>
                          <input value={v} onChange={e => updateParam(selSubData.id, k, e.target.value)} className="flex-1 border border-gray-300 px-2 py-0.5 text-xs bg-white font-mono" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 text-center py-6">Выберите подсечение для редактирования</div>
                )}
              </div>
            </div>
          )}

          {/* ─── Параметры ─── */}
          {tab === "params" && (
            <div className="p-3 space-y-3">
              <div className="text-xs font-bold text-gray-700 border-b border-gray-300 pb-1">Параметры построения коридора</div>
              {[
                { label: "Метод интерполяции откосов:", options: ["Линейная","По поверхности","Фиксированная отметка"] },
                { label: "Тип кювета:", options: ["Треугольный","Трапециевидный","Параболический","Без кювета"] },
                { label: "Поведение при пересечениях:", options: ["Автоматически","Приоритет основной трассы","Игнорировать"] },
                { label: "Расчёт объёмов:", options: ["Метод средних площадей","Метод призматоида","Без расчёта"] },
              ].map(({ label, options }) => (
                <div key={label} className="flex items-center gap-2">
                  <label className="w-52 text-xs text-gray-700 shrink-0">{label}</label>
                  <select className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
                    {options.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div className="border border-gray-300 bg-white p-2 rounded mt-2 space-y-1">
                <div className="text-xs font-bold text-gray-700 mb-1">Допуски</div>
                {[
                  ["Допуск по высоте, м:", "0.001"],
                  ["Допуск по горизонтали, м:", "0.001"],
                  ["Макс. шаг разбивки, м:", "5.000"],
                ].map(([lbl, val]) => (
                  <div key={lbl as string} className="flex items-center gap-2">
                    <label className="w-48 text-xs text-gray-600">{lbl}</label>
                    <input defaultValue={val as string} className="w-20 border border-gray-300 px-2 py-0.5 text-xs bg-white font-mono" />
                  </div>
                ))}
              </div>
              <div className="flex gap-4 pt-1">
                {[
                  ["Создавать точки на бровках", true],
                  ["Отображать коды подсечений", true],
                  ["Строить поверхность верха", false],
                  ["Строить поверхность низа", false],
                ].map(([lbl, def]) => (
                  <label key={lbl as string} className="flex items-center gap-1.5 text-xs cursor-pointer text-gray-700">
                    <input type="checkbox" defaultChecked={def as boolean} className="accent-blue-600" />
                    {lbl as string}
                  </label>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 px-3 py-2 border-t border-gray-300 bg-[#e8e8e8] flex-shrink-0">
          <button onClick={() => onOK(def)} className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">ОК</button>
          <button onClick={onClose} className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">Отмена</button>
          <button className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">Справка</button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Create Corridor Dialog ──────────────────────────────────────────────────

function CorridorDialog({ onClose, onOK }: { onClose: () => void; onOK: (d: CorridorDef) => void }) {
  const [def, setDef] = useState<CorridorDef>({
    name: "Дорога и парковочная зона", description: "", style: "Базовый",
    codeStyle: "Все коды", layer: "С-ДОРОГА-КОР", template: "",
    targetSurface: "<нет>",
    rows: [
      { alignment: "Трасса ШД-38", profile: "ПРОЕКТ_ШД-38", assembly: "Трасса ШД-38" },
      { alignment: "Ул. Трумана", profile: "Проект_Трумана", assembly: "Ул. Трумана" },
      { alignment: "*Нет*", profile: "*Нет*", assembly: "*Нет*" },
    ],
    features: FEATURE_LINES,
  })
  const [selFeature, setSelFeature] = useState<string | null>("Бордюр пр.ч. Лев. 7")
  const [featureDropdown, setFeatureDropdown] = useState<string | null>(null)

  const updateRow = (i: number, field: keyof CorridorRow, val: string) => {
    const rows = [...def.rows]; rows[i] = { ...rows[i], [field]: val }
    setDef(d => ({ ...d, rows }))
  }

  const updateFeature = (name: string, assembly: string) => {
    const features = def.features.map(f => f.name === name ? { ...f, assembly } : f)
    setDef(d => ({ ...d, features }))
    setFeatureDropdown(null)
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
        className="bg-[#f0f0f0] border border-gray-400 shadow-2xl w-[540px] max-h-[90vh] overflow-y-auto"
        style={{ fontFamily: "Arial, sans-serif", fontSize: 12 }}
      >
        {/* title */}
        <div className="flex items-center justify-between bg-[#0078d4] px-3 py-1.5">
          <span className="text-white font-bold text-sm">Создать коридор</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 w-5 h-5 flex items-center justify-center text-xs">✕</button>
        </div>

        <div className="p-3 space-y-2">
          {/* Name */}
          <div className="flex items-center gap-2">
            <label className="w-24 text-xs text-gray-700 shrink-0">Название:</label>
            <input value={def.name} onChange={e => setDef(d => ({...d, name: e.target.value}))}
              className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
            <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs flex items-center justify-center">⋯</button>
          </div>
          {/* Description */}
          <div className="flex items-start gap-2">
            <label className="w-24 text-xs text-gray-700 shrink-0 mt-1">Описание:</label>
            <textarea value={def.description} onChange={e => setDef(d => ({...d, description: e.target.value}))}
              className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white h-10 resize-none" />
          </div>
          {/* Corridor style */}
          <div className="flex items-center gap-2">
            <label className="w-24 text-xs text-gray-700 shrink-0">Стиль коридора:</label>
            <select value={def.style} onChange={e => setDef(d => ({...d, style: e.target.value}))}
              className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
              {STYLES.map(s => <option key={s}>{s}</option>)}
            </select>
            <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">⋯</button>
            <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">✎</button>
            <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">+</button>
          </div>
          {/* Code set style */}
          <div className="flex items-center gap-2">
            <label className="w-24 text-xs text-gray-700 shrink-0">Стиль кодов:</label>
            <select value={def.codeStyle} onChange={e => setDef(d => ({...d, codeStyle: e.target.value}))}
              className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
              {CODE_STYLES.map(s => <option key={s}>{s}</option>)}
            </select>
            <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">⋯</button>
            <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">✎</button>
          </div>
          {/* Corridor layer */}
          <div className="flex items-center gap-2">
            <label className="w-24 text-xs text-gray-700 shrink-0">Слой коридора:</label>
            <input value={def.layer} onChange={e => setDef(d => ({...d, layer: e.target.value}))}
              className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
            <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">✎</button>
          </div>
          {/* Corridor Template */}
          <div className="flex items-center gap-2">
            <label className="w-24 text-xs text-gray-700 shrink-0">Шаблон коридора:</label>
            <input value={def.template} onChange={e => setDef(d => ({...d, template: e.target.value}))}
              className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
            <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">⋯</button>
          </div>
          {/* Target Surface */}
          <div className="flex items-center gap-2">
            <label className="w-24 text-xs text-gray-700 shrink-0">Целев. поверхность:</label>
            <select value={def.targetSurface} onChange={e => setDef(d => ({...d, targetSurface: e.target.value}))}
              className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
              {SURFACES.map(s => <option key={s}>{s}</option>)}
            </select>
            <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">⋯</button>
          </div>

          {/* Alignments and profiles */}
          <div className="border border-gray-400 bg-white">
            <div className="bg-[#d0d0d0] px-2 py-1 flex items-center gap-1 font-bold text-xs border-b border-gray-400">
              <span className="text-blue-600 cursor-pointer">▼</span> Трассы и профили
            </div>
            <table className="w-full text-xs">
              <thead className="bg-[#e8e8e8] border-b border-gray-300">
                <tr>
                  <th className="px-2 py-1 text-left font-semibold border-r border-gray-300 w-36">Трасса</th>
                  <th className="px-2 py-1 text-left font-semibold border-r border-gray-300">Профиль</th>
                  <th className="px-2 py-1 text-left font-semibold">Тип. сечение</th>
                </tr>
              </thead>
              <tbody>
                {def.rows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-200 hover:bg-blue-50">
                    <td className="px-1 py-0.5 border-r border-gray-200">
                      <select value={row.alignment} onChange={e => updateRow(i, "alignment", e.target.value)}
                        className="w-full bg-transparent text-xs outline-none">
                        {["Трасса ШД-38","Ул. Трумана","*Нет*"].map(a => <option key={a}>{a}</option>)}
                      </select>
                    </td>
                    <td className="px-1 py-0.5 border-r border-gray-200">
                      <select value={row.profile} onChange={e => updateRow(i, "profile", e.target.value)}
                        className="w-full bg-transparent text-xs outline-none">
                        {(PROFILES[row.alignment] || ["*None*"]).map(p => <option key={p}>{p}</option>)}
                      </select>
                    </td>
                    <td className="px-1 py-0.5">
                      <select value={row.assembly} onChange={e => updateRow(i, "assembly", e.target.value)}
                        className="w-full bg-transparent text-xs outline-none">
                        {ASSEMBLIES.map(a => <option key={a}>{a}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Feature lines */}
          <div className="border border-gray-400 bg-white">
            <div className="bg-[#d0d0d0] px-2 py-1 flex items-center gap-2 font-bold text-xs border-b border-gray-400">
              <span className="text-blue-600 cursor-pointer">▼</span> Характерные линии
              <span className="ml-auto text-gray-500">Фильтр выбора</span>
            </div>
            <div className="flex items-center gap-1 bg-[#e8e8e8] border-b border-gray-300 text-xs font-semibold px-2 py-0.5">
              <span className="flex-1">Хар. линия</span>
              <span className="w-40">Тип. сечение</span>
            </div>
            <div className="max-h-40 overflow-y-auto">
              {def.features.map(f => (
                <div key={f.name} onClick={() => setSelFeature(f.name)}
                  className={`flex items-center gap-1 px-2 py-0.5 text-xs cursor-pointer border-b border-gray-100 relative ${selFeature === f.name ? "bg-blue-600 text-white" : "hover:bg-blue-50"}`}>
                  <span className="flex-1 truncate">{f.name}</span>
                  <div className="w-40 flex items-center gap-1 relative">
                    <span className="flex-1 truncate">{f.assembly}</span>
                    <button
                      className={`text-[10px] px-1 border ${selFeature === f.name ? "border-blue-300 bg-blue-700" : "border-gray-300 bg-[#e8e8e8]"}`}
                      onClick={e => { e.stopPropagation(); setFeatureDropdown(featureDropdown === f.name ? null : f.name) }}
                    >▾</button>
                    {featureDropdown === f.name && (
                      <div className="absolute top-5 right-0 z-50 bg-white border border-gray-400 shadow-xl min-w-36" style={{ color: "#333" }}>
                        {ASSEMBLIES.map(a => (
                          <div key={a} onClick={() => updateFeature(f.name, a)}
                            className={`px-3 py-1 text-xs cursor-pointer hover:bg-blue-600 hover:text-white ${f.assembly === a ? "bg-blue-500 text-white" : ""}`}>
                            {a}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checkbox */}
          <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
            <input type="checkbox" defaultChecked className="accent-blue-600" />
            Задать параметры базовой линии и области
          </label>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => onOK(def)}
              className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0] active:bg-gray-300">
              ОК
            </button>
            <button onClick={onClose}
              className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">
              Отмена
            </button>
            <button className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">
              Справка
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Cross Section Panel ─────────────────────────────────────────────────────

function CrossSectionPanel({ alignments, onClose }: { alignments: string[]; onClose?: () => void }) {
  const [minimized, setMinimized] = useState(false)
  const canvases = alignments.slice(0, 3)
  return (
    <div className="bg-[#1a1a2e] border-l border-gray-700 w-72 flex flex-col overflow-hidden">
      <div className="bg-[#252540] px-2 py-1 flex items-center justify-between border-b border-gray-700">
        <span className="text-gray-300 text-xs font-mono">Виды поперечников</span>
        <div className="flex gap-1">
          <button onClick={() => setMinimized(m => !m)} className="text-gray-400 hover:text-white text-xs px-1" title="Свернуть">─</button>
          <button onClick={() => setMinimized(false)} className="text-gray-400 hover:text-white text-xs px-1" title="Развернуть">□</button>
          <button onClick={onClose} className="text-gray-400 hover:text-red-400 text-xs px-1" title="Закрыть">✕</button>
        </div>
      </div>
      {minimized && <div className="flex-1 flex items-center justify-center text-xs text-gray-600 cursor-pointer" onClick={() => setMinimized(false)}>Панель свёрнута — нажмите □ чтобы развернуть</div>}
      {!minimized && <div className="flex-1 overflow-y-auto divide-y divide-gray-800">
        {(canvases.length ? canvases : ["Трасса ШД-38","Ул. Трумана"]).map((name, i) => (
          <CrossSectionView key={name} name={name} index={i} />
        ))}
        <div className="p-3 text-center">
          <div className="text-[#06b6d4] text-xs font-mono font-bold border border-[#06b6d4] px-3 py-1 inline-block">БОРДЮР ПЕРИМЕТРА</div>
          <CrossSectionView name="Бордюр периметра" index={2} />
          <div className="text-[#06b6d4] text-xs font-mono mt-1">V-ОБРАЗНЫЙ ЛОТОК</div>
        </div>
      </div>}
    </div>
  )
}

function CrossSectionView({ name, index }: { name: string; index: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    c.width = c.offsetWidth || 240; c.height = 80
    const ctx = c.getContext("2d")!
    const W = c.width, H = c.height
    ctx.fillStyle = "#1a1a2e"; ctx.fillRect(0, 0, W, H)
    // axes
    ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 0.5
    ctx.beginPath(); ctx.moveTo(10, H-10); ctx.lineTo(W-10, H-10); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(W/2, 5); ctx.lineTo(W/2, H-10); ctx.stroke()
    // profile shape
    const colors = ["#f97316","#a855f7","#06b6d4"]
    const color = colors[index % 3]
    ctx.strokeStyle = color; ctx.lineWidth = 1.5
    const pts: [number,number][] = []
    if (index === 0) pts.push(...[[10,65],[40,65],[55,50],[70,45],[W/2,42],[W/2+10,44],[W-55,50],[W-40,65],[W-10,65]] as [number,number][])
    else if (index === 1) pts.push(...[[10,60],[35,60],[50,52],[W/2-5,48],[W/2+5,48],[W-50,52],[W-35,60],[W-10,60]] as [number,number][])
    else pts.push(...[[10,62],[W/2-30,55],[W/2,50],[W/2+30,55],[W-10,62]] as [number,number][])
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1])
    pts.slice(1).forEach(p => ctx.lineTo(p[0], p[1])); ctx.stroke()
    // fill
    ctx.beginPath(); ctx.moveTo(pts[0][0], H-10)
    pts.forEach(p => ctx.lineTo(p[0], p[1]))
    ctx.lineTo(pts[pts.length-1][0], H-10); ctx.closePath()
    ctx.fillStyle = color + "30"; ctx.fill()
    // label
    ctx.fillStyle = color; ctx.font = "bold 9px monospace"; ctx.textAlign = "center"
    ctx.fillText(name.toUpperCase(), W/2, 14)
    ctx.textAlign = "left"
    // tick marks
    ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 0.5
    for (let x = 20; x < W; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, H-10); ctx.lineTo(x, H-6); ctx.stroke()
    }
  }, [name, index])
  return <canvas ref={ref} className="w-full" style={{ height: 80 }} />
}

// ─── Points Dialog ───────────────────────────────────────────────────────────
function PointsDialog({ onClose, onOK }: { onClose: () => void; onOK: (pts: {name:string;x:string;y:string;z:string}[]) => void }) {
  const [rows, setRows] = useState([{name:"ТЧК-1",x:"100.000",y:"200.000",z:"15.340"},{name:"ТЧК-2",x:"250.500",y:"310.200",z:"16.120"},{name:"ТЧК-3",x:"400.000",y:"150.000",z:"14.870"}])
  const upd = (i:number,f:string,v:string) => setRows(r=>r.map((row,idx)=>idx===i?{...row,[f as keyof typeof row]:v}:row))
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#2d2d3d] border border-gray-600 rounded shadow-2xl w-[520px]">
        <div className="bg-[#1a1a2e] px-3 py-1.5 flex items-center justify-between border-b border-gray-700">
          <span className="text-[11px] font-bold text-white">Создать точки — вручную</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xs">✕</button>
        </div>
        <div className="p-3">
          <table className="w-full text-[11px] border-collapse mb-3">
            <thead><tr className="bg-[#1e1e2e]">
              {["Имя","X (Восток)","Y (Север)","Z (Отм.)"].map(h=><th key={h} className="text-left px-2 py-1 text-gray-400 border border-gray-700">{h}</th>)}
            </tr></thead>
            <tbody>{rows.map((r,i)=>(
              <tr key={i}>{["name","x","y","z"].map(f=>(
                <td key={f} className="border border-gray-700 p-0">
                  <input value={r[f as keyof typeof r]} onChange={e=>upd(i,f,e.target.value)}
                    className="w-full bg-transparent text-gray-200 px-2 py-1 outline-none focus:bg-[#0078d4]/20 font-mono text-[10px]"/>
                </td>
              ))}</tr>
            ))}</tbody>
          </table>
          <button onClick={()=>setRows(r=>[...r,{name:`ТЧК-${r.length+1}`,x:"0.000",y:"0.000",z:"0.000"}])}
            className="text-[10px] text-blue-400 hover:text-blue-300 mb-3">+ Добавить точку</button>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-3 py-1 text-[11px] bg-[#3a3a4e] text-gray-300 hover:bg-[#4a4a5e] rounded">Отмена</button>
            <button onClick={()=>onOK(rows)} className="px-3 py-1 text-[11px] bg-[#0078d4] text-white hover:bg-[#0066b3] rounded">ОК</button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Pipe Network Dialog ──────────────────────────────────────────────────────
function PipeNetDialog({ onClose, onOK }: { onClose: () => void; onOK: (d:{name:string;type:string;material:string}) => void }) {
  const [name, setName] = useState("Сеть дождевой канализации")
  const [type, setType] = useState("Ливневая канализация")
  const [material, setMaterial] = useState("Железобетонные трубы")
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#2d2d3d] border border-gray-600 rounded shadow-2xl w-[420px]">
        <div className="bg-[#1a1a2e] px-3 py-1.5 flex items-center justify-between border-b border-gray-700">
          <span className="text-[11px] font-bold text-white">Создать трубопроводную сеть</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xs">✕</button>
        </div>
        <div className="p-4 flex flex-col gap-3 text-[11px]">
          {([["Название сети:", name, setName],["Тип сети:", type, setType],["Материал труб:", material, setMaterial]] as [string, string, (v:string)=>void][]).map(([lbl,val,setter])=>(
            <div key={lbl} className="flex items-center gap-2">
              <span className="text-gray-400 w-36">{lbl}</span>
              <input value={val} onChange={e=>setter(e.target.value)} className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded outline-none focus:border-[#0078d4]"/>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-36">Слой:</span>
            <span className="flex-1 text-gray-300 bg-[#1e1e2e] border border-gray-600 px-2 py-1 rounded">C-СЕТЬ-ТРУБА</span>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={onClose} className="px-3 py-1 bg-[#3a3a4e] text-gray-300 hover:bg-[#4a4a5e] rounded">Отмена</button>
            <button onClick={()=>onOK({name,type,material})} className="px-3 py-1 bg-[#0078d4] text-white hover:bg-[#0066b3] rounded">ОК</button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Intersection Dialog ──────────────────────────────────────────────────────
function IntersectionDialog({ onClose, onOK }: { onClose: () => void; onOK: (d:{name:string;mainRoad:string;secRoad:string}) => void }) {
  const [name, setName] = useState("Пересечение-1")
  const [mainRoad, setMainRoad] = useState("Трасса ШД-38")
  const [secRoad, setSecRoad] = useState("Ул. Трумана")
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#2d2d3d] border border-gray-600 rounded shadow-2xl w-[420px]">
        <div className="bg-[#1a1a2e] px-3 py-1.5 flex items-center justify-between border-b border-gray-700">
          <span className="text-[11px] font-bold text-white">Создать пересечение</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xs">✕</button>
        </div>
        <div className="p-4 flex flex-col gap-3 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-40">Название:</span>
            <input value={name} onChange={e=>setName(e.target.value)} className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded outline-none focus:border-[#0078d4]"/>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-40">Главная дорога:</span>
            <select value={mainRoad} onChange={e=>setMainRoad(e.target.value)} className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded">
              {["Трасса ШД-38","Ул. Трумана","Бордюр периметра"].map(a=><option key={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-40">Второстепенная дорога:</span>
            <select value={secRoad} onChange={e=>setSecRoad(e.target.value)} className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded">
              {["Ул. Трумана","Трасса ШД-38","Бордюр периметра"].map(a=><option key={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-40">Тип примыкания:</span>
            <select className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded">
              <option>Т-образное пересечение</option><option>Полное пересечение (+)</option><option>Круговое движение</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={onClose} className="px-3 py-1 bg-[#3a3a4e] text-gray-300 hover:bg-[#4a4a5e] rounded">Отмена</button>
            <button onClick={()=>onOK({name,mainRoad,secRoad})} className="px-3 py-1 bg-[#0078d4] text-white hover:bg-[#0066b3] rounded">ОК</button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Feature Line Dialog ──────────────────────────────────────────────────────
function FeatureLineDialog({ onClose, onOK }: { onClose: () => void; onOK: (d:{name:string;site:string}) => void }) {
  const [name, setName] = useState("ХарЛиния-1")
  const [site, setSite] = useState("Главная парковка")
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#2d2d3d] border border-gray-600 rounded shadow-2xl w-[380px]">
        <div className="bg-[#1a1a2e] px-3 py-1.5 flex items-center justify-between border-b border-gray-700">
          <span className="text-[11px] font-bold text-white">Создать характерную линию</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xs">✕</button>
        </div>
        <div className="p-4 flex flex-col gap-3 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-32">Название:</span>
            <input value={name} onChange={e=>setName(e.target.value)} className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded outline-none focus:border-[#0078d4]"/>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-32">Площадка:</span>
            <input value={site} onChange={e=>setSite(e.target.value)} className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded outline-none focus:border-[#0078d4]"/>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-32">Стиль:</span>
            <select className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded">
              <option>Базовый</option><option>Бордюр</option><option>Тротуар</option><option>Откос</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-32">Слой:</span>
            <span className="flex-1 text-gray-300 bg-[#1e1e2e] border border-gray-600 px-2 py-1 rounded">C-ROAD-FEAT</span>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={onClose} className="px-3 py-1 bg-[#3a3a4e] text-gray-300 hover:bg-[#4a4a5e] rounded">Отмена</button>
            <button onClick={()=>onOK({name,site})} className="px-3 py-1 bg-[#0078d4] text-white hover:bg-[#0066b3] rounded">ОК</button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Analysis Dialog ──────────────────────────────────────────────────────────
function AnalysisDialog({ onClose, onOK, type }: { onClose: () => void; onOK: (d:{surface:string;type:string}) => void; type: string }) {
  const [surface, setSurface] = useState("Существующая поверхность")
  const [ranges, setRanges] = useState(5)
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#2d2d3d] border border-gray-600 rounded shadow-2xl w-[400px]">
        <div className="bg-[#1a1a2e] px-3 py-1.5 flex items-center justify-between border-b border-gray-700">
          <span className="text-[11px] font-bold text-white">{type}</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xs">✕</button>
        </div>
        <div className="p-4 flex flex-col gap-3 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-36">Поверхность:</span>
            <select value={surface} onChange={e=>setSurface(e.target.value)} className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded">
              <option>Существующая поверхность</option><option>Проектная поверхность</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-36">Число диапазонов:</span>
            <input type="number" value={ranges} onChange={e=>setRanges(+e.target.value)} min={2} max={20}
              className="w-20 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded outline-none focus:border-[#0078d4] text-center"/>
          </div>
          <div className="bg-[#1e1e2e] rounded border border-gray-700 p-2">
            <div className="text-gray-500 text-[10px] mb-2">Предварительный просмотр диапазонов:</div>
            {Array.from({length:Math.min(ranges,5)}).map((_,i)=>(
              <div key={i} className="flex items-center gap-2 mb-1">
                <div className="w-4 h-3 rounded-sm" style={{background:`hsl(${120-i*24},70%,45%)`}}/>
                <span className="text-gray-400 font-mono">{(i*5).toFixed(1)}% — {((i+1)*5).toFixed(1)}%</span>
              </div>
            ))}
            {ranges > 5 && <div className="text-gray-600 text-[10px]">… ещё {ranges-5} диапазонов</div>}
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <button onClick={onClose} className="px-3 py-1 bg-[#3a3a4e] text-gray-300 hover:bg-[#4a4a5e] rounded">Отмена</button>
            <button onClick={()=>onOK({surface,type})} className="px-3 py-1 bg-[#0078d4] text-white hover:bg-[#0066b3] rounded">ОК</button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Layers Dialog ────────────────────────────────────────────────────────────
function LayersDialog({ onClose }: { onClose: () => void }) {
  const [layers] = useState([
    {name:"0",on:true,frozen:false,color:"#ffffff",ltype:"Сплошная",lw:"По умолч."},
    {name:"C-ROAD-ALIGN",on:true,frozen:false,color:"#ef4444",ltype:"Сплошная",lw:"0.25"},
    {name:"C-ДОРОГА-КОР",on:true,frozen:false,color:"#f97316",ltype:"Сплошная",lw:"0.35"},
    {name:"C-TOPO-MAJOR",on:true,frozen:false,color:"#4ade80",ltype:"Сплошная",lw:"0.18"},
    {name:"C-TOPO-MINOR",on:false,frozen:false,color:"#86efac",ltype:"Пунктир",lw:"0.13"},
    {name:"C-СЕТЬ-ТРУБА",on:true,frozen:false,color:"#6366f1",ltype:"Штрих-пункт",lw:"0.25"},
    {name:"C-ANNO-TEXT",on:true,frozen:false,color:"#e2e8f0",ltype:"Сплошная",lw:"По умолч."},
    {name:"C-ANNO-DIMS",on:true,frozen:false,color:"#94a3b8",ltype:"Сплошная",lw:"0.13"},
  ])
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#2d2d3d] border border-gray-600 rounded shadow-2xl w-[640px]">
        <div className="bg-[#1a1a2e] px-3 py-1.5 flex items-center justify-between border-b border-gray-700">
          <span className="text-[11px] font-bold text-white">Диспетчер слоёв</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xs">✕</button>
        </div>
        <div className="p-2 overflow-auto" style={{maxHeight:360}}>
          <table className="w-full text-[11px] border-collapse">
            <thead><tr className="bg-[#1e1e2e]">
              {["","Имя слоя","Вкл","Цвет","Тип линии","Вес линии"].map(h=>(
                <th key={h} className="text-left px-2 py-1 text-gray-400 border border-gray-700">{h}</th>
              ))}
            </tr></thead>
            <tbody>{layers.map((l,i)=>(
              <tr key={i} className="hover:bg-[#3a3a4e] transition-colors">
                <td className="px-2 py-1 border border-gray-700"><input type="checkbox" defaultChecked={l.on} className="accent-blue-500"/></td>
                <td className="px-2 py-1 border border-gray-700 text-gray-200 font-mono">{l.name}</td>
                <td className="px-2 py-1 border border-gray-700 text-center">{l.on?"🔆":"🌑"}</td>
                <td className="px-2 py-1 border border-gray-700"><div className="w-4 h-4 rounded-sm border border-gray-600" style={{background:l.color}}/></td>
                <td className="px-2 py-1 border border-gray-700 text-gray-400">{l.ltype}</td>
                <td className="px-2 py-1 border border-gray-700 text-gray-400">{l.lw}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="flex justify-end gap-2 p-3 border-t border-gray-700">
          <button onClick={onClose} className="px-3 py-1 text-[11px] bg-[#0078d4] text-white hover:bg-[#0066b3] rounded">Закрыть</button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Import Dialog ────────────────────────────────────────────────────────────
function ImportDialog({ onClose, onOK }: { onClose: () => void; onOK: (d:{format:string;file:string}) => void }) {
  const [format, setFormat] = useState("LandXML")
  const [file, setFile] = useState("survey_data.xml")
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#2d2d3d] border border-gray-600 rounded shadow-2xl w-[400px]">
        <div className="bg-[#1a1a2e] px-3 py-1.5 flex items-center justify-between border-b border-gray-700">
          <span className="text-[11px] font-bold text-white">Импорт данных</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xs">✕</button>
        </div>
        <div className="p-4 flex flex-col gap-3 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-32">Формат файла:</span>
            <select value={format} onChange={e=>setFormat(e.target.value)} className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded">
              {["LandXML","IFC","Shapefile","DEM/GeoTIFF","CSV точек","DWG","DXF"].map(f=><option key={f}>{f}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-32">Файл:</span>
            <div className="flex-1 flex gap-1">
              <input value={file} onChange={e=>setFile(e.target.value)} className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded outline-none focus:border-[#0078d4]"/>
              <button className="px-2 bg-[#3a3a4e] text-gray-300 hover:bg-[#4a4a5e] rounded text-[10px]">⋯</button>
            </div>
          </div>
          <div className="bg-[#1e1e2e] rounded border border-gray-700 p-2 text-gray-500">
            <div className="text-[10px]">Поддерживаемые версии: LandXML 1.0, 1.1, 2.0</div>
            <div className="text-[10px] mt-0.5">Система координат: МСК-70 (EPSG:20870)</div>
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <button onClick={onClose} className="px-3 py-1 bg-[#3a3a4e] text-gray-300 hover:bg-[#4a4a5e] rounded">Отмена</button>
            <button onClick={()=>onOK({format,file})} className="px-3 py-1 bg-[#0078d4] text-white hover:bg-[#0066b3] rounded">Импорт</button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Export/Print Dialog ──────────────────────────────────────────────────────
function ExportDialog({ onClose, onOK, mode }: { onClose: () => void; onOK: (d:{format:string}) => void; mode: "export"|"print" }) {
  const [format, setFormat] = useState(mode==="print"?"PDF":"LandXML")
  const [scope, setScope] = useState("Активный лист")
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#2d2d3d] border border-gray-600 rounded shadow-2xl w-[380px]">
        <div className="bg-[#1a1a2e] px-3 py-1.5 flex items-center justify-between border-b border-gray-700">
          <span className="text-[11px] font-bold text-white">{mode==="print"?"Печать":"Экспорт"}</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xs">✕</button>
        </div>
        <div className="p-4 flex flex-col gap-3 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-28">{mode==="print"?"Принтер:":"Формат:"}</span>
            <select value={format} onChange={e=>setFormat(e.target.value)} className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded">
              {mode==="print"
                ? ["PDF","DWF","PNG (300 DPI)","SVG"].map(f=><option key={f}>{f}</option>)
                : ["LandXML","IFC","DWG","DXF","Shapefile","GeoJSON","PDF"].map(f=><option key={f}>{f}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-28">Область:</span>
            <select value={scope} onChange={e=>setScope(e.target.value)} className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded">
              {["Активный лист","Все листы","Модель","Рамка видового экрана"].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-28">Масштаб:</span>
            <select className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded">
              {["1:500","1:1000","1:200","1:2000","По листу"].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <button onClick={onClose} className="px-3 py-1 bg-[#3a3a4e] text-gray-300 hover:bg-[#4a4a5e] rounded">Отмена</button>
            <button onClick={()=>onOK({format})} className="px-3 py-1 bg-[#0078d4] text-white hover:bg-[#0066b3] rounded">{mode==="print"?"Печать":"Экспорт"}</button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Volume Analysis Dialog ───────────────────────────────────────────────────
function VolumeDialog({ onClose, onOK }: { onClose: () => void; onOK: () => void }) {
  const [existing] = useState("Существующая поверхность")
  const [designed] = useState("Проектная поверхность")
  const results = [{zone:"Насыпь",vol:"12 450.3 м³",area:"8 230 м²",avg:"1.51 м"},{zone:"Выемка",vol:"9 870.1 м³",area:"7 140 м²",avg:"1.38 м"},{zone:"Баланс",vol:"+2 580.2 м³",area:"—",avg:"—"}]
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#2d2d3d] border border-gray-600 rounded shadow-2xl w-[500px]">
        <div className="bg-[#1a1a2e] px-3 py-1.5 flex items-center justify-between border-b border-gray-700">
          <span className="text-[11px] font-bold text-white">Объёмы земляных работ</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xs">✕</button>
        </div>
        <div className="p-4 flex flex-col gap-3 text-[11px]">
          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-gray-400">Поверхность 1 (факт):</span><div className="text-gray-200 mt-0.5">{existing}</div></div>
            <div><span className="text-gray-400">Поверхность 2 (проект):</span><div className="text-gray-200 mt-0.5">{designed}</div></div>
          </div>
          <table className="w-full border-collapse">
            <thead><tr className="bg-[#1e1e2e]">
              {["Зона","Объём","Площадь","Средняя глубина"].map(h=><th key={h} className="text-left px-2 py-1 text-gray-400 border border-gray-700">{h}</th>)}
            </tr></thead>
            <tbody>{results.map((r,i)=>(
              <tr key={i} className={i===2?"bg-[#1e2e1e]":""}>
                <td className="px-2 py-1 border border-gray-700 text-gray-300">{r.zone}</td>
                <td className={`px-2 py-1 border border-gray-700 font-mono ${i===2?r.vol.startsWith("+")?"text-green-400":"text-red-400":"text-gray-200"}`}>{r.vol}</td>
                <td className="px-2 py-1 border border-gray-700 text-gray-400">{r.area}</td>
                <td className="px-2 py-1 border border-gray-700 text-gray-400">{r.avg}</td>
              </tr>
            ))}</tbody>
          </table>
          <div className="flex justify-end gap-2 mt-1">
            <button onClick={onClose} className="px-3 py-1 bg-[#3a3a4e] text-gray-300 hover:bg-[#4a4a5e] rounded">Закрыть</button>
            <button onClick={()=>onOK()} className="px-3 py-1 bg-[#0078d4] text-white hover:bg-[#0066b3] rounded">Экспорт в CSV</button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Drawing Settings Dialog ──────────────────────────────────────────────────
function DrawingSettingsDialog({ onClose }: { onClose: () => void }) {
  const [units, setUnits] = useState("Метры")
  const [precision, setPrecision] = useState("0.001")
  const [crs, setCrs] = useState("МСК-70 / МСК-70 zone 1")
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#2d2d3d] border border-gray-600 rounded shadow-2xl w-[420px]">
        <div className="bg-[#1a1a2e] px-3 py-1.5 flex items-center justify-between border-b border-gray-700">
          <span className="text-[11px] font-bold text-white">Параметры чертежа</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xs">✕</button>
        </div>
        <div className="p-4 flex flex-col gap-3 text-[11px]">
          {([["Единицы измерения:",units,setUnits,["Метры","Километры","Футы"]],
            ["Точность:",precision,setPrecision,["0.1","0.01","0.001","0.0001"]],
            ["Система координат:",crs,setCrs,["МСК-70 / МСК-70 zone 1","WGS 84 / UTM zone 37N","Пользовательская"]]
          ] as [string, string, (v:string)=>void, string[]][]).map(([lbl,val,setter,opts])=>(
            <div key={lbl} className="flex items-center gap-2">
              <span className="text-gray-400 w-44">{lbl}</span>
              <select value={val} onChange={e=>setter(e.target.value)} className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded">
                {opts.map((o:string)=><option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-44">Угол севера, °:</span>
            <input defaultValue="0.000" className="w-24 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded outline-none focus:border-[#0078d4] font-mono"/>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={onClose} className="px-3 py-1 bg-[#3a3a4e] text-gray-300 hover:bg-[#4a4a5e] rounded">Отмена</button>
            <button onClick={onClose} className="px-3 py-1 bg-[#0078d4] text-white hover:bg-[#0066b3] rounded">ОК</button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main CivilCAD Module ────────────────────────────────────────────────────

const NAV_MODULES = [
  { id: "civilcad",   icon: "Monitor",        label: "ЛАПА — Редактор" },
  { id: "viewer3d",   icon: "Box",            label: "3D-вьюер" },
  { id: "projects",   icon: "FolderKanban",   label: "Управление проектами" },
  { id: "geodesy",    icon: "Mountain",       label: "Геодезия и рельеф" },
  { id: "alignment",  icon: "Spline",         label: "Профили и выравнивания" },
  { id: "corridor",   icon: "Navigation",     label: "Коридоры и поперечники" },
  { id: "roads",      icon: "Route",          label: "Дороги и трассы" },
  { id: "railway",    icon: "Train",          label: "Ж/д пути" },
  { id: "networks",   icon: "Network",        label: "Инженерные сети" },
  { id: "areas",      icon: "LayoutDashboard",label: "Площадные объекты" },
  { id: "bim",        icon: "Layers",         label: "BIM-инструменты" },
  { id: "analysis",   icon: "BarChart3",      label: "Анализ и расчёты" },
  { id: "specs",      icon: "ClipboardList",  label: "Ведомости и спецификации" },
  { id: "surfaces",   icon: "Triangle",       label: "Поверхности TIN / Grid" },
  { id: "integration",icon: "Puzzle",         label: "Интеграция ЛАПА" },
  { id: "standards",  icon: "BookCheck",      label: "Стандарты проектирования" },
  { id: "dynamic",    icon: "RefreshCw",      label: "Динамические модели" },
]

export default function CivilCADModule({ onNavigate }: { onNavigate?: (id: string) => void } = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [treeData, setTreeData] = useState<TreeNode[]>(TREE)
  const [selectedNode, setSelectedNode] = useState<string | null>("c1")
  const [visLayers, setVisLayers] = useState({ surfaces: true, alignments: true, corridors: true, pipenet: true, points: true, grid: true, sites: true })
  const [viewMode, setViewMode] = useState("wireframe")
  const [zoom, setZoom] = useState(1.1)
  const [pan, setPan] = useState({ x: 30, y: 20 })
  const drag = useRef<{ x: number; y: number } | null>(null)
  const [showCorridor, setShowCorridor] = useState(false)
  const [corridors, setCorridors] = useState<string[]>(["Дорога и парковочная зона"])
  const [activeMenuTab, setActiveMenuTab] = useState("Главная")
  const [activeLayout, setActiveLayout] = useState("Model")
  const [drawingTabs, setDrawingTabs] = useState(["Главная_парковка.dwg"])
  const [activeDrawingTab, setActiveDrawingTab] = useState("Главная_парковка.dwg")
  const [cursorCoords, setCursorCoords] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState("1:500")
  const [showRightPanel, setShowRightPanel] = useState(true)
  const [statusMsg, setStatusMsg] = useState("Выберите трассу: <Отмена>*")
  const [commandLine, setCommandLine] = useState("")
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [showSurface, setShowSurface] = useState(false)
  const [showAlignment, setShowAlignment] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showAssembly, setShowAssembly] = useState(false)
  const [showPoints, setShowPoints] = useState(false)
  const [showPipeNet, setShowPipeNet] = useState(false)
  const [showIntersection, setShowIntersection] = useState(false)
  const [showFeatureLine, setShowFeatureLine] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [analysisType, setAnalysisType] = useState("Анализ уклонов")
  const [showLayers, setShowLayers] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [exportMode, setExportMode] = useState<"export"|"print">("export")
  const [showVolume, setShowVolume] = useState(false)
  const [showDrawingSettings, setShowDrawingSettings] = useState(false)
  const [toast, setToast] = useState<string|null>(null)
  const showToast = (msg: string) => { setToast(msg); setTimeout(()=>setToast(null), 2500) }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpenDropdown(null)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const saveObject = (type: string, name: string, data: Record<string, unknown> = {}) => {
    fetch("https://functions.poehali.dev/0413bfb5-1eee-4ebd-91f9-66e74d563887", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: 1, object_type: type, name, data }),
    }).catch(() => {})
  }

  const toggleNode = (id: string) => {
    const toggle = (nodes: TreeNode[]): TreeNode[] =>
      nodes.map(n => n.id === id ? { ...n, expanded: !n.expanded } : { ...n, children: n.children ? toggle(n.children) : undefined })
    setTreeData(toggle)
  }

  const draw = useCallback(() => {
    const c = canvasRef.current; if (!c || c.width < 10) return
    const ctx = c.getContext("2d")!
    drawCanvas(ctx, c.width, c.height, visLayers, zoom, pan.x, pan.y, viewMode)
  }, [visLayers, zoom, pan, viewMode])

  useEffect(() => {
    const c = canvasRef.current; if (!c) return
    const ro = new ResizeObserver(() => { c.width = c.offsetWidth; c.height = c.offsetHeight; draw() })
    ro.observe(c); c.width = c.offsetWidth; c.height = c.offsetHeight; draw()
    return () => ro.disconnect()
  }, [draw])

  useEffect(() => { draw() }, [draw])

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    setZoom(z => Math.max(0.3, Math.min(6, z * (e.deltaY < 0 ? 1.12 : 0.9))))
  }
  const onMouseDown = (e: React.MouseEvent) => { drag.current = { x: e.clientX, y: e.clientY } }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y
    drag.current = { x: e.clientX, y: e.clientY }
    setPan(p => ({ x: p.x + dx, y: p.y + dy }))
  }
  const onMouseUp = () => { drag.current = null }

  const runCommand = (cmd: string) => {
    const c = cmd.trim().toUpperCase()
    if (c === "КОРИДОР" || c === "CORRIDOR") setShowCorridor(true)
    else if (c === "ПОВЕРХНОСТЬ" || c === "SURFACE" || c === "TIN" || c === "GRID") setShowSurface(true)
    else if (c === "ТРАССА" || c === "ALIGNMENT" || c === "AL") setShowAlignment(true)
    else if (c === "ПРОФИЛЬ" || c === "PROFILE" || c === "ПРОВ") setShowProfile(true)
    else if (c === "СЕЧЕНИЕ" || c === "ASSEMBLY" || c === "ТС" || c === "AS") setShowAssembly(true)
    else if (c === "ТОЧКИ" || c === "POINTS" || c === "ТЧК") setShowPoints(true)
    else if (c === "СЕТЬ" || c === "PIPE" || c === "ТРУБЫ") setShowPipeNet(true)
    else if (c === "ПЕРЕСЕЧЕНИЕ" || c === "INTERSECT" || c === "INT") setShowIntersection(true)
    else if (c === "ХАРЛИНИЯ" || c === "FEATURELINE" || c === "ХЛ" || c === "FL") setShowFeatureLine(true)
    else if (c === "АНАЛИЗ" || c === "УКЛОНЫ" || c === "SLOPES") { setAnalysisType("Анализ уклонов"); setShowAnalysis(true) }
    else if (c === "ОБЪЁМЫ" || c === "VOLUMES" || c === "ОБЪ") setShowVolume(true)
    else if (c === "СЛОИ" || c === "LAYERS" || c === "LA") setShowLayers(true)
    else if (c === "ИМПОРТ" || c === "IMPORT") setShowImport(true)
    else if (c === "ЭКСПОРТ" || c === "EXPORT") { setExportMode("export"); setShowExport(true) }
    else if (c === "ПЕЧАТЬ" || c === "PRINT" || c === "PLOT") { setExportMode("print"); setShowExport(true) }
    else if (c === "ПАРАМ" || c === "DRAWING" || c === "DWGSETTINGS") setShowDrawingSettings(true)
    else if (c === "ZOOM E" || c === "ВПИСАТЬ" || c === "ZE") { setZoom(1.1); setPan({ x: 30, y: 20 }) }
    else if (c === "REGEN" || c === "РЕГЕН" || c === "RE") draw()
    else { setStatusMsg(`Неизвестная команда: ${cmd}. Введите ? для справки`); setCommandLine(""); return }
    setStatusMsg(`Команда: ${cmd}`)
    setCommandLine("")
  }

  const toggleLayer = (key: keyof typeof visLayers) => setVisLayers(v => ({ ...v, [key]: !v[key] }))

  const openDialog = (key: string) => {
    setOpenDropdown(null)
    const k = key.toLowerCase()
    // Основные объекты
    if (k.includes("коридор")) { setShowCorridor(true) }
    else if (k.includes("поверхност") || k.includes("tin") || k.includes("grid") || k.includes("рельеф")) { setShowSurface(true) }
    else if ((k.includes("трасс") && !k.includes("ж/д")) || k.includes("alignment")) { setShowAlignment(true) }
    else if (k.includes("профиль") || k.includes("вид профил")) { setShowProfile(true) }
    else if (k.includes("типовое") || k.includes("тип. сечение") || k.includes("тип.") || k.includes("assembly") || k.includes("виды попереч") || k.includes("попереч")) { setShowAssembly(true) }
    // Точки
    else if (k.includes("точк") || k.includes("геодез") || k.includes("импорт точ") || k.includes("теодолит")) { setShowPoints(true) }
    // Сети
    else if (k.includes("труб") || k.includes("сеть") || k.includes("канализ") || k.includes("гидравл")) { setShowPipeNet(true) }
    // Пересечения
    else if (k.includes("пересечен")) { setShowIntersection(true) }
    // Характерные линии
    else if (k.includes("хар. лин") || k.includes("характерн")) { setShowFeatureLine(true) }
    // Анализ
    else if (k.includes("уклон") || k.includes("высот") || k.includes("водосбор") || k.includes("анализ")) {
      setAnalysisType(k.includes("высот") ? "Анализ высот" : k.includes("водосбор") ? "Анализ водосборов" : "Анализ уклонов")
      setShowAnalysis(true)
    }
    // Объёмы
    else if (k.includes("объём") || k.includes("земляных") || k.includes("ведомост")) { setShowVolume(true) }
    // Слои
    else if (k.includes("слой") || k.includes("слоёв") || k.includes("слои") || k.includes("диспетчер сло")) { setShowLayers(true) }
    // Импорт
    else if (k.includes("импорт") || k.includes("landxml") || k.includes("присоедин") || k.includes("облако точек")) { setShowImport(true) }
    // Экспорт
    else if (k.includes("экспорт") || k.includes("ifc") || k.includes("dwf") || k.includes("pdf") || k.includes("shapefile")) {
      setExportMode("export"); setShowExport(true)
    }
    // Печать
    else if (k.includes("печать") || k.includes("просмотр печ")) { setExportMode("print"); setShowExport(true) }
    // Параметры чертежа
    else if (k.includes("параметры черт") || k.includes("единицы") || k.includes("система коорд")) { setShowDrawingSettings(true) }
    // Виды (viewport)
    else if (k.includes("сверху") || k.includes("изометр")) { setStatusMsg(`Вид: ${key}`); setViewMode("wireframe") }
    else if (k.includes("тонирован") || k.includes("реалист")) { setViewMode("shaded"); setStatusMsg("Визуальный стиль: Тонирование") }
    else if (k.includes("каркас") || k.includes("wireframe")) { setViewMode("wireframe"); setStatusMsg("Визуальный стиль: 2D Каркас") }
    // Zoom / pan
    else if (k.includes("вписать") || k.includes("zoom e")) { setZoom(1.1); setPan({x:30,y:20}); setStatusMsg("Вписать всё") }
    else if (k.includes("зум") || k.includes("зум окн")) { setStatusMsg("Зум окном: укажите рамку") }
    // Редактирование — показываем toast
    else if (["перенести","копировать","повернуть","зеркало","обрезать","растянуть","масштаб","массив","сопряжение","разбить","соединить"].some(w=>k.includes(w))) {
      showToast(`Активен инструмент: ${key} — укажите объекты на чертеже`)
    }
    // Черчение
    else if (["полилиния","отрезок","дуга","окружность","прямоугольник","текст","штриховка"].some(w=>k.includes(w))) {
      showToast(`Черчение: ${key} — укажите первую точку`)
    }
    // Всё остальное
    else { setStatusMsg(`Выполнено: ${key}`) }
  }

  const handleToolbarItem = (item: string) => {
    openDialog(item)
    setStatusMsg(`Команда: ${item}`)
  }

  const handleDropdownItem = (parent: string, sub: string) => {
    openDialog(parent + " " + sub)
    setStatusMsg(`${parent.replace(" ▾","")}: ${sub}`)
  }

  const handleTreeNodeAction = (node: TreeNode) => {
    if (node.id === "surfaces" || node.id.startsWith("s") || node.id === "ds1") { setShowSurface(true) }
    else if (node.id === "alignments" || node.id.startsWith("a") || node.id === "ds2") { setShowAlignment(true) }
    else if (node.id === "corridors" || node.id === "c1" || node.id === "ds5") { setShowCorridor(true) }
    else if (node.id === "assemblies" || node.id.startsWith("asm_")) { setShowAssembly(true) }
    else { setStatusMsg(`Объект: ${node.label}`) }
  }

  const currentToolbar = TOOLBAR_BY_MENU[activeMenuTab] || TOOLBAR_BY_MENU["Главная"] || []

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] text-gray-200 overflow-hidden" style={{ fontFamily: "Arial, sans-serif", fontSize: 12 }}>

      {/* ── Title bar ── */}
      <div className="bg-[#1a1a2a] border-b border-gray-800 flex items-center px-2 py-0.5 gap-2 flex-shrink-0" style={{minHeight:24}}>
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 bg-[#0078d4] flex items-center justify-center text-white font-bold text-[10px] rounded-sm">C</div>
        </div>
        <div className="flex items-center gap-1 ml-1">
          {["🗁","💾","↩","↪"].map((ic,i)=>(
            <button key={i} className="text-gray-400 hover:text-white text-xs px-0.5 py-0.5">{ic}</button>
          ))}
        </div>
        <select className="bg-[#2d2d4e] border border-gray-600 text-[10px] text-gray-300 px-1 py-0.5 ml-1" style={{maxWidth:100}}>
          <option>ЛАПА 3D</option>
        </select>
        <div className="flex-1 text-center text-[11px] text-gray-400 font-semibold tracking-wide select-none">
          ЛАПА 3D 2026 — Главная_парковка.dwg
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <input placeholder="Введите ключевое слово или фразу" className="bg-[#2a2a3a] border border-gray-600 text-[10px] text-gray-400 px-2 py-0.5 w-44 rounded-sm placeholder-gray-600 outline-none focus:border-blue-500" />
          <span className="text-[10px] text-gray-500 ml-1">пользователь</span>
        </div>
      </div>

      {/* ── Menu bar (ribbon tabs) ── */}
      <div className="bg-[#2d2d3d] border-b border-gray-700 flex items-center gap-0 overflow-x-auto flex-shrink-0">
        {MENU_ITEMS.map(m => (
          <button key={m} onClick={() => { setActiveMenuTab(m); setStatusMsg(`Лента: ${m}`) }}
            className={`px-3 py-1.5 text-xs whitespace-nowrap transition-colors border-b-2 ${activeMenuTab === m ? "border-[#0078d4] bg-[#252535] text-white" : "border-transparent text-gray-400 hover:bg-gray-700 hover:text-white"}`}>
            {m}
          </button>
        ))}
      </div>

      {/* ── Ribbon toolbar ── */}
      <div ref={dropdownRef} className="bg-[#2a2a3a] border-b border-gray-700 flex items-stretch gap-0 overflow-x-auto flex-shrink-0 relative" style={{height:82}}>
        {currentToolbar.map(group => {
          const lgItems = (group.items as RibbonItem[]).filter(i => i.size === "lg")
          const smItems = (group.items as RibbonItem[]).filter(i => i.size === "sm")
          const dropdownPanel = (dropKey: string) => (
            <div className="absolute top-full left-0 z-50 bg-[#2d2d3d] border border-gray-600 shadow-xl min-w-[200px] py-1 rounded mt-0.5">
              {(DROPDOWN_ITEMS[dropKey] || []).map(sub => (
                <button key={sub} onClick={() => { handleDropdownItem(dropKey, sub); setOpenDropdown(null) }}
                  className="w-full text-left px-3 py-1 text-[11px] text-gray-300 hover:bg-[#0078d4] hover:text-white transition-colors whitespace-nowrap">
                  {sub}
                </button>
              ))}
            </div>
          )
          return (
            <div key={group.label} className="flex flex-col border-r border-gray-700 flex-shrink-0" style={{height:82}}>
              {/* buttons row — fixed height 66px */}
              <div className="flex items-stretch px-1 pt-1 gap-0.5" style={{height:66}}>

                {/* ─ Large buttons ─ */}
                {lgItems.map(item => {
                  const dropKey = item.drop
                  const hasDrop = !!(dropKey && DROPDOWN_ITEMS[dropKey])
                  const dKey = dropKey || item.label
                  const isOpen = openDropdown === dKey
                  return (
                    <div key={item.label} className="relative flex-shrink-0 flex flex-col" style={{width:52}}>
                      <div className={`flex flex-col items-center rounded transition-colors flex-1 ${isOpen ? "bg-[#0078d4]" : "hover:bg-[#3a3a4e]"}`}>
                        <button
                          onClick={() => { handleToolbarItem(item.label); setOpenDropdown(null) }}
                          className="flex flex-col items-center justify-start gap-1 px-1 pt-2 w-full flex-1">
                          <Icon name={item.icon} size={24} fallback="Square" className={isOpen ? "text-white" : "text-[#c8d4e0]"} />
                          <span className={`text-[9px] leading-tight text-center w-full truncate px-0.5 ${isOpen ? "text-white" : "text-[#c8d4e0]"}`}>
                            {item.label}
                          </span>
                        </button>
                        {hasDrop && (
                          <button
                            onClick={e => { e.stopPropagation(); setOpenDropdown(isOpen ? null : dKey) }}
                            className={`text-[9px] w-full text-center pb-0.5 hover:bg-[#005fa3] rounded-b transition-colors ${isOpen ? "text-white" : "text-gray-400 hover:text-white"}`}>
                            ▾
                          </button>
                        )}
                      </div>
                      {hasDrop && isOpen && dropdownPanel(dropKey!)}
                    </div>
                  )
                })}

                {/* ─ Small buttons ─ */}
                {smItems.length > 0 && (
                  <div className="flex flex-col justify-around py-0.5 ml-0.5" style={{height:66}}>
                    {smItems.map(item => {
                      const dropKey = item.drop
                      const hasDrop = !!(dropKey && DROPDOWN_ITEMS[dropKey])
                      const dKey = dropKey || item.label
                      const isOpen = openDropdown === dKey
                      return (
                        <div key={item.label} className="relative flex items-center">
                          <button
                            onClick={() => { handleToolbarItem(item.label); setOpenDropdown(null) }}
                            className={`flex items-center gap-1 pl-1 pr-0.5 py-px rounded-l transition-colors text-[10px] leading-tight whitespace-nowrap ${isOpen ? "bg-[#0078d4] text-white" : "text-[#c8d4e0] hover:bg-[#3a3a4e] hover:text-white"}`}>
                            <Icon name={item.icon} size={13} fallback="Square" />
                            <span className="max-w-[80px] truncate">{item.label}</span>
                          </button>
                          {hasDrop && (
                            <button
                              onClick={e => { e.stopPropagation(); setOpenDropdown(isOpen ? null : dKey) }}
                              className={`px-0.5 py-px text-[9px] rounded-r border-l border-gray-600 transition-colors ${isOpen ? "bg-[#0078d4] text-white" : "text-gray-400 hover:bg-[#3a3a4e] hover:text-white"}`}>
                              ▾
                            </button>
                          )}
                          {hasDrop && isOpen && dropdownPanel(dropKey!)}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* group label — fixed 16px */}
              <div className="flex items-center justify-center border-t border-gray-700 bg-[#252535] whitespace-nowrap" style={{height:16}}>
                <span className="text-[9px] text-gray-500 px-1">{group.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Drawing tab bar ── */}
      <div className="bg-[#252535] border-b border-gray-700 flex items-center gap-0 px-1 py-0" style={{minHeight:22}}>
        <span className="text-[9px] text-gray-500 px-2">[-]</span>
        <div className="flex items-center gap-0">
          {drawingTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveDrawingTab(tab)}
              className={`border-t border-l border-r border-gray-600 px-3 py-0.5 text-[10px] flex items-center gap-1 border-b-0 transition-colors ${activeDrawingTab === tab ? "bg-[#1e1e2e] text-blue-300" : "bg-[#2a2a3e] text-gray-500 hover:text-gray-300"}`}
            >
              <Icon name="FileText" size={9} />
              {tab}
              {drawingTabs.length > 1 && (
                <span
                  className="ml-1 text-gray-500 hover:text-white text-[9px]"
                  onClick={e => {
                    e.stopPropagation()
                    const next = drawingTabs.filter(t => t !== tab)
                    setDrawingTabs(next)
                    if (activeDrawingTab === tab) setActiveDrawingTab(next[0])
                  }}
                >✕</span>
              )}
            </button>
          ))}
          <button
            className="text-gray-500 hover:text-white px-2 py-0.5 text-[10px]"
            onClick={() => {
              const name = `Новый_${drawingTabs.length}.dwg`
              setDrawingTabs(prev => [...prev, name])
              setActiveDrawingTab(name)
            }}
          >+</button>
        </div>
      </div>

      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: Toolbox strip ── */}
        <div className="bg-[#252535] border-r border-gray-700 w-6 flex flex-col items-center py-1 gap-0.5">
          {[
            { icon: "MousePointer2", title: "Выбор" },
            { icon: "Move", title: "Перенести" },
            { icon: "ZoomIn", title: "Увеличить" },
            { icon: "ZoomOut", title: "Уменьшить" },
            { icon: "Hand", title: "Панорама" },
            { icon: "RotateCcw", title: "Орбита" },
            { icon: "Ruler", title: "Измерение" },
            { icon: "Layers", title: "Слои" },
            { icon: "Settings", title: "Параметры" },
          ].map(({ icon, title }) => (
            <button key={icon} title={title}
              onClick={() => setStatusMsg(`Инструмент: ${title}`)}
              className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#0078d4] rounded transition-colors">
              <Icon name={icon} size={11} fallback="Square" />
            </button>
          ))}
        </div>

        {/* ── Left: Toolspace / Tree ── */}
        <div className="bg-[#1e1e2e] border-r border-gray-600 flex flex-col overflow-hidden flex-shrink-0" style={{ width: 160 }}>
          {/* TOOL SPACE header */}
          <div className="bg-[#252535] px-2 py-1 flex items-center justify-between border-b border-gray-600">
            <span className="text-[10px] text-gray-300 font-bold tracking-widest uppercase">TOOL SPACE</span>
            <div className="flex gap-0.5">
              {[
                { icon: "ClipboardList", title: "Проспект" },
                { icon: "FolderOpen",    title: "Открыть" },
                { icon: "Search",        title: "Поиск" },
                { icon: "HelpCircle",    title: "Справка" },
              ].map(({ icon, title }) => (
                <button key={icon} title={title}
                  onClick={() => setStatusMsg(`Toolspace: ${title}`)}
                  className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#0078d4] rounded transition-colors">
                  <Icon name={icon} size={11} fallback="Square" />
                </button>
              ))}
            </div>
          </div>
          {/* Диспетчер / Параметры tabs */}
          <div className="flex border-b border-gray-600">
            {["Диспетчер","Параметры"].map((t, i) => (
              <button key={t}
                className={`flex-1 text-[11px] py-1 border-r border-gray-600 last:border-0 transition-colors font-medium
                  ${i === 0 ? "bg-[#1e1e2e] text-white border-b-2 border-b-[#0078d4]" : "bg-[#252535] text-gray-400 hover:text-white hover:bg-[#2d2d4e]"}`}
                onClick={() => setStatusMsg(`Вкладка: ${t}`)}>
                {t}
              </button>
            ))}
          </div>
          {/* Active Drawing View */}
          <div className="bg-[#252535] px-2 py-1 flex items-center gap-1 border-b border-gray-600 cursor-pointer hover:bg-[#2e2e45]"
            onClick={() => setStatusMsg("Активный чертёж: Главная парковка_Финал")}>
            <span className="text-[11px] text-gray-300 flex-1 truncate">Вид активного чертёжа</span>
            <Icon name="ChevronDown" size={10} className="text-gray-500 flex-shrink-0" />
          </div>
          {/* Tree */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#1e1e2e]">
            {treeData.map(node => (
              <TreeItem key={node.id} node={node} depth={0} selected={selectedNode}
                onSelect={setSelectedNode} onToggle={toggleNode} onAction={handleTreeNodeAction} />
            ))}
          </div>
        </div>

        {/* ── Side tabs ── */}
        <div className="bg-[#1e1e2e] border-r border-gray-700 w-4 flex flex-col items-center py-4 gap-4">
          {["Диспетчер","Параметры","Геодезия","Инструменты"].map(t => (
            <div key={t} onClick={() => setStatusMsg(`Панель: ${t}`)}
              className="text-[8px] text-gray-600 hover:text-gray-300 cursor-pointer active:text-blue-400 transition-colors"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>{t}</div>
          ))}
        </div>

        {/* ── Centre: Viewport ── */}
        <div className="flex-1 relative overflow-hidden bg-[#1a1a2e]"
          onMouseMove={e => {
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
            const mx = (e.clientX - rect.left - pan.x) / zoom
            const my = (e.clientY - rect.top - pan.y) / zoom
            setCursorCoords({ x: Math.round(mx * 10)/10, y: Math.round(my * 10)/10 })
          }}>
          {/* viewport toolbar — Civil 3D style */}
          <div className="absolute top-0 left-0 z-10 flex items-center gap-0 bg-black/40 border-b border-gray-800">
            <button onClick={() => setStatusMsg("Меню видового экрана")}
              className="text-[10px] text-gray-300 hover:bg-gray-700 px-1.5 py-0.5 border-r border-gray-700">[-]</button>
            <button onClick={() => setStatusMsg("Вид сверху")}
              className="text-[10px] text-gray-300 hover:bg-gray-700 px-2 py-0.5 border-r border-gray-700">[Сверху]</button>
            <button onClick={() => setViewMode(m => m === "wireframe" ? "shaded" : "wireframe")}
              className="text-[10px] text-gray-300 hover:bg-gray-700 px-2 py-0.5">
              [{viewMode === "wireframe" ? "2D Каркас" : "Тонирование"}]
            </button>
          </div>
          {/* Viewport compass (top-right) */}
          <div className="absolute top-1 right-2 z-10 select-none pointer-events-none">
            <svg width="52" height="52" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="24" fill="rgba(0,0,0,0.35)" stroke="#555" strokeWidth="1"/>
              <text x="26" y="10" textAnchor="middle" fill="#aaa" fontSize="7" fontWeight="bold">N</text>
              <text x="26" y="47" textAnchor="middle" fill="#aaa" fontSize="7" fontWeight="bold">S</text>
              <text x="6" y="29" textAnchor="middle" fill="#aaa" fontSize="7" fontWeight="bold">W</text>
              <text x="46" y="29" textAnchor="middle" fill="#aaa" fontSize="7" fontWeight="bold">E</text>
              <rect x="16" y="16" width="20" height="20" rx="3" fill="#0078d4" opacity="0.85"/>
              <text x="26" y="30" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">ПЛАН</text>
              <line x1="26" y1="12" x2="26" y2="17" stroke="#888" strokeWidth="1"/>
              <line x1="26" y1="35" x2="26" y2="40" stroke="#888" strokeWidth="1"/>
              <line x1="10" y1="26" x2="15" y2="26" stroke="#888" strokeWidth="1"/>
              <line x1="37" y1="26" x2="42" y2="26" stroke="#888" strokeWidth="1"/>
            </svg>
          </div>
          {/* Scale / zoom controls top-right corner */}
          <div className="absolute top-1 right-14 z-10 flex items-center gap-1">
            <button onClick={() => { setZoom(1.1); setPan({ x: 30, y: 20 }) }} className="text-[9px] text-gray-400 hover:text-white bg-black/30 px-1 py-0.5 rounded">Вписать</button>
            <button onClick={() => setZoom(z => z * 1.25)} className="text-[9px] text-gray-400 hover:text-white bg-black/30 px-1.5 py-0.5 rounded">+</button>
            <button onClick={() => setZoom(z => z * 0.8)} className="text-[9px] text-gray-400 hover:text-white bg-black/30 px-1.5 py-0.5 rounded">−</button>
            <button onClick={() => setShowRightPanel(s => !s)} className="text-[9px] text-gray-400 hover:text-white bg-black/30 px-1 py-0.5 rounded">
              <Icon name={showRightPanel ? "PanelRightClose" : "PanelRightOpen"} size={11} />
            </button>
          </div>

          <canvas ref={canvasRef} className="w-full h-full block"
            style={{ cursor: drag.current ? "grabbing" : "crosshair" }}
            onWheel={onWheel} onMouseDown={onMouseDown} onMouseMove={onMouseMove}
            onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
            onContextMenu={e => e.preventDefault()}
            onDoubleClick={() => setShowCorridor(true)} />

          {/* Dialogs */}
          <AnimatePresence>
            {showCorridor && (
              <CorridorDialog
                onClose={() => setShowCorridor(false)}
                onOK={def => {
                  setCorridors(prev => prev.includes(def.name) ? prev : [...prev, def.name])
                  setShowCorridor(false)
                  setStatusMsg(`Коридор «${def.name}» успешно создан`)
                  saveObject("corridor", def.name, { name: def.name })
                  showToast(`💾 Коридор «${def.name}» сохранён в проект`)
                }}
              />
            )}
            {showSurface && (
              <SurfaceDialog
                onClose={() => setShowSurface(false)}
                onOK={def => {
                  setShowSurface(false)
                  setStatusMsg(`Поверхность «${def.name}» (${def.type}) создана`)
                  saveObject("surface", def.name, { type: def.type })
                  showToast(`💾 Поверхность «${def.name}» сохранена`)
                  setTreeData(prev => {
                    const add = (nodes: TreeNode[]): TreeNode[] => nodes.map(n => {
                      if (n.id === "surfaces") return { ...n, children: [...(n.children||[]), { id: `surf_${Date.now()}`, label: def.name, icon: "Triangle", color: "#4ade80" }] }
                      return { ...n, children: n.children ? add(n.children) : undefined }
                    })
                    return add(prev)
                  })
                }}
              />
            )}
            {showAlignment && (
              <AlignmentDialog
                onClose={() => setShowAlignment(false)}
                onOK={def => {
                  const length = def.elements.reduce((s,e)=>s+(parseFloat(e.length)||0),0).toFixed(0)
                  setShowAlignment(false)
                  setStatusMsg(`Трасса «${def.name}» создана, длина ${length} м`)
                  saveObject("alignment", def.name, { length })
                  showToast(`💾 Трасса «${def.name}» сохранена`)
                  setTreeData(prev => {
                    const add = (nodes: TreeNode[]): TreeNode[] => nodes.map(n => {
                      if (n.id === "alignments") return { ...n, children: [...(n.children||[]), { id: `al_${Date.now()}`, label: def.name, icon: "Minus", color: "#f97316" }] }
                      return { ...n, children: n.children ? add(n.children) : undefined }
                    })
                    return add(prev)
                  })
                }}
              />
            )}
            {showProfile && (
              <ProfileDialog
                onClose={() => setShowProfile(false)}
                onOK={def => {
                  setShowProfile(false)
                  setStatusMsg(`Профиль «${def.name}» создан для трассы ${def.alignment}`)
                  saveObject("profile", def.name, { alignment: def.alignment })
                  showToast(`💾 Профиль «${def.name}» сохранён`)
                }}
                alignments={["Трасса ШД-38","Ул. Трумана","Бордюр периметра"]}
              />
            )}
            {showAssembly && (
              <AssemblyDialog
                onClose={() => setShowAssembly(false)}
                onOK={def => {
                  setShowAssembly(false)
                  setStatusMsg(`Типовое сечение «${def.name}» создано (${def.subassemblies.length} подсечений)`)
                  saveObject("assembly", def.name, { count: def.subassemblies.length })
                  showToast(`💾 Типовое сечение «${def.name}» сохранено`)
                  setTreeData(prev => {
                    const add = (nodes: TreeNode[]): TreeNode[] => nodes.map(n => {
                      if (n.id === "assemblies") return { ...n, children: [...(n.children||[]), { id: `asm_${Date.now()}`, label: def.name, icon: "Layers", color: "#94a3b8" }] }
                      return { ...n, children: n.children ? add(n.children) : undefined }
                    })
                    return add(prev)
                  })
                }}
              />
            )}
            {showPoints && (
              <PointsDialog onClose={()=>setShowPoints(false)} onOK={pts=>{
                setShowPoints(false)
                setStatusMsg(`Создано точек: ${pts.length}`)
                saveObject("points", `Группа точек (${pts.length})`, { count: pts.length, pts })
                showToast(`💾 Точек сохранено: ${pts.length}`)
                setTreeData(prev=>{
                  const add=(nodes:TreeNode[]):TreeNode[]=>nodes.map(n=>n.id==="points"?{...n,children:[...(n.children||[]),...pts.map((p,i)=>({id:`pt_${Date.now()+i}`,label:p.name,icon:"MapPin",color:"#f59e0b"}))]}:{...n,children:n.children?add(n.children):undefined})
                  return add(prev)
                })
              }}/>
            )}
            {showPipeNet && (
              <PipeNetDialog onClose={()=>setShowPipeNet(false)} onOK={d=>{
                setShowPipeNet(false)
                setStatusMsg(`Сеть «${d.name}» создана (${d.type})`)
                saveObject("pipe_network", d.name, { type: d.type, material: d.material })
                showToast(`💾 Сеть «${d.name}» сохранена`)
                setTreeData(prev=>{
                  const add=(nodes:TreeNode[]):TreeNode[]=>nodes.map(n=>n.id==="pipenet"?{...n,children:[...(n.children||[]),{id:`pipe_${Date.now()}`,label:d.name,icon:"Network",color:"#6366f1"}]}:{...n,children:n.children?add(n.children):undefined})
                  return add(prev)
                })
              }}/>
            )}
            {showIntersection && (
              <IntersectionDialog onClose={()=>setShowIntersection(false)} onOK={d=>{
                setShowIntersection(false)
                setStatusMsg(`Пересечение «${d.name}»: ${d.mainRoad} × ${d.secRoad}`)
                saveObject("intersection", d.name, { mainRoad: d.mainRoad, secRoad: d.secRoad })
                showToast(`💾 Пересечение «${d.name}» сохранено`)
                setTreeData(prev=>{
                  const add=(nodes:TreeNode[]):TreeNode[]=>nodes.map(n=>n.id==="intersections"?{...n,children:[...(n.children||[]),{id:`int_${Date.now()}`,label:d.name,icon:"Plus",color:"#f43f5e"}]}:{...n,children:n.children?add(n.children):undefined})
                  return add(prev)
                })
              }}/>
            )}
            {showFeatureLine && (
              <FeatureLineDialog onClose={()=>setShowFeatureLine(false)} onOK={d=>{
                setShowFeatureLine(false)
                setStatusMsg(`Характерная линия «${d.name}» создана`)
                saveObject("feature_line", d.name, { site: d.site })
                showToast(`💾 Характерная линия «${d.name}» сохранена`)
                setTreeData(prev=>{
                  const add=(nodes:TreeNode[]):TreeNode[]=>nodes.map(n=>n.id==="featurelines"?{...n,children:[...(n.children||[]),{id:`fl_${Date.now()}`,label:d.name,icon:"Spline",color:"#ec4899"}]}:{...n,children:n.children?add(n.children):undefined})
                  return add(prev)
                })
              }}/>
            )}
            {showAnalysis && <AnalysisDialog type={analysisType} onClose={()=>setShowAnalysis(false)} onOK={d=>{setShowAnalysis(false);setStatusMsg(`${d.type}: выполнен для ${d.surface}`)}}/>}
            {showVolume && <VolumeDialog onClose={()=>setShowVolume(false)} onOK={()=>{setShowVolume(false);showToast("Ведомость объёмов экспортирована в CSV")}}/>}
            {showLayers && <LayersDialog onClose={()=>setShowLayers(false)}/>}
            {showImport && <ImportDialog onClose={()=>setShowImport(false)} onOK={d=>{setShowImport(false);setStatusMsg(`Импорт ${d.format}: ${d.file} завершён`)}}/>}
            {showExport && <ExportDialog mode={exportMode} onClose={()=>setShowExport(false)} onOK={d=>{setShowExport(false);showToast(`${exportMode==="print"?"Печать":"Экспорт"} в ${d.format} завершён`)}}/>}
            {showDrawingSettings && <DrawingSettingsDialog onClose={()=>setShowDrawingSettings(false)}/>}
          </AnimatePresence>

          {/* Toast notification */}
          <AnimatePresence>
            {toast && (
              <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:20}}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#0078d4] text-white text-[11px] px-4 py-2 rounded shadow-xl z-50 pointer-events-none">
                {toast}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right: Section views ── */}
        {showRightPanel && <CrossSectionPanel alignments={corridors} onClose={() => setShowRightPanel(false)} />}
      </div>

      {/* ── Command line ── */}
      <div className="bg-[#0f0f1e] border-t border-gray-700 flex flex-col flex-shrink-0">
        <div className="px-3 py-0.5 text-[10px] text-gray-400 font-mono border-b border-gray-800">{statusMsg}</div>
        <div className="flex items-center gap-1 px-2 py-0.5">
          <span className="text-[10px] text-gray-600 font-mono select-none">⚡</span>
          <input
            value={commandLine}
            onChange={e => setCommandLine(e.target.value)}
            onKeyDown={e => e.key === "Enter" && runCommand(commandLine)}
            placeholder="Введите команду: ТРАССА, КОРИДОР, ПОВЕРХНОСТЬ, ПРОФИЛЬ, СЕЧЕНИЕ, ТОЧКИ, СЕТЬ, СЛОИ, АНАЛИЗ, ОБЪЁМЫ, ИМПОРТ, ПЕЧАТЬ, ZE…"
            className="flex-1 bg-transparent text-[11px] text-green-300 font-mono outline-none placeholder-gray-700 px-2"
          />
          <button onClick={() => runCommand(commandLine)} className="text-[10px] text-gray-500 hover:text-white px-2">↵</button>
        </div>
      </div>

      {/* ── Status bar (Civil 3D bottom bar) ── */}
      <div className="bg-[#1a1a2a] border-t border-gray-800 flex items-center px-1 gap-0 flex-shrink-0" style={{minHeight:22}}>
        {/* Layout tabs */}
        <div className="flex items-center gap-0 border-r border-gray-700 pr-1 mr-1">
          <button onClick={() => setStatusMsg("Главная парковка_Финал")}
            className="text-[9px] text-gray-400 hover:text-white px-0.5 py-0.5">☰</button>
          {[{key:"Model",label:"Модель"},{key:"Layout1",label:"Лист 1"},{key:"Layout2",label:"Лист 2"}].map(t => (
            <button key={t.key} onClick={() => { setActiveLayout(t.key); setStatusMsg(`Макет: ${t.label}`) }}
              className={`text-[9px] px-2 py-0.5 border-x border-gray-700 transition-colors ${activeLayout===t.key?"bg-[#2d2d4e] text-white":"text-gray-500 hover:text-white hover:bg-[#252535]"}`}>
              {t.label}
            </button>
          ))}
          <button onClick={() => setStatusMsg("Новый лист")}
            className="text-[9px] text-gray-500 hover:text-white px-1.5 py-0.5">+</button>
        </div>
        {/* Center status icons */}
        <div className="flex items-center gap-1 text-[9px] text-gray-500 flex-1">
          <span className={`font-bold px-1 ${activeLayout==="Model"?"text-white bg-[#0078d4]":"text-gray-400"}`}>
            {activeLayout==="Model"?"МОДЕЛЬ":"ЛИСТ"}
          </span>
          <button onClick={() => setScale(s=>s==="1:500"?"1:1000":s==="1:1000"?"1:200":"1:500")}
            className="hover:text-white px-1 border border-gray-700 text-[9px]">{scale}</button>
          {["⊞","∠","⚙"].map((ic,i)=>(
            <button key={i} className="hover:text-white px-0.5">{ic}</button>
          ))}
        </div>
        {/* Cursor coordinates right */}
        <div className="flex items-center gap-2 text-[9px] font-mono text-gray-500 border-l border-gray-700 pl-2">
          <span className="text-gray-400">{cursorCoords.x.toFixed(2)}, {cursorCoords.y.toFixed(2)}, 0.00</span>
          <span className="text-gray-600">МОДЕЛЬ</span>
        </div>
      </div>
    </div>
  )
}