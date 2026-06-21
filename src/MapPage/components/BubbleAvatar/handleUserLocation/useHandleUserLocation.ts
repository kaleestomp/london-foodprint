import React from 'react'; 

import { type LatLng, type Point } from '../config';
import useMapPanToLocation from './useMapPanToLocation';
import useFlyBubbleToLocation from './useFlyBubbleToLocation';

type props = {
    mapRef: React.RefObject<L.Map | null>;
    droppedPos: LatLng | null;
    handleDrop: (lat: number, lng: number) => void;
    resetBubbleToHome: (from?: Point) => void;
};
const useHandleUserLocation = ({ 
    mapRef,
    droppedPos,
    handleDrop,
    resetBubbleToHome,
 }: props) => { 

    // Handle Automatic Location Update Logic (LIVE / GEOSEARCH)
    // ==========================================================

    // Handel Map Pan
    const {targetLatLng, programmaticFlightToken} = useMapPanToLocation({ mapRef });

    // Handel Bubble Flight to User Location Logic (LIVE / GEOSEARCH)
    const { flyOutTo, dropOnEndFlight } = useFlyBubbleToLocation({
        mapRef,
        targetLatLng,
        droppedPos,
        token: programmaticFlightToken,
        handleDrop,
        resetBubbleToHome,
    })
    return  {
        flyOutTo,
        dropOnEndFlight,
    }

}

export default useHandleUserLocation;
