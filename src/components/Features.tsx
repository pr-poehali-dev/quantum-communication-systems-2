import { motion } from "framer-motion"
import Icon from "@/components/ui/icon"

const features = [
  {
    icon: "Component",
    title: "3D-сборки и моделирование в стиле КОМПАС",
    description:
      "Дерево компонентов, разнесённый вид, вращение модели и покадровая разборка по шагам как в ИЭТР. Плюс параметрические детали и обмен STEP / IFC.",
  },
  {
    icon: "Boxes",
    title: "Функции AutoCAD, Civil 3D, КОМПАС и SOLIDWORKS",
    description:
      "Свыше 200 рабочих функций четырёх ведущих САПР 2022–2027: моделирование, черчение, расчёты прочности, CFD, раскрой, спецификации — с реальными калькуляторами.",
  },
  {
    icon: "Route",
    title: "Дороги, ж/д пути, площадки и инженерные сети",
    description:
      "Проектирование автодорог по СП 34, железнодорожных путей, промышленных площадок и подземных коммуникаций с профилями, коридорами и расчётом объёмов.",
  },
  {
    icon: "Layers",
    title: "BIM, геодезия и анализ поверхностей",
    description:
      "BIM-модель с проверкой коллизий и экспортом IFC, съёмка COGO и LiDAR-облака, TIN-поверхности, горизонтали и автопостроение чертежа по кодам съёмки.",
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
}

export function Features() {
  return (
    <section className="py-20 px-6">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <h2 className="text-3xl font-extrabold font-heading text-gray-900 lg:text-5xl mb-4">
            Всё для профессионального проектирования
          </h2>
          <p className="text-muted-foreground lg:text-lg max-w-2xl mx-auto">
            Все возможности в одном продукте без дорогостоящей подписки
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              className="group rounded-2xl border border-gray-200 bg-white/70 backdrop-blur-sm p-8 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-300"
            >
              <div className="mb-5 inline-flex items-center justify-center rounded-xl bg-indigo-50 p-3 group-hover:bg-indigo-100 transition-colors duration-300">
                <Icon name={feature.icon} size={28} className="text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 font-heading">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}