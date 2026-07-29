import { useEffect, useRef } from 'react';
import type { TopPlaceItem } from '../../../../../request/useRequestTopPlaces/request';

type Props = {
  topPlaces: TopPlaceItem[];
  setActiveTopPlaceIds?: (ids: string[]) => void;
  enabled: boolean;
};

const useReportTopPlacesIDs = ({ topPlaces, setActiveTopPlaceIds, enabled }: Props): void => {

  const activeTopPlaceIdsKeyRef = useRef('');

  useEffect(() => {
    if (!enabled) return;
    const nextActiveTopPlaceIds = topPlaces.map((place) => place.id);
    const nextActiveTopPlaceIdsKey = nextActiveTopPlaceIds.length
      ? [...nextActiveTopPlaceIds].sort((left, right) => left.localeCompare(right)).join('|')
      : '';

    if (nextActiveTopPlaceIdsKey !== activeTopPlaceIdsKeyRef.current) {
      activeTopPlaceIdsKeyRef.current = nextActiveTopPlaceIdsKey;
      setActiveTopPlaceIds?.(nextActiveTopPlaceIds);
    }
  }, [topPlaces, setActiveTopPlaceIds, enabled]);

  useEffect(() => {
    if (!enabled) {
      activeTopPlaceIdsKeyRef.current = '';
      setActiveTopPlaceIds?.([]);
    }
  }, [enabled, setActiveTopPlaceIds]);

};

export default useReportTopPlacesIDs;
