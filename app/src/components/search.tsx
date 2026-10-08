import { router } from 'expo-router';
import { ChevronLeft, MapPin, SlidersHorizontal } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { rangeShort } from '@/lib/format';
import { useSearch } from '@/state/search';
import { useSession } from '@/state/session';
import { useUi } from '@/state/ui';
import { color, radius } from '@/theme/tokens';
import { Txt } from './ui';

export function useSearchContext() {
  const { t, lang } = useSession();
  const s = useSearch();
  const loc = s.place ? s.place[lang] : t.allOfCameroon;
  const sub = s.mode === 'rent' ? (s.end ? rangeShort(s.start, s.end, t) : t.selectReturn) : t.buySub;
  return { loc, sub };
}

// Results header (Skyscanner-style): back · location & dates · filters.
export function SearchBar() {
  const { loc, sub } = useSearchContext();
  const { filterCount } = useSearch();
  const { openSheet } = useUi();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: color.navy, borderRadius: radius.button, overflow: 'hidden' }}>
      <Pressable accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))} style={{ width: 44, height: 56, alignItems: 'center', justifyContent: 'center' }}>
        <ChevronLeft size={22} color={color.white} />
      </Pressable>
      <Pressable accessibilityRole="button" onPress={openSheet} style={{ flex: 1, minWidth: 0, height: 56, justifyContent: 'center', paddingHorizontal: 6 }}>
        <Txt w={800} c={color.white} numberOfLines={1}>
          {loc}
        </Txt>
        <Txt size={12} c="rgba(255,255,255,.82)" numberOfLines={1}>
          {sub}
        </Txt>
      </Pressable>
      <View style={{ width: 1, height: 28, backgroundColor: 'rgba(255,255,255,.35)' }} />
      <Pressable accessibilityLabel="Filters" onPress={openSheet} style={{ width: 48, height: 56, alignItems: 'center', justifyContent: 'center' }}>
        <SlidersHorizontal size={20} color={color.white} />
        {filterCount ? (
          <View style={{ position: 'absolute', top: 8, right: 6, minWidth: 18, height: 18, borderRadius: radius.badge, backgroundColor: color.orange, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
            <Txt size={11} w={800} c={color.white}>
              {filterCount}
            </Txt>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

// Compact "where / when · Edit" card at the top of listing pages.
export function SearchContextCard() {
  const { t } = useSession();
  const { loc, sub } = useSearchContext();
  const { openSheet } = useUi();
  return (
    <View style={{ paddingHorizontal: 12, paddingTop: 2, paddingBottom: 10 }}>
      <Pressable accessibilityRole="button" onPress={openSheet} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: color.white, borderWidth: 1.5, borderColor: color.ink, borderRadius: radius.button }}>
        <MapPin size={18} color={color.navy} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt size={14} w={800} numberOfLines={1}>
            {loc}
          </Txt>
          <Txt size={12} c={color.muted}>
            {sub}
          </Txt>
        </View>
        <Txt size={13} w={800} c={color.orangeText}>
          {t.editSearch}
        </Txt>
      </Pressable>
    </View>
  );
}
