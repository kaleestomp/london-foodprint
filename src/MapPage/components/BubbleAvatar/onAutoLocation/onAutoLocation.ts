import React from 'react';
import type * as maplibregl from 'maplibre-gl';

import useFlyBubbleToLocation from './useFlyBubbleToLocation';
import { useMapLocationNavigationState } from '../../Map/MapNavigationContext/MapLocationNavigationContext';

type props = {
    mapRef: React.RefObject<maplibregl.Map | null>;
};
const useAutoLocation = ({ mapRef }: props) => { 

    // Handle Automatic Location Update Logic (LIVE / GEOSEARCH)
    // ==========================================================

    // Handel Map Pan
    const { settledTarget, settledToken } = useMapLocationNavigationState();
    // Handel Bubble Flight to User Location Logic (LIVE / GEOSEARCH)
    const { flyOutTo, dropOnEndFlight } = useFlyBubbleToLocation({ mapRef, targetLocation: settledTarget, token: settledToken });

    return  { flyOutTo, dropOnEndFlight };
};

export default useAutoLocation;
