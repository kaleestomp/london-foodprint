# Session Notes — London Foodprint: Data Pipeline & Ranking Algorithm
**Date:** June 3–7, 2026

---

## 1. Git & Environment Setup

### Sync local repo to remote master
```bash
git fetch origin
git reset --hard origin/master
```
Use this to discard all local changes and fully match `origin/master`.

### `__pycache__` tracked by git (pre-existing issue)
- `.gitignore` has `__pycache__` but 15 `.pyc` files were already tracked (committed before the rule existed).
- To untrack: `git rm --cached` on all `**/__pycache__/**` files.

### pip was corrupted in server venv
Fixed by:
```bash
python -m ensurepip --upgrade
python -m pip install --upgrade pip
```

### Installed packages into notebook kernel
- `python-dotenv`
- `geopandas`

---

## 2. `adaptive_hexsearch` — Module Import Fix

### Problem
`from h3.h3_load import ...` was resolving to the **installed Uber H3 library** (`site-packages/h3`) instead of the local `h3/` folder.

### Solution: Absolute imports from repo root
1. Created `__init__.py` in every package directory in the chain:
   - `server/__init__.py`
   - `server/scripts/__init__.py`
   - `server/scripts/adaptive_hexsearch/__init__.py`
   - `server/scripts/adaptive_hexsearch/h3/__init__.py`
   - `server/scripts/adaptive_hexsearch/request_places/__init__.py`

2. Updated `run.ipynb` cell 1 to insert repo root into `sys.path`:
```python
import sys
from pathlib import Path
_repo_root = Path.cwd().parents[2]  # adaptive_hexsearch/ -> scripts/ -> server/ -> london-foodprint/
if str(_repo_root) not in sys.path:
    sys.path.insert(0, str(_repo_root))
```

3. All notebook imports updated to absolute paths:
```python
from server.scripts.adaptive_hexsearch.h3.h3_load import load_boundary_from_json
from server.scripts.adaptive_hexsearch.h3.h3_seedtiles import init_h3
# etc.
```

4. Fixed bare import in `request_places.py`:
```python
# Before
from load_key import load_key
# After
from server.scripts.adaptive_hexsearch.request_places.load_key import load_key
```

---

## 3. Wilson Score Ranking (`wilson_score.ipynb`)

### Why Wilson Score over naive rating sort?
A 5.0-star restaurant with 3 reviews is **less trustworthy** than a 4.8-star with 400 reviews. Wilson Score's lower confidence bound captures this — more reviews → tighter interval → higher lower bound.

### Algorithm

**Wilson Score lower bound:**
$$\text{wilson} = \frac{\hat{p} + \frac{z^2}{2n} - z\sqrt{\frac{\hat{p}(1-\hat{p})}{n} + \frac{z^2}{4n^2}}}{1 + \frac{z^2}{n}}$$

Where:
- $\hat{p} = (\text{rating} - 1) / 4$ — normalises [1–5] to [0–1]
- $n$ = `userRatingCount`
- $z$ = z-score for chosen confidence (0.99 → 2.576)

**Confidence parameter:**
- `0.99` — conservative, favours well-established places with many reviews
- `0.95` — gives newer high-rated places a larger boost

**Bayesian Average (IMDb-style, implemented as reference):**
$$WR = \frac{v}{v+m} \cdot R + \frac{m}{v+m} \cdot C$$
- $v$ = review count, $R$ = item mean rating
- $m$ = dataset median review count (prior count)
- $C$ = global mean rating

### Implementation (`wilson_score.ipynb`)
```python
Z_TABLE = {0.90: 1.645, 0.95: 1.960, 0.99: 2.576}

def wilson_score(rating, count, confidence=0.99):
    z = Z_TABLE[confidence]
    p = (rating - 1) / 4.0
    n = count
    return (p + z**2/(2*n) - z*sqrt(p*(1-p)/n + z**2/(4*n**2))) / (1 + z**2/n)
```

---

## 4. `summaryType` — Condensing Google Maps Types (`wilson_score.ipynb`)

### Problem
Google Maps returns ~170 very granular types. Needed condensing to ~27 meaningful categories.

### Solution: Three-stage resolution pipeline
1. **`primaryType` direct lookup** — map to `TYPE_TO_SUMMARY` dict
2. **Scan `types` array** — skip generic tokens (`restaurant`, `food`, `establishment`), take first meaningful hit
3. **Keyword regex on `displayName` + `primaryTypeDisplayName`** — catches `"Pho Saigon"` → `"Vietnamese"` etc.
4. **Fallback** → `"Restaurant"`

### 27 condensed categories
`Chinese`, `Japanese`, `Korean`, `Thai`, `Vietnamese`, `South Asian`, `Southeast Asian`, `Middle Eastern`, `Asian (Other)`, `European`, `American`, `Latin American`, `African`, `Fast Food`, `Pizza`, `Burgers`, `Seafood`, `Steakhouse & BBQ`, `Sandwich & Deli`, `Cafe & Coffee`, `Bakery & Pastry`, `Dessert & Ice Cream`, `Bar & Pub`, `Brewery & Winery`, `Brunch & Breakfast`, `Vegetarian & Vegan`, `Fine Dining`, `Buffet`, `Halal`, `Restaurant` (unresolved)

---

## 5. Percentile Rank by Type (`wilson_score.ipynb`)

Ranks each `primaryType` independently and expresses position as a within-type percentile:
- **`type_rank`** — position within `primaryType` group (1 = best)
- **`type_percentile`** — 0–100 (100 = top of its type)

Prevents niche cuisines (Ethiopian, Korean) from being buried under volume of more common categories.

---

## 6. Region Bias — Theory & Roadmap

### Three types of bias (relevant once multi-region data collected)

| Bias | Signal | Fix |
|---|---|---|
| **Type-distribution imbalance** | Chinatown has 40 Chinese restaurants; Chelsea has 2 | JSD between region type distributions |
| **Review-volume inflation** | Tourist areas have 5–10× more reviews → inflated Wilson Scores | Region-normalise review counts; region z-score on scores |
| **Rating-distribution shift** | Some areas score systematically higher/lower | Check mean & std of `rating` by region |

### Jensen-Shannon Divergence (JSD)
Measures how different two regions' cuisine distributions are:
$$JSD(P \| Q) = \frac{1}{2} D_{KL}(P \| M) + \frac{1}{2} D_{KL}(Q \| M), \quad M = \frac{P+Q}{2}$$

- **0** = identical distributions, **1** = completely different
- JSD < 0.1 → cross-region percentiles are fair
- JSD > 0.3 → switch to local-only percentile for that type

JSD is the **diagnostic**; representation ratio $\rho$ is the **correction mechanism**.

---

## 7. Competition-Adjusted Wilson Score (`wilson_score.ipynb`)

### Core idea: Representation Ratio $\rho$
$$\rho_{T,R} = \frac{P(T \mid R)}{P(T \mid \text{global})}$$

Chinese in Chinatown (40% local, 8% global) → $\rho = 5.0$ — 5× more competitive than average.

### Adjusted score formula
$$\text{adjusted\_score} = \text{wilson\_score} \times (1 + \alpha \cdot \ln(\max(\rho, 1)))$$

- Only **boosts** over-represented cuisines, never penalises under-represented ones
- $\alpha$ = tuning parameter (0.1 subtle → 0.5 aggressive; default `0.3`)
- $\ln$ dampens extreme $\rho$ values

### Behaviour
| Scenario | $\rho$ | boost factor ($\alpha=0.3$) |
|---|---|---|
| Average competition | 1.0 | ×1.00 |
| Chinese in Chinatown ($\rho=5$) | 5.0 | ×1.48 |
| Chinese in Chelsea ($\rho=0.25$) | 0.25 → clamped to 1.0 | ×1.00 |

### Current status
- **Single region today** → $\rho = 1$ everywhere → `adjusted_score = wilson_score` (no-op)
- **Once `region` column added** → activates automatically, no code changes needed

---

## 8. Diagnostic Cells (to add once multi-region data is ready)

```python
# Type distribution per region
df.groupby(["region","summaryType"]).size().unstack(fill_value=0)

# Review-volume inflation check
df.groupby("region")["userRatingCount"].describe()

# Rating-distribution shift
df.groupby("region")["rating"].agg(["mean","std"])

# Cross-region × type score heatmap
df.groupby(["region","summaryType"])["wilson_score"].mean().unstack()

# JSD between region pairs
from scipy.spatial.distance import jensenshannon
# (see region_jsd_matrix() function in earlier discussion)
```

---

## Files Modified

| File | Changes |
|---|---|
| `server/scripts/adaptive_hexsearch/run.ipynb` | sys.path fix, absolute imports |
| `server/scripts/adaptive_hexsearch/request_places/request_places.py` | Fixed bare `load_key` import |
| `server/scripts/adaptive_hexsearch/h3/__init__.py` | Created (new) |
| `server/scripts/adaptive_hexsearch/__init__.py` | Created (new) |
| `server/scripts/adaptive_hexsearch/request_places/__init__.py` | Created (new) |
| `server/scripts/__init__.py` | Created (new) |
| `server/__init__.py` | Created (new) |
| `server/scripts/wilson_score/wilson_score.ipynb` | Wilson Score, summaryType, type percentile, competition-adjusted score |
| `server/scripts/wilson_score/clean.ipynb` | Data loading + cleaning pipeline |
