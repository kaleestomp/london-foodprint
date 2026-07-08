import { useEffect, useRef } from 'react';

import { useAppUI } from '../../../../../context/AppUIContext';
import type { SnapState } from '../config';

const useClearActiveToolbarTabOnClose = (snapState: SnapState) => {
  const { setActiveToolbarTab } = useAppUI();
  const previousSnapStateRef = useRef<SnapState>('closed');

  useEffect(() => {
    const previousSnapState = previousSnapStateRef.current;
    previousSnapStateRef.current = snapState;

    if (previousSnapState !== 'closed' && snapState === 'closed') {
      setActiveToolbarTab(null);
    }
  }, [setActiveToolbarTab, snapState]);
};

export default useClearActiveToolbarTabOnClose;