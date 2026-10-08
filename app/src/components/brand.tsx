import { Pressable, View } from 'react-native';
import { useSession } from '@/state/session';
import { color, radius } from '@/theme/tokens';
import { Txt } from './ui';

export function Brand({ size = 21, dark }: { size?: number; dark?: boolean }) {
  return (
    <Txt size={size} w={800} ls={-0.01} c={dark ? color.navy : color.white}>
      Jap<Txt size={size} w={800} c={color.orange}>Express</Txt>
    </Txt>
  );
}

// EN / FR pill on the dark welcome screen.
export function LangSwitch() {
  const { lang, setLang } = useSession();
  return (
    <View style={{ flexDirection: 'row', padding: 3, gap: 2, backgroundColor: 'rgba(14,27,46,.45)', borderWidth: 1, borderColor: 'rgba(255,255,255,.4)', borderRadius: radius.button }}>
      {(['en', 'fr'] as const).map((l) => (
        <Pressable key={l} accessibilityRole="button" accessibilityState={{ selected: lang === l }} onPress={() => setLang(l)} style={{ height: 30, minWidth: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: lang === l ? color.orange : 'transparent' }}>
          <Txt size={13} w={800} c={color.white}>
            {l.toUpperCase()}
          </Txt>
        </Pressable>
      ))}
    </View>
  );
}
