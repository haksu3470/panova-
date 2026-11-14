'use client';

import { useId, useState, type ChangeEvent } from 'react';
import { Paperclip } from 'lucide-react';
import type { Language } from '@/lib/dictionary';
import { filePickerCopy } from '@/lib/file-picker-copy';

/**
 * File input with our own button and "no file chosen" / file name text in
 * the page language. The real <input type="file"> stays in the page
 * (sr-only, not display:none), so Tab reaches it, Space / Enter opens the
 * dialog and screen readers announce it by the label. A long file name is cut
 * with an ellipsis at the end and the full name is in the tooltip.
 *
 * Layout: the picker takes a whole row of a wrapping parent (basis-full), so
 * buttons placed after it (preview, download) go to the next line instead of
 * pushing it out. A chosen file name keeps at least 6rem next to the button;
 * the "no file chosen" text keeps its full width. Either moves to its own line
 * under the button when it does not fit beside it.
 */
export function FilePicker({
  lang,
  accept,
  onChange,
  disabled = false,
  label,
}: {
  lang: Language;
  accept: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  /** Accessible name of the input (for example the document title). */
  label?: string;
}) {
  const copy = filePickerCopy[lang] ?? filePickerCopy.tr;
  const [fileName, setFileName] = useState('');
  const id = useId();
  const statusId = `${id}-status`;
  return (
    <div className="flex min-w-0 max-w-full flex-1 basis-full flex-wrap items-center gap-x-2 gap-y-1">
      <label
        htmlFor={id}
        className={`inline-flex max-w-full shrink-0 items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-brand ring-offset-2 focus-within:ring-2 focus-within:ring-brand-solid ${disabled ? 'cursor-wait' : 'cursor-pointer hover:bg-emerald-100'}`}
      >
        <Paperclip aria-hidden className="h-3.5 w-3.5" />
        {copy.choose}
        <input
          id={id}
          type="file"
          accept={accept}
          disabled={disabled}
          aria-label={label ? `${label}: ${copy.choose}` : copy.choose}
          aria-describedby={statusId}
          onChange={(event) => {
            setFileName(event.target.files?.[0]?.name ?? '');
            onChange(event);
          }}
          className="sr-only"
        />
      </label>
      <span
        id={statusId}
        title={fileName || undefined}
        dir="auto"
        // "no file chosen" is never cut: it moves under the button when it does not fit beside it;
        // a chosen file name keeps at least 6rem and is cut with an ellipsis (full name in the tooltip)
        className={`max-w-full truncate text-xs text-muted-foreground ${fileName ? 'min-w-[6rem] flex-1 basis-24' : 'shrink-0'}`}
      >
        {fileName || copy.none}
      </span>
    </div>
  );
}
