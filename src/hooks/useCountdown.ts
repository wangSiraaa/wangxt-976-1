import { useState, useEffect, useCallback } from 'react';

export function useCountdown(targetTime: number | undefined, interval = 1000): number {
  const [timeLeft, setTimeLeft] = useState(0);

  const calculateTimeLeft = useCallback(() => {
    if (!targetTime) return 0;
    return Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
  }, [targetTime]);

  useEffect(() => {
    if (!targetTime) {
      setTimeLeft(0);
      return;
    }

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [targetTime, interval, calculateTimeLeft]);

  return timeLeft;
}

export function useCurrentTime(): number {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return now;
}
