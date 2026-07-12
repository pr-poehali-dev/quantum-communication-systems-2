import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import Icon from "@/components/ui/icon"
import { CategoryFeaturesGrid } from "@/modules/VersionFeaturesPanel"

// ─── LSP-скрипты ──────────────────────────────────────────────────────────────

const LSP_SCRIPTS = [
  {
    id: "geopoints",
    name: "GeoPoints Edit",
    file: "geopoints_edit.lsp",
    category: "geodesy",
    version: "2.4.1",
    status: "loaded",
    desc: "Массовое редактирование точек съёмки: смена кодов, изменение отметок, экспорт в CSV. Поддерживает форматы ГОСТ Р 51872.",
    commands: ["GPEDIT", "GP2CSV", "GPFILTER", "GPSTAT"],
    author: "Геодезист.RU",
    size: "42 КБ",
    downloads: 1240,
    tags: ["геодезия", "точки", "ГОСТ"],
  },
  {
    id: "extratools",
    name: "Extra Tools",
    file: "extra_tools.lsp",
    category: "drafting",
    version: "3.1.0",
    status: "loaded",
    desc: "Конвертация форматов DXF ↔ CSV, расчёт отклонений, массовое изменение свойств объектов, инструменты для исполнительных схем.",
    commands: ["DXF2CSV", "CALCDEV", "MASSEDIT", "EXSCHEMA"],
    author: "Civil Tools Community",
    size: "78 КБ",
    downloads: 890,
    tags: ["конвертация", "исполнительная"],
  },
  {
    id: "roadstools",
    name: "Roads Automation",
    file: "roads_auto.lsp",
    category: "roads",
    version: "1.8.3",
    status: "not_loaded",
    desc: "Автоматизация оформления дорожных проектов: разбивочные данные, ведомости, автоматическая простановка пикетов по СП 34.",
    commands: ["ROADPK", "ROADSPEC", "ROADSTAKE"],
    author: "Проектировщики РФ",
    size: "56 КБ",
    downloads: 674,
    tags: ["дороги", "СП 34", "пикетаж"],
  },
  {
    id: "voltools",
    name: "Volume Calculator",
    file: "volumes.lsp",
    category: "analysis",
    version: "2.0.0",
    status: "not_loaded",
    desc: "Расчёт объёмов земляных работ: метод среднего сечения, метод Симпсона, формирование ведомостей по разделам.",
    commands: ["VOLCALC", "VOLREPORT", "VOLCROSS"],
    author: "ЛАПА 3D Team",
    size: "31 КБ",
    downloads: 1560,
    tags: ["объёмы", "ведомости", "земляные работы"],
  },
  {
    id: "networktools",
    name: "Network Tools",
    file: "network_tools.lsp",
    category: "networks",
    version: "1.5.2",
    status: "loaded",
    desc: "Инструменты для сетей инженерных коммуникаций: нумерация колодцев, простановка уклонов, экспорт профилей в таблицу.",
    commands: ["NETNUM", "NETSLOPE", "NETEXPORT"],
    author: "ВКС Проект",
    size: "48 КБ",
    downloads: 430,
    tags: ["сети", "ВКС", "колодцы"],
  },
]

// ─── DLL-плагины ──────────────────────────────────────────────────────────────

const DLL_PLUGINS = [
  {
    id: "civiltools",
    name: "Civil Tools Pro",
    file: "CivilToolsPro.dll",
    version: "4.2.1",
    status: "active",
    desc: "Расширенная панель инструментов для ЛАПА 3D: быстрое создание поверхностей, автоматические коридоры, генерация отчётов по СП 34.",
    size: "2.4 МБ",
    ribbon: "Civil Tools",
    commands: 24,
    compatible: "ЛАПА 3D 2026–2027",
    icon: "Wrench",
    color: "#0078d4",
  },
  {
    id: "sometools",
    name: "SomeSmallTools",
    file: "SomeSmallTools.dll",
    version: "1.3.0",
    status: "active",
    desc: "Набор малых утилит: инструменты для исполнительных схем, проверка геометрии, экспорт точек в различные форматы.",
    size: "890 КБ",
    ribbon: "SST Tools",
    commands: 12,
    compatible: "ЛАПА 3D 2026–2027",
    icon: "Layers",
    color: "#059669",
  },
  {
    id: "kobtools",
    name: "Kobi Toolkit",
    file: "KobiToolkit.dll",
    version: "6.0.2",
    status: "inactive",
    desc: "Профессиональные инструменты для автоматизации оформления: штампы, рамки, поля атрибутов по ГОСТ 21.101.",
    size: "3.1 МБ",
    ribbon: "Kobi",
    commands: 38,
    compatible: "ЛАПА 3D 2027",
    icon: "BookOpen",
    color: "#7c3aed",
  },
  {
    id: "geocalc",
    name: "GeoCalc",
    file: "GeoCalc.dll",
    version: "2.1.0",
    status: "inactive",
    desc: "Геодезические вычисления: преобразование координат, решение геодезических задач, импорт из тахеометра.",
    size: "1.2 МБ",
    ribbon: "GeoCalc",
    commands: 18,
    compatible: "ЛАПА 3D 2026–2027",
    icon: "Calculator",
    color: "#d97706",
  },
]

// ─── Макросы ──────────────────────────────────────────────────────────────────

const MACROS = [
  {
    id: "stdlayers",
    name: "Стандартные слои ГОСТ",
    file: "std_layers.scr",
    desc: "Создаёт стандартную структуру слоёв по ГОСТ 21.101 с правильными цветами и типами линий.",
    steps: 12,
    runTime: "< 1 сек",
    status: "ready",
    category: "drafting",
  },
  {
    id: "batchpdf",
    name: "Пакетная публикация PDF",
    file: "batch_pdf.scr",
    desc: "Открывает все DWG-файлы в папке, публикует их в PDF с заданными параметрами.",
    steps: 8,
    runTime: "зависит от файлов",
    status: "ready",
    category: "publish",
  },
  {
    id: "insertframe",
    name: "Вставка рамки чертежа",
    file: "insert_frame.scr",
    desc: "Вставляет рамку и штамп по ГОСТ 21.101 на текущий лист с заполнением основных полей.",
    steps: 6,
    runTime: "< 1 сек",
    status: "ready",
    category: "drafting",
  },
  {
    id: "exportpoints",
    name: "Экспорт точек в CSV",
    file: "export_points.scr",
    desc: "Экспортирует все точки COGO из текущего чертежа в CSV с координатами и кодами.",
    steps: 4,
    runTime: "< 2 сек",
    status: "ready",
    category: "data",
  },
]

// ─── Палитры CUI ──────────────────────────────────────────────────────────────

const PALETTES = [
  {
    id: "main",
    name: "Основные инструменты ЛАПА",
    file: "lapa_main.cuix",
    items: 24,
    active: true,
    groups: ["Поверхности", "Трассы", "Коридоры", "Сети", "Геодезия"],
    desc: "Стандартная палитра со всеми основными инструментами ЛАПА 3D для дорожного проектирования.",
  },
  {
    id: "roads",
    name: "Дороги и трассы",
    file: "roads_palette.cuix",
    items: 18,
    active: true,
    groups: ["Горизонтальные кривые", "Вертикальные кривые", "Поперечники", "Разбивка"],
    desc: "Специализированная палитра для проектирования автомобильных дорог по СП 34.",
  },
  {
    id: "geodesy",
    name: "Геодезия и съёмка",
    file: "geodesy_palette.cuix",
    items: 14,
    active: false,
    groups: ["Точки COGO", "Линии COGO", "Полигоны", "Трансформация"],
    desc: "Инструменты для работы с геодезическими данными и точками съёмки.",
  },
  {
    id: "networks",
    name: "Инженерные сети",
    file: "networks_palette.cuix",
    items: 20,
    active: false,
    groups: ["Напорные сети", "Самотёчные сети", "Колодцы", "Профили"],
    desc: "Палитра для проектирования инженерных коммуникаций: ВКС, теплосеть, газопровод.",
  },
]

const CATEGORIES_LSP = [
  { id: "all", label: "Все", icon: "Files" },
  { id: "geodesy", label: "Геодезия", icon: "Mountain" },
  { id: "roads", label: "Дороги", icon: "Route" },
  { id: "networks", label: "Сети", icon: "Network" },
  { id: "analysis", label: "Анализ", icon: "BarChart3" },
  { id: "drafting", label: "Оформление", icon: "PenTool" },
]

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  loaded: { label: "Загружен", color: "#16a34a", bg: "#dcfce7" },
  not_loaded: { label: "Не загружен", color: "#6b7280", bg: "#f3f4f6" },
  active: { label: "Активен", color: "#0078d4", bg: "#dbeafe" },
  inactive: { label: "Отключён", color: "#6b7280", bg: "#f3f4f6" },
  ready: { label: "Готов", color: "#16a34a", bg: "#dcfce7" },
}

export default function ToolsModule({ onNavigate }: { onNavigate?: (id: string) => void } = {}) {
  const [tab, setTab] = useState("lsp")
  const [catFilter, setCatFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<string | null>(null)
  const [command, setCommand] = useState("")
  const [toast, setToast] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [scriptStatuses, setScriptStatuses] = useState<Record<string, string>>(
    Object.fromEntries(LSP_SCRIPTS.map(s => [s.id, s.status]))
  )
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState<"lisp" | "plugin" | null>(null)
  const [showGitHub, setShowGitHub] = useState(false)
  const [pluginStatuses, setPluginStatuses] = useState<Record<string, string>>(
    Object.fromEntries(DLL_PLUGINS.map(p => [p.id, p.status]))
  )
  const [paletteActive, setPaletteActive] = useState<Record<string, boolean>>(
    Object.fromEntries(PALETTES.map(p => [p.id, p.active]))
  )
  const [deletedScripts, setDeletedScripts] = useState<string[]>([])
  const [customPalettes, setCustomPalettes] = useState<{ id: string; name: string }[]>([])
  const [uploadFileName, setUploadFileName] = useState<string>("")
  const [macroRun, setMacroRun] = useState<{ id: string; step: number; total: number } | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const runMacro = (id: string, name: string, steps: number) => {
    if (macroRun) return
    const total = Math.max(1, steps)
    setMacroRun({ id, step: 0, total })
    let current = 0
    const timer = setInterval(() => {
      current += 1
      if (current >= total) {
        clearInterval(timer)
        setMacroRun({ id, step: total, total })
        showToast(`✓ Макрос «${name}» выполнен (${total} шагов)`)
        setTimeout(() => setMacroRun(null), 900)
      } else {
        setMacroRun({ id, step: current, total })
      }
    }, 320)
  }

  const runCommand = (cmd?: string) => {
    const c = (cmd ?? command).trim().toUpperCase()
    if (!c) return
    setHistory(h => [...h, c])
    const allCommands = LSP_SCRIPTS.flatMap(s => s.commands)
    if (allCommands.includes(c)) {
      const script = LSP_SCRIPTS.find(s => s.commands.includes(c))
      if (script && scriptStatuses[script.id] === "not_loaded") {
        showToast(`Скрипт «${script.name}» не загружен. Сначала нажмите «Загрузить».`)
      } else {
        showToast(`▶ Команда выполнена: ${c}`)
      }
    } else if (c === "APPLOAD") {
      setShowUploadDialog("lisp")
    } else if (c === "CLEAR" || c === "CLS") {
      setHistory([])
      showToast("История очищена")
    } else if (c === "?") {
      showToast(`Доступно команд: ${allCommands.length}. Список во вкладках`)
    } else {
      showToast(`Неизвестная команда: ${c}. Введите ? для справки`)
    }
    setCommand("")
  }

  const loadScript = (id: string, name: string) => {
    setScriptStatuses(s => ({ ...s, [id]: "loaded" }))
    showToast(`✓ Скрипт «${name}» загружен в память`)
  }

  const reloadScript = (name: string) => {
    showToast(`↻ Скрипт «${name}» перезагружен`)
  }

  const filteredLsp = LSP_SCRIPTS.filter(s => {
    if (deletedScripts.includes(s.id)) return false
    const matchCat = catFilter === "all" || s.category === catFilter
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.desc.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const reallyDeleteScript = (id: string, name: string) => {
    if (!window.confirm(`Удалить скрипт «${name}» из библиотеки?`)) return
    setDeletedScripts(prev => [...prev, id])
    showToast(`Скрипт «${name}» удалён из библиотеки`)
  }

  const downloadText = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] overflow-hidden">
      {/* Шапка */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <Icon name="Wrench" size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-gray-900">Инструменты и автоматизация</h1>
            <p className="text-[11px] text-gray-500">LSP-скрипты, плагины DLL, макросы, палитры CUI</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => setShowUploadDialog("lisp")}>
            <Icon name="FolderOpen" size={13} />Загрузить LISP
          </Button>
          <Button variant="outline" size="sm" className="text-xs gap-1.5 border-gray-800 hover:bg-gray-100" onClick={() => setShowGitHub(true)}>
            <Icon name="Github" size={13} fallback="Code2" />GitHub
          </Button>
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => onNavigate?.("civilcad")}>
            <Icon name="Monitor" size={13} />Редактор
          </Button>
          <Button size="sm" className="text-xs gap-1.5 bg-violet-600 hover:bg-violet-700" onClick={() => setShowUploadDialog("plugin")}>
            <Icon name="Plus" size={13} />Установить плагин
          </Button>
        </div>
      </div>

      {/* Командная строка */}
      <div className="bg-[#1e1e2e] px-4 py-2 flex items-center gap-3 border-b border-gray-800">
        <span className="text-[11px] text-gray-400 font-mono">КОМАНДА:</span>
        <Input
          value={command}
          onChange={e => setCommand(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") runCommand() }}
          placeholder="Введите команду LISP (напр. GPEDIT) или APPLOAD для загрузки скрипта..."
          className="flex-1 h-7 text-[11px] font-mono bg-[#252535] border-gray-700 text-green-400 placeholder:text-gray-600 focus:border-green-500"
        />
        <button onClick={() => runCommand()}
          className="text-[10px] text-white bg-green-600 hover:bg-green-500 px-3 py-1 rounded border border-green-500 font-mono font-bold transition-colors">
          ENTER ↵
        </button>
        {history.length > 0 && (
          <button onClick={() => setCommand(history[history.length - 1])} title="Последняя команда"
            className="text-[10px] text-gray-400 hover:text-white px-2 py-1 rounded border border-gray-700 font-mono transition-colors">
            ↑ {history[history.length - 1].slice(0, 10)}
          </button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-6">
          <TabsList className="h-10 bg-transparent gap-4 p-0">
            {[
              { id: "lsp", label: "LSP-скрипты", icon: "Code2", count: LSP_SCRIPTS.length },
              { id: "dll", label: "Плагины DLL", icon: "Package", count: DLL_PLUGINS.length },
              { id: "macros", label: "Макросы SCR", icon: "Zap", count: MACROS.length },
              { id: "palettes", label: "Палитры CUI", icon: "LayoutGrid", count: PALETTES.length },
            ].map(t => (
              <TabsTrigger key={t.id} value={t.id}
                className="h-10 px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-violet-600 data-[state=active]:text-violet-700 data-[state=active]:bg-transparent text-xs font-medium gap-1.5">
                <Icon name={t.icon} size={13} />
                {t.label}
                <span className="ml-1 text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-bold">{t.count}</span>
              </TabsTrigger>
            ))}
            <TabsTrigger value="cat-layers"
              className="h-10 px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-violet-600 data-[state=active]:text-violet-700 data-[state=active]:bg-transparent text-xs font-medium gap-1.5">
              <Icon name="Sparkles" size={13} />
              Слои
            </TabsTrigger>
            <TabsTrigger value="cat-blocks"
              className="h-10 px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-violet-600 data-[state=active]:text-violet-700 data-[state=active]:bg-transparent text-xs font-medium gap-1.5">
              <Icon name="Sparkles" size={13} />
              Блоки
            </TabsTrigger>
            <TabsTrigger value="cat-xref"
              className="h-10 px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-violet-600 data-[state=active]:text-violet-700 data-[state=active]:bg-transparent text-xs font-medium gap-1.5">
              <Icon name="Sparkles" size={13} />
              Xref
            </TabsTrigger>
            <TabsTrigger value="cat-ai"
              className="h-10 px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-violet-600 data-[state=active]:text-violet-700 data-[state=active]:bg-transparent text-xs font-medium gap-1.5">
              <Icon name="Sparkles" size={13} />
              ИИ
            </TabsTrigger>
            <TabsTrigger value="cat-collab"
              className="h-10 px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-violet-600 data-[state=active]:text-violet-700 data-[state=active]:bg-transparent text-xs font-medium gap-1.5">
              <Icon name="Sparkles" size={13} />
              Совместная работа
            </TabsTrigger>
          </TabsList>
        </div>

        {/* LSP-скрипты */}
        <TabsContent value="lsp" className="flex-1 overflow-auto m-0 p-4">
          <div className="flex gap-4 h-full">
            {/* Фильтры */}
            <div className="w-44 bg-white rounded-xl border border-gray-200 p-3 space-y-1 h-fit">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide px-2 pb-1">Категория</p>
              {CATEGORIES_LSP.map(cat => (
                <button key={cat.id} onClick={() => setCatFilter(cat.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors ${catFilter === cat.id ? "bg-violet-50 text-violet-700 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}>
                  <Icon name={cat.icon} size={13} />
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex-1 space-y-3">
              <Input placeholder="Поиск скриптов..." className="h-8 text-xs bg-white"
                value={search} onChange={e => setSearch(e.target.value)} />

              {filteredLsp.map(script => {
                const currentStatus = scriptStatuses[script.id] || script.status
                const st = STATUS_STYLE[currentStatus]
                return (
                  <motion.div key={script.id} layout
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden relative">
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                          <Icon name="Code2" size={18} className="text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[13px] font-bold text-gray-900">{script.name}</span>
                            <code className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">{script.file}</code>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                              style={{ background: st.bg, color: st.color }}>{st.label}</span>
                            <span className="text-[10px] text-gray-400">v{script.version}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 mb-2">{script.desc}</p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {script.commands.map(cmd => (
                              <code key={cmd}
                                onClick={() => { setCommand(cmd); runCommand(cmd) }}
                                title="Кликните чтобы выполнить"
                                className="text-[9px] bg-[#1e1e2e] text-green-400 px-2 py-1 rounded font-mono cursor-pointer hover:bg-green-600 hover:text-white transition-colors">
                                {cmd}
                              </code>
                            ))}
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-gray-400">
                            <span>{script.author}</span>
                            <span>·</span>
                            <span>{script.size}</span>
                            <span>·</span>
                            <span>{script.downloads} загрузок</span>
                            <div className="flex gap-1 ml-1">
                              {script.tags.map(tag => (
                                <span key={tag} className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{tag}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0 relative">
                          {currentStatus === "not_loaded" ? (
                            <Button size="sm" className="text-xs h-7 bg-violet-600 hover:bg-violet-700 gap-1"
                              onClick={() => loadScript(script.id, script.name)}>
                              <Icon name="Upload" size={11} />Загрузить
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" className="text-xs h-7 gap-1"
                              onClick={() => reloadScript(script.name)}>
                              <Icon name="RefreshCw" size={11} />Перезагрузить
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="text-xs h-7 px-2"
                            onClick={() => setOpenMenu(openMenu === script.id ? null : script.id)}>
                            <Icon name="MoreHorizontal" size={13} />
                          </Button>
                          {openMenu === script.id && (
                            <div className="absolute right-0 top-9 z-30 bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[180px]">
                              {[
                                { icon: "Eye",        label: "Просмотреть код",   action: () => showToast(`Открыт ${script.file}`) },
                                { icon: "Edit",       label: "Редактировать",      action: () => { onNavigate?.("civilcad"); showToast("Открыт редактор скриптов") } },
                                { icon: "Settings",   label: "Настройки скрипта",  action: () => showToast("Настройки скрипта открыты") },
                                { icon: "FileText",   label: "Документация",       action: () => showToast(`Документация ${script.name}`) },
                                { icon: "Download",   label: "Скачать .lsp",       action: () => { downloadText(script.file, `;;; ${script.name}\n;;; ${script.desc}\n;;; Команды: ${script.commands.join(", ")}\n(princ "\\n${script.name} загружен")\n(princ)`); showToast(`Скачивание ${script.file}…`) } },
                                { icon: "Power",      label: currentStatus === "loaded" ? "Выгрузить" : "Загрузить",
                                  action: () => {
                                    setScriptStatuses(s => ({ ...s, [script.id]: currentStatus === "loaded" ? "not_loaded" : "loaded" }))
                                    showToast(currentStatus === "loaded" ? `Скрипт выгружен` : `Скрипт загружен`)
                                  }
                                },
                                { icon: "Trash2",     label: "Удалить",            action: () => reallyDeleteScript(script.id, script.name), danger: true },
                              ].map(item => (
                                <button key={item.label}
                                  onClick={() => { item.action(); setOpenMenu(null) }}
                                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-gray-100 transition-colors ${item.danger ? "text-red-600 hover:bg-red-50" : "text-gray-700"}`}>
                                  <Icon name={item.icon} size={12} />
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}

              {/* Загрузить новый */}
              <div onClick={() => setShowUploadDialog("lisp")}
                className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-violet-300 hover:bg-violet-50/30 transition-colors cursor-pointer">
                <Icon name="Plus" size={24} className="text-gray-300 mx-auto mb-2" />
                <p className="text-[12px] font-semibold text-gray-500">Загрузить LSP-скрипт</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Перетащите .lsp-файл или нажмите для выбора</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* DLL-плагины */}
        <TabsContent value="dll" className="flex-1 overflow-auto m-0 p-4">
          <div className="grid grid-cols-2 gap-4">
            {DLL_PLUGINS.map(plugin => {
              const pluginStatus = pluginStatuses[plugin.id]
              const st = STATUS_STYLE[pluginStatus]
              return (
                <motion.div key={plugin.id} whileHover={{ y: -1 }}
                  className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: plugin.color + "18" }}>
                      <Icon name={plugin.icon} size={22} style={{ color: plugin.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[14px] font-bold text-gray-900">{plugin.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ background: st.bg, color: st.color }}>{st.label}</span>
                      </div>
                      <code className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">{plugin.file}</code>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">{plugin.desc}</p>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: "Версия", value: `v${plugin.version}` },
                      { label: "Размер", value: plugin.size },
                      { label: "Команд", value: plugin.commands.toString() },
                    ].map(s => (
                      <div key={s.label} className="text-center bg-gray-50 rounded-lg p-2">
                        <div className="text-[12px] font-bold text-gray-800">{s.value}</div>
                        <div className="text-[9px] text-gray-400">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 flex-1">Лента: <strong>{plugin.ribbon}</strong></span>
                    <Button size="sm" variant={pluginStatus === "active" ? "outline" : "default"}
                      onClick={() => {
                        const next = pluginStatus === "active" ? "inactive" : "active"
                        setPluginStatuses(s => ({ ...s, [plugin.id]: next }))
                        showToast(next === "active" ? `Плагин «${plugin.name}» включён` : `Плагин «${plugin.name}» отключён`)
                      }}
                      className="text-xs h-7" style={pluginStatus !== "active" ? { background: plugin.color } : {}}>
                      {pluginStatus === "active" ? "Отключить" : "Включить"}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs h-7 px-2"
                      onClick={() => showToast(`Настройки плагина «${plugin.name}»`)}>
                      <Icon name="Settings" size={12} />
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Icon name="AlertTriangle" size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[12px] font-semibold text-amber-800">Совместимость плагинов</p>
              <p className="text-[11px] text-amber-700 mt-0.5">Убедитесь, что плагин совместим с ЛАПА 3D 2027. Несовместимые плагины могут вызвать ошибки. Всегда делайте резервную копию перед установкой новых DLL.</p>
            </div>
          </div>
        </TabsContent>

        {/* Макросы */}
        <TabsContent value="macros" className="flex-1 overflow-auto m-0 p-4 space-y-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-1">
            <h3 className="text-[12px] font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Icon name="Zap" size={13} className="text-yellow-500" />
              Запуск макроса через команду SCRIPT
            </h3>
            <div className="flex gap-2">
              <Input placeholder="Путь к .scr-файлу или имя макроса..." className="h-8 text-xs font-mono flex-1"
                onKeyDown={e => { if (e.key === "Enter" && (e.target as HTMLInputElement).value) showToast(`▶ Макрос ${(e.target as HTMLInputElement).value} запущен`) }}/>
              <Button size="sm" className="text-xs h-8 gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-white"
                onClick={() => showToast("▶ Макрос запущен из командной строки")}>
                <Icon name="Play" size={12} />Запустить
              </Button>
            </div>
          </div>

          {MACROS.map(macro => (
            <motion.div key={macro.id} layout className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center flex-shrink-0">
                  <Icon name="Zap" size={16} className="text-yellow-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-bold text-gray-900">{macro.name}</span>
                    <code className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">{macro.file}</code>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                      style={{ background: STATUS_STYLE[macro.status].bg, color: STATUS_STYLE[macro.status].color }}>
                      {STATUS_STYLE[macro.status].label}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mb-2">{macro.desc}</p>
                  <div className="flex items-center gap-4 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1"><Icon name="GitCommit" size={10} />{macro.steps} шагов</span>
                    <span className="flex items-center gap-1"><Icon name="Clock" size={10} />{macro.runTime}</span>
                  </div>
                  {macroRun?.id === macro.id && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-yellow-700 font-semibold flex items-center gap-1">
                          <Icon name="Loader" size={10} className="animate-spin" />
                          {macroRun.step >= macroRun.total ? "Готово" : `Шаг ${macroRun.step} из ${macroRun.total}`}
                        </span>
                        <span className="text-gray-400">{Math.round((macroRun.step / macroRun.total) * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-yellow-500 rounded-full"
                          animate={{ width: `${(macroRun.step / macroRun.total) * 100}%` }}
                          transition={{ duration: 0.25 }} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" disabled={!!macroRun} className="text-xs h-7 bg-yellow-500 hover:bg-yellow-600 text-white gap-1 disabled:opacity-60"
                    onClick={() => runMacro(macro.id, macro.name, macro.steps)}>
                    <Icon name={macroRun?.id === macro.id ? "Loader" : "Play"} size={11} className={macroRun?.id === macro.id ? "animate-spin" : ""} />
                    {macroRun?.id === macro.id ? "Выполняется" : "Запустить"}
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-7 px-2"
                    onClick={() => { onNavigate?.("civilcad"); showToast(`Открыт редактор макроса «${macro.name}»`) }}>
                    <Icon name="Edit3" size={11} />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Редактор макроса с подсветкой синтаксиса */}
          <CodeEditor lang="scr" showToast={showToast} />
        </TabsContent>

        {/* Палитры CUI */}
        <TabsContent value="palettes" className="flex-1 overflow-auto m-0 p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {PALETTES.map(palette => {
              const isActive = paletteActive[palette.id]
              return (
              <motion.div key={palette.id} whileHover={{ y: -1 }}
                className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <Icon name="LayoutGrid" size={18} className="text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[13px] font-bold text-gray-900">{palette.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {isActive ? "Активна" : "Отключена"}
                      </span>
                    </div>
                    <code className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">{palette.file}</code>
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 mb-3">{palette.desc}</p>
                <div className="mb-3">
                  <p className="text-[10px] font-semibold text-gray-500 mb-1.5">Группы инструментов ({palette.items} инструментов):</p>
                  <div className="flex flex-wrap gap-1">
                    {palette.groups.map(g => (
                      <span key={g} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{g}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant={isActive ? "outline" : "default"}
                    onClick={() => {
                      setPaletteActive(s => ({ ...s, [palette.id]: !isActive }))
                      showToast(isActive ? `Палитра «${palette.name}» скрыта` : `Палитра «${palette.name}» открыта в редакторе`)
                    }}
                    className="text-xs h-7 flex-1">
                    {isActive ? "Скрыть палитру" : "Показать палитру"}
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-7 px-2"
                    onClick={() => { onNavigate?.("civilcad"); showToast(`Настройки палитры «${palette.name}»`) }}>
                    <Icon name="Settings" size={12} />
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-7 px-2"
                    onClick={() => { downloadText(palette.file, `<?xml version="1.0"?>\n<CUI name="${palette.name}">\n  <!-- ${palette.desc} -->\n${palette.groups.map(g => `  <Group name="${g}"/>`).join("\n")}\n</CUI>`); showToast(`Скачивание ${palette.file}…`) }}>
                    <Icon name="Download" size={12} />
                  </Button>
                </div>
              </motion.div>
              )
            })}
          </div>

          {/* Созданные пользователем палитры */}
          {customPalettes.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {customPalettes.map(cp => (
                <div key={cp.id} className="bg-white rounded-xl border border-green-200 p-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                    <Icon name="LayoutGrid" size={18} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-gray-900">{cp.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-green-100 text-green-700">Создана</span>
                    </div>
                    <p className="text-[11px] text-gray-500">Пользовательская палитра CUI</p>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs h-7 px-2 text-red-600"
                    onClick={() => setCustomPalettes(prev => prev.filter(p => p.id !== cp.id))}>
                    <Icon name="Trash2" size={12} />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Кастомный CUI */}
          <CustomCUI onCreate={(name) => {
            setCustomPalettes(prev => [...prev, { id: `cp_${Date.now()}`, name }])
            showToast(`Палитра «${name}» создана`)
          }} />
        </TabsContent>

        <TabsContent value="cat-layers" className="p-6 overflow-auto"><CategoryFeaturesGrid category="layers" /></TabsContent>
        <TabsContent value="cat-blocks" className="p-6 overflow-auto"><CategoryFeaturesGrid category="blocks" /></TabsContent>
        <TabsContent value="cat-xref" className="p-6 overflow-auto"><CategoryFeaturesGrid category="xref" /></TabsContent>
        <TabsContent value="cat-ai" className="p-6 overflow-auto"><CategoryFeaturesGrid category="ai" /></TabsContent>
        <TabsContent value="cat-collab" className="p-6 overflow-auto"><CategoryFeaturesGrid category="collab" /></TabsContent>
      </Tabs>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm shadow-xl border border-gray-700 flex items-center gap-2">
            <Icon name="CheckCircle" size={14} className="text-green-400" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Диалог загрузки файла ── */}
      <AnimatePresence>
        {showUploadDialog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/60 flex items-center justify-center p-4"
            onClick={() => setShowUploadDialog(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full overflow-hidden"
              style={{ maxWidth: "min(500px, 94vw)", maxHeight: "85vh" }}
              onClick={e => e.stopPropagation()}>
              <div className="bg-violet-600 px-5 py-3 flex items-center justify-between">
                <span className="text-white font-bold text-sm flex items-center gap-2">
                  <Icon name={showUploadDialog === "lisp" ? "Code2" : "Package"} size={14} />
                  {showUploadDialog === "lisp" ? "Загрузить LSP-скрипт" : "Установить DLL-плагин"}
                </span>
                <button onClick={() => setShowUploadDialog(null)} className="text-white hover:bg-violet-700 w-6 h-6 rounded">✕</button>
              </div>
              <div className="p-5 space-y-4">
                <label htmlFor="upload-file"
                  className="block border-2 border-dashed border-violet-300 rounded-xl p-8 text-center hover:bg-violet-50/30 transition-colors cursor-pointer">
                  <Icon name={uploadFileName ? "FileCheck" : "Upload"} size={32} className={`mx-auto mb-2 ${uploadFileName ? "text-green-500" : "text-violet-400"}`} fallback="Upload" />
                  {uploadFileName ? (
                    <p className="text-sm font-semibold text-green-700">Выбран файл: {uploadFileName}</p>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-gray-700">Перетащите файл {showUploadDialog === "lisp" ? ".lsp" : ".dll"}</p>
                      <p className="text-xs text-gray-500 mt-1">или нажмите для выбора с компьютера</p>
                    </>
                  )}
                  <input type="file" accept={showUploadDialog === "lisp" ? ".lsp,.vlx,.fas" : ".dll,.arx,.crx"} className="hidden" id="upload-file"
                    onChange={e => setUploadFileName(e.target.files?.[0]?.name || "")} />
                </label>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-gray-500 mb-1">Поддерживаемые форматы:</div>
                    <div className="text-gray-900 font-mono font-semibold">{showUploadDialog === "lisp" ? ".lsp, .vlx, .fas" : ".dll, .arx, .crx"}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-gray-500 mb-1">Макс. размер:</div>
                    <div className="text-gray-900 font-mono font-semibold">10 МБ</div>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex gap-2">
                  <Icon name="ShieldAlert" size={14} className="text-amber-600 flex-shrink-0 mt-0.5" fallback="AlertTriangle" />
                  <span>Загружайте только файлы из доверенных источников. ЛАПА проверит файл на безопасность.</span>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => { setShowUploadDialog(null); setUploadFileName("") }}>Отмена</Button>
                  <Button size="sm" className="bg-violet-600 hover:bg-violet-700" disabled={!uploadFileName}
                    onClick={() => {
                      showToast(showUploadDialog === "lisp" ? `LSP-скрипт «${uploadFileName}» загружен в библиотеку` : `DLL-плагин «${uploadFileName}» установлен`)
                      setShowUploadDialog(null)
                      setUploadFileName("")
                    }}>
                    <Icon name="Upload" size={12} className="mr-1.5" />
                    {showUploadDialog === "lisp" ? "Загрузить" : "Установить"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── GitHub-импорт скриптов ── */}
      <AnimatePresence>
        {showGitHub && (
          <GitHubImportDialog onClose={() => setShowGitHub(false)}
            onImport={(name) => { showToast(`✓ Скрипт «${name}» импортирован с GitHub`); setShowGitHub(false) }}/>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── CodeEditor с подсветкой синтаксиса LISP / SCR ────────────────────────────
function highlightCode(code: string, lang: "lisp" | "scr"): string {
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  let html = escape(code)

  // Комментарии (после строк, чтобы не ломались внутри)
  if (lang === "lisp") {
    html = html.replace(/(;[^\n]*)/g, '<span style="color:#6b7280;font-style:italic">$1</span>')
  } else {
    html = html.replace(/(;[^\n]*)/g, '<span style="color:#6b7280;font-style:italic">$1</span>')
  }

  // Строки в кавычках
  html = html.replace(/("[^"]*")/g, '<span style="color:#fbbf24">$1</span>')

  if (lang === "lisp") {
    // Скобки
    html = html.replace(/([()])/g, '<span style="color:#94a3b8">$1</span>')
    // Ключевые слова LISP
    const keywords = ["defun","setq","if","cond","while","foreach","lambda","let","progn","quote","car","cdr","cons","list","mapcar","princ","prin1","alert","getstring","getreal","getint","getpoint","entsel","entget","entmod","ssget","sslength","ssname","entlast","getvar","setvar","command","load","atoi","itoa","rtos","strcat","substr","strlen","T","nil","not","and","or","eq","equal","<","<=",">",">=","="]
    keywords.forEach(kw => {
      const re = new RegExp(`\\b(${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\b`, "g")
      html = html.replace(re, '<span style="color:#60a5fa;font-weight:600">$1</span>')
    })
    // Команды c:CMD
    html = html.replace(/\b(c:\w+)/g, '<span style="color:#f97316;font-weight:700">$1</span>')
    // Числа
    html = html.replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#a78bfa">$1</span>')
  } else {
    // SCR команды AutoCAD (_.OPEN, _.PLOT и т.д.)
    html = html.replace(/(_\.[A-Z]+)/g, '<span style="color:#fb923c;font-weight:700">$1</span>')
    // Слова в верхнем регистре (опции)
    html = html.replace(/\b(ON|OFF|YES|NO|ALL|CLOSE|OPEN)\b/g, '<span style="color:#60a5fa">$1</span>')
  }

  return html
}

const SAMPLE_CODE = {
  scr: `; Пакетная обработка — сохранение в PDF
_.OPEN
"C:/Projects/road_final.dwg"

_.LAYER
"ON"
"*"

_.PLOT
"PDF"
"A1"

_.SAVEAS
"C:/Export/road_final.pdf"

; Конец макроса`,
  lisp: `; GeoPoints Edit — массовое редактирование точек
(defun c:GPEDIT ( / ss n ent)
  (princ "\\nВыберите точки съёмки: ")
  (setq ss (ssget '((0 . "POINT"))))
  (if ss
    (progn
      (setq n 0)
      (while (< n (sslength ss))
        (setq ent (ssname ss n))
        (entmod (subst (cons 8 "TOPO") (assoc 8 (entget ent)) (entget ent)))
        (setq n (1+ n))
      )
      (alert (strcat "Обновлено точек: " (itoa n)))
    )
    (princ "\\nНе выбрано точек.")
  )
  (princ)
)`,
}

function CodeEditor({ lang, showToast }: { lang: "lisp" | "scr"; showToast: (m: string) => void }) {
  const [code, setCode] = useState(SAMPLE_CODE[lang])
  const lineCount = code.split("\n").length

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
        <span className="text-[12px] font-semibold text-gray-700 flex items-center gap-2">
          <Icon name="FileCode" size={13} className="text-gray-500" />
          Редактор {lang === "lisp" ? "LISP (.lsp)" : "макроса (.scr)"}
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 font-bold">
            {lang.toUpperCase()}
          </span>
          <span className="text-[10px] text-gray-400">{lineCount} строк</span>
        </span>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" className="text-xs h-6 px-2"
            onClick={() => { setCode(SAMPLE_CODE[lang]); showToast("Сброшено к примеру") }}>
            <Icon name="RotateCcw" size={10} className="mr-1" fallback="RefreshCw" />Сброс
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-6 px-2"
            onClick={() => { navigator.clipboard?.writeText(code); showToast("Код скопирован") }}>
            <Icon name="Copy" size={10} className="mr-1" />Копировать
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-6 px-2"
            onClick={() => showToast(`Файл сохранён в .${lang}`)}>
            Сохранить
          </Button>
          <Button size="sm" className="text-xs h-6 px-2 bg-yellow-500 hover:bg-yellow-600 text-white"
            onClick={() => showToast(lang === "lisp" ? "▶ LISP-скрипт выполнен" : "▶ Макрос запущен")}>
            <Icon name="Play" size={10} className="mr-1" />Запустить
          </Button>
        </div>
      </div>

      <div className="relative flex bg-[#1e1e2e]" style={{ minHeight: 240 }}>
        {/* Нумерация строк */}
        <div className="bg-[#161620] py-3 px-3 text-right text-[10px] font-mono text-gray-600 select-none border-r border-gray-800">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} style={{ lineHeight: "1.6" }}>{i + 1}</div>
          ))}
        </div>

        {/* Контейнер редактора + подсветка */}
        <div className="relative flex-1">
          {/* Подсветка снизу */}
          <pre
            aria-hidden="true"
            className="absolute inset-0 p-3 text-[11px] font-mono leading-relaxed overflow-auto whitespace-pre-wrap break-words m-0"
            style={{ color: "#e2e8f0", pointerEvents: "none" }}
            dangerouslySetInnerHTML={{ __html: highlightCode(code, lang) + "\n" }}
          />
          {/* Textarea сверху — прозрачный */}
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            spellCheck={false}
            className="absolute inset-0 p-3 text-[11px] font-mono leading-relaxed bg-transparent text-transparent caret-white outline-none resize-none whitespace-pre-wrap break-words"
            style={{ caretColor: "#22d3ee" }}
          />
        </div>
      </div>

      {/* Подсказки */}
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center gap-4 text-[10px] text-gray-500 flex-wrap">
        {lang === "lisp" ? (
          <>
            <span><span className="inline-block w-2 h-2 rounded-full bg-[#60a5fa] mr-1"/>Функции</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-[#f97316] mr-1"/>Команды c:</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-[#fbbf24] mr-1"/>Строки</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-[#a78bfa] mr-1"/>Числа</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-gray-500 mr-1"/>Комментарии</span>
          </>
        ) : (
          <>
            <span><span className="inline-block w-2 h-2 rounded-full bg-[#fb923c] mr-1"/>Команды AutoCAD</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-[#60a5fa] mr-1"/>Опции</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-[#fbbf24] mr-1"/>Пути файлов</span>
          </>
        )}
        <span className="ml-auto text-gray-400">Tab — отступ · Ctrl+S — сохранить</span>
      </div>
    </div>
  )
}

// ─── GitHub-импорт скриптов ────────────────────────────────────────────────────
const GITHUB_REPOS = [
  { id: 1, name: "civilcad-lisp/road-tools",  stars: 1240, lang: "AutoLISP", desc: "Автоматизация дорожных проектов: пикеты, виражи, ведомости элементов трассы", files: 24, updated: "3 дня назад" },
  { id: 2, name: "geocad/survey-toolkit",     stars: 892,  lang: "AutoLISP", desc: "Расширенные инструменты съёмки: импорт RW5, классификация точек, отчёты", files: 18, updated: "1 неделю назад" },
  { id: 3, name: "ru-civil/network-utils",    stars: 567,  lang: "AutoLISP", desc: "Утилиты для инженерных сетей: нумерация колодцев, профили, гидравлика", files: 12, updated: "2 дня назад" },
  { id: 4, name: "dynamo-civil/python-nodes", stars: 2104, lang: "Python",   desc: "Кастомные ноды для Dynamo: поверхности TIN, объёмы, коридоры", files: 47, updated: "вчера" },
  { id: 5, name: "civil-tools/volume-calc",   stars: 423,  lang: "AutoLISP", desc: "Точный расчёт объёмов земляных работ методом Симпсона и средних сечений", files: 8,  updated: "5 дней назад" },
  { id: 6, name: "openroads/macros-batch",    stars: 678,  lang: "SCR",      desc: "Пакетные макросы для массовой обработки чертежей: PDF/DWG экспорт", files: 31, updated: "1 месяц назад" },
]

function GitHubImportDialog({ onClose, onImport }: { onClose: () => void; onImport: (name: string) => void }) {
  const [tab, setTab] = useState<"search" | "url">("search")
  const [search, setSearch] = useState("")
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState<number | null>(null)
  const [imported, setImported] = useState<Set<number>>(new Set())

  const filtered = GITHUB_REPOS.filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.desc.toLowerCase().includes(search.toLowerCase())
  )

  const importRepo = (repo: typeof GITHUB_REPOS[0]) => {
    setLoading(repo.id)
    setTimeout(() => {
      setLoading(null)
      setImported(s => new Set([...s, repo.id]))
      onImport(repo.name.split("/")[1])
    }, 900)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden"
        style={{ maxWidth: "min(720px, 96vw)", maxHeight: "88vh" }}
        onClick={e => e.stopPropagation()}>

        <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-5 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon name="Github" size={16} className="text-white" fallback="Code2"/>
            <span className="text-white font-bold text-sm">Импорт скриптов с GitHub</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 font-bold border border-purple-500/40">BETA</span>
          </div>
          <button onClick={onClose} className="text-white hover:bg-gray-700 w-6 h-6 rounded">✕</button>
        </div>

        {/* Вкладки */}
        <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0">
          {([["search", "Поиск репозиториев", "Search"], ["url", "Импорт по URL", "Link"]] as const).map(([id, lbl, icon]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-4 py-2 text-xs font-semibold transition-colors flex items-center gap-1.5 ${tab === id ? "text-violet-700 border-b-2 border-violet-600 bg-white" : "text-gray-500 hover:bg-gray-100"}`}>
              <Icon name={icon} size={12}/>
              {lbl}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-4 min-h-0">
          {tab === "search" && (
            <div className="space-y-3">
              <div className="relative">
                <Icon name="Search" size={13} className="absolute left-2.5 top-2.5 text-gray-400"/>
                <Input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Поиск: autolisp civil, dynamo civil, scr macro..."
                  className="h-8 text-xs pl-7"/>
              </div>

              <div className="flex gap-2 text-[10px] flex-wrap">
                <span className="text-gray-500 self-center">Популярные:</span>
                {["autolisp", "dynamo", "scr", "civil 3d", "geo"].map(t => (
                  <button key={t} onClick={() => setSearch(t)}
                    className="px-2 py-0.5 rounded-full bg-gray-100 hover:bg-violet-100 hover:text-violet-700 text-gray-600 transition-colors">
                    {t}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {filtered.map(repo => {
                  const isImported = imported.has(repo.id)
                  const isLoading = loading === repo.id
                  return (
                    <div key={repo.id} className="border border-gray-200 rounded-lg p-3 hover:border-violet-300 hover:bg-violet-50/30 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
                          <Icon name="Github" size={16} className="text-white" fallback="Code2"/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="text-[12px] font-bold text-gray-900">{repo.name}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold bg-violet-100 text-violet-700">{repo.lang}</span>
                            <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                              <Icon name="Star" size={10} className="text-yellow-500"/>
                              {repo.stars}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600 mb-1.5">{repo.desc}</p>
                          <div className="text-[10px] text-gray-400 flex items-center gap-2">
                            <span className="flex items-center gap-0.5"><Icon name="FileCode" size={9}/>{repo.files} файлов</span>
                            <span>·</span>
                            <span>обновлено {repo.updated}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button size="sm" variant="outline" className="text-xs h-7 px-2" title="Открыть на GitHub">
                            <Icon name="ExternalLink" size={11}/>
                          </Button>
                          {isImported ? (
                            <Button size="sm" disabled className="text-xs h-7 bg-green-600 hover:bg-green-600 text-white gap-1">
                              <Icon name="Check" size={11}/>Импорт.
                            </Button>
                          ) : (
                            <Button size="sm" disabled={isLoading} onClick={() => importRepo(repo)}
                              className="text-xs h-7 bg-violet-600 hover:bg-violet-700 gap-1">
                              {isLoading ? (
                                <><Icon name="Loader2" size={11} className="animate-spin" fallback="RefreshCw"/>...</>
                              ) : (
                                <><Icon name="Download" size={11}/>Импорт</>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {filtered.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">Ничего не найдено</div>
                )}
              </div>
            </div>
          )}

          {tab === "url" && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 block mb-1">URL репозитория GitHub</label>
                <Input value={url} onChange={e => setUrl(e.target.value)}
                  placeholder="https://github.com/user/repo или user/repo"
                  className="h-9 text-xs font-mono"/>
                <p className="text-[10px] text-gray-400 mt-1">Поддерживаются публичные репозитории с .lsp, .scr или .dll файлами</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-[11px] text-blue-800">
                <div className="font-bold mb-1 flex items-center gap-1">
                  <Icon name="Info" size={12}/>
                  Что произойдёт при импорте:
                </div>
                <ol className="space-y-0.5 ml-4 list-decimal">
                  <li>ЛАПА скачает все .lsp / .scr / .dll файлы из репозитория</li>
                  <li>Проверит файлы на безопасность и совместимость</li>
                  <li>Добавит в библиотеку с тегом «GitHub»</li>
                  <li>Установит автообновление при изменениях в репозитории</li>
                </ol>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={onClose}>Отмена</Button>
                <Button size="sm" disabled={!url.trim()}
                  onClick={() => {
                    const name = url.split("/").pop() || "GitHub Script"
                    onImport(name)
                  }}
                  className="bg-violet-600 hover:bg-violet-700 gap-1">
                  <Icon name="Download" size={12}/>Импортировать
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-2 border-t border-gray-200 bg-gray-50 text-[10px] text-gray-500 flex items-center justify-between flex-shrink-0">
          <span>Все импорты проверяются на безопасность · ЛАПА GitHub Bridge v1.0</span>
          <span className="text-violet-600 font-semibold">{imported.size} импортировано</span>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Кастомный CUI создатель ───────────────────────────────────────────────────
function CustomCUI({ onCreate }: { onCreate: (name: string) => void }) {
  const [name, setName] = useState("Мои инструменты")
  const [file, setFile] = useState("my_tools.cuix")
  const [icon, setIcon] = useState("Wrench")
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-[13px] font-bold text-gray-900 mb-3 flex items-center gap-2">
        <Icon name="Plus" size={14} className="text-indigo-600" />
        Создать пользовательскую палитру
      </h3>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="text-[10px] font-semibold text-gray-500 block mb-1">Название палитры</label>
          <Input value={name} onChange={e => setName(e.target.value)} className="h-8 text-xs" />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-gray-500 block mb-1">Файл (.cuix)</label>
          <Input value={file} onChange={e => setFile(e.target.value)} className="h-8 text-xs font-mono" />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-gray-500 block mb-1">Иконка</label>
          <Input value={icon} onChange={e => setIcon(e.target.value)} className="h-8 text-xs" />
        </div>
      </div>
      <Button className="text-xs h-8 gap-1.5 bg-indigo-600 hover:bg-indigo-700" onClick={() => onCreate(name)}>
        <Icon name="Plus" size={12} />Создать палитру CUI
      </Button>
    </div>
  )
}