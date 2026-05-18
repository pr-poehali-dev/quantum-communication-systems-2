import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts"

interface Station {
  pk: number
  elev: number
  design: number
}

function generateProfile(startElev: number, length: number, slope1: number, slope2: number): Station[] {
  const stations: Station[] = []
  const breakPk = Math.round(length * 0.5)
  for (let pk = 0; pk <= length; pk += 20) {
    const naturalElev = pk <= breakPk
      ? startElev + (pk / breakPk) * ((startElev + slope1 * breakPk / 100) - startElev)
      : (startElev + slope1 * breakPk / 100) + ((pk - breakPk) / (length - breakPk)) * (slope2 * (length - breakPk) / 100)
    const designElev = startElev + (pk / length) * ((slope1 + slope2) / 2 * length / 100)
    stations.push({ pk, elev: parseFloat(naturalElev.toFixed(2)), design: parseFloat(designElev.toFixed(2)) })
  }
  return stations
}

const ROAD_CATEGORIES = [
  { value: "ia", label: "Ia — Автомагистраль", speed: 150, width: 27.5, lanes: 4 },
  { value: "ib", label: "Iб — Скоростная", speed: 120, width: 21.5, lanes: 4 },
  { value: "ii", label: "II — Региональная", speed: 100, width: 15, lanes: 2 },
  { value: "iii", label: "III — Областная", speed: 80, width: 12, lanes: 2 },
  { value: "iv", label: "IV — Местная", speed: 60, width: 8, lanes: 2 },
]

export default function RoadsModule() {
  const [category, setCategory] = useState("ii")
  const [length, setLength] = useState(2000)
  const [startElev, setStartElev] = useState(120)
  const [slope1, setSlope1] = useState(3.5)
  const [slope2, setSlope2] = useState(-2.0)
  const [radius, setRadius] = useState(600)
  const [computed, setComputed] = useState(false)
  const [profile, setProfile] = useState<Station[]>([])

  const cat = ROAD_CATEGORIES.find(c => c.value === category)!

  const compute = () => {
    setProfile(generateProfile(startElev, length, slope1, slope2))
    setComputed(true)
  }

  const minRadius = category === "ia" ? 1200 : category === "ib" ? 800 : category === "ii" ? 600 : category === "iii" ? 300 : 150
  const maxSlope = category === "ia" || category === "ib" ? 4 : category === "ii" ? 5 : category === "iii" ? 6 : 9
  const slopeOk1 = Math.abs(slope1) <= maxSlope
  const slopeOk2 = Math.abs(slope2) <= maxSlope
  const radiusOk = radius >= minRadius

  const cutVol = profile.reduce((s, st) => {
    const diff = st.elev - st.design
    return diff > 0 ? s + diff * 20 * cat.width : s
  }, 0)
  const fillVol = profile.reduce((s, st) => {
    const diff = st.design - st.elev
    return diff > 0 ? s + diff * 20 * cat.width : s
  }, 0)

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Tabs defaultValue="params">
        <TabsList className="mb-4">
          <TabsTrigger value="params">Параметры трассы</TabsTrigger>
          <TabsTrigger value="profile">Продольный профиль</TabsTrigger>
          <TabsTrigger value="cross">Поперечное сечение</TabsTrigger>
        </TabsList>

        {/* PARAMS */}
        <TabsContent value="params" className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>Категория дороги (СП 34.13330)</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROAD_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Длина трассы (м)</Label>
                  <Input type="number" value={length} onChange={e => setLength(+e.target.value)} />
                </div>
                <div>
                  <Label>Нач. отметка (м)</Label>
                  <Input type="number" value={startElev} onChange={e => setStartElev(+e.target.value)} />
                </div>
                <div>
                  <Label>Уклон 1 (%)</Label>
                  <Input type="number" step="0.1" value={slope1} onChange={e => setSlope1(+e.target.value)} className={!slopeOk1 ? "border-red-400" : ""} />
                  {!slopeOk1 && <p className="text-xs text-red-500 mt-1">Макс. уклон для кат. {category.toUpperCase()}: {maxSlope}%</p>}
                </div>
                <div>
                  <Label>Уклон 2 (%)</Label>
                  <Input type="number" step="0.1" value={slope2} onChange={e => setSlope2(+e.target.value)} className={!slopeOk2 ? "border-red-400" : ""} />
                  {!slopeOk2 && <p className="text-xs text-red-500 mt-1">Макс. уклон для кат. {category.toUpperCase()}: {maxSlope}%</p>}
                </div>
                <div>
                  <Label>Радиус кривой (м)</Label>
                  <Input type="number" value={radius} onChange={e => setRadius(+e.target.value)} className={!radiusOk ? "border-red-400" : ""} />
                  {!radiusOk && <p className="text-xs text-red-500 mt-1">Мин. радиус: {minRadius} м</p>}
                </div>
              </div>
              <Button onClick={compute} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                <Icon name="Play" size={16} /> Рассчитать трассу
              </Button>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-3">
              <h3 className="font-bold text-gray-800">Нормативные параметры</h3>
              <div className="space-y-2 text-sm">
                {[
                  ["Расчётная скорость", `${cat.speed} км/ч`],
                  ["Ширина проезжей части", `${cat.width} м`],
                  ["Количество полос", `${cat.lanes}`],
                  ["Мин. радиус кривой", `${minRadius} м`],
                  ["Макс. продольный уклон", `${maxSlope}%`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-semibold text-gray-800">{v}</span>
                  </div>
                ))}
              </div>
              {computed && (
                <div className="pt-2 space-y-2 text-sm">
                  <h4 className="font-semibold text-gray-700">Объёмы земляных работ</h4>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Выемка</span>
                    <span className="font-mono font-semibold text-red-600">{cutVol.toFixed(0)} м³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Насыпь</span>
                    <span className="font-mono font-semibold text-green-600">{fillVol.toFixed(0)} м³</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* PROFILE */}
        <TabsContent value="profile">
          {!computed ? (
            <div className="text-center py-16 text-muted-foreground">
              <Icon name="Play" size={32} className="mx-auto mb-3 text-gray-300" />
              <p>Задайте параметры и нажмите «Рассчитать трассу»</p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="font-semibold text-gray-800 mb-4">Продольный профиль (рельеф vs проектная линия)</h3>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={profile} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="pk" tickFormatter={v => `ПК${(v / 100).toFixed(0)}+${v % 100 < 10 ? "0" : ""}${v % 100}`} tick={{ fontSize: 10 }} />
                  <YAxis domain={["auto", "auto"]} unit=" м" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number, n: string) => [`${v} м`, n === "elev" ? "Рельеф" : "Проектная линия"]} labelFormatter={v => `ПК${Math.floor(+v / 100)}+${+v % 100}`} />
                  <ReferenceLine y={startElev} stroke="#ccc" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="elev" stroke="#64748b" strokeWidth={2} dot={false} name="elev" />
                  <Line type="monotone" dataKey="design" stroke="#6366f1" strokeWidth={2.5} dot={false} strokeDasharray="6 3" name="design" />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-6 mt-2 text-xs text-gray-500 justify-center">
                <span className="flex items-center gap-1.5"><span className="w-5 h-0.5 bg-gray-500 inline-block" /> Рельеф</span>
                <span className="flex items-center gap-1.5"><span className="w-5 h-0.5 bg-indigo-500 inline-block border-dashed" style={{borderTop: "2px dashed #6366f1", background:"none"}} /> Проектная линия</span>
              </div>
            </div>
          )}
        </TabsContent>

        {/* CROSS SECTION */}
        <TabsContent value="cross">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Типовое поперечное сечение — кат. {category.toUpperCase()}</h3>
            <svg viewBox={`0 0 600 220`} className="w-full max-w-2xl mx-auto">
              {/* Ground */}
              <line x1="0" y1="160" x2="600" y2="160" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" />
              {/* Embankment */}
              <polygon points="300,100 160,160 440,160" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
              {/* Road surface */}
              <rect x={300 - cat.width * 8} y="98" width={cat.width * 16} height="6" rx="2" fill="#374151" />
              {/* Lane markings */}
              {cat.lanes > 2 && (
                <>
                  <line x1="300" y1="98" x2="300" y2="104" stroke="white" strokeWidth="1.5" />
                  <line x1={300 - cat.width * 4} y1="98" x2={300 - cat.width * 4} y2="104" stroke="white" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1={300 + cat.width * 4} y1="98" x2={300 + cat.width * 4} y2="104" stroke="white" strokeWidth="1" strokeDasharray="3 3" />
                </>
              )}
              {/* Shoulders */}
              <rect x={300 - cat.width * 8 - 24} y="99" width="24" height="4" rx="1" fill="#9ca3af" />
              <rect x={300 + cat.width * 8} y="99" width="24" height="4" rx="1" fill="#9ca3af" />
              {/* Dimensions */}
              <line x1={300 - cat.width * 8} y1="120" x2={300 + cat.width * 8} y2="120" stroke="#6366f1" strokeWidth="1" markerEnd="url(#arrow)" />
              <text x="300" y="135" textAnchor="middle" fontSize="11" fill="#6366f1" fontWeight="bold">{cat.width} м</text>
              {/* Labels */}
              <text x="300" y="80" textAnchor="middle" fontSize="10" fill="#374151">Проезжая часть ({cat.lanes} пол.)</text>
              <text x={300 - cat.width * 8 - 12} y="116" textAnchor="middle" fontSize="9" fill="#6b7280">Обочина</text>
              <text x={300 + cat.width * 8 + 14} y="116" textAnchor="middle" fontSize="9" fill="#6b7280">Обочина</text>
              <text x="300" y="185" textAnchor="middle" fontSize="10" fill="#92400e">Насыпь</text>
            </svg>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
