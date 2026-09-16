import json
import math
from dataclasses import dataclass
from typing import Any

from fastapi import HTTPException

SUPPORTED_GEOMETRIES = {
    "boundary": {"Polygon", "MultiPolygon"},
    "street": {"LineString", "MultiLineString"},
}
MAX_COORDINATES = {
    "boundary": 5000,
    "street": 2000,
}


@dataclass(frozen=True)
class GeometrySearch:
    search_type: str
    geometry_json: str
    radius_m: float | None


def build_geometry_predicate(
    search_type: str,
    geometry_placeholder: str = "$2",
    radius_placeholder: str = "$3",
) -> str:
    if search_type == "boundary":
        return (
            f"ST_Covers(ST_SetSRID(ST_GeomFromGeoJSON({geometry_placeholder}::text), 4326), geom) "
            f"AND {radius_placeholder}::double precision >= 0"
        )
    if search_type == "street":
        return (
            "ST_DWithin(geom::geography, "
            f"ST_SetSRID(ST_GeomFromGeoJSON({geometry_placeholder}::text), 4326)::geography, "
            f"{radius_placeholder})"
        )
    raise ValueError(f"Unsupported geometry search type: {search_type}")


def parse_geometry_search(
    search_type: str | None,
    geometry: str | None,
    radius_m: float | None,
) -> GeometrySearch | None:
    if search_type is None and geometry is None:
        return None
    if search_type not in SUPPORTED_GEOMETRIES:
        raise HTTPException(status_code=422, detail="search_type must be 'boundary' or 'street'")
    if geometry is None:
        raise HTTPException(status_code=422, detail="geometry is required for a geometry search")
    if search_type == "street" and (radius_m is None or radius_m <= 0):
        raise HTTPException(status_code=422, detail="radius_m must be greater than zero for a street search")
    if search_type == "boundary" and radius_m is not None:
        raise HTTPException(status_code=422, detail="radius_m is not valid for a boundary search")

    try:
        geometry_value = json.loads(geometry)
    except (TypeError, json.JSONDecodeError) as error:
        raise HTTPException(status_code=422, detail="geometry must be valid GeoJSON") from error

    if not isinstance(geometry_value, dict):
        raise HTTPException(status_code=422, detail="geometry must be a GeoJSON geometry object")
    geometry_type = geometry_value.get("type")
    if geometry_type not in SUPPORTED_GEOMETRIES[search_type]:
        allowed = ", ".join(sorted(SUPPORTED_GEOMETRIES[search_type]))
        raise HTTPException(status_code=422, detail=f"{search_type} geometry must be one of: {allowed}")
    coordinates = geometry_value.get("coordinates")
    coordinate_count = count_coordinates(coordinates)
    if coordinate_count == 0:
        raise HTTPException(status_code=422, detail="geometry must contain coordinates")

    if coordinate_count > MAX_COORDINATES[search_type]:
        geometry_value["coordinates"] = reduce_coordinates(
            coordinates,
            math.ceil(coordinate_count / MAX_COORDINATES[search_type]),
        )

    return GeometrySearch(
        search_type=search_type,
        geometry_json=json.dumps(geometry_value, separators=(",", ":")),
        radius_m=radius_m,
    )


def is_position(value: Any) -> bool:
    return (
        isinstance(value, list)
        and len(value) >= 2
        and all(
            isinstance(number, (int, float))
            and not isinstance(number, bool)
            and math.isfinite(number)
            for number in value
        )
    )


def count_coordinates(value: Any) -> int:
    if is_position(value):
        return 1
    if isinstance(value, list):
        return sum(count_coordinates(child) for child in value)
    return 0


def reduce_coordinates(value: Any, stride: int) -> Any:
    if is_position(value):
        return value
    if not isinstance(value, list):
        return value
    if not value or is_position(value[0]):
        return reduce_position_sequence(value, stride)
    return [reduce_coordinates(child, stride) for child in value]


def reduce_position_sequence(sequence: list[Any], stride: int) -> list[Any]:
    if len(sequence) <= 2:
        return sequence
    is_ring = sequence[0] == sequence[-1]
    source = sequence[:-1] if is_ring else sequence
    target_size = max(3 if is_ring else 2, math.ceil(len(source) / stride))
    if target_size >= len(source):
        return sequence
    indices = {0, len(source) - 1}
    for position in range(1, target_size - 1):
        indices.add(round(position * (len(source) - 1) / (target_size - 1)))
    reduced = [source[index] for index in sorted(indices)]
    if is_ring:
        reduced.append(reduced[0])
    return reduced
