from fastapi import HTTPException

from api.map_util.tile_snapping import outer_inner_tiles_for_bbox

PAGE_SIZE_ON_ZOOM = 20
PAGE_SIZE_ON_REQUEST = 200

def zoom_to_resolution(zoom: int) -> int:
    if zoom <= 9:
        return 7
    if zoom <= 12:
        return 8
    if zoom <= 15:
        return 9
    return 10

def h3_cells_for_bbox(
    sw_lat: float,
    sw_lng: float,
    ne_lat: float,
    ne_lng: float,
    resolution: int,
) -> tuple[list[str], list[str]]:
    """Return (outer_tiles, inner_tiles) for the viewport.

    outer_tiles — tiles fully contained *or* intersecting the viewport (padded bbox).
                  Used for the h3_density heatmap query so there are no edge gaps.
    inner_tiles — tiles covering only the original viewport (no padding).
                  Used to sum the place count threshold for the places fallback.
    """
    try:
        return outer_inner_tiles_for_bbox(sw_lat, sw_lng, ne_lat, ne_lng, resolution)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
