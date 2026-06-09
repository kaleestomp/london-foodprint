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

LOCAL_TILE_RES = 10    # upgrade local_tile from res 9 → res 10 for cloud DB
H3_RESOLUTIONS = [7, 8, 9, 10]

PRICE_BAND_MAP = {
    "PRICE_LEVEL_FREE":           "<20",
    "PRICE_LEVEL_INEXPENSIVE":    "<20",
    "PRICE_LEVEL_MODERATE":       "<50",
    "PRICE_LEVEL_EXPENSIVE":      "<100",
    "PRICE_LEVEL_VERY_EXPENSIVE": "100+",
}

# ─── Load & transform ────────────────────────────────────────────────────────

print("Loading places.csv …")
df = pd.read_csv(PLACES_CSV)
print(f"  {len(df):,} rows loaded")

# Upgrade local_tile res 9 → res 10 (finer resolution: use center child, not parent)
df["local_tile_r10"] = df["local_tile"].apply(
    lambda t: h3.cell_to_center_child(t, LOCAL_TILE_RES)
)

# Map priceLevel enum → price_band string; NaN → ''
df["price_band"] = df["priceLevel"].map(PRICE_BAND_MAP).fillna("")

# Coerce columns that may have NaN to safe types
df["cuisineType"] = df["cuisineType"].fillna("")
df["adjusted_quantile"] = pd.to_numeric(df["adjusted_quantile"], errors="coerce")

# ─── Build h3_density aggregation ────────────────────────────────────────────

print("Pre-aggregating h3_density …")

cuisines = [c for c in df["cuisineType"].unique() if c] + [""]
bands    = ["<20", "<50", "<100", "100+", ""]

density_rows = []
for res in H3_RESOLUTIONS:
    col = f"t{res}"
    # local_tile_r10 is already res 10; cell_to_parent only works for coarser res
    df[col] = df["local_tile_r10"].apply(
        lambda t, r=res: t if r == LOCAL_TILE_RES else h3.cell_to_parent(t, r)
    )
    for cuisine, band in itertools.product(cuisines, bands):
        mask = pd.Series([True] * len(df), index=df.index)
        if cuisine:
            mask &= df["cuisineType"] == cuisine
        if band:
            mask &= df["price_band"] == band
        agg = (
            df[mask]
            .groupby(col)
            .size()
            .reset_index(name="count")
        )
        agg["resolution"]   = res
        agg["cuisine_type"] = cuisine
        agg["price_band"]   = band
        density_rows.append(agg.rename(columns={col: "tile"}))
    print(f"  res {res} done ({len(df[col].unique())} unique tiles)")

density_df = pd.concat(density_rows, ignore_index=True)
print(f"  {len(density_df):,} h3_density rows total")

# ─── Upload ──────────────────────────────────────────────────────────────────

print("Connecting to Neon …")
conn = psycopg2.connect(DATABASE_URL)
cur  = conn.cursor()

# -- places --
print("Inserting places …")
places_records = [
    (
        str(row["id"]),
        str(row["displayName"]),
        float(row["lat"]),
        float(row["lon"]),
        str(row["local_tile_r10"]),
        str(row["cuisineType"]) if row["cuisineType"] else None,
        str(row["price_band"])  if row["price_band"]  else None,
        float(row["rating"])           if pd.notna(row["rating"])           else None,
        int(row["userRatingCount"])    if pd.notna(row["userRatingCount"])  else None,
        float(row["wilson_score"])     if pd.notna(row["wilson_score"])     else None,
        float(row["adjusted_score"])   if pd.notna(row["adjusted_score"])   else None,
        float(row["adjusted_quantile"])if pd.notna(row["adjusted_quantile"])else None,
        int(row["seed_index"])         if pd.notna(row["seed_index"])       else None,
        str(row["primaryType"])        if pd.notna(row["primaryType"])      else None,
        str(row["shortFormattedAddress"]) if pd.notna(row["shortFormattedAddress"]) else None,
        str(row["googleMapsUri"])      if pd.notna(row["googleMapsUri"])    else None,
    )
    for _, row in df.iterrows()
]

psycopg2.extras.execute_values(
    cur,
    """
    INSERT INTO places (
        id, display_name, lat, lon, local_tile,
        cuisine_type, price_band,
        rating, user_rating_count,
        wilson_score, adjusted_score, adjusted_quantile,
        seed_index, primary_type, address, google_maps_uri
    ) VALUES %s
    ON CONFLICT (id) DO UPDATE SET
        display_name      = EXCLUDED.display_name,
        local_tile        = EXCLUDED.local_tile,
        cuisine_type      = EXCLUDED.cuisine_type,
        price_band        = EXCLUDED.price_band,
        rating            = EXCLUDED.rating,
        user_rating_count = EXCLUDED.user_rating_count,
        wilson_score      = EXCLUDED.wilson_score,
        adjusted_score    = EXCLUDED.adjusted_score,
        adjusted_quantile = EXCLUDED.adjusted_quantile
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
