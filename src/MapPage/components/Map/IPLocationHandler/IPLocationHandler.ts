import React, { useEffect, useState } from 'react';
import type maplibregl from 'maplibre-gl';

import useIPLocation from '../../../../request/useIPLocation/useIPLocation';
import { useCityContext } from '../../../../context/CityContext';
import { isWithinCityBounds } from '../MapTemplate';

const IP_LOCATION_CHECK_DURATION = 2000;

const IPLocationHandler: React.FC<{ mapRef: React.RefObject<maplibregl.Map | null> }> = ({ mapRef }) => {
  const { cityParams } = useCityContext();
  const [mapReady, setMapReady] = useState(false);
  const [ipLookupOpen, setIpLookupOpen] = useState(true);
  const [hasAppliedIpCenter, setHasAppliedIpCenter] = useState(false);
  const ipLocation = useIPLocation();
  // Track map readiness to avoid trying to fly to a location before the map is initialized. 
  // This is important because the map may not be ready immediately after the component mounts, 
  // and attempting to fly to a location before the map is ready could result in errors or 
  // unexpected behavior. By tracking the map's readiness, we can ensure that we only attempt 
  // to fly to the IP location when the map is fully initialized and ready to handle such actions.
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
  }, [mapRef]);

  // Limit the duration of the IP location check to avoid keeping the user waiting indefinitely.
  useEffect(() => {
    const timer = setTimeout(() => setIpLookupOpen(false), IP_LOCATION_CHECK_DURATION);
    return () => clearTimeout(timer);
  }, []);

  // Startup behaviour: If the IP location is available within 2s and within city bounds, 
  // fly to that location on the map.
  useEffect(() => {
    if (!ipLookupOpen || hasAppliedIpCenter || !mapReady || !ipLocation || !ipLocation.lat || !ipLocation.lon || !cityParams) return;

    const point = { lng: ipLocation.lon, lat: ipLocation.lat };
    const withinCity = isWithinCityBounds(point.lat, point.lng, cityParams.maxBounds);

    if (!withinCity) {
      setIpLookupOpen(false);
      return;
    }

    mapRef.current?.flyTo({ center: [point.lng, point.lat], zoom: cityParams.initZoom, essential: true });
    setHasAppliedIpCenter(true);
    setIpLookupOpen(false);
  }, [hasAppliedIpCenter, ipLocation, ipLookupOpen, mapReady, mapRef, cityParams]);
};

export default IPLocationHandler;

