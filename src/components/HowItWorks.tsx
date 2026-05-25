import { motion } from "framer-motion"
import { useState } from "react"
import Icon from "@/components/ui/icon"

const STEPS = [
  {
    num: "01",
    title: "Импорт данных",
    short: "Загрузите съёмку",
    desc: "Импортируйте точки съёмки из CSV/TXT, облако точек LiDAR (LAS/LAZ), DEM/GeoTIFF или геодезические данные с тахеометра. ЛАПА автоматически распознаёт коды точек и формирует группы.",
    img: "https://cdn.poehali.dev/projects/1be7b031-c724-4235-9d1d-e20b0b34064c/files/8506b040-1367-4961-8a78-b14d72d3acf3.jpg",
    color: "#22d3ee",
    features: ["CSV / TXT / RW5", "LiDAR LAS/LAZ", "GeoTIFF DEM", "Автокодирование"],
  },
  {
    num: "02",
    title: "Моделирование рельефа",
    short: "Постройте TIN",
    desc: "Постройте TIN-поверхность методом триангуляции Делоне. Добавьте структурные линии (Breaklines), исключения (Voids). Получите горизонтали, уклоны, водосборные бассейны автоматически.",
    img: "https://cdn.poehali.dev/projects/1be7b031-c724-4235-9d1d-e20b0b34064c/files/25b78827-e2d7-45c6-8b54-6048a3ec2e96.jpg",
    color: "#a78bfa",
    features: ["TIN Делоне", "Breaklines", "Горизонтали", "Уклоны и водосбор"],
  },
  {
    num: "03",
    title: "Проектирование",
    short: "Создайте инфраструктуру",
    desc: "Спроектируйте трассы с круговыми и переходными кривыми, продольные профили, коридоры с типовыми сечениями. Добавьте инженерные сети с автоматическим гидравлическим расчётом.",
    img: "https://cdn.poehali.dev/projects/1be7b031-c724-4235-9d1d-e20b0b34064c/files/2389f7cf-ba05-4db5-8c27-4ffd992d49c1.jpg",
    color: "#f97316",
    features: ["Трассы и коридоры", "Профили", "Сети ВКС", "BIM-модель"],
  },
]

const RESULTS = [
  { icon: "FileText", label: "Чертежи DWG / DXF", desc: "Готовая документация" },
  { icon: "BarChart3", label: "Ведомости объёмов", desc: "СНиП-форматы, Pay Items" },
  { icon: "Box",       label: "3D-модель IFC",    desc: "Экспорт в Revit / Navisworks" },
  { icon: "FileCode",  label: "LandXML / OBJ",    desc: "Обмен с любыми САПР" },
]

export function HowItWorks() {
  const [active, setActive] = useState(0)
  const step = STEPS[active]

  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-6xl">
        {/* Заголовок */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}>
          <span className="inline-block rounded-full bg-cyan-50 px-4 py-1.5 text-sm font-semibold text-cyan-700 mb-4">
            Как это работает
          </span>
          <h2 className="text-3xl font-extrabold font-heading text-gray-900 lg:text-5xl mb-4">
            От съёмки до 3D-модели за 3 шага
          </h2>
          <p className="text-muted-foreground lg:text-lg max-w-2xl mx-auto">
            Динамическая взаимосвязь объектов — измените одну отметку, и весь проект автоматически пересчитается.
          </p>
        </motion.div>

        {/* Степпер */}
        <div className="flex items-center justify-center gap-2 mb-10 flex-wrap">
          {STEPS.map((s, i) => (
            <button key={s.num} onClick={() => setActive(i)}
              className={`flex items-center gap-3 px-4 py-2 rounded-full border-2 transition-all ${
                active === i
                  ? "border-current text-white shadow-lg scale-105"
                  : "border-gray-300 text-gray-600 hover:border-gray-400 bg-white"
              }`}
              style={{ background: active === i ? s.color : undefined, borderColor: active === i ? s.color : undefined }}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${active === i ? "bg-white/20" : "bg-gray-100"}`}>
                {s.num}
              </span>
              <span className="font-semibold text-sm">{s.short}</span>
            </button>
          ))}
        </div>

        {/* Основной контент шага */}
        <motion.div
          key={active}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}>
          {/* Картинка */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 order-2 lg:order-1"
            style={{ background: "linear-gradient(135deg, #0a1628 0%, #1e293b 100%)" }}>
            <img src={step.img} alt={step.title} className="w-full h-auto" style={{ aspectRatio: "16/10", objectFit: "cover" }}/>
            {/* Glow overlay */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(circle at 30% 30%, ${step.color}22, transparent 60%)` }}/>
            {/* Step badge */}
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full backdrop-blur-md bg-black/50 border border-white/20 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: step.color }}/>
              <span className="text-white text-xs font-bold font-mono">Шаг {step.num}</span>
            </div>
          </div>

          {/* Текст */}
          <div className="order-1 lg:order-2">
            <div className="text-6xl font-extrabold font-mono mb-3" style={{ color: step.color }}>
              {step.num}
            </div>
            <h3 className="text-3xl font-bold font-heading text-gray-900 mb-3">{step.title}</h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">{step.desc}</p>

            <div className="grid grid-cols-2 gap-2.5 mb-6">
              {step.features.map(f => (
                <div key={f} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 shadow-sm">
                  <Icon name="Check" size={14} style={{ color: step.color }}/>
                  <span className="text-sm text-gray-700 font-medium">{f}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              {active > 0 && (
                <button onClick={() => setActive(a => a - 1)}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <Icon name="ChevronLeft" size={16}/>
                  Назад
                </button>
              )}
              {active < STEPS.length - 1 ? (
                <button onClick={() => setActive(a => a + 1)}
                  className="px-5 py-2.5 rounded-lg text-white font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                  style={{ background: step.color }}>
                  Следующий шаг
                  <Icon name="ChevronRight" size={16}/>
                </button>
              ) : (
                <a href="/login"
                  className="px-5 py-2.5 rounded-lg text-white font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 no-underline"
                  style={{ background: step.color }}>
                  Попробовать бесплатно
                  <Icon name="ArrowRight" size={16}/>
                </a>
              )}
            </div>
          </div>
        </motion.div>

        {/* Результат: что получите */}
        <motion.div
          className="mt-16 pt-12 border-t border-gray-200"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}>
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold font-heading text-gray-900 mb-2">Что вы получите на выходе</h3>
            <p className="text-muted-foreground">Готовая документация для согласования и строительства</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {RESULTS.map((r, i) => (
              <motion.div
                key={r.label}
                className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-cyan-300 transition-all text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}>
                <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center mx-auto mb-3">
                  <Icon name={r.icon} size={22} className="text-cyan-600"/>
                </div>
                <div className="font-bold text-gray-900 text-sm mb-1">{r.label}</div>
                <div className="text-xs text-muted-foreground">{r.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default HowItWorks
