"use client"

import { motion, AnimatePresence } from "motion/react"

interface Factor {
  feature:      string
  display_name: string
  value:        number
  value_label:  string
  impact:       number
}

interface SHAPChartProps {
  factors:      Factor[]
  basePrice:    number
  finalPrice:   number
  surgeAdded:   number
  headline:     string
  isLoading?:   boolean
}

export function SHAPChart({
  factors, basePrice, finalPrice, surgeAdded, headline, isLoading,
}: SHAPChartProps) {
  const maxImpact = factors.length ? Math.max(...factors.map(f => Math.abs(f.impact))) : 1

  return (
    <div className="rp-card" style={{ overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        padding: "18px 24px 16px",
        borderBottom: "1px solid var(--rp-card-border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--rp-text-1)" }}>Why this price?</span>
        </div>
        <span className="rp-label">SHAP Explainability</span>
      </div>

      <div style={{ padding: "20px 24px" }}>
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="rp-skeleton" style={{ height: 60, marginBottom: 16 }} />
              <div className="rp-skeleton" style={{ height: 32, marginBottom: 12 }} />
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div className="rp-skeleton" style={{ height: 12, width: "60%", marginBottom: 6 }} />
                  <div className="rp-skeleton" style={{ height: 8 }} />
                </div>
              ))}
            </motion.div>
          ) : factors.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ padding: "32px 0", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "var(--rp-text-3)" }}>Get a price to see the explanation</p>
            </motion.div>
          ) : (
            <motion.div key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Headline */}
              <div style={{
                background: "#EEF2FF", border: "1px solid #C7D2FE",
                borderRadius: 12, padding: "12px 16px", marginBottom: 16,
              }}>
                <p style={{ fontSize: 13, color: "#3730A3", lineHeight: 1.6 }}>{headline}</p>
              </div>

              {/* Base → Surge → Final */}
              <div style={{
                background: "#F8FAFC", borderRadius: 12, padding: "12px 16px",
                display: "flex", alignItems: "center", gap: 8, marginBottom: 20,
              }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 10, color: "var(--rp-text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Base</p>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "var(--rp-text-1)", marginTop: 2 }}>
                    ₹{Math.round(basePrice).toLocaleString("en-IN")}
                  </p>
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ flex: 1, height: 1, background: "var(--rp-card-border)" }} />
                  <span style={{
                    fontSize: 11, fontWeight: 500, color: "#EF4444",
                    background: "#FEF2F2", border: "1px solid #FECACA",
                    borderRadius: 999, padding: "2px 8px",
                  }}>
                    +₹{Math.round(surgeAdded).toLocaleString("en-IN")}
                  </span>
                  <div style={{ flex: 1, height: 1, background: "var(--rp-card-border)" }} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 10, color: "var(--rp-text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Final</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "var(--rp-text-1)", marginTop: 2 }}>
                    ₹{Math.round(finalPrice).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Feature bars */}
              <p className="rp-label" style={{ marginBottom: 14 }}>Feature Contributions</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {factors.map((f, i) => {
                  const isPos = f.impact >= 0
                  const pct   = (Math.abs(f.impact) / maxImpact) * 100
                  const color = isPos ? "#EF4444" : "#10B981"
                  return (
                    <motion.div key={f.feature}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                          <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--rp-text-1)" }}>{f.display_name}</span>
                          <span style={{ fontSize: 11, color: "var(--rp-text-3)" }}>{f.value_label}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color, fontFamily: "var(--rp-mono)", tabularNums: "tabular-nums" } as any}>
                          {isPos ? "+" : ""}₹{Math.abs(f.impact).toFixed(0)}
                        </span>
                      </div>
                      {/* Bar track */}
                      <div style={{ height: 6, background: "#F1F5F9", borderRadius: 3, overflow: "hidden" }}>
                        <motion.div
                          style={{ height: "100%", background: color, borderRadius: 3 }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5, delay: i * 0.04, ease: "easeOut" }}
                        />
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Legend */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--rp-card-border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444" }} />
                  <span style={{ fontSize: 11, color: "var(--rp-text-3)" }}>Increases price</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
                  <span style={{ fontSize: 11, color: "var(--rp-text-3)" }}>Lowers price</span>
                </div>
                <span style={{ marginLeft: "auto", fontSize: 10, color: "#CBD5E1" }}>Powered by SHAP</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
