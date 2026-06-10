from pathlib import Path
import pandas as pd

# ─── Paths & config ───────────────────────────────────────────────────────────
SERVER_ROOT = Path(__file__).resolve().parent.parent.parent
PLACES_CSV   = SERVER_ROOT / "out" / "places.csv"

# ─── Load & clean ─────────────────────────────────────────────────────────────
def load_places() -> pd.DataFrame:
    df = pd.read_csv(PLACES_CSV)
    # Drop closed restaurants — no value to show on the map
    df = df[df["operational"] == True].copy()
    # Normalise nulls in filter columns to empty string (matches h3_density '' rows)
    df["cuisineType"] = df["cuisineType"].fillna("Unspecified")
    df["cost"]        = df["cost"].fillna("")
    df["venueType"]   = df["venueType"].fillna("Dine-In")
    # score_tier removed: derived client-side from the active rank float.
    # h3_density still uses score_tier (cumulative thresholds) for tile counts.
    print(f"  {len(df):,} operational rows")
    return df
