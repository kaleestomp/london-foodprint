import { motion } from 'framer-motion';
import useBubbleHomeEyes from './useBubbleHomeEyes';
import './BubbleEyes.css';

type Props = {
    bubbleRef: React.RefObject<HTMLDivElement | null>;
    pickupPos: { x: number; y: number } | null;
    isDragging: boolean;
};

const BubbleEyes: React.FC<Props> = ({ bubbleRef, pickupPos, isDragging }) => {

  const isPickupPending = !!pickupPos && !isDragging;
  const isVisuallyDragging = isDragging || isPickupPending;
  const { isSmileEye, eyeScaleY, eyeX, eyeY, isBlinking } = useBubbleHomeEyes({
    bubbleRef,
    isDragging,
    isVisuallyDragging,
  });

  return (
    <div className="bubble-inner">
        <div className="bubble-face">
        <div className="bubble-eyes">

            {/* Left eye */}
            <motion.div
            className={`bubble-eye${isSmileEye ? ' is-smile' : ''}`}
            animate={{ x: eyeX, y: eyeY, scaleY: eyeScaleY }}
            transition={{
                x: { type: 'spring', stiffness: 200, damping: 20 },
                y: { type: 'spring', stiffness: 200, damping: 20 },
                scaleY: { duration: 0.13 },
            }}
            />

            {/* Right eye — 40 ms stagger on blink close only */}
            <motion.div
            className={`bubble-eye${isSmileEye ? ' is-smile' : ''}`}
            animate={{ x: eyeX, y: eyeY, scaleY: eyeScaleY }}
            transition={{
                x: { type: 'spring', stiffness: 200, damping: 20 },
                y: { type: 'spring', stiffness: 200, damping: 20 },
                scaleY: { duration: 0.13, delay: isBlinking ? 0.04 : 0 },
            }}
            />

        </div>
        </div>
    </div>
  );
};

export default BubbleEyes;
