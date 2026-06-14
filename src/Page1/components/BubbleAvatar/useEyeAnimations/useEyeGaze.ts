import useBlink from './useBlink';
import useIdleGaze  from './useIdleGaze';
import useSmileGaze from './useSmileGaze';
import useCuriousGaze from './useCuriousGaze';
import { type Point } from '../config';

export type EyeGazeMode = 'idle' | 'smile' | 'curious';

/**
 * Composer: combines blink + gaze into a single hook call for BubbleButton.
 * Swap or remove either sub-hook here to toggle the behaviour independently.
 */
const useEyeGaze = (
  bubbleRef: React.RefObject<HTMLDivElement | null>,
  mode: EyeGazeMode = 'idle',
) => {
  const { isBlinking } = useBlink();
  const { gaze: idleGaze } = useIdleGaze(bubbleRef);
  const smileGaze = useSmileGaze(mode === 'smile');
  const { gaze: curiousGaze } = useCuriousGaze(bubbleRef);

  const gaze: Point =
    mode === 'smile' ? smileGaze
    : mode === 'curious' ? curiousGaze
    : idleGaze;

  return { gaze, isBlinking };
};

export default useEyeGaze;
