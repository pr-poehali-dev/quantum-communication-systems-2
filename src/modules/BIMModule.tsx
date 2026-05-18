import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import Icon from "@/components/ui/icon"

interface BIMElement {
  id: number
  guid: string
  ifc: string
  name: string
  material: string
  level: string
  status: "new" | "modified" | "approved" | "clash"
  props: Record<string, string>
}

const IFC_TYPES = ["IfcRoad", "IfcRailway", "IfcBridge", "IfcPipe", "IfcWall", "IfcSlab", "IfcColumn", "IfcBeam", "IfcSite", "IfcBuilding"]
const LEVELS = ["Уровень 0 — Площадка", "Уровень 1 — Этаж 1", "Уровень 2 — Этаж 2", "Подземный -1", "Кровля"]

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  modified: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  clash: "bg-red-100 text-red-700",
}
const STATUS_LABELS: Record<string, string> = { new: "Новый", modified: "Изменён", approved: "Согласован", clash: "Коллизия" }

function genGuid(): string {
  return "3IFC" + Math.random().toString(36).substring(2, 12).toUpperCase()
}

const INIT_ELEMENTS: BIMElement[] = [
  { id: 1, guid: "3IFC2A8F4E1B", ifc: "IfcRoad", name: "Дорога главная", material: "Асфальтобетон", level: "Уровень 0 — Площадка", status: "approved", props: { "Ширина": "15 м", "Длина": "2000 м", "Покрытие": "АБ II тип" } },
  { id: 2, guid: "3IFC9D3C7A5F", ifc: "IfcPipe", name: "Водопровод Д200", material: "HDPE", level: "Подземный -1", status: "approved", props: { "Диаметр": "200 мм", "Длина": "850 м", "Глубина": "1.5 м" } },
  { id: 3, guid: "3IFC1E6B8C2D", ifc: "IfcBridge", name: "Мост через р. Малая", material: "Железобетон", level: "Уровень 0 — Площадка", status: "modified", props: { "Пролёт": "24 м", "Ширина": "12 м", "Класс бетона": "B30" } },
  { id: 4, guid: "3IFC4F2A9E7B", ifc: "IfcPipe", name: "Канализация Д300", material: "ПВХ", level: "Подземный -1", status: "clash", props: { "Диаметр": "300 мм", "Длина": "420 м", "Уклон": "0.003" } },
]

export default function BIMModule() {
  const [elements, setElements] = useState<BIMElement[]>(INIT_ELEMENTS)
  const [selected, setSelected] = useState<number | null>(null)
  const [filterIfc, setFilterIfc] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [form, setForm] = useState({ ifc: "IfcRoad", name: "", material: "", level: LEVELS[0] })

  const addElement = () => {
    if (!form.name) return
    setElements(prev => [...prev, {
      id: Date.now(), guid: genGuid(), ifc: form.ifc, name: form.name,
      material: form.material || "—", level: form.level, status: "new",
      props: { "Создан": new Date().toLocaleDateString("ru") }
    }])
    setForm(f => ({ ...f, name: "", material: "" }))
  }

  const setStatus = (id: number, status: BIMElement["status"]) => {
    setElements(prev => prev.map(e => e.id === id ? { ...e, status } : e))
  }

  const filtered = elements.filter(e =>
    (filterIfc === "all" || e.ifc === filterIfc) &&
    (filterStatus === "all" || e.status === filterStatus)
  )

  const clashes = elements.filter(e => e.status === "clash").length
  const approved = elements.filter(e => e.status === "approved").length
  const sel = elements.find(e => e.id === selected)

  const ifcTree = IFC_TYPES.reduce<Record<string, BIMElement[]>>((acc, t) => {
    acc[t] = elements.filter(e => e.ifc === t)
    return acc
  }, {})

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Tabs defaultValue="model">
        <TabsList className="mb-4">
          <TabsTrigger value="model">Модель (IFC)</TabsTrigger>
          <TabsTrigger value="tree">Дерево проекта</TabsTrigger>
          <TabsTrigger value="clashes">Коллизии</TabsTrigger>
          <TabsTrigger value="export">Экспорт</TabsTrigger>
        </TabsList>

        {/* MODEL */}
        <TabsContent value="model" className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <Label>IFC-тип</Label>
              <Select value={form.ifc} onValueChange={v => setForm(f => ({ ...f, ifc: v }))}>
                <SelectTrigger className="w-40 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{IFC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Наименование</Label><Input className="mt-1 w-44" placeholder="Элемент" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Материал</Label><Input className="mt-1 w-36" placeholder="Бетон B25" value={form.material} onChange={e => setForm(f => ({ ...f, material: e.target.value }))} /></div>
            <div>
              <Label>Уровень</Label>
              <Select value={form.level} onValueChange={v => setForm(f => ({ ...f, level: v }))}>
                <SelectTrigger className="w-52 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={addElement} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Icon name="Plus" size={16} /> Добавить
            </Button>
          </div>

          <div className="flex gap-3 flex-wrap items-center">
            <Select value={filterIfc} onValueChange={setFilterIfc}>
              <SelectTrigger className="w-36"><SelectValue placeholder="IFC тип" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                {IFC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Статус" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">{filtered.length} элементов</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 font-semibold">
                  <tr>
                    <th className="px-4 py-2 text-left">GUID</th>
                    <th className="px-4 py-2 text-left">Наименование</th>
                    <th className="px-4 py-2 text-left">IFC</th>
                    <th className="px-4 py-2 text-left">Статус</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(e => (
                    <tr key={e.id} onClick={() => setSelected(e.id)} className={`border-t border-gray-100 cursor-pointer transition-colors ${selected === e.id ? "bg-indigo-50" : "hover:bg-gray-50"}`}>
                      <td className="px-4 py-2 font-mono text-xs text-gray-400">{e.guid}</td>
                      <td className="px-4 py-2 font-semibold text-gray-800">{e.name}</td>
                      <td className="px-4 py-2 text-xs text-indigo-600 font-medium">{e.ifc}</td>
                      <td className="px-4 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[e.status]}`}>{STATUS_LABELS[e.status]}</span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={ev => { ev.stopPropagation(); setElements(p => p.filter(x => x.id !== e.id)) }} className="text-gray-200 hover:text-red-500">
                          <Icon name="X" size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              {sel ? (
                <div className="space-y-3">
                  <div className="font-bold text-gray-800">{sel.name}</div>
                  <div className="text-xs font-mono text-gray-400 break-all">{sel.guid}</div>
                  <div className="space-y-1 text-sm">
                    {[["IFC-тип", sel.ifc], ["Материал", sel.material], ["Уровень", sel.level]].map(([k, v]) => (
                      <div key={k} className="flex justify-between border-b border-gray-100 pb-1">
                        <span className="text-gray-500 text-xs">{k}</span>
                        <span className="font-medium text-xs text-gray-800">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-gray-600 mb-1">Свойства (Pset)</div>
                    {Object.entries(sel.props).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs border-b border-gray-50 pb-0.5">
                        <span className="text-gray-400">{k}</span>
                        <span className="font-mono text-gray-700">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(["new", "modified", "approved", "clash"] as const).map(s => (
                      <button key={s} onClick={() => setStatus(sel.id, s)} className={`text-xs px-2 py-1 rounded-full transition-all ${sel.status === s ? STATUS_COLORS[s] + " font-bold" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">Выберите элемент для просмотра свойств</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* TREE */}
        <TabsContent value="tree">
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="FolderOpen" size={18} className="text-indigo-500" />
              <span className="font-bold text-gray-800">Проект CivilPro</span>
              <Badge variant="secondary">{elements.length} эл.</Badge>
            </div>
            {Object.entries(ifcTree).filter(([, els]) => els.length > 0).map(([type, els]) => (
              <details key={type} className="group">
                <summary className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 text-sm font-semibold text-gray-700 list-none">
                  <Icon name="ChevronRight" size={14} className="group-open:rotate-90 transition-transform text-gray-400" />
                  <Icon name="Box" size={14} className="text-indigo-400" />
                  <span>{type}</span>
                  <span className="ml-auto text-xs text-gray-400 font-normal">{els.length} эл.</span>
                </summary>
                <div className="ml-7 mt-1 space-y-0.5">
                  {els.map(e => (
                    <div key={e.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${selected === e.id ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-50 text-gray-600"}`} onClick={() => setSelected(e.id)}>
                      <Icon name="Minus" size={10} className="text-gray-300" />
                      <span>{e.name}</span>
                      <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full ${STATUS_COLORS[e.status]}`}>{STATUS_LABELS[e.status]}</span>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </TabsContent>

        {/* CLASHES */}
        <TabsContent value="clashes">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Всего элементов", value: elements.length, color: "text-gray-900" },
                { label: "Коллизии", value: clashes, color: clashes > 0 ? "text-red-600" : "text-green-600" },
                { label: "Согласовано", value: approved, color: "text-green-600" },
              ].map(c => (
                <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-5 text-center">
                  <div className="text-xs text-muted-foreground mb-1">{c.label}</div>
                  <div className={`text-4xl font-extrabold ${c.color}`}>{c.value}</div>
                </div>
              ))}
            </div>
            {elements.filter(e => e.status === "clash").length > 0 ? (
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-800">Обнаруженные коллизии</h3>
                {elements.filter(e => e.status === "clash").map(e => (
                  <div key={e.id} className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-red-800 text-sm">{e.name}</div>
                      <div className="text-xs text-red-600">{e.ifc} · {e.level} · {e.guid}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-xs border-red-300 text-red-700 hover:bg-red-100" onClick={() => setStatus(e.id, "modified")}>
                        Отметить к правке
                      </Button>
                      <Button size="sm" className="text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => setStatus(e.id, "approved")}>
                        Решена
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
                <Icon name="CheckCircle" size={40} className="text-green-400 mx-auto mb-2" />
                <p className="font-semibold text-green-700">Коллизий не обнаружено</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* EXPORT */}
        <TabsContent value="export">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            {[
              { fmt: "IFC 2x3", icon: "FileCode", desc: "Универсальный формат BIM. Совместим с Revit, ArchiCAD, Navisworks", ext: ".ifc" },
              { fmt: "IFC 4.0", icon: "FileCode", desc: "Последняя версия стандарта ISO 16739. Расширенные возможности", ext: ".ifc" },
              { fmt: "DWG / DXF", icon: "PenTool", desc: "Экспорт для AutoCAD Civil 3D, КОМПАС, nanoCAD", ext: ".dwg" },
              { fmt: "CityGML", icon: "Globe", desc: "Геопространственная модель города (GIS-системы, ГИС РФ)", ext: ".gml" },
              { fmt: "LandXML", icon: "Mountain", desc: "Обмен данными о поверхностях, трассах, профилях", ext: ".xml" },
              { fmt: "CSV / Excel", icon: "Table", desc: "Таблица элементов со всеми атрибутами и свойствами", ext: ".xlsx" },
            ].map(f => (
              <div key={f.fmt} className="rounded-xl border border-gray-200 bg-white p-5 flex items-start gap-4">
                <div className="rounded-xl bg-indigo-50 p-3">
                  <Icon name={f.icon} size={22} className="text-indigo-600" fallback="File" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-800 text-sm">{f.fmt}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{f.desc}</div>
                  <Button size="sm" variant="outline" className="mt-3 text-xs gap-1.5">
                    <Icon name="Download" size={13} /> Экспорт {f.ext}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
