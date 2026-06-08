import os
import httpx
from server.scripts.load_key.load_key import load_key

FIELD_MASK = ",".join([
    "places.id",
    "places.displayName",
    "places.primaryTypeDisplayName",
    "places.rating",#
    "places.userRatingCount",#
    "places.location",
    "places.shortFormattedAddress",
    "places.googleMapsUri",

    "places.priceRange",#
    "places.priceLevel",#
    "places.websiteUri",#
    "places.businessStatus",
    "places.types",
    "places.primaryType",

    "places.addressComponents",
    "places.addressDescriptor",
    "places.postalAddress",
    "places.regularOpeningHours",
    "places.pureServiceAreaBusiness",
    "places.containingPlaces",
    "places.accessibilityOptions"
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
    load_key()
    API_KEY = os.environ.get("GOOGLE_PLACES_API_KEY")
    if not API_KEY: 
        raise ValueError("No Google API key provided. Set the GOOGLE_PLACES_API_KEY environment variable.")

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            "https://places.googleapis.com/v1/places:searchNearby", 
            json = {
                "includedPrimaryTypes": ["restaurant"],
                # "excludedPrimaryTypes": ["meal_takeaway"], # 286, 255, 204, 174
                "rankPreference": "POPULARITY",
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
        "id": place.get("id"),
        "displayName": place.get("displayName", {}).get("text"),
        "primaryTypeDisplayName": (place.get("primaryTypeDisplayName") or {}).get("text"),
        "rating": place.get("rating"),
        "userRatingCount": place.get("userRatingCount"),
        "location": place.get("location"),          # {"latitude": ..., "longitude": ...}
        "shortFormattedAddress": place.get("shortFormattedAddress"),
        "googleMapsUri": place.get("googleMapsUri"),

        "priceRange": place.get("priceRange"),
        "priceLevel": place.get("priceLevel"),
        "websiteUri": place.get("websiteUri"),
        "businessStatus": place.get("businessStatus"),
        "types": place.get("types"),
        "primaryType": place.get("primaryType"),

        "addressComponents": place.get("addressComponents"),
        "regularOpeningHours": place.get("regularOpeningHours"),
        "pureServiceAreaBusiness": place.get("pureServiceAreaBusiness"),
        "containingPlaces": place.get("containingPlaces"),
        "accessibilityOptions": place.get("accessibilityOptions"),
        "addressDescriptor": place.get("addressDescriptor"),
        "postalAddress": place.get("postalAddress"),
    }
