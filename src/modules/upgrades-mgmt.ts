// ═══════════════════════════════════════════════════════════════════════════
// Рабочие расчёты для направления «Управление проектами»: совместная работа,
// PDM, себестоимость, синхронизация, производительность платформы.
// ═══════════════════════════════════════════════════════════════════════════

import type { Upgrade } from "./versions-upgrades"
import { num, fx, fmtBig } from "@/utils/engCalc"

const f = (key: string, label: string, def: string, suffix?: string) =>
  ({ key, label, type: "number" as const, default: def, suffix })
const sel = (key: string, label: string, def: string, options: string[]) =>
  ({ key, label, type: "select" as const, default: def, options })

export const mgmtUpgrades: Record<string, Upgrade> = {

  "acad-2022-share": {
    desc: "Общий доступ к чертежу: срок действия ссылки, число участников, ограничение прав.",
    fields: [sel("mode", "Права", "Просмотр", ["Просмотр", "Редактирование"]), f("users", "Ожидается участников", "6"), f("days", "Срок действия ссылки", "7", "дн.")],
    outputLabel: "Общий доступ",
    compute: v => {
      const n = num(v.users), days = num(v.days)
      return [
        { label: "Режим доступа", value: String(v.mode) },
        { label: "Участников", value: `${n}` },
        { label: "Срок действия", value: `${fx(days, 0)} дн.` },
        { label: "Истекает", value: `через ${fx(days, 0)} дн.` },
        { label: "Рекомендация", value: v.mode === "Редактирование" && n > 5 ? "⚠ ограничьте число редакторов" : "✓ безопасно" },
      ]
    },
  },

  "acad-2024-activityinsights": {
    desc: "Activity Insights: аналитика активности в проекте за период.",
    fields: [f("days", "За период", "30", "дн."), f("sessions", "Сессий работы", "84"), f("users", "Активных пользователей", "6")],
    outputLabel: "Аналитика активности",
    compute: v => {
      const days = num(v.days), s = num(v.sessions), u = num(v.users)
      return [
        { label: "Период", value: `${fx(days, 0)} дн.` },
        { label: "Сессий работы", value: `${s}` },
        { label: "Активных пользователей", value: `${u}` },
        { label: "Сессий в день", value: fx(days > 0 ? s / days : 0, 1) },
        { label: "Сессий на пользователя", value: fx(u > 0 ? s / u : 0, 1) },
      ]
    },
  },

  "acad-2026-perf": {
    desc: "Оценка ускорения открытия файла: время загрузки до и после оптимизации.",
    fields: [f("mb", "Размер файла", "180", "МБ"), f("boost", "Прирост скорости", "35", "%")],
    outputLabel: "Ускорение открытия",
    compute: v => {
      const mb = num(v.mb), boost = num(v.boost) / 100
      const before = mb / 12
      const after = before * (1 - boost)
      return [
        { label: "Размер файла", value: `${fx(mb, 0)} МБ` },
        { label: "Время открытия (было)", value: `${fx(before, 1)} с` },
        { label: "Время открытия (стало)", value: `${fx(after, 1)} с` },
        { label: "Экономия", value: `${fx(before - after, 1)} с (${fx(boost * 100, 0)} %)` },
        { label: "На 50 открытий в день", value: `${fx(((before - after) * 50) / 60, 1)} мин/день` },
      ]
    },
  },

  "acad-2027-cloudsync": {
    desc: "Совместное редактирование в облаке: задержка синхронизации, нагрузка на канал.",
    fields: [f("users", "Участников", "4"), f("ping", "Задержка сети", "45", "мс"), f("ops", "Операций в минуту на юзера", "12")],
    outputLabel: "Облачная совместная работа",
    compute: v => {
      const n = num(v.users), ping = num(v.ping), ops = num(v.ops)
      const totalOps = n * ops
      const sync = ping * Math.log2(Math.max(n, 2))
      return [
        { label: "Участников сессии", value: `${n}` },
        { label: "Операций синхронизации/мин", value: fmtBig(totalOps, 0) },
        { label: "Задержка отображения правки", value: `${fx(sync, 0)} мс` },
        { label: "Пропускная способность", value: `${fx((totalOps * 2) / 60, 2)} КБ/с` },
        { label: "Оценка комфортности", value: sync < 150 ? "✓ плавно" : sync < 400 ? "⚠ заметные задержки" : "✗ нужен канал быстрее" },
      ]
    },
  },

  "civil-2027-digital-twin": {
    desc: "Синхронизация цифрового двойника: объём телеметрии с датчиков IoT.",
    fields: [f("sensors", "Датчиков", "36"), f("freq", "Частота опроса", "10", "с"), f("bytes", "Байт на пакет", "128")],
    outputLabel: "Цифровой двойник",
    compute: v => {
      const n = num(v.sensors), freq = num(v.freq), b = num(v.bytes)
      const perHour = n * (3600 / freq) * b
      return [
        { label: "Датчиков подключено", value: `${n}` },
        { label: "Пакетов в час", value: fmtBig(n * (3600 / freq), 0) },
        { label: "Трафик в час", value: `${fx(perHour / 1024, 1)} КБ` },
        { label: "Трафик в сутки", value: `${fx((perHour * 24) / 1048576, 2)} МБ` },
        { label: "Трафик в месяц", value: `${fx((perHour * 24 * 30) / 1073741824, 3)} ГБ` },
      ]
    },
  },

  "interop-cloud-format": {
    desc: "Пакетная конвертация форматов: время обработки, размер результата.",
    fields: [f("files", "Файлов", "48"), sel("to", "В формат", "IFC4", ["DWG 2018", "IFC4", "PDF", "STEP", "LandXML"]), f("avgMb", "Средний размер файла", "12", "МБ")],
    outputLabel: "Пакетная конвертация",
    compute: v => {
      const n = num(v.files), mb = num(v.avgMb)
      const kTime: Record<string, number> = { "DWG 2018": 2, "IFC4": 5, "PDF": 3, "STEP": 6, "LandXML": 4 }
      const t = kTime[String(v.to)] ?? 4
      return [
        { label: "Файлов в пакете", value: `${n}` },
        { label: "Целевой формат", value: String(v.to) },
        { label: "Время на файл", value: `${fx(t + mb / 20, 1)} с` },
        { label: "Общее время конвертации", value: `${fx((n * (t + mb / 20)) / 60, 1)} мин` },
        { label: "Итоговый объём", value: `${fmtBig(n * mb * 0.85, 0)} МБ` },
      ]
    },
  },

  "sw-edrawings": {
    desc: "Согласование в eDrawings: сжатие модели, время загрузки для рецензента.",
    fields: [f("mb", "Размер исходной модели", "85", "МБ"), sel("mode", "Режим", "Просмотр", ["Просмотр", "Измерения", "Разметка"]), f("users", "Рецензентов", "5")],
    outputLabel: "Согласование модели",
    compute: v => {
      const mb = num(v.mb), n = num(v.users)
      const compressed = mb * 0.12
      return [
        { label: "Исходный размер", value: `${fx(mb, 1)} МБ` },
        { label: "Размер eDrawings", value: `${fx(compressed, 1)} МБ (сжатие ×8)` },
        { label: "Время загрузки (10 Мбит/с)", value: `${fx((compressed * 8) / 10, 1)} с` },
        { label: "Режим", value: String(v.mode) },
        { label: "Рецензентов", value: `${n}` },
        { label: "Суммарный трафик рассылки", value: `${fx(compressed * n, 1)} МБ` },
      ]
    },
  },

  "sw-pdm": {
    desc: "PDM: структура документооборота, статусы, версионность.",
    fields: [f("docs", "Документов", "1240"), sel("stage", "Статус", "В работе", ["В работе", "На проверке", "Утверждён", "В архиве"]), f("rev", "Средняя ревизий на документ", "3.2")],
    outputLabel: "Управление данными",
    compute: v => {
      const n = num(v.docs), rev = num(v.rev)
      return [
        { label: "Документов в системе", value: fmtBig(n, 0) },
        { label: "Текущий статус выборки", value: String(v.stage) },
        { label: "Средняя версионность", value: fx(rev, 1) },
        { label: "Всего версий в хранилище", value: fmtBig(n * rev, 0) },
        { label: "Оценка объёма (5 МБ/версия)", value: `${fmtBig((n * rev * 5) / 1024, 1)} ГБ` },
      ]
    },
  },

  "sw-manage": {
    desc: "Manage: проекты и процессы согласования, загрузка команды.",
    fields: [f("tasks", "Задач", "85"), f("team", "Участников команды", "12"), f("days", "Срок проекта", "45", "дн.")],
    outputLabel: "Проекты и процессы",
    compute: v => {
      const t = num(v.tasks), team = num(v.team), d = num(v.days)
      return [
        { label: "Задач в проекте", value: `${t}` },
        { label: "Задач на участника", value: fx(team > 0 ? t / team : 0, 1) },
        { label: "Задач в день (план)", value: fx(d > 0 ? t / d : 0, 2) },
        { label: "Требуемая скорость закрытия", value: `${fx(d > 0 ? t / d : 0, 2)} задач/день` },
        { label: "Оценка загрузки", value: team > 0 && t / team > 15 ? "⚠ высокая нагрузка" : "✓ норма" },
      ]
    },
  },

  "sw-task-scheduler": {
    desc: "Автоматизация по расписанию: пакетная обработка файлов, время выполнения.",
    fields: [f("files", "Файлов в пакете", "150"), f("perFile", "Секунд на файл", "8")],
    outputLabel: "Задачи по расписанию",
    compute: v => {
      const n = num(v.files), t = num(v.perFile)
      return [
        { label: "Файлов в пакете", value: `${n}` },
        { label: "Время на файл", value: `${fx(t, 1)} с` },
        { label: "Общее время выполнения", value: `${fx((n * t) / 60, 1)} мин` },
        { label: "Рекомендуемый запуск", value: n * t > 3600 ? "ночью, вне рабочих часов" : "в любое время" },
      ]
    },
  },

  "sw-esign": {
    desc: "ЭЦП: объём документов на подпись, оценка времени обработки.",
    fields: [f("docs", "Документов на подпись", "32"), f("perDoc", "Секунд на подпись", "12")],
    outputLabel: "ЭЦП и защита данных",
    compute: v => {
      const n = num(v.docs), t = num(v.perDoc)
      return [
        { label: "Документов", value: `${n}` },
        { label: "Время на пакет", value: `${fx((n * t) / 60, 1)} мин` },
        { label: "Подписей в час (макс.)", value: fmtBig(3600 / t, 0) },
        { label: "Статус защиты", value: "✓ ЭЦП и хэш-контроль целостности" },
      ]
    },
  },

  "sw-erp-cost": {
    desc: "Данные для ERP: себестоимость изделия по материалам, работе и накладным.",
    fields: [f("mat", "Материал", "1200", "₽"), f("labor", "Работа", "2400", "₽"), f("overhead", "Накладные расходы", "25", "%"), f("qty", "Тираж", "500", "шт")],
    outputLabel: "Себестоимость",
    compute: v => {
      const mat = num(v.mat), labor = num(v.labor), oh = num(v.overhead) / 100, q = num(v.qty)
      const direct = mat + labor
      const full = direct * (1 + oh)
      return [
        { label: "Прямые затраты", value: `${fmtBig(direct, 0)} ₽` },
        { label: "Накладные расходы", value: `${fmtBig(direct * oh, 0)} ₽` },
        { label: "Полная себестоимость", value: `${fmtBig(full, 0)} ₽/шт` },
        { label: "Себестоимость тиража", value: `${fmtBig(full * q, 0)} ₽` },
        { label: "Доля материала", value: `${fx((mat / full) * 100, 1)} %` },
      ]
    },
  },

  "sw27-web-share": {
    desc: "Обмен ссылками на 3D-модели: объём просмотров, права доступа.",
    fields: [sel("access", "Доступ", "Просмотр + комментарии", ["Только просмотр", "Просмотр + комментарии"]), f("views", "Ожидаемых просмотров", "40")],
    outputLabel: "Обмен ссылками",
    compute: v => [
      { label: "Уровень доступа", value: String(v.access) },
      { label: "Ожидаемые просмотры", value: `${num(v.views)}` },
      { label: "Требуется регистрация", value: v.access === "Просмотр + комментарии" ? "да, для комментариев" : "нет" },
    ],
  },

  "sw27-pdm-sync": {
    desc: "Синхронизация представлений PDM: папки, объём передачи, время.",
    fields: [f("folders", "Папок к синхронизации", "36"), f("filesPerFolder", "Файлов в папке", "45"), f("speedMbps", "Скорость канала", "50", "Мбит/с")],
    outputLabel: "Синхронизация PDM",
    compute: v => {
      const folders = num(v.folders), fpf = num(v.filesPerFolder), speed = num(v.speedMbps)
      const totalFiles = folders * fpf
      const totalMb = totalFiles * 3
      return [
        { label: "Всего файлов", value: fmtBig(totalFiles, 0) },
        { label: "Оценка объёма", value: `${fmtBig(totalMb, 0)} МБ` },
        { label: "Время синхронизации", value: `${fx((totalMb * 8) / speed / 60, 1)} мин` },
      ]
    },
  },

  "sw27-offline-mode": {
    desc: "Автономный режим: буфер несинхронизированных изменений при нестабильной сети.",
    fields: [sel("state", "Соединение", "Нестабильное", ["Онлайн", "Нестабильное", "Отсутствует"]), f("changes", "Изменений в очереди", "18")],
    outputLabel: "Автономный режим",
    compute: v => {
      const c = num(v.changes)
      const risk = v.state === "Отсутствует" ? "высокий" : v.state === "Нестабильное" ? "средний" : "низкий"
      return [
        { label: "Состояние соединения", value: String(v.state) },
        { label: "Изменений в очереди", value: `${c}` },
        { label: "Риск конфликта версий", value: risk },
        { label: "Рекомендация", value: v.state !== "Онлайн" ? "работайте локально, синхронизация автоматическая" : "изменения применяются мгновенно" },
      ]
    },
  },
}