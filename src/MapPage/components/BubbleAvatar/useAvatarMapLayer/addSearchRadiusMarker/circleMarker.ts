import L from 'leaflet';

import { MaskPane } from './polygonMask';
import { CIRCLE_COLOR } from '../../config';

const CircleMarker = (
  map: L.Map,
  lat: number,
  lng: number,
) => {

  // START HIDDEN 
  // so the circle does not flash before the delayed entry animation.
  const circleMarker = L.circle([lat, lng], {
    radius:    1,
    color:     CIRCLE_COLOR,
    weight:    4.0,
    fill:      false,
    dashArray: '10 10',
    opacity:   0,
    pane: MaskPane(map),
    renderer: L.canvas({ padding: 0.5 }),
  });

  return circleMarker;
};

export default CircleMarker;