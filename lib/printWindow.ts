/**
 * Opens a print window with the given HTML and starts printing.
 *
 * The window is opened WITHOUT the "noopener" feature: with it,
 * window.open() returns null by specification, so nothing could be written
 * into the window (that was why "Print / PDF" did nothing). Instead the link
 * back to this page is cut by hand (opener = null) right after opening.
 * The blank window inherits this page's CSP; the print HTML only uses an
 * inline <style>, which style-src 'unsafe-inline' already allows.
 *
 * Returns false when the browser blocked the window (pop-up blocker).
 */
export type OpenWindow = (url: string, target: string) => Window | null;

export function printHtmlInNewWindow(html: string, open: OpenWindow = (url, target) => window.open(url, target)): boolean {
  const popup = open('', '_blank');
  if (!popup) return false;
  try {
    popup.opener = null;
  } catch {
    // Some browsers make opener read-only; the window still works.
  }
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  popup.print();
  return true;
}
