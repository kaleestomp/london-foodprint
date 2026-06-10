import pandas as pd
import ast
import re
from server.scripts.clean_places_level_2.MAP_KEYWORD import KEYWORD_MAP, LOW_SIGNAL_KEYWORD_TYPES
from server.scripts.clean_places_level_2.MAP_CUISINE import GOOGLE_TYPE_TO_CUISINE_TYPE, UNSPECIFIED, NOISY_GOOGLE_TYPE_SUMMARIES
from server.scripts.clean_places_level_2.CHAIN_REGISTER import find_block_chain_name, BLOCK_CHAINS


# Google-derived cuisine buckets that are often too generic/noisy. If name
# parsing has a different result, prefer the name-based result.
NOISY_OVERRIDE_SUMMARIES = set(NOISY_GOOGLE_TYPE_SUMMARIES) | {
    "Fast Food",
    "Halal",
}

def parse_type(row: pd.Series) -> str:

    # Chain register takes highest priority — bypasses all other logic.
    chain_name = find_block_chain_name(str(row.get("displayName") or ""))
    if chain_name:
        chain_google_type = BLOCK_CHAINS[chain_name]
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

def predict_cuisine_from_name(row: pd.Series) -> str:
    # Check from Name Characters (e.g. Chinese characters)
    cuisine = check_cuisine_from_language(row)
    if cuisine:
        return cuisine
    # Check from Keywords in Name and Primary Type
    cuisine = check_cuisine_from_keywords(row)
    if cuisine:
        return cuisine
    
    # Fallback
    return ""

def check_cuisine_from_keywords(row: pd.Series) -> str:

    LOW_SIGNAL_SCORE_THRESHOLD = 0.6
    text = " ".join([
        str(row.get("displayName") or ""),
        str(row.get("primaryTypeDisplayName") or ""),
    ])
    scores: dict[str, float] = {}
    first_match_idx: dict[str, int] = {}

    for idx, (pattern, predicted_type) in enumerate(KEYWORD_MAP):
        if re.search(pattern, text, re.IGNORECASE):
            weight = LOW_SIGNAL_SCORE_THRESHOLD if predicted_type in LOW_SIGNAL_KEYWORD_TYPES else 1.0
            scores[predicted_type] = scores.get(predicted_type, 0.0) + weight
            if predicted_type not in first_match_idx:
                first_match_idx[predicted_type] = idx
    if scores:
        ranked = sorted(
            scores.items(),
            key=lambda item: (-item[1], first_match_idx[item[0]]),
        )
        best_type, best_score = ranked[0]
        second_score = ranked[1][1] if len(ranked) > 1 else 0.0

        # Primary confidence gate for multi-signal matches.
        if best_score >= 1.0 and (best_score - second_score) >= 0.35:

            return best_type

        # Fallback gate: if only one cuisine candidate matched, allow lower
        # confidence to recover obvious single-signal names (e.g. brands).
        if len(ranked) == 1 and best_score >= LOW_SIGNAL_SCORE_THRESHOLD:
            return best_type

def check_cuisine_from_language(row: pd.Series) -> str:
    text = str(row.get("displayName") or "")
    # Check for Chinese characters (CJK Unified Ideographs and Extension A)
    if any(
        ("\u3400" <= ch <= "\u4DBF") or # CJK Extension A
        ("\u4E00" <= ch <= "\u9FFF") # CJK Unified Ideographs
        for ch in text
    ): return "chinese_restaurant"

    # Check for Arabic script characters (commonly seen in Middle Eastern names).
    if any(
        ("\u0600" <= ch <= "\u06FF") or
        ("\u0750" <= ch <= "\u077F") or
        ("\u08A0" <= ch <= "\u08FF")
        for ch in text
    ):
        return "middle_eastern_restaurant"

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
    