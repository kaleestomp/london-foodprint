import type { FC } from 'react';
import { useIsMobileCtx } from '../../../context/IsMobileContext';
import { usePlaceSelection } from '../../../context/PlaceSelectionContext';
import { useDrawerState } from '../SlideUpDrawer/DrawerStateContext';

import PlaceHeader from './PlaceHeader/PlaceHeader';
import PlaceBody from './PlaceBody/PlaceBody';
import CloseButton from './CloseButton/CloseButton';
import './PlaceDetail.css';

// Fallback card for a selected cluster singleton marker with no matching row in the loaded list.
const PlaceDetail: FC<{
    placeId: string | null;
    nested?: boolean;
    showHeader?: boolean;

}> = ({ placeId, nested = false, showHeader = true }) => {

    const isMobile = useIsMobileCtx();
    const { clearSelection } = usePlaceSelection();
    const { isClosed } = useDrawerState();

    return (placeId ? <>
        {showHeader && <PlaceHeader placeId={placeId} compact={false} />}
        <PlaceBody placeId={placeId} />
        {isMobile && !nested && !isClosed && (
            <CloseButton onClick={clearSelection} />
        )}
    </> : null);
};

export default PlaceDetail;
