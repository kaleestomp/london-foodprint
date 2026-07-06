import { useState, useEffect, useRef, useCallback } from 'react';
import { type Point, PIN_EYE_MOVE_FREQUENCY, EYE_GAZE_ON_PIN, PIN_EYE_MOVE_MULTIPLIERS, JITTER} from '../config';

const PICKS = EYE_GAZE_ON_PIN;
const MIN_MS = PIN_EYE_MOVE_FREQUENCY[0];
const MAX_MS = PIN_EYE_MOVE_FREQUENCY[1];
const MIN_AMP = PIN_EYE_MOVE_MULTIPLIERS[0];
const MAX_AMP = PIN_EYE_MOVE_MULTIPLIERS[1];
const MAX_OFFSET = 4; // px — max pupil travel in any direction
const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v));

/**
 * Owns the eye gaze direction.
 * Combines two tightly-coupled concerns that share a single mouseRef:
 *  1. Passive cursor tracking (no re-renders — stored in a ref)
 *  2. Random gaze scheduler (periodically snaps gaze to cursor, left, right, etc.)
 *
 * These are kept together because the scheduler reads the cursor ref directly;
 * separating them would require passing a ref between hooks for no real gain.
 */
const useCuriousGaze = (bubbleRef: React.RefObject<HTMLDivElement | null>, isActive = true) => {
  const [gaze, setGaze] = useState<Point>({ x: 0, y: 0 });
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  // ── Passive cursor tracking ──────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) return;
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [isActive]);

  // ── Cursor-angle helper ──────────────────────────────────────────────────
  const gazeAtCursor = useCallback((): Point => {
    const mouse = mouseRef.current;
    const el    = bubbleRef.current;
    if (!mouse || !el) return { x: 0, y: 0 };

    const rect  = el.getBoundingClientRect();
    const cx    = rect.left + rect.width  / 2;
    const cy    = rect.top  + rect.height / 2;
    const dx    = mouse.x - cx;
    const dy    = mouse.y - cy;
    const dist  = Math.sqrt(dx * dx + dy * dy) || 1;
    const scale = Math.min(1, dist / 120); // full travel reached at 120 px away

    return {
      x: clamp((dx / dist) * MAX_OFFSET * scale, MAX_OFFSET),
      y: clamp((dy / dist) * MAX_OFFSET * scale, MAX_OFFSET),
    };
  }, [bubbleRef]);

  // ── Random gaze scheduler ────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) {
      setGaze({ x: 0, y: 0 });
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
        setGaze({
          x: baseGaze.x * amp + jitterX,
          y: baseGaze.y * amp + jitterY,
        });

        scheduleNext();
      }, delayMs);
    };

    scheduleNext();
    return () => clearTimeout(timer);
  }, [gazeAtCursor, isActive]);

  return { gaze };
};

export default useCuriousGaze;
