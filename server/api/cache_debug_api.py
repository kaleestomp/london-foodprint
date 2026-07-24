import time
from typing import Any

from fastapi import APIRouter

from api.histogram_api.cuisine_histogram_api import get_cuisine_histogram_cache_stats
from api.histogram_api.price_histogram_api import get_price_histogram_cache_stats
from api.tile_api.tile_cache import get_tile_cache_stats

router = APIRouter()


@router.get("/api/cache/stats")
async def get_cache_stats() -> dict[str, Any]:
    now = time.time()

    tile = await get_tile_cache_stats(now)
    cuisine_histogram = await get_cuisine_histogram_cache_stats(now)
    price_histogram = await get_price_histogram_cache_stats(now)

    total = tile["total"] + cuisine_histogram["total"] + price_histogram["total"]
    live = tile["live"] + cuisine_histogram["live"] + price_histogram["live"]
    expired = tile["expired"] + cuisine_histogram["expired"] + price_histogram["expired"]

    return {
        "summary": {
            "total": total,
            "live": live,
            "expired": expired,
        },
        "caches": {
            "tile_cache": tile,
            "cuisine_histogram_cache": cuisine_histogram,
            "price_histogram_cache": price_histogram,
        },
        "checked_at_epoch_seconds": now,
    }
