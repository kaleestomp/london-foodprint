from fastapi import APIRouter, Request
from api.ip_location.get_clientIP import get_clientIP
from api.ip_location.lookup_ip import lookup_ip
router = APIRouter()

@router.get("/api/ip-location")
async def lookup_my_location(request: Request) -> dict:
    """Best-effort geolocation for the caller's IP from request headers."""
    client_ip = get_clientIP(request)

    return await lookup_ip(client_ip)
