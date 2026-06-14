import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { MapStyle, maptilerLayer } from '@maptiler/leaflet-maptilersdk';

import { sampleProducts } from '../Map/sampleProducts';

const WORLD_BOUNDS = L.latLngBounds(
  [-85.05112878, -180],
  [85.05112878, 180]
);

const MAPTILER_API_KEY =
  (import.meta.env as Record<string, string | undefined>).VITE_MAPTILER_API_KEY ??
  'L0AWxL91n5i6U70BHW4X';

const Map2: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) {
      return;
    }
    // LAYER 1: Create Instance ----
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      worldCopyJump: true
    }).setView([54.2, -2.5], 6);
    // LAYER 2: Add Map Client ----
    maptilerLayer({
      apiKey: MAPTILER_API_KEY,
      style: MapStyle.STREETS
    }).addTo(map);

    const syncMinZoomToWorldExtent = () => {
      const minWorldZoom = map.getBoundsZoom(WORLD_BOUNDS, true);
      map.setMinZoom(minWorldZoom);

      if (map.getZoom() < minWorldZoom) {
        map.setZoom(minWorldZoom);
      }
    };
    
    const bounds = L.latLngBounds([]);
    // LAYER 3: Add Markers ----
    sampleProducts.forEach((product) => {
      const marker = L.circleMarker([product.Latitude, product.Longitude], {
        radius: 7,
        color: '#114b5f',
        weight: 2,
        fillColor: '#1a936f',
        fillOpacity: 0.9
      }).addTo(map);
      // LAYER 4: Add Popups ----
      marker.bindPopup(
        `<strong>${product.ProductName}</strong><br/>${product.Product}<br/>(${product.Latitude.toFixed(4)}, ${product.Longitude.toFixed(4)})`
      );
      // Adjust Bounds ----
      bounds.extend([product.Latitude, product.Longitude]);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.35));
    }

    map.whenReady(() => {
      map.invalidateSize();
      syncMinZoomToWorldExtent();
    });

    map.on('resize', syncMinZoomToWorldExtent);

    return () => {
      map.off('resize', syncMinZoomToWorldExtent);
      map.remove();
    };
  }, []);

  return <div className="leaflet-map-canvas" ref={mapContainerRef} />;
};

export default Map2;