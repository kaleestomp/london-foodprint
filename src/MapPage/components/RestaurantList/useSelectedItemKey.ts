import { useEffect, useState } from 'react';
import { type PlacesListItem } from '../../request/useRequestPlacesList/request'

export const getListItemKey = (id: string, index: number): string => `${id}-${index}`;
const useSelectedItemKey = (
    items: PlacesListItem[]
) => {
    const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);
      useEffect(() => {
        if (!selectedItemKey) return;
        const hasSelectedItem = items.some((row, idx) => getListItemKey(row.id, idx) === selectedItemKey);
        if (!hasSelectedItem) setSelectedItemKey(null);
      }, [items, selectedItemKey]);
  
    return [selectedItemKey, setSelectedItemKey] as const;
};

export default useSelectedItemKey;