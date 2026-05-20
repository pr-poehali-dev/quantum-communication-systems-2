import { motion } from "framer-motion"
import Icon from "@/components/ui/icon"

const capabilities = [
  {
    icon: "Mountain",
    title: "Геодезические работы",
    description:
      "Создание и редактирование топографических моделей, съёмка местности, расчёт объёмов земляных работ. Поддержка цифровых моделей местности (DTM) с данными LiDAR.",
  },
  {
    icon: "Route",
    title: "Линейные объекты",
    description:
      "Дороги, трубопроводы, железнодорожные пути, ЛЭП. Анализ трасс, оценка влияния изменений на уклон, объём земляных работ и пропускную способность.",
  },
  {
    icon: "LayoutDashboard",
    title: "Площадные объекты",
    description:
      "Создание зданий, сооружений, полигонов, парковок и площадок. Управление формой и геометрией на основе данных рельефа.",
  },
  {
    icon: "Network",
    title: "Инженерные сети",
    description:
      "Разработка водопроводных, канализационных, энергетических и телекоммуникационных сетей. Анализ работы под нагрузкой, расчёт пропускной способности.",
  },
  {
    icon: "BarChart3",
    title: "Анализ проектных решений",
    description:
      "Расчёты устойчивости откосов, пропускной способности дренажных систем, надёжности и других характеристик — прямо в модели.",
  },
  {
    icon: "Puzzle",
    title: "Интеграция с экосистемой",
    description:
      "Совместимость с AutoCAD, Revit, InfraWorks, ReCap Pro. Единая среда для управления проектными данными между разными дисциплинами.",
  },
  {
    icon: "BookCheck",
    title: "Поддержка стандартов",
    description:
      "Соответствие международным стандартам и требованиям нормативных документов. Локализация под региональные нормы проектирования.",
  },
  {
    icon: "RefreshCw",
    title: "Динамические модели",
    description:
      "Изменение одного элемента автоматически пересчитывает все связанные объекты — поверхности, профили, поперечники. Экономия времени по сравнению с ручным CAD.",
  },
]

export function DetailedFeatures() {
  return (
    <section className="py-24 px-6 bg-white/50">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <span className="inline-block rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-600 mb-4">
            Полный функционал ЛАПА
          </span>
          <h2 className="text-3xl font-extrabold font-heading text-gray-900 lg:text-5xl mb-4">
            Все возможности в одном продукте
          </h2>
          <p className="text-muted-foreground lg:text-lg max-w-2xl mx-auto">
            Профессиональный инструмент для проектирования гражданской инфраструктуры —
            от геодезии до динамических BIM-моделей
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {capabilities.map((item, index) => (
            <motion.div
              key={item.title}
              className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-indigo-300 hover:-translate-y-1 transition-all duration-300"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.07 }}
            >
              <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-indigo-50 p-3 group-hover:bg-indigo-100 transition-colors duration-300">
                <Icon name={item.icon} size={24} className="text-indigo-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2 font-heading">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}