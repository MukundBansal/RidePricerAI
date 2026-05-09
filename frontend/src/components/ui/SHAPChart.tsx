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
  factors?:    Factor[]
  basePrice?:  number
  finalPrice?: number
  surgeAdded?: number
  headline?:   string
  isLoading?:  boolean
}

function Skel({ w, h, mb = 0 }: { w: number | string; h: number; mb?: number }) {
  return <div style={{
    width: w, height: h, borderRadius: 6, marginBottom: mb,
    background: "linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)",
    backgroundSize: "800px 100%", animation: "rp-shimmer 1.4s infinite",
  }} />
}

export function SHAPChart({
  factors = [], basePrice = 0, finalPrice = 0, surgeAdded = 0,
  headline = "", isLoading = false,
}: SHAPChartProps) {
  const safeFactor = factors ?? []
  const maxImpact = safeFactor.length
    ? Math.max(...safeFactor.map(f => Math.abs(f?.impact ?? 0)), 1)
    : 1

  return (
    <div style={{
      background: "#fff", borderRadius: 16,
      border: "1px solid #E8ECF0",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "18px 24px 16px",
        borderBottom: "1px solid #F1F5F9",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>Why this price?</span>
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94A3B8" }}>
          SHAP Explainability
        </span>
      </div>

      <div style={{ padding: "20px 24px" }}>
        <AnimatePresence mode="wait">

          {/* Loading */}
          {isLoading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Skel w="100%" h={60} mb={16} />
              <Skel w="100%" h={32} mb={20} />
              {[80, 65, 50, 40, 30].map((w, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <Skel w={`${w}%`} h={12} />
                    <Skel w={40} h={12} />
                  </div>
                  <Skel w="100%" h={6} />
                </div>
              ))}
            </motion.div>
          )}

          {/* Empty */}
          {!isLoading && safeFactor.length === 0 && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ padding: "32px 0", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "#94A3B8" }}>Get a price to see the explanation</p>
            </motion.div>
          )}

          {/* Data */}
          {!isLoading && safeFactor.length > 0 && (
            <motion.div key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

              {/* Headline */}
              {headline && (
                <div style={{
                  background: "#EEF2FF", border: "1px solid #C7D2FE",
                  borderRadius: 12, padding: "12px 16px", marginBottom: 16,
                }}>
                  <p style={{ fontSize: 13, color: "#3730A3", lineHeight: 1.6 }}>{headline}</p>
                </div>
              )}

              {/* Base → Surge → Final */}
              <div style={{
                background: "#F8FAFC", borderRadius: 12, padding: "12px 16px",
                display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
              }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Base</p>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginTop: 2 }}>
                    ₹{Math.round(basePrice ?? 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ flex: 1, height: 1, background: "#E8ECF0" }} />
                  <span style={{
                    fontSize: 11, fontWeight: 500, color: "#EF4444",
                    background: "#FEF2F2", border: "1px solid #FECACA",
                    borderRadius: 999, padding: "2px 8px", whiteSpace: "nowrap",
                  }}>
                    +₹{Math.round(surgeAdded ?? 0).toLocaleString("en-IN")}
                  </span>
                  <div style={{ flex: 1, height: 1, background: "#E8ECF0" }} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Final</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                    ₹{Math.round(finalPrice ?? 0).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Bars */}
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 14 }}>
                Feature Contributions
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                {safeFactor.map((f, i) => {
                  if (!f) return null
                  const isPos = (f.impact ?? 0) >= 0
                  const pct   = (Math.abs(f.impact ?? 0) / maxImpact) * 100
                  const color = isPos ? "#EF4444" : "#10B981"
                  return (
                    <motion.div key={f.feature ?? i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.035, duration: 0.25 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                          <span style={{ fontSize: 12.5, fontWeight: 500, color: "#0F172A", whiteSpace: "nowrap" }}>{f.display_name}</span>
                          <span style={{ fontSize: 11, color: "#94A3B8", whiteSpace: "nowrap" }}>{f.value_label}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color, flexShrink: 0, paddingLeft: 8, fontVariantNumeric: "tabular-nums" }}>
                          {isPos ? "+" : ""}₹{Math.abs(f.impact ?? 0).toFixed(0)}
                        </span>
                      </div>
                      <div style={{ height: 6, background: "#F1F5F9", borderRadius: 3, overflow: "hidden" }}>
                        <motion.div
                          style={{ height: "100%", background: color, borderRadius: 3 }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.45, delay: i * 0.035, ease: "easeOut" }}
                        />
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Legend */}
              <div style={{
                display: "flex", alignItems: "center", gap: 16,
                marginTop: 16, paddingTop: 14, borderTop: "1px solid #F1F5F9",
              }}>
                <Dot color="#EF4444" label="Increases price" />
                <Dot color="#10B981" label="Lowers price" />
                <span style={{ marginLeft: "auto", fontSize: 10, color: "#CBD5E1" }}>Powered by SHAP</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`@keyframes rp-shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`}</style>
    </div>
  )
}

function Dot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
      <span style={{ fontSize: 11, color: "#94A3B8" }}>{label}</span>
    </div>
  )
}