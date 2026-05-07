import { useState, useEffect, useRef } from 'react'

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'

export default function LocationInput({ value, onChange, placeholder, icon }) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef(null)
  const wrapRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = async (q) => {
    if (q.length < 3) { setSuggestions([]); return }
    setLoading(true)
    try {
      const res = await fetch(
        `${NOMINATIM}?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=in&addressdetails=1`,
        { headers: { 'User-Agent': 'RidePricerAI/2.0' } }
      )
      const data = await res.json()
      setSuggestions(data)
      setOpen(data.length > 0)
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    onChange(val) // update parent with typed value too
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(val), 400)
  }

  const handleSelect = (place) => {
  // Use short name instead of full display_name
  const parts = place.display_name.split(', ')
  const shortName = parts.slice(0, 3).join(', ')
  setQuery(place.display_name) // show full in input
  onChange(shortName)          // send short version to backend
  setSuggestions([])
  setOpen(false)
}

  const formatSuggestion = (place) => {
    const parts = place.display_name.split(', ')
    const main = parts.slice(0, 2).join(', ')
    const sub = parts.slice(2, 4).join(', ')
    return { main, sub }
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative flex items-center">
        <span className="absolute left-3 text-slate-900/30 text-sm">{icon}</span>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-3 bg-slate-100 border border-slate-300/10 rounded-xl text-slate-900 text-sm placeholder-white/20 focus:outline-none focus:border-violet-500/50 focus:bg-slate-100 transition-all"
        />
        {loading && (
          <span className="absolute right-3 w-3 h-3 border border-slate-300/30 border-t-white/80 rounded-full animate-spin" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-slate-300/10 rounded-xl overflow-hidden shadow-2xl">
          {suggestions.map((place, i) => {
            const { main, sub } = formatSuggestion(place)
            return (
              <button
                key={i}
                onClick={() => handleSelect(place)}
                className="w-full px-4 py-3 text-left hover:bg-slate-100 transition-colors border-b border-slate-200 last:border-0"
              >
                <div className="text-slate-900 text-sm font-medium truncate">{main}</div>
                <div className="text-slate-500 text-xs truncate mt-0.5">{sub}</div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
