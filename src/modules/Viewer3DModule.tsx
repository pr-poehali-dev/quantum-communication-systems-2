import { useRef, useState, useEffect, useCallback } from "react"
import Icon from "@/components/ui/icon"

interface Vec3 { x: number; y: number; z: number }

interface LayerState {
  terrain: boolean; road: boolean; pipes: boolean
  buildings: boolean; points: boolean; grid: boolean; wireframe: boolean
}

const ROAD_WIDTHS = [
  { label: "6 м (сел.)", v: 6 },
  { label: "7 м (II кат.)", v: 7 },
  { label: "10.5 м (I кат.)", v: 10.5 },
  { label: "14 м (магистр.)", v: 14 },
]

const LAYER_BTNS: { key: keyof LayerState; label: string; icon: string }[] = [
  { key: "terrain",   label: "Рельеф",   icon: "Mountain" },
  { key: "road",      label: "Дорога",   icon: "Route" },
  { key: "pipes",     label: "Сети",     icon: "Network" },
  { key: "buildings", label: "Здания",   icon: "Building2" },
  { key: "points",    label: "Съёмка",   icon: "MapPin" },
  { key: "grid",      label: "Сетка",    icon: "Grid3x3" },
  { key: "wireframe", label: "Каркас",   icon: "Hexagon" },
]

function H(x: number, z: number): number {
  return (
    Math.sin(x * 0.28) * 2.8 +
    Math.cos(z * 0.21) * 2.2 +
    Math.sin(x * 0.6 + z * 0.43) * 1.1 +
    Math.cos(x * 0.14 + z * 0.56) * 1.6
  )
}

function project(
  p: Vec3, cx: number, cy: number, cz: number,
  yaw: number, pitch: number, fov: number, W: number, H2: number
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
  return { sx: W / 2 + dx * f, sy: H2 / 2 - dy * f, d: dz }
}

function hsvColor(h: number, wireframe: boolean): string {
  if (wireframe) return `hsla(240,70%,60%,0.7)`
  const t = Math.max(0, Math.min(1, (h + 5) / 10))
  if (t < 0.2) return `hsl(${120 - t * 60},${55 + t * 15}%,${28 + t * 12}%)`
  if (t < 0.5) return `hsl(${108 - (t - 0.2) * 130},${50}%,${38 + (t - 0.2) * 8}%)`
  if (t < 0.75) return `hsl(${30 - (t - 0.5) * 40},${40}%,${45 + (t - 0.5) * 10}%)`
  return `hsl(${10},${20}%,${55 + (t - 0.75) * 20}%)`
}

export default function Viewer3DModule({ onNavigate }: { onNavigate?: (id: string) => void } = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drag = useRef<{ x: number; y: number; btn: number } | null>(null)
  const cam = useRef({ yaw: 0.0, pitch: 0.52, dist: 48, tx: 0, tz: 0 })
  const touch = useRef<{ x: number; y: number; d: number } | null>(null)

  const [layers, setLayers] = useState<LayerState>({
    terrain: true, road: true, pipes: true,
    buildings: true, points: true, grid: true, wireframe: false,
  })
  const [roadW, setRoadW] = useState(7)
  const [sunH, setSunH] = useState(45)
  const [showPanel, setShowPanel] = useState(true)
  const [activeView, setActiveView] = useState("3D")

  const lRef = useRef(layers)
  const rwRef = useRef(roadW)
  const sunRef = useRef(sunH)
  useEffect(() => { lRef.current = layers }, [layers])
  useEffect(() => { rwRef.current = roadW }, [roadW])
  useEffect(() => { sunRef.current = sunH }, [sunH])

  const toggle = (k: keyof LayerState) => setLayers(l => ({ ...l, [k]: !l[k] }))

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || canvas.width < 10 || canvas.height < 10) return
    const ctx = canvas.getContext("2d")!
    const W = canvas.width, H2 = canvas.height
    const { yaw, pitch, dist, tx, tz } = cam.current
    const lyr = lRef.current
    const rw = rwRef.current
    const sA = (sunRef.current / 180) * Math.PI

    const cx = tx + Math.sin(yaw) * dist * Math.cos(pitch)
    const cy = dist * Math.sin(pitch)
    const cz = tz + Math.cos(yaw) * dist * Math.cos(pitch)
    const fov = Math.min(W, H2) * 1.45
    const prj = (p: Vec3) => project(p, cx, cy, cz, yaw, pitch, fov, W, H2)

    const night = sunRef.current < 12 || sunRef.current > 168
    const sky = ctx.createLinearGradient(0, 0, 0, H2)
    sky.addColorStop(0, night ? "#050d1a" : "#4a90d9")
    sky.addColorStop(1, night ? "#0f1f3d" : "#c8e6f5")
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H2)

    if (!night) {
      const sx = W * 0.75, sy = H2 * (0.5 - Math.sin(sA) * 0.45)
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 80)
      glow.addColorStop(0, "rgba(255,240,100,0.35)")
      glow.addColorStop(1, "rgba(255,240,100,0)")
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H2)
    }

    const SZ = 42, STEP = 2.5, COLS = Math.ceil(SZ / STEP)
    type Q = { p: { sx: number; sy: number }[]; d: number; h: number }
    const quads: Q[] = []
    for (let r = 0; r < COLS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x0 = -SZ / 2 + c * STEP, z0 = -SZ / 2 + r * STEP
        const x1 = x0 + STEP, z1 = z0 + STEP
        const corners: Vec3[] = [
          { x: x0, y: H(x0, z0), z: z0 }, { x: x1, y: H(x1, z0), z: z0 },
          { x: x1, y: H(x1, z1), z: z1 }, { x: x0, y: H(x0, z1), z: z1 },
        ]
        const ps = corners.map(c2 => prj(c2))
        if (ps.some(p => !p)) continue
        const d = ps.reduce((s, p) => s + p!.d, 0) / 4
        const h = corners.reduce((s, c2) => s + c2.y, 0) / 4
        quads.push({ p: ps.map(p => ({ sx: p!.sx, sy: p!.sy })), d, h })
      }
    }
    quads.sort((a, b) => b.d - a.d)

    if (lyr.terrain) {
      const shade = Math.max(0.55, Math.sin(sA) * 0.45 + 0.75)
      quads.forEach(q => {
        ctx.beginPath()
        ctx.moveTo(q.p[0].sx, q.p[0].sy)
        q.p.slice(1).forEach(p => ctx.lineTo(p.sx, p.sy))
        ctx.closePath()
        if (!lyr.wireframe) {
          ctx.fillStyle = hsvColor(q.h, false)
          ctx.globalAlpha = shade; ctx.fill(); ctx.globalAlpha = 1
        }
        ctx.strokeStyle = lyr.wireframe ? hsvColor(q.h, true) : "rgba(0,0,0,0.07)"
        ctx.lineWidth = lyr.wireframe ? 0.6 : 0.25; ctx.stroke()
      })
    }

    if (lyr.grid) {
      ctx.strokeStyle = "rgba(148,163,184,0.3)"; ctx.lineWidth = 0.5
      for (let v = -SZ / 2; v <= SZ / 2; v += 10) {
        const a = prj({ x: v, y: 0, z: -SZ / 2 }), b = prj({ x: v, y: 0, z: SZ / 2 })
        if (a && b) { ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke() }
        const c2 = prj({ x: -SZ / 2, y: 0, z: v }), d2 = prj({ x: SZ / 2, y: 0, z: v })
        if (c2 && d2) { ctx.beginPath(); ctx.moveTo(c2.sx, c2.sy); ctx.lineTo(d2.sx, d2.sy); ctx.stroke() }
      }
    }

    if (lyr.pipes) {
      const PIPES = [
        { z: -7, dy: -0.5, color: "#3b82f6", lw: 4, label: "Водопровод Ø200" },
        { z: -4, dy: -1.2, color: "#78716c", lw: 5.5, label: "Канализация Ø300" },
        { z: -10, dy: 0.15, color: "#f59e0b", lw: 2.5, label: "Теплосеть 2×Ø100" },
      ]
      PIPES.forEach(pp => {
        const pts: { sx: number; sy: number }[] = []
        for (let xp = -SZ / 2; xp <= SZ / 2; xp += 3) {
          const pr = prj({ x: xp, y: H(xp, pp.z) + pp.dy, z: pp.z })
          if (pr) pts.push(pr)
        }
        if (pts.length < 2) return
        ctx.beginPath(); ctx.moveTo(pts[0].sx, pts[0].sy)
        pts.slice(1).forEach(p => ctx.lineTo(p.sx, p.sy))
        ctx.strokeStyle = pp.color; ctx.lineWidth = pp.lw
        ctx.shadowColor = pp.color; ctx.shadowBlur = 4; ctx.stroke(); ctx.shadowBlur = 0
        const lp = prj({ x: -SZ / 2 + 4, y: H(-SZ / 2 + 4, pp.z) + pp.dy + 1.2, z: pp.z })
        if (lp) {
          ctx.font = "bold 10px sans-serif"
          const tw = ctx.measureText(pp.label).width + 8
          ctx.fillStyle = pp.color + "cc"; ctx.fillRect(lp.sx - 2, lp.sy - 12, tw, 15)
          ctx.fillStyle = "white"; ctx.fillText(pp.label, lp.sx + 2, lp.sy - 1)
        }
      })
    }

    if (lyr.road) {
      const N = 60
      const roadPts: { sx: number; sy: number }[][] = [[], []]
      for (let i = 0; i <= N; i++) {
        const t = (i / N) * SZ - SZ / 2
        const xc = t * 0.8 + Math.sin(t * 0.13) * 4
        const zc = Math.cos(t * 0.11) * 6 + t * 0.3
        const yc = H(xc, zc) + 0.08
        const side = rw / 2
        const ang = Math.atan2(Math.cos(t * 0.11) * -6 * 0.11, 0.8 + Math.cos(t * 0.13) * 4 * 0.13)
        const px = Math.cos(ang + Math.PI / 2), pz = Math.sin(ang + Math.PI / 2)
        const l = prj({ x: xc - px * side, y: yc, z: zc - pz * side })
        const r2 = prj({ x: xc + px * side, y: yc, z: zc + pz * side })
        if (l) roadPts[0].push(l); if (r2) roadPts[1].push(r2)
      }
      if (roadPts[0].length > 1 && roadPts[1].length > 1) {
        ctx.beginPath()
        ctx.moveTo(roadPts[0][0].sx, roadPts[0][0].sy)
        roadPts[0].slice(1).forEach(p => ctx.lineTo(p.sx, p.sy))
        roadPts[1].slice().reverse().forEach(p => ctx.lineTo(p.sx, p.sy))
        ctx.closePath()
        ctx.fillStyle = "rgba(35,40,55,0.88)"; ctx.fill()
        ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 0.8; ctx.stroke()
        for (let i = 2; i < roadPts[0].length - 2; i += 6) {
          const lp = roadPts[0][i], rp = roadPts[1][i]
          const mx = (lp.sx + rp.sx) / 2, my = (lp.sy + rp.sy) / 2
          const nx = roadPts[0][i + 1] ? (roadPts[0][i + 1].sx + roadPts[1][i + 1].sx) / 2 : mx + 2
          const ny = roadPts[0][i + 1] ? (roadPts[0][i + 1].sy + roadPts[1][i + 1].sy) / 2 : my
          const dl = Math.sqrt((nx - mx) ** 2 + (ny - my) ** 2)
          if (dl > 3) {
            ctx.beginPath(); ctx.moveTo(mx - (nx - mx) / dl * 3, my - (ny - my) / dl * 3)
            ctx.lineTo(mx + (nx - mx) / dl * 3, my + (ny - my) / dl * 3)
            ctx.strokeStyle = "rgba(255,220,0,0.7)"; ctx.lineWidth = 1.2; ctx.stroke()
          }
        }
      }
    }

    if (lyr.buildings) {
      const BLDGS = [
        { x: -14, z: 11, w: 7, d: 5, bh: 9, color: [148, 163, 184] as [number,number,number], label: "Корпус А" },
        { x: 1, z: 13, w: 9, d: 7, bh: 13, color: [167, 139, 250] as [number,number,number], label: "Корпус Б" },
        { x: 14, z: 11, w: 6, d: 5, bh: 6, color: [110, 231, 183] as [number,number,number], label: "Склад" },
      ]
      BLDGS.forEach(b => {
        const gy = H(b.x, b.z), hw = b.w / 2, hd = b.d / 2
        const faces: [Vec3, Vec3, Vec3, Vec3][] = [
          [{ x: b.x - hw, y: gy, z: b.z + hd }, { x: b.x + hw, y: gy, z: b.z + hd }, { x: b.x + hw, y: gy + b.bh, z: b.z + hd }, { x: b.x - hw, y: gy + b.bh, z: b.z + hd }],
          [{ x: b.x + hw, y: gy, z: b.z - hd }, { x: b.x + hw, y: gy, z: b.z + hd }, { x: b.x + hw, y: gy + b.bh, z: b.z + hd }, { x: b.x + hw, y: gy + b.bh, z: b.z - hd }],
          [{ x: b.x - hw, y: gy + b.bh, z: b.z - hd }, { x: b.x + hw, y: gy + b.bh, z: b.z - hd }, { x: b.x + hw, y: gy + b.bh, z: b.z + hd }, { x: b.x - hw, y: gy + b.bh, z: b.z + hd }],
        ]
        const mults = [0.88, 0.68, 1.0]
        faces.forEach((face, fi) => {
          const ps = face.map(v => prj(v)); if (ps.some(p => !p)) return
          const m = mults[fi]; const [r, g, bl] = b.color.map(c => Math.round(c * m))
          ctx.beginPath(); ctx.moveTo(ps[0]!.sx, ps[0]!.sy)
          ps.slice(1).forEach(p => ctx.lineTo(p!.sx, p!.sy)); ctx.closePath()
          ctx.fillStyle = `rgb(${r},${g},${bl})`; ctx.fill()
          ctx.strokeStyle = "rgba(0,0,0,0.18)"; ctx.lineWidth = 0.6; ctx.stroke()
        })
        const lp = prj({ x: b.x, y: gy + b.bh + 4, z: b.z })
        if (lp) {
          ctx.font = "bold 10px sans-serif"
          const tw = ctx.measureText(b.label).width + 10
          ctx.fillStyle = "rgba(79,70,229,0.85)"; ctx.fillRect(lp.sx - tw / 2, lp.sy - 13, tw, 17)
          ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.fillText(b.label, lp.sx, lp.sy - 1); ctx.textAlign = "left"
        }
      })
    }

    if (lyr.points) {
      const PTS = [
        { x: -17, z: -16, e: 120.5, n: "ТН-1" }, { x: -2, z: -15, e: 122.1, n: "ТН-2" },
        { x: 15, z: -17, e: 119.8, n: "ТН-3" }, { x: -13, z: 0, e: 121.3, n: "ТН-4" },
        { x: 13, z: 1, e: 123.0, n: "ТН-5" }, { x: 0, z: 15, e: 120.8, n: "ТН-6" },
      ]
      PTS.forEach(p => {
        const gy = H(p.x, p.z)
        const base = prj({ x: p.x, y: gy, z: p.z }), tip = prj({ x: p.x, y: gy + 5, z: p.z })
        if (!base || !tip) return
        ctx.beginPath(); ctx.moveTo(base.sx, base.sy); ctx.lineTo(tip.sx, tip.sy)
        ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 2
        ctx.shadowColor = "#f59e0b"; ctx.shadowBlur = 3; ctx.stroke(); ctx.shadowBlur = 0
        ctx.beginPath(); ctx.arc(base.sx, base.sy, 5, 0, Math.PI * 2)
        ctx.fillStyle = "#f59e0b"; ctx.fill()
        ctx.strokeStyle = "white"; ctx.lineWidth = 1.5; ctx.stroke()
        ctx.font = "bold 9px sans-serif"
        const txt = `${p.n}  ${p.e}м`, tw = ctx.measureText(txt).width + 8
        ctx.fillStyle = "rgba(180,120,0,0.88)"; ctx.fillRect(tip.sx - tw / 2, tip.sy - 14, tw, 15)
        ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.fillText(txt, tip.sx, tip.sy - 3); ctx.textAlign = "left"
      })
    }

    // compass
    const cpx = W - 38, cpy = 38, cr = 20
    ctx.beginPath(); ctx.arc(cpx, cpy, cr, 0, Math.PI * 2)
    ctx.fillStyle = "rgba(10,15,30,0.65)"; ctx.fill()
    ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 1; ctx.stroke()
    const nnx = Math.sin(yaw), nny = -Math.cos(yaw)
    ctx.beginPath()
    ctx.moveTo(cpx + nnx * (cr - 3), cpy + nny * (cr - 3))
    ctx.lineTo(cpx - nnx * (cr - 3), cpy - nny * (cr - 3))
    ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 3
    ctx.shadowColor = "#ef4444"; ctx.shadowBlur = 5; ctx.stroke(); ctx.shadowBlur = 0
    ctx.fillStyle = "white"; ctx.font = "bold 8px sans-serif"; ctx.textAlign = "center"
    ctx.fillText("С", cpx + nnx * 10, cpy + nny * 10 + 3); ctx.textAlign = "left"

    // HUD
    ctx.fillStyle = "rgba(10,15,30,0.55)"; ctx.fillRect(8, H2 - 28, 200, 22)
    ctx.fillStyle = "rgba(180,220,255,0.85)"; ctx.font = "10px monospace"
    ctx.fillText(`X:${cam.current.tx.toFixed(1)}  Z:${cam.current.tz.toFixed(1)}  Dist:${cam.current.dist.toFixed(0)}m  Ш:${rw}м`, 14, H2 - 13)
  }, [])

  useEffect(() => {
    let id: number
    const loop = () => { render(); id = requestAnimationFrame(loop) }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [render])

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const sync = () => {
      const { offsetWidth: w, offsetHeight: h } = canvas
      if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) { canvas.width = w; canvas.height = h }
    }
    const ro = new ResizeObserver(sync)
    ro.observe(canvas); sync(); setTimeout(sync, 60); setTimeout(sync, 200)
    return () => ro.disconnect()
  }, [])

  const onDown = (e: React.MouseEvent) => { drag.current = { x: e.clientX, y: e.clientY, btn: e.button } }
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
      cam.current.pitch = Math.max(0.05, Math.min(1.35, cam.current.pitch + dy * 0.005))
    }
  }
  const onUp = () => { drag.current = null }
  const onWheel = (e: React.WheelEvent) => {
    cam.current.dist = Math.max(6, Math.min(130, cam.current.dist + e.deltaY * 0.05))
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
      cam.current.pitch = Math.max(0.05, Math.min(1.35, cam.current.pitch + dy * 0.005))
      touch.current = { ...touch.current, x: e.touches[0].clientX, y: e.touches[0].clientY }
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const d = Math.sqrt(dx * dx + dy * dy)
      cam.current.dist = Math.max(6, Math.min(130, cam.current.dist - (d - touch.current.d) * 0.1))
      touch.current = { ...touch.current, d }
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0f1117] text-gray-200 overflow-hidden" style={{ fontFamily: "Arial, sans-serif" }}>

      {/* ── Toolbar ── */}
      <div className="bg-[#1a1a2a] border-b border-gray-700 flex items-center gap-0 px-2 flex-shrink-0" style={{ height: 36 }}>
        <div className="flex items-center gap-1 border-r border-gray-700 pr-2 mr-2">
          <div className="w-5 h-5 bg-[#0078d4] flex items-center justify-center text-white font-bold text-[10px] rounded-sm">C</div>
          <span className="text-[11px] text-gray-300 font-semibold ml-1">3D-вьюер</span>
        </div>
        {/* View mode */}
        <div className="flex items-center gap-0.5 border-r border-gray-700 pr-2 mr-2">
          {["3D","2D план","Разрез"].map(v => (
            <button key={v} onClick={() => setActiveView(v)}
              className={`text-[10px] px-2 py-1 rounded transition-colors ${activeView === v ? "bg-[#0078d4] text-white" : "text-gray-400 hover:bg-[#2a2a3a] hover:text-white"}`}>
              {v}
            </button>
          ))}
        </div>
        {/* Layers */}
        <div className="flex items-center gap-0.5 flex-1 overflow-x-auto">
          {LAYER_BTNS.map(b => (
            <button key={b.key} onClick={() => toggle(b.key)}
              className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded transition-colors whitespace-nowrap
                ${layers[b.key] ? "bg-[#0078d4] text-white" : "text-gray-500 hover:bg-[#2a2a3a] hover:text-white"}`}>
              <Icon name={b.icon} size={11} fallback="Circle" />
              {b.label}
            </button>
          ))}
        </div>
        {/* Right controls */}
        <div className="flex items-center gap-1 ml-2">
          <button onClick={() => { cam.current = { yaw: 0, pitch: 0.52, dist: 48, tx: 0, tz: 0 } }}
            className="text-[10px] text-gray-400 hover:text-white px-2 py-1 bg-[#2a2a3a] rounded hover:bg-[#3a3a4e] transition-colors flex items-center gap-1">
            <Icon name="Crosshair" size={11} /> Центр
          </button>
          <button onClick={() => setShowPanel(s => !s)}
            className="text-[10px] text-gray-400 hover:text-white px-2 py-1 bg-[#2a2a3a] rounded hover:bg-[#3a3a4e] transition-colors">
            <Icon name={showPanel ? "PanelRightClose" : "PanelRightOpen"} size={13} />
          </button>
        </div>
      </div>

      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden bg-[#0f1117]">
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{ cursor: drag.current ? "grabbing" : "grab", touchAction: "none" }}
            onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
            onWheel={onWheel} onContextMenu={e => e.preventDefault()}
            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={() => { touch.current = null }}
          />
          {/* top-left badge */}
          <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/50 backdrop-blur text-white text-[10px] px-2 py-1 rounded font-mono select-none">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            CivilPro 3D · {activeView}
          </div>
          {/* controls hint */}
          <div className="absolute bottom-8 left-2 text-[9px] text-gray-500 select-none space-y-0.5">
            <div>ЛКМ+drag — вращение</div>
            <div>ПКМ+drag — панорама</div>
            <div>Колесо — масштаб</div>
          </div>
        </div>

        {/* ── Right panel ── */}
        {showPanel && (
          <div className="bg-[#1a1a2a] border-l border-gray-700 flex flex-col flex-shrink-0 overflow-y-auto" style={{ width: 200 }}>

            {/* Road width */}
            <div className="p-3 border-b border-gray-700">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                <Icon name="Route" size={11} /> Ширина дороги
              </div>
              <div className="grid grid-cols-2 gap-1">
                {ROAD_WIDTHS.map(w => (
                  <button key={w.v} onClick={() => setRoadW(w.v)}
                    className={`text-[10px] py-1.5 px-1 rounded transition-all font-medium text-center
                      ${roadW === w.v ? "bg-[#0078d4] text-white" : "bg-[#252535] text-gray-400 hover:bg-[#2d2d4e] hover:text-white"}`}>
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lighting */}
            <div className="p-3 border-b border-gray-700">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                <Icon name="Sun" size={11} /> Освещение
              </div>
              <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                <span>Угол солнца</span>
                <span className="font-mono text-gray-300">{sunH}°</span>
              </div>
              <input type="range" min="5" max="175" step="5" value={sunH}
                onChange={e => setSunH(+e.target.value)}
                className="w-full accent-amber-500 cursor-pointer" />
              <div className="flex justify-between text-[9px] text-gray-600 mt-0.5">
                <span>🌙</span><span>☀️</span><span>🌙</span>
              </div>
            </div>

            {/* Legend */}
            <div className="p-3 border-b border-gray-700">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Легенда</div>
              <div className="space-y-1.5">
                {[
                  { color: "#4a8a3a", label: "Рельеф DTM" },
                  { color: "#263045", label: "Дорожный коридор" },
                  { color: "#3b82f6", label: "Водопровод" },
                  { color: "#78716c", label: "Канализация" },
                  { color: "#f59e0b", label: "Теплосеть / точки" },
                  { color: "#a78bfa", label: "Здания" },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-2 text-[10px] text-gray-400">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: l.color }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Modules nav */}
            <div className="p-3">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Перейти к модулю</div>
              <div className="space-y-1">
                {[
                  { id: "civilcad", icon: "Monitor", label: "CivilCAD" },
                  { id: "geodesy", icon: "Mountain", label: "Геодезия" },
                  { id: "corridor", icon: "Navigation", label: "Коридоры" },
                  { id: "surfaces", icon: "Triangle", label: "Поверхности" },
                  { id: "analysis", icon: "BarChart3", label: "Анализ" },
                ].map(m => (
                  <button key={m.id} onClick={() => onNavigate?.(m.id)}
                    className="w-full flex items-center gap-2 text-[10px] text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-[#252535] transition-colors text-left">
                    <Icon name={m.icon} size={11} fallback="Square" />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Status bar ── */}
      <div className="bg-[#1a1a2a] border-t border-gray-700 flex items-center px-3 gap-4 flex-shrink-0 text-[10px] text-gray-500" style={{ height: 22 }}>
        <span className="text-white bg-[#0078d4] px-1.5 font-bold">3D</span>
        <span>Рельеф: DTM 50×50 м</span>
        <span>Трасса: ШД-38 · {roadW} м</span>
        <span>Солнце: {sunH}°</span>
        <span className="ml-auto">ЛКМ — вращение · ПКМ — панорама · Колесо — масштаб</span>
      </div>
    </div>
  )
}
