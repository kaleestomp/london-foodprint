import React from 'react';
import maplibregl from 'maplibre-gl';
import TopPlacePin from '../../TopPlacesLayer/syncMarkers/markers/TopPlacePin';

const showPlaceMarker = (
    map: maplibregl.Map,
    feature: maplibregl.MapGeoJSONFeature | undefined, 
    selectedMarkerRef: React.RefObject<maplibregl.Marker | null>,
) => {

    if (feature?.geometry.type !== 'Point') return;
    selectedMarkerRef.current?.remove();

    const [lng, lat] = feature.geometry.coordinates;
    const cuisineType = typeof feature.properties?.cuisine_type === 'string'
        ? feature.properties.cuisine_type
        : undefined;
    const placeId = feature.properties?.id ?? feature.id ?? undefined;
    const marker = new maplibregl.Marker({
        element: TopPlacePin(placeId, cuisineType),
        anchor: 'center',
    }).setLngLat([lng, lat]).addTo(map);
    const motion = marker.getElement().querySelector<HTMLElement>('.top-place-pin-motion');
    const shell = marker.getElement().querySelector<HTMLElement>('.top-place-pin-shell');
    motion?.classList.add('is-selected');
    shell?.classList.add('is-selected');
    selectedMarkerRef.current = marker;
};

export default showPlaceMarker;
