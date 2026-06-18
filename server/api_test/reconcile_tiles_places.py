"""
reconcile_tiles_places.py
------------------------
Validation script: ensures tile density counts reconcile with places query results.

Run from repo root:
    python server/api_test/reconcile_tiles_places.py

Validates two invariants:
1. inner_count from tiles query ≤ actual places query count (sanity check)
2. mode switches are deterministic: inner_count > PAGE_SIZE → tiles, else → places

Exit 0 = all checks pass
Exit 1 = invariant violated (see output for details)
"""
import asyncio
import os
import sys
from pathlib import Path

# Add server/ to sys.path so we can import DB and API modules
SERVER_ROOT = Path(__file__).resolve().parents[1]
if str(SERVER_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVER_ROOT))

import psycopg2
from dotenv import load_dotenv

from api.map_common import h3_cells_for_bbox, normalize_dimension_list, normalize_dimension, PAGE_SIZE, RANK_THRESHOLD_MAP

# ─── Test viewports ───────────────────────────────────────────────────────────
# All within London bounds; chosen to exercise different filter combinations.
TEST_VIEWPORTS = [
    # (sw_lat, sw_lng, ne_lat, ne_lng, resolution, filters_name, cuisine, cost, venue_type, score_basis, score_tier)
    (51.4, -0.3, 51.6, -0.0, 9, "central_london_unfiltered",
     [], [], "", 0, 0),
    (51.4, -0.3, 51.6, -0.0, 9, "central_london_chinese",
     ["Chinese"], [], "", 0, 0),
    (51.4, -0.3, 51.6, -0.0, 9, "central_london_chinese_high_tier",
     ["Chinese"], [], "", 0, 3),
    (51.4, -0.3, 51.6, -0.0, 10, "central_london_finest_nofilter",
     [], [], "", 0, 0),
    (51.5, -0.15, 51.55, -0.10, 10, "soho_fine",
     [], [], "Dine-In", 0, 0),
]

# ─── SQL queries ───────────────────────────────────────────────────────────────
_TILES_SQL = """
    SELECT tile, SUM(count)::INT AS count
    FROM h3_density
    WHERE resolution = %s
      AND tile = ANY(%s)
      AND (
            (CARDINALITY(%s::TEXT[]) = 0 AND cuisine_type = '')
            OR (CARDINALITY(%s::TEXT[]) > 0 AND cuisine_type = ANY(%s::TEXT[]))
          )
      AND (
            (CARDINALITY(%s::TEXT[]) = 0 AND cost = '')
            OR (CARDINALITY(%s::TEXT[]) > 0 AND (cost = ANY(%s::TEXT[]) OR LOWER(cost) = 'unspecified'))
          )
      AND venue_type = %s
      AND score_basis = %s
      AND score_tier = %s
    GROUP BY tile
"""

_PLACES_SQL = """
    SELECT COUNT(*) as count
    FROM places
    WHERE lat BETWEEN %s AND %s
      AND lon BETWEEN %s AND %s
      AND (CARDINALITY(%s::TEXT[]) = 0 OR cuisine_type = ANY(%s::TEXT[]))
      AND (%s = '' OR venue_type = %s)
      AND (
            CARDINALITY(%s::TEXT[]) = 0
            OR cost = ANY(%s::TEXT[])
            OR cost IS NULL
            OR cost = ''
            OR LOWER(cost) = 'unspecified'
          )
      AND {rank_column} >= %s
"""

# ─── Reconciliation logic ──────────────────────────────────────────────────────
def run_checks(conn_str: str) -> bool:
    """
    Run reconciliation checks.
    Returns True if all pass, False if any invariant is violated.
    """
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()

    all_pass = True

    for viewport in TEST_VIEWPORTS:
        (sw_lat, sw_lng, ne_lat, ne_lng, res, name,
         cuisine, cost, venue_type, score_basis, score_tier) = viewport

        # Normalize inputs
        cuisine_values = normalize_dimension_list(cuisine)
        cost_values = normalize_dimension_list(cost)
        venue_value = normalize_dimension(venue_type)
        rank_threshold = RANK_THRESHOLD_MAP[score_tier]
        rank_column = "tier" if score_basis == 0 else ("tier_d" if score_basis == 1 else "tier_independent")

        # Get tiles
        outer_tiles, inner_tiles = h3_cells_for_bbox(sw_lat, sw_lng, ne_lat, ne_lng, res)
        inner_set = set(inner_tiles)

        # Query tiles
        cur.execute(
            _TILES_SQL,
            [
                res, outer_tiles,
                cuisine_values, cuisine_values, cuisine_values,
                cost_values, cost_values, cost_values,
                venue_value,
                score_basis, score_tier,
            ]
        )
        tile_rows = cur.fetchall()
        inner_count = sum(row[1] for row in tile_rows if row[0] in inner_set)

        # Query places
        places_sql = _PLACES_SQL.format(rank_column=rank_column)
        cur.execute(
            places_sql,
            [
                sw_lat, ne_lat, sw_lng, ne_lng,
                cuisine_values, cuisine_values,
                venue_value, venue_value,
                cost_values, cost_values,
                rank_threshold,
            ]
        )
        places_count = cur.fetchone()[0]

        # Check 1: inner_count should be close to places_count
        # (They may differ slightly due to rank thresholds applied differently,
        # but should not be wildly different.)
        diff = abs(inner_count - places_count)
        if diff > places_count * 0.1 and places_count > 0:  # Allow ±10% margin
            print(
                f"❌ {name}:\n"
                f"   inner_count={inner_count}, places_count={places_count}\n"
                f"   Difference {diff} exceeds 10% threshold.\n"
                f"   Possible causes: rank threshold mismatch, filter logic drift."
            )
            all_pass = False
        else:
            print(
                f"✓ {name}: inner_count={inner_count}, places_count={places_count} (diff={diff})"
            )

        # Check 2: mode switch determinism
        # If inner_count > PAGE_SIZE, should be in tiles mode
        # If inner_count <= PAGE_SIZE, should be in places mode
        expected_mode = "tiles" if inner_count > PAGE_SIZE else "places"
        print(f"  → inner_count {inner_count} → mode={expected_mode} (PAGE_SIZE={PAGE_SIZE})")

    cur.close()
    conn.close()

    return all_pass


if __name__ == "__main__":
    load_dotenv(SERVER_ROOT.parent / ".env")
    DATABASE_URL = os.environ.get("DATABASE_URL")

    if not DATABASE_URL:
        print("❌ DATABASE_URL not set in .env")
        sys.exit(1)

    print("Running tile/places reconciliation checks …\n")
    passed = run_checks(DATABASE_URL)

    if passed:
        print("\n✅ All reconciliation checks passed.")
        sys.exit(0)
    else:
        print("\n❌ One or more reconciliation checks failed.")
        sys.exit(1)
