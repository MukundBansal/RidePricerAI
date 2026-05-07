import { useState } from 'react'

const CAB_COLORS = {
  'Uber Go': '#8b5cf6',
  'Ola Mini': '#06b6d4',
  'Uber Auto': '#10b981',
  'Rapido Bike': '#f59e0b',
  'Ola Prime SUV': '#f97316',
  'Uber Premium': '#ef4444',
}

export default function SimulationChart({ data }) {
  const [selected, setSelected] = useState('Uber Go')
  if (!data?.scenarios) return null

  const cabs = [...new Set(data.scenarios.map(s => s.cab_type))]
  const filtered = data.scenarios.filter(s => s.cab_type === selected)
  const maxPrice = Math.max(...filtered.map(s => s.price))

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-100 to-cyan-100 border border-violet-200 flex items-center justify-center text-sm">📊</div>
          <div>
            <h3 className="text-slate-900 font-semibold text-sm">Price Simulation</h3>
            <p className="text-slate-500 text-xs">15km reference trip across time of day</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {cabs.map(cab => (
            <button
              key={cab}
              onClick={() => setSelected(cab)}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all border ${
                selected === cab
                  ? 'border-slate-300/20 bg-slate-100 text-slate-900'
                  : 'border-slate-200 bg-slate-50 text-slate-900/30 hover:text-slate-600'
              }`}
              style={selected === cab ? { borderColor: CAB_COLORS[cab] + '50', color: CAB_COLORS[cab] } : {}}
            >
              {cab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-end gap-3 h-32">
        {filtered.map((s, i) => {
          const pct = (s.price / maxPrice) * 100
          const color = CAB_COLORS[s.cab_type] || '#8b5cf6'
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="text-slate-500 text-xs group-hover:text-slate-900 transition-colors">₹{s.price}</div>
              <div
                className="w-full rounded-t-lg transition-all duration-500 group-hover:opacity-100 opacity-70"
                style={{
                  height: `${pct}%`,
                  background: `linear-gradient(to top, ${color}40, ${color}90)`,
                  border: `1px solid ${color}40`,
                }}
              />
              <div className="text-slate-900/25 text-xs">{s.time_label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
