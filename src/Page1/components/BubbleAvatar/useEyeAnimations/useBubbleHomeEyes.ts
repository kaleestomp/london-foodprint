import useEyeGaze from './useEyeGaze';
import useSmileGaze from './useSmileGaze';

type Args = {
  bubbleRef: React.RefObject<HTMLDivElement | null>;
  isDragging: boolean;
  isVisuallyDragging: boolean;
};

/**
 * Composes all eye-related animation state for BubbleAvatarHome.
 * Keeps the component focused on drag orchestration and layout concerns.
 */
const useBubbleHomeEyes = ({ bubbleRef, isDragging, isVisuallyDragging }: Args) => {
  const { gaze, isBlinking } = useEyeGaze(bubbleRef);
  const smileGaze = useSmileGaze(isVisuallyDragging);

  const isSmileEye = isVisuallyDragging;
  const eyeScaleY = isDragging ? 1.4 : isBlinking ? 0.08 : 1;
  const eyeX = isSmileEye ? smileGaze.x : gaze.x;
  const eyeY = isSmileEye ? smileGaze.y : gaze.y;

  return { isSmileEye, eyeScaleY, eyeX, eyeY, isBlinking };
};

export default useBubbleHomeEyes;
