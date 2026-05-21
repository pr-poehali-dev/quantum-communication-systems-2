import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Icon from "@/components/ui/icon"

// ─── Таблицы стилей печати ────────────────────────────────────────────────────

const CTB_TABLES = [
  {
    id: "mono", name: "Монохромный.ctb", type: "CTB",
    desc: "Все объекты печатаются чёрным цветом. Подходит для стандартных чертежей ГОСТ.",
    pens: 255, active: true,
    preview: ["#000000", "#000000", "#000000", "#000000", "#000000"],
  },
  {
    id: "color", name: "Цветной_ГОСТ.ctb", type: "CTB",
    desc: "Цветная печать с толщинами линий по ГОСТ 2.303. Слои → цвета → толщины.",
    pens: 255, active: false,
    preview: ["#ef4444", "#0078d4", "#16a34a", "#d97706", "#7c3aed"],
  },
  {
    id: "gray", name: "Полутоновой.ctb", type: "CTB",
    desc: "Полутоновая печать для различия слоёв при монохромном выводе.",
    pens: 255, active: false,
    preview: ["#111111", "#333333", "#666666", "#999999", "#cccccc"],
  },
  {
    id: "named_std", name: "Стандарт.stb", type: "STB",
    desc: "Именованные стили: Тонкая, Средняя, Толстая, Пунктир, Утолщённая. Независимы от цвета объекта.",
    pens: 0, active: false,
    styles: ["Тонкая 0.13", "Средняя 0.25", "Толстая 0.5", "Пунктир", "Утолщённая 0.7"],
  },
]

// ─── Листы для публикации ─────────────────────────────────────────────────────

const SHEETS = [
  { id: 1, name: "Лист 01 — Ситуационный план", selected: true, format: "A1", scale: "1:5000", status: "ready" },
  { id: 2, name: "Лист 02 — Генеральный план", selected: true, format: "A1", scale: "1:500", status: "ready" },
  { id: 3, name: "Лист 03 — План трассы", selected: true, format: "A1", scale: "1:1000", status: "ready" },
  { id: 4, name: "Лист 04 — Продольный профиль", selected: true, format: "A2", scale: "1:1000/1:100", status: "ready" },
  { id: 5, name: "Лист 05 — Поперечные профили", selected: false, format: "A3", scale: "1:100", status: "warning" },
  { id: 6, name: "Лист 06 — Инженерные сети", selected: true, format: "A1", scale: "1:500", status: "ready" },
  { id: 7, name: "Лист 07 — Вертикальная планировка", selected: false, format: "A1", scale: "1:500", status: "ready" },
  { id: 8, name: "Лист 08 — Ведомости и спецификации", selected: true, format: "A4", scale: "—", status: "ready" },
]

// ─── Шрифты SHX ──────────────────────────────────────────────────────────────

const SHX_FONTS = [
  { file: "gost.shx", name: "ГОСТ Тип А", desc: "Основной шрифт для российских стандартов", installed: true, size: "42 КБ" },
  { file: "gost_b.shx", name: "ГОСТ Тип Б", desc: "Широкий шрифт для заголовков", installed: true, size: "38 КБ" },
  { file: "isocp.shx", name: "ISO CP", desc: "Международный стандарт ISO 3098", installed: true, size: "35 КБ" },
  { file: "simplex.shx", name: "Simplex", desc: "Простой одноконтурный шрифт", installed: true, size: "28 КБ" },
  { file: "romans.shx", name: "Romans", desc: "Шрифт с засечками для аннотаций", installed: false, size: "51 КБ" },
  { file: "txt.shx", name: "TXT", desc: "Стандартный шрифт AutoCAD", installed: true, size: "22 КБ" },
]

// ─── Настройки плоттера ───────────────────────────────────────────────────────

const PLOTTERS = [
  { id: "pdf", name: "PDF (DWG To PDF)", icon: "FileDown", color: "#ef4444", desc: "Публикация в PDF-файл. Поддерживает слои, гиперссылки, встроенные шрифты." },
  { id: "dwf", name: "DWF (публикация)", icon: "Eye", color: "#6b7280", desc: "Облегчённый формат для просмотра и рецензирования без CAD." },
  { id: "png", name: "PNG (растр)", icon: "Image", color: "#0284c7", desc: "Экспорт в растровое изображение. Настраиваемое разрешение (72–600 DPI)." },
  { id: "printer", name: "Системный принтер", icon: "Printer", color: "#7c3aed", desc: "Вывод на физический принтер или МФУ, подключённый к системе." },
]

export default function PublishModule({ onNavigate }: { onNavigate?: (id: string) => void } = {}) {
  const [tab, setTab] = useState("sheets")
  const [sheets, setSheets] = useState(SHEETS)
  const [selectedPlotter, setSelectedPlotter] = useState("pdf")
  const [selectedCtb, setSelectedCtb] = useState("mono")
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [selectedPen, setSelectedPen] = useState<number | null>(null)

  const toggleSheet = (id: number) => {
    setSheets(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s))
  }
  const selectAll = () => setSheets(prev => prev.map(s => ({ ...s, selected: true })))
  const deselectAll = () => setSheets(prev => prev.map(s => ({ ...s, selected: false })))

  const handlePublish = () => {
    setPublishing(true)
    setTimeout(() => { setPublishing(false); setPublished(true); setTimeout(() => setPublished(false), 3000) }, 2200)
  }

  const selectedCount = sheets.filter(s => s.selected).length

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] overflow-hidden">
      {/* Шапка */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
            <Icon name="Printer" size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-gray-900">Публикация и печать</h1>
            <p className="text-[11px] text-gray-500">PDF, DWF, CTB/STB, пакеты листов, шрифты SHX</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs gap-1.5">
            <Icon name="Eye" size={13} />Предпросмотр
          </Button>
          <Button size="sm" className="text-xs gap-1.5 bg-red-600 hover:bg-red-700"
            onClick={handlePublish} disabled={publishing || selectedCount === 0}>
            {publishing
              ? <><Icon name="Loader" size={13} className="animate-spin" />Публикация...</>
              : <><Icon name="Printer" size={13} />Опубликовать ({selectedCount} листов)</>}
          </Button>
        </div>
      </div>

      {/* Уведомление об успехе */}
      <AnimatePresence>
        {published && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="bg-green-600 text-white px-6 py-2.5 flex items-center gap-2 text-sm font-medium">
            <Icon name="CheckCircle" size={15} />
            Публикация завершена! {selectedCount} листов сохранено в PDF.
          </motion.div>
        )}
      </AnimatePresence>

      <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-6">
          <TabsList className="h-10 bg-transparent gap-4 p-0">
            {[
              { id: "sheets", label: "Комплекты листов", icon: "BookOpen" },
              { id: "plotter", label: "Плоттер и формат", icon: "Printer" },
              { id: "styles", label: "Стили печати CTB/STB", icon: "Palette" },
              { id: "fonts", label: "Шрифты SHX", icon: "Type" },
            ].map(t => (
              <TabsTrigger key={t.id} value={t.id}
                className="h-10 px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:text-red-700 data-[state=active]:bg-transparent text-xs font-medium gap-1.5">
                <Icon name={t.icon} size={13} />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Комплекты листов */}
        <TabsContent value="sheets" className="flex-1 overflow-auto m-0 p-4">
          <div className="flex gap-4 h-full">
            {/* Список листов */}
            <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                <span className="text-[12px] font-semibold text-gray-700">
                  Листы проекта — {selectedCount} из {sheets.length} выбрано
                </span>
                <div className="ml-auto flex gap-2">
                  <button onClick={selectAll} className="text-[11px] text-blue-600 hover:underline">Все</button>
                  <span className="text-gray-300">|</span>
                  <button onClick={deselectAll} className="text-[11px] text-gray-500 hover:underline">Сбросить</button>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                <div className="grid grid-cols-[32px_2fr_80px_100px_80px_60px] gap-2 px-4 py-2 bg-gray-50 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                  <span></span>
                  <span>Название листа</span>
                  <span>Формат</span>
                  <span>Масштаб</span>
                  <span>Статус</span>
                  <span></span>
                </div>
                {sheets.map(sheet => (
                  <div key={sheet.id}
                    className={`grid grid-cols-[32px_2fr_80px_100px_80px_60px] gap-2 px-4 py-3 items-center cursor-pointer transition-colors ${sheet.selected ? "bg-blue-50/40" : "hover:bg-gray-50"}`}
                    onClick={() => toggleSheet(sheet.id)}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${sheet.selected ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
                      {sheet.selected && <Icon name="Check" size={10} className="text-white" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="FileText" size={13} className="text-gray-400 flex-shrink-0" />
                      <span className="text-[12px] text-gray-800">{sheet.name}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 font-mono">{sheet.format}</div>
                    <div className="text-[11px] text-gray-500 font-mono">{sheet.scale}</div>
                    <div>
                      {sheet.status === "ready"
                        ? <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">Готов</span>
                        : <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">Внимание</span>
                      }
                    </div>
                    <div className="flex gap-1">
                      <button className="p-1 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600">
                        <Icon name="Eye" size={11} />
                      </button>
                      <button className="p-1 rounded hover:bg-gray-100 text-gray-400">
                        <Icon name="Settings" size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Настройки публикации */}
            <div className="w-64 space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-[12px] font-semibold text-gray-700 mb-3">Параметры публикации</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 block mb-1">Формат вывода</label>
                    <div className="space-y-1">
                      {["PDF", "DWF", "PNG"].map(fmt => (
                        <label key={fmt} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="format" defaultChecked={fmt === "PDF"} className="accent-red-600" />
                          <span className="text-[12px] text-gray-700">{fmt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 block mb-1">Стиль печати</label>
                    <select className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
                      <option>Монохромный.ctb</option>
                      <option>Цветной_ГОСТ.ctb</option>
                      <option>Стандарт.stb</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 block mb-1">Масштаб</label>
                    <select className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
                      <option>По листу</option>
                      <option>1:100</option>
                      <option>1:500</option>
                      <option>1:1000</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-red-600" />
                      <span className="text-[12px] text-gray-700">Включить слои PDF</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-red-600" />
                      <span className="text-[12px] text-gray-700">Один файл для всех листов</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-[12px] font-semibold text-gray-700 mb-2">Папка сохранения</h3>
                <div className="flex gap-1.5">
                  <Input defaultValue="C:/Projects/Export/" className="h-7 text-[10px] font-mono flex-1" />
                  <button className="px-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <Icon name="FolderOpen" size={12} className="text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Плоттер */}
        <TabsContent value="plotter" className="flex-1 overflow-auto m-0 p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            {PLOTTERS.map(p => (
              <motion.button key={p.id} whileHover={{ y: -1 }}
                onClick={() => setSelectedPlotter(p.id)}
                className={`text-left p-5 rounded-xl border-2 transition-all ${selectedPlotter === p.id ? "border-current" : "border-gray-200 bg-white hover:border-gray-300"}`}
                style={selectedPlotter === p.id ? { borderColor: p.color, background: p.color + "08" } : {}}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: p.color + "18" }}>
                    <Icon name={p.icon} size={22} style={{ color: p.color }} />
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-gray-900 mb-1">{p.name}</div>
                    <p className="text-[11px] text-gray-500">{p.desc}</p>
                  </div>
                  {selectedPlotter === p.id && (
                    <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: p.color }}>
                      <Icon name="Check" size={11} className="text-white" />
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>

          {/* Параметры плоттера */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-[13px] font-bold text-gray-900 mb-4">Параметры PDF-плоттера</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 block mb-1.5">Формат бумаги</label>
                <select className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white">
                  <option>A4 (210 × 297 мм)</option>
                  <option>A3 (297 × 420 мм)</option>
                  <option>A2 (420 × 594 мм)</option>
                  <option>A1 (594 × 841 мм)</option>
                  <option>A0 (841 × 1189 мм)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 block mb-1.5">Разрешение DPI</label>
                <select className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white">
                  <option>150 DPI</option>
                  <option>300 DPI (рекомендуется)</option>
                  <option>600 DPI</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 block mb-1.5">Ориентация</label>
                <select className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white">
                  <option>Альбомная</option>
                  <option>Книжная</option>
                  <option>Авто</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 block mb-1.5">Цветовой режим</label>
                <select className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white">
                  <option>Монохромный</option>
                  <option>Оттенки серого</option>
                  <option>Полноцветный</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 block mb-1.5">Поля (мм)</label>
                <Input defaultValue="5" className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 block mb-1.5">Качество векторов</label>
                <select className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white">
                  <option>Черновик</option>
                  <option>Нормальное</option>
                  <option>Максимальное</option>
                </select>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* CTB/STB */}
        <TabsContent value="styles" className="flex-1 overflow-auto m-0 p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            {CTB_TABLES.map(ctb => (
              <motion.div key={ctb.id} whileHover={{ y: -1 }}
                className={`bg-white rounded-xl border-2 transition-all p-5 cursor-pointer ${selectedCtb === ctb.id ? "border-blue-400" : "border-gray-200 hover:border-blue-200"}`}
                onClick={() => setSelectedCtb(ctb.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[13px] font-bold text-gray-900">{ctb.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${ctb.type === "CTB" ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"}`}>
                        {ctb.type}
                      </span>
                      {ctb.active && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Активна</span>}
                    </div>
                    <p className="text-[11px] text-gray-500">{ctb.desc}</p>
                  </div>
                  {selectedCtb === ctb.id && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <Icon name="Check" size={11} className="text-white" />
                    </div>
                  )}
                </div>

                {ctb.preview && (
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1.5">Образцы цветов перьев:</p>
                    <div className="flex gap-1">
                      {ctb.preview.map((color, i) => (
                        <div key={i} className="w-8 h-6 rounded border border-gray-200" style={{ background: color }} />
                      ))}
                      <div className="flex items-center text-[10px] text-gray-400 px-2">+ {ctb.pens - 5} перьев</div>
                    </div>
                  </div>
                )}

                {ctb.styles && (
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1.5">Именованные стили:</p>
                    <div className="flex flex-wrap gap-1">
                      {ctb.styles.map(s => (
                        <span key={s} className="text-[10px] bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="text-xs h-6 px-2 flex-1">Редактировать</Button>
                  <Button size="sm" variant="outline" className="text-xs h-6 px-2">Копировать</Button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Редактор пера */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-[13px] font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Icon name="Palette" size={15} className="text-blue-600" />
              Редактор пера — Монохромный.ctb
            </h3>
            <div className="grid grid-cols-[60px_1fr_100px_120px_100px_80px] gap-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wide pb-2 border-b border-gray-100">
              <span>Цвет</span>
              <span>Имя пера</span>
              <span>Заливка</span>
              <span>Толщина, мм</span>
              <span>Тип линии</span>
              <span>Оттенок</span>
            </div>
            {[
              { num: 1, color: "#ef4444", name: "Перо 1 (Красный)", fill: "Заливка объекта", width: "0.25", linetype: "Нет", gray: 0 },
              { num: 2, color: "#ffff00", name: "Перо 2 (Жёлтый)", fill: "Заливка объекта", width: "0.18", linetype: "Нет", gray: 0 },
              { num: 3, color: "#00ff00", name: "Перо 3 (Зелёный)", fill: "Заливка объекта", width: "0.35", linetype: "Нет", gray: 0 },
              { num: 4, color: "#00ffff", name: "Перо 4 (Голубой)", fill: "Заливка объекта", width: "0.50", linetype: "Нет", gray: 0 },
              { num: 5, color: "#0000ff", name: "Перо 5 (Синий)", fill: "Заливка объекта", width: "0.70", linetype: "Нет", gray: 0 },
            ].map(pen => (
              <div key={pen.num}
                onClick={() => setSelectedPen(selectedPen === pen.num ? null : pen.num)}
                className={`grid grid-cols-[60px_1fr_100px_120px_100px_80px] gap-2 py-2 items-center cursor-pointer rounded-lg px-2 transition-colors ${selectedPen === pen.num ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-sm border border-gray-200" style={{ background: pen.color }} />
                  <span className="text-[10px] text-gray-400">{pen.num}</span>
                </div>
                <span className="text-[11px] text-gray-700">{pen.name}</span>
                <span className="text-[11px] text-gray-500">{pen.fill}</span>
                <Input defaultValue={pen.width} className="h-6 text-[10px] w-20 font-mono"
                  onClick={e => e.stopPropagation()} />
                <span className="text-[11px] text-gray-500">{pen.linetype}</span>
                <span className="text-[11px] text-gray-500">{pen.gray}%</span>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Шрифты SHX */}
        <TabsContent value="fonts" className="flex-1 overflow-auto m-0 p-4">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {SHX_FONTS.map(font => (
              <motion.div key={font.file} whileHover={{ y: -1 }}
                className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${font.installed ? "bg-amber-50" : "bg-gray-50"}`}>
                    <Icon name="Type" size={18} className={font.installed ? "text-amber-600" : "text-gray-400"} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[12px] font-bold text-gray-900">{font.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${font.installed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {font.installed ? "Установлен" : "Не установлен"}
                      </span>
                    </div>
                    <code className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">{font.file}</code>
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 mb-3">{font.desc}</p>

                {/* Превью шрифта */}
                <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-100">
                  <div className="text-[16px] text-gray-700 leading-tight" style={{ fontFamily: "monospace" }}>
                    АБВГДЕЁЖЗИЙ
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1" style={{ fontFamily: "monospace" }}>
                    0123456789 АaBb
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">{font.size}</span>
                  {font.installed
                    ? <Button size="sm" variant="outline" className="text-xs h-6 px-2">Открыть папку</Button>
                    : <Button size="sm" className="text-xs h-6 px-2 bg-amber-500 hover:bg-amber-600 text-white">Установить</Button>
                  }
                </div>
              </motion.div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Icon name="Info" size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[12px] font-semibold text-blue-800">Расположение шрифтов</p>
              <p className="text-[11px] text-blue-700 mt-0.5 font-mono">
                C:\Program Files\ЛАПА 3D 2027\Fonts\
              </p>
              <p className="text-[11px] text-blue-600 mt-1">Скопируйте .shx файлы в эту папку и перезапустите программу для активации шрифтов.</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}