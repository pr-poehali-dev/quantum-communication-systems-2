import { useState } from "react"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import { CategoryFeaturesGrid } from "@/modules/VersionFeaturesPanel"

interface Standard {
  code: string; title: string; region: string; category: string
  year: number; status: "active" | "superseded" | "draft"
  summary: string; sections: string[]
}

const STANDARDS: Standard[] = [
  { code: "СП 34.13330.2021", title: "Автомобильные дороги", region: "РФ", category: "Дороги", year: 2021, status: "active", summary: "Проектирование автодорог всех категорий. Параметры трассы, профили, конструкции.", sections: ["Нормы трассирования", "Земляное полотно", "Дорожная одежда", "Обустройство", "Охрана среды"] },
  { code: "СП 119.13330.2017", title: "Железнодорожные пути промышленных предприятий", region: "РФ", category: "Ж/д", year: 2017, status: "active", summary: "Нормы проектирования железнодорожных путей промышленных предприятий.", sections: ["Классификация путей", "Профиль и план", "Стрелочные переводы", "Устройства сигнализации"] },
  { code: "СП 31.13330.2021", title: "Водоснабжение. Наружные сети и сооружения", region: "РФ", category: "Сети", year: 2021, status: "active", summary: "Проектирование наружных сетей водоснабжения, насосных станций, резервуаров.", sections: ["Системы водоснабжения", "Водозаборные сооружения", "Насосные станции", "Трубопроводы"] },
  { code: "СП 32.13330.2018", title: "Канализация. Наружные сети и сооружения", region: "РФ", category: "Сети", year: 2018, status: "active", summary: "Проектирование систем водоотведения, канализационных сетей и сооружений.", sections: ["Самотечные сети", "Напорные трубопроводы", "Насосные станции", "Очистные сооружения"] },
  { code: "СП 42.13330.2016", title: "Градостроительство. Планировка и застройка", region: "РФ", category: "Площадки", year: 2016, status: "active", summary: "Нормы планировки и застройки городских и сельских поселений.", sections: ["Жилые зоны", "Общественные территории", "Инженерная подготовка", "Транспорт"] },
  { code: "СП 45.13330.2017", title: "Земляные сооружения, основания и фундаменты", region: "РФ", category: "Основания", year: 2017, status: "active", summary: "Проектирование земляных сооружений, расчёт устойчивости откосов.", sections: ["Откосы выемок", "Насыпи", "Дренаж", "Укрепление"] },
  { code: "AASHTO GDHS-7", title: "Нормы геометрического проектирования автодорог и улиц", region: "США", category: "Дороги", year: 2018, status: "active", summary: "Американский стандарт геометрического проектирования автомобильных дорог.", sections: ["Расчётная скорость", "Горизонтальная трасса", "Вертикальный профиль", "Поперечный профиль"] },
  { code: "EN 13803", title: "Ж/д — параметры проектирования трассы пути", region: "EU", category: "Ж/д", year: 2017, status: "active", summary: "Европейский стандарт параметров проектирования железнодорожной трассы.", sections: ["Горизонтальные кривые", "Вертикальные кривые", "Возвышение и скручивание", "Переходные кривые"] },
  { code: "ISO 19650", title: "Организация информации о зданиях и инженерных сооружениях", region: "ISO", category: "BIM", year: 2018, status: "active", summary: "Международный стандарт управления информацией BIM на протяжении жизненного цикла объекта.", sections: ["Концепции и принципы", "Фаза поставки", "Фаза эксплуатации", "Информационные требования"] },
  { code: "ГОСТ Р 21.1701-97", title: "Правила выполнения рабочей документации автомобильных дорог", region: "РФ", category: "Документация", year: 1997, status: "active", summary: "Требования к оформлению рабочих чертежей автодорог.", sections: ["Общие данные", "Планы трассы", "Продольные профили", "Поперечные профили"] },
  { code: "СП 58.13330.2019", title: "Гидротехнические сооружения", region: "РФ", category: "Водоотвод", year: 2019, status: "active", summary: "Проектирование гидротехнических сооружений, мостов, водопропускных труб.", sections: ["Мосты", "Трубы", "Дренаж", "Водоотвод"] },
  { code: "BS 5930", title: "Практическое руководство по инженерно-геологическим изысканиям", region: "UK", category: "Изыскания", year: 2015, status: "active", summary: "Британский стандарт инженерно-геологических изысканий.", sections: ["Кабинетные работы", "Полевые исследования", "Лабораторные испытания", "Отчётность"] },
]

const CATEGORIES = ["Все", "Дороги", "Ж/д", "Сети", "Площадки", "BIM", "Основания", "Документация", "Водоотвод", "Изыскания"]
const REGIONS = ["Все", "РФ", "США", "EU", "ISO", "UK"]

export default function StandardsModule() {
  const [search, setSearch] = useState("")
  const [cat, setCat] = useState("Все")
  const [region, setRegion] = useState("Все")
  const [selected, setSelected] = useState<Standard | null>(null)

  const filtered = STANDARDS.filter(s =>
    (cat === "Все" || s.category === cat) &&
    (region === "Все" || s.region === region) &&
    (s.code.toLowerCase().includes(search.toLowerCase()) || s.title.toLowerCase().includes(search.toLowerCase()))
  )

  const STATUS_STYLES: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    superseded: "bg-gray-100 text-gray-500",
    draft: "bg-yellow-100 text-yellow-700",
  }
  const STATUS_LABELS: Record<string, string> = { active: "Действующий", superseded: "Заменён", draft: "Проект" }

  const byRegion = REGIONS.slice(1).map(r => ({ r, count: STANDARDS.filter(s => s.region === r).length }))

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Tabs defaultValue="db">
        <TabsList className="mb-4">
          <TabsTrigger value="db">База нормативов</TabsTrigger>
          <TabsTrigger value="checker">Проверка соответствия</TabsTrigger>
          <TabsTrigger value="map">Охват регионов</TabsTrigger>
          <TabsTrigger value="cat-annotation">Аннотации</TabsTrigger>
          <TabsTrigger value="cat-plot">Печать</TabsTrigger>
        </TabsList>

        {/* DATABASE */}
        <TabsContent value="db" className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Input placeholder="Поиск по коду или названию…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-64" />
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>{REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground ml-auto">{filtered.length} из {STANDARDS.length}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* list */}
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {filtered.map(s => (
                <button key={s.code} onClick={() => setSelected(selected?.code === s.code ? null : s)}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${selected?.code === s.code ? "border-indigo-400 bg-indigo-50" : "border-gray-200 bg-white hover:border-indigo-200 hover:shadow-sm"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono font-bold text-indigo-700 text-sm">{s.code}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[s.status]}`}>{STATUS_LABELS[s.status]}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s.region}</span>
                      </div>
                      <div className="text-sm font-semibold text-gray-800 leading-tight">{s.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{s.category} · {s.year}</div>
                    </div>
                    <Icon name="ChevronRight" size={16} className={`flex-shrink-0 mt-1 transition-transform ${selected?.code === s.code ? "rotate-90 text-indigo-600" : "text-gray-300"}`} />
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Icon name="Search" size={32} className="mx-auto mb-2 text-gray-200" />
                  <p>Норматив не найден</p>
                </div>
              )}
            </div>

            {/* detail */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              {selected ? (
                <motion.div key={selected.code} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div>
                    <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-semibold mb-2 ${STATUS_STYLES[selected.status]}`}>{STATUS_LABELS[selected.status]}</span>
                    <div className="font-mono font-bold text-indigo-700 text-lg">{selected.code}</div>
                    <div className="font-bold text-gray-900 mt-1 leading-tight">{selected.title}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {[["Регион", selected.region], ["Категория", selected.category], ["Год", selected.year], ["Статус", STATUS_LABELS[selected.status]]].map(([k, v]) => (
                      <div key={k} className="rounded-lg bg-gray-50 px-3 py-2">
                        <div className="text-xs text-gray-400">{k}</div>
                        <div className="font-semibold text-gray-800">{v}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 mb-1">Описание</div>
                    <p className="text-sm text-gray-600 leading-relaxed">{selected.summary}</p>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 mb-2">Разделы</div>
                    <div className="space-y-1">
                      {selected.sections.map((sec, i) => (
                        <div key={sec} className="flex items-center gap-2 text-sm text-gray-700">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                          {sec}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                  <Icon name="BookOpen" size={40} className="text-gray-200 mb-3" />
                  <p className="text-sm text-muted-foreground">Выберите норматив для просмотра</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* CHECKER */}
        <TabsContent value="checker" className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Автоматическая проверка параметров проекта</h3>
            <div className="space-y-3">
              {[
                { param: "Радиус горизонтальной кривой", value: "800 м", min: "600 м", norm: "СП 34.13330 п.5.3", ok: true },
                { param: "Продольный уклон", value: "4.5%", min: "макс. 5%", norm: "СП 34.13330 п.5.4", ok: true },
                { param: "Скорость течения в трубе", value: "3.8 м/с", min: "0.7–3.0 м/с", norm: "СП 31.13330 п.8.3", ok: false },
                { param: "Коэффициент застройки", value: "45%", min: "макс. 60%", norm: "СП 42.13330 п.7.5", ok: true },
                { param: "Минимальное расстояние до застройки", value: "35 м", min: "мин. 25 м", norm: "СП 34.13330 п.11.1", ok: true },
                { param: "Коэффициент устойчивости откоса", value: "1.18", min: "мин. 1.5", norm: "СП 45.13330 п.8.2", ok: false },
              ].map(c => (
                <div key={c.param} className={`rounded-xl border p-4 flex items-center gap-4 ${c.ok ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                  <Icon name={c.ok ? "CheckCircle" : "XCircle"} size={22} className={c.ok ? "text-green-600 flex-shrink-0" : "text-red-600 flex-shrink-0"} />
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-gray-800">{c.param}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Норма: {c.min} · {c.norm}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono font-bold text-sm ${c.ok ? "text-green-700" : "text-red-700"}`}>{c.value}</div>
                    <div className={`text-xs ${c.ok ? "text-green-600" : "text-red-600"}`}>{c.ok ? "✓ В норме" : "✗ Нарушение"}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* MAP */}
        <TabsContent value="map">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {byRegion.map(({ r, count }) => (
              <div key={r} className="rounded-xl border border-gray-200 bg-white p-5 text-center">
                <div className="text-3xl font-extrabold text-indigo-600 font-heading">{count}</div>
                <div className="text-sm font-semibold text-gray-700 mt-1">{r}</div>
                <div className="text-xs text-muted-foreground">нормативов</div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Поддерживаемые системы стандартов</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { region: "🇷🇺 Россия", stds: "СП, ГОСТ, ВСН, СНиП (актуализированные)", color: "border-l-blue-500" },
                { region: "🇺🇸 США / Северная Америка", stds: "AASHTO, FHWA, MUTCD, ACI", color: "border-l-red-500" },
                { region: "🇪🇺 Европейский союз", stds: "Eurocodes, EN, CEN", color: "border-l-yellow-500" },
                { region: "🌐 Международные", stds: "ISO, IEC, IAI (IFC)", color: "border-l-green-500" },
                { region: "🇬🇧 Великобритания", stds: "BS, PD, BRE", color: "border-l-purple-500" },
                { region: "🏗️ Отраслевые BIM", stds: "ISO 19650, PAS 1192, buildingSMART", color: "border-l-indigo-500" },
              ].map(s => (
                <div key={s.region} className={`rounded-lg border-l-4 ${s.color} bg-gray-50 px-4 py-3`}>
                  <div className="font-semibold text-gray-800 text-sm">{s.region}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.stds}</div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="cat-annotation"><CategoryFeaturesGrid category="annotation" /></TabsContent>
        <TabsContent value="cat-plot"><CategoryFeaturesGrid category="plot" /></TabsContent>
      </Tabs>
    </motion.div>
  )
}