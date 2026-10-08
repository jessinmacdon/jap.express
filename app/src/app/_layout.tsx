import { Archivo_400Regular, Archivo_600SemiBold, Archivo_700Bold, Archivo_800ExtraBold, useFonts } from '@expo-google-fonts/archivo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FilterSheet } from '@/components/FilterSheet';
import { Toast } from '@/components/Toast';
import { SearchProvider } from '@/state/search';
import { SessionProvider, useSession } from '@/state/session';
import { UiProvider } from '@/state/ui';
import { color } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });

function Shell() {
  const { ready, token } = useSession();
  const [fontsLoaded] = useFonts({ Archivo_400Regular, Archivo_600SemiBold, Archivo_700Bold, Archivo_800ExtraBold });
  const loaded = ready && fontsLoaded;
  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => undefined);
  }, [loaded]);
  if (!loaded) return null;
  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg } }}>
        <Stack.Protected guard={!token}>
          <Stack.Screen name="welcome" />
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={!!token}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="checkout/[id]" />
          <Stack.Screen name="chat/[id]" />
          <Stack.Screen name="list" />
          <Stack.Screen name="host-intro" />
          <Stack.Screen name="add-listing" />
        </Stack.Protected>
      </Stack>
      {token ? <FilterSheet /> : null}
      <Toast />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <SearchProvider>
            <UiProvider>
              <Shell />
            </UiProvider>
          </SearchProvider>
        </SessionProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
