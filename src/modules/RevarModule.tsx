import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Icon from "@/components/ui/icon"
import { VersionFeaturesInline } from "@/modules/VersionFeaturesPanel"
import type { CategoryId } from "@/modules/versions-catalog"
import {
  BimElement, Level, Discipline, DISCIPLINES, FAMILIES, MATERIALS_BIM,
  IFC_FORMATS, elemLength, buildSchedule, analyzeBuilding, FamilyDef,
} from "./revar-engine"
import { скачать, экспортCSV, экспортPDF, импортФайл } from "@/utils/exportImport"

type RibbonTab = "arch" | "struct" | "mep" | "annotate" | "analyze" | "options" | "collab" | "manage" | "insert"
const RIBBON: { id: RibbonTab; label: string; icon: string }[] = [
  { id: "arch", label: "Архитектура", icon: "Building2" },
  { id: "struct", label: "Конструкции", icon: "Frame" },
  { id: "mep", label: "Инженерия", icon: "Waves" },
  { id: "insert", label: "Библиотека", icon: "LibraryBig" },
  { id: "annotate", label: "Аннотации", icon: "Type" },
  { id: "analyze", label: "Анализ", icon: "Gauge" },
  { id: "options", label: "Варианты", icon: "GitBranch" },
  { id: "collab", label: "Совместно", icon: "Users" },
  { id: "manage", label: "Обмен / AI", icon: "Sparkles" },
]

type ViewMode = "plan" | "3d"
let uid = 500

// Категории функций 2022–2027 по вкладкам ленты Revit-режима
const REVAR_TAB_CATEGORIES: Record<RibbonTab, CategoryId[]> = {
  arch: ["bim", "modeling3d"],
  struct: ["bim", "modeling3d"],
  mep: ["bim", "network"],
  insert: ["bim", "modeling3d"],
  annotate: ["annotation"],
  analyze: ["bim", "platform"],
  options: ["bim", "collab"],
  collab: ["collab"],
  manage: ["interop", "ai"],
}

export default function RevarModule({ onNavigate }: { onNavigate?: (id: string) => void } = {}) {
  const [tab, setTab] = useState<RibbonTab>("arch")
  const [view, setView] = useState<ViewMode>("plan")
  const [levels, setLevels] = useState<Level[]>([
    { id: 1, name: "Этаж 1", elevation: 0 },
    { id: 2, name: "Этаж 2", elevation: 3000 },
    { id: 3, name: "Кровля", elevation: 6000 },
  ])
  const [activeLevel, setActiveLevel] = useState(0)
  const [visibleDisc, setVisibleDisc] = useState<Record<Discipline, boolean>>({ arch: true, struct: true, mep: true })

  const [elems, setElems] = useState<BimElement[]>(seed())
  const [selected, setSelected] = useState<number | null>(1)
  const [tool, setTool] = useState<FamilyDef | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [aiOpen, setAiOpen] = useState(false)
  const [showFn, setShowFn] = useState(false)
  const [drawing, setDrawing] = useState<null | { kind: "section" | "elevation"; title: string }>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawStart = useRef<{ x: number; y: number } | null>(null)
  const [yaw, setYaw] = useState(-0.6), [pitch, setPitch] = useState(-1.0)
  const drag3d = useRef<{ x: number; y: number } | null>(null)

  const sel = elems.find(e => e.id === selected) ?? null
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2200) }

  const visibleElems = elems.filter(e => visibleDisc[e.discipline])
  const levelElems = visibleElems.filter(e => e.level === activeLevel)
  const schedule = buildSchedule(elems)
  const stats = analyzeBuilding(elems, levels)

  // ── 2D-план ────────────────────────────────────────────────────────────────
  const drawPlan = useCallback(() => {
    const cv = canvasRef.current; if (!cv) return
    const ctx = cv.getContext("2d"); if (!ctx) return
    const W = cv.width, H = cv.height
    ctx.fillStyle = "#f7f8fa"; ctx.fillRect(0, 0, W, H)
    // сетка
    ctx.strokeStyle = "#e5e8ec"; ctx.lineWidth = 1
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
    const S = 0.05, ox = W / 2, oy = H / 2
    const px = (x: number) => ox + x * S, py = (y: number) => oy + y * S

    levelElems.forEach(e => {
      const isSel = e.id === selected
      ctx.strokeStyle = isSel ? "#2563eb" : e.color
      ctx.fillStyle = e.color
      const linear = e.x2 !== undefined
      if (linear) {
        ctx.lineWidth = isSel ? Math.max(4, (e.w ?? 200) * S) + 2 : Math.max(3, (e.w ?? 200) * S)
        ctx.lineCap = "round"
        ctx.beginPath(); ctx.moveTo(px(e.x), py(e.y)); ctx.lineTo(px(e.x2!), py(e.y2!)); ctx.stroke()
      } else {
        const w = (e.w ?? 600) * S, h = (e.w ?? 600) * S
        ctx.fillRect(px(e.x) - w / 2, py(e.y) - h / 2, w, h)
        if (isSel) { ctx.strokeStyle = "#2563eb"; ctx.lineWidth = 2; ctx.strokeRect(px(e.x) - w / 2, py(e.y) - h / 2, w, h) }
        // маркер типа
        ctx.fillStyle = "#334155"; ctx.font = "9px sans-serif"; ctx.fillText(e.kind[0].toUpperCase(), px(e.x) - 3, py(e.y) + 3)
      }
    })
    // курсор-инструмент
    if (tool) { ctx.fillStyle = "#2563eb"; ctx.font = "11px sans-serif"; ctx.fillText(`◉ ${tool.name}`, 12, 20) }
  }, [levelElems, selected, tool])

  // ── 3D-вид ───────────────────────────────────────────────────────────────
  const draw3d = useCallback(() => {
    const cv = canvasRef.current; if (!cv) return
    const ctx = cv.getContext("2d"); if (!ctx) return
    const W = cv.width, H = cv.height
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#cfe0f0"); g.addColorStop(1, "#eef2f6")
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch)
    const S = 0.10, ox = W / 2, oy = H / 2 + 60
    const proj = (x: number, y: number, z: number) => {
      const rx = x * cy - y * sy, ry = x * sy + y * cy
      const rz = ry * cp - z * sp, dy = ry * sp + z * cp
      return { x: ox + rx * S, y: oy - dy * S - rz * 0.02 * S, depth: rz }
    }
    type Face = { pts: { x: number; y: number }[]; depth: number; color: string; sel: boolean }
    const faces: Face[] = []
    // земля
    const gp = [proj(-2500, -2500, 0), proj(2500, -2500, 0), proj(2500, 2500, 0), proj(-2500, 2500, 0)]
    faces.push({ pts: gp, depth: -99999, color: "#dbe6cf", sel: false })

    visibleElems.forEach(e => {
      const zBase = levels[e.level]?.elevation ?? 0
      const zTop = zBase + (e.h ?? 3000)
      const linear = e.x2 !== undefined
      if (linear) {
        const dx = e.x2! - e.x, dy = e.y2! - e.y, len = Math.hypot(dx, dy) || 1
        const nx = -dy / len * (e.w ?? 200) / 2, ny = dx / len * (e.w ?? 200) / 2
        const c1 = [e.x + nx, e.y + ny], c2 = [e.x2! + nx, e.y2! + ny], c3 = [e.x2! - nx, e.y2! - ny], c4 = [e.x - nx, e.y - ny]
        const box = (za: number, zb: number, cc: number[][]) => cc.map(c => proj(c[0], c[1], za >= 0 ? zb : za))
        // 4 боковые грани
        const corners = [c1, c2, c3, c4]
        for (let i = 0; i < 4; i++) {
          const a = corners[i], b = corners[(i + 1) % 4]
          const q = [proj(a[0], a[1], zBase), proj(b[0], b[1], zBase), proj(b[0], b[1], zTop), proj(a[0], a[1], zTop)]
          faces.push({ pts: q, depth: (q[0].depth + q[2].depth) / 2, color: e.color, sel: e.id === selected })
        }
        // верх
        const top = box(0, zTop, corners)
        faces.push({ pts: top, depth: top[0].depth + 5, color: shade(e.color, 1.15), sel: e.id === selected })
      } else {
        const s = (e.w ?? 600) / 2
        const c = [[e.x - s, e.y - s], [e.x + s, e.y - s], [e.x + s, e.y + s], [e.x - s, e.y + s]]
        for (let i = 0; i < 4; i++) {
          const a = c[i], b = c[(i + 1) % 4]
          const q = [proj(a[0], a[1], zBase), proj(b[0], b[1], zBase), proj(b[0], b[1], zTop), proj(a[0], a[1], zTop)]
          faces.push({ pts: q, depth: (q[0].depth + q[2].depth) / 2, color: e.color, sel: e.id === selected })
        }
        const top = c.map(p => proj(p[0], p[1], zTop))
        faces.push({ pts: top, depth: top[0].depth + 5, color: shade(e.color, 1.15), sel: e.id === selected })
      }
    })
    faces.sort((a, b) => a.depth - b.depth)
    faces.forEach((f, idx) => {
      ctx.beginPath(); f.pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath()
      ctx.fillStyle = idx === 0 ? f.color : f.color + "ee"; ctx.fill()
      ctx.strokeStyle = f.sel ? "#2563eb" : "#33415533"; ctx.lineWidth = f.sel ? 1.8 : 0.5; ctx.stroke()
    })
  }, [visibleElems, selected, yaw, pitch, levels])

  const redraw = useCallback(() => { view === "plan" ? drawPlan() : draw3d() }, [view, drawPlan, draw3d])
  useEffect(() => { redraw() }, [redraw])
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return
    const rz = () => { const r = cv.parentElement!.getBoundingClientRect(); cv.width = r.width; cv.height = r.height; redraw() }
    rz(); window.addEventListener("resize", rz); return () => window.removeEventListener("resize", rz)
  }, [redraw])

  // Клики по плану: рисование элементов
  const toModel = (e: React.MouseEvent) => {
    const cv = canvasRef.current!, r = cv.getBoundingClientRect()
    const S = 0.05, ox = cv.width / 2, oy = cv.height / 2
    return { x: (e.clientX - r.left - ox) / S, y: (e.clientY - r.top - oy) / S }
  }
  const onPlanDown = (e: React.MouseEvent) => {
    if (view !== "plan") { drag3d.current = { x: e.clientX, y: e.clientY }; return }
    const p = toModel(e)
    if (!tool) {
      // выбор ближайшего
      let best: number | null = null, bd = 1e9
      levelElems.forEach(el => { const d = Math.hypot(el.x - p.x, el.y - p.y); if (d < bd) { bd = d; best = el.id } })
      setSelected(bd < 1500 ? best : null); return
    }
    if (tool.linear) drawStart.current = p
    else { placeElem(tool, p.x, p.y); }
  }
  const onPlanUp = (e: React.MouseEvent) => {
    drag3d.current = null
    if (view === "plan" && tool?.linear && drawStart.current) {
      const p = toModel(e), s = drawStart.current
      if (Math.hypot(p.x - s.x, p.y - s.y) > 300) placeElem(tool, s.x, s.y, p.x, p.y)
      drawStart.current = null
    }
  }
  const onMove3d = (e: React.MouseEvent) => {
    if (view !== "3d" || !drag3d.current) return
    setYaw(y => y + (e.clientX - drag3d.current!.x) * 0.01)
    setPitch(pp => Math.max(-1.5, Math.min(-0.2, pp + (e.clientY - drag3d.current!.y) * 0.008)))
    drag3d.current = { x: e.clientX, y: e.clientY }
  }

  function placeElem(f: FamilyDef, x: number, y: number, x2?: number, y2?: number) {
    const id = ++uid
    const ne: BimElement = { id, kind: f.kind, name: f.name, discipline: f.discipline, level: activeLevel, x, y, x2, y2, w: f.w, h: f.h, material: f.material, color: f.color, hostId: undefined }
    setElems(prev => [...prev, ne]); setSelected(id)
    showToast(`${f.name} размещён на «${levels[activeLevel].name}»`)
  }
  const updateSel = (p: Partial<BimElement>) => sel && setElems(prev => prev.map(e => e.id === sel.id ? { ...e, ...p } : e))
  const deleteSel = () => sel && (setElems(prev => prev.filter(e => e.id !== sel.id)), setSelected(null))
  const duplicateSel = () => { if (!sel) return; const id = ++uid; setElems(prev => [...prev, { ...sel, id, x: sel.x + 1000, x2: sel.x2 !== undefined ? sel.x2 + 1000 : undefined }]); setSelected(id); showToast("Элемент скопирован") }

  const ribbonFamilies = FAMILIES.filter(f =>
    tab === "arch" ? f.discipline === "arch" :
    tab === "struct" ? f.discipline === "struct" :
    tab === "mep" ? f.discipline === "mep" : false)

  return (
    <div className="relative flex flex-col h-full bg-[#eef1f5] overflow-hidden text-sm">
      {/* Шапка */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-1.5 flex items-center gap-2 border-b border-gray-100">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-emerald-600 flex items-center justify-center"><Icon name="Building2" size={13} className="text-white" /></div>
          <span className="text-[13px] font-bold text-gray-900">Revar</span>
          <span className="text-[10px] text-gray-400">BIM · Revit + ArchiCAD 2-в-1 · Open BIM / IFC</span>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button onClick={() => setView("plan")} className={`px-2.5 py-1 text-xs flex items-center gap-1 ${view === "plan" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}><Icon name="Map" size={12} />План</button>
              <button onClick={() => setView("3d")} className={`px-2.5 py-1 text-xs flex items-center gap-1 ${view === "3d" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}><Icon name="Box" size={12} />3D</button>
            </div>
            <Button size="sm" className="h-7 text-xs gap-1 bg-gradient-to-r from-violet-500 to-fuchsia-600" onClick={() => setAiOpen(true)}><Icon name="Sparkles" size={12} />AI-ассистент</Button>
          </div>
        </div>
        {/* Лента */}
        <div className="px-2 flex items-center gap-0.5 overflow-x-auto">
          {RIBBON.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold whitespace-nowrap border-b-2 ${tab === t.id ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
              <Icon name={t.icon} size={12} fallback="Square" />{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Браузер проекта */}
        <div className="w-56 bg-white border-r border-gray-200 flex flex-col min-h-0">
          <div className="px-3 py-1.5 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1"><Icon name="FolderTree" size={12} />Браузер проекта</div>
          <div className="overflow-auto flex-1 py-1 text-[12px]">
            <div className="px-3 py-0.5 text-gray-400 flex items-center gap-1"><Icon name="Layers3" size={11} />Этажи / уровни</div>
            {levels.map((l, i) => (
              <div key={l.id} onClick={() => setActiveLevel(i)} className={`pl-6 pr-2 py-1 flex items-center gap-1.5 cursor-pointer ${activeLevel === i ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-700"}`}>
                <Icon name="Layers" size={11} /><span className="flex-1 truncate">{l.name}</span><span className="text-[9px] text-gray-400">{l.elevation / 1000}м</span>
              </div>
            ))}
            <button onClick={() => setLevels(p => [...p, { id: Date.now(), name: `Этаж ${p.length + 1}`, elevation: p.length * 3000 }])} className="pl-6 py-1 text-[11px] text-blue-600 hover:underline flex items-center gap-1"><Icon name="Plus" size={11} />Добавить этаж</button>
            <div className="px-3 py-0.5 pt-2 text-gray-400 flex items-center gap-1"><Icon name="Eye" size={11} />Дисциплины</div>
            {DISCIPLINES.map(d => (
              <div key={d.id} onClick={() => setVisibleDisc(p => ({ ...p, [d.id]: !p[d.id] }))} className="pl-6 pr-2 py-1 flex items-center gap-1.5 cursor-pointer hover:bg-gray-50">
                <Icon name={visibleDisc[d.id] ? "Eye" : "EyeOff"} size={11} className={visibleDisc[d.id] ? "text-gray-600" : "text-gray-300"} />
                <span style={{ color: d.color }} className="text-[11px] truncate flex-1">{d.ru}</span>
              </div>
            ))}
            <div className="px-3 py-0.5 pt-2 text-gray-400 flex items-center gap-1"><Icon name="Table" size={11} />Виды и спецификации</div>
            {[
              { v: "План этажа", fn: () => setView("plan") },
              { v: "Разрез 1-1", fn: () => setDrawing({ kind: "section", title: "Разрез 1-1" }) },
              { v: "Разрез 2-2", fn: () => setDrawing({ kind: "section", title: "Разрез 2-2" }) },
              { v: "Фасад в осях А-Г", fn: () => setDrawing({ kind: "elevation", title: "Фасад в осях А-Г" }) },
              { v: "3D-вид", fn: () => setView("3d") },
            ].map(({ v, fn }) => <button key={v} onClick={fn} className="w-full text-left pl-6 py-0.5 text-gray-600 text-[11px] flex items-center gap-1 hover:bg-blue-50 hover:text-blue-700"><Icon name="FileText" size={10} />{v}</button>)}
          </div>
          <div className="border-t border-gray-100 p-2 text-[11px] text-gray-500 space-y-0.5">
            <div className="flex justify-between"><span>Площадь</span><b>{stats.totalArea} м²</b></div>
            <div className="flex justify-between"><span>Элементов</span><b>{elems.length}</b></div>
          </div>
        </div>

        {/* Вьюпорт */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          {tool && <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-blue-600 text-white text-[11px] px-3 py-1 rounded-full flex items-center gap-2">Размещение: {tool.name} · клик на плане <button onClick={() => setTool(null)} className="hover:bg-blue-700 rounded-full"><Icon name="X" size={12} /></button></div>}
          <div className="absolute top-2 left-2 z-10 flex gap-1.5">
            <span className="px-2 py-1 rounded bg-white/90 border border-gray-200 text-[11px] text-gray-600">{levels[activeLevel]?.name} · {view === "plan" ? "план" : "3D"}</span>
            {view === "3d" && <button onClick={() => { setYaw(-0.6); setPitch(-1.0) }} className="px-2 py-1 rounded bg-white/90 border border-gray-200 text-[11px] flex items-center gap-1 text-gray-600"><Icon name="Home" size={11} />Изометрия</button>}
          </div>
          <div className="flex-1 min-h-0">
            <canvas ref={canvasRef} className={`w-full h-full ${tool ? "cursor-crosshair" : view === "3d" ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
              onMouseDown={onPlanDown} onMouseUp={onPlanUp} onMouseMove={onMove3d} onMouseLeave={() => drag3d.current = null} />
          </div>
        </div>

        {/* Правая панель (по вкладке) */}
        <div className="w-72 bg-white border-l border-gray-200 overflow-auto">
          <div className="px-3 py-1.5 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1"><Icon name={RIBBON.find(r => r.id === tab)?.icon || "Square"} size={12} />{RIBBON.find(r => r.id === tab)?.label}</div>
          <div className="p-3">
            {(tab === "arch" || tab === "struct" || tab === "mep") && (
              <div className="space-y-3">
                <div className="text-[11px] font-semibold text-gray-600">Инструменты моделирования</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {ribbonFamilies.map(f => (
                    <button key={f.name} onClick={() => { setTool(f); showToast(`Инструмент: ${f.name}`) }}
                      className={`aspect-square rounded-lg border flex flex-col items-center justify-center gap-0.5 p-1 ${tool?.name === f.name ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-600"}`}>
                      <Icon name={f.icon} size={16} fallback="Box" /><span className="text-[8px] leading-tight text-center">{f.name.split(" ")[0].split("(")[0]}</span>
                    </button>
                  ))}
                </div>
                {sel && <PropPanel sel={sel} updateSel={updateSel} onDup={duplicateSel} onDel={deleteSel} />}
              </div>
            )}
            {tab === "insert" && <LibraryPanel onPlace={f => { setTool(f); showToast(`Библиотека: ${f.name}`) }} />}
            {tab === "annotate" && <AnnotatePanel onAction={showToast} schedule={schedule} onExport={() => { экспортCSV(["Наименование", "Тип", "Кол-во", "Материал"], schedule.map(r => [r.name, r.kind, r.qty, r.material]), "спецификация.csv"); showToast("Спецификация выгружена") }} onSection={() => setDrawing({ kind: "section", title: "Разрез 1-1" })} onElevation={() => setDrawing({ kind: "elevation", title: "Фасад в осях А-Г" })} />}
            {tab === "analyze" && <AnalyzePanel stats={stats} onAction={showToast} />}
            {tab === "options" && <OptionsPanel onAction={showToast} />}
            {tab === "collab" && <CollabPanel onAction={showToast} />}
            {tab === "manage" && <ManagePanel onImport={() => импортФайл(".ifc,.3dm,.skp,.obj,.step,.dwg", (_c, n) => showToast(`Импорт Open BIM: ${n}`))} onExport={(f) => { скачать(`# Экспорт ${f}`, `модель.${f.match(/\((\.[a-z0-9]+)\)/)?.[1]?.slice(1) ?? "dat"}`); showToast(`Экспорт: ${f}`) }} onAI={() => setAiOpen(true)} onNavigate={onNavigate} />}

            {/* Функции 2022–2027 для активной вкладки */}
            <div className="mt-3 border-t border-gray-100 pt-2">
              <button onClick={() => setShowFn(o => !o)}
                className="w-full flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 hover:text-blue-700">
                <Icon name="Rocket" size={12} className="text-blue-600" />
                Функции 2022–2027
                <Icon name={showFn ? "ChevronUp" : "ChevronDown"} size={12} className="ml-auto text-gray-400" />
              </button>
              {showFn && (
                <div className="mt-2 -mx-1">
                  <VersionFeaturesInline categories={REVAR_TAB_CATEGORIES[tab]} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Спецификация внизу */}
      <div className="bg-white border-t border-gray-200 h-28 overflow-auto">
        <div className="px-3 py-1 text-[11px] font-bold text-gray-500 uppercase sticky top-0 bg-white flex items-center gap-1"><Icon name="Table" size={12} />Спецификация (обновляется из модели)</div>
        <table className="w-full text-[11px]">
          <thead className="text-gray-400"><tr><th className="text-left px-3 py-0.5">Наименование</th><th className="text-left">Тип</th><th className="text-right">Кол-во</th><th className="text-right pr-3">Материал</th></tr></thead>
          <tbody>{schedule.map((r, i) => <tr key={i} className="border-t border-gray-50"><td className="px-3 py-0.5 text-gray-700">{r.name}</td><td className="text-gray-400">{r.kind}</td><td className="text-right font-mono text-gray-700">{r.qty}</td><td className="text-right pr-3 text-gray-500">{r.material}</td></tr>)}</tbody>
        </table>
      </div>

      {drawing && <DrawingView drawing={drawing} elems={elems} levels={levels} onClose={() => setDrawing(null)} onExport={() => { экспортPDF(drawing.title, `Автоматически построенный вид из BIM-модели\nЭлементов: ${elems.length}`, drawing.title); showToast(`${drawing.title} → PDF`) }} />}
      {aiOpen && <AIDialog stats={stats} onClose={() => setAiOpen(false)} onAction={showToast} />}
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm shadow-xl flex items-center gap-2"><Icon name="CheckCircle" size={14} className="text-emerald-400" />{toast}</div>}
    </div>
  )
}

// ── Панели ─────────────────────────────────────────────────────────────────
function PropPanel({ sel, updateSel, onDup, onDel }: { sel: BimElement; updateSel: (p: Partial<BimElement>) => void; onDup: () => void; onDel: () => void }) {
  const linear = sel.x2 !== undefined
  return (
    <div className="space-y-2 pt-2 border-t border-gray-100">
      <div className="text-[11px] font-semibold text-gray-600 flex items-center gap-1"><Icon name="Settings2" size={12} />Свойства: {sel.name}</div>
      <Slider label={linear ? "Толщина, мм" : "Габарит, мм"} v={sel.w ?? 200} min={40} max={800} on={v => updateSel({ w: v })} />
      <Slider label="Высота, мм" v={sel.h ?? 3000} min={100} max={6000} step={100} on={v => updateSel({ h: v })} />
      <div>
        <Label className="text-[11px]">Материал</Label>
        <select value={sel.material} onChange={e => updateSel({ material: e.target.value, color: MATERIALS_BIM[e.target.value].color })} className="w-full h-8 text-xs border border-gray-200 rounded px-1">
          {Object.entries(MATERIALS_BIM).map(([k, m]) => <option key={k} value={k}>{m.ru}</option>)}
        </select>
      </div>
      {linear && <div className="text-[11px] text-gray-500">Длина: <b>{elemLength(sel)} м</b></div>}
      <div className="grid grid-cols-2 gap-1">
        <Button size="sm" variant="outline" className="text-xs gap-1" onClick={onDup}><Icon name="Copy" size={12} />Копия</Button>
        <Button size="sm" variant="outline" className="text-xs gap-1 text-red-600" onClick={onDel}><Icon name="Trash2" size={12} />Удалить</Button>
      </div>
    </div>
  )
}

function LibraryPanel({ onPlace }: { onPlace: (f: FamilyDef) => void }) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold text-gray-600">Библиотека семейств / объектов</div>
      <div className="text-[10px] text-gray-400">Двери, окна, мебель, сантехника, свет, МАФ. Создавайте параметрические семейства.</div>
      {FAMILIES.map(f => (
        <button key={f.name} onClick={() => onPlace(f)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg border border-gray-100 hover:border-blue-300 hover:bg-blue-50 text-[12px] text-gray-700">
          <Icon name={f.icon} size={14} className="text-blue-500" fallback="Box" /><span className="flex-1 text-left">{f.name}</span><span className="text-[9px] text-gray-400">{DISCIPLINES.find(d => d.id === f.discipline)?.ru.split(" ")[0]}</span>
        </button>
      ))}
    </div>
  )
}

function AnnotatePanel({ onAction, schedule, onExport, onSection, onElevation }: { onAction: (m: string) => void; schedule: ReturnType<typeof buildSchedule>; onExport: () => void; onSection: () => void; onElevation: () => void }) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold text-gray-600">Чертёжные виды из модели</div>
      <div className="grid grid-cols-2 gap-1.5">
        <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700" onClick={onSection}><Icon name="Scissors" size={13} />Разрез</Button>
        <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700" onClick={onElevation}><Icon name="PanelLeft" size={13} fallback="Square" />Фасад</Button>
      </div>
      <div className="text-[10px] text-gray-400">Разрезы и фасады строятся автоматически из BIM-модели и обновляются при изменениях.</div>
      <div className="text-[11px] font-semibold text-gray-600 pt-1">Аннотации</div>
      <div className="grid grid-cols-2 gap-1">
        {["Размер", "Текст", "Марка", "Уровень", "Выноска", "Штриховка", "Автотекст", "Осевая сетка"].map(a => <button key={a} onClick={() => onAction(`Аннотация: ${a}`)} className="text-[10px] px-2 py-1 rounded border border-gray-200 hover:bg-blue-50 text-gray-600">{a}</button>)}
      </div>
      <div className="text-[11px] font-semibold text-gray-600 pt-1">Листы и издатель</div>
      <Button size="sm" className="w-full gap-1.5 bg-blue-600 hover:bg-blue-700" onClick={onExport}><Icon name="Download" size={13} />Спецификация → CSV ({schedule.length})</Button>
      <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={() => onAction("Комплект чертежей собран «Издателем»")}><Icon name="Files" size={13} />Собрать комплект листов</Button>
    </div>
  )
}

// ── Автопостроение разреза / фасада из BIM-модели ──────────────────────────
function DrawingView({ drawing, elems, levels, onClose, onExport }: { drawing: { kind: "section" | "elevation"; title: string }; elems: BimElement[]; levels: Level[]; onClose: () => void; onExport: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const ctx = cv.getContext("2d"); if (!ctx) return
    const W = cv.width = 760, H = cv.height = 440
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H)
    const S = 0.045, ox = W / 2, oy = H - 90
    const isSection = drawing.kind === "section"
    // ось проекции: разрез — по Y (вид вдоль), фасад — по фронту
    const px = (x: number, y: number) => ox + (isSection ? y : x) * S
    const pyz = (z: number) => oy - z * S

    // отметки уровней
    ctx.strokeStyle = "#cbd5e1"; ctx.setLineDash([6, 4]); ctx.fillStyle = "#64748b"; ctx.font = "10px sans-serif"
    levels.forEach(l => {
      const y = pyz(l.elevation)
      ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(W - 40, y); ctx.stroke()
      ctx.fillText(`${l.name}  +${(l.elevation / 1000).toFixed(3)}`, 44, y - 4)
    })
    // земля
    const y0 = pyz(0); ctx.setLineDash([]); ctx.strokeStyle = "#334155"; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(30, y0); ctx.lineTo(W - 30, y0); ctx.stroke()

    // элементы -> прямоугольники в проекции
    const sorted = [...elems].sort((a, b) => (isSection ? a.x - b.x : a.y - b.y))
    sorted.forEach(e => {
      const zBase = levels[e.level]?.elevation ?? 0, zTop = zBase + (e.h ?? 3000)
      const linear = e.x2 !== undefined
      let a: number, b: number
      if (linear) { a = isSection ? Math.min(e.y, e.y2!) : Math.min(e.x, e.x2!); b = isSection ? Math.max(e.y, e.y2!) : Math.max(e.x, e.x2!) }
      else { const s = (e.w ?? 600) / 2; const c = isSection ? e.y : e.x; a = c - s; b = c + s }
      const x1 = px(a, a), x2 = px(b, b)
      const w = Math.max(3, x2 - x1)
      const cut = isSection && linear && e.kind === "wall"  // рассечённые стены — заливка
      ctx.fillStyle = e.color + (cut ? "ff" : "aa")
      ctx.fillRect(x1, pyz(zTop), w, pyz(zBase) - pyz(zTop))
      ctx.strokeStyle = "#1e293b"; ctx.lineWidth = cut ? 1.4 : 0.7
      ctx.strokeRect(x1, pyz(zTop), w, pyz(zBase) - pyz(zTop))
      // окна — прозрачный проём
      if (e.kind === "window") { ctx.fillStyle = "#bfe3f0"; ctx.fillRect(x1, pyz(zBase + 900 + (e.h ?? 1400)), w, (e.h ?? 1400) * S); ctx.strokeRect(x1, pyz(zBase + 900 + (e.h ?? 1400)), w, (e.h ?? 1400) * S) }
    })
    // рамка чертежа
    ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 1.5; ctx.strokeRect(14, 14, W - 28, H - 28)
    ctx.fillStyle = "#0f172a"; ctx.font = "bold 13px sans-serif"; ctx.fillText(drawing.title, 24, 34)
    ctx.font = "10px sans-serif"; ctx.fillStyle = "#64748b"; ctx.fillText("М 1:100 · построено из BIM-модели Revar", 24, H - 24)
  }, [drawing, elems, levels])

  return (
    <div className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-4 py-3 bg-gray-900 text-white flex items-center gap-2">
          <Icon name={drawing.kind === "section" ? "Scissors" : "Building"} size={16} />
          <span className="font-bold text-[13px]">{drawing.title} — автоматический чертёжный вид</span>
          <button onClick={onClose} className="ml-auto"><Icon name="X" size={18} /></button>
        </div>
        <div className="p-3">
          <canvas ref={ref} className="rounded-lg border border-gray-200" />
          <div className="flex justify-between items-center mt-3">
            <span className="text-[11px] text-gray-400">Вид связан с моделью — обновляется автоматически при изменении элементов</span>
            <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700" onClick={onExport}><Icon name="FileDown" size={13} />Экспорт в PDF</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AnalyzePanel({ stats, onAction }: { stats: ReturnType<typeof analyzeBuilding>; onAction: (m: string) => void }) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold text-gray-600">Анализ здания (Insight / энергетика)</div>
      <Row l="Класс энергоэффективности" v={stats.energyClass} big />
      <Row l="Теплопотери" v={`${stats.heatLoss} Вт`} />
      <Row l="Остекление" v={`${stats.glazingRatio}%`} />
      <Row l="Инсоляция" v={`${stats.insolation} ч/сут`} />
      <Row l="Время эвакуации" v={`${stats.evacTime} мин`} />
      <Row l="Выбросы CO₂" v={`${stats.co2} кг/год`} />
      <div className="grid grid-cols-2 gap-1 pt-1">
        {[["Освещённость", "Sun"], ["Тепл. нагрузки", "Thermometer"], ["Эвак. пути", "DoorOpen"], ["Акустика", "AudioLines"], ["Доступность МГН", "Accessibility"], ["Инсоляция", "SunMedium"]].map(([n, ic]) => <button key={n} onClick={() => onAction(`Расчёт: ${n}`)} className="text-[10px] px-1 py-1 rounded border border-gray-200 hover:bg-blue-50 text-gray-600 flex items-center gap-1"><Icon name={ic} size={11} fallback="Gauge" />{n}</button>)}
      </div>
    </div>
  )
}

function OptionsPanel({ onAction }: { onAction: (m: string) => void }) {
  const [opts, setOpts] = useState(["Вариант А — базовый", "Вариант Б — с атриумом"])
  const [n, setN] = useState("")
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold text-gray-600">Проектные варианты</div>
      {opts.map((o, i) => <div key={i} onClick={() => onAction(`Активен: ${o}`)} className="px-2 py-1.5 rounded-lg border border-gray-100 hover:bg-blue-50 cursor-pointer text-[12px] text-gray-700 flex items-center gap-1.5"><Icon name="GitBranch" size={12} className="text-blue-500" />{o}</div>)}
      <div className="flex gap-1">
        <Input value={n} onChange={e => setN(e.target.value)} placeholder="Новый вариант" className="h-8 text-xs" />
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => { if (!n) return; setOpts(p => [...p, n]); setN(""); onAction("Вариант создан") }}><Icon name="Plus" size={13} /></Button>
      </div>
      <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={() => onAction("Сравнение вариантов: площадь, стоимость, инсоляция")}><Icon name="GitCompare" size={13} />Сравнить варианты</Button>
    </div>
  )
}

function CollabPanel({ onAction }: { onAction: (m: string) => void }) {
  const team = [["Архитектор", "Иванов"], ["Конструктор", "Петров"], ["Инженер ОВК", "Сидоров"]]
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold text-gray-600">Совместная работа (BIMcloud / Worksharing)</div>
      <div className="rounded-lg bg-blue-50 p-2 text-[11px] text-blue-700 flex items-center gap-1.5"><Icon name="Cloud" size={13} />Центральная модель: синхронизирована</div>
      {team.map(([role, name]) => <div key={name} className="flex items-center gap-2 px-2 py-1 text-[12px]"><span className="w-2 h-2 rounded-full bg-green-500" /><span className="flex-1 text-gray-700">{name}</span><span className="text-[10px] text-gray-400">{role}</span></div>)}
      <div className="grid grid-cols-2 gap-1">
        <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => onAction("Синхронизация с центральной моделью")}><Icon name="RefreshCw" size={12} />Синхр.</Button>
        <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => onAction("Открыт журнал изменений")}><Icon name="History" size={12} />История</Button>
      </div>
      <Button size="sm" className="w-full gap-1.5 bg-blue-600 hover:bg-blue-700" onClick={() => onAction("Связаны файлы по дисциплинам (ARCH+STR+MEP)")}><Icon name="Link" size={13} />Связать модели дисциплин</Button>
    </div>
  )
}

function ManagePanel({ onImport, onExport, onAI, onNavigate }: { onImport: () => void; onExport: (f: string) => void; onAI: () => void; onNavigate?: (id: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-semibold text-gray-600">Open BIM — обмен данными</div>
      <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={onImport}><Icon name="Upload" size={13} />Импорт IFC / 3DM / SKP / OBJ</Button>
      <div className="grid grid-cols-2 gap-1">{IFC_FORMATS.map(f => <Button key={f} size="sm" variant="outline" className="gap-1 text-[10px] justify-start" onClick={() => onExport(f)}><Icon name="FileBox" size={12} />{f.split(" ")[0]}</Button>)}</div>
      <div className="text-[11px] font-semibold text-gray-600 pt-1">Расширения</div>
      <div className="grid grid-cols-2 gap-1">
        <Button size="sm" variant="outline" className="text-xs gap-1" onClick={onAI}><Icon name="Workflow" size={12} />Dynamo</Button>
        <Button size="sm" variant="outline" className="text-xs gap-1" onClick={onAI}><Icon name="Smartphone" size={12} />BIMx</Button>
      </div>
      <Button size="sm" className="w-full gap-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-600" onClick={onAI}><Icon name="Sparkles" size={13} />AI: Smart Detailing / Code Check</Button>
      {onNavigate && <Button size="sm" variant="ghost" className="w-full text-xs gap-1 text-gray-500" onClick={() => onNavigate("sapr")}><Icon name="Cuboid" size={12} />Открыть САПР-модуль</Button>}
    </div>
  )
}

function AIDialog({ stats, onClose, onAction }: { stats: ReturnType<typeof analyzeBuilding>; onClose: () => void; onAction: (m: string) => void }) {
  const suggestions = [
    { ic: "Lightbulb", t: "AI Design Assistant", d: `Остекление ${stats.glazingRatio}% — рекомендую южный фасад +15% для инсоляции` },
    { ic: "Layers", t: "Smart Detailing", d: "Автоматически построю узлы примыкания стен к перекрытию" },
    { ic: "ShieldCheck", t: "Code Compliance Checker", d: `Эвакуация ${stats.evacTime} мин — в пределах норм. Проверить ширину проходов` },
    { ic: "Package", t: "Predictive Material Library", d: `Класс ${stats.energyClass}: подобрать утеплитель для повышения до A+` },
  ]
  return (
    <div className="fixed inset-0 z-[300] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-4 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white flex items-center gap-2"><Icon name="Sparkles" size={18} /><span className="font-bold">AI-ассистент Revar</span><button onClick={onClose} className="ml-auto"><Icon name="X" size={18} /></button></div>
        <div className="p-4 space-y-2">
          {suggestions.map(s => (
            <button key={s.t} onClick={() => { onAction(`${s.t}: применено`); onClose() }} className="w-full text-left flex gap-3 p-3 rounded-xl border border-gray-100 hover:border-violet-300 hover:bg-violet-50">
              <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center shrink-0"><Icon name={s.ic} size={18} className="text-violet-600" fallback="Sparkles" /></div>
              <div><div className="font-semibold text-gray-800 text-[13px]">{s.t}</div><div className="text-[11px] text-gray-500">{s.d}</div></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Мелочи ─────────────────────────────────────────────────────────────────
function Slider({ label, v, min, max, step = 1, on }: { label: string; v: number; min: number; max: number; step?: number; on: (v: number) => void }) {
  return <div><div className="flex justify-between text-[11px] mb-0.5"><span className="text-gray-500">{label}</span><span className="font-mono font-semibold text-gray-700">{v}</span></div><input type="range" min={min} max={max} step={step} value={v} onChange={e => on(+e.target.value)} className="w-full accent-blue-600" /></div>
}
function Row({ l, v, ok, big }: { l: string; v: string; ok?: boolean; big?: boolean }) {
  return <div className="flex justify-between items-center text-[11px] py-0.5 border-b border-gray-50"><span className="text-gray-500">{l}</span><span className={`font-mono font-semibold ${big ? "text-[15px] text-blue-600" : ok === undefined ? "text-gray-800" : ok ? "text-green-600" : "text-red-600"}`}>{v}</span></div>
}
function shade(hex: string, k: number): string {
  const h = hex.replace("#", ""); const r = Math.min(255, Math.round(parseInt(h.slice(0, 2), 16) * k)); const g = Math.min(255, Math.round(parseInt(h.slice(2, 4), 16) * k)); const b = Math.min(255, Math.round(parseInt(h.slice(4, 6), 16) * k)); return `rgb(${r},${g},${b})`
}

// стартовая модель
function seed(): BimElement[] {
  const wall = (id: number, x: number, y: number, x2: number, y2: number): BimElement => ({ id, kind: "wall", name: "Стена (многослойная)", discipline: "arch", level: 0, x, y, x2, y2, w: 250, h: 3000, material: "brick", color: "#c8a27a" })
  return [
    wall(1, -3000, -2000, 3000, -2000),
    wall(2, 3000, -2000, 3000, 2000),
    wall(3, 3000, 2000, -3000, 2000),
    wall(4, -3000, 2000, -3000, -2000),
    { id: 5, kind: "window", name: "Окно", discipline: "arch", level: 0, x: -1000, y: -2000, w: 1200, h: 1400, material: "glass", color: "#8fd0e6" },
    { id: 6, kind: "window", name: "Окно", discipline: "arch", level: 0, x: 1000, y: -2000, w: 1200, h: 1400, material: "glass", color: "#8fd0e6" },
    { id: 7, kind: "door", name: "Дверь", discipline: "arch", level: 0, x: 0, y: 2000, w: 900, h: 2100, material: "wood", color: "#7a5230" },
    { id: 8, kind: "column", name: "Колонна", discipline: "struct", level: 0, x: 0, y: 0, w: 400, h: 3000, material: "concrete", color: "#8a929c" },
    { id: 9, kind: "duct", name: "Воздуховод (ОВК)", discipline: "mep", level: 0, x: -2500, y: 0, x2: 2500, y2: 0, w: 300, h: 300, material: "steel", color: "#f59e0b" },
  ]
}