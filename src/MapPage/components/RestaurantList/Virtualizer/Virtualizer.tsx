import { useLayoutEffect, type FC } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type maplibregl from 'maplibre-gl';

import ListItem from '../ListItem/ListItem';
import useSelectedItemKey, { getListItemKey } from './useSelectedItemKey/useSelectedItemKey';
import { type PlacesListItem } from '../../../request/useRequestPlacesList/request';

import '../RestaurantList.css';

const Virtualizer: FC<{
    mapRef: React.RefObject<maplibregl.Map | null>;
    items: PlacesListItem[];
    scrollRef: React.RefObject<HTMLElement | null>;
    scrollResetEpoch: number;
    onSelect: () => void;
}> = ({ mapRef, items, scrollRef, scrollResetEpoch, onSelect }) => {

    // SELECTION STATE
    const [selectedItemKey, setSelectedItemKey] = useSelectedItemKey(items, mapRef);

    // VIRTUALIZER
    const rowVirtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => 86, // estimated height of each list item
        getItemKey: (index) => getListItemKey(items[index].id, index),
        overscan: 5,
    });
    // SYNC VIRTUALIZER OFFSET AFTER A REFRESHED LIST HAS SETTLED
    useLayoutEffect(() => {
        rowVirtualizer.scrollToOffset(0, { behavior: 'auto' });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scrollResetEpoch]);

    // KEEP THE SELECTED ROW IN VIEW WHEN THE SELECTION COMES FROM THE MAP.
    useLayoutEffect(() => {
        if (!selectedItemKey) return;

        const index = items.findIndex((row, rowIndex) => getListItemKey(row.id, rowIndex) === selectedItemKey);
        if (index < 0) return;

        rowVirtualizer.scrollToIndex(index, {
            align: 'start',
            behavior: 'smooth',
        });
    }, [items, rowVirtualizer, selectedItemKey]);

    return (
        <div className="list-virtualizer" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = items[virtualRow.index];
                const itemKey = getListItemKey(row.id, virtualRow.index);

                return (
                    <div key={itemKey} ref={rowVirtualizer.measureElement} data-index={virtualRow.index}
                        className="list-virtual-row" style={{ transform: `translateY(${virtualRow.start}px)` }}
                    >
                        <ListItem item={row}
                            isSelected={selectedItemKey === itemKey}
                            onSelect={() => { setSelectedItemKey(itemKey); onSelect(); }}
                            onClose={() => { setSelectedItemKey(selectedItemKey === itemKey ? null : selectedItemKey); }}
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default Virtualizer;
