'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * Home page motion without a library.
 * - Server HTML and reduced-motion visitors get a static page: nothing is
 *   hidden unless this hook adds `home-motion` to the root (app/globals.css).
 * - `.home-reveal` elements fade in once they scroll into view
 *   (`data-visible`, set here; React does not manage that attribute).
 */
export function prefersReducedMotion(): boolean {
  return typeof window === 'undefined'
    || typeof window.matchMedia !== 'function'
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useHomeMotion(rootRef: RefObject<HTMLElement | null>, deps: readonly unknown[]) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return;
    root.classList.add('home-motion');
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).dataset.visible = 'true';
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
    root.querySelectorAll<HTMLElement>('.home-reveal:not([data-visible])').forEach((element) => observer.observe(element));
    return () => observer.disconnect();
    // deps: re-scan after a language or company change re-renders the sections
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * A number that counts up once it is visible ("3", "8+"). Values that are not a
 * plain number ("30/60/90") stay as written. Screen readers read the final
 * value; the moving digits are aria-hidden. The digits are written to the DOM
 * directly, so no state update runs per frame.
 */
export function CountUp({ value }: { value: string }) {
  const digitsRef = useRef<HTMLSpanElement>(null);
  const match = /^(\d+)(\D*)$/.exec(value);
  const target = match ? Number(match[1]) : null;
  const suffix = match ? match[2] : '';

  useEffect(() => {
    const element = digitsRef.current;
    if (!element || target === null || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return;
    let frame = 0;
    element.textContent = `0${suffix}`;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const duration = 900;
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        element.textContent = `${Math.round(target * (1 - (1 - progress) ** 3))}${suffix}`;
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      element.textContent = `${target}${suffix}`;
    };
  }, [target, suffix]);

  if (target === null) return <>{value}</>;
  return (
    <>
      <span ref={digitsRef} aria-hidden="true">{value}</span>
      <span className="sr-only">{value}</span>
    </>
  );
}
