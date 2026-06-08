import os
import httpx
import json
from server.scripts.load_key.load_key import load_key

PLACES_AGGREGATE_ENDPOINT = "https://areainsights.googleapis.com/v1:computeInsights"
SEARCH_TYPES = ["restaurant"]
RESPONSE_CACHE = r"./cache"
DEBUG = False

async def request_aggregate(
    latitude: float,
    longitude: float,
    radius: int = 500,
    cache: str = RESPONSE_CACHE,
) -> int:
    """
    Call Google Places Aggregate API and return the count of matching places.
    This uses INSIGHT_COUNT so we can decide whether to subdivide a tile
    without paying for a full Nearby Search payload.
    """
    load_key()
    api_key = os.environ.get("GOOGLE_PLACES_API_KEY")
    if not api_key:
        raise ValueError("No Google API key provided. Set the GOOGLE_PLACES_API_KEY environment variable.")

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            PLACES_AGGREGATE_ENDPOINT,
            json={
                "insights": ["INSIGHT_COUNT"],
                "filter": {
                    "locationFilter": {
                        "circle": {
                            "latLng": {"latitude": latitude, "longitude": longitude},
                            "radius": radius,
                        }
                    },
                    "typeFilter": {
                        "includedPrimaryTypes": SEARCH_TYPES,
                    },
                },
            },
            headers={
                "Content-Type": "application/json",
                "X-Goog-Api-Key": api_key,
            },
        )

    if resp.is_error:
        if DEBUG:
            print(
                f"Places Aggregate request failed | status={resp.status_code} | ",
                flush=True,
            )
            print(f"Response body: {resp.text}", flush=True)
        resp.raise_for_status()

    payload = resp.json()
    if cache:
        os.makedirs(cache, exist_ok=True)
        json.dump(payload, open(os.path.join(cache, f"AG_{latitude}-{longitude}-{radius}.json"), "w"), indent=2)
    # API returns count as string in examples; guard both string/int.
    return int(payload.get("count", -1))