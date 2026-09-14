import { useEffect, useMemo, useState } from 'react';
import type * as maplibregl from 'maplibre-gl';

import { usePlaceSelection } from '../../../../../context/PlaceSelectionContext';
import useAddTempMarker from './useAddTempMarker/useAddTempMarker';
import useFocusCamera from './focusCamera';
import { type PlacesListItem } from '../../../../request/useRequestPlacesList/request'
import useTargetLayer from './useTargetLayer';
import useManageSelectionContext from './useManageSelectionContext/useManageSelectionContext';

export const getListItemKey = (id: string): string => id;
const useSelectedItemKey = (
  items: PlacesListItem[],
  mapRef: React.RefObject<maplibregl.Map | null>,
) => {

  const { selectedPlaceId, selectionSource } = usePlaceSelection();

  // SELECTED ITEM KEY STATE
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);

  // MATCH MAP SELECTION TO LIST ITEM KEY.
  useEffect(() => {
    if (selectedPlaceId === null) {
      setSelectedItemKey(null);
    } else {
      const matchedIndex = items.findIndex((row) => row.id === selectedPlaceId);
      const matchInVirtualRange = matchedIndex >= 0;
      if (matchInVirtualRange) {
        const nextKey = getListItemKey(items[matchedIndex].id);
        setSelectedItemKey(nextKey);
      }
    }
  // ITEMS purposely REMOVED from deps 
  // to AVOID finding match AFTER list refresh;
  // MATCH ID is either found in the moment or not;
  }, [selectedPlaceId]); 

  // CLEAR SELECTED ITEM IF IT NO LONGER EXISTS IN THE LIST
  useEffect(() => {
    if (selectedItemKey) {
      const selectionInList = items.some((row) => getListItemKey(row.id) === selectedItemKey);
      if (!selectionInList) setSelectedItemKey(null);
    }
  }, [items, selectedItemKey]);

  // GET THE CURRENTLY SELECTED ITEM 
  const selectedItem = useMemo(() => {
    if (selectedItemKey) {
      const item = items.find((row) => getListItemKey(row.id) === selectedItemKey);
      return item ?? null;
    } else { 
      return null;
    }
  }, [items, selectedItemKey]);

  // REPORT / CLEAR SELECTED ITEM TO CONTEXT
  const targetLayer = useTargetLayer(selectedItem);
  useManageSelectionContext(selectedItem, targetLayer);
  
  // RENDER NEW MARKER IF NOT FOUND IN TOP PLACES MARKERS
  useAddTempMarker(mapRef, selectedItem, (targetLayer !== 'topPlaces'));

  // FOCUS CAMERA ON SELECTED ITEM
  useFocusCamera(mapRef, selectedItem, selectionSource);

  return [selectedItemKey, setSelectedItemKey] as const;
};

export default useSelectedItemKey;