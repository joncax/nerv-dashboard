import { useEffect, useRef } from 'react';

export function useAutoRefresh(callback: () => void, intervalSeconds: number) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const id = setInterval(() => callbackRef.current(), intervalSeconds * 1000);
    return () => clearInterval(id);
  }, [intervalSeconds]);
}
