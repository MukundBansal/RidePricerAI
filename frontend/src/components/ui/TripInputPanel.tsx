"use client"

// TripInputPanel.tsx
// Keeps your existing Google Places autocomplete working via useRef + window.google
// while applying the new visual design.

import { useEffect, useRef } from "react"
import { motion } from "motion/react"

const CAB_OPTIONS = [
  { id: "Uber Go",        emoji: "🚗", tier: "Economy", color: "#6366F1" },
  { id: "Ola Mini",       emoji: "🚕", tier: "Economy", color: "#10B981" },
  { id: "Uber Auto",      emoji: "🛺", tier: "Economy", color: "#F59E0B" },
  { id: "Rapido Bike",    emoji: "🏍", tier: "Bike",    color: "#EC4899" },
  { id: "Ola Prime SUV",  emoji: "🚙", tier: "Premium", color: "#8B5CF6" },
  { id: "Uber Premium",   emoji: "⭐", tier: "Premium", color: "#EF4444" },
]

const TIME_OPTIONS = [
  { label: "Live Time", value: null },
  { label: "8 AM",      value: 8    },
  { label: "2 PM",      value: 14   },
  { label: "6 PM",      value: 18   },
  { label: "11 PM",     value: 23   },
]

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "11px 12px 11px 30px",
  fontSize: 13,
  border: "1px solid #E8ECF0",
  borderRadius: 10,
  outline: "none",
  background: "#F8FAFC",
  color: "#0F172A",
  fontFamily: "inherit",
  transition: "border-color 0.15s, box-shadow 0.15s",
  boxSizing: "border-box",
}

interface TripInputPanelProps {
  pickup:         string
  dropoff:        string
  cabType:        string
  simulatedHour:  number | null
  isLoading:      boolean
  onPickupChange:   (v: string) => void
  onDropoffChange:  (v: string) => void
  onCabChange:      (v: string) => void
  onHourChange:     (v: number | null) => void
  onSubmit:         () => void
}

export function TripInputPanel({
  pickup, dropoff, cabType, simulatedHour, isLoading,
  onPickupChange, onDropoffChange, onCabChange, onHourChange, onSubmit,
}: TripInputPanelProps) {
  const pickupRef  = useRef<HTMLInputElement>(null)
  const dropoffRef = useRef<HTMLInputElement>(null)
  const pickupAC   = useRef<any>(null)
  const dropoffAC  = useRef<any>(null)

  // ── Google Places Autocomplete ──────────────────────────────────────────────
  // Re-initialises whenever the Google Maps script becomes available.
  // Works whether the script is already loaded or loads after mount.
  useEffect(() => {
    const init = () => {
      const google = (window as any).google
      if (!google?.maps?.places) return

      if (pickupRef.current && !pickupAC.current) {
        pickupAC.current = new google.maps.places.Autocomplete(pickupRef.current, {
          types: ["geocode"],
        })
        pickupAC.current.addListener("place_changed", () => {
          const place = pickupAC.current.getPlace()
          onPickupChange(place.formatted_address || pickupRef.current?.value || "")
        })
      }

      if (dropoffRef.current && !dropoffAC.current) {
        dropoffAC.current = new google.maps.places.Autocomplete(dropoffRef.current, {
          types: ["geocode"],
        })
        dropoffAC.current.addListener("place_changed", () => {
          const place = dropoffAC.current.getPlace()
          onDropoffChange(place.formatted_address || dropoffRef.current?.value || "")
        })
      }
    }

    // Try immediately (script may already be loaded)
    init()

    // Also wait for script load event in case it loads after mount
    window.addEventListener("google-maps-loaded", init)
    return () => window.removeEventListener("google-maps-loaded", init)
  }, [])

  // Keep input values in sync when state changes externally
  useEffect(() => {
    if (pickupRef.current && document.activeElement !== pickupRef.current) {
      pickupRef.current.value = pickup
    }
  }, [pickup])

  useEffect(() => {
    if (dropoffRef.current && document.activeElement !== dropoffRef.current) {
      dropoffRef.current.value = dropoff
    }
  }, [dropoff])

  const focusStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#6366F1"
    e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"
    e.target.style.background = "#fff"
  }
  const blurStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#E8ECF0"
    e.target.style.boxShadow = "none"
    e.target.style.background = "#F8FAFC"
  }

  return (
    <div style={{
      background: "#fff", borderRadius: 16,
      border: "1px solid #E8ECF0",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "18px 22px 16px",
        borderBottom: "1px solid #F1F5F9",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: "linear-gradient(135deg,#6366F1,#8B5CF6)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>Trip Details</p>
          <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>Configure your ride</p>
        </div>
      </div>

      <div style={{ padding: "20px 22px" }}>

        {/* ── Route inputs ── */}
        <div style={{ marginBottom: 20 }}>
          {/* Pickup */}
          <div style={{ position: "relative", marginBottom: 6 }}>
            <div style={{
              position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
              width: 8, height: 8, borderRadius: "50%", background: "#10B981",
              boxShadow: "0 0 0 3px rgba(16,185,129,0.15)", zIndex: 1,
              pointerEvents: "none",
            }} />
            <input
              ref={pickupRef}
              defaultValue={pickup}
              onChange={e => onPickupChange(e.target.value)}
              onFocus={focusStyle}
              onBlur={blurStyle}
              placeholder="Pickup location"
              style={INPUT_STYLE}
            />
          </div>

          {/* Connector arrow */}
          <div style={{ display: "flex", alignItems: "center", padding: "2px 14px", marginBottom: 6 }}>
            <div style={{ width: 1, height: 10, background: "#E2E8F0", margin: "0 3px" }} />
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <polyline points="19 12 12 19 5 12"/>
            </svg>
          </div>

          {/* Dropoff */}
          <div style={{ position: "relative" }}>
            <div style={{
              position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
              width: 8, height: 8, borderRadius: "50%", background: "#EF4444", zIndex: 1,
              pointerEvents: "none",
            }} />
            <input
              ref={dropoffRef}
              defaultValue={dropoff}
              onChange={e => onDropoffChange(e.target.value)}
              onFocus={focusStyle}
              onBlur={blurStyle}
              placeholder="Drop-off location"
              style={INPUT_STYLE}
            />
          </div>
        </div>

        {/* ── Service type ── */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 10 }}>
            Service Type
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {CAB_OPTIONS.map(cab => {
              const active = cabType === cab.id
              return (
                <button key={cab.id}
                  onClick={() => onCabChange(cab.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "9px 11px", borderRadius: 10, cursor: "pointer",
                    border: `1.5px solid ${active ? cab.color : "#E8ECF0"}`,
                    background: active ? `${cab.color}12` : "#F8FAFC",
                    transition: "all 0.15s", textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1 }}>{cab.emoji}</span>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 500, color: active ? cab.color : "#0F172A", margin: 0 }}>{cab.id}</p>
                    <p style={{ fontSize: 10, color: "#94A3B8", margin: 0 }}>{cab.tier}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Time simulator ── */}
        <div style={{ marginBottom: 22 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 10 }}>
            Time Simulator
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {TIME_OPTIONS.map(opt => {
              const active = simulatedHour === opt.value
              return (
                <button key={String(opt.value)}
                  onClick={() => onHourChange(opt.value)}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "6px 12px", borderRadius: 999, cursor: "pointer",
                    fontSize: 12, fontWeight: 500,
                    border: `1.5px solid ${active ? "#6366F1" : "#E8ECF0"}`,
                    background: active ? "#EEF2FF" : "#F8FAFC",
                    color: active ? "#6366F1" : "#475569",
                    transition: "all 0.15s",
                  }}
                >
                  {opt.value === null && (
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%", background: "#10B981",
                      display: "inline-block",
                    }} />
                  )}
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Submit ── */}
        <motion.button
          onClick={onSubmit}
          disabled={isLoading}
          whileHover={{ scale: isLoading ? 1 : 1.01 }}
          whileTap={{ scale: isLoading ? 1 : 0.98 }}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 12,
            border: "none", cursor: isLoading ? "not-allowed" : "pointer",
            background: isLoading
              ? "#C7D2FE"
              : "linear-gradient(135deg,#6366F1 0%,#8B5CF6 100%)",
            color: "white", fontSize: 14, fontWeight: 600,
            fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: isLoading ? "none" : "0 4px 14px rgba(99,102,241,0.35)",
            transition: "background 0.2s, box-shadow 0.2s",
          }}
        >
          {isLoading ? (
            <>
              <div style={{
                width: 15, height: 15, borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white",
                animation: "rp-spin 0.8s linear infinite",
              }} />
              Calculating…
            </>
          ) : "⚡ Get AI Price"}
        </motion.button>
      </div>

      <style>{`
        @keyframes rp-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}