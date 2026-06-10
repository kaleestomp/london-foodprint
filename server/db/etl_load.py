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

from db.etl.load_places import load_places
from db.etl.build_h3_density import build_h3_density
from db.etl.insert_places import insert_places
from db.etl.insert_h3_density import insert_h3_density

# ─── Paths & config ───────────────────────────────────────────────────────────
load_dotenv(SERVER_ROOT.parent / ".env")
DATABASE_URL = os.environ["DATABASE_URL"]

# ─── Main ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("Loading places.csv …")
    df = load_places()

    print("Pre-aggregating h3_density …")
    density_df = build_h3_density(
        df[[
            "h3_res10", "cuisineType", "cost", "venueType",
            "bnormal_0", "bnormal_1", "bnormal_2",
            "normal_0",  "normal_1",  "normal_2",
        ]].rename(columns={
            "h3_res10":    "h3_r10",
            "cuisineType": "cuisine_type",
            "venueType":   "venue_type",
        }).copy()
    )
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
