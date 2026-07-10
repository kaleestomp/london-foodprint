import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import createCachedMemoryFetcher from '../../../utils/cache/createCachedMemoryFetcher';
import buildQueryKey from './buildQueryKey';
import { type TopPlacesResponse, request } from './request';

const requestCached = createCachedMemoryFetcher(request);

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

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [res, setRes] = useState<TopPlacesResponse | null>(null);
  const [responseKey, setResponseKey] = useState('');
  const [debouncedQueryKey, setDebouncedQueryKey] = useState('');
  const latestRequestIdRef = useRef(0);

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

  const sendRequest = useCallback(async (
    key: string,
    signal: AbortSignal,
    isActiveRef: { current: boolean },
    requestId: number,
  ): Promise<TopPlacesResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!isActiveRef.current) return null;
      return await requestCached(key, { signal });
    } catch (err) {
      if (!isActiveRef.current) return null;
      if (err instanceof Error && err.name === 'AbortError') return null;
      setError(err instanceof Error ? err : new Error('Unknown error'));
      return null;
    } finally {
      if (isActiveRef.current && latestRequestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const isActiveRef = { current: true };
    const controller = new AbortController();
    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;

    if (!debouncedQueryKey) {
      setRes(null);
      setResponseKey('');
      setError(null);
      setIsLoading(false);
      return () => {
        isActiveRef.current = false;
        controller.abort();
      };
    }

    sendRequest(debouncedQueryKey, controller.signal, isActiveRef, requestId).then((data) => {
      if (isActiveRef.current && latestRequestIdRef.current === requestId && data !== null) {
        setRes(data);
        setResponseKey(debouncedQueryKey);
      }
    });

    return () => {
      isActiveRef.current = false;
      controller.abort();
    };
  }, [debouncedQueryKey, sendRequest]);

  const status: RequestStatus = isLoading ? 'loading' : error ? 'error' : res ? 'success' : 'empty';

  return { status, error, res, queryKey, responseKey };
};

export default useRequestTopPlaces;
