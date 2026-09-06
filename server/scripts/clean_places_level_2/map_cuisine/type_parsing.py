import pandas as pd
import ast
from server.scripts.clean_places_level_2.map_cuisine.MAP_CUISINE import GOOGLE_TYPE_TO_CUISINE_TYPE, UNSPECIFIED, NOISY_GOOGLE_TYPE_SUMMARIES

# Google-derived cuisine buckets that are often too generic/noisy. If name
# parsing has a different result, prefer the name-based result.
NOISY_OVERRIDE_SUMMARIES = set(NOISY_GOOGLE_TYPE_SUMMARIES) | {
    "Fast Food",
    "Halal",
}

def parse_type(row: pd.Series) -> str:

    # Chain register takes highest priority — bypasses all other logic.
    chain_google_type = str(row.get("predictedType") or "").strip()
    if row.get("is_chain") and chain_google_type:
        hit = GOOGLE_TYPE_TO_CUISINE_TYPE.get(chain_google_type)
        if hit and hit != "Restaurant":
            return hit

    primary = str(row.get("primaryType") or "").strip().lower()
    has_suggestive_primary = bool(primary) and primary not in UNSPECIFIED

    # Suggestive primaryType rows: use primary mapping only.
    if has_suggestive_primary:
        return parse_type_from_primary_type(row)

    # Non-suggestive primaryType rows: run fallback sequence.
    cuisine_from_name = parse_type_from_predicted_name(row)

    # 1) Predicted google type from name + primaryTypeDisplayName
    if cuisine_from_name != "Unspecified":
        return cuisine_from_name

    # 2) Google `types` fallback
    cuisine_from_types = parse_type_from_google_types(row)
    if cuisine_from_types != "Unspecified":
        if (
            cuisine_from_types in NOISY_OVERRIDE_SUMMARIES
            and cuisine_from_name != "Unspecified"
            and cuisine_from_name != cuisine_from_types
        ):
            return cuisine_from_name
        return cuisine_from_types

    return "Unspecified"


def parse_type_from_primary_type(row: pd.Series) -> str:
    primary = str(row.get("primaryType") or "").strip().lower()

    # Direct hit from primaryType (not generic "restaurant")
    if primary and primary != "restaurant":
        hit = GOOGLE_TYPE_TO_CUISINE_TYPE.get(primary)
        if hit and hit != "Restaurant":
            return hit

    return "Unspecified"

def parse_type_from_predicted_name(row: pd.Series) -> str:

    if pd.isna(row.get("predictedType")):
        return "Unspecified"
    
    predicted_google_type = str(row["predictedType"]).strip()
    if not predicted_google_type:
        return "Unspecified"

    hit = GOOGLE_TYPE_TO_CUISINE_TYPE.get(predicted_google_type)
    if hit and hit != "Restaurant":
        return hit

    return "Unspecified"

def parse_type_from_google_types(row: pd.Series) -> str:

    # Scan the `types` array for the most specific non-generic entry.
    for t in _parse_types_col(row.get("types")):
        if t not in UNSPECIFIED:
            hit = GOOGLE_TYPE_TO_CUISINE_TYPE.get(t)
            if hit and hit != "Restaurant":
                return hit

    return "Unspecified"

def _parse_types_col(value) -> list[str]:
    """Robustly parse a CSV-stored types list (handles literal list strings)."""
    if pd.isna(value):
        return []
    try:
        parsed = ast.literal_eval(str(value))
        if isinstance(parsed, list):
            return [t.strip().lower() for t in parsed]
    except Exception:
        pass
    # Fallback: comma-separated
    return [t.strip().strip("'\"[] ").lower() for t in str(value).split(",") if t.strip()]

def check_takeaway(row: pd.Series) -> bool:
    """Heuristic to check if a place is likely to be takeaway-only (i.e. ghost kitchen)."""
    primary = str(row.get("primaryType") or "").strip().lower()
    if primary == "meal_delivery": 
        return "Ghost Kitchen"
    if primary == "meal_takeaway": 
        return "Takeaway"
    else:
        return "Dine-In"
    