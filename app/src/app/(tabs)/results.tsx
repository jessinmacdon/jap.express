import { ArrowRight, LayoutGrid, List, SearchX } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRentals, useSales } from '@/api/hooks';
import { RentCard, SaleGridCard, SaleRow } from '@/components/cards';
import { SearchBar } from '@/components/search';
import { Button, Chip, EmptyState, ErrorView, Loading, Screen, Txt } from '@/components/ui';
import { useSearch } from '@/state/search';
import { useSession } from '@/state/session';
import { useUi } from '@/state/ui';
import { color } from '@/theme/tokens';

export default function Results() {
  const { t } = useSession();
  const s = useSearch();
  const { openSheet } = useUi();
  const [grid, setGrid] = useState(false);
  const isRent = s.mode === 'rent';
  const rentQ = useRentals(s.query(), isRent);
  const saleQ = useSales(s.query(), !isRent);
  const q = isRent ? rentQ : saleQ;
  const n = q.data?.items.length ?? 0;
  const f = s.f;

  const quick: [string, boolean, () => void][] = isRent
    ? [
        [t.chipDeliv, f.deliv, () => s.setF('deliv', !f.deliv)],
        [t.chipAuto, f.trans === 'auto', () => s.setF('trans', f.trans === 'auto' ? 'any' : 'auto')],
        [t.chip7, f.seats === '7', () => s.setF('seats', f.seats === '7' ? 'any' : '7')],
      ]
    : [
        [t.chipNew, f.cond.includes('new'), () => s.toggleIn('cond', 'new')],
        [t.chipEV, f.fuel.includes('electric'), () => s.toggleIn('fuel', 'electric')],
        [t.chipAuto, f.trans === 'auto', () => s.setF('trans', f.trans === 'auto' ? 'any' : 'auto')],
        [t.chipDealer, f.seller === 'dealer', () => s.setF('seller', f.seller === 'dealer' ? 'any' : 'dealer')],
      ];

  const header = (
    <View style={{ paddingHorizontal: 12, paddingTop: 4, paddingBottom: 10, gap: 10, borderBottomWidth: 2, borderColor: color.lineStrong, backgroundColor: color.bg }}>
      <SearchBar />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        <Chip size="sm" dark label={t.filters + (s.filterCount ? ` · ${s.filterCount}` : '')} onPress={openSheet} />
        {quick.map(([label, on, go]) => (
          <Chip key={label} size="sm" label={label} on={on} onPress={go} />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <Screen header={header}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
        <Txt w={800}>{isRent ? `${n} ${t.carsAvail}` : `${n} ${t.listingsN}`}</Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Txt size={13} c={color.muted}>
            {t.sortRec}
          </Txt>
          {!isRent ? (
            <Pressable accessibilityRole="button" accessibilityLabel={grid ? 'List' : 'Grid'} onPress={() => setGrid((g) => !g)} hitSlop={8}>
              {grid ? <List size={18} color={color.ink} /> : <LayoutGrid size={18} color={color.ink} />}
            </Pressable>
          ) : null}
        </View>
      </View>

      {q.isLoading ? <Loading /> : q.isError ? <ErrorView onRetry={() => q.refetch()} /> : null}

      {q.isSuccess && n === 0 ? (
        <EmptyState icon={<SearchX size={28} color={color.navy} />} title={t.noResTitle} sub={t.noResSub}>
          <Button label={t.clearFilters} onPress={s.resetFilters} trailing={<ArrowRight size={18} color={color.white} />} height={46} />
          <Button label={t.editSearch2} variant="outline" onPress={openSheet} height={46} />
        </EmptyState>
      ) : null}

      {isRent ? (
        <View style={{ gap: 28, paddingHorizontal: 16, paddingBottom: 28 }}>
          {(rentQ.data?.items ?? []).map((c) => (
            <RentCard key={c.id} c={c} />
          ))}
        </View>
      ) : grid ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingBottom: 24, rowGap: 16, columnGap: 10 }}>
          {(saleQ.data?.items ?? []).map((c) => (
            <View key={c.id} style={{ width: '48%' }}>
              <SaleGridCard c={c} />
            </View>
          ))}
        </View>
      ) : (
        <View style={{ paddingBottom: 16, borderTopWidth: n ? 1 : 0, borderColor: color.line }}>
          {(saleQ.data?.items ?? []).map((c) => (
            <SaleRow key={c.id} c={c} />
          ))}
        </View>
      )}
    </Screen>
  );
}
