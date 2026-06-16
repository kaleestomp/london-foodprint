import asyncio
import os
import time
from typing import Any

_CACHE_TTL_SECONDS = int(os.getenv("TILES_CACHE_TTL_SECONDS", "60"))
_tiles_cache: dict[str, tuple[float, dict[str, Any]]] = {}
_tiles_cache_lock = asyncio.Lock()


def _cache_key(
    snapped_tiles: list[str],
    resolution: int,
    cuisine_values: list[str],
    cost_values: list[str],
    venue_value: str,
    score_basis: int,
    score_tier: int,
    include_cost_histogram: bool,
) -> str:
    return "|".join(
        [
            str(resolution),
            ",".join(sorted(cuisine_values)),
            ",".join(sorted(cost_values)),
            venue_value,
            str(score_basis),
            str(score_tier),
            "hist" if include_cost_histogram else "nohist",
            ",".join(sorted(snapped_tiles)),
        ]
    )

async def _get_cached(key: str) -> dict[str, Any] | None:
    now = time.time()
    async with _tiles_cache_lock:
        cached = _tiles_cache.get(key)
        if cached is None:
            return None

        cached_at, payload = cached
        if now - cached_at > _CACHE_TTL_SECONDS:
            _tiles_cache.pop(key, None)
            return None

        return payload

async def _set_cached(key: str, payload: dict[str, Any]) -> None:
    async with _tiles_cache_lock:
        _tiles_cache[key] = (time.time(), payload)

