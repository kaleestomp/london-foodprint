import { useCallback, useEffect, useRef, useState, type AnimationEvent } from 'react';

const useRefreshState = (
    isListStale: boolean,
    setShouldAutoRefresh: React.Dispatch<React.SetStateAction<boolean>>
) : {
  scrollResetEpoch: number;
  shouldFade: boolean;
  isRefreshPending: boolean;
  onListRefresh: () => void;
  onRefreshAnimationEnd: (event: AnimationEvent<HTMLDivElement>) => void;
} => {

  // UPDATE SCROLL CONTAINER WHEN A REFRESHED LIST HAS SETTLED
  const [scrollResetEpoch, setScrollResetEpoch] = useState(0);
  const [shouldFade, setShouldFade] = useState(false);
  const [isRefreshPending, setIsRefreshPending] = useState(false);
  const pendingFadeRef = useRef(false);
  const wasListStaleRef = useRef(false);
  useEffect(() => {
    if (wasListStaleRef.current && !isListStale) { 
      if (pendingFadeRef.current)
        setShouldFade(true);
      pendingFadeRef.current = false;
      setIsRefreshPending(false);
      setScrollResetEpoch((e) => e + 1);
    }
    wasListStaleRef.current = isListStale;
  }, [isListStale]);

  const onListRefresh = useCallback(() => {
    if (!isListStale) return;
    pendingFadeRef.current = true;
    setIsRefreshPending(true);
    setShouldAutoRefresh(true);
  }, [isListStale, setShouldAutoRefresh]);

  const onRefreshAnimationEnd = useCallback((event: AnimationEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    setShouldFade(false);
  }, []);
  
  return {
    scrollResetEpoch,
    shouldFade,
    isRefreshPending,
    onListRefresh,
    onRefreshAnimationEnd,
  };
};
export default useRefreshState;
