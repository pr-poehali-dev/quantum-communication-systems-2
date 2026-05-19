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

// ─── Constants ──────────────────────────────────────────────────────────────

const TREE: TreeNode[] = [
  {
    id: "project", label: "Главная парковка_Финал", icon: "FolderOpen", expanded: true, children: [
      { id: "points", label: "Точки", icon: "MapPin", color: "#f59e0b" },
      { id: "ptgroups", label: "Группы точек", icon: "Group", color: "#f59e0b" },
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
      { id: "turnouts", label: "Разъезды и пересечения", icon: "ArrowLeftRight", color: "#94a3b8" },
      { id: "catchments", label: "Водосборные бассейны", icon: "Droplets", color: "#60a5fa" },
      { id: "pipenet", label: "Трубопроводные сети", icon: "Network", color: "#6366f1" },
      { id: "pressnet", label: "Напорные сети", icon: "Gauge", color: "#8b5cf6" },
      { id: "bridges", label: "Мосты", icon: "Bridge", color: "#f59e0b" },
      {
        id: "corridors", label: "Коридоры", icon: "RoadHorizon", color: "#f97316", expanded: true, children: [
          { id: "c1", label: "Дорога и парковочная зона", icon: "Minus", color: "#f97316" },
        ]
      },
      { id: "assemblies", label: "Типовые сечения", icon: "Layers", color: "#94a3b8" },
      { id: "subassemblies", label: "Подсечения", icon: "Component", color: "#94a3b8" },
      { id: "intersections", label: "Пересечения", icon: "Plus", color: "#f43f5e" },
      { id: "survey", label: "Геодезия", icon: "Compass", color: "#10b981" },
      { id: "vfg", label: "Группы видовых рамок", icon: "Frame", color: "#64748b" },
    ]
  },
  {
    id: "datasrc", label: "Внешние ссылки []", icon: "Database", expanded: false, children: [
      { id: "ds1", label: "Поверхности", icon: "Mountain", color: "#4ade80" },
      { id: "ds2", label: "Трассы", icon: "Route", color: "#f97316" },
      { id: "ds3", label: "Трубопроводные сети", icon: "Network", color: "#6366f1" },
      { id: "ds4", label: "Напорные сети", icon: "Gauge", color: "#8b5cf6" },
      { id: "ds5", label: "Коридоры", icon: "RoadHorizon", color: "#f97316" },
      { id: "ds6", label: "Группы видовых рамок", icon: "Frame", color: "#64748b" },
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

const MENU_ITEMS = ["Главная","Вставка","Аннотации","Редактирование","Анализ","Вид","Управление","Вывод","Геодезия","Ж/д","Прозрачность","InfraWorks","Совместная работа","Справка","Надстройки","Express Tools","Геолокация"]

const TOOLBAR_BY_MENU: Record<string, { label: string; items: string[] }[]> = {
  "Главная": [
    { label: "Планировка", items: ["Участок ▾","Точки ▾","Поверхности ▾"] },
    { label: "Создать топооснову", items: ["Трасса ▾","Хар. линия ▾","Профиль ▾","Сечение ▾","Линии образцов"] },
    { label: "Создать проект", items: ["Вид профиля ▾","Планировка ▾","Коридор ▾","Труб. сеть ▾"] },
    { label: "Профиль и поперечники", items: ["Виды сечений ▾"] },
    { label: "Черчение", items: ["Черчение ▾"] },
    { label: "Редактирование", items: ["Копировать ▾","Зеркало","Сопряжение","Массив ▾"] },
    { label: "Слои", items: ["Слои ▾"] },
    { label: "Буфер обмена", items: ["Буфер обмена"] },
  ],
  "Вставка": [
    { label: "Блоки", items: ["Вставить ▾","Создать блок","Редактировать блок"] },
    { label: "Атрибуты", items: ["Определить атрибут","Синхронизировать"] },
    { label: "Ссылки", items: ["Внешняя ссылка ▾","Подложка ▾"] },
    { label: "Импорт", items: ["Импорт ▾","LandXML","IFC"] },
  ],
  "Аннотации": [
    { label: "Текст", items: ["Однострочный","Многострочный ▾","Редактировать"] },
    { label: "Размеры", items: ["Линейный ▾","Угловой","Радиус","Выноска ▾"] },
    { label: "Стили", items: ["Стили текста ▾","Стили размеров ▾"] },
    { label: "Таблицы", items: ["Таблица ▾","Экспорт"] },
  ],
  "Редактирование": [
    { label: "Изменить", items: ["Копировать ▾","Зеркало","Переместить","Поворот"] },
    { label: "Размер", items: ["Масштаб","Растянуть","Обрезать ▾","Удлинить ▾"] },
    { label: "Объекты", items: ["Фаска","Сопряжение","Разбить","Соединить"] },
    { label: "Массив", items: ["Прямоугольный ▾","Круговой ▾","По траектории ▾"] },
  ],
  "Анализ": [
    { label: "Поверхности", items: ["Уклоны ▾","Водосборы ▾","Разрезы ▾"] },
    { label: "Коридоры", items: ["Объёмы ▾","Ведомость ▾"] },
    { label: "Сети", items: ["Гидравлика ▾","Инспекция ▾"] },
    { label: "Отчёты", items: ["Генерировать отчёт ▾"] },
  ],
  "Вид": [
    { label: "Вид", items: ["Вид сверху","Изометрия","Пользовательский ▾"] },
    { label: "Визуальный стиль", items: ["Каркас","Закрашенный","Реалистичный"] },
    { label: "Окна", items: ["1 окно","2 окна ▾","4 окна"] },
    { label: "Навигация", items: ["Орбита ▾","Панорама","Зум ▾"] },
  ],
  "Управление": [
    { label: "Параметры", items: ["Настройки чертежа","Единицы","Пространство модели"] },
    { label: "Стили", items: ["Диспетчер стилей ▾","Импорт стилей"] },
    { label: "Макросы", items: ["Запись","Воспроизведение","Редактировать"] },
  ],
  "Вывод": [
    { label: "Печать", items: ["Печать ▾","Пакетная печать","Просмотр"] },
    { label: "Экспорт", items: ["PDF ▾","DWF","LandXML","IFC"] },
    { label: "Публикация", items: ["Autodesk Docs","Sheets ▾"] },
  ],
  "Геодезия": [
    { label: "Точки", items: ["Создать точки ▾","Группы точек","Импорт точек"] },
    { label: "Съёмка", items: ["База данных ▾","Фигуры","Построение"] },
    { label: "Рельеф", items: ["TIN-поверхность ▾","Grid-поверхность ▾"] },
  ],
}

const TOOLBAR_GROUPS = TOOLBAR_BY_MENU["Главная"]

const DROPDOWN_ITEMS: Record<string, string[]> = {
  "Участок ▾": ["Создать участок из объектов","По линиям и кривым","Редактировать геометрию"],
  "Точки ▾": ["Создать точки вручную","Импорт из CSV","По трассе","По поверхности"],
  "Поверхности ▾": ["Создать TIN","Создать Grid","Из точек","Из контуров","Редактировать"],
  "Трасса ▾": ["Создать трассу","По существующей геометрии","Редактировать геометрию трассы"],
  "Хар. линия ▾": ["Создать хар. линию","По 3D-полилинии","Редактировать"],
  "Профиль ▾": ["Существующий рельеф","Профиль разработки","Редактировать профиль"],
  "Сечение ▾": ["Создать типовое сечение","Редактировать","Группа типовых сечений"],
  "Вид профиля ▾": ["Создать вид профиля","Группа видов профиля","Редактировать стиль"],
  "Планировка ▾": ["Планировочная отметка","По поверхности","Редактировать"],
  "Коридор ▾": ["Создать коридор","Редактировать коридор","Параметры коридора"],
  "Труб. сеть ▾": ["Создать трубопроводную сеть","По объектам","Редактировать детали"],
  "Виды сечений ▾": ["Создать виды сечений","Группа видов","Параметры листа"],
  "Черчение ▾": ["Полилиния","Прямая","Дуга","Прямоугольник","Сплайн"],
  "Копировать ▾": ["Копировать","Копировать с базовой точкой","Буфер обмена"],
  "Массив ▾": ["Прямоугольный массив","Круговой массив","По траектории"],
  "Слои ▾": ["Диспетчер слоёв","Создать слой","Заморозить","Изолировать слой"],
  "Внешняя ссылка ▾": ["Вставить","Отделить","Перезагрузить","Управление"],
  "Подложка ▾": ["DWF-подложка","PDF-подложка","Изображение","Карта"],
  "Импорт ▾": ["LandXML","IFC","Shapefile","DEM","Облако точек"],
  "Многострочный ▾": ["Создать мтекст","Редактировать стиль","Поле"],
  "Линейный ▾": ["Линейный","Параллельный","Базовый","Непрерывный"],
  "Выноска ▾": ["Выноска","Аннотационная выноска","Допуск"],
  "Стили текста ▾": ["Новый стиль","Редактировать","Импорт из чертежа"],
  "Стили размеров ▾": ["Новый стиль","Редактировать","Сопоставить"],
  "Таблица ▾": ["Вставить таблицу","Из данных связи","Экспорт в CSV"],
  "Уклоны ▾": ["Анализ уклонов","Анализ высот","Стрелки уклонов"],
  "Водосборы ▾": ["Создать водосборный бассейн","Анализ стока","Объём стока"],
  "Разрезы ▾": ["Создать линию разреза","Типовые разрезы","Экспорт"],
  "Объёмы ▾": ["Объёмы по коридору","Между поверхностями","Отчёт"],
  "Ведомость ▾": ["Ведомость поперечников","Координаты разбивки","Экспорт"],
  "Гидравлика ▾": ["Анализ сети","Расчёт потерь","Отчёт"],
  "Инспекция ▾": ["Проверить сеть","Найти нарушения","Отчёт"],
  "Генерировать отчёт ▾": ["Сводный отчёт","По поверхности","По коридору","По сетям"],
  "Пользовательский ▾": ["Сохранить вид","Восстановить вид","Управление видами"],
  "Орбита ▾": ["Орбита","Свободная орбита","Непрерывная орбита"],
  "Зум ▾": ["Вписать","Окном","Масштаб","Центр"],
  "1 окно": ["1 окно"], "2 окна ▾": ["Горизонтально","Вертикально"], "4 окна": ["4 равных окна"],
  "Диспетчер стилей ▾": ["Трассы","Профили","Коридоры","Поверхности","Сети"],
  "PDF ▾": ["Текущий лист","Все листы","Выбранные листы"],
  "Создать точки ▾": ["Вручную","По координатам","Из файла CSV","По трассе","По поверхности"],
  "База данных ▾": ["Открыть БД","Импорт","Экспорт","Настройки"],
  "TIN-поверхность ▾": ["Из точек","Из контуров","Из файла DEM","Редактировать"],
  "Grid-поверхность ▾": ["Из файла","Из TIN","Настройки сетки"],
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

  // viewport label
  ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(4,2,240,18)
  ctx.fillStyle="#60a5fa"; ctx.font="bold 11px monospace"
  ctx.fillText(`[+][Пользовательский вид][${viewMode==="wireframe"?"2D Каркас":"2D Закраска"}]`, 8, 15)

  // status bar
  ctx.fillStyle="rgba(30,30,30,0.85)"; ctx.fillRect(0,H-18,W,18)
  ctx.fillStyle="#9ca3af"; ctx.font="10px monospace"
  ctx.fillText("Выберите трассу: <Отмена>*", 8, H-5)
  ctx.fillText("1510603.43, 550465.55, 0.00  МОДЕЛЬ", W/2-60, H-5)
}

// ─── Tree node component ─────────────────────────────────────────────────────

function TreeItem({ node, depth, selected, onSelect, onToggle }: {
  node: TreeNode; depth: number; selected: string | null
  onSelect: (id: string) => void; onToggle: (id: string) => void
}) {
  return (
    <>
      <div
        className={`flex items-center gap-1 px-1 py-0.5 cursor-pointer text-xs select-none hover:bg-blue-900/40 transition-colors ${selected === node.id ? "bg-blue-800/60" : ""}`}
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
        onClick={() => onSelect(node.id)}
        onDoubleClick={() => node.children && onToggle(node.id)}
      >
        {node.children ? (
          <Icon name={node.expanded ? "ChevronDown" : "ChevronRight"} size={10} className="text-gray-400 flex-shrink-0"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); onToggle(node.id) }} />
        ) : <span className="w-2.5" />}
        <Icon name={node.icon} size={12} className="flex-shrink-0" style={{ color: node.color || "#94a3b8" }} fallback="File" />
        <span className="text-gray-200 truncate">{node.label}</span>
      </div>
      {node.expanded && node.children?.map(child => (
        <TreeItem key={child.id} node={child} depth={depth + 1} selected={selected} onSelect={onSelect} onToggle={onToggle} />
      ))}
    </>
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

// ─── Main CivilCAD Module ────────────────────────────────────────────────────

export default function CivilCADModule() {
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
  const [showRightPanel, setShowRightPanel] = useState(true)
  const [statusMsg, setStatusMsg] = useState("Выберите трассу: <Отмена>*")
  const [commandLine, setCommandLine] = useState("")
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpenDropdown(null)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

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
    if (c === "CREATECORRIDOR" || c === "CORRIDOR" || c === "СОЗДАТКОРИДОР") setShowCorridor(true)
    else if (c === "ZOOM E" || c === "ВПИСАТЬ") { setZoom(1.1); setPan({ x: 30, y: 20 }) }
    else if (c === "REGEN" || c === "РЕГЕН") draw()
    setStatusMsg(`Команда: ${cmd}`)
    setCommandLine("")
  }

  const toggleLayer = (key: keyof typeof visLayers) => setVisLayers(v => ({ ...v, [key]: !v[key] }))

  const handleToolbarItem = (item: string) => {
    setOpenDropdown(null)
    if (item.includes("Коридор")) { setShowCorridor(true); return }
    setStatusMsg(`Активировано: ${item.replace(" ▾","")}`)
  }

  const handleDropdownItem = (parent: string, sub: string) => {
    setOpenDropdown(null)
    if (parent.includes("Коридор") || sub.includes("коридор")) { setShowCorridor(true); return }
    setStatusMsg(`${parent.replace(" ▾","")}: ${sub}`)
  }

  const currentToolbar = TOOLBAR_BY_MENU[activeMenuTab] || TOOLBAR_BY_MENU["Главная"]

  return (
    <div className="flex flex-col bg-[#1e1e2e] text-gray-200 rounded-xl overflow-hidden border border-gray-700" style={{ height: "calc(100vh - 160px)", minHeight: 620, fontFamily: "Arial, sans-serif", fontSize: 12 }}>

      {/* ── Menu bar ── */}
      <div className="bg-[#2d2d3d] border-b border-gray-700 flex items-center gap-0 flex-wrap">
        <div className="flex items-center gap-1 px-2 py-1 border-r border-gray-700">
          <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">C</div>
          <span className="text-xs text-gray-300 font-mono ml-1">Civil 3D</span>
        </div>
        {MENU_ITEMS.map(m => (
          <button key={m} onClick={() => { setActiveMenuTab(m); setStatusMsg(`Вкладка: ${m}`) }}
            className={`px-3 py-1.5 text-xs transition-colors ${activeMenuTab === m ? "bg-[#0078d4] text-white" : "text-gray-300 hover:bg-gray-700"}`}>
            {m}
          </button>
        ))}
      </div>

      {/* ── Ribbon toolbar ── */}
      <div ref={dropdownRef} className="bg-[#252535] border-b border-gray-700 flex items-end gap-0 overflow-x-auto flex-shrink-0 relative">
        {currentToolbar.map(group => (
          <div key={group.label} className="flex flex-col items-start border-r border-gray-700 px-2 py-1">
            <div className="flex gap-1 flex-wrap">
              {group.items.map(item => {
                const hasDropdown = item.endsWith("▾") && DROPDOWN_ITEMS[item]
                return (
                  <div key={item} className="relative">
                    <button
                      onClick={() => {
                        if (hasDropdown) {
                          setOpenDropdown(openDropdown === item ? null : item)
                        } else {
                          handleToolbarItem(item)
                        }
                      }}
                      className={`px-2 py-0.5 text-xs rounded transition-colors whitespace-nowrap ${openDropdown === item ? "bg-[#0078d4] text-white" : "text-gray-300 hover:bg-gray-600 hover:text-white"}`}>
                      {item}
                    </button>
                    {hasDropdown && openDropdown === item && (
                      <div className="absolute top-full left-0 z-50 bg-[#2d2d3d] border border-gray-600 shadow-xl min-w-[180px] py-1 rounded">
                        {DROPDOWN_ITEMS[item].map(sub => (
                          <button key={sub} onClick={() => handleDropdownItem(item, sub)}
                            className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-[#0078d4] hover:text-white transition-colors whitespace-nowrap">
                            {sub}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <span className="text-[9px] text-gray-500 mt-0.5">{group.label}</span>
          </div>
        ))}
      </div>

      {/* ── Tab bar ── */}
      <div className="bg-[#1e1e2e] border-b border-gray-700 flex items-center gap-1 px-2 py-0.5">
        <Icon name="AlignLeft" size={12} className="text-gray-400" />
        <span className="text-xs text-gray-400 mr-2">ПРОСТРАНСТВО ИНСТРУМЕНТОВ</span>
        <div className="flex items-center gap-1">
          <button className="bg-[#2d2d4e] border border-gray-600 px-3 py-0.5 text-xs text-blue-300 flex items-center gap-1">
            <Icon name="FileText" size={10} /> Главная парковка_Финал*
            <span className="ml-1 text-gray-500 hover:text-white">✕</span>
          </button>
          <button className="text-gray-500 hover:text-white px-2 py-0.5" onClick={() => setStatusMsg("Новая вкладка создана")}>+</button>
        </div>
        <div className="ml-auto flex gap-1">
          {["Модель","Лист 1","Лист 2"].map(t => (
            <button key={t} onClick={() => setStatusMsg(`Переключено на: ${t}`)}
              className="text-xs text-gray-400 hover:text-white hover:bg-[#2d2d4e] px-2 py-0.5 rounded transition-colors">{t}</button>
          ))}
        </div>
      </div>

      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: Toolbox strip ── */}
        <div className="bg-[#252535] border-r border-gray-700 w-6 flex flex-col items-center py-1 gap-1">
          {["MousePointer2","Move","ZoomIn","RotateCcw","Layers","Settings"].map(ic => (
            <button key={ic} className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-600 rounded">
              <Icon name={ic} size={12} fallback="Square" />
            </button>
          ))}
        </div>

        {/* ── Left: Toolspace / Tree ── */}
        <div className="bg-[#1a1a2e] border-r border-gray-700 w-52 flex flex-col overflow-hidden flex-shrink-0">
          <div className="bg-[#252540] px-2 py-1 flex items-center justify-between border-b border-gray-700">
            <span className="text-xs text-gray-300 font-semibold">Активный чертёж</span>
            <Icon name="ChevronDown" size={12} className="text-gray-400" />
          </div>
          {/* Layer toggles */}
          <div className="flex gap-1 px-2 py-1 border-b border-gray-700 flex-wrap">
            {(Object.keys(visLayers) as (keyof typeof visLayers)[]).map(k => (
              <button key={k} onClick={() => toggleLayer(k)}
                className={`text-[9px] px-1 py-0.5 rounded transition-colors ${visLayers[k] ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-400"}`}>
                {k}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {treeData.map(node => (
              <TreeItem key={node.id} node={node} depth={0} selected={selectedNode}
                onSelect={setSelectedNode} onToggle={toggleNode} />
            ))}
          </div>
        </div>

        {/* ── Side tabs ── */}
        <div className="bg-[#1e1e2e] border-r border-gray-700 w-5 flex flex-col items-center py-4 gap-4">
          {["Инструменты","Настройки","Геодезия"].map(t => (
            <div key={t} onClick={() => setStatusMsg(`Панель: ${t}`)}
              className="text-[9px] text-gray-500 hover:text-gray-300 cursor-pointer active:text-blue-400 transition-colors"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>{t}</div>
          ))}
        </div>

        {/* ── Centre: Viewport ── */}
        <div className="flex-1 relative overflow-hidden bg-[#1a1a2e]">
          {/* viewport toolbar */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-1 bg-[#00000060] px-2 py-0.5">
            <button onClick={() => setViewMode(m => m === "wireframe" ? "shaded" : "wireframe")}
              className="text-[10px] text-blue-300 hover:text-white px-2 py-0.5 bg-black/30 rounded">
              [+][Польз. вид][{viewMode === "wireframe" ? "2D Каркас" : "2D Закраска"}]
            </button>
            <div className="ml-auto flex gap-1">
              <button onClick={() => { setZoom(1.1); setPan({ x: 30, y: 20 }) }} className="text-[10px] text-gray-400 hover:text-white px-1">Вписать</button>
              <button onClick={() => setZoom(z => z * 1.2)} className="text-[10px] text-gray-400 hover:text-white px-1">+</button>
              <button onClick={() => setZoom(z => z * 0.8)} className="text-[10px] text-gray-400 hover:text-white px-1">−</button>
              <button onClick={() => setShowRightPanel(s => !s)} className="text-[10px] text-gray-400 hover:text-white px-1">
                <Icon name={showRightPanel ? "PanelRightClose" : "PanelRightOpen"} size={12} />
              </button>
            </div>
          </div>

          <canvas ref={canvasRef} className="w-full h-full block"
            style={{ cursor: drag.current ? "grabbing" : "crosshair" }}
            onWheel={onWheel} onMouseDown={onMouseDown} onMouseMove={onMouseMove}
            onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
            onContextMenu={e => e.preventDefault()}
            onDoubleClick={() => setShowCorridor(true)} />

          {/* Corridor dialog */}
          <AnimatePresence>
            {showCorridor && (
              <CorridorDialog
                onClose={() => setShowCorridor(false)}
                onOK={def => {
                  setCorridors(prev => prev.includes(def.name) ? prev : [...prev, def.name])
                  setShowCorridor(false)
                  setStatusMsg(`Коридор «${def.name}» успешно создан`)
                }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* ── Right: Section views ── */}
        {showRightPanel && <CrossSectionPanel alignments={corridors} onClose={() => setShowRightPanel(false)} />}
      </div>

      {/* ── Command line ── */}
      <div className="bg-[#0f0f1e] border-t border-gray-700 flex flex-col">
        <div className="px-3 py-0.5 text-[10px] text-gray-400 font-mono">{statusMsg}</div>
        <div className="flex items-center gap-1 px-2 py-0.5 border-t border-gray-800">
          <span className="text-[10px] text-gray-500 font-mono"># СОЗДАТКОРИДОР</span>
          <input
            value={commandLine}
            onChange={e => setCommandLine(e.target.value)}
            onKeyDown={e => e.key === "Enter" && runCommand(commandLine)}
            placeholder="Команда… (CREATECORRIDOR, ZOOM E, REGEN)"
            className="flex-1 bg-transparent text-[11px] text-green-300 font-mono outline-none placeholder-gray-700 px-2"
          />
          <button onClick={() => runCommand(commandLine)} className="text-[10px] text-gray-500 hover:text-white px-2">↵</button>
        </div>
      </div>
    </div>
  )
}