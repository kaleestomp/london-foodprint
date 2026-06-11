import h3
from fastapi import HTTPException

RANK_THRESHOLD_MAP = {
    0: 0.0,
    2: 0.5,
    3: 0.75,
    4: 0.9,
}

PAGE_SIZE = 20


def zoom_to_resolution(zoom: int) -> int:
    if zoom <= 11:
        return 7
    if zoom <= 14:
        return 8
    if zoom <= 17:
        return 9
    return 10


def normalize_dimension(value: str | None) -> str:
    if value is None:
        return ""
    return value.strip()


def get_rank_column(score_basis: int) -> str:
    return "wrank_1" if score_basis == 1 else "rank_1"


# Approximate padding in degrees to add around the viewport so that tiles
# intersecting the edge are included in the heatmap query.
# Values are ~1 H3 cell diameter per resolution level.
_RES_PAD_DEG = {7: 0.05, 8: 0.018, 9: 0.007, 10: 0.003}


def _bbox_to_cells(sw_lat: float, sw_lng: float, ne_lat: float, ne_lng: float, resolution: int) -> list[str]:
    """Return H3 cells covering the given bounding box at *resolution*."""
    polygon = {
        "type": "Polygon",
        "coordinates": [[
            [sw_lng, sw_lat],
            [ne_lng, sw_lat],
            [ne_lng, ne_lat],
            [sw_lng, ne_lat],
            [sw_lng, sw_lat],
        ]],
    }
    try:
        cells = h3.geo_to_cells(polygon, resolution)
    except AttributeError:
        cells = h3.polygon_to_cells(polygon, resolution)

    if not cells:
        center_lat = (sw_lat + ne_lat) / 2
        center_lng = (sw_lng + ne_lng) / 2
        return [h3.latlng_to_cell(center_lat, center_lng, resolution)]

    return [str(cell) for cell in cells]


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
    if sw_lat >= ne_lat or sw_lng >= ne_lng:
        raise HTTPException(status_code=422, detail="Invalid bounding box")

    inner_tiles = _bbox_to_cells(sw_lat, sw_lng, ne_lat, ne_lng, resolution)

    pad = _RES_PAD_DEG.get(resolution, 0.05)
    outer_tiles = _bbox_to_cells(
        sw_lat - pad, sw_lng - pad,
        ne_lat + pad, ne_lng + pad,
        resolution,
    )

    return outer_tiles, inner_tiles
