'use client';

import { useRef } from 'react';
import { EMAIL_OTP_LENGTH, otpDigits } from '@/lib/emailConfirmation';

/**
 * Six-digit email code. A paste or the sixth typed digit is reported once
 * through onComplete. The parent submits it and still offers the manual button.
 */
export function VerificationCodeField({
  id,
  label,
  value,
  onChange,
  onComplete,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
}) {
  const completed = useRef('');

  const commit = (raw: string) => {
    const digits = otpDigits(raw);
    onChange(digits);
    if (digits.length < EMAIL_OTP_LENGTH) {
      completed.current = '';
      return;
    }
    if (disabled || completed.current === digits) return;
    completed.current = digits;
    onComplete?.(digits);
  };

  return (
    <div>
      <label htmlFor={id} className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
        {label}
      </label>
      <input
        id={id}
        name="one-time-code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={EMAIL_OTP_LENGTH}
        required
        disabled={disabled}
        value={value}
        onChange={(event) => commit(event.target.value)}
        onPaste={(event) => {
          const text = event.clipboardData?.getData('text');
          if (!text) return;
          event.preventDefault();
          commit(text);
        }}
        className="mt-1 w-full px-3.5 py-3 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium outline-none text-sm tabular-nums tracking-[0.3em] text-center disabled:bg-disabled disabled:text-on-dark disabled:opacity-100"
      />
    </div>
  );
}
