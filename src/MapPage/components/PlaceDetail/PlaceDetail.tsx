import type { FC } from 'react';
import { usePlaceSelection } from '../../../context/PlaceSelectionContext';
import { useDrawerState } from '../SlideUpDrawer/DrawerStateContext';

import PlaceHeader from './PlaceHeader/PlaceHeader';
import PlaceBody from './PlaceBody/PlaceBody';
import ShowMoreButton from './ShowMoreButton/ShowMoreButton';
import './PlaceDetail.css';

// Fallback card for a selected cluster singleton marker with no matching row in the loaded list.
const PlaceDetail: FC<{
    placeId: string | null;
    nested?: boolean;
    showHeader?: boolean;
}> = ({ placeId, nested = false, showHeader = true }) => {

    const { clearSelection } = usePlaceSelection();
    const { isClosed } = useDrawerState();

    return (placeId ? <>
        {showHeader && <PlaceHeader placeId={placeId} compact={false} />}
        <PlaceBody placeId={placeId} />
        {!nested && !isClosed && (
            <ShowMoreButton onClick={clearSelection} />
        )}
    </> : null);
};

export default PlaceDetail;
