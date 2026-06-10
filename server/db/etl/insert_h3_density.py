import pandas as pd
import psycopg2
import psycopg2.extras

# ─── Insert helpers ───────────────────────────────────────────────────────────
def insert_h3_density(cur, density_df: pd.DataFrame) -> None:
    # Deduplicate on PK columns — guards against upstream dimension list collisions
    pk_cols = ["tile", "resolution", "cuisine_type", "cost", "venue_type", "score_basis", "confidence", "score_tier"]
    density_df = density_df.drop_duplicates(subset=pk_cols, keep="last")

    records = [
        (
            row.tile, int(row.resolution),
            row.cuisine_type, row.cost, row.venue_type,
            int(row.score_basis), int(row.confidence), int(row.score_tier),
            int(row.count),
        )
        for row in density_df.itertuples(index=False)
    ]
    psycopg2.extras.execute_values(cur, """
        INSERT INTO h3_density
            (tile, resolution, cuisine_type, cost, venue_type, score_basis, confidence, score_tier, count)
        VALUES %s
        ON CONFLICT (tile, resolution, cuisine_type, cost, venue_type, score_basis, confidence, score_tier)
        DO UPDATE SET count = EXCLUDED.count
    """, records, page_size=1000)
    print(f"  {len(records):,} density rows upserted")