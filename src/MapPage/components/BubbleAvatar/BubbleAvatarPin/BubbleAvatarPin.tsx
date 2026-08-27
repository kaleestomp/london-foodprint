import { useRef } from 'react';
import useEyeGaze from '../BubbleEyes/useEyeGaze';
import './BubbleAvatarPin.css';

/**
 * The avatar rendered as a Leaflet map element after a drop.
 * Mounted via ReactDOM.createRoot() inside a L.divIcon container.
 * Retains blinking and cursor-tracking gaze animations.
 * No drag — interaction is handled by the map itself.
 */
const BubbleAvatarPin: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { gaze, isBlinking } = useEyeGaze(containerRef, 'curious');
  const eyeScaleY = isBlinking ? 0.08 : 1;
  const leftEyeStyle: React.CSSProperties = {
    transform: `translate3d(${gaze.x * 0.6}px, ${gaze.y * 0.6}px, 0) scaleY(${eyeScaleY})`,
    transition: 'transform 130ms cubic-bezier(0.22, 1, 0.36, 1)',
  };
  const rightEyeStyle: React.CSSProperties = {
    ...leftEyeStyle,
    transitionDelay: isBlinking ? '40ms' : '0ms',
  };

  return (
    <div ref={containerRef} className="bubble-avatar-pin">
      <div className="bubble-avatar-eyes">

        {/* Left eye */}
        <div
          className="bubble-avatar-eye"
          style={leftEyeStyle}
        />

        {/* Right eye — 40 ms stagger on blink close */}
        <div
          className="bubble-avatar-eye"
          style={rightEyeStyle}
        />

      </div>
    </div>
  );
};

export default BubbleAvatarPin;
