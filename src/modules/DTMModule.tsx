import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CategoryFeaturesGrid } from "@/modules/VersionFeaturesPanel"
import { экспортCSV, экспортLandXML, экспортТекст } from "@/utils/exportImport"

// ─── Типы ────────────────────────────────────────────────────────────────────

interface ОблакоТочка { x: number; y: number; z: number; i: number; cls: number }
interface ЦМРПараметры {
  метод: string; шаг: number; сглаживание: number; фильтрация: boolean
  удалениеВегет: boolean; удалениеЗданий: boolean
}

// ─── Источники данных ────────────────────────────────────────────────────────

const ИСТОЧНИКИ = [
  { id: "tacheo", icon: "Crosshair", label: "Тахеометр", desc: "Электронный тахеометр (*.raw, *.gsi, *.job)", color: "#4ade80" },
  { id: "gnss", icon: "Satellite", label: "GNSS / RTK", desc: "Спутниковые системы GNSS (*.csv, *.pos)", color: "#60a5fa" },
  { id: "lidar_ground", icon: "ScanLine", label: "Наземный LiDAR", desc: "Наземное лазерное сканирование (*.las, *.laz)", color: "#f97316" },
  { id: "lidar_air", icon: "Plane", label: "Воздушный LiDAR", desc: "Аэролазерное сканирование (*.las, *.laz)", color: "#a855f7" },
  { id: "lidar_kin", icon: "Car", label: "Кинематическое", desc: "Мобильное лазерное сканирование (*.las)", color: "#f59e0b" },
  { id: "lidar_bat", icon: "Waves", label: "Батиметрическое", desc: "Гидрографическое сканирование (*.xyz)", color: "#22d3ee" },
  { id: "drone", icon: "Zap", label: "БПЛА / Фотограмметрия", desc: "Аэрофотосъёмка, облако точек SfM (*.las)", color: "#ec4899" },
  { id: "gis", icon: "Map", label: "ГИС-данные", desc: "Открытые данные SRTM, OpenTopography", color: "#84cc16" },
]

const МЕТОДЫ_ЦМР = ["TIN (триангуляция Делоне)", "IDW (обратные расстояния)", "Крайгинг", "Сплайны", "Natural Neighbor", "Регулярная сетка Grid"]
const РЕЖИМЫ_ВИЗ = ["Высоты", "Интенсивность", "Классификация", "Уклоны", "Экспозиция", "Горизонтали", "TIN-сетка"]
const КЛАССЫ_ТОЧЕК = ["Земля", "Низкая растительность", "Средняя раст.", "Высокая раст.", "Здание", "Шум", "Вода", "Дорога", "Мост"]
const ЦВЕТ_КЛАСС: Record<number, string> = { 0: "#60a5fa", 1: "#4ade80", 2: "#86efac", 3: "#22c55e", 4: "#f97316", 5: "#ef4444", 6: "#0ea5e9", 7: "#a3a3a3", 8: "#d97706" }

// ─── Генерация облака точек ───────────────────────────────────────────────────

function генерироватьОблако(n: number, тип: string): ОблакоТочка[] {
  const pts: ОблакоТочка[] = []
  for (let i = 0; i < n; i++) {
    const x = (Math.random() - 0.5) * 100
    const y = (Math.random() - 0.5) * 100
    const baseZ = Math.sin(x * 0.08) * 8 + Math.cos(y * 0.06) * 6 + Math.sin(x * 0.2 + y * 0.15) * 3
    let z = baseZ, cls = 0, intensity = Math.floor(Math.random() * 255)
    // Классификация
    const r = Math.random()
    if (тип === "lidar_air" || тип === "drone") {
      if (r < 0.35) { z = baseZ; cls = 0 } // земля
      else if (r < 0.55) { z = baseZ + Math.random() * 5 + 1; cls = 1 } // низкая раст
      else if (r < 0.72) { z = baseZ + Math.random() * 10 + 3; cls = 3 } // высокая раст
      else if (r < 0.82) { z = baseZ + Math.random() * 12 + 4; cls = 4; intensity = 180 + Math.floor(Math.random() * 75) } // здание
      else if (r < 0.88) { z = baseZ - 0.2; cls = 7 } // дорога
      else { z = baseZ; cls = 0 }
    } else {
      cls = r < 0.8 ? 0 : r < 0.9 ? 7 : 4
    }
    pts.push({ x, y, z, i: intensity, cls })
  }
  return pts
}

// ─── Canvas: облако точек ──────────────────────────────────────────────────

function рисоватьОблако(
  ctx: CanvasRenderingContext2D, pts: ОблакоТочка[],
  W: number, H: number, режим: string,
  yaw: number, pitch: number, zoom: number, panX: number, panY: number
) {
  ctx.clearRect(0, 0, W, H)

  // Фон
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, "#020917"); bg.addColorStop(1, "#060d1f")
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

  if (pts.length === 0) {
    ctx.fillStyle = "rgba(100,130,200,0.4)"; ctx.font = "16px Arial"; ctx.textAlign = "center"
    ctx.fillText("Загрузите данные для отображения", W / 2, H / 2); ctx.textAlign = "left"
    return
  }

  // Найти диапазоны
  const zs = pts.map(p => p.z), xs = pts.map(p => p.x), ys = pts.map(p => p.y)
  const minZ = Math.min(...zs), maxZ = Math.max(...zs)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const rangeZ = maxZ - minZ + 0.01

  // Проекция
  const cosY = Math.cos(yaw), sinY = Math.sin(yaw)
  const cosP = Math.cos(pitch), sinP = Math.sin(pitch)

  type Спроецированная = { sx: number; sy: number; z: number; pt: ОблакоТочка }
  const projected: Спроецированная[] = []

  pts.forEach(pt => {
    const nx = (pt.x - (minX + maxX) / 2) / (maxX - minX + 0.01) * 80 * zoom
    const ny = (pt.y - (minY + maxY) / 2) / (maxY - minY + 0.01) * 80 * zoom
    const nz = (pt.z - (minZ + maxZ) / 2) / rangeZ * 30 * zoom
    // Поворот по Y
    const rx = nx * cosY - ny * sinY
    const ry2 = nx * sinY + ny * cosY
    // Поворот по X (pitch)
    const rz = nz * cosP - ry2 * sinP
    const ry3 = nz * sinP + ry2 * cosP
    const dist = ry3 + 120
    if (dist < 10) return
    const f = 180 / dist
    const sx = W / 2 + rx * f + panX
    const sy = H / 2 - rz * f + panY
    if (sx < -10 || sx > W + 10 || sy < -10 || sy > H + 10) return
    projected.push({ sx, sy, z: dist, pt })
  })

  // Сортировка по глубине
  projected.sort((a, b) => b.z - a.z)

  // Рисование
  projected.forEach(({ sx, sy, pt }) => {
    let color: string
    const t = (pt.z - minZ) / rangeZ

    if (режим === "Высоты") {
      // Радуга: синий→зелёный→жёлтый→красный
      const hue = (1 - t) * 240
      color = `hsl(${hue},90%,55%)`
    } else if (режим === "Интенсивность") {
      const v = Math.floor(pt.i * 0.8 + 40)
      color = `rgb(${v},${Math.floor(v * 0.9)},${Math.floor(v * 0.6)})`
    } else if (режим === "Классификация") {
      color = ЦВЕТ_КЛАСС[pt.cls] || "#94a3b8"
    } else if (режим === "Уклоны") {
      const s = Math.random() * 0.3 // упрощённо
      color = s < 0.05 ? "#4ade80" : s < 0.15 ? "#facc15" : s < 0.25 ? "#fb923c" : "#ef4444"
    } else if (режим === "Экспозиция") {
      const hue = ((pt.x + pt.y) * 3) % 360
      color = `hsl(${hue},70%,50%)`
    } else if (режим === "Горизонтали") {
      const level = Math.floor(pt.z * 2) / 2
      const isMain = Math.abs(level % 5) < 0.5
      color = isMain ? "#22d3ee" : "#1e4060"
    } else {
      // TIN-сетка
      color = `rgba(0,255,80,0.6)`
    }

    const size = режим === "TIN-сетка" ? 1 : 1.5
    ctx.fillStyle = color
    ctx.fillRect(sx - size / 2, sy - size / 2, size, size)
  })

  // TIN линии (для режима сетки)
  if (режим === "TIN-сетка") {
    ctx.strokeStyle = "rgba(0,255,80,0.25)"; ctx.lineWidth = 0.3
    // Упрощённая триангуляция — соединяем близкие точки
    const sample = projected.filter((_, i) => i % 4 === 0).slice(0, 300)
    sample.forEach((p, i) => {
      if (i > 0) {
        const prev = sample[i - 1]
        if (Math.abs(prev.sx - p.sx) < 30 && Math.abs(prev.sy - p.sy) < 30) {
          ctx.beginPath(); ctx.moveTo(prev.sx, prev.sy); ctx.lineTo(p.sx, p.sy); ctx.stroke()
        }
      }
    })
  }

  // Статистика в углу
  ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(8, H - 58, 220, 52)
  ctx.fillStyle = "#60a5fa"; ctx.font = "bold 10px monospace"
  ctx.fillText(`Точек: ${pts.length.toLocaleString("ru")}`, 14, H - 42)
  ctx.fillStyle = "#4ade80"; ctx.font = "10px monospace"
  ctx.fillText(`Z: ${minZ.toFixed(1)} — ${maxZ.toFixed(1)} м  ΔZ: ${rangeZ.toFixed(1)} м`, 14, H - 27)
  ctx.fillStyle = "#f97316"
  ctx.fillText(`Режим: ${режим}`, 14, H - 12)
}

// ─── Главный компонент ───────────────────────────────────────────────────────

export default function DTMModule() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drag = useRef<{ x: number; y: number } | null>(null)
  const camRef = useRef({ yaw: 0.5, pitch: 0.4, zoom: 1.2, panX: 0, panY: 0 })

  const [активнаяВкладка, setАктивнаяВкладка] = useState<"источники" | "облако" | "цмр" | "анализ" | "отчёт">("источники")
  const [загруженныеДанные, setЗагруженныеДанные] = useState<{ источник: string; точек: number; дата: string }[]>([])
  const [облако, setОблако] = useState<ОблакоТочка[]>([])
  const [загрузка, setЗагрузка] = useState(false)
  const [режимВиз, setРежимВиз] = useState("Высоты")
  const [цмрПостроена, setЦМРПостроена] = useState(false)
  const [строимЦМР, setСтроимЦМР] = useState(false)
  const [цмрПарамы, setЦМРПарамы] = useState<ЦМРПараметры>({
    метод: МЕТОДЫ_ЦМР[0], шаг: 1.0, сглаживание: 2,
    фильтрация: true, удалениеВегет: true, удалениеЗданий: false,
  })
  const [фильтрКласс, setФильтрКласс] = useState<number[]>([0, 7]) // только земля + дорога
  const [выбранныйИсточник, setВыбранныйИсточник] = useState<string | null>(null)
  const [showИмпорт, setShowИмпорт] = useState(false)
  const [статистика, setСтатистика] = useState<Record<string, number>>({})

  // ── Canvas рендер ──────────────────────────────────────────────────────────

  const рендер = useCallback(() => {
    const c = canvasRef.current; if (!c || c.width < 10) return
    const ctx = c.getContext("2d")!
    const { yaw, pitch, zoom, panX, panY } = camRef.current
    const показОблако = фильтрКласс.length > 0
      ? облако.filter(p => фильтрКласс.includes(p.cls))
      : облако
    рисоватьОблако(ctx, показОблако, c.width, c.height, режимВиз, yaw, pitch, zoom, panX, panY)
  }, [облако, режимВиз, фильтрКласс])

  useEffect(() => {
    const c = canvasRef.current; if (!c) return
    const ro = new ResizeObserver(() => { c.width = c.offsetWidth; c.height = c.offsetHeight; рендер() })
    ro.observe(c); c.width = c.offsetWidth; c.height = c.offsetHeight; рендер()
    return () => ro.disconnect()
  }, [рендер])

  useEffect(() => { рендер() }, [рендер])

  // ── Управление мышью ──────────────────────────────────────────────────────

  const onMouseDown = (e: React.MouseEvent) => { drag.current = { x: e.clientX, y: e.clientY } }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y
    drag.current = { x: e.clientX, y: e.clientY }
    if (e.buttons === 2) {
      camRef.current.panX += dx; camRef.current.panY += dy
    } else {
      camRef.current.yaw += dx * 0.01
      camRef.current.pitch = Math.max(-0.5, Math.min(1.2, camRef.current.pitch + dy * 0.008))
    }
    рендер()
  }
  const onMouseUp = () => { drag.current = null }
  const onWheel = (e: React.WheelEvent) => {
    camRef.current.zoom = Math.max(0.3, Math.min(5, camRef.current.zoom * (e.deltaY < 0 ? 1.12 : 0.9)))
    рендер()
  }

  // ── Загрузка данных ────────────────────────────────────────────────────────

  const загрузитьДанные = (источникId: string) => {
    const ист = ИСТОЧНИКИ.find(i => i.id === источникId)
    if (!ист) return
    setЗагрузка(true)
    setShowИмпорт(false)
    setTimeout(() => {
      const n = источникId.includes("lidar") || источникId === "drone" ? 15000 : 2000
      const новоеОблако = генерироватьОблако(n, источникId)
      setОблако(prev => [...prev, ...новоеОблако])
      setЗагруженныеДанные(prev => [...prev, {
        источник: ист.label,
        точек: n,
        дата: new Date().toLocaleDateString("ru"),
      }])
      // Статистика классов
      const ст: Record<string, number> = {}
      новоеОблако.forEach(p => {
        const кл = КЛАССЫ_ТОЧЕК[p.cls] || "Неизвестно"
        ст[кл] = (ст[кл] || 0) + 1
      })
      setСтатистика(prev => {
        const merged = { ...prev }
        Object.entries(ст).forEach(([k, v]) => { merged[k] = (merged[k] || 0) + v })
        return merged
      })
      setЗагрузка(false)
      setАктивнаяВкладка("облако")
    }, 1800)
  }

  const построитьЦМР = () => {
    setСтроимЦМР(true)
    setTimeout(() => { setЦМРПостроена(true); setСтроимЦМР(false); setАктивнаяВкладка("анализ") }, 2500)
  }

  const очиститьДанные = () => {
    setОблако([]); setЗагруженныеДанные([]); setЦМРПостроена(false); setСтатистика({})
  }

  const экспорт = (формат: string) => {
    if (формат === "CSV" || формат === "DEM") {
      экспортCSV(
        ["ID", "X", "Y", "Z", "Интенсивность", "Класс", "Код класса"],
        облако.slice(0, 10000).map((p, i) => [
          i + 1, p.x.toFixed(3), p.y.toFixed(3), p.z.toFixed(3), p.i, p.cls, КЛАССЫ_ТОЧЕК[p.cls] || "—",
        ]),
        `dtm_${формат.toLowerCase()}.csv`
      )
    } else if (формат === "XML") {
      экспортLandXML({
        имя: "ЦМР ЛАПА 3D",
        точки: облако.slice(0, 5000).map((p, i) => ({ name: `ТЧК-${i + 1}`, x: p.x, y: p.y, z: p.z })),
      }, "dtm.xml")
    } else if (формат === "PDF") {
      экспортТекст([
        "ТЕХНИЧЕСКИЙ ОТЧЁТ ЦМР",
        "=".repeat(40),
        `Дата: ${new Date().toLocaleDateString("ru")}`,
        `Метод: ${цмрПарамы.метод}`,
        `Шаг сетки: ${цмрПарамы.шаг} м`,
        `Точек: ${итогоТочек.toLocaleString("ru")}`,
        `Источники: ${загруженныеДанные.map(д => д.источник).join(", ") || "—"}`,
        `Фильтрация шума: ${цмрПарамы.фильтрация ? "Да" : "Нет"}`,
        `Нормализация: ${цмрПарамы.удалениеВегет ? "Да" : "Нет"}`,
        "",
        "КЛАССИФИКАЦИЯ ТОЧЕК:",
        ...Object.entries(статистика).map(([кл, n]) => `  ${кл}: ${n.toLocaleString("ru")} (${((n / итогоТочек) * 100).toFixed(1)}%)`),
      ], "dtm_report.txt")
    } else if (формат === "SHP" || формат === "LAS") {
      экспортCSV(
        ["X", "Y", "Z", "Класс"],
        облако.slice(0, 10000).map(p => [p.x.toFixed(3), p.y.toFixed(3), p.z.toFixed(3), p.cls]),
        `dtm.${формат.toLowerCase() === "las" ? "csv" : "csv"}`
      )
    } else {
      экспортCSV(
        ["X", "Y", "Z", "I", "Класс"],
        облако.slice(0, 5000).map(p => [p.x.toFixed(3), p.y.toFixed(3), p.z.toFixed(3), p.i, p.cls]),
        `dtm_${формат}.csv`
      )
    }
  }

  const итогоТочек = облако.length

  // ── Вкладки ───────────────────────────────────────────────────────────────

  const ВКЛАДКИ = [
    { id: "источники", label: "Источники данных", icon: "Database" },
    { id: "облако", label: "Облако точек", icon: "ScanLine" },
    { id: "цмр", label: "Построение ЦМР", icon: "Mountain" },
    { id: "анализ", label: "Анализ рельефа", icon: "BarChart3" },
    { id: "отчёт", label: "Отчёт и экспорт", icon: "FileText" },
  ] as const

  return (
    <motion.div className="flex flex-col h-full space-y-0 overflow-hidden"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>

      {/* Заголовок */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 flex-shrink-0">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <Icon name="ScanLine" size={22} className="text-indigo-600" />
            Цифровая модель местности (ЦМР)
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Обработка данных лазерного сканирования, GNSS, тахеометрии. Построение ЦМР и ЦМЗ.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {итогоТочек > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-sm">
              <Icon name="Database" size={14} className="text-indigo-600" />
              <span className="font-bold text-indigo-700">{итогоТочек.toLocaleString("ru")}</span>
              <span className="text-indigo-500">точек</span>
            </div>
          )}
          {итогоТочек > 0 && (
            <Button variant="outline" onClick={очиститьДанные} className="gap-2 text-red-600 border-red-200 hover:bg-red-50">
              <Icon name="Trash2" size={14} />Очистить
            </Button>
          )}
          <Button onClick={() => setShowИмпорт(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            <Icon name="Upload" size={16} />Загрузить данные
          </Button>
        </div>
      </div>

      {/* Вкладки */}
      <div className="flex items-center gap-0 bg-white rounded-xl border border-gray-200 p-1 mb-4 overflow-x-auto flex-shrink-0">
        {ВКЛАДКИ.map(t => (
          <button key={t.id} onClick={() => setАктивнаяВкладка(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex-shrink-0 ${активнаяВкладка === t.id ? "bg-indigo-600 text-white shadow" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}>
            <Icon name={t.icon} size={14} fallback="Circle" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Контент вкладок */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">

        {/* ── ИСТОЧНИКИ ДАННЫХ ── */}
        {активнаяВкладка === "источники" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ИСТОЧНИКИ.map(ист => (
                <motion.button key={ист.id}
                  onClick={() => { setВыбранныйИсточник(ист.id); setShowИмпорт(true) }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="text-left p-4 rounded-xl border border-gray-200 bg-white hover:border-indigo-400 hover:shadow-md transition-all space-y-2 group">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: ист.color + "20" }}>
                    <Icon name={ист.icon} size={20} style={{ color: ист.color }} fallback="Database" />
                  </div>
                  <div className="font-bold text-gray-900 text-sm">{ист.label}</div>
                  <div className="text-xs text-gray-400 leading-relaxed">{ист.desc}</div>
                </motion.button>
              ))}
            </div>

            {загруженныеДанные.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Icon name="CheckCircle" size={16} className="text-green-600" />
                  Загруженные наборы данных
                </h3>
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs font-semibold text-gray-500">
                      <tr>
                        <th className="px-3 py-2 text-left">Источник</th>
                        <th className="px-3 py-2 text-right">Точек</th>
                        <th className="px-3 py-2 text-center">Дата</th>
                        <th className="px-3 py-2 text-center">Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {загруженныеДанные.map((д, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-3 py-2 font-medium text-gray-800 flex items-center gap-2">
                            <Icon name="FileText" size={13} className="text-indigo-500" />
                            {д.источник}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-sm">{д.точек.toLocaleString("ru")}</td>
                          <td className="px-3 py-2 text-center text-gray-400 text-xs">{д.дата}</td>
                          <td className="px-3 py-2 text-center">
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold">Загружено</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                  <span className="text-sm font-semibold text-indigo-800">Итого точек в проекте:</span>
                  <span className="text-xl font-extrabold text-indigo-700">{итогоТочек.toLocaleString("ru")}</span>
                </div>
              </div>
            )}

            {/* Информационный блок */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Icon name="Info" size={16} className="text-blue-600" />
                  О цифровой модели местности
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  ЦМР (Цифровая Модель Рельефа) — математическое представление земной поверхности, 
                  построенное на основе данных полевых измерений. ЛАПА 3D поддерживает все современные 
                  методы получения геопространственных данных.
                </p>
                <div className="space-y-2">
                  {[
                    { icon: "Crosshair", text: "Тахеометры и GNSS — геодезические измерения" },
                    { icon: "ScanLine", text: "Лазерное сканирование — облака точек LAS/LAZ" },
                    { icon: "Zap", text: "БПЛА/фотограмметрия — SfM-облака точек" },
                    { icon: "Map", text: "ГИС-данные — SRTM, OpenTopography, DEM" },
                  ].map(r => (
                    <div key={r.text} className="flex items-start gap-2 text-sm text-gray-600">
                      <Icon name={r.icon} size={14} className="text-indigo-500 mt-0.5 flex-shrink-0" fallback="Check" />
                      {r.text}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl overflow-hidden border border-gray-200" style={{ minHeight: 200 }}>
                <img
                  src="https://cdn.poehali.dev/projects/1be7b031-c724-4235-9d1d-e20b0b34064c/bucket/794ca42b-66ba-44af-8949-74891660d12c.png"
                  alt="Облако точек LiDAR"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── ОБЛАКО ТОЧЕК ── */}
        {активнаяВкладка === "облако" && (
          <div className="space-y-4">
            {/* Тулбар вьюера */}
            <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap">Режим:</Label>
                <Select value={режимВиз} onValueChange={setРежимВиз}>
                  <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{РЕЖИМЫ_ВИЗ.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1">
                <Label className="text-xs mr-1">Классы:</Label>
                {КЛАССЫ_ТОЧЕК.slice(0, 6).map((кл, i) => (
                  <button key={кл} onClick={() => setФильтрКласс(prev =>
                    prev.includes(i) ? prev.filter(c => c !== i) : [...prev, i]
                  )}
                    className={`text-xs px-2 py-0.5 rounded-full border transition-all ${фильтрКласс.includes(i) ? "text-white border-transparent" : "bg-white text-gray-500 border-gray-200"}`}
                    style={фильтрКласс.includes(i) ? { background: ЦВЕТ_КЛАСС[i] } : {}}>
                    {кл}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button onClick={() => { camRef.current = { yaw: 0.5, pitch: 0.4, zoom: 1.2, panX: 0, panY: 0 }; рендер() }}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-100 transition-colors">
                  <Icon name="Maximize2" size={12} />Сброс
                </button>
              </div>
            </div>

            {/* Canvas вьюер */}
            <div className="rounded-xl border border-gray-800 overflow-hidden bg-[#020917]" style={{ height: 460 }}>
              {загрузка ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
                  <div className="text-indigo-300 font-medium">Обработка данных лазерного сканирования…</div>
                  <div className="text-gray-500 text-sm">Классификация точек, фильтрация шума</div>
                </div>
              ) : (
                <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing"
                  onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
                  onWheel={onWheel} onContextMenu={e => e.preventDefault()} />
              )}
            </div>

            <div className="text-xs text-gray-400 text-center">
              ЛКМ — вращение · ПКМ — панорама · Колесо — масштаб
            </div>

            {/* Статистика классов */}
            {Object.keys(статистика).length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                  <Icon name="PieChart" size={14} className="text-indigo-600" />
                  Классификация точек
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(статистика).map(([кл, n]) => {
                    const idx = КЛАССЫ_ТОЧЕК.indexOf(кл)
                    const color = ЦВЕТ_КЛАСС[idx] || "#94a3b8"
                    const pct = ((n / итогоТочек) * 100).toFixed(1)
                    return (
                      <div key={кл} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-700 truncate">{кл}</div>
                          <div className="text-xs text-gray-400">{n.toLocaleString("ru")} ({pct}%)</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {облако.length === 0 && !загрузка && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                  <Icon name="ScanLine" size={40} className="text-indigo-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Нет данных</h3>
                <p className="text-gray-400 text-sm max-w-sm">Загрузите данные лазерного сканирования, GNSS или тахеометрии для отображения облака точек</p>
                <Button onClick={() => setАктивнаяВкладка("источники")} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                  <Icon name="Upload" size={16} />Загрузить данные
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── ПОСТРОЕНИЕ ЦМР ── */}
        {активнаяВкладка === "цмр" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Параметры */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Icon name="Settings" size={16} className="text-indigo-600" />
                  Параметры построения
                </h3>
                <div>
                  <Label>Метод интерполяции</Label>
                  <Select value={цмрПарамы.метод} onValueChange={v => setЦМРПарамы(p => ({ ...p, метод: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{МЕТОДЫ_ЦМР.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Шаг сетки (м)</Label>
                    <Input type="number" step="0.1" value={цмрПарамы.шаг}
                      onChange={e => setЦМРПарамы(p => ({ ...p, шаг: +e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label>Сглаживание</Label>
                    <Input type="number" min="0" max="10" value={цмрПарамы.сглаживание}
                      onChange={e => setЦМРПарамы(p => ({ ...p, сглаживание: +e.target.value }))} className="mt-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { key: "фильтрация", label: "Фильтрация шума и выбросов" },
                    { key: "удалениеВегет", label: "Удаление растительности (нормализация)" },
                    { key: "удалениеЗданий", label: "Удаление зданий и сооружений" },
                  ].map(opt => (
                    <label key={opt.key} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                      <input type="checkbox"
                        checked={цмрПарамы[opt.key as keyof ЦМРПараметры] as boolean}
                        onChange={e => setЦМРПарамы(p => ({ ...p, [opt.key]: e.target.checked }))}
                        className="w-4 h-4 accent-indigo-600 rounded" />
                      <span className="text-sm text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
                <Button onClick={построитьЦМР} disabled={строимЦМР || итогоТочек === 0}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                  {строимЦМР
                    ? <><Icon name="Loader" size={16} className="animate-spin" />Построение ЦМР…</>
                    : <><Icon name="Mountain" size={16} />Построить ЦМР</>}
                </Button>
                {итогоТочек === 0 && (
                  <p className="text-xs text-amber-600 text-center">Сначала загрузите данные на вкладке «Источники»</p>
                )}
              </div>

              {/* Описание методов */}
              <div className="space-y-3">
                <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
                  <h4 className="font-bold text-gray-900 text-sm">Описание метода</h4>
                  {цмрПарамы.метод === МЕТОДЫ_ЦМР[0] && (
                    <p className="text-sm text-gray-600">
                      <strong>TIN (Triangulated Irregular Network)</strong> — построение нерегулярной 
                      триангуляционной сети по алгоритму Делоне. Наиболее точный метод для данных 
                      произвольного расположения. Сохраняет все исходные точки без интерполяции.
                    </p>
                  )}
                  {цмрПарамы.метод === МЕТОДЫ_ЦМР[1] && (
                    <p className="text-sm text-gray-600">
                      <strong>IDW (Inverse Distance Weighting)</strong> — метод обратных расстояний. 
                      Быстрый детерминированный метод. Значение в расчётной точке вычисляется 
                      как взвешенное среднее ближайших измеренных точек.
                    </p>
                  )}
                  {цмрПарамы.метод === МЕТОДЫ_ЦМР[2] && (
                    <p className="text-sm text-gray-600">
                      <strong>Крайгинг</strong> — геостатистический метод оптимальной интерполяции. 
                      Учитывает пространственную автокорреляцию данных. Лучший результат при 
                      наличии вариограммы. Точнее IDW, но медленнее.
                    </p>
                  )}
                  {!МЕТОДЫ_ЦМР.slice(0, 3).includes(цмрПарамы.метод) && (
                    <p className="text-sm text-gray-600">
                      Выбранный метод обеспечивает точную интерполяцию данных рельефа с учётом 
                      пространственных закономерностей и минимизации ошибки.
                    </p>
                  )}
                </div>

                {цмрПостроена && (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-green-700 font-bold">
                      <Icon name="CheckCircle" size={16} />ЦМР успешно построена
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { l: "Метод", v: цмрПарамы.метод.split(" ")[0] },
                        { l: "Шаг сетки", v: `${цмрПарамы.шаг} м` },
                        { l: "Точек исходных", v: итогоТочек.toLocaleString("ru") },
                        { l: "Узлов сетки", v: Math.floor(итогоТочек * 0.15).toLocaleString("ru") },
                        { l: "Размер площади", v: "≈ 1.2 км²" },
                        { l: "Точность", v: "±0.05 м" },
                      ].map(r => (
                        <div key={r.l} className="flex justify-between p-1.5 bg-white rounded">
                          <span className="text-gray-500">{r.l}</span>
                          <span className="font-semibold text-gray-800">{r.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: 160 }}>
                  <img
                    src="https://cdn.poehali.dev/projects/1be7b031-c724-4235-9d1d-e20b0b34064c/bucket/b8f677de-f6d5-4abc-8b21-cc0cce808f4f.png"
                    alt="ЦМР рельеф"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── АНАЛИЗ РЕЛЬЕФА ── */}
        {активнаяВкладка === "анализ" && (
          <div className="space-y-4">
            {!цмрПостроена && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
                <Icon name="AlertTriangle" size={18} className="text-amber-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-amber-800">ЦМР не построена</div>
                  <div className="text-sm text-amber-600">Перейдите на вкладку «Построение ЦМР» и постройте модель рельефа</div>
                </div>
                <Button size="sm" onClick={() => setАктивнаяВкладка("цмр")} className="ml-auto bg-amber-600 hover:bg-amber-700 text-white">
                  Построить
                </Button>
              </div>
            )}

            {/* Статистика рельефа */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Мин. отметка", value: "115.34 м", sub: "низшая точка", color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Макс. отметка", value: "148.72 м", sub: "высшая точка", color: "text-red-600", bg: "bg-red-50" },
                { label: "Средняя отм.", value: "131.05 м", sub: "средний рельеф", color: "text-indigo-600", bg: "bg-indigo-50" },
                { label: "Перепад", value: "33.38 м", sub: "амплитуда", color: "text-orange-600", bg: "bg-orange-50" },
              ].map(c => (
                <div key={c.label} className={`rounded-xl border p-4 ${c.bg} border-gray-200`}>
                  <div className="text-xs text-gray-500 mb-1">{c.label}</div>
                  <div className={`text-xl font-extrabold ${c.color}`}>{c.value}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{c.sub}</div>
                </div>
              ))}
            </div>

            {/* Виды анализа */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: "Анализ уклонов", icon: "TrendingUp", color: "text-orange-600",
                  rows: [
                    { label: "0–3% (пологий)", value: "38.2%", color: "#4ade80" },
                    { label: "3–8% (умеренный)", value: "29.5%", color: "#facc15" },
                    { label: "8–15% (крутой)", value: "21.1%", color: "#fb923c" },
                    { label: ">15% (обрыв)", value: "11.2%", color: "#ef4444" },
                  ]
                },
                {
                  title: "Экспозиция склонов", icon: "Compass", color: "text-blue-600",
                  rows: [
                    { label: "Северная (С, СВ, СЗ)", value: "24.8%", color: "#60a5fa" },
                    { label: "Восточная (В, СВ, ЮВ)", value: "22.3%", color: "#34d399" },
                    { label: "Южная (Ю, ЮВ, ЮЗ)", value: "31.4%", color: "#fbbf24" },
                    { label: "Западная (З, СЗ, ЮЗ)", value: "21.5%", color: "#f97316" },
                  ]
                },
              ].map(блок => (
                <div key={блок.title} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                  <h4 className={`font-bold text-gray-900 text-sm flex items-center gap-2`}>
                    <Icon name={блок.icon} size={14} className={блок.color} fallback="BarChart" />
                    {блок.title}
                  </h4>
                  {блок.rows.map(r => (
                    <div key={r.label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">{r.label}</span>
                        <span className="font-bold text-gray-800">{r.value}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full">
                        <div className="h-2 rounded-full" style={{ width: r.value, background: r.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Водосборы */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Icon name="Droplets" size={16} className="text-blue-600" />
                Водосборные бассейны и пути стока
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Водосборов", value: "7", icon: "Layers" },
                  { label: "Площадь суммарная", value: "1.24 км²", icon: "LayoutDashboard" },
                  { label: "Основной водоток", value: "1840 м", icon: "Route" },
                  { label: "Расч. расход Q", value: "3.2 м³/с", icon: "Droplets" },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <Icon name={s.icon} size={16} className="text-blue-600 flex-shrink-0" fallback="Circle" />
                    <div>
                      <div className="text-xs text-blue-500">{s.label}</div>
                      <div className="font-bold text-blue-800">{s.value}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 text-sm text-blue-700">
                Анализ водосборных бассейнов выполнен методом D8 (направление максимального потока). 
                Водосборы определены автоматически на основе ЦМР без участия пользователя.
              </div>
            </div>
          </div>
        )}

        {/* ── ОТЧЁТ И ЭКСПОРТ ── */}
        {активнаяВкладка === "отчёт" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Icon name="FileText" size={16} className="text-indigo-600" />
                  Технический отчёт по ЦМР
                </h3>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => экспорт("CSV")} className="gap-2">
                    <Icon name="FileSpreadsheet" size={14} />CSV
                  </Button>
                  <Button variant="outline" onClick={() => экспорт("XML")} className="gap-2">
                    <Icon name="FileCode" size={14} />LandXML
                  </Button>
                </div>
              </div>

              {/* Данные отчёта */}
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  Общие сведения
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      { p: "Дата создания", v: new Date().toLocaleDateString("ru", { day: "numeric", month: "long", year: "numeric" }) },
                      { p: "Метод построения", v: цмрПарамы.метод },
                      { p: "Шаг сетки", v: `${цмрПарамы.шаг} м` },
                      { p: "Количество точек", v: итогоТочек.toLocaleString("ru") },
                      { p: "Площадь покрытия", v: "≈ 1.24 км²" },
                      { p: "Система координат", v: "МСК-50 зона 1 / WGS-84" },
                      { p: "Точность высот", v: "± 0.05 м (1σ)" },
                      { p: "Источники данных", v: загруженныеДанные.map(д => д.источник).join(", ") || "—" },
                      { p: "Фильтрация шума", v: цмрПарамы.фильтрация ? "Выполнена" : "Не применялась" },
                      { p: "Удаление растительности", v: цмрПарамы.удалениеВегет ? "Выполнено (нормализация)" : "Не применялось" },
                    ].map((r, i) => (
                      <tr key={r.p} className={`border-t border-gray-100 ${i % 2 === 0 ? "" : "bg-gray-50"}`}>
                        <td className="px-4 py-2 font-medium text-gray-500 text-xs w-48">{r.p}</td>
                        <td className="px-4 py-2 text-gray-800 font-semibold text-sm">{r.v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Форматы экспорта */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Icon name="Download" size={16} className="text-indigo-600" />
                Экспорт данных
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { fmt: "LandXML", desc: "Обмен с Civil 3D, InfraWorks, ЛАПА", color: "bg-blue-50 border-blue-200", btn: "bg-blue-600", fn: () => экспорт("XML") },
                  { fmt: "DEM / GeoTIFF", desc: "Растровая ЦМР для ГИС", color: "bg-green-50 border-green-200", btn: "bg-green-600", fn: () => экспорт("DEM") },
                  { fmt: "CSV точки", desc: "X, Y, Z, класс для Excel", color: "bg-orange-50 border-orange-200", btn: "bg-orange-600", fn: () => экспорт("CSV") },
                  { fmt: "Shapefile", desc: "ESRI Shape для ArcGIS/QGIS", color: "bg-purple-50 border-purple-200", btn: "bg-purple-600", fn: () => экспорт("SHP") },
                  { fmt: "LAS / LAZ", desc: "Облако точек для обмена", color: "bg-cyan-50 border-cyan-200", btn: "bg-cyan-600", fn: () => экспорт("LAS") },
                  { fmt: "PDF отчёт", desc: "Технический отчёт с картами", color: "bg-red-50 border-red-200", btn: "bg-red-600", fn: () => экспорт("PDF") },
                ].map(f => (
                  <div key={f.fmt} className={`rounded-xl border p-3 space-y-2 ${f.color}`}>
                    <div className="font-bold text-gray-900 text-sm">{f.fmt}</div>
                    <div className="text-xs text-gray-500">{f.desc}</div>
                    <Button onClick={f.fn} size="sm" className={`w-full text-white text-xs ${f.btn} hover:opacity-90 gap-1`}>
                      <Icon name="Download" size={12} />Скачать
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Диалог импорта */}
      <AnimatePresence>
        {showИмпорт && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowИмпорт(false)}>
            <motion.div initial={{ scale: 0.93 }} animate={{ scale: 1 }} exit={{ scale: 0.93 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                  <Icon name="Upload" size={18} className="text-indigo-600" />
                  Загрузка данных
                </h3>
                <button onClick={() => setShowИмпорт(false)} className="text-gray-400 hover:text-gray-600">
                  <Icon name="X" size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {ИСТОЧНИКИ.map(ист => (
                  <button key={ист.id}
                    onClick={() => { setВыбранныйИсточник(ист.id); загрузитьДанные(ист.id) }}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:shadow-md ${выбранныйИсточник === ист.id ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: ист.color + "25" }}>
                      <Icon name={ист.icon} size={16} style={{ color: ист.color }} fallback="Database" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-800">{ист.label}</div>
                      <div className="text-xs text-gray-400 leading-tight">{ист.desc.split("(")[0].trim()}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center space-y-2 bg-gray-50">
                <Icon name="Upload" size={28} className="mx-auto text-gray-300" />
                <div className="text-sm font-medium text-gray-500">Перетащите файлы сюда</div>
                <div className="text-xs text-gray-400">Поддерживаются: .las, .laz, .csv, .raw, .gsi, .xml, .dem</div>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => загрузитьДанные("lidar_air")}>
                  Выбрать файлы
                </Button>
              </div>

              {загрузка && (
                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                  <Icon name="Loader" size={16} className="animate-spin text-indigo-600" />
                  <span className="text-sm text-indigo-700 font-medium">Обработка и классификация данных…</span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <Tabs defaultValue="cat-surface" className="mt-6">
        <TabsList>
          <TabsTrigger value="cat-surface">Рельеф</TabsTrigger>
          <TabsTrigger value="cat-survey">Съёмка COGO</TabsTrigger>
        </TabsList>
        <TabsContent value="cat-surface"><CategoryFeaturesGrid category="surface" /></TabsContent>
        <TabsContent value="cat-survey"><CategoryFeaturesGrid category="survey" /></TabsContent>
      </Tabs>
    </motion.div>
  )
}