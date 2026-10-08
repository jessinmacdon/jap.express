import { Tabs } from 'expo-router/js-tabs';
import { TabBar } from '@/components/TabBar';
import { color } from '@/theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: color.bg } }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="saved" />
      <Tabs.Screen name="activity" />
      <Tabs.Screen name="inbox" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="results" options={{ href: null }} />
    </Tabs>
  );
}
