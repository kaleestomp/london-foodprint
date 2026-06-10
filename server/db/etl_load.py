"""
ETL: Load server/out/places.csv → Neon cloud DB
------------------------------------------------
Run from the server/ directory:
    python db/etl_load.py

Requires in venv:
    pip install psycopg2-binary python-dotenv h3 pandas
"""

import itertools
import os
import sys
from pathlib import Path

import h3
import pandas as pd
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

# ─── Config ──────────────────────────────────────────────────────────────────

HERE = Path(__file__).resolve().parent        # server/db/
SERVER_ROOT = HERE.parent                     # server/
PLACES_CSV = SERVER_ROOT / "out" / "places.csv"

load_dotenv(SERVER_ROOT.parent / ".env")      # repo root .env
DATABASE_URL = os.environ["DATABASE_URL"]     # set in .env

LOCAL_TILE_RES = 10    # cloud DB stores res 10 tiles; use res 10 when available
H3_RESOLUTIONS = [7, 8, 9, 10]

PRICE_BAND_FROM_PRICE_LEVEL = {
    "PRICE_LEVEL_FREE":           "<20",
    "PRICE_LEVEL_INEXPENSIVE":    "<20",
    "PRICE_LEVEL_MODERATE":       "<50",
    "PRICE_LEVEL_EXPENSIVE":      "<100",
    "PRICE_LEVEL_VERY_EXPENSIVE": "100+",
}

PRICE_BAND_FROM_COST = {
    "<10": "<20",
    "10+": "<20",
    "20+": "<50",
    "40+": "<100",
    "50+": "<100",
    "100+": "100+",
}


def _first_existing_column(frame: pd.DataFrame, candidates: list[str]) -> str | None:
    for name in candidates:
        if name in frame.columns:
            return name
    return None


def _to_bool_series(series: pd.Series) -> pd.Series:
    true_values = {"true", "1", "yes", "y", "t"}
    false_values = {"false", "0", "no", "n", "f"}

    def convert(value):
        if pd.isna(value):
            return None
        if isinstance(value, bool):
            return value
        text = str(value).strip().lower()
        if text in true_values:
            return True
        if text in false_values:
            return False
        return None

    return series.apply(convert)


def _to_text_or_none(value):
    if pd.isna(value):
        return None
    text = str(value).strip()
    return text if text else None


def _coerce_h3_to_res10(tile_value):
    tile = _to_text_or_none(tile_value)
    if tile is None:
        return None
    try:
        res = h3.get_resolution(tile)
        if res == LOCAL_TILE_RES:
            return tile
        if res < LOCAL_TILE_RES:
            return h3.cell_to_center_child(tile, LOCAL_TILE_RES)
        return h3.cell_to_parent(tile, LOCAL_TILE_RES)
    except Exception:
        return None

# ─── Load & transform ────────────────────────────────────────────────────────

print("Loading places.csv …")
df = pd.read_csv(PLACES_CSV)
print(f"  {len(df):,} rows loaded")

display_col = _first_existing_column(df, ["displayName", "display_name"])
lat_col = _first_existing_column(df, ["lat"])
lon_col = _first_existing_column(df, ["lon"])

if display_col is None or lat_col is None or lon_col is None:
    print("Missing required columns. Need displayName/display_name, lat, lon.")
    sys.exit(1)

cost_col = _first_existing_column(df, ["cost"])
price_level_col = _first_existing_column(df, ["priceLevel"])

if cost_col:
    cost_series = df[cost_col].apply(_to_text_or_none)
else:
    cost_series = pd.Series([None] * len(df), index=df.index)

if price_level_col:
    mapped_from_price_level = df[price_level_col].map(PRICE_BAND_FROM_PRICE_LEVEL)
else:
    mapped_from_price_level = pd.Series([None] * len(df), index=df.index)

mapped_from_cost = cost_series.map(PRICE_BAND_FROM_COST)
price_band_series = mapped_from_cost.combine_first(mapped_from_price_level).fillna("")

tile_res10_col = _first_existing_column(df, ["h3_res10"])
tile_res9_col = _first_existing_column(df, ["h3_res9"])

if tile_res10_col is not None:
    tile_r10 = df[tile_res10_col].apply(_coerce_h3_to_res10)
elif tile_res9_col is not None:
    tile_r10 = df[tile_res9_col].apply(_coerce_h3_to_res10)
else:
    print("Missing H3 columns. Need one of: h3_res10 or h3_res9.")
    sys.exit(1)

if tile_res10_col is not None:
    h3_res10_series = df[tile_res10_col].apply(_to_text_or_none)
else:
    h3_res10_series = tile_r10

if tile_res9_col is not None:
    h3_res9_series = df[tile_res9_col].apply(_to_text_or_none)
else:
    h3_res9_series = h3_res10_series.apply(
        lambda tile: _to_text_or_none(h3.cell_to_parent(tile, 9)) if tile else None
    )

df_std = pd.DataFrame(index=df.index)
df_std["id"] = df["id"].apply(_to_text_or_none)
df_std["display_name"] = df[display_col].apply(_to_text_or_none)
df_std["primary_type_display_name"] = (
    df[_first_existing_column(df, ["primaryTypeDisplayName"])]
    if _first_existing_column(df, ["primaryTypeDisplayName"]) else None
)
if "primary_type_display_name" in df_std:
    df_std["primary_type_display_name"] = df_std["primary_type_display_name"].apply(_to_text_or_none)
df_std["lat"] = pd.to_numeric(df[lat_col], errors="coerce")
df_std["lon"] = pd.to_numeric(df[lon_col], errors="coerce")
df_std["h3_res10"] = tile_r10
df_std["h3_res9"] = h3_res9_series
df_std["types"] = df[_first_existing_column(df, ["types"])].apply(_to_text_or_none) if _first_existing_column(df, ["types"]) else None
df_std["primary_type"] = df[_first_existing_column(df, ["primaryType", "primary_type"])].apply(_to_text_or_none) if _first_existing_column(df, ["primaryType", "primary_type"]) else None
df_std["cuisine_type"] = (
    df[_first_existing_column(df, ["cuisineType", "cuisine_type"])].fillna("")
    if _first_existing_column(df, ["cuisineType", "cuisine_type"]) else ""
)
df_std["venue_type"] = df[_first_existing_column(df, ["venueType", "venue_type"])].apply(_to_text_or_none) if _first_existing_column(df, ["venueType", "venue_type"]) else None
df_std["predicted_type"] = df[_first_existing_column(df, ["predictedType", "predicted_type"])].apply(_to_text_or_none) if _first_existing_column(df, ["predictedType", "predicted_type"]) else None
df_std["price_band"] = price_band_series
df_std["cost"] = cost_series
df_std["is_chain"] = _to_bool_series(df[_first_existing_column(df, ["is_chain", "isChain"])] if _first_existing_column(df, ["is_chain", "isChain"]) else pd.Series([None] * len(df), index=df.index))
df_std["wheelchair_access"] = _to_bool_series(df[_first_existing_column(df, ["wheelchairAccess", "wheelchair_access"])] if _first_existing_column(df, ["wheelchairAccess", "wheelchair_access"]) else pd.Series([None] * len(df), index=df.index))
df_std["operational"] = _to_bool_series(df[_first_existing_column(df, ["operational"])] if _first_existing_column(df, ["operational"]) else pd.Series([None] * len(df), index=df.index))
df_std["rating"] = pd.to_numeric(df[_first_existing_column(df, ["rating"])], errors="coerce") if _first_existing_column(df, ["rating"]) else None
df_std["user_rating_count"] = pd.to_numeric(df[_first_existing_column(df, ["userRatingCount", "user_rating_count"])], errors="coerce") if _first_existing_column(df, ["userRatingCount", "user_rating_count"]) else None
df_std["p_local"] = pd.to_numeric(df[_first_existing_column(df, ["p_local"])], errors="coerce") if _first_existing_column(df, ["p_local"]) else None
df_std["competition_factor"] = pd.to_numeric(df[_first_existing_column(df, ["competition_factor"])], errors="coerce") if _first_existing_column(df, ["competition_factor"]) else None
df_std["representations"] = pd.to_numeric(df[_first_existing_column(df, ["representations"])], errors="coerce") if _first_existing_column(df, ["representations"]) else None

for metric_col in [
    "wilson_0", "normal_0", "wilson_1", "normal_1", "wilson_2", "normal_2",
    "boosted_0", "bnormal_0", "boosted_1", "bnormal_1", "boosted_2", "bnormal_2",
]:
    if metric_col in df.columns:
        df_std[metric_col] = pd.to_numeric(df[metric_col], errors="coerce")
    else:
        df_std[metric_col] = None

df_std["pcd"] = df[_first_existing_column(df, ["pcd"])].apply(_to_text_or_none) if _first_existing_column(df, ["pcd"]) else None
df_std["areacode"] = df[_first_existing_column(df, ["areacode"])].apply(_to_text_or_none) if _first_existing_column(df, ["areacode"]) else None
df_std["address"] = df[_first_existing_column(df, ["shortFormattedAddress", "address"])] if _first_existing_column(df, ["shortFormattedAddress", "address"]) else None
if "address" in df_std:
    df_std["address"] = df_std["address"].apply(_to_text_or_none)
df_std["google_maps_uri"] = df[_first_existing_column(df, ["googleMapsUri", "google_maps_uri"])].apply(_to_text_or_none) if _first_existing_column(df, ["googleMapsUri", "google_maps_uri"]) else None
df_std["website_uri"] = df[_first_existing_column(df, ["websiteUri", "website_uri"])].apply(_to_text_or_none) if _first_existing_column(df, ["websiteUri", "website_uri"]) else None

before_rows = len(df_std)
df_std = df_std.dropna(subset=["id", "display_name", "lat", "lon", "h3_res10"])
removed_rows = before_rows - len(df_std)
if removed_rows:
    print(f"  Dropped {removed_rows:,} rows with missing required fields")

# ─── Build h3_density aggregation ────────────────────────────────────────────

print("Pre-aggregating h3_density …")

cuisines = [c for c in df_std["cuisine_type"].unique() if c] + [""]
bands    = ["<20", "<50", "<100", "100+", ""]

density_rows = []
for res in H3_RESOLUTIONS:
    col = f"t{res}"
    # h3_res10 is already res 10; cell_to_parent only works for coarser res
    df_std[col] = df_std["h3_res10"].apply(
        lambda t, r=res: t if r == LOCAL_TILE_RES else h3.cell_to_parent(t, r)
    )
    for cuisine, band in itertools.product(cuisines, bands):
        mask = pd.Series([True] * len(df_std), index=df_std.index)
        if cuisine:
            mask &= df_std["cuisine_type"] == cuisine
        if band:
            mask &= df_std["price_band"] == band
        agg = (
            df_std[mask]
            .groupby(col)
            .size()
            .reset_index(name="count")
        )
        agg["resolution"]   = res
        agg["cuisine_type"] = cuisine
        agg["price_band"]   = band
        density_rows.append(agg.rename(columns={col: "tile"}))
    print(f"  res {res} done ({len(df_std[col].unique())} unique tiles)")

density_df = pd.concat(density_rows, ignore_index=True) if density_rows else pd.DataFrame(
    columns=["tile", "count", "resolution", "cuisine_type", "price_band"]
)
print(f"  {len(density_df):,} h3_density rows total")

# ─── Upload ──────────────────────────────────────────────────────────────────

print("Connecting to Neon …")
conn = psycopg2.connect(DATABASE_URL)
cur  = conn.cursor()

# -- places --
print("Inserting places …")
places_records = [
    (
        row["id"],
        row["display_name"],
        row["primary_type_display_name"],
        float(row["lat"]),
        float(row["lon"]),
        row["h3_res9"],
        row["h3_res10"],
        row["types"],
        row["primary_type"],
        row["cuisine_type"] if row["cuisine_type"] else None,
        row["venue_type"],
        row["predicted_type"],
        row["price_band"] if row["price_band"] else None,
        row["cost"],
        row["is_chain"],
        row["wheelchair_access"],
        row["operational"],
        float(row["rating"]) if pd.notna(row["rating"]) else None,
        int(row["user_rating_count"]) if pd.notna(row["user_rating_count"]) else None,
        float(row["p_local"]) if pd.notna(row["p_local"]) else None,
        float(row["competition_factor"]) if pd.notna(row["competition_factor"]) else None,
        int(row["representations"]) if pd.notna(row["representations"]) else None,
        float(row["wilson_0"]) if pd.notna(row["wilson_0"]) else None,
        float(row["normal_0"]) if pd.notna(row["normal_0"]) else None,
        float(row["wilson_1"]) if pd.notna(row["wilson_1"]) else None,
        float(row["normal_1"]) if pd.notna(row["normal_1"]) else None,
        float(row["wilson_2"]) if pd.notna(row["wilson_2"]) else None,
        float(row["normal_2"]) if pd.notna(row["normal_2"]) else None,
        float(row["boosted_0"]) if pd.notna(row["boosted_0"]) else None,
        float(row["bnormal_0"]) if pd.notna(row["bnormal_0"]) else None,
        float(row["boosted_1"]) if pd.notna(row["boosted_1"]) else None,
        float(row["bnormal_1"]) if pd.notna(row["bnormal_1"]) else None,
        float(row["boosted_2"]) if pd.notna(row["boosted_2"]) else None,
        float(row["bnormal_2"]) if pd.notna(row["bnormal_2"]) else None,
        row["pcd"],
        row["areacode"],
        row["address"],
        row["google_maps_uri"],
        row["website_uri"],
    )
    for _, row in df_std.iterrows()
]

psycopg2.extras.execute_values(
    cur,
    """
    INSERT INTO places (
        id, display_name, primary_type_display_name, lat, lon,
        h3_res9, h3_res10, types, primary_type,
        cuisine_type, venue_type, predicted_type,
        price_band, cost, is_chain, wheelchair_access, operational,
        rating, user_rating_count,
        p_local, competition_factor, representations,
        wilson_0, normal_0, wilson_1, normal_1, wilson_2, normal_2,
        boosted_0, bnormal_0, boosted_1, bnormal_1, boosted_2, bnormal_2,
        pcd, areacode, address, google_maps_uri, website_uri
    ) VALUES %s
    ON CONFLICT (id) DO UPDATE SET
        display_name      = EXCLUDED.display_name,
        primary_type_display_name = EXCLUDED.primary_type_display_name,
        h3_res9           = EXCLUDED.h3_res9,
        h3_res10          = EXCLUDED.h3_res10,
        types             = EXCLUDED.types,
        primary_type      = EXCLUDED.primary_type,
        cuisine_type      = EXCLUDED.cuisine_type,
        venue_type        = EXCLUDED.venue_type,
        predicted_type    = EXCLUDED.predicted_type,
        price_band        = EXCLUDED.price_band,
        cost              = EXCLUDED.cost,
        is_chain          = EXCLUDED.is_chain,
        wheelchair_access = EXCLUDED.wheelchair_access,
        operational       = EXCLUDED.operational,
        rating            = EXCLUDED.rating,
        user_rating_count = EXCLUDED.user_rating_count,
        p_local           = EXCLUDED.p_local,
        competition_factor = EXCLUDED.competition_factor,
        representations   = EXCLUDED.representations,
        wilson_0          = EXCLUDED.wilson_0,
        normal_0          = EXCLUDED.normal_0,
        wilson_1          = EXCLUDED.wilson_1,
        normal_1          = EXCLUDED.normal_1,
        wilson_2          = EXCLUDED.wilson_2,
        normal_2          = EXCLUDED.normal_2,
        boosted_0         = EXCLUDED.boosted_0,
        bnormal_0         = EXCLUDED.bnormal_0,
        boosted_1         = EXCLUDED.boosted_1,
        bnormal_1         = EXCLUDED.bnormal_1,
        boosted_2         = EXCLUDED.boosted_2,
        bnormal_2         = EXCLUDED.bnormal_2,
        pcd               = EXCLUDED.pcd,
        areacode          = EXCLUDED.areacode,
        address           = EXCLUDED.address,
        google_maps_uri   = EXCLUDED.google_maps_uri,
        website_uri       = EXCLUDED.website_uri
    """,
    places_records,
    page_size=500,
)
print(f"  {len(places_records):,} places upserted")

# -- h3_density --
print("Inserting h3_density …")
density_records = [
    (
        str(row["tile"]),
        int(row["resolution"]),
        str(row["cuisine_type"]),
        str(row["price_band"]),
        int(row["count"]),
    )
    for _, row in density_df.iterrows()
]

psycopg2.extras.execute_values(
    cur,
    """
    INSERT INTO h3_density (tile, resolution, cuisine_type, price_band, count)
    VALUES %s
    ON CONFLICT (tile, resolution, cuisine_type, price_band) DO UPDATE SET
        count = EXCLUDED.count
    """,
    density_records,
    page_size=1000,
)
print(f"  {len(density_records):,} density rows upserted")

conn.commit()
cur.close()
conn.close()
print("Done.")
