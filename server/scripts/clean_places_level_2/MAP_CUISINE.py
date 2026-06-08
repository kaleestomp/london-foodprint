# ── Google Maps type → condensed summaryType mapping ─────────────────────────
CHINESE = ["chinese_restaurant", "cantonese_restaurant", "chinese_noodle_restaurant", "dim_sum_restaurant",
    "dumpling_restaurant", "hot_pot_restaurant", "taiwanese_restaurant", "noodle_shop"]
JAPANESE = ["japanese_restaurant", "sushi_restaurant", "ramen_restaurant", "japanese_curry_restaurant", 
    "japanese_izakaya_restaurant", "tonkatsu_restaurant", "yakiniku_restaurant", "yakitori_restaurant"]
KOREAN = ["korean_restaurant", "korean_barbecue_restaurant"]
ASIAN = ["asian_restaurant", "asian_fusion_restaurant", "fusion_restaurant"]
SOUTH_ASIAN = ["indian_restaurant", "north_indian_restaurant", "south_indian_restaurant", "bangladeshi_restaurant",
    "pakistani_restaurant", "sri_lankan_restaurant"]
SOUTHEAST_ASIAN = ["indonesian_restaurant", "malaysian_restaurant", "filipino_restaurant", "cambodian_restaurant",
    "burmese_restaurant", "tibetan_restaurant", "vietnamese_restaurant", "thai_restaurant"]
MIDDLE_EASTERN = ["middle_eastern_restaurant", "lebanese_restaurant", "turkish_restaurant", "persian_restaurant",
    "israeli_restaurant", "moroccan_restaurant", "afghani_restaurant", "falafel_restaurant",
    "shawarma_restaurant", "gyro_restaurant"]
KEBAB_SHOP = ["kebab_shop"]
MEDITERRANEAN = ["mediterranean_restaurant", "greek_restaurant", "croatian_restaurant"]
BISTRO = ["bistro"]
FRENCH = ["french_restaurant"]
GERMAN = ["german_restaurant", "bavarian_restaurant", "austrian_restaurant", "swiss_restaurant", "fondue_restaurant"]
ITALIAN = ["italian_restaurant"]
EASTERN_EUROPEAN = ["eastern_european_restaurant", "russian_restaurant", "ukrainian_restaurant", "romanian_restaurant"]
SOUTHERN_EUROPEAN = ["spanish_restaurant", "portuguese_restaurant", "portuguese_restaurant", "basque_restaurant"]
NORHERN_EUROPEAN = ["scandinavian_restaurant", "danish_restaurant"]
BRITISH = ["british_restaurant"]
EUROPEAN = ["western_restaurant", "european_restaurant","hungarian_restaurant", "czech_restaurant", "polish_restaurant", 
    "belgian_restaurant", "dutch_restaurant", "irish_restaurant"]
AUSTRALIAN = ["australian_restaurant"]
AMERICAN = ["american_restaurant", "californian_restaurant", "southwestern_us_restaurant", "soul_food_restaurant",
    "cajun_restaurant", "tex_mex_restaurant", "hawaiian_restaurant", "diner"]
LATIN_AMERICAN = ["latin_american_restaurant", "mexican_restaurant", "taco_restaurant", "burrito_restaurant",
    "argentinian_restaurant", "colombian_restaurant", "cuban_restaurant", "chilean_restaurant",
    "peruvian_restaurant", "south_american_restaurant", "brazilian_restaurant", "caribbean_restaurant"]
AFRICAN = ["african_restaurant", "ethiopian_restaurant"]
FAST_FOOD = ["fast_food_restaurant", "hot_dog_restaurant", "hot_dog_stand", "chicken_restaurant", "chicken_wings_restaurant", "snack_bar", "food_court"]
PIZZA = ["pizza_restaurant", "pizza_delivery"]
BURGERS = ["hamburger_restaurant"]
SEAFOOD = ["seafood_restaurant", "fish_and_chips_restaurant", "oyster_bar_restaurant"]
STEAKHOUSE_BBQ = ["steak_house", "barbecue_restaurant", "bar_and_grill", "mongolian_barbecue_restaurant"]
SANDWICH_DELI = ["sandwich_shop", "deli"]
CAFE_COFFEE = ["cafe", "coffee_shop", "coffee_roastery", "coffee_stand", "cat_cafe", "dog_cafe", "tea_house"]
BAKERY_PASTRY = ["bakery", "pastry_shop", "cake_shop", "donut_shop", "bagel_shop"]
DESSERT_ICE_CREAM = ["dessert_restaurant", "dessert_shop", "ice_cream_shop", "acai_shop", "chocolate_shop", "chocolate_factory", "candy_store", "confectionery"]
BRUNCH_BREAKFAST = ["breakfast_restaurant", "brunch_restaurant"]
BAR_PUB = ["bar", "pub", "sports_bar", "cocktail_bar", "lounge_bar", "hookah_bar", "beer_garden", "wine_bar", "gastropub", "irish_pub", "brewpub"]
BREWERY_WINERY = ["brewery", "winery"]
VEGETARIAN_VEGAN = ["vegan_restaurant", "vegetarian_restaurant", "salad_shop", "juice_shop"]
FINE_DINING = ["fine_dining_restaurant"]
BUFFET = ["buffet_restaurant", "cafeteria"]
HALAL = ["halal_restaurant"]
FAMILY_RESTAURANT = ["family_restaurant"]
SOUP = ["soup_restaurant"]
TAPAS = ["tapas_restaurant"]

CUISINE_TYPES: dict[str, str] = {
    "Chinese": CHINESE,
    "Japanese": JAPANESE,
    "Korean": KOREAN,
    "Asian": ASIAN,
    "South Asian": SOUTH_ASIAN,
    "Southeast Asian": SOUTHEAST_ASIAN,
    "Middle Eastern": MIDDLE_EASTERN,
    "Kebab Shop": KEBAB_SHOP,
    "European": EUROPEAN,
    "Mediterranean": MEDITERRANEAN,
    "Bistro": BISTRO,
    "French": FRENCH,
    "German": GERMAN,
    "Italian": ITALIAN,
    "Eastern European": EASTERN_EUROPEAN,
    "Southern European": SOUTHERN_EUROPEAN,
    "Northern European": NORHERN_EUROPEAN,
    "British": BRITISH,
    "Australian": AUSTRALIAN,
    "American": AMERICAN,
    "Latin American": LATIN_AMERICAN,
    "African": AFRICAN,
    "Fast Food": FAST_FOOD,
    "Pizza": PIZZA,
    "Burgers": BURGERS,
    "Seafood": SEAFOOD,
    "Steakhouse & BBQ": STEAKHOUSE_BBQ,
    "Sandwich & Deli": SANDWICH_DELI,
    "Cafe & Coffee": CAFE_COFFEE,
    "Bakery & Pastry": BAKERY_PASTRY,
    "Dessert & Ice Cream": DESSERT_ICE_CREAM,
    "Bar & Pub": BAR_PUB,
    "Brewery & Winery": BREWERY_WINERY,
    "Brunch & Breakfast": BRUNCH_BREAKFAST,
    "Vegetarian & Vegan": VEGETARIAN_VEGAN,
    "Fine Dining": FINE_DINING,
    "Buffet": BUFFET,
    "Halal": HALAL,
    "Family Restaurant": FAMILY_RESTAURANT,
    "Soup": SOUP,
    "Tapas": TAPAS,
}

# Types that carry no cuisine signal — skip these when scanning the types array
UNSPECIFIED = {"restaurant", "food", "point_of_interest", "establishment", "store",
    "meal_delivery", "meal_takeaway", "local_food_market"}
