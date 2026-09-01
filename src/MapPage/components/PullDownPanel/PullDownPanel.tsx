import React, { memo, useEffect } from 'react';
import type maplibregl from 'maplibre-gl';

import PullDownContainer from '../../../components/PullDownContainer/PullDownContainer';
import GeoSearch from '../GeoSearchbar/legacy/GeoSearch';
import { useIsMobileCtx } from '../../../context/IsMobileContext';
import { useAppUI } from '../../../context/AppUIContext';
// import { usePullUpPanelSnapState } from '../PullUpPanel/SnapHooks/PullUpPanelSnapContext';
import { useDrawerState } from '../SlideUpDrawer/DrawerStateContext';

const PullDownPanel: React.FC<{ mapRef: React.RefObject<maplibregl.Map | null> }> = ({ mapRef }) => {

    const {
        activeToolbarTab,
        queueLiveLocationDrop,
        setActiveToolbarTab,
    } = useAppUI();
    // const { isMobile, snapState } = usePullUpPanelSnapState();
    const isMobile = useIsMobileCtx();
    const { isClosed } = useDrawerState();

    // Close PullDownPanel when PullUpPanel opens and the user is on mobile
    useEffect(() => {
        if (!isMobile) return;
        if (isClosed) return;
        if (activeToolbarTab !== 'search') return;
        setActiveToolbarTab(null);
    }, [activeToolbarTab, isMobile, setActiveToolbarTab, isClosed]);
    
    const topPanelContent =
        activeToolbarTab === 'search'
            ? <GeoSearch mapRef={mapRef} onProgrammaticDrop={queueLiveLocationDrop} />
            : null;

    return (
        <PullDownContainer
            isOpen={activeToolbarTab === 'search'}
            onClose={() => setActiveToolbarTab(null)}
        >
            {topPanelContent}
        </PullDownContainer>
    );
}

export default memo(PullDownPanel);
