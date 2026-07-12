import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Icon from "@/components/ui/icon"
import {
  FEATURES, PRODUCTS, DIR_LABELS, CATEGORIES,
  type VersionFeatureFull, type DirId, type CategoryId, type ToolField,
} from "./versions-catalog"

// ─── Рабочий диалог функции (переиспользуется) ────────────────────────────────
export function FeatureTool({ feature, onClose }: { feature: VersionFeatureFull; onClose: () => void }) {
  const [vals, setVals] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {}
    feature.fields.forEach(f => { o[f.key] = f.default ?? "" })
    return o
  })
  const [result, setResult] = useState<{ label: string; value: string }[] | null>(null)
  const product = PRODUCTS.find(p => p.id === feature.product)!

  const set = (k: string, v: string) => setVals(s => ({ ...s, [k]: v }))
  const run = () => setResult(feature.compute ? feature.compute(vals) : [{ label: feature.outputLabel, value: "Готово" }])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        className="bg-[#1e1e2e] border border-gray-600 rounded-xl shadow-2xl flex flex-col relative w-[560px] max-h-[90vh]"
        onClick={e => e.stopPropagation()}>
        <div className="px-5 py-3 flex items-center justify-between border-b border-gray-700 rounded-t-xl" style={{ background: "#141420" }}>
          <div className="flex items-center gap-2">
            <Icon name={feature.icon} size={16} style={{ color: product.color }} fallback="Sparkles" />
            <span className="text-white font-bold text-[13px]">{feature.name}</span>
            {feature.isNew && <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/40">NEW</span>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="text-[9px] px-2 py-0.5 rounded font-bold" style={{ background: product.color + "22", color: product.color }}>{product.label} {feature.version}</span>
            <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10">{DIR_LABELS[feature.dir]}</span>
            {feature.command && <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-gray-400 font-mono">_{feature.command}</span>}
          </div>
          <p className="text-gray-400 text-[11px] leading-relaxed mb-4">{feature.desc}</p>

          <div className="grid grid-cols-2 gap-3">
            {feature.fields.map((f: ToolField) => (
              <label key={f.key} className="flex flex-col gap-1">
                <span className="text-gray-500 text-[9px]">{f.label}</span>
                {f.type === "select" ? (
                  <select value={vals[f.key]} onChange={e => set(f.key, e.target.value)}
                    className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded outline-none text-[11px]">
                    {(f.options || []).map(o => <option key={o}>{o}</option>)}
                  </select>
                ) : f.type === "toggle" ? (
                  <button onClick={() => set(f.key, vals[f.key] === "on" ? "off" : "on")}
                    className={`px-2 py-1.5 rounded text-[11px] border transition-colors ${vals[f.key] === "on" ? "bg-[#0078d4] border-[#0078d4] text-white" : "bg-[#252535] border-gray-600 text-gray-400"}`}>
                    {vals[f.key] === "on" ? "Включено" : "Выключено"}
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <input value={vals[f.key]} onChange={e => set(f.key, e.target.value)}
                      inputMode={f.type === "number" ? "decimal" : "text"}
                      className="w-full bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded outline-none font-mono text-[11px]" />
                    {f.suffix && <span className="text-gray-500 text-[9px] whitespace-nowrap">{f.suffix}</span>}
                  </div>
                )}
              </label>
            ))}
          </div>

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-lg border border-[#0078d4]/40 bg-[#0078d4]/10 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon name="CheckCircle2" size={13} className="text-[#4da3e0]" />
                  <span className="text-[#4da3e0] text-[11px] font-bold">{feature.outputLabel}</span>
                </div>
                <div className="grid gap-1.5">
                  {result.map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-400">{r.label}</span>
                      <span className="text-white font-mono font-semibold">{r.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-700" style={{ background: "#141420" }}>
          <button onClick={onClose} className="px-3 py-1.5 rounded text-[11px] text-gray-400 hover:text-white border border-gray-700">Закрыть</button>
          <button onClick={run} className="px-4 py-1.5 rounded text-[11px] font-semibold text-white flex items-center gap-1.5" style={{ background: product.color }}>
            <Icon name="Play" size={12} /> Выполнить
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Инлайн-сетка функций для встраивания как содержимое вкладки модуля ───────
export function VersionFeaturesInline({ dir, categories }: { dir?: DirId; categories?: CategoryId[] }) {
  return <FeaturesGrid dir={dir} categories={categories} />
}

// ─── Метаданные категорий (label/icon/color) для построения вкладок модуля ─────
export const categoryMeta = (id: CategoryId) => CATEGORIES.find(c => c.id === id)!
export const categoryFeatureCount = (id: CategoryId) => FEATURES.filter(f => f.category === id).length

// ─── Рабочая сетка функций ОДНОЙ категории — как содержимое обычной вкладки ────
export function CategoryFeaturesGrid({ category }: { category: CategoryId }) {
  const [active, setActive] = useState<VersionFeatureFull | null>(null)
  const [q, setQ] = useState("")
  const meta = CATEGORIES.find(c => c.id === category)!

  const items = useMemo(() => {
    const query = q.trim().toLowerCase()
    return FEATURES.filter(f =>
      f.category === category &&
      (!query || f.name.toLowerCase().includes(query) || f.desc.toLowerCase().includes(query) || (f.command || "").toLowerCase().includes(query))
    )
  }, [category, q])

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Icon name={meta.icon} size={16} style={{ color: meta.color }} />
          <h3 className="font-bold text-gray-900">{meta.label}</h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: meta.color + "18", color: meta.color }}>{items.length}</span>
        </div>
        <div className="relative w-full max-w-[220px]">
          <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск функции…"
            className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-[12px] pl-8 pr-3 py-1.5 rounded-lg outline-none focus:border-[#0078d4]" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {items.map(f => {
          const p = PRODUCTS.find(x => x.id === f.product)!
          return (
            <button key={f.id} onClick={() => setActive(f)}
              className="text-left bg-white border border-gray-200 rounded-lg p-2.5 hover:border-[#0078d4] hover:shadow-sm transition-all group">
              <div className="flex items-center gap-2 mb-1">
                <Icon name={f.icon} size={14} style={{ color: p.color }} fallback="Square" />
                <span className="text-[11.5px] font-semibold text-gray-900 leading-tight flex-1 group-hover:text-[#0078d4]">{f.name}</span>
                <span className="text-[8px] px-1 py-0.5 rounded font-bold shrink-0" style={{ background: p.color + "18", color: p.color }}>{p.short} {f.version}</span>
              </div>
              <div className="text-[10px] text-gray-500 leading-snug line-clamp-2">{f.desc}</div>
            </button>
          )
        })}
      </div>
      {items.length === 0 && <div className="text-gray-400 text-[12px] py-4 text-center">Функции не найдены</div>}

      <AnimatePresence>
        {active && <FeatureTool feature={active} onClose={() => setActive(null)} />}
      </AnimatePresence>
    </div>
  )
}

// ─── Внутренняя сетка функций (поиск + группировка + диалог) ──────────────────
function FeaturesGrid({ dir, categories }: { dir?: DirId; categories?: CategoryId[] }) {
  const [active, setActive] = useState<VersionFeatureFull | null>(null)
  const [q, setQ] = useState("")

  const items = useMemo(() => {
    const query = q.trim().toLowerCase()
    return FEATURES.filter(f =>
      (dir ? f.dir === dir : true) &&
      (categories && categories.length ? categories.includes(f.category) : true) &&
      (!query || f.name.toLowerCase().includes(query) || f.desc.toLowerCase().includes(query) || (f.command || "").toLowerCase().includes(query))
    )
  }, [dir, categories, q])

  const grouped = useMemo(() => {
    return CATEGORIES.filter(c => items.some(f => f.category === c.id))
      .map(c => ({ cat: c, list: items.filter(f => f.category === c.id) }))
  }, [items])

  return (
    <div className="p-4">
      <div className="relative max-w-xs mb-4">
        <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск функции…"
          className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-[12px] pl-8 pr-3 py-1.5 rounded-lg outline-none focus:border-[#0078d4]" />
      </div>

      <div className="space-y-5">
        {grouped.map(({ cat, list }) => (
          <div key={cat.id}>
            <div className="flex items-center gap-2 mb-2">
              <Icon name={cat.icon} size={13} style={{ color: cat.color }} />
              <span className="text-[12px] font-bold text-gray-800">{cat.label}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: cat.color + "18", color: cat.color }}>{list.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {list.map(f => {
                const p = PRODUCTS.find(x => x.id === f.product)!
                return (
                  <button key={f.id} onClick={() => setActive(f)}
                    className="text-left bg-white border border-gray-200 rounded-lg p-2.5 hover:border-[#0078d4] hover:shadow-sm transition-all group">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon name={f.icon} size={14} style={{ color: p.color }} fallback="Square" />
                      <span className="text-[11.5px] font-semibold text-gray-900 leading-tight flex-1 group-hover:text-[#0078d4]">{f.name}</span>
                      <span className="text-[8px] px-1 py-0.5 rounded font-bold shrink-0" style={{ background: p.color + "18", color: p.color }}>{p.short} {f.version}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 leading-snug line-clamp-2">{f.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="text-gray-400 text-[12px] py-4 text-center">Функции не найдены</div>}
      </div>

      <AnimatePresence>
        {active && <FeatureTool feature={active} onClose={() => setActive(null)} />}
      </AnimatePresence>
    </div>
  )
}

// ─── Встраиваемая панель функций версий (для профильных модулей) ──────────────
export default function VersionFeaturesPanel({
  dir, categories, title = "Функции AutoCAD и Civil 3D 2022–2027", defaultOpen = false, floating = false,
}: {
  dir?: DirId
  categories?: CategoryId[]
  title?: string
  defaultOpen?: boolean
  floating?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  const count = useMemo(() => FEATURES.filter(f =>
    (dir ? f.dir === dir : true) &&
    (categories && categories.length ? categories.includes(f.category) : true)
  ).length, [dir, categories])

  if (count === 0) return null

  // Плавающий режим — для полноэкранных модулей: кнопка + оверлей
  if (floating) {
    return (
      <>
        <button onClick={() => setOpen(true)}
          className="absolute bottom-4 right-4 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#0078d4] text-white shadow-lg hover:bg-[#0068c0] transition-colors">
          <Icon name="Rocket" size={16} />
          <span className="text-[12px] font-semibold">Функции 2022–2027</span>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{count}</span>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/50 flex items-stretch justify-end" onClick={() => setOpen(false)}>
              <motion.div initial={{ x: 40 }} animate={{ x: 0 }} exit={{ x: 40 }}
                className="w-full max-w-2xl bg-white h-full overflow-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-white">
                  <div className="w-7 h-7 rounded-lg bg-[#0078d4]/10 flex items-center justify-center">
                    <Icon name="Rocket" size={15} className="text-[#0078d4]" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-bold text-gray-900">{title}</div>
                    <div className="text-[11px] text-gray-500">{count} рабочих функций</div>
                  </div>
                  <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700 text-lg">✕</button>
                </div>
                <FeaturesGrid dir={dir} categories={categories} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  // Встроенный режим — сворачиваемая секция
  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors">
        <div className="w-7 h-7 rounded-lg bg-[#0078d4]/10 flex items-center justify-center">
          <Icon name="Rocket" size={15} className="text-[#0078d4]" />
        </div>
        <div className="text-left flex-1">
          <div className="text-[13px] font-bold text-gray-900">{title}</div>
          <div className="text-[11px] text-gray-500">{count} рабочих функций · нажмите, чтобы {open ? "свернуть" : "раскрыть"}</div>
        </div>
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={18} className="text-gray-400" />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-gray-100">
            <FeaturesGrid dir={dir} categories={categories} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}