from pathlib import Path
import h3
import pandas as pd

# ─── Paths & config ───────────────────────────────────────────────────────────
SERVER_ROOT = Path(__file__).resolve().parent.parent.parent
PLACES_CSV   = SERVER_ROOT / "out" / "places.csv"

# ─── Load & clean ─────────────────────────────────────────────────────────────
def load_places() -> pd.DataFrame:
    df = pd.read_csv(PLACES_CSV)
    # Keep all places — operational=False means temporarily closed, not permanently gone.
    # Frontend can style temporarily-closed pins differently.
    df["operational"] = df["operational"].fillna(True).astype(bool)

    # Normalize placeholder values to NULL for pure NULL semantics.
    # CSV may contain "Unspecified" as a placeholder; convert to NULL to maintain
    # architectural consistency throughout ETL pipeline.
    df["cuisineType"] = df["cuisineType"].replace("Unspecified", pd.NA)
    df["cost"]        = df["cost"].replace("Unspecified", pd.NA)
    df["venueType"]   = df["venueType"].replace("Unspecified", pd.NA)

    if "h3_r11" not in df.columns:
        if "h3_res11" in df.columns:
            df["h3_r11"] = df["h3_res11"].astype(str)
        else:
            def _derive_h3_r11(row: pd.Series) -> str:
                lat = row.get("lat")
                lon = row.get("lon")
                if pd.notna(lat) and pd.notna(lon):
                    return h3.latlng_to_cell(float(lat), float(lon), 11)
                return ""

            df["h3_r11"] = df.apply(_derive_h3_r11, axis=1)

    df["h3_r11"] = df["h3_r11"].fillna("").astype(str)

    print(f"  {len(df):,} rows loaded ({df['operational'].sum():,} open, {(~df['operational']).sum():,} temporarily closed)")
    return df
