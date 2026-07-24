import asyncio
from collections.abc import Awaitable, Callable
from typing import Any

_in_flight: dict[str, asyncio.Task[Any]] = {}
_tiles_cache_lock = asyncio.Lock()


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
