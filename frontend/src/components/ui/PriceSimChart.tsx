"use client"

import { useState } from "react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts"
import { motion } from "motion/react"

const CAB_COLORS: Record<string, string> = {
  "Uber Go":       "#6366F1",
  "Ola Mini":      "#10B981",
  "Rapido Bike":   "#F59E0B",
  "Uber Auto":     "#EC4899",
  "Ola Prime SUV": "#8B5CF6",
  "Uber Premium":  "#EF4444",
}

const TIME_LABELS: Record<number, string> = {
  8: "8 AM (Peak)", 14: "2 PM", 18: "6 PM (Peak)", 23: "11 PM",
}

interface Scenario {
  cab_type:     string
  hour:         number
  price:        number
  time_label?:  string
  demand_level?: string
}

interface PriceSimChartProps {
  scenarios?:  Scenario[]
  isLoading?:  boolean
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: "#0B1120", borderRadius: 12,
      padding: "10px 14px", border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
    }}>
      <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 8 }}>{TIME_LABELS[label] ?? `${label}:00`}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
          <span style={{ fontSize: 12, color: "#E2E8F0", fontWeight: 500 }}>{p.dataKey}</span>
          <span style={{ fontSize: 12, color: "#fff", fontWeight: 600, marginLeft: "auto", paddingLeft: 12 }}>
            ₹{(p.value ?? 0).toLocaleString("en-IN")}
          </span>
        </div>
      ))}
    </div>
  )
}

export function PriceSimChart({ scenarios = [], isLoading = false }: PriceSimChartProps) {
  const safeScenarios = scenarios ?? []
  const cabTypes = [...new Set(safeScenarios.map(s => s.cab_type))].filter(Boolean)
  const [activeCab, setActiveCab] = useState("Uber Go")

  // Pick first available cab if "Uber Go" isn't in list
  const currentCab = cabTypes.includes(activeCab) ? activeCab : (cabTypes[0] ?? "Uber Go")
  const color = CAB_COLORS[currentCab] ?? "#6366F1"

  const hours = [8, 14, 18, 23]
  const chartData = hours.map(h => {
    const row: Record<string, any> = { hour: h }
    cabTypes.forEach(cab => {
      const match = safeScenarios.find(s => s.cab_type === cab && s.hour === h)
      if (match) row[cab] = match.price
    })
    return row
  })

  const hasData = chartData.some(r => r[currentCab] != null)

  return (
    <div style={{
      background: "#fff", borderRadius: 16,
      border: "1px solid #E8ECF0",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04)",
      padding: "20px 24px 16px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>Price Simulation</p>
            <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>15 km reference trip across time of day</p>
          </div>
        </div>
      </div>

      {/* Cab tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {cabTypes.map(cab => {
          const c = CAB_COLORS[cab] ?? "#6366F1"
          const isActive = currentCab === cab
          return (
            <button key={cab} onClick={() => setActiveCab(cab)} style={{
              fontSize: 12, fontWeight: 500, padding: "5px 12px",
              borderRadius: 999, cursor: "pointer",
              border: `1.5px solid ${isActive ? c : "#E8ECF0"}`,
              background: isActive ? `${c}15` : "transparent",
              color: isActive ? c : "#94A3B8",
              transition: "all 0.15s",
            }}>
              {cab}
            </button>
          )
        })}
      </div>

      {/* Chart */}
      {isLoading || !hasData ? (
        <div style={{
          height: 200, borderRadius: 12,
          background: "linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)",
          backgroundSize: "800px 100%", animation: "rp-shimmer 1.4s infinite",
        }} />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${currentCab}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="hour"
                tickFormatter={(h: number) => h === 8 ? "8AM" : h === 14 ? "2PM" : h === 18 ? "6PM" : "11PM"}
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => `₹${v}`}
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                axisLine={false} tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={8}  stroke="#F59E0B" strokeDasharray="3 3" strokeOpacity={0.5} />
              <ReferenceLine x={18} stroke="#F59E0B" strokeDasharray="3 3" strokeOpacity={0.5} />
              <Area
                type="monotone"
                dataKey={currentCab}
                stroke={color}
                strokeWidth={2.5}
                fill={`url(#grad-${currentCab})`}
                dot={{ r: 4, fill: color, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, fill: color, stroke: "#fff", strokeWidth: 2 }}
                connectNulls
                animationDuration={500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      <p style={{ fontSize: 10, color: "#CBD5E1", marginTop: 10, textAlign: "right" }}>
        Yellow lines = peak hours · Hover for prices
      </p>

      <style>{`@keyframes rp-shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`}</style>
    </div>
  )
}