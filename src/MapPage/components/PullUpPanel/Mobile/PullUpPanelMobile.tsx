import type { FC, RefObject } from 'react';
import type L from 'leaflet';

// import { useAppUI } from '../../../../context/AppUIContext';
import { usePullUpPanelSnapState } from '../SnapHooks/PullUpPanelSnapContext';
import RestaurantList from '../RestaurantList/RestaurantList';
import HeaderMobile from './Header/HeaderMobile';
import OverviewSection from '../OverviewSection/OverviewSection';

import './PullUpPanelMobile.css';
// import '../Styling/PullUpPanelBlob.css';

type Props = {
    mapRef: RefObject<L.Map | null>;
};
const PullUpPanelMobile: FC<Props> = ({ mapRef }) => {
    const {
        handlePanelPointerDown,
        handleHandlePointerDown,
        handleContentPointerDown,
        handleContentPointerMove,
        handleContentPointerUp,
        handleContentPointerCancel,
        isDragging,
        isPanelOpen,
        panelHeight,
        translateY,
    } = usePullUpPanelSnapState();

    // const { activeToolbarTab } = useAppUI();
    // const hideRestaurantList = activeToolbarTab !== null;

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
                    isPanelOpen={isPanelOpen}
                    onHandlePointerDown={handleHandlePointerDown}
                />
                <div className="restaurant-panel-content">
                    <OverviewSection mapRef={mapRef} />
                    <RestaurantList
                        isPanelOpen={isPanelOpen}
                        allowScroll={isPanelOpen}
                        onContentPointerDown={handleContentPointerDown}
                        onContentPointerMove={handleContentPointerMove}
                        onContentPointerUp={handleContentPointerUp}
                        onContentPointerCancel={handleContentPointerCancel}
                    />
                </div>
            </section>
        </>
    );
};

export default PullUpPanelMobile;
