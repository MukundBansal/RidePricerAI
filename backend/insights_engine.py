# insights_engine.py
# Generates contextual AI insights from existing /predict response data
# No new dependencies needed

from dataclasses import dataclass
from typing import List


@dataclass
class Insight:
    id: str
    type: str          # "warning" | "tip" | "info" | "positive"
    icon: str          # emoji
    title: str
    body: str
    priority: int      # 1 = highest, shown first


def generate_insights(
    surge_multiplier: float,
    weather_boost: float,
    weather_condition: str,
    riders: int,
    drivers: int,
    distance_km: float,
    duration_mins: float,
    hour: int,
    time_category: str,
    cab_type: str,
    final_price_inr: float,
    revenue_lift_pct: float,
    loyalty_status: str = "Regular",
    avg_rating: float = 4.2,
) -> List[dict]:
    """
    Generate a ranked list of AI insights for a given ride prediction.
    Returns list of dicts ready to serialize to JSON.
    """
    insights: List[Insight] = []
    demand_supply_ratio = round(riders / max(drivers, 1), 2)

    # ── 1. Extreme surge warning ───────────────────────────────────────────
    if surge_multiplier >= 2.0:
        insights.append(Insight(
            id="extreme_surge",
            type="warning",
            icon="🔥",
            title=f"{surge_multiplier:.1f}x surge active",
            body=(
                f"Demand is critically high — {riders} riders competing for "
                f"{drivers} drivers. Waiting 15–20 min may reduce your fare by "
                f"₹{int(final_price_inr * 0.25):,}+"
            ),
            priority=1,
        ))
    elif surge_multiplier >= 1.5:
        insights.append(Insight(
            id="high_surge",
            type="warning",
            icon="⚡",
            title=f"{surge_multiplier:.1f}x surge — high demand",
            body=(
                f"{riders} active riders, only {drivers} drivers available. "
                f"Consider travelling in 20–30 min for a lower fare."
            ),
            priority=2,
        ))

    # ── 2. Weather impact ─────────────────────────────────────────────────
    if weather_boost >= 0.30:
        insights.append(Insight(
            id="weather_heavy",
            type="warning",
            icon="🌧",
            title=f"{weather_condition} adding +{int(weather_boost * 100)}% surge",
            body=(
                "Fewer drivers operate during heavy weather — supply has dropped "
                "significantly. Book now or wait for conditions to improve."
            ),
            priority=1,
        ))
    elif weather_boost >= 0.10:
        insights.append(Insight(
            id="weather_mild",
            type="info",
            icon="🌦",
            title=f"{weather_condition} causing +{int(weather_boost * 100)}% weather premium",
            body="Mild weather impact on driver supply. Price should normalise once conditions clear.",
            priority=4,
        ))

    # ── 3. Best time to travel ────────────────────────────────────────────
    if time_category in ("Morning Peak", "Evening Peak"):
        off_peak_saving = int(final_price_inr * 0.20)
        insights.append(Insight(
            id="peak_tip",
            type="tip",
            icon="⏰",
            title="Peak hour — save by travelling later",
            body=(
                f"Off-peak fares (2–4 PM or after 9 PM) are typically "
                f"₹{off_peak_saving:,}–₹{int(off_peak_saving * 1.4):,} cheaper for this route."
            ),
            priority=3,
        ))
    elif time_category in ("Late Night", "Early Morning"):
        insights.append(Insight(
            id="night_info",
            type="info",
            icon="🌙",
            title="Night pricing active",
            body="Late-night rides carry a small safety surcharge. Driver availability is limited after midnight.",
            priority=5,
        ))
    else:
        insights.append(Insight(
            id="good_time",
            type="positive",
            icon="✅",
            title="Good time to ride",
            body=f"Off-peak hour with {drivers} drivers available. This is near the base fare for this route.",
            priority=4,
        ))

    # ── 4. Driver supply alert ────────────────────────────────────────────
    if drivers <= 20 and surge_multiplier < 1.5:
        insights.append(Insight(
            id="low_supply",
            type="warning",
            icon="🚗",
            title=f"Only {drivers} drivers nearby",
            body="Supply is tight. Book immediately — prices may spike further if more riders enter the area.",
            priority=2,
        ))
    elif drivers >= 70:
        insights.append(Insight(
            id="high_supply",
            type="positive",
            icon="🚕",
            title=f"{drivers} drivers available",
            body="Excellent driver availability — short wait times expected. Good moment to book.",
            priority=5,
        ))

    # ── 5. Long trip optimization ─────────────────────────────────────────
    if distance_km >= 100:
        alt_saving = int(final_price_inr * 0.15)
        insights.append(Insight(
            id="long_trip",
            type="tip",
            icon="🛣",
            title="Long-distance trip detected",
            body=(
                f"For {distance_km:.0f} km trips, Economy cab saves "
                f"~₹{alt_saving:,} vs Premium. Consider a shared intercity "
                f"option if flexibility allows."
            ),
            priority=4,
        ))

    # ── 6. Revenue lift context ───────────────────────────────────────────
    if revenue_lift_pct >= 80:
        insights.append(Insight(
            id="high_lift",
            type="positive",
            icon="📈",
            title=f"+{revenue_lift_pct:.0f}% revenue vs flat-rate",
            body="Dynamic pricing is performing strongly — demand conditions are ideal for surge.",
            priority=6,
        ))

    # ── 7. Demand/supply ratio extremes ───────────────────────────────────
    if demand_supply_ratio >= 3.0:
        insights.append(Insight(
            id="ratio_critical",
            type="warning",
            icon="📊",
            title=f"{demand_supply_ratio:.1f}x demand/supply ratio",
            body="Critical imbalance — 3+ riders per driver. This is a textbook surge scenario.",
            priority=2,
        ))

    # ── 8. Loyalty / rating perks ─────────────────────────────────────────
    if loyalty_status == "Gold" and surge_multiplier > 1.3:
        insights.append(Insight(
            id="loyalty_benefit",
            type="positive",
            icon="⭐",
            title="Gold member surge cap applied",
            body="Your Gold loyalty status caps surge at 1.8x. Standard users are paying more right now.",
            priority=3,
        ))
    elif loyalty_status == "Regular" and surge_multiplier >= 1.5:
        insights.append(Insight(
            id="loyalty_upsell",
            type="tip",
            icon="💡",
            title="Upgrade to Silver for surge protection",
            body="Silver members get 10% off during surge periods. At this fare, that's a significant saving.",
            priority=5,
        ))

    # ── 9. Rating-based ETA insight ───────────────────────────────────────
    if avg_rating >= 4.7:
        insights.append(Insight(
            id="high_rating",
            type="positive",
            icon="🌟",
            title="Priority matching enabled",
            body=f"Your {avg_rating:.1f}★ rating gives you priority driver matching — expect faster pickup.",
            priority=6,
        ))

    # ── Sort by priority and cap at 4 insights ────────────────────────────
    insights.sort(key=lambda x: x.priority)
    top = insights[:4]

    return [
        {
            "id":       ins.id,
            "type":     ins.type,
            "icon":     ins.icon,
            "title":    ins.title,
            "body":     ins.body,
            "priority": ins.priority,
        }
        for ins in top
    ]
