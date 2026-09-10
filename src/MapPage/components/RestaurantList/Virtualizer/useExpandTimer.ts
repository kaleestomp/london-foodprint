import { useEffect, useState } from 'react';

import { getListItemKey } from './useSelectedItemKey/useSelectedItemKey';
import { type PlacesListItem } from '../../../request/useRequestPlacesList/request';

const useExpandedItemKey = (
    items: PlacesListItem[],
    selectedItemKey: string | null,
    selectionSource: string | null,
    range: { startIndex: number; endIndex: number } | null,
): string | null => {

    const [expandedItemKey, setExpandedItemKey] = useState<string | null>(null);

    useEffect(() => {
        if (!selectedItemKey) {
            setExpandedItemKey(null);
            return;
        }

        if (selectionSource !== 'map') {
            setExpandedItemKey(selectedItemKey);
            return;
        }

        const index = items.findIndex((row) => getListItemKey(row.id) === selectedItemKey);
        if (index < 0) return;

        const distance = range
            ? index < range.startIndex
                ? range.startIndex - index
                : index > range.endIndex
                    ? index - range.endIndex
                    : 0
            : 0;

        if (distance <= 2) {
            setExpandedItemKey(selectedItemKey);
            return;
        }

        setExpandedItemKey(null);
        const expansionDelay = Math.min(800, Math.max(400, distance * 35));
        const expandTimer = window.setTimeout(() => {
            setExpandedItemKey(selectedItemKey);
        }, expansionDelay);

        return () => window.clearTimeout(expandTimer);
    }, [items, range, selectedItemKey, selectionSource]);

    return expandedItemKey;
};

export default useExpandedItemKey;
