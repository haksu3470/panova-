import type { Metadata } from 'next';
import KvkkView from '@/components/home/KvkkView';

const description = 'Panova Group kişisel verilerin korunması aydınlatma metni. Veri sorumlusu: PANOVA TARIM DOO Struga.';

export const metadata: Metadata = {
  title: 'KVKK Aydınlatma Metni',
  description,
  openGraph: {
    title: 'KVKK Aydınlatma Metni | Panova Group',
    description,
  },
  twitter: {
    card: 'summary',
    title: 'KVKK Aydınlatma Metni | Panova Group',
    description,
  },
};

export default function KvkkPage() {
  return <KvkkView />;
}
