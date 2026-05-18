import { useState, useRef, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface SurfPoint { id: number; x: number; y: number; z: number }

const PALETTE_NORMAL = ["#1a6b1a","#2d8a2d","#4da64d","#80cc50","#b8e060","#e8f060","#f0c830","#e08020","#c05018","#8b3010","#5a1a08"]
const PALETTE_RAINBOW = ["#0000ff","#0060ff","#00c0ff","#00ffcc","#00ff60","#60ff00","#ccff00","#ffcc00","#ff6000","#ff0000","#800000"]

function H(x: number, y: number): number {
  return Math.sin(x * 0.4) * 3 + Math.cos(y * 0.3) * 2.5 + Math.sin(x * 0.15 + y * 0.2) * 1.5 + Math.cos(x * 0.7 - y * 0.5) * 1
}

function drawTIN(ctx: CanvasRenderingContext2D, pts: SurfPoint[], W: number, H2: number, pal: string[], wf: boolean) {
  if (pts.length < 3) return
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y), zs = pts.map(p => p.z)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const minZ = Math.min(...zs), maxZ = Math.max(...zs)
  const sx = (x: number) => ((x - minX) / (maxX - minX + 0.01)) * (W - 40) + 20
  const sy = (y: number) => H2 - ((y - minY) / (maxY - minY + 0.01)) * (H2 - 40) - 20
  const col = (z: number) => {
    const t = Math.max(0, Math.min(1, (z - minZ) / (maxZ - minZ + 0.01)))
    return pal[Math.floor(t * (pal.length - 1))]
  }
  // naive triangulation: connect each point to nearest neighbours
  for (let i = 0; i < pts.length; i++) {
    const dists = pts.map((p, j) => ({ j, d: Math.sqrt((p.x - pts[i].x) ** 2 + (p.y - pts[i].y) ** 2) }))
      .filter(d => d.j !== i).sort((a, b) => a.d - b.d).slice(0, 3)
    dists.forEach(({ j }) => {
      const a = pts[i], b = pts[j]
      if (j > i) {
        ctx.beginPath(); ctx.moveTo(sx(a.x), sy(a.y)); ctx.lineTo(sx(b.x), sy(b.y))
        ctx.strokeStyle = col((a.z + b.z) / 2); ctx.lineWidth = 1.2; ctx.stroke()
      }
    })
  }
  // draw points
  pts.forEach(p => {
    ctx.beginPath(); ctx.arc(sx(p.x), sy(p.y), 5, 0, Math.PI * 2)
    ctx.fillStyle = col(p.z); ctx.fill()
    ctx.strokeStyle = "white"; ctx.lineWidth = 1.2; ctx.stroke()
    ctx.fillStyle = "#333"; ctx.font = "9px sans-serif"
    ctx.fillText(`${p.z.toFixed(1)}`, sx(p.x) + 6, sy(p.y) - 4)
  })
}

function drawGrid(ctx: CanvasRenderingContext2D, W: number, H2: number, pal: string[], wf: boolean, res: number) {
  const SIZE = res
  const cellW = (W - 40) / SIZE, cellH = (H2 - 40) / SIZE
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const x = c / SIZE * 10, y = r / SIZE * 10
      const z = H(x, y)
      const t = Math.max(0, Math.min(1, (z + 4) / 8))
      const ci = Math.floor(t * (pal.length - 1))
      const px = 20 + c * cellW, py = 20 + r * cellH
      ctx.fillStyle = pal[ci]
      ctx.fillRect(px, py, cellW + 0.5, cellH + 0.5)
      if (wf) {
        ctx.strokeStyle = "rgba(0,0,0,0.15)"; ctx.lineWidth = 0.3
        ctx.strokeRect(px, py, cellW, cellH)
      }
    }
  }
}

function drawCorridor(ctx: CanvasRenderingContext2D, W: number, H2: number, pal: string[], width: number) {
  const N = 60
  for (let i = 0; i < N; i++) {
    const t = i / N
    const cx = 20 + t * (W - 40)
    const cy = H2 / 2 + Math.sin(t * Math.PI * 2.2) * H2 * 0.25 + Math.cos(t * Math.PI * 1.1) * H2 * 0.1
    const z = Math.sin(t * Math.PI * 3) * 2
    const t2 = Math.max(0, Math.min(1, (z + 3) / 6))
    const ci = Math.floor(t2 * (pal.length - 1))
    ctx.beginPath(); ctx.arc(cx, cy, width / 2, 0, Math.PI * 2)
    ctx.fillStyle = pal[ci] + "cc"; ctx.fill()
  }
  // centre line
  ctx.beginPath()
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const cx = 20 + t * (W - 40)
    const cy = H2 / 2 + Math.sin(t * Math.PI * 2.2) * H2 * 0.25 + Math.cos(t * Math.PI * 1.1) * H2 * 0.1
    if (i === 0) { ctx.moveTo(cx, cy) } else { ctx.lineTo(cx, cy) }
  }
  ctx.strokeStyle = "#1e3a5f"; ctx.lineWidth = 2.5; ctx.stroke()
  // labels
  ctx.fillStyle = "#333"; ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center"
  ctx.fillText("Трасса коридора", W / 2, 20)
  ctx.textAlign = "left"
}

function drawContours(ctx: CanvasRenderingContext2D, W: number, H2: number) {
  const levels = [-3, -2, -1, 0, 1, 2, 3, 4]
  const colors = ["#1a6b1a","#2d8a2d","#4da64d","#80cc50","#e8f060","#f0c830","#e08020","#c05018"]
  levels.forEach((lev, li) => {
    ctx.beginPath()
    let first = true
    for (let ix = 0; ix <= 80; ix++) {
      const x = ix / 80 * 10
      for (let iy = 0; iy <= 60; iy++) {
        const y = iy / 60 * 10
        const z = H(x, y)
        if (Math.abs(z - lev) < 0.18) {
          const px = 20 + (x / 10) * (W - 40)
          const py = H2 - 20 - (y / 10) * (H2 - 40)
          if (first) { ctx.moveTo(px, py); first = false } else ctx.lineTo(px, py)
        }
      }
    }
    ctx.strokeStyle = colors[li]; ctx.lineWidth = li % 2 === 0 ? 1.5 : 0.8; ctx.stroke()
    // label
    const lx = 25, ly = H2 - 20 - ((lev + 4) / 8) * (H2 - 40)
    if (ly > 15 && ly < H2 - 5) {
      ctx.fillStyle = colors[li]; ctx.font = "9px sans-serif"
      ctx.fillText(`${lev}м`, lx, ly)
    }
  })
}

const INIT_PTS: SurfPoint[] = [
  { id: 1, x: 1, y: 1, z: 120.5 }, { id: 2, x: 4, y: 2, z: 122.1 },
  { id: 3, x: 7, y: 1, z: 119.8 }, { id: 4, x: 2, y: 5, z: 121.3 },
  { id: 5, x: 6, y: 5, z: 123.0 }, { id: 6, x: 4, y: 8, z: 120.8 },
  { id: 7, x: 1, y: 8, z: 118.5 }, { id: 8, x: 8, y: 8, z: 124.2 },
  { id: 9, x: 3, y: 3, z: 121.7 }, { id: 10, x: 6, y: 3, z: 122.5 },
]

export default function SurfacesModule() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [surfType, setSurfType] = useState("tin")
  const [palette, setPalette] = useState("normal")
  const [wireframe, setWireframe] = useState(false)
  const [gridRes, setGridRes] = useState(20)
  const [corrWidth, setCorrWidth] = useState(12)
  const [points, setPoints] = useState<SurfPoint[]>(INIT_PTS)
  const [form, setForm] = useState({ x: "", y: "", z: "" })
  const [clickMode, setClickMode] = useState(false)

  const pal = palette === "rainbow" ? PALETTE_RAINBOW : PALETTE_NORMAL

  const redraw = useCallback(() => {
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext("2d")!
    const W = c.width, H2 = c.height
    ctx.clearRect(0, 0, W, H2)
    ctx.fillStyle = "#f8fafc"; ctx.fillRect(0, 0, W, H2)
    // border
    ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 1; ctx.strokeRect(20, 20, W - 40, H2 - 40)
    if (surfType === "tin") drawTIN(ctx, points, W, H2, pal, wireframe)
    else if (surfType === "grid") drawGrid(ctx, W, H2, pal, wireframe, gridRes)
    else if (surfType === "corridor") drawCorridor(ctx, W, H2, pal, corrWidth)
    else if (surfType === "contours") drawContours(ctx, W, H2)
    // colorbar
    const barW = 14, barH = H2 - 60
    const grad = ctx.createLinearGradient(0, 30, 0, 30 + barH)
    ;[...pal].reverse().forEach((c2, i) => grad.addColorStop(i / (pal.length - 1), c2))
    ctx.fillStyle = grad; ctx.fillRect(W - 18, 30, barW, barH)
    ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 0.5; ctx.strokeRect(W - 18, 30, barW, barH)
    ctx.fillStyle = "#64748b"; ctx.font = "9px sans-serif"
    ctx.fillText("Выс.", W - 17, 27)
  }, [surfType, points, pal, wireframe, gridRes, corrWidth])

  useEffect(() => {
    const c = canvasRef.current; if (!c) return
    const ro = new ResizeObserver(() => { c.width = c.offsetWidth; c.height = c.offsetHeight; redraw() })
    ro.observe(c); c.width = c.offsetWidth; c.height = c.offsetHeight; redraw()
    return () => ro.disconnect()
  }, [redraw])

  useEffect(() => { redraw() }, [redraw])

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!clickMode) return
    const c = canvasRef.current!
    const rect = c.getBoundingClientRect()
    const px = e.clientX - rect.left, py = e.clientY - rect.top
    const W = c.width, H2 = c.height
    const x = +((px - 20) / (W - 40) * 10).toFixed(2)
    const y = +((H2 - 20 - py) / (H2 - 40) * 10).toFixed(2)
    if (x < 0 || y < 0 || x > 10 || y > 10) return
    const z = +(Math.random() * 6 + 118).toFixed(2)
    setPoints(prev => [...prev, { id: Date.now(), x, y, z }])
  }

  const addPoint = () => {
    if (!form.x || !form.y || !form.z) return
    setPoints(prev => [...prev, { id: Date.now(), x: +form.x, y: +form.y, z: +form.z }])
    setForm({ x: "", y: "", z: "" })
  }

  const minZ = Math.min(...points.map(p => p.z))
  const maxZ = Math.max(...points.map(p => p.z))
  const profileData = [...points].sort((a, b) => a.x - b.x).map(p => ({ name: `(${p.x},${p.y})`, z: p.z }))

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Tabs defaultValue="surface">
        <TabsList className="mb-4">
          <TabsTrigger value="surface">Редактор поверхности</TabsTrigger>
          <TabsTrigger value="points">Точки данных</TabsTrigger>
          <TabsTrigger value="stats">Анализ поверхности</TabsTrigger>
        </TabsList>

        <TabsContent value="surface" className="space-y-4">
          {/* toolbar */}
          <div className="flex flex-wrap gap-3 items-center">
            <div>
              <Label className="text-xs mb-1 block">Тип поверхности</Label>
              <div className="flex gap-1.5">
                {[
                  { v: "tin", l: "TIN" }, { v: "grid", l: "Grid" },
                  { v: "corridor", l: "Corridor" }, { v: "contours", l: "Горизонтали" },
                ].map(t => (
                  <button key={t.v} onClick={() => setSurfType(t.v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${surfType === t.v ? "bg-indigo-600 text-white shadow" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {t.l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Палитра</Label>
              <Select value={palette} onValueChange={setPalette}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Terrain</SelectItem>
                  <SelectItem value="rainbow">Rainbow</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {surfType === "grid" && (
              <div>
                <Label className="text-xs mb-1 block">Разрешение сетки</Label>
                <input type="range" min="8" max="60" step="4" value={gridRes}
                  onChange={e => setGridRes(+e.target.value)} className="w-28 accent-indigo-600" />
                <span className="text-xs text-gray-500 ml-1">{gridRes}×{gridRes}</span>
              </div>
            )}
            {surfType === "corridor" && (
              <div>
                <Label className="text-xs mb-1 block">Ширина коридора (м)</Label>
                <input type="range" min="4" max="30" step="2" value={corrWidth}
                  onChange={e => setCorrWidth(+e.target.value)} className="w-28 accent-indigo-600" />
                <span className="text-xs text-gray-500 ml-1">{corrWidth} м</span>
              </div>
            )}
            <div className="flex items-center gap-2 mt-4">
              <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                <input type="checkbox" checked={wireframe} onChange={e => setWireframe(e.target.checked)} className="accent-indigo-600" />
                Каркас
              </label>
              {surfType === "tin" && (
                <button onClick={() => setClickMode(m => !m)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${clickMode ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                  <Icon name={clickMode ? "MousePointer2" : "Plus"} size={12} />
                  {clickMode ? "Режим добавления" : "Добавить кликом"}
                </button>
              )}
            </div>
          </div>

          {/* canvas */}
          <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50" style={{ height: 420 }}>
            <canvas ref={canvasRef} className="w-full h-full block"
              style={{ cursor: clickMode ? "crosshair" : "default" }}
              onClick={onCanvasClick} />
          </div>
          {clickMode && <p className="text-xs text-green-600 font-medium">🖱 Кликайте по полю для добавления точек. Z присваивается автоматически.</p>}
        </TabsContent>

        <TabsContent value="points" className="space-y-4">
          <div className="grid grid-cols-3 gap-3 max-w-sm">
            <div><Label>X</Label><Input type="number" step="0.1" placeholder="5.0" value={form.x} onChange={e => setForm(f => ({ ...f, x: e.target.value }))} /></div>
            <div><Label>Y</Label><Input type="number" step="0.1" placeholder="5.0" value={form.y} onChange={e => setForm(f => ({ ...f, y: e.target.value }))} /></div>
            <div><Label>Z (отм. м)</Label><Input type="number" step="0.01" placeholder="120.0" value={form.z} onChange={e => setForm(f => ({ ...f, z: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={addPoint} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Icon name="Plus" size={16} /> Добавить точку
            </Button>
            <Button variant="outline" onClick={() => setPoints(INIT_PTS)}>Сбросить</Button>
          </div>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 font-semibold">
                <tr>
                  <th className="px-4 py-2 text-center">#</th>
                  <th className="px-4 py-2 text-right">X</th>
                  <th className="px-4 py-2 text-right">Y</th>
                  <th className="px-4 py-2 text-right">Z (м)</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {points.map((p, i) => (
                  <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 text-center text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-2 text-right font-mono">{p.x}</td>
                    <td className="px-4 py-2 text-right font-mono">{p.y}</td>
                    <td className="px-4 py-2 text-right font-mono font-semibold">{p.z}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => setPoints(prev => prev.filter(x => x.id !== p.id))} className="text-gray-200 hover:text-red-500"><Icon name="X" size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Точек", value: points.length, sub: "в модели" },
              { label: "Мин. отметка", value: `${minZ} м`, sub: "низшая точка", color: "text-blue-600" },
              { label: "Макс. отметка", value: `${maxZ} м`, sub: "высшая точка", color: "text-red-600" },
              { label: "Перепад", value: `${(maxZ - minZ).toFixed(2)} м`, sub: "диапазон высот", color: "text-indigo-600" },
            ].map(c => (
              <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="text-xs text-muted-foreground mb-1">{c.label}</div>
                <div className={`text-2xl font-extrabold ${c.color || "text-gray-900"}`}>{c.value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{c.sub}</div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Высотный профиль точек</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={profileData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={40} />
                <YAxis domain={[minZ - 1, maxZ + 1]} unit=" м" tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [`${v} м`, "Отметка"]} />
                <Line type="monotone" dataKey="z" stroke="#6366f1" strokeWidth={2} dot={{ r: 4, fill: "#6366f1" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}