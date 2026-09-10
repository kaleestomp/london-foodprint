import type { FC } from 'react';

import { usePlaceSelection } from '../../../../context/PlaceSelectionContext';
import { useSearchFilters } from '../../../../context/SearchFiltersContext';
import useRequestPlaceDetail from '../../../request/useRequestPlaceDetail/useRequestPlaceDetail';
import ListItem from '../ListItem/ListItem';
import toPlacesListItem from './parseToPlaceListItem';

import '../RestaurantList.css';



// Fallback card for a selected cluster singleton marker with no matching row in the loaded list.
const PlaceholderListItem: FC<{ placeId: string }> = ({ placeId }) => {

    const { searchMask } = useSearchFilters();
    const { reportSelectedPlaceId } = usePlaceSelection();

    const { status, res } = useRequestPlaceDetail(placeId);
    if (status === 'error') return null;
    const showSkeleton = status !== 'success' || !res;

    const item = showSkeleton ? null : toPlacesListItem(res, searchMask?.center);
    return (
        <ListItem
            item={item}
            isSelected
            onSelect={() => { }}
            onClose={() => reportSelectedPlaceId(null, null)}
            closeButton={true}
        />
    );
};

export default PlaceholderListItem;
