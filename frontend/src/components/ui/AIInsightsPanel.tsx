"use client"

import { motion, AnimatePresence } from "motion/react"

interface Insight {
  id: string
  type: "warning" | "tip" | "info" | "positive"
  icon: string
  title: string
  body: string
  priority: number
}

interface AIInsightsPanelProps {
  insights: Insight[]
  isLoading?: boolean
}

const TYPE_STYLES: Record<string, { bg: string; border: string; title: string; dot: string }> = {
  warning:  { bg: "#FFFBEB", border: "#FCD34D", title: "#92400E", dot: "#F59E0B" },
  tip:      { bg: "#EFF6FF", border: "#93C5FD", title: "#1E40AF", dot: "#3B82F6" },
  info:     { bg: "#F8FAFC", border: "#E2E8F0", title: "#374151", dot: "#94A3B8" },
  positive: { bg: "#F0FDF4", border: "#86EFAC", title: "#166534", dot: "#22C55E" },
}

export function AIInsightsPanel({ insights, isLoading }: AIInsightsPanelProps) {
  return (
    <div
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a8 8 0 0 1 8 8c0 3-1.5 5.5-4 7l-1 3H9l-1-3C5.5 15.5 4 13 4 10a8 8 0 0 1 8-8z"/>
              <line x1="9" y1="21" x2="15" y2="21"/>
            </svg>
          </div>
          <span className="text-[13px] font-semibold text-gray-800">AI Insights</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
            Live
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        <AnimatePresence mode="wait">

          {/* Loading skeleton */}
          {isLoading && (
            <motion.div key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl p-3 mb-3 bg-gray-50 animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-200 flex-shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                      <div className="h-2.5 bg-gray-100 rounded w-full" />
                      <div className="h-2.5 bg-gray-100 rounded w-4/5" />
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Empty state */}
          {!isLoading && (!insights || insights.length === 0) && (
            <motion.div key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="py-8 text-center">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a8 8 0 0 1 8 8c0 3-1.5 5.5-4 7l-1 3H9l-1-3C5.5 15.5 4 13 4 10a8 8 0 0 1 8-8z"/>
                </svg>
              </div>
              <p className="text-[12px] text-gray-400">
                Get a price to see AI insights
              </p>
            </motion.div>
          )}

          {/* Insight cards */}
          {!isLoading && insights && insights.length > 0 && (
            <motion.div key="insights"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {insights.map((ins, i) => {
                const s = TYPE_STYLES[ins.type] ?? TYPE_STYLES.info
                return (
                  <motion.div
                    key={ins.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.3 }}
                    className="rounded-xl p-3 mb-3 last:mb-0"
                    style={{ background: s.bg, border: `0.5px solid ${s.border}` }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon bubble */}
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                        style={{ background: "white", border: `0.5px solid ${s.border}` }}
                      >
                        {ins.icon}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: s.dot }}
                          />
                          <p className="text-[12.5px] font-semibold leading-tight"
                            style={{ color: s.title }}>
                            {ins.title}
                          </p>
                        </div>
                        <p className="text-[11.5px] text-gray-500 leading-relaxed">
                          {ins.body}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}

              {/* Footer label */}
              <div className="flex items-center justify-end pt-1">
                <p className="text-[10px] text-gray-300">
                  Generated from live demand, weather &amp; route data
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
