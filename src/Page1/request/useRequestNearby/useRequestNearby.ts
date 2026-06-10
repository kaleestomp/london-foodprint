import { useCallback, useEffect, useMemo, useState } from 'react';
import createCachedMemoryFetcher from '../../../utils/cache/createCachedMemoryFetcher';
import { type NearbyResponse, request } from './request';

const requestCached = createCachedMemoryFetcher(request);

type RequestStatus = 'empty' | 'loading' | 'success' | 'error';

export interface NearbyParams {
  lat: number;
  lng: number;
  radius_m?: number;
  cuisine?: string;
  cost?: string;
  venue_type?: string;
  score_basis?: 0 | 1;
  confidence?: 0 | 1 | 2;
  rank_threshold?: number;
  page?: number;
}

const buildQueryKey = (params: NearbyParams): string => {
  const qs = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    radius_m: String(params.radius_m ?? 1000),
    cuisine: params.cuisine ?? '',
    cost: params.cost ?? '',
    venue_type: params.venue_type ?? '',
    score_basis: String(params.score_basis ?? 0),
    confidence: String(params.confidence ?? 1),
    rank_threshold: String(params.rank_threshold ?? 0),
    page: String(params.page ?? 1),
  });

  return qs.toString();
};

const useRequestNearby = (params: NearbyParams | null): {
  status: RequestStatus;
  error: Error | null;
  res: NearbyResponse | null;
} => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [res, setRes] = useState<NearbyResponse | null>(null);

  const queryKey = useMemo(() => (params ? buildQueryKey(params) : ''), [params]);

  const sendRequest = useCallback(async (
    key: string,
    signal: AbortSignal,
    isActiveRef: { current: boolean }
  ): Promise<NearbyResponse | null> => {
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
      if (isActiveRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const isActiveRef = { current: true };
    const controller = new AbortController();

    if (!queryKey) {
      setRes(null);
      setError(null);
      setIsLoading(false);
      return () => {
        isActiveRef.current = false;
        controller.abort();
      };
    }

    sendRequest(queryKey, controller.signal, isActiveRef).then((data) => {
      if (isActiveRef.current && data !== null) {
        setRes(data);
      }
    });

    return () => {
      isActiveRef.current = false;
      controller.abort();
    };
  }, [queryKey, sendRequest]);

  const status: RequestStatus = isLoading ? 'loading' : error ? 'error' : res ? 'success' : 'empty';

  return { status, error, res };
};

export default useRequestNearby;
