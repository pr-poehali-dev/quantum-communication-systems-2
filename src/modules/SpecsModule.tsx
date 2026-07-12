import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import VersionFeaturesPanel from "@/modules/VersionFeaturesPanel"
import { экспортCSV, экспортExcel as утилExcel, экспортLandXML, экспортТекст } from "@/utils/exportImport"

interface SpecItem {
  id: number
  code: string
  name: string
  unit: string
  qty: number
  unitPrice: number
  category: string
}

interface CoordPoint {
  id: number
  name: string
  x: number
  y: number
  z: number
  desc: string
}

const CATEGORIES = ["Земляные работы", "Дорожная одежда", "Водоотвод", "Обустройство", "Инженерные сети"]

const INIT_SPECS: SpecItem[] = [
  { id: 1, code: "01-01-001", name: "Разработка грунта экскаватором", unit: "м³", qty: 15420, unitPrice: 180, category: "Земляные работы" },
  { id: 2, code: "01-01-005", name: "Уплотнение грунта катком", unit: "м³", qty: 18200, unitPrice: 65, category: "Земляные работы" },
  { id: 3, code: "02-03-001", name: "Устройство щебёночного основания h=25 см", unit: "м²", qty: 12500, unitPrice: 420, category: "Дорожная одежда" },
  { id: 4, code: "02-03-010", name: "Укладка АБ нижнего слоя h=8 см", unit: "м²", qty: 12500, unitPrice: 680, category: "Дорожная одежда" },
  { id: 5, code: "02-03-011", name: "Укладка АБ верхнего слоя h=5 см", unit: "м²", qty: 12500, unitPrice: 820, category: "Дорожная одежда" },
  { id: 6, code: "03-01-002", name: "Укладка трубы водопропускной Д=1000", unit: "пог.м", qty: 24, unitPrice: 12500, category: "Водоотвод" },
  { id: 7, code: "04-02-001", name: "Установка дорожных знаков", unit: "шт", qty: 48, unitPrice: 4500, category: "Обустройство" },
  { id: 8, code: "04-02-005", name: "Нанесение дорожной разметки", unit: "м²", qty: 850, unitPrice: 320, category: "Обустройство" },
]

const INIT_COORDS: CoordPoint[] = [
  { id: 1, name: "ПК0+00", x: 1245678.23, y: 356421.87, z: 120.45, desc: "Начало трассы" },
  { id: 2, name: "ПК1+00", x: 1245778.45, y: 356389.12, z: 121.12, desc: "" },
  { id: 3, name: "ПК2+00", x: 1245876.89, y: 356342.56, z: 122.08, desc: "Вершина угла ВУ-1" },
  { id: 4, name: "ПК3+00", x: 1245967.34, y: 356298.71, z: 121.95, desc: "" },
  { id: 5, name: "ПК4+00", x: 1246054.12, y: 356265.44, z: 122.76, desc: "Конец трассы" },
]

export default function SpecsModule() {
  const [specs, setSpecs] = useState<SpecItem[]>(INIT_SPECS)
  const [coords, setCoords] = useState<CoordPoint[]>(INIT_COORDS)
  const [filterCat, setFilterCat] = useState("all")
  const [form, setForm] = useState({ code: "", name: "", unit: "м²", qty: "", unitPrice: "", category: CATEGORIES[0] })
  const [coordForm, setCoordForm] = useState({ name: "", x: "", y: "", z: "", desc: "" })
  const [exportMsg, setExportMsg] = useState("")
  const [costItems] = useState([
    { id: 1, name: "Земляные работы (выемка)",      unit: "м³",   vol: 8500, price: 180,  total: 0 },
    { id: 2, name: "Земляные работы (насыпь)",       unit: "м³",   vol: 6200, price: 210,  total: 0 },
    { id: 3, name: "Асфальтобетон верхний слой",     unit: "т",    vol: 1240, price: 4800, total: 0 },
    { id: 4, name: "Асфальтобетон нижний слой",      unit: "т",    vol: 1860, price: 3900, total: 0 },
    { id: 5, name: "Щебень основание",               unit: "м³",   vol: 2100, price: 1200, total: 0 },
    { id: 6, name: "Бортовой камень БР 100.30.15",   unit: "м.п.", vol: 840,  price: 380,  total: 0 },
    { id: 7, name: "Дорожная разметка",              unit: "м²",   vol: 620,  price: 250,  total: 0 },
  ].map(r => ({ ...r, total: r.vol * r.price })))
  const [compareResult, setCompareResult] = useState<null | { type: string; obj: string; detail: string }[]>(null)

  const addSpec = () => {
    if (!form.name || !form.qty) return
    setSpecs(prev => [...prev, { id: Date.now(), code: form.code || `XX-${Date.now().toString().slice(-4)}`, name: form.name, unit: form.unit, qty: +form.qty, unitPrice: +form.unitPrice || 0, category: form.category }])
    setForm(f => ({ ...f, code: "", name: "", qty: "", unitPrice: "" }))
  }

  const addCoord = () => {
    if (!coordForm.name || !coordForm.x || !coordForm.y) return
    setCoords(prev => [...prev, { id: Date.now(), name: coordForm.name, x: +coordForm.x, y: +coordForm.y, z: +coordForm.z || 0, desc: coordForm.desc }])
    setCoordForm({ name: "", x: "", y: "", z: "", desc: "" })
  }

  const filtered = specs.filter(s => filterCat === "all" || s.category === filterCat)
  const totalCost = filtered.reduce((s, item) => s + item.qty * item.unitPrice, 0)

  const byCategory = CATEGORIES.map(cat => ({
    cat,
    items: specs.filter(s => s.category === cat),
    total: specs.filter(s => s.category === cat).reduce((s, i) => s + i.qty * i.unitPrice, 0),
  })).filter(c => c.items.length > 0)

  const handleExport = (fmt: string) => {
    if (fmt === "Excel" || fmt === "Excel (.xlsx)") {
      утилExcel(
        ["Код", "Наименование", "Ед.изм", "Кол-во", "Ед.цена", "Сумма"],
        specs.map(s => [s.code, s.name, s.unit, s.qty, s.unitPrice, s.qty * s.unitPrice]),
        "Ведомость",
        "specs.xls"
      )
    } else if (fmt === "CSV") {
      экспортCSV(
        ["Код", "Наименование", "Ед.изм", "Кол-во", "Ед.цена", "Сумма"],
        specs.map(s => [s.code, s.name, s.unit, s.qty, s.unitPrice, s.qty * s.unitPrice]),
        "specs.csv"
      )
    } else if (fmt === "LandXML") {
      экспортLandXML({ имя: "Ведомость объёмов" }, "specs.xml")
    } else if (fmt === "PDF" || fmt === "PDF-отчёт") {
      экспортТекст([
        "ВЕДОМОСТЬ ОБЪЁМОВ",
        "==================",
        `Дата: ${new Date().toLocaleDateString("ru")}`,
        "",
        "Код  Наименование  Ед.изм  Кол-во  Ед.цена  Сумма",
        ...specs.map(s => `${s.code}  ${s.name}  ${s.unit}  ${s.qty}  ${s.unitPrice}  ${s.qty * s.unitPrice}`),
        "",
        `Итого: ${specs.reduce((sum, s) => sum + s.qty * s.unitPrice, 0).toLocaleString("ru")} руб.`,
      ], "specs_report.txt")
    } else {
      экспортТекст([
        `Экспорт ведомости в формат ${fmt}`,
        `Дата: ${new Date().toLocaleDateString("ru")}`,
        `Позиций: ${specs.length}`,
      ], `specs_${fmt}.txt`)
    }
    setExportMsg(`Экспорт в ${fmt} выполнен`)
    setTimeout(() => setExportMsg(""), 2500)
  }

  const runCompare = () => setCompareResult([
    { type: "added",    obj: "Трасса ШД-38 v2",       detail: "Добавлена новая версия трассы" },
    { type: "modified", obj: "Поверхность DTM",        detail: "Обновлены исходные данные (284→312 точек)" },
    { type: "removed",  obj: "Коридор_old",            detail: "Удалён устаревший коридор" },
    { type: "added",    obj: "Ведомость объёмов v3",   detail: "Добавлена актуальная ведомость" },
    { type: "modified", obj: "Слой C-ROAD-EDGE",       detail: "Изменён цвет слоя #ef4444→#f97316" },
  ])

  const exportCostCSV = () => {
    const rows = [
      "Наименование,Ед.изм,Объём,Цена/ед,Сумма",
      ...costItems.map(r => `${r.name},${r.unit},${r.vol},${r.price},${r.total}`),
      `ИТОГО,,,,${costItems.reduce((s, r) => s + r.total, 0)}`,
    ].join('\n')
    const blob = new Blob([rows], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'cost_estimate.csv'
    a.click()
  }

  const exportExcel = (data: { headers: string[], rows: (string | number)[][], sheetName: string }) => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="${data.sheetName}">
    <Table>
      <Row>${data.headers.map(h => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join('')}</Row>
      ${data.rows.map(row => `<Row>${row.map(c => `<Cell><Data ss:Type="${typeof c === 'number' ? 'Number' : 'String'}">${c}</Data></Cell>`).join('')}</Row>`).join('\n      ')}
    </Table>
  </Worksheet>
</Workbook>`
    const blob = new Blob(['\uFEFF' + xml], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${data.sheetName}.xls`; a.click()
  }

  const exportSpecsExcel = () => exportExcel({
    sheetName: 'Ведомость',
    headers: ['Наименование', 'Ед.изм', 'Объём', 'Цена/ед', 'Сумма'],
    rows: [
      ...costItems.map(r => [r.name, r.unit, r.vol, r.price, r.total]),
      ['ИТОГО', '', '', '', costItems.reduce((s, r) => s + r.total, 0)]
    ]
  })

  const exportPointsExcel = () => exportExcel({
    sheetName: 'Координаты',
    headers: ['№', 'Имя', 'X (E)', 'Y (N)', 'Z (Отм.)', 'Описание'],
    rows: [[1, 'ТЧК-001', 100.25, 200.10, 121.55, 'TOPO'], [2, 'ТЧК-002', 150.30, 205.80, 122.10, 'EDGE'], [3, 'ТЧК-003', 180.90, 210.50, 119.80, 'LOW']]
  })

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Tabs defaultValue="specs">
        <TabsList className="mb-4">
          <TabsTrigger value="specs">Ведомость объёмов</TabsTrigger>
          <TabsTrigger value="materials">Сводная смета</TabsTrigger>
          <TabsTrigger value="coords">Ведомость координат</TabsTrigger>
          <TabsTrigger value="export">Экспорт</TabsTrigger>
          <TabsTrigger value="norms">Нормы материалов</TabsTrigger>
          <TabsTrigger value="compare">Сравнение версий</TabsTrigger>
        </TabsList>

        {/* SPECS */}
        <TabsContent value="specs" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><Label>Код работы</Label><Input placeholder="02-03-001" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} /></div>
            <div><Label>Наименование</Label><Input placeholder="Вид работ" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Единица</Label>
              <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["м³", "м²", "пог.м", "шт", "т", "компл"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Количество</Label><Input type="number" placeholder="100" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} /></div>
            <div><Label>Цена за ед. (₽)</Label><Input type="number" placeholder="500" value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))} /></div>
            <div><Label>Раздел</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={addSpec} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            <Icon name="Plus" size={16} /> Добавить позицию
          </Button>

          <div className="flex gap-3 items-center flex-wrap">
            <Select value={filterCat} onValueChange={setFilterCat}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Все разделы" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все разделы</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">{filtered.length} позиций</span>
          </div>

          <div className="rounded-xl border border-gray-200 overflow-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50 text-gray-500 font-semibold">
                <tr>
                  <th className="px-4 py-2 text-left w-6">#</th>
                  <th className="px-4 py-2 text-left">Код</th>
                  <th className="px-4 py-2 text-left">Наименование работ</th>
                  <th className="px-4 py-2 text-center">Ед.</th>
                  <th className="px-4 py-2 text-right">Кол-во</th>
                  <th className="px-4 py-2 text-right">Цена</th>
                  <th className="px-4 py-2 text-right">Сумма</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-2 font-mono text-xs text-indigo-600">{s.code}</td>
                    <td className="px-4 py-2 text-gray-800">{s.name}</td>
                    <td className="px-4 py-2 text-center text-gray-500">{s.unit}</td>
                    <td className="px-4 py-2 text-right font-mono">{s.qty.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right font-mono text-gray-500">{s.unitPrice.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right font-mono font-semibold text-gray-900">{(s.qty * s.unitPrice).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right"><button onClick={() => setSpecs(p => p.filter(x => x.id !== s.id))} className="text-gray-200 hover:text-red-500"><Icon name="X" size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td colSpan={6} className="px-4 py-2 font-bold text-gray-700 text-right">Итого:</td>
                  <td className="px-4 py-2 font-extrabold text-indigo-700 text-right font-mono">{totalCost.toLocaleString()} ₽</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </TabsContent>

        {/* SUMMARY */}
        <TabsContent value="materials" className="space-y-4">
          <div className="space-y-3">
            {byCategory.map(c => (
              <details key={c.cat} className="group rounded-xl border border-gray-200 overflow-hidden" open>
                <summary className="flex items-center justify-between px-5 py-3 bg-gray-50 cursor-pointer font-semibold text-gray-800 list-none hover:bg-gray-100">
                  <span className="flex items-center gap-2">
                    <Icon name="ChevronRight" size={14} className="group-open:rotate-90 transition-transform text-gray-400" />
                    {c.cat}
                    <span className="text-xs font-normal text-gray-400">{c.items.length} позиций</span>
                  </span>
                  <span className="font-mono font-extrabold text-indigo-700">{c.total.toLocaleString()} ₽</span>
                </summary>
                <div className="divide-y divide-gray-100">
                  {c.items.map(s => (
                    <div key={s.id} className="flex items-center justify-between px-5 py-2 text-sm hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-gray-400 w-24">{s.code}</span>
                        <span className="text-gray-700">{s.name}</span>
                      </div>
                      <div className="flex items-center gap-6 text-right">
                        <span className="text-gray-500 text-xs">{s.qty.toLocaleString()} {s.unit}</span>
                        <span className="font-mono font-semibold text-gray-900 w-28">{(s.qty * s.unitPrice).toLocaleString()} ₽</span>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            ))}
            <div className="rounded-xl border-2 border-indigo-500 bg-indigo-50 px-5 py-4 flex justify-between items-center">
              <span className="font-bold text-indigo-800">ИТОГО по объекту:</span>
              <span className="font-mono font-extrabold text-2xl text-indigo-700">{specs.reduce((s, i) => s + i.qty * i.unitPrice, 0).toLocaleString()} ₽</span>
            </div>
          </div>
        </TabsContent>

        {/* COORDS */}
        <TabsContent value="coords" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div><Label>Точка</Label><Input placeholder="ПК5+00" value={coordForm.name} onChange={e => setCoordForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>X (м)</Label><Input type="number" step="0.01" placeholder="1245678.00" value={coordForm.x} onChange={e => setCoordForm(f => ({ ...f, x: e.target.value }))} /></div>
            <div><Label>Y (м)</Label><Input type="number" step="0.01" placeholder="356421.00" value={coordForm.y} onChange={e => setCoordForm(f => ({ ...f, y: e.target.value }))} /></div>
            <div><Label>Z (м)</Label><Input type="number" step="0.01" placeholder="120.00" value={coordForm.z} onChange={e => setCoordForm(f => ({ ...f, z: e.target.value }))} /></div>
            <div><Label>Примечание</Label><Input placeholder="ВУ-1" value={coordForm.desc} onChange={e => setCoordForm(f => ({ ...f, desc: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={addCoord} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Icon name="Plus" size={16} /> Добавить точку
            </Button>
            <Button onClick={exportPointsExcel} variant="outline" className="gap-2 text-green-700 border-green-200 hover:bg-green-50">
              <Icon name="FileSpreadsheet" size={14} />Excel (.xls)
            </Button>
          </div>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 font-semibold">
                <tr>
                  <th className="px-4 py-2 text-center">№</th>
                  <th className="px-4 py-2 text-left">Точка</th>
                  <th className="px-4 py-2 text-right">X</th>
                  <th className="px-4 py-2 text-right">Y</th>
                  <th className="px-4 py-2 text-right">Z</th>
                  <th className="px-4 py-2 text-left">Примечание</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {coords.map((c, i) => (
                  <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 text-center text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-2 font-semibold text-indigo-700">{c.name}</td>
                    <td className="px-4 py-2 text-right font-mono text-xs">{c.x.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right font-mono text-xs">{c.y.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right font-mono text-xs">{c.z.toFixed(2)}</td>
                    <td className="px-4 py-2 text-gray-500 text-xs">{c.desc}</td>
                    <td className="px-4 py-2 text-right"><button onClick={() => setCoords(p => p.filter(x => x.id !== c.id))} className="text-gray-200 hover:text-red-500"><Icon name="X" size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* EXPORT */}
        <TabsContent value="export">
          {exportMsg && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 font-semibold mb-4 flex items-center gap-2">
              <Icon name="CheckCircle" size={16} /> {exportMsg}
            </motion.div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            {[
              { name: "Excel (.xlsx)", icon: "Table", desc: "Ведомость объёмов и смета в формате Microsoft Excel", fmt: "Excel" },
              { name: "CSV", icon: "FileText", desc: "Табличный формат для импорта в любую систему", fmt: "CSV" },
              { name: "PDF-отчёт", icon: "FileDown", desc: "Готовый отчёт для сдачи в составе проектной документации", fmt: "PDF" },
              { name: "XML (ГЭСН)", icon: "FileCode", desc: "Формат для передачи в сметные программы (Гранд-смета, WinАВеРС)", fmt: "XML ГЭСН" },
              { name: "LandXML", icon: "Mountain", desc: "Ведомость координат и поверхностей для обмена с CAD", fmt: "LandXML" },
              { name: "Word (.docx)", icon: "FileText", desc: "Пояснительная записка с таблицами в формате Word", fmt: "Word" },
            ].map(f => (
              <div key={f.fmt} className="rounded-xl border border-gray-200 bg-white p-5 flex items-start gap-4">
                <div className="rounded-xl bg-indigo-50 p-3"><Icon name={f.icon} size={22} className="text-indigo-600" fallback="File" /></div>
                <div className="flex-1">
                  <div className="font-bold text-gray-800 text-sm">{f.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{f.desc}</div>
                  <Button size="sm" variant="outline" className="mt-3 text-xs gap-1.5" onClick={() => handleExport(f.fmt)}>
                    <Icon name="Download" size={13} /> Скачать
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* NORMS — Materials with unit costs */}
        <TabsContent value="norms" className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Icon name="Package" size={16} className="text-indigo-600" />Спецификация материалов
              </h3>
              <div className="flex gap-2">
                <Button onClick={exportCostCSV} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                  <Icon name="Download" size={16} />Экспорт CSV
                </Button>
                <Button onClick={exportSpecsExcel} variant="outline" className="gap-2 text-green-700 border-green-200 hover:bg-green-50">
                  <Icon name="FileSpreadsheet" size={14} />Excel (.xls)
                </Button>
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs font-semibold">
                  <tr>
                    <th className="px-4 py-2 text-left">Материал / Работа</th>
                    <th className="px-4 py-2 text-center">Ед.изм</th>
                    <th className="px-4 py-2 text-right">Объём</th>
                    <th className="px-4 py-2 text-right">Цена/ед, ₽</th>
                    <th className="px-4 py-2 text-right">Сумма, ₽</th>
                  </tr>
                </thead>
                <tbody>
                  {costItems.map((r, i) => (
                    <tr key={r.id} className={`border-t border-gray-100 ${i % 2 === 0 ? "" : "bg-gray-50"}`}>
                      <td className="px-4 py-2 font-medium text-gray-800">{r.name}</td>
                      <td className="px-4 py-2 text-center text-gray-500">{r.unit}</td>
                      <td className="px-4 py-2 text-right font-mono">{r.vol.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right font-mono text-gray-600">{r.price.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right font-mono font-semibold text-gray-900">{r.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-indigo-50 border-t-2 border-indigo-200">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 font-bold text-indigo-800 text-right">ИТОГО:</td>
                    <td className="px-4 py-3 font-extrabold text-indigo-700 text-right font-mono">
                      {costItems.reduce((s, r) => s + r.total, 0).toLocaleString()} ₽
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* COMPARE — Drawing version compare */}
        <TabsContent value="compare" className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Icon name="GitCompare" size={16} className="text-indigo-600" fallback="Columns" />Сравнение версий чертежей (DWG/DWF)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center space-y-2 hover:border-indigo-400 transition-colors cursor-pointer">
                <Icon name="FileUp" size={28} className="text-gray-300 mx-auto" fallback="File" />
                <div className="text-sm font-semibold text-gray-700">Текущий чертёж</div>
                <div className="text-xs text-gray-400">ШД-38_план_v3.dwg</div>
                <div className="text-xs text-indigo-600 font-medium">Загружен</div>
              </div>
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center space-y-2 hover:border-indigo-400 transition-colors cursor-pointer">
                <Icon name="FileUp" size={28} className="text-gray-300 mx-auto" fallback="File" />
                <div className="text-sm font-semibold text-gray-700">Предыдущая версия</div>
                <div className="text-xs text-gray-400">ШД-38_план_v2.dwg</div>
                <div className="text-xs text-indigo-600 font-medium">Загружен</div>
              </div>
            </div>
            <Button onClick={runCompare} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Icon name="Diff" size={16} fallback="Search" />Сравнить версии
            </Button>
            {compareResult && (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-700">Найдено изменений: {compareResult.length}</div>
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs font-semibold text-gray-500">
                      <tr>
                        <th className="px-3 py-2 text-left">Тип изменения</th>
                        <th className="px-3 py-2 text-left">Объект</th>
                        <th className="px-3 py-2 text-left">Описание</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compareResult.map((c, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-3 py-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              c.type === "added"    ? "bg-green-100 text-green-700" :
                              c.type === "removed"  ? "bg-red-100 text-red-700" :
                              "bg-orange-100 text-orange-700"
                            }`}>
                              {c.type === "added" ? "Добавлен" : c.type === "removed" ? "Удалён" : "Изменён"}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-gray-800">{c.obj}</td>
                          <td className="px-3 py-2 text-xs text-gray-500">{c.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      <VersionFeaturesPanel dir="docs" />
    </motion.div>
  )
}