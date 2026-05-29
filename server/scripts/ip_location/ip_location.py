import httpx

_LOOPBACK = {"127.0.0.1", "::1", "localhost"}
_LOOPBACK_DEFAULT = {"lat": 51.5074, "lon": -0.1278, "district": "", "city": "London", "region": "England", "country": "GB", "zip": ""}


async def lookup_ip_location(ip: str) -> dict:
    """Return granular {lat, lon, district, city, region, country, zip} for an IP via ip-api.com.
    Falls back to a London default for loopback addresses (local dev)."""
    if ip in _LOOPBACK:
        return _LOOPBACK_DEFAULT

    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.get(
            f"https://ip-api.com/json/{ip}",
            params={"fields": "status,lat,lon,district,city,regionName,countryCode,zip"},
        )
    resp.raise_for_status()
    data = resp.json()

    if data.get("status") != "success":
        raise ValueError(f"ip-api returned non-success status for IP {ip}")

    return {
        "lat": data["lat"],
        "lon": data["lon"],
        "district": data.get("district", ""),
        "city": data.get("city", ""),
        "region": data.get("regionName", ""),
        "country": data.get("countryCode", ""),
        "zip": data.get("zip", ""),
    }
