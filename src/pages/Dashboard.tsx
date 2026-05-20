import { useEffect, useState, lazy, Suspense, Component, ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"

class ErrorBoundary extends Component<{ children: ReactNode }, { error: boolean; msg: string }> {
  state = { error: false, msg: "" }
  static getDerivedStateFromError(e: Error) { return { error: true, msg: e?.message || "" } }
  componentDidCatch(e: Error) { console.error("Module error:", e) }
  render() {
    if (this.state.error) return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-2xl bg-red-50 p-6 mb-4"><Icon name="AlertTriangle" size={40} className="text-red-400" /></div>
        <p className="font-semibold text-gray-800 mb-1">Не удалось загрузить модуль</p>
        {this.state.msg && <p className="text-xs font-mono text-red-400 mb-1">{this.state.msg}</p>}
        <p className="text-sm text-muted-foreground">Попробуйте обновить страницу</p>
        <button className="mt-4 text-sm text-indigo-600 hover:underline" onClick={() => this.setState({ error: false, msg: "" })}>Повторить</button>
      </div>
    )
    return this.props.children
  }
}

const Viewer3DModule = lazy(() => import("@/modules/Viewer3DModule"))
import GeodesyModule from "@/modules/GeodesyModule"
import RoadsModule from "@/modules/RoadsModule"
import NetworksModule from "@/modules/NetworksModule"
import AnalysisModule from "@/modules/AnalysisModule"
import RailwayModule from "@/modules/RailwayModule"
import AreasModule from "@/modules/AreasModule"
import BIMModule from "@/modules/BIMModule"
import DynamicModule from "@/modules/DynamicModule"
import CorridorModule from "@/modules/CorridorModule"
import SpecsModule from "@/modules/SpecsModule"
import AlignmentModule from "@/modules/AlignmentModule"
import ProjectsModule from "@/modules/ProjectsModule"
import SurfacesModule from "@/modules/SurfacesModule"
import IntegrationModule from "@/modules/IntegrationModule"
import StandardsModule from "@/modules/StandardsModule"
import CivilCADModule from "@/modules/CivilCADModule"
import DTMModule from "@/modules/DTMModule"


const MODULES = [
  { id: "civilcad", icon: "Monitor", label: "ЛАПА — Редактор", desc: "Полноценный редактор инфраструктурных проектов", component: CivilCADModule },
  { id: "viewer3d", icon: "Box", label: "3D-вьюер", desc: "Рельеф, дорога, сети, здания в 3D", component: Viewer3DModule },
  { id: "dtm", icon: "ScanLine", label: "ЦМР / Облако точек", desc: "LiDAR, GNSS, тахеометр, фотограмметрия", component: DTMModule },
  { id: "projects", icon: "FolderKanban", label: "Управление проектами", desc: "Проекты, версии, команда, отчёты", component: ProjectsModule },
  { id: "geodesy", icon: "Mountain", label: "Геодезия и рельеф", desc: "Точки, DTM, профиль, объёмы", component: GeodesyModule },
  { id: "alignment", icon: "Spline", label: "Профили и выравнивания", desc: "ВК, ГК, клотоиды, разбивка", component: AlignmentModule },
  { id: "corridor", icon: "RoadHorizon", label: "Коридоры и поперечники", desc: "Assembly, автопоперечники, объёмы", component: CorridorModule },
  { id: "roads", icon: "Route", label: "Дороги и трассы", desc: "Категории СП 34, профиль, сечение", component: RoadsModule },
  { id: "railway", icon: "Train", label: "Ж/д пути", desc: "Классы пути, тяговые расчёты", component: RailwayModule },
  { id: "networks", icon: "Network", label: "Инженерные сети", desc: "ВКС, теплосеть, гидравлика", component: NetworksModule },
  { id: "areas", icon: "LayoutDashboard", label: "Площадные объекты", desc: "Генплан, здания, ТЭП участка", component: AreasModule },
  { id: "bim", icon: "Layers", label: "BIM-инструменты", desc: "IFC-модель, коллизии, экспорт", component: BIMModule },
  { id: "analysis", icon: "BarChart3", label: "Анализ и расчёты", desc: "Объёмы, откосы, дренаж", component: AnalysisModule },
  { id: "specs", icon: "ClipboardList", label: "Ведомости и спецификации", desc: "Объёмы, смета, координаты, экспорт", component: SpecsModule },
  { id: "surfaces", icon: "Triangle", label: "Поверхности TIN / Grid", desc: "TIN, Grid, Corridor, горизонтали", component: SurfacesModule },
  { id: "integration", icon: "Puzzle", label: "Интеграция Autodesk", desc: "DWG, IFC, LandXML, Revit, InfraWorks", component: IntegrationModule },
  { id: "standards", icon: "BookCheck", label: "Стандарты проектирования", desc: "СП, ГОСТ, AASHTO, EN, ISO — 12 норм", component: StandardsModule },
  { id: "dynamic", icon: "RefreshCw", label: "Динамические модели", desc: "Граф зависимостей, автопересчёт", component: DynamicModule },
]

// ─── Данные последних файлов ─────────────────────────────────────────────────

const ПОСЛЕДНИЕ_ФАЙЛЫ = [
  { id: "civilcad", name: "Главная_парковка_Финал", ext: "dwg", date: "20 мая 2026 г. 14:32", size: "31 МБ", color: "#4f46e5", preview: "corridor" },
  { id: "surfaces", name: "ЦМР_Съёмка_2024", ext: "tin", date: "19 мая 2026 г. 18:10", size: "8 МБ", color: "#059669", preview: "tin" },
  { id: "alignment", name: "Трасса_ШД-38_v2", ext: "xml", date: "18 мая 2026 г. 11:45", size: "2 МБ", color: "#d97706", preview: "align" },
  { id: "corridor", name: "Коридор_дорога", ext: "dwg", date: "17 мая 2026 г. 09:20", size: "14 МБ", color: "#7c3aed", preview: "cross" },
  { id: "networks", name: "Ливневая_канализация", ext: "dwg", date: "16 мая 2026 г. 16:05", size: "5 МБ", color: "#0284c7", preview: "net" },
  { id: "geodesy", name: "Геодезия_изыскания", ext: "csv", date: "15 мая 2026 г. 10:30", size: "1 МБ", color: "#be185d", preview: "points" },
  { id: "bim", name: "BIM_Корпус_А", ext: "ifc", date: "14 мая 2026 г. 13:00", size: "22 МБ", color: "#7c3aed", preview: "bim" },
  { id: "roads", name: "Автодорога_М5_РД", ext: "dwg", date: "13 мая 2026 г. 08:15", size: "18 МБ", color: "#c2410c", preview: "road" },
]

const ШАБЛОНЫ = [
  { id: "civilcad", name: "Автодорога (СП 34)", icon: "Route", desc: "Трасса, профиль, коридор" },
  { id: "networks", name: "Инженерные сети", icon: "Network", desc: "ВКС, ливневая, теплосеть" },
  { id: "geodesy", name: "Геодезические изыскания", icon: "Mountain", desc: "Точки COGO, ЦМР, профиль" },
  { id: "areas", name: "Генплан участка", icon: "LayoutDashboard", desc: "Площадной объект, ТЭП" },
  { id: "railway", name: "Железная дорога", icon: "Train", desc: "Путь, CANT, профиль" },
  { id: "bim", name: "BIM-проект", icon: "Layers", desc: "IFC-модель, коллизии" },
]

// ─── Миниатюра файла ──────────────────────────────────────────────────────────

function ПревьюФайла({ тип, цвет }: { тип: string; цвет: string }) {
  const c = цвет
  return (
    <svg width="100%" height="100%" viewBox="0 0 120 80" style={{ background: "#111827" }}>
      {тип === "corridor" && <>
        <path d="M10,40 Q30,25 60,30 Q90,35 110,20" stroke={c} strokeWidth="2.5" fill="none" opacity="0.9" />
        <path d="M10,45 Q30,30 60,35 Q90,40 110,25" stroke={c} strokeWidth="1.5" fill="none" opacity="0.5" />
        <path d="M10,50 Q30,35 60,40 Q90,45 110,30" stroke={c} strokeWidth="1.5" fill="none" opacity="0.5" />
        {[20,40,60,80,100].map(x => <circle key={x} cx={x} cy={40 + Math.sin(x * 0.1) * 8} r="2" fill={c} opacity="0.8" />)}
        <text x="5" y="72" fill="#6b7280" fontSize="7">DWG · Коридор</text>
      </>}
      {тип === "tin" && <>
        {[[10,20],[40,10],[70,25],[100,15],[110,35],[90,50],[60,55],[30,45],[10,20]].map(([x,y],i,a) =>
          i < a.length-1 ? <line key={i} x1={x} y1={y} x2={a[i+1][0]} y2={a[i+1][1]} stroke={c} strokeWidth="0.8" opacity="0.6" /> : null
        )}
        {[[10,20],[40,10],[30,45],[70,25],[100,15],[90,50],[60,55],[40,10]].map(([x,y],i) =>
          <circle key={i} cx={x} cy={y} r="2.5" fill={c} opacity="0.9" />
        )}
        <line x1="40" y1="10" x2="30" y2="45" stroke={c} strokeWidth="0.8" opacity="0.5" />
        <line x1="70" y1="25" x2="60" y2="55" stroke={c} strokeWidth="0.8" opacity="0.5" />
        <line x1="30" y1="45" x2="60" y2="55" stroke={c} strokeWidth="0.8" opacity="0.5" />
        <text x="5" y="72" fill="#6b7280" fontSize="7">TIN · Поверхность</text>
      </>}
      {тип === "align" && <>
        <path d="M5,60 L20,40 L40,35 L65,25 L90,30 L110,15" stroke={c} strokeWidth="2.5" fill="none" />
        <path d="M5,65 L20,45 L40,40 L65,30 L90,35 L110,20" stroke="#6b7280" strokeWidth="1" fill="none" strokeDasharray="3,3" />
        {[5,20,40,65,90,110].map((x,i) => {
          const y = [60,40,35,25,30,15][i]
          return <circle key={x} cx={x} cy={y} r="3" fill={c} opacity="0.9" />
        })}
        <text x="5" y="72" fill="#6b7280" fontSize="7">XML · Трасса</text>
      </>}
      {тип === "cross" && <>
        <line x1="60" y1="5" x2="60" y2="75" stroke="#374151" strokeWidth="0.5" />
        <line x1="5" y1="40" x2="115" y2="40" stroke="#374151" strokeWidth="0.5" />
        <polygon points="30,55 50,35 70,35 90,55" fill={c} opacity="0.3" stroke={c} strokeWidth="1.5" />
        <polygon points="40,55 50,40 70,40 80,55" fill={c} opacity="0.6" />
        <line x1="30" y1="55" x2="5" y2="62" stroke="#6b7280" strokeWidth="1" />
        <line x1="90" y1="55" x2="115" y2="62" stroke="#6b7280" strokeWidth="1" />
        <text x="5" y="72" fill="#6b7280" fontSize="7">DWG · Поперечник</text>
      </>}
      {тип === "net" && <>
        {[[20,20],[60,20],[100,20],[20,50],[60,50],[100,50]].map(([x,y],i) =>
          <circle key={i} cx={x} cy={y} r="5" fill="none" stroke={c} strokeWidth="1.5" opacity="0.8" />
        )}
        <line x1="20" y1="20" x2="60" y2="20" stroke={c} strokeWidth="2" opacity="0.6" />
        <line x1="60" y1="20" x2="100" y2="20" stroke={c} strokeWidth="2" opacity="0.6" />
        <line x1="20" y1="50" x2="60" y2="50" stroke={c} strokeWidth="2" opacity="0.6" />
        <line x1="60" y1="50" x2="100" y2="50" stroke={c} strokeWidth="2" opacity="0.6" />
        <line x1="20" y1="20" x2="20" y2="50" stroke={c} strokeWidth="1.5" opacity="0.5" />
        <line x1="60" y1="20" x2="60" y2="50" stroke={c} strokeWidth="1.5" opacity="0.5" />
        <line x1="100" y1="20" x2="100" y2="50" stroke={c} strokeWidth="1.5" opacity="0.5" />
        <text x="5" y="72" fill="#6b7280" fontSize="7">DWG · Сети</text>
      </>}
      {тип === "points" && <>
        {[[15,15],[35,30],[55,12],[75,28],[95,18],[20,50],[50,45],[80,52],[110,40]].map(([x,y],i) =>
          <g key={i}>
            <circle cx={x} cy={y} r="3" fill={c} opacity="0.9" />
            <text x={x+4} y={y-3} fill={c} fontSize="5" opacity="0.7">{(120+i*0.3).toFixed(1)}</text>
          </g>
        )}
        <text x="5" y="72" fill="#6b7280" fontSize="7">CSV · Точки COGO</text>
      </>}
      {тип === "bim" && <>
        <rect x="30" y="15" width="30" height="40" fill="none" stroke={c} strokeWidth="1.5" opacity="0.8" />
        <rect x="60" y="25" width="25" height="30" fill="none" stroke={c} strokeWidth="1.5" opacity="0.6" />
        <line x1="30" y1="15" x2="20" y2="8" stroke={c} strokeWidth="1" opacity="0.5" />
        <line x1="60" y1="15" x2="50" y2="8" stroke={c} strokeWidth="1" opacity="0.5" />
        <line x1="20" y1="8" x2="50" y2="8" stroke={c} strokeWidth="1" opacity="0.5" />
        <line x1="60" y1="25" x2="50" y2="18" stroke={c} strokeWidth="1" opacity="0.4" />
        <text x="5" y="72" fill="#6b7280" fontSize="7">IFC · BIM-модель</text>
      </>}
      {тип === "road" && <>
        <path d="M5,55 Q30,40 60,38 Q90,36 115,25" stroke="#374151" strokeWidth="14" fill="none" />
        <path d="M5,55 Q30,40 60,38 Q90,36 115,25" stroke={c} strokeWidth="10" fill="none" opacity="0.5" />
        <path d="M5,55 Q30,40 60,38 Q90,36 115,25" stroke="#facc15" strokeWidth="1" fill="none" strokeDasharray="6,4" opacity="0.9" />
        <text x="5" y="72" fill="#6b7280" fontSize="7">DWG · Автодорога</text>
      </>}
    </svg>
  )
}

// ─── Главный компонент ─────────────────────────────────────────────────────────

// ─── Диалог обратной связи ────────────────────────────────────────────────────
function FeedbackDialog({ тип, onClose }: { тип: "отзыв"|"ошибка"|"документация"; onClose: ()=>void }) {
  const [текст, setТекст] = useState("")
  const [отправлено, setОтправлено] = useState(false)
  const отправить = () => { if (текст.trim() || тип==="документация") { setОтправлено(true); setTimeout(onClose,1800) } }
  const DOCS = [
    { title:"Быстрый старт", desc:"Создание первого проекта", icon:"Play" },
    { title:"Работа с ЦМР", desc:"LiDAR, GNSS, TIN-поверхности", icon:"Mountain" },
    { title:"Трассы и коридоры", desc:"СП 34, поперечники, объёмы", icon:"Route" },
    { title:"Инженерные сети", desc:"Гидравлика, коллизии", icon:"Network" },
    { title:"BIM-интеграция", desc:"IFC, Revit, Construction Cloud", icon:"Layers" },
    { title:"Горячие клавиши", desc:"Все команды редактора", icon:"Keyboard" },
  ]
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{scale:0.93}} animate={{scale:1}} exit={{scale:0.93}}
        className="rounded-xl shadow-2xl w-full max-w-md"
        style={{background:"#1e1e2e",border:"1px solid #374151"}} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <span className="text-white font-bold text-[14px]">
            {тип==="отзыв"?"Отправить отзыв":тип==="ошибка"?"Сообщить об ошибке":"Документация"}
          </span>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg">✕</button>
        </div>
        {отправлено ? (
          <div className="px-5 py-8 text-center">
            <Icon name="CheckCircle" size={40} className="text-green-500 mx-auto mb-3"/>
            <div className="text-white font-semibold">Отправлено!</div>
            <div className="text-gray-400 text-sm mt-1">Спасибо за обратную связь</div>
          </div>
        ) : тип==="документация" ? (
          <div className="p-4 space-y-2">
            {DOCS.map(d=>(
              <div key={d.title} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#252535] cursor-pointer border border-gray-800 hover:border-gray-600 transition-colors">
                <Icon name={d.icon} size={16} className="text-[#0078d4] flex-shrink-0" fallback="BookOpen"/>
                <div>
                  <div className="text-white text-[13px] font-semibold">{d.title}</div>
                  <div className="text-gray-500 text-[11px]">{d.desc}</div>
                </div>
                <Icon name="ChevronRight" size={14} className="text-gray-600 ml-auto"/>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {тип==="ошибка" && (
              <div className="space-y-2">
                <label className="text-[11px] text-gray-400 block">Модуль</label>
                <select className="w-full bg-[#2a2a3e] border border-gray-600 text-gray-300 text-[12px] px-3 py-2 rounded outline-none">
                  {MODULES.map(m=><option key={m.id}>{m.label}</option>)}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[11px] text-gray-400 block">
                {тип==="отзыв"?"Ваш отзыв":"Описание проблемы"}
              </label>
              <textarea value={текст} onChange={e=>setТекст(e.target.value)} rows={5}
                placeholder={тип==="отзыв"?"Расскажите что вам нравится или что можно улучшить...":"Опишите шаги для воспроизведения ошибки..."}
                className="w-full bg-[#2a2a3e] border border-gray-600 text-white text-[12px] px-3 py-2 rounded outline-none focus:border-[#0078d4] resize-none placeholder-gray-600"/>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="px-4 py-2 text-[12px] text-gray-400 hover:text-white border border-gray-700 rounded">Отмена</button>
              <button onClick={отправить} disabled={!текст.trim()}
                className="px-4 py-2 text-[12px] text-white rounded disabled:opacity-40 transition-opacity" style={{background:"#0078d4"}}>
                {тип==="отзыв"?"Отправить":"Сообщить"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Диалог «Открыть файл» ────────────────────────────────────────────────────
function OpenDialog({ onClose, onOpen }: { onClose:()=>void; onOpen:(id:string)=>void }) {
  const [search, setSearch] = useState("")
  const filtered = ПОСЛЕДНИЕ_ФАЙЛЫ.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{scale:0.93}} animate={{scale:1}} exit={{scale:0.93}}
        className="rounded-xl shadow-2xl w-full max-w-lg"
        style={{background:"#1e1e2e",border:"1px solid #374151"}} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <span className="text-white font-bold text-[14px] flex items-center gap-2">
            <Icon name="FolderOpen" size={16} className="text-[#0078d4]"/>Открыть проект
          </span>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg">✕</button>
        </div>
        <div className="p-4 space-y-3">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск проектов..."
            className="w-full bg-[#2a2a3e] border border-gray-600 text-white text-[12px] px-3 py-2 rounded outline-none focus:border-[#0078d4] placeholder-gray-600"/>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {filtered.map(f=>(
              <button key={f.id} onClick={()=>{onOpen(f.id);onClose()}}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#252535] text-left border border-gray-800 hover:border-gray-600 transition-colors">
                <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0"><ПревьюФайла тип={f.preview} цвет={f.color}/></div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-[12px] font-semibold truncate">{f.name}.{f.ext}</div>
                  <div className="text-gray-500 text-[10px]">{f.date} · {f.size}</div>
                </div>
                <Icon name="ChevronRight" size={14} className="text-gray-600 flex-shrink-0"/>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [homeВкладка, setHomeВкладка] = useState<"последние" | "модули" | "шаблоны" | "обучение">("последние")
  const [sortBy, setSortBy] = useState("Последнее открытие")
  const [viewGrid, setViewGrid] = useState(true)
  const [поиск, setПоиск] = useState("")
  const [showНовыйПроект, setShowНовыйПроект] = useState(false)
  const [showОткрыть, setShowОткрыть] = useState(false)
  const [showОтзыв, setShowОтзыв] = useState<"отзыв"|"ошибка"|"документация"|null>(null)
  const [activeRibbonTab, setActiveRibbonTab] = useState("Главная")
  const [поискГлоб, setПоискГлоб] = useState("")
  const [showПоискРез, setShowПоискРез] = useState(false)
  const [новыйПроект, setНовыйПроект] = useState({ name: "", template: "Автодорога (СП 34)" })

  useEffect(() => {
    if (!localStorage.getItem("civilpro_auth")) navigate("/login")
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem("civilpro_auth")
    navigate("/login")
  }

  const current = MODULES.find(m => m.id === activeModule)
  const profile = JSON.parse(localStorage.getItem("civilpro_profile") || "{}")
  const initials = (profile.name || "").trim().split(" ").slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join("") || "П"

  const отфильтрованныеФайлы = ПОСЛЕДНИЕ_ФАЙЛЫ.filter(f =>
    f.name.toLowerCase().includes(поиск.toLowerCase())
  )

  const FULLSCREEN_MODULES = ["civilcad", "viewer3d"]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#1a1a2e", fontFamily: "Arial, sans-serif" }}>

      {/* ── Title bar (Civil 3D стиль) ── */}
      <div className="flex items-center justify-between px-2 py-0.5 flex-shrink-0" style={{ background: "#0f0f1e", minHeight: 26 }}>
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveModule(null)}
            className="w-5 h-5 bg-[#0078d4] flex items-center justify-center text-white font-bold text-[10px] rounded-sm hover:bg-[#005fa3] transition-colors">Л</button>
          <button title="Открыть проект" onClick={() => setShowОткрыть(true)} className="text-gray-500 hover:text-white text-xs px-0.5 transition-colors">🗁</button>
          <button title="Сохранить" onClick={() => { if (activeModule) { /* toast */ } }} className="text-gray-500 hover:text-white text-xs px-0.5 transition-colors">💾</button>
          <button title="Отменить" className="text-gray-600 text-xs px-0.5 cursor-not-allowed">↩</button>
          <button title="Повторить" className="text-gray-600 text-xs px-0.5 cursor-not-allowed">↪</button>
        </div>
        <div className="text-[11px] text-gray-400 font-semibold tracking-wide select-none">
          {activeModule && current ? `${current.label} — ЛАПА 3D 2026` : "ЛАПА 3D 2026 — Начало"}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input value={поискГлоб} onChange={e=>{setПоискГлоб(e.target.value);setShowПоискРез(e.target.value.length>0)}}
              onBlur={()=>setTimeout(()=>setShowПоискРез(false),200)}
              placeholder="Ключевое слово или фраза"
              className="bg-[#2a2a3e] border border-gray-700 text-[10px] text-gray-400 px-2 py-0.5 w-44 rounded-sm placeholder-gray-600 outline-none focus:border-blue-500" />
            {showПоискРез && поискГлоб && (
              <div className="absolute top-full right-0 mt-1 w-64 bg-[#1e1e2e] border border-gray-700 rounded shadow-xl z-50">
                {MODULES.filter(m=>m.label.toLowerCase().includes(поискГлоб.toLowerCase())||m.desc.toLowerCase().includes(поискГлоб.toLowerCase())).slice(0,6).map(m=>(
                  <button key={m.id} onClick={()=>{setActiveModule(m.id);setПоискГлоб("");setShowПоискРез(false)}}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-gray-300 hover:bg-[#252535] text-left">
                    <Icon name={m.icon} size={12} className="text-[#0078d4]" fallback="Square"/>
                    <span className="truncate">{m.label}</span>
                  </button>
                ))}
                {MODULES.filter(m=>m.label.toLowerCase().includes(поискГлоб.toLowerCase())).length===0 && (
                  <div className="px-3 py-2 text-[11px] text-gray-500">Ничего не найдено</div>
                )}
              </div>
            )}
          </div>
          <button onClick={()=>setShowОтзыв("документация")} title="Справка"
            className="text-gray-500 hover:text-white text-xs px-2 py-0.5 transition-colors">?</button>
        </div>
      </div>

      {/* ── Ribbon menu bar ── */}
      {(!activeModule || !FULLSCREEN_MODULES.includes(activeModule)) && (
        <div className="flex-shrink-0" style={{ background: "#252535", borderBottom: "1px solid #1a1a2e" }}>
          {/* Вкладки ленты */}
          <div className="flex items-center gap-0 px-1" style={{ borderBottom: "1px solid #1a1a2e" }}>
            {["Главная","Вставка","Аннотации","Редактирование","Анализ","Вид","Управление","Вывод","Съёмка","Железная дорога","InfraWorks","Совместная работа","Справка"].map(t => (
              <button key={t} onClick={()=>setActiveRibbonTab(t)}
                className={`px-3 py-1.5 text-[11px] whitespace-nowrap border-b-2 transition-colors ${activeRibbonTab===t ? "border-[#0078d4] text-white bg-[#1e1e2e]" : "border-transparent text-gray-400 hover:text-white hover:bg-[#1e1e30]"}`}>{t}</button>
            ))}
          </div>
          {/* Панели инструментов — динамические по вкладке */}
          <div className="flex items-center gap-2 px-2 py-1 overflow-x-auto">
            {(activeRibbonTab === "Главная" ? [
              { group:"Создать данные рельефа", items:[{l:"Точки",icon:"MapPin",mod:"geodesy"},{l:"Поверхности",icon:"Triangle",mod:"surfaces"},{l:"ЦМР / LiDAR",icon:"ScanLine",mod:"dtm"}] },
              { group:"Создать проектные данные", items:[{l:"Трасса",icon:"Spline",mod:"alignment"},{l:"Профиль",icon:"TrendingUp",mod:"alignment"},{l:"Коридор",icon:"Navigation",mod:"corridor"},{l:"Сечение",icon:"Minus",mod:"corridor"}] },
              { group:"Инженерные сети", items:[{l:"Трубопровод",icon:"Network",mod:"networks"},{l:"Ливневая",icon:"Droplets",mod:"networks"},{l:"Электросеть",icon:"Zap",mod:"networks"}] },
              { group:"Анализ", items:[{l:"Объёмы",icon:"BarChart3",mod:"analysis"},{l:"Уклоны",icon:"TrendingUp",mod:"analysis"},{l:"Водосборы",icon:"Waves",mod:"dynamic"}] },
              { group:"Редактор", items:[{l:"ЛАПА — Редактор",icon:"Monitor",mod:"civilcad"},{l:"3D-вьюер",icon:"Box",mod:"viewer3d"},{l:"ЦМР",icon:"Mountain",mod:"dtm"}] },
            ] : activeRibbonTab === "Съёмка" ? [
              { group:"Геодезия", items:[{l:"Точки COGO",icon:"MapPin",mod:"geodesy"},{l:"ЦМР",icon:"ScanLine",mod:"dtm"},{l:"Тахеометр",icon:"Crosshair",mod:"geodesy"}] },
              { group:"Анализ рельефа", items:[{l:"Поверхности",icon:"Triangle",mod:"surfaces"},{l:"Горизонтали",icon:"Layers",mod:"surfaces"},{l:"Объёмы",icon:"BarChart3",mod:"analysis"}] },
            ] : activeRibbonTab === "Железная дорога" ? [
              { group:"Ж/д путь", items:[{l:"Трасса пути",icon:"Train",mod:"railway"},{l:"CANT-кривые",icon:"TrendingUp",mod:"railway"},{l:"Профиль",icon:"Spline",mod:"railway"}] },
            ] : activeRibbonTab === "Анализ" ? [
              { group:"Расчёты", items:[{l:"Объёмы",icon:"BarChart3",mod:"analysis"},{l:"Откосы",icon:"TrendingDown",mod:"analysis"},{l:"Гидрология",icon:"Droplets",mod:"dynamic"}] },
              { group:"Нормы", items:[{l:"СП 34",icon:"BookCheck",mod:"standards"},{l:"ГОСТ",icon:"BookCheck",mod:"standards"}] },
            ] : activeRibbonTab === "Вид" ? [
              { group:"Вид", items:[{l:"3D-вьюер",icon:"Box",mod:"viewer3d"},{l:"Редактор",icon:"Monitor",mod:"civilcad"}] },
            ] : activeRibbonTab === "Управление" ? [
              { group:"Проект", items:[{l:"Проекты",icon:"FolderKanban",mod:"projects"},{l:"BIM",icon:"Layers",mod:"bim"},{l:"Интеграция",icon:"Puzzle",mod:"integration"}] },
            ] : activeRibbonTab === "Вывод" ? [
              { group:"Экспорт", items:[{l:"Ведомости",icon:"ClipboardList",mod:"specs"},{l:"Печать",icon:"Printer",mod:"specs"}] },
            ] : activeRibbonTab === "Справка" ? [
              { group:"Помощь", items:[{l:"Документация",icon:"BookOpen",mod:""},{l:"Отзыв",icon:"MessageSquare",mod:""},{l:"Об ошибке",icon:"AlertTriangle",mod:""}] },
            ] : [
              { group:"Все модули", items:[{l:"Открыть...",icon:"FolderOpen",mod:""},{l:"Создать",icon:"Plus",mod:""}] },
            ]).map(g => (
              <div key={g.group} className="flex flex-col gap-0 border-r border-gray-700 pr-2 flex-shrink-0">
                <div className="flex items-center gap-0.5 mb-0.5">
                  {g.items.map(item => (
                    <button key={item.l} onClick={() => {
                      if (item.mod) { setActiveModule(item.mod) }
                      else if (item.l === "Документация") { setShowОтзыв("документация") }
                      else if (item.l === "Отзыв") { setShowОтзыв("отзыв") }
                      else if (item.l === "Об ошибке") { setShowОтзыв("ошибка") }
                      else if (item.l === "Открыть...") { setShowОткрыть(true) }
                      else if (item.l === "Создать") { setShowНовыйПроект(true) }
                    }}
                      className="flex flex-col items-center gap-0.5 px-2 py-1 rounded hover:bg-[#1e1e30] transition-colors min-w-[40px]">
                      <Icon name={item.icon} size={16} className="text-[#0078d4]" fallback="Square"/>
                      <span className="text-[8px] text-gray-400 whitespace-nowrap">{item.l}</span>
                    </button>
                  ))}
                </div>
                <div className="text-[8px] text-gray-600 border-t border-gray-700 w-full text-center pt-0.5">{g.group}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Вкладки документа ── */}
      {!activeModule && (
        <div className="flex items-center gap-0 px-2 flex-shrink-0" style={{ background: "#1e1e2e", borderBottom: "1px solid #111" }}>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-white border-b-2 border-[#0078d4] bg-[#252535]">
            <Icon name="Home" size={11} className="text-[#0078d4]" />
            Начало
          </button>
          {activeModule && current && (
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-gray-300 border-b-2 border-transparent hover:bg-[#252535]">
              <Icon name={current.icon} size={11} className="text-[#0078d4]" fallback="File" />
              {current.label}
              <span onClick={() => setActiveModule(null)} className="ml-1 text-gray-500 hover:text-white">✕</span>
            </button>
          )}
          <button className="px-2 py-1.5 text-[11px] text-gray-500 hover:text-white">+</button>
        </div>
      )}

      {/* ── Основная область ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Левая боковая панель (Civil 3D стиль) ── */}
        {(!activeModule || !FULLSCREEN_MODULES.includes(activeModule)) && (
          <aside className="flex flex-col flex-shrink-0" style={{ width: 192, background: "#141420", borderRight: "1px solid #0f0f1e" }}>
            {/* Логотип */}
            <div className="px-4 py-5 border-b border-gray-800">
              <div className="text-white font-extrabold text-lg leading-tight">ЛАПА 3D</div>
              <div className="text-gray-500 text-[10px] mt-0.5">2026 · Версия 1.0</div>
            </div>

            {/* Кнопки Открыть / Создать */}
            <div className="px-3 py-3 space-y-2 border-b border-gray-800">
              <button onClick={() => setShowОткрыть(true)}
                className="w-full flex items-center justify-between px-3 py-2 rounded text-[12px] text-gray-300 hover:bg-[#1e1e30] hover:text-white transition-colors border border-gray-700">
                <span className="flex items-center gap-2"><Icon name="FolderOpen" size={14} className="text-[#0078d4]" />Открыть…</span>
                <Icon name="ChevronRight" size={12} className="text-gray-500" />
              </button>
              <button onClick={() => setShowНовыйПроект(true)}
                className="w-full flex items-center justify-between px-3 py-2 rounded text-[12px] text-gray-300 hover:bg-[#1e1e30] hover:text-white transition-colors border border-gray-700">
                <span className="flex items-center gap-2"><Icon name="Plus" size={14} className="text-[#0078d4]" />Создать…</span>
                <Icon name="ChevronRight" size={12} className="text-gray-500" />
              </button>
            </div>

            {/* Навигация */}
            <nav className="flex-1 py-2 overflow-y-auto">
              {[
                { id: "последние", label: "Последние", icon: "Clock" },
                { id: "модули", label: "Все модули", icon: "LayoutGrid" },
                { id: "шаблоны", label: "Шаблоны", icon: "FileText" },
                { id: "обучение", label: "Обучение", icon: "GraduationCap" },
              ].map(item => (
                <button key={item.id}
                  onClick={() => { setHomeВкладка(item.id as typeof homeВкладка); setActiveModule(null) }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-[12px] text-left transition-colors ${homeВкладка === item.id && !activeModule ? "text-white font-semibold bg-[#1e1e30]" : "text-gray-400 hover:text-white hover:bg-[#1a1a28]"}`}>
                  <Icon name={item.icon} size={14} className={homeВкладка === item.id && !activeModule ? "text-[#0078d4]" : "text-gray-600"} fallback="Circle" />
                  {item.label}
                </button>
              ))}

              <div className="border-t border-gray-800 mt-2 pt-2">
                <div className="px-4 py-1 text-[9px] text-gray-600 uppercase tracking-wider font-semibold">Модули</div>
                {MODULES.map(m => (
                  <button key={m.id} onClick={() => setActiveModule(m.id)}
                    className={`w-full flex items-center gap-2 px-4 py-1.5 text-[11px] text-left transition-colors ${activeModule === m.id ? "text-white bg-[#0078d4]" : "text-gray-500 hover:text-gray-300 hover:bg-[#1a1a28]"}`}>
                    <Icon name={m.icon} size={11} className={activeModule === m.id ? "text-white" : "text-gray-600"} fallback="Square" />
                    <span className="truncate">{m.label}</span>
                  </button>
                ))}
              </div>
            </nav>

            {/* Ссылки снизу */}
            <div className="border-t border-gray-800 p-3 space-y-1">
              {[
                { l:"Новые возможности", fn: ()=>setHomeВкладка("обучение") },
                { l:"Онлайн-справка", fn: ()=>setShowОтзыв("документация") },
                { l:"Форум сообщества", fn: ()=>setShowОтзыв("отзыв") },
                { l:"Служба поддержки", fn: ()=>setShowОтзыв("ошибка") },
              ].map(item => (
                <button key={item.l} onClick={()=>{item.fn();setActiveModule(null)}}
                  className="w-full text-left text-[11px] text-[#60a5fa] hover:underline px-1 py-0.5 transition-all">{item.l}</button>
              ))}
            </div>
          </aside>
        )}

        {/* ── Основной контент ── */}
        <div className={`flex-1 overflow-hidden ${activeModule && FULLSCREEN_MODULES.includes(activeModule) ? "" : "flex flex-col"}`}>
          <AnimatePresence mode="wait">

            {/* ── Стартовый экран (Civil 3D Home) ── */}
            {!activeModule && (
              <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-1 overflow-hidden" style={{ background: "#1a1a2e" }}>

                {/* Центральная область */}
                <div className="flex-1 flex flex-col overflow-hidden">

                  {/* Вкладки контента */}
                  {homeВкладка === "последние" && (
                    <div className="flex-1 overflow-y-auto p-6">
                      <div className="flex items-center justify-between mb-5">
                        <h2 className="text-white text-xl font-bold">Последние</h2>
                      </div>

                      {/* Тулбар */}
                      <div className="flex items-center gap-3 mb-5 flex-wrap">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setViewGrid(false)}
                            className={`p-1.5 rounded ${!viewGrid ? "bg-[#0078d4] text-white" : "text-gray-500 hover:text-white hover:bg-[#252535]"}`}>
                            <Icon name="List" size={14} />
                          </button>
                          <button onClick={() => setViewGrid(true)}
                            className={`p-1.5 rounded ${viewGrid ? "bg-[#0078d4] text-white" : "text-gray-500 hover:text-white hover:bg-[#252535]"}`}>
                            <Icon name="LayoutGrid" size={14} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-[12px] text-gray-400">
                          <span>Сортировать по</span>
                          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                            className="bg-[#252535] border border-gray-700 text-gray-300 px-2 py-1 rounded text-[11px] outline-none cursor-pointer">
                            {["Последнее открытие","Имя","Размер","Дата создания"].map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="flex-1" />
                        <div className="relative">
                          <Icon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input value={поиск} onChange={e => setПоиск(e.target.value)}
                            placeholder="Поиск последних файлов"
                            className="bg-[#252535] border border-gray-700 text-[11px] text-gray-300 pl-7 pr-3 py-1.5 rounded outline-none focus:border-[#0078d4] w-52 placeholder-gray-600" />
                        </div>
                        <button className="p-1.5 rounded text-gray-500 hover:text-white hover:bg-[#252535]">
                          <Icon name="Filter" size={14} />
                        </button>
                      </div>

                      {/* Файлы — Grid */}
                      {viewGrid ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          {отфильтрованныеФайлы.map((f, i) => (
                            <motion.button key={f.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.04 }}
                              onClick={() => setActiveModule(f.id)}
                              className="text-left rounded-lg overflow-hidden border border-gray-700 hover:border-[#0078d4] transition-all group"
                              style={{ background: "#111827" }}>
                              {/* Превью */}
                              <div className="relative" style={{ height: 110 }}>
                                <ПревьюФайла тип={f.preview} цвет={f.color} />
                                <div className="absolute top-2 right-2 flex gap-1">
                                  <button className="w-5 h-5 flex items-center justify-center rounded bg-black/50 text-gray-400 hover:text-white text-[10px]">★</button>
                                </div>
                                <div className="absolute bottom-1 left-1">
                                  <Icon name="Monitor" size={12} className="text-gray-600" />
                                </div>
                              </div>
                              {/* Инфо */}
                              <div className="p-3 border-t border-gray-700">
                                <div className="text-white text-[12px] font-semibold truncate">{f.name}</div>
                                <div className="text-gray-500 text-[10px] mt-1">{f.date}</div>
                                <div className="flex items-center gap-1 mt-1.5">
                                  <Icon name="Monitor" size={10} className="text-gray-600" />
                                  <span className="text-[9px] text-gray-600">{f.ext.toUpperCase()} · {f.size}</span>
                                </div>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      ) : (
                        /* Файлы — List */
                        <div className="space-y-1">
                          {отфильтрованныеФайлы.map((f, i) => (
                            <motion.button key={f.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.03 }}
                              onClick={() => setActiveModule(f.id)}
                              className="w-full flex items-center gap-4 p-3 rounded-lg text-left hover:bg-[#252535] transition-colors border border-transparent hover:border-gray-700">
                              <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                                <ПревьюФайла тип={f.preview} цвет={f.color} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-white text-[13px] font-semibold truncate">{f.name}.{f.ext}</div>
                                <div className="text-gray-500 text-[11px]">{f.date} · {f.size}</div>
                              </div>
                              <Icon name="Monitor" size={14} className="text-gray-600 flex-shrink-0" />
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {homeВкладка === "модули" && (
                    <div className="flex-1 overflow-y-auto p-6">
                      <h2 className="text-white text-xl font-bold mb-5">Все модули</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {MODULES.map((m, i) => (
                          <motion.button key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            onClick={() => setActiveModule(m.id)}
                            className="text-left p-4 rounded-xl border border-gray-700 hover:border-[#0078d4] hover:bg-[#1e1e30] transition-all group"
                            style={{ background: "#111827" }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "#0078d420" }}>
                              <Icon name={m.icon} size={20} className="text-[#0078d4]" fallback="Square" />
                            </div>
                            <div className="text-white text-[13px] font-semibold leading-tight">{m.label}</div>
                            <div className="text-gray-500 text-[11px] mt-1 leading-tight">{m.desc}</div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {homeВкладка === "шаблоны" && (
                    <div className="flex-1 overflow-y-auto p-6">
                      <h2 className="text-white text-xl font-bold mb-5">Шаблоны проектов</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ШАБЛОНЫ.map((ш, i) => (
                          <motion.button key={ш.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            onClick={() => { setАктивнаяВкладкаModule(ш.id) }}
                            className="text-left p-5 rounded-xl border border-gray-700 hover:border-[#0078d4] hover:bg-[#1e1e30] transition-all"
                            style={{ background: "#111827" }}>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#0078d420" }}>
                                <Icon name={ш.icon} size={20} className="text-[#0078d4]" fallback="FileText" />
                              </div>
                              <div>
                                <div className="text-white text-[13px] font-bold">{ш.name}</div>
                                <div className="text-gray-500 text-[11px]">{ш.desc}</div>
                              </div>
                            </div>
                            <div className="text-[11px] text-[#0078d4] hover:underline">Создать проект →</div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {homeВкладка === "обучение" && (
                    <div className="flex-1 overflow-y-auto p-6 space-y-5">
                      <h2 className="text-white text-xl font-bold">Обучение и аналитика</h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                          { icon: "Play", title: "Быстрый старт", desc: "Создание первого проекта за 15 минут", tag: "Видео · 15 мин", color: "#0078d4" },
                          { icon: "BookOpen", title: "Работа с ЦМР", desc: "Импорт данных, построение TIN-поверхности", tag: "Урок · 30 мин", color: "#059669" },
                          { icon: "Route", title: "Проектирование трассы", desc: "Трассирование, пикетаж, клотоиды, нормы СП 34", tag: "Урок · 45 мин", color: "#d97706" },
                          { icon: "Navigation", title: "Создание коридора", desc: "Assembly, поперечники, объёмы земляных работ", tag: "Урок · 60 мин", color: "#7c3aed" },
                          { icon: "Network", title: "Инженерные сети", desc: "Трассировка труб, гидравлика, коллизии", tag: "Урок · 40 мин", color: "#0284c7" },
                          { icon: "Layers", title: "BIM-интеграция", desc: "IFC-экспорт, Revit, Construction Cloud", tag: "Видео · 25 мин", color: "#be185d" },
                        ].map(у => (
                          <div key={у.title} className="p-4 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
                            style={{ background: "#111827" }}>
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: у.color + "20" }}>
                                <Icon name={у.icon} size={16} style={{ color: у.color }} fallback="Play" />
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: у.color + "20", color: у.color }}>{у.tag}</span>
                            </div>
                            <div className="text-white text-[13px] font-bold">{у.title}</div>
                            <div className="text-gray-500 text-[11px] mt-1">{у.desc}</div>
                          </div>
                        ))}
                      </div>

                      {/* Статистика использования */}
                      <div className="rounded-xl border border-gray-700 p-5" style={{ background: "#111827" }}>
                        <h3 className="text-white font-bold text-[14px] mb-4 flex items-center gap-2">
                          <Icon name="BarChart3" size={16} className="text-[#0078d4]" />
                          My Insights — Статистика использования
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { label: "Проектов", value: "8", icon: "FolderKanban", color: "#0078d4" },
                            { label: "Модулей", value: "17", icon: "LayoutGrid", color: "#059669" },
                            { label: "Сессий", value: "34", icon: "Clock", color: "#d97706" },
                            { label: "Экспортов", value: "12", icon: "Download", color: "#7c3aed" },
                          ].map(s => (
                            <div key={s.label} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "#1a1a2e" }}>
                              <Icon name={s.icon} size={18} style={{ color: s.color }} fallback="Circle" />
                              <div>
                                <div className="text-white font-extrabold text-lg">{s.value}</div>
                                <div className="text-gray-500 text-[10px]">{s.label}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Правая панель (Подключить / профиль) ── */}
                <div className="flex-shrink-0 flex flex-col border-l border-gray-800" style={{ width: 240, background: "#141420" }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                    <span className="text-white text-[13px] font-bold">Профиль</span>
                    <button onClick={() => navigate("/settings")} title="Настройки" className="text-gray-500 hover:text-white text-sm transition-colors">⚙</button>
                  </div>

                  {/* Аватар / профиль */}
                  <div className="px-4 py-4 border-b border-gray-800 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0078d4] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {initials}
                      </div>
                      <div>
                        <div className="text-white text-[12px] font-semibold">{profile.name || "Пользователь"}</div>
                        <div className="text-gray-500 text-[10px]">{profile.email || "—"}</div>
                      </div>
                    </div>
                    <button onClick={() => navigate("/settings")}
                      className="w-full px-3 py-2 border border-gray-700 rounded text-[11px] text-gray-300 hover:text-white hover:border-gray-500 transition-colors text-center">
                      Настройки профиля
                    </button>
                    <button onClick={handleLogout}
                      className="w-full px-3 py-2 border border-gray-700 rounded text-[11px] text-gray-400 hover:text-red-400 hover:border-red-800 transition-colors text-center">
                      Выйти
                    </button>
                  </div>

                  {/* Новые возможности */}
                  <div className="px-4 py-4 border-b border-gray-800">
                    <div className="text-[12px] text-gray-300 font-semibold mb-3">Новые возможности v1.0</div>
                    <div className="space-y-2">
                      {[
                        { icon: "ScanLine", text: "Модуль ЦМР — лазерное сканирование" },
                        { icon: "Droplets", text: "Гидрология и водосборы (Dynamo)" },
                        { icon: "Train", text: "CANT-кривые для ж/д путей" },
                        { icon: "Sparkles", text: "My Insights — анализ продуктивности" },
                      ].map(n => (
                        <div key={n.text} className="flex items-start gap-2 text-[11px] text-gray-400">
                          <Icon name={n.icon} size={12} className="text-[#0078d4] mt-0.5 flex-shrink-0" fallback="Circle" />
                          {n.text}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Помощь */}
                  <div className="px-4 py-4 space-y-2">
                    <div className="text-[12px] text-gray-300 font-semibold mb-2">Помощь</div>
                    {[
                      { label: "Отправить отзыв", icon: "MessageSquare", action: () => setShowОтзыв("отзыв") },
                      { label: "Сообщить об ошибке", icon: "AlertTriangle", action: () => setShowОтзыв("ошибка") },
                      { label: "Документация", icon: "BookOpen", action: () => setShowОтзыв("документация") },
                    ].map(h => (
                      <button key={h.label} onClick={h.action}
                        className="w-full flex items-center gap-2 px-3 py-2 border border-gray-700 rounded text-[11px] text-gray-300 hover:text-white hover:border-[#0078d4] transition-colors">
                        <Icon name={h.icon} size={12} className="text-[#0078d4]" fallback="Circle" />
                        {h.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Активный модуль ── */}
            {activeModule && (
              <motion.div key={activeModule}
                initial={FULLSCREEN_MODULES.includes(activeModule) ? {} : { opacity: 0, x: 20 }}
                animate={FULLSCREEN_MODULES.includes(activeModule) ? {} : { opacity: 1, x: 0 }}
                exit={FULLSCREEN_MODULES.includes(activeModule) ? {} : { opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className={FULLSCREEN_MODULES.includes(activeModule) ? "h-full" : "flex-1 overflow-auto"}
                style={FULLSCREEN_MODULES.includes(activeModule) ? {} : { background: "#f8fafc", padding: "1.5rem" }}>
                {current?.component ? (
                  <ErrorBoundary key={activeModule}>
                    <Suspense fallback={
                      <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
                        <Icon name="Loader" size={20} className="animate-spin" />Загрузка модуля…
                      </div>
                    }>
                      <current.component onNavigate={setActiveModule} />
                    </Suspense>
                  </ErrorBoundary>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="rounded-2xl bg-indigo-50 p-6 mb-4">
                      <Icon name={current?.icon || "Square"} size={48} className="text-indigo-300" fallback="Square" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">{current?.label}</h2>
                    <p className="text-muted-foreground max-w-sm">Этот модуль находится в разработке</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Диалог нового проекта */}
      <AnimatePresence>
        {showНовыйПроект && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setShowНовыйПроект(false)}>
            <motion.div initial={{ scale: 0.93 }} animate={{ scale: 1 }} exit={{ scale: 0.93 }}
              className="rounded-xl shadow-2xl p-6 space-y-4 w-[440px]"
              style={{ background: "#1e1e2e", border: "1px solid #374151" }}
              onClick={e => e.stopPropagation()}>
              <div className="text-white font-bold text-lg flex items-center gap-2">
                <Icon name="Plus" size={18} className="text-[#0078d4]" />Новый проект
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">Название проекта</label>
                  <input value={новыйПроект.name} onChange={e => setНовыйПроект(p => ({ ...p, name: e.target.value }))}
                    placeholder="Мой проект"
                    className="w-full bg-[#2a2a3e] border border-gray-600 text-white text-[12px] px-3 py-2 rounded outline-none focus:border-[#0078d4]" />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">Шаблон</label>
                  <select value={новыйПроект.template} onChange={e => setНовыйПроект(p => ({ ...p, template: e.target.value }))}
                    className="w-full bg-[#2a2a3e] border border-gray-600 text-gray-300 text-[12px] px-3 py-2 rounded outline-none cursor-pointer focus:border-[#0078d4]">
                    {ШАБЛОНЫ.map(ш => <option key={ш.id}>{ш.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button onClick={() => setShowНовыйПроект(false)}
                  className="px-4 py-2 text-[12px] text-gray-400 hover:text-white border border-gray-700 rounded transition-colors">
                  Отмена
                </button>
                <button onClick={() => { setShowНовыйПроект(false); setActiveModule("civilcad") }}
                  className="px-4 py-2 text-[12px] text-white rounded transition-colors"
                  style={{ background: "#0078d4" }}>
                  Создать
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Диалог «Открыть» */}
      <AnimatePresence>
        {showОткрыть && (
          <OpenDialog onClose={() => setShowОткрыть(false)} onOpen={id => { setActiveModule(id); setShowОткрыть(false) }} />
        )}
      </AnimatePresence>

      {/* Диалог обратной связи / документация */}
      <AnimatePresence>
        {showОтзыв && (
          <FeedbackDialog тип={showОтзыв} onClose={() => setShowОтзыв(null)} />
        )}
      </AnimatePresence>
    </div>
  )

  function setАктивнаяВкладкаModule(id: string) { setActiveModule(id) }
}