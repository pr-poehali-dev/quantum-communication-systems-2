import { useState, useEffect, useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import VersionFeaturesPanel from "@/modules/VersionFeaturesPanel"
import { ProjectContext } from "@/hooks/useProjectStore"

interface Project {
  id: number
  name: string
  type: string
  stage: string
  length: number
  status: "active" | "review" | "approved" | "archived"
  created: string
  updated: string
  versions: Version[]
  team: string[]
}

interface Version {
  id: number
  num: string
  date: string
  author: string
  comment: string
  size: string
}

const PROJECT_TYPES = ["Автодорога", "Железная дорога", "Инженерные сети", "Площадочный объект", "Мост / путепровод", "Иное"]
const STAGES = ["ПД — Проектная документация", "РД — Рабочая документация", "ТЭО", "Обоснование инвестиций", "Изыскания"]

const STATUS_COLORS: Record<string, string> = {
  active: "bg-blue-100 text-blue-700",
  review: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  archived: "bg-gray-100 text-gray-500",
}
const STATUS_LABELS: Record<string, string> = { active: "В работе", review: "На проверке", approved: "Утверждён", archived: "Архив" }

const API = "https://functions.poehali.dev/0413bfb5-1eee-4ebd-91f9-66e74d563887"

export default function ProjectsModule({ onNavigate }: { onNavigate?: (id: string) => void } = {}) {
  const store = useContext(ProjectContext)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeProject, setActiveProject] = useState<number | null>(
    store?.activeProject?.id ?? null
  )
  const [form, setForm] = useState({ name: "", type: PROJECT_TYPES[0], stage: STAGES[0], length: "" })
  const [versionComment, setVersionComment] = useState("")
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const current = projects.find(p => p.id === activeProject)

  // Загрузка проектов из БД
  useEffect(() => {
    setLoading(true)
    fetch(API)
      .then(r => r.json())
      .then((data: {id:number;name:string;description:string;type:string;status:string;created_at:string;updated_at:string;objects_count:number}[]) => {
        const mapped: Project[] = data.map(p => ({
          id: p.id,
          name: p.name,
          type: p.type === "road" ? "Автодорога" : p.type === "network" ? "Инженерные сети" : p.type,
          stage: "РД — Рабочая документация",
          length: 0,
          status: (p.status as Project["status"]) || "active",
          created: p.created_at.split(" ")[0],
          updated: p.updated_at.split(" ")[0],
          versions: [{ id: 1, num: "v1.0", date: p.created_at.split(" ")[0], author: "test@test", comment: "Создание проекта", size: "—" }],
          team: ["test@test"],
        }))
        setProjects(mapped)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const addProject = async () => {
    if (!form.name) return
    setSaving(true)
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, description: form.stage, type: "road", status: "active" }),
      })
      const p = await res.json()
      const now = new Date().toISOString().split("T")[0]
      setProjects(prev => [...prev, {
        id: p.id, name: p.name, type: form.type, stage: form.stage,
        length: +form.length || 0, status: "active", created: now, updated: now,
        versions: [{ id: 1, num: "v1.0", date: now, author: "test@test", comment: "Создание проекта", size: "—" }],
        team: ["test@test"],
      }])
      setForm(f => ({ ...f, name: "", length: "" }))
    } finally { setSaving(false) }
  }

  const addVersion = (pid: number) => {
    if (!versionComment) return
    const now = new Date().toISOString().split("T")[0]
    setProjects(prev => prev.map(p => {
      if (p.id !== pid) return p
      const last = p.versions[p.versions.length - 1]
      const [major, minor] = last.num.replace("v", "").split(".").map(Number)
      return { ...p, updated: now, versions: [...p.versions, { id: Date.now(), num: `v${major}.${minor + 1}`, date: now, author: "test@test", comment: versionComment, size: "—" }] }
    }))
    // Сохраняем объект-версию в БД
    fetch(API, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: pid, object_type: "version", name: versionComment, data: {} }) })
    setVersionComment("")
  }

  const setStatus = async (pid: number, status: Project["status"]) => {
    setProjects(prev => prev.map(p => p.id === pid ? { ...p, status } : p))
    await fetch(API, { method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: pid, status }) })
  }

  const deleteProject = (pid: number) => {
    setProjects(prev => prev.filter(p => p.id !== pid))
    if (activeProject === pid) setActiveProject(null)
  }

  const archiveProject = async (pid: number) => {
    setProjects(prev => prev.map(p => p.id === pid ? { ...p, status: "archived" } : p))
    setActiveProject(null)
    await fetch(API, { method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: pid, status: "archived" }) })
  }

  const restoreProject = async (pid: number) => {
    setProjects(prev => prev.map(p => p.id === pid ? { ...p, status: "active" } : p))
    await fetch(API, { method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: pid, status: "active" }) })
  }

  const filtered = projects.filter(p =>
    (filterStatus === "all" || p.status === filterStatus) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-muted-foreground gap-3">
      <Icon name="Loader" size={20} className="animate-spin" /> Загрузка проектов…
    </div>
  )

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <AnimatePresence mode="wait">
        {!activeProject ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-48">
                <Input placeholder="Поиск по названию…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* New project */}
            <div className="rounded-xl border border-dashed border-indigo-300 bg-indigo-50/40 p-4 space-y-3">
              <h3 className="font-semibold text-gray-800 text-sm">Новый проект</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><Label>Название</Label><Input placeholder="Мой проект" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><Label>Тип</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PROJECT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Стадия</Label>
                  <Select value={form.stage} onValueChange={v => setForm(f => ({ ...f, stage: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Длина объекта (м)</Label><Input type="number" placeholder="1000" value={form.length} onChange={e => setForm(f => ({ ...f, length: e.target.value }))} /></div>
              </div>
              <Button onClick={addProject} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                {saving ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="FolderPlus" size={16} />}
                {saving ? "Сохранение…" : "Создать проект"}
              </Button>
            </div>

            {/* Project cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={`rounded-2xl border bg-white p-5 hover:shadow-md transition-all ${p.status === "archived" ? "border-gray-100 opacity-70" : "border-gray-200 hover:border-indigo-300"}`}
                >
                  <div className="flex items-start justify-between mb-3 cursor-pointer" onClick={() => setActiveProject(p.id)}>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 text-sm leading-tight">{p.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{p.type} · {p.stage.split("—")[0].trim()}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ml-2 ${STATUS_COLORS[p.status]}`}>{STATUS_LABELS[p.status]}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Icon name="Ruler" size={11} />{p.length.toLocaleString()} м</span>
                    <span className="flex items-center gap-1"><Icon name="GitBranch" size={11} />{p.versions.length} вер.</span>
                    <span className="flex items-center gap-1"><Icon name="Users" size={11} />{p.team.length} уч.</span>
                    <span className="ml-auto">{p.updated}</span>
                    <div className="flex gap-1 ml-2" onClick={e => e.stopPropagation()}>
                      {p.status === "archived" ? (
                        <button title="Восстановить" onClick={() => restoreProject(p.id)}
                          className="p-1 rounded hover:bg-green-50 text-green-500 hover:text-green-700 transition-colors">
                          <Icon name="ArchiveRestore" size={14} />
                        </button>
                      ) : (
                        <button title="В архив" onClick={() => archiveProject(p.id)}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                          <Icon name="Archive" size={14} />
                        </button>
                      )}
                      <button title="Удалить проект" onClick={() => { if (confirm(`Удалить проект «${p.name}»?`)) deleteProject(p.id) }}
                        className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <Icon name="Trash2" size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : current ? (
          <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveProject(null)} className="text-gray-400 hover:text-gray-700"><Icon name="ChevronLeft" size={20} /></button>
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 font-heading">{current.name}</h2>
                <div className="text-sm text-muted-foreground">{current.type} · {current.stage}</div>
              </div>
              <span className={`ml-auto text-xs px-3 py-1 rounded-full font-semibold ${STATUS_COLORS[current.status]}`}>{STATUS_LABELS[current.status]}</span>
              {/* Открыть в редакторе — синхронизирует проект в store и переходит */}
              <button
                title="Открыть в ЛАПА — Редакторе"
                onClick={() => {
                  if (store) {
                    store.setActiveProject({
                      id: current.id,
                      name: current.name,
                      description: current.stage,
                      type: "road",
                      status: "active",
                      created_at: current.created,
                      updated_at: current.updated,
                      objects_count: current.versions.length,
                    })
                    store.notify(`Проект «${current.name}» открыт в редакторе`, "success")
                  }
                  onNavigate?.("civilcad")
                }}
                className="flex items-center gap-1.5 text-xs text-white border border-[#0078d4] bg-[#0078d4] rounded-lg px-3 py-1.5 hover:bg-[#005fa3] transition-colors">
                <Icon name="Monitor" size={13} /> Открыть в редакторе
              </button>
              {current.status !== "archived" ? (
                <button title="В архив" onClick={() => archiveProject(current.id)}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                  <Icon name="Archive" size={13} /> В архив
                </button>
              ) : (
                <button title="Восстановить" onClick={() => restoreProject(current.id)}
                  className="flex items-center gap-1.5 text-xs text-green-600 border border-green-200 rounded-lg px-3 py-1.5 hover:bg-green-50 transition-colors">
                  <Icon name="ArchiveRestore" size={13} /> Восстановить
                </button>
              )}
              <button title="Удалить" onClick={() => { if (confirm(`Удалить проект «${current.name}»?`)) deleteProject(current.id) }}
                className="flex items-center gap-1.5 text-xs text-red-500 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors">
                <Icon name="Trash2" size={13} /> Удалить
              </button>
            </div>

            <Tabs defaultValue="info">
              <TabsList>
                <TabsTrigger value="info">Информация</TabsTrigger>
                <TabsTrigger value="versions">Версии ({current.versions.length})</TabsTrigger>
                <TabsTrigger value="team">Команда</TabsTrigger>
                <TabsTrigger value="reports">Отчёты</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    ["Тип объекта", current.type],
                    ["Стадия", current.stage.split("—")[0].trim()],
                    ["Длина", `${current.length.toLocaleString()} м`],
                    ["Создан", current.created],
                    ["Обновлён", current.updated],
                    ["Версий", current.versions.length],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="text-xs text-muted-foreground mb-1">{k}</div>
                      <div className="font-bold text-gray-900">{v}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-700">Сменить статус:</span>
                  {(["active", "review", "approved", "archived"] as const).map(s => (
                    <button key={s} onClick={() => setStatus(current.id, s)} className={`text-xs px-3 py-1.5 rounded-full transition-all ${current.status === s ? STATUS_COLORS[s] + " font-bold" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="versions" className="space-y-3 mt-4">
                <div className="flex gap-3">
                  <Input placeholder="Комментарий к версии…" value={versionComment} onChange={e => setVersionComment(e.target.value)} className="flex-1" />
                  <Button onClick={() => addVersion(current.id)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"><Icon name="GitCommit" size={15} /> Зафиксировать</Button>
                </div>
                <div className="space-y-2">
                  {[...current.versions].reverse().map((v, i) => (
                    <div key={v.id} className={`rounded-xl border p-4 ${i === 0 ? "border-indigo-300 bg-indigo-50" : "border-gray-200 bg-white"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold text-sm ${i === 0 ? "text-indigo-700" : "text-gray-700"}`}>{v.num}</span>
                          {i === 0 && <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">актуальная</span>}
                        </div>
                        <span className="text-xs text-gray-400">{v.date} · {v.author}</span>
                      </div>
                      <div className="text-sm text-gray-600">{v.comment}</div>
                      {v.size !== "—" && <div className="text-xs text-gray-400 mt-1">{v.size}</div>}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="team" className="mt-4">
                <div className="space-y-2">
                  {current.team.map(member => (
                    <div key={member} className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">{member[0].toUpperCase()}</div>
                      <span className="font-semibold text-gray-800">{member}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="reports" className="mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { name: "Пояснительная записка", icon: "FileText", fmt: "DOCX" },
                    { name: "Ведомость объёмов", icon: "Table", fmt: "XLSX" },
                    { name: "Полный PDF-отчёт", icon: "FileDown", fmt: "PDF" },
                    { name: "Исходные данные", icon: "Database", fmt: "XML" },
                  ].map(r => (
                    <div key={r.name} className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-4">
                      <div className="rounded-xl bg-indigo-50 p-3"><Icon name={r.icon} size={20} className="text-indigo-600" fallback="File" /></div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 text-sm">{r.name}</div>
                        <div className="text-xs text-gray-400">{r.fmt}</div>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs gap-1"><Icon name="Download" size={13} />Скачать</Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <VersionFeaturesPanel categories={["collab", "platform"]} />
    </motion.div>
  )
}