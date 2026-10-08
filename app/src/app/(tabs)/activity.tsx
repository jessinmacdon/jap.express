import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowRight, Calendar as CalendarIcon, Car, Plus, Tag as TagIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { ApiError, post } from '@/api/client';
import { openConversation, useHostDashboard, useOffers, useTrips } from '@/api/hooks';
import type { Booking, HostDashboard } from '@/api/types';
import { carTitle, openCard } from '@/components/cards';
import { MomoBadge } from '@/components/payments';
import { Avatar, Button, EmptyState, ErrorView, Label, Loading, PageTitle, Photo, Screen, Tag, Txt } from '@/components/ui';
import { fcfa, perDay, rangeShort } from '@/lib/format';
import { DELIVERY_SPOTS } from '@/lib/places';
import { prefs } from '@/lib/storage';
import { useSearch } from '@/state/search';
import { useSession } from '@/state/session';
import { useUi } from '@/state/ui';
import { color, radius } from '@/theme/tokens';

type Tab = 'trips' | 'offers' | 'listings';
const KEY = 'jx.activityTab';

// Trips (rentals you booked) · Offers (cars you want to buy) · My listings (hosting & selling).
export default function Activity() {
  const { t } = useSession();
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const [stored, setStored] = useState<Tab>('trips');
  // Reopen on the last-used tab unless a link (?tab=…) asks for a specific one.
  useEffect(() => {
    prefs.get<Tab>(KEY, 'trips').then(setStored);
  }, []);
  const tab = params.tab ?? stored;
  const pick = (k: Tab) => {
    router.setParams({ tab: k });
    setStored(k);
    prefs.set(KEY, k);
  };

  return (
    <Screen>
      <PageTitle>{t.activity}</PageTitle>
      <View style={{ flexDirection: 'row', borderTopWidth: 2, borderBottomWidth: 2, borderColor: color.lineStrong }}>
        {(
          [
            ['trips', t.tabTrips2],
            ['offers', t.tabOffers],
            ['listings', t.tabListings],
          ] as const
        ).map(([k, l], i) => (
          <Pressable key={k} accessibilityRole="tab" accessibilityState={{ selected: tab === k }} onPress={() => pick(k)} style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 12, borderLeftWidth: i ? 2 : 0, borderColor: color.lineStrong, borderBottomWidth: 4, borderBottomColor: tab === k ? color.orange : 'transparent', marginBottom: -2 }}>
            <Txt w={800} lh={1.2} c={tab === k ? color.ink : color.muted}>
              {l}
            </Txt>
          </Pressable>
        ))}
      </View>
      {tab === 'trips' ? <Trips /> : tab === 'offers' ? <Offers /> : <Hosting />}
    </Screen>
  );
}

function Trips() {
  const { t, lang } = useSession();
  const { setMode } = useSearch();
  const q = useTrips();
  if (q.isLoading) return <Loading />;
  if (q.isError) return <ErrorView onRetry={() => q.refetch()} />;
  const { upcoming, past } = q.data!;
  if (!upcoming.length && !past.length)
    return (
      <>
        <EmptyState icon={<CalendarIcon size={28} color={color.navy} />} title={t.tripsEmptyT} sub={t.tripsEmptyS}>
          <Button label={t.findCar} trailing={<ArrowRight size={18} color={color.white} />} onPress={() => { setMode('rent'); router.push('/results'); }} height={46} />
        </EmptyState>
        <View style={{ marginHorizontal: 16, marginTop: 4, marginBottom: 28, padding: 16, gap: 6, backgroundColor: color.navy, borderRadius: radius.card }}>
          <Txt size={17} w={800} c={color.white}>
            {t.hostBannerT}
          </Txt>
          <Txt size={13.5} c="rgba(255,255,255,.85)" lh={1.45}>
            {t.hostBannerS}
          </Txt>
          <Button label={t.listIt} arrow height={42} size={14} onPress={() => router.push('/list')} style={{ marginTop: 8, alignSelf: 'flex-start' }} />
        </View>
      </>
    );

  const where = (b: Booking) => (b.delivery ? (DELIVERY_SPOTS.find((d) => d.id === b.deliveryTo) ?? DELIVERY_SPOTS[0])[lang] : b.rental.pickup.address);
  const statusTag = (b: Booking) =>
    b.status === 'confirmed' ? <Tag label={t.confirmedTag} bg={color.green} size={12} /> : b.status === 'requested' ? <Tag label={t.awaiting} bg={color.orangeSoft} fg={color.orangeSoftText} size={12} /> : null;

  return (
    <View style={{ padding: 16, gap: 14 }}>
      {upcoming.length ? <Label>{t.upcoming}</Label> : null}
      {upcoming.map((b) => (
        <View key={b.id} style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.card, overflow: 'hidden' }}>
          <Pressable onPress={() => openCard(b.rental)}>
            <Photo uri={b.rental.photos[0]} caption={b.rental.model} style={{ height: 150 }}>
              <View style={{ position: 'absolute', top: 10, left: 10 }}>{statusTag(b)}</View>
            </Photo>
          </Pressable>
          <View style={{ padding: 14, gap: 4 }}>
            <Txt size={17} w={800}>
              {carTitle(b.rental)}
            </Txt>
            <Txt size={14} c={color.body}>
              {b.days} {b.days === 1 ? t.dayS : t.days} · {rangeShort(b.start, b.end, t)} · {b.reference}
            </Txt>
            <Txt size={13} c={color.muted}>
              {where(b)}
            </Txt>
            <Button
              label={`${t.messageHost} · ${b.host.name}`}
              variant="outline"
              height={46}
              style={{ marginTop: 10 }}
              onPress={async () => {
                const c = await openConversation('rent', b.rental.id).catch(() => null);
                if (c) router.push({ pathname: '/chat/[id]', params: { id: c.id } });
              }}
            />
          </View>
        </View>
      ))}
      {past.length ? <Label style={{ marginTop: 8 }}>{t.past}</Label> : null}
      {past.map((b) => (
        <Pressable key={b.id} onPress={() => openCard(b.rental)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderColor: color.line }}>
          <Photo uri={b.rental.photos[0]} radius={radius.input} style={{ width: 76, height: 58 }} />
          <View style={{ flex: 1 }}>
            <Txt w={800}>{carTitle(b.rental)}</Txt>
            <Txt size={13} c={color.muted}>
              {b.rental.city} · {rangeShort(b.start, b.end, t)} · {t.completed}
            </Txt>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function Offers() {
  const { t } = useSession();
  const { setMode } = useSearch();
  const q = useOffers();
  if (q.isLoading) return <Loading />;
  if (q.isError) return <ErrorView onRetry={() => q.refetch()} />;
  const items = q.data!.items;
  if (!items.length)
    return (
      <EmptyState icon={<TagIcon size={28} color={color.navy} />} title={t.offersEmptyT} sub={t.offersEmptyS}>
        <Button label={t.browseSale} trailing={<ArrowRight size={18} color={color.white} />} onPress={() => { setMode('buy'); router.push('/results'); }} height={46} />
      </EmptyState>
    );
  return (
    <View>
      {items.map((o) => {
        const st =
          o.status === 'countered'
            ? { label: `${t.countered} · ${fcfa(o.counterAmount ?? 0)}`, bg: color.greenSoft, fg: color.green }
            : o.status === 'accepted'
              ? { label: t.accepted2, bg: color.greenSoft, fg: color.green }
              : o.status === 'declined'
                ? { label: t.declined2, bg: color.surface, fg: color.label }
                : { label: t.awaiting, bg: color.orangeSoft, fg: color.orangeSoftText };
        return (
          <Pressable key={o.id} onPress={() => openCard(o.sale)} style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: color.line }}>
            <Photo uri={o.sale.photos[0]} radius={radius.input} style={{ width: 96, height: 72 }} />
            <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
              <Txt w={800} lh={1.2}>
                {carTitle(o.sale)}
              </Txt>
              <Txt size={13.5} w={800} c={color.navy}>
                {t.yourOfferLbl}: {fcfa(o.amount)}
              </Txt>
              <Txt size={12.5} c={color.muted}>
                {t.askingLbl2}: {fcfa(o.sale.price)} · {o.sale.seller.name}
              </Txt>
              <View style={{ marginTop: 4 }}>
                <Tag label={st.label} bg={st.bg} fg={st.fg} size={12} />
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function Hosting() {
  const { t } = useSession();
  const { showToast } = useUi();
  const qc = useQueryClient();
  const q = useHostDashboard();
  const respond = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'accept' | 'decline' }) => post(`/host/requests/${id}/${action}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['host'] }),
    onError: () => showToast(t.errGeneric),
  });
  const payout = useMutation({
    mutationFn: () => post<{ amount: number; msisdn: string }>('/host/payouts'),
    onSuccess: (r) => {
      showToast(`${fcfa(r.amount)} → MoMo •• ${r.msisdn.slice(-2)}`);
      qc.invalidateQueries({ queryKey: ['host'] });
    },
    onError: (e) => showToast(e instanceof ApiError && e.code === 'nothing_to_pay_out' ? t.payoutSent : t.errGeneric),
  });

  if (q.isLoading) return <Loading />;
  if (q.isError) return <ErrorView onRetry={() => q.refetch()} />;
  const d = q.data!;
  if (!d.listings.length)
    return (
      <EmptyState icon={<Car size={28} color={color.navy} />} title={t.listingsEmptyT} sub={t.listingsEmptyS}>
        <Button label={t.listIt} trailing={<ArrowRight size={18} color={color.white} />} onPress={() => router.push('/list')} height={46} />
      </EmptyState>
    );
  const pending = d.requests.filter((r) => r.status === 'requested').length;

  return (
    <View>
      <View style={{ margin: 16, padding: 16, paddingVertical: 18, backgroundColor: color.navy, borderRadius: radius.card }}>
        <Txt size={11} w={700} ls={0.1} upper c={color.peach}>
          {t.earnings}
        </Txt>
        <View style={{ flexDirection: 'row', marginTop: 10 }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Txt size={12} c="rgba(255,255,255,.8)">
              {t.thisMonth}
            </Txt>
            <Txt size={22} w={800} c={color.white} ls={-0.01} style={{ marginTop: 2 }}>
              {fcfa(d.earnings.thisMonth)}
            </Txt>
          </View>
          <View style={{ flex: 1, paddingLeft: 12, borderLeftWidth: 1, borderColor: 'rgba(255,255,255,.3)' }}>
            <Txt size={12} c="rgba(255,255,255,.8)">
              {t.totalEarned}
            </Txt>
            <Txt size={22} w={800} c={color.white} ls={-0.01} style={{ marginTop: 2 }}>
              {fcfa(d.earnings.total)}
            </Txt>
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderColor: 'rgba(255,255,255,.3)' }}>
          <Txt size={13} c="rgba(255,255,255,.85)">
            {t.available}
          </Txt>
          <Txt size={13} w={800} c={color.white}>
            {fcfa(d.earnings.available)}
          </Txt>
        </View>
        <Button
          label={d.earnings.available ? t.payout : t.payoutSent}
          icon={<MomoBadge method={d.payoutAccount?.method} />}
          arrow
          height={50}
          loading={payout.isPending}
          disabled={!d.earnings.available}
          onPress={() => payout.mutate()}
          style={{ marginTop: 12 }}
        />
      </View>

      <View style={{ borderTopWidth: 2, borderColor: color.lineStrong, padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Txt size={17} w={800}>
            {t.requests}
          </Txt>
          <Tag label={String(pending)} size={12} />
        </View>
        <View style={{ gap: 12 }}>
          {d.requests.map((r) => (
            <Request key={r.id} r={r} onRespond={(action) => respond.mutate({ id: r.id, action })} />
          ))}
        </View>
      </View>

      <View style={{ borderTopWidth: 2, borderColor: color.lineStrong, padding: 16, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Txt size={17} w={800}>
            {t.listings}
          </Txt>
          <Button label={t.addListing} variant="navy" icon={<Plus size={16} color={color.white} strokeWidth={2.5} />} height={38} size={14} onPress={() => router.push('/list')} />
        </View>
        {d.listings.map((l) => {
          const st = l.status === 'booked' ? { label: l.bookedFrom && l.bookedTo ? `${t.booked} ${rangeShort(l.bookedFrom, l.bookedTo, t)}` : t.booked, dot: color.orange } : l.status === 'available' ? { label: t.statusAvail, dot: color.green } : l.status === 'for_sale' ? { label: t.statusSale, dot: color.navy } : { label: t.pendingPayment, dot: color.faint };
          return (
            <Pressable key={l.id} onPress={() => router.push(l.kind === 'rent' ? `/rental/${l.id}` : `/sale/${l.id}`)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: color.line }}>
              <Photo uri={l.photo} radius={radius.input} style={{ width: 76, height: 58 }} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt w={800}>{l.name}</Txt>
                <Txt size={13} w={700} c={color.navy}>
                  {l.kind === 'rent' ? perDay(l.price, t) : fcfa(l.price)}
                </Txt>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginTop: 2 }}>
                  <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                    <View style={{ width: 8, height: 8, borderRadius: 3, backgroundColor: st.dot }} />
                    <Txt size={12} w={600}>
                      {st.label}
                    </Txt>
                  </View>
                  {l.viewsWeek != null ? (
                    <Txt size={12} c={color.muted}>
                      {l.viewsWeek} {t.viewsWeek}
                    </Txt>
                  ) : null}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Request({ r, onRespond }: { r: HostDashboard['requests'][number]; onRespond: (a: 'accept' | 'decline') => void }) {
  const { t } = useSession();
  const checks = [r.renter.idVerified && t.idDoc, r.renter.licenceVerified && t.licence, r.renter.phoneVerified && t.phone].filter(Boolean) as string[];
  return (
    <View style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, padding: 14, gap: 10, borderRadius: radius.card }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Avatar initials={r.renter.initials} size={40} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt w={800}>{r.renter.name}</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
            {checks.map((c) => (
              <Txt key={c} size={11.5} w={700} c={color.green}>
                ✓ {c}
              </Txt>
            ))}
          </View>
        </View>
      </View>
      <Txt size={13.5} c={color.body}>
        {r.car} · {rangeShort(r.start, r.end, t)} · {r.days} {t.days}
      </Txt>
      {r.note ? (
        <Txt size={13} c={color.body} style={{ fontStyle: 'italic' }}>
          “{r.note}”
        </Txt>
      ) : null}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, borderTopWidth: 1, borderColor: color.line, paddingTop: 10 }}>
        <Txt size={14} c={color.muted}>
          {t.payoutLbl}
        </Txt>
        <Txt size={14} w={800}>
          {fcfa(r.payout)}
        </Txt>
      </View>
      {r.status === 'requested' ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button label={t.decline} variant="outline" height={46} onPress={() => onRespond('decline')} style={{ flex: 1 }} />
          <Button label={t.accept} height={46} onPress={() => onRespond('accept')} style={{ flex: 1 }} />
        </View>
      ) : (
        <Tag label={r.status === 'declined' ? t.declined : t.accepted} bg={r.status === 'declined' ? color.surface : color.greenSoft} fg={r.status === 'declined' ? color.label : color.green} size={13} />
      )}
    </View>
  );
}
