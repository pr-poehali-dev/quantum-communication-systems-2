import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

interface Hero7Props {
  heading?: string
  description?: string
  button?: {
    text: string
    url: string
  }
}

const HERO_IMG = "https://cdn.poehali.dev/projects/1be7b031-c724-4235-9d1d-e20b0b34064c/files/c5a69f6d-d04a-4de5-be08-f7e626f69fc7.jpg"
const SHOWCASE_1 = "https://cdn.poehali.dev/projects/1be7b031-c724-4235-9d1d-e20b0b34064c/files/3e3ffadc-1d01-488a-a806-9359c2b64fee.jpg"
const SHOWCASE_2 = "https://cdn.poehali.dev/projects/1be7b031-c724-4235-9d1d-e20b0b34064c/files/10ba111b-8934-4844-a571-5b9c30ce9567.jpg"

const Hero7 = ({
  heading = "Премиум шаблоны для продуктивности",
  description = "Стильные профессиональные шаблоны для повышения продуктивности и оптимизации рабочего процесса.",
  button = { text: "Смотреть шаблоны", url: "#" },
}: Hero7Props) => {
  return (
    <section className="pt-20 pb-12">
      <div className="container text-center">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <motion.h1
            className="text-3xl font-extrabold lg:text-6xl font-heading text-balance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}>
            {heading}
          </motion.h1>
          <motion.p
            className="text-muted-foreground text-balance lg:text-lg font-sans"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}>
            {description}
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}>
          <Button asChild size="lg" className="mt-10">
            <a href={button.url}>{button.text}</a>
          </Button>
        </motion.div>

        {/* Главный 3D-визуал */}
        <motion.div
          className="mt-14 mx-auto max-w-5xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.8 }}>
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            style={{ background: "linear-gradient(135deg, #0a1628 0%, #1e293b 100%)" }}>
            <img src={HERO_IMG} alt="ЛАПА — 3D-моделирование инфраструктуры"
              className="w-full h-auto" style={{ aspectRatio: "16/9", objectFit: "cover" }}/>
            {/* Glowing accents */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(circle at 20% 30%, rgba(79,195,247,0.15), transparent 50%), radial-gradient(circle at 80% 70%, rgba(249,115,22,0.12), transparent 50%)" }}/>
            {/* Plate */}
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center gap-3 px-4 py-2 rounded-xl backdrop-blur-md bg-black/40 border border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
                <span className="text-white text-sm font-semibold">Live 3D-моделирование</span>
              </div>
              <span className="text-gray-400 text-xs">·</span>
              <span className="text-cyan-300 text-xs font-mono">TIN · Коридоры · Сети · BIM</span>
            </div>
          </div>
        </motion.div>

        {/* Превью-карточки */}
        <motion.div
          className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 1 }}>
          {[
            { img: SHOWCASE_1, title: "Транспортные развязки", desc: "Многоуровневые коридоры, виражи, расчёт пропускной способности" },
            { img: SHOWCASE_2, title: "TIN-поверхности и рельеф", desc: "Триангуляция Делоне, горизонтали, водосборные бассейны" },
          ].map(c => (
            <div key={c.title} className="group relative rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-slate-900/40">
              <img src={c.img} alt={c.title} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-700"/>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent"/>
              <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                <div className="text-white font-bold text-base">{c.title}</div>
                <div className="text-gray-300 text-xs mt-0.5">{c.desc}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export { Hero7 }