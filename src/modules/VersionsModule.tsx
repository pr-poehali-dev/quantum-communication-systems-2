import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Icon from "@/components/ui/icon"
import {
  FEATURES, PRODUCTS, VERSIONS, DIR_LABELS, CATEGORIES, usedCategories,
  featuresByFilter,
  type VersionFeatureFull, type ProductId, type VersionId, type DirId, type CategoryId, type ToolField,
} from "./versions-catalog"

const DIRS = Object.keys(DIR_LABELS) as DirId[]

// ─── Рабочий диалог функции ──────────────────────────────────────────────────
function FeatureTool({ feature, onClose }: { feature: VersionFeatureFull; onClose: () => void }) {
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
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
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

// ─── Карточка функции ─────────────────────────────────────────────────────────
function FeatureCard({ f, onOpen }: { f: VersionFeatureFull; onOpen: () => void }) {
  const p = PRODUCTS.find(x => x.id === f.product)!
  return (
    <button onClick={onOpen}
      className="text-left bg-white border border-gray-200 rounded-xl p-3.5 hover:border-[#0078d4] hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-2">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: p.color + "18" }}>
          <Icon name={f.icon} size={17} style={{ color: p.color }} fallback="Square" />
        </div>
        <div className="flex items-center gap-1">
          {f.isNew && <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-600">NEW</span>}
          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: p.color + "18", color: p.color }}>{p.short} {f.version}</span>
        </div>
      </div>
      <div className="text-gray-900 font-semibold text-[12.5px] leading-tight mb-1 group-hover:text-[#0078d4]">{f.name}</div>
      <div className="text-gray-500 text-[10.5px] leading-snug line-clamp-2 mb-2">{f.desc}</div>
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-gray-400">{DIR_LABELS[f.dir]}</span>
        <Icon name="ArrowRight" size={13} className="text-gray-300 group-hover:text-[#0078d4] group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  )
}

// ─── Модуль ──────────────────────────────────────────────────────────────────
export default function VersionsModule(_props: { onNavigate?: (id: string) => void } = {}) {
  const [product, setProduct] = useState<ProductId | "all">("all")
  const [version, setVersion] = useState<VersionId | "all">("all")
  const [dir, setDir] = useState<DirId | "all">("all")
  const [category, setCategory] = useState<CategoryId | "all">("all")
  const [q, setQ] = useState("")
  const [active, setActive] = useState<VersionFeatureFull | null>(null)

  const list = useMemo(() => featuresByFilter(product, version, dir, category, q), [product, version, dir, category, q])

  // Группировка результата по категориям
  const grouped = useMemo(() => {
    const cats = usedCategories().filter(c => list.some(f => f.category === c.id))
    return cats.map(c => ({ cat: c, items: list.filter(f => f.category === c.id) }))
  }, [list])

  const chip = (on: boolean) =>
    `px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${on ? "bg-[#0078d4] border-[#0078d4] text-white" : "bg-white/5 border-white/10 text-gray-400 hover:text-white"}`

  return (
    <div className="relative min-h-full">
      <div className="mb-5">
        <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2">
          <Icon name="Rocket" size={22} className="text-[#0078d4]" /> Функции AutoCAD и Civil 3D
        </h1>
        <p className="text-gray-500 text-[13px] mt-1">
          {FEATURES.length} функций (версии 2022–2027), сгруппированы по категориям. Каждую можно запустить.
        </p>
      </div>

      {/* Категории — основная навигация */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <button
          onClick={() => setCategory("all")}
          className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${category === "all" ? "bg-[#0078d4] border-[#0078d4] text-white" : "text-gray-500 hover:text-gray-800 bg-white border-gray-200"}`}>
          Все категории
        </button>
        {CATEGORIES.filter(c => FEATURES.some(f => f.category === c.id)).map(c => (
          <button key={c.id} onClick={() => setCategory(category === c.id ? "all" : c.id)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors flex items-center gap-1 ${category === c.id ? "text-white" : "text-gray-500 hover:text-gray-800 bg-white border-gray-200"}`}
            style={category === c.id ? { background: c.color, borderColor: c.color } : {}}>
            <Icon name={c.icon} size={12} /> {c.label}
          </button>
        ))}
      </div>

      {/* Доп. фильтры */}
      <div className="space-y-2 mb-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-gray-400 text-[10px] font-semibold w-16">Продукт:</span>
          <button className={chip(product === "all")} onClick={() => setProduct("all")}>Все</button>
          {PRODUCTS.map(p => <button key={p.id} className={chip(product === p.id)} onClick={() => setProduct(p.id)}>{p.label}</button>)}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-gray-400 text-[10px] font-semibold w-16">Версия:</span>
          <button className={chip(version === "all")} onClick={() => setVersion("all")}>Все</button>
          {VERSIONS.map(v => <button key={v} className={chip(version === v)} onClick={() => setVersion(v)}>{v}</button>)}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-gray-400 text-[10px] font-semibold w-16">Направл.:</span>
          <button className={chip(dir === "all")} onClick={() => setDir("all")}>Все</button>
          {DIRS.map(d => <button key={d} className={chip(dir === d)} onClick={() => setDir(d)}>{DIR_LABELS[d]}</button>)}
        </div>
        <div className="relative max-w-sm">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск функции или команды…"
            className="w-full bg-white border border-gray-200 text-gray-700 text-[12px] pl-9 pr-3 py-2 rounded-lg outline-none focus:border-[#0078d4]" />
        </div>
      </div>

      <div className="text-gray-400 text-[11px] mb-3">Найдено: {list.length} в {grouped.length} категориях</div>

      {/* Секции по категориям */}
      <div className="space-y-6">
        {grouped.map(({ cat, items }) => (
          <div key={cat.id}>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: cat.color + "20" }}>
                <Icon name={cat.icon} size={14} style={{ color: cat.color }} />
              </div>
              <h2 className="text-[14px] font-bold text-gray-900">{cat.label}</h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: cat.color + "18", color: cat.color }}>{items.length}</span>
              <div className="flex-1 h-px bg-gray-200 ml-1" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map(f => <FeatureCard key={f.id} f={f} onOpen={() => setActive(f)} />)}
            </div>
          </div>
        ))}
      </div>

      {list.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Icon name="SearchX" size={32} className="mb-2" />
          <p className="text-[13px]">Функции не найдены — измените фильтры</p>
        </div>
      )}

      <AnimatePresence>
        {active && <FeatureTool feature={active} onClose={() => setActive(null)} />}
      </AnimatePresence>
    </div>
  )
}
