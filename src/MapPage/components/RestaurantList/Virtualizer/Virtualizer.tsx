import { useLayoutEffect, type FC } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type maplibregl from 'maplibre-gl';

import ListItem from '../ListItem/ListItem';
import useSelectedItemKey, { getListItemKey } from './useSelectedItemKey';
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
    const [selectedItemKey, reportSelectedItem] = useSelectedItemKey(items, mapRef);

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
                            onSelect={() => { reportSelectedItem(itemKey); onSelect(); }}
                            onClose={() => { reportSelectedItem(selectedItemKey === itemKey ? null : selectedItemKey); }}
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default Virtualizer;
