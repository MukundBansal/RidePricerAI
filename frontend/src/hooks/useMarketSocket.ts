import { useEffect, useRef, useState, useCallback } from "react"

export interface MarketState {
  riders:              number
  drivers:             number
  demand_supply_ratio: number
  surge_multiplier:    number
  demand_level:        "High" | "Moderate" | "Normal"
  time_category:       string
  is_peak:             boolean
  timestamp:           string
  // Populated when a /predict fires
  final_price_inr?:    number
  weather_condition?:  string
  weather_boost?:      number
  prediction_id?:      string
}

interface UseMarketSocketOptions {
  url?: string
  /** How often to send a keepalive ping (ms). Default: 20s */
  pingInterval?: number
  /** Auto-reconnect delay on drop (ms). Default: 3s */
  reconnectDelay?: number
}

export function useMarketSocket({
  url = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws/market",
  pingInterval = 20_000,
  reconnectDelay = 3_000,
}: UseMarketSocketOptions = {}) {
  const [market, setMarket]       = useState<MarketState | null>(null)
  const [connected, setConnected] = useState(false)
  const [lastTick, setLastTick]   = useState<Date | null>(null)

  const wsRef        = useRef<WebSocket | null>(null)
  const pingRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const unmounted    = useRef(false)

  const clearTimers = () => {
    if (pingRef.current)      clearInterval(pingRef.current)
    if (reconnectRef.current) clearTimeout(reconnectRef.current)
  }

  const connect = useCallback(() => {
    if (unmounted.current) return

    try {
      console.log("Connecting to WebSocket:", url);
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        console.log("✅ WebSocket Connected to Hugging Face!");
        if (unmounted.current) { ws.close(); return }
        setConnected(true)

        // Heartbeat ping so server doesn't timeout the connection
        pingRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send("ping")
        }, pingInterval)
      }

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data)
          if (data.type === "ping") return   // server keepalive — ignore
          if (data.type === "market_update" || data.type === "price_update") {
            setMarket((prev) => ({ ...prev, ...data }))
            setLastTick(new Date())
          }
        } catch {
          // malformed message — ignore
        }
      }

      ws.onclose = () => {
        if (unmounted.current) return
        setConnected(false)
        clearTimers()
        // Auto-reconnect
        reconnectRef.current = setTimeout(() => connect(), reconnectDelay)
      }

      ws.onerror = (err) => {
        console.error("❌ WebSocket Error:", err);
        ws.close()   // triggers onclose → reconnect
      }
    } catch {
      // WebSocket constructor failed (bad URL, etc.) — retry
      reconnectRef.current = setTimeout(() => connect(), reconnectDelay)
    }
  }, [url, pingInterval, reconnectDelay])

  useEffect(() => {
    unmounted.current = false
    connect()
    return () => {
      unmounted.current = true
      clearTimers()
      wsRef.current?.close()
    }
  }, [connect])

  return { market, connected, lastTick }
}
