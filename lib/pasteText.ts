export type PasteTextOptions = {
  read?: (() => Promise<string>) | null;
};

export type PasteTextResult =
  | { ok: true; value: string }
  | { ok: false; reason: 'empty' | 'unavailable' };

/** Read the clipboard. A missing API or a denied permission is a soft failure so the field can still be pasted into. */
export async function readClipboardText(options: PasteTextOptions = {}): Promise<PasteTextResult> {
  const read = options.read === undefined ? clipboardReader() : options.read;
  if (!read) return { ok: false, reason: 'unavailable' };
  try {
    const value = await read();
    if (!value || !value.trim()) return { ok: false, reason: 'empty' };
    return { ok: true, value };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

function clipboardReader(): (() => Promise<string>) | null {
  if (typeof navigator === 'undefined') return null;
  const readText = navigator.clipboard?.readText;
  if (typeof readText !== 'function') return null;
  return () => readText.call(navigator.clipboard);
}
