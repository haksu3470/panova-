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
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <label
        htmlFor={id}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-brand ring-offset-2 focus-within:ring-2 focus-within:ring-brand-solid ${disabled ? 'cursor-wait' : 'cursor-pointer hover:bg-emerald-100'}`}
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
        className="min-w-0 flex-1 truncate text-xs text-muted-foreground"
      >
        {fileName || copy.none}
      </span>
    </div>
  );
}
