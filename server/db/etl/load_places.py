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
    # Normalise nulls in filter columns to empty string (matches h3_density '' rows)
    df["cuisineType"] = df["cuisineType"].fillna("Unspecified")
    df["cost"]        = df["cost"].fillna("")
    df["venueType"]   = df["venueType"].fillna("Dine-In")
    print(f"  {len(df):,} rows loaded ({df['operational'].sum():,} open, {(~df['operational']).sum():,} temporarily closed)")
    return df
