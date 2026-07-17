import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Icon from "@/components/ui/icon"

const TIMEZONES = [
  "Europe/Moscow (UTC+3)",
  "Europe/Kaliningrad (UTC+2)",
  "Asia/Yekaterinburg (UTC+5)",
  "Asia/Novosibirsk (UTC+7)",
  "Asia/Krasnoyarsk (UTC+7)",
  "Asia/Irkutsk (UTC+8)",
  "Asia/Vladivostok (UTC+10)",
  "Asia/Kamchatka (UTC+12)",
  "Europe/Kiev (UTC+2)",
  "Asia/Almaty (UTC+6)",
]

const UNITS_OPTIONS = [
  { value: "metric", label: "Метрическая (м, км, м²)" },
  { value: "imperial", label: "Имперская (фут, миля)" },
]

const THEMES = [
  { value: "light", label: "Светлая", icon: "Sun" },
  { value: "dark", label: "Тёмная", icon: "Moon" },
  { value: "system", label: "Системная", icon: "Monitor" },
]

const HOTKEYS_DEFAULT = [
  { action: "Приблизить / отдалить", key: "Колесо мыши", category: "Вид", cmd: "" },
  { action: "Панорама", key: "Зажать СКМ + тянуть", category: "Вид", cmd: "" },
  { action: "Вписать всё", key: "Ctrl+Shift+E / ZE", category: "Вид", cmd: "ZE" },
  { action: "Регенерировать", key: "RE", category: "Вид", cmd: "REGEN" },
  { action: "Отменить действие", key: "Ctrl+Z", category: "Правка", cmd: "U" },
  { action: "Повторить действие", key: "Ctrl+Y", category: "Правка", cmd: "REDO" },
  { action: "Копировать объект", key: "Ctrl+C / CO", category: "Правка", cmd: "COPY" },
  { action: "Вставить", key: "Ctrl+V", category: "Правка", cmd: "PASTE" },
  { action: "Удалить объект", key: "Delete / E", category: "Правка", cmd: "ERASE" },
  { action: "Создать коридор", key: "CORRIDOR", category: "Civil", cmd: "КОРИДОР" },
  { action: "Создать трассу", key: "AL", category: "Civil", cmd: "ТРАССА" },
  { action: "Создать поверхность", key: "TIN / GRID", category: "Civil", cmd: "ПОВЕРХНОСТЬ" },
  { action: "Создать профиль", key: "PROFILE", category: "Civil", cmd: "ПРОФИЛЬ" },
  { action: "Создать точки COGO", key: "POINTS", category: "Civil", cmd: "ТОЧКИ" },
  { action: "Инженерные сети", key: "PIPE", category: "Civil", cmd: "СЕТЬ" },
  { action: "Анализ уклонов", key: "SLOPES", category: "Анализ", cmd: "УКЛОНЫ" },
  { action: "Объёмы земляных работ", key: "VOL", category: "Анализ", cmd: "ОБЪЁМЫ" },
  { action: "Диспетчер слоёв", key: "LA", category: "Слои", cmd: "СЛОИ" },
  { action: "Импорт данных", key: "IMPORT", category: "Файл", cmd: "ИМПОРТ" },
  { action: "Экспорт / Печать", key: "EXPORT / PLOT", category: "Файл", cmd: "ЭКСПОРТ" },
  { action: "Параметры чертежа", key: "DWGSETTINGS", category: "Файл", cmd: "ПАРАМ" },
  { action: "Черчение 2D", key: "DRAW / L / A", category: "2D", cmd: "ЧЕРЧЕНИЕ" },
  { action: "Аннотации и размеры", key: "DIM", category: "2D", cmd: "РАЗМЕР" },
  { action: "Водосборы / Гидрология", key: "HYDRO", category: "Civil", cmd: "ВОДОСБОР" },
]

function getProfile() {
  try { return JSON.parse(localStorage.getItem("civilpro_profile") || "{}") } catch { return {} }
}

export default function Settings() {
  const navigate = useNavigate()
  const profile = getProfile()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(profile.name || "")
  const [email, setEmail] = useState("test@test")
  const [timezone, setTimezone] = useState(profile.timezone || "Europe/Moscow (UTC+3)")
  const [avatar, setAvatar] = useState<string>(profile.avatar || "")
  const [saved, setSaved] = useState(false)

  const [theme, setTheme] = useState(profile.theme || "light")
  const [units, setUnits] = useState(profile.units || "metric")
  const [lang, setLang] = useState(localStorage.getItem("civilpro_lang") || "Русский")
  const [editingKey, setEditingKey] = useState<number | null>(null)
  const [customHotkeys, setCustomHotkeys] = useState<Record<number, string>>({})
  const [hotkeyFilter, setHotkeyFilter] = useState("Все")

  const [oldPwd, setOldPwd] = useState("")
  const [newPwd, setNewPwd] = useState("")
  const [confirmPwd, setConfirmPwd] = useState("")
  const [pwdMsg, setPwdMsg] = useState("")

  const saveProfile = () => {
    localStorage.setItem("civilpro_profile", JSON.stringify({ ...profile, name, timezone, avatar, theme, units, lang }))
    localStorage.setItem("civilpro_units", units)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setAvatar(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const changePassword = () => {
    if (oldPwd !== "test@test") { setPwdMsg("Текущий пароль неверный"); return }
    if (newPwd.length < 6) { setPwdMsg("Новый пароль должен быть не менее 6 символов"); return }
    if (newPwd !== confirmPwd) { setPwdMsg("Пароли не совпадают"); return }
    setPwdMsg("Пароль успешно изменён")
    setOldPwd(""); setNewPwd(""); setConfirmPwd("")
    setTimeout(() => setPwdMsg(""), 3000)
  }

  const initials = name.trim().split(" ").slice(0, 2).map((w: any) => w[0]?.toUpperCase()).join("") || "???"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-3 flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate("/dashboard")} className="text-gray-400 hover:text-gray-700">
          <Icon name="ChevronLeft" size={20} />
        </button>
        <div className="text-xl font-extrabold font-heading text-gray-900 cursor-pointer" onClick={() => navigate("/dashboard")}>ЛАПА</div>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-semibold text-indigo-600">Настройки</span>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Tabs defaultValue="profile">
            <TabsList className="mb-6">
              <TabsTrigger value="profile" className="gap-2"><Icon name="User" size={14} /> Профиль</TabsTrigger>
              <TabsTrigger value="app" className="gap-2"><Icon name="Settings" size={14} /> Приложение</TabsTrigger>
              <TabsTrigger value="security" className="gap-2"><Icon name="Lock" size={14} /> Безопасность</TabsTrigger>
              <TabsTrigger value="hotkeys" className="gap-2"><Icon name="Keyboard" size={14} /> Горячие клавиши</TabsTrigger>
              <TabsTrigger value="automation" className="gap-2"><Icon name="Zap" size={14} /> Автоматизация</TabsTrigger>
            </TabsList>

            {/* ── Профиль ── */}
            <TabsContent value="profile" className="space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5">
                {/* Avatar */}
                <div className="flex items-center gap-5">
                  <div
                    className="w-20 h-20 rounded-2xl bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600 overflow-hidden cursor-pointer border-2 border-indigo-200 hover:border-indigo-400 transition-colors flex-shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                    title="Нажмите для загрузки аватара"
                  >
                    {avatar ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" /> : initials}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Фото профиля</p>
                    <p className="text-xs text-muted-foreground mb-2">JPG или PNG, не более 2 МБ</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => fileInputRef.current?.click()}>
                        <Icon name="Upload" size={12} /> Загрузить
                      </Button>
                      {avatar && (
                        <Button size="sm" variant="ghost" className="text-xs text-red-500 gap-1" onClick={() => setAvatar("")}>
                          <Icon name="Trash2" size={12} /> Удалить
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Имя</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Иванов Александр" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input value={email} onChange={e => setEmail(e.target.value)} type="email" />
                  </div>
                </div>

                {/* Timezone */}
                <div className="space-y-1.5">
                  <Label>Часовой пояс</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TIMEZONES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-3">
                  <Button onClick={saveProfile} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                    <Icon name="Save" size={15} /> Сохранить
                  </Button>
                  {saved && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-sm text-green-600 flex items-center gap-1 font-medium">
                      <Icon name="CheckCircle" size={14} /> Сохранено
                    </motion.span>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ── Приложение ── */}
            <TabsContent value="app" className="space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-6">
                {/* Theme */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Тема интерфейса</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {THEMES.map(t => (
                      <button key={t.value} onClick={() => setTheme(t.value)}
                        className={`rounded-xl border p-4 flex flex-col items-center gap-2 transition-all ${theme === t.value ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white hover:border-indigo-200"}`}>
                        <Icon name={t.icon} size={20} className={theme === t.value ? "text-indigo-600" : "text-gray-400"} fallback="Sun" />
                        <span className={`text-xs font-semibold ${theme === t.value ? "text-indigo-700" : "text-gray-600"}`}>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Units */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Единицы измерения</Label>
                  <Select value={units} onValueChange={setUnits}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{UNITS_OPTIONS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                {/* Language */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Язык интерфейса</Label>
                  <Select value={lang} onValueChange={v => { setLang(v); localStorage.setItem("civilpro_lang", v) }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Русский">Русский</SelectItem>
                      <SelectItem value="English">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-3">
                  <Button onClick={saveProfile} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                    <Icon name="Save" size={15} /> Сохранить
                  </Button>
                  {saved && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="text-sm text-green-600 flex items-center gap-1 font-medium">
                      <Icon name="CheckCircle" size={14} /> Сохранено
                    </motion.span>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ── Безопасность ── */}
            <TabsContent value="security" className="space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
                <h3 className="font-semibold text-gray-800">Изменить пароль</h3>
                <div className="space-y-3 max-w-sm">
                  <div className="space-y-1.5">
                    <Label>Текущий пароль</Label>
                    <Input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} placeholder="••••••••" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Новый пароль</Label>
                    <Input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="••••••••" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Повторите пароль</Label>
                    <Input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="••••••••" />
                  </div>
                  {pwdMsg && (
                    <p className={`text-sm font-medium ${pwdMsg.includes("успешно") ? "text-green-600" : "text-red-500"}`}>{pwdMsg}</p>
                  )}
                  <Button onClick={changePassword} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                    <Icon name="Lock" size={15} /> Изменить пароль
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-red-100 bg-red-50 p-6 space-y-3">
                <h3 className="font-semibold text-red-800 flex items-center gap-2"><Icon name="AlertTriangle" size={16} /> Опасная зона</h3>
                <p className="text-sm text-red-600">Выход из аккаунта завершит текущую сессию.</p>
                <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-100 gap-2"
                  onClick={() => { localStorage.removeItem("civilpro_auth"); navigate("/login") }}>
                  <Icon name="LogOut" size={15} /> Выйти из аккаунта
                </Button>
              </div>
            </TabsContent>

            {/* ── Горячие клавиши ── */}
            <TabsContent value="hotkeys" className="space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Горячие клавиши и команды редактора</p>
                  <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setCustomHotkeys({})}>
                    <Icon name="RotateCcw" size={12} />Сбросить
                  </Button>
                </div>
                {/* Category filters */}
                <div className="flex flex-wrap gap-1 px-4 py-2 border-b border-gray-100">
                  {["Все", "Civil", "Вид", "Правка", "2D", "Анализ", "Слои", "Файл"].map(cat => (
                    <button key={cat} onClick={() => setHotkeyFilter(cat)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${hotkeyFilter === cat ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 text-gray-500 hover:border-indigo-300"}`}>
                      {cat}
                    </button>
                  ))}
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Действие</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Категория</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Клавиша</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Команда</th>
                    </tr>
                  </thead>
                  <tbody>
                    {HOTKEYS_DEFAULT.filter(h => hotkeyFilter === "Все" || h.category === hotkeyFilter).map((h, i) => (
                      <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-5 py-2.5 text-gray-700 text-xs">{h.action}</td>
                        <td className="px-5 py-2.5">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">{h.category}</span>
                        </td>
                        <td className="px-5 py-2.5">
                          {editingKey === i ? (
                            <input autoFocus className="border border-indigo-400 rounded px-2 py-0.5 text-xs w-32 outline-none bg-indigo-50"
                              placeholder="Нажмите клавишу..."
                              onKeyDown={e => { e.preventDefault(); setCustomHotkeys(prev => ({ ...prev, [i]: e.key === "Escape" ? h.key : e.code })); setEditingKey(null) }}
                              onBlur={() => setEditingKey(null)} />
                          ) : (
                            <button onClick={() => setEditingKey(i)}
                              className="font-mono text-xs bg-gray-100 border border-gray-200 px-2 py-0.5 rounded hover:border-indigo-400 hover:bg-indigo-50 transition-all">
                              {customHotkeys[i] || h.key}
                            </button>
                          )}
                        </td>
                        <td className="px-5 py-2.5">
                          {h.cmd && <code className="text-[10px] bg-gray-800 text-green-400 px-2 py-0.5 rounded font-mono">{h.cmd}</code>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* ── Автоматизация ── */}
            <TabsContent value="automation" className="space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Icon name="Zap" size={16} className="text-indigo-600" />Автоматизация и надстройки
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { title: "AutoLISP", desc: "Скрипты на языке AutoLISP для автоматизации задач черчения", icon: "FileCode", color: "bg-orange-50 border-orange-200", status: "Доступно" },
                    { title: "Dynamo", desc: "Визуальное программирование — создание характерных линий, водосборов, меток", icon: "Zap", color: "bg-blue-50 border-blue-200", status: "Доступно" },
                    { title: ".NET API", desc: "Разработка плагинов на C# / VB.NET для расширения функционала", icon: "Code", color: "bg-purple-50 border-purple-200", status: "Доступно" },
                  ].map(a => (
                    <div key={a.title} className={`p-4 rounded-xl border space-y-2 ${a.color}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon name={a.icon} size={16} className="text-gray-700" fallback="Code" />
                          <span className="font-bold text-gray-800 text-sm">{a.title}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full">{a.status}</span>
                      </div>
                      <p className="text-xs text-gray-500">{a.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
                  <h4 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
                    <Icon name="Package" size={14} className="text-indigo-600" />Установленные надстройки
                  </h4>
                  {[
                    { name: "ORIS for ЛАПА", desc: "Оценка углеродного следа строительства дорог и ж/д", version: "v1.2", active: true },
                    { name: "GeoDin Ground", desc: "Геотехнический анализ свойств грунтов", version: "v2.0", active: true },
                    { name: "AutoReport", desc: "Автоматическое формирование отчётов по ГОСТ", version: "v1.0", active: false },
                  ].map(p => (
                    <div key={p.name} className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-200">
                      <div>
                        <div className="text-sm font-medium text-gray-800">{p.name} <span className="text-xs text-gray-400">{p.version}</span></div>
                        <div className="text-xs text-gray-400">{p.desc}</div>
                      </div>
                      <label className="flex items-center cursor-pointer">
                        <div className={`w-8 h-4 rounded-full transition-colors ${p.active ? "bg-indigo-600" : "bg-gray-200"}`}>
                          <div className={`w-3 h-3 rounded-full bg-white mt-0.5 transition-all ${p.active ? "ml-4" : "ml-0.5"}`} />
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  )
}