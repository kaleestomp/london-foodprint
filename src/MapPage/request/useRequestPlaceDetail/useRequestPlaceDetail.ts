import { useCallback, useEffect, useState } from 'react';
import createCachedMemoryFetcher from '../../../utils/cache/createCachedMemoryFetcher';
import { type PlaceDetailResponse, request } from './request';

const requestCached = createCachedMemoryFetcher(request);

type RequestStatus = 'empty' | 'loading' | 'success' | 'error';

const useRequestPlaceDetail = (placeId: string | null): {
  status: RequestStatus;
  error: Error | null;
  res: PlaceDetailResponse | null;
} => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [res, setRes] = useState<PlaceDetailResponse | null>(null);

  const sendRequest = useCallback(async (
    id: string,
    signal: AbortSignal,
    isActiveRef: { current: boolean }
  ): Promise<PlaceDetailResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!isActiveRef.current) {
        return null;
      }
      return await requestCached(id, { signal });
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

    if (!placeId || !placeId.trim()) {
      setRes(null);
      setError(null);
      setIsLoading(false);
      return () => {
        isActiveRef.current = false;
        controller.abort();
      };
    }

    sendRequest(placeId, controller.signal, isActiveRef).then((data) => {
      if (isActiveRef.current && data !== null) {
        setRes(data);
      }
    });

    return () => {
      isActiveRef.current = false;
      controller.abort();
    };
  }, [placeId, sendRequest]);

  const status: RequestStatus = isLoading ? 'loading' : error ? 'error' : res ? 'success' : 'empty';

  return { status, error, res };
};

export default useRequestPlaceDetail;
