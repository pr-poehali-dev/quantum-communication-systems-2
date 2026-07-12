import { motion } from "framer-motion"
import Icon from "@/components/ui/icon"

// 3D-фото возможностей
const IMG = {
  assembly: "https://cdn.poehali.dev/projects/1be7b031-c724-4235-9d1d-e20b0b34064c/files/02759407-3e72-48b2-aa47-c73b7d617bb0.jpg",
  road: "https://cdn.poehali.dev/projects/1be7b031-c724-4235-9d1d-e20b0b34064c/files/e6c01518-d053-4637-9870-b5b11817f052.jpg",
  bim: "https://cdn.poehali.dev/projects/1be7b031-c724-4235-9d1d-e20b0b34064c/files/30e77320-8a3c-4733-9d40-6cb241f6553e.jpg",
  survey: "https://cdn.poehali.dev/projects/1be7b031-c724-4235-9d1d-e20b0b34064c/files/9081867d-19ec-4515-9dee-4634e1ee8703.jpg",
}

const BIG = [
  {
    img: IMG.assembly, icon: "Component", accent: "#3a7bd5",
    title: "3D-сборка и разборка (КОМПАС-стиль)",
    desc: "Дерево компонентов, разнесённый вид, вращение модели и покадровая разборка по шагам как в ИЭТР Composer.",
    tags: ["Сборки", "Разнесение", "Пошаговая разборка", "STEP / IFC"],
  },
  {
    img: IMG.road, icon: "Route", accent: "#f97316",
    title: "Проектирование дорог и коридоров",
    desc: "Трассы по СП 34, продольные профили, коридоры и автопоперечники, расчёт объёмов земляных работ.",
    tags: ["Трассы", "Профили", "Коридоры", "Объёмы"],
  },
  {
    img: IMG.bim, icon: "Building2", accent: "#8b5cf6",
    title: "BIM: Revar (Revit + ArchiCAD)",
    desc: "Информационная модель здания, дисциплины, проверка коллизий, экспорт IFC и AI-ассистент проектировщика.",
    tags: ["IFC", "Коллизии", "Дисциплины", "AI"],
  },
  {
    img: IMG.survey, icon: "Mountain", accent: "#10b981",
    title: "Геодезия, ЦМР и облака точек",
    desc: "Точки COGO, съёмка тахеометром и GNSS, LiDAR-облака, TIN-поверхности, горизонтали, авто-чертёж по кодам.",
    tags: ["COGO", "LiDAR", "TIN", "SDR / LandXML"],
  },
]

const GRID = [
  { icon: "Cuboid", title: "САПР 3D-моделирование", desc: "Параметрические детали, эскизы, чертежи, спецификации", color: "#0891b2" },
  { icon: "Boxes", title: "САПР Про (SolidWorks-аналог)", desc: "Листовой металл, Simulation, Flow, CAM, PDM", color: "#ef4444" },
  { icon: "Network", title: "Инженерные сети", desc: "ВКС, ливневая, теплосеть, гидравлика, коллизии", color: "#3b82f6" },
  { icon: "Triangle", title: "Поверхности TIN / Grid", desc: "Триангуляция, горизонтали, анализ уклонов", color: "#10b981" },
  { icon: "ScanLine", title: "ЦМР / Облако точек", desc: "LiDAR, GNSS, тахеометр, фотограмметрия", color: "#8b5cf6" },
  { icon: "Layers", title: "BIM-инструменты", desc: "IFC-модель, коллизии, экспорт", color: "#7c3aed" },
  { icon: "BarChart3", title: "Анализ и расчёты", desc: "Объёмы, откосы, дренаж, гидрология", color: "#0ea5e9" },
  { icon: "ClipboardList", title: "Ведомости и спецификации", desc: "Объёмы, смета, координаты, экспорт", color: "#059669" },
  { icon: "Puzzle", title: "Интеграция форматов", desc: "DWG, IFC, LandXML, DXF, SHP, SDR", color: "#0d9488" },
  { icon: "BookCheck", title: "Стандарты проектирования", desc: "СП, ГОСТ, AASHTO, EN, ISO", color: "#eab308" },
  { icon: "Train", title: "Ж/д пути", desc: "Классы пути, CANT-кривые, тяговые расчёты", color: "#c2410c" },
  { icon: "Printer", title: "Публикация и печать", desc: "PDF, DWF, CTB/STB, пакеты листов", color: "#e11d48" },
]

const STATS = [
  { value: "24", label: "рабочих модуля" },
  { value: "200+", label: "функций 2022–2027" },
  { value: "4", label: "САПР в одной среде" },
  { value: "12+", label: "форматов обмена" },
]

export function CapabilitiesShowcase() {
  return (
    <section className="py-20 px-6">
      <div className="mx-auto max-w-6xl">
        <motion.div className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-4">
            <Icon name="Sparkles" size={13} /> Все возможности платформы
          </div>
          <h2 className="text-3xl font-extrabold font-heading text-gray-900 lg:text-5xl mb-4">
            Полный набор инструментов<br className="hidden lg:block" /> с 3D-моделированием
          </h2>
          <p className="text-muted-foreground lg:text-lg max-w-2xl mx-auto">
            От геодезии и дорог до BIM и машиностроения — всё в едином окне, с наглядной 3D-визуализацией
          </p>
        </motion.div>

        {/* Цифры */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {STATS.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-2xl bg-white/70 backdrop-blur border border-white/60 shadow-sm p-5 text-center">
              <div className="text-indigo-600 text-3xl font-extrabold">{s.value}</div>
              <div className="text-gray-600 text-sm mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Крупные карточки с фото */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-14">
          {BIG.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="group rounded-3xl overflow-hidden bg-white shadow-lg border border-gray-100 hover:shadow-2xl transition-shadow">
              <div className="relative" style={{ height: 220 }}>
                <img src={f.img} alt={f.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.35) 100%)" }} />
                <div className="absolute top-4 left-4 w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur shadow-lg" style={{ background: f.accent + "e6" }}>
                  <Icon name={f.icon} size={20} className="text-white" fallback="Square" />
                </div>
                <span className="absolute top-4 right-4 text-[11px] px-2.5 py-1 rounded-full bg-black/50 border border-white/20 text-white flex items-center gap-1">
                  <Icon name="Box" size={12} /> 3D
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-gray-900 text-lg font-bold mb-1.5">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{f.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {f.tags.map(t => (
                    <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">{t}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Сетка всех инструментов */}
        <motion.h3 className="text-2xl font-extrabold text-gray-900 text-center mb-8"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          И ещё 12 профессиональных инструментов
        </motion.h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {GRID.map((c, i) => (
            <motion.div key={c.title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (i % 4) * 0.05 }}
              className="rounded-2xl bg-white/80 backdrop-blur border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: c.color + "1a" }}>
                <Icon name={c.icon} size={20} style={{ color: c.color }} fallback="Square" />
              </div>
              <div className="text-gray-900 font-bold text-sm">{c.title}</div>
              <div className="text-gray-500 text-xs mt-1 leading-snug">{c.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CapabilitiesShowcase
