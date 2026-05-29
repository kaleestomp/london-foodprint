import httpx


async def geocode_query(q: str) -> list[dict]:
    """Query Photon (Komoot) and normalise results to {place_id, display_name, lat, lon}."""
    async with httpx.AsyncClient(timeout=8.0) as client:
        resp = await client.get(
            "https://photon.komoot.io/api/",
            params={"q": q, "limit": "5", "lang": "en"},
            headers={"User-Agent": "carbon-rates-engine/1.0 (internal dev tool)"},
        )
    resp.raise_for_status()
    features = resp.json().get("features", [])

    results = []
    for feature in features:
        props = feature.get("properties", {})
        coords = feature.get("geometry", {}).get("coordinates", [0, 0])  # [lon, lat]
        name = props.get("name", "")
        parts = [p for p in [
            name,
            props.get("city") if props.get("city") != name else None,
            props.get("state"),
            props.get("country"),
        ] if p]
        results.append({
            "place_id": props.get("osm_id", 0),
            "display_name": ", ".join(parts),
            "lat": str(coords[1]),
            "lon": str(coords[0]),
        })

    return results


async def reverse_geocode(lat: float, lon: float) -> dict | None:
    """Reverse-geocode a coordinate via Photon and return a single normalised result, or None."""
    async with httpx.AsyncClient(timeout=8.0) as client:
        resp = await client.get(
            "https://photon.komoot.io/reverse",
            params={"lat": str(lat), "lon": str(lon), "limit": "1", "lang": "en"},
            headers={"User-Agent": "carbon-rates-engine/1.0 (internal dev tool)"},
        )
    resp.raise_for_status()
    features = resp.json().get("features", [])
    if not features:
        return None

    props = features[0].get("properties", {})
    coords = features[0].get("geometry", {}).get("coordinates", [lon, lat])
    name = props.get("name", "")
    parts = [p for p in [
        name,
        props.get("city") if props.get("city") != name else None,
        props.get("state"),
        props.get("country"),
    ] if p]
    display_name = ", ".join(parts) if parts else None
    return {
        "place_id": props.get("osm_id", 0),
        "display_name": display_name,
        "lat": str(coords[1]),
        "lon": str(coords[0]),
    }
