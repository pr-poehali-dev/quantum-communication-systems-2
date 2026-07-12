import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import Icon from "@/components/ui/icon"
import { project, Vec3 } from "./sapr-engine"

// ─── Модель сборки (компоненты дерева) ───────────────────────────────────────
type Shape = "ring" | "disk" | "shaft" | "blades" | "box" | "cone" | "flange"

interface Comp {
  id: number
  name: string
  qty?: number
  shape: Shape
  color: string
  // геометрия вдоль оси X (ось сборки)
  x: number            // позиция центра вдоль оси
  r: number            // радиус
  len: number          // длина по оси
  explode: number      // множитель разнесения
  visible: boolean
  fixed?: boolean      // компонент зафиксирован (значок кнопки)
}

const C_BLUE = "#3a7bd5"
const C_GREEN = "#25d366"

const START: Comp[] = [
  { id: 1, name: "Корпус передний", shape: "flange", color: C_BLUE, x: -240, r: 120, len: 60, explode: -2.2, visible: true, fixed: true },
  { id: 2, name: "Корпус КНД", shape: "ring", color: C_BLUE, x: -140, r: 118, len: 90, explode: -1.3, visible: true, fixed: true },
  { id: 3, name: "Ротор", shape: "blades", color: C_GREEN, x: 0, r: 96, len: 150, explode: 0, visible: true },
  { id: 4, name: "Механизм поворота", qty: 2, shape: "box", color: C_BLUE, x: 60, r: 40, len: 30, explode: 0.6, visible: true },
  { id: 5, name: "ПЦВ", shape: "disk", color: C_BLUE, x: 120, r: 90, len: 18, explode: 1.1, visible: true },
  { id: 6, name: "ПЦО", shape: "disk", color: C_BLUE, x: 150, r: 88, len: 18, explode: 1.4, visible: true },
  { id: 7, name: "Талреп", qty: 2, shape: "shaft", color: C_BLUE, x: 190, r: 12, len: 80, explode: 1.7, visible: true },
  { id: 8, name: "Обтекатель внутренний", shape: "cone", color: C_BLUE, x: -300, r: 70, len: 60, explode: -2.8, visible: true },
  { id: 9, name: "Переходник", shape: "cone", color: C_BLUE, x: -340, r: 50, len: 40, explode: -3.3, visible: true },
  { id: 10, name: "Клапан стравливания", qty: 2, shape: "box", color: C_BLUE, x: 90, r: 26, len: 26, explode: 0.9, visible: true },
  { id: 11, name: "Кронштейн ОПЦ", shape: "box", color: C_BLUE, x: 220, r: 30, len: 20, explode: 2.0, visible: true },
  { id: 12, name: "Кронштейн ВПЦ", shape: "box", color: C_BLUE, x: 240, r: 30, len: 20, explode: 2.3, visible: true },
  { id: 13, name: "Вилка", qty: 8, shape: "box", color: C_BLUE, x: 270, r: 16, len: 16, explode: 2.6, visible: true },
  { id: 14, name: "Проушина", qty: 8, shape: "box", color: C_BLUE, x: 290, r: 14, len: 14, explode: 2.9, visible: true },
  { id: 15, name: "Втулка резьбовая", qty: 5, shape: "shaft", color: C_BLUE, x: 310, r: 10, len: 24, explode: 3.2, visible: true },
  { id: 16, name: "Гайка", qty: 16, shape: "box", color: C_BLUE, x: 330, r: 9, len: 8, explode: 3.5, visible: true },
]

// Пункты верхнего меню (как в КОМПАС)
const MENU = ["Файл", "Правка", "Выделить", "Вид", "Эскиз", "Моделирование", "Сборка", "Оформление", "Диагностика", "Управление", "Настройка", "Приложения", "Окно", "Справка"]

// Группы ленты инструментов
const RIBBON: { group: string; icons: string[] }[] = [
  { group: "Системная", icons: ["FolderOpen", "Save", "SaveAll", "Undo2", "Redo2"] },
  { group: "Компоненты", icons: ["PackagePlus", "Boxes", "Percent"] },
  { group: "Размещение компонентов", icons: ["Move3D", "RotateCw", "AlignHorizontalSpaceAround", "CircleDot", "Ruler", "Magnet"] },
  { group: "Операции", icons: ["Box", "Cylinder", "Layers", "Scissors"] },
  { group: "Вспомогательные", icons: ["Axis3D", "SquareDashed", "Grid3x3"] },
  { group: "Размеры", icons: ["Ruler", "MoveHorizontal", "Diameter", "Spline"] },
  { group: "Обозначения", icons: ["Type", "Tag", "Flag", "MessageSquare"] },
  { group: "Диагностика", icons: ["ShieldCheck", "Ruler", "Scale"] },
  { group: "Моя a3d", icons: ["Star", "Layers3", "Settings2"] },
]

// Нижняя панель вида
const VIEWBAR_LEFT = ["Frame", "QrCode", "Clipboard", "Layers", "LayoutGrid"]
const VIEWBAR_RIGHT = ["Search", "Share2", "Axis3D", "Box", "Eye", "EyeOff", "Spline", "Grid3x3", "Filter", "Ruler", "Pipette"]

export default function AssemblyModule() {
  const [comps, setComps] = useState<Comp[]>(START)
  const [sel, setSel] = useState<number | null>(3)
  const [explode, setExplode] = useState(0.55)
  const [yaw, setYaw] = useState(-0.62)
  const [pitch, setPitch] = useState(0.38)
  const [scale, setScale] = useState(1.15)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [treeExpanded, setTreeExpanded] = useState(true)
  const canvasRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null)

  // ── Вращение мышью ──
  const onDown = (e: React.MouseEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, yaw, pitch }
  }
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!drag.current) return
      const dx = e.clientX - drag.current.x
      const dy = e.clientY - drag.current.y
      setYaw(drag.current.yaw + dx * 0.008)
      setPitch(Math.max(-1.4, Math.min(1.4, drag.current.pitch + dy * 0.008)))
    }
    const up = () => { drag.current = null }
    window.addEventListener("mousemove", move)
    window.addEventListener("mouseup", up)
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up) }
  }, [])

  const onWheel = (e: React.WheelEvent) => {
    setScale(s => Math.max(0.5, Math.min(3, s - e.deltaY * 0.001)))
  }

  const toggleVisible = (id: number) =>
    setComps(cs => cs.map(c => c.id === id ? { ...c, visible: !c.visible } : c))

  const W = 1240, H = 720

  // Проекция центра компонента с учётом разнесения вдоль оси сборки (X)
  const compCenter = useCallback((c: Comp): Vec3 => {
    const ex = c.explode * explode * 120
    return [c.x + ex, 0, 0]
  }, [explode])

  // ── Рендер одного компонента как набор проволочных колец/линий ──
  const renderComp = (c: Comp) => {
    if (!c.visible) return null
    const [cx] = compCenter(c)
    const active = sel === c.id
    const stroke = active ? C_GREEN : c.color
    const sw = active ? 1.6 : 1
    const op = active ? 1 : 0.85
    const segs = 40
    const els: JSX.Element[] = []

    const ring = (offX: number, r: number, key: string) => {
      let d = ""
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2
        const p: Vec3 = [cx + offX, Math.cos(a) * r, Math.sin(a) * r]
        const pr = project(p, [0, 0, 0], yaw, pitch, scale, W, H)
        d += `${i === 0 ? "M" : "L"}${pr.x.toFixed(1)} ${pr.y.toFixed(1)} `
      }
      els.push(<path key={key} d={d} fill="none" stroke={stroke} strokeWidth={sw} opacity={op} />)
    }
    // продольные образующие
    const generatrix = (r1: number, r2: number) => {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        const p1 = project([cx - c.len / 2, Math.cos(a) * r1, Math.sin(a) * r1], [0, 0, 0], yaw, pitch, scale, W, H)
        const p2 = project([cx + c.len / 2, Math.cos(a) * r2, Math.sin(a) * r2], [0, 0, 0], yaw, pitch, scale, W, H)
        els.push(<line key={`g${c.id}-${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={stroke} strokeWidth={sw * 0.7} opacity={op * 0.7} />)
      }
    }

    if (c.shape === "blades") {
      // ротор: несколько дисков с «лопатками»
      const stages = 5
      for (let s = 0; s < stages; s++) {
        const offX = -c.len / 2 + (s + 0.5) * (c.len / stages)
        const r = c.r * (1 - s * 0.09)
        ring(offX, r * 0.35, `hub${c.id}-${s}`)
        // лопатки
        for (let i = 0; i < 22; i++) {
          const a = (i / 22) * Math.PI * 2 + s * 0.14
          const p1 = project([cx + offX, Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.4], [0, 0, 0], yaw, pitch, scale, W, H)
          const p2 = project([cx + offX + 6, Math.cos(a + 0.12) * r, Math.sin(a + 0.12) * r], [0, 0, 0], yaw, pitch, scale, W, H)
          els.push(<line key={`bl${c.id}-${s}-${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={stroke} strokeWidth={sw} opacity={op} />)
        }
      }
      // вал
      const va = project([cx - c.len / 2 - 30, 0, 0], [0, 0, 0], yaw, pitch, scale, W, H)
      const vb = project([cx + c.len / 2 + 30, 0, 0], [0, 0, 0], yaw, pitch, scale, W, H)
      els.push(<line key={`shaft${c.id}`} x1={va.x} y1={va.y} x2={vb.x} y2={vb.y} stroke={stroke} strokeWidth={sw * 1.4} opacity={op} />)
    } else if (c.shape === "shaft") {
      ring(-c.len / 2, c.r, `r1${c.id}`)
      ring(c.len / 2, c.r, `r2${c.id}`)
      generatrix(c.r, c.r)
    } else if (c.shape === "disk" || c.shape === "flange") {
      ring(-c.len / 2, c.r, `r1${c.id}`)
      ring(c.len / 2, c.r, `r2${c.id}`)
      ring(0, c.r * 0.35, `hole${c.id}`)
      generatrix(c.r, c.r)
      if (c.shape === "flange") {
        // болтовые отверстия по окружности
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2
          const p = project([cx, Math.cos(a) * c.r * 0.78, Math.sin(a) * c.r * 0.78], [0, 0, 0], yaw, pitch, scale, W, H)
          els.push(<circle key={`h${c.id}-${i}`} cx={p.x} cy={p.y} r={2.2} fill="none" stroke={stroke} strokeWidth={0.8} opacity={op} />)
        }
      }
    } else if (c.shape === "ring") {
      ring(-c.len / 2, c.r, `r1${c.id}`)
      ring(c.len / 2, c.r, `r2${c.id}`)
      ring(-c.len / 2, c.r * 0.9, `ri1${c.id}`)
      ring(c.len / 2, c.r * 0.9, `ri2${c.id}`)
      generatrix(c.r, c.r)
    } else if (c.shape === "cone") {
      ring(-c.len / 2, c.r, `r1${c.id}`)
      ring(c.len / 2, c.r * 0.35, `r2${c.id}`)
      generatrix(c.r, c.r * 0.35)
    } else {
      // box
      const hs = c.r
      const corners: Vec3[] = [
        [cx - c.len / 2, -hs, -hs], [cx + c.len / 2, -hs, -hs], [cx + c.len / 2, hs, -hs], [cx - c.len / 2, hs, -hs],
        [cx - c.len / 2, -hs, hs], [cx + c.len / 2, -hs, hs], [cx + c.len / 2, hs, hs], [cx - c.len / 2, hs, hs],
      ]
      const pr = corners.map(p => project(p, [0, 0, 0], yaw, pitch, scale, W, H))
      const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]
      edges.forEach(([a, b], i) =>
        els.push(<line key={`e${c.id}-${i}`} x1={pr[a].x} y1={pr[a].y} x2={pr[b].x} y2={pr[b].y} stroke={stroke} strokeWidth={sw} opacity={op} />)
      )
    }

    return <g key={c.id} style={{ cursor: "pointer" }} onClick={() => setSel(c.id)}>{els}</g>
  }

  // Габаритный бокс выбранного компонента (зелёный, как на скрине)
  const selBox = useMemo(() => {
    const c = comps.find(x => x.id === sel)
    if (!c || !c.visible) return null
    const [cx] = compCenter(c)
    const hx = c.len / 2 + 20, hr = c.r + 14
    const corners: Vec3[] = [
      [cx - hx, -hr, -hr], [cx + hx, -hr, -hr], [cx + hx, hr, -hr], [cx - hx, hr, -hr],
      [cx - hx, -hr, hr], [cx + hx, -hr, hr], [cx + hx, hr, hr], [cx - hx, hr, hr],
    ]
    const pr = corners.map(p => project(p, [0, 0, 0], yaw, pitch, scale, W, H))
    const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]
    return (
      <g>
        {edges.map(([a, b], i) =>
          <line key={i} x1={pr[a].x} y1={pr[a].y} x2={pr[b].x} y2={pr[b].y} stroke={C_GREEN} strokeWidth={1.4} opacity={0.9} />
        )}
        {pr.map((p, i) => <rect key={`c${i}`} x={p.x - 3} y={p.y - 3} width={6} height={6} fill="none" stroke={C_GREEN} strokeWidth={1.2} />)}
      </g>
    )
  }, [comps, sel, compCenter, yaw, pitch, scale])

  // порядок отрисовки: дальние компоненты первыми (грубая z-сортировка по X-разнесению)
  const ordered = [...comps].sort((a, b) => compCenter(a)[0] - compCenter(b)[0])

  return (
    <div className="rounded-xl overflow-hidden border border-[#3a3f4b] bg-[#2b2f38] text-gray-200 select-none" style={{ fontFamily: "Segoe UI, sans-serif" }}>
      {/* ── Верхнее меню ── */}
      <div className="flex items-center bg-[#2b2f38] border-b border-[#1f232b] text-[13px] relative">
        <div className="w-9 h-9 flex items-center justify-center bg-[#1f232b] text-[#3a7bd5]">
          <Icon name="Hexagon" size={18} className="text-[#3a7bd5]" />
        </div>
        {MENU.map(m => (
          <button key={m} onClick={() => setOpenMenu(openMenu === m ? null : m)}
            className={`px-2.5 h-9 hover:bg-[#3a3f4b] ${openMenu === m ? "bg-[#3a3f4b]" : ""}`}>{m}</button>
        ))}
        <div className="ml-auto flex items-center gap-1 pr-2">
          <button className="w-8 h-9 flex items-center justify-center hover:bg-[#3a3f4b]"><Icon name="LayoutTemplate" size={15} /></button>
          <button className="w-8 h-9 flex items-center justify-center hover:bg-[#3a3f4b]"><Icon name="Settings" size={15} /></button>
          <div className="flex items-center bg-[#1f232b] rounded px-2 h-7 w-56 gap-2 text-gray-400 text-[12px]">
            <Icon name="Search" size={13} /><span>Поиск по командам (Alt+/)</span>
          </div>
          <button className="w-8 h-9 flex items-center justify-center hover:bg-[#3a3f4b]"><Icon name="Minus" size={15} /></button>
          <button className="w-8 h-9 flex items-center justify-center hover:bg-[#3a3f4b]"><Icon name="Square" size={13} /></button>
          <button className="w-8 h-9 flex items-center justify-center hover:bg-red-600"><Icon name="X" size={15} /></button>
        </div>

        {openMenu && (
          <div className="absolute top-9 left-10 z-30 bg-[#2b2f38] border border-[#1f232b] shadow-2xl rounded-b w-56 py-1 text-[13px]" onMouseLeave={() => setOpenMenu(null)}>
            {["Создать…", "Открыть…", "Сохранить", "Экспорт в STEP/IFC", "Печать", "Свойства модели"].map(i => (
              <button key={i} className="w-full text-left px-3 py-1.5 hover:bg-[#3a7bd5] hover:text-white">{i}</button>
            ))}
          </div>
        )}
      </div>

      {/* ── Вкладка документа ── */}
      <div className="flex items-center bg-[#232830] border-b border-[#1f232b] text-[12px]">
        <div className="w-9 h-8 flex items-center justify-center border-r border-[#1f232b]"><Icon name="House" size={14} className="text-gray-400" /></div>
        <div className="flex items-center gap-2 px-3 h-8 bg-[#2b2f38] border-r border-[#1f232b] text-[#7db3ff]">
          <Icon name="Boxes" size={14} />
          <span>АБВГ.000.000 Компрессор…</span>
          <Icon name="X" size={13} className="hover:text-white cursor-pointer" />
        </div>
      </div>

      {/* ── Лента инструментов ── */}
      <div className="bg-[#2b2f38] border-b border-[#1f232b]">
        <div className="flex items-stretch">
          <div className="flex items-center gap-1 px-3 bg-[#1f232b] text-[13px] font-medium min-w-[112px]">
            <Icon name="Boxes" size={15} className="text-[#3a7bd5]" />Сборка
          </div>
          <div className="flex-1 flex items-end overflow-x-auto">
            {RIBBON.map(g => (
              <div key={g.group} className="flex flex-col items-center border-r border-[#1f232b] px-1.5 pt-1">
                <div className="flex items-center gap-0.5">
                  {g.icons.map((ic, i) => (
                    <button key={i} className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#3a3f4b] text-gray-300">
                      <Icon name={ic} size={17} fallback="Square" />
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5 whitespace-nowrap flex items-center gap-1">{g.group}<Icon name="ChevronDown" size={9} /></div>
              </div>
            ))}
          </div>
        </div>
        {/* второй ряд — панель вида */}
        <div className="flex items-center gap-1 px-2 h-9 border-t border-[#1f232b] bg-[#262b33]">
          {VIEWBAR_LEFT.map((ic, i) => (
            <button key={i} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#3a3f4b] text-gray-400"><Icon name={ic} size={15} fallback="Square" /></button>
          ))}
          <div className="w-px h-5 bg-[#1f232b] mx-1" />
          {VIEWBAR_RIGHT.map((ic, i) => (
            <button key={i} className={`w-7 h-7 flex items-center justify-center rounded hover:bg-[#3a3f4b] ${ic === "Box" ? "text-[#3a7bd5]" : "text-gray-400"}`}><Icon name={ic} size={15} fallback="Square" /></button>
          ))}
        </div>
      </div>

      <div className="flex" style={{ height: 560 }}>
        {/* ── Левая колонка иконок ── */}
        <div className="w-9 bg-[#232830] border-r border-[#1f232b] flex flex-col items-center py-2 gap-3">
          {["ListTree", "Ruler", "FunctionSquare", "Menu", "Share2"].map((ic, i) => (
            <button key={i} className={`w-7 h-7 flex items-center justify-center rounded hover:bg-[#3a3f4b] ${i === 0 ? "text-[#3a7bd5]" : "text-gray-400"}`}><Icon name={ic} size={16} fallback="Square" /></button>
          ))}
          <button onClick={() => setTreeExpanded(!treeExpanded)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#3a3f4b] text-gray-400 mt-auto">
            <Icon name={treeExpanded ? "PanelLeftClose" : "PanelLeftOpen"} size={16} />
          </button>
        </div>

        {/* ── Дерево компонентов ── */}
        {treeExpanded && (
          <div className="w-[340px] bg-[#262b33] border-r border-[#1f232b] overflow-y-auto text-[13px]">
            <TreeRow icon="Boxes" label="(+)Компрессор низкого давления (Тел-0, С" bold onEye={() => {}} depth={0} />
            {[
              { icon: "Compass", label: "Системы координат", muted: true },
              { icon: "Grid2x2", label: "Компоновочная геометрия", muted: true },
              { icon: "Library", label: "Коллекции" },
              { icon: "SquareCode", label: "Макро" },
            ].map((r, i) => <TreeRow key={i} icon={r.icon} label={r.label} muted={r.muted} depth={1} chevron />)}

            <TreeRow icon="Network" label="Компоненты" depth={1} chevron expanded eye />
            {ordered.slice().reverse().map(c => (
              <button key={c.id} onClick={() => setSel(c.id)}
                className={`w-full flex items-center gap-1.5 pr-2 h-[26px] ${sel === c.id ? "bg-[#37506e]" : "hover:bg-[#2f353f]"}`}
                style={{ paddingLeft: 34 }}>
                <span onClick={e => { e.stopPropagation(); toggleVisible(c.id) }} className="w-5 flex justify-center text-gray-400 hover:text-white">
                  <Icon name={c.visible ? "Eye" : "EyeOff"} size={14} />
                </span>
                <Icon name="ChevronRight" size={12} className="text-gray-500 shrink-0" />
                <Icon name="Box" size={13} className="text-[#7db3ff] shrink-0" />
                {c.fixed && <Icon name="Pin" size={11} className="text-gray-400 shrink-0" />}
                <span className={`truncate ${c.visible ? "" : "text-gray-500 line-through"}`}>
                  {c.name}{c.qty ? ` (x${c.qty})` : ""}
                </span>
              </button>
            ))}
            {/* оси координат внизу */}
            <div className="flex items-center gap-1 px-2 py-2 text-[11px] text-gray-500">
              <Icon name="Axis3D" size={22} className="text-red-400" />
            </div>
          </div>
        )}

        {/* ── 3D-область ── */}
        <div ref={canvasRef} onMouseDown={onDown} onWheel={onWheel}
          className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
          style={{ background: "radial-gradient(circle at 60% 45%, #2f343d 0%, #21252c 70%, #191c22 100%)" }}>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            {ordered.map(renderComp)}
            {selBox}
          </svg>

          {/* Логотип-подсказка навигации в углу */}
          <div className="absolute top-3 right-3 bg-[#1f232b]/80 border border-[#3a3f4b] rounded p-1.5">
            <Icon name="Boxes" size={26} className="text-[#3a7bd5]" />
          </div>

          {/* Панель разнесения */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#1f232b]/90 border border-[#3a3f4b] rounded-lg px-4 py-2 backdrop-blur">
            <Icon name="Shrink" size={15} className="text-gray-400" />
            <input type="range" min={0} max={1.6} step={0.02} value={explode}
              onChange={e => setExplode(parseFloat(e.target.value))}
              className="w-56 accent-[#3a7bd5]" />
            <Icon name="Expand" size={15} className="text-gray-400" />
            <span className="text-[12px] text-gray-300 w-28">Разнесение сборки</span>
            <div className="w-px h-5 bg-[#3a3f4b]" />
            <button onClick={() => { setYaw(-0.62); setPitch(0.38); setScale(1.15) }}
              className="flex items-center gap-1 text-[12px] text-gray-300 hover:text-white">
              <Icon name="Home" size={14} />Вид
            </button>
          </div>

          {/* Триада координат */}
          <div className="absolute bottom-3 left-3">
            <svg width="72" height="72" viewBox="0 0 72 72">
              {(() => {
                const o = project([0, 0, 0], [0, 0, 0], yaw, pitch, 0.5, 72, 72)
                const ax = (v: Vec3, col: string, lbl: string) => {
                  const p = project(v, [0, 0, 0], yaw, pitch, 0.5, 72, 72)
                  return <><line x1={o.x} y1={o.y} x2={p.x} y2={p.y} stroke={col} strokeWidth={2} /><text x={p.x} y={p.y} fill={col} fontSize="9">{lbl}</text></>
                }
                return <g>{ax([60, 0, 0], "#e5484d", "X")}{ax([0, 60, 0], "#30a46c", "Y")}{ax([0, 0, 60], "#3a7bd5", "Z")}</g>
              })()}
            </svg>
          </div>
        </div>

        {/* ── Правая панель свойств выбранного компонента ── */}
        <div className="w-56 bg-[#262b33] border-l border-[#1f232b] text-[12px] overflow-y-auto">
          <div className="px-3 h-8 flex items-center gap-2 bg-[#1f232b] text-gray-300 font-medium">
            <Icon name="Info" size={14} />Свойства
          </div>
          {(() => {
            const c = comps.find(x => x.id === sel)
            if (!c) return <div className="p-3 text-gray-500">Выберите компонент</div>
            const rows: [string, string][] = [
              ["Наименование", c.name],
              ["Количество", c.qty ? `${c.qty} шт.` : "1 шт."],
              ["Ø габарит", `${(c.r * 2).toFixed(0)} мм`],
              ["Длина", `${c.len.toFixed(0)} мм`],
              ["Зафиксирован", c.fixed ? "Да" : "Нет"],
              ["Видимость", c.visible ? "Показан" : "Скрыт"],
            ]
            return (
              <div className="p-2 space-y-1">
                {rows.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2 px-1.5 py-1 rounded bg-[#2b3038]">
                    <span className="text-gray-500">{k}</span>
                    <span className="text-gray-200 text-right truncate">{v}</span>
                  </div>
                ))}
                <button onClick={() => toggleVisible(c.id)} className="w-full mt-2 h-8 rounded bg-[#3a7bd5] hover:bg-[#4a8be5] text-white flex items-center justify-center gap-1.5">
                  <Icon name={c.visible ? "EyeOff" : "Eye"} size={14} />{c.visible ? "Скрыть" : "Показать"}
                </button>
              </div>
            )
          })()}
        </div>
      </div>

      {/* ── Статус-бар ── */}
      <div className="flex items-center gap-4 px-3 h-7 bg-[#1f232b] border-t border-[#151820] text-[11px] text-gray-400">
        <span className="flex items-center gap-1"><Icon name="Boxes" size={12} className="text-[#3a7bd5]" />Сборка · {comps.length} компонентов</span>
        <span>Выбрано: {comps.find(c => c.id === sel)?.name || "—"}</span>
        <span className="ml-auto flex items-center gap-1"><Icon name="MousePointer2" size={12} />ЛКМ — вращение · Колесо — масштаб</span>
        <span>КОМПАС-3D · среда сборки</span>
      </div>
    </div>
  )
}

// ─── Строка дерева (для верхних узлов) ───────────────────────────────────────
function TreeRow({ icon, label, bold, muted, depth = 0, chevron, expanded, eye }: {
  icon: string; label: string; bold?: boolean; muted?: boolean; depth?: number; chevron?: boolean; expanded?: boolean; eye?: boolean
}) {
  return (
    <div className={`flex items-center gap-1.5 pr-2 h-[26px] hover:bg-[#2f353f] ${bold ? "font-medium" : ""}`}
      style={{ paddingLeft: 8 + depth * 14 }}>
      {eye ? <Icon name="Eye" size={14} className="text-gray-400 w-5" /> : <span className="w-0" />}
      {chevron && <Icon name={expanded ? "ChevronDown" : "ChevronRight"} size={12} className="text-gray-500 shrink-0" />}
      <Icon name={icon} size={13} className={muted ? "text-gray-500 shrink-0" : "text-[#7db3ff] shrink-0"} fallback="Square" />
      <span className={`truncate ${muted ? "text-gray-500" : "text-gray-200"}`}>{label}</span>
    </div>
  )
}