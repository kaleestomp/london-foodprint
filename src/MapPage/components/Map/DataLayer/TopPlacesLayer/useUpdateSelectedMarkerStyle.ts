import { useEffect } from 'react';
import type maplibregl from 'maplibre-gl';

import { usePlaceSelection } from '../../../../../context/PlaceSelectionContext';
import { clearTopPlacePinSelectedState } from './syncMarkers/markers/TopPlacePin';

const useUpdateSelectedMarkerStyle = (
    topPlaceMarkersRef: React.RefObject<Map<string, maplibregl.Marker>>,
    topPlaces: Array<{ id: string }>,
): void => {

    const { selectedPlaceId, selectedLayer } = usePlaceSelection();
    
    // Update Selected Pin CSS State
    useEffect(() => {

        const rankMapByPlaceId = new Map(topPlaces.map((place, index) => [place.id, index + 1]));
        topPlaceMarkersRef.current.forEach((marker, placeId) => {
            const motion = marker.getElement()?.querySelector<HTMLElement>('.top-place-pin-motion');
            const rankBadge = marker.getElement()?.querySelector<HTMLElement>('.top-place-pin-rank-badge');
            const rankBadgeLabel = marker.getElement()?.querySelector<HTMLElement>('.top-place-pin-rank-badge-label');
            if (!motion) return;

            clearTopPlacePinSelectedState(marker);
            if (selectedPlaceId !== null && placeId === selectedPlaceId && selectedLayer === 'topPlaces') {

                // Selected top-place pins lift, scale up, and use selected floating motion.
                motion.classList.add('is-selected');
                marker.getElement()?.querySelector<HTMLElement>('.top-place-pin-shell')?.classList.add('is-selected');
                if (rankBadge) {
                    const rank = rankMapByPlaceId.get(placeId);
                    if (rank && rank <= 20) {
                        if (rankBadgeLabel) rankBadgeLabel.textContent = String(rank);
                        rankBadge.classList.add('has-rank');
                    }
                }
            }
        });
    }, [topPlaces, selectedPlaceId, selectedLayer]);
};

export default useUpdateSelectedMarkerStyle;