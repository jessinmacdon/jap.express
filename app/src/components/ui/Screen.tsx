import { router } from 'expo-router';
import { ChevronLeft, X } from 'lucide-react-native';
import { forwardRef, type ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, View, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useT } from '@/state/session';
import { color, radius } from '@/theme/tokens';
import { Button } from './Button';
import { Txt } from './Txt';

interface Props extends ScrollViewProps {
  children: ReactNode;
  footer?: ReactNode; // sticky bottom bar (Book now, Continue…)
  header?: ReactNode; // sticky top content
  bg?: string;
  noTopInset?: boolean;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

// Phone screen: status-bar inset, scrolling body, optional sticky header/footer.
export const Screen = forwardRef<ScrollView, Props>(function Screen({ children, footer, header, bg = color.bg, noTopInset, scroll = true, contentStyle, ...rest }, ref) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: bg, paddingTop: noTopInset ? 0 : insets.top }}>
      {header}
      {scroll ? (
        <ScrollView ref={ref} style={{ flex: 1 }} contentContainerStyle={[{ flexGrow: 1 }, contentStyle]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} {...rest}>
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
      )}
      {footer ? <View style={{ borderTopWidth: 2, borderColor: color.lineStrong, backgroundColor: color.bg, paddingHorizontal: 16, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 16) + 8 }}>{footer}</View> : null}
    </KeyboardAvoidingView>
  );
});

export function BackButton({ onPress, icon = 'back', bordered, light }: { onPress?: () => void; icon?: 'back' | 'close'; bordered?: boolean; light?: boolean }) {
  const Icon = icon === 'close' ? X : ChevronLeft;
  const fg = light ? color.white : color.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={icon === 'close' ? 'Close' : 'Back'}
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
      style={{ width: bordered ? 42 : 40, height: bordered ? 42 : 40, borderRadius: radius.button, borderWidth: bordered ? 1.5 : 0, borderColor: color.ink, backgroundColor: bordered ? color.white : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={22} color={fg} />
    </Pressable>
  );
}

// "← Title" bar with the strong bottom rule.
export function TopBar({ title, right, onBack, icon, rule = true }: { title?: string; right?: ReactNode; onBack?: () => void; icon?: 'back' | 'close'; rule?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingTop: 6, paddingBottom: 10, borderBottomWidth: rule ? 2 : 0, borderColor: color.lineStrong }}>
      <BackButton onPress={onBack} icon={icon} />
      {title ? (
        <Txt size={20} w={800} style={{ flex: 1 }} numberOfLines={1}>
          {title}
        </Txt>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      {right}
    </View>
  );
}

export function PageTitle({ children }: { children: ReactNode }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
      <Txt size={28} w={800} ls={-0.02}>
        {children}
      </Txt>
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ padding: 40, alignItems: 'center' }}>
      <ActivityIndicator color={color.navy} />
    </View>
  );
}

export function ErrorView({ onRetry }: { onRetry?: () => void }) {
  const { t } = useT();
  return (
    <View style={{ padding: 24, gap: 12 }}>
      <Txt size={15} c={color.body}>
        {t.errNetwork}
      </Txt>
      {onRetry ? <Button label={t.retry} variant="outline" onPress={onRetry} /> : null}
    </View>
  );
}
