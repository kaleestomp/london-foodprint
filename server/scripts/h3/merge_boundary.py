import geopandas as gpd
import pandas as pd

def merge_boundaries(json_files, output_path="boundary.json"):
    boundaries = gpd.GeoDataFrame(
        pd.concat([gpd.read_file(path) for path in json_files], ignore_index=True),
        crs=gpd.read_file(json_files[0]).crs,
    )

    merged_boundary = gpd.GeoDataFrame(
        geometry=[boundaries.geometry.union_all()],
        crs=boundaries.crs,
    )

    # merged_boundary.to_file("boundary.json", driver="GeoJSON")
    with open(output_path, "w") as f:
        f.write(merged_boundary.to_json())