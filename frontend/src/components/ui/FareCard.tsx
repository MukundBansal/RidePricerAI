"use client"

import { motion, AnimatePresence } from "motion/react"
import { useEffect, useRef, useState } from "react"

interface FareCardProps {
  finalPrice?:      number
  basePrice?:       number
  surgeAmount?:     number
  surgeMultiplier?: number
  demandLevel?:     string
  weatherLabel?:    string
  weatherBoost?:    number
  isLoading?:       boolean
}

function AnimNum({ to = 0, prefix = "", suffix = "" }: { to?: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(0)
  const raf = useRef(0)
  const prev = useRef(0)
  useEffect(() => {
    const from = prev.current
    const target = to ?? 0
    const start = performance.now()
    const dur = 700
    cancelAnimationFrame(raf.current)
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1)
      const ease = 1 - Math.pow(1 - t, 4)
      const cur = Math.round(from + (target - from) * ease)
      setVal(cur)
      if (t < 1) raf.current = requestAnimationFrame(tick)
      else prev.current = target
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [to])
  return <>{prefix}{val.toLocaleString("en-IN")}{suffix}</>
}

const DEMAND_MAP: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
  High:     { bg: "#FEF2F2", text: "#991B1B", border: "#FECACA", dot: "#EF4444", label: "High Demand" },
  Moderate: { bg: "#FFFBEB", text: "#92400E", border: "#FCD34D", dot: "#F59E0B", label: "Moderate Demand" },
  Normal:   { bg: "#F0FDF4", text: "#166534", border: "#BBF7D0", dot: "#22C55E", label: "Normal Demand" },
}

export function FareCard({
  finalPrice = 0, basePrice = 0, surgeAmount = 0,
  surgeMultiplier = 1, demandLevel = "Normal",
  weatherLabel, weatherBoost, isLoading,
}: FareCardProps) {
  const cfg = DEMAND_MAP[demandLevel] ?? DEMAND_MAP.Normal

  return (
    <div style={{
      background: "#fff", borderRadius: 16,
      border: "1px solid #E8ECF0",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04)",
      overflow: "hidden",
    }}>
      {/* Gradient top */}
      <div style={{
        background: "linear-gradient(135deg,#F0F4FF 0%,#FAF5FF 50%,#FFF7ED 100%)",
        padding: "28px 28px 22px",
        borderBottom: "1px solid #E8ECF0",
      }}>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 14 }}>
          AI Optimised Fare
        </p>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="sk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ height: 56, width: 220, borderRadius: 8, background: "linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)", backgroundSize: "800px 100%", animation: "shimmer 1.4s infinite", marginBottom: 10 }} />
              <div style={{ height: 18, width: 280, borderRadius: 6, background: "#F1F5F9" }} />
            </motion.div>
          ) : (
            <motion.div key="val" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              <div style={{ fontSize: 52, fontWeight: 700, letterSpacing: "-0.03em", color: "#0F172A", lineHeight: 1, marginBottom: 10 }}>
                ₹<AnimNum to={finalPrice} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "#475569" }}>
                <span>Base: <strong style={{ color: "#0F172A" }}>₹{Math.round(basePrice).toLocaleString("en-IN")}</strong></span>
                <span style={{ color: "#E8ECF0" }}>|</span>
                <span style={{ color: "#EF4444", fontWeight: 500 }}>Surge: +₹{Math.round(surgeAmount).toLocaleString("en-IN")}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Badge row */}
      <div style={{ padding: "14px 28px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: cfg.bg, border: `1px solid ${cfg.border}`,
          color: cfg.text, borderRadius: 999,
          padding: "5px 12px", fontSize: 12, fontWeight: 500,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
          {cfg.label} · {(surgeMultiplier ?? 1).toFixed(2)}x Surge
        </div>

        {weatherLabel && weatherBoost && weatherBoost > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#FFFBEB", border: "1px solid #FCD34D",
            color: "#92400E", borderRadius: 999,
            padding: "5px 12px", fontSize: 12, fontWeight: 500,
          }}>
            {weatherLabel} · +{Math.round((weatherBoost ?? 0) * 100)}% surge
          </motion.div>
        )}
      </div>

      <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`}</style>
    </div>
  )
}
