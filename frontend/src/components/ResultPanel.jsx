import { useEffect, useState } from 'react'

function AnimatedNumber({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = 0
    const end = value
    const step = end / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setDisplay(end); clearInterval(timer) }
      else setDisplay(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [value])
  return display.toLocaleString()
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`rounded-xl border p-3 space-y-1 ${accent}`}>
      <div className="text-white/30 text-xs">{label}</div>
      <div className="text-white font-bold text-lg">{value}</div>
      {sub && <div className="text-white/20 text-xs">{sub}</div>}
    </div>
  )
}

export default function ResultPanel({ result, loading, formData }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl h-full min-h-[400px] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
        <div className="text-white/30 text-sm">Fetching route & calculating surge...</div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl h-full min-h-[400px] flex flex-col items-center justify-center gap-6 p-8">
        <div className="text-6xl opacity-20">⚡</div>
        <div className="text-center space-y-2">
          <div className="text-white/50 font-medium">Enter trip details to get started</div>
          <div className="text-white/20 text-sm max-w-xs">AI will calculate real-time surge pricing based on demand, supply, distance & time</div>
        </div>
        <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
          {[
            { icon: '🧠', label: 'XGBoost ML' },
            { icon: '📍', label: 'Live Routing' },
            { icon: '📊', label: 'Surge Math' },
          ].map(item => (
            <div key={item.label} className="rounded-xl border border-white/5 bg-white/3 p-3 text-center">
              <div className="text-xl mb-1">{item.icon}</div>
              <div className="text-white/30 text-xs">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const d = result.data
  const trip = d.trip_details
  const isHigh = d.demand_level === 'High'
  const isMod = d.demand_level === 'Moderate'

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 space-y-5">
      {/* Hero price */}
      <div className="rounded-xl border border-white/8 bg-gradient-to-br from-violet-500/10 to-cyan-500/5 p-5 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent pointer-events-none" />
        <div className="text-white/30 text-xs uppercase tracking-widest mb-1">AI Optimized Fare</div>
        <div className="text-5xl font-black text-white">
          ₹<AnimatedNumber value={d.final_price_inr} />
        </div>
        <div className="flex items-center justify-center gap-3 mt-2 text-sm">
          <span className="text-white/40">Base: ₹{d.base_fare_inr}</span>
          <span className="text-white/20">|</span>
          <span className={d.surge_fee_inr > 0 ? 'text-amber-400' : 'text-emerald-400'}>
            Surge: {d.surge_fee_inr > 0 ? `+₹${d.surge_fee_inr}` : '₹0'}
          </span>
        </div>
        <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-medium ${
          isHigh ? 'bg-red-500/15 text-red-300 border border-red-500/20' :
          isMod ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20' :
          'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isHigh ? 'bg-red-400' : isMod ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`} />
          {d.demand_level} Demand · {trip.surge_multiplier}x Surge
        </div>
      </div>

      {/* Trip stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Distance"
          value={`${trip.distance_km} km`}
          sub={`~${trip.duration_mins} min`}
          accent="border-white/8 bg-white/3"
        />
        <StatCard
          label="Market"
          value={`${trip.active_riders} riders`}
          sub={`${trip.active_drivers} drivers available`}
          accent="border-white/8 bg-white/3"
        />
        <StatCard
          label="Time"
          value={trip.time_category}
          sub={`Hour: ${new Date().getHours()}:00`}
          accent="border-white/8 bg-white/3"
        />
        <StatCard
          label="Revenue Lift"
          value={`+${d.revenue_lift_percentage}%`}
          sub="vs flat-rate model"
          accent={d.revenue_lift_percentage > 0 ? "border-emerald-500/20 bg-emerald-500/5" : "border-white/8 bg-white/3"}
        />
      </div>

      {/* Route info */}
      <div className="rounded-xl border border-white/8 bg-white/3 p-3 space-y-2">
        <div className="text-white/30 text-xs uppercase tracking-wider">Route</div>
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1 mt-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <div className="w-px h-6 bg-white/10" />
            <div className="w-2 h-2 rounded-full bg-violet-400" />
          </div>
          <div className="space-y-2 flex-1 min-w-0">
            <div className="text-white/70 text-xs truncate">{formData.pickup_location || '—'}</div>
            <div className="text-white/70 text-xs truncate">{formData.dropoff_location || '—'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
