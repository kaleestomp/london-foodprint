import os
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query, Request
import httpx

from fastapi import Depends
from fastapi.security.api_key import APIKeyHeader

from fastapi.middleware.cors import CORSMiddleware
from server.scripts.NotUsed.read_db.read_db import read_db_test, read_tree 
from server.scripts.NotUsed.scan_files.scan_files import scan_files
from server.scripts.NotUsed.geocode.geocode import geocode_query, reverse_geocode
from server.scripts.NotUsed.ip_location.ip_location import lookup_ip_location

SERVER_ROOT = Path(__file__).resolve().parent
DATA_ROOT = (SERVER_ROOT / "../public/data_samples").resolve()

app = FastAPI(title="Data Provider API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Convert Relative Path to Absolute ---- 
def _safe_resolve(relative_path: str) -> Path:
    target = (DATA_ROOT / relative_path).resolve()
    if target != DATA_ROOT and DATA_ROOT not in target.parents:
        raise HTTPException(status_code=400, detail="Invalid path")
    return target

# Report Filing Structure within an Option's Directory ---- 
@app.get("/api/read-snap")
def read_snap():
  try:
    path = _safe_resolve("")
    if not path.exists() or not path.is_dir():
        raise HTTPException(status_code=404, detail="Data directory not found")
    snap = scan_files(path)
    if snap is None:
        raise HTTPException(status_code=500, detail="Failed to read snapshot data")
    
    return snap 
  
  except HTTPException:
        raise
  except Exception as error:
    print('Error reading snapshot data:', error)
    raise HTTPException(status_code=500, detail="Failed to read snapshot data")

@app.get("/api/read-db")
def read_db(path: str | None = None): 
  try:
    data = read_db_test(path)
    if data is None:
        raise HTTPException(status_code=500, detail="Failed to read database")
    
    return data
  
  except HTTPException:
        raise
  except Exception as error:
    print('Error reading database:', error)
    raise HTTPException(status_code=500, detail="Failed to read database")

@app.get("/api/read-tree")
def read_tree_data(path: str | None = None): 
  try:
    data = read_tree(path)
    if data is None:
        raise HTTPException(status_code=500, detail="Failed to read database")
    
    return data
  
  except HTTPException:
        raise
  except Exception as error:
    print('Error reading database:', error)
    raise HTTPException(status_code=500, detail="Failed to read database")

@app.get("/api/my-location")
async def my_location(request: Request):
    try:
        forwarded = request.headers.get("x-forwarded-for")
        ip = forwarded.split(",")[0].strip() if forwarded else request.client.host
        return await lookup_ip_location(ip)
    except HTTPException:
        raise
    except Exception as error:
        print("my-location error:", error)
        raise HTTPException(status_code=502, detail="Location service unavailable")


@app.get("/api/geocode")
async def geocode(q: str = Query(..., min_length=1)):
    try:
        return await geocode_query(q)
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail="Geocoding request failed")
    except Exception as error:
        print("Geocode proxy error:", error)
        raise HTTPException(status_code=502, detail="Geocoding service unavailable")


@app.get("/api/reverse-geocode")
async def reverse_geocode_endpoint(lat: float = Query(...), lon: float = Query(...)):
    try:
        return await reverse_geocode(lat, lon)
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail="Reverse geocoding request failed")
    except Exception as error:
        print("Reverse geocode proxy error:", error)
        raise HTTPException(status_code=502, detail="Geocoding service unavailable")


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "3000"))
    uvicorn.run("server.server:app", host="0.0.0.0", port=port, reload=False)