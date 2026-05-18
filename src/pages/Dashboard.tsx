import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"

const modules = [
  { icon: "Mountain", label: "Геодезия и рельеф" },
  { icon: "Route", label: "Дороги и трассы" },
  { icon: "Train", label: "Ж/д пути" },
  { icon: "Network", label: "Инженерные сети" },
  { icon: "LayoutDashboard", label: "Площадные объекты" },
  { icon: "Layers", label: "BIM-инструменты" },
  { icon: "BarChart3", label: "Анализ и расчёты" },
  { icon: "RefreshCw", label: "Динамические модели" },
]

export default function Dashboard() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!localStorage.getItem("civilpro_auth")) {
      navigate("/login")
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem("civilpro_auth")
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
        <div className="text-xl font-extrabold font-heading text-gray-900">CivilPro</div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:block">test@test</span>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
            <Icon name="LogOut" size={16} />
            Выйти
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h1 className="text-2xl font-extrabold font-heading text-gray-900 mb-1">Добро пожаловать!</h1>
          <p className="text-muted-foreground mb-10">Выберите модуль для начала работы</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {modules.map((mod, index) => (
            <motion.button
              key={mod.label}
              className="group rounded-2xl border border-gray-200 bg-white p-6 flex flex-col items-center gap-3 shadow-sm hover:shadow-md hover:border-indigo-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.06 }}
            >
              <div className="rounded-xl bg-indigo-50 p-3 group-hover:bg-indigo-100 transition-colors duration-300">
                <Icon name={mod.icon} size={26} className="text-indigo-600" />
              </div>
              <span className="text-sm font-semibold text-gray-800 text-center leading-tight">{mod.label}</span>
            </motion.button>
          ))}
        </div>

        <motion.div
          className="mt-10 rounded-2xl border border-dashed border-indigo-300 bg-indigo-50/50 p-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Icon name="Construction" size={32} className="text-indigo-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-indigo-700">Это тестовый режим</p>
          <p className="text-xs text-muted-foreground mt-1">Функции модулей будут доступны в полной версии</p>
        </motion.div>
      </main>
    </div>
  )
}
