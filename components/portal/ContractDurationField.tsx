'use client';

import { useId, useState } from 'react';
import {
  DURATION_AMOUNT_MAX,
  DURATION_AMOUNT_MIN,
  canonicalDuration,
  durationChoiceFrom,
  parseContractDuration,
  type DurationUnitChoice,
} from '@/lib/contractDuration';

type Copy = {
  durationAmountLabel?: string;
  durationUnitLabel?: string;
  durationUnitPlaceholder?: string;
  durationUnitDay?: string;
  durationUnitWeek?: string;
  durationUnitMonth?: string;
  durationUnitYear?: string;
  durationOpenEnded?: string;
  durationLegacyNote?: string;
  demandErrDurationNumber?: string;
  demandErrDuration?: string;
};

/**
 * Staff edit of job_requests.contract_type with the same picker as the
 * employer form. A canonical value fills the picker. An older free-text value
 * stays as it is (shown in a note) until a new duration is picked; nothing is
 * changed until the picker holds a complete, valid duration.
 */
export default function ContractDurationField({
  label,
  value,
  t,
  onChange,
}: {
  label: string;
  value: unknown;
  t: Copy;
  /** canonical text when the picker is valid; `valid` false while it is incomplete. */
  onChange: (next: string | null, valid: boolean) => void;
}) {
  const id = useId();
  const stored = typeof value === 'string' ? value.trim() : '';
  const legacy = stored !== '' && !parseContractDuration(stored);
  const initial = durationChoiceFrom(stored);
  const [unit, setUnit] = useState<DurationUnitChoice>(initial.unit);
  const [amount, setAmount] = useState(initial.amountText);
  const [touched, setTouched] = useState(false);

  const update = (nextUnit: DurationUnitChoice, nextAmount: string) => {
    setUnit(nextUnit);
    setAmount(nextAmount);
    setTouched(true);
    if (!nextUnit) {
      // back to "not chosen": keep the stored value as it was
      onChange(stored || null, true);
      return;
    }
    const canonical = canonicalDuration(nextUnit, nextAmount);
    onChange(canonical ?? (stored || null), canonical != null);
  };

  const invalid = touched && !!unit && unit !== 'open' && canonicalDuration(unit, amount) == null;
  const errorId = `${id}-error`;

  return (
    <fieldset className="block text-xs font-bold text-slate-600 space-y-1">
      <legend className="mb-1">{label}</legend>
      <div className="flex gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={DURATION_AMOUNT_MIN}
          max={DURATION_AMOUNT_MAX}
          step={1}
          aria-label={t.durationAmountLabel}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          disabled={unit === 'open'}
          value={unit === 'open' ? '' : amount}
          onChange={(e) => update(unit, e.target.value)}
          className="w-20 min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-900 bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
        />
        <select
          aria-label={t.durationUnitLabel}
          value={unit}
          onChange={(e) => update(e.target.value as DurationUnitChoice, amount)}
          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-900 bg-white"
        >
          <option value="">{t.durationUnitPlaceholder}</option>
          <option value="gün">{t.durationUnitDay}</option>
          <option value="hafta">{t.durationUnitWeek}</option>
          <option value="ay">{t.durationUnitMonth}</option>
          <option value="yıl">{t.durationUnitYear}</option>
          <option value="open">{t.durationOpenEnded}</option>
        </select>
      </div>
      {legacy && !unit ? (
        <span className="block text-[11px] font-semibold text-slate-600">
          {(t.durationLegacyNote || '').split('{text}').join(stored)}
        </span>
      ) : null}
      {invalid ? (
        <span id={errorId} className="block text-[11px] font-bold text-status-bad">{t.demandErrDurationNumber}</span>
      ) : null}
    </fieldset>
  );
}
