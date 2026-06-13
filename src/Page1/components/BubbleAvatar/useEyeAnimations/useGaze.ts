import { useState, useEffect, useRef, useCallback } from 'react';

export type GazeOffset = { x: number; y: number };

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
const useGaze = (bubbleRef: React.RefObject<HTMLDivElement | null>) => {
  const [gaze, setGaze] = useState<GazeOffset>({ x: 0, y: 0 });
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  // ── Passive cursor tracking ──────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // ── Cursor-angle helper ──────────────────────────────────────────────────
  const gazeAtCursor = useCallback((): GazeOffset => {
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
    let timer: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      timer = setTimeout(() => {
        const roll = Math.random();

        if      (roll < 0.40) setGaze(gazeAtCursor());             // look at cursor
        else if (roll < 0.58) setGaze({ x: -MAX_OFFSET, y: 0 });  // glance left
        else if (roll < 0.76) setGaze({ x:  MAX_OFFSET, y: 0 });  // glance right
        else if (roll < 0.88) setGaze({ x: 0, y: MAX_OFFSET * 0.6 }); // glance down
        else                  setGaze({ x: 0, y: 0 });            // centre

        scheduleNext();
      }, 1400 + Math.random() * 2800); // every 1.4–4.2 s
    };

    scheduleNext();
    return () => clearTimeout(timer);
  }, [gazeAtCursor]);

  return { gaze };
};

export default useGaze;
