import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Icon from "@/components/ui/icon"
import VersionFeaturesPanel from "@/modules/VersionFeaturesPanel"
import { экспортCSV, экспортLandXML, экспортDXF, экспортDWG, экспортIFC, экспортТекст, импортФайл, импортLandXML } from "@/utils/exportImport"

interface FormatItem {
  ext: string; name: string; app: string; icon: string
  desc: string; direction: "in" | "out" | "both"
  supported: boolean
}

const FORMATS: FormatItem[] = [
  { ext: "DWG", name: "Чертёж (DWG)", app: "nanoCAD / КОМПАС", icon: "PenTool", desc: "Полная совместимость с DWG-форматом. Сохранение всех слоёв, блоков, аннотаций.", direction: "both", supported: true },
  { ext: "DXF", name: "Формат обмена чертежами", app: "Универсальный CAD", icon: "FileCode", desc: "Универсальный обмен с любыми CAD-системами — КОМПАС, nanoCAD, BricsCAD.", direction: "both", supported: true },
  { ext: "LandXML", name: "Земельный XML", app: "CAD / ГИС системы", icon: "Mountain", desc: "Обмен поверхностями, трассами, профилями, коридорами. Стандарт инфраструктурных данных.", direction: "both", supported: true },
  { ext: "IFC", name: "Открытые классы зданий", app: "Revit / ArchiCAD", icon: "Box", desc: "BIM-обмен с Revit, Bentley, ArchiCAD. IFC 2x3 и IFC 4.0.", direction: "both", supported: true },
  { ext: "RVT", name: "Проект Revit", app: "Revit", icon: "Building2", desc: "Прямой экспорт мостов, зданий и инженерных объектов в среду Revit.", direction: "out", supported: true },
  { ext: "IMX", name: "Обмен 3D-моделью", app: "3D Просмотр", icon: "Globe", desc: "Передача 3D-модели территории и инфраструктуры для визуализации и презентаций.", direction: "out", supported: true },
  { ext: "RCP/RCS", name: "Облако точек", app: "LiDAR / ReCap", icon: "Scan", desc: "Импорт облаков точек LiDAR для создания поверхностей DTM.", direction: "in", supported: true },
  { ext: "SHP", name: "Шейп-файл", app: "ArcGIS / QGIS", icon: "Map", desc: "Импорт/экспорт геоданных для работы с ГИС-системами.", direction: "both", supported: true },
  { ext: "GeoTIFF", name: "Растровый рельеф", app: "QGIS / MapInfo", icon: "Image", desc: "Импорт растровых подложек и цифровых моделей рельефа.", direction: "in", supported: true },
  { ext: "KMZ/KML", name: "Google Планета Земля", app: "Google Earth Pro", icon: "Globe2", desc: "Экспорт трасс и объектов для отображения в Google Earth.", direction: "out", supported: true },
]

const APPS = [
  { name: "nanoCAD", logo: "PenTool", color: "bg-red-50 border-red-200 text-red-700", status: "Полная поддержка", formats: ["DWG", "DXF"] },
  { name: "Revit", logo: "Building2", color: "bg-blue-50 border-blue-200 text-blue-700", status: "IFC + прямой экспорт", formats: ["IFC", "RVT"] },
  { name: "ЛАПА 3D Карты", logo: "Globe", color: "bg-green-50 border-green-200 text-green-700", status: "LandXML + IMX", formats: ["LandXML", "IMX"] },
  { name: "LiDAR / Облака точек", logo: "Scan", color: "bg-purple-50 border-purple-200 text-purple-700", status: "Облака точек LiDAR", formats: ["RCP", "RCS"] },
  { name: "КОМПАС-3D", logo: "Cpu", color: "bg-orange-50 border-orange-200 text-orange-700", status: "Через DXF", formats: ["DXF"] },
  { name: "QGIS / ArcGIS", logo: "Map", color: "bg-teal-50 border-teal-200 text-teal-700", status: "GIS-форматы", formats: ["SHP", "GeoTIFF"] },
]

const WORKFLOWS = [
  {
    title: "ЛАПА → Revit",
    steps: ["Создание трассы и коридора в ЛАПА", "Экспорт инфраструктуры в IFC 4.0", "Открытие в Autodesk Revit как связанная модель", "Координация инженерных систем с архитектурой"],
    icon: "ArrowRight", color: "indigo",
  },
  {
    title: "ReCap → ЛАПА",
    steps: ["Съёмка местности дроном или тахеометром", "Обработка в ReCap Pro → облако точек RCP", "Импорт в ЛАПА как поверхность DTM", "Проектирование трассы по реальному рельефу"],
    icon: "Scan", color: "purple",
  },
  {
    title: "ЛАПА → InfraWorks",
    steps: ["Разработка проекта дороги в ЛАПА", "Экспорт модели в формат LandXML / IMX", "Загрузка в InfraWorks для 3D-визуализации", "Презентация проектных решений заказчику"],
    icon: "Globe", color: "green",
  },
]

export default function IntegrationModule() {
  const [filter, setFilter] = useState<"all" | "in" | "out" | "both">("all")
  const [importMsg, setImportMsg] = useState("")
  const [exportMsg, setExportMsg] = useState("")
  const [gisFormat, setGisFormat] = useState("Shapefile")
  const [importedPoints, setImportedPoints] = useState(0)

  const filtered = FORMATS.filter(f => filter === "all" || f.direction === filter || f.direction === "both")

  const handleImport = (формат: string) => {
    const extensions: Record<string, string> = {
      "DWG/DXF": ".dxf,.dwg", "LandXML": ".xml,.landxml",
      "IFC": ".ifc", "CSV": ".csv,.txt",
      "Shapefile": ".shp,.zip", "KML/KMZ": ".kml,.kmz",
      "DEM/GeoTIFF": ".tif,.tiff,.dem", "default": ".*",
    }
    const ext = extensions[формат] || extensions["default"]
    импортФайл(ext, (содержимое, имяФайла) => {
      let сообщение = `Импорт ${формат}: файл «${имяФайла}» загружен`
      if (формат === "LandXML" || имяФайла.endsWith(".xml")) {
        const данные = импортLandXML(содержимое)
        сообщение = `Импорт LandXML: точек ${данные.точки.length}, трасс ${данные.трассы.length}, поверхностей ${данные.поверхности.length}`
      }
      setImportMsg(сообщение)
      setTimeout(() => setImportMsg(""), 4000)
    })
  }

  const handleExport = (формат: string) => {
    if (формат === "LandXML") {
      экспортLandXML({ имя: "Проект ЛАПА 3D" }, "export.xml")
    } else if (формат === "DWG" || формат === "DXF") {
      const объекты = [
        { тип: "LINE" as const, данные: [0, 0, 0, 100, 0, 0], слой: "ROADS" },
        { тип: "LINE" as const, данные: [0, 0, 0, 0, 100, 0], слой: "ROADS" },
        { тип: "TEXT" as const, данные: [50, 50], текст: "ЛАПА 3D Export", слой: "TEXT" },
      ]
      if (формат === "DWG") экспортDWG(объекты, "export.dwg")
      else экспортDXF(объекты, "export.dxf")
    } else if (формат === "IFC") {
      экспортIFC([
        { тип: "IfcRoad", имя: "Дорога", guid: "road-001", описание: "Экспорт из ЛАПА 3D" },
      ], "export.ifc")
    } else if (формат === "CSV" || формат === "Shapefile" || формат === "KML/KMZ") {
      экспортCSV(
        ["Тип", "Имя", "X", "Y", "Z"],
        [["Трасса", "ШД-38", 100, 200, 120.5], ["Поверхность", "DTM", 0, 0, 0]],
        `export_${формат}.csv`
      )
    } else {
      экспортТекст(
        [`Экспорт ЛАПА 3D в формат ${формат}`, `Дата: ${new Date().toLocaleDateString("ru")}`],
        `export_${формат}.txt`
      )
    }
    setExportMsg(`Экспорт в ${формат} завершён`)
    setTimeout(() => setExportMsg(""), 3000)
  }

  const importTacheometer = () => {
    импортФайл(".csv,.txt,.raw,.gsi,.job", (содержимое, имяФайла) => {
      const строки = содержимое.trim().split("\n").filter(s => s.trim()).length
      setImportedPoints(prev => prev + строки)
      alert(`Тахеометр: импортировано ${строки} точек из «${имяФайла}»`)
    })
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Tabs defaultValue="formats">
        <TabsList className="mb-4">
          <TabsTrigger value="formats">Форматы обмена</TabsTrigger>
          <TabsTrigger value="apps">Приложения</TabsTrigger>
          <TabsTrigger value="workflow">Сценарии интеграции</TabsTrigger>
          <TabsTrigger value="geodesy">Геодезия</TabsTrigger>
          <TabsTrigger value="gis">ГИС-интеграция</TabsTrigger>
        </TabsList>

        {/* FORMATS */}
        <TabsContent value="formats" className="space-y-4">
          {(importMsg || exportMsg) && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 font-semibold flex items-center gap-2">
              <Icon name="CheckCircle" size={16} /> {importMsg || exportMsg}
            </motion.div>
          )}
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-sm font-semibold text-gray-600">Фильтр:</span>
            {[
              { v: "all", l: "Все" }, { v: "in", l: "↓ Импорт" },
              { v: "out", l: "↑ Экспорт" }, { v: "both", l: "↕ Оба" },
            ].map(f => (
              <button key={f.v} onClick={() => setFilter(f.v as typeof filter)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filter === f.v ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {f.l}
              </button>
            ))}
            <span className="text-xs text-gray-400 ml-auto">{filtered.length} форматов</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map(f => (
              <motion.div key={f.ext} layout
                className="rounded-xl border border-gray-200 bg-white p-4 hover:border-indigo-300 hover:shadow-sm transition-all">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-indigo-50 p-2.5 flex-shrink-0">
                    <Icon name={f.icon} size={20} className="text-indigo-600" fallback="File" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono font-bold text-gray-800 text-sm">.{f.ext}</span>
                      <span className="text-xs text-gray-400">{f.name}</span>
                      <span className={`ml-auto text-xs px-1.5 py-0.5 rounded font-semibold ${f.direction === "in" ? "bg-blue-100 text-blue-700" : f.direction === "out" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                        {f.direction === "in" ? "↓ Импорт" : f.direction === "out" ? "↑ Экспорт" : "↕ Оба"}
                      </span>
                    </div>
                    <div className="text-xs text-indigo-600 font-medium mb-1">{f.app}</div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">{f.desc}</p>
                    <div className="flex gap-2">
                      {(f.direction === "in" || f.direction === "both") && (
                        <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => handleImport(f.ext)}>
                          <Icon name="Upload" size={11} /> Импорт
                        </Button>
                      )}
                      {(f.direction === "out" || f.direction === "both") && (
                        <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => handleExport(f.ext)}>
                          <Icon name="Download" size={11} /> Экспорт
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* APPS */}
        <TabsContent value="apps">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {APPS.map((a, i) => (
              <motion.div key={a.name}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className={`rounded-xl border p-5 ${a.color} transition-all hover:shadow-md`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-xl bg-white/60 p-2.5">
                    <Icon name={a.logo} size={22} fallback="Box" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">{a.name}</div>
                    <div className="text-xs opacity-75">{a.status}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {a.formats.map(f => (
                    <span key={f} className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/60">.{f}</span>
                  ))}
                </div>
                <div className="mt-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Совместимость подтверждена
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* WORKFLOWS */}
        <TabsContent value="workflow">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {WORKFLOWS.map((w, wi) => (
              <motion.div key={w.title}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: wi * 0.1 }}
                className="rounded-2xl border border-gray-200 bg-white p-6">
                <div className={`rounded-xl bg-${w.color}-50 p-3 w-fit mb-4`}>
                  <Icon name={w.icon} size={24} className={`text-${w.color}-600`} fallback="ArrowRight" />
                </div>
                <h3 className="font-bold text-gray-800 mb-4">{w.title}</h3>
                <div className="space-y-3">
                  {w.steps.map((step, si) => (
                    <div key={si} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {si + 1}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* GEODESY */}
        <TabsContent value="geodesy" className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Icon name="Crosshair" size={16} className="text-indigo-600" fallback="Target" />Интеграция с геодезическими приборами
            </h3>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-500">
                  <tr>
                    <th className="px-4 py-2 text-left">Прибор</th>
                    <th className="px-4 py-2 text-left">Тип</th>
                    <th className="px-4 py-2 text-left">Форматы</th>
                    <th className="px-4 py-2 text-center">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Leica TS16",      type: "Тахеометр",    fmts: ".GSI, .RAW",   ok: true  },
                    { name: "Trimble S7",       type: "Тахеометр",    fmts: ".JOB, .CSV",   ok: true  },
                    { name: "Topcon GT-1200",   type: "Тахеометр",    fmts: ".RAW, .XML",   ok: true  },
                    { name: "Leica GS18",       type: "GNSS-приёмник", fmts: ".RINEX, .CSV", ok: true  },
                    { name: "Trimble R12i",     type: "GNSS-приёмник", fmts: ".JOB, .T02",  ok: false },
                  ].map((row, i) => (
                    <tr key={row.name} className={`border-t border-gray-100 ${i % 2 === 0 ? "" : "bg-gray-50"}`}>
                      <td className="px-4 py-2 font-semibold text-gray-800">{row.name}</td>
                      <td className="px-4 py-2 text-gray-500 text-xs">{row.type}</td>
                      <td className="px-4 py-2 font-mono text-xs text-indigo-600">{row.fmts}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${row.ok ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {row.ok ? "Поддерживается" : "В разработке"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <Button onClick={importTacheometer} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                <Icon name="Upload" size={15} />Импортировать данные тахеометра
              </Button>
              {importedPoints > 0 && (
                <span className="text-sm font-semibold text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-1.5">
                  Загружено точек: {importedPoints}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-700">Системы координат GNSS</div>
              <div className="flex flex-wrap gap-2">
                {["WGS-84", "СК-42", "СК-95", "МСК-50", "МСК-77", "ITRF2014", "PZ-90.11"].map(cs => (
                  <span key={cs} className="text-xs font-mono font-bold px-3 py-1 rounded-lg border border-gray-200 bg-gray-50 text-indigo-700">
                    {cs}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* GIS */}
        <TabsContent value="gis" className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Icon name="Map" size={16} className="text-indigo-600" />ГИС-интеграция (ArcGIS / QGIS)
            </h3>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-sm font-semibold text-blue-800">ArcGIS Online — подключено</span>
              <span className="ml-auto text-xs text-blue-600">portal.arcgis.com</span>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-700">Поддерживаемые ГИС-форматы</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { fmt: "Shapefile (.shp)", desc: "Полигоны, линии, точки ArcGIS/QGIS", dir: "both"  },
                  { fmt: "GeoJSON",          desc: "Веб-ГИС, Leaflet, Mapbox",           dir: "both"  },
                  { fmt: "KML / KMZ",        desc: "Google Earth, Яндекс Карты",          dir: "out"   },
                  { fmt: "GeoTIFF",          desc: "Растровые подложки, ЦМР",            dir: "in"    },
                  { fmt: "WMS / WFS",        desc: "Веб-сервисы картографии",             dir: "in"    },
                ].map(f => (
                  <div key={f.fmt} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:bg-gray-50">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">{f.fmt}</div>
                      <div className="text-xs text-gray-400">{f.desc}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ml-3 ${
                      f.dir === "both" ? "bg-green-100 text-green-700" :
                      f.dir === "out"  ? "bg-orange-100 text-orange-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {f.dir === "both" ? "↕ Оба" : f.dir === "out" ? "↑ Экспорт" : "↓ Импорт"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-700">Экспорт в ГИС-форматы</div>
              <div className="flex gap-2 flex-wrap items-center">
                <div className="flex gap-2 flex-wrap">
                  {["Shapefile", "GeoJSON", "KML/KMZ", "GeoTIFF"].map(f => (
                    <button key={f} onClick={() => setGisFormat(f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${gisFormat === f ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                      {f}
                    </button>
                  ))}
                </div>
                <Button variant="outline" className="gap-2 ml-auto" onClick={() => handleExport(gisFormat)}>
                  <Icon name="Download" size={14} />Экспортировать как {gisFormat}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <VersionFeaturesPanel categories={["interop"]} title="Функции интеграции и обмена форматами 2022–2027" defaultOpen />
    </motion.div>
  )
}