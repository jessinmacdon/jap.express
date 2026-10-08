import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { ClipboardList, Heart, House, MessageCircle } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useConversations } from '@/api/hooks';
import { useSession } from '@/state/session';
import { color, radius } from '@/theme/tokens';
import { Txt } from './ui';

// Unified bottom bar for both marketplaces. Hidden routes (results) highlight Home.
const TABS = [
  { name: 'home', key: 'navHome', Icon: House },
  { name: 'saved', key: 'navSaved', Icon: Heart },
  { name: 'activity', key: 'navActivity', Icon: ClipboardList },
  { name: 'inbox', key: 'navInbox', Icon: MessageCircle },
  { name: 'profile', key: 'navProfile', Icon: null },
] as const;

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { t, me, token } = useSession();
  const insets = useSafeAreaInsets();
  const convs = useConversations();
  const hasUnread = !!token && (convs.data?.items.some((c) => c.unread) ?? false);
  const current = state.routes[state.index]?.name;
  const active = current === 'results' ? 'home' : current;

  return (
    <View style={{ flexDirection: 'row', borderTopWidth: 2, borderColor: color.lineStrong, backgroundColor: color.bg, paddingBottom: Math.max(insets.bottom, 12) + 4 }}>
      {TABS.map(({ name, key, Icon }) => {
        const on = active === name;
        const c = on ? color.navy : color.muted;
        return (
          <Pressable
            key={name}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={t[key]}
            onPress={() => navigation.navigate(name)}
            style={{ flex: 1, alignItems: 'center', gap: 4, paddingTop: 9, paddingBottom: 6, borderTopWidth: 3, marginTop: -2, borderColor: on ? color.orange : 'transparent' }}>
            {Icon ? (
              <Icon size={22} color={c} strokeWidth={2} />
            ) : (
              <View style={{ width: 22, height: 22, borderRadius: radius.badge, backgroundColor: c, alignItems: 'center', justifyContent: 'center' }}>
                <Txt size={9.5} w={800} c={color.white}>
                  {me?.initials ?? '•'}
                </Txt>
              </View>
            )}
            {name === 'inbox' && hasUnread ? <View style={{ position: 'absolute', top: 8, left: '50%', marginLeft: 6, width: 9, height: 9, borderRadius: 5, backgroundColor: color.orange }} /> : null}
            <Txt size={11} w={on ? 800 : 600} c={c} numberOfLines={1}>
              {t[key]}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
