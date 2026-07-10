import asyncio
import os
import time
from collections.abc import Awaitable, Callable
from typing import Any

_CACHE_TTL_SECONDS = int(os.getenv("TILES_CACHE_TTL_SECONDS", "60"))
_tiles_cache: dict[str, tuple[float, dict[str, Any]]] = {}
_in_flight: dict[str, asyncio.Task[dict[str, Any]]] = {}
_tiles_cache_lock = asyncio.Lock()

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


async def _get_or_set_cached(
    key: str,
    producer: Callable[[], Awaitable[dict[str, Any]]],
) -> dict[str, Any]:
    cached = await _get_cached(key)
    if cached is not None:
        return cached

    async with _tiles_cache_lock:
        cached = _tiles_cache.get(key)
        if cached is not None:
            cached_at, payload = cached
            if time.time() - cached_at <= _CACHE_TTL_SECONDS:
                return payload
            _tiles_cache.pop(key, None)

        task = _in_flight.get(key)
        if task is None:
            task = asyncio.create_task(producer())
            _in_flight[key] = task

    try:
        payload = await asyncio.shield(task)
    except Exception:
        async with _tiles_cache_lock:
            if _in_flight.get(key) is task:
                _in_flight.pop(key, None)
        raise

    async with _tiles_cache_lock:
        _tiles_cache[key] = (time.time(), payload)
        if _in_flight.get(key) is task:
            _in_flight.pop(key, None)

    return payload


async def _run_singleflight(
    key: str,
    producer: Callable[[], Awaitable[Any]],
) -> Any:
    async with _tiles_cache_lock:
        task = _in_flight.get(key)
        if task is None:
            task = asyncio.create_task(producer())
            _in_flight[key] = task

    try:
        return await asyncio.shield(task)
    finally:
        async with _tiles_cache_lock:
            if _in_flight.get(key) is task:
                _in_flight.pop(key, None)
