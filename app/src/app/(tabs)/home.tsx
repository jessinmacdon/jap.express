import { router } from 'expo-router';
import { ArrowRight, ChevronRight, KeyRound, Plane, Plus, Tag as TagIcon } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { useHome } from '@/api/hooks';
import { FeaturedCard } from '@/components/cards';
import { Photo, Rule, Screen, Tag, Txt } from '@/components/ui';
import { addDays, rangeShort, todayIso } from '@/lib/format';
import { useSearch, type Mode } from '@/state/search';
import { useSession } from '@/state/session';
import { color, radius } from '@/theme/tokens';

const greetingKey = () => {
  const h = new Date().getHours();
  return h < 12 ? { en: 'Good morning', fr: 'Bonjour' } : h < 18 ? { en: 'Good afternoon', fr: 'Bon après-midi' } : { en: 'Good evening', fr: 'Bonsoir' };
};

// Skyscanner-style hub: Rent it · Buy it · List your car on one line.
export default function Home() {
  const { t, lang, me } = useSession();
  const s = useSearch();
  const home = useHome();
  const g = greetingKey()[lang];

  const go = (mode: Mode, place?: Parameters<typeof s.setPlace>[0], extra?: () => void) => {
    s.setMode(mode);
    if (place !== undefined) s.setPlace(place);
    extra?.();
    router.push('/results');
  };
  const dla = { id: 'dla', en: 'Douala Airport (DLA)', fr: 'Aéroport de Douala (DLA)', city: 'Douala' };

  // TODO: persist real recent searches per user (server or device).
  const recent = [
    { tag: 'rent' as Mode, title: dla[lang], sub: `${rangeShort(addDays(todayIso(), 4), addDays(todayIso(), 7), t)} · 3 ${t.days}`, photo: home.data?.heroImage, go: () => go('rent', dla) },
    { tag: 'buy' as Mode, title: 'SEAT Leon · Douala', sub: lang === 'fr' ? 'Moins de 8 M FCFA · Manuelle' : 'Under 8 M FCFA · Manual', photo: home.data?.featured.find((c) => c.kind === 'sale')?.photos[0], go: () => go('buy', { id: 'douala', en: 'Douala', fr: 'Douala', city: 'Douala' }, () => { s.setF('price', [0, 8_000_000]); s.setF('trans', 'manual'); }) },
    { tag: 'rent' as Mode, title: 'Kribi', sub: `${rangeShort(addDays(todayIso(), 16), addDays(todayIso(), 18), t)} · 2 ${t.days}`, photo: undefined, go: () => go('rent', { id: 'kribi', en: 'Kribi', fr: 'Kribi', city: 'Kribi' }) },
  ];

  return (
    <Screen contentStyle={{ paddingBottom: 28 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16 }}>
        <Txt size={13} w={600} c={color.muted}>
          {me?.firstName ? `${g}, ${me.firstName}` : g}
        </Txt>
        <Txt size={28} w={800} lh={1.1} ls={-0.02} style={{ marginTop: 4 }}>
          {t.homeQ}
        </Txt>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 14 }}>
        <EntryTile flex={1} bg={color.navy} icon={<KeyRound size={22} color={color.white} />} title={t.rentIt} sub={t.rentItSub} onPress={() => go('rent')} />
        <EntryTile flex={1} bg={color.navy} icon={<TagIcon size={22} color={color.white} />} title={t.buyIt} sub={t.buyItSub} onPress={() => go('buy')} />
        <EntryTile flex={1.45} bg={color.orange} iconBg="rgba(255,255,255,.22)" icon={<Plus size={22} color={color.white} />} title={t.listIt} sub={t.listItSub} onPress={() => router.push('/list')} />
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            go('rent', dla, () => {
              s.setF('deliv', true);
            })
          }
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: pressed ? color.surface : color.white, borderWidth: 2, borderColor: color.ink, borderRadius: radius.button })}>
          <View style={{ width: 44, height: 44, borderRadius: radius.input, backgroundColor: color.orangeSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Plane size={22} color="#A84E0A" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt w={800} lh={1.25}>
              {t.airportQ}
            </Txt>
            <Txt size={12.5} c={color.muted} style={{ marginTop: 2 }}>
              {t.airportQSub}
            </Txt>
          </View>
          <ChevronRight size={20} color={color.ink} />
        </Pressable>
      </View>

      <Rule />
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 }}>
        <Txt size={20} w={800} ls={-0.01}>
          {t.pickUp}
        </Txt>
        <Txt size={13} c={color.muted} style={{ marginTop: 2 }}>
          {t.pickUpSub}
        </Txt>
      </View>
      {recent.map((r) => (
        <Pressable key={r.title} onPress={r.go} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderColor: color.line, backgroundColor: pressed ? color.surface : 'transparent' })}>
          <Photo uri={r.photo} radius={radius.input} style={{ width: 64, height: 48 }} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <Tag label={r.tag === 'rent' ? t.rent : t.buy} bg={r.tag === 'rent' ? color.navy : color.orange} size={10} upper />
              <Txt w={800} numberOfLines={1} style={{ flex: 1 }}>
                {r.title}
              </Txt>
            </View>
            <Txt size={13} c={color.muted} style={{ marginTop: 3 }}>
              {r.sub}
            </Txt>
          </View>
          <ChevronRight size={18} color={color.muted} />
        </Pressable>
      ))}

      <View style={{ paddingTop: 22, paddingBottom: 4 }}>
        <Txt size={20} w={800} ls={-0.01} style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          {t.featNear}
        </Txt>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
          {(home.data?.featured ?? []).map((c) => (
            <FeaturedCard key={`${c.kind}:${c.id}`} c={c} />
          ))}
        </ScrollView>
      </View>

      <Promo dark kicker={t.hostKicker} title={t.hostPromo} sub={t.hostPromoSub} cta={t.startHosting} onPress={() => router.push('/host-intro')} />
      <Promo kicker={t.sellKicker} title={t.sellPromo} sub={t.sellPromoSub} cta={t.sellCar} onPress={() => router.push({ pathname: '/add-listing', params: { kind: 'sell' } })} />
    </Screen>
  );
}

function EntryTile({ flex, bg, iconBg = 'rgba(255,255,255,.14)', icon, title, sub, onPress }: { flex: number; bg: string; iconBg?: string; icon: React.ReactNode; title: string; sub: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ flex, minWidth: 0, minHeight: 116, padding: 12, paddingHorizontal: 10, backgroundColor: bg, borderRadius: radius.button, justifyContent: 'space-between', gap: 12, opacity: pressed ? 0.88 : 1 })}>
      <View style={{ width: 38, height: 38, borderRadius: radius.input, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
      <View>
        <Txt size={16} w={800} c={color.white} lh={1.1}>
          {title}
        </Txt>
        <Txt size={11.5} c="rgba(255,255,255,.9)" lh={1.25} style={{ marginTop: 3 }}>
          {sub}
        </Txt>
      </View>
    </Pressable>
  );
}

function Promo({ dark, kicker, title, sub, cta, onPress }: { dark?: boolean; kicker: string; title: string; sub: string; cta: string; onPress: () => void }) {
  const fg = dark ? color.white : color.ink;
  return (
    <View style={{ marginTop: 12, marginHorizontal: 16, padding: 16, paddingVertical: 18, gap: 8, borderRadius: radius.card, backgroundColor: dark ? color.navy : color.white, borderWidth: dark ? 0 : 2, borderColor: color.ink }}>
      <Txt size={11} w={700} ls={0.1} upper c={dark ? color.peach : color.orangeText}>
        {kicker}
      </Txt>
      <Txt size={21} w={800} lh={1.15} ls={-0.01} c={fg}>
        {title}
      </Txt>
      <Txt size={13.5} lh={1.45} c={dark ? 'rgba(255,255,255,.85)' : color.body}>
        {sub}
      </Txt>
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ marginTop: 6, height: 46, borderRadius: radius.button, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: dark ? (pressed ? color.orangePressed : color.orange) : pressed ? color.surface : 'transparent', borderWidth: dark ? 0 : 2, borderColor: color.ink })}>
        <Txt w={800} c={dark ? color.white : color.ink}>
          {cta}
        </Txt>
        <ArrowRight size={20} color={dark ? color.white : color.ink} />
      </Pressable>
    </View>
  );
}
