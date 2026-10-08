import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Languages } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Txt } from '@/components/ui';
import { Brand, LangSwitch } from '@/components/brand';
import { useSession } from '@/state/session';
import { color } from '@/theme/tokens';

// Full-bleed Mount Cameroon, touristic "Travel Cameroon in style".
export default function Welcome() {
  const { t } = useSession();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <StatusBar style="light" />
      <Image source={require('@/assets/images/brand/mount-cameroon.jpg')} style={{ position: 'absolute', inset: 0 } as never} contentFit="cover" />
      <LinearGradient
        colors={['rgba(14,27,46,.55)', 'rgba(14,27,46,0)', 'rgba(14,27,46,.15)', 'rgba(14,27,46,.92)', color.night]}
        locations={[0, 0.28, 0.48, 0.76, 1]}
        style={{ position: 'absolute', inset: 0 } as never}
      />
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Brand size={21} />
        <LangSwitch />
      </View>
      <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 26, paddingBottom: 22 }}>
        <Txt size={12.5} w={800} c={color.peach} ls={0.14} upper center style={{ marginBottom: 14 }}>
          {t.tag1} {t.tag2} {t.tag3}
        </Txt>
        <Txt size={40} w={800} c={color.white} lh={1.04} ls={-0.03} center>
          {t.wTitle}
        </Txt>
        <Txt size={15.5} c="rgba(255,255,255,.88)" lh={1.5} center style={{ marginTop: 14, maxWidth: 320 }}>
          {t.wSub}
        </Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 }}>
          <Languages size={14} color="rgba(255,255,255,.75)" />
          <Txt size={12} c="rgba(255,255,255,.75)">
            {t.detected}
          </Txt>
        </View>
      </View>
      <View style={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: insets.bottom + 30, gap: 14, alignItems: 'center' }}>
        <Button label={t.getStarted} onPress={() => router.push('/onboarding')} center height={56} size={16} block style={{ borderRadius: 14 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Txt size={14.5} c="rgba(255,255,255,.85)">
            {t.haveAcc}{' '}
          </Txt>
          <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/auth/phone', params: { flow: 'signin' } })} style={{ padding: 4 }}>
            <Txt size={14.5} w={800} c={color.peach}>
              {t.signInLink}
            </Txt>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
