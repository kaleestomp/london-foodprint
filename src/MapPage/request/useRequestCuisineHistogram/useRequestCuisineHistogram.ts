import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import createCachedMemoryFetcher from '../../../utils/cache/createCachedMemoryFetcher';
import { type CuisineHistogramParams, type CuisineHistogramResponse, buildQueryKey, request } from './request';

const requestCached = createCachedMemoryFetcher(request);

export type RequestStatus = 'empty' | 'loading' | 'success' | 'error';

const useRequestCuisineHistogram = (params: CuisineHistogramParams | null): {
  status: RequestStatus;
  error: Error | null;
  res: CuisineHistogramResponse | null;
} => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [res, setRes] = useState<CuisineHistogramResponse | null>(null);
  const latestRequestIdRef = useRef(0);

  const queryKey = useMemo(() => (params ? buildQueryKey(params) : ''), [params]);

  const sendRequest = useCallback(async (
    key: string,
    signal: AbortSignal,
    isActiveRef: { current: boolean },
    requestId: number,
  ): Promise<CuisineHistogramResponse | null> => {
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
      return () => { isActiveRef.current = false; controller.abort(); };
    }

    sendRequest(queryKey, controller.signal, isActiveRef, requestId).then((data) => {
      if (isActiveRef.current && latestRequestIdRef.current === requestId && data !== null) {
        setRes(data);
      }
    });

    return () => { isActiveRef.current = false; controller.abort(); };
  }, [queryKey, sendRequest]);

  const status: RequestStatus = !queryKey ? 'empty' : isLoading ? 'loading' : error ? 'error' : res ? 'success' : 'empty';
  return {
    status,
    error: queryKey ? error : null,
    res: queryKey ? res : null,
  };
};

export default useRequestCuisineHistogram;
