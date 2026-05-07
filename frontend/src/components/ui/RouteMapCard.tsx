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
}

export function RouteMapCard({
  origin,
  destination,
  distanceKm,
  durationMin,
  surgeMultiplier,
}: RouteMapCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [routeLoading, setRouteLoading] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest(".leaflet-control") || target.closest(".leaflet-popup")) return
    setIsExpanded((prev) => !prev)
  }

  useEffect(() => {
    if (!isExpanded) return
    if (mapInstanceRef.current) {
      // Already inited — just invalidate size in case panel was re-opened
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100)
      return
    }

    // Wait a tick for the DOM to paint before Leaflet grabs the div
    const timer = setTimeout(() => initMap(), 50)
    return () => clearTimeout(timer)
  }, [isExpanded, origin.lat, origin.lng, destination.lat, destination.lng, origin.name, origin.sub, destination.name, destination.sub])

  const initMap = async () => {
    if (!mapRef.current) return

    setRouteLoading(true)

    // ── 1. Inject Leaflet CSS ──────────────────────────────────────────────
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link")
      link.id = "leaflet-css"
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      document.head.appendChild(link)
    }

    // ── 2. Load Leaflet JS ─────────────────────────────────────────────────
    if (!(window as any).L) {
      await new Promise<void>((resolve) => {
        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        script.onload = () => resolve()
        document.head.appendChild(script)
      })
    }

    const L = (window as any).L

    // Fix Leaflet's default icon path broken by webpack/vite bundlers
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    })

    // ── 3. Create map ──────────────────────────────────────────────────────
    const map = L.map(mapRef.current!, {
      center: [(origin.lat + destination.lat) / 2, (origin.lng + destination.lng) / 2],
      zoom: 8,
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: true,
    })

    mapInstanceRef.current = map
    setMapReady(true)

    // OpenStreetMap tiles — completely free, no key
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    // ── 4. Custom markers ──────────────────────────────────────────────────
    const originIcon = L.divIcon({
      className: "",
      html: `<div style="
        width:16px;height:16px;border-radius:50%;
        background:#22c55e;border:3px solid white;
        box-shadow:0 0 0 3px rgba(34,197,94,0.3),0 2px 6px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })

    const destIcon = L.divIcon({
      className: "",
      html: `<div style="position:relative;width:30px;height:38px;filter:drop-shadow(0 3px 4px rgba(0,0,0,0.35))">
        <svg viewBox="0 0 30 38" width="30" height="38" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 0C6.72 0 0 6.72 0 15c0 10.5 15 23 15 23S30 25.5 30 15C30 6.72 23.28 0 15 0z" fill="#ef4444"/>
          <circle cx="15" cy="15" r="6" fill="white"/>
          <circle cx="15" cy="15" r="3" fill="#ef4444"/>
        </svg>
      </div>`,
      iconSize: [30, 38],
      iconAnchor: [15, 38],
    })

    L.marker([origin.lat, origin.lng], { icon: originIcon })
      .addTo(map)
      .bindPopup(
        `<div style="font-family:system-ui;min-width:140px">
          <b style="font-size:13px">${origin.name}</b>
          ${origin.sub ? `<div style="font-size:11px;color:#666;margin-top:2px">${origin.sub}</div>` : ""}
          <div style="font-size:11px;color:#22c55e;margin-top:4px;font-weight:600">📍 Pickup</div>
        </div>`
      )

    L.marker([destination.lat, destination.lng], { icon: destIcon })
      .addTo(map)
      .bindPopup(
        `<div style="font-family:system-ui;min-width:140px">
          <b style="font-size:13px">${destination.name}</b>
          ${destination.sub ? `<div style="font-size:11px;color:#666;margin-top:2px">${destination.sub}</div>` : ""}
          <div style="font-size:11px;color:#ef4444;margin-top:4px;font-weight:600">🏁 Drop-off</div>
        </div>`
      )

    // ── 5. Fetch real road route via OSRM ──────────────────────────────────
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/` +
        `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
        `?overview=full&geometries=geojson`
      )
      const data = await res.json()

      if (data.code === "Ok" && data.routes?.[0]) {
        const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
        )

        // Route shadow (thicker, lower opacity for depth)
        L.polyline(coords, {
          color: "#16a34a",
          weight: 9,
          opacity: 0.15,
          smoothFactor: 1,
        }).addTo(map)

        // Main route line
        const routeLine = L.polyline(coords, {
          color: "#22c55e",
          weight: 5,
          opacity: 0.9,
          smoothFactor: 1,
        }).addTo(map)

        // Fit to actual route bounds with generous padding
        map.fitBounds(routeLine.getBounds(), {
          padding: [50, 50],
          maxZoom: 13,
        })
      } else {
        throw new Error("No route returned")
      }
    } catch {
      // Graceful fallback: straight dashed line + fit bounds manually
      const fallback = L.polyline(
        [[origin.lat, origin.lng], [destination.lat, destination.lng]],
        { color: "#22c55e", weight: 4, dashArray: "10 8", opacity: 0.8 }
      ).addTo(map)
      map.fitBounds(fallback.getBounds(), { padding: [60, 60], maxZoom: 12 })
    }

    setRouteLoading(false)
  }

  // Destroy map on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
    }
  }, [])

  return (
    <div
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden cursor-pointer select-none transition-colors hover:border-zinc-300 dark:hover:border-zinc-700"
      onClick={handleCardClick}
    >
      {/* ─── Collapsed header — always visible ─────────────────────────── */}
      <div className="px-5 pt-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-medium">
            Route
          </span>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
            <MapIcon size={12} />
            {isExpanded ? "Close map" : "View map"}
          </span>
        </div>

        {/* Origin → Destination */}
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center pt-[9px] flex-shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-900" />
            <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-700 my-1" />
            <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-700 my-1" />
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-100 dark:ring-red-900" />
          </div>
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{origin.name}</p>
              {origin.sub && <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">{origin.sub}</p>}
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{destination.name}</p>
              {destination.sub && <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">{destination.sub}</p>}
            </div>
          </div>
        </div>

        {/* Stats pills */}
        <div className="flex items-center gap-2 mt-4">
          <StatPill icon="route" value={`${distanceKm}`} unit="km" />
          <StatPill icon="clock" value={`~${durationMin}`} unit="min" />
          {surgeMultiplier && surgeMultiplier > 1 && (
            <div className="ml-auto flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[11px] font-medium px-2.5 py-1.5 rounded-lg">
              🔥 {surgeMultiplier}x surge
            </div>
          )}
        </div>
      </div>

      {/* ─── Expanded map panel ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="overflow-hidden border-t border-zinc-100 dark:border-zinc-800"
          >
            {/* Map wrapper — stopPropagation so clicking inside doesn't collapse card */}
            <div
              className="relative"
              style={{ height: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Leaflet target div */}
              <div ref={mapRef} className="absolute inset-0" />

              {/* Loading overlay */}
              <AnimatePresence>
                {routeLoading && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-zinc-50/90 dark:bg-zinc-900/90 backdrop-blur-sm"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-emerald-200 border-t-emerald-500 animate-spin" />
                      <p className="text-[12px] text-zinc-500 dark:text-zinc-400 font-medium">
                        Fetching real route…
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                <ChevronUpIcon />
                Click to collapse
              </span>
              <div className="flex items-center gap-2 text-[12px]">
                <span className="font-medium text-zinc-800 dark:text-zinc-200">{distanceKm} km</span>
                <span className="text-zinc-300 dark:text-zinc-600">·</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">~{durationMin} min</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */

function StatPill({ icon, value, unit }: { icon: string; value: string; unit: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg px-3 py-1.5">
      {icon === "route" ? <RouteIcon /> : <ClockIcon />}
      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{value}</span>
      <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{unit}</span>
    </div>
  )
}

function MapIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  )
}

function ChevronUpIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
}

function RouteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
      <circle cx="18" cy="5" r="3" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
