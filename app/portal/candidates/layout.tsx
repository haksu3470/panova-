import StaffGate from '@/components/portal/StaffGate';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <StaffGate>{children}</StaffGate>;
}
