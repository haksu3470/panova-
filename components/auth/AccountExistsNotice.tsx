'use client';

export function AccountExistsNotice({
  message,
  signInLabel,
  resetLabel,
  onSignIn,
  onReset,
}: {
  message: string;
  signInLabel: string;
  resetLabel?: string;
  onSignIn?: () => void;
  onReset?: () => void;
}) {
  return (
    <div className="space-y-3 text-left rtl:text-right" role="alert">
      <p className="text-sm font-semibold text-foreground leading-relaxed">{message}</p>
      {onSignIn ? (
        <button
          type="button"
          onClick={onSignIn}
          className="w-full bg-brand-solid hover:bg-brand text-white font-bold py-3 rounded-xl text-sm cursor-pointer"
        >
          {signInLabel}
        </button>
      ) : null}
      {onReset && resetLabel ? (
        <button
          type="button"
          onClick={onReset}
          className="w-full border border-line bg-card text-foreground font-bold py-3 rounded-xl text-sm cursor-pointer"
        >
          {resetLabel}
        </button>
      ) : null}
    </div>
  );
}
