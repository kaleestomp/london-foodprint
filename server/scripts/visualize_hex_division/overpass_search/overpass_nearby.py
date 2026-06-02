from __future__ import annotations

import math
from typing import Any

import requests


OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter"


def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return great-circle distance in meters between two WGS84 points."""
    r = 6371000.0
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)

    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def build_overpass_nearby_query(lat: float, lon: float, radius_m: int, category: str = "restaurant") -> str:
    """Build an Overpass QL query for nearby amenity search."""
    # Query nodes, ways and relations. Ways/relations return representative center points.
    return f"""
[out:json][timeout:25];
(
  node(around:{radius_m},{lat},{lon})["amenity"="{category}"];
  way(around:{radius_m},{lat},{lon})["amenity"="{category}"];
  relation(around:{radius_m},{lat},{lon})["amenity"="{category}"];
);
out center tags;
""".strip()


def overpass_nearby_search(
    lat: float,
    lon: float,
    radius_m: int,
    category: str = "restaurant",
    limit: int = 20,
    endpoint: str = OVERPASS_ENDPOINT,
    timeout_s: int = 45,
) -> list[dict[str, Any]]:
    """
    Nearby search using Overpass with a hard client-side cap.

    Why this is useful for adaptive subdivision:
    - Returns at most `limit` items, so behavior can mimic Google Nearby cap logic.
    - If returned count == limit, treat tile as potentially saturated and subdivide.

    Returned fields per item:
    - osm_type, osm_id, place_id, name, amenity, lat, lon, distance_m, tags
    """
    if limit <= 0:
        return []

    query = build_overpass_nearby_query(lat=lat, lon=lon, radius_m=radius_m, category=category)
    headers = {"User-Agent": "london-explorer-overpass-test/1.0"}
    response = requests.post(endpoint, data={"data": query}, headers=headers, timeout=timeout_s)
    response.raise_for_status()

    payload = response.json()
    elements = payload.get("elements", [])

    items: list[dict[str, Any]] = []
    for el in elements:
        el_type = el.get("type")
        el_id = el.get("id")
        tags = el.get("tags", {}) or {}

        # Nodes have lat/lon directly. Ways/relations provide center in this query.
        el_lat = el.get("lat")
        el_lon = el.get("lon")
        if el_lat is None or el_lon is None:
            center = el.get("center", {})
            el_lat = center.get("lat")
            el_lon = center.get("lon")

        if el_lat is None or el_lon is None or el_type is None or el_id is None:
            continue

        distance_m = _haversine_m(lat, lon, float(el_lat), float(el_lon))
        items.append(
            {
                "osm_type": el_type,
                "osm_id": el_id,
                "place_id": f"osm:{el_type}:{el_id}",
                "name": tags.get("name"),
                "amenity": tags.get("amenity"),
                "lat": float(el_lat),
                "lon": float(el_lon),
                "distance_m": round(distance_m, 2),
                "tags": tags,
            }
        )

    # Deterministic ordering and hard cap.
    items.sort(key=lambda x: x["distance_m"])
    return items[:limit]


def is_tile_saturated(results: list[dict[str, Any]], limit: int = 20) -> bool:
    """Helper for adaptive splitting rule."""
    return len(results) >= limit
