"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"

interface Factor {
  feature: string
  display_name: string
  value: number
  value_label: string
  impact: number
  impact_pct: number
}

interface ExplainResponse {
  predicted_price: number
  base_price: number
  surge_added: number
  headline: string
  factors: Factor[]
  top_reasons: string[]
  savings_from: string[]
}

interface ExplainRequestPayload {
  distance_km: number
  duration_mins: number
  hour: number
  riders: number
  drivers: number
  cab_type: string
  surge_multiplier: number
  location_category?: string
  loyalty_status?: string
  average_rating?: number
  past_rides?: number
}

interface PriceExplainerProps {
  requestPayload: ExplainRequestPayload | null
  onExplained?: (data: ExplainResponse) => void
}

export function PriceExplainer({ requestPayload, onExplained }: PriceExplainerProps) {
  const [data, setData] = useState<ExplainResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!requestPayload) return
    fetchExplanation()
  }, [requestPayload])

  const fetchExplanation = async () => {
    if (!requestPayload) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      })
      if (!res.ok) throw new Error("Failed to fetch explanation")
      const json: ExplainResponse = await res.json()
      setData(json)
      onExplained?.(json)
    } catch (e) {
      setError("Could not load explanation")
    } finally {
      setLoading(false)
    }
  }

  const maxImpact = data ? Math.max(...data.factors.map((f) => Math.abs(f.impact))) : 1

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>

      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <span className="text-[13px] font-semibold text-gray-800">Why this price?</span>
        </div>
        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">SHAP Explainability</span>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        <AnimatePresence mode="wait">

          {/* Loading */}
          {loading && (
            <motion.div key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-7 h-7 rounded-full border-2 border-violet-100 border-t-violet-500 animate-spin" />
              <p className="text-[12px] text-gray-400">Calculating feature contributions…</p>
            </motion.div>
          )}

          {/* Error */}
          {error && !loading && (
            <motion.div key="error"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="py-6 text-center">
              <p className="text-[12px] text-red-400">{error}</p>
            </motion.div>
          )}

          {/* Empty state */}
          {!loading && !error && !data && (
            <motion.div key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="py-8 text-center">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <p className="text-[12px] text-gray-400">Get a price first to see the explanation</p>
            </motion.div>
          )}

          {/* Explanation */}
          {!loading && !error && data && (
            <motion.div key="data"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}>

              {/* Headline */}
              <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 mb-4">
                <p className="text-[12.5px] text-violet-800 leading-relaxed">{data.headline}</p>
              </div>

              {/* Base → Surge → Final breakdown */}
              <div className="flex items-center gap-2 mb-4 bg-gray-50 rounded-xl px-4 py-2.5">
                <div className="text-center">
                  <p className="text-[11px] text-gray-400 mb-0.5">Base fare</p>
                  <p className="text-[14px] font-semibold text-gray-700">₹{data.base_price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="flex-1 flex items-center gap-1 px-2">
                  <div className="flex-1 h-px bg-gray-200" />
                  <div className="text-[11px] font-medium text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                    {data.surge_added >= 0 ? "+" : ""}₹{data.surge_added.toLocaleString("en-IN", { maximumFractionDigits: 0 })} surge
                  </div>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div className="text-center">
                  <p className="text-[11px] text-gray-400 mb-0.5">Final price</p>
                  <p className="text-[14px] font-semibold text-gray-900">₹{data.predicted_price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                </div>
              </div>

              {/* Feature impact bars */}
              <div className="space-y-2.5">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium mb-3">Feature contributions</p>
                {data.factors.map((factor, i) => {
                  const isPositive = factor.impact >= 0
                  const barWidth = Math.abs(factor.impact) / maxImpact * 100

                  return (
                    <motion.div key={factor.feature}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}>

                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isPositive ? "bg-red-400" : "bg-green-500"}`} />
                          <span className="text-[12px] text-gray-700 font-medium">{factor.display_name}</span>
                          <span className="text-[11px] text-gray-400">{factor.value_label}</span>
                        </div>
                        <span className={`text-[12px] font-semibold tabular-nums ${isPositive ? "text-red-500" : "text-green-600"}`}>
                          {isPositive ? "+" : ""}₹{Math.abs(factor.impact).toFixed(0)}
                        </span>
                      </div>

                      {/* Bar */}
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${isPositive ? "bg-red-400" : "bg-green-500"}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${barWidth}%` }}
                          transition={{ duration: 0.5, delay: i * 0.06, ease: "easeOut" }}
                        />
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-[11px] text-gray-400">Increases price</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-[11px] text-gray-400">Lowers price</span>
                </div>
                <span className="ml-auto text-[10px] text-gray-300">Powered by SHAP</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
