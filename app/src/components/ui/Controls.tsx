import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { color, radius } from '@/theme/tokens';
import { Txt } from './Txt';

// Outlined chip; selected = navy fill.
export function Chip({ label, on, onPress, dark, size = 'md' }: { label: string; on?: boolean; onPress?: () => void; dark?: boolean; size?: 'sm' | 'md' }) {
  const bg = dark ? color.ink : on ? color.navy : color.white;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      onPress={onPress}
      style={{ height: size === 'sm' ? 34 : 38, paddingHorizontal: size === 'sm' ? 12 : 14, borderWidth: 1.5, borderColor: dark ? color.ink : color.ink, backgroundColor: bg, borderRadius: radius.button, justifyContent: 'center' }}>
      <Txt size={size === 'sm' ? 13 : 14} w={700} c={dark || on ? color.white : color.ink} numberOfLines={1}>
        {label}
      </Txt>
    </Pressable>
  );
}

// Segmented control: equal cells, labels flush left, 1.5px dividers.
export function Segmented<T extends string | number>({ options, value, onChange, inverse, height = 42 }: { options: [T, string][]; value: T; onChange: (v: T) => void; inverse?: boolean; height?: number }) {
  const line = inverse ? color.white : color.ink;
  return (
    <View style={{ flexDirection: 'row', borderWidth: 1.5, borderColor: line, borderRadius: radius.input, overflow: 'hidden' }}>
      {options.map(([v, l], i) => {
        const on = v === value;
        const bg = inverse ? (on ? color.white : 'transparent') : on ? color.navy : color.white;
        const fg = inverse ? (on ? color.navy : color.white) : on ? color.white : color.ink;
        return (
          <Pressable key={String(v)} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => onChange(v)} style={{ flex: 1, minHeight: height, justifyContent: 'center', paddingHorizontal: 10, backgroundColor: bg, borderLeftWidth: i ? 1.5 : 0, borderColor: line }}>
            <Txt size={14} w={inverse ? 800 : 700} c={fg} numberOfLines={1}>
              {l}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Toggle({ on }: { on: boolean }) {
  return (
    <View style={{ width: 50, height: 30, borderRadius: radius.pill, backgroundColor: on ? color.orange : color.track, justifyContent: 'center', paddingHorizontal: 3 }}>
      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: color.white, transform: [{ translateX: on ? 20 : 0 }] }} />
    </View>
  );
}

export function ToggleRow({ title, sub, on, onPress, icon, topRule }: { title: string; sub?: string; on: boolean; onPress: () => void; icon?: React.ReactNode; topRule?: boolean }) {
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: on }} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: topRule ? 14 : 0, borderTopWidth: topRule ? 1 : 0, borderColor: color.line }}>
      {icon}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt w={800}>{title}</Txt>
        {sub ? <Txt size={13} c={color.muted}>{sub}</Txt> : null}
      </View>
      <Toggle on={on} />
    </Pressable>
  );
}

// Radio-ish square check used by payment methods and packages.
export function CheckDot({ on }: { on: boolean }) {
  return (
    <View style={{ width: 22, height: 22, borderRadius: radius.badge, borderWidth: 2, borderColor: on ? color.orange : '#9AA3B2', backgroundColor: on ? color.orange : color.white, alignItems: 'center', justifyContent: 'center' }}>
      {on ? <Check size={14} color={color.white} strokeWidth={3} /> : null}
    </View>
  );
}
