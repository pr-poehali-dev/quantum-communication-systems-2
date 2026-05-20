import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Icon from "@/components/ui/icon"

const ROLES = [
  { id: "road", icon: "Route", label: "Дорожник", desc: "Проектирование автодорог, развязок, коридоров" },
  { id: "railway", icon: "Train", label: "Ж/д проектировщик", desc: "Пути, профили, тяговые расчёты" },
  { id: "networks", icon: "Network", label: "Сетевик", desc: "Водоснабжение, канализация, теплосеть" },
  { id: "geodesy", icon: "Mountain", label: "Геодезист", desc: "Топосъёмка, DTM, обработка данных" },
  { id: "bim", icon: "Layers", label: "BIM-координатор", desc: "IFC, коллизии, управление моделью" },
  { id: "manager", icon: "FolderKanban", label: "Руководитель проекта", desc: "Управление проектами, версии, команда" },
]

const UNITS = [
  { id: "metric", label: "Метрическая", sub: "м, км, м²" },
  { id: "imperial", label: "Имперская", sub: "фут, миля, кв. фут" },
]

const MODULES_PREVIEW = [
  { icon: "Monitor", label: "CivilCAD — Редактор", color: "bg-indigo-50 text-indigo-600" },
  { icon: "Box", label: "3D-вьюер", color: "bg-violet-50 text-violet-600" },
  { icon: "Route", label: "Дороги и трассы", color: "bg-orange-50 text-orange-600" },
  { icon: "Mountain", label: "Геодезия и рельеф", color: "bg-green-50 text-green-600" },
  { icon: "Network", label: "Инженерные сети", color: "bg-blue-50 text-blue-600" },
  { icon: "Layers", label: "BIM-инструменты", color: "bg-pink-50 text-pink-600" },
]

const STEPS = ["Приветствие", "Роль", "Единицы", "Тур"]

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [units, setUnits] = useState("metric")

  const finish = () => {
    const profile = JSON.parse(localStorage.getItem("civilpro_profile") || "{}")
    localStorage.setItem("civilpro_profile", JSON.stringify({ ...profile, name, role, units, onboarded: true }))
    localStorage.setItem("civilpro_units", units)
    navigate("/dashboard")
  }

  const skip = () => {
    const profile = JSON.parse(localStorage.getItem("civilpro_profile") || "{}")
    localStorage.setItem("civilpro_profile", JSON.stringify({ ...profile, onboarded: true }))
    navigate("/dashboard")
  }

  const canNext = [
    true,
    role !== "",
    true,
    true,
  ][step]

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "radial-gradient(125% 125% at 50% 10%, #fff 40%, #6366f1 100%)" }}
    >
      <div className="w-full max-w-2xl">
        {/* Skip */}
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => navigate("/login")} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
            <Icon name="ChevronLeft" size={15} /> Назад ко входу
          </button>
          <button onClick={skip} className="text-sm text-gray-400 hover:text-gray-600">
            Пропустить →
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${i < step ? "bg-indigo-600 text-white" : i === step ? "bg-indigo-600 text-white ring-4 ring-indigo-100" : "bg-gray-100 text-gray-400"}`}>
                {i < step ? <Icon name="Check" size={13} /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-indigo-600" : "text-gray-400"}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`w-8 h-0.5 ${i < step ? "bg-indigo-400" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Шаг 0 — Приветствие */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }}
              className="rounded-3xl bg-white shadow-xl p-8 space-y-6 border border-gray-100">
              <div className="text-center space-y-2">
                <div className="text-4xl font-extrabold text-gray-900 font-heading">Добро пожаловать в ЛАПА</div>
                <p className="text-muted-foreground text-lg">Настроим рабочее пространство за пару шагов</p>
              </div>
              <div className="space-y-2 max-w-sm mx-auto">
                <Label htmlFor="onb-name" className="text-sm font-semibold">Как вас зовут?</Label>
                <Input
                  id="onb-name"
                  placeholder="Иванов Александр"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="text-base"
                  autoFocus
                />
              </div>
              <div className="flex justify-center">
                <Button onClick={() => setStep(1)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 gap-2">
                  Начать <Icon name="ArrowRight" size={16} />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Шаг 1 — Роль */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }}
              className="rounded-3xl bg-white shadow-xl p-8 space-y-5 border border-gray-100">
              <div className="text-center space-y-1">
                <div className="text-2xl font-extrabold text-gray-900 font-heading">Ваша специализация</div>
                <p className="text-muted-foreground text-sm">Это поможет настроить нужные модули по умолчанию</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ROLES.map(r => (
                  <button key={r.id} onClick={() => setRole(r.id)}
                    className={`rounded-2xl border p-4 text-left transition-all flex flex-col gap-2 ${role === r.id ? "border-indigo-500 bg-indigo-50 shadow-sm" : "border-gray-200 bg-white hover:border-indigo-200"}`}>
                    <div className={`rounded-xl p-2 w-fit ${role === r.id ? "bg-indigo-100" : "bg-gray-100"}`}>
                      <Icon name={r.icon} size={20} className={role === r.id ? "text-indigo-600" : "text-gray-500"} fallback="Briefcase" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-900">{r.label}</div>
                      <div className="text-xs text-muted-foreground leading-tight mt-0.5">{r.desc}</div>
                    </div>
                    {role === r.id && <Icon name="CheckCircle" size={16} className="text-indigo-600 self-end" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setStep(0)} className="gap-1"><Icon name="ArrowLeft" size={15} /> Назад</Button>
                <Button onClick={() => setStep(2)} disabled={!canNext} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 gap-2">
                  Далее <Icon name="ArrowRight" size={16} />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Шаг 2 — Единицы измерения */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }}
              className="rounded-3xl bg-white shadow-xl p-8 space-y-6 border border-gray-100">
              <div className="text-center space-y-1">
                <div className="text-2xl font-extrabold text-gray-900 font-heading">Единицы измерения</div>
                <p className="text-muted-foreground text-sm">Выберите систему единиц для всего проекта</p>
              </div>
              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                {UNITS.map(u => (
                  <button key={u.id} onClick={() => setUnits(u.id)}
                    className={`rounded-2xl border p-5 text-center transition-all ${units === u.id ? "border-indigo-500 bg-indigo-50 shadow-sm" : "border-gray-200 bg-white hover:border-indigo-200"}`}>
                    <div className={`text-base font-bold mb-1 ${units === u.id ? "text-indigo-700" : "text-gray-800"}`}>{u.label}</div>
                    <div className="text-xs text-muted-foreground font-mono">{u.sub}</div>
                    {units === u.id && <Icon name="CheckCircle" size={16} className="text-indigo-600 mx-auto mt-2" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-1"><Icon name="ArrowLeft" size={15} /> Назад</Button>
                <Button onClick={() => setStep(3)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 gap-2">
                  Далее <Icon name="ArrowRight" size={16} />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Шаг 3 — Тур по модулям */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }}
              className="rounded-3xl bg-white shadow-xl p-8 space-y-5 border border-gray-100">
              <div className="text-center space-y-1">
                <div className="text-2xl font-extrabold text-gray-900 font-heading">
                  {name ? `Готово, ${name.split(" ")[0]}!` : "Всё готово!"}
                </div>
                <p className="text-muted-foreground text-sm">В вашем распоряжении {MODULES_PREVIEW.length}+ модулей для проектирования</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {MODULES_PREVIEW.map(m => (
                  <div key={m.label} className="rounded-xl border border-gray-100 bg-gray-50 p-3 flex items-center gap-3">
                    <div className={`rounded-lg p-2 flex-shrink-0 ${m.color}`}>
                      <Icon name={m.icon} size={18} fallback="Square" />
                    </div>
                    <span className="text-xs font-medium text-gray-700 leading-tight">{m.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-muted-foreground">И ещё 11 модулей для геодезии, BIM, анализа, нормативов и интеграции</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setStep(2)} className="gap-1"><Icon name="ArrowLeft" size={15} /> Назад</Button>
                <Button onClick={finish} className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 gap-2">
                  Начать работу <Icon name="Rocket" size={16} />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}