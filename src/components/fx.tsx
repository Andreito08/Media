import { useEffect } from 'react';

/**
 * Effetti stile iOS:
 * 1. Tocco -> l'oggetto premuto si ingrandisce e si retroillumina nel punto esatto del dito.
 * 2. Rimbalzo elastico quando si tira oltre la cima o il fondo (pagina, pop-up, tendine).
 */
export function GlobalFx() {
  useEffect(() => {
    // ---------- 1. spotlight nel punto del tocco ----------
    let pressedEl: HTMLElement | null = null;
    let spotRaf = 0;

    const setSpot = (el: HTMLElement, x: number, y: number) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--spot-x', `${x - r.left}px`);
      el.style.setProperty('--spot-y', `${y - r.top}px`);
    };

    const setSpotThrottled = (el: HTMLElement, x: number, y: number) => {
      cancelAnimationFrame(spotRaf);
      spotRaf = requestAnimationFrame(() => setSpot(el, x, y));
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
      // il dito scivola (mouse/penna): la luce lo segue dentro l'oggetto.
      // Su touch nessun lavoro qui: ci pensa onTouchFollow (throttled).
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      if (pressedEl && e.buttons > 0) {
        setSpotThrottled(pressedEl, e.clientX, e.clientY);
      }
    };

    const onTouchFollow = (e: TouchEvent) => {
      // tocco tenuto premuto: la luce segue il dito finché resta sull'oggetto,
      // si spegne appena il dito esce (es. parte lo scroll)
      if (!pressedEl || e.touches.length !== 1) return;
      const t = e.touches[0];
      const el = pressedEl;
      const x = t.clientX;
      const y = t.clientY;
      cancelAnimationFrame(spotRaf);
      spotRaf = requestAnimationFrame(() => {
        setSpot(el, x, y);
        const under = document.elementFromPoint(x, y);
        if (!under || !el.contains(under)) {
          el.classList.remove('is-pressed');
          if (pressedEl === el) pressedEl = null;
        }
      });
    };

    const clearPressed = () => {
      cancelAnimationFrame(spotRaf);
      if (pressedEl) {
        pressedEl.classList.remove('is-pressed');
        pressedEl = null;
      }
    };

    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', clearPressed);
    // Il browser emette pointercancel quando il tocco diventa uno scroll:
    // il bottone si sgonfia subito invece di restare ingrandito mentre si scorre.
    window.addEventListener('pointercancel', clearPressed);
    window.addEventListener('touchmove', onTouchFollow, { passive: true });
    window.addEventListener('touchend', clearPressed);

    // ---------- 2. rimbalzo elastico ai bordi, come su iPhone / WhatsApp ----------
    // Il contenuto (pagina, pop-up, tendine) segue il dito oltre la cima o il
    // fondo con resistenza crescente, e torna al suo posto con un rimbalzo.
    // Il rimbalzo del browser è spento in CSS (overscroll-behavior: none), così
    // l'effetto è uguale su iPhone, Android e PC e i listener restano passivi:
    // mai preventDefault, lo scorrimento non aspetta mai questo codice.
    const calma = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let tracking = false;
    let engaged = false;
    let anchorY = 0; // ultima posizione del dito dentro la zona scorrevole
    let raf = 0;
    let moveEl: HTMLElement | null = null;
    const lastKick = new WeakMap<HTMLElement, number>(); // ultimo rimbalzo per elemento

    const rootOf = () => document.getElementById('app-root');

    const panelOf = (t: EventTarget | null) =>
      (t as HTMLElement | null)?.closest?.('.modal-scroll, .scelta-scroll') as HTMLElement | null;

    const metrics = (panel: HTMLElement | null) => {
      if (!panel) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        return { top: window.scrollY <= 0, bottom: window.scrollY >= max - 1 };
      }
      const max = panel.scrollHeight - panel.clientHeight;
      return { top: panel.scrollTop <= 0, bottom: panel.scrollTop >= max - 1 };
    };

    const modalOpen = () => document.body.style.overflow === 'hidden';

    // Gomma alla iOS: più si tira, più si fa dura (mai un muro netto)
    const gomma = (dy: number, alto: number) =>
      Math.sign(dy) * (1 - 1 / ((Math.abs(dy) * 0.55) / alto + 1)) * alto;

    const onTouchStart = (e: TouchEvent) => {
      if (calma || e.touches.length !== 1) {
        tracking = false;
        return;
      }
      const panel = panelOf(e.target);
      // modale aperto ma tocco fuori dal pannello: lascia fare al modale
      if (modalOpen() && !panel) {
        tracking = false;
        return;
      }
      tracking = true;
      engaged = false;
      anchorY = e.touches[0].clientY;
      moveEl = panel ?? rootOf();
      moveEl?.classList.remove('bounce-back');
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking || e.touches.length !== 1) return;
      const panel = panelOf(e.target);
      const el = panel ?? rootOf();
      if (!el) return;
      const y = e.touches[0].clientY;
      const m = metrics(panel);
      const oltre = (m.top && y > anchorY) || (m.bottom && y < anchorY);
      if (!oltre) {
        // si scorre normalmente: l'ancora segue il dito, così l'effetto parte
        // anche quando il bordo si raggiunge a metà del trascinamento
        anchorY = y;
        if (engaged) {
          engaged = false;
          cancelAnimationFrame(raf);
          el.style.transform = '';
        }
        return;
      }
      engaged = true;
      moveEl = el;
      const off = gomma(y - anchorY, panel ? panel.clientHeight : window.innerHeight);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translateY(${off}px)`;
      });
    };

    const onTouchEnd = () => {
      tracking = false;
      cancelAnimationFrame(raf);
      if (!engaged) return;
      engaged = false;
      const el = moveEl;
      if (!el) return;
      lastKick.set(el, performance.now());
      el.classList.add('bounce-back');
      el.style.transform = '';
      window.setTimeout(() => el.classList.remove('bounce-back'), 600);
    };

    // Colpetto: il contenuto arriva lanciato al bordo (o la rotella ci spinge
    // contro) e rimbalza da solo, senza dito. Web Animations: non tocca lo
    // style inline usato dal trascinamento.
    const kick = (el: HTMLElement, verso: 1 | -1, forza: number) => {
      const now = performance.now();
      if (now - (lastKick.get(el) ?? 0) < 450 || engaged) return;
      lastKick.set(el, now);
      const d = verso * Math.min(34, Math.max(10, forza));
      el.animate(
        [
          { transform: 'translateY(0)' },
          { transform: `translateY(${d}px)`, offset: 0.3 },
          { transform: 'translateY(0)' },
        ],
        { duration: 520, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' },
      );
    };

    // Arrivo lanciato al bordo: velocità dall'ultimo evento di scroll
    const ultimo = new WeakMap<object, { pos: number; t: number }>();
    const onScrollAny = (e: Event) => {
      if (calma || tracking) return;
      const panel = e.target instanceof HTMLElement && e.target.matches('.modal-scroll, .scelta-scroll') ? e.target : null;
      if (!panel && e.target !== document) return;
      const el = panel ?? rootOf();
      if (!el) return;
      const pos = panel ? panel.scrollTop : window.scrollY;
      const now = performance.now();
      const prima = ultimo.get(el);
      ultimo.set(el, { pos, t: now });
      if (!prima || now - prima.t > 100) return;
      const v = (pos - prima.pos) / Math.max(1, now - prima.t); // px/ms
      const m = metrics(panel);
      if (m.top && v < -0.6) kick(el, 1, -v * 14);
      else if (m.bottom && v > 0.6) kick(el, -1, v * 14);
    };

    // Rotella o trackpad contro un bordo già raggiunto: un rimbalzo per spinta,
    // non uno ogni scatto (scatti e inerzia del trackpad arrivano a raffica)
    let lastWheel = 0;
    const onWheel = (e: WheelEvent) => {
      const now = performance.now();
      const nuovaSpinta = now - lastWheel > 300;
      lastWheel = now;
      if (!nuovaSpinta || calma || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const panel = panelOf(e.target);
      if (modalOpen() && !panel) return;
      const el = panel ?? rootOf();
      if (!el) return;
      const m = metrics(panel);
      const forza = Math.abs(e.deltaY) * (e.deltaMode === 1 ? 16 : 1) * 0.25;
      if (m.top && e.deltaY < 0) kick(el, 1, forza);
      else if (m.bottom && e.deltaY > 0) kick(el, -1, forza);
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
    window.addEventListener('scroll', onScrollAny, { passive: true, capture: true });
    window.addEventListener('wheel', onWheel, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', clearPressed);
      window.removeEventListener('pointercancel', clearPressed);
      window.removeEventListener('touchmove', onTouchFollow);
      window.removeEventListener('touchend', clearPressed);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('scroll', onScrollAny, { capture: true });
      window.removeEventListener('wheel', onWheel);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(spotRaf);
    };
  }, []);

  return null;
}
