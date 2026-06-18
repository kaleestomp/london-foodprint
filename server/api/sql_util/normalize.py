def normalize_dimension(value: str | None) -> str:
    if value is None:
        return ""
    normalized = value.strip()
    if normalized.lower() == "any":
        return ""
    return normalized


def normalize_dimension_list(values: list[str] | None) -> list[str]:
    if not values:
        return []

    normalized_values: list[str] = []
    seen: set[str] = set()

    for value in values:
        normalized = normalize_dimension(value)
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        normalized_values.append(normalized)

    return normalized_values

def get_score_basis_column(score_basis: int) -> str:
    if score_basis == 0:
        return "tier"
    if score_basis == 1:
        return "tier_d"
    return "tier_independent"

