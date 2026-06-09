# ── Keyword patterns for detailed Google place type inference ────────────────
# Ordered most→least specific to avoid generic matches swallowing precise ones.
KEYWORD_MAP: list[tuple[str, str]] = [
    (r"\btonkatsu\b", "tonkatsu_restaurant"),
    (r"\byakitori\b", "yakitori_restaurant"),
    (r"\bizakaya\b", "japanese_izakaya_restaurant"),
    (r"\bsushi\b", "sushi_restaurant"),
    (r"\bramen\b", "ramen_restaurant"),
    (r"\b(?:udon|soba|bento|tempura|wasabi|matcha|omakase|hakari)\b", "japanese_restaurant"),

    (r"\bdim\s?sum\b|\byum\s?cha\b", "dim_sum_restaurant"),
    (r"\bdumpling\b|\bwonton\b|\bxiao\s?long\b|\bbao\b|\bbaozi\b", "dumpling_restaurant"),
    (r"\b(?:szechuan|sichuan|peking|cantones|china|chinese|mapo|beijing)\b", "chinese_restaurant"),
    (r"\b(?:dandan|duck|zing|zheng|chen|ming|li|hong|zhang|zeng)\b", "chinese_restaurant"),    
    (r"\b(?:jian|bing)\b", "chinese_restaurant"),
    (r"\b(?:cantones)\b", "cantonese_restaurant"),
    

    (r"\bkorean\s?bbq\b|\bbbq\s?korean\b|\bgalbi\b|\bbulgogi\b", "korean_barbecue_restaurant"),
    (r"\bkorean\b|\bbibimbap\b", "korean_restaurant"),

    (r"\bpad\s?thai\b|\bsiamese\b|\bthai\b", "thai_restaurant"),
    (r"\bpho\b|\bbanh\s?mi\b|\bvietnamese\b|\bviet\b", "vietnamese_restaurant"),

    (r"\bdosa\b", "south_indian_restaurant"),
    (r"\bsri\s?lanka\b|\bceylon\b", "sri_lankan_restaurant"),
    (r"\bpakistan\b", "pakistani_restaurant"),
    (r"\bbengali\b", "bangladeshi_restaurant"),
    (r"\b(?:indian|curry|tandoor|masala|biryani|chaat)\b", "indian_restaurant"),
    (r"\b(?:nepal(?:ese)?|momo|wagamama|chowmein)\b", "asian_restaurant"),

    (r"\bshawarma\b", "shawarma_restaurant"),
    (r"\bfalafel\b", "falafel_restaurant"),
    (r"\bkebab\b", "kebab_shop"),
    (r"\blebanes\b|\bbeirut\b", "lebanese_restaurant"),
    (r"\bturk(?:ish)?\b|\bistanbul\b", "turkish_restaurant"),
    (r"\bpersian\b|\biran(?:ian)?\b", "persian_restaurant"),
    (r"\bmoroc\b", "moroccan_restaurant"),
    (r"\b(?:arab|hummus|meze|syrian|habibi)\b", "middle_eastern_restaurant"),

    (r"\btaco\b", "taco_restaurant"),
    (r"\bburrito\b", "burrito_restaurant"),
    (r"\bmexican\b", "mexican_restaurant"),
    (r"\bbrazil\b", "brazilian_restaurant"),
    (r"\bchilean\b", "chilean_restaurant"),
    (r"\bperu(?:vian)?\b|\bceviche\b", "peruvian_restaurant"),
    (r"\bcuban\b", "cuban_restaurant"),
    (r"\bcolombian\b", "colombian_restaurant"),
    (r"\bcaribbean\b|\bjerk\b", "caribbean_restaurant"),
    (r"\blatino?\b|\bel\b|\bcantina\b", "latin_american_restaurant"),

    (r"\bpizzeria\b|\bpizza\b", "pizza_restaurant"),
    (r"\btrattoria\b|\brisotto\b|\bpasta\b|\bitalian\b|\bitaliana\b", "italian_restaurant"),
    (r"\bpaella\b|\bspanish\b", "spanish_restaurant"),
    (r"\bfrench\b|\bL’\b|\bL'\b|\bdu\b|\bbrasserie\b", "french_restaurant"),
    (r"\bgreek\b", "greek_restaurant"),
    (r"\bportuguese\b", "portuguese_restaurant"),
    (r"\bbritish\b|\bgordon ramsay\b|\bjamie oliver\b", "british_restaurant"),
    (r"\bgerman\b", "german_restaurant"),
    (r"\bscandinavian\b|\bnordic\b|\bbaltic\b", "scandinavian_restaurant"),

    (r"\bcajun\b", "cajun_restaurant"),
    (r"\btex.?mex\b", "tex_mex_restaurant"),
    (r"\bhawaiian\b", "hawaiian_restaurant"),
    (r"\bamerican\b|\bsouthern\b", "american_restaurant"),

    (r"\bethiopian\b", "ethiopian_restaurant"),
    (r"\b(?:african|nigerian|ghana(?:ian)?|west\s?africa|somalian)\b|\bafro\b", "african_restaurant"),

    (r"\bindonesian\b", "indonesian_restaurant"),
    (r"\bmalay(?:sian)?\b", "malaysian_restaurant"),
    (r"\bfilipino\b|\bphilippin\b", "filipino_restaurant"),
    (r"\bcambodian\b", "cambodian_restaurant"),
    (r"\bburmese\b|\bmyanmar\b", "burmese_restaurant"),
    (r"\bsingapore(?:an)?\b|\basian\b", "asian_restaurant"),

    (r"\bsmash\b|\bburgers?\b", "hamburger_restaurant"),
    (r"\bfish\s?&?\s?chips?\b", "fish_and_chips_restaurant"),
    (r"\boyster\b", "oyster_bar_restaurant"),
    (r"\b(?:lobsters?|crab|shrimp|seafood|fish)\b", "seafood_restaurant"),

    (r"\bsteak\b", "steak_house"),
    (r"\bbarbecue\b|\bbbq\b|\bchurrasco\b|\bsmokehouse\b", "barbecue_restaurant"),
    (r"\bgrill\b", "bar_and_grill"),

    (r"\bbreakfast\b|\bpancakes\b|\bpancake\b", "breakfast_restaurant"),
    (r"\bcaffe\b|\bcafe\b", "cafe"),
    (r"\bcoffee\b", "coffee_shop"),
    (r"\bboba\b|\bbubble\s?tea\b|\bteahouse\b|\btea\s?house\b", "tea_house"),

    (r"\bbakehouse\b|\bbakery\b", "bakery"),
    (r"\bpastry\b|\bcroissant\b|\bboulanger\b|\bpatisserie\b", "pastry_shop"),

    (r"\bice\s?cream\b|\bgelato\b", "ice_cream_shop"),
    (r"\bchocolate\b", "chocolate_shop"),
    (r"\bdessert\b|\bsweets?\b|\bcrepe\b|\bchuros\b", "dessert_shop"),

    (r"\bvegan\b", "vegan_restaurant"),
    (r"\bvegetarian\b|\bplant.?based\b", "vegetarian_restaurant"),

    (r"\bwine\s?bar\b|\bgin\s?bar\b", "wine_bar"),
    (r"\bbrewpub\b", "brewpub"),
    (r"\bbrewery\b", "brewery"),
    (r"\bpub\b|\btavern\b|\bale\b", "pub"),

    (r"\bfast\s?food\b", "fast_food_restaurant"),
    (r"\bfried\s?chicken\b|\bchicken\b|\bwings\b", "chicken_restaurant"),
    (r"\bperi\b|\broosters\b", "chicken_restaurant"),
    (r"\bhalal\b", "halal_restaurant"),
    (r"\bsandwich\b|\bsub\b|\bhoagie\b|\bpanini\b", "sandwich_shop")
]