import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brand } from '@/components/brand';
import { Button, Txt } from '@/components/ui';
import { useSession } from '@/state/session';
import { color, radius } from '@/theme/tokens';

const SLIDES = [
  { img: require('@/assets/images/brand/car1.jpg'), k: 'ob1K', ti: 'ob1T', s: 'ob1S' },
  { img: require('@/assets/images/brand/car3.jpg'), k: 'ob2K', ti: 'ob2T', s: 'ob2S' },
  { img: require('@/assets/images/brand/entry.jpg'), k: 'ob3K', ti: 'ob3T', s: 'ob3S' },
] as const;

export default function Onboarding() {
  const { t } = useSession();
  const insets = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  const toSignup = () => router.replace({ pathname: '/auth/phone', params: { flow: 'signup' } });
  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <StatusBar style="light" />
      <View style={{ flex: 1, minHeight: 340 }}>
        <Image source={slide.img} style={{ position: 'absolute', inset: 0 } as never} contentFit="cover" transition={300} />
        <LinearGradient colors={['rgba(14,27,46,.5)', 'rgba(14,27,46,0)']} locations={[0, 0.3]} style={{ position: 'absolute', inset: 0 } as never} />
        <View style={{ position: 'absolute', top: insets.top + 10, left: 20, right: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Brand size={19} />
          <Pressable accessibilityRole="button" onPress={toSignup} style={{ height: 36, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: 'rgba(14,27,46,.5)', borderRadius: radius.button }}>
            <Txt size={14} w={700} c={color.white}>
              {t.skip}
            </Txt>
          </Pressable>
        </View>
      </View>
      <View style={{ marginTop: -28, backgroundColor: color.bg, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingHorizontal: 24, paddingTop: 26, paddingBottom: insets.bottom + 30, alignItems: 'center', gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {SLIDES.map((_, j) => (
            <Pressable key={j} accessibilityLabel={`${j + 1} / ${SLIDES.length}`} onPress={() => setI(j)} style={{ width: j === i ? 26 : 8, height: 8, borderRadius: 4, backgroundColor: j === i ? color.orange : '#C9D0DA' }} />
          ))}
        </View>
        <Txt size={12} w={800} c={color.orangeText} ls={0.12} upper style={{ marginTop: 6 }}>
          {t[slide.k]}
        </Txt>
        <Txt size={29} w={800} lh={1.1} ls={-0.02} center>
          {t[slide.ti]}
        </Txt>
        <Txt size={15} c={color.body} lh={1.5} center style={{ maxWidth: 320, minHeight: 68 }}>
          {t[slide.s]}
        </Txt>
        <Button label={i === 2 ? t.createAcc : t.next} onPress={() => (i < 2 ? setI(i + 1) : toSignup())} center height={56} size={16} block style={{ borderRadius: 14, marginTop: 8 }} />
      </View>
    </View>
  );
}
