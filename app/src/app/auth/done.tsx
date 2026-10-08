import { router, useLocalSearchParams } from 'expo-router';
import { Check } from 'lucide-react-native';
import { View } from 'react-native';
import { Button, Screen, Txt } from '@/components/ui';
import { useSession } from '@/state/session';
import { color, radius } from '@/theme/tokens';

export default function Done() {
  const { t, me } = useSession();
  const { later } = useLocalSearchParams<{ later?: string }>();
  const v = me?.verification;
  const badges: [string, boolean][] = [
    [t.phone, true],
    [t.idDoc, v?.id === 'done'],
    [t.licence, v?.licence === 'done'],
  ];
  return (
    <Screen contentStyle={{ paddingHorizontal: 28, justifyContent: 'center', alignItems: 'center', gap: 14 }}>
      <View style={{ width: 88, height: 88, borderRadius: radius.sheet, backgroundColor: color.green, alignItems: 'center', justifyContent: 'center' }}>
        <Check size={44} color={color.white} strokeWidth={2.6} />
      </View>
      <Txt size={30} w={800} ls={-0.02} center style={{ marginTop: 6 }}>
        {t.doneT}
      </Txt>
      <Txt size={15} c={color.body} lh={1.5} center style={{ maxWidth: 300 }}>
        {later === '1' ? t.doneSLater : t.doneS}
      </Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 4 }}>
        {badges.map(([l, on]) => (
          <View key={l} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.input, backgroundColor: on ? color.greenSoft : color.surface }}>
            <Txt size={13} w={800} c={on ? color.green : color.muted}>
              {on ? '✓ ' : ''}
              {l}
            </Txt>
          </View>
        ))}
      </View>
      <Button label={t.explore} onPress={() => router.replace('/home')} center height={56} size={16} block style={{ borderRadius: 14, marginTop: 22 }} />
    </Screen>
  );
}
