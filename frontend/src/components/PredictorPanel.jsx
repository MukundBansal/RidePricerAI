import LocationInput from './LocationInput'

const CAB_TYPES = [
  { id: 'Uber Go', label: 'Uber Go', icon: '🚗', tier: 'Economy' },
  { id: 'Ola Mini', label: 'Ola Mini', icon: '🚙', tier: 'Economy' },
  { id: 'Uber Auto', label: 'Uber Auto', icon: '🛺', tier: 'Economy' },
  { id: 'Rapido Bike', label: 'Rapido Bike', icon: '🏍️', tier: 'Bike' },
  { id: 'Ola Prime SUV', label: 'Ola Prime SUV', icon: '🚐', tier: 'Premium' },
  { id: 'Uber Premium', label: 'Uber Premium', icon: '🚘', tier: 'Premium' },
]

const HOURS = [
  { value: null, label: 'Live Time' },
  { value: 8, label: '8 AM (Peak)' },
  { value: 14, label: '2 PM (Off-Peak)' },
  { value: 18, label: '6 PM (Peak)' },
  { value: 23, label: '11 PM (Night)' },
]

export default function PredictorPanel({ formData, setFormData, onPredict, loading }) {
  const update = (key, val) => setFormData(prev => ({ ...prev, [key]: val }))

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-5">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-100 to-cyan-100 border border-violet-200 flex items-center justify-center text-sm">🗺️</div>
        <h2 className="text-slate-900 font-semibold">Trip Details</h2>
      </div>

      {/* Locations */}
      <div className="space-y-3">
        <LocationInput
          value={formData.pickup_location}
          onChange={(val) => update('pickup_location', val)}
          placeholder="Pickup location..."
          icon="📍"
        />
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-slate-100" />
          <div className="w-6 h-6 rounded-full border border-slate-300/10 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">↕</div>
          <div className="flex-1 h-px bg-slate-100" />
        </div>
        <LocationInput
          value={formData.dropoff_location}
          onChange={(val) => update('dropoff_location', val)}
          placeholder="Drop-off location..."
          icon="🏁"
        />
      </div>

      {/* Cab Type */}
      <div className="space-y-2">
        <label className="text-slate-500 text-xs uppercase tracking-wider">Service Type</label>
        <div className="grid grid-cols-2 gap-2">
          {CAB_TYPES.map(cab => (
            <button
              key={cab.id}
              onClick={() => update('cab_type', cab.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                formData.cab_type === cab.id
                  ? 'border-violet-500/60 bg-violet-500/15 text-slate-900'
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-white/6 hover:text-slate-900/80'
              }`}
            >
              <span className="text-base">{cab.icon}</span>
              <div className="text-left">
                <div className="text-xs font-medium leading-tight">{cab.label}</div>
                <div className={`text-[10px] leading-tight ${
                  cab.tier === 'Premium' ? 'text-amber-400/60' : 
                  cab.tier === 'Bike' ? 'text-emerald-400/60' : 'text-slate-900/25'
                }`}>{cab.tier}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Time Simulator */}
      <div className="space-y-2">
        <label className="text-slate-500 text-xs uppercase tracking-wider">Time Simulator</label>
        <div className="flex flex-wrap gap-2">
          {HOURS.map(h => (
            <button
              key={h.value}
              onClick={() => update('simulated_hour', h.value)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all border ${
                formData.simulated_hour === h.value
                  ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-700'
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* Predict Button */}
      <button
        onClick={onPredict}
        disabled={loading || !formData.pickup_location || !formData.dropoff_location}
        className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all relative overflow-hidden ${
          loading || !formData.pickup_location || !formData.dropoff_location
            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            : 'bg-gradient-to-r from-violet-600 to-cyan-600 text-slate-900 hover:from-violet-500 hover:to-cyan-500 shadow-lg shadow-violet-500/20'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-slate-300/20 border-t-white rounded-full animate-spin" />
            Calculating...
          </span>
        ) : (
          '⚡ Get AI Price'
        )}
      </button>
    </div>
  )
}
