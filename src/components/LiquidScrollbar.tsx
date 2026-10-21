import { useEffect, useRef } from 'react';

/**
 * Barra di scorrimento liquid glass, al posto di quella di sistema
 * (nascosta con `.scroll-liquid`, o sulla pagina intera con le regole su html).
 * - compare scorrendo o passandoci sopra, poi si ritira da sola
 * - quando diventa scorrevole (apertura di pop-up e tendine, primo caricamento)
 *   si presenta un attimo, così si capisce che si può scorrere
 * - arrivando in cima o in fondo si schiaccia ed elastica come una goccia
 * - tirando oltre il bordo (dito o rotella) si schiaccia mentre si tira e
 *   rimbalza quando si lascia, come la barretta di iOS
 * - si può trascinare, e un clic sulla traccia porta lì
 * Tutto il lavoro per frame è sul DOM via ref: nessun render React mentre si scorre.
 *
 * `target`:
 * - ref dell'elemento che scorre: la barra va in un contenitore `relative`
 *   con overflow nascosto, fratello di quell'elemento
 * - 'pagina': la pagina intera, barra fissa sul bordo destro dello schermo
 */
export function LiquidScrollbar({ target }: { target: React.RefObject<HTMLElement | null> | 'pagina' }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const pagina = target === 'pagina';

  useEffect(() => {
    const el = target === 'pagina' ? document.documentElement : target.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    const glass = glassRef.current;
    if (!el || !track || !thumb || !glass) return;
    // la pagina emette scroll su window, un elemento su se stesso
    const sorgente: HTMLElement | Window = target === 'pagina' ? window : el;
    const calma = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    const MIN_THUMB = 36;
    let raf = 0;
    let hideTimer = 0;
    let introTimer = 0;
    let releaseTimer = 0;
    let thumbH = 0;
    let corsa = 0; // spazio in cui il cursore può muoversi
    let edge: 'top' | 'bottom' | null = 'top';
    let spento = true; // non scorrevole (o nascosto): al prossimo "acceso" parte la presentazione
    let hovering = false;
    let drag: { y: number; scroll: number } | null = null;
    let lastBump = 0;
    let ancora: number | null = null; // ultima posizione del dito dentro la zona scorrevole
    let tiro: { dove: 'top' | 'bottom'; px: number } | null = null; // goccia tirata oltre il bordo

    const maxScroll = () => el.scrollHeight - el.clientHeight;

    const intro = () => {
      clearTimeout(introTimer);
      introTimer = window.setTimeout(() => {
        if (track.classList.contains('is-off')) return;
        glass.classList.add('is-intro');
        track.classList.add('is-visible');
        hideLater(1500);
      }, 320);
    };

    const layout = () => {
      const max = maxScroll();
      const scorrevole = max > 1 && el.clientHeight > 0;
      track.classList.toggle('is-off', !scorrevole);
      if (!scorrevole) {
        spento = true;
        return;
      }
      if (spento) {
        spento = false;
        intro();
      }
      const trackH = track.clientHeight;
      thumbH = Math.max(MIN_THUMB, Math.round((trackH * el.clientHeight) / el.scrollHeight));
      corsa = Math.max(0, trackH - thumbH);
      const p = Math.min(1, Math.max(0, el.scrollTop / max));
      thumb.style.height = `${thumbH}px`;
      thumb.style.transform = `translate3d(0, ${Math.round(corsa * p)}px, 0)`;
    };

    const scheduleLayout = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(layout);
    };

    const hideLater = (ms = 1100) => {
      clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => {
        if (!hovering && !drag && !tiro) track.classList.remove('is-visible');
      }, ms);
    };

    const show = () => {
      track.classList.add('is-visible');
      hideLater();
    };

    // Rimbalzo ai bordi: riavvia l'animazione anche se è già in corso
    const bump = (dove: 'top' | 'bottom') => {
      lastBump = performance.now();
      glass.classList.remove('hit-top', 'hit-bottom');
      void glass.offsetWidth;
      glass.classList.add(dove === 'top' ? 'hit-top' : 'hit-bottom');
    };

    // Sulla pagina: non reagire a ciò che succede in pop-up e tendine
    const altrove = (t: EventTarget | null) =>
      target === 'pagina' &&
      (document.body.style.overflow === 'hidden' ||
        (t instanceof Element && !!t.closest('.scroll-liquid, [popover]')));

    const onScroll = () => {
      scheduleLayout();
      show();
      const max = maxScroll();
      const ora = el.scrollTop <= 0 ? 'top' : el.scrollTop >= max - 1 ? 'bottom' : null;
      if (ora && ora !== edge && !tiro) bump(ora);
      edge = ora;
    };

    // Rotella contro un bordo già raggiunto: la goccia "spinge" e rimbalza
    const onWheel = (e: Event) => {
      const w = e as WheelEvent;
      if (performance.now() - lastBump < 450 || altrove(w.target)) return;
      const max = maxScroll();
      if (max <= 1) return;
      if (w.deltaY < 0 && el.scrollTop <= 0) {
        show();
        bump('top');
      } else if (w.deltaY > 0 && el.scrollTop >= max - 1) {
        show();
        bump('bottom');
      }
    };

    // ---- Tirare oltre il bordo col dito: la goccia si schiaccia seguendo il dito ----
    const schiaccia = (dove: 'top' | 'bottom', px: number) => {
      if (!tiro) glass.classList.remove('hit-top', 'hit-bottom', 'is-intro');
      tiro = { dove, px };
      track.classList.add('is-visible');
      clearTimeout(hideTimer);
      clearTimeout(releaseTimer);
      if (calma) return;
      const s = px / (px + 160); // cresce in fretta, poi si fa duro come una molla
      glass.style.transition = 'none';
      glass.style.transformOrigin = dove === 'top' ? '50% 0' : '50% 100%';
      glass.style.transform = `scale(${1 + 0.6 * s}, ${1 - 0.5 * s})`;
    };

    const molla = () => {
      if (!tiro) return;
      const forte = tiro.px > 12;
      tiro = null;
      glass.style.transition = 'transform 0.6s cubic-bezier(0.3, 1.6, 0.4, 1)';
      glass.style.transform = '';
      if (forte) {
        lastBump = performance.now();
        glass.classList.remove('is-glow');
        void glass.offsetWidth;
        glass.classList.add('is-glow');
      }
      releaseTimer = window.setTimeout(() => {
        glass.style.transition = '';
        glass.style.transformOrigin = '';
      }, 650);
      hideLater();
    };

    const onTouchStart = (e: Event) => {
      const t = e as TouchEvent;
      ancora = t.touches.length === 1 && !altrove(t.target) ? t.touches[0].clientY : null;
    };

    const onTouchMove = (e: Event) => {
      const t = e as TouchEvent;
      if (ancora === null || t.touches.length !== 1) return;
      const y = t.touches[0].clientY;
      const max = maxScroll();
      if (max <= 1) return;
      if (el.scrollTop <= 0 && y > ancora) schiaccia('top', y - ancora);
      else if (el.scrollTop >= max - 1 && y < ancora) schiaccia('bottom', ancora - y);
      else {
        // si scorre normalmente: l'ancora segue il dito
        ancora = y;
        molla();
      }
    };

    const onTouchEnd = () => {
      ancora = null;
      molla();
    };

    const onEnter = () => {
      hovering = true;
      track.classList.add('is-visible');
      clearTimeout(hideTimer);
    };

    const onLeave = () => {
      hovering = false;
      hideLater(700);
    };

    const onThumbDown = (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      drag = { y: e.clientY, scroll: el.scrollTop };
      thumb.setPointerCapture(e.pointerId);
      track.classList.add('is-dragging', 'is-visible');
      clearTimeout(hideTimer);
    };

    const onThumbMove = (e: PointerEvent) => {
      if (!drag || corsa <= 0) return;
      el.scrollTop = drag.scroll + ((e.clientY - drag.y) * maxScroll()) / corsa;
    };

    const onThumbUp = (e: PointerEvent) => {
      if (!drag) return;
      drag = null;
      if (thumb.hasPointerCapture(e.pointerId)) thumb.releasePointerCapture(e.pointerId);
      track.classList.remove('is-dragging');
      hideLater();
    };

    // Clic sulla traccia: il cursore si centra sul punto toccato
    const onTrackDown = (e: PointerEvent) => {
      if (e.target !== track || corsa <= 0) return;
      const r = track.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (e.clientY - r.top - thumbH / 2) / corsa));
      el.scrollTo({ top: p * maxScroll(), behavior: 'smooth' });
    };

    const onAnimEnd = (e: AnimationEvent) => {
      if (e.animationName === 'lsb-intro') glass.classList.remove('is-intro');
      if (e.animationName === 'lsb-glow') glass.classList.remove('is-glow');
    };

    // Il contenuto cambia altezza (sezioni che si aprono, schede, dati caricati)
    const ro = new ResizeObserver(scheduleLayout);
    if (target === 'pagina') ro.observe(document.body);
    else {
      ro.observe(el);
      Array.from(el.children).forEach((c) => ro.observe(c));
    }

    layout();

    sorgente.addEventListener('scroll', onScroll, { passive: true });
    sorgente.addEventListener('wheel', onWheel, { passive: true });
    sorgente.addEventListener('touchstart', onTouchStart, { passive: true });
    sorgente.addEventListener('touchmove', onTouchMove, { passive: true });
    sorgente.addEventListener('touchend', onTouchEnd);
    sorgente.addEventListener('touchcancel', onTouchEnd);
    window.addEventListener('resize', scheduleLayout);
    track.addEventListener('pointerenter', onEnter);
    track.addEventListener('pointerleave', onLeave);
    track.addEventListener('pointerdown', onTrackDown);
    thumb.addEventListener('pointerdown', onThumbDown);
    thumb.addEventListener('pointermove', onThumbMove);
    thumb.addEventListener('pointerup', onThumbUp);
    thumb.addEventListener('pointercancel', onThumbUp);
    glass.addEventListener('animationend', onAnimEnd);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(hideTimer);
      clearTimeout(introTimer);
      clearTimeout(releaseTimer);
      sorgente.removeEventListener('scroll', onScroll);
      sorgente.removeEventListener('wheel', onWheel);
      sorgente.removeEventListener('touchstart', onTouchStart);
      sorgente.removeEventListener('touchmove', onTouchMove);
      sorgente.removeEventListener('touchend', onTouchEnd);
      sorgente.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('resize', scheduleLayout);
      track.removeEventListener('pointerenter', onEnter);
      track.removeEventListener('pointerleave', onLeave);
      track.removeEventListener('pointerdown', onTrackDown);
      thumb.removeEventListener('pointerdown', onThumbDown);
      thumb.removeEventListener('pointermove', onThumbMove);
      thumb.removeEventListener('pointerup', onThumbUp);
      thumb.removeEventListener('pointercancel', onThumbUp);
      glass.removeEventListener('animationend', onAnimEnd);
    };
  }, [target]);

  return (
    <div ref={trackRef} className={`lsb-track is-off${pagina ? ' lsb-pagina' : ''}`} aria-hidden="true">
      <div ref={thumbRef} className="lsb-thumb">
        <div ref={glassRef} className="lsb-glass" />
      </div>
    </div>
  );
}
