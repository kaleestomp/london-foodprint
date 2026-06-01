import os
import httpx
FIELD_MASK = ",".join([
    "places.id",
    "places.displayName",
    "places.primaryTypeDisplayName",
    "places.rating",
    "places.userRatingCount",
    "places.location",
    "places.shortFormattedAddress",
    "places.googleMapsUri",

    "places.priceRange",
    "places.priceLevel",
    "places.websiteUri",
    "places.businessStatus",
    "places.types",
    "places.primaryType",
])

async def nearby_search(
    latitude: float,
    longitude: float,
    radius: float = 500.0,
) -> list[dict]:
    """
    Call the Google Places API (New) Nearby Search endpoint and return a
    normalised list of place dicts.

    Args:
        latitude:           Centre latitude.
        longitude:          Centre longitude.
        radius:             Search radius in metres (max 50 000).

    Returns:
        List of normalised place dicts.
    """
    API_KEY = os.environ.get("GOOGLE_PLACES_API_KEY")
    if not API_KEY: 
        raise ValueError("No Google API key provided. Set the GOOGLE_PLACES_API_KEY environment variable.")

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            "https://places.googleapis.com/v1/places:searchNearby", 
            json = {
                "includedPrimaryTypes": ["restaurant"],
                "maxResultCount": 20,
                "locationRestriction": {
                    "circle": {
                        "center": {"latitude": latitude, "longitude": longitude},
                        "radius": radius,
                    }
                },
            }, 
            headers = {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": API_KEY,
                "X-Goog-FieldMask": FIELD_MASK,
            }
        )

    resp.raise_for_status()
    places = resp.json().get("places", [])
    return [_normalise(p) for p in places]

def _normalise(place: dict) -> dict:
    return {
        "place_id": place.get("id"),
        "name": place.get("displayName", {}).get("text"),
        "type": (place.get("primaryTypeDisplayName") or {}).get("text"),
        "rating": place.get("rating"),
        "user_ratings_total": place.get("userRatingCount"),
        "location": place.get("location"),          # {"latitude": ..., "longitude": ...}
        "address": place.get("shortFormattedAddress"),
        "maps_url": place.get("googleMapsUri"),

        "price_range": place.get("priceRange"),
        "price_level": place.get("priceLevel"),
        "website": place.get("websiteUri"),
        "business_status": place.get("businessStatus"),
        "types": place.get("types"),
        "primary_type": place.get("primaryType"),
    }