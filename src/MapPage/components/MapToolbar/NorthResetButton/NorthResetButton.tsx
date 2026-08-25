import { useEffect, useState } from 'react';
import type maplibregl from 'maplibre-gl';
import NavigationRoundedIcon from '@mui/icons-material/NavigationRounded';

import './NorthResetButton.css';

type Props = {
  mapRef: React.RefObject<maplibregl.Map | null>;
};

const NORTH_EPSILON_DEG = 0.1;

const normalizeBearing = (bearing: number): number => {
  if (!Number.isFinite(bearing)) return 0;
  const normalized = ((bearing % 360) + 360) % 360;
  return normalized > 180 ? normalized - 360 : normalized;
};

const NorthResetButton: React.FC<Props> = ({ mapRef }) => {
  const [bearingDeg, setBearingDeg] = useState(0);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const syncBearing = () => {
      setBearingDeg(normalizeBearing(map.getBearing()));
    };

    syncBearing();
    map.on('rotate', syncBearing);
    map.on('move', syncBearing);

    return () => {
      map.off('rotate', syncBearing);
      map.off('move', syncBearing);
    };
  }, [mapRef]);

  const isNorth = Math.abs(bearingDeg) < NORTH_EPSILON_DEG;

  return (
    <button
      type="button"
      className={`map-toolbar-layers-btn map-toolbar-compass-btn ${isNorth ? '' : 'map-toolbar-layers-btn-active'}`}
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
      <NavigationRoundedIcon
        fontSize="small"
        className="map-toolbar-compass-icon"
        style={{ transform: `rotate(${-bearingDeg}deg)` }}
      />
    </button>
  );
};

export default NorthResetButton;
