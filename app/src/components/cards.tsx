import { router } from 'expo-router';
import { BadgeCheck, Heart, Star, Truck } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useToggleFavourite } from '@/api/hooks';
import type { AnyCard, RentalCard, SaleCard } from '@/api/types';
import { fcfa, fmt, perDay } from '@/lib/format';
import { useSession } from '@/state/session';
import { color, radius } from '@/theme/tokens';
import { Photo, SellerTypeTag, Tag, Txt } from './ui';

export const carTitle = (c: AnyCard) => (c.kind === 'rent' ? `${c.make} ${c.model} ${c.year}` : `${c.make} ${c.variant}`);
export const openCard = (c: AnyCard) => router.push(c.kind === 'rent' ? `/rental/${c.id}` : `/sale/${c.id}`);

export function HeartButton({ card, size = 38 }: { card: AnyCard; size?: number }) {
  const { token, t } = useSession();
  const fav = useToggleFavourite();
  const on = fav.isFav(card);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.saved}
      accessibilityState={{ selected: on }}
      onPress={(e) => {
        e.stopPropagation();
        if (!token) return router.push('/welcome');
        fav.toggle(card);
      }}
      style={{ width: size, height: size, borderRadius: radius.button, backgroundColor: color.white, alignItems: 'center', justifyContent: 'center' }}>
      <Heart size={size * 0.52} color={on ? color.orange : color.ink} fill={on ? color.orange : 'none'} strokeWidth={2} />
    </Pressable>
  );
}

// Rent results: Turo-style, photo first.
export function RentCard({ c }: { c: RentalCard }) {
  const { t } = useSession();
  return (
    <Pressable accessibilityRole="button" onPress={() => openCard(c)}>
      <Photo uri={c.photos[0]} radius={radius.card} caption={c.model} style={{ height: 216 }}>
        {c.delivery ? (
          <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: color.white, borderRadius: radius.badge, paddingHorizontal: 8, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Truck size={14} color={color.ink} />
            <Txt size={11.5} w={700}>
              {t.deliveryAvail}
            </Txt>
          </View>
        ) : null}
        <View style={{ position: 'absolute', top: 10, right: 10 }}>
          <HeartButton card={c} />
        </View>
        {c.hostVerified ? (
          <View style={{ position: 'absolute', left: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: color.green, borderRadius: radius.badge, paddingHorizontal: 8, paddingVertical: 5 }}>
            <BadgeCheck size={14} color={color.white} strokeWidth={2.2} />
            <Txt size={12} w={800} c={color.white}>
              {t.verified}
            </Txt>
          </View>
        ) : null}
      </Photo>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 12 }}>
        <Txt size={18} w={800} lh={1.2} style={{ flex: 1 }}>
          {carTitle(c)}
        </Txt>
        <Rating rating={c.rating} trips={c.trips} />
      </View>
      <Txt size={13} c={color.muted} style={{ marginTop: 3 }}>
        {c.city} · {c.seats} {t.seatsShort} · {t[c.transmission]}
      </Txt>
      <Txt size={18} w={800} c={color.navy} style={{ marginTop: 6 }}>
        {perDay(c.dailyRate, t)}
      </Txt>
    </Pressable>
  );
}

export function Rating({ rating, trips }: { rating: number; trips: number }) {
  const { t } = useSession();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Star size={15} color={color.orange} fill={color.orange} />
      <Txt size={14} w={700}>
        {rating.toFixed(1)}
      </Txt>
      <Txt size={14} c={color.muted}>
        ({trips} {t.trips})
      </Txt>
    </View>
  );
}

function SaleTags({ c, small }: { c: SaleCard; small?: boolean }) {
  const { t } = useSession();
  const sz = small ? 10.5 : 11;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
      {c.condition === 'new' ? <Tag label={t.brandNew} size={sz} /> : null}
      {c.negotiable && !small ? <Tag label={t.negotiable} bg={color.orangeSoft} fg={color.orangeSoftText} size={sz} /> : null}
      <SellerTypeTag dealer={c.seller.type === 'dealer'} label={t[c.seller.type]} size={sz} />
      {c.seller.verified && !small ? <BadgeCheck size={16} color={color.green} strokeWidth={2.2} /> : null}
    </View>
  );
}

// Buy results, mobile.de list row: data-rich next to a thumbnail.
export function SaleRow({ c }: { c: SaleCard }) {
  const { t } = useSession();
  return (
    <Pressable accessibilityRole="button" onPress={() => openCard(c)} style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: color.line }}>
      <Photo uri={c.photos[0]} radius={radius.input} caption={c.model} style={{ width: 136, height: 118 }}>
        <View style={{ position: 'absolute', top: 6, right: 6 }}>
          <HeartButton card={c} size={30} />
        </View>
      </Photo>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Txt w={800} lh={1.2}>
          {carTitle(c)}
        </Txt>
        <Txt size={12.5} c={color.body}>
          {c.year} · {fmt(c.km)} km
        </Txt>
        <Txt size={12.5} c={color.body}>
          {t[c.fuel]} · {t[c.transmission]}
        </Txt>
        <Txt size={17} w={800} c={color.navy} style={{ marginTop: 4 }}>
          {fcfa(c.price)}
        </Txt>
        <View style={{ marginTop: 3 }}>
          <SaleTags c={c} />
        </View>
        <Txt size={12} c={color.muted} style={{ marginTop: 2 }}>
          {c.city}
        </Txt>
      </View>
    </Pressable>
  );
}

export function SaleGridCard({ c }: { c: SaleCard }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => openCard(c)} style={{ flex: 1, minWidth: 0, gap: 3 }}>
      <Photo uri={c.photos[0]} radius={radius.input} caption={c.model} style={{ height: 118, marginBottom: 6 }} />
      <Txt size={14} w={800} lh={1.2}>
        {carTitle(c)}
      </Txt>
      <Txt size={12} c={color.body}>
        {c.year} · {fmt(c.km)} km
      </Txt>
      <Txt w={800} c={color.navy}>
        {fcfa(c.price)}
      </Txt>
      <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
        <SaleTags c={c} small />
        <Txt size={12} c={color.muted}>
          {c.city}
        </Txt>
      </View>
    </Pressable>
  );
}

// Home "Featured near you" strip (mixed rent + buy).
export function FeaturedCard({ c }: { c: AnyCard }) {
  const { t } = useSession();
  const rent = c.kind === 'rent';
  return (
    <Pressable accessibilityRole="button" onPress={() => openCard(c)} style={{ width: 236, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.button, overflow: 'hidden' }}>
      <Photo uri={c.photos[0]} caption={c.model} style={{ height: 140 }}>
        <View style={{ position: 'absolute', top: 8, left: 8 }}>
          <Tag label={rent ? t.rent : t.buy} bg={rent ? color.navy : color.orange} size={10.5} upper />
        </View>
      </Photo>
      <View style={{ padding: 12, paddingTop: 10, gap: 3 }}>
        <Txt w={800} lh={1.2} numberOfLines={1}>
          {carTitle(c)}
        </Txt>
        <Txt size={14} w={700} c={color.navy}>
          {rent ? perDay(c.dailyRate, t) : fcfa(c.price)}
        </Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Txt size={12} c={color.muted}>
            {c.city}
          </Txt>
          <BadgeCheck size={14} color={color.green} strokeWidth={2.2} />
          <Txt size={12} w={700} c={color.green}>
            {t.verified}
          </Txt>
        </View>
      </View>
    </Pressable>
  );
}

export function SmallSaleCard({ c }: { c: SaleCard }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => openCard(c)} style={{ width: 180, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.button, overflow: 'hidden' }}>
      <Photo uri={c.photos[0]} caption={c.model} style={{ height: 110 }} />
      <View style={{ paddingHorizontal: 10, paddingTop: 8, paddingBottom: 10, gap: 2 }}>
        <Txt size={13.5} w={800} lh={1.2} numberOfLines={2}>
          {carTitle(c)}
        </Txt>
        <Txt size={12} c={color.body}>
          {c.year} · {fmt(c.km)} km
        </Txt>
        <Txt size={14} w={800} c={color.navy}>
          {fcfa(c.price)}
        </Txt>
      </View>
    </Pressable>
  );
}
