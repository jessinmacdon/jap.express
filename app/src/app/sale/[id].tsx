import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { MessageCircle, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ApiError, post } from '@/api/client';
import { openConversation, useSale } from '@/api/hooks';
import { carTitle, HeartButton, SmallSaleCard } from '@/components/cards';
import { Carousel } from '@/components/Carousel';
import { SpotCard } from '@/components/places';
import { SearchContextCard } from '@/components/search';
import { Translatable } from '@/components/Translatable';
import { Avatar, Button, Chip, ErrorView, Field, Hair, KV, Label, Loading, Note, Rule, Screen, SellerTypeTag, Sheet, Tag, Txt, Verified } from '@/components/ui';
import { fcfa, fmt } from '@/lib/format';
import { useSession } from '@/state/session';
import { useUi } from '@/state/ui';
import { color } from '@/theme/tokens';

const COLORS: Record<string, [string, string]> = { silver: ['Silver', 'Argent'], black: ['Black', 'Noir'], white: ['White', 'Blanc'], red: ['Red', 'Rouge'], blue: ['Blue', 'Bleu'], grey: ['Grey', 'Gris'] };
const round50k = (n: number) => Math.round(n / 50_000) * 50_000;

export default function SaleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang, token, me } = useSession();
  const { showToast } = useUi();
  const qc = useQueryClient();
  const q = useSale(id);
  const c = q.data;
  const [offerOpen, setOfferOpen] = useState(false);
  const [offer, setOffer] = useState(0);
  const [sending, setSending] = useState(false);
  const [now] = useState(() => Date.now());

  if (q.isLoading) return <Screen><Loading /></Screen>;
  if (!c) return <Screen><ErrorView onRetry={() => q.refetch()} /></Screen>;
  const own = me?.id === c.seller.id;

  const daysAgo = Math.max(0, Math.round((now - new Date(c.createdAt).getTime()) / 86_400_000));
  const listed = lang === 'fr' ? `Publiée il y a ${daysAgo} j · ${c.views} vues` : `Listed ${daysAgo} day${daysAgo === 1 ? '' : 's'} ago · ${c.views} views`;

  const needAuth = () => {
    if (token) return false;
    router.push('/welcome');
    return true;
  };

  const message = async () => {
    if (needAuth()) return;
    try {
      const conv = await openConversation('sale', c.id);
      router.push({ pathname: '/chat/[id]', params: { id: conv.id } });
    } catch {
      showToast(t.errGeneric);
    }
  };

  const sendOffer = async () => {
    if (offer >= c.price) return showToast(t.offerAbove);
    setSending(true);
    try {
      const r = await post<{ conversationId: string }>(`/sales/${c.id}/offers`, { amount: offer, lang });
      setOfferOpen(false);
      qc.invalidateQueries({ queryKey: ['offers'] });
      showToast(`${t.offerSent} ${c.seller.name}`);
      router.push({ pathname: '/chat/[id]', params: { id: r.conversationId } });
    } catch (e) {
      showToast(e instanceof ApiError && e.code === 'offer_above_price' ? t.offerAbove : t.errGeneric);
    } finally {
      setSending(false);
    }
  };

  const specs: [string, string][] = [
    [t.make, c.make],
    [t.model, c.variant],
    [t.year, String(c.year)],
    [t.mileage, `${fmt(c.km)} km`],
    [t.fuel, t[c.fuel]],
    [t.transmission, t[c.transmission]],
    [t.colour, (COLORS[c.color] ?? [c.color, c.color])[lang === 'fr' ? 1 : 0]],
    [t.condition, t[c.condition]],
    [t.seats, String(c.seats)],
  ];

  const footer = own ? null : (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Button label={t.messageSeller} variant="navy" icon={<MessageCircle size={18} color={color.white} />} onPress={message} height={54} style={{ flex: 1 }} />
      <Button
        label={t.makeOffer}
        onPress={() => {
          if (needAuth()) return;
          setOffer(round50k(c.price * 0.93));
          setOfferOpen(true);
        }} height={54} style={{ flex: 1 }} />
    </View>
  );

  return (
    <Screen footer={footer}>
      <SearchContextCard />
      <Carousel photos={c.photos} label={c.model} height={290} right={<HeartButton card={{ ...c, seller: { type: c.seller.sellerType, verified: c.seller.verified, name: c.seller.name } }} size={40} />} />

      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Txt size={30} w={800} c={color.navy} ls={-0.02}>
            {fcfa(c.price)}
          </Txt>
          {c.condition === 'new' ? <Tag label={t.brandNew} size={12} /> : null}
          {c.negotiable ? <Tag label={t.negotiable} bg={color.orangeSoft} fg={color.orangeSoftText} size={12} /> : null}
        </View>
        <Txt size={22} w={800} lh={1.15} ls={-0.01} style={{ marginTop: 8 }}>
          {carTitle({ ...c, kind: 'sale', seller: { type: c.seller.sellerType, verified: c.seller.verified, name: c.seller.name } })}
        </Txt>
        <Txt size={14} c={color.body} style={{ marginTop: 4 }}>
          {c.year} · {fmt(c.km)} km · {c.city}
        </Txt>
        <Txt size={12} c={color.muted} style={{ marginTop: 6 }}>
          {listed}
        </Txt>
      </View>

      <View style={{ flexDirection: 'row', borderTopWidth: 2, borderBottomWidth: 2, borderColor: color.lineStrong }}>
        {[
          [t.year, String(c.year)],
          [t.mileage, `${fmt(c.km)} km`],
          [t.fuel, t[c.fuel]],
          [t.gearbox, t[c.transmission]],
        ].map(([k, v], i) => (
          <View key={k} style={{ flex: 1, minWidth: 0, paddingHorizontal: 10, paddingVertical: 12, gap: 4, borderLeftWidth: i ? 1 : 0, borderColor: color.line }}>
            <Txt size={11} c={color.muted}>
              {k}
            </Txt>
            <Txt size={14} w={800}>
              {v}
            </Txt>
          </View>
        ))}
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 8 }}>
        <Label style={{ marginBottom: 6 }}>{t.techData}</Label>
        {specs.map(([k, v]) => (
          <KV key={k} k={k} v={v} />
        ))}
      </View>

      <Translatable label={t.description} d={c.description} />

      <Rule />
      <View style={{ padding: 16, gap: 12 }}>
        <View>
          <Txt size={18} w={800}>
            {t.viewT}
          </Txt>
          <Txt size={13} c={color.muted} style={{ marginTop: 2 }}>
            {t.viewSub}
          </Txt>
        </View>
        <SpotCard spot={c.viewing} address={c.viewing.address} height={160} />
      </View>

      <Rule />
      <View style={{ padding: 16, paddingVertical: 18, gap: 12 }}>
        <Label>{t.seller}</Label>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Avatar initials={c.seller.initials} size={56} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt size={17} w={800}>
              {c.seller.name}
            </Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              <SellerTypeTag dealer={c.seller.sellerType === 'dealer'} label={t[c.seller.sellerType]} size={12} />
              {c.seller.verified ? <Verified label={t.verified} /> : null}
            </View>
          </View>
        </View>
        <Txt size={13} c={color.body} lh={1.5}>
          {t.memberSince} {c.seller.memberSince}
          {'\n'}
          {c.seller.activeListings} {t.activeListings}
          {c.seller.area ? ` · ${c.seller.area}` : ''}
        </Txt>
        <Note icon={<ShieldCheck size={22} color={color.navy} />}>{t.safety}</Note>
      </View>

      {c.similar.length ? (
        <>
          <Rule />
          <View style={{ paddingTop: 18, paddingBottom: 24 }}>
            <Label style={{ paddingHorizontal: 16, paddingBottom: 12 }}>{t.similar}</Label>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
              {c.similar.map((x) => (
                <SmallSaleCard key={x.id} c={x} />
              ))}
            </ScrollView>
          </View>
        </>
      ) : null}

      <Sheet open={offerOpen} onClose={() => setOfferOpen(false)} title={t.makeOffer}>
        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 12 }}>
            <Txt size={14} c={color.muted}>
              {t.asking}
            </Txt>
            <Txt size={14} w={800}>
              {fcfa(c.price)}
            </Txt>
          </View>
          <Hair style={{ marginTop: -14 }} />
          <Field label={t.yourOffer} value={fmt(offer)} onChangeText={(v) => setOffer(+(v.replace(/\D/g, '') || 0))} inputMode="numeric" keyboardType="number-pad" big suffix={<Txt w={800}>FCFA</Txt>} height={56} />
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[5, 10, 15].map((p) => (
              <Chip key={p} label={`−${p}%`} onPress={() => setOffer(round50k(c.price * (1 - p / 100)))} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <Button label={t.cancel} variant="outline" onPress={() => setOfferOpen(false)} style={{ flex: 1 }} />
            <Button label={t.sendOffer} onPress={sendOffer} loading={sending} disabled={offer <= 0} style={{ flex: 2 }} />
          </View>
        </View>
      </Sheet>
    </Screen>
  );
}
