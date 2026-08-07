from typing import Final

import h3

# Approximate padding in degrees (~1 H3 cell diameter) by resolution.
_RES_PAD_DEG: Final[dict[int, float]] = {7: 0.025, 8: 0.0085, 9: 0.0035, 10: 0.0015}
# _RES_PAD_DEG: Final[dict[int, float]] = {7: 0.05, 8: 0.018, 9: 0.007, 10: 0.003}

def bbox_to_h3_cells(
    sw_lat: float,
    sw_lng: float,
    ne_lat: float,
    ne_lng: float,
    resolution: int,
) -> list[str]:
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
        return [str(h3.latlng_to_cell(center_lat, center_lng, resolution))]

    return [str(cell) for cell in cells]


def outer_inner_tiles_for_bbox(
    sw_lat: float,
    sw_lng: float,
    ne_lat: float,
    ne_lng: float,
    resolution: int,
) -> tuple[list[str], list[str]]:
    if sw_lat >= ne_lat or sw_lng >= ne_lng:
        raise ValueError("Invalid bounding box")

    inner_tiles = bbox_to_h3_cells(sw_lat, sw_lng, ne_lat, ne_lng, resolution)
    pad = _RES_PAD_DEG.get(resolution, 0.025)
    outer_tiles = bbox_to_h3_cells(
        sw_lat - pad,
        sw_lng - pad,
        ne_lat + pad,
        ne_lng + pad,
        resolution,
    )
    return outer_tiles, inner_tiles
