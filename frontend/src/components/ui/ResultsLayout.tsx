"use client"

// ResultsLayout.tsx
// Drop-in wrapper for your right-hand results panel.
// Import your individual components and slot them in below.
// This file handles spacing, ordering, and the empty/loading states.

import { motion, AnimatePresence } from "motion/react"

interface ResultsLayoutProps {
  hasResult:  boolean
  isLoading:  boolean
  children:   React.ReactNode
}

export function ResultsLayout({ hasResult, isLoading, children }: ResultsLayoutProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <AnimatePresence mode="wait">
        {!hasResult && !isLoading ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", minHeight: 400, textAlign: "center",
              padding: "0 32px",
            }}
          >
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: "linear-gradient(135deg, #EEF2FF, #F5F3FF)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 16,
              boxShadow: "0 4px 24px rgba(99,102,241,0.12)",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--rp-text-1)", marginBottom: 6 }}>
              Ready to price
            </h3>
            <p style={{ fontSize: 13, color: "var(--rp-text-3)", lineHeight: 1.6, maxWidth: 260 }}>
              Enter pickup and drop-off locations, select a cab type, and hit Get AI Price.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Section divider with label ────────────────────────────────────────────────
export function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
      <div style={{ flex: 1, height: 1, background: "var(--rp-card-border)" }} />
      <span style={{
        fontSize: 10, fontWeight: 600, color: "var(--rp-text-3)",
        textTransform: "uppercase", letterSpacing: "0.08em",
        padding: "0 4px",
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--rp-card-border)" }} />
    </div>
  )
}
