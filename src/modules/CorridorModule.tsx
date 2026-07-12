import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import { CategoryFeaturesGrid } from "@/modules/VersionFeaturesPanel"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts"
import { экспортCSV, экспортLandXML, экспортDXF, экспортDWG, экспортIFC } from "@/utils/exportImport"

interface CorridorStation {
  pk: number
  groundElev: number
  designElev: number
  leftCut: number
  rightCut: number
  leftFill: number
  rightFill: number
  cutArea: number
  fillArea: number
}

const ASSEMBLIES = [
  { value: "highway2lane", label: "2-полосная дорога (7 м)" , laneW: 3.5, shoulderW: 2.5, cutSlope: 1.5, fillSlope: 1.75 },
  { value: "highway4lane", label: "4-полосная магистраль (14 м)", laneW: 3.75, shoulderW: 3.0, cutSlope: 1.5, fillSlope: 2.0 },
  { value: "rural", label: "Сельская дорога (6 м)", laneW: 3.0, shoulderW: 1.5, cutSlope: 1.0, fillSlope: 1.5 },
  { value: "highway_emb", label: "Городская улица с тротуарами", laneW: 3.5, shoulderW: 1.5, cutSlope: 2.0, fillSlope: 1.5 },
]

function generateCorridor(
  length: number, step: number, startElev: number,
  slope1: number, slope2: number, assembly: typeof ASSEMBLIES[0]
): CorridorStation[] {
  const stations: CorridorStation[] = []
  const breakPk = length * 0.45
  for (let pk = 0; pk <= length; pk += step) {
    const groundElev = startElev
      + Math.sin(pk / 300) * 2.5
      + Math.cos(pk / 500) * 1.8
      + (pk / length) * 4
    const designElev = pk <= breakPk
      ? startElev + (pk * slope1 / 1000)
      : startElev + (breakPk * slope1 / 1000) + ((pk - breakPk) * slope2 / 1000)

    const diff = groundElev - designElev
    const halfRoad = assembly.laneW + assembly.shoulderW
    if (diff > 0) {
      const w = diff * assembly.cutSlope
      stations.push({ pk, groundElev: +groundElev.toFixed(3), designElev: +designElev.toFixed(3), leftCut: +(halfRoad + w).toFixed(2), rightCut: +(halfRoad + w).toFixed(2), leftFill: 0, rightFill: 0, cutArea: +(diff * (halfRoad + w / 2)).toFixed(2), fillArea: 0 })
    } else {
      const w = Math.abs(diff) * assembly.fillSlope
      stations.push({ pk, groundElev: +groundElev.toFixed(3), designElev: +designElev.toFixed(3), leftCut: 0, rightCut: 0, leftFill: +(halfRoad + w).toFixed(2), rightFill: +(halfRoad + w).toFixed(2), cutArea: 0, fillArea: +(Math.abs(diff) * (halfRoad + w / 2)).toFixed(2) })
    }
  }
  return stations
}

export default function CorridorModule() {
  const [assembly, setAssembly] = useState("highway2lane")
  const [length, setLength] = useState(2000)
  const [step, setStep] = useState(20)
  const [startElev, setStartElev] = useState(120)
  const [slope1, setSlope1] = useState(5)
  const [slope2, setSlope2] = useState(-3)
  const [computed, setComputed] = useState(false)
  const [activePk, setActivePk] = useState(0)

  const asm = ASSEMBLIES.find(a => a.value === assembly)!

  const stations = useMemo(() =>
    computed ? generateCorridor(length, step, startElev, slope1, slope2, asm) : [],
    [computed, length, step, startElev, slope1, slope2, asm]
  )

  const totalCut = stations.reduce((s, st) => s + st.cutArea * step, 0)
  const totalFill = stations.reduce((s, st) => s + st.fillArea * step, 0)
  const activeStation = stations.find(s => s.pk === activePk) || stations[0]

  const profileData = stations.map(s => ({ pk: s.pk, Рельеф: s.groundElev, Проектная: s.designElev }))
  const volumeData = stations.filter((_, i) => i % 3 === 0).map(s => ({ pk: s.pk, Выемка: s.cutArea, Насыпь: s.fillArea }))

  const CrossSection = ({ st }: { st: CorridorStation }) => {
    if (!st) return null
    const iscut = st.cutArea > 0
    const halfR = asm.laneW + asm.shoulderW
    const sw = 300, sh = 180, cx = sw / 2, cy = 110
    const scale = 8
    const groundY = cy - (st.groundElev - st.designElev) * scale
    return (
      <svg viewBox={`0 0 ${sw} ${sh}`} className="w-full max-w-lg mx-auto">
        <line x1="0" y1={cy} x2={sw} y2={cy} stroke="#e2e8f0" strokeWidth="0.8" strokeDasharray="4 3" />
        {iscut ? (
          <>
            <polygon points={`${cx - halfR * scale - st.leftCut * scale},${groundY} ${cx - halfR * scale},${cy} ${cx + halfR * scale},${cy} ${cx + halfR * scale + st.rightCut * scale},${groundY}`} fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
            <line x1={cx - halfR * scale - st.leftCut * scale} y1={groundY} x2={cx + halfR * scale + st.rightCut * scale} y2={groundY} stroke="#94a3b8" strokeWidth="1.5" />
          </>
        ) : (
          <>
            <polygon points={`${cx - halfR * scale - st.leftFill * scale},${cy} ${cx - halfR * scale},${groundY} ${cx + halfR * scale},${groundY} ${cx + halfR * scale + st.rightFill * scale},${cy}`} fill="#dcfce7" stroke="#16a34a" strokeWidth="1.5" />
            <line x1={cx - halfR * scale - st.leftFill * scale} y1={cy} x2={cx + halfR * scale + st.rightFill * scale} y2={cy} stroke="#94a3b8" strokeWidth="1.5" />
          </>
        )}
        <rect x={cx - halfR * scale} y={cy - 5} width={halfR * 2 * scale} height={5} fill="#374151" />
        <rect x={cx - asm.laneW * scale} y={cy - 5} width={asm.laneW * 2 * scale} height={5} fill="#4b5563" />
        <line x1={cx} y1={cy - 5} x2={cx} y2={cy} stroke="white" strokeWidth="1" strokeDasharray="3 2" />
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="9" fill="#374151">{(asm.laneW * 2).toFixed(1)} м пр.ч.</text>
        <text x={cx} y={sh - 8} textAnchor="middle" fontSize="10" fill={iscut ? "#b45309" : "#15803d"} fontWeight="600">
          ПК{Math.floor(st.pk / 100)}+{String(st.pk % 100).padStart(2, "0")} · {iscut ? `Выемка ${st.cutArea} м²` : `Насыпь ${st.fillArea} м²`}
        </text>
      </svg>
    )
  }

  const formatPK = (pk: number) => `ПК${Math.floor(pk / 100)}+${String(pk % 100).padStart(2, "0")}`

  const exportCorridorLandXML = () => {
    экспортLandXML({
      имя: `Коридор ${length}м`,
      коридоры: [{ name: "Коридор", length, stations: stations.map(s => ({ pk: s.pk, cut: s.cutArea, fill: s.fillArea })) }],
    }, "corridor.xml")
  }

  const exportCorridorCSV = () => {
    экспортCSV(
      ["Пикет", "Отм.земли", "Отм.проект", "Вык.лев", "Вык.пр", "Нас.лев", "Нас.пр", "Пл.выемки", "Пл.насыпи", "Об.выемки", "Об.насыпи"],
      stations.map(s => [
        formatPK(s.pk),
        s.groundElev.toFixed(2),
        s.designElev.toFixed(2),
        s.leftCut.toFixed(2),
        s.rightCut.toFixed(2),
        s.leftFill.toFixed(2),
        s.rightFill.toFixed(2),
        s.cutArea.toFixed(2),
        s.fillArea.toFixed(2),
        (s.cutArea * step / 1000).toFixed(1),
        (s.fillArea * step / 1000).toFixed(1),
      ]),
      "corridor_volumes.csv"
    )
  }

  const exportCrossSections = () => {
    экспортCSV(
      ["Пикет", "Пл.выемки м²", "Пл.насыпи м²", "Тип"],
      stations.map(s => [formatPK(s.pk), s.cutArea.toFixed(2), s.fillArea.toFixed(2), s.cutArea > s.fillArea ? "Выемка" : "Насыпь"]),
      "cross_sections.csv"
    )
  }

  const corridorDXFОбъекты = () =>
    stations.filter((_, i) => i % 5 === 0).map(s => ({
      тип: "LINE" as const,
      данные: [s.pk / 10, s.groundElev, 0, s.pk / 10, s.designElev, 0],
      слой: "CORRIDOR",
    }))

  const exportCorridorDXF = () => экспортDXF(corridorDXFОбъекты(), "corridor.dxf")
  const exportCorridorDWG = () => экспортDWG(corridorDXFОбъекты(), "corridor.dwg")

  const exportCorridorIFC = () => {
    экспортIFC(
      [{ тип: "IfcRoad", имя: `Коридор ${length}м`, guid: crypto.randomUUID?.() || "corridor-001", описание: `Длина ${length}м, шаг ${step}м` }],
      "corridor.ifc"
    )
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Tabs defaultValue="params">
        <TabsList className="mb-4">
          <TabsTrigger value="params">Параметры коридора</TabsTrigger>
          <TabsTrigger value="profile">Продольный профиль</TabsTrigger>
          <TabsTrigger value="cross">Поперечники</TabsTrigger>
          <TabsTrigger value="volumes">Объёмы</TabsTrigger>
          <TabsTrigger value="export">Экспорт</TabsTrigger>
          <TabsTrigger value="cat-corridor">Трассы и коридоры</TabsTrigger>
        </TabsList>

        <TabsContent value="params" className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>Шаблон поперечного сечения (Assembly)</Label>
                <Select value={assembly} onValueChange={setAssembly}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{ASSEMBLIES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Длина трассы (м)</Label><Input type="number" value={length} onChange={e => setLength(+e.target.value)} /></div>
                <div><Label>Шаг пикетирования (м)</Label><Input type="number" value={step} onChange={e => setStep(+e.target.value)} /></div>
                <div><Label>Нач. отметка (м)</Label><Input type="number" step="0.1" value={startElev} onChange={e => setStartElev(+e.target.value)} /></div>
                <div><Label>Уклон 1 (‰)</Label><Input type="number" step="0.5" value={slope1} onChange={e => setSlope1(+e.target.value)} /></div>
                <div><Label>Уклон 2 (‰)</Label><Input type="number" step="0.5" value={slope2} onChange={e => setSlope2(+e.target.value)} /></div>
              </div>
              <Button onClick={() => { setComputed(true); setActivePk(0) }} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                <Icon name="Play" size={16} /> Построить коридор
              </Button>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-2 text-sm">
              <h3 className="font-bold text-gray-800 mb-3">Параметры шаблона</h3>
              {[
                ["Ширина полосы", `${asm.laneW} м`],
                ["Ширина обочины", `${asm.shoulderW} м`],
                ["Ширина проезжей части", `${asm.laneW * 2} м`],
                ["Откос выемки", `1:${asm.cutSlope}`],
                ["Откос насыпи", `1:${asm.fillSlope}`],
                ["Пикетов в коридоре", computed ? `${stations.length}` : "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-gray-200 pb-1">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-semibold text-gray-800">{v}</span>
                </div>
              ))}
              {computed && (
                <>
                  <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="text-gray-500">Объём выемки</span>
                    <span className="font-semibold text-red-600">{totalCut.toFixed(0)} м³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Объём насыпи</span>
                    <span className="font-semibold text-green-600">{totalFill.toFixed(0)} м³</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="profile">
          {!computed ? (
            <div className="text-center py-16 text-muted-foreground"><Icon name="Play" size={32} className="mx-auto mb-3 text-gray-300" /><p>Постройте коридор на первой вкладке</p></div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="font-semibold text-gray-800 mb-4">Продольный профиль коридора</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={profileData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} /><stop offset="95%" stopColor="#94a3b8" stopOpacity={0} /></linearGradient>
                    <linearGradient id="dGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="pk" tickFormatter={v => `ПК${Math.floor(+v / 100)}`} tick={{ fontSize: 10 }} />
                  <YAxis domain={["auto", "auto"]} unit=" м" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number, n: string) => [`${v} м`, n]} />
                  <Area type="monotone" dataKey="Рельеф" stroke="#64748b" strokeWidth={2} fill="url(#gGrad)" dot={false} />
                  <Area type="monotone" dataKey="Проектная" stroke="#6366f1" strokeWidth={2.5} fill="url(#dGrad)" dot={false} strokeDasharray="5 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </TabsContent>

        <TabsContent value="cross">
          {!computed ? (
            <div className="text-center py-16 text-muted-foreground"><Icon name="Play" size={32} className="mx-auto mb-3 text-gray-300" /><p>Постройте коридор на первой вкладке</p></div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Label>Пикет:</Label>
                <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm" value={activePk} onChange={e => setActivePk(+e.target.value)}>
                  {stations.map(s => <option key={s.pk} value={s.pk}>ПК{Math.floor(s.pk / 100)}+{String(s.pk % 100).padStart(2, "0")}</option>)}
                </select>
                <button onClick={() => { const i = stations.findIndex(s => s.pk === activePk); if (i > 0) setActivePk(stations[i - 1].pk) }} className="p-1 rounded hover:bg-gray-100"><Icon name="ChevronLeft" size={18} /></button>
                <button onClick={() => { const i = stations.findIndex(s => s.pk === activePk); if (i < stations.length - 1) setActivePk(stations[i + 1].pk) }} className="p-1 rounded hover:bg-gray-100"><Icon name="ChevronRight" size={18} /></button>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <CrossSection st={activeStation} />
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                {activeStation && [
                  ["Отметка рельефа", `${activeStation.groundElev} м`],
                  ["Проектная отметка", `${activeStation.designElev} м`],
                  ["Площадь сечения", `${(activeStation.cutArea || activeStation.fillArea)} м²`],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="text-xs text-muted-foreground mb-1">{k}</div>
                    <div className="text-xl font-extrabold text-gray-900">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="volumes">
          {!computed ? (
            <div className="text-center py-16 text-muted-foreground"><Icon name="Play" size={32} className="mx-auto mb-3 text-gray-300" /><p>Постройте коридор на первой вкладке</p></div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Объём выемки", value: `${totalCut.toFixed(0)} м³`, color: "text-red-600" },
                  { label: "Объём насыпи", value: `${totalFill.toFixed(0)} м³`, color: "text-green-600" },
                  { label: "Баланс", value: `${(totalCut - totalFill).toFixed(0)} м³`, color: (totalCut - totalFill) > 0 ? "text-red-600" : "text-green-600" },
                ].map(c => (
                  <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-5">
                    <div className="text-xs text-muted-foreground mb-1">{c.label}</div>
                    <div className={`text-3xl font-extrabold ${c.color}`}>{c.value}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="font-semibold text-gray-800 mb-4">Распределение объёмов по трассе</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="pk" tickFormatter={v => `ПК${Math.floor(+v / 100)}`} tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} unit=" м²" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Выемка" fill="#ef4444" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Насыпь" fill="#10b981" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </TabsContent>

        {/* EXPORT */}
        <TabsContent value="export" className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
            <h3 className="font-semibold text-gray-800 mb-2">Экспорт данных коридора</h3>
            {!computed && (
              <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-4 py-2">Сначала постройте коридор на вкладке «Параметры».</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button onClick={exportCorridorLandXML} variant="outline" className="gap-2 justify-start" disabled={!computed}>
                <Icon name="Download" size={16} /> LandXML — коридор
              </Button>
              <Button onClick={exportCorridorCSV} variant="outline" className="gap-2 justify-start" disabled={!computed}>
                <Icon name="Download" size={16} /> CSV — объёмы по пикетам
              </Button>
              <Button onClick={exportCrossSections} variant="outline" className="gap-2 justify-start" disabled={!computed}>
                <Icon name="Download" size={16} /> CSV — поперечные сечения
              </Button>
              <Button onClick={exportCorridorDXF} variant="outline" className="gap-2 justify-start" disabled={!computed}>
                <Icon name="Download" size={16} /> DXF — профиль (AutoCAD)
              </Button>
              <Button onClick={exportCorridorDWG} variant="outline" className="gap-2 justify-start" disabled={!computed}>
                <Icon name="FileDown" size={16} /> DWG — профиль (AutoCAD)
              </Button>
              <Button onClick={exportCorridorIFC} variant="outline" className="gap-2 justify-start" disabled={!computed}>
                <Icon name="Download" size={16} /> IFC — BIM-модель
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Все файлы формируются в браузере без сервера и сохраняются локально.</p>
          </div>
        </TabsContent>
        <TabsContent value="cat-corridor"><CategoryFeaturesGrid category="corridor" /></TabsContent>
      </Tabs>
    </motion.div>
  )
}