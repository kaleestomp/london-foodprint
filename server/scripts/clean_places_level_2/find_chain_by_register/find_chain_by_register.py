import re
import unicodedata
from pathlib import Path

import pandas as pd


def load_reference() -> dict:
    block_chain_path = Path(__file__).with_name("block_chain.csv")
    block_chain_df = pd.read_csv(block_chain_path)
    block_chain = {}
    for record in block_chain_df.to_dict(orient="records"):
        block_chain[record["name"]] = record["type"]

    return block_chain

def _normalize_chain_text(text):
    normalized = unicodedata.normalize("NFKD", str(text or ""))
    normalized = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    normalized = normalized.lower()
    normalized = re.sub(r"[^a-z0-9]+", " ", normalized)
    return re.sub(r"\s+", " ", normalized).strip()

def find_chain_by_register(df):
    chain_register = load_reference()
    df['chain_name'] = df["displayName"].apply(lambda n: find_block_chain_name(str(n or ""), chain_register))
    df["is_major_chain"] = df["chain_name"].astype(bool)
    df["is_chain"] = df["chain_name"].astype(bool)
    df["predictedType"] = df["chain_name"].map(chain_register)
    df["chain_count"] = df.groupby('chain_name')['chain_name'].transform('count')

    return df

def find_block_chain_name(display_name, chain_register: dict):
    """Return the canonical chain name if the display name matches a known block chain."""
    normalized_display_name = _normalize_chain_text(display_name)
    if not normalized_display_name:
        return ""

    chain_lookup = sorted(
        ((_normalize_chain_text(chain_name), chain_name) for chain_name in chain_register),
        key=lambda item: len(item[0]), reverse=True,
    )

    for normalized_chain_name, chain_name in chain_lookup:
        if normalized_chain_name and normalized_chain_name in normalized_display_name:
            return chain_name

    return ""

# def predict_google_type_from_chain(row):
#     """Infer a Google Places type from the display name using the chain register."""
#     chain_name = find_block_chain_name(row.get("displayName") or "")
#     block_chain = load_reference()

#     return block_chain.get(chain_name, "")
