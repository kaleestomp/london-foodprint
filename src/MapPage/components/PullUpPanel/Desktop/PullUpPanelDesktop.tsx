import type { FC } from 'react';

import { usePullUpPanelSnapState } from '../SnapHooks/PullUpPanelSnapContext';
import RestaurantList from '../RestaurantList/RestaurantList';
import HeaderDesktop from './Header/HeaderDesktop';

import './PullUpPanelDesktop.css';

type Props = {};
const PullUpPanelDesktop: FC<Props> = () => {
    const {
        handleContentPointerDown,
        handleContentPointerMove,
        handleContentPointerUp,
        handleContentPointerCancel,
        isPanelOpen,
    } = usePullUpPanelSnapState();

    return (
        <>
            <aside
                className="restaurant-panel-desktop"
                aria-label="Area pull-up panel"
            >
                <HeaderDesktop />
                <div className="restaurant-panel-content">
                    <RestaurantList
                        isPanelOpen={isPanelOpen}
                        allowScroll={isPanelOpen}
                        onContentPointerDown={handleContentPointerDown}
                        onContentPointerMove={handleContentPointerMove}
                        onContentPointerUp={handleContentPointerUp}
                        onContentPointerCancel={handleContentPointerCancel}
                    />
                </div>
            </aside>
        </>
    );
};

export default PullUpPanelDesktop;
