import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import VersionFeaturesPanel from "@/modules/VersionFeaturesPanel"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { экспортCSV, экспортLandXML } from "@/utils/exportImport"

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

interface NetNode {
  id: number
  name: string          // имя колодца/узла
  ground: number        // отметка земли (устья), м
  invert: number        // отметка лотка / дна, м
  kind: string          // тип узла (колодец, камера, ЩР…)
}

type NetType = "water" | "sewer" | "heat" | "power"

interface NetConfig {
  label: string
  icon: string
  color: string
  materials: string[]
  flowLabel: string          // подпись поля "нагрузки" (расход / тепло / ток)
  flowUnit: string
  vMin: number               // норма скорости/нагрузки — нижняя
  vMax: number               // верхняя
  vLabel: string             // что показываем в колонке скорости
  norm: string               // строка нормативов
  isElectric?: boolean       // электросети считаем иначе (ток вместо скорости)
  nodeName: string           // как называется узел (Колодец / Камера / Щит)
  nodeKinds: string[]        // варианты типов узлов
}

const NET_CONFIG: Record<NetType, NetConfig> = {
  water: {
    label: "Водопровод", icon: "Droplets", color: "#2563eb",
    materials: ["ПВХ", "Сталь", "Чугун", "ПНД (HDPE)", "Медь"],
    flowLabel: "Расход", flowUnit: "л/с",
    vMin: 0.7, vMax: 3.0, vLabel: "v (м/с)",
    norm: "Норма скорости: 0.7–3.0 м/с (СП 31.13330)",
    nodeName: "Колодец", nodeKinds: ["Водопроводный", "Пожарный гидрант", "Водомерный узел", "Задвижка"],
  },
  sewer: {
    label: "Канализация", icon: "ArrowDownToLine", color: "#7c3aed",
    materials: ["ПВХ", "Полипропилен", "Чугун", "Керамика", "Железобетон"],
    flowLabel: "Расход", flowUnit: "л/с",
    vMin: 0.7, vMax: 4.0, vLabel: "v (м/с)",
    norm: "Самотёчная: v ≥ 0.7 м/с, наполнение ≤ 0.6, мин. уклон i (СП 32.13330)",
    nodeName: "Колодец", nodeKinds: ["Смотровой", "Перепадный", "Поворотный", "КНС"],
  },
  heat: {
    label: "Теплосеть", icon: "Flame", color: "#ea580c",
    materials: ["Сталь ППУ", "Сталь оцинк.", "Гибкая ПЭ-Х", "Сталь в ППМ"],
    flowLabel: "Расход теплоносителя", flowUnit: "т/ч",
    vMin: 0.5, vMax: 3.5, vLabel: "v (м/с)",
    norm: "Скорость воды: 0.5–3.5 м/с. Тепловые потери учитывают изоляцию (СП 124.13330)",
    nodeName: "Камера", nodeKinds: ["Тепловая камера", "Неподвижная опора", "ИТП", "Дренажный колодец"],
  },
  power: {
    label: "Электросети", icon: "Zap", color: "#ca8a04",
    materials: ["АВВГ (алюм.)", "ВВГ (медь)", "СИП", "АПвПу", "ПвВ"],
    flowLabel: "Мощность", flowUnit: "кВт",
    vMin: 0, vMax: 100, vLabel: "I (А)",
    norm: "Ток нагрузки не должен превышать допустимый для сечения кабеля (ПУЭ гл. 1.3)",
    isElectric: true,
    nodeName: "Узел", nodeKinds: ["Трансформаторная ТП", "Распределит. щит ЩР", "Вводное устройство ВРУ", "Кабельный колодец"],
  },
}

const DEFAULT_NODES: Record<NetType, NetNode[]> = {
  water: [
    { id: 1, name: "У-1", ground: 122.4, invert: 120.6, kind: "Водомерный узел" },
    { id: 2, name: "У-2", ground: 122.1, invert: 120.2, kind: "Задвижка" },
    { id: 3, name: "У-3", ground: 121.7, invert: 119.7, kind: "Водопроводный" },
    { id: 4, name: "У-4", ground: 121.2, invert: 119.1, kind: "Пожарный гидрант" },
  ],
  sewer: [
    { id: 1, name: "КК-1", ground: 122.4, invert: 119.8, kind: "Смотровой" },
    { id: 2, name: "КК-2", ground: 122.0, invert: 119.1, kind: "Поворотный" },
    { id: 3, name: "КК-3", ground: 121.5, invert: 118.4, kind: "Перепадный" },
    { id: 4, name: "ГКНС", ground: 121.0, invert: 117.6, kind: "КНС" },
  ],
  heat: [
    { id: 1, name: "ТК-1", ground: 122.4, invert: 120.9, kind: "Тепловая камера" },
    { id: 2, name: "ТК-2", ground: 122.0, invert: 120.5, kind: "Неподвижная опора" },
    { id: 3, name: "ИТП-1", ground: 121.6, invert: 118.8, kind: "ИТП" },
  ],
  power: [
    { id: 1, name: "ТП-1", ground: 122.4, invert: 120.9, kind: "Трансформаторная ТП" },
    { id: 2, name: "ЩР-1", ground: 122.0, invert: 121.2, kind: "Распределит. щит ЩР" },
    { id: 3, name: "ЩР-2", ground: 121.6, invert: 120.8, kind: "Распределит. щит ЩР" },
  ],
}

const DEFAULT_DATA: Record<NetType, Pipe[]> = {
  water: [
    { id: 1, from: "У-1", to: "У-2", length: 120, diameter: 200, material: "ПВХ", flow: 15, slope: 0.003 },
    { id: 2, from: "У-2", to: "У-3", length: 85, diameter: 160, material: "ПВХ", flow: 10, slope: 0.004 },
    { id: 3, from: "У-3", to: "У-4", length: 200, diameter: 250, material: "Сталь", flow: 25, slope: 0.002 },
  ],
  sewer: [
    { id: 1, from: "КК-1", to: "КК-2", length: 90, diameter: 200, material: "ПВХ", flow: 8, slope: 0.008 },
    { id: 2, from: "КК-2", to: "КК-3", length: 110, diameter: 250, material: "ПВХ", flow: 14, slope: 0.006 },
    { id: 3, from: "КК-3", to: "ГКНС", length: 160, diameter: 315, material: "Полипропилен", flow: 22, slope: 0.005 },
  ],
  heat: [
    { id: 1, from: "ТК-1", to: "ТК-2", length: 140, diameter: 100, material: "Сталь ППУ", flow: 12, slope: 0.002 },
    { id: 2, from: "ТК-2", to: "ИТП-1", length: 75, diameter: 80, material: "Сталь ППУ", flow: 7, slope: 0.002 },
  ],
  power: [
    { id: 1, from: "ТП-1", to: "ЩР-1", length: 60, diameter: 95, material: "АВВГ (алюм.)", flow: 120, slope: 0 },
    { id: 2, from: "ЩР-1", to: "ЩР-2", length: 45, diameter: 50, material: "ВВГ (медь)", flow: 60, slope: 0 },
  ],
}

function calcVelocity(flow: number, diameter: number): number {
  const area = Math.PI * (diameter / 1000 / 2) ** 2
  if (area <= 0) return 0
  return parseFloat((flow / 1000 / area).toFixed(2))
}

// Ток для электросетей: I = P / (√3 · U · cosφ), U=0.38 кВ, cosφ=0.92
function calcCurrent(powerKw: number): number {
  return parseFloat((powerKw / (Math.sqrt(3) * 0.38 * 0.92)).toFixed(1))
}

function calcHeadLoss(pipe: Pipe): number {
  const v = calcVelocity(pipe.flow, pipe.diameter)
  const roughness = pipe.material.includes("Сталь") ? 0.046 : pipe.material.includes("Чугун") ? 0.26 : 0.007
  const re = (v * pipe.diameter / 1000) / 1e-6
  if (re < 1) return 0
  const f = roughness > 0 ? 0.25 / Math.log10(roughness / (3.7 * pipe.diameter / 1000) + 5.74 / re ** 0.9) ** 2 : 0.02
  return parseFloat((f * pipe.length / (pipe.diameter / 1000) * v ** 2 / (2 * 9.81)).toFixed(2))
}

// Падение напряжения для электросетей (%), ρ_al=0.028, U=380В
function calcVoltDrop(pipe: Pipe): number {
  const I = calcCurrent(pipe.flow)
  const rho = pipe.material.includes("медь") ? 0.0175 : 0.028
  const dU = (Math.sqrt(3) * I * rho * pipe.length / Math.max(1, pipe.diameter)) / 380 * 100
  return parseFloat(dU.toFixed(2))
}

export default function NetworksModule() {
  const [networkType, setNetworkType] = useState<NetType>("water")
  const [dataByType, setDataByType] = useState<Record<NetType, Pipe[]>>(DEFAULT_DATA)
  const [formByType, setFormByType] = useState<Record<NetType, { from: string; to: string; length: string; diameter: string; material: string; flow: string; slope: string }>>({
    water: { from: "", to: "", length: "", diameter: "", material: NET_CONFIG.water.materials[0], flow: "", slope: "" },
    sewer: { from: "", to: "", length: "", diameter: "", material: NET_CONFIG.sewer.materials[0], flow: "", slope: "" },
    heat: { from: "", to: "", length: "", diameter: "", material: NET_CONFIG.heat.materials[0], flow: "", slope: "" },
    power: { from: "", to: "", length: "", diameter: "", material: NET_CONFIG.power.materials[0], flow: "", slope: "" },
  })

  const [nodesByType, setNodesByType] = useState<Record<NetType, NetNode[]>>(DEFAULT_NODES)
  const [nodeForm, setNodeForm] = useState({ name: "", ground: "", invert: "", kind: NET_CONFIG.water.nodeKinds[0] })

  const cfg = NET_CONFIG[networkType]
  const pipes = dataByType[networkType]
  const form = formByType[networkType]
  const nodes = nodesByType[networkType]

  const setPipes = (updater: (prev: Pipe[]) => Pipe[]) =>
    setDataByType(d => ({ ...d, [networkType]: updater(d[networkType]) }))
  const setForm = (updater: (prev: typeof form) => typeof form) =>
    setFormByType(f => ({ ...f, [networkType]: updater(f[networkType]) }))
  const setNodes = (updater: (prev: NetNode[]) => NetNode[]) =>
    setNodesByType(n => ({ ...n, [networkType]: updater(n[networkType]) }))

  const addNode = () => {
    if (!nodeForm.name || !nodeForm.ground) return
    const ground = +nodeForm.ground
    const invert = nodeForm.invert ? +nodeForm.invert : +(ground - 2).toFixed(2)
    setNodes(prev => [...prev, { id: Date.now(), name: nodeForm.name, ground, invert, kind: nodeForm.kind }])
    setNodeForm({ name: "", ground: "", invert: "", kind: cfg.nodeKinds[0] })
  }
  const removeNode = (id: number) => setNodes(prev => prev.filter(n => n.id !== id))

  // Автосоздание узлов из участков, которых ещё нет в списке
  const syncNodesFromPipes = () => {
    const existing = new Set(nodes.map(n => n.name))
    const newNames: string[] = []
    pipes.forEach(p => { [p.from, p.to].forEach(nm => { if (nm && !existing.has(nm) && !newNames.includes(nm)) newNames.push(nm) }) })
    if (!newNames.length) return
    const base = nodes.length ? nodes[0].ground : 122
    setNodes(prev => [...prev, ...newNames.map((nm, i) => ({ id: Date.now() + i, name: nm, ground: +(base - i * 0.3).toFixed(2), invert: +(base - i * 0.3 - 2).toFixed(2), kind: cfg.nodeKinds[0] }))])
  }

  const metric = (p: Pipe) => cfg.isElectric ? calcCurrent(p.flow) : calcVelocity(p.flow, p.diameter)
  const secondary = (p: Pipe) => cfg.isElectric ? calcVoltDrop(p) : calcHeadLoss(p)

  const addPipe = () => {
    if (!form.from || !form.to || !form.length || !form.diameter) return
    setPipes(prev => [...prev, {
      id: Date.now(), from: form.from, to: form.to, length: +form.length, diameter: +form.diameter,
      material: form.material, flow: +form.flow || 10, slope: +form.slope || (cfg.isElectric ? 0 : 0.003),
    }])
    setForm(() => ({ from: "", to: "", length: "", diameter: "", material: cfg.materials[0], flow: "", slope: "" }))
  }

  const removePipe = (id: number) => setPipes(p => p.filter(x => x.id !== id))

  const totalLength = pipes.reduce((s, p) => s + p.length, 0)
  const maxMetric = pipes.length ? Math.max(...pipes.map(metric)) : 0
  const totalSecondary = pipes.reduce((s, p) => s + secondary(p), 0)

  const chartData = pipes.map(p => ({
    name: `${p.from}→${p.to}`,
    primary: metric(p),
    secondary: secondary(p),
  }))

  const specMap = new Map<string, { material: string; diameter: number; count: number; totalLength: number }>()
  pipes.forEach(p => {
    const key = `${p.material}_${p.diameter}`
    const existing = specMap.get(key)
    if (existing) { existing.count++; existing.totalLength += p.length }
    else specMap.set(key, { material: p.material, diameter: p.diameter, count: 1, totalLength: p.length })
  })
  const specRows = Array.from(specMap.values())

  const exportPipesCSV = () => {
    экспортCSV(
      ["ID", "От", "До", "Длина м", cfg.isElectric ? "Сечение мм²" : "Диаметр мм", "Материал", `${cfg.flowLabel} ${cfg.flowUnit}`, cfg.isElectric ? "Падение U %" : "Уклон"],
      pipes.map(p => [p.id, p.from, p.to, p.length, p.diameter, p.material, p.flow, cfg.isElectric ? calcVoltDrop(p) : p.slope]),
      `${networkType}_pipes.csv`
    )
  }

  const exportSpecsCSV = () => {
    экспортCSV(
      ["Материал", cfg.isElectric ? "Сечение" : "Диаметр", "Кол-во", "Общая длина м", "Доля %"],
      specRows.map(r => [
        r.material, r.diameter, r.count, r.totalLength.toFixed(1),
        totalLength > 0 ? ((r.totalLength / totalLength) * 100).toFixed(1) : "0",
      ]),
      `${networkType}_specs.csv`
    )
  }

  const exportNodesCSV = () => {
    экспортCSV(
      ["Имя", "Тип", "Отм. земли м", "Отм. лотка м", "Глубина м"],
      nodes.map(n => [n.name, n.kind, n.ground.toFixed(2), n.invert.toFixed(2), (n.ground - n.invert).toFixed(2)]),
      `${networkType}_nodes.csv`
    )
  }

  const exportNetworkLandXML = () => {
    экспортLandXML({
      имя: `Инженерные сети — ${cfg.label}`,
      трубы: pipes.map(p => ({ id: p.id, from: p.from, to: p.to, length: p.length, diameter: p.diameter, material: p.material })),
    }, `${networkType}_network.xml`)
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex gap-3 flex-wrap">
        {(Object.keys(NET_CONFIG) as NetType[]).map(t => {
          const c = NET_CONFIG[t]
          const active = networkType === t
          return (
            <button key={t} onClick={() => setNetworkType(t)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${active ? "text-white shadow" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              style={active ? { background: c.color } : {}}>
              <Icon name={c.icon} size={15} fallback="Circle" />
              {c.label}
              <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${active ? "bg-white/25" : "bg-gray-200 text-gray-500"}`}>{dataByType[t].length}</span>
            </button>
          )
        })}
      </div>

      <Tabs defaultValue="pipes">
        <TabsList className="mb-4">
          <TabsTrigger value="pipes">{cfg.isElectric ? "Кабели" : "Трубопроводы"}</TabsTrigger>
          <TabsTrigger value="hydraulics">{cfg.isElectric ? "Расчёт нагрузок" : "Гидравлика"}</TabsTrigger>
          <TabsTrigger value="nodes">{cfg.nodeName === "Узел" ? "Узлы" : `${cfg.nodeName}ы и узлы`}</TabsTrigger>
          <TabsTrigger value="schema">Схема сети</TabsTrigger>
          <TabsTrigger value="export">Экспорт</TabsTrigger>
        </TabsList>

        {/* PIPES */}
        <TabsContent value="pipes" className="space-y-4">
          <div className="rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: cfg.color + "14", color: cfg.color }}>
            <Icon name={cfg.icon} size={14} fallback="Circle" className="inline mr-1.5 -mt-0.5" />Настройка сети: {cfg.label}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><Label>От узла</Label><Input placeholder={networkType === "sewer" ? "КК-1" : networkType === "power" ? "ТП-1" : "У-1"} value={form.from} onChange={e => setForm(f => ({ ...f, from: e.target.value }))} /></div>
            <div><Label>До узла</Label><Input placeholder={networkType === "sewer" ? "КК-2" : "ЩР-1"} value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))} /></div>
            <div><Label>Длина (м)</Label><Input type="number" placeholder="100" value={form.length} onChange={e => setForm(f => ({ ...f, length: e.target.value }))} /></div>
            <div><Label>{cfg.isElectric ? "Сечение (мм²)" : "Диаметр (мм)"}</Label><Input type="number" placeholder={cfg.isElectric ? "95" : "200"} value={form.diameter} onChange={e => setForm(f => ({ ...f, diameter: e.target.value }))} /></div>
            <div>
              <Label>Материал</Label>
              <Select value={form.material} onValueChange={v => setForm(f => ({ ...f, material: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{cfg.materials.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{cfg.flowLabel} ({cfg.flowUnit})</Label><Input type="number" step="0.1" placeholder="10" value={form.flow} onChange={e => setForm(f => ({ ...f, flow: e.target.value }))} /></div>
            {!cfg.isElectric && <div><Label>Уклон (i)</Label><Input type="number" step="0.001" placeholder="0.003" value={form.slope} onChange={e => setForm(f => ({ ...f, slope: e.target.value }))} /></div>}
          </div>
          <Button onClick={addPipe} className="text-white gap-2" style={{ background: cfg.color }}>
            <Icon name="Plus" size={16} /> Добавить участок
          </Button>

          <div className="rounded-xl border border-gray-200 overflow-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50 text-gray-500 font-semibold">
                <tr>
                  <th className="px-4 py-2 text-left">Участок</th>
                  <th className="px-4 py-2 text-right">L (м)</th>
                  <th className="px-4 py-2 text-right">{cfg.isElectric ? "S (мм²)" : "D (мм)"}</th>
                  <th className="px-4 py-2 text-left">Материал</th>
                  <th className="px-4 py-2 text-right">{cfg.flowLabel} ({cfg.flowUnit})</th>
                  <th className="px-4 py-2 text-right">{cfg.vLabel}</th>
                  <th className="px-4 py-2 text-right">{cfg.isElectric ? "ΔU %" : "Уклон"}</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {pipes.map(p => {
                  const m = metric(p)
                  const ok = cfg.isElectric ? calcVoltDrop(p) <= 5 : (m >= cfg.vMin && m <= cfg.vMax)
                  return (
                    <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2 font-semibold" style={{ color: cfg.color }}>{p.from} → {p.to}</td>
                      <td className="px-4 py-2 text-right">{p.length}</td>
                      <td className="px-4 py-2 text-right">{p.diameter}</td>
                      <td className="px-4 py-2">{p.material}</td>
                      <td className="px-4 py-2 text-right">{p.flow}</td>
                      <td className="px-4 py-2 text-right">
                        <span className={`font-mono text-xs px-2 py-0.5 rounded-full ${ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{m} {cfg.isElectric ? "А" : "м/с"}</span>
                      </td>
                      <td className="px-4 py-2 text-right font-mono">{cfg.isElectric ? `${calcVoltDrop(p)}%` : p.slope}</td>
                      <td className="px-4 py-2 text-right"><button onClick={() => removePipe(p.id)} className="text-gray-300 hover:text-red-500"><Icon name="X" size={14} /></button></td>
                    </tr>
                  )
                })}
                {pipes.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400 text-sm">Нет участков. Добавьте первый выше.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">{cfg.norm}</p>
        </TabsContent>

        {/* HYDRAULICS / LOADS */}
        <TabsContent value="hydraulics" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Суммарная длина сети", value: `${totalLength} м`, sub: `${pipes.length} участков`, color: "text-gray-900" },
              cfg.isElectric
                ? { label: "Макс. ток", value: `${maxMetric} А`, sub: "по нагрузке", color: "text-yellow-600" }
                : { label: "Макс. скорость", value: `${maxMetric} м/с`, sub: maxMetric > cfg.vMax ? "⚠ Превышение нормы!" : "В норме", color: maxMetric > cfg.vMax ? "text-red-600" : "text-green-600" },
              cfg.isElectric
                ? { label: "Макс. падение напряжения", value: `${pipes.length ? Math.max(...pipes.map(calcVoltDrop)) : 0}%`, sub: "норма ≤ 5%", color: "text-indigo-600" }
                : { label: "Суммарные потери напора", value: `${totalSecondary.toFixed(2)} м`, sub: "по Дарси-Вейсбаху", color: "text-indigo-600" },
            ].map(c => (
              <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="text-xs text-muted-foreground mb-1">{c.label}</div>
                <div className={`text-3xl font-extrabold ${c.color}`}>{c.value}</div>
                <div className="text-xs text-gray-400 mt-1">{c.sub}</div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="font-semibold text-gray-800 mb-4">{cfg.isElectric ? "Токи и падение напряжения по участкам" : "Скорости и потери напора по участкам"}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="primary" name={cfg.isElectric ? "Ток (А)" : "Скорость (м/с)"} fill={cfg.color} radius={[4, 4, 0, 0]} />
                <Bar dataKey="secondary" name={cfg.isElectric ? "Падение U (%)" : "Потери напора (м)"} fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        {/* NODES */}
        <TabsContent value="nodes" className="space-y-4">
          <div className="rounded-lg px-3 py-2 text-sm font-semibold flex items-center justify-between" style={{ background: cfg.color + "14", color: cfg.color }}>
            <span><Icon name="CircleDot" size={14} fallback="Circle" className="inline mr-1.5 -mt-0.5" />{cfg.nodeName === "Узел" ? "Узлы сети" : `${cfg.nodeName}ы и узлы`}: {cfg.label}</span>
            <button onClick={syncNodesFromPipes} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/60 hover:bg-white flex items-center gap-1" style={{ color: cfg.color }}>
              <Icon name="RefreshCw" size={12} />Создать из участков
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
            <div><Label>Имя</Label><Input placeholder={cfg.isElectric ? "ТП-1" : "КК-1"} value={nodeForm.name} onChange={e => setNodeForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Отм. земли (м)</Label><Input type="number" step="0.01" placeholder="122.40" value={nodeForm.ground} onChange={e => setNodeForm(f => ({ ...f, ground: e.target.value }))} /></div>
            <div><Label>Отм. лотка (м)</Label><Input type="number" step="0.01" placeholder="120.00" value={nodeForm.invert} onChange={e => setNodeForm(f => ({ ...f, invert: e.target.value }))} /></div>
            <div>
              <Label>Тип</Label>
              <Select value={nodeForm.kind} onValueChange={v => setNodeForm(f => ({ ...f, kind: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{cfg.nodeKinds.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={addNode} className="text-white gap-2" style={{ background: cfg.color }}><Icon name="Plus" size={16} />Добавить</Button>
          </div>

          <div className="rounded-xl border border-gray-200 overflow-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-gray-50 text-gray-500 font-semibold">
                <tr>
                  <th className="px-4 py-2 text-left">{cfg.nodeName}</th>
                  <th className="px-4 py-2 text-left">Тип</th>
                  <th className="px-4 py-2 text-right">Отм. земли, м</th>
                  <th className="px-4 py-2 text-right">Отм. лотка, м</th>
                  <th className="px-4 py-2 text-right">Глубина, м</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {nodes.map(n => {
                  const depth = +(n.ground - n.invert).toFixed(2)
                  const deep = depth > 3
                  return (
                    <tr key={n.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2 font-semibold" style={{ color: cfg.color }}>{n.name}</td>
                      <td className="px-4 py-2 text-gray-600">{n.kind}</td>
                      <td className="px-4 py-2 text-right font-mono">{n.ground.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-mono">{n.invert.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">
                        <span className={`font-mono text-xs px-2 py-0.5 rounded-full ${deep ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>{depth} м</span>
                      </td>
                      <td className="px-4 py-2 text-right"><button onClick={() => removeNode(n.id)} className="text-gray-300 hover:text-red-500"><Icon name="X" size={14} /></button></td>
                    </tr>
                  )
                })}
                {nodes.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400 text-sm">Нет узлов. Добавьте вручную или нажмите «Создать из участков».</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: `Всего ${cfg.nodeName.toLowerCase()}ов`, value: nodes.length },
              { label: "Макс. глубина", value: `${nodes.length ? Math.max(...nodes.map(n => +(n.ground - n.invert).toFixed(2))) : 0} м` },
              { label: "Ср. глубина", value: `${nodes.length ? (nodes.reduce((s, n) => s + (n.ground - n.invert), 0) / nodes.length).toFixed(2) : 0} м` },
              { label: "Перепад отметок", value: `${nodes.length ? (Math.max(...nodes.map(n => n.ground)) - Math.min(...nodes.map(n => n.ground))).toFixed(2) : 0} м` },
            ].map(c => (
              <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="text-xs text-muted-foreground mb-1">{c.label}</div>
                <div className="text-xl font-extrabold text-gray-900">{c.value}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Глубина = отметка земли − отметка лотка. Оранжевым отмечены узлы глубже 3 м (требуют усиленной конструкции).</p>
        </TabsContent>

        {/* SCHEMA */}
        <TabsContent value="schema">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Принципиальная схема сети — {cfg.label}</h3>
            <svg viewBox="0 0 600 300" className="w-full max-w-2xl mx-auto">
              {pipes.map((p, i) => {
                const x1 = 80 + i * 140, y1 = 80 + (i % 2) * 80
                const x2 = x1 + 100, y2 = y1 + (i % 3 === 1 ? 80 : 0)
                const m = metric(p)
                const ok = cfg.isElectric ? calcVoltDrop(p) <= 5 : (m >= cfg.vMin && m <= cfg.vMax)
                const color = ok ? cfg.color : "#ef4444"
                return (
                  <g key={p.id}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={Math.max(2, p.diameter / 60)} />
                    <circle cx={x1} cy={y1} r="8" fill="white" stroke={color} strokeWidth="2" />
                    <circle cx={x2} cy={y2} r="8" fill="white" stroke={color} strokeWidth="2" />
                    <text x={x1} y={y1 + 22} textAnchor="middle" fontSize="9" fill="#374151">{p.from}</text>
                    <text x={x2} y={y2 + 22} textAnchor="middle" fontSize="9" fill="#374151">{p.to}</text>
                    <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 8} textAnchor="middle" fontSize="9" fill={color}>{cfg.isElectric ? `${p.diameter}мм²` : `Ø${p.diameter}`}</text>
                    <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 + 4} textAnchor="middle" fontSize="8" fill="#6b7280">{m} {cfg.isElectric ? "А" : "м/с"}</text>
                  </g>
                )
              })}
              <g transform="translate(20,250)">
                {[[cfg.color, "В норме"], ["#ef4444", cfg.isElectric ? "Превышение ΔU" : "Нарушение нормы"]].map(([c, l], i) => (
                  <g key={l} transform={`translate(${i * 180},0)`}>
                    <line x1="0" y1="6" x2="16" y2="6" stroke={c} strokeWidth="2" />
                    <text x="20" y="10" fontSize="9" fill="#6b7280">{l}</text>
                  </g>
                ))}
              </g>
            </svg>
          </div>
        </TabsContent>

        {/* EXPORT */}
        <TabsContent value="export" className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
            <h3 className="font-semibold text-gray-800 mb-2">Экспорт данных сети — {cfg.label}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button onClick={exportPipesCSV} variant="outline" className="gap-2 justify-start">
                <Icon name="Download" size={16} /> CSV — {cfg.isElectric ? "кабели" : "трубопроводы"}
              </Button>
              <Button onClick={exportSpecsCSV} variant="outline" className="gap-2 justify-start">
                <Icon name="Download" size={16} /> CSV — спецификация материалов
              </Button>
              <Button onClick={exportNodesCSV} variant="outline" className="gap-2 justify-start">
                <Icon name="Download" size={16} /> CSV — {cfg.nodeName.toLowerCase()}ы и отметки
              </Button>
              <Button onClick={exportNetworkLandXML} variant="outline" className="gap-2 justify-start">
                <Icon name="Download" size={16} /> LandXML — {cfg.label}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Экспортируется текущая сеть ({cfg.label}, {pipes.length} участков). Все файлы формируются в браузере без сервера.</p>
          </div>
        </TabsContent>
      </Tabs>
      <VersionFeaturesPanel categories={["network"]} />
    </motion.div>
  )
}