import { useState, useMemo } from "react"
import { AnimatePresence } from "framer-motion"
import Icon from "@/components/ui/icon"
import { FeatureTool } from "@/modules/VersionFeaturesPanel"
import { FEATURES, type VersionFeatureFull } from "./versions-catalog"

// ── Логические разделы SOLIDWORKS: КПП · ТПП · Управление данными · Новинки ──
type SectionId = "kpp" | "tpp" | "data" | "new"

const SECTIONS: { id: SectionId; label: string; icon: string; color: string; desc: string }[] = [
  { id: "kpp", label: "КПП — конструкторская подготовка", icon: "Ruler", color: "#0078d4", desc: "3D-проектирование, документация, анализ, обратная разработка" },
  { id: "tpp", label: "ТПП — технологическая подготовка", icon: "Wrench", color: "#f97316", desc: "Оснастка, техпроцессы, ЧПУ, нормирование" },
  { id: "data", label: "Управление данными и процессами", icon: "Database", color: "#10b981", desc: "PDM, документооборот, ЭЦП, ERP, себестоимость" },
  { id: "new", label: "Новинки версии", icon: "Sparkles", color: "#8b5cf6", desc: "ИИ, автогенерация, ускорение больших сборок" },
]

// Явное распределение функций каталога по разделам (по id)
const SECTION_IDS: Record<SectionId, string[]> = {
  kpp: [
    "sw-solid-modeling", "sw-direct-edit", "sw-surfaces", "sw-sheetmetal", "sw-weldments", "sw-mold",
    "sw-assembly", "sw-drawing", "sw-bom", "sw-mbd", "sw-mbd-std", "sw-toolbox", "sw-config",
    "sw-render", "sw-collision", "sw-simulation", "sw-sustain", "sw-sustain-cat", "sw-edrawings",
    "sw-composer", "sw-routing", "sw-electrical-schematic", "sw-electrical-3d",
    "sw-sim-static", "sw-sim-fatigue", "sw-sim-modal", "sw-sim-topology", "sw-sim-nonlinear",
    "sw-flow", "sw-flow-electronics", "sw-flow-hvac", "sw-plastics", "sw-visualize",
    "sw-sketchxpert", "sw-featurexpert", "sw-dimxpert", "sw-assemblyxpert", "sw-matexpert", "sw-instant3d",
    "sw-scanto3d", "sw-tolanalyst", "sw-circuitworks", "sw-motion", "sw-plastics-warp",
    "sw-featureworks", "sw-3d-interconnect",
  ],
  tpp: [
    "sw-cam", "sw-cam-nesting", "sw-cam-verify", "sw-cam-cut", "sw-tooling", "sw-estd",
    "sw-norming", "sw-inspection", "sw-dxf-cnc", "sw-print3d", "sw-defeature",
  ],
  data: [
    "sw-pdm", "sw-manage", "sw-task-scheduler", "sw-design-checker", "sw-esign",
    "sw-erp-cost", "sw-driveworks", "sw-translate", "sw-shopfloor",
  ],
  new: [
    "sw-autogen-drawing", "sw-aura", "sw-semantic-search", "sw-select-size",
    "sw-filter-comp", "sw-smooth-geom",
  ],
}

const SW = FEATURES.filter(f => f.product === "solidworks")
const byId = (id: string) => SW.find(f => f.id === id)

// Функции раздела (в новинки также попадают все isNew, которых нет в списках выше)
function sectionFeatures(sec: SectionId): VersionFeatureFull[] {
  const ids = SECTION_IDS[sec]
  const listed = ids.map(byId).filter(Boolean) as VersionFeatureFull[]
  if (sec === "new") {
    const extra = SW.filter(f => f.isNew && !ids.includes(f.id) &&
      !SECTION_IDS.kpp.includes(f.id) && !SECTION_IDS.tpp.includes(f.id) && !SECTION_IDS.data.includes(f.id))
    return [...listed, ...extra]
  }
  return listed
}

export default function SwSectionsPanel({ onAction }: { onAction?: (n: string) => void }) {
  const [open, setOpen] = useState<Record<SectionId, boolean>>({ kpp: true, tpp: false, data: false, new: true })
  const [q, setQ] = useState("")
  const [active, setActive] = useState<VersionFeatureFull | null>(null)

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return SECTIONS.map(s => {
      let list = sectionFeatures(s.id)
      if (query) list = list.filter(f => f.name.toLowerCase().includes(query) || (f.desc ?? "").toLowerCase().includes(query))
      return { sec: s, list }
    })
  }, [q])

  const total = SECTIONS.reduce((n, s) => n + sectionFeatures(s.id).length, 0)

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1">
          <Icon name="LayoutList" size={12} />Каталог SOLIDWORKS
        </div>
        <span className="text-[10px] text-gray-400">{total} функций</span>
      </div>
      <div className="relative">
        <Icon name="Search" size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск по функциям…"
          className="w-full bg-gray-50 border border-gray-200 rounded-md pl-7 pr-2 py-1.5 text-[11px] outline-none focus:border-[#0078d4]" />
      </div>

      {filtered.map(({ sec, list }) => (
        <div key={sec.id} className="border border-gray-200 rounded-lg overflow-hidden">
          <button onClick={() => setOpen(o => ({ ...o, [sec.id]: !o[sec.id] }))}
            className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-gray-50 text-left">
            <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background: sec.color + "1a" }}>
              <Icon name={sec.icon} size={13} style={{ color: sec.color }} fallback="Square" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11.5px] font-semibold text-gray-900 leading-tight truncate">{sec.label}</div>
              <div className="text-[9.5px] text-gray-400 leading-tight truncate">{sec.desc}</div>
            </div>
            <span className="text-[9px] text-gray-400 flex-shrink-0">{list.length}</span>
            <Icon name={open[sec.id] ? "ChevronUp" : "ChevronDown"} size={13} className="text-gray-400 flex-shrink-0" />
          </button>

          {open[sec.id] && (
            <div className="p-2 pt-0 space-y-1 bg-gray-50/50">
              {list.length === 0 && <div className="text-[10px] text-gray-400 px-1 py-2">Ничего не найдено</div>}
              {list.map(f => (
                <button key={f.id} onClick={() => { setActive(f); onAction?.(f.name) }}
                  className="w-full text-left bg-white border border-gray-200 rounded-md px-2 py-1.5 hover:border-[#0078d4] hover:shadow-sm transition-all group flex items-start gap-2">
                  <Icon name={f.icon} size={13} className="text-gray-500 mt-0.5 flex-shrink-0 group-hover:text-[#0078d4]" fallback="Box" />
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-gray-900 leading-tight group-hover:text-[#0078d4]">{f.name}</span>
                      {f.isNew && <span className="text-[8px] px-1 py-px rounded font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">NEW</span>}
                    </span>
                    {f.desc && <span className="block text-[9.5px] text-gray-500 leading-snug mt-0.5 line-clamp-2">{f.desc}</span>}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      <AnimatePresence>
        {active && <FeatureTool feature={active} onClose={() => setActive(null)} />}
      </AnimatePresence>
    </div>
  )
}
