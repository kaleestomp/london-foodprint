import re
import unicodedata


# Maps canonical chain name → Google Places type (most specific applicable type).
BLOCK_CHAINS = {
    # ── Global QSR ────────────────────────────────────────────────────────────
    "KFC": "chicken_restaurant",
    "McDonald's": "fast_food_restaurant",
    "Burger King": "fast_food_restaurant",
    "Subway": "sandwich_shop",
    "Pizza Hut": "pizza_restaurant",
    "Starbucks": "coffee_shop",
    "Dunkin'": "coffee_shop",
    "Costa Coffee": "coffee_shop",
    "Tim Hortons": "coffee_shop",
    "Wendy's": "hamburger_restaurant",
    "Taco Bell": "mexican_restaurant",
    "Domino's Pizza": "pizza_restaurant",
    "Chipotle Mexican Grill": "mexican_restaurant",
    "Panera Bread": "bakery",
    "Five Guys": "hamburger_restaurant",
    "Five Guys Burgers and Fries": "hamburger_restaurant",
    "Popeyes Louisiana Kitchen": "chicken_restaurant",
    "Arby's": "sandwich_shop",
    "Sonic Drive-In": "hamburger_restaurant",
    "Dairy Queen": "dessert_shop",
    "Jack in the Box": "fast_food_restaurant",
    "Krispy Kreme": "dessert_shop",
    "Culver's": "hamburger_restaurant",
    "In-N-Out Burger": "hamburger_restaurant",
    "Shake Shack": "hamburger_restaurant",
    "Zaxby's": "chicken_restaurant",
    # ── UK high-street ────────────────────────────────────────────────────────
    "Gail's": "bakery",
    "Pret A Manger": "sandwich_shop",
    "Greggs": "bakery",
    "Abokado": "salad_shop",
    "Morley's": "chicken_restaurant",
    "Chicken Cottage": "chicken_restaurant",
    "Caffè Nero": "coffee_shop",
    "German Doner Kebab": "kebab_shop",
    "Gourmet Burger Kitchen": "hamburger_restaurant",
    "Joe & The Juice": "juice_shop",
    "LEON": "salad_shop",
    "Natural Kitchen": "salad_shop",
    "Natural Fitness Food": "salad_shop",
    "Nando's": "chicken_restaurant",
    "Papa Johns Pizza": "pizza_restaurant",
    "PizzaExpress": "pizza_restaurant",
    "Pizza Pilgrims": "pizza_restaurant",
    "Zia Lucia": "pizza_restaurant",
    "Slim Chickens": "chicken_restaurant",
    "Chicken Valley": "chicken_restaurant",
    "Roosters Piri Piri": "chicken_restaurant",
    "The Salad Kitchen": "salad_shop",
    "The Salad Project": "salad_shop",
    "The Real Greek": "greek_restaurant",
    "The Sushi Co": "sushi_restaurant",
    "The Pizza Room": "pizza_restaurant",
    "Black Bear Burger": "hamburger_restaurant",
    "Amigos Burgers & Shakes": "hamburger_restaurant",
    "Brasserie Blanc": "french_restaurant",
    "Comptoir Libanais": "lebanese_restaurant",
    "Eat Tokyo": "japanese_restaurant",
    "Go Falafel": "falafel_restaurant",
    "Garbanzos": "falafel_restaurant",
    "Koi Ramen Bar": "ramen_restaurant",
    "Kanada-Ya": "ramen_restaurant",
    "Marugame": "japanese_restaurant",
    "Pilpel": "falafel_restaurant",
    "Poke House": "hawaiian_restaurant",
    "Pok Shack": "hawaiian_restaurant",
    "Oakberry": "juice_shop",
    "Rudy's Pizza Napoletana": "pizza_restaurant",
    "Sandwich Sandwich": "sandwich_shop",
    "Passyunk Avenue": "sandwich_shop",
    "Sushi Daily": "sushi_restaurant",
    "Iro Sushi": "sushi_restaurant",
    "You Me Sushi": "sushi_restaurant",
    "Chopstix": "asian_restaurant",
    "Urban Greens": "salad_shop",
    "Yolk": "breakfast_restaurant",
    "Zizzi": "italian_restaurant",
    "Bella Italia": "italian_restaurant",
    "Emilia Crafted Pasta": "italian_restaurant",
    "Hola Guacamole": "mexican_restaurant",
    "EatViet": "vietnamese_restaurant",
    "Burger & Lobster": "seafood_restaurant",
    "Wasabi": "japanese_restaurant",
    "Wagamama": "asian_restaurant",
    "YO! Sushi": "sushi_restaurant",
    "itsu": "japanese_restaurant",
}


def _normalize_chain_text(text):
    normalized = unicodedata.normalize("NFKD", str(text or ""))
    normalized = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    normalized = normalized.lower()
    normalized = re.sub(r"[^a-z0-9]+", " ", normalized)
    return re.sub(r"\s+", " ", normalized).strip()


_BLOCK_CHAIN_LOOKUP = sorted(
    (
        (_normalize_chain_text(chain_name), chain_name)
        for chain_name in BLOCK_CHAINS
    ),
    key=lambda item: len(item[0]),
    reverse=True,
)


def find_block_chain_name(display_name):
    """Return the canonical chain name if the display name matches a known block chain."""
    normalized_display_name = _normalize_chain_text(display_name)
    if not normalized_display_name:
        return ""

    for normalized_chain_name, chain_name in _BLOCK_CHAIN_LOOKUP:
        if normalized_chain_name and normalized_chain_name in normalized_display_name:
            return chain_name

    return ""


def predict_google_type_from_chain(row):
    """Infer a Google Places type from the display name using the chain register."""
    chain_name = find_block_chain_name(row.get("displayName") or "")
    return BLOCK_CHAINS.get(chain_name, "")