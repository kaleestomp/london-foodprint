import { useEffect, useRef } from 'react';
import type { TopPlaceItem } from '../../../../../request/useRequestTopPlaces/request';

// MADE FOR DEDUPLICATION OF TOP PLACE MARKER 
// FROM PLACES MARKERS + SINGLETON MARKERS FROM DYNAMIC PLACES LAYER
const useReportTopPlacesIDs = (
  topPlaces: TopPlaceItem[],
  setActiveTopPlaceIds: (ids: Set<string> | undefined) => void,
  enabled?: boolean
): void => {

  const keyRef = useRef('');

  useEffect(() => {
    if (!enabled) return;
    const topPlaceIds = topPlaces.map((place) => place.id);
    const key = topPlaceIds.length
      ? [...topPlaceIds].sort((left, right) => left.localeCompare(right)).join('|')
      : '';

    if (key !== keyRef.current) {
      keyRef.current = key;
      const activeTopPlaceIdSet = topPlaces.length ? 
        new Set(topPlaces.map((place) => place.id)) : undefined
      setActiveTopPlaceIds(activeTopPlaceIdSet);
    }
  }, [topPlaces, setActiveTopPlaceIds, enabled]);

  useEffect(() => {
    if (!enabled) {
      keyRef.current = '';
      setActiveTopPlaceIds(undefined);
    }
  }, [enabled, setActiveTopPlaceIds]);

};

export default useReportTopPlacesIDs;
