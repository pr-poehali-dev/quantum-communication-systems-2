import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Icon from "@/components/ui/icon"

// ─── Типы файлов Civil 3D ─────────────────────────────────────────────────────

const FILE_TYPES = [
  {
    ext: "DWG", category: "project", icon: "FileText", color: "#0078d4",
    name: "Основной файл проекта",
    desc: "Хранит 2D‑ и 3D‑данные: поверхности, трассы, коридоры, профили, сети инженерных коммуникаций. Совместим с nanoCAD, BricsCAD.",
    actions: ["Открыть", "Сохранить", "Сохранить как", "Восстановить"],
    badge: "Рабочий",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    ext: "DWT", category: "project", icon: "FilePlus", color: "#059669",
    name: "Шаблон проекта",
    desc: "Содержит предустановленные стили, слои, единицы измерения, параметры чертежа. Используется при создании нового файла.",
    actions: ["Создать из шаблона", "Редактировать", "Экспортировать"],
    badge: "Шаблон",
    badgeColor: "bg-green-100 text-green-700",
  },
  {
    ext: "DWS", category: "project", icon: "ShieldCheck", color: "#7c3aed",
    name: "Стандарт оформления",
    desc: "Проверяет соответствие слоёв, стилей и объектов заданным правилам. Обеспечивает единые требования к документации.",
    actions: ["Применить стандарт", "Проверить чертёж", "Редактировать"],
    badge: "Стандарт",
    badgeColor: "bg-violet-100 text-violet-700",
  },
  {
    ext: "BAK", category: "project", icon: "RotateCcw", color: "#d97706",
    name: "Резервная копия",
    desc: "Автоматически создаётся при каждом сохранении DWG. Восстанавливается переименованием в .dwg.",
    actions: ["Восстановить", "Открыть как DWG", "Удалить"],
    badge: "Резерв",
    badgeColor: "bg-amber-100 text-amber-700",
  },
  {
    ext: "XML", category: "data", icon: "Code", color: "#0284c7",
    name: "Конфигурационный файл",
    desc: "Хранят настройки инструментов, палитр, пользовательских параметров. Используются для переноса настроек между рабочими станциями.",
    actions: ["Редактировать", "Импортировать", "Экспортировать"],
    badge: "Настройки",
    badgeColor: "bg-sky-100 text-sky-700",
  },
  {
    ext: "CSV", category: "data", icon: "Table", color: "#059669",
    name: "Таблица точек съёмки",
    desc: "Импорт/экспорт координат (X, Y, Z), кодов точек, описаний. Формат: разделители — запятые или табуляции.",
    actions: ["Импортировать точки", "Экспортировать", "Открыть в таблице"],
    badge: "Данные",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    ext: "TXT", category: "data", icon: "FileType", color: "#6b7280",
    name: "Текстовые данные",
    desc: "Импорт/экспорт точек съёмки, отметок, атрибутов объектов. Совместим с любым текстовым редактором.",
    actions: ["Импортировать", "Открыть", "Экспортировать"],
    badge: "Данные",
    badgeColor: "bg-gray-100 text-gray-700",
  },
  {
    ext: "SDF", category: "data", icon: "Database", color: "#ec4899",
    name: "База геодезических данных",
    desc: "Компактный формат для хранения больших массивов геодезических данных. Поддерживает связь с объектами Civil 3D.",
    actions: ["Открыть БД", "Экспортировать", "Создать индекс"],
    badge: "База данных",
    badgeColor: "bg-pink-100 text-pink-700",
  },
  {
    ext: "ADSKLIB", category: "library", icon: "Library", color: "#7c3aed",
    name: "Библиотека объектов",
    desc: "Хранит пользовательские компоненты: блоки, стили, условные знаки, стандартные элементы коридоров и сетей.",
    actions: ["Открыть библиотеку", "Добавить элемент", "Синхронизировать"],
    badge: "Библиотека",
    badgeColor: "bg-purple-100 text-purple-700",
  },
  {
    ext: "DXF", category: "export", icon: "Share2", color: "#d97706",
    name: "Обмен с CAD-системами",
    desc: "Универсальный формат обмена. При экспорте из проекта теряет интеллектуальные объекты — остаются примитивы (линии, полилинии).",
    actions: ["Экспортировать", "Импортировать", "Настроить параметры"],
    badge: "Экспорт",
    badgeColor: "bg-amber-100 text-amber-700",
  },
  {
    ext: "IFC", category: "export", icon: "Box", color: "#0078d4",
    name: "BIM-данные",
    desc: "Открытый формат для передачи информации в BIM-системы. Сохраняет геометрию и атрибуты объектов. IFC 2x3 и IFC 4.0.",
    actions: ["Экспортировать IFC", "Настроить классы", "Проверить модель"],
    badge: "BIM",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    ext: "PDF", category: "export", icon: "FileDown", color: "#ef4444",
    name: "Публикация чертежей",
    desc: "Фиксирует оформление, слои, шрифты. Подходит для передачи заказчику или печати.",
    actions: ["Публиковать", "Настроить листы", "Пакетная публикация"],
    badge: "Публикация",
    badgeColor: "bg-red-100 text-red-700",
  },
  {
    ext: "DWF", category: "export", icon: "Eye", color: "#6b7280",
    name: "Просмотр без CAD",
    desc: "Облегчённый формат для просмотра и рецензирования чертежей без установки CAD-системы. Уменьшенный размер файла.",
    actions: ["Экспортировать DWF", "Открыть в просмотрщике"],
    badge: "Просмотр",
    badgeColor: "bg-gray-100 text-gray-700",
  },
  {
    ext: "CTB", category: "print", icon: "Printer", color: "#0284c7",
    name: "Цветозависимые стили печати",
    desc: "Определяют цвета, толщины линий при выводе на печать. Привязка к цвету слоя (RGB).",
    actions: ["Редактировать", "Применить", "Создать копию"],
    badge: "Печать",
    badgeColor: "bg-sky-100 text-sky-700",
  },
  {
    ext: "STB", category: "print", icon: "Printer", color: "#7c3aed",
    name: "Именованные стили печати",
    desc: "Определяют стили печати независимо от цвета объекта. Более гибкая настройка по сравнению с CTB.",
    actions: ["Редактировать", "Применить", "Создать копию"],
    badge: "Печать",
    badgeColor: "bg-violet-100 text-violet-700",
  },
  {
    ext: "SHX", category: "fonts", icon: "Type", color: "#d97706",
    name: "Шрифты САПР",
    desc: "Специальные шрифты для оформления чертежей: ГОСТ, ISO, DIN. Например: gost.shx, isocp.shx.",
    actions: ["Установить", "Просмотреть", "Открыть папку"],
    badge: "Шрифты",
    badgeColor: "bg-amber-100 text-amber-700",
  },
]

// ─── Файловая структура проекта ───────────────────────────────────────────────

const PROJECT_STRUCTURE = [
  {
    folder: "Чертежи",
    icon: "FolderOpen",
    color: "#0078d4",
    files: [
      { name: "Главная_парковка_Финал.dwg", ext: "DWG", size: "31 МБ", date: "20.05.2026", modified: true },
      { name: "Коридор_дорога.dwg", ext: "DWG", size: "14 МБ", date: "17.05.2026", modified: false },
      { name: "Автодорога_М5_РД.dwg", ext: "DWG", size: "18 МБ", date: "13.05.2026", modified: false },
      { name: "AutoCAD_Civil_3D_Metric.dwt", ext: "DWT", size: "2.4 МБ", date: "01.04.2026", modified: false },
      { name: "Roads_RUS.dwt", ext: "DWT", size: "1.8 МБ", date: "01.04.2026", modified: false },
      { name: "Стандарт_ГОСТ_21.dwt", ext: "DWT", size: "1.2 МБ", date: "15.03.2026", modified: false },
    ],
  },
  {
    folder: "Данные",
    icon: "FolderOpen",
    color: "#059669",
    files: [
      { name: "Геодезия_изыскания.csv", ext: "CSV", size: "1 МБ", date: "15.05.2026", modified: false },
      { name: "Точки_GNSS_2024.txt", ext: "TXT", size: "340 КБ", date: "10.05.2026", modified: false },
      { name: "ЦМР_Съёмка_2024.sdf", ext: "SDF", size: "8 МБ", date: "19.05.2026", modified: true },
      { name: "Трасса_ШД-38_v2.xml", ext: "XML", size: "2 МБ", date: "18.05.2026", modified: false },
      { name: "Настройки_проекта.xml", ext: "XML", size: "45 КБ", date: "01.04.2026", modified: false },
    ],
  },
  {
    folder: "Библиотеки",
    icon: "FolderOpen",
    color: "#7c3aed",
    files: [
      { name: "Civil_Элементы.adsklib", ext: "ADSKLIB", size: "12 МБ", date: "01.04.2026", modified: false },
      { name: "Знаки_ГОСТ.adsklib", ext: "ADSKLIB", size: "5 МБ", date: "15.03.2026", modified: false },
    ],
  },
  {
    folder: "Экспорт",
    icon: "FolderOpen",
    color: "#d97706",
    files: [
      { name: "Главная_парковка.pdf", ext: "PDF", size: "4.2 МБ", date: "20.05.2026", modified: false },
      { name: "BIM_Корпус_А.ifc", ext: "IFC", size: "22 МБ", date: "14.05.2026", modified: false },
      { name: "Ливневая_канализация.dwf", ext: "DWF", size: "2.8 МБ", date: "16.05.2026", modified: false },
      { name: "Чертёж_план.dxf", ext: "DXF", size: "1.5 МБ", date: "12.05.2026", modified: false },
    ],
  },
  {
    folder: "Настройки",
    icon: "FolderOpen",
    color: "#0284c7",
    files: [
      { name: "Монохромный.ctb", ext: "CTB", size: "12 КБ", date: "01.04.2026", modified: false },
      { name: "Именованные.stb", ext: "STB", size: "8 КБ", date: "01.04.2026", modified: false },
      { name: "gost.shx", ext: "SHX", size: "42 КБ", date: "01.04.2026", modified: false },
      { name: "isocp.shx", ext: "SHX", size: "38 КБ", date: "01.04.2026", modified: false },
    ],
  },
  {
    folder: "Резервные копии",
    icon: "FolderOpen",
    color: "#6b7280",
    files: [
      { name: "Главная_парковка_Финал.bak", ext: "BAK", size: "30 МБ", date: "20.05.2026", modified: false },
      { name: "Коридор_дорога.bak", ext: "BAK", size: "13 МБ", date: "17.05.2026", modified: false },
    ],
  },
]

const EXT_COLORS: Record<string, string> = {
  DWG: "#0078d4", DWT: "#059669", DWS: "#7c3aed", BAK: "#d97706",
  XML: "#0284c7", CSV: "#16a34a", TXT: "#6b7280", SDF: "#ec4899",
  ADSKLIB: "#8b5cf6", DXF: "#ea580c", IFC: "#0078d4", PDF: "#ef4444",
  DWF: "#64748b", CTB: "#0284c7", STB: "#7c3aed", SHX: "#d97706",
}

const CATEGORIES = [
  { id: "all", label: "Все типы", icon: "Files" },
  { id: "project", label: "Проектные", icon: "FileText" },
  { id: "data", label: "Данные", icon: "Database" },
  { id: "library", label: "Библиотеки", icon: "Library" },
  { id: "export", label: "Экспорт", icon: "Share2" },
  { id: "print", label: "Печать", icon: "Printer" },
  { id: "fonts", label: "Шрифты", icon: "Type" },
]

export default function FileManagerModule({ onNavigate }: { onNavigate?: (id: string) => void } = {}) {
  const [tab, setTab] = useState("browser")
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedType, setSelectedType] = useState<typeof FILE_TYPES[0] | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<string[]>(["Чертежи", "Данные"])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const filtered = FILE_TYPES.filter(f => {
    const matchCat = categoryFilter === "all" || f.category === categoryFilter
    const matchSearch = !search || f.ext.toLowerCase().includes(search.toLowerCase()) || f.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const toggleFolder = (name: string) => {
    setExpandedFolders(prev => prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name])
  }

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] overflow-hidden">
      {/* Шапка */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Icon name="FolderOpen" size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-gray-900">Менеджер файлов проекта</h1>
            <p className="text-[11px] text-gray-500">Civil 3D — все типы файлов и форматов</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs gap-1.5">
            <Icon name="FolderPlus" size={13} />Новая папка
          </Button>
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => onNavigate?.("civilcad")}>
            <Icon name="Monitor" size={13} />Редактор
          </Button>
          <Button size="sm" className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700">
            <Icon name="Upload" size={13} />Импортировать файл
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-6">
          <TabsList className="h-10 bg-transparent gap-4 p-0">
            {[
              { id: "browser", label: "Обозреватель файлов", icon: "FolderTree" },
              { id: "types", label: "Типы файлов", icon: "FileStack" },
              { id: "import", label: "Импорт / Экспорт", icon: "ArrowLeftRight" },
            ].map(t => (
              <TabsTrigger key={t.id} value={t.id}
                className="h-10 px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-transparent text-xs font-medium gap-1.5">
                <Icon name={t.icon} size={13} />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Обозреватель файлов */}
        <TabsContent value="browser" className="flex-1 overflow-auto m-0 p-4">
          <div className="flex gap-4 h-full">
            {/* Дерево папок */}
            <div className="w-72 bg-white rounded-xl border border-gray-200 overflow-auto">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Структура проекта</span>
                <button className="text-gray-400 hover:text-gray-600"><Icon name="RefreshCw" size={12} /></button>
              </div>
              <div className="p-2 space-y-0.5">
                {PROJECT_STRUCTURE.map(folder => (
                  <div key={folder.folder}>
                    <button
                      onClick={() => toggleFolder(folder.folder)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-left transition-colors"
                    >
                      <Icon
                        name={expandedFolders.includes(folder.folder) ? "ChevronDown" : "ChevronRight"}
                        size={12} className="text-gray-400 flex-shrink-0"
                      />
                      <Icon name="Folder" size={15} style={{ color: folder.color }} className="flex-shrink-0" />
                      <span className="text-[12px] text-gray-700 font-medium">{folder.folder}</span>
                      <span className="ml-auto text-[10px] text-gray-400">{folder.files.length}</span>
                    </button>
                    <AnimatePresence>
                      {expandedFolders.includes(folder.folder) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          {folder.files.map(file => (
                            <button
                              key={file.name}
                              onClick={() => setSelectedFile(file.name)}
                              className={`w-full flex items-center gap-2 pl-8 pr-3 py-1.5 rounded-lg text-left transition-colors ${selectedFile === file.name ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"}`}
                            >
                              <div className="w-4 h-4 rounded text-[8px] font-bold flex items-center justify-center flex-shrink-0"
                                style={{ background: EXT_COLORS[file.ext] + "20", color: EXT_COLORS[file.ext] }}>
                                {file.ext.slice(0, 2)}
                              </div>
                              <span className="text-[11px] truncate text-gray-600">{file.name}</span>
                              {file.modified && <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* Содержимое папки */}
            <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-auto">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                <Input placeholder="Поиск файлов..." className="h-8 text-xs w-64"
                  value={search} onChange={e => setSearch(e.target.value)} />
                <div className="ml-auto flex items-center gap-1">
                  <button className="p-1.5 rounded hover:bg-gray-100"><Icon name="LayoutGrid" size={13} className="text-gray-500" /></button>
                  <button className="p-1.5 rounded bg-gray-100"><Icon name="List" size={13} className="text-gray-600" /></button>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {/* Шапка таблицы */}
                <div className="grid grid-cols-[2fr_80px_120px_100px_120px] gap-2 px-4 py-2 bg-gray-50 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                  <span>Имя файла</span>
                  <span>Тип</span>
                  <span>Размер</span>
                  <span>Дата</span>
                  <span>Действия</span>
                </div>
                {PROJECT_STRUCTURE.flatMap(folder =>
                  folder.files.filter(f =>
                    !search || f.name.toLowerCase().includes(search.toLowerCase())
                  ).map(file => (
                    <motion.div
                      key={file.name}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`grid grid-cols-[2fr_80px_120px_100px_120px] gap-2 px-4 py-2.5 items-center cursor-pointer transition-colors ${selectedFile === file.name ? "bg-blue-50" : "hover:bg-gray-50"}`}
                      onClick={() => setSelectedFile(file.name)}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                          style={{ background: EXT_COLORS[file.ext] + "18", color: EXT_COLORS[file.ext] }}>
                          {file.ext.slice(0, 3)}
                        </div>
                        <div>
                          <div className="text-[12px] text-gray-800 font-medium flex items-center gap-1.5">
                            {file.name}
                            {file.modified && <span className="text-[9px] text-orange-500 font-semibold">● изменён</span>}
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: EXT_COLORS[file.ext] + "18", color: EXT_COLORS[file.ext] }}>
                          .{file.ext.toLowerCase()}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500">{file.size}</div>
                      <div className="text-[11px] text-gray-500">{file.date}</div>
                      <div className="flex items-center gap-1">
                        <button className="p-1 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors" title="Открыть">
                          <Icon name="FolderOpen" size={12} />
                        </button>
                        <button className="p-1 rounded hover:bg-green-100 text-gray-400 hover:text-green-600 transition-colors" title="Скачать">
                          <Icon name="Download" size={12} />
                        </button>
                        <button className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors" title="Удалить">
                          <Icon name="Trash2" size={12} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Типы файлов */}
        <TabsContent value="types" className="flex-1 overflow-auto m-0 p-4">
          <div className="flex gap-4 h-full">
            {/* Фильтры */}
            <div className="w-52 bg-white rounded-xl border border-gray-200 p-3 space-y-1 h-fit">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide px-2 pb-1">Категория</p>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors ${categoryFilter === cat.id ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <Icon name={cat.icon} size={13} />
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Список типов + детали */}
            <div className="flex-1 flex gap-4">
              <div className="flex-1 space-y-2 overflow-auto">
                <Input placeholder="Поиск по типу или названию..."
                  className="h-8 text-xs bg-white" value={search} onChange={e => setSearch(e.target.value)} />
                {filtered.map(ft => (
                  <motion.button
                    key={ft.ext}
                    whileHover={{ scale: 1.005 }}
                    onClick={() => setSelectedType(ft === selectedType ? null : ft)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${selectedType?.ext === ft.ext ? "border-blue-400 bg-blue-50" : "bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-50/30"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-10 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                        style={{ background: ft.color + "18", color: ft.color }}>
                        .{ft.ext.toLowerCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[13px] font-semibold text-gray-900">{ft.name}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${ft.badgeColor}`}>{ft.badge}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 truncate">{ft.desc}</p>
                      </div>
                      <Icon name={ft.icon} size={16} style={{ color: ft.color }} className="flex-shrink-0" />
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Панель деталей */}
              <AnimatePresence>
                {selectedType && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 280, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden flex-shrink-0"
                  >
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-14 h-12 rounded-xl flex items-center justify-center text-[14px] font-bold"
                          style={{ background: selectedType.color + "18", color: selectedType.color }}>
                          .{selectedType.ext.toLowerCase()}
                        </div>
                        <div>
                          <div className="text-[14px] font-bold text-gray-900">{selectedType.ext}</div>
                          <div className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full inline-block ${selectedType.badgeColor}`}>{selectedType.badge}</div>
                        </div>
                      </div>

                      <h3 className="text-[12px] font-semibold text-gray-800 mb-2">{selectedType.name}</h3>
                      <p className="text-[11px] text-gray-500 leading-relaxed mb-4">{selectedType.desc}</p>

                      <div className="border-t border-gray-100 pt-4">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Доступные действия</p>
                        <div className="space-y-1.5">
                          {selectedType.actions.map(action => (
                            <button key={action}
                              className="w-full text-left text-xs text-gray-700 px-3 py-2 rounded-lg bg-gray-50 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-2">
                              <Icon name="Play" size={11} style={{ color: selectedType.color }} />
                              {action}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </TabsContent>

        {/* Импорт / Экспорт */}
        <TabsContent value="import" className="flex-1 overflow-auto m-0 p-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Импорт */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <Icon name="Upload" size={15} className="text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Импорт данных</h3>
              </div>
              <div className="space-y-2">
                {[
                  { fmt: "CSV / TXT", desc: "Точки съёмки (X, Y, Z, код)", icon: "Table", color: "#059669" },
                  { fmt: "LandXML", desc: "Поверхности, трассы, профили", icon: "Mountain", color: "#0078d4" },
                  { fmt: "DXF / DWG", desc: "Чертежи из других CAD-систем", icon: "PenTool", color: "#d97706" },
                  { fmt: "IFC", desc: "BIM-модели (Revit, ArchiCAD)", icon: "Box", color: "#7c3aed" },
                  { fmt: "SHP / GeoTIFF", desc: "Геоданные из ГИС-систем", icon: "Map", color: "#0284c7" },
                  { fmt: "RCP / RCS", desc: "Облака точек LiDAR", icon: "Scan", color: "#ec4899" },
                  { fmt: "SDF", desc: "База геодезических данных", icon: "Database", color: "#be185d" },
                ].map(item => (
                  <div key={item.fmt} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-colors cursor-pointer group">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: item.color + "18" }}>
                      <Icon name={item.icon} size={14} style={{ color: item.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="text-[12px] font-semibold text-gray-800">{item.fmt}</div>
                      <div className="text-[10px] text-gray-500">{item.desc}</div>
                    </div>
                    <Button size="sm" variant="outline"
                      className="text-[10px] h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      Импорт
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Экспорт */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Icon name="Download" size={15} className="text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Экспорт данных</h3>
              </div>
              <div className="space-y-2">
                {[
                  { fmt: "PDF", desc: "Публикация чертежей для заказчика", icon: "FileDown", color: "#ef4444" },
                  { fmt: "DWG / DXF", desc: "Совместимость с CAD-системами", icon: "PenTool", color: "#d97706" },
                  { fmt: "DWF", desc: "Облегчённый просмотр без CAD", icon: "Eye", color: "#6b7280" },
                  { fmt: "IFC", desc: "BIM-обмен (Revit, ArchiCAD)", icon: "Box", color: "#0078d4" },
                  { fmt: "LandXML", desc: "Поверхности, трассы, профили", icon: "Mountain", color: "#059669" },
                  { fmt: "CSV / Excel", desc: "Таблицы точек и ведомостей", icon: "Table", color: "#16a34a" },
                  { fmt: "KMZ / KML", desc: "Объекты для Google Earth", icon: "Globe", color: "#dc2626" },
                ].map(item => (
                  <div key={item.fmt} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors cursor-pointer group">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: item.color + "18" }}>
                      <Icon name={item.icon} size={14} style={{ color: item.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="text-[12px] font-semibold text-gray-800">{item.fmt}</div>
                      <div className="text-[10px] text-gray-500">{item.desc}</div>
                    </div>
                    <Button size="sm" variant="outline"
                      className="text-[10px] h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      Экспорт
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Рекомендуемая структура */}
          <div className="mt-4 bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Icon name="FolderTree" size={16} className="text-blue-600" />
              Рекомендуемая структура папок проекта
            </h3>
            <div className="grid grid-cols-5 gap-3">
              {[
                { folder: "Чертежи", exts: [".dwg", ".dwt", ".dws"], color: "#0078d4", icon: "FileText" },
                { folder: "Данные", exts: [".csv", ".sdf", ".txt", ".xml"], color: "#059669", icon: "Database" },
                { folder: "Библиотеки", exts: [".adsklib", ".lsp"], color: "#7c3aed", icon: "Library" },
                { folder: "Экспорт", exts: [".pdf", ".ifc", ".dwf", ".dxf"], color: "#ef4444", icon: "Share2" },
                { folder: "Настройки", exts: [".xml", ".ctb", ".stb", ".shx"], color: "#d97706", icon: "Settings" },
              ].map(f => (
                <div key={f.folder} className="rounded-xl border border-gray-100 p-3 text-center"
                  style={{ background: f.color + "08" }}>
                  <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
                    style={{ background: f.color + "18" }}>
                    <Icon name={f.icon} size={18} style={{ color: f.color }} />
                  </div>
                  <div className="text-[12px] font-semibold text-gray-800 mb-1">{f.folder}/</div>
                  {f.exts.map(ext => (
                    <div key={ext} className="text-[10px] text-gray-500">{ext}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}