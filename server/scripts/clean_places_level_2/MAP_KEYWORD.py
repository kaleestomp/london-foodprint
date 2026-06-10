# Generic labels are useful but less reliable when they are the only match.
LOW_SIGNAL_KEYWORD_TYPES = {
    "asian_restaurant",
    "american_restaurant",
    "seafood_restaurant",
    "chicken_restaurant",
    "bar_and_grill",
    "pub",
    "cafe",
    "coffee_shop",
    "fast_food_restaurant",
}
# ── Keyword patterns for detailed Google place type inference ────────────────
# Ordered most→least specific to avoid generic matches swallowing precise ones.
KEYWORD_MAP: list[tuple[str, str]] = [
    # 1) Brand cues
    # High-confidence establishment/chain names.
    (r"\bpret\s?a\s?manger\b", "sandwich_shop"),
    (r"\bitsu\b", "japanese_restaurant"),
    (r"\byoumesushi\b", "sushi_restaurant"),
    (r"\bfarmer\s?j\b", "salad_shop"),
    (r"\btossed\b", "salad_shop"),
    (r"\bcoco\s?di\s?mama\b", "italian_restaurant"),
    (r"\bbread\s?street\s?kitchen\b", "british_restaurant"),
    (r"\bbread\s?(?:&|and)\s?truffle\b", "sandwich_shop"),
    (r"\bleon\b", "fast_food_restaurant"),
    (r"\b(?:atis|eat\s?activ|natural\s?fitness\s?food|simple\s?health\s?kitchen)\b", "salad_shop"),
    (r"\bbirley'?s?\b", "sandwich_shop"),
    (r"\bhare\s?&\s?tortoise\b", "asian_restaurant"),
    (r"\binamo\s?sukoshi\b|\bsukoshi\b", "japanese_restaurant"),
    (r"\baoki\b", "japanese_restaurant"),
    (r"\bjamaica\s?patty\b", "caribbean_restaurant"),
    (r"\bwest\s?cornwall\s?pasty\b", "bakery"),
    (r"\bhoppers\b", "sri_lankan_restaurant"),
    (r"\bkricket\b", "indian_restaurant"),
    (r"\bbusaba\b", "thai_restaurant"),
    (r"\boshpaz\b", "asian_restaurant"),
    (r"\bpadella\b", "italian_restaurant"),
    (r"\bceru\b", "mediterranean_restaurant"),
    (r"\bbrother\s?marcus\b", "mediterranean_restaurant"),
    (r"\bflesh\s?&\s?buns\b", "japanese_restaurant"),
    (r"\bzima\b", "eastern_european_restaurant"),
    (r"\brice\s?guys\b", "asian_restaurant"),
    (r"\babokado\b", "asian_restaurant"),
    (r"\bchopstix\b", "chinese_restaurant"),
    (r"\benish\b|\bjollof\b|\bsuya\b", "african_restaurant"),
    (r"\b(?:morley'?s?|chicken\s?cottage|sam'?s\s?chicken|pepe'?s\s?piri\s?piri|rio'?s\s?piri\s?piri)\b", "chicken_restaurant"),
    (r"\bpiri\s?piri\b|\bperi\s?peri\b", "chicken_restaurant"),
    (r"\bold\s?chang\s?kee\b", "asian_restaurant"),
    (r"\bafternoon\s?tea\b", "tea_house"),

    # 2) Language cues
    # Foreign/transliterated words and culturally specific lexical cues.
    (r"\bbistro\b", "bistro"),
    (r"\bgolden\s?palace\b|\bshanghai\b|\bmalatang\b", "chinese_restaurant"),
    (r"\b(?:dandan|zing|zheng|chen|ming|li|hong|zhang|zeng)\b", "chinese_restaurant"),
    (r"\b(?:al\s?yemen|yemen(?:i)?|yamany|mandi)\b", "middle_eastern_restaurant"),
    ("\\bg(?:o|\\u00f6)zleme\\b", "turkish_restaurant"),
    (r"\b(?:injera|habesha|asmara|ge'?ez|waakye|buka)\b", "african_restaurant"),
    (r"\b(?:uyghur|lagman|plov)\b", "asian_restaurant"),
    (r"\b(?:onigiri|donburi)\b", "japanese_restaurant"),
    (r"\b(?:nihari|lahore|karachi|pakora)\b", "pakistani_restaurant"),
    ("\\bpapel(?:on|\\u00f3n)\\b|\\brinc(?:on|\\u00f3n)\\b|\\bparrilla\\b", "latin_american_restaurant"),
    ("\\bcaff(?:e|\\u00e8)?\\b|\\bcaf(?:e|\\u00e9)\\b", "cafe"),

    # 3) Cuisine cues
    # Cuisine, dish, preparation, and regional food terms.
    (r"\btonkatsu\b", "tonkatsu_restaurant"),
    (r"\byakitori\b", "yakitori_restaurant"),
    (r"\bizakaya\b", "japanese_izakaya_restaurant"),
    (r"\bsushi\b", "sushi_restaurant"),
    (r"\bsushidog\b", "sushi_restaurant"),
    (r"\bramen\b", "ramen_restaurant"),
    (r"\bwagamama\b", "japanese_restaurant"),
    (r"\b(?:udon|soba|bento|tempura|wasabi|matcha|omakase|hakari)\b", "japanese_restaurant"),

    (r"\bdim\s?sum\b|\byum\s?cha\b", "dim_sum_restaurant"),
    (r"\bdumpling\b|\bwonton\b|\bxiao\s?long\b|\bbao\b|\bbaozi\b", "dumpling_restaurant"),
    (r"\bwok\b|\bnoodles?\b", "noodle_shop"),
    (r"\b(?:szechuan|sichuan|peking|china|chinese|mapo|beijing|hot\s?pot|peking\s?duck)\b", "chinese_restaurant"),
    (r"\b(?:jian|bing)\b", "chinese_restaurant"),
    (r"\b(?:cantones)\b", "cantonese_restaurant"),

    (r"\bkorean\s?bbq\b|\bbbq\s?korean\b|\bgalbi\b|\bbulgogi\b", "korean_barbecue_restaurant"),
    (r"\bkorean\b|\bbibimbap\b|\bkimchi\b|\btteokbokki\b|\bkimbap\b", "korean_restaurant"),

    (r"\bpad\s?thai\b|\bsiamese\b|\bthai\b", "thai_restaurant"),
    (r"\bpho\b|\bbanh\s?mi\b|\bsaigon\b|\bvietnamese\b|\bviet\b", "vietnamese_restaurant"),

    (r"\bdosa\b", "south_indian_restaurant"),
    (r"\bsri\s?lanka\b|\bceylon\b", "sri_lankan_restaurant"),
    (r"\bpakistan\b", "pakistani_restaurant"),
    (r"\bbengali\b", "bangladeshi_restaurant"),
    (r"\b(?:indian|curry|tandoor|masala|biryani|chaat)\b", "indian_restaurant"),
    (r"\b(?:nepal(?:ese)?|momo|chowmein|asian)\b", "asian_restaurant"),

    (r"\bshawarma\b", "shawarma_restaurant"),
    (r"\bfalafel\b", "falafel_restaurant"),
    (r"\bkebab\b", "kebab_shop"),
    (r"\blebanese\b|\bbeirut\b", "lebanese_restaurant"),
    (r"\bturk(?:ish)?\b|\bistanbul\b|\bdoner\b|\bocakbasi\b|\bmangal\b", "turkish_restaurant"),
    (r"\bpersian\b|\biran(?:ian)?\b", "persian_restaurant"),
    (r"\bmoroc\b", "moroccan_restaurant"),
    (r"\b(?:arab|hummus|meze|mezze|syrian|habibi|manoushe)\b", "middle_eastern_restaurant"),

    (r"\btaqueria\b|\bantojitos\b", "mexican_restaurant"),
    (r"\bempanadas?\b", "latin_american_restaurant"),
    (r"\btaco\b", "taco_restaurant"),
    (r"\bburrito\b", "burrito_restaurant"),
    (r"\bmexican\b", "mexican_restaurant"),
    (r"\bbrazil\b", "brazilian_restaurant"),
    (r"\bchilean\b", "chilean_restaurant"),
    (r"\bperu(?:vian)?\b|\bceviche\b", "peruvian_restaurant"),
    (r"\bcuban\b", "cuban_restaurant"),
    (r"\bcolombian\b", "colombian_restaurant"),
    (r"\bcaribbean\b|\bjerk\b", "caribbean_restaurant"),
    (r"\blatino?\b|\bcantina\b", "latin_american_restaurant"),

    (r"\bpizzeria\b|\bpizza\b", "pizza_restaurant"),
    (r"\btrattoria\b|\bosteria\b|\bristorante\b|\brisotto\b|\bpasta\b|\bitalian\b|\bitaliana\b|\bnapoletana\b", "italian_restaurant"),
    (r"\bpaella\b|\bspanish\b", "spanish_restaurant"),
    ("\\btapas\\b|\\bjam(?:on|\\u00f3n)\\b", "tapas_restaurant"),
    (r"\bfrench\b|\bbrasserie\b|\bmontmartre\b", "french_restaurant"),
    (r"\bgreek\b|\bsouvlaki\b|\bgyros?\b", "greek_restaurant"),
    (r"\bportuguese\b", "portuguese_restaurant"),
    (r"\bbritish\b|\bgordon ramsay\b|\bjamie oliver\b", "british_restaurant"),
    (r"\bgerman\b", "german_restaurant"),
    (r"\bscandinavian\b|\bnordic\b|\bbaltic\b", "scandinavian_restaurant"),

    (r"\bcajun\b", "cajun_restaurant"),
    (r"\btex.?mex\b", "tex_mex_restaurant"),
    ("\\bhawaiian\\b|\\bpok(?:e|\\u00e9)\\b", "hawaiian_restaurant"),
    (r"\bamerican\b|\bsouthern\b", "american_restaurant"),

    (r"\bethiopian\b", "ethiopian_restaurant"),
    (r"\b(?:african|nigerian|ghana(?:ian)?|west\s?africa|somalian)\b|\bafro\b", "african_restaurant"),

    (r"\bindonesian\b", "indonesian_restaurant"),
    (r"\bmalay(?:sian)?\b", "malaysian_restaurant"),
    (r"\bfilipino\b|\bphilippin\b", "filipino_restaurant"),
    (r"\bcambodian\b", "cambodian_restaurant"),
    (r"\bburmese\b|\bmyanmar\b", "burmese_restaurant"),
    (r"\bsingapore(?:an)?\b", "asian_restaurant"),

    (r"\bsmash\b|\bburgers?\b", "hamburger_restaurant"),
    (r"\bfish\s?&?\s?chips?\b|\bchippy\b", "fish_and_chips_restaurant"),
    (r"\boyster\b", "oyster_bar_restaurant"),
    (r"\b(?:lobsters?|crab|shrimp|seafood|fish)\b", "seafood_restaurant"),

    (r"\bsteak\b", "steak_house"),
    (r"\bbarbecue\b|\bbbq\b|\bchurrasco\b|\bsmokehouse\b", "barbecue_restaurant"),
    (r"\bgrill\b", "bar_and_grill"),

    # 4) Other cues
    # Broader venue/meal-format/style cues that are useful but less specific.
    (r"\bbottomless\s?brunch\b|\bbrunch\b", "brunch_restaurant"),
    (r"\bbreakfast\b|\bpancakes\b|\bpancake\b", "breakfast_restaurant"),
    (r"\bcoffee\b", "coffee_shop"),
    (r"\bboba\b|\bbubble\s?tea\b|\bteahouse\b|\btea\s?house\b", "tea_house"),

    (r"\bbakehouse\b|\bbakery\b", "bakery"),
    (r"\bpastry\b|\bcroissant\b|\bboulanger\b|\bpatisserie\b", "pastry_shop"),

    (r"\bice\s?cream\b|\bgelato\b", "ice_cream_shop"),
    (r"\bchocolate\b", "chocolate_shop"),
    (r"\bdessert\b|\bsweets?\b|\bcrepe\b|\bchurros\b", "dessert_shop"),

    (r"\bvegan\b", "vegan_restaurant"),
    (r"\bvegetarian\b|\bplant.?based\b", "vegetarian_restaurant"),

    (r"\bwine\s?bar\b|\bgin\s?bar\b", "wine_bar"),
    (r"\bbrewpub\b", "brewpub"),
    (r"\bbrewery\b", "brewery"),
    (r"\bpub\b|\btavern\b|\balehouse\b|\breal\s?ale\b", "pub"),

    (r"\bfood\s?court\b", "food_court"),
    (r"\bfast\s?food\b", "fast_food_restaurant"),
    (r"\bfried\s?chicken\b|\bchicken\s?wings?\b|\bwings\b", "chicken_restaurant"),
    (r"\bperi\b|\broosters\b", "chicken_restaurant"),
    (r"\bhalal\b", "halal_restaurant"),
    (r"\bsandwich\b|\bsubs?\b|\bdeli\b|\bhoagie\b|\bpanini\b", "sandwich_shop")
]