import asyncio
import numpy as np
import logging
from datetime import datetime

import config
from utils import get_time_category, calculate_surge_multiplier
from websocket_manager import manager

logger = logging.getLogger("RidePricer-LiveEngine")

# ── Internal state — drifts between ticks ────────────────────────────────────
_state = {
    "riders":  60,
    "drivers": 45,
}

TICK_INTERVAL = 5   # seconds between broadcasts


def _drift_value(current: int, lo: int, hi: int, max_delta: int) -> int:
    """Random walk within bounds — feels like a live market feed."""
    delta = np.random.randint(-max_delta, max_delta + 1)
    return int(np.clip(current + delta, lo, hi))


async def live_market_broadcaster():
    """
    Infinite loop — call once at app startup via asyncio.create_task().
    Drifts riders/drivers, recomputes surge, broadcasts to all WS clients.
    """
    logger.info("Live market broadcaster started")

    while True:
        try:
            await asyncio.sleep(TICK_INTERVAL)

            if not manager.active:
                continue   # no clients — skip compute

            hour = datetime.now().hour
            time_cat = get_time_category(hour)
            is_peak = time_cat in config.PEAK_HOURS_CATS

            # Drift within peak/off-peak bounds
            if is_peak:
                lo_r, hi_r = config.SIM_PEAK_RIDERS
                lo_d, hi_d = config.SIM_PEAK_DRIVERS
            else:
                lo_r, hi_r = config.SIM_OFFPEAK_RIDERS
                lo_d, hi_d = config.SIM_OFFPEAK_DRIVERS

            _state["riders"]  = _drift_value(_state["riders"],  lo_r, hi_r, 4)
            _state["drivers"] = _drift_value(_state["drivers"], lo_d, hi_d, 3)

            riders  = _state["riders"]
            drivers = _state["drivers"]

            demand_supply_ratio, surge_multiplier = calculate_surge_multiplier(riders, drivers)

            demand_level = (
                "High"     if surge_multiplier > 1.3 else
                "Moderate" if surge_multiplier > 1.0 else
                "Normal"
            )

            payload = {
                "type":                "market_update",
                "timestamp":           datetime.now().isoformat(),
                "riders":              riders,
                "drivers":             drivers,
                "demand_supply_ratio": round(demand_supply_ratio, 2),
                "surge_multiplier":    round(surge_multiplier, 2),
                "demand_level":        demand_level,
                "time_category":       time_cat,
                "is_peak":             is_peak,
            }

            await manager.broadcast(payload)

        except asyncio.CancelledError:
            logger.info("Live broadcaster cancelled")
            break
        except Exception as e:
            logger.error(f"Broadcaster error: {e}")
            await asyncio.sleep(2)   # brief pause before retry
