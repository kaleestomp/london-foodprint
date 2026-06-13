import { useState, useEffect } from 'react';

/**
 * Owns the blink cycle.
 * Schedules a close → reopen sequence at random intervals.
 * Completely independent of gaze or drag state.
 */
const useBlink = () => {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    let scheduleTimer: ReturnType<typeof setTimeout>;
    let reopenTimer:   ReturnType<typeof setTimeout>;

    const scheduleBlink = () => {
      scheduleTimer = setTimeout(() => {
        setIsBlinking(true);
        reopenTimer = setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 140); // eyes stay closed for 140 ms
      }, 1800 + Math.random() * 2000); // blink every 1.8–3.8 s
    };

    scheduleBlink();

    return () => {
      clearTimeout(scheduleTimer);
      clearTimeout(reopenTimer);
    };
  }, []);

  return { isBlinking };
};

export default useBlink;
