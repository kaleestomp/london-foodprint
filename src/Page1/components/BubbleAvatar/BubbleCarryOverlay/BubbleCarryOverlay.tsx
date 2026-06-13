import { motion } from 'framer-motion';
import useBlink from '../useEyeAnimations/useBlink';
import './BubbleCarryOverlay.css';

type Props = { x: number; y: number };

/**
 * Floating 40 px avatar that follows the cursor during a map-pickup carry.
 * Uses only blinking (no gaze — the overlay IS at the cursor position).
 * Eyes are held slightly wide (scaleY 1.3) to signal the "picked up" state.
 */
const BubbleCarryOverlay: React.FC<Props> = ({ x, y }) => {
  const { isBlinking } = useBlink();
  const eyeScaleY = isBlinking ? 0.08 : 1.3;

  return (
    <div className="bubble-carry-overlay" style={{ left: x, top: y }}>
      <div className="bubble-carry-eyes">

        <motion.div
          className="bubble-carry-eye"
          animate={{ scaleY: eyeScaleY }}
          transition={{ scaleY: { duration: 0.13 } }}
        />

        <motion.div
          className="bubble-carry-eye"
          animate={{ scaleY: eyeScaleY }}
          transition={{ scaleY: { duration: 0.13, delay: isBlinking ? 0.04 : 0 } }}
        />

      </div>
    </div>
  );
};

export default BubbleCarryOverlay;
