import { router } from 'expo-router';
import * as Location from 'expo-location';
import { ArrowRight, Check, LocateFixed, MapPin, X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocations, useMakes, useRentals, useSales } from '@/api/hooks';
import { dateLabel, fmt } from '@/lib/format';
import { SLIDERS, useSearch, type Filters } from '@/state/search';
import { useSession } from '@/state/session';
import { useUi } from '@/state/ui';
import { color, font, radius } from '@/theme/tokens';
import { Calendar, Chip, CloseButton, Label, nextRange, RangeSlider, Segmented, SelectField, ToggleRow, Txt } from './ui';

const Section = ({ children, gap = 10, last }: { children: React.ReactNode; gap?: number; last?: boolean }) => (
  <View style={{ padding: 16, paddingBottom: last ? 24 : 16, borderBottomWidth: last ? 0 : 1, borderColor: color.line, gap }}>{children}</View>
);

// The one search & filter sheet (AutoScout24-style), opened from Home, results
// and listing pages. Location first; Rent shows dates/delivery/daily rate,
// Buy shows price, year, mileage, condition and seller type.
export function FilterSheet() {
  const { t, lang } = useSession();
  const s = useSearch();
  const { sheetOpen, closeSheet, showToast } = useUi();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [datesOpen, setDatesOpen] = useState(false);
  const locs = useLocations(q);
  const makes = useMakes().data?.makes ?? {};
  const isRent = s.mode === 'rent';
  const rentQ = useRentals(s.query(), sheetOpen && isRent);
  const saleQ = useSales(s.query(), sheetOpen && !isRent);
  const count = ((isRent ? rentQ : saleQ).data?.items.length) ?? 0;
  const f = s.f;
  const any = { v: 'any', l: t.any };
  const years = Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => String(new Date().getFullYear() - i));

  const useMyLocation = async () => {
    const perm = await Location.requestForegroundPermissionsAsync().catch(() => null);
    if (!perm?.granted) return showToast(t.locDenied);
    // TODO: reverse-geocode the position to the nearest supported area.
    s.setPlace({ id: 'current', en: `${t.currentLoc} · Akwa, Douala`, fr: `Position actuelle · Akwa, Douala`, city: 'Douala' });
    setQ('');
  };

  const apply = () => {
    closeSheet();
    router.push('/results');
  };

  return (
    <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={closeSheet}>
      <Pressable style={{ height: '10%', backgroundColor: color.scrim }} onPress={closeSheet} />
      <View style={{ flex: 1, backgroundColor: color.bg, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, paddingHorizontal: 16, borderBottomWidth: 2, borderColor: color.lineStrong }}>
          <CloseButton onPress={closeSheet} />
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <Txt size={21} w={800}>
              {t.filters}
            </Txt>
            <Txt size={13} w={800} c={color.orangeText}>
              {isRent ? t.rent : t.buy}
            </Txt>
          </View>
          <Pressable onPress={s.resetFilters}>
            <Txt size={14} w={800} c={color.navy} style={{ textDecorationLine: 'underline' }}>
              {t.reset}
            </Txt>
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          <Section>
            <Label>{t.location}</Label>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 50, borderWidth: 2, borderColor: color.ink, backgroundColor: color.white, borderRadius: radius.input, paddingLeft: 12, paddingRight: 8 }}>
              <MapPin size={18} color={color.navy} />
              <TextInput value={q} onChangeText={setQ} placeholder={t.locPh} placeholderTextColor={color.faint} style={{ flex: 1, minWidth: 0, fontFamily: font.regular, fontSize: 15, color: color.ink, outlineStyle: 'none' } as never} />
              {s.place || q ? (
                <Pressable
                  accessibilityLabel="Clear"
                  onPress={() => {
                    s.setPlace(null);
                    setQ('');
                  }}
                  style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} color={color.muted} />
                </Pressable>
              ) : null}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Check size={16} color={color.green} strokeWidth={2.5} />
              <Txt size={14} w={800} c={color.navy}>
                {s.place ? s.place[lang] : t.allOfCameroon}
              </Txt>
            </View>
            <Pressable onPress={useMyLocation} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderColor: color.line }}>
              <LocateFixed size={18} color={color.orangeText} />
              <Txt size={14} w={800} c={color.orangeText}>
                {t.useMyLoc}
              </Txt>
            </Pressable>
            {(locs.data?.items ?? []).map((l) => (
              <Pressable
                key={l.id}
                onPress={() => {
                  s.setPlace({ id: l.id, en: l.en, fr: l.fr, city: l.city });
                  setQ('');
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderColor: color.line }}>
                <MapPin size={16} color={color.muted} />
                <View style={{ flex: 1 }}>
                  <Txt size={14} w={700}>
                    {l[lang]}
                  </Txt>
                  <Txt size={12} c={color.muted}>
                    {l.sub}
                  </Txt>
                </View>
              </Pressable>
            ))}
          </Section>

          {isRent ? (
            <>
              <Section>
                <Label>{t.rentalDates}</Label>
                <Pressable onPress={() => setDatesOpen((o) => !o)} style={{ flexDirection: 'row', borderWidth: 1.5, borderColor: color.ink, backgroundColor: color.white, borderRadius: radius.input, overflow: 'hidden' }}>
                  <View style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 10 }}>
                    <Txt size={11} c={color.muted}>
                      {t.pickup}
                    </Txt>
                    <Txt w={800}>{dateLabel(s.start, t)}</Txt>
                  </View>
                  <View style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 10, borderLeftWidth: 1.5, borderColor: color.ink }}>
                    <Txt size={11} c={color.muted}>
                      {t.ret}
                    </Txt>
                    <Txt w={800}>{s.end ? dateLabel(s.end, t) : '—'}</Txt>
                  </View>
                </Pressable>
                {datesOpen ? (
                  <Calendar
                    mode="range"
                    start={s.start}
                    end={s.end}
                    cellHeight={38}
                    onPick={(d) => {
                      const [a, b] = nextRange(d, s.start, s.end, []);
                      s.setDates(a, b);
                      if (b) setDatesOpen(false);
                    }}
                  />
                ) : null}
              </Section>
              <Section>
                <ToggleRow title={t.deliveryAvail} sub={t.deliveryAvailSub} on={f.deliv} onPress={() => s.setF('deliv', !f.deliv)} />
              </Section>
              <Slider label={t.dailyRate} k="rate" text={`${fmt(f.rate[0])} – ${fmt(f.rate[1])} FCFA`} />
            </>
          ) : (
            <Slider label={t.price} k="price" text={`${fmt(f.price[0])} – ${fmt(f.price[1])} FCFA`} />
          )}

          <View style={{ padding: 16, borderBottomWidth: 1, borderColor: color.line, flexDirection: 'row', gap: 10 }}>
            <SelectField label={t.make} value={f.make} options={[any, ...Object.keys(makes).map((m) => ({ v: m, l: m }))]} onChange={(v) => s.setF('make', v)} />
            <SelectField label={t.model} value={f.model} options={[any, ...(f.make === 'any' ? [] : (makes[f.make] ?? []).map((m) => ({ v: m, l: m })))]} onChange={(v) => s.setF('model', v)} />
          </View>

          {!isRent ? (
            <>
              <Section gap={8}>
                <Label>{t.year}</Label>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <SelectField label={t.from} value={String(f.yMin)} options={['2005', ...years].map((y) => ({ v: y, l: y }))} onChange={(v) => s.setF('yMin', +v)} />
                  <SelectField label={t.to} value={String(f.yMax)} options={years.map((y) => ({ v: y, l: y }))} onChange={(v) => s.setF('yMax', +v)} />
                </View>
              </Section>
              <Slider label={t.mileage} k="km" text={`${fmt(f.km[0])} – ${fmt(f.km[1])} km`} />
            </>
          ) : null}

          <Section gap={8}>
            <Label>{t.transmission}</Label>
            <Segmented options={[['any', t.any], ['auto', t.auto], ['manual', t.manual]]} value={f.trans} onChange={(v) => s.setF('trans', v)} />
          </Section>
          <Section gap={8}>
            <Label>{t.fuel}</Label>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {(['petrol', 'diesel', 'hybrid', 'electric'] as const).map((k) => (
                <Chip key={k} label={t[k]} on={f.fuel.includes(k)} onPress={() => s.toggleIn('fuel', k)} />
              ))}
            </View>
          </Section>
          <Section gap={8} last={isRent}>
            <Label>{t.seats}</Label>
            <Segmented options={[['any', t.any], ['2', '2'], ['5', '4–5'], ['7', '7+']]} value={f.seats} onChange={(v) => s.setF('seats', v)} />
          </Section>
          {!isRent ? (
            <>
              <Section gap={8}>
                <Label>{t.condition}</Label>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {(['new', 'excellent', 'good', 'fair'] as const).map((k) => (
                    <Chip key={k} label={t[k]} on={f.cond.includes(k)} onPress={() => s.toggleIn('cond', k)} />
                  ))}
                </View>
              </Section>
              <Section gap={8} last>
                <Label>{t.sellerType}</Label>
                <Segmented options={[['any', t.any], ['private', t.private], ['dealer', t.dealer]]} value={f.seller} onChange={(v) => s.setF('seller', v)} />
              </Section>
            </>
          ) : null}
        </ScrollView>

        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 18, borderTopWidth: 2, borderColor: color.lineStrong }}>
          <Pressable accessibilityRole="button" onPress={apply} style={({ pressed }) => ({ height: 54, borderRadius: radius.button, backgroundColor: pressed ? color.orangePressed : color.orange, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 })}>
            <Txt size={16} w={800} c={color.white}>
              {t.show} {count} {count === 1 ? t.car : t.cars}
            </Txt>
            <ArrowRight size={20} color={color.white} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Slider({ label, k, text }: { label: string; k: 'rate' | 'price' | 'km'; text: string }) {
  const s = useSearch();
  const [min, max, step] = SLIDERS[k];
  return (
    <View style={{ padding: 16, paddingBottom: 20, borderBottomWidth: 1, borderColor: color.line, gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, alignItems: 'baseline' }}>
        <Label>{label}</Label>
        <Txt size={14} w={800}>
          {text}
        </Txt>
      </View>
      <RangeSlider min={min} max={max} step={step} value={s.f[k] as Filters['rate']} onChange={(v) => s.setF(k, v)} />
    </View>
  );
}
