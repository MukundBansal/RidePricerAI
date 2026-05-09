"use client"

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

        {/* Loading skeleton — shown while waiting for first result */}
        {isLoading && !hasResult && (
          <motion.div key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoadingSkeleton />
          </motion.div>
        )}

        {/* Empty state — before any prediction */}
        {!hasResult && !isLoading && (
          <motion.div key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", minHeight: 420, textAlign: "center",
              padding: "0 32px",
            }}
          >
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: "linear-gradient(135deg,#EEF2FF,#F5F3FF)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 18,
              boxShadow: "0 4px 24px rgba(99,102,241,0.12)",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0F172A", marginBottom: 8 }}>
              Ready to price
            </h3>
            <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.7, maxWidth: 260 }}>
              Enter pickup and drop-off locations, select a cab type, and hit Get AI Price.
            </p>
          </motion.div>
        )}

        {/* Results — only rendered when we actually have data */}
        {hasResult && (
          <motion.div key="results"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {children}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Fare skeleton */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E8ECF0", padding: "28px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <Skel w={120} h={12} mb={16} />
        <Skel w={200} h={52} mb={12} />
        <Skel w={280} h={16} mb={0} />
      </div>
      {/* Stats skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ background: "#fff", borderRadius: 16, border: "1px solid #E8ECF0", padding: "18px 20px" }}>
            <Skel w={80} h={10} mb={12} />
            <Skel w={100} h={28} mb={8} />
            <Skel w={140} h={12} mb={0} />
          </div>
        ))}
      </div>
      {/* Card skeleton */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E8ECF0", padding: "20px 24px" }}>
        <Skel w={160} h={14} mb={16} />
        <Skel w="100%" h={80} mb={0} />
      </div>
    </div>
  )
}

function Skel({ w, h, mb }: { w: number | string; h: number; mb: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 6, marginBottom: mb,
      background: "linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)",
      backgroundSize: "800px 100%",
      animation: "rp-shimmer 1.4s infinite",
    }} />
  )
}

export function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
      <div style={{ flex: 1, height: 1, background: "#E8ECF0" }} />
      <span style={{
        fontSize: 10, fontWeight: 600, color: "#94A3B8",
        textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 4px",
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "#E8ECF0" }} />
    </div>
  )
}