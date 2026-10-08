import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, Lock, MapPin, Star } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ApiError, post } from '@/api/client';
import { openConversation, useBooking, useQuote, useRental } from '@/api/hooks';
import type { Booking, PayMethod } from '@/api/types';
import { carTitle } from '@/components/cards';
import { isMomo, PAY_METHODS, PayMethodRow } from '@/components/payments';
import { Button, Calendar, ErrorView, Field, Label, Loading, nextRange, Photo, Rule, Screen, TopBar, Txt, Verified } from '@/components/ui';
import { dateLabel, fcfa, fmt, rangeShort } from '@/lib/format';
import { DELIVERY_SPOTS } from '@/lib/places';
import { useSearch } from '@/state/search';
import { useSession } from '@/state/session';
import { useUi } from '@/state/ui';
import { color, radius } from '@/theme/tokens';

export default function Checkout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang, me } = useSession();
  const { showToast } = useUi();
  const qc = useQueryClient();
  const s = useSearch();
  const rq = useRental(id);
  const r = rq.data;
  const canDeliver = !!r && (r.deliveryOptions.airport || r.deliveryOptions.city);
  const delivery = canDeliver && s.delivery;
  const quote = useQuote({ rentalId: id, start: s.start, end: s.end, delivery, deliveryTo: s.deliveryTo });
  const [method, setMethod] = useState<PayMethod>('mtn_momo');
  const [msisdn, setMsisdn] = useState(me?.phone.replace(/^\+237/, '') ?? '');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [busy, setBusy] = useState(false);
  const live = useBooking(booking?.id ?? null, !!booking && booking.payment?.status === 'pending');
  const b = live.data ?? booking;
  const paid = !!b && b.payment?.status === 'succeeded' && b.status !== 'accepted';

  useEffect(() => {
    if (paid) qc.invalidateQueries({ queryKey: ['trips'] });
  }, [paid, qc]);

  if (rq.isLoading) return <Screen><Loading /></Screen>;
  if (!r) return <Screen><ErrorView onRetry={() => rq.refetch()} /></Screen>;

  const spot = (DELIVERY_SPOTS.find((d) => d.id === s.deliveryTo) ?? DELIVERY_SPOTS[0])[lang];
  const p = quote.data;
  const waiting = busy || (!!b && b.payment?.status === 'pending');

  const pay = async () => {
    if (!s.end || waiting) return;
    if (isMomo(method) && msisdn.replace(/\D/g, '').length < 8) return showToast(t.errPhone);
    setBusy(true);
    try {
      const res = await post<Booking & { redirectUrl: string | null }>('/bookings', {
        rentalId: r.id,
        start: s.start,
        end: s.end,
        delivery,
        deliveryTo: delivery ? s.deliveryTo : undefined,
        method,
        msisdn: isMomo(method) ? `+237${msisdn.replace(/\D/g, '')}` : undefined,
      });
      // TODO: open res.redirectUrl for card / PayPal hosted checkout.
      setBooking(res);
    } catch (e) {
      showToast(e instanceof ApiError && e.code === 'dates_unavailable' ? t.errDatesTaken : t.errGeneric);
    } finally {
      setBusy(false);
    }
  };

  if (paid && b) {
    const confirmed = b.status === 'confirmed';
    return (
      <Screen header={<TopBar title={t.confirmPay} onBack={() => router.replace('/home')} />}>
        <View style={{ paddingHorizontal: 20, paddingVertical: 32, gap: 14, alignItems: 'flex-start' }}>
          <View style={{ width: 64, height: 64, borderRadius: radius.input, backgroundColor: color.green, alignItems: 'center', justifyContent: 'center' }}>
            <Check size={34} color={color.white} strokeWidth={2.5} />
          </View>
          <Txt size={28} w={800} ls={-0.02} style={{ marginTop: 6 }}>
            {confirmed ? t.confirmed : t.requested}
          </Txt>
          <Txt size={15} c={color.body} lh={1.5}>
            {confirmed ? t.confirmedSub.replace('Armel', b.host.name.split(' ')[0]) : t.requestedSub}
          </Txt>
          <View style={{ alignSelf: 'stretch', borderTopWidth: 2, borderColor: color.lineStrong, marginTop: 8 }}>
            {[
              [t.reference, b.reference],
              [carTitle(b.rental), rangeShort(b.start, b.end, t)],
              [t.total, fcfa(b.price.total)],
            ].map(([k, v]) => (
              <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderColor: color.line }}>
                <Txt size={14} c={color.muted} style={{ flexShrink: 1 }}>
                  {k}
                </Txt>
                <Txt size={14} w={800}>
                  {v}
                </Txt>
              </View>
            ))}
          </View>
          <Button
            label={t.messageHost}
            arrow
            block
            height={54}
            size={16}
            style={{ marginTop: 8 }}
            onPress={async () => {
              const c = await openConversation('rent', r.id).catch(() => null);
              if (c) router.replace({ pathname: '/chat/[id]', params: { id: c.id } });
            }}
          />
          <Button label={t.viewBookings} variant="outline" block height={54} size={16} onPress={() => router.replace({ pathname: '/activity', params: { tab: 'trips' } })} />
        </View>
      </Screen>
    );
  }

  const footer = (
    <Button
      label={waiting ? t.waiting : `${t.pay} ${p ? fcfa(p.total) : ''}`}
      trailing={<Lock size={18} color={color.white} />}
      onPress={pay}
      disabled={!s.end || !p}
      height={56}
      size={16}
      style={{ opacity: waiting ? 0.7 : undefined }}
    />
  );

  return (
    <Screen header={<TopBar title={t.confirmPay} />} footer={footer}>
      <View style={{ flexDirection: 'row', gap: 12, padding: 16, alignItems: 'center' }}>
        <Photo uri={r.photos[0]} radius={radius.input} style={{ width: 96, height: 72 }} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt size={16} w={800}>
            {carTitle(r)}
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 4 }}>
            <Txt size={13} c={color.body}>
              {r.host.name}
            </Txt>
            {r.host.verified ? <Verified label={t.verified} variant="plain" /> : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Star size={12} color={color.muted} fill={color.muted} />
            <Txt size={13} c={color.muted}>
              {r.rating.toFixed(1)} · {r.city}
            </Txt>
          </View>
        </View>
      </View>

      <Rule />
      <View style={{ padding: 16 }}>
        <Label style={{ marginBottom: 10 }}>{t.yourTrip}</Label>
        <View style={{ flexDirection: 'row', borderWidth: 1.5, borderColor: color.ink, borderRadius: radius.input, overflow: 'hidden' }}>
          <View style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 10 }}>
            <Txt size={11} c={color.muted}>
              {t.pickup}
            </Txt>
            <Txt w={800}>{dateLabel(s.start, t)}</Txt>
            <Txt size={12} c={color.muted}>
              {t.fromTime}
            </Txt>
          </View>
          <View style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 10, borderLeftWidth: 1.5, borderColor: color.ink }}>
            <Txt size={11} c={color.muted}>
              {t.ret}
            </Txt>
            <Txt w={800}>{s.end ? dateLabel(s.end, t) : '—'}</Txt>
            <Txt size={12} c={color.muted}>
              {t.byTime}
            </Txt>
          </View>
        </View>
        <View style={{ height: 14 }} />
        <Calendar mode="range" start={s.start} end={s.end} unavailable={r.unavailable} cellHeight={36} onPick={(d) => s.setDates(...nextRange(d, s.start, s.end, r.unavailable))} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 2, borderColor: color.lineStrong }}>
        <MapPin size={20} color={color.navy} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt size={12} w={700} c={color.muted} upper ls={0.06}>
            {delivery ? t.chkDeliv : t.chkPick}
          </Txt>
          <Txt w={800} style={{ marginTop: 2 }}>
            {delivery ? spot : r.pickup.address}
          </Txt>
        </View>
        <Button label={t.editSearch} variant="white" height={36} size={13} onPress={() => router.back()} />
      </View>

      <View style={{ padding: 16 }}>
        <Label style={{ marginBottom: 6 }}>{t.priceDetails}</Label>
        {p ? (
          <>
            <Line k={`${fmt(p.dailyRate)} FCFA × ${p.days} ${p.days === 1 ? t.dayS : t.days}`} v={fcfa(p.gross)} first />
            {p.discount ? <Line k={t.weeklyDisc} v={`− ${fcfa(p.discount)}`} /> : null}
            {p.deliveryFee ? <Line k={t.delivery} v={fcfa(p.deliveryFee)} /> : null}
            <Line k={t.platformFee} v={fcfa(p.platformFee)} />
            <Line k={t.deposit} sub={t.depositSub} v={fcfa(p.deposit)} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, paddingTop: 12, borderTopWidth: 2, borderColor: color.lineStrong }}>
              <Txt size={16} w={800}>
                {t.total}
              </Txt>
              <Txt size={22} w={800} c={color.navy}>
                {fcfa(p.total)}
              </Txt>
            </View>
          </>
        ) : (
          <Txt c={color.muted}>{t.selectReturn}</Txt>
        )}
      </View>

      <Rule />
      <View style={{ padding: 16, paddingBottom: 24, gap: 8 }}>
        <Label style={{ marginBottom: 2 }}>{t.payWith}</Label>
        {PAY_METHODS.map((m) => (
          <PayMethodRow key={m.id} m={m} on={method === m.id} onPress={() => setMethod(m.id)} />
        ))}
        {isMomo(method) ? (
          <View style={{ marginTop: 6 }}>
            <Field label={`${t.momoNumber} · ${method === 'orange_money' ? 'Orange Money' : 'MTN MoMo'}`} prefix="+237" value={msisdn} onChangeText={setMsisdn} inputMode="tel" keyboardType="phone-pad" height={48} />
          </View>
        ) : method === 'card' ? (
          <View style={{ marginTop: 6 }}>
            {/* TODO: replace with the PSP's hosted card fields (never handle raw PANs). */}
            <Field label={t.cardNumber} placeholder="1234 5678 9012 3456" inputMode="numeric" height={48} />
          </View>
        ) : (
          <Txt size={13} c={color.body} style={{ marginTop: 6 }}>
            {t.ppRedirect}
          </Txt>
        )}
        <Txt size={12.5} c={color.muted} style={{ marginTop: 6 }}>
          {t.freeCancelGeneric}
        </Txt>
      </View>
    </Screen>
  );
}

function Line({ k, v, sub, first }: { k: string; v: string; sub?: string; first?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 9, borderTopWidth: first ? 0 : 1, borderColor: color.line }}>
      <View style={{ flex: 1 }}>
        <Txt size={14}>{k}</Txt>
        {sub ? (
          <Txt size={12} c={color.muted}>
            {sub}
          </Txt>
        ) : null}
      </View>
      <Txt size={14} w={700}>
        {v}
      </Txt>
    </View>
  );
}
