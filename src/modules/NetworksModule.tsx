import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface Pipe {
  id: number
  from: string
  to: string
  length: number
  diameter: number
  material: string
  flow: number
  slope: number
}

const MATERIALS = ["ПВХ", "Сталь", "Чугун", "Железобетон", "HDPE"]

function calcVelocity(flow: number, diameter: number): number {
  const area = Math.PI * (diameter / 1000 / 2) ** 2
  return parseFloat((flow / 1000 / area).toFixed(2))
}

function calcHeadLoss(pipe: Pipe): number {
  const v = calcVelocity(pipe.flow, pipe.diameter)
  const roughness = pipe.material === "Сталь" ? 0.046 : pipe.material === "Чугун" ? 0.26 : 0.007
  const re = (v * pipe.diameter / 1000) / 1e-6
  if (re < 1) return 0
  const f = roughness > 0 ? 0.25 / Math.log10(roughness / (3.7 * pipe.diameter / 1000) + 5.74 / re ** 0.9) ** 2 : 0.02
  return parseFloat((f * pipe.length / (pipe.diameter / 1000) * v ** 2 / (2 * 9.81)).toFixed(2))
}

export default function NetworksModule() {
  const [networkType, setNetworkType] = useState("water")
  const [pipes, setPipes] = useState<Pipe[]>([
    { id: 1, from: "У-1", to: "У-2", length: 120, diameter: 200, material: "ПВХ", flow: 15, slope: 0.003 },
    { id: 2, from: "У-2", to: "У-3", length: 85, diameter: 160, material: "ПВХ", flow: 10, slope: 0.004 },
    { id: 3, from: "У-3", to: "У-4", length: 200, diameter: 250, material: "Сталь", flow: 25, slope: 0.002 },
  ])
  const [form, setForm] = useState({ from: "", to: "", length: "", diameter: "", material: "ПВХ", flow: "", slope: "" })

  const addPipe = () => {
    if (!form.from || !form.to || !form.length || !form.diameter) return
    setPipes(prev => [...prev, { id: Date.now(), from: form.from, to: form.to, length: +form.length, diameter: +form.diameter, material: form.material, flow: +form.flow || 10, slope: +form.slope || 0.003 }])
    setForm({ from: "", to: "", length: "", diameter: "", material: "ПВХ", flow: "", slope: "" })
  }

  const removePipe = (id: number) => setPipes(p => p.filter(x => x.id !== id))

  const totalLength = pipes.reduce((s, p) => s + p.length, 0)
  const maxVelocity = Math.max(...pipes.map(p => calcVelocity(p.flow, p.diameter)))
  const totalHeadLoss = pipes.reduce((s, p) => s + calcHeadLoss(p), 0)

  const chartData = pipes.map(p => ({
    name: `${p.from}→${p.to}`,
    velocity: calcVelocity(p.flow, p.diameter),
    headLoss: calcHeadLoss(p),
  }))

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex gap-3 flex-wrap">
        {[
          { value: "water", label: "Водопровод", icon: "Droplets" },
          { value: "sewer", label: "Канализация", icon: "ArrowDownToLine" },
          { value: "heat", label: "Теплосеть", icon: "Flame" },
          { value: "power", label: "Электросети", icon: "Zap" },
        ].map(t => (
          <button
            key={t.value}
            onClick={() => setNetworkType(t.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${networkType === t.value ? "bg-indigo-600 text-white shadow" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            <Icon name={t.icon} size={15} fallback="Circle" />
            {t.label}
          </button>
        ))}
      </div>

      <Tabs defaultValue="pipes">
        <TabsList className="mb-4">
          <TabsTrigger value="pipes">Трубопроводы</TabsTrigger>
          <TabsTrigger value="hydraulics">Гидравлика</TabsTrigger>
          <TabsTrigger value="schema">Схема сети</TabsTrigger>
        </TabsList>

        {/* PIPES */}
        <TabsContent value="pipes" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><Label>От узла</Label><Input placeholder="У-1" value={form.from} onChange={e => setForm(f => ({ ...f, from: e.target.value }))} /></div>
            <div><Label>До узла</Label><Input placeholder="У-2" value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))} /></div>
            <div><Label>Длина (м)</Label><Input type="number" placeholder="100" value={form.length} onChange={e => setForm(f => ({ ...f, length: e.target.value }))} /></div>
            <div><Label>Диаметр (мм)</Label><Input type="number" placeholder="200" value={form.diameter} onChange={e => setForm(f => ({ ...f, diameter: e.target.value }))} /></div>
            <div>
              <Label>Материал</Label>
              <Select value={form.material} onValueChange={v => setForm(f => ({ ...f, material: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MATERIALS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Расход (л/с)</Label><Input type="number" step="0.1" placeholder="10" value={form.flow} onChange={e => setForm(f => ({ ...f, flow: e.target.value }))} /></div>
            <div><Label>Уклон (i)</Label><Input type="number" step="0.001" placeholder="0.003" value={form.slope} onChange={e => setForm(f => ({ ...f, slope: e.target.value }))} /></div>
          </div>
          <Button onClick={addPipe} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            <Icon name="Plus" size={16} /> Добавить участок
          </Button>

          <div className="rounded-xl border border-gray-200 overflow-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50 text-gray-500 font-semibold">
                <tr>
                  <th className="px-4 py-2 text-left">Участок</th>
                  <th className="px-4 py-2 text-right">L (м)</th>
                  <th className="px-4 py-2 text-right">D (мм)</th>
                  <th className="px-4 py-2 text-left">Материал</th>
                  <th className="px-4 py-2 text-right">Q (л/с)</th>
                  <th className="px-4 py-2 text-right">v (м/с)</th>
                  <th className="px-4 py-2 text-right">Уклон</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {pipes.map(p => {
                  const v = calcVelocity(p.flow, p.diameter)
                  const vOk = v >= 0.7 && v <= 3.0
                  return (
                    <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2 font-semibold text-indigo-700">{p.from} → {p.to}</td>
                      <td className="px-4 py-2 text-right">{p.length}</td>
                      <td className="px-4 py-2 text-right">{p.diameter}</td>
                      <td className="px-4 py-2">{p.material}</td>
                      <td className="px-4 py-2 text-right">{p.flow}</td>
                      <td className="px-4 py-2 text-right">
                        <span className={`font-mono text-xs px-2 py-0.5 rounded-full ${vOk ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{v} м/с</span>
                      </td>
                      <td className="px-4 py-2 text-right font-mono">{p.slope}</td>
                      <td className="px-4 py-2 text-right"><button onClick={() => removePipe(p.id)} className="text-gray-300 hover:text-red-500"><Icon name="X" size={14} /></button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">Норма скорости: 0.7–3.0 м/с (СП 31.13330 / СП 32.13330)</p>
        </TabsContent>

        {/* HYDRAULICS */}
        <TabsContent value="hydraulics" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Суммарная длина сети", value: `${totalLength} м`, sub: `${pipes.length} участков`, color: "text-gray-900" },
              { label: "Макс. скорость", value: `${maxVelocity} м/с`, sub: maxVelocity > 3 ? "⚠ Превышение нормы!" : "В норме", color: maxVelocity > 3 ? "text-red-600" : "text-green-600" },
              { label: "Суммарные потери напора", value: `${totalHeadLoss.toFixed(2)} м`, sub: "по Дарси-Вейсбаху", color: "text-indigo-600" },
            ].map(c => (
              <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="text-xs text-muted-foreground mb-1">{c.label}</div>
                <div className={`text-3xl font-extrabold ${c.color}`}>{c.value}</div>
                <div className="text-xs text-gray-400 mt-1">{c.sub}</div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Скорости и потери напора по участкам</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="velocity" name="Скорость (м/с)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="headLoss" name="Потери напора (м)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        {/* SCHEMA */}
        <TabsContent value="schema">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Принципиальная схема сети</h3>
            <svg viewBox="0 0 600 300" className="w-full max-w-2xl mx-auto">
              {pipes.map((p, i) => {
                const x1 = 80 + i * 140, y1 = 80 + (i % 2) * 80
                const x2 = x1 + 100, y2 = y1 + (i % 3 === 1 ? 80 : 0)
                const v = calcVelocity(p.flow, p.diameter)
                const color = v > 3 ? "#ef4444" : v < 0.7 ? "#f59e0b" : "#6366f1"
                return (
                  <g key={p.id}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={Math.max(2, p.diameter / 60)} />
                    <circle cx={x1} cy={y1} r="8" fill="white" stroke={color} strokeWidth="2" />
                    <circle cx={x2} cy={y2} r="8" fill="white" stroke={color} strokeWidth="2" />
                    <text x={x1} y={y1 + 22} textAnchor="middle" fontSize="9" fill="#374151">{p.from}</text>
                    <text x={x2} y={y2 + 22} textAnchor="middle" fontSize="9" fill="#374151">{p.to}</text>
                    <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 8} textAnchor="middle" fontSize="9" fill={color}>Ø{p.diameter}</text>
                    <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 + 4} textAnchor="middle" fontSize="8" fill="#6b7280">{v} м/с</text>
                  </g>
                )
              })}
              <g transform="translate(20,250)">
                {[["#6366f1", "Норма (0.7–3 м/с)"], ["#ef4444", "Превышение скорости"], ["#f59e0b", "Низкая скорость"]].map(([c, l], i) => (
                  <g key={l} transform={`translate(${i * 180},0)`}>
                    <line x1="0" y1="6" x2="16" y2="6" stroke={c} strokeWidth="2" />
                    <text x="20" y="10" fontSize="9" fill="#6b7280">{l}</text>
                  </g>
                ))}
              </g>
            </svg>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
