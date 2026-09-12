const VIEWPORT_PARAMS = ['sw_lat', 'sw_lng', 'ne_lat', 'ne_lng'];

const getQueryKeyString = (queryKey: readonly unknown[] | undefined): string | null => {
  const value = queryKey?.[1];
  return typeof value === 'string' ? value : null;
};

const isViewportOnlyChange = (
  currentQueryKey: string,
  previousQueryKey: readonly unknown[] | undefined,
): boolean => {
  const previousQueryKeyString = getQueryKeyString(previousQueryKey);
  if (!previousQueryKeyString) return false;

  const currentParams = new URLSearchParams(currentQueryKey);
  const previousParams = new URLSearchParams(previousQueryKeyString);
  if (currentParams.get('scope') !== 'view' || previousParams.get('scope') !== 'view') {
    return false;
  }

  for (const key of new Set([...currentParams.keys(), ...previousParams.keys()])) {
    if (VIEWPORT_PARAMS.includes(key)) continue;

    const currentValues = currentParams.getAll(key).sort();
    const previousValues = previousParams.getAll(key).sort();
    if (currentValues.join('\u0000') !== previousValues.join('\u0000')) return false;
  }

  return VIEWPORT_PARAMS.some(
    (key) => currentParams.get(key) !== previousParams.get(key),
  );
};

export default isViewportOnlyChange;
