import React from 'react';
import maplibregl from 'maplibre-gl';
import { type PlacesListItem } from '../../../../../request/useRequestPlacesList/request';
import TopPlacePin from '../../../../Map/DataLayer/TopPlacesLayer/syncMarkers/markers/TopPlacePin';

const addMarker = (
    map: maplibregl.Map,
    item: PlacesListItem,
    selectedMarkerRef: React.RefObject<{ id: string | null, marker: maplibregl.Marker | null }>,
) => {

    if (!item.id || !item.lon || !item.lat) return;
    // REMOVE OLD MARKER IF EXISTS
    selectedMarkerRef.current.marker?.remove();

    const marker = new maplibregl.Marker({
        element: TopPlacePin(item.id, item.cuisine_type ?? undefined),
        anchor: 'center',
    }).setLngLat([item.lon, item.lat]).addTo(map);
    const motion = marker.getElement().querySelector<HTMLElement>('.top-place-pin-motion');
    const shell = marker.getElement().querySelector<HTMLElement>('.top-place-pin-shell');
    motion?.classList.add('is-selected');
    shell?.classList.add('is-selected');
    selectedMarkerRef.current.marker = marker;
    selectedMarkerRef.current.id = String(item.id);
};

export default addMarker;
