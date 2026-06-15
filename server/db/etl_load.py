"""
etl_load.py
-----------
Loads server/out/places.csv into the Neon cloud DB.

Run from server/ directory:
    python db/etl_load.py

Requires: pip install psycopg2-binary python-dotenv
"""
import os
import sys
from pathlib import Path
import psycopg2
from dotenv import load_dotenv

# Add server/ to sys.path so `db.etl.*` imports resolve.
# Cannot use `server.*` because server/server.py conflicts with the package name.
SERVER_ROOT = Path(__file__).resolve().parents[1]  # db/ -> server/
if str(SERVER_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVER_ROOT))

import pandas as pd
from db.etl.load_places import load_places
from db.etl.build_h3_density import build_h3_density
from db.etl.insert_places import insert_places
from db.etl.insert_h3_density import insert_h3_density

H3_DENSITY_CSV = SERVER_ROOT / "out" / "h3_density.csv"

# ─── Paths & config ───────────────────────────────────────────────────────────
load_dotenv(SERVER_ROOT.parent / ".env")
DATABASE_URL = os.environ["DATABASE_URL"]

REQUIRED_DENSITY_COLS = [
    "tile",
    "resolution",
    "cuisine_type",
    "cost",
    "venue_type",
    "score_basis",
    "score_tier",
    "count",
]


def _ensure_places_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Backfill optional legacy ETL columns from the latest places.csv shape."""
    default_none_cols = [
        "boosted_0", "bnormal_0", "wilson_0", "normal_0",
        "boosted_2", "bnormal_2", "wilson_2", "normal_2",
        "primaryTypeDisplayName", "shortFormattedAddress", "pcd", "areacode",
        "googleMapsUri", "websiteUri", "wheelchairAccess",
    ]
    for col in default_none_cols:
        if col not in df.columns:
            df[col] = pd.NA

    # score_1/rank_1 paths in insert_places expect these fields.
    if "boosted_1" not in df.columns:
        if "wilson_1" in df.columns:
            df["boosted_1"] = df["wilson_1"]
        else:
            df["boosted_1"] = pd.NA
    if "bnormal_1" not in df.columns:
        if "normal_1" in df.columns:
            df["bnormal_1"] = df["normal_1"]
        else:
            df["bnormal_1"] = pd.NA

    return df


def _normalize_density_df(density_df: pd.DataFrame) -> pd.DataFrame:
    missing = [c for c in REQUIRED_DENSITY_COLS if c not in density_df.columns]
    if missing:
        raise RuntimeError(
            "h3_density schema mismatch. Missing columns: "
            + ", ".join(missing)
            + ". Rebuild/export h3_density.csv with the latest build_h3_density logic."
        )

    # Empty-string wildcard rows are written as blank cells in CSV and
    # read back as NaN. Neon columns are NOT NULL, so restore them to "".
    density_df[["cuisine_type", "cost", "venue_type"]] = (
        density_df[["cuisine_type", "cost", "venue_type"]].fillna("")
    )

    return density_df[REQUIRED_DENSITY_COLS].copy()

# ─── Main ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("Loading places.csv …")
    df = load_places()
    df = _ensure_places_columns(df)

    if H3_DENSITY_CSV.exists():
        print(f"Reading h3_density from {H3_DENSITY_CSV} …")
        density_df = _normalize_density_df(pd.read_csv(H3_DENSITY_CSV))
    else:
        print("h3_density.csv not found — building from scratch …")
        built_df = build_h3_density(
            df[[
                "h3_res10", "cuisineType", "cost", "venueType",
                "tier", "tier_d", "tier_independent",
            ]].rename(columns={
                "h3_res10":    "h3_r10",
                "cuisineType": "cuisine_type",
                "venueType":   "venue_type",
            }).copy()
        )
        density_df = _normalize_density_df(built_df)
    print(f"  {len(density_df):,} density rows")

    print("Connecting to Neon …")
    conn = psycopg2.connect(DATABASE_URL)
    cur  = conn.cursor()

    print("Inserting places …")
    insert_places(cur, df)

    print("Inserting h3_density …")
    insert_h3_density(cur, density_df)

    conn.commit()
    cur.close()
    conn.close()
    print("Done.")
