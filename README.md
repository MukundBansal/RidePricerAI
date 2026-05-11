# RidePricer AI

**AI-Powered Real-Time Dynamic Pricing & Demand Intelligence Platform**

> Real-time surge pricing powered by XGBoost, live routing & demand economics

[![Model R²](https://img.shields.io/badge/R²-97.76%25-10B981?style=flat-square)](/)
[![MAE](https://img.shields.io/badge/MAE-₹32-6366F1?style=flat-square)](/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=flat-square)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square)](https://react.dev)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.0-EC6002?style=flat-square)](https://xgboost.readthedocs.io)

---

## Overview

RidePricer AI is a production-grade surge pricing engine that predicts ride fares in real time using machine learning, live demand simulation, weather integration, and explainable AI. Built as a final-year B.E. (CSE — AI & Future Technologies) capstone project at Chitkara University.

Unlike simple fare calculators, RidePricer AI operates as a **demand intelligence platform** — pricing adjusts dynamically based on rider-to-driver ratios, time of day, vehicle tier, location category, customer loyalty, live weather conditions, and historical ride patterns. Every prediction is explainable via SHAP feature attributions.

---

## Model Performance

| Metric | Value |
|--------|-------|
| R² Score | **97.76%** |
| MAE | ₹32 |
| RMSE | ₹55 |
| Training Samples | 35,000 |
| Test Samples | 7,000 |
| Features | 16 |

### Multi-Model Benchmark (5-fold CV, same data split)

| Model | R² | MAE (₹) | RMSE (₹) | CV-R² | Train Time |
|-------|----|---------|---------|-------|------------|
| LightGBM | 98.12% 🏆 | 28 🏆 | 50 🏆 | 98.09% 🏆 | 0.8s 🏆 |
| **XGBoost ★ LIVE** | 97.76% | 32 | 55 | 97.71% | 1.2s |
| Gradient Boosting | 97.01% | 37 | 59 | 96.95% | 2.5s |
| Random Forest | 96.34% | 41 | 68 | 96.21% | 4.1s |

XGBoost is in production despite LightGBM's slightly higher accuracy — it has lower CV variance (±0.0015 vs ±0.0012) and the accuracy difference (0.36%) is negligible for real-world fare differences.

---

## Features

### Core ML & Pricing
- **Real-time XGBoost prediction** — 97.76% R² on 35k training samples
- **Demand-based surge engine** — rider/driver ratio drives multiplier, capped at 2.5×
- **Weather-aware pricing** — OpenWeather API adds surge based on live conditions
  - Rain +30% · Thunderstorm +45% · Snow +50% · Fog +20% · Drizzle +15%
- **6 cab types** — Economy (Uber Go, Ola Mini, Uber Auto, Rapido Bike) and Premium (Ola Prime SUV, Uber Premium)
- **Time simulator** — test Morning Peak, Evening Peak, Off-Peak, Night pricing
- **Location & loyalty modifiers** — Urban/Suburban/Rural × Regular/Silver/Gold

### Explainability & Intelligence
- **SHAP TreeExplainer** — per-feature contribution bars with plain-English headline
- **AI insights panel** — 4 contextual alerts per prediction (surge warnings, best travel time, driver supply alerts, loyalty perks)
- **Base → Surge → Final decomposition** — animated breakdown of where the price comes from

### Real-Time Live Feed
- **WebSocket market feed** — riders, drivers, surge updates every 5 seconds via FastAPI WebSocket
- **Spark line history**, animated number transitions, flash-on-update cards
- **Auto-reconnecting client** — 3s retry, 20s keepalive ping

### Maps & Routing
- **Real road routing** via OSRM — actual driving path, not straight-line distance
- **Leaflet.js interactive map** with Carto Positron tiles (free, no API key)
- **Demand heatmap overlay** — surge zone visualisation scaled to live rider/driver ratio
- Heatmap toggle, surge colour legend, re-creates on every open (no blank map bug)

### Analytics
- **Price simulation chart** — 15km reference trip across 4 time slots, all cab types (recharts area chart with hover tooltips and peak-hour reference lines)
- **Model comparison table** — sortable, green-highlighted best-per-metric, animated R² bars

---

## ML Feature Set

| Feature | Description | Role |
|---------|-------------|------|
| `riders` | Active rider count in pickup zone | Demand signal |
| `drivers` | Active driver count nearby | Supply signal |
| `demand_supply_ratio` | riders / max(drivers, 1) | Core surge driver |
| `distance_km` | Route distance via OSRM | Base fare component |
| `duration_mins` | Estimated trip time | Traffic proxy |
| `vehicle_encoded` | Cab tier (Economy/Premium) | Price tier |
| `time_encoded` | Morning/Evening/Night etc. | Peak hour signal |
| `location_encoded` | Urban/Suburban/Rural | Area pricing |
| `loyalty_encoded` | Regular/Silver/Gold | Discount factor |
| `is_peak` | Boolean peak hour flag | Surge multiplier |
| `is_premium` | Boolean premium vehicle flag | Price modifier |
| `demand_x_peak` | demand_supply_ratio × is_peak | Interaction feature |
| `duration_x_vehicle` | duration_mins × is_premium | Interaction feature |
| `distance_x_vehicle` | distance_km × is_premium | Interaction feature |
| `avg_rating` | Customer star rating | Driver priority |
| `past_rides` | Historical ride count | Loyalty proxy |

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| ML / AI | XGBoost, LightGBM, scikit-learn, SHAP TreeExplainer, StandardScaler |
| Backend | FastAPI, Python 3.11, asyncio, WebSockets, httpx, python-dotenv |
| Geocoding | Nominatim (OpenStreetMap), OSRM routing engine |
| Weather | OpenWeather API (Current Weather Data, free tier) |
| Frontend | React 18, TypeScript, Vite, Motion (Framer), Recharts, Tailwind CSS |
| Maps | Leaflet.js 1.9.4, leaflet.heat plugin, Carto Positron tiles |
| Data | Synthetic dataset (35k samples) based on Arashnic Kaggle schema |

---

## Architecture

```
Frontend (React + Vite)  ──→  FastAPI Backend  ──→  XGBoost Model
        ↕ WebSocket                ↓                     ↑
  Live market feed        OpenWeather API          StandardScaler
                          Nominatim Geocoding       SHAP Explainer
                          OSRM Routing              insights_engine
                          weather_service           live_engine (WS)
```

Backend modules alongside `main.py`:

| Module | Responsibility |
|--------|---------------|
| `weather_service.py` | Async OpenWeather fetch, surge boost mapping, safe fallback |
| `insights_engine.py` | Rule-based insight generation from live prediction data |
| `websocket_manager.py` | Connection pool, broadcast, dead-connection pruning |
| `live_engine.py` | Background asyncio task, 5s drift loop, peak/off-peak bounds |
| `utils.py` | Nominatim geocoding, OSRM route fetch, surge multiplier calculation |
| `config.py` | All constants — fares, surge cap, simulation ranges, cab translation |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/metrics` | Model performance metrics |
| GET | `/options` | Available cab types, categories, loyalty statuses |
| POST | `/predict` | Main prediction — fare, surge, weather, insights, trip details |
| POST | `/explain` | SHAP explanation — per-feature impacts, headline, breakdown |
| GET | `/simulate` | Price simulation across time slots for all cab types |
| GET | `/model-comparison` | Benchmark metrics for all 4 trained models |
| WS | `/ws/market` | WebSocket live market feed — 5s broadcast, ping/pong |

---

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- OpenWeather API key (free — [openweathermap.org/api](https://openweathermap.org/api))

### Backend

```bash
cd backend

pip install fastapi uvicorn xgboost scikit-learn shap httpx python-dotenv lightgbm

# Create .env
echo "OPENWEATHER_API_KEY=your_key_here" > .env

# Start server
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Train models (optional — pre-trained artifacts included)

```bash
cd backend
python train.py           # trains XGBoost production model
python train_compare.py   # benchmarks all 4 models → model_comparison.json
```

The backend runs on `http://localhost:8000` and the frontend on `http://localhost:5173`. WebSocket endpoint: `ws://localhost:8000/ws/market`.

---

## Pricing Logic

```
Base fare       = XGBoost prediction on 16 scaled features
Surge           = demand_supply_ratio × 0.85, capped at 2.5×
Weather boost   = added to surge (Rain +0.30, Thunderstorm +0.45, Snow +0.50 ...)
Final price     = max(min_fare, distance_floor, base_fare × surge_multiplier)
Min fares       = Economy ₹50 · Premium ₹120
```

Peak hours = Morning + Evening categories. Peak simulation: 80–150 riders, 30–70 drivers. Off-peak: 20–60 riders, 40–80 drivers.

---

## Project Structure

```
RidePricerAI/
├── backend/
│   ├── main.py                     # FastAPI app, all endpoints
│   ├── config.py                   # Constants, fare rules, simulation ranges
│   ├── utils.py                    # Geocoding, routing, surge calculation
│   ├── weather_service.py          # OpenWeather integration
│   ├── insights_engine.py          # AI insights generation
│   ├── websocket_manager.py        # WebSocket connection pool
│   ├── live_engine.py              # Background market broadcaster
│   ├── train.py                    # XGBoost training script
│   ├── train_compare.py            # Multi-model benchmark
│   ├── ridepricer_model_v2.json    # Trained XGBoost model
│   ├── ridepricer_scaler_v2.pkl    # Fitted StandardScaler
│   ├── ridepricer_encoders_v2.json # Label encoding maps
│   └── ridepricer_metrics_v2.json  # Performance metrics
├── frontend/
│   ├── src/
│   │   ├── App.tsx                 # Main app, state, prediction flow
│   │   ├── api.ts                  # Backend API calls
│   │   ├── hooks/
│   │   │   └── useMarketSocket.ts  # WebSocket hook with auto-reconnect
│   │   └── components/ui/
│   │       ├── FareCard.tsx        # Dominant price display card
│   │       ├── StatsGrid.tsx       # Live market 4-card grid
│   │       ├── RouteMapCard.tsx    # Leaflet map + heatmap
│   │       ├── SHAPChart.tsx       # SHAP feature bar chart
│   │       ├── PriceSimChart.tsx   # Recharts area chart
│   │       ├── WeatherBadge.tsx    # Weather condition card
│   │       ├── AIInsightsPanel.tsx # Contextual insight cards
│   │       ├── ModelComparisonTable.tsx
│   │       ├── TripInputPanel.tsx  # Input form with Places autocomplete
│   │       └── PageLayout.tsx      # Navbar, grid, column layout
│   └── package.json
└── README.md
```

---

## Academic Context

Submitted as the Project Based Learning (PBL) component (course code **24CFT0202**) for the January–June 2026 session at Chitkara University Institute of Engineering and Technology, under course coordinator Mr. Mudrik.

- **Student:** Mukund Bansal
- **Degree:** B.E. CSE (AI & Future Technologies), Semester 4
- **Institution:** Chitkara University Institute of Engineering and Technology
- **Session:** January–June 2026

---

## License

MIT License — free to use, modify, and distribute with attribution.

---

<p align="center">Built by Mukund Bansal · Chitkara University · 2026</p>
