import { motion } from "framer-motion"
import Icon from "@/components/ui/icon"

// 3D-фото возможностей (сгенерированы)
const IMG = {
  assembly: "https://cdn.poehali.dev/projects/1be7b031-c724-4235-9d1d-e20b0b34064c/files/02759407-3e72-48b2-aa47-c73b7d617bb0.jpg",
  road: "https://cdn.poehali.dev/projects/1be7b031-c724-4235-9d1d-e20b0b34064c/files/e6c01518-d053-4637-9870-b5b11817f052.jpg",
  bim: "https://cdn.poehali.dev/projects/1be7b031-c724-4235-9d1d-e20b0b34064c/files/30e77320-8a3c-4733-9d40-6cb241f6553e.jpg",
  survey: "https://cdn.poehali.dev/projects/1be7b031-c724-4235-9d1d-e20b0b34064c/files/9081867d-19ec-4515-9dee-4634e1ee8703.jpg",
}

interface Feature {
  module: string
  title: string
  desc: string
  img: keyof typeof IMG
  icon: string
  tags: string[]
  accent: string
}

// Крупные карточки-возможности с фото и 3D
const FEATURES: Feature[] = [
  {
    module: "assembly", title: "3D-сборка и разборка (КОМПАС-стиль)",
    desc: "Дерево компонентов, разнесённый вид, вращение модели, покадровая разборка по шагам как в ИЭТР Composer.",
    img: "assembly", icon: "Component", accent: "#3a7bd5",
    tags: ["Сборки", "Разнесение", "Пошаговая разборка", "STEP / IFC"],
  },
  {
    module: "civilcad", title: "Проектирование дорог и коридоров",
    desc: "Трассы по СП 34, продольные профили, коридоры, автопоперечники, расчёт объёмов земляных работ.",
    img: "road", icon: "Route", accent: "#f97316",
    tags: ["Трассы", "Профили", "Коридоры", "Объёмы"],
  },
  {
    module: "revar", title: "BIM: Revar (Revit + ArchiCAD)",
    desc: "Информационная модель здания, дисциплины, проверка коллизий, экспорт IFC, AI-ассистент проектировщика.",
    img: "bim", icon: "Building2", accent: "#8b5cf6",
    tags: ["IFC", "Коллизии", "Дисциплины", "AI"],
  },
  {
    module: "geodesy", title: "Геодезия, ЦМР и облака точек",
    desc: "Точки COGO, съёмка тахеометром и GNSS, LiDAR-облака, TIN-поверхности, горизонтали, авто-чертёж по кодам.",
    img: "survey", icon: "Mountain", accent: "#10b981",
    tags: ["COGO", "LiDAR", "TIN", "SDR / LandXML"],
  },
]

// Компактные возможности (иконочная сетка)
const CAPABILITIES: { module: string; icon: string; title: string; desc: string; color: string }[] = [
  { module: "sapr", icon: "Cuboid", title: "САПР 3D-моделирование", desc: "Параметрические детали, эскизы, чертежи, спецификации", color: "#0891b2" },
  { module: "saprpro", icon: "Boxes", title: "САПР Про (SolidWorks-аналог)", desc: "Листовой металл, Simulation, Flow, CAM, PDM", color: "#ef4444" },
  { module: "networks", icon: "Network", title: "Инженерные сети", desc: "ВКС, ливневая, теплосеть, гидравлика, коллизии", color: "#3b82f6" },
  { module: "surfaces", icon: "Triangle", title: "Поверхности TIN / Grid", desc: "Триангуляция, горизонтали, анализ уклонов", color: "#10b981" },
  { module: "dtm", icon: "ScanLine", title: "ЦМР / Облако точек", desc: "LiDAR, GNSS, тахеометр, фотограмметрия", color: "#8b5cf6" },
  { module: "bim", icon: "Layers", title: "BIM-инструменты", desc: "IFC-модель, коллизии, экспорт", color: "#7c3aed" },
  { module: "analysis", icon: "BarChart3", title: "Анализ и расчёты", desc: "Объёмы, откосы, дренаж, гидрология", color: "#0ea5e9" },
  { module: "specs", icon: "ClipboardList", title: "Ведомости и спецификации", desc: "Объёмы, смета, координаты, экспорт", color: "#059669" },
  { module: "integration", icon: "Puzzle", title: "Интеграция форматов", desc: "DWG, IFC, LandXML, DXF, SHP, SDR", color: "#0d9488" },
  { module: "standards", icon: "BookCheck", title: "Стандарты проектирования", desc: "СП, ГОСТ, AASHTO, EN, ISO", color: "#eab308" },
  { module: "railway", icon: "Train", title: "Ж/д пути", desc: "Классы пути, CANT-кривые, тяговые расчёты", color: "#c2410c" },
  { module: "publish", icon: "Printer", title: "Публикация и печать", desc: "PDF, DWF, CTB/STB, пакеты листов", color: "#e11d48" },
]

// Ключевые цифры платформы
const STATS = [
  { value: "24", label: "рабочих модуля" },
  { value: "200+", label: "функций 2022–2027" },
  { value: "4", label: "САПР: AutoCAD · Civil 3D · КОМПАС · SOLIDWORKS" },
  { value: "12", label: "форматов обмена" },
]

export default function FeaturesShowcase({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* ── Герой с 3D-фото ── */}
      <div className="relative overflow-hidden" style={{ minHeight: 300 }}>
        <img src={IMG.assembly} alt="3D-сборка" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, #12121fee 0%, #12121fcc 45%, #12121f55 100%)" }} />
        <div className="relative px-8 py-10 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0078d4]/20 border border-[#0078d4]/40 text-[#7db3ff] text-[11px] mb-4">
              <Icon name="Sparkles" size={12} /> Все возможности платформы
            </div>
            <h1 className="text-white text-3xl sm:text-4xl font-extrabold leading-tight mb-3">
              ЛАПА 3D — единая среда<br />инфраструктуры, BIM и САПР
            </h1>
            <p className="text-gray-300 text-[14px] leading-relaxed mb-5 max-w-xl">
              Проектирование дорог и сетей, геодезия и ЦМР, BIM-моделирование, 3D-сборки в стиле КОМПАС
              и полный набор функций AutoCAD, Civil 3D, КОМПАС-3D и SOLIDWORKS — в одном окне.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => onOpen("assembly")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0078d4] hover:bg-[#0a86e6] text-white text-[13px] font-semibold transition-colors">
                <Icon name="Component" size={16} /> Открыть 3D-сборку
              </button>
              <button onClick={() => onOpen("civilcad")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white text-[13px] font-semibold transition-colors">
                <Icon name="Monitor" size={16} /> Запустить редактор
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Цифры ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gray-800" style={{ background: "#1a1a2e" }}>
        {STATS.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="p-5 border-b border-r border-gray-800 text-center" style={{ background: "#111827" }}>
            <div className="text-[#7db3ff] text-2xl font-extrabold">{s.value}</div>
            <div className="text-gray-500 text-[11px] mt-1 leading-tight">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Крупные возможности с фото ── */}
      <div className="p-6 space-y-5">
        <h2 className="text-white text-xl font-bold flex items-center gap-2">
          <Icon name="LayoutGrid" size={18} className="text-[#0078d4]" /> Ключевые возможности
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {FEATURES.map((f, i) => (
            <motion.button key={f.module} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              onClick={() => onOpen(f.module)}
              className="group text-left rounded-2xl overflow-hidden border border-gray-700 hover:border-[#0078d4] transition-all"
              style={{ background: "#111827" }}>
              <div className="relative" style={{ height: 190 }}>
                <img src={IMG[f.img]} alt={f.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 40%, #111827 100%)" }} />
                <div className="absolute top-3 left-3 w-9 h-9 rounded-lg flex items-center justify-center backdrop-blur" style={{ background: f.accent + "cc" }}>
                  <Icon name={f.icon} size={18} className="text-white" fallback="Square" />
                </div>
                <span className="absolute top-3 right-3 text-[10px] px-2 py-1 rounded-full bg-black/50 border border-white/15 text-white flex items-center gap-1">
                  <Icon name="Box" size={11} /> 3D
                </span>
              </div>
              <div className="p-4">
                <div className="text-white text-[15px] font-bold mb-1 group-hover:text-[#7db3ff] transition-colors">{f.title}</div>
                <div className="text-gray-400 text-[12px] leading-snug mb-3">{f.desc}</div>
                <div className="flex flex-wrap gap-1.5">
                  {f.tags.map(t => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full text-gray-300 border border-white/10" style={{ background: "rgba(255,255,255,0.04)" }}>{t}</span>
                  ))}
                </div>
                <div className="flex items-center gap-1 mt-3 text-[12px] font-semibold" style={{ color: f.accent }}>
                  Открыть <Icon name="ArrowRight" size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* ── Все возможности (сетка) ── */}
        <h2 className="text-white text-xl font-bold flex items-center gap-2 pt-3">
          <Icon name="Grid3x3" size={18} className="text-[#0078d4]" /> Все инструменты
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {CAPABILITIES.map((c, i) => (
            <motion.button key={c.module} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              onClick={() => onOpen(c.module)}
              className="text-left p-4 rounded-xl border border-gray-700 hover:border-[#0078d4] hover:bg-[#1e1e30] transition-all group"
              style={{ background: "#111827" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2.5" style={{ background: c.color + "22" }}>
                <Icon name={c.icon} size={18} style={{ color: c.color }} fallback="Square" />
              </div>
              <div className="text-white text-[13px] font-semibold leading-tight group-hover:text-[#7db3ff] transition-colors">{c.title}</div>
              <div className="text-gray-500 text-[11px] mt-1 leading-tight">{c.desc}</div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}
