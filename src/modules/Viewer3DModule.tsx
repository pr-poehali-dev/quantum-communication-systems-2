import { useRef, useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
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

const LAYER_BTNS: { key: keyof LayerState; label: string; icon: string; on: string }[] = [
  { key: "terrain",   label: "Рельеф",  icon: "Mountain",    on: "bg-green-600" },
  { key: "road",      label: "Дорога",  icon: "Route",       on: "bg-gray-700" },
  { key: "pipes",     label: "Сети",    icon: "Network",     on: "bg-blue-500" },
  { key: "buildings", label: "Здания",  icon: "Building2",   on: "bg-purple-500" },
  { key: "points",    label: "Съёмка",  icon: "MapPin",      on: "bg-amber-500" },
  { key: "grid",      label: "Сетка",   icon: "Grid3x3",     on: "bg-slate-500" },
  { key: "wireframe", label: "Каркас",  icon: "Hexagon",     on: "bg-indigo-500" },
]

// ── math helpers ──────────────────────────────────────────────────────────

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

// ── main component ────────────────────────────────────────────────────────

export default function Viewer3DModule() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const raf = useRef(0)
  const drag = useRef<{ x: number; y: number; btn: number } | null>(null)
  const cam = useRef({ yaw: 0.6, pitch: 0.48, dist: 50, tx: 0, tz: 0 })

  const [layers, setLayers] = useState<LayerState>({
    terrain: true, road: true, pipes: true,
    buildings: true, points: true, grid: true, wireframe: false,
  })
  const [roadW, setRoadW] = useState(7)
  const [sunH, setSunH] = useState(45)

  // keep latest values accessible in rAF without re-creating draw
  const lRef = useRef(layers)
  const rwRef = useRef(roadW)
  const sunRef = useRef(sunH)
  useEffect(() => { lRef.current = layers }, [layers])
  useEffect(() => { rwRef.current = roadW }, [roadW])
  useEffect(() => { sunRef.current = sunH }, [sunH])

  const toggle = (k: keyof LayerState) => setLayers(l => ({ ...l, [k]: !l[k] }))

  // ── render ──────────────────────────────────────────────────────────────

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
    const fov = Math.min(W, H2) * 1.25

    const prj = (p: Vec3) => project(p, cx, cy, cz, yaw, pitch, fov, W, H2)

    // sky
    const night = sunRef.current < 12 || sunRef.current > 168
    const sky = ctx.createLinearGradient(0, 0, 0, H2)
    sky.addColorStop(0, night ? "#050d1a" : "#4a90d9")
    sky.addColorStop(1, night ? "#0f1f3d" : "#c8e6f5")
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H2)

    // sun glow
    if (!night) {
      const sx = W * 0.75, sy = H2 * (0.5 - Math.sin(sA) * 0.45)
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 80)
      glow.addColorStop(0, "rgba(255,240,100,0.35)")
      glow.addColorStop(1, "rgba(255,240,100,0)")
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H2)
    }

    // ── terrain quads ──────────────────────────────────────────────
    const SZ = 42, STEP = 2.5, COLS = Math.ceil(SZ / STEP)
    type Q = { p: { sx: number; sy: number }[]; d: number; h: number }
    const quads: Q[] = []

    for (let r = 0; r < COLS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x0 = -SZ / 2 + c * STEP, z0 = -SZ / 2 + r * STEP
        const x1 = x0 + STEP, z1 = z0 + STEP
        const corners: Vec3[] = [
          { x: x0, y: H(x0, z0), z: z0 },
          { x: x1, y: H(x1, z0), z: z0 },
          { x: x1, y: H(x1, z1), z: z1 },
          { x: x0, y: H(x0, z1), z: z1 },
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
        ctx.lineWidth = lyr.wireframe ? 0.6 : 0.25
        ctx.stroke()
      })
    }

    // ── grid ──────────────────────────────────────────────────────
    if (lyr.grid) {
      ctx.strokeStyle = "rgba(148,163,184,0.3)"; ctx.lineWidth = 0.5
      for (let v = -SZ / 2; v <= SZ / 2; v += 10) {
        const a = prj({ x: v, y: 0, z: -SZ / 2 }), b = prj({ x: v, y: 0, z: SZ / 2 })
        if (a && b) { ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke() }
        const c2 = prj({ x: -SZ / 2, y: 0, z: v }), d2 = prj({ x: SZ / 2, y: 0, z: v })
        if (c2 && d2) { ctx.beginPath(); ctx.moveTo(c2.sx, c2.sy); ctx.lineTo(d2.sx, d2.sy); ctx.stroke() }
      }
    }

    // ── pipes ──────────────────────────────────────────────────────
    if (lyr.pipes) {
      const PIPES = [
        { z: -7,  dy: -0.5, color: "#3b82f6", lw: 4,   label: "Водопровод Ø200" },
        { z: -4,  dy: -1.2, color: "#78716c", lw: 5.5, label: "Канализация Ø300" },
        { z: -10, dy: 0.15, color: "#f59e0b", lw: 2.5, label: "Теплосеть 2×Ø100" },
      ]
      PIPES.forEach(pp => {
        const pts: { sx: number; sy: number }[] = []
        for (let xp = -SZ / 2; xp <= SZ / 2; xp += 3) {
          const gy = H(xp, pp.z) + pp.dy
          const pr = prj({ x: xp, y: gy, z: pp.z })
          if (pr) pts.push(pr)
        }
        if (pts.length < 2) return
        ctx.beginPath(); ctx.moveTo(pts[0].sx, pts[0].sy)
        pts.slice(1).forEach(p => ctx.lineTo(p.sx, p.sy))
        ctx.strokeStyle = pp.color; ctx.lineWidth = pp.lw
        ctx.shadowColor = pp.color; ctx.shadowBlur = 4; ctx.stroke()
        ctx.shadowBlur = 0
        const lp = prj({ x: -SZ / 2 + 4, y: H(-SZ / 2 + 4, pp.z) + pp.dy + 1.2, z: pp.z })
        if (lp) {
          ctx.font = "bold 10px sans-serif"
          const tw = ctx.measureText(pp.label).width + 8
          ctx.fillStyle = pp.color + "cc"
          ctx.fillRect(lp.sx - 2, lp.sy - 12, tw, 15)
          ctx.fillStyle = "white"; ctx.fillText(pp.label, lp.sx + 2, lp.sy - 1)
        }
      })
    }

    // ── road ──────────────────────────────────────────────────────
    if (lyr.road) {
      const N = 60
      const spine: Vec3[] = Array.from({ length: N + 1 }, (_, i) => {
        const t = i / N
        const x = (t - 0.5) * 40
        const z = Math.sin(t * Math.PI * 1.5) * 7 + Math.cos(t * Math.PI * 0.8) * 2
        return { x, y: H(x, z) + 0.28, z }
      })

      // road fill (two edge offsets)
      const leftPts: { sx: number; sy: number }[] = []
      const rightPts: { sx: number; sy: number }[] = []
      spine.forEach((p, i) => {
        const prev = spine[Math.max(0, i - 1)], next = spine[Math.min(N, i + 1)]
        const tx2 = next.x - prev.x, tz2 = next.z - prev.z
        const len = Math.sqrt(tx2 * tx2 + tz2 * tz2) || 1
        const nx = -tz2 / len * rw / 2, nz = tx2 / len * rw / 2
        const lp = prj({ x: p.x + nx, y: H(p.x + nx, p.z + nz) + 0.28, z: p.z + nz })
        const rp = prj({ x: p.x - nx, y: H(p.x - nx, p.z - nz) + 0.28, z: p.z - nz })
        if (lp) leftPts.push(lp)
        if (rp) rightPts.push(rp)
      })
      if (leftPts.length > 1 && rightPts.length > 1) {
        ctx.beginPath()
        ctx.moveTo(leftPts[0].sx, leftPts[0].sy)
        leftPts.forEach(p => ctx.lineTo(p.sx, p.sy))
        ;[...rightPts].reverse().forEach(p => ctx.lineTo(p.sx, p.sy))
        ctx.closePath()
        ctx.fillStyle = "#263045"; ctx.fill()
        ctx.strokeStyle = "rgba(80,100,140,0.6)"; ctx.lineWidth = 0.8; ctx.stroke()
      }

      // centre dashes
      ctx.setLineDash([8, 8])
      ctx.beginPath()
      spine.forEach((p, i) => {
        const pp = prj(p)
        if (pp) { if (i === 0) ctx.moveTo(pp.sx, pp.sy); else ctx.lineTo(pp.sx, pp.sy) }
      })
      ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 1.2; ctx.stroke()
      ctx.setLineDash([])

      // edge lines
      ;[leftPts, rightPts].forEach(side => {
        ctx.beginPath()
        side.forEach((p, i) => { if (i === 0) ctx.moveTo(p.sx, p.sy); else ctx.lineTo(p.sx, p.sy) })
        ctx.strokeStyle = "rgba(255,220,50,0.7)"; ctx.lineWidth = 1; ctx.stroke()
      })
    }

    // ── buildings ─────────────────────────────────────────────────
    if (lyr.buildings) {
      const BLDGS = [
        { x: -14, z: 11, w: 7, d: 5, bh: 9,  color: [148, 163, 184], label: "Корпус А" },
        { x: 1,   z: 13, w: 9, d: 7, bh: 13, color: [167, 139, 250], label: "Корпус Б" },
        { x: 14,  z: 11, w: 6, d: 5, bh: 6,  color: [110, 231, 183], label: "Склад" },
      ]
      BLDGS.forEach(b => {
        const gy = H(b.x, b.z)
        const hw = b.w / 2, hd = b.d / 2
        // faces: front, right, top
        const faces: [Vec3, Vec3, Vec3, Vec3][] = [
          [{ x: b.x - hw, y: gy, z: b.z + hd }, { x: b.x + hw, y: gy, z: b.z + hd }, { x: b.x + hw, y: gy + b.bh, z: b.z + hd }, { x: b.x - hw, y: gy + b.bh, z: b.z + hd }],
          [{ x: b.x + hw, y: gy, z: b.z - hd }, { x: b.x + hw, y: gy, z: b.z + hd }, { x: b.x + hw, y: gy + b.bh, z: b.z + hd }, { x: b.x + hw, y: gy + b.bh, z: b.z - hd }],
          [{ x: b.x - hw, y: gy + b.bh, z: b.z - hd }, { x: b.x + hw, y: gy + b.bh, z: b.z - hd }, { x: b.x + hw, y: gy + b.bh, z: b.z + hd }, { x: b.x - hw, y: gy + b.bh, z: b.z + hd }],
        ]
        const mults = [0.88, 0.68, 1.0]
        faces.forEach((face, fi) => {
          const ps = face.map(v => prj(v))
          if (ps.some(p => !p)) return
          const m = mults[fi]
          const [r, g, bl] = b.color.map(c => Math.round(c * m))
          ctx.beginPath()
          ctx.moveTo(ps[0]!.sx, ps[0]!.sy)
          ps.slice(1).forEach(p => ctx.lineTo(p!.sx, p!.sy))
          ctx.closePath()
          ctx.fillStyle = `rgb(${r},${g},${bl})`; ctx.fill()
          ctx.strokeStyle = "rgba(0,0,0,0.18)"; ctx.lineWidth = 0.6; ctx.stroke()
        })
        // roof ridge
        const ridgeL = prj({ x: b.x - hw / 2, y: gy + b.bh + 2.5, z: b.z })
        const ridgeR = prj({ x: b.x + hw / 2, y: gy + b.bh + 2.5, z: b.z })
        const roofPts: [Vec3, Vec3, Vec3, Vec3][] = [
          [{ x: b.x - hw, y: gy + b.bh, z: b.z - hd }, { x: b.x + hw, y: gy + b.bh, z: b.z - hd }, { x: b.x + hw / 2, y: gy + b.bh + 2.5, z: b.z }, { x: b.x - hw / 2, y: gy + b.bh + 2.5, z: b.z }],
          [{ x: b.x - hw, y: gy + b.bh, z: b.z + hd }, { x: b.x + hw, y: gy + b.bh, z: b.z + hd }, { x: b.x + hw / 2, y: gy + b.bh + 2.5, z: b.z }, { x: b.x - hw / 2, y: gy + b.bh + 2.5, z: b.z }],
        ]
        roofPts.forEach((face, fi) => {
          const ps = face.map(v => prj(v))
          if (ps.some(p => !p)) return
          ctx.beginPath()
          ctx.moveTo(ps[0]!.sx, ps[0]!.sy)
          ps.slice(1).forEach(p => ctx.lineTo(p!.sx, p!.sy))
          ctx.closePath()
          ctx.fillStyle = fi === 0 ? "#c0392b" : "#96281b"; ctx.fill()
          ctx.strokeStyle = "rgba(0,0,0,0.2)"; ctx.lineWidth = 0.5; ctx.stroke()
        })
        // label
        const lp = prj({ x: b.x, y: gy + b.bh + 4, z: b.z })
        if (lp) {
          ctx.font = "bold 10px sans-serif"
          const tw = ctx.measureText(b.label).width + 10
          ctx.fillStyle = "rgba(79,70,229,0.85)"; ctx.fillRect(lp.sx - tw / 2, lp.sy - 13, tw, 17)
          ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.fillText(b.label, lp.sx, lp.sy - 1); ctx.textAlign = "left"
        }
      })
    }

    // ── survey points ─────────────────────────────────────────────
    if (lyr.points) {
      const PTS = [
        { x: -17, z: -16, e: 120.5, n: "ТН-1" },
        { x: -2,  z: -15, e: 122.1, n: "ТН-2" },
        { x: 15,  z: -17, e: 119.8, n: "ТН-3" },
        { x: -13, z: 0,   e: 121.3, n: "ТН-4" },
        { x: 13,  z: 1,   e: 123.0, n: "ТН-5" },
        { x: 0,   z: 15,  e: 120.8, n: "ТН-6" },
      ]
      PTS.forEach(p => {
        const gy = H(p.x, p.z)
        const base = prj({ x: p.x, y: gy, z: p.z })
        const tip = prj({ x: p.x, y: gy + 5, z: p.z })
        if (!base || !tip) return
        // pole
        ctx.beginPath(); ctx.moveTo(base.sx, base.sy); ctx.lineTo(tip.sx, tip.sy)
        ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 2;
        ctx.shadowColor = "#f59e0b"; ctx.shadowBlur = 3; ctx.stroke(); ctx.shadowBlur = 0
        // dot
        ctx.beginPath(); ctx.arc(base.sx, base.sy, 5, 0, Math.PI * 2)
        ctx.fillStyle = "#f59e0b"; ctx.fill()
        ctx.strokeStyle = "white"; ctx.lineWidth = 1.5; ctx.stroke()
        // label
        ctx.font = "bold 9px sans-serif"
        const txt = `${p.n}  ${p.e}м`
        const tw = ctx.measureText(txt).width + 8
        ctx.fillStyle = "rgba(180,120,0,0.88)"; ctx.fillRect(tip.sx - tw / 2, tip.sy - 14, tw, 15)
        ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.fillText(txt, tip.sx, tip.sy - 3); ctx.textAlign = "left"
      })
    }

    // ── compass ───────────────────────────────────────────────────
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

    // ── HUD coords ────────────────────────────────────────────────
    ctx.fillStyle = "rgba(10,15,30,0.55)"
    ctx.fillRect(8, H2 - 28, 180, 22)
    ctx.fillStyle = "rgba(180,220,255,0.85)"; ctx.font = "10px monospace"
    ctx.fillText(`X:${cam.current.tx.toFixed(1)}  Z:${cam.current.tz.toFixed(1)}  Dist:${cam.current.dist.toFixed(0)}m`, 14, H2 - 13)

  }, [])

  // ── animation loop ────────────────────────────────────────────────────────
  useEffect(() => {
    let id: number
    const loop = () => { render(); id = requestAnimationFrame(loop) }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [render])

  // ── canvas sizing ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const sync = () => {
      const { offsetWidth: w, offsetHeight: h } = canvas
      if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w; canvas.height = h
      }
    }
    const ro = new ResizeObserver(sync)
    ro.observe(canvas)
    // try immediately and after a short delay for first render
    sync(); setTimeout(sync, 60); setTimeout(sync, 200)
    return () => ro.disconnect()
  }, [])

  // ── mouse controls ───────────────────────────────────────────────────────
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
      cam.current.yaw   += dx * 0.007
      cam.current.pitch  = Math.max(0.05, Math.min(1.35, cam.current.pitch + dy * 0.005))
    }
  }
  const onUp   = () => { drag.current = null }
  const onWheel = (e: React.WheelEvent) => {
    cam.current.dist = Math.max(6, Math.min(130, cam.current.dist + e.deltaY * 0.05))
  }

  // ── touch controls ───────────────────────────────────────────────────────
  const touch = useRef<{ x: number; y: number; d: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, d: 0 }
    else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      touch.current = { x: 0, y: 0, d: Math.sqrt(dx * dx + dy * dy) }
    }
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touch.current) return
    e.preventDefault()
    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - touch.current.x
      const dy = e.touches[0].clientY - touch.current.y
      cam.current.yaw   += dx * 0.007
      cam.current.pitch  = Math.max(0.05, Math.min(1.35, cam.current.pitch + dy * 0.005))
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
    <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

      {/* layer buttons */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-semibold text-gray-700 mr-1">Слои:</span>
        {LAYER_BTNS.map(b => (
          <button key={b.key} onClick={() => toggle(b.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all select-none
              ${layers[b.key] ? b.on + " text-white shadow-sm" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}>
            <Icon name={b.icon} size={13} fallback="Circle" />
            {b.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* canvas */}
        <div
          className="lg:col-span-3 rounded-2xl overflow-hidden border border-gray-700 shadow-xl bg-gray-950 relative"
          style={{ height: 520 }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{ cursor: drag.current ? "grabbing" : "grab", touchAction: "none" }}
            onMouseDown={onDown}
            onMouseMove={onMove}
            onMouseUp={onUp}
            onMouseLeave={onUp}
            onWheel={onWheel}
            onContextMenu={e => e.preventDefault()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={() => { touch.current = null }}
          />
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur text-white text-xs px-3 py-1.5 rounded-lg font-mono select-none">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            CivilPro 3D Viewer
          </div>
        </div>

        {/* side panel */}
        <div className="space-y-3">

          {/* road width */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
            <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
              <Icon name="Route" size={15} className="text-indigo-500" /> Ширина дороги
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {ROAD_WIDTHS.map(w => (
                <button key={w.v} onClick={() => setRoadW(w.v)}
                  className={`text-xs py-2 px-2 rounded-lg transition-all font-medium
                    ${roadW === w.v ? "bg-indigo-600 text-white shadow" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* lighting */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
              <Icon name="Sun" size={15} className="text-amber-500" /> Освещение
            </h3>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Угол солнца</span>
                <span className="font-mono font-semibold">{sunH}°</span>
              </div>
              <input type="range" min="5" max="175" step="5" value={sunH}
                onChange={e => setSunH(+e.target.value)}
                className="w-full accent-amber-500 cursor-pointer" />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>🌙 Ночь</span><span>☀️ День</span><span>🌙 Ночь</span>
              </div>
            </div>
          </div>

          {/* legend */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="font-semibold text-gray-800 text-sm mb-3">Легенда</h3>
            <div className="space-y-1.5">
              {[
                { color: "#4a8a3a", label: "Рельеф DTM" },
                { color: "#263045", label: "Дорожный коридор" },
                { color: "#3b82f6", label: "Водопровод" },
                { color: "#78716c", label: "Канализация" },
                { color: "#f59e0b", label: "Теплосеть / точки" },
                { color: "#a78bfa", label: "Здания" },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-3.5 h-3.5 rounded-sm flex-shrink-0 border border-black/10" style={{ background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          {/* controls hint */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs text-gray-500 space-y-1.5">
            <div className="font-semibold text-gray-600 mb-1">Управление</div>
            <div>🖱 ЛКМ + drag — вращение</div>
            <div>🖱 ПКМ + drag — панорама</div>
            <div>🖱 Колесо — масштаб</div>
            <div>👆 Касание — вращение</div>
            <div>👌 Щипок — масштаб</div>
            <div>🧭 Компас (↗) — север</div>
          </div>

        </div>
      </div>
    </motion.div>
  )
}
