import { useEffect, useRef, useState } from 'react';

/** Anima un numero verso il target (count-up). Rispetta prefers-reduced-motion. */
export function useCountUp(target: number | null, duration = 700): number | null {
  const [val, setVal] = useState<number | null>(target);
  const fromRef = useRef<number | null>(target);

  useEffect(() => {
    if (target === null) {
      setVal(null);
      fromRef.current = null;
      return;
    }
    const from = fromRef.current ?? target;
    if (from === target) {
      setVal(target);
      return;
    }
    // Telefono / touch: numero subito, niente re-render a 60fps (PC invariato)
    const leggera = window.matchMedia?.('(max-width: 768px), (pointer: coarse), (prefers-reduced-motion: reduce)').matches;
    if (leggera) {
      setVal(target);
      fromRef.current = target;
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round((from + (target - from) * eased) * 100) / 100);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      fromRef.current = target;
    };
  }, [target, duration]);

  return val;
}
