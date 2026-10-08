import { Redirect } from 'expo-router';
import { useSession } from '@/state/session';

export default function Index() {
  const { token, me } = useSession();
  if (!token) return <Redirect href="/welcome" />;
  if (me && !me.profileComplete) return <Redirect href="/auth/details" />;
  return <Redirect href="/home" />;
}
