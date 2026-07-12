import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import VersionFeaturesPanel from "@/modules/VersionFeaturesPanel"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { экспортCSV, экспортLandXML, экспортТекст, экспортDXF, экспортDWG } from "@/utils/exportImport"

interface VPI { id: number; pk: number; elev: number; vcl: number }
interface HorzCurve { id: number; pk: number; radius: number; delta: number; type: "right" | "left" }

function calcVCurve(vpi: VPI, prev: VPI | null, next: VPI | null) {
  if (!prev || !next) return null
  const g1 = (vpi.elev - prev.elev) / (vpi.pk - prev.pk) * 1000
  const g2 = (next.elev - vpi.elev) / (next.pk - vpi.pk) * 1000
  const A = Math.abs(g2 - g1)
  const L = vpi.vcl
  const K = A > 0 ? L / A : 0
  const type = g2 > g1 ? "выпуклая" : "вогнутая"
  const minK_convex = 2500, minK_concave = 1000
  const ok = type === "выпуклая" ? K >= minK_convex : K >= minK_concave
  return { g1: +g1.toFixed(2), g2: +g2.toFixed(2), A: +A.toFixed(2), L, K: +K.toFixed(0), type, ok }
}

function clothoid(radius: number, speed: number): number {
  return Math.round((speed / 3.6) ** 3 / (0.6 * radius * 9.81) * 10) * 10
}

function generateProfile(vpis: VPI[]): { pk: number; elev: number }[] {
  if (vpis.length < 2) return vpis.map(v => ({ pk: v.pk, elev: v.elev }))
  const pts: { pk: number; elev: number }[] = []
  for (let i = 0; i < vpis.length - 1; i++) {
    const a = vpis[i], b = vpis[i + 1]
    const steps = Math.max(2, Math.round((b.pk - a.pk) / 20))
    for (let j = 0; j <= steps; j++) {
      const t = j / steps
      pts.push({ pk: a.pk + (b.pk - a.pk) * t, elev: +(a.elev + (b.elev - a.elev) * t).toFixed(3) })
    }
  }
  return pts
}

const INIT_VPI: VPI[] = [
  { id: 1, pk: 0, elev: 120.00, vcl: 0 },
  { id: 2, pk: 500, elev: 123.50, vcl: 200 },
  { id: 3, pk: 1200, elev: 121.80, vcl: 300 },
  { id: 4, pk: 2000, elev: 125.20, vcl: 250 },
]

const INIT_HORZ: HorzCurve[] = [
  { id: 1, pk: 350, radius: 800, delta: 24.5, type: "right" },
  { id: 2, pk: 1100, radius: 600, delta: 18.2, type: "left" },
]

export default function AlignmentModule() {
  const [vpis, setVpis] = useState<VPI[]>(INIT_VPI)
  const [horzCurves, setHorzCurves] = useState<HorzCurve[]>(INIT_HORZ)
  const [speed, setSpeed] = useState(100)
  const [vpiForm, setVpiForm] = useState({ pk: "", elev: "", vcl: "" })
  const [hForm, setHForm] = useState({ pk: "", radius: "", delta: "", type: "right" as "right" | "left" })

  const profileData = useMemo(() => generateProfile(vpis), [vpis])
  const minE = Math.min(...profileData.map(p => p.elev))
  const maxE = Math.max(...profileData.map(p => p.elev))

  const addVPI = () => {
    if (!vpiForm.pk || !vpiForm.elev) return
    setVpis(prev => [...prev, { id: Date.now(), pk: +vpiForm.pk, elev: +vpiForm.elev, vcl: +vpiForm.vcl || 0 }].sort((a, b) => a.pk - b.pk))
    setVpiForm({ pk: "", elev: "", vcl: "" })
  }

  const addHorz = () => {
    if (!hForm.pk || !hForm.radius) return
    setHorzCurves(prev => [...prev, { id: Date.now(), pk: +hForm.pk, radius: +hForm.radius, delta: +hForm.delta || 10, type: hForm.type }].sort((a, b) => a.pk - b.pk))
    setHForm(f => ({ ...f, pk: "", radius: "", delta: "" }))
  }

  const minRadius = speed >= 120 ? 800 : speed >= 100 ? 600 : speed >= 80 ? 300 : 150

  const formatPK = (pk: number) => `ПК${Math.floor(pk / 100)}+${String(pk % 100).padStart(2, "0")}`

  const totalLength = vpis.length >= 2 ? vpis[vpis.length - 1].pk - vpis[0].pk : 0

  const stakeoutRows = profileData.filter((_, i) => i % 5 === 0).map((p, i) => {
    const prev = profileData[i * 5 - 5]
    const bearing = (Math.atan2(p.pk * Math.sin(0.15), p.pk * Math.cos(0.15)) * 180 / Math.PI).toFixed(4)
    const distance = i > 0 && prev ? Math.sqrt((p.pk - prev.pk) ** 2).toFixed(2) : "0"
    const inCurve = horzCurves.find(c => p.pk >= c.pk && p.pk <= c.pk + c.radius * (c.delta * Math.PI / 180))
    return {
      pk: formatPK(p.pk),
      x: (1245000 + p.pk * Math.cos(0.15)).toFixed(2),
      y: (356000 + p.pk * Math.sin(0.15)).toFixed(2),
      bearing,
      distance,
      element: inCurve ? `Кривая R=${inCurve.radius}` : "Прямая",
    }
  })

  const doExportLandXML = () => {
    экспортLandXML({
      имя: "Трасса",
      трассы: horzCurves.map(c => ({
        name: `Кривая_${c.id}`,
        length: +(c.radius * (c.delta * Math.PI / 180)).toFixed(2),
        elements: [{ radius: c.radius, delta: c.delta }],
      })),
    }, "alignment.xml")
  }

  const doExportCSV = () => {
    экспортCSV(
      ["ПК", "Радиус", "Дельта", "Длина", "Тип", "Направление"],
      horzCurves.map(c => [
        formatPK(c.pk),
        c.radius,
        c.delta,
        +(c.radius * (c.delta * Math.PI / 180)).toFixed(2),
        "Простая",
        c.type === "right" ? "Правая" : "Левая",
      ]),
      "alignment_curves.csv"
    )
  }

  const dxfОбъекты = () =>
    horzCurves.map(c => ({ тип: "ARC" as const, данные: [0, 0, c.radius, 0, c.delta], слой: "ALIGNMENT" }))

  const doExportDXF = () => экспортDXF(dxfОбъекты(), "alignment.dxf")
  const doExportDWG = () => экспортDWG(dxfОбъекты(), "alignment.dwg")

  const doExportReport = () => {
    экспортТекст([
      "ОТЧЁТ ПО ТРАССЕ",
      "================",
      `Дата: ${new Date().toLocaleDateString("ru")}`,
      `Расчётная скорость: ${speed} км/ч`,
      `Длина трассы: ${totalLength.toFixed(0)} м`,
      "",
      "ГОРИЗОНТАЛЬНЫЕ КРИВЫЕ:",
      ...horzCurves.map((c, i) => `  ${i + 1}. ПК ${formatPK(c.pk)}, R=${c.radius}м, Δ=${c.delta}°, ${c.type === "right" ? "Правая" : "Левая"}`),
      "",
      "ВЕРТИКАЛЬНЫЕ ТОЧКИ:",
      ...vpis.map((v, i) => `  ${i + 1}. ПК ${formatPK(v.pk)}, отм.=${v.elev}м, VCL=${v.vcl}м`),
    ], "alignment_report.txt")
  }

  const doExportStakeoutCSV = () => {
    экспортCSV(
      ["Пикет", "X", "Y", "Дир.угол", "Расстояние", "Элемент"],
      stakeoutRows.map(r => [r.pk, r.x, r.y, r.bearing, r.distance, r.element]),
      "stakeout.csv"
    )
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Tabs defaultValue="vertical">
        <TabsList className="mb-4">
          <TabsTrigger value="vertical">Вертикальное выравнивание</TabsTrigger>
          <TabsTrigger value="horizontal">Горизонтальное</TabsTrigger>
          <TabsTrigger value="clothoids">Переходные кривые</TabsTrigger>
          <TabsTrigger value="stakeout">Разбивочные данные</TabsTrigger>
          <TabsTrigger value="export">Экспорт</TabsTrigger>
        </TabsList>

        {/* VERTICAL */}
        <TabsContent value="vertical" className="space-y-4">
          <div className="grid grid-cols-3 gap-3 max-w-lg">
            <div><Label>Пикет ВПИ (м)</Label><Input type="number" placeholder="1500" value={vpiForm.pk} onChange={e => setVpiForm(f => ({ ...f, pk: e.target.value }))} /></div>
            <div><Label>Отметка (м)</Label><Input type="number" step="0.01" placeholder="122.50" value={vpiForm.elev} onChange={e => setVpiForm(f => ({ ...f, elev: e.target.value }))} /></div>
            <div><Label>Длина ВК (м)</Label><Input type="number" step="10" placeholder="200" value={vpiForm.vcl} onChange={e => setVpiForm(f => ({ ...f, vcl: e.target.value }))} /></div>
          </div>
          <Button onClick={addVPI} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            <Icon name="Plus" size={16} /> Добавить ВПИ
          </Button>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Проектная линия (вертикальные кривые)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={profileData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="pk" tickFormatter={v => `ПК${Math.floor(+v / 100)}`} tick={{ fontSize: 10 }} />
                <YAxis domain={[minE - 1, maxE + 1]} unit=" м" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`${v} м`, "Отметка"]} />
                {vpis.map(v => <ReferenceLine key={v.id} x={v.pk} stroke="#e0e7ff" strokeDasharray="3 3" />)}
                <Line type="monotone" dataKey="elev" stroke="#6366f1" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 font-semibold">
                <tr>
                  <th className="px-4 py-2 text-left">ВПИ</th>
                  <th className="px-4 py-2 text-right">Уклон i₁ (‰)</th>
                  <th className="px-4 py-2 text-right">Уклон i₂ (‰)</th>
                  <th className="px-4 py-2 text-right">Алгебр. разность A</th>
                  <th className="px-4 py-2 text-right">K кривой</th>
                  <th className="px-4 py-2 text-left">Тип</th>
                  <th className="px-4 py-2 text-center">Норма</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {vpis.map((v, i) => {
                  const calc = calcVCurve(v, vpis[i - 1] || null, vpis[i + 1] || null)
                  return (
                    <tr key={v.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2 font-semibold text-indigo-700">ПК{Math.floor(v.pk / 100)}+{String(v.pk % 100).padStart(2, "0")}</td>
                      <td className="px-4 py-2 text-right font-mono">{calc ? calc.g1 : "—"}</td>
                      <td className="px-4 py-2 text-right font-mono">{calc ? calc.g2 : "—"}</td>
                      <td className="px-4 py-2 text-right font-mono">{calc ? calc.A : "—"}</td>
                      <td className="px-4 py-2 text-right font-mono font-semibold">{calc ? calc.K : "—"}</td>
                      <td className="px-4 py-2 text-gray-600 text-xs">{calc ? calc.type : "—"}</td>
                      <td className="px-4 py-2 text-center">
                        {calc ? (calc.ok ? <Icon name="CheckCircle" size={16} className="text-green-500 mx-auto" /> : <Icon name="XCircle" size={16} className="text-red-500 mx-auto" />) : "—"}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {i > 0 && <button onClick={() => setVpis(p => p.filter(x => x.id !== v.id))} className="text-gray-200 hover:text-red-500"><Icon name="X" size={13} /></button>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* HORIZONTAL */}
        <TabsContent value="horizontal" className="space-y-4">
          <div className="flex items-end gap-3 flex-wrap">
            <div><Label>Расч. скорость (км/ч)</Label><Input type="number" className="w-28" value={speed} onChange={e => setSpeed(+e.target.value)} /></div>
            <div className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700 font-semibold">Мин. радиус: {minRadius} м</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl">
            <div><Label>Пикет НКК (м)</Label><Input type="number" placeholder="500" value={hForm.pk} onChange={e => setHForm(f => ({ ...f, pk: e.target.value }))} /></div>
            <div><Label>Радиус (м)</Label><Input type="number" placeholder="800" value={hForm.radius} onChange={e => setHForm(f => ({ ...f, radius: e.target.value }))} /></div>
            <div><Label>Угол поворота (°)</Label><Input type="number" step="0.1" placeholder="25.0" value={hForm.delta} onChange={e => setHForm(f => ({ ...f, delta: e.target.value }))} /></div>
            <div><Label>Направление</Label>
              <Select value={hForm.type} onValueChange={v => setHForm(f => ({ ...f, type: v as "right" | "left" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="right">Правый</SelectItem><SelectItem value="left">Левый</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={addHorz} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"><Icon name="Plus" size={16} /> Добавить кривую</Button>

          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 font-semibold">
                <tr>
                  <th className="px-4 py-2 text-left">НКК</th>
                  <th className="px-4 py-2 text-right">R (м)</th>
                  <th className="px-4 py-2 text-right">Δ (°)</th>
                  <th className="px-4 py-2 text-right">T (м)</th>
                  <th className="px-4 py-2 text-right">K (м)</th>
                  <th className="px-4 py-2 text-right">Б (м)</th>
                  <th className="px-4 py-2 text-center">Напр.</th>
                  <th className="px-4 py-2 text-center">Норма</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {horzCurves.map(c => {
                  const rad = c.delta * Math.PI / 180
                  const T = +(c.radius * Math.tan(rad / 2)).toFixed(2)
                  const K = +(c.radius * rad).toFixed(2)
                  const B = +(c.radius * (1 / Math.cos(rad / 2) - 1)).toFixed(2)
                  const ok = c.radius >= minRadius
                  return (
                    <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2 font-semibold text-indigo-700">ПК{Math.floor(c.pk / 100)}+{String(c.pk % 100).padStart(2, "0")}</td>
                      <td className="px-4 py-2 text-right font-mono">{c.radius}</td>
                      <td className="px-4 py-2 text-right font-mono">{c.delta}</td>
                      <td className="px-4 py-2 text-right font-mono">{T}</td>
                      <td className="px-4 py-2 text-right font-mono">{K}</td>
                      <td className="px-4 py-2 text-right font-mono">{B}</td>
                      <td className="px-4 py-2 text-center text-xs">{c.type === "right" ? "→ Пр." : "← Лев."}</td>
                      <td className="px-4 py-2 text-center">{ok ? <Icon name="CheckCircle" size={16} className="text-green-500 mx-auto" /> : <Icon name="XCircle" size={16} className="text-red-500 mx-auto" />}</td>
                      <td className="px-4 py-2 text-right"><button onClick={() => setHorzCurves(p => p.filter(x => x.id !== c.id))} className="text-gray-200 hover:text-red-500"><Icon name="X" size={13} /></button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">T — тангенс, K — длина кривой, Б — биссектриса (по СП 34.13330)</p>
        </TabsContent>

        {/* CLOTHOIDS */}
        <TabsContent value="clothoids" className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Расчёт клотоид (переходных кривых)</h3>
            <div className="space-y-3">
              {horzCurves.map(c => {
                const lk = clothoid(c.radius, speed)
                const A = Math.sqrt(lk * c.radius)
                const tau = lk / (2 * c.radius) * 180 / Math.PI
                const ok = lk >= 30
                return (
                  <div key={c.id} className={`rounded-xl border p-4 ${ok ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-800">ПК{Math.floor(c.pk / 100)}+{String(c.pk % 100).padStart(2, "0")} · R={c.radius} м · Δ={c.delta}°</span>
                      {ok ? <span className="text-xs text-green-700 font-semibold bg-green-100 px-2 py-0.5 rounded-full">Норма</span> : <span className="text-xs text-yellow-700 font-semibold bg-yellow-100 px-2 py-0.5 rounded-full">Мин. 30 м</span>}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      {[["Длина клотоиды Lk", `${lk} м`], ["Параметр A", `${A.toFixed(1)} м`], ["Угол τ", `${tau.toFixed(2)}°`], ["Скорость", `${speed} км/ч`]].map(([k, v]) => (
                        <div key={k}>
                          <div className="text-xs text-gray-500">{k}</div>
                          <div className="font-mono font-bold text-gray-800">{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 rounded-lg bg-indigo-50 p-3 text-xs text-indigo-700">
              Формула: Lk = v³ / (0.6 · R · g) — из условия плавного нарастания центробежного ускорения
            </div>
          </div>
        </TabsContent>

        {/* STAKEOUT */}
        <TabsContent value="stakeout" className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Разбивочные данные по пикетам</h3>
              <Button onClick={doExportStakeoutCSV} variant="outline" className="gap-2 text-sm">
                <Icon name="Download" size={15} /> Экспорт CSV
              </Button>
            </div>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 font-semibold">
                  <tr>
                    <th className="px-4 py-2 text-left">Пикет</th>
                    <th className="px-4 py-2 text-right">Проектная отметка</th>
                    <th className="px-4 py-2 text-right">Уклон (‰)</th>
                    <th className="px-4 py-2 text-right">X расч. (м)</th>
                    <th className="px-4 py-2 text-right">Y расч. (м)</th>
                    <th className="px-4 py-2 text-left">Элемент</th>
                  </tr>
                </thead>
                <tbody>
                  {profileData.filter((_, i) => i % 5 === 0).map((p, i) => {
                    const slope = i > 0 ? ((p.elev - profileData[i * 5 - 5]?.elev || 0) / 100 * 1000) : 0
                    const inCurve = horzCurves.find(c => p.pk >= c.pk && p.pk <= c.pk + c.radius * (c.delta * Math.PI / 180))
                    return (
                      <tr key={p.pk} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-2 font-semibold text-indigo-700">ПК{Math.floor(p.pk / 100)}+{String(Math.round(p.pk) % 100).padStart(2, "0")}</td>
                        <td className="px-4 py-2 text-right font-mono">{p.elev}</td>
                        <td className="px-4 py-2 text-right font-mono text-xs">{i > 0 ? slope.toFixed(1) : "0.0"}</td>
                        <td className="px-4 py-2 text-right font-mono text-xs text-gray-400">{(1245000 + p.pk * Math.cos(0.15)).toFixed(2)}</td>
                        <td className="px-4 py-2 text-right font-mono text-xs text-gray-400">{(356000 + p.pk * Math.sin(0.15)).toFixed(2)}</td>
                        <td className="px-4 py-2 text-xs text-gray-500">{inCurve ? `Кривая R=${inCurve.radius}` : "Прямая"}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* EXPORT */}
        <TabsContent value="export" className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
            <h3 className="font-semibold text-gray-800 mb-2">Экспорт данных трассы</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button onClick={doExportLandXML} variant="outline" className="gap-2 justify-start">
                <Icon name="Download" size={16} /> LandXML — горизонтальные кривые
              </Button>
              <Button onClick={doExportCSV} variant="outline" className="gap-2 justify-start">
                <Icon name="Download" size={16} /> CSV — таблица кривых
              </Button>
              <Button onClick={doExportDXF} variant="outline" className="gap-2 justify-start">
                <Icon name="Download" size={16} /> DXF — геометрия (AutoCAD)
              </Button>
              <Button onClick={doExportDWG} variant="outline" className="gap-2 justify-start">
                <Icon name="FileDown" size={16} /> DWG — чертёж (AutoCAD)
              </Button>
              <Button onClick={doExportReport} variant="outline" className="gap-2 justify-start">
                <Icon name="Download" size={16} /> TXT — отчёт по трассе
              </Button>
              <Button onClick={doExportStakeoutCSV} variant="outline" className="gap-2 justify-start">
                <Icon name="Download" size={16} /> CSV — разбивочные данные
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Все файлы формируются в браузере без сервера и сохраняются локально.</p>
          </div>
        </TabsContent>
      </Tabs>
      <VersionFeaturesPanel categories={["corridor", "draw"]} />
    </motion.div>
  )
}