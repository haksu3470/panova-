import type { Metadata } from 'next';
import GuidesScreen from '@/components/guides/GuidesScreen';

export const metadata: Metadata = {
  title: 'Guides',
};

export default function GuidesPage() {
  return <GuidesScreen />;
}
