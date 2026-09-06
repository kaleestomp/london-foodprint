from pathlib import Path
import h3
import pandas as pd

# ─── Paths & config ───────────────────────────────────────────────────────────
SERVER_ROOT = Path(__file__).resolve().parent.parent.parent
PLACES_CSV   = SERVER_ROOT / "out" / "places.csv"

# ─── Load & clean ─────────────────────────────────────────────────────────────
def load_places(csv_path: Path | None = None, city_slug: str = "london") -> pd.DataFrame:
    target_path = csv_path or PLACES_CSV
    df = pd.read_csv(target_path)
    df["city_slug"] = city_slug
    # Keep all places — operational=False means temporarily closed, not permanently gone.
    df["operational"] = df["operational"].fillna(True).astype(bool)

    # Normalize placeholder values to NULL for pure NULL semantics.
    if "cuisineType" in df.columns:
        df["cuisineType"] = df["cuisineType"].replace("Unspecified", pd.NA)
    if "cost" in df.columns:
        df["cost"] = df["cost"].replace("Unspecified", pd.NA)
    if "venueType" in df.columns:
        df["venueType"] = df["venueType"].replace("Unspecified", pd.NA)

    # Ensure H3 resolution 9 and 10 columns exist
    if "h3_res9" not in df.columns and "h3_r9" in df.columns:
        df["h3_res9"] = df["h3_r9"]
    elif "h3_res9" not in df.columns:
        def _derive_h3_r9(row: pd.Series) -> str:
            lat, lon = row.get("lat"), row.get("lon")
            return h3.latlng_to_cell(float(lat), float(lon), 9) if pd.notna(lat) and pd.notna(lon) else ""
        df["h3_res9"] = df.apply(_derive_h3_r9, axis=1)

    if "h3_res10" not in df.columns and "h3_r10" in df.columns:
        df["h3_res10"] = df["h3_r10"]
    elif "h3_res10" not in df.columns:
        def _derive_h3_r10(row: pd.Series) -> str:
            lat, lon = row.get("lat"), row.get("lon")
            return h3.latlng_to_cell(float(lat), float(lon), 10) if pd.notna(lat) and pd.notna(lon) else ""
        df["h3_res10"] = df.apply(_derive_h3_r10, axis=1)

    print(f"  {len(df):,} rows loaded ({df['operational'].sum():,} open, {(~df['operational']).sum():,} temporarily closed)")
    return df
