import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import createCachedMemoryFetcher from '../../../utils/cache/createCachedMemoryFetcher';
import { type TilesResponse, request } from './request';

const requestCached = createCachedMemoryFetcher(request);

export type RequestStatus = 'empty' | 'loading' | 'success' | 'error';

export interface TilesParams {
  sw_lat: number;
  sw_lng: number;
  ne_lat: number;
  ne_lng: number;
  /** H3 resolution resolved on the frontend (7–10). Sent directly to the API. */
  res: number;
  /**
   * When true, the backend skips the density table and returns up to 100 places
   * directly. Only valid (and only sent) when res === 10.
   */
  places_only?: boolean;
  cuisines?: string[];
  cost?: string[];
  venue_type?: string;
  score_basis?: 0 | 1;
  score_tier?: 0 | 1 | 2 | 3 | 4;
}

const buildQueryKey = (params: TilesParams): string => {
  const qs = new URLSearchParams({
    sw_lat: String(params.sw_lat),
    sw_lng: String(params.sw_lng),
    ne_lat: String(params.ne_lat),
    ne_lng: String(params.ne_lng),
    res: String(params.res),
    ...(params.places_only ? { places_only: 'true' } : {}),
    venue_type: params.venue_type ?? '',
    score_basis: String(params.score_basis ?? 0),
    score_tier: String(params.score_tier ?? 0),
  });

  for (const cost of [...(params.cost ?? [])].sort((left, right) => left.localeCompare(right))) {
    qs.append('cost', cost);
  }

  for (const cuisine of [...(params.cuisines ?? [])].sort((left, right) => left.localeCompare(right))) {
    qs.append('cuisine', cuisine);
  }

  return qs.toString();
};

const useRequestTiles = (params: TilesParams | null): {
  status: RequestStatus;
  error: Error | null;
  res: TilesResponse | null;
  queryKey: string;
  responseKey: string;
} => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [res, setRes] = useState<TilesResponse | null>(null);
  const [responseKey, setResponseKey] = useState('');
  const latestRequestIdRef = useRef(0);

  const queryKey = useMemo(() => (params ? buildQueryKey(params) : ''), [params]);

  const sendRequest = useCallback(async (
    key: string,
    signal: AbortSignal,
    isActiveRef: { current: boolean },
    requestId: number,
  ): Promise<TilesResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!isActiveRef.current) {
        return null;
      }
      return await requestCached(key, { signal });
    } catch (err) {
      if (!isActiveRef.current) {
        return null;
      }
      if (err instanceof Error && err.name === 'AbortError') {
        return null;
      }
      const normalizedError = err instanceof Error ? err : new Error('Unknown error');
      setError(normalizedError);
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

    if (!queryKey) {
      setRes(null);
      setResponseKey('');
      setError(null);
      setIsLoading(false);
      return () => {
        isActiveRef.current = false;
        controller.abort();
      };
    }

    sendRequest(queryKey, controller.signal, isActiveRef, requestId).then((data) => {
      if (isActiveRef.current && latestRequestIdRef.current === requestId && data !== null) {
        setRes(data);
        setResponseKey(queryKey);
      }
    });

    return () => {
      isActiveRef.current = false;
      controller.abort();
    };
  }, [queryKey, sendRequest]);

  const status: RequestStatus = isLoading ? 'loading' : error ? 'error' : res ? 'success' : 'empty';

  return { status, error, res, queryKey, responseKey };
};

export default useRequestTiles;
