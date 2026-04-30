import math
import logging
import requests
from config import NOMINATIM_URL, OSRM_URL, MAPS_USER_AGENT, SURGE_CAP, SURGE_COEFFICIENT

logger = logging.getLogger("RidePricer-Engine")

def get_time_category(hour: int) -> str:
    if 6 <= hour < 12: return "Morning"
    elif 12 <= hour < 17: return "Afternoon"
    elif 17 <= hour < 21: return "Evening"
    return "Night"

def geocode(query, headers):
    # Try with full query first
    res = requests.get(f"{NOMINATIM_URL}?q={query}&format=json&limit=3", headers=headers, timeout=5).json()
    if res:
        return res[0]
    # Try with just the last part (city name)
    parts = query.split(',')
    if len(parts) > 1:
        short = parts[-1].strip()
        res = requests.get(f"{NOMINATIM_URL}?q={short}&format=json&limit=1", headers=headers, timeout=5).json()
        if res:
            return res[0]
    return None

def fetch_route_distance(pickup, dropoff):
    try:
        headers = {'User-Agent': MAPS_USER_AGENT}
        
        p = geocode(pickup, headers)
        d = geocode(dropoff, headers)

        if not p or not d:
            raise ValueError(f"Geocoding failed: pickup={bool(p)} dropoff={bool(d)}")

        lon1, lat1 = float(p['lon']), float(p['lat'])
        lon2, lat2 = float(d['lon']), float(d['lat'])

        logger.info(f"GEOCODE pickup:{lat1:.3f},{lon1:.3f} dropoff:{lat2:.3f},{lon2:.3f}")
        logger.info(f"PLACES: '{p.get('display_name','')[:50]}' -> '{d.get('display_name','')[:50]}'")

        # Haversine straight-line distance
        R = 6371
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
        straight_km = R * 2 * math.asin(math.sqrt(a))

        route_res = requests.get(f"{OSRM_URL}{lon1},{lat1};{lon2},{lat2}?overview=false", timeout=5).json()
        osrm_km = route_res['routes'][0]['distance'] / 1000
        osrm_mins = route_res['routes'][0]['duration'] / 60

        logger.info(f"DISTANCE straight={straight_km:.1f}km osrm={osrm_km:.1f}km")

        if osrm_km < straight_km * 0.6:
            logger.warning(f"OSRM mismatch, using haversine estimate")
            osrm_km = straight_km * 1.3
            osrm_mins = osrm_km * 2.2

        return (osrm_mins, osrm_km)

    except Exception as e:
        logger.warning(f"Route fetch failed: {e}")
        fallback_km = ((len(pickup) * 2.5) + (len(dropoff) * 1.5)) % 40 + 3.0
        return (fallback_km * 2.5, fallback_km)

def calculate_surge_multiplier(riders, drivers):
    ratio = round(riders / max(drivers, 1), 2)
    multiplier = max(1.0, min(SURGE_CAP, ratio * SURGE_COEFFICIENT))
    return ratio, round(multiplier, 2)