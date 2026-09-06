# Legacy Database & ETL Architecture (`h3_density`)

This directory contains the legacy database schema and ETL pipeline used prior to phasing out the dynamic H3 tile layer on the frontend.

## Key Components

- **`schema.sql`**: Previous database schema containing the `h3_density` table DDL, indexes, and initial `places` definition.
- **`etl_load.py`**: Legacy orchestrator that loaded `places`, `place_open_windows`, and `h3_density` into PostgreSQL.
- **`etl/build_h3_density.py`**: Pure Python transformation module that pre-aggregated place counts per H3 tile (resolutions 7–11) across all combinations of `score_basis`, `score_tier`, `cuisine_type`, `cost`, and `venue_type`.
- **`etl/insert_h3_density.py`**: Bulk UPSERT helper for `h3_density`.
- **`etl/build_h3_density.ipynb`**: Standalone notebook for pre-generating `server/out/h3_density.csv`.
- **`etl/load_places.py` / `etl/insert_places.py`**: Legacy places load and insertion modules matching the previous schema.

## Design Invariants of `h3_density`

1. **Sentinel & Wildcard Mapping**:
   - `''` (wildcard string) = No filter applied (counts ALL places)
   - `'__null__'` (sentinel string) = Explicit representation for unspecified / NULL attributes
   - Concrete string (e.g. `'Chinese'`) = Specific category filter
2. **Composite Primary Key**: `(tile, resolution, cuisine_type, cost, venue_type, score_basis, score_tier)`.
