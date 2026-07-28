import React from 'react'; 

import { type LatLng } from '../config';
import useMapPanToLocation from './useMapPanToLocation';
import useFlyBubbleToLocation from './useFlyBubbleToLocation';

type props = {
    mapRef: React.RefObject<L.Map | null>;
    droppedPos: LatLng | null;
};
const onAutoLocation = ({ mapRef, droppedPos }: props) => { 

    // Handle Automatic Location Update Logic (LIVE / GEOSEARCH)
    // ==========================================================

    // Handel Map Pan
    const {targetLatLng, flightToken} = useMapPanToLocation({ mapRef });
    // Handel Bubble Flight to User Location Logic (LIVE / GEOSEARCH)
    const { flyOutTo, dropOnEndFlight } = useFlyBubbleToLocation({ mapRef, targetLatLng, droppedPos, token: flightToken });

    return  { flyOutTo, dropOnEndFlight };
};

export default onAutoLocation;
