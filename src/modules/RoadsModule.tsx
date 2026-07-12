import { useState } from "react"
import { экспортLandXML, экспортDXF, экспортDWG, экспортIFC, экспортТекст, экспортCSV, type DXFОбъект } from "@/utils/exportImport"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import VersionFeaturesPanel from "@/modules/VersionFeaturesPanel"
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
  const [animPlaying, setAnimPlaying] = useState(false)
  const [animProgress, setAnimProgress] = useState(0)
  const [animSpeed, setAnimSpeed] = useState(80)

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

  const doExportLandXML = () => {
    экспортLandXML({
      имя: `Автодорога кат. ${category.toUpperCase()} L=${length}м`,
      трассы: [{
        name: `Трасса кат.${category.toUpperCase()}`,
        length,
        elements: [
          { radius: 0 },
          { radius, delta: 45 },
          { radius: 0 },
        ]
      }],
      поверхности: [{ name: "Существующая поверхность", type: "TIN" }],
      коридоры: [{
        name: `Коридор ${cat.label}`,
        length,
        stations: profile.map(s => ({
          pk: s.pk,
          cut: Math.max(0, s.elev - s.design) * cat.width,
          fill: Math.max(0, s.design - s.elev) * cat.width,
        }))
      }]
    }, `road_cat${category}.xml`)
  }

  const roadCADЛинии = () => {
    const линии: DXFОбъект[] = profile.flatMap((s, i) => {
      if (i === 0) return []
      const prev = profile[i - 1]
      return [
        { тип: "LINE" as const, данные: [prev.pk / 10, prev.elev, 0, s.pk / 10, s.elev, 0], слой: "GROUND" },
        { тип: "LINE" as const, данные: [prev.pk / 10, prev.design, 0, s.pk / 10, s.design, 0], слой: "DESIGN" },
      ]
    })
    линии.push(
      { тип: "LINE" as const, данные: [0, 0, 0, length / 10, 0, 0], слой: "ROAD_EDGE" },
      { тип: "LINE" as const, данные: [0, cat.width, 0, length / 10, cat.width, 0], слой: "ROAD_EDGE" },
      { тип: "TEXT" as const, данные: [length / 20, cat.width + 2], текст: `Категория ${category.toUpperCase()}, L=${length}м, V=${cat.speed}км/ч`, слой: "TEXT" },
    )
    return линии
  }

  const doExportDXF = () => экспортDXF(roadCADЛинии(), `road_cat${category}.dxf`)
  const doExportDWG = () => экспортDWG(roadCADЛинии(), `road_cat${category}.dwg`)

  const doExportIFC = () => {
    экспортIFC([
      { тип: "IfcRoad", имя: `Автодорога кат. ${category.toUpperCase()}`, guid: `road-${category}-${length}`, описание: `L=${length}м, V=${cat.speed}км/ч, B=${cat.width}м` },
      { тип: "IfcAlignment", имя: "Трасса дороги", guid: `align-${length}`, описание: `R=${radius}м` },
      { тип: "IfcRoadPart", имя: "Проезжая часть", guid: `roadpart-001`, описание: `Ширина ${cat.width}м, ${cat.lanes} полосы` },
    ], `road_cat${category}.ifc`)
  }

  const doExportPDF = () => {
    const строки = [
      "ПОЯСНИТЕЛЬНАЯ ЗАПИСКА",
      "АВТОМОБИЛЬНАЯ ДОРОГА",
      "=".repeat(50),
      `Категория: ${cat.label}`,
      `Расчётная скорость: ${cat.speed} км/ч`,
      `Ширина проезжей части: ${cat.width} м`,
      `Количество полос: ${cat.lanes}`,
      `Длина трассы: ${length} м`,
      `Радиус кривой: ${radius} м (норма ≥ ${minRadius} м) ${radiusOk ? "✓" : "✗ НАРУШЕНИЕ"}`,
      `Продольный уклон 1: ${slope1}% (норма ≤ ${maxSlope}%) ${slopeOk1 ? "✓" : "✗ НАРУШЕНИЕ"}`,
      `Продольный уклон 2: ${slope2}% (норма ≤ ${maxSlope}%) ${slopeOk2 ? "✓" : "✗ НАРУШЕНИЕ"}`,
      "",
      "КОНСТРУКЦИЯ ДОРОЖНОЙ ОДЕЖДЫ:",
      "  Верхний слой АБ: 5 см — Асфальтобетон тип А, марка II",
      "  Нижний слой АБ: 8 см — Асфальтобетон тип Б, марка II",
      "  Основание щебень: 25 см — Щебень фр. 20-40 мм, М600",
      "  Песчаный подстил.: 15 см — Песок средней крупности",
      "",
      computed ? [
        "ОБЪЁМЫ ЗЕМЛЯНЫХ РАБОТ:",
        `  Выемка:  ${cutVol.toFixed(0)} м³`,
        `  Насыпь:  ${fillVol.toFixed(0)} м³`,
        `  Баланс:  ${(cutVol - fillVol).toFixed(0)} м³`,
      ].join("\n") : "(Профиль не рассчитан — нажмите «Рассчитать трассу»)",
      "",
      "НОРМАТИВНАЯ БАЗА:",
      "  СП 34.13330.2021 «Автомобильные дороги»",
      "  ГОСТ Р 52399-2005",
      "",
      `Дата: ${new Date().toLocaleDateString("ru")}`,
    ]
    экспортТекст(строки, `road_report_${category}.txt`)
  }

  const doExportCSV = () => {
    if (!computed) { alert("Сначала рассчитайте трассу"); return }
    экспортCSV(
      ["Пикет","Отм.земли м","Отм.проект м","Выемка м","Насыпь м"],
      profile.map(s => [
        `ПК${Math.floor(s.pk / 100)}+${String(s.pk % 100).padStart(2, "0")}`,
        s.elev.toFixed(2),
        s.design.toFixed(2),
        Math.max(0, s.elev - s.design).toFixed(2),
        Math.max(0, s.design - s.elev).toFixed(2),
      ])
    , `road_profile_${category}.csv`)
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Tabs defaultValue="params">
        <TabsList className="mb-4">
          <TabsTrigger value="params">Параметры трассы</TabsTrigger>
          <TabsTrigger value="profile">Продольный профиль</TabsTrigger>
          <TabsTrigger value="cross">Поперечное сечение</TabsTrigger>
          <TabsTrigger value="animation">Анимация проезда</TabsTrigger>
          <TabsTrigger value="export">Экспорт</TabsTrigger>
          <TabsTrigger value="report">Отчёт</TabsTrigger>
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

        {/* ANIMATION */}
        <TabsContent value="animation" className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Icon name="Play" size={16} className="text-indigo-600" />Анимация проезда по трассе
            </h3>

            {/* Driver's-eye SVG */}
            <svg width="100%" height="200" viewBox="0 0 400 200" className="bg-sky-100 rounded-xl">
              {/* Sky */}
              <rect width="400" height="100" fill="#87CEEB" />
              {/* Ground */}
              <rect y="100" width="400" height="100" fill="#8FBC8F" />
              {/* Road surface */}
              <polygon points="100,200 300,200 220,100 180,100" fill="#666" />
              {/* Lane markings */}
              <polygon points="195,200 205,200 202,120 198,120" fill="white" />
              {/* Road shoulders */}
              <polygon points="80,200 100,200 180,100 175,100" fill="#aaa" />
              <polygon points="300,200 320,200 225,100 220,100" fill="#aaa" />
              {/* Horizon */}
              <line x1="0" y1="100" x2="400" y2="100" stroke="#555" strokeWidth="0.5" />
              {/* Speed indicator */}
              <text x="20" y="190" fill="white" fontSize="14" fontWeight="bold">{animSpeed} км/ч</text>
              <text x="20" y="175" fill="white" fontSize="10">
                ПК {Math.floor(animProgress * 0.12)}+{String(Math.floor((animProgress * 12) % 100)).padStart(2, '0')}
              </text>
              {/* Elevation indicator */}
              <text x="320" y="190" fill="white" fontSize="10" textAnchor="middle">
                {(startElev + animProgress * 0.05).toFixed(1)} м
              </text>
              <text x="320" y="178" fill="white" fontSize="9" textAnchor="middle">Отм. проезда</text>
            </svg>

            {/* Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>ПК 0+00</span>
                <span className="font-semibold text-indigo-700">
                  ПК {Math.floor(animProgress * 0.12)}+{String(Math.floor((animProgress * 12) % 100)).padStart(2, '0')} / {length} м
                </span>
                <span>ПК {Math.floor(length / 100)}+{String(length % 100).padStart(2, '0')}</span>
              </div>
              <input
                type="range" min={0} max={100} value={animProgress}
                onChange={e => setAnimProgress(+e.target.value)}
                className="w-full accent-indigo-600"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                onClick={() => setAnimPlaying(p => !p)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              >
                <Icon name={animPlaying ? "Pause" : "Play"} size={16} />
                {animPlaying ? "Пауза" : "Воспроизвести"}
              </Button>
              <Button variant="outline" onClick={() => { setAnimPlaying(false); setAnimProgress(0) }} className="gap-2">
                <Icon name="Square" size={16} />Стоп
              </Button>

              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-gray-500">Скорость:</span>
                {[30, 50, 60, 80, 100].map(s => (
                  <button key={s} onClick={() => setAnimSpeed(s)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${animSpeed === s ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Current position summary */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Пикет",        value: `ПК ${Math.floor(animProgress * 0.12)}+${String(Math.floor((animProgress * 12) % 100)).padStart(2, '0')}` },
                { label: "Отметка",      value: `${(startElev + animProgress * 0.05).toFixed(2)} м` },
                { label: "Пройдено",     value: `${Math.round(animProgress * length / 100)} м` },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-gray-200 p-3 text-center">
                  <div className="text-xs text-gray-400">{s.label}</div>
                  <div className="text-base font-bold text-gray-900 mt-0.5">{s.value}</div>
                </div>
              ))}
            </div>

            <Button variant="outline" className="gap-2" onClick={() => {}}>
              <Icon name="Download" size={16} />Экспорт видео (MP4)
            </Button>
          </div>
        </TabsContent>

        {/* EXPORT */}
        <TabsContent value="export" className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Icon name="Download" size={16} className="text-indigo-600" />Экспорт данных трассы
            </h3>

            {/* Road summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Длина трассы",   value: `${length} м` },
                { label: "Категория",      value: category.toUpperCase() },
                { label: "Скорость",       value: `${cat.speed} км/ч` },
                { label: "Полос",          value: `${cat.lanes}` },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-gray-200 p-3 text-center">
                  <div className="text-xs text-gray-400">{s.label}</div>
                  <div className="text-base font-bold text-gray-900 mt-0.5">{s.value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  fmt: "LandXML",
                  icon: "Mountain",
                  desc: "Трасса, профиль, коридор для Civil 3D / InfraWorks",
                  color: "bg-blue-50 border-blue-200",
                  btn: "bg-blue-600 hover:bg-blue-700",
                  fn: doExportLandXML,
                },
                {
                  fmt: "DWG",
                  icon: "PenTool",
                  desc: "Чертёж плана и профиля для AutoCAD / nanoCAD",
                  color: "bg-orange-50 border-orange-200",
                  btn: "bg-orange-600 hover:bg-orange-700",
                  fn: doExportDWG,
                },
                {
                  fmt: "DXF",
                  icon: "PenTool",
                  desc: "Обменный чертёж плана и профиля",
                  color: "bg-amber-50 border-amber-200",
                  btn: "bg-amber-600 hover:bg-amber-700",
                  fn: doExportDXF,
                },
                {
                  fmt: "IFC",
                  icon: "Box",
                  desc: "BIM-модель дороги (IfcRoad) для Revit / Navisworks",
                  color: "bg-indigo-50 border-indigo-200",
                  btn: "bg-indigo-600 hover:bg-indigo-700",
                  fn: doExportIFC,
                },
                {
                  fmt: "PDF отчёт",
                  icon: "FileText",
                  desc: "Пояснительная записка с профилем и ведомостью",
                  color: "bg-green-50 border-green-200",
                  btn: "bg-green-600 hover:bg-green-700",
                  fn: doExportPDF,
                },
              ].map(f => (
                <div key={f.fmt} className={`rounded-xl border p-4 ${f.color} space-y-2`}>
                  <div className="flex items-center gap-2">
                    <Icon name={f.icon} size={18} className="text-gray-700" fallback="File" />
                    <div className="font-bold text-gray-900">{f.fmt}</div>
                  </div>
                  <div className="text-xs text-gray-500">{f.desc}</div>
                  <Button onClick={f.fn} className={`w-full text-white text-xs gap-2 ${f.btn}`}>
                    <Icon name="Download" size={13} />Скачать {f.fmt}
                  </Button>
                </div>
              ))}
            </div>

            {/* CSV профиль */}
            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50 flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-800 text-sm">CSV — профиль пикетов</div>
                <div className="text-xs text-gray-400">Пикет, отм.земли, отм.проект, выемка, насыпь</div>
              </div>
              <Button onClick={doExportCSV} variant="outline" className="gap-2 text-sm">
                <Icon name="FileSpreadsheet" size={14} />Скачать CSV
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* REPORT */}
        <TabsContent value="report" className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Icon name="FileText" size={16} className="text-indigo-600" />Отчёт по проекту дороги
              </h3>
              <div className="flex gap-2">
                <Button onClick={doExportPDF} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                  <Icon name="Download" size={16} />Экспорт TXT
                </Button>
                <Button onClick={doExportCSV} variant="outline" className="gap-2">
                  <Icon name="FileSpreadsheet" size={14} />CSV
                </Button>
              </div>
            </div>

            {/* Design parameters table */}
            <div className="space-y-1">
              <div className="text-sm font-semibold text-gray-700">Проектные параметры</div>
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs font-semibold text-gray-500">
                    <tr>
                      <th className="px-4 py-2 text-left">Параметр</th>
                      <th className="px-4 py-2 text-right">Значение</th>
                      <th className="px-4 py-2 text-right">Норма</th>
                      <th className="px-4 py-2 text-center">Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "Категория дороги",      val: category.toUpperCase(),    norm: "—",             ok: true },
                      { name: "Расчётная скорость",    val: `${cat.speed} км/ч`,       norm: "по СП 34",      ok: true },
                      { name: "Ширина проезжей части", val: `${cat.width} м`,          norm: "по СП 34",      ok: true },
                      { name: "Количество полос",      val: `${cat.lanes}`,            norm: "по СП 34",      ok: true },
                      { name: "Уклон 1",               val: `${slope1}%`,              norm: `≤ ${maxSlope}%`, ok: slopeOk1 },
                      { name: "Уклон 2",               val: `${slope2}%`,              norm: `≤ ${maxSlope}%`, ok: slopeOk2 },
                      { name: "Радиус кривой",         val: `${radius} м`,             norm: `≥ ${minRadius} м`, ok: radiusOk },
                      { name: "Длина трассы",          val: `${length} м`,             norm: "—",             ok: true },
                    ].map((r, i) => (
                      <tr key={r.name} className={`border-t border-gray-100 ${i % 2 === 0 ? "" : "bg-gray-50"}`}>
                        <td className="px-4 py-2 font-medium text-gray-800">{r.name}</td>
                        <td className="px-4 py-2 text-right font-mono">{r.val}</td>
                        <td className="px-4 py-2 text-right text-xs text-gray-400">{r.norm}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {r.ok ? "✓ OK" : "✗ Нарушение"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pavement structure */}
            <div className="space-y-1">
              <div className="text-sm font-semibold text-gray-700">Конструкция дорожной одежды</div>
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs font-semibold text-gray-500">
                    <tr>
                      <th className="px-4 py-2 text-left">Слой</th>
                      <th className="px-4 py-2 text-center">Толщина, см</th>
                      <th className="px-4 py-2 text-left">Материал</th>
                      <th className="px-4 py-2 text-right">Плотность, кг/м³</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { layer: "Верхний слой АБ",   h: 5,  mat: "Асфальтобетон тип А, марка II",  rho: 2350 },
                      { layer: "Нижний слой АБ",    h: 8,  mat: "Асфальтобетон тип Б, марка II",  rho: 2300 },
                      { layer: "Основание щебень",  h: 25, mat: "Щебень фр. 20-40 мм, М600",      rho: 1800 },
                      { layer: "Песчаный подстил.", h: 15, mat: "Песок средней крупности",         rho: 1650 },
                      { layer: "Земляное полотно",  h: null, mat: "Грунт рабочего слоя, уплотн.", rho: 1900 },
                    ].map((r, i) => (
                      <tr key={r.layer} className={`border-t border-gray-100 ${i % 2 === 0 ? "" : "bg-gray-50"}`}>
                        <td className="px-4 py-2 font-medium text-gray-800">{r.layer}</td>
                        <td className="px-4 py-2 text-center font-mono">{r.h ?? "—"}</td>
                        <td className="px-4 py-2 text-xs text-gray-600">{r.mat}</td>
                        <td className="px-4 py-2 text-right font-mono text-gray-500">{r.rho}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Earthworks summary */}
            {computed && (
              <div className="space-y-1">
                <div className="text-sm font-semibold text-gray-700">Сводка земляных работ</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Объём выемки",  value: `${cutVol.toFixed(0)} м³`,  color: "text-red-600"   },
                    { label: "Объём насыпи",  value: `${fillVol.toFixed(0)} м³`, color: "text-green-600" },
                    { label: "Баланс грунта", value: `${(cutVol - fillVol).toFixed(0)} м³`, color: cutVol >= fillVol ? "text-red-500" : "text-green-500" },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl border border-gray-200 p-4 text-center">
                      <div className="text-xs text-gray-400">{s.label}</div>
                      <div className={`text-xl font-extrabold mt-0.5 ${s.color}`}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      <VersionFeaturesPanel categories={["corridor"]} />
    </motion.div>
  )
}