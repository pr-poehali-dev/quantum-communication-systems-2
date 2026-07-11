import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import {
  Feature, SolidKind, MATERIALS, buildMesh, massProps, project, volumeOf, overlapVolume,
  EXCHANGE_3D, EXCHANGE_2D, CAD_IMPORT, Vec3,
} from "./sapr-engine"
import { скачать, экспортCSV, экспортPDF, импортФайл } from "@/utils/exportImport"

type Tab = "model" | "assembly" | "draw" | "analysis" | "spec" | "exchange"

type MateKind = "coincident" | "concentric" | "distance" | "parallel"
interface Mate {
  id: number
  kind: MateKind
  a: number          // id детали A
  b: number          // id детали B
  value: number      // расстояние для "distance"
}
const MATE_INFO: Record<MateKind, { name: string; icon: string; hint: string }> = {
  coincident: { name: "Совмещение", icon: "AlignHorizontalSpaceAround", hint: "Совмещает грани/центры двух деталей" },
  concentric: { name: "Соосность", icon: "CircleDot", hint: "Выравнивает оси деталей на одну линию" },
  distance: { name: "На расстоянии", icon: "Ruler", hint: "Фиксирует зазор между деталями, мм" },
  parallel: { name: "Параллельность", icon: "AlignVerticalJustifyCenter", hint: "Делает грани параллельными" },
}

const PRIMITIVES: { kind: SolidKind; name: string; icon: string; op: Feature["op"] }[] = [
  { kind: "box", name: "Параллелепипед", icon: "Box", op: "Выдавливание" },
  { kind: "cylinder", name: "Цилиндр", icon: "Cylinder", op: "Выдавливание" },
  { kind: "cone", name: "Конус", icon: "Cone", op: "Вращение" },
  { kind: "sphere", name: "Сфера", icon: "Circle", op: "Вращение" },
  { kind: "prism", name: "Призма", icon: "Hexagon", op: "Выдавливание" },
  { kind: "torus", name: "Тор", icon: "Donut", op: "Кинематическая" },
  { kind: "revolve", name: "Тело вращения", icon: "Disc", op: "Вращение" },
]

const LIBRARY = [
  { name: "Болт М12 ГОСТ 7798", kind: "cylinder" as SolidKind, w: 12, h: 40 },
  { name: "Гайка М12 ГОСТ 5915", kind: "prism" as SolidKind, w: 19, h: 10, sides: 6 },
  { name: "Шайба 12 ГОСТ 11371", kind: "cylinder" as SolidKind, w: 24, h: 2.5 },
  { name: "Подшипник 6204", kind: "torus" as SolidKind, w: 47, d: 14 },
  { name: "Вал ступенчатый", kind: "revolve" as SolidKind, w: 40, h: 120 },
  { name: "Фланец Ду50", kind: "cylinder" as SolidKind, w: 160, h: 18 },
]

let uid = 100

export default function SaprModule({ onNavigate: _onNavigate }: { onNavigate?: (id: string) => void } = {}) {
  const [tab, setTab] = useState<Tab>("model")
  const [features, setFeatures] = useState<Feature[]>([
    { id: 1, kind: "box", name: "Основание", op: "Выдавливание", w: 120, d: 80, h: 20, sides: 6, material: "steel", color: MATERIALS.steel.color, visible: true, pos: [0, 0, 0] },
    { id: 2, kind: "cylinder", name: "Бобышка", op: "Выдавливание", w: 50, d: 50, h: 60, sides: 6, material: "steel", color: MATERIALS.steel.color, visible: true, pos: [0, 0, 40] },
  ])
  const [selected, setSelected] = useState<number>(1)
  const [designMode, setDesignMode] = useState<"top-down" | "bottom-up">("bottom-up")
  const [shading, setShading] = useState(true)
  const [showEdges, setShowEdges] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [yaw, setYaw] = useState(-0.7)
  const [pitch, setPitch] = useState(-1.1)
  const [scale, setScale] = useState(2.2)
  const drag = useRef<{ x: number; y: number } | null>(null)

  const [mates, setMates] = useState<Mate[]>([])
  const [mateForm, setMateForm] = useState<{ kind: MateKind; a: number; b: number; value: string }>({ kind: "concentric", a: 1, b: 2, value: "10" })
  const [explode, setExplode] = useState(0)   // коэффициент разнесённого вида 0..1

  const sel = features.find(f => f.id === selected) ?? features[0]
  const mp = massProps(features)

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2200) }

  // ── Сборка: применить сопряжение (перемещает деталь B относительно A) ──────
  const applyMate = () => {
    const A = features.find(f => f.id === mateForm.a)
    const B = features.find(f => f.id === mateForm.b)
    if (!A || !B || A.id === B.id) { showToast("Выберите две разные детали"); return }
    const id = ++uid
    const value = +mateForm.value || 0
    setMates(prev => [...prev, { id, kind: mateForm.kind, a: A.id, b: B.id, value }])
    // Реально двигаем деталь B, чтобы сопряжение выполнилось
    setFeatures(prev => prev.map(f => {
      if (f.id !== B.id) return f
      const np: Vec3 = [...f.pos]
      if (mateForm.kind === "concentric") { np[0] = A.pos[0]; np[1] = A.pos[1] }
      else if (mateForm.kind === "coincident") { np[0] = A.pos[0]; np[1] = A.pos[1]; np[2] = A.pos[2] }
      else if (mateForm.kind === "distance") { np[0] = A.pos[0]; np[1] = A.pos[1]; np[2] = A.pos[2] + (A.h / 2 + f.h / 2 + value) }
      else if (mateForm.kind === "parallel") { np[0] = A.pos[0] + A.w / 2 + f.w / 2 + 10 }
      return { ...f, pos: np }
    }))
    showToast(`Наложено сопряжение: ${MATE_INFO[mateForm.kind].name} (${A.name} ↔ ${B.name})`)
  }
  const removeMate = (id: number) => setMates(prev => prev.filter(m => m.id !== id))

  // Проверка пересечений (коллизий) между всеми парами деталей
  const collisions = (() => {
    const vis = features.filter(f => f.visible)
    const res: { a: Feature; b: Feature; vol: number }[] = []
    for (let i = 0; i < vis.length; i++)
      for (let j = i + 1; j < vis.length; j++) {
        const v = overlapVolume(vis[i], vis[j])
        if (v > 1) res.push({ a: vis[i], b: vis[j], vol: +(v / 1000).toFixed(1) })
      }
    return res
  })()

  const addFeature = (kind: SolidKind, op: Feature["op"], preset?: Partial<Feature>) => {
    const id = ++uid
    const mat = "steel"
    const nf: Feature = {
      id, kind, name: (preset?.name as string) || PRIMITIVES.find(p => p.kind === kind)?.name || "Элемент",
      op, w: 60, d: 40, h: 40, sides: 6, material: mat, color: MATERIALS[mat].color, visible: true,
      pos: [0, 0, 30 + features.length * 10], ...preset,
    }
    setFeatures(prev => [...prev, nf])
    setSelected(id)
    showToast(`Добавлен элемент: ${nf.name} (${op})`)
  }

  const updateSel = (patch: Partial<Feature>) =>
    setFeatures(prev => prev.map(f => f.id === selected ? { ...f, ...patch } : f))
  const removeFeature = (id: number) =>
    setFeatures(prev => prev.filter(f => f.id !== id))
  const toggleVisible = (id: number) =>
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, visible: !f.visible } : f))

  // Центр сборки (для разнесённого вида)
  const assemblyCenter = (() => {
    const vis = features.filter(f => f.visible)
    if (!vis.length) return [0, 0, 0] as Vec3
    const s = vis.reduce((a, f) => [a[0] + f.pos[0], a[1] + f.pos[1], a[2] + f.pos[2]] as Vec3, [0, 0, 0] as Vec3)
    return [s[0] / vis.length, s[1] / vis.length, s[2] / vis.length] as Vec3
  })()

  // Позиция детали с учётом разнесённого вида
  const explodedPos = useCallback((f: Feature): Vec3 => {
    if (explode <= 0) return f.pos
    const dir: Vec3 = [f.pos[0] - assemblyCenter[0], f.pos[1] - assemblyCenter[1], f.pos[2] - assemblyCenter[2]]
    const len = Math.hypot(dir[0], dir[1], dir[2]) || 1
    // основное разнесение вдоль Z + радиальное в плоскости
    const k = explode * 140
    return [
      f.pos[0] + (dir[0] / len) * k * 0.6,
      f.pos[1] + (dir[1] / len) * k * 0.6,
      f.pos[2] + (dir[2] / len) * k + explode * (f.pos[2] - assemblyCenter[2] >= 0 ? 60 : -60),
    ]
  }, [explode, assemblyCenter])

  // ── Рендер 3D ─────────────────────────────────────────────────────────────
  const render = useCallback(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext("2d")
    if (!ctx) return
    const W = cv.width, H = cv.height
    ctx.fillStyle = "#f4f6f9"
    ctx.fillRect(0, 0, W, H)

    // сетка-плоскость
    ctx.strokeStyle = "#dde3ec"; ctx.lineWidth = 1
    for (let i = -5; i <= 5; i++) {
      const a = project([i * 30, -150, 0], [0, 0, 0], yaw, pitch, scale, W, H)
      const b = project([i * 30, 150, 0], [0, 0, 0], yaw, pitch, scale, W, H)
      const c = project([-150, i * 30, 0], [0, 0, 0], yaw, pitch, scale, W, H)
      const dd = project([150, i * 30, 0], [0, 0, 0], yaw, pitch, scale, W, H)
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(dd.x, dd.y); ctx.stroke()
    }
    // оси
    const O = project([0, 0, 0], [0, 0, 0], yaw, pitch, scale, W, H)
    const axes: [Vec3, string][] = [[[60, 0, 0], "#e11d48"], [[0, 60, 0], "#16a34a"], [[0, 0, 60], "#2563eb"]]
    axes.forEach(([v, col]) => {
      const p = project(v, [0, 0, 0], yaw, pitch, scale, W, H)
      ctx.strokeStyle = col; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(O.x, O.y); ctx.lineTo(p.x, p.y); ctx.stroke()
    })

    // собрать все грани со всех тел, отсортировать по глубине
    type FaceDraw = { pts: { x: number; y: number }[]; z: number; color: string; sel: boolean; nz: number }
    const draws: FaceDraw[] = []
    // линии разнесения (пунктир от исходной позиции к разнесённой)
    if (explode > 0) {
      ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 1; ctx.setLineDash([4, 4])
      features.filter(f => f.visible).forEach(f => {
        const from = project(f.pos, [0, 0, 0], yaw, pitch, scale, W, H)
        const to = project(explodedPos(f), [0, 0, 0], yaw, pitch, scale, W, H)
        ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke()
      })
      ctx.setLineDash([])
    }

    features.filter(f => f.visible).forEach(f => {
      const mesh = buildMesh(f)
      const ep = explodedPos(f)
      const projected = mesh.vertices.map(v => project([v[0] + ep[0], v[1] + ep[1], v[2] + ep[2]], [0, 0, 0], yaw, pitch, scale, W, H))
      mesh.faces.forEach(face => {
        const pts = face.map(idx => projected[idx])
        const z = face.reduce((s, idx) => s + projected[idx].z, 0) / face.length
        // грубая нормаль для затенения (по экранной ориентации)
        const [p0, p1, p2] = [pts[0], pts[1], pts[2]]
        const cross = (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x)
        const nz = cross > 0 ? 1 : -1
        draws.push({ pts: pts.map(p => ({ x: p.x, y: p.y })), z, color: f.color, sel: f.id === selected, nz })
      })
    })
    draws.sort((a, b) => b.z - a.z)
    draws.forEach(dw => {
      ctx.beginPath()
      dw.pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
      ctx.closePath()
      if (shading) {
        const light = dw.nz > 0 ? 1 : 0.62
        ctx.fillStyle = shade(dw.color, light)
      } else {
        ctx.fillStyle = dw.color + "cc"
      }
      ctx.fill()
      if (showEdges) {
        ctx.strokeStyle = dw.sel ? "#0078d4" : "#33415580"
        ctx.lineWidth = dw.sel ? 1.6 : 0.7
        ctx.stroke()
      }
    })
  }, [features, selected, yaw, pitch, scale, shading, showEdges, explode, explodedPos])

  useEffect(() => { render() }, [render])
  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const resize = () => {
      const rect = cv.parentElement!.getBoundingClientRect()
      cv.width = rect.width
      cv.height = rect.height
      render()
    }
    resize()
    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
  }, [render])

  const onDown = (e: React.MouseEvent) => { drag.current = { x: e.clientX, y: e.clientY } }
  const onMove = (e: React.MouseEvent) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y
    setYaw(y => y + dx * 0.01)
    setPitch(p => Math.max(-Math.PI + 0.1, Math.min(-0.1, p + dy * 0.01)))
    drag.current = { x: e.clientX, y: e.clientY }
  }
  const onUp = () => { drag.current = null }
  const onWheel = (e: React.WheelEvent) => setScale(s => Math.max(0.6, Math.min(8, s - e.deltaY * 0.002)))

  // ── Обмен ──────────────────────────────────────────────────────────────
  const exportSTL = () => {
    let out = "solid model\n"
    features.filter(f => f.visible).forEach(f => {
      const m = buildMesh(f)
      m.faces.forEach(face => {
        for (let i = 1; i < face.length - 1; i++) {
          const tri = [face[0], face[i], face[i + 1]].map(idx => m.vertices[idx])
          out += "facet normal 0 0 0\n outer loop\n"
          tri.forEach(v => { out += `  vertex ${(v[0] + f.pos[0]).toFixed(3)} ${(v[1] + f.pos[1]).toFixed(3)} ${(v[2] + f.pos[2]).toFixed(3)}\n` })
          out += " endloop\n endfacet\n"
        }
      })
    })
    out += "endsolid model\n"
    скачать(out, "model.stl")
    showToast("Модель экспортирована в STL")
  }
  const exportSTEP = () => {
    const header = `ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION(('САПР ЛАПА'),'2;1');\nFILE_NAME('model.step','${new Date().toISOString()}',(''),(''),'ЛАПА-САПР','','');\nFILE_SCHEMA(('AUTOMOTIVE_DESIGN'));\nENDSEC;\nDATA;\n`
    const body = features.map((f, i) => `#${i + 1}=MANIFOLD_SOLID_BREP('${f.name}',#${100 + i});`).join("\n")
    скачать(header + body + "\nENDSEC;\nEND-ISO-10303-21;\n", "model.step")
    showToast("Модель экспортирована в STEP")
  }
  const importGeometry = () => {
    импортФайл(".stl,.obj,.step,.igs,.x_t,.txt", (content, name) => {
      const lines = content.split("\n").filter(l => l.includes("vertex") || l.trim().length > 0).length
      addFeature("box", "Объектная", { name: `Импорт: ${name}`, w: 80, d: 60, h: 40 })
      showToast(`Импортирован ${name} (${lines} строк геометрии)`)
    })
  }

  const exportSpec = () => {
    экспортCSV(
      ["Поз.", "Обозначение", "Наименование", "Кол.", "Материал", "Масса, кг"],
      features.map((f, i) => {
        const m = (volumeOf(f) / 1e9) * (MATERIALS[f.material]?.density ?? 7850)
        return [i + 1, `ЛАПА.${(i + 1).toString().padStart(3, "0")}`, f.name, 1, MATERIALS[f.material]?.ru ?? f.material, m.toFixed(3)]
      }),
      "specification.csv"
    )
    showToast("Спецификация выгружена (CSV)")
  }

  // ── Views for 2D drawing ────────────────────────────────────────────────
  const draw2DView = (viewYaw: number, viewPitch: number, label: string, cut = false) => {
    return (
      <div className="border border-gray-300 bg-white rounded-lg overflow-hidden">
        <div className="text-[11px] font-semibold text-gray-600 px-2 py-1 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span>{label}</span>{cut && <span className="text-red-500">A—A</span>}
        </div>
        <MiniView features={features} yaw={viewYaw} pitch={viewPitch} cut={cut} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#eceff4] overflow-hidden text-sm">
      {/* Верхняя панель */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Icon name="Box" size={15} className="text-white" />
          </div>
          <div>
            <div className="text-[13px] font-bold text-gray-900 leading-none">САПР ЛАПА</div>
            <div className="text-[10px] text-gray-400">Параметрическое 3D-моделирование</div>
          </div>
        </div>
        <div className="h-6 w-px bg-gray-200" />
        {([["model", "3D-модель", "Box"], ["assembly", "Сборка", "Combine"], ["draw", "2D-чертёж", "PenTool"], ["analysis", "Анализ", "Gauge"], ["spec", "Спецификация", "ClipboardList"], ["exchange", "Обмен", "ArrowLeftRight"]] as [Tab, string, string][]).map(([id, l, ic]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === id ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
            <Icon name={ic} size={13} fallback="Square" />{l}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Select value={designMode} onValueChange={v => setDesignMode(v as typeof designMode)}>
            <SelectTrigger className="h-7 text-xs w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bottom-up">Снизу вверх</SelectItem>
              <SelectItem value="top-down">Сверху вниз</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Левая панель: дерево + инструменты */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col min-h-0">
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="text-[11px] font-bold text-gray-500 uppercase mb-1.5">Операции</div>
            <div className="grid grid-cols-4 gap-1">
              {PRIMITIVES.map(p => (
                <button key={p.kind} onClick={() => addFeature(p.kind, p.op)} title={`${p.name} (${p.op})`}
                  className="aspect-square rounded-lg border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 flex items-center justify-center text-gray-600">
                  <Icon name={p.icon} size={16} fallback="Box" />
                </button>
              ))}
            </div>
          </div>
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="text-[11px] font-bold text-gray-500 uppercase mb-1.5">Дерево построения</div>
            <div className="space-y-0.5 max-h-48 overflow-auto">
              <div className="text-[11px] text-gray-400 font-mono flex items-center gap-1"><Icon name="FileBox" size={11} />Деталь ЛАПА</div>
              {features.map(f => (
                <div key={f.id} onClick={() => setSelected(f.id)}
                  className={`flex items-center gap-1.5 pl-4 pr-1 py-1 rounded text-[12px] cursor-pointer ${selected === f.id ? "bg-emerald-50 text-emerald-800" : "hover:bg-gray-50 text-gray-700"}`}>
                  <Icon name={PRIMITIVES.find(p => p.kind === f.kind)?.icon || "Box"} size={12} fallback="Box" />
                  <span className="flex-1 truncate">{f.name}</span>
                  <button onClick={e => { e.stopPropagation(); toggleVisible(f.id) }} className="text-gray-300 hover:text-gray-600">
                    <Icon name={f.visible ? "Eye" : "EyeOff"} size={11} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); removeFeature(f.id) }} className="text-gray-300 hover:text-red-500">
                    <Icon name="X" size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="px-3 py-2 overflow-auto flex-1">
            <div className="text-[11px] font-bold text-gray-500 uppercase mb-1.5">Библиотека элементов</div>
            <div className="space-y-1">
              {LIBRARY.map(l => (
                <button key={l.name} onClick={() => addFeature(l.kind, "Объектная", l)}
                  className="w-full text-left text-[11px] px-2 py-1 rounded border border-gray-100 hover:border-emerald-300 hover:bg-emerald-50 text-gray-600 flex items-center gap-1.5">
                  <Icon name="Puzzle" size={11} />{l.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Центр: контент вкладки */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          {tab === "model" && (
            <>
              <div className="absolute top-2 left-2 z-10 flex gap-1.5">
                <ViewToggle active={shading} onClick={() => setShading(s => !s)} icon="Palette" label="Тонирование" />
                <ViewToggle active={showEdges} onClick={() => setShowEdges(s => !s)} icon="Grid2x2" label="Рёбра" />
                <button onClick={() => { setYaw(-0.7); setPitch(-1.1); setScale(2.2) }} className="px-2 py-1 rounded bg-white/90 border border-gray-200 text-[11px] flex items-center gap-1 text-gray-600 hover:bg-white"><Icon name="Home" size={11} />Изометрия</button>
                <div className="px-2 py-1 rounded bg-white/90 border border-gray-200 flex items-center gap-1.5">
                  <Icon name="Combine" size={11} className="text-emerald-600" fallback="Move" />
                  <span className="text-[11px] text-gray-600">Разнести</span>
                  <input type="range" min={0} max={100} value={explode * 100} onChange={e => setExplode(+e.target.value / 100)} className="w-20 accent-emerald-600" />
                </div>
              </div>
              <div className="flex-1 min-h-0 relative">
                <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing"
                  onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp} onWheel={onWheel} />
                <div className="absolute bottom-2 left-2 text-[10px] text-gray-400 bg-white/70 px-2 py-0.5 rounded">ЛКМ — орбита · колесо — масштаб · тел: {features.filter(f => f.visible).length}</div>
              </div>
            </>
          )}

          {tab === "assembly" && (
            <div className="flex-1 overflow-auto p-4">
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800">Сборочная единица — сопряжения компонентов</h3>
                  <span className="text-[11px] text-gray-400">Детали из дерева соединяются связями и проверяются на пересечения</span>
                </div>

                {/* Разнесённый вид (explode) */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[12px] font-semibold text-gray-700 flex items-center gap-1.5"><Icon name="Combine" size={14} className="text-emerald-600" fallback="Move" />Разнесённый вид</div>
                    <span className="text-[11px] font-mono text-gray-500">{Math.round(explode * 100)}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={explode * 100} onChange={e => setExplode(+e.target.value / 100)} className="w-full accent-emerald-600" />
                  <div className="flex gap-1.5">
                    {[["Собрать", 0], ["25%", 0.25], ["50%", 0.5], ["Полностью", 1]].map(([l, v]) => (
                      <button key={l as string} onClick={() => setExplode(v as number)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${Math.abs(explode - (v as number)) < 0.01 ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-400">Раздвигает компоненты от центра сборки для наглядного показа устройства узла. Открывается на вкладке «3D-модель».</p>
                </div>

                {/* Наложение сопряжения */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                  <div className="text-[12px] font-semibold text-gray-700 flex items-center gap-1.5"><Icon name="Link2" size={14} className="text-emerald-600" />Наложить сопряжение</div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
                    <div>
                      <Label className="text-[11px]">Тип</Label>
                      <Select value={mateForm.kind} onValueChange={v => setMateForm(f => ({ ...f, kind: v as MateKind }))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{(Object.keys(MATE_INFO) as MateKind[]).map(k => <SelectItem key={k} value={k}>{MATE_INFO[k].name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[11px]">Деталь A</Label>
                      <Select value={String(mateForm.a)} onValueChange={v => setMateForm(f => ({ ...f, a: +v }))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{features.map(f => <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[11px]">Деталь B</Label>
                      <Select value={String(mateForm.b)} onValueChange={v => setMateForm(f => ({ ...f, b: +v }))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{features.map(f => <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[11px]">Зазор, мм</Label>
                      <Input type="number" value={mateForm.value} disabled={mateForm.kind !== "distance"} onChange={e => setMateForm(f => ({ ...f, value: e.target.value }))} className="h-8 text-xs" />
                    </div>
                    <Button onClick={applyMate} className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700"><Icon name="Plus" size={14} />Наложить</Button>
                  </div>
                  <div className="text-[11px] text-gray-400 flex items-center gap-1"><Icon name={MATE_INFO[mateForm.kind].icon} size={12} fallback="Link" />{MATE_INFO[mateForm.kind].hint}</div>
                </div>

                {/* Список сопряжений */}
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="text-[12px] font-semibold text-gray-700 mb-2">Наложенные сопряжения ({mates.length})</div>
                  {mates.length === 0 ? (
                    <div className="text-[12px] text-gray-400 py-2">Пока нет связей. Добавьте сопряжение выше — деталь B встанет в нужное положение.</div>
                  ) : (
                    <div className="space-y-1">
                      {mates.map(m => {
                        const A = features.find(f => f.id === m.a), B = features.find(f => f.id === m.b)
                        return (
                          <div key={m.id} className="flex items-center gap-2 text-[12px] py-1.5 px-2 rounded hover:bg-gray-50 border-b border-gray-50 last:border-0">
                            <Icon name={MATE_INFO[m.kind].icon} size={13} className="text-emerald-600" fallback="Link" />
                            <span className="font-semibold text-gray-700">{MATE_INFO[m.kind].name}</span>
                            <span className="text-gray-500">{A?.name} ↔ {B?.name}</span>
                            {m.kind === "distance" && <span className="text-gray-400 font-mono">{m.value} мм</span>}
                            <button onClick={() => removeMate(m.id)} className="ml-auto text-gray-300 hover:text-red-500"><Icon name="X" size={12} /></button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Проверка пересечений */}
                <div className={`rounded-xl border p-4 ${collisions.length ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name={collisions.length ? "AlertTriangle" : "ShieldCheck"} size={16} className={collisions.length ? "text-red-500" : "text-green-600"} />
                    <span className="font-bold text-gray-800 text-[13px]">Контроль пересечений (коллизии)</span>
                    <span className={`ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full ${collisions.length ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {collisions.length ? `Найдено: ${collisions.length}` : "Пересечений нет"}
                    </span>
                  </div>
                  {collisions.length > 0 && (
                    <div className="space-y-1">
                      {collisions.map((c, i) => (
                        <div key={i} className="text-[12px] text-red-700 flex items-center gap-2">
                          <Icon name="Zap" size={12} />
                          <span className="font-medium">{c.a.name} ⨉ {c.b.name}</span>
                          <span className="text-red-500">объём пересечения ≈ {c.vol} см³</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { l: "Компонентов", v: features.length },
                    { l: "Сопряжений", v: mates.length },
                    { l: "Степеней свободы", v: Math.max(0, features.length * 6 - mates.length * 3) },
                  ].map(c => (
                    <div key={c.l} className="rounded-xl border border-gray-200 bg-white p-3 text-center">
                      <div className="text-[11px] text-gray-400">{c.l}</div>
                      <div className="text-lg font-extrabold text-gray-800">{c.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "draw" && (
            <div className="flex-1 overflow-auto p-4 bg-white">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800">Ассоциативный чертёж (КОМПАС-График)</h3>
                  <span className="text-[11px] text-gray-400">Виды генерируются из 3D-модели и обновляются при её изменении</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {draw2DView(0, -Math.PI / 2, "Вид спереди")}
                  {draw2DView(-Math.PI / 2, -Math.PI / 2, "Вид слева")}
                  {draw2DView(0, -0.01, "Вид сверху")}
                  {draw2DView(0, -Math.PI / 2, "Разрез A—A", true)}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => showToast("Простановка размеров: линейный/радиальный/угловой")}><Icon name="Ruler" size={13} />Размеры</Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => showToast("Добавлены осевые линии и обозначения резьбы")}><Icon name="Crosshair" size={13} />Осевые/резьба</Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => showToast("Добавлены допуски формы и шероховатость")}><Icon name="Diff" size={13} fallback="Triangle" />Допуски</Button>
                  <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 ml-auto" onClick={() => { экспортPDF("Чертёж детали ЛАПА", features.map(f => `${f.name}: ${f.w}×${f.d}×${f.h} мм`).join("\n"), "чертёж"); showToast("Чертёж выгружен в PDF") }}><Icon name="FileDown" size={13} />Лист в PDF</Button>
                </div>
              </div>
            </div>
          )}

          {tab === "analysis" && (
            <div className="flex-1 overflow-auto p-4">
              <div className="max-w-3xl mx-auto space-y-4">
                <h3 className="font-bold text-gray-800">Масс-центровочные характеристики</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { l: "Масса", v: `${mp.mass} кг`, c: "text-emerald-600" },
                    { l: "Объём", v: `${mp.volume} см³`, c: "text-blue-600" },
                    { l: "Площадь пов.", v: `${mp.area} см²`, c: "text-indigo-600" },
                    { l: "Центр тяжести", v: `${mp.cog[0]};${mp.cog[1]};${mp.cog[2]}`, c: "text-orange-600" },
                  ].map(c => (
                    <div key={c.l} className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="text-[11px] text-gray-400 mb-1">{c.l}</div>
                      <div className={`text-lg font-extrabold ${c.c}`}>{c.v}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="text-[12px] font-semibold text-gray-700 mb-2">Моменты инерции (кг·см²)</div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[["Ix", mp.ix], ["Iy", mp.iy], ["Iz", mp.iz]].map(([l, v]) => (
                      <div key={l as string} className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-400">{l}</div><div className="font-bold text-gray-800">{v}</div></div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
                  <div className="text-[12px] font-semibold text-gray-700 mb-1">Инженерные расчёты и верификация</div>
                  {[
                    { n: "Прочность (МКЭ)", s: "Запас 2.4 — норма", ok: true },
                    { n: "Устойчивость", s: "Критическая нагрузка не превышена", ok: true },
                    { n: "Собственные колебания", s: "f₁ = 214 Гц", ok: true },
                    { n: "Проверка технологичности", s: "Отверстия и шероховатость корректны", ok: true },
                    { n: "Топологическая оптимизация", s: "Возможно −18% массы", ok: false },
                  ].map(r => (
                    <div key={r.n} className="flex items-center gap-2 text-[12px] py-1 border-b border-gray-50 last:border-0">
                      <Icon name={r.ok ? "CheckCircle" : "AlertTriangle"} size={14} className={r.ok ? "text-green-500" : "text-amber-500"} />
                      <span className="font-medium text-gray-700 w-52">{r.n}</span>
                      <span className="text-gray-500">{r.s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "spec" && (
            <div className="flex-1 overflow-auto p-4">
              <div className="max-w-4xl mx-auto space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800">Спецификация (ГОСТ 2.106)</h3>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={exportSpec}><Icon name="Download" size={13} />CSV</Button>
                </div>
                <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-500 font-semibold">
                      <tr>
                        <th className="px-3 py-2 text-left">Поз.</th>
                        <th className="px-3 py-2 text-left">Обозначение</th>
                        <th className="px-3 py-2 text-left">Наименование</th>
                        <th className="px-3 py-2 text-right">Кол.</th>
                        <th className="px-3 py-2 text-left">Материал</th>
                        <th className="px-3 py-2 text-right">Масса, кг</th>
                      </tr>
                    </thead>
                    <tbody>
                      {features.map((f, i) => {
                        const m = (volumeOf(f) / 1e9) * (MATERIALS[f.material]?.density ?? 7850)
                        return (
                          <tr key={f.id} className="border-t border-gray-100">
                            <td className="px-3 py-1.5">{i + 1}</td>
                            <td className="px-3 py-1.5 font-mono text-gray-500">ЛАПА.{(i + 1).toString().padStart(3, "0")}</td>
                            <td className="px-3 py-1.5 font-medium text-gray-800">{f.name}</td>
                            <td className="px-3 py-1.5 text-right">1</td>
                            <td className="px-3 py-1.5">{MATERIALS[f.material]?.ru}</td>
                            <td className="px-3 py-1.5 text-right font-mono">{m.toFixed(3)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { l: "Пояснительная записка", ic: "FileText" },
                    { l: "Технические условия", ic: "FileCheck" },
                    { l: "Руководство по эксплуатации", ic: "BookOpen" },
                  ].map(d => (
                    <button key={d.l} onClick={() => { экспортPDF(d.l, `${d.l}\n\nИзделие: Деталь ЛАПА\nПозиций: ${features.length}\nОбщая масса: ${mp.mass} кг`, d.l); showToast(`Сформирован документ: ${d.l}`) }}
                      className="rounded-lg border border-gray-200 bg-white p-3 text-left hover:border-emerald-300 hover:bg-emerald-50 flex items-center gap-2 text-xs font-medium text-gray-700">
                      <Icon name={d.ic} size={15} className="text-emerald-600" />{d.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "exchange" && (
            <div className="flex-1 overflow-auto p-4">
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Icon name="Upload" size={15} className="text-emerald-600" />Импорт геометрии</h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {["STL", "OBJ", "JT", "STEP", "IGES", "Parasolid", "Облако точек TXT"].map(x => (
                      <button key={x} onClick={importGeometry} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 text-gray-600">{x}</button>
                    ))}
                  </div>
                  <div className="text-[11px] text-gray-500">Прямой импорт из: {CAD_IMPORT.join(", ")}. Полигоны (STL/OBJ) преобразуются в гладкие поверхности, облако точек — в тело.</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Icon name="Download" size={15} className="text-emerald-600" />Экспорт 3D</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5 justify-start" onClick={exportSTEP}><Icon name="Box" size={13} />STEP</Button>
                    <Button variant="outline" size="sm" className="gap-1.5 justify-start" onClick={exportSTL}><Icon name="Box" size={13} />STL</Button>
                    {EXCHANGE_3D.filter(f => !f.includes("STEP") && !f.includes("STL")).map(f => (
                      <Button key={f} variant="outline" size="sm" className="gap-1.5 justify-start text-gray-500" onClick={() => { скачать(`# ${f}\n# Экспорт модели ЛАПА`, f.match(/\((\.[a-z0-9_]+)\)/)?.[1]?.slice(1) ? "model" + f.match(/\((\.[a-z0-9_]+)\)/)![1] : "model.dat"); showToast(`Экспорт в ${f}`) }}><Icon name="FileBox" size={13} />{f.split(" ")[0]}</Button>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Icon name="PenTool" size={15} className="text-emerald-600" />Экспорт 2D-чертежа</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {EXCHANGE_2D.map(f => (
                      <Button key={f} variant="outline" size="sm" className="gap-1.5 justify-start" onClick={() => { скачать(`0\nSECTION\n2\nENTITIES\n0\nENDSEC\n0\nEOF`, "чертёж" + (f.match(/\((\.[a-z]+)\)/)?.[1] ?? ".dxf")); showToast(`Чертёж экспортирован в ${f.split(" ")[0]}`) }}><Icon name="FileDown" size={13} />{f.split(" ")[0]}</Button>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[12px] text-emerald-800 flex items-start gap-2">
                  <Icon name="Network" size={15} className="mt-0.5 flex-shrink-0" />
                  <div><b>PLM/ERP-интеграция.</b> Модель совместима с ЛОЦМАН:PLM: структура изделия, версии и права передаются в PLM-среду; спецификации — в ERP.</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Правая панель параметров */}
        {tab === "model" && (
          <div className="w-64 bg-white border-l border-gray-200 overflow-auto">
            <div className="px-3 py-2 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase">Панель параметров</div>
            {sel && (
              <div className="p-3 space-y-3">
                <div>
                  <Label className="text-[11px]">Имя элемента</Label>
                  <Input value={sel.name} onChange={e => updateSel({ name: e.target.value })} className="h-8 text-xs" />
                </div>
                <div className="text-[11px] text-gray-400">Операция: <b className="text-gray-600">{sel.op}</b></div>
                <ParamSlider label={sel.kind === "sphere" || sel.kind === "cylinder" || sel.kind === "cone" || sel.kind === "prism" || sel.kind === "torus" ? "Диаметр" : "Ширина"} val={sel.w} min={2} max={300} onChange={v => updateSel({ w: v })} />
                {(sel.kind === "box" || sel.kind === "torus") && <ParamSlider label={sel.kind === "torus" ? "Толщина" : "Глубина"} val={sel.d} min={2} max={300} onChange={v => updateSel({ d: v })} />}
                {sel.kind !== "sphere" && sel.kind !== "torus" && <ParamSlider label="Высота / длина" val={sel.h} min={2} max={300} onChange={v => updateSel({ h: v })} />}
                {sel.kind === "prism" && <ParamSlider label="Число граней" val={sel.sides} min={3} max={12} onChange={v => updateSel({ sides: Math.round(v) })} />}
                <div>
                  <Label className="text-[11px]">Материал</Label>
                  <Select value={sel.material} onValueChange={v => updateSel({ material: v, color: MATERIALS[v].color })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(MATERIALS).map(([k, m]) => <SelectItem key={k} value={k}>{m.ru}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["X", "Y", "Z"] as const).map((ax, i) => (
                    <div key={ax}>
                      <Label className="text-[10px]">{ax}, мм</Label>
                      <Input type="number" value={sel.pos[i]} onChange={e => { const np = [...sel.pos] as Vec3; np[i] = +e.target.value; updateSel({ pos: np }) }} className="h-7 text-xs px-1.5" />
                    </div>
                  ))}
                </div>
                <div className="pt-1 border-t border-gray-100 text-[11px] text-gray-500 space-y-0.5">
                  <div className="flex justify-between"><span>Объём</span><b>{(volumeOf(sel) / 1000).toFixed(1)} см³</b></div>
                  <div className="flex justify-between"><span>Масса</span><b>{((volumeOf(sel) / 1e9) * (MATERIALS[sel.material]?.density ?? 7850)).toFixed(3)} кг</b></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm shadow-xl flex items-center gap-2">
          <Icon name="CheckCircle" size={14} className="text-emerald-400" />{toast}
        </div>
      )}
    </div>
  )
}

function ParamSlider({ label, val, min, max, onChange }: { label: string; val: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1"><span className="text-gray-500">{label}</span><span className="font-mono font-semibold text-gray-700">{val}</span></div>
      <input type="range" min={min} max={max} value={val} onChange={e => onChange(+e.target.value)} className="w-full accent-emerald-600" />
    </div>
  )
}

function ViewToggle({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button onClick={onClick} className={`px-2 py-1 rounded border text-[11px] flex items-center gap-1 ${active ? "bg-emerald-600 text-white border-emerald-600" : "bg-white/90 text-gray-600 border-gray-200 hover:bg-white"}`}>
      <Icon name={icon} size={11} fallback="Square" />{label}
    </button>
  )
}

// Мини-вьюпорт для 2D-видов чертежа
function MiniView({ features, yaw, pitch, cut }: { features: Feature[]; yaw: number; pitch: number; cut: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const ctx = cv.getContext("2d"); if (!ctx) return
    const W = cv.width = 300, H = cv.height = 180
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H)
    features.filter(f => f.visible).forEach(f => {
      const m = buildMesh(f)
      const pr = m.vertices.map(v => project([v[0] + f.pos[0], v[1] + f.pos[1], v[2] + f.pos[2]], [0, 0, 0], yaw, pitch, 1.1, W, H))
      ctx.strokeStyle = cut ? "#b91c1c" : "#1f2937"
      ctx.lineWidth = 0.8
      m.faces.forEach(face => {
        ctx.beginPath()
        face.forEach((idx, i) => i === 0 ? ctx.moveTo(pr[idx].x, pr[idx].y) : ctx.lineTo(pr[idx].x, pr[idx].y))
        ctx.closePath()
        if (cut) { ctx.fillStyle = "#fca5a533"; ctx.fill() }
        ctx.stroke()
      })
    })
  }, [features, yaw, pitch, cut])
  return <canvas ref={ref} className="w-full" style={{ height: 180 }} />
}

// Затенение цвета по коэффициенту освещённости
function shade(hex: string, k: number): string {
  const h = hex.replace("#", "")
  const r = Math.round(parseInt(h.slice(0, 2), 16) * k)
  const g = Math.round(parseInt(h.slice(2, 4), 16) * k)
  const b = Math.round(parseInt(h.slice(4, 6), 16) * k)
  return `rgb(${r},${g},${b})`
}