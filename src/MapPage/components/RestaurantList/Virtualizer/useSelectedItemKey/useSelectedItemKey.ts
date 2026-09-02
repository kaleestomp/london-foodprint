import { useEffect, useMemo, useState } from 'react';
import type maplibregl from 'maplibre-gl';

import { usePlaceSelection } from '../../../../../context/PlaceSelectionContext';
import useAddNewMarker from './useAddNewMarker/useAddNewMarker';
import useFocusCamera from './focusCamera';
import useReportSelectedPlace from './useReportSelectedPlace';
import { type PlacesListItem } from '../../../../request/useRequestPlacesList/request'

export const getListItemKey = (id: string, index: number): string => `${id}|%|${index}`;
const useSelectedItemKey = (
  items: PlacesListItem[],
  mapRef: React.RefObject<maplibregl.Map | null>,
) => {

  const { selectedPlaceId, selectionSource } = usePlaceSelection();

  // SELECTED ITEM KEY STATE
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);

  // SYNC THE LIST SELECTION STATE WITH THE ACTIVE map/list selection.
  useEffect(() => {
    if (selectedPlaceId === null) {
      setSelectedItemKey((current) => (current === null ? current : null));
      return;
    }

    const matchedIndex = items.findIndex((row) => row.id === selectedPlaceId);
    if (matchedIndex < 0) return;

    const nextKey = getListItemKey(items[matchedIndex].id, matchedIndex);
    setSelectedItemKey((current) => (current === nextKey ? current : nextKey));
  }, [items, selectedPlaceId]);

  // CLEAR SELECTED ITEM IF IT NO LONGER EXISTS IN THE LIST
  useEffect(() => {
    if (!selectedItemKey) return;
    const hasSelectedItem = items.some((row, idx) => getListItemKey(row.id, idx) === selectedItemKey);
    if (!hasSelectedItem) setSelectedItemKey(null);
  }, [items, selectedItemKey]);

  // GET THE CURRENTLY SELECTED ITEM 
  const selectedItem = useMemo(() => {
    if (!selectedItemKey) return null;
    return items.find((row, idx) => getListItemKey(row.id, idx) === selectedItemKey) ?? null;
  }, [items, selectedItemKey]);

  // REPORT SELECTED ITEM TO CONTEXT
  const isTopPlace: boolean | null = useReportSelectedPlace(selectedItem);
  
  // RENDER NEW MARKER IF NOT FOUND IN TOP PLACES MARKERS
  useAddNewMarker(mapRef, selectedItem, (isTopPlace === false));

  // FOCUS CAMERA ON SELECTED ITEM
  useFocusCamera(mapRef, selectedItem, selectionSource);

  return [selectedItemKey, setSelectedItemKey] as const;
};

export default useSelectedItemKey;