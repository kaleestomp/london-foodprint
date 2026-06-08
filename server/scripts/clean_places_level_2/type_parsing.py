import pandas as pd
import ast
import re
from server.scripts.clean_places_level_2.MAP_KEYWORD import KEYWORD_MAP
from server.scripts.clean_places_level_2.MAP_CUISINE import CUISINE_TYPES, UNSPECIFIED

TYPE_TO_SUMMARY = {
    google_type: summary
    for summary, google_types in CUISINE_TYPES.items()
    for google_type in google_types
}

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

def parse_type(row: pd.Series) -> str:

    primary = str(row.get("primaryType") or "").strip().lower()

    # 1. Direct hit from primaryType (not generic "restaurant")
    if primary and primary != "restaurant":
        hit = TYPE_TO_SUMMARY.get(primary)
        if hit and hit != "Restaurant":
            return hit

    # 2. Keyword search on displayName + primaryTypeDisplayName
    if pd.notna(row.get("predictedType")):
        hit = TYPE_TO_SUMMARY.get(row["predictedType"])
        if hit:
            return hit
    
    # 3. Scan the `types` array for the most specific non-generic entry
    for t in _parse_types_col(row.get("types")):
        if t not in UNSPECIFIED:
            hit = TYPE_TO_SUMMARY.get(t)
            if hit and hit != "Restaurant":
                return hit

    # 4. Fallback
    return "Unspecified"

def predict_cuisine_from_name(row: pd.Series) -> str:
    text = " ".join([
        str(row.get("displayName") or ""),
        str(row.get("primaryTypeDisplayName") or ""),
    ])
    for pattern, summary in KEYWORD_MAP:
        if re.search(pattern, text, re.IGNORECASE):
            return summary
        if check_cuisine_from_language(row):
            return check_cuisine_from_language(row)
    # Fallback
    return ""

def check_cuisine_from_language(row: pd.Series) -> str:
    text = str(row.get("displayName") or "")
    # Check for Chinese characters (CJK Unified Ideographs and Extension A)
    if any(
        ("\u3400" <= ch <= "\u4DBF") or # CJK Extension A
        ("\u4E00" <= ch <= "\u9FFF") # CJK Unified Ideographs
        for ch in text
    ): return "chinese_restaurant"

    return ""

def check_takeaway(row: pd.Series) -> bool:
    """Heuristic to check if a place is likely to be takeaway-only (i.e. ghost kitchen)."""
    primary = str(row.get("primaryType") or "").strip().lower()
    if primary == "meal_delivery": 
        return "Ghost Kitchen"
    if primary == "meal_takeaway": 
        return "Takeaway"
    else:
        return "Dine-In"
    