import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"

const plans = [
  {
    name: "Старт",
    price: "Бесплатно",
    period: "",
    description: "Для знакомства с платформой",
    highlight: false,
    features: [
      "До 3 проектов",
      "Базовые инструменты проектирования",
      "Поверхности и рельеф",
      "Экспорт в DWG",
      "Поддержка по email",
    ],
    cta: "Начать бесплатно",
  },
  {
    name: "Профи",
    price: "4 900 ₽",
    period: "/ мес",
    description: "Для инженеров и проектных бюро",
    highlight: true,
    features: [
      "Неограниченные проекты",
      "Дороги, ж/д пути, площадки",
      "Инженерные сети (ВКС, энергетика)",
      "Динамические взаимосвязи",
      "BIM-инструменты",
      "LiDAR и DTM-данные",
      "Интеграция с DWG / IFC / LandXML",
      "Командная работа и роли",
      "Приоритетная поддержка",
    ],
    cta: "Попробовать 14 дней бесплатно",
  },
]

export function Pricing() {
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
            Тарифные планы
          </span>
          <h2 className="text-3xl font-extrabold font-heading text-gray-900 lg:text-5xl mb-4">
            Прозрачные цены без сюрпризов
          </h2>
          <p className="text-muted-foreground lg:text-lg max-w-xl mx-auto">
            Зарубежный аналог стоит от $2 000/год. Мы — в разы доступнее, с тем же функционалом.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              className={`relative rounded-2xl border p-8 flex flex-col shadow-sm transition-all duration-300 ${
                plan.highlight
                  ? "border-indigo-500 bg-indigo-600 text-white shadow-indigo-200 shadow-xl scale-[1.02]"
                  : "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md"
              }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.1 }}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-yellow-400 px-4 py-1 text-xs font-bold text-yellow-900 shadow">
                    Популярный выбор
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-lg font-bold font-heading mb-1 ${plan.highlight ? "text-white" : "text-gray-900"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-4 ${plan.highlight ? "text-indigo-200" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>
                <div className="flex items-end gap-1">
                  <span className={`text-4xl font-extrabold font-heading ${plan.highlight ? "text-white" : "text-gray-900"}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={`text-sm mb-1 ${plan.highlight ? "text-indigo-200" : "text-muted-foreground"}`}>
                      {plan.period}
                    </span>
                  )}
                </div>
              </div>

              <ul className="flex-1 space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Icon
                      name="Check"
                      size={16}
                      className={`mt-0.5 shrink-0 ${plan.highlight ? "text-indigo-200" : "text-indigo-500"}`}
                    />
                    <span className={plan.highlight ? "text-indigo-100" : "text-gray-700"}>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                className={`w-full font-semibold ${
                  plan.highlight
                    ? "bg-white text-indigo-600 hover:bg-indigo-50"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}