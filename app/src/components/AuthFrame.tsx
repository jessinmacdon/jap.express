import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { BackButton, Screen } from '@/components/ui';
import { color } from '@/theme/tokens';

// Shared frame: back button + 4-step progress (sign-up only).
export function AuthFrame({ step, children, footer, onBack }: { step?: number; children: ReactNode; footer?: ReactNode; onBack?: () => void }) {
  return (
    <Screen contentStyle={{ paddingHorizontal: 22, paddingBottom: 28 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4, paddingBottom: 12 }}>
        <BackButton bordered onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))} />
        {step !== undefined ? (
          <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? color.orange : color.line }} />
            ))}
          </View>
        ) : null}
      </View>
      <View style={{ flex: 1, gap: 20 }}>{children}</View>
      {footer ? <View style={{ gap: 12, marginTop: 20 }}>{footer}</View> : null}
    </Screen>
  );
}
