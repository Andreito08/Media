import { useEffect } from 'react';

/**
 * Effetti stile iOS:
 * 1. Tocco -> l'oggetto premuto si ingrandisce e si retroillumina nel punto esatto del dito.
 * 2. Rimbalzo elastico quando si tira oltre la cima o il fondo della pagina.
 */
export function GlobalFx() {
  useEffect(() => {
    // ---------- 1. spotlight nel punto del tocco ----------
    let pressedEl: HTMLElement | null = null;

    const setSpot = (el: HTMLElement, x: number, y: number) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--spot-x', `${x - r.left}px`);
      el.style.setProperty('--spot-y', `${y - r.top}px`);
    };

    const onDown = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null;
      const target = el?.closest?.('button, a, [data-glow]') as HTMLElement | null;
      if (!target) return;
      pressedEl = target;
      setSpot(target, e.clientX, e.clientY);
      target.classList.add('is-pressed');
    };

    const onMove = (e: PointerEvent) => {
      // il dito scivola (mouse/penna): la luce lo segue dentro l'oggetto
      if (pressedEl && (e.buttons > 0 || e.pointerType !== 'mouse')) {
        setSpot(pressedEl, e.clientX, e.clientY);
      }
    };

    const onTouchFollow = (e: TouchEvent) => {
      // tocco tenuto premuto: la luce segue il dito finché resta sull'oggetto,
      // si spegne appena il dito esce (es. parte lo scroll)
      if (!pressedEl || e.touches.length !== 1) return;
      const t = e.touches[0];
      setSpot(pressedEl, t.clientX, t.clientY);
      const under = document.elementFromPoint(t.clientX, t.clientY);
      if (!under || !pressedEl.contains(under)) {
        pressedEl.classList.remove('is-pressed');
        pressedEl = null;
      }
    };

    const clearPressed = () => {
      pressedEl = null;
      document.querySelectorAll('.is-pressed').forEach((el) => el.classList.remove('is-pressed'));
    };

    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', clearPressed);
    window.addEventListener('touchmove', onTouchFollow, { passive: true });
    window.addEventListener('touchend', clearPressed);

    // ---------- 2. rimbalzo elastico ai bordi (pagina + modale) ----------
    // Regole per non litigare col browser:
    // - si ingaggia solo se il tocco PARTE a riposo su un bordo (niente fling in corso)
    // - mai preventDefault se l'evento non è cancellabile (niente errori in console)
    let startY = 0;
    let tracking = false;
    let engaged = false;
    let startedAtEdge = false;
    let raf = 0;
    let moveEl: HTMLElement | null = null;
    const MAX_PULL = 110;

    const rootOf = () => document.getElementById('app-root');

    const panelOf = (e: TouchEvent) =>
      (e.target as HTMLElement | null)?.closest?.('.modal-scroll') as HTMLElement | null;

    const metrics = (panel: HTMLElement | null) => {
      if (!panel) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        return { top: window.scrollY <= 0, bottom: window.scrollY >= max - 1 };
      }
      const max = panel.scrollHeight - panel.clientHeight;
      return { top: panel.scrollTop <= 0, bottom: panel.scrollTop >= max - 1 };
    };

    const modalOpen = () => document.body.style.overflow === 'hidden';

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        tracking = false;
        return;
      }
      const panel = panelOf(e);
      // modale aperto ma tocco fuori dal pannello: lascia fare al modale
      if (modalOpen() && !panel) {
        tracking = false;
        return;
      }
      tracking = true;
      engaged = false;
      startY = e.touches[0].clientY;
      moveEl = panel ?? rootOf();
      moveEl?.classList.remove('bounce-back');
      const m = metrics(panel);
      startedAtEdge = m.top || m.bottom;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking || !e.cancelable) return;
      const panel = panelOf(e);
      const el = panel ?? rootOf();
      if (!el) return;
      const dy = e.touches[0].clientY - startY;
      if (Math.abs(dy) <= 8) return;
      const m = metrics(panel);
      const pastTop = dy > 0 && m.top;
      const pastBottom = dy < 0 && m.bottom;
      if ((pastTop || pastBottom) && startedAtEdge) {
        engaged = true;
        moveEl = el;
        e.preventDefault();
        const damped = Math.sign(dy) * Math.min(MAX_PULL, Math.abs(dy) * 0.42);
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transform = `translateY(${damped}px)`;
        });
      } else if (engaged) {
        // rientrato nella zona scrollabile: molla la presa
        engaged = false;
        if (moveEl) moveEl.style.transform = '';
      }
    };

    const onTouchEnd = () => {
      tracking = false;
      cancelAnimationFrame(raf);
      if (!engaged) return;
      engaged = false;
      const el = moveEl;
      if (!el) return;
      el.classList.add('bounce-back');
      el.style.transform = '';
      window.setTimeout(() => el.classList.remove('bounce-back'), 600);
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', clearPressed);
      window.removeEventListener('touchmove', onTouchFollow);
      window.removeEventListener('touchend', clearPressed);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
