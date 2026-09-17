import { useEffect, useRef, useState, type RefObject } from 'react';

/** true quando l'elemento entra nel viewport: i canvas dei grafici si montano solo se servono. */
export function useInView<T extends HTMLElement>(margin = '200px'): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [visto, setVisto] = useState(false);

  useEffect(() => {
    if (visto) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisto(true);
      return;
    }
    const ob = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisto(true);
          ob.disconnect();
        }
      },
      { rootMargin: margin },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [visto, margin]);

  return [ref, visto];
}
