"use client"

import { motion } from "motion/react"
import LocationInput from '../LocationInput'

const CAB_OPTIONS = [
  { id: "Uber Go",       emoji: "🚗", tier: "Economy",  color: "#6366F1" },
  { id: "Ola Mini",      emoji: "🚕", tier: "Economy",  color: "#10B981" },
  { id: "Uber Auto",     emoji: "🛺", tier: "Economy",  color: "#F59E0B" },
  { id: "Rapido Bike",   emoji: "🏍", tier: "Bike",     color: "#EC4899" },
  { id: "Ola Prime SUV", emoji: "🚙", tier: "Premium",  color: "#8B5CF6" },
  { id: "Uber Premium",  emoji: "⭐", tier: "Premium",  color: "#EF4444" },
]

const TIME_OPTIONS = [
  { label: "Live Time", value: null,  icon: "🔴" },
  { label: "8 AM",      value: 8,     icon: "🌅" },
  { label: "2 PM",      value: 14,    icon: "☀️" },
  { label: "6 PM",      value: 18,    icon: "🌆" },
  { label: "11 PM",     value: 23,    icon: "🌙" },
]

interface TripInputPanelProps {
  pickup:        string
  dropoff:       string
  cabType:       string
  simulatedHour: number | null
  isLoading:     boolean
  onPickupChange:    (v: string) => void
  onDropoffChange:   (v: string) => void
  onCabChange:       (v: string) => void
  onHourChange:      (v: number | null) => void
  onSubmit:          () => void
}

export function TripInputPanel({
  pickup, dropoff, cabType, simulatedHour, isLoading,
  onPickupChange, onDropoffChange, onCabChange, onHourChange, onSubmit,
}: TripInputPanelProps) {
  return (
    <div className="rp-card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Panel header */}
      <div style={{
        padding: "18px 22px 16px",
        borderBottom: "1px solid var(--rp-card-border)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--rp-text-1)" }}>Trip Details</p>
          <p style={{ fontSize: 11, color: "var(--rp-text-3)" }}>Configure your ride</p>
        </div>
      </div>

      <div style={{ padding: "20px 22px" }}>
        {/* Route inputs */}
        <div style={{ marginBottom: 20 }}>
          <LocationInput
            value={pickup}
            onChange={onPickupChange}
            placeholder="Pickup location"
            icon="📍"
          />

          {/* Connector */}
          <div style={{ display: "flex", alignItems: "center", padding: "0 16px", margin: "8px 0" }}>
            <div style={{ width: 1, height: 18, background: "#E2E8F0", margin: "0 3px" }} />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" style={{ margin: "0 4px" }}>
              <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
            </svg>
          </div>

          <LocationInput
            value={dropoff}
            onChange={onDropoffChange}
            placeholder="Drop-off location"
            icon="🏁"
          />
        </div>

        {/* Service type */}
        <div style={{ marginBottom: 20 }}>
          <p className="rp-label" style={{ marginBottom: 10 }}>Service Type</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {CAB_OPTIONS.map(cab => {
              const isActive = cabType === cab.id
              return (
                <button key={cab.id}
                  onClick={() => onCabChange(cab.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                    border: `1.5px solid ${isActive ? cab.color : "var(--rp-card-border)"}`,
                    background: isActive ? `${cab.color}10` : "#F8FAFC",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: 18 }}>{cab.emoji}</span>
                  <div style={{ textAlign: "left" }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: isActive ? cab.color : "var(--rp-text-1)" }}>{cab.id}</p>
                    <p style={{ fontSize: 10, color: "var(--rp-text-3)" }}>{cab.tier}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Time simulator */}
        <div style={{ marginBottom: 22 }}>
          <p className="rp-label" style={{ marginBottom: 10 }}>Time Simulator</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {TIME_OPTIONS.map(opt => {
              const isActive = simulatedHour === opt.value
              return (
                <button key={String(opt.value)}
                  onClick={() => onHourChange(opt.value)}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "6px 12px", borderRadius: 999, cursor: "pointer",
                    fontSize: 12, fontWeight: 500,
                    border: `1.5px solid ${isActive ? "#6366F1" : "var(--rp-card-border)"}`,
                    background: isActive ? "#EEF2FF" : "#F8FAFC",
                    color: isActive ? "#6366F1" : "var(--rp-text-2)",
                    transition: "all 0.15s",
                  }}
                >
                  {opt.value === null && (
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: "#10B981", display: "inline-block",
                      animation: isActive ? "pulse 2s infinite" : "none",
                    }} />
                  )}
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Submit button */}
        <motion.button
          onClick={onSubmit}
          disabled={isLoading}
          whileHover={{ scale: isLoading ? 1 : 1.01 }}
          whileTap={{ scale: isLoading ? 1 : 0.98 }}
          style={{
            width: "100%", padding: "14px 0",
            borderRadius: 12, border: "none", cursor: isLoading ? "not-allowed" : "pointer",
            background: isLoading
              ? "#C7D2FE"
              : "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
            color: "white", fontSize: 14, fontWeight: 600,
            fontFamily: "var(--rp-font)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: isLoading ? "none" : "0 4px 14px rgba(99,102,241,0.4)",
            transition: "all 0.2s",
          }}
        >
          {isLoading ? (
            <>
              <div style={{
                width: 16, height: 16, borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "white",
                animation: "spin 0.8s linear infinite",
              }} />
              Calculating…
            </>
          ) : (
            <>⚡ Get AI Price</>
          )}
        </motion.button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  )
}
