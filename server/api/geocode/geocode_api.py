from fastapi import APIRouter, Query, HTTPException
from .geocode import geocode_query, reverse_geocode

router = APIRouter(prefix="/api", tags=["geocode"])


@router.get("/geocode")
async def search(q: str = Query(..., min_length=3)):
    """
    Forward geocode: search for locations by query string.
    Returns up to 5 results with {place_id, display_name, lat, lon}.
    """
    try:
        results = await geocode_query(q)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Geocode error: {str(e)}")


@router.get("/reverse-geocode")
async def reverse(lat: float = Query(...), lon: float = Query(...)):
    """
    Reverse geocode: get address for a coordinate.
    Returns {place_id, display_name, lat, lon} or None if not found.
    """
    try:
        result = await reverse_geocode(lat, lon)
        if result is None:
            raise HTTPException(status_code=404, detail="No address found for coordinates")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reverse geocode error: {str(e)}")
