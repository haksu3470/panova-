'use client';

import CandidateYouTube, { type CandidateYouTubeLabels } from '@/components/candidate/CandidateYouTube';
import { YOUTUBE_URL_PLACEHOLDER, parseYouTubeVideoId } from '@/lib/youtube';

export type YouTubeSlot = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
};

type Props = {
  slots: YouTubeSlot[];
  canEdit: boolean;
  /** Channel check result by slot id (set by the page before saving). */
  errors?: Record<string, string>;
  labels: CandidateYouTubeLabels & {
    field: string;
    clear: string;
    invalid: string;
    supervisorNote: string;
    readOnly: string;
  };
  preview: {
    video_url?: string | null;
    video_url_1?: string | null;
    video_url_2?: string | null;
    video_url_3?: string | null;
  };
};

export default function CandidateYouTubeEditor({ slots, canEdit, errors = {}, labels, preview }: Props) {
  if (!canEdit) {
    return (
      <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <CandidateYouTube videos={preview} labels={labels} />
        <p className="text-[11px] font-medium text-muted-foreground">{labels.readOnly}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="space-y-1">
        <h4 className="text-[11px] font-extrabold uppercase text-emerald-800">📹 {labels.title}</h4>
        <p className="text-[11px] font-medium text-muted-foreground">{labels.supervisorNote}</p>
        <p className="text-[11px] font-bold text-slate-700">{labels.field}</p>
      </div>
      {slots.map((slot) => {
        const trimmed = slot.value.trim();
        const invalid = trimmed.length > 0 && !parseYouTubeVideoId(trimmed);
        const message = invalid ? labels.invalid : errors[slot.id] || '';
        const describedBy = message ? `${slot.id}-error` : undefined;
        return (
          <div key={slot.id} className="space-y-1">
            <label htmlFor={slot.id} className="block text-[11px] font-bold text-slate-700">
              {slot.label}
            </label>
            <div className="flex gap-1.5">
              <input
                id={slot.id}
                type="url"
                inputMode="url"
                value={slot.value}
                onChange={(event) => slot.onChange(event.target.value)}
                placeholder={YOUTUBE_URL_PLACEHOLDER}
                aria-invalid={Boolean(message)}
                aria-describedby={describedBy}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 outline-none"
              />
              <button
                type="button"
                onClick={() => slot.onChange('')}
                disabled={!slot.value}
                aria-label={`${labels.clear}: ${slot.label}`}
                className="shrink-0 cursor-pointer rounded-lg bg-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-800 disabled:cursor-not-allowed disabled:bg-disabled disabled:text-on-dark disabled:opacity-100"
              >
                {labels.clear}
              </button>
            </div>
            {message && (
              <p id={`${slot.id}-error`} role="alert" className="text-[11px] font-medium text-red-700">
                {message}
              </p>
            )}
          </div>
        );
      })}
      <CandidateYouTube videos={preview} labels={labels} showTitle={false} />
    </div>
  );
}
