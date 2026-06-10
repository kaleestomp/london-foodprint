import pandas as pd

CATEGORY = ['<10', '10+', '20+', '40+', '60+', '100+']
COST_CATEGORY = {
    'PRICE_LEVEL_INEXPENSIVE': (10, 20),
    'PRICE_LEVEL_MODERATE': (20, 30),
    'PRICE_LEVEL_EXPENSIVE': (30, 80),
    'PRICE_LEVEL_VERY_EXPENSIVE': (100, 60)
}

def get_cost_category_from_price(price:float) -> str:
    if not isinstance(price, (int, float)) or pd.isna(price):
        return None

    #<10, 10+, 20+, 40+, 60+, 100+
    if price >= 100:
        return CATEGORY[5]
    elif price >= 60:
        return CATEGORY[4]
    elif price >= 40:
        return CATEGORY[3]
    elif price >= 20:
        return CATEGORY[2]
    elif price >= 10:
        return CATEGORY[1]
    else:
        return CATEGORY[0]

def categorize_cost(startPrice, endPrice, priceLevel) -> str:
    has_start = isinstance(startPrice, (int, float)) and not pd.isna(startPrice)
    has_end = isinstance(endPrice, (int, float)) and not pd.isna(endPrice)

    if has_start and has_end:
        return get_cost_category_from_price((startPrice + endPrice) / 2)
    elif has_start:
        return get_cost_category_from_price(startPrice)
    elif has_end:
        return get_cost_category_from_price(endPrice)
    elif isinstance(priceLevel, str):
        return get_cost_category_from_level(priceLevel)

    return None


def get_cost_category_from_level(category:str):
    if category == 'PRICE_LEVEL_INEXPENSIVE':
        return CATEGORY[0]
    elif category == 'PRICE_LEVEL_MODERATE':
        return CATEGORY[2]
    elif category == 'PRICE_LEVEL_EXPENSIVE':
        return CATEGORY[3]
    elif category == 'PRICE_LEVEL_VERY_EXPENSIVE':
        return CATEGORY[5]
    else:
        return None