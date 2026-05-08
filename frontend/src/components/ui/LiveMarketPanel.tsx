"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useMarketSocket, MarketState } from "../../hooks/useMarketSocket"

// ── Animated number — counts up/down smoothly on change ──────────────────────
function AnimatedNumber({
  value,
  format = (v: number) => String(Math.round(v)),
  className = "",
}: {
  value: number
  format?: (v: number) => string
  className?: string
}) {
  const [display, setDisplay] = useState(value)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)
  const fromRef = useRef<number>(value)

  useEffect(() => {
    const from = fromRef.current
    const to = value
    if (from === to) return

    const DURATION = 600
    cancelAnimationFrame(rafRef.current)
    startRef.current = performance.now()

    const tick = (now: number) => {
      const t = Math.min((now - startRef.current) / DURATION, 1)
      const ease = 1 - Math.pow(1 - t, 3) // ease-out cubic
      setDisplay(from + (to - from) * ease)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else fromRef.current = to
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value])

  return <span className={className}>{format(display)}</span>
}

// ── Pulse dot — blinks on every new tick ────────────────────────────────────
function LiveDot({ active }: { active: boolean }) {
  const [flash, setFlash] = useState(false)
  const prev = useRef(active)

  useEffect(() => {
    if (active && !prev.current) {
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 600)
      return () => clearTimeout(t)
    }
    prev.current = active
  }, [active])

  return (
    <span
      className="inline-block w-2 h-2 rounded-full transition-all duration-300"
      style={{
        background: active ? "#22c55e" : "#d1d5db",
        boxShadow: flash ? "0 0 0 4px rgba(34,197,94,0.2)" : "none",
      }}
    />
  )
}

// ── Demand level badge ────────────────────────────────────────────────────────
const DEMAND_STYLE = {
  High:     { bg: "#FEF2F2", border: "#FECACA", text: "#991B1B", dot: "#EF4444" },
  Moderate: { bg: "#FFFBEB", border: "#FCD34D", text: "#92400E", dot: "#F59E0B" },
  Normal:   { bg: "#F0FDF4", border: "#BBF7D0", text: "#166534", dot: "#22C55E" },
}

function DemandBadge({ level }: { level: "High" | "Moderate" | "Normal" }) {
  const s = DEMAND_STYLE[level] ?? DEMAND_STYLE.Normal
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border"
      style={{ background: s.bg, borderColor: s.border, color: s.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: s.dot }} />
      {level} demand
    </span>
  )
}

// ── Mini spark bar — last 12 rider counts ────────────────────────────────────
function SparkBar({ history }: { history: number[] }) {
  if (history.length < 2) return null
  const max = Math.max(...history, 1)
  return (
    <div className="flex items-end gap-[2px] h-6">
      {history.map((v, i) => (
        <motion.div
          key={i}
          className="w-[4px] rounded-sm"
          style={{ background: i === history.length - 1 ? "#22c55e" : "#e5e7eb" }}
          initial={{ height: 0 }}
          animate={{ height: `${Math.max((v / max) * 24, 3)}px` }}
          transition={{ duration: 0.3 }}
        />
      ))}
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  children,
  sub,
  flash,
}: {
  label: string
  children: React.ReactNode
  sub?: React.ReactNode
  flash?: boolean
}) {
  return (
    <motion.div
      className="bg-white border rounded-2xl px-5 py-4 relative overflow-hidden"
      style={{
        borderColor: flash ? "#bbf7d0" : "#f3f4f6",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
      animate={{ borderColor: flash ? "#bbf7d0" : "#f3f4f6" }}
      transition={{ duration: 0.4 }}
    >
      {flash && (
        <motion.div
          className="absolute inset-0 bg-green-50"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      )}
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <div className="relative z-10">{children}</div>
      {sub && <div className="mt-1 relative z-10">{sub}</div>}
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
interface LiveMarketPanelProps {
  /** Snapshot from /predict — shown until WS updates arrive */
  initialData?: {
    riders: number
    drivers: number
    surge_multiplier: number
    demand_level: string
    time_category: string
    revenue_lift_percentage?: number
    final_price_inr?: number
    distance_km?: number
    duration_mins?: number
  } | null
  wsUrl?: string
}

export function LiveMarketPanel({ initialData, wsUrl }: LiveMarketPanelProps) {
  const { market, connected, lastTick } = useMarketSocket({ url: wsUrl })

  // Merge: WS data wins over initial snapshot
  const data: Partial<MarketState> & { revenue_lift_percentage?: number } = {
    ...(initialData ?? {}),
    ...(market ?? {}),
  }

  // Track flash on each new tick
  const [flash, setFlash] = useState(false)
  const prevTick = useRef<Date | null>(null)
  useEffect(() => {
    if (lastTick && lastTick !== prevTick.current) {
      prevTick.current = lastTick
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 700)
      return () => clearTimeout(t)
    }
  }, [lastTick])

  // Rider history for spark bar
  const [riderHistory, setRiderHistory] = useState<number[]>([])
  useEffect(() => {
    if (data.riders != null) {
      setRiderHistory((h) => [...h.slice(-11), data.riders!])
    }
  }, [data.riders])

  const surge = data.surge_multiplier ?? 1
  const surgeColor = surge >= 2 ? "#dc2626" : surge >= 1.4 ? "#f97316" : surge >= 1.1 ? "#f59e0b" : "#22c55e"

  return (
    <div className="space-y-2">
      {/* Connection status bar */}
      <div className="flex items-center justify-between px-1 mb-1">
        <div className="flex items-center gap-2">
          <LiveDot active={connected} />
          <span className="text-[11px] text-gray-400 font-medium">
            {connected ? "Live market feed" : "Connecting…"}
          </span>
        </div>
        {lastTick && (
          <span className="text-[10px] text-gray-300">
            Updated {lastTick.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* 2×2 stat grid */}
      <div className="grid grid-cols-2 gap-3">

        {/* Market — riders & drivers */}
        <StatCard
          label="Market"
          flash={flash}
          sub={
            <div className="flex items-center justify-between mt-2">
              <SparkBar history={riderHistory} />
              {data.demand_level && (
                <DemandBadge level={data.demand_level as any} />
              )}
            </div>
          }
        >
          <div className="flex items-baseline gap-1">
            <AnimatedNumber
              value={data.riders ?? 0}
              className="text-2xl font-semibold text-gray-900"
            />
            <span className="text-[13px] text-gray-400">riders</span>
          </div>
          <p className="text-[12px] text-gray-400 mt-0.5">
            <AnimatedNumber value={data.drivers ?? 0} /> drivers available
          </p>
        </StatCard>

        {/* Surge multiplier */}
        <StatCard label="Live surge" flash={flash}>
          <div className="flex items-baseline gap-1">
            <AnimatedNumber
              value={surge}
              format={(v) => v.toFixed(2)}
              className="text-2xl font-semibold"
              style={{ color: surgeColor } as any}
            />
            <span className="text-[13px] text-gray-400">×</span>
          </div>
          <p className="text-[12px] text-gray-400 mt-0.5">
            {data.time_category ?? "—"}
          </p>
          {/* Surge bar */}
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: surgeColor }}
              animate={{ width: `${Math.min(((surge - 1) / 1.5) * 100, 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </StatCard>

        {/* Distance / time — static from predict */}
        <StatCard label="Distance">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-semibold text-gray-900">
              {(initialData as any)?.distance_km ?? data.riders ?? "—"}
            </span>
            <span className="text-[13px] text-gray-400">km</span>
          </div>
          <p className="text-[12px] text-gray-400 mt-0.5">
            ~{(initialData as any)?.duration_mins ?? "—"} min
          </p>
        </StatCard>

        {/* Revenue lift */}
        <StatCard label="Revenue lift" flash={flash}>
          <div className="flex items-baseline gap-1">
            <AnimatedNumber
              value={data.revenue_lift_percentage ?? 0}
              format={(v) => `+${Math.round(v)}%`}
              className="text-2xl font-semibold text-green-600"
            />
          </div>
          <p className="text-[12px] text-gray-400 mt-0.5">vs flat-rate model</p>
        </StatCard>
      </div>

      {/* Live price ticker — appears after first predict */}
      <AnimatePresence>
        {data.final_price_inr && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white border border-gray-100 rounded-2xl px-5 py-3 flex items-center justify-between"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[12px] text-gray-500 font-medium">Last AI price</span>
            </div>
            <AnimatedNumber
              value={data.final_price_inr}
              format={(v) => `₹${Math.round(v).toLocaleString("en-IN")}`}
              className="text-[15px] font-semibold text-gray-900"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
