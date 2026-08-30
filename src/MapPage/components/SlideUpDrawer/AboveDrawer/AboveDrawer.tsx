import type { FC } from 'react';
import FilterButtons from '../../BaseToolbar/FilterButtons';

import { BubbleAvatarStateProvider } from '../../BubbleAvatar/BubbleAvatarStateContext';
import BubbleAvatar from '../../BubbleAvatar/BubbleAvatar';

import './AboveDrawer.css';

const AboveDrawer: FC<{
  mapRef: React.RefObject<maplibregl.Map | null>;
}> = ({ mapRef }) => {
    return (
        <div className="above-drawer">
            <FilterButtons />
            <BubbleAvatarStateProvider>
                <BubbleAvatar mapRef={mapRef} />
            </BubbleAvatarStateProvider>
        </div>
    );
};

export default AboveDrawer;
