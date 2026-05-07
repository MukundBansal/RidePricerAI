"use client"

import { motion, AnimatePresence } from "motion/react"

interface WeatherInfo {
  available: boolean
  condition: string
  description?: string
  emoji?: string
  label: string
  temp_celsius?: number
  humidity?: number
  wind_speed?: number
  rain_1h?: number
  surge_boost: number
  city?: string
}

interface WeatherBadgeProps {
  weather: WeatherInfo | null
  /** compact = small pill for the fare header area
   *  full    = expanded card for the results panel   */
  variant?: "compact" | "full"
}

export function WeatherBadge({ weather, variant = "compact" }: WeatherBadgeProps) {
  if (!weather || !weather.available) return null

  const hasBoost = weather.surge_boost > 0
  const boostPct = Math.round(weather.surge_boost * 100)

  // ── Compact pill (next to fare, surge badge area) ─────────────────────────
  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium"
        style={
          hasBoost
            ? { background: "#FEF3C7", borderColor: "#FCD34D", color: "#92400E" }
            : { background: "#F0FDF4", borderColor: "#86EFAC", color: "#166534" }
        }
      >
        <span>{weather.emoji}</span>
        <span>{weather.condition}</span>
        {hasBoost && (
          <span className="opacity-70">· +{boostPct}% surge</span>
        )}
      </motion.div>
    )
  }

  // ── Full card (in results panel below the fare) ───────────────────────────
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.35 }}
        className="bg-white border border-gray-100 rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
      >
        {/* Header row */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl leading-none">{weather.emoji}</span>
            <div>
              <p className="text-[13px] font-semibold text-gray-800 leading-tight">
                {weather.condition}
                {weather.city ? ` · ${weather.city}` : ""}
              </p>
              {weather.description && (
                <p className="text-[11px] text-gray-400 capitalize mt-0.5">
                  {weather.description}
                </p>
              )}
            </div>
          </div>

          {/* Surge boost badge */}
          {hasBoost ? (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              +{boostPct}% weather surge
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-[11px] font-medium px-2.5 py-1.5 rounded-lg">
              ✓ No weather impact
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-0 px-5 pb-4">
          {weather.temp_celsius !== undefined && (
            <WeatherStat
              icon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
                </svg>
              }
              value={`${weather.temp_celsius}°C`}
              label="Temp"
            />
          )}
          {weather.humidity !== undefined && (
            <WeatherStat
              icon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                </svg>
              }
              value={`${weather.humidity}%`}
              label="Humidity"
            />
          )}
          {weather.wind_speed !== undefined && (
            <WeatherStat
              icon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
                </svg>
              }
              value={`${weather.wind_speed} m/s`}
              label="Wind"
            />
          )}
          {weather.rain_1h !== undefined && weather.rain_1h > 0 && (
            <WeatherStat
              icon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/>
                  <line x1="12" y1="15" x2="12" y2="23"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>
                </svg>
              }
              value={`${weather.rain_1h} mm`}
              label="Rain/hr"
            />
          )}
        </div>

        {/* Explanation bar — only shown when surge is boosted */}
        {hasBoost && (
          <div className="mx-5 mb-4 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
            <p className="text-[11.5px] text-amber-800 leading-relaxed">
              <span className="font-semibold">{weather.emoji} {weather.condition}</span>
              {" "}is adding a <span className="font-semibold">+{boostPct}%</span> weather
              surge on top of demand pricing — fewer drivers operate during{" "}
              {weather.condition.toLowerCase()}, increasing wait times.
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

function WeatherStat({
  icon, value, label,
}: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 mr-4">
      {icon}
      <div>
        <p className="text-[12px] font-semibold text-gray-700 leading-tight">{value}</p>
        <p className="text-[10px] text-gray-400">{label}</p>
      </div>
    </div>
  )
}
