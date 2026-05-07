import { useState, useEffect, useRef } from 'react'
import MountainVistaParallax from './components/ui/mountain-vista-bg'
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
    getMetrics().then(setMetrics).catch(() => { })
    getSimulation().then(setSimulation).catch(() => { })
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
    <div className="relative min-h-screen overflow-x-hidden font-sans text-slate-900 bg-slate-50">
      
      <div className="relative w-full h-[80vh] sm:h-screen">
        <MountainVistaParallax 
          title={
            <>
              Ride<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-cyan-600">Pricer</span> AI
            </>
          } 
          subtitle="Real-time surge pricing powered by XGBoost, live routing & demand economics"
        />
      </div>

      <div className="relative z-10 bg-slate-50 min-h-screen pb-20">
        <Navbar metrics={metrics} />
        <MetricsBar metrics={metrics} />
        <main className="max-w-6xl mx-auto px-4 py-10 space-y-8">
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
