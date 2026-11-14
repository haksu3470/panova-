'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Pins the first cell of every row while the table scrolls sideways. */
export const STICKY_FIRST_COLUMN =
  '[&_tr>*:first-child]:sticky [&_tr>*:first-child]:start-0 [&_tr>*:first-child]:z-[1] [&_th:first-child]:bg-slate-50 [&_td:first-child]:bg-white';

/**
 * Horizontal scroll box for a wide table. A soft fade appears on each edge
 * that still has hidden columns, so a narrow screen shows that the table
 * scrolls. Works in RTL (scrollLeft is negative there).
 */
export default function ScrollTable({ children, stickyFirstColumn = false }: { children: ReactNode; stickyFirstColumn?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const update = () => {
      const hidden = el.scrollWidth - el.clientWidth;
      const scrolled = Math.abs(el.scrollLeft);
      setEdges({ start: scrolled > 1, end: hidden - scrolled > 1 });
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => {
      el.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, []);

  const fade = 'pointer-events-none absolute inset-y-0 z-[2] w-8 from-white to-transparent transition-opacity motion-reduce:transition-none';
  return (
    <div className="relative">
      <div ref={box} className={`overflow-x-auto ${stickyFirstColumn ? STICKY_FIRST_COLUMN : ''}`}>
        {children}
      </div>
      {/* with a pinned first column that column marks the start edge; a fade would cover it */}
      {stickyFirstColumn ? null : (
        <span aria-hidden data-edge="start" className={`${fade} start-0 bg-gradient-to-r rtl:bg-gradient-to-l ${edges.start ? 'opacity-100' : 'opacity-0'}`} />
      )}
      <span aria-hidden data-edge="end" className={`${fade} end-0 bg-gradient-to-l rtl:bg-gradient-to-r ${edges.end ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  );
}
