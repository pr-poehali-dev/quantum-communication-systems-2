import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Icon from "@/components/ui/icon"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"

interface EarthSection {
  id: number
  name: string
  area: number
  h1: number
  h2: number
}

function calcSectionVolume(s: EarthSection): { cut: number; fill: number } {
  const avgH = (s.h1 + s.h2) / 2
  if (avgH > 0) return { cut: parseFloat((s.area * avgH).toFixed(1)), fill: 0 }
  return { cut: 0, fill: parseFloat((s.area * Math.abs(avgH)).toFixed(1)) }
}

function calcSlopeStability(angle: number, cohesion: number, gamma: number, height: number): number {
  const phi = angle * Math.PI / 180
  const Nc = (Math.exp(Math.PI * Math.tan(phi)) * Math.tan(Math.PI / 4 + phi / 2) ** 2 - 1) / Math.tan(phi)
  const fs = (cohesion * Nc + gamma * height * Math.tan(phi)) / (gamma * height)
  return parseFloat(Math.min(fs, 5).toFixed(2))
}

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"]

export default function AnalysisModule() {
  const [sections, setSections] = useState<EarthSection[]>([
    { id: 1, name: "ПК0+00", area: 24.5, h1: 1.2, h2: 0.8 },
    { id: 2, name: "ПК0+20", area: 18.3, h1: -0.5, h2: 1.1 },
    { id: 3, name: "ПК0+40", area: 32.1, h1: 2.1, h2: 1.8 },
    { id: 4, name: "ПК0+60", area: 15.0, h1: -1.2, h2: -0.9 },
  ])
  const [secForm, setSecForm] = useState({ name: "", area: "", h1: "", h2: "" })

  const [slopeAngle, setSlopeAngle] = useState(30)
  const [cohesion, setCohesion] = useState(15)
  const [gamma, setGamma] = useState(18)
  const [height, setHeight] = useState(5)

  const addSection = () => {
    if (!secForm.name || !secForm.area) return
    setSections(prev => [...prev, { id: Date.now(), name: secForm.name, area: +secForm.area, h1: +secForm.h1 || 0, h2: +secForm.h2 || 0 }])
    setSecForm({ name: "", area: "", h1: "", h2: "" })
  }

  const totalCut = sections.reduce((s, sec) => s + calcSectionVolume(sec).cut, 0)
  const totalFill = sections.reduce((s, sec) => s + calcSectionVolume(sec).fill, 0)
  const balance = totalCut - totalFill

  const fs = calcSlopeStability(slopeAngle, cohesion, gamma, height)
  const fsColor = fs >= 1.5 ? "text-green-600" : fs >= 1.2 ? "text-yellow-600" : "text-red-600"
  const fsLabel = fs >= 1.5 ? "Устойчив" : fs >= 1.2 ? "Условно устойчив" : "Неустойчив"

  const earthChartData = sections.map(s => ({
    name: s.name,
    выемка: calcSectionVolume(s).cut,
    насыпь: calcSectionVolume(s).fill,
  }))

  const pieData = [
    { name: "Выемка", value: parseFloat(totalCut.toFixed(1)) },
    { name: "Насыпь", value: parseFloat(totalFill.toFixed(1)) },
  ]

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Tabs defaultValue="earth">
        <TabsList className="mb-4">
          <TabsTrigger value="earth">Объёмы земляных работ</TabsTrigger>
          <TabsTrigger value="slope">Устойчивость откосов</TabsTrigger>
          <TabsTrigger value="drainage">Дренаж и сток</TabsTrigger>
        </TabsList>

        {/* EARTH */}
        <TabsContent value="earth" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><Label>Пикет</Label><Input placeholder="ПК1+00" value={secForm.name} onChange={e => setSecForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Площадь сеч. (м²)</Label><Input type="number" placeholder="20" value={secForm.area} onChange={e => setSecForm(f => ({ ...f, area: e.target.value }))} /></div>
            <div><Label>h нач. (+ выемка)</Label><Input type="number" step="0.1" placeholder="1.5" value={secForm.h1} onChange={e => setSecForm(f => ({ ...f, h1: e.target.value }))} /></div>
            <div><Label>h кон. (+ выемка)</Label><Input type="number" step="0.1" placeholder="1.0" value={secForm.h2} onChange={e => setSecForm(f => ({ ...f, h2: e.target.value }))} /></div>
          </div>
          <Button onClick={addSection} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            <Icon name="Plus" size={16} /> Добавить сечение
          </Button>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="text-xs text-muted-foreground mb-1">Объём выемки</div>
              <div className="text-3xl font-extrabold text-red-600">{totalCut.toFixed(1)} <span className="text-base font-normal text-gray-500">м³</span></div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="text-xs text-muted-foreground mb-1">Объём насыпи</div>
              <div className="text-3xl font-extrabold text-green-600">{totalFill.toFixed(1)} <span className="text-base font-normal text-gray-500">м³</span></div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="text-xs text-muted-foreground mb-1">Баланс грунта</div>
              <div className={`text-3xl font-extrabold ${balance > 0 ? "text-red-600" : "text-green-600"}`}>
                {balance > 0 ? "+" : ""}{balance.toFixed(1)} <span className="text-base font-normal text-gray-500">м³</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">{balance > 0 ? "избыток → вывоз" : "дефицит → завоз"}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="font-semibold text-gray-800 mb-3">По пикетам</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={earthChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis unit=" м³" tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="выемка" fill="#ef4444" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="насыпь" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-center">
              <div className="w-full">
                <h3 className="font-semibold text-gray-800 mb-3">Соотношение</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, value }) => `${name}: ${value} м³`} labelLine={false}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* SLOPE */}
        <TabsContent value="slope" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Параметры откоса</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Угол откоса (°)</Label>
                  <Input type="number" min="0" max="90" value={slopeAngle} onChange={e => setSlopeAngle(+e.target.value)} />
                </div>
                <div>
                  <Label>Высота откоса (м)</Label>
                  <Input type="number" value={height} onChange={e => setHeight(+e.target.value)} />
                </div>
                <div>
                  <Label>Сцепление c (кПа)</Label>
                  <Input type="number" value={cohesion} onChange={e => setCohesion(+e.target.value)} />
                </div>
                <div>
                  <Label>Объ. вес γ (кН/м³)</Label>
                  <Input type="number" value={gamma} onChange={e => setGamma(+e.target.value)} />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 flex flex-col items-center justify-center text-center">
              <div className="text-xs text-muted-foreground mb-2">Коэффициент устойчивости Kу</div>
              <div className={`text-6xl font-extrabold font-heading mb-2 ${fsColor}`}>{fs}</div>
              <div className={`text-sm font-bold px-4 py-1.5 rounded-full ${fs >= 1.5 ? "bg-green-100 text-green-700" : fs >= 1.2 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                {fsLabel}
              </div>
              <div className="mt-4 text-xs text-gray-400 space-y-1">
                <div>Kу ≥ 1.5 — устойчив (норма СП 45.13330)</div>
                <div>Kу 1.2–1.5 — условно устойчив</div>
                <div>Kу &lt; 1.2 — требует укрепления</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Визуализация откоса</h3>
            <svg viewBox="0 0 500 200" className="w-full max-w-lg mx-auto">
              <rect x="0" y="150" width="500" height="50" fill="#d4a96a" opacity="0.4" />
              <line x1="50" y1="150" x2="50" y2="50" stroke="#6b7280" strokeWidth="1.5" strokeDasharray="4 3" />
              <polygon
                points={`50,150 ${50 + height * (1 / Math.tan(slopeAngle * Math.PI / 180)) * 15},150 50,${150 - height * 15}`}
                fill={fs >= 1.5 ? "#bbf7d0" : fs >= 1.2 ? "#fef08a" : "#fecaca"}
                stroke={fs >= 1.5 ? "#16a34a" : fs >= 1.2 ? "#ca8a04" : "#dc2626"}
                strokeWidth="2"
              />
              <text x="55" y={150 - height * 15 / 2} fontSize="10" fill="#374151">h = {height} м</text>
              <text x={50 + height * (1 / Math.tan(slopeAngle * Math.PI / 180)) * 7} y="165" fontSize="10" fill="#374151">α = {slopeAngle}°</text>
            </svg>
          </div>
        </TabsContent>

        {/* DRAINAGE */}
        <TabsContent value="drainage" className="space-y-4">
          <DrainageCalc />
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

function DrainageCalc() {
  const [area, setArea] = useState(5.2)
  const [rainfall, setRainfall] = useState(80)
  const [runoff, setRunoff] = useState(0.6)
  const [pipes, setPipes] = useState(3)

  const q = parseFloat(((rainfall * runoff * area) / 360).toFixed(3))
  const qPerPipe = parseFloat((q / pipes).toFixed(3))
  const dRequired = parseFloat((Math.sqrt((4 * qPerPipe) / (Math.PI * 1.5)) * 1000).toFixed(0))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800">Расчёт дождевого стока (СП 32.13330)</h3>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Площадь бассейна (га)</Label><Input type="number" step="0.1" value={area} onChange={e => setArea(+e.target.value)} /></div>
          <div><Label>Интенсивность дождя (л/с·га)</Label><Input type="number" value={rainfall} onChange={e => setRainfall(+e.target.value)} /></div>
          <div><Label>Коэф. стока ψ</Label><Input type="number" step="0.05" min="0" max="1" value={runoff} onChange={e => setRunoff(+e.target.value)} /></div>
          <div><Label>Кол-во выпусков</Label><Input type="number" min="1" value={pipes} onChange={e => setPipes(+e.target.value)} /></div>
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800">Результаты расчёта</h3>
        {[
          ["Расчётный расход Q", `${q} м³/с`, "text-indigo-600"],
          ["Расход на 1 выпуск", `${qPerPipe} м³/с`, "text-gray-900"],
          ["Требуемый диаметр", `${dRequired} мм`, "text-green-600"],
          ["Рекомендуемый диаметр", `${Math.ceil(dRequired / 50) * 50} мм (типовой)`, "text-gray-700"],
        ].map(([k, v, c]) => (
          <div key={k} className="flex justify-between items-center border-b border-gray-100 pb-2">
            <span className="text-sm text-gray-500">{k}</span>
            <span className={`font-mono font-bold text-sm ${c}`}>{v}</span>
          </div>
        ))}
        <div className="rounded-lg bg-indigo-50 p-3 text-xs text-indigo-700 mt-2">
          Формула: Q = ψ · i · F / 360, где F в га, i в л/с·га
        </div>
      </div>
    </div>
  )
}
