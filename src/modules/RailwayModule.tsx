import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import { CategoryFeaturesGrid } from "@/modules/VersionFeaturesPanel"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { экспортТекст, экспортCSV } from "@/utils/exportImport"

const TRACK_CLASSES = [
  { value: "1", label: "1 класс — скоростные (до 200 км/ч)", speed: 200, gauge: 1520, minRadius: 4000, maxSlope: 8 },
  { value: "2", label: "2 класс — пассажирские (до 160 км/ч)", speed: 160, gauge: 1520, minRadius: 2500, maxSlope: 10 },
  { value: "3", label: "3 класс — грузо-пассажирские", speed: 120, gauge: 1520, minRadius: 1200, maxSlope: 12 },
  { value: "4", label: "4 класс — грузовые", speed: 80, gauge: 1520, minRadius: 600, maxSlope: 15 },
  { value: "5", label: "5 класс — подъездные пути", speed: 40, gauge: 1520, minRadius: 200, maxSlope: 40 },
]

interface TrackPoint { id: number; pk: number; elev: number; name: string }

function calcCantAngle(speed: number, radius: number): number {
  const vms = speed / 3.6
  const cant = (vms ** 2 * 1520) / (9.81 * radius)
  return parseFloat(Math.min(cant, 150).toFixed(1))
}

function calcBrakingDist(speed: number, grade: number): number {
  const v = speed / 3.6
  const a = 0.8 + grade * 0.1
  return parseFloat((v ** 2 / (2 * a)).toFixed(0))
}

export default function RailwayModule() {
  const [trackClass, setTrackClass] = useState("3")
  const [length, setLength] = useState(5000)
  const [radius, setRadius] = useState(1500)
  const [grade, setGrade] = useState(6)
  const [computed, setComputed] = useState(false)

  const [points, setPoints] = useState<TrackPoint[]>([
    { id: 1, pk: 0, elev: 150.0, name: "НТ-1" },
    { id: 2, pk: 500, elev: 153.2, name: "НТ-2" },
    { id: 3, pk: 1000, elev: 151.8, name: "НТ-3" },
    { id: 4, pk: 1500, elev: 155.0, name: "НТ-4" },
    { id: 5, pk: 2000, elev: 154.1, name: "НТ-5" },
  ])
  const [form, setForm] = useState({ name: "", pk: "", elev: "" })

  const cls = TRACK_CLASSES.find(c => c.value === trackClass)!
  const radiusOk = radius >= cls.minRadius
  const gradeOk = grade <= cls.maxSlope
  const cant = calcCantAngle(cls.speed, radius)
  const brakingDist = calcBrakingDist(cls.speed, grade)

  const addPoint = () => {
    if (!form.name || !form.pk || !form.elev) return
    setPoints(prev => [...prev, { id: Date.now(), name: form.name, pk: +form.pk, elev: +form.elev }].sort((a, b) => a.pk - b.pk))
    setForm({ name: "", pk: "", elev: "" })
  }

  const profileData = points.map(p => ({ name: p.name, pk: p.pk, elev: p.elev }))
  const minE = Math.min(...points.map(p => p.elev))
  const maxE = Math.max(...points.map(p => p.elev))

  const gauge = cls.gauge
  const lineCategory = "Нормальная"
  const cantMm = Math.round(calcCantAngle(cls.speed, radius))
  const axleLoad = 25

  const exportReport = () => {
    экспортТекст([
      "ТЕХНИЧЕСКИЙ ОТЧЁТ Ж/Д ПУТИ",
      "============================",
      `Дата: ${new Date().toLocaleDateString("ru")}`,
      `Класс пути: ${trackClass}`,
      `Категория линии: ${lineCategory}`,
      `Ширина колеи: ${gauge} мм`,
      `Длина участка: ${length} м`,
      `Расчётный радиус: ${radius} м`,
      `Уклон профиля: ${grade}‰`,
      `Расчётная скорость: ${cls.speed} км/ч`,
      `Проектное возвышение: ${cantMm} мм`,
      `Нагрузка на ось: ${axleLoad} т`,
      "",
      "НОРМАТИВНЫЕ ПАРАМЕТРЫ (СП 119.13330):",
      `  Макс. уклон: ${cls.maxSlope}‰`,
      `  Мин. радиус: ${cls.minRadius} м`,
      "",
      "ПРОФИЛЬНЫЕ ТОЧКИ:",
      ...points.map((p, i) => `  ${i + 1}. ПК ${Math.floor(p.pk / 100)}+${String(p.pk % 100).padStart(2, "0")}, отм.=${p.elev}м`),
    ], "railway_report.txt")
  }

  const exportProfileCSV = () => {
    экспортCSV(
      ["№", "Имя", "Пикет", "Отметка м"],
      points.map((p, i) => [i + 1, p.name || `Т${i + 1}`, p.pk, p.elev]),
      "railway_profile.csv"
    )
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Tabs defaultValue="params">
        <TabsList className="mb-4">
          <TabsTrigger value="params">Параметры пути</TabsTrigger>
          <TabsTrigger value="profile">Профиль трассы</TabsTrigger>
          <TabsTrigger value="cross">Поперечный профиль</TabsTrigger>
          <TabsTrigger value="calcs">Тяговые расчёты</TabsTrigger>
          <TabsTrigger value="cat-corridor">Трассы</TabsTrigger>
        </TabsList>

        <TabsContent value="params" className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>Класс железнодорожного пути (СП 119.13330)</Label>
                <Select value={trackClass} onValueChange={setTrackClass}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{TRACK_CLASSES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Длина трассы (м)</Label>
                  <Input type="number" value={length} onChange={e => setLength(+e.target.value)} />
                </div>
                <div>
                  <Label>Радиус кривой (м)</Label>
                  <Input type="number" value={radius} onChange={e => setRadius(+e.target.value)} className={!radiusOk ? "border-red-400" : ""} />
                  {!radiusOk && <p className="text-xs text-red-500 mt-1">Мин. {cls.minRadius} м для {cls.value} кл.</p>}
                </div>
                <div>
                  <Label>Уклон (‰)</Label>
                  <Input type="number" step="0.5" value={grade} onChange={e => setGrade(+e.target.value)} className={!gradeOk ? "border-red-400" : ""} />
                  {!gradeOk && <p className="text-xs text-red-500 mt-1">Макс. {cls.maxSlope}‰ для {cls.value} кл.</p>}
                </div>
              </div>
              <Button onClick={() => setComputed(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                <Icon name="Play" size={16} /> Рассчитать
              </Button>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-2 text-sm">
              <h3 className="font-bold text-gray-800 mb-3">Нормативные параметры</h3>
              {[
                ["Расчётная скорость", `${cls.speed} км/ч`],
                ["Ширина колеи", `${cls.gauge} мм`],
                ["Мин. радиус кривой", `${cls.minRadius} м`],
                ["Макс. уклон", `${cls.maxSlope} ‰`],
                ["Возвышение рельса", `${cant} мм`, !computed ? "" : cant > 100 ? "text-red-600" : "text-green-600"],
                ["Тормозной путь", computed ? `${brakingDist} м` : "—"],
              ].map(([k, v, c]) => (
                <div key={k} className="flex justify-between border-b border-gray-200 pb-1">
                  <span className="text-gray-500">{k}</span>
                  <span className={`font-semibold ${c || "text-gray-800"}`}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="profile">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Название точки</Label><Input placeholder="НТ-6" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><Label>Пикет (м)</Label><Input type="number" placeholder="2500" value={form.pk} onChange={e => setForm(f => ({ ...f, pk: e.target.value }))} /></div>
              <div><Label>Отметка (м)</Label><Input type="number" step="0.1" placeholder="152.5" value={form.elev} onChange={e => setForm(f => ({ ...f, elev: e.target.value }))} /></div>
            </div>
            <Button onClick={addPoint} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Icon name="Plus" size={16} /> Добавить точку
            </Button>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Продольный профиль пути</h3>
                <div className="flex gap-2">
                  <Button onClick={exportProfileCSV} variant="outline" className="gap-2 text-sm">
                    <Icon name="Download" size={14} /> CSV
                  </Button>
                  <Button onClick={exportReport} variant="outline" className="gap-2 text-sm">
                    <Icon name="Download" size={14} /> TXT-отчёт
                  </Button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={profileData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="pk" tickFormatter={v => `${v}м`} tick={{ fontSize: 10 }} />
                  <YAxis domain={[minE - 2, maxE + 2]} unit=" м" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => [`${v} м`, "Отметка"]} />
                  <ReferenceLine y={(minE + maxE) / 2} stroke="#e5e7eb" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="elev" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 5, fill: "#6366f1" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cross">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Типовое поперечное сечение — {cls.value} класс</h3>
            <svg viewBox="0 0 620 250" className="w-full max-w-2xl mx-auto">
              {/* Ground */}
              <line x1="0" y1="170" x2="620" y2="170" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 4" />
              {/* Embankment */}
              <polygon points="310,105 150,170 470,170" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
              {/* Ballast */}
              <polygon points="270,108 350,108 360,130 260,130" fill="#d1d5db" stroke="#9ca3af" strokeWidth="1" />
              {/* Sleepers */}
              {[270, 285, 300, 315, 330].map(x => (
                <rect key={x} x={x - 8} y="118" width="16" height="6" rx="1" fill="#92400e" />
              ))}
              {/* Rails */}
              <rect x="275" y="108" width="6" height="14" rx="1" fill="#374151" />
              <rect x="339" y="108" width="6" height="14" rx="1" fill="#374151" />
              {/* Gauge arrow */}
              <line x1="278" y1="145" x2="342" y2="145" stroke="#6366f1" strokeWidth="1.5" />
              <text x="310" y="158" textAnchor="middle" fontSize="11" fill="#6366f1" fontWeight="bold">{cls.gauge} мм</text>
              {/* Cant indicator */}
              {cant > 0 && (
                <text x="360" y="112" fontSize="9" fill="#f59e0b">↑ {cant} мм</text>
              )}
              {/* Labels */}
              <text x="310" y="90" textAnchor="middle" fontSize="10" fill="#374151">Рельсошпальная решётка</text>
              <text x="310" y="195" textAnchor="middle" fontSize="10" fill="#92400e">Земляное полотно</text>
              <text x="220" y="155" textAnchor="middle" fontSize="9" fill="#6b7280">Балластная призма</text>
            </svg>
          </div>
        </TabsContent>

        <TabsContent value="calcs">
          <TractionCalc speed={cls.speed} grade={grade} />
        </TabsContent>
        <TabsContent value="cat-corridor"><CategoryFeaturesGrid category="corridor" /></TabsContent>
      </Tabs>
    </motion.div>
  )
}

function TractionCalc({ speed, grade }: { speed: number; grade: number }) {
  const [mass, setMass] = useState(4000)
  const [locoForce, setLocoForce] = useState(500)

  const resistForce = mass * 9.81 * (grade / 1000 + 0.003)
  const accel = parseFloat(((locoForce * 1000 - resistForce) / (mass * 1000)).toFixed(4))
  const brakeDist = parseFloat(((speed / 3.6) ** 2 / (2 * 0.85)).toFixed(0))
  const powerKw = parseFloat(((locoForce * 1000 * speed / 3.6) / 1000).toFixed(0))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800">Тяговые расчёты</h3>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Масса состава (т)</Label><Input type="number" value={mass} onChange={e => setMass(+e.target.value)} /></div>
          <div><Label>Сила тяги локомотива (кН)</Label><Input type="number" value={locoForce} onChange={e => setLocoForce(+e.target.value)} /></div>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <h3 className="font-semibold text-gray-800">Результаты</h3>
        {[
          ["Сила сопротивления", `${resistForce.toFixed(0)} Н`],
          ["Ускорение / замедление", `${accel > 0 ? "+" : ""}${accel} м/с²`, accel > 0 ? "text-green-600" : "text-red-600"],
          ["Тормозной путь", `${brakeDist} м`],
          ["Потребляемая мощность", `${powerKw} кВт`],
        ].map(([k, v, c]) => (
          <div key={k} className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500">{k}</span>
            <span className={`font-mono font-bold ${c || "text-gray-800"}`}>{v}</span>
          </div>
        ))}
        <div className="rounded-lg bg-indigo-50 p-3 text-xs text-indigo-700 mt-2">
          Уклон {grade}‰ · Скорость {speed} км/ч · Масса {mass} т
        </div>
      </div>
    </div>
  )
}