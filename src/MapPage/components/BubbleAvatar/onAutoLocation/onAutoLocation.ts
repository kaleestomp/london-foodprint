import React from 'react';
import type maplibregl from 'maplibre-gl';

import useMapPanToLocation from './useMapPanToLocation';
import useFlyBubbleToLocation from './useFlyBubbleToLocation';

type props = {
    mapRef: React.RefObject<maplibregl.Map | null>;
};
const onAutoLocation = ({ mapRef }: props) => { 

    // Handle Automatic Location Update Logic (LIVE / GEOSEARCH)
    // ==========================================================

    // Handel Map Pan
    const {targetLatLng, flightToken} = useMapPanToLocation({ mapRef });
    // Handel Bubble Flight to User Location Logic (LIVE / GEOSEARCH)
    const { flyOutTo, dropOnEndFlight } = useFlyBubbleToLocation({ mapRef, targetLatLng, token: flightToken });

    return  { flyOutTo, dropOnEndFlight };
};

export default onAutoLocation;
