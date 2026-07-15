// Каталог готовых проектов по направлениям.
// demo — id модуля, в котором открывается встроенная демо-сцена.
// file — прямая ссылка на реальный открытый файл-образец (можно скачать в модуль).
// source — страница-источник открытого датасета.

export interface ГотовыйПроект {
  id: string
  направление: string          // id направления (DIRECTIONS)
  название: string
  описание: string
  формат: string               // DWG / IFC / LandXML / STEP / OSM ...
  размер: string
  icon: string
  цвет: string
  demo?: string                // id модуля для открытия демо-сцены
  file?: string                // прямая ссылка на файл-образец
  source: string               // страница источника
  лицензия: string
}

export const ГОТОВЫЕ_ПРОЕКТЫ: ГотовыйПроект[] = [
  // ── Инфраструктура и дороги ──
  {
    id: "road-osm",
    направление: "infra",
    название: "Дорожная сеть района (OSM)",
    описание: "Реальная сеть автодорог из OpenStreetMap — трассы, развязки, категории",
    формат: "OSM XML",
    размер: "~4 МБ",
    icon: "Route",
    цвет: "#f97316",
    demo: "civilcad",
    file: "https://raw.githubusercontent.com/openstreetmap/OSM-binary/master/resources/sample.osm",
    source: "https://download.geofabrik.de/",
    лицензия: "ODbL (OpenStreetMap)",
  },
  {
    id: "road-alignment",
    направление: "infra",
    название: "Трасса автодороги (LandXML)",
    описание: "Плановая и высотная геометрия трассы, пикетаж, вертикальные кривые",
    формат: "LandXML",
    размер: "320 КБ",
    icon: "Spline",
    цвет: "#f59e0b",
    demo: "alignment",
    source: "https://www.landxml.org/Samples.aspx",
    лицензия: "LandXML.org (открытые образцы)",
  },
  {
    id: "railway-demo",
    направление: "infra",
    название: "Участок железной дороги",
    описание: "Путь, CANT-кривые, продольный профиль — демонстрационная сцена",
    формат: "Демо-сцена",
    размер: "—",
    icon: "Train",
    цвет: "#fb923c",
    demo: "railway",
    source: "https://wiki.osm.org/wiki/Railways",
    лицензия: "Демо ЛАПА 3D",
  },

  // ── Геодезия и изыскания ──
  {
    id: "survey-lidar",
    направление: "survey",
    название: "Облако точек LiDAR (рельеф)",
    описание: "Реальные данные воздушного лазерного сканирования, классификация грунт/растительность",
    формат: "LAS / LAZ",
    размер: "по выбору",
    icon: "ScanLine",
    цвет: "#10b981",
    demo: "dtm",
    source: "https://portal.opentopography.org/datasets",
    лицензия: "OpenTopography (открытые данные)",
  },
  {
    id: "survey-dem",
    направление: "survey",
    название: "Цифровая модель рельефа (DEM)",
    описание: "Растровая ЦМР — горизонтали, уклоны, водосборы, построение TIN",
    формат: "GeoTIFF",
    размер: "по выбору",
    icon: "Mountain",
    цвет: "#059669",
    demo: "surfaces",
    source: "https://earthexplorer.usgs.gov/",
    лицензия: "USGS (public domain)",
  },
  {
    id: "survey-cogo",
    направление: "survey",
    название: "Геодезическая съёмка (COGO)",
    описание: "Точки съёмки, тахеометр/GNSS, построение поверхности — демо-сцена",
    формат: "Демо-сцена",
    размер: "—",
    icon: "MapPin",
    цвет: "#34d399",
    demo: "geodesy",
    source: "https://www.landxml.org/Samples.aspx",
    лицензия: "Демо ЛАПА 3D",
  },

  // ── Инженерные сети ──
  {
    id: "networks-demo",
    направление: "networks",
    название: "Сети водоотведения",
    описание: "Ливневая канализация: колодцы, трубопроводы, гидравлический расчёт — демо",
    формат: "Демо-сцена",
    размер: "—",
    icon: "Network",
    цвет: "#3b82f6",
    demo: "networks",
    source: "https://www.landxml.org/Samples.aspx",
    лицензия: "Демо ЛАПА 3D",
  },
  {
    id: "networks-landxml",
    направление: "networks",
    название: "Самотёчная сеть (LandXML PipeNetwork)",
    описание: "Реальная структура сети труб и колодцев из открытого образца LandXML",
    формат: "LandXML",
    размер: "180 КБ",
    icon: "Droplets",
    цвет: "#60a5fa",
    demo: "networks",
    source: "https://www.landxml.org/Samples.aspx",
    лицензия: "LandXML.org (открытые образцы)",
  },

  // ── BIM и архитектура ──
  {
    id: "bim-clinic",
    направление: "bim",
    название: "Здание клиники (IFC4)",
    описание: "Полная BIM-модель здания: конструктив, инженерия, помещения — образец buildingSMART",
    формат: "IFC",
    размер: "2.4 МБ",
    icon: "Building2",
    цвет: "#8b5cf6",
    demo: "revar",
    file: "https://raw.githubusercontent.com/buildingSMART/Sample-Test-Files/master/IFC%204.0/Clinic/Clinic_Architectural.ifc",
    source: "https://github.com/buildingSMART/Sample-Test-Files",
    лицензия: "buildingSMART (открытые образцы)",
  },
  {
    id: "bim-house",
    направление: "bim",
    название: "Жилой дом (IFC2x3)",
    описание: "Архитектурная модель коттеджа, коллизии, IFC-экспорт",
    формат: "IFC",
    размер: "1.1 МБ",
    icon: "Home",
    цвет: "#a78bfa",
    demo: "revar",
    file: "https://raw.githubusercontent.com/buildingSMART/Sample-Test-Files/master/IFC%202x3/Wall%20with%20opening%20and%20window/basin_advanced.ifc",
    source: "https://github.com/buildingSMART/Sample-Test-Files",
    лицензия: "buildingSMART (открытые образцы)",
  },

  // ── Машиностроение / САПР ──
  {
    id: "sapr-bracket",
    направление: "mechanical",
    название: "Деталь «Кронштейн» (STEP)",
    описание: "Параметрическая 3D-деталь, готова к правке, чертежу и обмену STEP/STL",
    формат: "STEP / Демо",
    размер: "3 МБ",
    icon: "Cuboid",
    цвет: "#ef4444",
    demo: "sapr",
    source: "https://grabcad.com/library",
    лицензия: "GrabCAD (открытая библиотека)",
  },
  {
    id: "sapr-assembly",
    направление: "mechanical",
    название: "Сборка «Редуктор»",
    описание: "Сборка с сопряжениями, разнесённый вид, контроль коллизий — демо-сцена",
    формат: "Демо-сцена",
    размер: "—",
    icon: "Boxes",
    цвет: "#f87171",
    demo: "saprpro",
    source: "https://grabcad.com/library",
    лицензия: "Демо ЛАПА 3D",
  },
]
