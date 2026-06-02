import pandas as pd
from pathlib import Path

def scan_files(path: Path) -> pd.DataFrame: 
    # Scan files
    files = [f for f in path.glob("**/*.csv") if f.is_file()]
    return files