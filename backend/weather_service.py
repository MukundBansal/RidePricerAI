# weather_service.py
# Live weather integration using OpenWeatherMap API

import httpx
import os
from dataclasses import dataclass
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"

# Surge boost added ON TOP of your existing demand-based surge_multiplier
# Tuned for Indian cities — rain has outsized effect on Ola/Uber bookings
WEATHER_SURGE_BOOST = {
    "Thunderstorm": 0.45,
    "Drizzle":      0.15,
    "Rain":         0.30,
    "Snow":         0.50,
    "Fog":          0.20,
    "Mist":         0.10,
    "Haze":         0.10,
    "Dust":         0.15,
    "Sand":         0.15,
    "Ash":          0.25,
    "Squall":       0.35,
    "Tornado":      0.80,
    "Clear":        0.00,
    "Clouds":       0.05,
}

WEATHER_EMOJI = {
    "Thunderstorm": "⛈", "Drizzle": "🌦", "Rain": "🌧",
    "Snow": "❄️", "Fog": "🌫", "Mist": "🌫", "Haze": "🌫",
    "Dust": "💨", "Sand": "💨", "Ash": "🌋", "Squall": "💨",
    "Tornado": "🌪", "Clear": "☀️", "Clouds": "☁️",
}


@dataclass
class WeatherData:
    condition: str
    description: str
    emoji: str
    label: str
    temp_celsius: float
    humidity: int
    wind_speed: float
    visibility: int
    rain_1h: float
    surge_boost: float
    city: str


async def get_weather_by_coords(lat: float, lon: float) -> Optional[WeatherData]:
    """
    Fetch live weather for lat/lon.
    Returns None if key missing or request fails — /predict still works without it.
    """
    if not OPENWEATHER_API_KEY:
        return None

    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(OPENWEATHER_URL, params={
                "lat": lat, "lon": lon,
                "appid": OPENWEATHER_API_KEY,
                "units": "metric",
            })
            resp.raise_for_status()
            d = resp.json()

        condition   = d["weather"][0]["main"]
        description = d["weather"][0]["description"]

        return WeatherData(
            condition=condition,
            description=description,
            emoji=WEATHER_EMOJI.get(condition, "🌡"),
            label=f"{WEATHER_EMOJI.get(condition, '🌡')} {condition}",
            temp_celsius=round(d["main"]["temp"], 1),
            humidity=d["main"]["humidity"],
            wind_speed=round(d["wind"]["speed"], 1),
            visibility=d.get("visibility", 10000),
            rain_1h=round(d.get("rain", {}).get("1h", 0.0), 2),
            surge_boost=WEATHER_SURGE_BOOST.get(condition, 0.0),
            city=d.get("name", ""),
        )
    except Exception as e:
        print(f"[WeatherService] fetch failed: {e}")
        return None


def weather_to_dict(w: Optional[WeatherData]) -> dict:
    if w is None:
        return {"available": False, "condition": "Unknown",
                "label": "Weather unavailable", "surge_boost": 0.0}
    return {
        "available":    True,
        "condition":    w.condition,
        "description":  w.description,
        "emoji":        w.emoji,
        "label":        w.label,
        "temp_celsius": w.temp_celsius,
        "humidity":     w.humidity,
        "wind_speed":   w.wind_speed,
        "visibility":   w.visibility,
        "rain_1h":      w.rain_1h,
        "surge_boost":  w.surge_boost,
        "city":         w.city,
    }
