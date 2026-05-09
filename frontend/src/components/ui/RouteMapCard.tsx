"use client"

import { useState, useEffect, useRef } from "react"
import { AnimatePresence, motion } from "motion/react"

interface Stop {
  name: string
  sub?: string
  lat: number
  lng: number
}

interface RouteMapCardProps {
  origin: Stop
  destination: Stop
  distanceKm: number
  durationMin: number
  surgeMultiplier?: number
  activeRiders?: number
  activeDrivers?: number
}

// ── Heatmap helpers ────────────────────────────────────────────────────────────

function generateHeatPoints(
  routeCoords: [number, number][],
  surgeMultiplier: number,
  riders: number,
  drivers: number
): [number, number, number][] {
  const points: [number, number, number][] = []
  const demandPressure = Math.min(riders / Math.max(drivers, 1) / 3, 1)
  const surgeNorm = Math.min((surgeMultiplier - 1) / 2, 1)
  const baseIntensity = 0.3 + surgeNorm * 0.5 + demandPressure * 0.2

  if (routeCoords.length === 0) return points

  const jitter = (scale: number) => (Math.random() - 0.5) * scale

  for (let i = 0; i < 18; i++) {
    points.push([
      routeCoords[0][0] + jitter(0.025),
      routeCoords[0][1] + jitter(0.025),
      Math.min(baseIntensity + 0.2 + Math.random() * 0.1, 1),
    ])
  }

  const last = routeCoords[routeCoords.length - 1]
  for (let i = 0; i < 14; i++) {
    points.push([
      last[0] + jitter(0.022),
      last[1] + jitter(0.022),
      Math.min(baseIntensity + 0.1 + Math.random() * 0.1, 1),
    ])
  }

  const step = Math.max(1, Math.floor(routeCoords.length / 20))
  for (let i = step; i < routeCoords.length - step; i += step) {
    const [lat, lng] = routeCoords[i]
    const count = 2 + Math.floor(Math.random() * 3)
    for (let j = 0; j < count; j++) {
      points.push([lat + jitter(0.04), lng + jitter(0.04), baseIntensity * (0.4 + Math.random() * 0.5)])
    }
  }

  const hotspotCount = surgeMultiplier >= 1.5 ? 4 : 2
  const candidateIndices = [
    Math.floor(routeCoords.length * 0.25),
    Math.floor(routeCoords.length * 0.5),
    Math.floor(routeCoords.length * 0.65),
    Math.floor(routeCoords.length * 0.8),
  ]
  for (let h = 0; h < hotspotCount; h++) {
    const idx = candidateIndices[h % candidateIndices.length]
    const [lat, lng] = routeCoords[idx]
    for (let i = 0; i < 12; i++) {
      points.push([lat + jitter(0.03), lng + jitter(0.03), Math.min(baseIntensity + 0.15 + Math.random() * 0.15, 1)])
    }
  }

  return points
}

function surgeGradient(multiplier: number): Record<string, string> {
  if (multiplier >= 2.0) return { 0.2: "#fef9c3", 0.5: "#fb923c", 0.75: "#ef4444", 1.0: "#991b1b" }
  if (multiplier >= 1.4) return { 0.2: "#fef9c3", 0.5: "#fbbf24", 0.75: "#f97316", 1.0: "#dc2626" }
  if (multiplier >= 1.1) return { 0.2: "#d1fae5", 0.5: "#34d399", 0.75: "#f59e0b", 1.0: "#ef4444" }
  return { 0.2: "#d1fae5", 0.5: "#6ee7b7", 0.75: "#34d399", 1.0: "#059669" }
}

function surgeLabel(multiplier: number) {
  if (multiplier >= 2.0) return { text: "Critical surge",  color: "#991b1b", bg: "#fef2f2", border: "#fca5a5", gradBar: "linear-gradient(to right,#fef9c3,#fb923c,#ef4444,#991b1b)" }
  if (multiplier >= 1.4) return { text: "High demand",     color: "#92400e", bg: "#fffbeb", border: "#fcd34d", gradBar: "linear-gradient(to right,#fef9c3,#fbbf24,#f97316,#dc2626)" }
  if (multiplier >= 1.1) return { text: "Moderate demand", color: "#065f46", bg: "#ecfdf5", border: "#6ee7b7", gradBar: "linear-gradient(to right,#d1fae5,#34d399,#f59e0b,#ef4444)" }
  return                        { text: "Low demand",      color: "#065f46", bg: "#f0fdf4", border: "#86efac", gradBar: "linear-gradient(to right,#d1fae5,#6ee7b7,#34d399,#059669)" }
}

// ── Component ──────────────────────────────────────────────────────────────────

export function RouteMapCard({
  origin,
  destination,
  distanceKm,
  durationMin,
  surgeMultiplier = 1.0,
  activeRiders = 60,
  activeDrivers = 40,
}: RouteMapCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [routeLoading, setRouteLoading] = useState(false)
  const [heatVisible, setHeatVisible] = useState(true)
  const [mapMounted, setMapMounted] = useState(false)  // controls DOM presence

  const mapRef      = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const heatLayer   = useRef<any>(null)

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest(".leaflet-control") || target.closest(".leaflet-popup")) return
    if (isExpanded) {
      // ── CLOSE: destroy map first, then unmount DOM ──────────────────────────
      destroyMap()
      setIsExpanded(false)
      setMapMounted(false)
    } else {
      // ── OPEN: mount DOM first, then init map after animation ──────────────
      setHeatVisible(true)
      setIsExpanded(true)
      setMapMounted(true)
    }
  }

  const destroyMap = () => {
    if (mapInstance.current) {
      try { mapInstance.current.remove() } catch {}
      mapInstance.current = null
      heatLayer.current   = null
    }
  }

  // Init map after DOM is mounted and animation has given the div real height
  useEffect(() => {
    if (!mapMounted) return
    // Wait for spring animation to finish painting the div with real height
    const timer = setTimeout(() => initMap(), 380)
    return () => {
      clearTimeout(timer)
      destroyMap()
    }
  }, [mapMounted]) // eslint-disable-line

  // Cleanup on component unmount
  useEffect(() => () => destroyMap(), [])

  const initMap = async () => {
    if (!mapRef.current || mapInstance.current) return
    setRouteLoading(true)

    // ── Leaflet CSS ────────────────────────────────────────────────────────
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link")
      link.id   = "leaflet-css"
      link.rel  = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      document.head.appendChild(link)
    }

    // ── Leaflet JS ─────────────────────────────────────────────────────────
    if (!(window as any).L) {
      await new Promise<void>(resolve => {
        const s = document.createElement("script")
        s.src     = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        s.onload  = () => resolve()
        document.head.appendChild(s)
      })
    }

    // ── leaflet.heat ───────────────────────────────────────────────────────
    if (!(window as any).L?.heatLayer) {
      await new Promise<void>(resolve => {
        const s = document.createElement("script")
        s.src    = "https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"
        s.onload = () => resolve()
        document.head.appendChild(s)
      })
    }

    // Guard: component may have closed while scripts were loading
    if (!mapRef.current) { setRouteLoading(false); return }

    const L = (window as any).L
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    })

    const map = L.map(mapRef.current, {
      center: [(origin.lat + destination.lat) / 2, (origin.lng + destination.lng) / 2],
      zoom: 9,
      zoomControl: true,
      scrollWheelZoom: true,
    })
    mapInstance.current = map

    // Carto Positron — light tiles that contrast well with heatmap colours
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd", maxZoom: 20,
    }).addTo(map)

    // ── Markers ────────────────────────────────────────────────────────────
    const originIcon = L.divIcon({
      className: "",
      html: `<div style="width:14px;height:14px;border-radius:50%;background:#16a34a;border:2.5px solid white;box-shadow:0 0 0 3px rgba(22,163,74,0.25),0 1px 4px rgba(0,0,0,0.2);"></div>`,
      iconSize: [14, 14], iconAnchor: [7, 7],
    })
    const destIcon = L.divIcon({
      className: "",
      html: `<div style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.25))">
        <svg viewBox="0 0 26 34" width="26" height="34" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 0C5.82 0 0 5.82 0 13c0 9.1 13 21 13 21S26 22.1 26 13C26 5.82 20.18 0 13 0z" fill="#dc2626"/>
          <circle cx="13" cy="13" r="5" fill="white"/><circle cx="13" cy="13" r="2.5" fill="#dc2626"/>
        </svg>
      </div>`,
      iconSize: [26, 34], iconAnchor: [13, 34],
    })

    L.marker([origin.lat, origin.lng], { icon: originIcon }).addTo(map)
      .bindPopup(`<div style="font-family:system-ui;font-size:12px"><b>${origin.name}</b>${origin.sub ? `<br/><small>${origin.sub}</small>` : ""}<br/><span style="color:#16a34a;font-size:11px;font-weight:600">↑ Pickup</span></div>`)

    L.marker([destination.lat, destination.lng], { icon: destIcon }).addTo(map)
      .bindPopup(`<div style="font-family:system-ui;font-size:12px"><b>${destination.name}</b>${destination.sub ? `<br/><small>${destination.sub}</small>` : ""}<br/><span style="color:#dc2626;font-size:11px;font-weight:600">↓ Drop-off</span></div>`)

    // ── OSRM route ─────────────────────────────────────────────────────────
    let routeCoords: [number, number][] = []
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
      )
      const data = await res.json()

      if (data.code === "Ok" && data.routes?.[0]) {
        routeCoords = data.routes[0].geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
        )
        L.polyline(routeCoords, { color: "#16a34a", weight: 10, opacity: 0.08 }).addTo(map)
        const routeLine = L.polyline(routeCoords, { color: "#16a34a", weight: 4, opacity: 0.9 }).addTo(map)
        map.fitBounds(routeLine.getBounds(), { padding: [48, 48], maxZoom: 13 })
      } else throw new Error("no route")
    } catch {
      routeCoords = [[origin.lat, origin.lng], [destination.lat, destination.lng]]
      const fb = L.polyline(routeCoords, { color: "#16a34a", weight: 3, dashArray: "8 6", opacity: 0.75 }).addTo(map)
      map.fitBounds(fb.getBounds(), { padding: [56, 56], maxZoom: 12 })
    }

    // ── Heatmap ────────────────────────────────────────────────────────────
    const heatPts  = generateHeatPoints(routeCoords, surgeMultiplier, activeRiders, activeDrivers)
    const gradient = surgeGradient(surgeMultiplier)
    const heat     = (L as any).heatLayer(heatPts, {
      radius: surgeMultiplier >= 1.5 ? 38 : 30,
      blur:   surgeMultiplier >= 1.5 ? 28 : 22,
      maxZoom: 14, max: 1.0, gradient,
    })
    heat.addTo(map)
    heatLayer.current = heat

    setRouteLoading(false)
  }

  const toggleHeat = (e: React.MouseEvent) => {
    e.stopPropagation()
    const map  = mapInstance.current
    const heat = heatLayer.current
    if (!map || !heat) return
    if (heatVisible) { map.removeLayer(heat) }
    else             { heat.addTo(map) }
    setHeatVisible(v => !v)
  }

  const legend = surgeLabel(surgeMultiplier)

  return (
    <div
      style={{
        background: "#fff", borderRadius: 16,
        border: "1px solid #E8ECF0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04)",
        overflow: "hidden", cursor: "pointer",
      }}
      onClick={handleCardClick}
    >
      {/* ── Collapsed header ──────────────────────────────────────────────── */}
      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94A3B8" }}>
            Route
          </span>
          <span style={{ fontSize: 11, color: "#94A3B8", display: "flex", alignItems: "center", gap: 5 }}>
            <MapIcon size={12} />
            {isExpanded ? "Close map" : "View map"}
          </span>
        </div>

        {/* Stops */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 9, flexShrink: 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
            <div style={{ width: 1, minHeight: 28, background: "#E2E8F0", margin: "4px 0" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{origin.name}</p>
              {origin.sub && <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{origin.sub}</p>}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{destination.name}</p>
              {destination.sub && <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{destination.sub}</p>}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, paddingTop: 14, borderTop: "1px solid #F1F5F9" }}>
          <Pill icon="route" value={`${distanceKm}`} unit="km" />
          <Pill icon="clock" value={`~${durationMin}`} unit="min" />
          {surgeMultiplier > 1 && (
            <div style={{
              marginLeft: "auto", display: "flex", alignItems: "center", gap: 5,
              background: legend.bg, border: `1px solid ${legend.border}`,
              color: legend.color, borderRadius: 999,
              padding: "4px 10px", fontSize: 11, fontWeight: 600,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: legend.color, display: "inline-block", animation: "rp-pulse 2s infinite" }} />
              {surgeMultiplier.toFixed(2)}x surge
            </div>
          )}
        </div>
      </div>

      {/* ── Map panel — only in DOM when open ─────────────────────────────── */}
      <AnimatePresence>
        {isExpanded && mapMounted && (
          <motion.div
            key="map-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 300, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            style={{ overflow: "hidden", borderTop: "1px solid #F1F5F9" }}
          >
            <div
              style={{ position: "relative", height: 300 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Leaflet mount target — always full height while visible */}
              <div ref={mapRef} style={{ position: "absolute", inset: 0 }} />

              {/* Loading overlay */}
              <AnimatePresence>
                {routeLoading && (
                  <motion.div
                    initial={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    style={{
                      position: "absolute", inset: 0, zIndex: 9999,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      background: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)",
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      border: "2px solid #d1fae5", borderTopColor: "#10B981",
                      animation: "rp-spin 0.8s linear infinite", marginBottom: 10,
                    }} />
                    <p style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500 }}>Loading route & surge zones…</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Surge legend — top left */}
              {!routeLoading && (
                <div style={{
                  position: "absolute", top: 10, left: 10, zIndex: 999,
                  background: "rgba(255,255,255,0.94)", backdropFilter: "blur(6px)",
                  border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: 12,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)", minWidth: 116, overflow: "hidden",
                }}>
                  <div style={{ padding: "8px 12px" }}>
                    <p style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                      Demand zones
                    </p>
                    <div style={{ height: 6, borderRadius: 3, background: legend.gradBar, marginBottom: 4 }} />
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 9, color: "#94A3B8" }}>Low</span>
                      <span style={{ fontSize: 9, color: "#94A3B8" }}>High</span>
                    </div>
                  </div>
                  <div style={{ padding: "5px 12px 8px", borderTop: "0.5px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: legend.color, display: "inline-block", animation: "rp-pulse 2s infinite" }} />
                    <span style={{ fontSize: 10, fontWeight: 500, color: legend.color }}>{legend.text}</span>
                  </div>
                </div>
              )}

              {/* Toggle button — top right */}
              {!routeLoading && (
                <button
                  onClick={toggleHeat}
                  style={{
                    position: "absolute", top: 10, right: 10, zIndex: 999,
                    display: "flex", alignItems: "center", gap: 6,
                    fontSize: 11, fontWeight: 500, borderRadius: 8,
                    padding: "6px 10px", cursor: "pointer",
                    background: heatVisible ? legend.bg : "rgba(255,255,255,0.94)",
                    color: heatVisible ? legend.color : "#94A3B8",
                    border: `0.5px solid ${heatVisible ? legend.border : "rgba(0,0,0,0.08)"}`,
                    backdropFilter: "blur(6px)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                >
                  <EyeIcon visible={heatVisible} />
                  {heatVisible ? "Hide zones" : "Show zones"}
                </button>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: "8px 20px", borderTop: "1px solid #F1F5F9",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 10, color: "#94A3B8", display: "flex", alignItems: "center", gap: 4 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
                Click to collapse
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#94A3B8" }}>
                <span style={{ fontWeight: 600, color: "#0F172A" }}>{distanceKm} km</span>
                <span style={{ color: "#E2E8F0" }}>·</span>
                <span style={{ fontWeight: 600, color: "#0F172A" }}>~{durationMin} min</span>
                <span style={{ color: "#E2E8F0" }}>·</span>
                <span style={{ fontWeight: 600, color: "#0F172A" }}>{activeRiders} riders</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes rp-spin   { to { transform: rotate(360deg); } }
        @keyframes rp-pulse  { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  )
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */

function Pill({ icon, value, unit }: { icon: string; value: string; unit: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#F8FAFC", borderRadius: 8, padding: "5px 10px" }}>
      {icon === "route"
        ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>
        : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      }
      <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{value}</span>
      <span style={{ fontSize: 11, color: "#94A3B8" }}>{unit}</span>
    </div>
  )
}

function MapIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
      <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
    </svg>
  )
}

function EyeIcon({ visible }: { visible: boolean }) {
  return visible
    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
}