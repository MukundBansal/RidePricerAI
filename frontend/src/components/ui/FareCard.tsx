"use client"

import { motion, AnimatePresence } from "motion/react"
import { useEffect, useRef, useState } from "react"

interface FareCardProps {
  finalPrice:   number
  basePrice:    number
  surgeAmount:  number
  surgeMultiplier: number
  demandLevel:  "High" | "Moderate" | "Normal"
  weatherLabel?: string
  weatherBoost?: number
  isLoading?:   boolean
}

function AnimNum({ to, prefix = "", suffix = "" }: { to: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(0)
  const raf = useRef(0)
  useEffect(() => {
    const start = performance.now()
    const from  = val
    const dur   = 800
    const tick  = (now: number) => {
      const t = Math.min((now - start) / dur, 1)
      const ease = 1 - Math.pow(1 - t, 4)
      setVal(Math.round(from + (to - from) * ease))
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [to])
  return <>{prefix}{val.toLocaleString("en-IN")}{suffix}</>
}

const DEMAND_CONFIG = {
  High:     { bg: "#FEF2F2", text: "#991B1B", border: "#FECACA", dot: "#EF4444", label: "High Demand" },
  Moderate: { bg: "#FFFBEB", text: "#92400E", border: "#FCD34D", dot: "#F59E0B", label: "Moderate Demand" },
  Normal:   { bg: "#F0FDF4", text: "#166534", border: "#BBF7D0", dot: "#22C55E", label: "Normal Demand" },
}

export function FareCard({
  finalPrice, basePrice, surgeAmount, surgeMultiplier,
  demandLevel, weatherLabel, weatherBoost, isLoading,
}: FareCardProps) {
  const cfg = DEMAND_CONFIG[demandLevel] ?? DEMAND_CONFIG.Normal

  return (
    <div className="rp-card overflow-hidden">
      {/* Top gradient band */}
      <div style={{
        background: "linear-gradient(135deg, #F0F4FF 0%, #FAF5FF 50%, #FFF7ED 100%)",
        padding: "28px 28px 24px",
        borderBottom: "1px solid var(--rp-card-border)",
      }}>
        <p className="rp-label" style={{ marginBottom: 12 }}>AI Optimised Fare</p>

        {/* Price */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="rp-skeleton" style={{ height: 56, width: 200, marginBottom: 8 }} />
              <div className="rp-skeleton" style={{ height: 16, width: 260 }} />
            </motion.div>
          ) : (
            <motion.div key="price" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div style={{ fontSize: 52, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--rp-text-1)", lineHeight: 1, marginBottom: 8 }}>
                ₹<AnimNum to={finalPrice} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "var(--rp-text-2)" }}>
                <span>Base: <strong style={{ color: "var(--rp-text-1)" }}>₹{Math.round(basePrice).toLocaleString("en-IN")}</strong></span>
                <span style={{ color: "var(--rp-card-border)" }}>|</span>
                <span style={{ color: "#EF4444", fontWeight: 500 }}>Surge: +₹{Math.round(surgeAmount).toLocaleString("en-IN")}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom badge row */}
      <div style={{ padding: "14px 28px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {/* Demand badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: cfg.bg, border: `1px solid ${cfg.border}`,
          color: cfg.text, borderRadius: 999,
          padding: "5px 12px", fontSize: 12, fontWeight: 500,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
          {cfg.label} · {surgeMultiplier.toFixed(2)}x Surge
        </div>

        {/* Weather badge */}
        {weatherLabel && weatherBoost && weatherBoost > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#FFFBEB", border: "1px solid #FCD34D",
              color: "#92400E", borderRadius: 999,
              padding: "5px 12px", fontSize: 12, fontWeight: 500,
            }}
          >
            {weatherLabel} · +{Math.round(weatherBoost * 100)}% surge
          </motion.div>
        )}
      </div>
    </div>
  )
}
