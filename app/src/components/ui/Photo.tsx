import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { color } from '@/theme/tokens';
import { Txt } from './Txt';

// Listing photo, or the prototype's striped stand-in when the host hasn't uploaded one.
export function Photo({ uri, style, radius = 0, caption, children, dark }: { uri?: string | null; style?: StyleProp<ViewStyle>; radius?: number; caption?: string; children?: ReactNode; dark?: boolean }) {
  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden', backgroundColor: '#D6DCE5' }, style]}>
      {uri ? (
        <Image source={{ uri }} style={{ position: 'absolute', inset: 0 } as never} contentFit="cover" transition={150} />
      ) : (
        <>
          <Stripes dark={dark} />
          {caption ? (
            <View style={{ position: 'absolute', left: 6, bottom: 6, backgroundColor: dark ? 'rgba(18,35,63,.7)' : 'rgba(248,249,250,.9)', paddingHorizontal: 5, paddingVertical: 2 }}>
              <Txt size={10} c={dark ? color.white : color.label} style={{ fontFamily: 'monospace' }}>
                photo · {caption}
              </Txt>
            </View>
          ) : null}
        </>
      )}
      {children}
    </View>
  );
}

export function Stripes({ dark }: { dark?: boolean }) {
  const [a, b] = dark ? ['#2C5288', '#33598F'] : ['#D6DCE5', '#DFE4EB'];
  return (
    <Svg style={{ position: 'absolute', top: 0, left: 0 }} width="100%" height="100%">
      <Defs>
        <Pattern id="stripes" patternUnits="userSpaceOnUse" width="24" height="24" patternTransform="rotate(45)">
          <Rect width="12" height="24" fill={a} />
          <Rect x="12" width="12" height="24" fill={b} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#stripes)" />
    </Svg>
  );
}
