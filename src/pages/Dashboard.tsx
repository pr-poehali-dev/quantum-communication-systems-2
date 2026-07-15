import { useEffect, useState, Suspense, Component, ReactNode, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { ProjectContext, type CivilProject } from "@/hooks/useProjectStore"

interface BackendProject {
  id: number; name: string; description?: string; type?: string; status?: string
  updated_at?: string; objects_count?: number
}

interface RecentProject {
  id: string; projectId: number; name: string; ext: string; date: string; size: string
  color: string; preview: string; type: CivilProject["type"]; description: string; status: CivilProject["status"]; ts: number
}

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

import Viewer3DModule from "@/modules/Viewer3DModule"
import AssemblyModule from "@/modules/AssemblyModule"
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
import FileManagerModule from "@/modules/FileManagerModule"
import ToolsModule from "@/modules/ToolsModule"
import PublishModule from "@/modules/PublishModule"
import SaprModule from "@/modules/SaprModule"
import SaprProModule from "@/modules/SaprProModule"
import RevarModule from "@/modules/RevarModule"
import FeaturesShowcase from "@/components/FeaturesShowcase"


const MODULES = [
  { id: "civilcad", icon: "Monitor", label: "ЛАПА — Редактор", desc: "Полноценный редактор инфраструктурных проектов", component: CivilCADModule },
  { id: "viewer3d", icon: "Box", label: "3D-вьюер", desc: "Рельеф, дорога, сети, здания в 3D", component: Viewer3DModule },
  { id: "assembly", icon: "Component", label: "3D-сборка и разборка", desc: "КОМПАС-стиль: сборки, сопряжения, разнесённый вид, коллизии", component: () => <AssemblyModule variant="kompas" /> },
  { id: "sapr", icon: "Cuboid", label: "САПР (3D-моделирование)", desc: "Параметрические детали, чертежи, спецификации, обмен STEP/STL/DXF", component: SaprModule },
  { id: "saprpro", icon: "Boxes", label: "САПР Про (Premium)", desc: "SolidWorks-аналог: элементы, эскизы, листовой металл, Simulation, Flow, CAM, PDM", component: SaprProModule },
  { id: "revar", icon: "Building2", label: "Revar (BIM)", desc: "Revit + ArchiCAD 2-в-1: BIM-модель, дисциплины, анализ, IFC, AI-ассистент", component: RevarModule },
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
  { id: "integration", icon: "Puzzle", label: "Интеграция форматов", desc: "DWG, IFC, LandXML, DXF, SHP", component: IntegrationModule },
  { id: "standards", icon: "BookCheck", label: "Стандарты проектирования", desc: "СП, ГОСТ, AASHTO, EN, ISO — 12 норм", component: StandardsModule },
  { id: "dynamic", icon: "RefreshCw", label: "Динамические модели", desc: "Граф зависимостей, автопересчёт", component: DynamicModule },
  { id: "filemanager", icon: "FolderOpen", label: "Менеджер файлов", desc: "DWG, DWT, DWS, XML, SDF, ADSKLIB, BAK", component: FileManagerModule },
  { id: "tools", icon: "Wrench", label: "Инструменты и автоматизация", desc: "LSP-скрипты, DLL-плагины, макросы SCR, палитры CUI", component: ToolsModule },
  { id: "publish", icon: "Printer", label: "Публикация и печать", desc: "PDF, DWF, CTB/STB, пакеты листов, шрифты SHX", component: PublishModule },
]

// ─── Направления работы (группировка модулей) ────────────────────────────────

const DIRECTIONS = [
  {
    id: "infra",
    label: "Инфраструктура и дороги",
    desc: "Автодороги, ж/д, трассы, коридоры, поперечники",
    icon: "Route",
    color: "#f97316",
    gradient: "from-orange-500 to-amber-600",
    modules: ["civilcad", "viewer3d", "alignment", "corridor", "roads", "railway", "areas", "surfaces", "analysis", "specs", "standards", "dynamic", "publish", "projects"],
  },
  {
    id: "survey",
    label: "Геодезия и изыскания",
    desc: "Точки, ЦМР, LiDAR, поверхности, рельеф, объёмы",
    icon: "Mountain",
    color: "#10b981",
    gradient: "from-emerald-500 to-teal-600",
    modules: ["geodesy", "dtm", "surfaces", "viewer3d", "alignment", "analysis", "specs", "integration", "civilcad"],
  },
  {
    id: "networks",
    label: "Инженерные сети",
    desc: "ВКС, ливневая, теплосеть, гидравлика",
    icon: "Network",
    color: "#3b82f6",
    gradient: "from-blue-500 to-indigo-600",
    modules: ["networks", "civilcad", "corridor", "areas", "analysis", "surfaces", "bim", "specs", "standards", "viewer3d", "filemanager"],
  },
  {
    id: "bim",
    label: "BIM и архитектура",
    desc: "Revar (Revit + ArchiCAD), IFC-модель, коллизии",
    icon: "Building2",
    color: "#8b5cf6",
    gradient: "from-violet-500 to-fuchsia-600",
    modules: ["revar", "viewer3d", "sapr", "bim", "areas", "integration", "specs", "standards", "analysis"],
  },
  {
    id: "mechanical",
    label: "Машиностроение / САПР",
    desc: "3D-детали, SolidWorks-аналог, Simulation, CAM",
    icon: "Boxes",
    color: "#ef4444",
    gradient: "from-rose-500 to-red-600",
    modules: ["viewer3d", "sapr", "saprpro", "revar", "integration", "specs", "standards", "tools"],
  },
]

// ─── Данные последних файлов ─────────────────────────────────────────────────

const ПОСЛЕДНИЕ_ФАЙЛЫ = [
  // ── Инфраструктура и дороги ──
  { id: "civilcad", name: "Главная_парковка_Финал", ext: "dwg", date: "20 мая 2026 г. 14:32", size: "31 МБ", color: "#4f46e5", preview: "corridor" },
  { id: "roads", name: "Автодорога_М5_РД", ext: "dwg", date: "13 мая 2026 г. 08:15", size: "18 МБ", color: "#c2410c", preview: "road" },
  { id: "alignment", name: "Трасса_ШД-38_v2", ext: "xml", date: "18 мая 2026 г. 11:45", size: "2 МБ", color: "#d97706", preview: "align" },
  { id: "corridor", name: "Коридор_дорога", ext: "dwg", date: "17 мая 2026 г. 09:20", size: "14 МБ", color: "#7c3aed", preview: "cross" },
  { id: "railway", name: "Ж-д_путь_Восточный", ext: "dwg", date: "12 мая 2026 г. 10:40", size: "9 МБ", color: "#c2410c", preview: "road" },
  { id: "areas", name: "Генплан_участка_12га", ext: "dwg", date: "11 мая 2026 г. 15:20", size: "7 МБ", color: "#0891b2", preview: "corridor" },
  { id: "publish", name: "Пакет_листов_РД", ext: "pdf", date: "10 мая 2026 г. 09:00", size: "12 МБ", color: "#e11d48", preview: "cross" },
  // ── Геодезия и изыскания ──
  { id: "surfaces", name: "ЦМР_Съёмка_2024", ext: "tin", date: "19 мая 2026 г. 18:10", size: "8 МБ", color: "#059669", preview: "tin" },
  { id: "geodesy", name: "Геодезия_изыскания", ext: "csv", date: "15 мая 2026 г. 10:30", size: "1 МБ", color: "#be185d", preview: "points" },
  { id: "dtm", name: "Облако_точек_LiDAR", ext: "las", date: "14 мая 2026 г. 12:10", size: "148 МБ", color: "#8b5cf6", preview: "points" },
  { id: "geodesy", name: "Тахеометрия_Полигон-7", ext: "sdr", date: "9 мая 2026 г. 11:25", size: "2 МБ", color: "#be185d", preview: "points" },
  // ── Инженерные сети ──
  { id: "networks", name: "Ливневая_канализация", ext: "dwg", date: "16 мая 2026 г. 16:05", size: "5 МБ", color: "#0284c7", preview: "net" },
  { id: "networks", name: "Теплосеть_Квартал-3", ext: "dwg", date: "8 мая 2026 г. 14:15", size: "6 МБ", color: "#3b82f6", preview: "net" },
  { id: "filemanager", name: "Водопровод_ВКС_расчёт", ext: "sdf", date: "7 мая 2026 г. 09:50", size: "4 МБ", color: "#0d9488", preview: "net" },
  // ── BIM и архитектура ──
  { id: "bim", name: "BIM_Корпус_А", ext: "ifc", date: "14 мая 2026 г. 13:00", size: "22 МБ", color: "#7c3aed", preview: "bim" },
  { id: "revar", name: "Revar_ЖК_Северный", ext: "rvr", date: "13 мая 2026 г. 16:30", size: "34 МБ", color: "#8b5cf6", preview: "bim" },
  { id: "revar", name: "Архитектура_Школа-25", ext: "ifc", date: "6 мая 2026 г. 10:05", size: "28 МБ", color: "#a855f7", preview: "bim" },
  // ── Машиностроение / САПР ──
  { id: "sapr", name: "Деталь_Кронштейн", ext: "step", date: "12 мая 2026 г. 17:45", size: "3 МБ", color: "#0891b2", preview: "bim" },
  { id: "saprpro", name: "Сборка_Редуктор_цилиндр", ext: "sldasm", date: "11 мая 2026 г. 13:20", size: "16 МБ", color: "#ef4444", preview: "bim" },
  { id: "assembly", name: "Компрессор_КНД_сборка", ext: "a3d", date: "5 мая 2026 г. 15:40", size: "11 МБ", color: "#3a7bd5", preview: "bim" },
]

const ШАБЛОНЫ = [
  // ── Инфраструктура и дороги ──
  { id: "civilcad", name: "Автодорога (СП 34)", icon: "Route", desc: "Трасса, профиль, коридор" },
  { id: "roads", name: "Автодорога РД", icon: "Route", desc: "Категория, профиль, сечение" },
  { id: "alignment", name: "Трасса и профиль", icon: "Spline", desc: "ВК, ГК, клотоиды, разбивка" },
  { id: "corridor", name: "Коридор / поперечники", icon: "RoadHorizon", desc: "Assembly, автопоперечники, объёмы" },
  { id: "railway", name: "Железная дорога", icon: "Train", desc: "Путь, CANT, профиль" },
  { id: "areas", name: "Генплан участка", icon: "LayoutDashboard", desc: "Площадной объект, ТЭП" },
  // ── Геодезия и изыскания ──
  { id: "geodesy", name: "Геодезические изыскания", icon: "Mountain", desc: "Точки COGO, ЦМР, профиль" },
  { id: "dtm", name: "ЦМР / Облако точек", icon: "ScanLine", desc: "LiDAR, GNSS, тахеометр" },
  { id: "surfaces", name: "Поверхность TIN / Grid", icon: "Triangle", desc: "Триангуляция, горизонтали" },
  // ── Инженерные сети ──
  { id: "networks", name: "Инженерные сети", icon: "Network", desc: "ВКС, ливневая, теплосеть" },
  // ── BIM и архитектура ──
  { id: "revar", name: "BIM-проект (Revar)", icon: "Building2", desc: "Revit + ArchiCAD, дисциплины" },
  { id: "bim", name: "BIM-модель (IFC)", icon: "Layers", desc: "IFC-модель, коллизии" },
  // ── Машиностроение / САПР ──
  { id: "sapr", name: "САПР-деталь", icon: "Cuboid", desc: "Параметрическая 3D-деталь, чертёж" },
  { id: "saprpro", name: "САПР Про (сборка)", icon: "Boxes", desc: "SolidWorks-аналог: сборка, симуляция" },
  { id: "assembly", name: "3D-сборка (КОМПАС)", icon: "Component", desc: "Сборки, сопряжения, коллизии" },
]

// ─── Относительное время «… назад» ───────────────────────────────────────────
function относительноеВремя(ts?: number): string {
  if (!ts) return ""
  const diff = Date.now() - ts
  if (diff < 0) return "только что"
  const min = Math.floor(diff / 60000)
  if (min < 1) return "только что"
  if (min < 60) return `${min} мин назад`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `${hrs} ч назад`
  const days = Math.floor(hrs / 24)
  if (days === 1) return "вчера"
  if (days < 7) return `${days} дн назад`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks} нед назад`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} мес назад`
  return `${Math.floor(days / 365)} г назад`
}

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
  const navigate = useNavigate()
  const [текст, setТекст] = useState("")
  const [отправлено, setОтправлено] = useState(false)
  const отправить = () => { if (текст.trim() || тип==="документация") { setОтправлено(true); setTimeout(onClose,1800) } }
  const DOCS = [
    { title:"Быстрый старт", desc:"Создание первого проекта", icon:"Play", id:"quickstart" },
    { title:"Работа с ЦМР", desc:"LiDAR, GNSS, TIN-поверхности", icon:"Mountain", id:"dtm" },
    { title:"Трассы и коридоры", desc:"СП 34, поперечники, объёмы", icon:"Route", id:"roads" },
    { title:"Инженерные сети", desc:"Гидравлика, коллизии", icon:"Network", id:"networks" },
    { title:"BIM-интеграция", desc:"IFC, Revit, Construction Cloud", icon:"Layers", id:"bim" },
    { title:"Горячие клавиши", desc:"Все команды редактора", icon:"Keyboard", id:"hotkeys" },
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
            <button onClick={() => { onClose(); navigate("/docs") }}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#0078d4]/10 border border-[#0078d4]/30 hover:bg-[#0078d4]/20 transition-colors mb-3">
              <Icon name="BookOpen" size={16} className="text-[#0078d4]"/>
              <div className="flex-1 text-left">
                <div className="text-white text-[13px] font-bold">Открыть полную документацию →</div>
                <div className="text-[#60a5fa] text-[11px]">Все разделы, поиск, примеры кода</div>
              </div>
            </button>
            {DOCS.map(d=>(
              <button key={d.title} onClick={() => { onClose(); navigate("/docs") }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#252535] cursor-pointer border border-gray-800 hover:border-gray-600 transition-colors">
                <Icon name={d.icon} size={16} className="text-[#0078d4] flex-shrink-0" fallback="BookOpen"/>
                <div className="flex-1 text-left">
                  <div className="text-white text-[13px] font-semibold">{d.title}</div>
                  <div className="text-gray-500 text-[11px]">{d.desc}</div>
                </div>
                <Icon name="ChevronRight" size={14} className="text-gray-600 ml-auto"/>
              </button>
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
function OpenDialog({ onClose, onOpen, directionModules, directionLabel }: { onClose:()=>void; onOpen:(id:string)=>void; directionModules?: string[]; directionLabel?: string }) {
  const [search, setSearch] = useState("")
  const [всеНаправления, setВсеНаправления] = useState(false)
  const поНаправлению = (directionModules && !всеНаправления)
    ? ПОСЛЕДНИЕ_ФАЙЛЫ.filter(f => directionModules.includes(f.id))
    : ПОСЛЕДНИЕ_ФАЙЛЫ
  const filtered = поНаправлению.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{scale:0.93}} animate={{scale:1}} exit={{scale:0.93}}
        className="rounded-xl shadow-2xl w-full max-w-lg"
        style={{background:"#1e1e2e",border:"1px solid #374151"}} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <span className="text-white font-bold text-[14px] flex items-center gap-2">
            <Icon name="FolderOpen" size={16} className="text-[#0078d4]"/>
            {directionModules && !всеНаправления && directionLabel ? `Проекты: ${directionLabel}` : "Открыть проект"}
          </span>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg">✕</button>
        </div>
        <div className="p-4 space-y-3">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск проектов..."
            className="w-full bg-[#2a2a3e] border border-gray-600 text-white text-[12px] px-3 py-2 rounded outline-none focus:border-[#0078d4] placeholder-gray-600"/>
          {directionModules && (
            <button onClick={()=>setВсеНаправления(v=>!v)}
              className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-white transition-colors">
              <Icon name={всеНаправления ? "Filter" : "Layers"} size={12} className="text-[#0078d4]"/>
              {всеНаправления ? "Показать только это направление" : "Показать все направления"}
            </button>
          )}
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="text-gray-500 text-[12px] text-center py-8">Проектов по этому направлению пока нет</div>
            )}
            {filtered.map((f,i)=>(
              <button key={`${f.id}-${f.name}-${i}`} onClick={()=>{onOpen(f.id);onClose()}}
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
  // ── Глобальный store — синхронизация модулей ──────────────────────────────
  const store = useContext(ProjectContext)

  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [открытыеМодули, setОткрытыеМодули] = useState<string[]>([])
  useEffect(() => {
    if (activeModule) setОткрытыеМодули(prev => prev.includes(activeModule) ? prev : [...prev, activeModule])
  }, [activeModule])
  const закрытьМодуль = (id: string) => {
    setОткрытыеМодули(prev => {
      const next = prev.filter(m => m !== id)
      if (activeModule === id) setActiveModule(next.length ? next[next.length - 1] : null)
      return next
    })
  }
  const [direction, setDirection] = useState<string | null>(() => localStorage.getItem("civilpro_direction"))
  const [поискИнстр, setПоискИнстр] = useState("")
  const выбратьНаправление = (id: string) => { setDirection(id); localStorage.setItem("civilpro_direction", id); setActiveModule(null); setHomeВкладка("модули") }
  const открытьМодульНапрямую = (id: string) => {
    const dir = DIRECTIONS.find(d => d.modules.includes(id)) || DIRECTIONS[0]
    setDirection(dir.id); localStorage.setItem("civilpro_direction", dir.id)
    setActiveModule(id); setПоискИнстр("")
  }
  const сброситьНаправление = () => { setDirection(null); localStorage.removeItem("civilpro_direction"); setActiveModule(null) }
  // Навигация между модулями из самих модулей (кнопки "Редактор", "3D-вид" и т.п.)
  const навигацияМодуль = (id: string | null) => {
    if (id && !MODULES.find(m => m.id === id)) return
    setActiveModule(id)
  }
  const текущееНаправление = DIRECTIONS.find(d => d.id === direction)
  useEffect(() => {
    if (direction && !DIRECTIONS.find(d => d.id === direction)) {
      setDirection(null); localStorage.removeItem("civilpro_direction")
    }
  }, [direction])
  const модулиНаправления = текущееНаправление ? MODULES.filter(m => текущееНаправление.modules.includes(m.id)) : MODULES
  const [показатьВсеМодули, setПоказатьВсеМодули] = useState(false)
  // Список модулей для вкладки "Все модули": либо все 24, либо модули направления
  const модулиДляВкладки = показатьВсеМодули ? MODULES : модулиНаправления
  // Избранные модули (сохраняются в браузере)
  const [избранное, setИзбранное] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("civilpro_favorites") || "[]") } catch { return [] }
  })
  const переключитьИзбранное = (id: string) => setИзбранное(prev => {
    const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    localStorage.setItem("civilpro_favorites", JSON.stringify(next))
    return next
  })
  const избранныеМодули = MODULES.filter(m => избранное.includes(m.id))
  const [homeВкладка, setHomeВкладка] = useState<"последние" | "возможности" | "модули" | "шаблоны" | "обучение">("последние")
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
  const [создаётся, setСоздаётся] = useState(false)
  const [всеШаблоны, setВсеШаблоны] = useState(false)
  // При открытии диалога подставляем первый шаблон текущего направления
  useEffect(() => {
    if (!showНовыйПроект || !текущееНаправление || всеШаблоны) return
    const доступные = ШАБЛОНЫ.filter(ш => текущееНаправление.modules.includes(ш.id))
    if (доступные.length && !доступные.some(ш => ш.name === новыйПроект.template)) {
      setНовыйПроект(p => ({ ...p, template: доступные[0].name }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showНовыйПроект, всеШаблоны, direction])
  const [недавниеПроекты, setНедавниеПроекты] = useState<RecentProject[]>([])

  const PROJECTS_URL = "https://functions.poehali.dev/0413bfb5-1eee-4ebd-91f9-66e74d563887"

  const загрузитьПроекты = () => {
    fetch(PROJECTS_URL)
      .then(r => r.json())
      .then((data: unknown) => {
        const list: BackendProject[] = Array.isArray(data) ? data : []
        const mapped = list.map(p => ({
          id: `db_${p.id}`,
          projectId: p.id,
          name: p.name,
          ext: "dwg",
          date: p.updated_at ? new Date(p.updated_at).toLocaleDateString("ru", { day: "numeric", month: "long", year: "numeric" }) : "",
          size: `${p.objects_count ?? 0} об.`,
          color: "#0078d4",
          preview: "corridor",
          type: (p.type as CivilProject["type"]) || "road",
          description: p.description || "",
          status: (p.status as CivilProject["status"]) || "active",
          ts: p.updated_at ? new Date(p.updated_at).getTime() : 0,
        }))
        mapped.sort((a, b) => b.ts - a.ts)
        setНедавниеПроекты(mapped)
      })
      .catch(() => {})
  }

  useEffect(() => { загрузитьПроекты() }, [])

  const typeByTemplate: Record<string, "road" | "network" | "railway" | "area" | "bim"> = {
    civilcad: "road", networks: "network", geodesy: "road", areas: "area", railway: "railway", bim: "bim",
  }

  const создатьПроект = async () => {
    if (создаётся) return
    const шаблон = ШАБЛОНЫ.find(ш => ш.name === новыйПроект.template) || ШАБЛОНЫ[0]
    const имя = новыйПроект.name.trim() || "Новый проект"
    const type = typeByTemplate[шаблон.id] || "road"
    setСоздаётся(true)
    let созданный: { id: number; name: string } | null = null
    try {
      const resp = await fetch(PROJECTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: имя, description: шаблон.desc, type, status: "active" }),
      })
      if (resp.ok) созданный = await resp.json()
    } catch { /* работаем офлайн — проект всё равно откроется */ }

    store?.setActiveProject({
      id: созданный?.id ?? Date.now(),
      name: созданный?.name ?? имя,
      description: шаблон.desc,
      type,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      objects_count: 0,
    })
    localStorage.setItem("civilpro_new_project", "1")
    store?.notify(`Проект «${имя}» создан`, "success")
    загрузитьПроекты()
    setСоздаётся(false)
    setShowНовыйПроект(false)
    setНовыйПроект({ name: "", template: "Автодорога (СП 34)" })
    setActiveModule("civilcad")
  }

  useEffect(() => {
    if (!localStorage.getItem("civilpro_auth")) navigate("/login")
  }, [navigate])

  // Синхронизация: если store запрашивает переход к модулю — выполняем
  useEffect(() => {
    if (store?.requestedModule) {
      setActiveModule(store.requestedModule)
      store.setRequestedModule(null)
    }
  }, [store?.requestedModule])

  const handleLogout = () => {
    localStorage.removeItem("civilpro_auth")
    navigate("/login")
  }

  const current = MODULES.find(m => m.id === activeModule)
  const profile = JSON.parse(localStorage.getItem("civilpro_profile") || "{}")
  const initials = (profile.name || "").trim().split(" ").slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join("") || "П"

  const открытьПроект = (rp: RecentProject) => {
    store?.setActiveProject({
      id: rp.projectId, name: rp.name, description: rp.description,
      type: rp.type, status: rp.status,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      objects_count: 0,
    })
    localStorage.removeItem("civilpro_new_project")
    setActiveModule("civilcad")
  }

  const удалитьПроект = async (rp: RecentProject) => {
    if (!confirm(`Удалить проект «${rp.name}»? Действие необратимо.`)) return
    setНедавниеПроекты(prev => prev.filter(p => p.id !== rp.id))
    try {
      await fetch(PROJECTS_URL, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: rp.projectId }),
      })
    } catch { /* уже убрали из списка локально */ }
    store?.notify(`Проект «${rp.name}» удалён`, "success")
    загрузитьПроекты()
  }

  const переименоватьПроект = async (rp: RecentProject) => {
    const имя = prompt("Новое название проекта:", rp.name)
    if (!имя || !имя.trim() || имя.trim() === rp.name) return
    const новоеИмя = имя.trim()
    setНедавниеПроекты(prev => prev.map(p => p.id === rp.id ? { ...p, name: новоеИмя } : p))
    try {
      await fetch(PROJECTS_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rp.projectId, name: новоеИмя, description: rp.description, type: rp.type, status: rp.status }),
      })
    } catch { /* локально уже переименовали */ }
    store?.notify(`Проект переименован в «${новоеИмя}»`, "success")
    загрузитьПроекты()
  }

  // «Последние» — только реальные проекты пользователя (свежие сверху).
  // Демонстрационные файлы показываем лишь если реальных проектов ещё нет.
  const всеФайлы = недавниеПроекты.length > 0 ? недавниеПроекты : ПОСЛЕДНИЕ_ФАЙЛЫ
  const отфильтрованныеФайлы = всеФайлы.filter(f =>
    f.name.toLowerCase().includes(поиск.toLowerCase())
  )

  const FULLSCREEN_MODULES = ["civilcad", "viewer3d", "sapr", "saprpro", "revar"]

  // ── Экран выбора направления (показывается после входа, если не выбрано) ──
  if (!direction) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "radial-gradient(ellipse at top, #232347 0%, #14142a 55%, #0d0d1c 100%)", fontFamily: "Arial, sans-serif" }}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#0078d4] rounded-lg flex items-center justify-center text-white font-bold">Л</div>
            <div>
              <div className="text-white font-bold text-[15px] leading-tight">ЛАПА 3D 2027</div>
              <div className="text-gray-500 text-[11px]">Выберите направление работы</div>
            </div>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-white text-[12px] flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <Icon name="LogOut" size={14} />Выйти
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
          <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            className="text-white text-2xl sm:text-3xl font-bold text-center mb-2">
            В каком направлении вы работаете?
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="text-gray-400 text-[13px] text-center mb-8 max-w-xl">
            Мы покажем только нужные вам инструменты. Направление можно сменить в любой момент.
          </motion.p>

          {/* Поиск по инструментам */}
          <div className="w-full max-w-md mb-8 relative">
            <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={поискИнстр} onChange={e => setПоискИнстр(e.target.value)}
              placeholder="Найти инструмент по названию…"
              className="w-full bg-white/5 border border-white/10 text-gray-200 text-[13px] pl-10 pr-9 py-2.5 rounded-xl outline-none focus:border-white/30 placeholder-gray-500" />
            {поискИнстр && (
              <button onClick={() => setПоискИнстр("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <Icon name="X" size={15} />
              </button>
            )}
            {поискИнстр.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1b1b30] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20 max-h-72 overflow-y-auto">
                {MODULES.filter(m => m.label.toLowerCase().includes(поискИнстр.toLowerCase()) || m.desc.toLowerCase().includes(поискИнстр.toLowerCase())).slice(0, 8).map(m => (
                  <button key={m.id} onClick={() => открытьМодульНапрямую(m.id)}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-[#0078d4]/20 flex items-center justify-center shrink-0">
                      <Icon name={m.icon} size={15} className="text-[#4da3e0]" fallback="Square" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-white text-[12px] font-semibold truncate">{m.label}</div>
                      <div className="text-gray-500 text-[10px] truncate">{m.desc}</div>
                    </div>
                    <Icon name="ArrowRight" size={14} className="text-gray-600 ml-auto shrink-0" />
                  </button>
                ))}
                {MODULES.filter(m => m.label.toLowerCase().includes(поискИнстр.toLowerCase()) || m.desc.toLowerCase().includes(поискИнстр.toLowerCase())).length === 0 && (
                  <div className="px-4 py-3 text-gray-500 text-[12px]">Ничего не найдено</div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-6xl">
            {DIRECTIONS.map((d, i) => {
              const count = d.id === "all" ? MODULES.length : d.modules.length
              const tools = (d.id === "all" ? MODULES : MODULES.filter(m => d.modules.includes(m.id))).map(m => m.label)
              return (
                <motion.button key={d.id}
                  initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.05 }}
                  whileHover={{ y: -4 }}
                  onClick={() => выбратьНаправление(d.id)}
                  className="group relative text-left rounded-2xl p-5 border border-white/10 hover:border-white/25 transition-all overflow-hidden flex flex-col"
                  style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${d.gradient} flex items-center justify-center mb-3 shadow-lg`}>
                    <Icon name={d.icon} size={24} className="text-white" fallback="Square" />
                  </div>
                  <div className="text-white font-bold text-[15px] mb-1">{d.label}</div>
                  <div className="text-gray-400 text-[12px] leading-snug mb-3">{d.desc}</div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {tools.slice(0, 4).map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-full text-gray-300 border border-white/10" style={{ background: "rgba(255,255,255,0.04)" }}>{t}</span>
                    ))}
                    {tools.length > 4 && <span className="text-[10px] px-2 py-0.5 rounded-full text-gray-500" style={{ background: "rgba(255,255,255,0.04)" }}>+{tools.length - 4}</span>}
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[11px] font-semibold" style={{ color: d.color }}>{count} модулей</span>
                    <Icon name="ArrowRight" size={16} className="text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: "100vh", background: "#1a1a2e", fontFamily: "Arial, sans-serif" }}>

      {/* ── Title bar (Civil 3D стиль) ── */}
      <div className="flex items-center justify-between px-2 py-0.5 flex-shrink-0" style={{ background: "#0f0f1e", minHeight: 26 }}>
        <div className="flex items-center gap-2">
          <button onClick={() => { setActiveModule(null); setHomeВкладка("последние") }}
            className="w-5 h-5 bg-[#0078d4] flex items-center justify-center text-white font-bold text-[10px] rounded-sm hover:bg-[#005fa3] transition-colors">Л</button>
          {activeModule && (
            <>
              <button title="Открыть проект" onClick={() => setShowОткрыть(true)} className="text-gray-500 hover:text-white text-xs px-0.5 transition-colors">🗁</button>
              <button title="Сохранить" onClick={() => { if (activeModule) { /* toast */ } }} className="text-gray-500 hover:text-white text-xs px-0.5 transition-colors">💾</button>
              <button title="Отменить" className="text-gray-600 text-xs px-0.5 cursor-not-allowed">↩</button>
              <button title="Повторить" className="text-gray-600 text-xs px-0.5 cursor-not-allowed">↪</button>
            </>
          )}
        </div>
        <div className="text-[11px] text-gray-400 font-semibold tracking-wide select-none flex items-center gap-2">
          {activeModule && current ? `${current.label} — ЛАПА 3D 2027` : "ЛАПА 3D 2027"}
          {store?.activeProject && (
            <span className="text-[#0078d4] flex items-center gap-1">
              <span className="text-gray-600">·</span>
              <Icon name="FolderOpen" size={10} fallback="Folder" />
              {store.activeProject.name}
            </span>
          )}
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

      {/* ── Строка открытых модулей (вкладки-окна) ── */}
      {открытыеМодули.length > 0 && (
        <div className="flex items-stretch gap-0 px-1 flex-shrink-0 overflow-x-auto" style={{ background: "#161622", borderBottom: "1px solid #0f0f1e" }}>
          <button onClick={() => setActiveModule(null)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] whitespace-nowrap border-b-2 transition-colors ${!activeModule ? "border-[#0078d4] text-white bg-[#1e1e2e]" : "border-transparent text-gray-400 hover:text-white hover:bg-[#1e1e30]"}`}>
            <Icon name="Home" size={12} className={!activeModule ? "text-[#0078d4]" : "text-gray-500"} />
            Начало
          </button>
          {открытыеМодули.map(id => {
            const m = MODULES.find(x => x.id === id)
            if (!m) return null
            const активна = activeModule === id
            return (
              <div key={id}
                className={`group flex items-center gap-1.5 pl-3 pr-2 py-1.5 text-[11px] whitespace-nowrap border-b-2 cursor-pointer transition-colors ${активна ? "border-[#0078d4] text-white bg-[#1e1e2e]" : "border-transparent text-gray-400 hover:text-white hover:bg-[#1e1e30]"}`}
                onClick={() => setActiveModule(id)}>
                <Icon name={m.icon} size={12} className={активна ? "text-[#0078d4]" : "text-gray-500"} fallback="Square" />
                <span className="max-w-[140px] truncate">{m.label}</span>
                <span onClick={e => { e.stopPropagation(); закрытьМодуль(id) }}
                  className="ml-1 w-4 h-4 flex items-center justify-center rounded text-gray-500 hover:text-white hover:bg-red-600/70 transition-colors">
                  <Icon name="X" size={11} />
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Ribbon menu bar (только внутри открытого модуля, не на стартовом «Начало») ── */}
      {activeModule && !FULLSCREEN_MODULES.includes(activeModule) && (
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

      {/* ── Основная область ── */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ── Левая боковая панель (Civil 3D стиль) ── */}
        {(!activeModule || !FULLSCREEN_MODULES.includes(activeModule)) && (
          <aside className="flex flex-col flex-shrink-0" style={{ width: 192, background: "#141420", borderRight: "1px solid #0f0f1e" }}>
            {/* Логотип */}
            <div className="px-4 py-4 border-b border-gray-800">
              <div className="text-white font-extrabold text-lg leading-tight">ЛАПА 3D</div>
              <div className="text-gray-500 text-[10px] mt-0.5 mb-2.5">2026 · Версия 1.0</div>
              <button onClick={() => { setHomeВкладка("возможности"); setActiveModule(null) }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-bold text-white shadow-lg transition-all hover:brightness-110 hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg,#0078d4,#8b5cf6)", boxShadow: "0 4px 14px rgba(99,102,241,0.45)" }}>
                <Icon name="Sparkles" size={14} className="text-white" />
                Возможности
              </button>
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
                { id: "возможности", label: "Возможности", icon: "Sparkles" },
                { id: "модули", label: "Все модули", icon: "LayoutGrid" },
                { id: "шаблоны", label: "Шаблоны", icon: "FileText" },
                { id: "обучение", label: "Обучение", icon: "GraduationCap" },
              ].map(item => (
                <button key={item.id}
                  onClick={() => { setHomeВкладка(item.id as typeof homeВкладка); setActiveModule(null); setПоказатьВсеМодули(item.id === "модули") }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-[12px] text-left transition-colors ${homeВкладка === item.id && !activeModule ? "text-white font-semibold bg-[#1e1e30]" : "text-gray-400 hover:text-white hover:bg-[#1a1a28]"}`}>
                  <Icon name={item.icon} size={14} className={homeВкладка === item.id && !activeModule ? "text-[#0078d4]" : "text-gray-600"} fallback="Circle" />
                  {item.label}
                </button>
              ))}

              <div className="border-t border-gray-800 mt-2 pt-2">
                {текущееНаправление && (
                  <button onClick={сброситьНаправление}
                    className="w-full flex items-center gap-2 px-4 py-2 mb-1 text-[11px] text-left text-gray-300 hover:text-white hover:bg-[#1a1a28] transition-colors">
                    <div className={`w-5 h-5 rounded bg-gradient-to-br ${текущееНаправление.gradient} flex items-center justify-center shrink-0`}>
                      <Icon name={текущееНаправление.icon} size={11} className="text-white" fallback="Square" />
                    </div>
                    <span className="flex-1 truncate font-semibold">{текущееНаправление.label}</span>
                    <Icon name="RefreshCw" size={11} className="text-gray-600" />
                  </button>
                )}
                <div className="px-4 py-1 text-[9px] text-gray-600 uppercase tracking-wider font-semibold">Модули направления</div>
                {модулиНаправления.map(m => (
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
                { l:"Онлайн-справка", fn: ()=>navigate("/docs") },
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
        <div className={`flex-1 overflow-hidden flex flex-col`}>
          <AnimatePresence mode="wait">

            {/* ── Стартовый экран (Civil 3D Home) ── */}
            {!activeModule && (
              <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-1 min-h-0" style={{ background: "#1a1a2e" }}>

                {/* Центральная область */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

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
                            <motion.div key={f.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.04 }}
                              onClick={() => "projectId" in f ? открытьПроект(f as RecentProject) : setActiveModule(f.id)}
                              className="text-left rounded-lg overflow-hidden border border-gray-700 hover:border-[#0078d4] transition-all group cursor-pointer"
                              style={{ background: "#111827" }}>
                              {/* Превью */}
                              <div className="relative" style={{ height: 110 }}>
                                <ПревьюФайла тип={f.preview} цвет={f.color} />
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {"projectId" in f && (
                                    <>
                                      <button title="Переименовать"
                                        onClick={e => { e.stopPropagation(); переименоватьПроект(f as RecentProject) }}
                                        className="w-6 h-6 flex items-center justify-center rounded bg-black/60 text-gray-300 hover:text-white hover:bg-[#0078d4]">
                                        <Icon name="Pencil" size={12} />
                                      </button>
                                      <button title="Удалить"
                                        onClick={e => { e.stopPropagation(); удалитьПроект(f as RecentProject) }}
                                        className="w-6 h-6 flex items-center justify-center rounded bg-black/60 text-gray-300 hover:text-white hover:bg-red-600">
                                        <Icon name="Trash2" size={12} />
                                      </button>
                                    </>
                                  )}
                                </div>
                                <div className="absolute bottom-1 left-1">
                                  <Icon name="Monitor" size={12} className="text-gray-600" />
                                </div>
                              </div>
                              {/* Инфо */}
                              <div className="p-3 border-t border-gray-700">
                                <div className="text-white text-[12px] font-semibold truncate">{f.name}</div>
                                <div className="text-gray-500 text-[10px] mt-1 flex items-center gap-1">
                                  {"ts" in f && (f as RecentProject).ts
                                    ? <span className="text-[#0078d4]">изменён {относительноеВремя((f as RecentProject).ts)}</span>
                                    : <span>{f.date}</span>}
                                </div>
                                <div className="flex items-center gap-1 mt-1.5">
                                  <Icon name="Monitor" size={10} className="text-gray-600" />
                                  <span className="text-[9px] text-gray-600">{f.ext.toUpperCase()} · {f.size}</span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        /* Файлы — List */
                        <div className="space-y-1">
                          {отфильтрованныеФайлы.map((f, i) => (
                            <motion.div key={f.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.03 }}
                              onClick={() => "projectId" in f ? открытьПроект(f as RecentProject) : setActiveModule(f.id)}
                              className="w-full flex items-center gap-4 p-3 rounded-lg text-left hover:bg-[#252535] transition-colors border border-transparent hover:border-gray-700 group cursor-pointer">
                              <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                                <ПревьюФайла тип={f.preview} цвет={f.color} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-white text-[13px] font-semibold truncate">{f.name}.{f.ext}</div>
                                <div className="text-gray-500 text-[11px]">
                                  {"ts" in f && (f as RecentProject).ts
                                    ? <><span className="text-[#0078d4]">изменён {относительноеВремя((f as RecentProject).ts)}</span> · {f.size}</>
                                    : <>{f.date} · {f.size}</>}
                                </div>
                              </div>
                              {"projectId" in f && (
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                  <button title="Переименовать"
                                    onClick={e => { e.stopPropagation(); переименоватьПроект(f as RecentProject) }}
                                    className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-[#0078d4]">
                                    <Icon name="Pencil" size={13} />
                                  </button>
                                  <button title="Удалить"
                                    onClick={e => { e.stopPropagation(); удалитьПроект(f as RecentProject) }}
                                    className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-red-600">
                                    <Icon name="Trash2" size={13} />
                                  </button>
                                </div>
                              )}
                              <Icon name="Monitor" size={14} className="text-gray-600 flex-shrink-0" />
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {homeВкладка === "возможности" && (
                    <FeaturesShowcase onOpen={(id) => setActiveModule(id)} />
                  )}

                  {homeВкладка === "модули" && (
                    <div className="flex-1 overflow-y-auto p-6" style={{ minHeight: 0 }}>
                      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          {текущееНаправление && !показатьВсеМодули && (
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${текущееНаправление.gradient} flex items-center justify-center shadow-lg`}>
                              <Icon name={текущееНаправление.icon} size={20} className="text-white" fallback="Square" />
                            </div>
                          )}
                          <div>
                            <h2 className="text-white text-xl font-bold leading-tight">{показатьВсеМодули ? "Все модули" : (текущееНаправление?.label ?? "Все модули")}</h2>
                            <p className="text-gray-500 text-[12px]">{показатьВсеМодули ? `${MODULES.length} инструментов платформы` : текущееНаправление?.desc}</p>
                          </div>
                        </div>
                        <button onClick={сброситьНаправление}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-[#0078d4] text-[12px] transition-colors">
                          <Icon name="RefreshCw" size={13} />Сменить направление
                        </button>
                      </div>
                      {избранныеМодули.length > 0 && (
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Icon name="Star" size={15} className="text-amber-400" />
                            <h3 className="text-white text-[14px] font-bold">Избранное</h3>
                            <span className="text-gray-500 text-[11px]">{избранныеМодули.length}</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {избранныеМодули.map(m => (
                              <div key={m.id} onClick={() => setActiveModule(m.id)}
                                className="relative text-left p-4 rounded-xl border border-amber-500/40 hover:border-amber-400 transition-all cursor-pointer group"
                                style={{ background: "linear-gradient(135deg,#1a1710,#111827)" }}>
                                <button title="Убрать из избранного" onClick={e => { e.stopPropagation(); переключитьИзбранное(m.id) }}
                                  className="absolute top-2 right-2 text-amber-400 hover:scale-110 transition-transform">
                                  <Icon name="Star" size={16} className="fill-amber-400 text-amber-400" />
                                </button>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "#f59e0b20" }}>
                                  <Icon name={m.icon} size={20} className="text-amber-400" fallback="Square" />
                                </div>
                                <div className="text-white text-[13px] font-semibold leading-tight">{m.label}</div>
                                <div className="text-gray-500 text-[11px] mt-1 leading-tight">{m.desc}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {модулиДляВкладки.map((m, i) => {
                          const вИзбранном = избранное.includes(m.id)
                          return (
                          <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            onClick={() => setActiveModule(m.id)}
                            className="relative text-left p-4 rounded-xl border border-gray-700 hover:border-[#0078d4] hover:bg-[#1e1e30] transition-all group cursor-pointer"
                            style={{ background: "#111827" }}>
                            <button title={вИзбранном ? "Убрать из избранного" : "В избранное"} onClick={e => { e.stopPropagation(); переключитьИзбранное(m.id) }}
                              className={`absolute top-2 right-2 transition-all hover:scale-110 ${вИзбранном ? "text-amber-400" : "text-gray-600 opacity-0 group-hover:opacity-100 hover:text-amber-400"}`}>
                              <Icon name="Star" size={16} className={вИзбранном ? "fill-amber-400 text-amber-400" : ""} />
                            </button>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "#0078d420" }}>
                              <Icon name={m.icon} size={20} className="text-[#0078d4]" fallback="Square" />
                            </div>
                            <div className="text-white text-[13px] font-semibold leading-tight">{m.label}</div>
                            <div className="text-gray-500 text-[11px] mt-1 leading-tight">{m.desc}</div>
                          </motion.div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {homeВкладка === "шаблоны" && (() => {
                    const шаблоныНапр = (текущееНаправление && !всеШаблоны)
                      ? ШАБЛОНЫ.filter(ш => текущееНаправление.modules.includes(ш.id))
                      : ШАБЛОНЫ
                    const список = шаблоныНапр.length ? шаблоныНапр : ШАБЛОНЫ
                    return (
                    <div className="flex-1 overflow-y-auto p-6">
                      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                        <div>
                          <h2 className="text-white text-xl font-bold leading-tight">Шаблоны проектов</h2>
                          <p className="text-gray-500 text-[12px]">
                            {текущееНаправление && !всеШаблоны ? `Для направления «${текущееНаправление.label}»` : "Все шаблоны платформы"}
                          </p>
                        </div>
                        {текущееНаправление && (
                          <button onClick={() => setВсеШаблоны(v => !v)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-[#0078d4] text-[12px] transition-colors">
                            <Icon name={всеШаблоны ? "Filter" : "LayoutGrid"} size={13} />
                            {всеШаблоны ? "Только направление" : "Все шаблоны"}
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {список.map((ш, i) => (
                          <motion.button key={ш.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            onClick={() => { setНовыйПроект(p => ({ ...p, template: ш.name })); setShowНовыйПроект(true) }}
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
                    )
                  })()}

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
                <div className="flex-shrink-0 flex flex-col border-l border-gray-800 overflow-y-auto" style={{ width: 240, background: "#141420" }}>
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
                      { label: "Документация", icon: "BookOpen", action: () => navigate("/docs") },
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
                className={FULLSCREEN_MODULES.includes(activeModule) ? "flex-1 min-h-0" : "flex-1 overflow-auto min-h-0"}
                style={FULLSCREEN_MODULES.includes(activeModule) ? {} : { background: "#f8fafc", padding: "1.5rem" }}>
                {current?.component ? (
                  <ErrorBoundary key={activeModule}>
                    <Suspense fallback={
                      <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
                        <Icon name="Loader" size={20} className="animate-spin" />Загрузка модуля…
                      </div>
                    }>
                      <current.component onNavigate={навигацияМодуль} />
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
                {(() => {
                  const списокШаблонов = (текущееНаправление && !всеШаблоны)
                    ? ШАБЛОНЫ.filter(ш => текущееНаправление.modules.includes(ш.id))
                    : ШАБЛОНЫ
                  const список = списокШаблонов.length ? списокШаблонов : ШАБЛОНЫ
                  const выбран = список.some(ш => ш.name === новыйПроект.template) ? новыйПроект.template : список[0].name
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] text-gray-400">
                          {текущееНаправление && !всеШаблоны ? `Шаблон — ${текущееНаправление.label}` : "Шаблон"}
                        </label>
                        {текущееНаправление && (
                          <button type="button" onClick={() => setВсеШаблоны(v => !v)}
                            className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-white transition-colors">
                            <Icon name={всеШаблоны ? "Filter" : "Layers"} size={11} className="text-[#0078d4]" />
                            {всеШаблоны ? "Только направление" : "Все шаблоны"}
                          </button>
                        )}
                      </div>
                      <select value={выбран} onChange={e => setНовыйПроект(p => ({ ...p, template: e.target.value }))}
                        className="w-full bg-[#2a2a3e] border border-gray-600 text-gray-300 text-[12px] px-3 py-2 rounded outline-none cursor-pointer focus:border-[#0078d4]">
                        {список.map(ш => <option key={ш.id}>{ш.name}</option>)}
                      </select>
                    </div>
                  )
                })()}
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button onClick={() => setShowНовыйПроект(false)}
                  className="px-4 py-2 text-[12px] text-gray-400 hover:text-white border border-gray-700 rounded transition-colors">
                  Отмена
                </button>
                <button onClick={создатьПроект} disabled={создаётся}
                  className="px-4 py-2 text-[12px] text-white rounded transition-colors disabled:opacity-60"
                  style={{ background: "#0078d4" }}>
                  {создаётся ? "Создаём…" : "Создать"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Диалог «Открыть» */}
      <AnimatePresence>
        {showОткрыть && (
          <OpenDialog onClose={() => setShowОткрыть(false)} onOpen={id => { setActiveModule(id); setShowОткрыть(false) }}
            directionModules={текущееНаправление?.modules} directionLabel={текущееНаправление?.label} />
        )}
      </AnimatePresence>

      {/* Диалог обратной связи / документация */}
      <AnimatePresence>
        {showОтзыв && (
          <FeedbackDialog тип={showОтзыв} onClose={() => setShowОтзыв(null)} />
        )}
      </AnimatePresence>

      {/* Глобальные уведомления из store (межмодульные) */}
      <AnimatePresence>
        {store?.notification && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-2xl text-[12px] font-semibold border"
            style={{
              background: store.notification.type === "success" ? "#052e16" : store.notification.type === "error" ? "#1f0a0a" : "#0f1729",
              borderColor: store.notification.type === "success" ? "#16a34a" : store.notification.type === "error" ? "#ef4444" : "#0078d4",
              color: store.notification.type === "success" ? "#4ade80" : store.notification.type === "error" ? "#f87171" : "#60a5fa",
            }}
          >
            <Icon
              name={store.notification.type === "success" ? "CheckCircle" : store.notification.type === "error" ? "AlertCircle" : "Info"}
              size={14}
              fallback="Info"
            />
            {store.notification.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  function setАктивнаяВкладкаModule(id: string) { setActiveModule(id) }
}