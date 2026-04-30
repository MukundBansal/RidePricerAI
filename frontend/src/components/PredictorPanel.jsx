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
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 space-y-5">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center text-sm">🗺️</div>
        <h2 className="text-white font-semibold">Trip Details</h2>
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
          <div className="flex-1 h-px bg-white/5" />
          <div className="w-6 h-6 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/20 text-xs">↕</div>
          <div className="flex-1 h-px bg-white/5" />
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
        <label className="text-white/30 text-xs uppercase tracking-wider">Service Type</label>
        <div className="grid grid-cols-2 gap-2">
          {CAB_TYPES.map(cab => (
            <button
              key={cab.id}
              onClick={() => update('cab_type', cab.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                formData.cab_type === cab.id
                  ? 'border-violet-500/60 bg-violet-500/15 text-white'
                  : 'border-white/8 bg-white/3 text-white/50 hover:bg-white/6 hover:text-white/80'
              }`}
            >
              <span className="text-base">{cab.icon}</span>
              <div className="text-left">
                <div className="text-xs font-medium leading-tight">{cab.label}</div>
                <div className={`text-[10px] leading-tight ${
                  cab.tier === 'Premium' ? 'text-amber-400/60' : 
                  cab.tier === 'Bike' ? 'text-emerald-400/60' : 'text-white/25'
                }`}>{cab.tier}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Time Simulator */}
      <div className="space-y-2">
        <label className="text-white/30 text-xs uppercase tracking-wider">Time Simulator</label>
        <div className="flex flex-wrap gap-2">
          {HOURS.map(h => (
            <button
              key={h.value}
              onClick={() => update('simulated_hour', h.value)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all border ${
                formData.simulated_hour === h.value
                  ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                  : 'border-white/8 bg-white/3 text-white/40 hover:text-white/70'
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
            ? 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
            : 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:from-violet-500 hover:to-cyan-500 shadow-lg shadow-violet-500/20'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            Calculating...
          </span>
        ) : (
          '⚡ Get AI Price'
        )}
      </button>
    </div>
  )
}
