import { router, useLocalSearchParams } from 'expo-router';
import { Cog, Fuel, MessageCircle, Star, Truck, Users } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { openConversation, useQuote, useRental } from '@/api/hooks';
import { carTitle, HeartButton } from '@/components/cards';
import { Carousel } from '@/components/Carousel';
import { SpotCard } from '@/components/places';
import { SearchContextCard } from '@/components/search';
import { Translatable } from '@/components/Translatable';
import { Avatar, Button, Calendar, ErrorView, Label, Loading, nextRange, Rule, Screen, SelectField, ToggleRow, Txt, Verified } from '@/components/ui';
import { dateLabel, daysWord, diffDays, fcfa, fmt, rangeShort } from '@/lib/format';
import { DELIVERY_SPOTS } from '@/lib/places';
import { useSearch } from '@/state/search';
import { useSession } from '@/state/session';
import { useUi } from '@/state/ui';
import { color, radius } from '@/theme/tokens';

export default function RentalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang, token, me } = useSession();
  const { showToast } = useUi();
  const s = useSearch();
  const q = useRental(id);
  const r = q.data;
  const canDeliver = !!r && (r.deliveryOptions.airport || r.deliveryOptions.city);
  const delivery = canDeliver && s.delivery;
  const quote = useQuote({ rentalId: id, start: s.start, end: s.end, delivery, deliveryTo: s.deliveryTo });

  if (q.isLoading) return <Screen><Loading /></Screen>;
  if (!r) return <Screen><ErrorView onRetry={() => q.refetch()} /></Screen>;

  const own = me?.id === r.host.id;
  const days = s.end ? diffDays(s.start, s.end) : 0;
  const spotLabel = (DELIVERY_SPOTS.find((d) => d.id === s.deliveryTo) ?? DELIVERY_SPOTS[0])[lang];

  const message = async (draft?: string) => {
    if (!token) return router.push('/welcome');
    try {
      const c = await openConversation('rent', r.id);
      router.push({ pathname: '/chat/[id]', params: { id: c.id, draft } });
    } catch {
      showToast(t.errGeneric);
    }
  };

  const footer = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt size={18} w={800} c={color.navy}>
          {quote.data && s.end ? fcfa(quote.data.subtotal) : `${fmt(r.dailyRate)} FCFA`}
        </Txt>
        <Txt size={12.5} c={color.muted}>
          {s.end ? `${daysWord(days, t)} · ${rangeShort(s.start, s.end, t)}` : t.selectReturn}
        </Txt>
      </View>
      <Button label={t.bookNow} arrow disabled={!s.end || own} onPress={() => router.push({ pathname: '/checkout/[id]', params: { id: r.id } })} height={54} size={16} style={{ minWidth: 168 }} />
    </View>
  );

  return (
    <Screen footer={footer}>
      <SearchContextCard />
      <Carousel photos={r.photos} label={r.model} height={300} right={<HeartButton card={r} size={40} />} />

      <View style={{ padding: 16, paddingBottom: 18 }}>
        <Txt size={26} w={800} lh={1.1} ls={-0.02}>
          {carTitle(r)}
        </Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <Star size={15} color={color.orange} fill={color.orange} />
          <Txt size={14} c={color.body}>
            <Txt size={14} w={800}>
              {r.rating.toFixed(1)}
            </Txt>{' '}
            · {r.trips} {t.trips} · {r.city}
          </Txt>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
          <Txt size={30} w={800} c={color.navy} ls={-0.02}>
            {fmt(r.dailyRate)} FCFA
          </Txt>
          <Txt size={16} c={color.muted}>
            / {t.day}
          </Txt>
        </View>
      </View>

      <Rule />
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 16, paddingVertical: 14 }}>
        <Avatar initials={r.host.initials} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <Txt size={16} w={800}>
              {t.hostedBy} {r.host.name}
            </Txt>
            {r.host.verified ? <Verified label={t.verified} /> : null}
          </View>
          <Txt size={13} c={color.muted} style={{ marginTop: 2 }}>
            {t.joined} {r.host.memberSince} · {t.responds}
          </Txt>
        </View>
      </View>

      <View style={{ flexDirection: 'row', borderTopWidth: 2, borderBottomWidth: 2, borderColor: color.lineStrong }}>
        {[
          [<Users key="u" size={22} color={color.navy} />, String(r.seats), t.seats],
          [<Cog key="g" size={22} color={color.navy} />, t[r.transmission], t.gearbox],
          [<Fuel key="f" size={22} color={color.navy} />, t[r.fuel], t.fuel],
        ].map(([icon, v, l], i) => (
          <View key={i} style={{ flex: 1, padding: 14, gap: 6, borderLeftWidth: i ? 1 : 0, borderColor: color.line }}>
            {icon}
            <Txt size={16} w={800}>
              {v}
            </Txt>
            <Txt size={12} c={color.muted}>
              {l}
            </Txt>
          </View>
        ))}
      </View>

      <Translatable label={t.aboutCar} d={r.description} />

      <Rule />
      <View style={{ padding: 16, paddingVertical: 18 }}>
        <Label style={{ marginBottom: 10 }}>{t.availability}</Label>
        <Calendar
          mode="range"
          start={s.start}
          end={s.end}
          unavailable={r.unavailable}
          onPick={(d) => {
            const [a, b] = nextRange(d, s.start, s.end, r.unavailable);
            s.setDates(a, b);
          }}
        />
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center', marginTop: 10 }}>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: color.navy }} />
            <Txt size={12} c={color.muted}>
              {t.selected}
            </Txt>
          </View>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <Txt size={12} w={700} c={color.faint} style={{ textDecorationLine: 'line-through' }}>
              20
            </Txt>
            <Txt size={12} c={color.muted}>
              {t.unavailable}
            </Txt>
          </View>
        </View>
        <Txt w={700} style={{ marginTop: 12 }}>
          {s.end ? `${dateLabel(s.start, t)} → ${dateLabel(s.end, t)} · ${daysWord(days, t)}` : t.selectReturn}
        </Txt>
      </View>

      <Rule />
      <View style={{ padding: 16, paddingBottom: 18, gap: 12 }}>
        <View>
          <Txt size={18} w={800}>
            {t.pickT}
          </Txt>
          <Txt size={13} c={color.muted} style={{ marginTop: 2 }}>
            {t.pickSub}
          </Txt>
        </View>
        <SpotCard spot={r.pickup} address={r.pickup.address} note={r.pickup.note} />
        {!own ? (
          <Pressable onPress={() => message(t.changeSpotMsg)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, alignSelf: 'flex-start' }}>
            <MessageCircle size={16} color={color.orangeText} />
            <Txt size={14} w={800} c={color.orangeText}>
              {t.changeSpot}
            </Txt>
          </Pressable>
        ) : null}
      </View>

      {canDeliver ? (
        <>
          <Rule />
          <View style={{ padding: 16, paddingBottom: 24 }}>
            <ToggleRow icon={<Truck size={24} color={color.navy} />} title={t.deliveryTitle} sub={t.deliverySub} on={s.delivery} onPress={() => s.setDelivery(!s.delivery)} />
            {s.delivery ? (
              <View style={{ marginTop: 14, padding: 12, gap: 8, backgroundColor: color.white, borderWidth: 1.5, borderColor: color.ink, borderRadius: radius.button }}>
                <SelectField label={t.delivTo} value={s.deliveryTo} options={DELIVERY_SPOTS.map((d) => ({ v: d.id, l: d[lang] }))} onChange={s.setDeliveryTo} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <Txt size={12.5} c={color.muted} lh={1.4} style={{ flex: 1 }}>
                    {t.delivAgree}
                  </Txt>
                  {!own ? <Button label={t.msgHost} variant="white" height={34} size={13} onPress={() => message(t.delivMsg + spotLabel)} /> : null}
                </View>
              </View>
            ) : null}
          </View>
        </>
      ) : null}
    </Screen>
  );
}
