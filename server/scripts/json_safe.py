import math

def json_safe(value):
    if value is None:
        return None

    # Handle Python and numpy numeric scalars that may contain NaN/inf.
    if not isinstance(value, bool):
        try:
            numeric_value = float(value)
            if not math.isfinite(numeric_value):
                return None
        except (TypeError, ValueError):
            pass

    return value 