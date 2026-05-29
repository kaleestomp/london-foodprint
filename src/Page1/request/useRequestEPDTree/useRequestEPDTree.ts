import { useEffect, useState, useCallback } from 'react';
import { type apiResourceContract, request} from './request'; 
import createCachedMemoryFetcher from '../../../utils/cache/createCachedMemoryFetcher';

const requestCached = createCachedMemoryFetcher(request); 
type RequestStatus = 'empty' | 'loading' | 'success' | 'error'; 

const useRequestEPDTree = (path: string = "default") : { 
  status: RequestStatus; 
  error: Error | null; 
  res: apiResourceContract[] | null 
} => { 
  // Local State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null); 
  const [res, setRes] = useState<apiResourceContract[] | null>(null);

  // Handle Request, Error, Loading
  const sendRequest = useCallback(async (
    param: string, 
    signal: AbortSignal, 
    isActiveRef: { current: boolean }
  ): Promise<apiResourceContract[] | null> => {
    setIsLoading(true); // Start loading
    setError(null); // Clear previous errors
    try { 
      if (!isActiveRef.current) { return null; }
      const res: apiResourceContract[] = await requestCached(param, { signal }); 
      return res;
    } catch (err) { 
      if (!isActiveRef.current) { return null; }
      if (err instanceof Error && err.name === 'AbortError') { return null; }
      const normalizedError = err instanceof Error ? err : new Error('Unknown');
      setError(normalizedError); 
      if (import.meta.env.DEV) {
        console.error(`Error fetching data for ${param}:`, normalizedError);
      }
      return null; 
    } finally {
      if (isActiveRef.current) { setIsLoading(false); }
    };
  }, []); 

  useEffect(() => {
    const isActiveRef = { current: true };
    //^GUARD to prevent state updates if component unmounts
    const controller = new AbortController();
    //^ABORT SIGNAL to cancel fetch if component unmounts 
    if (!path.trim()) {
      setRes(null);
      setError(null);
      setIsLoading(false);
      return () => {
        isActiveRef.current = false;
        controller.abort();
      };
    }
    //^CLEAR previous data when path changes 
    setRes(null); 
    //^REQUEST new data
    sendRequest(path, controller.signal, isActiveRef).then((res) => { 
      if (isActiveRef.current && res !== null) { 
        setRes(res); 
      }
    }); 
    // ^CLEANUP on unmount / before re-rurn
    return () => {
      isActiveRef.current = false; 
      controller.abort(); 
    };

  }, [path, sendRequest]);

  // STATUS
  const status: RequestStatus = isLoading ? 'loading' : error ? 'error' : res !== null ? 'success' : 'empty'; 

  return { status, error, res };
}; 

export default useRequestEPDTree;