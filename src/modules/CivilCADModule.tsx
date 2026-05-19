import { useRef, useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Icon from "@/components/ui/icon"

// ─── Types ─────────────────────────────────────────────────────────────────

interface TreeNode {
  id: string; label: string; icon: string; color?: string
  children?: TreeNode[]; expanded?: boolean
}

interface Alignment {
  id: string; name: string; color: string
  pts: [number, number][]
}

interface CorridorRow {
  alignment: string; profile: string; assembly: string
}

interface FeatureLine {
  name: string; assembly: string
}

interface CorridorDef {
  name: string; description: string; style: string
  codeStyle: string; layer: string; template: string
  targetSurface: string; rows: CorridorRow[]; features: FeatureLine[]
}

// ─── Additional dialog types ────────────────────────────────────────────────

interface SurfaceDef {
  name: string; description: string; type: "TIN" | "Grid"
  style: string; layer: string; gridX: string; gridY: string
  pointFiles: { name: string; format: string }[]
}

interface AlignmentDef {
  name: string; description: string; type: string
  startStation: string; stationIncrement: string
  style: string; layer: string
  elements: { type: "line" | "curve" | "spiral"; length: string; radius: string; Az: string; A: string }[]
}

interface ProfileDef {
  name: string; alignment: string; surface: string
  description: string; style: string; layer: string
  pvcs: { station: string; elev: string; k: string }[]
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TREE: TreeNode[] = [
  {
    id: "project", label: "Главная парковка_Финал", icon: "FolderOpen", expanded: true, children: [
      { id: "points", label: "Точки", icon: "MapPin", color: "#f59e0b" },
      { id: "ptgroups", label: "Группы точек", icon: "Group", color: "#f59e0b" },
      {
        id: "surfaces", label: "Поверхности", icon: "Mountain", color: "#4ade80", expanded: true, children: [
          { id: "s1", label: "Существующая поверхность", icon: "Triangle", color: "#4ade80" },
          { id: "s2", label: "Проектная поверхность", icon: "Triangle", color: "#60a5fa" },
        ]
      },
      {
        id: "alignments", label: "Трассы", icon: "Route", color: "#f97316", expanded: true, children: [
          { id: "a1", label: "Трасса ШД-38", icon: "Minus", color: "#ef4444" },
          { id: "a2", label: "Ул. Трумана", icon: "Minus", color: "#a855f7" },
          { id: "a3", label: "Бордюр периметра", icon: "Minus", color: "#06b6d4" },
        ]
      },
      { id: "featurelines", label: "Характерные линии", icon: "Spline", color: "#ec4899" },
      { id: "sites", label: "Площадки", icon: "LayoutGrid", color: "#84cc16" },
      { id: "turnouts", label: "Разъезды и пересечения", icon: "ArrowLeftRight", color: "#94a3b8" },
      { id: "catchments", label: "Водосборные бассейны", icon: "Droplets", color: "#60a5fa" },
      { id: "pipenet", label: "Трубопроводные сети", icon: "Network", color: "#6366f1" },
      { id: "pressnet", label: "Напорные сети", icon: "Gauge", color: "#8b5cf6" },
      { id: "bridges", label: "Мосты", icon: "Bridge", color: "#f59e0b" },
      {
        id: "corridors", label: "Коридоры", icon: "RoadHorizon", color: "#f97316", expanded: true, children: [
          { id: "c1", label: "Дорога и парковочная зона", icon: "Minus", color: "#f97316" },
        ]
      },
      { id: "assemblies", label: "Типовые сечения", icon: "Layers", color: "#94a3b8" },
      { id: "subassemblies", label: "Подсечения", icon: "Component", color: "#94a3b8" },
      { id: "intersections", label: "Пересечения", icon: "Plus", color: "#f43f5e" },
      { id: "survey", label: "Геодезия", icon: "Compass", color: "#10b981" },
      { id: "vfg", label: "Группы видовых рамок", icon: "Frame", color: "#64748b" },
    ]
  },
  {
    id: "datasrc", label: "Внешние ссылки []", icon: "Database", expanded: false, children: [
      { id: "ds1", label: "Поверхности", icon: "Mountain", color: "#4ade80" },
      { id: "ds2", label: "Трассы", icon: "Route", color: "#f97316" },
      { id: "ds3", label: "Трубопроводные сети", icon: "Network", color: "#6366f1" },
      { id: "ds4", label: "Напорные сети", icon: "Gauge", color: "#8b5cf6" },
      { id: "ds5", label: "Коридоры", icon: "RoadHorizon", color: "#f97316" },
      { id: "ds6", label: "Группы видовых рамок", icon: "Frame", color: "#64748b" },
    ]
  },
]

const ALIGNMENTS: Alignment[] = [
  { id: "sh38", name: "Трасса ШД-38", color: "#ef4444", pts: [[80,60],[160,90],[260,110],[370,95],[460,80],[540,70],[630,85],[720,100],[810,88],[880,72]] },
  { id: "truman", name: "Ул. Трумана", color: "#a855f7", pts: [[100,180],[200,190],[310,185],[420,195],[530,188],[640,200],[740,195],[840,188]] },
  { id: "perimeter", name: "Бордюр периметра", color: "#06b6d4", pts: [[180,120],[220,130],[270,160],[290,210],[280,260],[250,300],[210,320],[170,310],[140,280],[130,240],[140,190],[160,155],[180,120]] },
]

const ASSEMBLIES = ["Трасса ШД-38", "Ул. Трумана", "Тротуар", "Бордюр проезжей ч. Лев.", "Бордюр проезжей ч. Пр.", "Парковочный бордюр", "Бордюр периметра", "V-образный лоток"]
const PROFILES: Record<string, string[]> = {
  "Трасса ШД-38": ["ПРОЕКТ_ШД-38", "Сущ. профиль"],
  "Ул. Трумана": ["Проект_Трумана", "Сущ. профиль"],
  "*Нет*": ["*Нет*"],
}
const SURFACES = ["<нет>", "Существующая поверхность", "Проектная поверхность"]
const STYLES = ["Базовый", "Все подписи", "Без отображения"]
const CODE_STYLES = ["Все коды", "Без отображения", "Коды дорог"]

const FEATURE_LINES: FeatureLine[] = [
  { name: "Тротуар_Периметр_01", assembly: "Тротуар" },
  { name: "Парк_Бордюр_04", assembly: "Парковочный бордюр" },
  { name: "Бордюр пр.ч. Лев. 8", assembly: "Бордюр проезжей ч. Лев." },
  { name: "Бордюр пр.ч. Лев. 7", assembly: "Бордюр проезжей ч. Лев." },
  { name: "Бордюр пр.ч. Лев. 6", assembly: "Парковочный бордюр" },
  { name: "Бордюр пр.ч. Пр. 4", assembly: "Бордюр периметра" },
  { name: "Бордюр пр.ч. Пр. 3", assembly: "Бордюр проезжей ч. Пр." },
  { name: "Бордюр пр.ч. Пр. 2", assembly: "Бордюр проезжей ч. Пр." },
]

const MENU_ITEMS = ["Главная","Вставка","Аннотации","Редактирование","Анализ","Вид","Управление","Вывод","Геодезия","Ж/д путь","Прозрачность","InfraWorks","Совместная работа","Справка","Надстройки","Инструменты Express","Отслеживание транспорта","Избранные приложения","Геолокация"]

const TOOLBAR_BY_MENU: Record<string, { label: string; items: string[] }[]> = {
  "Главная": [
    { label: "Палитры", items: ["Пространство инструментов ▾","Панорама","Свойства ▾"] },
    { label: "Обзор", items: ["Диспетчер проекта","Оптимизация"] },
    { label: "Вертикальная планировка", items: ["Оптимизация планировки"] },
    { label: "Создать топооснову", items: ["Точки ▾","Поверхности ▾","Характерная линия ▾","Теодолитный ход ▾"] },
    { label: "Создать проект", items: ["Трасса ▾","Пересечения ▾","Профиль ▾","Типовое сечение ▾","Коридор ▾","Трубопроводная сеть ▾"] },
    { label: "Профиль и поперечники", items: ["Вид профиля ▾","Виды поперечников ▾","Линии образцов"] },
    { label: "Черчение", items: ["Черчение ▾"] },
    { label: "Редактирование", items: ["Перенести","Копировать ▾","Повернуть","Зеркало","Обрезать ▾","Растянуть","Масштаб","Массив ▾","Сопряжение"] },
    { label: "Слои", items: ["Слои","Сделать текущим","Совместить слои"] },
    { label: "Буфер обмена", items: ["Вставить ▾"] },
  ],
  "Вставка": [
    { label: "Блоки", items: ["Вставить ▾","Создать блок","Редактировать блок"] },
    { label: "Атрибуты", items: ["Определить атрибут","Синхронизировать"] },
    { label: "Ссылки", items: ["Присоединить ▾","Обрезать","Настроить"] },
    { label: "Импорт", items: ["Импорт ▾","LandXML","IFC","Облако точек"] },
    { label: "Система координат", items: ["Назначить ▾","Преобразовать"] },
  ],
  "Аннотации": [
    { label: "Текст", items: ["Однострочный","Многострочный ▾","Редактировать текст"] },
    { label: "Размеры", items: ["Линейный ▾","Параллельный","Угловой","Радиус","Выноска ▾"] },
    { label: "Стили", items: ["Стиль текста ▾","Стиль размеров ▾","Стиль таблицы"] },
    { label: "Таблицы", items: ["Таблица ▾","Экспорт","Марки трасс"] },
    { label: "Марки", items: ["Добавить марки ▾","Редактировать марку ▾","Стиль марки"] },
  ],
  "Редактирование": [
    { label: "Изменить", items: ["Перенести","Копировать ▾","Зеркало","Повернуть","Масштаб"] },
    { label: "Размер", items: ["Растянуть","Обрезать ▾","Удлинить ▾","Разбить","Соединить"] },
    { label: "Разбить", items: ["Разбить","Группировать ▾","Разгруппировать"] },
    { label: "Массив", items: ["Прямоугольный ▾","Круговой ▾","По траектории ▾"] },
    { label: "3D-редактирование", items: ["3D-перенос","3D-поворот","3D-зеркало"] },
  ],
  "Анализ": [
    { label: "Поверхности", items: ["Анализ уклонов ▾","Анализ высот ▾","Водосборы ▾","Разрезы ▾"] },
    { label: "Коридоры", items: ["Объёмы ▾","Ведомость объёмов ▾"] },
    { label: "Трубопроводные сети", items: ["Гидравлика ▾","Инспекция ▾"] },
    { label: "Топооснова", items: ["Анализ облака точек","Анализ планировки"] },
    { label: "Отчёты", items: ["Генерировать отчёт ▾"] },
  ],
  "Вид": [
    { label: "Именованные виды", items: ["Сверху","Изометрия ЮЗ ▾","Пользовательский ▾"] },
    { label: "Визуальный стиль", items: ["2D Каркас","Тонирование","Реалистичный"] },
    { label: "Видовые экраны", items: ["1 видовой экран","2 видовых экрана ▾","4 видовых экрана"] },
    { label: "Навигация", items: ["Орбита ▾","Панорама","Зум ▾","Штурвалы"] },
    { label: "Палитры", items: ["Свойства","Слои","Пространство инструментов"] },
  ],
  "Управление": [
    { label: "Параметры", items: ["Параметры чертежа","Единицы и зона","Общие параметры"] },
    { label: "Стили", items: ["Параметры объекта","Диспетчер стилей марок ▾"] },
    { label: "Запись действий", items: ["Запись","Воспроизведение","Редактировать действия"] },
    { label: "Стандарты САПР", items: ["Настройка","Проверка","Преобразователь слоёв"] },
  ],
  "Вывод": [
    { label: "Печать", items: ["Печать ▾","Пакетная печать","Просмотр"] },
    { label: "Экспорт", items: ["PDF ▾","DWF ▾","LandXML","IFC","Shapefile"] },
    { label: "Публикация", items: ["Autodesk Docs","Комплекты листов ▾","eTransmit"] },
    { label: "Отправить в", items: ["InfraWorks","Navisworks","Revit"] },
  ],
  "Геодезия": [
    { label: "Точки", items: ["Создать точки ▾","Группы точек ▾","Импорт точек","Редактировать точки"] },
    { label: "База данных съёмки", items: ["Открыть БД ▾","Импорт","Экспорт","Настройки"] },
    { label: "Теодолитный ход", items: ["Редактор хода","Отчёт о невязке","Уравнивание"] },
    { label: "Поверхности", items: ["TIN-поверхность ▾","Grid-поверхность ▾","Поверхность объёмов"] },
    { label: "Фигуры", items: ["Создать фигуру","Редактировать фигуру","Стиль фигуры"] },
  ],
  "Ж/д путь": [
    { label: "Трасса", items: ["Трасса ж/д ▾","Кант ▾","Расположение пути"] },
    { label: "Проект", items: ["Проект пути ▾","Разъезды и пересечения ▾","Мосты ▾"] },
    { label: "Профиль", items: ["Профиль ж/д ▾","Точки уклонов","Вертикальные кривые"] },
    { label: "Поперечник", items: ["Поперечник ж/д ▾","Габарит","Виды поперечников"] },
  ],
  "Прозрачность": [
    { label: "Точка", items: ["Номер точки","Имя точки","Объект точки ▾"] },
    { label: "Пикет/Смещение", items: ["Пикет и смещение ▾","Пикет профиля и отм.","Пикет попереч. и смещ."] },
    { label: "Уклон/Расстояние", items: ["Уклон и расстояние","Уклон от точки","Расстояние и дирекционный угол"] },
    { label: "Сервис", items: ["Перейти к точке","Совместить свойства"] },
  ],
  "InfraWorks": [
    { label: "Обмен данными", items: ["Отправить в InfraWorks","Синхронизировать","Обновить модель"] },
    { label: "Проект", items: ["Открыть в InfraWorks","Сравнить варианты"] },
  ],
  "Совместная работа": [
    { label: "Autodesk Docs", items: ["Открыть из облака","Сохранить в облако","Поделиться"] },
    { label: "Совместное редактирование", items: ["Включить совместный режим","Зафиксировать","Снять фиксацию"] },
    { label: "Ярлыки данных", items: ["Создать ярлык ▾","Изменить ярлык","Рабочая папка"] },
  ],
  "Надстройки": [
    { label: "Отслеживание транспорта", items: ["Добавить транспорт ▾","Симуляция движения","Траектория движения"] },
    { label: "Расширения", items: ["Управление расширениями ▾","Менеджер приложений"] },
    { label: "Избранные приложения", items: ["Найти приложения","Установленные","Синхронизировать"] },
  ],
  "Инструменты Express": [
    { label: "Блоки", items: ["Супер штриховка","Конвертировать текст","Блок ▾"] },
    { label: "Текст", items: ["Текст по дуге","Выравнивание текста ▾","Подгонка текста"] },
    { label: "Листы", items: ["Геометрия листа","Сплющить ▾","Наложить"] },
    { label: "Слои", items: ["Перебор слоёв","Заморозить слой","Изолировать слой ▾"] },
  ],
  "Отслеживание транспорта": [
    { label: "Маршруты", items: ["Добавить маршрут ▾","Редактировать маршрут","Удалить маршрут"] },
    { label: "Транспортное средство", items: ["Библиотека ТС ▾","Пользовательское ТС","Редактировать ТС"] },
    { label: "Симуляция", items: ["Запустить симуляцию","Анимация","Отчёт"] },
  ],
  "Избранные приложения": [
    { label: "Приложения", items: ["AutoCAD Raster Design","Point Layout","CAiCE Tools"] },
    { label: "Сервис", items: ["Сравнение DWG","Очистить ▾","Проверка"] },
  ],
  "Геолокация": [
    { label: "Онлайн-карты", items: ["Карта вкл.","Тип карты ▾","Захват области"] },
    { label: "Местоположение", items: ["Задать местоположение ▾","Изменить местоположение","Отметить позицию"] },
    { label: "Координаты", items: ["Переопубликовать ▾","Обновить координаты","Экспорт KML"] },
  ],
}

const TOOLBAR_GROUPS = TOOLBAR_BY_MENU["Главная"]

const DROPDOWN_ITEMS: Record<string, string[]> = {
  // Главная
  "Пространство инструментов ▾": ["Диспетчер","Параметры","Геодезия","Инструменты"],
  "Свойства ▾": ["Свойства объекта","Быстрые свойства","Циклический выбор"],
  "Точки ▾": ["Создать точки — вручную","Создать точки — интерполяция","Создать точки — по трассе","Создать точки — по поверхности","Импорт точек","Группы точек","Редактировать точки"],
  "Поверхности ▾": ["Создать поверхность (TIN)","Создать поверхность (Grid)","Из точек","Из горизонталей","Редактировать поверхность","Свойства поверхности","Экспорт поверхности"],
  "Характерная линия ▾": ["Создать характерную линию","Из объектов","Редактировать отметки","Сопряжение","Свойства хар. линии"],
  "Теодолитный ход ▾": ["Редактор хода","Отчёт о невязке","Импорт хода"],
  "Трасса ▾": ["Создать трассу — компоновка","Из объектов","Из полилинии","Редактировать геометрию","Свойства трассы","Редактор критериев проектирования"],
  "Пересечения ▾": ["Создать пересечение","Редактировать пересечение","Мастер пересечения"],
  "Профиль ▾": ["Профиль из поверхности","Создать профиль — компоновка","Редактировать геометрию профиля","Свойства профиля","Наложить профиль"],
  "Типовое сечение ▾": ["Создать типовое сечение","Редактировать","Свойства","Импорт типового сечения"],
  "Коридор ▾": ["Создать коридор","Редактировать коридор","Свойства коридора","Целевые объекты","Перестроить коридор"],
  "Трубопроводная сеть ▾": ["Создать сеть","Редактировать сеть","Свойства сети","Производство планов"],
  "Вид профиля ▾": ["Создать вид профиля","Создать несколько видов","Редактировать стиль","Совмещённые виды"],
  "Виды поперечников ▾": ["Создать вид поперечника","Создать несколько видов","Редактировать стиль","Набор полос"],
  "Черчение ▾": ["Полилиния","Отрезок","Дуга","Окружность","Прямоугольник","Сплайн","Штриховка","Текст"],
  "Копировать ▾": ["Копировать","С базовой точкой","Копировать в буфер"],
  "Обрезать ▾": ["Обрезать","Удлинить","Разбить в точке","Разбить"],
  "Массив ▾": ["Прямоугольный массив","Круговой массив","Массив по траектории"],
  "Слои": ["Диспетчер слоёв"],
  "Вставить ▾": ["Вставить","Вставить как блок","Вставить на исходные координаты"],
  // Вставка
  "Присоединить ▾": ["Присоединить DWG","Вставить изображение","Вставить PDF","Вставить облако точек"],
  "Импорт ▾": ["LandXML","IFC","Shapefile","DEM/GeoTIFF","Облако точек (RCP/RCS)","Данные съёмки"],
  "Назначить ▾": ["Назначить систему координат","Из карты","Ввести вручную"],
  // Аннотации
  "Многострочный ▾": ["Создать мтекст","Редактировать стиль","Поле"],
  "Линейный ▾": ["Линейный","Параллельный","От базы","Цепочечный"],
  "Выноска ▾": ["Мультивыноска","Быстрая выноска","Допуск формы"],
  "Стиль текста ▾": ["Новый стиль","Изменить","Импорт из чертежа"],
  "Стиль размеров ▾": ["Новый стиль","Изменить","Переопределить","Сравнить"],
  "Таблица ▾": ["Вставить таблицу","Из связанных данных","Экспорт в CSV"],
  "Добавить марки ▾": ["Марки трасс","Марки профилей","Марки поперечников","Марки участков","Марки поверхностей","Марки трубопроводов"],
  "Редактировать марку ▾": ["Перевернуть марку","Перенести марку","Сбросить марку","Удалить переопределение"],
  // Редактирование
  "Прямоугольный ▾": ["Прямоугольный массив","Массив по траектории","Круговой массив"],
  "Круговой ▾": ["Круговой массив","Массив по траектории"],
  "По траектории ▾": ["Массив по траектории","Редактировать массив"],
  // Анализ
  "Анализ уклонов ▾": ["Анализ уклонов","Анализ стрелок уклонов","Пользовательские горизонтали"],
  "Анализ высот ▾": ["Анализ высот","Водосборы","Пользовательские горизонтали"],
  "Водосборы ▾": ["Анализ водосборов","Площадь водосбора","Путь стока"],
  "Разрезы ▾": ["Линии образцов","Виды поперечников","Свойства поперечника"],
  "Объёмы ▾": ["Объёмы по коридору","Между поверхностями","Ведомость объёмов","Ведомость земляных работ"],
  "Ведомость объёмов ▾": ["Диспетчер ВО","Вычислить материалы","Единичные расценки","Экспорт"],
  "Гидравлика ▾": ["Запустить гидравлический расчёт","Подбор труб","Отчёт по ливневой канализации"],
  "Инспекция ▾": ["Проверить сеть","Найти нарушения","Отчёт по сети"],
  "Генерировать отчёт ▾": ["Сводный отчёт","Отчёт по поверхности","Отчёт по коридору","Отчёт по сети","Отчёт по трассе"],
  // Вид
  "Пользовательский ▾": ["Сохранить вид","Восстановить вид","Диспетчер видов"],
  "2 видовых экрана ▾": ["Горизонтально","Вертикально"],
  "Орбита ▾": ["Свободная орбита","Ограниченная орбита","Непрерывная орбита"],
  "Зум ▾": ["Вписать всё","Окном","Масштаб","Центр","Предыдущий"],
  "Изометрия ЮЗ ▾": ["ЮЗ изометрия","ЮВ изометрия","СВ изометрия","СЗ изометрия","Сверху","Спереди","Справа"],
  // Управление
  "Диспетчер стилей марок ▾": ["Трассы","Профили","Коридоры","Трубопроводы","Сооружения","Поверхности"],
  // Вывод
  "Печать ▾": ["Печать","Быстрая печать","Пакетная печать"],
  "DWF ▾": ["Публикация в DWF","Публикация в 3D DWF"],
  "PDF ▾": ["Текущий лист","Все листы","Выбранные листы","PDF высокого качества"],
  "Комплекты листов ▾": ["Открыть комплект","Новый комплект","Опубликовать комплект"],
  // Геодезия
  "Создать точки ▾": ["Вручную","По координатам","Из файла CSV","По трассе","По поверхности","По геометрии","Интерполяция"],
  "Группы точек ▾": ["Создать группу точек","Редактировать группу","Удалить группу","Свойства"],
  "Открыть БД ▾": ["Новая база данных съёмки","Открыть существующую","Импорт данных съёмки","Экспорт данных съёмки"],
  "TIN-поверхность ▾": ["Из точек","Из фигур","Из горизонталей","Из файла DEM","Редактировать TIN"],
  "Grid-поверхность ▾": ["Из файла","Из TIN-поверхности","Параметры сетки"],
  // Ж/д путь
  "Трасса ж/д ▾": ["Создать трассу ж/д","Из полилинии","Редактировать трассу ж/д"],
  "Кант ▾": ["Создать кант","Редактировать кант","Свойства канта"],
  "Проект пути ▾": ["Расположение пути","Профиль ж/д","Проект канта"],
  "Разъезды и пересечения ▾": ["Создать разъезд","Создать пересечение","Редактировать"],
  "Мосты ▾": ["Создать мост","Редактировать мост","Свойства моста"],
  "Профиль ж/д ▾": ["Создать профиль ж/д","Редактировать профиль","Свойства профиля"],
  "Поперечник ж/д ▾": ["Создать поперечник","Редактировать","Виды поперечников"],
  // Прозрачность
  "Объект точки ▾": ["Номер точки","Имя точки","Объект точки"],
  "Пикет и смещение ▾": ["Пикет и смещение","Пикет профиля и отметка","Смещение поперечника и отметка"],
  // Надстройки / Express
  "Библиотека ТС ▾": ["Легковой автомобиль","Грузовик (фура)","Автобус","Пожарная машина","Пользовательский"],
  "Блок ▾": ["Список блоков","Супер штриховка","Конвертировать текст в блок","Разбить блок"],
  "Выравнивание текста ▾": ["По левому краю","По центру","По правому краю","Вписать","Выровнять"],
  "Сплющить ▾": ["Сплющить","На отметку","Конвертировать в полилинию"],
  "Изолировать слой ▾": ["Изолировать слой","Снять изоляцию","Перебор слоёв"],
  "Добавить транспорт ▾": ["Добавить транспорт","Изменить транспорт","Удалить транспорт"],
  "Управление расширениями ▾": ["Установленные расширения","Найти расширения","Обновить"],
  // Геолокация
  "Тип карты ▾": ["Спутник","Схема","Гибрид","Рельеф"],
  "Задать местоположение ▾": ["С карты","По ГНСС","Ввести вручную"],
  "Переопубликовать ▾": ["Переопубликовать DWG","Переопубликовать PDF"],
  // Совместная работа
  "Создать ярлык ▾": ["Поверхности","Трассы","Трубопроводные сети","Коридоры","Группы видовых рамок"],
  // Очистить (Express)
  "Очистить ▾": ["Очистить всё","Блоки","Слои","Стили текста","Стили размеров"],
}

// ─── Canvas drawing ──────────────────────────────────────────────────────────

function drawCanvas(
  ctx: CanvasRenderingContext2D, W: number, H: number,
  visLayers: Record<string, boolean>, zoom: number,
  panX: number, panY: number, viewMode: string
) {
  ctx.clearRect(0, 0, W, H)
  const bg = viewMode === "wireframe" ? "#1a1a2e" : "#f0ede8"
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

  ctx.save()
  ctx.translate(panX, panY)
  ctx.scale(zoom, zoom)

  // grid
  if (visLayers.grid) {
    ctx.strokeStyle = viewMode === "wireframe" ? "rgba(80,120,180,0.2)" : "rgba(180,160,140,0.4)"
    ctx.lineWidth = 0.5 / zoom
    for (let x = -200; x < 1200; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, -100); ctx.lineTo(x, 800); ctx.stroke()
    }
    for (let y = -100; y < 800; y += 50) {
      ctx.beginPath(); ctx.moveTo(-200, y); ctx.lineTo(1200, y); ctx.stroke()
    }
  }

  // terrain contours
  if (visLayers.surfaces) {
    const contourColors = viewMode === "wireframe"
      ? ["rgba(100,200,100,0.3)","rgba(120,220,120,0.4)","rgba(80,180,80,0.3)"]
      : ["rgba(160,140,100,0.35)","rgba(140,120,80,0.3)","rgba(180,160,120,0.25)"]
    contourColors.forEach((col, ci) => {
      ctx.strokeStyle = col; ctx.lineWidth = (1 + ci * 0.3) / zoom
      for (let i = 0; i < 8; i++) {
        ctx.beginPath()
        const yBase = 30 + i * 40 + ci * 12
        ctx.moveTo(-50, yBase)
        for (let x = -50; x <= 980; x += 20) {
          const y = yBase + Math.sin(x * 0.018 + i) * 18 + Math.cos(x * 0.008 + ci) * 10
          ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
    })
  }

  // alignments
  if (visLayers.alignments) {
    ALIGNMENTS.forEach(al => {
      if (al.pts.length < 2) return
      ctx.beginPath()
      ctx.moveTo(al.pts[0][0], al.pts[0][1])
      for (let i = 1; i < al.pts.length; i++) ctx.lineTo(al.pts[i][0], al.pts[i][1])
      if (al.id === "perimeter") ctx.closePath()
      ctx.strokeStyle = al.color; ctx.lineWidth = 2.5 / zoom; ctx.stroke()
      // stations
      al.pts.forEach((pt, i) => {
        if (i % 2 === 0) {
          ctx.beginPath(); ctx.arc(pt[0], pt[1], 3 / zoom, 0, Math.PI * 2)
          ctx.fillStyle = al.color; ctx.fill()
        }
      })
      // label
      const mid = al.pts[Math.floor(al.pts.length / 2)]
      ctx.fillStyle = al.color; ctx.font = `bold ${11 / zoom}px monospace`
      ctx.fillText(al.name, mid[0] + 5, mid[1] - 6)
    })
  }

  // corridors / hatching
  if (visLayers.corridors) {
    ctx.save()
    ctx.globalAlpha = 0.18
    const grad = ctx.createLinearGradient(80, 60, 880, 100)
    grad.addColorStop(0, "#f97316"); grad.addColorStop(1, "#fb923c")
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.moveTo(80, 50); ctx.lineTo(880, 62); ctx.lineTo(880, 95); ctx.lineTo(80, 78)
    ctx.closePath(); ctx.fill()
    ctx.globalAlpha = 0.12
    ctx.fillStyle = "#a855f7"
    ctx.beginPath()
    ctx.moveTo(100, 170); ctx.lineTo(840, 178); ctx.lineTo(840, 205); ctx.lineTo(100, 198)
    ctx.closePath(); ctx.fill()
    ctx.restore()
  }

  // parking lot outline
  if (visLayers.sites) {
    ctx.strokeStyle = viewMode === "wireframe" ? "#facc15" : "#ca8a04"
    ctx.lineWidth = 1.5 / zoom; ctx.setLineDash([6 / zoom, 3 / zoom])
    ctx.beginPath()
    ctx.moveTo(140, 120); ctx.lineTo(300, 120); ctx.lineTo(300, 330)
    ctx.lineTo(140, 330); ctx.closePath(); ctx.stroke()
    ctx.setLineDash([])
    // parking stalls
    ctx.strokeStyle = viewMode === "wireframe" ? "rgba(250,204,21,0.5)" : "rgba(202,138,4,0.5)"
    ctx.lineWidth = 0.8 / zoom
    for (let y = 140; y < 320; y += 22) {
      ctx.beginPath(); ctx.moveTo(140, y); ctx.lineTo(300, y); ctx.stroke()
    }
    for (let x = 160; x < 300; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 120); ctx.lineTo(x, 330); ctx.stroke()
    }
  }

  // pipe network
  if (visLayers.pipenet) {
    ctx.strokeStyle = "#6366f1"; ctx.lineWidth = 2 / zoom
    const pipePts: [number,number][] = [[120,280],[180,275],[240,268],[300,260],[360,255],[420,258],[480,265]]
    ctx.beginPath(); ctx.moveTo(pipePts[0][0], pipePts[0][1])
    pipePts.slice(1).forEach(p => ctx.lineTo(p[0], p[1])); ctx.stroke()
    pipePts.forEach(p => {
      ctx.beginPath(); ctx.arc(p[0], p[1], 4/zoom, 0, Math.PI*2)
      ctx.fillStyle="#6366f1"; ctx.fill()
    })
  }

  // points
  if (visLayers.points) {
    const pts: [number,number,string][] = [[95,55,"1001"],[305,108,"1002"],[485,78,"1003"],[680,92,"1004"],[870,68,"1005"]]
    pts.forEach(([x,y,lbl]) => {
      ctx.beginPath(); ctx.arc(x, y, 4/zoom, 0, Math.PI*2)
      ctx.fillStyle="#f59e0b"; ctx.fill()
      ctx.strokeStyle="white"; ctx.lineWidth=1/zoom; ctx.stroke()
      ctx.fillStyle="#f59e0b"; ctx.font=`${9/zoom}px monospace`
      ctx.fillText(lbl, x+5, y-4)
    })
  }

  // axis
  ctx.strokeStyle = "rgba(100,100,100,0.6)"; ctx.lineWidth = 1/zoom
  ctx.beginPath(); ctx.moveTo(-30,380); ctx.lineTo(0,380); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(-30,380); ctx.lineTo(-30,350); ctx.stroke()
  ctx.fillStyle="#666"; ctx.font=`${9/zoom}px sans-serif`
  ctx.fillText("X",2,383); ctx.fillText("Z",-33,348)

  ctx.restore()

  // ── Profile View (top-right panel, like Civil 3D) ──────────────────────────
  const pvX = W * 0.53, pvY = 12, pvW = W * 0.44, pvH = 90
  // outer border
  ctx.fillStyle = viewMode === "wireframe" ? "#111122" : "#fafaf5"
  ctx.fillRect(pvX, pvY, pvW, pvH)
  ctx.strokeStyle = "#60a5fa"; ctx.lineWidth = 1; ctx.strokeRect(pvX, pvY, pvW, pvH)
  // grid inside profile view
  ctx.strokeStyle = viewMode === "wireframe" ? "rgba(100,120,200,0.25)" : "rgba(160,160,120,0.3)"
  ctx.lineWidth = 0.5
  for (let gx = pvX + 20; gx < pvX + pvW; gx += 20) {
    ctx.beginPath(); ctx.moveTo(gx, pvY); ctx.lineTo(gx, pvY + pvH); ctx.stroke()
  }
  for (let gy = pvY + 15; gy < pvY + pvH; gy += 15) {
    ctx.beginPath(); ctx.moveTo(pvX, gy); ctx.lineTo(pvX + pvW, gy); ctx.stroke()
  }
  // station ticks at bottom
  ctx.strokeStyle = "#6b7280"; ctx.lineWidth = 0.8
  for (let t = 0; t <= 10; t++) {
    const tx = pvX + 10 + t * (pvW - 20) / 10
    ctx.beginPath(); ctx.moveTo(tx, pvY + pvH - 10); ctx.lineTo(tx, pvY + pvH); ctx.stroke()
    ctx.fillStyle = "#6b7280"; ctx.font = "7px monospace"
    ctx.fillText(`${t * 100}`, tx - 8, pvY + pvH - 2)
  }
  // existing ground profile (red/pink line)
  ctx.beginPath(); ctx.strokeStyle = "#f87171"; ctx.lineWidth = 1.5
  const egPts = [0,4,8,6,12,10,7,5,9,11,8].map((v, i) => ({
    x: pvX + 10 + i * (pvW - 20) / 10,
    y: pvY + 20 + (15 - v * 2)
  }))
  egPts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
  ctx.stroke()
  // design profile (orange line)
  ctx.beginPath(); ctx.strokeStyle = "#fb923c"; ctx.lineWidth = 2
  const dpPts = [2,5,9,9,9,8,7,7,8,10,9].map((v, i) => ({
    x: pvX + 10 + i * (pvW - 20) / 10,
    y: pvY + 20 + (15 - v * 2)
  }))
  dpPts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
  ctx.stroke()
  // label
  ctx.fillStyle = viewMode==="wireframe"?"#60a5fa":"#1d4ed8"; ctx.font = "bold 8px Arial"
  ctx.fillText("Вторая улица  ВП  0+000 м ... 1000 м", pvX + 4, pvY + 10)

  // ── Second profile view (below) ──────────────────────────────────────────
  const pv2Y = pvY + pvH + 8
  const pv2H = 72
  ctx.fillStyle = viewMode === "wireframe" ? "#111122" : "#fafaf5"
  ctx.fillRect(pvX, pv2Y, pvW * 0.75, pv2H)
  ctx.strokeStyle = "#818cf8"; ctx.lineWidth = 1; ctx.strokeRect(pvX, pv2Y, pvW * 0.75, pv2H)
  ctx.strokeStyle = viewMode === "wireframe" ? "rgba(100,120,200,0.2)" : "rgba(140,140,100,0.25)"
  ctx.lineWidth = 0.5
  for (let gx = pvX + 18; gx < pvX + pvW * 0.75; gx += 18) {
    ctx.beginPath(); ctx.moveTo(gx, pv2Y); ctx.lineTo(gx, pv2Y + pv2H); ctx.stroke()
  }
  for (let gy = pv2Y + 12; gy < pv2Y + pv2H; gy += 12) {
    ctx.beginPath(); ctx.moveTo(pvX, gy); ctx.lineTo(pvX + pvW * 0.75, gy); ctx.stroke()
  }
  // station ticks
  for (let t = 0; t <= 8; t++) {
    const tx = pvX + 8 + t * (pvW * 0.75 - 16) / 8
    ctx.strokeStyle="#6b7280"; ctx.lineWidth=0.8
    ctx.beginPath(); ctx.moveTo(tx, pv2Y + pv2H - 8); ctx.lineTo(tx, pv2Y + pv2H); ctx.stroke()
    ctx.fillStyle="#6b7280"; ctx.font="7px monospace"
    ctx.fillText(`${t * 80}`, tx - 6, pv2Y + pv2H - 1)
  }
  ctx.beginPath(); ctx.strokeStyle = "#f87171"; ctx.lineWidth = 1.5
  const eg2 = [3,6,9,8,7,10,9,8,11].map((v,i)=>({
    x: pvX + 8 + i*(pvW*0.75-16)/8, y: pv2Y+15+(12-v*1.5)
  }))
  eg2.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y)); ctx.stroke()
  ctx.beginPath(); ctx.strokeStyle = "#fb923c"; ctx.lineWidth = 2
  const dp2 = [4,7,9,9,8,9,9,8,10].map((v,i)=>({
    x: pvX + 8 + i*(pvW*0.75-16)/8, y: pv2Y+15+(12-v*1.5)
  }))
  dp2.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y)); ctx.stroke()
  ctx.fillStyle = viewMode==="wireframe"?"#818cf8":"#4f46e5"; ctx.font="bold 8px Arial"
  ctx.fillText("Ул. Трумана  ВП  0+000 м ... 640 м", pvX + 4, pv2Y + 9)

  ctx.restore()
}

// ─── Surface Dialog ──────────────────────────────────────────────────────────

function SurfaceDialog({ onClose, onOK }: { onClose: () => void; onOK: (d: SurfaceDef) => void }) {
  const SURF_STYLES = ["Стандарт", "Горизонтали 1м", "Горизонтали 5м", "Без отображения", "Анализ уклонов"]
  const [def, setDef] = useState<SurfaceDef>({
    name: "Существующая поверхность", description: "", type: "TIN",
    style: "Горизонтали 1м", layer: "C-TOPO-SURF", gridX: "10", gridY: "10",
    pointFiles: [{ name: "Точки_съёмки.csv", format: "CSV (N,E,Z,Desc)" }],
  })
  const [tab, setTab] = useState<"info" | "build" | "analysis">("info")
  const [addFile, setAddFile] = useState("")
  const [addFormat, setAddFormat] = useState("CSV (N,E,Z,Desc)")
  const FORMATS = ["CSV (N,E,Z,Desc)", "TXT (X,Y,Z)", "LandXML", "DEM/GeoTIFF", "Облако точек RCP"]

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
        className="bg-[#f0f0f0] border border-gray-400 shadow-2xl w-[560px] max-h-[90vh] overflow-y-auto"
        style={{ fontFamily: "Arial, sans-serif", fontSize: 12 }}>
        <div className="flex items-center justify-between bg-[#0078d4] px-3 py-1.5">
          <span className="text-white font-bold text-sm">Создать поверхность</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 w-5 h-5 flex items-center justify-center">✕</button>
        </div>
        {/* Tabs */}
        <div className="flex border-b border-gray-300 bg-[#e8e8e8]">
          {(["info","build","analysis"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-xs font-semibold border-r border-gray-300 transition-colors ${tab===t?"bg-white text-blue-700":"text-gray-600 hover:bg-gray-100"}`}>
              {t==="info"?"Информация":t==="build"?"Построение":"Анализ"}
            </button>
          ))}
        </div>
        <div className="p-3 space-y-2">
          {tab === "info" && <>
            <div className="flex items-center gap-2">
              <label className="w-28 text-xs text-gray-700 shrink-0">Тип поверхности:</label>
              <div className="flex gap-3">
                {(["TIN","Grid"] as const).map(t => (
                  <label key={t} className="flex items-center gap-1 text-xs cursor-pointer">
                    <input type="radio" checked={def.type===t} onChange={() => setDef(d=>({...d,type:t}))} />
                    <span className="font-semibold">{t}</span>
                    <span className="text-gray-500">{t==="TIN"?"— триангуляция":"— регулярная сетка"}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-28 text-xs text-gray-700 shrink-0">Название:</label>
              <input value={def.name} onChange={e=>setDef(d=>({...d,name:e.target.value}))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
              <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">⋯</button>
            </div>
            <div className="flex items-start gap-2">
              <label className="w-28 text-xs text-gray-700 shrink-0 mt-1">Описание:</label>
              <textarea value={def.description} onChange={e=>setDef(d=>({...d,description:e.target.value}))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white h-10 resize-none" />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-28 text-xs text-gray-700 shrink-0">Стиль:</label>
              <select value={def.style} onChange={e=>setDef(d=>({...d,style:e.target.value}))} className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
                {SURF_STYLES.map(s=><option key={s}>{s}</option>)}
              </select>
              <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">⋯</button>
              <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">✎</button>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-28 text-xs text-gray-700 shrink-0">Слой:</label>
              <input value={def.layer} onChange={e=>setDef(d=>({...d,layer:e.target.value}))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
            </div>
            {def.type==="Grid" && <div className="flex items-center gap-2">
              <label className="w-28 text-xs text-gray-700 shrink-0">Шаг сетки (м):</label>
              <span className="text-xs text-gray-600">X:</span>
              <input value={def.gridX} onChange={e=>setDef(d=>({...d,gridX:e.target.value}))} className="w-16 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
              <span className="text-xs text-gray-600">Y:</span>
              <input value={def.gridY} onChange={e=>setDef(d=>({...d,gridY:e.target.value}))} className="w-16 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
            </div>}
          </>}

          {tab === "build" && <>
            <div className="border border-gray-400 bg-white">
              <div className="bg-[#d0d0d0] px-2 py-1 flex items-center gap-1 font-bold text-xs border-b border-gray-400">
                <span className="text-blue-600">▼</span> Источники данных
              </div>
              <div className="flex items-center gap-1 bg-[#e8e8e8] border-b border-gray-300 text-xs font-semibold px-2 py-0.5">
                <span className="flex-1">Файл / источник</span>
                <span className="w-40">Формат</span>
              </div>
              <div className="max-h-36 overflow-y-auto">
                {def.pointFiles.map((f,i) => (
                  <div key={i} className={`flex items-center px-2 py-1 text-xs border-b border-gray-100 ${i%2===0?"bg-white":"bg-gray-50"}`}>
                    <span className="flex-1 text-blue-700 font-mono">{f.name}</span>
                    <span className="w-40 text-gray-600">{f.format}</span>
                    <button onClick={() => setDef(d=>({...d,pointFiles:d.pointFiles.filter((_,j)=>j!==i)}))}
                      className="text-gray-400 hover:text-red-500 ml-2 text-xs">✕</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <div className="text-xs text-gray-600 mb-0.5">Файл:</div>
                <input value={addFile} onChange={e=>setAddFile(e.target.value)} placeholder="имя_файла.csv" className="w-full border border-gray-400 px-2 py-0.5 text-xs bg-white" />
              </div>
              <div className="w-44">
                <div className="text-xs text-gray-600 mb-0.5">Формат:</div>
                <select value={addFormat} onChange={e=>setAddFormat(e.target.value)} className="w-full border border-gray-400 px-1 py-0.5 text-xs bg-white">
                  {FORMATS.map(f=><option key={f}>{f}</option>)}
                </select>
              </div>
              <button onClick={() => { if(addFile){setDef(d=>({...d,pointFiles:[...d.pointFiles,{name:addFile,format:addFormat}]}));setAddFile("")}}}
                className="px-3 py-1 bg-[#0078d4] text-white text-xs border border-blue-700 hover:bg-blue-700">Добавить</button>
            </div>
            <p className="text-[10px] text-gray-500">После добавления источников нажмите ОК — поверхность будет построена и добавлена в дерево проекта.</p>
          </>}

          {tab === "analysis" && <>
            <div className="space-y-2">
              {[
                { label: "Анализ уклонов", desc: "Диапазоны уклонов с цветовой заливкой по категориям", icon: "🎨" },
                { label: "Анализ высот", desc: "Градиентная заливка по отметкам от min до max", icon: "📊" },
                { label: "Стрелки уклонов", desc: "Направление стока воды по рельефу", icon: "↓" },
                { label: "Водосборные бассейны", desc: "Автоматическое разбиение на водосборные зоны", icon: "💧" },
              ].map(a => (
                <label key={a.label} className="flex items-start gap-2 p-2 border border-gray-200 bg-white rounded cursor-pointer hover:bg-blue-50 transition-colors">
                  <input type="checkbox" className="mt-0.5 accent-blue-600" />
                  <span className="text-lg leading-none">{a.icon}</span>
                  <div>
                    <div className="text-xs font-semibold text-gray-800">{a.label}</div>
                    <div className="text-[10px] text-gray-500">{a.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </>}
        </div>
        <div className="flex justify-end gap-2 px-3 pb-3">
          <button onClick={() => onOK(def)} className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">ОК</button>
          <button onClick={onClose} className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">Отмена</button>
          <button className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">Справка</button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Alignment Dialog ─────────────────────────────────────────────────────────

function AlignmentDialog({ onClose, onOK }: { onClose: () => void; onOK: (d: AlignmentDef) => void }) {
  const AL_TYPES = ["Осевая линия дороги","Пешеходная дорожка","Рельсовый путь","Бордюрная линия","Произвольная"]
  const AL_STYLES = ["Базовый","Автодорога","Ж/д путь","Без отображения"]
  const [def, setDef] = useState<AlignmentDef>({
    name: "Трасса-1", description: "", type: AL_TYPES[0],
    startStation: "0+00", stationIncrement: "20",
    style: "Автодорога", layer: "C-ROAD-ALIGN",
    elements: [
      { type: "line", length: "250.00", radius: "—", Az: "45°12′30″", A: "—" },
      { type: "spiral", length: "60.00", radius: "300", Az: "—", A: "60" },
      { type: "curve", length: "314.16", radius: "300", Az: "—", A: "—" },
      { type: "spiral", length: "60.00", radius: "300", Az: "—", A: "60" },
      { type: "line", length: "180.00", radius: "—", Az: "105°45′00″", A: "—" },
    ],
  })
  const [tab, setTab] = useState<"info"|"geom"|"station">("info")
  const TYPE_LABELS: Record<string,string> = { line: "Прямая", curve: "Круговая кривая", spiral: "Клотоида" }
  const TYPE_COLORS: Record<string,string> = { line: "text-blue-700", curve: "text-orange-600", spiral: "text-green-700" }

  const addElement = (type: "line"|"curve"|"spiral") => {
    setDef(d=>({...d, elements:[...d.elements, { type, length:"100.00", radius: type==="line"?"—":"500", Az: type==="line"?"0°00′00″":"—", A: type==="spiral"?"50":"—" }]}))
  }
  const removeEl = (i: number) => setDef(d=>({...d, elements:d.elements.filter((_,j)=>j!==i)}))

  const totalLength = def.elements.reduce((s,e) => s + (parseFloat(e.length)||0), 0)

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
        className="bg-[#f0f0f0] border border-gray-400 shadow-2xl w-[600px] max-h-[90vh] overflow-y-auto"
        style={{ fontFamily: "Arial, sans-serif", fontSize: 12 }}>
        <div className="flex items-center justify-between bg-[#0078d4] px-3 py-1.5">
          <span className="text-white font-bold text-sm">Создать трассу</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 w-5 h-5 flex items-center justify-center">✕</button>
        </div>
        <div className="flex border-b border-gray-300 bg-[#e8e8e8]">
          {(["info","geom","station"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`px-4 py-1.5 text-xs font-semibold border-r border-gray-300 transition-colors ${tab===t?"bg-white text-blue-700":"text-gray-600 hover:bg-gray-100"}`}>
              {t==="info"?"Информация":t==="geom"?"Геометрия элементов":"Пикетаж"}
            </button>
          ))}
        </div>
        <div className="p-3 space-y-2">
          {tab==="info" && <>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0">Название:</label>
              <input value={def.name} onChange={e=>setDef(d=>({...d,name:e.target.value}))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
              <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">⋯</button>
            </div>
            <div className="flex items-start gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0 mt-1">Описание:</label>
              <textarea value={def.description} onChange={e=>setDef(d=>({...d,description:e.target.value}))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white h-10 resize-none" />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0">Тип трассы:</label>
              <select value={def.type} onChange={e=>setDef(d=>({...d,type:e.target.value}))} className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
                {AL_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0">Стиль:</label>
              <select value={def.style} onChange={e=>setDef(d=>({...d,style:e.target.value}))} className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
                {AL_STYLES.map(s=><option key={s}>{s}</option>)}
              </select>
              <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">✎</button>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0">Слой:</label>
              <input value={def.layer} onChange={e=>setDef(d=>({...d,layer:e.target.value}))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
            </div>
            <div className="flex items-center gap-2 mt-1 p-2 bg-blue-50 border border-blue-200 rounded">
              <span className="text-xs text-blue-700 font-semibold">Общая длина трассы:</span>
              <span className="text-xs font-mono font-bold text-blue-900">{totalLength.toFixed(2)} м</span>
            </div>
          </>}

          {tab==="geom" && <>
            <div className="border border-gray-400 bg-white">
              <div className="bg-[#d0d0d0] px-2 py-1 flex items-center gap-1 font-bold text-xs border-b border-gray-400">
                <span className="text-blue-600">▼</span> Элементы геометрии
                <div className="ml-auto flex gap-1">
                  {([["line","Пр"],["curve","КК"],["spiral","КЛ"]] as [string,string][]).map(([t,l])=>(
                    <button key={t} onClick={()=>addElement(t as "line"|"curve"|"spiral")}
                      className="px-2 py-0.5 bg-[#0078d4] text-white text-[10px] hover:bg-blue-700">+ {l}</button>
                  ))}
                </div>
              </div>
              <table className="w-full text-xs">
                <thead className="bg-[#e8e8e8] border-b border-gray-300">
                  <tr>
                    <th className="px-2 py-1 text-left font-semibold border-r border-gray-200 w-8">#</th>
                    <th className="px-2 py-1 text-left font-semibold border-r border-gray-200 w-28">Тип</th>
                    <th className="px-2 py-1 text-left font-semibold border-r border-gray-200">Длина (м)</th>
                    <th className="px-2 py-1 text-left font-semibold border-r border-gray-200">R (м)</th>
                    <th className="px-2 py-1 text-left font-semibold border-r border-gray-200">Азимут / A</th>
                    <th className="px-1 py-1 w-6"></th>
                  </tr>
                </thead>
                <tbody>
                  {def.elements.map((el,i)=>(
                    <tr key={i} className={i%2===0?"bg-white":"bg-gray-50"}>
                      <td className="px-2 py-1 border-r border-gray-100 text-gray-500">{i+1}</td>
                      <td className={`px-2 py-1 border-r border-gray-100 font-semibold ${TYPE_COLORS[el.type]}`}>{TYPE_LABELS[el.type]}</td>
                      <td className="px-1 py-0.5 border-r border-gray-100">
                        <input value={el.length} onChange={e=>{const els=[...def.elements];els[i]={...els[i],length:e.target.value};setDef(d=>({...d,elements:els}))}}
                          className="w-full bg-transparent outline-none text-xs font-mono" />
                      </td>
                      <td className="px-1 py-0.5 border-r border-gray-100">
                        <input value={el.radius} onChange={e=>{const els=[...def.elements];els[i]={...els[i],radius:e.target.value};setDef(d=>({...d,elements:els}))}}
                          className="w-full bg-transparent outline-none text-xs font-mono" disabled={el.type==="line"} />
                      </td>
                      <td className="px-1 py-0.5 border-r border-gray-100 font-mono text-[10px] text-gray-600">
                        {el.type==="line"?el.Az:el.type==="spiral"?`A=${el.A}`:"—"}
                      </td>
                      <td className="px-1 py-0.5">
                        <button onClick={()=>removeEl(i)} className="text-gray-400 hover:text-red-500">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#e8e8e8] border-t border-gray-300">
                  <tr><td colSpan={2} className="px-2 py-1 text-xs font-bold">Итого:</td>
                    <td className="px-2 py-1 text-xs font-bold font-mono">{totalLength.toFixed(2)}</td>
                    <td colSpan={3}></td></tr>
                </tfoot>
              </table>
            </div>
          </>}

          {tab==="station" && <>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <label className="w-36 text-xs text-gray-700 shrink-0">Начало пикетажа:</label>
                <input value={def.startStation} onChange={e=>setDef(d=>({...d,startStation:e.target.value}))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white font-mono" />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-36 text-xs text-gray-700 shrink-0">Шаг пикетажа (м):</label>
                <input value={def.stationIncrement} onChange={e=>setDef(d=>({...d,stationIncrement:e.target.value}))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white font-mono" />
              </div>
            </div>
            <div className="border border-gray-300 bg-white p-3 rounded space-y-1">
              <div className="text-xs font-semibold text-gray-700 mb-2">Разбивочные элементы:</div>
              {def.elements.map((el,i) => {
                const pk = def.elements.slice(0,i).reduce((s,e)=>s+(parseFloat(e.length)||0),0)
                return (
                  <div key={i} className="flex gap-2 text-xs text-gray-600 font-mono">
                    <span className="w-6 text-gray-400">{i+1}.</span>
                    <span className={`w-28 font-semibold ${TYPE_COLORS[el.type]}`}>{TYPE_LABELS[el.type]}</span>
                    <span>ПК {(pk/100).toFixed(0).padStart(2,"0")}+{String(pk%100).padStart(2,"0")} … ПК {((pk+(parseFloat(el.length)||0))/100).toFixed(0).padStart(2,"0")}+{String(Math.round((pk+(parseFloat(el.length)||0))%100)).padStart(2,"0")}</span>
                    <span className="text-gray-400 ml-auto">{el.length} м</span>
                  </div>
                )
              })}
              <div className="border-t border-gray-200 mt-2 pt-2 flex gap-2 text-xs font-bold">
                <span className="text-gray-600">Конец трассы:</span>
                <span className="font-mono text-blue-700">ПК {(totalLength/100).toFixed(0).padStart(2,"0")}+{String(Math.round(totalLength%100)).padStart(2,"0")}</span>
              </div>
            </div>
          </>}
        </div>
        <div className="flex justify-end gap-2 px-3 pb-3">
          <button onClick={()=>onOK(def)} className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">ОК</button>
          <button onClick={onClose} className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">Отмена</button>
          <button className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">Справка</button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Profile Dialog ───────────────────────────────────────────────────────────

function ProfileDialog({ onClose, onOK, alignments }: { onClose: () => void; onOK: (d: ProfileDef) => void; alignments: string[] }) {
  const PROF_STYLES = ["Базовый","Профиль разработки","Существующий рельеф","Без отображения"]
  const [def, setDef] = useState<ProfileDef>({
    name: "Проект_Трасса-1", alignment: alignments[0] || "Трасса ШД-38",
    surface: "Существующая поверхность", description: "", style: "Профиль разработки", layer: "C-ROAD-PROF",
    pvcs: [
      { station: "0+00", elev: "120.50", k: "—" },
      { station: "2+50", elev: "125.80", k: "40" },
      { station: "5+00", elev: "122.30", k: "60" },
      { station: "8+00", elev: "118.90", k: "35" },
      { station: "10+00", elev: "121.40", k: "—" },
    ],
  })
  const [tab, setTab] = useState<"info"|"pvc"|"preview">("info")
  const [newSt, setNewSt] = useState(""); const [newEl, setNewEl] = useState(""); const [newK, setNewK] = useState("—")

  const addPVC = () => {
    if (!newSt || !newEl) return
    setDef(d=>({...d, pvcs: [...d.pvcs, {station:newSt, elev:newEl, k:newK}].sort((a,b)=>{
      const parse = (s:string) => { const [pk,m]=s.split("+"); return +(pk||0)*100+(+(m||0)) }
      return parse(a.station)-parse(b.station)
    })}))
    setNewSt(""); setNewEl(""); setNewK("—")
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
        className="bg-[#f0f0f0] border border-gray-400 shadow-2xl w-[580px] max-h-[90vh] overflow-y-auto"
        style={{ fontFamily: "Arial, sans-serif", fontSize: 12 }}>
        <div className="flex items-center justify-between bg-[#0078d4] px-3 py-1.5">
          <span className="text-white font-bold text-sm">Создать профиль разработки</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 w-5 h-5 flex items-center justify-center">✕</button>
        </div>
        <div className="flex border-b border-gray-300 bg-[#e8e8e8]">
          {(["info","pvc","preview"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`px-4 py-1.5 text-xs font-semibold border-r border-gray-300 transition-colors ${tab===t?"bg-white text-blue-700":"text-gray-600 hover:bg-gray-100"}`}>
              {t==="info"?"Информация":t==="pvc"?"Точки ВК":"Предпросмотр"}
            </button>
          ))}
        </div>
        <div className="p-3 space-y-2">
          {tab==="info" && <>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0">Трасса:</label>
              <select value={def.alignment} onChange={e=>setDef(d=>({...d,alignment:e.target.value}))} className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
                {alignments.map(a=><option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0">Поверхность рельефа:</label>
              <select value={def.surface} onChange={e=>setDef(d=>({...d,surface:e.target.value}))} className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
                {["Существующая поверхность","Проектная поверхность"].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0">Название профиля:</label>
              <input value={def.name} onChange={e=>setDef(d=>({...d,name:e.target.value}))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0">Стиль:</label>
              <select value={def.style} onChange={e=>setDef(d=>({...d,style:e.target.value}))} className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
                {PROF_STYLES.map(s=><option key={s}>{s}</option>)}
              </select>
              <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">✎</button>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32 text-xs text-gray-700 shrink-0">Слой:</label>
              <input value={def.layer} onChange={e=>setDef(d=>({...d,layer:e.target.value}))} className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
            </div>
          </>}

          {tab==="pvc" && <>
            <div className="border border-gray-400 bg-white">
              <div className="bg-[#d0d0d0] px-2 py-1 flex items-center gap-1 font-bold text-xs border-b border-gray-400">
                <span className="text-blue-600">▼</span> Вертикальные кривые (ВК)
              </div>
              <table className="w-full text-xs">
                <thead className="bg-[#e8e8e8] border-b border-gray-300">
                  <tr>
                    <th className="px-2 py-1 text-left font-semibold border-r border-gray-200">Пикет</th>
                    <th className="px-2 py-1 text-left font-semibold border-r border-gray-200">Отметка (м)</th>
                    <th className="px-2 py-1 text-left font-semibold border-r border-gray-200">Параметр K</th>
                    <th className="w-6"></th>
                  </tr>
                </thead>
                <tbody>
                  {def.pvcs.map((pvc,i)=>(
                    <tr key={i} className={i%2===0?"bg-white":"bg-gray-50"}>
                      <td className="px-1 py-0.5 border-r border-gray-100">
                        <input value={pvc.station} onChange={e=>{const p=[...def.pvcs];p[i]={...p[i],station:e.target.value};setDef(d=>({...d,pvcs:p}))}}
                          className="w-full bg-transparent outline-none font-mono text-xs" />
                      </td>
                      <td className="px-1 py-0.5 border-r border-gray-100">
                        <input value={pvc.elev} onChange={e=>{const p=[...def.pvcs];p[i]={...p[i],elev:e.target.value};setDef(d=>({...d,pvcs:p}))}}
                          className="w-full bg-transparent outline-none font-mono text-xs" />
                      </td>
                      <td className="px-1 py-0.5 border-r border-gray-100">
                        <input value={pvc.k} onChange={e=>{const p=[...def.pvcs];p[i]={...p[i],k:e.target.value};setDef(d=>({...d,pvcs:p}))}}
                          className="w-full bg-transparent outline-none font-mono text-xs" />
                      </td>
                      <td className="px-1"><button onClick={()=>setDef(d=>({...d,pvcs:d.pvcs.filter((_,j)=>j!==i)}))} className="text-gray-400 hover:text-red-500">✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 items-end">
              <div><div className="text-xs text-gray-600 mb-0.5">Пикет:</div><input value={newSt} onChange={e=>setNewSt(e.target.value)} placeholder="0+00" className="w-20 border border-gray-400 px-2 py-0.5 text-xs bg-white font-mono" /></div>
              <div><div className="text-xs text-gray-600 mb-0.5">Отметка:</div><input value={newEl} onChange={e=>setNewEl(e.target.value)} placeholder="120.00" className="w-20 border border-gray-400 px-2 py-0.5 text-xs bg-white font-mono" /></div>
              <div><div className="text-xs text-gray-600 mb-0.5">K:</div><input value={newK} onChange={e=>setNewK(e.target.value)} placeholder="—" className="w-14 border border-gray-400 px-2 py-0.5 text-xs bg-white font-mono" /></div>
              <button onClick={addPVC} className="px-3 py-1 bg-[#0078d4] text-white text-xs border border-blue-700 hover:bg-blue-700">+ ВК</button>
            </div>
          </>}

          {tab==="preview" && <>
            <div className="bg-[#1a1a2e] rounded border border-gray-600 p-2" style={{height:160}}>
              <svg width="100%" height="100%" viewBox="0 0 520 140">
                <line x1="20" y1="120" x2="500" y2="120" stroke="#444" strokeWidth="1"/>
                {def.pvcs.map((_,i)=>{
                  const x = 20 + i*(480/(def.pvcs.length-1||1))
                  return <line key={i} x1={x} y1="118" x2={x} y2="124" stroke="#666" strokeWidth="1"/>
                })}
                {def.pvcs.map((p,i)=>{
                  const x = 20 + i*(480/(def.pvcs.length-1||1))
                  const minE = Math.min(...def.pvcs.map(p=>parseFloat(p.elev)||0))
                  const maxE = Math.max(...def.pvcs.map(p=>parseFloat(p.elev)||0))
                  const range = maxE-minE || 1
                  const y = 110 - ((parseFloat(p.elev)||0)-minE)/range*80
                  return <text key={i} x={x} y="133" fill="#6b7280" fontSize="7" textAnchor="middle">{p.station}</text>
                })}
                <polyline
                  points={def.pvcs.map((p,i)=>{
                    const x = 20 + i*(480/(def.pvcs.length-1||1))
                    const minE = Math.min(...def.pvcs.map(p=>parseFloat(p.elev)||0))
                    const maxE = Math.max(...def.pvcs.map(p=>parseFloat(p.elev)||0))
                    const range = maxE-minE || 1
                    const y = 110 - ((parseFloat(p.elev)||0)-minE)/range*80
                    return `${x},${y}`
                  }).join(" ")}
                  fill="none" stroke="#f97316" strokeWidth="2"/>
                {def.pvcs.map((p,i)=>{
                  const x = 20 + i*(480/(def.pvcs.length-1||1))
                  const minE = Math.min(...def.pvcs.map(p=>parseFloat(p.elev)||0))
                  const maxE = Math.max(...def.pvcs.map(p=>parseFloat(p.elev)||0))
                  const range = maxE-minE || 1
                  const y = 110 - ((parseFloat(p.elev)||0)-minE)/range*80
                  return <g key={i}>
                    <circle cx={x} cy={y} r="3" fill="#f97316"/>
                    <text x={x} y={y-6} fill="#fb923c" fontSize="7" textAnchor="middle">{p.elev}</text>
                  </g>
                })}
                <text x="20" y="12" fill="#9ca3af" fontSize="8">Профиль: {def.name}</text>
              </svg>
            </div>
            <p className="text-[10px] text-gray-500 text-center">Предпросмотр продольного профиля. Оранжевая линия — профиль разработки.</p>
          </>}
        </div>
        <div className="flex justify-end gap-2 px-3 pb-3">
          <button onClick={()=>onOK(def)} className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">ОК</button>
          <button onClick={onClose} className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">Отмена</button>
          <button className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">Справка</button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Tree node component ─────────────────────────────────────────────────────

function TreeItem({ node, depth, selected, onSelect, onToggle }: {
  node: TreeNode; depth: number; selected: string | null
  onSelect: (id: string) => void; onToggle: (id: string) => void
}) {
  return (
    <>
      <div
        className={`flex items-center gap-1 px-1 py-0.5 cursor-pointer text-xs select-none hover:bg-blue-900/40 transition-colors ${selected === node.id ? "bg-blue-800/60" : ""}`}
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
        onClick={() => onSelect(node.id)}
        onDoubleClick={() => node.children && onToggle(node.id)}
      >
        {node.children ? (
          <Icon name={node.expanded ? "ChevronDown" : "ChevronRight"} size={10} className="text-gray-400 flex-shrink-0"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); onToggle(node.id) }} />
        ) : <span className="w-2.5" />}
        <Icon name={node.icon} size={12} className="flex-shrink-0" style={{ color: node.color || "#94a3b8" }} fallback="File" />
        <span className="text-gray-200 truncate">{node.label}</span>
      </div>
      {node.expanded && node.children?.map(child => (
        <TreeItem key={child.id} node={child} depth={depth + 1} selected={selected} onSelect={onSelect} onToggle={onToggle} />
      ))}
    </>
  )
}

// ─── Create Corridor Dialog ──────────────────────────────────────────────────

function CorridorDialog({ onClose, onOK }: { onClose: () => void; onOK: (d: CorridorDef) => void }) {
  const [def, setDef] = useState<CorridorDef>({
    name: "Дорога и парковочная зона", description: "", style: "Базовый",
    codeStyle: "Все коды", layer: "С-ДОРОГА-КОР", template: "",
    targetSurface: "<нет>",
    rows: [
      { alignment: "Трасса ШД-38", profile: "ПРОЕКТ_ШД-38", assembly: "Трасса ШД-38" },
      { alignment: "Ул. Трумана", profile: "Проект_Трумана", assembly: "Ул. Трумана" },
      { alignment: "*Нет*", profile: "*Нет*", assembly: "*Нет*" },
    ],
    features: FEATURE_LINES,
  })
  const [selFeature, setSelFeature] = useState<string | null>("Бордюр пр.ч. Лев. 7")
  const [featureDropdown, setFeatureDropdown] = useState<string | null>(null)

  const updateRow = (i: number, field: keyof CorridorRow, val: string) => {
    const rows = [...def.rows]; rows[i] = { ...rows[i], [field]: val }
    setDef(d => ({ ...d, rows }))
  }

  const updateFeature = (name: string, assembly: string) => {
    const features = def.features.map(f => f.name === name ? { ...f, assembly } : f)
    setDef(d => ({ ...d, features }))
    setFeatureDropdown(null)
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
        className="bg-[#f0f0f0] border border-gray-400 shadow-2xl w-[540px] max-h-[90vh] overflow-y-auto"
        style={{ fontFamily: "Arial, sans-serif", fontSize: 12 }}
      >
        {/* title */}
        <div className="flex items-center justify-between bg-[#0078d4] px-3 py-1.5">
          <span className="text-white font-bold text-sm">Создать коридор</span>
          <button onClick={onClose} className="text-white hover:bg-blue-700 w-5 h-5 flex items-center justify-center text-xs">✕</button>
        </div>

        <div className="p-3 space-y-2">
          {/* Name */}
          <div className="flex items-center gap-2">
            <label className="w-24 text-xs text-gray-700 shrink-0">Название:</label>
            <input value={def.name} onChange={e => setDef(d => ({...d, name: e.target.value}))}
              className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
            <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs flex items-center justify-center">⋯</button>
          </div>
          {/* Description */}
          <div className="flex items-start gap-2">
            <label className="w-24 text-xs text-gray-700 shrink-0 mt-1">Описание:</label>
            <textarea value={def.description} onChange={e => setDef(d => ({...d, description: e.target.value}))}
              className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white h-10 resize-none" />
          </div>
          {/* Corridor style */}
          <div className="flex items-center gap-2">
            <label className="w-24 text-xs text-gray-700 shrink-0">Стиль коридора:</label>
            <select value={def.style} onChange={e => setDef(d => ({...d, style: e.target.value}))}
              className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
              {STYLES.map(s => <option key={s}>{s}</option>)}
            </select>
            <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">⋯</button>
            <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">✎</button>
            <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">+</button>
          </div>
          {/* Code set style */}
          <div className="flex items-center gap-2">
            <label className="w-24 text-xs text-gray-700 shrink-0">Стиль кодов:</label>
            <select value={def.codeStyle} onChange={e => setDef(d => ({...d, codeStyle: e.target.value}))}
              className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
              {CODE_STYLES.map(s => <option key={s}>{s}</option>)}
            </select>
            <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">⋯</button>
            <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">✎</button>
          </div>
          {/* Corridor layer */}
          <div className="flex items-center gap-2">
            <label className="w-24 text-xs text-gray-700 shrink-0">Слой коридора:</label>
            <input value={def.layer} onChange={e => setDef(d => ({...d, layer: e.target.value}))}
              className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
            <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">✎</button>
          </div>
          {/* Corridor Template */}
          <div className="flex items-center gap-2">
            <label className="w-24 text-xs text-gray-700 shrink-0">Шаблон коридора:</label>
            <input value={def.template} onChange={e => setDef(d => ({...d, template: e.target.value}))}
              className="flex-1 border border-gray-400 px-2 py-0.5 text-xs bg-white" />
            <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">⋯</button>
          </div>
          {/* Target Surface */}
          <div className="flex items-center gap-2">
            <label className="w-24 text-xs text-gray-700 shrink-0">Целев. поверхность:</label>
            <select value={def.targetSurface} onChange={e => setDef(d => ({...d, targetSurface: e.target.value}))}
              className="flex-1 border border-gray-400 px-1 py-0.5 text-xs bg-white">
              {SURFACES.map(s => <option key={s}>{s}</option>)}
            </select>
            <button className="w-6 h-5 bg-[#e0e0e0] border border-gray-400 text-xs">⋯</button>
          </div>

          {/* Alignments and profiles */}
          <div className="border border-gray-400 bg-white">
            <div className="bg-[#d0d0d0] px-2 py-1 flex items-center gap-1 font-bold text-xs border-b border-gray-400">
              <span className="text-blue-600 cursor-pointer">▼</span> Трассы и профили
            </div>
            <table className="w-full text-xs">
              <thead className="bg-[#e8e8e8] border-b border-gray-300">
                <tr>
                  <th className="px-2 py-1 text-left font-semibold border-r border-gray-300 w-36">Трасса</th>
                  <th className="px-2 py-1 text-left font-semibold border-r border-gray-300">Профиль</th>
                  <th className="px-2 py-1 text-left font-semibold">Тип. сечение</th>
                </tr>
              </thead>
              <tbody>
                {def.rows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-200 hover:bg-blue-50">
                    <td className="px-1 py-0.5 border-r border-gray-200">
                      <select value={row.alignment} onChange={e => updateRow(i, "alignment", e.target.value)}
                        className="w-full bg-transparent text-xs outline-none">
                        {["Трасса ШД-38","Ул. Трумана","*Нет*"].map(a => <option key={a}>{a}</option>)}
                      </select>
                    </td>
                    <td className="px-1 py-0.5 border-r border-gray-200">
                      <select value={row.profile} onChange={e => updateRow(i, "profile", e.target.value)}
                        className="w-full bg-transparent text-xs outline-none">
                        {(PROFILES[row.alignment] || ["*None*"]).map(p => <option key={p}>{p}</option>)}
                      </select>
                    </td>
                    <td className="px-1 py-0.5">
                      <select value={row.assembly} onChange={e => updateRow(i, "assembly", e.target.value)}
                        className="w-full bg-transparent text-xs outline-none">
                        {ASSEMBLIES.map(a => <option key={a}>{a}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Feature lines */}
          <div className="border border-gray-400 bg-white">
            <div className="bg-[#d0d0d0] px-2 py-1 flex items-center gap-2 font-bold text-xs border-b border-gray-400">
              <span className="text-blue-600 cursor-pointer">▼</span> Характерные линии
              <span className="ml-auto text-gray-500">Фильтр выбора</span>
            </div>
            <div className="flex items-center gap-1 bg-[#e8e8e8] border-b border-gray-300 text-xs font-semibold px-2 py-0.5">
              <span className="flex-1">Хар. линия</span>
              <span className="w-40">Тип. сечение</span>
            </div>
            <div className="max-h-40 overflow-y-auto">
              {def.features.map(f => (
                <div key={f.name} onClick={() => setSelFeature(f.name)}
                  className={`flex items-center gap-1 px-2 py-0.5 text-xs cursor-pointer border-b border-gray-100 relative ${selFeature === f.name ? "bg-blue-600 text-white" : "hover:bg-blue-50"}`}>
                  <span className="flex-1 truncate">{f.name}</span>
                  <div className="w-40 flex items-center gap-1 relative">
                    <span className="flex-1 truncate">{f.assembly}</span>
                    <button
                      className={`text-[10px] px-1 border ${selFeature === f.name ? "border-blue-300 bg-blue-700" : "border-gray-300 bg-[#e8e8e8]"}`}
                      onClick={e => { e.stopPropagation(); setFeatureDropdown(featureDropdown === f.name ? null : f.name) }}
                    >▾</button>
                    {featureDropdown === f.name && (
                      <div className="absolute top-5 right-0 z-50 bg-white border border-gray-400 shadow-xl min-w-36" style={{ color: "#333" }}>
                        {ASSEMBLIES.map(a => (
                          <div key={a} onClick={() => updateFeature(f.name, a)}
                            className={`px-3 py-1 text-xs cursor-pointer hover:bg-blue-600 hover:text-white ${f.assembly === a ? "bg-blue-500 text-white" : ""}`}>
                            {a}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checkbox */}
          <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
            <input type="checkbox" defaultChecked className="accent-blue-600" />
            Задать параметры базовой линии и области
          </label>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => onOK(def)}
              className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0] active:bg-gray-300">
              ОК
            </button>
            <button onClick={onClose}
              className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">
              Отмена
            </button>
            <button className="px-6 py-1 bg-[#e0e0e0] border border-gray-500 text-xs font-semibold hover:bg-[#d0d0d0]">
              Справка
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Cross Section Panel ─────────────────────────────────────────────────────

function CrossSectionPanel({ alignments, onClose }: { alignments: string[]; onClose?: () => void }) {
  const [minimized, setMinimized] = useState(false)
  const canvases = alignments.slice(0, 3)
  return (
    <div className="bg-[#1a1a2e] border-l border-gray-700 w-72 flex flex-col overflow-hidden">
      <div className="bg-[#252540] px-2 py-1 flex items-center justify-between border-b border-gray-700">
        <span className="text-gray-300 text-xs font-mono">Виды поперечников</span>
        <div className="flex gap-1">
          <button onClick={() => setMinimized(m => !m)} className="text-gray-400 hover:text-white text-xs px-1" title="Свернуть">─</button>
          <button onClick={() => setMinimized(false)} className="text-gray-400 hover:text-white text-xs px-1" title="Развернуть">□</button>
          <button onClick={onClose} className="text-gray-400 hover:text-red-400 text-xs px-1" title="Закрыть">✕</button>
        </div>
      </div>
      {minimized && <div className="flex-1 flex items-center justify-center text-xs text-gray-600 cursor-pointer" onClick={() => setMinimized(false)}>Панель свёрнута — нажмите □ чтобы развернуть</div>}
      {!minimized && <div className="flex-1 overflow-y-auto divide-y divide-gray-800">
        {(canvases.length ? canvases : ["Трасса ШД-38","Ул. Трумана"]).map((name, i) => (
          <CrossSectionView key={name} name={name} index={i} />
        ))}
        <div className="p-3 text-center">
          <div className="text-[#06b6d4] text-xs font-mono font-bold border border-[#06b6d4] px-3 py-1 inline-block">БОРДЮР ПЕРИМЕТРА</div>
          <CrossSectionView name="Бордюр периметра" index={2} />
          <div className="text-[#06b6d4] text-xs font-mono mt-1">V-ОБРАЗНЫЙ ЛОТОК</div>
        </div>
      </div>}
    </div>
  )
}

function CrossSectionView({ name, index }: { name: string; index: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    c.width = c.offsetWidth || 240; c.height = 80
    const ctx = c.getContext("2d")!
    const W = c.width, H = c.height
    ctx.fillStyle = "#1a1a2e"; ctx.fillRect(0, 0, W, H)
    // axes
    ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 0.5
    ctx.beginPath(); ctx.moveTo(10, H-10); ctx.lineTo(W-10, H-10); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(W/2, 5); ctx.lineTo(W/2, H-10); ctx.stroke()
    // profile shape
    const colors = ["#f97316","#a855f7","#06b6d4"]
    const color = colors[index % 3]
    ctx.strokeStyle = color; ctx.lineWidth = 1.5
    const pts: [number,number][] = []
    if (index === 0) pts.push(...[[10,65],[40,65],[55,50],[70,45],[W/2,42],[W/2+10,44],[W-55,50],[W-40,65],[W-10,65]] as [number,number][])
    else if (index === 1) pts.push(...[[10,60],[35,60],[50,52],[W/2-5,48],[W/2+5,48],[W-50,52],[W-35,60],[W-10,60]] as [number,number][])
    else pts.push(...[[10,62],[W/2-30,55],[W/2,50],[W/2+30,55],[W-10,62]] as [number,number][])
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1])
    pts.slice(1).forEach(p => ctx.lineTo(p[0], p[1])); ctx.stroke()
    // fill
    ctx.beginPath(); ctx.moveTo(pts[0][0], H-10)
    pts.forEach(p => ctx.lineTo(p[0], p[1]))
    ctx.lineTo(pts[pts.length-1][0], H-10); ctx.closePath()
    ctx.fillStyle = color + "30"; ctx.fill()
    // label
    ctx.fillStyle = color; ctx.font = "bold 9px monospace"; ctx.textAlign = "center"
    ctx.fillText(name.toUpperCase(), W/2, 14)
    ctx.textAlign = "left"
    // tick marks
    ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 0.5
    for (let x = 20; x < W; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, H-10); ctx.lineTo(x, H-6); ctx.stroke()
    }
  }, [name, index])
  return <canvas ref={ref} className="w-full" style={{ height: 80 }} />
}

// ─── Main CivilCAD Module ────────────────────────────────────────────────────

export default function CivilCADModule() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [treeData, setTreeData] = useState<TreeNode[]>(TREE)
  const [selectedNode, setSelectedNode] = useState<string | null>("c1")
  const [visLayers, setVisLayers] = useState({ surfaces: true, alignments: true, corridors: true, pipenet: true, points: true, grid: true, sites: true })
  const [viewMode, setViewMode] = useState("wireframe")
  const [zoom, setZoom] = useState(1.1)
  const [pan, setPan] = useState({ x: 30, y: 20 })
  const drag = useRef<{ x: number; y: number } | null>(null)
  const [showCorridor, setShowCorridor] = useState(false)
  const [corridors, setCorridors] = useState<string[]>(["Дорога и парковочная зона"])
  const [activeMenuTab, setActiveMenuTab] = useState("Home")
  const [activeLayout, setActiveLayout] = useState("Model")
  const [cursorCoords, setCursorCoords] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState("1:500")
  const [showRightPanel, setShowRightPanel] = useState(true)
  const [statusMsg, setStatusMsg] = useState("Выберите трассу: <Отмена>*")
  const [commandLine, setCommandLine] = useState("")
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [showSurface, setShowSurface] = useState(false)
  const [showAlignment, setShowAlignment] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpenDropdown(null)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const toggleNode = (id: string) => {
    const toggle = (nodes: TreeNode[]): TreeNode[] =>
      nodes.map(n => n.id === id ? { ...n, expanded: !n.expanded } : { ...n, children: n.children ? toggle(n.children) : undefined })
    setTreeData(toggle)
  }

  const draw = useCallback(() => {
    const c = canvasRef.current; if (!c || c.width < 10) return
    const ctx = c.getContext("2d")!
    drawCanvas(ctx, c.width, c.height, visLayers, zoom, pan.x, pan.y, viewMode)
  }, [visLayers, zoom, pan, viewMode])

  useEffect(() => {
    const c = canvasRef.current; if (!c) return
    const ro = new ResizeObserver(() => { c.width = c.offsetWidth; c.height = c.offsetHeight; draw() })
    ro.observe(c); c.width = c.offsetWidth; c.height = c.offsetHeight; draw()
    return () => ro.disconnect()
  }, [draw])

  useEffect(() => { draw() }, [draw])

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    setZoom(z => Math.max(0.3, Math.min(6, z * (e.deltaY < 0 ? 1.12 : 0.9))))
  }
  const onMouseDown = (e: React.MouseEvent) => { drag.current = { x: e.clientX, y: e.clientY } }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y
    drag.current = { x: e.clientX, y: e.clientY }
    setPan(p => ({ x: p.x + dx, y: p.y + dy }))
  }
  const onMouseUp = () => { drag.current = null }

  const runCommand = (cmd: string) => {
    const c = cmd.trim().toUpperCase()
    if (c === "КОРИДОР" || c === "CORRIDOR") setShowCorridor(true)
    else if (c === "ПОВЕРХНОСТЬ" || c === "SURFACE" || c === "TIN") setShowSurface(true)
    else if (c === "ТРАССА" || c === "ALIGNMENT") setShowAlignment(true)
    else if (c === "ПРОФИЛЬ" || c === "PROFILE") setShowProfile(true)
    else if (c === "ZOOM E" || c === "ВПИСАТЬ") { setZoom(1.1); setPan({ x: 30, y: 20 }) }
    else if (c === "REGEN" || c === "РЕГЕН") draw()
    setStatusMsg(`Команда: ${cmd}`)
    setCommandLine("")
  }

  const toggleLayer = (key: keyof typeof visLayers) => setVisLayers(v => ({ ...v, [key]: !v[key] }))

  const openDialog = (key: string) => {
    setOpenDropdown(null)
    if (key.includes("Коридор") || key.includes("коридор")) { setShowCorridor(true) }
    else if (key.includes("Поверхност") || key.includes("TIN") || key.includes("Grid") || key.includes("поверхност")) { setShowSurface(true) }
    else if (key.includes("Трасс") || key.includes("трасс")) { setShowAlignment(true) }
    else if (key.includes("Профиль") || key.includes("профиль") || key.includes("рельеф") || key.includes("Профиль из")) { setShowProfile(true) }
  }

  const handleToolbarItem = (item: string) => {
    openDialog(item)
    setStatusMsg(`Активировано: ${item.replace(" ▾","")}`)
  }

  const handleDropdownItem = (parent: string, sub: string) => {
    openDialog(parent + " " + sub)
    setStatusMsg(`${parent.replace(" ▾","")}: ${sub}`)
  }

  const currentToolbar = TOOLBAR_BY_MENU[activeMenuTab] || TOOLBAR_BY_MENU["Home"]

  return (
    <div className="flex flex-col bg-[#1e1e2e] text-gray-200 rounded-xl overflow-hidden border border-gray-700" style={{ height: "calc(100vh - 160px)", minHeight: 620, fontFamily: "Arial, sans-serif", fontSize: 12 }}>

      {/* ── Title bar ── */}
      <div className="bg-[#1a1a2a] border-b border-gray-800 flex items-center px-2 py-0.5 gap-2 flex-shrink-0" style={{minHeight:24}}>
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 bg-[#0078d4] flex items-center justify-center text-white font-bold text-[10px] rounded-sm">C</div>
        </div>
        <div className="flex items-center gap-1 ml-1">
          {["🗁","💾","↩","↪"].map((ic,i)=>(
            <button key={i} className="text-gray-400 hover:text-white text-xs px-0.5 py-0.5">{ic}</button>
          ))}
        </div>
        <select className="bg-[#2d2d4e] border border-gray-600 text-[10px] text-gray-300 px-1 py-0.5 ml-1" style={{maxWidth:100}}>
          <option>Civil 3D</option>
        </select>
        <div className="flex-1 text-center text-[11px] text-gray-400 font-semibold tracking-wide select-none">
          Autodesk Civil 3D 2026 — Главная_парковка.dwg [Только чтение]
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <input placeholder="Введите ключевое слово или фразу" className="bg-[#2a2a3a] border border-gray-600 text-[10px] text-gray-400 px-2 py-0.5 w-44 rounded-sm placeholder-gray-600 outline-none focus:border-blue-500" />
          <span className="text-[10px] text-gray-500 ml-1">пользователь</span>
        </div>
      </div>

      {/* ── Menu bar (ribbon tabs) ── */}
      <div className="bg-[#2d2d3d] border-b border-gray-700 flex items-center gap-0 overflow-x-auto flex-shrink-0">
        {MENU_ITEMS.map(m => (
          <button key={m} onClick={() => { setActiveMenuTab(m); setStatusMsg(`Лента: ${m}`) }}
            className={`px-3 py-1.5 text-xs whitespace-nowrap transition-colors border-b-2 ${activeMenuTab === m ? "border-[#0078d4] bg-[#252535] text-white" : "border-transparent text-gray-400 hover:bg-gray-700 hover:text-white"}`}>
            {m}
          </button>
        ))}
      </div>

      {/* ── Ribbon toolbar ── */}
      <div ref={dropdownRef} className="bg-[#252535] border-b border-gray-700 flex items-end gap-0 overflow-x-auto flex-shrink-0 relative">
        {currentToolbar.map(group => (
          <div key={group.label} className="flex flex-col items-start border-r border-gray-700 px-2 py-1">
            <div className="flex gap-1 flex-wrap">
              {group.items.map(item => {
                const hasDropdown = item.endsWith("▾") && DROPDOWN_ITEMS[item]
                return (
                  <div key={item} className="relative">
                    <button
                      onClick={() => {
                        if (hasDropdown) {
                          setOpenDropdown(openDropdown === item ? null : item)
                        } else {
                          handleToolbarItem(item)
                        }
                      }}
                      className={`px-2 py-0.5 text-xs rounded transition-colors whitespace-nowrap ${openDropdown === item ? "bg-[#0078d4] text-white" : "text-gray-300 hover:bg-gray-600 hover:text-white"}`}>
                      {item}
                    </button>
                    {hasDropdown && openDropdown === item && (
                      <div className="absolute top-full left-0 z-50 bg-[#2d2d3d] border border-gray-600 shadow-xl min-w-[180px] py-1 rounded">
                        {DROPDOWN_ITEMS[item].map(sub => (
                          <button key={sub} onClick={() => handleDropdownItem(item, sub)}
                            className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-[#0078d4] hover:text-white transition-colors whitespace-nowrap">
                            {sub}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <span className="text-[9px] text-gray-500 mt-0.5">{group.label}</span>
          </div>
        ))}
      </div>

      {/* ── Drawing tab bar ── */}
      <div className="bg-[#252535] border-b border-gray-700 flex items-center gap-0 px-1 py-0" style={{minHeight:22}}>
        <span className="text-[9px] text-gray-500 px-2">[-]</span>
        <div className="flex items-center gap-0">
          <button className="bg-[#1e1e2e] border-t border-l border-r border-gray-600 px-3 py-0.5 text-[10px] text-blue-300 flex items-center gap-1 border-b-0">
            <Icon name="FileText" size={9} /> Intro-1
            <span className="ml-1 text-gray-500 hover:text-white text-[9px]">✕</span>
          </button>
          <button className="text-gray-500 hover:text-white px-2 py-0.5 text-[10px]">+</button>
        </div>
      </div>

      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: Toolbox strip ── */}
        <div className="bg-[#252535] border-r border-gray-700 w-6 flex flex-col items-center py-1 gap-1">
          {["MousePointer2","Move","ZoomIn","RotateCcw","Layers","Settings"].map(ic => (
            <button key={ic} className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-600 rounded">
              <Icon name={ic} size={12} fallback="Square" />
            </button>
          ))}
        </div>

        {/* ── Left: Toolspace / Tree ── */}
        <div className="bg-[#1a1a2e] border-r border-gray-700 w-44 flex flex-col overflow-hidden flex-shrink-0">
          {/* Toolspace header */}
          <div className="bg-[#252540] px-2 py-0.5 flex items-center justify-between border-b border-gray-700">
            <span className="text-[9px] text-gray-300 font-bold tracking-wide uppercase">TOOLSPACE</span>
            <div className="flex gap-0.5">
              {["📋","📁","🔍","❓"].map((ic,i)=>(
                <button key={i} className="text-[9px] text-gray-500 hover:text-white w-4 h-4 flex items-center justify-center">{ic}</button>
              ))}
            </div>
          </div>
          {/* Prospector / Settings tabs */}
          <div className="flex border-b border-gray-700">
            {["Диспетчер","Параметры"].map(t=>(
              <button key={t} className="flex-1 text-[9px] py-0.5 bg-[#1e1e2e] text-gray-400 hover:bg-[#2d2d4e] hover:text-white border-r border-gray-700 last:border-0 transition-colors">
                {t}
              </button>
            ))}
          </div>
          {/* Active Drawing label */}
          <div className="bg-[#1e1e30] px-2 py-0.5 flex items-center gap-1 border-b border-gray-700">
            <span className="text-[9px] text-blue-400 font-semibold">Активный чертёж</span>
            <Icon name="ChevronDown" size={9} className="text-gray-500 ml-auto" />
          </div>
          {/* Layer toggles */}
          <div className="flex gap-1 px-1.5 py-1 border-b border-gray-700 flex-wrap">
            {(Object.keys(visLayers) as (keyof typeof visLayers)[]).map(k => (
              <button key={k} onClick={() => toggleLayer(k)}
                className={`text-[8px] px-1 py-0.5 rounded transition-colors ${visLayers[k] ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-400"}`}>
                {k}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {treeData.map(node => (
              <TreeItem key={node.id} node={node} depth={0} selected={selectedNode}
                onSelect={setSelectedNode} onToggle={toggleNode} />
            ))}
          </div>
        </div>

        {/* ── Side tabs ── */}
        <div className="bg-[#1e1e2e] border-r border-gray-700 w-4 flex flex-col items-center py-4 gap-4">
          {["Диспетчер","Параметры","Геодезия","Инструменты"].map(t => (
            <div key={t} onClick={() => setStatusMsg(`Панель: ${t}`)}
              className="text-[8px] text-gray-600 hover:text-gray-300 cursor-pointer active:text-blue-400 transition-colors"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>{t}</div>
          ))}
        </div>

        {/* ── Centre: Viewport ── */}
        <div className="flex-1 relative overflow-hidden bg-[#1a1a2e]"
          onMouseMove={e => {
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
            const mx = (e.clientX - rect.left - pan.x) / zoom
            const my = (e.clientY - rect.top - pan.y) / zoom
            setCursorCoords({ x: Math.round(mx * 10)/10, y: Math.round(my * 10)/10 })
          }}>
          {/* viewport toolbar — Civil 3D style */}
          <div className="absolute top-0 left-0 z-10 flex items-center gap-0 bg-black/40 border-b border-gray-800">
            <button onClick={() => setStatusMsg("Меню видового экрана")}
              className="text-[10px] text-gray-300 hover:bg-gray-700 px-1.5 py-0.5 border-r border-gray-700">[-]</button>
            <button onClick={() => setStatusMsg("Вид сверху")}
              className="text-[10px] text-gray-300 hover:bg-gray-700 px-2 py-0.5 border-r border-gray-700">[Сверху]</button>
            <button onClick={() => setViewMode(m => m === "wireframe" ? "shaded" : "wireframe")}
              className="text-[10px] text-gray-300 hover:bg-gray-700 px-2 py-0.5">
              [{viewMode === "wireframe" ? "2D Каркас" : "Тонирование"}]
            </button>
          </div>
          {/* Viewport compass (top-right) */}
          <div className="absolute top-1 right-2 z-10 select-none pointer-events-none">
            <svg width="52" height="52" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="24" fill="rgba(0,0,0,0.35)" stroke="#555" strokeWidth="1"/>
              <text x="26" y="10" textAnchor="middle" fill="#aaa" fontSize="7" fontWeight="bold">N</text>
              <text x="26" y="47" textAnchor="middle" fill="#aaa" fontSize="7" fontWeight="bold">S</text>
              <text x="6" y="29" textAnchor="middle" fill="#aaa" fontSize="7" fontWeight="bold">W</text>
              <text x="46" y="29" textAnchor="middle" fill="#aaa" fontSize="7" fontWeight="bold">E</text>
              <rect x="16" y="16" width="20" height="20" rx="3" fill="#0078d4" opacity="0.85"/>
              <text x="26" y="30" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">ПЛАН</text>
              <line x1="26" y1="12" x2="26" y2="17" stroke="#888" strokeWidth="1"/>
              <line x1="26" y1="35" x2="26" y2="40" stroke="#888" strokeWidth="1"/>
              <line x1="10" y1="26" x2="15" y2="26" stroke="#888" strokeWidth="1"/>
              <line x1="37" y1="26" x2="42" y2="26" stroke="#888" strokeWidth="1"/>
            </svg>
          </div>
          {/* Scale / zoom controls top-right corner */}
          <div className="absolute top-1 right-14 z-10 flex items-center gap-1">
            <button onClick={() => { setZoom(1.1); setPan({ x: 30, y: 20 }) }} className="text-[9px] text-gray-400 hover:text-white bg-black/30 px-1 py-0.5 rounded">Вписать</button>
            <button onClick={() => setZoom(z => z * 1.25)} className="text-[9px] text-gray-400 hover:text-white bg-black/30 px-1.5 py-0.5 rounded">+</button>
            <button onClick={() => setZoom(z => z * 0.8)} className="text-[9px] text-gray-400 hover:text-white bg-black/30 px-1.5 py-0.5 rounded">−</button>
            <button onClick={() => setShowRightPanel(s => !s)} className="text-[9px] text-gray-400 hover:text-white bg-black/30 px-1 py-0.5 rounded">
              <Icon name={showRightPanel ? "PanelRightClose" : "PanelRightOpen"} size={11} />
            </button>
          </div>

          <canvas ref={canvasRef} className="w-full h-full block"
            style={{ cursor: drag.current ? "grabbing" : "crosshair" }}
            onWheel={onWheel} onMouseDown={onMouseDown} onMouseMove={onMouseMove}
            onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
            onContextMenu={e => e.preventDefault()}
            onDoubleClick={() => setShowCorridor(true)} />

          {/* Dialogs */}
          <AnimatePresence>
            {showCorridor && (
              <CorridorDialog
                onClose={() => setShowCorridor(false)}
                onOK={def => {
                  setCorridors(prev => prev.includes(def.name) ? prev : [...prev, def.name])
                  setShowCorridor(false)
                  setStatusMsg(`Коридор «${def.name}» успешно создан`)
                }}
              />
            )}
            {showSurface && (
              <SurfaceDialog
                onClose={() => setShowSurface(false)}
                onOK={def => {
                  setShowSurface(false)
                  setStatusMsg(`Поверхность «${def.name}» (${def.type}) создана`)
                  setTreeData(prev => {
                    const add = (nodes: TreeNode[]): TreeNode[] => nodes.map(n => {
                      if (n.id === "surfaces") return { ...n, children: [...(n.children||[]), { id: `surf_${Date.now()}`, label: def.name, icon: "Triangle", color: "#4ade80" }] }
                      return { ...n, children: n.children ? add(n.children) : undefined }
                    })
                    return add(prev)
                  })
                }}
              />
            )}
            {showAlignment && (
              <AlignmentDialog
                onClose={() => setShowAlignment(false)}
                onOK={def => {
                  setShowAlignment(false)
                  setStatusMsg(`Трасса «${def.name}» создана, длина ${def.elements.reduce((s,e)=>s+(parseFloat(e.length)||0),0).toFixed(0)} м`)
                  setTreeData(prev => {
                    const add = (nodes: TreeNode[]): TreeNode[] => nodes.map(n => {
                      if (n.id === "alignments") return { ...n, children: [...(n.children||[]), { id: `al_${Date.now()}`, label: def.name, icon: "Minus", color: "#f97316" }] }
                      return { ...n, children: n.children ? add(n.children) : undefined }
                    })
                    return add(prev)
                  })
                }}
              />
            )}
            {showProfile && (
              <ProfileDialog
                onClose={() => setShowProfile(false)}
                onOK={def => {
                  setShowProfile(false)
                  setStatusMsg(`Профиль «${def.name}» создан для трассы ${def.alignment}`)
                }}
                alignments={["Трасса ШД-38","Ул. Трумана","Бордюр периметра"]}
              />
            )}
          </AnimatePresence>
        </div>

        {/* ── Right: Section views ── */}
        {showRightPanel && <CrossSectionPanel alignments={corridors} onClose={() => setShowRightPanel(false)} />}
      </div>

      {/* ── Command line ── */}
      <div className="bg-[#0f0f1e] border-t border-gray-700 flex flex-col flex-shrink-0">
        <div className="px-3 py-0.5 text-[10px] text-gray-400 font-mono border-b border-gray-800">{statusMsg}</div>
        <div className="flex items-center gap-1 px-2 py-0.5">
          <span className="text-[10px] text-gray-600 font-mono select-none">⚡</span>
          <input
            value={commandLine}
            onChange={e => setCommandLine(e.target.value)}
            onKeyDown={e => e.key === "Enter" && runCommand(commandLine)}
            placeholder="Введите команду  (ПОВЕРХНОСТЬ, ТРАССА, ПРОФИЛЬ, КОРИДОР, ZOOM E)"
            className="flex-1 bg-transparent text-[11px] text-green-300 font-mono outline-none placeholder-gray-700 px-2"
          />
          <button onClick={() => runCommand(commandLine)} className="text-[10px] text-gray-500 hover:text-white px-2">↵</button>
        </div>
      </div>

      {/* ── Status bar (Civil 3D bottom bar) ── */}
      <div className="bg-[#1a1a2a] border-t border-gray-800 flex items-center px-1 gap-0 flex-shrink-0" style={{minHeight:22}}>
        {/* Layout tabs */}
        <div className="flex items-center gap-0 border-r border-gray-700 pr-1 mr-1">
          <button onClick={() => setStatusMsg("Главная парковка_Финал")}
            className="text-[9px] text-gray-400 hover:text-white px-0.5 py-0.5">☰</button>
          {[{key:"Model",label:"Модель"},{key:"Layout1",label:"Лист 1"},{key:"Layout2",label:"Лист 2"}].map(t => (
            <button key={t.key} onClick={() => { setActiveLayout(t.key); setStatusMsg(`Макет: ${t.label}`) }}
              className={`text-[9px] px-2 py-0.5 border-x border-gray-700 transition-colors ${activeLayout===t.key?"bg-[#2d2d4e] text-white":"text-gray-500 hover:text-white hover:bg-[#252535]"}`}>
              {t.label}
            </button>
          ))}
          <button onClick={() => setStatusMsg("Новый лист")}
            className="text-[9px] text-gray-500 hover:text-white px-1.5 py-0.5">+</button>
        </div>
        {/* Center status icons */}
        <div className="flex items-center gap-1 text-[9px] text-gray-500 flex-1">
          <span className={`font-bold px-1 ${activeLayout==="Model"?"text-white bg-[#0078d4]":"text-gray-400"}`}>
            {activeLayout==="Model"?"МОДЕЛЬ":"ЛИСТ"}
          </span>
          <button onClick={() => setScale(s=>s==="1:500"?"1:1000":s==="1:1000"?"1:200":"1:500")}
            className="hover:text-white px-1 border border-gray-700 text-[9px]">{scale}</button>
          {["⊞","∠","⚙"].map((ic,i)=>(
            <button key={i} className="hover:text-white px-0.5">{ic}</button>
          ))}
        </div>
        {/* Cursor coordinates right */}
        <div className="flex items-center gap-2 text-[9px] font-mono text-gray-500 border-l border-gray-700 pl-2">
          <span className="text-gray-400">{cursorCoords.x.toFixed(2)}, {cursorCoords.y.toFixed(2)}, 0.00</span>
          <span className="text-gray-600">МОДЕЛЬ</span>
        </div>
      </div>
    </div>
  )
}