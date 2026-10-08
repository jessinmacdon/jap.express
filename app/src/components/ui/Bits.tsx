import { BadgeCheck } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { color, radius } from '@/theme/tokens';
import { Txt } from './Txt';

// Strong 2px rule between major sections (Modernist).
export const Rule = ({ style }: { style?: StyleProp<ViewStyle> }) => <View style={[{ height: 2, backgroundColor: color.lineStrong }, style]} />;
export const Hair = ({ style }: { style?: StyleProp<ViewStyle> }) => <View style={[{ height: 1, backgroundColor: color.line }, style]} />;

export function Tag({ label, bg = color.orange, fg = color.white, border, size = 11, upper }: { label: string; bg?: string; fg?: string; border?: string; size?: number; upper?: boolean }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.badge, paddingHorizontal: 6, paddingVertical: 2, borderWidth: border ? 1 : 0, borderColor: border, alignSelf: 'flex-start' }}>
      <Txt size={size} w={800} c={fg} upper={upper} ls={upper ? 0.05 : undefined}>
        {label}
      </Txt>
    </View>
  );
}

// "✓ Verified" — prominent on every host and seller card.
export function Verified({ label, variant = 'soft', size = 12 }: { label: string; variant?: 'soft' | 'solid' | 'plain'; size?: number }) {
  const solid = variant === 'solid';
  const plain = variant === 'plain';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: solid ? color.green : plain ? 'transparent' : color.greenSoft, paddingHorizontal: plain ? 0 : 7, paddingVertical: plain ? 0 : 4, borderRadius: radius.badge }}>
      <BadgeCheck size={size + 2} color={solid ? color.white : color.green} strokeWidth={2.2} />
      <Txt size={size} w={solid ? 800 : 700} c={solid ? color.white : color.green}>
        {label}
      </Txt>
    </View>
  );
}

export function SellerTypeTag({ dealer, label, size = 11 }: { dealer: boolean; label: string; size?: number }) {
  return <Tag label={label} bg={dealer ? color.navy : color.white} fg={dealer ? color.white : color.navy} border={color.navy} size={size} />;
}

export function Avatar({ initials, size = 48, bg = color.navy }: { initials: string; size?: number; bg?: string }) {
  return (
    <View style={{ width: size, height: size, borderRadius: radius.input, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Txt size={Math.round(size / 3)} w={800} c={color.white}>
        {initials}
      </Txt>
    </View>
  );
}

export function IconTile({ children, size = 44, bg = color.surface }: { children: ReactNode; size?: number; bg?: string }) {
  return <View style={{ width: size, height: size, borderRadius: radius.input, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>{children}</View>;
}

// Shaded info box (privacy, safety, payout notes).
export function Note({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, backgroundColor: color.surface, padding: 12, borderRadius: radius.input }}>
      {icon}
      <Txt size={13} lh={1.45} style={{ flex: 1 }}>
        {children}
      </Txt>
    </View>
  );
}

export function EmptyState({ icon, title, sub, children }: { icon: ReactNode; title: string; sub: string; children?: ReactNode }) {
  return (
    <View style={{ paddingHorizontal: 24, paddingTop: 40, paddingBottom: 28, gap: 12, alignItems: 'flex-start' }}>
      <IconTile size={60}>{icon}</IconTile>
      <Txt size={21} w={800} lh={1.2}>
        {title}
      </Txt>
      <Txt size={14.5} c={color.body} lh={1.5}>
        {sub}
      </Txt>
      {children ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>{children}</View> : null}
    </View>
  );
}

export function KV({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderColor: color.line }}>
      <Txt size={14} c={color.muted} style={{ width: '44%' }}>
        {k}
      </Txt>
      <Txt size={14} w={bold === false ? 400 : 700} style={{ flex: 1 }}>
        {v}
      </Txt>
    </View>
  );
}
