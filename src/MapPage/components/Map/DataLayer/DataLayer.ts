import { useState } from 'react';
import L from 'leaflet';

import { type SearchMask } from './LayerStates/filterTileOutsideMask';
import { usePlaceSelection } from '../../../../context/PlaceSelectionContext';
import useTopPlacesLayer from './TopPlacesLayer/useTopPlacesLayer';
import useDensityPlacesLayer from './DensityPlacesLayer/useDensityPlacesLayer';

const DataLayer = (
  mapRef: React.RefObject<L.Map | null>,
  searchMask: SearchMask | null = null,
  enabled = true,
): void => {
  const { selectedPlaceId, setSelectedPlaceId } = usePlaceSelection();
  const [activeTopPlaceIds, setActiveTopPlaceIds] = useState<string[]>([]);

  useTopPlacesLayer({
    mapRef,
    enabled,
    selectedPlaceId,
    setSelectedPlaceId,
    onActiveTopPlaceIdsChange: setActiveTopPlaceIds,
    debounceMs: 80,
  });

  useDensityPlacesLayer({
    mapRef,
    searchMask,
    enabled,
    activeTopPlaceIds,
    setSelectedPlaceId,
  });

};

export default DataLayer;
