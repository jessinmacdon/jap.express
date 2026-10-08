import { router } from 'expo-router';
import { Check, ChevronRight, KeyRound, Tag as TagIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { BackButton, Screen, Tag, Txt } from '@/components/ui';
import { useSession } from '@/state/session';
import { color, radius } from '@/theme/tokens';

// Two business models: rent it out (we take a cut per booking) or sell it (pay per listing).
export default function ListYourCar() {
  const { t } = useSession();
  return (
    <Screen contentStyle={{ paddingBottom: 24 }}>
      <View style={{ paddingHorizontal: 12, paddingTop: 4, paddingBottom: 4 }}>
        <BackButton icon="close" />
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 18 }}>
        <Txt size={30} w={800} ls={-0.02}>
          {t.listTitle}
        </Txt>
        <Txt size={15} c={color.body} style={{ marginTop: 6 }}>
          {t.listSub}
        </Txt>
      </View>
      <Option icon={<KeyRound size={22} color={color.white} />} title={t.optRentT} tag={t.optRentTag} points={[t.optRent1, t.optRent2, t.optRent3]} foot={t.optRentFoot} onPress={() => router.push('/host-intro')} />
      <Option icon={<TagIcon size={22} color={color.white} />} title={t.optSellT} tag={t.optSellTag} points={[t.optSell1, t.optSell2, t.optSell3]} foot={t.optSellFoot} onPress={() => router.push({ pathname: '/add-listing', params: { kind: 'sell' } })} />
    </Screen>
  );
}

function Option({ icon, title, tag, points, foot, onPress }: { icon: ReactNode; title: string; tag: string; points: string[]; foot: string; onPress: () => void }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ backgroundColor: color.white, borderWidth: 2, borderColor: pressed ? color.orange : color.ink, borderRadius: radius.button, overflow: 'hidden' })}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderColor: color.line }}>
          <View style={{ width: 44, height: 44, borderRadius: radius.input, backgroundColor: color.navy, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
          <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
            <Txt size={20} w={800} lh={1.15}>
              {title}
            </Txt>
            <Tag label={tag} bg={color.orangeSoft} fg={color.orangeSoftText} size={11.5} />
          </View>
          <ChevronRight size={20} color={color.ink} />
        </View>
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, gap: 8 }}>
          {points.map((p) => (
            <View key={p} style={{ flexDirection: 'row', gap: 10 }}>
              <Check size={16} color={color.green} strokeWidth={2.5} style={{ marginTop: 2 }} />
              <Txt size={14} lh={1.4} style={{ flex: 1 }}>
                {p}
              </Txt>
            </View>
          ))}
          <Txt size={12.5} c={color.muted} style={{ marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderColor: color.line }}>
            {foot}
          </Txt>
        </View>
      </Pressable>
    </View>
  );
}
