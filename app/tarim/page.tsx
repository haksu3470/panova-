import type { Metadata } from 'next';
import TarimView from '@/components/tarim/TarimView';
import { tarimCopy } from '@/lib/tarim-copy';

const { metaTitle: title, metaDesc: description } = tarimCopy.tr;

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title: `${title} | Panova Group`, description, images: ['/tarim/kapak-kavun-tarlasi.jpg'] },
  twitter: { card: 'summary_large_image', title: `${title} | Panova Group`, description, images: ['/tarim/kapak-kavun-tarlasi.jpg'] },
};

export default function TarimPage() {
  return <TarimView />;
}
