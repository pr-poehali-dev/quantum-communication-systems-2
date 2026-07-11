import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Icon from "@/components/ui/icon"

// ═══════════════════════════════════════════════════════════════════════════
// Функции Лапа версий 2023 · 2024 · 2025 · 2026
// Новые рабочие диалоги, которых не было в проекте.
// ═══════════════════════════════════════════════════════════════════════════

type Close = { onClose: () => void }

// Общая обёртка модального окна
function Modal({ title, icon, color, badge, width = 620, children, footer, onClose }: {
  title: string; icon: string; color: string; badge?: string; width?: number
  children: React.ReactNode; footer?: React.ReactNode; onClose: () => void
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="bg-[#1e1e2e] border border-gray-600 rounded-xl shadow-2xl flex flex-col relative"
        style={{ width, maxHeight: "90vh" }} onClick={e => e.stopPropagation()}>
        <div className="px-5 py-3 flex items-center justify-between border-b border-gray-700 rounded-t-xl flex-shrink-0" style={{ background: "#141420" }}>
          <div className="flex items-center gap-2">
            <Icon name={icon} size={15} style={{ color }} fallback="Sparkles" />
            <span className="text-white font-bold text-[13px]">{title}</span>
            {badge && <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ background: color + "22", color, border: `1px solid ${color}55` }}>{badge}</span>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="flex-1 overflow-auto p-4 text-[11px] min-h-0">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-700 flex-shrink-0" style={{ background: "#141420" }}>{footer}</div>}
      </motion.div>
    </motion.div>
  )
}

function Toast({ msg }: { msg: string | null }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-[#141420] border border-[#0078d4]/50 text-[#60a5fa] text-[10px] px-3 py-1.5 rounded-lg shadow-lg z-10 whitespace-nowrap">
          {msg}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Field({ label, value, onChange, options, suffix }: {
  label: string; value: string; onChange: (v: string) => void; options?: string[]; suffix?: string
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-gray-500 text-[9px]">{label}</span>
      <div className="flex items-center gap-1">
        {options
          ? <select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded outline-none text-[10px]">
              {options.map(o => <option key={o}>{o}</option>)}
            </select>
          : <input value={value} onChange={e => onChange(e.target.value)} className="w-full bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded outline-none font-mono text-[10px]" />
        }
        {suffix && <span className="text-gray-500 text-[9px] whitespace-nowrap">{suffix}</span>}
      </div>
    </label>
  )
}

// ─── 2023: Извлечение элементов коридора (Corridor Extraction) ────────────────
export function CorridorExtractionDialog({ onClose }: Close) {
  const [toast, setToast] = useState<string | null>(null)
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2000) }
  const [corridor, setCorridor] = useState("Коридор ШД-38")
  const [target, setTarget] = useState("Кромка проезжей части")
  const [asType, setAsType] = useState("Характерная линия")
  const targets = ["Кромка проезжей части", "Бровка земляного полотна", "Ось дороги", "Низ кювета", "Верх откоса", "Дно кювета"]
  const sel = [
    { code: "ETW", name: "Кромка проезжей части", pts: 42, len: "418.6 м" },
    { code: "DAY", name: "Линия выхода на рельеф", pts: 42, len: "421.3 м" },
    { code: "TOP", name: "Бровка полотна", pts: 42, len: "418.6 м" },
    { code: "DITCH", name: "Дно кювета", pts: 40, len: "402.1 м" },
  ]
  return (
    <Modal title="Извлечение элементов коридора" icon="Spline" color="#f97316" badge="2023" width={620} onClose={onClose}
      footer={<>
        <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 rounded text-[11px]">Отмена</button>
        <button onClick={() => { flash("✓ Элементы извлечены из коридора"); setTimeout(onClose, 800) }} className="px-4 py-1.5 bg-[#f97316] text-[#160a00] hover:bg-[#fb923c] rounded text-[11px] font-bold">✓ Извлечь</button>
      </>}>
      <div className="space-y-4">
        <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-2 text-[10px] text-orange-300">
          Извлечение характерных линий, полилиний и объектов из существующего коридора для повторного использования.
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Коридор" value={corridor} onChange={setCorridor} options={["Коридор ШД-38", "Коридор Ул. Трумана", "Развязка А-1"]} />
          <Field label="Целевой элемент" value={target} onChange={setTarget} options={targets} />
          <Field label="Извлечь как" value={asType} onChange={setAsType} options={["Характерная линия", "3D-полилиния", "2D-полилиния", "Точки COGO"]} />
        </div>
        <div>
          <div className="text-[10px] font-bold text-white mb-1">Доступные элементы</div>
          <table className="w-full border-collapse text-[10px]">
            <thead><tr className="bg-[#0d1117]">{["Код", "Наименование", "Точек", "Длина"].map(h => <th key={h} className="px-2 py-1 text-gray-400 border border-gray-800 text-left font-normal">{h}</th>)}</tr></thead>
            <tbody>{sel.map((s, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-[#111827]" : "bg-[#0d1117]"}>
                <td className="px-2 py-1 border border-gray-800 text-[#fb923c] font-mono font-bold">{s.code}</td>
                <td className="px-2 py-1 border border-gray-800 text-gray-300">{s.name}</td>
                <td className="px-2 py-1 border border-gray-800 text-gray-400 font-mono">{s.pts}</td>
                <td className="px-2 py-1 border border-gray-800 text-gray-400 font-mono">{s.len}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      <Toast msg={toast} />
    </Modal>
  )
}

// ─── 2023: Динамические профили смещения (Dynamic Offset Profiles) ────────────
export function OffsetProfileDialog({ onClose }: Close) {
  const [toast, setToast] = useState<string | null>(null)
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2000) }
  const [align, setAlign] = useState("Трасса ШД-38")
  const [offset, setOffset] = useState("3.5")
  const [surface, setSurface] = useState("ЦМР_Проект")
  return (
    <Modal title="Динамический профиль смещения" icon="TrendingUp" color="#22d3ee" badge="2023" width={600} onClose={onClose}
      footer={<>
        <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 rounded text-[11px]">Отмена</button>
        <button onClick={() => { flash("✓ Профиль смещения создан и связан с трассой"); setTimeout(onClose, 800) }} className="px-4 py-1.5 bg-[#22d3ee] text-[#001418] hover:bg-[#67e8f9] rounded text-[11px] font-bold">✓ Создать</button>
      </>}>
      <div className="space-y-4">
        <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-2 text-[10px] text-cyan-300">
          Профиль строится по линии, смещённой от оси трассы, и динамически обновляется при изменении поверхности.
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Трасса" value={align} onChange={setAlign} options={["Трасса ШД-38", "Трасса А-1", "Ул. Трумана"]} />
          <Field label="Смещение от оси" value={offset} onChange={setOffset} suffix="м" />
          <Field label="Поверхность" value={surface} onChange={setSurface} options={["ЦМР_Проект", "ЦМР_Съёмка_2024", "Проектная площадка-1"]} />
        </div>
        <div className="rounded-lg border border-gray-700 p-3" style={{ background: "#0d1117" }}>
          <div className="text-[9px] text-gray-500 mb-2 text-center">Продольный профиль по линии смещения</div>
          <svg viewBox="0 0 300 90" width="100%" height="110">
            <line x1="10" y1="75" x2="290" y2="75" stroke="#374151" strokeWidth="0.5" />
            <path d="M10,60 C60,50 100,66 150,44 C200,30 250,50 290,40" fill="none" stroke="#22d3ee" strokeWidth="1.5" />
            <path d="M10,64 C60,56 100,70 150,50 C200,38 250,56 290,48" fill="none" stroke="#6b7280" strokeWidth="1" strokeDasharray="3 2" />
            <text x="12" y="86" fill="#22d3ee" fontSize="6">Проект (смещение {offset} м)</text>
            <text x="200" y="86" fill="#9ca3af" fontSize="6">Существующий рельеф</text>
          </svg>
        </div>
      </div>
      <Toast msg={toast} />
    </Modal>
  )
}

// ─── 2024: Оптимизация планировки (Grading Optimization) ──────────────────────
export function GradingOptimizationDialog({ onClose }: Close) {
  const [toast, setToast] = useState<string | null>(null)
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2000) }
  const [goal, setGoal] = useState("Баланс насыпь/выемка")
  const [maxSlope, setMaxSlope] = useState("5")
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const run = () => {
    setRunning(true); setDone(false)
    setTimeout(() => { setRunning(false); setDone(true); flash("✓ Оптимизация завершена — экономия 12 400 м³") }, 1400)
  }
  return (
    <Modal title="Оптимизация планировки" icon="Sparkles" color="#a78bfa" badge="2024" width={600} onClose={onClose}
      footer={<>
        <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 rounded text-[11px]">Закрыть</button>
        <button onClick={run} disabled={running} className="px-4 py-1.5 bg-[#a78bfa] text-[#0d0a1a] hover:bg-[#c4b5fd] disabled:opacity-50 rounded text-[11px] font-bold">{running ? "Расчёт..." : "▶ Оптимизировать"}</button>
      </>}>
      <div className="space-y-4">
        <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 p-2 text-[10px] text-violet-300">
          Автоматический подбор проектных отметок площадки для минимизации объёмов земляных работ при заданных ограничениях.
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Цель оптимизации" value={goal} onChange={setGoal} options={["Баланс насыпь/выемка", "Минимум выемки", "Минимум насыпи", "Минимум перемещений"]} />
          <Field label="Макс. уклон площадки" value={maxSlope} onChange={setMaxSlope} suffix="%" />
        </div>
        {(running || done) && (
          <div className="rounded-lg border border-gray-700 p-3 space-y-2" style={{ background: "#0d1117" }}>
            {running && <div className="text-[10px] text-violet-300 flex items-center gap-2"><Icon name="Loader2" size={12} className="animate-spin" /> Подбор отметок (итерация 128/500)...</div>}
            {done && <>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[["Насыпь", "38 200 м³", "#60a5fa"], ["Выемка", "37 900 м³", "#ef4444"], ["Экономия", "12 400 м³", "#4ade80"]].map(([k, v, c]) => (
                  <div key={k} className="bg-[#111827] rounded border border-gray-800 px-2 py-1.5">
                    <div className="text-gray-500 text-[9px]">{k}</div>
                    <div className="font-mono font-bold" style={{ color: c }}>{v}</div>
                  </div>
                ))}
              </div>
              <div className="text-[9px] text-green-400">✓ Дисбаланс снижен с 8.4% до 0.4%. Средняя проектная отметка 118.62 м.</div>
            </>}
          </div>
        )}
      </div>
      <Toast msg={toast} />
    </Modal>
  )
}

// ─── 2024: Наборы свойств (Property Sets) ─────────────────────────────────────
export function PropertySetsDialog({ onClose }: Close) {
  const [toast, setToast] = useState<string | null>(null)
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2000) }
  const [sets, setSets] = useState([
    { name: "Паспорт трубы", props: ["Материал", "Диаметр", "Год укладки", "Балансодержатель"], applied: "Трубы (12)" },
    { name: "Ведомость покрытий", props: ["Тип покрытия", "Толщина", "Площадь"], applied: "Коридоры (3)" },
    { name: "Данные скважин", props: ["Глубина", "УГВ", "Дата бурения"], applied: "Скважины (4)" },
  ])
  const add = () => { setSets(p => [...p, { name: `Набор свойств ${p.length + 1}`, props: ["Свойство 1"], applied: "—" }]); flash("✓ Набор свойств создан") }
  return (
    <Modal title="Наборы свойств" icon="Table" color="#4ade80" badge="2024" width={600} onClose={onClose}
      footer={<button onClick={onClose} className="px-4 py-1.5 bg-[#0078d4] text-white rounded text-[11px]">Закрыть</button>}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-[10px]">Пользовательские атрибуты для объектов чертежа (экспорт в ведомости и IFC)</span>
          <button onClick={add} className="px-2 py-0.5 bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/40 rounded text-[9px] hover:bg-[#4ade80]/30">+ Добавить набор</button>
        </div>
        {sets.map((s, i) => (
          <div key={i} className="rounded-lg border border-gray-700 p-2.5" style={{ background: "#111827" }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-white font-semibold">{s.name}</span>
              <span className="text-[9px] text-gray-500">Применён к: {s.applied}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {s.props.map(p => <span key={p} className="text-[9px] px-1.5 py-0.5 bg-[#0078d4]/15 text-[#60a5fa] border border-[#0078d4]/30 rounded">{p}</span>)}
            </div>
          </div>
        ))}
      </div>
      <Toast msg={toast} />
    </Modal>
  )
}

// ─── 2025: Переходы коридора (Corridor Transitions / съезды-карманы) ──────────
export function CorridorTransitionsDialog({ onClose }: Close) {
  const [toast, setToast] = useState<string | null>(null)
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2000) }
  const [type, setType] = useState("Автобусный карман")
  const [fromSta, setFromSta] = useState("0+120")
  const [toSta, setToSta] = useState("0+180")
  const [taper, setTaper] = useState("1:8")
  const types = ["Автобусный карман", "Полоса разгона", "Полоса торможения", "Уширение на кривой", "Съезд направо", "Дополнительная полоса"]
  return (
    <Modal title="Переходы коридора" icon="MoveHorizontal" color="#60a5fa" badge="2025" width={640} onClose={onClose}
      footer={<>
        <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 rounded text-[11px]">Отмена</button>
        <button onClick={() => { flash("✓ Переход добавлен в коридор"); setTimeout(onClose, 800) }} className="px-4 py-1.5 bg-[#60a5fa] text-[#001028] hover:bg-[#93c5fd] rounded text-[11px] font-bold">✓ Применить</button>
      </>}>
      <div className="space-y-4">
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-2 text-[10px] text-blue-300">
          Плавные переходы ширины коридора: карманы, полосы разгона/торможения и уширения с автоматическим отгоном.
        </div>
        <div className="grid grid-cols-4 gap-3">
          <Field label="Тип перехода" value={type} onChange={setType} options={types} />
          <Field label="Начало (ПК)" value={fromSta} onChange={setFromSta} />
          <Field label="Конец (ПК)" value={toSta} onChange={setToSta} />
          <Field label="Отгон" value={taper} onChange={setTaper} options={["1:8", "1:10", "1:15", "1:20", "1:25"]} />
        </div>
        <div className="rounded-lg border border-gray-700 p-3" style={{ background: "#0d1117" }}>
          <div className="text-[9px] text-gray-500 mb-2 text-center">Схема перехода в плане</div>
          <svg viewBox="0 0 300 70" width="100%" height="80">
            <line x1="10" y1="20" x2="290" y2="20" stroke="#4ade80" strokeWidth="1" />
            <path d="M10,45 L90,45 L150,58 L230,58 L290,45" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
            <line x1="10" y1="32" x2="290" y2="32" stroke="#facc15" strokeWidth="0.6" strokeDasharray="4 3" />
            <text x="12" y="16" fill="#4ade80" fontSize="6">Кромка</text>
            <text x="150" y="68" fill="#60a5fa" fontSize="6" textAnchor="middle">{type}</text>
          </svg>
        </div>
      </div>
      <Toast msg={toast} />
    </Modal>
  )
}

// ─── 2025: Улучшенные виды профиля (Profile View Split / стили) ────────────────
export function ProfileViewPlusDialog({ onClose }: Close) {
  const [toast, setToast] = useState<string | null>(null)
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2000) }
  const [split, setSplit] = useState("Автоматически по длине листа")
  const [vExag, setVExag] = useState("10")
  const [bandSet, setBandSet] = useState("Стандартный ГОСТ")
  return (
    <Modal title="Виды профиля — расширенные" icon="AreaChart" color="#f472b6" badge="2025" width={600} onClose={onClose}
      footer={<>
        <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 rounded text-[11px]">Отмена</button>
        <button onClick={() => { flash("✓ Вид профиля создан с разбивкой на листы"); setTimeout(onClose, 800) }} className="px-4 py-1.5 bg-[#f472b6] text-[#1a0010] hover:bg-[#f9a8d4] rounded text-[11px] font-bold">✓ Создать</button>
      </>}>
      <div className="space-y-4">
        <div className="rounded-lg border border-pink-500/30 bg-pink-500/10 p-2 text-[10px] text-pink-300">
          Разбивка длинного профиля на листы, вертикальное преувеличение и настраиваемые ленты данных.
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Разбивка вида" value={split} onChange={setSplit} options={["Автоматически по длине листа", "Вручную по пикетам", "Один вид", "По вертикали"]} />
          <Field label="Вертик. преувеличение" value={vExag} onChange={setVExag} suffix="×" />
          <Field label="Набор лент данных" value={bandSet} onChange={setBandSet} options={["Стандартный ГОСТ", "Отметки земли/проекта", "Уклоны и расстояния", "Без лент"]} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          {["Лист 1 · ПК 0+000 — 0+250", "Лист 2 · ПК 0+250 — 0+420"].map(s => (
            <div key={s} className="rounded border border-gray-700 p-2" style={{ background: "#111827" }}>
              <div className="text-white text-[10px] mb-1">{s}</div>
              <svg viewBox="0 0 120 40" width="100%" height="46">
                <rect x="0" y="0" width="120" height="40" fill="#0d1117" />
                <path d="M4,30 C30,26 60,32 90,20 L116,16" fill="none" stroke="#f472b6" strokeWidth="1" />
                <path d="M4,33 C30,30 60,35 90,26 L116,24" fill="none" stroke="#6b7280" strokeWidth="0.7" strokeDasharray="2 1.5" />
              </svg>
            </div>
          ))}
        </div>
      </div>
      <Toast msg={toast} />
    </Modal>
  )
}

// ─── 2026: 3D-просмотр модели (Model Viewer) ──────────────────────────────────
export function ModelViewer3DDialog({ onClose }: Close) {
  const [toast, setToast] = useState<string | null>(null)
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2000) }
  const [mode, setMode] = useState("Реалистичный")
  const [rot, setRot] = useState(24)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{ x: number; rot: number } | null>(null)
  const layers = ["Рельеф (TIN)", "Коридор дороги", "Трубопроводные сети", "Мост", "Проектная площадка"]
  const [on, setOn] = useState<Record<string, boolean>>(Object.fromEntries(layers.map(l => [l, true])))

  const startDrag = (clientX: number) => { dragRef.current = { x: clientX, rot }; setDragging(true) }
  const moveDrag = (clientX: number) => {
    if (!dragRef.current) return
    const delta = clientX - dragRef.current.x
    let next = dragRef.current.rot + delta * 0.6
    next = ((next % 360) + 360) % 360
    setRot(Math.round(next))
  }
  const endDrag = () => { dragRef.current = null; setDragging(false) }
  return (
    <Modal title="3D-просмотр модели" icon="Box" color="#34d399" badge="2026" width={700} onClose={onClose}
      footer={<>
        <button onClick={() => flash("✓ Сцена экспортирована в glTF")} className="px-3 py-1.5 bg-[#1a3a2a] text-[#34d399] border border-[#34d399]/40 rounded text-[11px]">Экспорт glTF</button>
        <button onClick={onClose} className="px-4 py-1.5 bg-[#34d399] text-[#00160e] hover:bg-[#6ee7b7] rounded text-[11px] font-bold">Закрыть</button>
      </>}>
      <div className="flex gap-3">
        <div className="w-40 flex-shrink-0 space-y-2">
          <Field label="Режим" value={mode} onChange={setMode} options={["Реалистичный", "Каркас", "Концептуальный", "Рентген"]} />
          <div>
            <div className="text-gray-500 text-[9px] mb-1">Поворот сцены</div>
            <input type="range" min={0} max={360} value={rot} onChange={e => setRot(+e.target.value)} className="w-full" />
          </div>
          <div>
            <div className="text-gray-500 text-[9px] mb-1">Слои модели</div>
            {layers.map(l => (
              <label key={l} className="flex items-center gap-1.5 py-0.5 cursor-pointer text-[10px] text-gray-300">
                <input type="checkbox" checked={on[l]} onChange={() => setOn(p => ({ ...p, [l]: !p[l] }))} /> {l}
              </label>
            ))}
          </div>
        </div>
        <div className="flex-1 min-w-0 rounded-lg border border-gray-700 overflow-hidden relative"
          style={{ background: "#0a0f14", height: 260, cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
          onMouseDown={e => startDrag(e.clientX)}
          onMouseMove={e => dragging && moveDrag(e.clientX)}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onTouchStart={e => startDrag(e.touches[0].clientX)}
          onTouchMove={e => moveDrag(e.touches[0].clientX)}
          onTouchEnd={endDrag}>
          <svg viewBox="0 0 300 220" preserveAspectRatio="xMidYMid meet"
            style={{ display: "block", position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            <rect x="0" y="0" width="300" height="110" fill="#0f1b2e" />
            <rect x="0" y="110" width="300" height="110" fill="#0a0f14" />
            <g transform={`rotate(${(rot - 24) * 0.15} 150 150)`}>
              {on["Рельеф (TIN)"] && <polygon points="30,170 150,120 270,175 150,205" fill="#166534" opacity="0.6" stroke="#22c55e" strokeWidth="0.5" />}
              {on["Проектная площадка"] && <polygon points="90,158 150,138 210,160 150,178" fill="#a16207" opacity="0.7" stroke="#facc15" strokeWidth="0.5" />}
              {on["Коридор дороги"] && <polygon points="40,168 150,124 152,127 44,172" fill="#334155" stroke="#94a3b8" strokeWidth="0.6" />}
              {on["Коридор дороги"] && <polygon points="150,124 260,172 256,175 148,127" fill="#475569" stroke="#94a3b8" strokeWidth="0.6" />}
              {on["Трубопроводные сети"] && <line x1="60" y1="176" x2="240" y2="168" stroke="#60a5fa" strokeWidth="1.4" strokeDasharray="4 2" />}
              {on["Мост"] && <g stroke="#e5e7eb" strokeWidth="0.8" fill="none"><path d="M120,150 L180,150 M126,150 L126,140 M174,150 L174,140 M120,140 L180,140" /></g>}
            </g>
            <text x="8" y="14" fill="#34d399" fontSize="7">3D · {mode} · {rot}°</text>
            <g stroke="#6b7280" strokeWidth="1"><line x1="20" y1="205" x2="40" y2="205" /><line x1="20" y1="205" x2="20" y2="188" /></g>
            <text x="42" y="207" fill="#ef4444" fontSize="6">X</text><text x="14" y="186" fill="#4ade80" fontSize="6">Z</text>
          </svg>
          <div className="absolute bottom-1.5 right-2 text-[9px] text-gray-500 pointer-events-none select-none flex items-center gap-1">
            <Icon name="Move" size={9} fallback="MoveHorizontal" /> Перетащите для вращения
          </div>
        </div>
      </div>
      <Toast msg={toast} />
    </Modal>
  )
}

// ─── 2026: Преобразование систем координат (Coordinate Transformation) ────────
export function CoordinateTransformDialog({ onClose }: Close) {
  const [toast, setToast] = useState<string | null>(null)
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2000) }
  const [from, setFrom] = useState("МСК-70 (зона 2)")
  const [to, setTo] = useState("WGS 84 / UTM 45N")
  const systems = ["МСК-70 (зона 2)", "СК-42 (Пулково)", "СК-95", "ГСК-2011", "WGS 84 / UTM 45N", "WGS 84 (геогр.)", "Web Mercator"]
  const sample = [
    { n: "Пункт ГГС-1", x: "5420.145", y: "3817.234" },
    { n: "Пункт ГГС-2", x: "5512.563", y: "3901.360" },
    { n: "Репер Rp-14", x: "5486.902", y: "3874.118" },
  ]
  return (
    <Modal title="Преобразование систем координат" icon="Globe" color="#38bdf8" badge="2026" width={620} onClose={onClose}
      footer={<>
        <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 rounded text-[11px]">Отмена</button>
        <button onClick={() => { flash(`✓ Пересчитано: ${from} → ${to}`); setTimeout(onClose, 800) }} className="px-4 py-1.5 bg-[#38bdf8] text-[#001622] hover:bg-[#7dd3fc] rounded text-[11px] font-bold">✓ Преобразовать</button>
      </>}>
      <div className="space-y-4">
        <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-2 text-[10px] text-sky-300">
          Пересчёт координат чертежа между геодезическими и проекционными системами с трансформацией датума.
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
          <Field label="Исходная СК" value={from} onChange={setFrom} options={systems} />
          <div className="pb-1.5 text-[#38bdf8]"><Icon name="ArrowRight" size={16} /></div>
          <Field label="Целевая СК" value={to} onChange={setTo} options={systems} />
        </div>
        <table className="w-full border-collapse text-[10px]">
          <thead><tr className="bg-[#0d1117]">{["Пункт", "X исход.", "Y исход.", "X → цель", "Y → цель"].map(h => <th key={h} className="px-2 py-1 text-gray-400 border border-gray-800 text-left font-normal">{h}</th>)}</tr></thead>
          <tbody>{sample.map((s, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-[#111827]" : "bg-[#0d1117]"}>
              <td className="px-2 py-1 border border-gray-800 text-white">{s.n}</td>
              <td className="px-2 py-1 border border-gray-800 text-gray-400 font-mono">{s.x}</td>
              <td className="px-2 py-1 border border-gray-800 text-gray-400 font-mono">{s.y}</td>
              <td className="px-2 py-1 border border-gray-800 text-[#7dd3fc] font-mono">{(parseFloat(s.x) + 412331.7).toFixed(2)}</td>
              <td className="px-2 py-1 border border-gray-800 text-[#7dd3fc] font-mono">{(parseFloat(s.y) + 6183904.2).toFixed(2)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <Toast msg={toast} />
    </Modal>
  )
}

// ─── 2026: Проектирование дренажа (Drainage Design — пруды/каналы) ────────────
export function DrainageDesignDialog({ onClose }: Close) {
  const [toast, setToast] = useState<string | null>(null)
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2000) }
  const [obj, setObj] = useState("Пруд-накопитель")
  const [area, setArea] = useState("3.2")
  const [rain, setRain] = useState("70")
  const objects = ["Пруд-накопитель", "Открытый канал", "Подземный резервуар", "Габионный лоток", "Дренажная канава"]
  const q = (parseFloat(area || "0") * parseFloat(rain || "0") * 0.65 / 3.6).toFixed(1)
  const vol = (parseFloat(area || "0") * parseFloat(rain || "0") * 12).toFixed(0)
  return (
    <Modal title="Проектирование дренажа" icon="Waves" color="#22d3ee" badge="2026" width={620} onClose={onClose}
      footer={<>
        <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 rounded text-[11px]">Отмена</button>
        <button onClick={() => { flash("✓ Дренажный объект добавлен в модель"); setTimeout(onClose, 800) }} className="px-4 py-1.5 bg-[#22d3ee] text-[#001418] hover:bg-[#67e8f9] rounded text-[11px] font-bold">✓ Создать</button>
      </>}>
      <div className="space-y-4">
        <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-2 text-[10px] text-cyan-300">
          Проектирование водоотводных сооружений: пруды-накопители, каналы и резервуары с гидравлическим расчётом.
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Тип объекта" value={obj} onChange={setObj} options={objects} />
          <Field label="Площадь водосбора" value={area} onChange={setArea} suffix="га" />
          <Field label="Интенсивность дождя" value={rain} onChange={setRain} suffix="мм/ч" />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[["Расчётный расход Q", `${q} м³/с`, "#60a5fa"], ["Требуемый объём", `${vol} м³`, "#4ade80"], ["Коэф. стока φ", "0.65", "#facc15"]].map(([k, v, c]) => (
            <div key={k} className="bg-[#111827] rounded border border-gray-800 px-2 py-1.5">
              <div className="text-gray-500 text-[9px]">{k}</div>
              <div className="font-mono font-bold" style={{ color: c }}>{v}</div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-gray-700 p-3" style={{ background: "#0d1117" }}>
          <div className="text-[9px] text-gray-500 mb-2 text-center">Поперечное сечение объекта</div>
          <svg viewBox="0 0 300 80" width="100%" height="90">
            <path d="M20,25 L90,25 L140,60 L200,60 L250,25 L280,25" fill="none" stroke="#94a3b8" strokeWidth="1" />
            <path d="M90,25 L140,60 L200,60 L250,25 L90,25 Z" fill="#22d3ee" opacity="0.2" />
            <line x1="90" y1="42" x2="250" y2="42" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 2" />
            <text x="150" y="40" fill="#3b82f6" fontSize="6" textAnchor="middle">Расчётный горизонт воды</text>
          </svg>
        </div>
      </div>
      <Toast msg={toast} />
    </Modal>
  )
}

// ─── 2026: Частичная ссылка на поверхность (Surface Area of Interest) ─────────
export function SurfaceAOIDialog({ onClose }: Close) {
  const [toast, setToast] = useState<string | null>(null)
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2000) }
  const [source, setSource] = useState("ЦМР_Съёмка_2024 (крупная)")
  const [boundary, setBoundary] = useState("Полоса отвода трассы")
  return (
    <Modal title="Область интереса поверхности" icon="ScanLine" color="#facc15" badge="2026" width={580} onClose={onClose}
      footer={<>
        <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 rounded text-[11px]">Отмена</button>
        <button onClick={() => { flash("✓ Частичная ссылка на поверхность создана"); setTimeout(onClose, 800) }} className="px-4 py-1.5 bg-[#facc15] text-[#1a1400] hover:bg-[#fde047] rounded text-[11px] font-bold">✓ Создать ссылку</button>
      </>}>
      <div className="space-y-4">
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-2 text-[10px] text-yellow-300">
          Ссылка только на нужную часть большой поверхности — ускоряет чертёж без потери связи с исходной ЦМР.
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Исходная поверхность" value={source} onChange={setSource} options={["ЦМР_Съёмка_2024 (крупная)", "LiDAR_облако_2025", "Регион_Область_ЦМР"]} />
          <Field label="Граница области" value={boundary} onChange={setBoundary} options={["Полоса отвода трассы", "Контур площадки", "Прямоугольник по окну", "Буфер вокруг коридора"]} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          {[["Исходно точек", "8.4 млн", "#9ca3af"], ["В области", "142 тыс.", "#facc15"]].map(([k, v, c]) => (
            <div key={k} className="bg-[#111827] rounded border border-gray-800 px-2 py-1.5">
              <div className="text-gray-500 text-[9px]">{k}</div>
              <div className="font-mono font-bold" style={{ color: c }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      <Toast msg={toast} />
    </Modal>
  )
}

// ─── Панель «Что нового 2023–2026» ────────────────────────────────────────────
export type VersionFeatureId =
  | "corridorExtraction" | "offsetProfile"
  | "gradingOpt" | "propertySets"
  | "corridorTransitions" | "profileViewPlus"
  | "modelViewer3D" | "coordTransform" | "drainageDesign" | "surfaceAOI"

export function WhatsNewVersionsDialog({ onClose, onOpen }: { onClose: () => void; onOpen: (id: VersionFeatureId) => void }) {
  const versions: { year: string; color: string; items: { id: VersionFeatureId; name: string; icon: string; desc: string }[] }[] = [
    {
      year: "2023", color: "#f97316", items: [
        { id: "corridorExtraction", name: "Извлечение элементов коридора", icon: "Spline", desc: "Характерные линии и полилинии из коридора" },
        { id: "offsetProfile", name: "Динамический профиль смещения", icon: "TrendingUp", desc: "Профиль по линии, смещённой от оси" },
      ]
    },
    {
      year: "2024", color: "#a78bfa", items: [
        { id: "gradingOpt", name: "Оптимизация планировки", icon: "Sparkles", desc: "Автоподбор отметок для баланса земмасс" },
        { id: "propertySets", name: "Наборы свойств", icon: "Table", desc: "Пользовательские атрибуты объектов" },
      ]
    },
    {
      year: "2025", color: "#60a5fa", items: [
        { id: "corridorTransitions", name: "Переходы коридора", icon: "MoveHorizontal", desc: "Карманы, полосы разгона/торможения" },
        { id: "profileViewPlus", name: "Виды профиля — расширенные", icon: "AreaChart", desc: "Разбивка на листы, ленты данных" },
      ]
    },
    {
      year: "2026", color: "#34d399", items: [
        { id: "modelViewer3D", name: "3D-просмотр модели", icon: "Box", desc: "Интерактивная 3D-сцена проекта" },
        { id: "coordTransform", name: "Преобразование систем координат", icon: "Globe", desc: "Пересчёт между СК и датумами" },
        { id: "drainageDesign", name: "Проектирование дренажа", icon: "Waves", desc: "Пруды, каналы, резервуары" },
        { id: "surfaceAOI", name: "Область интереса поверхности", icon: "ScanLine", desc: "Частичная ссылка на большую ЦМР" },
      ]
    },
  ]
  return (
    <Modal title="Что нового · Лапа 2023–2026" icon="Sparkles" color="#0078d4" width={680} onClose={onClose}
      footer={<button onClick={onClose} className="px-4 py-1.5 bg-[#0078d4] text-white rounded text-[11px]">Закрыть</button>}>
      <div className="space-y-4">
        <div className="text-[10px] text-gray-400">Функции, добавленные в версиях 2023–2026. Нажмите на карточку, чтобы открыть инструмент.</div>
        {versions.map(v => (
          <div key={v.year}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[13px] font-bold" style={{ color: v.color }}>Лапа {v.year}</span>
              <div className="flex-1 h-px" style={{ background: v.color + "40" }} />
              <span className="text-[9px] text-gray-500">{v.items.length} функц.</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {v.items.map(it => (
                <button key={it.id} onClick={() => onOpen(it.id)}
                  className="flex items-start gap-2 p-2.5 rounded-lg border border-gray-700 hover:border-gray-500 text-left transition-colors" style={{ background: "#111827" }}>
                  <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ background: v.color + "22" }}>
                    <Icon name={it.icon} size={15} style={{ color: v.color }} fallback="Sparkles" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-white text-[11px] font-semibold">{it.name}</div>
                    <div className="text-gray-500 text-[9px] leading-tight">{it.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}