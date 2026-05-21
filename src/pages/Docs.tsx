import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import Icon from "@/components/ui/icon"

// ─── Содержимое документации ──────────────────────────────────────────────────

const DOCS: {
  id: string
  icon: string
  title: string
  desc: string
  color: string
  sections: { title: string; content: string; code?: string; tip?: string }[]
}[] = [
  {
    id: "quickstart",
    icon: "Play",
    title: "Быстрый старт",
    desc: "Создание первого проекта",
    color: "#0078d4",
    sections: [
      {
        title: "Добро пожаловать в ЛАПА 3D",
        content: `ЛАПА 3D — профессиональная система автоматизированного проектирования для инженеров-дорожников, геодезистов и проектировщиков. Программа полностью работает в браузере без установки.

Профессиональная CAD/BIM-система, реализованная на русском языке с поддержкой всех отечественных норм (СП, ГОСТ).`,
      },
      {
        title: "Шаг 1 — Войти в систему",
        content: `Откройте страницу входа. Введите логин и пароль. После авторизации вы попадёте на главный экран — стартовую страницу с последними файлами.`,
        tip: "Для демо-доступа используйте любой email и пароль.",
      },
      {
        title: "Шаг 2 — Создать новый проект",
        content: `На стартовом экране нажмите кнопку «Создать…» в левой боковой панели. Выберите шаблон проекта:
• Автодорога (СП 34) — трасса, профиль, коридор
• Инженерные сети — водопровод, канализация, теплосеть
• Геодезические изыскания — точки COGO, ЦМР
• Генплан участка — площадной объект, ТЭП
• Железная дорога — путь, CANT, профиль
• BIM-проект — IFC-модель, коллизии

Введите название проекта и нажмите «Создать».`,
      },
      {
        title: "Шаг 3 — Выбрать нужный модуль",
        content: `В левой боковой панели перечислены все 18 модулей программы. Кликните на нужный для начала работы. Вы также можете открыть ЛАПА — Редактор для работы в полноценном CAD-интерфейсе.`,
      },
      {
        title: "Шаг 4 — Сохранить и экспортировать",
        content: `В каждом модуле есть вкладка «Экспорт» с кнопками для скачивания данных в форматах:
LandXML, DXF/DWG, IFC, CSV, Excel, TXT-отчёт.

Кнопка 💾 в верхней панели сохраняет проект в базу данных. Открыть сохранённые проекты можно через кнопку 🗁 или «Открыть…».`,
        tip: "Все форматы открываются в nanoCAD, КОМПАС, QGIS и других совместимых программах.",
      },
    ],
  },
  {
    id: "dtm",
    icon: "Mountain",
    title: "Работа с ЦМР",
    desc: "LiDAR, GNSS, TIN-поверхности",
    color: "#059669",
    sections: [
      {
        title: "Что такое ЦМР?",
        content: `ЦМР (Цифровая Модель Рельефа) — математическое представление земной поверхности в виде набора точек с координатами X, Y, Z или в виде TIN-сети (триангуляционной нерегулярной сети).

ЛАПА 3D поддерживает все современные методы получения исходных данных.`,
      },
      {
        title: "Источники данных",
        content: `• Электронный тахеометр — файлы .raw, .gsi, .job
• GNSS / RTK — файлы .csv, .pos
• Наземный LiDAR — файлы .las, .laz
• Воздушный LiDAR — аэролазерное сканирование .las
• Кинематическое сканирование — мобильные комплексы
• Батиметрическое — гидрографические данные .xyz
• БПЛА / Фотограмметрия — SfM-облака точек
• ГИС-данные — SRTM, OpenTopography, DEM`,
      },
      {
        title: "Импорт данных",
        content: `1. Откройте модуль «ЦМР / Облако точек» из списка модулей
2. На вкладке «Источники данных» выберите тип источника
3. Нажмите кнопку «Загрузить данные» или кликните на нужный источник
4. Выберите файл в открывшемся диалоге
5. Данные автоматически загрузятся и отобразятся на вкладке «Облако точек»`,
        tip: "Поддерживаемые форматы: .csv, .txt, .las, .laz, .xml, .dem, .tif",
      },
      {
        title: "Режимы отображения облака точек",
        content: `• Высоты — градиент от синего (низкие) до красного (высокие)
• Интенсивность — яркость отражённого сигнала лазера
• Классификация — цвет по классам (земля, растительность, здания)
• Уклоны — зелёный <3%, жёлтый 3-8%, оранжевый 8-15%, красный >15%
• Экспозиция — ориентация склонов по сторонам света
• Горизонтали — изолинии рельефа
• TIN-сетка — рёбра триангуляции`,
      },
      {
        title: "Построение ЦМР",
        content: `1. Загрузите исходные данные
2. Перейдите на вкладку «Построение ЦМР»
3. Выберите метод интерполяции:
   — TIN (триангуляция Делоне) — рекомендуется для геодезических данных
   — IDW (обратные расстояния) — быстрый универсальный метод
   — Крайгинг — геостатистический, наиболее точный
4. Задайте шаг сетки (0.5–5 м)
5. Включите фильтрацию шума и удаление растительности при необходимости
6. Нажмите «Построить ЦМР»`,
        tip: "Для дорожных проектов рекомендуется шаг 0.5–1 м, для площадных — 1–2 м.",
      },
      {
        title: "Экспорт ЦМР",
        content: `На вкладке «Отчёт и экспорт» доступны форматы:
• LandXML — для CAD/BIM-систем, ЛАПА 3D
• DEM / GeoTIFF — растровая ЦМР для ГИС-систем
• CSV — таблица координат точек (X,Y,Z,класс)
• Shapefile — векторный формат для ArcGIS/QGIS
• LAS / LAZ — облако точек для передачи другим специалистам`,
      },
    ],
  },
  {
    id: "roads",
    icon: "Route",
    title: "Трассы и коридоры",
    desc: "СП 34, поперечники, объёмы",
    color: "#d97706",
    sections: [
      {
        title: "Проектирование трассы",
        content: `Трасса — горизонтальное положение дороги в плане. Для проектирования откройте модуль «Дороги и трассы» или «Профили и выравнивания».

Параметры трассы задаются согласно СП 34.13330.2021:
• Категория дороги (Ia, Ib, II, III, IV)
• Расчётная скорость
• Минимальный радиус кривой
• Максимальный продольный уклон`,
      },
      {
        title: "Категории дорог по СП 34",
        content: `Ia — Автомагистраль: V=150 км/ч, B=27.5 м, 4 полосы, Rmin=1200 м
Ib — Скоростная: V=120 км/ч, B=21.5 м, 4 полосы, Rmin=800 м
II — Региональная: V=100 км/ч, B=15 м, 2 полосы, Rmin=600 м
III — Областная: V=80 км/ч, B=12 м, 2 полосы, Rmin=300 м
IV — Местная: V=60 км/ч, B=8 м, 2 полосы, Rmin=150 м`,
        code: "Проверка: Радиус ≥ Rmin, Уклон ≤ imax, Видимость ≥ Smin",
      },
      {
        title: "Горизонтальные кривые и клотоиды",
        content: `На вкладке «Горизонтальное» модуля «Профили и выравнивания» добавьте кривые:
1. Нажмите «Добавить» в таблице горизонтальных кривых
2. Укажите: пикет НКК, радиус R, угол поворота Δ, направление
3. Клотоидные параметры рассчитываются автоматически (вкладка «Переходные кривые»)
4. Проверка норм СП 34 — в колонке «Статус»

Параметр клотоиды: A = √(R × Ls)`,
        tip: "Минимальная длина переходной кривой определяется из условия 1/3 ≤ Ls/Lk ≤ 1.",
      },
      {
        title: "Продольный профиль",
        content: `Профиль — вертикальное сечение дороги по оси. Настройка:
1. Перейдите на вкладку «Вертикальное выравнивание»
2. Добавьте вертикальные точки перелома (ВПП) с пикетом и отметкой
3. Задайте длину вертикальной кривой (VCL)
4. График профиля обновляется автоматически

Параметры ВК:
• Выпуклая: K = R, T = V²/800 (по СП 34)
• Вогнутая: K = R, T = V²/400`,
      },
      {
        title: "Коридор и поперечные сечения",
        content: `Коридор — 3D-модель дорожного земляного полотна. Для создания:
1. Откройте модуль «Коридоры и поперечники»
2. Выберите шаблон Assembly (типовое сечение)
3. Задайте параметры: длину, шаг сечений (20 м), уклоны откосов
4. Укажите целевые поверхности
5. Нажмите «Построить коридор»

Результат: автоматически рассчитываются поперечники и объёмы земляных работ.`,
      },
      {
        title: "Объёмы земляных работ",
        content: `Объёмы рассчитываются по методу призматоидов на каждом пикете:
• Площадь поперечника в выемке × шаг = объём выемки
• Площадь поперечника в насыпи × шаг = объём насыпи

На вкладке «Объёмы» коридора:
• График выемки/насыпи по пикетам
• Накопленный баланс земляных масс
• Ведомость материалов (асфальт, щебень, песок)
• Экспорт в CSV, LandXML`,
        tip: "Оптимальное расстояние транспортировки определяется по кривой масс Брюкнера.",
      },
    ],
  },
  {
    id: "networks",
    icon: "Network",
    title: "Инженерные сети",
    desc: "Гидравлика, коллизии",
    color: "#0284c7",
    sections: [
      {
        title: "Типы инженерных сетей",
        content: `ЛАПА 3D поддерживает проектирование следующих сетей:
• Водопровод — напорные трубопроводы
• Канализация — самотёчные и напорные
• Ливневая канализация — водоотведение с территории
• Теплосеть — тепловые сети 2×Ø
• Электрические сети — кабели и воздушные линии

Откройте модуль «Инженерные сети» для начала работы.`,
      },
      {
        title: "Добавление трубопровода",
        content: `На вкладке «Трубопроводы»:
1. Заполните форму: «От» (узел начала), «До» (узел конца)
2. Укажите длину участка (м)
3. Выберите диаметр (мм) и материал
4. Задайте расход Q (л/с) и уклон i
5. Нажмите «Добавить участок»

Материалы: ПВХ, Сталь, Чугун, Железобетон, HDPE`,
        code: "Скорость: v = Q / (π × d² / 4)\nПотери: hf = λ × L/d × v²/2g",
      },
      {
        title: "Гидравлический расчёт",
        content: `На вкладке «Гидравлика» выполняется автоматический расчёт:
• Скорость течения v (м/с)
• Число Рейнольдса Re = v × d / ν
• Режим течения (ламинарный Re<2300 / турбулентный Re>4000)
• Коэффициент гидравлического трения λ (формула Дарси-Вейсбаха)
• Потери давления hf (м вод. ст.)

Нормы скоростей (СП 31, СП 32):
• Водопровод: 0.7–3.0 м/с
• Канализация самотёчная: 0.7–4.0 м/с, уклон ≥ 0.001`,
        tip: "Красная подсветка участка означает нарушение нормативных скоростей или уклона.",
      },
      {
        title: "Колодцы",
        content: `На вкладке «Колодцы» добавьте узловые точки:
• Тип: Смотровой, Перепадный, Угловой, Поворотный
• Материал: Железобетон, Полимерный, Кирпич
• Глубина (м) и диаметр (мм)

Колодцы расставляются на прямолинейных участках не реже чем через 50 м для d<600 мм и 75 м для d≥600 мм.`,
      },
      {
        title: "Проверка коллизий",
        content: `На вкладке «Коллизии» выполняется автоматическая проверка:
• Жёсткие коллизии — физическое пересечение элементов
• Касания — элементы на минимально допустимом расстоянии
• Дублирование — совпадающие элементы

Нормативные расстояния (СП 18.13330):
• Водопровод и канализация: ≥ 0.2 м по вертикали
• Водопровод и теплосеть: ≥ 0.2 м
• Кабели и трубы: ≥ 0.5 м`,
      },
      {
        title: "Экспорт сетей",
        content: `На вкладке «Экспорт» доступны форматы:
• LandXML — обмен с Civil 3D, передача коллегам
• CSV — таблица с параметрами всех трубопроводов
• Спецификации — ведомость труб и материалов

Для открытия в AutoCAD используйте формат DXF.`,
      },
    ],
  },
  {
    id: "bim",
    icon: "Layers",
    title: "BIM-интеграция",
    desc: "IFC, Revit, Construction Cloud",
    color: "#be185d",
    sections: [
      {
        title: "Что такое BIM в ЛАПА 3D?",
        content: `BIM (Building Information Modeling) — информационное моделирование зданий и сооружений. ЛАПА 3D поддерживает работу с BIM-моделями через формат IFC (Industry Foundation Classes).

Модуль «BIM-инструменты» позволяет:
• Создавать и редактировать BIM-элементы
• Назначать свойства (атрибуты) объектам
• Проверять коллизии между объектами
• Экспортировать модели в IFC для Revit / Navisworks`,
      },
      {
        title: "Работа с IFC-моделью",
        content: `На вкладке «Модель» отображается дерево IFC-элементов:
• IfcProject → IfcSite → IfcBuilding → IfcBuildingStorey
• Элементы: IfcBeam, IfcColumn, IfcSlab, IfcWall
• Дорожные: IfcRoad, IfcAlignment, IfcRoadPart
• Сети: IfcPipeSegment, IfcDuctSegment

Для добавления элемента: выберите тип IFC → заполните параметры → «Добавить».`,
      },
      {
        title: "Обнаружение коллизий",
        content: `На вкладке «BIM-координация»:
1. Нажмите «Запустить проверку»
2. Система определит:
   • Жёсткие коллизии — физическое пересечение
   • Касания — нулевой зазор
   • Дублирование — совпадающие объекты
3. Каждая коллизия отображается с описанием и рекомендацией
4. Изменяйте статус: Активный → Принят → Решён`,
        tip: "Регулярная проверка коллизий — ключевое требование BIM-стандартов (ISO 19650).",
      },
      {
        title: "Экспорт в IFC",
        content: `Для передачи модели в Revit / Navisworks / Tekla:
1. Откройте вкладку «Экспорт» в модуле «BIM-инструменты»
2. Нажмите «Экспорт IFC»
3. Файл формата ISO-10303-21 / IFC4 будет сохранён

Для открытия в Revit: Вставка → Связать IFC`,
      },
      {
        title: "BIM 360 / Construction Cloud",
        content: `На вкладке «BIM 360 Cloud» в модуле «BIM-инструменты»:
• Просмотр проектов в облаке
• Синхронизация модели — кнопка «Синхронизировать»
• Публикация модели — кнопка «Опубликовать модель»
• Трекер замечаний — список Issues с приоритетами

Статусы замечаний: Открыто, Ответ дан, Закрыто`,
      },
      {
        title: "Интеграция с Revit",
        content: `Рабочий процесс ЛАПА 3D → Revit:
1. В ЛАПА 3D создайте трассу, коридор и инженерные сети
2. Экспортируйте в LandXML (трасса + рельеф) и IFC (сети)
3. В Revit: Вставка → Связать IFC → выберите файл
4. LandXML импортируется через плагин Civil 3D Link или напрямую

Формат LandXML также открывается в InfraWorks, AutoCAD Civil 3D, Bentley OpenRoads.`,
      },
    ],
  },
  {
    id: "hotkeys",
    icon: "Keyboard",
    title: "Горячие клавиши",
    desc: "Все команды редактора",
    color: "#7c3aed",
    sections: [
      {
        title: "Команды редактора ЛАПА",
        content: `Командная строка находится внизу редактора. Введите команду и нажмите Enter.`,
        code: `КОРИДОР   — создать коридор
ТРАССА    — создать трассу
ПОВЕРХНОСТЬ — создать поверхность TIN/Grid
ПРОФИЛЬ   — создать профиль
СЕЧЕНИЕ   — создать типовое сечение (Assembly)
ТОЧКИ     — импорт/создание точек COGO
СЕТЬ      — создать трубопроводную сеть
ПЕРЕСЕЧЕНИЕ — проектирование пересечения
ХАРЛИНИЯ  — характерная линия
АНАЛИЗ    — анализ уклонов
УКЛОНЫ    — анализ уклонов поверхности
ОБЪЁМЫ    — ведомость объёмов земляных работ
ВОДОСБОР  — создать водосборный бассейн
СЛОИ      — диспетчер слоёв
ИМПОРТ    — импорт данных
ЭКСПОРТ   — экспорт данных
ПЕЧАТЬ    — печать чертежа
ZE        — вписать вид (Zoom Extents)
REGEN     — регенерировать чертёж
ЛИНИЯ     — создать линию (2D черчение)
РАЗМЕР    — аннотации и размеры
ГИДРОЛОГИЯ — модуль гидрологии`,
      },
      {
        title: "Горячие клавиши — Вид",
        content: `Колесо мыши вверх/вниз — приблизить / отдалить
Зажать СКМ + тянуть — панорама
Ctrl+Shift+E / ZE — вписать всё
RE — регенерировать
Правая кнопка мыши в редакторе — контекстное меню`,
      },
      {
        title: "Горячие клавиши — Правка",
        content: `Ctrl+Z — отменить действие
Ctrl+Y — повторить действие
Ctrl+C / CO — копировать объект
Ctrl+V — вставить
Delete / E — удалить выбранный объект
Escape — отменить текущую команду`,
      },
      {
        title: "Горячие клавиши — Civil",
        content: `AL — создать трассу (Alignment)
TIN — создать TIN-поверхность
GRID — создать Grid-поверхность
PROFILE — создать профиль
AS / ТС — создать типовое сечение
FL / ХЛ — характерная линия
INT — пересечение дорог
VOL / ОБЪ — объёмы земляных работ
PIPE / ТРУБЫ — трубопроводная сеть
LA / СЛОИ — диспетчер слоёв`,
      },
      {
        title: "Управление 3D-вьюером",
        content: `Левая кнопка мыши + тянуть — вращение модели
Правая кнопка мыши + тянуть — панорама
Колесо мыши — масштаб
Кнопка «Сброс» — возврат к исходному виду

Режимы: Тонирование / Каркас / Горизонтали / Уклоны / Высоты / Ночной
Виды: 3D перспектива / Сверху (план) / Спереди / Сбоку / Изометрия`,
      },
      {
        title: "Настройка горячих клавиш",
        content: `Горячие клавиши можно перенастроить в Настройках:
1. Нажмите кнопку ⚙ в правой верхней панели или перейдите в Настройки
2. Откройте вкладку «Горячие клавиши»
3. Кликните на кнопку клавиши рядом с нужным действием
4. Нажмите желаемую клавишу на клавиатуре
5. Клавиша сохранится автоматически

Для сброса к стандартным — кнопка «Сбросить».`,
        tip: "Настройки горячих клавиш сохраняются в браузере и не теряются при обновлении страницы.",
      },
    ],
  },
]

// ─── Поиск по документации ────────────────────────────────────────────────────

function searchDocs(query: string) {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  const results: { docId: string; docTitle: string; sectionTitle: string; preview: string }[] = []
  DOCS.forEach(doc => {
    doc.sections.forEach(s => {
      if (s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q) || (s.code && s.code.toLowerCase().includes(q))) {
        results.push({
          docId: doc.id,
          docTitle: doc.title,
          sectionTitle: s.title,
          preview: s.content.slice(0, 120) + "…",
        })
      }
    })
  })
  return results
}

// ─── Компонент ────────────────────────────────────────────────────────────────

export default function Docs() {
  const navigate = useNavigate()
  const [activeDoc, setActiveDoc] = useState(DOCS[0].id)
  const [activeSection, setActiveSection] = useState(0)
  const [search, setSearch] = useState("")
  const [showSearch, setShowSearch] = useState(false)

  const doc = DOCS.find(d => d.id === activeDoc) || DOCS[0]
  const searchResults = searchDocs(search)

  return (
    <div className="flex flex-col h-screen bg-gray-50" style={{ fontFamily: "Arial, sans-serif" }}>

      {/* Шапка */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 flex-shrink-0">
        <button onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors">
          <Icon name="ChevronLeft" size={18} />
          <span className="text-sm">Назад</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#0078d4] rounded flex items-center justify-center text-white font-bold text-xs">Л</div>
          <span className="font-bold text-gray-900">ЛАПА 3D — Документация</span>
        </div>
        <div className="flex-1" />
        {/* Поиск */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-64">
            <Icon name="Search" size={14} className="text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setShowSearch(e.target.value.length > 0) }}
              onBlur={() => setTimeout(() => setShowSearch(false), 200)}
              placeholder="Поиск в документации…"
              className="bg-transparent text-sm outline-none text-gray-700 w-full placeholder-gray-400"
            />
          </div>
          {showSearch && searchResults.length > 0 && (
            <div className="absolute top-full right-0 mt-1 w-96 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
              {searchResults.slice(0, 8).map((r, i) => (
                <button key={i}
                  onClick={() => {
                    setActiveDoc(r.docId)
                    setSearch("")
                    setShowSearch(false)
                  }}
                  className="w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-blue-50 transition-colors">
                  <div className="text-xs text-[#0078d4] font-semibold mb-0.5">{r.docTitle} → {r.sectionTitle}</div>
                  <div className="text-xs text-gray-500 leading-relaxed">{r.preview}</div>
                </button>
              ))}
            </div>
          )}
          {showSearch && search && searchResults.length === 0 && (
            <div className="absolute top-full right-0 mt-1 w-80 bg-white rounded-xl border border-gray-200 shadow-xl z-50 px-4 py-3 text-sm text-gray-400">
              Ничего не найдено по «{search}»
            </div>
          )}
        </div>
        <a href="https://poehali.dev/help" target="_blank" rel="noreferrer"
          className="text-sm text-[#0078d4] hover:underline flex items-center gap-1">
          <Icon name="ExternalLink" size={13} />Поддержка
        </a>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Левая навигация */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-hidden flex-shrink-0">
          <div className="p-3 border-b border-gray-100">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 py-1">Разделы</div>
          </div>
          <nav className="flex-1 overflow-y-auto py-2">
            {DOCS.map(d => (
              <button key={d.id} onClick={() => { setActiveDoc(d.id); setActiveSection(0) }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${activeDoc === d.id ? "bg-blue-50 text-[#0078d4] font-semibold border-r-2 border-[#0078d4]" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: d.color + "18" }}>
                  <Icon name={d.icon} size={16} style={{ color: d.color }} fallback="BookOpen" />
                </div>
                <div>
                  <div className="text-sm font-medium leading-tight">{d.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{d.desc}</div>
                </div>
              </button>
            ))}
          </nav>
        </aside>

        {/* Содержание раздела */}
        <div className="flex flex-1 overflow-hidden">

          {/* Оглавление раздела */}
          <div className="w-52 bg-gray-50 border-r border-gray-200 overflow-y-auto flex-shrink-0 py-3">
            <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Содержание</div>
            {doc.sections.map((s, i) => (
              <button key={i} onClick={() => setActiveSection(i)}
                className={`w-full text-left px-4 py-2 text-sm transition-all ${activeSection === i ? "text-[#0078d4] font-semibold bg-blue-50" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"}`}>
                {s.title}
              </button>
            ))}
          </div>

          {/* Основной контент */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div key={`${activeDoc}-${activeSection}`}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                className="max-w-3xl mx-auto px-8 py-8 space-y-8">

                {/* Заголовок раздела */}
                <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: doc.color + "18" }}>
                    <Icon name={doc.icon} size={28} style={{ color: doc.color }} fallback="BookOpen" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-gray-900">{doc.title}</div>
                    <div className="text-gray-500 mt-0.5">{doc.desc}</div>
                  </div>
                </div>

                {/* Активный подраздел */}
                {doc.sections[activeSection] && (() => {
                  const s = doc.sections[activeSection]
                  return (
                    <div className="space-y-5">
                      <h2 className="text-xl font-bold text-gray-900">{s.title}</h2>
                      <div className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">
                        {s.content}
                      </div>
                      {s.code && (
                        <div className="rounded-xl bg-gray-900 p-4 overflow-x-auto">
                          <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap leading-relaxed">{s.code}</pre>
                        </div>
                      )}
                      {s.tip && (
                        <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-200 p-4">
                          <Icon name="Lightbulb" size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-blue-800 leading-relaxed">{s.tip}</p>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Навигация между подразделами */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                    disabled={activeSection === 0}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSection === 0 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}>
                    <Icon name="ChevronLeft" size={16} />Назад
                  </button>
                  <span className="text-xs text-gray-400">{activeSection + 1} / {doc.sections.length}</span>
                  <button
                    onClick={() => setActiveSection(Math.min(doc.sections.length - 1, activeSection + 1))}
                    disabled={activeSection === doc.sections.length - 1}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSection === doc.sections.length - 1 ? "text-gray-300 cursor-not-allowed" : "text-[#0078d4] hover:bg-blue-50"}`}>
                    Далее<Icon name="ChevronRight" size={16} />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}