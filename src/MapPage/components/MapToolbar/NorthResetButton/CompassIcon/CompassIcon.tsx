import compassBottomSvg from '../../../../../assets/compass/compass-01.svg?raw';
import compassTopSvg from '../../../../../assets/compass/compass-02.svg?raw';
import './CompassIcon.css';

const CompassIcon: React.FC<{
  /** Degrees to rotate the compass dial (same convention as the old needle icon). */
  bearingDeg: number;
  /** Cardinal direction label shown upright in the center: N, E, S or W. */
  directionLabel: string;
}> = ({ bearingDeg, directionLabel }) => (
  
  <span className="map-toolbar-compass-icon-stack" aria-hidden="true">
    <span
      className="map-toolbar-compass-dial"
      style={{ transform: `rotate(${-bearingDeg}deg)` }}
    >
      <span
        className="map-toolbar-compass-layer map-toolbar-compass-layer-bottom"
        dangerouslySetInnerHTML={{ __html: compassBottomSvg }}
      />
      <span
        className="map-toolbar-compass-layer map-toolbar-compass-layer-top"
        dangerouslySetInnerHTML={{ __html: compassTopSvg }}
      />
    </span>
    <span className="map-toolbar-compass-letter">{directionLabel}</span>
  </span>
);

export default CompassIcon;
