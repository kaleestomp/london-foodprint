import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import buildQueryKey from './buildQueryKey';
import { type TopPlacesResponse, request } from './request';

type RequestStatus = 'empty' | 'loading' | 'success' | 'error';

export interface TopPlacesParams {
  sw_lat: number;
  sw_lng: number;
  ne_lat: number;
  ne_lng: number;
  res: number;
  cuisines?: string[];
  cost?: string[];
  venue_type?: string;
  score_basis?: 0 | 1 | 2;
  score_tier?: 0 | 1 | 2 | 3 | 4;
  limit?: number;
}

const useRequestTopPlaces = (
  params: TopPlacesParams | null,
  options: { debounceMs?: number } = {}
): {
  status: RequestStatus;
  error: Error | null;
  res: TopPlacesResponse | null;
  queryKey: string;
  responseKey: string;
} => {
  const debounceMs = Math.max(0, options.debounceMs ?? 150);

  const [res, setRes] = useState<TopPlacesResponse | null>(null);
  const [responseKey, setResponseKey] = useState('');
  const [debouncedQueryKey, setDebouncedQueryKey] = useState('');

  const queryKey = useMemo(() => (params ? buildQueryKey(params) : ''), [params]);

  useEffect(() => {
    if (!queryKey) {
      setDebouncedQueryKey('');
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedQueryKey(queryKey);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [queryKey, debounceMs]);

  const query = useQuery({
    queryKey: ['top-places', debouncedQueryKey],
    queryFn: ({ signal }) => request(debouncedQueryKey, { signal }),
    enabled: Boolean(debouncedQueryKey),
  });

  useEffect(() => {
    if (!debouncedQueryKey || !query.data) {
      setRes(null);
      setResponseKey('');
      return;
    }
    setRes(query.data);
    setResponseKey(debouncedQueryKey);
  }, [debouncedQueryKey, query.data]);

  const status: RequestStatus = !debouncedQueryKey
    ? 'empty'
    : query.isPending || (query.isFetching && !query.data)
      ? 'loading'
      : query.isError
        ? 'error'
        : res
          ? 'success'
          : 'empty';

  return { status, error: query.error as Error | null, res, queryKey, responseKey };
};

export default useRequestTopPlaces;
