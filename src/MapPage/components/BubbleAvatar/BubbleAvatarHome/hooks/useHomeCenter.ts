import { useMemo } from 'react';

import { useIsMobileCtx } from '../../../../../context/IsMobileContext';
// import { usePullUpPanelMetrics } from '../../../PullUpPanel/SnapHooks/PullUpPanelSnapContext';
import { useDrawerState } from '../../../SlideUpDrawer/DrawerStateContext';
import type { Point } from '../../config';

const useHomeCenter = (): Point => {

    const isMobile = useIsMobileCtx();
    // const { translateY, panelHeight } = usePullUpPanelMetrics();
    // const mobilePanel = isMobile ? { translateY, panelHeight } : undefined
    const { snap: drawerHeight } = useDrawerState();
    
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    // const isMobile = viewportWidth <= 959;

    const homeCenter = useMemo(() => {
        const x = isMobile ? viewportWidth - 70 : viewportWidth / 2;
        // if (isMobile && mobilePanel) {
        //     const bubbleBottomOffset = Math.max(16, mobilePanel.panelHeight - mobilePanel.translateY + 10);
        //     const y = viewportHeight - bubbleBottomOffset - 40;
        //     return { x, y };
        // }
        if (isMobile ) {
            // const bubbleBottomOffset = Math.max(16, drawerHeight + 10);
            const y = viewportHeight - ((drawerHeight ?? 0) + 40);
            // y measured from the top of the container (viewport)
            // due to pickup positioned being measured relative to container rect xy
            return { x, y };
        }
        const y = viewportHeight - 70;

        return { x, y };

    // }, [isMobile, mobilePanel?.panelHeight, mobilePanel?.translateY, viewportHeight, viewportWidth]);
    }, [isMobile, drawerHeight, viewportHeight, viewportWidth]);

    return homeCenter;
};

export default useHomeCenter;
