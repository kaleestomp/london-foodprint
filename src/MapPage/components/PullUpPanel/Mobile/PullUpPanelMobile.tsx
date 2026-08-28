import type { FC, RefObject } from 'react';
import type maplibregl from 'maplibre-gl';

// import { useAppUI } from '../../../../context/AppUIContext';
import { usePullUpPanelSnapState } from '../SnapHooks/PullUpPanelSnapContext';
import RestaurantList from '../RestaurantList/RestaurantList';
import HeaderMobile from './Header/HeaderMobile';
import OverviewSection from '../OverviewSection/OverviewSection';

import './PullUpPanelMobile.css';

type Props = {
    mapRef: RefObject<maplibregl.Map | null>;
};
const PullUpPanelMobile: FC<Props> = ({ mapRef }) => {
    
    void mapRef;
    const { handlePanelPointerDown, handleHandlePointerDown,
        isDragging, panelHeight, translateY } = usePullUpPanelSnapState();

    return (
        <>
            <section
                className="restaurant-sheet-mobile panel-has-blob"
                style={{
                    height: panelHeight,
                    transform: `translateY(${translateY}px)`,
                    transition: isDragging ? 'none' : 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
                aria-label="Area pull-up panel"
                onPointerDownCapture={handlePanelPointerDown}
            >
                <HeaderMobile
                    onHandlePointerDown={handleHandlePointerDown}
                />
                <div className="restaurant-panel-content">
                    <OverviewSection />
                    <RestaurantList />
                </div>
            </section>
        </>
    );
};

export default PullUpPanelMobile;
