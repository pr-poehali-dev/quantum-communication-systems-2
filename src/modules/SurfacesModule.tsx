import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import { VersionFeaturesInline } from "@/modules/VersionFeaturesPanel"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"
import { экспортCSV, экспортExcel, экспортLandXML, экспортТекст, импортФайл, импортCSV, импортLandXML } from "@/utils/exportImport"

// ─── Types ──────────────────────────────────────────────────────────────────

interface SurfPoint { id: number; name: string; x: number; y: number; z: number; code: string; group: string }
interface Surface {
  id: number; name: string; description: string
  type: "TIN" | "Grid" | "Растровая"
  style: string; layer: string; gridStep: number
  sources: DataSource[]
  boundaries: Boundary[]
  palette: string; wireframe: boolean
}
interface DataSource { id: number; name: string; format: string; count: number }
interface Boundary { id: number; name: string; type: "Внешняя" | "Внутренняя" | "Обрезка"; pts: number }

// ─── Constants ───────────────────────────────────────────────────────────────

const PAL_TERRAIN = ["#1a6b1a","#2d8a2d","#4da64d","#80cc50","#b8e060","#e8f060","#f0c830","#e08020","#c05018","#8b3010","#5a1a08"]
const PAL_RAINBOW = ["#0000ff","#0060ff","#00c0ff","#00ffcc","#00ff60","#60ff00","#ccff00","#ffcc00","#ff6000","#ff0000","#800000"]
const PAL_GREY    = ["#f8f8f8","#d8d8d8","#b8b8b8","#989898","#787878","#585858","#404040","#282828","#181818","#0a0a0a","#000000"]
const PAL_HEAT    = ["#00008b","#0000ff","#0080ff","#00ffff","#80ff00","#ffff00","#ff8000","#ff0000","#8b0000","#4a0000","#1a0000"]

const PALETTES: Record<string, string[]> = { Terrain: PAL_TERRAIN, Rainbow: PAL_RAINBOW, Grayscale: PAL_GREY, Thermal: PAL_HEAT }

const SURF_STYLES = ["Стандарт","Горизонтали 0.5м","Горизонтали 1м","Горизонтали 5м","Анализ уклонов","Анализ высот","Без отображения"]
const DATA_FORMATS = ["CSV (N,E,Z,Desc)","TXT (X,Y,Z)","LandXML","DEM / GeoTIFF","Облако точек (LAS/RCP)","XLSX / Excel","DWG — 3D полилинии","Shapefile"]
const BOUNDARY_TYPES: Boundary["type"][] = ["Внешняя","Внутренняя","Обрезка"]

const SLOPE_RANGES = [
  { label: "0–3%",  color: "#4ade80", from: 0,  to: 3  },
  { label: "3–8%",  color: "#facc15", from: 3,  to: 8  },
  { label: "8–15%", color: "#fb923c", from: 8,  to: 15 },
  { label: ">15%",  color: "#ef4444", from: 15, to: 100 },
]

const INIT_SURFACES: Surface[] = [
  {
    id: 1, name: "Существующая поверхность", description: "DTM по данным тахеометрической съёмки",
    type: "TIN", style: "Горизонтали 1м", layer: "C-TOPO-EXIST", gridStep: 10,
    palette: "Terrain", wireframe: false,
    sources: [
      { id: 1, name: "Съёмка_2024.csv", format: "CSV (N,E,Z,Desc)", count: 284 },
      { id: 2, name: "Горизонтали_1м.dwg", format: "DWG — 3D полилинии", count: 142 },
    ],
    boundaries: [{ id: 1, name: "Граница территории", type: "Внешняя", pts: 12 }],
  },
  {
    id: 2, name: "Проектная поверхность", description: "Проектный рельеф — итерация 3",
    type: "TIN", style: "Горизонтали 0.5м", layer: "C-TOPO-DESIGN", gridStep: 5,
    palette: "Rainbow", wireframe: false,
    sources: [{ id: 1, name: "Коридор_ШД-38.xml", format: "LandXML", count: 1840 }],
    boundaries: [
      { id: 1, name: "Граница коридора", type: "Внешняя", pts: 88 },
      { id: 2, name: "Под зданием ТП", type: "Внутренняя", pts: 4 },
    ],
  },
]

const INIT_POINTS: SurfPoint[] = [
  { id: 1,  name: "ТЧК-001", x: 1.2,  y: 1.5,  z: 120.54, code: "TOPO", group: "Съёмка_2024" },
  { id: 2,  name: "ТЧК-002", x: 3.8,  y: 2.1,  z: 122.10, code: "TOPO", group: "Съёмка_2024" },
  { id: 3,  name: "ТЧК-003", x: 7.1,  y: 1.3,  z: 119.82, code: "EDGE", group: "Съёмка_2024" },
  { id: 4,  name: "ТЧК-004", x: 2.0,  y: 5.4,  z: 121.30, code: "TOPO", group: "Съёмка_2024" },
  { id: 5,  name: "ТЧК-005", x: 5.9,  y: 5.1,  z: 123.05, code: "HIGH", group: "Съёмка_2024" },
  { id: 6,  name: "ТЧК-006", x: 4.1,  y: 8.2,  z: 120.80, code: "TOPO", group: "Съёмка_2024" },
  { id: 7,  name: "ТЧК-007", x: 1.1,  y: 8.7,  z: 118.45, code: "LOW",  group: "Съёмка_2024" },
  { id: 8,  name: "ТЧК-008", x: 8.4,  y: 8.0,  z: 124.20, code: "HIGH", group: "Съёмка_2024" },
  { id: 9,  name: "ТЧК-009", x: 3.3,  y: 3.0,  z: 121.70, code: "TOPO", group: "Съёмка_2024" },
  { id: 10, name: "ТЧК-010", x: 6.2,  y: 3.4,  z: 122.55, code: "TOPO", group: "Съёмка_2024" },
]

// ─── Helper functions ────────────────────────────────────────────────────────

function Hf(x: number, y: number): number {
  return 120 + Math.sin(x * 0.4) * 3 + Math.cos(y * 0.3) * 2.5 + Math.sin(x * 0.15 + y * 0.2) * 1.5
}

function getPal(name: string) { return PALETTES[name] || PAL_TERRAIN }

function colorByZ(z: number, minZ: number, maxZ: number, pal: string[]): string {
  const t = Math.max(0, Math.min(1, (z - minZ) / (maxZ - minZ + 0.01)))
  return pal[Math.floor(t * (pal.length - 1))]
}

// ─── Canvas drawing ──────────────────────────────────────────────────────────

function drawSurface(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  pts: SurfPoint[], surf: Surface, analysisMode: string
) {
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, W, H)

  const pal = getPal(surf.palette)
  const pad = 32
  const w = W - pad * 2, h = H - pad * 2
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y), zs = pts.map(p => p.z)
  const minX = Math.min(...xs, 0), maxX = Math.max(...xs, 10)
  const minY = Math.min(...ys, 0), maxY = Math.max(...ys, 10)
  const minZ = Math.min(...zs), maxZ = Math.max(...zs)
  const sx = (x: number) => pad + ((x - minX) / (maxX - minX + 0.01)) * w
  const sy = (y: number) => H - pad - ((y - minY) / (maxY - minY + 0.01)) * h

  if (surf.type === "Grid" || analysisMode === "slopes" || analysisMode === "heights") {
    // Render grid cells
    const STEPS = 40
    for (let r = 0; r < STEPS; r++) {
      for (let c = 0; c < STEPS; c++) {
        const x = minX + (c / STEPS) * (maxX - minX)
        const y = minY + (r / STEPS) * (maxY - minY)
        const z = Hf(x / 10 * 10, y / 10 * 10)
        let fill: string
        if (analysisMode === "slopes") {
          const dzdx = (Hf((x + 0.1) / 10 * 10, y / 10 * 10) - z) / 0.1
          const dzdy = (Hf(x / 10 * 10, (y + 0.1) / 10 * 10) - z) / 0.1
          const slope = Math.sqrt(dzdx ** 2 + dzdy ** 2) * 100
          fill = slope < 3 ? SLOPE_RANGES[0].color : slope < 8 ? SLOPE_RANGES[1].color : slope < 15 ? SLOPE_RANGES[2].color : SLOPE_RANGES[3].color
        } else {
          fill = colorByZ(z, minZ, maxZ, pal)
        }
        const px = pad + (c / STEPS) * w
        const py = H - pad - ((r + 1) / STEPS) * h
        ctx.fillStyle = fill + "cc"
        ctx.fillRect(px, py, w / STEPS + 0.5, h / STEPS + 0.5)
      }
    }
  }

  // Contours
  if (surf.type === "TIN" || analysisMode === "contours" || analysisMode === "") {
    const step = surf.style.includes("0.5") ? 0.5 : surf.style.includes("5м") ? 5 : 1
    const nLevels = Math.ceil((maxZ - minZ) / step)
    for (let li = 0; li <= nLevels; li++) {
      const lev = minZ + li * step
      const isMajor = li % 5 === 0
      ctx.beginPath()
      let first = true
      for (let ix = 0; ix <= 60; ix++) {
        const x = minX + (ix / 60) * (maxX - minX)
        for (let iy = 0; iy <= 60; iy++) {
          const y = minY + (iy / 60) * (maxY - minY)
          const z = Hf(x / 10 * 10, y / 10 * 10)
          if (Math.abs(z - lev) < step * 0.15) {
            if (first) { ctx.moveTo(sx(x), sy(y)); first = false } else ctx.lineTo(sx(x), sy(y))
          }
        }
      }
      const col = colorByZ(lev, minZ, maxZ, pal)
      ctx.strokeStyle = col; ctx.lineWidth = isMajor ? 1.5 : 0.6; ctx.stroke()
      if (isMajor && !first) {
        ctx.fillStyle = col; ctx.font = "bold 9px sans-serif"
        ctx.fillText(`${lev.toFixed(1)}м`, pad + 4, sy(minY + (maxY - minY) * (li / nLevels)))
      }
    }
  }

  // Flow arrows (watersheds mode)
  if (analysisMode === "watersheds") {
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        const x = minX + (c / 15 + 1 / 30) * (maxX - minX)
        const y = minY + (r / 15 + 1 / 30) * (maxY - minY)
        const dzdx = (Hf((x + 0.2) / 10 * 10, y / 10 * 10) - Hf((x - 0.2) / 10 * 10, y / 10 * 10)) / 0.4
        const dzdy = (Hf(x / 10 * 10, (y + 0.2) / 10 * 10) - Hf(x / 10 * 10, (y - 0.2) / 10 * 10)) / 0.4
        const len = Math.sqrt(dzdx ** 2 + dzdy ** 2) + 0.01
        const ax = sx(x), ay = sy(y)
        const ex = ax - (dzdx / len) * 10, ey = ay + (dzdy / len) * 10
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ex, ey)
        ctx.strokeStyle = "#60a5fa88"; ctx.lineWidth = 1; ctx.stroke()
        ctx.beginPath(); ctx.arc(ex, ey, 2, 0, Math.PI * 2)
        ctx.fillStyle = "#60a5fa"; ctx.fill()
      }
    }
  }

  // TIN edges
  if (surf.type === "TIN" && surf.wireframe) {
    for (let i = 0; i < pts.length; i++) {
      const dists = pts.map((p, j) => ({ j, d: Math.sqrt((p.x-pts[i].x)**2+(p.y-pts[i].y)**2) }))
        .filter(d => d.j !== i).sort((a,b) => a.d-b.d).slice(0,3)
      dists.forEach(({j}) => {
        if (j > i) {
          ctx.beginPath(); ctx.moveTo(sx(pts[i].x), sy(pts[i].y)); ctx.lineTo(sx(pts[j].x), sy(pts[j].y))
          ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 0.8; ctx.stroke()
        }
      })
    }
  }

  // Points
  pts.forEach(p => {
    ctx.beginPath(); ctx.arc(sx(p.x), sy(p.y), 4, 0, Math.PI * 2)
    ctx.fillStyle = colorByZ(p.z, minZ, maxZ, pal)
    ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 1; ctx.stroke()
    ctx.fillStyle = "#fff"; ctx.font = "8px sans-serif"
    ctx.fillText(p.z.toFixed(1), sx(p.x)+5, sy(p.y)-3)
  })

  // Colorbar
  const barX = W - 20, barH2 = H - 64
  const grad = ctx.createLinearGradient(0, 32, 0, 32 + barH2)
  ;[...pal].reverse().forEach((c, i) => grad.addColorStop(i/(pal.length-1), c))
  ctx.fillStyle = grad; ctx.fillRect(barX, 32, 12, barH2)
  ctx.strokeStyle = "#ffffff44"; ctx.lineWidth = 0.5; ctx.strokeRect(barX, 32, 12, barH2)
  ctx.fillStyle = "#94a3b8"; ctx.font = "9px sans-serif"
  ctx.fillText(`${maxZ.toFixed(0)}м`, barX - 2, 28)
  ctx.fillText(`${minZ.toFixed(0)}м`, barX - 2, 32 + barH2 + 10)
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SurfaceCanvas({ surf, points, analysisMode }: { surf: Surface; points: SurfPoint[]; analysisMode: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const draw = useCallback(() => {
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext("2d")!
    drawSurface(ctx, c.width, c.height, points, surf, analysisMode)
  }, [surf, points, analysisMode])

  useEffect(() => {
    const c = canvasRef.current; if (!c) return
    const ro = new ResizeObserver(() => { c.width = c.offsetWidth; c.height = c.offsetHeight; draw() })
    ro.observe(c); c.width = c.offsetWidth; c.height = c.offsetHeight; draw()
    return () => ro.disconnect()
  }, [draw])
  useEffect(() => { draw() }, [draw])

  return <canvas ref={canvasRef} className="w-full h-full block" />
}

// ─── Main module ─────────────────────────────────────────────────────────────

export default function SurfacesModule() {
  const [step, setStep] = useState(1)
  const [surfaces, setSurfaces] = useState<Surface[]>(INIT_SURFACES)
  const [activeSurf, setActiveSurf] = useState<number>(1)
  const [points, setPoints] = useState<SurfPoint[]>(INIT_POINTS)
  const [analysisMode, setAnalysisMode] = useState("")
  const [showNewSurf, setShowNewSurf] = useState(false)
  const [newSurf, setNewSurf] = useState({ name: "", description: "", type: "TIN" as Surface["type"], style: "Горизонтали 1м", layer: "C-TOPO", gridStep: 10 })
  const [addSourceForm, setAddSourceForm] = useState({ name: "", format: DATA_FORMATS[0] })
  const [addBoundaryForm, setAddBoundaryForm] = useState({ name: "", type: "Внешняя" as Boundary["type"] })
  const [pointForm, setPointForm] = useState({ name: "", x: "", y: "", z: "", code: "TOPO", group: "Съёмка_2024" })
  const [ptSearch, setPtSearch] = useState("")
  const [exportFormat, setExportFormat] = useState("LandXML")
  const [volumeResult, setVolumeResult] = useState<null|{cut:number;fill:number;balance:number}>(null)
  const [calcVolume, setCalcVolume] = useState(false)

  const surf = surfaces.find(s => s.id === activeSurf) || surfaces[0]
  const minZ = Math.min(...points.map(p => p.z))
  const maxZ = Math.max(...points.map(p => p.z))
  const filteredPts = points.filter(p => p.name.toLowerCase().includes(ptSearch.toLowerCase()) || p.code.toLowerCase().includes(ptSearch.toLowerCase()))

  const updateSurf = (patch: Partial<Surface>) =>
    setSurfaces(prev => prev.map(s => s.id === activeSurf ? { ...s, ...patch } : s))

  const addSource = () => {
    if (!addSourceForm.name) return
    updateSurf({ sources: [...surf.sources, { id: Date.now(), name: addSourceForm.name, format: addSourceForm.format, count: Math.floor(Math.random() * 500 + 50) }] })
    setAddSourceForm(f => ({ ...f, name: "" }))
  }

  const removeSource = (id: number) => updateSurf({ sources: surf.sources.filter(s => s.id !== id) })

  const addBoundary = () => {
    if (!addBoundaryForm.name) return
    updateSurf({ boundaries: [...surf.boundaries, { id: Date.now(), name: addBoundaryForm.name, type: addBoundaryForm.type, pts: Math.floor(Math.random() * 20 + 4) }] })
    setAddBoundaryForm(f => ({ ...f, name: "" }))
  }

  const addPoint = () => {
    if (!pointForm.x || !pointForm.y || !pointForm.z) return
    setPoints(prev => [...prev, { id: Date.now(), name: pointForm.name || `ТЧК-${String(prev.length+1).padStart(3,"0")}`, x: +pointForm.x, y: +pointForm.y, z: +pointForm.z, code: pointForm.code, group: pointForm.group }])
    setPointForm(f => ({ ...f, name: "", x: "", y: "", z: "" }))
  }

  const createSurface = () => {
    if (!newSurf.name) return
    const s: Surface = { ...newSurf, id: Date.now(), palette: "Terrain", wireframe: false, sources: [], boundaries: [] }
    setSurfaces(prev => [...prev, s])
    setActiveSurf(s.id)
    setShowNewSurf(false)
    setNewSurf({ name: "", description: "", type: "TIN", style: "Горизонтали 1м", layer: "C-TOPO", gridStep: 10 })
    setStep(2)
  }

  const runVolumeCalc = () => {
    setCalcVolume(true)
    setTimeout(() => {
      const cut = +(Math.random() * 8000 + 2000).toFixed(1)
      const fill = +(Math.random() * 6000 + 1500).toFixed(1)
      setVolumeResult({ cut, fill, balance: +(cut - fill).toFixed(1) })
      setCalcVolume(false)
    }, 1200)
  }

  const doЭкспортLandXML = () => {
    экспортLandXML({
      имя: surf.name,
      поверхности: surfaces.map(s => ({ name: s.name, type: s.type })),
    }, `${surf.name}.xml`)
  }

  const doЭкспортCSV = () => {
    экспортCSV(
      ["ID", "Имя", "X", "Y", "Z", "Код"],
      points.map((p, i) => [i + 1, p.name || `ТЧК-${i + 1}`, p.x, p.y, p.z, p.code || "TOPO"]),
      `${surf.name}_points.csv`
    )
  }

  const doЭкспортExcel = () => {
    экспортExcel(
      ["ID", "Имя", "X (E)", "Y (N)", "Z (м)", "Код"],
      points.map((p, i) => [i + 1, p.name || `ТЧК-${i + 1}`, p.x, p.y, p.z, p.code || "TOPO"]),
      "Точки поверхности",
      `${surf.name}_points.xls`
    )
  }

  const doЭкспортОтчёт = () => {
    экспортТекст([
      `ОТЧЁТ ПО ПОВЕРХНОСТИ: ${surf.name}`,
      "=".repeat(40),
      `Дата: ${new Date().toLocaleDateString("ru")}`,
      `Тип: ${surf.type}`,
      `Стиль: ${surf.style}`,
      `Слой: ${surf.layer}`,
      `Точек: ${points.length}`,
      `Мин. отметка: ${minZ.toFixed(2)} м`,
      `Макс. отметка: ${maxZ.toFixed(2)} м`,
      `Перепад: ${(maxZ - minZ).toFixed(2)} м`,
      "",
      "ИСТОЧНИКИ ДАННЫХ:",
      ...surf.sources.map(s => `  - ${s.name} (${s.format}, ${s.count} точек)`),
    ], `${surf.name}_report.txt`)
  }

  const doИмпорт = () => {
    импортФайл(".csv,.txt,.xml,.landxml,.las", (содержимое, имя) => {
      const low = имя.toLowerCase()
      let newPts: SurfPoint[] = []

      if (low.endsWith(".xml") || low.endsWith(".landxml")) {
        // LandXML — извлекаем точки CgPoint
        const { точки } = импортLandXML(содержимое)
        newPts = точки.map((p, i) => ({
          id: Date.now() + i, name: p.name || `ТЧК-${i + 1}`,
          x: p.x, y: p.y, z: p.z, code: "TOPO", group: "Импорт LandXML",
        }))
      } else {
        // CSV / TXT. Определяем: есть ли строка-заголовок
        const firstLine = содержимое.trim().split(/\r?\n/)[0] || ""
        const hasHeader = /имя|name|x|y|z|код|code/i.test(firstLine) && isNaN(parseFloat(firstLine.split(/[,;\t\s]+/)[0]))
        if (hasHeader) {
          const rows = импортCSV(содержимое)
          newPts = rows.map((r, i) => ({
            id: Date.now() + i,
            name: r["Имя"] || r["name"] || `ТЧК-${i + 1}`,
            x: parseFloat(r["X"] || r["x"] || r["E"] || "0"),
            y: parseFloat(r["Y"] || r["y"] || r["N"] || "0"),
            z: parseFloat(r["Z"] || r["z"] || r["Отм"] || "0"),
            code: r["Код"] || r["code"] || "TOPO",
            group: "Импорт",
          }))
        } else {
          // Без заголовка: пытаемся распознать "Имя X Y Z Код" или "X Y Z"
          const lines = содержимое.trim().split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith("#"))
          newPts = lines.map((line, i) => {
            const parts = line.split(/[,;\t]+|\s{1,}/).map(s => s.trim()).filter(Boolean)
            const nums = parts.map(p => parseFloat(p))
            // Если первый столбец не число — это имя (формат Имя X Y Z [Код])
            if (isNaN(nums[0])) {
              return { id: Date.now() + i, name: parts[0] || `ТЧК-${i + 1}`, x: nums[1] || 0, y: nums[2] || 0, z: nums[3] || 0, code: parts[4] || "TOPO", group: "Импорт" }
            }
            // Формат X Y Z
            return { id: Date.now() + i, name: `ТЧК-${i + 1}`, x: nums[0] || 0, y: nums[1] || 0, z: nums[2] || 0, code: "TOPO", group: "Импорт" }
          })
        }
      }

      if (newPts.length === 0) { alert("Не удалось прочитать точки из файла. Проверьте формат данных."); return }
      setPoints(prev => [...prev, ...newPts])
      updateSurf({ sources: [...surf.sources, { id: Date.now(), name: имя, format: low.endsWith(".xml") || low.endsWith(".landxml") ? "LandXML" : low.endsWith(".txt") ? "TXT (X,Y,Z)" : "CSV (N,E,Z,Desc)", count: newPts.length }] })
    })
  }

  // Slope histogram data
  const slopeData = SLOPE_RANGES.map(r => ({ name: r.label, area: +(Math.random() * 3000 + 500).toFixed(0), color: r.color }))
  const slopePie = slopeData.map(d => ({ name: d.name, value: d.area }))

  // Таблица площадей по диапазонам отметок (детерминированно по фактическим точкам)
  const elevBands = (() => {
    const bands = 5
    const span = (maxZ - minZ) || 1
    const pal = getPal(surf.palette)
    return Array.from({ length: bands }, (_, i) => {
      const from = minZ + (span * i) / bands
      const to = minZ + (span * (i + 1)) / bands
      const count = points.filter(p => p.z >= from && (i === bands - 1 ? p.z <= to : p.z < to)).length
      // Оценка площади: доля точек × условная площадь участка
      const area = +((count / Math.max(1, points.length)) * 12500 + count * 40).toFixed(0)
      return { label: `${from.toFixed(1)}–${to.toFixed(1)} м`, count, area, color: colorByZ((from + to) / 2, minZ, maxZ, pal) }
    })
  })()
  const totalElevArea = elevBands.reduce((s, b) => s + b.area, 0)

  // Композитная поверхность — сравнение существующей и проектной
  const [compSurf1, setCompSurf1] = useState<number>(surfaces[0]?.id ?? 1)
  const [compSurf2, setCompSurf2] = useState<number>(surfaces[1]?.id ?? surfaces[0]?.id ?? 1)
  const [compResult, setCompResult] = useState<null | { cut: number; fill: number; net: number; maxDiff: number; minDiff: number; zeroLine: number }>(null)
  const [calcComp, setCalcComp] = useState(false)
  const runCompositeCalc = () => {
    setCalcComp(true)
    setTimeout(() => {
      const cut = +(Math.random() * 9000 + 3000).toFixed(1)
      const fill = +(Math.random() * 7000 + 2000).toFixed(1)
      setCompResult({
        cut, fill, net: +(cut - fill).toFixed(1),
        maxDiff: +(Math.random() * 3 + 1.5).toFixed(2),
        minDiff: -+(Math.random() * 2.5 + 1).toFixed(2),
        zeroLine: +(Math.random() * 400 + 200).toFixed(0),
      })
      setCalcComp(false)
    }, 1100)
  }

  // Daylight Feature Line
  const [daylightSlope, setDaylightSlope] = useState("1:2")
  const [daylightFrom, setDaylightFrom] = useState("0+000")
  const [daylightTo, setDaylightTo] = useState("1+000")
  const [daylightResult, setDaylightResult] = useState<null | { length: number; vertices: number }>(null)
  const [calcDaylight, setCalcDaylight] = useState(false)
  const runDaylight = () => {
    setCalcDaylight(true)
    setTimeout(() => {
      setDaylightResult({ length: +(Math.random() * 500 + 300).toFixed(1), vertices: Math.floor(Math.random() * 40 + 20) })
      setCalcDaylight(false)
    }, 1000)
  }

  const STEPS = [
    { n: 1, label: "Создание" },
    { n: 2, label: "Данные" },
    { n: 3, label: "Редактирование" },
    { n: 4, label: "Анализ" },
    { n: 5, label: "Экспорт" },
  ]

  return (
    <motion.div className="space-y-4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Поверхности TIN / Grid</h2>
          <p className="text-sm text-muted-foreground">Создание, редактирование, анализ цифровых моделей рельефа</p>
        </div>
        <Button onClick={() => setShowNewSurf(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
          <Icon name="Plus" size={16} /> Новая поверхность
        </Button>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0 bg-white rounded-xl border border-gray-200 p-1 overflow-x-auto">
        {STEPS.map((s, i) => (
          <button key={s.n} onClick={() => setStep(s.n)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex-shrink-0 ${step === s.n ? "bg-indigo-600 text-white shadow" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step === s.n ? "bg-white/20" : "bg-gray-100"}`}>{s.n}</span>
            {s.label}
            {i < STEPS.length - 1 && <Icon name="ChevronRight" size={14} className="ml-1 opacity-40" />}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* Left: surface list */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">Поверхности проекта</div>
          {surfaces.map(s => (
            <button key={s.id} onClick={() => setActiveSurf(s.id)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${activeSurf === s.id ? "border-indigo-400 bg-indigo-50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"}`}>
              <div className="flex items-center gap-2">
                <Icon name="Triangle" size={14} className={activeSurf === s.id ? "text-indigo-600" : "text-gray-400"} />
                <span className="text-sm font-semibold text-gray-800 truncate">{s.name}</span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5 pl-5">{s.type} · {s.style}</div>
              <div className="text-xs text-gray-400 pl-5">{s.sources.length} источников · {s.boundaries.length} границ</div>
            </button>
          ))}
        </div>

        {/* Right: main content */}
        <div className="lg:col-span-3 space-y-4">

          {/* ── STEP 1: Создание ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2"><Icon name="Mountain" size={16} className="text-indigo-600" />Параметры поверхности</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Название</Label>
                    <Input value={surf.name} onChange={e => updateSurf({ name: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label>Слой</Label>
                    <Input value={surf.layer} onChange={e => updateSurf({ layer: e.target.value })} className="mt-1" />
                  </div>
                  <div className="col-span-2">
                    <Label>Описание</Label>
                    <Input value={surf.description} onChange={e => updateSurf({ description: e.target.value })} className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs mb-2 block">Тип поверхности</Label>
                    <div className="flex flex-col gap-2">
                      {(["TIN","Grid","Растровая"] as Surface["type"][]).map(t => (
                        <label key={t} className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${surf.type===t?"border-indigo-400 bg-indigo-50":"border-gray-200 hover:border-gray-300"}`}>
                          <input type="radio" checked={surf.type===t} onChange={() => updateSurf({ type: t })} className="mt-0.5 accent-indigo-600" />
                          <div>
                            <div className="text-sm font-semibold text-gray-800">{t}</div>
                            <div className="text-xs text-gray-400">{t==="TIN"?"Триангуляция Делоне":t==="Grid"?"Регулярная сетка":"ДЗЗ / растр"}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2 space-y-3">
                    <div>
                      <Label>Стиль отображения</Label>
                      <Select value={surf.style} onValueChange={v => updateSurf({ style: v })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{SURF_STYLES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Цветовая палитра</Label>
                      <Select value={surf.palette} onValueChange={v => updateSurf({ palette: v })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.keys(PALETTES).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    {surf.type === "Grid" && (
                      <div>
                        <Label>Шаг сетки (м)</Label>
                        <Input type="number" value={surf.gridStep} onChange={e => updateSurf({ gridStep: +e.target.value })} className="mt-1" />
                      </div>
                    )}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={surf.wireframe} onChange={e => updateSurf({ wireframe: e.target.checked })} className="accent-indigo-600" />
                      <span className="text-sm text-gray-700">Отображать рёбра триангуляции</span>
                    </label>
                  </div>
                </div>
                <Button onClick={() => setStep(2)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                  Далее — добавить данные <Icon name="ChevronRight" size={16} />
                </Button>
              </div>
              {/* Preview */}
              <div className="rounded-xl border border-gray-200 overflow-hidden" style={{ height: 300 }}>
                <SurfaceCanvas surf={surf} points={points} analysisMode="" />
              </div>
            </div>
          )}

          {/* ── STEP 2: Данные ── */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Sources */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2"><Icon name="Database" size={16} className="text-indigo-600" />Источники данных</h3>
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs font-semibold">
                      <tr>
                        <th className="px-3 py-2 text-left">Файл / источник</th>
                        <th className="px-3 py-2 text-left">Формат</th>
                        <th className="px-3 py-2 text-right">Точек</th>
                        <th className="px-3 py-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {surf.sources.map((src, i) => (
                        <tr key={src.id} className={`border-t border-gray-100 ${i%2===0?"bg-white":"bg-gray-50"}`}>
                          <td className="px-3 py-2 text-blue-700 font-mono text-xs">{src.name}</td>
                          <td className="px-3 py-2 text-gray-600 text-xs">{src.format}</td>
                          <td className="px-3 py-2 text-right font-semibold text-xs">{src.count}</td>
                          <td className="px-3 py-2">
                            <button onClick={() => removeSource(src.id)} className="text-gray-300 hover:text-red-500"><Icon name="X" size={13} /></button>
                          </td>
                        </tr>
                      ))}
                      {surf.sources.length === 0 && (
                        <tr><td colSpan={4} className="px-3 py-4 text-center text-gray-400 text-xs">Нет источников данных</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-2">
                  <Input placeholder="имя_файла.csv" value={addSourceForm.name} onChange={e => setAddSourceForm(f => ({ ...f, name: e.target.value }))} className="flex-1" />
                  <Select value={addSourceForm.format} onValueChange={v => setAddSourceForm(f => ({ ...f, format: v }))}>
                    <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                    <SelectContent>{DATA_FORMATS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button onClick={addSource} variant="outline" className="gap-1"><Icon name="Plus" size={14} />Добавить</Button>
                </div>
              </div>

              {/* Points COGO */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2"><Icon name="MapPin" size={16} className="text-indigo-600" />Точки COGO</h3>
                <div className="grid grid-cols-6 gap-2">
                  <Input placeholder="Имя" value={pointForm.name} onChange={e => setPointForm(f => ({ ...f, name: e.target.value }))} />
                  <Input placeholder="X (E)" type="number" value={pointForm.x} onChange={e => setPointForm(f => ({ ...f, x: e.target.value }))} />
                  <Input placeholder="Y (N)" type="number" value={pointForm.y} onChange={e => setPointForm(f => ({ ...f, y: e.target.value }))} />
                  <Input placeholder="Z (м)" type="number" value={pointForm.z} onChange={e => setPointForm(f => ({ ...f, z: e.target.value }))} />
                  <Input placeholder="Код" value={pointForm.code} onChange={e => setPointForm(f => ({ ...f, code: e.target.value }))} />
                  <Button onClick={addPoint} className="bg-indigo-600 hover:bg-indigo-700 text-white"><Icon name="Plus" size={14} /></Button>
                </div>
                <div className="flex items-center gap-2">
                  <Input placeholder="Поиск по имени / коду…" value={ptSearch} onChange={e => setPtSearch(e.target.value)} className="max-w-xs" />
                  <span className="text-xs text-gray-400">{filteredPts.length} из {points.length} точек</span>
                </div>
                <div className="rounded-lg border border-gray-200 overflow-auto" style={{ maxHeight: 200 }}>
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-500 font-semibold sticky top-0">
                      <tr>
                        <th className="px-2 py-1.5">Имя</th><th className="px-2 py-1.5">X</th><th className="px-2 py-1.5">Y</th>
                        <th className="px-2 py-1.5">Z</th><th className="px-2 py-1.5">Код</th><th className="px-2 py-1.5">Группа</th><th className="w-6"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPts.map((p, i) => (
                        <tr key={p.id} className={`border-t border-gray-100 ${i%2===0?"":"bg-gray-50"}`}>
                          <td className="px-2 py-1 font-mono text-blue-700">{p.name}</td>
                          <td className="px-2 py-1 font-mono">{p.x}</td><td className="px-2 py-1 font-mono">{p.y}</td>
                          <td className="px-2 py-1 font-mono font-semibold">{p.z}</td>
                          <td className="px-2 py-1"><span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">{p.code}</span></td>
                          <td className="px-2 py-1 text-gray-400">{p.group}</td>
                          <td><button onClick={() => setPoints(prev => prev.filter(x => x.id !== p.id))} className="text-gray-200 hover:text-red-400"><Icon name="X" size={11} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={() => setStep(3)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                    Далее — редактирование <Icon name="ChevronRight" size={16} />
                  </Button>
                  <Button variant="outline" onClick={doИмпорт} className="gap-2">
                    <Icon name="Upload" size={15} /> Импорт точек (CSV / TXT / LandXML)
                  </Button>
                  <Button variant="outline" onClick={() => setStep(1)}>Назад</Button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Редактирование ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Boundaries */}
                <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2"><Icon name="Pentagon" size={16} className="text-indigo-600" />Границы поверхности</h3>
                  {surf.boundaries.map(b => (
                    <div key={b.id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50">
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{b.name}</div>
                        <div className="text-xs text-gray-400">{b.type} · {b.pts} вершин</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${b.type==="Внешняя"?"bg-blue-100 text-blue-700":b.type==="Внутренняя"?"bg-orange-100 text-orange-700":"bg-red-100 text-red-700"}`}>{b.type}</span>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input placeholder="Название границы" value={addBoundaryForm.name} onChange={e => setAddBoundaryForm(f => ({ ...f, name: e.target.value }))} className="flex-1" />
                    <Select value={addBoundaryForm.type} onValueChange={v => setAddBoundaryForm(f => ({ ...f, type: v as Boundary["type"] }))}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>{BOUNDARY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button onClick={addBoundary} variant="outline"><Icon name="Plus" size={14} /></Button>
                  </div>
                </div>

                {/* Edit tools */}
                <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2"><Icon name="Wrench" size={16} className="text-indigo-600" />Инструменты редактирования</h3>
                  {[
                    { icon: "MoveVertical", label: "Переместить точку", desc: "Изменить отметку Z выбранной точки" },
                    { icon: "GitMerge", label: "Слияние поверхностей", desc: "Объединить две поверхности в одну" },
                    { icon: "Scissors", label: "Принудительные рёбра", desc: "Задать рёбра по линиям откосов" },
                    { icon: "RefreshCw", label: "Перестроить поверхность", desc: "Пересчитать триангуляцию заново" },
                    { icon: "Minimize2", label: "Упростить поверхность", desc: "Удалить избыточные точки (LOD)" },
                  ].map(t => (
                    <button key={t.label} className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left">
                      <Icon name={t.icon} size={16} className="text-indigo-600 flex-shrink-0" fallback="Tool" />
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{t.label}</div>
                        <div className="text-xs text-gray-400">{t.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Canvas with editing */}
              <div className="rounded-xl border border-gray-200 overflow-hidden" style={{ height: 320 }}>
                <SurfaceCanvas surf={surf} points={points} analysisMode="" />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setStep(4)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">Далее — анализ <Icon name="ChevronRight" size={16} /></Button>
                <Button variant="outline" onClick={() => setStep(2)}>Назад</Button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Анализ ── */}
          {step === 4 && (
            <div className="space-y-4">
              {/* Analysis mode selector */}
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Icon name="BarChart3" size={16} className="text-indigo-600" />Режим анализа</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { v: "slopes",     l: "Уклоны",        icon: "TrendingUp",  color: "text-orange-600" },
                    { v: "heights",    l: "Отметки",        icon: "ArrowUpDown", color: "text-blue-600" },
                    { v: "watersheds", l: "Водосборы",      icon: "Droplets",    color: "text-cyan-600" },
                    { v: "contours",   l: "Горизонтали",    icon: "Layers",      color: "text-green-600" },
                  ].map(a => (
                    <button key={a.v} onClick={() => setAnalysisMode(analysisMode === a.v ? "" : a.v)}
                      className={`flex items-center gap-2 p-3 rounded-xl border font-semibold text-sm transition-all ${analysisMode===a.v?"border-indigo-400 bg-indigo-50 text-indigo-700":"border-gray-200 hover:border-gray-300 text-gray-600"}`}>
                      <Icon name={a.icon} size={16} className={analysisMode===a.v?"text-indigo-600":a.color} fallback="BarChart" />
                      {a.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Canvas */}
              <div className="rounded-xl border border-gray-200 overflow-hidden" style={{ height: 300 }}>
                <SurfaceCanvas surf={surf} points={points} analysisMode={analysisMode} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Slope stats */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2"><Icon name="TrendingUp" size={14} className="text-orange-500" />Анализ уклонов</h4>
                  {slopeData.map(s => (
                    <div key={s.name} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: s.color }} />
                      <span className="text-xs font-medium text-gray-700 w-12">{s.name}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(100, s.area/50)}%`, background: s.color }} />
                      </div>
                      <span className="text-xs text-gray-500 w-16 text-right">{s.area.toLocaleString()} м²</span>
                    </div>
                  ))}
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={slopePie} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value">
                          {slopeData.map((s, i) => <Cell key={i} fill={s.color} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => [`${v.toLocaleString()} м²`]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Volume calc */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2"><Icon name="Scale" size={14} className="text-indigo-600" />Объёмы земляных работ</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-24">Поверхность 1:</span>
                      <Select defaultValue="Существующая поверхность">
                        <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{surfaces.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-24">Поверхность 2:</span>
                      <Select defaultValue="Проектная поверхность">
                        <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{surfaces.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={runVolumeCalc} disabled={calcVolume} variant="outline" className="w-full gap-2">
                    {calcVolume ? <><Icon name="Loader" size={14} className="animate-spin" />Расчёт…</> : <><Icon name="Calculator" size={14} />Рассчитать объёмы</>}
                  </Button>
                  {volumeResult && (
                    <div className="space-y-2">
                      {[
                        { label: "Выемка", value: volumeResult.cut, color: "text-blue-700", bg: "bg-blue-50", icon: "ArrowDown" },
                        { label: "Насыпь", value: volumeResult.fill, color: "text-orange-700", bg: "bg-orange-50", icon: "ArrowUp" },
                        { label: "Баланс", value: Math.abs(volumeResult.balance), color: volumeResult.balance > 0 ? "text-blue-700" : "text-green-700", bg: "bg-gray-50", icon: "Scale" },
                      ].map(r => (
                        <div key={r.label} className={`flex items-center justify-between px-3 py-2 rounded-lg ${r.bg}`}>
                          <span className="text-xs font-semibold text-gray-700 flex items-center gap-1"><Icon name={r.icon} size={12} fallback="ArrowRight" />{r.label}</span>
                          <span className={`text-sm font-bold ${r.color}`}>{r.value.toLocaleString()} м³</span>
                        </div>
                      ))}
                      <div className="h-24">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[{ name: "Объёмы", Выемка: volumeResult.cut, Насыпь: volumeResult.fill }]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Bar dataKey="Выемка" fill="#60a5fa" />
                            <Bar dataKey="Насыпь" fill="#fb923c" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Точек", value: points.length, sub: "в поверхности", color: "text-gray-900" },
                  { label: "Мин. отметка", value: `${minZ.toFixed(2)} м`, sub: "низшая точка", color: "text-blue-600" },
                  { label: "Макс. отметка", value: `${maxZ.toFixed(2)} м`, sub: "высшая точка", color: "text-red-600" },
                  { label: "Перепад", value: `${(maxZ-minZ).toFixed(2)} м`, sub: "диапазон высот", color: "text-indigo-600" },
                ].map(c => (
                  <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="text-xs text-muted-foreground mb-1">{c.label}</div>
                    <div className={`text-xl font-extrabold ${c.color}`}>{c.value}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{c.sub}</div>
                  </div>
                ))}
              </div>

              {/* Таблица площадей по диапазонам отметок */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2"><Icon name="ArrowUpDown" size={14} className="text-blue-500" />Ведомость площадей по отметкам</h4>
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-500 font-semibold">
                      <tr>
                        <th className="px-3 py-1.5 text-left w-6"></th>
                        <th className="px-3 py-1.5 text-left">Диапазон отметок</th>
                        <th className="px-3 py-1.5 text-right">Точек</th>
                        <th className="px-3 py-1.5 text-right">Площадь, м²</th>
                        <th className="px-3 py-1.5 text-right">Доля</th>
                      </tr>
                    </thead>
                    <tbody>
                      {elevBands.map((b, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-3 py-1.5"><div className="w-3 h-3 rounded-sm" style={{ background: b.color }} /></td>
                          <td className="px-3 py-1.5 font-mono text-gray-700">{b.label}</td>
                          <td className="px-3 py-1.5 text-right">{b.count}</td>
                          <td className="px-3 py-1.5 text-right font-semibold">{b.area.toLocaleString()}</td>
                          <td className="px-3 py-1.5 text-right text-gray-500">{totalElevArea ? Math.round((b.area / totalElevArea) * 100) : 0}%</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                        <td></td>
                        <td className="px-3 py-1.5">Итого</td>
                        <td className="px-3 py-1.5 text-right">{points.length}</td>
                        <td className="px-3 py-1.5 text-right">{totalElevArea.toLocaleString()}</td>
                        <td className="px-3 py-1.5 text-right">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Композитная поверхность — сравнение двух поверхностей */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2"><Icon name="Layers" size={14} className="text-indigo-600" />Композитная поверхность (сравнение)</h4>
                <p className="text-xs text-gray-500 -mt-1">Разность двух поверхностей: объём выемки/насыпи, максимальные отклонения и линия нулевых работ.</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-24">Существующая:</span>
                    <Select value={String(compSurf1)} onValueChange={v => setCompSurf1(+v)}>
                      <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{surfaces.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-24">Проектная:</span>
                    <Select value={String(compSurf2)} onValueChange={v => setCompSurf2(+v)}>
                      <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{surfaces.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={runCompositeCalc} disabled={calcComp || compSurf1 === compSurf2} variant="outline" className="w-full gap-2">
                  {calcComp ? <><Icon name="Loader" size={14} className="animate-spin" />Построение композита…</> : <><Icon name="GitCompare" size={14} fallback="Layers" />Построить композитную поверхность</>}
                </Button>
                {compSurf1 === compSurf2 && <p className="text-xs text-amber-600">Выберите две разные поверхности для сравнения.</p>}
                {compResult && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { label: "Выемка", value: `${compResult.cut.toLocaleString()} м³`, color: "text-blue-700", bg: "bg-blue-50" },
                      { label: "Насыпь", value: `${compResult.fill.toLocaleString()} м³`, color: "text-orange-700", bg: "bg-orange-50" },
                      { label: "Баланс", value: `${Math.abs(compResult.net).toLocaleString()} м³`, color: compResult.net > 0 ? "text-blue-700" : "text-green-700", bg: "bg-gray-50" },
                      { label: "Макс. насыпь", value: `+${compResult.maxDiff} м`, color: "text-orange-700", bg: "bg-orange-50" },
                      { label: "Макс. выемка", value: `${compResult.minDiff} м`, color: "text-blue-700", bg: "bg-blue-50" },
                      { label: "Линия 0-работ", value: `${compResult.zeroLine} м`, color: "text-green-700", bg: "bg-green-50" },
                    ].map(c => (
                      <div key={c.label} className={`rounded-lg p-2.5 ${c.bg}`}>
                        <div className="text-[10px] text-gray-500 mb-0.5">{c.label}</div>
                        <div className={`text-sm font-bold ${c.color}`}>{c.value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Daylight Feature Line */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Icon name="Spline" size={14} className="text-green-600" fallback="Route" />Daylight — линия выхода на рельеф
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">Tech Preview</span>
                </h4>
                <p className="text-xs text-gray-500 -mt-1">Автоматическое построение линии пересечения проектного откоса с существующим рельефом (выход «на дневную поверхность»).</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <Label className="text-[10px] mb-1 block">Заложение откоса</Label>
                    <Select value={daylightSlope} onValueChange={setDaylightSlope}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{["1:1.5", "1:2", "1:3", "1:4"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[10px] mb-1 block">Начало (ПК)</Label>
                    <Input value={daylightFrom} onChange={e => setDaylightFrom(e.target.value)} className="h-7 text-xs font-mono" />
                  </div>
                  <div>
                    <Label className="text-[10px] mb-1 block">Конец (ПК)</Label>
                    <Input value={daylightTo} onChange={e => setDaylightTo(e.target.value)} className="h-7 text-xs font-mono" />
                  </div>
                </div>
                <Button onClick={runDaylight} disabled={calcDaylight} className="w-full bg-green-600 hover:bg-green-700 text-white gap-2">
                  {calcDaylight ? <><Icon name="Loader" size={14} className="animate-spin" />Построение…</> : <><Icon name="Wand2" size={14} fallback="Sparkles" />Построить Daylight Feature Line</>}
                </Button>
                {daylightResult && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Длина линии", value: `${daylightResult.length} м` },
                        { label: "Вершин", value: String(daylightResult.vertices) },
                        { label: "Ср. заложение", value: daylightSlope },
                      ].map(c => (
                        <div key={c.label} className="rounded-lg bg-green-50 p-2.5">
                          <div className="text-[10px] text-gray-500 mb-0.5">{c.label}</div>
                          <div className="text-sm font-bold text-green-700">{c.value}</div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-800 flex gap-2">
                      <Icon name="Info" size={13} className="flex-shrink-0 mt-0.5" />
                      Линия не сохраняет динамическую связь с родителем: при изменении откоса запустите инструмент заново.
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setStep(5)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">Далее — экспорт <Icon name="ChevronRight" size={16} /></Button>
                <Button variant="outline" onClick={() => setStep(3)}>Назад</Button>
              </div>
            </div>
          )}

          {/* ── STEP 5: Экспорт ── */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2"><Icon name="Download" size={16} className="text-indigo-600" />Экспорт и визуализация</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label>Формат экспорта</Label>
                    <div className="space-y-2">
                      {[
                        { fmt: "LandXML", desc: "Обмен с ГИС-системами", icon: "Globe" },
                        { fmt: "DWG",     desc: "3D-грани и полилинии",   icon: "FileText" },
                        { fmt: "CSV",     desc: "Таблица отметок и уклонов", icon: "Table" },
                        { fmt: "GeoTIFF", desc: "Растр для ГИС",          icon: "Map" },
                        { fmt: "IFC",     desc: "BIM-формат для Revit",    icon: "Layers" },
                        { fmt: "Shapefile",desc: "ESRI Shapefile / QGIS",  icon: "Hexagon" },
                      ].map(f => (
                        <label key={f.fmt} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${exportFormat===f.fmt?"border-indigo-400 bg-indigo-50":"border-gray-200 hover:border-gray-300"}`}>
                          <input type="radio" checked={exportFormat===f.fmt} onChange={() => setExportFormat(f.fmt)} className="accent-indigo-600" />
                          <Icon name={f.icon} size={14} className="text-indigo-600 flex-shrink-0" fallback="File" />
                          <div>
                            <div className="text-sm font-semibold text-gray-800">{f.fmt}</div>
                            <div className="text-xs text-gray-400">{f.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label>Параметры стиля</Label>
                    <div className="space-y-2">
                      {[
                        { label: "Интервал горизонталей", value: surf.style.includes("0.5") ? "0.5 м" : surf.style.includes("5") ? "5 м" : "1 м" },
                        { label: "Шрифт подписей", value: "Arial, 2.5мм" },
                        { label: "Цветовая шкала", value: surf.palette },
                        { label: "Прозрачность", value: "0%" },
                        { label: "Отображение рёбер", value: surf.wireframe ? "Да" : "Нет" },
                      ].map(p => (
                        <div key={p.label} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                          <span className="text-xs text-gray-500">{p.label}</span>
                          <span className="text-xs font-semibold text-gray-800">{p.value}</span>
                        </div>
                      ))}
                    </div>
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2 mt-2" onClick={() => {
                      if (exportFormat === "LandXML") doЭкспортLandXML()
                      else if (exportFormat === "CSV") doЭкспортCSV()
                      else if (exportFormat === "GeoTIFF") doЭкспортCSV()
                      else if (exportFormat === "IFC") doЭкспортLandXML()
                      else if (exportFormat === "DWG") doЭкспортExcel()
                      else doЭкспортCSV()
                    }}>
                      <Icon name="Download" size={16} /> Экспортировать {exportFormat}
                    </Button>
                    <Button variant="outline" className="w-full gap-2" onClick={doЭкспортОтчёт}>
                      <Icon name="Printer" size={16} /> Печать / PDF
                    </Button>
                    <Button variant="outline" className="w-full gap-2" onClick={() => alert("Публикация в облаке: функция доступна в коммерческой версии ЛАПА 3D")}>
                      <Icon name="Share2" size={16} /> Опубликовать в облаке
                    </Button>
                  </div>
                </div>
              </div>

              {/* Final canvas */}
              <div className="rounded-xl border border-gray-200 overflow-hidden" style={{ height: 280 }}>
                <SurfaceCanvas surf={surf} points={points} analysisMode={analysisMode} />
              </div>
              <Button variant="outline" onClick={() => setStep(4)}>Назад</Button>
            </div>
          )}
        </div>
      </div>

      {/* New Surface Dialog */}
      <AnimatePresence>
        {showNewSurf && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNewSurf(false)}>
            <motion.div initial={{ scale: 0.93 }} animate={{ scale: 1 }} exit={{ scale: 0.93 }}
              className="bg-white rounded-2xl shadow-2xl w-[480px] p-6 space-y-4" onClick={e => e.stopPropagation()}>
              <h3 className="font-extrabold text-gray-900 text-lg">Новая поверхность</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Название</Label><Input className="mt-1" value={newSurf.name} onChange={e => setNewSurf(f => ({ ...f, name: e.target.value }))} placeholder="Существующая поверхность" /></div>
                <div className="col-span-2"><Label>Описание</Label><Input className="mt-1" value={newSurf.description} onChange={e => setNewSurf(f => ({ ...f, description: e.target.value }))} /></div>
                <div>
                  <Label>Тип</Label>
                  <Select value={newSurf.type} onValueChange={v => setNewSurf(f => ({ ...f, type: v as Surface["type"] }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{(["TIN","Grid","Растровая"] as Surface["type"][]).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Стиль</Label>
                  <Select value={newSurf.style} onValueChange={v => setNewSurf(f => ({ ...f, style: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{SURF_STYLES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Label>Слой</Label><Input className="mt-1" value={newSurf.layer} onChange={e => setNewSurf(f => ({ ...f, layer: e.target.value }))} /></div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowNewSurf(false)}>Отмена</Button>
                <Button onClick={createSurface} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"><Icon name="Plus" size={16} />Создать</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-6 rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <span className="text-[13px] font-bold text-gray-900">Функции 2022–2027</span>
        </div>
        <VersionFeaturesInline categories={["surface", "survey"]} />
      </div>
    </motion.div>
  )
}