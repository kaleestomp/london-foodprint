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
    if zoom <= 10:
        return 7
    if zoom <= 13:
        return 8
    if zoom <= 16:
        return 9
    return 10


def normalize_dimension(value: str | None) -> str:
    if value is None:
        return ""
    return value.strip()


def get_rank_column(score_basis: int) -> str:
    return "wrank_1" if score_basis == 1 else "rank_1"


def h3_cells_for_bbox(sw_lat: float, sw_lng: float, ne_lat: float, ne_lng: float, resolution: int) -> list[str]:
    if sw_lat >= ne_lat or sw_lng >= ne_lng:
        raise HTTPException(status_code=422, detail="Invalid bounding box")

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
