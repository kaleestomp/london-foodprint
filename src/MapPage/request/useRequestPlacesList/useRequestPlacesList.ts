import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import createCachedMemoryFetcher from '../../../utils/cache/createCachedMemoryFetcher';
import { type PlacesListResponse, request } from './request';

const requestCached = createCachedMemoryFetcher(request);
type RequestStatus = 'empty' | 'loading' | 'success' | 'error';

export interface PlacesListParams {
  sw_lat: number;
  sw_lng: number;
  ne_lat: number;
  ne_lng: number;
  center_lat?: number;
  center_lng?: number;
  radius_m?: number;
  cuisines?: string[];
  cost?: string[];
  venue_type?: string;
  score_basis?: 0 | 1 | 2;
  score_tier?: 0 | 1 | 2 | 3 | 4;
  page?: number;
  enabled?: boolean;
}

const buildQueryKey = (params: PlacesListParams): string => {
  const qs = new URLSearchParams({
    sw_lat: String(params.sw_lat),
    sw_lng: String(params.sw_lng),
    ne_lat: String(params.ne_lat),
    ne_lng: String(params.ne_lng),
    venue_type: params.venue_type ?? '',
    score_basis: String(params.score_basis ?? 0),
    score_tier: String(params.score_tier ?? 0),
    page: String(params.page ?? 1),
  });

  if (
    typeof params.center_lat === 'number'
    && typeof params.center_lng === 'number'
    && typeof params.radius_m === 'number'
  ) {
    qs.set('center_lat', String(params.center_lat));
    qs.set('center_lng', String(params.center_lng));
    qs.set('radius_m', String(params.radius_m));
  }

  for (const cost of [...(params.cost ?? [])].sort((a, b) => a.localeCompare(b))) {
    qs.append('cost', cost);
  }
  for (const cuisine of [...(params.cuisines ?? [])].sort((a, b) => a.localeCompare(b))) {
    qs.append('cuisine', cuisine);
  }

  return qs.toString();
};

const useRequestPlacesList = (params: PlacesListParams | null): {
  status: RequestStatus;
  error: Error | null;
  res: PlacesListResponse | null;
} => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [res, setRes] = useState<PlacesListResponse | null>(null);
  const latestRequestIdRef = useRef(0);

  const queryKey = useMemo(() => {
    if (!params || params.enabled === false) return '';
    return buildQueryKey(params);
  }, [params]);

  const sendRequest = useCallback(async (
    key: string,
    signal: AbortSignal,
    isActiveRef: { current: boolean },
    requestId: number,
  ): Promise<PlacesListResponse | null> => {
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

    if (!queryKey) {
      setRes(null);
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

export default useRequestPlacesList;
