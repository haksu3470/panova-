'use client';

import { useSyncExternalStore } from 'react';
import { PRINT_CONTACT_LINE } from './printLetterhead';

/**
 * Phones and tablets get "Download / share PDF" instead of Print: a real A4
 * PDF built in the browser (html2canvas-pro draws the sheet, jsPDF pages it),
 * then the share sheet, or a download where sharing files is not offered.
 * Both libraries load only when the button is pressed. Every page carries the
 * contact line and "page / pages" (same as the printed footer). Pages are
 * images, so all five languages (Cyrillic, Arabic) look as on screen.
 */

const TOUCH_QUERY = '(hover: none) and (pointer: coarse)';

export function prefersPdfShare(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(TOUCH_QUERY).matches;
}

/** true on touch devices; false during server render (Print label first, then swapped). */
export function usePdfShareMode(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(TOUCH_QUERY);
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    },
    prefersPdfShare,
    () => false,
  );
}

// A4 in mm, the content box, and the CSS width it is laid out at (1 CSS px = 25.4/96 mm).
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_X = 12;
const MARGIN_TOP = 12;
const CONTENT_W = PAGE_W - 2 * MARGIN_X;
const CONTENT_H = PAGE_H - MARGIN_TOP - 16;
export const PDF_CONTENT_PX = Math.round((CONTENT_W * 96) / 25.4);

/**
 * Where to cut each page, in CSS px from the top: the lowest element bottom
 * (a table row, a paragraph, a block) that fits, so rows are not cut in half.
 * Falls back to a hard cut when nothing fits in the lower half of the page.
 */
export function pageBreaks(totalHeight: number, pageHeight: number, safeBottoms: readonly number[]): number[] {
  const bottoms = [...new Set(safeBottoms.map((b) => Math.round(b)))].sort((a, b) => a - b);
  const cuts: number[] = [];
  let start = 0;
  while (totalHeight - start > pageHeight) {
    const limit = start + pageHeight;
    let cut = limit;
    for (const b of bottoms) {
      if (b > limit) break;
      if (b > start + pageHeight / 2) cut = b;
    }
    cuts.push(cut);
    start = cut;
  }
  return cuts;
}

/** Draws `el` (already laid out at PDF_CONTENT_PX wide) into a multi-page A4 PDF. */
export async function elementToPdf(el: HTMLElement, title: string): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas-pro'), import('jspdf')]);
  const width = el.scrollWidth || PDF_CONTENT_PX;
  const height = el.scrollHeight;
  // shortcut: one canvas for the whole sheet, scale lowered for very long lists (iOS canvas limit ~16 MP); split per page if lists get much longer.
  const scale = Math.max(0.75, Math.min(2, Math.sqrt(15_000_000 / Math.max(1, width * height))));
  const canvas = await html2canvas(el, { scale, backgroundColor: '#ffffff', useCORS: true, logging: false, width, windowWidth: width });
  const top = el.getBoundingClientRect().top;
  const safe = Array.from(el.querySelectorAll('tr, p, li, h1, h2, dl > div, header, footer, section, table, .pl-sign'))
    .map((node) => node.getBoundingClientRect().bottom - top);
  const mmPerPx = CONTENT_W / width;
  const pageHeightPx = CONTENT_H / mmPerPx;
  const cuts = [...pageBreaks(height, pageHeightPx, safe), height];

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  pdf.setProperties({ title, creator: 'Panova Group' });
  let start = 0;
  cuts.forEach((end, index) => {
    if (index > 0) pdf.addPage();
    const slice = document.createElement('canvas');
    slice.width = canvas.width;
    slice.height = Math.max(1, Math.round((end - start) * scale));
    const ctx = slice.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, Math.round(start * scale), canvas.width, slice.height, 0, 0, slice.width, slice.height);
    }
    pdf.addImage(slice.toDataURL('image/jpeg', 0.9), 'JPEG', MARGIN_X, MARGIN_TOP, CONTENT_W, (end - start) * mmPerPx);
    // ASCII-only footer, so the built-in PDF font covers it in every language.
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text(PRINT_CONTACT_LINE, MARGIN_X, PAGE_H - 7);
    pdf.text(`${index + 1} / ${cuts.length}`, PAGE_W - MARGIN_X, PAGE_H - 7, { align: 'right' });
    start = end;
  });
  return pdf.output('blob');
}

/** Share sheet with the file where the device offers it, otherwise a download. */
export async function sharePdf(blob: Blob, filename: string, title: string): Promise<void> {
  const name = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  const file = new File([blob], name, { type: 'application/pdf' });
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return;
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') return; // closed by the person
      // NotAllowedError (the tap is too long ago after building the PDF): fall back to a download.
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** A sheet already in this page (e.g. the candidate's print-only section): copied off screen, drawn, removed. */
export async function sheetToPdf(sheet: HTMLElement, filename: string, title: string): Promise<void> {
  const holder = document.createElement('div');
  holder.style.cssText = `position:fixed;left:-10000px;top:0;width:${PDF_CONTENT_PX}px;background:#fff;`;
  const copy = sheet.cloneNode(true) as HTMLElement;
  copy.classList.remove('hidden');
  copy.style.display = 'block';
  holder.appendChild(copy);
  document.body.appendChild(holder);
  try {
    await waitForImages(copy);
    await sharePdf(await elementToPdf(copy, title), filename, title);
  } finally {
    holder.remove();
  }
}

/** A whole print document (lib/exportLists.ts toPrintHtml): laid out in a hidden frame, drawn, removed. */
export async function htmlToPdf(html: string, filename: string, title: string): Promise<void> {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = `position:fixed;left:-10000px;top:0;width:${PDF_CONTENT_PX}px;height:1000px;border:0;`;
  document.body.appendChild(frame);
  try {
    const doc = frame.contentDocument;
    if (!doc) throw new Error('no frame document');
    doc.open();
    doc.write(html);
    doc.close();
    // The print document's screen padding is not wanted: the PDF has its own margins.
    const style = doc.createElement('style');
    style.textContent = 'body{margin:0!important;padding:0!important}.pl-head,h1{margin-top:0!important}';
    doc.head.appendChild(style);
    await waitForImages(doc.body);
    await sharePdf(await elementToPdf(doc.body, title), filename, title);
  } finally {
    frame.remove();
  }
}

function waitForImages(root: HTMLElement): Promise<void> {
  const pending = Array.from(root.querySelectorAll('img')).filter((img) => !img.complete);
  if (!pending.length) return Promise.resolve();
  return new Promise((resolve) => {
    let left = pending.length;
    const one = () => { left -= 1; if (left <= 0) resolve(); };
    for (const img of pending) {
      img.addEventListener('load', one, { once: true });
      img.addEventListener('error', one, { once: true });
    }
    setTimeout(resolve, 2000);
  });
}
