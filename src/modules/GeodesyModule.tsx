import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Icon from "@/components/ui/icon"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from "recharts"

interface Point {
  id: number
  x: number
  y: number
  z: number
  name: string
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
      </Tabs>
    </motion.div>
  )
}
