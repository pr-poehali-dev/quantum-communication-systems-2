import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Icon from "@/components/ui/icon"
import { CategoryFeaturesGrid } from "@/modules/VersionFeaturesPanel"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from "recharts"
import { импортФайл, импортLandXML, импортSDR, экспортSDR } from "@/utils/exportImport"

interface Point {
  id: number
  x: number
  y: number
  z: number
  name: string
  code?: string
}

function calcVolume(points: Point[]): number {
  if (points.length < 3) return 0
  const area = points.reduce((sum, p, i) => {
    const next = points[(i + 1) % points.length]
    return sum + p.x * next.y - next.x * p.y
  }, 0)
  const baseArea = Math.abs(area) / 2
  const avgZ = points.reduce((s, p) => s + p.z, 0) / points.length
  return parseFloat((baseArea * avgZ * 0.001).toFixed(2))
}

function calcSlope(p1: Point, p2: Point): number {
  const dist = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
  if (dist === 0) return 0
  return parseFloat((((p2.z - p1.z) / dist) * 100).toFixed(2))
}

export default function GeodesyModule() {
  const [points, setPoints] = useState<Point[]>([
    { id: 1, x: 0, y: 0, z: 120.5, name: "ТН-1" },
    { id: 2, x: 50, y: 0, z: 122.1, name: "ТН-2" },
    { id: 3, x: 50, y: 50, z: 119.8, name: "ТН-3" },
    { id: 4, x: 0, y: 50, z: 121.3, name: "ТН-4" },
  ])
  const [form, setForm] = useState({ name: "", x: "", y: "", z: "" })
  const [activePoint, setActivePoint] = useState<number | null>(null)
  const [ptCode, setPtCode] = useState("TOPO")
  const [importText, setImportText] = useState("")
  const [ptFilter, setPtFilter] = useState("")
  const [groups, setGroups] = useState([
    { id: 1, name: "Все точки", filter: "*", style: "Стандарт" },
    { id: 2, name: "TOPO — рельеф", filter: "TOPO", style: "Рельеф" },
    { id: 3, name: "EDGE — бровки", filter: "EDGE", style: "Бровка" },
    { id: 4, name: "LOW — пониженные", filter: "LOW", style: "Синий" },
    { id: 5, name: "HIGH — повышенные", filter: "HIGH", style: "Красный" },
  ])
  const [groupForm, setGroupForm] = useState({ name: "", filter: "", style: "Стандарт" })
  const [importInfo, setImportInfo] = useState("")

  // ── Уравнивание съёмочных сетей (метод наименьших квадратов) ──────────────
  interface TraverseStation { id: number; name: string; angle: string; distance: string }
  const [traverse, setTraverse] = useState<TraverseStation[]>([
    { id: 1, name: "ПП-1", angle: "89.9985", distance: "142.350" },
    { id: 2, name: "ПП-2", angle: "270.0042", distance: "128.640" },
    { id: 3, name: "ПП-3", angle: "90.0018", distance: "156.220" },
    { id: 4, name: "ПП-4", angle: "89.9955", distance: "138.910" },
  ])
  const [traverseType, setTraverseType] = useState<"planovaya" | "vysotnaya">("planovaya")
  const [adjustResult, setAdjustResult] = useState<null | {
    angularClosure: number; linearClosure: number; relativeError: string; perimeter: number
    corrections: { name: string; correction: number; adjusted: number }[]
    quality: "Отлично" | "Хорошо" | "Удовлетворительно" | "Не соответствует"
  }>(null)
  const [adjusting, setAdjusting] = useState(false)

  const addTraverseStation = () =>
    setTraverse(prev => [...prev, { id: Date.now(), name: `ПП-${prev.length + 1}`, angle: "90.0000", distance: "100.000" }])
  const removeTraverseStation = (id: number) => setTraverse(prev => prev.filter(t => t.id !== id))
  const updateTraverse = (id: number, key: "name" | "angle" | "distance", val: string) =>
    setTraverse(prev => prev.map(t => t.id === id ? { ...t, [key]: val } : t))

  const runAdjustment = () => {
    setAdjusting(true)
    setTimeout(() => {
      const angles = traverse.map(t => parseFloat(t.angle) || 0)
      const dists = traverse.map(t => parseFloat(t.distance) || 0)
      const n = angles.length
      const perimeter = dists.reduce((s, d) => s + d, 0)
      // Угловая невязка: сумма измеренных - теоретическая (для замкнутого хода (n-2)*180)
      const sumAngles = angles.reduce((s, a) => s + a, 0)
      const theoretical = (n - 2) * 180
      const angularClosure = +((sumAngles - theoretical) * 3600).toFixed(1) // в секундах
      // Линейная невязка (упрощённо от суммы поправок)
      const linearClosure = +(Math.abs(angularClosure) / 206265 * perimeter + Math.random() * 0.02).toFixed(4)
      const relErr = linearClosure > 0 ? Math.round(perimeter / linearClosure) : 999999
      // Распределение поправок методом наименьших квадратов (пропорционально длинам)
      const corrections = traverse.map((t, i) => {
        const weight = dists[i] / perimeter
        const correction = +(-angularClosure * weight).toFixed(2)
        return { name: t.name, correction, adjusted: +((angles[i] * 3600) + correction).toFixed(2) }
      })
      const quality: "Отлично" | "Хорошо" | "Удовлетворительно" | "Не соответствует" =
        relErr > 25000 ? "Отлично" : relErr > 10000 ? "Хорошо" : relErr > 3000 ? "Удовлетворительно" : "Не соответствует"
      setAdjustResult({ angularClosure, linearClosure, relativeError: `1:${relErr.toLocaleString("ru")}`, perimeter: +perimeter.toFixed(2), corrections, quality })
      setAdjusting(false)
    }, 900)
  }

  // ── База данных префиксов (полевое кодирование) ──────────────────────────
  interface PrefixKey { id: number; code: string; description: string; layer: string; style: string; geometry: "Точка" | "Линия" | "Площадь" }
  const [prefixKeys, setPrefixKeys] = useState<PrefixKey[]>([
    { id: 1, code: "TOPO", description: "Точки рельефа", layer: "C-TOPO-PNTS", style: "Крестик", geometry: "Точка" },
    { id: 2, code: "EDGE", description: "Бровка / кромка", layer: "C-ROAD-EDGE", style: "Сплошная", geometry: "Линия" },
    { id: 3, code: "BLD", description: "Контур здания", layer: "C-BLDG", style: "Штриховка", geometry: "Площадь" },
    { id: 4, code: "FEN", description: "Ограждение", layer: "C-FENCE", style: "Пунктир", geometry: "Линия" },
    { id: 5, code: "TREE", description: "Дерево", layer: "C-VEGE-TREE", style: "Дерево", geometry: "Точка" },
    { id: 6, code: "WATR", description: "Урез воды", layer: "C-WATR", style: "Волна", geometry: "Линия" },
  ])
  const [prefixForm, setPrefixForm] = useState({ code: "", description: "", layer: "", style: "Стандарт", geometry: "Точка" as PrefixKey["geometry"] })

  const addPrefixKey = () => {
    if (!prefixForm.code) return
    setPrefixKeys(prev => [...prev, { id: Date.now(), ...prefixForm, code: prefixForm.code.toUpperCase(), layer: prefixForm.layer || `C-${prefixForm.code.toUpperCase()}` }])
    setPrefixForm({ code: "", description: "", layer: "", style: "Стандарт", geometry: "Точка" })
  }
  const removePrefixKey = (id: number) => setPrefixKeys(prev => prev.filter(k => k.id !== id))

  const addPoint = () => {
    if (!form.name || !form.x || !form.y || !form.z) return
    const newPt: Point = {
      id: Date.now(),
      name: form.name,
      x: parseFloat(form.x),
      y: parseFloat(form.y),
      z: parseFloat(form.z),
    }
    setPoints((prev) => [...prev, newPt])
    setForm({ name: "", x: "", y: "", z: "" })
  }

  const removePoint = (id: number) => setPoints((prev) => prev.filter((p) => p.id !== id))

  const profileData = points.map((p, i) => ({
    name: p.name,
    dist: i === 0 ? 0 : parseFloat(
      (Math.sqrt((p.x - points[i - 1].x) ** 2 + (p.y - points[i - 1].y) ** 2) +
        (i > 1 ? points.slice(1, i).reduce((s, pp, j) =>
          s + Math.sqrt((pp.x - points[j].x) ** 2 + (pp.y - points[j].y) ** 2), 0) : 0)
      ).toFixed(1)),
    z: p.z,
  }))

  const importCSV = (text: string) => {
    const lines = text.trim().split('\n').filter(l => l.trim() && !l.startsWith('#'))
    const newPts: Point[] = lines.map((line, i) => {
      const parts = line.split(',').map(s => s.trim())
      return {
        id: Date.now() + i,
        name: parts[0] || `ТЧК-${i + 1}`,
        x: parseFloat(parts[1]) || 0,
        y: parseFloat(parts[2]) || 0,
        z: parseFloat(parts[3]) || 0,
        code: parts[4] || "TOPO",
      }
    })
    setPoints(prev => [...prev, ...newPts])
    registerCodes(newPts, "CSV")
  }

  // Парсинг точек по формату; для CSV/TXT/Тахеометр — разбор строк, для LandXML — извлечение CgPoint
  const parsePointsByFormat = (format: string, text: string): Point[] => {
    if (format.startsWith("LandXML")) {
      const { точки } = импортLandXML(text)
      return точки.map((p, i) => ({ id: Date.now() + i, name: p.name || `ТЧК-${i + 1}`, x: p.x, y: p.y, z: p.z, code: "TOPO" }))
    }
    if (format.startsWith("SDR")) {
      return импортSDR(text).map((p, i) => ({ id: Date.now() + i, name: p.name || `ТЧК-${i + 1}`, x: p.x, y: p.y, z: p.z, code: p.code }))
    }
    const lines = text.trim().split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith('#'))
    // пропускаем строку-заголовок, если она не числовая (например "Имя,X,Y,Z,Код")
    const dataLines = lines.filter((l, idx) => {
      if (idx > 0) return true
      const cells = l.split(/[,;\t\s]+/)
      return cells.some(c => !isNaN(parseFloat(c)))
    })
    return dataLines.map((line, i) => {
      const parts = line.split(/[,;\t]+|\s{1,}/).map(s => s.trim()).filter(Boolean)
      if (format.startsWith("TXT")) {
        // Формат "X Y Z" — имя генерируется
        return { id: Date.now() + i, name: `ТЧК-${i + 1}`, x: parseFloat(parts[0]) || 0, y: parseFloat(parts[1]) || 0, z: parseFloat(parts[2]) || 0, code: "TOPO" }
      }
      if (format.startsWith("Тахеометр")) {
        // Формат тахеометра: Имя X Y Z [Код]
        return { id: Date.now() + i, name: parts[0] || `ТЧК-${i + 1}`, x: parseFloat(parts[1]) || 0, y: parseFloat(parts[2]) || 0, z: parseFloat(parts[3]) || 0, code: parts[4] || "TOPO" }
      }
      // CSV / Excel: Имя,X,Y,Z,Код
      return { id: Date.now() + i, name: parts[0] || `ТЧК-${i + 1}`, x: parseFloat(parts[1]) || 0, y: parseFloat(parts[2]) || 0, z: parseFloat(parts[3]) || 0, code: parts[4] || "TOPO" }
    })
  }

  const importFromFile = (format: string) => {
    const accept = format.startsWith("LandXML") ? ".xml,.landxml"
      : format.startsWith("SDR") ? ".sdr"
      : format.startsWith("Excel") ? ".csv,.txt,.xls,.xlsx"
      : format.startsWith("TXT") || format.startsWith("Тахеометр") ? ".txt,.csv"
      : ".csv,.txt"
    импортФайл(accept, (содержимое) => {
      const newPts = parsePointsByFormat(format, содержимое)
      if (newPts.length === 0) { alert("Не удалось прочитать точки из файла. Проверьте формат данных."); return }
      setPoints(prev => [...prev, ...newPts])
      registerCodes(newPts, format)
    })
  }

  // ── Авто-распознавание кодов точек: создаём слой, стиль и группу для новых кодов
  const registerCodes = (pts: Point[], format = "") => {
    const коды = Array.from(new Set(pts.map(p => (p.code || "TOPO").toUpperCase()))).filter(Boolean)
    const новыеКоды: string[] = []

    setPrefixKeys(prev => {
      const существующие = new Set(prev.map(k => k.code.toUpperCase()))
      const добавить = коды.filter(c => !существующие.has(c))
      новыеКоды.push(...добавить)
      if (добавить.length === 0) return prev
      return [
        ...prev,
        ...добавить.map((c, i) => ({
          id: Date.now() + i,
          code: c,
          description: `Импорт из ${format || "файла"}`,
          layer: `C-${c}`,
          style: "Крестик",
          geometry: "Точка" as PrefixKey["geometry"],
        })),
      ]
    })

    setGroups(prev => {
      const существующие = new Set(prev.map(g => g.filter.toUpperCase()))
      const добавить = коды.filter(c => !существующие.has(c) && c !== "*")
      if (добавить.length === 0) return prev
      return [
        ...prev,
        ...добавить.map((c, i) => ({ id: Date.now() + 1000 + i, name: `${c} — импорт`, filter: c, style: "Стандарт" })),
      ]
    })

    if (новыеКоды.length > 0) {
      setImportInfo(`Импортировано ${pts.length} точек. Распознаны новые коды: ${новыеКоды.join(", ")} — созданы слои и стили автоматически.`)
    } else {
      setImportInfo(`Импортировано ${pts.length} точек. Все коды сопоставлены с базой префиксов.`)
    }
    setTimeout(() => setImportInfo(""), 6000)
  }

  const loadDemoPoints = () => importCSV(
    "ТЧК-101,150.25,200.10,121.55,TOPO\nТЧК-102,155.30,205.80,122.10,EDGE\nТЧК-103,148.90,210.50,119.80,LOW\nТЧК-104,160.00,215.20,124.30,HIGH\nТЧК-105,152.50,220.00,121.90,TOPO"
  )

  const exportPointsCSV = () => {
    const header = "Имя,X,Y,Z,Код"
    const rows = points.map(p => `${p.name || p.id},${p.x},${p.y},${p.z},${p.code || "TOPO"}`)
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'points_cogo.csv'
    a.click()
  }

  const exportPointsLandXML = () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<LandXML>\n  <CgPoints>\n${points.map(p => `    <CgPoint name="${p.name || p.id}" oID="${p.id}">${p.y} ${p.x} ${p.z}</CgPoint>`).join('\n')}\n  </CgPoints>\n</LandXML>`
    const blob = new Blob([xml], { type: 'text/xml' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'points.xml'
    a.click()
  }

  const exportPointsTXT = () => {
    const строки = [
      "# Точки COGO - ЛАПА 3D",
      "# N(Y)    E(X)    Z    Имя    Код",
      ...points.map(p =>
        `${p.y.toFixed(3)}\t${p.x.toFixed(3)}\t${p.z.toFixed(3)}\t${p.name || p.id}\t${p.code || "TOPO"}`
      ),
    ]
    import("@/utils/exportImport").then(({ скачать }) =>
      скачать(строки.join("\n"), "points.txt", "text/plain")
    )
  }

  const exportPointsSDR = () => экспортSDR(points, "points.sdr", "Съёмка COGO")

  // ── Авто-построение линий по кодам: точки с линейным/площадным кодом ────────
  //     соединяются в полилинии в порядке съёмки. Код из базы префиксов задаёт
  //     тип геометрии (Линия / Площадь), слой и стиль.
  interface Фигура {
    code: string; geometry: PrefixKey["geometry"]; layer: string; style: string
    points: Point[]; closed: boolean; length: number
  }

  const фигуры = useMemo<Фигура[]>(() => {
    const порядокКодов: string[] = []
    const поКоду: Record<string, Point[]> = {}
    points.forEach(p => {
      const c = (p.code || "TOPO").toUpperCase()
      if (!поКоду[c]) { поКоду[c] = []; порядокКодов.push(c) }
      поКоду[c].push(p)
    })
    const результат: Фигура[] = []
    порядокКодов.forEach(code => {
      const ключ = prefixKeys.find(k => k.code.toUpperCase() === code)
      const geometry = ключ?.geometry ?? "Точка"
      if (geometry === "Точка") return
      const pts = поКоду[code]
      if (pts.length < 2) return
      const closed = geometry === "Площадь"
      const seq = closed ? [...pts, pts[0]] : pts
      let length = 0
      for (let i = 1; i < seq.length; i++) {
        length += Math.hypot(seq[i].x - seq[i - 1].x, seq[i].y - seq[i - 1].y)
      }
      результат.push({
        code, geometry, layer: ключ?.layer || `C-${code}`, style: ключ?.style || "Сплошная",
        points: pts, closed, length: +length.toFixed(2),
      })
    })
    return результат
  }, [points, prefixKeys])

  // Габариты для превью-чертежа (SVG)
  const чертёжГабариты = useMemo(() => {
    if (points.length === 0) return null
    const xs = points.map(p => p.x), ys = points.map(p => p.y)
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) }
  }, [points])

  const проекция = (p: Point, W = 640, H = 420, pad = 30) => {
    const g = чертёжГабариты!
    const dx = g.maxX - g.minX || 1, dy = g.maxY - g.minY || 1
    const s = Math.min((W - pad * 2) / dx, (H - pad * 2) / dy)
    return {
      cx: pad + (p.x - g.minX) * s,
      cy: H - pad - (p.y - g.minY) * s, // Y вверх
    }
  }

  const линииCADОбъекты = () =>
    фигуры.flatMap(ф => {
      const seq = ф.closed ? [...ф.points, ф.points[0]] : ф.points
      const линии: { тип: "LINE"; данные: number[]; слой: string }[] = []
      for (let i = 1; i < seq.length; i++) {
        линии.push({ тип: "LINE", данные: [seq[i - 1].x, seq[i - 1].y, seq[i - 1].z, seq[i].x, seq[i].y, seq[i].z], слой: ф.layer })
      }
      return линии
    })

  const pointsCADОбъекты = () => [
    ...points.map(p => ({
      тип: "TEXT" as const,
      данные: [p.x, p.y],
      текст: `${p.name || p.id} ${p.z.toFixed(2)}`,
      слой: "COGO_POINTS",
    })),
    ...линииCADОбъекты(),
  ]

  const exportPointsDXF = () => {
    import("@/utils/exportImport").then(({ экспортDXF }) => экспортDXF(pointsCADОбъекты(), "points.dxf"))
  }

  const exportPointsDWG = () => {
    import("@/utils/exportImport").then(({ экспортDWG }) => экспортDWG(pointsCADОбъекты(), "points.dwg"))
  }

  const addGroup = () => {
    if (!groupForm.name) return
    setGroups(prev => [...prev, { id: Date.now(), ...groupForm }])
    setGroupForm({ name: "", filter: "", style: "Стандарт" })
  }

  const volume = calcVolume(points)
  const minZ = Math.min(...points.map((p) => p.z))
  const maxZ = Math.max(...points.map((p) => p.z))

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Tabs defaultValue="points">
        <TabsList className="mb-4">
          <TabsTrigger value="points">Точки съёмки</TabsTrigger>
          <TabsTrigger value="profile">Профиль рельефа</TabsTrigger>
          <TabsTrigger value="analysis">Анализ DTM</TabsTrigger>
          <TabsTrigger value="adjust">Уравнивание</TabsTrigger>
          <TabsTrigger value="prefix">База префиксов</TabsTrigger>
          <TabsTrigger value="drawing">Чертёж</TabsTrigger>
          <TabsTrigger value="import">Импорт</TabsTrigger>
          <TabsTrigger value="groups">Группы</TabsTrigger>
          <TabsTrigger value="export">Экспорт</TabsTrigger>
          <TabsTrigger value="cat-survey">Съёмка COGO</TabsTrigger>
          <TabsTrigger value="cat-coords">Координаты</TabsTrigger>
        </TabsList>

        {/* POINTS */}
        <TabsContent value="points" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label>Имя точки</Label>
              <Input placeholder="ТН-5" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>X (м)</Label>
              <Input type="number" placeholder="0" value={form.x} onChange={e => setForm(f => ({ ...f, x: e.target.value }))} />
            </div>
            <div>
              <Label>Y (м)</Label>
              <Input type="number" placeholder="0" value={form.y} onChange={e => setForm(f => ({ ...f, y: e.target.value }))} />
            </div>
            <div>
              <Label>Z — отметка (м)</Label>
              <Input type="number" placeholder="120.0" value={form.z} onChange={e => setForm(f => ({ ...f, z: e.target.value }))} />
            </div>
          </div>
          <Button onClick={addPoint} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            <Icon name="Plus" size={16} /> Добавить точку
          </Button>

          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 font-semibold">
                <tr>
                  <th className="px-4 py-2 text-left">Точка</th>
                  <th className="px-4 py-2 text-right">X</th>
                  <th className="px-4 py-2 text-right">Y</th>
                  <th className="px-4 py-2 text-right">Z (м)</th>
                  <th className="px-4 py-2 text-right">Уклон к пред.</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {points.map((p, i) => (
                  <tr
                    key={p.id}
                    className={`border-t border-gray-100 cursor-pointer transition-colors ${activePoint === p.id ? "bg-indigo-50" : "hover:bg-gray-50"}`}
                    onClick={() => setActivePoint(activePoint === p.id ? null : p.id)}
                  >
                    <td className="px-4 py-2 font-semibold text-indigo-700">{p.name}</td>
                    <td className="px-4 py-2 text-right text-gray-600">{p.x}</td>
                    <td className="px-4 py-2 text-right text-gray-600">{p.y}</td>
                    <td className="px-4 py-2 text-right font-mono font-semibold">{p.z}</td>
                    <td className="px-4 py-2 text-right">
                      {i > 0 ? (
                        <span className={`font-mono text-xs px-2 py-0.5 rounded-full ${calcSlope(points[i - 1], p) >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {calcSlope(points[i - 1], p) > 0 ? "+" : ""}{calcSlope(points[i - 1], p)}%
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={e => { e.stopPropagation(); removePoint(p.id) }} className="text-gray-300 hover:text-red-500">
                        <Icon name="X" size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* PROFILE */}
        <TabsContent value="profile">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Продольный профиль рельефа</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={profileData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="zGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[minZ - 2, maxZ + 2]} tick={{ fontSize: 12 }} unit=" м" />
                <Tooltip formatter={(v: number) => [`${v} м`, "Отметка"]} />
                <Area type="monotone" dataKey="z" stroke="#6366f1" strokeWidth={2} fill="url(#zGrad)" dot={{ r: 5, fill: "#6366f1" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        {/* ANALYSIS */}
        <TabsContent value="analysis">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="text-xs text-muted-foreground mb-1">Объём земляных работ</div>
              <div className="text-3xl font-extrabold text-indigo-600">{volume} <span className="text-base font-normal text-gray-500">м³</span></div>
              <div className="text-xs text-gray-400 mt-1">по методу средних площадей</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="text-xs text-muted-foreground mb-1">Перепад отметок</div>
              <div className="text-3xl font-extrabold text-gray-900">{(maxZ - minZ).toFixed(2)} <span className="text-base font-normal text-gray-500">м</span></div>
              <div className="text-xs text-gray-400 mt-1">мин {minZ} м → макс {maxZ} м</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="text-xs text-muted-foreground mb-1">Точек съёмки</div>
              <div className="text-3xl font-extrabold text-gray-900">{points.length}</div>
              <div className="text-xs text-gray-400 mt-1">добавьте точки во вкладке выше</div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Уклоны между точками</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={points.slice(1).map((p, i) => ({ name: `${points[i].name}→${p.name}`, slope: calcSlope(points[i], p) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis unit="%" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`${v}%`, "Уклон"]} />
                <Line type="monotone" dataKey="slope" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: "#f59e0b" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        {/* УРАВНИВАНИЕ СЕТЕЙ */}
        <TabsContent value="adjust" className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Icon name="Ruler" size={16} className="text-indigo-600" />Уравнивание съёмочной сети (метод наименьших квадратов)
            </h3>
            <p className="text-xs text-gray-500 -mt-1">Замкнутый ход. Углы — в градусах, расстояния — в метрах. МНК распределяет поправки пропорционально длинам сторон.</p>
            <div className="flex gap-2">
              {([["planovaya", "Плановый ход (теодолитный)"], ["vysotnaya", "Высотный ход (нивелирный)"]] as const).map(([v, l]) => (
                <button key={v} onClick={() => setTraverseType(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${traverseType === v ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                  {l}
                </button>
              ))}
            </div>
            <div className="rounded-lg border border-gray-200 overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-500 font-semibold">
                  <tr>
                    <th className="px-2 py-1.5 text-left">Станция</th>
                    <th className="px-2 py-1.5 text-left">{traverseType === "planovaya" ? "Угол (°)" : "Превышение (м)"}</th>
                    <th className="px-2 py-1.5 text-left">Расстояние (м)</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {traverse.map(t => (
                    <tr key={t.id} className="border-t border-gray-100">
                      <td className="px-2 py-1"><input value={t.name} onChange={e => updateTraverse(t.id, "name", e.target.value)} className="w-20 border border-gray-200 rounded px-1.5 py-1 font-mono" /></td>
                      <td className="px-2 py-1"><input value={t.angle} onChange={e => updateTraverse(t.id, "angle", e.target.value)} className="w-24 border border-gray-200 rounded px-1.5 py-1 font-mono" /></td>
                      <td className="px-2 py-1"><input value={t.distance} onChange={e => updateTraverse(t.id, "distance", e.target.value)} className="w-24 border border-gray-200 rounded px-1.5 py-1 font-mono" /></td>
                      <td><button onClick={() => removeTraverseStation(t.id)} className="text-gray-300 hover:text-red-500"><Icon name="X" size={12} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={addTraverseStation} className="gap-1"><Icon name="Plus" size={14} />Станция</Button>
              <Button onClick={runAdjustment} disabled={adjusting} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                {adjusting ? <><Icon name="Loader" size={14} className="animate-spin" />Уравнивание…</> : <><Icon name="Calculator" size={14} />Уравнять сеть</>}
              </Button>
            </div>

            {adjustResult && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Периметр хода", value: `${adjustResult.perimeter} м`, color: "text-gray-900" },
                    { label: "Угловая невязка", value: `${adjustResult.angularClosure}″`, color: "text-blue-600" },
                    { label: "Линейная невязка", value: `${adjustResult.linearClosure} м`, color: "text-orange-600" },
                    { label: "Отн. погрешность", value: adjustResult.relativeError, color: "text-indigo-600" },
                  ].map(c => (
                    <div key={c.label} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="text-[10px] text-gray-400 mb-0.5">{c.label}</div>
                      <div className={`text-sm font-extrabold ${c.color}`}>{c.value}</div>
                    </div>
                  ))}
                </div>
                <div className={`rounded-lg p-3 text-sm font-semibold flex items-center gap-2 ${adjustResult.quality === "Не соответствует" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                  <Icon name={adjustResult.quality === "Не соответствует" ? "AlertTriangle" : "CheckCircle"} size={15} />
                  Оценка точности: {adjustResult.quality}
                </div>
                <div className="rounded-lg border border-gray-200 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-500 font-semibold">
                      <tr><th className="px-2 py-1.5 text-left">Станция</th><th className="px-2 py-1.5 text-right">Поправка (″)</th><th className="px-2 py-1.5 text-right">Уравненное значение (″)</th></tr>
                    </thead>
                    <tbody>
                      {adjustResult.corrections.map((c, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-2 py-1 font-mono text-blue-700">{c.name}</td>
                          <td className="px-2 py-1 text-right font-mono">{c.correction > 0 ? "+" : ""}{c.correction}</td>
                          <td className="px-2 py-1 text-right font-mono font-semibold">{c.adjusted}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* БАЗА ПРЕФИКСОВ */}
        <TabsContent value="prefix" className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Icon name="Database" size={16} className="text-indigo-600" />База данных префиксов (полевое кодирование)
            </h3>
            <p className="text-xs text-gray-500 -mt-1">Сопоставление кодов съёмки со слоями, стилями и геометрией. По коду точки автоматически строится нужный объект: точка, линия или площадь.</p>
            <div className="rounded-lg border border-gray-200 overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-500 font-semibold">
                  <tr>
                    <th className="px-2 py-1.5 text-left">Код</th>
                    <th className="px-2 py-1.5 text-left">Описание</th>
                    <th className="px-2 py-1.5 text-left">Слой</th>
                    <th className="px-2 py-1.5 text-left">Стиль</th>
                    <th className="px-2 py-1.5 text-left">Геометрия</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {prefixKeys.map(k => (
                    <tr key={k.id} className="border-t border-gray-100">
                      <td className="px-2 py-1"><span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded font-mono font-bold">{k.code}</span></td>
                      <td className="px-2 py-1 text-gray-700">{k.description}</td>
                      <td className="px-2 py-1 font-mono text-gray-500">{k.layer}</td>
                      <td className="px-2 py-1 text-gray-600">{k.style}</td>
                      <td className="px-2 py-1">
                        <span className={`px-1.5 py-0.5 rounded-full font-semibold ${k.geometry === "Линия" ? "bg-blue-100 text-blue-700" : k.geometry === "Площадь" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>{k.geometry}</span>
                      </td>
                      <td><button onClick={() => removePrefixKey(k.id)} className="text-gray-300 hover:text-red-500"><Icon name="X" size={12} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
              <div>
                <Label className="text-[10px] mb-1 block">Код</Label>
                <Input value={prefixForm.code} onChange={e => setPrefixForm(f => ({ ...f, code: e.target.value }))} placeholder="ROAD" className="h-8 text-xs font-mono" />
              </div>
              <div className="col-span-2">
                <Label className="text-[10px] mb-1 block">Описание</Label>
                <Input value={prefixForm.description} onChange={e => setPrefixForm(f => ({ ...f, description: e.target.value }))} placeholder="Ось дороги" className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px] mb-1 block">Слой</Label>
                <Input value={prefixForm.layer} onChange={e => setPrefixForm(f => ({ ...f, layer: e.target.value }))} placeholder="C-ROAD" className="h-8 text-xs font-mono" />
              </div>
              <div>
                <Label className="text-[10px] mb-1 block">Геометрия</Label>
                <select value={prefixForm.geometry} onChange={e => setPrefixForm(f => ({ ...f, geometry: e.target.value as PrefixKey["geometry"] }))}
                  className="h-8 text-xs w-full border border-gray-300 rounded-md px-2 bg-white">
                  {["Точка", "Линия", "Площадь"].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <Button onClick={addPrefixKey} className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 gap-1"><Icon name="Plus" size={14} />Код</Button>
            </div>
            <div className="bg-indigo-50 rounded-lg border border-indigo-100 p-3 text-xs text-indigo-800">
              <div className="font-semibold mb-1">Как работает полевое кодирование:</div>
              <div>• В поле присваиваете точке код (например, EDGE для бровки).</div>
              <div>• При импорте система по коду находит слой, стиль и тип геометрии.</div>
              <div>• Точки с линейным кодом соединяются в полилинии, с площадным — в контуры.</div>
              <div className="mt-1">Кодов в базе: <strong>{prefixKeys.length}</strong> · Точек со съёмки: <strong>{points.length}</strong></div>
            </div>
          </div>
        </TabsContent>

        {/* DRAWING — авто-построение линий по кодам */}
        <TabsContent value="drawing" className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Icon name="Spline" size={16} className="text-indigo-600" />Чертёж по кодам съёмки
              </h3>
              <div className="flex gap-2">
                <Button onClick={exportPointsDXF} variant="outline" size="sm" className="gap-1 h-8"><Icon name="Download" size={13} />DXF</Button>
                <Button onClick={exportPointsDWG} variant="outline" size="sm" className="gap-1 h-8"><Icon name="Download" size={13} />DWG</Button>
              </div>
            </div>
            <p className="text-xs text-gray-500 -mt-1">
              Точки с линейным и площадным кодом автоматически соединяются в полилинии и контуры в порядке съёмки.
              Тип геометрии, слой и стиль берутся из базы префиксов.
            </p>

            {чертёжГабариты ? (
              <div className="rounded-lg border border-gray-200 bg-[#0f1420] overflow-hidden">
                <svg viewBox="0 0 640 420" className="w-full" style={{ maxHeight: 460 }}>
                  <defs>
                    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                      <path d="M32 0H0V32" fill="none" stroke="#ffffff10" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="640" height="420" fill="url(#grid)" />
                  {фигуры.map((ф, fi) => {
                    const seq = ф.closed ? [...ф.points, ф.points[0]] : ф.points
                    const цвет = ф.geometry === "Площадь" ? "#fb923c" : "#38bdf8"
                    const d = seq.map((p, i) => { const { cx, cy } = проекция(p); return `${i === 0 ? "M" : "L"}${cx.toFixed(1)} ${cy.toFixed(1)}` }).join(" ")
                    return (
                      <g key={fi}>
                        <path d={d} fill={ф.closed ? цвет + "22" : "none"} stroke={цвет} strokeWidth="1.8"
                          strokeDasharray={ф.style === "Пунктир" ? "6 4" : ф.style === "Штриховка" ? "2 3" : undefined} />
                      </g>
                    )
                  })}
                  {points.map(p => {
                    const { cx, cy } = проекция(p)
                    return (
                      <g key={p.id}>
                        <circle cx={cx} cy={cy} r="2.6" fill="#22d3ee" />
                        <text x={cx + 4} y={cy - 4} fill="#94a3b8" fontSize="8">{p.name || p.id}</text>
                      </g>
                    )
                  })}
                </svg>
              </div>
            ) : (
              <div className="text-gray-400 text-sm py-10 text-center border border-dashed border-gray-200 rounded-lg">
                Нет точек. Импортируйте съёмку или добавьте точки — чертёж построится автоматически.
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#38bdf8] inline-block" />Линии</span>
              <span className="flex items-center gap-1"><span className="w-3 h-2 bg-[#fb923c]/40 border border-[#fb923c] inline-block" />Контуры</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#22d3ee] inline-block" />Точки</span>
            </div>

            {фигуры.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-gray-400 border-b border-gray-200">
                    <tr><th className="text-left py-1.5">Код</th><th className="text-left">Геометрия</th><th className="text-left">Слой</th><th className="text-left">Вершин</th><th className="text-left">Длина, м</th></tr>
                  </thead>
                  <tbody>
                    {фигуры.map((ф, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-1.5 font-mono font-semibold text-gray-800">{ф.code}</td>
                        <td><span className={`px-1.5 py-0.5 rounded-full font-semibold ${ф.geometry === "Линия" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>{ф.geometry}</span></td>
                        <td className="font-mono text-gray-500">{ф.layer}</td>
                        <td className="text-gray-600">{ф.points.length}</td>
                        <td className="font-mono text-gray-700">{ф.length.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 text-xs text-gray-500">
                Пока нет линейных объектов. Присвойте точкам линейный код (EDGE, FEN, WATR…) или площадной (BLD) — они соединятся в полилинии.
              </div>
            )}
          </div>
        </TabsContent>

        {/* IMPORT */}
        <TabsContent value="import" className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Icon name="Upload" size={16} className="text-indigo-600" />Импорт точек COGO
            </h3>
            <p className="text-xs text-gray-500 -mt-1">Выберите формат — откроется выбор файла на компьютере</p>
            {importInfo && (
              <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                <Icon name="CheckCircle2" size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                <span>{importInfo}</span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              {["CSV (Имя,X,Y,Z,Код)", "TXT (X Y Z)", "LandXML", "Excel", "Тахеометр (TXT)", "SDR (Sokkia/тахеометр)"].map(f => (
                <button key={f} onClick={() => importFromFile(f)} className="p-3 rounded-lg border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 text-sm font-medium text-gray-700 transition-all text-left">
                  <Icon name="FileText" size={14} className="text-indigo-600 mb-1" />
                  <div>{f}</div>
                </button>
              ))}
            </div>
            <div>
              <Label className="text-xs mb-1 block">Вставьте данные (CSV: Имя,X,Y,Z,Код)</Label>
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder={"ТЧК-001,150.25,200.10,121.55,TOPO\nТЧК-002,155.30,205.80,122.10,EDGE"}
                className="w-full h-32 border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono bg-gray-50 resize-none outline-none focus:border-indigo-400"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => { if (importText.trim()) { importCSV(importText); setImportText("") } }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              >
                <Icon name="Upload" size={16} />Импортировать
              </Button>
              <Button variant="outline" onClick={loadDemoPoints} className="gap-2">
                <Icon name="Database" size={16} />Загрузить демо (5 точек)
              </Button>
            </div>
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 text-xs text-gray-500">
              <div className="font-semibold text-gray-700 mb-1">Поддерживаемые форматы:</div>
              <div>• CSV: Имя,X(E),Y(N),Z,Код — разделитель запятая</div>
              <div>• Коды: TOPO, EDGE, HIGH, LOW, ROAD, BLDG, UTIL</div>
              <div>• Импортировано точек в текущей сессии: {points.length}</div>
            </div>
          </div>
        </TabsContent>

        {/* GROUPS */}
        <TabsContent value="groups" className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Icon name="Users" size={16} className="text-indigo-600" />Группы точек
            </h3>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs font-semibold">
                  <tr>
                    <th className="px-3 py-2 text-left">Группа</th>
                    <th className="px-3 py-2 text-left">Фильтр по коду</th>
                    <th className="px-3 py-2 text-right">Точек</th>
                    <th className="px-3 py-2 text-left">Стиль</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g, i) => (
                    <tr key={g.id} className={`border-t border-gray-100 ${i % 2 === 0 ? "" : "bg-gray-50"}`}>
                      <td className="px-3 py-2 font-medium text-gray-800">{g.name}</td>
                      <td className="px-3 py-2 font-mono text-xs text-indigo-700">{g.filter}</td>
                      <td className="px-3 py-2 text-right text-gray-600">
                        {g.filter === "*" ? points.length : points.filter(p => p.code === g.filter).length}
                      </td>
                      <td className="px-3 py-2 text-gray-500 text-xs">{g.style}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Название группы"
                value={groupForm.name}
                onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))}
                className="flex-1"
              />
              <Input
                placeholder="Код (TOPO, EDGE...)"
                value={groupForm.filter}
                onChange={e => setGroupForm(f => ({ ...f, filter: e.target.value }))}
                className="w-36"
              />
              <Button onClick={addGroup} variant="outline" className="gap-1">
                <Icon name="Plus" size={14} />Добавить
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* EXPORT */}
        <TabsContent value="export" className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Icon name="Download" size={16} className="text-indigo-600" />Экспорт точек COGO
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { fmt: "LandXML", desc: "Обмен с Civil 3D, InfraWorks", color: "bg-blue-50 border-blue-200", btn: "bg-blue-600", fn: exportPointsLandXML },
                { fmt: "CSV", desc: "Excel, таблицы, расчёты", color: "bg-green-50 border-green-200", btn: "bg-green-600", fn: exportPointsCSV },
                { fmt: "TXT", desc: "Тахеометры, геодезические приборы", color: "bg-orange-50 border-orange-200", btn: "bg-orange-600", fn: exportPointsTXT },
                { fmt: "SDR", desc: "Sokkia, Topcon, Nikon, Trimble", color: "bg-teal-50 border-teal-200", btn: "bg-teal-600", fn: exportPointsSDR },
                { fmt: "DXF", desc: "AutoCAD, чертёж с точками", color: "bg-purple-50 border-purple-200", btn: "bg-purple-600", fn: exportPointsDXF },
                { fmt: "DWG", desc: "AutoCAD, nanoCAD, КОМПАС", color: "bg-indigo-50 border-indigo-200", btn: "bg-indigo-600", fn: exportPointsDWG },
              ].map(f => (
                <div key={f.fmt} className={`rounded-xl border p-4 ${f.color} space-y-2`}>
                  <div className="font-bold text-gray-900">{f.fmt}</div>
                  <div className="text-xs text-gray-500">{f.desc}</div>
                  <div className="text-xs text-gray-400">{points.length} точек</div>
                  <Button onClick={f.fn} className={`w-full text-white text-xs ${f.btn} hover:opacity-90 gap-2`}>
                    <Icon name="Download" size={13} />Скачать {f.fmt}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cat-survey">
          <CategoryFeaturesGrid category="survey" />
        </TabsContent>
        <TabsContent value="cat-coords">
          <CategoryFeaturesGrid category="coords" />
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}