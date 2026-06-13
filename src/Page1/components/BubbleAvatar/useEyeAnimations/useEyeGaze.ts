import useBlink from './useBlink';
import useGaze  from './useGaze';

/**
 * Composer: combines blink + gaze into a single hook call for BubbleButton.
 * Swap or remove either sub-hook here to toggle the behaviour independently.
 */
const useEyeGaze = (bubbleRef: React.RefObject<HTMLDivElement | null>) => {
  const { isBlinking } = useBlink();
  const { gaze }       = useGaze(bubbleRef);
  return { gaze, isBlinking };
};

export default useEyeGaze;
