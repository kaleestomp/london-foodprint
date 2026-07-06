import { useEffect, useState } from 'react';
import { type Point, DRAG_EYE_MOVE_FREQUENCY, DRAG_EYE_MOVE_MULTIPLIERS, EYE_GAZE_ON_DRAG, JITTER } from '../config';

const MIN_MS = DRAG_EYE_MOVE_FREQUENCY[0];
const MAX_MS = DRAG_EYE_MOVE_FREQUENCY[1];
const MIN_AMP = DRAG_EYE_MOVE_MULTIPLIERS[0];
const MAX_AMP = DRAG_EYE_MOVE_MULTIPLIERS[1];
const PICKS = EYE_GAZE_ON_DRAG;

/**
 * Drag/pickup-only gaze loop for smile-eye mode.
 * Produces subtle randomized eye offsets with random interval and amplitude
 * so movement feels alive and less mechanical.
 */
const useSmileGaze = (isActive: boolean): Point => {
  const [smileGaze, setSmileGaze] = useState<Point>({ x: 0, y: 0 });

  useEffect(() => {
    if (!isActive) {
      setSmileGaze({ x: 0, y: 0 });
      return;
    }

    let timer: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      const delayMs = MIN_MS + Math.random() * (MAX_MS - MIN_MS); // 250-500 ms
      timer = window.setTimeout(() => {
        const baseGaze = PICKS[Math.floor(Math.random() * PICKS.length)];
        const amp = MIN_AMP + Math.random() * (MAX_AMP - MIN_AMP);
        const jitterX = (Math.random() - 0.5) * 2 * JITTER;
        const jitterY = (Math.random() - 0.5) * 2 * JITTER;
        setSmileGaze({
          x: baseGaze.x * amp + jitterX,
          y: baseGaze.y * amp + jitterY,
        });

        scheduleNext();
      }, delayMs);
    };

    scheduleNext();
    return () => {
      clearTimeout(timer);
    };
  }, [isActive]);

  return smileGaze;
};

export default useSmileGaze;
