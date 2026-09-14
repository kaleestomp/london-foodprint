import { useCallback, useEffect, useRef, useState, type AnimationEvent } from 'react';

const useRefreshState = (
    isListStale: boolean,
    setLiveRefresh: React.Dispatch<React.SetStateAction<boolean>>
) : {
  scrollResetEpoch: number;
  fadeRefreshBtn: boolean;
  isRefreshPending: boolean;
  onListRefresh: () => void;
  onRefreshAnimationEnd: (event: AnimationEvent<HTMLDivElement>) => void;
} => {

  // UPDATE SCROLL CONTAINER WHEN A REFRESHED LIST HAS SETTLED
  const [scrollResetEpoch, setScrollResetEpoch] = useState(0);
  const [fadeRefreshBtn, setFadeRefreshBtn] = useState(false);
  const [isRefreshPending, setIsRefreshPending] = useState(false);
  const pendingBtnFadeRef = useRef(false);
  const wasListStaleRef = useRef(false);
  useEffect(() => {
    // If list was stale but not anymore, 
    // trigger fade refresh button animation
    if (wasListStaleRef.current && !isListStale) { 
      if (pendingBtnFadeRef.current) // only fade if a refresh was pending
        setFadeRefreshBtn(true); // trigger fade animation
      pendingBtnFadeRef.current = false; // reset pending fade flag
      setIsRefreshPending(false); // mark refresh as no longer pending
      setScrollResetEpoch((e) => e + 1); // trigger scroll container reset
    }
    wasListStaleRef.current = isListStale; 
  }, [isListStale]);

  const onListRefresh = useCallback(() => {
    if (!isListStale) return; // only proceed if the list is stale
    pendingBtnFadeRef.current = true; // mark that a refresh is pendingand the button should fade when done
    setIsRefreshPending(true); // mark refresh as pending
    setLiveRefresh(true); // trigger live refresh
  }, [isListStale, setLiveRefresh]);

  const onRefreshAnimationEnd = useCallback((event: AnimationEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return; // only handle animation end for the current target
    setFadeRefreshBtn(false); // reset fade state after animation ends
  }, []);
  
  return {
    scrollResetEpoch,
    fadeRefreshBtn,
    isRefreshPending,
    onListRefresh,
    onRefreshAnimationEnd,
  };
};
export default useRefreshState;
