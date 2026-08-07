import React, { memo, useEffect } from 'react';
import L from 'leaflet';

import PullDownContainer from '../../../components/PullDownContainer/PullDownContainer';
import GeoSearch from '../GeoSearchbar/legacy/GeoSearch';
import { useAppUI } from '../../../context/AppUIContext';
import { usePullUpPanelSnapState } from '../PullUpPanel/SnapHooks/PullUpPanelSnapContext';


const PullDownPanel: React.FC<{ mapRef: React.RefObject<L.Map | null> }> = ({ mapRef }) => {

    const {
        activeToolbarTab,
        queueLiveLocationDrop,
        setActiveToolbarTab,
    } = useAppUI();
    const { isMobile, snapState } = usePullUpPanelSnapState();

    // Close PullDownPanel when PullUpPanel opens and the user is on mobile
    useEffect(() => {
        if (!isMobile) return;
        if (snapState !== 'open') return;
        if (activeToolbarTab !== 'search') return;
        setActiveToolbarTab(null);
    }, [activeToolbarTab, isMobile, setActiveToolbarTab, snapState]);
    
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
