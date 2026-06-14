import React, { useEffect, useState } from 'react'; 

import L from 'leaflet';
import useIPLocation from '../../../../../request/useIPLocation/useIPLocation';
import { LONDON_BOUNDS, LONDON_INITIAL_ZOOM } from '../MapTemplate';
const IP_LOCATION_CHECK_DURATION = 2000;
const IPLocationHandler: React.FC<{ mapRef: React.RefObject<L.Map | null> }> = ({ mapRef }) => { 

    const [mapReady, setMapReady] = useState(false);
    const [ipLookupOpen, setIpLookupOpen] = useState(true);
    const [hasAppliedIpCenter, setHasAppliedIpCenter] = useState(false);
    const ipLocation = useIPLocation();

    // Track map readiness for startup flows that need the Leaflet instance.
    useEffect(() => {
        if (mapRef.current) {
            setMapReady(true);
            return;
        }
        const timer = setInterval(() => {
            if (mapRef.current) {
                setMapReady(true);
                clearInterval(timer);
            }
        }, 50);

        return () => clearInterval(timer);
    }, []);

    // Limit IP-based startup centering to a 2s best-effort window.
    useEffect(() => {
        const timer = setTimeout(() => setIpLookupOpen(false), IP_LOCATION_CHECK_DURATION);
        return () => clearTimeout(timer);
    }, []);

    // Startup behavior: if IP location arrives in <=2s and is in London, set view to zoom 15.
    useEffect(() => {
        if (!ipLookupOpen || hasAppliedIpCenter || !mapReady 
            || !ipLocation || !ipLocation.lat || !ipLocation.lon
        ) return; 

        const latLng = L.latLng(ipLocation.lat, ipLocation.lon);
        if (!LONDON_BOUNDS.contains(latLng)) {
            setIpLookupOpen(false);
            return;
        }

        mapRef.current?.setView(latLng, LONDON_INITIAL_ZOOM, { animate: true });
        setHasAppliedIpCenter(true);
        setIpLookupOpen(false);
    }, [hasAppliedIpCenter, ipLocation, ipLookupOpen, mapReady]);
}

export default IPLocationHandler;

