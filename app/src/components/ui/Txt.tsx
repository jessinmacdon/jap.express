import { Text, type TextProps, type TextStyle } from 'react-native';
import { color, font } from '@/theme/tokens';

type Weight = 400 | 600 | 700 | 800;
const FAMILY: Record<Weight, string> = { 400: font.regular, 600: font.semibold, 700: font.bold, 800: font.heavy };

export interface TxtProps extends TextProps {
  size?: number;
  w?: Weight;
  c?: string;
  lh?: number; // line-height multiplier
  ls?: number; // letter-spacing in em
  upper?: boolean;
  center?: boolean;
}

// Archivo everywhere; weights map to separate font files (no synthetic bold).
export function Txt({ size = 15, w = 400, c = color.ink, lh, ls, upper, center, style, ...rest }: TxtProps) {
  const s: TextStyle = {
    fontFamily: FAMILY[w],
    fontSize: size,
    color: c,
    lineHeight: lh ? Math.round(size * lh) : undefined,
    letterSpacing: ls ? ls * size : undefined,
    textTransform: upper ? 'uppercase' : undefined,
    textAlign: center ? 'center' : undefined,
  };
  return <Text {...rest} style={[s, style]} />;
}

// Small uppercase section label: "ABOUT THIS CAR"
export const Label = (p: TxtProps) => <Txt size={12} w={700} c={color.label} ls={0.08} upper {...p} />;
