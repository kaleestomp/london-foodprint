import type * as maplibregl from 'maplibre-gl';

import useBoundaryLayer from './BoundaryLayer/useBoundaryLayer';
import useStreetLayer from './StreetLayer/useStreetLayer';
import RadiusLayer from './RadiusLayer/RadiusLayer';

const StyleLayer = (
  mapRef: React.RefObject<maplibregl.Map | null>,
): void => {
  useBoundaryLayer(mapRef);
  useStreetLayer(mapRef);
  RadiusLayer(mapRef);
};

export default StyleLayer;