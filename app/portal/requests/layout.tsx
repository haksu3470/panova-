import StaffGate from '@/components/portal/StaffGate';
import StaffRoleGate from '@/components/portal/StaffRoleGate';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <StaffGate><StaffRoleGate route="requestFile">{children}</StaffRoleGate></StaffGate>;
}
