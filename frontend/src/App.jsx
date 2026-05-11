import { useState, useEffect } from 'react'
import MountainVistaParallax from './components/ui/mountain-vista-bg'
import { predictPrice, getMetrics, getSimulation, explainPrice } from './api'
import { useMarketSocket } from './hooks/useMarketSocket'

import { Navbar, ModelStatsBar, PageGrid, LeftColumn, RightColumn } from "./components/ui/PageLayout"
import { TripInputPanel } from "./components/ui/TripInputPanel"
import { ResultsLayout, SectionDivider } from "./components/ui/ResultsLayout"
import { FareCard } from "./components/ui/FareCard"
import { StatsGrid } from "./components/ui/StatsGrid"
import { SHAPChart } from "./components/ui/SHAPChart"
import { PriceSimChart } from "./components/ui/PriceSimChart"
import { RouteMapCard } from "./components/ui/RouteMapCard"
import { WeatherBadge } from "./components/ui/WeatherBadge"
import { AIInsightsPanel } from "./components/ui/AIInsightsPanel"
import { ModelComparisonTable } from "./components/ui/ModelComparisonTable"

export default function App() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [metrics, setMetrics] = useState(null)
  const [simulation, setSimulation] = useState(null)
  
  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')
  const [cabType, setCabType] = useState('Uber Go')
  const [simulatedHour, setSimulatedHour] = useState(null)

  const [explainData, setExplainData] = useState(null)
  const [isExplaining, setIsExplaining] = useState(false)

  // Use the market socket
  const { market, connected: wsConnected, lastTick } = useMarketSocket({ url: "ws://localhost:8000/ws/market" })
  
  // Track flash on each new tick
  const [wsFlash, setWsFlash] = useState(false)
  const [riderHistory, setRiderHistory] = useState([])

  useEffect(() => {
    if (lastTick) {
      setWsFlash(true)
      const t = setTimeout(() => setWsFlash(false), 700)
      return () => clearTimeout(t)
    }
  }, [lastTick])

  useEffect(() => {
    if (market?.riders != null) {
      setRiderHistory(h => [...h.slice(-11), market.riders])
    }
  }, [market?.riders])

  useEffect(() => {
    getMetrics().then(setMetrics).catch(() => { })
    getSimulation().then(setSimulation).catch(() => { })
  }, [])

  const handlePredict = async () => {
    if (!pickup || !dropoff) return
    setLoading(true)
    setResult(null)
    setExplainData(null)
    setIsExplaining(true)
    try {
      const payload = {
        pickup_location: pickup,
        dropoff_location: dropoff,
        cab_type: cabType,
        simulated_hour: simulatedHour,
      }
      const data = await predictPrice(payload)
      setResult(data)

      // Fetch explain data
      if (data?.data?.trip_details) {
        const trip = data.data.trip_details
        const explainPayload = {
          pickup_location: pickup,
          dropoff_location: dropoff,
          cab_type: cabType,
          hour: simulatedHour !== null ? simulatedHour : new Date().getHours(),
          distance_km: trip.distance_km,
          duration_mins: trip.duration_mins,
          riders: trip.active_riders,
          drivers: trip.active_drivers,
          location_category: "Urban",
          loyalty_status: "Silver",
          average_rating: 4.5,
          past_rides: 10
        }
        explainPrice(explainPayload).then(exp => {
          setExplainData(exp)
        }).catch(() => {}).finally(() => setIsExplaining(false))
      } else {
        setIsExplaining(false)
      }
    } catch (e) {
      alert('Prediction failed. Make sure backend is running on port 8000.')
      setIsExplaining(false)
    } finally {
      setLoading(false)
    }
  }

  // Determine current stats based on WS state + result snapshot
  const currentRiders = market?.riders ?? result?.data?.trip_details?.active_riders ?? 0
  const currentDrivers = market?.drivers ?? result?.data?.trip_details?.active_drivers ?? 0
  const currentSurge = market?.surge_multiplier ?? result?.data?.trip_details?.surge_multiplier ?? 1
  const currentDemandLevel = market?.demand_level ?? result?.data?.demand_level ?? "Normal"
  const currentTimeCategory = market?.time_category ?? result?.data?.trip_details?.time_category ?? "—"

  return (
    <div style={{ minHeight: "100vh", background: "var(--rp-bg)" }}>
      <Navbar modelR2={97.8} />
      
      {/* Keeping the parallax background as an aesthetic element at the top */}
      <div className="relative w-full h-[calc(100vh-56px)]">
        <MountainVistaParallax 
          title={
            <>
              Ride<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-cyan-600">Pricer</span> AI
            </>
          } 
          subtitle="Real-time surge pricing powered by XGBoost, live routing & demand economics"
        />
      </div>

      <ModelStatsBar r2="97.76%" mae="32" rmse="55" samples="35,000" />

      <PageGrid>
        <LeftColumn>
          <TripInputPanel
            pickup={pickup}
            dropoff={dropoff}
            cabType={cabType}
            simulatedHour={simulatedHour}
            isLoading={loading}
            onPickupChange={setPickup}
            onDropoffChange={setDropoff}
            onCabChange={setCabType}
            onHourChange={setSimulatedHour}
            onSubmit={handlePredict}
          />
        </LeftColumn>

        <RightColumn>
          <ResultsLayout hasResult={!!result} isLoading={loading}>
            {/* 1. Fare — dominant, shown first */}
            <FareCard
              finalPrice={result?.data?.final_price_inr}
              basePrice={result?.data?.base_fare_inr}
              surgeAmount={result?.data?.surge_fee_inr}
              surgeMultiplier={result?.data?.trip_details?.surge_multiplier}
              demandLevel={result?.data?.demand_level}
              weatherLabel={result?.data?.weather?.label}
              weatherBoost={result?.data?.weather?.surge_boost}
              isLoading={loading}
            />

            {/* 2. Live market stats */}
            <StatsGrid
              riders={currentRiders}
              drivers={currentDrivers}
              surgeMultiplier={currentSurge}
              timeCategory={currentTimeCategory}
              distanceKm={result?.data?.trip_details?.distance_km}
              durationMin={result?.data?.trip_details?.duration_mins}
              revenueLift={result?.data?.revenue_lift_percentage}
              demandLevel={currentDemandLevel}
              riderHistory={riderHistory}
              wsConnected={wsConnected}
              flash={wsFlash}
            />

            {/* 3. Weather (only if available) */}
            {result?.data?.weather?.available && (
              <WeatherBadge weather={result.data.weather} variant="full" />
            )}

            {/* 4. Route map */}
            <RouteMapCard
              origin={{
                name: pickup,
                lat: result?.data?.trip_details?.pickup_lat,
                lng: result?.data?.trip_details?.pickup_lng,
              }}
              destination={{
                name: dropoff,
                lat: result?.data?.trip_details?.dropoff_lat,
                lng: result?.data?.trip_details?.dropoff_lng,
              }}
              distanceKm={result?.data?.trip_details?.distance_km}
              durationMin={result?.data?.trip_details?.duration_mins}
              surgeMultiplier={result?.data?.trip_details?.surge_multiplier}
              activeRiders={result?.data?.trip_details?.active_riders}
              activeDrivers={result?.data?.trip_details?.active_drivers}
            />

            {/* 5. AI Insights */}
            <AIInsightsPanel
              insights={result?.data?.insights ?? []}
              isLoading={loading}
            />

            {/* 6. SHAP explainability */}
            <SHAPChart
              factors={explainData?.factors ?? []}
              basePrice={explainData?.base_price ?? 0}
              finalPrice={explainData?.predicted_price ?? 0}
              surgeAdded={explainData?.surge_added ?? 0}
              headline={explainData?.headline ?? ""}
              isLoading={isExplaining}
            />

            <SectionDivider label="Analytics" />

            {/* 7. Price simulation */}
            <PriceSimChart
              scenarios={simulation?.scenarios ?? []}
              isLoading={loading || !simulation}
            />

            {/* 8. Model comparison */}
            <ModelComparisonTable />

          </ResultsLayout>
        </RightColumn>
      </PageGrid>
    </div>
  )
}
