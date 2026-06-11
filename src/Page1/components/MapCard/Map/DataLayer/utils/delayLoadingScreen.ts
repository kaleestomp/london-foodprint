import { useEffect, useRef } from 'react';
import { useAppUI } from '../../../../../../context/AppUIContext';
import { type RequestStatus } from '../../../../../request/useRequestTiles/useRequestTiles';

const LOADING_DELAY_MS = 2000;

const DelayLoadingScreen = (status: RequestStatus): void => {

  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toggleLoading } = useAppUI();

  // Only show loading spinner if request takes longer than LOADING_DELAY_MS.
  useEffect(() => {
    if (status === 'loading') {
      loadingTimerRef.current = setTimeout(() => {
        toggleLoading(true);
      }, LOADING_DELAY_MS);
    } else {
      if (loadingTimerRef.current !== null) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      toggleLoading(false);
    }
    return () => {
      if (loadingTimerRef.current !== null) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
  }, [status, toggleLoading]);

};

export default DelayLoadingScreen;
