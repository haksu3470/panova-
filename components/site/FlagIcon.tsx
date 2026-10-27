/**
 * Painted flag artwork. Emoji flags are not used: Windows draws them as the
 * same two letters as the short code (TR TR). These SVGs stay a single flag
 * on every platform and are not mirrored in RTL (the Saudi flag must not flip).
 *
 * Artwork: flag-icons (MIT) — see public/flags/LICENSE.txt.
 */

const FLAG_SRC: Record<string, string> = {
  TR: '/flags/tr.svg',
  GB: '/flags/gb.svg',
  MK: '/flags/mk.svg',
  AL: '/flags/al.svg',
  SA: '/flags/sa.svg',
};

export function FlagIcon({ code }: { code: string }) {
  const src = FLAG_SRC[code];
  if (!src) return null;
  return (
    // Static 20×15 flag art. next/image does not optimize SVG without extra config.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={20}
      height={15}
      draggable={false}
      className="h-[15px] w-5 shrink-0 rounded-[2px] object-cover ring-1 ring-inset ring-black/20"
    />
  );
}
