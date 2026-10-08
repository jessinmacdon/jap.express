import { Pressable, View } from 'react-native';
import type { PayMethod } from '@/api/types';
import { useSession } from '@/state/session';
import { color, radius } from '@/theme/tokens';
import { CheckDot, Tag, Txt } from './ui';

// Mobile money first: native-feeling brand tiles (MTN yellow, Orange orange).
export const PAY_METHODS: { id: PayMethod; name: string; sub: 'mtnSub' | 'omSub' | 'cardSub' | 'ppSub'; bg: string; fg: string; l1: string; l2: string; border?: string; top?: boolean }[] = [
  { id: 'mtn_momo', name: 'MTN Mobile Money', sub: 'mtnSub', bg: color.mtn, fg: color.ink, l1: 'MTN', l2: 'MoMo', top: true },
  { id: 'orange_money', name: 'Orange Money', sub: 'omSub', bg: color.orangeMoney, fg: color.white, l1: 'Orange', l2: 'Money' },
  { id: 'card', name: 'Card', sub: 'cardSub', bg: color.navy, fg: color.white, l1: 'VISA', l2: 'MC' },
  { id: 'paypal', name: 'PayPal', sub: 'ppSub', bg: color.white, fg: color.paypal, l1: '', l2: 'PayPal', border: '#C9D0DA' },
];

export const isMomo = (m: PayMethod) => m === 'mtn_momo' || m === 'orange_money';

export function MomoBadge({ method = 'mtn_momo' }: { method?: PayMethod }) {
  return method === 'orange_money' ? <Tag label="OM" bg={color.orangeMoney} fg={color.white} size={10} /> : <Tag label="MoMo" bg={color.mtn} fg={color.ink} size={10} />;
}

export function PayMethodRow({ m, on, onPress }: { m: (typeof PAY_METHODS)[number]; on: boolean; onPress: () => void }) {
  const { t } = useSession();
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 68, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: color.white, borderWidth: 2, borderColor: on ? color.orange : color.line, borderRadius: radius.button }}>
      <View style={{ width: 60, height: 42, backgroundColor: m.bg, borderWidth: m.border ? 1 : 0, borderColor: m.border, borderRadius: radius.sm, justifyContent: 'center', paddingHorizontal: 7 }}>
        {m.l1 ? (
          <Txt size={9} w={800} c={m.fg} ls={0.04}>
            {m.l1}
          </Txt>
        ) : null}
        <Txt size={14} w={800} c={m.fg} ls={-0.01}>
          {m.l2}
        </Txt>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          <Txt w={800}>{m.name}</Txt>
          {m.top ? <Tag label={t.mostUsed} bg={color.gold} fg={color.goldText} size={10.5} /> : null}
        </View>
        <Txt size={12} c={color.muted} style={{ marginTop: 2 }}>
          {t[m.sub]}
        </Txt>
      </View>
      <CheckDot on={on} />
    </Pressable>
  );
}
