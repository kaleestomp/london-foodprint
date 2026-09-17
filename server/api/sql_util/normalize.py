def normalize_dimension(value: str | None) -> str:
    if value is None:
        return "__all__"
    normalized = value.strip()
    if normalized.lower() == "any":
        return "__all__"
    if normalized == "":
        return "__all__"
    # Map user-facing "Unspecified" label to internal NULL marker for SQL filtering
    if normalized.lower() == "unspecified" or normalized == "__null__":
        return "__null__"
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

def get_score_basis_column(score_basis: int, model_version: int = 1) -> str:
    m = model_version if model_version in (0, 1, 2) else 1
    if score_basis == 0:
        return f"tier_{m}"
    if score_basis == 1:
        return f"tier_d{m}"
    return f"tier_i{m}"


def get_wilson_basis_column(wilson_basis: int) -> str:
    """Return the allow-listed Wilson score column for the selected basis."""
    basis = wilson_basis if wilson_basis in (0, 1, 2) else 1
    return f"wilson_{basis}"
