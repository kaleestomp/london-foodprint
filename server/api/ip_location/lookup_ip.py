import httpx
_LOOPBACK = {"127.0.0.1", "::1", "localhost"}
_LOOPBACK_DEFAULT = {"lat": None, "lon": None, "district": None, "city": None, "region": None, "country": None, "zip": None}
_IP_API_URL = "http://ip-api.com/json"

async def lookup_ip(ip: str) -> dict:
    """Return {lat, lon, district, city, region, country, zip} for an IP.
    Falls back to a London default for loopback/dev/error cases."""
    if ip in _LOOPBACK:
        return _LOOPBACK_DEFAULT

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"{_IP_API_URL}/{ip}",
                params={"fields": "status,lat,lon,district,city,regionName,countryCode,zip"},
            )
        resp.raise_for_status()
        data = resp.json()
        if data.get("status") != "success":
            return _LOOPBACK_DEFAULT
    except Exception:
        return _LOOPBACK_DEFAULT

    return {
        "lat": data["lat"],
        "lon": data["lon"],
        "district": data.get("district", ""),
        "city": data.get("city", ""),
        "region": data.get("regionName", ""),
        "country": data.get("countryCode", ""),
        "zip": data.get("zip", ""),
    }