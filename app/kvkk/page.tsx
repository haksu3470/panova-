import type { Metadata } from 'next';
import KvkkView from '@/components/home/KvkkView';

export const metadata: Metadata = {
  title: 'KVKK Aydınlatma Metni | PANOVA TARIM DOO Struga',
  description: 'PANOVA TARIM DOO Struga kişisel verilerin korunması aydınlatma metni.',
};

export default function KvkkPage() {
  return <KvkkView />;
}
