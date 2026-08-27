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

  const baseEyeStyle: React.CSSProperties = {
    transform: `translate3d(${eyeX}px, ${eyeY}px, 0) scaleY(${eyeScaleY})`,
    transition: 'transform 130ms cubic-bezier(0.22, 1, 0.36, 1)',
  };

  const rightEyeStyle: React.CSSProperties = {
    ...baseEyeStyle,
    transitionDelay: isBlinking ? '40ms' : '0ms',
  };

  return (
    <div className="bubble-inner">
        <div className="bubble-face">
        <div className="bubble-eyes">

            {/* Left eye */}
            <div
            className={`bubble-eye${isSmileEye ? ' is-smile' : ''}`}
            style={baseEyeStyle}
            />

            {/* Right eye — 40 ms stagger on blink close only */}
            <div
            className={`bubble-eye${isSmileEye ? ' is-smile' : ''}`}
            style={rightEyeStyle}
            />

        </div>
        </div>
    </div>
  );
};

export default BubbleEyes;
