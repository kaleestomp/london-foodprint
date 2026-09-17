import { useLayoutEffect } from 'react';

import { usePlaceSelection } from '../../../../context/PlaceSelectionContext';
import { useVirtualizer } from '@tanstack/react-virtual';

import { getListItemKey } from './useSelectedItemKey/useSelectedItemKey';
import { type PlacesListItem } from '../../../request/useRequestPlacesList/request';


const useAutoScroll = (
    items: PlacesListItem[],
    selectedItemKey: string | null,
    rowVirtualizer: ReturnType<typeof useVirtualizer>,
) => {
    // SELECTION STATE
    const { selectionSource } = usePlaceSelection();
    
    // KEEP THE SELECTED ROW IN VIEW WHEN THE SELECTION COMES FROM THE MAP.
    useLayoutEffect(() => {
        if (!selectedItemKey) return;
        if (selectionSource !== 'map') return;

        const index = items.findIndex((row) => getListItemKey(row.id) === selectedItemKey);
        if (index < 0) return;

        rowVirtualizer.scrollToIndex(index, {
            align: 'center', //start
            behavior: 'smooth',
        });
    }, [items, rowVirtualizer, selectedItemKey, selectionSource]);
};

export default useAutoScroll;