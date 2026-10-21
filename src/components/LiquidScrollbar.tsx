import { useEffect, useRef } from 'react';

/**
 * Barra di scorrimento liquid glass sovrapposta a un pannello scorrevole.
 * La barra di sistema (quadrata, e sui pannelli arrotondati esce dagli angoli)
 * viene nascosta con `.scroll-liquid`; questa resta dentro i bordi del pannello.
 * - compare scorrendo o passandoci sopra, poi si ritira da sola
 * - all'apertura si presenta un attimo, così si capisce che si può scorrere
 * - in cima e in fondo si schiaccia ed elastica come una goccia
 * - si può trascinare, e un clic sulla traccia porta lì
 * Tutto il lavoro per frame è sul DOM via ref: nessun render React mentre si scorre.
 *
 * Va messa dentro un contenitore `relative` con overflow nascosto,
 * fratello dell'elemento che scorre (`target`).
 */
export function LiquidScrollbar({ target }: { target: React.RefObject<HTMLElement | null> }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = target.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    const glass = glassRef.current;
    if (!el || !track || !thumb || !glass) return;

    const MIN_THUMB = 36;
    let raf = 0;
    let hideTimer = 0;
    let introTimer = 0;
    let thumbH = 0;
    let corsa = 0; // spazio in cui il cursore può muoversi
    let edge: 'top' | 'bottom' | null = 'top';
    let hovering = false;
    let drag: { y: number; scroll: number } | null = null;
    let lastBump = 0;

    const layout = () => {
      const max = el.scrollHeight - el.clientHeight;
      const scorrevole = max > 1;
      track.classList.toggle('is-off', !scorrevole);
      if (!scorrevole) return;
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
        if (!hovering && !drag) track.classList.remove('is-visible');
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

    const onScroll = () => {
      scheduleLayout();
      show();
      const max = el.scrollHeight - el.clientHeight;
      const ora = el.scrollTop <= 0 ? 'top' : el.scrollTop >= max - 1 ? 'bottom' : null;
      if (ora && ora !== edge) bump(ora);
      edge = ora;
    };

    // Rotella contro un bordo già raggiunto: la goccia "spinge" e rimbalza
    const onWheel = (e: WheelEvent) => {
      if (performance.now() - lastBump < 450) return;
      const max = el.scrollHeight - el.clientHeight;
      if (max <= 1) return;
      if (e.deltaY < 0 && el.scrollTop <= 0) {
        show();
        bump('top');
      } else if (e.deltaY > 0 && el.scrollTop >= max - 1) {
        show();
        bump('bottom');
      }
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
      const max = el.scrollHeight - el.clientHeight;
      el.scrollTop = drag.scroll + ((e.clientY - drag.y) * max) / corsa;
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
      el.scrollTo({ top: p * (el.scrollHeight - el.clientHeight), behavior: 'smooth' });
    };

    // Il contenuto cambia altezza (sezioni che si aprono, testo che va a capo)
    const ro = new ResizeObserver(scheduleLayout);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));

    layout();
    // Presentazione: compare appena il pannello si è aperto, poi si ritira
    introTimer = window.setTimeout(() => {
      if (track.classList.contains('is-off')) return;
      glass.classList.add('is-intro');
      track.classList.add('is-visible');
      hideLater(1500);
    }, 320);
    const onIntroEnd = (e: AnimationEvent) => {
      if (e.animationName === 'lsb-intro') glass.classList.remove('is-intro');
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: true });
    track.addEventListener('pointerenter', onEnter);
    track.addEventListener('pointerleave', onLeave);
    track.addEventListener('pointerdown', onTrackDown);
    thumb.addEventListener('pointerdown', onThumbDown);
    thumb.addEventListener('pointermove', onThumbMove);
    thumb.addEventListener('pointerup', onThumbUp);
    thumb.addEventListener('pointercancel', onThumbUp);
    glass.addEventListener('animationend', onIntroEnd);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(hideTimer);
      clearTimeout(introTimer);
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('wheel', onWheel);
      track.removeEventListener('pointerenter', onEnter);
      track.removeEventListener('pointerleave', onLeave);
      track.removeEventListener('pointerdown', onTrackDown);
      thumb.removeEventListener('pointerdown', onThumbDown);
      thumb.removeEventListener('pointermove', onThumbMove);
      thumb.removeEventListener('pointerup', onThumbUp);
      thumb.removeEventListener('pointercancel', onThumbUp);
      glass.removeEventListener('animationend', onIntroEnd);
    };
  }, [target]);

  return (
    <div ref={trackRef} className="lsb-track is-off" aria-hidden="true">
      <div ref={thumbRef} className="lsb-thumb">
        <div ref={glassRef} className="lsb-glass" />
      </div>
    </div>
  );
}
