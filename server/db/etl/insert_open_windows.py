import ast
from pathlib import Path

import pandas as pd
import psycopg2.extras

SERVER_ROOT = Path(__file__).resolve().parent.parent.parent  # etl/ -> db/ -> server/
TIMETABLE_CSV = SERVER_ROOT / "out" / "places_level3" / "df_level2_timetable.csv"


def _parse_windows(raw: str) -> list[tuple[int, int, int, int]]:
    """
    Parse a single openningHours cell into a list of (open_day, open_minute,
    close_day, close_minute) tuples.

    The source value is a Python-literal list of dicts (single-quoted), e.g.:
        [{'open': {'day': 1, 'hour': 8, 'minute': 0},
          'close': {'day': 1, 'hour': 19, 'minute': 0}}, ...]

    Returns an empty list for any unparseable value.
    """
    try:
        periods = ast.literal_eval(raw)
    except (ValueError, SyntaxError):
        return []

    windows = []
    for period in periods:
        try:
            o = period["open"]
            c = period["close"]
            open_minute  = o["hour"] * 60 + o["minute"]
            close_minute = c["hour"] * 60 + c["minute"]
            windows.append((int(o["day"]), open_minute, int(c["day"]), close_minute))
        except (KeyError, TypeError):
            continue
    return windows


def insert_open_windows(cur, timetable_csv: Path | None = None) -> None:
    """
    Load place_open_windows from df_level2_timetable.csv.

    Strategy:
      - Delete all existing rows for places that appear in the CSV, then bulk
        insert the freshly parsed windows.  This makes reruns idempotent.
      - Places with no parseable windows get no rows (fine — missing = unknown).
      - place_id values not present in places are silently skipped to respect FK.
    """
    csv_path = timetable_csv or TIMETABLE_CSV
    df = pd.read_csv(csv_path)

    # Build flat records: (place_id, open_day, open_minute, close_day, close_minute)
    records: list[tuple[str, int, int, int, int]] = []
    skipped_parse = 0
    for row in df.itertuples(index=False):
        place_id = str(row.id)
        raw = row.openningHours  # note: original typo preserved from source CSV
        if pd.isna(raw):
            continue
        windows = _parse_windows(str(raw))
        if not windows:
            skipped_parse += 1
            continue
        for open_day, open_minute, close_day, close_minute in windows:
            records.append((place_id, open_day, open_minute, close_day, close_minute))

    if skipped_parse:
        print(f"  [open_windows] {skipped_parse} rows skipped (unparseable hours)")

    if not records:
        print("  [open_windows] no records to insert")
        return

    # Collect unique place_ids from this CSV to scope the delete
    place_ids_in_csv = list({r[0] for r in records})

    # Remove stale rows only for places being reloaded
    cur.execute(
        "DELETE FROM place_open_windows WHERE place_id = ANY(%s)",
        (place_ids_in_csv,),
    )

    # Bulk insert; ON CONFLICT DO NOTHING guards against duplicate rows if
    # the same interval appears twice in the source (rare but possible).
    psycopg2.extras.execute_values(
        cur,
        """
        INSERT INTO place_open_windows
            (place_id, open_day, open_minute, close_day, close_minute)
        VALUES %s
        ON CONFLICT DO NOTHING
        """,
        records,
        page_size=1000,
    )
    print(f"  [open_windows] {len(records):,} window rows inserted "
          f"({len(place_ids_in_csv):,} places)")
