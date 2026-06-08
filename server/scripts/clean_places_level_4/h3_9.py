from pathlib import Path

import pandas as pd
import folium

# Support both h3-py v4 and older v3 style imports.
try:
    import h3
    H3_V4 = hasattr(h3, "cell_to_children")
except Exception:
    from h3 import h3 as h3v3
    h3 = h3v3
    H3_V4 = False


def h3_children(cell_id: str, target_res: int) -> list[str]:
    if H3_V4:
        current_res = h3.get_resolution(cell_id)
    else:
        current_res = h3.h3_get_resolution(cell_id)

    if current_res == target_res:
        return [cell_id]

    if current_res > target_res:
        if H3_V4:
            return [h3.cell_to_parent(cell_id, target_res)]
        return [h3.h3_to_parent(cell_id, target_res)]

    cells = [cell_id]
    for res in range(current_res + 1, target_res + 1):
        next_cells = []
        for c in cells:
            if H3_V4:
                next_cells.extend(list(h3.cell_to_children(c, res)))
            else:
                next_cells.extend(list(h3.h3_to_children(c, res)))
        cells = next_cells
    return cells


def h3_boundary_latlon(cell_id: str) -> list[list[float]]:
    if H3_V4:
        boundary = h3.cell_to_boundary(cell_id)
    else:
        boundary = h3.h3_to_geo_boundary(cell_id, geo_json=True)

    # Folium expects [lat, lon]
    points = [[lat, lon] for lat, lon in boundary]
    if points and points[0] != points[-1]:
        points.append(points[0])
    return points


def h3_center(cell_id: str) -> tuple[float, float]:
    if H3_V4:
        return h3.cell_to_latlng(cell_id)
    return h3.h3_to_geo(cell_id)
