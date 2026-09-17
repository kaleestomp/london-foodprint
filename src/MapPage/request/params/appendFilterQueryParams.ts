export type FilterQueryParams = {
  cuisines?: string[];
  cost?: string[];
  venue_type?: string;
  score_basis?: 0 | 1 | 2;
  wilson_basis?: 0 | 1 | 2;
  score_tier?: 0 | 1 | 2 | 3 | 4;
};

const appendSorted = (
  query: URLSearchParams, 
  key: string, 
  values: string[] | undefined
) => {
  for (const value of [...(values ?? [])].sort((left, right) => left.localeCompare(right))) {
    query.append(key, value);
  }
};

export const appendFilterQueryParams = (
  query: URLSearchParams,
  params: FilterQueryParams,
): void => {
  query.set('venue_type', params.venue_type ?? '');
  query.set('score_basis', String(params.score_basis ?? 0));
  query.set('wilson_basis', String(params.wilson_basis ?? 1));
  query.set('score_tier', String(params.score_tier ?? 0));
  appendSorted(query, 'cost', params.cost);
  appendSorted(query, 'cuisine', params.cuisines);
};
