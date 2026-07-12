import { useState, useMemo } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence } from "framer-motion"
import Icon from "@/components/ui/icon"
import { FeatureTool } from "@/modules/VersionFeaturesPanel"
import { FEATURES, type VersionFeatureFull } from "./versions-catalog"

// ── Логические разделы SOLIDWORKS: КПП · ТПП · Управление данными · Новинки ──
export type SwSectionId = "kpp" | "tpp" | "data" | "swnew"

export const SW_SECTIONS: Record<SwSectionId, { label: string; icon: string; desc: string }> = {
  kpp: { label: "КПП — конструкторская подготовка", icon: "Ruler", desc: "3D-проектирование, документация, анализ, обратная разработка" },
  tpp: { label: "ТПП — технологическая подготовка", icon: "Wrench", desc: "Оснастка, техпроцессы, ЧПУ, нормирование" },
  data: { label: "Управление данными и процессами", icon: "Database", desc: "PDM, документооборот, ЭЦП, ERP, себестоимость" },
  swnew: { label: "Новинки версии", icon: "Sparkles", desc: "ИИ, автогенерация, ускорение больших сборок" },
}

// Явное распределение функций каталога по разделам (по id)
const SECTION_IDS: Record<SwSectionId, string[]> = {
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
  swnew: [
    "sw-autogen-drawing", "sw-aura", "sw-semantic-search", "sw-select-size",
    "sw-filter-comp", "sw-smooth-geom",
  ],
}

const SW = FEATURES.filter(f => f.product === "solidworks")

function sectionFeatures(sec: SwSectionId): VersionFeatureFull[] {
  const ids = SECTION_IDS[sec]
  const listed = ids.map(id => SW.find(f => f.id === id)).filter(Boolean) as VersionFeatureFull[]
  if (sec === "swnew") {
    const extra = SW.filter(f => f.isNew && !ids.includes(f.id) &&
      !SECTION_IDS.kpp.includes(f.id) && !SECTION_IDS.tpp.includes(f.id) && !SECTION_IDS.data.includes(f.id))
    return [...listed, ...extra]
  }
  return listed
}

// Панель одного раздела — обычная вкладка CommandManager (как остальные)
export function SwSectionPanel({ section, onAction }: { section: SwSectionId; onAction?: (n: string) => void }) {
  const meta = SW_SECTIONS[section]
  const [q, setQ] = useState("")
  const [active, setActive] = useState<VersionFeatureFull | null>(null)

  const all = useMemo(() => sectionFeatures(section), [section])
  const list = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return all
    return all.filter(f => f.name.toLowerCase().includes(query) || (f.desc ?? "").toLowerCase().includes(query))
  }, [all, q])

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700">
        <Icon name={meta.icon} size={13} className="text-red-500" fallback="Square" />
        <span className="flex-1 leading-tight">{meta.label}</span>
        <span className="text-[10px] text-gray-400 font-normal">{all.length}</span>
      </div>
      <div className="text-[10px] text-gray-400 leading-snug">{meta.desc}</div>

      <div className="relative">
        <Icon name="Search" size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск по функциям…"
          className="w-full bg-gray-50 border border-gray-200 rounded-md pl-7 pr-2 py-1.5 text-[11px] outline-none focus:border-red-400" />
      </div>

      <div className="space-y-1">
        {list.length === 0 && <div className="text-[10px] text-gray-400 px-1 py-2">Ничего не найдено</div>}
        {list.map(f => (
          <button key={f.id} onClick={() => { setActive(f); onAction?.(f.name) }}
            className="w-full text-left bg-white border border-gray-200 rounded-md px-2 py-1.5 hover:border-red-400 hover:shadow-sm transition-all group flex items-start gap-2">
            <Icon name={f.icon} size={13} className="text-gray-500 mt-0.5 flex-shrink-0 group-hover:text-red-500" fallback="Box" />
            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-gray-900 leading-tight group-hover:text-red-600">{f.name}</span>
                {f.isNew && <span className="text-[8px] px-1 py-px rounded font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">NEW</span>}
              </span>
              {f.desc && <span className="block text-[9.5px] text-gray-500 leading-snug mt-0.5 line-clamp-2">{f.desc}</span>}
            </span>
          </button>
        ))}
      </div>

      {createPortal(
        <AnimatePresence>
          {active && <FeatureTool feature={active} onClose={() => setActive(null)} />}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}

export default SwSectionPanel