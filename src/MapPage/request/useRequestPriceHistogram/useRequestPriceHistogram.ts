import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import createCachedMemoryFetcher from '../../../utils/cache/createCachedMemoryFetcher';
import { type PriceHistogramParams, type PriceHistogramResponse, buildQueryKey, request } from './request';

const requestCached = createCachedMemoryFetcher(request);

export type RequestStatus = 'empty' | 'loading' | 'success' | 'error';

const useRequestPriceHistogram = (params: PriceHistogramParams | null): {
  status: RequestStatus;
  error: Error | null;
  res: PriceHistogramResponse | null;
} => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [res, setRes] = useState<PriceHistogramResponse | null>(null);
  const latestRequestIdRef = useRef(0);

  const queryKey = useMemo(() => (params ? buildQueryKey(params) : ''), [params]);

  const sendRequest = useCallback(async (
    key: string,
    signal: AbortSignal,
    isActiveRef: { current: boolean },
    requestId: number,
  ): Promise<PriceHistogramResponse | null> => {
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
      return () => { isActiveRef.current = false; controller.abort(); };
    }

    sendRequest(queryKey, controller.signal, isActiveRef, requestId).then((data) => {
      if (isActiveRef.current && latestRequestIdRef.current === requestId && data !== null) {
        setRes(data);
      }
    });

    return () => { isActiveRef.current = false; controller.abort(); };
  }, [queryKey, sendRequest]);

  const status: RequestStatus = isLoading ? 'loading' : error ? 'error' : res ? 'success' : 'empty';
  return { status, error, res };
};

export default useRequestPriceHistogram;
