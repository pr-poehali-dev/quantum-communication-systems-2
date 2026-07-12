import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Icon from "@/components/ui/icon"
import { VersionFeaturesInline } from "@/modules/VersionFeaturesPanel"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface NodeParam {
  id: string
  label: string
  value: number
  unit: string
  min: number
  max: number
  step: number
}

interface DependencyLink {
  from: string
  to: string
  formula: string
}

interface ComputedResult {
  id: string
  label: string
  value: number
  unit: string
  status: "ok" | "warn" | "error"
  history: { t: number; v: number }[]
}

const LINKS: DependencyLink[] = [
  { from: "startElev", to: "endElev", formula: "startElev + (length * slope / 100)" },
  { from: "length", to: "volume", formula: "length * width * depth" },
  { from: "slope", to: "velocity", formula: "Math.sqrt(2 * 9.81 * depth * slope / 100)" },
  { from: "width", to: "capacity", formula: "width * velocity * 3600 / 1000" },
]

export default function DynamicModule() {
  const [params, setParams] = useState<NodeParam[]>([
    { id: "startElev", label: "Начальная отметка", value: 120.0, unit: "м", min: 0, max: 500, step: 0.1 },
    { id: "length", label: "Длина трассы", value: 1500, unit: "м", min: 100, max: 10000, step: 50 },
    { id: "slope", label: "Уклон", value: 3.5, unit: "%", min: 0.1, max: 15, step: 0.1 },
    { id: "width", label: "Ширина канала", value: 4.0, unit: "м", min: 0.5, max: 20, step: 0.5 },
    { id: "depth", label: "Глубина воды", value: 1.2, unit: "м", min: 0.1, max: 5, step: 0.1 },
  ])

  const [history, setHistory] = useState<Record<string, { t: number; v: number }[]>>({})
  const [pulseId, setPulseId] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>(["Система готова. Измените параметр для запуска цепи пересчёта."])

  const [assocChain, setAssocChain] = useState([
    {id:"align", label:"Трасса ШД-38", type:"Трасса", status:"ok", deps:["profile"]},
    {id:"profile", label:"Профиль проектный", type:"Профиль", status:"ok", deps:["corridor"]},
    {id:"corridor", label:"Коридор дороги", type:"Коридор", status:"ok", deps:["volumes","surface"]},
    {id:"surface", label:"Проектная поверхность", type:"Поверхность", status:"ok", deps:["volumes"]},
    {id:"volumes", label:"Объёмы земл. работ", type:"Анализ", status:"ok", deps:["specs"]},
    {id:"specs", label:"Ведомость объёмов", type:"Спецификация", status:"updated", deps:[]},
  ])
  const [triggerUpdate, setTriggerUpdate] = useState<string | null>(null)

  const симулироватьОбновление = (startId: string) => {
    const chain = assocChain
    const visited = new Set<string>()
    const propagate = (id: string, delay: number) => {
      if (visited.has(id)) return
      visited.add(id)
      setTimeout(() => {
        setAssocChain(prev => prev.map(n => n.id === id ? {...n, status: "updating"} : n))
        setTimeout(() => {
          setAssocChain(prev => prev.map(n => n.id === id ? {...n, status: "ok"} : n))
          const node = chain.find(n => n.id === id)
          node?.deps.forEach((dep, i) => propagate(dep, (i + 1) * 400))
        }, 600)
      }, delay)
    }
    setTriggerUpdate(startId)
    propagate(startId, 0)
    setTimeout(() => setTriggerUpdate(null), 3000)
  }

  const get = useCallback((id: string) => params.find(p => p.id === id)?.value ?? 0, [params])

  const compute = useCallback((ps: NodeParam[]): ComputedResult[] => {
    const g = (id: string) => ps.find(p => p.id === id)?.value ?? 0
    const startElev = g("startElev"), length = g("length"), slope = g("slope"), width = g("width"), depth = g("depth")
    const endElev = startElev + (length * slope / 100)
    const volume = length * width * depth
    const velocity = Math.sqrt(Math.max(0, 2 * 9.81 * depth * slope / 100))
    const capacity = width * velocity * 3600 / 1000

    return [
      { id: "endElev", label: "Конечная отметка", value: parseFloat(endElev.toFixed(2)), unit: "м", status: "ok", history: [] },
      { id: "volume", label: "Объём канала", value: parseFloat(volume.toFixed(1)), unit: "м³", status: volume > 50000 ? "warn" : "ok", history: [] },
      { id: "velocity", label: "Скорость течения", value: parseFloat(velocity.toFixed(2)), unit: "м/с", status: velocity > 3 ? "error" : velocity < 0.3 ? "warn" : "ok", history: [] },
      { id: "capacity", label: "Расходная способность", value: parseFloat(capacity.toFixed(1)), unit: "м³/ч", status: "ok", history: [] },
      { id: "elevDiff", label: "Перепад отметок", value: parseFloat(Math.abs(endElev - startElev).toFixed(2)), unit: "м", status: "ok", history: [] },
    ]
  }, [])

  const [results, setResults] = useState<ComputedResult[]>(() => compute(params))

  const updateParam = (id: string, value: number) => {
    const newParams = params.map(p => p.id === id ? { ...p, value } : p)
    setParams(newParams)
    setPulseId(id)
    setTimeout(() => setPulseId(null), 800)

    const affected = LINKS.filter(l => l.from === id).map(l => l.to)
    const newResults = compute(newParams)

    setHistory(prev => {
      const next = { ...prev }
      newResults.forEach(r => {
        const hist = prev[r.id] || []
        next[r.id] = [...hist.slice(-19), { t: Date.now(), v: r.value }]
      })
      return next
    })

    setResults(newResults.map(r => ({ ...r, history: history[r.id] || [] })))

    const now = new Date().toLocaleTimeString("ru")
    setLog(prev => [
      `[${now}] ${params.find(p => p.id === id)?.label} → ${value} ${params.find(p => p.id === id)?.unit}. Пересчитано: ${affected.join(", ") || "нет зависимостей"}`,
      ...prev.slice(0, 9)
    ])
  }

  const STATUS_COLOR = { ok: "text-green-600 bg-green-50 border-green-200", warn: "text-yellow-700 bg-yellow-50 border-yellow-200", error: "text-red-600 bg-red-50 border-red-200" }
  const STATUS_ICON = { ok: "CheckCircle", warn: "AlertTriangle", error: "XCircle" }

  const chartParam = params.find(p => p.id === "slope")!
  const chartData = Array.from({ length: 20 }, (_, i) => {
    const s = 0.5 + i * 0.75
    const v = Math.sqrt(2 * 9.81 * get("depth") * s / 100)
    return { slope: s.toFixed(1), velocity: parseFloat(v.toFixed(3)) }
  })

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Tabs defaultValue="live">
        <TabsList className="mb-4">
          <TabsTrigger value="live">Динамический пересчёт</TabsTrigger>
          <TabsTrigger value="graph">Граф зависимостей</TabsTrigger>
          <TabsTrigger value="chart">Параметрический анализ</TabsTrigger>
          <TabsTrigger value="log">Журнал изменений</TabsTrigger>
          <TabsTrigger value="associativity">Ассоциативность</TabsTrigger>
          <TabsTrigger value="v2027">Функции 2022–2027</TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* INPUT PARAMS */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                <Icon name="SlidersHorizontal" size={16} className="text-indigo-500" />
                Входные параметры
              </h3>
              {params.map(p => (
                <motion.div
                  key={p.id}
                  animate={pulseId === p.id ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className={`rounded-xl border p-4 transition-colors ${pulseId === p.id ? "border-indigo-400 bg-indigo-50" : "border-gray-200 bg-white"}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm font-semibold text-gray-700">{p.label}</Label>
                    <span className="font-mono font-bold text-indigo-600">{p.value} {p.unit}</span>
                  </div>
                  <input
                    type="range"
                    min={p.min} max={p.max} step={p.step}
                    value={p.value}
                    onChange={e => updateParam(p.id, +e.target.value)}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{p.min} {p.unit}</span><span>{p.max} {p.unit}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* RESULTS */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                <Icon name="Zap" size={16} className="text-yellow-500" />
                Автоматически пересчитываемые результаты
              </h3>
              <AnimatePresence>
                {results.map(r => (
                  <motion.div
                    key={r.id}
                    layout
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`rounded-xl border p-4 flex items-center justify-between ${STATUS_COLOR[r.status]}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon name={STATUS_ICON[r.status]} size={18} fallback="Circle" />
                      <div>
                        <div className="font-semibold text-sm">{r.label}</div>
                        <div className="text-xs opacity-70">автоматически из входных параметров</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-extrabold text-xl">{r.value}</div>
                      <div className="text-xs opacity-70">{r.unit}</div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="graph">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="font-semibold text-gray-800 mb-6">Граф динамических зависимостей</h3>
            <svg viewBox="0 0 600 340" className="w-full max-w-2xl mx-auto">
              {/* Input nodes */}
              {params.map((p, i) => {
                const x = 60, y = 30 + i * 60
                return (
                  <g key={p.id}>
                    <rect x={x - 45} y={y - 16} width="90" height="32" rx="8" fill="#eef2ff" stroke="#6366f1" strokeWidth="1.5" />
                    <text x={x} y={y - 2} textAnchor="middle" fontSize="9" fill="#4338ca" fontWeight="600">{p.label}</text>
                    <text x={x} y={y + 10} textAnchor="middle" fontSize="9" fill="#6366f1">{p.value} {p.unit}</text>
                  </g>
                )
              })}

              {/* Result nodes */}
              {results.map((r, i) => {
                const x = 480, y = 50 + i * 60
                const col = r.status === "ok" ? { fill: "#f0fdf4", stroke: "#16a34a", text: "#15803d" } : r.status === "warn" ? { fill: "#fffbeb", stroke: "#d97706", text: "#92400e" } : { fill: "#fef2f2", stroke: "#dc2626", text: "#b91c1c" }
                return (
                  <g key={r.id}>
                    <rect x={x - 55} y={y - 16} width="110" height="32" rx="8" fill={col.fill} stroke={col.stroke} strokeWidth="1.5" />
                    <text x={x} y={y - 2} textAnchor="middle" fontSize="9" fill={col.text} fontWeight="600">{r.label}</text>
                    <text x={x} y={y + 10} textAnchor="middle" fontSize="9" fill={col.text}>{r.value} {r.unit}</text>
                  </g>
                )
              })}

              {/* Links */}
              {LINKS.map((l, i) => {
                const fromIdx = params.findIndex(p => p.id === l.from)
                const toIdx = results.findIndex(r => r.id === l.to)
                if (fromIdx < 0 || toIdx < 0) return null
                const x1 = 105, y1 = 30 + fromIdx * 60
                const x2 = 425, y2 = 50 + toIdx * 60
                return (
                  <g key={i}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#c7d2fe" strokeWidth="1.5" markerEnd="url(#arr)" />
                  </g>
                )
              })}
              <defs>
                <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#a5b4fc" />
                </marker>
              </defs>

              {/* Legend */}
              <g transform="translate(200,310)">
                {[["#eef2ff", "#6366f1", "Входные параметры"], ["#f0fdf4", "#16a34a", "Результат (норма)"], ["#fffbeb", "#d97706", "Предупреждение"], ["#fef2f2", "#dc2626", "Нарушение нормы"]].map(([fill, stroke, label], i) => (
                  <g key={label} transform={`translate(${i > 1 ? (i - 2) * 160 - 160 : i * 160}, ${i > 1 ? 20 : 0})`}>
                    <rect x="0" y="0" width="12" height="12" rx="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
                    <text x="16" y="10" fontSize="9" fill="#6b7280">{label}</text>
                  </g>
                ))}
              </g>
            </svg>
          </div>
        </TabsContent>

        <TabsContent value="chart">
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="font-semibold text-gray-800 mb-1">Скорость течения от уклона</h3>
              <p className="text-xs text-muted-foreground mb-4">Глубина воды: {get("depth")} м (измените ползунок на вкладке «Динамический пересчёт»)</p>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="slope" unit="%" tick={{ fontSize: 10 }} label={{ value: "Уклон (%)", position: "insideBottom", offset: -2, fontSize: 11 }} />
                  <YAxis unit=" м/с" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`${v} м/с`, "Скорость"]} />
                  <Line type="monotone" dataKey="velocity" stroke="#6366f1" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {params.map(p => (
                <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-4 text-center">
                  <div className="text-xs text-muted-foreground mb-1">{p.label}</div>
                  <div className="text-xl font-extrabold text-indigo-600">{p.value}</div>
                  <div className="text-xs text-gray-400">{p.unit}</div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="log">
          <div className="rounded-xl border border-gray-200 bg-gray-950 p-4 font-mono text-sm space-y-1 min-h-64">
            {log.map((l, i) => (
              <motion.div
                key={i}
                initial={i === 0 ? { opacity: 0, x: -8 } : {}}
                animate={{ opacity: 1, x: 0 }}
                className={`${i === 0 ? "text-green-400" : "text-gray-500"} text-xs leading-relaxed`}
              >
                {l}
              </motion.div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Изменяйте параметры — здесь появляется история пересчётов в реальном времени</p>
        </TabsContent>

        <TabsContent value="associativity" className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Icon name="Link" size={16} className="text-indigo-600"/>Ассоциативные связи объектов
              </h3>
              <Button size="sm" variant="outline" onClick={()=>симулироватьОбновление("align")} className="gap-2">
                <Icon name="RefreshCw" size={12}/>Обновить всё
              </Button>
            </div>
            <p className="text-sm text-gray-500">При изменении родительского объекта все зависимые элементы обновляются автоматически.</p>
            <div className="space-y-2">
              {assocChain.map((node, i) => (
                <motion.div key={node.id}
                  animate={node.status==="updating" ? {scale:[1,1.02,1], backgroundColor:["#fff","#eff6ff","#fff"]} : {scale:1}}
                  transition={{duration:0.3}}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-200">
                  {i > 0 && <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center text-gray-300">↳</div>}
                  {i === 0 && <div className="w-4 h-4 flex-shrink-0"/>}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${node.status==="ok"?"bg-green-500":node.status==="updating"?"bg-blue-500 animate-pulse":"bg-yellow-500"}`}/>
                  <Icon name={node.type==="Трасса"?"Spline":node.type==="Профиль"?"TrendingUp":node.type==="Коридор"?"Navigation":node.type==="Поверхность"?"Triangle":node.type==="Анализ"?"BarChart3":"ClipboardList"} size={14} className="text-indigo-600 flex-shrink-0" fallback="Circle"/>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-800">{node.label}</div>
                    <div className="text-xs text-gray-400">{node.type}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${node.status==="ok"?"bg-green-100 text-green-700":node.status==="updating"?"bg-blue-100 text-blue-700 animate-pulse":"bg-yellow-100 text-yellow-700"}`}>
                    {node.status==="ok"?"✓ Актуально":node.status==="updating"?"⟳ Обновление":"⚠ Обновлено"}
                  </span>
                  <Button size="sm" variant="ghost" onClick={()=>симулироватьОбновление(node.id)} className="text-xs gap-1 text-gray-400 hover:text-indigo-600 px-2">
                    <Icon name="RefreshCw" size={11}/>
                  </Button>
                </motion.div>
              ))}
            </div>
            <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-3 text-sm text-indigo-700">
              При изменении <strong>Трассы</strong> автоматически пересчитываются: Профиль → Коридор → Поверхность → Объёмы → Ведомость
            </div>
          </div>
        </TabsContent>
        <TabsContent value="v2027"><VersionFeaturesInline categories={["modify", "draw"]} /></TabsContent>
      </Tabs>
    </motion.div>
  )
}