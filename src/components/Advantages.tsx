import { motion } from "framer-motion"
import Icon from "@/components/ui/icon"

const advantages = [
  {
    icon: "Box",
    accent: "bg-indigo-50 text-indigo-600",
    border: "hover:border-indigo-300",
    tag: "3D-моделирование",
    title: "Мощные инструменты для 3D-моделирования",
    description:
      "Реалистичные модели инфраструктурных объектов для анализа и визуализации проектных решений. Поверхности TIN, Grid, обрезанные, коридоры — полный набор для любых задач.",
    pills: ["TIN", "Grid", "Обрезанные", "Коридор"],
  },
  {
    icon: "Puzzle",
    accent: "bg-violet-50 text-violet-600",
    border: "hover:border-violet-300",
    tag: "Экосистема",
    title: "Интеграция с профессиональными CAD/BIM-системами",
    description:
      "Полная поддержка форматов DWG, IFC, LandXML, Shapefile, DXF. Единая среда для создания и управления проектными данными между разными дисциплинами.",
    pills: ["DWG", "IFC", "LandXML", "DXF"],
  },
  {
    icon: "BookCheck",
    accent: "bg-emerald-50 text-emerald-600",
    border: "hover:border-emerald-300",
    tag: "Стандарты",
    title: "Поддержка стандартов проектирования",
    description:
      "Множество международных стандартов для соответствия требованиям нормативных документов разных регионов. СП, ГОСТ, ISO, AASHTO — всё в одном продукте.",
    pills: ["СП РФ", "ГОСТ", "ISO", "AASHTO"],
  },
  {
    icon: "RefreshCw",
    accent: "bg-amber-50 text-amber-600",
    border: "hover:border-amber-300",
    tag: "Динамика",
    title: "Динамические модели",
    description:
      "Изменение одного элемента (например, отметки в точке) автоматически пересчитывает связанные объекты — поверхности, профили, поперечники. Огромная экономия времени по сравнению с ручным CAD.",
    pills: ["Поверхности", "Профили", "Поперечники"],
  },
]

export function Advantages() {
  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <span className="inline-block rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-600 mb-4">
            Преимущества
          </span>
          <h2 className="text-3xl font-extrabold font-heading text-gray-900 lg:text-5xl mb-4">
            Всё для проектирования — и даже больше
          </h2>
          <p className="text-muted-foreground lg:text-lg max-w-2xl mx-auto">
            Профессиональные инструменты проектирования — доступные без дорогой зарубежной подписки
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {advantages.map((a, i) => (
            <motion.div
              key={a.title}
              className={`group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm hover:shadow-lg ${a.border} hover:-translate-y-1 transition-all duration-300`}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease: "easeOut", delay: i * 0.1 }}
            >
              <div className="flex items-start gap-5">
                <div className={`rounded-2xl p-3.5 flex-shrink-0 ${a.accent} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon name={a.icon} size={28} fallback="Star" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full mb-2 ${a.accent}`}>
                    {a.tag}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 font-heading mb-2 leading-snug">
                    {a.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {a.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {a.pills.map(p => (
                      <span key={p} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}