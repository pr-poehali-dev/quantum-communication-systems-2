import { createContext, useContext, useState, useCallback, useRef } from "react"

// ─── Типы данных Civil 3D ─────────────────────────────────────────────────────

export interface CivilPoint {
  id: string
  no: number
  x: number
  y: number
  z: number
  code: string
  desc: string
  layer: string
}

export interface CivilAlignment {
  id: string
  name: string
  pts: [number, number][]
  color: string
  length: number
  layer: string
  type: "road" | "railway" | "utility"
  startStation: number
  endStation: number
}

export interface CivilSurface {
  id: string
  name: string
  type: "tin" | "grid" | "corridor"
  pts: [number, number, number][]
  color: string
  layer: string
  minZ: number
  maxZ: number
}

export interface CivilCorridor {
  id: string
  name: string
  alignmentId: string
  width: number
  pts: [number, number][]
  color: string
  layer: string
}

export interface CivilPipe {
  id: string
  name: string
  pts: [number, number][]
  diameter: number
  material: string
  slope: number
  layer: string
  color: string
  type: "gravity" | "pressure"
}

export interface CivilProfile {
  id: string
  name: string
  alignmentId: string
  pts: [number, number][]  // station, elevation
  type: "existing" | "design"
  color: string
}

export interface CanvasObject {
  id: string
  type: "line" | "polyline" | "point" | "text" | "rect" | "circle" | "arc" |
        "alignment" | "surface" | "corridor" | "pipe" | "profile" | "feature_line"
  label: string
  pts: [number, number][]
  color: string
  lineWidth?: number
  layer?: string
  selected?: boolean
  properties?: Record<string, string | number>
  z?: number
  radius?: number
  text?: string
}

export interface DrawingTab {
  id: string
  name: string
  projectId?: number
  saved: boolean
  objects: CanvasObject[]
  viewState: { zoom: number; panX: number; panY: number }
}

export interface CivilProject {
  id: number
  name: string
  description: string
  type: "road" | "network" | "railway" | "area" | "bim"
  status: "active" | "draft" | "archived" | "completed"
  created_at: string
  updated_at: string
  objects_count: number
}

// ─── Центральный Store ────────────────────────────────────────────────────────

export interface ProjectStore {
  // Текущий проект
  activeProject: CivilProject | null
  setActiveProject: (p: CivilProject | null) => void

  // Вкладки чертежей
  tabs: DrawingTab[]
  activeTabId: string | null
  setActiveTabId: (id: string) => void
  openTab: (tab: DrawingTab) => void
  closeTab: (id: string) => void
  updateTabObjects: (tabId: string, objects: CanvasObject[]) => void
  updateTabView: (tabId: string, zoom: number, panX: number, panY: number) => void
  markTabSaved: (tabId: string) => void

  // Объекты Civil 3D
  points: CivilPoint[]
  alignments: CivilAlignment[]
  surfaces: CivilSurface[]
  corridors: CivilCorridor[]
  pipes: CivilPipe[]
  profiles: CivilProfile[]

  addPoint: (p: CivilPoint) => void
  addAlignment: (a: CivilAlignment) => void
  addSurface: (s: CivilSurface) => void
  addCorridor: (c: CivilCorridor) => void
  addPipe: (p: CivilPipe) => void
  addProfile: (p: CivilProfile) => void
  deleteObject: (type: string, id: string) => void

  // Навигация между модулями
  requestedModule: string | null
  setRequestedModule: (id: string | null) => void

  // Слои
  layers: Layer[]
  toggleLayer: (name: string) => void
  addLayer: (l: Layer) => void

  // Активный инструмент (глобально)
  activeTool: string
  setActiveTool: (t: string) => void

  // Выбранный объект
  selectedObjectId: string | null
  setSelectedObjectId: (id: string | null) => void

  // Уведомление для UI
  notification: { text: string; type: "info" | "success" | "error" } | null
  notify: (text: string, type?: "info" | "success" | "error") => void
}

export interface Layer {
  name: string
  color: string
  visible: boolean
  locked: boolean
  lineType: string
  lineWidth: number
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const ProjectContext = createContext<ProjectStore | null>(null)

export function useProjectStore(): ProjectStore {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error("useProjectStore must be used within ProjectProvider")
  return ctx
}