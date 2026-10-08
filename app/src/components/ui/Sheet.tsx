import { X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, radius } from '@/theme/tokens';
import { Txt } from './Txt';

// Bottom sheet over a scrim, orange top edge (offer, checklist, pickers).
export function Sheet({ open, onClose, title, children, height }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; height?: `${number}%` }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable accessibilityLabel="Close" style={{ flex: 1, backgroundColor: color.scrim }} onPress={onClose} />
        <View style={{ backgroundColor: color.bg, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, borderTopWidth: 4, borderColor: color.orange, paddingHorizontal: 16, paddingTop: 18, paddingBottom: insets.bottom + 20, height }}>
          {title ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Txt size={22} w={800}>
                {title}
              </Txt>
              <CloseButton onPress={onClose} />
            </View>
          ) : null}
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function CloseButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onPress} style={{ width: 38, height: 38, borderWidth: 1.5, borderColor: color.ink, backgroundColor: color.white, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center' }}>
      <X size={18} color={color.ink} />
    </Pressable>
  );
}
