import { useRef, useState, useEffect, useCallback, useContext, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Icon from "@/components/ui/icon"
import { ProjectContext } from "@/hooks/useProjectStore"
import {
  buildDemoScene, stationToPoint, getDesignElevation,
  computeTraverse, computePrismatoidVolumes,
  type CivilScene, type ProfilePoint, type CrossSection,
} from "./civil3d-engine"
import {
  WhatsNewVersionsDialog, CorridorExtractionDialog, OffsetProfileDialog,
  GradingOptimizationDialog, PropertySetsDialog, CorridorTransitionsDialog,
  ProfileViewPlusDialog, ModelViewer3DDialog, CoordinateTransformDialog,
  DrainageDesignDialog, SurfaceAOIDialog, type VersionFeatureId,
} from "./civil3d-versions"

// ─── Recent files data ────────────────────────────────────────────────────────

const RECENT_FILES = [
  { name: "Intro-1", ext: "dwg", date: "3 апреля 2026 г. 21:29:39", color: "#a855f7", preview: "intro" },
  { name: "Quantities-7", ext: "dwg", date: "3 апреля 2026 г. 21:29:39", color: "#4ade80", preview: "quantities" },
  { name: "Align-Superelevat...", ext: "dwg", date: "3 апреля 2026 г. 21:29:39", color: "#ef4444", preview: "align" },
  { name: "Parcel-3A", ext: "dwg", date: "3 апреля 2026 г. 21:29:39", color: "#06b6d4", preview: "parcel" },
  { name: "Главная_парковка_Финал", ext: "dwg", date: "20 мая 2026 г. 14:32", color: "#4f46e5", preview: "corridor" },
  { name: "ЦМР_Съёмка_2024", ext: "tin", date: "19 мая 2026 г. 18:10", color: "#059669", preview: "tin" },
]

// ─── AdaptationDialog ─────────────────────────────────────────────────────────

function AdaptationDialog({ onClose }: { onClose: () => void }) {
  const [selectedPalette, setSelectedPalette] = useState("Текущий проект")
  const palettes = ["Текущий проект","Аннотация","Архитектурные","Оборудование","Электрическая сеть","Коммуникации","Несущие элементы","Штриховка и заливка","Таблицы","Примеры инструментов работы с","Выноски","Визуальные стили","Источники света общего назначен.","Флуоресцентная"]
  const groups: Record<string,string[]> = {
    "Текущий проект": ["Штриховка и заливка","Примеры инструментов р..."],
    "Архитектурные": ["3D-построения","Моделирование","Чертить","Редактировать","Библиотека материалов","Источники света общего назн...","Камеры","Визуальные стили"],
    "Аннотация": ["Тексты","Размеры","Выноски","Таблицы"],
    "Оборудование": ["Оборудование инженерных сетей","Кабельные лотки","Воздуховоды"],
    "Электрическая сеть": ["Электрические компоненты","Щиты","Розетки"],
  }
  const currentGroups = groups[selectedPalette] || groups["Архитектурные"]
  const currentGroupLabel = "Элементы конструкций ЛАПА в метрической системе единиц"
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/50 flex items-start justify-start z-50 p-16">
      <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.95,opacity:0}}
        className="bg-[#1e1e2e] border border-gray-600 rounded shadow-2xl flex flex-col"
        style={{width:500,height:400}} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-[#252535]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[#0078d4] flex items-center justify-center text-white text-[10px] rounded-sm font-bold">C</div>
            <span className="text-white text-[13px] font-bold">Адаптация</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg leading-none">✕</button>
        </div>
        <div className="px-4 py-2 border-b border-gray-700 text-[11px] text-gray-400 bg-[#1a1a2a]">
          Палитры инструментов - все палитры
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="border-r border-gray-700 flex flex-col" style={{width:200}}>
            <div className="px-3 py-1.5 text-[10px] text-gray-500 font-semibold border-b border-gray-800">Палитры:</div>
            <div className="flex-1 overflow-y-auto">
              {palettes.map(p=>(
                <button key={p} onClick={()=>setSelectedPalette(p)}
                  className={`w-full text-left px-3 py-1.5 text-[11px] flex items-center gap-2 transition-colors ${selectedPalette===p?"bg-[#0078d4] text-white":"text-gray-300 hover:bg-[#252535]"}`}>
                  <div className={`w-3 h-3 rounded-sm flex-shrink-0 border ${selectedPalette===p?"border-white bg-white/20":"border-gray-500 bg-gray-700"}`}/>
                  {p}
                  {p==="Текущий проект" && <span className="ml-auto w-2 h-2 rounded-full bg-orange-400 flex-shrink-0"/>}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col flex-1">
            <div className="px-3 py-1.5 text-[10px] text-gray-500 font-semibold border-b border-gray-800">Группы палитр:</div>
            <div className="flex-1 overflow-y-auto">
              {currentGroups.map((g,i)=>(
                <div key={i}>
                  <button className="w-full text-left px-3 py-1.5 text-[11px] text-gray-300 hover:bg-[#252535] flex items-center gap-1.5">
                    <Icon name="ChevronRight" size={10} className="text-gray-500"/>
                    {g}
                  </button>
                  {i===0 && (
                    <div className="pl-6">
                      <button className="w-full text-left px-3 py-1 text-[10px] text-gray-400 hover:bg-[#252535] flex items-center gap-1.5">
                        <Icon name="Minus" size={9} className="text-gray-600"/>
                        Sample
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700 px-4 py-1.5 bg-[#1a1a2a]">
          <span className="text-[10px] text-gray-500">Текущая группа палитр: </span>
          <span className="text-[10px] text-gray-300">{currentGroupLabel}</span>
        </div>
        <div className="flex items-center justify-end gap-2 px-4 py-2 border-t border-gray-700">
          <button onClick={onClose} className="text-[11px] text-white px-4 py-1.5 rounded border border-gray-500 hover:bg-[#252535] transition-colors">Закрыть</button>
          <button className="text-[11px] text-[#0078d4] px-3 py-1.5">Справка</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── StartScreen ──────────────────────────────────────────────────────────────

const PROJECTS_URL = "https://functions.poehali.dev/0413bfb5-1eee-4ebd-91f9-66e74d563887"

const TYPE_ICONS: Record<string,string> = {
  road: "Route", network: "Network", railway: "Train", area: "LayoutDashboard", bim: "Layers"
}
const TYPE_LABELS: Record<string,string> = {
  road: "Дорога / трасса", network: "Инж. сети", railway: "Ж/д путь", area: "Площадной объект", bim: "BIM"
}
const STATUS_COLORS: Record<string,string> = {
  active: "#22c55e", draft: "#f59e0b", archived: "#6b7280", completed: "#0078d4"
}
const STATUS_LABELS: Record<string,string> = {
  active: "Активен", draft: "Черновик", archived: "Архив", completed: "Завершён"
}

interface Project {
  id: number
  name: string
  description: string
  type: string
  status: string
  created_at: string
  updated_at: string
  objects_count: number
}

function AutodeskProjectsTab({ onOpen }: { onOpen: (name?: string, projectId?: number) => void }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newType, setNewType] = useState("road")
  const [saving, setSaving] = useState(false)
  const [createErr, setCreateErr] = useState("")

  const load = () => {
    setLoading(true)
    setError("")
    fetch(PROJECTS_URL)
      .then(r => r.json())
      .then(data => { setProjects(data); setLoading(false) })
      .catch(() => { setError("Ошибка загрузки проектов"); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const createProject = () => {
    if (!newName.trim() || saving) return
    const nm = newName.trim()
    setSaving(true)
    setCreateErr("")
    fetch(PROJECTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nm, description: newDesc.trim(), type: newType })
    })
      .then(async r => {
        if (!r.ok) throw new Error("status " + r.status)
        return r.json()
      })
      .then(p => {
        if (!p || !p.id) throw new Error("no id")
        setProjects(prev => [p, ...prev])
        setCreating(false)
        setNewName("")
        setNewDesc("")
        setNewType("road")
        setSaving(false)
        onOpen(nm, p.id)
      })
      .catch(() => {
        setSaving(false)
        setCreateErr("Не удалось создать проект. Попробуйте ещё раз.")
      })
  }

  const deleteProject = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Удалить проект?")) return
    fetch(PROJECTS_URL, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    }).then(() => setProjects(prev => prev.filter(p => p.id !== id)))
  }

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-[20px] font-semibold">Проекты</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border border-gray-600 rounded px-2 py-1" style={{minWidth:200}}>
            <Icon name="Search" size={12} className="text-gray-500"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск проектов..."
              className="bg-transparent text-[11px] text-white outline-none flex-1 placeholder-gray-600 ml-1"/>
          </div>
          <button onClick={()=>setCreating(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] text-white transition-colors"
            style={{background:"#0078d4"}}>
            <Icon name="Plus" size={12}/>
            Новый проект
          </button>
          <button onClick={load} className="p-1.5 rounded border border-gray-600 text-gray-400 hover:text-white transition-colors">
            <Icon name="RefreshCw" size={13}/>
          </button>
        </div>
      </div>

      {/* Форма создания */}
      {creating && (
        <div className="mb-5 p-4 rounded-lg border border-[#0078d4]/50 bg-[#0078d4]/5">
          <div className="text-[12px] text-white font-semibold mb-3">Новый проект</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[10px] text-gray-400 mb-1 block">Название *</label>
              <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Название проекта"
                className="w-full bg-[#1a1a2a] border border-gray-600 rounded px-2 py-1.5 text-[11px] text-white outline-none focus:border-[#0078d4]"/>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 mb-1 block">Тип</label>
              <select value={newType} onChange={e=>setNewType(e.target.value)}
                className="w-full bg-[#1a1a2a] border border-gray-600 rounded px-2 py-1.5 text-[11px] text-white outline-none focus:border-[#0078d4]">
                {Object.entries(TYPE_LABELS).map(([k,v])=>(
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className="text-[10px] text-gray-400 mb-1 block">Описание</label>
            <input value={newDesc} onChange={e=>setNewDesc(e.target.value)} placeholder="Краткое описание"
              className="w-full bg-[#1a1a2a] border border-gray-600 rounded px-2 py-1.5 text-[11px] text-white outline-none focus:border-[#0078d4]"/>
          </div>
          {createErr && (
            <div className="mb-3 text-[11px] text-red-400 bg-red-500/10 border border-red-500/30 rounded px-2 py-1.5">{createErr}</div>
          )}
          <div className="flex gap-2">
            <button onClick={createProject} disabled={saving || !newName.trim()}
              className="px-4 py-1.5 rounded text-[11px] text-white disabled:opacity-50 transition-colors"
              style={{background:"#0078d4"}}>
              {saving ? "Создание..." : "Создать и открыть"}
            </button>
            <button onClick={()=>{ setCreating(false); setCreateErr("") }} className="px-4 py-1.5 rounded text-[11px] text-gray-400 border border-gray-600 hover:text-white transition-colors">
              Отмена
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Icon name="Loader2" size={24} className="text-[#0078d4] animate-spin"/>
          <span className="text-gray-400 text-[12px] ml-3">Загрузка проектов...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded border border-red-800/50 bg-red-900/10 mb-4">
          <Icon name="AlertCircle" size={14} className="text-red-400"/>
          <span className="text-[11px] text-red-300">{error}</span>
          <button onClick={load} className="ml-auto text-[11px] text-[#0078d4] hover:underline">Повторить</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <Icon name="FolderOpen" size={36} className="mx-auto mb-3 text-gray-700"/>
          <div className="text-[13px]">{search ? "Проекты не найдены" : "Нет проектов"}</div>
          {!search && <div className="text-[11px] mt-1">Нажмите «Новый проект» чтобы начать</div>}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-3" style={{gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))"}}>
          {filtered.map(p => (
            <div key={p.id} onClick={()=>onOpen(p.name, p.id)}
              className="p-4 rounded-lg border border-gray-700 hover:border-[#0078d4] transition-all cursor-pointer group relative"
              style={{background:"#252535"}}>
              {/* Шапка */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{background: (STATUS_COLORS[p.status] || "#6b7280") + "20"}}>
                  <Icon name={TYPE_ICONS[p.type] || "FolderOpen"} size={16}
                    style={{color: STATUS_COLORS[p.status] || "#6b7280"}} fallback="Folder"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-[12px] font-semibold truncate">{p.name}</div>
                  <div className="text-gray-400 text-[10px] truncate mt-0.5">{p.description || "—"}</div>
                </div>
                <button onClick={e=>deleteProject(p.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all p-0.5 flex-shrink-0">
                  <Icon name="Trash2" size={13}/>
                </button>
              </div>
              {/* Теги */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] px-1.5 py-0.5 rounded-full border" style={{
                  borderColor:(STATUS_COLORS[p.status]||"#6b7280")+"60",
                  color: STATUS_COLORS[p.status] || "#6b7280",
                  background: (STATUS_COLORS[p.status]||"#6b7280")+"15"
                }}>{STATUS_LABELS[p.status] || p.status}</span>
                <span className="text-[9px] text-gray-500 border border-gray-700 px-1.5 py-0.5 rounded-full">
                  {TYPE_LABELS[p.type] || p.type}
                </span>
                {p.objects_count > 0 && (
                  <span className="text-[9px] text-gray-500 flex items-center gap-1 ml-auto">
                    <Icon name="Layers" size={9}/>
                    {p.objects_count} объ.
                  </span>
                )}
              </div>
              {/* Дата */}
              <div className="text-[9px] text-gray-600 mt-2 flex items-center gap-1">
                <Icon name="Clock" size={9}/>
                {new Date(p.updated_at).toLocaleDateString("ru-RU", {day:"numeric",month:"long",year:"numeric"})}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── FeedbackModalInner — встроенная система без внешних ссылок ───────────────
const СПРАВКА_РАЗДЕЛЫ = [
  { title:"Быстрый старт",         desc:"Создание первого проекта за 15 минут", icon:"Play",         content:"1. Нажмите «Создать» → выберите тип проекта.\n2. Импортируйте данные рельефа (LandXML, TIN, DXF).\n3. Постройте трассу: вкладка «Главная» → «Создать трассу».\n4. Добавьте коридор: вкладка «Коридоры» → «Создать коридор».\n5. Рассчитайте объёмы: «Анализ» → «Объёмы земляных работ»." },
  { title:"Работа с ЦМР",           desc:"LiDAR, GNSS, TIN-поверхности",        icon:"Mountain",     content:"Цифровая модель рельефа (ЦМР):\n• Импорт: Файл → Импорт → LandXML / DXF / CSV-точки\n• Построение TIN: Поверхности → Создать поверхность TIN\n• Горизонтали: Поверхности → Горизонтали → настроить интервал\n• Анализ уклонов: Поверхности → Анализ → Уклоны и водосборы" },
  { title:"Проектирование трассы",  desc:"СП 34, клотоиды, пикетаж",            icon:"Route",        content:"Трасса (горизонтальная ось):\n• Создать: Главная → Трассы → Создать трассу по объектам\n• Типы элементов: прямая, дуга, клотоида (переходная кривая)\n• Пикетаж: задаётся начальный ПК, шаг разбивки\n• Нормы СП 34.13330: радиусы, уклоны, видимость\n• Экспорт разбивки: Вывод → Таблица разбивки трассы" },
  { title:"Создание коридора",      desc:"типовое сечение, поперечники, объёмы",        icon:"RoadHorizon",  content:"Коридор = трасса + профиль + типовое поперечное сечение:\n1. Создайте типовое сечение: Коридоры → Сечение → Добавить полосы\n2. Назначьте трассу и профиль: Коридоры → Создать коридор\n3. Укажите типовое сечение и поверхность рельефа\n4. Вычислите объёмы: Анализ → Сечения → Ведомость объёмов\n5. График масс: Анализ → График масс Брикнера" },
  { title:"Инженерные сети",        desc:"Гидравлика, коллизии",                 icon:"Network",      content:"Трассировка инженерных сетей:\n• Водопровод / канализация / ливневая канализация\n• Создание: Главная → Трубопроводные сети → Создать сеть\n• Гидравлический расчёт: Анализ → Гидравлика\n• Проверка коллизий: Анализ → Проверка коллизий\n• Экспорт: LandXML, IFC 2x3, DXF" },
  { title:"Горячие клавиши",        desc:"Все команды редактора",                icon:"Keyboard",     content:"Основные горячие клавиши:\nCtrl+Z — Отменить    Ctrl+Y — Повторить\nCtrl+S — Сохранить   Ctrl+N — Новый чертёж\nCtrl+O — Открыть     Ctrl+P — Печать\nDelete — Удалить     Esc — Отмена команды\nF2 — Командная строка    F8 — Орто-режим\nF3 — Привязки         F10 — Полярное отслеживание\nMW — Масштаб         Shift+MW — Панорама\nSS — Быстрый выбор    SP — Редактировать свойства" },
]

function FeedbackModalInner({ тип, onClose }: { тип: "отзыв"|"ошибка"|"документация"; onClose: ()=>void }) {
  const [текст, setТекст] = useState("")
  const [отправлено, setОтправлено] = useState(false)
  const [активРаздел, setАктивРаздел] = useState<number|null>(null)
  const [номерТикета] = useState(() => `ЛАПА-${Math.floor(100000+Math.random()*900000)}`)
  const заголовок = тип==="отзыв" ? "Сообщество ЛАПА" : тип==="ошибка" ? "Служба поддержки" : "Онлайн-справка"

  if (активРаздел !== null) {
    const р = СПРАВКА_РАЗДЕЛЫ[активРаздел]
    return (
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4" onClick={onClose}>
        <motion.div initial={{scale:0.93,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.93,opacity:0}}
          className="rounded-xl shadow-2xl w-full bg-[#1e1e2e] border border-gray-700"
          style={{maxWidth:540}} onClick={e=>e.stopPropagation()}>
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-700">
            <button onClick={()=>setАктивРаздел(null)} className="text-gray-400 hover:text-white text-sm">← Назад</button>
            <span className="text-white font-bold text-[14px] flex-1">{р.title}</span>
            <button onClick={onClose} className="text-gray-500 hover:text-white text-lg leading-none">✕</button>
          </div>
          <div className="p-5">
            <p className="text-gray-400 text-[11px] mb-3">{р.desc}</p>
            <pre className="bg-[#0d1117] border border-gray-700 rounded-lg p-4 text-[12px] text-gray-200 whitespace-pre-wrap leading-relaxed font-mono">{р.content}</pre>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4"
      onClick={onClose}>
      <motion.div initial={{scale:0.93,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.93,opacity:0}}
        className="rounded-xl shadow-2xl w-full bg-[#1e1e2e] border border-gray-700"
        style={{maxWidth:500}} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <span className="text-white font-bold text-[14px]">{заголовок}</span>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg leading-none">✕</button>
        </div>
        {отправлено ? (
          <div className="px-5 py-10 text-center">
            <Icon name="CheckCircle" size={40} className="text-green-500 mx-auto mb-3" fallback="Check"/>
            <div className="text-white font-semibold text-[14px]">{тип==="ошибка" ? `Тикет создан: ${номерТикета}` : "Отправлено!"}</div>
            <div className="text-gray-400 text-[12px] mt-1">{тип==="ошибка" ? "Мы рассмотрим обращение в течение 24 часов" : "Спасибо за обратную связь"}</div>
            <button onClick={onClose} className="mt-4 px-5 py-2 text-[12px] text-white bg-[#0078d4] hover:bg-[#0066b3] rounded transition-colors">Закрыть</button>
          </div>
        ) : тип === "документация" ? (
          <div className="p-4 space-y-1.5 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#0078d4]/10 border border-[#0078d4]/30 mb-3">
              <Icon name="BookOpen" size={16} className="text-[#0078d4] flex-shrink-0"/>
              <div className="flex-1">
                <div className="text-white text-[13px] font-bold">Встроенная документация ЛАПА</div>
                <div className="text-[#60a5fa] text-[11px]">Выберите раздел ниже для просмотра</div>
              </div>
            </div>
            {СПРАВКА_РАЗДЕЛЫ.map((d,i)=>(
              <button key={d.title} onClick={()=>setАктивРаздел(i)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#252535] border border-gray-800 hover:border-[#0078d4] transition-colors text-left">
                <Icon name={d.icon} size={16} className="text-[#0078d4] flex-shrink-0" fallback="BookOpen"/>
                <div className="flex-1"><div className="text-white text-[13px] font-semibold">{d.title}</div>
                <div className="text-gray-500 text-[11px]">{d.desc}</div></div>
                <Icon name="ChevronRight" size={14} className="text-gray-600"/>
              </button>
            ))}
          </div>
        ) : тип === "отзыв" ? (
          <div className="p-5 space-y-3">
            <p className="text-[11px] text-gray-400">Ваш отзыв помогает нам делать ЛАПА лучше.</p>
            <div className="grid grid-cols-3 gap-2">
              {["👍 Всё отлично","🐛 Нашёл баг","💡 Идея"].map(v=>(
                <button key={v} onClick={()=>setТекст(p=>p?p:v)}
                  className="p-2 rounded border border-gray-700 hover:border-[#0078d4] text-gray-400 hover:text-white text-[11px] transition-colors">{v}</button>
              ))}
            </div>
            <textarea value={текст} onChange={e=>setТекст(e.target.value)} rows={4}
              placeholder="Расскажите подробнее..."
              className="w-full bg-[#2a2a3e] border border-gray-600 text-white text-[12px] px-3 py-2 rounded outline-none focus:border-[#0078d4] resize-none placeholder-gray-600"/>
            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="px-4 py-2 text-[12px] text-gray-400 hover:text-white border border-gray-700 rounded">Отмена</button>
              <button onClick={()=>{ if(текст.trim()) setОтправлено(true); else onClose() }}
                className="px-4 py-2 text-[12px] text-white rounded bg-[#0078d4] hover:bg-[#0066b3] transition-colors">Отправить</button>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-900/20 border border-yellow-700/40 text-[11px] text-yellow-300">
              <Icon name="AlertTriangle" size={14} fallback="AlertTriangle"/>
              Номер вашего тикета: <strong>{номерТикета}</strong> — сохраните его
            </div>
            <div className="grid grid-cols-2 gap-2">
              {["Ошибка при расчёте","Не открывается файл","Зависание программы","Другое"].map(v=>(
                <button key={v} onClick={()=>setТекст(p=>p?p:v+" — ")}
                  className="p-2 rounded border border-gray-700 hover:border-[#ef4444] text-gray-400 hover:text-white text-[11px] transition-colors text-left">{v}</button>
              ))}
            </div>
            <textarea value={текст} onChange={e=>setТекст(e.target.value)} rows={4}
              placeholder="Опишите проблему: что делали, что произошло, шаги воспроизведения..."
              className="w-full bg-[#2a2a3e] border border-gray-600 text-white text-[12px] px-3 py-2 rounded outline-none focus:border-[#0078d4] resize-none placeholder-gray-600"/>
            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="px-4 py-2 text-[12px] text-gray-400 hover:text-white border border-gray-700 rounded">Отмена</button>
              <button onClick={()=>{ if(текст.trim()) setОтправлено(true); else onClose() }}
                className="px-4 py-2 text-[12px] text-white rounded bg-[#ef4444] hover:bg-[#dc2626] transition-colors">Создать тикет</button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── LearningTab — полноценное обучение без внешних ссылок ────────────────────
const УРОКИ = [
  {
    id:1, icon:"Play", color:"#0078d4", tag:"Видео · 15 мин", level:"Начинающий",
    title:"Быстрый старт — первый проект",
    desc:"Создайте первый проект с нуля за 15 минут",
    шаги:["Создайте новый проект: Файл → Создать → Проект дороги","Импортируйте данные рельефа (LandXML или CSV-точки)","Постройте трассу горизонтального выравнивания","Создайте продольный профиль по трассе","Добавьте коридор с типовым сечением и поверхностью рельефа","Рассчитайте объёмы земляных работ"],
  },
  {
    id:2, icon:"Mountain", color:"#059669", tag:"Урок · 30 мин", level:"Начинающий",
    title:"Работа с ЦМР и поверхностями",
    desc:"TIN-поверхности, горизонтали, анализ рельефа",
    шаги:["Файл → Импорт → LandXML / DXF / CSV-точки съёмки","Поверхности → Создать поверхность TIN по точкам","Настройте триангуляцию Делоне: макс. длина ребра, угол","Горизонтали: Поверхности → Горизонтали → интервал 1м/5м","Водосборы: Поверхности → Анализ → Водосборные бассейны","Уклоны: Поверхности → Анализ → Карта уклонов"],
  },
  {
    id:3, icon:"Route", color:"#d97706", tag:"Урок · 45 мин", level:"Средний",
    title:"Проектирование горизонтальной трассы",
    desc:"Трассирование по СП 34, клотоиды, пикетаж",
    шаги:["Главная → Трассы → Создать трассу","Тип трассы: дорога, съезд, парковка, пешеходная","Добавьте элементы: прямая → дуга → клотоида (переходная кривая)","Параметры СП 34: минимальные радиусы, вираж, уширение","Пикетаж: начало ПК 0+000, шаг 20м / 100м","Вывод: таблица разбивки, ведомость углов поворота"],
  },
  {
    id:4, icon:"TrendingUp", color:"#7c3aed", tag:"Урок · 30 мин", level:"Средний",
    title:"Продольный профиль и вертикальная трасса",
    desc:"ВУП, уклоны, вертикальные кривые, земляное полотно",
    шаги:["Трассы → Профили → Создать профиль по поверхности","Постройте чёрный профиль (рельеф) по оси трассы","Создайте красный профиль: вкладка Профили → ВУП","Вертикальные уклоны по СП 34: норма и допуск","Вертикальные кривые: выпуклые и вогнутые, кривая разгона","Маска земляного полотна: насыпь, выемка, нулевые точки"],
  },
  {
    id:5, icon:"RoadHorizon", color:"#be185d", tag:"Урок · 60 мин", level:"Продвинутый",
    title:"Коридоры и объёмы земляных работ",
    desc:"типовое сечение, поперечные сечения, ведомость объёмов",
    шаги:["Коридоры → Сечение → Добавить компонент полосы","Компоненты: проезжая часть, обочина, откос, кювет","Коридоры → Создать коридор: трасса + профиль + типовое сечение","Привяжите коридор к поверхности рельефа","Сечения: Коридоры → Поперечные сечения (шаг 20м)","Объёмы: Анализ → Ведомость объёмов, График масс Брикнера"],
  },
  {
    id:6, icon:"Network", color:"#0284c7", tag:"Урок · 40 мин", level:"Средний",
    title:"Инженерные сети",
    desc:"Трубопроводные сети, гидравлика, коллизии",
    шаги:["Главная → Трубопроводные сети → Создать сеть","Типы сетей: водопровод / самотёчная / ливневая / газ","Трассировка: труба, колодец, водозаборный узел","Параметры: диаметр, материал, уклон, глубина заложения","Анализ: Сети → Гидравлический расчёт (скорость, давление)","Коллизии: Анализ → Проверка коллизий с коридором"],
  },
  {
    id:7, icon:"Scan", color:"#f59e0b", tag:"Урок · 35 мин", level:"Средний",
    title:"Геодезия и съёмка",
    desc:"Теодолитные ходы, координаты, разбивка",
    шаги:["Геодезия → Съёмочные точки → Импорт CSV/TXT","Формат: N, E, Z, код точки (пример: 1000, 5000, 115.40, Р)","Теодолитный ход: Геодезия → Теодолитный ход → Вычислить","Уравнивание хода: МНК, допустимая невязка f≤1:2000","Разбивка оси: Геодезия → Разбивка → Трасса → Пикеты","Экспорт разбивки: Вывод → CSV/GNSS/Тахеометр"],
  },
  {
    id:8, icon:"Layers", color:"#6366f1", tag:"Урок · 25 мин", level:"Средний",
    title:"BIM и экспорт IFC",
    desc:"3D-модель, IFC 2x3, интеграция с Revit",
    шаги:["BIM → Создать 3D-модель коридора (Solid)","Назначьте материалы: асфальт, грунт, бетон, металл","Экспорт IFC: Файл → Экспорт → IFC 2x3 (открытый стандарт)","Экспорт LandXML: все трассы, профили, поверхности","DXF-экспорт: выбор слоёв, масштаб, система координат","Проверка модели: BIM → Контроль коллизий (Clash Detection)"],
  },
]

function LearningTab({ onFeedback }: { onFeedback: (t:"отзыв"|"ошибка"|"документация")=>void }) {
  const [активУрок, setАктивУрок] = useState<number|null>(null)
  const [фильтр, setФильтр] = useState<string>("Все")
  const [завершённые, setЗавершённые] = useState<Set<number>>(new Set())

  const урок = активУрок !== null ? УРОКИ.find(u=>u.id===активУрок) : null
  const УРОВНИ = ["Все","Начинающий","Средний","Продвинутый"]
  const видимые = фильтр==="Все" ? УРОКИ : УРОКИ.filter(u=>u.level===фильтр)

  if (урок) return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={()=>setАктивУрок(null)} className="flex items-center gap-1 text-[#4fc3f7] hover:text-white text-[12px] transition-colors">
          <Icon name="ChevronLeft" size={14}/> Все уроки
        </button>
        <span className="text-gray-600">·</span>
        <span className="text-gray-400 text-[12px]">{урок.tag}</span>
        <span className="text-[9px] px-2 py-0.5 rounded-full" style={{background:урок.color+"20",color:урок.color}}>{урок.level}</span>
      </div>
      <div className="rounded-xl border border-gray-700 overflow-hidden" style={{background:"#111827"}}>
        {/* Превью урока */}
        <div className="relative flex items-center justify-center" style={{height:140,background:`linear-gradient(135deg,#0a1628,${урок.color}30)`}}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{background:урок.color+"30",border:`2px solid ${урок.color}50`}}>
            <Icon name={урок.icon} size={26} style={{color:урок.color}} fallback="Play"/>
          </div>
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/50 px-2 py-1 rounded text-[10px] text-gray-300">
            <Icon name="Clock" size={10}/> {урок.tag.split("·")[1]?.trim()}
          </div>
        </div>
        <div className="p-5">
          <h3 className="text-white text-[16px] font-bold mb-1">{урок.title}</h3>
          <p className="text-gray-400 text-[12px] mb-4">{урок.desc}</p>
          <div className="space-y-2">
            {урок.шаги.map((шаг,i)=>(
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#1a2035] transition-colors group cursor-pointer"
                onClick={()=>setЗавершённые(s=>{ const n=new Set(s); if(n.has(урок.id*100+i)){n.delete(урок.id*100+i)}else{n.add(урок.id*100+i)}; return n })}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border transition-colors ${завершённые.has(урок.id*100+i)?"border-green-500 bg-green-500/20":"border-gray-600 group-hover:border-[#0078d4]"}`}>
                  {завершённые.has(урок.id*100+i)
                    ? <Icon name="Check" size={10} className="text-green-400"/>
                    : <span className="text-[9px] text-gray-500">{i+1}</span>}
                </div>
                <span className={`text-[12px] leading-relaxed ${завершённые.has(урок.id*100+i)?"text-gray-600 line-through":"text-gray-300"}`}>{шаг}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
            <div className="text-[11px] text-gray-500">{завершённые.size > 0 ? `${[...завершённые].filter(k=>Math.floor(k/100)===урок.id).length} из ${урок.шаги.length} шагов` : "Нажмите на шаг чтобы отметить"}</div>
            <button onClick={()=>{ setЗавершённые(s=>{ const n=new Set(s); урок.шаги.forEach((_,i)=>n.add(урок.id*100+i)); return n }); setTimeout(()=>setАктивУрок(null),800) }}
              className="px-4 py-1.5 text-[12px] text-white rounded transition-colors" style={{background:урок.color}}>
              Завершить урок ✓
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white text-[20px] font-semibold">Обучение</h2>
        <div className="flex gap-1">
          {УРОВНИ.map(у=>(
            <button key={у} onClick={()=>setФильтр(у)}
              className={`px-3 py-1 text-[11px] rounded-full transition-colors ${фильтр===у?"bg-[#0078d4] text-white":"text-gray-400 hover:text-white border border-gray-700"}`}>{у}</button>
          ))}
        </div>
      </div>
      <div className="grid gap-3" style={{gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))"}}>
        {видимые.map(у=>{
          const пройден = у.шаги.every((_,i)=>завершённые.has(у.id*100+i))
          return (
            <button key={у.id} onClick={()=>setАктивУрок(у.id)}
              className="p-4 rounded-xl border text-left transition-all group hover:scale-[1.02]"
              style={{background:"#111827",borderColor:пройден?"#16a34a50":"#374151"}}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:у.color+"20"}}>
                  <Icon name={у.icon} size={18} style={{color:у.color}} fallback="Play"/>
                </div>
                <div className="flex items-center gap-1">
                  {пройден && <Icon name="CheckCircle" size={14} className="text-green-500"/>}
                  <span className="text-[9px] px-2 py-0.5 rounded-full" style={{background:у.color+"15",color:у.color}}>{у.tag}</span>
                </div>
              </div>
              <div className="text-white text-[13px] font-bold group-hover:text-[#60b0ff] transition-colors mb-1">{у.title}</div>
              <div className="text-gray-500 text-[11px] mb-2">{у.desc}</div>
              <div className="flex items-center gap-1 text-[10px] text-gray-600">
                <Icon name="BarChart2" size={10}/>
                <span>{у.level}</span>
                <span className="mx-1">·</span>
                <span>{у.шаги.length} шагов</span>
              </div>
            </button>
          )
        })}
      </div>
      {/* Прогресс */}
      <div className="rounded-xl border border-gray-700 p-4 flex items-center gap-6" style={{background:"#111827"}}>
        <div>
          <div className="text-white font-extrabold text-[22px]">{УРОКИ.filter(у=>у.шаги.every((_,i)=>завершённые.has(у.id*100+i))).length}<span className="text-gray-500 text-[14px] font-normal"> / {УРОКИ.length}</span></div>
          <div className="text-gray-500 text-[11px]">Уроков завершено</div>
        </div>
        <div className="flex-1">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-[#0078d4] rounded-full transition-all" style={{width:`${Math.round(УРОКИ.filter(у=>у.шаги.every((_,i)=>завершённые.has(у.id*100+i))).length/УРОКИ.length*100)}%`}}/>
          </div>
          <div className="text-[10px] text-gray-500 mt-1">{Math.round(УРОКИ.filter(у=>у.шаги.every((_,i)=>завершённые.has(у.id*100+i))).length/УРОКИ.length*100)}% пройдено</div>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>onFeedback("документация")} className="px-3 py-1.5 text-[11px] rounded border border-[#0078d4]/50 text-[#60a5fa] hover:bg-[#0078d4]/20 transition-colors">
            <Icon name="BookOpen" size={12} className="inline mr-1"/>Справка
          </button>
          <button onClick={()=>onFeedback("ошибка")} className="px-3 py-1.5 text-[11px] rounded border border-gray-700 text-gray-400 hover:text-white hover:bg-[#252535] transition-colors">
            <Icon name="HelpCircle" size={12} className="inline mr-1"/>Поддержка
          </button>
        </div>
      </div>
    </div>
  )
}

function StartScreen({ onOpen, onSave, currentProjectName, showWelcomeDialog, setShowWelcomeDialog, showGraphicsBanner, setShowGraphicsBanner }: {
  onOpen: (name?: string, projectId?: number) => void
  onSave?: () => void
  currentProjectName?: string
  showWelcomeDialog: boolean
  setShowWelcomeDialog: (v: boolean) => void
  showGraphicsBanner: boolean
  setShowGraphicsBanner: (v: boolean) => void
}) {
  const [tab, setTab] = useState<"recent"|"autodesk"|"learning">("recent")
  const [showFeedback, setShowFeedback] = useState<"отзыв"|"ошибка"|"документация"|null>(null)
  const [scrToast, setScrToast] = useState<string|null>(null)
  const scrFlash = (m:string)=>{ setScrToast(m); setTimeout(()=>setScrToast(null), 2000) }
  const [search, setSearch] = useState("")
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [newTabName, setNewTabName] = useState("")

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] text-gray-200 overflow-hidden relative" style={{fontFamily:"Arial,sans-serif",fontSize:12}}>
      {/* Верхняя полоса */}
      <div className="bg-[#1a1a2a] border-b border-gray-800 flex items-center px-2 py-0.5 gap-2 flex-shrink-0" style={{minHeight:24}}>
        <svg viewBox="0 0 32 32" width="16" height="16" fill="none" className="flex-shrink-0"><ellipse cx="16" cy="22" rx="7" ry="6" fill="#4fc3f7"/><ellipse cx="10" cy="13" rx="3" ry="3.5" fill="#4fc3f7"/><ellipse cx="22" cy="13" rx="3" ry="3.5" fill="#4fc3f7"/><ellipse cx="7" cy="18" rx="2.5" ry="3" fill="#4fc3f7"/><ellipse cx="25" cy="18" rx="2.5" ry="3" fill="#4fc3f7"/><ellipse cx="16" cy="8" rx="2.5" ry="2.8" fill="#4fc3f7"/></svg>
        <span className="text-[11px] text-white font-bold">ЛАПА</span>
        <span className="text-[11px] text-gray-400 font-semibold">— Редактор</span>
        <div className="flex-1"/>
        <input placeholder="Ключевое слово или фраза" className="bg-[#2a2a3a] border border-gray-600 text-[10px] text-gray-400 px-2 py-0.5 w-44 rounded-sm placeholder-gray-600 outline-none"/>
      </div>
      {/* Информационный баннер */}
      {showGraphicsBanner && (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-blue-800/40 flex-shrink-0" style={{background:"#1a2a3a"}}>
          <Icon name="Info" size={14} className="text-[#0078d4] flex-shrink-0"/>
          <span className="text-[11px] text-gray-300 flex-1">Настройте параметры графики компьютера для повышения производительности.</span>
          <button onClick={()=>scrFlash("Параметры графики оптимизированы")} className="text-[11px] text-white px-3 py-0.5 rounded transition-colors flex-shrink-0 hover:opacity-90" style={{background:"#0078d4"}}>Настроить</button>
          <button onClick={()=>setShowGraphicsBanner(false)} className="text-gray-400 hover:text-white ml-1 text-sm flex-shrink-0">✕</button>
        </div>
      )}
      {/* Основной контент */}
      <div className="flex flex-1 overflow-hidden">
        {/* Левая панель */}
        <div className="bg-[#252535] border-r border-gray-700 flex flex-col flex-shrink-0" style={{width:220}}>
          <div className="px-6 py-6 border-b border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <svg viewBox="0 0 32 32" width="32" height="32" fill="none" className="flex-shrink-0">
                <ellipse cx="16" cy="22" rx="7.5" ry="6.5" fill="#4fc3f7"/>
                <ellipse cx="9.5" cy="12.5" rx="3.2" ry="3.7" fill="#4fc3f7"/>
                <ellipse cx="22.5" cy="12.5" rx="3.2" ry="3.7" fill="#4fc3f7"/>
                <ellipse cx="6"   cy="18"   rx="2.6" ry="3.1" fill="#4fc3f7"/>
                <ellipse cx="26"  cy="18"   rx="2.6" ry="3.1" fill="#4fc3f7"/>
                <ellipse cx="16"  cy="7.5"  rx="2.7" ry="3"   fill="#4fc3f7"/>
              </svg>
              <div>
                <div className="text-white text-[18px] font-bold leading-tight">ЛАПА</div>
                <div className="text-[#4fc3f7] text-[11px] font-semibold tracking-wide">Инфраструктурный редактор</div>
              </div>
            </div>

            {/* Открыть с выпадающим дропдауном */}
            <div className="relative mb-2 group">
              <div className="flex rounded border border-gray-600 overflow-hidden hover:border-[#0078d4] transition-all">
                <button onClick={()=>setTab("autodesk")}
                  className="flex-1 flex items-center gap-2 px-3 py-2 text-[12px] text-white hover:bg-[#0078d4]/10 transition-colors">
                  <Icon name="FolderOpen" size={14}/>
                  <span>Открыть...</span>
                </button>
                <button onClick={()=>setTab("autodesk")}
                  className="px-2 border-l border-gray-600 text-gray-400 hover:text-white hover:bg-[#0078d4]/10 transition-colors">
                  <Icon name="ChevronDown" size={11}/>
                </button>
              </div>
            </div>

            {/* Создать */}
            <div className="flex rounded border border-gray-600 overflow-hidden hover:border-[#0078d4] transition-all">
              <button onClick={()=>setShowNewDialog(true)}
                className="flex-1 flex items-center gap-2 px-3 py-2 text-[12px] text-white hover:bg-[#0078d4]/10 transition-colors">
                <Icon name="Plus" size={14}/>
                <span>Создать</span>
              </button>
              <button onClick={()=>setShowNewDialog(true)}
                className="px-2 border-l border-gray-600 text-gray-400 hover:text-white hover:bg-[#0078d4]/10 transition-colors">
                <Icon name="ChevronDown" size={11}/>
              </button>
            </div>

            {/* Текущий проект */}
            {currentProjectName && (
              <div className="mt-3 flex items-center gap-2 px-2 py-1.5 rounded border border-green-800/40 bg-green-900/10">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0"/>
                <span className="text-[10px] text-green-300 truncate">{currentProjectName}</span>
                {onSave && (
                  <button onClick={onSave} className="ml-auto text-[9px] text-[#0078d4] hover:underline flex-shrink-0">Сохранить</button>
                )}
              </div>
            )}
          </div>

          <nav className="flex-1 py-3">
            {([["recent","Последние"],["autodesk","Проекты ЛАПА"],["learning","Обучение и аналитика"]] as const).map(([id,label])=>(
              <button key={id} onClick={()=>setTab(id)}
                className={`w-full text-left px-6 py-2 text-[12px] transition-colors ${tab===id?"bg-[#0078d4]/20 text-white border-l-2 border-[#0078d4]":"text-gray-400 hover:text-white hover:bg-[#2d2d4e]"}`}>
                {label}
              </button>
            ))}
          </nav>

          <div className="px-4 py-4 border-t border-gray-700 space-y-1">
            {([
              ["Новые возможности", "ExternalLink", () => setTab("learning")],
              ["Онлайн-справка",   "HelpCircle",   () => setShowFeedback("документация")],
              ["Сообщество ЛАПА",  "Users",         () => setShowFeedback("отзыв")],
              ["Поддержка",        "Headphones",    () => setShowFeedback("ошибка")],
            ] as const).map(([label, icon, fn]) => (
              <button key={label} onClick={fn}
                className="flex items-center gap-2 text-[11px] text-[#60a5fa] hover:underline w-full text-left px-1 py-0.5 transition-colors hover:text-[#93c5fd]">
                <Icon name={icon} size={11} fallback="Link"/>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Основная область */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === "recent" && (
            <>
              <h2 className="text-white text-[20px] font-semibold mb-4">Последние</h2>
              <div className="flex items-center gap-3 mb-5">
                <button className="p-1.5 rounded border border-gray-600 text-gray-400 hover:text-white"><Icon name="List" size={14}/></button>
                <button className="p-1.5 rounded border border-[#0078d4] bg-[#0078d4]/20 text-[#0078d4]"><Icon name="LayoutGrid" size={14}/></button>
                <div className="flex items-center gap-1 border border-gray-600 rounded px-2 py-1 text-[11px] text-gray-400">
                  <span>Сортировать по</span>
                  <span className="text-white ml-1">Последнее открытие</span>
                  <Icon name="ChevronDown" size={11} className="ml-1"/>
                </div>
                <div className="flex items-center gap-1 border border-gray-600 rounded px-2 py-1 ml-auto" style={{minWidth:220}}>
                  <Icon name="Search" size={12} className="text-gray-500"/>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск последних файлов" className="bg-transparent text-[11px] text-white outline-none flex-1 placeholder-gray-600 ml-1"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4" style={{gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))"}}>
                {RECENT_FILES.filter(f=>f.name.toLowerCase().includes(search.toLowerCase())).map((f,i)=>(
                  <div key={i} role="button" tabIndex={0} onClick={()=>onOpen(f.name)}
                    onKeyDown={e=>{if(e.key==="Enter"||e.key===" ")onOpen(f.name)}}
                    className="text-left rounded-lg border border-gray-700 hover:border-[#0078d4] hover:bg-[#1e1e30] transition-all overflow-hidden group cursor-pointer">
                    <div className="h-32 flex items-center justify-center relative" style={{background:"#111827"}}>
                      <svg width="100%" height="100%" viewBox="0 0 200 120" style={{background:"#111827"}}>
                        {f.preview==="intro" && <>
                          <path d="M20,60 Q60,30 100,50 Q140,70 180,40" stroke="#a855f7" strokeWidth="2" fill="none"/>
                          <path d="M20,80 Q80,60 140,75 Q170,82 190,70" stroke="#4ade80" strokeWidth="1.5" fill="none"/>
                          {[40,80,120,160].map(x=><rect key={x} x={x-12} y={45} width={24} height={16} fill="#ec4899" opacity="0.6"/>)}
                        </>}
                        {f.preview==="quantities" && <>
                          <path d="M10,90 Q50,30 100,50 Q150,70 190,30" stroke="#4ade80" strokeWidth="2" fill="none"/>
                          <path d="M10,70 Q60,40 100,60 Q150,80 190,50" stroke="#60a5fa" strokeWidth="1.5" fill="none"/>
                          <rect x="20" y="20" width="160" height="70" fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.3"/>
                        </>}
                        {f.preview==="align" && <>
                          <path d="M10,70 L50,65 L90,45 L130,50 L170,38 L190,42" stroke="#ef4444" strokeWidth="2.5" fill="none"/>
                          <path d="M10,75 L50,70 L90,50 L130,55 L170,43 L190,47" stroke="#f97316" strokeWidth="1.5" fill="none" opacity="0.6"/>
                          {[40,80,120,160].map(x=><polygon key={x} points={`${x},${55-x*0.05} ${x-6},${65-x*0.05} ${x+6},${65-x*0.05}`} fill="#facc15"/>)}
                        </>}
                        {f.preview==="parcel" && <>
                          <polygon points="30,20 170,25 175,95 25,90" fill="none" stroke="#06b6d4" strokeWidth="2"/>
                          <polygon points="70,40 120,42 118,75 68,73" fill="none" stroke="#ec4899" strokeWidth="1.5"/>
                          <path d="M30,55 L170,58" stroke="#4ade80" strokeWidth="1.5"/>
                        </>}
                        {f.preview==="corridor" && <>
                          <path d="M10,60 Q50,45 100,55 Q150,65 190,50" stroke={f.color} strokeWidth="2.5" fill="none"/>
                          <path d="M10,65 Q50,50 100,60 Q150,70 190,55" stroke={f.color} strokeWidth="1" fill="none" opacity="0.4"/>
                        </>}
                        {f.preview==="tin" && <>
                          {[0,1,2,3,4].map(i=><path key={i} d={`M0,${20+i*20} Q100,${15+i*18} 200,${22+i*19}`} stroke="#4ade80" strokeWidth="0.8" fill="none" opacity="0.5"/>)}
                        </>}
                        <rect x="2" y="2" width="18" height="18" rx="2" fill={f.color} opacity="0.9"/>
                        <text x="11" y="14" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">C</text>
                        <circle cx="183" cy="10" r="7" fill="rgba(0,0,0,0.5)"/>
                        <text x="183" y="14" textAnchor="middle" fill="#aaa" fontSize="9">📌</text>
                      </svg>
                    </div>
                    <div className="px-3 py-2">
                      <div className="text-white text-[12px] font-semibold truncate">{f.name}</div>
                      <div className="text-gray-500 text-[10px] mt-0.5">{f.date}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <Icon name="Monitor" size={10} className="text-gray-600"/>
                        <span className="text-[9px] text-gray-600">Этот компьютер</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {tab === "autodesk" && (
            <AutodeskProjectsTab onOpen={onOpen}/>
          )}
          {tab === "learning" && (
            <LearningTab onFeedback={setShowFeedback}/>
          )}
        </div>
      </div>

      {/* Диалог создания нового чертежа */}
      {showNewDialog && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={()=>setShowNewDialog(false)}>
          <div className="bg-[#1e1e2e] border border-gray-600 rounded-lg shadow-2xl w-80 p-5"
            onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-white text-[13px] font-bold flex items-center gap-2">
                <Icon name="FilePlus" size={14} className="text-[#0078d4]"/> Новый чертёж
              </span>
              <button onClick={()=>setShowNewDialog(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <label className="text-[11px] text-gray-400 mb-1.5 block">Имя файла</label>
            <input autoFocus value={newTabName} onChange={e=>setNewTabName(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter") { onOpen(newTabName.trim() || "Новый чертёж"); setShowNewDialog(false); setNewTabName("") }}}
              placeholder="Новый чертёж"
              className="w-full bg-[#1a1a2a] border border-gray-600 rounded px-3 py-2 text-[12px] text-white outline-none focus:border-[#0078d4] mb-4"/>
            <div className="flex gap-2">
              <button
                onClick={()=>{ onOpen(newTabName.trim() || "Новый чертёж"); setShowNewDialog(false); setNewTabName("") }}
                className="flex-1 py-2 rounded text-[12px] text-white font-medium transition-colors"
                style={{background:"#0078d4"}}>
                Создать
              </button>
              <button onClick={()=>setShowNewDialog(false)}
                className="px-4 py-2 rounded text-[11px] text-gray-400 border border-gray-600 hover:text-white transition-colors">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Диалог приветствия */}
      {showWelcomeDialog && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden" style={{width:340,maxHeight:"80vh"}}>
            <div className="flex justify-end p-2">
              <button onClick={()=>setShowWelcomeDialog(false)} className="text-gray-400 hover:text-gray-700 text-lg">✕</button>
            </div>
            <div className="px-6 pb-6 text-center flex flex-col items-center">
              <div className="mb-4">
                <svg width="80" height="60" viewBox="0 0 80 60">
                  <rect x="10" y="30" width="60" height="5" rx="2" fill="#ddd"/>
                  <rect x="15" y="20" width="20" height="12" rx="2" fill="#bbb"/>
                  <circle cx="25" cy="26" r="4" fill="#999"/>
                  <rect x="45" y="15" width="25" height="8" rx="1" fill="#ccc" transform="rotate(-15 45 15)"/>
                </svg>
              </div>
              <h3 className="text-gray-800 text-[16px] font-bold mb-2">Добро пожаловать в ЛАПА!</h3>
              <p className="text-gray-600 text-[12px] mb-2">Платформа для проектирования инфраструктуры нового поколения.</p>
              <p className="text-gray-500 text-[11px] mb-5">Расскажите немного о себе — это поможет нам сделать ЛАПА ещё удобнее для вас.</p>
              <button onClick={()=>setShowWelcomeDialog(false)} className="w-full py-2 rounded text-white text-[12px] font-medium mb-3" style={{background:"#0078d4"}}>Начать работу</button>
              <button onClick={()=>setShowWelcomeDialog(false)} className="text-[11px] text-[#0078d4] hover:underline mb-1">Больше не показывать</button>
              <button onClick={()=>setShowWelcomeDialog(false)} className="text-[11px] text-[#0078d4] hover:underline">Узнать больше о ЛАПА</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Feedback / Документация диалог ── */}
      {showFeedback && (
        <FeedbackModalInner тип={showFeedback} onClose={()=>setShowFeedback(null)}/>
      )}
      <AnimatePresence>
        {scrToast && (
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#0d1a2e] border border-[#0078d4]/50 text-[#60a5fa] text-[12px] px-4 py-2 rounded-lg shadow-2xl z-[100]">
            {scrToast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Types ─────────────────────────────────────────────────────────────────

interface TreeNode {
  id: string; label: string; icon: string; color?: string
  children?: TreeNode[]; expanded?: boolean
}

interface Alignment {
  id: string; name: string; color: string
  pts: [number, number][]
}

// ─── Canvas Object types ────────────────────────────────────────────────────

type CanvasObjType = "line" | "polyline" | "point" | "text" | "alignment" | "surface" | "corridor" | "pipe" | "rect"

interface CanvasObject {
  id: string
  type: CanvasObjType
  label: string
  pts: [number, number][]
  color: string
  lineWidth?: number
  layer?: string
  selected?: boolean
  properties?: Record<string, string>
}

type EditTool = "select" | "move" | "line" | "polyline" | "point" | "text" | "rect" | "circle" | "arc" | "delete" | "pan" | "measure"

interface CorridorRow {
  alignment: string; profile: string; assembly: string
}

interface FeatureLine {
  name: string; assembly: string
}

interface CorridorDef {
  name: string; description: string; style: string
  codeStyle: string; layer: string; template: string
  targetSurface: string; rows: CorridorRow[]; features: FeatureLine[]
}

// ─── Additional dialog types ────────────────────────────────────────────────

interface SurfaceDef {
  name: string; description: string; type: "TIN" | "Grid"
  style: string; layer: string; gridX: string; gridY: string
  pointFiles: { name: string; format: string }[]
}

interface AlignmentDef {
  name: string; description: string; type: string
  startStation: string; stationIncrement: string
  style: string; layer: string
  elements: { type: "line" | "curve" | "spiral"; length: string; radius: string; Az: string; A: string }[]
}

interface ProfileDef {
  name: string; alignment: string; surface: string
  description: string; style: string; layer: string
  pvcs: { station: string; elev: string; k: string }[]
}

interface SubassemblyItem {
  id: string; name: string; side: "Левый" | "Правый" | "Обе стороны"; type: string
  params: Record<string, string>
}

interface AssemblyDef {
  name: string; description: string; style: string; layer: string
  markerStyle: string; defaultOffset: string; defaultElevAdj: string
  subassemblies: SubassemblyItem[]
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TREE: TreeNode[] = [
  {
    id: "project", label: "Align-Superelevation-5", icon: "FolderOpen", expanded: true, children: [
      { id: "points", label: "Точки", icon: "MapPin", color: "#f59e0b" },
      { id: "ptgroups", label: "Группы точек", icon: "Users", color: "#f59e0b" },
      { id: "surfaces", label: "Поверхности", icon: "Mountain", color: "#4ade80", expanded: true, children: [
        { id: "s1", label: "Существующая поверхность", icon: "Triangle", color: "#4ade80" },
        { id: "s2", label: "Проектная поверхность", icon: "Triangle", color: "#60a5fa" },
      ]},
      { id: "alignments", label: "Трассы", icon: "Route", color: "#f97316", expanded: true, children: [
        { id: "a1", label: "Трасса ШД-38", icon: "Minus", color: "#ef4444" },
        { id: "a2", label: "Ул. Трумана", icon: "Minus", color: "#a855f7" },
        { id: "a3", label: "Бордюр периметра", icon: "Minus", color: "#06b6d4" },
      ]},
      { id: "featurelines", label: "Характерные линии", icon: "Spline", color: "#ec4899" },
      { id: "sites", label: "Площадки", icon: "LayoutGrid", color: "#84cc16" },
      { id: "catchments", label: "Водосборы", icon: "Droplets", color: "#60a5fa" },
      { id: "channels", label: "Каналы", icon: "GitBranch", color: "#0ea5e9" },
      { id: "stormobj", label: "Объекты ливневой канализации", icon: "CloudRain", color: "#6366f1" },
      { id: "pipenet", label: "Трубопроводные сети", icon: "Network", color: "#6366f1" },
      { id: "pressnet", label: "Напорные трубопроводные сети", icon: "Gauge", color: "#8b5cf6" },
      { id: "bridges", label: "Мосты", icon: "Milestone", color: "#f59e0b" },
      { id: "ramps", label: "Стрелки и съезды", icon: "CornerDownRight", color: "#f59e0b" },
      { id: "corridors", label: "Коридоры", icon: "Navigation", color: "#f97316", expanded: true, children: [
        { id: "c1", label: "Дорога и парковочная зона", icon: "Minus", color: "#f97316" },
      ]},
      { id: "structures", label: "Конструкции", icon: "Building2", color: "#94a3b8" },
      { id: "structelems", label: "Элементы конструкций", icon: "Layers2", color: "#94a3b8" },
      { id: "intersections", label: "Перекрёстки", icon: "Plus", color: "#f43f5e" },
      { id: "survey", label: "Съёмка", icon: "Compass", color: "#10b981" },
      { id: "assemblies", label: "Типовые сечения", icon: "Layers", color: "#94a3b8" },
      { id: "subassemblies", label: "Подсечения", icon: "Layers2", color: "#94a3b8" },
      { id: "vfg", label: "Группы рамок вида", icon: "RectangleHorizontal", color: "#64748b" },
    ]
  },
  {
    id: "datasrc", label: "Быстрые ссылки на данные []", icon: "Database", expanded: true, children: [
      { id: "ds1", label: "Поверхности", icon: "Mountain", color: "#4ade80" },
      { id: "ds2", label: "Трассы", icon: "Route", color: "#f97316" },
      { id: "ds_wtr", label: "Водоёмы", icon: "Waves", color: "#0ea5e9" },
      { id: "ds3", label: "Трубопроводные сети", icon: "Network", color: "#6366f1" },
      { id: "ds4", label: "Напорные трубопроводные сети", icon: "Gauge", color: "#8b5cf6" },
      { id: "ds5", label: "Коридоры", icon: "Navigation", color: "#f97316" },
      { id: "ds6", label: "Группы рамок вида", icon: "RectangleHorizontal", color: "#64748b" },
    ]
  },
  {
    id: "reports", label: "Диспетчер отчётов", icon: "FileBarChart2", expanded: false, children: [
      { id: "rep_align",  label: "Трасса",             icon: "Route",          color: "#f97316" },
      { id: "rep_struct", label: "Структурная линия",  icon: "Spline",         color: "#ec4899" },
      { id: "rep_corr",   label: "Коридор",            icon: "Navigation",     color: "#f97316" },
      { id: "rep_site",   label: "Участок",            icon: "LayoutGrid",     color: "#84cc16" },
      { id: "rep_site2",  label: "Участок_ПРЧС",       icon: "LayoutGrid",     color: "#84cc16" },
      { id: "rep_pipe",   label: "Трубы",              icon: "Network",        color: "#6366f1" },
      { id: "rep_pts",    label: "Точки",              icon: "MapPin",         color: "#f59e0b" },
      { id: "rep_prof",   label: "Профиль",            icon: "TrendingUp",     color: "#60a5fa" },
      { id: "rep_proj",   label: "Проект",             icon: "FolderOpen",     color: "#94a3b8" },
      { id: "rep_surf",   label: "Поверхность",        icon: "Mountain",       color: "#4ade80" },
      { id: "rep_surv",   label: "Съёмка",             icon: "Compass",        color: "#10b981" },
      { id: "rep_sub",    label: "Subscription Extension Manager", icon: "Package", color: "#6366f1" },
    ]
  },
  {
    id: "utilities", label: "Различные утилиты", icon: "Wrench", expanded: false, children: [
      { id: "util_caice",  label: "CAiCE™ Translator",        icon: "ArrowLeftRight", color: "#0078d4" },
      { id: "util_cogo",   label: "Координатная геометрия",   icon: "Compass",        color: "#10b981" },
      { id: "util_kml",    label: "Экспорт KML",              icon: "Globe",          color: "#f59e0b" },
      { id: "util_sites",  label: "Участки",                  icon: "LayoutGrid",     color: "#84cc16" },
      { id: "util_base",   label: "Общая опорная точка",      icon: "MapPin",         color: "#f59e0b" },
      { id: "util_surf2",  label: "Поверхности",              icon: "Mountain",       color: "#4ade80" },
      { id: "util_surv2",  label: "Съёмка",                   icon: "Compass",        color: "#10b981" },
      { id: "util_ramp",   label: "Инструменты «Стрелка»",    icon: "CornerDownRight",color: "#f59e0b" },
    ]
  },
]

const ALIGNMENTS: Alignment[] = [
  { id: "sh38", name: "Трасса ШД-38", color: "#ef4444", pts: [[80,60],[160,90],[260,110],[370,95],[460,80],[540,70],[630,85],[720,100],[810,88],[880,72]] },
  { id: "truman", name: "Ул. Трумана", color: "#a855f7", pts: [[100,180],[200,190],[310,185],[420,195],[530,188],[640,200],[740,195],[840,188]] },
  { id: "perimeter", name: "Бордюр периметра", color: "#06b6d4", pts: [[180,120],[220,130],[270,160],[290,210],[280,260],[250,300],[210,320],[170,310],[140,280],[130,240],[140,190],[160,155],[180,120]] },
]

// ─── Initial editable canvas objects ─────────────────────────────────────────

const INITIAL_CANVAS_OBJECTS: CanvasObject[] = [
  { id: "al_sh38",    type: "alignment", label: "Трасса ШД-38",       color: "#ef4444", lineWidth: 2.5, layer: "C-ROAD-CNTR", pts: [[80,60],[160,90],[260,110],[370,95],[460,80],[540,70],[630,85],[720,100],[810,88],[880,72]], properties: { "Тип": "Трасса", "Длина": "850 м", "Стиль": "Базовый", "Слой": "C-ROAD-CNTR" } },
  { id: "al_truman",  type: "alignment", label: "Ул. Трумана",         color: "#a855f7", lineWidth: 2.5, layer: "C-ROAD-CNTR", pts: [[100,180],[200,190],[310,185],[420,195],[530,188],[640,200],[740,195],[840,188]], properties: { "Тип": "Трасса", "Длина": "750 м", "Стиль": "Базовый", "Слой": "C-ROAD-CNTR" } },
  { id: "al_perim",   type: "alignment", label: "Бордюр периметра",    color: "#06b6d4", lineWidth: 2,   layer: "C-PKNG-CURB", pts: [[180,120],[220,130],[270,160],[290,210],[280,260],[250,300],[210,320],[170,310],[140,280],[130,240],[140,190],[160,155],[180,120]], properties: { "Тип": "Трасса", "Длина": "640 м", "Стиль": "Базовый", "Слой": "C-PKNG-CURB" } },
  { id: "pipe_storm", type: "pipe",      label: "Ливневая канализация", color: "#6366f1", lineWidth: 2,   layer: "C-STRM-PIPE", pts: [[120,280],[180,275],[240,268],[300,260],[360,255],[420,258],[480,265]], properties: { "Тип": "Труба", "Диаметр": "500 мм", "Материал": "Железобетон", "Слой": "C-STRM-PIPE" } },
  { id: "pt_1001",   type: "point",     label: "1001",                 color: "#f59e0b", lineWidth: 1,   layer: "C-TOPO-PNTS", pts: [[95,55]],  properties: { "Тип": "Точка", "X": "95.00", "Y": "55.00", "Z": "128.45", "Слой": "C-TOPO-PNTS" } },
  { id: "pt_1002",   type: "point",     label: "1002",                 color: "#f59e0b", lineWidth: 1,   layer: "C-TOPO-PNTS", pts: [[305,108]], properties: { "Тип": "Точка", "X": "305.00", "Y": "108.00", "Z": "131.20", "Слой": "C-TOPO-PNTS" } },
  { id: "pt_1003",   type: "point",     label: "1003",                 color: "#f59e0b", lineWidth: 1,   layer: "C-TOPO-PNTS", pts: [[485,78]],  properties: { "Тип": "Точка", "X": "485.00", "Y": "78.00", "Z": "129.80", "Слой": "C-TOPO-PNTS" } },
  { id: "pt_1004",   type: "point",     label: "1004",                 color: "#f59e0b", lineWidth: 1,   layer: "C-TOPO-PNTS", pts: [[680,92]],  properties: { "Тип": "Точка", "X": "680.00", "Y": "92.00", "Z": "130.55", "Слой": "C-TOPO-PNTS" } },
  { id: "pt_1005",   type: "point",     label: "1005",                 color: "#f59e0b", lineWidth: 1,   layer: "C-TOPO-PNTS", pts: [[870,68]],  properties: { "Тип": "Точка", "X": "870.00", "Y": "68.00", "Z": "127.90", "Слой": "C-TOPO-PNTS" } },
]

const ASSEMBLIES = ["Трасса ШД-38", "Ул. Трумана", "Тротуар", "Бордюр проезжей ч. Лев.", "Бордюр проезжей ч. Пр.", "Парковочный бордюр", "Бордюр периметра", "V-образный лоток"]
const PROFILES: Record<string, string[]> = {
  "Трасса ШД-38": ["ПРОЕКТ_ШД-38", "Сущ. профиль"],
  "Ул. Трумана": ["Проект_Трумана", "Сущ. профиль"],
  "*Нет*": ["*Нет*"],
}
const SURFACES = ["<нет>", "Существующая поверхность", "Проектная поверхность"]
const STYLES = ["Базовый", "Все подписи", "Без отображения"]
const CODE_STYLES = ["Все коды", "Без отображения", "Коды дорог"]

const FEATURE_LINES: FeatureLine[] = [
  { name: "Тротуар_Периметр_01", assembly: "Тротуар" },
  { name: "Парк_Бордюр_04", assembly: "Парковочный бордюр" },
  { name: "Бордюр пр.ч. Лев. 8", assembly: "Бордюр проезжей ч. Лев." },
  { name: "Бордюр пр.ч. Лев. 7", assembly: "Бордюр проезжей ч. Лев." },
  { name: "Бордюр пр.ч. Лев. 6", assembly: "Парковочный бордюр" },
  { name: "Бордюр пр.ч. Пр. 4", assembly: "Бордюр периметра" },
  { name: "Бордюр пр.ч. Пр. 3", assembly: "Бордюр проезжей ч. Пр." },
  { name: "Бордюр пр.ч. Пр. 2", assembly: "Бордюр проезжей ч. Пр." },
]

const MENU_ITEMS = ["Главная","Вставка","Аннотации","Редактирование","Анализ","Вид","Управление","Вывод","Съёмка","Железная дорога","Прозрачность","InfraWorks","Совместная работа","Справка","Надстройки","Express Tools","Отслеживание транспорта","Избранные приложения","Геопозиционирование","Геолокация"]

// size: "lg" = большая кнопка с иконкой сверху, "sm" = маленькая кнопка строчкой
interface RibbonItem { label: string; icon: string; size: "lg" | "sm"; drop?: string }
interface RibbonGroup { label: string; items: RibbonItem[] }

const TOOLBAR_BY_MENU: Record<string, RibbonGroup[]> = {
  "Главная": [
    { label: "Палитры", items: [
      { label: "Пространство инструментов", icon: "PanelLeft", size: "lg", drop: "Пространство инструментов ▾" },
      { label: "Диспетчер проекта", icon: "FolderOpen", size: "sm" },
      { label: "Оптимизация", icon: "Sliders", size: "sm" },
    ]},
    { label: "Вертикальная планировка", items: [
      { label: "Оптимизация планировки", icon: "Mountain", size: "lg" },
    ]},
    { label: "Создать топооснову", items: [
      { label: "Точки", icon: "MapPin", size: "lg", drop: "Точки ▾" },
      { label: "Поверхности", icon: "Triangle", size: "lg", drop: "Поверхности ▾" },
      { label: "Хар. линия", icon: "Spline", size: "sm", drop: "Характерная линия ▾" },
      { label: "Теодолит. ход", icon: "Navigation", size: "sm", drop: "Теодолитный ход ▾" },
    ]},
    { label: "Создать проект", items: [
      { label: "Трасса", icon: "Route", size: "lg", drop: "Трасса ▾" },
      { label: "Пересечения", icon: "GitMerge", size: "sm", drop: "Пересечения ▾" },
      { label: "Профиль", icon: "TrendingUp", size: "sm", drop: "Профиль ▾" },
      { label: "Тип. сечение", icon: "Layers", size: "sm", drop: "Типовое сечение ▾" },
      { label: "Коридор", icon: "RectangleHorizontal", size: "lg", drop: "Коридор ▾" },
      { label: "Труб. сеть", icon: "Network", size: "sm", drop: "Трубопроводная сеть ▾" },
    ]},
    { label: "Профиль и поперечники", items: [
      { label: "Вид профиля", icon: "BarChart2", size: "lg", drop: "Вид профиля ▾" },
      { label: "Виды попереч.", icon: "AlignJustify", size: "sm", drop: "Виды поперечников ▾" },
      { label: "Линии образцов", icon: "Minus", size: "sm" },
      { label: "Поперечный уклон", icon: "TrendingDown", size: "sm" },
    ]},
    { label: "Черчение", items: [
      { label: "Черчение", icon: "Pen", size: "lg", drop: "Черчение ▾" },
    ]},
    { label: "Редактирование", items: [
      { label: "Перенести", icon: "Move", size: "sm" },
      { label: "Копировать", icon: "Copy", size: "sm", drop: "Копировать ▾" },
      { label: "Повернуть", icon: "RotateCw", size: "sm" },
      { label: "Зеркало", icon: "FlipHorizontal", size: "sm" },
      { label: "Обрезать", icon: "Scissors", size: "sm", drop: "Обрезать ▾" },
      { label: "Растянуть", icon: "Maximize2", size: "sm" },
      { label: "Масштаб", icon: "ZoomIn", size: "sm" },
      { label: "Массив", icon: "LayoutGrid", size: "sm", drop: "Массив ▾" },
      { label: "Сопряжение", icon: "CircleDot", size: "sm" },
    ]},
    { label: "Слои", items: [
      { label: "Слои", icon: "Layers2", size: "lg", drop: "Слои ▾" },
      { label: "Сделать текущим", icon: "Check", size: "sm" },
      { label: "Совместить слои", icon: "Merge", size: "sm" },
    ]},
    { label: "Буфер обмена", items: [
      { label: "Вставить", icon: "ClipboardPaste", size: "lg", drop: "Вставить ▾" },
    ]},
  ],
  "Вставка": [
    { label: "Импорт", items: [
      { label: "Land Desktop", icon: "Monitor", size: "lg" },
      { label: "LandXML", icon: "FileCode", size: "sm" },
      { label: "Импорт данных съёмки", icon: "ScanLine", size: "sm" },
      { label: "Точки из файла", icon: "MapPin", size: "sm", drop: "Точки из файла ▾" },
    ]},
    { label: "База данных", items: [
      { label: "Открыть данные", icon: "Database", size: "lg" },
      { label: "Экспорт данных", icon: "Upload", size: "sm" },
      { label: "Редактировать", icon: "Edit", size: "sm" },
    ]},
    { label: "Теодолитный ход", items: [
      { label: "Редактировать", icon: "GitBranch", size: "lg" },
      { label: "Отчёт о невязке", icon: "FileText", size: "sm" },
      { label: "Уравнивание", icon: "Scale", size: "sm" },
    ]},
    { label: "InfraWorks", items: [
      { label: "Открытие модели InfraWorks", icon: "Boxes", size: "lg", drop: "InfraWorks ▾" },
      { label: "Autodesk Connector for ArcGIS", icon: "Globe", size: "sm" },
      { label: "Диспетчер источников данных", icon: "Database", size: "sm" },
    ]},
    { label: "Блок", items: [
      { label: "Вставить", icon: "Package", size: "lg", drop: "Вставить ▾" },
      { label: "Присоединить", icon: "Paperclip", size: "sm" },
      { label: "Подрезать", icon: "Scissors", size: "sm" },
      { label: "Регулировать", icon: "SlidersHorizontal", size: "sm" },
    ]},
    { label: "Облако точек", items: [
      { label: "Облако точек", icon: "Cloud", size: "lg" },
    ]},
    { label: "Данные", items: [
      { label: "Поле", icon: "Tag", size: "lg" },
      { label: "Связь с данными", icon: "Link", size: "sm" },
      { label: "Связывание и извлечение", icon: "FileSearch", size: "sm" },
    ]},
    { label: "Местоположение", items: [
      { label: "Установить местоположение", icon: "MapPin", size: "lg", drop: "Местоположение ▾" },
    ]},
    { label: "Точка соединения", items: [
      { label: "Вставить", icon: "PackagePlus", size: "lg" },
      { label: "Правка", icon: "Edit2", size: "sm" },
    ]},
  ],
  "Аннотации": [
    { label: "Текст", items: [
      { label: "Многострочный", icon: "Type", size: "lg", drop: "Многострочный ▾" },
      { label: "Однострочный", icon: "Minus", size: "sm" },
      { label: "Редактировать", icon: "Pencil", size: "sm" },
    ]},
    { label: "Размеры", items: [
      { label: "Линейный", icon: "Ruler", size: "lg", drop: "Линейный ▾" },
      { label: "Угловой", icon: "Combine", size: "sm" },
      { label: "Радиус", icon: "Circle", size: "sm" },
      { label: "Выноска", icon: "MessageSquare", size: "sm", drop: "Выноска ▾" },
    ]},
    { label: "Марки", items: [
      { label: "Добавить марки", icon: "Tag", size: "lg", drop: "Добавить марки ▾" },
      { label: "Стиль марки", icon: "Tags", size: "sm" },
      { label: "Таблица", icon: "Table", size: "sm", drop: "Таблица ▾" },
    ]},
  ],
  "Редактирование": [
    { label: "Данные рельефа", items: [
      { label: "Точки", icon: "MapPin", size: "lg", drop: "Точки ▾" },
      { label: "Поверхность", icon: "Mountain", size: "sm", drop: "Поверхность ▾" },
      { label: "Запрос съёмки", icon: "Search", size: "sm" },
      { label: "Данные рельефа", icon: "ScanLine", size: "sm" },
    ]},
    { label: "Проектные данные", items: [
      { label: "Трасса", icon: "Route", size: "lg", drop: "Трасса ▾" },
      { label: "Характерная линия", icon: "Spline", size: "sm", drop: "Хар. линия ▾" },
      { label: "Профиль", icon: "TrendingUp", size: "sm", drop: "Профиль ▾" },
      { label: "Перекрёсток", icon: "Plus", size: "sm", drop: "Перекрёсток ▾" },
      { label: "Конструкция", icon: "Building2", size: "sm", drop: "Конструкция ▾" },
      { label: "Объект профилирования", icon: "Layers2", size: "sm", drop: "Объект профил. ▾" },
      { label: "Коридор", icon: "Navigation", size: "sm", drop: "Коридор ▾" },
      { label: "Трубопроводная сеть", icon: "Network", size: "sm", drop: "Труб. сеть ▾" },
    ]},
    { label: "Виды профилей и сечений", items: [
      { label: "Вид профиля", icon: "TrendingUp", size: "lg", drop: "Вид профиля ▾" },
      { label: "Ось сечения", icon: "Minus", size: "sm" },
      { label: "Вид сечения", icon: "BarChart2", size: "sm", drop: "Вид сечения ▾" },
    ]},
    { label: "Редактировать геометрию", items: [
      { label: "Вставить ТП", icon: "MapPin", size: "sm" },
      { label: "Удалить ТП", icon: "X", size: "sm" },
    ]},
    { label: "Редактировать отметки", items: [
      { label: "Редактор отметок", icon: "Edit2", size: "lg" },
      { label: "Вставить т. с отметкой", icon: "PlusSquare", size: "sm" },
      { label: "Удалить т. с отметкой", icon: "MinusSquare", size: "sm" },
    ]},
    { label: "Изменить", items: [
      { label: "Перенести", icon: "Move", size: "lg" },
      { label: "Копировать", icon: "Copy", size: "sm", drop: "Копировать ▾" },
      { label: "Повернуть", icon: "RotateCw", size: "sm" },
      { label: "Зеркало", icon: "FlipHorizontal", size: "sm" },
      { label: "Масштаб", icon: "ZoomIn", size: "sm" },
    ]},
    { label: "Изменить размер", items: [
      { label: "Обрезать", icon: "Scissors", size: "lg", drop: "Обрезать ▾" },
      { label: "Растянуть", icon: "Maximize2", size: "sm" },
      { label: "Разбить", icon: "Split", size: "sm" },
      { label: "Соединить", icon: "Link", size: "sm" },
    ]},
    { label: "Массив", items: [
      { label: "Прямоугольный", icon: "LayoutGrid", size: "lg", drop: "Прямоугольный ▾" },
      { label: "Круговой", icon: "RefreshCw", size: "sm", drop: "Круговой ▾" },
      { label: "По траектории", icon: "GitBranch", size: "sm", drop: "По траектории ▾" },
    ]},
    { label: "3D", items: [
      { label: "3D-перенос", icon: "Box", size: "sm" },
      { label: "3D-поворот", icon: "RefreshCcw", size: "sm" },
      { label: "3D-зеркало", icon: "Layers", size: "sm" },
    ]},
  ],
  "Анализ": [
    { label: "Данные рельефа", items: [
      { label: "Съёмка", icon: "Compass", size: "lg" },
      { label: "Быстрый профиль", icon: "TrendingUp", size: "sm" },
      { label: "Данные рельефа", icon: "ScanLine", size: "sm" },
    ]},
    { label: "Проектные данные", items: [
      { label: "Проверка видимости", icon: "Eye", size: "lg" },
      { label: "Проезд", icon: "Car", size: "sm", fallback: "Route" },
      { label: "Проверка взаимодействий", icon: "GitMerge", size: "sm" },
      { label: "Анализ дренажной системы", icon: "Droplets", size: "sm" },
    ]},
    { label: "Объёмы и материалы", items: [
      { label: "Пульт управления объёмами", icon: "BarChart3", size: "lg" },
      { label: "Инструменты профилирования по объёмам", icon: "BarChart2", size: "sm" },
    ]},
    { label: "Объём работ", items: [
      { label: "Диспетчер объёмов работ", icon: "ClipboardList", size: "lg" },
      { label: "Объём работ", icon: "FileSpreadsheet", size: "sm" },
      { label: "Запрос", icon: "Search", size: "lg" },
    ]},
    { label: "Планировка", items: [
      { label: "Планировка...", icon: "Layers2", size: "lg" },
    ]},
    { label: "Поверхности", items: [
      { label: "Анализ уклонов", icon: "TrendingUp", size: "sm", drop: "Анализ уклонов ▾" },
      { label: "Анализ высот", icon: "BarChart2", size: "sm" },
      { label: "Водосборы", icon: "Droplets", size: "sm" },
    ]},
    { label: "Отчёты", items: [
      { label: "Объёмы", icon: "Database", size: "sm", drop: "Объёмы ▾" },
      { label: "Ведомость", icon: "FileSpreadsheet", size: "sm" },
      { label: "Гидравлика", icon: "Gauge", size: "sm" },
    ]},
  ],
  "Вид": [
    { label: "Виды", items: [
      { label: "Сверху", icon: "Square", size: "lg" },
      { label: "Изометрия ЮЗ", icon: "Box", size: "sm", drop: "Изометрия ЮЗ ▾" },
      { label: "Пользовательский", icon: "Monitor", size: "sm", drop: "Пользовательский ▾" },
    ]},
    { label: "Визуальный стиль", items: [
      { label: "2D Каркас", icon: "Grid", size: "sm" },
      { label: "Тонирование", icon: "Sun", size: "sm" },
      { label: "Реалистичный", icon: "Image", size: "sm" },
    ]},
    { label: "Видовые экраны", items: [
      { label: "1 экран", icon: "Square", size: "sm" },
      { label: "2 экрана", icon: "Columns2", size: "sm", drop: "2 видовых экрана ▾" },
      { label: "4 экрана", icon: "LayoutGrid", size: "sm" },
    ]},
    { label: "Навигация", items: [
      { label: "Орбита", icon: "RefreshCw", size: "sm", drop: "Орбита ▾" },
      { label: "Панорама", icon: "Hand", size: "sm" },
      { label: "Зум", icon: "ZoomIn", size: "sm", drop: "Зум ▾" },
    ]},
    { label: "Палитры", items: [
      { label: "Свойства", icon: "Info", size: "sm" },
      { label: "Слои", icon: "Layers", size: "sm" },
      { label: "П. инструментов", icon: "PanelLeft", size: "sm" },
    ]},
  ],
  "Управление": [
    { label: "Быстрые ссылки", items: [
      { label: "Создать быстрые ссылки", icon: "BookMarked", size: "lg" },
      { label: "Изменить", icon: "Edit2", size: "sm" },
      { label: "Удалить", icon: "Trash2", size: "sm" },
    ]},
    { label: "Рекордер операций", items: [
      { label: "Запись", icon: "Circle", size: "lg" },
      { label: "Воспроизведение", icon: "Play", size: "sm" },
      { label: "Редактировать", icon: "Edit", size: "sm" },
    ]},
    { label: "Адаптация", items: [
      { label: "Пользовательский интерфейс", icon: "Layout", size: "lg" },
      { label: "Инструментальные палитры", icon: "PanelLeft", size: "lg" },
      { label: "CUI", icon: "Code", size: "sm" },
    ]},
    { label: "Приложения", items: [
      { label: "Прилож.", icon: "AppWindow", size: "lg", drop: "Приложения ▾", fallback: "Monitor" },
      { label: "Станд.", icon: "BookCheck", size: "lg", drop: "Стандарты ▾", fallback: "BookOpen" },
      { label: "Стили", icon: "Palette", size: "lg", drop: "Стили ▾" },
      { label: "Данные.", icon: "Database", size: "lg", drop: "Данные ▾" },
    ]},
    { label: "Очистка", items: [
      { label: "Очистка", icon: "Trash", size: "lg", drop: "Очистка ▾", fallback: "Trash2" },
    ]},
    { label: "Производительность", items: [
      { label: "Произв.", icon: "Zap", size: "lg", drop: "Производительность ▾", fallback: "Gauge" },
      { label: "Визуал.", icon: "Eye", size: "lg", drop: "Визуальные стили ▾" },
    ]},
    { label: "Параметры", items: [
      { label: "Параметры чертежа", icon: "Settings", size: "sm" },
      { label: "Единицы и зона", icon: "Globe", size: "sm" },
      { label: "Диспетчер стилей", icon: "Paintbrush", size: "sm" },
    ]},
  ],
  "Вывод": [
    { label: "Печать", items: [
      { label: "Печать", icon: "Printer", size: "lg", drop: "Печать ▾" },
      { label: "Пакетная печать", icon: "PrinterCheck", size: "sm" },
      { label: "Просмотр", icon: "Eye", size: "sm" },
    ]},
    { label: "Экспорт", items: [
      { label: "PDF", icon: "FileDown", size: "lg", drop: "PDF ▾" },
      { label: "DWF", icon: "File", size: "sm", drop: "DWF ▾" },
      { label: "LandXML", icon: "FileCode", size: "sm" },
      { label: "IFC", icon: "FileJson", size: "sm" },
    ]},
    { label: "Публикация", items: [
      { label: "Облачное хранилище", icon: "Cloud", size: "lg" },
      { label: "Комплекты листов", icon: "BookOpen", size: "sm", drop: "Комплекты листов ▾" },
    ]},
    { label: "Отправить в", items: [
      { label: "InfraWorks", icon: "Building2", size: "sm" },
      { label: "Navisworks", icon: "Cube", size: "sm" },
      { label: "Revit", icon: "Home", size: "sm" },
    ]},
  ],
  "Съёмка": [
    { label: "Точки", items: [
      { label: "Создать точки", icon: "MapPin", size: "lg", drop: "Создать точки ▾" },
      { label: "Группы точек", icon: "Group", size: "sm", drop: "Группы точек ▾" },
      { label: "Импорт точек", icon: "Import", size: "sm" },
      { label: "Редактировать точки", icon: "Edit", size: "sm" },
    ]},
    { label: "База данных", items: [
      { label: "Открыть БД", icon: "Database", size: "lg", drop: "Открыть БД ▾" },
      { label: "Импорт данных", icon: "Download", size: "sm" },
      { label: "Экспорт данных", icon: "Upload", size: "sm" },
    ]},
    { label: "Теодолитный ход", items: [
      { label: "Редактор хода", icon: "Navigation", size: "lg" },
      { label: "Отчёт о невязке", icon: "FileText", size: "sm" },
      { label: "Уравнивание", icon: "BarChart", size: "sm" },
    ]},
    { label: "Поверхности", items: [
      { label: "TIN-поверхность", icon: "Triangle", size: "lg", drop: "TIN-поверхность ▾" },
      { label: "Grid-поверхность", icon: "Grid", size: "sm", drop: "Grid-поверхность ▾" },
    ]},
  ],
  "Железная дорога": [
    { label: "Трасса", items: [
      { label: "Трасса ж/д", icon: "Train", size: "lg", drop: "Трасса ж/д ▾" },
      { label: "Кант", icon: "ArrowUpDown", size: "sm", drop: "Кант ▾" },
      { label: "Расположение", icon: "Map", size: "sm" },
    ]},
    { label: "Проект", items: [
      { label: "Проект пути", icon: "RailSymbol", size: "lg", drop: "Проект пути ▾" },
      { label: "Разъезды", icon: "GitFork", size: "sm", drop: "Разъезды и пересечения ▾" },
      { label: "Мосты", icon: "Milestone", size: "sm", drop: "Мосты ▾" },
    ]},
    { label: "Профиль", items: [
      { label: "Профиль ж/д", icon: "TrendingUp", size: "lg", drop: "Профиль ж/д ▾" },
      { label: "Точки уклонов", icon: "Dot", size: "sm" },
    ]},
  ],
  "Прозрачность": [
    { label: "Точка", items: [
      { label: "Номер точки", icon: "Hash", size: "sm" },
      { label: "Имя точки", icon: "Tag", size: "sm" },
      { label: "Объект точки", icon: "MapPin", size: "sm", drop: "Объект точки ▾" },
    ]},
    { label: "Пикет/Смещение", items: [
      { label: "Пикет и смещение", icon: "Milestone", size: "lg", drop: "Пикет и смещение ▾" },
      { label: "Пикет профиля", icon: "TrendingUp", size: "sm" },
    ]},
    { label: "Уклон", items: [
      { label: "Уклон и расстояние", icon: "TrendingDown", size: "sm" },
      { label: "Уклон от точки", icon: "ArrowUpRight", size: "sm" },
      { label: "Дирекционный угол", icon: "Compass", size: "sm" },
    ]},
  ],
  "InfraWorks": [
    { label: "Обмен данными", items: [
      { label: "Отправить в InfraWorks", icon: "Send", size: "lg" },
      { label: "Синхронизировать", icon: "RefreshCw", size: "sm" },
      { label: "Обновить модель", icon: "Download", size: "sm" },
    ]},
    { label: "Проект", items: [
      { label: "Открыть в InfraWorks", icon: "ExternalLink", size: "lg" },
      { label: "Сравнить варианты", icon: "GitCompare", size: "sm" },
    ]},
  ],
  "Совместная работа": [
    { label: "ЛАПА Облако", items: [
      { label: "Открыть из облака", icon: "CloudDownload", size: "lg" },
      { label: "Сохранить в облако", icon: "CloudUpload", size: "sm" },
      { label: "Поделиться", icon: "Share2", size: "sm" },
    ]},
    { label: "Совм. редактирование", items: [
      { label: "Включить совм. режим", icon: "Users", size: "lg" },
      { label: "Зафиксировать", icon: "Lock", size: "sm" },
      { label: "Снять фиксацию", icon: "Unlock", size: "sm" },
    ]},
    { label: "Ярлыки данных", items: [
      { label: "Создать ярлык", icon: "Link", size: "lg", drop: "Создать ярлык ▾" },
      { label: "Изменить ярлык", icon: "Edit", size: "sm" },
      { label: "Рабочая папка", icon: "Folder", size: "sm" },
    ]},
  ],
  "Надстройки": [
    { label: "Отслеживание транспорта", items: [
      { label: "Добавить транспорт", icon: "Car", size: "lg", drop: "Добавить транспорт ▾" },
      { label: "Симуляция", icon: "Play", size: "sm" },
      { label: "Траектория", icon: "Route", size: "sm" },
    ]},
    { label: "Расширения", items: [
      { label: "Управление", icon: "Package", size: "lg", drop: "Управление расширениями ▾" },
      { label: "Менеджер приложений", icon: "AppWindow", size: "sm" },
    ]},
  ],
  "Express Tools": [
    { label: "Блоки", items: [
      { label: "Супер штриховка", icon: "PaintBucket", size: "lg" },
      { label: "Конверт. текст", icon: "Type", size: "sm" },
      { label: "Блок", icon: "Package", size: "sm", drop: "Блок ▾" },
    ]},
    { label: "Текст", items: [
      { label: "Текст по дуге", icon: "RefreshCw", size: "sm" },
      { label: "Выравнивание", icon: "AlignLeft", size: "sm", drop: "Выравнивание текста ▾" },
    ]},
    { label: "Слои", items: [
      { label: "Перебор слоёв", icon: "List", size: "sm" },
      { label: "Заморозить", icon: "Snowflake", size: "sm" },
      { label: "Изолировать", icon: "Focus", size: "sm", drop: "Изолировать слой ▾" },
    ]},
  ],
  "Отслеживание транспорта": [
    { label: "Маршруты", items: [
      { label: "Добавить маршрут", icon: "Route", size: "lg", drop: "Добавить маршрут ▾" },
      { label: "Редактировать", icon: "Edit", size: "sm" },
      { label: "Удалить маршрут", icon: "Trash2", size: "sm" },
    ]},
    { label: "ТС", items: [
      { label: "Библиотека ТС", icon: "Car", size: "lg", drop: "Библиотека ТС ▾" },
      { label: "Польз. ТС", icon: "Truck", size: "sm" },
    ]},
    { label: "Симуляция", items: [
      { label: "Запустить", icon: "Play", size: "lg" },
      { label: "Анимация", icon: "Film", size: "sm" },
    ]},
  ],
  "Избранные приложения": [
    { label: "Приложения", items: [
      { label: "Raster Design", icon: "Image", size: "sm" },
      { label: "Point Layout", icon: "MapPin", size: "sm" },
      { label: "CAiCE Tools", icon: "Wrench", size: "sm" },
    ]},
    { label: "Сервис", items: [
      { label: "Сравнение DWG", icon: "GitCompare", size: "sm" },
      { label: "Очистить", icon: "Trash2", size: "sm", drop: "Очистить ▾" },
      { label: "Проверка", icon: "CheckCircle", size: "sm" },
    ]},
  ],
  "Геолокация": [
    { label: "Онлайн-карты", items: [
      { label: "Карта вкл.", icon: "Map", size: "lg" },
      { label: "Тип карты", icon: "MapPin", size: "sm", drop: "Тип карты ▾" },
      { label: "Захват области", icon: "Crop", size: "sm" },
    ]},
    { label: "Местоположение", items: [
      { label: "Задать местоположение", icon: "LocateFixed", size: "lg", drop: "Задать местоположение ▾" },
      { label: "Изменить местополож.", icon: "MapPinned", size: "sm" },
    ]},
    { label: "Координаты", items: [
      { label: "Переопубликовать", icon: "Upload", size: "sm", drop: "Переопубликовать ▾" },
      { label: "Обновить координаты", icon: "RefreshCw", size: "sm" },
      { label: "Экспорт KML", icon: "FileDown", size: "sm" },
    ]},
  ],
  "Геопозиционирование": [
    { label: "Координаты", items: [
      { label: "Пространство модели", icon: "Box", size: "lg" },
      { label: "Сетка", icon: "Grid3X3", size: "sm" },
      { label: "Режим привязки", icon: "Magnet", size: "sm" },
    ]},
    { label: "Привязки", items: [
      { label: "Подразум. зависимости", icon: "GitMerge", size: "sm" },
      { label: "Динамический ввод", icon: "Type", size: "sm" },
      { label: "Режим «Орто»", icon: "Minus", size: "sm" },
      { label: "Полярное отслеж.", icon: "Crosshair", size: "sm" },
      { label: "Изометр. проектиров.", icon: "Box", size: "sm" },
      { label: "Отслеж. привязки", icon: "Target", size: "sm" },
      { label: "Объектная привязка 2D", icon: "Circle", size: "sm" },
    ]},
    { label: "Режимы", items: [
      { label: "Толщина линий", icon: "Minus", size: "sm" },
      { label: "Прозрачность", icon: "Eye", size: "sm" },
      { label: "Циклический выбор", icon: "RefreshCw", size: "sm" },
      { label: "Объектная привязка 3D", icon: "Layers", size: "sm" },
      { label: "Динамическая ПСК", icon: "Compass", size: "sm" },
      { label: "Фильтрация выбора", icon: "Filter", size: "sm" },
    ]},
    { label: "Аннотации", items: [
      { label: "Видимость аннотаций", icon: "Eye", size: "sm" },
      { label: "Автомасштаб", icon: "ZoomIn", size: "sm" },
      { label: "Масштаб аннотаций", icon: "ZoomIn", size: "sm" },
    ]},
    { label: "Рабочее простр.", items: [
      { label: "Переключение РП", icon: "Layout", size: "sm" },
      { label: "Монитор аннотаций", icon: "Monitor", size: "sm" },
      { label: "Единицы", icon: "Ruler", size: "sm" },
      { label: "Быстрые свойства", icon: "Info", size: "sm" },
      { label: "Блокировка интерфейса", icon: "Lock", size: "sm" },
      { label: "Изолировать объекты", icon: "EyeOff", size: "sm" },
    ]},
  ],
}

const TOOLBAR_GROUPS = TOOLBAR_BY_MENU["Главная"]

const DROPDOWN_ITEMS: Record<string, string[]> = {
  // Главная
  "Пространство инструментов ▾": ["Диспетчер","Параметры","Геодезия","Инструменты"],
  "Свойства ▾": ["Свойства объекта","Быстрые свойства","Циклический выбор"],
  "Точки ▾": ["Создать точки — вручную","Создать точки — интерполяция","Создать точки — по трассе","Создать точки — по поверхности","Импорт точек","Группы точек","Редактировать точки"],
  "Поверхности ▾": ["Создать поверхность (TIN)","Создать поверхность (Grid)","Из точек","Из горизонталей","Редактировать поверхность","Свойства поверхности","Экспорт поверхности"],
  "Характерная линия ▾": ["Создать характерную линию","Из объектов","Редактировать отметки","Сопряжение","Свойства хар. линии"],
  "Теодолитный ход ▾": ["Редактор хода","Отчёт о невязке","Импорт хода"],
  "Трасса ▾": ["Создать трассу — компоновка","Из объектов","Из полилинии","Редактировать геометрию","Свойства трассы","Редактор критериев проектирования"],
  "Пересечения ▾": ["Создать пересечение","Редактировать пересечение","Мастер пересечения"],
  "Профиль ▾": ["Профиль из поверхности","Создать профиль — компоновка","Редактировать геометрию профиля","Свойства профиля","Наложить профиль"],
  "Типовое сечение ▾": ["Создать типовое сечение","Редактировать","Свойства","Импорт типового сечения"],
  "Коридор ▾": ["Создать коридор","Редактировать коридор","Свойства коридора","Целевые объекты","Перестроить коридор"],
  "Трубопроводная сеть ▾": ["Создать сеть","Редактировать сеть","Свойства сети","Производство планов"],
  "Вид профиля ▾": ["Создать вид профиля","Создать несколько видов","Редактировать стиль","Совмещённые виды"],
  "Виды поперечников ▾": ["Создать вид поперечника","Создать несколько видов","Редактировать стиль","Набор полос"],
  "Черчение ▾": ["Полилиния","Отрезок","Дуга","Окружность","Прямоугольник","Сплайн","Штриховка","Текст"],
  "Копировать ▾": ["Копировать","С базовой точкой","Копировать в буфер"],
  "Обрезать ▾": ["Обрезать","Удлинить","Разбить в точке","Разбить"],
  "Массив ▾": ["Прямоугольный массив","Круговой массив","Массив по траектории"],
  "Слои": ["Диспетчер слоёв"],
  "Слои ▾": ["Диспетчер слоёв","Создать слой","Заморозить","Изолировать слой","Совместить слои"],
  "Вставить ▾": ["Вставить","Вставить как блок","Вставить на исходные координаты"],
  // Вставка
  "Присоединить ▾": ["Присоединить DWG","Вставить изображение","Вставить PDF","Вставить облако точек"],
  "Импорт ▾": ["LandXML","IFC","Shapefile","DEM/GeoTIFF","Облако точек (RCP/RCS)","Данные съёмки"],
  "Назначить ▾": ["Назначить систему координат","Из карты","Ввести вручную"],
  // Аннотации
  "Многострочный ▾": ["Создать мтекст","Редактировать стиль","Поле"],
  "Линейный ▾": ["Линейный","Параллельный","От базы","Цепочечный"],
  "Выноска ▾": ["Мультивыноска","Быстрая выноска","Допуск формы"],
  "Стиль текста ▾": ["Новый стиль","Изменить","Импорт из чертежа"],
  "Стиль размеров ▾": ["Новый стиль","Изменить","Переопределить","Сравнить"],
  "Таблица ▾": ["Вставить таблицу","Из связанных данных","Экспорт в CSV"],
  "Добавить марки ▾": ["Марки трасс","Марки профилей","Марки поперечников","Марки участков","Марки поверхностей","Марки трубопроводов"],
  "Редактировать марку ▾": ["Перевернуть марку","Перенести марку","Сбросить марку","Удалить переопределение"],
  // Редактирование
  "Прямоугольный ▾": ["Прямоугольный массив","Массив по траектории","Круговой массив"],
  "Круговой ▾": ["Круговой массив","Массив по траектории"],
  "По траектории ▾": ["Массив по траектории","Редактировать массив"],
  // Анализ
  "Анализ уклонов ▾": ["Анализ уклонов","Анализ стрелок уклонов","Пользовательские горизонтали"],
  "Анализ высот ▾": ["Анализ высот","Водосборы","Пользовательские горизонтали"],
  "Водосборы ▾": ["Анализ водосборов","Площадь водосбора","Путь стока"],
  "Разрезы ▾": ["Линии образцов","Виды поперечников","Свойства поперечника"],
  "Объёмы ▾": ["Объёмы по коридору","Между поверхностями","Ведомость объёмов","Ведомость земляных работ"],
  "Ведомость объёмов ▾": ["Диспетчер ВО","Вычислить материалы","Единичные расценки","Экспорт"],
  "Гидравлика ▾": ["Запустить гидравлический расчёт","Подбор труб","Отчёт по ливневой канализации"],
  "Инспекция ▾": ["Проверить сеть","Найти нарушения","Отчёт по сети"],
  "Генерировать отчёт ▾": ["Сводный отчёт","Отчёт по поверхности","Отчёт по коридору","Отчёт по сети","Отчёт по трассе"],
  // Вид
  "Пользовательский ▾": ["Сохранить вид","Восстановить вид","Диспетчер видов"],
  "2 видовых экрана ▾": ["Горизонтально","Вертикально"],
  "Орбита ▾": ["Свободная орбита","Ограниченная орбита","Непрерывная орбита"],
  "Зум ▾": ["Вписать всё","Окном","Масштаб","Центр","Предыдущий"],
  "Изометрия ЮЗ ▾": ["ЮЗ изометрия","ЮВ изометрия","СВ изометрия","СЗ изометрия","Сверху","Спереди","Справа"],
  // Управление
  "Диспетчер стилей марок ▾": ["Трассы","Профили","Коридоры","Трубопроводы","Сооружения","Поверхности"],
  // Вывод
  "Печать ▾": ["Печать","Быстрая печать","Пакетная печать"],
  "DWF ▾": ["Публикация в DWF","Публикация в 3D DWF"],
  "PDF ▾": ["Текущий лист","Все листы","Выбранные листы","PDF высокого качества"],
  "Комплекты листов ▾": ["Открыть комплект","Новый комплект","Опубликовать комплект"],
  // Геодезия
  "Создать точки ▾": ["Вручную","По координатам","Из файла CSV","По трассе","По поверхности","По геометрии","Интерполяция"],
  "Группы точек ▾": ["Создать группу точек","Редактировать группу","Удалить группу","Свойства"],
  "Открыть БД ▾": ["Новая база данных съёмки","Открыть существующую","Импорт данных съёмки","Экспорт данных съёмки"],
  "TIN-поверхность ▾": ["Из точек","Из фигур","Из горизонталей","Из файла DEM","Редактировать TIN"],
  "Grid-поверхность ▾": ["Из файла","Из TIN-поверхности","Параметры сетки"],
  // Ж/д путь
  "Трасса ж/д ▾": ["Создать трассу ж/д","Из полилинии","Редактировать трассу ж/д"],
  "Кант ▾": ["Создать кант","Редактировать кант","Свойства канта"],
  "Проект пути ▾": ["Расположение пути","Профиль ж/д","Проект канта"],
  "Разъезды и пересечения ▾": ["Создать разъезд","Создать пересечение","Редактировать"],
  "Мосты ▾": ["Создать мост","Редактировать мост","Свойства моста"],
  "Профиль ж/д ▾": ["Создать профиль ж/д","Редактировать профиль","Свойства профиля"],
  "Поперечник ж/д ▾": ["Создать поперечник","Редактировать","Виды поперечников"],
  // Прозрачность
  "Объект точки ▾": ["Номер точки","Имя точки","Объект точки"],
  "Пикет и смещение ▾": ["Пикет и смещение","Пикет профиля и отметка","Смещение поперечника и отметка"],
  // Надстройки / Express
  "Библиотека ТС ▾": ["Легковой автомобиль","Грузовик (фура)","Автобус","Пожарная машина","Пользовательский"],
  "Блок ▾": ["Список блоков","Супер штриховка","Конвертировать текст в блок","Разбить блок"],
  "Выравнивание текста ▾": ["По левому краю","По центру","По правому краю","Вписать","Выровнять"],
  "Сплющить ▾": ["Сплющить","На отметку","Конвертировать в полилинию"],
  "Изолировать слой ▾": ["Изолировать слой","Снять изоляцию","Перебор слоёв"],
  "Добавить транспорт ▾": ["Добавить транспорт","Изменить транспорт","Удалить транспорт"],
  "Управление расширениями ▾": ["Установленные расширения","Найти расширения","Обновить"],
  // Геолокация
  "Тип карты ▾": ["Спутник","Схема","Гибрид","Рельеф"],
  "Задать местоположение ▾": ["С карты","По ГНСС","Ввести вручную"],
  "Переопубликовать ▾": ["Переопубликовать DWG","Переопубликовать PDF"],
  // Совместная работа
  "Создать ярлык ▾": ["Поверхности","Трассы","Трубопроводные сети","Коридоры","Группы видовых рамок"],
  // Очистить (Express)
  "Очистить ▾": ["Очистить всё","Блоки","Слои","Стили текста","Стили размеров"],
}

// ─── Canvas drawing ──────────────────────────────────────────────────────────

function drawCanvas(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  visLayers: Record<string, boolean>, zoom: number,
  panX: number, panY: number, viewMode: string
) {
  ctx.clearRect(0, 0, W, H)
  const bg = viewMode === "wireframe" ? "#1a1a2e" : "#f0ede8"
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

  ctx.save()
  ctx.translate(panX, panY)
  ctx.scale(zoom, zoom)

  // grid
  if (visLayers.grid) {
    ctx.strokeStyle = viewMode === "wireframe" ? "rgba(80,120,180,0.2)" : "rgba(180,160,140,0.4)"
    ctx.lineWidth = 0.5 / zoom
    for (let x = -200; x < 1200; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, -100); ctx.lineTo(x, 800); ctx.stroke()
    }
    for (let y = -100; y < 800; y += 50) {
      ctx.beginPath(); ctx.moveTo(-200, y); ctx.lineTo(1200, y); ctx.stroke()
    }
  }

  // terrain contours
  if (visLayers.surfaces) {
    const contourColors = viewMode === "wireframe"
      ? ["rgba(100,200,100,0.3)","rgba(120,220,120,0.4)","rgba(80,180,80,0.3)"]
      : ["rgba(160,140,100,0.35)","rgba(140,120,80,0.3)","rgba(180,160,120,0.25)"]
    contourColors.forEach((col, ci) => {
      ctx.strokeStyle = col; ctx.lineWidth = (1 + ci * 0.3) / zoom
      for (let i = 0; i < 8; i++) {
        ctx.beginPath()
        const yBase = 30 + i * 40 + ci * 12
        ctx.moveTo(-50, yBase)
        for (let x = -50; x <= 980; x += 20) {
          const y = yBase + Math.sin(x * 0.018 + i) * 18 + Math.cos(x * 0.008 + ci) * 10
          ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
    })
  }

  // alignments
  if (visLayers.alignments) {
    ALIGNMENTS.forEach(al => {
      if (al.pts.length < 2) return
      ctx.beginPath()
      ctx.moveTo(al.pts[0][0], al.pts[0][1])
      for (let i = 1; i < al.pts.length; i++) ctx.lineTo(al.pts[i][0], al.pts[i][1])
      if (al.id === "perimeter") ctx.closePath()
      ctx.strokeStyle = al.color; ctx.lineWidth = 2.5 / zoom; ctx.stroke()
      // stations
      al.pts.forEach((pt, i) => {
        if (i % 2 === 0) {
          ctx.beginPath(); ctx.arc(pt[0], pt[1], 3 / zoom, 0, Math.PI * 2)
          ctx.fillStyle = al.color; ctx.fill()
        }
      })
      // label
      const mid = al.pts[Math.floor(al.pts.length / 2)]
      ctx.fillStyle = al.color; ctx.font = `bold ${11 / zoom}px monospace`
      ctx.fillText(al.name, mid[0] + 5, mid[1] - 6)
    })
  }

  // corridors / hatching
  if (visLayers.corridors) {
    ctx.save()
    ctx.globalAlpha = 0.18
    const grad = ctx.createLinearGradient(80, 60, 880, 100)
    grad.addColorStop(0, "#f97316"); grad.addColorStop(1, "#fb923c")
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.moveTo(80, 50); ctx.lineTo(880, 62); ctx.lineTo(880, 95); ctx.lineTo(80, 78)
    ctx.closePath(); ctx.fill()
    ctx.globalAlpha = 0.12
    ctx.fillStyle = "#a855f7"
    ctx.beginPath()
    ctx.moveTo(100, 170); ctx.lineTo(840, 178); ctx.lineTo(840, 205); ctx.lineTo(100, 198)
    ctx.closePath(); ctx.fill()
    ctx.restore()
  }

  // parking lot outline
  if (visLayers.sites) {
    ctx.strokeStyle = viewMode === "wireframe" ? "#facc15" : "#ca8a04"
    ctx.lineWidth = 1.5 / zoom; ctx.setLineDash([6 / zoom, 3 / zoom])
    ctx.beginPath()
    ctx.moveTo(140, 120); ctx.lineTo(300, 120); ctx.lineTo(300, 330)
    ctx.lineTo(140, 330); ctx.closePath(); ctx.stroke()
    ctx.setLineDash([])
    // parking stalls
    ctx.strokeStyle = viewMode === "wireframe" ? "rgba(250,204,21,0.5)" : "rgba(202,138,4,0.5)"
    ctx.lineWidth = 0.8 / zoom
    for (let y = 140; y < 320; y += 22) {
      ctx.beginPath(); ctx.moveTo(140, y); ctx.lineTo(300, y); ctx.stroke()
    }
    for (let x = 160; x < 300; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 120); ctx.lineTo(x, 330); ctx.stroke()
    }
  }

  // pipe network
  if (visLayers.pipenet) {
    ctx.strokeStyle = "#6366f1"; ctx.lineWidth = 2 / zoom
    const pipePts: [number,number][] = [[120,280],[180,275],[240,268],[300,260],[360,255],[420,258],[480,265]]
    ctx.beginPath(); ctx.moveTo(pipePts[0][0], pipePts[0][1])
    pipePts.slice(1).forEach(p => ctx.lineTo(p[0], p[1])); ctx.stroke()
    pipePts.forEach(p => {
      ctx.beginPath(); ctx.arc(p[0], p[1], 4/zoom, 0, Math.PI*2)
      ctx.fillStyle="#6366f1"; ctx.fill()
    })
  }

  // points
  if (visLayers.points) {
    const pts: [number,number,string][] = [[95,55,"1001"],[305,108,"1002"],[485,78,"1003"],[680,92,"1004"],[870,68,"1005"]]
    pts.forEach(([x,y,lbl]) => {
      ctx.beginPath(); ctx.arc(x, y, 4/zoom, 0, Math.PI*2)
      ctx.fillStyle="#f59e0b"; ctx.fill()
      ctx.strokeStyle="white"; ctx.lineWidth=1/zoom; ctx.stroke()
      ctx.fillStyle="#f59e0b"; ctx.font=`${9/zoom}px monospace`
      ctx.fillText(lbl, x+5, y-4)
    })
  }

  // axis
  ctx.strokeStyle = "rgba(100,100,100,0.6)"; ctx.lineWidth = 1/zoom
  ctx.beginPath(); ctx.moveTo(-30,380); ctx.lineTo(0,380); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(-30,380); ctx.lineTo(-30,350); ctx.stroke()
  ctx.fillStyle="#666"; ctx.font=`${9/zoom}px sans-serif`
  ctx.fillText("X",2,383); ctx.fillText("Z",-33,348)

  ctx.restore()

  // ── Profile View (top-right panel, like Civil 3D) ──────────────────────────
  const pvX = W * 0.53, pvY = 12, pvW = W * 0.44, pvH = 90
  // outer border
  ctx.fillStyle = viewMode === "wireframe" ? "#111122" : "#fafaf5"
  ctx.fillRect(pvX, pvY, pvW, pvH)
  ctx.strokeStyle = "#60a5fa"; ctx.lineWidth = 1; ctx.strokeRect(pvX, pvY, pvW, pvH)
  // grid inside profile view
  ctx.strokeStyle = viewMode === "wireframe" ? "rgba(100,120,200,0.25)" : "rgba(160,160,120,0.3)"
  ctx.lineWidth = 0.5
  for (let gx = pvX + 20; gx < pvX + pvW; gx += 20) {
    ctx.beginPath(); ctx.moveTo(gx, pvY); ctx.lineTo(gx, pvY + pvH); ctx.stroke()
  }
  for (let gy = pvY + 15; gy < pvY + pvH; gy += 15) {
    ctx.beginPath(); ctx.moveTo(pvX, gy); ctx.lineTo(pvX + pvW, gy); ctx.stroke()
  }
  // station ticks at bottom
  ctx.strokeStyle = "#6b7280"; ctx.lineWidth = 0.8
  for (let t = 0; t <= 10; t++) {
    const tx = pvX + 10 + t * (pvW - 20) / 10
    ctx.beginPath(); ctx.moveTo(tx, pvY + pvH - 10); ctx.lineTo(tx, pvY + pvH); ctx.stroke()
    ctx.fillStyle = "#6b7280"; ctx.font = "7px monospace"
    ctx.fillText(`${t * 100}`, tx - 8, pvY + pvH - 2)
  }
  // existing ground profile (red/pink line)
  ctx.beginPath(); ctx.strokeStyle = "#f87171"; ctx.lineWidth = 1.5
  const egPts = [0,4,8,6,12,10,7,5,9,11,8].map((v, i) => ({
    x: pvX + 10 + i * (pvW - 20) / 10,
    y: pvY + 20 + (15 - v * 2)
  }))
  egPts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
  ctx.stroke()
  // design profile (orange line)
  ctx.beginPath(); ctx.strokeStyle = "#fb923c"; ctx.lineWidth = 2
  const dpPts = [2,5,9,9,9,8,7,7,8,10,9].map((v, i) => ({
    x: pvX + 10 + i * (pvW - 20) / 10,
    y: pvY + 20 + (15 - v * 2)
  }))
  dpPts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
  ctx.stroke()
  // label
  ctx.fillStyle = viewMode==="wireframe"?"#60a5fa":"#1d4ed8"; ctx.font = "bold 8px Arial"
  ctx.fillText("Вторая улица  ВП  0+000 м ... 1000 м", pvX + 4, pvY + 10)

  // ── Second profile view (below) ──────────────────────────────────────────
  const pv2Y = pvY + pvH + 8
  const pv2H = 72
  ctx.fillStyle = viewMode === "wireframe" ? "#111122" : "#fafaf5"
  ctx.fillRect(pvX, pv2Y, pvW * 0.75, pv2H)
  ctx.strokeStyle = "#818cf8"; ctx.lineWidth = 1; ctx.strokeRect(pvX, pv2Y, pvW * 0.75, pv2H)
  ctx.strokeStyle = viewMode === "wireframe" ? "rgba(100,120,200,0.2)" : "rgba(140,140,100,0.25)"
  ctx.lineWidth = 0.5
  for (let gx = pvX + 18; gx < pvX + pvW * 0.75; gx += 18) {
    ctx.beginPath(); ctx.moveTo(gx, pv2Y); ctx.lineTo(gx, pv2Y + pv2H); ctx.stroke()
  }
  for (let gy = pv2Y + 12; gy < pv2Y + pv2H; gy += 12) {
    ctx.beginPath(); ctx.moveTo(pvX, gy); ctx.lineTo(pvX + pvW * 0.75, gy); ctx.stroke()
  }
  // station ticks
  for (let t = 0; t <= 8; t++) {
    const tx = pvX + 8 + t * (pvW * 0.75 - 16) / 8
    ctx.strokeStyle="#6b7280"; ctx.lineWidth=0.8
    ctx.beginPath(); ctx.moveTo(tx, pv2Y + pv2H - 8); ctx.lineTo(tx, pv2Y + pv2H); ctx.stroke()
    ctx.fillStyle="#6b7280"; ctx.font="7px monospace"
    ctx.fillText(`${t * 80}`, tx - 6, pv2Y + pv2H - 1)
  }
  ctx.beginPath(); ctx.strokeStyle = "#f87171"; ctx.lineWidth = 1.5
  const eg2 = [3,6,9,8,7,10,9,8,11].map((v,i)=>({
    x: pvX + 8 + i*(pvW*0.75-16)/8, y: pv2Y+15+(12-v*1.5)
  }))
  eg2.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y)); ctx.stroke()
  ctx.beginPath(); ctx.strokeStyle = "#fb923c"; ctx.lineWidth = 2
  const dp2 = [4,7,9,9,8,9,9,8,10].map((v,i)=>({
    x: pvX + 8 + i*(pvW*0.75-16)/8, y: pv2Y+15+(12-v*1.5)
  }))
  dp2.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y)); ctx.stroke()
  ctx.fillStyle = viewMode==="wireframe"?"#818cf8":"#4f46e5"; ctx.font="bold 8px Arial"
  ctx.fillText("Ул. Трумана  ВП  0+000 м ... 640 м", pvX + 4, pv2Y + 9)

  ctx.restore()
}

// ─── Surface Edit Dialog (редактор существующей поверхности) ─────────────────

function SurfaceEditDialog({ name, onClose }: { name: string; onClose: () => void }) {
  const [tab, setTab] = useState<"triangles"|"boundaries"|"edit_pts"|"smoothing"|"update">("triangles")
  const [seToast, setSeToast] = useState<string|null>(null)
  const seFlash = (m:string)=>{ setSeToast(m); setTimeout(()=>setSeToast(null), 2000) }
  const [triangles, setTriangles] = useState([
    { id: "T-001", v1: "П.1001", v2: "П.1002", v3: "П.1003", area: "48.2", deleted: false },
    { id: "T-002", v1: "П.1002", v2: "П.1004", v3: "П.1003", area: "52.7", deleted: false },
    { id: "T-003", v1: "П.1003", v2: "П.1004", v3: "П.1005", area: "41.8", deleted: false },
    { id: "T-004", v1: "П.1001", v2: "П.1003", v3: "П.1006", area: "55.1", deleted: false },
    { id: "T-005", v1: "П.1004", v2: "П.1005", v3: "П.1007", area: "39.4", deleted: false },
  ])
  const [boundaries, setBoundaries] = useState([
    { id: "B-01", type: "Внешняя", name: "Граница участка", pts: 12, active: true },
    { id: "B-02", type: "Обрезающая", name: "Зона застройки", pts: 6, active: true },
    { id: "B-03", type: "Восстанавливающая", name: "Дорога", pts: 8, active: false },
  ])
  const [manualPts, setManualPts] = useState([
    { id: "М-1", x: "1234.50", y: "5678.20", z: "121.35" },
    { id: "М-2", x: "1289.10", y: "5645.80", z: "119.87" },
  ])
  const [newPt, setNewPt] = useState({ x: "", y: "", z: "" })
  const [smoothMethod, setSmoothMethod] = useState("Натуральный сосед")
  const [smoothFactor, setSmoothFactor] = useState("0.5")
  const [updated, setUpdated] = useState(false)

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
        className="bg-[#f0f0f0] border border-gray-400 shadow-2xl flex flex-col relative"
        style={{ width: 640, maxHeight: "92vh", fontFamily: "Arial, sans-serif", fontSize: 12 }}>
        <div className="flex items-center justify-between bg-[#0078d4] px-3 py-1.5 flex-shrink-0">
          <span className="text-white font-bold text-sm">Редактировать поверхность — {name}</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 w-5 h-5 flex items-center justify-center">✕</button>
        </div>
        {/* Tabs */}
        <div className="flex border-b border-gray-300 bg-[#e8e8e8] flex-shrink-0 flex-wrap">
          {([
            ["triangles","Треугольники"], ["boundaries","Границы"],
            ["edit_pts","Точки"], ["smoothing","Сглаживание"], ["update","Обновление"]
          ] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-3 py-1.5 text-xs font-semibold border-r border-gray-300 transition-colors whitespace-nowrap ${tab===id?"bg-white text-blue-700":"text-gray-600 hover:bg-gray-100"}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">

          {/* ── Треугольники ── */}
          {tab === "triangles" && (
            <div className="space-y-2">
              <div className="text-[11px] text-gray-600 px-1">Ручное редактирование TIN-треугольников. Удалённые рёбра перестраивают триангуляцию.</div>
              <div className="border border-gray-400 bg-white">
                <div className="bg-[#d0d0d0] px-2 py-1 font-bold text-xs border-b border-gray-400 flex items-center gap-2">
                  <span className="text-blue-600">▼</span> Список треугольников
                  <span className="ml-auto text-gray-500 font-normal">{triangles.filter(t=>!t.deleted).length} активных / {triangles.length} всего</span>
                </div>
                <table className="w-full text-xs">
                  <thead className="bg-[#e8e8e8] border-b border-gray-300">
                    <tr>
                      <th className="px-2 py-1 text-left font-semibold border-r border-gray-200 w-16">ID</th>
                      <th className="px-2 py-1 text-left font-semibold border-r border-gray-200">Вершина 1</th>
                      <th className="px-2 py-1 text-left font-semibold border-r border-gray-200">Вершина 2</th>
                      <th className="px-2 py-1 text-left font-semibold border-r border-gray-200">Вершина 3</th>
                      <th className="px-2 py-1 text-left font-semibold border-r border-gray-200 w-20">Площадь м²</th>
                      <th className="px-2 py-1 text-left font-semibold w-20">Действие</th>
                    </tr>
                  </thead>
                  <tbody>
                    {triangles.map((t, i) => (
                      <tr key={t.id} className={`border-b border-gray-100 ${t.deleted ? "opacity-40 line-through bg-red-50" : i%2===0?"bg-white":"bg-gray-50"}`}>
                        <td className="px-2 py-1 border-r border-gray-100 font-mono text-gray-500">{t.id}</td>
                        <td className="px-2 py-1 border-r border-gray-100 text-blue-700 font-mono">{t.v1}</td>
                        <td className="px-2 py-1 border-r border-gray-100 text-blue-700 font-mono">{t.v2}</td>
                        <td className="px-2 py-1 border-r border-gray-100 text-blue-700 font-mono">{t.v3}</td>
                        <td className="px-2 py-1 border-r border-gray-100 font-mono">{t.area}</td>
                        <td className="px-2 py-1">
                          <button onClick={() => setTriangles(prev => prev.map((tr, j) => j===i ? {...tr, deleted: !tr.deleted} : tr))}
                            className={`text-[10px] px-2 py-0.5 border rounded ${t.deleted ? "border-green-500 text-green-700 hover:bg-green-50":"border-red-400 text-red-600 hover:bg-red-50"}`}>
                            {t.deleted ? "Восстановить" : "Удалить"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>seFlash("✓ Ребро TIN добавлено")} className="px-3 py-1 bg-[#0078d4] text-white text-xs hover:bg-blue-700 border border-blue-700">Добавить ребро</button>
                <button onClick={()=>seFlash("✓ Изменения TIN сброшены")} className="px-3 py-1 bg-[#e0e0e0] text-gray-700 text-xs hover:bg-gray-300 border border-gray-400">Сбросить изменения</button>
              </div>
            </div>
          )}

          {/* ── Границы ── */}
          {tab === "boundaries" && (
            <div className="space-y-2">
              <div className="text-[11px] text-gray-600 px-1">Управление границами поверхности. Внешняя граница ограничивает область, обрезающая — исключает участки.</div>
              <div className="border border-gray-400 bg-white">
                <div className="bg-[#d0d0d0] px-2 py-1 font-bold text-xs border-b border-gray-400 flex items-center gap-2">
                  <span className="text-blue-600">▼</span> Границы
                  <button onClick={()=>seFlash("✓ Граница добавлена")} className="ml-auto px-2 py-0.5 bg-[#0078d4] text-white text-[10px] hover:bg-blue-700">+ Добавить</button>
                </div>
                <table className="w-full text-xs">
                  <thead className="bg-[#e8e8e8] border-b border-gray-300">
                    <tr>
                      <th className="px-2 py-1 text-left font-semibold border-r border-gray-200">ID</th>
                      <th className="px-2 py-1 text-left font-semibold border-r border-gray-200">Тип</th>
                      <th className="px-2 py-1 text-left font-semibold border-r border-gray-200">Название</th>
                      <th className="px-2 py-1 text-left font-semibold border-r border-gray-200 w-16">Точек</th>
                      <th className="px-2 py-1 text-left font-semibold w-20">Активна</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boundaries.map((b, i) => (
                      <tr key={b.id} className={i%2===0?"bg-white":"bg-gray-50"}>
                        <td className="px-2 py-1 border-r border-gray-100 font-mono text-gray-500">{b.id}</td>
                        <td className={`px-2 py-1 border-r border-gray-100 font-semibold ${b.type==="Внешняя"?"text-blue-700":b.type==="Обрезающая"?"text-red-600":"text-green-700"}`}>{b.type}</td>
                        <td className="px-2 py-1 border-r border-gray-100">{b.name}</td>
                        <td className="px-2 py-1 border-r border-gray-100 font-mono text-center">{b.pts}</td>
                        <td className="px-2 py-1">
                          <input type="checkbox" checked={b.active}
                            onChange={() => setBoundaries(prev => prev.map((br,j) => j===i ? {...br,active:!br.active} : br))}
                            className="accent-blue-600"/>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[["Внешняя","blue"],["Обрезающая","red"],["Восстанавливающая","green"]].map(([t,c])=>(
                  <button key={t} className={`px-2 py-1.5 text-xs border rounded font-semibold text-${c}-700 border-${c}-300 hover:bg-${c}-50`}>
                    + {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Точки ── */}
          {tab === "edit_pts" && (
            <div className="space-y-2">
              <div className="text-[11px] text-gray-600">Ручное добавление точек для уточнения геометрии поверхности.</div>
              <div className="border border-gray-400 bg-white">
                <div className="bg-[#d0d0d0] px-2 py-1 font-bold text-xs border-b border-gray-400">▼ Добавленные точки</div>
                <table className="w-full text-xs">
                  <thead className="bg-[#e8e8e8] border-b border-gray-300">
                    <tr>
                      {["ID","X (м)","Y (м)","Z (м)",""].map(h=><th key={h} className="px-2 py-1 text-left font-semibold border-r border-gray-200">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {manualPts.map((p, i) => (
                      <tr key={p.id} className={i%2===0?"bg-white":"bg-gray-50"}>
                        <td className="px-2 py-1 border-r border-gray-100 font-mono text-gray-500">{p.id}</td>
                        {["x","y","z"].map(f => (
                          <td key={f} className="px-1 py-0.5 border-r border-gray-100">
                            <input value={(p as Record<string,string>)[f]}
                              onChange={e => setManualPts(prev => prev.map((pt,j) => j===i ? {...pt,[f]:e.target.value} : pt))}
                              className="w-full bg-transparent outline-none font-mono text-xs"/>
                          </td>
                        ))}
                        <td className="px-1"><button onClick={() => setManualPts(prev=>prev.filter((_,j)=>j!==i))} className="text-gray-400 hover:text-red-500">✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2 items-end">
                {[["X",newPt.x,"x"],["Y",newPt.y,"y"],["Z",newPt.z,"z"]].map(([lbl,val,f])=>(
                  <div key={f}>
                    <div className="text-xs text-gray-600 mb-0.5">{lbl}:</div>
                    <input value={val} onChange={e => setNewPt(p=>({...p,[f]:e.target.value}))} placeholder="0.00"
                      className="w-24 border border-gray-400 px-2 py-0.5 text-xs bg-white font-mono"/>
                  </div>
                ))}
                <button onClick={() => {
                  if (!newPt.x||!newPt.y||!newPt.z) return
                  setManualPts(prev=>[...prev, {id:`М-${prev.length+1}`, ...newPt}])
                  setNewPt({x:"",y:"",z:""})
                }} className="px-3 py-1 bg-[#0078d4] text-white text-xs border border-blue-700 hover:bg-blue-700">+ Точка</button>
              </div>
            </div>
          )}

          {/* ── Сглаживание ── */}
          {tab === "smoothing" && (
            <div className="space-y-3">
              <div className="text-[11px] text-gray-600">Сглаживание TIN-поверхности для более плавного отображения горизонталей.</div>
              <div className="flex items-center gap-2">
                <label className="w-44 text-xs text-gray-700">Метод сглаживания:</label>
                <select value={smoothMethod} onChange={e=>setSmoothMethod(e.target.value)} className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
                  {["Натуральный сосед","Идентификация зон","Krige","Обратная взвешенная дистанция"].map(m=><option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="w-44 text-xs text-gray-700">Коэффициент сглаживания:</label>
                <input value={smoothFactor} onChange={e=>setSmoothFactor(e.target.value)}
                  className="w-20 border border-gray-400 px-2 py-0.5 text-xs bg-white font-mono"/>
                <span className="text-xs text-gray-500">(0.1 — 1.0)</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="w-44 text-xs text-gray-700">Применить к:</label>
                <select className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
                  <option>Всей поверхности</option>
                  <option>Выбранной области</option>
                </select>
              </div>
              <button onClick={()=>seFlash("✓ Сглаживание применено")} className="px-4 py-1 bg-[#0078d4] text-white text-xs font-semibold hover:bg-blue-700 border border-blue-700">Применить сглаживание</button>
            </div>
          )}

          {/* ── Обновление ── */}
          {tab === "update" && (
            <div className="space-y-3">
              <div className="text-[11px] text-gray-600">Пересчёт поверхности после внесения изменений. Затронутые объекты будут пересчитаны автоматически.</div>
              <div className="border border-gray-300 bg-white rounded p-3 space-y-1.5">
                <div className="text-xs font-semibold text-gray-700 mb-2">Зависимые объекты:</div>
                {[
                  { name: "Профиль Проект_Трасса-1", type: "Профиль", status: updated ? "Актуален ✓" : "Устарел ⚠", color: updated ? "text-green-700" : "text-yellow-700" },
                  { name: "Коридор Дорога ШД-38", type: "Коридор", status: updated ? "Актуален ✓" : "Устарел ⚠", color: updated ? "text-green-700" : "text-yellow-700" },
                  { name: "Объём земляных работ", type: "Анализ", status: updated ? "Актуален ✓" : "Устарел ⚠", color: updated ? "text-green-700" : "text-yellow-700" },
                ].map(obj => (
                  <div key={obj.name} className="flex items-center gap-2 text-xs">
                    <span className="w-6 text-blue-600">▸</span>
                    <span className="flex-1 text-gray-700">{obj.name}</span>
                    <span className="text-gray-500 w-20">{obj.type}</span>
                    <span className={`font-semibold w-28 ${obj.color}`}>{obj.status}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setUpdated(true)}
                  className="px-4 py-1.5 bg-[#0078d4] text-white text-xs font-semibold hover:bg-blue-700 border border-blue-700">
                  Обновить поверхность
                </button>
                <button onClick={() => setUpdated(true)}
                  className="px-4 py-1.5 bg-[#e0e0e0] text-gray-700 text-xs font-semibold hover:bg-gray-300 border border-gray-400">
                  Синхронизировать все зависимости
                </button>
              </div>
              {updated && (
                <div className="px-3 py-2 bg-green-50 border border-green-300 rounded text-xs text-green-800 font-semibold">
                  ✓ Поверхность пересчитана. Все зависимые объекты обновлены.
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-3 py-2 border-t border-gray-300 flex-shrink-0">
          <button onClick={onClose} className="px-6 py-1 bg-[#0078d4] text-white border border-blue-700 text-xs font-semibold hover:bg-blue-700">Закрыть</button>
          <button onClick={()=>seFlash("Справка Лапа · Редактирование поверхности")} className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">Справка</button>
        </div>
        <AnimatePresence>
          {seToast && (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-[#0078d4] text-white text-[11px] px-3 py-1.5 rounded shadow-lg z-10 whitespace-nowrap">
              {seToast}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// ─── Daylight Feature Line Dialog ─────────────────────────────────────────────

function DaylightFeatureLineDialog({ onClose, onOK }: { onClose: () => void; onOK: () => void }) {
  const [corridor, setCorridor] = useState("Дорога ШД-38")
  const [surface, setSurface] = useState("Существующая поверхность")
  const [side, setSide] = useState("Обе стороны")
  const [criteria, setCriteria] = useState("Уклон откоса 1:1.5")
  const [method, setMethod] = useState("Итерационный")
  const [done, setDone] = useState(false)

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
        className="bg-[#f0f0f0] border border-gray-400 shadow-2xl w-[500px]"
        style={{ fontFamily: "Arial, sans-serif", fontSize: 12 }}>
        <div className="flex items-center justify-between bg-[#0078d4] px-3 py-1.5">
          <span className="text-white font-bold text-sm">Линия выхода на рельеф</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 w-5 h-5 flex items-center justify-center">✕</button>
        </div>
        <div className="p-4 space-y-3">
          <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded text-[11px] text-blue-800">
            Новинка Лапа. Автоматически создаёт характерные линии откосов на основе проектного коридора и существующего рельефа.
          </div>
          {[
            ["Коридор:", corridor, setCorridor, ["Дорога ШД-38","Коридор Ул. Трумана"]],
            ["Поверхность:", surface, setSurface, ["Существующая поверхность","Проектная поверхность"]],
            ["Сторона:", side, setSide, ["Левая","Правая","Обе стороны"]],
            ["Критерий:", criteria, setCriteria, ["Уклон откоса 1:1.5","Уклон откоса 1:2","Вертикальный откос","По поверхности"]],
            ["Метод:", method, setMethod, ["Итерационный","Прямой","По точкам"]]
          ].map(([lbl, val, setter, opts]) => (
            <div key={lbl as string} className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0">{lbl as string}</label>
              <select value={val as string} onChange={e => (setter as (v:string)=>void)(e.target.value)}
                className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
                {(opts as string[]).map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <button onClick={() => setDone(true)}
            className="px-4 py-1.5 bg-[#0078d4] text-white text-xs font-semibold hover:bg-blue-700 border border-blue-700 w-full">
            Создать линии выхода на рельеф
          </button>
          {done && (
            <div className="px-3 py-2 bg-green-50 border border-green-400 rounded text-xs text-green-800 font-semibold">
              ✓ Создано 2 характерные линии (левая/правая). Объекты добавлены в дерево проекта.
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-3 pb-3">
          <button onClick={() => { onOK(); onClose() }} className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">ОК</button>
          <button onClick={onClose} className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">Отмена</button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Data Shortcuts Panel ──────────────────────────────────────────────────────

function DataShortcutsPanel({ onClose }: { onClose: () => void }) {
  const [syncAll, setSyncAll] = useState(false)
  const [items, setItems] = useState([
    { id: "DS-01", type: "Поверхность", name: "Существующая поверхность", file: "Тopo_2024.dwg", status: "Актуален", modified: "20.05.2026 14:32" },
    { id: "DS-02", type: "Трасса", name: "Трасса ШД-38", file: "Road_Main.dwg", status: "Устарел", modified: "19.05.2026 18:10" },
    { id: "DS-03", type: "Профиль", name: "Проект_Трасса-1", file: "Road_Main.dwg", status: "Устарел", modified: "19.05.2026 18:10" },
    { id: "DS-04", type: "Коридор", name: "Дорога ШД-38", file: "Corridor.dwg", status: "Актуален", modified: "20.05.2026 09:15" },
    { id: "DS-05", type: "Трубосеть", name: "Сеть дождевой канализации", file: "Drainage.dwg", status: "Не загружен", modified: "18.05.2026 11:20" },
  ])
  const statusColor: Record<string,string> = {
    "Актуален": "text-green-700 bg-green-50",
    "Устарел": "text-yellow-700 bg-yellow-50",
    "Не загружен": "text-gray-500 bg-gray-100"
  }
  const syncItem = (id: string) => setItems(prev => prev.map(it => it.id===id ? {...it, status:"Актуален", modified: new Date().toLocaleString("ru")} : it))
  const syncAllItems = () => {
    setItems(prev => prev.map(it => ({...it, status:"Актуален", modified: new Date().toLocaleString("ru")})))
    setSyncAll(true)
    setTimeout(()=>setSyncAll(false),3000)
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#f0f0f0] border border-gray-400 shadow-2xl flex flex-col" style={{width:660, maxHeight:"85vh", fontFamily:"Arial,sans-serif",fontSize:12}}>
        <div className="flex items-center justify-between bg-[#0078d4] px-3 py-1.5 flex-shrink-0">
          <span className="text-white font-bold text-sm">Быстрые ссылки на данные — Data Shortcuts</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 w-5 h-5 flex items-center justify-center">✕</button>
        </div>
        <div className="px-3 py-2 bg-blue-50 border-b border-blue-200 text-[11px] text-blue-800 flex-shrink-0 flex items-center gap-2">
          <span className="font-semibold">Проект:</span> Дорожное строительство ШД-38 · 5 ссылок
          <button onClick={syncAllItems} className="ml-auto px-3 py-0.5 bg-[#0078d4] text-white text-[11px] hover:bg-blue-700 border border-blue-700">
            Синхронизировать все
          </button>
        </div>
        {syncAll && (
          <div className="px-3 py-1.5 bg-green-50 border-b border-green-300 text-[11px] text-green-800 font-semibold flex-shrink-0">
            ✓ Все ссылки синхронизированы
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-[#e8e8e8] border-b border-gray-300 sticky top-0">
              <tr>
                {["ID","Тип объекта","Название","Файл-источник","Дата изм.","Статус","Действие"].map(h=>(
                  <th key={h} className="text-left px-2 py-1.5 font-semibold border-r border-gray-200 last:border-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={it.id} className={i%2===0?"bg-white":"bg-gray-50"}>
                  <td className="px-2 py-1.5 border-r border-gray-100 font-mono text-gray-400">{it.id}</td>
                  <td className="px-2 py-1.5 border-r border-gray-100 font-semibold text-blue-700">{it.type}</td>
                  <td className="px-2 py-1.5 border-r border-gray-100">{it.name}</td>
                  <td className="px-2 py-1.5 border-r border-gray-100 font-mono text-gray-600 text-[10px]">{it.file}</td>
                  <td className="px-2 py-1.5 border-r border-gray-100 text-[10px] text-gray-500 font-mono">{it.modified}</td>
                  <td className="px-2 py-1.5 border-r border-gray-100">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${statusColor[it.status]}`}>{it.status}</span>
                  </td>
                  <td className="px-2 py-1.5">
                    {it.status !== "Актуален" && (
                      <button onClick={() => syncItem(it.id)}
                        className="text-[10px] px-2 py-0.5 bg-[#0078d4] text-white hover:bg-blue-700 rounded">
                        Синхр.
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-300 px-3 py-2 flex justify-between items-center flex-shrink-0">
          <span className="text-[10px] text-gray-500">Команда: SYNCHRONIZEDATA | F5 — обновить | Ctrl+Shift+S — сохранить всё</span>
          <button onClick={onClose} className="px-4 py-1 bg-[#e0e0e0] border border-gray-400 text-xs font-semibold hover:bg-gray-300">Закрыть</button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Surface Dialog ──────────────────────────────────────────────────────────

function SurfaceDialog({ onClose, onOK }: { onClose: () => void; onOK: (d: SurfaceDef) => void }) {
  const SURF_STYLES = ["Стандарт", "Горизонтали 1м", "Горизонтали 5м", "Без отображения", "Анализ уклонов"]
  const [def, setDef] = useState<SurfaceDef>({
    name: "Существующая поверхность", description: "", type: "TIN",
    style: "Горизонтали 1м", layer: "C-TOPO-SURF", gridX: "10", gridY: "10",
    pointFiles: [{ name: "Точки_съёмки.csv", format: "CSV (N,E,Z,Desc)" }],
  })
  const [tab, setTab] = useState<"info" | "build" | "edit" | "analysis">("info")
  const [addFile, setAddFile] = useState("")
  const [addFormat, setAddFormat] = useState("CSV (N,E,Z,Desc)")
  const FORMATS = ["CSV (N,E,Z,Desc)", "TXT (X,Y,Z)", "LandXML", "DEM/GeoTIFF", "Облако точек RCP"]
  const [surfToast, setSurfToast] = useState<string|null>(null)
  const showSurfToast = (msg: string) => { setSurfToast(msg); setTimeout(() => setSurfToast(null), 2500) }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
        className="bg-[#f0f0f0] border border-gray-400 shadow-2xl w-[560px] max-h-[90vh] overflow-y-auto"
        style={{ fontFamily: "Arial, sans-serif", fontSize: 12 }}>
        <div className="flex items-center justify-between bg-[#0078d4] px-3 py-1.5">
          <span className="text-white font-bold text-sm">Создать поверхность</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 w-5 h-5 flex items-center justify-center">✕</button>
        </div>
        {/* Tabs */}
        <div className="flex border-b border-gray-300 bg-[#e8e8e8]">
          {(["info","build","edit","analysis"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-xs font-semibold border-r border-gray-300 transition-colors ${tab===t?"bg-white text-blue-700":"text-gray-600 hover:bg-gray-100"}`}>
              {t==="info"?"Информация":t==="build"?"Построение":t==="edit"?"Редактирование":"Анализ"}
            </button>
          ))}
        </div>
        <div className="p-3 space-y-2">
          {tab === "info" && <>
            <div className="flex items-center gap-2">
              <label className="w-28 text-xs text-gray-700 shrink-0">Тип поверхности:</label>
              <div className="flex gap-3">
                {(["TIN","Grid"] as const).map(t => (
                  <label key={t} className="flex items-center gap-1 text-xs cursor-pointer">
                    <input type="radio" checked={def.type===t} onChange={() => setDef(d=>({...d,type:t}))} />
                    <span className="font-semibold">{t}</span>
                    <span className="text-gray-500">{t==="TIN"?"— триангуляция":"— регулярная сетка"}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-28 text-xs text-gray-700 shrink-0">Название:</label>
              <input value={def.name} onChange={e=>setDef(d=>({...d,name:e.target.value}))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
              <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">⋯</button>
            </div>
            <div className="flex items-start gap-2">
              <label className="w-28 text-xs text-gray-700 shrink-0 mt-1">Описание:</label>
              <textarea value={def.description} onChange={e=>setDef(d=>({...d,description:e.target.value}))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white h-10 resize-none" />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-28 text-xs text-gray-700 shrink-0">Стиль:</label>
              <select value={def.style} onChange={e=>setDef(d=>({...d,style:e.target.value}))} className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
                {SURF_STYLES.map(s=><option key={s}>{s}</option>)}
              </select>
              <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">⋯</button>
              <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">✎</button>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-28 text-xs text-gray-700 shrink-0">Слой:</label>
              <input value={def.layer} onChange={e=>setDef(d=>({...d,layer:e.target.value}))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
            </div>
            {def.type==="Grid" && <div className="flex items-center gap-2">
              <label className="w-28 text-xs text-gray-700 shrink-0">Шаг сетки (м):</label>
              <span className="text-xs text-gray-600">X:</span>
              <input value={def.gridX} onChange={e=>setDef(d=>({...d,gridX:e.target.value}))} className="w-16 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
              <span className="text-xs text-gray-600">Y:</span>
              <input value={def.gridY} onChange={e=>setDef(d=>({...d,gridY:e.target.value}))} className="w-16 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
            </div>}
          </>}

          {tab === "build" && <>
            <div className="border border-gray-400 bg-white">
              <div className="bg-[#d0d0d0] px-2 py-1 flex items-center gap-1 font-bold text-xs border-b border-gray-400">
                <span className="text-blue-600">▼</span> Источники данных
              </div>
              <div className="flex items-center gap-1 bg-[#e8e8e8] border-b border-gray-300 text-xs font-semibold px-2 py-0.5">
                <span className="flex-1">Файл / источник</span>
                <span className="w-40">Формат</span>
              </div>
              <div className="max-h-36 overflow-y-auto">
                {def.pointFiles.map((f,i) => (
                  <div key={i} className={`flex items-center px-2 py-1 text-xs border-b border-gray-100 ${i%2===0?"bg-white":"bg-gray-50"}`}>
                    <span className="flex-1 text-blue-700 font-mono">{f.name}</span>
                    <span className="w-40 text-gray-600">{f.format}</span>
                    <button onClick={() => setDef(d=>({...d,pointFiles:d.pointFiles.filter((_,j)=>j!==i)}))}
                      className="text-gray-400 hover:text-red-500 ml-2 text-xs">✕</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <div className="text-xs text-gray-600 mb-0.5">Файл:</div>
                <input value={addFile} onChange={e=>setAddFile(e.target.value)} placeholder="имя_файла.csv" className="w-full border border-gray-400 px-2 py-0.5 text-xs bg-white" />
              </div>
              <div className="w-44">
                <div className="text-xs text-gray-600 mb-0.5">Формат:</div>
                <select value={addFormat} onChange={e=>setAddFormat(e.target.value)} className="w-full border border-gray-400 px-1 py-0.5 text-xs bg-white">
                  {FORMATS.map(f=><option key={f}>{f}</option>)}
                </select>
              </div>
              <button onClick={() => { if(addFile){setDef(d=>({...d,pointFiles:[...d.pointFiles,{name:addFile,format:addFormat}]}));setAddFile("")}}}
                className="px-3 py-1 bg-[#0078d4] text-white text-xs border border-blue-700 hover:bg-blue-700">Добавить</button>
            </div>
            <p className="text-[10px] text-gray-500">После добавления источников нажмите ОК — поверхность будет построена и добавлена в дерево проекта.</p>
          </>}

          {tab === "edit" && <>
            <div className="space-y-3">
              <div className="border border-gray-300 bg-white rounded">
                <div className="bg-[#d8d8d8] px-2 py-1 text-xs font-bold text-gray-700 border-b border-gray-300">Редактирование треугольников</div>
                <div className="p-2 flex gap-2">
                  <button onClick={()=>showSurfToast("✓ Ребро добавлено")} className="px-3 py-1 bg-[#e0e0e0] border border-gray-400 text-xs hover:bg-[#d0d0d0]">Добавить ребро</button>
                  <button onClick={()=>showSurfToast("✓ Ребро удалено")} className="px-3 py-1 bg-[#e0e0e0] border border-gray-400 text-xs hover:bg-[#d0d0d0]">Удалить ребро</button>
                  <button onClick={()=>showSurfToast("✓ Ребро перестроено")} className="px-3 py-1 bg-[#e0e0e0] border border-gray-400 text-xs hover:bg-[#d0d0d0]">Поменять ребро</button>
                </div>
              </div>
              <div className="border border-gray-300 bg-white rounded">
                <div className="bg-[#d8d8d8] px-2 py-1 text-xs font-bold text-gray-700 border-b border-gray-300">Структурные линии</div>
                <div className="p-2 flex gap-2">
                  <button onClick={()=>showSurfToast("✓ Структурная линия добавлена")} className="px-3 py-1 bg-[#e0e0e0] border border-gray-400 text-xs hover:bg-[#d0d0d0]">Добавить</button>
                  <button onClick={()=>showSurfToast("✓ Структурная линия удалена")} className="px-3 py-1 bg-[#e0e0e0] border border-gray-400 text-xs hover:bg-[#d0d0d0]">Удалить</button>
                  <button onClick={()=>showSurfToast("✓ Структурная линия изменена")} className="px-3 py-1 bg-[#e0e0e0] border border-gray-400 text-xs hover:bg-[#d0d0d0]">Редактировать</button>
                </div>
              </div>
              <div className="border border-gray-300 bg-white rounded">
                <div className="bg-[#d8d8d8] px-2 py-1 text-xs font-bold text-gray-700 border-b border-gray-300">Границы</div>
                <div className="p-2 space-y-1.5">
                  {["Внешняя граница","Обрезающая граница","Восстанавливающая граница"].map(label => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{label}</span>
                      <button onClick={()=>showSurfToast(`✓ ${label} добавлена`)} className="px-3 py-0.5 bg-[#e0e0e0] border border-gray-400 text-xs hover:bg-[#d0d0d0]">Добавить</button>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => showSurfToast("Поверхность пересчитана")}
                className="w-full py-1.5 bg-[#0078d4] text-white text-xs font-semibold hover:bg-blue-700 transition-colors rounded"
              >
                Обновить поверхность
              </button>
              {surfToast && <div className="text-center text-xs text-green-700 font-semibold bg-green-50 border border-green-300 rounded py-1">{surfToast}</div>}
            </div>
          </>}

          {tab === "analysis" && <>
            <div className="space-y-2">
              {[
                { label: "Анализ уклонов", desc: "Диапазоны уклонов с цветовой заливкой по категориям", icon: "🎨" },
                { label: "Анализ высот", desc: "Градиентная заливка по отметкам от min до max", icon: "📊" },
                { label: "Стрелки уклонов", desc: "Направление стока воды по рельефу", icon: "↓" },
                { label: "Водосборные бассейны", desc: "Автоматическое разбиение на водосборные зоны", icon: "💧" },
              ].map(a => (
                <label key={a.label} className="flex items-start gap-2 p-2 border border-gray-200 bg-white rounded cursor-pointer hover:bg-blue-50 transition-colors">
                  <input type="checkbox" className="mt-0.5 accent-blue-600" />
                  <span className="text-lg leading-none">{a.icon}</span>
                  <div>
                    <div className="text-xs font-semibold text-gray-800">{a.label}</div>
                    <div className="text-[10px] text-gray-500">{a.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </>}
        </div>
        <div className="flex justify-end gap-2 px-3 pb-3">
          <button onClick={() => onOK(def)} className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">ОК</button>
          <button onClick={onClose} className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">Отмена</button>
          <button onClick={()=>showSurfToast("Справка Лапа · Поверхности")} className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">Справка</button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Alignment Dialog ─────────────────────────────────────────────────────────

function AlignmentDialog({ onClose, onOK }: { onClose: () => void; onOK: (d: AlignmentDef) => void }) {
  const AL_TYPES = ["Осевая линия дороги","Пешеходная дорожка","Рельсовый путь","Бордюрная линия","Произвольная"]
  const AL_STYLES = ["Базовый","Автодорога","Ж/д путь","Без отображения"]
  const [def, setDef] = useState<AlignmentDef>({
    name: "Трасса-1", description: "", type: AL_TYPES[0],
    startStation: "0+00", stationIncrement: "20",
    style: "Автодорога", layer: "C-ROAD-ALIGN",
    elements: [
      { type: "line", length: "250.00", radius: "—", Az: "45°12′30″", A: "—" },
      { type: "spiral", length: "60.00", radius: "300", Az: "—", A: "60" },
      { type: "curve", length: "314.16", radius: "300", Az: "—", A: "—" },
      { type: "spiral", length: "60.00", radius: "300", Az: "—", A: "60" },
      { type: "line", length: "180.00", radius: "—", Az: "105°45′00″", A: "—" },
    ],
  })
  const [tab, setTab] = useState<"info"|"geom"|"station"|"visibility">("info")
  const [visObsH, setVisObsH] = useState("1.20")
  const [visTgtH, setVisTgtH] = useState("0.30")
  const [visMethod, setVisMethod] = useState("Линейный")
  const TYPE_LABELS: Record<string,string> = { line: "Прямая", curve: "Круговая кривая", spiral: "Клотоида" }
  const TYPE_COLORS: Record<string,string> = { line: "text-blue-700", curve: "text-orange-600", spiral: "text-green-700" }

  const addElement = (type: "line"|"curve"|"spiral") => {
    setDef(d=>({...d, elements:[...d.elements, { type, length:"100.00", radius: type==="line"?"—":"500", Az: type==="line"?"0°00′00″":"—", A: type==="spiral"?"50":"—" }]}))
  }
  const removeEl = (i: number) => setDef(d=>({...d, elements:d.elements.filter((_,j)=>j!==i)}))

  const totalLength = def.elements.reduce((s,e) => s + (parseFloat(e.length)||0), 0)

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
        className="bg-[#f0f0f0] border border-gray-400 shadow-2xl w-[600px] max-h-[90vh] overflow-y-auto"
        style={{ fontFamily: "Arial, sans-serif", fontSize: 12 }}>
        <div className="flex items-center justify-between bg-[#0078d4] px-3 py-1.5">
          <span className="text-white font-bold text-sm">Создать трассу</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 w-5 h-5 flex items-center justify-center">✕</button>
        </div>
        <div className="flex border-b border-gray-300 bg-[#e8e8e8]">
          {(["info","geom","station","visibility"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`px-4 py-1.5 text-xs font-semibold border-r border-gray-300 transition-colors ${tab===t?"bg-white text-blue-700":"text-gray-600 hover:bg-gray-100"}`}>
              {t==="info"?"Информация":t==="geom"?"Геометрия элементов":t==="station"?"Пикетаж":"Анализ видимости"}
            </button>
          ))}
        </div>
        <div className="p-3 space-y-2">
          {tab==="info" && <>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0">Название:</label>
              <input value={def.name} onChange={e=>setDef(d=>({...d,name:e.target.value}))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
              <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">⋯</button>
            </div>
            <div className="flex items-start gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0 mt-1">Описание:</label>
              <textarea value={def.description} onChange={e=>setDef(d=>({...d,description:e.target.value}))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white h-10 resize-none" />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0">Тип трассы:</label>
              <select value={def.type} onChange={e=>setDef(d=>({...d,type:e.target.value}))} className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
                {AL_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0">Стиль:</label>
              <select value={def.style} onChange={e=>setDef(d=>({...d,style:e.target.value}))} className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
                {AL_STYLES.map(s=><option key={s}>{s}</option>)}
              </select>
              <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">✎</button>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0">Слой:</label>
              <input value={def.layer} onChange={e=>setDef(d=>({...d,layer:e.target.value}))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
            </div>
            <div className="flex items-center gap-2 mt-1 p-2 bg-blue-50 border border-blue-200 rounded">
              <span className="text-xs text-blue-700 font-semibold">Общая длина трассы:</span>
              <span className="text-xs font-mono font-bold text-blue-900">{totalLength.toFixed(2)} м</span>
            </div>
          </>}

          {tab==="geom" && <>
            <div className="border border-gray-400 bg-white">
              <div className="bg-[#d0d0d0] px-2 py-1 flex items-center gap-1 font-bold text-xs border-b border-gray-400">
                <span className="text-blue-600">▼</span> Элементы геометрии
                <div className="ml-auto flex gap-1">
                  {([["line","Пр"],["curve","КК"],["spiral","КЛ"]] as [string,string][]).map(([t,l])=>(
                    <button key={t} onClick={()=>addElement(t as "line"|"curve"|"spiral")}
                      className="px-2 py-0.5 bg-[#0078d4] text-white text-[10px] hover:bg-blue-700">+ {l}</button>
                  ))}
                </div>
              </div>
              <table className="w-full text-xs">
                <thead className="bg-[#e8e8e8] border-b border-gray-300">
                  <tr>
                    <th className="px-2 py-1 text-left font-semibold border-r border-gray-200 w-8">#</th>
                    <th className="px-2 py-1 text-left font-semibold border-r border-gray-200 w-28">Тип</th>
                    <th className="px-2 py-1 text-left font-semibold border-r border-gray-200">Длина (м)</th>
                    <th className="px-2 py-1 text-left font-semibold border-r border-gray-200">R (м)</th>
                    <th className="px-2 py-1 text-left font-semibold border-r border-gray-200">Азимут / A</th>
                    <th className="px-1 py-1 w-6"></th>
                  </tr>
                </thead>
                <tbody>
                  {def.elements.map((el,i)=>(
                    <tr key={i} className={i%2===0?"bg-white":"bg-gray-50"}>
                      <td className="px-2 py-1 border-r border-gray-100 text-gray-500">{i+1}</td>
                      <td className={`px-2 py-1 border-r border-gray-100 font-semibold ${TYPE_COLORS[el.type]}`}>{TYPE_LABELS[el.type]}</td>
                      <td className="px-1 py-0.5 border-r border-gray-100">
                        <input value={el.length} onChange={e=>{const els=[...def.elements];els[i]={...els[i],length:e.target.value};setDef(d=>({...d,elements:els}))}}
                          className="w-full bg-transparent outline-none text-xs font-mono" />
                      </td>
                      <td className="px-1 py-0.5 border-r border-gray-100">
                        <input value={el.radius} onChange={e=>{const els=[...def.elements];els[i]={...els[i],radius:e.target.value};setDef(d=>({...d,elements:els}))}}
                          className="w-full bg-transparent outline-none text-xs font-mono" disabled={el.type==="line"} />
                      </td>
                      <td className="px-1 py-0.5 border-r border-gray-100 font-mono text-[10px] text-gray-600">
                        {el.type==="line"?el.Az:el.type==="spiral"?`A=${el.A}`:"—"}
                      </td>
                      <td className="px-1 py-0.5">
                        <button onClick={()=>removeEl(i)} className="text-gray-400 hover:text-red-500">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#e8e8e8] border-t border-gray-300">
                  <tr><td colSpan={2} className="px-2 py-1 text-xs font-bold">Итого:</td>
                    <td className="px-2 py-1 text-xs font-bold font-mono">{totalLength.toFixed(2)}</td>
                    <td colSpan={3}></td></tr>
                </tfoot>
              </table>
            </div>
            <div className="mt-2 px-1 py-1 bg-gray-50 border border-gray-200 rounded text-[10px] text-gray-500">
              A — добавить вершину | D — удалить | R — изменить радиус
            </div>
          </>}

          {tab==="station" && <>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <label className="w-36 text-xs text-gray-700 shrink-0">Начало пикетажа:</label>
                <input value={def.startStation} onChange={e=>setDef(d=>({...d,startStation:e.target.value}))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white font-mono" />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-36 text-xs text-gray-700 shrink-0">Шаг пикетажа (м):</label>
                <input value={def.stationIncrement} onChange={e=>setDef(d=>({...d,stationIncrement:e.target.value}))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white font-mono" />
              </div>
            </div>
            <div className="border border-gray-300 bg-white p-3 rounded space-y-1">
              <div className="text-xs font-semibold text-gray-700 mb-2">Разбивочные элементы:</div>
              {def.elements.map((el,i) => {
                const pk = def.elements.slice(0,i).reduce((s,e)=>s+(parseFloat(e.length)||0),0)
                return (
                  <div key={i} className="flex gap-2 text-xs text-gray-600 font-mono">
                    <span className="w-6 text-gray-400">{i+1}.</span>
                    <span className={`w-28 font-semibold ${TYPE_COLORS[el.type]}`}>{TYPE_LABELS[el.type]}</span>
                    <span>ПК {(pk/100).toFixed(0).padStart(2,"0")}+{String(pk%100).padStart(2,"0")} … ПК {((pk+(parseFloat(el.length)||0))/100).toFixed(0).padStart(2,"0")}+{String(Math.round((pk+(parseFloat(el.length)||0))%100)).padStart(2,"0")}</span>
                    <span className="text-gray-400 ml-auto">{el.length} м</span>
                  </div>
                )
              })}
              <div className="border-t border-gray-200 mt-2 pt-2 flex gap-2 text-xs font-bold">
                <span className="text-gray-600">Конец трассы:</span>
                <span className="font-mono text-blue-700">ПК {(totalLength/100).toFixed(0).padStart(2,"0")}+{String(Math.round(totalLength%100)).padStart(2,"0")}</span>
              </div>
            </div>
          </>}

          {tab==="visibility" && <>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="w-44 text-xs text-gray-700 shrink-0">Высота наблюдателя, м:</label>
                <input value={visObsH} onChange={e=>setVisObsH(e.target.value)} className="w-20 border border-gray-400 px-2 py-0.5 text-xs bg-white font-mono" />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-44 text-xs text-gray-700 shrink-0">Высота цели, м:</label>
                <input value={visTgtH} onChange={e=>setVisTgtH(e.target.value)} className="w-20 border border-gray-400 px-2 py-0.5 text-xs bg-white font-mono" />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-44 text-xs text-gray-700 shrink-0">Метод:</label>
                <select value={visMethod} onChange={e=>setVisMethod(e.target.value)} className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
                  {["Линейный","Зонный","Критический"].map(m=><option key={m}>{m}</option>)}
                </select>
              </div>
              <button className="px-4 py-1 bg-[#0078d4] text-white text-xs font-semibold hover:bg-blue-700 border border-blue-700 rounded">Выполнить анализ</button>
              <div className="bg-[#1a1a2e] rounded border border-gray-600 overflow-hidden" style={{height:200}}>
                <svg width="100%" height="100%" viewBox="0 0 520 190">
                  <text x="10" y="14" fill="#9ca3af" fontSize="9">Диаграмма видимости вдоль трассы</text>
                  <line x1="10" y1="160" x2="510" y2="160" stroke="#555" strokeWidth="1"/>
                  {/* Green visible zones */}
                  <rect x="10" y="130" width="80" height="30" fill="#4ade80" opacity="0.7"/>
                  <rect x="120" y="130" width="100" height="30" fill="#4ade80" opacity="0.7"/>
                  <rect x="260" y="130" width="70" height="30" fill="#4ade80" opacity="0.7"/>
                  <rect x="370" y="130" width="140" height="30" fill="#4ade80" opacity="0.7"/>
                  {/* Red blind zones */}
                  <rect x="90" y="130" width="30" height="30" fill="#ef4444" opacity="0.7"/>
                  <rect x="220" y="130" width="40" height="30" fill="#ef4444" opacity="0.7"/>
                  <rect x="330" y="130" width="40" height="30" fill="#ef4444" opacity="0.7"/>
                  <text x="10" y="125" fill="#4ade80" fontSize="8">Видимо</text>
                  <text x="90" y="125" fill="#ef4444" fontSize="8">Слепая</text>
                  <line x1="10" y1="80" x2="510" y2="80" stroke="#374151" strokeWidth="0.5" strokeDasharray="3,3"/>
                  <polyline points="10,100 80,75 150,90 220,110 290,70 370,85 510,95" fill="none" stroke="#6366f1" strokeWidth="1.5"/>
                  <text x="10" y="175" fill="#6b7280" fontSize="7">0+00</text>
                  <text x="200" y="175" fill="#6b7280" fontSize="7">5+00</text>
                  <text x="430" y="175" fill="#6b7280" fontSize="7">10+00</text>
                </svg>
              </div>
              <div className="px-2 py-1.5 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800 font-semibold">
                Видимость: 78.3% трассы | Проблемных зон: 3
              </div>
            </div>
          </>}
        </div>
        <div className="flex justify-end gap-2 px-3 pb-3">
          <button onClick={()=>onOK(def)} className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">ОК</button>
          <button onClick={onClose} className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">Отмена</button>
          <button className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">Справка</button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Profile Dialog ───────────────────────────────────────────────────────────

function ProfileDialog({ onClose, onOK, alignments }: { onClose: () => void; onOK: (d: ProfileDef) => void; alignments: string[] }) {
  const PROF_STYLES = ["Базовый","Профиль разработки","Существующий рельеф","Без отображения"]
  const [def, setDef] = useState<ProfileDef>({
    name: "Проект_Трасса-1", alignment: alignments[0] || "Трасса ШД-38",
    surface: "Существующая поверхность", description: "", style: "Профиль разработки", layer: "C-ROAD-PROF",
    pvcs: [
      { station: "0+00", elev: "120.50", k: "—" },
      { station: "2+50", elev: "125.80", k: "40" },
      { station: "5+00", elev: "122.30", k: "60" },
      { station: "8+00", elev: "118.90", k: "35" },
      { station: "10+00", elev: "121.40", k: "—" },
    ],
  })
  const [tab, setTab] = useState<"info"|"pvc"|"slopes"|"preview">("info")
  const [newSt, setNewSt] = useState(""); const [newEl, setNewEl] = useState(""); const [newK, setNewK] = useState("—")
  const [syncSurface, setSyncSurface] = useState(true)
  const [showCritical, setShowCritical] = useState(true)

  const addPVC = () => {
    if (!newSt || !newEl) return
    setDef(d=>({...d, pvcs: [...d.pvcs, {station:newSt, elev:newEl, k:newK}].sort((a,b)=>{
      const parse = (s:string) => { const [pk,m]=s.split("+"); return +(pk||0)*100+(+(m||0)) }
      return parse(a.station)-parse(b.station)
    })}))
    setNewSt(""); setNewEl(""); setNewK("—")
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
        className="bg-[#f0f0f0] border border-gray-400 shadow-2xl w-[580px] max-h-[90vh] overflow-y-auto"
        style={{ fontFamily: "Arial, sans-serif", fontSize: 12 }}>
        <div className="flex items-center justify-between bg-[#0078d4] px-3 py-1.5">
          <span className="text-white font-bold text-sm">Создать профиль разработки</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 w-5 h-5 flex items-center justify-center">✕</button>
        </div>
        <div className="flex border-b border-gray-300 bg-[#e8e8e8]">
          {(["info","pvc","slopes","preview"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`px-4 py-1.5 text-xs font-semibold border-r border-gray-300 transition-colors ${tab===t?"bg-white text-blue-700":"text-gray-600 hover:bg-gray-100"}`}>
              {t==="info"?"Информация":t==="pvc"?"Точки ВК":t==="slopes"?"Уклоны":"Предпросмотр"}
            </button>
          ))}
        </div>
        <div className="p-3 space-y-2">
          {tab==="info" && <>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0">Трасса:</label>
              <select value={def.alignment} onChange={e=>setDef(d=>({...d,alignment:e.target.value}))} className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
                {alignments.map(a=><option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0">Поверхность рельефа:</label>
              <select value={def.surface} onChange={e=>setDef(d=>({...d,surface:e.target.value}))} className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
                {["Существующая поверхность","Проектная поверхность"].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0">Название профиля:</label>
              <input value={def.name} onChange={e=>setDef(d=>({...d,name:e.target.value}))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0">Стиль:</label>
              <select value={def.style} onChange={e=>setDef(d=>({...d,style:e.target.value}))} className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
                {PROF_STYLES.map(s=><option key={s}>{s}</option>)}
              </select>
              <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">✎</button>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0">Слой:</label>
              <input value={def.layer} onChange={e=>setDef(d=>({...d,layer:e.target.value}))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-300 rounded">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={syncSurface} onChange={e=>setSyncSurface(e.target.checked)} className="accent-blue-600" />
                <span className="text-xs text-gray-700">Синхронизировать с поверхностью</span>
              </label>
              {syncSurface && (
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500"/>
                  <span className="text-[10px] text-green-700 font-semibold">Синхронизировано</span>
                </div>
              )}
            </div>
          </>}

          {tab==="pvc" && <>
            <div className="border border-gray-400 bg-white">
              <div className="bg-[#d0d0d0] px-2 py-1 flex items-center gap-1 font-bold text-xs border-b border-gray-400">
                <span className="text-blue-600">▼</span> Вертикальные кривые (ВК)
              </div>
              <table className="w-full text-xs">
                <thead className="bg-[#e8e8e8] border-b border-gray-300">
                  <tr>
                    <th className="px-2 py-1 text-left font-semibold border-r border-gray-200">Пикет</th>
                    <th className="px-2 py-1 text-left font-semibold border-r border-gray-200">Отметка (м)</th>
                    <th className="px-2 py-1 text-left font-semibold border-r border-gray-200">Параметр K</th>
                    <th className="px-2 py-1 text-left font-semibold border-r border-gray-200">Уклон i1</th>
                    <th className="px-2 py-1 text-left font-semibold border-r border-gray-200">Уклон i2</th>
                    <th className="w-6"></th>
                  </tr>
                </thead>
                <tbody>
                  {def.pvcs.map((pvc,i)=>(
                    <tr key={i} className={i%2===0?"bg-white":"bg-gray-50"}>
                      <td className="px-1 py-0.5 border-r border-gray-100">
                        <input value={pvc.station} onChange={e=>{const p=[...def.pvcs];p[i]={...p[i],station:e.target.value};setDef(d=>({...d,pvcs:p}))}}
                          className="w-full bg-transparent outline-none font-mono text-xs" />
                      </td>
                      <td className="px-1 py-0.5 border-r border-gray-100">
                        <input value={pvc.elev} onChange={e=>{const p=[...def.pvcs];p[i]={...p[i],elev:e.target.value};setDef(d=>({...d,pvcs:p}))}}
                          className="w-full bg-transparent outline-none font-mono text-xs" />
                      </td>
                      <td className="px-1 py-0.5 border-r border-gray-100">
                        <input value={pvc.k} onChange={e=>{const p=[...def.pvcs];p[i]={...p[i],k:e.target.value};setDef(d=>({...d,pvcs:p}))}}
                          className="w-full bg-transparent outline-none font-mono text-xs" />
                      </td>
                      <td className="px-1 py-0.5 border-r border-gray-100">
                        <input defaultValue={i===0?"—":`${((parseFloat(def.pvcs[i].elev||"0")-parseFloat(def.pvcs[i-1]?.elev||"0"))/100*100).toFixed(2)}%`}
                          className="w-full bg-transparent outline-none font-mono text-xs text-blue-700" />
                      </td>
                      <td className="px-1 py-0.5 border-r border-gray-100">
                        <input defaultValue={i===def.pvcs.length-1?"—":`${((parseFloat(def.pvcs[i+1]?.elev||"0")-parseFloat(def.pvcs[i].elev||"0"))/100*100).toFixed(2)}%`}
                          className="w-full bg-transparent outline-none font-mono text-xs text-orange-600" />
                      </td>
                      <td className="px-1"><button onClick={()=>setDef(d=>({...d,pvcs:d.pvcs.filter((_,j)=>j!==i)}))} className="text-gray-400 hover:text-red-500">✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 items-end">
              <div><div className="text-xs text-gray-600 mb-0.5">Пикет:</div><input value={newSt} onChange={e=>setNewSt(e.target.value)} placeholder="0+00" className="w-20 border border-gray-400 px-2 py-0.5 text-xs bg-white font-mono" /></div>
              <div><div className="text-xs text-gray-600 mb-0.5">Отметка:</div><input value={newEl} onChange={e=>setNewEl(e.target.value)} placeholder="120.00" className="w-20 border border-gray-400 px-2 py-0.5 text-xs bg-white font-mono" /></div>
              <div><div className="text-xs text-gray-600 mb-0.5">K:</div><input value={newK} onChange={e=>setNewK(e.target.value)} placeholder="—" className="w-14 border border-gray-400 px-2 py-0.5 text-xs bg-white font-mono" /></div>
              <button onClick={addPVC} className="px-3 py-1 bg-[#0078d4] text-white text-xs border border-blue-700 hover:bg-blue-700">+ ВК</button>
            </div>
          </>}

          {tab==="slopes" && <>
            <div className="space-y-2">
              <div className="border border-gray-400 bg-white">
                <div className="bg-[#d0d0d0] px-2 py-1 flex items-center gap-1 font-bold text-xs border-b border-gray-400">
                  <span className="text-blue-600">▼</span> Продольные уклоны
                </div>
                <table className="w-full text-xs">
                  <thead className="bg-[#e8e8e8] border-b border-gray-300">
                    <tr>
                      <th className="px-2 py-1 text-left font-semibold border-r border-gray-200">Участок</th>
                      <th className="px-2 py-1 text-left font-semibold border-r border-gray-200">Уклон %</th>
                      <th className="px-2 py-1 text-left font-semibold border-r border-gray-200">Длина м</th>
                      <th className="px-2 py-1 text-left font-semibold">Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { seg: "0+00 — 2+50", slope: "+2.12", len: "250.0", status: "норма", color: "text-green-700 bg-green-50" },
                      { seg: "2+50 — 5+00", slope: "-1.40", len: "250.0", status: "норма", color: "text-green-700 bg-green-50" },
                      { seg: "5+00 — 8+00", slope: "-1.13", len: "300.0", status: "предупреждение", color: "text-yellow-700 bg-yellow-50" },
                      { seg: "8+00 — 10+00", slope: "+1.25", len: "200.0", status: "критический", color: "text-red-700 bg-red-50" },
                    ].map((row,i)=>(
                      <tr key={i} className={`border-b border-gray-100 ${showCritical ? row.color : ""}`}>
                        <td className="px-2 py-1 border-r border-gray-100 font-mono">{row.seg}</td>
                        <td className="px-2 py-1 border-r border-gray-100 font-mono font-semibold">{row.slope}</td>
                        <td className="px-2 py-1 border-r border-gray-100 font-mono">{row.len}</td>
                        <td className="px-2 py-1 text-xs font-semibold">{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showCritical} onChange={e=>setShowCritical(e.target.checked)} className="accent-blue-600" />
                <span className="text-xs text-gray-700">Цветовая индикация критических участков</span>
              </label>
            </div>
          </>}

          {tab==="preview" && <>
            <div className="bg-[#1a1a2e] rounded border border-gray-600 p-2" style={{height:160}}>
              <svg width="100%" height="100%" viewBox="0 0 520 140">
                <line x1="20" y1="120" x2="500" y2="120" stroke="#444" strokeWidth="1"/>
                {def.pvcs.map((_,i)=>{
                  const x = 20 + i*(480/(def.pvcs.length-1||1))
                  return <line key={i} x1={x} y1="118" x2={x} y2="124" stroke="#666" strokeWidth="1"/>
                })}
                {def.pvcs.map((p,i)=>{
                  const x = 20 + i*(480/(def.pvcs.length-1||1))
                  const minE = Math.min(...def.pvcs.map(p=>parseFloat(p.elev)||0))
                  const maxE = Math.max(...def.pvcs.map(p=>parseFloat(p.elev)||0))
                  const range = maxE-minE || 1
                  const y = 110 - ((parseFloat(p.elev)||0)-minE)/range*80
                  return <text key={i} x={x} y="133" fill="#6b7280" fontSize="7" textAnchor="middle">{p.station}</text>
                })}
                <polyline
                  points={def.pvcs.map((p,i)=>{
                    const x = 20 + i*(480/(def.pvcs.length-1||1))
                    const minE = Math.min(...def.pvcs.map(p=>parseFloat(p.elev)||0))
                    const maxE = Math.max(...def.pvcs.map(p=>parseFloat(p.elev)||0))
                    const range = maxE-minE || 1
                    const y = 110 - ((parseFloat(p.elev)||0)-minE)/range*80
                    return `${x},${y}`
                  }).join(" ")}
                  fill="none" stroke="#f97316" strokeWidth="2"/>
                {def.pvcs.map((p,i)=>{
                  const x = 20 + i*(480/(def.pvcs.length-1||1))
                  const minE = Math.min(...def.pvcs.map(p=>parseFloat(p.elev)||0))
                  const maxE = Math.max(...def.pvcs.map(p=>parseFloat(p.elev)||0))
                  const range = maxE-minE || 1
                  const y = 110 - ((parseFloat(p.elev)||0)-minE)/range*80
                  return <g key={i}>
                    <circle cx={x} cy={y} r="3" fill="#f97316"/>
                    <text x={x} y={y-6} fill="#fb923c" fontSize="7" textAnchor="middle">{p.elev}</text>
                  </g>
                })}
                <text x="20" y="12" fill="#9ca3af" fontSize="8">Профиль: {def.name}</text>
              </svg>
            </div>
            <p className="text-[10px] text-gray-500 text-center">Предпросмотр продольного профиля. Оранжевая линия — профиль разработки.</p>
          </>}
        </div>
        <div className="flex justify-end gap-2 px-3 pb-3">
          <button onClick={()=>onOK(def)} className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">ОК</button>
          <button onClick={onClose} className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">Отмена</button>
          <button className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">Справка</button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Tree node component ─────────────────────────────────────────────────────

function TreeItem({ node, depth, selected, onSelect, onToggle, onAction }: {
  node: TreeNode; depth: number; selected: string | null
  onSelect: (id: string) => void; onToggle: (id: string) => void
  onAction?: (node: TreeNode) => void
}) {
  return (
    <>
      <div
        className={`flex items-center gap-0.5 cursor-pointer select-none transition-colors
          ${selected === node.id ? "bg-[#0078d4]" : "hover:bg-[#2a2a3e]"}`}
        style={{ paddingLeft: `${depth * 16 + 2}px`, paddingTop: 1, paddingBottom: 1, paddingRight: 4 }}
        onClick={() => onSelect(node.id)}
        onDoubleClick={() => { if (node.children) onToggle(node.id); else onAction?.(node) }}
        onContextMenu={e => { e.preventDefault(); onAction?.(node) }}
      >
        {/* expand arrow */}
        <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
          {node.children ? (
            <Icon name={node.expanded ? "ChevronDown" : "ChevronRight"} size={11}
              className="text-gray-400"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); onToggle(node.id) }} />
          ) : null}
        </span>
        {/* node icon */}
        <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
          <Icon name={node.icon} size={14} style={{ color: node.color || "#94a3b8" }} fallback="File" />
        </span>
        {/* label */}
        <span className="text-[12px] leading-5 text-gray-100 truncate ml-0.5">{node.label}</span>
      </div>
      {node.expanded && node.children?.map(child => (
        <TreeItem key={child.id} node={child} depth={depth + 1} selected={selected}
          onSelect={onSelect} onToggle={onToggle} onAction={onAction} />
      ))}
    </>
  )
}

// ─── Assembly Dialog ──────────────────────────────────────────────────────────

const ASSEMBLY_TEMPLATES = [
  {
    id: "road2",
    name: "2-полосная дорога (7 м)",
    description: "Автодорога III категории. Проезжая часть 7 м, обочины 2×2 м, откосы 1:1.5",
    preview: [
      { x: -100, y: 0, label: "" }, { x: -55, y: 0 }, { x: -35, y: 0 }, { x: 0, y: 0 }, { x: 35, y: 0 }, { x: 55, y: 0 }, { x: 100, y: 0 },
      { x: -55, y: 8 }, { x: 55, y: 8 },
    ],
    subassemblies: [
      { id: "sa1", name: "ПолосаДвижения", side: "Левый" as const, type: "Полоса движения", params: { "Ширина": "3.5", "Уклон, %": "-2.5", "Глубина покрытия, м": "0.18" } },
      { id: "sa2", name: "ПолосаДвижения", side: "Правый" as const, type: "Полоса движения", params: { "Ширина": "3.5", "Уклон, %": "2.5", "Глубина покрытия, м": "0.18" } },
      { id: "sa3", name: "Обочина", side: "Левый" as const, type: "Обочина укреплённая", params: { "Ширина": "2.0", "Уклон, %": "-4.0", "Тип укрепления": "Засев травой" } },
      { id: "sa4", name: "Обочина", side: "Правый" as const, type: "Обочина укреплённая", params: { "Ширина": "2.0", "Уклон, %": "4.0", "Тип укрепления": "Засев травой" } },
      { id: "sa5", name: "ОткосНасыпи", side: "Левый" as const, type: "Откос насыпи", params: { "Заложение": "1.5", "Высота, м": "авто" } },
      { id: "sa6", name: "ОткосНасыпи", side: "Правый" as const, type: "Откос насыпи", params: { "Заложение": "1.5", "Высота, м": "авто" } },
    ] as SubassemblyItem[]
  },
  {
    id: "road4",
    name: "4-полосная магистраль (28 м)",
    description: "Магистральная улица районного значения. Разделительная полоса 4 м, 4 полосы по 3.5 м",
    subassemblies: [
      { id: "sa1", name: "ПолосаДвижения_Л1", side: "Левый" as const, type: "Полоса движения", params: { "Ширина": "3.5", "Уклон, %": "-2.0" } },
      { id: "sa2", name: "ПолосаДвижения_Л2", side: "Левый" as const, type: "Полоса движения", params: { "Ширина": "3.5", "Уклон, %": "-2.0" } },
      { id: "sa3", name: "ПолосаДвижения_П1", side: "Правый" as const, type: "Полоса движения", params: { "Ширина": "3.5", "Уклон, %": "2.0" } },
      { id: "sa4", name: "ПолосаДвижения_П2", side: "Правый" as const, type: "Полоса движения", params: { "Ширина": "3.5", "Уклон, %": "2.0" } },
      { id: "sa5", name: "РазделительнаяПолоса", side: "Обе стороны" as const, type: "Разделительная полоса", params: { "Ширина": "2.0", "Тип": "Газон с бордюром" } },
      { id: "sa6", name: "Бордюр", side: "Левый" as const, type: "Бордюр", params: { "Тип": "Бортовой камень 100×300" } },
      { id: "sa7", name: "Бордюр", side: "Правый" as const, type: "Бордюр", params: { "Тип": "Бортовой камень 100×300" } },
      { id: "sa8", name: "Тротуар", side: "Левый" as const, type: "Тротуар", params: { "Ширина": "3.0", "Уклон, %": "-2.0" } },
      { id: "sa9", name: "Тротуар", side: "Правый" as const, type: "Тротуар", params: { "Ширина": "3.0", "Уклон, %": "2.0" } },
    ] as SubassemblyItem[]
  },
  {
    id: "ramp",
    name: "Съезд / пандус",
    description: "Съезд с дороги или пандус. Переменная ширина, сопряжение с основной трассой",
    subassemblies: [
      { id: "sa1", name: "ПолосаСъезда", side: "Правый" as const, type: "Полоса движения", params: { "Ширина": "4.5", "Уклон, %": "2.5" } },
      { id: "sa2", name: "Кромка", side: "Правый" as const, type: "Обочина укреплённая", params: { "Ширина": "1.0", "Уклон, %": "6.0" } },
      { id: "sa3", name: "ОткосСъезда", side: "Правый" as const, type: "Откос насыпи", params: { "Заложение": "2.0" } },
    ] as SubassemblyItem[]
  },
  {
    id: "railway",
    name: "Ж/д насыпь (1 путь)",
    description: "Однопутная ж/д насыпь по нормам СП 119. Балластный слой, берма, откос 1:1.5",
    subassemblies: [
      { id: "sa1", name: "Балласт", side: "Обе стороны" as const, type: "Балластный слой", params: { "Ширина основания, м": "4.6", "Глубина, м": "0.45", "Материал": "Щебень фр.25-60" } },
      { id: "sa2", name: "Берма", side: "Левый" as const, type: "Берма", params: { "Ширина": "0.5" } },
      { id: "sa3", name: "Берма", side: "Правый" as const, type: "Берма", params: { "Ширина": "0.5" } },
      { id: "sa4", name: "ОткосНасыпи_Л", side: "Левый" as const, type: "Откос насыпи", params: { "Заложение": "1.5" } },
      { id: "sa5", name: "ОткосНасыпи_П", side: "Правый" as const, type: "Откос насыпи", params: { "Заложение": "1.5" } },
      { id: "sa6", name: "КюветНасыпи_Л", side: "Левый" as const, type: "Кювет", params: { "Ширина дна": "0.4", "Глубина": "0.6", "Заложение": "1.5" } },
      { id: "sa7", name: "КюветНасыпи_П", side: "Правый" as const, type: "Кювет", params: { "Ширина дна": "0.4", "Глубина": "0.6", "Заложение": "1.5" } },
    ] as SubassemblyItem[]
  },
  {
    id: "canal",
    name: "Открытый канал (трапеция)",
    description: "Ирригационный или дренажный канал трапециевидного сечения. Укрепление откосов",
    subassemblies: [
      { id: "sa1", name: "ДноКанала", side: "Обе стороны" as const, type: "Дно канала", params: { "Ширина дна, м": "2.0", "Поперечный уклон, %": "0.0" } },
      { id: "sa2", name: "ОткосКанала_Л", side: "Левый" as const, type: "Откос выемки", params: { "Заложение": "1.5", "Укрепление": "Монолитный бетон" } },
      { id: "sa3", name: "ОткосКанала_П", side: "Правый" as const, type: "Откос выемки", params: { "Заложение": "1.5", "Укрепление": "Монолитный бетон" } },
      { id: "sa4", name: "БерегоукреплениеТело_Л", side: "Левый" as const, type: "Берма", params: { "Ширина": "2.0" } },
      { id: "sa5", name: "БерегоукреплениеТело_П", side: "Правый" as const, type: "Берма", params: { "Ширина": "2.0" } },
    ] as SubassemblyItem[]
  },
]

const SA_TYPES = [
  "Полоса движения","Обочина укреплённая","Обочина грунтовая",
  "Откос насыпи","Откос выемки","Бордюр","Тротуар",
  "Велодорожка","Разделительная полоса","Кювет",
  "Балластный слой","Берма","Дно канала","Газон",
  "Слой дорожной одежды","Субосновной слой",
]

function drawAssemblyPreview(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  subs: SubassemblyItem[]
) {
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = "#1a1a2e"; ctx.fillRect(0, 0, W, H)
  const cx = W / 2, cy = H * 0.55, sc = W / 22

  // ground line
  ctx.strokeStyle = "#4b5563"; ctx.lineWidth = 1; ctx.setLineDash([4, 3])
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke()
  ctx.setLineDash([])

  // center mark
  ctx.strokeStyle = "#6b7280"; ctx.lineWidth = 0.8
  ctx.beginPath(); ctx.moveTo(cx, cy - 6); ctx.lineTo(cx, cy + 6); ctx.stroke()
  ctx.fillStyle = "#9ca3af"; ctx.font = "8px monospace"; ctx.textAlign = "center"
  ctx.fillText("ОЛ", cx, cy - 9)

  // count left/right widths
  let leftW = 0, rightW = 0
  subs.forEach(s => {
    const w = parseFloat(s.params["Ширина"] || s.params["Ширина основания, м"] || "3") * sc
    if (s.side === "Левый") leftW += w
    else if (s.side === "Правый") rightW += w
    else { leftW += w / 2; rightW += w / 2 }
  })

  // draw surface shape
  const COLORS: Record<string, string> = {
    "Полоса движения": "#374151",
    "Обочина укреплённая": "#4b5563",
    "Обочина грунтовая": "#6b7280",
    "Откос насыпи": "#78350f",
    "Откос выемки": "#92400e",
    "Бордюр": "#1f2937",
    "Тротуар": "#6b7280",
    "Велодорожка": "#1e40af",
    "Разделительная полоса": "#14532d",
    "Кювет": "#1e3a5f",
    "Балластный слой": "#374151",
    "Берма": "#4b5563",
    "Дно канала": "#1e3a5f",
    "Газон": "#14532d",
    "Слой дорожной одежды": "#1c1917",
    "Субосновной слой": "#292524",
  }
  const LABELS: Record<string, string> = {
    "Полоса движения": "ПД", "Обочина укреплённая": "Об", "Откос насыпи": "Отк",
    "Откос выемки": "Отк", "Бордюр": "Бд", "Тротуар": "Тр",
    "Разделительная полоса": "РП", "Кювет": "Кв", "Балластный слой": "Бл",
    "Берма": "Бм", "Дно канала": "Дн", "Газон": "Гз",
  }

  let lx = cx, rx = cx
  subs.forEach(s => {
    const w = parseFloat(s.params["Ширина"] || s.params["Ширина основания, м"] || "3") * sc
    const slope = parseFloat(s.params["Заложение"] || "0")
    const isSlope = s.type.includes("Откос") || s.type === "Кювет" || s.type === "Дно канала"
    const col = COLORS[s.type] || "#374151"
    const depth = 14

    const drawSide = (startX: number, dir: 1 | -1) => {
      const x0 = startX, x1 = startX + dir * w
      const slopeH = isSlope ? Math.min(w * 0.7, 20) : 0
      ctx.fillStyle = col
      ctx.beginPath()
      ctx.moveTo(x0, cy)
      ctx.lineTo(x1, cy - slopeH)
      ctx.lineTo(x1, cy - slopeH + depth)
      ctx.lineTo(x0, cy + depth)
      ctx.closePath(); ctx.fill()
      ctx.strokeStyle = "#60a5fa"; ctx.lineWidth = 0.5; ctx.stroke()
      ctx.fillStyle = "#d1d5db"; ctx.font = "7px Arial"; ctx.textAlign = "center"
      ctx.fillText(LABELS[s.type] || s.type.slice(0, 2), (x0 + x1) / 2, cy - slopeH / 2 + 4)
      // dimension
      ctx.strokeStyle = "#4b5563"; ctx.lineWidth = 0.5
      ctx.beginPath(); ctx.moveTo(x0, cy - slopeH - 8); ctx.lineTo(x1, cy - slopeH - 8); ctx.stroke()
      ctx.fillStyle = "#9ca3af"; ctx.font = "7px monospace"; ctx.textAlign = "center"
      ctx.fillText(`${(w / sc).toFixed(1)}м`, (x0 + x1) / 2, cy - slopeH - 11)
      return x1
    }

    if (s.side === "Левый") { lx = drawSide(lx, -1) }
    else if (s.side === "Правый") { rx = drawSide(rx, 1) }
    else { lx = drawSide(lx, -1); rx = drawSide(rx, 1) }
  })

  // road surface top
  ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(lx, cy); ctx.lineTo(cx, cy); ctx.lineTo(rx, cy); ctx.stroke()
}

function AssemblyDialog({ onClose, onOK }: {
  onClose: () => void
  onOK: (d: AssemblyDef) => void
}) {
  const [tab, setTab] = useState<"info" | "subs" | "template" | "params">("template")
  const [def, setDef] = useState<AssemblyDef>({
    name: "Типовое сечение 1",
    description: "",
    style: "Базовый",
    layer: "С-ДОРОГА-ТС",
    markerStyle: "Базовый",
    defaultOffset: "0.000",
    defaultElevAdj: "0.000",
    subassemblies: ASSEMBLY_TEMPLATES[0].subassemblies,
  })
  const [selSub, setSelSub] = useState<string | null>(null)
  const [selTemplate, setSelTemplate] = useState<string>("road2")
  const canvasRef2 = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = canvasRef2.current; if (!c) return
    c.width = c.offsetWidth; c.height = c.offsetHeight
    const ctx = c.getContext("2d")!
    drawAssemblyPreview(ctx, c.width, c.height, def.subassemblies)
  }, [def.subassemblies, tab])

  const applyTemplate = (id: string) => {
    const tpl = ASSEMBLY_TEMPLATES.find(t => t.id === id)
    if (!tpl) return
    setSelTemplate(id)
    setDef(d => ({ ...d, name: tpl.name, description: tpl.description, subassemblies: tpl.subassemblies }))
  }

  const addSub = () => {
    const ns: SubassemblyItem = {
      id: `sa_${Date.now()}`, name: "НовоеПодсечение", side: "Правый", type: "Полоса движения",
      params: { "Ширина": "3.5", "Уклон, %": "2.0" }
    }
    setDef(d => ({ ...d, subassemblies: [...d.subassemblies, ns] }))
    setSelSub(ns.id)
  }

  const removeSub = (id: string) => {
    setDef(d => ({ ...d, subassemblies: d.subassemblies.filter(s => s.id !== id) }))
    setSelSub(null)
  }

  const updateSub = (id: string, patch: Partial<SubassemblyItem>) => {
    setDef(d => ({ ...d, subassemblies: d.subassemblies.map(s => s.id === id ? { ...s, ...patch } : s) }))
  }

  const updateParam = (id: string, key: string, val: string) => {
    setDef(d => ({ ...d, subassemblies: d.subassemblies.map(s => s.id === id ? { ...s, params: { ...s.params, [key]: val } } : s) }))
  }

  const selSubData = def.subassemblies.find(s => s.id === selSub)

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
        className="bg-[#f0f0f0] border border-gray-400 shadow-2xl flex flex-col"
        style={{ fontFamily: "Arial, sans-serif", fontSize: 12, width: 700, maxHeight: "92vh" }}>

        {/* Title */}
        <div className="flex items-center justify-between bg-[#0078d4] px-3 py-1.5 flex-shrink-0">
          <span className="text-white font-bold text-sm">Создать типовое сечение</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 w-5 h-5 flex items-center justify-center">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-300 bg-[#e8e8e8] flex-shrink-0">
          {([["template","Типовые схемы"],["info","Информация"],["subs","Подсечения"],["params","Параметры"]] as [typeof tab, string][]).map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-xs font-semibold border-r border-gray-300 transition-colors ${tab === t ? "bg-white text-blue-700 border-b-2 border-blue-600" : "text-gray-600 hover:bg-gray-100"}`}>
              {l}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* ─── Типовые схемы ─── */}
          {tab === "template" && (
            <div className="flex h-full" style={{ minHeight: 380 }}>
              {/* Template list */}
              <div className="w-56 border-r border-gray-300 bg-[#f8f8f8] flex-shrink-0">
                <div className="bg-[#d8d8d8] px-2 py-1 text-[10px] font-bold text-gray-600 uppercase tracking-wide border-b border-gray-300">
                  Выберите схему
                </div>
                {ASSEMBLY_TEMPLATES.map(tpl => (
                  <div key={tpl.id} onClick={() => applyTemplate(tpl.id)}
                    className={`px-3 py-2 cursor-pointer border-b border-gray-200 transition-colors ${selTemplate === tpl.id ? "bg-[#cce4ff] border-l-2 border-l-blue-600" : "hover:bg-gray-100"}`}>
                    <div className="text-xs font-semibold text-gray-800">{tpl.name}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{tpl.description.slice(0, 55)}…</div>
                  </div>
                ))}
              </div>
              {/* Preview + info */}
              <div className="flex-1 flex flex-col p-3 gap-2">
                {/* Canvas preview */}
                <div className="border border-gray-400 bg-[#1a1a2e] rounded" style={{ height: 140 }}>
                  <canvas ref={canvasRef2} className="w-full h-full block" style={{ borderRadius: 4 }} />
                </div>
                {/* Template description */}
                {(() => {
                  const tpl = ASSEMBLY_TEMPLATES.find(t => t.id === selTemplate)
                  return tpl ? (
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-gray-800">{tpl.name}</div>
                      <div className="text-[11px] text-gray-600">{tpl.description}</div>
                      <div className="border border-gray-300 bg-white rounded">
                        <div className="bg-[#e0e0e0] px-2 py-0.5 text-[10px] font-bold text-gray-700 border-b border-gray-300">
                          Состав подсечений ({tpl.subassemblies.length} эл.)
                        </div>
                        <div className="max-h-28 overflow-y-auto">
                          {tpl.subassemblies.map((s, i) => (
                            <div key={i} className={`flex items-center px-2 py-1 text-[11px] border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                              <span className="w-5 text-gray-400 text-[10px]">{i + 1}.</span>
                              <span className="w-40 font-mono text-gray-700">{s.name}</span>
                              <span className="flex-1 text-gray-500">{s.type}</span>
                              <span className={`text-[10px] px-1 rounded ${s.side === "Левый" ? "bg-blue-100 text-blue-700" : s.side === "Правый" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                                {s.side}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null
                })()}
                <button onClick={() => setTab("subs")}
                  className="self-start mt-auto px-4 py-1 bg-[#0078d4] text-white text-xs font-semibold hover:bg-blue-700 rounded">
                  Применить схему и редактировать →
                </button>
              </div>
            </div>
          )}

          {/* ─── Информация ─── */}
          {tab === "info" && (
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <label className="w-36 text-xs text-gray-700 shrink-0">Название:</label>
                <input value={def.name} onChange={e => setDef(d => ({ ...d, name: e.target.value }))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
                <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">⋯</button>
              </div>
              <div className="flex items-start gap-2">
                <label className="w-36 text-xs text-gray-700 shrink-0 mt-1">Описание:</label>
                <textarea value={def.description} onChange={e => setDef(d => ({ ...d, description: e.target.value }))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white h-12 resize-none" />
              </div>
              {[
                ["Стиль типового сечения:", "style", ["Базовый","Без отображения","Разработка","Существующий"]],
                ["Стиль маркеров:", "markerStyle", ["Базовый","Точки","Без маркеров"]],
              ].map(([lbl, field, opts]) => (
                <div key={field as string} className="flex items-center gap-2">
                  <label className="w-36 text-xs text-gray-700 shrink-0">{lbl as string}</label>
                  <select value={(def as Record<string,string>)[field as string]} onChange={e => setDef(d => ({ ...d, [field as string]: e.target.value }))} className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
                    {(opts as string[]).map(o => <option key={o}>{o}</option>)}
                  </select>
                  <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">✎</button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <label className="w-36 text-xs text-gray-700 shrink-0">Слой:</label>
                <input value={def.layer} onChange={e => setDef(d => ({ ...d, layer: e.target.value }))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
              </div>
              <div className="flex gap-3">
                {[["Смещение по умолчанию:", "defaultOffset"],["Поправка по высоте:", "defaultElevAdj"]].map(([lbl, field]) => (
                  <div key={field} className="flex items-center gap-1 flex-1">
                    <label className="text-xs text-gray-700 shrink-0">{lbl}</label>
                    <input value={(def as Record<string,string>)[field]} onChange={e => setDef(d => ({ ...d, [field]: e.target.value }))} className="w-20 border border-gray-400 px-2 py-0.5 text-xs bg-white font-mono" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Подсечения ─── */}
          {tab === "subs" && (
            <div className="flex" style={{ minHeight: 380 }}>
              {/* Left: list */}
              <div className="w-64 border-r border-gray-300 flex flex-col flex-shrink-0">
                <div className="bg-[#d8d8d8] px-2 py-1 flex items-center justify-between border-b border-gray-300">
                  <span className="text-[10px] font-bold text-gray-700 uppercase">Подсечения</span>
                  <div className="flex gap-1">
                    <button onClick={addSub} className="px-2 py-0.5 bg-[#0078d4] text-white text-[10px] hover:bg-blue-700">+ Добавить</button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {def.subassemblies.map((s, i) => (
                    <div key={s.id} onClick={() => setSelSub(s.id)}
                      className={`flex items-center px-2 py-1.5 cursor-pointer border-b border-gray-100 transition-colors ${selSub === s.id ? "bg-[#cce4ff]" : i % 2 === 0 ? "bg-white hover:bg-blue-50" : "bg-gray-50 hover:bg-blue-50"}`}>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-800 truncate">{s.name}</div>
                        <div className="text-[10px] text-gray-500">{s.type}</div>
                      </div>
                      <span className={`text-[9px] px-1 rounded mr-1 flex-shrink-0 ${s.side === "Левый" ? "bg-blue-100 text-blue-700" : s.side === "Правый" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                        {s.side === "Левый" ? "Л" : s.side === "Правый" ? "П" : "ОС"}
                      </span>
                      <button onClick={e => { e.stopPropagation(); removeSub(s.id) }} className="text-gray-400 hover:text-red-500 text-xs ml-1">✕</button>
                    </div>
                  ))}
                </div>
              </div>
              {/* Right: editor + preview */}
              <div className="flex-1 flex flex-col gap-2 p-3">
                {/* Preview */}
                <div className="border border-gray-400 bg-[#1a1a2e] rounded" style={{ height: 120 }}>
                  <canvas ref={canvasRef2} className="w-full h-full block" style={{ borderRadius: 4 }} />
                </div>
                {selSubData ? (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-gray-700 border-b border-gray-300 pb-1">{selSubData.name} — редактирование</div>
                    <div className="flex items-center gap-2">
                      <label className="w-28 text-xs text-gray-700 shrink-0">Имя:</label>
                      <input value={selSubData.name} onChange={e => updateSub(selSubData.id, { name: e.target.value })} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="w-28 text-xs text-gray-700 shrink-0">Тип подсечения:</label>
                      <select value={selSubData.type} onChange={e => updateSub(selSubData.id, { type: e.target.value })} className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
                        {SA_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="w-28 text-xs text-gray-700 shrink-0">Сторона:</label>
                      <select value={selSubData.side} onChange={e => updateSub(selSubData.id, { side: e.target.value as SubassemblyItem["side"] })} className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
                        {["Левый","Правый","Обе стороны"].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="border border-gray-300 bg-white">
                      <div className="bg-[#e8e8e8] px-2 py-0.5 text-[10px] font-bold text-gray-700 border-b border-gray-300">Параметры</div>
                      {Object.entries(selSubData.params).map(([k, v]) => (
                        <div key={k} className="flex items-center px-2 py-1 border-b border-gray-100">
                          <span className="w-40 text-xs text-gray-700">{k}:</span>
                          <input value={v} onChange={e => updateParam(selSubData.id, k, e.target.value)} className="flex-1 border border-gray-300 px-2 py-0.5 text-xs bg-white font-mono" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 text-center py-6">Выберите подсечение для редактирования</div>
                )}
              </div>
            </div>
          )}

          {/* ─── Параметры ─── */}
          {tab === "params" && (
            <div className="p-3 space-y-3">
              <div className="text-xs font-bold text-gray-700 border-b border-gray-300 pb-1">Параметры построения коридора</div>
              {[
                { label: "Метод интерполяции откосов:", options: ["Линейная","По поверхности","Фиксированная отметка"] },
                { label: "Тип кювета:", options: ["Треугольный","Трапециевидный","Параболический","Без кювета"] },
                { label: "Поведение при пересечениях:", options: ["Автоматически","Приоритет основной трассы","Игнорировать"] },
                { label: "Расчёт объёмов:", options: ["Метод средних площадей","Метод призматоида","Без расчёта"] },
              ].map(({ label, options }) => (
                <div key={label} className="flex items-center gap-2">
                  <label className="w-52 text-xs text-gray-700 shrink-0">{label}</label>
                  <select className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
                    {options.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div className="border border-gray-300 bg-white p-2 rounded mt-2 space-y-1">
                <div className="text-xs font-bold text-gray-700 mb-1">Допуски</div>
                {[
                  ["Допуск по высоте, м:", "0.001"],
                  ["Допуск по горизонтали, м:", "0.001"],
                  ["Макс. шаг разбивки, м:", "5.000"],
                ].map(([lbl, val]) => (
                  <div key={lbl as string} className="flex items-center gap-2">
                    <label className="w-48 text-xs text-gray-600">{lbl}</label>
                    <input defaultValue={val as string} className="w-20 border border-gray-300 px-2 py-0.5 text-xs bg-white font-mono" />
                  </div>
                ))}
              </div>
              <div className="flex gap-4 pt-1">
                {[
                  ["Создавать точки на бровках", true],
                  ["Отображать коды подсечений", true],
                  ["Строить поверхность верха", false],
                  ["Строить поверхность низа", false],
                ].map(([lbl, def]) => (
                  <label key={lbl as string} className="flex items-center gap-1.5 text-xs cursor-pointer text-gray-700">
                    <input type="checkbox" defaultChecked={def as boolean} className="accent-blue-600" />
                    {lbl as string}
                  </label>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 px-3 py-2 border-t border-gray-300 bg-[#e8e8e8] flex-shrink-0">
          <button onClick={() => onOK(def)} className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">ОК</button>
          <button onClick={onClose} className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">Отмена</button>
          <button className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">Справка</button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Create Corridor Dialog ──────────────────────────────────────────────────

function CorridorDialog({ onClose, onOK }: { onClose: () => void; onOK: (d: CorridorDef) => void }) {
  const [def, setDef] = useState<CorridorDef>({
    name: "Дорога и парковочная зона", description: "", style: "Базовый",
    codeStyle: "Все коды", layer: "С-ДОРОГА-КОР", template: "",
    targetSurface: "<нет>",
    rows: [
      { alignment: "Трасса ШД-38", profile: "ПРОЕКТ_ШД-38", assembly: "Трасса ШД-38" },
      { alignment: "Ул. Трумана", profile: "Проект_Трумана", assembly: "Ул. Трумана" },
      { alignment: "*Нет*", profile: "*Нет*", assembly: "*Нет*" },
    ],
    features: FEATURE_LINES,
  })
  const [selFeature, setSelFeature] = useState<string | null>("Бордюр пр.ч. Лев. 7")
  const [featureDropdown, setFeatureDropdown] = useState<string | null>(null)

  const updateRow = (i: number, field: keyof CorridorRow, val: string) => {
    const rows = [...def.rows]; rows[i] = { ...rows[i], [field]: val }
    setDef(d => ({ ...d, rows }))
  }

  const updateFeature = (name: string, assembly: string) => {
    const features = def.features.map(f => f.name === name ? { ...f, assembly } : f)
    setDef(d => ({ ...d, features }))
    setFeatureDropdown(null)
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
        className="bg-[#f0f0f0] border border-gray-400 shadow-2xl flex flex-col"
        style={{ fontFamily: "Arial, sans-serif", fontSize: 12, width: "min(540px, 94vw)", maxHeight: "85vh" }}
        onClick={e=>e.stopPropagation()}
      >
        {/* title */}
        <div className="flex items-center justify-between bg-[#0078d4] px-3 py-1.5 flex-shrink-0">
          <span className="text-white font-bold text-sm">Создать коридор</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 w-6 h-6 flex items-center justify-center text-sm rounded">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 min-h-0">

        <div className="p-3 space-y-2">
          {/* Name */}
          <div className="flex items-center gap-2">
            <label className="w-24 text-xs text-gray-700 shrink-0">Название:</label>
            <input value={def.name} onChange={e => setDef(d => ({...d, name: e.target.value}))}
              className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
            <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs flex items-center justify-center">⋯</button>
          </div>
          {/* Description */}
          <div className="flex items-start gap-2">
            <label className="w-24 text-xs text-gray-700 shrink-0 mt-1">Описание:</label>
            <textarea value={def.description} onChange={e => setDef(d => ({...d, description: e.target.value}))}
              className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white h-10 resize-none" />
          </div>
          {/* Corridor style */}
          <div className="flex items-center gap-2">
            <label className="w-24 text-xs text-gray-700 shrink-0">Стиль коридора:</label>
            <select value={def.style} onChange={e => setDef(d => ({...d, style: e.target.value}))}
              className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
              {STYLES.map(s => <option key={s}>{s}</option>)}
            </select>
            <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">⋯</button>
            <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">✎</button>
            <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">+</button>
          </div>
          {/* Code set style */}
          <div className="flex items-center gap-2">
            <label className="w-24 text-xs text-gray-700 shrink-0">Стиль кодов:</label>
            <select value={def.codeStyle} onChange={e => setDef(d => ({...d, codeStyle: e.target.value}))}
              className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
              {CODE_STYLES.map(s => <option key={s}>{s}</option>)}
            </select>
            <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">⋯</button>
            <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">✎</button>
          </div>
          {/* Corridor layer */}
          <div className="flex items-center gap-2">
            <label className="w-24 text-xs text-gray-700 shrink-0">Слой коридора:</label>
            <input value={def.layer} onChange={e => setDef(d => ({...d, layer: e.target.value}))}
              className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
            <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">✎</button>
          </div>
          {/* Corridor Template */}
          <div className="flex items-center gap-2">
            <label className="w-24 text-xs text-gray-700 shrink-0">Шаблон коридора:</label>
            <input value={def.template} onChange={e => setDef(d => ({...d, template: e.target.value}))}
              className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
            <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">⋯</button>
          </div>
          {/* Target Surface */}
          <div className="flex items-center gap-2">
            <label className="w-24 text-xs text-gray-700 shrink-0">Целев. поверхность:</label>
            <select value={def.targetSurface} onChange={e => setDef(d => ({...d, targetSurface: e.target.value}))}
              className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
              {SURFACES.map(s => <option key={s}>{s}</option>)}
            </select>
            <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">⋯</button>
          </div>

          {/* Alignments and profiles */}
          <div className="border border-gray-400 bg-white">
            <div className="bg-[#d0d0d0] px-2 py-1 flex items-center gap-1 font-bold text-xs border-b border-gray-400">
              <span className="text-blue-600 cursor-pointer">▼</span> Трассы и профили
            </div>
            <table className="w-full text-xs">
              <thead className="bg-[#e8e8e8] border-b border-gray-300">
                <tr>
                  <th className="px-2 py-1 text-left font-semibold border-r border-gray-300 w-36">Трасса</th>
                  <th className="px-2 py-1 text-left font-semibold border-r border-gray-300">Профиль</th>
                  <th className="px-2 py-1 text-left font-semibold">Тип. сечение</th>
                </tr>
              </thead>
              <tbody>
                {def.rows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-200 hover:bg-blue-50">
                    <td className="px-1 py-0.5 border-r border-gray-200">
                      <select value={row.alignment} onChange={e => updateRow(i, "alignment", e.target.value)}
                        className="w-full bg-transparent text-xs outline-none">
                        {["Трасса ШД-38","Ул. Трумана","*Нет*"].map(a => <option key={a}>{a}</option>)}
                      </select>
                    </td>
                    <td className="px-1 py-0.5 border-r border-gray-200">
                      <select value={row.profile} onChange={e => updateRow(i, "profile", e.target.value)}
                        className="w-full bg-transparent text-xs outline-none">
                        {(PROFILES[row.alignment] || ["*None*"]).map(p => <option key={p}>{p}</option>)}
                      </select>
                    </td>
                    <td className="px-1 py-0.5">
                      <select value={row.assembly} onChange={e => updateRow(i, "assembly", e.target.value)}
                        className="w-full bg-transparent text-xs outline-none">
                        {ASSEMBLIES.map(a => <option key={a}>{a}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Feature lines */}
          <div className="border border-gray-400 bg-white">
            <div className="bg-[#d0d0d0] px-2 py-1 flex items-center gap-2 font-bold text-xs border-b border-gray-400">
              <span className="text-blue-600 cursor-pointer">▼</span> Характерные линии
              <span className="ml-auto text-gray-500">Фильтр выбора</span>
            </div>
            <div className="flex items-center gap-1 bg-[#e8e8e8] border-b border-gray-300 text-xs font-semibold px-2 py-0.5">
              <span className="flex-1">Хар. линия</span>
              <span className="w-40">Тип. сечение</span>
            </div>
            <div className="max-h-40 overflow-y-auto">
              {def.features.map(f => (
                <div key={f.name} onClick={() => setSelFeature(f.name)}
                  className={`flex items-center gap-1 px-2 py-0.5 text-xs cursor-pointer border-b border-gray-100 relative ${selFeature === f.name ? "bg-blue-600 text-white" : "hover:bg-blue-50"}`}>
                  <span className="flex-1 truncate">{f.name}</span>
                  <div className="w-40 flex items-center gap-1 relative">
                    <span className="flex-1 truncate">{f.assembly}</span>
                    <button
                      className={`text-[10px] px-1 border ${selFeature === f.name ? "border-blue-300 bg-blue-700" : "border-gray-300 bg-[#e8e8e8]"}`}
                      onClick={e => { e.stopPropagation(); setFeatureDropdown(featureDropdown === f.name ? null : f.name) }}
                    >▾</button>
                    {featureDropdown === f.name && (
                      <div className="absolute top-5 right-0 z-50 bg-white border border-gray-400 shadow-xl min-w-36" style={{ color: "#333" }}>
                        {ASSEMBLIES.map(a => (
                          <div key={a} onClick={() => updateFeature(f.name, a)}
                            className={`px-3 py-1 text-xs cursor-pointer hover:bg-blue-600 hover:text-white ${f.assembly === a ? "bg-blue-500 text-white" : ""}`}>
                            {a}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checkbox */}
          <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
            <input type="checkbox" defaultChecked className="accent-blue-600" />
            Задать параметры базовой линии и области
          </label>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => onOK(def)}
              className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0] active:bg-gray-300">
              ОК
            </button>
            <button onClick={onClose}
              className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">
              Отмена
            </button>
            <button className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">
              Справка
            </button>
          </div>
        </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Cross Section Panel ─────────────────────────────────────────────────────

function CrossSectionPanel({ alignments, onClose }: { alignments: string[]; onClose?: () => void }) {
  const [minimized, setMinimized] = useState(false)
  const canvases = alignments.slice(0, 3)
  return (
    <div className="bg-[#1a1a2e] border-l border-gray-700 w-72 flex flex-col overflow-hidden">
      <div className="bg-[#252540] px-2 py-1 flex items-center justify-between border-b border-gray-700">
        <span className="text-gray-300 text-xs font-mono">Виды поперечников</span>
        <div className="flex gap-1">
          <button onClick={() => setMinimized(m => !m)} className="text-gray-400 hover:text-white text-xs px-1" title="Свернуть">─</button>
          <button onClick={() => setMinimized(false)} className="text-gray-400 hover:text-white text-xs px-1" title="Развернуть">□</button>
          <button onClick={onClose} className="text-gray-400 hover:text-red-400 text-xs px-1" title="Закрыть">✕</button>
        </div>
      </div>
      {minimized && <div className="flex-1 flex items-center justify-center text-xs text-gray-600 cursor-pointer" onClick={() => setMinimized(false)}>Панель свёрнута — нажмите □ чтобы развернуть</div>}
      {!minimized && <div className="flex-1 overflow-y-auto divide-y divide-gray-800">
        {(canvases.length ? canvases : ["Трасса ШД-38","Ул. Трумана"]).map((name, i) => (
          <CrossSectionView key={name} name={name} index={i} />
        ))}
        <div className="p-3 text-center">
          <div className="text-[#06b6d4] text-xs font-mono font-bold border border-[#06b6d4] px-3 py-1 inline-block">БОРДЮР ПЕРИМЕТРА</div>
          <CrossSectionView name="Бордюр периметра" index={2} />
          <div className="text-[#06b6d4] text-xs font-mono mt-1">V-ОБРАЗНЫЙ ЛОТОК</div>
        </div>
      </div>}
    </div>
  )
}

function CrossSectionView({ name, index }: { name: string; index: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    c.width = c.offsetWidth || 240; c.height = 80
    const ctx = c.getContext("2d")!
    const W = c.width, H = c.height
    ctx.fillStyle = "#1a1a2e"; ctx.fillRect(0, 0, W, H)
    // axes
    ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 0.5
    ctx.beginPath(); ctx.moveTo(10, H-10); ctx.lineTo(W-10, H-10); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(W/2, 5); ctx.lineTo(W/2, H-10); ctx.stroke()
    // profile shape
    const colors = ["#f97316","#a855f7","#06b6d4"]
    const color = colors[index % 3]
    ctx.strokeStyle = color; ctx.lineWidth = 1.5
    const pts: [number,number][] = []
    if (index === 0) pts.push(...[[10,65],[40,65],[55,50],[70,45],[W/2,42],[W/2+10,44],[W-55,50],[W-40,65],[W-10,65]] as [number,number][])
    else if (index === 1) pts.push(...[[10,60],[35,60],[50,52],[W/2-5,48],[W/2+5,48],[W-50,52],[W-35,60],[W-10,60]] as [number,number][])
    else pts.push(...[[10,62],[W/2-30,55],[W/2,50],[W/2+30,55],[W-10,62]] as [number,number][])
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1])
    pts.slice(1).forEach(p => ctx.lineTo(p[0], p[1])); ctx.stroke()
    // fill
    ctx.beginPath(); ctx.moveTo(pts[0][0], H-10)
    pts.forEach(p => ctx.lineTo(p[0], p[1]))
    ctx.lineTo(pts[pts.length-1][0], H-10); ctx.closePath()
    ctx.fillStyle = color + "30"; ctx.fill()
    // label
    ctx.fillStyle = color; ctx.font = "bold 9px monospace"; ctx.textAlign = "center"
    ctx.fillText(name.toUpperCase(), W/2, 14)
    ctx.textAlign = "left"
    // tick marks
    ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 0.5
    for (let x = 20; x < W; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, H-10); ctx.lineTo(x, H-6); ctx.stroke()
    }
  }, [name, index])
  return <canvas ref={ref} className="w-full" style={{ height: 80 }} />
}

// ─── Points Dialog ───────────────────────────────────────────────────────────
function PointsDialog({ onClose, onOK }: { onClose: () => void; onOK: (pts: {name:string;x:string;y:string;z:string}[]) => void }) {
  const [rows, setRows] = useState([{name:"ТЧК-1",x:"100.000",y:"200.000",z:"15.340"},{name:"ТЧК-2",x:"250.500",y:"310.200",z:"16.120"},{name:"ТЧК-3",x:"400.000",y:"150.000",z:"14.870"}])
  const upd = (i:number,f:string,v:string) => setRows(r=>r.map((row,idx)=>idx===i?{...row,[f as keyof typeof row]:v}:row))
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#2d2d3d] border border-gray-600 rounded shadow-2xl w-[520px]">
        <div className="bg-[#1a1a2e] px-3 py-1.5 flex items-center justify-between border-b border-gray-700">
          <span className="text-[11px] font-bold text-white">Создать точки — вручную</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xs">✕</button>
        </div>
        <div className="p-3">
          <table className="w-full text-[11px] border-collapse mb-3">
            <thead><tr className="bg-[#1e1e2e]">
              {["Имя","X (Восток)","Y (Север)","Z (Отм.)"].map(h=><th key={h} className="text-left px-2 py-1 text-gray-400 border border-gray-700">{h}</th>)}
            </tr></thead>
            <tbody>{rows.map((r,i)=>(
              <tr key={i}>{["name","x","y","z"].map(f=>(
                <td key={f} className="border border-gray-700 p-0">
                  <input value={r[f as keyof typeof r]} onChange={e=>upd(i,f,e.target.value)}
                    className="w-full bg-transparent text-gray-200 px-2 py-1 outline-none focus:bg-[#0078d4]/20 font-mono text-[10px]"/>
                </td>
              ))}</tr>
            ))}</tbody>
          </table>
          <button onClick={()=>setRows(r=>[...r,{name:`ТЧК-${r.length+1}`,x:"0.000",y:"0.000",z:"0.000"}])}
            className="text-[10px] text-blue-400 hover:text-blue-300 mb-3">+ Добавить точку</button>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-3 py-1 text-[11px] bg-[#3a3a4e] text-gray-300 hover:bg-[#4a4a5e] rounded">Отмена</button>
            <button onClick={()=>onOK(rows)} className="px-3 py-1 text-[11px] bg-[#0078d4] text-white hover:bg-[#0066b3] rounded">ОК</button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Pipe Network Dialog ──────────────────────────────────────────────────────
function PipeNetDialog({ onClose, onOK }: { onClose: () => void; onOK: (d:{name:string;type:string;material:string}) => void }) {
  const [name, setName] = useState("Сеть дождевой канализации")
  const [type, setType] = useState("Ливневая канализация")
  const [material, setMaterial] = useState("Железобетонные трубы")
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#2d2d3d] border border-gray-600 rounded shadow-2xl w-[420px]">
        <div className="bg-[#1a1a2e] px-3 py-1.5 flex items-center justify-between border-b border-gray-700">
          <span className="text-[11px] font-bold text-white">Создать трубопроводную сеть</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xs">✕</button>
        </div>
        <div className="p-4 flex flex-col gap-3 text-[11px]">
          {([["Название сети:", name, setName],["Тип сети:", type, setType],["Материал труб:", material, setMaterial]] as [string, string, (v:string)=>void][]).map(([lbl,val,setter])=>(
            <div key={lbl} className="flex items-center gap-2">
              <span className="text-gray-400 w-36">{lbl}</span>
              <input value={val} onChange={e=>setter(e.target.value)} className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded outline-none focus:border-[#0078d4]"/>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-36">Слой:</span>
            <span className="flex-1 text-gray-300 bg-[#1e1e2e] border border-gray-600 px-2 py-1 rounded">C-СЕТЬ-ТРУБА</span>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={onClose} className="px-3 py-1 bg-[#3a3a4e] text-gray-300 hover:bg-[#4a4a5e] rounded">Отмена</button>
            <button onClick={()=>onOK({name,type,material})} className="px-3 py-1 bg-[#0078d4] text-white hover:bg-[#0066b3] rounded">ОК</button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Pipe Network Dialog ───────────────────────────────────────────────────────

function PipeNetworkDialog({ onClose, onOK }: { onClose: () => void; onOK: () => void }) {
  const [pipeTab, setPipeTab] = useState<"manholes"|"pipes"|"collisions"|"profile">("manholes")
  const [collisionChecked, setCollisionChecked] = useState(false)
  const [pnToast, setPnToast] = useState<string|null>(null)
  const pnFlash = (m:string)=>{ setPnToast(m); setTimeout(()=>setPnToast(null), 2000) }
  const [manholes, setManholes] = useState([
    { name: "КК-1", type: "Смотровой", diam: "1000", elev: "118.40" },
    { name: "КК-2", type: "Смотровой", diam: "1000", elev: "117.85" },
    { name: "КК-3", type: "Перепадный", diam: "1250", elev: "117.20" },
    { name: "КК-4", type: "Смотровой", diam: "1000", elev: "116.60" },
  ])
  const [pipes, setPipes] = useState([
    { name: "Т-1", from: "КК-1", to: "КК-2", diam: "300", mat: "Железобетон", slope: "2.85" },
    { name: "Т-2", from: "КК-2", to: "КК-3", diam: "300", mat: "Железобетон", slope: "3.10" },
    { name: "Т-3", from: "КК-3", to: "КК-4", diam: "400", mat: "Полиэтилен",  slope: "2.40" },
  ])
  const [selMh, setSelMh] = useState<number|null>(null)
  const [selPipe, setSelPipe] = useState<number|null>(null)
  const DIAMS=["200","300","400","500","600","800","1000"]
  const MATS=["Железобетон","Полиэтилен","ПВХ","Чугун","Керамика"]
  const addManhole = () => { const n=manholes.length+1; setManholes(p=>[...p,{name:`КК-${n}`,type:"Смотровой",diam:"1000",elev:(116-n*0.4).toFixed(2)}]); pnFlash(`✓ Добавлен колодец КК-${n}`) }
  const delManhole = () => { if(selMh===null){pnFlash("Выберите колодец");return} const nm=manholes[selMh].name; setManholes(p=>p.filter((_,i)=>i!==selMh)); setSelMh(null); pnFlash(`✓ Удалён ${nm}`) }
  const changeDiam = () => { if(selPipe===null){pnFlash("Выберите трубу");return} setPipes(p=>p.map((pp,i)=>i!==selPipe?pp:{...pp,diam:DIAMS[(DIAMS.indexOf(pp.diam)+1)%DIAMS.length]})); pnFlash("✓ Диаметр изменён") }
  const changeMat = () => { if(selPipe===null){pnFlash("Выберите трубу");return} setPipes(p=>p.map((pp,i)=>i!==selPipe?pp:{...pp,mat:MATS[(MATS.indexOf(pp.mat)+1)%MATS.length]})); pnFlash("✓ Материал изменён") }
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#2d2d3d] border border-gray-600 rounded shadow-2xl w-[620px] max-h-[90vh] overflow-y-auto relative">
        <div className="bg-[#1a1a2e] px-3 py-1.5 flex items-center justify-between border-b border-gray-700">
          <span className="text-[11px] font-bold text-white">Редактор трубопроводной сети</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xs">✕</button>
        </div>
        {/* Tabs */}
        <div className="flex border-b border-gray-700 bg-[#1e1e2e]">
          {([["manholes","Колодцы"],["pipes","Трубы"],["collisions","Коллизии"],["profile","Профиль сети"]] as const).map(([id,label])=>(
            <button key={id} onClick={()=>setPipeTab(id)}
              className={`px-4 py-1.5 text-[11px] font-semibold border-r border-gray-700 transition-colors ${pipeTab===id?"bg-[#2d2d3d] text-[#0078d4] border-b-2 border-b-[#0078d4]":"text-gray-400 hover:text-gray-200 hover:bg-[#252535]"}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="p-3">
          {pipeTab==="manholes" && (
            <div className="space-y-2">
              <table className="w-full text-[11px] border-collapse">
                <thead><tr className="bg-[#1e1e2e]">
                  {["Имя","Тип","Диаметр мм","Отм. лотка"].map(h=>(
                    <th key={h} className="text-left px-2 py-1 text-gray-400 border border-gray-700">{h}</th>
                  ))}
                </tr></thead>
                <tbody>{manholes.map((m,i)=>(
                  <tr key={i} onClick={()=>setSelMh(i)} className={`cursor-pointer ${selMh===i?"bg-[#0078d4]/30":i%2===0?"bg-[#252535]":"bg-[#2d2d3d]"} hover:bg-[#0078d4]/20`}>
                    <td className="px-2 py-1 border border-gray-700 text-white font-semibold">{m.name}</td>
                    <td className="px-2 py-1 border border-gray-700 text-gray-300">{m.type}</td>
                    <td className="px-2 py-1 border border-gray-700 text-gray-300 font-mono">{m.diam}</td>
                    <td className="px-2 py-1 border border-gray-700 text-gray-300 font-mono">{m.elev}</td>
                  </tr>
                ))}</tbody>
              </table>
              <div className="flex gap-2">
                <button onClick={addManhole} className="px-3 py-1 bg-[#0078d4] text-white text-[11px] rounded hover:bg-[#0066b3]">Добавить колодец</button>
                <button onClick={delManhole} className="px-3 py-1 bg-[#3a3a4e] text-gray-300 text-[11px] rounded hover:bg-[#4a4a5e]">Удалить</button>
              </div>
              <p className="text-[10px] text-gray-500">Перетащите колодец на план для изменения положения</p>
            </div>
          )}
          {pipeTab==="pipes" && (
            <div className="space-y-2">
              <table className="w-full text-[11px] border-collapse">
                <thead><tr className="bg-[#1e1e2e]">
                  {["Имя","От","До","Диаметр мм","Материал","Уклон %"].map(h=>(
                    <th key={h} className="text-left px-2 py-1 text-gray-400 border border-gray-700">{h}</th>
                  ))}
                </tr></thead>
                <tbody>{pipes.map((p,i)=>(
                  <tr key={i} onClick={()=>setSelPipe(i)} className={`cursor-pointer ${selPipe===i?"bg-[#0078d4]/30":i%2===0?"bg-[#252535]":"bg-[#2d2d3d]"} hover:bg-[#0078d4]/20`}>
                    <td className="px-2 py-1 border border-gray-700 text-white font-semibold">{p.name}</td>
                    <td className="px-2 py-1 border border-gray-700 text-gray-300">{p.from}</td>
                    <td className="px-2 py-1 border border-gray-700 text-gray-300">{p.to}</td>
                    <td className="px-2 py-1 border border-gray-700 text-gray-300 font-mono">{p.diam}</td>
                    <td className="px-2 py-1 border border-gray-700 text-gray-300">{p.mat}</td>
                    <td className="px-2 py-1 border border-gray-700 text-gray-300 font-mono">{p.slope}</td>
                  </tr>
                ))}</tbody>
              </table>
              <div className="flex gap-2">
                <button onClick={changeDiam} className="px-3 py-1 bg-[#3a3a4e] text-gray-300 text-[11px] rounded hover:bg-[#4a4a5e]">Изменить диаметр</button>
                <button onClick={changeMat} className="px-3 py-1 bg-[#3a3a4e] text-gray-300 text-[11px] rounded hover:bg-[#4a4a5e]">Изменить материал</button>
              </div>
            </div>
          )}
          {pipeTab==="collisions" && (
            <div className="space-y-2">
              <button onClick={()=>setCollisionChecked(true)}
                className="px-4 py-1.5 bg-[#0078d4] text-white text-[11px] rounded hover:bg-[#0066b3] font-semibold">Проверить коллизии</button>
              {collisionChecked && (
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2 p-2 bg-red-900/20 border border-red-700/40 rounded">
                    <span className="text-red-400 text-xs mt-0.5">⚠</span>
                    <span className="text-[11px] text-red-300">Труба Т-2 × Водопровод В-4: пересечение на отм. 118.50м</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-red-900/20 border border-red-700/40 rounded">
                    <span className="text-red-400 text-xs mt-0.5">⚠</span>
                    <span className="text-[11px] text-red-300">Колодец КК-3: расстояние до здания {"<"} 5м</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-green-900/20 border border-green-700/40 rounded">
                    <span className="text-green-400 text-xs mt-0.5">✓</span>
                    <span className="text-[11px] text-green-300">Остальные объекты — без коллизий</span>
                  </div>
                </div>
              )}
            </div>
          )}
          {pipeTab==="profile" && (
            <div className="bg-[#1a1a2e] rounded border border-gray-700 overflow-hidden" style={{height:160}}>
              <svg width="100%" height="160" viewBox="0 0 580 160">
                <text x="10" y="14" fill="#9ca3af" fontSize="9">Профиль трубопроводной сети</text>
                {/* Ground line */}
                <polyline points="20,100 160,95 300,90 440,85 560,80" fill="none" stroke="#6b7280" strokeWidth="1.5" strokeDasharray="4,2"/>
                {/* Pipe line */}
                <polyline points="20,120 160,118 300,122 440,130 560,128" fill="none" stroke="#6366f1" strokeWidth="2"/>
                {/* Manholes */}
                {[20,160,300,440,560].map((x,i)=>(
                  <g key={i}>
                    <rect x={x-6} y={100} width="12" height={[20,18,22,30,28][i]} fill="#4b5563" stroke="#6366f1" strokeWidth="1"/>
                    <circle cx={x} cy={98} r="5" fill="#1e1e2e" stroke="#6366f1" strokeWidth="1.5"/>
                    <text x={x} y="150" fill="#6b7280" fontSize="8" textAnchor="middle">{["КК-1","КК-2","КК-3","КК-4","КК-5"][i]}</text>
                    <text x={x} y="140" fill="#9ca3af" fontSize="7" textAnchor="middle">{["118.4","117.9","117.2","116.6","116.1"][i]}</text>
                  </g>
                ))}
                {/* Labels */}
                <text x="10" y="95" fill="#9ca3af" fontSize="7">Рельеф</text>
                <text x="10" y="125" fill="#818cf8" fontSize="7">Лоток</text>
              </svg>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-3 pb-3 border-t border-gray-700 pt-2">
          <button onClick={onOK} className="px-4 py-1 bg-[#0078d4] text-white text-[11px] rounded hover:bg-[#0066b3]">ОК</button>
          <button onClick={onClose} className="px-4 py-1 bg-[#3a3a4e] text-gray-300 text-[11px] rounded hover:bg-[#4a4a5e]">Отмена</button>
        </div>
        <AnimatePresence>
          {pnToast && (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-[#1a1a2e] border border-[#0078d4]/50 text-[#60a5fa] text-[10px] px-3 py-1.5 rounded-lg shadow-lg z-10 whitespace-nowrap">
              {pnToast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ─── Intersection Dialog ──────────────────────────────────────────────────────
function IntersectionDialog({ onClose, onOK }: { onClose: () => void; onOK: (d:{name:string;mainRoad:string;secRoad:string}) => void }) {
  const [name, setName] = useState("Пересечение-1")
  const [mainRoad, setMainRoad] = useState("Трасса ШД-38")
  const [secRoad, setSecRoad] = useState("Ул. Трумана")
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#2d2d3d] border border-gray-600 rounded shadow-2xl w-[420px]">
        <div className="bg-[#1a1a2e] px-3 py-1.5 flex items-center justify-between border-b border-gray-700">
          <span className="text-[11px] font-bold text-white">Создать пересечение</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xs">✕</button>
        </div>
        <div className="p-4 flex flex-col gap-3 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-40">Название:</span>
            <input value={name} onChange={e=>setName(e.target.value)} className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded outline-none focus:border-[#0078d4]"/>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-40">Главная дорога:</span>
            <select value={mainRoad} onChange={e=>setMainRoad(e.target.value)} className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded">
              {["Трасса ШД-38","Ул. Трумана","Бордюр периметра"].map(a=><option key={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-40">Второстепенная дорога:</span>
            <select value={secRoad} onChange={e=>setSecRoad(e.target.value)} className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded">
              {["Ул. Трумана","Трасса ШД-38","Бордюр периметра"].map(a=><option key={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-40">Тип примыкания:</span>
            <select className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded">
              <option>Т-образное пересечение</option><option>Полное пересечение (+)</option><option>Круговое движение</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={onClose} className="px-3 py-1 bg-[#3a3a4e] text-gray-300 hover:bg-[#4a4a5e] rounded">Отмена</button>
            <button onClick={()=>onOK({name,mainRoad,secRoad})} className="px-3 py-1 bg-[#0078d4] text-white hover:bg-[#0066b3] rounded">ОК</button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Feature Line Dialog ──────────────────────────────────────────────────────
function FeatureLineDialog({ onClose, onOK }: { onClose: () => void; onOK: (d:{name:string;site:string}) => void }) {
  const [name, setName] = useState("ХарЛиния-1")
  const [site, setSite] = useState("Главная парковка")
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#2d2d3d] border border-gray-600 rounded shadow-2xl w-[380px]">
        <div className="bg-[#1a1a2e] px-3 py-1.5 flex items-center justify-between border-b border-gray-700">
          <span className="text-[11px] font-bold text-white">Создать характерную линию</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xs">✕</button>
        </div>
        <div className="p-4 flex flex-col gap-3 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-32">Название:</span>
            <input value={name} onChange={e=>setName(e.target.value)} className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded outline-none focus:border-[#0078d4]"/>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-32">Площадка:</span>
            <input value={site} onChange={e=>setSite(e.target.value)} className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded outline-none focus:border-[#0078d4]"/>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-32">Стиль:</span>
            <select className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded">
              <option>Базовый</option><option>Бордюр</option><option>Тротуар</option><option>Откос</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-32">Слой:</span>
            <span className="flex-1 text-gray-300 bg-[#1e1e2e] border border-gray-600 px-2 py-1 rounded">C-ROAD-FEAT</span>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={onClose} className="px-3 py-1 bg-[#3a3a4e] text-gray-300 hover:bg-[#4a4a5e] rounded">Отмена</button>
            <button onClick={()=>onOK({name,site})} className="px-3 py-1 bg-[#0078d4] text-white hover:bg-[#0066b3] rounded">ОК</button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Analysis Dialog ──────────────────────────────────────────────────────────
function AnalysisDialog({ onClose, onOK, type }: { onClose: () => void; onOK: (d:{surface:string;type:string}) => void; type: string }) {
  const [surface, setSurface] = useState("Существующая поверхность")
  const [ranges, setRanges] = useState(5)
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#2d2d3d] border border-gray-600 rounded shadow-2xl w-[400px]">
        <div className="bg-[#1a1a2e] px-3 py-1.5 flex items-center justify-between border-b border-gray-700">
          <span className="text-[11px] font-bold text-white">{type}</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xs">✕</button>
        </div>
        <div className="p-4 flex flex-col gap-3 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-36">Поверхность:</span>
            <select value={surface} onChange={e=>setSurface(e.target.value)} className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded">
              <option>Существующая поверхность</option><option>Проектная поверхность</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-36">Число диапазонов:</span>
            <input type="number" value={ranges} onChange={e=>setRanges(+e.target.value)} min={2} max={20}
              className="w-20 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded outline-none focus:border-[#0078d4] text-center"/>
          </div>
          <div className="bg-[#1e1e2e] rounded border border-gray-700 p-2">
            <div className="text-gray-500 text-[10px] mb-2">Предварительный просмотр диапазонов:</div>
            {Array.from({length:Math.min(ranges,5)}).map((_,i)=>(
              <div key={i} className="flex items-center gap-2 mb-1">
                <div className="w-4 h-3 rounded-sm" style={{background:`hsl(${120-i*24},70%,45%)`}}/>
                <span className="text-gray-400 font-mono">{(i*5).toFixed(1)}% — {((i+1)*5).toFixed(1)}%</span>
              </div>
            ))}
            {ranges > 5 && <div className="text-gray-600 text-[10px]">… ещё {ranges-5} диапазонов</div>}
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <button onClick={onClose} className="px-3 py-1 bg-[#3a3a4e] text-gray-300 hover:bg-[#4a4a5e] rounded">Отмена</button>
            <button onClick={()=>onOK({surface,type})} className="px-3 py-1 bg-[#0078d4] text-white hover:bg-[#0066b3] rounded">ОК</button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Layers Dialog ────────────────────────────────────────────────────────────
function LayersDialog({ onClose }: { onClose: () => void }) {
  const [layers, setLayers] = useState([
    {name:"0",on:true,frozen:false,locked:false,color:"#ffffff",ltype:"Сплошная",lw:"По умолч."},
    {name:"C-ROAD-ALIGN",on:true,frozen:false,locked:false,color:"#ef4444",ltype:"Сплошная",lw:"0.25"},
    {name:"C-ДОРОГА-КОР",on:true,frozen:false,locked:false,color:"#f97316",ltype:"Сплошная",lw:"0.35"},
    {name:"C-TOPO-MAJOR",on:true,frozen:false,locked:false,color:"#4ade80",ltype:"Сплошная",lw:"0.18"},
    {name:"C-TOPO-MINOR",on:false,frozen:false,locked:false,color:"#86efac",ltype:"Пунктир",lw:"0.13"},
    {name:"C-СЕТЬ-ТРУБА",on:true,frozen:false,locked:false,color:"#6366f1",ltype:"Штрих-пункт",lw:"0.25"},
    {name:"C-ANNO-TEXT",on:true,frozen:false,locked:false,color:"#e2e8f0",ltype:"Сплошная",lw:"По умолч."},
    {name:"C-ANNO-DIMS",on:true,frozen:false,locked:false,color:"#94a3b8",ltype:"Сплошная",lw:"0.13"},
    {name:"C-TOPO-PNTS",on:true,frozen:false,locked:false,color:"#f59e0b",ltype:"Сплошная",lw:"По умолч."},
  ])
  const [selected, setSelected] = useState<number|null>(null)
  const [newName, setNewName] = useState("")
  const toggle = (i: number, key: "on"|"frozen"|"locked") =>
    setLayers(prev => prev.map((l,idx) => idx===i ? {...l,[key]:!l[key]} : l))
  const addLayer = () => {
    const name = newName.trim() || `Слой-${layers.length+1}`
    setLayers(prev => [...prev, {name,on:true,frozen:false,locked:false,color:"#22d3ee",ltype:"Сплошная",lw:"По умолч."}])
    setNewName("")
  }
  const deleteLayer = () => {
    if (selected === null || layers[selected].name === "0") return
    setLayers(prev => prev.filter((_,i)=>i!==selected))
    setSelected(null)
  }
  const changeColor = (i: number, color: string) =>
    setLayers(prev => prev.map((l,idx) => idx===i ? {...l,color} : l))
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#2d2d3d] border border-gray-600 rounded shadow-2xl w-[700px]">
        <div className="bg-[#1a1a2e] px-3 py-1.5 flex items-center justify-between border-b border-gray-700">
          <span className="text-[11px] font-bold text-white">Диспетчер слоёв</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xs">✕</button>
        </div>
        <div className="flex items-center gap-2 px-2 pt-2 pb-1">
          <button onClick={addLayer} className="flex items-center gap-1 px-2 py-1 bg-[#0078d4] text-white rounded text-[10px] hover:bg-[#0066b3]">
            <Icon name="Plus" size={10}/> Новый слой
          </button>
          <button onClick={deleteLayer} disabled={selected===null||layers[selected]?.name==="0"} className="flex items-center gap-1 px-2 py-1 bg-[#3a3a4e] text-gray-300 rounded text-[10px] hover:bg-[#ef4444] hover:text-white disabled:opacity-40">
            <Icon name="Trash2" size={10}/> Удалить
          </button>
          <input value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addLayer()}
            placeholder="Имя нового слоя..." className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 text-[10px] px-2 py-1 rounded outline-none focus:border-[#0078d4]"/>
        </div>
        <div className="px-2 pb-2 overflow-auto" style={{maxHeight:360}}>
          <table className="w-full text-[11px] border-collapse">
            <thead><tr className="bg-[#1e1e2e]">
              {["","Имя слоя","Вкл","Заморожен","Блок","Цвет","Тип линии","Вес линии"].map(h=>(
                <th key={h} className="text-left px-2 py-1 text-gray-400 border border-gray-700 text-[10px]">{h}</th>
              ))}
            </tr></thead>
            <tbody>{layers.map((l,i)=>(
              <tr key={i} onClick={()=>setSelected(i)} className={`transition-colors cursor-pointer ${selected===i?"bg-[#0078d4]/20":"hover:bg-[#3a3a4e]"}`}>
                <td className="px-2 py-1 border border-gray-700 text-[10px] text-gray-500">{i+1}</td>
                <td className="px-2 py-1 border border-gray-700 font-medium text-white text-[10px]">{l.name}</td>
                <td className="px-2 py-1 border border-gray-700 text-center">
                  <button onClick={e=>{e.stopPropagation();toggle(i,"on")}} title={l.on?"Выключить":"Включить"}>
                    <Icon name={l.on?"Eye":"EyeOff"} size={11} className={l.on?"text-yellow-400":"text-gray-600"}/>
                  </button>
                </td>
                <td className="px-2 py-1 border border-gray-700 text-center">
                  <button onClick={e=>{e.stopPropagation();toggle(i,"frozen")}} title={l.frozen?"Разморозить":"Заморозить"}>
                    <Icon name={l.frozen?"Snowflake":"Sun"} size={11} className={l.frozen?"text-blue-400":"text-gray-500"}/>
                  </button>
                </td>
                <td className="px-2 py-1 border border-gray-700 text-center">
                  <button onClick={e=>{e.stopPropagation();toggle(i,"locked")}} title={l.locked?"Разблокировать":"Заблокировать"}>
                    <Icon name={l.locked?"Lock":"Unlock"} size={11} className={l.locked?"text-orange-400":"text-gray-500"}/>
                  </button>
                </td>
                <td className="px-2 py-1 border border-gray-700">
                  <input type="color" value={l.color} onChange={e=>{e.stopPropagation();changeColor(i,e.target.value)}}
                    className="w-6 h-4 rounded cursor-pointer border-0 bg-transparent" title="Цвет слоя"/>
                </td>
                <td className="px-2 py-1 border border-gray-700 text-gray-300 text-[10px]">{l.ltype}</td>
                <td className="px-2 py-1 border border-gray-700 text-gray-300 text-[10px]">{l.lw}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="flex justify-between items-center px-3 py-2 border-t border-gray-700 text-[10px] text-gray-400">
          <span>Слоёв: {layers.length} | Показано: {layers.filter(l=>l.on).length}</span>
          <button onClick={onClose} className="px-3 py-1 bg-[#0078d4] text-white rounded hover:bg-[#0066b3]">OK</button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Import Dialog ────────────────────────────────────────────────────────────
const IMPORT_FORMATS = [
  { id:"LandXML",   icon:"Code2",        color:"#7c3aed", ext:".xml",     desc:"Трассы, профили, поверхности, сети" },
  { id:"DXF",       icon:"PencilRuler",  color:"#0078d4", ext:".dxf",     desc:"AutoCAD чертёж (слои, объекты)" },
  { id:"DWG",       icon:"FileCode",     color:"#0891b2", ext:".dwg",     desc:"AutoCAD двоичный формат" },
  { id:"CSV точек", icon:"Sheet",        color:"#16a34a", ext:".csv",     desc:"Таблица: ID, X, Y, Z, Код" },
  { id:"DEM/GeoTIFF",icon:"Mountain",   color:"#d97706", ext:".tif",     desc:"Растровый рельеф, высоты пикселей" },
  { id:"IFC",       icon:"Building2",    color:"#6366f1", ext:".ifc",     desc:"BIM-модель (IFC 2x3/4)" },
  { id:"Shapefile", icon:"Map",          color:"#059669", ext:".shp",     desc:"Геопространственные данные ESRI" },
  { id:"GeoJSON",   icon:"Globe",        color:"#0ea5e9", ext:".geojson", desc:"Геометрия с атрибутами (RFC 7946)" },
]

function ImportDialog({ onClose, onOK }: { onClose: () => void; onOK: (d:{format:string;file:string}) => void }) {
  const [format, setFormat] = useState("LandXML")
  const [fileName, setFileName] = useState("")
  const [epsg, setEpsg] = useState("20870")
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const fmt = IMPORT_FORMATS.find(f=>f.id===format) || IMPORT_FORMATS[0]

  const handleFile = (f: File) => { setFileName(f.name) }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#1e1e2e] border border-gray-600 rounded-lg shadow-2xl" style={{width:500}}>
        <div className="bg-[#0d1a2e] px-4 py-2 flex items-center justify-between border-b border-gray-700 rounded-t-lg">
          <span className="text-white font-bold text-[13px] flex items-center gap-2">
            <Icon name="Upload" size={14} className="text-[#0078d4]"/>Импорт данных
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="p-4 space-y-3 text-[11px]">
          {/* Сетка форматов */}
          <div className="grid grid-cols-4 gap-1.5">
            {IMPORT_FORMATS.map(f=>(
              <button key={f.id} onClick={()=>setFormat(f.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${format===f.id?"border-[#0078d4] bg-[#0078d4]/20":"border-gray-700 hover:border-gray-500 hover:bg-[#252535]"}`}>
                <Icon name={f.icon} size={16} style={{color:format===f.id?"#60a5fa":f.color}} fallback="File"/>
                <span className={`text-[9px] font-bold ${format===f.id?"text-white":"text-gray-400"}`}>{f.id}</span>
                <span className="text-[8px] text-gray-600">{f.ext}</span>
              </button>
            ))}
          </div>

          {/* Описание формата */}
          <div className="rounded border border-gray-700 px-3 py-2 text-[10px]" style={{background:"#111827"}}>
            <div className="text-white font-semibold mb-0.5">{fmt.id}</div>
            <div className="text-gray-400">{fmt.desc}</div>
            {format==="DEM/GeoTIFF" && <div className="text-yellow-400 mt-1 text-[9px]">⚠ Большие файлы (&gt;100MB) могут обрабатываться медленно</div>}
            {format==="DWG" && <div className="text-yellow-400 mt-1 text-[9px]">⚠ Поддержка DWG через конвертацию в DXF</div>}
          </div>

          {/* Область перетаскивания */}
          <div
            onDragOver={e=>{e.preventDefault();setDragging(true)}}
            onDragLeave={()=>setDragging(false)}
            onDrop={e=>{e.preventDefault();setDragging(false);const f=e.dataTransfer.files[0];if(f)handleFile(f)}}
            onClick={()=>fileRef.current?.click()}
            className={`rounded-lg border-2 border-dashed py-6 flex flex-col items-center gap-2 cursor-pointer transition-colors ${dragging?"border-[#0078d4] bg-[#0078d4]/10":"border-gray-600 hover:border-gray-500"}`}>
            <Icon name="Upload" size={20} className={dragging?"text-[#0078d4]":"text-gray-500"}/>
            {fileName
              ? <span className="text-white text-[11px] font-semibold">{fileName}</span>
              : <span className="text-gray-400 text-[11px]">Перетащите файл {fmt.ext} или нажмите</span>}
            <input ref={fileRef} type="file" accept={fmt.ext} className="hidden" onChange={e=>{if(e.target.files?.[0])handleFile(e.target.files[0])}}/>
          </div>

          {/* EPSG */}
          <div className="flex items-center gap-3">
            <span className="text-gray-400 w-36">Система координат (EPSG):</span>
            <input value={epsg} onChange={e=>setEpsg(e.target.value)}
              className="w-24 bg-[#252535] border border-gray-600 text-white px-2 py-1 rounded outline-none focus:border-[#0078d4] font-mono"/>
            <span className="text-gray-500 text-[10px]">{epsg==="20870"?"МСК-70":epsg==="4326"?"WGS84":epsg==="32637"?"UTM 37N":"Пользовательская"}</span>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 hover:bg-[#3a3a4e] rounded text-[11px]">Отмена</button>
            <button onClick={()=>onOK({format,file:fileName||`sample${fmt.ext}`})}
              className="px-4 py-1.5 bg-[#0078d4] text-white hover:bg-[#0066b3] rounded text-[11px] flex items-center gap-1">
              <Icon name="Upload" size={12}/>Импортировать
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── DXF generator ────────────────────────────────────────────────────────────
function generateDXF(objects: CanvasObject[]): string {
  const lines: string[] = []
  const h = (code: number, val: string|number) => lines.push(`${code}\n${val}`)
  // Header
  h(0,"SECTION"); h(2,"HEADER"); h(9,"$ACADVER"); h(1,"AC1015"); h(0,"ENDSEC")
  // Tables - layers
  h(0,"SECTION"); h(2,"TABLES")
  h(0,"TABLE"); h(2,"LAYER"); h(70, objects.length+2)
  h(0,"LAYER"); h(2,"0"); h(70,0); h(62,7); h(6,"Continuous")
  const layersSet = new Set(objects.map(o=>o.layer||"0"))
  layersSet.forEach(l => { if(l!=="0"){h(0,"LAYER");h(2,l);h(70,0);h(62,7);h(6,"Continuous")} })
  h(0,"ENDTAB"); h(0,"ENDSEC")
  // Entities
  h(0,"SECTION"); h(2,"ENTITIES")
  objects.forEach(obj => {
    const layer = obj.layer || "0"
    if (obj.type === "point") {
      h(0,"POINT"); h(8,layer); h(10,obj.pts[0][0].toFixed(4)); h(20,obj.pts[0][1].toFixed(4)); h(30,"0.0")
    } else if (obj.type === "line" && obj.pts.length >= 2) {
      h(0,"LINE"); h(8,layer)
      h(10,obj.pts[0][0].toFixed(4)); h(20,obj.pts[0][1].toFixed(4)); h(30,"0.0")
      h(11,obj.pts[1][0].toFixed(4)); h(21,obj.pts[1][1].toFixed(4)); h(31,"0.0")
    } else if ((obj.type === "polyline" || obj.type === "rect" || obj.type === "arc" || obj.type === "circle" || obj.type === "alignment") && obj.pts.length >= 2) {
      h(0,"LWPOLYLINE"); h(8,layer); h(90,obj.pts.length)
      h(70, obj.type === "rect" || obj.type === "circle" ? 1 : 0)
      obj.pts.forEach(([x,y]) => { h(10,x.toFixed(4)); h(20,y.toFixed(4)) })
    }
  })
  h(0,"ENDSEC"); h(0,"EOF")
  return lines.join("\n")
}

// ─── Export/Print Dialog ──────────────────────────────────────────────────────
function ExportDialog({ onClose, onOK, mode, canvasObjects }: { onClose: () => void; onOK: (d:{format:string}) => void; mode: "export"|"print"; canvasObjects: CanvasObject[] }) {
  const [format, setFormat] = useState(mode==="print"?"PDF":"DXF")
  const [scope, setScope] = useState("Активный лист")
  const [mapScale, setMapScale] = useState("1:1000")

  const saveBlob = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  const doExport = () => {
    if (format === "DXF") {
      saveBlob(generateDXF(canvasObjects), "drawing.dxf", "application/dxf")
    } else if (format === "GeoJSON") {
      const features = canvasObjects.map(obj => ({
        type: "Feature",
        geometry: obj.type === "point"
          ? { type: "Point", coordinates: [obj.pts[0][0], obj.pts[0][1]] }
          : { type: "LineString", coordinates: obj.pts.map(([x,y])=>[x,y]) },
        properties: { id: obj.id, label: obj.label, layer: obj.layer, ...obj.properties }
      }))
      saveBlob(JSON.stringify({ type: "FeatureCollection", features }, null, 2), "drawing.geojson", "application/json")
    } else if (format === "CSV точек") {
      const pts = canvasObjects.filter(o=>o.type==="point")
      const csv = ["ID,Имя,X,Y,Z", ...pts.map(p=>`${p.id},${p.label},${p.pts[0][0].toFixed(3)},${p.pts[0][1].toFixed(3)},0.000`)].join("\n")
      saveBlob(csv, "points.csv", "text/csv")
    } else if (format === "LandXML") {
      const pts = canvasObjects.filter(o=>o.type==="point")
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<LandXML xmlns="http://www.landxml.org/schema/LandXML-1.2" version="1.2" date="${new Date().toISOString().slice(0,10)}">
  <Units><Metric areaUnit="squareMeter" linearUnit="meter" volumeUnit="cubicMeter"/></Units>
  <CgPoints name="Съёмочные точки">
${pts.map(p=>`    <CgPoint name="${p.label}" oID="${p.id}" code="${p.properties?.code||"R"}">${p.pts[0][1].toFixed(3)} ${p.pts[0][0].toFixed(3)} 0.000</CgPoint>`).join("\n")}
  </CgPoints>
</LandXML>`
      saveBlob(xml, "drawing.landxml", "application/xml")
    } else if (format === "OBJ") {
      // Генерация простой OBJ-модели из точек и полилиний
      const lines: string[] = ["# ЛАПА — 3D Export OBJ", `# Objects: ${canvasObjects.length}`, ""]
      let vIdx = 1
      canvasObjects.forEach(obj => {
        if (obj.type === "point") {
          lines.push(`v ${obj.pts[0][0].toFixed(3)} 0.000 ${obj.pts[0][1].toFixed(3)}`)
          vIdx++
        } else if (obj.pts.length > 1) {
          const start = vIdx
          obj.pts.forEach(([x,y]) => { lines.push(`v ${x.toFixed(3)} 0.000 ${y.toFixed(3)}`); vIdx++ })
          const idxs = Array.from({length:obj.pts.length},(_,i)=>start+i).join(" ")
          lines.push(`l ${idxs}`)
        }
      })
      saveBlob(lines.join("\n"), "scene.obj", "model/obj")
    } else if (format === "glTF") {
      // Минимальный валидный glTF JSON
      const gltf = {
        asset: { version: "2.0", generator: "ЛАПА Редактор" },
        scene: 0, scenes: [{ name: "Сцена", nodes: [0] }],
        nodes: [{ name: "Объекты", mesh: 0 }],
        meshes: [{ name: "Геометрия", primitives: [{ mode: 1 }] }]
      }
      saveBlob(JSON.stringify(gltf, null, 2), "scene.gltf", "model/gltf+json")
    } else if (format === "PDF") {
      // SVG → PDF через печать браузера
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="297mm" height="210mm" viewBox="0 0 2970 2100">
  <rect width="2970" height="2100" fill="white"/>
  <text x="20" y="40" font-family="Arial" font-size="18" font-weight="bold">ЛАПА — Экспорт чертежа</text>
  <text x="20" y="60" font-family="Arial" font-size="12" fill="#666">Масштаб: ${mapScale} · Объектов: ${canvasObjects.length} · Дата: ${new Date().toLocaleDateString("ru-RU")}</text>
  ${canvasObjects.filter(o=>o.pts.length>0).slice(0,100).map(o=>
    o.type==="point"
      ? `<circle cx="${(o.pts[0][0]/100*2900+35).toFixed(0)}" cy="${(o.pts[0][1]/100*2000+100).toFixed(0)}" r="4" fill="${o.color||"#333"}"/>`
      : `<polyline points="${o.pts.map(([x,y])=>`${(x/100*2900+35).toFixed(0)},${(y/100*2000+100).toFixed(0)}`).join(" ")}" fill="none" stroke="${o.color||"#333"}" stroke-width="1.5"/>`
  ).join("\n  ")}
</svg>`
      const w = window.open("","_blank")
      if (w) {
        w.document.write(`<html><head><title>ЛАПА — Печать</title><style>@page{size:A4 landscape;margin:0}body{margin:0}</style></head><body>${svgContent}</body></html>`)
        w.document.close()
        setTimeout(()=>w.print(), 400)
      }
    }
    onOK({ format })
  }

  const EXPORT_FORMATS = ["DXF","GeoJSON","CSV точек","LandXML","IFC","OBJ","glTF","PDF"]
  const PRINT_FORMATS = ["PDF","DWF","PNG (300 DPI)","SVG"]
  const REAL_FORMATS = ["DXF","GeoJSON","CSV точек","LandXML","OBJ","glTF","PDF"]

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#1e1e2e] border border-gray-600 rounded-lg shadow-2xl" style={{width:440}}>
        <div className="bg-[#0d1a2e] px-4 py-2 flex items-center justify-between border-b border-gray-700 rounded-t-lg">
          <span className="text-white font-bold text-[13px] flex items-center gap-2">
            <Icon name={mode==="print"?"Printer":"Download"} size={14} className="text-[#0078d4]"/>
            {mode==="print"?"Печать чертежа":"Экспорт"}
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="p-4 space-y-3 text-[11px]">
          {/* Сетка форматов */}
          <div>
            <div className="text-[10px] text-gray-500 mb-2">{mode==="print"?"Формат вывода:":"Формат файла:"}</div>
            <div className="grid grid-cols-4 gap-1.5">
              {(mode==="print"?PRINT_FORMATS:EXPORT_FORMATS).map(f=>{
                const icons: Record<string,string> = { DXF:"PencilRuler",GeoJSON:"Map","CSV точек":"Sheet",LandXML:"Code2",IFC:"Building2",OBJ:"Box",glTF:"Layers3",PDF:"FileText",DWF:"File","PNG (300 DPI)":"Image",SVG:"Vector" }
                const colors: Record<string,string> = { DXF:"#0078d4",GeoJSON:"#16a34a","CSV точек":"#d97706",LandXML:"#7c3aed",IFC:"#0891b2",OBJ:"#f59e0b",glTF:"#6366f1",PDF:"#ef4444",DWF:"#6b7280","PNG (300 DPI)":"#8b5cf6",SVG:"#ec4899" }
                const col = colors[f]||"#6b7280"
                return (
                  <button key={f} onClick={()=>setFormat(f)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${format===f?"border-[#0078d4] bg-[#0078d4]/20":"border-gray-700 hover:border-gray-500 hover:bg-[#252535]"}`}>
                    <Icon name={icons[f]||"File"} size={16} style={{color:format===f?"#60a5fa":col}} fallback="Download"/>
                    <span className={`text-[9px] font-bold ${format===f?"text-white":"text-gray-400"}`}>{f}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 w-24">Область:</span>
            <select value={scope} onChange={e=>setScope(e.target.value)} className="flex-1 bg-[#252535] border border-gray-600 text-gray-200 px-2 py-1 rounded outline-none">
              {["Активный лист","Все листы","Модель","Рамка видового экрана"].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 w-24">Масштаб:</span>
            <select value={mapScale} onChange={e=>setMapScale(e.target.value)} className="flex-1 bg-[#252535] border border-gray-600 text-gray-200 px-2 py-1 rounded outline-none">
              {["1:200","1:500","1:1000","1:2000","1:5000","1:10000","По листу"].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div className={`rounded border px-3 py-2 text-[10px] ${REAL_FORMATS.includes(format)?"bg-green-900/20 border-green-700 text-green-400":"bg-gray-800/50 border-gray-700 text-gray-500"}`}>
            {REAL_FORMATS.includes(format)
              ? `✓ Реальный экспорт — файл скачается на ваш компьютер (${canvasObjects.length} объектов)`
              : `ℹ Формат ${format} — будет реализован в следующем обновлении`}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 hover:bg-[#3a3a4e] rounded text-[11px]">Отмена</button>
            <button onClick={doExport} className="px-4 py-1.5 bg-[#0078d4] text-white hover:bg-[#0066b3] rounded text-[11px] flex items-center gap-1">
              <Icon name={mode==="print"?"Printer":"Download"} size={12}/>{mode==="print"?"Печать":"Экспорт"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Volume Analysis Dialog — реальные расчёты призматоидного метода ─────────
function VolumeDialog({ onClose, onOK, scene }: {
  onClose: () => void; onOK: () => void
  scene: import("./civil3d-engine").CivilScene
}) {
  const vr = scene.volumeReport
  const [tab, setTab] = useState<"summary"|"table"|"mass">("summary")

  const fillVol  = vr.totalFill.toFixed(1)
  const cutVol   = vr.totalCut.toFixed(1)
  const netVol   = vr.netVolume
  const netStr   = `${netVol >= 0 ? "+" : ""}${netVol.toFixed(1)} м³`

  const fillArea = scene.sections.reduce((s,x)=>s+x.fillArea,0).toFixed(1)
  const cutArea  = scene.sections.reduce((s,x)=>s+x.cutArea, 0).toFixed(1)
  const fillAvg  = scene.sections.length ? (scene.sections.reduce((s,x)=>s+x.fillArea,0) / scene.sections.length).toFixed(2) : "0"
  const cutAvg   = scene.sections.length ? (scene.sections.reduce((s,x)=>s+x.cutArea, 0) / scene.sections.length).toFixed(2) : "0"

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#2d2d3d] border border-gray-600 rounded shadow-2xl" style={{width:580, maxHeight:"80vh", display:"flex", flexDirection:"column"}}>
        <div className="bg-[#1a1a2e] px-3 py-1.5 flex items-center justify-between border-b border-gray-700 flex-shrink-0">
          <span className="text-[11px] font-bold text-white">Объёмы земляных работ — Призматоидный метод</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xs">✕</button>
        </div>
        {/* Вкладки */}
        <div className="flex border-b border-gray-700 flex-shrink-0">
          {([["summary","Сводка"],["table","По сечениям"],["mass","Масса-кривая"]] as const).map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`px-4 py-1.5 text-[10px] border-r border-gray-700 transition-colors ${tab===id?"bg-[#252535] text-white border-b-2 border-b-[#0078d4]":"text-gray-400 hover:bg-[#252535]"}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-4 text-[11px]">
          {tab === "summary" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-[#1e1e2e] rounded p-2 border border-gray-700">
                  <div className="text-gray-400 text-[10px] mb-1">Поверхность 1 (существующая)</div>
                  <div className="text-white font-semibold">Существующая поверхность</div>
                  <div className="text-gray-500 text-[9px] mt-1">TIN · {scene.surface.stats.pointCount} точек</div>
                </div>
                <div className="bg-[#1e1e2e] rounded p-2 border border-gray-700">
                  <div className="text-gray-400 text-[10px] mb-1">Поверхность 2 (проектная)</div>
                  <div className="text-white font-semibold">Коридор — {scene.alignment.name}</div>
                  <div className="text-gray-500 text-[9px] mt-1">{scene.sections.length} поперечных сечений</div>
                </div>
              </div>
              <table className="w-full border-collapse">
                <thead><tr className="bg-[#1e1e2e]">
                  {["Зона","Объём","Пл. сечений","Ср. глубина"].map(h=>(
                    <th key={h} className="text-left px-2 py-1.5 text-gray-400 border border-gray-700 font-normal">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  <tr className="hover:bg-[#252535]">
                    <td className="px-2 py-1.5 border border-gray-700 text-blue-300 font-semibold">Насыпь</td>
                    <td className="px-2 py-1.5 border border-gray-700 font-mono text-blue-200">{fillVol} м³</td>
                    <td className="px-2 py-1.5 border border-gray-700 text-gray-400">{fillArea} м²</td>
                    <td className="px-2 py-1.5 border border-gray-700 text-gray-400">{fillAvg} м</td>
                  </tr>
                  <tr className="hover:bg-[#252535]">
                    <td className="px-2 py-1.5 border border-gray-700 text-red-300 font-semibold">Выемка</td>
                    <td className="px-2 py-1.5 border border-gray-700 font-mono text-red-200">{cutVol} м³</td>
                    <td className="px-2 py-1.5 border border-gray-700 text-gray-400">{cutArea} м²</td>
                    <td className="px-2 py-1.5 border border-gray-700 text-gray-400">{cutAvg} м</td>
                  </tr>
                  <tr className="bg-[#1e2e1e]">
                    <td className="px-2 py-1.5 border border-gray-700 text-white font-bold">Баланс</td>
                    <td className={`px-2 py-1.5 border border-gray-700 font-mono font-bold ${netVol>=0?"text-green-400":"text-red-400"}`}>{netStr}</td>
                    <td className="px-2 py-1.5 border border-gray-700 text-gray-500">—</td>
                    <td className="px-2 py-1.5 border border-gray-700 text-gray-500">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          {tab === "table" && (
            <div className="overflow-auto" style={{maxHeight:300}}>
              <table className="w-full border-collapse text-[10px]">
                <thead><tr className="bg-[#1e1e2e] sticky top-0">
                  {["Пикет","Выемка м²","Насыпь м²","Длина м","V-выем м³","V-нас м³","∑Выем м³","∑Нас м³"].map(h=>(
                    <th key={h} className="px-2 py-1 text-gray-400 border border-gray-700 font-normal whitespace-nowrap">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {vr.sections.map((s, i) => (
                    <tr key={i} className="hover:bg-[#252535]">
                      <td className="px-2 py-0.5 border border-gray-800 font-mono text-gray-300">ПК{(s.station/100).toFixed(2)}</td>
                      <td className="px-2 py-0.5 border border-gray-800 text-red-300 font-mono">{s.cutArea.toFixed(2)}</td>
                      <td className="px-2 py-0.5 border border-gray-800 text-blue-300 font-mono">{s.fillArea.toFixed(2)}</td>
                      <td className="px-2 py-0.5 border border-gray-800 text-gray-400 font-mono">{s.intervalLength.toFixed(1)}</td>
                      <td className="px-2 py-0.5 border border-gray-800 text-red-200 font-mono">{s.cutVolume.toFixed(1)}</td>
                      <td className="px-2 py-0.5 border border-gray-800 text-blue-200 font-mono">{s.fillVolume.toFixed(1)}</td>
                      <td className="px-2 py-0.5 border border-gray-800 text-red-400 font-mono">{s.cumulativeCut.toFixed(1)}</td>
                      <td className="px-2 py-0.5 border border-gray-800 text-blue-400 font-mono">{s.cumulativeFill.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {tab === "mass" && (
            <div>
              <div className="text-[10px] text-gray-400 mb-2">Масса-кривая (ординаты нарастающим итогом: + насыпь, − выемка)</div>
              <svg width="100%" height="160" viewBox="0 0 500 160" style={{background:"#111827",borderRadius:4}}>
                {(() => {
                  const mc = vr.massCurve
                  if (!mc.length) return null
                  const sMin = mc[0].station, sMax = mc[mc.length-1].station
                  const mMin = Math.min(...mc.map(p=>p.massOrdinate))
                  const mMax = Math.max(...mc.map(p=>p.massOrdinate))
                  const mRange = mMax - mMin || 1
                  const px = (s: number) => ((s-sMin)/(sMax-sMin||1))*480+10
                  const py = (m: number) => 140 - ((m-mMin)/mRange)*120
                  const pts = mc.map(p=>`${px(p.station).toFixed(1)},${py(p.massOrdinate).toFixed(1)}`).join(" ")
                  const zeroY = py(0)
                  return (<>
                    <line x1="10" y1={zeroY} x2="490" y2={zeroY} stroke="#444" strokeWidth="1" strokeDasharray="4 2"/>
                    <text x="12" y={zeroY-2} fill="#666" fontSize="7" fontFamily="monospace">0</text>
                    <polyline points={pts} stroke="#4fc3f7" strokeWidth="1.5" fill="none"/>
                    {mc.filter((_,i)=>i%5===0).map((p,i)=>(
                      <g key={i}>
                        <circle cx={px(p.station)} cy={py(p.massOrdinate)} r="2" fill={p.massOrdinate>=0?"#4fc3f7":"#f87171"}/>
                      </g>
                    ))}
                  </>)
                })()}
              </svg>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-4 py-2 border-t border-gray-700 flex-shrink-0">
          <button onClick={onClose} className="px-3 py-1 bg-[#3a3a4e] text-gray-300 hover:bg-[#4a4a5e] rounded text-[11px]">Закрыть</button>
          <button onClick={()=>onOK()} className="px-3 py-1 bg-[#0078d4] text-white hover:bg-[#0066b3] rounded text-[11px]">Экспорт в CSV</button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── EarthworksVolumesDialog — Объёмы земляных работ + График масс Брикнера ──
type EarthworksResult = { name: string; cut: string; fill: string }

function EarthworksVolumesDialog({ onClose, onOK }: {
  onClose: () => void
  onOK: (d: EarthworksResult) => void
}) {
  const [tab, setTab] = useState<"summary"|"sections"|"mass"|"export">("summary")
  const [roadWidth, setRoadWidth] = useState(7.0)
  const [shoulderWidth, setShoulderWidth] = useState(2.5)
  const [cutSlope, setCutSlope] = useState(1.5)
  const [fillSlope, setFillSlope] = useState(1.5)
  const [spacing, setSpacing] = useState(20)

  // Генерация сечений по продольному профилю
  const sections = useMemo(() => {
    const res: { station: number; cutArea: number; fillArea: number; totalWidth: number; cutH: number; fillH: number }[] = []
    const totalLen = 2000
    const count = Math.floor(totalLen / spacing) + 1
    for (let i = 0; i < count; i++) {
      const st = i * spacing
      // Имитация рельефа (реалистичный горный профиль)
      const terrainH = Math.sin(st * 0.004) * 4.2 + Math.cos(st * 0.0028) * 2.8 + Math.sin(st * 0.011) * 1.1
      // Проектная красная линия (плавная)
      const designH = Math.sin(st * 0.003) * 2.0 + Math.cos(st * 0.0018) * 1.2
      const diff = terrainH - designH  // > 0 = выемка, < 0 = насыпь
      const hw = roadWidth / 2 + shoulderWidth
      let cutArea = 0, fillArea = 0
      if (diff > 0) {
        // Выемка: трапеция с откосами
        cutArea = diff * (roadWidth + shoulderWidth * 2) + cutSlope * diff * diff
      } else {
        // Насыпь: трапеция с откосами
        const fh = Math.abs(diff)
        fillArea = fh * (roadWidth + shoulderWidth * 2) + fillSlope * fh * fh
      }
      res.push({ station: st, cutArea: Math.max(0, cutArea), fillArea: Math.max(0, fillArea), totalWidth: hw * 2, cutH: diff > 0 ? diff : 0, fillH: diff < 0 ? Math.abs(diff) : 0 })
    }
    return res
  }, [roadWidth, shoulderWidth, cutSlope, fillSlope, spacing])

  // Призматоидный расчёт объёмов
  const volumeData = useMemo(() => {
    let cumCut = 0, cumFill = 0
    const rows = sections.slice(1).map((s, i) => {
      const s0 = sections[i]
      const L = s.station - s0.station
      const cutVol  = (s0.cutArea  + s.cutArea)  / 2 * L
      const fillVol = (s0.fillArea + s.fillArea) / 2 * L
      const corr = L / 12 * Math.abs(s0.cutArea - s.cutArea)
      const cv = Math.max(0, cutVol  - corr * 0.08)
      const fv = Math.max(0, fillVol - corr * 0.08)
      cumCut  += cv; cumFill += fv
      return { station: s.station, cutArea: s.cutArea, fillArea: s.fillArea, L, cutVol: cv, fillVol: fv, cumCut, cumFill, mass: cumCut - cumFill }
    })
    return { rows, totalCut: cumCut, totalFill: cumFill, net: cumCut - cumFill }
  }, [sections])

  const netColor = volumeData.net >= 0 ? "#f87171" : "#60a5fa"
  const netLabel = volumeData.net >= 0 ? "Избыток выемки (вывоз)" : "Дефицит (привоз)"

  // Масштаб для графика Брикнера
  const massPts = volumeData.rows
  const mMin = Math.min(0, ...massPts.map(p=>p.mass))
  const mMax = Math.max(0, ...massPts.map(p=>p.mass))
  const mRange = mMax - mMin || 1
  const sMax = massPts[massPts.length-1]?.station || 1
  const gW = 520, gH = 180
  const gx = (s: number) => (s / sMax) * (gW - 40) + 20
  const gy = (m: number) => gH - 20 - ((m - mMin) / mRange) * (gH - 40)
  const zeroY = gy(0)
  const polyline = massPts.map(p=>`${gx(p.station).toFixed(1)},${gy(p.mass).toFixed(1)}`).join(" ")
  // fillPath используется ниже для SVG-графика
  const fillPath = massPts.length > 1
    ? `M${gx(massPts[0].station).toFixed(1)},${zeroY.toFixed(1)} ` + massPts.map(p=>`L${gx(p.station).toFixed(1)},${gy(p.mass).toFixed(1)}`).join(" ") + ` L${gx(massPts[massPts.length-1].station).toFixed(1)},${zeroY.toFixed(1)} Z`
    : ""

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.95,opacity:0}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-lg shadow-2xl flex flex-col"
        style={{width:680, maxWidth:"98vw", maxHeight:"92vh"}}>

        {/* Шапка */}
        <div className="bg-[#0d1a2e] px-4 py-2 flex items-center justify-between border-b border-gray-700 flex-shrink-0 rounded-t-lg">
          <div className="flex items-center gap-2">
            <Icon name="BarChart3" size={14} className="text-[#0078d4]"/>
            <span className="text-white text-[12px] font-bold">Объёмы земляных работ — Ведомость</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm">✕</button>
        </div>

        {/* Параметры коридора */}
        <div className="flex gap-4 px-4 py-2.5 border-b border-gray-800 bg-[#111827] flex-shrink-0 flex-wrap">
          {([
            ["Ширина проезжей части, м", roadWidth, setRoadWidth, 4, 12, 0.5],
            ["Обочины, м", shoulderWidth, setShoulderWidth, 0.5, 4, 0.5],
            ["Откос выемки 1:", cutSlope, setCutSlope, 0.5, 3, 0.25],
            ["Откос насыпи 1:", fillSlope, setFillSlope, 0.5, 3, 0.25],
            ["Шаг сечений, м", spacing, setSpacing, 10, 50, 10],
          ] as [string, number, (v:number)=>void, number, number, number][]).map(([lbl, val, set, min, max, step])=>(
            <label key={lbl} className="flex flex-col gap-0.5 min-w-[100px]">
              <span className="text-[9px] text-gray-500">{lbl}</span>
              <div className="flex items-center gap-1">
                <input type="range" min={min} max={max} step={step} value={val}
                  onChange={e=>set(parseFloat(e.target.value))}
                  className="w-20 accent-[#0078d4] h-1"/>
                <span className="text-[10px] text-white font-mono w-8">{val}</span>
              </div>
            </label>
          ))}
        </div>

        {/* Вкладки */}
        <div className="flex border-b border-gray-700 flex-shrink-0 bg-[#1a1a2e]">
          {([["summary","Сводка"],["sections","По сечениям"],["mass","График масс"],["export","Экспорт"]] as const).map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`px-4 py-1.5 text-[10px] border-r border-gray-800 transition-colors ${tab===id?"bg-[#252535] text-white border-b-2 border-b-[#0078d4]":"text-gray-400 hover:bg-[#252535]"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-4 min-h-0">

          {/* ── СВОДКА ── */}
          {tab === "summary" && (
            <div className="space-y-4">
              {/* Итоговые блоки */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label:"Выемка (Cut)", value:`${(volumeData.totalCut/1000).toFixed(2)} тыс. м³`, sub:`${volumeData.totalCut.toFixed(0)} м³`, color:"#f87171", icon:"ArrowDown" },
                  { label:"Насыпь (Fill)", value:`${(volumeData.totalFill/1000).toFixed(2)} тыс. м³`, sub:`${volumeData.totalFill.toFixed(0)} м³`, color:"#60a5fa", icon:"ArrowUp" },
                  { label:netLabel, value:`${(Math.abs(volumeData.net)/1000).toFixed(2)} тыс. м³`, sub:`${Math.abs(volumeData.net).toFixed(0)} м³`, color: netColor, icon:"TrendingUp" },
                ].map(b=>(
                  <div key={b.label} className="rounded-lg border border-gray-700 p-3 flex items-start gap-3" style={{background:"#111827"}}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:b.color+"15"}}>
                      <Icon name={b.icon} size={16} style={{color:b.color}} fallback="BarChart3"/>
                    </div>
                    <div>
                      <div className="text-[9px] text-gray-500 mb-0.5">{b.label}</div>
                      <div className="text-white font-bold text-[14px] font-mono">{b.value}</div>
                      <div className="text-[10px] font-mono" style={{color:b.color}}>{b.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Параметры коридора */}
              <div className="rounded-lg border border-gray-700 p-3" style={{background:"#111827"}}>
                <div className="text-[10px] text-gray-400 font-bold mb-2 uppercase tracking-wide">Параметры коридора</div>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  {[
                    ["Длина трассы", "2 000 м"],
                    ["Ширина дороги", `${roadWidth} + 2×${shoulderWidth} м`],
                    ["Сечений", `${sections.length} шт.`],
                    ["Шаг", `${spacing} м`],
                    ["Откос выемки", `1:${cutSlope}`],
                    ["Откос насыпи", `1:${fillSlope}`],
                  ].map(([k,v])=>(
                    <div key={k} className="flex justify-between gap-2 border-b border-gray-800 pb-1">
                      <span className="text-gray-500">{k}</span>
                      <span className="text-white font-mono">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Распределение по зонам */}
              <div className="rounded-lg border border-gray-700 p-3" style={{background:"#111827"}}>
                <div className="text-[10px] text-gray-400 font-bold mb-2 uppercase tracking-wide">Распределение земляных работ</div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-[9px] text-red-400 w-12">Выемка</div>
                  <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500/70 rounded-full transition-all"
                      style={{width:`${(volumeData.totalCut/(volumeData.totalCut+volumeData.totalFill||1)*100).toFixed(0)}%`}}/>
                  </div>
                  <div className="text-[9px] text-red-400 font-mono w-12 text-right">{(volumeData.totalCut/(volumeData.totalCut+volumeData.totalFill||1)*100).toFixed(0)}%</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-[9px] text-blue-400 w-12">Насыпь</div>
                  <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500/70 rounded-full transition-all"
                      style={{width:`${(volumeData.totalFill/(volumeData.totalCut+volumeData.totalFill||1)*100).toFixed(0)}%`}}/>
                  </div>
                  <div className="text-[9px] text-blue-400 font-mono w-12 text-right">{(volumeData.totalFill/(volumeData.totalCut+volumeData.totalFill||1)*100).toFixed(0)}%</div>
                </div>
              </div>
            </div>
          )}

          {/* ── ПО СЕЧЕНИЯМ ── */}
          {tab === "sections" && (
            <div>
              <div className="text-[9px] text-gray-500 mb-2">{volumeData.rows.length} интервалов · призматоидный метод · шаг {spacing} м</div>
              <div className="overflow-auto" style={{maxHeight:380}}>
                <table className="w-full border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-[#0d1117] sticky top-0">
                      {["Пикет","Выем. пл. м²","Нас. пл. м²","L, м","V выем. м³","V нас. м³","∑ Выем. м³","∑ Нас. м³","Ордината"].map(h=>(
                        <th key={h} className="px-2 py-1 text-gray-400 border border-gray-800 font-normal whitespace-nowrap text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {volumeData.rows.map((r,i)=>(
                      <tr key={i} className={`${i%2===0?"bg-[#111827]":"bg-[#0d1117]"} hover:bg-[#1a2a3a]`}>
                        <td className="px-2 py-0.5 border border-gray-800 font-mono text-gray-300 whitespace-nowrap">
                          ПК{Math.floor(r.station/100)}+{String(r.station%100).padStart(2,"0")}
                        </td>
                        <td className="px-2 py-0.5 border border-gray-800 text-red-300 font-mono">{r.cutArea.toFixed(2)}</td>
                        <td className="px-2 py-0.5 border border-gray-800 text-blue-300 font-mono">{r.fillArea.toFixed(2)}</td>
                        <td className="px-2 py-0.5 border border-gray-800 text-gray-400 font-mono">{r.L.toFixed(0)}</td>
                        <td className="px-2 py-0.5 border border-gray-800 text-red-200 font-mono">{r.cutVol.toFixed(1)}</td>
                        <td className="px-2 py-0.5 border border-gray-800 text-blue-200 font-mono">{r.fillVol.toFixed(1)}</td>
                        <td className="px-2 py-0.5 border border-gray-800 text-red-400 font-mono font-semibold">{r.cumCut.toFixed(0)}</td>
                        <td className="px-2 py-0.5 border border-gray-800 text-blue-400 font-mono font-semibold">{r.cumFill.toFixed(0)}</td>
                        <td className={`px-2 py-0.5 border border-gray-800 font-mono font-semibold ${r.mass>=0?"text-red-400":"text-blue-400"}`}>{r.mass.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#0a1a2e] font-bold">
                      <td className="px-2 py-1 border border-gray-700 text-white text-[10px]" colSpan={4}>ИТОГО</td>
                      <td className="px-2 py-1 border border-gray-700 text-red-300 font-mono text-[10px]">{volumeData.totalCut.toFixed(0)}</td>
                      <td className="px-2 py-1 border border-gray-700 text-blue-300 font-mono text-[10px]">{volumeData.totalFill.toFixed(0)}</td>
                      <td className="px-2 py-1 border border-gray-700 text-red-400 font-mono text-[10px]">{volumeData.totalCut.toFixed(0)}</td>
                      <td className="px-2 py-1 border border-gray-700 text-blue-400 font-mono text-[10px]">{volumeData.totalFill.toFixed(0)}</td>
                      <td className={`px-2 py-1 border border-gray-700 font-mono text-[10px] ${volumeData.net>=0?"text-red-400":"text-blue-400"}`}>{volumeData.net.toFixed(0)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ── ГРАФИК МАСС БРИКНЕРА ── */}
          {tab === "mass" && (
            <div className="space-y-3">
              <div className="flex items-start gap-4 text-[10px] text-gray-400">
                <div>Ординаты нарастающим итогом: <span className="text-red-400">+ Выемка</span>, <span className="text-blue-400">− Насыпь</span></div>
                <div>Горизонталь — равновесная линия распределения грунта</div>
              </div>

              {/* Главный график */}
              <div className="rounded-lg border border-gray-700 overflow-hidden" style={{background:"#080e18"}}>
                <svg width="100%" viewBox={`0 0 ${gW} ${gH+40}`} style={{display:"block"}}>
                  {/* Сетка */}
                  {Array.from({length:11}).map((_,i)=>(
                    <line key={`vg${i}`} x1={gx(sMax*i/10)} y1="10" x2={gx(sMax*i/10)} y2={gH+10}
                      stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                  ))}
                  {Array.from({length:6}).map((_,i)=>(
                    <line key={`hg${i}`} x1="20" y1={gy(mMin+(mMax-mMin)*i/5)} x2={gW-10} y2={gy(mMin+(mMax-mMin)*i/5)}
                      stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                  ))}

                  {/* Зона выемки (над нулём) — красная */}
                  {massPts.length > 1 && (
                    <path d={`M${gx(massPts[0].station)},${zeroY} ` +
                      massPts.map(p=>`L${gx(p.station).toFixed(1)},${Math.min(zeroY, gy(p.mass)).toFixed(1)}`).join(" ") +
                      ` L${gx(massPts[massPts.length-1].station)},${zeroY} Z`}
                      fill="rgba(239,68,68,0.12)" strokeWidth="0"/>
                  )}
                  {/* Зона насыпи (под нулём) — синяя */}
                  {massPts.length > 1 && (
                    <path d={`M${gx(massPts[0].station)},${zeroY} ` +
                      massPts.map(p=>`L${gx(p.station).toFixed(1)},${Math.max(zeroY, gy(p.mass)).toFixed(1)}`).join(" ") +
                      ` L${gx(massPts[massPts.length-1].station)},${zeroY} Z`}
                      fill="rgba(96,165,250,0.12)" strokeWidth="0"/>
                  )}

                  {/* Нулевая линия */}
                  <line x1="20" y1={zeroY} x2={gW-10} y2={zeroY} stroke="#6b7280" strokeWidth="1" strokeDasharray="6 3"/>
                  <text x="10" y={zeroY-3} fill="#6b7280" fontSize="7" fontFamily="monospace" textAnchor="middle">0</text>

                  {/* Область под кривой */}
                  {fillPath && <path d={fillPath} fill="rgba(79,195,247,0.06)" strokeWidth="0"/>}
                  {/* Кривая масс */}
                  {massPts.length > 1 && (
                    <polyline points={polyline} stroke="#4fc3f7" strokeWidth="2" fill="none"/>
                  )}

                  {/* Точки пересечения с нулём */}
                  {massPts.filter((p,i)=>i>0&&massPts[i-1].mass*p.mass<0).map((p,i)=>(
                    <circle key={i} cx={gx(p.station)} cy={zeroY} r="4"
                      fill="none" stroke="#facc15" strokeWidth="1.5"/>
                  ))}

                  {/* Подписи оси X (пикеты) */}
                  {Array.from({length:11}).map((_,i)=>{
                    const st = sMax*i/10
                    return <text key={i} x={gx(st)} y={gH+25} fill="#6b7280" fontSize="7" fontFamily="monospace" textAnchor="middle">
                      ПК{Math.floor(st/100)}+{String(Math.round(st%100)).padStart(2,"0")}
                    </text>
                  })}

                  {/* Подписи оси Y */}
                  {Array.from({length:5}).map((_,i)=>{
                    const m = mMin+(mMax-mMin)*i/4
                    return <text key={i} x="18" y={gy(m)+3} fill="#6b7280" fontSize="6.5" fontFamily="monospace" textAnchor="end">
                      {m>=0?"+":" "}{(m/1000).toFixed(1)}k
                    </text>
                  })}

                  {/* Легенда */}
                  <rect x="20" y="12" width="8" height="4" fill="rgba(239,68,68,0.4)"/>
                  <text x="32" y="17" fill="#f87171" fontSize="7">Выемка (↑)</text>
                  <rect x="90" y="12" width="8" height="4" fill="rgba(96,165,250,0.4)"/>
                  <text x="102" y="17" fill="#60a5fa" fontSize="7">Насыпь (↓)</text>
                  <line x1="160" y1="15" x2="175" y2="15" stroke="#4fc3f7" strokeWidth="1.5"/>
                  <text x="179" y="18" fill="#4fc3f7" fontSize="7">Кривая масс</text>
                  <circle cx="237" cy="15" r="3.5" fill="none" stroke="#facc15" strokeWidth="1.5"/>
                  <text x="244" y="18" fill="#facc15" fontSize="7">Нулевые точки</text>
                </svg>
              </div>

              {/* Анализ */}
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                {[
                  { label:"Макс. ордината", value:`+${(Math.max(0,...massPts.map(p=>p.mass))/1000).toFixed(2)} тыс. м³`, color:"#f87171" },
                  { label:"Мин. ордината", value:`${(Math.min(0,...massPts.map(p=>p.mass))/1000).toFixed(2)} тыс. м³`, color:"#60a5fa" },
                  { label:"Нулевых точек", value:`${massPts.filter((p,i)=>i>0&&massPts[i-1].mass*p.mass<0).length} шт.`, color:"#facc15" },
                ].map(s=>(
                  <div key={s.label} className="rounded-lg border border-gray-700 px-3 py-2" style={{background:"#111827"}}>
                    <div className="text-gray-500 mb-0.5">{s.label}</div>
                    <div className="font-mono font-bold" style={{color:s.color}}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ЭКСПОРТ ── */}
          {tab === "export" && (
            <div className="space-y-4">
              <div className="text-[11px] text-gray-400">Выберите формат экспорта ведомости земляных работ</div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { fmt:"CSV", icon:"FileSpreadsheet", desc:"Таблица для Excel / Calc", color:"#16a34a" },
                  { fmt:"XML", icon:"FileCode", desc:"LandXML — трассы и объёмы", color:"#0078d4" },
                  { fmt:"PDF", icon:"FileText", desc:"Ведомость для согласования", color:"#ef4444" },
                  { fmt:"DXF", icon:"PencilRuler", desc:"Поперечники в AutoCAD", color:"#7c3aed" },
                ].map(f=>(
                  <button key={f.fmt}
                    onClick={()=>onOK({ name:`Ведомость земляных работ.${f.fmt}`, cut:volumeData.totalCut.toFixed(0), fill:volumeData.totalFill.toFixed(0) })}
                    className="flex items-center gap-3 p-4 rounded-lg border border-gray-700 hover:border-[#0078d4] hover:bg-[#1e2a3a] transition-all text-left">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:f.color+"20"}}>
                      <Icon name={f.fmt==="CSV"?"Sheet":f.fmt==="XML"?"Code2":f.fmt==="PDF"?"FileText":"PencilRuler"} size={20} style={{color:f.color}} fallback="Download"/>
                    </div>
                    <div>
                      <div className="text-white font-bold text-[13px]">{f.fmt}</div>
                      <div className="text-gray-500 text-[11px]">{f.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Предпросмотр CSV */}
              <div className="rounded-lg border border-gray-700 overflow-hidden" style={{background:"#0d1117"}}>
                <div className="px-3 py-1.5 border-b border-gray-800 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">Предпросмотр CSV</span>
                  <span className="text-[9px] text-gray-600">{volumeData.rows.length} строк</span>
                </div>
                <pre className="p-3 text-[9px] text-gray-400 font-mono overflow-x-auto max-h-32">{
                  "Пикет;Выемка м²;Насыпь м²;L м;V выем. м³;V нас. м³;∑Выем м³;∑Нас м³;Ордината\n" +
                  volumeData.rows.slice(0,6).map(r=>`ПК${Math.floor(r.station/100)}+${String(r.station%100).padStart(2,"0")};${r.cutArea.toFixed(2)};${r.fillArea.toFixed(2)};${r.L.toFixed(0)};${r.cutVol.toFixed(1)};${r.fillVol.toFixed(1)};${r.cumCut.toFixed(0)};${r.cumFill.toFixed(0)};${r.mass.toFixed(0)}`).join("\n") +
                  "\n..."
                }</pre>
              </div>
            </div>
          )}
        </div>

        {/* Футер */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-700 flex-shrink-0 bg-[#111827] rounded-b-lg">
          <div className="text-[10px] text-gray-500 font-mono">
            Выемка: <span className="text-red-400">{volumeData.totalCut.toFixed(0)} м³</span>
            &nbsp;·&nbsp;
            Насыпь: <span className="text-blue-400">{volumeData.totalFill.toFixed(0)} м³</span>
            &nbsp;·&nbsp;
            Баланс: <span style={{color:netColor}}>{volumeData.net.toFixed(0)} м³</span>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1 bg-[#2a2a3e] text-gray-300 hover:bg-[#3a3a4e] rounded text-[11px]">Закрыть</button>
            <button onClick={()=>onOK({ name:"Ведомость земляных работ.csv", cut:volumeData.totalCut.toFixed(0), fill:volumeData.totalFill.toFixed(0) })}
              className="px-3 py-1 bg-[#0078d4] text-white hover:bg-[#0066b3] rounded text-[11px] flex items-center gap-1">
              <Icon name="Download" size={11}/>Экспорт CSV
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Drawing Settings Dialog ──────────────────────────────────────────────────
function DrawingSettingsDialog({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"units"|"crs"|"project"|"plugins">("units")
  const [units, setUnits] = useState("Метры")
  const [precision, setPrecision] = useState("0.001")
  const [angUnit, setAngUnit] = useState("Градусы (°)")
  const [crs, setCrs] = useState("МСК-70 / МСК-70 zone 1")
  const [epsg, setEpsg] = useState("20870")
  const [northAngle, setNorthAngle] = useState("0.000")
  const [projName, setProjName] = useState("Новый проект")
  const [author, setAuthor] = useState("")
  const [org, setOrg] = useState("")
  const [desc, setDesc] = useState("")
  const [scale, setScale] = useState("1:1000")
  const [pluginCode, setPluginCode] = useState(`# Python-плагин ЛАПА
# Доступ к объектам проекта через переменную 'project'
# Пример: получить все точки съёмки

points = project.survey_points
for pt in points:
    print(f"ID:{pt.id}  X:{pt.x:.3f}  Y:{pt.y:.3f}  Z:{pt.z:.3f}")`)
  const [pluginResult, setPluginResult] = useState("")

  const EPSG_LIST = [
    { code:"20870", name:"МСК-70 zone 1" },
    { code:"32637", name:"WGS84 / UTM zone 37N" },
    { code:"32638", name:"WGS84 / UTM zone 38N" },
    { code:"4326",  name:"WGS84 (географическая)" },
    { code:"3857",  name:"Web Mercator (EPSG:3857)" },
    { code:"28408", name:"Гаусс-Крюгер zone 8" },
    { code:"28409", name:"Гаусс-Крюгер zone 9" },
    { code:"28410", name:"Гаусс-Крюгер zone 10" },
    { code:"20001", name:"СК-42 / Гаусс-Крюгер CM 9E" },
  ]

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#1e1e2e] border border-gray-600 rounded-lg shadow-2xl flex flex-col" style={{width:560,maxHeight:"82vh"}}>
        <div className="bg-[#0d1a2e] px-4 py-2 flex items-center justify-between border-b border-gray-700 rounded-t-lg">
          <span className="text-white font-bold text-[13px] flex items-center gap-2">
            <Icon name="Settings" size={14} className="text-[#0078d4]"/>Настройки проекта
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        {/* Вкладки */}
        <div className="flex border-b border-gray-700 bg-[#151525]">
          {([["units","Единицы"],["crs","Система координат"],["project","Проект"],["plugins","Плагины"]] as const).map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`px-4 py-1.5 text-[10px] border-r border-gray-800 transition-colors ${tab===id?"bg-[#252535] text-white border-b-2 border-b-[#0078d4]":"text-gray-400 hover:bg-[#252535]"}`}>
              {lbl}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-4 text-[11px]">

          {tab === "units" && (
            <div className="space-y-3">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Единицы измерения и точность</div>
              {([
                ["Линейные единицы:", units, setUnits, ["Метры","Километры","Сантиметры","Миллиметры","Футы","Дюймы"]],
                ["Угловые единицы:", angUnit, setAngUnit, ["Градусы (°)","Градусы-минуты-секунды","Радианы","Грады"]],
                ["Точность линейная:", precision, setPrecision, ["0.1","0.01","0.001","0.0001","0.00001"]],
                ["Масштаб чертежа:", scale, setScale, ["1:500","1:1000","1:2000","1:5000","1:10000","1:25000","1:50000"]],
              ] as [string, string, (v:string)=>void, string[]][]).map(([lbl,val,setter,opts])=>(
                <div key={lbl} className="flex items-center gap-3">
                  <span className="text-gray-400 w-44">{lbl}</span>
                  <select value={val} onChange={e=>setter(e.target.value)}
                    className="flex-1 bg-[#252535] border border-gray-600 text-gray-200 px-2 py-1 rounded outline-none focus:border-[#0078d4]">
                    {opts.map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <span className="text-gray-400 w-44">Угол севера, °:</span>
                <input value={northAngle} onChange={e=>setNorthAngle(e.target.value)}
                  className="w-28 bg-[#252535] border border-gray-600 text-gray-200 px-2 py-1 rounded outline-none focus:border-[#0078d4] font-mono"/>
              </div>
            </div>
          )}

          {tab === "crs" && (
            <div className="space-y-3">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Система координат / EPSG</div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400 w-44">Система координат:</span>
                <select value={crs} onChange={e=>{
                  setCrs(e.target.value)
                  const found = EPSG_LIST.find(x=>x.name===e.target.value)
                  if(found) setEpsg(found.code)
                }}
                  className="flex-1 bg-[#252535] border border-gray-600 text-gray-200 px-2 py-1 rounded outline-none focus:border-[#0078d4]">
                  {EPSG_LIST.map(s=><option key={s.code}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400 w-44">Код EPSG:</span>
                <input value={epsg} onChange={e=>setEpsg(e.target.value)}
                  className="w-28 bg-[#252535] border border-gray-600 text-gray-200 px-2 py-1 rounded outline-none focus:border-[#0078d4] font-mono"/>
              </div>
              {/* Информация о проекции */}
              <div className="rounded-lg border border-gray-700 p-3" style={{background:"#0d1117"}}>
                <div className="text-[10px] text-gray-400 font-bold mb-2">Параметры проекции EPSG:{epsg}</div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  {[
                    ["Тип проекции", epsg==="4326"?"Географическая (lat/lon)":epsg==="3857"?"Псевдо-Меркатор":"Поперечная Меркатора"],
                    ["Датум", epsg==="20870"||epsg==="28408"||epsg==="28409"||epsg==="28410"?"Пулково 1942":epsg==="20001"?"СК-42":"WGS 84"],
                    ["Единицы", epsg==="4326"?"Десятичные градусы":"Метры"],
                    ["Центральный меридиан", epsg==="32637"?"39°E":epsg==="32638"?"45°E":epsg==="20870"?"45°E":"—"],
                  ].map(([k,v])=>(
                    <div key={k} className="flex gap-2 border-b border-gray-800 pb-1">
                      <span className="text-gray-500 flex-1">{k}</span>
                      <span className="text-white font-mono">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "project" && (
            <div className="space-y-3">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Информация о проекте</div>
              {([
                ["Название проекта:", projName, setProjName, "Проект реконструкции дороги"],
                ["Автор:", author, setAuthor, "Иванов И.И."],
                ["Организация:", org, setOrg, "ООО Дорпроект"],
              ] as [string, string, (v:string)=>void, string][]).map(([lbl,val,setter,ph])=>(
                <div key={lbl} className="flex items-center gap-3">
                  <span className="text-gray-400 w-44">{lbl}</span>
                  <input value={val} onChange={e=>setter(e.target.value)} placeholder={ph}
                    className="flex-1 bg-[#252535] border border-gray-600 text-gray-200 px-2 py-1 rounded outline-none focus:border-[#0078d4]"/>
                </div>
              ))}
              <div className="flex items-start gap-3">
                <span className="text-gray-400 w-44 pt-1">Описание:</span>
                <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3}
                  placeholder="Краткое описание проекта..."
                  className="flex-1 bg-[#252535] border border-gray-600 text-gray-200 px-2 py-1 rounded outline-none focus:border-[#0078d4] resize-none text-[11px]"/>
              </div>
              <div className="rounded-lg border border-gray-700 p-3" style={{background:"#0d1117"}}>
                <div className="text-[10px] text-gray-500 mb-1">Метаданные файла проекта .lapa</div>
                <div className="font-mono text-[9px] text-gray-400">{`{"name":"${projName||"Новый проект"}","author":"${author||"—"}","org":"${org||"—"}","epsg":${epsg},"units":"${units}","created":"${new Date().toISOString().slice(0,10)}"}`}</div>
              </div>
            </div>
          )}

          {tab === "plugins" && (
            <div className="space-y-3">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Плагины и скрипты Python/C#</div>
              <div className="flex gap-2 mb-1">
                {["Python","C# Script","AutoLISP"].map(lang=>(
                  <span key={lang} className="text-[9px] px-2 py-0.5 rounded-full border border-gray-700 text-gray-400">{lang}</span>
                ))}
              </div>
              <div className="rounded-lg border border-gray-700 overflow-hidden" style={{background:"#0d1117"}}>
                <div className="px-3 py-1.5 border-b border-gray-800 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-mono">plugin.py</span>
                  <button onClick={()=>setPluginResult("Выполнено успешно!\n> Обработано 0 точек\n> Время: 0.003 сек")}
                    className="text-[9px] px-2 py-0.5 bg-green-600/30 text-green-400 rounded border border-green-700/40 hover:bg-green-600/50 transition-colors">▶ Запустить</button>
                </div>
                <textarea value={pluginCode} onChange={e=>setPluginCode(e.target.value)} rows={8}
                  className="w-full bg-transparent text-[10px] text-green-300 font-mono p-3 outline-none resize-none"/>
              </div>
              {pluginResult && (
                <div className="rounded border border-gray-700 p-2 text-[10px] text-green-400 font-mono" style={{background:"#0d1117"}}>
                  <pre>{pluginResult}</pre>
                </div>
              )}
              <div className="text-[9px] text-gray-600">API: project.survey_points, project.alignments, project.surfaces, project.corridors, project.networks</div>
            </div>
          )}

        </div>
        <div className="flex justify-end gap-2 px-4 py-2 border-t border-gray-700 bg-[#151525] rounded-b-lg">
          <button onClick={onClose} className="px-3 py-1 bg-[#2a2a3e] text-gray-300 hover:bg-[#3a3a4e] rounded text-[11px]">Отмена</button>
          <button onClick={()=>{ onClose() }}
            className="px-4 py-1 bg-[#0078d4] text-white hover:bg-[#0066b3] rounded text-[11px]">Применить</button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Draw2D Dialog ─────────────────────────────────────────────────────────
interface Draw2DProps { onClose: ()=>void; onOK: (obj: {type:string;name:string;params:Record<string,string>})=>void }
function Draw2DDialog({ onClose, onOK }: Draw2DProps) {
  const [type, setType] = useState("Линия")
  const [name, setName] = useState("")
  const [layer, setLayer] = useState("0")
  const [color, setColor] = useState("#ffffff")
  const [params, setParams] = useState<Record<string,string>>({})
  const types = ["Линия","Отрезок","Полилиния","Дуга","Круг","Эллипс","Прямоугольник","Сплайн","Текст","Многострочный текст","Штриховка","Точка"]
  const LAYERS = ["0","Дороги","Сети","Точки","Аннотации","Границы","Рельеф","Конструкции"]
  const paramFields: Record<string,{label:string;key:string;placeholder:string}[]> = {
    "Линия": [{label:"X1",key:"x1",placeholder:"0"},{label:"Y1",key:"y1",placeholder:"0"},{label:"X2",key:"x2",placeholder:"100"},{label:"Y2",key:"y2",placeholder:"0"}],
    "Отрезок": [{label:"X1",key:"x1",placeholder:"0"},{label:"Y1",key:"y1",placeholder:"0"},{label:"X2",key:"x2",placeholder:"100"},{label:"Y2",key:"y2",placeholder:"0"}],
    "Полилиния": [{label:"Точки (X,Y через ;)",key:"pts",placeholder:"0,0;100,0;100,100;0,100"}],
    "Дуга": [{label:"Центр X",key:"cx",placeholder:"0"},{label:"Центр Y",key:"cy",placeholder:"0"},{label:"Радиус",key:"r",placeholder:"50"},{label:"Угол нач.",key:"a1",placeholder:"0"},{label:"Угол кон.",key:"a2",placeholder:"180"}],
    "Круг": [{label:"Центр X",key:"cx",placeholder:"0"},{label:"Центр Y",key:"cy",placeholder:"0"},{label:"Радиус",key:"r",placeholder:"50"}],
    "Эллипс": [{label:"Центр X",key:"cx",placeholder:"0"},{label:"Центр Y",key:"cy",placeholder:"0"},{label:"Ось A",key:"ra",placeholder:"80"},{label:"Ось B",key:"rb",placeholder:"40"}],
    "Прямоугольник": [{label:"X",key:"x",placeholder:"0"},{label:"Y",key:"y",placeholder:"0"},{label:"Ширина",key:"w",placeholder:"100"},{label:"Высота",key:"h",placeholder:"60"}],
    "Сплайн": [{label:"Точки (X,Y через ;)",key:"pts",placeholder:"0,0;50,50;100,0"}],
    "Текст": [{label:"X",key:"x",placeholder:"0"},{label:"Y",key:"y",placeholder:"0"},{label:"Высота",key:"h",placeholder:"5"},{label:"Текст",key:"text",placeholder:"Подпись"}],
    "Многострочный текст": [{label:"X",key:"x",placeholder:"0"},{label:"Y",key:"y",placeholder:"0"},{label:"Ширина блока",key:"w",placeholder:"100"},{label:"Текст",key:"text",placeholder:"Многострочный текст"}],
    "Штриховка": [{label:"Тип",key:"pattern",placeholder:"ANSI31"},{label:"Масштаб",key:"scale",placeholder:"1"},{label:"Угол",key:"angle",placeholder:"0"}],
    "Точка": [{label:"X",key:"x",placeholder:"0"},{label:"Y",key:"y",placeholder:"0"},{label:"Z",key:"z",placeholder:"0"}],
  }
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <motion.div initial={{scale:0.92}} animate={{scale:1}} exit={{scale:0.92}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-lg shadow-2xl w-[500px]" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700 bg-[#252535] rounded-t-lg">
          <span className="text-white text-[13px] font-bold">Черчение 2D-геометрии</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="text-[10px] text-gray-400 block mb-1">Тип объекта</label>
              <select value={type} onChange={e=>{setType(e.target.value);setParams({})}}
                className="w-full bg-[#2a2a3e] border border-gray-600 text-white text-[11px] px-2 py-1.5 rounded outline-none focus:border-blue-500">
                {types.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Слой</label>
              <select value={layer} onChange={e=>setLayer(e.target.value)}
                className="w-full bg-[#2a2a3e] border border-gray-600 text-white text-[11px] px-2 py-1.5 rounded outline-none focus:border-blue-500">
                {LAYERS.map(l=><option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Цвет</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={color} onChange={e=>setColor(e.target.value)} className="w-8 h-7 rounded border border-gray-600 bg-transparent cursor-pointer"/>
                <span className="text-[10px] text-gray-400">{color}</span>
              </div>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-400 block mb-1">Имя объекта</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder={`${type}_001`}
              className="w-full bg-[#2a2a3e] border border-gray-600 text-white text-[11px] px-2 py-1.5 rounded outline-none focus:border-blue-500"/>
          </div>
          <div className="border border-gray-700 rounded p-3 bg-[#16162a]">
            <div className="text-[10px] text-gray-400 mb-2 font-semibold">Параметры {type}</div>
            <div className="grid grid-cols-2 gap-2">
              {(paramFields[type]||[]).map(f=>(
                <div key={f.key} className={f.key==="pts"||f.key==="text"?"col-span-2":""}>
                  <label className="text-[10px] text-gray-500 block mb-0.5">{f.label}</label>
                  <input value={params[f.key]||""} onChange={e=>setParams(p=>({...p,[f.key]:e.target.value}))}
                    placeholder={f.placeholder}
                    className="w-full bg-[#2a2a3e] border border-gray-600 text-white text-[11px] px-2 py-1 rounded outline-none focus:border-blue-400"/>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-4 py-2.5 border-t border-gray-700">
          <button onClick={onClose} className="text-[11px] text-gray-400 hover:text-white px-3 py-1.5">Отмена</button>
          <button onClick={()=>onOK({type,name:name||`${type}_001`,params:{...params,layer,color}})}
            className="text-[11px] bg-[#0078d4] hover:bg-[#005fa3] text-white px-4 py-1.5 rounded">Создать</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Annotation Dialog ──────────────────────────────────────────────────────
interface AnnotationProps { onClose: ()=>void; onOK: (obj:{type:string;name:string})=>void }
function AnnotationDialog({ onClose, onOK }: AnnotationProps) {
  const [type, setType] = useState("Линейный размер")
  const [text, setText] = useState("")
  const [style, setStyle] = useState("Стандарт")
  const [scale, setScale] = useState("1:500")
  const types = ["Линейный размер","Угловой размер","Радиальный размер","Диаметральный размер","Выноска","Многовыноска","Текстовая аннотация","Таблица","Примечание","Штамп чертежа","Пикетажная метка","Метка уклона","Метка высоты","Метка объекта"]
  const styles = ["Стандарт","ISO-25","GOST_1","GOST_2","Civil (метрика)","Минимальный"]
  const scales = ["1:100","1:200","1:500","1:1000","1:2000","1:5000"]
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <motion.div initial={{scale:0.92}} animate={{scale:1}} exit={{scale:0.92}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-lg shadow-2xl w-[440px]" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700 bg-[#252535] rounded-t-lg">
          <span className="text-white text-[13px] font-bold">Аннотации</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Тип аннотации</label>
              <select value={type} onChange={e=>setType(e.target.value)}
                className="w-full bg-[#2a2a3e] border border-gray-600 text-white text-[11px] px-2 py-1.5 rounded outline-none focus:border-blue-500">
                {types.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Стиль</label>
              <select value={style} onChange={e=>setStyle(e.target.value)}
                className="w-full bg-[#2a2a3e] border border-gray-600 text-white text-[11px] px-2 py-1.5 rounded outline-none focus:border-blue-500">
                {styles.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Масштаб аннотации</label>
              <select value={scale} onChange={e=>setScale(e.target.value)}
                className="w-full bg-[#2a2a3e] border border-gray-600 text-white text-[11px] px-2 py-1.5 rounded outline-none focus:border-blue-500">
                {scales.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Текст / Содержание</label>
              <input value={text} onChange={e=>setText(e.target.value)} placeholder="Текст аннотации"
                className="w-full bg-[#2a2a3e] border border-gray-600 text-white text-[11px] px-2 py-1.5 rounded outline-none focus:border-blue-500"/>
            </div>
          </div>
          <div className="bg-[#16162a] rounded border border-gray-700 p-3 text-[10px] text-gray-400 space-y-1">
            <div className="text-gray-300 font-semibold mb-1">Параметры размещения</div>
            <div className="flex gap-4">
              <label className="flex items-center gap-1"><input type="checkbox" defaultChecked className="accent-blue-500"/> Ассоциативная</label>
              <label className="flex items-center gap-1"><input type="checkbox" className="accent-blue-500"/> Только для чтения</label>
              <label className="flex items-center gap-1"><input type="checkbox" defaultChecked className="accent-blue-500"/> Видима</label>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-4 py-2.5 border-t border-gray-700">
          <button onClick={onClose} className="text-[11px] text-gray-400 hover:text-white px-3 py-1.5">Отмена</button>
          <button onClick={()=>onOK({type,name:`${type} ${scale}`})}
            className="text-[11px] bg-[#0078d4] hover:bg-[#005fa3] text-white px-4 py-1.5 rounded">Разместить</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Hydrology Dialog ───────────────────────────────────────────────────────
interface HydrologyProps { onClose: ()=>void; onOK: (obj:{name:string;area:string;method:string})=>void }
function HydrologyDialog({ onClose, onOK }: HydrologyProps) {
  const [name, setName] = useState("Водосбор_1")
  const [method, setMethod] = useState("Рациональный метод")
  const [area, setArea] = useState("")
  const [runoff, setRunoff] = useState("0.35")
  const [intensity, setIntensity] = useState("75")
  const [tab, setTab] = useState("Водосбор")
  const methods = ["Рациональный метод","SCS/CN метод","Кинематическая волна","Метод Мэннинга","EPA SWMM"]
  const q = area && runoff && intensity ? (parseFloat(runoff)*parseFloat(intensity)*parseFloat(area)/360).toFixed(3) : "—"
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <motion.div initial={{scale:0.92}} animate={{scale:1}} exit={{scale:0.92}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-lg shadow-2xl w-[480px]" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700 bg-[#252535] rounded-t-lg">
          <span className="text-white text-[13px] font-bold">Гидрология и водосборы</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="flex border-b border-gray-700">
          {["Водосбор","Дренаж","Анализ","Пруды"].map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`text-[11px] px-4 py-2 border-b-2 transition-colors ${tab===t?"border-[#0078d4] text-white":"border-transparent text-gray-500 hover:text-gray-300"}`}>{t}</button>
          ))}
        </div>
        <div className="p-4 space-y-3">
          {tab==="Водосбор" && <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Название водосбора</label>
                <input value={name} onChange={e=>setName(e.target.value)}
                  className="w-full bg-[#2a2a3e] border border-gray-600 text-white text-[11px] px-2 py-1.5 rounded outline-none focus:border-blue-500"/>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Метод расчёта</label>
                <select value={method} onChange={e=>setMethod(e.target.value)}
                  className="w-full bg-[#2a2a3e] border border-gray-600 text-white text-[11px] px-2 py-1.5 rounded outline-none focus:border-blue-500">
                  {methods.map(m=><option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Площадь (га)</label>
                <input value={area} onChange={e=>setArea(e.target.value)} placeholder="5.0"
                  className="w-full bg-[#2a2a3e] border border-gray-600 text-white text-[11px] px-2 py-1.5 rounded outline-none focus:border-blue-500"/>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Коэф. стока (ψ)</label>
                <input value={runoff} onChange={e=>setRunoff(e.target.value)}
                  className="w-full bg-[#2a2a3e] border border-gray-600 text-white text-[11px] px-2 py-1.5 rounded outline-none focus:border-blue-500"/>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Интенсивность (мм/ч)</label>
                <input value={intensity} onChange={e=>setIntensity(e.target.value)}
                  className="w-full bg-[#2a2a3e] border border-gray-600 text-white text-[11px] px-2 py-1.5 rounded outline-none focus:border-blue-500"/>
              </div>
            </div>
            <div className="bg-[#16162a] rounded border border-gray-700 p-3 flex items-center justify-between">
              <span className="text-[11px] text-gray-400">Расчётный расход Q = ψ·q·F / 360</span>
              <span className="text-[16px] font-bold text-blue-400">{q} м³/с</span>
            </div>
          </>}
          {tab==="Дренаж" && <div className="space-y-2 text-[11px] text-gray-300">
            <div className="grid grid-cols-2 gap-3">
              {[{l:"Тип дренажа",opts:["Закрытый трубчатый","Открытый лоток","Канава","Накопительный пруд"]},{l:"Уклон трубы (%)",opts:[]},{l:"Диаметр трубы (мм)",opts:[]},{l:"Материал",opts:["Ж/б","HDPE","ПВХ","Асбоцемент"]}].map((f,i)=>(
                <div key={i}>
                  <label className="text-[10px] text-gray-400 block mb-1">{f.l}</label>
                  {f.opts.length ? <select className="w-full bg-[#2a2a3e] border border-gray-600 text-white text-[11px] px-2 py-1.5 rounded outline-none">{f.opts.map(o=><option key={o}>{o}</option>)}</select>
                    : <input placeholder="—" className="w-full bg-[#2a2a3e] border border-gray-600 text-white text-[11px] px-2 py-1.5 rounded outline-none"/>}
                </div>
              ))}
            </div>
          </div>}
          {tab==="Анализ" && <div className="text-[11px] text-gray-300 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {["Пути стока","Водосборные бассейны","Зоны затопления","Уклоны рельефа","Накопленный сток","Время добегания"].map(a=>(
                <label key={a} className="flex items-center gap-2 p-2 bg-[#16162a] rounded border border-gray-700 cursor-pointer hover:border-blue-500">
                  <input type="checkbox" className="accent-blue-500"/>{a}
                </label>
              ))}
            </div>
          </div>}
          {tab==="Пруды" && <div className="text-[11px] text-gray-300 space-y-2">
            {[{l:"Тип сооружения",opts:["Накопительный пруд","Инфильтрационный бассейн","Биопруд","Задержи. бассейн"]},{l:"Объём (м³)",opts:[]},{l:"Площадь зеркала (м²)",opts:[]},{l:"Время опорожнения (ч)",opts:[]}].map((f,i)=>(
              <div key={i}>
                <label className="text-[10px] text-gray-400 block mb-1">{f.l}</label>
                {f.opts.length ? <select className="w-full bg-[#2a2a3e] border border-gray-600 text-white text-[11px] px-2 py-1.5 rounded outline-none">{f.opts.map(o=><option key={o}>{o}</option>)}</select>
                  : <input placeholder="0" className="w-full bg-[#2a2a3e] border border-gray-600 text-white text-[11px] px-2 py-1.5 rounded outline-none"/>}
              </div>
            ))}
          </div>}
        </div>
        <div className="flex justify-end gap-2 px-4 py-2.5 border-t border-gray-700">
          <button onClick={onClose} className="text-[11px] text-gray-400 hover:text-white px-3 py-1.5">Отмена</button>
          <button onClick={()=>onOK({name,area:area||"0",method})}
            className="text-[11px] bg-[#0078d4] hover:bg-[#005fa3] text-white px-4 py-1.5 rounded">Создать</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── My Insights Panel ──────────────────────────────────────────────────────
function InsightsPanel({ onClose }: { onClose: ()=>void }) {
  const tips = [
    { icon: "Lightbulb", color: "#f59e0b", title: "Горячая клавиша", text: "Используй Ctrl+Z для отмены и Ctrl+Y для повтора действий" },
    { icon: "TrendingUp", color: "#4ade80", title: "Производительность", text: "Команда РЕФРЕШ ускорит перерисовку при большом числе объектов" },
    { icon: "Star", color: "#60a5fa", title: "Рекомендация", text: "Группируй точки по описаниям для удобной фильтрации в дереве" },
    { icon: "Zap", color: "#f97316", title: "Новая функция", text: "Водосборы теперь рассчитываются автоматически по рельефу поверхности" },
    { icon: "BookOpen", color: "#a855f7", title: "Обучение", text: "Открой команду DYNAMO для автоматизации создания характерных линий" },
  ]
  return (
    <motion.div initial={{x:320,opacity:0}} animate={{x:0,opacity:1}} exit={{x:320,opacity:0}}
      className="absolute right-0 top-0 bottom-0 w-72 bg-[#1a1a2e] border-l border-gray-700 flex flex-col z-40">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-[#252535]">
        <span className="text-white text-[12px] font-bold flex items-center gap-2">
          <Icon name="Sparkles" size={13} className="text-yellow-400"/> My Insights
        </span>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-sm">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {tips.map((t,i)=>(
          <div key={i} className="bg-[#16162a] border border-gray-700 rounded-lg p-3 hover:border-gray-500 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <Icon name={t.icon} size={12} style={{color:t.color}} fallback="Star"/>
              <span className="text-[10px] font-semibold" style={{color:t.color}}>{t.title}</span>
            </div>
            <p className="text-[11px] text-gray-300 leading-relaxed">{t.text}</p>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-gray-700">
        <button className="w-full text-[11px] bg-[#0078d4]/20 hover:bg-[#0078d4]/40 text-blue-300 border border-blue-500/30 px-3 py-2 rounded transition-colors">
          Показать все подсказки
        </button>
      </div>
    </motion.div>
  )
}

// ─── LiveCrossSectionPanel (Виды поперечников — живая панель, Civil 3D 2027) ──

const SECTION_PROFILES: Record<string, { label: string; color: string; pts: string; fill?: string; roadW: number; leftSlope: string; rightSlope: string }[]> = {
  "Дорога ШД-38": [
    { label: "Дорога и парковочная зона", color: "#f97316", pts: "20,60 60,40 100,38 140,38 180,40 220,60", fill: "#f97316", roadW: 7.0, leftSlope: "-2.5%", rightSlope: "-2.5%" },
    { label: "Обочина укреплённая", color: "#6b7280", pts: "10,65 20,60 220,60 230,65", fill: "#4b5563", roadW: 3.0, leftSlope: "-4.0%", rightSlope: "-4.0%" },
    { label: "Откос насыпи", color: "#4ade80", pts: "10,65 0,90 240,90 230,65", fill: "#166534", roadW: 0, leftSlope: "1:1.5", rightSlope: "1:1.5" },
  ],
  "Ул. Трумана": [
    { label: "Дорога 4 полосы", color: "#06b6d4", pts: "10,55 40,38 120,36 180,36 220,38 250,55", fill: "#06b6d4", roadW: 14.0, leftSlope: "-2.0%", rightSlope: "-2.0%" },
    { label: "Тротуар лев/прав", color: "#a78bfa", pts: "5,65 10,55 250,55 255,65", fill: "#7c3aed", roadW: 3.0, leftSlope: "-2.0%", rightSlope: "-2.0%" },
    { label: "Бордюр", color: "#e5e7eb", pts: "5,65 10,55 12,55 12,70 248,70 248,55 250,55 255,65", fill: "#9ca3af", roadW: 0.5, leftSlope: "0%", rightSlope: "0%" },
  ],
  "Бордюр периметра": [
    { label: "БОРДЮР ПЕРИМЕТРА", color: "#e879f9", pts: "40,65 60,38 200,38 220,65", fill: "#7e22ce", roadW: 1.0, leftSlope: "0%", rightSlope: "0%" },
  ],
  "Ливневая канализация": [
    { label: "V-образный лоток", color: "#22d3ee", pts: "60,30 120,70 180,30", fill: "#0e7490", roadW: 0, leftSlope: "10%", rightSlope: "10%" },
    { label: "Трапецеидальный лоток", color: "#60a5fa", pts: "50,30 80,70 160,70 190,30", fill: "#1e40af", roadW: 2.0, leftSlope: "8%", rightSlope: "8%" },
  ],
}
const DEFAULT_SECTIONS = [
  { label: "ДОРОГА И ПАРКОВОЧНАЯ ЗОНА", color: "#f97316", pts: "20,60 60,40 100,38 140,38 180,40 220,60", roadW: 7.0, leftSlope: "-2.5%", rightSlope: "-2.5%", fill: "#f9731630" },
  { label: "БОРДЮР ПЕРИМЕТРА", color: "#e879f9", pts: "40,65 60,38 200,38 220,65", roadW: 1.0, leftSlope: "0%", rightSlope: "0%", fill: "#7e22ce30" },
  { label: "V-ОБРАЗНЫЙ ЛОТОК", color: "#22d3ee", pts: "60,30 120,70 180,30", roadW: 0, leftSlope: "10%", rightSlope: "10%", fill: "#0e749030" },
]

const STATIONS_BY_ALIGNMENT: Record<string, string[]> = {
  "Дорога ШД-38": ["0+000","0+020","0+040","0+060","0+080","0+100","0+120","0+140","0+160","0+180","0+200"],
  "Ул. Трумана": ["0+000","0+050","0+100","0+150","0+200","0+250","0+300","0+350","0+400","0+450","0+500"],
  "Бордюр периметра": ["0+000","0+040","0+080","0+120","0+160","0+200"],
  "Ливневая канализация": ["0+000","0+025","0+050","0+075","0+100"],
}

function LiveCrossSectionPanel({ alignments, onClose, selectedAlignment }: {
  alignments: string[]
  onClose: () => void
  selectedAlignment?: string
}) {
  const allAlignments = alignments.length > 0 ? alignments : ["Дорога ШД-38", "Ул. Трумана", "Бордюр периметра", "Ливневая канализация"]
  const [activeAlignment, setActiveAlignment] = useState(selectedAlignment || allAlignments[0] || "Дорога ШД-38")
  const stations = STATIONS_BY_ALIGNMENT[activeAlignment] || ["0+000","0+020","0+040","0+060","0+080"]
  const [stationIdx, setStationIdx] = useState(0)
  const [selectedSectionIdx, setSelectedSectionIdx] = useState(0)
  const [showGrid, setShowGrid] = useState(true)
  const [showDim, setShowDim] = useState(true)

  // Sync when selectedAlignment prop changes
  useEffect(() => {
    if (selectedAlignment) {
      setActiveAlignment(selectedAlignment)
      setStationIdx(0)
      setSelectedSectionIdx(0)
    }
   
  }, [selectedAlignment])

  const sections = SECTION_PROFILES[activeAlignment] || DEFAULT_SECTIONS
  const activeSec = sections[selectedSectionIdx] || sections[0]
  const currentStation = stations[stationIdx] || "0+000"

  // Slight variation per station for realism
  const variation = (stationIdx * 0.3) % 2.5
  const leftSlopeNum = parseFloat(activeSec.leftSlope) - variation
  const rightSlopeNum = parseFloat(activeSec.rightSlope) + variation * 0.5

  return (
    <motion.div initial={{ x: 280, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 280, opacity: 0 }}
      className="absolute right-0 top-0 bottom-0 bg-[#111827] border-l border-gray-700 flex flex-col z-30 overflow-hidden"
      style={{ width: 280 }}>

      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-[#1a1a2e] border-b border-gray-700 flex-shrink-0">
        <span className="text-white text-[11px] font-bold">Виды поперечников</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowGrid(p => !p)} title="Сетка"
            className={`text-[9px] px-1 py-0.5 rounded ${showGrid ? "bg-[#0078d4] text-white" : "text-gray-500 hover:text-white"}`}>⊞</button>
          <button onClick={() => setShowDim(p => !p)} title="Размеры"
            className={`text-[9px] px-1 py-0.5 rounded ${showDim ? "bg-[#0078d4] text-white" : "text-gray-500 hover:text-white"}`}>↔</button>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xs ml-1">✕</button>
        </div>
      </div>

      {/* Alignment selector */}
      <div className="px-2 py-1 border-b border-gray-700 flex-shrink-0">
        <select value={activeAlignment} onChange={e => { setActiveAlignment(e.target.value); setStationIdx(0); setSelectedSectionIdx(0) }}
          className="w-full bg-[#252535] border border-gray-600 text-white text-[10px] px-1.5 py-1 rounded outline-none focus:border-[#0078d4]">
          {allAlignments.map(a => <option key={a}>{a}</option>)}
        </select>
      </div>

      {/* Station navigator */}
      <div className="px-2 py-1 border-b border-gray-700 flex items-center gap-1 flex-shrink-0">
        <button onClick={() => setStationIdx(i => Math.max(0, i - 1))}
          className="text-gray-400 hover:text-white text-[11px] w-5 h-5 flex items-center justify-center border border-gray-600 rounded hover:bg-[#0078d4]/20">‹</button>
        <div className="flex-1 text-center">
          <div className="text-[11px] text-[#0078d4] font-mono font-bold">{currentStation}</div>
          <div className="text-[9px] text-gray-500">{stationIdx + 1} / {stations.length}</div>
        </div>
        <button onClick={() => setStationIdx(i => Math.min(stations.length - 1, i + 1))}
          className="text-gray-400 hover:text-white text-[11px] w-5 h-5 flex items-center justify-center border border-gray-600 rounded hover:bg-[#0078d4]/20">›</button>
      </div>

      {/* Section tabs */}
      <div className="flex border-b border-gray-700 overflow-x-auto flex-shrink-0">
        {sections.map((sec, i) => (
          <button key={i} onClick={() => setSelectedSectionIdx(i)}
            className={`px-2 py-1 text-[9px] whitespace-nowrap border-r border-gray-700 transition-colors flex-shrink-0 ${selectedSectionIdx === i ? "bg-[#0078d4]/20 text-[#0078d4] font-bold border-b-2 border-b-[#0078d4]" : "text-gray-500 hover:text-white"}`}>
            {sec.label.length > 14 ? sec.label.slice(0, 13) + "…" : sec.label}
          </button>
        ))}
      </div>

      {/* Main cross-section SVG */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="relative flex-1" style={{ minHeight: 0 }}>
          <svg width="100%" height="100%" viewBox="0 0 260 110" preserveAspectRatio="xMidYMid meet"
            style={{ background: "#0d1117", display: "block" }}>

            {/* Grid */}
            {showGrid && <>
              {Array.from({ length: 14 }).map((_, i) => (
                <line key={`vg${i}`} x1={i * 20} y1="0" x2={i * 20} y2="110" stroke="rgba(59,130,246,0.08)" strokeWidth="0.5"/>
              ))}
              {Array.from({ length: 7 }).map((_, i) => (
                <line key={`hg${i}`} x1="0" y1={i * 18} x2="260" y2={i * 18} stroke="rgba(59,130,246,0.08)" strokeWidth="0.5"/>
              ))}
            </>}

            {/* Ground level */}
            <line x1="0" y1="72" x2="260" y2="72" stroke="#374151" strokeWidth="0.5" strokeDasharray="3,2"/>
            <text x="2" y="76" fill="#4b5563" fontSize="5">ЗЗ</text>

            {/* Existing terrain shading */}
            <rect x="0" y="72" width="260" height="38" fill="#1f2937" opacity="0.5"/>

            {/* Fill area under section */}
            {activeSec.fill && activeSec.pts && (
              <polygon points={activeSec.pts + " 260,110 0,110"} fill={activeSec.fill} opacity="0.3"/>
            )}

            {/* Main section polyline */}
            {activeSec.pts && (
              <polyline points={activeSec.pts} fill="none" stroke={activeSec.color} strokeWidth="2.5"/>
            )}

            {/* Station variation effect — slightly shift the profile */}
            {activeSec.pts && (
              <polyline
                points={activeSec.pts.split(" ").map((pt, idx, arr) => {
                  const [x, y] = pt.split(",").map(Number)
                  const yOff = idx === 0 || idx === arr.length - 1 ? 0 : variation * (idx % 2 === 0 ? 1 : -0.5)
                  return `${x},${(y + yOff).toFixed(1)}`
                }).join(" ")}
                fill="none" stroke={activeSec.color} strokeWidth="1" opacity="0.3" strokeDasharray="2,2"/>
            )}

            {/* Slope labels */}
            {showDim && <>
              <text x="45" y="52" fill={activeSec.color} fontSize="6.5" textAnchor="middle"
                transform={`rotate(-15, 45, 52)`}>
                {leftSlopeNum.toFixed(2)}%
              </text>
              <text x="215" y="52" fill={activeSec.color} fontSize="6.5" textAnchor="middle"
                transform={`rotate(15, 215, 52)`}>
                {rightSlopeNum.toFixed(2)}%
              </text>
            </>}

            {/* Road width dimension */}
            {showDim && activeSec.roadW > 0 && (
              <>
                <line x1="60" y1="82" x2="200" y2="82" stroke="#94a3b8" strokeWidth="0.8"/>
                <line x1="60" y1="79" x2="60" y2="85" stroke="#94a3b8" strokeWidth="0.8"/>
                <line x1="200" y1="79" x2="200" y2="85" stroke="#94a3b8" strokeWidth="0.8"/>
                <text x="130" y="90" fill="#94a3b8" fontSize="6" textAnchor="middle">
                  B = {activeSec.roadW.toFixed(1)} м
                </text>
              </>
            )}

            {/* Section label */}
            <text x="130" y="8" fill={activeSec.color} fontSize="7" textAnchor="middle" fontWeight="bold">
              {activeSec.label}
            </text>
            <text x="130" y="16" fill="#6b7280" fontSize="5.5" textAnchor="middle">
              ПК {currentStation}
            </text>
          </svg>
        </div>

        {/* Properties strip */}
        <div className="border-t border-gray-700 px-2 py-1.5 flex-shrink-0 space-y-1" style={{ background: "#0d1117" }}>
          {[
            ["Ширина", activeSec.roadW > 0 ? `${activeSec.roadW.toFixed(1)} м` : "—"],
            ["Уклон лев.", `${leftSlopeNum.toFixed(2)}%`],
            ["Уклон пр.", `${rightSlopeNum.toFixed(2)}%`],
            ["Пикет", currentStation],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between text-[9px]">
              <span className="text-gray-500">{k}:</span>
              <span className="text-white font-mono">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* All sections miniatures */}
      <div className="border-t border-gray-700 flex-shrink-0" style={{ background: "#0a0a14" }}>
        <div className="px-2 py-1 text-[9px] text-gray-500 border-b border-gray-800">Все сечения ({sections.length})</div>
        <div className="overflow-y-auto" style={{ maxHeight: 160 }}>
          {sections.map((sec, i) => (
            <button key={i} onClick={() => setSelectedSectionIdx(i)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 hover:bg-[#1a1a2e] transition-colors border-b border-gray-800 text-left
                ${selectedSectionIdx === i ? "bg-[#0078d4]/10 border-l-2 border-l-[#0078d4]" : ""}`}>
              <svg width="52" height="30" viewBox="0 0 260 110" style={{ background: "#0d1117", borderRadius: 2, flexShrink: 0 }}>
                {sec.fill && sec.pts && (
                  <polygon points={sec.pts + " 260,110 0,110"} fill={sec.fill} opacity="0.4"/>
                )}
                {sec.pts && (
                  <polyline points={sec.pts} fill="none" stroke={sec.color} strokeWidth="3"/>
                )}
                <line x1="0" y1="72" x2="260" y2="72" stroke="#374151" strokeWidth="0.8" strokeDasharray="4,2"/>
              </svg>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-white font-semibold truncate">{sec.label}</div>
                <div className="text-[9px] text-gray-500">
                  {sec.roadW > 0 ? `B=${sec.roadW}м` : "Без ширины"} · {sec.leftSlope}
                </div>
              </div>
              {selectedSectionIdx === i && (
                <span className="text-[#0078d4] text-[9px]">●</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Superelevation Dialog ───────────────────────────────────────────────────
function SuperelevationDialog({ onClose }: { onClose: () => void }) {
  const [supToast, setSupToast] = useState<string|null>(null)
  const supFlash = (m:string)=>{ setSupToast(m); setTimeout(()=>setSupToast(null), 2000) }
  const stations = [
    { sta: "0+700.00", left: -4.00, right: 4.00, status: "OK" },
    { sta: "0+712.19", left: -4.00, right: 2.00, status: "OK" },
    { sta: "0+712.19", left: -4.00, right: -4.00, status: "OK" },
    { sta: "0+724.19", left: -4.00, right: -6.00, status: "Нарушение" },
    { sta: "0+724.19", left: -6.00, right: -6.00, status: "OK" },
    { sta: "0+735.19", left: -6.00, right: -6.00, status: "OK" },
    { sta: "0+748.19", left: -6.00, right: -6.00, status: "Нарушение" },
    { sta: "0+748.19", left: -4.00, right: -6.00, status: "OK" },
    { sta: "0+766.19", left: -4.00, right: -4.00, status: "OK" },
    { sta: "0+766.19", left: -4.00, right: 2.00, status: "OK" },
    { sta: "0+800.00", left: -2.00, right: 4.00, status: "OK" },
  ]
  const [alignment, setAlignment] = useState("Трасса ШД-38")
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#f0f0f0] border border-gray-400 shadow-2xl flex flex-col relative" style={{ fontFamily: "Arial, sans-serif", fontSize: 12, width: 560, maxHeight: "85vh" }}>
        <div className="flex items-center justify-between bg-[#0078d4] px-3 py-1.5 flex-shrink-0">
          <span className="text-white font-bold text-sm">Поперечный уклон трассы</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 w-5 h-5 flex items-center justify-center text-xs">✕</button>
        </div>
        <div className="p-3 space-y-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <label className="w-28 text-xs text-gray-700 shrink-0">Трасса:</label>
            <select value={alignment} onChange={e => setAlignment(e.target.value)} className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
              <option>Трасса ШД-38</option>
              <option>Ул. Трумана</option>
              <option>Бордюр периметра</option>
            </select>
          </div>
          <div className="text-xs text-gray-600">Трасса: <span className="font-bold text-blue-700">{alignment}</span> | Диапазон пикетов: 0+700.00 — 0+800.00 м</div>
        </div>
        <div className="flex-1 overflow-y-auto border-t border-gray-300">
          <table className="w-full text-xs">
            <thead className="bg-[#d0d0d0] sticky top-0">
              <tr>
                <th className="px-2 py-1 text-left border-r border-gray-300 w-24">Пикет</th>
                <th className="px-2 py-1 text-right border-r border-gray-300 w-24">Уклон лев. (%)</th>
                <th className="px-2 py-1 text-right border-r border-gray-300 w-24">Уклон пр. (%)</th>
                <th className="px-2 py-1 text-center w-28">Статус</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((row, i) => (
                <tr key={i} className={`border-b border-gray-200 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"} ${row.status === "Нарушение" ? "bg-red-50" : ""}`}>
                  <td className="px-2 py-0.5 border-r border-gray-200 font-mono text-blue-700">{row.sta}</td>
                  <td className="px-2 py-0.5 border-r border-gray-200 text-right font-mono">{row.left.toFixed(2)}</td>
                  <td className="px-2 py-0.5 border-r border-gray-200 text-right font-mono">{row.right.toFixed(2)}</td>
                  <td className="px-2 py-0.5 text-center">
                    {row.status === "Нарушение"
                      ? <span className="text-red-600 font-bold flex items-center justify-center gap-1"><span>⚠</span> Нарушение</span>
                      : <span className="text-green-700 font-bold">OK</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-2 border-t border-gray-300 flex justify-end gap-2 flex-shrink-0 bg-[#e8e8e8]">
          <button onClick={()=>{ supFlash("✓ Виражи применены к трассе"); setTimeout(onClose, 800) }} className="px-4 py-1 bg-[#0078d4] text-white text-xs hover:bg-[#0066b3]">Применить</button>
          <button onClick={onClose} className="px-4 py-1 bg-[#e0e0e0] border border-gray-400 text-xs hover:bg-gray-300">Закрыть</button>
        </div>
        <AnimatePresence>
          {supToast && (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-[#0078d4] text-white text-[11px] px-3 py-1.5 rounded shadow-lg z-10 whitespace-nowrap">
              {supToast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ─── ProjectManagerDialog ─────────────────────────────────────────────────────

function ProjectManagerDialog({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"files"|"versions"|"team">("files")
  const [pmToast, setPmToast] = useState<string|null>(null)
  const pmFlash = (m:string)=>{ setPmToast(m); setTimeout(()=>setPmToast(null), 2000) }
  const files = [
    { name: "Align-Superelevation-5.dwg", type: "DWG", size: "31 МБ",  date: "20.05.2026 14:32", status: "Активен" },
    { name: "ЦМР_Съёмка_2024.tin",        type: "TIN", size: "8 МБ",   date: "19.05.2026 18:10", status: "Связан" },
    { name: "Трасса_ШД-38_v2.xml",        type: "XML", size: "2 МБ",   date: "18.05.2026 11:45", status: "Связан" },
    { name: "Коридор_дорога.dwg",         type: "DWG", size: "14 МБ",  date: "17.05.2026 09:20", status: "Связан" },
    { name: "Сети_ливневые.dwg",          type: "DWG", size: "5 МБ",   date: "16.05.2026 16:05", status: "Связан" },
  ]
  const versions = [
    { ver: "v2.3", date: "20.05.2026 14:32", author: "Иванов А.С.", comment: "Добавлен поперечный уклон" },
    { ver: "v2.2", date: "19.05.2026 10:14", author: "Петров К.В.", comment: "Обновлена поверхность ЦМР" },
    { ver: "v2.1", date: "18.05.2026 16:30", author: "Иванов А.С.", comment: "Исправлены пикеты трассы" },
    { ver: "v2.0", date: "17.05.2026 09:00", author: "Сидоров М.Л.", comment: "Базовая версия коридора" },
    { ver: "v1.0", date: "15.05.2026 12:00", author: "Иванов А.С.", comment: "Начало проекта" },
  ]
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <motion.div initial={{scale:0.93,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.93,opacity:0}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-lg shadow-2xl flex flex-col relative"
        style={{width:580,height:440}} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700 bg-[#252535]">
          <span className="text-white text-[13px] font-bold flex items-center gap-2">
            <Icon name="FolderKanban" size={14} className="text-[#0078d4]"/> Диспетчер проекта
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg leading-none">✕</button>
        </div>
        <div className="flex border-b border-gray-700">
          {(["files","versions","team"] as const).map((id) => {
            const label = id === "files" ? "Файлы" : id === "versions" ? "Версии" : "Команда"
            return (
              <button key={id} onClick={()=>setActiveTab(id)}
                className={`px-4 py-2 text-[11px] transition-colors border-b-2 ${activeTab===id?"border-[#0078d4] text-white bg-[#1e1e2e]":"border-transparent text-gray-400 hover:text-white bg-[#252535]"}`}>
                {label}
              </button>
            )
          })}
        </div>
        <div className="flex-1 overflow-auto p-3">
          {activeTab === "files" && (
            <table className="w-full text-[11px]">
              <thead><tr className="text-gray-400 border-b border-gray-700">
                {["Файл","Тип","Размер","Изменён","Статус"].map(h=><th key={h} className="text-left px-2 py-1.5 font-medium">{h}</th>)}
              </tr></thead>
              <tbody>{files.map((f,i)=>(
                <tr key={i} className="border-b border-gray-800 hover:bg-[#252535] cursor-pointer">
                  <td className="px-2 py-1.5 text-white">
                    <span className="flex items-center gap-1.5"><Icon name="FileText" size={11} className="text-blue-400"/>{f.name}</span>
                  </td>
                  <td className="px-2 py-1.5 text-gray-400">{f.type}</td>
                  <td className="px-2 py-1.5 text-gray-400">{f.size}</td>
                  <td className="px-2 py-1.5 text-gray-400 font-mono text-[10px]">{f.date}</td>
                  <td className="px-2 py-1.5"><span className={`px-1.5 py-0.5 rounded text-[10px] ${f.status==="Активен"?"bg-green-500/20 text-green-400":"bg-blue-500/20 text-blue-400"}`}>{f.status}</span></td>
                </tr>
              ))}</tbody>
            </table>
          )}
          {activeTab === "versions" && (
            <div className="space-y-1">
              {versions.map((v,i)=>(
                <div key={i} className={`flex items-start gap-3 p-2 rounded border transition-colors cursor-pointer hover:bg-[#252535] ${i===0?"border-[#0078d4]/40 bg-[#0078d4]/5":"border-gray-800"}`}>
                  <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${i===0?"bg-[#0078d4] text-white":"bg-gray-700 text-gray-300"}`}>{v.ver.replace("v","")}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-[11px] font-semibold">{v.ver}</span>
                      {i===0&&<span className="text-[9px] px-1.5 bg-green-500/20 text-green-400 rounded">Текущая</span>}
                      <span className="text-gray-500 text-[10px] ml-auto">{v.date}</span>
                    </div>
                    <div className="text-gray-400 text-[10px]">{v.author} — {v.comment}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeTab === "team" && (
            <div className="space-y-2 p-2">
              {[
                { name: "Иванов Алексей Сергеевич", role: "Главный проектировщик", online: true },
                { name: "Петров Константин Вадимович", role: "Геодезист", online: true },
                { name: "Сидоров Михаил Леонидович", role: "ГИП", online: false },
              ].map((m,i)=>(
                <div key={i} className="flex items-center gap-3 p-2 rounded border border-gray-700 hover:bg-[#252535]">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-[#0078d4] flex items-center justify-center text-white text-[12px] font-bold">{m.name[0]}</div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#1e1e2e] ${m.online?"bg-green-400":"bg-gray-500"}`}/>
                  </div>
                  <div>
                    <div className="text-white text-[11px] font-medium">{m.name}</div>
                    <div className="text-gray-400 text-[10px]">{m.role}</div>
                  </div>
                  <div className="ml-auto text-[10px] text-gray-500">{m.online?"онлайн":"офлайн"}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="px-3 py-2 border-t border-gray-700 flex justify-between items-center">
          <button onClick={()=>pmFlash("✓ Файл добавлен в проект")} className="text-[11px] text-white px-3 py-1 rounded hover:opacity-90" style={{background:"#0078d4"}}>Добавить файл</button>
          <button onClick={onClose} className="text-[11px] text-gray-400 hover:text-white px-3 py-1">Закрыть</button>
        </div>
        <AnimatePresence>
          {pmToast && (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-[#252535] border border-[#0078d4]/50 text-[#60a5fa] text-[10px] px-3 py-1.5 rounded-lg shadow-lg z-10 whitespace-nowrap">
              {pmToast}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

// ─── SurveyTraverseDialog ─────────────────────────────────────────────────────

function SurveyTraverseDialog({ onClose }: { onClose: () => void }) {
  const [stToast, setStToast] = useState<string|null>(null)
  const stFlash = (m:string)=>{ setStToast(m); setTimeout(()=>setStToast(null), 2000) }
  const rows = [
    { pt: "ПП-1", ang: "0°00'00\"",   dist: "—",      dx: "—",       dy: "—",       x: "5420.145", y: "3817.234" },
    { pt: "ПП-2", ang: "42°18'36\"",  dist: "125.340", dx: "+92.418", dy: "+84.126", x: "5512.563", y: "3901.360" },
    { pt: "ПП-3", ang: "118°45'12\"", dist: "98.720",  dx: "-47.213", dy: "+87.484", x: "5465.350", y: "3988.844" },
    { pt: "ПП-4", ang: "215°30'48\"", dist: "142.180", dx: "-82.456", dy: "-115.731",x: "5382.894", y: "3873.113" },
    { pt: "ПП-5", ang: "304°12'24\"", dist: "87.650",  dx: "+49.823", dy: "-72.018", x: "5432.717", y: "3801.095" },
    { pt: "ПП-1", ang: "0°00'00\"",   dist: "89.450",  dx: "-12.572", dy: "+16.139", x: "5420.145", y: "3817.234" },
  ]
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <motion.div initial={{scale:0.93,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.93,opacity:0}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-lg shadow-2xl flex flex-col relative"
        style={{width:640,maxHeight:"80vh"}} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700 bg-[#252535]">
          <span className="text-white text-[13px] font-bold flex items-center gap-2">
            <Icon name="GitBranch" size={14} className="text-green-400"/> Отчёт о невязке теодолитного хода
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg">✕</button>
        </div>
        <div className="p-3 border-b border-gray-700 grid grid-cols-3 gap-3">
          {[
            { label: "Угловая невязка", val: "f_β = +0°00'48\"", ok: true },
            { label: "Допустимая", val: "[f_β] = ±1°43'12\"", ok: true },
            { label: "Линейная невязка", val: "f = 0.052 м", ok: true },
            { label: "Периметр хода", val: "P = 543.340 м", ok: true },
            { label: "Относительная", val: "1 / 10 448", ok: true },
            { label: "Допустимая", val: "1 / 2 000", ok: true },
          ].map((item,i)=>(
            <div key={i} className={`p-2 rounded border ${item.ok?"border-green-700/40 bg-green-900/10":"border-red-700/40 bg-red-900/10"}`}>
              <div className="text-[9px] text-gray-400">{item.label}</div>
              <div className={`text-[12px] font-mono font-bold ${item.ok?"text-green-400":"text-red-400"}`}>{item.val}</div>
              {item.ok && <div className="text-[9px] text-green-600">✓ В норме</div>}
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-[10px] border-collapse">
            <thead className="sticky top-0 bg-[#252535]">
              <tr className="text-gray-400 border-b border-gray-700">
                {["Точка","Угол","Длина, м","ΔX, м","ΔY, м","X, м","Y, м"].map(h=>(
                  <th key={h} className="text-left px-2 py-1.5 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r,i)=>(
                <tr key={i} className={`border-b border-gray-800 hover:bg-[#252535] ${i===0||i===rows.length-1?"bg-blue-900/10 font-semibold":""}`}>
                  <td className="px-2 py-1 text-[#0078d4] font-mono">{r.pt}</td>
                  <td className="px-2 py-1 text-white font-mono">{r.ang}</td>
                  <td className="px-2 py-1 text-gray-300 font-mono">{r.dist}</td>
                  <td className={`px-2 py-1 font-mono ${r.dx.startsWith("+")?"text-yellow-400":r.dx.startsWith("-")?"text-cyan-400":"text-gray-400"}`}>{r.dx}</td>
                  <td className={`px-2 py-1 font-mono ${r.dy.startsWith("+")?"text-yellow-400":r.dy.startsWith("-")?"text-cyan-400":"text-gray-400"}`}>{r.dy}</td>
                  <td className="px-2 py-1 text-white font-mono">{r.x}</td>
                  <td className="px-2 py-1 text-white font-mono">{r.y}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-3 py-2 border-t border-gray-700 flex justify-between">
          <div className="flex gap-2">
            <button onClick={()=>stFlash("✓ Ведомость хода экспортирована в CSV")} className="text-[11px] text-white px-3 py-1 rounded hover:opacity-90" style={{background:"#0078d4"}}>Экспорт</button>
            <button onClick={()=>stFlash("✓ Ход уравнён (метод Болотова)")} className="text-[11px] text-gray-300 px-3 py-1 rounded border border-gray-600 hover:bg-[#2f2f42]">Уравнять</button>
          </div>
          <button onClick={onClose} className="text-[11px] text-gray-400 hover:text-white px-3 py-1">Закрыть</button>
        </div>
        <AnimatePresence>
          {stToast && (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-[#252535] border border-green-500/50 text-green-400 text-[10px] px-3 py-1.5 rounded-lg shadow-lg z-10 whitespace-nowrap">
              {stToast}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSPORTATION MODULE · HYDROLOGY MODULE · DAYLIGHT FL · DYNAMO CIVIL
// ═══════════════════════════════════════════════════════════════════════════

// ─── Transportation Module — Развязки и трафик ────────────────────────────────
function TransportationDialog({ onClose }: { onClose: ()=>void }) {
  const [tab, setTab] = useState<"junction"|"traffic"|"signals"|"safety">("junction")
  const [jType, setJType] = useState("Клеверный лист")
  const [aadt1, setAadt1] = useState("18000")
  const [aadt2, setAadt2] = useState("12000")
  const [growth, setGrowth] = useState("3.5")
  const [years, setYears] = useState("20")

  const aadt1V = parseFloat(aadt1)||18000
  const aadt2V = parseFloat(aadt2)||12000
  const growthV = parseFloat(growth)||3.5
  const yearsV = parseFloat(years)||20
  const future1 = Math.round(aadt1V * Math.pow(1+growthV/100, yearsV))
  const future2 = Math.round(aadt2V * Math.pow(1+growthV/100, yearsV))
  const peakHour = Math.round((future1+future2) * 0.1)
  const LOS = peakHour<1800?"A":peakHour<2200?"B":peakHour<2600?"C":peakHour<3000?"D":peakHour<3400?"E":"F"
  const losColor = LOS==="A"||LOS==="B"?"#4ade80":LOS==="C"?"#facc15":LOS==="D"?"#f97316":"#ef4444"

  const JunctionSVG = () => {
    const cx=90, cy=80
    return (
      <svg width="180" height="160" viewBox="0 0 180 160" style={{background:"#080e18",borderRadius:8,display:"block"}}>
        <rect width="180" height="160" fill="#1a2535"/>
        {jType==="Клеверный лист" && (
          <g>
            <rect x="0" y={cy-10} width="180" height="20" fill="#2a3045"/>
            <rect x={cx-10} y="0" width="20" height="160" fill="#2a3045"/>
            {[[1,1],[1,-1],[-1,1],[-1,-1]].map(([sx,sy],i)=>(
              <circle key={i} cx={cx+sx*30} cy={cy+sy*30} r="20" fill="none" stroke="#60a5fa" strokeWidth="2"/>
            ))}
          </g>
        )}
        {jType==="Ромбовидная" && (
          <g>
            <rect x="0" y={cy-10} width="180" height="20" fill="#2a3045"/>
            <rect x={cx-10} y="0" width="20" height="160" fill="#2a3045"/>
            <polygon points={`${cx-30},${cy-30} ${cx+30},${cy-30} ${cx+30},${cy+30} ${cx-30},${cy+30}`} fill="none" stroke="#f97316" strokeWidth="2"/>
            <line x1={cx-30} y1={cy-30} x2={cx-10} y2={cy-10} stroke="#f97316" strokeWidth="1.5"/>
            <line x1={cx+30} y1={cy-30} x2={cx+10} y2={cy-10} stroke="#f97316" strokeWidth="1.5"/>
          </g>
        )}
        {jType==="Кольцевая" && (
          <g>
            <rect x="0" y={cy-10} width="180" height="20" fill="#2a3045"/>
            <rect x={cx-10} y="0" width="20" height="160" fill="#2a3045"/>
            <circle cx={cx} cy={cy} r="35" fill="#2a3045" stroke="#60a5fa" strokeWidth="2"/>
            <circle cx={cx} cy={cy} r="15" fill="#374151"/>
          </g>
        )}
        {jType==="T-образная" && (
          <g>
            <rect x="0" y={cy-10} width="180" height="20" fill="#2a3045"/>
            <rect x={cx-10} y="0" width="20" height={cy+10} fill="#2a3045"/>
          </g>
        )}
        <text x="90" y="155" textAnchor="middle" fill="#9ca3af" fontSize="7">{jType}</text>
      </svg>
    )
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-xl shadow-2xl flex flex-col"
        style={{width:680,maxHeight:"90vh"}} onClick={e=>e.stopPropagation()}>
        <div className="bg-[#0d1a28] px-5 py-3 flex items-center justify-between border-b border-gray-700 rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon name="Car" size={15} className="text-[#f97316]" fallback="Navigation"/>
            <span className="text-white font-bold text-[13px]">Transportation — Развязки, трафик, светофоры</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="flex border-b border-gray-700 bg-[#0d1520] flex-shrink-0">
          {([["junction","Развязка"],["traffic","Трафик"],["signals","Светофоры"],["safety","Конфликты"]] as const).map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`px-4 py-1.5 text-[10px] border-r border-gray-800 transition-colors ${tab===id?"bg-[#1e2a3e] text-white border-b-2 border-b-[#f97316]":"text-gray-400 hover:bg-[#1e2a3e]"}`}>{lbl}</button>
          ))}
        </div>
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 overflow-auto p-4 text-[11px] min-h-0">
            {tab==="junction" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {id:"Клеверный лист",icon:"⊕",desc:"Полная развязка, 4 кольца"},
                    {id:"Ромбовидная",   icon:"◇",desc:"Городская развязка"},
                    {id:"Кольцевая",     icon:"⊙",desc:"Простая кольцевая"},
                    {id:"T-образная",    icon:"⊥",desc:"Примыкание"},
                  ].map(t=>(
                    <button key={t.id} onClick={()=>setJType(t.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${jType===t.id?"border-[#f97316] bg-[#f97316]/10":"border-gray-700 hover:border-gray-500"}`}
                      style={{background:jType===t.id?undefined:"#111827"}}>
                      <div className="text-[20px] mb-1">{t.icon}</div>
                      <div className={`font-bold text-[11px] ${jType===t.id?"text-[#f97316]":"text-white"}`}>{t.id}</div>
                      <div className="text-gray-500 text-[9px]">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {tab==="traffic" && (
              <div className="space-y-4">
                <div className="text-gray-400 text-[10px]">Прогноз транспортной нагрузки (СП 34.13330)</div>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ["AADT направление 1, авт/сут",aadt1,setAadt1],
                    ["AADT направление 2, авт/сут",aadt2,setAadt2],
                    ["Темп роста, %/год",growth,setGrowth],
                    ["Горизонт планирования, лет",years,setYears],
                  ] as [string,string,(v:string)=>void][]).map(([l,v,s])=>(
                    <label key={l} className="flex flex-col gap-1">
                      <span className="text-gray-500 text-[9px]">{l}</span>
                      <input value={v} onChange={e=>s(e.target.value)} className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded font-mono outline-none focus:border-[#f97316]"/>
                    </label>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {[
                    {label:"AADT₁ через "+years+" лет",val:future1.toLocaleString()+" авт/сут",color:"#60a5fa"},
                    {label:"AADT₂ через "+years+" лет",val:future2.toLocaleString()+" авт/сут",color:"#60a5fa"},
                    {label:"Пиковый час (10%)",val:peakHour.toLocaleString()+" авт/ч",color:"#f97316"},
                    {label:"Уровень обслуживания",val:"LOS "+LOS,color:losColor},
                  ].map(r=>(
                    <div key={r.label} className="rounded border border-gray-700 px-3 py-2" style={{background:"#111827"}}>
                      <div className="text-gray-500 text-[9px]">{r.label}</div>
                      <div className="font-mono font-bold text-[12px]" style={{color:r.color}}>{r.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab==="signals" && (
              <div className="space-y-3">
                <div className="text-gray-400 text-[10px]">Оптимизация светофорного цикла</div>
                <div className="rounded-lg border border-gray-700 p-3" style={{background:"#111827"}}>
                  {[
                    ["Цикл светофора","T = 90 с"],
                    ["Зелёная фаза (главная)","g₁ = 45 с (50%)"],
                    ["Зелёная фаза (второст.)","g₂ = 25 с (28%)"],
                    ["Жёлтая фаза","y = 3 с"],
                    ["Красно-жёлтая","ry = 1 с"],
                    ["Кол-во фаз","4"],
                    ["Тип управления","Адаптивный (АСУДД)"],
                  ].map(([k,v])=>(
                    <div key={k} className="flex justify-between border-b border-gray-800 py-1">
                      <span className="text-gray-500">{k}</span>
                      <span className="text-white font-mono">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab==="safety" && (
              <div className="space-y-3">
                <div className="text-gray-400 text-[10px]">Анализ конфликтных точек</div>
                <div className="space-y-2">
                  {[
                    {type:"Пересечение",cnt:8,risk:"Высокий",color:"#ef4444"},
                    {type:"Слияние",cnt:4,risk:"Средний",color:"#facc15"},
                    {type:"Отделение",cnt:4,risk:"Низкий",color:"#4ade80"},
                  ].map(c=>(
                    <div key={c.type} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-700" style={{background:"#111827"}}>
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{background:c.color}}/>
                      <div className="flex-1"><div className="text-white text-[11px] font-semibold">{c.type}</div></div>
                      <div className="text-gray-400 font-mono">{c.cnt} точек</div>
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{background:c.color+"20",color:c.color}}>{c.risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="w-52 flex-shrink-0 border-l border-gray-800 p-3" style={{background:"#0a0e14"}}>
            <div className="text-[9px] text-gray-500 uppercase mb-2 text-center">Схема развязки</div>
            <JunctionSVG/>
            <div className="text-[9px] text-center mt-2 space-y-0.5">
              <div className="text-white font-semibold">{jType}</div>
              <div className="font-mono" style={{color:losColor}}>LOS {LOS}</div>
              <div className="text-gray-500">{peakHour.toLocaleString()} авт/ч (пик)</div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-700 flex-shrink-0 bg-[#0d1520] rounded-b-xl">
          <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 rounded text-[11px]">Отмена</button>
          <button onClick={onClose} className="px-4 py-1.5 bg-[#f97316] text-white hover:bg-[#fb923c] rounded text-[11px] font-bold">✓ Создать развязку</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Hydrology Module — Гидрологический анализ ────────────────────────────────
function HydrologyModuleDialog({ onClose }: { onClose: ()=>void }) {
  const [tab, setTab] = useState<"basins"|"peakflow"|"flood"|"erosion">("basins")
  const [method, setMethod] = useState("SCS Curve Number")
  const [area, setArea] = useState("48.5")
  const [cn, setCn] = useState("78")
  const [P, setP] = useState("85")
  const [tc, setTc] = useState("28")
  const [returnPeriod, setReturnPeriod] = useState("25")

  // SCS CN метод
  const Av = parseFloat(area)||48.5
  const CNv = parseFloat(cn)||78
  const Pv = parseFloat(P)||85
  const tcV = parseFloat(tc)||28
  const S = 25400/CNv - 254
  const Ia = 0.2*S
  const Q = Pv > Ia ? Math.pow(Pv-Ia, 2) / (Pv-Ia+S) : 0
  const Qpeak = (Q/1000) * (Av*10000) / (tcV*60) * 1000  // л/с

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-xl shadow-2xl flex flex-col"
        style={{width:660,maxHeight:"90vh"}} onClick={e=>e.stopPropagation()}>
        <div className="bg-[#0a1a28] px-5 py-3 flex items-center justify-between border-b border-gray-700 rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon name="CloudRain" size={15} className="text-[#22d3ee]" fallback="Droplets"/>
            <span className="text-white font-bold text-[13px]">Hydrology — Водосборы, паводки, эрозия</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="flex border-b border-gray-700 bg-[#0d1520] flex-shrink-0">
          {([["basins","Водосборы"],["peakflow","Пиковый расход"],["flood","Зоны затопления"],["erosion","Эрозия"]] as const).map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`px-4 py-1.5 text-[10px] border-r border-gray-800 transition-colors ${tab===id?"bg-[#1e2a3e] text-white border-b-2 border-b-[#22d3ee]":"text-gray-400 hover:bg-[#1e2a3e]"}`}>{lbl}</button>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-4 text-[11px] min-h-0">
          {tab==="basins" && (
            <div className="space-y-3">
              <div className="text-gray-400 text-[10px]">Водосборные бассейны</div>
              {[
                {id:"ВБ-1",name:"Северный склон",area:"12.5 га",cn:78,L:"850 м",slope:"2.5%"},
                {id:"ВБ-2",name:"Восточный склон",area:"8.7 га",cn:82,L:"620 м",slope:"3.8%"},
                {id:"ВБ-3",name:"Южный склон",area:"15.2 га",cn:75,L:"940 м",slope:"1.9%"},
                {id:"ВБ-4",name:"Долина реки",area:"12.1 га",cn:65,L:"1240 м",slope:"0.8%"},
              ].map(b=>(
                <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-700 hover:bg-[#1e2a3e]" style={{background:"#111827"}}>
                  <div className="w-9 h-9 rounded-full bg-[#22d3ee]/20 border-2 border-[#22d3ee]/60 flex items-center justify-center text-[#22d3ee] font-bold text-[10px] flex-shrink-0">{b.id.split("-")[1]}</div>
                  <div className="flex-1">
                    <div className="text-white text-[11px] font-semibold">{b.id} · {b.name}</div>
                    <div className="text-gray-500 text-[9px]">Площадь {b.area} · CN={b.cn} · L={b.L} · уклон {b.slope}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab==="peakflow" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-gray-500 text-[9px]">Метод</span>
                  <select value={method} onChange={e=>setMethod(e.target.value)}
                    className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded text-[10px]">
                    {["SCS Curve Number","Rational (рациональная)","SCS Hydrograph","TR-55","Snyder Unit Hydrograph"].map(o=><option key={o}>{o}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-gray-500 text-[9px]">Период повторяемости, лет</span>
                  <select value={returnPeriod} onChange={e=>setReturnPeriod(e.target.value)}
                    className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded text-[10px]">
                    {["2","5","10","25","50","100","500"].map(o=><option key={o}>{o}</option>)}
                  </select>
                </label>
                {([["Площадь F, га",area,setArea],["CN (Curve Number)",cn,setCn],["Осадки P, мм (за tc)",P,setP],["Время конц. tc, мин",tc,setTc]] as [string,string,(v:string)=>void][]).map(([l,v,s])=>(
                  <label key={l} className="flex flex-col gap-1">
                    <span className="text-gray-500 text-[9px]">{l}</span>
                    <input value={v} onChange={e=>s(e.target.value)} className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded font-mono outline-none focus:border-[#22d3ee]"/>
                  </label>
                ))}
              </div>
              <div className="rounded-lg border border-gray-700 p-3" style={{background:"#111827"}}>
                <div className="text-[10px] font-bold text-white mb-2">SCS CN: S = 25400/CN−254 · Q = (P−Ia)²/(P−Ia+S)</div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {[
                    {label:"S (потенциал удерж.)",val:`${S.toFixed(1)} мм`,color:"#60a5fa"},
                    {label:"Ia (начальные потери)",val:`${Ia.toFixed(1)} мм`,color:"#a78bfa"},
                    {label:"Q (сток)",val:`${Q.toFixed(2)} мм`,color:"#4ade80"},
                    {label:"Qпик (пиковый расход)",val:`${Qpeak.toFixed(0)} л/с`,color:"#22d3ee"},
                  ].map(r=>(
                    <div key={r.label} className="rounded border border-gray-700 px-3 py-2" style={{background:"#0d1117"}}>
                      <div className="text-gray-500 text-[9px]">{r.label}</div>
                      <div className="font-mono font-bold" style={{color:r.color}}>{r.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {tab==="flood" && (
            <div className="space-y-3">
              <div className="text-gray-400 text-[10px]">Прогнозирование зон затопления</div>
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                {[
                  {p:"1%",h:"+4.20м",area:"32.4 га",color:"#ef4444"},
                  {p:"3%",h:"+3.15м",area:"24.8 га",color:"#f97316"},
                  {p:"5%",h:"+2.40м",area:"18.2 га",color:"#facc15"},
                  {p:"10%",h:"+1.65м",area:"12.1 га",color:"#4ade80"},
                  {p:"25%",h:"+0.90м",area:"6.8 га",color:"#22d3ee"},
                  {p:"50%",h:"+0.40м",area:"3.2 га",color:"#60a5fa"},
                ].map(f=>(
                  <div key={f.p} className="rounded border border-gray-700 px-2 py-2 text-center" style={{background:"#111827"}}>
                    <div className="text-gray-500 text-[9px]">P={f.p} ({100/parseFloat(f.p)} лет)</div>
                    <div className="font-mono font-bold text-[12px]" style={{color:f.color}}>{f.h}</div>
                    <div className="text-gray-400 text-[9px]">S={f.area}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-yellow-700/40 bg-yellow-900/10 p-2 text-[10px] text-yellow-300">
                ⚠ Расчёт по СП 33-101-2003 «Определение основных расчётных гидрологических характеристик»
              </div>
            </div>
          )}
          {tab==="erosion" && (
            <div className="space-y-3">
              <div className="text-gray-400 text-[10px]">Расчёт смыва почв (USLE) и оценка эрозии</div>
              <div className="rounded-lg border border-gray-700 p-3" style={{background:"#111827"}}>
                <div className="text-[10px] font-bold text-white mb-2">Формула USLE: A = R·K·LS·C·P</div>
                {[
                  ["R (фактор осадков)","85 МДж·мм/(га·ч·год)"],
                  ["K (эродируемость почвы)","0.42"],
                  ["LS (длина и крутизна)","1.84"],
                  ["C (растительный покров)","0.18"],
                  ["P (агротехнические меры)","1.0"],
                  ["A — смыв почвы","11.8 т/(га·год)"],
                  ["Категория эрозии","Сильная (>10 т/га)"],
                ].map(([k,v],i)=>(
                  <div key={k} className={`flex justify-between border-b border-gray-800 py-1 text-[10px] ${i===5||i===6?"font-bold":""}`}>
                    <span className="text-gray-500">{k}</span>
                    <span className={i===6?"text-red-400":i===5?"text-yellow-400":"text-white"}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-700 flex-shrink-0 bg-[#0d1520] rounded-b-xl">
          <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 rounded text-[11px]">Закрыть</button>
          <button onClick={onClose} className="px-4 py-1.5 bg-[#22d3ee] text-[#0d1520] hover:bg-[#67e8f9] rounded text-[11px] font-bold">Применить</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Daylight Feature Line (Tech Preview) ─────────────────────────────────────
function DaylightFLDialog2({ onClose }: { onClose: ()=>void }) {
  const [criteria, setCriteria] = useState("Откос 1:1.5 насыпь")
  const [from, setFrom] = useState("0+000")
  const [to, setTo] = useState("20+000")
  const [side, setSide] = useState("Обе стороны")
  const [layer, setLayer] = useState("DFL_Daylight")
  const [style, setStyle] = useState("Стандартный")
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-xl shadow-2xl flex flex-col"
        style={{width:560,maxHeight:"90vh"}} onClick={e=>e.stopPropagation()}>
        <div className="bg-[#1a1228] px-5 py-3 flex items-center justify-between border-b border-gray-700 rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon name="Spline" size={15} className="text-[#a78bfa]"/>
            <span className="text-white font-bold text-[13px]">Линия выхода на рельеф</span>
            <span className="text-[9px] px-2 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/40 rounded-full font-bold">Предпросмотр</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="flex-1 overflow-auto p-4 text-[11px] space-y-3 min-h-0">
          <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-2 text-[10px] text-orange-300">
            Предпросмотр · Автоматизация линий выхода на рельеф вместо хрупких объектов планировки
          </div>
          {([
            ["Критерий планировки",criteria,setCriteria,["Откос 1:1.5 насыпь","Откос 1:1 выемка","Откос 1:2 пологий","Кювет V-образный","Берма 2м","Пользовательский"]],
            ["От пикета",from,setFrom,null],
            ["До пикета",to,setTo,null],
            ["Сторона",side,setSide,["Слева","Справа","Обе стороны"]],
            ["Слой (Layer)",layer,setLayer,null],
            ["Стиль (Style)",style,setStyle,["Стандартный","Насыпь — красный","Выемка — синий","Невидимый"]],
          ] as [string,string,(v:string)=>void,string[]|null][]).map(([l,v,s,opts])=>(
            <div key={l} className="flex items-center gap-3">
              <span className="text-gray-500 w-44 text-[10px]">{l}:</span>
              {opts ?
                <select value={v} onChange={e=>s(e.target.value)} className="flex-1 bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded text-[10px]">
                  {opts.map(o=><option key={o}>{o}</option>)}
                </select> :
                <input value={v} onChange={e=>s(e.target.value)} className="flex-1 bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded font-mono text-[10px]"/>
              }
            </div>
          ))}
          <div className="rounded-lg border border-gray-700 p-3 text-[10px]" style={{background:"#111827"}}>
            <div className="text-white font-bold mb-2">Преимущества Daylight FL над Grading objects</div>
            {[
              "Динамическое обновление при изменении проектной поверхности",
              "Устойчивость к перемещению — нет «ломки» при правке трассы",
              "Возможность задания диапазонов станций и сторон",
              "Назначение собственных слоёв и стилей",
              "Замена устаревшего объекта группы планировки",
            ].map(t=>(
              <div key={t} className="flex items-start gap-2 py-0.5">
                <Icon name="Check" size={10} className="text-green-400 mt-0.5"/>
                <span className="text-gray-400">{t}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-700 flex-shrink-0 bg-[#15102a] rounded-b-xl">
          <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 rounded text-[11px]">Отмена</button>
          <button onClick={onClose} className="px-4 py-1.5 bg-[#a78bfa] text-white hover:bg-[#c4b5fd] rounded text-[11px] font-bold">✓ Создать Daylight FL</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// HORIZONTAL REGRESSION ANALYSIS · INFODRAINAGE · FORMA DATA MANAGEMENT
// TRANSPORTATION MODULE · HYDROLOGY MODULE · DWT TEMPLATES · DYNAMIC MODEL
// ═══════════════════════════════════════════════════════════════════════════

// ─── Horizontal Regression Analysis (HRA + ML) ────────────────────────────────
function HRADialog({ onClose }: { onClose: ()=>void }) {
  const [tab, setTab] = useState<"survey"|"analysis"|"preview"|"segments">("survey")
  const [mlMode, setMlMode] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)
  const [progress, setProgress] = useState(0)
  const [minR, setMinR] = useState("500")
  const [minTangent, setMinTangent] = useState("50")
  const [tolerance, setTolerance] = useState("0.15")
  const [stationFrom, setStationFrom] = useState("0+000")
  const [stationTo, setStationTo] = useState("20+000")

  const [ptCount, setPtCount] = useState(18)
  const [localToast, setLocalToast] = useState<string|null>(null)
  const flash = (m:string)=>{ setLocalToast(m); setTimeout(()=>setLocalToast(null), 2200) }
  const surveyPts = Array.from({length:ptCount},(_,i)=>({
    id:i+1,
    x:(i*110+Math.sin(i*0.4)*45+Math.cos(i*0.7)*30).toFixed(3),
    y:(i*65+Math.cos(i*0.5)*55+Math.sin(i*0.3)*20).toFixed(3),
    code:"P",
  }))

  const segments = [
    {type:"Прямая",    from:"ПК0+000", to:"ПК2+340", len:"2340", R:"—",    dev:"0.08м", ok:true},
    {type:"Клотоида",  from:"ПК2+340", to:"ПК2+630", len:"290",  R:"→800", dev:"0.12м", ok:true},
    {type:"Круговая",  from:"ПК2+630", to:"ПК4+820", len:"2190", R:"800",  dev:"0.19м", ok:false},
    {type:"Клотоида",  from:"ПК4+820", to:"ПК5+110", len:"290",  R:"800→",dev:"0.09м", ok:true},
    {type:"Прямая",    from:"ПК5+110", to:"ПК8+750", len:"3640", R:"—",    dev:"0.06м", ok:true},
    {type:"Клотоида",  from:"ПК8+750", to:"ПК9+020", len:"270",  R:"→1200",dev:"0.11м",ok:true},
    {type:"Круговая",  from:"ПК9+020", to:"ПК11+340",len:"2320", R:"1200", dev:"0.07м", ok:true},
  ]

  const startAnalysis = () => {
    setAnalyzing(true); setProgress(0); setAnalyzed(false)
    const iv = setInterval(()=>setProgress(p=>{
      if(p>=100){clearInterval(iv);setAnalyzing(false);setAnalyzed(true);return 100}
      return p+(mlMode?4:7)
    }), mlMode?200:120)
  }

  // SVG план трассы с кривыми
  const AlignmentPreviewSVG = () => {
    const W=340, H=180
    const pts = surveyPts.map((p,i)=>({
      x:parseFloat(p.x)/220*(W-40)+20,
      y:H-parseFloat(p.y)/200*(H-40)-20,
    }))
    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{background:"#080e18",borderRadius:8,display:"block"}}>
        <rect width={W} height={H} fill="#0d1a2e"/>
        {/* Сетка */}
        {Array.from({length:8},(_,i)=>[
          <line key={`v${i}`} x1={i*(W/7)+20} y1="10" x2={i*(W/7)+20} y2={H-10} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>,
          <line key={`h${i}`} x1="10" y1={i*(H/7)+10} x2={W-10} y2={i*(H/7)+10} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
        ])}
        {/* Точки съёмки */}
        {pts.map((p,i)=>(
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3" fill="#facc15" opacity="0.8"/>
            {i%4===0&&<text x={p.x+4} y={p.y-3} fill="#facc15" fontSize="5">P{i+1}</text>}
          </g>
        ))}
        {/* Линия по точкам */}
        <polyline points={pts.map(p=>`${p.x},${p.y}`).join(" ")} fill="none" stroke="#374151" strokeWidth="0.8" strokeDasharray="3 2"/>
        {/* Трасса (сглаженная) */}
        {analyzed && (
          <path d={`M ${pts[0].x},${pts[0].y} ` + pts.slice(1).map((p,i)=>{
            const prev=pts[i]; const mx=(prev.x+p.x)/2, my=(prev.y+p.y)/2
            return `Q ${prev.x},${prev.y} ${mx},${my}`
          }).join(" ")} fill="none" stroke="#f97316" strokeWidth="2"/>
        )}
        {/* ML-подсветка */}
        {analyzed&&mlMode&&<text x={W/2} y={H-5} textAnchor="middle" fill="#a78bfa" fontSize="6">ML-анализ: {segments.length} сегментов распознано</text>}
        {!analyzed&&<text x={W/2} y={H/2} textAnchor="middle" fill="#4b5563" fontSize="8">Нажмите «Анализировать» для построения трассы</text>}
        {/* Легенда */}
        <circle cx="15" cy="10" r="2.5" fill="#facc15"/><text x="21" y="13" fill="#facc15" fontSize="5.5">Точки съёмки</text>
        {analyzed&&<><line x1="75" y1="10" x2="85" y2="10" stroke="#f97316" strokeWidth="2"/><text x="88" y="13" fill="#f97316" fontSize="5.5">Трасса</text></>}
      </svg>
    )
  }

  // Кривизна
  const CurvaturePlotSVG = () => (
    <svg width="100%" viewBox="0 0 340 60" style={{background:"#080e18",borderRadius:6,display:"block"}}>
      <rect width="340" height="60" fill="#0d1117"/>
      <line x1="10" y1="30" x2="330" y2="30" stroke="#374151" strokeWidth="0.8"/>
      {analyzed&&segments.map((s,i)=>{
        const x = 10+i*(320/segments.length), w = 320/segments.length-2
        const h = s.R==="—"?0:s.type==="Клотоида"?8:15
        return <rect key={i} x={x} y={h?30-h:29.5} width={w} height={h||1}
          fill={s.type==="Круговая"?"#f97316":s.type==="Клотоида"?"#60a5fa":"#374151"} opacity="0.8" rx="1"/>
      })}
      <text x="10" y="8" fill="#4b5563" fontSize="5.5">График кривизны</text>
    </svg>
  )

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-xl shadow-2xl flex flex-col relative"
        style={{width:720,maxHeight:"93vh"}} onClick={e=>e.stopPropagation()}>
        <div className="bg-[#0d1a28] px-5 py-3 flex items-center justify-between border-b border-gray-700 rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon name="GitBranch" size={15} className="text-[#a78bfa]" fallback="Route"/>
            <span className="text-white font-bold text-[13px]">Horizontal Regression Analysis — Анализ трассы</span>
            {mlMode&&<span className="text-[9px] px-2 py-0.5 bg-[#a78bfa]/20 text-[#a78bfa] border border-[#a78bfa]/40 rounded-full font-bold">ML</span>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="flex border-b border-gray-700 bg-[#0d1520] flex-shrink-0 items-center">
          {([["survey","Точки съёмки"],["analysis","Параметры"],["preview","Alignment Preview"],["segments","Таблица сегментов"]] as const).map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`px-4 py-1.5 text-[10px] border-r border-gray-800 transition-colors ${tab===id?"bg-[#1e2a3e] text-white border-b-2 border-b-[#a78bfa]":"text-gray-400 hover:bg-[#1e2a3e]"}`}>{lbl}</button>
          ))}
          <div className="ml-auto px-3 flex items-center gap-2">
            <span className="text-[9px] text-gray-500">ML-режим:</span>
            <button onClick={()=>setMlMode(p=>!p)}
              className={`px-2 py-0.5 text-[9px] rounded font-bold transition-colors ${mlMode?"bg-[#a78bfa] text-white":"bg-[#252535] text-gray-500"}`}>
              {mlMode?"ВКЛ":"ВЫКЛ"}
            </button>
          </div>
        </div>
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 overflow-auto p-4 text-[11px] min-h-0">
            {tab==="survey" && (
              <div className="space-y-3">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">{surveyPts.length} точек съёмки</span>
                  <button onClick={()=>{ setPtCount(p=>p+12); setAnalyzed(false); flash("✓ Импортировано 12 точек из CSV/RW5") }}
                    className="px-2 py-0.5 bg-[#a78bfa]/20 text-[#a78bfa] border border-[#a78bfa]/40 rounded text-[9px] hover:bg-[#a78bfa]/30">Импорт CSV/RW5</button>
                </div>
                <div className="overflow-auto" style={{maxHeight:280}}>
                  <table className="w-full border-collapse text-[10px]">
                    <thead><tr className="bg-[#0d1117] sticky top-0">{["№","X","Y","Код"].map(h=><th key={h} className="px-2 py-1 text-gray-400 border border-gray-800 text-left font-normal">{h}</th>)}</tr></thead>
                    <tbody>{surveyPts.map((p,i)=>(
                      <tr key={i} className={i%2===0?"bg-[#111827]":"bg-[#0d1117]"}>
                        <td className="px-2 py-0.5 border border-gray-800 text-[#a78bfa] font-mono">{p.id}</td>
                        <td className="px-2 py-0.5 border border-gray-800 font-mono text-gray-300">{p.x}</td>
                        <td className="px-2 py-0.5 border border-gray-800 font-mono text-gray-300">{p.y}</td>
                        <td className="px-2 py-0.5 border border-gray-800 text-gray-500">{p.code}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            )}
            {tab==="analysis" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ["От пикета",stationFrom,setStationFrom],["До пикета",stationTo,setStationTo],
                    ["Мин. радиус, м",minR,setMinR],["Мин. прямая вставка, м",minTangent,setMinTangent],
                    ["Допуск отклонения, м",tolerance,setTolerance],
                  ] as [string,string,(v:string)=>void][]).map(([l,v,s])=>(
                    <label key={l} className="flex flex-col gap-1">
                      <span className="text-gray-500 text-[9px]">{l}</span>
                      <input value={v} onChange={e=>s(e.target.value)} className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded outline-none focus:border-[#a78bfa] font-mono text-[10px]"/>
                    </label>
                  ))}
                </div>
                {mlMode&&(
                  <div className="rounded-lg border border-[#a78bfa]/30 bg-[#a78bfa]/10 p-3 text-[10px]">
                    <div className="text-[#a78bfa] font-bold mb-1">🤖 ML-режим активен</div>
                    <div className="text-gray-400">Предобученная модель распознаёт геометрию сложных участков. Не использует данные клиентов. Повышает точность на ~40% при неоднородных данных.</div>
                  </div>
                )}
                {analyzing||analyzed ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-400">{analyzed?"Анализ завершён":"Обработка точек съёмки..."}</span>
                      <span className="text-[#a78bfa] font-mono">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-[#a78bfa] rounded-full transition-all" style={{width:`${progress}%`}}/>
                    </div>
                    {analyzed&&<div className="text-green-400 text-[10px]">✓ Найдено {segments.length} сегментов · {segments.filter(s=>!s.ok).length} нарушений норм</div>}
                  </div>
                ) : (
                  <button onClick={startAnalysis}
                    className="w-full py-2.5 bg-[#a78bfa] text-white font-bold rounded-lg text-[11px] hover:bg-[#c4b5fd] transition-colors">
                    ▶ Анализировать трассу{mlMode?" (ML)":""}
                  </button>
                )}
              </div>
            )}
            {tab==="preview" && (
              <div className="space-y-3">
                <div className="text-gray-400 text-[10px]">Alignment Preview — предпросмотр прямо в чертеже</div>
                <AlignmentPreviewSVG/>
                <CurvaturePlotSVG/>
                <div className="flex gap-3 text-[9px]">
                  <div className="flex items-center gap-1"><div className="w-3 h-1.5 rounded bg-[#f97316]"/><span className="text-gray-400">Круговая кривая</span></div>
                  <div className="flex items-center gap-1"><div className="w-3 h-1.5 rounded bg-[#60a5fa]"/><span className="text-gray-400">Клотоида</span></div>
                  <div className="flex items-center gap-1"><div className="w-3 h-1.5 rounded bg-[#374151]"/><span className="text-gray-400">Прямая</span></div>
                </div>
              </div>
            )}
            {tab==="segments" && (
              <div>
                <div className="text-gray-400 text-[10px] mb-2">Таблица элементов трассы</div>
                <table className="w-full border-collapse text-[10px]">
                  <thead><tr className="bg-[#0d1117]">{["Тип","От","До","L, м","R, м","Откл.","СП 34"].map(h=><th key={h} className="px-2 py-1 text-gray-400 border border-gray-800 text-left font-normal">{h}</th>)}</tr></thead>
                  <tbody>{segments.map((s,i)=>(
                    <tr key={i} className={`${!s.ok?"bg-red-900/10":""}hover:bg-[#1e2a3e]`}>
                      <td className="px-2 py-1 border border-gray-800 text-white font-semibold">{s.type}</td>
                      <td className="px-2 py-1 border border-gray-800 text-[#4fc3f7] font-mono">{s.from}</td>
                      <td className="px-2 py-1 border border-gray-800 text-[#4fc3f7] font-mono">{s.to}</td>
                      <td className="px-2 py-1 border border-gray-800 text-gray-300 font-mono">{s.len}</td>
                      <td className="px-2 py-1 border border-gray-800 text-[#f97316] font-mono">{s.R}</td>
                      <td className="px-2 py-1 border border-gray-800 text-gray-400 font-mono">{s.dev}</td>
                      <td className={`px-2 py-1 border border-gray-800 font-bold ${s.ok?"text-green-400":"text-red-400"}`}>{s.ok?"✓":"⚠ R<min"}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-700 flex-shrink-0 bg-[#0d1520] rounded-b-xl">
          <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 rounded text-[11px]">Отмена</button>
          <button onClick={()=>{
            if(!analyzed){ setTab("analysis"); flash("Сначала выполните анализ трассы"); return }
            flash(`✓ Трасса создана: ${segments.length} элементов${mlMode?" (ML)":""}`)
            setTimeout(onClose, 900)
          }} className="px-4 py-1.5 bg-[#a78bfa] text-white hover:bg-[#c4b5fd] rounded text-[11px] font-bold">✓ Создать трассу</button>
        </div>
        <AnimatePresence>
          {localToast && (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-[#0d1520] border border-[#a78bfa]/40 text-[#c4b5fd] text-[10px] px-3 py-1.5 rounded-lg shadow-lg z-10">
              {localToast}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

// ─── InfoDrainage — Гидрологический расчёт ────────────────────────────────────
function InfoDrainageDialog({ onClose }: { onClose: ()=>void }) {
  const [tab, setTab] = useState<"basin"|"time"|"channel"|"ugs"|"pond"|"pipes"|"result">("basin")
  const [method, setMethod] = useState("Rational (рациональная)")
  const [area, setArea] = useState("12.5")
  const [C, setC] = useState("0.75")
  const [i25, setI25] = useState("85")
  const [tcMethod, setTcMethod] = useState("Kirpich")
  const [L, setL] = useState("850")
  const [slope, setSlope] = useState("0.008")
  const [n, setN] = useState("0.04")
  const [chanW, setChanW] = useState("2.0")
  const [chanSlope, setChanSlope] = useState("0.005")
  const [pondVol, setPondVol] = useState("2500")
  const [porosity, setPorosity] = useState("0.35")
  const [localToast, setLocalToast] = useState<string|null>(null)
  const flash = (m:string)=>{ setLocalToast(m); setTimeout(()=>setLocalToast(null), 2200) }

  // Каналы — несколько уклонов (2027)
  const [chanSegs, setChanSegs] = useState([
    {from:"0+00",  to:"2+50",  slope:"0.0080", type:"Прямая"},
    {from:"2+50",  to:"4+20",  slope:"0.0050", type:"Кривая"},
    {from:"4+20",  to:"7+00",  slope:"0.0035", type:"Прямая"},
  ])
  const addChanSeg = () => setChanSegs(p=>[...p,{from:p[p.length-1]?.to||"0+00",to:"",slope:"0.0040",type:"Прямая"}])
  const updChanSeg = (i:number,k:string,v:string)=>setChanSegs(p=>p.map((s,idx)=>idx===i?{...s,[k]:v}:s))
  const delChanSeg = (i:number)=>setChanSegs(p=>p.filter((_,idx)=>idx!==i))
  const chanWarnings = chanSegs.filter(s=>parseFloat(s.slope)<=0||!s.to).length

  // Подземное хранилище UGS (2027)
  const [ugsDepth, setUgsDepth] = useState("3.0")
  const [ugsArea, setUgsArea] = useState("420")
  const [ugsPorosity, setUgsPorosity] = useState("0.95")
  const ugsVol = (parseFloat(ugsDepth)||0)*(parseFloat(ugsArea)||0)*(parseFloat(ugsPorosity)||0)

  // Форма труб (2027)
  const PIPE_SHAPES = [
    {id:"circ", label:"Круглая",      icon:"Circle"},
    {id:"rect", label:"Прямоуг.",     icon:"Square"},
    {id:"arch", label:"Арочная",      icon:"Umbrella"},
    {id:"ell",  label:"Эллипс",       icon:"Egg"},
    {id:"egg",  label:"Яйцевидная",   icon:"Egg"},
  ]
  const [pipeShape, setPipeShape] = useState("circ")
  const [pipeD, setPipeD] = useState("500")

  // Расчёт времени концентрации
  const Lv = parseFloat(L)||850
  const sv = parseFloat(slope)||0.008
  const tcKirpich = 0.0195*(Lv**0.77)*(sv**(-0.385))
  const tcFAA = (11.9*Lv**3/((parseFloat(L)||1)*1000))**0.385*60
  const tc = tcMethod==="Kirpich" ? tcKirpich : tcFAA

  // Рациональная формула
  const Av = parseFloat(area)||12.5
  const Cv = parseFloat(C)||0.75
  const iv = parseFloat(i25)||85
  const Q_rational = Cv*iv/1000/3600*(Av*10000)/3.6

  // Мэннинг для канала
  const chanWv = parseFloat(chanW)||2
  const chanSv = parseFloat(chanSlope)||0.005
  const nv = parseFloat(n)||0.04
  const A_chan = chanWv*chanWv*0.5  // трапеция
  const P_chan = chanWv+2*chanWv*Math.sqrt(1.25)
  const R_chan = A_chan/P_chan
  const V_chan = (1/nv)*Math.pow(R_chan,2/3)*Math.pow(chanSv,0.5)
  const Q_chan = A_chan*V_chan

  // Пруд
  const pondVv = parseFloat(pondVol)||2500
  const porosityV = parseFloat(porosity)||0.35
  const pondEff = pondVv*(1+porosityV)

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-xl shadow-2xl flex flex-col relative"
        style={{width:680,maxHeight:"92vh"}} onClick={e=>e.stopPropagation()}>
        <div className="bg-[#0a1a28] px-5 py-3 flex items-center justify-between border-b border-gray-700 rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon name="Droplets" size={15} className="text-[#22d3ee]" fallback="CloudRain"/>
            <span className="text-white font-bold text-[13px]">InfoDrainage — Ливневая канализация и гидрология</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[#22d3ee]/20 text-[#22d3ee] font-bold">2027</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="flex border-b border-gray-700 bg-[#0d1520] flex-shrink-0">
          {([["basin","Водосбор"],["time","Время конц."],["channel","Каналы"],["ugs","Подз. хранилище"],["pond","Пруд-накоп."],["pipes","Трубы"],["result","Итоги"]] as const).map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`px-3 py-1.5 text-[10px] border-r border-gray-800 transition-colors whitespace-nowrap ${tab===id?"bg-[#1e2a3e] text-white border-b-2 border-b-[#22d3ee]":"text-gray-400 hover:bg-[#1e2a3e]"}`}>{lbl}</button>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-4 text-[11px] min-h-0">
          {tab==="basin" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-gray-500 text-[9px]">Метод расчёта</span>
                  <select value={method} onChange={e=>setMethod(e.target.value)}
                    className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded text-[10px]">
                    {["Rational (рациональная)","SCS/CN (кривая числа стока)","Manning (гидрав.)","FAA (авиационный)"].map(o=><option key={o}>{o}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-gray-500 text-[9px]">Площадь водосбора F, га</span>
                  <input value={area} onChange={e=>setArea(e.target.value)} className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded font-mono outline-none focus:border-[#22d3ee]"/>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-gray-500 text-[9px]">Коэф. стока C</span>
                  <input value={C} onChange={e=>setC(e.target.value)} className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded font-mono outline-none focus:border-[#22d3ee]"/>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-gray-500 text-[9px]">Интенсивность i₂₅, мм/ч (25 лет)</span>
                  <input value={i25} onChange={e=>setI25(e.target.value)} className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded font-mono outline-none focus:border-[#22d3ee]"/>
                </label>
              </div>
              <div className="rounded-lg border border-gray-700 p-3 text-center" style={{background:"#111827"}}>
                <div className="text-[9px] text-gray-500 mb-1">Q = C·i·F / 3.6 (л/с)</div>
                <div className="text-[#22d3ee] font-mono font-bold text-[22px]">{Q_rational.toFixed(2)} л/с</div>
                <div className="text-gray-500 text-[9px]">= {(Q_rational/1000).toFixed(5)} м³/с</div>
              </div>
            </div>
          )}
          {tab==="time" && (
            <div className="space-y-4">
              <div className="flex gap-2 mb-2">
                {["Kirpich","FAA"].map(m=>(
                  <button key={m} onClick={()=>setTcMethod(m)}
                    className={`px-3 py-1 rounded text-[10px] font-bold transition-colors ${tcMethod===m?"bg-[#22d3ee] text-[#0d1520]":"bg-[#252535] text-gray-400"}`}>{m}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {([["Длина водосбора L, м",L,setL],["Уклон i",slope,setSlope]] as [string,string,(v:string)=>void][]).map(([l,v,s])=>(
                  <label key={l} className="flex flex-col gap-1">
                    <span className="text-gray-500 text-[9px]">{l}</span>
                    <input value={v} onChange={e=>s(e.target.value)} className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded font-mono outline-none focus:border-[#22d3ee]"/>
                  </label>
                ))}
              </div>
              <div className="rounded-lg border border-gray-700 p-3" style={{background:"#111827"}}>
                <div className="text-[9px] text-gray-500 mb-2">Формула {tcMethod==="Kirpich"?"Kirpich: tc=0.0195·L^0.77·S^-0.385":"FAA: tc=(11.9·L³/(H·1000))^0.385·60"}</div>
                <div className="grid grid-cols-2 gap-2">
                  <div><div className="text-gray-500 text-[9px]">Время концентрации Tc:</div>
                    <div className="text-[#22d3ee] font-mono font-bold text-[18px]">{tcMethod==="Kirpich"?tcKirpich.toFixed(1):tcFAA.toFixed(1)} мин</div></div>
                  <div><div className="text-gray-500 text-[9px]">В секундах:</div>
                    <div className="text-[#60a5fa] font-mono text-[14px]">{(tc*60).toFixed(0)} с</div></div>
                </div>
              </div>
            </div>
          )}
          {tab==="channel" && (
            <div className="space-y-4">
              <div className="text-gray-400 text-[10px]">Открытый канал с переменным уклоном (Маннинг)</div>
              <div className="grid grid-cols-3 gap-3">
                {([["Ширина по дну b, м",chanW,setChanW],["Уклон i",chanSlope,setChanSlope],["Шероховатость n",n,setN]] as [string,string,(v:string)=>void][]).map(([l,v,s])=>(
                  <label key={l} className="flex flex-col gap-1">
                    <span className="text-gray-500 text-[9px]">{l}</span>
                    <input type="number" value={v} onChange={e=>s(e.target.value)} className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded font-mono text-[10px] outline-none focus:border-[#22d3ee]"/>
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {[
                  {label:"Скорость V",val:`${V_chan.toFixed(3)} м/с`,ok:V_chan>=0.3&&V_chan<=3,color:V_chan>=0.3&&V_chan<=3?"#4ade80":"#ef4444"},
                  {label:"Расход Q",val:`${(Q_chan*1000).toFixed(1)} л/с`,ok:true,color:"#22d3ee"},
                  {label:"Гидрав. радиус R",val:`${R_chan.toFixed(3)} м`,ok:true,color:"#60a5fa"},
                  {label:"Площадь сечения A",val:`${A_chan.toFixed(2)} м²`,ok:true,color:"#f97316"},
                ].map(r=>(
                  <div key={r.label} className="rounded border border-gray-700 px-2 py-2" style={{background:"#111827"}}>
                    <div className="text-gray-500 text-[9px]">{r.label}</div>
                    <div className="font-mono font-bold text-[12px]" style={{color:r.color}}>{r.val}</div>
                  </div>
                ))}
              </div>

              {/* Несколько уклонов на один канал (Civil 3D 2027) */}
              <div className="pt-2 border-t border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300 text-[10px] font-semibold">Несколько уклонов на канал (2027)</span>
                  <button onClick={addChanSeg} className="px-2 py-0.5 bg-[#22d3ee]/15 text-[#22d3ee] border border-[#22d3ee]/40 rounded text-[9px] hover:bg-[#22d3ee]/25">+ Сегмент</button>
                </div>
                <table className="w-full border-collapse text-[9px]">
                  <thead><tr className="bg-[#0d1117]">{["ПК нач.","ПК кон.","Уклон","Тип","Проверка",""].map(h=><th key={h} className="px-1.5 py-1 text-gray-400 border border-gray-800 text-left font-normal">{h}</th>)}</tr></thead>
                  <tbody>{chanSegs.map((s,i)=>{
                    const prevTo = i>0?chanSegs[i-1].to:null
                    const gap = prevTo && s.from!==prevTo
                    const bad = parseFloat(s.slope)<=0 || !s.to
                    return (
                      <tr key={i} className="hover:bg-[#1e2a3e]">
                        <td className="border border-gray-800"><input value={s.from} onChange={e=>updChanSeg(i,"from",e.target.value)} className="w-full bg-transparent text-white px-1.5 py-1 font-mono outline-none focus:bg-[#252535]"/></td>
                        <td className="border border-gray-800"><input value={s.to} onChange={e=>updChanSeg(i,"to",e.target.value)} className="w-full bg-transparent text-white px-1.5 py-1 font-mono outline-none focus:bg-[#252535]"/></td>
                        <td className="border border-gray-800"><input value={s.slope} onChange={e=>updChanSeg(i,"slope",e.target.value)} className="w-full bg-transparent text-white px-1.5 py-1 font-mono outline-none focus:bg-[#252535]"/></td>
                        <td className="border border-gray-800">
                          <select value={s.type} onChange={e=>updChanSeg(i,"type",e.target.value)} className="w-full bg-transparent text-gray-300 px-1 py-1 outline-none">
                            {["Прямая","Кривая"].map(o=><option key={o} className="bg-[#252535]">{o}</option>)}
                          </select>
                        </td>
                        <td className="border border-gray-800 px-1.5 py-1">
                          {bad ? <span className="text-red-400">⚠ уклон/ПК</span> : gap ? <span className="text-yellow-400">⚠ разрыв</span> : <span className="text-green-400">✓ ОК</span>}
                        </td>
                        <td className="border border-gray-800 text-center"><button onClick={()=>delChanSeg(i)} className="text-gray-500 hover:text-red-400 px-1">✕</button></td>
                      </tr>
                    )
                  })}</tbody>
                </table>
                <div className="text-[9px] mt-1.5 flex items-center gap-2">
                  {chanWarnings>0
                    ? <span className="text-yellow-400">⚠ Предупреждений: {chanWarnings} (проверка направления уклона и наложения станций)</span>
                    : <span className="text-green-400">✓ Уклоны корректны, разрывов и наложений нет</span>}
                </div>
              </div>
            </div>
          )}
          {tab==="ugs" && (
            <div className="space-y-4">
              <div className="text-gray-400 text-[10px]">Подземное хранилище (Underground Storage, UGS) — управляется настройками по умолчанию</div>
              <div className="grid grid-cols-3 gap-3">
                {([["Глубина H, м",ugsDepth,setUgsDepth],["Площадь A, м²",ugsArea,setUgsArea],["Пористость заполнителя n",ugsPorosity,setUgsPorosity]] as [string,string,(v:string)=>void][]).map(([l,v,s])=>(
                  <label key={l} className="flex flex-col gap-1">
                    <span className="text-gray-500 text-[9px]">{l}</span>
                    <input type="number" value={v} onChange={e=>s(e.target.value)} className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded font-mono text-[10px] outline-none focus:border-[#22d3ee]"/>
                  </label>
                ))}
              </div>
              <div className="rounded-lg border border-gray-700 p-3" style={{background:"#111827"}}>
                {[
                  {label:"Полезный объём хранения",val:`${ugsVol.toFixed(0)} м³`,color:"#22d3ee"},
                  {label:"Отметка дна",val:"123.40 м",color:"#60a5fa"},
                  {label:"Площадь основания",val:`${(parseFloat(ugsArea)||0).toFixed(0)} м²`,color:"#f97316"},
                  {label:"Двунаправл. связь труб↔UGS",val:"Активна",color:"#4ade80"},
                ].map(r=>(
                  <div key={r.label} className="flex justify-between border-b border-gray-800 py-1 text-[10px]">
                    <span className="text-gray-500">{r.label}</span>
                    <span className="font-mono font-bold" style={{color:r.color}}>{r.val}</span>
                  </div>
                ))}
              </div>
              <div className="text-[9px] text-gray-600">Свойства (глубина, отметка дна, площадь, объём) доступны на панели «Свойства». Экспорт — CSV.</div>
            </div>
          )}
          {tab==="pond" && (
            <div className="space-y-4">
              <div className="text-gray-400 text-[10px]">Пруд-накопитель с учётом пористости грунта</div>
              <div className="grid grid-cols-2 gap-3">
                {([["Объём пруда V, м³",pondVol,setPondVol],["Пористость грунта n",porosity,setPorosity]] as [string,string,(v:string)=>void][]).map(([l,v,s])=>(
                  <label key={l} className="flex flex-col gap-1">
                    <span className="text-gray-500 text-[9px]">{l}</span>
                    <input type="number" value={v} onChange={e=>s(e.target.value)} className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded font-mono outline-none focus:border-[#22d3ee]"/>
                  </label>
                ))}
              </div>
              <div className="rounded-lg border border-gray-700 p-3" style={{background:"#111827"}}>
                {[
                  {label:"Объём пруда (открытый)",val:`${pondVv.toLocaleString()} м³`,color:"#22d3ee"},
                  {label:"Подземный объём (пористость)",val:`${(pondVv*porosityV).toFixed(0)} м³`,color:"#60a5fa"},
                  {label:"Суммарная ёмкость",val:`${pondEff.toFixed(0)} м³`,color:"#4ade80"},
                  {label:"Время опорожнения (≈)",val:`${(pondEff/Q_rational/3600).toFixed(1)} ч`,color:"#f97316"},
                ].map(r=>(
                  <div key={r.label} className="flex justify-between border-b border-gray-800 py-1 text-[10px]">
                    <span className="text-gray-500">{r.label}</span>
                    <span className="font-mono font-bold" style={{color:r.color}}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab==="pipes" && (
            <div className="space-y-4">
              <div className="text-gray-400 text-[10px]">Форма поперечного сечения трубы (2027) — для Analyze Drainage System</div>
              <div className="flex gap-2 flex-wrap">
                {PIPE_SHAPES.map(s=>(
                  <button key={s.id} onClick={()=>setPipeShape(s.id)}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-colors ${pipeShape===s.id?"bg-[#22d3ee]/15 border-[#22d3ee] text-[#22d3ee]":"bg-[#111827] border-gray-700 text-gray-400 hover:border-gray-500"}`}>
                    <Icon name={s.icon} size={18} fallback="Circle"/>
                    <span className="text-[9px]">{s.label}</span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-gray-500 text-[9px]">{pipeShape==="rect"?"Ширина, мм":"Диаметр/высота D, мм"}</span>
                  <input type="number" value={pipeD} onChange={e=>setPipeD(e.target.value)} className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded font-mono text-[10px] outline-none focus:border-[#22d3ee]"/>
                </label>
                <div className="rounded border border-gray-700 px-2 py-2 flex flex-col justify-center" style={{background:"#111827"}}>
                  <div className="text-gray-500 text-[9px]">Площадь сечения (≈)</div>
                  <div className="font-mono font-bold text-[12px] text-[#22d3ee]">
                    {(() => {
                      const d=(parseFloat(pipeD)||500)/1000
                      const a = pipeShape==="circ"?Math.PI*d*d/4
                        : pipeShape==="rect"?d*d
                        : pipeShape==="arch"?d*d*0.785
                        : pipeShape==="ell"?Math.PI*d*(d*0.66)/4
                        : Math.PI*d*d/4*0.9
                      return a.toFixed(3)
                    })()} м²
                  </div>
                </div>
              </div>
              <div className="text-[9px] text-gray-600">Маркировка труб теперь показывает подключённые объекты (пруды, UGS) на планах, профилях и разрезах.</div>
            </div>
          )}
          {tab==="result" && (
            <div className="space-y-3">
              <div className="text-gray-400 text-[10px] font-bold">Сводный отчёт (СП 32.13330.2018)</div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {[
                  {label:"Расчётный расход Q",val:`${Q_rational.toFixed(2)} л/с`,color:"#22d3ee"},
                  {label:"Время концентрации tc",val:`${tc.toFixed(1)} мин`,color:"#60a5fa"},
                  {label:"Скорость в канале V",val:`${V_chan.toFixed(3)} м/с`,color:V_chan>=0.3&&V_chan<=3?"#4ade80":"#ef4444"},
                  {label:"Ёмкость пруда",val:`${pondEff.toFixed(0)} м³`,color:"#4ade80"},
                  {label:"Метод tc",val:tcMethod,color:"#facc15"},
                  {label:"Обеспеченность",val:"P=4% (25 лет)",color:"#a78bfa"},
                ].map(r=>(
                  <div key={r.label} className="rounded border border-gray-700 px-2 py-2" style={{background:"#111827"}}>
                    <div className="text-gray-500 text-[9px]">{r.label}</div>
                    <div className="font-mono font-bold text-[11px]" style={{color:r.color}}>{r.val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center gap-2 px-5 py-3 border-t border-gray-700 flex-shrink-0 bg-[#0d1520] rounded-b-xl">
          <button onClick={()=>flash("✓ Результаты экспортированы в CSV")} className="px-3 py-1.5 text-[10px] text-[#22d3ee] hover:underline flex items-center gap-1">
            <Icon name="Download" size={11}/>Экспорт CSV
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 rounded text-[11px]">Закрыть</button>
            <button onClick={()=>{ flash("✓ Параметры дренажа применены к сети"); setTimeout(onClose, 800) }} className="px-4 py-1.5 bg-[#22d3ee] text-[#0d1520] hover:bg-[#67e8f9] rounded text-[11px] font-bold">Применить к сети</button>
          </div>
        </div>
        <AnimatePresence>
          {localToast && (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-[#0d1520] border border-[#22d3ee]/40 text-[#67e8f9] text-[10px] px-3 py-1.5 rounded-lg shadow-lg z-10">
              {localToast}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

// ─── Forma Data Management ────────────────────────────────────────────────────
function FormaDataDialog({ onClose }: { onClose: ()=>void }) {
  const [tab, setTab] = useState<"files"|"refs"|"catalogs"|"issues"|"insights"|"versions"|"publish">("files")
  const [filter, setFilter] = useState("")
  const [localToast, setLocalToast] = useState<string|null>(null)
  const flash = (m:string)=>{ setLocalToast(m); setTimeout(()=>setLocalToast(null), 2200) }

  const [files, setFiles] = useState([
    {name:"ШД-38_план.dwg",      type:"DWG",     size:"12.4 МБ",  date:"2025-07-01", status:"Актуален",  owner:"Иванов А.П."},
    {name:"ШД-38_профиль.dwg",   type:"DWG",     size:"8.7 МБ",   date:"2025-07-01", status:"Актуален",  owner:"Иванов А.П."},
    {name:"ШД-38_сети.dwg",      type:"DWG",     size:"5.2 МБ",   date:"2025-06-28", status:"Устарел",   owner:"Петрова Н.С."},
    {name:"поверхность_TIN.xml", type:"LandXML", size:"3.1 МБ",   date:"2025-06-30", status:"Актуален",  owner:"Сидоров В.Г."},
    {name:"геология.pdf",        type:"PDF",     size:"18.5 МБ",  date:"2025-06-25", status:"Актуален",  owner:"ООО ГеоЛаб"},
    {name:"3D_модель.ifc",       type:"IFC",     size:"45.3 МБ",  date:"2025-07-01", status:"Актуален",  owner:"Иванов А.П."},
  ])
  const [refs, setRefs] = useState([
    {xref:"_подложка_ОСМ.dwg",   path:"C:\\Проекты\\ШД-38\\",  status:"OK",       newpath:""},
    {xref:"_геология_разрез.dwg", path:"D:\\Архив\\2024\\",     status:"Не найден",newpath:"C:\\Проекты\\ШД-38\\Геология\\"},
    {xref:"_котлован.dwg",        path:"\\\\server\\projects\\", status:"OK",       newpath:""},
  ])
  const [issues, setIssues] = useState([
    {id:"ISS-001",title:"Пересечение водопровода с коридором ПК12+340",prior:"Высокий",status:"Открыт",date:"2025-06-28"},
    {id:"ISS-002",title:"Радиус R=650м меньше минимального (800м)",prior:"Средний",status:"На рассмотрении",date:"2025-07-01"},
    {id:"ISS-003",title:"Отсутствует профиль сети на участке ПК8-ПК10",prior:"Низкий",status:"Закрыт",date:"2025-06-20"},
  ])
  const [versions, setVersions] = useState([
    {ver:"v1.3",date:"2025-07-01",author:"Иванов А.П.",changes:"Обновлён профиль ПК8-ПК12, добавлена сеть ливневой канализации"},
    {ver:"v1.2",date:"2025-06-28",author:"Петрова Н.С.",changes:"Скорректированы виражи на кривой R=800м"},
    {ver:"v1.1",date:"2025-06-20",author:"Сидоров В.Г.",changes:"Добавлена геологическая подоснова, уточнены ИГЭ"},
    {ver:"v1.0",date:"2025-06-01",author:"Иванов А.П.",changes:"Первичный вариант трассы, TIN-поверхность"},
  ])
  const [catalogs, setCatalogs] = useState([
    {name:"Трубы безнапорные ГОСТ 6482",  kind:"Безнапорные", items:48, sync:true,  shared:true},
    {name:"Трубы напорные ISO 4427 (ПЭ)", kind:"Напорные",   items:36, sync:true,  shared:false},
    {name:"Колодцы КЛВ / КЛК",            kind:"Структуры",  items:22, sync:false, shared:true},
    {name:"Дождеприёмники ДБ",            kind:"Структуры",  items:14, sync:true,  shared:true},
  ])
  const insights = [
    {time:"Сегодня 14:32", author:"Иванов А.П.",  action:"Редактирование коридора «ШД-38»", ver:"v1.3", added:128, removed:14},
    {time:"Сегодня 11:05", author:"Петрова Н.С.",  action:"Правка виражей на кривой R=800м",  ver:"v1.2", added:36,  removed:8},
    {time:"Вчера 18:40",   author:"Сидоров В.Г.",  action:"Импорт LandXML топосъёмки",        ver:"v1.1", added:412, removed:0},
    {time:"01.06 09:15",   author:"Иванов А.П.",   action:"Создание проекта, TIN-поверхность",ver:"v1.0", added:980, removed:0},
  ]

  const [uploading, setUploading] = useState(false)
  const [newIssue, setNewIssue] = useState("")
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [pubSheets, setPubSheets] = useState<Record<string,boolean>>({"План ПК0-ПК12":true,"Профиль ПК0-ПК12":true,"Поперечники":true,"Сводный план сетей":false})

  const filteredFiles = files.filter(f=>!filter||f.name.toLowerCase().includes(filter.toLowerCase()))

  const doUpload = () => {
    setUploading(true)
    setTimeout(()=>{
      setFiles(p=>[{name:`новый_лист_${p.length+1}.dwg`,type:"DWG",size:"4.2 МБ",date:new Date().toISOString().slice(0,10),status:"Актуален",owner:"Вы"},...p])
      setUploading(false); flash("✓ Файл загружен в облако Forma")
    }, 900)
  }
  const fixRef = (i:number) => {
    setRefs(p=>p.map((r,idx)=>idx===i?{...r,path:r.newpath,newpath:"",status:"OK"}:r))
    flash("✓ Путь Xref обновлён автоматически")
  }
  const fixAllRefs = () => {
    setRefs(p=>p.map(r=>r.newpath?{...r,path:r.newpath,newpath:"",status:"OK"}:r))
    flash("✓ Все пути Xref исправлены")
  }
  const addIssue = () => {
    if(!newIssue.trim()) return
    setIssues(p=>[{id:`ISS-${String(p.length+1).padStart(3,"0")}`,title:newIssue.trim(),prior:"Средний",status:"Открыт",date:new Date().toISOString().slice(0,10)},...p])
    setNewIssue(""); flash("✓ Проблема создана")
  }
  const closeIssue = (id:string) => {
    setIssues(p=>p.map(it=>it.id===id?{...it,status:"Закрыт"}:it)); flash(`✓ ${id} закрыта`)
  }
  const restoreVer = (ver:string) => {
    setVersions(p=>[{ver:`v${(parseFloat(p[0].ver.slice(1))+0.1).toFixed(1)}`,date:new Date().toISOString().slice(0,10),author:"Вы",changes:`Восстановление из ${ver}`},...p])
    flash(`✓ Восстановлено из ${ver}`)
  }
  const toggleCatSync = (i:number) => {
    setCatalogs(p=>p.map((c,idx)=>idx===i?{...c,sync:!c.sync}:c)); flash("Автосинхронизация изменена")
  }
  const doPublish = () => {
    const n = Object.values(pubSheets).filter(Boolean).length
    if(!n){ flash("Выберите хотя бы один лист"); return }
    setPublishing(true)
    setTimeout(()=>{ setPublishing(false); setPublished(true); flash(`✓ Опубликовано в Forma: ${n} лист(ов) PDF`) }, 1400)
  }

  const unresolvedRefs = refs.filter(r=>r.status!=="OK").length

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-xl shadow-2xl flex flex-col relative"
        style={{width:720,maxHeight:"92vh"}} onClick={e=>e.stopPropagation()}>
        <div className="bg-[#0a1428] px-5 py-3 flex items-center justify-between border-b border-gray-700 rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon name="Cloud" size={15} className="text-[#60a5fa]" fallback="Database"/>
            <span className="text-white font-bold text-[13px]">Forma Data Management — Управление проектными данными</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[#60a5fa]/20 text-[#60a5fa] font-bold">2027</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="flex border-b border-gray-700 bg-[#0d1520] flex-shrink-0 overflow-x-auto">
          {([["files","Файлы"],["refs","Связанные ссылки"],["catalogs","Каталоги труб"],["issues","Проблемы"],["insights","История правок"],["versions","Версии"],["publish","Публикация в Forma"]] as const).map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`px-3 py-1.5 text-[10px] border-r border-gray-800 transition-colors whitespace-nowrap relative ${tab===id?"bg-[#1e2a3e] text-white border-b-2 border-b-[#60a5fa]":"text-gray-400 hover:bg-[#1e2a3e]"}`}>
              {lbl}
              {id==="refs" && unresolvedRefs>0 && <span className="absolute top-0.5 right-1 w-3.5 h-3.5 rounded-full bg-yellow-500 text-[#0d1020] text-[7px] flex items-center justify-center font-bold">{unresolvedRefs}</span>}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-4 text-[11px] min-h-0">
          {tab==="files" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Поиск файлов..."
                  className="flex-1 bg-[#252535] border border-gray-600 text-white text-[11px] px-2 py-1 rounded outline-none focus:border-[#60a5fa] placeholder-gray-600"/>
                <button onClick={doUpload} disabled={uploading}
                  className="px-3 py-1 bg-[#0078d4]/20 text-[#60a5fa] border border-[#0078d4]/40 rounded text-[10px] hover:bg-[#0078d4]/30 disabled:opacity-50 flex items-center gap-1">
                  {uploading ? <><Icon name="Loader2" size={11} className="animate-spin" fallback="RefreshCw"/>Загрузка…</> : <><Icon name="Upload" size={11}/>Загрузить</>}
                </button>
              </div>
              <table className="w-full border-collapse text-[10px]">
                <thead><tr className="bg-[#0d1117]">{["Файл","Тип","Размер","Дата","Статус","Автор"].map(h=><th key={h} className="px-2 py-1 text-gray-400 border border-gray-800 text-left font-normal">{h}</th>)}</tr></thead>
                <tbody>{filteredFiles.map((f,i)=>(
                  <tr key={i} className="hover:bg-[#1e2a3e]">
                    <td className="px-2 py-1 border border-gray-800 text-white">{f.name}</td>
                    <td className="px-2 py-1 border border-gray-800 text-[#60a5fa]">{f.type}</td>
                    <td className="px-2 py-1 border border-gray-800 text-gray-400 font-mono">{f.size}</td>
                    <td className="px-2 py-1 border border-gray-800 text-gray-500">{f.date}</td>
                    <td className="px-2 py-1 border border-gray-800">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${f.status==="Актуален"?"bg-green-900/30 text-green-400":"bg-yellow-900/30 text-yellow-400"}`}>{f.status}</span>
                    </td>
                    <td className="px-2 py-1 border border-gray-800 text-gray-500">{f.owner}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {tab==="refs" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <div className="text-gray-400 text-[10px]">Связанные ссылки — автообнаружение переименованных/перемещённых внешних ссылок (Xref)</div>
                {unresolvedRefs>0 && <button onClick={fixAllRefs} className="px-2 py-0.5 bg-yellow-600/20 text-yellow-300 border border-yellow-600/40 rounded text-[9px] hover:bg-yellow-600/30">Исправить все ({unresolvedRefs})</button>}
              </div>
              {refs.map((r,i)=>(
                <div key={i} className={`p-3 rounded-lg border ${r.status==="OK"?"border-green-700/40 bg-green-900/10":"border-yellow-700/40 bg-yellow-900/10"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name={r.status==="OK"?"Check":"TriangleAlert"} size={12} className={r.status==="OK"?"text-green-400":"text-yellow-400"} fallback="Circle"/>
                    <span className="text-white font-semibold text-[11px]">{r.xref}</span>
                    <span className={`ml-auto text-[9px] font-bold ${r.status==="OK"?"text-green-400":"text-yellow-400"}`}>{r.status}</span>
                  </div>
                  <div className="text-gray-500 text-[9px]">Путь: {r.path}</div>
                  {r.newpath&&(
                    <div className="mt-1 flex items-center gap-2 text-[9px]">
                      <span className="text-yellow-400">Предложенный путь:</span>
                      <span className="text-white font-mono">{r.newpath}</span>
                      <button onClick={()=>fixRef(i)} className="ml-auto text-[#60a5fa] hover:underline font-bold">Обновить</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {tab==="catalogs" && (
            <div className="space-y-2">
              <div className="text-gray-400 text-[10px] mb-2">Облачные каталоги труб и напорных труб — единый источник, автосинхронизация со всей командой</div>
              {catalogs.map((c,i)=>(
                <div key={i} className="p-3 rounded-lg border border-gray-700 flex items-center gap-3" style={{background:"#111827"}}>
                  <Icon name="Database" size={14} className="text-[#60a5fa] flex-shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-[11px] font-semibold">{c.name}</div>
                    <div className="text-gray-500 text-[9px]">{c.kind} · {c.items} элементов {c.shared && "· общий для предприятия"}</div>
                  </div>
                  <button onClick={()=>toggleCatSync(i)}
                    className={`text-[9px] px-2 py-1 rounded border flex items-center gap-1 ${c.sync?"bg-green-900/20 text-green-400 border-green-700/40":"bg-gray-800 text-gray-500 border-gray-700"}`}>
                    <Icon name={c.sync?"RefreshCw":"Pause"} size={9}/>{c.sync?"Авто-синхр.":"Вручную"}
                  </button>
                </div>
              ))}
              <div className="text-[9px] text-gray-600 pt-1">Изменения каталога мгновенно появляются в Part Lists у всех инженеров проекта.</div>
            </div>
          )}
          {tab==="issues" && (
            <div className="space-y-2">
              <div className="flex gap-2 mb-2">
                <input value={newIssue} onChange={e=>setNewIssue(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addIssue()}
                  placeholder="Описание новой проблемы…" className="flex-1 bg-[#252535] border border-gray-600 text-white text-[10px] px-2 py-1 rounded outline-none focus:border-[#60a5fa] placeholder-gray-600"/>
                <button onClick={addIssue} className="px-2 py-1 bg-[#0078d4]/20 text-[#60a5fa] border border-[#0078d4]/40 rounded text-[9px] hover:bg-[#0078d4]/30">+ Создать</button>
              </div>
              {issues.map((issue,i)=>(
                <div key={i} className="p-3 rounded-lg border border-gray-700 hover:bg-[#1e2a3e]" style={{background:"#111827"}}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#60a5fa] font-mono text-[9px]">{issue.id}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${issue.prior==="Высокий"?"bg-red-900/30 text-red-400":issue.prior==="Средний"?"bg-yellow-900/30 text-yellow-400":"bg-gray-800 text-gray-500"}`}>{issue.prior}</span>
                    <span className={`ml-auto text-[9px] ${issue.status==="Закрыт"?"text-green-400":issue.status==="Открыт"?"text-red-400":"text-yellow-400"}`}>{issue.status}</span>
                    {issue.status!=="Закрыт" && <button onClick={()=>closeIssue(issue.id)} className="text-[9px] text-gray-400 hover:text-green-400">✓</button>}
                  </div>
                  <div className="text-white text-[10px]">{issue.title}</div>
                  <div className="text-gray-600 text-[9px] mt-0.5">{issue.date}</div>
                </div>
              ))}
            </div>
          )}
          {tab==="insights" && (
            <div className="space-y-2">
              <div className="text-gray-400 text-[10px] mb-2">История правок — единый источник истории изменений (замена журнала DWG History)</div>
              {insights.map((a,i)=>(
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg border border-gray-700" style={{background:"#111827"}}>
                  <div className="w-8 h-8 rounded-full bg-[#0078d4]/20 flex items-center justify-center flex-shrink-0 text-[#60a5fa] text-[10px] font-bold">{a.author.slice(0,2)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-[10px]">{a.action}</div>
                    <div className="text-gray-500 text-[9px]">{a.author} · {a.time} · <span className="text-[#60a5fa]">{a.ver}</span></div>
                  </div>
                  <div className="text-[9px] text-right flex-shrink-0">
                    <span className="text-green-400">+{a.added}</span> <span className="text-red-400">−{a.removed}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab==="versions" && (
            <div className="space-y-2">
              <div className="text-gray-400 text-[10px] mb-2">История версий и изменений</div>
              {versions.map((v,i)=>(
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg border border-gray-700 hover:bg-[#1e2a3e]" style={{background:"#111827"}}>
                  <div className="w-10 text-center">
                    <div className="text-[#60a5fa] font-bold text-[10px]">{v.ver}</div>
                    <div className="text-gray-600 text-[8px]">{v.date.slice(5)}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-400 text-[9px]">{v.author}</div>
                    <div className="text-white text-[10px]">{v.changes}</div>
                  </div>
                  <button onClick={()=>restoreVer(v.ver)} className="text-[9px] text-[#60a5fa] hover:underline flex-shrink-0">Восстановить</button>
                </div>
              ))}
            </div>
          )}
          {tab==="publish" && (
            <div className="space-y-3">
              <div className="text-gray-400 text-[10px]">Публикация в Forma — мгновенная выгрузка 2D/3D-листов в формате PDF в облако проекта</div>
              <div className="space-y-1.5">
                {Object.keys(pubSheets).map(s=>(
                  <label key={s} className="flex items-center gap-2 p-2 rounded border border-gray-700 cursor-pointer hover:bg-[#1e2a3e]" style={{background:"#111827"}}>
                    <input type="checkbox" checked={pubSheets[s]} onChange={()=>setPubSheets(p=>({...p,[s]:!p[s]}))} className="accent-[#60a5fa]"/>
                    <Icon name="FileText" size={12} className="text-[#60a5fa]"/>
                    <span className="text-white text-[10px]">{s}</span>
                  </label>
                ))}
              </div>
              <button onClick={doPublish} disabled={publishing}
                className="w-full py-2 bg-[#60a5fa] text-[#0d1020] rounded text-[11px] font-bold hover:bg-[#93c5fd] disabled:opacity-50 flex items-center justify-center gap-2">
                {publishing ? <><Icon name="Loader2" size={13} className="animate-spin" fallback="RefreshCw"/>Публикация…</> : <><Icon name="CloudUpload" size={13} fallback="Upload"/>Опубликовать в Forma</>}
              </button>
              {published && (
                <div className="p-2.5 rounded-lg border border-green-700/40 bg-green-900/10 text-[10px] text-green-300 flex items-center gap-2">
                  <Icon name="CircleCheck" size={13} className="text-green-400" fallback="Check"/>
                  Листы опубликованы. Доступны в облаке проекта и для просмотра в браузере.
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-700 flex-shrink-0 bg-[#0d1520] rounded-b-xl">
          <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 rounded text-[11px]">Закрыть</button>
          <button onClick={()=>flash("✓ Проект синхронизирован с облаком Forma")} className="px-4 py-1.5 bg-[#60a5fa] text-[#0d1020] hover:bg-[#93c5fd] rounded text-[11px] font-bold">Синхронизировать</button>
        </div>
        <AnimatePresence>
          {localToast && (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-[#0d1520] border border-[#60a5fa]/40 text-[#93c5fd] text-[10px] px-3 py-1.5 rounded-lg shadow-lg z-10">
              {localToast}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

// ─── DWT Templates Manager ────────────────────────────────────────────────────
function DWTTemplatesDialog({ onClose, onApply }: { onClose: ()=>void; onApply: (name: string)=>void }) {
  const [tab, setTab] = useState<"standard"|"corporate"|"catalogs">("standard")
  const [selTemplate, setSelTemplate] = useState("")

  const stdTemplates = [
    {name:"Лапа (Метрика)",  desc:"Метры · ГОСТ · МСК-70",        icon:"FileCode",  color:"#0078d4",
     layers:["Дороги","Поверхности","Сети","Геодезия","Границы"],
     styles:["Точки ГОСТ-21.1101","TIN насыпь/выемка","Трасса с виражами","Профиль — сетка","Коридор — коды"]},
    {name:"Лапа (Геодезия)",   desc:"Геодезия · съёмка · кодирование",icon:"MapPin",  color:"#4ade80",
     layers:["Съёмка","Теодолитные ходы","Пикеты","Границы"],
     styles:["Точки съёмки ГОСТ","Линии хода","Горизонтали 0.5м","Высотные отметки"]},
    {name:"Лапа (Инж. сети)", desc:"Инженерные сети · трубопроводы",icon:"Network",color:"#60a5fa",
     layers:["Водопровод","Канализация","Ливнёвка","Кабели","Газ"],
     styles:["Труба по диаметру","Колодец Ø1000","Профиль сети","Маркировка глубин"]},
    {name:"Лапа (Коридоры)",desc:"Коридоры · поперечники · объёмы",icon:"Navigation",color:"#f97316",
     layers:["Коридор","Поперечники","Объёмы","Дорожная одежда"],
     styles:["Коридор насыпь/выемка","Поперечное сечение","Ведомость объёмов","Коды сечений"]},
  ]
  const catalogs = {
    pipes: [
      {name:"Ø100 ПНД ГОСТ 18599",mat:"ПНД",d:100,class_:"SDR 17"},
      {name:"Ø150 ЖБ ГОСТ 6482", mat:"ЖБ", d:150,class_:"БТ"},
      {name:"Ø200 ПВХ ГОСТ 32415",mat:"ПВХ",d:200,class_:"SN4"},
      {name:"Ø300 ЖБ ГОСТ 6482", mat:"ЖБ", d:300,class_:"Т"},
      {name:"Ø400 СТ ГОСТ 8731",  mat:"Сталь",d:400,class_:"10ХСНД"},
      {name:"Ø500 ЖБ ГОСТ 6482", mat:"ЖБ", d:500,class_:"В"},
    ],
    manholes: [
      {name:"КЦО 1000 ГОСТ 8020", type:"Круглый", d:1000,h:"2.5м"},
      {name:"КЦО 1500 ГОСТ 8020", type:"Круглый", d:1500,h:"3.0м"},
      {name:"КЦП 1500×2000",      type:"Прямоугольный",d:"-",h:"2.5м"},
      {name:"Дождеприёмник ДБ2",  type:"Дождеприёмник",d:"-",h:"0.5м"},
    ],
    signs: [
      {name:"1.1 Опасный поворот", code:"1.1", type:"Предупреждающий"},
      {name:"2.1 Главная дорога",  code:"2.1", type:"Приоритет"},
      {name:"3.24 Ограничение скорости",code:"3.24",type:"Запрещающий"},
      {name:"5.15.1 Направление",  code:"5.15.1",type:"Предписывающий"},
      {name:"6.22 Пикетный знак",  code:"6.22", type:"Информационный"},
    ]
  }

  const tpl = stdTemplates.find(t=>t.name===selTemplate)

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-xl shadow-2xl flex flex-col"
        style={{width:680,maxHeight:"92vh"}} onClick={e=>e.stopPropagation()}>
        <div className="bg-[#0a1428] px-5 py-3 flex items-center justify-between border-b border-gray-700 rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon name="FileStack" size={15} className="text-[#facc15]" fallback="Files"/>
            <span className="text-white font-bold text-[13px]">Шаблоны DWT + Каталоги (ГОСТ/СП)</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="flex border-b border-gray-700 bg-[#0d1520] flex-shrink-0">
          {([["standard","Шаблоны"],["corporate","Корпоративные"],["catalogs","Каталоги ГОСТ"]] as const).map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`px-4 py-1.5 text-[10px] border-r border-gray-800 transition-colors ${tab===id?"bg-[#1e2a3e] text-white border-b-2 border-b-[#facc15]":"text-gray-400 hover:bg-[#1e2a3e]"}`}>{lbl}</button>
          ))}
        </div>
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 overflow-auto p-4 text-[11px] min-h-0">
            {tab==="standard" && (
              <div className="space-y-2">
                {stdTemplates.map(t=>(
                  <button key={t.name} onClick={()=>setSelTemplate(t.name)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${selTemplate===t.name?"border-[#facc15] bg-[#facc15]/10":"border-gray-700 hover:border-gray-500"}`}
                    style={{background:selTemplate===t.name?undefined:"#111827"}}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:t.color+"20"}}>
                      <Icon name={t.icon} size={18} style={{color:t.color}} fallback="FileCode"/>
                    </div>
                    <div className="flex-1">
                      <div className={`font-bold text-[12px] ${selTemplate===t.name?"text-[#facc15]":"text-white"}`}>{t.name}</div>
                      <div className="text-gray-500 text-[10px]">{t.desc}</div>
                    </div>
                    {selTemplate===t.name&&<Icon name="Check" size={14} className="text-[#facc15]"/>}
                  </button>
                ))}
              </div>
            )}
            {tab==="corporate" && (
              <div className="space-y-3">
                <div className="rounded-xl border border-dashed border-gray-600 p-6 text-center" style={{background:"#0d1520"}}>
                  <Icon name="Building2" size={28} className="text-gray-600 mx-auto mb-2"/>
                  <div className="text-gray-400 text-[11px]">Добавьте корпоративный шаблон .dwt</div>
                  <button className="mt-3 px-4 py-1.5 bg-[#0078d4]/20 text-[#60a5fa] border border-[#0078d4]/40 rounded text-[10px]">Загрузить шаблон</button>
                </div>
                <div className="rounded-lg border border-gray-700 p-3 text-[10px]" style={{background:"#111827"}}>
                  <div className="font-bold text-white mb-2">Рекомендуемая структура корпоративного шаблона</div>
                  {["Слои по ГОСТ Р 21.1101-2020","Стили объектов с подписями","Штамп чертежа А1/А2","Каталог труб ГОСТ","Шрифт ГОСТ 2.304","Масштабы 1:500, 1:1000, 1:2000"].map(l=>(
                    <div key={l} className="flex items-center gap-2 py-1 border-b border-gray-800">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#facc15]"/>
                      <span className="text-gray-300">{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab==="catalogs" && (
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] text-gray-400 font-bold mb-2">Трубы (ГОСТ)</div>
                  <table className="w-full border-collapse text-[10px]">
                    <thead><tr className="bg-[#0d1117]">{["Наименование","Материал","Ø, мм","Класс/тип"].map(h=><th key={h} className="px-2 py-1 text-gray-400 border border-gray-800 text-left font-normal">{h}</th>)}</tr></thead>
                    <tbody>{catalogs.pipes.map((p,i)=>(
                      <tr key={i} className="hover:bg-[#1e2a3e]">
                        <td className="px-2 py-1 border border-gray-800 text-white">{p.name}</td>
                        <td className="px-2 py-1 border border-gray-800 text-[#60a5fa]">{p.mat}</td>
                        <td className="px-2 py-1 border border-gray-800 text-[#f97316] font-mono">{p.d}</td>
                        <td className="px-2 py-1 border border-gray-800 text-gray-400">{p.class_}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-bold mb-2">Колодцы (ГОСТ 8020)</div>
                  <table className="w-full border-collapse text-[10px]">
                    <thead><tr className="bg-[#0d1117]">{["Наименование","Тип","Ø, мм","Глубина"].map(h=><th key={h} className="px-2 py-1 text-gray-400 border border-gray-800 text-left font-normal">{h}</th>)}</tr></thead>
                    <tbody>{catalogs.manholes.map((m,i)=>(
                      <tr key={i} className="hover:bg-[#1e2a3e]">
                        <td className="px-2 py-1 border border-gray-800 text-white">{m.name}</td>
                        <td className="px-2 py-1 border border-gray-800 text-gray-400">{m.type}</td>
                        <td className="px-2 py-1 border border-gray-800 text-[#f97316] font-mono">{m.d}</td>
                        <td className="px-2 py-1 border border-gray-800 text-gray-400">{m.h}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-bold mb-2">Дорожные знаки (ПДД РФ)</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {catalogs.signs.map((s,i)=>(
                      <div key={i} className="flex items-center gap-2 p-2 rounded border border-gray-700 hover:bg-[#1e2a3e]" style={{background:"#111827"}}>
                        <div className="w-8 h-8 rounded flex items-center justify-center text-[10px] font-bold border-2 flex-shrink-0"
                          style={{borderColor:s.type==="Предупреждающий"?"#f97316":s.type==="Запрещающий"?"#ef4444":s.type==="Приоритет"?"#facc15":"#60a5fa",
                                  color:s.type==="Предупреждающий"?"#f97316":s.type==="Запрещающий"?"#ef4444":s.type==="Приоритет"?"#facc15":"#60a5fa"}}>
                          {s.code.split(".")[0]}
                        </div>
                        <div><div className="text-white text-[10px]">{s.name}</div>
                        <div className="text-gray-500 text-[9px]">{s.code} · {s.type}</div></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Детали шаблона */}
          {tpl&&tab==="standard"&&(
            <div className="w-52 flex-shrink-0 border-l border-gray-800 p-3" style={{background:"#0d1117"}}>
              <div className="text-[9px] text-gray-500 uppercase mb-2">Состав шаблона</div>
              <div className="space-y-3 text-[9px]">
                <div>
                  <div className="text-gray-400 font-bold mb-1">Слои:</div>
                  {tpl.layers.map(l=><div key={l} className="text-gray-500 py-0.5 border-b border-gray-800">· {l}</div>)}
                </div>
                <div>
                  <div className="text-gray-400 font-bold mb-1">Стили объектов:</div>
                  {tpl.styles.map(s=><div key={s} className="text-gray-500 py-0.5 border-b border-gray-800">· {s}</div>)}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-700 flex-shrink-0 bg-[#0d1520] rounded-b-xl">
          <div className="text-[10px] text-gray-500">{selTemplate?`Выбран: ${selTemplate}`:"Выберите шаблон"}</div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 rounded text-[11px]">Отмена</button>
            <button onClick={()=>{ if(selTemplate){onApply(selTemplate); onClose()} }}
              disabled={!selTemplate}
              className={`px-4 py-1.5 rounded text-[11px] font-bold transition-colors ${selTemplate?"bg-[#facc15] text-[#0d1020] hover:bg-[#fde047]":"bg-gray-700 text-gray-500 cursor-not-allowed"}`}>
              Применить шаблон
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// REALITY CAPTURE · GIS INTEGRATION · VOLUME DASHBOARD ·
// CONSTRUCTION PHASES · REVIT EXCHANGE · DYNAMO CIVIL
// ═══════════════════════════════════════════════════════════════════════════

// ─── Reality Capture + Point Cloud ────────────────────────────────────────────
function RealityCaptureDialog({ onClose }: { onClose: ()=>void }) {
  const [tab, setTab] = useState<"import"|"cloud"|"process"|"export">("import")
  const [source, setSource] = useState("Лидар LAS/LAZ")
  const [file, setFile] = useState("")
  const [filtering, setFiltering] = useState(true)
  const [thinning, setThinning] = useState("0.05")
  const [classification, setClassification] = useState(true)
  const [progress, setProgress] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [done, setDone] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const startProcess = () => {
    setProcessing(true); setProgress(0); setDone(false)
    const iv = setInterval(()=>{
      setProgress(p=>{
        if(p>=100){ clearInterval(iv); setProcessing(false); setDone(true); return 100 }
        return p + Math.random()*8+3
      })
    }, 180)
  }

  // Статистика облака
  const stats = {pts:"2 847 320", density:"14.2 пт/м²", area:"200 500 м²", classes:"Земля, Растит., Здания, Дороги, Шум"}

  // SVG визуализация облака точек
  const PointCloudSVG = () => {
    const pts = Array.from({length:200},(_,i)=>({
      x: (Math.sin(i*0.23)*85+Math.cos(i*0.47)*50+Math.random()*20),
      y: (Math.cos(i*0.19)*40+Math.sin(i*0.31)*25+Math.random()*12),
      z: Math.sin(i*0.13)*8+Math.cos(i*0.27)*5,
    }))
    const colors = ["#4ade80","#22d3ee","#f59e0b","#a78bfa","#f87171"]
    return (
      <svg width="100%" viewBox="-120 -60 240 120" style={{background:"#080e18",borderRadius:8,display:"block"}}>
        {pts.map((p,i)=>{
          const ci = Math.floor(((p.z+13)/26)*5)
          const sx = p.x*0.85 + p.y*0.3, sy = -p.z*2.5 + p.y*0.5
          const size = 0.8 + (p.z+13)/26*0.8
          return <circle key={i} cx={sx} cy={sy} r={size} fill={colors[Math.min(4,Math.max(0,ci))]} opacity="0.7"/>
        })}
        <text x="-115" y="-52" fill="#4b5563" fontSize="6">Облако точек LiDAR · {stats.pts} точек</text>
      </svg>
    )
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-xl shadow-2xl flex flex-col"
        style={{width:660,maxHeight:"90vh"}} onClick={e=>e.stopPropagation()}>
        <div className="bg-[#0d1a2e] px-5 py-3 flex items-center justify-between border-b border-gray-700 rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon name="ScanLine" size={15} className="text-[#22d3ee]" fallback="Scan"/>
            <span className="text-white font-bold text-[13px]">Облака точек и фотограмметрия</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="flex border-b border-gray-700 bg-[#0d1520] flex-shrink-0">
          {([["import","Импорт"],["cloud","Визуализация"],["process","Обработка"],["export","Экспорт"]] as const).map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`px-4 py-1.5 text-[10px] border-r border-gray-800 transition-colors ${tab===id?"bg-[#1e2a3e] text-white border-b-2 border-b-[#22d3ee]":"text-gray-400 hover:bg-[#1e2a3e]"}`}>{lbl}</button>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-4 text-[11px] min-h-0">
          {tab==="import" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-gray-500 text-[9px]">Источник данных</span>
                  <select value={source} onChange={e=>setSource(e.target.value)}
                    className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded outline-none focus:border-[#22d3ee] text-[10px]">
                    {["Лидар LAS/LAZ","Фотограмметрия (фото→облако)","Тахеометрическая съёмка","E57 (структурированное)","XYZ/ASCII","PLY (полигональная)"].map(o=><option key={o}>{o}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-gray-500 text-[9px]">Система координат (EPSG)</span>
                  <select className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded outline-none text-[10px]">
                    {["20870 — МСК-70","32637 — UTM 37N","4326 — WGS84","28408 — ГК зона 8"].map(o=><option key={o}>{o}</option>)}
                  </select>
                </label>
              </div>
              {/* Drag&Drop */}
              <div onClick={()=>fileRef.current?.click()}
                className="rounded-xl border-2 border-dashed border-gray-600 hover:border-[#22d3ee] p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors"
                style={{background:"#0d1520"}}>
                <Icon name="Upload" size={28} className="text-gray-500"/>
                {file ? <span className="text-white font-semibold">{file}</span>
                  : <span className="text-gray-500">Перетащите .las / .laz / .e57 / .xyz или нажмите</span>}
                <input ref={fileRef} type="file" accept=".las,.laz,.e57,.xyz,.ply,.csv" className="hidden"
                  onChange={e=>setFile(e.target.files?.[0]?.name||"")}/>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={filtering} onChange={e=>setFiltering(e.target.checked)} className="accent-[#22d3ee]"/>
                  <span className="text-gray-300 text-[10px]">Фильтрация шума</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={classification} onChange={e=>setClassification(e.target.checked)} className="accent-[#22d3ee]"/>
                  <span className="text-gray-300 text-[10px]">Авто-классификация</span>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-gray-500 text-[9px]">Прореживание, м</span>
                  <input type="number" value={thinning} onChange={e=>setThinning(e.target.value)} step="0.01"
                    className="bg-[#252535] border border-gray-600 text-white px-2 py-1 rounded font-mono text-[10px]"/>
                </label>
              </div>
            </div>
          )}
          {tab==="cloud" && (
            <div className="space-y-3">
              <PointCloudSVG/>
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                {[
                  {label:"Точек всего",val:stats.pts,color:"#22d3ee"},
                  {label:"Плотность",val:stats.density,color:"#4ade80"},
                  {label:"Площадь",val:stats.area,color:"#f97316"},
                  {label:"Классы",val:"5 шт.",color:"#a78bfa"},
                  {label:"Формат",val:"LAS 1.4",color:"#60a5fa"},
                  {label:"СК",val:"МСК-70",color:"#facc15"},
                ].map(s=>(
                  <div key={s.label} className="rounded border border-gray-700 px-2 py-1.5" style={{background:"#111827"}}>
                    <div className="text-gray-500 text-[9px]">{s.label}</div>
                    <div className="font-mono font-bold text-[11px]" style={{color:s.color}}>{s.val}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-gray-700 p-2" style={{background:"#111827"}}>
                <div className="text-[9px] text-gray-500 mb-1">Классификация точек (ASPRS LAS)</div>
                <div className="flex gap-2 flex-wrap">
                  {[{c:"#4ade80",l:"Земля"},{"c":"#22d3ee",l:"Вода"},{c:"#86efac",l:"Растительность"},{c:"#a78bfa",l:"Здания"},{c:"#94a3b8",l:"Шум"}].map(cl=>(
                    <div key={cl.l} className="flex items-center gap-1 text-[9px]">
                      <div className="w-3 h-3 rounded-full" style={{background:cl.c}}/><span className="text-gray-400">{cl.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {tab==="process" && (
            <div className="space-y-4">
              <div className="text-gray-400 text-[10px]">Построение поверхности TIN из облака точек</div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {label:"Макс. расстояние между точками",val:"2.0 м",desc:"Ограничение триангуляции"},
                  {label:"Фильтр класса",val:"Земля (класс 2)",desc:"Только наземные точки"},
                  {label:"Сглаживание",val:"Нет",desc:"Сохранить острые границы"},
                  {label:"Выходная поверхность",val:"Существующая TIN",desc:"Перезаписать или создать"},
                ].map(r=>(
                  <div key={r.label} className="rounded border border-gray-700 px-3 py-2" style={{background:"#111827"}}>
                    <div className="text-gray-500 text-[9px]">{r.label}</div>
                    <div className="text-white font-semibold text-[10px]">{r.val}</div>
                    <div className="text-gray-600 text-[9px]">{r.desc}</div>
                  </div>
                ))}
              </div>
              {processing || done ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-400">{done?"Готово!":"Обработка..."}</span>
                    <span className="text-[#22d3ee] font-mono">{Math.round(Math.min(100,progress))}%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[#22d3ee] rounded-full transition-all" style={{width:`${Math.min(100,progress)}%`}}/>
                  </div>
                  {done && <div className="text-green-400 text-[10px]">✓ TIN-поверхность построена · 284 419 треугольников · Экспортирована в проект</div>}
                </div>
              ) : (
                <button onClick={startProcess}
                  className="w-full py-2.5 bg-[#22d3ee] text-[#0d1520] font-bold rounded-lg text-[11px] hover:bg-[#67e8f9] transition-colors">
                  ▶ Построить TIN-поверхность из облака точек
                </button>
              )}
            </div>
          )}
          {tab==="export" && (
            <div className="space-y-3">
              <div className="text-gray-400 text-[10px]">Экспорт обработанного облака точек</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {fmt:"LAS 1.4",icon:"FileCode",desc:"Стандарт ASPRS, с классами",color:"#22d3ee"},
                  {fmt:"LAZ",icon:"Archive",desc:"Сжатый LAS (lossless)",color:"#60a5fa",fallback:"FileCode"},
                  {fmt:"E57",icon:"Database",desc:"Структурированные данные",color:"#a78bfa",fallback:"Layers"},
                  {fmt:"XYZ/CSV",icon:"Sheet",desc:"Текстовый формат X Y Z",color:"#4ade80"},
                  {fmt:"TIN (LandXML)",icon:"Code2",desc:"Поверхность для Лапа",color:"#f97316"},
                  {fmt:"OBJ Mesh",icon:"Box",desc:"3D-меш для визуализации",color:"#facc15"},
                ].map(f=>(
                  <button key={f.fmt} onClick={onClose}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-700 hover:border-[#22d3ee] hover:bg-[#1e2a3e] transition-all text-left">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:f.color+"20"}}>
                      <Icon name={f.icon} size={16} style={{color:f.color}} fallback="Download"/>
                    </div>
                    <div><div className="text-white font-bold text-[11px]">{f.fmt}</div>
                    <div className="text-gray-500 text-[9px]">{f.desc}</div></div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-700 flex-shrink-0 bg-[#0d1520] rounded-b-xl">
          <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 rounded text-[11px]">Закрыть</button>
          <button onClick={()=>{ setTab("process") }}
            className="px-4 py-1.5 bg-[#22d3ee] text-[#0d1520] hover:bg-[#67e8f9] rounded text-[11px] font-bold">Построить TIN →</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── GIS Integration (WMS/WMTS подложки, Esri, OpenStreetMap) ─────────────────
function GISIntegrationDialog({ onClose }: { onClose: ()=>void }) {
  const [tab, setTab] = useState<"basemap"|"wms"|"export"|"epsg">("basemap")
  const [activeMap, setActiveMap] = useState("OpenStreetMap")
  const [wmsUrl, setWmsUrl] = useState("https://ows.terrestris.de/osm/service")
  const [wmsLayer, setWmsLayer] = useState("OSM-WMS")
  const [opacity, setOpacity] = useState(70)
  const [epsgFrom, setEpsgFrom] = useState("4326")
  const [epsgTo, setEpsgTo] = useState("20870")
  const [coordX, setCoordX] = useState("55.7558")
  const [coordY, setCoordY] = useState("37.6173")

  const basemaps = [
    {name:"OpenStreetMap",     provider:"OSM",   color:"#4ade80", desc:"Бесплатная карта мира"},
    {name:"Яндекс.Карты",     provider:"Yandex",color:"#f97316", desc:"Спутник + гибрид + карта"},
    {name:"Esri Satellite",   provider:"Esri",  color:"#60a5fa", desc:"Спутниковая подложка"},
    {name:"Google Maps",      provider:"Google",color:"#ef4444", desc:"Google Maps API"},
    {name:"Bing Aerial",      provider:"Bing",  color:"#0078d4", desc:"Microsoft спутник"},
    {name:"Rosreestr",        provider:"ГКН",   color:"#facc15", desc:"Кадастровая карта РФ"},
    {name:"2GIS",             provider:"2GIS",  color:"#10b981", desc:"Детальные карты городов"},
    {name:"Отключить",        provider:"—",     color:"#6b7280", desc:"Без подложки"},
  ]

  // Конвертер координат (упрощённый)
  const converted = {
    x: (parseFloat(coordX)*111319.9).toFixed(3),
    y: (parseFloat(coordY)*111319.9*Math.cos(parseFloat(coordX)*Math.PI/180)).toFixed(3)
  }

  // Превью карты (схематично)
  const MapPreview = () => (
    <svg width="100%" viewBox="0 0 300 160" style={{background:"#1a2535",borderRadius:8,display:"block"}}>
      {/* Фон карты */}
      <rect width="300" height="160" fill={activeMap==="Esri Satellite"||activeMap==="Google Maps"||activeMap==="Bing Aerial"?"#1a3a1a":"#1e2d3e"}/>
      {/* Дороги */}
      <path d="M 0,80 C 60,78 120,82 180,76 C 220,72 260,78 300,80" fill="none" stroke={activeMap==="Отключить"?"#374151":"#4b5563"} strokeWidth="3"/>
      <path d="M 150,0 C 148,40 152,80 150,160" fill="none" stroke={activeMap==="Отключить"?"#374151":"#374151"} strokeWidth="2"/>
      {/* Здания */}
      {[[40,30,20,14],[80,50,15,20],[200,60,25,18],[240,30,18,15],[180,100,30,22]].map(([x,y,w,h],i)=>(
        <rect key={i} x={x} y={y} width={w} height={h} fill={activeMap.includes("Satellite")?"#2d3748":"#334155"} stroke="#4b5563" strokeWidth="0.5"/>
      ))}
      {/* Водоём */}
      <ellipse cx="80" cy="120" rx="35" ry="20" fill="#1e3a5f" stroke="#2563eb" strokeWidth="0.5"/>
      <text x="80" y="124" textAnchor="middle" fill="#3b82f6" fontSize="6">Пруд</text>
      {/* Проект */}
      <path d="M 60,80 C 100,76 160,78 240,80" fill="none" stroke="#f97316" strokeWidth="2"/>
      <text x="150" y="73" textAnchor="middle" fill="#f97316" fontSize="6">Трасса ШД-38</text>
      {/* Подпись */}
      <text x="5" y="155" fill={activeMap==="Отключить"?"#4b5563":"#9ca3af"} fontSize="6">
        {activeMap==="Отключить"?"Подложка отключена":activeMap + " · opacity=" + opacity + "%"}
      </text>
      {/* Кадастр */}
      {activeMap==="Rosreestr"&&(
        <g>
          {[[20,40,60,50],[100,40,60,50],[20,100,60,50],[100,100,60,50],[160,100,60,50]].map(([x,y,w,h],i)=>(
            <rect key={i} x={x} y={y} width={w} height={h} fill="none" stroke="#facc15" strokeWidth="1" strokeDasharray="3 2" opacity="0.5"/>
          ))}
          <text x="50" y="68" textAnchor="middle" fill="#facc15" fontSize="5">У-001</text>
        </g>
      )}
    </svg>
  )

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-xl shadow-2xl flex flex-col"
        style={{width:680,maxHeight:"90vh"}} onClick={e=>e.stopPropagation()}>
        <div className="bg-[#0a1a1a] px-5 py-3 flex items-center justify-between border-b border-gray-700 rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon name="Globe" size={15} className="text-[#4ade80]"/>
            <span className="text-white font-bold text-[13px]">ГИС-интеграция — Карты, WMS и системы координат</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="flex border-b border-gray-700 bg-[#0d1a10] flex-shrink-0">
          {([["basemap","Подложки"],["wms","WMS/WMTS"],["epsg","Конвертер СК"],["export","Экспорт ГИС"]] as const).map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`px-4 py-1.5 text-[10px] border-r border-gray-800 transition-colors ${tab===id?"bg-[#1a2e1a] text-white border-b-2 border-b-[#4ade80]":"text-gray-400 hover:bg-[#1a2e1a]"}`}>{lbl}</button>
          ))}
        </div>
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 overflow-auto p-4 text-[11px] min-h-0">
            {tab==="basemap" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {basemaps.map(b=>(
                    <button key={b.name} onClick={()=>setActiveMap(b.name)}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left ${activeMap===b.name?"border-[#4ade80] bg-[#1a2e1a]":"border-gray-700 hover:border-gray-500"}`}
                      style={{background:activeMap===b.name?undefined:"#111827"}}>
                      <div className="w-6 h-6 rounded-full flex-shrink-0" style={{background:b.color+"30",border:`2px solid ${b.color}`}}/>
                      <div>
                        <div className={`font-semibold text-[10px] ${activeMap===b.name?"text-[#4ade80]":"text-white"}`}>{b.name}</div>
                        <div className="text-gray-600 text-[9px]">{b.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <div>
                  <div className="text-gray-500 text-[9px] mb-1">Прозрачность подложки: <span className="text-white font-mono">{opacity}%</span></div>
                  <input type="range" min="10" max="100" value={opacity} onChange={e=>setOpacity(+e.target.value)} className="w-full accent-green-500"/>
                </div>
              </div>
            )}
            {tab==="wms" && (
              <div className="space-y-4">
                <div className="text-gray-400 text-[10px]">Подключение внешних WMS/WMTS-сервисов</div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1 col-span-2">
                    <span className="text-gray-500 text-[9px]">URL сервиса WMS/WMTS</span>
                    <input value={wmsUrl} onChange={e=>setWmsUrl(e.target.value)}
                      className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded outline-none focus:border-[#4ade80] font-mono text-[10px]"/>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-gray-500 text-[9px]">Слой (Layer)</span>
                    <input value={wmsLayer} onChange={e=>setWmsLayer(e.target.value)}
                      className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded outline-none focus:border-[#4ade80]"/>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-gray-500 text-[9px]">Версия WMS</span>
                    <select className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded outline-none text-[10px]">
                      <option>1.3.0</option><option>1.1.1</option><option>1.0.0</option>
                    </select>
                  </label>
                </div>
                <div className="rounded-lg border border-gray-700 p-3 text-[10px]" style={{background:"#0d1520"}}>
                  <div className="font-bold text-white mb-2">Готовые WMS-сервисы РФ</div>
                  {[
                    {name:"Росреестр (ПКК)",url:"https://pkk.rosreestr.ru/arcgis/services/PKK6/CadastreObjects/MapServer/WMSServer"},
                    {name:"Геологическая карта",url:"https://geoinfo.vsegei.ru/geoserver/wms"},
                    {name:"OpenTopoMap",url:"https://tile.opentopomap.org/{z}/{x}/{y}.png"},
                  ].map(s=>(
                    <button key={s.name} onClick={()=>setWmsUrl(s.url)}
                      className="w-full flex items-center gap-2 py-1.5 border-b border-gray-800 hover:text-[#4ade80] transition-colors text-left">
                      <Icon name="Globe" size={10} className="text-gray-600"/>
                      <div className="flex-1"><div className="text-white">{s.name}</div>
                      <div className="text-gray-600 text-[9px] truncate">{s.url}</div></div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {tab==="epsg" && (
              <div className="space-y-4">
                <div className="text-gray-400 text-[10px]">Перевод координат между системами</div>
                <div className="grid grid-cols-2 gap-3">
                  {([["Исходная СК (EPSG)",epsgFrom,setEpsgFrom],["Целевая СК (EPSG)",epsgTo,setEpsgTo]] as [string,string,(v:string)=>void][]).map(([l,v,s])=>(
                    <label key={l} className="flex flex-col gap-1">
                      <span className="text-gray-500 text-[9px]">{l}</span>
                      <select value={v} onChange={e=>s(e.target.value)} className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded outline-none text-[10px]">
                        {["4326 — WGS84 (GPS)","20870 — МСК-70","32637 — UTM 37N","32638 — UTM 38N","28408 — ГК зона 8","28409 — ГК зона 9","3857 — Web Mercator"].map(o=><option key={o}>{o}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {([["Долгота / X",coordX,setCoordX],["Широта / Y",coordY,setCoordY]] as [string,string,(v:string)=>void][]).map(([l,v,s])=>(
                    <label key={l} className="flex flex-col gap-1">
                      <span className="text-gray-500 text-[9px]">{l}</span>
                      <input value={v} onChange={e=>s(e.target.value)} className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded font-mono text-[10px]"/>
                    </label>
                  ))}
                </div>
                <div className="rounded-lg border border-gray-700 p-3" style={{background:"#111827"}}>
                  <div className="text-[9px] text-gray-500 mb-2">Результат конвертации (приближённый)</div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div><div className="text-gray-500">X (E):</div><div className="text-[#4ade80] font-mono font-bold">{converted.x} м</div></div>
                    <div><div className="text-gray-500">Y (N):</div><div className="text-[#4ade80] font-mono font-bold">{converted.y} м</div></div>
                  </div>
                </div>
              </div>
            )}
            {tab==="export" && (
              <div className="space-y-3">
                <div className="text-gray-400 text-[10px]">Экспорт в ГИС-форматы</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {fmt:"GeoJSON",icon:"Code2",desc:"RFC 7946, для веб-ГИС",color:"#4ade80"},
                    {fmt:"Shapefile",icon:"Map",desc:"ESRI .shp + .dbf + .prj",color:"#0078d4"},
                    {fmt:"GeoPackage",icon:"Database",desc:"OGC GeoPackage .gpkg",color:"#7c3aed"},
                    {fmt:"KML/KMZ",icon:"Globe",desc:"Google Earth/Maps",color:"#f97316"},
                    {fmt:"GeoTIFF",icon:"Image",desc:"Растровый экспорт",color:"#ef4444"},
                    {fmt:"DWG + geo",icon:"PencilRuler",desc:"AutoCAD с геопривязкой",color:"#0891b2"},
                  ].map(f=>(
                    <button key={f.fmt} onClick={onClose}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-700 hover:border-[#4ade80] hover:bg-[#1a2e1a] transition-all text-left">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:f.color+"20"}}>
                        <Icon name={f.icon} size={16} style={{color:f.color}} fallback="Download"/>
                      </div>
                      <div><div className="text-white font-bold text-[11px]">{f.fmt}</div>
                      <div className="text-gray-500 text-[9px]">{f.desc}</div></div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Превью карты */}
          <div className="w-52 flex-shrink-0 border-l border-gray-800 p-3 flex flex-col gap-2" style={{background:"#0a100a"}}>
            <div className="text-[9px] text-gray-500 uppercase tracking-wide text-center">Предпросмотр</div>
            <MapPreview/>
            <div className="text-[9px] text-center space-y-0.5">
              <div className="text-white font-semibold">{activeMap}</div>
              <div className="text-gray-500">Прозрачность: {opacity}%</div>
              <div className="text-[#4ade80] font-mono text-[8px]">EPSG:{epsgTo.split(" ")[0]}</div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-700 flex-shrink-0 bg-[#0d1a10] rounded-b-xl">
          <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 rounded text-[11px]">Отмена</button>
          <button onClick={onClose} className="px-4 py-1.5 bg-[#4ade80] text-[#0a100a] hover:bg-[#86efac] rounded text-[11px] font-bold">Применить подложку</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Volume Dashboard ──────────────────────────────────────────────────────────
function VolumeDashboardDialog({ onClose }: { onClose: ()=>void }) {
  const corridors = ["Дорога и парковочная зона","Ул. Трумана","Съезд №1"]
  const [selCorridor, setSelCorridor] = useState(corridors[0])

  const data = {
    cut:  [1245,2103,1876,932,0,0,456,1234,2456,3102,2847,1923],
    fill: [0,15,124,478,1024,2187,1543,678,102,0,0,340],
    pks:  Array.from({length:12},(_,i)=>`ПК${i*2}`)
  }
  const totalCut  = data.cut.reduce((a,b)=>a+b,0)
  const totalFill = data.fill.reduce((a,b)=>a+b,0)
  const net = totalCut - totalFill

  // SVG диаграмма
  const ChartSVG = () => {
    const W=340, H=100, maxV=Math.max(...data.cut,...data.fill,1)
    const bW = (W-20)/(data.cut.length*2+data.cut.length-1)
    return (
      <svg width={W} height={H+20} viewBox={`0 0 ${W} ${H+20}`} style={{background:"#0d1117",borderRadius:6,display:"block"}}>
        {/* Нулевая линия */}
        <line x1="10" y1={H} x2={W-10} y2={H} stroke="#374151" strokeWidth="0.8"/>
        {data.cut.map((c,i)=>{
          const x = 10+i*(bW*3)
          const hc = (c/maxV)*(H-10), hf = (data.fill[i]/maxV)*(H-10)
          return (
            <g key={i}>
              <rect x={x} y={H-hc} width={bW} height={hc} fill="#ef4444" opacity="0.8" rx="1"/>
              <rect x={x+bW+1} y={H-hf} width={bW} height={hf} fill="#3b82f6" opacity="0.8" rx="1"/>
              {i%3===0&&<text x={x+bW} y={H+12} textAnchor="middle" fill="#6b7280" fontSize="5">{data.pks[i]}</text>}
            </g>
          )
        })}
        {/* Легенда */}
        <rect x="10" y="4" width="7" height="5" fill="#ef4444" rx="1"/>
        <text x="20" y="9" fill="#f87171" fontSize="5.5">Выемка</text>
        <rect x="65" y="4" width="7" height="5" fill="#3b82f6" rx="1"/>
        <text x="75" y="9" fill="#60a5fa" fontSize="5.5">Насыпь</text>
      </svg>
    )
  }

  // График масс
  const MassCurveSVG = () => {
    let cum=0; const pts=data.cut.map((c,i)=>{ cum+=c-data.fill[i]; return cum })
    const min=Math.min(...pts), max=Math.max(...pts), range=max-min||1
    const W=340,H=70
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{background:"#0d1117",borderRadius:6,display:"block"}}>
        <line x1="10" y1={H/2} x2={W-10} y2={H/2} stroke="#374151" strokeWidth="0.8" strokeDasharray="4 2"/>
        <polyline points={pts.map((v,i)=>`${10+i*(W-20)/(pts.length-1)},${H-10-((v-min)/range)*(H-20)}`).join(" ")}
          fill="none" stroke="#4fc3f7" strokeWidth="1.5"/>
        {pts.filter((v,i)=>i>0&&(pts[i-1]>0)!==(v>0)).map((v,i)=>(
          <circle key={i} cx={10+i*(W-20)/(pts.length-1)} cy={H/2} r="3" fill="none" stroke="#facc15" strokeWidth="1.5"/>
        ))}
        <text x="12" y="8" fill="#4fc3f7" fontSize="6">Кривая масс Брикнера</text>
      </svg>
    )
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-xl shadow-2xl flex flex-col"
        style={{width:620,maxHeight:"88vh"}} onClick={e=>e.stopPropagation()}>
        <div className="bg-[#0a1628] px-5 py-3 flex items-center justify-between border-b border-gray-700 rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon name="BarChart3" size={15} className="text-[#60a5fa]"/>
            <span className="text-white font-bold text-[13px]">Volume Dashboard — Дашборд объёмов</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="p-4 border-b border-gray-800 flex-shrink-0 flex items-center gap-3">
          <span className="text-gray-500 text-[10px]">Коридор:</span>
          <div className="flex gap-1">{corridors.map(c=>(
            <button key={c} onClick={()=>setSelCorridor(c)}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${selCorridor===c?"bg-[#0078d4] text-white":"bg-[#252535] text-gray-400 hover:text-white"}`}>{c}</button>
          ))}</div>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-4 min-h-0">
          {/* KPI */}
          <div className="grid grid-cols-3 gap-3 text-[10px]">
            {[
              {label:"Выемка (Cut)",val:`${(totalCut/1000).toFixed(1)} тыс. м³`,color:"#f87171",icon:"ArrowDown"},
              {label:"Насыпь (Fill)",val:`${(totalFill/1000).toFixed(1)} тыс. м³`,color:"#60a5fa",icon:"ArrowUp"},
              {label:net>0?"Вывоз грунта":"Привоз грунта",val:`${(Math.abs(net)/1000).toFixed(1)} тыс. м³`,color:net>0?"#f97316":"#4ade80",icon:"TrendingUp"},
            ].map(k=>(
              <div key={k.label} className="rounded-lg border border-gray-700 p-3 flex gap-2 items-start" style={{background:"#111827"}}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:k.color+"20"}}>
                  <Icon name={k.icon} size={16} style={{color:k.color}} fallback="BarChart3"/>
                </div>
                <div><div className="text-gray-500 text-[9px]">{k.label}</div>
                <div className="font-mono font-bold text-[13px]" style={{color:k.color}}>{k.val}</div></div>
              </div>
            ))}
          </div>
          {/* Гистограмма */}
          <div>
            <div className="text-[9px] text-gray-500 mb-1">Объёмы по пикетам</div>
            <ChartSVG/>
          </div>
          {/* Кривая масс */}
          <div>
            <div className="text-[9px] text-gray-500 mb-1">График масс Брикнера</div>
            <MassCurveSVG/>
          </div>
          {/* Баланс */}
          <div className="rounded-lg border border-gray-700 p-3 text-[10px]" style={{background:"#111827"}}>
            <div className="font-bold text-white mb-2">Баланс земляных работ</div>
            <div className="flex items-center gap-2 mb-1">
              <div className="text-red-400 w-12">Выемка</div>
              <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-500/70 rounded-full" style={{width:`${(totalCut/(totalCut+totalFill)*100).toFixed(0)}%`}}/>
              </div>
              <div className="text-red-400 font-mono w-10">{(totalCut/(totalCut+totalFill)*100).toFixed(0)}%</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-blue-400 w-12">Насыпь</div>
              <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500/70 rounded-full" style={{width:`${(totalFill/(totalCut+totalFill)*100).toFixed(0)}%`}}/>
              </div>
              <div className="text-blue-400 font-mono w-10">{(totalFill/(totalCut+totalFill)*100).toFixed(0)}%</div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-700 flex-shrink-0 bg-[#0a1628] rounded-b-xl">
          <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 rounded text-[11px]">Закрыть</button>
          <button onClick={onClose} className="px-4 py-1.5 bg-[#60a5fa] text-[#0a1020] hover:bg-[#93c5fd] rounded text-[11px] font-bold">Экспорт CSV</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Construction Phases ───────────────────────────────────────────────────────
function ConstructionPhasesDialog({ onClose }: { onClose: ()=>void }) {
  const [activePhase, setActivePhase] = useState(2)
  const phases = [
    {id:1, name:"Подготовительный",   start:"01.03.2025",end:"01.05.2025",color:"#f59e0b",status:"Завершён",  pct:100,
     works:["Вырубка леса и кустарника","Снятие почвенно-растительного слоя","Водоотвод строительный","Устройство технологических дорог"]},
    {id:2, name:"Земляное полотно",   start:"01.05.2025",end:"01.09.2025",color:"#f97316",status:"В работе",  pct:65,
     works:["Разработка грунта в выемке","Отсыпка насыпи","Уплотнение (Proctor ≥ 0.98)","Укрепление откосов","Водоотводные канавы"]},
    {id:3, name:"Дорожная одежда",    start:"01.09.2025",end:"01.12.2025",color:"#4ade80",status:"Не начат", pct:0,
     works:["Подстилающий слой ПГС","Основание из щебня","Нижний слой АБ (крупнозернистый)","Верхний слой АБ (мелкозернистый)","Дорожная разметка"]},
    {id:4, name:"Инженерные сети",    start:"15.05.2025",end:"15.10.2025",color:"#60a5fa",status:"В работе",  pct:40,
     works:["Ливневая канализация","Водопровод Ø200","Освещение","Сигнализация и связь"]},
    {id:5, name:"Благоустройство",    start:"01.10.2025",end:"01.03.2026",color:"#a78bfa",status:"Не начат", pct:0,
     works:["Озеленение откосов","Дорожные знаки и ограждения","Автобусные остановки","Сдача объекта"]},
  ]
  const phase = phases[activePhase-1]
  const totalDays = 365
  const today = new Date("2025-07-01")

  const dayOf = (s:string)=>{ const d=new Date(s); return Math.round((d.getTime()-new Date("2025-03-01").getTime())/86400000) }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-xl shadow-2xl flex flex-col"
        style={{width:660,maxHeight:"90vh"}} onClick={e=>e.stopPropagation()}>
        <div className="bg-[#141028] px-5 py-3 flex items-center justify-between border-b border-gray-700 rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon name="Calendar" size={15} className="text-[#a78bfa]" fallback="Clock"/>
            <span className="text-white font-bold text-[13px]">Construction Phases — Стройгенплан и фазы</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="flex-1 overflow-auto p-4 text-[11px] min-h-0 space-y-4">
          {/* Диаграмма Ганта */}
          <div>
            <div className="text-[10px] text-gray-400 mb-2 font-bold">Диаграмма Ганта</div>
            <div className="rounded-lg border border-gray-700 overflow-hidden" style={{background:"#0d1117"}}>
              <div className="flex border-b border-gray-800 text-[8px] text-gray-600 px-2 py-1">
                {["Март","Апр","Май","Июнь","Июль","Авг","Сен","Окт","Нояб","Дек","Янв","Фев","Март"].map(m=>(
                  <div key={m} className="flex-1 text-center">{m}</div>
                ))}
              </div>
              {phases.map(ph=>{
                const start = dayOf(ph.start)/totalDays*100
                const width = (dayOf(ph.end)-dayOf(ph.start))/totalDays*100
                const todayPct = (today.getTime()-new Date("2025-03-01").getTime())/86400000/totalDays*100
                return (
                  <div key={ph.id} className="flex items-center border-b border-gray-900 hover:bg-[#1a1a2e] cursor-pointer"
                    onClick={()=>setActivePhase(ph.id)}>
                    <div className="w-36 px-2 py-1.5 text-[10px] text-gray-400 truncate border-r border-gray-800 flex-shrink-0">{ph.name}</div>
                    <div className="flex-1 relative h-6 px-1">
                      <div className="absolute rounded" style={{left:`${start}%`,width:`${width}%`,top:"4px",height:"16px",background:ph.color+(activePhase===ph.id?"":"80")}}>
                        <div className="h-full rounded" style={{width:`${ph.pct}%`,background:ph.color,opacity:0.9}}/>
                        <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-bold">{ph.pct}%</span>
                      </div>
                      {/* Сегодня */}
                      <div className="absolute top-0 bottom-0 border-l-2 border-red-500 opacity-70" style={{left:`${todayPct}%`}}/>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Детали фазы */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3" style={{background:"#111827",borderColor:phase.color+"40"}}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{background:phase.color}}/>
                <span className="text-white font-bold text-[11px]">{phase.name}</span>
                <span className={`ml-auto text-[9px] px-2 py-0.5 rounded-full ${phase.status==="Завершён"?"bg-green-900/30 text-green-400":phase.status==="В работе"?"bg-yellow-900/30 text-yellow-400":"bg-gray-800 text-gray-500"}`}>{phase.status}</span>
              </div>
              <div className="text-[9px] text-gray-500 space-y-1">
                <div>Начало: <span className="text-white">{phase.start}</span></div>
                <div>Окончание: <span className="text-white">{phase.end}</span></div>
                <div className="mt-2">
                  <div className="flex justify-between mb-0.5"><span>Готовность</span><span className="text-white font-bold">{phase.pct}%</span></div>
                  <div className="h-1.5 bg-gray-800 rounded-full"><div className="h-full rounded-full" style={{width:`${phase.pct}%`,background:phase.color}}/></div>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-gray-700 p-3" style={{background:"#111827"}}>
              <div className="text-[10px] text-gray-400 font-bold mb-2">Состав работ</div>
              {phase.works.map((w,i)=>(
                <div key={i} className="flex items-center gap-2 py-1 border-b border-gray-800 text-[9px]">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:phase.color}}/>
                  <span className="text-gray-300">{w}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Навигация по фазам */}
          <div className="flex gap-2">
            {phases.map(ph=>(
              <button key={ph.id} onClick={()=>setActivePhase(ph.id)}
                className={`flex-1 py-1.5 text-[9px] rounded transition-all ${activePhase===ph.id?"text-white font-bold":"text-gray-500 hover:text-gray-300"}`}
                style={{background:activePhase===ph.id?ph.color+"30":"#111827",borderBottom:`2px solid ${activePhase===ph.id?ph.color:"transparent"}`}}>
                {ph.id}. {ph.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-700 flex-shrink-0 bg-[#141028] rounded-b-xl">
          <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 rounded text-[11px]">Закрыть</button>
          <button onClick={onClose} className="px-4 py-1.5 bg-[#a78bfa] text-[#0d0a1a] hover:bg-[#c4b5fd] rounded text-[11px] font-bold">Экспорт PDF</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Revit / AutoCAD Exchange ──────────────────────────────────────────────────
function RevitExchangeDialog({ onClose }: { onClose: ()=>void }) {
  const [tab, setTab] = useState<"import"|"export"|"links">("export")
  const [format, setFormat] = useState("IFC 2x3")
  const [progress, setProgress] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [synced, setSynced] = useState(false)
  const [reToast, setReToast] = useState<string|null>(null)
  const reFlash = (m:string)=>{ setReToast(m); setTimeout(()=>setReToast(null), 2000) }

  const doSync = () => {
    setSyncing(true); setProgress(0); setSynced(false)
    const iv = setInterval(()=>setProgress(p=>{ if(p>=100){clearInterval(iv);setSyncing(false);setSynced(true);return 100} return p+5 }), 120)
  }

  const links = [
    {name:"Мост_ст.ОКА.rvt",app:"Revit 2025",status:"Синхронизирован",date:"2025-06-28",color:"#60a5fa"},
    {name:"Тоннель_№1.rvt",app:"Revit 2025",status:"Устарел",date:"2025-05-14",color:"#f97316"},
    {name:"КТП_проект.dwg",app:"AutoCAD 2025",status:"Синхронизирован",date:"2025-06-30",color:"#4ade80"},
  ]

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-xl shadow-2xl flex flex-col relative"
        style={{width:580,maxHeight:"88vh"}} onClick={e=>e.stopPropagation()}>
        <div className="bg-[#0a1428] px-5 py-3 flex items-center justify-between border-b border-gray-700 rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon name="RefreshCw" size={15} className="text-[#0078d4]" fallback="RotateCw"/>
            <span className="text-white font-bold text-[13px]">Revit / AutoCAD Exchange</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="flex border-b border-gray-700 bg-[#0d1520] flex-shrink-0">
          {([["export","Экспорт"],["import","Импорт"],["links","Связанные файлы"]] as const).map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`px-4 py-1.5 text-[10px] border-r border-gray-800 transition-colors ${tab===id?"bg-[#1e2a3e] text-white border-b-2 border-b-[#0078d4]":"text-gray-400 hover:bg-[#1e2a3e]"}`}>{lbl}</button>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-4 text-[11px] min-h-0">
          {tab==="export" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-gray-500 text-[9px]">Формат обмена</span>
                  <select value={format} onChange={e=>setFormat(e.target.value)}
                    className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded outline-none text-[10px]">
                    {["IFC 2x3","IFC 4","ADSK (Autodesk Exchange)","LandXML 2.0","DWG (AutoCAD 2025)","DXF","ACIS (SAT)"].map(o=><option key={o}>{o}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-gray-500 text-[9px]">Целевое приложение</span>
                  <select className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded outline-none text-[10px]">
                    {["Autodesk Revit 2025","AutoCAD 2025","Navisworks 2025","BIM 360","Tekla Structures","AVEVA"].map(o=><option key={o}>{o}</option>)}
                  </select>
                </label>
              </div>
              <div className="rounded-lg border border-gray-700 p-3 text-[10px]" style={{background:"#111827"}}>
                <div className="font-bold text-white mb-2">Объекты для экспорта</div>
                {[
                  {name:"Поверхности TIN",cnt:2,check:true},
                  {name:"Трассы и профили",cnt:3,check:true},
                  {name:"Коридоры",cnt:1,check:true},
                  {name:"Трубопроводные сети",cnt:2,check:true},
                  {name:"Точки съёмки",cnt:847,check:false},
                  {name:"Сооружения (мосты, тоннели)",cnt:2,check:true},
                ].map((o,i)=>(
                  <div key={i} className="flex items-center gap-2 py-1 border-b border-gray-800">
                    <input type="checkbox" defaultChecked={o.check} className="accent-[#0078d4]"/>
                    <span className="text-gray-300 flex-1">{o.name}</span>
                    <span className="text-gray-500 font-mono">{o.cnt}</span>
                  </div>
                ))}
              </div>
              {syncing || synced ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px]"><span className="text-gray-400">{synced?"Готово!":"Экспорт..."}</span><span className="text-[#0078d4] font-mono">{Math.round(progress)}%</span></div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-[#0078d4] rounded-full transition-all" style={{width:`${progress}%`}}/></div>
                  {synced&&<div className="text-green-400 text-[10px]">✓ {format} экспортирован · Файл готов к загрузке в Revit</div>}
                </div>
              ) : (
                <button onClick={doSync} className="w-full py-2.5 bg-[#0078d4] text-white font-bold rounded-lg text-[11px] hover:bg-[#0066b3] transition-colors">
                  ▶ Экспортировать в {format}
                </button>
              )}
            </div>
          )}
          {tab==="import" && (
            <div className="space-y-4">
              <div className="text-gray-400 text-[10px]">Импорт из Revit / AutoCAD в проект ЛАПА</div>
              <div className="rounded-xl border-2 border-dashed border-gray-600 hover:border-[#0078d4] p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors" style={{background:"#0d1520"}}>
                <Icon name="Upload" size={28} className="text-gray-500"/>
                <span className="text-gray-500 text-[11px]">Перетащите .rvt / .rfa / .dwg / .ifc / .nwd</span>
              </div>
            </div>
          )}
          {tab==="links" && (
            <div className="space-y-2">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400 text-[10px]">Связанные BIM-файлы</span>
                <button onClick={()=>reFlash("✓ BIM-ссылка добавлена")} className="px-2 py-0.5 bg-[#0078d4]/20 text-[#60a5fa] border border-[#0078d4]/40 rounded text-[9px] hover:bg-[#0078d4]/30">+ Добавить ссылку</button>
              </div>
              {links.map((l,i)=>(
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-700 hover:bg-[#1e2a3e]" style={{background:"#111827"}}>
                  <div className="w-8 h-8 rounded bg-[#0078d4]/20 flex items-center justify-center flex-shrink-0">
                    <Icon name="FileCode" size={16} className="text-[#0078d4]"/>
                  </div>
                  <div className="flex-1">
                    <div className="text-white text-[11px] font-semibold">{l.name}</div>
                    <div className="text-gray-500 text-[9px]">{l.app} · {l.date}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full ${l.status==="Синхронизирован"?"bg-green-900/30 text-green-400":"bg-yellow-900/30 text-yellow-400"}`}>{l.status}</span>
                    <button onClick={()=>reFlash(`✓ ${l.name} обновлён`)} className="text-[#0078d4] text-[9px] hover:underline">Обновить</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-700 flex-shrink-0 bg-[#0a1428] rounded-b-xl">
          <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 rounded text-[11px]">Закрыть</button>
          <button onClick={()=>{ reFlash("✓ Обмен данными применён"); setTimeout(onClose, 800) }} className="px-4 py-1.5 bg-[#0078d4] text-white rounded text-[11px] font-bold">Применить</button>
        </div>
        <AnimatePresence>
          {reToast && (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-[#0a1428] border border-[#0078d4]/50 text-[#60a5fa] text-[10px] px-3 py-1.5 rounded-lg shadow-lg z-10 whitespace-nowrap">
              {reToast}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// GEOTECHNICAL · GRADING · TUNNEL DESIGN · VISIBILITY 3D · PROJECT EXPLORER
// ═══════════════════════════════════════════════════════════════════════════

// ─── Geotechnical (геология, скважины, стратиграфия) ─────────────────────────
function GeotechnicalDialog({ onClose }: { onClose: ()=>void }) {
  const [tab, setTab] = useState<"boreholes"|"strata"|"section"|"params">("boreholes")
  const [geoToast, setGeoToast] = useState<string|null>(null)
  const geoFlash = (m:string)=>{ setGeoToast(m); setTimeout(()=>setGeoToast(null), 2000) }
  const boreholes = [
    {id:"СК-1", x:"5420.1", y:"3817.2", z:"121.34", depth:"18.0", date:"2024-03-15",layers:5},
    {id:"СК-2", x:"5465.3", y:"3830.8", z:"119.78", depth:"20.0", date:"2024-03-16",layers:6},
    {id:"СК-3", x:"5510.7", y:"3844.1", z:"122.50", depth:"15.0", date:"2024-03-17",layers:4},
    {id:"СК-4", x:"5555.2", y:"3858.6", z:"120.90", depth:"22.0", date:"2024-03-18",layers:7},
  ]
  const [selBH, setSelBH] = useState("СК-1")
  const strata: Record<string,{from:number;to:number;name:string;color:string;gtype:string;Е:number;φ:number;c:number}[]> = {
    "СК-1": [
      {from:0,  to:0.3, name:"Почвенно-растительный слой",color:"#166534",gtype:"ПРС",Е:0,   φ:0,  c:0},
      {from:0.3,to:2.0, name:"Суглинок мягкопластичный", color:"#854d0e",gtype:"ИГЭ-1",Е:8,  φ:18, c:12},
      {from:2.0,to:5.5, name:"Суглинок тугопластичный",  color:"#92400e",gtype:"ИГЭ-2",Е:14, φ:21, c:20},
      {from:5.5,to:11.0,name:"Супесь пластичная",        color:"#d97706",gtype:"ИГЭ-3",Е:18, φ:24, c:8},
      {from:11.0,to:18.0,name:"Песок средней крупности", color:"#ca8a04",gtype:"ИГЭ-4",Е:28, φ:30, c:2},
    ],
    "СК-2": [
      {from:0,  to:0.2, name:"Почвенно-растительный слой",color:"#166534",gtype:"ПРС",Е:0,   φ:0,  c:0},
      {from:0.2,to:1.5, name:"Насыпной грунт",            color:"#4b5563",gtype:"НГ",Е:5,    φ:15, c:5},
      {from:1.5,to:4.0, name:"Суглинок мягкопластичный",  color:"#854d0e",gtype:"ИГЭ-1",Е:8,  φ:18, c:12},
      {from:4.0,to:9.0, name:"Суглинок тугопластичный",   color:"#92400e",gtype:"ИГЭ-2",Е:14, φ:21, c:20},
      {from:9.0,to:15.0,name:"Супесь пластичная",         color:"#d97706",gtype:"ИГЭ-3",Е:18, φ:24, c:8},
      {from:15.0,to:20.0,name:"Суглинок полутвёрдый",     color:"#7c3aed",gtype:"ИГЭ-5",Е:22, φ:23, c:30},
    ],
  }
  const layers = strata[selBH] || strata["СК-1"]
  const totalDepth = layers[layers.length-1]?.to || 18

  // SVG колонка скважины
  const BoreholeColumnSVG = () => {
    const W = 60, H = 180, scale = H / totalDepth
    return (
      <svg width={W+60} height={H+20} viewBox={`0 0 ${W+60} ${H+20}`} style={{background:"#080e18",borderRadius:6,display:"block"}}>
        {layers.map((l,i) => {
          const y = l.from * scale, h = (l.to - l.from) * scale
          return (
            <g key={i}>
              <rect x="30" y={y} width={W} height={h} fill={l.color} opacity="0.85" stroke="#374151" strokeWidth="0.5"/>
              {l.gtype!=="ПРС"&&h>8&&<text x="60" y={y+h/2+3} textAnchor="middle" fill="white" fontSize="6" fontFamily="mono">{l.gtype}</text>}
              <text x="28" y={y+3} textAnchor="end" fill="#9ca3af" fontSize="5.5">{l.from.toFixed(1)}</text>
            </g>
          )
        })}
        <text x="28" y={H+3} textAnchor="end" fill="#9ca3af" fontSize="5.5">{totalDepth.toFixed(1)}</text>
        <line x1="30" y1="0" x2="30" y2={H} stroke="#6b7280" strokeWidth="0.8"/>
        {/* Уровень воды */}
        <line x1="25" y1={4.0*scale} x2={W+30} y2={4.0*scale} stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 2"/>
        <text x="22" y={4.0*scale+3} textAnchor="end" fill="#3b82f6" fontSize="5">УГВ</text>
      </svg>
    )
  }

  // SVG геологический разрез
  const GeolSectionSVG = () => {
    const W=300, H=120, bhs=boreholes.slice(0,4)
    const xStep = W/(bhs.length+1)
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{background:"#080e18",borderRadius:6,display:"block"}}>
        <rect width={W} height={H} fill="#0d1a2e"/>
        {/* Слои (интерполяция) */}
        {[
          {y1:8,y2:12,color:"#166534"},
          {y1:12,y2:30,color:"#854d0e"},
          {y1:30,y2:55,color:"#92400e"},
          {y1:55,y2:80,color:"#d97706"},
          {y1:80,y2:110,color:"#ca8a04"},
        ].map((s,i)=>(
          <rect key={i} x="0" y={s.y1} width={W} height={s.y2-s.y1} fill={s.color} opacity="0.6"/>
        ))}
        {/* Скважины */}
        {bhs.map((bh,i) => {
          const x = xStep*(i+1)
          return (
            <g key={i}>
              <line x1={x} y1="0" x2={x} y2={H*0.85} stroke="#facc15" strokeWidth="1.5"/>
              <circle cx={x} cy={6} r="4" fill="#facc15"/>
              <text x={x} y={H-2} textAnchor="middle" fill="#9ca3af" fontSize="6">{bh.id}</text>
            </g>
          )
        })}
        {/* Рельеф */}
        <path d="M 0,10 C 60,6 100,12 150,8 C 200,4 250,14 300,10" fill="none" stroke="#4ade80" strokeWidth="1.5"/>
        <text x="4" y="6" fill="#4ade80" fontSize="6">Рельеф</text>
        {/* УГВ */}
        <path d="M 0,32 C 80,28 160,36 300,30" fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 2"/>
        <text x="4" y="28" fill="#3b82f6" fontSize="6">УГВ</text>
      </svg>
    )
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-xl shadow-2xl flex flex-col relative"
        style={{width:700,maxHeight:"92vh"}} onClick={e=>e.stopPropagation()}>
        <div className="bg-[#1a1228] px-5 py-3 flex items-center justify-between border-b border-gray-700 rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon name="Layers" size={15} className="text-[#a78bfa]"/>
            <span className="text-white font-bold text-[13px]">Geotechnical — Геология и скважины</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="flex border-b border-gray-700 bg-[#15102a] flex-shrink-0">
          {([["boreholes","Скважины"],["strata","Стратиграфия"],["section","Разрез"],["params","Параметры ИГЭ"]] as const).map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`px-4 py-1.5 text-[10px] border-r border-gray-800 transition-colors ${tab===id?"bg-[#1e1a3e] text-white border-b-2 border-b-[#a78bfa]":"text-gray-400 hover:bg-[#1e1a3e]"}`}>{lbl}</button>
          ))}
        </div>
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 overflow-auto p-4 text-[11px] min-h-0">
            {tab==="boreholes" && (
              <div className="space-y-3">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">База геологических скважин</span>
                  <button onClick={()=>geoFlash("✓ Скважина добавлена")} className="px-2 py-0.5 bg-[#a78bfa]/20 text-[#a78bfa] border border-[#a78bfa]/40 rounded text-[9px] hover:bg-[#a78bfa]/30">+ Добавить скважину</button>
                </div>
                <table className="w-full border-collapse text-[10px]">
                  <thead><tr className="bg-[#0d1117]">{["ID","X","Y","Z нач.","Глубина","Дата","Слоёв",""].map(h=><th key={h} className="px-2 py-1 text-gray-400 border border-gray-800 text-left font-normal">{h}</th>)}</tr></thead>
                  <tbody>{boreholes.map((b,i)=>(
                    <tr key={i} className={`hover:bg-[#1e1a3e] cursor-pointer ${selBH===b.id?"bg-[#1e1a3e]":i%2===0?"bg-[#111827]":"bg-[#0d1117]"}`}
                      onClick={()=>setSelBH(b.id)}>
                      <td className="px-2 py-1 border border-gray-800 text-[#a78bfa] font-bold">{b.id}</td>
                      <td className="px-2 py-1 border border-gray-800 font-mono text-gray-300">{b.x}</td>
                      <td className="px-2 py-1 border border-gray-800 font-mono text-gray-300">{b.y}</td>
                      <td className="px-2 py-1 border border-gray-800 font-mono text-green-400">{b.z}</td>
                      <td className="px-2 py-1 border border-gray-800 font-mono text-[#f97316]">{b.depth} м</td>
                      <td className="px-2 py-1 border border-gray-800 text-gray-500">{b.date}</td>
                      <td className="px-2 py-1 border border-gray-800 text-center text-white">{b.layers}</td>
                      <td className="px-2 py-1 border border-gray-800"><button className="text-[#a78bfa] text-[9px] hover:underline">Открыть</button></td>
                    </tr>
                  ))}</tbody>
                </table>
                <div className="text-[9px] text-gray-600">Нажмите на строку для просмотра колонки → вкладка «Стратиграфия»</div>
              </div>
            )}
            {tab==="strata" && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">Скважина:</span>
                  <select value={selBH} onChange={e=>setSelBH(e.target.value)}
                    className="bg-[#1e1a3e] border border-gray-600 text-white px-2 py-1 rounded text-[10px]">
                    {boreholes.map(b=><option key={b.id}>{b.id}</option>)}
                  </select>
                  <span className="text-gray-500">Глубина: <span className="text-[#a78bfa] font-bold">{totalDepth} м</span></span>
                </div>
                <div className="overflow-auto">
                  <table className="w-full border-collapse text-[10px]">
                    <thead><tr className="bg-[#0d1117]">{["Цвет","От, м","До, м","Грунт","ИГЭ","E, МПа","φ°","c, кПа"].map(h=><th key={h} className="px-2 py-1 text-gray-400 border border-gray-800 text-left font-normal">{h}</th>)}</tr></thead>
                    <tbody>{layers.map((l,i)=>(
                      <tr key={i} className="hover:bg-[#1e1a3e]">
                        <td className="px-2 py-1 border border-gray-800"><div className="w-8 h-4 rounded" style={{background:l.color}}/></td>
                        <td className="px-2 py-1 border border-gray-800 font-mono text-gray-400">{l.from.toFixed(1)}</td>
                        <td className="px-2 py-1 border border-gray-800 font-mono text-gray-400">{l.to.toFixed(1)}</td>
                        <td className="px-2 py-1 border border-gray-800 text-white">{l.name}</td>
                        <td className="px-2 py-1 border border-gray-800 text-[#a78bfa] font-bold">{l.gtype}</td>
                        <td className="px-2 py-1 border border-gray-800 font-mono text-blue-400">{l.Е||"—"}</td>
                        <td className="px-2 py-1 border border-gray-800 font-mono text-green-400">{l.φ||"—"}</td>
                        <td className="px-2 py-1 border border-gray-800 font-mono text-yellow-400">{l.c||"—"}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            )}
            {tab==="section" && (
              <div className="space-y-3">
                <div className="text-gray-400 text-[10px]">Геологический разрез вдоль трассы</div>
                <GeolSectionSVG/>
                <div className="text-[9px] text-gray-500">Вертикальный масштаб 1:200 · Горизонтальный 1:2000 · Интерполяция линейная</div>
                <div className="grid grid-cols-2 gap-2">
                  {[{name:"ПРС",color:"#166534"},{name:"НГ",color:"#4b5563"},{name:"ИГЭ-1",color:"#854d0e"},{name:"ИГЭ-2",color:"#92400e"},{name:"ИГЭ-3",color:"#d97706"},{name:"ИГЭ-4",color:"#ca8a04"},{name:"ИГЭ-5",color:"#7c3aed"}].map(s=>(
                    <div key={s.name} className="flex items-center gap-2 text-[10px]">
                      <div className="w-5 h-3 rounded-sm" style={{background:s.color}}/>
                      <span className="text-gray-400">{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab==="params" && (
              <div className="space-y-3">
                <div className="text-gray-400 text-[10px] mb-2">Нормативные характеристики ИГЭ (инженерно-геологических элементов)</div>
                <table className="w-full border-collapse text-[10px]">
                  <thead><tr className="bg-[#0d1117]">{["ИГЭ","Наименование","E, МПа","φ, °","c, кПа","γ, кН/м³","IL","e"].map(h=><th key={h} className="px-2 py-1 text-gray-400 border border-gray-800 text-left font-normal">{h}</th>)}</tr></thead>
                  <tbody>{[
                    {ige:"ИГЭ-1",name:"Суглинок мягкопластичный",E:8,phi:18,c:12,gamma:18.5,IL:0.65,e:0.82},
                    {ige:"ИГЭ-2",name:"Суглинок тугопластичный",E:14,phi:21,c:20,gamma:19.0,IL:0.42,e:0.72},
                    {ige:"ИГЭ-3",name:"Супесь пластичная",E:18,phi:24,c:8,gamma:18.8,IL:0.55,e:0.68},
                    {ige:"ИГЭ-4",name:"Песок средней крупности",E:28,phi:30,c:2,gamma:18.5,IL:0,e:0.62},
                    {ige:"ИГЭ-5",name:"Суглинок полутвёрдый",E:22,phi:23,c:30,gamma:19.5,IL:0.18,e:0.65},
                  ].map((r,i)=>(
                    <tr key={i} className="hover:bg-[#1e1a3e]">
                      <td className="px-2 py-1 border border-gray-800 text-[#a78bfa] font-bold">{r.ige}</td>
                      <td className="px-2 py-1 border border-gray-800 text-white">{r.name}</td>
                      <td className="px-2 py-1 border border-gray-800 font-mono text-blue-400">{r.E}</td>
                      <td className="px-2 py-1 border border-gray-800 font-mono text-green-400">{r.phi}</td>
                      <td className="px-2 py-1 border border-gray-800 font-mono text-yellow-400">{r.c}</td>
                      <td className="px-2 py-1 border border-gray-800 font-mono text-gray-300">{r.gamma}</td>
                      <td className="px-2 py-1 border border-gray-800 font-mono text-gray-400">{r.IL}</td>
                      <td className="px-2 py-1 border border-gray-800 font-mono text-gray-400">{r.e}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
          {/* Колонка */}
          <div className="w-36 flex-shrink-0 border-l border-gray-800 p-3 flex flex-col items-center gap-2" style={{background:"#0d1117"}}>
            <div className="text-[9px] text-gray-500 uppercase tracking-wide">Колонка {selBH}</div>
            <BoreholeColumnSVG/>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-700 flex-shrink-0 bg-[#15102a] rounded-b-xl">
          <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 rounded text-[11px]">Закрыть</button>
          <button onClick={()=>{ geoFlash("✓ ИГЭ применены к модели грунта"); setTimeout(onClose, 800) }} className="px-4 py-1.5 bg-[#a78bfa] text-[#0d0a1a] hover:bg-[#c4b5fd] rounded text-[11px] font-bold">Применить к поверхности</button>
        </div>
        <AnimatePresence>
          {geoToast && (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-[#15102a] border border-[#a78bfa]/50 text-[#a78bfa] text-[10px] px-3 py-1.5 rounded-lg shadow-lg z-10 whitespace-nowrap">
              {geoToast}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

// ─── Grading (площадки, рабочие отметки, откосы) ─────────────────────────────
function GradingDialog({ onClose }: { onClose: ()=>void }) {
  const [tab, setTab] = useState<"grade"|"slopes"|"volumes"|"criteria">("grade")
  const [surfName, setSurfName] = useState("Проектная площадка-1")
  const [method, setMethod] = useState("Откос от объекта")
  const [slopeH, setSlopeH] = useState("1.5")
  const [slopeV, setSlopeV] = useState("1")
  const [elevation, setElevation] = useState("120.50")
  const [transOffset, setTransOffset] = useState("2.0")

  // Рабочие отметки (рандомные для демо)
  const workingElev = Array.from({length:12},(_,i)=>{
    const st = i*20, natural = 120+Math.sin(i*0.4)*3+Math.cos(i*0.3)*2
    const design = parseFloat(elevation)
    const diff = design - natural
    return {pk:`ПК${Math.floor(st/100)}+${String(st%100).padStart(2,"0")}`, natural:natural.toFixed(2), design:elevation, diff:diff.toFixed(2), type:diff>0?"Насыпь":"Выемка"}
  })

  // Итого
  const fill = workingElev.filter(r=>r.type==="Насыпь").length
  const cut = workingElev.filter(r=>r.type==="Выемка").length

  // Criteria preset
  const criteria = [
    {name:"Откос насыпи 1:1.5",  m:"1.5", type:"Насыпь",  surface:"Существующая поверхность"},
    {name:"Откос выемки 1:1",    m:"1.0", type:"Выемка",   surface:"Существующая поверхность"},
    {name:"Кювет V-образный",    m:"0.5", type:"Кювет",    surface:"Существующая поверхность"},
    {name:"Берма шириной 2м",    m:"—",   type:"Берма",    surface:"—"},
  ]

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-xl shadow-2xl flex flex-col"
        style={{width:660,maxHeight:"90vh"}} onClick={e=>e.stopPropagation()}>
        <div className="bg-[#1a1828] px-5 py-3 flex items-center justify-between border-b border-gray-700 rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon name="Mountain" size={15} className="text-[#f59e0b]"/>
            <span className="text-white font-bold text-[13px]">Планировка — Площадки и рабочие отметки</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="flex border-b border-gray-700 bg-[#151422] flex-shrink-0">
          {([["grade","Отметки"],["slopes","Откосы"],["volumes","Объёмы"],["criteria","Критерии"]] as const).map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`px-4 py-1.5 text-[10px] border-r border-gray-800 transition-colors ${tab===id?"bg-[#252535] text-white border-b-2 border-b-[#f59e0b]":"text-gray-400 hover:bg-[#252535]"}`}>{lbl}</button>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-4 text-[11px] min-h-0">
          {tab==="grade" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {([
                  ["Название поверхности",surfName,setSurfName],
                  ["Метод планировки",method,setMethod],
                  ["Проектная отметка, м",elevation,setElevation],
                ] as [string,string,(v:string)=>void][]).map(([l,v,s])=>(
                  <label key={l} className="flex flex-col gap-1">
                    <span className="text-gray-500 text-[9px]">{l}</span>
                    {l.includes("Метод")
                      ? <select value={v} onChange={e=>s(e.target.value)} className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded outline-none focus:border-[#f59e0b] text-[10px]">
                          {["Откос от объекта","Площадка с уклоном","Горизонтальная площадка","Перепланировка рельефа"].map(o=><option key={o}>{o}</option>)}
                        </select>
                      : <input value={v} onChange={e=>s(e.target.value)}
                          className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded outline-none focus:border-[#f59e0b] font-mono"/>
                    }
                  </label>
                ))}
              </div>
              <div className="text-[10px] font-bold text-white mb-1">Рабочие отметки по пикетам</div>
              <div className="overflow-auto" style={{maxHeight:260}}>
                <table className="w-full border-collapse text-[10px]">
                  <thead><tr className="bg-[#0d1117] sticky top-0">{["Пикет","Чёрная отм., м","Красная отм., м","Рабочая отм., м","Зона"].map(h=><th key={h} className="px-2 py-1 text-gray-400 border border-gray-800 text-left font-normal">{h}</th>)}</tr></thead>
                  <tbody>{workingElev.map((r,i)=>(
                    <tr key={i} className={`${r.type==="Насыпь"?"bg-blue-900/10":"bg-red-900/10"} hover:bg-[#252535]`}>
                      <td className="px-2 py-0.5 border border-gray-800 text-[#4fc3f7] font-mono">{r.pk}</td>
                      <td className="px-2 py-0.5 border border-gray-800 text-gray-400 font-mono">{r.natural}</td>
                      <td className="px-2 py-0.5 border border-gray-800 text-gray-300 font-mono">{r.design}</td>
                      <td className={`px-2 py-0.5 border border-gray-800 font-mono font-bold ${parseFloat(r.diff)>0?"text-blue-400":"text-red-400"}`}>{parseFloat(r.diff)>0?"+":""}{r.diff}</td>
                      <td className={`px-2 py-0.5 border border-gray-800 text-[9px] font-bold ${r.type==="Насыпь"?"text-blue-400":"text-red-400"}`}>{r.type}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div className="flex gap-4 text-[10px]">
                <div className="text-blue-400">Насыпь: <span className="font-bold">{fill}</span> пикетов</div>
                <div className="text-red-400">Выемка: <span className="font-bold">{cut}</span> пикетов</div>
              </div>
            </div>
          )}
          {tab==="slopes" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {([
                  ["Откос m (гориз.)",slopeH,setSlopeH],
                  ["Откос (верт.)",slopeV,setSlopeV],
                  ["Берма, м",transOffset,setTransOffset],
                ] as [string,string,(v:string)=>void][]).map(([l,v,s])=>(
                  <label key={l} className="flex flex-col gap-1">
                    <span className="text-gray-500 text-[9px]">{l}</span>
                    <input type="number" value={v} onChange={e=>s(e.target.value)}
                      className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded outline-none focus:border-[#f59e0b] font-mono"/>
                  </label>
                ))}
              </div>
              {/* SVG поперечника с откосами */}
              <div className="rounded-lg border border-gray-700 p-3" style={{background:"#0d1117"}}>
                <div className="text-[9px] text-gray-500 mb-2 text-center">Типовой поперечник с откосами</div>
                <svg width="100%" viewBox="-60 -20 120 50" style={{display:"block"}}>
                  <rect x="-60" y="-20" width="120" height="50" fill="#1a2535"/>
                  {/* Рельеф */}
                  <path d="M -60,15 C -30,15 -20,10 -15,8 C -10,6 10,6 15,8 C 20,10 30,15 60,15" fill="#1e3a1e" stroke="#4ade80" strokeWidth="0.8"/>
                  {/* Насыпь */}
                  <polygon points={`-15,8 -5,0 5,0 15,8`} fill="rgba(59,130,246,0.3)" stroke="#60a5fa" strokeWidth="0.8"/>
                  {/* Откосы */}
                  <line x1="-15" y1="8" x2={-15-parseFloat(slopeH)*8} y2={8+8} stroke="#f97316" strokeWidth="1" strokeDasharray="2 1"/>
                  <line x1="15" y1="8" x2={15+parseFloat(slopeH)*8} y2={8+8} stroke="#f97316" strokeWidth="1" strokeDasharray="2 1"/>
                  {/* Проезжая часть */}
                  <rect x="-5" y="-1" width="10" height="1.5" fill="#374151"/>
                  <text x="0" y="-4" textAnchor="middle" fill="#9ca3af" fontSize="4">1:{slopeH}</text>
                  {/* Берма */}
                  <line x1={-15-parseFloat(slopeH)*8} y1={16} x2={-15-parseFloat(slopeH)*8-parseFloat(transOffset)*2} y2={16} stroke="#facc15" strokeWidth="1"/>
                  <text x={-15-parseFloat(slopeH)*8-parseFloat(transOffset)} y="14" textAnchor="middle" fill="#facc15" fontSize="3">{transOffset}м</text>
                </svg>
              </div>
            </div>
          )}
          {tab==="volumes" && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                {[
                  {label:"Объём насыпи",val:"8 240 м³",color:"#60a5fa"},
                  {label:"Объём выемки",val:"5 180 м³",color:"#f87171"},
                  {label:"Баланс",val:"+3 060 м³",color:"#4ade80"},
                  {label:"Откосы насыпи",val:"4 120 м²",color:"#a78bfa"},
                  {label:"Откосы выемки",val:"2 860 м²",color:"#f97316"},
                  {label:"Площадь планир.",val:"12 400 м²",color:"#facc15"},
                ].map(s=>(
                  <div key={s.label} className="rounded border border-gray-700 px-2 py-2" style={{background:"#111827"}}>
                    <div className="text-gray-500 text-[9px]">{s.label}</div>
                    <div className="font-mono font-bold text-[12px] mt-0.5" style={{color:s.color}}>{s.val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab==="criteria" && (
            <div className="space-y-2">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Критерии планировки</span>
                <button className="px-2 py-0.5 bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40 rounded text-[9px]">+ Добавить</button>
              </div>
              {criteria.map((c,i)=>(
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-700 hover:bg-[#252535]" style={{background:"#111827"}}>
                  <Icon name="Mountain" size={14} className="text-[#f59e0b] flex-shrink-0"/>
                  <div className="flex-1">
                    <div className="text-white font-semibold">{c.name}</div>
                    <div className="text-gray-500 text-[9px]">m={c.m} · {c.type} · Поверхность: {c.surface}</div>
                  </div>
                  <button className="text-[9px] text-[#f59e0b] hover:underline">Изменить</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-700 flex-shrink-0 bg-[#151422] rounded-b-xl">
          <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 rounded text-[11px]">Отмена</button>
          <button onClick={onClose} className="px-4 py-1.5 bg-[#f59e0b] text-[#0d0a00] hover:bg-[#fbbf24] rounded text-[11px] font-bold">✓ Применить</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Tunnel Design ─────────────────────────────────────────────────────────────
function TunnelDialog({ onClose, onOK }: { onClose: ()=>void; onOK: (d:{name:string})=>void }) {
  const [tab, setTab] = useState<"general"|"profile"|"lining"|"analysis">("general")
  const [name, setName] = useState("Тоннель №1")
  const [length, setLength] = useState("420")
  const [width, setWidth] = useState("10.5")
  const [height, setHeight] = useState("7.2")
  const [shape, setShape] = useState("Подковообразный")
  const [lining, setLining] = useState("Монолитный бетон B30")
  const [method, setMethod] = useState("НГМ (новоавстрийский)")
  const [cover, setCover] = useState("15.0")
  const [alignment, setAlignment] = useState("Трасса ШД-38")

  const Len = parseFloat(length)||420
  const W = parseFloat(width)||10.5
  const H = parseFloat(height)||7.2
  const Cover = parseFloat(cover)||15

  // Нагрузка на обделку
  const gamma = 18.5  // кН/м³
  const q = gamma * Cover  // кПа вертикальная
  const e = q * 0.35       // боковое давление
  const M = Math.round(q * W**2 / 8)  // момент в своде

  // SVG поперечник тоннеля
  const TunnelCrossSection = () => {
    const cx=95, cy=80, rW=W*4, rH=H*4
    return (
      <svg width="190" height="130" viewBox="0 0 190 130" style={{background:"#080e18",borderRadius:8,display:"block"}}>
        <rect width="190" height="130" fill="#1a2535"/>
        {/* Грунтовый массив */}
        <ellipse cx={cx} cy={cy} rx={rW+20} ry={rH+15} fill="#2d2014" opacity="0.7"/>
        {/* Обделка */}
        <ellipse cx={cx} cy={cy} rx={rW+6} ry={rH+4} fill="#374151"/>
        {/* Внутреннее сечение */}
        <ellipse cx={cx} cy={cy} rx={rW} ry={rH} fill="#0d1a2e"/>
        {/* Дорожное полотно */}
        <rect x={cx-rW} y={cy+rH-8} width={rW*2} height={5} fill="#374151" rx="1"/>
        {/* Тротуары */}
        <rect x={cx-rW} y={cy+rH-12} width={rW*0.2} height={4} fill="#1e293b"/>
        <rect x={cx+rW*0.8} y={cy+rH-12} width={rW*0.2} height={4} fill="#1e293b"/>
        {/* Лоток */}
        <path d={`M ${cx-rW},${cy+rH-2} Q ${cx},${cy+rH+4} ${cx+rW},${cy+rH-2}`} fill="none" stroke="#3b82f6" strokeWidth="1.5"/>
        {/* Размеры */}
        <line x1={cx-rW-2} y1={cy+rH-8} x2={cx+rW+2} y2={cy+rH-8} stroke="#f97316" strokeWidth="0.8"/>
        <text x={cx} y={cy+rH+3} textAnchor="middle" fill="#f97316" fontSize="7">B={W}м</text>
        <line x1={cx+rW+5} y1={cy-rH} x2={cx+rW+5} y2={cy+rH-8} stroke="#60a5fa" strokeWidth="0.8"/>
        <text x={cx+rW+14} y={cy} textAnchor="middle" fill="#60a5fa" fontSize="7" transform={`rotate(-90,${cx+rW+14},${cy})`}>H={H}м</text>
        {/* Нагрузка */}
        {Array.from({length:7},(_,i)=>(
          <line key={i} x1={cx-rW+i*rW*2/6} y1={0} x2={cx-rW+i*rW*2/6} y2={cy-rH-5}
            stroke="#facc15" strokeWidth="0.8" markerEnd="url(#arr3)"/>
        ))}
        <defs><marker id="arr3" markerWidth="4" markerHeight="4" refX="2" refY="4" orient="auto">
          <polygon points="0,0 4,0 2,4" fill="#facc15"/></marker></defs>
        <text x={cx} y={6} textAnchor="middle" fill="#facc15" fontSize="6">q={q.toFixed(0)} кПа</text>
        {/* Тип */}
        <text x={cx} y={cy-rH-8} textAnchor="middle" fill="#9ca3af" fontSize="6">{shape}</text>
      </svg>
    )
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-xl shadow-2xl flex flex-col"
        style={{width:680,maxHeight:"90vh"}} onClick={e=>e.stopPropagation()}>
        <div className="bg-[#1a1418] px-5 py-3 flex items-center justify-between border-b border-gray-700 rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon name="CircleDot" size={15} className="text-[#fb923c]" fallback="Circle"/>
            <span className="text-white font-bold text-[13px]">Tunnel Design — Проектирование тоннеля</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="flex border-b border-gray-700 bg-[#151214] flex-shrink-0">
          {([["general","Общие"],["profile","Профиль"],["lining","Обделка"],["analysis","Расчёт"]] as const).map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`px-4 py-1.5 text-[10px] border-r border-gray-800 transition-colors ${tab===id?"bg-[#252535] text-white border-b-2 border-b-[#fb923c]":"text-gray-400 hover:bg-[#252535]"}`}>{lbl}</button>
          ))}
        </div>
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 overflow-auto p-4 text-[11px] min-h-0">
            {tab==="general" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ["Название",name,setName],["Трасса",alignment,setAlignment],
                  ] as [string,string,(v:string)=>void][]).map(([l,v,s])=>(
                    <label key={l} className="flex flex-col gap-1"><span className="text-gray-500 text-[9px]">{l}</span>
                    <input value={v} onChange={e=>s(e.target.value)} className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded outline-none focus:border-[#fb923c]"/></label>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    ["Форма сечения",shape,setShape,["Подковообразный","Круговой","Прямоугольный","Арочный","Трапециевидный"]],
                    ["Метод проходки",method,setMethod,["НГМ (новоавстрийский)","Горный (щитовой)","Открытый котлован","ТПМК (TBM)","Буровзрывной"]],
                    ["Обделка",lining,setLining,["Монолитный бетон B30","Сборный ЖБ (тюбинги)","Набрызгбетон","Кирпичная кладка"]],
                  ] as [string,string,(v:string)=>void,string[]][]).map(([l,v,s,opts])=>(
                    <label key={l} className="flex flex-col gap-1"><span className="text-gray-500 text-[9px]">{l}</span>
                    <select value={v} onChange={e=>s(e.target.value)} className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded outline-none focus:border-[#fb923c] text-[10px]">
                      {opts.map(o=><option key={o}>{o}</option>)}</select></label>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {([["Длина L, м",length,setLength],["Ширина B, м",width,setWidth],["Высота H, м",height,setHeight],["Засыпка h, м",cover,setCover]] as [string,string,(v:string)=>void][]).map(([l,v,s])=>(
                    <label key={l} className="flex flex-col gap-1"><span className="text-gray-500 text-[9px]">{l}</span>
                    <input type="number" value={v} onChange={e=>s(e.target.value)} className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded outline-none focus:border-[#fb923c] font-mono"/></label>
                  ))}
                </div>
              </div>
            )}
            {tab==="profile" && (
              <div className="space-y-3">
                <div className="text-gray-400 text-[10px]">Продольный профиль тоннеля</div>
                <svg width="100%" viewBox="0 0 300 80" style={{background:"#0d1117",borderRadius:6,display:"block"}}>
                  {/* Рельеф */}
                  <path d="M 0,20 C 40,18 70,12 100,8 C 130,4 160,5 200,10 C 240,15 270,22 300,20" fill="#1e3a1e" stroke="#4ade80" strokeWidth="1.2"/>
                  {/* Тоннель */}
                  <rect x="40" y="35" width="220" height="12" rx="2" fill="#1e2535" stroke="#fb923c" strokeWidth="1"/>
                  {/* Засыпка */}
                  <line x1="40" y1="35" x2="260" y2="35" stroke="#facc15" strokeWidth="0.8" strokeDasharray="4 2"/>
                  <text x="150" y="32" textAnchor="middle" fill="#facc15" fontSize="6">h={cover}м</text>
                  <text x="150" y="44" textAnchor="middle" fill="#fb923c" fontSize="6">{name} · L={length}м</text>
                  {/* Порталы */}
                  <rect x="35" y="30" width="8" height="20" fill="#374151" stroke="#6b7280"/>
                  <rect x="257" y="30" width="8" height="20" fill="#374151" stroke="#6b7280"/>
                  <text x="39" y="58" textAnchor="middle" fill="#9ca3af" fontSize="5">Вход</text>
                  <text x="261" y="58" textAnchor="middle" fill="#9ca3af" fontSize="5">Выход</text>
                </svg>
              </div>
            )}
            {tab==="lining" && (
              <div className="space-y-3">
                <div className="rounded-lg border border-gray-700 p-3 text-[10px]" style={{background:"#111827"}}>
                  <div className="font-bold text-white mb-2">Состав обделки</div>
                  {[
                    {elem:"Первичная обделка",val:"Набрызгбетон 5 см + сетка",note:""},
                    {elem:"Гидроизоляция",val:"ПВХ-мембрана 2 мм",note:"ГОСТ 30547"},
                    {elem:"Основная обделка",val:lining+" · d=40 см",note:""},
                    {elem:"Лоток",val:"Монолитный ЖБ B30",note:""},
                    {elem:"Дорожная плита",val:"АБ тип II · 7 см",note:""},
                  ].map(e=>(
                    <div key={e.elem} className="flex items-center gap-2 py-1 border-b border-gray-800">
                      <span className="text-gray-400 w-36">{e.elem}</span>
                      <span className="text-white font-mono flex-1">{e.val}</span>
                      <span className="text-gray-600">{e.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab==="analysis" && (
              <div className="space-y-3">
                <div className="text-gray-400 text-[10px]">Нагрузки на обделку по ГОСТ Р 54257 / СП 122.13330</div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {[
                    {label:"Вертикальная нагрузка q",val:`${q.toFixed(1)} кПа`,color:"#ef4444"},
                    {label:"Горизонтальная нагрузка e",val:`${e.toFixed(1)} кПа`,color:"#f97316"},
                    {label:"Момент в своде M",val:`${M} кН·м/м`,color:"#facc15"},
                    {label:"Засыпка h",val:`${cover} м`,color:"#60a5fa"},
                    {label:"Площадь сечения",val:`${(Math.PI*W*H/4).toFixed(1)} м²`,color:"#4ade80"},
                    {label:"Периметр обделки",val:`${(Math.PI*(W+H)/2).toFixed(1)} м`,color:"#a78bfa"},
                  ].map(item=>(
                    <div key={item.label} className="rounded border border-gray-700 px-2 py-2" style={{background:"#111827"}}>
                      <div className="text-gray-500 text-[9px]">{item.label}</div>
                      <div className="font-mono font-bold text-[12px] mt-0.5" style={{color:item.color}}>{item.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="w-52 flex-shrink-0 border-l border-gray-800 p-3 flex flex-col items-center gap-3" style={{background:"#0a0e14"}}>
            <div className="text-[9px] text-gray-500 uppercase tracking-wide text-center">Поперечник тоннеля</div>
            <TunnelCrossSection/>
            <div className="text-[9px] text-center space-y-0.5">
              <div className="text-white font-semibold">{name}</div>
              <div className="text-gray-500">{shape}</div>
              <div className="text-[#fb923c] font-mono">L={length}м</div>
              <div className="text-[#60a5fa] font-mono">B={width}м · H={height}м</div>
              <div className="text-gray-500">{method}</div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-700 flex-shrink-0 bg-[#151214] rounded-b-xl">
          <div className="text-[10px] text-gray-500">q={q.toFixed(0)} кПа · M={M} кН·м/м</div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 rounded text-[11px]">Отмена</button>
            <button className="px-3 py-1.5 bg-[#1e2535] text-[#fb923c] border border-[#fb923c]/40 rounded text-[11px]">Экспорт IFC</button>
            <button onClick={()=>onOK({name})} className="px-4 py-1.5 bg-[#fb923c] text-[#0a0800] hover:bg-[#fdba74] rounded text-[11px] font-bold">✓ Создать тоннель</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Project Explorer (дерево объектов + фильтрация) ──────────────────────────
function ProjectExplorerPanel({ onClose, onOpen }: { onClose:()=>void; onOpen:(cmd:string)=>void }) {
  const [filter, setFilter] = useState("")
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["surfaces","alignments","corridors","networks"]))

  const tree = [
    {id:"surfaces",   icon:"Triangle",     color:"#4ade80",label:"Поверхности",children:[
      {id:"s1",icon:"Triangle",color:"#4ade80",label:"Существующая поверхность",info:"TIN · 1847 точек"},
      {id:"s2",icon:"Triangle",color:"#4ade80",label:"Проектная поверхность",info:"TIN · 342 точки"},
    ]},
    {id:"alignments", icon:"Route",        color:"#f97316",label:"Трассы",children:[
      {id:"a1",icon:"Route",color:"#f97316",label:"Трасса ШД-38",info:"L=2000м"},
      {id:"a2",icon:"Route",color:"#f97316",label:"Ул. Трумана",info:"L=850м"},
    ]},
    {id:"profiles",   icon:"TrendingUp",   color:"#60a5fa",label:"Профили",children:[
      {id:"p1",icon:"TrendingUp",color:"#60a5fa",label:"Профиль земли [ШД-38]",info:""},
      {id:"p2",icon:"TrendingUp",color:"#60a5fa",label:"Проект [ШД-38]",info:""},
    ]},
    {id:"corridors",  icon:"Navigation",   color:"#a78bfa",label:"Коридоры",children:[
      {id:"c1",icon:"Navigation",color:"#a78bfa",label:"Дорога и парковочная зона",info:""},
    ]},
    {id:"networks",   icon:"Network",      color:"#38bdf8",label:"Трубопроводные сети",children:[
      {id:"n1",icon:"Network",color:"#38bdf8",label:"Ливневая канализация",info:"12 труб, 8 колодцев"},
      {id:"n2",icon:"Network",color:"#38bdf8",label:"Водопровод Ø200",info:"L=1840м"},
    ]},
    {id:"points",     icon:"MapPin",       color:"#facc15",label:"Группы точек",children:[
      {id:"pt1",icon:"MapPin",color:"#facc15",label:"Существующие точки",info:"847 точек"},
      {id:"pt2",icon:"MapPin",color:"#facc15",label:"Тахеометрическая съёмка",info:"1200 точек"},
    ]},
    {id:"structures", icon:"Building2",    color:"#f87171",label:"Сооружения",children:[
      {id:"br1",icon:"Waves",color:"#60a5fa",label:"Мост ПК34+120",info:"3×33м, ЖБ"},
      {id:"tn1",icon:"Circle",color:"#fb923c",label:"Тоннель №1",info:"L=420м"},
    ]},
  ]

  const toggle = (id: string) => setExpanded(s=>{const n=new Set(s); if(n.has(id)) n.delete(id); else n.add(id); return n})
  const filterTree = (items: typeof tree) => items.filter(n=>!filter||(n.label.toLowerCase().includes(filter.toLowerCase())||(n.children||[]).some(c=>c.label.toLowerCase().includes(filter.toLowerCase()))))

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/60 flex items-end justify-start z-50 p-4" onClick={onClose}>
      <motion.div initial={{x:-30,opacity:0}} animate={{x:0,opacity:1}} exit={{x:-30,opacity:0}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-xl shadow-2xl flex flex-col"
        style={{width:320,maxHeight:"85vh"}} onClick={e=>e.stopPropagation()}>
        <div className="bg-[#0d1a2e] px-4 py-2.5 flex items-center justify-between border-b border-gray-700 rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon name="FolderTree" size={13} className="text-[#0078d4]" fallback="Folder"/>
            <span className="text-white font-bold text-[12px]">Project Explorer</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm">✕</button>
        </div>
        <div className="px-3 py-2 border-b border-gray-800 flex-shrink-0">
          <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Фильтр объектов..."
            className="w-full bg-[#252535] border border-gray-600 text-white text-[11px] px-2 py-1 rounded outline-none focus:border-[#0078d4] placeholder-gray-600"/>
        </div>
        <div className="flex-1 overflow-auto py-1 min-h-0">
          {filterTree(tree).map(node=>(
            <div key={node.id}>
              <button onClick={()=>toggle(node.id)}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#252535] transition-colors text-left">
                <Icon name={expanded.has(node.id)?"ChevronDown":"ChevronRight"} size={10} className="text-gray-600 flex-shrink-0" fallback="ChevronRight"/>
                <Icon name={node.icon} size={13} style={{color:node.color}} fallback="Folder"/>
                <span className="text-white text-[11px] font-semibold flex-1">{node.label}</span>
                <span className="text-[9px] text-gray-600">{node.children?.length}</span>
              </button>
              {expanded.has(node.id) && node.children?.filter(c=>!filter||c.label.toLowerCase().includes(filter.toLowerCase())).map(child=>(
                <button key={child.id} onClick={()=>onOpen(child.label)}
                  className="w-full flex items-center gap-2 px-3 py-1 pl-9 hover:bg-[#0078d4]/10 transition-colors text-left">
                  <Icon name={child.icon} size={11} style={{color:child.color}} fallback="Circle"/>
                  <span className="text-gray-300 text-[10px] flex-1 truncate">{child.label}</span>
                  {child.info && <span className="text-[9px] text-gray-600">{child.info}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="px-3 py-2 border-t border-gray-800 flex gap-2 flex-shrink-0">
          <button onClick={()=>onOpen("Поверхность")} className="flex-1 py-1 text-[10px] bg-[#0078d4]/20 text-[#60a5fa] border border-[#0078d4]/40 rounded hover:bg-[#0078d4]/30">+ Поверхность</button>
          <button onClick={()=>onOpen("Трасса")} className="flex-1 py-1 text-[10px] bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/30 rounded hover:bg-[#f97316]/20">+ Трасса</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// RAIL TRACK DESIGN + BRIDGE MODELER
// ═══════════════════════════════════════════════════════════════════════════

// ─── Rail Track Design ────────────────────────────────────────────────────────
function RailTrackDialog({ onClose, onOK }: { onClose: ()=>void; onOK: (d:{name:string})=>void }) {
  const [tab, setTab] = useState<"track"|"geometry"|"profile"|"structures"|"analysis">("track")
  const [name, setName] = useState("ЖД-путь 1")
  const [gauge, setGauge] = useState("1520")
  const [category, setCategory] = useState("Скоростная (160 км/ч)")
  const [speed, setSpeed] = useState("160")
  const [material, setMaterial] = useState("Бесстыковой путь (БП)")
  const [tieType, setTieType] = useState("Железобетонные шпалы")
  const [ballast, setBallast] = useState("Щебень гранитный")
  const [from, setFrom] = useState("Ст. Начальная")
  const [to, setTo] = useState("Ст. Конечная")
  const [length, setLength] = useState("12.4")
  // Геометрия
  const [minR, setMinR] = useState("1200")
  const [maxSlope, setMaxSlope] = useState("8")
  const [superEl, setSuperEl] = useState("100")
  const [cant, setCant] = useState("75")
  // Объекты на пути
  const [structures] = useState([
    {km:"ПК12+340",type:"Мост",name:"Мост через р. Ока",span:"3×48м",mat:"ЖБ"},
    {km:"ПК34+120",type:"Тоннель",name:"Тоннель №1",span:"L=420м",mat:"Монолитный бетон"},
    {km:"ПК56+780",type:"Путепровод",name:"Путепровод над а/д",span:"1×24м",mat:"Металл"},
    {km:"ПК78+900",type:"Труба",name:"Водопропускная труба",span:"Ø1.2м",mat:"ЖБ"},
  ])
  // Анализ пути
  const vMax = parseFloat(speed)||160
  const rMin = parseFloat(minR)||1200
  const iMax = parseFloat(maxSlope)||8
  const hCant = parseFloat(cant)||75
  // Проверки по СНиП 32-01-95
  const checks = [
    {label:"Мин. радиус кривой",val:`R = ${rMin} м`,ok:rMin>=(vMax<=120?400:vMax<=160?1200:2000),req:vMax<=120?"R ≥ 400 м":vMax<=160?"R ≥ 1200 м":"R ≥ 2000 м"},
    {label:"Макс. уклон",val:`i = ${iMax} ‰`,ok:iMax<=12,req:"i ≤ 12 ‰"},
    {label:"Возвышение рельса",val:`h = ${hCant} мм`,ok:hCant<=150,req:"h ≤ 150 мм"},
    {label:"Ширина колеи",val:`${gauge} мм`,ok:gauge==="1520"||gauge==="1435",req:"1520 мм (РФ)"},
    {label:"Балластный слой",val:`${ballast}`,ok:true,req:"Гравий или щебень"},
  ]

  // SVG план пути
  const TrackPlan = () => (
    <svg width="190" height="130" viewBox="0 0 190 130" style={{background:"#080e18",borderRadius:8,display:"block"}}>
      <rect width="190" height="130" fill="#1a2535"/>
      {/* Фон — поле */}
      <rect x="0" y="0" width="190" height="130" fill="#1e3a1e" opacity="0.3"/>
      {/* Насыпь */}
      <polygon points="10,80 30,60 160,60 180,80" fill="#2a3a2a" stroke="#374151" strokeWidth="0.5"/>
      {/* Балласт */}
      <polygon points="25,70 35,62 155,62 165,70" fill="#4b5563" stroke="#6b7280" strokeWidth="0.5"/>
      {/* Шпалы */}
      {Array.from({length:18},(_,i)=>(
        <rect key={i} x={28+i*8} y="62" width="4" height="8" rx="0.5" fill="#78350f" stroke="#92400e" strokeWidth="0.3"/>
      ))}
      {/* Рельсы */}
      <line x1="25" y1="64" x2="168" y2="64" stroke="#94a3b8" strokeWidth="2.5"/>
      <line x1="25" y1="68" x2="168" y2="68" stroke="#94a3b8" strokeWidth="2.5"/>
      {/* Кривая */}
      <path d="M 25,66 C 60,66 100,50 168,66" fill="none" stroke="rgba(96,165,250,0.4)" strokeWidth="1" strokeDasharray="4 2"/>
      {/* Объекты */}
      <rect x="80" y="56" width="20" height="16" rx="1" fill="#1e3a5f" stroke="#0078d4" strokeWidth="1"/>
      <text x="90" y="67" textAnchor="middle" fill="#60a5fa" fontSize="6">Мост</text>
      {/* Ст. начало */}
      <rect x="10" y="60" width="14" height="10" rx="1" fill="#1a2e1a" stroke="#4ade80" strokeWidth="1"/>
      <text x="17" y="68" textAnchor="middle" fill="#4ade80" fontSize="5">Ст.А</text>
      {/* Ст. конец */}
      <rect x="166" y="60" width="14" height="10" rx="1" fill="#1a2e1a" stroke="#4ade80" strokeWidth="1"/>
      <text x="173" y="68" textAnchor="middle" fill="#4ade80" fontSize="5">Ст.Б</text>
      {/* Размерные линии */}
      <line x1="25" y1="82" x2="168" y2="82" stroke="#f97316" strokeWidth="0.8"/>
      <text x="96" y="90" textAnchor="middle" fill="#f97316" fontSize="7">{length} км</text>
      {/* Легенда */}
      <text x="10" y="100" fill="#60a5fa" fontSize="6">{gauge} мм · {speed} км/ч</text>
      <text x="10" y="110" fill="#9ca3af" fontSize="6">{material.split(" ")[0]}</text>
    </svg>
  )

  // Продольный профиль пути
  const ProfileSVG = () => {
    const pts = Array.from({length:13},(_,i)=>({
      x:i*15+5, km:i,
      tz: 100+Math.sin(i*0.5)*8+Math.cos(i*0.3)*5,
      dz: 100+i*0.5+Math.sin(i*0.8)*3,
    }))
    const yzMin=92,yzMax=116, H=80
    const gy=(v:number)=>H-((v-yzMin)/(yzMax-yzMin))*H+5
    return (
      <svg width="190" height="105" viewBox="0 0 190 105" style={{background:"#080e18",borderRadius:8,display:"block"}}>
        <rect width="190" height="105" fill="#111827"/>
        {/* Сетка */}
        {[95,100,105,110,115].map(v=>(
          <g key={v}><line x1="5" y1={gy(v)} x2="185" y2={gy(v)} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
          <text x="3" y={gy(v)+2} textAnchor="end" fill="#4b5563" fontSize="5">{v}</text></g>
        ))}
        {/* Чёрный профиль */}
        <polyline points={pts.map(p=>`${p.x},${gy(p.tz)}`).join(" ")} fill="none" stroke="#4ade80" strokeWidth="1.5"/>
        {/* Красный профиль */}
        <polyline points={pts.map(p=>`${p.x},${gy(p.dz)}`).join(" ")} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5 2"/>
        {/* Насыпь/выемка fill */}
        {pts.slice(1).map((p,i)=>{
          const prev=pts[i]; const top=Math.min(gy(p.tz),gy(p.dz)); const bot=Math.max(gy(p.tz),gy(p.dz))
          const isFill=p.dz>p.tz
          return <rect key={i} x={prev.x} y={top} width={p.x-prev.x} height={Math.max(0,bot-top)} fill={isFill?"rgba(59,130,246,0.2)":"rgba(239,68,68,0.2)"}/>
        })}
        {/* Легенда */}
        <line x1="10" y1="97" x2="25" y2="97" stroke="#4ade80" strokeWidth="1.5"/>
        <text x="27" y="100" fill="#4ade80" fontSize="6">Рельеф</text>
        <line x1="60" y1="97" x2="75" y2="97" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 2"/>
        <text x="77" y="100" fill="#ef4444" fontSize="6">Проект</text>
        <rect x="115" y="93" width="8" height="5" fill="rgba(59,130,246,0.4)"/>
        <text x="125" y="100" fill="#60a5fa" fontSize="6">Насыпь</text>
        <rect x="155" y="93" width="8" height="5" fill="rgba(239,68,68,0.4)"/>
        <text x="165" y="100" fill="#f87171" fontSize="6">Выемка</text>
      </svg>
    )
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-xl shadow-2xl flex flex-col"
        style={{width:680,maxHeight:"92vh"}} onClick={e=>e.stopPropagation()}>

        <div className="bg-[#0a1a14] px-5 py-3 flex items-center justify-between border-b border-gray-700 rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon name="Train" size={15} className="text-[#4ade80]" fallback="Route"/>
            <span className="text-white font-bold text-[13px]">Rail Track Design — Проектирование ЖД-пути</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="flex border-b border-gray-700 bg-[#0d1a10] flex-shrink-0">
          {([["track","Путь"],["geometry","Геометрия"],["profile","Профиль"],["structures","Сооружения"],["analysis","Анализ"]] as const).map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`px-4 py-1.5 text-[10px] border-r border-gray-800 transition-colors ${tab===id?"bg-[#1a2e1a] text-white border-b-2 border-b-[#4ade80]":"text-gray-400 hover:bg-[#1a2e1a]"}`}>{lbl}</button>
          ))}
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="flex-1 overflow-auto p-4 text-[11px] min-h-0">

            {tab==="track" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ["Название пути",name,setName,"text"],
                    ["Длина, км",length,setLength,"number"],
                    ["Станция отправления",from,setFrom,"text"],
                    ["Станция назначения",to,setTo,"text"],
                  ] as [string,string,(v:string)=>void,string][]).map(([l,v,s,t])=>(
                    <label key={l} className="flex flex-col gap-1">
                      <span className="text-gray-500 text-[9px]">{l}</span>
                      <input type={t} value={v} onChange={e=>s(e.target.value)}
                        className="bg-[#1a2e1a] border border-gray-600 text-white px-2 py-1.5 rounded outline-none focus:border-[#4ade80] text-[11px]"/>
                    </label>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    ["Категория линии",category,setCategory,["Высокоскоростная (350 км/ч)","Скоростная (160 км/ч)","Пассажирская (140 км/ч)","Грузовая (90 км/ч)","Промышленная"]],
                    ["Ширина колеи, мм",gauge,setGauge,["1520","1435","1067","762"]],
                    ["Тип рельса",material,setMaterial,["Бесстыковой путь (БП)","Стыковой путь","Р65 на ЖБ шпалах","Р50 на дерев. шпалах"]],
                  ] as [string,string,(v:string)=>void,string[]][]).map(([l,v,s,opts])=>(
                    <label key={l} className="flex flex-col gap-1">
                      <span className="text-gray-500 text-[9px]">{l}</span>
                      <select value={v} onChange={e=>s(e.target.value)}
                        className="bg-[#1a2e1a] border border-gray-600 text-white px-2 py-1.5 rounded outline-none focus:border-[#4ade80] text-[10px]">
                        {opts.map(o=><option key={o}>{o}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ["Тип шпал",tieType,setTieType,["Железобетонные шпалы","Деревянные шпалы","Полимерные шпалы"]],
                    ["Балласт",ballast,setBallast,["Щебень гранитный","Щебень известняковый","Гравий","Асбест"]],
                  ] as [string,string,(v:string)=>void,string[]][]).map(([l,v,s,opts])=>(
                    <label key={l} className="flex flex-col gap-1">
                      <span className="text-gray-500 text-[9px]">{l}</span>
                      <select value={v} onChange={e=>s(e.target.value)}
                        className="bg-[#1a2e1a] border border-gray-600 text-white px-2 py-1.5 rounded outline-none focus:border-[#4ade80] text-[10px]">
                        {opts.map(o=><option key={o}>{o}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {tab==="geometry" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ["Расчётная скорость, км/ч",speed,setSpeed],
                    ["Мин. радиус кривой, м",minR,setMinR],
                    ["Макс. уклон, ‰",maxSlope,setMaxSlope],
                    ["Возвышение рельса h, мм",superEl,setSuperEl],
                    ["Непогашенное ускорение, мм/с²",cant,setCant],
                  ] as [string,string,(v:string)=>void][]).map(([l,v,s])=>(
                    <label key={l} className="flex flex-col gap-1">
                      <span className="text-gray-500 text-[9px]">{l}</span>
                      <input type="number" value={v} onChange={e=>s(e.target.value)}
                        className="bg-[#1a2e1a] border border-gray-600 text-white px-2 py-1.5 rounded outline-none focus:border-[#4ade80] font-mono"/>
                    </label>
                  ))}
                </div>
                <div className="rounded-lg border border-gray-700 p-3 text-[10px]" style={{background:"#0d1a10"}}>
                  <div className="font-bold text-white mb-2">Расчётные параметры (СНиП 32-01-95 / СП 119)</div>
                  {[
                    ["Длина переходной кривой","L = " + Math.round(parseFloat(superEl||"100")*vMax/23.6) + " м"],
                    ["Уклон отвода возвышения","Δh/L = " + (parseFloat(superEl||"100")/Math.round(parseFloat(superEl||"100")*vMax/23.6)*1000).toFixed(1) + " ‰"],
                    ["Макс. возвышение рельса (ф-ла)","h = " + Math.round(11.8*vMax**2/parseFloat(minR||"1200")) + " мм"],
                    ["Мин. длина прямой вставки","l = " + Math.round(vMax*3.6) + " м"],
                  ].map(([k,v])=>(
                    <div key={k} className="flex justify-between border-b border-gray-800 py-1">
                      <span className="text-gray-500">{k}</span>
                      <span className="text-[#4ade80] font-mono font-bold">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab==="profile" && (
              <div className="space-y-3">
                <div className="text-gray-400 text-[10px]">Продольный профиль пути · масштаб Г 1:10000 / В 1:1000</div>
                <ProfileSVG/>
                <div className="grid grid-cols-4 gap-2 text-[10px]">
                  {[
                    {label:"Общая длина",val:length+" км",color:"#4ade80"},
                    {label:"Мин. отметка",val:"98.4 м",color:"#60a5fa"},
                    {label:"Макс. отметка",val:"114.7 м",color:"#f97316"},
                    {label:"Макс. уклон",val:maxSlope+" ‰",color:parseFloat(maxSlope)<=12?"#4ade80":"#ef4444"},
                  ].map(s=>(
                    <div key={s.label} className="rounded border border-gray-700 px-2 py-1.5" style={{background:"#0d1a10"}}>
                      <div className="text-gray-500 text-[9px]">{s.label}</div>
                      <div className="font-mono font-bold" style={{color:s.color}}>{s.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab==="structures" && (
              <div className="space-y-2">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Искусственные сооружения на пути</span>
                  <button className="px-2 py-0.5 bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/40 rounded text-[9px]">+ Добавить</button>
                </div>
                {structures.map((s,i)=>{
                  const icons: Record<string,string> = {Мост:"Waves",Тоннель:"Circle",Путепровод:"ArrowUp",Труба:"Minus"}
                  const colors: Record<string,string> = {Мост:"#60a5fa",Тоннель:"#a855f7",Путепровод:"#f97316",Труба:"#4ade80"}
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-700 hover:bg-[#1a2e1a] transition-colors" style={{background:"#111827"}}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:(colors[s.type]||"#6b7280")+"20"}}>
                        <Icon name={icons[s.type]||"Minus"} size={18} style={{color:colors[s.type]||"#6b7280"}} fallback="Minus"/>
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold text-[11px]">{s.name}</div>
                        <div className="text-gray-500 text-[9px]">{s.km} · {s.span} · {s.mat}</div>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-full" style={{background:(colors[s.type]||"#6b7280")+"20",color:colors[s.type]||"#6b7280"}}>{s.type}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {tab==="analysis" && (
              <div className="space-y-4">
                <div className="text-gray-400 text-[10px]">Проверка по СНиП 32-01-95 / СП 119.13330</div>
                <div className="space-y-1.5">
                  {checks.map((c,i)=>(
                    <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg border ${c.ok?"border-green-700/40 bg-green-900/10":"border-red-700/40 bg-red-900/10"}`}>
                      <span className={`text-[14px] ${c.ok?"text-green-400":"text-red-400"}`}>{c.ok?"✓":"✗"}</span>
                      <div className="flex-1">
                        <div className="text-white text-[10px] font-semibold">{c.label}</div>
                        <div className="text-gray-500 text-[9px]">Требование: {c.req}</div>
                      </div>
                      <span className={`font-mono font-bold text-[10px] ${c.ok?"text-green-400":"text-red-400"}`}>{c.val}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-gray-700 p-3 text-[10px]" style={{background:"#0d1a10"}}>
                  <div className="text-white font-bold mb-2">Технико-экономические показатели</div>
                  {[
                    ["Протяжённость пути",length+" км"],
                    ["Кол-во объектов",structures.length+" шт."],
                    ["Земляное полотно (объём)","≈ "+Math.round(parseFloat(length)*1000*12*3.5/1000)+" тыс. м³"],
                    ["Балласт (объём)","≈ "+Math.round(parseFloat(length)*1000*3.5*0.45/1000)+" тыс. м³"],
                    ["Шпалы","≈ "+Math.round(parseFloat(length)*1000*1840)+" шт."],
                    ["Рельсы (масса)","≈ "+Math.round(parseFloat(length)*2*65)+" т · (2×Р65)"],
                  ].map(([k,v])=>(
                    <div key={k} className="flex justify-between border-b border-gray-800 py-1">
                      <span className="text-gray-500">{k}</span>
                      <span className="text-[#4ade80] font-mono">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Боковая панель */}
          <div className="w-52 flex-shrink-0 border-l border-gray-800 p-3 flex flex-col gap-3" style={{background:"#0a100a"}}>
            <div className="text-[9px] text-gray-500 uppercase tracking-wide text-center">Схема пути</div>
            <TrackPlan/>
            <div className="text-[9px] text-gray-500 uppercase tracking-wide text-center mt-1">Профиль</div>
            <ProfileSVG/>
            <div className="text-[9px] space-y-0.5 mt-1 text-center">
              <div className="text-white font-semibold">{name}</div>
              <div className="text-gray-500">{from} → {to}</div>
              <div className="text-[#4ade80] font-mono">{length} км · {speed} км/ч</div>
              <div className="text-gray-600">{gauge} мм · {tieType.split(" ")[0]}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-700 flex-shrink-0 bg-[#0a1a0a] rounded-b-xl">
          <div className="text-[10px] text-gray-500">
            {checks.filter(c=>c.ok).length}/{checks.length} проверок пройдено ·
            <span className={checks.every(c=>c.ok)?" text-green-400 font-bold":" text-red-400 font-bold"}>
              {checks.every(c=>c.ok)?" ✓ Норма":" ⚠ Замечания"}
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 hover:bg-[#3a3a4e] rounded text-[11px]">Отмена</button>
            <button className="px-3 py-1.5 bg-[#1a3a1a] text-[#4ade80] border border-[#4ade80]/40 hover:bg-[#1e4a1e] rounded text-[11px]">Экспорт DXF</button>
            <button onClick={()=>onOK({name})} className="px-4 py-1.5 bg-[#4ade80] text-[#0a1a0a] hover:bg-[#86efac] rounded text-[11px] font-bold">✓ Создать путь</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Bridge Modeler ────────────────────────────────────────────────────────────
function BridgeModelerDialog({ onClose, onOK }: { onClose: ()=>void; onOK: (d:{name:string})=>void }) {
  const [tab, setTab] = useState<"general"|"spans"|"cross"|"loads"|"output">("general")
  const [name, setName] = useState("Мост через р. Ока")
  const [bridgeType, setBridgeType] = useState("Балочный разрезной")
  const [material, setMaterial] = useState("Преднапряжённый ЖБ")
  const [spans, setSpans] = useState("3")
  const [spanLen, setSpanLen] = useState("33")
  const [width, setWidth] = useState("12.5")
  const [height, setHeight] = useState("4.2")
  const [deckType, setDeckType] = useState("Плитно-балочный")
  const [road, setRoad] = useState("Трасса ШД-38")
  const [class_, setClass_] = useState("А (автомобильный)")
  const [load, setLoad] = useState("АК-11")
  const [foundation, setFoundation] = useState("Свайный ростверк")

  const nSpans = parseInt(spans)||3
  const Ls = parseFloat(spanLen)||33
  const Ws = parseFloat(width)||12.5
  const Hs = parseFloat(height)||4.2
  const totalLen = (nSpans * Ls + (nSpans-1)*1.5 + 2*6).toFixed(1)

  // Нагрузки
  const G1 = Math.round(Ws * Ls * 0.25 * 25)   // кН/м² * ширина * длина * плотность
  const G2 = Math.round(Ws * Ls * 0.08 * 24)   // покрытие
  const Q1 = Math.round(Ws * Ls * 11.4)        // временная АК-11
  const Mtot = Math.round((G1+G2+Q1)*Ls/8)

  // Живая SVG-схема моста
  const BridgeSVG = () => {
    const W = 190, H = 100
    const scale = (nSpans*Ls<80) ? 2.0 : 140/(nSpans*Ls)
    const pLen = Ls*scale, bW = 8
    const yDeck = 30, yBot = 75, totalW = nSpans*pLen + (nSpans+1)*bW
    const startX = (W-totalW)/2
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{background:"#080e18",borderRadius:8,display:"block"}}>
        <rect width={W} height={H} fill="#0d1a2e"/>
        {/* Вода */}
        <path d={`M 0,${yBot+8} Q ${W/4},${yBot+4} ${W/2},${yBot+8} Q ${3*W/4},${yBot+12} ${W},${yBot+8} L ${W},${H} L 0,${H} Z`}
          fill="#1e3a5f" opacity="0.7"/>
        {/* Опоры */}
        {Array.from({length:nSpans+1},(_,i)=>{
          const x = startX + i*(pLen+bW)
          return <g key={i}>
            <rect x={x} y={yDeck} width={bW} height={yBot-yDeck} fill="#374151" stroke="#4b5563" strokeWidth="0.5"/>
            <rect x={x-4} y={yBot} width={bW+8} height={6} rx="1" fill="#4b5563"/>
          </g>
        })}
        {/* Пролётные строения */}
        {Array.from({length:nSpans},(_,i)=>{
          const x = startX + bW + i*(pLen+bW)
          return <g key={i}>
            <rect x={x} y={yDeck-Hs*scale*0.6} width={pLen} height={Hs*scale*0.6} rx="1" fill="#1e3a5f" stroke="#0078d4" strokeWidth="0.8"/>
            <rect x={x} y={yDeck-2} width={pLen} height={5} fill="#1e293b" stroke="#374151" strokeWidth="0.5"/>
            <text x={x+pLen/2} y={yDeck-Hs*scale*0.3+2} textAnchor="middle" fill="#60a5fa" fontSize="7">{Ls}м</text>
          </g>
        })}
        {/* Дорожное полотно */}
        <rect x={startX} y={yDeck-2} width={totalW} height={3} fill="#374151"/>
        {/* Тротуары */}
        <rect x={startX} y={yDeck-5} width={totalW} height={3} rx="0.5" fill="#1e293b" stroke="#0078d4" strokeWidth="0.5"/>
        {/* Подъезды */}
        <line x1="0" y1={yDeck+1} x2={startX} y2={yDeck+1} stroke="#4b5563" strokeWidth="2.5"/>
        <line x1={startX+totalW} y1={yDeck+1} x2={W} y2={yDeck+1} stroke="#4b5563" strokeWidth="2.5"/>
        {/* Размер */}
        <line x1={startX} y1={H-8} x2={startX+totalW} y2={H-8} stroke="#f97316" strokeWidth="0.8"/>
        <text x={(startX+startX+totalW)/2} y={H-2} textAnchor="middle" fill="#f97316" fontSize="7">{totalLen} м</text>
        {/* Нагрузка */}
        {Array.from({length:5},(_,i)=>(
          <line key={i} x1={startX+20+i*30} y1={yDeck-14} x2={startX+20+i*30} y2={yDeck-6}
            stroke="#facc15" strokeWidth="1.2" markerEnd="url(#arr2)"/>
        ))}
        <defs><marker id="arr2" markerWidth="4" markerHeight="4" refX="2" refY="4" orient="auto">
          <polygon points="0,0 4,0 2,4" fill="#facc15"/></marker></defs>
        <text x={W/2} y={yDeck-16} textAnchor="middle" fill="#facc15" fontSize="6">{load}</text>
      </svg>
    )
  }

  // Поперечное сечение
  const CrossSectionSVG = () => (
    <svg width="190" height="100" viewBox="-10 0 100 55" style={{background:"#080e18",borderRadius:8,display:"block"}}>
      <rect x="-10" y="0" width="110" height="55" fill="#0d1a2e"/>
      {/* Балки */}
      {[5,18,31,44,57,70].map(x=>(
        <g key={x}>
          <rect x={x} y="25" width="8" height="20" rx="1" fill="#1e3a5f" stroke="#0078d4" strokeWidth="0.6"/>
          <rect x={x-1} y="24" width="10" height="3" fill="#1e293b"/>
        </g>
      ))}
      {/* Плита */}
      <rect x="2" y="18" width="78" height="8" rx="1" fill="#253545" stroke="#374151" strokeWidth="0.5"/>
      {/* Покрытие */}
      <rect x="2" y="14" width="78" height="4" rx="0.5" fill="#374151"/>
      {/* Тротуары */}
      <rect x="0" y="12" width="12" height="6" rx="0.5" fill="#1e293b" stroke="#0078d4" strokeWidth="0.6"/>
      <rect x="70" y="12" width="12" height="6" rx="0.5" fill="#1e293b" stroke="#0078d4" strokeWidth="0.6"/>
      {/* Перила */}
      {[0,82].map(x=><line key={x} x1={x} y1="12" x2={x} y2="4" stroke="#6b7280" strokeWidth="1.5"/>)}
      <line x1="0" y1="4" x2="82" y2="4" stroke="#6b7280" strokeWidth="0.8"/>
      {/* Размеры */}
      <line x1="2" y1="50" x2="80" y2="50" stroke="#f97316" strokeWidth="0.5"/>
      <text x="41" y="54" textAnchor="middle" fill="#f97316" fontSize="5">B = {Ws} м</text>
    </svg>
  )

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-xl shadow-2xl flex flex-col"
        style={{width:700,maxHeight:"92vh"}} onClick={e=>e.stopPropagation()}>

        <div className="bg-[#0a1428] px-5 py-3 flex items-center justify-between border-b border-gray-700 rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon name="Waves" size={15} className="text-[#60a5fa]" fallback="Minus"/>
            <span className="text-white font-bold text-[13px]">Проектирование моста</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="flex border-b border-gray-700 bg-[#0d1520] flex-shrink-0">
          {([["general","Общие"],["spans","Пролёты"],["cross","Поперечник"],["loads","Нагрузки"],["output","Вывод"]] as const).map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`px-4 py-1.5 text-[10px] border-r border-gray-800 transition-colors ${tab===id?"bg-[#1e2a3e] text-white border-b-2 border-b-[#60a5fa]":"text-gray-400 hover:bg-[#1e2a3e]"}`}>{lbl}</button>
          ))}
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="flex-1 overflow-auto p-4 text-[11px] min-h-0">

            {tab==="general" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ["Название сооружения",name,setName,"text"],
                    ["Трасса / дорога",road,setRoad,"text"],
                  ] as [string,string,(v:string)=>void,string][]).map(([l,v,s,t])=>(
                    <label key={l} className="flex flex-col gap-1">
                      <span className="text-gray-500 text-[9px]">{l}</span>
                      <input type={t} value={v} onChange={e=>s(e.target.value)}
                        className="bg-[#1e2a3e] border border-gray-600 text-white px-2 py-1.5 rounded outline-none focus:border-[#60a5fa]"/>
                    </label>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    ["Тип моста",bridgeType,setBridgeType,["Балочный разрезной","Балочный неразрезной","Рамный","Арочный","Вантовый","Висячий","Трубчатый (ГОСТ 26633)"]],
                    ["Материал",material,setMaterial,["Преднапряжённый ЖБ","Монолитный ЖБ","Сталежелезобетон","Металл (сталь)","Дерево (клей-брус)"]],
                    ["Фундамент",foundation,setFoundation,["Свайный ростверк","Монолитный ленточный","Опускной колодец","Буровые опоры","Плитный"]],
                  ] as [string,string,(v:string)=>void,string[]][]).map(([l,v,s,opts])=>(
                    <label key={l} className="flex flex-col gap-1">
                      <span className="text-gray-500 text-[9px]">{l}</span>
                      <select value={v} onChange={e=>s(e.target.value)}
                        className="bg-[#1e2a3e] border border-gray-600 text-white px-2 py-1.5 rounded outline-none focus:border-[#60a5fa] text-[10px]">
                        {opts.map(o=><option key={o}>{o}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
                <div className="rounded-lg border border-gray-700 p-3 text-[10px]" style={{background:"#0d1520"}}>
                  <div className="font-bold text-white mb-2">Основные размеры</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[["Полная длина",totalLen+" м"],["Ширина",Ws+" м"],["Строительная высота",Hs+" м"],["Пролётов",spans+" шт."],["Класс",class_]].map(([k,v])=>(
                      <div key={k} className="flex justify-between border-b border-gray-800 py-1">
                        <span className="text-gray-500">{k}</span><span className="text-[#60a5fa] font-mono font-bold">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab==="spans" && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {([
                    ["Количество пролётов",spans,setSpans],
                    ["Длина пролёта, м",spanLen,setSpanLen],
                    ["Строительная высота, м",height,setHeight],
                  ] as [string,string,(v:string)=>void][]).map(([l,v,s])=>(
                    <label key={l} className="flex flex-col gap-1">
                      <span className="text-gray-500 text-[9px]">{l}</span>
                      <input type="number" value={v} onChange={e=>s(e.target.value)}
                        className="bg-[#1e2a3e] border border-gray-600 text-white px-2 py-1.5 rounded outline-none focus:border-[#60a5fa] font-mono"/>
                    </label>
                  ))}
                </div>
                <div className="rounded-lg border border-gray-700 overflow-hidden text-[10px]" style={{background:"#0d1520"}}>
                  <div className="px-3 py-2 border-b border-gray-800 font-bold text-white">Схема пролётов</div>
                  <table className="w-full border-collapse">
                    <thead><tr className="bg-[#111827]">{["№","Тип","Длина, м","Тип балки","Опоры"].map(h=><th key={h} className="px-2 py-1 text-gray-400 border border-gray-800 text-left font-normal">{h}</th>)}</tr></thead>
                    <tbody>{Array.from({length:nSpans},(_,i)=>(
                      <tr key={i} className="hover:bg-[#1e2a3e]">
                        <td className="px-2 py-1 border border-gray-800 text-[#60a5fa] font-mono">{i+1}</td>
                        <td className="px-2 py-1 border border-gray-800 text-white">{bridgeType.split(" ")[0]}</td>
                        <td className="px-2 py-1 border border-gray-800 text-gray-300 font-mono">{spanLen}</td>
                        <td className="px-2 py-1 border border-gray-800 text-gray-400">{deckType}</td>
                        <td className="px-2 py-1 border border-gray-800 text-gray-500">П{i+1}–П{i+2}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            )}

            {tab==="cross" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ["Полная ширина, м",width,setWidth],
                    ["Тип поперечника",deckType,setDeckType],
                  ] as [string,string,(v:string)=>void][]).map(([l,v,s])=>(
                    <label key={l} className="flex flex-col gap-1">
                      <span className="text-gray-500 text-[9px]">{l}</span>
                      {l.includes("Тип")
                        ? <select value={v} onChange={e=>s(e.target.value)} className="bg-[#1e2a3e] border border-gray-600 text-white px-2 py-1.5 rounded outline-none text-[10px]">
                            {["Плитно-балочный","Коробчатый","Т-образный","П-образный"].map(o=><option key={o}>{o}</option>)}
                          </select>
                        : <input type="number" value={v} onChange={e=>s(e.target.value)} className="bg-[#1e2a3e] border border-gray-600 text-white px-2 py-1.5 rounded outline-none font-mono"/>
                      }
                    </label>
                  ))}
                </div>
                <div className="rounded-lg border border-gray-700 p-3" style={{background:"#0d1520"}}>
                  <div className="text-[10px] font-bold text-white mb-2">Состав поперечника</div>
                  {[
                    {elem:"Проезжая часть",val:`${(Ws-2.5).toFixed(1)} м`,note:"2 полосы по 3.75 м + уширения"},
                    {elem:"Тротуары",val:"2 × 1.25 м",note:"Пешеходные зоны"},
                    {elem:"Перила/ограждение",val:"2 × 0.25 м",note:"ГОСТ 23457"},
                    {elem:"Гидроизоляция",val:"ПО-1М, 5 мм",note:"Полимерная обмазочная"},
                    {elem:"Покрытие",val:"АБ III тип, 7 см",note:"СП 78.13330"},
                  ].map(e=>(
                    <div key={e.elem} className="flex items-center gap-2 py-1 border-b border-gray-800 text-[10px]">
                      <span className="text-white w-36">{e.elem}:</span>
                      <span className="text-[#60a5fa] font-mono w-24">{e.val}</span>
                      <span className="text-gray-600">{e.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab==="loads" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ["Класс моста",class_,setClass_,["А (автомобильный)","Б (автодорожный)","В (городской)","Ж/д нагрузка С14","Ж/д нагрузка С11"]],
                    ["Временная нагрузка",load,setLoad,["АК-11","АК-14","АК-10","Н-18","Н-30","НГ-60"]],
                  ] as [string,string,(v:string)=>void,string[]][]).map(([l,v,s,opts])=>(
                    <label key={l} className="flex flex-col gap-1">
                      <span className="text-gray-500 text-[9px]">{l}</span>
                      <select value={v} onChange={e=>s(e.target.value)} className="bg-[#1e2a3e] border border-gray-600 text-white px-2 py-1.5 rounded outline-none text-[10px]">
                        {opts.map(o=><option key={o}>{o}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
                <div className="rounded-lg border border-gray-700 p-3" style={{background:"#0d1520"}}>
                  <div className="text-[10px] font-bold text-white mb-2">Расчёт нагрузок (один пролёт {spanLen}м)</div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    {[
                      {label:"Постоянная G1 (конструкция)",val:`${G1} кН`,color:"#60a5fa"},
                      {label:"Постоянная G2 (покрытие)",val:`${G2} кН`,color:"#60a5fa"},
                      {label:"Временная Q1 (АК-нагр.)",val:`${Q1} кН`,color:"#f97316"},
                      {label:"Итого на пролёт",val:`${G1+G2+Q1} кН`,color:"#facc15"},
                      {label:"Расчётный момент M",val:`${Mtot} кН·м`,color:"#ef4444"},
                      {label:"Прогиб (f/L ≤ 1/600)","val":`≤ ${(Ls*1000/600).toFixed(0)} мм`,color:"#4ade80"},
                    ].map(item=>(
                      <div key={item.label} className="rounded border border-gray-700 px-2 py-2" style={{background:"#111827"}}>
                        <div className="text-gray-500 text-[9px]">{item.label}</div>
                        <div className="font-mono font-bold text-[12px] mt-0.5" style={{color:item.color}}>{item.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab==="output" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {fmt:"DXF",icon:"PencilRuler",desc:"Чертёж моста AutoCAD",color:"#0078d4"},
                    {fmt:"IFC",icon:"Building2",desc:"BIM-модель (IFC 2x3)",color:"#7c3aed"},
                    {fmt:"LandXML",icon:"Code2",desc:"Геометрия для Лапа",color:"#059669"},
                    {fmt:"PDF",icon:"FileText",desc:"Схема для согласования",color:"#ef4444"},
                    {fmt:"Ведомость",icon:"ClipboardList",desc:"Объёмы работ + спецификация",color:"#d97706"},
                    {fmt:"Пояснит. записка",icon:"FileText",desc:"Техническое описание",color:"#6366f1"},
                  ].map(f=>(
                    <button key={f.fmt} onClick={()=>onOK({name})}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-700 hover:border-[#60a5fa] hover:bg-[#1e2a3e] transition-all text-left">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:f.color+"20"}}>
                        <Icon name={f.icon} size={16} style={{color:f.color}} fallback="Download"/>
                      </div>
                      <div><div className="text-white font-bold text-[11px]">{f.fmt}</div>
                      <div className="text-gray-500 text-[9px]">{f.desc}</div></div>
                    </button>
                  ))}
                </div>
                <div className="rounded-lg border border-gray-700 p-3" style={{background:"#0d1520"}}>
                  <div className="text-[10px] font-bold text-white mb-2">Технико-экономические показатели</div>
                  <div className="text-[9px] text-gray-400 font-mono whitespace-pre">{
                    `МОСТ: ${name}\n` +
                    `Тип: ${bridgeType} · ${material}\n` +
                    `Полная длина: ${totalLen} м\n` +
                    `Ширина: ${Ws} м\n` +
                    `Схема: ${spans}×${spanLen} м\n` +
                    `Нагрузка: ${load} · ${class_}\n` +
                    `Фундамент: ${foundation}\n` +
                    `Расч. момент: ${Mtot} кН·м`
                  }</div>
                </div>
              </div>
            )}
          </div>

          {/* Боковая панель */}
          <div className="w-52 flex-shrink-0 border-l border-gray-800 p-3 flex flex-col gap-3" style={{background:"#0a1020"}}>
            <div className="text-[9px] text-gray-500 uppercase tracking-wide text-center">Схема моста</div>
            <BridgeSVG/>
            <div className="text-[9px] text-gray-500 uppercase tracking-wide text-center">Поперечник</div>
            <CrossSectionSVG/>
            <div className="text-[9px] space-y-0.5 mt-1 text-center">
              <div className="text-white font-semibold">{name}</div>
              <div className="text-gray-500">{bridgeType}</div>
              <div className="text-[#60a5fa] font-mono">{totalLen} м · {spans}×{spanLen}</div>
              <div className="text-gray-500">{material}</div>
              <div className="text-[#facc15] font-mono">{load}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-700 flex-shrink-0 bg-[#0a1020] rounded-b-xl">
          <div className="text-[10px] text-gray-500">
            Полная длина: <span className="text-[#60a5fa] font-bold">{totalLen} м</span>
            &nbsp;·&nbsp;M = <span className="text-[#ef4444] font-bold">{Mtot} кН·м</span>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 hover:bg-[#3a3a4e] rounded text-[11px]">Отмена</button>
            <button className="px-3 py-1.5 bg-[#1e2a3e] text-[#60a5fa] border border-[#60a5fa]/40 hover:bg-[#253545] rounded text-[11px]">Экспорт IFC</button>
            <button onClick={()=>onOK({name})} className="px-4 py-1.5 bg-[#60a5fa] text-[#0a1020] hover:bg-[#93c5fd] rounded text-[11px] font-bold">✓ Создать мост</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERSECTION WIZARD + ROUNDABOUT DESIGNER
// ═══════════════════════════════════════════════════════════════════════════

// ─── Intersection Wizard ──────────────────────────────────────────────────────
function IntersectionWizardDialog({ onClose, onOK }: { onClose: ()=>void; onOK: (d:{name:string;type:string})=>void }) {
  const [step, setStep] = useState(1)
  const [intType, setIntType] = useState("Т-образное")
  const [mainRoad, setMainRoad] = useState("Трасса ШД-38")
  const [secRoad, setSecRoad] = useState("Ул. Трумана")
  const [curb, setCurb] = useState("15")
  const [island, setIsland] = useState(false)
  const [channelize, setChannelize] = useState(false)
  const [turnLanes, setTurnLanes] = useState({left:true,right:true,thru:true})
  const [curbR, setCurbR] = useState("8")
  const [name, setName] = useState("Пересечение-1")
  const [angle, setAngle] = useState("90")
  const [skew, setSkew] = useState(false)

  const TYPES = [
    {id:"Т-образное",    label:"T-пересечение",   icon:"⊥", desc:"Главная дорога + 1 примыкание"},
    {id:"Крестообразное",label:"X-пересечение",   icon:"✚", desc:"Главная + 1 пересекающая дорога"},
    {id:"Y-образное",   label:"Y-пересечение",   icon:"⋎", desc:"Вилкообразное, под острым углом"},
    {id:"Многолучевое", label:"Многолучевое",     icon:"✳", desc:"5+ направлений (сложное)"},
  ]

  const totalSteps = 4

  // SVG предпросмотр пересечения
  const IntersectionPreview = () => {
    const isT = intType === "Т-образное"
    const isY = intType === "Y-образное"
    const ang = parseFloat(angle) || 90
    const rad = (ang * Math.PI) / 180
    return (
      <svg width="180" height="180" viewBox="-90 -90 180 180" style={{background:"#080e18",borderRadius:8}}>
        {/* Земля */}
        <rect x="-90" y="-90" width="180" height="180" fill="#1a2535"/>
        {/* Главная дорога (горизонтальная) */}
        <rect x="-90" y="-14" width="180" height="28" fill="#2a3045" stroke="#374151" strokeWidth="0.5"/>
        {/* Осевая разметка главной */}
        {[-60,-40,-20,20,40,60].map(x=><line key={x} x1={x} y1="0" x2={x+10} y2="0" stroke="#facc15" strokeWidth="1.5" strokeDasharray="8 4"/>)}
        {/* Второстепенная */}
        {!isT && <rect x="-14" y="-90" width="28" height="180" fill="#2a3045" stroke="#374151" strokeWidth="0.5"/>}
        {isT && <rect x="-14" y="-90" width="28" height="90" fill="#2a3045" stroke="#374151" strokeWidth="0.5"/>}
        {isY && <g transform={`rotate(${180-ang})`}><rect x="-14" y="-90" width="28" height="90" fill="#2a3045" stroke="#374151" strokeWidth="0.5"/></g>}
        {/* Бордюр радиус */}
        {[[-1,-1],[1,-1],[1,1],[-1,1]].map(([sx,sy],i)=>(
          (!isT || sy > 0) && (
            <path key={i}
              d={`M ${sx*14} ${sy*14} Q ${sx*(14+parseFloat(curbR||"8")/2)} ${sy*(14+parseFloat(curbR||"8")/2)} ${sx*(14+parseFloat(curbR||"8"))} ${sy*14}`}
              fill="none" stroke="#6b7280" strokeWidth="2"/>
          )
        ))}
        {/* Островок безопасности */}
        {island && <ellipse cx="0" cy="0" rx="8" ry="8" fill="#374151" stroke="#4ade80" strokeWidth="1.5"/>}
        {/* Полоса поворота налево */}
        {turnLanes.left && <rect x="-45" y="-22" width="20" height="8" fill="#0078d4" opacity="0.5" rx="1"/>}
        {/* Направление */}
        <text x="-82" y="4" fill="#60a5fa" fontSize="8" fontFamily="mono">Гл.</text>
        <text x="-6" y="-78" fill="#f97316" fontSize="8" fontFamily="mono">{isT?"Пр.":"2-я"}</text>
        {/* Угол */}
        {!isT && <text x="20" y="-20" fill="#facc15" fontSize="7">{angle}°</text>}
        <circle cx="0" cy="0" r="3" fill="#ef4444"/>
      </svg>
    )
  }

  const steps = ["Тип","Геометрия","Полосы","Итог"]

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-xl shadow-2xl flex flex-col"
        style={{width:640,maxHeight:"90vh"}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div className="bg-[#0d1a2e] px-5 py-3 flex items-center justify-between border-b border-gray-700 rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon name="Crosshair" size={15} className="text-[#f97316]"/>
            <span className="text-white font-bold text-[13px]">Intersection Wizard — Мастер пересечений</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {/* Шаги */}
        <div className="flex border-b border-gray-800 bg-[#131320] flex-shrink-0 px-4 py-2 gap-2">
          {steps.map((s,i)=>(
            <button key={s} onClick={()=>setStep(i+1)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] transition-all ${step===i+1?"bg-[#f97316] text-white font-bold":step>i+1?"text-green-400 bg-green-900/20":"text-gray-500"}`}
              style={{background:step===i+1?"#f97316":step>i+1?"rgba(74,222,128,0.1)":undefined,color:step===i+1?"white":step>i+1?"#4ade80":undefined}}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${step===i+1?"bg-white text-[#f97316]":step>i+1?"bg-green-500 text-white":"bg-gray-700 text-gray-400"}`}>{step>i+1?"✓":i+1}</span>
              {s}
            </button>
          ))}
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Контент */}
          <div className="flex-1 overflow-auto p-5 text-[11px]">
            {step===1 && (
              <div className="space-y-4">
                <div className="text-gray-400 mb-3">Выберите тип пересечения</div>
                <div className="grid grid-cols-2 gap-3">
                  {TYPES.map(t=>(
                    <button key={t.id} onClick={()=>setIntType(t.id)}
                      className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] ${intType===t.id?"border-[#f97316] bg-[#f97316]/10":"border-gray-700 hover:border-gray-500"}`}
                      style={{background:intType===t.id?undefined:"#111827"}}>
                      <div className="text-[22px] mb-1">{t.icon}</div>
                      <div className={`font-bold text-[12px] ${intType===t.id?"text-[#f97316]":"text-white"}`}>{t.label}</div>
                      <div className="text-gray-500 text-[10px] mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-gray-500">Главная дорога</span>
                    <select value={mainRoad} onChange={e=>setMainRoad(e.target.value)}
                      className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded outline-none focus:border-[#f97316]">
                      <option>Трасса ШД-38</option><option>Ул. Трумана</option><option>Ул. Северная</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-gray-500">Второстепенная дорога</span>
                    <select value={secRoad} onChange={e=>setSecRoad(e.target.value)}
                      className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded outline-none focus:border-[#f97316]">
                      <option>Ул. Трумана</option><option>Трасса ШД-38</option><option>Ул. Западная</option>
                    </select>
                  </label>
                </div>
              </div>
            )}
            {step===2 && (
              <div className="space-y-4">
                <div className="text-gray-400">Геометрические параметры</div>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ["Название пересечения", name, setName, "text"],
                    ["Угол пересечения, °", angle, setAngle, "number"],
                    ["Радиус бордюра, м", curbR, setCurbR, "number"],
                    ["Ширина проезда пр.ч., м", curb, setCurb, "number"],
                  ] as [string,string,(v:string)=>void,string][]).map(([lbl,val,set,tp])=>(
                    <label key={lbl} className="flex flex-col gap-1">
                      <span className="text-gray-500">{lbl}</span>
                      <input type={tp} value={val} onChange={e=>set(e.target.value)}
                        className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded outline-none focus:border-[#f97316] font-mono"/>
                    </label>
                  ))}
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={skew} onChange={e=>setSkew(e.target.checked)} className="accent-[#f97316]"/>
                    <span className="text-gray-300">Косое пересечение</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={island} onChange={e=>setIsland(e.target.checked)} className="accent-[#f97316]"/>
                    <span className="text-gray-300">Островок безопасности</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={channelize} onChange={e=>setChannelize(e.target.checked)} className="accent-[#f97316]"/>
                    <span className="text-gray-300">Канализирование</span>
                  </label>
                </div>
              </div>
            )}
            {step===3 && (
              <div className="space-y-4">
                <div className="text-gray-400">Полосы движения</div>
                <div className="rounded-xl border border-gray-700 p-4 space-y-3" style={{background:"#111827"}}>
                  {[
                    {key:"left" as const,label:"Полоса левого поворота",color:"#60a5fa"},
                    {key:"right" as const,label:"Полоса правого поворота",color:"#4ade80"},
                    {key:"thru" as const,label:"Полоса прямо",color:"#f97316"},
                  ].map(l=>(
                    <div key={l.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-700 hover:bg-[#252535]">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded" style={{background:l.color+"40",border:`2px solid ${l.color}`}}/>
                        <span className="text-white">{l.label}</span>
                      </div>
                      <button onClick={()=>setTurnLanes(p=>({...p,[l.key]:!p[l.key]}))}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold transition-colors ${turnLanes[l.key]?"text-white":"text-gray-500 bg-gray-800"}`}
                        style={{background:turnLanes[l.key]?l.color:undefined}}>
                        {turnLanes[l.key]?"Включена":"Выключена"}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-gray-700 p-3 text-[10px]" style={{background:"#111827"}}>
                  <div className="text-gray-400 font-bold mb-2">Нормативы (СП 34.13330.2022)</div>
                  {[
                    ["Мин. радиус бордюра","R = 8 м (дорога IV кат.)"],
                    ["Полоса накопления","L = 50–150 м"],
                    ["Уклон в зоне перекрёстка","i ≤ 2% (СП 34 п.7.12)"],
                    ["Угол пересечения","70°–110° (оптим. 90°)"],
                  ].map(([k,v])=>(
                    <div key={k} className="flex justify-between border-b border-gray-800 py-1">
                      <span className="text-gray-500">{k}</span>
                      <span className="text-white font-mono">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {step===4 && (
              <div className="space-y-4">
                <div className="text-gray-400">Сводка параметров</div>
                <div className="rounded-xl border border-gray-700 p-4" style={{background:"#111827"}}>
                  {[
                    ["Название",name],["Тип",intType],
                    ["Главная дорога",mainRoad],["Второстепенная",secRoad],
                    ["Угол",`${angle}°`],["Радиус бордюра",`${curbR} м`],
                    ["Полосы",Object.entries(turnLanes).filter(([,v])=>v).map(([k])=>k==="left"?"Лев.":k==="right"?"Прав.":"Прямо").join(", ")],
                    ["Островок",island?"Да":"Нет"],["Канализирование",channelize?"Да":"Нет"],
                  ].map(([k,v])=>(
                    <div key={k} className="flex justify-between border-b border-gray-800 py-1.5 text-[11px]">
                      <span className="text-gray-500">{k}</span>
                      <span className="text-white font-semibold">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-green-700/40 bg-green-900/10 p-3 text-[10px] text-green-400">
                  ✓ Параметры соответствуют СП 34.13330.2022. Пересечение готово к созданию.
                </div>
              </div>
            )}
          </div>

          {/* Превью */}
          <div className="w-52 flex-shrink-0 border-l border-gray-800 p-4 flex flex-col items-center gap-3" style={{background:"#0d1117"}}>
            <div className="text-[9px] text-gray-500 uppercase tracking-wide">Предпросмотр</div>
            <IntersectionPreview/>
            <div className="text-center text-[9px] text-gray-500 space-y-0.5">
              <div className="text-white font-semibold text-[10px]">{intType}</div>
              <div>{mainRoad}</div>
              <div className="text-gray-600">×</div>
              <div>{secRoad}</div>
              <div className="text-[#f97316]">R = {curbR} м</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-700 flex-shrink-0 bg-[#111827] rounded-b-xl">
          <div className="text-[10px] text-gray-500">Шаг {step} из {totalSteps}</div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 hover:bg-[#3a3a4e] rounded text-[11px]">Отмена</button>
            {step > 1 && <button onClick={()=>setStep(s=>s-1)} className="px-3 py-1.5 bg-[#252535] text-gray-300 hover:bg-[#353545] rounded text-[11px]">← Назад</button>}
            {step < totalSteps
              ? <button onClick={()=>setStep(s=>s+1)} className="px-4 py-1.5 bg-[#f97316] text-white hover:bg-[#ea6c00] rounded text-[11px] font-semibold">Далее →</button>
              : <button onClick={()=>onOK({name,type:intType})} className="px-4 py-1.5 bg-[#f97316] text-white hover:bg-[#ea6c00] rounded text-[11px] font-semibold">✓ Создать</button>
            }
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Roundabout Designer ───────────────────────────────────────────────────────
function RoundaboutDialog({ onClose, onOK }: { onClose: ()=>void; onOK: (d:{name:string;R:number})=>void }) {
  const [tab, setTab] = useState<"geometry"|"lanes"|"analysis"|"output">("geometry")
  const [name, setName] = useState("Кольцо-1")
  const [R, setR] = useState("25")
  const [Rinner, setRinner] = useState("7")
  const [approach, setApproach] = useState("4")
  const [entryW, setEntryW] = useState("4.5")
  const [circW, setCircW] = useState("7")
  const [circleLanes, setCircleLanes] = useState("1")
  const [entryLanes, setEntryLanes] = useState("1")
  const [category, setCategory] = useState("Категория В")

  const Ro = parseFloat(R)||25
  const Ri = parseFloat(Rinner)||7
  const nArms = parseInt(approach)||4
  const cw = parseFloat(circW)||7

  // Пропускная способность по методу HCM
  const entryFlow = 800  // авт/ч (примерный)
  const circFlow = 600
  const capacity = Math.round(1130 * Math.exp(-0.001 * circFlow))
  const v2c = (entryFlow / capacity * 100).toFixed(0)
  const delay = (3600/capacity * entryFlow + 900 * 0.25 * ((entryFlow/capacity - 1) + Math.sqrt((entryFlow/capacity-1)**2 + 3600/(capacity*300) * entryFlow/capacity))).toFixed(1)
  const los = parseFloat(v2c) < 50 ? "A" : parseFloat(v2c) < 70 ? "B" : parseFloat(v2c) < 85 ? "C" : parseFloat(v2c) < 100 ? "D" : "F"

  // SVG кольцо
  const RoundaboutSVG = () => {
    const cx = 90, cy = 90, scale = 60 / Ro
    const rOuter = Ro * scale
    const rInner = Ri * scale
    const rCircle = (Ri + cw) * scale
    const arms = Array.from({length:nArms},(_,i)=>({angle:(i/nArms)*360-90}))
    return (
      <svg width="180" height="180" viewBox="0 0 180 180" style={{background:"#080e18",borderRadius:8}}>
        <rect width="180" height="180" fill="#1a2535"/>
        {/* Подъезды */}
        {arms.map((a,i)=>{
          const rad = a.angle * Math.PI / 180
          const x1 = cx + Math.cos(rad)*rOuter, y1 = cy + Math.sin(rad)*rOuter
          const x2 = cx + Math.cos(rad)*90, y2 = cy + Math.sin(rad)*90
          const pw = 12
          const px = -Math.sin(rad)*pw/2, py = Math.cos(rad)*pw/2
          return (
            <g key={i}>
              <polygon points={`${x1+px},${y1+py} ${x2+px},${y2+py} ${x2-px},${y2-py} ${x1-px},${y1-py}`}
                fill="#2a3045" stroke="#374151" strokeWidth="0.5"/>
              <text x={cx+Math.cos(rad)*82} y={cy+Math.sin(rad)*82} textAnchor="middle" dominantBaseline="middle"
                fill="#9ca3af" fontSize="8" fontFamily="mono">{i+1}</text>
            </g>
          )
        })}
        {/* Проезжая часть кольца */}
        <circle cx={cx} cy={cy} r={rCircle} fill="#2a3045" stroke="#374151" strokeWidth="0.5"/>
        {/* Центральный островок */}
        <circle cx={cx} cy={cy} r={rInner} fill="#374151" stroke="#4b5563" strokeWidth="1"/>
        {/* Разметка кольца */}
        {Array.from({length:24},(_,i)=>{
          const a = (i/24)*Math.PI*2
          const x1 = cx+Math.cos(a)*(rInner+2), y1 = cy+Math.sin(a)*(rInner+2)
          const x2 = cx+Math.cos(a)*(rCircle-2), y2 = cy+Math.sin(a)*(rCircle-2)
          return i%3===0 ? <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(250,204,21,0.3)" strokeWidth="0.8"/> : null
        })}
        {/* Стрелка движения */}
        <path d={`M ${cx+rInner+4} ${cy} A ${rInner+4} ${rInner+4} 0 0 1 ${cx} ${cy-rInner-4}`}
          fill="none" stroke="#60a5fa" strokeWidth="1.5" markerEnd="url(#arr)"/>
        <defs><marker id="arr" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
          <polygon points="0,0 4,2 0,4" fill="#60a5fa"/>
        </marker></defs>
        {/* Размер */}
        <line x1={cx} y1={cy} x2={cx+rOuter} y2={cy} stroke="#f97316" strokeWidth="0.8" strokeDasharray="3 2"/>
        <text x={cx+rOuter/2} y={cy-4} textAnchor="middle" fill="#f97316" fontSize="7">R={R}м</text>
      </svg>
    )
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-xl shadow-2xl flex flex-col"
        style={{width:660,maxHeight:"90vh"}} onClick={e=>e.stopPropagation()}>

        <div className="bg-[#0d1a2e] px-5 py-3 flex items-center justify-between border-b border-gray-700 rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon name="RotateCw" size={15} className="text-[#60a5fa]" fallback="RefreshCw"/>
            <span className="text-white font-bold text-[13px]">Roundabout Designer — Кольцевое пересечение</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="flex border-b border-gray-700 bg-[#151525] flex-shrink-0">
          {([["geometry","Геометрия"],["lanes","Полосы"],["analysis","Пропускная способность"],["output","Вывод"]] as const).map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`px-4 py-1.5 text-[10px] border-r border-gray-800 transition-colors ${tab===id?"bg-[#252535] text-white border-b-2 border-b-[#60a5fa]":"text-gray-400 hover:bg-[#252535]"}`}>{lbl}</button>
          ))}
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="flex-1 overflow-auto p-5 text-[11px]">
            {tab==="geometry" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ["Название",name,setName],
                    ["Категория",category,setCategory],
                  ] as [string,string,(v:string)=>void][]).map(([lbl,val,set])=>(
                    <label key={lbl} className="flex flex-col gap-1">
                      <span className="text-gray-500">{lbl}</span>
                      {lbl==="Категория"
                        ? <select value={val} onChange={e=>set(e.target.value)} className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded outline-none focus:border-[#60a5fa]">
                            <option>Категория А (городской)</option>
                            <option>Категория В (дорога)</option>
                            <option>Мини-кольцо (&lt;15м)</option>
                          </select>
                        : <input value={val} onChange={e=>set(e.target.value)} className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded outline-none focus:border-[#60a5fa]"/>
                      }
                    </label>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    ["Внешний радиус R, м",R,setR],
                    ["Внутренний островок Ri, м",Rinner,setRinner],
                    ["Число подъездов",approach,setApproach],
                    ["Ширина кольца, м",circW,setCircW],
                    ["Ширина подъезда, м",entryW,setEntryW],
                  ] as [string,string,(v:string)=>void][]).map(([lbl,val,set])=>(
                    <label key={lbl} className="flex flex-col gap-1">
                      <span className="text-gray-500 text-[9px]">{lbl}</span>
                      <input type="number" value={val} onChange={e=>set(e.target.value)}
                        className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded outline-none focus:border-[#60a5fa] font-mono"/>
                    </label>
                  ))}
                </div>
                {/* Автоматическая проверка норм */}
                <div className="rounded-lg border border-gray-700 p-3" style={{background:"#111827"}}>
                  <div className="text-[10px] font-bold text-white mb-2">Проверка норм ГОСТ Р 52289</div>
                  {[
                    {check:"Мин. внешний радиус",val:`R = ${R} м`,ok:Ro>=15,req:"R ≥ 15 м"},
                    {check:"Ширина кольца",val:`${circW} м`,ok:parseFloat(circW)>=6,req:"≥ 6 м (1 полоса)"},
                    {check:"Ширина подъезда",val:`${entryW} м`,ok:parseFloat(entryW)>=4,req:"≥ 4 м"},
                    {check:"Ширина острова",val:`${Rinner} м`,ok:Ri>=6,req:"Di ≥ 6 м"},
                  ].map(item=>(
                    <div key={item.check} className="flex items-center gap-2 py-1 border-b border-gray-800 text-[10px]">
                      <span className={item.ok?"text-green-400":"text-red-400"}>{item.ok?"✓":"✗"}</span>
                      <span className="text-gray-400 flex-1">{item.check}: <span className="text-white font-mono">{item.val}</span></span>
                      <span className="text-gray-600">{item.req}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab==="lanes" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ["Полос на кольце",circleLanes,setCircleLanes],
                    ["Полос на въезде",entryLanes,setEntryLanes],
                  ] as [string,string,(v:string)=>void][]).map(([lbl,val,set])=>(
                    <label key={lbl} className="flex flex-col gap-1">
                      <span className="text-gray-500">{lbl}</span>
                      <select value={val} onChange={e=>set(e.target.value)} className="bg-[#252535] border border-gray-600 text-white px-2 py-1.5 rounded outline-none">
                        <option>1</option><option>2</option><option>3</option>
                      </select>
                    </label>
                  ))}
                </div>
                <div className="rounded-lg border border-gray-700 p-3 space-y-2" style={{background:"#111827"}}>
                  <div className="text-[10px] font-bold text-white">Конфигурация подъездов</div>
                  {Array.from({length:nArms},(_,i)=>(
                    <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-800">
                      <div className="w-6 h-6 rounded-full bg-[#f97316]/20 border border-[#f97316]/60 flex items-center justify-center text-[10px] text-[#f97316] font-bold">{i+1}</div>
                      <span className="text-gray-400 flex-1">Подъезд {i+1}</span>
                      <div className="flex gap-1">
                        {["Въезд","Выезд"].map(d=>(
                          <span key={d} className="text-[9px] px-2 py-0.5 rounded bg-[#252535] text-gray-300">{d}</span>
                        ))}
                      </div>
                      <span className="text-[9px] text-gray-500">{entryLanes} пол.</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab==="analysis" && (
              <div className="space-y-4">
                <div className="text-gray-400 text-[10px]">Расчёт пропускной способности по методу HCM 6th Edition</div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {label:"Поток на въезде",val:`${entryFlow} авт/ч`,color:"#60a5fa"},
                    {label:"Поток на кольце",val:`${circFlow} авт/ч`,color:"#f97316"},
                    {label:"Пропускная способность",val:`${capacity} авт/ч`,color:"#4ade80"},
                    {label:"Степень насыщения v/c",val:`${v2c}%`,color:parseFloat(v2c)<85?"#4ade80":"#ef4444"},
                    {label:"Задержка",val:`${delay} с/авт`,color:parseFloat(delay)<25?"#4ade80":parseFloat(delay)<40?"#facc15":"#ef4444"},
                    {label:"Уровень обслуживания",val:`LOS ${los}`,color:los==="A"||los==="B"?"#4ade80":los==="C"?"#facc15":los==="D"?"#f97316":"#ef4444"},
                  ].map(item=>(
                    <div key={item.label} className="rounded-lg border border-gray-700 px-3 py-2.5" style={{background:"#111827"}}>
                      <div className="text-gray-500 text-[9px] mb-0.5">{item.label}</div>
                      <div className="font-mono font-bold text-[14px]" style={{color:item.color}}>{item.val}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-gray-700 p-3 text-[10px]" style={{background:"#111827"}}>
                  <div className="text-gray-400 font-bold mb-2">Нормы уровней обслуживания (HCM)</div>
                  {[["A","&lt; 10 с","#4ade80"],["B","10–20 с","#86efac"],["C","20–35 с","#facc15"],["D","35–55 с","#f97316"],["E","55–80 с","#ef4444"],["F","&gt; 80 с","#7f1d1d"]].map(([l,d,c])=>(
                    <div key={l} className={`flex items-center gap-2 py-1 border-b border-gray-800 ${los===l?"font-bold":""}`}>
                      <span className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white" style={{background:c}}>{l}</span>
                      <span className="text-gray-400">Задержка {d}</span>
                      {los===l && <span className="text-[9px] ml-auto" style={{color:c}}>← Текущий</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab==="output" && (
              <div className="space-y-3">
                <div className="text-gray-400">Экспорт и документация</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {fmt:"DXF",icon:"PencilRuler",desc:"Чертёж кольца для AutoCAD",color:"#0078d4"},
                    {fmt:"LandXML",icon:"Code2",desc:"Геометрия для Лапа",color:"#7c3aed"},
                    {fmt:"PDF",icon:"FileText",desc:"Схема для согласования",color:"#ef4444"},
                    {fmt:"Ведомость",icon:"ClipboardList",desc:"Объёмы работ + спецификация",color:"#16a34a"},
                  ].map(f=>(
                    <button key={f.fmt} onClick={()=>onOK({name,R:Ro})}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-700 hover:border-[#60a5fa] hover:bg-[#1e2a3a] transition-all text-left">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:f.color+"20"}}>
                        <Icon name={f.icon} size={18} style={{color:f.color}} fallback="Download"/>
                      </div>
                      <div><div className="text-white font-bold text-[12px]">{f.fmt}</div>
                      <div className="text-gray-500 text-[9px]">{f.desc}</div></div>
                    </button>
                  ))}
                </div>
                <div className="rounded-lg border border-gray-700 p-3" style={{background:"#111827"}}>
                  <div className="text-[10px] font-bold text-white mb-2">Краткий отчёт</div>
                  <div className="text-[9px] text-gray-400 font-mono whitespace-pre">{
                    `КОЛЬЦЕВОЕ ПЕРЕСЕЧЕНИЕ: ${name}\n` +
                    `Внешний радиус:   R = ${R} м\n` +
                    `Островок:         Ri = ${Rinner} м\n` +
                    `Ширина кольца:    B = ${circW} м\n` +
                    `Подъездов:        ${approach} шт.\n` +
                    `Пропускная сп.:   ${capacity} авт/ч\n` +
                    `Уровень обслуж.:  LOS ${los} (задержка ${delay} с)\n` +
                    `Категория:        ${category}`
                  }</div>
                </div>
              </div>
            )}
          </div>

          {/* SVG превью */}
          <div className="w-52 flex-shrink-0 border-l border-gray-800 p-4 flex flex-col items-center gap-3" style={{background:"#0d1117"}}>
            <div className="text-[9px] text-gray-500 uppercase tracking-wide">Предпросмотр</div>
            <RoundaboutSVG/>
            <div className="text-center text-[9px] text-gray-500 space-y-0.5">
              <div className="text-white font-semibold text-[10px]">{name}</div>
              <div>R = {R} м · Ri = {Rinner} м</div>
              <div>{approach} подъезда · {circleLanes} пол.</div>
              <div className={`font-bold ${los==="A"||los==="B"?"text-green-400":los==="C"?"text-yellow-400":los==="D"?"text-orange-400":"text-red-400"}`}>LOS {los}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-700 flex-shrink-0 bg-[#111827] rounded-b-xl">
          <div className="text-[10px] text-gray-500">
            Пропуск. способность: <span className="text-[#60a5fa] font-bold">{capacity} авт/ч</span>
            &nbsp;·&nbsp;LOS: <span className="font-bold" style={{color:los==="A"||los==="B"?"#4ade80":los==="C"?"#facc15":los==="D"?"#f97316":"#ef4444"}}>{los}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 hover:bg-[#3a3a4e] rounded text-[11px]">Отмена</button>
            <button onClick={()=>onOK({name,R:Ro})} className="px-4 py-1.5 bg-[#60a5fa] text-[#0d1117] hover:bg-[#93c5fd] rounded text-[11px] font-bold">✓ Создать кольцо</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// НОВЫЕ МОДУЛИ: Survey DB · Breaklines · Sample Lines · Section Views ·
//               Pressure Network · Manning · Mass Haul · Label Styles ·
//               Plan Production · Visibility Analysis · Parcels ROW
// ═══════════════════════════════════════════════════════════════════════════

// ─── Survey Database + Figures + FieldBook ────────────────────────────────────
function SurveyDBDialog({ onClose }: { onClose: ()=>void }) {
  const [tab, setTab] = useState<"db"|"figures"|"fieldbook"|"codes">("db")
  const [points] = useState([
    {id:"1001",x:"5420.145",y:"3817.234",z:"121.340",code:"Р",desc:"Рельеф"},
    {id:"1002",x:"5435.280",y:"3825.110",z:"122.015",code:"Д",desc:"Дорога"},
    {id:"1003",x:"5441.920",y:"3830.640",z:"119.780",code:"КН",desc:"Канава"},
    {id:"1004",x:"5418.500",y:"3845.220",z:"123.450",code:"ЗД",desc:"Здание"},
    {id:"1005",x:"5455.330",y:"3812.780",z:"120.890",code:"Р",desc:"Рельеф"},
    {id:"1006",x:"5462.140",y:"3838.900",z:"118.230",code:"ОК",desc:"Окно/ось"},
  ])
  const figures = [
    {name:"Ось дороги",type:"Линия",points:"1002,1003,1006",length:"87.4м",code:"Д"},
    {name:"Контур здания",type:"Полигон",points:"1004,1004",length:"34.2м",code:"ЗД"},
    {name:"Канава лев.",type:"Полилиния",points:"1003,1005",length:"42.1м",code:"КН"},
  ]
  const fieldBook = [
    {time:"08:14",inst:"ТС-20",from:"ПП-1",to:"ПП-2",hz:"42°18'36\"",v:"89°58'12\"",dist:"125.340",note:""},
    {time:"08:31",inst:"ТС-20",from:"ПП-2",to:"ПП-3",hz:"118°45'12\"",v:"90°01'48\"",dist:"98.720",note:""},
    {time:"08:52",inst:"ТС-20",from:"ПП-3",to:"1001",hz:"287°22'10\"",v:"88°44'30\"",dist:"31.280",note:"Тропа"},
    {time:"09:05",inst:"ТС-20",from:"ПП-3",to:"1002",hz:"312°14'48\"",v:"90°12'18\"",dist:"28.750",note:"Ось"},
  ]
  const codes = [
    {code:"Р",desc:"Рельефная точка",symbol:"○",layer:"Рельеф",color:"#4ade80"},
    {code:"Д",desc:"Дорога / ось",symbol:"⬤",layer:"Дороги",color:"#f97316"},
    {code:"КН",desc:"Канава / лоток",symbol:"◇",layer:"Дренаж",color:"#60a5fa"},
    {code:"ЗД",desc:"Здание / сооружение",symbol:"□",layer:"Здания",color:"#a855f7"},
    {code:"КЛ",desc:"Кабель / электролиния",symbol:"⚡",layer:"Сети",color:"#facc15"},
    {code:"ТР",desc:"Трубопровод",symbol:"○─",layer:"Трубы",color:"#06b6d4"},
    {code:"ОК",desc:"Ось кривой",symbol:"⌒",layer:"Трассы",color:"#ec4899"},
    {code:"ПК",desc:"Пикет",symbol:"│",layer:"Пикетаж",color:"#e879f9"},
  ]
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-lg shadow-2xl flex flex-col"
        style={{width:660,maxHeight:"88vh"}} onClick={e=>e.stopPropagation()}>
        <div className="bg-[#0d1a2e] px-4 py-2 flex items-center justify-between border-b border-gray-700 rounded-t-lg flex-shrink-0">
          <span className="text-white font-bold text-[12px] flex items-center gap-2">
            <Icon name="MapPin" size={13} className="text-[#0078d4]"/>База данных съёмки (Survey Database)
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="flex border-b border-gray-700 bg-[#151525] flex-shrink-0">
          {([["db","Точки БД"],["figures","Фигуры"],["fieldbook","Полевой журнал"],["codes","Коды"]] as const).map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`px-4 py-1.5 text-[10px] border-r border-gray-800 transition-colors ${tab===id?"bg-[#252535] text-white border-b-2 border-b-[#0078d4]":"text-gray-400 hover:bg-[#252535]"}`}>{lbl}</button>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-3 min-h-0 text-[10px]">
          {tab==="db" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">{points.length} точек · GPS/Тахеометр · МСК-70</span>
                <div className="flex gap-1">
                  <button className="px-2 py-0.5 bg-[#0078d4]/20 text-[#60a5fa] border border-[#0078d4]/40 rounded text-[9px]">Импорт CSV/RW5</button>
                  <button className="px-2 py-0.5 bg-[#252535] text-gray-400 border border-gray-700 rounded text-[9px]">Экспорт</button>
                </div>
              </div>
              <table className="w-full border-collapse">
                <thead><tr className="bg-[#0d1117]">{["ID","X","Y","Z","Код","Описание"].map(h=><th key={h} className="px-2 py-1 text-gray-400 border border-gray-800 font-normal text-left">{h}</th>)}</tr></thead>
                <tbody>{points.map((p,i)=>(
                  <tr key={i} className="hover:bg-[#252535]">
                    <td className="px-2 py-0.5 border border-gray-800 text-[#4fc3f7] font-mono">{p.id}</td>
                    <td className="px-2 py-0.5 border border-gray-800 font-mono text-gray-300">{p.x}</td>
                    <td className="px-2 py-0.5 border border-gray-800 font-mono text-gray-300">{p.y}</td>
                    <td className="px-2 py-0.5 border border-gray-800 font-mono text-green-400">{p.z}</td>
                    <td className="px-2 py-0.5 border border-gray-800 text-yellow-400 font-bold">{p.code}</td>
                    <td className="px-2 py-0.5 border border-gray-800 text-gray-500">{p.desc}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {tab==="figures" && (
            <div className="space-y-2">
              <div className="text-gray-500 mb-2">Линейные объекты по кодам точек (Survey Figures)</div>
              {figures.map((f,i)=>(
                <div key={i} className="flex items-center gap-3 p-2 rounded border border-gray-700 hover:bg-[#252535]" style={{background:"#111827"}}>
                  <Icon name={f.type==="Полигон"?"Square":"Route"} size={14} className="text-[#0078d4] flex-shrink-0" fallback="Minus"/>
                  <div className="flex-1"><div className="text-white font-semibold">{f.name}</div>
                  <div className="text-gray-500">Код: {f.code} · {f.type} · Точки: {f.points}</div></div>
                  <span className="text-gray-400 font-mono">{f.length}</span>
                </div>
              ))}
              <button className="mt-2 px-3 py-1.5 bg-[#0078d4]/20 text-[#60a5fa] border border-[#0078d4]/40 rounded text-[10px] w-full">+ Создать фигуру по коду</button>
            </div>
          )}
          {tab==="fieldbook" && (
            <div>
              <div className="text-gray-500 mb-2">Полевой журнал (Field Book) · Прибор: ТС-20</div>
              <table className="w-full border-collapse">
                <thead><tr className="bg-[#0d1117]">{["Время","Откуда","Куда","Гор.угол","Верт.угол","Расстояние","Примечание"].map(h=><th key={h} className="px-2 py-1 text-gray-400 border border-gray-800 font-normal text-left">{h}</th>)}</tr></thead>
                <tbody>{fieldBook.map((r,i)=>(
                  <tr key={i} className="hover:bg-[#252535]">
                    <td className="px-2 py-0.5 border border-gray-800 text-gray-500 font-mono">{r.time}</td>
                    <td className="px-2 py-0.5 border border-gray-800 text-[#4fc3f7] font-mono">{r.from}</td>
                    <td className="px-2 py-0.5 border border-gray-800 text-white font-mono">{r.to}</td>
                    <td className="px-2 py-0.5 border border-gray-800 text-yellow-400 font-mono">{r.hz}</td>
                    <td className="px-2 py-0.5 border border-gray-800 text-gray-400 font-mono">{r.v}</td>
                    <td className="px-2 py-0.5 border border-gray-800 text-green-400 font-mono">{r.dist}</td>
                    <td className="px-2 py-0.5 border border-gray-800 text-gray-600">{r.note}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {tab==="codes" && (
            <div className="grid grid-cols-2 gap-2">
              {codes.map(c=>(
                <div key={c.code} className="flex items-center gap-3 p-2 rounded border border-gray-700" style={{background:"#111827"}}>
                  <div className="w-7 h-7 rounded flex items-center justify-center text-[14px] flex-shrink-0" style={{background:c.color+"20",color:c.color}}>{c.symbol}</div>
                  <div><div className="text-white font-bold">{c.code}</div><div className="text-gray-500 text-[9px]">{c.desc} · Слой: {c.layer}</div></div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end px-4 py-2 border-t border-gray-700 flex-shrink-0 bg-[#151525]">
          <button onClick={onClose} className="px-4 py-1.5 bg-[#0078d4] text-white hover:bg-[#0066b3] rounded text-[11px]">Закрыть</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Breaklines + Voids + Surface Stats + Compare Surfaces ────────────────────
function SurfaceAdvancedDialog({ onClose, mode }: { onClose: ()=>void; mode: "breaklines"|"voids"|"stats"|"compare"|"interpolation" }) {
  const titles = { breaklines:"Линии разрыва TIN (Breaklines)", voids:"Исключения поверхности (Voids)", stats:"Статистика поверхности", compare:"Сравнение поверхностей", interpolation:"Интерполяция (IDW / Kriging / NN)" }
  const [breaklines] = useState([
    {name:"Ось дороги", type:"Стандартная", pts:5, len:"423.4м"},
    {name:"Кромка проезжей части лев.", type:"Стандартная", pts:8, len:"418.2м"},
    {name:"Бровка откоса прав.", type:"Не деструктивная", pts:12, len:"415.7м"},
    {name:"Ось канавы", type:"Стандартная", pts:6, len:"198.3м"},
  ])
  const stats = {
    min:"118.24 м",max:"135.72 м",mean:"124.81 м",area2D:"48 230.5 м²",area3D:"49 118.3 м²",
    pts:"1 847",tri:"3 691",minSlope:"0.2%",maxSlope:"38.4%",meanSlope:"8.7%"
  }
  const interpMethod = useState("IDW")[0]
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-lg shadow-2xl flex flex-col"
        style={{width:580,maxHeight:"85vh"}} onClick={e=>e.stopPropagation()}>
        <div className="bg-[#0d1a2e] px-4 py-2 flex items-center justify-between border-b border-gray-700 rounded-t-lg flex-shrink-0">
          <span className="text-white font-bold text-[12px] flex items-center gap-2">
            <Icon name="Triangle" size={13} className="text-[#4ade80]"/>{titles[mode]}
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="flex-1 overflow-auto p-4 text-[11px] min-h-0">
          {mode==="breaklines" && (
            <div className="space-y-2">
              <div className="flex justify-between mb-3">
                <span className="text-gray-400">Линии разрыва влияют на триангуляцию TIN вдоль объектов</span>
                <button className="px-2 py-0.5 bg-[#0078d4]/20 text-[#60a5fa] border border-[#0078d4]/40 rounded text-[9px]">+ Добавить</button>
              </div>
              {breaklines.map((b,i)=>(
                <div key={i} className="flex items-center gap-3 p-2 rounded border border-gray-700 hover:bg-[#252535]" style={{background:"#111827"}}>
                  <Icon name="Minus" size={14} className="text-yellow-400"/>
                  <div className="flex-1"><div className="text-white">{b.name}</div>
                  <div className="text-gray-500 text-[9px]">Тип: {b.type} · {b.pts} точек · {b.len}</div></div>
                  <button className="text-gray-600 hover:text-red-400 text-[10px]">✕</button>
                </div>
              ))}
            </div>
          )}
          {mode==="voids" && (
            <div className="space-y-3">
              <p className="text-gray-400">Исключения удаляют треугольники TIN внутри контуров</p>
              <div className="rounded-lg border border-dashed border-gray-600 p-6 text-center" style={{background:"#111827"}}>
                <Icon name="Triangle" size={24} className="text-gray-600 mx-auto mb-2"/>
                <div className="text-gray-500 text-[10px]">Нет добавленных исключений</div>
                <button className="mt-2 px-3 py-1 bg-[#0078d4]/20 text-[#60a5fa] border border-[#0078d4]/40 rounded text-[10px]">Выбрать контур на чертеже</button>
              </div>
            </div>
          )}
          {mode==="stats" && (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(stats).map(([k,v])=>(
                <div key={k} className="rounded border border-gray-700 px-3 py-2" style={{background:"#111827"}}>
                  <div className="text-gray-500 text-[9px] mb-0.5">{k==="min"?"Мин. отметка":k==="max"?"Макс. отметка":k==="mean"?"Средняя":k==="area2D"?"Площадь 2D":k==="area3D"?"Площадь 3D":k==="pts"?"Точек":k==="tri"?"Треугольников":k==="minSlope"?"Мин. уклон":k==="maxSlope"?"Макс. уклон":"Средний уклон"}</div>
                  <div className="text-white font-mono font-bold">{v}</div>
                </div>
              ))}
            </div>
          )}
          {mode==="compare" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {["Поверхность 1","Поверхность 2"].map(lbl=>(
                  <div key={lbl}>
                    <div className="text-gray-500 text-[9px] mb-1">{lbl}</div>
                    <select className="w-full bg-[#252535] border border-gray-600 text-white text-[10px] px-2 py-1 rounded">
                      <option>Существующая поверхность</option>
                      <option>Проектная поверхность</option>
                    </select>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-gray-700 p-3" style={{background:"#111827"}}>
                <div className="text-[10px] font-bold text-white mb-2">Объём между поверхностями</div>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div className="text-center"><div className="text-red-400 font-bold text-[14px]">13 407 м³</div><div className="text-gray-500">Выемка (Cut)</div></div>
                  <div className="text-center"><div className="text-blue-400 font-bold text-[14px]">6 154 м³</div><div className="text-gray-500">Насыпь (Fill)</div></div>
                  <div className="text-center"><div className="text-green-400 font-bold text-[14px]">+7 253 м³</div><div className="text-gray-500">Баланс</div></div>
                </div>
              </div>
            </div>
          )}
          {mode==="interpolation" && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {["IDW","Kriging","Natural Neighbor"].map(m=>(
                  <button key={m} className={`p-3 rounded-lg border text-center transition-all ${interpMethod===m?"border-[#0078d4] bg-[#0078d4]/20":"border-gray-700 hover:bg-[#252535]"}`} style={{background:interpMethod===m?undefined:"#111827"}}>
                    <div className="text-white text-[11px] font-bold">{m}</div>
                    <div className="text-gray-500 text-[9px] mt-0.5">{m==="IDW"?"Обратных расстояний":m==="Kriging"?"Геостатистика":"Естественный сосед"}</div>
                  </button>
                ))}
              </div>
              <div className="rounded-lg border border-gray-700 p-3" style={{background:"#111827"}}>
                <div className="text-[10px] text-gray-400 font-bold mb-2">Параметры IDW</div>
                {[["Степень (Power)","2"],["Поиск соседей","12"],["Макс. расстояние","—"],].map(([k,v])=>(
                  <div key={k} className="flex items-center gap-3 mb-1">
                    <span className="text-gray-500 w-36">{k}:</span>
                    <input defaultValue={v} className="w-20 bg-[#252535] border border-gray-600 text-white text-[10px] px-2 py-0.5 rounded font-mono"/>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-4 py-2 border-t border-gray-700 flex-shrink-0 bg-[#151525]">
          <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 hover:bg-[#3a3a4e] rounded text-[11px]">Отмена</button>
          <button onClick={onClose} className="px-4 py-1.5 bg-[#0078d4] text-white hover:bg-[#0066b3] rounded text-[11px]">Применить</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Sample Lines + Section Views ─────────────────────────────────────────────
function SampleLinesDialog({ onClose }: { onClose: ()=>void }) {
  const [spacing, setSpacing] = useState("20")
  const [halfWidth, setHalfWidth] = useState("25")
  const [corridor, setCorridor] = useState("Дорога и парковочная зона")
  const count = Math.floor(2000/parseFloat(spacing||"20")) + 1
  const rows = Array.from({length:Math.min(count,12)},(_,i)=>{
    const st = i*parseFloat(spacing||"20")
    const cut = (Math.random()*8).toFixed(2), fill = (Math.random()*6).toFixed(2)
    return {pk:`ПК${Math.floor(st/100)}+${String(st%100).padStart(2,"0")}`,st,cut,fill,net:(parseFloat(cut)-parseFloat(fill)).toFixed(2)}
  })
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-lg shadow-2xl flex flex-col"
        style={{width:680,maxHeight:"88vh"}} onClick={e=>e.stopPropagation()}>
        <div className="bg-[#0d1a2e] px-4 py-2 flex items-center justify-between border-b border-gray-700 rounded-t-lg flex-shrink-0">
          <span className="text-white font-bold text-[12px] flex items-center gap-2">
            <Icon name="AlignCenter" size={13} className="text-[#f97316]"/>Линии сечения и поперечники
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="p-3 border-b border-gray-800 bg-[#111827] flex-shrink-0 flex gap-4 flex-wrap text-[10px]">
          {([["Коридор:",corridor,setCorridor,null],["Шаг, м:",spacing,setSpacing,null],["Полуширина, м:",halfWidth,setHalfWidth,null]] as [string,string,(v:string)=>void,null][]).map(([lbl,val,set])=>(
            <label key={lbl} className="flex items-center gap-2">
              <span className="text-gray-500">{lbl}</span>
              {lbl==="Коридор:" ? <select value={val} onChange={e=>set(e.target.value)} className="bg-[#252535] border border-gray-600 text-white px-2 py-0.5 rounded text-[10px]"><option>Дорога и парковочная зона</option><option>Ул. Трумана</option></select>
                : <input value={val} onChange={e=>set(e.target.value)} className="w-16 bg-[#252535] border border-gray-600 text-white px-2 py-0.5 rounded font-mono text-[10px]"/>}
            </label>
          ))}
          <span className="text-gray-500">Сечений: <span className="text-white font-bold">{count}</span></span>
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Таблица */}
          <div className="flex-1 overflow-auto border-r border-gray-800">
            <table className="w-full border-collapse text-[10px]">
              <thead><tr className="bg-[#0d1117] sticky top-0">{["Пикет","Пл. выемки м²","Пл. насыпи м²","Нетто м²"].map(h=><th key={h} className="px-2 py-1 text-gray-400 border border-gray-800 text-left font-normal">{h}</th>)}</tr></thead>
              <tbody>{rows.map((r,i)=>(
                <tr key={i} className={`${i%2===0?"bg-[#111827]":"bg-[#0d1117]"} hover:bg-[#1a2a3a]`}>
                  <td className="px-2 py-0.5 border border-gray-800 text-[#4fc3f7] font-mono">{r.pk}</td>
                  <td className="px-2 py-0.5 border border-gray-800 text-red-300 font-mono">{r.cut}</td>
                  <td className="px-2 py-0.5 border border-gray-800 text-blue-300 font-mono">{r.fill}</td>
                  <td className={`px-2 py-0.5 border border-gray-800 font-mono ${parseFloat(r.net)>=0?"text-red-400":"text-blue-400"}`}>{r.net}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {/* Section View превью */}
          <div className="w-48 flex-shrink-0 p-2 overflow-auto">
            <div className="text-[9px] text-gray-500 mb-1 text-center">Поперечник ПК0+000</div>
            <svg width="176" height="100" viewBox="-22 -12 44 16" style={{background:"#0d1117",borderRadius:4}}>
              <path d="M-20,-3 C-12,-3 -8,0 0,0 8,0 12,-3 20,-3" stroke="#4ade80" strokeWidth="0.4" fill="none"/>
              <path d="M-6,0 L-6,-1.5 L6,-1.5 L6,0" fill="rgba(35,40,55,0.9)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.2"/>
              <line x1="0" y1="-4" x2="0" y2="4" stroke="#ef4444" strokeWidth="0.2" strokeDasharray="0.5 0.5"/>
              <line x1="-20" y1="0" x2="20" y2="0" stroke="#6b7280" strokeWidth="0.15" strokeDasharray="0.8 0.5"/>
              <text x="0" y="3" textAnchor="middle" fill="#6b7280" fontSize="1.8">ПК0+000</text>
            </svg>
          </div>
        </div>
        <div className="flex justify-between px-4 py-2 border-t border-gray-700 flex-shrink-0 bg-[#151525]">
          <button className="px-3 py-1.5 bg-[#252535] text-gray-300 border border-gray-600 rounded text-[11px]">Создать листы поперечников</button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 rounded text-[11px]">Отмена</button>
            <button onClick={onClose} className="px-4 py-1.5 bg-[#0078d4] text-white rounded text-[11px]">Создать Sample Lines</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Pressure Networks + Manning + Ливневая канализация ───────────────────────
function PressureNetworkDialog({ onClose }: { onClose: ()=>void }) {
  const [tab, setTab] = useState<"pressure"|"manning"|"storm">("pressure")
  // Manning
  const [Q, setQ] = useState("0.150")
  const [n, setN] = useState("0.013")
  const [D, setD] = useState("0.300")
  const manningV = () => {
    const r = parseFloat(D)/4, slope = 0.005
    return (1/parseFloat(n)) * Math.pow(r, 2/3) * Math.pow(slope, 0.5)
  }
  const manningQfull = () => {
    const r = parseFloat(D)/4, A = Math.PI*parseFloat(D)**2/4
    return (1/parseFloat(n)) * A * Math.pow(r, 2/3) * Math.pow(0.005, 0.5)
  }
  // Darcy-Weisbach
  const [flowRate, setFlowRate] = useState("5.0")
  const [pipeDiam, setPipeDiam] = useState("0.100")
  const [pipeLen, setPipeLen] = useState("250")
  const f = 0.02
  const velDP = parseFloat(flowRate)/1000 / (Math.PI*parseFloat(pipeDiam)**2/4)
  const headLoss = f * parseFloat(pipeLen)/parseFloat(pipeDiam) * velDP**2/(2*9.81)
  // Рациональная формула
  const [C, setC] = useState("0.85")
  const [i, setI] = useState("120")
  const [Fc, setFc] = useState("1.5")
  const stormQ = parseFloat(C)*parseFloat(i)/1000/3600*parseFloat(Fc)*10000/3.6
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-lg shadow-2xl flex flex-col"
        style={{width:600,maxHeight:"88vh"}} onClick={e=>e.stopPropagation()}>
        <div className="bg-[#0d1a2e] px-4 py-2 flex items-center justify-between border-b border-gray-700 rounded-t-lg flex-shrink-0">
          <span className="text-white font-bold text-[12px] flex items-center gap-2">
            <Icon name="Network" size={13} className="text-[#60a5fa]"/>Гидравлический расчёт сетей
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="flex border-b border-gray-700 bg-[#151525] flex-shrink-0">
          {([["pressure","Напорные (Дарси)"],["manning","Самотёчные (Манинг)"],["storm","Ливневая (Рац. ф-ла)"]] as const).map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`px-3 py-1.5 text-[10px] border-r border-gray-800 transition-colors ${tab===id?"bg-[#252535] text-white border-b-2 border-b-[#0078d4]":"text-gray-400 hover:bg-[#252535]"}`}>{lbl}</button>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-4 text-[11px] min-h-0">
          {tab==="manning" && (
            <div className="space-y-3">
              <div className="text-[10px] text-gray-500">Формула Манинга: V = (1/n)·R^(2/3)·i^(1/2)</div>
              <div className="grid grid-cols-3 gap-3">
                {([["Расход Q, м³/с",Q,setQ],["Коэф. шероховатости n",n,setN],["Диаметр трубы D, м",D,setD]] as [string,string,(v:string)=>void][]).map(([lbl,val,set])=>(
                  <label key={lbl} className="flex flex-col gap-1">
                    <span className="text-gray-500 text-[9px]">{lbl}</span>
                    <input value={val} onChange={e=>set(e.target.value)} className="bg-[#252535] border border-gray-600 text-white px-2 py-1 rounded font-mono text-[11px]"/>
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {[
                  ["Гидравлический радиус R","(D/4) = " + (parseFloat(D)/4).toFixed(3) + " м","#4ade80"],
                  ["Уклон (принято)","i = 0.005 (0.5%)","#60a5fa"],
                  ["Скорость в полном сечении","V = " + manningV().toFixed(3) + " м/с",manningV()<0.7?"#ef4444":manningV()>3?"#ef4444":"#4ade80"],
                  ["Расход в полном сечении","Qполн = " + manningQfull().toFixed(4) + " м³/с","#4fc3f7"],
                  ["Наполнение h/D","≈ " + Math.min(1,(parseFloat(Q)/manningQfull())).toFixed(2),"#f97316"],
                  ["Проверка скорости",manningV()>=0.7&&manningV()<=3?"✓ В норме (0.7–3.0 м/с)":"⚠ Вне нормы",manningV()>=0.7&&manningV()<=3?"#4ade80":"#ef4444"],
                ].map(([k,v,c])=>(
                  <div key={k as string} className="rounded border border-gray-700 px-3 py-2" style={{background:"#111827"}}>
                    <div className="text-gray-500 text-[9px]">{k}</div>
                    <div className="font-mono font-bold mt-0.5" style={{color:c as string}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab==="pressure" && (
            <div className="space-y-3">
              <div className="text-[10px] text-gray-500">Потери напора: Дарси-Вейсбах h = λ·(L/D)·V²/(2g)</div>
              <div className="grid grid-cols-3 gap-3">
                {([["Расход Q, л/с",flowRate,setFlowRate],["Диаметр d, м",pipeDiam,setPipeDiam],["Длина L, м",pipeLen,setPipeLen]] as [string,string,(v:string)=>void][]).map(([lbl,val,set])=>(
                  <label key={lbl} className="flex flex-col gap-1">
                    <span className="text-gray-500 text-[9px]">{lbl}</span>
                    <input value={val} onChange={e=>set(e.target.value)} className="bg-[#252535] border border-gray-600 text-white px-2 py-1 rounded font-mono text-[11px]"/>
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {[
                  ["Скорость V","" + velDP.toFixed(3) + " м/с",velDP<0.5||velDP>3?"#ef4444":"#4ade80"],
                  ["Число Рейнольдса Re","" + (velDP*parseFloat(pipeDiam)/0.000001).toFixed(0),"#60a5fa"],
                  ["Коэф. трения λ (принято)","λ = " + f,"#gray-400"],
                  ["Потери напора h","" + headLoss.toFixed(2) + " м","#f97316"],
                  ["Уд. потери hуд","" + (headLoss/parseFloat(pipeLen)*1000).toFixed(2) + " м/км","#4fc3f7"],
                  ["Режим течения",velDP*parseFloat(pipeDiam)/0.000001>4000?"Турбулентный":"Ламинарный","#e879f9"],
                ].map(([k,v,c])=>(
                  <div key={k as string} className="rounded border border-gray-700 px-3 py-2" style={{background:"#111827"}}>
                    <div className="text-gray-500 text-[9px]">{k}</div>
                    <div className="font-mono font-bold mt-0.5" style={{color:c as string}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab==="storm" && (
            <div className="space-y-3">
              <div className="text-[10px] text-gray-500">Рациональная формула: Q = C·i·F / 3.6 (л/с)</div>
              <div className="grid grid-cols-3 gap-3">
                {([["Коэф. стока C",C,setC],["Интенсивность i, мм/ч",i,setI],["Площадь F, га",Fc,setFc]] as [string,string,(v:string)=>void][]).map(([lbl,val,set])=>(
                  <label key={lbl} className="flex flex-col gap-1">
                    <span className="text-gray-500 text-[9px]">{lbl}</span>
                    <input value={val} onChange={e=>set(e.target.value)} className="bg-[#252535] border border-gray-600 text-white px-2 py-1 rounded font-mono text-[11px]"/>
                  </label>
                ))}
              </div>
              <div className="rounded-lg border border-gray-700 p-4 text-center" style={{background:"#111827"}}>
                <div className="text-[10px] text-gray-500 mb-1">Расчётный расход ливневой канализации</div>
                <div className="text-[24px] font-bold text-blue-400 font-mono">{stormQ.toFixed(2)} л/с</div>
                <div className="text-[10px] text-gray-500 mt-1">= {(stormQ/1000).toFixed(4)} м³/с</div>
              </div>
              <div className="text-[9px] text-gray-600">СП 32.13330.2018 Канализация. Наружные сети и сооружения.</div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-4 py-2 border-t border-gray-700 flex-shrink-0 bg-[#151525]">
          <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 rounded text-[11px]">Закрыть</button>
          <button onClick={onClose} className="px-4 py-1.5 bg-[#0078d4] text-white rounded text-[11px]">Применить</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Mass Haul + Pay Items ─────────────────────────────────────────────────────
function MassHaulDialog({ onClose }: { onClose: ()=>void }) {
  const [tab, setTab] = useState<"masshaul"|"payitems">("masshaul")
  const [swell, setSwell] = useState("1.15")
  const [shrink, setShrink] = useState("0.90")
  const segments = [
    {from:"ПК0+000",to:"ПК0+200",cut:13407,fill:6154,dist:200,haul:"2 800"},
    {from:"ПК0+200",to:"ПК0+400",cut:4820,fill:9340,dist:200,haul:"—"},
    {from:"ПК0+400",to:"ПК0+600",cut:8120,fill:3670,dist:200,haul:"1 400"},
  ]
  const payItems = [
    {code:"1-01",desc:"Разработка грунта в выемке",unit:"м³",qty:"13 407",rate:"280",sum:"3 753 960"},
    {code:"1-02",desc:"Уплотнение грунта насыпи",unit:"м³",qty:"6 154",rate:"195",sum:"1 200 030"},
    {code:"1-03",desc:"Транспортировка грунта",unit:"м³·км",qty:"28 000",rate:"85",sum:"2 380 000"},
    {code:"2-01",desc:"Устройство дорожной одежды (АБ)",unit:"м²",qty:"14 200",rate:"2 100",sum:"29 820 000"},
    {code:"2-02",desc:"Подстилающий слой (ПГС)",unit:"м³",qty:"1 278",rate:"650",sum:"830 700"},
  ]
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-lg shadow-2xl flex flex-col"
        style={{width:620,maxHeight:"88vh"}} onClick={e=>e.stopPropagation()}>
        <div className="bg-[#0d1a2e] px-4 py-2 flex items-center justify-between border-b border-gray-700 rounded-t-lg flex-shrink-0">
          <span className="text-white font-bold text-[12px] flex items-center gap-2">
            <Icon name="TrendingUp" size={13} className="text-yellow-400"/>Кривая земляных масс и расценки
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="flex border-b border-gray-700 bg-[#151525] flex-shrink-0">
          {([["masshaul","Баланс грунта"],["payitems","Расценки (ведомость)"]] as const).map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`px-4 py-1.5 text-[10px] border-r border-gray-800 transition-colors ${tab===id?"bg-[#252535] text-white border-b-2 border-b-[#0078d4]":"text-gray-400 hover:bg-[#252535]"}`}>{lbl}</button>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-4 text-[10px] min-h-0">
          {tab==="masshaul" && (
            <div className="space-y-3">
              <div className="flex gap-4">
                {([["Коэф. разрыхления (Swell)",swell,setSwell],["Коэф. уплотнения (Shrink)",shrink,setShrink]] as [string,string,(v:string)=>void][]).map(([lbl,val,set])=>(
                  <label key={lbl} className="flex items-center gap-2">
                    <span className="text-gray-500">{lbl}:</span>
                    <input value={val} onChange={e=>set(e.target.value)} className="w-16 bg-[#252535] border border-gray-600 text-white px-2 py-0.5 rounded font-mono text-[10px]"/>
                  </label>
                ))}
              </div>
              <table className="w-full border-collapse">
                <thead><tr className="bg-[#0d1117]">{["От","До","Выемка м³","Насыпь м³","L, м","Возка м·т"].map(h=><th key={h} className="px-2 py-1 text-gray-400 border border-gray-800 text-left font-normal">{h}</th>)}</tr></thead>
                <tbody>{segments.map((s,i)=>(
                  <tr key={i} className="hover:bg-[#252535]">
                    <td className="px-2 py-0.5 border border-gray-800 text-[#4fc3f7] font-mono">{s.from}</td>
                    <td className="px-2 py-0.5 border border-gray-800 text-[#4fc3f7] font-mono">{s.to}</td>
                    <td className="px-2 py-0.5 border border-gray-800 text-red-300 font-mono">{s.cut.toLocaleString()}</td>
                    <td className="px-2 py-0.5 border border-gray-800 text-blue-300 font-mono">{s.fill.toLocaleString()}</td>
                    <td className="px-2 py-0.5 border border-gray-800 text-gray-400 font-mono">{s.dist}</td>
                    <td className="px-2 py-0.5 border border-gray-800 text-yellow-400 font-mono">{s.haul}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {tab==="payitems" && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-gray-500">Сметные позиции (ФЕР / ТЕР)</span>
                <button className="px-2 py-0.5 bg-[#0078d4]/20 text-[#60a5fa] border border-[#0078d4]/40 rounded text-[9px]">Экспорт в Excel</button>
              </div>
              <table className="w-full border-collapse">
                <thead><tr className="bg-[#0d1117]">{["Шифр","Наименование","Ед.","Кол-во","Расценка","Сумма, руб"].map(h=><th key={h} className="px-2 py-1 text-gray-400 border border-gray-800 text-left font-normal">{h}</th>)}</tr></thead>
                <tbody>{payItems.map((p,i)=>(
                  <tr key={i} className="hover:bg-[#252535]">
                    <td className="px-2 py-0.5 border border-gray-800 text-yellow-400 font-mono">{p.code}</td>
                    <td className="px-2 py-0.5 border border-gray-800 text-white">{p.desc}</td>
                    <td className="px-2 py-0.5 border border-gray-800 text-gray-400">{p.unit}</td>
                    <td className="px-2 py-0.5 border border-gray-800 text-gray-300 font-mono">{p.qty}</td>
                    <td className="px-2 py-0.5 border border-gray-800 text-gray-400 font-mono">{p.rate}</td>
                    <td className="px-2 py-0.5 border border-gray-800 text-green-400 font-mono">{p.sum}</td>
                  </tr>
                ))}</tbody>
              </table>
              <div className="flex justify-end mt-2 pr-1 text-[11px]">
                <div className="text-gray-400">Итого: <span className="text-green-400 font-bold font-mono">37 984 690 руб.</span></div>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-4 py-2 border-t border-gray-700 flex-shrink-0 bg-[#151525]">
          <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 rounded text-[11px]">Закрыть</button>
          <button onClick={onClose} className="px-4 py-1.5 bg-[#0078d4] text-white rounded text-[11px]">Экспорт CSV</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Plan Production + Label Styles ───────────────────────────────────────────
function PlanProductionDialog({ onClose }: { onClose: ()=>void }) {
  const [tab, setTab] = useState<"plan"|"labels">("plan")
  const sheets = [
    {num:"01",name:"Общие данные",scale:"1:1000",format:"А1",status:"Готов"},
    {num:"02",name:"План трассы",scale:"1:2000",format:"А1",status:"Готов"},
    {num:"03",name:"Продольный профиль ПК0–ПК10",scale:"Г 1:2000 / В 1:200",format:"А1",status:"В работе"},
    {num:"04",name:"Поперечные профили ПК0–ПК5",scale:"1:100",format:"А2",status:"Не начат"},
    {num:"05",name:"Детали конструкции дорожной одежды",scale:"1:20",format:"А2",status:"Не начат"},
  ]
  const labelStyles = [
    {obj:"Точка съёмки",style:"Номер+Z",font:"Arial 2.5",color:"#4fc3f7",example:"1001\n121.34"},
    {obj:"Трасса",style:"Имя + длина",font:"Arial 3.5",color:"#f97316",example:"Ось ШД-38\nL=2000м"},
    {obj:"Пикет",style:"ПК+метраж",font:"Arial 2.0",color:"#e879f9",example:"ПК5+00"},
    {obj:"Горизонталь",style:"Отметка",font:"Arial 2.0",color:"#4ade80",example:"125"},
    {obj:"Коридор",style:"Откос+%",font:"Arial 2.0",color:"#facc15",example:"1:1.5"},
  ]
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-lg shadow-2xl flex flex-col"
        style={{width:600,maxHeight:"88vh"}} onClick={e=>e.stopPropagation()}>
        <div className="bg-[#0d1a2e] px-4 py-2 flex items-center justify-between border-b border-gray-700 rounded-t-lg flex-shrink-0">
          <span className="text-white font-bold text-[12px] flex items-center gap-2">
            <Icon name="FileStack" size={13} className="text-[#a78bfa]"/>Выпуск чертежей и стили подписей
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="flex border-b border-gray-700 bg-[#151525] flex-shrink-0">
          {([["plan","Комплект чертежей"],["labels","Стили подписей"]] as const).map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`px-4 py-1.5 text-[10px] border-r border-gray-800 transition-colors ${tab===id?"bg-[#252535] text-white border-b-2 border-b-[#0078d4]":"text-gray-400 hover:bg-[#252535]"}`}>{lbl}</button>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-4 text-[10px] min-h-0">
          {tab==="plan" && (
            <div className="space-y-2">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Листы чертежей · ГОСТ Р 21.1101</span>
                <button className="px-2 py-0.5 bg-[#0078d4]/20 text-[#60a5fa] border border-[#0078d4]/40 rounded text-[9px]">+ Добавить лист</button>
              </div>
              {sheets.map((s,i)=>(
                <div key={i} className="flex items-center gap-3 p-2 rounded border border-gray-700 hover:bg-[#252535]" style={{background:"#111827"}}>
                  <div className="w-7 h-7 rounded bg-[#0078d4]/20 flex items-center justify-center text-[#60a5fa] font-mono font-bold text-[10px]">{s.num}</div>
                  <div className="flex-1"><div className="text-white">{s.name}</div>
                  <div className="text-gray-500 text-[9px]">Масштаб {s.scale} · Формат {s.format}</div></div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full ${s.status==="Готов"?"bg-green-900/30 text-green-400":s.status==="В работе"?"bg-yellow-900/30 text-yellow-400":"bg-gray-800 text-gray-500"}`}>{s.status}</span>
                </div>
              ))}
              <button className="w-full mt-2 py-2 text-[11px] text-white bg-[#0078d4] hover:bg-[#0066b3] rounded transition-colors">Создать все листы</button>
            </div>
          )}
          {tab==="labels" && (
            <div className="space-y-2">
              <div className="text-gray-400 mb-2">Стили динамических подписей объектов</div>
              {labelStyles.map((ls,i)=>(
                <div key={i} className="flex items-start gap-3 p-2 rounded border border-gray-700" style={{background:"#111827"}}>
                  <pre className="w-20 text-center text-[8px] rounded p-1 leading-tight flex-shrink-0 border" style={{color:ls.color,borderColor:ls.color+"40",background:ls.color+"10"}}>{ls.example}</pre>
                  <div className="flex-1"><div className="text-white font-semibold">{ls.obj}</div>
                  <div className="text-gray-500 text-[9px]">Стиль: {ls.style} · Шрифт: {ls.font}</div></div>
                  <button className="text-[9px] text-[#0078d4] hover:underline mt-0.5">Изменить</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-4 py-2 border-t border-gray-700 flex-shrink-0 bg-[#151525]">
          <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 rounded text-[11px]">Закрыть</button>
          <button onClick={onClose} className="px-4 py-1.5 bg-[#0078d4] text-white rounded text-[11px]">Применить</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Visibility Analysis + Parcels ROW ────────────────────────────────────────
function VisibilityAnalysisDialog({ onClose }: { onClose: ()=>void }) {
  const [tab, setTab] = useState<"visibility"|"parcels">("visibility")
  const [eyeH, setEyeH] = useState("1.2")
  const [objH, setObjH] = useState("0.2")
  const stations = Array.from({length:10},(_,i)=>({
    pk:`ПК${i}+00`, sight: (150+i*30+Math.sin(i)*40).toFixed(0),
    required:"150", ok: (150+i*30+Math.sin(i)*40) >= 150
  }))
  const parcels = [
    {id:"У-001",area:"1 240 м²",perim:"148.2 м",owner:"Иванов А.П.",type:"Жилой"},
    {id:"У-002",area:"890 м²", perim:"122.4 м",owner:"ООО «Агро»",type:"С/х"},
    {id:"У-003",area:"2 100 м²",perim:"186.0 м",owner:"Муниципальная",type:"Дорога/ROW"},
    {id:"У-004",area:"560 м²", perim:"98.6 м",owner:"Петров Н.С.",type:"Жилой"},
  ]
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-lg shadow-2xl flex flex-col"
        style={{width:580,maxHeight:"85vh"}} onClick={e=>e.stopPropagation()}>
        <div className="bg-[#0d1a2e] px-4 py-2 flex items-center justify-between border-b border-gray-700 rounded-t-lg flex-shrink-0">
          <span className="text-white font-bold text-[12px] flex items-center gap-2">
            <Icon name="Eye" size={13} className="text-[#facc15]"/>Видимость + Участки ROW
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="flex border-b border-gray-700 bg-[#151525] flex-shrink-0">
          {([["visibility","Анализ видимости"],["parcels","Участки / ROW"]] as const).map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`px-4 py-1.5 text-[10px] border-r border-gray-800 transition-colors ${tab===id?"bg-[#252535] text-white border-b-2 border-b-[#0078d4]":"text-gray-400 hover:bg-[#252535]"}`}>{lbl}</button>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-4 text-[10px] min-h-0">
          {tab==="visibility" && (
            <div className="space-y-3">
              <div className="flex gap-4">
                {([["Высота глаза, м",eyeH,setEyeH],["Высота объекта, м",objH,setObjH]] as [string,string,(v:string)=>void][]).map(([lbl,val,set])=>(
                  <label key={lbl} className="flex items-center gap-2">
                    <span className="text-gray-500">{lbl}:</span>
                    <input value={val} onChange={e=>set(e.target.value)} className="w-16 bg-[#252535] border border-gray-600 text-white px-2 py-0.5 rounded font-mono"/>
                  </label>
                ))}
                <div className="flex items-center gap-1 text-gray-500">Норма: <span className="text-yellow-400 font-bold">150 м</span> (СП 34)</div>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-green-500"/>
                <span className="text-green-400">{stations.filter(s=>s.ok).length} пикетов — видимость в норме</span>
                <div className="w-3 h-3 rounded-full bg-red-500 ml-2"/>
                <span className="text-red-400">{stations.filter(s=>!s.ok).length} — не соответствует</span>
              </div>
              <table className="w-full border-collapse">
                <thead><tr className="bg-[#0d1117]">{["Пикет","Расст. видим.","Норма","Статус"].map(h=><th key={h} className="px-2 py-1 text-gray-400 border border-gray-800 text-left font-normal">{h}</th>)}</tr></thead>
                <tbody>{stations.map((s,i)=>(
                  <tr key={i} className="hover:bg-[#252535]">
                    <td className="px-2 py-0.5 border border-gray-800 text-[#4fc3f7] font-mono">{s.pk}</td>
                    <td className={`px-2 py-0.5 border border-gray-800 font-mono font-bold ${s.ok?"text-green-400":"text-red-400"}`}>{s.sight} м</td>
                    <td className="px-2 py-0.5 border border-gray-800 text-gray-500 font-mono">{s.required} м</td>
                    <td className={`px-2 py-0.5 border border-gray-800 text-[10px] font-bold ${s.ok?"text-green-400":"text-red-400"}`}>{s.ok?"✓ OK":"⚠ Не норм."}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {tab==="parcels" && (
            <div className="space-y-2">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Земельные участки + полоса отвода (ROW)</span>
                <button className="px-2 py-0.5 bg-[#0078d4]/20 text-[#60a5fa] border border-[#0078d4]/40 rounded text-[9px]">Экспорт Shapefile</button>
              </div>
              {parcels.map((p,i)=>(
                <div key={i} className="flex items-center gap-3 p-2 rounded border border-gray-700 hover:bg-[#252535]" style={{background:"#111827"}}>
                  <div className="w-8 h-8 rounded border-2 flex items-center justify-center flex-shrink-0 text-[9px] font-bold"
                    style={{borderColor:p.type==="Дорога/ROW"?"#f97316":p.type==="С/х"?"#4ade80":"#60a5fa",color:p.type==="Дорога/ROW"?"#f97316":p.type==="С/х"?"#4ade80":"#60a5fa"}}>
                    {p.id.split("-")[1]}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-semibold">{p.id} · {p.owner}</div>
                    <div className="text-gray-500 text-[9px]">{p.area} · Пер-р {p.perim} · {p.type}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-4 py-2 border-t border-gray-700 flex-shrink-0 bg-[#151525]">
          <button onClick={onClose} className="px-3 py-1.5 bg-[#2a2a3e] text-gray-300 rounded text-[11px]">Закрыть</button>
          <button onClick={onClose} className="px-4 py-1.5 bg-[#0078d4] text-white rounded text-[11px]">Применить</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Navigation modules list ──────────────────────────────────────────────────

const NAV_MODULES = [
  { id: "civilcad",   icon: "Monitor",        label: "ЛАПА — Редактор" },
  { id: "viewer3d",   icon: "Box",            label: "3D-вьюер" },
  { id: "projects",   icon: "FolderKanban",   label: "Управление проектами" },
  { id: "geodesy",    icon: "Mountain",       label: "Геодезия и рельеф" },
  { id: "alignment",  icon: "Spline",         label: "Профили и выравнивания" },
  { id: "corridor",   icon: "Navigation",     label: "Коридоры и поперечники" },
  { id: "roads",      icon: "Route",          label: "Дороги и трассы" },
  { id: "railway",    icon: "Train",          label: "Ж/д пути" },
  { id: "networks",   icon: "Network",        label: "Инженерные сети" },
  { id: "areas",      icon: "LayoutDashboard",label: "Площадные объекты" },
  { id: "bim",        icon: "Layers",         label: "BIM-инструменты" },
  { id: "analysis",   icon: "BarChart3",      label: "Анализ и расчёты" },
  { id: "specs",      icon: "ClipboardList",  label: "Ведомости и спецификации" },
  { id: "surfaces",   icon: "Triangle",       label: "Поверхности TIN / Grid" },
  { id: "integration",icon: "Puzzle",         label: "Интеграция ЛАПА" },
  { id: "standards",  icon: "BookCheck",      label: "Стандарты проектирования" },
  { id: "dynamic",    icon: "RefreshCw",      label: "Динамические модели" },
]

// ─── Main export ─────────────────────────────────────────────────────────────

export default function CivilCADModule({ onNavigate }: { onNavigate?: (id: string) => void } = {}) {
  // ── Project store (синхронизация с другими модулями) ─────────────────────
  const store = useContext(ProjectContext)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [treeData, setTreeData] = useState<TreeNode[]>(TREE)
  const [selectedNode, setSelectedNode] = useState<string | null>("c1")
  const [visLayers, setVisLayers] = useState({ surfaces: true, alignments: true, corridors: true, pipenet: true, points: true, grid: true, sites: true })
  const [viewMode, setViewMode] = useState("wireframe")
  const [zoom, setZoom] = useState(1.1)
  const [pan, setPan] = useState({ x: 30, y: 20 })
  const drag = useRef<{ x: number; y: number } | null>(null)
  const [showCorridor, setShowCorridor] = useState(false)
  const [corridors, setCorridors] = useState<string[]>(["Дорога и парковочная зона"])
  const [activeMenuTab, setActiveMenuTab] = useState("Главная")
  const [activeLayout, setActiveLayout] = useState("Model")
  const [drawingTabs, setDrawingTabs] = useState(["Align-Superelevation-5.dwg"])
  const [activeDrawingTab, setActiveDrawingTab] = useState("Align-Superelevation-5.dwg")
  const [showOpenProject, setShowOpenProject] = useState(false)
  const [dbProjects, setDbProjects] = useState<{id:number;name:string;type:string;status:string;updated_at:string}[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [cursorCoords, setCursorCoords] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState("1:500")
  const [showRightPanel, setShowRightPanel] = useState(true)
  const [statusMsg, setStatusMsg] = useState("Выберите трассу: <Отмена>*")
  const [commandLine, setCommandLine] = useState("")
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [showSurface, setShowSurface] = useState(false)
  const [showSurfaceEdit, setShowSurfaceEdit] = useState(false)
  const [surfaceEditName, setSurfaceEditName] = useState("Существующая поверхность")
  const [showDaylightFL, setShowDaylightFL] = useState(false)
  const [showDataShortcuts, setShowDataShortcuts] = useState(false)
  const [showAlignment, setShowAlignment] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showAssembly, setShowAssembly] = useState(false)
  const [showPoints, setShowPoints] = useState(false)
  const [showPipeNet, setShowPipeNet] = useState(false)
  const [showIntersection, setShowIntersection] = useState(false)
  const [showFeatureLine, setShowFeatureLine] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [analysisType, setAnalysisType] = useState("Анализ уклонов")
  const [showLayers, setShowLayers] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [exportMode, setExportMode] = useState<"export"|"print">("export")
  const [showVolume, setShowVolume] = useState(false)
  const [showDrawingSettings, setShowDrawingSettings] = useState(false)
  const [toast, setToast] = useState<string|null>(null)
  const showToast = (msg: string) => { setToast(msg); setTimeout(()=>setToast(null), 2500) }
  const [syncStatus, setSyncStatus] = useState<"ok"|"outdated">("ok")
  const [showDraw2D, setShowDraw2D] = useState(false)
  const [showAnnotation, setShowAnnotation] = useState(false)
  const [showHydrology, setShowHydrology] = useState(false)
  const [propsTab, setPropsTab] = useState<"Стиль"|"Метка"|"Слой"|"Данные">("Стиль")
  const [showTransportation, setShowTransportation] = useState(false)
  const [showHydrologyModule, setShowHydrologyModule] = useState(false)
  const [showDaylightFL2, setShowDaylightFL2] = useState(false)
  const [showHRA, setShowHRA] = useState(false)
  const [showInfoDrainage, setShowInfoDrainage] = useState(false)
  const [showFormaData, setShowFormaData] = useState(false)
  const [showDWTTemplates, setShowDWTTemplates] = useState(false)
  const [showRealityCapture, setShowRealityCapture] = useState(false)
  const [showGISIntegration, setShowGISIntegration] = useState(false)
  const [showVolumeDashboard, setShowVolumeDashboard] = useState(false)
  const [showConstructionPhases, setShowConstructionPhases] = useState(false)
  const [showRevitExchange, setShowRevitExchange] = useState(false)
  const [showGeotechnical, setShowGeotechnical] = useState(false)
  const [showGrading, setShowGrading] = useState(false)
  const [showTunnel, setShowTunnel] = useState(false)
  const [showProjectExplorer, setShowProjectExplorer] = useState(false)
  const [showRailTrack, setShowRailTrack] = useState(false)
  const [showBridgeModeler, setShowBridgeModeler] = useState(false)
  const [showIntersectionWizard, setShowIntersectionWizard] = useState(false)
  const [showRoundabout, setShowRoundabout] = useState(false)
  const [showSurveyDB, setShowSurveyDB] = useState(false)
  const [showSurfaceAdv, setShowSurfaceAdv] = useState(false)
  const [surfaceAdvMode, setSurfaceAdvMode] = useState<"breaklines"|"voids"|"stats"|"compare"|"interpolation">("breaklines")
  const [showSampleLines, setShowSampleLines] = useState(false)
  const [showPressureNet, setShowPressureNet] = useState(false)
  const [showMassHaul, setShowMassHaul] = useState(false)
  const [showPlanProd, setShowPlanProd] = useState(false)
  const [showVisibility, setShowVisibility] = useState(false)
  const [showInsights, setShowInsights] = useState(false)
  const [showWhatsNewVer, setShowWhatsNewVer] = useState(false)
  const [verFeature, setVerFeature] = useState<VersionFeatureId | null>(null)
  const [showScriptEditor, setShowScriptEditor] = useState(false)
  const [scriptType, setScriptType] = useState<"autolisp" | "dynamo" | "assistant">("autolisp")
  const [scriptOutput, setScriptOutput] = useState<string[]>([])
  const [scriptRunning, setScriptRunning] = useState(false)
  const [dynamoNodes, setDynamoNodes] = useState<{id:string;type:string;x:number;y:number;label:string;color:string;connected?:string}[]>([
    {id:"n1",type:"input",x:20,y:30,label:"Surface.Points",color:"#0078d4"},
    {id:"n2",type:"filter",x:120,y:20,label:"List.FilterByBool",color:"#7c3aed"},
    {id:"n3",type:"output",x:220,y:30,label:"FeatureLine.ByPts",color:"#059669",connected:"n2"},
    {id:"n4",type:"input",x:20,y:80,label:"Alignment.ByName",color:"#0078d4"},
    {id:"n5",type:"math",x:120,y:75,label:"Math.RemapRange",color:"#d97706",connected:"n4"},
  ])
  const [selectedDynamoNode, setSelectedDynamoNode] = useState<string|null>(null)

  const AUTOLISP_SCRIPTS = [
    { name: "AUTOKORIDOR", label: "Авто-коридор", code: `; Создать коридор по выбранной трассе\n(defun c:AUTOKORIDOR ( / al name)\n  (setq al (car (entsel "\\nВыберите трассу: ")))\n  (if al\n    (progn\n      (setq name (strcat "КОР-" (itoa (fix (getvar "TDCREATE")))))\n      (command "._CORRIDOR" al name)\n      (princ (strcat "\\nКоридор создан: " name))\n    )\n    (princ "\\nОтмена.")\n  )\n  (princ)\n)` },
    { name: "EXPORTPTS", label: "Экспорт точек", code: `; Экспорт всех точек в CSV\n(defun c:EXPORTPTS ( / f ss ent pt n)\n  (setq f (open "C:\\\\pts_export.csv" "w"))\n  (write-line "ID,X,Y,Z,Desc" f)\n  (setq ss (ssget "X" '((0 . "POINT"))))\n  (setq n 0)\n  (while (< n (sslength ss))\n    (setq ent (ssname ss n))\n    (setq pt (cdr (assoc 10 (entget ent))))\n    (write-line\n      (strcat (itoa n) ","\n        (rtos (car pt) 2 3) ","\n        (rtos (cadr pt) 2 3) ","\n        (rtos (caddr pt) 2 3) ",TOPO")\n      f)\n    (setq n (1+ n))\n  )\n  (close f)\n  (alert (strcat "Экспортировано точек: " (itoa n)))\n  (princ)\n)` },
    { name: "RENAMEOBJS", label: "Переименование", code: `; Переименовать объекты Civil 3D по маске\n(defun c:RENAMEOBJS ( / prefix n ss ent)\n  (setq prefix (getstring T "\\nПрефикс имени: "))\n  (setq ss (ssget))\n  (setq n 1)\n  (if (and prefix ss)\n    (progn\n      (repeat (sslength ss)\n        (setq ent (ssname ss (1- n)))\n        (command "._RENAME" ent\n          (strcat prefix (itoa n)))\n        (setq n (1+ n))\n      )\n      (princ (strcat "\\nПереименовано: " (itoa (1- n)) " объектов"))\n    )\n  )\n  (princ)\n)` },
    { name: "SURFSTATS", label: "Стат. поверхности", code: `; Статистика по поверхности\n(defun c:SURFSTATS ( / surf stats)\n  (setq surf (car (entsel "\\nВыберите поверхность: ")))\n  (if surf\n    (progn\n      (princ "\\n--- Статистика поверхности ---")\n      (princ "\\nМин. отметка: 118.40 м")\n      (princ "\\nМакс. отметка: 135.72 м")\n      (princ "\\nСредняя отметка: 124.81 м")\n      (princ "\\nПлощадь: 48230.5 м²")\n      (princ "\\nТочек: 1847")\n      (princ "\\nТреугольников: 3691")\n    )\n  )\n  (princ)\n)` },
    { name: "BATCHPROFILE", label: "Пакет профилей", code: `; Создать профили по всем трассам\n(defun c:BATCHPROFILE ( / al-list n)\n  (setq al-list '("Трасса ШД-38" "Ул. Трумана" "Бордюр периметра"))\n  (setq n 0)\n  (foreach al al-list\n    (command "._PROFILECREATE" al\n      (strcat "Проект_" al) "" "")\n    (setq n (1+ n))\n    (princ (strcat "\\nПрофиль создан для: " al))\n  )\n  (princ (strcat "\\nГотово. Создано профилей: " (itoa n)))\n  (princ)\n)` },
  ]

  const DYNAMO_SCRIPTS = [
    { name: "FeatureLines", label: "Хар. линии", nodes: [
      {id:"n1",type:"input",x:15,y:25,label:"Surface.ByName",color:"#0078d4"},
      {id:"n2",type:"process",x:105,y:25,label:"Surface.Points",color:"#7c3aed",connected:"n1"},
      {id:"n3",type:"output",x:200,y:25,label:"FeatureLine.ByPts",color:"#059669",connected:"n2"},
    ]},
    { name: "Corridors", label: "Коридоры", nodes: [
      {id:"n1",type:"input",x:15,y:20,label:"Alignment.All",color:"#0078d4"},
      {id:"n2",type:"input",x:15,y:60,label:"Profile.ByAlign",color:"#0078d4"},
      {id:"n3",type:"process",x:105,y:35,label:"Corridor.ByLines",color:"#7c3aed",connected:"n1"},
      {id:"n4",type:"output",x:200,y:35,label:"Corridor.Rebuild",color:"#059669",connected:"n3"},
    ]},
    { name: "ExportCSV", label: "Экспорт CSV", nodes: [
      {id:"n1",type:"input",x:15,y:30,label:"CivilObject.All",color:"#0078d4"},
      {id:"n2",type:"filter",x:105,y:20,label:"List.FilterType",color:"#d97706",connected:"n1"},
      {id:"n3",type:"math",x:105,y:55,label:"Object.GetProps",color:"#d97706",connected:"n1"},
      {id:"n4",type:"output",x:200,y:35,label:"CSV.WriteToFile",color:"#059669",connected:"n2"},
    ]},
  ]

  const [autoLispSnippet, setAutoLispSnippet] = useState(AUTOLISP_SCRIPTS[0].code)
  const [dynamoScript, setDynamoScript] = useState(DYNAMO_SCRIPTS[0].name)

  const runScript = () => {
    const t = new Date().toLocaleTimeString("ru")
    setScriptRunning(true)
    const lines = [
      `[${t}] ▶ Запуск: ${scriptType === "autolisp" ? "AutoLISP" : scriptType === "dynamo" ? "Dynamo для ЛАПА 4.0" : "ЛАПА AI"} ...`,
    ]
    if (scriptType === "autolisp") {
      const match = autoLispSnippet.match(/\(defun c:(\w+)/)
      const fnName = match ? match[1] : "SCRIPT"
      lines.push(`[${t}] Парсинг: ${fnName} — OK`)
      lines.push(`[${t}] Загрузка Лапа API...`)
      lines.push(`[${t}] Выполнение c:${fnName}()...`)
      if (autoLispSnippet.includes("ssget") || autoLispSnippet.includes("entsel")) {
        lines.push(`[${t}] Выбрано объектов: ${canvasObjects.length}`)
      }
      if (autoLispSnippet.includes("CORRIDOR") || autoLispSnippet.includes("КОРИДОР")) {
        lines.push(`[${t}] Коридор обработан: Дорога ШД-38`)
        setCorridors(prev => prev.includes("КОР-AutoLISP") ? prev : [...prev, "КОР-AutoLISP"])
      }
      if (autoLispSnippet.includes("write-line") || autoLispSnippet.includes("open")) {
        lines.push(`[${t}] Файл записан: pts_export.csv (${canvasObjects.filter(o=>o.type==="point").length} точек)`)
      }
      if (autoLispSnippet.includes("SURFSTATS") || autoLispSnippet.includes("Статистика")) {
        lines.push(`[${t}] Мин: 118.40м  Макс: 135.72м  Ср: 124.81м`)
      }
      lines.push(`[${t}] ✓ Готово. Объектов затронуто: ${Math.max(1, canvasObjects.length)}`)
    } else if (scriptType === "dynamo") {
      lines.push(`[${t}] Dynamo Core 4.0.2 (PythonNet3) инициализирован`)
      lines.push(`[${t}] Граф: ${dynamoScript}`)
      const sc = DYNAMO_SCRIPTS.find(s => s.name === dynamoScript)
      if (sc) {
        lines.push(`[${t}] Узлов в графе: ${sc.nodes.length}`)
        sc.nodes.forEach(n => lines.push(`[${t}]   ${n.label}: вычислен ✓`))
      }
      lines.push(`[${t}] ✓ Граф выполнен. Результатов: ${dynamoNodes.filter(n=>n.type==="output").length}`)
    }
    setTimeout(() => {
      setScriptOutput(lines)
      setScriptRunning(false)
      showToast("✓ Скрипт выполнен успешно")
    }, 600)
  }
  const [draw2DObjects, setDraw2DObjects] = useState<{type:string;name:string;id:string}[]>([])
  const [activeProjectObjects, setActiveProjectObjects] = useState<{object_type:string;name:string;data:Record<string,unknown>}[]>([])
  const [viewDimension, setViewDimension] = useState<"3D"|"2D">("3D")
  const [undoStack, setUndoStack] = useState<string[]>(["Начальное состояние"])
  const [redoStack, setRedoStack] = useState<string[]>([])
  const [showAbout, setShowAbout] = useState(false)
  const [mdiZoom, setMdiZoom] = useState(1)
  const [mdiPan,  setMdiPan]  = useState({ x: 0, y: 0 })
  const mdiDrag = useRef<{ startX: number; startY: number; startPan: { x: number; y: number } } | null>(null)

  // ── Civil 3D Engine — живая сцена ─────────────────────────────────────────
  const [civilScene] = useState<CivilScene>(() => buildDemoScene())
  // Текущая активная станция (синхронизирует курсор между видами)
  const [activeStation, setActiveStation] = useState<number>(0)
  // Выбранный объект в Properties palette
  const [selectedCivilObject, setSelectedCivilObject] = useState<{
    type: string; id: string; name: string; props: Record<string, string|number>
  } | null>(null)
  // Тип активного MDI-вида для каждого окна
  const [mdiViewTypes, setMdiViewTypes] = useState<("plan"|"profile"|"section"|"3d")[]>(["plan","profile","section","3d"])
  // Показать Properties palette
  const [showPropertiesPalette, setShowPropertiesPalette] = useState(false)

  // ── Split viewport state ─────────────────────────────────────────────────
  const [splitView, setSplitView] = useState(false)
  const [splitRatio, setSplitRatio] = useState(0.38)
  const splitDragRef = useRef<boolean>(false)
  const splitStartY = useRef<number>(0)
  const splitStartRatio = useRef<number>(0)
  const viewportContainerRef = useRef<HTMLDivElement>(null)

  // ── Superelevation dialog state ──────────────────────────────────────────
  const [showSuperelevation, setShowSuperelevation] = useState(false)

  // ── New dialog states ─────────────────────────────────────────────────────
  const [showEarthworks, setShowEarthworks] = useState(false)
  const [showProjectManager, setShowProjectManager] = useState(false)
  const [showSurveyTraverse, setShowSurveyTraverse] = useState(false)
  const [toolspaceTab, setToolspaceTab] = useState<"prospector"|"navigator"|"settings"|"survey"|"toolbox">("prospector")
  const [multiViewport, setMultiViewport] = useState(false)
  const [viewportLayout, setViewportLayout] = useState<"single"|"2h"|"2v"|"3"|"4">("single")

  // ── Start screen state ───────────────────────────────────────────────────
  const [showStartScreen, setShowStartScreen] = useState(true)
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false)
  const [showGraphicsBanner, setShowGraphicsBanner] = useState(false)
  const [currentProjectId, setCurrentProjectId] = useState<number|null>(null)
  const [currentProjectName, setCurrentProjectName] = useState<string>("")
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveToProjectId, setSaveToProjectId] = useState<number|null>(null)
  const [saveProjects, setSaveProjects] = useState<{id:number;name:string;type:string}[]>([])
  const [savingToDb, setSavingToDb] = useState(false)

  // ── Adaptation dialog state ──────────────────────────────────────────────
  const [showAdaptation, setShowAdaptation] = useState(false)

  // ── Side tab state ───────────────────────────────────────────────────────
  const [activeSideTab, setActiveSideTab] = useState<string|null>(null)

  // ── Progress indicator state ──────────────────────────────────────────────
  const [progressOp, setProgressOp] = useState<{label:string;pct:number}|null>(null)
  const showProgress = (label: string) => {
    setProgressOp({ label, pct: 0 })
    const interval = setInterval(() => {
      setProgressOp(prev => {
        if (!prev || prev.pct >= 100) { clearInterval(interval); return null }
        return { ...prev, pct: prev.pct + Math.random() * 25 + 5 }
      })
    }, 200)
  }

  // ── Cursor screen position ───────────────────────────────────────────────
  const [cursorScreen, setCursorScreen] = useState({ x: 0, y: 0 })

  // ── New Civil 3D 2027 features state ─────────────────────────────────────
  const [showGeoMenu, setShowGeoMenu] = useState(false)
  const [geoSettings, setGeoSettings] = useState<Record<string,boolean>>({
    "Пространство модели": true, "Сетка": true, "Режим привязки": true,
    "Подразумеваемые зависимости": false, "Динамический ввод": true,
    "Режим «Орто»": true, "Полярное отслеживание": true,
    "Изометрическое проектирование": false, "Отслеживание привязки к объектам": true,
    "Объектная привязка 2D": true, "Толщина линий": false, "Прозрачность": false,
    "Циклический выбор": false, "Объектная привязка 3D": false, "Динамическая ПСК": false,
    "Фильтрация выбора": false, "Видимость аннотаций": true, "Автомасштаб": true,
    "Масштаб аннотаций": true, "Переключение рабочего пространства": true,
    "Монитор аннотаций": true, "Единицы": false, "Быстрые свойства": false,
    "Блокировка элементов интерфейса": false, "Изолировать объекты": true,
    "Производительность графики": false, "Значок секущей плоскости": true,
    "Текст секущей плоскости": true, "Группа адаптивных меток": true,
    "Включить/отключить метку": false,
  })
  const [contextMenu, setContextMenu] = useState<{x:number;y:number;wx:number;wy:number}|null>(null)
  const [showAssistant, setShowAssistant] = useState(false)
  const [assistantMessages, setAssistantMessages] = useState<{role:"user"|"bot";text:string}[]>([
    {role:"bot", text:"Привет! Я ЛАПА-Ассистент. Спросите о ЛАПА 3D — создании трасс, коридоров, поверхностей, HRA, характерных линиях выхода на рельеф. Готов помочь!"}
  ])
  const [assistantInput, setAssistantInput] = useState("")

  const sendAssistantMessage = (text: string) => {
    if (!text.trim()) return
    const userMsg = { role: "user" as const, text: text.trim() }
    setAssistantMessages(prev => [...prev, userMsg])
    setAssistantInput("")
    const t = text.toLowerCase()
    let reply = "Команда принята. Уточните параметры объекта."
    if (t.includes("трасс")) reply = "Для создания трассы: лента «Главная» → «Трасса» или команда ТРАССА. Укажите имя, тип, стиль и элементы геометрии (прямые, кривые, клотоиды)."
    else if (t.includes("коридор")) reply = "Коридор создаётся на основе трассы + профиля + типового сечения. Лента «Главная» → «Коридор» или команда КОРИДОР."
    else if (t.includes("поверхност") || t.includes("tin")) reply = "TIN-поверхность строится из точек, горизонталей или DEM. Лента «Главная» → «Поверхности» или команда ПОВЕРХНОСТЬ."
    else if (t.includes("точк")) reply = "Точки импортируются из CSV/TXT или вводятся вручную. Лента «Съёмка» → «Создать точки» или команда ТОЧКИ."
    else if (t.includes("профил")) reply = "Профиль строится по трассе и поверхности. Лента «Главная» → «Профиль» или команда ПРОФИЛЬ."
    else if (t.includes("экспорт") || t.includes("dwg") || t.includes("pdf")) reply = "Экспорт: лента «Вывод» → «Экспорт» (DWG, LandXML, IFC, PDF, CSV). Команда ЭКСПОРТ."
    else if (t.includes("земляных") || t.includes("объём")) reply = "Объёмы земляных работ: лента «Анализ» → «Объёмы» или команда ЗЕМЛЯ. Поддерживается метод по сечениям и призматоида."
    else if (t.includes("привязк")) reply = "Объектные привязки настраиваются через «Геопозиционирование» в ленте — там панель с галочками всех режимов привязки."
    else if (t.includes("dynamo")) reply = "Dynamo для ЛАПА 3D (Core 4.0.2): откройте «Надстройки» → «Редактор скриптов» → вкладка Dynamo. PythonNet3 — механизм по умолчанию."
    else if (t.includes("невязк") || t.includes("теодолит")) reply = "Отчёт о невязке: лента «Съёмка» → «Отчёт о невязке» или команда НЕВЯЗКА."
    else if (t.includes("горизонтальн") || t.includes("регресс") || t.includes("hra")) reply = "Анализ горизонтальной регрессии (HRA, 2026.1+): вписывает проектную трассу в съёмку. Лента «Анализ» → «Трасса» → «Горизонтальная регрессия»."
    else if (t.includes("характерн") || t.includes("выход на рельеф")) reply = "Характерная линия выхода на рельеф (ЛАПА 3D): автоматизирует профилирование склонов. Лента «Главная» → «Хар. линия» → «Выход на рельеф»."
    else if (t.includes("дренаж") || t.includes("infodrainage")) reply = "Инструменты дренажа ЛАПА: интеграция с InfoDrainage. Лента «Анализ» → «Гидравлика» → «Дренаж InfoDrainage»."
    else if (t.includes("мост")) reply = "Мосты: дерево объектов → «Мосты» → ПКМ → «Создать мост». Требуется трасса и профиль."
    else if (t.includes("каталог труб") || t.includes("forma")) reply = "Каталог труб/напорных труб теперь интегрирован с Forma Data Management. Лента «Вставка» → «Диспетчер источников данных»."
    else if (t.includes(".net") || t.includes("net 10")) reply = "ЛАПА 3D поддерживает .NET 10. Старые плагины .NET Framework нужно перекомпилировать под .NET 10."
    setTimeout(() => setAssistantMessages(prev => [...prev, { role: "bot", text: reply }]), 450)
  }

  // ── Edit state ───────────────────────────────────────────────────────────
  const [activeTool, setActiveTool] = useState<EditTool>("select")
  // Редактор всегда открывается с чистым холстом.
  // Сохранённый чертёж активного проекта подгружается отдельным эффектом ниже.
  const [canvasObjects, setCanvasObjects] = useState<CanvasObject[]>([])
  const [selectedObjId, setSelectedObjId] = useState<string | null>(null)
  const [drawingPts, setDrawingPts] = useState<[number,number][]>([])
  const [cursorCanvasPos, setCursorCanvasPos] = useState<[number,number] | null>(null)
  const [snapPos, setSnapPos] = useState<[number,number] | null>(null)
  const [showProperties, setShowProperties] = useState(false)
  const [editingProp, setEditingProp] = useState<{id:string, key:string, val:string} | null>(null)
  const moveRef = useRef<{objId:string; startMouse:[number,number]; startPts:[number,number][]} | null>(null)

  const pushUndo = (label: string) => {
    setUndoStack(prev => [...prev, label])
    setRedoStack([])
  }

  const очиститьХолст = () => {
    if (canvasObjects.length === 0) { showToast("Холст уже пуст"); return }
    if (!window.confirm(`Очистить холст? Будет удалено объектов: ${canvasObjects.length}`)) return
    pushUndo(`Очистка холста (${canvasObjects.length})`)
    canvasObjects.forEach(o => deleteCanvasObject(o.id))
    setCanvasObjects([])
    setSelectedObjId(null)
    setDrawingPts([])
    showToast("Холст очищен")
    setStatusMsg("Холст очищен — можно чертить с нуля")
  }

  const загрузитьПример = () => {
    setCanvasObjects(INITIAL_CANVAS_OBJECTS)
    setSelectedObjId(null)
    showToast("Загружен демо-чертёж")
    setStatusMsg("Демо-чертёж загружен")
  }

  const doUndo = () => {
    setUndoStack(prev => {
      if (prev.length <= 1) return prev
      const last = prev[prev.length - 1]
      setRedoStack(r => [...r, last])
      showToast(`↩ Отменено: ${last}`)
      return prev.slice(0, -1)
    })
  }
  const doRedo = () => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      setUndoStack(u => [...u, last])
      showToast(`↪ Повторено: ${last}`)
      return prev.slice(0, -1)
    })
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpenDropdown(null)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const API = "https://functions.poehali.dev/0413bfb5-1eee-4ebd-91f9-66e74d563887"

  const activeProjectId = () => store?.activeProject?.id ?? currentProjectId ?? 1

  const saveObject = (type: string, name: string, data: Record<string, unknown> = {}) => {
    pushUndo(`Создан ${type}: ${name}`)
    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: activeProjectId(), object_type: type, name, data }),
    }).catch(() => {})
  }

  const saveCanvasObject = (obj: CanvasObject) => {
    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: activeProjectId(),
        object_type: obj.type,
        name: obj.label,
        data: { canvas_id: obj.id, pts: obj.pts, color: obj.color, lineWidth: obj.lineWidth, layer: obj.layer ?? "0", properties: obj.properties ?? {} }
      }),
    }).catch(() => {})
  }

  const deleteCanvasObject = (canvasId: string) => {
    fetch(API, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canvas_id: canvasId }),
    }).catch(() => {})
  }

  const updateCanvasObject = (obj: CanvasObject) => {
    fetch(`${API}?object_id=canvas`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        canvas_id: obj.id,
        data: { canvas_id: obj.id, pts: obj.pts, color: obj.color, lineWidth: obj.lineWidth, layer: obj.layer ?? "0", properties: obj.properties ?? {} }
      }),
    }).catch(() => {})
  }

  // ── Автозагрузка сохранённого чертежа активного проекта ──────────────────
  const активныйProjectId = store?.activeProject?.id
  useEffect(() => {
    if (!активныйProjectId) return
    setCurrentProjectId(активныйProjectId)
    setCurrentProjectName(store?.activeProject?.name || "")
    fetch(`${API}?project_id=${активныйProjectId}`)
      .then(r => r.json())
      .then((raw: unknown) => {
        const rows: { object_type: string; name: string; data?: Record<string, unknown> }[] =
          Array.isArray(raw) ? raw : (typeof raw === "string" ? JSON.parse(raw) : [])
        const restored: CanvasObject[] = rows
          .filter(r => r.data && Array.isArray((r.data as { pts?: unknown }).pts))
          .map(r => {
            const d = r.data as { canvas_id?: string; pts: [number, number][]; color?: string; lineWidth?: number; layer?: string; properties?: Record<string, string> }
            return {
              id: d.canvas_id || `obj_${Math.random().toString(36).slice(2)}`,
              type: r.object_type as CanvasObjType,
              label: r.name,
              pts: d.pts,
              color: d.color || "#22d3ee",
              lineWidth: d.lineWidth,
              layer: d.layer ?? "0",
              properties: d.properties ?? {},
            }
          })
        setCanvasObjects(restored)
      })
      .catch(() => {})
  }, [активныйProjectId])

  const openProjectDialog = () => {
    setShowOpenProject(true)
    setLoadingProjects(true)
    fetch("https://functions.poehali.dev/0413bfb5-1eee-4ebd-91f9-66e74d563887")
      .then(r => r.json())
      .then(data => setDbProjects(data))
      .catch(() => {})
      .finally(() => setLoadingProjects(false))
  }

  const openProject = (project: {id:number;name:string}) => {
    const tabName = `${project.name}.dwg`
    if (!drawingTabs.includes(tabName)) setDrawingTabs(prev => [...prev, tabName])
    setActiveDrawingTab(tabName)
    setShowOpenProject(false)
    setStatusMsg(`Открыт проект: ${project.name}`)
    showToast(`📂 Открыт: ${project.name}`)
    fetch(`https://functions.poehali.dev/0413bfb5-1eee-4ebd-91f9-66e74d563887?project_id=${project.id}`)
      .then(r => r.json())
      .then(raw => {
        // API может вернуть строку (двойная сериализация) или массив
        const objs: {object_type:string;name:string}[] = Array.isArray(raw) ? raw : (typeof raw === "string" ? JSON.parse(raw) : [])
        setActiveProjectObjects(objs)
        if (objs.length === 0) { showToast(`📂 Проект открыт (объектов нет)`); return }
        const iconMap: Record<string,string> = {corridor:'Navigation',surface:'Triangle',alignment:'Minus',profile:'TrendingUp',pipe_network:'Network',points:'MapPin',assembly:'Layers',version:'GitBranch',feature_line:'Spline',intersection:'Plus',catchment:'Droplets'}
        const colorMap: Record<string,string> = {corridor:'#f97316',surface:'#4ade80',alignment:'#f97316',pipe_network:'#6366f1',points:'#f59e0b',catchment:'#60a5fa'}
        const nodeMap: Record<string,string> = {corridor:'corridors',surface:'surfaces',alignment:'alignments',profile:'alignments',pipe_network:'pipenet',points:'points',assembly:'assemblies',feature_line:'featurelines',intersection:'intersections',catchment:'catchments'}
        setTreeData(prev => {
          let tree = [...prev]
          objs.forEach(obj => {
            const nodeId = nodeMap[obj.object_type] || 'project'
            const addToNode = (nodes: TreeNode[]): TreeNode[] => nodes.map(n =>
              n.id === nodeId
                ? {...n, expanded: true, children: [...(n.children||[]), {id:`loaded_${Date.now()}_${Math.random()}`,label:obj.name,icon:iconMap[obj.object_type]||'File',color:colorMap[obj.object_type]||'#94a3b8'}]}
                : {...n, children: n.children ? addToNode(n.children) : undefined}
            )
            tree = addToNode(tree)
          })
          return tree
        })
        showToast(`✅ Загружено объектов: ${objs.length}`)
      })
      .catch(() => { showToast(`📂 Проект открыт`) })
  }

  const toggleNode = (id: string) => {
    const toggle = (nodes: TreeNode[]): TreeNode[] =>
      nodes.map(n => n.id === id ? { ...n, expanded: !n.expanded } : { ...n, children: n.children ? toggle(n.children) : undefined })
    setTreeData(toggle)
  }

  // ── Close context menu on outside click ──────────────────────────────────
  useEffect(() => {
    const close = () => setContextMenu(null)
    if (contextMenu) { document.addEventListener("click", close); return () => document.removeEventListener("click", close) }
  }, [contextMenu])

  // ── Canvas → World coordinates ────────────────────────────────────────────
  const toWorld = useCallback((cx: number, cy: number, rect: DOMRect): [number,number] => {
    return [(cx - rect.left - pan.x) / zoom, (cy - rect.top - pan.y) / zoom]
  }, [pan, zoom])

  // ── Snap to nearest point ─────────────────────────────────────────────────
  const findSnap = useCallback((wx: number, wy: number): [number,number] | null => {
    const SNAP_R = 12 / zoom
    let best: [number,number] | null = null
    let bestD = SNAP_R
    canvasObjects.forEach(obj => {
      obj.pts.forEach(([px, py]) => {
        const d = Math.hypot(px - wx, py - wy)
        if (d < bestD) { bestD = d; best = [px, py] }
      })
    })
    return best
  }, [canvasObjects, zoom])

  // ── Hit-test: find object under cursor ────────────────────────────────────
  const hitTest = useCallback((wx: number, wy: number): string | null => {
    const HIT = 8 / zoom
    for (let i = canvasObjects.length - 1; i >= 0; i--) {
      const obj = canvasObjects[i]
      if (obj.type === "point") {
        const [px, py] = obj.pts[0]
        if (Math.hypot(px - wx, py - wy) < HIT * 2) return obj.id
      } else {
        for (let j = 0; j < obj.pts.length - 1; j++) {
          const [x1,y1] = obj.pts[j], [x2,y2] = obj.pts[j+1]
          const len = Math.hypot(x2-x1, y2-y1); if (len < 0.001) continue
          const t = Math.max(0, Math.min(1, ((wx-x1)*(x2-x1)+(wy-y1)*(y2-y1))/(len*len)))
          const nearX = x1 + t*(x2-x1), nearY = y1 + t*(y2-y1)
          if (Math.hypot(nearX-wx, nearY-wy) < HIT) return obj.id
        }
      }
    }
    return null
  }, [canvasObjects, zoom])

  // ── Draw canvas objects on top of base drawing ────────────────────────────
  const drawObjects = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)

    canvasObjects.forEach(obj => {
      const isSelected = obj.id === selectedObjId
      ctx.strokeStyle = isSelected ? "#ffffff" : obj.color
      ctx.lineWidth = (obj.lineWidth ?? 2) / zoom
      if (isSelected) { ctx.setLineDash([6/zoom, 3/zoom]) } else { ctx.setLineDash([]) }

      if (obj.type === "point") {
        const [px,py] = obj.pts[0]
        ctx.beginPath(); ctx.arc(px, py, 5/zoom, 0, Math.PI*2)
        ctx.fillStyle = obj.color; ctx.fill()
        ctx.strokeStyle = isSelected ? "#ffffff" : "rgba(255,255,255,0.6)"
        ctx.lineWidth = 1/zoom; ctx.stroke()
        ctx.fillStyle = obj.color; ctx.font = `bold ${9/zoom}px monospace`
        ctx.fillText(obj.label, px+7/zoom, py-4/zoom)
        if (isSelected) {
          ctx.beginPath(); ctx.arc(px, py, 9/zoom, 0, Math.PI*2)
          ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5/zoom
          ctx.setLineDash([3/zoom, 2/zoom]); ctx.stroke(); ctx.setLineDash([])
        }
      } else if (obj.pts.length > 1) {
        ctx.beginPath()
        ctx.moveTo(obj.pts[0][0], obj.pts[0][1])
        for (let i = 1; i < obj.pts.length; i++) ctx.lineTo(obj.pts[i][0], obj.pts[i][1])
        if (obj.type === "alignment" && obj.id === "al_perim") ctx.closePath()
        ctx.stroke()
        const mid = obj.pts[Math.floor(obj.pts.length/2)]
        ctx.setLineDash([])
        ctx.fillStyle = obj.color; ctx.font = `bold ${10/zoom}px Arial`
        ctx.fillText(obj.label, mid[0]+4/zoom, mid[1]-6/zoom)
      }

      // Grip points on selected object
      if (isSelected) {
        ctx.setLineDash([])
        obj.pts.forEach(([gx,gy]) => {
          ctx.beginPath(); ctx.rect(gx-5/zoom, gy-5/zoom, 10/zoom, 10/zoom)
          ctx.fillStyle = "#0078d4"; ctx.fill()
          ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1/zoom; ctx.stroke()
        })
        if (obj.pts.length > 1) {
          const mid = obj.pts[Math.floor(obj.pts.length/2)]
          ctx.beginPath(); ctx.arc(mid[0], mid[1], 5/zoom, 0, Math.PI*2)
          ctx.fillStyle = "#22c55e"; ctx.fill()
          ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1/zoom; ctx.stroke()
        }
      }
    })

    // Draw in-progress polyline/line
    if (drawingPts.length > 0 && cursorCanvasPos) {
      ctx.setLineDash([6/zoom, 3/zoom])
      ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 1.5/zoom
      ctx.beginPath(); ctx.moveTo(drawingPts[0][0], drawingPts[0][1])
      for (let i = 1; i < drawingPts.length; i++) ctx.lineTo(drawingPts[i][0], drawingPts[i][1])
      const snp = snapPos ?? cursorCanvasPos
      ctx.lineTo(snp[0], snp[1]); ctx.stroke()
      drawingPts.forEach(([px,py]) => {
        ctx.beginPath(); ctx.arc(px, py, 4/zoom, 0, Math.PI*2)
        ctx.fillStyle = "#22d3ee"; ctx.fill()
      })
      ctx.setLineDash([])
    }

    // Snap indicator
    if (snapPos) {
      ctx.beginPath()
      ctx.moveTo(snapPos[0]-8/zoom, snapPos[1]); ctx.lineTo(snapPos[0]+8/zoom, snapPos[1])
      ctx.moveTo(snapPos[0], snapPos[1]-8/zoom); ctx.lineTo(snapPos[0], snapPos[1]+8/zoom)
      ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 1.5/zoom; ctx.stroke()
      ctx.beginPath(); ctx.arc(snapPos[0], snapPos[1], 5/zoom, 0, Math.PI*2)
      ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 1/zoom; ctx.stroke()
    }

    ctx.restore()
  }, [canvasObjects, selectedObjId, drawingPts, cursorCanvasPos, snapPos, pan, zoom])

  const draw = useCallback(() => {
    const c = canvasRef.current; if (!c || c.width < 10) return
    const ctx = c.getContext("2d")!
    drawCanvas(ctx, c.width, c.height, visLayers, zoom, pan.x, pan.y, viewMode)
    drawObjects(ctx)
  }, [visLayers, zoom, pan, viewMode, drawObjects])

  useEffect(() => {
    const c = canvasRef.current; if (!c) return
    const ro = new ResizeObserver(() => { c.width = c.offsetWidth; c.height = c.offsetHeight; draw() })
    ro.observe(c); c.width = c.offsetWidth; c.height = c.offsetHeight; draw()
    return () => ro.disconnect()
  }, [draw])

  useEffect(() => { draw() }, [draw])

  // ── Синхронизация canvasObjects → store (live 3D) ─────────────────────────
  useEffect(() => {
    if (store) store.setLiveCanvasObjects(canvasObjects)
  }, [canvasObjects, store])

  // ── Delete selected ────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
      if ((e.key === "Delete" || e.key === "Backspace") && selectedObjId && !isInput) {
        const obj = canvasObjects.find(o => o.id === selectedObjId)
        if (obj) { pushUndo(`Удалено: ${obj.label}`); setCanvasObjects(prev => prev.filter(o => o.id !== selectedObjId)); deleteCanvasObject(selectedObjId); setSelectedObjId(null); showToast(`Удалён объект: ${obj.label}`) }
      }
      if (e.key === "Escape") { setDrawingPts([]); setActiveTool("select"); setSelectedObjId(null) }
      // Extended hotkeys
      if (!isInput) {
        if (e.key === "a" || e.key === "A") {
          if (activeTool === "polyline" || activeTool === "line") showToast("A: добавить вершину")
        }
        if (e.key === "d" || e.key === "D") {
          if (selectedObjId) {
            const obj = canvasObjects.find(o => o.id === selectedObjId)
            if (obj) { pushUndo(`Удалено: ${obj.label}`); setCanvasObjects(prev => prev.filter(o => o.id !== selectedObjId)); deleteCanvasObject(selectedObjId); setSelectedObjId(null); showToast(`Удалён объект: ${obj.label}`) }
          }
        }
        if (e.key === "r" || e.key === "R") {
          if (selectedObjId) showToast("R: введите новый радиус кривой")
        }
        if (e.key === "g" || e.key === "G") {
          showToast("G: отображение отметок включено/выключено")
        }
        if (e.key === "z" || e.key === "Z") {
          showToast("Зум экстентов")
          setZoom(1.1); setPan({ x: 30, y: 20 })
        }
        if (e.key === "F3") {
          e.preventDefault()
          showToast("F3: объектная привязка вкл/выкл")
        }
        if (e.key === "S" && e.ctrlKey && e.shiftKey) {
          e.preventDefault()
          showToast("Сохранение всех файлов проекта...")
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
   
  }, [selectedObjId, canvasObjects, activeTool])

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    setZoom(z => Math.max(0.3, Math.min(6, z * (e.deltaY < 0 ? 1.12 : 0.9))))
  }

  const getCanvasRect = (e: React.MouseEvent) => (e.currentTarget as HTMLElement).getBoundingClientRect()

  const onMouseDown = (e: React.MouseEvent) => {
    const rect = getCanvasRect(e)
    const [wx, wy] = toWorld(e.clientX, e.clientY, rect)
    const snapped = findSnap(wx, wy)
    const pt: [number,number] = snapped ?? [wx, wy]

    if (activeTool === "pan" || (activeTool === "select" && e.button === 1)) {
      drag.current = { x: e.clientX, y: e.clientY }
      return
    }
    if (activeTool === "select" || activeTool === "move") {
      const hit = hitTest(wx, wy)
      if (hit) {
        setSelectedObjId(hit)
        const obj = canvasObjects.find(o => o.id === hit)!
        if (activeTool === "move") {
          moveRef.current = { objId: hit, startMouse: [wx, wy], startPts: obj.pts.map(p => [p[0], p[1]] as [number,number]) }
        }
        setShowProperties(true)
        // Civil 3D Properties Palette — заполняем реальные свойства объекта
        const civilProps: Record<string, string|number> = {}
        if (obj.type === "alignment") {
          const al = civilScene.alignment
          civilProps["Длина трассы"]     = `${al.totalLength.toFixed(3)} м`
          civilProps["Начальный пикет"]  = `ПК ${(al.startStation/100).toFixed(2)}`
          civilProps["Конечный пикет"]   = `ПК ${((al.startStation+al.totalLength)/100).toFixed(2)}`
          civilProps["Число элементов"]  = al.elements.length
          civilProps["Стиль трассы"]     = "Все метки"
          civilProps["Стиль метки"]      = "Стандартный"
          civilProps["Направление"]      = `${al.elements[0]?.startPt ? Math.atan2(al.elements[0].endPt.y-al.elements[0].startPt.y, al.elements[0].endPt.x-al.elements[0].startPt.x).toFixed(4)+" рад" : "—"}`
        } else if (obj.type === "surface") {
          const st = civilScene.surface.stats
          civilProps["Минимальная Z"]    = `${st.minZ.toFixed(3)} м`
          civilProps["Максимальная Z"]   = `${st.maxZ.toFixed(3)} м`
          civilProps["Средняя Z"]        = `${st.meanZ.toFixed(3)} м`
          civilProps["Площадь 2D"]       = `${(st.area2D/10000).toFixed(4)} га`
          civilProps["Площадь 3D"]       = `${(st.area3D/10000).toFixed(4)} га`
          civilProps["Треугольников"]    = st.triangleCount
          civilProps["Точек"]            = st.pointCount
          civilProps["Макс. уклон"]      = `${st.maxSlope.toFixed(1)}°`
          civilProps["Ср. уклон"]        = `${st.meanSlope.toFixed(1)}°`
        } else if (obj.type === "pipe") {
          civilProps["Тип"]              = "Круглая труба"
          civilProps["Диаметр"]          = "400 мм"
          civilProps["Материал"]         = "Бетон"
          civilProps["Длина"]            = `${Math.hypot(obj.pts[obj.pts.length-1][0]-obj.pts[0][0], obj.pts[obj.pts.length-1][1]-obj.pts[0][1]).toFixed(2)} м`
          civilProps["Уклон"]            = "0.003"
          civilProps["Заполнение"]       = "0.5D"
        } else if (obj.type === "point") {
          civilProps["Северная"]         = `${obj.pts[0][1].toFixed(3)}`
          civilProps["Восточная"]        = `${obj.pts[0][0].toFixed(3)}`
          civilProps["Высота"]           = `${(100 + Math.random()*15).toFixed(3)} м`
          civilProps["Имя"]              = obj.label
          civilProps["Описание"]         = "Съёмочная точка"
          civilProps["Группа точек"]     = "Все точки"
        }
        setSelectedCivilObject({ type: obj.type, id: obj.id, name: obj.label, props: civilProps })
        setShowPropertiesPalette(true)
      } else {
        setSelectedObjId(null)
        setSelectedCivilObject(null)
      }
      return
    }
    if (activeTool === "delete") {
      const hit = hitTest(wx, wy)
      if (hit) {
        const obj = canvasObjects.find(o => o.id === hit)!
        pushUndo(`Удалено: ${obj.label}`)
        setCanvasObjects(prev => prev.filter(o => o.id !== hit))
        deleteCanvasObject(hit)
        showToast(`Удалён: ${obj.label}`)
      }
      return
    }
    if (activeTool === "point") {
      const newObj: CanvasObject = { id: `pt_${Date.now()}`, type: "point", label: `Т.${canvasObjects.filter(o=>o.type==="point").length+1001}`, color: "#f59e0b", pts: [pt], layer: "C-TOPO-PNTS", properties: { "Тип": "Точка", "X": pt[0].toFixed(2), "Y": pt[1].toFixed(2), "Z": "0.00", "Слой": "C-TOPO-PNTS" } }
      pushUndo(`Добавлена точка ${newObj.label}`)
      setCanvasObjects(prev => [...prev, newObj])
      setSelectedObjId(newObj.id)
      saveCanvasObject(newObj)
      showToast(`Точка ${newObj.label} сохранена`)
      return
    }
    if (activeTool === "line") {
      if (drawingPts.length === 0) {
        setDrawingPts([pt])
      } else {
        const newObj: CanvasObject = { id: `ln_${Date.now()}`, type: "line", label: "Линия", color: "#22d3ee", lineWidth: 1.5, pts: [drawingPts[0], pt], layer: "0", properties: { "Тип": "Линия", "Длина": Math.hypot(pt[0]-drawingPts[0][0], pt[1]-drawingPts[0][1]).toFixed(1)+" м", "Слой": "0" } }
        pushUndo("Нарисована линия")
        setCanvasObjects(prev => [...prev, newObj])
        setSelectedObjId(newObj.id)
        setDrawingPts([])
        saveCanvasObject(newObj)
        showToast("Линия сохранена в проект")
      }
      return
    }
    if (activeTool === "polyline") {
      if (e.detail === 2 && drawingPts.length >= 2) {
        const newObj: CanvasObject = { id: `pl_${Date.now()}`, type: "polyline", label: "Полилиния", color: "#22d3ee", lineWidth: 1.5, pts: [...drawingPts, pt], layer: "0", properties: { "Тип": "Полилиния", "Точек": String(drawingPts.length+1), "Слой": "0" } }
        pushUndo("Нарисована полилиния")
        setCanvasObjects(prev => [...prev, newObj])
        setSelectedObjId(newObj.id)
        setDrawingPts([])
        saveCanvasObject(newObj)
        showToast("Полилиния сохранена в проект")
      } else {
        setDrawingPts(prev => [...prev, pt])
      }
      return
    }
    if (activeTool === "rect") {
      if (drawingPts.length === 0) {
        setDrawingPts([pt])
      } else {
        const [x1,y1] = drawingPts[0], [x2,y2] = pt
        const newObj: CanvasObject = { id: `rc_${Date.now()}`, type: "rect", label: "Прямоугольник", color: "#22d3ee", lineWidth: 1.5, pts: [[x1,y1],[x2,y1],[x2,y2],[x1,y2],[x1,y1]], layer: "0", properties: { "Тип": "Прямоугольник", "Ширина": Math.abs(x2-x1).toFixed(1)+" м", "Высота": Math.abs(y2-y1).toFixed(1)+" м", "Слой": "0" } }
        pushUndo("Нарисован прямоугольник")
        setCanvasObjects(prev => [...prev, newObj])
        setSelectedObjId(newObj.id)
        setDrawingPts([])
        saveCanvasObject(newObj)
        showToast("Прямоугольник сохранён в проект")
      }
      return
    }
    if (activeTool === "circle") {
      if (drawingPts.length === 0) {
        setDrawingPts([pt])
        setStatusMsg("Окружность: укажите точку на окружности")
      } else {
        const [cx,cy] = drawingPts[0]
        const r = Math.hypot(pt[0]-cx, pt[1]-cy)
        const steps = 64
        const circlePts: [number,number][] = Array.from({length: steps+1}, (_,i) => {
          const a = (i / steps) * Math.PI * 2
          return [cx + Math.cos(a)*r, cy + Math.sin(a)*r] as [number,number]
        })
        const newObj: CanvasObject = { id: `ci_${Date.now()}`, type: "circle", label: "Окружность", color: "#22d3ee", lineWidth: 1.5, pts: circlePts, layer: "0", properties: { "Тип": "Окружность", "Радиус": r.toFixed(1)+" м", "Длина": (2*Math.PI*r).toFixed(1)+" м", "Слой": "0" } }
        pushUndo("Нарисована окружность")
        setCanvasObjects(prev => [...prev, newObj])
        setSelectedObjId(newObj.id)
        setDrawingPts([])
        saveCanvasObject(newObj)
        showToast(`Окружность R=${r.toFixed(1)} сохранена`)
        setStatusMsg("Окружность: укажите центр")
      }
      return
    }
    if (activeTool === "arc") {
      if (drawingPts.length === 0) {
        setDrawingPts([pt])
        setStatusMsg("Дуга: укажите вторую точку")
      } else if (drawingPts.length === 1) {
        setDrawingPts(prev => [...prev, pt])
        setStatusMsg("Дуга: укажите третью точку")
      } else {
        const [p1, p2] = drawingPts
        const p3 = pt
        // Circumcircle through 3 points
        const ax = p1[0], ay = p1[1], bx = p2[0], by = p2[1], cx = p3[0], cy = p3[1]
        const D = 2*(ax*(by-cy)+bx*(cy-ay)+cx*(ay-by))
        if (Math.abs(D) < 0.001) {
          // collinear - draw as polyline
          const newObj: CanvasObject = { id: `ar_${Date.now()}`, type: "arc", label: "Дуга", color: "#22d3ee", lineWidth: 1.5, pts: [p1, p2, p3], layer: "0", properties: { "Тип": "Дуга", "Слой": "0" } }
          setCanvasObjects(prev => [...prev, newObj]); setSelectedObjId(newObj.id); saveCanvasObject(newObj)
        } else {
          const ux = ((ax*ax+ay*ay)*(by-cy)+(bx*bx+by*by)*(cy-ay)+(cx*cx+cy*cy)*(ay-by))/D
          const uy = ((ax*ax+ay*ay)*(cx-bx)+(bx*bx+by*by)*(ax-cx)+(cx*cx+cy*cy)*(bx-ax))/D
          const r = Math.hypot(ax-ux, ay-uy)
          const a1 = Math.atan2(ay-uy, ax-ux)
          const a3 = Math.atan2(cy-uy, cx-ux)
          const a2 = Math.atan2(by-uy, bx-ux)
          // normalize so arc goes through p2
          let da = a2 - a1; if (da < 0) da += 2*Math.PI
          let da3 = a3 - a1; if (da3 < 0) da3 += 2*Math.PI
          const ccw = da < da3
          const steps = 48
          const arcPts: [number,number][] = []
          for (let i = 0; i <= steps; i++) {
            let t: number
            if (ccw) { t = a1 + (da3 / steps) * i } else { t = a1 - ((2*Math.PI - da3) / steps) * i }
            arcPts.push([ux + Math.cos(t)*r, uy + Math.sin(t)*r])
          }
          const newObj: CanvasObject = { id: `ar_${Date.now()}`, type: "arc", label: "Дуга", color: "#22d3ee", lineWidth: 1.5, pts: arcPts, layer: "0", properties: { "Тип": "Дуга", "Радиус": r.toFixed(1)+" м", "Слой": "0" } }
          pushUndo("Нарисована дуга")
          setCanvasObjects(prev => [...prev, newObj])
          setSelectedObjId(newObj.id)
          saveCanvasObject(newObj)
          showToast(`Дуга R=${r.toFixed(1)} сохранена`)
        }
        setDrawingPts([])
        setStatusMsg("Дуга: укажите первую точку")
      }
      return
    }
    drag.current = { x: e.clientX, y: e.clientY }
  }

  const onMouseMove = (e: React.MouseEvent) => {
    const rect = getCanvasRect(e)
    const [wx, wy] = toWorld(e.clientX, e.clientY, rect)
    setCursorCoords({ x: Math.round(wx*10)/10, y: Math.round(wy*10)/10 })
    const snp = findSnap(wx, wy)
    setSnapPos(snp)
    setCursorCanvasPos([wx, wy])
    const containerRect = viewportContainerRef.current?.getBoundingClientRect()
    if (containerRect) {
      setCursorScreen({ x: e.clientX - containerRect.left, y: e.clientY - containerRect.top })
    }

    if (moveRef.current) {
      const { objId, startMouse, startPts } = moveRef.current
      const dx = wx - startMouse[0], dy = wy - startMouse[1]
      setCanvasObjects(prev => prev.map(o => o.id === objId ? { ...o, pts: startPts.map(([px,py]) => [px+dx, py+dy] as [number,number]) } : o))
      return
    }
    if (!drag.current) return
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y
    drag.current = { x: e.clientX, y: e.clientY }
    setPan(p => ({ x: p.x + dx, y: p.y + dy }))
  }

  const onMouseUp = (e: React.MouseEvent) => {
    if (moveRef.current) {
      const obj = canvasObjects.find(o => o.id === moveRef.current!.objId)
      if (obj) {
        pushUndo(`Перемещён: ${obj.label}`)
        updateCanvasObject(obj)
        showToast(`Позиция «${obj.label}» сохранена`)
      }
      moveRef.current = null
    }
    drag.current = null
    void e
  }

  const runCommand = (cmd: string) => {
    const c = cmd.trim().toUpperCase()
    if (c === "ОЧИСТИТЬ" || c === "CLEAR" || c === "ERASE ALL") { очиститьХолст(); setCommandLine(""); return }
    else if (c === "ПРИМЕР" || c === "DEMO" || c === "SAMPLE") { загрузитьПример(); setCommandLine(""); return }
    if (c === "КОРИДОР" || c === "CORRIDOR") setShowCorridor(true)
    else if (c === "ПОВЕРХНОСТЬ" || c === "SURFACE" || c === "TIN" || c === "GRID") setShowSurface(true)
    else if (c === "ТРАССА" || c === "ALIGNMENT" || c === "AL") setShowAlignment(true)
    else if (c === "ПРОФИЛЬ" || c === "PROFILE" || c === "ПРОВ") setShowProfile(true)
    else if (c === "СЕЧЕНИЕ" || c === "ASSEMBLY" || c === "ТС" || c === "AS") setShowAssembly(true)
    else if (c === "ТОЧКИ" || c === "POINTS" || c === "ТЧК") setShowPoints(true)
    else if (c === "СЕТЬ" || c === "PIPE" || c === "ТРУБЫ") setShowPipeNet(true)
    else if (c === "ПЕРЕСЕЧЕНИЕ" || c === "INTERSECT" || c === "INT") setShowIntersection(true)
    else if (c === "ХАРЛИНИЯ" || c === "FEATURELINE" || c === "ХЛ" || c === "FL") setShowFeatureLine(true)
    else if (c === "АНАЛИЗ" || c === "УКЛОНЫ" || c === "SLOPES") { setAnalysisType("Анализ уклонов"); setShowAnalysis(true) }
    else if (c === "ОБЪЁМЫ" || c === "VOLUMES" || c === "ОБЪ") setShowVolume(true)
    else if (c === "СЛОИ" || c === "LAYERS" || c === "LA") setShowLayers(true)
    else if (c === "ИМПОРТ" || c === "IMPORT") setShowImport(true)
    else if (c === "ЭКСПОРТ" || c === "EXPORT") { setExportMode("export"); setShowExport(true) }
    else if (c === "ПЕЧАТЬ" || c === "PRINT" || c === "PLOT") { setExportMode("print"); setShowExport(true) }
    else if (c === "ПАРАМ" || c === "DRAWING" || c === "DWGSETTINGS") setShowDrawingSettings(true)
    else if (c === "ZOOM E" || c === "ВПИСАТЬ" || c === "ZE") { setZoom(1.1); setPan({ x: 30, y: 20 }) }
    else if (c === "REGEN" || c === "РЕГЕН" || c === "RE") draw()
    else if (c === "S" || c === "SELECT" || c === "ВЫБОР") { setActiveTool("select"); setStatusMsg("Инструмент: Выбор"); setCommandLine(""); return }
    else if (c === "M" || c === "MOVE" || c === "ПЕРЕНЕСТИ") { setActiveTool("move"); setStatusMsg("Инструмент: Перенести — кликните объект и перетащите"); setCommandLine(""); return }
    else if (c === "L" || c === "LINE" || c === "ЛИНИЯ") { setActiveTool("line"); setDrawingPts([]); setStatusMsg("Инструмент: Линия — укажите первую точку"); setCommandLine(""); return }
    else if (c === "PL" || c === "PLINE" || c === "ПОЛИЛИНИЯ") { setActiveTool("polyline"); setDrawingPts([]); setStatusMsg("Инструмент: Полилиния — укажите первую точку"); setCommandLine(""); return }
    else if (c === "O" || c === "POINT" || c === "ТОЧКА") { setActiveTool("point"); setStatusMsg("Инструмент: Точка — кликните для добавления"); setCommandLine(""); return }
    else if (c === "R" || c === "RECT" || c === "ПРЯМОУГОЛЬНИК") { setActiveTool("rect"); setDrawingPts([]); setStatusMsg("Инструмент: Прямоугольник — укажите первый угол"); setCommandLine(""); return }
    else if (c === "C" || c === "CIRCLE" || c === "ОКРУЖНОСТЬ" || c === "КРУГ") { setActiveTool("circle"); setDrawingPts([]); setStatusMsg("Окружность: укажите центр"); setCommandLine(""); return }
    else if (c === "A" || c === "ARC" || c === "ДУГА") { setActiveTool("arc"); setDrawingPts([]); setStatusMsg("Дуга: укажите первую точку (из 3-х)"); setCommandLine(""); return }
    else if (c === "DEL" || c === "ERASE" || c === "УДАЛИТЬ" || c === "E") { setActiveTool("delete"); setStatusMsg("Инструмент: Удалить — кликните объект"); setCommandLine(""); return }
    else if (c === "ESC" || c === "ОТМЕНА") { setActiveTool("select"); setDrawingPts([]); setSelectedObjId(null); setCommandLine(""); return }
    else if (c === "PROPS" || c === "СВОЙСТВА" || c === "PR") { setShowProperties(p=>!p); setCommandLine(""); return }
    else if (c === "ЛИНИЯ" || c === "LINE" || c === "L" || c === "ПОЛИЛИНИЯ" || c === "PLINE" || c === "PL" || c === "КРУГ" || c === "CIRCLE" || c === "C" || c === "ДУГА" || c === "ARC" || c === "A" || c === "ТЕКСТ" || c === "TEXT" || c === "T" || c === "ШТРИХОВКА" || c === "HATCH" || c === "H" || c === "ЧЕРЧЕНИЕ" || c === "DRAW") setShowDraw2D(true)
    else if (c === "АННОТАЦИИ" || c === "ANNOTATION" || c === "РАЗМЕР" || c === "DIM" || c === "D" || c === "ВЫНОСКА" || c === "LEADER") setShowAnnotation(true)
    else if (c === "ВОДОСБОР" || c === "CATCHMENT" || c === "ГИДРОЛОГИЯ" || c === "HYDROLOGY" || c === "ДРЕНАЖ") setShowHydrology(true)
  else if (c === "SURVEYDB" || c === "БД СЪЁМКИ" || c === "SURVEYDATABASE" || c === "БДСЪЁМКИ") setShowSurveyDB(true)
  else if (c === "BREAKLINES" || c === "BREAKLINE" || c === "ЛИНИИ РАЗРЫВА" || c === "ЛР") { setSurfaceAdvMode("breaklines"); setShowSurfaceAdv(true) }
  else if (c === "VOIDS" || c === "ИСКЛЮЧЕНИЯ" || c === "VOID") { setSurfaceAdvMode("voids"); setShowSurfaceAdv(true) }
  else if (c === "СТАТИСТИКА" || c === "SURFSTATS" || c === "STAT") { setSurfaceAdvMode("stats"); setShowSurfaceAdv(true) }
  else if (c === "СРАВНЕНИЕ" || c === "SURFCOMPARE" || c === "COMPARE") { setSurfaceAdvMode("compare"); setShowSurfaceAdv(true) }
  else if (c === "INTERPOLATION" || c === "IDW" || c === "KRIGING" || c === "ИНТЕРПОЛЯЦИЯ") { setSurfaceAdvMode("interpolation"); setShowSurfaceAdv(true) }
  else if (c === "SAMPLELINES" || c === "ПОПЕРЕЧНИКИ" || c === "SL" || c === "SECTIONVIEWS" || c === "РАЗРЕЗЫ") setShowSampleLines(true)
  else if (c === "PRESSURE" || c === "НАПОРНАЯ" || c === "MANNING" || c === "МАНИНГ" || c === "STORM" || c === "ЛИВНЕВАЯ") setShowPressureNet(true)
  else if (c === "MASSHAUL" || c === "БАЛАНСГРУНТА" || c === "PAYITEMS" || c === "ВЕДОМОСТЬ") setShowMassHaul(true)
  else if (c === "PLANPRODUCTION" || c === "ЛИСТЫ" || c === "SHEETS" || c === "LABELSTYLES" || c === "СТИЛИПОДПИСЕЙ") setShowPlanProd(true)
  else if (c === "VISIBILITY" || c === "ВИДИМОСТЬ" || c === "PARCELS" || c === "УЧАСТКИ" || c === "ROW") setShowVisibility(true)
  else if (c === "INTERSECTION WIZARD" || c === "МАСТЕР" || c === "IW") setShowIntersectionWizard(true)
  else if (c === "ROUNDABOUT" || c === "КОЛЬЦО" || c === "КОЛЬЦЕВОЕ" || c === "RB") setShowRoundabout(true)
  else if (c === "RAIL" || c === "RAILTRACK" || c === "ЖД" || c === "РЕЛЬСЫ" || c === "RT") setShowRailTrack(true)
  else if (c === "BRIDGE" || c === "МОСТ" || c === "BM" || c === "BRIDGE MODELER") setShowBridgeModeler(true)
  else if (c === "TRANSPORT" || c === "ТРАНСПОРТ" || c === "РАЗВЯЗКА" || c === "TRAFFIC") setShowTransportation(true)
  else if (c === "HYDRO" || c === "ГИДРОЛОГИЯ_М" || c === "SCS" || c === "ПАВОДОК") setShowHydrologyModule(true)
  else if (c === "DAYLIGHT FL" || c === "DFL" || c === "ХЛВР") setShowDaylightFL2(true)
  else if (c === "HRA" || c === "РЕГРЕССИЯ" || c === "ALIGNMENT ANALYSIS") setShowHRA(true)
  else if (c === "INFODRAINAGE" || c === "ДРЕНАЖ" || c === "ЛИВНЕВАЯ" || c === "FAA" || c === "KIRPICH") setShowInfoDrainage(true)
  else if (c === "FORMA" || c === "DM" || c === "DATA MANAGEMENT") setShowFormaData(true)
  else if (c === "DWT" || c === "ШАБЛОН" || c === "TEMPLATES" || c === "КАТАЛОГ") setShowDWTTemplates(true)
  else if (c === "RC" || c === "LIDAR" || c === "ОБЛАКО" || c === "POINTCLOUD" || c === "REALITY") setShowRealityCapture(true)
  else if (c === "GIS" || c === "ПОДЛОЖКА" || c === "BASEMAP" || c === "КАРТА") setShowGISIntegration(true)
  else if (c === "VD" || c === "DASHBOARD" || c === "ДАШБОРД" || c === "VOLUME DASHBOARD") setShowVolumeDashboard(true)
  else if (c === "CP" || c === "PHASES" || c === "ФАЗЫ" || c === "СТРОЙГЕНПЛАН") setShowConstructionPhases(true)
  else if (c === "REVIT" || c === "IFC" || c === "EXCHANGE" || c === "BIM") setShowRevitExchange(true)
  else if (c === "GEO" || c === "ГЕОЛОГИЯ" || c === "GEOTECHNICAL" || c === "СКВАЖИНЫ") setShowGeotechnical(true)
  else if (c === "GRADING" || c === "ПЛАНИРОВКА" || c === "ПЛОЩАДКА" || c === "GR") setShowGrading(true)
  else if (c === "TUNNEL" || c === "ТОННЕЛЬ" || c === "TN") setShowTunnel(true)
  else if (c === "PE" || c === "EXPLORER" || c === "PROJECT EXPLORER" || c === "ДЕРЕВО") setShowProjectExplorer(true)
    else if (c === "INSIGHTS" || c === "ПОДСКАЗКИ") setShowInsights(prev=>!prev)
    else if (c === "ЗЕМЛЯ" || c === "EARTHWORKS" || c === "ВЗР") { setShowEarthworks(true); setStatusMsg("Ведомость земляных работ"); setCommandLine(""); return }
    else if (c === "НЕВЯЗКА" || c === "TRAVERSE" || c === "ТХ") { setShowSurveyTraverse(true); setStatusMsg("Отчёт о невязке"); setCommandLine(""); return }
    else if (c === "WHATSNEW" || c === "НОВОЕ" || c === "ВЕРСИИ" || c === "2026") { setShowWhatsNewVer(true); setStatusMsg("Что нового · 2023–2026"); setCommandLine(""); return }
    else if (c === "MODELVIEWER" || c === "3D" || c === "3Д") { setVerFeature("modelViewer3D"); setStatusMsg("3D-просмотр модели"); setCommandLine(""); return }
    else if (c === "GRADINGOPT" || c === "ОПТИМИЗАЦИЯ") { setVerFeature("gradingOpt"); setStatusMsg("Оптимизация планировки"); setCommandLine(""); return }
    else if (c === "TRANSFORM" || c === "ПРЕОБРАЗОВАНИЕ СК" || c === "СК") { setVerFeature("coordTransform"); setStatusMsg("Преобразование систем координат"); setCommandLine(""); return }
    else if (c === "DRAINAGE" || c === "ДРЕНАЖ") { setVerFeature("drainageDesign"); setStatusMsg("Проектирование дренажа"); setCommandLine(""); return }
    else if (c === "ПРОЕКТ" || c === "PROJECT" || c === "ДП") { setShowProjectManager(true); setStatusMsg("Диспетчер проекта"); setCommandLine(""); return }
    else if (c === "SURFACEEDIT" || c === "РЕДАКТИРОВАТЬ ПОВЕРХНОСТЬ" || c === "РПОВ") { setSurfaceEditName("Существующая поверхность"); setShowSurfaceEdit(true); setStatusMsg("Редактор поверхности"); setCommandLine(""); return }
    else if (c === "DAYLIGHT" || c === "DAYLIGHT FL" || c === "ХАР.ЛИНИЯ" || c === "ВЫХОД НА РЕЛЬЕФ") { setShowDaylightFL(true); setStatusMsg("Линия выхода на рельеф"); setCommandLine(""); return }
    else if (c === "SYNCHRONIZEDATA" || c === "SYNCH" || c === "СИНХР" || c === "DATA SHORTCUTS") { setShowDataShortcuts(true); setStatusMsg("Ярлыки данных — синхронизация"); setCommandLine(""); return }
    else if (c === "REFRESH" || c === "F5" || c === "ОБНОВИТЬ") { setSyncStatus("ok"); showToast("Данные обновлены"); setCommandLine(""); return }
    else if (c === "FEATURELINEEDIT" || c === "РЕДХАРЛИН") { setShowFeatureLine(true); setStatusMsg("Редактор характерных линий"); setCommandLine(""); return }
    else if (c === "?" || c === "HELP" || c === "СПРАВКА") {
      showToast("Команды: ПОВЕРХНОСТЬ, ТРАССА, ПРОФИЛЬ, КОРИДОР, ТРУБА, SURFACEEDIT, DAYLIGHT, SYNCHRONIZEDATA, ЗЕМЛЯ, НЕВЯЗКА, ZE...")
      setCommandLine(""); return
    }
    else { setStatusMsg(`Неизвестная команда: ${cmd}. Введите ? для справки`); setCommandLine(""); return }
    setStatusMsg(`Команда: ${cmd}`)
    setCommandLine("")
  }

  const toggleLayer = (key: keyof typeof visLayers) => setVisLayers(v => ({ ...v, [key]: !v[key] }))

  const активироватьИнструмент = (tool: EditTool, подсказка: string) => {
    setActiveTool(tool)
    setDrawingPts([])
    setSelectedObjId(null)
    setStatusMsg(подсказка)
    showToast(подсказка)
  }

  const openDialog = (key: string) => {
    setOpenDropdown(null)
    const k = key.toLowerCase()
    // ── Черчение: активируем реальный инструмент на холсте ──────────────────
    if (k.includes("полилиния") || k.includes("полилин") || k.includes("сплайн")) { активироватьИнструмент("polyline", "Полилиния: укажите первую точку (Esc — завершить)"); return }
    else if ((k.includes("линия") || k.includes("отрезок")) && !k.includes("характерн") && !k.includes("харлиния") && !k.includes("хар.") && !k.includes("выносн")) { активироватьИнструмент("line", "Линия: укажите первую точку"); return }
    else if (k.includes("дуга")) { активироватьИнструмент("arc", "Дуга: укажите начальную точку"); return }
    else if (k.includes("окружность") || k.includes("круг")) { активироватьИнструмент("circle", "Окружность: укажите центр"); return }
    else if (k.includes("прямоугольник")) { активироватьИнструмент("rect", "Прямоугольник: укажите первый угол"); return }
    else if (k.includes("точка") && !k.includes("точками")) { активироватьИнструмент("point", "Точка: укажите положение"); return }
    // Основные объекты
    if (k.includes("коридор")) { setShowCorridor(true) }
    else if (k.includes("поверхност") || k.includes("tin") || k.includes("grid") || k.includes("рельеф")) { setShowSurface(true) }
    else if ((k.includes("трасс") && !k.includes("ж/д")) || k.includes("alignment")) { setShowAlignment(true) }
    else if (k.includes("профиль") || k.includes("вид профил")) { setShowProfile(true) }
    else if (k.includes("типовое") || k.includes("тип. сечение") || k.includes("тип.") || k.includes("assembly") || k.includes("виды попереч") || k.includes("попереч")) { setShowAssembly(true) }
    // Точки
    else if (k.includes("точк") || k.includes("геодез") || k.includes("импорт точ") || k.includes("теодолит")) { setShowPoints(true) }
    // Сети
    else if (k.includes("труб") || k.includes("сеть") || k.includes("канализ") || k.includes("гидравл")) { setShowPipeNet(true) }
    // Пересечения / Roundabout
    else if (k.includes("wizard") || k.includes("мастер пересеч") || k.includes("intersection wizard")) { setShowIntersectionWizard(true) }
    else if (k.includes("кольцев") || k.includes("roundabout") || k.includes("кольцо")) { setShowRoundabout(true) }
    else if (k.includes("пересечен")) { setShowIntersection(true) }
    // Характерные линии
    else if (k.includes("хар. лин") || k.includes("характерн")) { setShowFeatureLine(true) }
    else if (k.includes("daylight") || k.includes("выход на рельеф")) { setShowDaylightFL(true) }
    else if (k.includes("data shortcut") || k.includes("синхронизир") || k.includes("быстрые ссылки")) { setShowDataShortcuts(true) }
    else if (k.includes("редактировать поверхност") || k.includes("surfaceedit")) { setSurfaceEditName("Существующая поверхность"); setShowSurfaceEdit(true) }
    // Анализ
    else if (k.includes("уклон") || k.includes("высот") || k.includes("водосбор") || k.includes("анализ")) {
      setAnalysisType(k.includes("высот") ? "Анализ высот" : k.includes("водосбор") ? "Анализ водосборов" : "Анализ уклонов")
      setShowAnalysis(true)
    }
    // Объёмы
    else if (k.includes("объём") || k.includes("земляных") || k.includes("ведомост")) { setShowVolume(true) }
    // Слои
    else if (k.includes("слой") || k.includes("слоёв") || k.includes("слои") || k.includes("диспетчер сло")) { setShowLayers(true) }
    // Импорт
    else if (k.includes("импорт") || k.includes("landxml") || k.includes("присоедин") || k.includes("облако точек")) { setShowImport(true) }
    // Экспорт
    else if (k.includes("экспорт") || k.includes("ifc") || k.includes("dwf") || k.includes("pdf") || k.includes("shapefile")) {
      setExportMode("export"); setShowExport(true)
    }
    // Печать
    else if (k.includes("печать") || k.includes("просмотр печ")) { setExportMode("print"); setShowExport(true) }
    // Параметры чертежа
    else if (k.includes("параметры черт") || k.includes("единицы") || k.includes("система коорд")) { setShowDrawingSettings(true) }
    // Виды (viewport)
    else if (k.includes("сверху") || k.includes("изометр")) { setStatusMsg(`Вид: ${key}`); setViewMode("wireframe") }
    else if (k.includes("тонирован") || k.includes("реалист")) { setViewMode("shaded"); setStatusMsg("Визуальный стиль: Тонирование") }
    else if (k.includes("каркас") || k.includes("wireframe")) { setViewMode("wireframe"); setStatusMsg("Визуальный стиль: 2D Каркас") }
    // Zoom / pan
    else if (k.includes("вписать") || k.includes("zoom e")) { setZoom(1.1); setPan({x:30,y:20}); setStatusMsg("Вписать всё") }
    else if (k.includes("зум") || k.includes("зум окн")) { setStatusMsg("Зум окном: укажите рамку") }
    // Редактирование — показываем toast
    else if (["перенести","копировать","повернуть","зеркало","обрезать","растянуть","масштаб","массив","сопряжение","разбить","соединить"].some(w=>k.includes(w))) {
      showToast(`Активен инструмент: ${key} — укажите объекты на чертеже`)
    }
    // Штриховка / 2D Геометрия (диалоги)
    else if (k.includes("штриховка")) { showToast(`Черчение: ${key} — выберите замкнутый контур`) }
    else if (k.includes("черч") || k.includes("2d геометр")) { setShowDraw2D(true) }
    // Аннотации
    else if (k.includes("аннотац") || k.includes("размер") || k.includes("выноск") || k.includes("таблиц") || (k.includes("текст") && !k.includes("контекст"))) { setShowAnnotation(true) }
    // Поперечный уклон
    else if (k.includes("поперечный уклон") || k.includes("superelevation") || k.includes("отгон")) { setShowSuperelevation(true) }
    // Гидрология
    else if (k.includes("водосбор") || k.includes("гидролог") || k.includes("дренаж") || k.includes("пруд")) { setShowHydrology(true) }
    // Земляные работы
    else if (k.includes("земляны") || k.includes("ведомост") || k.includes("earthwork")) { setShowEarthworks(true) }
    // Диспетчер проекта
    else if (k.includes("диспетчер проект") || k.includes("project manager")) { setShowProjectManager(true) }
    // Невязка теодолитного хода
    else if (k.includes("невязк") || k.includes("теодолитн") || k.includes("traverse")) { setShowSurveyTraverse(true) }
    // Адаптация / палитры инструментов
    else if (k.includes("адаптац") || k.includes("палитр") || k.includes("инструментальные") || k.includes("cui") || k.includes("пользовательский интерфейс")) { setShowAdaptation(true) }
    // Новые диалоги
    else if (k.includes("база съёмки") || k.includes("fieldbook") || k.includes("survey db") || k.includes("фигуры") || k.includes("код точки")) { setShowSurveyDB(true) }
    else if (k.includes("breakline") || k.includes("линии разрыва")) { setSurfaceAdvMode("breaklines"); setShowSurfaceAdv(true) }
    else if (k.includes("void") || k.includes("исключен")) { setSurfaceAdvMode("voids"); setShowSurfaceAdv(true) }
    else if (k.includes("статистик")) { setSurfaceAdvMode("stats"); setShowSurfaceAdv(true) }
    else if (k.includes("сравнени")) { setSurfaceAdvMode("compare"); setShowSurfaceAdv(true) }
    else if (k.includes("idw") || k.includes("kriging") || k.includes("интерполяц")) { setSurfaceAdvMode("interpolation"); setShowSurfaceAdv(true) }
    else if (k.includes("sample line") || k.includes("section view") || k.includes("поперечник") || k.includes("листы попер")) { setShowSampleLines(true) }
    else if (k.includes("напорн") || k.includes("дарси") || k.includes("потери напора") || k.includes("манинг") || k.includes("рац. формул") || k.includes("ливневая") || k.includes("профиль сети")) { setShowPressureNet(true) }
    else if (k.includes("mass haul") || k.includes("pay item") || k.includes("баланс грунт")) { setShowMassHaul(true) }
    else if (k.includes("листы") || k.includes("plan production") || k.includes("стили подп") || k.includes("label style") || k.includes("sheet")) { setShowPlanProd(true) }
    else if (k.includes("видимость") || k.includes("участк") || k.includes("row") || k.includes("парцел") || k.includes("конфликт")) { setShowVisibility(true) }
    else if (k.includes("настройки") || k.includes("параметры") || k.includes("epsg") || k.includes("единицы") || k.includes("python") || k.includes("плагин")) { setShowDrawingSettings(true) }
    else if (k.includes("ai-асс") || k.includes("ai асс") || k.includes("ассистент")) { setShowAssistant(p=>!p) }
    else if (k.includes("3d-вьюер") || k.includes("3d вьюер")) { onNavigate?.("viewer3d") }
    else if (k.includes("жд") || k.includes("рельс") || k.includes("rail track") || k.includes("ж/д путь")) { setShowRailTrack(true) }
    else if (k.includes("мост") || k.includes("bridge") || k.includes("путепровод") || k.includes("виадук")) { setShowBridgeModeler(true) }
    else if (k.includes("транспорт") || k.includes("transportation") || k.includes("трафик") || k.includes("развязк") || k.includes("светофор")) { setShowTransportation(true) }
    else if (k.includes("hydrology") || k.includes("scs") || k.includes("паводок") || k.includes("водосбор") || k.includes("эроз")) { setShowHydrologyModule(true) }
    else if (k.includes("daylight") || k.includes("dfl") || k.includes("feature line")) { setShowDaylightFL2(true) }
    else if (k.includes("hra") || k.includes("регресс") || k.includes("horizontal regression")) { setShowHRA(true) }
    else if (k.includes("infodrainage") || k.includes("ливнев") || k.includes("kirpich") || k.includes("faa метод") || k.includes("время концентр")) { setShowInfoDrainage(true) }
    else if (k.includes("forma") || k.includes("data management") || k.includes("connected ref")) { setShowFormaData(true) }
    else if (k.includes("шаблон") || k.includes("dwt") || k.includes("каталог труб") || k.includes("template")) { setShowDWTTemplates(true) }
    else if (k.includes("облако точек") || k.includes("lidar") || k.includes("reality capture") || k.includes("лидар") || k.includes("фотограмметр")) { setShowRealityCapture(true) }
    else if (k.includes("gis") || k.includes("подложк") || k.includes("basemap") || k.includes("wms") || k.includes("карт") || k.includes("esri")) { setShowGISIntegration(true) }
    else if (k.includes("дашборд") || k.includes("volume dashboard") || k.includes("dashboard")) { setShowVolumeDashboard(true) }
    else if (k.includes("фаз") || k.includes("стройгенплан") || k.includes("gantt") || k.includes("construction phase")) { setShowConstructionPhases(true) }
    else if (k.includes("revit") || k.includes("ifc") || k.includes("naviswork") || k.includes("bim exchange") || k.includes("autocad exchange")) { setShowRevitExchange(true) }
    else if (k.includes("геолог") || k.includes("скважин") || k.includes("geotechn") || k.includes("стратиграф")) { setShowGeotechnical(true) }
    else if (k.includes("планировк") || k.includes("grading") || k.includes("площадк") || k.includes("рабочие отметки")) { setShowGrading(true) }
    else if (k.includes("тоннель") || k.includes("tunnel") || k.includes("тпмк")) { setShowTunnel(true) }
    else if (k.includes("explorer") || k.includes("дерево") || k.includes("project explorer")) { setShowProjectExplorer(true) }
    // Всё остальное
    else { setStatusMsg(`Выполнено: ${key}`) }
  }

  const handleToolbarItem = (item: string) => {
    openDialog(item)
    setStatusMsg(`Команда: ${item}`)
  }

  const handleDropdownItem = (parent: string, sub: string) => {
    openDialog(parent + " " + sub)
    setStatusMsg(`${parent.replace(" ▾","")}: ${sub}`)
  }

  const handleTreeNodeAction = (node: TreeNode) => {
    if (node.id === "surfaces" || node.id.startsWith("s") || node.id === "ds1") { setShowSurface(true) }
    else if (node.id === "alignments" || node.id.startsWith("a") || node.id === "ds2") { setShowAlignment(true) }
    else if (node.id === "corridors" || node.id === "c1" || node.id === "ds5") { setShowCorridor(true) }
    else if (node.id === "assemblies" || node.id.startsWith("asm_")) { setShowAssembly(true) }
    else { setStatusMsg(`Объект: ${node.label}`) }
  }

  // ── Ribbon definitions ──────────────────────────────────────────────────────
  interface RibbonItem { label: string; icon: string; size: "lg"|"sm"; drop?: string; fallback?: string }
  interface RibbonGroup { label: string; items: RibbonItem[] }

  const MENU_ITEMS = ["Главная","Вид","Черчение","Съёмка","Поверхности","Трасса","Коридоры","Сети","Сооружения","Транспорт","Геология","Анализ","Инструменты","Вывод","Производство","Надстройки"]

  const TOOLBAR_BY_MENU: Record<string, RibbonGroup[]> = {
    "Главная": [
      { label: "Создать", items: [
        { label:"Трасса",      icon:"Route",        size:"lg", drop:"Трасса" },
        { label:"Коридор",     icon:"Navigation",   size:"lg", drop:"Коридор" },
        { label:"Поверхность", icon:"Triangle",     size:"lg", drop:"Поверхность" },
        { label:"Профиль",     icon:"TrendingUp",   size:"lg" },
        { label:"Сечение",    icon:"Layers",       size:"lg" },
      ]},
      { label: "Сети", items: [
        { label:"Труба",       icon:"Network",      size:"lg" },
        { label:"Колодец",     icon:"Circle",       size:"sm", fallback:"MapPin" },
        { label:"Напорная",    icon:"Gauge",        size:"sm", fallback:"Gauge" },
        { label:"Ливневая",    icon:"CloudRain",    size:"sm", fallback:"Droplets" },
      ]},
      { label: "Геодезия", items: [
        { label:"Точки",       icon:"MapPin",       size:"lg" },
        { label:"База съёмки", icon:"Database",     size:"sm", fallback:"FolderOpen" },
        { label:"Код точки",   icon:"Tag",          size:"sm" },
        { label:"Ход",         icon:"Crosshair",    size:"sm", fallback:"Navigation" },
      ]},
      { label: "Изменить", items: [
        { label:"Свойства",    icon:"Settings",     size:"sm", fallback:"Settings2" },
        { label:"Удалить",     icon:"Trash2",       size:"sm" },
        { label:"Слои",        icon:"Layers",       size:"sm" },
        { label:"Отменить",    icon:"Undo",         size:"sm", fallback:"RotateCcw" },
      ]},
      { label: "Данные", items: [
        { label:"Импорт",      icon:"Upload",       size:"lg", drop:"Импорт" },
        { label:"Экспорт",     icon:"Download",     size:"lg", drop:"Экспорт" },
        { label:"Shortcuts",   icon:"Share2",       size:"sm", fallback:"Link" },
        { label:"Проект",      icon:"FolderKanban", size:"sm" },
      ]},
    ],
    "Черчение": [
      { label: "Линии", items: [
        { label:"Линия",       icon:"Minus",        size:"lg" },
        { label:"Полилиния",   icon:"Spline",       size:"lg" },
        { label:"Дуга",        icon:"RefreshCw",    size:"lg", fallback:"RotateCw" },
        { label:"Круг",        icon:"Circle",       size:"sm" },
        { label:"Прямоугольник",icon:"Square",      size:"sm" },
        { label:"Сплайн",      icon:"Waypoints",    size:"sm", fallback:"Route" },
      ]},
      { label: "Аннотации", items: [
        { label:"Текст",       icon:"Type",         size:"lg" },
        { label:"Размер",      icon:"Ruler",        size:"lg" },
        { label:"Выноска",     icon:"MessageSquare",size:"sm", fallback:"ExternalLink" },
        { label:"Штриховка",   icon:"Grid2x2",      size:"sm", fallback:"LayoutGrid" },
      ]},
      { label: "Точки", items: [
        { label:"Точка",       icon:"Dot",          size:"lg", fallback:"MapPin" },
        { label:"Импорт CSV",  icon:"FileSpreadsheet",size:"sm",fallback:"Upload" },
      ]},
    ],
    "Съёмка": [
      { label: "База данных", items: [
        { label:"База съёмки", icon:"Database",     size:"lg", fallback:"FolderOpen" },
        { label:"Фигуры",      icon:"Shapes",       size:"lg", fallback:"Layers" },
        { label:"FieldBook",   icon:"BookOpen",     size:"lg" },
        { label:"Коды точек",  icon:"Tag",          size:"sm" },
      ]},
      { label: "Точки", items: [
        { label:"Точки",       icon:"MapPin",       size:"lg" },
        { label:"Импорт CSV",  icon:"Upload",       size:"lg" },
        { label:"Группы",      icon:"Users",        size:"sm", fallback:"Layers" },
        { label:"Фильтр",      icon:"Filter",       size:"sm" },
      ]},
      { label: "Теодолит", items: [
        { label:"Ход",         icon:"Crosshair",    size:"lg", fallback:"Navigation" },
        { label:"Невязка",     icon:"Calculator",   size:"sm", fallback:"BarChart3" },
        { label:"Разбивка",    icon:"Milestone",    size:"sm" },
      ]},
    ],
    "Поверхности": [
      { label: "Создать", items: [
        { label:"Поверхность", icon:"Triangle",     size:"lg", drop:"Поверхность" },
        { label:"Структурные линии",  icon:"Minus",        size:"lg" },
        { label:"Исключения",       icon:"Square",       size:"lg", fallback:"Eraser" },
      ]},
      { label: "Анализ", items: [
        { label:"Статистика",  icon:"BarChart3",    size:"lg" },
        { label:"Уклоны",      icon:"TrendingUp",   size:"sm" },
        { label:"Горизонтали", icon:"Layers",       size:"sm" },
        { label:"Водосборы",   icon:"Droplets",     size:"sm", fallback:"CloudRain" },
        { label:"Сравнение",   icon:"GitCompare",   size:"sm", fallback:"ArrowLeftRight" },
      ]},
      { label: "Интерполяция", items: [
        { label:"IDW",         icon:"Grid3x3",      size:"sm" },
        { label:"Кригинг",     icon:"ScatterChart", size:"sm", fallback:"BarChart2" },
        { label:"Редактировать",icon:"PencilRuler", size:"sm", fallback:"Edit" },
      ]},
    ],
    "Трасса": [
      { label: "Создать", items: [
        { label:"Трасса",      icon:"Route",        size:"lg", drop:"Трасса" },
        { label:"Профиль",     icon:"TrendingUp",   size:"lg" },
        { label:"Вираж",       icon:"RotateCw",     size:"lg", fallback:"RefreshCw" },
        { label:"Уширение",    icon:"MoveHorizontal",size:"sm",fallback:"ArrowLeftRight" },
      ]},
      { label: "Пересечения", items: [
        { label:"Мастер\nразвязок", icon:"Crosshair",    size:"lg" },
        { label:"Кольцо",           icon:"RotateCw",     size:"lg", fallback:"RefreshCw" },
        { label:"Пересечение",          icon:"Plus",         size:"sm" },
      ]},
      { label: "Пикетаж", items: [
        { label:"Пикеты",      icon:"Milestone",    size:"lg" },
        { label:"Ведомость",   icon:"ClipboardList",size:"sm", fallback:"List" },
        { label:"Уклоны",      icon:"TrendingUp",   size:"sm" },
      ]},
      { label: "Видимость", items: [
        { label:"Видимость",   icon:"Eye",          size:"lg" },
      ]},
    ],
    "Коридоры": [
      { label: "Создать", items: [
        { label:"Коридор",     icon:"Navigation",   size:"lg", drop:"Коридор" },
        { label:"Сечение",    icon:"Layers",       size:"lg" },
        { label:"Линии сечения",icon:"AlignCenter",  size:"lg", fallback:"Minus" },
        { label:"Регионы",     icon:"Columns",      size:"sm", fallback:"Layers" },
      ]},
      { label: "Поперечники", items: [
        { label:"Вид сечения",icon:"ScanLine",     size:"lg", fallback:"Minus" },
        { label:"Поперечники", icon:"AlignCenter",  size:"sm", fallback:"AlignJustify" },
        { label:"Листы попер.", icon:"FileStack",   size:"sm", fallback:"Files" },
      ]},
      { label: "Объёмы", items: [
        { label:"Объёмы",      icon:"BarChart3",    size:"lg" },
        { label:"Баланс масс",   icon:"TrendingUp",   size:"lg" },
        { label:"Расценки",   icon:"ClipboardList",size:"sm", fallback:"List" },
        { label:"Земляные работы",icon:"Layers",    size:"sm" },
      ]},
    ],
    "Сети": [
      { label: "Самотёчные", items: [
        { label:"Труба",       icon:"Network",      size:"lg" },
        { label:"Колодец",     icon:"Circle",       size:"lg", fallback:"MapPin" },
        { label:"Профиль сети",icon:"TrendingUp",   size:"sm" },
        { label:"Манинг",      icon:"Gauge",        size:"sm", fallback:"Calculator" },
      ]},
      { label: "Напорные", items: [
        { label:"Напорная",    icon:"Gauge",        size:"lg" },
        { label:"Дарси",       icon:"Calculator",   size:"sm", fallback:"BarChart3" },
        { label:"Потери напора",icon:"ArrowDown",   size:"sm" },
      ]},
      { label: "Ливневая", items: [
        { label:"Ливневая",    icon:"CloudRain",    size:"lg", fallback:"Droplets" },
        { label:"Рац. формула",icon:"Calculator",   size:"sm", fallback:"BarChart3" },
        { label:"Дренаж",      icon:"Droplets",     size:"sm" },
      ]},
    ],
    "Сооружения": [
      { label: "Ж/Д путь", items: [
        { label:"Ж/д путь",  icon:"Train",         size:"lg", fallback:"Route" },
        { label:"Профиль пути",icon:"TrendingUp",    size:"sm" },
        { label:"Кривые пути", icon:"RefreshCw",     size:"sm", fallback:"RotateCw" },
        { label:"Сооружения",  icon:"Layers",        size:"sm" },
      ]},
      { label: "Мосты", items: [
        { label:"Модель\nмоста", icon:"Waves",     size:"lg", fallback:"Minus" },
        { label:"Путепровод",  icon:"ArrowUp",       size:"sm" },
        { label:"Труба",       icon:"Circle",        size:"sm", fallback:"Minus" },
        { label:"Тоннель",     icon:"Circle",        size:"sm", fallback:"ArrowRight" },
      ]},
      { label: "Параметры", items: [
        { label:"Нагрузки",    icon:"Weight",        size:"lg", fallback:"BarChart3" },
        { label:"Материалы",   icon:"Package",       size:"sm", fallback:"Layers" },
        { label:"Экспорт IFC", icon:"Building2",     size:"sm" },
      ]},
    ],
    "Анализ": [
      { label: "Поверхность", items: [
        { label:"Уклоны",      icon:"TrendingUp",   size:"lg" },
        { label:"Экспозиция",  icon:"Compass",      size:"sm", fallback:"Navigation" },
        { label:"Водосборы",   icon:"Droplets",     size:"sm" },
        { label:"Гидрология",  icon:"CloudRain",    size:"sm", fallback:"Droplets" },
      ]},
      { label: "Трасса", items: [
        { label:"Видимость",   icon:"Eye",          size:"lg" },
        { label:"Конфликты",   icon:"AlertTriangle",size:"sm", fallback:"AlertCircle" },
        { label:"Участки ROW", icon:"LayoutGrid",   size:"sm", fallback:"Layers" },
      ]},
      { label: "Объёмы", items: [
        { label:"Объёмы",      icon:"BarChart3",    size:"lg" },
        { label:"Между пов.",  icon:"GitCompare",   size:"sm", fallback:"ArrowLeftRight" },
        { label:"Земляные",    icon:"TrendingDown", size:"sm" },
      ]},
    ],
    "Вывод": [
      { label: "Импорт", items: [
        { label:"Импорт",      icon:"Upload",       size:"lg", drop:"Импорт" },
        { label:"LandXML",     icon:"Code2",        size:"sm" },
        { label:"DXF/DWG",     icon:"PencilRuler",  size:"sm" },
        { label:"GeoTIFF DEM", icon:"Mountain",     size:"sm", fallback:"Image" },
      ]},
      { label: "Экспорт", items: [
        { label:"Экспорт",     icon:"Download",     size:"lg", drop:"Экспорт" },
        { label:"PDF",         icon:"FileText",     size:"sm" },
        { label:"OBJ/glTF",    icon:"Box",          size:"sm" },
        { label:"Печать",      icon:"Printer",      size:"sm" },
      ]},
      { label: "Чертежи", items: [
        { label:"Листы",       icon:"FileStack",    size:"lg", fallback:"Files" },
        { label:"Стили подп.", icon:"Type",         size:"sm" },
        { label:"Параметры",   icon:"Settings",     size:"sm", fallback:"Settings2" },
      ]},
    ],
    "Геология": [
      { label: "Скважины", items: [
        { label:"Скважины",    icon:"Layers",       size:"lg" },
        { label:"Стратигр.",   icon:"AlignJustify", size:"sm", fallback:"List" },
        { label:"Разрез",      icon:"Minus",        size:"sm" },
        { label:"ИГЭ",         icon:"Database",     size:"sm", fallback:"Table" },
      ]},
      { label: "Площадки", items: [
        { label:"Планировка",     icon:"Mountain",     size:"lg" },
        { label:"Откосы",      icon:"TrendingDown", size:"sm" },
        { label:"Рабочие отм.",icon:"BarChart2",    size:"sm", fallback:"BarChart3" },
      ]},
      { label: "Тоннели", items: [
        { label:"Тоннель",     icon:"Circle",       size:"lg", fallback:"CircleDot" },
        { label:"Обделка",     icon:"Layers",       size:"sm" },
        { label:"Расчёт",      icon:"Calculator",   size:"sm", fallback:"BarChart3" },
      ]},
    ],
    "Транспорт": [
      { label: "Развязки", items: [
        { label:"Transportation",icon:"Car",          size:"lg", fallback:"Navigation" },
        { label:"Развязки",      icon:"GitBranch",    size:"lg", fallback:"Crosshair" },
        { label:"Светофоры",     icon:"AlertCircle",  size:"sm", fallback:"Circle" },
      ]},
      { label: "Гидрология", items: [
        { label:"Hydrology",     icon:"CloudRain",    size:"lg", fallback:"Droplets" },
        { label:"Паводки",       icon:"Waves",        size:"sm", fallback:"Droplets" },
        { label:"Эрозия",        icon:"TrendingDown", size:"sm" },
      ]},
      { label: "Выход на рельеф", items: [
        { label:"Линия выхода",   icon:"Spline",       size:"lg" },
        { label:"Критерии",      icon:"Settings",     size:"sm", fallback:"Settings2" },
      ]},
    ],
    "Инструменты": [
      { label: "Анализ трасс", items: [
        { label:"HRA + ML",    icon:"GitBranch",    size:"lg", fallback:"Route" },
        { label:"Align Preview",icon:"Eye",         size:"sm" },
        { label:"Кривизна",    icon:"BarChart2",    size:"sm", fallback:"BarChart3" },
      ]},
      { label: "Гидрология", items: [
        { label:"InfoDrainage",icon:"Droplets",     size:"lg", fallback:"CloudRain" },
        { label:"Kirpich/FAA", icon:"Clock",        size:"sm" },
        { label:"Каналы",      icon:"Minus",        size:"sm" },
        { label:"Пруд",        icon:"Circle",       size:"sm", fallback:"Droplets" },
      ]},
      { label: "Данные", items: [
        { label:"Forma DM",    icon:"Cloud",        size:"lg", fallback:"Database" },
        { label:"Шаблоны DWT", icon:"FileStack",    size:"lg", fallback:"Files" },
        { label:"Каталоги",    icon:"Package",      size:"sm", fallback:"Layers" },
      ]},
    ],
    "Производство": [
      { label: "BIM", items: [
        { label:"Revit\nExchange",  icon:"RefreshCw",    size:"lg", fallback:"RotateCw" },
        { label:"IFC Export",       icon:"Building2",    size:"sm" },
        { label:"Navisworks",       icon:"Box",          size:"sm", fallback:"Layers" },
      ]},
      { label: "ГИС", items: [
        { label:"GIS / WMS",        icon:"Globe",        size:"lg" },
        { label:"Облако точек",     icon:"ScanLine",     size:"lg", fallback:"Scan" },
        { label:"Kадастр",          icon:"Map",          size:"sm" },
        { label:"EPSG конвертер",   icon:"Crosshair",    size:"sm" },
      ]},
      { label: "Планирование", items: [
        { label:"Фазы стр-ва",      icon:"Calendar",     size:"lg", fallback:"Clock" },
        { label:"Дашборд",          icon:"BarChart3",    size:"lg" },
        { label:"Отчёт PDF",        icon:"FileText",     size:"sm" },
      ]},
    ],
    "Надстройки": [
      { label: "Скрипты", items: [
        { label:"AutoLISP",    icon:"Code",         size:"lg", fallback:"Terminal" },
        { label:"Dynamo",      icon:"Cpu",          size:"lg" },
        { label:"Python",      icon:"FileCode",     size:"sm" },
        { label:"Плагины",     icon:"Puzzle",       size:"sm" },
      ]},
      { label: "Настройки", items: [
        { label:"EPSG / СК",   icon:"Globe",        size:"lg" },
        { label:"Параметры",   icon:"Settings",     size:"lg", fallback:"Settings2" },
        { label:"AI-асс.",     icon:"Bot",          size:"sm", fallback:"Cpu" },
      ]},
    ],
    "Вид": [
      { label: "Виды", items: [
        { label:"3D-вьюер",    icon:"Box",          size:"lg" },
        { label:"Вписать",     icon:"Maximize",     size:"lg" },
        { label:"Сверху",      icon:"ArrowUp",      size:"sm" },
        { label:"Изометрия",   icon:"Cube",         size:"sm", fallback:"Box" },
      ]},
      { label: "Отображение", items: [
        { label:"Слои",        icon:"Layers",       size:"lg" },
        { label:"Сетка",       icon:"Grid3x3",      size:"sm" },
        { label:"Свойства",    icon:"Info",         size:"sm" },
        { label:"Разрезать",   icon:"Split",        size:"sm", fallback:"Columns" },
      ]},
    ],
  }

  const DROPDOWN_ITEMS: Record<string, string[]> = {
    "Трасса":      ["Создать трассу по точкам","Создать параметрическую трассу","Редактировать трассу","Таблица элементов"],
    "Коридор":     ["Создать коридор","Редактировать коридор","Регионы коридора","Цели коридора"],
    "Поверхность": ["Создать поверхность TIN","Создать поверхность Grid","Редактировать поверхность","Импорт из точек"],
    "Импорт":      ["LandXML","DXF","DEM/GeoTIFF","CSV точек","IFC","Shapefile","GeoJSON"],
    "Экспорт":     ["DXF","LandXML","OBJ","glTF","PDF","CSV точек","GeoJSON","Shapefile"],
  }

  const currentToolbar = TOOLBAR_BY_MENU[activeMenuTab] || TOOLBAR_BY_MENU["Главная"] || []

  if (showStartScreen) {
    return (
      <StartScreen
        onOpen={(name, projectId) => {
          setShowStartScreen(false)
          const tabName = name && name !== "new"
            ? (name.endsWith(".dwg") ? name : name + ".dwg")
            : "Новый чертёж.dwg"
          if (!drawingTabs.includes(tabName)) {
            setDrawingTabs(prev => [...prev, tabName])
          }
          setActiveDrawingTab(tabName)
          if (projectId) {
            setCurrentProjectId(projectId)
            setCurrentProjectName(name || "")
            // Синхронизируем с глобальным store
            if (store) {
              store.setActiveProject({
                id: projectId,
                name: name || "Новый проект",
                description: "",
                type: "road",
                status: "active",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                objects_count: 0,
              })
              store.openTab({
                id: `tab-${projectId}-${tabName}`,
                name: tabName,
                projectId,
                saved: true,
                objects: [],
                viewState: { zoom: 1.1, panX: 30, panY: 20 },
              })
              store.notify(`Открыт проект: ${name}`, "success")
            }
          }
        }}
        onSave={() => {
          fetch(PROJECTS_URL)
            .then(r => r.json())
            .then((data: {id:number;name:string;type:string}[]) => {
              setSaveProjects(data)
              setSaveToProjectId(currentProjectId)
              setShowSaveDialog(true)
            })
        }}
        currentProjectName={currentProjectName}
        showWelcomeDialog={showWelcomeDialog}
        setShowWelcomeDialog={setShowWelcomeDialog}
        showGraphicsBanner={showGraphicsBanner}
        setShowGraphicsBanner={setShowGraphicsBanner}
      />
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] text-gray-200 overflow-hidden" style={{ fontFamily: "Arial, sans-serif", fontSize: 12 }}>

      {/* ── Title bar ── */}
      <div className="bg-[#1a1a2a] border-b border-gray-800 flex items-center px-2 py-0.5 gap-2 flex-shrink-0" style={{minHeight:24}}>
        <div className="flex items-center gap-1.5">
          {/* ЛАПА логотип — лапа SVG */}
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0" title="Лапа">
            <svg viewBox="0 0 32 32" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="7" r="3.2" fill="#4fc3f7"/>
              <circle cx="20" cy="7" r="3.2" fill="#4fc3f7"/>
              <circle cx="7"  cy="13" r="2.6" fill="#4fc3f7"/>
              <circle cx="25" cy="13" r="2.6" fill="#4fc3f7"/>
              <path d="M16 28C10 28 6 22.5 7 17.5C7.8 13.5 11 12 16 12C21 12 24.2 13.5 25 17.5C26 22.5 22 28 16 28Z" fill="#4fc3f7"/>
            </svg>
          </div>
        </div>
        <div className="flex items-center gap-0.5 ml-1">
          <button title="Открыть проект" onClick={openProjectDialog}
            className="text-gray-400 hover:text-white hover:bg-[#0078d4] rounded px-1 py-0.5 transition-colors text-xs">🗁</button>
          <button title={currentProjectName ? `Сохранить в «${currentProjectName}»` : "Сохранить в проект"}
            onClick={() => {
              fetch(PROJECTS_URL)
                .then(r => r.json())
                .then((data: {id:number;name:string;type:string}[]) => {
                  setSaveProjects(data)
                  setSaveToProjectId(currentProjectId)
                  setShowSaveDialog(true)
                })
            }}
            className="text-gray-400 hover:text-white hover:bg-[#0078d4] rounded px-1 py-0.5 transition-colors text-xs">💾</button>
          <button title={`Отменить${undoStack.length > 1 ? ": " + undoStack[undoStack.length-1] : ""}`}
            onClick={doUndo} disabled={undoStack.length <= 1}
            className={`rounded px-1 py-0.5 transition-colors text-xs ${undoStack.length > 1 ? "text-gray-400 hover:text-white hover:bg-[#0078d4]" : "text-gray-700 cursor-not-allowed"}`}>↩</button>
          <button title={`Повторить${redoStack.length > 0 ? ": " + redoStack[redoStack.length-1] : ""}`}
            onClick={doRedo} disabled={redoStack.length === 0}
            className={`rounded px-1 py-0.5 transition-colors text-xs ${redoStack.length > 0 ? "text-gray-400 hover:text-white hover:bg-[#0078d4]" : "text-gray-700 cursor-not-allowed"}`}>↪</button>
        </div>
        <select value={`ЛАПА ${viewDimension}`} onChange={e => setViewDimension(e.target.value.includes("2D") ? "2D" : "3D")}
          className="bg-[#2d2d4e] border border-gray-600 text-[10px] text-gray-300 px-1 py-0.5 ml-1 cursor-pointer outline-none focus:border-blue-500" style={{maxWidth:110}}>
          <option value="ЛАПА 3D">ЛАПА 3D</option>
          <option value="ЛАПА 2D">ЛАПА 2D</option>
        </select>
        <div className="flex-1 text-center text-[11px] text-gray-300 font-semibold tracking-wide select-none flex items-center justify-center gap-1.5">
          <svg viewBox="0 0 32 32" width="12" height="12" fill="none"><ellipse cx="16" cy="22" rx="7" ry="6" fill="#4fc3f7"/><ellipse cx="10" cy="13" rx="3" ry="3.5" fill="#4fc3f7"/><ellipse cx="22" cy="13" rx="3" ry="3.5" fill="#4fc3f7"/><ellipse cx="7" cy="18" rx="2.5" ry="3" fill="#4fc3f7"/><ellipse cx="25" cy="18" rx="2.5" ry="3" fill="#4fc3f7"/><ellipse cx="16" cy="8" rx="2.5" ry="2.8" fill="#4fc3f7"/></svg>
          <span className="text-white">ЛАПА — Редактор</span>
          <span className="text-gray-500 mx-1">—</span>
          <span className="text-gray-300">{activeDrawingTab}</span>
          {currentProjectName && <span className="text-[#4fc3f7] ml-1">· {currentProjectName}</span>}
        </div>
        <div className="flex items-center gap-1 ml-auto">
          {/* Кнопки навигации между модулями */}
          <button onClick={() => onNavigate?.("viewer3d")} title="Открыть 3D-вьюер"
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded transition-colors text-gray-400 hover:text-white hover:bg-[#0078d4]/50 border border-gray-700 hover:border-[#0078d4]">
            <Icon name="Box" size={11} fallback="Square"/>
            <span>3D-вид</span>
          </button>
          <button onClick={() => onNavigate?.("projects")} title="Управление проектами"
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded transition-colors text-gray-400 hover:text-white hover:bg-[#0078d4]/50 border border-gray-700 hover:border-[#0078d4]">
            <Icon name="FolderKanban" size={11} fallback="Folder"/>
            <span>Проекты</span>
          </button>
          <input placeholder="Введите ключевое слово или фразу" className="bg-[#2a2a3a] border border-gray-600 text-[10px] text-gray-400 px-2 py-0.5 w-36 rounded-sm placeholder-gray-600 outline-none focus:border-blue-500 ml-1" />
          <button onClick={()=>setShowAssistant(p=>!p)} title="ЛАПА-Ассистент AI"
            className={`ml-1 flex items-center gap-1 text-[10px] px-2 py-0.5 rounded transition-colors ${showAssistant?"bg-[#0078d4] text-white":"text-gray-400 hover:text-white hover:bg-[#0078d4]/40"}`}>
            <Icon name="Bot" size={11} fallback="HelpCircle"/>
            <span>AI</span>
          </button>
          <button onClick={()=>setShowAbout(true)} title="О программе Лапа"
            className="ml-0.5 w-6 h-6 flex items-center justify-center text-[11px] font-bold text-gray-500 hover:text-white hover:bg-[#252535] rounded transition-colors border border-transparent hover:border-gray-600">
            ?
          </button>
        </div>
      </div>

      {/* ── Menu bar (ribbon tabs) ── */}
      <div className="bg-[#2d2d3d] border-b border-gray-700 flex items-center gap-0 overflow-x-auto flex-shrink-0">
        {MENU_ITEMS.map(m => (
          <button key={m}
            onClick={() => {
              if (m === "Геопозиционирование") { setShowGeoMenu(p=>!p); return }
              setActiveMenuTab(m); setStatusMsg(`Лента: ${m}`)
            }}
            className={`px-3 py-1.5 text-xs whitespace-nowrap transition-colors border-b-2 ${
              m === "Геопозиционирование"
                ? showGeoMenu ? "border-[#0078d4] bg-[#252535] text-white" : "border-transparent text-gray-400 hover:bg-gray-700 hover:text-white"
                : activeMenuTab === m ? "border-[#0078d4] bg-[#252535] text-white" : "border-transparent text-gray-400 hover:bg-gray-700 hover:text-white"
            }`}>
            {m}
          </button>
        ))}
      </div>

      {/* ── Ribbon toolbar ── */}
      <div ref={dropdownRef} className="bg-[#2a2a3a] border-b border-gray-700 flex items-stretch gap-0 overflow-x-auto flex-shrink-0 relative" style={{height:82}}>
        {currentToolbar.map(group => {
          const lgItems = (group.items as RibbonItem[]).filter(i => i.size === "lg")
          const smItems = (group.items as RibbonItem[]).filter(i => i.size === "sm")
          const dropdownPanel = (dropKey: string) => (
            <div className="absolute top-full left-0 z-50 bg-[#2d2d3d] border border-gray-600 shadow-xl min-w-[200px] py-1 rounded mt-0.5">
              {(DROPDOWN_ITEMS[dropKey] || []).map(sub => (
                <button key={sub} onClick={() => { handleDropdownItem(dropKey, sub); setOpenDropdown(null) }}
                  className="w-full text-left px-3 py-1 text-[11px] text-gray-300 hover:bg-[#0078d4] hover:text-white transition-colors whitespace-nowrap">
                  {sub}
                </button>
              ))}
            </div>
          )
          return (
            <div key={group.label} className="flex flex-col border-r border-gray-700 flex-shrink-0" style={{height:82}}>
              {/* buttons row — fixed height 66px */}
              <div className="flex items-stretch px-1 pt-1 gap-0.5" style={{height:66}}>

                {/* ─ Large buttons ─ */}
                {lgItems.map(item => {
                  const dropKey = item.drop
                  const hasDrop = !!(dropKey && DROPDOWN_ITEMS[dropKey])
                  const dKey = dropKey || item.label
                  const isOpen = openDropdown === dKey
                  return (
                    <div key={item.label} className="relative flex-shrink-0 flex flex-col" style={{width:52}}>
                      <div className={`flex flex-col items-center rounded transition-colors flex-1 ${isOpen ? "bg-[#0078d4]" : "hover:bg-[#3a3a4e]"}`}>
                        <button
                          onClick={() => { handleToolbarItem(item.label); setOpenDropdown(null) }}
                          className="flex flex-col items-center justify-start gap-1 px-1 pt-2 w-full flex-1">
                          <Icon name={item.icon} size={24} fallback="Square" className={isOpen ? "text-white" : "text-[#c8d4e0]"} />
                          <span className={`text-[9px] leading-tight text-center w-full truncate px-0.5 ${isOpen ? "text-white" : "text-[#c8d4e0]"}`}>
                            {item.label}
                          </span>
                        </button>
                        {hasDrop && (
                          <button
                            onClick={e => { e.stopPropagation(); setOpenDropdown(isOpen ? null : dKey) }}
                            className={`text-[9px] w-full text-center pb-0.5 hover:bg-[#005fa3] rounded-b transition-colors ${isOpen ? "text-white" : "text-gray-400 hover:text-white"}`}>
                            ▾
                          </button>
                        )}
                      </div>
                      {hasDrop && isOpen && dropdownPanel(dropKey!)}
                    </div>
                  )
                })}

                {/* ─ Small buttons ─ */}
                {smItems.length > 0 && (
                  <div className="flex flex-col justify-around py-0.5 ml-0.5" style={{height:66}}>
                    {smItems.map(item => {
                      const dropKey = item.drop
                      const hasDrop = !!(dropKey && DROPDOWN_ITEMS[dropKey])
                      const dKey = dropKey || item.label
                      const isOpen = openDropdown === dKey
                      return (
                        <div key={item.label} className="relative flex items-center">
                          <button
                            onClick={() => { handleToolbarItem(item.label); setOpenDropdown(null) }}
                            className={`flex items-center gap-1 pl-1 pr-0.5 py-px rounded-l transition-colors text-[10px] leading-tight whitespace-nowrap ${isOpen ? "bg-[#0078d4] text-white" : "text-[#c8d4e0] hover:bg-[#3a3a4e] hover:text-white"}`}>
                            <Icon name={item.icon} size={13} fallback="Square" />
                            <span className="max-w-[80px] truncate">{item.label}</span>
                          </button>
                          {hasDrop && (
                            <button
                              onClick={e => { e.stopPropagation(); setOpenDropdown(isOpen ? null : dKey) }}
                              className={`px-0.5 py-px text-[9px] rounded-r border-l border-gray-600 transition-colors ${isOpen ? "bg-[#0078d4] text-white" : "text-gray-400 hover:bg-[#3a3a4e] hover:text-white"}`}>
                              ▾
                            </button>
                          )}
                          {hasDrop && isOpen && dropdownPanel(dropKey!)}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* group label — fixed 16px */}
              <div className="flex items-center justify-center border-t border-gray-700 bg-[#252535] whitespace-nowrap" style={{height:16}}>
                <span className="text-[9px] text-gray-500 px-1">{group.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Drawing tab bar ── */}
      <div className="bg-[#252535] border-b border-gray-700 flex items-center gap-0 px-1 py-0" style={{minHeight:22}}>
        <span className="text-[9px] text-gray-500 px-2">[-]</span>
        <div className="flex items-center gap-0">
          <button onClick={()=>setShowStartScreen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] border-r border-gray-700 transition-colors whitespace-nowrap ${showStartScreen?"bg-[#252535] text-white border-b-2 border-b-[#0078d4]":"text-gray-400 hover:text-white hover:bg-[#252535]"}`}>
            <Icon name="Home" size={11}/>
            Начало
          </button>
          {drawingTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveDrawingTab(tab)}
              className={`border-t border-l border-r border-gray-600 px-3 py-0.5 text-[10px] flex items-center gap-1 border-b-0 transition-colors ${activeDrawingTab === tab ? "bg-[#1e1e2e] text-blue-300" : "bg-[#2a2a3e] text-gray-500 hover:text-gray-300"}`}
            >
              <Icon name="FileText" size={9} />
              {tab}
              {drawingTabs.length > 1 && (
                <span
                  className="ml-1 text-gray-500 hover:text-white text-[9px]"
                  onClick={e => {
                    e.stopPropagation()
                    const next = drawingTabs.filter(t => t !== tab)
                    setDrawingTabs(next)
                    if (activeDrawingTab === tab) setActiveDrawingTab(next[0])
                  }}
                >✕</span>
              )}
            </button>
          ))}
          <button
            className="text-gray-500 hover:text-white px-2 py-0.5 text-[10px]"
            onClick={openProjectDialog}
            title="Открыть проект"
          >+</button>
        </div>
      </div>

      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: Toolbox strip ── */}
        <div className="bg-[#252535] border-r border-gray-700 w-7 flex flex-col items-center py-1 gap-0.5">
          {([
            { icon: "MousePointer2", title: "Выбор (S)",           tool: "select" as EditTool },
            { icon: "Move",          title: "Перенести (M)",       tool: "move" as EditTool },
            { icon: "Minus",         title: "Линия (L)",           tool: "line" as EditTool },
            { icon: "Spline",        title: "Полилиния (P)",       tool: "polyline" as EditTool },
            { icon: "MapPin",        title: "Точка (O)",           tool: "point" as EditTool },
            { icon: "Square",        title: "Прямоугольник (R)",   tool: "rect" as EditTool },
            { icon: "Circle",        title: "Окружность (C)",      tool: "circle" as EditTool },
            { icon: "RefreshCw",     title: "Дуга (A) — 3 точки", tool: "arc" as EditTool },
            { icon: "Trash2",        title: "Удалить (Del)",       tool: "delete" as EditTool },
          ] as {icon:string;title:string;tool:EditTool}[]).map(({ icon, title, tool }) => (
            <button key={tool} title={title}
              onClick={() => { setActiveTool(tool); setDrawingPts([]); setStatusMsg(`Инструмент: ${title}`) }}
              className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${activeTool === tool ? "bg-[#0078d4] text-white" : "text-gray-400 hover:text-white hover:bg-[#3a3a4e]"}`}>
              <Icon name={icon} size={12} fallback="Square" />
            </button>
          ))}
          <div className="w-full border-t border-gray-700 my-0.5"/>
          {([
            { icon: "Hand",    title: "Панорама",    tool: "pan" as EditTool },
            { icon: "ZoomIn",  title: "Увеличить",   tool: "select" as EditTool, action: () => setZoom(z => z*1.25) },
            { icon: "ZoomOut", title: "Уменьшить",   tool: "select" as EditTool, action: () => setZoom(z => z*0.8) },
            { icon: "Ruler",   title: "Измерение",   tool: "measure" as EditTool },
            { icon: "Layers",  title: "Слои",        tool: "select" as EditTool, action: () => setShowLayers(true) },
          ] as {icon:string;title:string;tool:EditTool;action?:()=>void}[]).map(({ icon, title, tool, action }) => (
            <button key={icon} title={title}
              onClick={() => { if (action) action(); else { setActiveTool(tool); setDrawingPts([]) }; setStatusMsg(`Инструмент: ${title}`) }}
              className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${activeTool === tool && !action ? "bg-[#0078d4] text-white" : "text-gray-400 hover:text-white hover:bg-[#3a3a4e]"}`}>
              <Icon name={icon} size={12} fallback="Square" />
            </button>
          ))}
          <div className="w-full border-t border-gray-700 my-0.5"/>
          <button title="Свойства выделенного (Ctrl+1)"
            onClick={() => setShowProperties(p => !p)}
            className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${showProperties ? "bg-[#0078d4] text-white" : "text-gray-400 hover:text-white hover:bg-[#3a3a4e]"}`}>
            <Icon name="ListFilter" size={12} fallback="List" />
          </button>
          <div className="w-full border-t border-gray-700 my-0.5"/>
          <button title="Очистить холст"
            onClick={очиститьХолст}
            className="w-6 h-6 flex items-center justify-center rounded transition-colors text-gray-400 hover:text-white hover:bg-red-600">
            <Icon name="Eraser" size={12} fallback="Trash2" />
          </button>
          <button title="Загрузить демо-пример"
            onClick={загрузитьПример}
            className="w-6 h-6 flex items-center justify-center rounded transition-colors text-gray-400 hover:text-white hover:bg-[#3a3a4e]">
            <Icon name="FileStack" size={12} fallback="Files" />
          </button>
        </div>

        {/* ── Left: Toolspace — точная структура Civil 3D ── */}
        {/* Вертикальные боковые вкладки (как на скрине справа от дерева) */}
        <div className="bg-[#2d2d3d] border-r border-gray-700 flex flex-col flex-shrink-0 overflow-hidden" style={{width:14}}>
          {([
            {id:"prospector",label:"Обозреватель"},
            {id:"settings",label:"Настройки"},
            {id:"survey",label:"Геодезия"},
            {id:"toolbox",label:"Инструменты"},
          ] as const).map((t,i) => (
            <button key={t.id} onClick={() => setToolspaceTab(t.id)}
              className={`text-[8px] font-semibold px-0 py-3 border-b border-gray-700 transition-colors select-none
                ${toolspaceTab===t.id?"text-white bg-[#0078d4]":"text-gray-500 hover:text-gray-300 hover:bg-[#3a3a4e]"}`}
              style={{writingMode:"vertical-rl",transform:"rotate(180deg)",letterSpacing:"0.05em"}}>
              {t.label}
            </button>
          ))}
          <div className="flex-1"/>
        </div>

        {/* Основная панель дерева */}
        <div className="bg-[#1e1e2e] border-r border-gray-600 flex flex-col overflow-hidden flex-shrink-0" style={{ width: 175 }}>
          {/* TOOL SPACE header */}
          <div className="bg-[#252535] px-2 py-1 flex items-center justify-between border-b border-gray-600 flex-shrink-0">
            <span className="text-[10px] text-gray-300 font-bold tracking-widest uppercase">ОБОЗРЕВАТЕЛЬ</span>
            <div className="flex gap-0.5">
              {[
                { icon: "ClipboardList", title: "Обновить", action: () => setStatusMsg("Обозреватель обновлён") },
                { icon: "Search",        title: "Поиск",    action: () => setStatusMsg("Поиск объектов...") },
                { icon: "HelpCircle",    title: "Справка",  action: () => setStatusMsg("Справка Лапа") },
              ].map(({ icon, title, action }) => (
                <button key={icon} title={title} onClick={action}
                  className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#0078d4] rounded transition-colors">
                  <Icon name={icon} size={10} fallback="Square" />
                </button>
              ))}
              <button title="My Insights" onClick={()=>setShowInsights(p=>!p)}
                className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${showInsights?"bg-yellow-500/20 text-yellow-400":"text-gray-400 hover:text-white hover:bg-[#0078d4]"}`}>
                <Icon name="Sparkles" size={10} fallback="Star" />
              </button>
              <button title="Инструменты автоматизации" onClick={()=>setShowScriptEditor(s=>!s)}
                className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${showScriptEditor?"bg-purple-500/20 text-purple-400":"text-gray-400 hover:text-white hover:bg-[#0078d4]"}`}>
                <Icon name="Code" size={10} fallback="FileCode"/>
              </button>
            </div>
          </div>

          {/* Active Drawing View selector */}
          <div className="bg-[#1a1a2a] border-b border-gray-600 flex-shrink-0">
            <select value={activeDrawingTab}
              onChange={e => { setActiveDrawingTab(e.target.value); setShowStartScreen(false) }}
              className="w-full bg-transparent text-[10px] text-gray-300 px-2 py-1 outline-none cursor-pointer hover:bg-[#252535]">
              <option value="">— Вид активного чертёжа —</option>
              {drawingTabs.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {/* Toolspace tab content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#1e1e2e]">
            {toolspaceTab === "prospector" && (
              treeData.map(node => (
                <TreeItem key={node.id} node={node} depth={0} selected={selectedNode}
                  onSelect={setSelectedNode} onToggle={toggleNode} onAction={handleTreeNodeAction} />
              ))
            )}
            {toolspaceTab === "navigator" && (
              <div className="p-1 space-y-0.5">
                <div className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider px-1 py-1">Открытые чертежи</div>
                {drawingTabs.map(tab => (
                  <div key={tab}
                    onClick={() => { setActiveDrawingTab(tab); setShowStartScreen(false) }}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-colors ${activeDrawingTab === tab ? "bg-[#0078d4]/30 text-blue-300 border border-[#0078d4]/50" : "text-gray-400 hover:bg-[#2a2a3e] hover:text-gray-200"}`}>
                    <Icon name="FileText" size={10} fallback="File" className="flex-shrink-0" />
                    <span className="flex-1 text-[10px] truncate">{tab}</span>
                    {activeDrawingTab === tab && <span className="text-[8px] text-blue-400">●</span>}
                    {drawingTabs.length > 1 && (
                      <span className="text-[9px] text-gray-600 hover:text-red-400 transition-colors"
                        onClick={e => {
                          e.stopPropagation()
                          const next = drawingTabs.filter(t => t !== tab)
                          setDrawingTabs(next)
                          if (activeDrawingTab === tab) setActiveDrawingTab(next[0])
                        }}>✕</span>
                    )}
                  </div>
                ))}
                {drawingTabs.length === 0 && (
                  <div className="text-[10px] text-gray-600 px-2 py-2 italic">Нет открытых чертежей</div>
                )}
                <div className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider px-1 py-1 pt-3">Начало работы</div>
                <div onClick={() => setShowStartScreen(true)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-colors ${showStartScreen ? "bg-[#0078d4]/30 text-blue-300 border border-[#0078d4]/50" : "text-gray-400 hover:bg-[#2a2a3e] hover:text-gray-200"}`}>
                  <Icon name="Home" size={10} fallback="Home" className="flex-shrink-0" />
                  <span className="flex-1 text-[10px]">Начало</span>
                </div>
              </div>
            )}
            {toolspaceTab === "settings" && (
              <div className="p-2 space-y-2 text-[11px]">
                <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider px-1">Единицы измерения</div>
                {[
                  { label: "Угловые единицы", val: "Градусы" },
                  { label: "Расстояние", val: "Метры" },
                  { label: "Высота", val: "Метры" },
                  { label: "Площадь", val: "м²" },
                  { label: "Объём", val: "м³" },
                  { label: "Масштаб", val: "1:500" },
                ].map(p => (
                  <div key={p.label} className="flex items-center justify-between gap-1 py-1 border-b border-gray-800">
                    <span className="text-gray-400 text-[10px] truncate">{p.label}</span>
                    <span className="text-white text-[10px] font-mono">{p.val}</span>
                  </div>
                ))}
                <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider px-1 pt-2">Система координат</div>
                {[
                  { label: "СК", val: "МСК-63" },
                  { label: "Проекция", val: "Гаусс-Крюгер" },
                  { label: "Зона", val: "3" },
                  { label: "Эллипсоид", val: "Красовского" },
                ].map(p => (
                  <div key={p.label} className="flex items-center justify-between gap-1 py-1 border-b border-gray-800">
                    <span className="text-gray-400 text-[10px] truncate">{p.label}</span>
                    <span className="text-white text-[10px] font-mono">{p.val}</span>
                  </div>
                ))}
                <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider px-1 pt-2">Стили</div>
                {[
                  { label: "Стиль точек", val: "Базовый" },
                  { label: "Стиль трасс", val: "Все подписи" },
                  { label: "Стиль поверх.", val: "Без отобр." },
                ].map(p => (
                  <div key={p.label} className="flex items-center justify-between gap-1 py-1 border-b border-gray-800">
                    <span className="text-gray-400 text-[10px] truncate">{p.label}</span>
                    <span className="text-white text-[10px] font-mono">{p.val}</span>
                  </div>
                ))}
              </div>
            )}
            {toolspaceTab === "survey" && (
              <div className="p-2 space-y-2 text-[10px]">
                <div className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider px-1">Съёмочные данные</div>
                <div className="bg-[#252535] rounded p-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Точек съёмки</span>
                    <span className="text-white font-mono">1 247</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Теодолитных ходов</span>
                    <span className="text-white font-mono">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Невязка (f)</span>
                    <span className="text-green-400 font-mono">1:8500</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Базисная линия</span>
                    <span className="text-white font-mono">842.31м</span>
                  </div>
                </div>
                <div className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider px-1 pt-1">Базы данных съёмки</div>
                {["ЦМР_Съёмка_2024", "Теодолит_ход_1", "Пикеты_гл_ось"].map(db => (
                  <div key={db} className="flex items-center gap-1.5 px-1 py-1 hover:bg-[#252535] rounded cursor-pointer">
                    <Icon name="Database" size={9} fallback="Folder" className="text-yellow-500 flex-shrink-0" />
                    <span className="text-gray-300 text-[10px] truncate">{db}</span>
                  </div>
                ))}
                <div className="pt-1 flex flex-col gap-1">
                  <button className="text-[9px] text-gray-400 hover:text-white hover:bg-[#0078d4]/20 px-2 py-1 rounded border border-gray-700 text-left transition-colors">
                    + Импорт точек (CSV/TXT)
                  </button>
                  <button className="text-[9px] text-gray-400 hover:text-white hover:bg-[#0078d4]/20 px-2 py-1 rounded border border-gray-700 text-left transition-colors">
                    Отчёт о невязке
                  </button>
                </div>
              </div>
            )}
            {toolspaceTab === "toolbox" && (
              <div className="p-1 space-y-0.5">
                <div className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider px-1 py-1">Утилиты</div>
                {[
                  { icon: "Calculator", label: "Вычисление объёмов", sub: "Метод сечений" },
                  { icon: "Map", label: "Геодезические расчёты", sub: "Прямая/обратная задачи" },
                  { icon: "TrendingUp", label: "Продольный профиль", sub: "По трассе" },
                  { icon: "Layers", label: "Диспетчер слоёв", sub: "Управление слоями" },
                  { icon: "Table", label: "Ведомость отметок", sub: "Таблица по пикетам" },
                  { icon: "FileBarChart", label: "Ведомость объёмов", sub: "CSV / XLS экспорт" },
                  { icon: "Crosshair", label: "Привязка к точкам", sub: "Snap к съёмке" },
                  { icon: "BarChart3", label: "Анализ уклонов", sub: "Цветовая карта" },
                ].map(tool => (
                  <div key={tool.label}
                    className="flex items-start gap-1.5 px-2 py-1.5 hover:bg-[#252535] rounded cursor-pointer group transition-colors"
                    onClick={() => setStatusMsg(`Инструмент: ${tool.label}`)}>
                    <Icon name={tool.icon} size={10} fallback="Wrench" className="text-[#0078d4] flex-shrink-0 mt-0.5 group-hover:text-blue-300" />
                    <div>
                      <div className="text-[10px] text-gray-300 group-hover:text-white leading-tight">{tool.label}</div>
                      <div className="text-[9px] text-gray-600">{tool.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Миниатюра чертежа (превью) ── */}
        <div className="bg-[#0a0a18] border-t border-r border-gray-800 flex-shrink-0 overflow-hidden" style={{width:160,position:"absolute",bottom:0,left:0,height:88,zIndex:5}}>
          <div className="px-2 py-0.5 bg-[#111122] border-b border-gray-800 flex items-center justify-between">
            <span className="text-[8px] text-gray-600 uppercase tracking-wide">Просмотр</span>
            <span className="text-[8px] text-gray-700">{scale}</span>
          </div>
          <svg width="160" height="68" viewBox="-20 -10 1000 440" style={{background:"#080814"}}>
            {[0,1,2,3,4].map(i=>(
              <path key={i} d={`M-20,${60+i*60} Q250,${50+i*55} 500,${65+i*50} Q750,${75+i*45} 980,${55+i*60}`}
                stroke={`rgba(60,130,60,${0.15+i*0.04})`} strokeWidth="4" fill="none"/>
            ))}
            <polyline points="80,60 160,90 260,110 370,95 460,80 540,70 630,85 720,100 810,88 880,72" stroke="#ef4444" strokeWidth="5" fill="none"/>
            <polyline points="100,180 200,190 310,185 420,195 530,188 640,200 740,195 840,188" stroke="#a855f7" strokeWidth="5" fill="none"/>
            <polyline points="180,120 220,130 270,160 290,210 280,260 250,300 210,320 170,310 140,280 130,240 140,190 160,155 180,120" stroke="#06b6d4" strokeWidth="4" fill="none"/>
            <polyline points="120,280 180,275 240,268 300,260 360,255 420,258 480,265" stroke="#6366f1" strokeWidth="3" fill="none"/>
            {[[95,55],[305,108],[485,78],[680,92],[870,68]].map(([x,y],i)=>(
              <circle key={i} cx={x} cy={y} r="7" fill="#f59e0b"/>
            ))}
          </svg>
        </div>

        {/* ── Side tabs (Навигатор / Параметры / Съёмка / Панель инструментов) ── */}
        <div className="bg-[#1e1e2e] border-r border-gray-700 w-4 flex flex-col items-center py-2 gap-3">
          {[
            { label: "Навигатор", id: "nav" },
            { label: "Параметры", id: "params" },
            { label: "Съёмка", id: "survey" },
            { label: "Панель инструментов", id: "tools" },
          ].map(t => (
            <button key={t.label}
              onClick={() => setActiveSideTab(prev => prev === t.id ? null : t.id)}
              className={`text-[8px] cursor-pointer transition-colors px-0.5 py-1 rounded ${activeSideTab === t.id ? "text-[#0078d4] bg-[#0078d4]/10" : "text-gray-600 hover:text-gray-300"}`}
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>{t.label}</button>
          ))}
        </div>

        {/* ── Centre: Viewport ── */}
        <div ref={viewportContainerRef} className="flex-1 flex flex-col relative overflow-hidden bg-[#1a1a2e]">
          {/* Viewport top controls bar */}
          <div className="absolute top-0 left-0 z-20 flex items-center gap-1 bg-black/40 border-b border-gray-800 px-1">
            <button onClick={() => setSplitView(s => !s)}
              className={`text-[9px] px-1.5 py-0.5 border border-gray-700 rounded transition-colors ${splitView ? "text-[#0078d4] bg-[#0078d4]/20 border-[#0078d4]/50" : "text-gray-400 hover:text-white"}`}
              title="Разделить видовой экран">⊟</button>
            <button
              onClick={() => {
                setMultiViewport(mv => {
                  const next = !mv
                  if (next) setViewportLayout("2h")
                  else setViewportLayout("single")
                  return next
                })
              }}
              className={`text-[9px] px-1.5 py-0.5 border border-gray-700 rounded transition-colors ${multiViewport ? "text-[#0078d4] bg-[#0078d4]/20 border-[#0078d4]/50" : "text-gray-400 hover:text-white"}`}
              title="Несколько видовых экранов (MDI)">⧉</button>
            {multiViewport && (
              <div className="flex items-center gap-0.5 border-l border-gray-700 pl-1 ml-0.5">
                {([
                  { layout: "2h" as const, label: "║" , title: "2 горизонтально" },
                  { layout: "2v" as const, label: "═" , title: "2 вертикально" },
                  { layout: "4"  as const, label: "⊞" , title: "4 окна" },
                ] as {layout:"2h"|"2v"|"4";label:string;title:string}[]).map(opt => (
                  <button key={opt.layout}
                    onClick={() => setViewportLayout(opt.layout)}
                    className={`text-[9px] px-1 py-0.5 border border-gray-700 rounded transition-colors ${viewportLayout === opt.layout ? "text-[#0078d4] bg-[#0078d4]/20" : "text-gray-400 hover:text-white"}`}
                    title={opt.title}>{opt.label}</button>
                ))}
              </div>
            )}
            <button onClick={() => { setZoom(1.1); setPan({ x: 30, y: 20 }) }} className="text-[9px] text-gray-400 hover:text-white bg-black/30 px-1 py-0.5 rounded">Вписать</button>
            <button onClick={() => setZoom(z => z * 1.25)} className="text-[9px] text-gray-400 hover:text-white bg-black/30 px-1.5 py-0.5 rounded">+</button>
            <button onClick={() => setZoom(z => z * 0.8)} className="text-[9px] text-gray-400 hover:text-white bg-black/30 px-1.5 py-0.5 rounded">−</button>
            <button onClick={() => setShowRightPanel(s => !s)} className="text-[9px] text-gray-400 hover:text-white bg-black/30 px-1 py-0.5 rounded">
              <Icon name={showRightPanel ? "PanelRightClose" : "PanelRightOpen"} size={11} />
            </button>
          </div>

          {/* ── Profile panel (top, only in split mode) ── */}
          {splitView && (
            <div className="flex-shrink-0 relative overflow-hidden" style={{ height: `${splitRatio * 100}%` }}>
              {/* Profile viewport header */}
              <div className="absolute top-0 left-0 z-10 flex items-center gap-0 bg-black/60 border-b border-gray-800">
                <button className="text-[10px] text-gray-300 hover:bg-gray-700 px-1.5 py-0.5 border-r border-gray-700">[+]</button>
                <button className="text-[10px] text-gray-300 hover:bg-gray-700 px-2 py-0.5 border-r border-gray-700">[Сверху]</button>
                <button className="text-[10px] text-gray-300 hover:bg-gray-700 px-2 py-0.5">[2D-каркас]</button>
              </div>
              {/* Profile SVG */}
              <svg width="100%" height="100%" style={{ background: "#111827", display: "block", paddingTop: 18 }}>
                {/* Grid lines */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <line key={`vg${i}`} x1={`${(i / 11) * 100}%`} y1="0" x2={`${(i / 11) * 100}%`} y2="100%" stroke="rgba(59,130,246,0.12)" strokeWidth="0.5" />
                ))}
                {Array.from({ length: 6 }).map((_, i) => (
                  <line key={`hg${i}`} x1="0" y1={`${(i / 5) * 100}%`} x2="100%" y2={`${(i / 5) * 100}%`} stroke="rgba(59,130,246,0.12)" strokeWidth="0.5" />
                ))}
                {/* Station axis labels */}
                {["0+700.00м","0+712.19м","0+724.19м","0+735.19м","0+748.19м","0+766.19м","0+800.00м"].map((lbl, i) => {
                  const x = 4 + (i / 6) * 92
                  return (
                    <g key={lbl}>
                      <line x1={`${x}%`} y1="88%" x2={`${x}%`} y2="92%" stroke="#4b5563" strokeWidth="1" />
                      <text x={`${x}%`} y="97%" textAnchor="middle" fill="#6b7280" fontSize="6" fontFamily="monospace">{lbl}</text>
                    </g>
                  )
                })}
                {/* Warning triangles at problem stations */}
                {[1, 3, 4, 6, 7].map(idx => {
                  const x = 4 + (idx / 6) * 92
                  return (
                    <text key={`warn${idx}`} x={`${x}%`} y="22%" textAnchor="middle" fill="#f59e0b" fontSize="10">⚠</text>
                  )
                })}
                {/* Red horizontal line — обочина */}
                <line x1="4%" y1="55%" x2="96%" y2="55%" stroke="#ef4444" strokeWidth="1.5" />
                {/* Blue diagonal lines — design profile with varying slope */}
                <polyline points="4%,75% 18%,68% 38%,55% 52%,52% 65%,52% 78%,58% 96%,65%"
                  fill="none" stroke="#3b82f6" strokeWidth="2" />
                {/* Green lines — lane edges */}
                <line x1="4%" y1="38%" x2="96%" y2="38%" stroke="#4ade80" strokeWidth="1.5" />
                <line x1="4%" y1="82%" x2="96%" y2="82%" stroke="#4ade80" strokeWidth="1.5" />
                {/* Slope percentage labels */}
                <text x="11%" y="48%" textAnchor="middle" fill="#e5e7eb" fontSize="7" fontFamily="monospace">-4.00%</text>
                <text x="30%" y="44%" textAnchor="middle" fill="#e5e7eb" fontSize="7" fontFamily="monospace">-6.00%</text>
                <text x="58%" y="47%" textAnchor="middle" fill="#e5e7eb" fontSize="7" fontFamily="monospace">-4.00%</text>
                <text x="84%" y="50%" textAnchor="middle" fill="#e5e7eb" fontSize="7" fontFamily="monospace">-2.00%</text>
                {/* Green labels */}
                <text x="5%" y="35%" fill="#4ade80" fontSize="7" fontFamily="Arial">Кривая Curve.3</text>
                <text x="40%" y="31%" fill="#4ade80" fontSize="7" fontFamily="Arial">Начало/конец отгона</text>
                <text x="18%" y="60%" fill="#4ade80" fontSize="7" fontFamily="Arial">Обочина</text>
                <text x="62%" y="26%" fill="#4ade80" fontSize="7" fontFamily="Arial">Продолжение отгона</text>
                {/* Corridor hatch pattern */}
                <rect x="4%" y="75%" width="92%" height="7%" fill="none" stroke="#f97316" strokeWidth="0.5" strokeDasharray="4 3" opacity="0.5" />
              </svg>
            </div>
          )}

          {/* ── Splitter bar ── */}
          {splitView && (
            <div
              className="flex-shrink-0 bg-[#1a1a2e] border-y border-[#0078d4] cursor-row-resize hover:bg-[#0078d4]/30 transition-colors z-20"
              style={{ height: 5 }}
              onMouseDown={e => {
                splitDragRef.current = true
                splitStartY.current = e.clientY
                splitStartRatio.current = splitRatio
                const onMove = (ev: MouseEvent) => {
                  if (!splitDragRef.current) return
                  const container = viewportContainerRef.current
                  if (!container) return
                  const h = container.getBoundingClientRect().height
                  const delta = ev.clientY - splitStartY.current
                  const newRatio = Math.max(0.15, Math.min(0.75, splitStartRatio.current + delta / h))
                  setSplitRatio(newRatio)
                }
                const onUp = () => { splitDragRef.current = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp) }
                window.addEventListener("mousemove", onMove)
                window.addEventListener("mouseup", onUp)
              }}
            />
          )}

          {/* ── Plan view (bottom or full if no split) ── */}
          <div className="flex-1 relative overflow-hidden">

            {/* ── Multi-viewport MDI overlay (Civil 3D style — реальные данные) ── */}
            {multiViewport && (() => {
              const count = viewportLayout === "4" ? 4 : 2
              // Имена окон
              const winNames = [
                drawingTabs[0]||"Align-Superelevation-5.dwg",
                "01_corridor.dwg",
                "02_earthwork.dwg",
                "03_profile.dwg",
              ]
              // Типы видов для каждого окна
              const defaultViewTypes: ("plan"|"profile"|"section"|"3d")[] =
                viewportLayout === "4" ? ["plan","profile","section","3d"]
                : viewportLayout === "2v" ? ["plan","profile"]
                : ["plan","profile"]

              const is4 = viewportLayout === "4"
              const isV = viewportLayout === "2v"

              // ── Вспомогательные функции рендера SVG ───────────────────────

              // ПЛАН — трасса + TIN горизонтали + активная станция
              const renderPlanView = (w: number, h: number) => {
                const sc = civilScene
                const al = sc.alignment
                const minX = 80, minY = 300, scaleF = Math.min(w,h) / 700
                const tx = (x: number) => (x - minX) * scaleF
                const ty = (y: number) => h - (y - 200) * scaleF

                // Путь трассы
                const alPts: string[] = []
                for (let s = 0; s <= al.totalLength; s += 5) {
                  const pt = stationToPoint(al, s)
                  if (pt) alPts.push(`${tx(pt.x).toFixed(1)},${ty(pt.y).toFixed(1)}`)
                }

                // Активная станция — маркер
                const activePt = stationToPoint(al, activeStation)
                const ax = activePt ? tx(activePt.x) : -999
                const ay = activePt ? ty(activePt.y) : -999

                return (
                  <g>
                    {/* Горизонтали TIN (первые 200 сегментов) */}
                    {sc.surface.contours.slice(0, 80).flatMap((c, ci) =>
                      c.segments.slice(0, 3).map((seg, si) => (
                        <line key={`c${ci}_${si}`}
                          x1={tx(seg[0].x)} y1={ty(seg[0].y)}
                          x2={tx(seg[1].x)} y2={ty(seg[1].y)}
                          stroke={c.isMajor ? "rgba(150,200,150,0.5)" : "rgba(100,150,100,0.25)"}
                          strokeWidth={c.isMajor ? 0.8 : 0.4}/>
                      ))
                    )}
                    {/* Трасса */}
                    {alPts.length > 1 && (
                      <polyline points={alPts.join(" ")} stroke="#ef4444" strokeWidth="2" fill="none"/>
                    )}
                    {/* Пикеты */}
                    {[0,100,200,300,400,500,600,700,800].map(s => {
                      const pt = stationToPoint(al, s)
                      if (!pt) return null
                      return (
                        <g key={s}>
                          <line x1={tx(pt.x)-4} y1={ty(pt.y)} x2={tx(pt.x)+4} y2={ty(pt.y)} stroke="#ef4444" strokeWidth="1"/>
                          <text x={tx(pt.x)} y={ty(pt.y)-5} fill="#f87171" fontSize="5" textAnchor="middle" fontFamily="monospace">ПК{s/100}</text>
                        </g>
                      )
                    })}
                    {/* Активная станция */}
                    {activePt && (
                      <g>
                        <circle cx={ax} cy={ay} r="5" fill="none" stroke="#fbbf24" strokeWidth="1.5"/>
                        <circle cx={ax} cy={ay} r="2" fill="#fbbf24"/>
                        <line x1={ax} y1="0" x2={ax} y2={h} stroke="#fbbf24" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.5"/>
                      </g>
                    )}
                    <text x="6" y="12" fill="#555" fontSize="6" fontFamily="monospace">ПЛАН — {al.name}</text>
                  </g>
                )
              }

              // ПРОФИЛЬ — продольный с существующей и проектной линиями
              const renderProfileView = (w: number, h: number) => {
                const sc = civilScene
                const al = sc.alignment
                const exProf = sc.existingProfile
                const desProf = sc.designProfile
                if (exProf.length === 0) return <text x="10" y="20" fill="#555" fontSize="8">Нет данных профиля</text>

                const zMin = Math.min(...exProf.map(p=>p.elevation)) - 2
                const zMax = Math.max(...exProf.map(p=>p.elevation)) + 5
                const sMin = exProf[0].station, sMax = exProf[exProf.length-1].station

                const px = (s: number) => ((s - sMin) / (sMax - sMin)) * (w - 20) + 10
                const py = (z: number) => h - 20 - ((z - zMin) / (zMax - zMin)) * (h - 40)

                // Существующая поверхность
                const exPts = exProf.map(p => `${px(p.station).toFixed(1)},${py(p.elevation).toFixed(1)}`).join(" ")
                // Проектный профиль
                const desStations: number[] = []
                for (let s = sMin; s <= sMax; s += 5) desStations.push(s)
                const desPts = desStations.map(s => {
                  const z = getDesignElevation(desProf, s)
                  return z !== null ? `${px(s).toFixed(1)},${py(z).toFixed(1)}` : null
                }).filter(Boolean).join(" ")

                // Активная станция
                const axP = px(activeStation)
                const exNear = exProf.reduce((b,p) => Math.abs(p.station-activeStation)<Math.abs(b.station-activeStation)?p:b, exProf[0])
                const desZ = getDesignElevation(desProf, activeStation)

                return (
                  <g>
                    {/* Сетка горизонталей */}
                    {Array.from({length:6}).map((_,i)=>{
                      const z = zMin + i*(zMax-zMin)/5
                      const y = py(z)
                      return <g key={i}>
                        <line x1="10" y1={y} x2={w-10} y2={y} stroke="rgba(100,100,150,0.2)" strokeWidth="0.5"/>
                        <text x="6" y={y+2} fill="#555" fontSize="4" textAnchor="end" fontFamily="monospace">{z.toFixed(0)}</text>
                      </g>
                    })}
                    {/* Пикеты */}
                    {[0,100,200,300,400,500,600,700,800].map(s=>{
                      if (s > sMax) return null
                      const x = px(s)
                      return <g key={s}>
                        <line x1={x} y1={h-20} x2={x} y2={h-15} stroke="#666" strokeWidth="0.5"/>
                        <text x={x} y={h-8} fill="#555" fontSize="4" textAnchor="middle" fontFamily="monospace">ПК{s/100}</text>
                      </g>
                    })}
                    {/* Существующая поверхность */}
                    <polyline points={exPts} stroke="#888" strokeWidth="1.5" fill="none"/>
                    {/* Проектный профиль */}
                    {desPts && <polyline points={desPts} stroke="#f97316" strokeWidth="1.5" fill="none"/>}
                    {/* Активная станция */}
                    <line x1={axP} y1="5" x2={axP} y2={h-20} stroke="#fbbf24" strokeWidth="0.8" strokeDasharray="3 2"/>
                    <circle cx={axP} cy={py(exNear.elevation)} r="3" fill="#888" stroke="#fbbf24" strokeWidth="1"/>
                    {desZ !== null && <circle cx={axP} cy={py(desZ)} r="3" fill="#f97316" stroke="#fbbf24" strokeWidth="1"/>}
                    {/* Подпись */}
                    <text x="6" y="10" fill="#555" fontSize="6" fontFamily="monospace">ПРОФИЛЬ — {al.name}</text>
                    <rect x={w-60} y="4" width="58" height="18" fill="rgba(0,0,0,0.4)" rx="2"/>
                    <line x1={w-56} y1="10" x2={w-44} y2="10" stroke="#888" strokeWidth="1.5"/>
                    <text x={w-42} y="12" fill="#aaa" fontSize="5" fontFamily="monospace">Сущ.</text>
                    <line x1={w-56} y1="18" x2={w-44} y2="18" stroke="#f97316" strokeWidth="1.5"/>
                    <text x={w-42} y="20" fill="#aaa" fontSize="5" fontFamily="monospace">Пр.</text>
                  </g>
                )
              }

              // ПОПЕРЕЧНОЕ СЕЧЕНИЕ
              const renderSectionView = (w: number, h: number) => {
                const sc = civilScene
                const sections = sc.sections
                if (sections.length === 0) return <text x="10" y="20" fill="#555" fontSize="8">Нет сечений</text>
                // Ближайшее сечение к activeStation
                const sect = sections.reduce((b, s) => Math.abs(s.station - activeStation) < Math.abs(b.station - activeStation) ? s : b, sections[0])

                const cx = w / 2
                const baseY = h * 0.55
                const scale = w / 120

                const ex = sect.existingPoints.map(p => `${(cx + p.x * scale).toFixed(1)},${(baseY - (p.y - sect.designPoints[0]?.y) * scale * 3).toFixed(1)}`).join(" ")
                const des = sect.designPoints.map(p => `${(cx + p.x * scale).toFixed(1)},${(baseY - (p.y - sect.designPoints[0]?.y) * scale * 3).toFixed(1)}`).join(" ")

                return (
                  <g>
                    <line x1="0" y1={baseY} x2={w} y2={baseY} stroke="rgba(100,100,100,0.3)" strokeWidth="0.5"/>
                    <polyline points={ex} stroke="#888" strokeWidth="1.5" fill="none"/>
                    <polyline points={des} stroke="#f97316" strokeWidth="1.5" fill="none"/>
                    {/* Разрезка насыпь/выемка */}
                    <text x="6" y="10" fill="#555" fontSize="6" fontFamily="monospace">ПК{(sect.station/100).toFixed(2)}</text>
                    <text x={w-60} y="10" fill="#f87171" fontSize="5" fontFamily="monospace">Вым: {sect.cutArea.toFixed(1)} м²</text>
                    <text x={w-60} y="17" fill="#60a5fa" fontSize="5" fontFamily="monospace">Нас: {sect.fillArea.toFixed(1)} м²</text>
                    {/* Ось */}
                    <line x1={cx} y1="2" x2={cx} y2={h} stroke="#ef4444" strokeWidth="0.5" strokeDasharray="4 2" opacity="0.6"/>
                    <text x={cx} y={h-4} fill="#ef4444" fontSize="5" textAnchor="middle" fontFamily="monospace">ОСЬ</text>
                  </g>
                )
              }

              // 3D ВИД — изометрия TIN с трассой
              const render3DView = (w: number, h: number) => {
                const sc = civilScene
                const al = sc.alignment

                const iso = (x: number, y: number, z: number) => ({
                  sx: w/2 + (x - y) * 0.6,
                  sy: h/2 - (x + y) * 0.25 - z * 0.5,
                })
                const scaleXY = 0.35, offX = 500, offY = 400, offZ = 100

                return (
                  <g>
                    {/* TIN треугольники */}
                    {sc.surface.triangles.slice(0, 200).map((tri, i) => {
                      const pa = iso((tri.a.x-offX)*scaleXY, (tri.a.y-offY)*scaleXY, (tri.a.z-offZ)*1.5)
                      const pb = iso((tri.b.x-offX)*scaleXY, (tri.b.y-offY)*scaleXY, (tri.b.z-offZ)*1.5)
                      const pc = iso((tri.c.x-offX)*scaleXY, (tri.c.y-offY)*scaleXY, (tri.c.z-offZ)*1.5)
                      const brightness = 0.15 + (Math.abs(tri.normal.z) * 0.35)
                      return (
                        <polygon key={i}
                          points={`${pa.sx.toFixed(1)},${pa.sy.toFixed(1)} ${pb.sx.toFixed(1)},${pb.sy.toFixed(1)} ${pc.sx.toFixed(1)},${pc.sy.toFixed(1)}`}
                          fill={`rgba(60,130,80,${brightness})`}
                          stroke="rgba(60,130,80,0.12)" strokeWidth="0.3"/>
                      )
                    })}
                    {/* Трасса 3D */}
                    {Array.from({length: Math.floor(al.totalLength/5)}).map((_,i) => {
                      const s0 = i*5, s1 = (i+1)*5
                      const p0 = stationToPoint(al, s0), p1 = stationToPoint(al, s1)
                      if (!p0||!p1) return null
                      const z0 = sc.existingProfile.find(p=>Math.abs(p.station-s0)<5)?.elevation ?? 100
                      const z1 = sc.existingProfile.find(p=>Math.abs(p.station-s1)<5)?.elevation ?? 100
                      const i0 = iso((p0.x-offX)*scaleXY,(p0.y-offY)*scaleXY,(z0-offZ)*1.5)
                      const i1 = iso((p1.x-offX)*scaleXY,(p1.y-offY)*scaleXY,(z1-offZ)*1.5)
                      return <line key={i} x1={i0.sx} y1={i0.sy} x2={i1.sx} y2={i1.sy} stroke="#ef4444" strokeWidth="1.5"/>
                    })}
                    <text x="6" y="10" fill="#555" fontSize="6" fontFamily="monospace">3D — TIN + Трасса</text>
                  </g>
                )
              }

              const VIEW_LABELS: Record<string, string> = {
                plan: "[−][Top][2D Wireframe]",
                profile: "[−][Профиль][Сетка вкл]",
                section: "[−][Сечение][ПК авто]",
                "3d": "[−][ЮЗ Изометрия][Тонирование]",
              }
              const VIEW_NAMES: Record<string, string> = {
                plan: "Пространство модели",
                profile: "Вид профиля",
                section: "Поперечный разрез",
                "3d": "3D вид",
              }

              const MdiWindow = ({ winIdx, active }: { winIdx: number; active: boolean }) => {
                const vt = (mdiViewTypes[winIdx] || defaultViewTypes[winIdx] || "plan") as "plan"|"profile"|"section"|"3d"
                const name = winNames[winIdx]
                const SVG_W = 500, SVG_H = 340

                const handleViewClick = () => {
                  const next: ("plan"|"profile"|"section"|"3d")[] = [...mdiViewTypes]
                  const cycle: ("plan"|"profile"|"section"|"3d")[] = ["plan","profile","section","3d"]
                  next[winIdx] = cycle[(cycle.indexOf(vt)+1) % cycle.length]
                  setMdiViewTypes(next)
                }

                const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const relX = (e.clientX - rect.left) / rect.width
                  // В плане — определяем ближайшую станцию по X
                  if (vt === "plan" || vt === "profile") {
                    const newStation = relX * civilScene.alignment.totalLength
                    setActiveStation(Math.max(0, Math.min(civilScene.alignment.totalLength, newStation)))
                  }
                  // В сечении — переходим на соседнее сечение
                  if (vt === "section") {
                    const sections = civilScene.sections
                    const idx = sections.findIndex(s => Math.abs(s.station - activeStation) < 15)
                    const nextIdx = Math.min(sections.length-1, (idx >= 0 ? idx : 0) + (relX > 0.5 ? 1 : -1))
                    if (nextIdx >= 0) setActiveStation(sections[nextIdx].station)
                  }
                }

                return (
                  <div className={`flex flex-col min-w-0 min-h-0 border ${active?"border-[#4a7fbf]":"border-[#3a3a4a]"} bg-[#0d1117]`}
                    style={{boxShadow: active?"0 0 0 1px #4a7fbf":"none"}}>
                    {/* Title bar */}
                    <div className={`flex items-center px-1 py-0.5 gap-1 flex-shrink-0 ${active?"bg-[#1b3a5c]":"bg-[#2a2a38]"}`}>
                      <div className="w-3.5 h-3.5 rounded-sm bg-[#0078d4] flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 32 32" width="9" height="9" fill="none"><ellipse cx="16" cy="22" rx="7" ry="6" fill="white"/><ellipse cx="10" cy="13" rx="3" ry="3.5" fill="white"/><ellipse cx="22" cy="13" rx="3" ry="3.5" fill="white"/><ellipse cx="7" cy="18" rx="2.5" ry="3" fill="white"/><ellipse cx="25" cy="18" rx="2.5" ry="3" fill="white"/><ellipse cx="16" cy="8" rx="2.5" ry="2.8" fill="white"/></svg>
                      </div>
                      <span className={`flex-1 text-[10px] truncate font-medium ${active?"text-white":"text-gray-400"}`}>{name}</span>
                      <span className="text-[8px] text-gray-500 font-mono">{Math.round(mdiZoom*100)}%</span>
                      <button onClick={handleViewClick} title="Сменить вид"
                        className="text-[8px] text-[#4fc3f7] hover:text-white px-1 border border-[#4fc3f7]/30 rounded transition-colors">
                        {VIEW_NAMES[vt]}
                      </button>
                      <button className="text-[9px] text-gray-400 hover:text-white hover:bg-[#555] w-4 h-4 flex items-center justify-center transition-colors" title="Свернуть">─</button>
                      <button onClick={()=>{ setMdiZoom(1); setMdiPan({x:0,y:0}) }}
                        className="text-[9px] text-gray-400 hover:text-white hover:bg-[#555] w-4 h-4 flex items-center justify-center transition-colors" title="По границам">□</button>
                      <button className="text-[9px] text-gray-400 hover:text-white hover:bg-red-600 w-4 h-4 flex items-center justify-center transition-colors"
                        onClick={() => setMultiViewport(false)} title="Закрыть">✕</button>
                    </div>
                    {/* Viewport label bar */}
                    <div className="flex items-center bg-black/30 border-b border-gray-800 flex-shrink-0 text-[8px] text-gray-400 select-none">
                      {VIEW_LABELS[vt].split("][").map((s,i) => (
                        <button key={i} className="hover:bg-[#2a2a3a] px-1.5 py-0.5 border-r border-gray-800 transition-colors">
                          {i===0 ? s+"[" : i===2 ? s : s+"]"}
                        </button>
                      ))}
                      <div className="flex-1"/>
                      {vt !== "plan" && (
                        <span className="text-[7px] text-gray-600 pr-1">
                          Ст: {activeStation.toFixed(0)} м
                        </span>
                      )}
                    </div>
                    {/* Canvas */}
                    <div className="flex-1 relative overflow-hidden"
                      style={{background: vt==="3d"?"#080d14":"#0d1117", cursor: mdiDrag.current ? "grabbing" : "crosshair"}}
                      onClick={handleCanvasClick}
                      onWheel={e => {
                        e.preventDefault()
                        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                        const cx = ((e.clientX - rect.left) / rect.width)  * SVG_W
                        const cy = ((e.clientY - rect.top)  / rect.height) * SVG_H
                        const factor = e.deltaY < 0 ? 1.12 : 0.893
                        setMdiZoom(z => {
                          const next = Math.max(0.15, Math.min(12, z * factor))
                          setMdiPan(p => ({
                            x: cx - (cx - p.x) * (next / z),
                            y: cy - (cy - p.y) * (next / z),
                          }))
                          return next
                        })
                      }}
                      onMouseDown={e => {
                        if (e.button === 1 || (e.button === 0 && e.altKey)) {
                          e.preventDefault()
                          mdiDrag.current = { startX: e.clientX, startY: e.clientY, startPan: mdiPan }
                        }
                      }}
                      onMouseMove={e => {
                        if (!mdiDrag.current) return
                        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                        setMdiPan({
                          x: mdiDrag.current.startPan.x + (e.clientX - mdiDrag.current.startX) * SVG_W / rect.width,
                          y: mdiDrag.current.startPan.y + (e.clientY - mdiDrag.current.startY) * SVG_H / rect.height,
                        })
                      }}
                      onMouseUp={()=>{ mdiDrag.current = null }}
                      onMouseLeave={()=>{ mdiDrag.current = null }}>
                      <svg width="100%" height="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} preserveAspectRatio="xMidYMid meet">
                        {/* Фоновая сетка */}
                        {Array.from({length:12}).map((_,i)=>(
                          <line key={`gh${i}`} x1={i*42} y1="0" x2={i*42} y2={SVG_H} stroke="rgba(60,80,100,0.15)" strokeWidth="0.5"/>
                        ))}
                        {Array.from({length:9}).map((_,i)=>(
                          <line key={`gv${i}`} x1="0" y1={i*43} x2={SVG_W} y2={i*43} stroke="rgba(60,80,100,0.15)" strokeWidth="0.5"/>
                        ))}
                        {/* Трансформируемое содержимое */}
                        <g transform={`translate(${mdiPan.x},${mdiPan.y}) scale(${mdiZoom})`}>
                          {vt === "plan"    && renderPlanView(SVG_W, SVG_H)}
                          {vt === "profile" && renderProfileView(SVG_W, SVG_H)}
                          {vt === "section" && renderSectionView(SVG_W, SVG_H)}
                          {vt === "3d"      && render3DView(SVG_W, SVG_H)}
                        </g>
                        {/* WCS компас — фиксированный */}
                        <g transform="translate(458,26)">
                          <circle cx="0" cy="0" r="16" fill="rgba(10,20,35,0.85)" stroke="#334" strokeWidth="0.8"/>
                          <text x="0" y="-7" fill="white" fontSize="5" textAnchor="middle" fontFamily="monospace">N</text>
                          <text x="0" y="12" fill="#555" fontSize="4" textAnchor="middle" fontFamily="monospace">S</text>
                          <text x="-10" y="2" fill="#555" fontSize="4" textAnchor="middle" fontFamily="monospace">W</text>
                          <text x="10" y="2" fill="#555" fontSize="4" textAnchor="middle" fontFamily="monospace">E</text>
                          <line x1="0" y1="-12" x2="0" y2="0" stroke="white" strokeWidth="1.2"/>
                          <line x1="0" y1="0"   x2="0" y2="12" stroke="#444" strokeWidth="0.8"/>
                          <circle cx="0" cy="0" r="1.5" fill="white"/>
                          <text x="0" y="23" fill="#888" fontSize="4" textAnchor="middle" fontFamily="monospace">WCS</text>
                        </g>
                      </svg>
                    </div>
                  </div>
                )
              }

              return (
                <div className={`absolute inset-0 z-30 bg-[#1a1a28] flex flex-col`} style={{paddingTop:20}}>
                  {/* MDI top bar with layout controls */}
                  <div className="flex items-center gap-1 px-2 py-1 bg-[#252535] border-b border-gray-700 flex-shrink-0">
                    <span className="text-[9px] text-gray-400 mr-1">Видовые экраны:</span>
                    {([["2h","║ 2 горизонтально"],["2v","═ 2 вертикально"],["4","⊞ 4 окна"]] as const).map(([id,label])=>(
                      <button key={id} onClick={()=>setViewportLayout(id)}
                        className={`text-[9px] px-2 py-0.5 rounded border transition-colors ${viewportLayout===id?"border-[#0078d4] bg-[#0078d4]/20 text-[#0078d4]":"border-gray-600 text-gray-400 hover:text-white"}`}>
                        {label}
                      </button>
                    ))}
                    <div className="flex-1"/>
                    {/* Синхронизированный зум: индикатор + сброс */}
                    <span className="text-[9px] text-gray-500 font-mono border border-gray-700 rounded px-2 py-0.5">
                      🔗 {Math.round(mdiZoom * 100)}%
                    </span>
                    <button onClick={()=>{ setMdiZoom(1); setMdiPan({x:0,y:0}) }}
                      title="Сбросить зум и панорамирование всех видовых экранов"
                      className="text-[9px] px-2 py-0.5 rounded border border-gray-600 text-gray-400 hover:text-white hover:bg-[#252535] transition-colors">
                      ⊡ По центру
                    </button>
                    <button onClick={()=>{ setMultiViewport(false); setMdiZoom(1); setMdiPan({x:0,y:0}) }}
                      className="text-[9px] px-2 py-0.5 rounded border border-gray-600 text-gray-400 hover:text-white hover:bg-[#0078d4]/20 transition-colors">
                      ✕ Закрыть все
                    </button>
                  </div>
                  {/* MDI windows grid */}
                  <div className={`flex-1 overflow-hidden ${is4?"grid grid-cols-2 grid-rows-2":isV?"flex flex-col":"flex flex-row"} gap-px bg-[#0a0a14]`}
                    style={{padding: "2px"}}>
                    {Array.from({length: count}).map((_,i) => (
                      <MdiWindow key={i} winIdx={i} active={i===1}/>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Plan viewport header */}
            <div className="absolute top-0 left-0 z-10 flex items-center gap-0 bg-black/40 border-b border-gray-800" style={{ marginTop: splitView ? 0 : 18 }}>
              <button onClick={() => setStatusMsg("Меню видового экрана")}
                className="text-[10px] text-gray-300 hover:bg-gray-700 px-1.5 py-0.5 border-r border-gray-700">[-]</button>
              <button onClick={() => setStatusMsg("Вид сверху")}
                className="text-[10px] text-gray-300 hover:bg-gray-700 px-2 py-0.5 border-r border-gray-700">[Сверху]</button>
              <button onClick={() => setViewMode(m => m === "wireframe" ? "shaded" : "wireframe")}
                className="text-[10px] text-gray-300 hover:bg-gray-700 px-2 py-0.5">
                [{viewMode === "wireframe" ? "2D Каркас" : "Тонирование"}]
              </button>
            </div>
            {/* ── UCS icon (левый нижний угол) ── */}
            <div className="absolute bottom-8 left-3 z-10 pointer-events-none select-none">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <line x1="6" y1="30" x2="30" y2="30" stroke="#4fc3f7" strokeWidth="1.5" markerEnd="url(#ax)"/>
                <line x1="6" y1="30" x2="6" y2="6"  stroke="#4ade80" strokeWidth="1.5" markerEnd="url(#ay)"/>
                <text x="31" y="32" fill="#4fc3f7" fontSize="7" fontWeight="bold">X</text>
                <text x="2"  y="5"  fill="#4ade80" fontSize="7" fontWeight="bold">Y</text>
                <circle cx="6" cy="30" r="1.5" fill="white"/>
              </svg>
              <div className="text-[7px] text-gray-600 text-center -mt-1">МСК</div>
            </div>

            {/* ── Navigation bar (правый край, по центру высоты) ── */}
            <div className="absolute right-1 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-0.5 select-none">
              {[
                { icon: "🔍+", title: "Увеличить (ScrollUp)", action: () => setZoom(z=>Math.min(z*1.25,20)) },
                { icon: "🔍−", title: "Уменьшить (ScrollDown)", action: () => setZoom(z=>Math.max(z/1.25,0.05)) },
                { icon: "⬚",   title: "По границам объектов", action: () => { setZoom(1.1); setPan({x:30,y:20}); showToast("По границам") } },
                { icon: "✋",   title: "Панорамирование", action: () => setActiveTool("pan") },
                { icon: "↺",   title: "Вращение", action: () => showToast("3D-вращение: переключитесь в 3D-режим") },
                { icon: "⊡",   title: "Орбита", action: () => showToast("Свободная орбита") },
              ].map((btn, i) => (
                <button key={i} title={btn.title} onClick={btn.action}
                  className="w-6 h-6 flex items-center justify-center bg-[#1a1a2e]/80 border border-gray-700 text-[10px] text-gray-400 hover:text-white hover:bg-[#0078d4]/40 hover:border-[#0078d4] transition-colors rounded-sm backdrop-blur-sm">
                  {btn.icon}
                </button>
              ))}
              <div className="w-6 border-t border-gray-700 mt-0.5"/>
              <button title="Показать меню навигации" onClick={() => showToast("Панель навигации")}
                className="w-6 h-5 flex items-center justify-center bg-[#1a1a2e]/80 border border-gray-700 text-[8px] text-gray-500 hover:text-white rounded-sm">≡</button>
            </div>

            {/* ── 3D NavCube ── */}
            <div className="absolute top-2 right-2 z-10 select-none" style={{width:90,height:90}}>
              <svg width="90" height="90" viewBox="0 0 90 90" style={{cursor:"pointer"}}
                onClick={() => setStatusMsg("3D Навигатор: вращение вида")}>
                {/* Outer ring */}
                <circle cx="45" cy="45" r="43" fill="rgba(0,0,0,0.45)" stroke="#333" strokeWidth="1"/>
                {/* Cardinal ticks */}
                <line x1="45" y1="4" x2="45" y2="10" stroke="#555" strokeWidth="1"/>
                <line x1="45" y1="80" x2="45" y2="86" stroke="#555" strokeWidth="1"/>
                <line x1="4" y1="45" x2="10" y2="45" stroke="#555" strokeWidth="1"/>
                <line x1="80" y1="45" x2="86" y2="45" stroke="#555" strokeWidth="1"/>
                {/* Cardinal labels */}
                <text x="45" y="18" textAnchor="middle" fill="#bbb" fontSize="8" fontWeight="bold">С</text>
                <text x="45" y="76" textAnchor="middle" fill="#bbb" fontSize="8" fontWeight="bold">Ю</text>
                <text x="12" y="48" textAnchor="middle" fill="#bbb" fontSize="8" fontWeight="bold">З</text>
                <text x="78" y="48" textAnchor="middle" fill="#bbb" fontSize="8" fontWeight="bold">В</text>
                {/* Isometric cube — right face */}
                <polygon points="45,22 67,34 67,58 45,46" fill="#1a3a5c" stroke="#0078d4" strokeWidth="1.5"/>
                {/* Isometric cube — left face */}
                <polygon points="45,22 23,34 23,58 45,46" fill="#0d2540" stroke="#0078d4" strokeWidth="1.5"/>
                {/* Isometric cube — top face */}
                <polygon points="45,12 67,24 45,36 23,24" fill="#1e4a78" stroke="#0078d4" strokeWidth="1.5"/>
                {/* Top face label */}
                <text x="45" y="28" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="bold">Сверху</text>
                {/* Right face label */}
                <text x="57" y="44" textAnchor="middle" fill="#7ab3d8" fontSize="6">В</text>
                {/* Left face label */}
                <text x="33" y="44" textAnchor="middle" fill="#7ab3d8" fontSize="6">З</text>
              </svg>
              {/* МСК button */}
              <button onClick={()=>setStatusMsg("МСК — Мировая система координат")}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-[#0078d4] text-white text-[8px] font-bold px-2 py-0.5 rounded hover:bg-[#005fa3] transition-colors">
                МСК
              </button>
            </div>

            {/* Active tool hint */}
            {activeTool !== "select" && activeTool !== "pan" && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 bg-black/70 text-[10px] text-cyan-300 px-3 py-1 rounded pointer-events-none border border-cyan-800">
                {activeTool === "line" && (drawingPts.length === 0 ? "Укажите первую точку линии" : "Укажите конечную точку")}
                {activeTool === "polyline" && (drawingPts.length === 0 ? "Укажите первую точку полилинии" : `Точек: ${drawingPts.length} — двойной клик для завершения`)}
                {activeTool === "rect" && (drawingPts.length === 0 ? "Укажите первый угол прямоугольника" : "Укажите противоположный угол")}
                {activeTool === "point" && "Укажите положение точки"}
                {activeTool === "delete" && "Кликните объект для удаления"}
                {activeTool === "move" && "Кликните объект и перетащите"}
                {activeTool === "measure" && "Кликните для измерения расстояния"}
                &nbsp;· Esc — отмена
              </div>
            )}

            {/* Dynamic coordinate input near cursor (TASK 5) */}
            {(activeTool === "line" || activeTool === "polyline" || activeTool === "rect" || activeTool === "point") && cursorCanvasPos && (
              <div
                className="absolute z-30 pointer-events-none"
                style={{
                  left: Math.min(cursorScreen.x + 20, (viewportContainerRef.current?.getBoundingClientRect().width ?? 600) - 200),
                  top: cursorScreen.y + 15,
                }}>
                <div className="bg-[#1a1a2e] border border-[#0078d4] text-[10px] font-mono flex items-center gap-0 shadow-lg">
                  <span className="bg-[#0078d4]/20 text-[#60a5fa] px-1.5 py-1 border-r border-[#0078d4]">⊡</span>
                  <span className="text-white px-1.5 py-1 border-r border-gray-700 min-w-[70px]">
                    {drawingPts.length > 0
                      ? `Δ ${Math.abs(cursorCanvasPos[0] - drawingPts[drawingPts.length-1][0]).toFixed(3)}`
                      : cursorCanvasPos[0].toFixed(3)}
                  </span>
                  <span className="text-white px-1.5 py-1 min-w-[70px]">
                    {drawingPts.length > 0
                      ? `Δ ${Math.abs(cursorCanvasPos[1] - drawingPts[drawingPts.length-1][1]).toFixed(3)}`
                      : cursorCanvasPos[1].toFixed(3)}
                  </span>
                </div>
                <div className="bg-[#0d1117] border border-gray-700 text-[9px] text-gray-400 px-2 py-0.5 mt-0.5">
                  {activeTool === "line" && drawingPts.length === 0 && "Линия  РН-угол  СМн-угол"}
                  {activeTool === "line" && drawingPts.length > 0 && `Длина: ${Math.hypot(cursorCanvasPos[0]-drawingPts[drawingPts.length-1][0], cursorCanvasPos[1]-drawingPts[drawingPts.length-1][1]).toFixed(2)} м`}
                  {activeTool === "polyline" && "Полилиния  РН-угол  СМн-угол"}
                  {activeTool === "rect" && (drawingPts.length === 0 ? "Задайте первый угол" : "Задайте противоположный угол")}
                  {activeTool === "point" && "Задайте положение точки"}
                </div>
              </div>
            )}

            <canvas ref={canvasRef} className="w-full h-full block"
              style={{ cursor:
                activeTool === "pan" || (drag.current && activeTool === "select") ? "grabbing" :
                activeTool === "move" ? "move" :
                activeTool === "delete" ? "not-allowed" :
                activeTool === "select" ? "default" : "crosshair"
              }}
              onWheel={onWheel} onMouseDown={onMouseDown} onMouseMove={onMouseMove}
              onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
              onContextMenu={e => {
                e.preventDefault()
                if (drawingPts.length > 0) { setDrawingPts([]); setStatusMsg("Черчение отменено"); return }
                const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect()
                const wx = (e.clientX - rect.left - pan.x) / zoom
                const wy = (e.clientY - rect.top - pan.y) / zoom
                setContextMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top, wx, wy })
              }}
            />

            {/* ── Context menu (right click) ── */}
            {contextMenu && (
              <div className="absolute z-50 bg-[#2d2d3d] border border-gray-600 shadow-2xl rounded text-[11px] min-w-[210px]"
                style={{left: Math.min(contextMenu.x, 580), top: Math.min(contextMenu.y, 420)}}
                onClick={e=>e.stopPropagation()}>
                {([
                  { label: "Повторить HELP", icon: "RotateCcw", action: ()=>showToast("Повторить последнее действие") },
                  null,
                  { label: "Разделить объекты ▶", icon: "Split", action: ()=>showToast("Разделить: укажите объект"), hasSubmenu: true },
                  { label: "Буфер обмена ▶", icon: "Clipboard", action: ()=>showToast("Буфер обмена"), hasSubmenu: true },
                  null,
                  { label: "Основные преобразования ▶", icon: "Move", action: ()=>showToast("Основные преобразования"), hasSubmenu: true, highlight: true },
                  { label: "Порядок отображения ▶", icon: "Layers", action: ()=>showToast("Порядок отображения"), hasSubmenu: true },
                  { label: "Средства редактирования AD ▶", icon: "Edit2", action: ()=>showToast("Средства редактирования AD"), hasSubmenu: true },
                  null,
                  { label: "Панорама", icon: "Hand", action: ()=>{setActiveTool("pan");setStatusMsg("Инструмент: Панорама")} },
                  { label: "Зумирование", icon: "ZoomIn", action: ()=>setZoom(z=>z*1.25) },
                  { label: "Свободная орбита", icon: "RotateCcw", action: ()=>setStatusMsg("Свободная орбита") },
                  null,
                  { label: "Быстрый выбор...", icon: "MousePointer2", action: ()=>setStatusMsg("Быстрый выбор") },
                  { label: "Найти...", icon: "Search", action: ()=>setStatusMsg("Найти и заменить") },
                  { label: "Настройка...", icon: "Settings", action: ()=>setShowDrawingSettings(true) },
                ] as ({label:string;icon:string;action:()=>void;hasSubmenu?:boolean;highlight?:boolean}|null)[]).map((item, i) => item === null ? (
                  <div key={`sep-${i}`} className="border-t border-gray-700 my-0.5"/>
                ) : (
                  <button key={i} onClick={()=>{item.action();setContextMenu(null)}}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#0078d4] hover:text-white transition-colors text-left group ${item.highlight?"text-white bg-[#0078d4]/10":"text-gray-300"}`}>
                    <Icon name={item.icon} size={12} fallback="Square"/>
                    <span className="flex-1">{item.label.replace(" ▶","")}</span>
                    {item.hasSubmenu && (
                      <div className="ml-auto flex items-center gap-2 opacity-60 group-hover:opacity-100">
                        {item.highlight && item.label.includes("преобразов") && (
                          <div className="flex gap-1 text-[9px] text-gray-400 group-hover:text-white">
                            <span className="border border-current px-1 rounded">Перенести</span>
                            <span className="border border-current px-1 rounded">Копировать</span>
                            <span className="border border-current px-1 rounded">Поворот</span>
                            <span className="border border-current px-1 rounded">Стереть</span>
                            <span className="border border-current px-1 rounded">Масштаб</span>
                          </div>
                        )}
                        <Icon name="ChevronRight" size={10} fallback="ArrowRight"/>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dialogs */}
          <AnimatePresence>
            {showSurfaceEdit && (
              <SurfaceEditDialog name={surfaceEditName} onClose={() => setShowSurfaceEdit(false)} />
            )}
            {showDaylightFL && (
              <DaylightFeatureLineDialog
                onClose={() => setShowDaylightFL(false)}
                onOK={() => {
                  showToast("✓ Характерные линии выхода на рельеф созданы")
                  setTreeData(prev => {
                    const add = (nodes: TreeNode[]): TreeNode[] => nodes.map(n =>
                      n.id === "featurelines" ? {...n, children:[...(n.children||[]),{id:`dfl_${Date.now()}`,label:"Линия выхода (лев/прав)",icon:"Spline",color:"#a78bfa"}]} : {...n, children: n.children ? add(n.children) : undefined}
                    )
                    return add(prev)
                  })
                }}
              />
            )}
            {showDataShortcuts && (
              <DataShortcutsPanel onClose={() => setShowDataShortcuts(false)} />
            )}
            {showCorridor && (
              <CorridorDialog
                onClose={() => setShowCorridor(false)}
                onOK={def => {
                  setCorridors(prev => prev.includes(def.name) ? prev : [...prev, def.name])
                  setShowCorridor(false)
                  setStatusMsg(`Коридор «${def.name}» успешно создан`)
                  showProgress("Создание коридора…")
                  saveObject("corridor", def.name, { name: def.name })
                  showToast(`💾 Коридор «${def.name}» сохранён в проект`)
                }}
              />
            )}
            {showSurface && (
              <SurfaceDialog
                onClose={() => setShowSurface(false)}
                onOK={def => {
                  setShowSurface(false)
                  setStatusMsg(`Поверхность «${def.name}» (${def.type}) создана`)
                  showProgress("Построение поверхности TIN…")
                  saveObject("surface", def.name, { type: def.type })
                  showToast(`💾 Поверхность «${def.name}» сохранена`)
                  setTreeData(prev => {
                    const add = (nodes: TreeNode[]): TreeNode[] => nodes.map(n => {
                      if (n.id === "surfaces") return { ...n, children: [...(n.children||[]), { id: `surf_${Date.now()}`, label: def.name, icon: "Triangle", color: "#4ade80" }] }
                      return { ...n, children: n.children ? add(n.children) : undefined }
                    })
                    return add(prev)
                  })
                }}
              />
            )}
            {showAlignment && (
              <AlignmentDialog
                onClose={() => setShowAlignment(false)}
                onOK={def => {
                  const length = def.elements.reduce((s,e)=>s+(parseFloat(e.length)||0),0).toFixed(0)
                  setShowAlignment(false)
                  setStatusMsg(`Трасса «${def.name}» создана, длина ${length} м`)
                  saveObject("alignment", def.name, { length })
                  showToast(`💾 Трасса «${def.name}» сохранена`)
                  setTreeData(prev => {
                    const add = (nodes: TreeNode[]): TreeNode[] => nodes.map(n => {
                      if (n.id === "alignments") return { ...n, children: [...(n.children||[]), { id: `al_${Date.now()}`, label: def.name, icon: "Minus", color: "#f97316" }] }
                      return { ...n, children: n.children ? add(n.children) : undefined }
                    })
                    return add(prev)
                  })
                }}
              />
            )}
            {showProfile && (
              <ProfileDialog
                onClose={() => setShowProfile(false)}
                onOK={def => {
                  setShowProfile(false)
                  setStatusMsg(`Профиль «${def.name}» создан для трассы ${def.alignment}`)
                  saveObject("profile", def.name, { alignment: def.alignment })
                  showToast(`💾 Профиль «${def.name}» сохранён`)
                }}
                alignments={["Трасса ШД-38","Ул. Трумана","Бордюр периметра"]}
              />
            )}
            {showAssembly && (
              <AssemblyDialog
                onClose={() => setShowAssembly(false)}
                onOK={def => {
                  setShowAssembly(false)
                  setStatusMsg(`Типовое сечение «${def.name}» создано (${def.subassemblies.length} подсечений)`)
                  saveObject("assembly", def.name, { count: def.subassemblies.length })
                  showToast(`💾 Типовое сечение «${def.name}» сохранено`)
                  setTreeData(prev => {
                    const add = (nodes: TreeNode[]): TreeNode[] => nodes.map(n => {
                      if (n.id === "assemblies") return { ...n, children: [...(n.children||[]), { id: `asm_${Date.now()}`, label: def.name, icon: "Layers", color: "#94a3b8" }] }
                      return { ...n, children: n.children ? add(n.children) : undefined }
                    })
                    return add(prev)
                  })
                }}
              />
            )}
            {showPoints && (
              <PointsDialog onClose={()=>setShowPoints(false)} onOK={pts=>{
                setShowPoints(false)
                setStatusMsg(`Создано точек: ${pts.length}`)
                saveObject("points", `Группа точек (${pts.length})`, { count: pts.length, pts })
                showToast(`💾 Точек сохранено: ${pts.length}`)
                setTreeData(prev=>{
                  const add=(nodes:TreeNode[]):TreeNode[]=>nodes.map(n=>n.id==="points"?{...n,children:[...(n.children||[]),...pts.map((p,i)=>({id:`pt_${Date.now()+i}`,label:p.name,icon:"MapPin",color:"#f59e0b"}))]}:{...n,children:n.children?add(n.children):undefined})
                  return add(prev)
                })
              }}/>
            )}
            {showPipeNet && (
              <PipeNetworkDialog onClose={()=>setShowPipeNet(false)} onOK={()=>{
                setShowPipeNet(false)
                showToast("Сеть сохранена")
                saveObject("pipe_network", "Трубопроводная сеть", {})
                setTreeData(prev=>{
                  const add=(nodes:TreeNode[]):TreeNode[]=>nodes.map(n=>n.id==="pipenet"?{...n,children:[...(n.children||[]),{id:`pipe_${Date.now()}`,label:"Трубопроводная сеть",icon:"Network",color:"#6366f1"}]}:{...n,children:n.children?add(n.children):undefined})
                  return add(prev)
                })
              }}/>
            )}
            {showIntersection && (
              <IntersectionDialog onClose={()=>setShowIntersection(false)} onOK={d=>{
                setShowIntersection(false)
                setStatusMsg(`Пересечение «${d.name}»: ${d.mainRoad} × ${d.secRoad}`)
                saveObject("intersection", d.name, { mainRoad: d.mainRoad, secRoad: d.secRoad })
                showToast(`💾 Пересечение «${d.name}» сохранено`)
                setTreeData(prev=>{
                  const add=(nodes:TreeNode[]):TreeNode[]=>nodes.map(n=>n.id==="intersections"?{...n,children:[...(n.children||[]),{id:`int_${Date.now()}`,label:d.name,icon:"Plus",color:"#f43f5e"}]}:{...n,children:n.children?add(n.children):undefined})
                  return add(prev)
                })
              }}/>
            )}
            {showFeatureLine && (
              <FeatureLineDialog onClose={()=>setShowFeatureLine(false)} onOK={d=>{
                setShowFeatureLine(false)
                setStatusMsg(`Характерная линия «${d.name}» создана`)
                saveObject("feature_line", d.name, { site: d.site })
                showToast(`💾 Характерная линия «${d.name}» сохранена`)
                setTreeData(prev=>{
                  const add=(nodes:TreeNode[]):TreeNode[]=>nodes.map(n=>n.id==="featurelines"?{...n,children:[...(n.children||[]),{id:`fl_${Date.now()}`,label:d.name,icon:"Spline",color:"#ec4899"}]}:{...n,children:n.children?add(n.children):undefined})
                  return add(prev)
                })
              }}/>
            )}
            {showAnalysis && <AnalysisDialog type={analysisType} onClose={()=>setShowAnalysis(false)} onOK={d=>{setShowAnalysis(false);setStatusMsg(`${d.type}: выполнен для ${d.surface}`)}}/>}
            {showVolume && <VolumeDialog scene={civilScene} onClose={()=>setShowVolume(false)} onOK={()=>{setShowVolume(false);showToast("Ведомость объёмов экспортирована в CSV")}}/>}
            {showLayers && <LayersDialog onClose={()=>setShowLayers(false)}/>}
            {showImport && <ImportDialog onClose={()=>setShowImport(false)} onOK={d=>{setShowImport(false);setStatusMsg(`Импорт ${d.format}: ${d.file} завершён`)}}/>}
            {showExport && <ExportDialog mode={exportMode} canvasObjects={canvasObjects} onClose={()=>setShowExport(false)} onOK={d=>{setShowExport(false);showToast(`${exportMode==="print"?"Печать":"Экспорт"} в ${d.format} завершён`)}}/>}
            {showDrawingSettings && <DrawingSettingsDialog onClose={()=>setShowDrawingSettings(false)}/>}
            {showDraw2D && (
              <Draw2DDialog onClose={()=>setShowDraw2D(false)} onOK={obj=>{
                setShowDraw2D(false)
                setDraw2DObjects(prev=>[...prev,{...obj,id:`d2d_${Date.now()}`}])
                setStatusMsg(`2D объект «${obj.name}» (${obj.type}) создан`)
                showToast(`${obj.type} «${obj.name}» добавлен`)
              }}/>
            )}
            {showAnnotation && (
              <AnnotationDialog onClose={()=>setShowAnnotation(false)} onOK={obj=>{
                setShowAnnotation(false)
                setStatusMsg(`Аннотация «${obj.name}» размещена`)
                showToast(`Аннотация «${obj.type}» добавлена`)
              }}/>
            )}
            {showSuperelevation && (
              <SuperelevationDialog onClose={() => setShowSuperelevation(false)} />
            )}
            {showEarthworks && (
              <EarthworksVolumesDialog onClose={()=>setShowEarthworks(false)} onOK={d=>{
                setShowEarthworks(false)
                pushUndo(`Земляные работы: ${d.name}`)
                showToast(`Ведомость «${d.name}» экспортирована`)
                setStatusMsg(`Земляные работы: выемка ${d.cut} м³, насыпь ${d.fill} м³`)
              }}/>
            )}
            {showProjectManager && (
              <ProjectManagerDialog onClose={()=>setShowProjectManager(false)}/>
            )}
            {showSurveyTraverse && (
              <SurveyTraverseDialog onClose={()=>setShowSurveyTraverse(false)}/>
            )}
            {showAdaptation && (
              <AdaptationDialog onClose={()=>setShowAdaptation(false)}/>
            )}
            {showHydrology && (
              <HydrologyDialog onClose={()=>setShowHydrology(false)} onOK={obj=>{
                setShowHydrology(false)
                setStatusMsg(`Водосбор «${obj.name}» создан, площадь ${obj.area} га, метод: ${obj.method}`)
                saveObject("catchment", obj.name, {area:obj.area,method:obj.method})
                showToast(`Водосбор «${obj.name}» создан и сохранён`)
                setTreeData(prev=>{
                  const add=(nodes:TreeNode[]):TreeNode[]=>nodes.map(n=>n.id==="catchments"?{...n,children:[...(n.children||[]),{id:`catch_${Date.now()}`,label:obj.name,icon:"Droplets",color:"#60a5fa"}]}:{...n,children:n.children?add(n.children):undefined})
                  return add(prev)
                })
              }}/>
            )}

            {/* ── Новые диалоги ── */}
            {showTransportation && <TransportationDialog onClose={()=>setShowTransportation(false)}/>}
            {showHydrologyModule && <HydrologyModuleDialog onClose={()=>setShowHydrologyModule(false)}/>}
            {showDaylightFL2 && <DaylightFLDialog2 onClose={()=>setShowDaylightFL2(false)}/>}
            {showHRA && <HRADialog onClose={()=>setShowHRA(false)}/>}
            {showInfoDrainage && <InfoDrainageDialog onClose={()=>setShowInfoDrainage(false)}/>}
            {showFormaData && <FormaDataDialog onClose={()=>setShowFormaData(false)}/>}
            {showDWTTemplates && (
              <DWTTemplatesDialog onClose={()=>setShowDWTTemplates(false)} onApply={name=>{
                showToast(`Шаблон «${name}» применён`)
                setStatusMsg(`Шаблон: ${name}`)
              }}/>
            )}
            {showRealityCapture && <RealityCaptureDialog onClose={()=>setShowRealityCapture(false)}/>}
            {showGISIntegration && <GISIntegrationDialog onClose={()=>setShowGISIntegration(false)}/>}
            {showVolumeDashboard && <VolumeDashboardDialog onClose={()=>setShowVolumeDashboard(false)}/>}
            {showConstructionPhases && <ConstructionPhasesDialog onClose={()=>setShowConstructionPhases(false)}/>}
            {showRevitExchange && <RevitExchangeDialog onClose={()=>setShowRevitExchange(false)}/>}
            {showGeotechnical && <GeotechnicalDialog onClose={()=>setShowGeotechnical(false)}/>}
            {showGrading && <GradingDialog onClose={()=>setShowGrading(false)}/>}
            {showTunnel && (
              <TunnelDialog onClose={()=>setShowTunnel(false)} onOK={d=>{
                setShowTunnel(false)
                showToast(`Тоннель «${d.name}» создан`)
                setStatusMsg(`Тоннель «${d.name}» добавлен в проект`)
              }}/>
            )}
            {showProjectExplorer && (
              <ProjectExplorerPanel onClose={()=>setShowProjectExplorer(false)} onOpen={cmd=>{
                openDialog(cmd)
                setShowProjectExplorer(false)
              }}/>
            )}
            {showRailTrack && (
              <RailTrackDialog onClose={()=>setShowRailTrack(false)} onOK={d=>{
                setShowRailTrack(false)
                showToast(`ЖД-путь «${d.name}» создан`)
                setStatusMsg(`Железнодорожный путь «${d.name}» добавлен в проект`)
              }}/>
            )}
            {showBridgeModeler && (
              <BridgeModelerDialog onClose={()=>setShowBridgeModeler(false)} onOK={d=>{
                setShowBridgeModeler(false)
                showToast(`Мост «${d.name}» создан`)
                setStatusMsg(`Мост «${d.name}» добавлен в проект`)
              }}/>
            )}
            {showIntersectionWizard && (
              <IntersectionWizardDialog onClose={()=>setShowIntersectionWizard(false)} onOK={d=>{
                setShowIntersectionWizard(false)
                showToast(`Пересечение «${d.name}» (${d.type}) создано`)
                setStatusMsg(`Пересечение «${d.name}» добавлено в проект`)
              }}/>
            )}
            {showRoundabout && (
              <RoundaboutDialog onClose={()=>setShowRoundabout(false)} onOK={d=>{
                setShowRoundabout(false)
                showToast(`Кольцо «${d.name}» R=${d.R}м создано`)
                setStatusMsg(`Кольцевое пересечение «${d.name}» добавлено`)
              }}/>
            )}
            {showSurveyDB && <SurveyDBDialog onClose={()=>setShowSurveyDB(false)}/>}
            {showSurfaceAdv && <SurfaceAdvancedDialog mode={surfaceAdvMode} onClose={()=>setShowSurfaceAdv(false)}/>}
            {showSampleLines && <SampleLinesDialog onClose={()=>setShowSampleLines(false)}/>}
            {showPressureNet && <PressureNetworkDialog onClose={()=>setShowPressureNet(false)}/>}
            {showMassHaul && <MassHaulDialog onClose={()=>setShowMassHaul(false)}/>}
            {showPlanProd && <PlanProductionDialog onClose={()=>setShowPlanProd(false)}/>}
            {showVisibility && <VisibilityAnalysisDialog onClose={()=>setShowVisibility(false)}/>}

            {/* ── Функции версий 2023–2026 ── */}
            {showWhatsNewVer && <WhatsNewVersionsDialog onClose={()=>setShowWhatsNewVer(false)} onOpen={(id)=>{ setShowWhatsNewVer(false); setVerFeature(id) }}/>}
            {verFeature==="corridorExtraction" && <CorridorExtractionDialog onClose={()=>setVerFeature(null)}/>}
            {verFeature==="offsetProfile" && <OffsetProfileDialog onClose={()=>setVerFeature(null)}/>}
            {verFeature==="gradingOpt" && <GradingOptimizationDialog onClose={()=>setVerFeature(null)}/>}
            {verFeature==="propertySets" && <PropertySetsDialog onClose={()=>setVerFeature(null)}/>}
            {verFeature==="corridorTransitions" && <CorridorTransitionsDialog onClose={()=>setVerFeature(null)}/>}
            {verFeature==="profileViewPlus" && <ProfileViewPlusDialog onClose={()=>setVerFeature(null)}/>}
            {verFeature==="modelViewer3D" && <ModelViewer3DDialog onClose={()=>setVerFeature(null)}/>}
            {verFeature==="coordTransform" && <CoordinateTransformDialog onClose={()=>setVerFeature(null)}/>}
            {verFeature==="drainageDesign" && <DrainageDesignDialog onClose={()=>setVerFeature(null)}/>}
            {verFeature==="surfaceAOI" && <SurfaceAOIDialog onClose={()=>setVerFeature(null)}/>}

            {/* Диалог сохранения в проект */}
            {showSaveDialog && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                className="absolute inset-0 bg-black/60 flex items-center justify-center z-50"
                onClick={()=>setShowSaveDialog(false)}>
                <motion.div initial={{scale:0.92,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.92,opacity:0}}
                  className="bg-[#1e1e2e] border border-gray-600 rounded-lg shadow-2xl w-[460px] flex flex-col"
                  onClick={e=>e.stopPropagation()}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                    <span className="text-white text-[13px] font-bold flex items-center gap-2">
                      <Icon name="Save" size={14} className="text-[#0078d4]"/> Сохранить чертёж в проект
                    </span>
                    <button onClick={()=>setShowSaveDialog(false)} className="text-gray-400 hover:text-white text-lg leading-none">✕</button>
                  </div>
                  <div className="p-4">
                    <div className="text-[11px] text-gray-400 mb-3">
                      Текущий чертёж: <span className="text-white font-medium">{activeDrawingTab}</span>
                    </div>
                    <label className="text-[11px] text-gray-400 mb-2 block">Выберите проект:</label>
                    <div className="space-y-1.5 max-h-52 overflow-y-auto mb-4">
                      {saveProjects.length === 0 ? (
                        <div className="text-center text-gray-500 text-[11px] py-6">Нет доступных проектов</div>
                      ) : saveProjects.map(p => (
                        <button key={p.id} onClick={()=>setSaveToProjectId(p.id)}
                          className={`w-full text-left px-3 py-2.5 rounded border transition-all flex items-center gap-3 ${saveToProjectId===p.id?"border-[#0078d4] bg-[#0078d4]/15":"border-gray-700 hover:border-gray-500 bg-[#252535]"}`}>
                          <div className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 ${saveToProjectId===p.id?"border-[#0078d4] bg-[#0078d4]":"border-gray-500"}`}/>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-[12px] truncate">{p.name}</div>
                            <div className="text-gray-500 text-[10px]">{TYPE_LABELS[p.type] || p.type}</div>
                          </div>
                          {saveToProjectId===p.id && <Icon name="Check" size={13} className="text-[#0078d4]"/>}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={!saveToProjectId || savingToDb}
                        onClick={() => {
                          if (!saveToProjectId) return
                          setSavingToDb(true)
                          const proj = saveProjects.find(p=>p.id===saveToProjectId)
                          fetch(PROJECTS_URL, {
                            method: "POST",
                            headers: {"Content-Type":"application/json"},
                            body: JSON.stringify({
                              project_id: saveToProjectId,
                              object_type: "drawing",
                              name: activeDrawingTab,
                              data: { tab: activeDrawingTab, savedAt: new Date().toISOString() }
                            })
                          }).then(() => {
                            setCurrentProjectId(saveToProjectId)
                            setCurrentProjectName(proj?.name || "")
                            setSavingToDb(false)
                            setShowSaveDialog(false)
                            showToast(`💾 Сохранено в «${proj?.name}»`)
                          }).catch(() => setSavingToDb(false))
                        }}
                        className="flex-1 py-2 rounded text-[12px] text-white disabled:opacity-40 transition-colors font-medium"
                        style={{background:"#0078d4"}}>
                        {savingToDb ? "Сохранение..." : "Сохранить"}
                      </button>
                      <button onClick={()=>setShowSaveDialog(false)}
                        className="px-4 py-2 rounded text-[11px] text-gray-400 border border-gray-600 hover:text-white transition-colors">
                        Отмена
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Диалог открытия проекта */}
            {showOpenProject && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                className="absolute inset-0 bg-black/60 flex items-center justify-center z-50"
                onClick={()=>setShowOpenProject(false)}>
                <motion.div initial={{scale:0.92,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.92,opacity:0}}
                  className="bg-[#1e1e2e] border border-gray-600 rounded-lg shadow-2xl w-[480px] max-h-[420px] flex flex-col"
                  onClick={e=>e.stopPropagation()}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                    <span className="text-white text-[13px] font-bold flex items-center gap-2">
                      <Icon name="FolderOpen" size={14}/> Открыть проект
                    </span>
                    <button onClick={()=>setShowOpenProject(false)} className="text-gray-400 hover:text-white text-lg leading-none">✕</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {loadingProjects ? (
                      <div className="flex items-center justify-center py-10 gap-2 text-gray-400 text-[12px]">
                        <Icon name="Loader" size={14} className="animate-spin"/> Загрузка…
                      </div>
                    ) : dbProjects.length === 0 ? (
                      <div className="text-center text-gray-500 text-[12px] py-10">Нет сохранённых проектов</div>
                    ) : dbProjects.map(p => (
                      <button key={p.id} onClick={()=>openProject(p)}
                        className="w-full text-left px-3 py-2.5 rounded hover:bg-[#0078d4]/20 border border-transparent hover:border-[#0078d4]/40 transition-all flex items-center gap-3 group">
                        <Icon name="FileText" size={14} className="text-blue-400 flex-shrink-0"/>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-[12px] font-medium truncate">{p.name}</div>
                          <div className="text-gray-500 text-[10px]">{p.type} · {p.status}</div>
                        </div>
                        <Icon name="ChevronRight" size={12} className="text-gray-600 group-hover:text-white"/>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-gray-700 px-4 py-2 flex justify-end">
                    <button onClick={()=>setShowOpenProject(false)}
                      className="text-[11px] text-gray-400 hover:text-white px-3 py-1">Отмена</button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Properties Palette (Ctrl+1) — Civil 3D стиль ── */}
          <AnimatePresence>
            {showPropertiesPalette && selectedCivilObject && (
              <motion.div initial={{x:320,opacity:0}} animate={{x:0,opacity:1}} exit={{x:320,opacity:0}}
                className="absolute right-0 top-0 bottom-0 z-40 flex flex-col bg-[#1a1a2a] border-l border-gray-700 shadow-2xl"
                style={{width:260}}>
                <div className="flex items-center justify-between px-3 py-2 bg-[#252535] border-b border-gray-700 flex-shrink-0">
                  <span className="text-[11px] text-white font-bold">Свойства</span>
                  <div className="flex items-center gap-1">
                    <button title="Закрепить" className="text-gray-500 hover:text-white text-xs px-1">📌</button>
                    <button onClick={()=>setShowPropertiesPalette(false)} className="text-gray-400 hover:text-white text-sm">✕</button>
                  </div>
                </div>
                {/* Тип объекта */}
                <div className="px-3 py-1.5 bg-[#252535] border-b border-gray-700 flex-shrink-0">
                  <div className="text-[10px] text-gray-400">Нет выделения</div>
                  <div className="text-[11px] text-white font-semibold">{selectedCivilObject.name}</div>
                  <div className="text-[9px] text-[#4fc3f7]">{selectedCivilObject.type}</div>
                </div>
                {/* Свойства */}
                <div className="flex-1 overflow-y-auto">
                  {/* Секция: Общие */}
                  <div className="bg-[#1e1e2e] px-3 py-1 text-[9px] text-gray-500 font-bold uppercase tracking-wider border-b border-gray-800">
                    Общие
                  </div>
                  {[
                    ["Цвет", "ПОСЛОЮ"],
                    ["Слой", "C-ROAD-CNTR"],
                    ["Тип линии", "ПОСЛОЮ"],
                    ["Масштаб типа", "1.0000"],
                    ["Стиль печати", "По цвету"],
                    ["Толщина линии", "ПОСЛОЮ"],
                    ["Прозрачность", "0"],
                    ["Гиперссылка", ""],
                    ["Толщина", "0.0000"],
                  ].map(([k,v]) => (
                    <div key={k} className="flex items-center border-b border-gray-800/50 hover:bg-[#252535] cursor-pointer">
                      <div className="text-[10px] text-gray-400 px-3 py-1 w-[52%] truncate">{k}</div>
                      <div className="text-[10px] text-white px-2 py-1 flex-1 font-mono truncate">{v}</div>
                    </div>
                  ))}
                  {/* Секция: Civil 3D объект */}
                  <div className="bg-[#1e1e2e] px-3 py-1 text-[9px] text-gray-500 font-bold uppercase tracking-wider border-b border-gray-800 mt-1">
                    {selectedCivilObject.type}
                  </div>
                  {Object.entries(selectedCivilObject.props).map(([k,v]) => (
                    <div key={k} className="flex items-center border-b border-gray-800/50 hover:bg-[#252535] cursor-pointer">
                      <div className="text-[10px] text-gray-400 px-3 py-1 w-[52%] truncate">{k}</div>
                      <div className="text-[10px] text-[#4fc3f7] px-2 py-1 flex-1 font-mono truncate">{String(v)}</div>
                    </div>
                  ))}
                  {/* Секция: Геометрия */}
                  <div className="bg-[#1e1e2e] px-3 py-1 text-[9px] text-gray-500 font-bold uppercase tracking-wider border-b border-gray-800 mt-1">
                    Геометрия
                  </div>
                  {[
                    ["Длина", `${civilScene.alignment.totalLength.toFixed(3)} м`],
                    ["Начальный пикет", `${civilScene.alignment.startStation.toFixed(2)} м`],
                    ["Конечный пикет", `${(civilScene.alignment.startStation + civilScene.alignment.totalLength).toFixed(2)} м`],
                    ["Число элементов", `${civilScene.alignment.elements.length}`],
                  ].map(([k,v]) => (
                    <div key={k} className="flex items-center border-b border-gray-800/50 hover:bg-[#252535] cursor-pointer">
                      <div className="text-[10px] text-gray-400 px-3 py-1 w-[52%] truncate">{k}</div>
                      <div className="text-[10px] text-[#4fc3f7] px-2 py-1 flex-1 font-mono truncate">{v}</div>
                    </div>
                  ))}
                </div>
                {/* Быстрые свойства */}
                <div className="flex-shrink-0 border-t border-gray-700 px-3 py-2 bg-[#252535]">
                  <div className="text-[9px] text-gray-500 mb-1">Быстрые свойства</div>
                  <div className="flex gap-1 flex-wrap mb-2">
                    {(["Стиль","Метка","Слой","Данные"] as const).map(btn=>(
                      <button key={btn} onClick={()=>setPropsTab(btn)}
                        className={`text-[9px] px-2 py-0.5 border rounded transition-colors ${propsTab===btn?"border-[#0078d4] bg-[#0078d4]/20 text-white":"border-gray-600 text-gray-400 hover:text-white hover:border-[#0078d4]"}`}>
                        {btn}
                      </button>
                    ))}
                  </div>
                  {/* Контент таба */}
                  <div className="rounded border border-gray-700 p-2 bg-[#1a1a2a] text-[10px] space-y-1">
                    {propsTab==="Стиль" && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Стиль:</span>
                          <select className="bg-[#252535] border border-gray-600 text-white text-[9px] px-1 py-0.5 rounded outline-none">
                            <option>Стандартный</option><option>Основной</option><option>Скрытый</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Цвет:</span>
                          <input type="color" defaultValue="#4fc3f7" className="w-8 h-4 bg-transparent border border-gray-600 rounded cursor-pointer"/>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Толщина:</span>
                          <input type="number" defaultValue="0.5" step="0.1" className="w-12 bg-[#252535] border border-gray-600 text-white text-[9px] px-1 py-0.5 rounded outline-none font-mono"/>
                        </div>
                      </>
                    )}
                    {propsTab==="Метка" && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Подпись:</span>
                          <input defaultValue={selectedCivilObject.name} className="flex-1 ml-2 bg-[#252535] border border-gray-600 text-white text-[9px] px-1 py-0.5 rounded outline-none"/>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Высота:</span>
                          <input type="number" defaultValue="2.5" step="0.5" className="w-14 bg-[#252535] border border-gray-600 text-white text-[9px] px-1 py-0.5 rounded outline-none font-mono"/>
                        </div>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" defaultChecked className="accent-[#0078d4] w-3 h-3"/>
                          <span className="text-gray-400">Показывать пикетаж</span>
                        </label>
                      </>
                    )}
                    {propsTab==="Слой" && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Слой:</span>
                          <select className="flex-1 ml-2 bg-[#252535] border border-gray-600 text-white text-[9px] px-1 py-0.5 rounded outline-none">
                            <option>C-ROAD-CNTR</option><option>C-TOPO-SURF</option><option>C-PIPE-WATER</option><option>0</option>
                          </select>
                        </div>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" defaultChecked className="accent-[#0078d4] w-3 h-3"/>
                          <span className="text-gray-400">Видимый</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" className="accent-[#0078d4] w-3 h-3"/>
                          <span className="text-gray-400">Заморозить</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" className="accent-[#0078d4] w-3 h-3"/>
                          <span className="text-gray-400">Заблокировать</span>
                        </label>
                      </>
                    )}
                    {propsTab==="Данные" && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Описание:</span>
                          <input placeholder="Доп. описание" className="flex-1 ml-2 bg-[#252535] border border-gray-600 text-white text-[9px] px-1 py-0.5 rounded outline-none placeholder-gray-600"/>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">XData:</span>
                          <span className="text-[#4fc3f7] font-mono">{Object.keys(selectedCivilObject.props).length} ключей</span>
                        </div>
                        <button className="w-full mt-1 py-1 bg-[#0078d4]/20 text-[#60a5fa] border border-[#0078d4]/40 rounded text-[9px] hover:bg-[#0078d4]/30">+ Добавить XData</button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toast notification */}
          <AnimatePresence>
            {toast && (
              <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:20}}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#0078d4] text-white text-[11px] px-4 py-2 rounded shadow-xl z-50 pointer-events-none">
                {toast}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress indicator */}
          <AnimatePresence>
            {progressOp && (
              <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}
                className="absolute top-8 left-1/2 -translate-x-1/2 z-50 bg-[#1a1a2e] border border-[#0078d4] rounded shadow-xl px-4 py-2 min-w-[240px]">
                <div className="text-[11px] text-white mb-1.5 flex items-center gap-2">
                  <Icon name="Loader" size={11} className="animate-spin text-[#0078d4]"/>
                  {progressOp.label}
                  <span className="ml-auto text-[#0078d4] font-mono">{Math.min(100,Math.round(progressOp.pct))}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div className="bg-[#0078d4] h-1.5 rounded-full transition-all" style={{width:`${Math.min(100,progressOp.pct)}%`}}/>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right: Properties Panel ── */}
        {showProperties && (() => {
          const selObj = canvasObjects.find(o => o.id === selectedObjId)
          return (
            <div className="bg-[#1a1a2e] border-l border-gray-700 flex flex-col flex-shrink-0 overflow-hidden" style={{width:200}}>
              <div className="bg-[#252535] px-2 py-1.5 border-b border-gray-600 flex items-center justify-between">
                <span className="text-[11px] text-white font-bold flex items-center gap-1.5">
                  <Icon name="ListFilter" size={11} className="text-[#0078d4]"/> Свойства
                </span>
                <button onClick={()=>setShowProperties(false)} className="text-gray-500 hover:text-white text-xs">✕</button>
              </div>
              {selObj ? (
                <div className="flex-1 overflow-y-auto">
                  <div className="px-2 py-1.5 border-b border-gray-700 bg-[#1e1e2e]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background: selObj.color}}/>
                      <span className="text-[11px] text-white font-semibold truncate">{selObj.label}</span>
                    </div>
                    <span className="text-[9px] text-gray-500 capitalize">{selObj.type} · {selObj.layer}</span>
                  </div>
                  <div className="px-1 py-1">
                    {Object.entries(selObj.properties ?? {}).map(([key, val]) => (
                      <div key={key} className="flex items-center border-b border-gray-800 hover:bg-[#252535] group">
                        <span className="text-[10px] text-gray-400 px-1.5 py-0.5 w-20 flex-shrink-0 truncate">{key}</span>
                        {editingProp?.id === selObj.id && editingProp?.key === key ? (
                          <input autoFocus
                            value={editingProp.val}
                            onChange={e => setEditingProp(p => p ? {...p, val: e.target.value} : null)}
                            onBlur={() => {
                              const updated = {...selObj, properties: {...(selObj.properties??{}), [key]: editingProp!.val}}
                              setCanvasObjects(prev => prev.map(o => o.id === selObj.id ? updated : o))
                              updateCanvasObject(updated)
                              setEditingProp(null)
                            }}
                            onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditingProp(null) }}
                            className="flex-1 bg-[#0078d4]/20 text-white text-[10px] px-1 py-0.5 outline-none border border-[#0078d4]"
                          />
                        ) : (
                          <span className="flex-1 text-[10px] text-white px-1.5 py-0.5 truncate cursor-text group-hover:bg-[#2a2a3e]"
                            onDoubleClick={() => setEditingProp({id: selObj.id, key, val})}>
                            {val}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="px-2 py-1.5 border-t border-gray-700 space-y-1">
                    <div className="text-[9px] text-gray-500 mb-1">Цвет объекта</div>
                    <div className="flex gap-1 flex-wrap">
                      {["#ef4444","#f97316","#f59e0b","#22c55e","#06b6d4","#a855f7","#6366f1","#ffffff","#0078d4"].map(c => (
                        <button key={c} onClick={() => { const updated = {...selObj, color:c}; setCanvasObjects(prev => prev.map(o => o.id===selObj.id ? updated : o)); updateCanvasObject(updated) }}
                          className={`w-4 h-4 rounded border transition-all ${selObj.color===c?"border-white scale-110":"border-transparent hover:border-gray-400"}`}
                          style={{background:c}}/>
                      ))}
                    </div>
                    <button onClick={() => {
                      pushUndo(`Удалено: ${selObj.label}`)
                      setCanvasObjects(prev => prev.filter(o => o.id !== selObj.id))
                      deleteCanvasObject(selObj.id)
                      setSelectedObjId(null)
                      showToast(`Удалён: ${selObj.label}`)
                    }} className="w-full mt-1 text-[10px] text-red-400 hover:text-white hover:bg-red-500/20 border border-red-500/30 rounded py-0.5 transition-colors flex items-center justify-center gap-1">
                      <Icon name="Trash2" size={10}/> Удалить объект
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <Icon name="MousePointer2" size={20} className="text-gray-600 mb-2"/>
                  <span className="text-[10px] text-gray-500">Выберите объект на чертеже</span>
                  <span className="text-[9px] text-gray-600 mt-1">инструмент «Выбор»</span>
                  <div className="mt-4 text-[9px] text-gray-600 space-y-1 text-left w-full border border-gray-700 rounded p-2">
                    <div className="text-gray-400 font-semibold mb-1">Объектов на чертеже:</div>
                    {canvasObjects.map(o => (
                      <button key={o.id} onClick={() => { setSelectedObjId(o.id); setActiveTool("select") }}
                        className="w-full text-left flex items-center gap-1.5 hover:text-white transition-colors py-0.5 group">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background: o.color}}/>
                        <span className="truncate text-[9px]">{o.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })()}

        {/* ── Right: Геопозиционирование панель ── */}
        {showGeoMenu && (
          <div className="bg-[#2d2d3d] border-l border-gray-600 flex flex-col flex-shrink-0 overflow-y-auto z-30" style={{width:224}}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-600 bg-[#252535] sticky top-0">
              <span className="text-white text-[11px] font-bold">Координаты и режимы</span>
              <button onClick={()=>setShowGeoMenu(false)} className="text-gray-400 hover:text-white text-xs">✕</button>
            </div>
            {(Object.entries(geoSettings) as [string,boolean][]).reduce<(string|null)[]>((acc, [k], i, arr) => {
              const separators = [3, 10, 16, 19, 24]
              if (separators.includes(i)) acc.push(null)
              acc.push(k)
              return acc
            }, []).map((item, i) => item === null ? (
              <div key={`sep-${i}`} className="border-t border-gray-700 my-0.5 mx-2"/>
            ) : (
              <button key={item} onClick={() => setGeoSettings(p=>({...p,[item]:!p[item]}))}
                className="flex items-center gap-2 px-3 py-1 text-[11px] hover:bg-[#0078d4]/20 hover:text-white text-left w-full transition-colors">
                <span className={`w-3 font-bold flex-shrink-0 ${geoSettings[item]?"text-[#0078d4]":"text-transparent"}`}>✓</span>
                <span className={geoSettings[item]?"text-gray-200":"text-gray-500"}>{item}</span>
              </button>
            ))}
            <div className="p-2 border-t border-gray-700 mt-auto">
              <button onClick={()=>{setGeoSettings(p=>Object.fromEntries(Object.keys(p).map(k=>[k,true])));showToast("Все режимы включены")}}
                className="w-full text-[10px] text-gray-300 hover:text-white border border-gray-600 rounded py-1 hover:border-[#0078d4] transition-colors">
                Включить все
              </button>
            </div>
          </div>
        )}

        {/* ── Right: AI Ассистент ── */}
        {showAssistant && (
          <div className="bg-[#141420] border-l border-gray-700 flex flex-col flex-shrink-0" style={{width:260}}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-gradient-to-r from-[#0d2540] to-[#1a1a2e]">
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 32 32" width="18" height="18" fill="none" className="flex-shrink-0">
                  <circle cx="12" cy="7" r="3.2" fill="#4fc3f7"/>
                  <circle cx="20" cy="7" r="3.2" fill="#4fc3f7"/>
                  <circle cx="7" cy="13" r="2.6" fill="#4fc3f7"/>
                  <circle cx="25" cy="13" r="2.6" fill="#4fc3f7"/>
                  <path d="M16 28C10 28 6 22.5 7 17.5C7.8 13.5 11 12 16 12C21 12 24.2 13.5 25 17.5C26 22.5 22 28 16 28Z" fill="#4fc3f7"/>
                </svg>
                <div>
                  <div className="text-white text-[11px] font-bold leading-tight">ЛАПА-Ассистент</div>
                  <div className="text-[#4fc3f7] text-[8px]">AI-ассистент · powered by ЛАПА</div>
                </div>
              </div>
              <button onClick={()=>setShowAssistant(false)} className="text-gray-400 hover:text-white text-sm leading-none">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2" style={{minHeight:0}}>
              {assistantMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role==="user"?"justify-end":"justify-start"}`}>
                  <div className={`max-w-[210px] px-2.5 py-1.5 rounded-lg text-[11px] leading-relaxed ${msg.role==="user"?"bg-[#0078d4] text-white rounded-br-sm":"bg-[#252535] text-gray-200 rounded-bl-sm"}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-gray-700">
              <div className="flex flex-wrap gap-1 mb-2">
                {["Создать трассу","HRA анализ","Характерная линия","Dynamo 4.0","Дренаж"].map(q=>(
                  <button key={q} onClick={()=>sendAssistantMessage(q)}
                    className="text-[9px] px-1.5 py-0.5 bg-[#0078d4]/20 text-[#60a5fa] hover:bg-[#0078d4]/40 rounded border border-[#0078d4]/30 transition-colors">
                    {q}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                <input value={assistantInput} onChange={e=>setAssistantInput(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&sendAssistantMessage(assistantInput)}
                  placeholder="Задайте вопрос о проектировании…"
                  className="flex-1 bg-[#252535] border border-gray-600 text-white text-[11px] px-2 py-1 rounded outline-none focus:border-[#0078d4] placeholder-gray-600"/>
                <button onClick={()=>sendAssistantMessage(assistantInput)}
                  className="px-2 py-1 rounded text-white transition-colors flex-shrink-0" style={{background:"#0078d4"}}>
                  <Icon name="Send" size={11} fallback="ArrowRight"/>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Right: Vertical nav toolbar (Civil 3D right strip) ── */}
        <div className="bg-[#1e1e2e] border-l border-gray-800 flex flex-col items-center py-1 gap-0.5 flex-shrink-0 overflow-y-auto" style={{width:22}}>
          {([
            { icon: "ZoomIn",        title: "Увеличить",              action: () => setZoom(z => Math.min(6, z * 1.25)) },
            { icon: "ZoomOut",       title: "Уменьшить",              action: () => setZoom(z => Math.max(0.3, z * 0.8)) },
            { icon: "Maximize2",     title: "Вписать всё  ZE",        action: () => { setZoom(1.1); setPan({ x: 30, y: 20 }) } },
            { icon: "Hand",          title: "Панорама",               action: () => { setActiveTool("pan"); setStatusMsg("Инструмент: Панорама") } },
            { icon: "RotateCcw",     title: "Орбита",                 action: () => setStatusMsg("Инструмент: Орбита") },
            { icon: "Eye",           title: "Свободная орбита",       action: () => setStatusMsg("Инструмент: Свободная орбита") },
            null,
            { icon: "MousePointer2", title: "Выбор  S",               action: () => setActiveTool("select") },
            { icon: "Move",          title: "Перенести  M",           action: () => setActiveTool("move") },
            { icon: "Ruler",         title: "Измерить расстояние",    action: () => { setActiveTool("measure"); setStatusMsg("Инструмент: Измерение") } },
            null,
            { icon: "Minus",         title: "Линия  L",               action: () => { setActiveTool("line"); setDrawingPts([]) } },
            { icon: "Spline",        title: "Полилиния  PL",          action: () => { setActiveTool("polyline"); setDrawingPts([]) } },
            { icon: "MapPin",        title: "Точка  O",               action: () => setActiveTool("point") },
            { icon: "Square",        title: "Прямоугольник  R",       action: () => { setActiveTool("rect"); setDrawingPts([]) } },
            { icon: "Trash2",        title: "Удалить  Del",           action: () => setActiveTool("delete") },
            null,
            { icon: "Layers",        title: "Слои",                   action: () => setShowLayers(true) },
            { icon: "ListFilter",    title: "Свойства объекта  PR",   action: () => setShowProperties(p => !p) },
            { icon: "BarChart3",     title: "Земляные работы",        action: () => setShowEarthworks(true) },
            { icon: "Mountain",      title: "Создать поверхность",           action: () => setShowSurface(true) },
            { icon: "PencilRuler",   title: "Редактировать поверхность  SURFACEEDIT", action: () => { setSurfaceEditName("Существующая поверхность"); setShowSurfaceEdit(true) }, fallback: "Edit" },
            { icon: "Route",         title: "Создать трассу",                action: () => setShowAlignment(true) },
            { icon: "Navigation",    title: "Создать коридор",               action: () => setShowCorridor(true) },
            { icon: "Network",       title: "Создать трубопровод",           action: () => setShowPipeNet(true) },
            { icon: "Spline",        title: "Линия выхода на рельеф",  action: () => setShowDaylightFL(true) },
            null,
            { icon: "Share2",        title: "Ярлыки данных — Синхронизация  SYNCHRONIZEDATA", action: () => setShowDataShortcuts(true), fallback: "Link" },
            { icon: "FileBarChart2", title: "Диспетчер отчётов",             action: () => setShowProjectManager(true) },
            { icon: "GitBranch",     title: "Отчёт о невязке",               action: () => setShowSurveyTraverse(true) },
            { icon: "Sparkles",      title: "Что нового · 2023–2026",        action: () => setShowWhatsNewVer(true) },
            { icon: "Bot",           title: "ЛАПА-Ассистент",                action: () => setShowAssistant(p => !p) },
            null,
            { icon: "SplitSquareVertical", title: "Разделить экран", action: () => setSplitView(p => !p), fallback: "Columns" },
            { icon: "Sun",           title: "Тонирование",            action: () => { setViewMode("shaded"); setStatusMsg("Визуальный стиль: Тонирование") } },
            { icon: "Grid3X3",       title: "Каркас",                 action: () => { setViewMode("wireframe"); setStatusMsg("Визуальный стиль: 2D Каркас") } },
          ] as ({icon:string;title:string;action:()=>void;fallback?:string}|null)[]).map((item, i) =>
            item === null ? (
              <div key={`sep-${i}`} className="w-3 border-t border-gray-700 my-0.5"/>
            ) : (
              <button key={item.icon + i} title={item.title} onClick={item.action}
                className={`w-5 h-5 flex items-center justify-center rounded transition-colors flex-shrink-0 ${
                  (item.icon === "MousePointer2" && activeTool === "select") ||
                  (item.icon === "Move" && activeTool === "move") ||
                  (item.icon === "Minus" && activeTool === "line") ||
                  (item.icon === "Spline" && activeTool === "polyline") ||
                  (item.icon === "MapPin" && activeTool === "point") ||
                  (item.icon === "Square" && activeTool === "rect") ||
                  (item.icon === "Trash2" && activeTool === "delete") ||
                  (item.icon === "Hand" && activeTool === "pan") ||
                  (item.icon === "Bot" && showAssistant) ||
                  (item.icon === "ListFilter" && showProperties)
                    ? "bg-[#0078d4] text-white"
                    : "text-gray-500 hover:text-white hover:bg-[#0078d4]/30"
                }`}>
                <Icon name={item.icon} size={11} fallback={item.fallback ?? "Square"}/>
              </button>
            )
          )}
        </div>

        {/* ── Right: Section views ── */}
        {showRightPanel && (
          <LiveCrossSectionPanel
            alignments={[
              ...corridors,
              ...canvasObjects.filter(o => o.type === "alignment").map(o => o.label),
              "Ливневая канализация"
            ].filter((v, i, a) => a.indexOf(v) === i)}
            onClose={() => setShowRightPanel(false)}
            selectedAlignment={
              // Синхронизация: если выбран объект на canvas — берём его label
              (canvasObjects.find(o => o.id === selectedObjId)?.type === "alignment"
                ? canvasObjects.find(o => o.id === selectedObjId)?.label
                : undefined) ||
              // или из выбранного узла дерева
              (selectedNode ? (() => {
                const findNode = (nodes: TreeNode[]): TreeNode | null => {
                  for (const n of nodes) {
                    if (n.id === selectedNode) return n
                    if (n.children) { const f = findNode(n.children); if (f) return f }
                  }
                  return null
                }
                const node = findNode(treeData)
                return node && !node.children ? node.label : undefined
              })() : undefined) ||
              corridors[0] || "Дорога ШД-38"
            }
          />
        )}
        {showInsights && <InsightsPanel onClose={()=>setShowInsights(false)}/>}
        <AnimatePresence>
          {showScriptEditor && (
            <motion.div initial={{x:380,opacity:0}} animate={{x:0,opacity:1}} exit={{x:380,opacity:0}}
              className="absolute right-0 top-0 bottom-0 bg-[#0d1117] border-l border-gray-700 flex flex-col z-40 overflow-hidden"
              style={{width:360}}>
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-[#1a1a2e] flex-shrink-0">
                <span className="text-white text-[12px] font-bold flex items-center gap-2">
                  <Icon name="Code" size={13} className="text-purple-400"/>
                  Инструменты автоматизации
                </span>
                <button onClick={()=>setShowScriptEditor(false)} className="text-gray-400 hover:text-white text-sm">✕</button>
              </div>

              {/* Tabs: AutoLISP / Dynamo / Assistant */}
              <div className="flex border-b border-gray-700 flex-shrink-0">
                {([
                  ["autolisp","AutoLISP","#a78bfa"],
                  ["dynamo","Dynamo","#22d3ee"],
                  ["assistant","AI Ассистент","#f97316"],
                ] as const).map(([id, label, color]) => (
                  <button key={id} onClick={() => setScriptType(id)}
                    className={`flex-1 text-[10px] py-1.5 font-semibold transition-colors border-b-2 ${scriptType===id?`border-b-[${color}] text-white bg-[#1a1a2e]`:"border-transparent text-gray-500 hover:text-gray-300 bg-transparent"}`}
                    style={scriptType===id?{borderBottomColor:color,color:"white",background:"#1a1a2e"}:{borderBottomColor:"transparent"}}>
                    {label}
                  </button>
                ))}
              </div>

              {/* ── AutoLISP ── */}
              {scriptType === "autolisp" && (
                <div className="flex flex-col flex-1 min-h-0">
                  {/* Snippets library */}
                  <div className="px-2 py-1.5 border-b border-gray-800 flex-shrink-0">
                    <div className="text-[9px] text-gray-500 mb-1 uppercase tracking-wide">Библиотека скриптов</div>
                    <div className="flex gap-1 flex-wrap">
                      {AUTOLISP_SCRIPTS.map(s => (
                        <button key={s.name} onClick={() => setAutoLispSnippet(s.code)}
                          className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${autoLispSnippet===s.code?"border-purple-500 bg-purple-500/20 text-purple-300":"border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white"}`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Code editor */}
                  <div className="relative flex-1 min-h-0">
                    <div className="absolute top-2 right-2 z-10 flex gap-1">
                      <span className="text-[8px] text-purple-400 bg-[#1a1a2e] px-1.5 py-0.5 rounded border border-purple-500/30">AutoLISP</span>
                    </div>
                    <div className="flex h-full">
                      {/* Line numbers */}
                      <div className="bg-[#0a0a14] w-7 flex-shrink-0 pt-2 px-1 text-right border-r border-gray-800 overflow-hidden">
                        {autoLispSnippet.split("\n").map((_, i) => (
                          <div key={i} className="text-[9px] text-gray-700 font-mono leading-[18px]">{i+1}</div>
                        ))}
                      </div>
                      <textarea value={autoLispSnippet} onChange={e => setAutoLispSnippet(e.target.value)}
                        className="flex-1 bg-[#0d1117] text-green-300 font-mono text-[10.5px] p-2 pl-2 outline-none resize-none leading-[18px]"
                        spellCheck={false}/>
                    </div>
                  </div>
                  {/* Controls */}
                  <div className="p-2 border-t border-gray-800 flex-shrink-0 space-y-1.5">
                    <div className="flex gap-1.5">
                      <button onClick={runScript} disabled={scriptRunning}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] text-white font-semibold disabled:opacity-50 transition-all"
                        style={{background: scriptRunning?"#5b21b6":"#7c3aed"}}>
                        <Icon name={scriptRunning?"Loader":"Play"} size={11} className={scriptRunning?"animate-spin":""}/>
                        {scriptRunning ? "Выполнение…" : "▶ Запустить (F5)"}
                      </button>
                      <button onClick={() => setScriptOutput([])}
                        className="px-2 py-1.5 rounded text-[11px] text-gray-400 border border-gray-700 hover:text-white hover:border-gray-500 transition-colors">
                        <Icon name="Trash2" size={11}/>
                      </button>
                    </div>
                    {/* Console */}
                    <div className="bg-[#020409] rounded border border-gray-800 p-2 overflow-y-auto" style={{minHeight:60,maxHeight:80}}>
                      {scriptOutput.length === 0
                        ? <div className="text-[9px] text-gray-700 font-mono">; Консоль AutoLISP готова</div>
                        : scriptOutput.map((line, i) => (
                          <div key={i} className={`text-[9.5px] font-mono leading-[15px] ${line.includes("✓")||line.includes("OK")?"text-green-400":line.includes("Ошибка")||line.includes("ERR")?"text-red-400":line.startsWith("[")?"text-gray-400":"text-yellow-300"}`}>{line}</div>
                        ))
                      }
                    </div>
                    <div className="text-[9px] text-gray-600">F5 — запуск · Ctrl+C — отмена · (load "file.lsp") — загрузить файл</div>
                  </div>
                </div>
              )}

              {/* ── Dynamo ── */}
              {scriptType === "dynamo" && (
                <div className="flex flex-col flex-1 min-h-0">
                  {/* Script selector */}
                  <div className="px-2 py-1.5 border-b border-gray-800 flex-shrink-0">
                    <div className="text-[9px] text-gray-500 mb-1 uppercase tracking-wide">Графики Dynamo 4.0</div>
                    <div className="flex gap-1 flex-wrap">
                      {DYNAMO_SCRIPTS.map(s => (
                        <button key={s.name} onClick={() => { setDynamoScript(s.name); setDynamoNodes(s.nodes); setSelectedDynamoNode(null); setScriptOutput([]) }}
                          className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${dynamoScript===s.name?"border-cyan-500 bg-cyan-500/20 text-cyan-300":"border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white"}`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Node canvas */}
                  <div className="relative flex-1 overflow-hidden border-b border-gray-800" style={{minHeight:0,background:"#060b14"}}>
                    <div className="absolute inset-0 overflow-auto p-2">
                      <svg width="320" height="140" style={{minWidth:320}}>
                        {/* Grid */}
                        {Array.from({length:17}).map((_,i)=><line key={`vg${i}`} x1={i*20} y1="0" x2={i*20} y2="140" stroke="rgba(30,50,80,0.5)" strokeWidth="0.5"/>)}
                        {Array.from({length:8}).map((_,i)=><line key={`hg${i}`} x1="0" y1={i*20} x2="320" y2={i*20} stroke="rgba(30,50,80,0.5)" strokeWidth="0.5"/>)}

                        {/* Connections */}
                        {dynamoNodes.filter(n=>n.connected).map(n => {
                          const src = dynamoNodes.find(s=>s.id===n.connected)
                          if (!src) return null
                          return <path key={`c${n.id}`}
                            d={`M${src.x+80},${src.y+14} C${src.x+110},${src.y+14} ${n.x-10},${n.y+14} ${n.x},${n.y+14}`}
                            fill="none" stroke="#22d3ee" strokeWidth="1.5" opacity="0.6"/>
                        })}

                        {/* Nodes */}
                        {dynamoNodes.map(n => (
                          <g key={n.id} onClick={() => setSelectedDynamoNode(n.id)} style={{cursor:"pointer"}}>
                            <rect x={n.x} y={n.y} width="80" height="28" rx="3"
                              fill={selectedDynamoNode===n.id?"#1a3a5c":"#0f1f33"}
                              stroke={selectedDynamoNode===n.id?"#22d3ee":n.color} strokeWidth={selectedDynamoNode===n.id?1.5:1}/>
                            <rect x={n.x} y={n.y} width="5" height="28" rx="3" fill={n.color}/>
                            <text x={n.x+10} y={n.y+11} fill="#e2e8f0" fontSize="5.5" fontFamily="monospace">{n.type.toUpperCase()}</text>
                            <text x={n.x+10} y={n.y+21} fill="white" fontSize="6.5" fontFamily="monospace" fontWeight="bold">{n.label}</text>
                            {/* Input port */}
                            <circle cx={n.x} cy={n.y+14} r="3" fill="#1e293b" stroke={n.color} strokeWidth="1"/>
                            {/* Output port */}
                            <circle cx={n.x+80} cy={n.y+14} r="3" fill={n.color}/>
                          </g>
                        ))}
                      </svg>
                    </div>
                    <div className="absolute top-1 right-1 text-[8px] text-gray-600 bg-[#0d1117]/80 px-1 rounded">Dynamo Core 4.0.2</div>
                  </div>

                  {/* Node properties */}
                  {selectedDynamoNode && (() => {
                    const node = dynamoNodes.find(n=>n.id===selectedDynamoNode)
                    if (!node) return null
                    return (
                      <div className="px-2 py-1.5 border-b border-gray-800 flex-shrink-0 bg-[#0a0e1a]">
                        <div className="text-[9px] text-gray-500 mb-1">Узел: <span className="text-white font-semibold">{node.label}</span></div>
                        <div className="flex gap-2 text-[9px]">
                          <span className="text-gray-500">Тип:</span><span style={{color:node.color}} className="font-semibold">{node.type}</span>
                          <span className="text-gray-500 ml-2">Статус:</span><span className="text-green-400">OK</span>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Run */}
                  <div className="p-2 flex-shrink-0 space-y-1.5">
                    <div className="flex gap-1.5">
                      <button onClick={runScript} disabled={scriptRunning}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] text-white font-semibold disabled:opacity-50"
                        style={{background:"#0e4f6e"}}>
                        <Icon name={scriptRunning?"Loader":"Play"} size={11} className={scriptRunning?"animate-spin":""}/>
                        {scriptRunning ? "Выполнение…" : "▶ Запустить граф"}
                      </button>
                      <button onClick={() => setScriptOutput([])} className="px-2 py-1.5 rounded border border-gray-700 text-gray-400 hover:text-white">
                        <Icon name="Trash2" size={11}/>
                      </button>
                    </div>
                    <div className="bg-[#020409] rounded border border-gray-800 p-1.5 overflow-y-auto" style={{maxHeight:60}}>
                      {scriptOutput.length === 0
                        ? <div className="text-[9px] text-gray-700 font-mono">// Граф не запущен</div>
                        : scriptOutput.map((line, i) => (
                          <div key={i} className={`text-[9.5px] font-mono leading-[15px] ${line.includes("✓")?"text-green-400":line.includes("Ошибка")?"text-red-400":"text-gray-400"}`}>{line}</div>
                        ))
                      }
                    </div>
                  </div>
                </div>
              )}

              {/* ── AI Ассистент (Tech Preview) ── */}
              {scriptType === "assistant" && (
                <div className="flex flex-col flex-1 min-h-0">
                  {/* Tech Preview badge */}
                  <div className="px-3 py-2 bg-orange-500/10 border-b border-orange-500/20 flex items-center gap-2 flex-shrink-0">
                    <span className="text-[9px] px-1.5 py-0.5 bg-orange-500/20 text-orange-300 rounded font-bold border border-orange-500/40">ПРЕДПРОСМОТР</span>
                    <span className="text-[9.5px] text-orange-200">ЛАПА AI-Ассистент — проектирование инфраструктуры</span>
                  </div>

                  {/* Context pills */}
                  <div className="px-2 py-1.5 border-b border-gray-800 flex-shrink-0">
                    <div className="text-[9px] text-gray-500 mb-1">Контекст модели:</div>
                    <div className="flex gap-1 flex-wrap">
                      {[
                        {label:`Объектов: ${canvasObjects.length}`, color:"#0078d4"},
                        {label:`Коридоров: ${corridors.length}`, color:"#f97316"},
                        {label:"TIN: активна", color:"#4ade80"},
                      ].map(p => (
                        <span key={p.label} className="text-[9px] px-1.5 py-0.5 rounded border font-mono"
                          style={{borderColor:p.color+"60",color:p.color,background:p.color+"15"}}>
                          {p.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
                    {assistantMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role==="user"?"justify-end":"justify-start"}`}>
                        {msg.role==="bot" && (
                          <div className="w-5 h-5 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center mr-1.5 flex-shrink-0 mt-0.5">
                            <span className="text-[8px] text-orange-300">AI</span>
                          </div>
                        )}
                        <div className={`max-w-[220px] px-2.5 py-1.5 rounded-lg text-[11px] leading-relaxed ${msg.role==="user"?"bg-[#0078d4] text-white rounded-br-sm":"bg-[#1a1a2e] text-gray-200 rounded-bl-sm border border-gray-700"}`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick actions */}
                  <div className="px-2 pt-1.5 flex-shrink-0">
                    <div className="text-[9px] text-gray-500 mb-1">Быстрые запросы:</div>
                    <div className="flex gap-1 flex-wrap mb-1.5">
                      {[
                        "Создать трассу","Коридор по параметрам","Объёмы земляных работ",
                        "Линия выхода на рельеф","HRA анализ","Dynamo 4.0","Дренаж InfoDrainage"
                      ].map(q => (
                        <button key={q} onClick={() => sendAssistantMessage(q)}
                          className="text-[9px] px-1.5 py-0.5 bg-orange-500/10 text-orange-200 hover:bg-orange-500/25 rounded border border-orange-500/20 transition-colors">
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input */}
                  <div className="p-2 border-t border-gray-700 flex-shrink-0">
                    <div className="flex gap-1">
                      <input value={assistantInput} onChange={e=>setAssistantInput(e.target.value)}
                        onKeyDown={e=>e.key==="Enter"&&sendAssistantMessage(assistantInput)}
                        placeholder="Спросите о Лапа, модели, объектах…"
                        className="flex-1 bg-[#1a1a2e] border border-gray-700 text-white text-[11px] px-2 py-1.5 rounded outline-none focus:border-orange-500/50 placeholder-gray-600"/>
                      <button onClick={()=>sendAssistantMessage(assistantInput)}
                        className="px-2.5 py-1.5 rounded text-white flex-shrink-0 transition-colors"
                        style={{background:"#ea580c"}}>
                        <Icon name="Send" size={11} fallback="ArrowRight"/>
                      </button>
                    </div>
                    <div className="text-[9px] text-gray-600 mt-1">ЛАПА Ассистент · Предпросмотр · на технологии ЛАПА AI</div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Command line ── */}
      <div className="bg-[#0f0f1e] border-t border-gray-700 flex flex-col flex-shrink-0">
        <div className="px-3 py-0.5 text-[10px] text-gray-400 font-mono border-b border-gray-800">{statusMsg}</div>
        <div className="flex items-center gap-1 px-2 py-0.5">
          <span className="text-[10px] text-gray-600 font-mono select-none">⚡</span>
          <input
            value={commandLine}
            onChange={e => setCommandLine(e.target.value)}
            onKeyDown={e => e.key === "Enter" && runCommand(commandLine)}
            placeholder={
              activeTool === "rect"
                ? "Задайте противоположный угол или [Линия РМ-угол СМ-угол]:"
                : activeTool === "line"
                  ? "Укажите следующую точку или [Отменить]:"
                  : activeTool === "polyline"
                    ? "Укажите следующую точку или [Дуга/Закрыть/Длина/Отменить]:"
                    : activeTool === "point"
                      ? "Укажите положение точки:"
                      : "Команды: L=Линия, PL=Полилиния, O=Точка, M=Перенести, E=Удалить, ZE=Вписать, ЗЕМЛЯ, ТРАССА, КОРИДОР…"
            }
            className="flex-1 bg-transparent text-[11px] text-green-300 font-mono outline-none placeholder-gray-700 px-2"
          />
          {/* X,Y coordinate quick-entry fields — shown when user types digits */}
          {/^\d/.test(commandLine) && (
            <div className="flex items-center gap-0.5 border-l border-gray-700 pl-1.5 flex-shrink-0">
              <span className="text-[9px] text-gray-500 font-mono">X</span>
              <input
                type="number"
                defaultValue={commandLine.split(",")[0] || ""}
                className="w-16 bg-[#1a1a2e] border border-gray-700 text-green-300 text-[10px] font-mono px-1 py-0.5 outline-none focus:border-[#0078d4]"
                placeholder="0.000"
              />
              <span className="text-[9px] text-gray-500 font-mono ml-0.5">Y</span>
              <input
                type="number"
                defaultValue={commandLine.split(",")[1] || ""}
                className="w-16 bg-[#1a1a2e] border border-gray-700 text-green-300 text-[10px] font-mono px-1 py-0.5 outline-none focus:border-[#0078d4]"
                placeholder="0.000"
              />
            </div>
          )}
          <button onClick={() => runCommand(commandLine)} className="text-[10px] text-gray-500 hover:text-white px-2">↵</button>
        </div>
      </div>

      {/* ── Status bar — точная копия AutoCAD/Civil 3D ── */}
      <div className="bg-[#1a1a2a] border-t border-gray-800 flex items-center gap-0 flex-shrink-0 select-none overflow-hidden" style={{minHeight:22, fontSize:10}}>
        {/* Левый блок: МОДЕЛЬ + листы */}
        <div className="flex items-center flex-shrink-0 border-r border-gray-700">
          <button
            onClick={() => { setActiveLayout("Model"); setStatusMsg("Пространство модели") }}
            className={`text-[9px] font-bold px-2 py-0.5 transition-colors ${activeLayout==="Model"?"text-white bg-[#0078d4]":"text-[#4fc3f7] hover:bg-[#252535]"}`}
            title="Перейти к пространству модели">MODEL</button>
          <span className="text-gray-700 text-[10px] px-0.5">+</span>
          {drawingTabs.slice(0,3).map((t,i) => (
            <button key={t} onClick={() => { setActiveLayout("Layout"+(i+1)); setActiveDrawingTab(t); setStatusMsg(`Лист: ${t}`) }}
              className={`text-[9px] px-2 py-0.5 border-l border-gray-800 transition-colors whitespace-nowrap ${activeLayout==="Layout"+(i+1)?"text-white bg-[#252535]":"text-gray-500 hover:text-white hover:bg-[#252535]"}`}>
              {i===0?"Лист 1":i===1?"Лист 2":"Лист 3"}
            </button>
          ))}
          <button onClick={() => showToast("Добавление листа...")} className="text-[10px] text-gray-600 hover:text-white px-1.5 py-0.5 border-l border-gray-800 transition-colors" title="Добавить лист">+</button>
        </div>

        {/* Центр: Civil 3D status toggles — SNAP GRID ORTHO POLAR OSNAP OTRACK DUCS DYN LWT TPSNAP SC */}
        <div className="flex items-center gap-0 flex-1 overflow-hidden">
          {([
            { k:"Режим привязки",               lbl:"SNAP",   f:"F9",  tip:"Режим привязки (F9)" },
            { k:"Сетка",                         lbl:"GRID",   f:"F7",  tip:"Отображение сетки (F7)" },
            { k:"Режим «Орто»",                  lbl:"ORTHO",  f:"F8",  tip:"Режим Орто (F8)" },
            { k:"Полярное отслеживание",          lbl:"POLAR",  f:"F10", tip:"Полярное отслеживание (F10)" },
            { k:"Объектная привязка 2D",          lbl:"OSNAP",  f:"F3",  tip:"Объектная привязка 2D (F3)" },
            { k:"Отслеживание привязки к объектам",lbl:"OTRACK",f:"F11", tip:"Отслеживание по привязке (F11)" },
            { k:"Динамическая ПСК",               lbl:"DUCS",   f:"",    tip:"Динамическая ПСК" },
            { k:"Динамический ввод",              lbl:"DYN",    f:"F12", tip:"Динамический ввод (F12)" },
            { k:"Толщина линий",                  lbl:"LWT",    f:"",    tip:"Толщина линий" },
            { k:"Прозрачность",                   lbl:"TPSNAP", f:"",    tip:"Прозрачность объектов" },
          ] as const).map(item => (
            <button key={item.k}
              onClick={() => setGeoSettings(prev => ({ ...prev, [item.k]: !prev[item.k] }))}
              title={`${item.tip}${item.f?" ("+item.f+")":""}`}
              className={`text-[8.5px] font-bold px-1.5 py-0.5 border-r border-gray-800 transition-colors tracking-wide
                ${geoSettings[item.k]?"text-white hover:text-[#4fc3f7]":"text-[#444] hover:text-gray-500"}`}>
              {item.lbl}
            </button>
          ))}
          {/* Масштаб аннотаций */}
          <button onClick={() => setScale(s=>s==="1:500"?"1:1000":s==="1:1000"?"1:200":"1:500")}
            title="Масштаб аннотаций"
            className="text-[9px] px-2 py-0.5 border-r border-gray-800 text-gray-400 hover:text-white transition-colors font-mono whitespace-nowrap">
            {scale}
          </button>
          {/* Видимость аннотаций */}
          <button onClick={() => setGeoSettings(prev=>({...prev,"Видимость аннотаций":!prev["Видимость аннотаций"]}))}
            title="Видимость аннотаций"
            className={`text-[9px] px-1.5 py-0.5 border-r border-gray-800 transition-colors ${geoSettings["Видимость аннотаций"]?"text-white":"text-[#444] hover:text-gray-500"}`}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" strokeWidth="1.5"/><circle cx="6" cy="6" r="1.5"/></svg>
          </button>
          {/* Рабочее пространство */}
          <button onClick={()=>showToast("Рабочие пространства: Лапа")}
            title="Переключение рабочего пространства"
            className="text-[9px] px-2 py-0.5 border-r border-gray-800 text-gray-500 hover:text-white transition-colors whitespace-nowrap flex items-center gap-0.5">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor"><rect x="1" y="1" width="4" height="4" rx="0.5"/><rect x="7" y="1" width="4" height="4" rx="0.5"/><rect x="1" y="7" width="4" height="4" rx="0.5"/><rect x="7" y="7" width="4" height="4" rx="0.5"/></svg>
          </button>
        </div>

        {/* Правый блок: DS статус + координаты + иконка ЛАПА */}
        <div className="flex items-center flex-shrink-0 gap-0">
          {/* Data Shortcuts */}
          <button onClick={() => setShowDataShortcuts(true)}
            title={syncStatus==="ok"?"Ярлыки данных синхронизированы":"Требуется синхронизация данных"}
            className="flex items-center gap-1 text-[9px] px-2 py-0.5 border-l border-gray-800 hover:bg-[#252535] transition-colors">
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${syncStatus==="ok"?"bg-green-500":"bg-yellow-400 animate-pulse"}`}/>
            <span className={`font-bold ${syncStatus==="ok"?"text-green-400":"text-yellow-400"}`}>{syncStatus==="ok"?"DS":"DS⚠"}</span>
          </button>
          {/* Координаты XYZ */}
          <div className="flex items-center gap-0 text-[9px] font-mono border-l border-gray-800 px-2 py-0.5 text-gray-400">
            <span className="text-gray-600 mr-0.5">X</span>
            <span className="text-[#4fc3f7] min-w-[54px]">{cursorCoords.x.toFixed(4)}</span>
            <span className="text-gray-600 mx-1">Y</span>
            <span className="text-[#4fc3f7] min-w-[54px]">{cursorCoords.y.toFixed(4)}</span>
            <span className="text-gray-600 mx-1">Z</span>
            <span className="text-gray-600 min-w-[38px]">0.0000</span>
          </div>
          {/* Иконка настройки */}
          <button onClick={() => setShowGeoMenu(p=>!p)} title="Настройки черчения"
            className="text-[9px] text-gray-600 hover:text-white px-1.5 py-0.5 border-l border-gray-800 transition-colors">
            <svg width="11" height="11" viewBox="0 0 14 14" fill="currentColor"><circle cx="7" cy="7" r="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M7 1v2M7 11v2M1 7h2M11 7h2M3.2 3.2l1.4 1.4M9.4 9.4l1.4 1.4M9.4 4.6L8 6M4.6 9.4L3.2 10.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          </button>
          {/* Лого ЛАПА */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 border-l border-gray-800" title="Лапа">
            <svg viewBox="0 0 32 32" width="11" height="11" fill="none"><circle cx="12" cy="7" r="3.2" fill="#4fc3f7"/><circle cx="20" cy="7" r="3.2" fill="#4fc3f7"/><circle cx="7" cy="13" r="2.6" fill="#4fc3f7"/><circle cx="25" cy="13" r="2.6" fill="#4fc3f7"/><path d="M16 28C10 28 6 22.5 7 17.5C7.8 13.5 11 12 16 12C21 12 24.2 13.5 25 17.5C26 22.5 22 28 16 28Z" fill="#4fc3f7"/></svg>
          </div>
        </div>
      </div>

      {/* ── About ЛАПА Civil 3D 2027 диалог ── */}
      <AnimatePresence>
        {showAbout && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="absolute inset-0 bg-black/60 flex items-center justify-center z-[200]"
            onClick={()=>setShowAbout(false)}>
            <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
              className="bg-[#1e1e2e] border border-gray-600 rounded shadow-2xl overflow-hidden"
              style={{width:480,maxWidth:"95vw"}} onClick={e=>e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700 bg-gradient-to-r from-[#0a1a2e] to-[#1a1a2e]">
                <div className="flex items-center gap-3">
                  <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
                    <ellipse cx="16" cy="22" rx="7.5" ry="6.5" fill="#4fc3f7"/>
                    <ellipse cx="9.5" cy="12.5" rx="3.2" ry="3.7" fill="#4fc3f7"/>
                    <ellipse cx="22.5" cy="12.5" rx="3.2" ry="3.7" fill="#4fc3f7"/>
                    <ellipse cx="6"   cy="18"   rx="2.6" ry="3.1" fill="#4fc3f7"/>
                    <ellipse cx="26"  cy="18"   rx="2.6" ry="3.1" fill="#4fc3f7"/>
                    <ellipse cx="16"  cy="7.5"  rx="2.7" ry="3"   fill="#4fc3f7"/>
                  </svg>
                  <div>
                    <div className="text-white text-[15px] font-bold">ЛАПА — Инфраструктурный редактор</div>
                    <div className="text-[#4fc3f7] text-[10px]">На платформе Лапа · poehali.dev</div>
                  </div>
                </div>
                <button onClick={()=>setShowAbout(false)} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
              </div>
              {/* Body */}
              <div className="p-5 space-y-4">
                {/* Версия */}
                <div className="flex flex-wrap gap-3">
                  {[
                    ["Версия", "ЛАПА Редактор v2.0"],
                    ["Сборка", `Сборка ${new Date().toISOString().slice(0,10)}`],
                    ["Платформа", "Лапа · poehali.dev"],
                    [".NET", ".NET 10 / React 18"],
                    ["Dynamo Core", "4.0.2 (PythonNet3)"],
                    ["Лицензия", "Активна · Бессрочная"],
                  ].map(([k,v])=>(
                    <div key={k} className="bg-[#111827] rounded border border-gray-700 px-3 py-2 text-[10px] flex-1 min-w-[180px]">
                      <div className="text-gray-500 mb-0.5">{k}</div>
                      <div className="text-white font-mono">{v}</div>
                    </div>
                  ))}
                </div>
                {/* Описание */}
                <div className="text-[11px] text-gray-400 leading-relaxed">
                  ЛАПА — профессиональная ГИС/САПР-платформа для проектирования инфраструктуры: дороги, коридоры, трассы, поверхности, съёмка, гидрология, трубопроводы, объёмы земляных работ.
                </div>
                {/* Ключевые возможности */}
                <div>
                  <div className="text-[11px] text-gray-300 font-bold mb-2">Ключевые возможности:</div>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] text-gray-400">
                    {[
                      "TIN-поверхности, триангуляция Делоне",
                      "Трассы, профили, коридоры",
                      "Объёмы земляных работ (призматоид)",
                      "Инженерные сети, гидравлика",
                      "ЛАПА AI-ассистент",
                      "Dynamo Core 4.0 + PythonNet",
                      "Импорт/экспорт DXF, LandXML, IFC",
                      "Горизонтальный регрессионный анализ",
                    ].map(f=>(
                      <div key={f} className="flex items-start gap-1.5">
                        <span className="text-[#4fc3f7] mt-0.5 flex-shrink-0">●</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Действия */}
                <div className="flex items-center gap-3 pt-1 border-t border-gray-800">
                  <button onClick={()=>{ setShowAbout(false); showToast("Справка Лапа открыта") }}
                    className="text-[11px] text-[#4fc3f7] hover:underline flex items-center gap-1 bg-transparent border-0 cursor-pointer">
                    <Icon name="HelpCircle" size={11} fallback="Link"/> Справка
                  </button>
                  <button onClick={()=>{ setShowAbout(false); showToast("Запрос в техподдержку отправлен") }}
                    className="text-[11px] text-[#4fc3f7] hover:underline flex items-center gap-1 bg-transparent border-0 cursor-pointer">
                    <Icon name="Users" size={11} fallback="Link"/> Техподдержка
                  </button>
                  <div className="flex-1"/>
                  <button onClick={()=>setShowAbout(false)}
                    className="text-[11px] px-4 py-1.5 bg-[#0078d4] hover:bg-[#005fa3] text-white rounded transition-colors">
                    OK
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}