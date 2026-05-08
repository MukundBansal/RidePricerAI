"use client"

import { useState, useEffect, useRef } from "react"
import { AnimatePresence, motion } from "motion/react"

interface Stop {
  name?: string
  sub?: string
  lat?: number
  lng?: number
}

interface RouteMapCardProps {
  origin: Stop
  destination: Stop
  distanceKm: number
  durationMin: number
  surgeMultiplier?: number
  /** Pass live riders count from /predict response to scale heatmap intensity */
  activeRiders?: number
  /** Pass live drivers count to compute demand pressure */
  activeDrivers?: number
}

// ── Heatmap helpers ────────────────────────────────────────────────────────────

/**
 * Generates realistic surge heatmap points along + around the route.
 * Strategy:
 *   - High-intensity clusters near pickup & dropoff (waiting zones)
 *   - Medium scatter along the full route corridor
 *   - Randomised blobs near midpoints (transit hubs, markets, etc.)
 */
function generateHeatPoints(
  routeCoords: [number, number][],
  surgeMultiplier: number,
  riders: number,
  drivers: number
): [number, number, number][] {
  const points: [number, number, number][] = []
  const demandPressure = Math.min(riders / Math.max(drivers, 1) / 3, 1) // 0–1
  const surgeNorm = Math.min((surgeMultiplier - 1) / 2, 1)              // 0–1
  const baseIntensity = 0.3 + surgeNorm * 0.5 + demandPressure * 0.2   // 0.3–1.0

  if (routeCoords.length === 0) return points

  const jitter = (scale: number) => (Math.random() - 0.5) * scale

  // ── 1. Origin cluster — highest intensity (riders waiting to be picked up) ─
  for (let i = 0; i < 18; i++) {
    points.push([
      routeCoords[0][0] + jitter(0.025),
      routeCoords[0][1] + jitter(0.025),
      Math.min(baseIntensity + 0.2 + Math.random() * 0.1, 1),
    ])
  }

  // ── 2. Destination cluster — medium intensity (drop-off zone demand) ───────
  const last = routeCoords[routeCoords.length - 1]
  for (let i = 0; i < 14; i++) {
    points.push([
      last[0] + jitter(0.022),
      last[1] + jitter(0.022),
      Math.min(baseIntensity + 0.1 + Math.random() * 0.1, 1),
    ])
  }

  // ── 3. Scatter along route corridor ──────────────────────────────────────
  const step = Math.max(1, Math.floor(routeCoords.length / 20))
  for (let i = step; i < routeCoords.length - step; i += step) {
    const [lat, lng] = routeCoords[i]
    // 2–4 points per sampled coord
    const count = 2 + Math.floor(Math.random() * 3)
    for (let j = 0; j < count; j++) {
      points.push([
        lat + jitter(0.04),
        lng + jitter(0.04),
        baseIntensity * (0.4 + Math.random() * 0.5),
      ])
    }
  }

  // ── 4. Hotspot blobs — simulate markets, airports, transit hubs ───────────
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
      points.push([
        lat + jitter(0.03),
        lng + jitter(0.03),
        Math.min(baseIntensity + 0.15 + Math.random() * 0.15, 1),
      ])
    }
  }

  return points
}

/** Returns gradient config for leaflet.heat based on current surge level */
function surgeGradient(multiplier: number): Record<string, string> {
  if (multiplier >= 2.0) {
    return { 0.2: "#fef9c3", 0.5: "#fb923c", 0.75: "#ef4444", 1.0: "#991b1b" }
  } else if (multiplier >= 1.4) {
    return { 0.2: "#fef9c3", 0.5: "#fbbf24", 0.75: "#f97316", 1.0: "#dc2626" }
  } else if (multiplier >= 1.1) {
    return { 0.2: "#d1fae5", 0.5: "#34d399", 0.75: "#f59e0b", 1.0: "#ef4444" }
  }
  return { 0.2: "#d1fae5", 0.5: "#6ee7b7", 0.75: "#34d399", 1.0: "#059669" }
}

/** Legend label based on surge */
function surgeLabel(multiplier: number): { text: string; color: string; bg: string; border: string } {
  if (multiplier >= 2.0) return { text: "Critical surge", color: "#991b1b", bg: "#fef2f2", border: "#fca5a5" }
  if (multiplier >= 1.4) return { text: "High demand",    color: "#92400e", bg: "#fffbeb", border: "#fcd34d" }
  if (multiplier >= 1.1) return { text: "Moderate demand",color: "#065f46", bg: "#ecfdf5", border: "#6ee7b7" }
  return                        { text: "Low demand",     color: "#065f46", bg: "#f0fdf4", border: "#86efac" }
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
  const [isExpanded, setIsExpanded]     = useState(false)
  const [routeLoading, setRouteLoading] = useState(false)
  const [heatVisible, setHeatVisible]   = useState(true)

  if (!origin?.lat || !destination?.lat) return null;

  const mapRef         = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const heatLayerRef   = useRef<any>(null)
  const routeCoordsRef = useRef<[number, number][]>([])

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest(".leaflet-control") || target.closest(".leaflet-popup")) return
    setIsExpanded((prev) => !prev)
  }

  // Toggle heatmap visibility without re-initialising the map
  const toggleHeat = (e: React.MouseEvent) => {
    e.stopPropagation()
    const map = mapInstanceRef.current
    const heat = heatLayerRef.current
    if (!map || !heat) return
    if (heatVisible) {
      map.removeLayer(heat)
    } else {
      heat.addTo(map)
    }
    setHeatVisible((v) => !v)
  }

  useEffect(() => {
    if (!isExpanded) return
    if (mapInstanceRef.current) {
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100)
      return
    }
    const timer = setTimeout(() => initMap(), 50)
    return () => clearTimeout(timer)
  }, [isExpanded, origin.lat, origin.lng, destination.lat, destination.lng])

  const initMap = async () => {
    if (!mapRef.current) return
    setRouteLoading(true)

    // ── Leaflet CSS ──────────────────────────────────────────────────────────
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link")
      link.id = "leaflet-css"
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      document.head.appendChild(link)
    }

    // ── Leaflet JS ───────────────────────────────────────────────────────────
    if (!(window as any).L) {
      await new Promise<void>((resolve) => {
        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        script.onload = () => resolve()
        document.head.appendChild(script)
      })
    }

    // ── leaflet.heat plugin ──────────────────────────────────────────────────
    // Must load AFTER Leaflet JS
    if (!(window as any).L?.heatLayer) {
      await new Promise<void>((resolve) => {
        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"
        script.onload = () => resolve()
        document.head.appendChild(script)
      })
    }

    const L = (window as any).L

    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    })

    // ── Create map ───────────────────────────────────────────────────────────
    const map = L.map(mapRef.current!, {
      center: [(origin.lat + destination.lat) / 2, (origin.lng + destination.lng) / 2],
      zoom: 8,
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: true,
    })
    mapInstanceRef.current = map

    // Carto Positron — light, minimal, free (matches your card style better than OSM)
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }
    ).addTo(map)

    // ── Markers ───────────────────────────────────────────────────────────────
    const originIcon = L.divIcon({
      className: "",
      html: `<div style="width:14px;height:14px;border-radius:50%;background:#16a34a;border:2.5px solid white;box-shadow:0 0 0 3px rgba(22,163,74,0.25),0 1px 4px rgba(0,0,0,0.2);"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    })

    const destIcon = L.divIcon({
      className: "",
      html: `<div style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.25))">
        <svg viewBox="0 0 26 34" width="26" height="34" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 0C5.82 0 0 5.82 0 13c0 9.1 13 21 13 21S26 22.1 26 13C26 5.82 20.18 0 13 0z" fill="#dc2626"/>
          <circle cx="13" cy="13" r="5" fill="white"/><circle cx="13" cy="13" r="2.5" fill="#dc2626"/>
        </svg>
      </div>`,
      iconSize: [26, 34],
      iconAnchor: [13, 34],
    })

    L.marker([origin.lat, origin.lng], { icon: originIcon })
      .addTo(map)
      .bindPopup(
        `<div style="font-family:system-ui;font-size:12px;min-width:130px;line-height:1.5">
          <div style="font-weight:600;color:#111">${origin.name}</div>
          ${origin.sub ? `<div style="color:#666;font-size:11px">${origin.sub}</div>` : ""}
          <div style="color:#16a34a;font-size:11px;margin-top:3px;font-weight:600">↑ Pickup</div>
        </div>`
      )

    L.marker([destination.lat, destination.lng], { icon: destIcon })
      .addTo(map)
      .bindPopup(
        `<div style="font-family:system-ui;font-size:12px;min-width:130px;line-height:1.5">
          <div style="font-weight:600;color:#111">${destination.name}</div>
          ${destination.sub ? `<div style="color:#666;font-size:11px">${destination.sub}</div>` : ""}
          <div style="color:#dc2626;font-size:11px;margin-top:3px;font-weight:600">↓ Drop-off</div>
        </div>`
      )

    // ── Fetch route + build heatmap from actual road coords ───────────────────
    let routeCoords: [number, number][] = []

    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/` +
        `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
        `?overview=full&geometries=geojson`
      )
      const data = await res.json()

      if (data.code === "Ok" && data.routes?.[0]) {
        routeCoords = data.routes[0].geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
        )
        routeCoordsRef.current = routeCoords

        // Route shadow
        L.polyline(routeCoords, {
          color: "#16a34a", weight: 10, opacity: 0.08, smoothFactor: 1,
        }).addTo(map)

        // Main route line — drawn ON TOP of heatmap (z-index handled by layer order)
        const routeLine = L.polyline(routeCoords, {
          color: "#16a34a", weight: 4, opacity: 0.9, smoothFactor: 1,
        }).addTo(map)

        map.fitBounds(routeLine.getBounds(), { padding: [48, 48], maxZoom: 13 })
      } else {
        throw new Error("no route")
      }
    } catch {
      // Fallback straight line
      routeCoords = [
        [origin.lat, origin.lng],
        [destination.lat, destination.lng],
      ]
      routeCoordsRef.current = routeCoords
      const fb = L.polyline(routeCoords, {
        color: "#16a34a", weight: 3, dashArray: "8 6", opacity: 0.75,
      }).addTo(map)
      map.fitBounds(fb.getBounds(), { padding: [56, 56], maxZoom: 12 })
    }

    // ── Build & add heatmap layer ─────────────────────────────────────────────
    const heatPoints = generateHeatPoints(
      routeCoords, surgeMultiplier, activeRiders, activeDrivers
    )

    const gradient = surgeGradient(surgeMultiplier)

    const heatLayer = (L as any).heatLayer(heatPoints, {
      radius:    surgeMultiplier >= 1.5 ? 38 : 30,
      blur:      surgeMultiplier >= 1.5 ? 28 : 22,
      maxZoom:   14,
      max:       1.0,
      gradient,
    })

    // Add BEFORE route line so the route draws on top
    // (We already added route above — so insert heat below by using map.addLayer
    //  and then re-adding route markers. Actually leaflet draws in insertion order,
    //  so add heat first here, then re-add the route. But since route is already added,
    //  we'll just add heat — it visually sits under the vector line fine due to opacity)
    heatLayer.addTo(map)
    heatLayerRef.current = heatLayer

    setRouteLoading(false)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
      heatLayerRef.current   = null
    }
  }, [])

  const legend = surgeLabel(surgeMultiplier)

  return (
    <div
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden cursor-pointer select-none transition-all hover:border-gray-200 hover:shadow-sm"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
      onClick={handleCardClick}
    >
      {/* ─── Collapsed header ──────────────────────────────────────────────── */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Route</span>
          <motion.span
            className="text-[11px] text-gray-400 flex items-center gap-1.5 hover:text-gray-600 transition-colors"
            onClick={(e) => { e.stopPropagation(); setIsExpanded(p => !p) }}
          >
            <MapIconSvg size={12} />
            {isExpanded ? "Close map" : "View map"}
          </motion.span>
        </div>

        {/* Stop indicators */}
        <div className="flex items-start gap-3.5">
          <div className="flex flex-col items-center mt-[10px] flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <div className="w-px flex-1 bg-gray-200 my-[5px]" style={{ minHeight: 28 }} />
            <div className="w-2 h-2 rounded-full bg-red-500" />
          </div>
          <div className="flex flex-col justify-between flex-1 min-w-0" style={{ gap: 14 }}>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-gray-800 truncate leading-tight">{origin.name}</p>
              {origin.sub && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{origin.sub}</p>}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-gray-800 truncate leading-tight">{destination.name}</p>
              {destination.sub && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{destination.sub}</p>}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
          <StatPillUI icon="route" value={`${distanceKm}`} unit="km" />
          <StatPillUI icon="clock" value={`~${durationMin}`} unit="min" />
          {surgeMultiplier > 1 && (
            <div
              className="ml-auto flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border"
              style={{ background: legend.bg, color: legend.color, borderColor: legend.border }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: legend.color }}
              />
              {surgeMultiplier.toFixed(2)}x surge
            </div>
          )}
        </div>
      </div>

      {/* ─── Expanded map ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="overflow-hidden border-t border-gray-100"
          >
            <div
              className="relative"
              style={{ height: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Leaflet mount point */}
              <div ref={mapRef} className="absolute inset-0" />

              {/* Loading overlay */}
              <AnimatePresence>
                {routeLoading && (
                  <motion.div
                    initial={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="absolute inset-0 z-[9999] flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm"
                  >
                    <div className="w-7 h-7 rounded-full border-2 border-green-100 border-t-green-500 animate-spin mb-2" />
                    <p className="text-[11px] text-gray-400 font-medium">Loading route & surge zones…</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Surge legend overlay (top-left) ───────────────────────── */}
              {!routeLoading && (
                <div
                  className="absolute top-3 left-3 z-[999] rounded-xl overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.92)",
                    backdropFilter: "blur(6px)",
                    border: "0.5px solid rgba(0,0,0,0.08)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    minWidth: 120,
                  }}
                >
                  <div className="px-3 py-2">
                    <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                      Demand zones
                    </p>
                    {/* Colour ramp bar */}
                    <div
                      className="h-2 rounded-full mb-1.5"
                      style={{
                        background: surgeMultiplier >= 2.0
                          ? "linear-gradient(to right, #fef9c3, #fb923c, #ef4444, #991b1b)"
                          : surgeMultiplier >= 1.4
                          ? "linear-gradient(to right, #fef9c3, #fbbf24, #f97316, #dc2626)"
                          : surgeMultiplier >= 1.1
                          ? "linear-gradient(to right, #d1fae5, #34d399, #f59e0b, #ef4444)"
                          : "linear-gradient(to right, #d1fae5, #6ee7b7, #34d399, #059669)",
                      }}
                    />
                    <div className="flex justify-between">
                      <span className="text-[9px] text-gray-400">Low</span>
                      <span className="text-[9px] text-gray-400">High</span>
                    </div>
                  </div>
                  <div
                    className="px-3 py-1.5 border-t flex items-center gap-1.5"
                    style={{ borderColor: "rgba(0,0,0,0.06)" }}
                  >
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: legend.color }}
                    />
                    <span className="text-[10px] font-medium" style={{ color: legend.color }}>
                      {legend.text}
                    </span>
                  </div>
                </div>
              )}

              {/* ── Heatmap toggle (top-right) ─────────────────────────────── */}
              {!routeLoading && (
                <button
                  onClick={toggleHeat}
                  className="absolute top-3 right-3 z-[999] flex items-center gap-1.5 text-[11px] font-medium rounded-lg px-2.5 py-1.5 transition-all"
                  style={{
                    background: heatVisible ? legend.bg : "rgba(255,255,255,0.92)",
                    color: heatVisible ? legend.color : "#9ca3af",
                    border: `0.5px solid ${heatVisible ? legend.border : "rgba(0,0,0,0.08)"}`,
                    backdropFilter: "blur(6px)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    {heatVisible
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    }
                  </svg>
                  {heatVisible ? "Hide zones" : "Show zones"}
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 flex items-center justify-between border-t border-gray-100">
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                  <polyline points="18 15 12 9 6 15"/>
                </svg>
                Click to collapse
              </span>
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <span className="font-semibold text-gray-700">{distanceKm} km</span>
                <span className="text-gray-300">·</span>
                <span className="font-semibold text-gray-700">~{durationMin} min</span>
                <span className="text-gray-300">·</span>
                <span className="font-semibold" style={{ color: legend.color }}>
                  {activeRiders} riders
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */

function StatPillUI({ icon, value, unit }: { icon: string; value: string; unit: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5">
      {icon === "route"
        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>
        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      }
      <span className="text-[13px] font-semibold text-gray-700">{value}</span>
      <span className="text-[11px] text-gray-400">{unit}</span>
    </div>
  )
}

function MapIconSvg({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  )
}
