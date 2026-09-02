import { useCallback, useEffect, useMemo, useState } from 'react';
import type maplibregl from 'maplibre-gl';

import { useDrawerState } from '../../../components/SlideUpDrawer/DrawerStateContext';
import { useIsMobileCtx } from '../../../../context/IsMobileContext';
import { usePlaceSelection } from '../../../../context/PlaceSelectionContext';
import { useTopPlaces } from '../../../../context/TopPlacesContext';
import useHandleNewMarker from './addMarker/useHandleNewMarker';
import { type PlacesListItem } from '../../../request/useRequestPlacesList/request'

export const getListItemKey = (id: string, index: number): string => `${id}|%|${index}`;
const useSelectedItemKey = (
  items: PlacesListItem[],
  mapRef: React.RefObject<maplibregl.Map | null>,
) => {

  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);
  const { reportSelectedPlaceId } = usePlaceSelection();
  const { topPlaceIdSet } = useTopPlaces();

  const isMobile = useIsMobileCtx();
  const { snapPX, isClosed } = useDrawerState();
  const bottomPadding = isMobile && !isClosed && snapPX ? snapPX : 0;

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

  // RENDER NEW MARKER IF NOT FOUND IN TOP PLACES MARKERS
  const shouldRenderNewMarker = Boolean(selectedItem && !topPlaceIdSet.has(selectedItem.id));
  useHandleNewMarker(mapRef, selectedItem, shouldRenderNewMarker);

  const reportSelectedItem = useCallback((key: string | null) => {
    const map = mapRef.current;
    if (!map) return;

    setSelectedItemKey(key);
    if (!key) {
      reportSelectedPlaceId(null, null);
      return;
    }

    const item = items.find((row, idx) => getListItemKey(row.id, idx) === key);
    if (!item) {
      reportSelectedPlaceId(null, null);
      return;
    }

    const placeId = item.id;
    const isTopPlace = topPlaceIdSet.has(placeId);
    reportSelectedPlaceId(placeId, isTopPlace ? 'topPlaces' : 'list');

    // FOCUS CAMERA ON SELECTED ITEM
    const lng = item.lon;
    const lat = item.lat;
    map.easeTo({
      center: [lng, lat],
      padding: { top: 0, right: 0, bottom: bottomPadding, left: 0 },
      duration: 800,
    });

  }, [mapRef, items, topPlaceIdSet, bottomPadding, reportSelectedPlaceId]);

  return [selectedItemKey, reportSelectedItem] as const;
};

export default useSelectedItemKey;