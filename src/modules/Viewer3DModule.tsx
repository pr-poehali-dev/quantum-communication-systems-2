import { useRef, useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import Icon from "@/components/ui/icon"

// ─── Pure WebGL / Canvas 3D viewer (no external 3D libs) ──────────────────

interface Vec3 { x: number; y: number; z: number }
interface LayerState {
  terrain: boolean
  road: boolean
  pipes: boolean
  buildings: boolean
  points: boolean
  grid: boolean
  wireframe: boolean
}

const ROAD_WIDTHS = [
  { label: "6 м (сел.)", v: 6 },
  { label: "7 м (II кат.)", v: 7 },
  { label: "10.5 м (I кат.)", v: 10.5 },
  { label: "14 м (магистр.)", v: 14 },
]

function heightAt(x: number, z: number): number {
  return (
    Math.sin(x * 0.3) * 2.5 +
    Math.cos(z * 0.22) * 2.0 +
    Math.sin(x * 0.62 + z * 0.45) * 1.0 +
    Math.cos(x * 0.15 + z * 0.58) * 1.5
  )
}

function project(
  p: Vec3, cx: number, cy: number, cz: number,
  yaw: number, pitch: number,
  fov: number, w: number, h: number
): { sx: number; sy: number; depth: number } | null {
  // translate
  let dx = p.x - cx, dy = p.y - cy, dz = p.z - cz
  // yaw rotation
  const cosY = Math.cos(yaw), sinY = Math.sin(yaw)
  const tx = dx * cosY - dz * sinY
  const tz = dx * sinY + dz * cosY
  dx = tx; dz = tz
  // pitch
  const cosP = Math.cos(pitch), sinP = Math.sin(pitch)
  const ty = dy * cosP - dz * sinP
  const tz2 = dy * sinP + dz * cosP
  dy = ty; dz = tz2
  if (dz <= 0.3) return null
  const f = fov / dz
  return {
    sx: w / 2 + dx * f,
    sy: h / 2 - dy * f,
    depth: dz,
  }
}

function lerpColor(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const ra = (pa >> 16) & 0xff, ga = (pa >> 8) & 0xff, ba = pa & 0xff
  const rb = (pb >> 16) & 0xff, gb = (pb >> 8) & 0xff, bb = pb & 0xff
  const r = Math.round(ra + (rb - ra) * t)
  const g = Math.round(ga + (gb - ga) * t)
  const bl = Math.round(ba + (bb - ba) * t)
  return `rgb(${r},${g},${bl})`
}

function terrainColor(h: number, wireframe: boolean): string {
  if (wireframe) return "rgba(99,102,241,0.6)"
  const t = (h + 4) / 8
  if (t < 0.25) return lerpColor("#2d6a2d", "#4a8a3a", t / 0.25)
  if (t < 0.55) return lerpColor("#4a8a3a", "#8b7355", (t - 0.25) / 0.3)
  if (t < 0.8) return lerpColor("#8b7355", "#a09080", (t - 0.55) / 0.25)
  return lerpColor("#a09080", "#d0d0d0", (t - 0.8) / 0.2)
}

export default function Viewer3DModule() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const drag = useRef<{ x: number; y: number; btn: number } | null>(null)
  const camRef = useRef({ yaw: 0.5, pitch: 0.42, dist: 52, tx: 0, tz: 0 })
  const [layers, setLayers] = useState<LayerState>({
    terrain: true, road: true, pipes: true, buildings: true, points: true, grid: true, wireframe: false,
  })
  const [roadWidth, setRoadWidth] = useState(7)
  const [sunH, setSunH] = useState(45)
  const layersRef = useRef(layers)
  const roadWRef = useRef(roadWidth)
  const sunHRef = useRef(sunH)
  useEffect(() => { layersRef.current = layers }, [layers])
  useEffect(() => { roadWRef.current = roadWidth }, [roadWidth])
  useEffect(() => { sunHRef.current = sunH }, [sunH])

  const toggle = (k: keyof LayerState) => setLayers(l => ({ ...l, [k]: !l[k] }))

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    const W = canvas.width, H = canvas.height
    const { yaw, pitch, dist, tx, tz } = camRef.current
    const cx = tx + Math.sin(yaw) * dist
    const cy = dist * Math.sin(pitch) + 2
    const cz = tz + Math.cos(yaw) * dist
    const fov = Math.min(W, H) * 1.1
    const lyr = layersRef.current

    const proj = (p: Vec3) => project(p, cx, cy, cz, yaw, pitch, fov, W, H)

    // Sky gradient
    const ang = sunHRef.current / 180 * Math.PI
    const isDark = sunHRef.current < 15 || sunHRef.current > 165
    const sky1 = isDark ? "#0f172a" : "#87ceeb"
    const sky2 = isDark ? "#1e3a5f" : "#dbeafe"
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H)
    skyGrad.addColorStop(0, sky1)
    skyGrad.addColorStop(1, sky2)
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, W, H)

    const SIZE = 40, STEP = 2.5
    const cols = Math.floor(SIZE / STEP), rows = cols

    // Build terrain quads with depth
    type Quad = { pts: { sx: number; sy: number }[]; depth: number; h: number }
    const quads: Quad[] = []

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const x0 = -SIZE / 2 + j * STEP, z0 = -SIZE / 2 + i * STEP
        const x1 = x0 + STEP, z1 = z0 + STEP
        const corners: Vec3[] = [
          { x: x0, y: heightAt(x0, z0), z: z0 },
          { x: x1, y: heightAt(x1, z0), z: z0 },
          { x: x1, y: heightAt(x1, z1), z: z1 },
          { x: x0, y: heightAt(x0, z1), z: z1 },
        ]
        const projected = corners.map(c => proj(c))
        if (projected.some(p => !p)) continue
        const depth = projected.reduce((s, p) => s + p!.depth, 0) / 4
        const avgH = corners.reduce((s, c) => s + c.y, 0) / 4
        quads.push({ pts: projected.map(p => ({ sx: p!.sx, sy: p!.sy })), depth, h: avgH })
      }
    }

    // Sort back-to-front
    quads.sort((a, b) => b.depth - a.depth)

    if (lyr.terrain) {
      quads.forEach(q => {
        ctx.beginPath()
        ctx.moveTo(q.pts[0].sx, q.pts[0].sy)
        q.pts.slice(1).forEach(p => ctx.lineTo(p.sx, p.sy))
        ctx.closePath()
        const shadow = Math.max(0.5, Math.sin(ang) * 0.5 + 0.7)
        const base = terrainColor(q.h, lyr.wireframe)
        ctx.fillStyle = lyr.wireframe ? "transparent" : base
        if (!lyr.wireframe) ctx.fill()
        ctx.strokeStyle = lyr.wireframe ? terrainColor(q.h, true) : `rgba(0,0,0,${0.08 * shadow})`
        ctx.lineWidth = lyr.wireframe ? 0.7 : 0.3
        ctx.stroke()
      })
    }

    // Grid
    if (lyr.grid) {
      for (let v = -SIZE / 2; v <= SIZE / 2; v += 10) {
        const a = proj({ x: v, y: 0, z: -SIZE / 2 })
        const b = proj({ x: v, y: 0, z: SIZE / 2 })
        if (a && b) {
          ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy)
          ctx.strokeStyle = "rgba(148,163,184,0.35)"; ctx.lineWidth = 0.6; ctx.stroke()
        }
        const c = proj({ x: -SIZE / 2, y: 0, z: v })
        const d = proj({ x: SIZE / 2, y: 0, z: v })
        if (c && d) {
          ctx.beginPath(); ctx.moveTo(c.sx, c.sy); ctx.lineTo(d.sx, d.sy)
          ctx.strokeStyle = "rgba(148,163,184,0.35)"; ctx.lineWidth = 0.6; ctx.stroke()
        }
      }
    }

    // Road
    if (lyr.road) {
      const rw = roadWRef.current
      const rPts: Vec3[] = []
      for (let t = 0; t <= 1; t += 0.03) {
        const x = (t - 0.5) * 38
        const z = Math.sin(t * Math.PI * 1.4) * 6
        const y = heightAt(x, z) + 0.25
        rPts.push({ x, y, z })
      }
      // Road fill
      ctx.beginPath()
      rPts.forEach((p, i) => {
        const off = 0.05
        const nx = -Math.sin(i / rPts.length * Math.PI * 1.4) * rw / 2 * off
        const nz = Math.cos(i / rPts.length * Math.PI * 1.4) * rw / 2 * off
        const lp = proj({ x: p.x + nz, y: p.y, z: p.z + nx })
        if (lp) { if (i === 0) { ctx.moveTo(lp.sx, lp.sy) } else { ctx.lineTo(lp.sx, lp.sy) } }
      })
      ;[...rPts].reverse().forEach((p, i) => {
        const off = 0.05
        const nx = -Math.sin((rPts.length - 1 - i) / rPts.length * Math.PI * 1.4) * rw / 2 * off
        const nz = Math.cos((rPts.length - 1 - i) / rPts.length * Math.PI * 1.4) * rw / 2 * off
        const rp = proj({ x: p.x - nz, y: p.y, z: p.z - nx })
        if (rp) ctx.lineTo(rp.sx, rp.sy)
      })
      ctx.closePath()
      ctx.fillStyle = "#2d3748"; ctx.fill()
      // Centre line
      ctx.beginPath()
      rPts.forEach((p, i) => {
        const pp = proj(p)
        if (pp) { if (i === 0) { ctx.moveTo(pp.sx, pp.sy) } else { ctx.lineTo(pp.sx, pp.sy) } }
      })
      ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineWidth = 1; ctx.setLineDash([6, 6]); ctx.stroke(); ctx.setLineDash([])
    }

    // Pipes
    if (lyr.pipes) {
      const pipeDefs = [
        { z: -8, y: -0.4, color: "#3b82f6", label: "Водопровод Ø200", w: 3 },
        { z: -5, y: -1.1, color: "#78716c", label: "Канализация Ø300", w: 4 },
        { z: -11, y: 0.2, color: "#f59e0b", label: "Теплосеть", w: 2 },
      ]
      pipeDefs.forEach(pd => {
        const a = proj({ x: -18, y: pd.y, z: pd.z })
        const b = proj({ x: 18, y: pd.y, z: pd.z })
        if (a && b) {
          ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy)
          ctx.strokeStyle = pd.color; ctx.lineWidth = pd.w; ctx.stroke()
          ctx.fillStyle = pd.color
          ctx.font = "bold 10px sans-serif"; ctx.fillText(pd.label, a.sx + 4, a.sy - 4)
        }
      })
    }

    // Buildings
    if (lyr.buildings) {
      const bldgs = [
        { x: -14, z: 10, w: 6, d: 5, h: 8, color: "#94a3b8", label: "Корпус А" },
        { x: 0, z: 12, w: 8, d: 6, h: 12, color: "#a78bfa", label: "Корпус Б" },
        { x: 14, z: 10, w: 5, d: 5, h: 5, color: "#6ee7b7", label: "Склад" },
      ]
      bldgs.forEach(b => {
        const gy = heightAt(b.x, b.z)
        const faces = [
          // Front
          [{ x: b.x - b.w / 2, y: gy, z: b.z + b.d / 2 }, { x: b.x + b.w / 2, y: gy, z: b.z + b.d / 2 }, { x: b.x + b.w / 2, y: gy + b.h, z: b.z + b.d / 2 }, { x: b.x - b.w / 2, y: gy + b.h, z: b.z + b.d / 2 }],
          // Right
          [{ x: b.x + b.w / 2, y: gy, z: b.z - b.d / 2 }, { x: b.x + b.w / 2, y: gy, z: b.z + b.d / 2 }, { x: b.x + b.w / 2, y: gy + b.h, z: b.z + b.d / 2 }, { x: b.x + b.w / 2, y: gy + b.h, z: b.z - b.d / 2 }],
          // Top
          [{ x: b.x - b.w / 2, y: gy + b.h, z: b.z - b.d / 2 }, { x: b.x + b.w / 2, y: gy + b.h, z: b.z - b.d / 2 }, { x: b.x + b.w / 2, y: gy + b.h, z: b.z + b.d / 2 }, { x: b.x - b.w / 2, y: gy + b.h, z: b.z + b.d / 2 }],
        ]
        const brightness = [1, 0.75, 0.9]
        faces.forEach((face, fi) => {
          const pts = face.map(p => proj(p as Vec3))
          if (pts.some(p => !p)) return
          ctx.beginPath()
          ctx.moveTo(pts[0]!.sx, pts[0]!.sy)
          pts.slice(1).forEach(p => ctx.lineTo(p!.sx, p!.sy))
          ctx.closePath()
          const base = parseInt(b.color.slice(1), 16)
          const br = brightness[fi]
          const r = Math.round(((base >> 16) & 0xff) * br)
          const g = Math.round(((base >> 8) & 0xff) * br)
          const bl2 = Math.round((base & 0xff) * br)
          ctx.fillStyle = `rgb(${r},${g},${bl2})`
          ctx.fill()
          ctx.strokeStyle = "rgba(0,0,0,0.2)"; ctx.lineWidth = 0.5; ctx.stroke()
        })
        // Label
        const top = proj({ x: b.x, y: gy + b.h + 1.5, z: b.z })
        if (top) {
          ctx.fillStyle = "rgba(99,102,241,0.85)"
          const tw = ctx.measureText(b.label).width + 8
          ctx.fillRect(top.sx - tw / 2, top.sy - 10, tw, 16)
          ctx.fillStyle = "white"; ctx.font = "bold 9px sans-serif"; ctx.textAlign = "center"
          ctx.fillText(b.label, top.sx, top.sy + 2); ctx.textAlign = "left"
        }
      })
    }

    // Survey points
    if (lyr.points) {
      const pts = [
        { x: -16, z: -16, elev: 120.5, label: "ТН-1" },
        { x: 0, z: -14, elev: 122.1, label: "ТН-2" },
        { x: 16, z: -16, elev: 119.8, label: "ТН-3" },
        { x: -12, z: 0, elev: 121.3, label: "ТН-4" },
        { x: 12, z: 0, elev: 123.0, label: "ТН-5" },
      ]
      pts.forEach(p => {
        const ground = heightAt(p.x, p.z)
        const base = proj({ x: p.x, y: ground, z: p.z })
        const top = proj({ x: p.x, y: ground + 4, z: p.z })
        if (base && top) {
          ctx.beginPath(); ctx.moveTo(base.sx, base.sy); ctx.lineTo(top.sx, top.sy)
          ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 1.5; ctx.stroke()
          ctx.beginPath(); ctx.arc(base.sx, base.sy, 4, 0, Math.PI * 2)
          ctx.fillStyle = "#f59e0b"; ctx.fill()
          ctx.fillStyle = "rgba(245,158,11,0.85)"
          const lw = ctx.measureText(`${p.label} ${p.elev}м`).width + 8
          ctx.fillRect(top.sx - lw / 2, top.sy - 11, lw, 15)
          ctx.fillStyle = "white"; ctx.font = "bold 8px sans-serif"; ctx.textAlign = "center"
          ctx.fillText(`${p.label} ${p.elev}м`, top.sx, top.sy + 1); ctx.textAlign = "left"
        }
      })
    }

    // Compass
    const compX = W - 30, compY = 30
    ctx.beginPath(); ctx.arc(compX, compY, 18, 0, Math.PI * 2)
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fill()
    const nx = Math.sin(yaw + Math.PI), ny = -Math.cos(yaw + Math.PI)
    ctx.beginPath(); ctx.moveTo(compX + nx * 14, compY + ny * 14); ctx.lineTo(compX - nx * 14, compY - ny * 14)
    ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 3; ctx.stroke()
    ctx.fillStyle = "white"; ctx.font = "bold 8px sans-serif"; ctx.textAlign = "center"
    ctx.fillText("С", compX + nx * 8, compY + ny * 8 + 3); ctx.textAlign = "left"
  }, [])

  // Animation loop
  useEffect(() => {
    const loop = () => { draw(); animRef.current = requestAnimationFrame(loop) }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw])

  // Resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    })
    ro.observe(canvas)
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    return () => ro.disconnect()
  }, [])

  // Mouse / touch controls
  const onMouseDown = (e: React.MouseEvent) => { drag.current = { x: e.clientX, y: e.clientY, btn: e.button } }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y
    drag.current = { x: e.clientX, y: e.clientY, btn: drag.current.btn }
    if (drag.current.btn === 2) {
      // Pan
      const cam = camRef.current
      cam.tx -= Math.cos(cam.yaw) * dx * 0.05
      cam.tz += Math.sin(cam.yaw) * dx * 0.05
      cam.tx -= Math.sin(cam.yaw) * dy * 0.05
      cam.tz -= Math.cos(cam.yaw) * dy * 0.05
    } else {
      camRef.current.yaw -= dx * 0.008
      camRef.current.pitch = Math.max(0.1, Math.min(1.4, camRef.current.pitch - dy * 0.006))
    }
  }
  const onMouseUp = () => { drag.current = null }
  const onWheel = (e: React.WheelEvent) => {
    camRef.current.dist = Math.max(8, Math.min(120, camRef.current.dist + e.deltaY * 0.05))
  }

  const LAYER_BTNS: { key: keyof LayerState; label: string; icon: string; color: string }[] = [
    { key: "terrain", label: "Рельеф", icon: "Mountain", color: "bg-green-600" },
    { key: "road", label: "Дорога", icon: "Route", color: "bg-gray-700" },
    { key: "pipes", label: "Сети", icon: "Network", color: "bg-blue-500" },
    { key: "buildings", label: "Здания", icon: "Building2", color: "bg-purple-500" },
    { key: "points", label: "Съёмка", icon: "MapPin", color: "bg-amber-500" },
    { key: "grid", label: "Сетка", icon: "Grid3x3", color: "bg-slate-500" },
    { key: "wireframe", label: "Каркас", icon: "Hexagon", color: "bg-indigo-500" },
  ]

  return (
    <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-semibold text-gray-700 mr-1">Слои:</span>
        {LAYER_BTNS.map(b => (
          <button key={b.key} onClick={() => toggle(b.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${layers[b.key] ? b.color + " text-white shadow" : "bg-gray-100 text-gray-400"}`}>
            <Icon name={b.icon} size={13} fallback="Circle" />
            {b.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Canvas */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden border border-gray-200 shadow-lg bg-gray-900 relative" style={{ height: 520 }}>
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={onWheel}
            onContextMenu={e => e.preventDefault()}
          />
          {/* HUD */}
          <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-3 py-1.5 rounded-lg font-mono">
            CivilPro 3D Viewer
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
              <Icon name="Route" size={15} className="text-indigo-500" /> Ширина дороги
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {ROAD_WIDTHS.map(w => (
                <button key={w.v} onClick={() => setRoadWidth(w.v)}
                  className={`text-xs py-1.5 px-2 rounded-lg transition-all ${roadWidth === w.v ? "bg-indigo-600 text-white font-semibold" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
              <Icon name="Sun" size={15} className="text-amber-500" /> Освещение
            </h3>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Угол солнца</span><span>{sunH}°</span>
              </div>
              <input type="range" min="5" max="175" step="5" value={sunH}
                onChange={e => setSunH(+e.target.value)} className="w-full accent-amber-500" />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
            <h3 className="font-semibold text-gray-800 text-sm mb-2">Легенда</h3>
            {[
              { color: "#4a8a3a", label: "Рельеф DTM" },
              { color: "#2d3748", label: "Дорожный коридор" },
              { color: "#3b82f6", label: "Водопровод" },
              { color: "#78716c", label: "Канализация" },
              { color: "#f59e0b", label: "Теплосеть / точки" },
              { color: "#a78bfa", label: "Здания" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs text-gray-500 space-y-1">
            <div className="font-semibold text-gray-600 mb-1">Управление</div>
            <div>🖱 ЛКМ + drag — вращение</div>
            <div>🖱 ПКМ + drag — панорама</div>
            <div>🖱 Колесо — масштаб</div>
            <div>🧭 Компас (↗) — север</div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}