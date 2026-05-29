import { useEffect, useState, useCallback } from 'react';
import { type dataContract, request} from './request'; 

import createCachedMemoryFetcher from '../../../utils/cache/createCachedMemoryFetcher';

const requestCached = createCachedMemoryFetcher(request); 
type RequestStatus = 'empty' | 'loading' | 'success' | 'error'; 

const useRequest = (path: string) : { 
  status: RequestStatus; 
  error: Error | null; 
  res: dataContract[] | null 
} => { 
  // Local State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null); 
  const [res, setRes] = useState<dataContract[] | null>(null);

  const sendRequest = useCallback(async (
    param: string, 
    signal: AbortSignal, 
    isActiveRef: { current: boolean }
  ): Promise<dataContract[] | null> => {
    setIsLoading(true); // Start loading
    setError(null); // Clear previous errors
    try { 
      if (!isActiveRef.current) { return null; }
      const res: dataContract[] = await requestCached(param, { signal }); 
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
      // if (!controller.signal.aborted) { setIsLoading(false); }
      // Above are related, but not the same. 
      // What you actually care about before calling React state setters 
      // is not “was the request aborted?”, 
      // it is “is this effect still allowed to update state?”
    };
  }, []); 

  useEffect(() => {
    const isActiveRef = { current: true };
    //^GUARD to prevent state updates if component unmounts
    //ie. if user navigates away before fetch completes
    //ie. if param changes before fetch completes (data fetched for outdated param) 
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
    }; 

    //^CLEAR previous data when path changes 
    setRes(null); 

    //^REQUEST new data
    sendRequest(path, controller.signal, isActiveRef)
      .then((res) => {
        if (isActiveRef.current && res) {
          setRes(res);
        }
      }); 
    
    // ^CLEANUP on unmount / before re-rurn
    return () => {
      isActiveRef.current = false; //cleanup prevents state updates
      controller.abort(); //cleanup aborts the in-flight request
    };

  }, [path, sendRequest]);

  // ----
  const status: RequestStatus = isLoading ? 'loading' : error ? 'error' : res ? 'success' : 'empty';
  return {
    status,
    error, 
    res, 
  };
}

export default useRequest;