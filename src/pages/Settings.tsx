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

const HOTKEYS = [
  { action: "Открыть диалог коридора", key: "Двойной клик на холсте" },
  { action: "Приблизить", key: "Scroll вверх / +" },
  { action: "Отдалить", key: "Scroll вниз / −" },
  { action: "Перемещение по холсту", key: "Зажать и тянуть (ЛКМ)" },
  { action: "Вписать вид", key: "Команда: ZOOM E" },
  { action: "Регенерировать", key: "Команда: REGEN" },
  { action: "Создать коридор", key: "Команда: CREATECORRIDOR" },
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
  const [lang] = useState("Русский")

  const [oldPwd, setOldPwd] = useState("")
  const [newPwd, setNewPwd] = useState("")
  const [confirmPwd, setConfirmPwd] = useState("")
  const [pwdMsg, setPwdMsg] = useState("")

  const saveProfile = () => {
    localStorage.setItem("civilpro_profile", JSON.stringify({ ...profile, name, timezone, avatar, theme, units }))
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

  const initials = name.trim().split(" ").slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "???"

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
                  <Select value={lang} onValueChange={() => {}}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Русский">Русский</SelectItem>
                      <SelectItem value="English" disabled>English (скоро)</SelectItem>
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
            <TabsContent value="hotkeys">
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                  <p className="text-sm text-muted-foreground">Горячие клавиши и команды CivilCAD-редактора</p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-5 py-2.5 font-semibold text-gray-700">Действие</th>
                      <th className="text-right px-5 py-2.5 font-semibold text-gray-700">Клавиша / команда</th>
                    </tr>
                  </thead>
                  <tbody>
                    {HOTKEYS.map((h, i) => (
                      <tr key={h.action} className={`border-b border-gray-100 ${i % 2 === 0 ? "" : "bg-gray-50/40"}`}>
                        <td className="px-5 py-3 text-gray-700">{h.action}</td>
                        <td className="px-5 py-3 text-right">
                          <kbd className="bg-gray-100 border border-gray-300 rounded px-2 py-0.5 text-xs font-mono text-gray-700">{h.key}</kbd>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  )
}