import { useRef } from 'react';
import { motion } from 'framer-motion';
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

  return (
    <div ref={containerRef} className="bubble-avatar-pin">
      <div className="bubble-avatar-eyes">

        {/* Left eye */}
        <motion.div
          className="bubble-avatar-eye"
          animate={{ x: gaze.x * 0.6, y: gaze.y * 0.6, scaleY: eyeScaleY }}
          transition={{
            x:      { type: 'spring', stiffness: 200, damping: 20 },
            y:      { type: 'spring', stiffness: 200, damping: 20 },
            scaleY: { duration: 0.13 },
          }}
        />

        {/* Right eye — 40 ms stagger on blink close */}
        <motion.div
          className="bubble-avatar-eye"
          animate={{ x: gaze.x * 0.6, y: gaze.y * 0.6, scaleY: eyeScaleY }}
          transition={{
            x:      { type: 'spring', stiffness: 200, damping: 20 },
            y:      { type: 'spring', stiffness: 200, damping: 20 },
            scaleY: { duration: 0.13, delay: isBlinking ? 0.04 : 0 },
          }}
        />

      </div>
    </div>
  );
};

export default BubbleAvatarPin;
