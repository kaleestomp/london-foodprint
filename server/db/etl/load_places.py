from pathlib import Path
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
    
    print(f"  {len(df):,} rows loaded ({df['operational'].sum():,} open, {(~df['operational']).sum():,} temporarily closed)")
    return df
