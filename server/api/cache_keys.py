from collections.abc import Sequence
from typing import Final, Literal

_DEFAULT_BBOX_PRECISION: Final[int] = 6
CacheSpatialScope = Literal["citywide", "bbox_exact", "tiles_outer_snapped"]

def build_viewbbox_endpoint_cache_key(
    endpoint: str,
    scope: CacheSpatialScope,
    parts: Sequence[str],
    *,
    version: str = "v1",
    sw_lat: float | None = None,
    sw_lng: float | None = None,
    ne_lat: float | None = None,
    ne_lng: float | None = None,
    precision: int = _DEFAULT_BBOX_PRECISION,
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

    if scope == "bbox_exact":
        if None in (sw_lat, sw_lng, ne_lat, ne_lng):
            raise ValueError("bbox_exact cache key requires sw_lat/sw_lng/ne_lat/ne_lng")
        return "|".join([
            *key_parts,
            *bbox_tokens(float(sw_lat), float(sw_lng), float(ne_lat), float(ne_lng), precision=precision),
            *parts,
        ])

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

def bbox_tokens(
    sw_lat: float,
    sw_lng: float,
    ne_lat: float,
    ne_lng: float,
    precision: int = _DEFAULT_BBOX_PRECISION,
) -> list[str]:
    fmt = f"{{:.{precision}f}}"
    return [
        fmt.format(sw_lat),
        fmt.format(sw_lng),
        fmt.format(ne_lat),
        fmt.format(ne_lng),
    ]

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

