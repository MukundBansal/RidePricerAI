"use client"

import { motion } from "motion/react"

// ── Navbar ────────────────────────────────────────────────────────────────────
export function Navbar({ modelR2 }: { modelR2?: number }) {
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(11,17,32,0.95)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      padding: "0 32px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      height: 56,
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: "white", letterSpacing: "-0.01em" }}>
          RidePricer <span style={{ color: "#818CF8" }}>AI</span>
        </span>
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {modelR2 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
            <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: "var(--rp-mono)" }}>
              Model R² <span style={{ color: "#10B981", fontWeight: 500 }}>{modelR2}%</span>
            </span>
          </div>
        )}
        <a href="https://github.com" target="_blank" rel="noreferrer" style={{
          fontSize: 12, color: "#94A3B8", padding: "5px 12px",
          borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)",
          textDecoration: "none", transition: "all 0.15s",
        }}>GitHub</a>
        <a href="#" style={{
          fontSize: 12, fontWeight: 500, color: "white",
          padding: "5px 12px", borderRadius: 8,
          background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
          textDecoration: "none",
        }}>PBL Project</a>
      </div>
    </nav>
  )
}

// ── Model stats bar ───────────────────────────────────────────────────────────
export function ModelStatsBar({
  r2, mae, rmse, samples,
}: { r2: string; mae: string; rmse: string; samples: string }) {
  const stats = [
    { label: "R² Score",         value: r2,      color: "#10B981" },
    { label: "MAE",              value: `₹${mae}`, color: "#EF4444" },
    { label: "RMSE",             value: `₹${rmse}`, color: "#EF4444" },
    { label: "Training Samples", value: samples,  color: "var(--rp-text-1)" },
  ]
  return (
    <div style={{
      background: "white",
      borderBottom: "1px solid var(--rp-card-border)",
      padding: "10px 40px",
      display: "flex", alignItems: "center", gap: 32,
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "var(--rp-text-3)" }}>{s.label}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: s.color, fontFamily: "var(--rp-mono)" }}>{s.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main page grid ────────────────────────────────────────────────────────────
export function PageGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: "100%",
      margin: "0 auto",
      padding: "32px 40px",
      display: "grid",
      gridTemplateColumns: "380px 1fr",
      gap: 32,
      alignItems: "start",
    }}>
      {children}
    </div>
  )
}

// ── Left column — sticky input panel ─────────────────────────────────────────
export function LeftColumn({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "sticky", top: 72 }}>
      {children}
    </div>
  )
}

// ── Right column — results ─────────────────────────────────────────────────
export function RightColumn({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
      {children}
    </div>
  )
}
