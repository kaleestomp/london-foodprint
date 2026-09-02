import { useEffect, useRef } from 'react';
import type { TopPlaceItem } from '../../../../../request/useRequestTopPlaces/request';
import { useTopPlaces } from '../../../../../../context/TopPlacesContext';

// MADE FOR DEDUPLICATION OF TOP PLACE MARKER 
// FROM PLACES MARKERS + SINGLETON MARKERS FROM DYNAMIC PLACES LAYER
const useReportTopPlacesIDs = (
  topPlaces: TopPlaceItem[],
  enabled?: boolean
): void => {

  const keyRef = useRef('');
  const { reportTopPlaceIdSet } = useTopPlaces();

  useEffect(() => {
    if (!enabled) return;
    const topPlaceIds = topPlaces.map((place) => place.id);
    const key = topPlaceIds.length
      ? [...topPlaceIds].sort((left, right) => left.localeCompare(right)).join('|')
      : '';

    if (key !== keyRef.current) {
      keyRef.current = key;
      const activeTopPlaceIdSet = topPlaces.length ? 
        new Set<string>(topPlaces.map((place) => place.id)) : new Set<string>();
      reportTopPlaceIdSet(activeTopPlaceIdSet);
    }
  }, [topPlaces, reportTopPlaceIdSet, enabled]);

  useEffect(() => {
    if (!enabled) {
      keyRef.current = '';
      reportTopPlaceIdSet(new Set<string>());
    }
  }, [enabled, reportTopPlaceIdSet]);

};

export default useReportTopPlacesIDs;
