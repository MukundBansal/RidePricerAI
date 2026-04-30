import os

# API Settings (Required by utils.py)
MAPS_USER_AGENT = "RidePricerCapstone/2.0"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
OSRM_URL = "http://router.project-osrm.org/route/v1/driving/"

# Model Paths — v2 unified model
MODEL_PATH = "ridepricer_model_v2.json"
SCALER_PATH = "ridepricer_scaler_v2.pkl"
ENCODER_PATH = "ridepricer_encoders_v2.json"
METRICS_PATH = "ridepricer_metrics_v2.json"

# Pricing & Surge Logic
MIN_FARES = {
    "Economy": 50.0,
    "Premium": 120.0
}

SURGE_CAP = 2.5
SURGE_COEFFICIENT = 0.85

# Simulation Logic
CAB_TRANSLATION = {
    "Uber Go": "Economy",
    "Ola Mini": "Economy",
    "Rapido Bike": "Economy",
    "Uber Auto": "Economy",
    "Ola Prime SUV": "Premium",
    "Uber Premium": "Premium"
}
PEAK_HOURS_CATS = ["Morning", "Evening"]
SIM_PEAK_RIDERS = (80, 150)
SIM_PEAK_DRIVERS = (30, 70)
SIM_OFFPEAK_RIDERS = (20, 60)
SIM_OFFPEAK_DRIVERS = (40, 80)
DEFAULT_CAB_TYPE = "Economy"
DEFAULT_MIN_FARE = 50.0
