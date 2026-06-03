import folium
import geopandas as gpd
from config import SOURCE_CRS, H3_EDGE_LENGTH_M, H3_INITIAL_RESOLUTION, LEVEL_COLORS

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

def visualize_seed(seed_geodf, boundary):

    m = init_map(boundary)

    folium.GeoJson(
        data=seed_geodf.to_json(),
        name=f"Seed H3 cells (res {H3_INITIAL_RESOLUTION}, ~{H3_EDGE_LENGTH_M[H3_INITIAL_RESOLUTION]:.0f} m edge)",
        style_function=lambda x: {
            "fillColor": "#4C78A8",
            "color": "#2A5783",
            "weight": 1,
            "fillOpacity": 0.15,
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
            "fillColor": "#4C78A8",
            "color": "#2A5783",
            "weight": 1.2,
            "fillOpacity": 0.04,
            "dashArray": "6 4",
        },
        tooltip=folium.GeoJsonTooltip(
            fields=["tile_path_id", "tile_id", "h3_res", "tile_size_m"],
            aliases=["Path ID", "Tile ID", "H3", "Search Radius (m)"],
        ),
    ).add_to(m)

    folium.LayerControl(collapsed=False).add_to(m)

    output_path = "out/h3hex_seed_map.html"
    m.save(output_path)
    print(f"Saved seed H3 map to: {output_path}")

# --- Folium visualization: mock adaptive H3 subdivision result ---
def visualize_divisions(division_geodf, boundary):

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
                "fillColor": f,
                "color":     s,
                "weight":    0.8,
                "fillOpacity": 0.25,
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
                "weight": 1.2,
                "fillOpacity": 0.03,
                "dashArray": "6 4",
            },
            tooltip=folium.GeoJsonTooltip(
                fields=["tile_path_id", "tile_id", "h3_res", "tile_size_m"],
                aliases=["Path ID", "Tile ID", "H3", "Search Radius (m)"],
            ),
        ).add_to(m)

    folium.LayerControl(collapsed=False).add_to(m)

    output_path2 = "out/h3hex_mock_map.html"
    m.save(output_path2)
    print(f"Saved mock adaptive H3 map to: {output_path2}")


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

