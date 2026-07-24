from collections.abc import Sequence
from typing import Literal

CacheScope = Literal["citywide", "tiles_outer_snapped"]

def build_endpoint_cache_key(
    endpoint: str,
    scope: CacheScope,
    parts: Sequence[str],
    *,
    version: str = "v1",
    resolution: int | None = None,
    cuisine_values: Sequence[str] = (),
    cost_values: Sequence[str] = (),
    venue_value: str = "",
    score_basis: int = 0,
    score_tier: int = 0,
    snapped_tiles: Sequence[str] = (),
) -> str:
    key_parts: list[str] = [version, endpoint, scope]

    if scope == "citywide":
        return "|".join([*key_parts, *parts])

    if scope == "tiles_outer_snapped":
        if resolution is None:
            raise ValueError("tiles_outer_snapped cache key requires resolution")
        return "|".join([
            *key_parts,
            *tile_snapped_key_tokens(
                resolution,
                cuisine_values,
                cost_values,
                venue_value,
                score_basis,
                score_tier,
                snapped_tiles,
            ),
            *parts,
        ])

    raise ValueError(f"Unsupported cache key scope: {scope}")

def tile_snapped_key_tokens(
    resolution: int,
    cuisine_values: Sequence[str],
    cost_values: Sequence[str],
    venue_value: str,
    score_basis: int,
    score_tier: int,
    snapped_tiles: Sequence[str],
) -> list[str]:
    return [
        str(resolution),
        _sorted_csv(cuisine_values),
        _sorted_csv(cost_values),
        venue_value,
        str(score_basis),
        str(score_tier),
        _sorted_csv(snapped_tiles),
    ]

def _sorted_csv(values: Sequence[str]) -> str:
    return ",".join(sorted(values))

