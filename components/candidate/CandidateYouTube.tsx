import { candidateYouTubeEntries, youtubeEmbedUrl, type CandidateVideoFields } from '@/lib/youtube';

export type CandidateYouTubeLabels = {
  title: string;
  empty: string;
  watch: string;
  open: string;
};

type Props = {
  videos: CandidateVideoFields | null | undefined;
  labels: CandidateYouTubeLabels;
  compact?: boolean;
  showTitle?: boolean;
};

export default function CandidateYouTube({ videos, labels, compact = false, showTitle = true }: Props) {
  const entries = candidateYouTubeEntries(videos);

  return (
    <section className="space-y-3" aria-label={labels.title}>
      {showTitle && <h4 className="text-xs font-extrabold uppercase text-emerald-800">📹 {labels.title}</h4>}
      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-4 text-xs font-medium text-muted-foreground" role="status">
          {labels.empty}
        </p>
      ) : (
        <div className={`grid grid-cols-1 gap-3 ${compact ? '' : 'sm:grid-cols-2'}`}>
          {entries.map((entry, index) => {
            if (entry.kind === 'embed') {
              return (
                <figure key={entry.id} className="space-y-2">
                  <div className="aspect-video overflow-hidden rounded-xl border bg-black">
                    <iframe
                      src={youtubeEmbedUrl(entry.id)}
                      title={`${labels.title} ${index + 1}`}
                      className="h-full w-full"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  </div>
                  <a
                    href={entry.watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex text-xs font-bold text-brand underline"
                  >
                    {labels.watch}
                  </a>
                </figure>
              );
            }

            return (
              <p key={entry.href}>
                <a
                  href={entry.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex break-all text-xs font-bold text-brand underline"
                >
                  {labels.open}
                </a>
              </p>
            );
          })}
        </div>
      )}
    </section>
  );
}
