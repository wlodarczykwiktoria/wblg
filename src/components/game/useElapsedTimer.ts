import { useCallback, useEffect, useState } from 'react';

export function useElapsedTimer(paused: boolean): {
  totalSeconds: number;
  resetTimer(): void;
} {
  const [totalSeconds, setTotalSeconds] = useState(0);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      if (!paused) {
        setTotalSeconds((seconds) => seconds + 1);
      }
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [paused]);

  const resetTimer = useCallback(() => {
    setTotalSeconds(0);
  }, []);

  return { totalSeconds, resetTimer };
}
