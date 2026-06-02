import h3                           # pip install h3
from shapely.geometry import Polygon, mapping

# --- H3 API compatibility wrappers (handles both h3-py v3 and v4) ---
def _h3_polyfill(poly, resolution: int) -> set:
    """Fill a shapely Polygon (WGS84) with H3 cell IDs."""
    geo = mapping(poly)  # GeoJSON dict: coordinates in [lng, lat] order
    try:
        return set(h3.geo_to_cells(geo, resolution))  # h3-py v4
    except AttributeError:
        return set(h3.polyfill(geo, resolution, geo_json_conformant=True))  # h3-py v3

def _h3_cell_to_shapely(cell_id: str) -> Polygon:
    """Convert an H3 cell to a Shapely Polygon in WGS84."""
    try:
        boundary = h3.cell_to_boundary(cell_id)  # v4 -> [(lat, lng), ...]
    except AttributeError:
        boundary = h3.h3_to_geo_boundary(cell_id)  # v3 -> [(lat, lng), ...]
    return Polygon([(lng, lat) for lat, lng in boundary])  # shapely wants (lng, lat)

def _h3_cell_center(cell_id: str) -> tuple:
    """Return (lat, lng) center of an H3 cell."""
    try:
        return h3.cell_to_latlng(cell_id)  # v4
    except AttributeError:
        return h3.h3_to_geo(cell_id)  # v3

def _h3_get_children(cell_id: str, child_res: int) -> set:
    """Return the ~7 child H3 cells at child_res."""
    try:
        return set(h3.cell_to_children(cell_id, child_res))  # v4
    except AttributeError:
        return set(h3.h3_to_children(cell_id, child_res))  # v3

