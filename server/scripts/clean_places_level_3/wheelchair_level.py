def wheelchair_level(options):
    if not isinstance(options, dict): return None
    entry = 1 if options.get("wheelchairAccessibleEntrance") else 0
    seating = 1 if options.get("wheelchairAccessibleSeating") else 0
    parking = 1 if options.get("wheelchairAccessibleParking") else 0
    if entry and seating and parking: return 2
    elif entry and (seating or parking): return 1
    else: return 0