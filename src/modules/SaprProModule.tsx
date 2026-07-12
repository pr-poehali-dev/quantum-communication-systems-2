import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import VersionFeaturesPanel from "@/modules/VersionFeaturesPanel"
import { Feature, SolidKind, MATERIALS, buildMesh, massProps, project, overlapVolume, Vec3, EXCHANGE_3D } from "./sapr-engine"
import { скачать, экспортCSV, экспортPDF, импортФайл } from "@/utils/exportImport"

// ── Вкладки CommandManager (как в SolidWorks) ──────────────────────────────
type CM = "features" | "sketch" | "sheet" | "weld" | "mold" | "assembly" | "sim" | "flow" | "cam" | "render" | "config" | "pdm" | "eval" | "exchange"

const CM_TABS: { id: CM; label: string; icon: string }[] = [
  { id: "features", label: "Элементы", icon: "Boxes" },
  { id: "sketch", label: "Эскиз", icon: "PenTool" },
  { id: "sheet", label: "Листовой металл", icon: "Layers" },
  { id: "weld", label: "Сварные конструкции", icon: "Flame" },
  { id: "mold", label: "Литьё / формы", icon: "Container" },
  { id: "assembly", label: "Сборка", icon: "Combine" },
  { id: "sim", label: "Simulation", icon: "Activity" },
  { id: "flow", label: "Flow Simulation", icon: "Wind" },
  { id: "cam", label: "CAM (ЧПУ)", icon: "Cpu" },
  { id: "render", label: "PhotoView 360", icon: "Camera" },
  { id: "config", label: "Конфигурации", icon: "SlidersHorizontal" },
  { id: "pdm", label: "PDM", icon: "Database" },
  { id: "eval", label: "Анализ", icon: "Gauge" },
  { id: "exchange", label: "Обмен / AR-VR", icon: "ArrowLeftRight" },
]

// Инструменты каждой вкладки: [название, иконка, действие-подсказка]
const FEATURE_TOOLS = [
  { n: "Вытянутая бобышка", ic: "BoxSelect", kind: "box" as SolidKind, op: "Выдавливание" as Feature["op"] },
  { n: "Вытянутый вырез", ic: "SquareDashedBottom", kind: "box" as SolidKind, op: "Выдавливание" as Feature["op"], cut: true },
  { n: "Повёрнутая бобышка", ic: "RotateCw", kind: "revolve" as SolidKind, op: "Вращение" as Feature["op"] },
  { n: "Элемент по сечениям", ic: "Layers2", kind: "cone" as SolidKind, op: "По сечениям" as Feature["op"] },
  { n: "По траектории", ic: "Spline", kind: "torus" as SolidKind, op: "Кинематическая" as Feature["op"] },
  { n: "Скругление", ic: "Circle", mod: "fillet" },
  { n: "Фаска", ic: "Triangle", mod: "chamfer" },
  { n: "Оболочка", ic: "Container", mod: "shell" },
  { n: "Ребро жёсткости", ic: "Minus", mod: "rib" },
  { n: "Массив", ic: "Grid3x3", mod: "pattern" },
  { n: "Зеркало", ic: "FlipHorizontal2", mod: "mirror" },
  { n: "Придание толщины", ic: "Copy", mod: "thicken" },
]

let uid = 200

export default function SaprProModule({ onNavigate }: { onNavigate?: (id: string) => void } = {}) {
  const [cm, setCm] = useState<CM>("features")
  const [features, setFeatures] = useState<Feature[]>([
    { id: 1, kind: "box", name: "Бобышка-Вытянуть1", op: "Выдавливание", w: 120, d: 80, h: 24, sides: 6, material: "steel", color: MATERIALS.steel.color, visible: true, pos: [0, 0, 0] },
    { id: 2, kind: "cylinder", name: "Бобышка-Вытянуть2", op: "Выдавливание", w: 46, d: 46, h: 54, sides: 6, material: "steel", color: MATERIALS.steel.color, visible: true, pos: [0, 0, 39] },
    { id: 3, kind: "cylinder", name: "Вырез-Отверстие1", op: "Выдавливание", w: 22, d: 22, h: 90, sides: 6, material: "steel", color: "#c0392b", visible: true, pos: [0, 0, 40] },
  ])
  const [selected, setSelected] = useState(1)
  const [toast, setToast] = useState<string | null>(null)
  const [shading, setShading] = useState(true)
  const [edges, setEdges] = useState(true)
  const [render, setRenderPV] = useState(false)

  // конфигурации (таблица параметров)
  const [configs, setConfigs] = useState([
    { id: 1, name: "По умолчанию", scale: 1 },
    { id: 2, name: "Увеличенная 150%", scale: 1.5 },
    { id: 3, name: "Компактная 70%", scale: 0.7 },
  ])
  const [activeConfig, setActiveConfig] = useState(1)

  // PDM версии
  const [revisions] = useState([
    { rev: "A", date: "2026-06-30", who: "Иванов", note: "Первичный выпуск", state: "Утверждён" },
    { rev: "B", date: "2026-07-05", who: "Петров", note: "Изменён диаметр отверстия", state: "Утверждён" },
    { rev: "C", date: "2026-07-10", who: "Сидоров", note: "Добавлена оболочка", state: "На проверке" },
  ])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [yaw, setYaw] = useState(-0.7), [pitch, setPitch] = useState(-1.05), [scale, setScale] = useState(2.1)
  const drag = useRef<{ x: number; y: number } | null>(null)

  const sel = features.find(f => f.id === selected) ?? features[0]
  const mp = massProps(features)
  const cfgScale = configs.find(c => c.id === activeConfig)?.scale ?? 1

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2200) }

  const addFeature = (kind: SolidKind, op: Feature["op"], name: string, cut = false) => {
    const id = ++uid
    setFeatures(prev => [...prev, {
      id, kind, name: `${name}${features.length}`, op, w: 60, d: 40, h: 40, sides: 6,
      material: "steel", color: cut ? "#c0392b" : MATERIALS.steel.color, visible: true,
      pos: [0, 0, 20 + features.length * 8],
    }])
    setSelected(id)
    showToast(`${name}: элемент добавлен в дерево`)
  }
  const updateSel = (p: Partial<Feature>) => setFeatures(prev => prev.map(f => f.id === selected ? { ...f, ...p } : f))
  const removeFeature = (id: number) => setFeatures(prev => prev.filter(f => f.id !== id))

  const applyMod = (mod: string, label: string) => {
    // формоизменяющие операции слегка меняют геометрию выбранного тела
    setFeatures(prev => prev.map(f => {
      if (f.id !== selected) return f
      if (mod === "shell" || mod === "thicken") return { ...f, color: "#3498db" }
      if (mod === "fillet" || mod === "chamfer") return { ...f, w: +(f.w * 0.98).toFixed(1) }
      return f
    }))
    if (mod === "pattern") {
      const base = sel
      const copies = [1, 2, 3].map(i => ({ ...base, id: ++uid, name: `${base.name}-Массив${i}`, pos: [base.pos[0] + i * 45, base.pos[1], base.pos[2]] as Vec3 }))
      setFeatures(prev => [...prev, ...copies])
    }
    if (mod === "mirror") {
      const base = sel
      setFeatures(prev => [...prev, { ...base, id: ++uid, name: `${base.name}-Зеркало`, pos: [-base.pos[0], base.pos[1], base.pos[2]] as Vec3 }])
    }
    showToast(`Операция «${label}» применена к «${sel.name}»`)
  }

  // ── Рендер сцены ───────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const cv = canvasRef.current; if (!cv) return
    const ctx = cv.getContext("2d"); if (!ctx) return
    const W = cv.width, H = cv.height
    if (render) { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#1e2a3a"); g.addColorStop(1, "#0b1220"); ctx.fillStyle = g } else ctx.fillStyle = "#eef1f5"
    ctx.fillRect(0, 0, W, H)
    const sc = scale * cfgScale

    if (!render) {
      ctx.strokeStyle = "#dbe1ea"; ctx.lineWidth = 1
      for (let i = -5; i <= 5; i++) {
        const a = project([i * 30, -150, 0], [0, 0, 0], yaw, pitch, sc, W, H), b = project([i * 30, 150, 0], [0, 0, 0], yaw, pitch, sc, W, H)
        const c = project([-150, i * 30, 0], [0, 0, 0], yaw, pitch, sc, W, H), d = project([150, i * 30, 0], [0, 0, 0], yaw, pitch, sc, W, H)
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.stroke()
      }
    }
    type FD = { pts: { x: number; y: number }[]; z: number; color: string; sel: boolean; nz: number }
    const draws: FD[] = []
    features.filter(f => f.visible).forEach(f => {
      const m = buildMesh(f)
      const pr = m.vertices.map(v => project([(v[0] + f.pos[0]) * cfgScale, (v[1] + f.pos[1]) * cfgScale, (v[2] + f.pos[2]) * cfgScale], [0, 0, 0], yaw, pitch, sc, W, H))
      m.faces.forEach(face => {
        const pts = face.map(i => pr[i])
        const z = face.reduce((s, i) => s + pr[i].z, 0) / face.length
        const cr = (pts[1].x - pts[0].x) * (pts[2].y - pts[0].y) - (pts[1].y - pts[0].y) * (pts[2].x - pts[0].x)
        draws.push({ pts: pts.map(p => ({ x: p.x, y: p.y })), z, color: f.color, sel: f.id === selected, nz: cr > 0 ? 1 : -1 })
      })
    })
    draws.sort((a, b) => b.z - a.z)
    draws.forEach(dw => {
      ctx.beginPath(); dw.pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath()
      const light = dw.nz > 0 ? 1 : render ? 0.4 : 0.62
      ctx.fillStyle = shading || render ? shade(dw.color, render ? light * 1.05 : light) : dw.color + "cc"
      ctx.fill()
      if (render && dw.nz > 0) { ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.fill() }
      if (edges && !render) { ctx.strokeStyle = dw.sel ? "#0078d4" : "#33415577"; ctx.lineWidth = dw.sel ? 1.6 : 0.6; ctx.stroke() }
    })
  }, [features, selected, yaw, pitch, scale, shading, edges, render, cfgScale])

  useEffect(() => { draw() }, [draw])
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return
    const rz = () => { const r = cv.parentElement!.getBoundingClientRect(); cv.width = r.width; cv.height = r.height; draw() }
    rz(); window.addEventListener("resize", rz); return () => window.removeEventListener("resize", rz)
  }, [draw])

  const onDown = (e: React.MouseEvent) => { drag.current = { x: e.clientX, y: e.clientY } }
  const onMove = (e: React.MouseEvent) => {
    if (!drag.current) return
    setYaw(y => y + (e.clientX - drag.current!.x) * 0.01)
    setPitch(p => Math.max(-Math.PI + 0.1, Math.min(-0.1, p + (e.clientY - drag.current!.y) * 0.01)))
    drag.current = { x: e.clientX, y: e.clientY }
  }
  const onUp = () => { drag.current = null }
  const onWheel = (e: React.WheelEvent) => setScale(s => Math.max(0.6, Math.min(8, s - e.deltaY * 0.002)))

  const collisions = (() => {
    const v = features.filter(f => f.visible), r: { a: string; b: string; vol: number }[] = []
    for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) { const o = overlapVolume(v[i], v[j]); if (o > 1 && v[i].color !== "#c0392b" && v[j].color !== "#c0392b") r.push({ a: v[i].name, b: v[j].name, vol: +(o / 1000).toFixed(1) }) }
    return r
  })()

  const exportFmt = (label: string, ext: string, content: string) => { скачать(content, `deталь${ext}`); showToast(`Экспорт: ${label}`) }

  return (
    <div className="relative flex flex-col h-full bg-[#e9edf2] overflow-hidden text-sm">
      {/* Заголовок + CommandManager */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-1.5 flex items-center gap-2 border-b border-gray-100">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center"><Icon name="Boxes" size={13} className="text-white" /></div>
          <span className="text-[13px] font-bold text-gray-900">САПР Про</span>
          <span className="text-[10px] text-gray-400">Premium · параметрическое моделирование · Simulation · PDM</span>
          <div className="ml-auto flex items-center gap-1.5">
            <Select value={String(activeConfig)} onValueChange={v => { setActiveConfig(+v); showToast(`Активна конфигурация: ${configs.find(c => c.id === +v)?.name}`) }}>
              <SelectTrigger className="h-7 text-xs w-44"><SelectValue /></SelectTrigger>
              <SelectContent>{configs.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            {onNavigate && <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onNavigate("sapr")}><Icon name="Box" size={12} />КОМПАС-режим</Button>}
          </div>
        </div>
        <div className="px-2 flex items-center gap-0.5 overflow-x-auto">
          {CM_TABS.map(t => (
            <button key={t.id} onClick={() => setCm(t.id)}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold whitespace-nowrap border-b-2 transition-all ${cm === t.id ? "border-red-500 text-red-600" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
              <Icon name={t.icon} size={12} fallback="Square" />{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* FeatureManager (дерево) */}
        <div className="w-60 bg-white border-r border-gray-200 flex flex-col min-h-0">
          <div className="px-3 py-1.5 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1"><Icon name="ListTree" size={12} />Дерево построения</div>
          <div className="overflow-auto flex-1 py-1">
            <div className="text-[11px] text-gray-400 px-3 py-0.5 flex items-center gap-1"><Icon name="FileBox" size={11} />Деталь1 (Премиум)</div>
            <div className="text-[11px] text-gray-400 px-3 py-0.5 pl-6 flex items-center gap-1"><Icon name="Layers" size={10} />Спереди · Сверху · Справа</div>
            {features.map(f => (
              <div key={f.id} onClick={() => setSelected(f.id)}
                className={`flex items-center gap-1.5 pl-6 pr-1 py-1 text-[12px] cursor-pointer ${selected === f.id ? "bg-red-50 text-red-700" : "hover:bg-gray-50 text-gray-700"}`}>
                <Icon name={f.color === "#c0392b" ? "SquareDashedBottom" : "Box"} size={11} fallback="Box" />
                <span className="flex-1 truncate">{f.name}</span>
                <button onClick={e => { e.stopPropagation(); removeFeature(f.id) }} className="text-gray-300 hover:text-red-500"><Icon name="X" size={11} /></button>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 p-2 text-[11px] text-gray-500 space-y-0.5">
            <div className="flex justify-between"><span>Масса</span><b>{mp.mass} кг</b></div>
            <div className="flex justify-between"><span>Объём</span><b>{mp.volume} см³</b></div>
            <div className="flex justify-between"><span>Элементов</span><b>{features.length}</b></div>
          </div>
        </div>

        {/* Центр: 3D-вьюпорт */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          <div className="absolute top-2 left-2 z-10 flex gap-1.5">
            <Toggle active={shading} onClick={() => setShading(s => !s)} icon="Palette" label="Тонирование" />
            <Toggle active={edges} onClick={() => setEdges(s => !s)} icon="Grid2x2" label="Рёбра" />
            <Toggle active={render} onClick={() => setRenderPV(s => !s)} icon="Camera" label="PhotoView" />
            <button onClick={() => { setYaw(-0.7); setPitch(-1.05); setScale(2.1) }} className="px-2 py-1 rounded bg-white/90 border border-gray-200 text-[11px] flex items-center gap-1 text-gray-600 hover:bg-white"><Icon name="Home" size={11} />Изометрия</button>
          </div>
          <div className="flex-1 min-h-0 relative">
            <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp} onWheel={onWheel} />
            <div className="absolute bottom-2 left-2 text-[10px] text-gray-400 bg-white/70 px-2 py-0.5 rounded">Конфигурация: {configs.find(c => c.id === activeConfig)?.name} · тел: {features.filter(f => f.visible).length}</div>
          </div>
        </div>

        {/* PropertyManager (правая панель, зависит от вкладки) */}
        <div className="w-72 bg-white border-l border-gray-200 overflow-auto">
          <div className="px-3 py-1.5 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1"><Icon name="SlidersHorizontal" size={12} />{CM_TABS.find(t => t.id === cm)?.label}</div>
          <div className="p-3">
            {cm === "features" && <FeaturesPanel tools={FEATURE_TOOLS} addFeature={addFeature} applyMod={applyMod} sel={sel} updateSel={updateSel} />}
            {cm === "sketch" && <SketchPanel onAction={showToast} />}
            {cm === "sheet" && <PanelList title="Листовой металл" items={[["Базовая кромка", "гибка листа"], ["Ребро-кромка", "фланец по кромке"], ["Сгиб по эскизу", "линия сгиба"], ["Развёртка", "плоская выкройка"], ["Штамповка", "формовочный инструмент"]]} icon="Layers" onAction={n => showToast(`Листовой металл: ${n}`)} extra={<Button size="sm" className="w-full mt-2 gap-1.5 bg-red-600 hover:bg-red-700" onClick={() => { экспортPDF("Развёртка листовой детали", features.map(f => `${f.name}: ${f.w}×${f.d} мм`).join("\n"), "развёртка"); showToast("Развёртка выгружена в PDF") }}><Icon name="FileDown" size={13} />Развёртка в PDF</Button>} />}
            {cm === "weld" && <PanelList title="Сварные конструкции" items={[["Профиль сварной", "прокатный сортамент"], ["Обрезка/удлинение", "подгонка стыков"], ["Косынка", "усиливающая пластина"], ["Концевая заглушка", "торцевая крышка"], ["Сварной шов", "обозначение шва"], ["Список вырезки", "ведомость профилей"]]} icon="Flame" onAction={n => showToast(`Сварка: ${n}`)} />}
            {cm === "mold" && <PanelList title="Литьё и формы" items={[["Анализ уклонов", "литейные уклоны"], ["Анализ поднутрений", "зоны подрезки"], ["Линия разъёма", "разделение формы"], ["Поверхность разъёма", "плоскость смыкания"], ["Матрица / пуансон", "части пресс-формы"], ["Усадка материала", "коэффициент усадки"]]} icon="Container" onAction={n => showToast(`Форма: ${n}`)} />}
            {cm === "assembly" && <AssemblyPanel features={features} collisions={collisions} onAction={showToast} />}
            {cm === "sim" && <SimPanel onAction={showToast} mass={mp.mass} />}
            {cm === "flow" && <FlowPanel onAction={showToast} />}
            {cm === "cam" && <CamPanel onAction={showToast} onExport={() => exportFmt("G-code (ЧПУ)", ".nc", "%\nO1000\nG21 G90\nG0 X0 Y0 Z5\nM30\n%")} />}
            {cm === "render" && <RenderPanel render={render} setRender={setRenderPV} onAction={showToast} />}
            {cm === "config" && <ConfigPanel configs={configs} setConfigs={setConfigs} active={activeConfig} setActive={setActiveConfig} onAction={showToast} />}
            {cm === "pdm" && <PdmPanel revisions={revisions} onAction={showToast} />}
            {cm === "eval" && <EvalPanel mp={mp} onAction={showToast} />}
            {cm === "exchange" && <ExchangePanel onImport={() => импортФайл(".step,.igs,.stl,.x_t,.sldprt", (_c, n) => { addFeature("box", "Объектная", "Импорт-"); showToast(`3D Interconnect: ${n}`) })} onExport={exportFmt} onAction={showToast} />}
          </div>
        </div>
      </div>

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm shadow-xl flex items-center gap-2"><Icon name="CheckCircle" size={14} className="text-emerald-400" />{toast}</div>}
      <VersionFeaturesPanel categories={["modeling3d", "modify"]} floating />
    </div>
  )
}

// ── Панель «Элементы» ──────────────────────────────────────────────────────
function FeaturesPanel({ tools, addFeature, applyMod, sel, updateSel }: { tools: typeof FEATURE_TOOLS; addFeature: (k: SolidKind, o: Feature["op"], n: string, cut?: boolean) => void; applyMod: (m: string, l: string) => void; sel: Feature; updateSel: (p: Partial<Feature>) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1.5">
        {tools.map(t => (
          <button key={t.n} title={t.n}
            onClick={() => "kind" in t && t.kind ? addFeature(t.kind, t.op!, t.n.split(" ")[0] + "-", (t as { cut?: boolean }).cut) : applyMod((t as { mod: string }).mod, t.n)}
            className="aspect-square rounded-lg border border-gray-200 hover:border-red-400 hover:bg-red-50 flex flex-col items-center justify-center gap-0.5 text-gray-600 p-1">
            <Icon name={t.ic} size={16} fallback="Box" /><span className="text-[8px] leading-tight text-center">{t.n.split(" ")[0]}</span>
          </button>
        ))}
      </div>
      {sel && (
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="text-[11px] font-semibold text-gray-600">Параметры: {sel.name}</div>
          <Slider label="Размер W" v={sel.w} min={2} max={300} on={v => updateSel({ w: v })} />
          <Slider label="Глубина / длина" v={sel.h} min={2} max={300} on={v => updateSel({ h: v })} />
          <div>
            <Label className="text-[11px]">Материал</Label>
            <Select value={sel.material} onValueChange={v => updateSel({ material: v, color: MATERIALS[v].color })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(MATERIALS).map(([k, m]) => <SelectItem key={k} value={k}>{m.ru}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {(["X", "Y", "Z"] as const).map((ax, i) => (
              <div key={ax}><Label className="text-[10px]">{ax}</Label><Input type="number" value={sel.pos[i]} onChange={e => { const np = [...sel.pos] as Vec3; np[i] = +e.target.value; updateSel({ pos: np }) }} className="h-7 text-xs px-1" /></div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SketchPanel({ onAction }: { onAction: (m: string) => void }) {
  const geo = [["Линия", "PenLine"], ["Прямоугольник", "RectangleHorizontal"], ["Окружность", "Circle"], ["Дуга", "Spline"], ["Многоугольник", "Hexagon"], ["Сплайн", "Waypoints"]]
  const rel = ["Коллинеарность", "Перпендикулярность", "Касание", "Совпадение", "Параллельность", "Равенство", "Симметрия"]
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-semibold text-gray-600">Инструменты эскиза</div>
      <div className="grid grid-cols-3 gap-1.5">
        {geo.map(([n, ic]) => <button key={n} onClick={() => onAction(`Эскиз: ${n}`)} className="aspect-square rounded-lg border border-gray-200 hover:border-red-400 hover:bg-red-50 flex flex-col items-center gap-0.5 justify-center text-gray-600 p-1"><Icon name={ic} size={15} fallback="PenTool" /><span className="text-[8px]">{n}</span></button>)}
      </div>
      <div className="text-[11px] font-semibold text-gray-600 pt-1">Геометрические связи</div>
      <div className="flex flex-wrap gap-1">{rel.map(r => <button key={r} onClick={() => onAction(`Связь: ${r} наложена`)} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-700 text-gray-600">{r}</button>)}</div>
      <Button size="sm" className="w-full gap-1.5 bg-red-600 hover:bg-red-700" onClick={() => onAction("Автообразмеривание: эскиз полностью определён")}><Icon name="Ruler" size={13} />Автообразмеривание</Button>
    </div>
  )
}

function PanelList({ title, items, icon, onAction, extra }: { title: string; items: [string, string][]; icon: string; onAction: (n: string) => void; extra?: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold text-gray-600 flex items-center gap-1"><Icon name={icon} size={13} className="text-red-500" fallback="Square" />{title}</div>
      {items.map(([n, hint]) => (
        <button key={n} onClick={() => onAction(n)} className="w-full text-left px-2 py-1.5 rounded-lg border border-gray-100 hover:border-red-300 hover:bg-red-50 text-[12px] text-gray-700">
          <div className="font-medium">{n}</div><div className="text-[10px] text-gray-400">{hint}</div>
        </button>
      ))}
      {extra}
    </div>
  )
}

function AssemblyPanel({ features, collisions, onAction }: { features: Feature[]; collisions: { a: string; b: string; vol: number }[]; onAction: (m: string) => void }) {
  const mates = ["Совпадение", "Концентричность", "Касание", "Параллельность", "Перпендикулярность", "На расстоянии", "Угол"]
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-semibold text-gray-600">Сопряжения ({features.length} компонентов)</div>
      <div className="grid grid-cols-2 gap-1">{mates.map(m => <button key={m} onClick={() => onAction(`Сопряжение: ${m}`)} className="text-[10px] px-2 py-1 rounded border border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-600">{m}</button>)}</div>
      <div className={`rounded-lg p-2.5 text-[11px] ${collisions.length ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
        <div className="font-semibold flex items-center gap-1"><Icon name={collisions.length ? "AlertTriangle" : "ShieldCheck"} size={12} />Контроль конфликтов: {collisions.length ? `${collisions.length} пересеч.` : "чисто"}</div>
        {collisions.map((c, i) => <div key={i} className="mt-0.5">{c.a} ⨉ {c.b} · {c.vol} см³</div>)}
      </div>
      <Button size="sm" className="w-full gap-1.5 bg-red-600 hover:bg-red-700" onClick={() => onAction("Разнесённый вид создан")}><Icon name="Combine" size={13} />Разнесённый вид</Button>
    </div>
  )
}

function SimPanel({ onAction, mass }: { onAction: (m: string) => void; mass: number }) {
  const [load, setLoad] = useState("5000")
  const [res, setRes] = useState<null | { stress: number; disp: number; fos: number }>(null)
  const run = () => {
    const F = +load || 1000
    const stress = +(F / 240).toFixed(1)
    setRes({ stress, disp: +(F / 90000).toFixed(3), fos: +(250 / (stress / 10)).toFixed(2) })
    onAction("Simulation: статический расчёт выполнен")
  }
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-semibold text-gray-600">Статический анализ (МКЭ)</div>
      <div><Label className="text-[11px]">Нагрузка, Н</Label><Input value={load} onChange={e => setLoad(e.target.value)} className="h-8 text-xs" /></div>
      <div className="grid grid-cols-2 gap-1">
        {["Прочность", "Деформации", "Напряжения", "Вибрации", "Теплопередача", "Усталость"].map(t => <button key={t} onClick={() => onAction(`Исследование: ${t}`)} className="text-[10px] px-2 py-1 rounded border border-gray-200 hover:bg-red-50 text-gray-600">{t}</button>)}
      </div>
      <Button size="sm" className="w-full gap-1.5 bg-red-600 hover:bg-red-700" onClick={run}><Icon name="Play" size={13} />Рассчитать</Button>
      {res && (
        <div className="space-y-1 text-[11px]">
          <Row l="Макс. напряжение" v={`${res.stress} МПа`} />
          <Row l="Макс. перемещение" v={`${res.disp} мм`} />
          <Row l="Запас прочности" v={String(res.fos)} ok={res.fos > 1.5} />
          <Row l="Масса изделия" v={`${mass} кг`} />
        </div>
      )}
      <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={() => onAction("Топологическая оптимизация: −22% массы при сохранении жёсткости")}><Icon name="Wand2" size={13} fallback="Sparkles" />Топ. оптимизация</Button>
    </div>
  )
}

function FlowPanel({ onAction }: { onAction: (m: string) => void }) {
  const [v, setV] = useState("2.5")
  const [res, setRes] = useState<null | { drop: number; re: number; heat: number }>(null)
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-semibold text-gray-600">Гидрогазодинамика (CFD)</div>
      <div><Label className="text-[11px]">Скорость потока, м/с</Label><Input value={v} onChange={e => setV(e.target.value)} className="h-8 text-xs" /></div>
      <Button size="sm" className="w-full gap-1.5 bg-red-600 hover:bg-red-700" onClick={() => { const s = +v || 1; setRes({ drop: +(s * s * 12).toFixed(1), re: Math.round(s * 50000), heat: +(s * 18).toFixed(1) }); onAction("Flow Simulation: расчёт завершён") }}><Icon name="Wind" size={13} />Запустить CFD</Button>
      {res && <div className="space-y-1 text-[11px]"><Row l="Перепад давления" v={`${res.drop} Па`} /><Row l="Число Рейнольдса" v={res.re.toLocaleString("ru")} /><Row l="Теплоотвод" v={`${res.heat} Вт`} /></div>}
      <div className="text-[10px] text-gray-400">Охлаждение электроники · аэродинамика · гребной винт</div>
    </div>
  )
}

function CamPanel({ onAction, onExport }: { onAction: (m: string) => void; onExport: () => void }) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold text-gray-600">SOLIDWORKS CAM</div>
      {["Фрезерование 2.5D", "Токарная обработка", "Сверление", "Черновой проход", "Чистовой проход"].map(o => <button key={o} onClick={() => onAction(`Операция ЧПУ: ${o}`)} className="w-full text-left px-2 py-1.5 rounded-lg border border-gray-100 hover:border-red-300 hover:bg-red-50 text-[12px] text-gray-700">{o}</button>)}
      <Button size="sm" className="w-full gap-1.5 bg-red-600 hover:bg-red-700" onClick={onExport}><Icon name="Download" size={13} />Постпроцессор → G-code</Button>
    </div>
  )
}

function RenderPanel({ render, setRender, onAction }: { render: boolean; setRender: (v: boolean) => void; onAction: (m: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-semibold text-gray-600">PhotoView 360</div>
      <Button size="sm" className={`w-full gap-1.5 ${render ? "bg-gray-700" : "bg-red-600 hover:bg-red-700"}`} onClick={() => setRender(!render)}><Icon name="Camera" size={13} />{render ? "Выключить рендер" : "Включить фотореализм"}</Button>
      {["Матовый металл", "Полированная сталь", "Пластик глянец", "Стекло"].map(m => <button key={m} onClick={() => onAction(`Материал сцены: ${m}`)} className="w-full text-left px-2 py-1 rounded border border-gray-100 hover:bg-red-50 text-[11px] text-gray-600">{m}</button>)}
      <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={() => onAction("Финальный рендер 1920×1080 сохранён")}><Icon name="Image" size={13} />Финальный кадр</Button>
    </div>
  )
}

function ConfigPanel({ configs, setConfigs, active, setActive, onAction }: { configs: { id: number; name: string; scale: number }[]; setConfigs: React.Dispatch<React.SetStateAction<{ id: number; name: string; scale: number }[]>>; active: number; setActive: (i: number) => void; onAction: (m: string) => void }) {
  const [name, setName] = useState(""); const [sc, setSc] = useState("1")
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold text-gray-600">Таблица параметров</div>
      {configs.map(c => (
        <div key={c.id} onClick={() => setActive(c.id)} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-[12px] ${active === c.id ? "bg-red-50 text-red-700 border border-red-200" : "border border-gray-100 hover:bg-gray-50 text-gray-700"}`}>
          <Icon name="SlidersHorizontal" size={12} /><span className="flex-1">{c.name}</span><span className="text-gray-400 font-mono">×{c.scale}</span>
        </div>
      ))}
      <div className="grid grid-cols-3 gap-1 items-end pt-1 border-t border-gray-100">
        <div className="col-span-2"><Label className="text-[10px]">Имя</Label><Input value={name} onChange={e => setName(e.target.value)} className="h-7 text-xs" /></div>
        <div><Label className="text-[10px]">Масштаб</Label><Input value={sc} onChange={e => setSc(e.target.value)} className="h-7 text-xs" /></div>
      </div>
      <Button size="sm" className="w-full gap-1.5 bg-red-600 hover:bg-red-700" onClick={() => { if (!name) return; setConfigs(p => [...p, { id: Date.now(), name, scale: +sc || 1 }]); setName(""); onAction(`Конфигурация «${name}» создана`) }}><Icon name="Plus" size={13} />Добавить конфигурацию</Button>
    </div>
  )
}

function PdmPanel({ revisions, onAction }: { revisions: { rev: string; date: string; who: string; note: string; state: string }[]; onAction: (m: string) => void }) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold text-gray-600">SOLIDWORKS PDM — журнал версий</div>
      {revisions.map(r => (
        <div key={r.rev} className="rounded-lg border border-gray-100 p-2 text-[11px]">
          <div className="flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-red-100 text-red-700 flex items-center justify-center font-bold">{r.rev}</span><span className="font-medium text-gray-700">{r.date}</span><span className={`ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${r.state === "Утверждён" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{r.state}</span></div>
          <div className="text-gray-500 mt-0.5">{r.note} · {r.who}</div>
        </div>
      ))}
      <div className="grid grid-cols-2 gap-1">
        <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => onAction("Файл взят на редактирование (Check Out)")}><Icon name="LockOpen" size={12} />Извлечь</Button>
        <Button size="sm" className="gap-1 text-xs bg-red-600 hover:bg-red-700" onClick={() => onAction("Изменения сохранены в архив (Check In)")}><Icon name="Lock" size={12} />Вернуть</Button>
      </div>
    </div>
  )
}

function EvalPanel({ mp, onAction }: { mp: ReturnType<typeof massProps>; onAction: (m: string) => void }) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold text-gray-600">Массовые характеристики</div>
      <Row l="Масса" v={`${mp.mass} кг`} /><Row l="Объём" v={`${mp.volume} см³`} /><Row l="Площадь" v={`${mp.area} см²`} />
      <Row l="Центр тяжести" v={`${mp.cog[0]};${mp.cog[1]};${mp.cog[2]}`} />
      <div className="grid grid-cols-3 gap-1 text-center pt-1">
        {[["Ix", mp.ix], ["Iy", mp.iy], ["Iz", mp.iz]].map(([l, v]) => <div key={l as string} className="bg-gray-50 rounded p-1.5"><div className="text-[9px] text-gray-400">{l}</div><div className="text-[11px] font-bold">{v}</div></div>)}
      </div>
      <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={() => onAction("Проверка геометрии: ошибок и зазоров не найдено")}><Icon name="ScanSearch" size={13} fallback="Search" />Проверка геометрии</Button>
      <Button size="sm" className="w-full gap-1.5 bg-red-600 hover:bg-red-700" onClick={() => { экспортCSV(["Параметр", "Значение"], [["Масса кг", mp.mass], ["Объём см³", mp.volume], ["Площадь см²", mp.area]], "характеристики.csv"); onAction("Отчёт выгружен") }}><Icon name="Download" size={13} />Отчёт CSV</Button>
    </div>
  )
}

function ExchangePanel({ onImport, onExport, onAction }: { onImport: () => void; onExport: (label: string, ext: string, content: string) => void; onAction: (m: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-semibold text-gray-600">3D Interconnect — импорт</div>
      <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={onImport}><Icon name="Upload" size={13} />Импорт STEP/IGES/STL/SLDPRT</Button>
      <div className="text-[11px] font-semibold text-gray-600 pt-1">Экспорт</div>
      <div className="grid grid-cols-2 gap-1">
        {EXCHANGE_3D.map(f => <Button key={f} size="sm" variant="outline" className="gap-1 text-[11px] justify-start" onClick={() => onExport(f, f.match(/\((\.[a-z0-9_]+)\)/)?.[1] ?? ".dat", `# ${f}`)}><Icon name="FileBox" size={12} />{f.split(" ")[0]}</Button>)}
      </div>
      <div className="text-[11px] font-semibold text-gray-600 pt-1">AR / VR</div>
      <div className="grid grid-cols-2 gap-1">
        <Button size="sm" variant="outline" className="gap-1 text-[11px]" onClick={() => { onExport("glTF для AR", ".glb", "glTF binary"); onAction("Экспорт для AR (glTF)") }}><Icon name="View" size={12} fallback="Eye" />AR (glTF)</Button>
        <Button size="sm" variant="outline" className="gap-1 text-[11px]" onClick={() => onAction("Сцена подготовлена для VR-просмотра")}><Icon name="Glasses" size={12} fallback="Eye" />VR-сцена</Button>
      </div>
      <div className="text-[11px] font-semibold text-gray-600 pt-1">Модули-надстройки</div>
      <div className="flex flex-wrap gap-1">{["Electrical", "Routing", "Plastics", "Библиотека ГОСТ", "ISO", "DIN"].map(m => <button key={m} onClick={() => onAction(`Модуль: ${m} активирован`)} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-700 text-gray-600">{m}</button>)}</div>
    </div>
  )
}

// ── Мелкие компоненты ──────────────────────────────────────────────────────
function Slider({ label, v, min, max, on }: { label: string; v: number; min: number; max: number; on: (v: number) => void }) {
  return <div><div className="flex justify-between text-[11px] mb-0.5"><span className="text-gray-500">{label}</span><span className="font-mono font-semibold text-gray-700">{v}</span></div><input type="range" min={min} max={max} value={v} onChange={e => on(+e.target.value)} className="w-full accent-red-600" /></div>
}
function Toggle({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return <button onClick={onClick} className={`px-2 py-1 rounded border text-[11px] flex items-center gap-1 ${active ? "bg-red-600 text-white border-red-600" : "bg-white/90 text-gray-600 border-gray-200 hover:bg-white"}`}><Icon name={icon} size={11} fallback="Square" />{label}</button>
}
function Row({ l, v, ok }: { l: string; v: string; ok?: boolean }) {
  return <div className="flex justify-between items-center text-[11px] py-0.5 border-b border-gray-50"><span className="text-gray-500">{l}</span><span className={`font-mono font-semibold ${ok === undefined ? "text-gray-800" : ok ? "text-green-600" : "text-red-600"}`}>{v}</span></div>
}
function shade(hex: string, k: number): string {
  const h = hex.replace("#", ""); const r = Math.min(255, Math.round(parseInt(h.slice(0, 2), 16) * k)); const g = Math.min(255, Math.round(parseInt(h.slice(2, 4), 16) * k)); const b = Math.min(255, Math.round(parseInt(h.slice(4, 6), 16) * k)); return `rgb(${r},${g},${b})`
}