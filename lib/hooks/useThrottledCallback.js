'use client';
import { useCallback, useEffect, useRef } from 'react';

export function useThrottledCallback(callback, delay = 300) {
  const lastRun = useRef(0);
  const timer = useRef(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return useCallback(
    (...args) => {
      const now = Date.now();
      const remaining = delay - (now - lastRun.current);

      if (remaining <= 0) {
        if (timer.current) {
          clearTimeout(timer.current);
          timer.current = null;
        }
        lastRun.current = now;
        callbackRef.current(...args);
        return;
      }

      if (!timer.current) {
        timer.current = setTimeout(() => {
          lastRun.current = Date.now();
          timer.current = null;
          callbackRef.current(...args);
        }, remaining);
      }
    },
    [delay]
  );
}

export default useThrottledCallback;
