import { useState, useCallback, useRef, ReactNode } from "react"
import {
  ProjectContext,
  ProjectStore,
  CivilProject,
  DrawingTab,
  CanvasObject,
  CivilPoint,
  CivilAlignment,
  CivilSurface,
  CivilCorridor,
  CivilPipe,
  CivilProfile,
  Layer,
} from "./useProjectStore"

const DEFAULT_LAYERS: Layer[] = [
  { name: "0", color: "#ffffff", visible: true, locked: false, lineType: "Непрерывная", lineWidth: 0.25 },
  { name: "Рельеф", color: "#4ade80", visible: true, locked: false, lineType: "Непрерывная", lineWidth: 0.5 },
  { name: "Трассы", color: "#f97316", visible: true, locked: false, lineType: "Непрерывная", lineWidth: 0.7 },
  { name: "Сети", color: "#60a5fa", visible: true, locked: false, lineType: "Непрерывная", lineWidth: 0.35 },
  { name: "Точки COGO", color: "#facc15", visible: true, locked: false, lineType: "Непрерывная", lineWidth: 0.18 },
  { name: "Коридоры", color: "#a855f7", visible: true, locked: false, lineType: "Непрерывная", lineWidth: 0.5 },
  { name: "Аннотации", color: "#e5e7eb", visible: true, locked: false, lineType: "Непрерывная", lineWidth: 0.18 },
  { name: "Оси", color: "#ef4444", visible: true, locked: false, lineType: "Штрихпунктирная", lineWidth: 0.35 },
]

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [activeProject, setActiveProject] = useState<CivilProject | null>(null)
  const [tabs, setTabs] = useState<DrawingTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [points, setPoints] = useState<CivilPoint[]>([])
  const [alignments, setAlignments] = useState<CivilAlignment[]>([])
  const [surfaces, setSurfaces] = useState<CivilSurface[]>([])
  const [corridors, setCorridors] = useState<CivilCorridor[]>([])
  const [pipes, setPipes] = useState<CivilPipe[]>([])
  const [profiles, setProfiles] = useState<CivilProfile[]>([])
  const [requestedModule, setRequestedModule] = useState<string | null>(null)
  const [layers, setLayers] = useState<Layer[]>(DEFAULT_LAYERS)
  const [activeTool, setActiveTool] = useState("select")
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ text: string; type: "info" | "success" | "error" } | null>(null)
  const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const notify = useCallback((text: string, type: "info" | "success" | "error" = "info") => {
    setNotification({ text, type })
    if (notifTimer.current) clearTimeout(notifTimer.current)
    notifTimer.current = setTimeout(() => setNotification(null), 3000)
  }, [])

  const openTab = useCallback((tab: DrawingTab) => {
    setTabs(prev => {
      const exists = prev.find(t => t.id === tab.id)
      if (exists) return prev
      return [...prev, tab]
    })
    setActiveTabId(tab.id)
  }, [])

  const closeTab = useCallback((id: string) => {
    setTabs(prev => {
      const next = prev.filter(t => t.id !== id)
      return next
    })
    setActiveTabId(prev => {
      if (prev !== id) return prev
      const remaining = tabs.filter(t => t.id !== id)
      return remaining.length > 0 ? remaining[remaining.length - 1].id : null
    })
  }, [tabs])

  const updateTabObjects = useCallback((tabId: string, objects: CanvasObject[]) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, objects, saved: false } : t))
  }, [])

  const updateTabView = useCallback((tabId: string, zoom: number, panX: number, panY: number) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, viewState: { zoom, panX, panY } } : t))
  }, [])

  const markTabSaved = useCallback((tabId: string) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, saved: true } : t))
  }, [])

  const addPoint = useCallback((p: CivilPoint) => setPoints(prev => [...prev, p]), [])
  const addAlignment = useCallback((a: CivilAlignment) => {
    setAlignments(prev => [...prev, a])
    notify(`Трасса «${a.name}» добавлена`, "success")
  }, [notify])
  const addSurface = useCallback((s: CivilSurface) => {
    setSurfaces(prev => [...prev, s])
    notify(`Поверхность «${s.name}» создана`, "success")
  }, [notify])
  const addCorridor = useCallback((c: CivilCorridor) => {
    setCorridors(prev => [...prev, c])
    notify(`Коридор «${c.name}» построен`, "success")
  }, [notify])
  const addPipe = useCallback((p: CivilPipe) => {
    setPipes(prev => [...prev, p])
    notify(`Трубопровод «${p.name}» добавлен`, "success")
  }, [notify])
  const addProfile = useCallback((p: CivilProfile) => {
    setProfiles(prev => [...prev, p])
    notify(`Профиль «${p.name}» построен`, "success")
  }, [notify])

  const deleteObject = useCallback((type: string, id: string) => {
    if (type === "point") setPoints(prev => prev.filter(p => p.id !== id))
    else if (type === "alignment") setAlignments(prev => prev.filter(a => a.id !== id))
    else if (type === "surface") setSurfaces(prev => prev.filter(s => s.id !== id))
    else if (type === "corridor") setCorridors(prev => prev.filter(c => c.id !== id))
    else if (type === "pipe") setPipes(prev => prev.filter(p => p.id !== id))
    else if (type === "profile") setProfiles(prev => prev.filter(p => p.id !== id))
    notify("Объект удалён", "info")
  }, [notify])

  const toggleLayer = useCallback((name: string) => {
    setLayers(prev => prev.map(l => l.name === name ? { ...l, visible: !l.visible } : l))
  }, [])

  const addLayer = useCallback((l: Layer) => {
    setLayers(prev => [...prev, l])
  }, [])

  const store: ProjectStore = {
    activeProject,
    setActiveProject,
    tabs,
    activeTabId,
    setActiveTabId,
    openTab,
    closeTab,
    updateTabObjects,
    updateTabView,
    markTabSaved,
    points,
    alignments,
    surfaces,
    corridors,
    pipes,
    profiles,
    addPoint,
    addAlignment,
    addSurface,
    addCorridor,
    addPipe,
    addProfile,
    deleteObject,
    requestedModule,
    setRequestedModule,
    layers,
    toggleLayer,
    addLayer,
    activeTool,
    setActiveTool,
    selectedObjectId,
    setSelectedObjectId,
    notification,
    notify,
  }

  return (
    <ProjectContext.Provider value={store}>
      {children}
    </ProjectContext.Provider>
  )
}
