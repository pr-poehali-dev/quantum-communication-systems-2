import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import VersionFeaturesPanel from "@/modules/VersionFeaturesPanel"

interface AreaObject {
  id: number
  type: string
  name: string
  width: number
  length: number
  x: number
  y: number
  color: string
}

const OBJECT_TYPES = [
  { value: "building", label: "Здание", color: "#6366f1" },
  { value: "parking", label: "Парковка", color: "#f59e0b" },
  { value: "road", label: "Проезд", color: "#374151" },
  { value: "green", label: "Озеленение", color: "#10b981" },
  { value: "platform", label: "Площадка", color: "#3b82f6" },
  { value: "warehouse", label: "Склад", color: "#8b5cf6" },
]

function calcParkingSpots(area: number): number {
  return Math.floor(area / 25)
}

function calcBuildingArea(w: number, l: number, floors: number): { footprint: number; total: number } {
  return { footprint: w * l, total: w * l * floors }
}

export default function AreasModule() {
  const [objects, setObjects] = useState<AreaObject[]>([
    { id: 1, type: "building", name: "Корпус А", width: 40, length: 20, x: 60, y: 40, color: "#6366f1" },
    { id: 2, type: "parking", name: "Парковка 1", width: 50, length: 15, x: 60, y: 130, color: "#f59e0b" },
    { id: 3, type: "green", name: "Газон", width: 30, length: 20, x: 180, y: 40, color: "#10b981" },
    { id: 4, type: "road", name: "Главный проезд", width: 80, length: 8, x: 60, y: 100, color: "#374151" },
  ])
  const [form, setForm] = useState({ type: "building", name: "", width: "", length: "" })
  const [selected, setSelected] = useState<number | null>(null)
  const [floors, setFloors] = useState(3)
  const [plotArea, setPlotArea] = useState(10000)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef<{ id: number; ox: number; oy: number } | null>(null)
  const [tepItems] = useState([
    { name: "Площадь участка",        unit: "га",  value: "2.45",  norm: "—",    ok: true },
    { name: "Площадь застройки",      unit: "м²",  value: "3840",  norm: "≤30%", ok: true },
    { name: "Площадь озеленения",     unit: "м²",  value: "7200",  norm: "≥15%", ok: true },
    { name: "Твёрдые покрытия",       unit: "м²",  value: "8400",  norm: "—",    ok: true },
    { name: "Коэффициент застройки",  unit: "%",   value: "15.7",  norm: "≤40%", ok: true },
    { name: "Коэффициент озеленения", unit: "%",   value: "29.4",  norm: "≥15%", ok: true },
    { name: "Машиномест",             unit: "шт",  value: "142",   norm: "≥0.8/кв", ok: true },
    { name: "Этажность",              unit: "эт.", value: "4",     norm: "≤5",   ok: true },
  ])
  const [isoAngle, setIsoAngle] = useState(30)

  const addObject = () => {
    if (!form.name || !form.width || !form.length) return
    const t = OBJECT_TYPES.find(o => o.value === form.type)!
    setObjects(prev => [...prev, {
      id: Date.now(), type: form.type, name: form.name,
      width: +form.width, length: +form.length,
      x: 20 + (prev.length * 15) % 200,
      y: 20 + (prev.length * 10) % 150,
      color: t.color,
    }])
    setForm(f => ({ ...f, name: "", width: "", length: "" }))
  }

  const removeObject = (id: number) => { setObjects(p => p.filter(o => o.id !== id)); if (selected === id) setSelected(null) }

  const SVG_W = 560, SVG_H = 320, SCALE = 1.8

  const onMouseDown = (e: React.MouseEvent, id: number) => {
    e.preventDefault()
    const svg = svgRef.current!
    const pt = svg.createSVGPoint()
    pt.x = e.clientX; pt.y = e.clientY
    const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse())
    const obj = objects.find(o => o.id === id)!
    dragging.current = { id, ox: svgPt.x - obj.x, oy: svgPt.y - obj.y }
    setSelected(id)
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return
    const svg = svgRef.current!
    const pt = svg.createSVGPoint()
    pt.x = e.clientX; pt.y = e.clientY
    const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse())
    const { id, ox, oy } = dragging.current
    setObjects(prev => prev.map(o => o.id === id ? { ...o, x: Math.max(0, svgPt.x - ox), y: Math.max(0, svgPt.y - oy) } : o))
  }

  const onMouseUp = () => { dragging.current = null }

  const totalBuilding = objects.filter(o => o.type === "building").reduce((s, o) => s + o.width * o.length * SCALE ** 2, 0)
  const totalParking = objects.filter(o => o.type === "parking").reduce((s, o) => s + o.width * o.length * SCALE ** 2, 0)
  const totalGreen = objects.filter(o => o.type === "green").reduce((s, o) => s + o.width * o.length * SCALE ** 2, 0)
  const builtUp = objects.reduce((s, o) => s + o.width * o.length * SCALE ** 2, 0)
  const bai = parseFloat(((builtUp / plotArea) * 100).toFixed(1))
  const sel = objects.find(o => o.id === selected)

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Tabs defaultValue="plan">
        <TabsList className="mb-4">
          <TabsTrigger value="plan">Генеральный план</TabsTrigger>
          <TabsTrigger value="objects">Объекты</TabsTrigger>
          <TabsTrigger value="teo">ТЭП участка</TabsTrigger>
          <TabsTrigger value="tep">ТЭП по СП 42</TabsTrigger>
          <TabsTrigger value="3d">3D-вид</TabsTrigger>
        </TabsList>

        <TabsContent value="plan">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Canvas */}
            <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
                <span className="text-xs font-semibold text-gray-600">Генплан (перетаскивайте объекты)</span>
                <span className="text-xs text-gray-400">масштаб 1:100</span>
              </div>
              <svg
                ref={svgRef}
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                className="w-full cursor-default select-none"
                style={{ background: "#f8fafc" }}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
              >
                {/* Grid */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2={SVG_H} stroke="#e2e8f0" strokeWidth="0.5" />
                ))}
                {Array.from({ length: 7 }).map((_, i) => (
                  <line key={`h${i}`} x1="0" y1={i * 50} x2={SVG_W} y2={i * 50} stroke="#e2e8f0" strokeWidth="0.5" />
                ))}
                {/* Site boundary */}
                <rect x="5" y="5" width={SVG_W - 10} height={SVG_H - 10} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="8 4" rx="4" />

                {objects.map(obj => (
                  <g key={obj.id} onMouseDown={e => onMouseDown(e, obj.id)} style={{ cursor: "grab" }}>
                    <rect
                      x={obj.x} y={obj.y}
                      width={obj.width} height={obj.length}
                      fill={obj.color}
                      fillOpacity={selected === obj.id ? 0.85 : 0.55}
                      stroke={obj.color}
                      strokeWidth={selected === obj.id ? 2 : 1}
                      rx="3"
                    />
                    <text x={obj.x + obj.width / 2} y={obj.y + obj.length / 2 + 4} textAnchor="middle" fontSize="9" fill="white" fontWeight="600">
                      {obj.name}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {/* Right panel */}
            <div className="space-y-3">
              {sel ? (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 space-y-2">
                  <div className="font-bold text-indigo-800 text-sm">{sel.name}</div>
                  <div className="text-xs space-y-1 text-indigo-700">
                    <div>Тип: {OBJECT_TYPES.find(o => o.value === sel.type)?.label}</div>
                    <div>Размер: {sel.width} × {sel.length} м</div>
                    <div>Площадь: {(sel.width * sel.length * SCALE ** 2).toFixed(0)} м²</div>
                    {sel.type === "parking" && <div>Машиномест: ~{calcParkingSpots(sel.width * sel.length * SCALE ** 2)}</div>}
                    {sel.type === "building" && <div>Общая площадь: {calcBuildingArea(sel.width * SCALE, sel.length * SCALE, floors).total.toFixed(0)} м² ({floors} эт.)</div>}
                  </div>
                  <button onClick={() => removeObject(sel.id)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mt-1">
                    <Icon name="Trash2" size={12} /> Удалить
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xs text-muted-foreground text-center py-4">Кликните на объект для просмотра свойств</p>
                </div>
              )}

              <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2 text-xs">
                <div className="font-semibold text-gray-700 mb-2">Легенда</div>
                {OBJECT_TYPES.map(t => (
                  <div key={t.value} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ background: t.color, opacity: 0.7 }} />
                    <span className="text-gray-600">{t.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="objects" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label>Тип объекта</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{OBJECT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Название</Label><Input placeholder="Корпус Б" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Ширина (м)</Label><Input type="number" placeholder="30" value={form.width} onChange={e => setForm(f => ({ ...f, width: e.target.value }))} /></div>
            <div><Label>Длина (м)</Label><Input type="number" placeholder="20" value={form.length} onChange={e => setForm(f => ({ ...f, length: e.target.value }))} /></div>
          </div>
          <Button onClick={addObject} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            <Icon name="Plus" size={16} /> Добавить объект
          </Button>

          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 font-semibold">
                <tr>
                  <th className="px-4 py-2 text-left">Объект</th>
                  <th className="px-4 py-2 text-left">Тип</th>
                  <th className="px-4 py-2 text-right">Размер (м)</th>
                  <th className="px-4 py-2 text-right">Площадь (м²)</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {objects.map(o => (
                  <tr key={o.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 font-semibold" style={{ color: o.color }}>{o.name}</td>
                    <td className="px-4 py-2 text-gray-600">{OBJECT_TYPES.find(t => t.value === o.type)?.label}</td>
                    <td className="px-4 py-2 text-right font-mono">{o.width} × {o.length}</td>
                    <td className="px-4 py-2 text-right font-mono">{(o.width * o.length * SCALE ** 2).toFixed(0)}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => removeObject(o.id)} className="text-gray-300 hover:text-red-500"><Icon name="X" size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="teo" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <div><Label>Площадь участка (м²)</Label><Input type="number" value={plotArea} onChange={e => setPlotArea(+e.target.value)} /></div>
            <div><Label>Этажность зданий</Label><Input type="number" min="1" max="50" value={floors} onChange={e => setFloors(+e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: "Площадь участка", value: `${plotArea.toLocaleString()} м²`, sub: "" },
              { label: "Площадь застройки", value: `${builtUp.toFixed(0)} м²`, sub: `КЗ = ${bai}%`, color: bai > 60 ? "text-red-600" : "text-gray-900" },
              { label: "Общая пл. зданий", value: `${totalBuilding.toFixed(0)} м²`, sub: `${floors} этажей` },
              { label: "Паркинг", value: `${totalParking.toFixed(0)} м²`, sub: `~${calcParkingSpots(totalParking)} м/мест` },
              { label: "Озеленение", value: `${totalGreen.toFixed(0)} м²`, sub: `${((totalGreen / plotArea) * 100).toFixed(1)}% участка` },
              { label: "Незастроенная часть", value: `${Math.max(0, plotArea - builtUp).toFixed(0)} м²`, sub: `${Math.max(0, 100 - bai).toFixed(1)}%` },
            ].map(c => (
              <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="text-xs text-muted-foreground mb-1">{c.label}</div>
                <div className={`text-2xl font-extrabold ${c.color || "text-gray-900"}`}>{c.value}</div>
                {c.sub && <div className="text-xs text-gray-400 mt-1">{c.sub}</div>}
              </div>
            ))}
          </div>
          <div className={`rounded-xl p-4 text-sm font-medium ${bai > 60 ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
            <Icon name={bai > 60 ? "AlertTriangle" : "CheckCircle"} size={16} className="inline mr-2" />
            Коэффициент застройки {bai}% — {bai > 60 ? "превышает норму (СП 42.13330 — макс. 60%)" : "соответствует норме СП 42.13330"}
          </div>
        </TabsContent>

        {/* TEP */}
        <TabsContent value="tep" className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Icon name="BarChart3" size={16} className="text-indigo-600" fallback="BarChart" />
                Технико-экономические показатели (СП 42.13330)
              </h3>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2 text-xs">
                  <Icon name="Download" size={14} />Excel
                </Button>
                <Button variant="outline" className="gap-2 text-xs">
                  <Icon name="FileText" size={14} />PDF
                </Button>
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-500">
                  <tr>
                    <th className="px-4 py-2 text-left">Показатель</th>
                    <th className="px-4 py-2 text-center">Ед.изм</th>
                    <th className="px-4 py-2 text-right">Значение</th>
                    <th className="px-4 py-2 text-center">Норма СП 42</th>
                    <th className="px-4 py-2 text-center">Соответствие</th>
                  </tr>
                </thead>
                <tbody>
                  {tepItems.map((row, i) => (
                    <tr key={row.name} className={`border-t border-gray-100 ${i % 2 === 0 ? "" : "bg-gray-50"}`}>
                      <td className="px-4 py-2 font-medium text-gray-800">{row.name}</td>
                      <td className="px-4 py-2 text-center text-gray-500">{row.unit}</td>
                      <td className="px-4 py-2 text-right font-mono font-semibold text-gray-900">{row.value}</td>
                      <td className="px-4 py-2 text-center text-xs text-gray-400">{row.norm}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${row.ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {row.ok ? "✓ Соответствует" : "✗ Нарушение"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={`flex items-center gap-3 p-3 rounded-xl ${tepItems.every(r => r.ok) ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
              <Icon
                name={tepItems.every(r => r.ok) ? "CheckCircle" : "AlertTriangle"}
                size={18}
                className={tepItems.every(r => r.ok) ? "text-green-600" : "text-amber-600"}
              />
              <span className="text-sm font-semibold text-gray-800">
                {tepItems.filter(r => r.ok).length} из {tepItems.length} показателей соответствуют нормам СП 42.13330
              </span>
            </div>
          </div>
        </TabsContent>

        {/* 3D VIEW */}
        <TabsContent value="3d" className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Icon name="Box" size={16} className="text-indigo-600" />Изометрический 3D-вид участка
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Угол: {isoAngle}°</span>
                <button onClick={() => setIsoAngle(a => Math.max(10, a - 10))}
                  className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs hover:bg-gray-50">
                  ↺ Влево
                </button>
                <button onClick={() => setIsoAngle(a => Math.min(60, a + 10))}
                  className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs hover:bg-gray-50">
                  Вправо ↻
                </button>
              </div>
            </div>

            {/* Isometric SVG */}
            <svg viewBox="0 0 500 320" className="w-full rounded-xl bg-slate-50 border border-gray-200">
              {/* Ground plane */}
              <polygon
                points="250,260 450,180 250,100 50,180"
                fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1"
              />
              {/* Grid lines on ground */}
              {[0.25, 0.5, 0.75].map(t => (
                <g key={t}>
                  <line
                    x1={50 + t * 200} y1={180 - t * 80 + (1 - t) * 80}
                    x2={50 + t * 200 + 200} y2={180 + t * 80 - (1 - t) * 80 + 80 - 80}
                    stroke="#cbd5e1" strokeWidth="0.5"
                  />
                </g>
              ))}

              {/* Buildings (isometric boxes) */}
              {objects.filter(o => o.type === "building").slice(0, 3).map((obj, i) => {
                const bx = 120 + i * 90
                const by = 200 - i * 20
                const bw = 60
                const bh = 30 + floors * 8
                const bd = 30
                const cos30 = Math.cos(isoAngle * Math.PI / 180)
                const sin30 = Math.sin(isoAngle * Math.PI / 180)
                return (
                  <g key={obj.id}>
                    {/* Front face */}
                    <polygon
                      points={`${bx},${by} ${bx + bw},${by} ${bx + bw},${by - bh} ${bx},${by - bh}`}
                      fill={obj.color} fillOpacity={0.7} stroke={obj.color} strokeWidth="1"
                    />
                    {/* Top face */}
                    <polygon
                      points={`${bx},${by - bh} ${bx + bw},${by - bh} ${bx + bw + bd * cos30},${by - bh - bd * sin30} ${bx + bd * cos30},${by - bh - bd * sin30}`}
                      fill={obj.color} fillOpacity={0.9} stroke={obj.color} strokeWidth="1"
                    />
                    {/* Side face */}
                    <polygon
                      points={`${bx + bw},${by} ${bx + bw + bd * cos30},${by - bd * sin30} ${bx + bw + bd * cos30},${by - bh - bd * sin30} ${bx + bw},${by - bh}`}
                      fill={obj.color} fillOpacity={0.5} stroke={obj.color} strokeWidth="1"
                    />
                    <text x={bx + bw / 2} y={by + 12} textAnchor="middle" fontSize="8" fill="#374151">{obj.name}</text>
                  </g>
                )
              })}

              {/* Green areas (flat) */}
              {objects.filter(o => o.type === "green").slice(0, 2).map((obj, i) => (
                <ellipse key={obj.id}
                  cx={80 + i * 160} cy={230 - i * 20}
                  rx={obj.width * 0.4} ry={obj.width * 0.2}
                  fill="#10b981" fillOpacity={0.5} stroke="#10b981" strokeWidth="1"
                />
              ))}

              {/* Road */}
              <polygon points="50,200 450,200 440,215 60,215" fill="#374151" fillOpacity={0.3} />
              <line x1="250" y1="200" x2="250" y2="215" stroke="white" strokeWidth="1" strokeDasharray="4 4" />

              {/* Labels */}
              <text x="250" y="295" textAnchor="middle" fontSize="10" fill="#64748b">
                Изометрический вид (угол {isoAngle}°) · {objects.length} объектов
              </text>
            </svg>

            {/* Visibility toggles */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-gray-600">Видимость объектов</div>
              <div className="flex flex-wrap gap-2">
                {objects.map(obj => (
                  <div key={obj.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-medium text-gray-700">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: obj.color }} />
                    {obj.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <VersionFeaturesPanel dir="infra" />
    </motion.div>
  )
}