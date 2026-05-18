import { useRef, useState, useMemo, Suspense } from "react"
import { Canvas, useFrame, ThreeElements } from "@react-three/fiber"
import { OrbitControls, Grid, Sky, Stats, Html, GizmoHelper, GizmoViewport, Environment } from "@react-three/drei"
import * as THREE from "three"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Icon from "@/components/ui/icon"

// ─── Terrain ───────────────────────────────────────────────────────────────

function generateHeightMap(size: number, scale: number): Float32Array {
  const data = new Float32Array(size * size)
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const x = (i / size) * 4, z = (j / size) * 4
      data[i * size + j] =
        Math.sin(x * 1.2) * 2.5 +
        Math.cos(z * 0.9) * 2.0 +
        Math.sin(x * 2.5 + z * 1.8) * 1.0 +
        Math.cos(x * 0.6 + z * 2.3) * 1.5
    }
  }
  return data
}

function Terrain({ size = 64, segments = 63, scale = 40, wireframe = false, showContours = false }: {
  size?: number; segments?: number; scale?: number; wireframe?: boolean; showContours?: boolean
}) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(scale, scale, segments, segments)
    const heights = generateHeightMap(size, scale)
    const pos = g.attributes.position
    for (let i = 0; i <= segments; i++) {
      for (let j = 0; j <= segments; j++) {
        const idx = i * (segments + 1) + j
        const hIdx = Math.min(i, size - 1) * size + Math.min(j, size - 1)
        pos.setZ(idx, heights[hIdx])
      }
    }
    pos.needsUpdate = true
    g.computeVertexNormals()
    // vertex colors by height
    const colors = new Float32Array(pos.count * 3)
    for (let i = 0; i < pos.count; i++) {
      const h = pos.getZ(i)
      const t = (h + 4) / 8
      const c = new THREE.Color()
      if (t < 0.3) c.setHSL(0.35, 0.6, 0.35 + t)
      else if (t < 0.6) c.setHSL(0.25, 0.5, 0.4 + t * 0.3)
      else c.setHSL(0.1, 0.3, 0.5 + t * 0.3)
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3))
    return g
  }, [size, segments, scale])

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh geometry={geo} receiveShadow>
        <meshStandardMaterial vertexColors wireframe={wireframe} roughness={0.85} metalness={0} />
      </mesh>
      {showContours && <mesh geometry={geo}>
        <meshBasicMaterial color="#ffffff" wireframe opacity={0.08} transparent />
      </mesh>}
    </group>
  )
}

// ─── Road Corridor ──────────────────────────────────────────────────────────

function RoadCorridor({ visible, width = 7 }: { visible: boolean; width?: number }) {
  const path = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 40; i++) {
      const t = i / 40
      const x = (t - 0.5) * 38
      const z = Math.sin(t * Math.PI * 1.4) * 6
      const y = Math.sin(t * Math.PI) * 1.8 + Math.cos(t * Math.PI * 2) * 0.8 + 0.18
      pts.push(new THREE.Vector3(x, y, z))
    }
    return new THREE.CatmullRomCurve3(pts)
  }, [])

  const geo = useMemo(() => {
    if (!visible) return null
    const shape = new THREE.Shape()
    shape.moveTo(-width / 2, 0)
    shape.lineTo(width / 2, 0)
    shape.lineTo(width / 2, 0.22)
    shape.lineTo(-width / 2, 0.22)
    shape.closePath()
    return new THREE.ExtrudeGeometry(shape, { steps: 80, extrudePath: path, bevelEnabled: false })
  }, [visible, width, path])

  const markings = useMemo(() => {
    if (!visible) return []
    const pts = path.getPoints(200)
    return pts.filter((_, i) => i % 10 === 0 && i > 0)
  }, [visible, path])

  if (!visible || !geo) return null
  return (
    <group>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial color="#2d3748" roughness={0.9} metalness={0} />
      </mesh>
      {markings.map((pt, i) => {
        const tan = path.getTangent(i * 10 / 200)
        const angle = Math.atan2(tan.z, tan.x)
        return (
          <mesh key={i} position={[pt.x, pt.y + 0.24, pt.z]} rotation={[0, -angle, 0]}>
            <boxGeometry args={[1.5, 0.02, 0.12]} />
            <meshBasicMaterial color="white" />
          </mesh>
        )
      })}
    </group>
  )
}

// ─── Pipes / Networks ────────────────────────────────────────────────────────

function PipeNetwork({ visible }: { visible: boolean }) {
  const pipes = useMemo(() => [
    { from: [-18, -0.5, -8], to: [18, -0.5, -8], color: "#3b82f6", r: 0.3, label: "Водопровод Ø200" },
    { from: [-18, -1.2, -5], to: [18, -1.2, -5], color: "#78716c", r: 0.45, label: "Канализация Ø300" },
    { from: [-18, 0.1, -11], to: [18, 0.1, -11], color: "#f59e0b", r: 0.18, label: "Теплосеть 2×Ø100" },
  ], [])

  if (!visible) return null
  return (
    <group>
      {pipes.map((p, i) => {
        const start = new THREE.Vector3(...p.from as [number, number, number])
        const end = new THREE.Vector3(...p.to as [number, number, number])
        const dir = end.clone().sub(start)
        const len = dir.length()
        const mid = start.clone().add(dir.clone().multiplyScalar(0.5))
        const quat = new THREE.Quaternion()
        quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
        return (
          <group key={i}>
            <mesh position={mid.toArray()} quaternion={quat} castShadow>
              <cylinderGeometry args={[p.r, p.r, len, 16]} />
              <meshStandardMaterial color={p.color} roughness={0.4} metalness={0.6} />
            </mesh>
            <Html position={[start.x, start.y + 1, start.z]} center distanceFactor={20}>
              <div className="bg-black/70 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap">{p.label}</div>
            </Html>
          </group>
        )
      })}
    </group>
  )
}

// ─── Buildings ──────────────────────────────────────────────────────────────

function Buildings({ visible }: { visible: boolean }) {
  const buildings = useMemo(() => [
    { pos: [-14, 0, 10] as [number, number, number], size: [6, 8, 5] as [number, number, number], color: "#94a3b8", label: "Корпус А" },
    { pos: [0, 0, 12] as [number, number, number], size: [8, 12, 6] as [number, number, number], color: "#a78bfa", label: "Корпус Б" },
    { pos: [14, 0, 10] as [number, number, number], size: [5, 5, 5] as [number, number, number], color: "#6ee7b7", label: "Склад" },
  ], [])

  if (!visible) return null
  return (
    <group>
      {buildings.map((b, i) => (
        <group key={i} position={[b.pos[0], b.size[1] / 2 + 0.3, b.pos[2]]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={b.size} />
            <meshStandardMaterial color={b.color} roughness={0.7} metalness={0.1} />
          </mesh>
          {/* Roof */}
          <mesh position={[0, b.size[1] / 2 + 0.5, 0]} castShadow>
            <coneGeometry args={[Math.max(b.size[0], b.size[2]) * 0.72, 2, 4]} />
            <meshStandardMaterial color="#ef4444" roughness={0.8} />
          </mesh>
          <Html position={[0, b.size[1] / 2 + 2.5, 0]} center distanceFactor={20}>
            <div className="bg-indigo-600/80 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap">{b.label}</div>
          </Html>
        </group>
      ))}
    </group>
  )
}

// ─── Survey Points ──────────────────────────────────────────────────────────

function SurveyPoints({ visible }: { visible: boolean }) {
  const points = useMemo(() => [
    { pos: [-16, 0, -16], label: "ТН-1", elev: 120.5 },
    { pos: [0, 0, -14], label: "ТН-2", elev: 122.1 },
    { pos: [16, 0, -16], label: "ТН-3", elev: 119.8 },
    { pos: [-12, 0, 0], label: "ТН-4", elev: 121.3 },
    { pos: [12, 0, 0], label: "ТН-5", elev: 123.0 },
    { pos: [0, 0, 14], label: "ТН-6", elev: 120.8 },
  ], [])

  if (!visible) return null
  return (
    <group>
      {points.map((p, i) => (
        <group key={i} position={p.pos as [number, number, number]}>
          <mesh>
            <sphereGeometry args={[0.3, 12, 12]} />
            <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0, 2, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 4, 8]} />
            <meshBasicMaterial color="#f59e0b" />
          </mesh>
          <Html position={[0, 5, 0]} center distanceFactor={20}>
            <div className="bg-amber-500/80 text-white text-xs px-1.5 py-0.5 rounded whitespace-nowrap">{p.label}<br />{p.elev} м</div>
          </Html>
        </group>
      ))}
    </group>
  )
}

// ─── Animated camera intro ───────────────────────────────────────────────────

function CameraIntro() {
  const t = useRef(0)
  const done = useRef(false)
  useFrame((state, delta) => {
    if (done.current) return
    t.current += delta * 0.4
    if (t.current > 1) { t.current = 1; done.current = true }
    const angle = (1 - t.current) * Math.PI * 0.5
    state.camera.position.lerp(new THREE.Vector3(Math.sin(angle) * 55, 30 - t.current * 10, Math.cos(angle) * 55), 0.05)
    state.camera.lookAt(0, 0, 0)
  })
  return null
}

// ─── Compass ────────────────────────────────────────────────────────────────

function CompassNeedle() {
  const ref = useRef<THREE.Group>(null!)
  useFrame(({ camera }) => {
    const angle = Math.atan2(camera.position.x, camera.position.z)
    if (ref.current) ref.current.rotation.y = angle
  })
  return (
    <group ref={ref} position={[16, 0.1, -16]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.3, 1.2, 8]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[0, -0.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.3, 1.2, 8]} />
        <meshBasicMaterial color="white" />
      </mesh>
    </group>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface LayerState {
  terrain: boolean
  road: boolean
  pipes: boolean
  buildings: boolean
  points: boolean
  grid: boolean
  sky: boolean
  wireframe: boolean
  contours: boolean
}

const ROAD_WIDTHS = [
  { label: "6 м (сел.)", v: 6 },
  { label: "7 м (II кат.)", v: 7 },
  { label: "10.5 м (I кат.)", v: 10.5 },
  { label: "14 м (магистр.)", v: 14 },
]

export default function Viewer3DModule() {
  const [layers, setLayers] = useState<LayerState>({
    terrain: true, road: true, pipes: true, buildings: true,
    points: true, grid: true, sky: true, wireframe: false, contours: false,
  })
  const [roadWidth, setRoadWidth] = useState(7)
  const [ambientLight, setAmbientLight] = useState(0.6)
  const [sunAngle, setSunAngle] = useState(45)
  const [selected, setSelected] = useState<string | null>(null)
  const [showStats, setShowStats] = useState(false)

  const toggle = (key: keyof LayerState) => setLayers(l => ({ ...l, [key]: !l[key] }))

  const LAYER_BTNS: { key: keyof LayerState; label: string; icon: string; color: string }[] = [
    { key: "terrain", label: "Рельеф", icon: "Mountain", color: "bg-green-500" },
    { key: "road", label: "Дорога", icon: "Route", color: "bg-gray-700" },
    { key: "pipes", label: "Сети", icon: "Network", color: "bg-blue-500" },
    { key: "buildings", label: "Здания", icon: "Building2", color: "bg-purple-500" },
    { key: "points", label: "Съёмка", icon: "MapPin", color: "bg-amber-500" },
    { key: "grid", label: "Сетка", icon: "Grid3x3", color: "bg-slate-400" },
    { key: "sky", label: "Небо", icon: "Cloud", color: "bg-sky-400" },
    { key: "wireframe", label: "Каркас", icon: "Hexagon", color: "bg-indigo-500" },
    { key: "contours", label: "Горизонт.", icon: "Layers", color: "bg-teal-500" },
  ]

  const sunPos = useMemo((): [number, number, number] => {
    const rad = (sunAngle / 180) * Math.PI
    return [Math.cos(rad) * 50, Math.sin(rad) * 50, 30]
  }, [sunAngle])

  return (
    <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-semibold text-gray-700 mr-1">Слои:</span>
        {LAYER_BTNS.map(b => (
          <button
            key={b.key}
            onClick={() => toggle(b.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${layers[b.key] ? b.color + " text-white shadow" : "bg-gray-100 text-gray-400"}`}
          >
            <Icon name={b.icon} size={13} fallback="Circle" />
            {b.label}
          </button>
        ))}
        <button
          onClick={() => setShowStats(s => !s)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ml-auto ${showStats ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500"}`}
        >
          <Icon name="Activity" size={13} />
          FPS
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* 3D Canvas */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden border border-gray-200 shadow-lg" style={{ height: 520 }}>
          <Canvas
            shadows
            camera={{ position: [35, 22, 35], fov: 50, near: 0.1, far: 1000 }}
            gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
          >
            <Suspense fallback={<Html center><div className="text-white text-sm">Загрузка 3D…</div></Html>}>
              <CameraIntro />

              {/* Lights */}
              <ambientLight intensity={ambientLight} />
              <directionalLight
                position={sunPos}
                intensity={1.8}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-near={0.5}
                shadow-camera-far={200}
                shadow-camera-left={-40}
                shadow-camera-right={40}
                shadow-camera-top={40}
                shadow-camera-bottom={-40}
              />
              <hemisphereLight args={["#87ceeb", "#8b7355", 0.4]} />

              {/* Sky */}
              {layers.sky && <Sky sunPosition={sunPos} turbidity={8} rayleigh={0.5} />}
              {!layers.sky && <color attach="background" args={["#1e293b"]} />}

              {/* Scene objects */}
              <Terrain wireframe={layers.wireframe} showContours={layers.contours} />
              <RoadCorridor visible={layers.road} width={roadWidth} />
              <PipeNetwork visible={layers.pipes} />
              <Buildings visible={layers.buildings} />
              <SurveyPoints visible={layers.points} />
              <CompassNeedle />

              {/* Grid */}
              {layers.grid && (
                <Grid
                  position={[0, -0.01, 0]}
                  args={[80, 80]}
                  cellSize={2}
                  cellThickness={0.5}
                  cellColor="#64748b"
                  sectionSize={10}
                  sectionThickness={1}
                  sectionColor="#94a3b8"
                  fadeDistance={80}
                  fadeStrength={1}
                  infiniteGrid
                />
              )}

              <OrbitControls
                enableDamping
                dampingFactor={0.08}
                maxPolarAngle={Math.PI / 2.1}
                minDistance={5}
                maxDistance={120}
              />

              <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
                <GizmoViewport axisColors={["#ef4444", "#22c55e", "#3b82f6"]} labelColor="white" />
              </GizmoHelper>

              {showStats && <Stats />}
            </Suspense>
          </Canvas>
        </div>

        {/* Right panel */}
        <div className="space-y-3">
          {/* Road width */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
              <Icon name="Route" size={15} className="text-indigo-500" /> Дорога
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {ROAD_WIDTHS.map(w => (
                <button
                  key={w.v}
                  onClick={() => setRoadWidth(w.v)}
                  className={`text-xs py-1.5 px-2 rounded-lg transition-all ${roadWidth === w.v ? "bg-indigo-600 text-white font-semibold" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lighting */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
              <Icon name="Sun" size={15} className="text-amber-500" /> Освещение
            </h3>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Яркость окружения</span>
                <span>{ambientLight.toFixed(1)}</span>
              </div>
              <input type="range" min="0" max="2" step="0.1" value={ambientLight} onChange={e => setAmbientLight(+e.target.value)} className="w-full accent-indigo-600" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Угол солнца</span>
                <span>{sunAngle}°</span>
              </div>
              <input type="range" min="5" max="175" step="5" value={sunAngle} onChange={e => setSunAngle(+e.target.value)} className="w-full accent-amber-500" />
            </div>
          </div>

          {/* Legend */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
            <h3 className="font-semibold text-gray-800 text-sm mb-2">Легенда</h3>
            {[
              { color: "#4ade80", label: "Рельеф (DTM)" },
              { color: "#374151", label: "Дорожный коридор" },
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

          {/* Controls hint */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs text-gray-500 space-y-1">
            <div className="font-semibold text-gray-600 mb-1">Управление</div>
            <div>🖱 ЛКМ + drag — вращение</div>
            <div>🖱 ПКМ + drag — панорама</div>
            <div>🖱 Колесо — масштаб</div>
            <div>📐 Гизмо (↙) — оси XYZ</div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
