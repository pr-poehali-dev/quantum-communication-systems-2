import { Feature, SolidKind } from "../sapr-engine"

// ── Вкладки CommandManager (как в SolidWorks) ──────────────────────────────
export type CM = "features" | "sketch" | "sheet" | "weld" | "mold" | "assembly" | "sim" | "flow" | "cam" | "render" | "config" | "pdm" | "eval" | "exchange" | "kpp" | "tpp" | "data" | "swnew"

export const CM_TABS: { id: CM; label: string; icon: string }[] = [
  { id: "features", label: "Элементы", icon: "Boxes" },
  { id: "sketch", label: "Эскиз", icon: "PenTool" },
  { id: "sheet", label: "Листовой металл", icon: "Layers" },
  { id: "weld", label: "Сварные конструкции", icon: "Flame" },
  { id: "mold", label: "Литьё / формы", icon: "Container" },
  { id: "assembly", label: "Сборка", icon: "Combine" },
  { id: "sim", label: "Simulation", icon: "Activity" },
  { id: "flow", label: "Flow Simulation", icon: "Wind" },
  { id: "cam", label: "CAM (ЧПУ)", icon: "Cpu" },
  { id: "render", label: "PhotoView 360", icon: "Camera" },
  { id: "config", label: "Конфигурации", icon: "SlidersHorizontal" },
  { id: "pdm", label: "PDM", icon: "Database" },
  { id: "eval", label: "Анализ", icon: "Gauge" },
  { id: "exchange", label: "Обмен / AR-VR", icon: "ArrowLeftRight" },
  { id: "kpp", label: "КПП", icon: "Ruler" },
  { id: "tpp", label: "ТПП", icon: "Wrench" },
  { id: "data", label: "Управление данными", icon: "Database" },
  { id: "swnew", label: "Новинки", icon: "Sparkles" },
]

// Инструменты каждой вкладки: [название, иконка, действие-подсказка]
export const FEATURE_TOOLS = [
  { n: "Вытянутая бобышка", ic: "BoxSelect", kind: "box" as SolidKind, op: "Выдавливание" as Feature["op"] },
  { n: "Вытянутый вырез", ic: "SquareDashedBottom", kind: "box" as SolidKind, op: "Выдавливание" as Feature["op"], cut: true },
  { n: "Повёрнутая бобышка", ic: "RotateCw", kind: "revolve" as SolidKind, op: "Вращение" as Feature["op"] },
  { n: "Элемент по сечениям", ic: "Layers2", kind: "cone" as SolidKind, op: "По сечениям" as Feature["op"] },
  { n: "По траектории", ic: "Spline", kind: "torus" as SolidKind, op: "Кинематическая" as Feature["op"] },
  { n: "Скругление", ic: "Circle", mod: "fillet" },
  { n: "Фаска", ic: "Triangle", mod: "chamfer" },
  { n: "Оболочка", ic: "Container", mod: "shell" },
  { n: "Ребро жёсткости", ic: "Minus", mod: "rib" },
  { n: "Массив", ic: "Grid3x3", mod: "pattern" },
  { n: "Зеркало", ic: "FlipHorizontal2", mod: "mirror" },
  { n: "Придание толщины", ic: "Copy", mod: "thicken" },
]
