import { useRef, useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Icon from "@/components/ui/icon"

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
  const currentGroupLabel = "Элементы конструкций Civil в метрической системе единиц"
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
    if (!newName.trim()) return
    setSaving(true)
    fetch(PROJECTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), description: newDesc.trim(), type: newType })
    })
      .then(r => r.json())
      .then(p => {
        setProjects(prev => [p, ...prev])
        setCreating(false)
        setNewName("")
        setNewDesc("")
        setNewType("road")
        setSaving(false)
        onOpen(p.name, p.id)
      })
      .catch(() => setSaving(false))
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
          <div className="flex gap-2">
            <button onClick={createProject} disabled={saving || !newName.trim()}
              className="px-4 py-1.5 rounded text-[11px] text-white disabled:opacity-50 transition-colors"
              style={{background:"#0078d4"}}>
              {saving ? "Создание..." : "Создать и открыть"}
            </button>
            <button onClick={()=>setCreating(false)} className="px-4 py-1.5 rounded text-[11px] text-gray-400 border border-gray-600 hover:text-white transition-colors">
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
  const [search, setSearch] = useState("")
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [newTabName, setNewTabName] = useState("")

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] text-gray-200 overflow-hidden relative" style={{fontFamily:"Arial,sans-serif",fontSize:12}}>
      {/* Верхняя полоса */}
      <div className="bg-[#1a1a2a] border-b border-gray-800 flex items-center px-2 py-0.5 gap-2 flex-shrink-0" style={{minHeight:24}}>
        <div className="w-5 h-5 bg-[#0078d4] flex items-center justify-center text-white font-bold text-[10px] rounded-sm">C</div>
        <span className="text-[11px] text-gray-400 font-semibold ml-2">Autodesk Civil 3D 2027</span>
        <div className="flex-1"/>
        <input placeholder="Введите ключевое слово или фразу" className="bg-[#2a2a3a] border border-gray-600 text-[10px] text-gray-400 px-2 py-0.5 w-44 rounded-sm placeholder-gray-600 outline-none"/>
      </div>
      {/* Информационный баннер */}
      {showGraphicsBanner && (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-blue-800/40 flex-shrink-0" style={{background:"#1a2a3a"}}>
          <Icon name="Info" size={14} className="text-[#0078d4] flex-shrink-0"/>
          <span className="text-[11px] text-gray-300 flex-1">Настройте параметры графики компьютера для повышения производительности.</span>
          <button className="text-[11px] text-white px-3 py-0.5 rounded transition-colors flex-shrink-0" style={{background:"#0078d4"}}>Настроить</button>
          <button onClick={()=>setShowGraphicsBanner(false)} className="text-gray-400 hover:text-white ml-1 text-sm flex-shrink-0">✕</button>
        </div>
      )}
      {/* Основной контент */}
      <div className="flex flex-1 overflow-hidden">
        {/* Левая панель */}
        <div className="bg-[#252535] border-r border-gray-700 flex flex-col flex-shrink-0" style={{width:220}}>
          <div className="px-6 py-6 border-b border-gray-700">
            <div className="text-white text-[22px] font-bold mb-4">Civil 3D 2027</div>

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
            {([["recent","Последние"],["autodesk","Проекты Autodesk"],["learning","Обучение и аналитика"]] as const).map(([id,label])=>(
              <button key={id} onClick={()=>setTab(id)}
                className={`w-full text-left px-6 py-2 text-[12px] transition-colors ${tab===id?"bg-[#0078d4]/20 text-white border-l-2 border-[#0078d4]":"text-gray-400 hover:text-white hover:bg-[#2d2d4e]"}`}>
                {label}
              </button>
            ))}
          </nav>

          <div className="px-4 py-4 border-t border-gray-700 space-y-1.5">
            {([
              ["Новые возможности","ExternalLink","https://help.autodesk.com/view/CIV3D/2027/"],
              ["Онлайн-справка","HelpCircle","https://help.autodesk.com/view/CIV3D/2027/RUS/"],
              ["Форум сообщества","Users","https://forums.autodesk.com/t5/civil-3d/ct-p/civil3d"],
              ["Служба поддержки клиентов","Headphones","https://www.autodesk.com/support/contact-support"],
            ] as const).map(([label,icon,url])=>(
              <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-[11px] text-[#0078d4] hover:underline w-full text-left">
                <Icon name={icon} size={11} fallback="Link"/>
                {label}
              </a>
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
            <div>
              <h2 className="text-white text-[20px] font-semibold mb-4">Обучение и аналитика</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  {icon:"Play",title:"Быстрый старт Civil 3D 2027",tag:"Видео · 15 мин",color:"#0078d4",url:"https://www.autodesk.com/products/civil-3d/get-started"},
                  {icon:"BookOpen",title:"Работа с ЦМР и поверхностями",tag:"Урок · 30 мин",color:"#059669",url:"https://help.autodesk.com/view/CIV3D/2027/RUS/?guid=GUID-surface"},
                  {icon:"Route",title:"Трассирование и коридоры",tag:"Урок · 45 мин",color:"#d97706",url:"https://help.autodesk.com/view/CIV3D/2027/RUS/?guid=GUID-alignment"},
                  {icon:"TrendingUp",title:"Анализ горизонтальной регрессии",tag:"Новое · 20 мин",color:"#7c3aed",url:"https://help.autodesk.com/view/CIV3D/2027/RUS/?guid=GUID-hra"},
                  {icon:"Spline",title:"Характерные линии выхода на рельеф",tag:"Новое · 25 мин",color:"#ec4899",url:"https://help.autodesk.com/view/CIV3D/2027/RUS/?guid=GUID-featureline"},
                  {icon:"Gauge",title:"Напорные трубопроводные сети",tag:"Урок · 35 мин",color:"#0284c7",url:"https://help.autodesk.com/view/CIV3D/2027/RUS/?guid=GUID-pipenetwork"},
                ].map((c,i)=>(
                  <a key={i} href={c.url} target="_blank" rel="noopener noreferrer"
                    className="p-4 rounded-lg border border-gray-700 hover:border-[#0078d4] hover:bg-[#1e2a3a] cursor-pointer transition-all block group">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{background:c.color+"20"}}>
                      <Icon name={c.icon} size={16} style={{color:c.color}} fallback="Play"/>
                    </div>
                    <div className="text-[11px] text-white font-semibold mb-2 group-hover:text-[#60b0ff] transition-colors">{c.title}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] px-2 py-0.5 rounded-full" style={{background:c.color+"20",color:c.color}}>{c.tag}</span>
                      <Icon name="ExternalLink" size={10} className="text-gray-600 group-hover:text-[#0078d4] transition-colors"/>
                    </div>
                  </a>
                ))}
              </div>
            </div>
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
              <h3 className="text-gray-800 text-[16px] font-bold mb-2">Приветствие</h3>
              <p className="text-gray-600 text-[12px] mb-2">Не могли бы вы рассказать немного о себе?</p>
              <p className="text-gray-500 text-[11px] mb-5">Ответьте на два простых вопроса, чтобы мы могли лучше понять, как вы используете Civil 3D.</p>
              <button onClick={()=>setShowWelcomeDialog(false)} className="w-full py-2 rounded text-white text-[12px] font-medium mb-3" style={{background:"#0078d4"}}>Начать</button>
              <button onClick={()=>setShowWelcomeDialog(false)} className="text-[11px] text-[#0078d4] hover:underline mb-1">Больше не показывать это сообщение</button>
              <button onClick={()=>setShowWelcomeDialog(false)} className="text-[11px] text-[#0078d4] hover:underline">Что происходит при создании профиля пользователя?</button>
            </div>
          </div>
        </div>
      )}
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
    { label: "Grading", items: [
      { label: "Grading...", icon: "Layers2", size: "lg" },
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
      { label: "Autodesk Docs", icon: "Cloud", size: "lg" },
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

// ─── Surface Dialog ──────────────────────────────────────────────────────────

function SurfaceDialog({ onClose, onOK }: { onClose: () => void; onOK: (d: SurfaceDef) => void }) {
  const SURF_STYLES = ["Стандарт", "Горизонтали 1м", "Горизонтали 5м", "Без отображения", "Анализ уклонов"]
  const [def, setDef] = useState<SurfaceDef>({
    name: "Существующая поверхность", description: "", type: "TIN",
    style: "Горизонтали 1м", layer: "C-TOPO-SURF", gridX: "10", gridY: "10",
    pointFiles: [{ name: "Точки_съёмки.csv", format: "CSV (N,E,Z,Desc)" }],
  })
  const [tab, setTab] = useState<"info" | "build" | "analysis">("info")
  const [addFile, setAddFile] = useState("")
  const [addFormat, setAddFormat] = useState("CSV (N,E,Z,Desc)")
  const FORMATS = ["CSV (N,E,Z,Desc)", "TXT (X,Y,Z)", "LandXML", "DEM/GeoTIFF", "Облако точек RCP"]

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
          {(["info","build","analysis"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-xs font-semibold border-r border-gray-300 transition-colors ${tab===t?"bg-white text-blue-700":"text-gray-600 hover:bg-gray-100"}`}>
              {t==="info"?"Информация":t==="build"?"Построение":"Анализ"}
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
          <button className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">Справка</button>
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
  const [tab, setTab] = useState<"info"|"geom"|"station">("info")
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
          {(["info","geom","station"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`px-4 py-1.5 text-xs font-semibold border-r border-gray-300 transition-colors ${tab===t?"bg-white text-blue-700":"text-gray-600 hover:bg-gray-100"}`}>
              {t==="info"?"Информация":t==="geom"?"Геометрия элементов":"Пикетаж"}
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
  const [tab, setTab] = useState<"info"|"pvc"|"preview">("info")
  const [newSt, setNewSt] = useState(""); const [newEl, setNewEl] = useState(""); const [newK, setNewK] = useState("—")

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
          {(["info","pvc","preview"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`px-4 py-1.5 text-xs font-semibold border-r border-gray-300 transition-colors ${tab===t?"bg-white text-blue-700":"text-gray-600 hover:bg-gray-100"}`}>
              {t==="info"?"Информация":t==="pvc"?"Точки ВК":"Предпросмотр"}
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
          <span className="text-white font-bold text-sm">Создать типовое сечение (Assembly)</span>
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
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
        className="bg-[#f0f0f0] border border-gray-400 shadow-2xl w-[540px] max-h-[90vh] overflow-y-auto"
        style={{ fontFamily: "Arial, sans-serif", fontSize: 12 }}
      >
        {/* title */}
        <div className="flex items-center justify-between bg-[#0078d4] px-3 py-1.5">
          <span className="text-white font-bold text-sm">Создать коридор</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 w-5 h-5 flex items-center justify-center text-xs">✕</button>
        </div>

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
function ImportDialog({ onClose, onOK }: { onClose: () => void; onOK: (d:{format:string;file:string}) => void }) {
  const [format, setFormat] = useState("LandXML")
  const [file, setFile] = useState("survey_data.xml")
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#2d2d3d] border border-gray-600 rounded shadow-2xl w-[400px]">
        <div className="bg-[#1a1a2e] px-3 py-1.5 flex items-center justify-between border-b border-gray-700">
          <span className="text-[11px] font-bold text-white">Импорт данных</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xs">✕</button>
        </div>
        <div className="p-4 flex flex-col gap-3 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-32">Формат файла:</span>
            <select value={format} onChange={e=>setFormat(e.target.value)} className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded">
              {["LandXML","IFC","Shapefile","DEM/GeoTIFF","CSV точек","DWG","DXF"].map(f=><option key={f}>{f}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-32">Файл:</span>
            <div className="flex-1 flex gap-1">
              <input value={file} onChange={e=>setFile(e.target.value)} className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded outline-none focus:border-[#0078d4]"/>
              <button className="px-2 bg-[#3a3a4e] text-gray-300 hover:bg-[#4a4a5e] rounded text-[10px]">⋯</button>
            </div>
          </div>
          <div className="bg-[#1e1e2e] rounded border border-gray-700 p-2 text-gray-500">
            <div className="text-[10px]">Поддерживаемые версии: LandXML 1.0, 1.1, 2.0</div>
            <div className="text-[10px] mt-0.5">Система координат: МСК-70 (EPSG:20870)</div>
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <button onClick={onClose} className="px-3 py-1 bg-[#3a3a4e] text-gray-300 hover:bg-[#4a4a5e] rounded">Отмена</button>
            <button onClick={()=>onOK({format,file})} className="px-3 py-1 bg-[#0078d4] text-white hover:bg-[#0066b3] rounded">Импорт</button>
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

  const doExport = () => {
    if (format === "DXF") {
      const dxf = generateDXF(canvasObjects)
      const blob = new Blob([dxf], { type: "application/dxf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a"); a.href = url; a.download = "drawing.dxf"; a.click()
      URL.revokeObjectURL(url)
    } else if (format === "GeoJSON") {
      const features = canvasObjects.map(obj => ({
        type: "Feature",
        geometry: obj.type === "point"
          ? { type: "Point", coordinates: [obj.pts[0][0], obj.pts[0][1]] }
          : { type: "LineString", coordinates: obj.pts.map(([x,y])=>[x,y]) },
        properties: { id: obj.id, label: obj.label, layer: obj.layer, ...obj.properties }
      }))
      const gj = JSON.stringify({ type: "FeatureCollection", features }, null, 2)
      const blob = new Blob([gj], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a"); a.href = url; a.download = "drawing.geojson"; a.click()
      URL.revokeObjectURL(url)
    } else if (format === "CSV точек") {
      const pts = canvasObjects.filter(o=>o.type==="point")
      const csv = ["ID,Имя,X,Y,Z", ...pts.map(p=>`${p.id},${p.label},${p.pts[0][0].toFixed(3)},${p.pts[0][1].toFixed(3)},0.000`)].join("\n")
      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a"); a.href = url; a.download = "points.csv"; a.click()
      URL.revokeObjectURL(url)
    }
    onOK({ format })
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#2d2d3d] border border-gray-600 rounded shadow-2xl w-[380px]">
        <div className="bg-[#1a1a2e] px-3 py-1.5 flex items-center justify-between border-b border-gray-700">
          <span className="text-[11px] font-bold text-white">{mode==="print"?"Печать":"Экспорт"}</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xs">✕</button>
        </div>
        <div className="p-4 flex flex-col gap-3 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-28">{mode==="print"?"Принтер:":"Формат:"}</span>
            <select value={format} onChange={e=>setFormat(e.target.value)} className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded">
              {mode==="print"
                ? ["PDF","DWF","PNG (300 DPI)","SVG"].map(f=><option key={f}>{f}</option>)
                : ["DXF","GeoJSON","CSV точек","LandXML","IFC","DWG","Shapefile","PDF"].map(f=><option key={f}>{f}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-28">Область:</span>
            <select value={scope} onChange={e=>setScope(e.target.value)} className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded">
              {["Активный лист","Все листы","Модель","Рамка видового экрана"].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-28">Масштаб:</span>
            <select className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded">
              {["1:500","1:1000","1:200","1:2000","По листу"].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          {(format==="DXF"||format==="GeoJSON"||format==="CSV точек") && (
            <div className="bg-[#1e3a1e] border border-green-700 rounded px-3 py-2 text-green-400 text-[10px]">
              ✓ Реальный экспорт файла — скачается на ваш компьютер ({canvasObjects.length} объектов)
            </div>
          )}
          <div className="flex justify-end gap-2 mt-1">
            <button onClick={onClose} className="px-3 py-1 bg-[#3a3a4e] text-gray-300 hover:bg-[#4a4a5e] rounded">Отмена</button>
            <button onClick={doExport} className="px-3 py-1 bg-[#0078d4] text-white hover:bg-[#0066b3] rounded">{mode==="print"?"Печать":"Экспорт"}</button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Volume Analysis Dialog ───────────────────────────────────────────────────
function VolumeDialog({ onClose, onOK }: { onClose: () => void; onOK: () => void }) {
  const [existing] = useState("Существующая поверхность")
  const [designed] = useState("Проектная поверхность")
  const results = [{zone:"Насыпь",vol:"12 450.3 м³",area:"8 230 м²",avg:"1.51 м"},{zone:"Выемка",vol:"9 870.1 м³",area:"7 140 м²",avg:"1.38 м"},{zone:"Баланс",vol:"+2 580.2 м³",area:"—",avg:"—"}]
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#2d2d3d] border border-gray-600 rounded shadow-2xl w-[500px]">
        <div className="bg-[#1a1a2e] px-3 py-1.5 flex items-center justify-between border-b border-gray-700">
          <span className="text-[11px] font-bold text-white">Объёмы земляных работ</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xs">✕</button>
        </div>
        <div className="p-4 flex flex-col gap-3 text-[11px]">
          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-gray-400">Поверхность 1 (факт):</span><div className="text-gray-200 mt-0.5">{existing}</div></div>
            <div><span className="text-gray-400">Поверхность 2 (проект):</span><div className="text-gray-200 mt-0.5">{designed}</div></div>
          </div>
          <table className="w-full border-collapse">
            <thead><tr className="bg-[#1e1e2e]">
              {["Зона","Объём","Площадь","Средняя глубина"].map(h=><th key={h} className="text-left px-2 py-1 text-gray-400 border border-gray-700">{h}</th>)}
            </tr></thead>
            <tbody>{results.map((r,i)=>(
              <tr key={i} className={i===2?"bg-[#1e2e1e]":""}>
                <td className="px-2 py-1 border border-gray-700 text-gray-300">{r.zone}</td>
                <td className={`px-2 py-1 border border-gray-700 font-mono ${i===2?r.vol.startsWith("+")?"text-green-400":"text-red-400":"text-gray-200"}`}>{r.vol}</td>
                <td className="px-2 py-1 border border-gray-700 text-gray-400">{r.area}</td>
                <td className="px-2 py-1 border border-gray-700 text-gray-400">{r.avg}</td>
              </tr>
            ))}</tbody>
          </table>
          <div className="flex justify-end gap-2 mt-1">
            <button onClick={onClose} className="px-3 py-1 bg-[#3a3a4e] text-gray-300 hover:bg-[#4a4a5e] rounded">Закрыть</button>
            <button onClick={()=>onOK()} className="px-3 py-1 bg-[#0078d4] text-white hover:bg-[#0066b3] rounded">Экспорт в CSV</button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Drawing Settings Dialog ──────────────────────────────────────────────────
function DrawingSettingsDialog({ onClose }: { onClose: () => void }) {
  const [units, setUnits] = useState("Метры")
  const [precision, setPrecision] = useState("0.001")
  const [crs, setCrs] = useState("МСК-70 / МСК-70 zone 1")
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#2d2d3d] border border-gray-600 rounded shadow-2xl w-[420px]">
        <div className="bg-[#1a1a2e] px-3 py-1.5 flex items-center justify-between border-b border-gray-700">
          <span className="text-[11px] font-bold text-white">Параметры чертежа</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xs">✕</button>
        </div>
        <div className="p-4 flex flex-col gap-3 text-[11px]">
          {([["Единицы измерения:",units,setUnits,["Метры","Километры","Футы"]],
            ["Точность:",precision,setPrecision,["0.1","0.01","0.001","0.0001"]],
            ["Система координат:",crs,setCrs,["МСК-70 / МСК-70 zone 1","WGS 84 / UTM zone 37N","Пользовательская"]]
          ] as [string, string, (v:string)=>void, string[]][]).map(([lbl,val,setter,opts])=>(
            <div key={lbl} className="flex items-center gap-2">
              <span className="text-gray-400 w-44">{lbl}</span>
              <select value={val} onChange={e=>setter(e.target.value)} className="flex-1 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded">
                {opts.map((o:string)=><option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-44">Угол севера, °:</span>
            <input defaultValue="0.000" className="w-24 bg-[#1e1e2e] border border-gray-600 text-gray-200 px-2 py-1 rounded outline-none focus:border-[#0078d4] font-mono"/>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={onClose} className="px-3 py-1 bg-[#3a3a4e] text-gray-300 hover:bg-[#4a4a5e] rounded">Отмена</button>
            <button onClick={onClose} className="px-3 py-1 bg-[#0078d4] text-white hover:bg-[#0066b3] rounded">ОК</button>
          </div>
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

// ─── Superelevation Dialog ───────────────────────────────────────────────────
function SuperelevationDialog({ onClose }: { onClose: () => void }) {
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
      <div className="bg-[#f0f0f0] border border-gray-400 shadow-2xl flex flex-col" style={{ fontFamily: "Arial, sans-serif", fontSize: 12, width: 560, maxHeight: "85vh" }}>
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
          <button onClick={onClose} className="px-4 py-1 bg-[#0078d4] text-white text-xs hover:bg-[#0066b3]">Применить</button>
          <button onClick={onClose} className="px-4 py-1 bg-[#e0e0e0] border border-gray-400 text-xs hover:bg-gray-300">Закрыть</button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── EarthworksDialog ────────────────────────────────────────────────────────

function EarthworksDialog({ onClose, onOK }: { onClose: () => void; onOK: (d: {name:string;cut:string;fill:string;balance:string}) => void }) {
  const [name, setName] = useState("Земляные работы ШД-38")
  const [corridor, setCorridor] = useState("Дорога и парковочная зона")
  const [method, setMethod] = useState("Объёмы по сечениям")
  const [interval, setInterval] = useState("20")
  const [rows] = useState([
    { pk: "0+000", cut: "1245.3", fill: "0.0",    net: "+1245.3", cumCut: "1245.3",  cumFill: "0.0"    },
    { pk: "0+020", cut: "2103.7", fill: "15.2",   net: "+2088.5", cumCut: "3349.0",  cumFill: "15.2"   },
    { pk: "0+040", cut: "1876.4", fill: "124.8",  net: "+1751.6", cumCut: "5225.4",  cumFill: "140.0"  },
    { pk: "0+060", cut: "932.1",  fill: "478.3",  net: "+453.8",  cumCut: "6157.5",  cumFill: "618.3"  },
    { pk: "0+080", cut: "0.0",    fill: "1024.6", net: "-1024.6", cumCut: "6157.5",  cumFill: "1642.9" },
    { pk: "0+100", cut: "0.0",    fill: "2187.4", net: "-2187.4", cumCut: "6157.5",  cumFill: "3830.3" },
    { pk: "0+120", cut: "456.2",  fill: "1543.1", net: "-1086.9", cumCut: "6613.7",  cumFill: "5373.4" },
    { pk: "0+140", cut: "1234.5", fill: "678.9",  net: "+555.6",  cumCut: "7848.2",  cumFill: "6052.3" },
    { pk: "0+160", cut: "2456.8", fill: "102.3",  net: "+2354.5", cumCut: "10305.0", cumFill: "6154.6" },
    { pk: "0+180", cut: "3102.4", fill: "0.0",    net: "+3102.4", cumCut: "13407.4", cumFill: "6154.6" },
  ])
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="absolute inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}>
      <motion.div initial={{scale:0.93,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.93,opacity:0}}
        className="bg-[#1e1e2e] border border-gray-600 rounded-lg shadow-2xl flex flex-col"
        style={{width:720,maxHeight:"85vh"}} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700 bg-[#252535]">
          <span className="text-white text-[13px] font-bold flex items-center gap-2">
            <Icon name="BarChart3" size={14} className="text-yellow-400"/> Ведомость земляных работ
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg leading-none">✕</button>
        </div>
        <div className="flex gap-3 p-3 border-b border-gray-700 flex-shrink-0">
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-gray-400 w-28">Наименование</label>
              <input value={name} onChange={e=>setName(e.target.value)} className="flex-1 bg-[#252535] border border-gray-600 text-white text-[11px] px-2 py-1 rounded outline-none focus:border-[#0078d4]"/>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-gray-400 w-28">Коридор</label>
              <select value={corridor} onChange={e=>setCorridor(e.target.value)} className="flex-1 bg-[#252535] border border-gray-600 text-white text-[11px] px-2 py-1 rounded outline-none">
                <option>Дорога и парковочная зона</option>
                <option>Ул. Трумана</option>
              </select>
            </div>
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-gray-400 w-24">Метод</label>
              <select value={method} onChange={e=>setMethod(e.target.value)} className="flex-1 bg-[#252535] border border-gray-600 text-white text-[11px] px-2 py-1 rounded outline-none">
                <option>Объёмы по сечениям</option>
                <option>Метод призматоида</option>
                <option>Средних площадей</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-gray-400 w-24">Шаг, м</label>
              <input value={interval} onChange={e=>setInterval(e.target.value)} className="w-20 bg-[#252535] border border-gray-600 text-white text-[11px] px-2 py-1 rounded outline-none"/>
            </div>
          </div>
          <div className="flex flex-col gap-1 justify-center">
            <div className="text-[10px] text-gray-400">Итого выемка:</div>
            <div className="text-[13px] text-yellow-400 font-bold">13 407.4 м³</div>
            <div className="text-[10px] text-gray-400">Итого насыпь:</div>
            <div className="text-[13px] text-green-400 font-bold">6 154.6 м³</div>
            <div className="text-[10px] text-gray-400">Баланс:</div>
            <div className="text-[13px] text-blue-400 font-bold">+7 252.8 м³</div>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead className="sticky top-0 bg-[#252535]">
              <tr>
                {["Пикет","Выемка, м³","Насыпь, м³","Нетто, м³","Накоп. выемка","Накоп. насыпь"].map(h=>(
                  <th key={h} className="text-left text-gray-400 px-2 py-1.5 border-b border-gray-700 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r,i)=>(
                <tr key={i} className={`border-b border-gray-800 hover:bg-[#252535] ${parseFloat(r.net)<0?"bg-green-900/10":"bg-yellow-900/10"}`}>
                  <td className="px-2 py-1 text-white font-mono">{r.pk}</td>
                  <td className="px-2 py-1 text-yellow-400">{r.cut}</td>
                  <td className="px-2 py-1 text-green-400">{r.fill}</td>
                  <td className={`px-2 py-1 font-mono ${parseFloat(r.net)>=0?"text-yellow-300":"text-green-300"}`}>{r.net}</td>
                  <td className="px-2 py-1 text-gray-300 font-mono">{r.cumCut}</td>
                  <td className="px-2 py-1 text-gray-300 font-mono">{r.cumFill}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-700 bg-[#1a1a2a]">
          <div className="flex gap-2">
            <button onClick={()=>onOK({name,cut:"13407.4",fill:"6154.6",balance:"+7252.8"})} className="text-[11px] text-white px-3 py-1 rounded transition-colors" style={{background:"#0078d4"}}>Экспорт CSV</button>
            <button className="text-[11px] text-gray-300 hover:text-white px-3 py-1 rounded border border-gray-600 transition-colors">Построить диаграмму</button>
          </div>
          <button onClick={onClose} className="text-[11px] text-gray-400 hover:text-white px-3 py-1">Закрыть</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── ProjectManagerDialog ─────────────────────────────────────────────────────

function ProjectManagerDialog({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"files"|"versions"|"team">("files")
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
        className="bg-[#1e1e2e] border border-gray-600 rounded-lg shadow-2xl flex flex-col"
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
          <button className="text-[11px] text-white px-3 py-1 rounded" style={{background:"#0078d4"}}>Добавить файл</button>
          <button onClick={onClose} className="text-[11px] text-gray-400 hover:text-white px-3 py-1">Закрыть</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── SurveyTraverseDialog ─────────────────────────────────────────────────────

function SurveyTraverseDialog({ onClose }: { onClose: () => void }) {
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
        className="bg-[#1e1e2e] border border-gray-600 rounded-lg shadow-2xl flex flex-col"
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
            <button className="text-[11px] text-white px-3 py-1 rounded" style={{background:"#0078d4"}}>Экспорт</button>
            <button className="text-[11px] text-gray-300 px-3 py-1 rounded border border-gray-600">Уравнять</button>
          </div>
          <button onClick={onClose} className="text-[11px] text-gray-400 hover:text-white px-3 py-1">Закрыть</button>
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
  const [showDraw2D, setShowDraw2D] = useState(false)
  const [showAnnotation, setShowAnnotation] = useState(false)
  const [showHydrology, setShowHydrology] = useState(false)
  const [showInsights, setShowInsights] = useState(false)
  const [showScriptEditor, setShowScriptEditor] = useState(false)
  const [scriptType, setScriptType] = useState<"autolisp" | "dynamo">("autolisp")
  const [scriptCode, setScriptCode] = useState(`; AutoLISP скрипт\n; Создать коридор по трассе\n(defun c:AUTOKORIDOR ()\n  (setq al (car (entsel "Выберите трассу: ")))\n  (command "КОРИДОР" al)\n  (princ "\\nКоридор создан!")\n  (princ)\n)`)
  const [scriptOutput, setScriptOutput] = useState<string[]>([])
  const runScript = () => {
    const t = new Date().toLocaleTimeString("ru")
    setScriptOutput([
      `[${t}] Запуск скрипта...`,
      `[${t}] Тип: ${scriptType === "autolisp" ? "AutoLISP" : "Dynamo"}`,
      `[${t}] Компиляция: OK`,
      `[${t}] Выполнение: успешно`,
      `[${t}] Готово. Объектов создано: 1`,
    ])
    showToast(`Скрипт выполнен успешно`)
  }
  const [draw2DObjects, setDraw2DObjects] = useState<{type:string;name:string;id:string}[]>([])
  const [activeProjectObjects, setActiveProjectObjects] = useState<{object_type:string;name:string;data:Record<string,unknown>}[]>([])
  const [viewDimension, setViewDimension] = useState<"3D"|"2D">("3D")
  const [undoStack, setUndoStack] = useState<string[]>(["Начальное состояние"])
  const [redoStack, setRedoStack] = useState<string[]>([])

  // ── Split viewport state ─────────────────────────────────────────────────
  const [splitView, setSplitView] = useState(true)
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
  const [toolspaceTab, setToolspaceTab] = useState<"dispatcher"|"params">("dispatcher")

  // ── Start screen state ───────────────────────────────────────────────────
  const [showStartScreen, setShowStartScreen] = useState(true)
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(true)
  const [showGraphicsBanner, setShowGraphicsBanner] = useState(true)
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
    {role:"bot", text:"Привет! Я ЛАПА-Ассистент. Спросите о Civil 3D 2027 — создании трасс, коридоров, поверхностей, HRA, характерных линиях выхода на рельеф. Готов помочь!"}
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
    else if (t.includes("dynamo")) reply = "Dynamo for Civil 3D 2027 (Core 4.0.2): откройте «Надстройки» → «Редактор скриптов» → вкладка Dynamo. PythonNet3 — механизм по умолчанию."
    else if (t.includes("невязк") || t.includes("теодолит")) reply = "Отчёт о невязке: лента «Съёмка» → «Отчёт о невязке» или команда НЕВЯЗКА."
    else if (t.includes("горизонтальн") || t.includes("регресс") || t.includes("hra")) reply = "Анализ горизонтальной регрессии (HRA, 2026.1+): вписывает проектную трассу в съёмку. Лента «Анализ» → «Трасса» → «Горизонтальная регрессия»."
    else if (t.includes("характерн") || t.includes("выход на рельеф")) reply = "Характерная линия выхода на рельеф (Civil 3D 2027): автоматизирует профилирование склонов. Лента «Главная» → «Хар. линия» → «Выход на рельеф»."
    else if (t.includes("дренаж") || t.includes("infodrainage")) reply = "Инструменты дренажа Autodesk 2027: интеграция с InfoDrainage. Лента «Анализ» → «Гидравлика» → «Дренаж InfoDrainage»."
    else if (t.includes("мост")) reply = "Мосты: дерево объектов → «Мосты» → ПКМ → «Создать мост». Требуется трасса и профиль."
    else if (t.includes("каталог труб") || t.includes("forma")) reply = "Каталог труб/напорных труб теперь интегрирован с Forma Data Management. Лента «Вставка» → «Диспетчер источников данных»."
    else if (t.includes(".net") || t.includes("net 10")) reply = "Civil 3D 2027 поддерживает .NET 10. Старые плагины .NET Framework нужно перекомпилировать под .NET 10."
    setTimeout(() => setAssistantMessages(prev => [...prev, { role: "bot", text: reply }]), 450)
  }

  // ── Edit state ───────────────────────────────────────────────────────────
  const [activeTool, setActiveTool] = useState<EditTool>("select")
  const [canvasObjects, setCanvasObjects] = useState<CanvasObject[]>(INITIAL_CANVAS_OBJECTS)
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

  const saveObject = (type: string, name: string, data: Record<string, unknown> = {}) => {
    pushUndo(`Создан ${type}: ${name}`)
    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: 1, object_type: type, name, data }),
    }).catch(() => {})
  }

  const saveCanvasObject = (obj: CanvasObject) => {
    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: 1,
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

  // ── Delete selected ────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedObjId && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        const obj = canvasObjects.find(o => o.id === selectedObjId)
        if (obj) { pushUndo(`Удалено: ${obj.label}`); setCanvasObjects(prev => prev.filter(o => o.id !== selectedObjId)); deleteCanvasObject(selectedObjId); setSelectedObjId(null); showToast(`Удалён объект: ${obj.label}`) }
      }
      if (e.key === "Escape") { setDrawingPts([]); setActiveTool("select"); setSelectedObjId(null) }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
   
  }, [selectedObjId, canvasObjects])

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
      } else {
        setSelectedObjId(null)
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
    else if (c === "INSIGHTS" || c === "ПОДСКАЗКИ") setShowInsights(prev=>!prev)
    else if (c === "ЗЕМЛЯ" || c === "EARTHWORKS" || c === "ВЗР") { setShowEarthworks(true); setStatusMsg("Ведомость земляных работ"); setCommandLine(""); return }
    else if (c === "НЕВЯЗКА" || c === "TRAVERSE" || c === "ТХ") { setShowSurveyTraverse(true); setStatusMsg("Отчёт о невязке"); setCommandLine(""); return }
    else if (c === "ПРОЕКТ" || c === "PROJECT" || c === "ДП") { setShowProjectManager(true); setStatusMsg("Диспетчер проекта"); setCommandLine(""); return }
    else { setStatusMsg(`Неизвестная команда: ${cmd}. Введите ? для справки`); setCommandLine(""); return }
    setStatusMsg(`Команда: ${cmd}`)
    setCommandLine("")
  }

  const toggleLayer = (key: keyof typeof visLayers) => setVisLayers(v => ({ ...v, [key]: !v[key] }))

  const openDialog = (key: string) => {
    setOpenDropdown(null)
    const k = key.toLowerCase()
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
    // Пересечения
    else if (k.includes("пересечен")) { setShowIntersection(true) }
    // Характерные линии
    else if (k.includes("хар. лин") || k.includes("характерн")) { setShowFeatureLine(true) }
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
    // Черчение
    else if (["полилиния","отрезок","дуга","окружность","прямоугольник","текст","штриховка"].some(w=>k.includes(w))) {
      showToast(`Черчение: ${key} — укажите первую точку`)
    }
    // 2D Геометрия
    else if (k.includes("линия") && !k.includes("характерн") && !k.includes("харлиния") && !k.includes("хар.")) { setShowDraw2D(true) }
    else if (k.includes("полилин") || k.includes("дуга") || k.includes("круг") || k.includes("черч") || k.includes("2d геометр")) { setShowDraw2D(true) }
    // Аннотации
    else if (k.includes("аннотац") || k.includes("размер") || k.includes("выноск") || k.includes("таблиц")) { setShowAnnotation(true) }
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
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 bg-[#0078d4] flex items-center justify-center text-white font-bold text-[10px] rounded-sm">C</div>
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
        <div className="flex-1 text-center text-[11px] text-gray-400 font-semibold tracking-wide select-none">
          ЛАПА {viewDimension} 2026 — {activeDrawingTab}
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <input placeholder="Введите ключевое слово или фразу" className="bg-[#2a2a3a] border border-gray-600 text-[10px] text-gray-400 px-2 py-0.5 w-44 rounded-sm placeholder-gray-600 outline-none focus:border-blue-500" />
          <button onClick={()=>setShowAssistant(p=>!p)} title="ЛАПА-Ассистент AI"
            className={`ml-1 flex items-center gap-1 text-[10px] px-2 py-0.5 rounded transition-colors ${showAssistant?"bg-[#0078d4] text-white":"text-gray-400 hover:text-white hover:bg-[#0078d4]/40"}`}>
            <Icon name="Bot" size={11} fallback="HelpCircle"/>
            <span>Ассистент</span>
          </button>
          <span className="text-[10px] text-gray-500 ml-1">пользователь</span>
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
        </div>

        {/* ── Left: Toolspace / Tree ── */}
        <div className="bg-[#1e1e2e] border-r border-gray-600 flex flex-col overflow-hidden flex-shrink-0" style={{ width: 160 }}>
          {/* TOOL SPACE header */}
          <div className="bg-[#252535] px-2 py-1 flex items-center justify-between border-b border-gray-600">
            <span className="text-[10px] text-gray-300 font-bold tracking-widest uppercase">TOOL SPACE</span>
            <div className="flex gap-0.5">
              {[
                { icon: "ClipboardList", title: "Проспект" },
                { icon: "Search",        title: "Поиск" },
                { icon: "HelpCircle",    title: "Справка" },
              ].map(({ icon, title }) => (
                <button key={icon} title={title}
                  onClick={() => setStatusMsg(`Toolspace: ${title}`)}
                  className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#0078d4] rounded transition-colors">
                  <Icon name={icon} size={11} fallback="Square" />
                </button>
              ))}
              <button title="Открыть проект" onClick={openProjectDialog}
                className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#0078d4] rounded transition-colors">
                <Icon name="FolderOpen" size={11} fallback="Square" />
              </button>
              <button title="My Insights" onClick={()=>setShowInsights(p=>!p)}
                className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${showInsights?"bg-yellow-500/20 text-yellow-400":"text-gray-400 hover:text-white hover:bg-[#0078d4]"}`}>
                <Icon name="Sparkles" size={11} fallback="Star" />
              </button>
              <button title="Редактор скриптов" onClick={()=>setShowScriptEditor(s=>!s)}
                className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${showScriptEditor?"bg-purple-500/20 text-purple-400":"text-gray-400 hover:text-white hover:bg-[#0078d4]"}`}>
                <Icon name="Code" size={11} fallback="FileCode"/>
              </button>
            </div>
          </div>
          {/* Диспетчер / Параметры tabs */}
          <div className="flex border-b border-gray-600">
            {(["dispatcher","params"] as const).map((tab) => {
              const label = tab === "dispatcher" ? "Диспетчер" : "Параметры"
              return (
                <button key={tab}
                  className={`flex-1 text-[11px] py-1 border-r border-gray-600 last:border-0 transition-colors font-medium
                    ${toolspaceTab === tab ? "bg-[#1e1e2e] text-white border-b-2 border-b-[#0078d4]" : "bg-[#252535] text-gray-400 hover:text-white hover:bg-[#2d2d4e]"}`}
                  onClick={() => setToolspaceTab(tab)}>
                  {label}
                </button>
              )
            })}
          </div>
          {/* Active Drawing View */}
          <div className="bg-[#252535] px-2 py-1 flex items-center gap-1 border-b border-gray-600 cursor-pointer hover:bg-[#2e2e45]"
            onClick={() => setStatusMsg("Активный чертёж: Align-Superelevation-5")}>
            <span className="text-[11px] text-gray-300 flex-1 truncate">Вид активного чертёжа</span>
            <Icon name="ChevronDown" size={10} className="text-gray-500 flex-shrink-0" />
          </div>
          {/* Tree or Params panel */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#1e1e2e]">
            {toolspaceTab === "dispatcher" ? (
              treeData.map(node => (
                <TreeItem key={node.id} node={node} depth={0} selected={selectedNode}
                  onSelect={setSelectedNode} onToggle={toggleNode} onAction={handleTreeNodeAction} />
              ))
            ) : (
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
              <PipeNetDialog onClose={()=>setShowPipeNet(false)} onOK={d=>{
                setShowPipeNet(false)
                setStatusMsg(`Сеть «${d.name}» создана (${d.type})`)
                saveObject("pipe_network", d.name, { type: d.type, material: d.material })
                showToast(`💾 Сеть «${d.name}» сохранена`)
                setTreeData(prev=>{
                  const add=(nodes:TreeNode[]):TreeNode[]=>nodes.map(n=>n.id==="pipenet"?{...n,children:[...(n.children||[]),{id:`pipe_${Date.now()}`,label:d.name,icon:"Network",color:"#6366f1"}]}:{...n,children:n.children?add(n.children):undefined})
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
            {showVolume && <VolumeDialog onClose={()=>setShowVolume(false)} onOK={()=>{setShowVolume(false);showToast("Ведомость объёмов экспортирована в CSV")}}/>}
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
              <EarthworksDialog onClose={()=>setShowEarthworks(false)} onOK={d=>{
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
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-[#252535]">
              <span className="text-white text-[12px] font-bold flex items-center gap-1.5">
                <Icon name="Bot" size={13} className="text-[#0078d4]" fallback="HelpCircle"/> ЛАПА-Ассистент
              </span>
              <button onClick={()=>setShowAssistant(false)} className="text-gray-400 hover:text-white text-sm">✕</button>
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
                  placeholder="Задайте вопрос о Civil 3D…"
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
            { icon: "Mountain",      title: "Создать поверхность",    action: () => setShowSurface(true) },
            { icon: "Route",         title: "Создать трассу",         action: () => setShowAlignment(true) },
            { icon: "Navigation",    title: "Создать коридор",        action: () => setShowCorridor(true) },
            { icon: "Network",       title: "Создать трубопровод",    action: () => setShowPipeNet(true) },
            null,
            { icon: "FileBarChart2", title: "Диспетчер отчётов",      action: () => setShowProjectManager(true) },
            { icon: "GitBranch",     title: "Отчёт о невязке",        action: () => setShowSurveyTraverse(true) },
            { icon: "Bot",           title: "ЛАПА-Ассистент",         action: () => setShowAssistant(p => !p) },
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
        {showRightPanel && <CrossSectionPanel alignments={corridors} onClose={() => setShowRightPanel(false)} />}
        {showInsights && <InsightsPanel onClose={()=>setShowInsights(false)}/>}
        <AnimatePresence>
          {showScriptEditor && (
            <motion.div initial={{x:320,opacity:0}} animate={{x:0,opacity:1}} exit={{x:320,opacity:0}}
              className="absolute right-0 top-0 bottom-0 w-80 bg-[#1a1a2e] border-l border-gray-700 flex flex-col z-40">
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-[#252535]">
                <span className="text-white text-[12px] font-bold flex items-center gap-2">
                  <Icon name="Code" size={13} className="text-purple-400"/> Редактор скриптов
                </span>
                <button onClick={()=>setShowScriptEditor(false)} className="text-gray-400 hover:text-white text-sm">✕</button>
              </div>
              <div className="flex border-b border-gray-700">
                {([["autolisp","AutoLISP"],["dynamo","Dynamo"]] as const).map(([id,label])=>(
                  <button key={id} onClick={()=>{
                    setScriptType(id)
                    setScriptCode(id==="autolisp"
                      ? `; AutoLISP скрипт\n(defun c:AUTOKORIDOR ()\n  (command "КОРИДОР")\n  (princ)\n)`
                      : `// Dynamo скрипт\n// Создать характерные линии\nvar pts = Surface.Points(surf);\nvar fl = FeatureLine.ByPoints(pts);\nfl;`)
                  }}
                    className={`flex-1 text-[10px] py-1.5 transition-colors ${scriptType===id?"bg-[#1e1e2e] text-white border-b border-purple-400":"text-gray-500 hover:text-gray-300"}`}>
                    {label}
                  </button>
                ))}
              </div>
              <textarea value={scriptCode} onChange={e=>setScriptCode(e.target.value)}
                className="flex-1 bg-[#0d1117] text-green-400 font-mono text-[11px] p-3 outline-none resize-none border-b border-gray-700"
                spellCheck={false}/>
              <div className="p-2 space-y-2">
                <button onClick={runScript}
                  className="w-full flex items-center justify-center gap-2 py-1.5 rounded text-[11px] text-white transition-colors"
                  style={{background:"#7c3aed"}}>
                  <Icon name="Play" size={12}/> Запустить
                </button>
                {scriptOutput.length > 0 && (
                  <div className="bg-[#0d1117] rounded border border-gray-700 p-2 max-h-24 overflow-y-auto">
                    {scriptOutput.map((line,i)=>(
                      <div key={i} className={`text-[10px] font-mono ${line.includes("успешно")||line.includes("OK")?"text-green-400":line.includes("Ошибка")?"text-red-400":"text-gray-400"}`}>{line}</div>
                    ))}
                  </div>
                )}
              </div>
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
            placeholder="Команды: L=Линия, PL=Полилиния, O=Точка, M=Перенести, E=Удалить, ZE=Вписать, ЗЕМЛЯ, НЕВЯЗКА, ПРОЕКТ, ТРАССА, КОРИДОР, ПОВЕРХНОСТЬ…"
            className="flex-1 bg-transparent text-[11px] text-green-300 font-mono outline-none placeholder-gray-700 px-2"
          />
          <button onClick={() => runCommand(commandLine)} className="text-[10px] text-gray-500 hover:text-white px-2">↵</button>
        </div>
      </div>

      {/* ── Status bar (Civil 3D bottom bar) ── */}
      <div className="bg-[#1a1a2a] border-t border-gray-800 flex items-center px-1 gap-0 flex-shrink-0" style={{minHeight:22}}>
        {/* Layout tabs */}
        <div className="flex items-center gap-0 border-r border-gray-700 pr-1 mr-1">
          <button onClick={() => setStatusMsg("Align-Superelevation-5")}
            className="text-[9px] text-gray-400 hover:text-white px-0.5 py-0.5">☰</button>
          {[{key:"Model",label:"Модель"},{key:"Layout1",label:"Лист 1"},{key:"Layout2",label:"Лист 2"}].map(t => (
            <button key={t.key} onClick={() => { setActiveLayout(t.key); setStatusMsg(`Макет: ${t.label}`) }}
              className={`text-[9px] px-2 py-0.5 border-x border-gray-700 transition-colors ${activeLayout===t.key?"bg-[#2d2d4e] text-white":"text-gray-500 hover:text-white hover:bg-[#252535]"}`}>
              {t.label}
            </button>
          ))}
          <button onClick={() => setStatusMsg("Новый лист")}
            className="text-[9px] text-gray-500 hover:text-white px-1.5 py-0.5">+</button>
        </div>
        {/* Center status icons */}
        <div className="flex items-center gap-1 text-[9px] text-gray-500 flex-1">
          <span className={`font-bold px-1 ${activeLayout==="Model"?"text-white bg-[#0078d4]":"text-gray-400"}`}>
            {activeLayout==="Model"?"МОДЕЛЬ":"ЛИСТ"}
          </span>
          <button onClick={() => setScale(s=>s==="1:500"?"1:1000":s==="1:1000"?"1:200":"1:500")}
            className="hover:text-white px-1 border border-gray-700 text-[9px]">{scale}</button>
          {["⊞","∠","⚙"].map((ic,i)=>(
            <button key={i} className="hover:text-white px-0.5">{ic}</button>
          ))}
        </div>
        {/* Cursor coordinates right */}
        <div className="flex items-center gap-2 text-[9px] font-mono text-gray-500 border-l border-gray-700 pl-2">
          <span className="text-gray-400">{cursorCoords.x.toFixed(2)}, {cursorCoords.y.toFixed(2)}, 0.00</span>
          <span className="text-gray-600">МОДЕЛЬ</span>
        </div>
      </div>
    </div>
  )
}