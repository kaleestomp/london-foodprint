import { useEffect, useState } from 'react';
import { type PlacesListItem } from '../../../request/useRequestPlacesList/request'

export const getListItemKey = (displayName: string, index: number): string => `${displayName}-${index}`;
const useSelectedItemKey = (
    items: PlacesListItem[]
) => {
    const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);
      useEffect(() => {
        if (!selectedItemKey) return;
        const hasSelectedItem = items.some((row, idx) => getListItemKey(row.display_name, idx) === selectedItemKey);
        if (!hasSelectedItem) setSelectedItemKey(null);
      }, [items, selectedItemKey]);
  
    return [selectedItemKey, setSelectedItemKey] as const;
};

export default useSelectedItemKey;