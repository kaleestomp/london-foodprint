import { useState, useEffect } from 'react';

import { usePlaceSelection } from '../../../../context/PlaceSelectionContext';
import { type PlacesListItem } from '../../../request/useRequestPlacesList/request';

type ListStatus = 'empty' | 'loading' | 'success' | 'error';

// Reports the currently selected place id up to the parent (Content) whenever a
// cluster singleton marker is selected but has no matching row in the loaded list.
const useReportUnmatchedSelection = (
  items: PlacesListItem[],
  status: ListStatus,
): string | null => {

  const { selectedPlaceId, selectedLayer } = usePlaceSelection();
  const [unmatchedPlaceId, setUnmatchedPlaceId] = useState<string | null>(null);

  useEffect(() => {

    const validLayer = selectedLayer === 'cluster' || selectedLayer === 'topPlaces';
    if (selectedPlaceId === null || !validLayer) {
      setUnmatchedPlaceId(null);

    } else {
      const isMatched = items.some((row) => row.id === selectedPlaceId);

      // Hold the previous verdict while the list is (re)loading to avoid a false "not found" flash.
      if (!isMatched && status === 'loading') return;
      setUnmatchedPlaceId(isMatched ? null : selectedPlaceId);
    }

  }, [items, status, selectedPlaceId, selectedLayer]);

  return unmatchedPlaceId;
};

export default useReportUnmatchedSelection;
