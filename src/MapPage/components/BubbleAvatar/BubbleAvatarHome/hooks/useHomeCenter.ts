import { useMemo } from 'react';

import { useIsMobileCtx } from '../../../../../context/IsMobileContext';
import { usePullUpPanelMetrics } from '../../../PullUpPanel/SnapHooks/PullUpPanelSnapContext';
import type { Point } from '../../config';

const useHomeCenter = (): Point => {

    const isMobile = useIsMobileCtx();
    const { translateY, panelHeight } = usePullUpPanelMetrics();
    const mobilePanel = isMobile ? { translateY, panelHeight } : undefined

    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    // const isMobile = viewportWidth <= 959;

    const homeCenter = useMemo(() => {
        const x = isMobile ? viewportWidth - 70 : viewportWidth / 2;

        if (isMobile && mobilePanel) {
            const bubbleBottomOffset = Math.max(16, mobilePanel.panelHeight - mobilePanel.translateY + 10);
            const y = viewportHeight - bubbleBottomOffset - 40;
            return { x, y };
        }
        const y = viewportHeight - 70;

        return { x, y };

    }, [isMobile, mobilePanel?.panelHeight, mobilePanel?.translateY, viewportHeight, viewportWidth]);

    return homeCenter;
};

export default useHomeCenter;
