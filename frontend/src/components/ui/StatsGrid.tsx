"use client"

import { motion } from "motion/react"
import { useEffect, useRef, useState } from "react"

function AnimNum({ to = 0, decimals = 0, prefix = "", suffix = "" }: {
  to?: number; decimals?: number; prefix?: string; suffix?: string
}) {
  const [val, setVal] = useState(to ?? 0)
  const rafRef = useRef(0)
  const prevRef = useRef(to ?? 0)

  useEffect(() => {
    const target = to ?? 0
    const from = prevRef.current
    const start = performance.now()
    const dur = 550
    cancelAnimationFrame(rafRef.current)
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      const cur = from + (target - from) * ease
      setVal(parseFloat(cur.toFixed(decimals)))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else prevRef.current = target
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [to, decimals])

  const display = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString("en-IN")
  return <>{prefix}{display}{suffix}</>
}

function SparkLine({ data }: { data: number[] }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const W = 72; const H = 24
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - ((v - min) / range) * H
    return `${x},${y}`
  }).join(" ")
  const lastPt = pts.split(" ").pop()?.split(",") ?? ["0","0"]
  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastPt[0]} cy={lastPt[1]} r="2.5" fill="#10B981" />
    </svg>
  )
}

function DemandPill({ level = "Normal" }: { level?: string }) {
  const map: Record<string, { bg: string; color: string; dot: string }> = {
    High:     { bg: "#FEF2F2", color: "#991B1B", dot: "#EF4444" },
    Moderate: { bg: "#FFFBEB", color: "#92400E", dot: "#F59E0B" },
    Normal:   { bg: "#F0FDF4", color: "#166534", dot: "#22C55E" },
  }
  const s = map[level] ?? map.Normal
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 500,
      padding: "3px 8px", borderRadius: 999,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
      {level}
    </span>
  )
}

const CARD_STYLE: React.CSSProperties = {
  background: "#fff", borderRadius: 16,
  border: "1px solid #E8ECF0",
  boxShadow: "0 1px 4px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04)",
  padding: "18px 20px", position: "relative", overflow: "hidden",
}

interface StatsGridProps {
  riders?:          number
  drivers?:         number
  surgeMultiplier?: number
  timeCategory?:    string
  distanceKm?:      number
  durationMin?:     number
  revenueLift?:     number
  demandLevel?:     string
  riderHistory?:    number[]
  wsConnected?:     boolean
  flash?:           boolean
}

export function StatsGrid({
  riders = 0, drivers = 0, surgeMultiplier = 1, timeCategory = "—",
  distanceKm = 0, durationMin = 0, revenueLift = 0,
  demandLevel = "Normal", riderHistory = [], wsConnected = false, flash = false,
}: StatsGridProps) {
  const surge = surgeMultiplier ?? 1
  const surgeColor = surge >= 2 ? "#EF4444" : surge >= 1.4 ? "#F97316" : surge >= 1.1 ? "#F59E0B" : "#10B981"
  const surgePct = Math.min(((surge - 1) / 1.5) * 100, 100)

  return (
    <div>
      {/* Live indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span style={{
          width: 7, height: 7, borderRadius: "50%",
          background: wsConnected ? "#10B981" : "#94A3B8",
          display: "inline-block",
          boxShadow: wsConnected ? "0 0 0 3px rgba(16,185,129,0.15)" : "none",
        }} />
        <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500 }}>
          {wsConnected ? "Live market feed" : "Market snapshot"}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

        {/* Market */}
        <div style={CARD_STYLE}>
          {flash && (
            <motion.div style={{ position: "absolute", inset: 0, background: "rgba(16,185,129,0.05)", borderRadius: 16 }}
              initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.7 }} />
          )}
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 12 }}>Market</p>
          <div style={{ fontSize: 26, fontWeight: 600, color: "#0F172A", lineHeight: 1, marginBottom: 4 }}>
            <AnimNum to={riders} /> <span style={{ fontSize: 13, fontWeight: 400, color: "#94A3B8" }}>riders</span>
          </div>
          <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 12 }}><AnimNum to={drivers} /> drivers available</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <SparkLine data={riderHistory.length > 1 ? riderHistory : [riders, riders]} />
            <DemandPill level={demandLevel} />
          </div>
        </div>

        {/* Live Surge */}
        <div style={CARD_STYLE}>
          {flash && (
            <motion.div style={{ position: "absolute", inset: 0, background: "rgba(16,185,129,0.05)", borderRadius: 16 }}
              initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.7 }} />
          )}
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 12 }}>Live Surge</p>
          <div style={{ fontSize: 26, fontWeight: 600, color: surgeColor, lineHeight: 1, marginBottom: 4 }}>
            <AnimNum to={surge} decimals={2} />
            <span style={{ fontSize: 14, fontWeight: 400, color: "#94A3B8" }}>×</span>
          </div>
          <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 12 }}>{timeCategory || "—"}</p>
          <div style={{ height: 5, background: "#F1F5F9", borderRadius: 3, overflow: "hidden" }}>
            <motion.div style={{ height: "100%", background: surgeColor, borderRadius: 3 }}
              animate={{ width: `${surgePct}%` }} transition={{ duration: 0.6 }} />
          </div>
        </div>

        {/* Distance */}
        <div style={CARD_STYLE}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 12 }}>Distance</p>
          <div style={{ fontSize: 26, fontWeight: 600, color: "#0F172A", lineHeight: 1, marginBottom: 4 }}>
            <AnimNum to={distanceKm ?? 0} decimals={1} />
            <span style={{ fontSize: 13, fontWeight: 400, color: "#94A3B8" }}> km</span>
          </div>
          <p style={{ fontSize: 12, color: "#94A3B8" }}>~{Math.round(durationMin ?? 0)} min</p>
        </div>

        {/* Revenue Lift */}
        <div style={CARD_STYLE}>
          {flash && (
            <motion.div style={{ position: "absolute", inset: 0, background: "rgba(16,185,129,0.05)", borderRadius: 16 }}
              initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.7 }} />
          )}
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 12 }}>Revenue Lift</p>
          <div style={{ fontSize: 26, fontWeight: 600, color: "#10B981", lineHeight: 1, marginBottom: 4 }}>
            +<AnimNum to={revenueLift ?? 0} />%
          </div>
          <p style={{ fontSize: 12, color: "#94A3B8" }}>vs flat-rate model</p>
        </div>

      </div>
    </div>
  )
}
