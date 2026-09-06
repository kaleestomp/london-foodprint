"""
etl_load.py
-----------
Loads places.csv and timetable opening hours into the PostgreSQL / Neon DB.
Supports loading datasets for multiple cities (e.g., london, newcastle).

Usage:
    python db/etl_load.py --city london
    python db/etl_load.py --city newcastle --file out/places_newcastle.csv

Requires: pip install psycopg2-binary python-dotenv
"""
import argparse
import os
import sys
from pathlib import Path
import psycopg2
from dotenv import load_dotenv

# Add server/ to sys.path so `db.etl.*` imports resolve.
SERVER_ROOT = Path(__file__).resolve().parents[1]  # db/ -> server/
if str(SERVER_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVER_ROOT))

import pandas as pd
from db.etl.load_places import load_places
from db.etl.insert_places import insert_places
from db.etl.insert_open_windows import insert_open_windows

# ─── Paths & config ───────────────────────────────────────────────────────────
load_dotenv(SERVER_ROOT.parent / ".env")
DATABASE_URL = os.environ["DATABASE_URL"]


# ─── Main ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Load places dataset into database.")
    parser.add_argument("--city", "--city-slug", dest="city_slug", default="london", help="City slug identifier (e.g. london, newcastle)")
    parser.add_argument("--file", "--csv-path", dest="csv_path", default=None, help="Path to places CSV file")
    parser.add_argument("--timetable-file", dest="timetable_csv", default=None, help="Path to timetable CSV file")
    args = parser.parse_args()

    city_slug = args.city_slug.lower().strip()
    places_csv = Path(args.csv_path) if args.csv_path else None
    timetable_csv = Path(args.timetable_csv) if args.timetable_csv else None

    print(f"Loading places dataset for city '{city_slug}' …")
    df = load_places(csv_path=places_csv, city_slug=city_slug)

    print("Connecting to database …")
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    print(f"Inserting places into partition 'places_{city_slug}' …")
    insert_places(cur, df)

    if timetable_csv and timetable_csv.exists():
        print(f"Inserting open windows for city '{city_slug}' …")
        insert_open_windows(cur, timetable_csv=timetable_csv, city_slug=city_slug)
    else:
        print("No timetable CSV supplied or found — skipping open windows load.")

    conn.commit()
    cur.close()
    conn.close()
    print(f"ETL complete successfully for city '{city_slug}'.")
