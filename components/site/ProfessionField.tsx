'use client';

import { useRef, useState } from 'react';
import { translations, type Language } from '@/lib/dictionary';
import {
  OTHER_PROFESSION,
  professionByKey,
  professionInSector,
  professionsForSector,
} from '@/lib/professions';

type Props = {
  id?: string;
  lang: Language;
  sector: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
};

function viewFor(value: string, sector: string) {
  const trimmed = value.trim();
  if (professionInSector(trimmed, sector)) return { other: false, custom: '' };
  if (trimmed && !professionByKey(trimmed)) return { other: true, custom: value };
  return { other: false, custom: '' };
}

/** Sector-filtered profession select. Other keeps a free-text value out of the catalog. */
export function ProfessionField({ id, lang, sector, value, onChange, required = false, className }: Props) {
  const copy = translations[lang];
  const initial = viewFor(value, sector);
  const intended = useRef(value);
  const [otherOpen, setOtherOpen] = useState(initial.other);
  const [custom, setCustom] = useState(initial.custom);

  if (value !== intended.current) {
    intended.current = value;
    const next = viewFor(value, sector);
    setOtherOpen(next.other);
    setCustom(next.custom);
  }

  const commit = (next: string) => {
    intended.current = next;
    onChange(next);
  };

  const selected = otherOpen
    ? OTHER_PROFESSION
    : (professionInSector(value, sector) ? professionByKey(value)!.key : '');

  return (
    <div className="space-y-2">
      <select
        id={id}
        required={required}
        value={selected}
        onChange={(event) => {
          const next = event.target.value;
          if (next === OTHER_PROFESSION) {
            setOtherOpen(true);
            commit(custom.trim());
            return;
          }
          setOtherOpen(false);
          setCustom('');
          commit(next);
        }}
        className={className}
      >
        <option value="">{copy.professionSelect}</option>
        {professionsForSector(sector).map((item) => (
          <option key={item.key} value={item.key}>{item.labels[lang]}</option>
        ))}
        <option value={OTHER_PROFESSION}>{copy.professionOther}</option>
      </select>
      {otherOpen ? (
        <input
          id={id ? `${id}-other` : undefined}
          type="text"
          required={required}
          value={custom}
          aria-label={copy.professionSpecify}
          placeholder={copy.professionSpecify}
          onChange={(event) => {
            setCustom(event.target.value);
            commit(event.target.value.trim());
          }}
          className={className}
        />
      ) : null}
    </div>
  );
}
