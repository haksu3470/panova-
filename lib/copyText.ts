export type CopyTextOptions = {
  write?: ((value: string) => Promise<void>) | null;
  fallback?: (value: string) => boolean;
  timeoutMs?: number;
};

const CLIPBOARD_TIMEOUT_MS = 1000;

/** Copy text, then fall back when the Clipboard API is missing, rejects, or stalls. */
export async function copyText(text: string, options: CopyTextOptions = {}): Promise<boolean> {
  const write = options.write === undefined ? clipboardWriter() : options.write;
  if (write) {
    try {
      await withTimeout(write(text), options.timeoutMs ?? CLIPBOARD_TIMEOUT_MS);
      return true;
    } catch {
      // Permission denied, insecure context, a stall, or a transient clipboard failure.
    }
  }
  try {
    return (options.fallback ?? legacyCopy)(text) === true;
  } catch {
    return false;
  }
}

function withTimeout(work: Promise<void>, ms: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('clipboard timeout')), ms);
    work.then(
      () => {
        clearTimeout(timer);
        resolve();
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function clipboardWriter(): ((value: string) => Promise<void>) | null {
  if (typeof navigator === 'undefined') return null;
  const writeText = navigator.clipboard?.writeText;
  if (typeof writeText !== 'function') return null;
  return (value) => writeText.call(navigator.clipboard, value);
}

function legacyCopy(text: string): boolean {
  if (typeof document === 'undefined' || typeof document.execCommand !== 'function') return false;
  const body = document.body;
  if (!body) return false;

  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.setAttribute('aria-hidden', 'true');
  area.tabIndex = -1;
  area.style.position = 'fixed';
  area.style.top = '0';
  area.style.left = '0';
  area.style.width = '1px';
  area.style.height = '1px';
  area.style.padding = '0';
  area.style.border = 'none';
  area.style.outline = 'none';
  area.style.opacity = '0';
  body.appendChild(area);

  const selection = typeof document.getSelection === 'function' ? document.getSelection() : null;
  const previous = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
  area.focus();
  area.select();
  try {
    area.setSelectionRange(0, text.length);
  } catch {
    // select() already covered engines that reject setSelectionRange.
  }

  let ok = false;
  try {
    ok = document.execCommand('copy');
  } finally {
    body.removeChild(area);
    if (previous && selection) {
      selection.removeAllRanges();
      selection.addRange(previous);
    }
  }
  return ok;
}
