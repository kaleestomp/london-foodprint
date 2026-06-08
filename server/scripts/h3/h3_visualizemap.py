import folium
import geopandas as gpd
from server.scripts.h3.config import SOURCE_CRS, H3_EDGE_LENGTH_M, H3_INITIAL_RESOLUTION, LEVEL_COLORS

# --- Folium visualization: original seed H3 hex grid ---
def init_map(boundary):
    boundary_geodf = gpd.GeoDataFrame(
        [{"name": "Inner London", "geometry": boundary}],
        geometry="geometry",
        crs=SOURCE_CRS,
    )
    bounds     = boundary_geodf.total_bounds
    center_lat = (bounds[1] + bounds[3]) / 2
    center_lon = (bounds[0] + bounds[2]) / 2

    m = folium.Map(location=[center_lat, center_lon], zoom_start=11, tiles="OpenStreetMap") 
    folium.GeoJson(
        data=boundary_geodf.to_json(),
        name="Inner London boundary",
        style_function=lambda x: {
            "fillColor": "transparent",
            "color": "#111111",
            "weight": 2.5,
            "fillOpacity": 0,
        },
    ).add_to(m)

    return m

def visualize_seed(seed_geodf, boundary, output_path="out/h3hex_seed_map.html"):

    m = init_map(boundary)
    COLOR_CURRENT = "#D62728"
    COLOR_CHECKED = "#4C78A8"
    COLOR_UNCHECKED = "#1A1A1A"

    folium.GeoJson(
        data=seed_geodf.to_json(),
        name=f"Seed H3 cells (res {H3_INITIAL_RESOLUTION}, ~{H3_EDGE_LENGTH_M[H3_INITIAL_RESOLUTION]:.0f} m edge)",
        style_function=lambda feature: {
            "fillColor": COLOR_CURRENT if feature["properties"].get("current") is True else COLOR_CHECKED if feature["properties"].get("checked") is True else COLOR_UNCHECKED,
            "color": COLOR_CURRENT if feature["properties"].get("current") is True else COLOR_CHECKED if feature["properties"].get("checked") is True else COLOR_UNCHECKED,
            "weight": 2 if feature["properties"].get("current") is True or feature["properties"].get("checked") is True else 1,
            "fillOpacity": 0.25 if feature["properties"].get("current") is True or feature["properties"].get("checked") is True else 0.15,
        },
        tooltip=folium.GeoJsonTooltip(
            fields=["tile_path_id", "tile_id", "h3_res", "level", "tile_size_m"],
            aliases=["Path ID", "Tile ID", "H3", "Depth", "Edge (m)"],
        ),
    ).add_to(m)

    # Add Places API search radius circles for seed cells.
    seed_radius = make_search_radius_layer(seed_geodf)
    folium.GeoJson(
        data=seed_radius.to_json(),
        name="search_radius",
        style_function=lambda x: {
            "fillColor": "#FFFFFFFF",
            "color": COLOR_CURRENT if x["properties"].get("current") is True else COLOR_CHECKED if x["properties"].get("checked") is True else COLOR_UNCHECKED,
            "weight": 0.8,
            "fillOpacity": 0.00,
            "dashArray": "6 4",
        },
        tooltip=folium.GeoJsonTooltip(
            fields=["tile_path_id", "tile_id", "h3_res", "tile_size_m"],
            aliases=["Path ID", "Tile ID", "H3", "Search Radius (m)"],
        ),
    ).add_to(m)

    # Add always-visible labels at seed hex centers (hidden from layer toggles).
    label_group = folium.FeatureGroup(name="seed_labels", control=False)
    label_group.add_to(m)
    # Add a label at each seed hex center showing its tile path id.
    for _, row in seed_geodf.iterrows():
        if "center_lat" not in row or "center_lon" not in row:
            continue
        color = COLOR_CURRENT if row['current'] is True else COLOR_CHECKED if row['checked'] is True else COLOR_UNCHECKED
        weight = 800 if row['current'] is True else 600
        font_size = "24px" if row['current'] is True else "12px"
        folium.Marker(
            location=[row["center_lat"], row["center_lon"]],
            icon=folium.DivIcon(
                html=(
                    f"<div style=\"font-size:{font_size};font-weight:{weight};color:{color};"
                    "text-align:center;white-space:nowrap;\">"
                    f"{row['tile_path_id']}"
                    "</div>"
                )
            ),
        ).add_to(label_group)

    folium.LayerControl(collapsed=False).add_to(m)

    m.save(output_path)
    print(f"Saved seed H3 map to: {output_path}")


# --- Folium visualization: mock adaptive H3 subdivision result ---
def visualize_divisions(division_geodf, boundary, output_path="out/h3hex_mock_map.html"):

    m = init_map(boundary)

    # One toggleable layer per depth level
    for level, (fill, stroke) in LEVEL_COLORS.items():
        level_cells = division_geodf[division_geodf["level"] == level]
        if level_cells.empty:
            continue
        res    = H3_INITIAL_RESOLUTION + level
        edge_m = H3_EDGE_LENGTH_M.get(res, 0)

        # Hex polygons
        folium.GeoJson(
            data=level_cells.to_json(),
            name=f"Level {level} - res {res}, ~{edge_m:.0f} m  ({len(level_cells)} cells)",
            style_function=lambda x, f=fill, s=stroke: {
                "fillColor": f if x["properties"].get("result_count", 0) > 0 else "#FFFFFF00",
                "color":     s if x["properties"].get("result_count", 0) < 20 else "#FF1A1AFF",
                "weight":    0.8 if x["properties"].get("result_count", 0) < 20 else 5.6,
                "fillOpacity": 0.25 if x["properties"].get("result_count", 0) < 20 else 0.5,
            },
            tooltip=folium.GeoJsonTooltip(
                fields=["tile_path_id", "tile_id", "h3_res", "level", "tile_size_m", "result_count"],
                aliases=["Path ID", "Tile ID", "H3", "Depth", "Search Radius (m)", "ResultCount"],
            ),
        ).add_to(m)

        # Search radius circles
        level_radius = make_search_radius_layer(level_cells)
        folium.GeoJson(
            data=level_radius.to_json(),
            name=f"search_radius L{level} ({len(level_radius)} circles)",
            style_function=lambda x, f=fill, s=stroke: {
                "fillColor": f,
                "color": s,
                "weight": 1.2 if x["properties"].get("result_count", 0) > 0 else 0.0,
                "fillOpacity": 0.03,
                "dashArray": "6 4",
            },
            tooltip=folium.GeoJsonTooltip(
                fields=["tile_path_id", "tile_id", "h3_res", "tile_size_m", "result_count"],
                aliases=["Path ID", "Tile ID", "H3", "Search Radius (m)", "Results"],
            ),
        ).add_to(m)

    folium.LayerControl(collapsed=False).add_to(m)

    m.save(output_path)
    print(f"Saved mock adaptive H3 map to: {output_path}")

def visualize_progress(geodf, boundary, output_path="out/progress_map.html"):

    m = init_map(boundary)
    COLOR_CURRENT = "#D62728"
    COLOR_SCRUBED = "#4C78A8"
    COLOR_UNCHECKED = "#1A1A1A"

    folium.GeoJson(
        data=geodf.to_json(),
        name=f"Seed H3 cells (res {H3_INITIAL_RESOLUTION}, ~{H3_EDGE_LENGTH_M[H3_INITIAL_RESOLUTION]:.0f} m edge)",
        style_function=lambda feature: {
            "fillColor": COLOR_CURRENT if feature["properties"].get("current") is True else COLOR_SCRUBED if feature["properties"].get("scrubbed") is True else COLOR_UNCHECKED,
            "color": COLOR_CURRENT if feature["properties"].get("current") is True else COLOR_SCRUBED if feature["properties"].get("scrubbed") is True else COLOR_UNCHECKED,
            "weight": 2 if feature["properties"].get("current") is True or feature["properties"].get("scrubbed") is True else 1,
            "fillOpacity": 0.25 if feature["properties"].get("current") is True or feature["properties"].get("scrubbed") is True else 0.15,
        },
        tooltip=folium.GeoJsonTooltip(
            fields=["tile_path_id", "tile_id", "tile_size_m", "result_count", "places_count"],
            aliases=["Path ID", "Tile ID", "Edge (m)", "Expected", "Received"],
        ),
    ).add_to(m)

    # Add always-visible labels at seed hex centers (hidden from layer toggles).
    label_group = folium.FeatureGroup(name="seed_labels", control=False)
    label_group.add_to(m)
    # Add a label at each seed hex center showing its tile path id.
    for _, row in geodf.iterrows():
        if row['places_count'] == 0 or row['current']: 
            continue
        color = COLOR_CURRENT if row['current'] is True else COLOR_SCRUBED if row['places_count'] > 0 else COLOR_UNCHECKED
        folium.Marker(
            location=[row["center_lat"], row["center_lon"]],
            icon=folium.DivIcon(
                html=(
                    f"<div style=\"font-size:14px;font-weight:500;color:{color};"
                    "text-align:center;white-space:nowrap;\">"
                    f"{row['places_count']}"
                    "</div>"
                )
            ),
        ).add_to(label_group)

    folium.LayerControl(collapsed=False).add_to(m)

    m.save(output_path)
    print(f"Saved Progress Map to: {output_path}")


# --- Search radius helper ---
def make_search_radius_layer(cells_gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """
    Build circle geometries representing the Places API search radius per cell.

    For a regular hexagon the circumradius equals the edge length, so a circle
    of radius = edge_length covers all six vertices. A small buffer is added to
    ensure complete coverage regardless of H3's slight non-regularity.

    Buffering is done in EPSG:27700 (British National Grid, metres) for accurate
    metric distances, then reprojected back to WGS84 for Folium.
    """
    cols = [
        "tile_id",
        "tile_path_id",
        "h3_res",
        "level",
        "center_lat",
        "center_lon",
        "tile_size_m",
    ]
    if "result_count" in cells_gdf.columns:
        cols.append("result_count")
    df = cells_gdf[cols].copy()

    pts = gpd.GeoDataFrame(
        df,
        geometry=gpd.points_from_xy(df["center_lon"], df["center_lat"]),
        crs=SOURCE_CRS,
    )
    pts_bng = pts.to_crs("EPSG:27700")
    pts_bng["geometry"] = pts_bng.apply(
        lambda r: r["geometry"].buffer(r["tile_size_m"]), axis=1
    )
    return pts_bng.to_crs(SOURCE_CRS)

