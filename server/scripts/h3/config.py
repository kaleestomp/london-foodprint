# H3 resolution 8: edge length ~531 m, hex diameter (vertex-to-vertex) ~1062 m ≈ 1 km
H3_INITIAL_RESOLUTION = 8
SOURCE_CRS = "EPSG:4326"           # H3 operates natively in WGS84
# Official H3 average edge lengths in meters (edge_length == circumradius for H3 hexagons).
H3_EDGE_LENGTH_M = {
    8:   531.415,
    9:   200.821,
    10:   75.864,
    11:   28.827,
    # 12:   10.950,
}
BOUNDARY_JSON_PATH = r"inner_london_boundary.json"
# Reference coordinate for seed ordering: Inner London centroid [lon, lat]
SEED_ORDER_REFERENCE = (-0.0924108873340905, 51.514381685897675)  # (lon, lat)

SATURATION_THRESHOLD = 20   # Subdivide when Places Aggregate count reaches this value
MAX_DEPTH = 3    # res 8 → 9 → 10 → 11

LEVEL_COLORS = {
    0: ("#4C78A8", "#2A5783"),   # blue   – res 8,  ~531 m
    1: ("#F58518", "#B05B08"),   # orange – res 9,  ~201 m
    2: ("#54A24B", "#2D6E28"),   # green  – res 10,  ~76 m
    3: ("#E45756", "#9C1C1B"),   # red    – res 11,  ~29 m
    # 4: ("#B279A2", "#7B3D73"),   # purple – res 12,  ~11 m
}

DELAY = 0.85  # seconds between API calls to respect rate limits
