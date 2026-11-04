import ResetPasswordScreen from '@/components/auth/ResetPasswordScreen';
import { parseResetAudience } from '@/lib/passwordReset';

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ audience?: string[] }>;
}) {
  const { audience } = await params;
  return <ResetPasswordScreen audience={parseResetAudience(audience?.[0])} />;
}
