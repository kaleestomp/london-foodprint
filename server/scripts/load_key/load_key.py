from pathlib import Path
import os
from dotenv import load_dotenv

def load_key():
    env_file = _find_upwards(".env.local", Path.cwd())
    if env_file is None:
        print("Warning: .env.local not found from current working directory upward.")
    else:
        load_dotenv(env_file, override=False)
    #     print(f"Loaded env file: {env_file}")
    # print("GOOGLE_PLACES_API_KEY present:", bool(os.environ.get("GOOGLE_PLACES_API_KEY")))

def _find_upwards(filename: str, start: Path) -> Path | None:
    for p in [start, *start.parents]:
        candidate = p / filename
        if candidate.exists():
            return candidate
    return None

