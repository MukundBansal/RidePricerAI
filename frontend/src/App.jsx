import { useState, useEffect, useRef } from 'react'
import AuroraBackground from './components/AuroraBackground'
import Navbar from './components/Navbar'
import PredictorPanel from './components/PredictorPanel'
import ResultPanel from './components/ResultPanel'
import MetricsBar from './components/MetricsBar'
import SimulationChart from './components/SimulationChart'
import { predictPrice, getMetrics, getSimulation } from './api'

export default function App() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [metrics, setMetrics] = useState(null)
  const [simulation, setSimulation] = useState(null)
  const [formData, setFormData] = useState({
    pickup_location: '',
    dropoff_location: '',
    cab_type: 'Uber Go',
  })

  useEffect(() => {
    getMetrics().then(setMetrics).catch(() => {})
    getSimulation().then(setSimulation).catch(() => {})
  }, [])

  const handlePredict = async () => {
    if (!formData.pickup_location || !formData.dropoff_location) return
    setLoading(true)
    setResult(null)
    try {
      const data = await predictPrice(formData)
      setResult(data)
    } catch (e) {
      alert('Prediction failed. Make sure backend is running on port 8000.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans">
      <AuroraBackground />
      <div className="relative z-10">
        <Navbar metrics={metrics} />
        <MetricsBar metrics={metrics} />
        <main className="max-w-6xl mx-auto px-4 py-10 space-y-8">
          <div className="text-center space-y-3 py-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-white/50 tracking-widest uppercase mb-2">
              AI-Powered Dynamic Pricing
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight leading-none">
              Ride<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Pricer</span> AI
            </h1>
            <p className="text-white/40 text-lg max-w-xl mx-auto">
              Real-time surge pricing powered by XGBoost, live routing & demand economics
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
              <PredictorPanel
                formData={formData}
                setFormData={setFormData}
                onPredict={handlePredict}
                loading={loading}
              />
            </div>
            <div className="lg:col-span-3">
              <ResultPanel result={result} loading={loading} formData={formData} />
            </div>
          </div>

          {simulation && <SimulationChart data={simulation} />}
        </main>
      </div>
    </div>
  )
}
