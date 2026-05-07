"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"

interface ModelResult {
  model: string
  r2: number
  mae_inr: number
  rmse_inr: number
  cv_r2: number
  cv_std: number
  train_time_s: number
  is_production: boolean
}

interface ComparisonData {
  generated_at: string
  train_samples: number
  test_samples: number
  feature_count: number
  models: ModelResult[]
}

const MODEL_COLORS: Record<string, { bg: string; border: string; text: string; bar: string }> = {
  "XGBoost":          { bg: "#EFF6FF", border: "#BFDBFE", text: "#1E40AF", bar: "#3B82F6" },
  "LightGBM":         { bg: "#F0FDF4", border: "#BBF7D0", text: "#166534", bar: "#22C55E" },
  "Random Forest":    { bg: "#FAF5FF", border: "#E9D5FF", text: "#6B21A8", bar: "#A855F7" },
  "Gradient Boosting":{ bg: "#FFF7ED", border: "#FED7AA", text: "#9A3412", bar: "#F97316" },
}

const MODEL_ICONS: Record<string, string> = {
  "XGBoost":           "⚡",
  "LightGBM":          "🌿",
  "Random Forest":     "🌲",
  "Gradient Boosting": "🚀",
}

export function ModelComparisonTable() {
  const [data, setData]       = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [sortBy, setSortBy]   = useState<keyof ModelResult>("r2")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    fetch("http://localhost:8000/model-comparison")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => { setError("Could not load model data"); setLoading(false) })
  }, [])

  const handleSort = (col: keyof ModelResult) => {
    if (col === sortBy) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortBy(col); setSortDir("desc") }
  }

  const sorted = data
    ? [...data.models].sort((a, b) => {
        const av = a[sortBy] as number
        const bv = b[sortBy] as number
        // Lower is better for MAE/RMSE/train_time
        const lowerBetter = ["mae_inr", "rmse_inr", "train_time_s", "cv_std"].includes(sortBy as string)
        const cmp = lowerBetter ? av - bv : bv - av
        return sortDir === "asc" ? -cmp : cmp
      })
    : []

  // Best value per metric (for green highlights)
  const best = data ? {
    r2:           Math.max(...data.models.map((m) => m.r2)),
    mae_inr:      Math.min(...data.models.map((m) => m.mae_inr)),
    rmse_inr:     Math.min(...data.models.map((m) => m.rmse_inr)),
    cv_r2:        Math.max(...data.models.map((m) => m.cv_r2)),
    train_time_s: Math.min(...data.models.map((m) => m.train_time_s)),
  } : null

  const SortIcon = ({ col }: { col: keyof ModelResult }) => (
    <span className="ml-1 text-[10px] opacity-40">
      {sortBy === col ? (sortDir === "desc" ? "↓" : "↑") : "↕"}
    </span>
  )

  const ColHeader = ({ col, label }: { col: keyof ModelResult; label: string }) => (
    <th
      className="text-right text-[11px] font-medium text-gray-400 uppercase tracking-wider pb-3 cursor-pointer hover:text-gray-600 select-none whitespace-nowrap pr-4"
      onClick={() => handleSort(col)}
    >
      {label}<SortIcon col={col} />
    </th>
  )

  const isBest = (model: ModelResult, col: keyof ModelResult) =>
    best && col in best && (model[col] as number) === (best as any)[col]

  const Cell = ({
    value, model, col, fmt,
  }: { value: number; model: ModelResult; col: keyof ModelResult; fmt: (v: number) => string }) => (
    <td className="text-right pr-4 py-3">
      <span
        className="text-[13px] font-semibold tabular-nums px-2 py-0.5 rounded-md"
        style={
          isBest(model, col)
            ? { background: "#DCFCE7", color: "#166534" }
            : { color: "#374151" }
        }
      >
        {fmt(value)}
      </span>
    </td>
  )

  return (
    <div
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-gray-50">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </div>
              <h3 className="text-[14px] font-semibold text-gray-800">Model Comparison</h3>
            </div>
            <p className="text-[11px] text-gray-400">
              XGBoost vs LightGBM vs Random Forest vs Gradient Boosting — same features, same data split
            </p>
          </div>

          {/* Production badge */}
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-medium px-2.5 py-1.5 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
            XGBoost in production
          </div>
        </div>

        {/* Dataset stats */}
        {data && (
          <div className="flex items-center gap-4 mt-3">
            {[
              ["Training samples", data.train_samples.toLocaleString()],
              ["Test samples", data.test_samples.toLocaleString()],
              ["Features", data.feature_count.toString()],
            ].map(([label, val]) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-400">{label}:</span>
                <span className="text-[11px] font-semibold text-gray-600">{val}</span>
              </div>
            ))}
            <span className="text-[10px] text-gray-300 ml-auto">
              Click column headers to sort · Green = best
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="px-2 overflow-x-auto">
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center gap-3">
              <div className="w-7 h-7 rounded-full border-2 border-blue-100 border-t-blue-500 animate-spin" />
              <p className="text-[12px] text-gray-400">Loading model benchmarks…</p>
            </motion.div>
          )}

          {error && !loading && (
            <motion.div key="error"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="py-8 text-center">
              <p className="text-[12px] text-red-400 mb-1">{error}</p>
              <p className="text-[11px] text-gray-400">Run <code className="bg-gray-100 px-1 py-0.5 rounded">python3 train_compare.py</code> in your backend folder first.</p>
            </motion.div>
          )}

          {!loading && !error && data && (
            <motion.div key="table"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="min-w-[800px]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider pb-3 pl-4">Model</th>
                    <ColHeader col="r2" label="R² Score" />
                    <ColHeader col="mae_inr" label="MAE (₹)" />
                    <ColHeader col="rmse_inr" label="RMSE (₹)" />
                    <ColHeader col="cv_r2" label="CV R²" />
                    <ColHeader col="cv_std" label="CV Std" />
                    <ColHeader col="train_time_s" label="Train time" />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((model, i) => {
                    const colors = MODEL_COLORS[model.model] ?? MODEL_COLORS["XGBoost"]
                    const icon   = MODEL_ICONS[model.model] ?? "🤖"
                    return (
                      <motion.tr
                        key={model.model}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                      >
                        {/* Model name */}
                        <td className="pl-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                              style={{ background: colors.bg, border: `0.5px solid ${colors.border}` }}
                            >
                              {icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-semibold text-gray-800">{model.model}</span>
                                {model.is_production && (
                                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                                    style={{ background: colors.bg, color: colors.text, border: `0.5px solid ${colors.border}` }}>
                                    LIVE
                                  </span>
                                )}
                              </div>
                              {/* Mini R² bar */}
                              <div className="w-20 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{ background: colors.bar }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${model.r2 * 100}%` }}
                                  transition={{ delay: i * 0.06 + 0.2, duration: 0.5, ease: "easeOut" }}
                                />
                              </div>
                            </div>
                          </div>
                        </td>

                        <Cell value={model.r2}          model={model} col="r2"           fmt={(v) => `${(v * 100).toFixed(2)}%`} />
                        <Cell value={model.mae_inr}     model={model} col="mae_inr"      fmt={(v) => `₹${v.toFixed(0)}`} />
                        <Cell value={model.rmse_inr}    model={model} col="rmse_inr"     fmt={(v) => `₹${v.toFixed(0)}`} />
                        <Cell value={model.cv_r2}       model={model} col="cv_r2"        fmt={(v) => `${(v * 100).toFixed(2)}%`} />
                        <Cell value={model.cv_std}      model={model} col="cv_std"       fmt={(v) => `±${v.toFixed(4)}`} />
                        <Cell value={model.train_time_s} model={model} col="train_time_s" fmt={(v) => `${v}s`} />
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Footer note */}
              <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between">
                <p className="text-[10px] text-gray-400">
                  All models trained on identical data split · 5-fold cross-validation · Green cells = best per metric
                </p>
                <p className="text-[10px] text-gray-300">
                  Generated {new Date(data.generated_at).toLocaleDateString()}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
