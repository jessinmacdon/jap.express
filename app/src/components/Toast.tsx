import { Check } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUi } from '@/state/ui';
import { color, radius } from '@/theme/tokens';
import { Txt } from './ui';

export function Toast() {
  const { toast } = useUi();
  const insets = useSafeAreaInsets();
  if (!toast) return null;
  return (
    <View pointerEvents="none" accessibilityLiveRegion="polite" style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 96, zIndex: 40, backgroundColor: color.ink, paddingHorizontal: 16, paddingVertical: 14, borderRadius: radius.button, flexDirection: 'row', gap: 10, alignItems: 'center', shadowColor: '#0B1424', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 12 }, elevation: 8 }}>
      <Check size={18} color={color.orange} strokeWidth={2.5} />
      <Txt size={14} w={700} c={color.white} style={{ flex: 1 }}>
        {toast}
      </Txt>
    </View>
  );
}
