import { useRef, useState, useEffect, useCallback, useContext } from "react"
import Icon from "@/components/ui/icon"
import { VersionFeaturesInline } from "@/modules/VersionFeaturesPanel"
import { ProjectContext } from "@/hooks/useProjectStore"

// ─── Типы ────────────────────────────────────────────────────────────────────

interface Vec3 { x: number; y: number; z: number }
interface Cam { yaw: number; pitch: number; dist: number; tx: number; tz: number }

interface SloyState {
  рельеф: boolean; дорога: boolean; сети: boolean
  здания: boolean; съёмка: boolean; сетка: boolean; каркас: boolean
  горизонтали: boolean; поперечники: boolean; пикеты: boolean
}

// ─── Константы ───────────────────────────────────────────────────────────────

const СЛОИ: { key: keyof SloyState; label: string; icon: string; color: string }[] = [
  { key: "рельеф",      label: "Рельеф",       icon: "Mountain",      color: "#4ade80" },
  { key: "дорога",      label: "Дорога",        icon: "Route",         color: "#f97316" },
  { key: "сети",        label: "Сети",          icon: "Network",       color: "#60a5fa" },
  { key: "здания",      label: "Здания",        icon: "Building2",     color: "#a855f7" },
  { key: "съёмка",      label: "Съёмка",        icon: "MapPin",        color: "#f59e0b" },
  { key: "сетка",       label: "Сетка",         icon: "Grid3x3",       color: "#94a3b8" },
  { key: "горизонтали", label: "Горизонтали",   icon: "Layers",        color: "#34d399" },
  { key: "поперечники", label: "Поперечники",   icon: "Minus",         color: "#fb923c" },
  { key: "пикеты",      label: "Пикеты",        icon: "Milestone",     color: "#e879f9" },
  { key: "каркас",      label: "Каркас",        icon: "Hexagon",       color: "#cbd5e1" },
]

const РЕЖИМЫ_ОТОБРАЖЕНИЯ = ["Тонирование", "Каркас", "Горизонтали", "Уклоны", "Высоты", "Ночной"]
const ВИДЫ = ["3D перспектива", "Сверху (план)", "Спереди", "Сбоку", "Изометрия"]
const АНИМАЦИИ = ["Облёт объекта", "Проезд по трассе", "Облёт вертолёта"]

// ─── Рельеф ──────────────────────────────────────────────────────────────────

function высота(x: number, z: number): number {
  return (
    Math.sin(x * 0.28) * 2.8 +
    Math.cos(z * 0.21) * 2.2 +
    Math.sin(x * 0.6 + z * 0.43) * 1.1 +
    Math.cos(x * 0.14 + z * 0.56) * 1.6 +
    Math.sin(x * 0.08 - z * 0.12) * 0.8
  )
}

function уклон(x: number, z: number): number {
  const dx = (высота(x + 0.1, z) - высота(x - 0.1, z)) / 0.2
  const dz = (высота(x, z + 0.1) - высота(x, z - 0.1)) / 0.2
  return Math.sqrt(dx * dx + dz * dz)
}

// ─── Проекция ────────────────────────────────────────────────────────────────

function проецировать(
  p: Vec3, cx: number, cy: number, cz: number,
  yaw: number, pitch: number, fov: number, W: number, H: number
): { sx: number; sy: number; d: number } | null {
  let dx = p.x - cx, dy = p.y - cy, dz = p.z - cz
  const cosY = Math.cos(-yaw), sinY = Math.sin(-yaw)
  const tx = dx * cosY - dz * sinY, tz2 = dx * sinY + dz * cosY
  dx = tx; dz = tz2
  const cosP = Math.cos(-pitch), sinP = Math.sin(-pitch)
  const ty = dy * cosP - dz * sinP, tz3 = dy * sinP + dz * cosP
  dy = ty; dz = tz3
  if (dz < 0.5) return null
  const f = fov / dz
  return { sx: W / 2 + dx * f, sy: H / 2 - dy * f, d: dz }
}

// ─── Цвета рельефа ───────────────────────────────────────────────────────────

function цветРельефа(h: number, режим: string, uk: number): string {
  if (режим === "Каркас") return `hsla(220,70%,65%,0.8)`
  if (режим === "Горизонтали") return `hsla(140,50%,${30 + h * 3}%,0.9)`
  if (режим === "Уклоны") {
    const s = uk * 100
    if (s < 3) return "#4ade80"
    if (s < 8) return "#facc15"
    if (s < 15) return "#fb923c"
    return "#ef4444"
  }
  if (режим === "Высоты") {
    const t = Math.max(0, Math.min(1, (h + 5) / 10))
    const hue = 240 - t * 240
    return `hsl(${hue},70%,45%)`
  }
  if (режим === "Ночной") {
    const t = Math.max(0, Math.min(1, (h + 5) / 10))
    return `hsl(220,${30 + t * 20}%,${8 + t * 12}%)`
  }
  // Тонирование
  const t = Math.max(0, Math.min(1, (h + 5) / 10))
  if (t < 0.2) return `hsl(${120 - t * 60},${55 + t * 15}%,${28 + t * 12}%)`
  if (t < 0.5) return `hsl(${108 - (t - 0.2) * 130},50%,${38 + (t - 0.2) * 8}%)`
  if (t < 0.75) return `hsl(${30 - (t - 0.5) * 40},40%,${45 + (t - 0.5) * 10}%)`
  return `hsl(10,20%,${55 + (t - 0.75) * 20}%)`
}

// ─── Главный компонент ───────────────────────────────────────────────────────

export default function Viewer3DModule({ onNavigate }: { onNavigate?: (id: string) => void } = {}) {
  // ── Project store — синхронизация с редактором ────────────────────────────
  const store = useContext(ProjectContext)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drag = useRef<{ x: number; y: number; btn: number } | null>(null)
  const cam = useRef<Cam>({ yaw: 0.3, pitch: 0.52, dist: 48, tx: 0, tz: 0 })
  const touch = useRef<{ x: number; y: number; d: number } | null>(null)
  const animRef = useRef<{ active: boolean; t: number; type: string }>({ active: false, t: 0, type: "" })
  const измерRef = useRef<{ pts: Vec3[]; active: boolean }>({ pts: [], active: false })

  const [слои, setСлои] = useState<SloyState>({
    рельеф: true, дорога: true, сети: true,
    здания: true, съёмка: true, сетка: true,
    горизонтали: false, поперечники: false, пикеты: true, каркас: false,
  })
  const [режим, setРежим] = useState("Тонирование")
  const [вид, setВид] = useState("3D перспектива")
  const [ширДор, setШирДор] = useState(7)
  const [высотаСолнца, setВысотаСолнца] = useState(55)
  const [showFn, setShowFn] = useState(false)
  const [showПанель, setShowПанель] = useState(true)
  const [showИнфо, setShowИнфо] = useState(false)
  const [showЗамер, setShowЗамер] = useState(false)
  const [расстояние, setРасстояние] = useState<number | null>(null)
  const [animТип, setAnimТип] = useState(АНИМАЦИИ[0])
  const [animActive, setAnimActive] = useState(false)
  const [showСечение, setShowСечение] = useState(false)
  const [сечениеПК, setСечениеПК] = useState(500)
  // ViewCube + Section Plane + Isolate
  const [showViewCube, setShowViewCube] = useState(true)
  const [sectionPlaneActive, setSectionPlaneActive] = useState(false)
  const [sectionPlaneY, setSectionPlaneY] = useState(0)
  const [isolatedLayers, setIsolatedLayers] = useState<Set<keyof SloyState>>(new Set())
  const [namedViews, setNamedViews] = useState([
    {name:"Обзор (3D)",yaw:0.3,pitch:0.52,dist:48,tx:0,tz:0},
    {name:"Сверху (план)",yaw:0,pitch:1.57,dist:50,tx:0,tz:0},
    {name:"Фасад (юг)",yaw:0,pitch:0.15,dist:50,tx:0,tz:0},
    {name:"Изометрия",yaw:0.785,pitch:0.615,dist:45,tx:0,tz:0},
  ])
  const [showViewsPanel, setShowViewsPanel] = useState(false)
  const [showSectionPanel, setShowSectionPanel] = useState(false)
  const [ambientLight, setAmbientLight] = useState(60)
  const [showStats, setShowStats] = useState(false)

  const сбросИзоляции = () => setIsolatedLayers(new Set())
  const изолировать = (k: keyof SloyState) => {
    setIsolatedLayers(new Set([k]))
    setСлои(s => {
      const n = {...s}
      ;(Object.keys(n) as (keyof SloyState)[]).forEach(key => { n[key] = key === k })
      return n
    })
  }

  const слоиRef = useRef(слои)
  const режимRef = useRef(режим)
  const видRef = useRef(вид)
  const ширRef = useRef(ширДор)
  const солнцеRef = useRef(высотаСолнца)
  // Ref для live-объектов из редактора (чтобы анимационный цикл всегда видел актуальное)
  const liveObjsRef = useRef<import("@/hooks/useProjectStore").CanvasObject[]>([])
  useEffect(() => { слоиRef.current = слои }, [слои])
  useEffect(() => { режимRef.current = режим; if (режим === "Каркас") setСлои(s => ({ ...s, каркас: true })) }, [режим])
  useEffect(() => { видRef.current = вид }, [вид])
  useEffect(() => { ширRef.current = ширДор }, [ширДор])
  useEffect(() => { солнцеRef.current = высотаСолнца }, [высотаСолнца])
  // Синхронизируем ref с store при каждом изменении live-объектов
  useEffect(() => {
    if (store) liveObjsRef.current = store.liveCanvasObjects
  }, [store?.liveCanvasObjects])

  const переключитьСлой = (k: keyof SloyState) => setСлои(s => ({ ...s, [k]: !s[k] }))

  // ── Рендер ──────────────────────────────────────────────────────────────────

  const рендер = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || canvas.width < 10 || canvas.height < 10) return
    const ctx = canvas.getContext("2d")!
    const W = canvas.width, Hc = canvas.height
    const реж = режимRef.current
    const лр = слоиRef.current
    const rw = ширRef.current
    const { yaw, pitch, dist, tx, tz } = cam.current
    const sA = (солнцеRef.current / 180) * Math.PI

    // Анимация камеры
    if (animRef.current.active) {
      animRef.current.t += 0.008
      const t = animRef.current.t
      if (animRef.current.type === АНИМАЦИИ[0]) { // Облёт объекта
        cam.current.yaw = t * 0.5
        cam.current.pitch = 0.4 + Math.sin(t * 0.3) * 0.15
        cam.current.dist = 45 + Math.sin(t * 0.7) * 10
      } else if (animRef.current.type === АНИМАЦИИ[1]) { // Проезд по трассе
        const tc = t * 0.4
        cam.current.tx = tc * 0.8 + Math.sin(tc * 0.13) * 4 - 20
        cam.current.tz = Math.cos(tc * 0.11) * 6 + tc * 0.3
        cam.current.yaw = 0.13 + Math.cos(tc * 0.11) * 0.15
        cam.current.pitch = 0.18
        cam.current.dist = 8
      } else { // Облёт вертолёта
        cam.current.yaw = t * 0.3
        cam.current.pitch = 0.7 + Math.sin(t * 0.2) * 0.1
        cam.current.dist = 35 + Math.sin(t) * 5
      }
    }

    // Вид сверху / спереди / сбоку
    const вид = видRef.current
    if (вид === "Сверху (план)") {
      cam.current.pitch = Math.PI / 2 - 0.01
    } else if (вид === "Спереди") {
      cam.current.pitch = 0.1; cam.current.yaw = 0
    } else if (вид === "Сбоку") {
      cam.current.pitch = 0.1; cam.current.yaw = Math.PI / 2
    } else if (вид === "Изометрия") {
      cam.current.pitch = 0.615; cam.current.yaw = Math.PI / 4
    }

    const cx = tx + Math.sin(cam.current.yaw) * dist * Math.cos(cam.current.pitch)
    const cy = dist * Math.sin(cam.current.pitch)
    const cz = tz + Math.cos(cam.current.yaw) * dist * Math.cos(cam.current.pitch)
    const fov = Math.min(W, Hc) * 1.45
    const prj = (p: Vec3) => проецировать(p, cx, cy, cz, cam.current.yaw, cam.current.pitch, fov, W, Hc)

    const ночь = реж === "Ночной" || высотаСолнца < 12 || высотаСолнца > 168

    // Небо
    const sky = ctx.createLinearGradient(0, 0, 0, Hc)
    if (ночь) { sky.addColorStop(0, "#020917"); sky.addColorStop(1, "#0a1535") }
    else { sky.addColorStop(0, "#2563eb"); sky.addColorStop(0.6, "#93c5fd"); sky.addColorStop(1, "#e0f2fe") }
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, Hc)

    // Звёзды (ночь)
    if (ночь) {
      ctx.fillStyle = "rgba(255,255,255,0.7)"
      for (let i = 0; i < 80; i++) {
        const sx = ((i * 137.5 + 11) % W), sy = ((i * 83.7 + 7) % (Hc * 0.6))
        ctx.fillRect(sx, sy, 1, 1)
      }
    }

    // Солнце/луна
    if (!ночь) {
      const sx2 = W * 0.78, sy2 = Hc * (0.45 - Math.sin(sA) * 0.38)
      const glow = ctx.createRadialGradient(sx2, sy2, 0, sx2, sy2, 90)
      glow.addColorStop(0, "rgba(255,245,120,0.5)"); glow.addColorStop(1, "rgba(255,245,120,0)")
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, Hc)
      ctx.beginPath(); ctx.arc(sx2, sy2, 16, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(255,240,80,0.9)"; ctx.fill()
    } else {
      ctx.beginPath(); ctx.arc(W * 0.8, 40, 10, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(220,230,255,0.9)"; ctx.fill()
    }

    // Рельеф
    const SZ = 42, STEP = 2.0, COLS = Math.ceil(SZ / STEP)
    type Quad = { p: { sx: number; sy: number }[]; d: number; h: number; uk: number }
    const quads: Quad[] = []
    for (let r = 0; r < COLS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x0 = -SZ / 2 + c * STEP, z0 = -SZ / 2 + r * STEP
        const x1 = x0 + STEP, z1 = z0 + STEP
        const corners: Vec3[] = [
          { x: x0, y: высота(x0, z0), z: z0 }, { x: x1, y: высота(x1, z0), z: z0 },
          { x: x1, y: высота(x1, z1), z: z1 }, { x: x0, y: высота(x0, z1), z: z1 },
        ]
        const ps = corners.map(v => prj(v))
        if (ps.some(p => !p)) continue
        const d = ps.reduce((s, p) => s + p!.d, 0) / 4
        const h = corners.reduce((s, v) => s + v.y, 0) / 4
        const uk = уклон((x0 + x1) / 2, (z0 + z1) / 2)
        quads.push({ p: ps.map(p => ({ sx: p!.sx, sy: p!.sy })), d, h, uk })
      }
    }
    quads.sort((a, b) => b.d - a.d)

    if (лр.рельеф) {
      const shade = реж === "Ночной" ? 0.5 : Math.max(0.55, Math.sin(sA) * 0.45 + 0.75)
      quads.forEach(q => {
        ctx.beginPath()
        ctx.moveTo(q.p[0].sx, q.p[0].sy)
        q.p.slice(1).forEach(p => ctx.lineTo(p.sx, p.sy))
        ctx.closePath()
        const isWire = лр.каркас || реж === "Каркас"
        if (!isWire) {
          ctx.fillStyle = цветРельефа(q.h, реж, q.uk)
          ctx.globalAlpha = shade; ctx.fill(); ctx.globalAlpha = 1
        }
        ctx.strokeStyle = isWire ? цветРельефа(q.h, "Каркас", q.uk) : "rgba(0,0,0,0.07)"
        ctx.lineWidth = isWire ? 0.5 : 0.2; ctx.stroke()
      })
    }

    // Горизонтали
    if (лр.горизонтали) {
      for (let lev = -4; lev <= 8; lev++) {
        const major = lev % 5 === 0
        ctx.beginPath(); let first = true
        for (let xi = 0; xi <= 60; xi++) {
          const x = -SZ / 2 + xi / 60 * SZ
          for (let zi = 0; zi <= 60; zi++) {
            const z = -SZ / 2 + zi / 60 * SZ
            if (Math.abs(высота(x, z) - lev) < 0.12) {
              const p = prj({ x, y: lev + 0.05, z })
              if (p) { if (first) { ctx.moveTo(p.sx, p.sy) } else { ctx.lineTo(p.sx, p.sy) }; first = false }
            }
          }
        }
        ctx.strokeStyle = major ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.2)"
        ctx.lineWidth = major ? 1.2 : 0.5; ctx.stroke()
        if (major) {
          const lp = prj({ x: -SZ / 2 + 2, y: lev + 0.05, z: 0 })
          if (lp) {
            ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.font = "bold 9px sans-serif"
            ctx.fillText(`${lev}м`, lp.sx, lp.sy)
          }
        }
      }
    }

    // Координатная подложка-сетка с подписями
    if (лр.сетка) {
      // Тонкая сетка 5м
      ctx.strokeStyle = ночь ? "rgba(60,80,140,0.15)" : "rgba(148,163,184,0.12)"; ctx.lineWidth = 0.3
      for (let v = -SZ / 2; v <= SZ / 2; v += 5) {
        const a = prj({ x: v, y: 0, z: -SZ / 2 }), b = prj({ x: v, y: 0, z: SZ / 2 })
        if (a && b) { ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke() }
        const c2 = prj({ x: -SZ / 2, y: 0, z: v }), d2 = prj({ x: SZ / 2, y: 0, z: v })
        if (c2 && d2) { ctx.beginPath(); ctx.moveTo(c2.sx, c2.sy); ctx.lineTo(d2.sx, d2.sy); ctx.stroke() }
      }
      // Жирная сетка 10м
      ctx.strokeStyle = ночь ? "rgba(80,100,180,0.35)" : "rgba(100,120,160,0.35)"; ctx.lineWidth = 0.7
      for (let v = -SZ / 2; v <= SZ / 2; v += 10) {
        const a = prj({ x: v, y: 0, z: -SZ / 2 }), b = prj({ x: v, y: 0, z: SZ / 2 })
        if (a && b) { ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke() }
        const c2 = prj({ x: -SZ / 2, y: 0, z: v }), d2 = prj({ x: SZ / 2, y: 0, z: v })
        if (c2 && d2) { ctx.beginPath(); ctx.moveTo(c2.sx, c2.sy); ctx.lineTo(d2.sx, d2.sy); ctx.stroke() }
        // Подписи координат
        const lbl = prj({ x: v, y: 0.1, z: -SZ / 2 })
        if (lbl && v !== -SZ/2) {
          ctx.font = "7px monospace"; ctx.fillStyle = ночь ? "rgba(100,140,220,0.6)" : "rgba(80,100,140,0.7)"
          ctx.fillText(`${(v*10).toFixed(0)}`, lbl.sx - 6, lbl.sy - 2)
        }
      }
      // Оси координат
      const ox = prj({ x: 0, y: 0.15, z: 0 })
      const oxEnd = prj({ x: 8, y: 0.15, z: 0 })
      const ozEnd = prj({ x: 0, y: 0.15, z: 8 })
      if (ox && oxEnd) {
        ctx.beginPath(); ctx.moveTo(ox.sx, ox.sy); ctx.lineTo(oxEnd.sx, oxEnd.sy)
        ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 1.5; ctx.stroke()
        ctx.fillStyle = "#ef4444"; ctx.font = "bold 9px sans-serif"; ctx.fillText("X", oxEnd.sx+2, oxEnd.sy)
      }
      if (ox && ozEnd) {
        ctx.beginPath(); ctx.moveTo(ox.sx, ox.sy); ctx.lineTo(ozEnd.sx, ozEnd.sy)
        ctx.strokeStyle = "#22c55e"; ctx.lineWidth = 1.5; ctx.stroke()
        ctx.fillStyle = "#22c55e"; ctx.font = "bold 9px sans-serif"; ctx.fillText("Y", ozEnd.sx+2, ozEnd.sy)
      }
    }

    // Инженерные сети
    if (лр.сети) {
      const СЕТИ = [
        { z: -7, dy: -0.5, color: ночь ? "#60a5fa" : "#3b82f6", lw: 4, label: "Водопровод Ø200" },
        { z: -4, dy: -1.2, color: "#78716c", lw: 5, label: "Канализация Ø300" },
        { z: -10, dy: 0.2, color: ночь ? "#fbbf24" : "#f59e0b", lw: 2.5, label: "Теплосеть 2×Ø100" },
        { z: -13, dy: 0.5, color: "#f43f5e", lw: 1.5, label: "Кабель 10кВ" },
      ]
      СЕТИ.forEach(pp => {
        const pts: { sx: number; sy: number }[] = []
        for (let xp = -SZ / 2; xp <= SZ / 2; xp += 2) {
          const pr = prj({ x: xp, y: высота(xp, pp.z) + pp.dy, z: pp.z })
          if (pr) pts.push(pr)
        }
        if (pts.length < 2) return
        ctx.beginPath(); ctx.moveTo(pts[0].sx, pts[0].sy)
        pts.slice(1).forEach(p => ctx.lineTo(p.sx, p.sy))
        ctx.strokeStyle = pp.color; ctx.lineWidth = pp.lw
        if (ночь) { ctx.shadowColor = pp.color; ctx.shadowBlur = 6 }
        ctx.stroke(); ctx.shadowBlur = 0
        const lp = prj({ x: -SZ / 2 + 5, y: высота(-SZ / 2 + 5, pp.z) + pp.dy + 1.5, z: pp.z })
        if (lp) {
          ctx.font = "bold 9px Arial"; const tw = ctx.measureText(pp.label).width + 8
          ctx.fillStyle = pp.color + "cc"; ctx.fillRect(lp.sx - 2, lp.sy - 12, tw, 15)
          ctx.fillStyle = "white"; ctx.fillText(pp.label, lp.sx + 2, lp.sy - 1)
        }
      })
    }

    // 3D-Коридор дорожного полотна (насыпи, выемки, откосы)
    if (лр.дорога && лр.рельеф) {
      const slopeColor = ночь ? "rgba(180,150,80,0.35)" : "rgba(160,130,60,0.4)"
      const cutColor = ночь ? "rgba(100,80,50,0.35)" : "rgba(140,110,70,0.4)"
      const N2 = 40, slopeW = 6, slope = 1.5
      for (let i = 0; i < N2; i++) {
        const t0 = (i / N2) * SZ - SZ / 2
        const t1 = ((i + 1) / N2) * SZ - SZ / 2
        for (const t of [t0, t1].slice(0, 1)) {
          const xc = t * 0.8 + Math.sin(t * 0.13) * 4
          const zc = Math.cos(t * 0.11) * 6 + t * 0.3
          const yc = высота(xc, zc) + 0.1
          const yTerrain = высота(xc, zc)
          const diff = yc - yTerrain  // насыпь > 0, выемка < 0
          const ang = Math.atan2(Math.cos(t * 0.11) * -6 * 0.11, 0.8 + Math.cos(t * 0.13) * 4 * 0.13)
          const px2 = Math.cos(ang + Math.PI / 2), pz2 = Math.sin(ang + Math.PI / 2)
          const halfW = rw / 2
          // Откос слева
          const edgeL = { x: xc - px2 * halfW, y: yc, z: zc - pz2 * halfW }
          const daylightL = { x: xc - px2 * (halfW + slopeW + Math.abs(diff) * slope), y: высота(xc - px2 * (halfW + slopeW), zc - pz2 * (halfW + slopeW)), z: zc - pz2 * (halfW + slopeW) }
          const p0 = prj(edgeL), p1 = prj(daylightL)
          if (p0 && p1) {
            ctx.beginPath(); ctx.moveTo(p0.sx, p0.sy); ctx.lineTo(p1.sx, p1.sy)
            ctx.strokeStyle = diff > 0 ? slopeColor : cutColor; ctx.lineWidth = 1.5; ctx.stroke()
          }
        }
      }
    }

    // Дорога
    if (лр.дорога) {
      const N = 80
      const roadPts: { sx: number; sy: number }[][] = [[], []]
      const centrePts: { sx: number; sy: number; xc: number; zc: number; i: number }[] = []
      for (let i = 0; i <= N; i++) {
        const t = (i / N) * SZ - SZ / 2
        const xc = t * 0.8 + Math.sin(t * 0.13) * 4
        const zc = Math.cos(t * 0.11) * 6 + t * 0.3
        const yc = высота(xc, zc) + 0.1
        const side = rw / 2
        const ang = Math.atan2(Math.cos(t * 0.11) * -6 * 0.11, 0.8 + Math.cos(t * 0.13) * 4 * 0.13)
        const px = Math.cos(ang + Math.PI / 2), pz = Math.sin(ang + Math.PI / 2)
        const l = prj({ x: xc - px * side, y: yc, z: zc - pz * side })
        const r2 = prj({ x: xc + px * side, y: yc, z: zc + pz * side })
        const m = prj({ x: xc, y: yc, z: zc })
        if (l) roadPts[0].push(l); if (r2) roadPts[1].push(r2)
        if (m) centrePts.push({ ...m, xc, zc, i })
      }
      if (roadPts[0].length > 1) {
        ctx.beginPath()
        ctx.moveTo(roadPts[0][0].sx, roadPts[0][0].sy)
        roadPts[0].slice(1).forEach(p => ctx.lineTo(p.sx, p.sy))
        roadPts[1].slice().reverse().forEach(p => ctx.lineTo(p.sx, p.sy))
        ctx.closePath()
        ctx.fillStyle = ночь ? "rgba(20,25,45,0.95)" : "rgba(35,40,55,0.9)"; ctx.fill()
        ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 0.7; ctx.stroke()
        // Разметка осевая
        for (let i = 2; i < roadPts[0].length - 2; i += 5) {
          const lp = roadPts[0][i], rp = roadPts[1][i]
          const mx = (lp.sx + rp.sx) / 2, my = (lp.sy + rp.sy) / 2
          const np = roadPts[0][i + 1], nrp = roadPts[1][i + 1]
          if (!np || !nrp) continue
          const nx2 = (np.sx + nrp.sx) / 2, ny2 = (np.sy + nrp.sy) / 2
          const dl = Math.sqrt((nx2 - mx) ** 2 + (ny2 - my) ** 2)
          if (dl > 2) {
            ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(nx2, ny2)
            ctx.strokeStyle = "rgba(255,220,0,0.75)"; ctx.lineWidth = 1.2; ctx.stroke()
          }
        }
        // Краевая разметка
        ctx.setLineDash([])
        if (roadPts[0].length > 1) {
          ctx.beginPath(); ctx.moveTo(roadPts[0][0].sx, roadPts[0][0].sy)
          roadPts[0].slice(1).forEach(p => ctx.lineTo(p.sx, p.sy))
          ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 0.8; ctx.stroke()
          ctx.beginPath(); ctx.moveTo(roadPts[1][0].sx, roadPts[1][0].sy)
          roadPts[1].slice(1).forEach(p => ctx.lineTo(p.sx, p.sy))
          ctx.stroke()
        }
      }

      // Пикеты
      if (лр.пикеты) {
        centrePts.forEach(({ sx, sy, xc, zc, i }) => {
          const pk = Math.round(i * SZ / N * 10)
          if (pk % 20 !== 0) return
          const h = высота(xc, zc) + 0.1
          const top = prj({ x: xc, y: h + 4, z: zc })
          if (!top) return
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(top.sx, top.sy)
          ctx.strokeStyle = "#e879f9"; ctx.lineWidth = 1.2; ctx.stroke()
          ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2)
          ctx.fillStyle = "#e879f9"; ctx.fill()
          const pkStr = `ПК ${Math.floor(pk / 10)}+${String(pk % 10 * 10).padStart(2, "0")}`
          ctx.font = "bold 8px Arial"; const tw = ctx.measureText(pkStr).width + 6
          ctx.fillStyle = "rgba(100,0,120,0.8)"; ctx.fillRect(top.sx - tw / 2, top.sy - 13, tw, 14)
          ctx.fillStyle = "#f0e6ff"; ctx.textAlign = "center"; ctx.fillText(pkStr, top.sx, top.sy - 2); ctx.textAlign = "left"
        })
      }

      // Поперечник (сечение)
      if (лр.поперечники) {
        const mi = Math.floor(centrePts.length * 0.4)
        const cp = centrePts[mi]
        if (cp) {
          const xc = cp.xc, zc = cp.zc, yc = высота(xc, zc) + 0.1
          const ang = Math.atan2(Math.cos(zc * 0.11) * -0.066, 0.8 - Math.sin(xc * 0.13) * 0.52)
          const px = Math.cos(ang + Math.PI / 2), pz = Math.sin(ang + Math.PI / 2)
          for (let s = -rw * 2; s <= rw * 2; s += 1) {
            const p = prj({ x: xc + px * s, y: yc + 0.05, z: zc + pz * s })
            const p2 = prj({ x: xc + px * (s + 1), y: yc + 0.05, z: zc + pz * (s + 1) })
            if (p && p2) {
              ctx.beginPath(); ctx.moveTo(p.sx, p.sy); ctx.lineTo(p2.sx, p2.sy)
              ctx.strokeStyle = Math.abs(s) <= rw / 2 ? "#fb923c" : "#64748b"
              ctx.lineWidth = 2.5; ctx.stroke()
            }
          }
        }
      }
    }

    // Здания
    if (лр.здания) {
      const ЗДАНИЯ = [
        { x: -14, z: 11, w: 7, d: 5, bh: 9, color: [148, 163, 184] as [number, number, number], label: "Корпус А" },
        { x: 1, z: 13, w: 9, d: 7, bh: 13, color: [167, 139, 250] as [number, number, number], label: "Корпус Б" },
        { x: 14, z: 11, w: 6, d: 5, bh: 6, color: [110, 231, 183] as [number, number, number], label: "Склад В" },
        { x: -8, z: -15, w: 5, d: 4, bh: 4, color: [251, 191, 36] as [number, number, number], label: "КПП" },
      ]
      ЗДАНИЯ.forEach(b => {
        const gy = высота(b.x, b.z), hw = b.w / 2, hd = b.d / 2
        const faces: [Vec3, Vec3, Vec3, Vec3][] = [
          [{ x: b.x - hw, y: gy, z: b.z + hd }, { x: b.x + hw, y: gy, z: b.z + hd }, { x: b.x + hw, y: gy + b.bh, z: b.z + hd }, { x: b.x - hw, y: gy + b.bh, z: b.z + hd }],
          [{ x: b.x + hw, y: gy, z: b.z - hd }, { x: b.x + hw, y: gy, z: b.z + hd }, { x: b.x + hw, y: gy + b.bh, z: b.z + hd }, { x: b.x + hw, y: gy + b.bh, z: b.z - hd }],
          [{ x: b.x - hw, y: gy + b.bh, z: b.z - hd }, { x: b.x + hw, y: gy + b.bh, z: b.z - hd }, { x: b.x + hw, y: gy + b.bh, z: b.z + hd }, { x: b.x - hw, y: gy + b.bh, z: b.z + hd }],
        ]
        const mults = ночь ? [0.3, 0.2, 0.45] : [0.88, 0.68, 1.0]
        faces.forEach((face, fi) => {
          const ps = face.map(v => prj(v)); if (ps.some(p => !p)) return
          const m = mults[fi]; const [r, g, bl] = b.color.map(c2 => Math.round(c2 * m))
          ctx.beginPath(); ctx.moveTo(ps[0]!.sx, ps[0]!.sy)
          ps.slice(1).forEach(p => ctx.lineTo(p!.sx, p!.sy)); ctx.closePath()
          ctx.fillStyle = `rgb(${r},${g},${bl})`; ctx.fill()
          if (ночь && fi !== 2) { // Окна
            ctx.fillStyle = "rgba(255,240,180,0.25)"; ctx.fill()
          }
          ctx.strokeStyle = "rgba(0,0,0,0.2)"; ctx.lineWidth = 0.5; ctx.stroke()
        })
        const lp = prj({ x: b.x, y: gy + b.bh + 3.5, z: b.z })
        if (lp) {
          ctx.font = "bold 9px Arial"; const tw = ctx.measureText(b.label).width + 10
          ctx.fillStyle = "rgba(79,70,229,0.85)"; ctx.fillRect(lp.sx - tw / 2, lp.sy - 13, tw, 16)
          ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.fillText(b.label, lp.sx, lp.sy - 1); ctx.textAlign = "left"
        }
      })
    }

    // Точки съёмки
    if (лр.съёмка) {
      const ТЧК = [
        { x: -17, z: -16, e: 120.54, n: "ТЧК-001", code: "TOPO" },
        { x: -2,  z: -15, e: 122.10, n: "ТЧК-002", code: "EDGE" },
        { x: 15,  z: -17, e: 119.82, n: "ТЧК-003", code: "TOPO" },
        { x: -13, z: 0,   e: 121.30, n: "ТЧК-004", code: "LOW"  },
        { x: 13,  z: 1,   e: 123.05, n: "ТЧК-005", code: "HIGH" },
        { x: 0,   z: 15,  e: 120.80, n: "ТЧК-006", code: "TOPO" },
        { x: 8,   z: -8,  e: 122.55, n: "ТЧК-007", code: "EDGE" },
        { x: -8,  z: 8,   e: 121.70, n: "ТЧК-008", code: "TOPO" },
      ]
      const codeColor: Record<string, string> = { TOPO: "#f59e0b", EDGE: "#fb923c", HIGH: "#ef4444", LOW: "#60a5fa" }
      ТЧК.forEach(p => {
        const gy = высота(p.x, p.z)
        const base = prj({ x: p.x, y: gy, z: p.z }), tip = prj({ x: p.x, y: gy + 4.5, z: p.z })
        if (!base || !tip) return
        const color = codeColor[p.code] || "#f59e0b"
        ctx.beginPath(); ctx.moveTo(base.sx, base.sy); ctx.lineTo(tip.sx, tip.sy)
        ctx.strokeStyle = color; ctx.lineWidth = 1.5
        if (ночь) { ctx.shadowColor = color; ctx.shadowBlur = 4 }
        ctx.stroke(); ctx.shadowBlur = 0
        ctx.beginPath(); ctx.arc(base.sx, base.sy, 4, 0, Math.PI * 2)
        ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = "white"; ctx.lineWidth = 1.2; ctx.stroke()
        ctx.font = "bold 8px Arial"
        const txt = `${p.n} ${p.e}м`, tw = ctx.measureText(txt).width + 8
        ctx.fillStyle = color + "cc"; ctx.fillRect(tip.sx - tw / 2, tip.sy - 14, tw, 15)
        ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.fillText(txt, tip.sx, tip.sy - 2); ctx.textAlign = "left"
      })
    }

    // ── Live-объекты из редактора (синхронизация с CivilCADModule) ─────────────
    const liveObjs = liveObjsRef.current
    if (liveObjs.length > 0) {
      // Масштаб: canvas-координаты редактора → мировые координаты 3D
      // Редактор работает в условных единицах ~0..300, 3D-сцена: -25..25
      // Нормализуем через bbox всех точек
      let minX = Infinity, maxX = -Infinity, minY2 = Infinity, maxY2 = -Infinity
      liveObjs.forEach(obj => obj.pts.forEach(([px, py]) => {
        if (px < minX) minX = px; if (px > maxX) maxX = px
        if (py < minY2) minY2 = py; if (py > maxY2) maxY2 = py
      }))
      const rangeX = maxX - minX || 1, rangeY = maxY2 - minY2 || 1
      const scale3d = 40 / Math.max(rangeX, rangeY)
      const offX = (minX + maxX) / 2, offY2 = (minY2 + maxY2) / 2

      const toWorld3D = (px: number, py: number): Vec3 => {
        const wx = (px - offX) * scale3d
        const wz = (py - offY2) * scale3d
        const wy = высота(wx, wz) + 0.3
        return { x: wx, y: wy, z: wz }
      }

      liveObjs.forEach(obj => {
        if (obj.pts.length === 0) return
        const color = obj.color || "#22d3ee"

        if (obj.type === "point") {
          const p3 = toWorld3D(obj.pts[0][0], obj.pts[0][1])
          const base = prj(p3)
          const tip = prj({ x: p3.x, y: p3.y + 3.5, z: p3.z })
          if (!base) return
          ctx.beginPath(); ctx.arc(base.sx, base.sy, 5, 0, Math.PI * 2)
          ctx.fillStyle = color; ctx.fill()
          ctx.strokeStyle = "white"; ctx.lineWidth = 1.5; ctx.stroke()
          if (tip) {
            ctx.beginPath(); ctx.moveTo(base.sx, base.sy); ctx.lineTo(tip.sx, tip.sy)
            ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.stroke()
            ctx.setLineDash([])
            ctx.font = "bold 8px Arial"
            const tw = ctx.measureText(obj.label).width + 8
            ctx.fillStyle = color + "cc"; ctx.fillRect(tip.sx - tw / 2, tip.sy - 14, tw, 14)
            ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.fillText(obj.label, tip.sx, tip.sy - 2); ctx.textAlign = "left"
          }
          return
        }

        if (obj.pts.length < 2) return

        // Проецируем все точки
        const projected = obj.pts.map(([px, py]) => prj(toWorld3D(px, py)))

        // Определяем стиль по типу объекта
        const isAlignment = obj.type === "alignment" || obj.layer === "Трассы"
        const isPipe = obj.type === "pipe"
        const lw = isAlignment ? 3.5 : isPipe ? 2.5 : (obj.lineWidth ?? 2)

        ctx.beginPath()
        let started = false
        for (let i = 0; i < projected.length; i++) {
          const p = projected[i]
          if (!p) { started = false; continue }
          if (!started) { ctx.moveTo(p.sx, p.sy); started = true }
          else ctx.lineTo(p.sx, p.sy)
        }

        // Свечение для трасс
        if (isAlignment && !ночь) {
          ctx.shadowColor = color; ctx.shadowBlur = 8
        }
        ctx.strokeStyle = color
        ctx.lineWidth = lw
        ctx.setLineDash([])
        ctx.stroke()
        ctx.shadowBlur = 0

        // Метка по середине
        const midIdx = Math.floor(projected.length / 2)
        const mid3 = projected[midIdx]
        if (mid3 && obj.label) {
          ctx.font = "bold 9px Arial"
          const tw = ctx.measureText(obj.label).width + 10
          ctx.fillStyle = color + "dd"
          ctx.fillRect(mid3.sx - tw / 2, mid3.sy - 15, tw, 15)
          ctx.fillStyle = "white"; ctx.textAlign = "center"
          ctx.fillText(obj.label, mid3.sx, mid3.sy - 3); ctx.textAlign = "left"
        }
      })

      // Счётчик live-объектов (HUD)
      ctx.fillStyle = "rgba(0,120,212,0.85)"
      ctx.fillRect(8, 8, 160, 22)
      ctx.fillStyle = "white"; ctx.font = "bold 10px Arial"
      ctx.fillText(`▶ Из редактора: ${liveObjs.length} объект(ов)`, 14, 23)
    }

    // Компас
    const cpx = W - 42, cpy = 42, cr = 22
    ctx.beginPath(); ctx.arc(cpx, cpy, cr, 0, Math.PI * 2)
    ctx.fillStyle = "rgba(10,15,35,0.75)"; ctx.fill()
    ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 1; ctx.stroke()
    const nnx = Math.sin(cam.current.yaw), nny = -Math.cos(cam.current.yaw)
    ctx.beginPath()
    ctx.moveTo(cpx + nnx * (cr - 4), cpy + nny * (cr - 4))
    ctx.lineTo(cpx + nnx * 4, cpy + nny * 4)
    ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2.5
    ctx.shadowColor = "#ef4444"; ctx.shadowBlur = 4; ctx.stroke(); ctx.shadowBlur = 0
    ctx.beginPath()
    ctx.moveTo(cpx - nnx * (cr - 4), cpy - nny * (cr - 4))
    ctx.lineTo(cpx - nnx * 4, cpy - nny * 4)
    ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 1.5; ctx.stroke()
    ctx.fillStyle = "white"; ctx.font = "bold 8px Arial"; ctx.textAlign = "center"
    ctx.fillText("С", cpx + nnx * 12, cpy + nny * 12 + 3)
    ctx.fillText("Ю", cpx - nnx * 12, cpy - nny * 12 + 3)
    ctx.textAlign = "left"

    // HUD координаты
    ctx.fillStyle = "rgba(10,15,35,0.6)"; ctx.fillRect(8, Hc - 30, 260, 24)
    ctx.fillStyle = "rgba(180,220,255,0.9)"; ctx.font = "10px monospace"
    ctx.fillText(
      `X:${cam.current.tx.toFixed(1)}  Z:${cam.current.tz.toFixed(1)}  Дист:${cam.current.dist.toFixed(0)}м  Ш:${rw}м  Вид:${видRef.current.split(" ")[0]}`,
      14, Hc - 13
    )

    // Режим отображения бейдж
    ctx.fillStyle = "rgba(79,70,229,0.8)"; ctx.fillRect(W - 120, Hc - 30, 112, 24)
    ctx.fillStyle = "white"; ctx.font = "bold 10px Arial"
    ctx.fillText(режимRef.current, W - 112, Hc - 13)

    // Замер расстояния
    if (измерRef.current.active && измерRef.current.pts.length > 0) {
      измерRef.current.pts.forEach(pt => {
        const p = prj(pt); if (!p) return
        ctx.beginPath(); ctx.arc(p.sx, p.sy, 5, 0, Math.PI * 2)
        ctx.fillStyle = "#22d3ee"; ctx.fill()
      })
      if (измерRef.current.pts.length === 2) {
        const p1 = prj(измерRef.current.pts[0]), p2 = prj(измерRef.current.pts[1])
        if (p1 && p2) {
          ctx.beginPath(); ctx.moveTo(p1.sx, p1.sy); ctx.lineTo(p2.sx, p2.sy)
          ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.stroke()
          ctx.setLineDash([])
        }
      }
    }
  }, [высотаСолнца])

  // ── Анимационный цикл ──────────────────────────────────────────────────────

  useEffect(() => {
    let id: number
    const loop = () => { рендер(); id = requestAnimationFrame(loop) }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [рендер])

  // ── Размер canvas ──────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const sync = () => {
      const { offsetWidth: w, offsetHeight: h } = canvas
      if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) { canvas.width = w; canvas.height = h }
    }
    const ro = new ResizeObserver(sync)
    ro.observe(canvas); sync(); setTimeout(sync, 80)
    return () => ro.disconnect()
  }, [])

  // ── Управление мышью ──────────────────────────────────────────────────────

  const onDown = (e: React.MouseEvent) => {
    if (showЗамер) {
      const canvas = canvasRef.current; if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const mx = (e.clientX - rect.left) / canvas.offsetWidth * canvas.width
      const my = (e.clientY - rect.top) / canvas.offsetHeight * canvas.height
      // Приблизительная обратная проекция (на плоскость Y=0)
      const W = canvas.width, Hc = canvas.height
      const { yaw, pitch, dist, tx, tz } = cam.current
      const cx = tx + Math.sin(yaw) * dist * Math.cos(pitch)
      const cy2 = dist * Math.sin(pitch)
      const cz = tz + Math.cos(yaw) * dist * Math.cos(pitch)
      const fov = Math.min(W, Hc) * 1.45
      const rx = (mx - W / 2) / fov, ry = -(my - Hc / 2) / fov
      // Луч через пиксель
      const cosY = Math.cos(yaw), sinY = Math.sin(yaw)
      const cosP = Math.cos(pitch), sinP = Math.sin(pitch)
      const rdx = cosY * rx + sinY * cosP * ry - sinY * sinP
      const rdy = cosP * ry - sinP
      const rdz = -sinY * rx + cosY * cosP * ry - cosY * sinP
      // Пересечение с Y=0 (примерно)
      if (Math.abs(rdy) > 0.001) {
        const t = -cy2 / rdy
        const wx = cx + rdx * t, wz = cz + rdz * t
        const pt = { x: wx, y: высота(wx, wz), z: wz }
        const prev = измерRef.current.pts
        if (prev.length >= 2) { измерRef.current.pts = [pt] }
        else {
          измерRef.current.pts = [...prev, pt]
          if (prev.length === 1) {
            const d = Math.sqrt((pt.x - prev[0].x) ** 2 + (pt.z - prev[0].z) ** 2)
            setРасстояние(+d.toFixed(2))
          }
        }
      }
      return
    }
    drag.current = { x: e.clientX, y: e.clientY, btn: e.button }
  }
  const onMove = (e: React.MouseEvent) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y
    drag.current = { ...drag.current, x: e.clientX, y: e.clientY }
    if (drag.current.btn === 2) {
      const { yaw } = cam.current
      cam.current.tx -= (Math.cos(yaw) * dx - Math.sin(yaw) * dy) * 0.06
      cam.current.tz += (Math.sin(yaw) * dx + Math.cos(yaw) * dy) * 0.06
    } else {
      cam.current.yaw += dx * 0.007
      cam.current.pitch = Math.max(0.05, Math.min(1.48, cam.current.pitch + dy * 0.005))
    }
  }
  const onUp = () => { drag.current = null }
  const onWheel = (e: React.WheelEvent) => {
    cam.current.dist = Math.max(5, Math.min(140, cam.current.dist + e.deltaY * 0.05))
  }
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, d: 0 }
    else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      touch.current = { x: 0, y: 0, d: Math.sqrt(dx * dx + dy * dy) }
    }
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touch.current) return; e.preventDefault()
    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - touch.current.x, dy = e.touches[0].clientY - touch.current.y
      cam.current.yaw += dx * 0.007
      cam.current.pitch = Math.max(0.05, Math.min(1.48, cam.current.pitch + dy * 0.005))
      touch.current = { ...touch.current, x: e.touches[0].clientX, y: e.touches[0].clientY }
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const d = Math.sqrt(dx * dx + dy * dy)
      cam.current.dist = Math.max(5, Math.min(140, cam.current.dist - (d - touch.current.d) * 0.1))
      touch.current = { ...touch.current, d }
    }
  }

  const сброситьКамеру = () => {
    cam.current = { yaw: 0.3, pitch: 0.52, dist: 48, tx: 0, tz: 0 }
    setВид("3D перспектива")
  }

  const переключитьАним = () => {
    const next = !animActive
    setAnimActive(next)
    animRef.current.active = next
    animRef.current.type = animТип
    animRef.current.t = 0
  }

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <div className="relative flex flex-col h-full bg-[#0f1117] text-gray-200 overflow-hidden" style={{ fontFamily: "Arial, sans-serif" }}>

      {/* Тулбар */}
      <div className="bg-[#1a1a2a] border-b border-gray-700 flex items-center gap-2 px-3 py-1.5 flex-shrink-0 flex-wrap">

        {/* Виды */}
        <div className="flex items-center gap-1">
          {[
            { v: "3D перспектива", icon: "Box", title: "Перспектива" },
            { v: "Сверху (план)", icon: "Map", title: "План" },
            { v: "Спереди", icon: "Square", title: "Спереди" },
            { v: "Сбоку", icon: "RectangleHorizontal", title: "Сбоку" },
            { v: "Изометрия", icon: "Boxes", title: "Изометрия" },
          ].map(b => (
            <button key={b.v} title={b.title} onClick={() => setВид(b.v)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors ${вид === b.v ? "bg-[#0078d4] text-white" : "text-gray-400 hover:bg-[#2d2d4e] hover:text-white"}`}>
              <Icon name={b.icon} size={12} fallback="Square" />
              <span className="hidden sm:inline">{b.title}</span>
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-gray-700 flex-shrink-0" />

        {/* Режим отображения */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-500">Режим:</span>
          <select value={режим} onChange={e => setРежим(e.target.value)}
            className="bg-[#2d2d4e] border border-gray-600 text-[11px] text-gray-300 px-2 py-0.5 rounded outline-none cursor-pointer">
            {РЕЖИМЫ_ОТОБРАЖЕНИЯ.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>

        <div className="w-px h-5 bg-gray-700 flex-shrink-0" />

        {/* Инструменты */}
        <div className="flex items-center gap-1">
          <button title="Сбросить вид" onClick={сброситьКамеру}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-gray-400 hover:bg-[#2d2d4e] hover:text-white transition-colors">
            <Icon name="Home" size={12} /> <span className="hidden sm:inline">Сброс</span>
          </button>
          <button title="Замер расстояния" onClick={() => { setShowЗамер(s => !s); измерRef.current.pts = []; setРасстояние(null) }}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors ${showЗамер ? "bg-[#22d3ee] text-black" : "text-gray-400 hover:bg-[#2d2d4e] hover:text-white"}`}>
            <Icon name="Ruler" size={12} /> <span className="hidden sm:inline">Замер</span>
          </button>
          <button title="Поперечное сечение" onClick={() => setShowСечение(s => !s)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors ${showСечение ? "bg-[#fb923c] text-black" : "text-gray-400 hover:bg-[#2d2d4e] hover:text-white"}`}>
            <Icon name="Minus" size={12} /> <span className="hidden sm:inline">Сечение</span>
          </button>
          <button title="Информация" onClick={() => setShowИнфо(s => !s)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors ${showИнфо ? "bg-[#0078d4] text-white" : "text-gray-400 hover:bg-[#2d2d4e] hover:text-white"}`}>
            <Icon name="Info" size={12} /> <span className="hidden sm:inline">Инфо</span>
          </button>
        </div>

        <div className="w-px h-5 bg-gray-700 flex-shrink-0" />

        {/* Анимация */}
        <div className="flex items-center gap-1">
          <select value={animТип} onChange={e => setAnimТип(e.target.value)}
            className="bg-[#2d2d4e] border border-gray-600 text-[10px] text-gray-300 px-2 py-0.5 rounded outline-none cursor-pointer">
            {АНИМАЦИИ.map(a => <option key={a}>{a}</option>)}
          </select>
          <button onClick={переключитьАним}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors ${animActive ? "bg-[#ef4444] text-white" : "text-gray-400 hover:bg-[#2d2d4e] hover:text-white"}`}>
            <Icon name={animActive ? "Square" : "Play"} size={12} />
            <span className="hidden sm:inline">{animActive ? "Стоп" : "Старт"}</span>
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Активный проект из store */}
          {store?.activeProject && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#0078d4]/20 border border-[#0078d4]/40 rounded text-[10px] text-[#60a5fa]">
              <Icon name="FolderOpen" size={10} fallback="Folder" />
              <span>{store.activeProject.name}</span>
            </div>
          )}
          {/* Трассы из store */}
          {store && store.alignments.length > 0 && (
            <div className="text-[10px] text-green-400 flex items-center gap-1">
              <Icon name="Route" size={10} fallback="Minus" />
              <span>{store.alignments.length} трасс</span>
            </div>
          )}
          <button onClick={() => setShowПанель(s => !s)}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-gray-400 hover:bg-[#2d2d4e] hover:text-white transition-colors">
            <Icon name={showПанель ? "PanelRightClose" : "PanelRight"} size={12} fallback="Layout" />
          </button>
          {onNavigate && (
            <button onClick={() => onNavigate("civilcad")}
              className="flex items-center gap-1 px-2 py-1 rounded text-[11px] border border-[#0078d4]/50 text-[#60a5fa] hover:bg-[#0078d4] hover:text-white transition-colors">
              <Icon name="Monitor" size={12} /> <span className="hidden sm:inline">Редактор</span>
            </button>
          )}
        </div>
      </div>

      {/* Основная область */}
      <div className="flex flex-1 overflow-hidden">

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full block"
            style={{ cursor: showЗамер ? "crosshair" : "grab" }}
            onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
            onWheel={onWheel} onContextMenu={e => e.preventDefault()}
            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={() => { touch.current = null }} />

          {/* Замер результат */}
          {showЗамер && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#0f1117cc] border border-[#22d3ee] rounded-lg px-4 py-2 text-[12px] text-[#22d3ee] font-mono">
              {расстояние !== null
                ? `📏 Расстояние: ${расстояние} м`
                : "Кликните первую точку на модели"}
            </div>
          )}

          {/* Поперечное сечение оверлей */}
          {showСечение && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-[#1a1a2e] border border-[#fb923c] rounded-xl p-3 w-96">
              <div className="text-[11px] text-[#fb923c] font-bold mb-2 flex items-center justify-between">
                <span>Поперечное сечение — ПК {Math.floor(сечениеПК / 100)}+{String(сечениеПК % 100).padStart(2, "0")}</span>
                <button onClick={() => setShowСечение(false)} className="text-gray-500 hover:text-white">✕</button>
              </div>
              <input type="range" min="0" max="2000" step="20" value={сечениеПК}
                onChange={e => setСечениеПК(+e.target.value)}
                className="w-full accent-orange-500 mb-2" />
              <svg width="100%" height="90" viewBox="-50 -10 100 50" style={{ background: "#0a0a1a", borderRadius: 6 }}>
                {/* Рельеф */}
                <path d="M-50,40 Q-30,20 -15,22 Q0,24 15,18 Q30,14 50,20 L50,45 L-50,45 Z" fill="#2d5a3d" opacity="0.7" />
                {/* Дорога */}
                <rect x={-ширДор / 2 * 3} y="18" width={ширДор * 3} height="5" fill="#374151" />
                <rect x={-ширДор / 2 * 3} y="18" width={ширДор * 3} height="2" fill="#4b5563" />
                {/* Разметка */}
                <rect x="-1" y="18" width="2" height="1" fill="#fbbf24" opacity="0.8" />
                {/* Откосы */}
                <path d={`M${-ширДор / 2 * 3},20 L${-ширДор / 2 * 3 - 12},32`} stroke="#8b7355" strokeWidth="1" />
                <path d={`M${ширДор / 2 * 3},20 L${ширДор / 2 * 3 + 12},32`} stroke="#8b7355" strokeWidth="1" />
                {/* Подземные сети */}
                <circle cx="-20" cy="35" r="2" fill="#3b82f6" opacity="0.8" />
                <circle cx="-15" cy="37" r="3" fill="#78716c" opacity="0.8" />
                <circle cx="20" cy="34" r="1.5" fill="#f59e0b" opacity="0.8" />
                {/* Подписи */}
                <text x="0" y="14" textAnchor="middle" fill="#fb923c" fontSize="4" fontWeight="bold">Дорога {ширДор}м</text>
                <text x="-38" y="40" fill="#60a5fa" fontSize="3">Вод.Ø200</text>
                <text x="15" y="40" fill="#f59e0b" fontSize="3">Тепло</text>
                {/* Отметки */}
                <text x="-46" y="-6" fill="#94a3b8" fontSize="3">120.5м</text>
                <text x="36" y="-2" fill="#94a3b8" fontSize="3">119.8м</text>
              </svg>
            </div>
          )}

          {/* Инфо-панель */}
          {showИнфо && (
            <div className="absolute top-3 right-3 bg-[#1a1a2eee] border border-gray-700 rounded-xl p-3 w-56 text-[11px] space-y-1.5">
              <div className="text-[#0078d4] font-bold mb-2 flex items-center justify-between">
                <span>Информация о модели</span>
                <button onClick={() => setShowИнфо(false)} className="text-gray-500 hover:text-white">✕</button>
              </div>
              {[
                { label: "Проект", value: "Главная парковка_Финал" },
                { label: "Трасса", value: "Трасса ШД-38, 2400 м" },
                { label: "Поверхность", value: "TIN, 284 точки" },
                { label: "Коридор", value: "Дорога и парковка" },
                { label: "Сети", value: "4 трубопровода" },
                { label: "Здания", value: "4 объекта, BIM" },
                { label: "Съёмка", value: "8 точек COGO" },
                { label: "Масштаб", value: `1:${Math.round(cam.current.dist * 100)}` },
                { label: "Система коорд.", value: "МСК-50 зона 1" },
              ].map(r => (
                <div key={r.label} className="flex justify-between">
                  <span className="text-gray-500">{r.label}</span>
                  <span className="text-gray-300 font-medium">{r.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── ViewCube ──────────────────────────────────────────────────── */}
          {showViewCube && (
            <div className="absolute top-3 right-3 select-none" style={{zIndex:20}}>
              <svg width="80" height="80" viewBox="-40 -40 80 80" style={{filter:"drop-shadow(0 2px 8px rgba(0,0,0,0.7))"}}>
                {/* Куб — проекция изометрическая */}
                {/* Нижняя грань */}
                <polygon points="0,16 22,4 0,-8 -22,4" fill="#1e293b" stroke="#374151" strokeWidth="0.8"/>
                {/* Правая грань */}
                <polygon points="0,-8 22,-20 22,4 0,16" fill="#253545" stroke="#374151" strokeWidth="0.8"/>
                {/* Левая грань */}
                <polygon points="0,-8 -22,-20 -22,4 0,16" fill="#1a2535" stroke="#374151" strokeWidth="0.8"/>
                {/* Верхняя грань */}
                <polygon points="0,-8 22,-20 0,-32 -22,-20" fill="#334155" stroke="#374151" strokeWidth="0.8"/>
                {/* Подписи граней */}
                <text x="0" y="-16" textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize="7" fontWeight="bold">ВЕРХ</text>
                <text x="13" y="-2" textAnchor="middle" dominantBaseline="middle" fill="#64748b" fontSize="5.5" transform="skewY(-24)">ПРАВ</text>
                <text x="-13" y="-2" textAnchor="middle" dominantBaseline="middle" fill="#64748b" fontSize="5.5" transform="skewY(24)">ЛЕВ</text>
                {/* Кнопки видов */}
                {[
                  {x:0,y:-36,label:"С",view:"Сверху (план)"},
                  {x:30,y:0,label:"Ю",view:"Спереди"},
                  {x:-30,y:0,label:"С",view:"Сбоку"},
                  {x:0,y:24,label:"3D",view:"3D перспектива"},
                ].map(b=>(
                  <g key={b.view} style={{cursor:"pointer"}} onClick={()=>setВид(b.view)}>
                    <circle cx={b.x} cy={b.y} r="7" fill={вид===b.view?"#0078d4":"#1e2d40"} stroke="#374151" strokeWidth="0.8" opacity="0.9"/>
                    <text x={b.x} y={b.y+1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="4.5" fontWeight="bold">{b.label}</text>
                  </g>
                ))}
              </svg>
            </div>
          )}

          {/* ── Section Plane индикатор ──────────────────────────────────── */}
          {sectionPlaneActive && (
            <div className="absolute left-0 right-0 pointer-events-none" style={{top:`${50-sectionPlaneY*1.5}%`,zIndex:15}}>
              <div className="h-px bg-[#f97316] opacity-60" style={{boxShadow:"0 0 6px #f97316"}}/>
              <div className="absolute right-2 -top-3 text-[9px] text-[#f97316] bg-[#0d1117] px-1.5 py-0.5 rounded border border-[#f97316]/40">
                Секущая плоскость h={sectionPlaneY}м
              </div>
            </div>
          )}

          {/* ── Панель именованных видов ─────────────────────────────────── */}
          {showViewsPanel && (
            <div className="absolute top-12 left-3 bg-[#1a1a2eee] border border-gray-700 rounded-xl p-3 w-52 text-[11px]" style={{zIndex:25}}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-bold text-[11px]">Именованные виды</span>
                <button onClick={()=>setShowViewsPanel(false)} className="text-gray-500 hover:text-white text-sm">✕</button>
              </div>
              {namedViews.map((v,i)=>(
                <button key={i} onClick={()=>{
                  cam.current.yaw=v.yaw; cam.current.pitch=v.pitch
                  cam.current.dist=v.dist; cam.current.tx=v.tx; cam.current.tz=v.tz
                  setВид(v.name.includes("план")?"Сверху (план)":v.name.includes("Фасад")?"Спереди":v.name.includes("Изо")?"Изометрия":"3D перспектива")
                  setShowViewsPanel(false)
                }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#0078d4]/20 transition-colors text-left ${вид===v.name?"text-[#60a5fa]":"text-gray-300"}`}>
                  <Icon name="Eye" size={11} className={вид===v.name?"text-[#0078d4]":"text-gray-600"}/>
                  {v.name}
                </button>
              ))}
              <div className="border-t border-gray-700 mt-2 pt-2">
                <button onClick={()=>{
                  const newView = {name:`Вид ${namedViews.length+1}`, yaw:cam.current.yaw, pitch:cam.current.pitch, dist:cam.current.dist, tx:cam.current.tx, tz:cam.current.tz}
                  setNamedViews(v=>[...v,newView])
                }} className="w-full text-[10px] text-[#0078d4] hover:underline">+ Сохранить текущий вид</button>
              </div>
            </div>
          )}

          {/* ── Панель Section Plane ──────────────────────────────────────── */}
          {showSectionPanel && (
            <div className="absolute top-12 left-3 bg-[#1a1a2eee] border border-gray-700 rounded-xl p-3 w-56 text-[11px]" style={{zIndex:25}}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-bold">Section Plane</span>
                <button onClick={()=>setShowSectionPanel(false)} className="text-gray-500 hover:text-white">✕</button>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gray-500 w-16">Активна:</span>
                <button onClick={()=>setSectionPlaneActive(p=>!p)}
                  className={`px-3 py-0.5 rounded text-[10px] font-bold transition-colors ${sectionPlaneActive?"bg-[#f97316] text-white":"bg-[#252535] text-gray-400"}`}>
                  {sectionPlaneActive?"ВКЛ":"ВЫКЛ"}
                </button>
              </div>
              <div>
                <div className="text-gray-500 text-[9px] mb-1">Высота сечения: <span className="text-[#f97316] font-mono">{sectionPlaneY} м</span></div>
                <input type="range" min="-10" max="10" step="0.5" value={sectionPlaneY}
                  onChange={e=>setSectionPlaneY(parseFloat(e.target.value))}
                  className="w-full accent-orange-500"/>
              </div>
              <div className="grid grid-cols-3 gap-1 mt-2">
                {["XY","XZ","YZ"].map(plane=>(
                  <button key={plane} className="py-1 text-[10px] bg-[#252535] text-gray-400 hover:bg-[#0078d4]/30 hover:text-white rounded transition-colors">{plane}</button>
                ))}
              </div>
            </div>
          )}

          {/* ── Статистика ──────────────────────────────────────────────── */}
          {showStats && (
            <div className="absolute bottom-8 left-3 bg-[#0d1117cc] border border-gray-700 rounded-lg px-3 py-2 text-[9px] font-mono text-gray-400 space-y-0.5">
              <div>FPS: <span className="text-green-400">60</span></div>
              <div>Треугольников: <span className="text-[#4fc3f7]">84 204</span></div>
              <div>Точек: <span className="text-yellow-400">1 847</span></div>
              <div>Yaw: <span className="text-gray-300">{(cam.current.yaw*180/Math.PI).toFixed(1)}°</span></div>
              <div>Pitch: <span className="text-gray-300">{(cam.current.pitch*180/Math.PI).toFixed(1)}°</span></div>
              <div>Dist: <span className="text-gray-300">{cam.current.dist.toFixed(1)} м</span></div>
            </div>
          )}

          {/* Управление подсказка */}
          <div className="absolute bottom-2 right-3 text-[9px] text-gray-600 text-right">
            ЛКМ — вращение · ПКМ — панорама · Колесо — масштаб
          </div>
        </div>

        {/* Правая панель — расширенная */}
        {showПанель && (
          <div className="w-52 bg-[#141420] border-l border-gray-700 flex flex-col overflow-hidden flex-shrink-0">
            {/* Вкладки панели */}
            <div className="flex border-b border-gray-700 bg-[#1e1e30] flex-shrink-0">
              {["Слои","Виды","Секущая","Свет"].map((t,i)=>(
                <button key={t} onClick={()=>{setShowViewsPanel(i===1);setShowSectionPanel(i===2)}}
                  className={`flex-1 py-1.5 text-[9px] transition-colors ${(i===1&&showViewsPanel)||(i===2&&showSectionPanel)?"bg-[#252535] text-white border-b-2 border-b-[#0078d4]":"text-gray-500 hover:text-gray-300"}`}>
                  {t}
                </button>
              ))}
            </div>

            {/* Слои с изоляцией */}
            <div className="flex-1 overflow-y-auto py-1 min-h-0">
              {isolatedLayers.size > 0 && (
                <button onClick={()=>{сбросИзоляции();setСлои({рельеф:true,дорога:true,сети:true,здания:true,съёмка:true,сетка:true,горизонтали:false,поперечники:false,пикеты:true,каркас:false})}}
                  className="w-full flex items-center gap-1.5 px-2 py-1 bg-[#f97316]/20 text-[#f97316] text-[9px] hover:bg-[#f97316]/30 transition-colors">
                  <Icon name="Eye" size={10}/> Сбросить изоляцию
                </button>
              )}
              {СЛОИ.map(s => (
                <div key={s.key} className="flex items-center group hover:bg-[#1e1e30] transition-colors">
                  <button onClick={() => переключитьСлой(s.key)}
                    className="flex-1 flex items-center gap-2 px-2.5 py-1.5">
                    <div className={`w-3 h-3 rounded-sm flex-shrink-0 transition-all ${слои[s.key] ? "opacity-100" : "opacity-25"}`}
                      style={{ background: s.color }} />
                    <Icon name={s.icon} size={11} className={слои[s.key] ? "text-gray-300" : "text-gray-600"} fallback="Layers" />
                    <span className={`text-[11px] flex-1 ${слои[s.key] ? "text-gray-300" : "text-gray-600"}`}>{s.label}</span>
                  </button>
                  <button onClick={()=>изолировать(s.key)} title="Изолировать"
                    className="px-1.5 opacity-0 group-hover:opacity-100 text-[9px] text-gray-600 hover:text-[#f97316] transition-all">
                    <Icon name="Eye" size={10}/>
                  </button>
                </div>
              ))}
            </div>

            {/* Виды */}
            {showViewsPanel && (
              <div className="border-t border-gray-700 p-2 min-h-0 max-h-40 overflow-y-auto">
                <div className="text-[9px] text-gray-500 uppercase mb-1">Сохранённые виды</div>
                {namedViews.map((v,i)=>(
                  <button key={i} onClick={()=>{
                    cam.current.yaw=v.yaw; cam.current.pitch=v.pitch
                    cam.current.dist=v.dist; cam.current.tx=v.tx; cam.current.tz=v.tz
                  }}
                    className="w-full flex items-center gap-1.5 px-2 py-1 text-[10px] text-gray-400 hover:text-white hover:bg-[#252535] rounded transition-colors text-left">
                    <Icon name="Eye" size={10} className="text-[#0078d4]"/>
                    {v.name}
                  </button>
                ))}
                <button onClick={()=>setNamedViews(vs=>[...vs,{name:`Вид ${vs.length+1}`,yaw:cam.current.yaw,pitch:cam.current.pitch,dist:cam.current.dist,tx:cam.current.tx,tz:cam.current.tz}])}
                  className="w-full text-[9px] text-[#0078d4] hover:underline mt-1">+ Сохранить вид</button>
              </div>
            )}

            {/* Секущая плоскость */}
            {showSectionPanel && (
              <div className="border-t border-gray-700 p-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] text-gray-500 uppercase">Секущая плоскость</span>
                  <button onClick={()=>setSectionPlaneActive(p=>!p)}
                    className={`px-2 py-0.5 text-[9px] rounded font-bold ${sectionPlaneActive?"bg-[#f97316] text-white":"bg-[#252535] text-gray-500"}`}>
                    {sectionPlaneActive?"ВКЛ":"ВЫКЛ"}
                  </button>
                </div>
                <input type="range" min="-10" max="10" step="0.5" value={sectionPlaneY}
                  onChange={e=>setSectionPlaneY(parseFloat(e.target.value))}
                  className="w-full accent-orange-500"/>
                <div className="text-[9px] text-[#f97316] font-mono">{sectionPlaneY} м</div>
              </div>
            )}

            {/* Параметры */}
            <div className="border-t border-gray-700 p-2 space-y-2 flex-shrink-0">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Параметры</div>
              <div>
                <div className="text-[10px] text-gray-500 mb-0.5">Ширина дороги (м)</div>
                <input type="range" min="4" max="21" step="0.5" value={ширДор}
                  onChange={e => setШирДор(+e.target.value)}
                  className="w-full accent-orange-500" />
                <span className="text-[10px] text-orange-400">{ширДор} м</span>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 mb-0.5">Освещение ({ambientLight}%)</div>
                <input type="range" min="20" max="100" value={ambientLight}
                  onChange={e=>setAmbientLight(+e.target.value)}
                  className="w-full accent-yellow-400"/>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 mb-0.5">Высота солнца</div>
                <input type="range" min="0" max="180" value={высотаСолнца}
                  onChange={e => setВысотаСолнца(+e.target.value)}
                  className="w-full accent-yellow-400" />
                <span className="text-[10px] text-yellow-400">{высотаСолнца}°</span>
              </div>
            </div>

            {/* Управление */}
            <div className="border-t border-gray-700 p-2 space-y-1 flex-shrink-0">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Навигация</div>
              {[
                { label: "Вписать всё", fn: сброситьКамеру, icon: "Maximize2" },
                { label: "Вид сверху",  fn: ()=>{ cam.current.pitch=1.55; cam.current.yaw=0 }, icon: "ArrowUp" },
                { label: "Изометрия",   fn: ()=>{ cam.current.pitch=0.615; cam.current.yaw=0.785 }, icon: "Box" },
                { label: "ViewCube",    fn: ()=>setShowViewCube(p=>!p), icon: "Cube", fallback:"Box" },
                { label: "Статистика",  fn: ()=>setShowStats(p=>!p), icon: "BarChart3" },
              ].map(btn => (
                <button key={btn.label} onClick={btn.fn}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded bg-[#1e1e30] hover:bg-[#2d2d4e] transition-colors text-[10px] text-gray-400 hover:text-white">
                  <Icon name={btn.icon} size={11} fallback="ChevronRight" />
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Функции 2022–2027 */}
            <div className="border-t border-gray-700 flex-shrink-0">
              <button onClick={() => setShowFn(o => !o)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-[10px] text-gray-300 hover:bg-[#1e1e30] transition-colors">
                <Icon name="Rocket" size={11} className="text-[#0078d4]" />
                <span className="font-bold uppercase tracking-wider">Функции 2022–2027</span>
                <Icon name={showFn ? "ChevronDown" : "ChevronRight"} size={11} className="ml-auto text-gray-500" />
              </button>
              {showFn && (
                <div className="max-h-[40vh] overflow-auto bg-white p-2">
                  <VersionFeaturesInline categories={["bim", "modeling3d"]} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}