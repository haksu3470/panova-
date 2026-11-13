import type { Metadata } from 'next';
import GuidesPrintScreen from '@/components/guides/GuidesPrintScreen';

export const metadata: Metadata = {
  title: 'Guides (print)',
  robots: { index: false },
};

export default function GuidesPrintPage() {
  return <GuidesPrintScreen />;
}
