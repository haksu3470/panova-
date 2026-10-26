export default function DemoBadge({ show }: { show?: boolean | null }) {
  if (!show) return null;
  return (
    <span
      title="Demo kayıt — canlıya geçişte wipe_demo_data() ile silinir"
      className="ml-1.5 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-amber-800 ring-1 ring-amber-300"
    >
      Demo
    </span>
  );
}
