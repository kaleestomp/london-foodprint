import math
import folium
import geopandas as gpd
from shapely.geometry import Polygon
from server.scripts.h3.h3_api import _h3_polyfill, _h3_cell_to_shapely, _h3_cell_center
from server.scripts.h3.config import SOURCE_CRS, H3_EDGE_LENGTH_M, H3_INITIAL_RESOLUTION, SEED_ORDER_REFERENCE

# --- Load preformatted Inner London boundary & generate seed H3 cells ---
def init_h3(boundary):
    seed_cells = get_seed_cells(boundary, H3_INITIAL_RESOLUTION)
    seed_cells['children'] = 0
    seed_cells['checked'] = False
    seed_cells['fetch_success'] = None
    seed_cells['fetch_success'] = seed_cells['fetch_success'].astype(bool)
    seed_cells['current'] = False

    return seed_cells

def get_seed_cells(union_wgs84, resolution: int, bbox_buffer_deg: float = 0.03) -> gpd.GeoDataFrame:
    """
    Generate boundary-covering seed H3 cells for Inner London.

    Why not plain polyfill-only:
    - H3 polyfill is center-based, so edge cells whose centers are just outside
      the polygon can be missed.

    Strategy used:
    1) Build candidate cells from a buffered bounding box around the union.
    2) Keep only cells whose hex polygon intersects the union boundary polygon.

    Additional hierarchical ID definition:
    - Each level-1 (seed) tile gets `root_tile_id` as an integer index.
    - `tile_path_id` format is root-child-child... using child index 0..6.
      Examples: "12", "12-3", "12-3-6".
    - Level-1 IDs are associated to actual location via root_center_lat/lon.
    """
    minx, miny, maxx, maxy = union_wgs84.bounds
    bbox_poly = Polygon(
        [
            (minx - bbox_buffer_deg, miny - bbox_buffer_deg),
            (maxx + bbox_buffer_deg, miny - bbox_buffer_deg),
            (maxx + bbox_buffer_deg, maxy + bbox_buffer_deg),
            (minx - bbox_buffer_deg, maxy + bbox_buffer_deg),
        ]
    )

    candidate_cells = _h3_polyfill(bbox_poly, resolution)

    # Keep boundary-covering cells and sort deterministically.
    intersecting_cells = []
    for cell_id in candidate_cells:
        geom = _h3_cell_to_shapely(cell_id)
        if geom.intersects(union_wgs84):
            intersecting_cells.append((cell_id, geom))
    # Sort by distance from the reference coordinate so seed_index 0 is closest to centre.
    ref_lon, ref_lat = SEED_ORDER_REFERENCE
    intersecting_cells.sort(key=lambda x: get_distance(
        ref_lat, ref_lon,
        *_h3_cell_center(x[0])   # _h3_cell_center returns (lat, lng) — matches lat2, lon2
    ))

    edge_m = H3_EDGE_LENGTH_M.get(resolution, 0)
    rows = []
    for root_idx, (cell_id, geom) in enumerate(intersecting_cells):
        lat, lng = _h3_cell_center(cell_id)
        rows.append(
            {
                "tile_id": cell_id,                 # actual H3 id
                "seed_index": root_idx,             # distance-ordered seed position (0 = closest to centre)
                "tile_path_id": str(root_idx),      # path id x-x-x...

                "h3_res": resolution,
                "level": 0,
                "center_lat": lat,
                "center_lon": lng,
                "tile_size_m": edge_m, 
                "geometry": geom,
            }
        )
    
    seed_geodf = gpd.GeoDataFrame(rows, geometry="geometry", crs=SOURCE_CRS)
    
    return seed_geodf

def get_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Haversine great-circle distance in metres between two WGS84 coordinates.

    Parameters
    ----------
    lat1, lon1 : origin (degrees)
    lat2, lon2 : destination (degrees)
    """
    R = 6_371_000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))

