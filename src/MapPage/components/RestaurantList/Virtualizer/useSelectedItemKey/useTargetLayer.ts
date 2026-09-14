import { useMemo } from 'react';

import { useTopPlaces } from '../../../../../context/TopPlacesContext';
import { type PlacesListItem } from '../../../../request/useRequestPlacesList/request'
import { type SelectedLayer } from '../../../../../context/PlaceSelectionContext';

const useTargetLayer = (
    selectedPlace: PlacesListItem | null,
) => {
    // NEW SELECTION TARGETS TOP PLACE LAYER
    const { topPlaceIdSet } = useTopPlaces();
    const targetLayer: SelectedLayer = useMemo(() => {
        const isTopPlace = selectedPlace !== null
            ? Boolean(topPlaceIdSet.has(selectedPlace.id))
            : null;
        return isTopPlace ? 'topPlaces' : 'temporary';
    }, [selectedPlace, topPlaceIdSet]);
    // TARGET LAYER FALLBACK IS 'temporary'
    
    return targetLayer;
};

export default useTargetLayer;