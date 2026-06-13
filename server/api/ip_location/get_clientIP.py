import os
from fastapi import Request

_LOOPBACK = {"127.0.0.1", "::1", "localhost"}

def get_clientIP(request: Request) -> str:
    """Resolve client IP from proxy headers or connection info."""
    cf_ip = request.headers.get("cf-connecting-ip")
    if cf_ip:
        return cf_ip.strip()

    xff = request.headers.get("x-forwarded-for")
    if xff:
        # X-Forwarded-For can be a comma-separated chain; first is the client.
        first = xff.split(",", 1)[0].strip()
        if first:
            return first

    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()

    if request.client and request.client.host:
        ip = request.client.host
        if ip in _LOOPBACK and _is_dev_env():
            override_ip = _dev_ip_override()
            if override_ip:
                return override_ip
        return ip

    return "127.0.0.1"

def _is_dev_env() -> bool:
    app_env = (os.getenv("APP_ENV") or os.getenv("ENV") or "").strip().lower()
    return app_env in {"dev", "development", "local"}

def _dev_ip_override() -> str:
    # Prefer existing repo convention, but keep compatibility with older name.
    return (
        os.getenv("DEV_REAL_CLIENT_IP")
        or os.getenv("DEV_IP_OVERRIDE")
        or ""
    ).strip()
