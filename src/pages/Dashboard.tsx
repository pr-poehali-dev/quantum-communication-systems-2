import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import GeodesyModule from "@/modules/GeodesyModule"
import RoadsModule from "@/modules/RoadsModule"
import NetworksModule from "@/modules/NetworksModule"
import AnalysisModule from "@/modules/AnalysisModule"
import RailwayModule from "@/modules/RailwayModule"
import AreasModule from "@/modules/AreasModule"
import BIMModule from "@/modules/BIMModule"
import DynamicModule from "@/modules/DynamicModule"

const MODULES = [
  { id: "geodesy", icon: "Mountain", label: "Геодезия и рельеф", desc: "Точки, DTM, профиль, объёмы", component: GeodesyModule },
  { id: "roads", icon: "Route", label: "Дороги и трассы", desc: "Категории СП 34, профиль, сечение", component: RoadsModule },
  { id: "railway", icon: "Train", label: "Ж/д пути", desc: "Классы пути, тяговые расчёты", component: RailwayModule },
  { id: "networks", icon: "Network", label: "Инженерные сети", desc: "ВКС, теплосеть, гидравлика", component: NetworksModule },
  { id: "areas", icon: "LayoutDashboard", label: "Площадные объекты", desc: "Генплан, здания, ТЭП участка", component: AreasModule },
  { id: "bim", icon: "Layers", label: "BIM-инструменты", desc: "IFC-модель, коллизии, экспорт", component: BIMModule },
  { id: "analysis", icon: "BarChart3", label: "Анализ и расчёты", desc: "Объёмы, откосы, дренаж", component: AnalysisModule },
  { id: "dynamic", icon: "RefreshCw", label: "Динамические модели", desc: "Граф зависимостей, автопересчёт", component: DynamicModule },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [activeModule, setActiveModule] = useState<string | null>(null)

  useEffect(() => {
    if (!localStorage.getItem("civilpro_auth")) navigate("/login")
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem("civilpro_auth")
    navigate("/login")
  }

  const current = MODULES.find(m => m.id === activeModule)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {activeModule && (
            <button onClick={() => setActiveModule(null)} className="text-gray-400 hover:text-gray-700 mr-1">
              <Icon name="ChevronLeft" size={20} />
            </button>
          )}
          <div
            className="text-xl font-extrabold font-heading text-gray-900 cursor-pointer"
            onClick={() => setActiveModule(null)}
          >
            CivilPro
          </div>
          {current && (
            <>
              <span className="text-gray-300">/</span>
              <span className="text-sm font-semibold text-indigo-600">{current.label}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:block">test@test</span>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
            <Icon name="LogOut" size={15} />
            Выйти
          </Button>
        </div>
      </header>

      <main className="flex-1 flex">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-56 border-r border-gray-200 bg-white py-4 px-2 gap-1">
          {MODULES.map(m => (
            <button
              key={m.id}
              onClick={() => setActiveModule(m.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm ${
                activeModule === m.id
                  ? "bg-indigo-600 text-white shadow"
                  : "text-gray-600 hover:bg-gray-100"
              } ${!m.component ? "opacity-50" : ""}`}
            >
              <Icon name={m.icon} size={17} fallback="Square" />
              <span className="font-medium leading-tight">{m.label}</span>
              {!m.component && <Icon name="Lock" size={12} className="ml-auto opacity-50" />}
            </button>
          ))}
        </aside>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            {!activeModule ? (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="text-2xl font-extrabold font-heading text-gray-900 mb-1">Рабочее пространство</h1>
                <p className="text-muted-foreground mb-8">Выберите модуль для начала проектирования</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {MODULES.map((m, i) => (
                    <motion.button
                      key={m.id}
                      onClick={() => setActiveModule(m.id)}
                      className={`group rounded-2xl border text-left p-5 flex flex-col gap-3 transition-all duration-300 ${
                        m.component
                          ? "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md hover:-translate-y-1 cursor-pointer"
                          : "border-gray-100 bg-gray-50 cursor-not-allowed opacity-60"
                      }`}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: i * 0.05 }}
                    >
                      <div className={`rounded-xl p-3 w-fit transition-colors duration-300 ${m.component ? "bg-indigo-50 group-hover:bg-indigo-100" : "bg-gray-100"}`}>
                        <Icon name={m.icon} size={24} className={m.component ? "text-indigo-600" : "text-gray-400"} fallback="Square" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm leading-tight">{m.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 leading-tight">{m.desc}</div>
                      </div>
                      {!m.component && (
                        <span className="text-xs text-gray-400 flex items-center gap-1"><Icon name="Clock" size={11} />Скоро</span>
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={activeModule}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {current?.component ? (
                  <current.component />
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="rounded-2xl bg-indigo-50 p-6 mb-4">
                      <Icon name={current?.icon || "Square"} size={48} className="text-indigo-300" fallback="Square" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">{current?.label}</h2>
                    <p className="text-muted-foreground max-w-sm">Этот модуль находится в разработке и появится в следующем обновлении</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}