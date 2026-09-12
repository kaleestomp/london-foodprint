import { useEffect, useState } from 'react';
import type * as maplibregl from 'maplibre-gl';

import CompassIcon from './CompassIcon/CompassIcon';
import { normalizeBearing } from './normalizeBearing';

const NorthResetButton: React.FC<{
  mapRef: React.RefObject<maplibregl.Map | null>;
}> = ({ mapRef }) => {

  const [bearingDeg, setBearingDeg] = useState(0);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const syncBearing = () => setBearingDeg(normalizeBearing(map.getBearing()));

    syncBearing();
    map.on('rotate', syncBearing);
    map.on('move', syncBearing);

    return () => {
      map.off('rotate', syncBearing);
      map.off('move', syncBearing);
    };
  }, [mapRef]);

  return (
    <button className="map-toolbar-btn"
      aria-label="Reset map orientation to north"
      title="Reset orientation"
      onClick={() => {
        const map = mapRef.current;
        if (!map) return;
        map.easeTo({
          bearing: 0,
          duration: 420,
          essential: true,
        });
      }}
    >
      <CompassIcon bearingDeg={bearingDeg} directionLabel={'N'} />
    </button>
  );
};

export default NorthResetButton;
