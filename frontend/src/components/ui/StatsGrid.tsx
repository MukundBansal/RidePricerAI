"use client"

import { motion } from "motion/react"
import { useEffect, useRef, useState } from "react"

function AnimNum({
  to, decimals = 0, prefix = "", suffix = "",
}: { to: number; decimals?: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(to)
  const rafRef = useRef(0)
  const prevRef = useRef(to)
  useEffect(() => {
    const from = prevRef.current
    const start = performance.now()
    const dur = 600
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setVal(parseFloat((from + (to - from) * ease).toFixed(decimals)))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else prevRef.current = to
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [to])
  return <>{prefix}{decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString("en-IN")}{suffix}</>
}

function SparkLine({ data }: { data: number[] }) {
  if (data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const W = 80; const H = 28
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - ((v - min) / range) * H
    return `${x},${y}`
  }).join(" ")
  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke="var(--rp-green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts.split(" ").pop()?.split(",")[0]} cy={pts.split(" ").pop()?.split(",")[1]} r="2.5" fill="var(--rp-green)" />
    </svg>
  )
}

function StatCard({
  label, value, sub, accent, icon, children, delay = 0, flash,
}: {
  label: string; value: React.ReactNode; sub?: string
  accent?: string; icon: React.ReactNode; children?: React.ReactNode
  delay?: number; flash?: boolean
}) {
  return (
    <motion.div
      className="rp-card"
      style={{ padding: "20px 22px", position: "relative", overflow: "hidden" }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      {flash && (
        <motion.div
          style={{ position: "absolute", inset: 0, background: "rgba(16,185,129,0.06)", borderRadius: 16 }}
          initial={{ opacity: 1 }} animate={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
        />
      )}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <p className="rp-label">{label}</p>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: accent ? `${accent}15` : "#F1F5F9",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: accent ?? "var(--rp-text-3)",
        }}>
          {icon}
        </div>
      </div>
      <div className="rp-value">{value}</div>
      {sub && <p className="rp-sub">{sub}</p>}
      {children && <div style={{ marginTop: 12 }}>{children}</div>}
    </motion.div>
  )
}

interface StatsGridProps {
  riders: number
  drivers: number
  surgeMultiplier: number
  timeCategory: string
  distanceKm: number
  durationMin: number
  revenueLift: number
  demandLevel: string
  riderHistory?: number[]
  wsConnected?: boolean
  flash?: boolean
}

export function StatsGrid({
  riders, drivers, surgeMultiplier, timeCategory,
  distanceKm, durationMin, revenueLift, demandLevel,
  riderHistory = [], wsConnected = false, flash = false,
}: StatsGridProps) {
  const surgeColor = surgeMultiplier >= 2 ? "#EF4444" : surgeMultiplier >= 1.4 ? "#F97316" : surgeMultiplier >= 1.1 ? "#F59E0B" : "#10B981"

  return (
    <div>
      {/* Live indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{
          width: 7, height: 7, borderRadius: "50%",
          background: wsConnected ? "#10B981" : "#94A3B8",
          display: "inline-block",
          boxShadow: wsConnected ? "0 0 0 3px rgba(16,185,129,0.15)" : "none",
        }} />
        <span style={{ fontSize: 11, color: "var(--rp-text-3)", fontWeight: 500 }}>
          {wsConnected ? "Live market feed" : "Market snapshot"}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

        {/* Market */}
        <StatCard
          label="Market"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          accent="#6366F1"
          value={<><AnimNum to={riders} /> <span style={{ fontSize: 14, fontWeight: 400, color: "var(--rp-text-3)" }}>riders</span></>}
          sub={`${drivers} drivers available`}
          delay={0} flash={flash}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <SparkLine data={riderHistory.length > 1 ? riderHistory : [riders]} />
            <DemandPill level={demandLevel} />
          </div>
        </StatCard>

        {/* Live surge */}
        <StatCard
          label="Live Surge"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
          accent={surgeColor}
          value={
            <span style={{ color: surgeColor }}>
              <AnimNum to={surgeMultiplier} decimals={2} />
              <span style={{ fontSize: 16, fontWeight: 400, color: "var(--rp-text-3)" }}>×</span>
            </span>
          }
          sub={timeCategory}
          delay={0.05} flash={flash}
        >
          {/* Surge gauge bar */}
          <div style={{ height: 4, background: "#F1F5F9", borderRadius: 2, overflow: "hidden" }}>
            <motion.div
              style={{ height: "100%", background: surgeColor, borderRadius: 2 }}
              animate={{ width: `${Math.min(((surgeMultiplier - 1) / 1.5) * 100, 100)}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </StatCard>

        {/* Distance */}
        <StatCard
          label="Distance"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>}
          accent="#6366F1"
          value={<><AnimNum to={distanceKm} decimals={1} /> <span style={{ fontSize: 14, fontWeight: 400, color: "var(--rp-text-3)" }}>km</span></>}
          sub={`~${durationMin} min`}
          delay={0.1}
        />

        {/* Revenue lift */}
        <StatCard
          label="Revenue Lift"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>}
          accent="#10B981"
          value={<span style={{ color: "#10B981" }}>+<AnimNum to={revenueLift} />%</span>}
          sub="vs flat-rate model"
          delay={0.15} flash={flash}
        />
      </div>
    </div>
  )
}

function DemandPill({ level }: { level: string }) {
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
      {level} demand
    </span>
  )
}
