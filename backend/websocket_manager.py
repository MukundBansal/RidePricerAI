import asyncio
import json
import logging
from datetime import datetime
from typing import Set
from fastapi import WebSocket

logger = logging.getLogger("RidePricer-WS")


class ConnectionManager:
    """Manages all active WebSocket connections."""

    def __init__(self):
        self.active: Set[WebSocket] = set()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.add(ws)
        logger.info(f"WS connected. Total: {len(self.active)}")

    def disconnect(self, ws: WebSocket):
        self.active.discard(ws)
        logger.info(f"WS disconnected. Total: {len(self.active)}")

    async def broadcast(self, data: dict):
        """Send to all connected clients. Dead connections are pruned automatically."""
        if not self.active:
            return
        msg = json.dumps(data)
        dead = set()
        for ws in self.active:
            try:
                await ws.send_text(msg)
            except Exception:
                dead.add(ws)
        self.active -= dead


manager = ConnectionManager()
