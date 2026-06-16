import useEyeGaze from './useEyeGaze';

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
  const mode = isVisuallyDragging ? 'smile' : 'idle';
  const { gaze, isBlinking } = useEyeGaze(bubbleRef, mode);

  const isSmileEye = isVisuallyDragging;
  const eyeScaleY = isDragging ? 1.4 : isBlinking ? 0.08 : 1;
  const eyeX = gaze.x;
  const eyeY = gaze.y;

  return { isSmileEye, eyeScaleY, eyeX, eyeY, isBlinking };
};

export default useBubbleHomeEyes;
