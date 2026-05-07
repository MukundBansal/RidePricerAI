import uuid
import logging
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import xgboost as xgb
import numpy as np
import pickle
import json
import shap

import config
from utils import get_time_category, fetch_route_distance, calculate_surge_multiplier

app = FastAPI(title="RidePricer AI API v2")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("RidePricer-Engine")

# Load artifacts
model = xgb.XGBRegressor()
model.load_model(config.MODEL_PATH)
with open(config.SCALER_PATH, "rb") as f:
    scaler = pickle.load(f)
with open(config.ENCODER_PATH, "r") as f:
    encoders = json.load(f)

# SHAP explainer — created once at startup
explainer = shap.TreeExplainer(model)
logger.info("SHAP TreeExplainer initialized")

# Build encoder maps
vehicle_map = {v: i for i, v in enumerate(encoders["vehicle_type"])}
time_map = {t: i for i, t in enumerate(encoders["time_of_booking"])}
location_map = {l: i for i, l in enumerate(encoders["location_category"])}
loyalty_map = {l: i for i, l in enumerate(encoders["loyalty_status"])}

# Reverse maps for display
reverse_vehicle_map = {v: k for k, v in vehicle_map.items()}
reverse_time_map = {v: k for k, v in time_map.items()}

route_cache = {}

# Feature metadata for SHAP explanations
FEATURE_NAMES = [
    "riders", "drivers", "demand_supply_ratio",
    "duration_mins", "distance_km",
    "vehicle_encoded", "time_encoded", "location_encoded", "loyalty_encoded",
    "is_peak", "is_premium",
    "demand_x_peak", "duration_x_vehicle", "distance_x_vehicle",
    "avg_rating", "past_rides"
]

DISPLAY_NAMES = {
    "riders": "Rider demand",
    "drivers": "Driver supply",
    "demand_supply_ratio": "Supply/Demand ratio",
    "duration_mins": "Trip duration",
    "distance_km": "Distance",
    "vehicle_encoded": "Vehicle type",
    "time_encoded": "Time of day",
    "location_encoded": "Location type",
    "loyalty_encoded": "Loyalty tier",
    "is_peak": "Peak hour",
    "is_premium": "Premium vehicle",
    "demand_x_peak": "Peak demand boost",
    "duration_x_vehicle": "Duration × Premium",
    "distance_x_vehicle": "Distance × Premium",
    "avg_rating": "Customer rating",
    "past_rides": "Ride history"
}

class RideRequest(BaseModel):
    pickup_location: str = Field(..., min_length=2, description="Origin address")
    dropoff_location: str = Field(..., min_length=2, description="Destination address")
    cab_type: str = Field(..., description="Selected vehicle tier")
    simulated_hour: int = Field(None, ge=0, le=23, description="Optional hour (0-23) for testing")
    location_category: str = Field("Urban", description="Area type: Urban / Suburban / Rural")
    loyalty_status: str = Field("Regular", description="Customer loyalty: Regular / Silver / Gold")
    average_rating: float = Field(4.2, ge=1.0, le=5.0, description="Customer average rating")
    past_rides: int = Field(10, ge=0, description="Number of past rides")

class ExplainRequest(BaseModel):
    distance_km: float
    duration_mins: float
    riders: int
    drivers: int
    surge_multiplier: float
    cab_type: str
    hour: int
    location_category: str = "Urban"
    loyalty_status: str = "Regular"
    average_rating: float = 4.2
    past_rides: int = 10

def get_route_data(pickup, dropoff):
    route_key = f"{pickup.lower().strip()}_{dropoff.lower().strip()}"
    if route_key in route_cache:
        return route_cache[route_key]
    result = fetch_route_distance(pickup, dropoff)
    route_cache[route_key] = result
    return result

def build_features(riders, drivers, demand_supply_ratio, duration_mins, distance_km,
                   vehicle_encoded, time_encoded, location_encoded, loyalty_encoded,
                   is_peak, is_premium, avg_rating, past_rides):
    demand_x_peak = demand_supply_ratio * is_peak
    duration_x_vehicle = duration_mins * is_premium
    distance_x_vehicle = distance_km * is_premium

    return np.array([[
        riders, drivers, demand_supply_ratio,
        duration_mins, distance_km,
        vehicle_encoded, time_encoded, location_encoded, loyalty_encoded,
        is_peak, is_premium,
        demand_x_peak, duration_x_vehicle, distance_x_vehicle,
        avg_rating, past_rides
    ]])

@app.get("/")
def root():
    return {"message": "RidePricer AI India v2 - Proper Model", "status": "active"}

@app.get("/metrics")
def get_metrics():
    with open(config.METRICS_PATH, "r") as f:
        return json.load(f)

@app.get("/options")
def get_options():
    return {
        "cab_types": list(config.CAB_TRANSLATION.keys()),
        "location_categories": ["Urban", "Suburban", "Rural"],
        "loyalty_statuses": ["Regular", "Silver", "Gold"]
    }

@app.post("/predict")
def predict_price(ride: RideRequest):
    logger.info(f"REQUEST: pickup='{ride.pickup_location}' dropoff='{ride.dropoff_location}'")
    hour = ride.simulated_hour if ride.simulated_hour is not None else datetime.now().hour
    time_cat = get_time_category(hour)

    duration_mins, distance_km, plat, plng, dlat, dlng = get_route_data(ride.pickup_location, ride.dropoff_location)

    np.random.seed(None)
    is_peak_time = time_cat in config.PEAK_HOURS_CATS

    if is_peak_time:
        riders = np.random.randint(*config.SIM_PEAK_RIDERS)
        drivers = np.random.randint(*config.SIM_PEAK_DRIVERS)
    else:
        riders = np.random.randint(*config.SIM_OFFPEAK_RIDERS)
        drivers = np.random.randint(*config.SIM_OFFPEAK_DRIVERS)

    demand_supply_ratio, surge_multiplier = calculate_surge_multiplier(riders, drivers)

    arashnic_cab = config.CAB_TRANSLATION.get(ride.cab_type, config.DEFAULT_CAB_TYPE)
    vehicle_encoded = vehicle_map.get(arashnic_cab, 0)
    time_encoded = time_map.get(time_cat, 2)
    location_encoded = location_map.get(ride.location_category, 2)
    loyalty_encoded = loyalty_map.get(ride.loyalty_status, 1)

    is_peak = int(is_peak_time)
    is_premium = int(arashnic_cab == "Premium")

    features = build_features(
        riders, drivers, demand_supply_ratio,
        duration_mins, distance_km,
        vehicle_encoded, time_encoded, location_encoded, loyalty_encoded,
        is_peak, is_premium,
        ride.average_rating, ride.past_rides
    )

    features_scaled = scaler.transform(features)
    predicted_price = float(model.predict(features_scaled)[0])

    min_fare = config.MIN_FARES.get(arashnic_cab, config.DEFAULT_MIN_FARE)
    distance_floor = distance_km * (11.0 if arashnic_cab == "Economy" else 20.0)
    final_price_inr = max(min_fare, distance_floor, predicted_price)

    base_fare_inr = final_price_inr / surge_multiplier
    surge_fee = final_price_inr - base_fare_inr
    lift = (surge_fee / base_fare_inr * 100) if base_fare_inr > 0 else 0

    prediction_id = f"req_{uuid.uuid4().hex[:12]}"
    logger.info(f"[{prediction_id}] {ride.cab_type} | {distance_km:.1f}km | {time_cat} | INR {final_price_inr:.0f}")

    return {
        "success": True,
        "metadata": {"prediction_id": prediction_id, "timestamp": datetime.now().isoformat()},
        "data": {
            "final_price_inr": round(final_price_inr),
            "base_fare_inr": round(base_fare_inr),
            "surge_fee_inr": round(surge_fee),
            "revenue_lift_percentage": round(lift, 1),
            "demand_level": "High" if surge_multiplier > 1.3 else ("Moderate" if surge_multiplier > 1.0 else "Normal"),
            "trip_details": {
                "distance_km": round(distance_km, 1),
                "duration_mins": round(duration_mins),
                "active_riders": int(riders),
                "active_drivers": int(drivers),
                "surge_multiplier": float(surge_multiplier),
                "time_category": time_cat,
                "pickup_lat": plat,
                "pickup_lng": plng,
                "dropoff_lat": dlat,
                "dropoff_lng": dlng
            }
        }
    }

@app.post("/explain")
def explain_price(req: ExplainRequest):
    """SHAP-powered price explanation endpoint."""
    logger.info(f"EXPLAIN: {req.cab_type} | {req.distance_km}km | hour={req.hour}")

    time_cat = get_time_category(req.hour)
    arashnic_cab = config.CAB_TRANSLATION.get(req.cab_type, config.DEFAULT_CAB_TYPE)
    vehicle_encoded = vehicle_map.get(arashnic_cab, 0)
    time_encoded = time_map.get(time_cat, 2)
    location_encoded = location_map.get(req.location_category, 2)
    loyalty_encoded = loyalty_map.get(req.loyalty_status, 1)

    is_peak = int(time_cat in config.PEAK_HOURS_CATS)
    is_premium = int(arashnic_cab == "Premium")
    demand_supply_ratio = round(req.riders / max(req.drivers, 1), 2)

    features = build_features(
        req.riders, req.drivers, demand_supply_ratio,
        req.duration_mins, req.distance_km,
        vehicle_encoded, time_encoded, location_encoded, loyalty_encoded,
        is_peak, is_premium,
        req.average_rating, req.past_rides
    )

    features_scaled = scaler.transform(features)
    predicted_price = float(model.predict(features_scaled)[0])

    # SHAP decomposition
    shap_values = explainer.shap_values(features_scaled)
    sv = shap_values[0]
    base_value = float(explainer.expected_value)

    # Raw feature values (unscaled) for human-readable labels
    raw = features[0]

    factors = []
    for i, fname in enumerate(FEATURE_NAMES):
        impact = float(sv[i])
        raw_val = float(raw[i])

        # Human-readable value labels
        if fname == "riders":
            label = f"{int(raw_val)} riders"
        elif fname == "drivers":
            label = f"{int(raw_val)} drivers"
        elif fname == "demand_supply_ratio":
            label = f"{raw_val:.2f}x"
        elif fname == "duration_mins":
            label = f"{int(raw_val)} min"
        elif fname == "distance_km":
            label = f"{raw_val:.1f} km"
        elif fname == "vehicle_encoded":
            label = req.cab_type
        elif fname == "time_encoded":
            label = time_cat
        elif fname == "location_encoded":
            label = req.location_category
        elif fname == "loyalty_encoded":
            label = req.loyalty_status
        elif fname == "is_peak":
            label = "Yes" if raw_val else "No"
        elif fname == "is_premium":
            label = "Yes" if raw_val else "No"
        elif fname == "avg_rating":
            label = f"{raw_val:.1f} ★"
        elif fname == "past_rides":
            label = f"{int(raw_val)} rides"
        else:
            label = f"{raw_val:.2f}"

        factors.append({
            "feature": fname,
            "display_name": DISPLAY_NAMES.get(fname, fname),
            "value": raw_val,
            "value_label": label,
            "impact": round(impact, 2),
            "impact_pct": round((impact / base_value) * 100, 1) if base_value else 0,
        })

    factors.sort(key=lambda x: abs(x["impact"]), reverse=True)

    # Build headline
    top_positive = [f for f in factors if f["impact"] > 0][:2]
    top_negative = [f for f in factors if f["impact"] < 0][:1]

    headline = _build_headline(top_positive, top_negative, req)

    return {
        "predicted_price": round(predicted_price, 2),
        "base_price": round(base_value, 2),
        "surge_added": round(predicted_price - base_value, 2),
        "headline": headline,
        "factors": factors,
        "top_reasons": [f["display_name"] for f in top_positive],
        "savings_from": [f["display_name"] for f in top_negative[:1]],
    }


def _format_hour(h: int) -> str:
    suffix = "AM" if h < 12 else "PM"
    h12 = h % 12 or 12
    if 7 <= h <= 10 or 17 <= h <= 20:
        return f"{h12} {suffix} (peak)"
    elif 22 <= h or h <= 5:
        return f"{h12} {suffix} (night)"
    return f"{h12} {suffix}"


def _build_headline(positives, negatives, req):
    if not positives:
        return "Price is near the base fare — low demand and good driver availability."

    main = positives[0]
    parts = []

    if main["feature"] == "riders":
        parts.append(f"high rider demand ({int(main['value'])} riders)")
    elif main["feature"] == "demand_supply_ratio":
        parts.append(f"{main['value']:.2f}x demand/supply ratio")
    elif main["feature"] in ("time_encoded", "is_peak"):
        parts.append(f"peak hour pricing ({_format_hour(req.hour)})")
    elif main["feature"] == "distance_km":
        parts.append(f"long distance ({main['value']:.0f} km)")
    elif main["feature"] == "duration_mins":
        parts.append(f"long trip duration ({int(main['value'])} min)")
    elif main["feature"] == "drivers":
        parts.append(f"low driver availability ({int(main['value'])} drivers)")
    else:
        parts.append(main["display_name"].lower())

    if len(positives) > 1:
        second = positives[1]
        if second["feature"] == "drivers":
            parts.append(f"scarce supply ({int(second['value'])} drivers)")
        elif second["feature"] == "distance_km":
            parts.append(f"distance ({second['value']:.0f} km)")
        else:
            parts.append(second["display_name"].lower())

    saving_str = ""
    if negatives:
        saving_str = f" Offset slightly by {negatives[0]['display_name'].lower()}."

    return f"Price is elevated due to {' and '.join(parts)}.{saving_str}"


@app.get("/simulate")
def simulate_prices():
    scenarios = []
    for ind_cab, arashnic_cab in config.CAB_TRANSLATION.items():
        for hour in [8, 14, 18, 23]:
            time_cat = get_time_category(hour)
            is_peak_time = time_cat in config.PEAK_HOURS_CATS
            riders_mid, drivers_mid = (
                (config.SIM_PEAK_RIDERS[0] + config.SIM_PEAK_RIDERS[1]) // 2,
                (config.SIM_PEAK_DRIVERS[0] + config.SIM_PEAK_DRIVERS[1]) // 2
            ) if is_peak_time else (
                (config.SIM_OFFPEAK_RIDERS[0] + config.SIM_OFFPEAK_RIDERS[1]) // 2,
                (config.SIM_OFFPEAK_DRIVERS[0] + config.SIM_OFFPEAK_DRIVERS[1]) // 2
            )
            ratio, _ = calculate_surge_multiplier(riders_mid, drivers_mid)
            v_enc = vehicle_map.get(arashnic_cab, 0)
            t_enc = time_map.get(time_cat, 2)
            is_peak = int(is_peak_time)
            is_premium = int(arashnic_cab == "Premium")

            features = build_features(
                riders_mid, drivers_mid, ratio, 20.0, 15.0,
                v_enc, t_enc, 2, 1,
                is_peak, is_premium, 4.2, 10
            )
            price = float(model.predict(scaler.transform(features))[0])
            min_fare = config.MIN_FARES.get(arashnic_cab, config.DEFAULT_MIN_FARE)
            price = max(min_fare, price)

            scenarios.append({
                "cab_type": ind_cab,
                "hour": hour,
                "price": round(price),
                "time_label": f"{hour}:00",
                "demand_level": "High" if is_peak else "Normal"
            })
    return {"scenarios": scenarios}