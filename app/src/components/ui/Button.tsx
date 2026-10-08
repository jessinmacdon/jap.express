import { ArrowRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { color, radius } from '@/theme/tokens';
import { Txt } from './Txt';

type Variant = 'primary' | 'navy' | 'outline' | 'link' | 'white';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  arrow?: boolean; // trailing →, label stays flush left (Modernist rule)
  center?: boolean; // only for full-width CTAs the design centres
  disabled?: boolean;
  loading?: boolean;
  height?: number;
  size?: number;
  icon?: ReactNode; // leading icon
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
  block?: boolean;
  accessibilityLabel?: string;
}

const V: Record<Variant, { bg: string; pressed: string; fg: string; border?: string }> = {
  primary: { bg: color.orange, pressed: color.orangePressed, fg: color.white },
  navy: { bg: color.navy, pressed: color.navyHover, fg: color.white },
  outline: { bg: 'transparent', pressed: color.surface, fg: color.ink, border: color.ink },
  white: { bg: color.white, pressed: color.surface, fg: color.ink, border: color.ink },
  link: { bg: 'transparent', pressed: 'transparent', fg: color.orangeText },
};

export function Button({ label, onPress, variant = 'primary', arrow, center, disabled, loading, height = 52, size = 15, icon, trailing, style, block, accessibilityLabel }: Props) {
  const v = V[variant];
  const isLink = variant === 'link';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        {
          height: isLink ? undefined : height,
          paddingHorizontal: isLink ? 0 : 16,
          paddingVertical: isLink ? 4 : 0,
          borderRadius: radius.button,
          backgroundColor: pressed && !disabled ? v.pressed : v.bg,
          borderWidth: v.border ? (variant === 'outline' ? 2 : 1.5) : 0,
          borderColor: v.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: center ? 'center' : arrow || trailing ? 'space-between' : 'flex-start',
          gap: 10,
          opacity: disabled ? 0.45 : 1,
          alignSelf: block ? 'stretch' : isLink ? 'flex-start' : undefined,
        },
        style,
      ]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
        {icon}
        {loading ? <ActivityIndicator color={v.fg} /> : <Txt size={size} w={800} c={v.fg} numberOfLines={2} style={{ flexShrink: 1 }}>{label}</Txt>}
      </View>
      {trailing ?? (arrow ? <ArrowRight size={20} color={v.fg} strokeWidth={2} /> : null)}
    </Pressable>
  );
}
