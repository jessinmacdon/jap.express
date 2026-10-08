import { router } from 'expo-router';
import { ArrowRight, BadgeCheck, Heart } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useFavourites, useToggleFavourite } from '@/api/hooks';
import type { AnyCard } from '@/api/types';
import { carTitle, openCard } from '@/components/cards';
import { Button, Chip, EmptyState, Loading, PageTitle, Photo, Screen, Tag, Txt } from '@/components/ui';
import { fcfa, fmt, perDay } from '@/lib/format';
import { useSearch } from '@/state/search';
import { useSession } from '@/state/session';
import { color, radius } from '@/theme/tokens';

// Rentals and cars for sale saved together, filterable.
export default function Saved() {
  const { t } = useSession();
  const s = useSearch();
  const favs = useFavourites();
  const fav = useToggleFavourite();
  const [filter, setFilter] = useState<'all' | 'rent' | 'sale'>('all');
  const items = (favs.data?.items ?? []).filter((c) => filter === 'all' || c.kind === filter);
  const browse = (mode: 'rent' | 'buy') => {
    s.setMode(mode);
    router.push('/results');
  };

  return (
    <Screen>
      <PageTitle>{t.savedTitle}</PageTitle>
      <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 2, borderColor: color.lineStrong }}>
        {(
          [
            ['all', t.all],
            ['rent', t.rent],
            ['sale', t.buy],
          ] as const
        ).map(([k, l]) => (
          <Chip key={k} label={l} on={filter === k} onPress={() => setFilter(k)} />
        ))}
      </View>
      {favs.isLoading ? <Loading /> : null}
      {favs.isSuccess && items.length === 0 ? (
        <EmptyState icon={<Heart size={28} color={color.navy} />} title={t.savedEmptyT} sub={t.savedEmptyS}>
          <Button label={t.findRental} trailing={<ArrowRight size={18} color={color.white} />} onPress={() => browse('rent')} height={46} />
          <Button label={t.browseSale} variant="outline" onPress={() => browse('buy')} height={46} />
        </EmptyState>
      ) : null}
      {items.map((c) => (
        <SavedRow key={`${c.kind}:${c.id}`} c={c} onUnsave={() => fav.toggle(c)} />
      ))}
    </Screen>
  );
}

function SavedRow({ c, onUnsave }: { c: AnyCard; onUnsave: () => void }) {
  const { t } = useSession();
  const rent = c.kind === 'rent';
  return (
    <Pressable accessibilityRole="button" onPress={() => openCard(c)} style={{ flexDirection: 'row', gap: 12, paddingVertical: 14, paddingLeft: 16, paddingRight: 8, borderBottomWidth: 1, borderColor: color.line, alignItems: 'flex-start' }}>
      <Photo uri={c.photos[0]} radius={radius.input} style={{ width: 120, height: 90 }}>
        <View style={{ position: 'absolute', top: 6, left: 6 }}>
          <Tag label={rent ? t.rent : t.buy} bg={rent ? color.navy : color.orange} size={10} upper />
        </View>
      </Photo>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Txt w={800} lh={1.2}>
          {carTitle(c)}
        </Txt>
        <Txt size={12.5} c={color.muted}>
          {rent ? `${c.city} · ★ ${c.rating.toFixed(1)}` : `${c.year} · ${fmt(c.km)} km · ${c.city}`}
        </Txt>
        <Txt w={800} c={color.navy} style={{ marginTop: 2 }}>
          {rent ? perDay(c.dailyRate, t) : fcfa(c.price)}
        </Txt>
        <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
          <BadgeCheck size={14} color={color.green} strokeWidth={2.2} />
          <Txt size={12} w={700} c={color.green}>
            {t.verified}
          </Txt>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.savedRemoved}
        onPress={(e) => {
          e.stopPropagation();
          onUnsave();
        }}
        style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
        <Heart size={20} color={color.orange} fill={color.orange} />
      </Pressable>
    </Pressable>
  );
}
