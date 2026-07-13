import Icon from "@/components/ui/icon"

// ── Мелкие компоненты ──────────────────────────────────────────────────────
export function Slider({ label, v, min, max, on }: { label: string; v: number; min: number; max: number; on: (v: number) => void }) {
  return <div><div className="flex justify-between text-[11px] mb-0.5"><span className="text-gray-500">{label}</span><span className="font-mono font-semibold text-gray-700">{v}</span></div><input type="range" min={min} max={max} value={v} onChange={e => on(+e.target.value)} className="w-full accent-red-600" /></div>
}
export function Toggle({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return <button onClick={onClick} className={`px-2 py-1 rounded border text-[11px] flex items-center gap-1 ${active ? "bg-red-600 text-white border-red-600" : "bg-white/90 text-gray-600 border-gray-200 hover:bg-white"}`}><Icon name={icon} size={11} fallback="Square" />{label}</button>
}
export function Row({ l, v, ok }: { l: string; v: string; ok?: boolean }) {
  return <div className="flex justify-between items-center text-[11px] py-0.5 border-b border-gray-50"><span className="text-gray-500">{l}</span><span className={`font-mono font-semibold ${ok === undefined ? "text-gray-800" : ok ? "text-green-600" : "text-red-600"}`}>{v}</span></div>
}
export function shade(hex: string, k: number): string {
  const h = hex.replace("#", ""); const r = Math.min(255, Math.round(parseInt(h.slice(0, 2), 16) * k)); const g = Math.min(255, Math.round(parseInt(h.slice(2, 4), 16) * k)); const b = Math.min(255, Math.round(parseInt(h.slice(4, 6), 16) * k)); return `rgb(${r},${g},${b})`
}
