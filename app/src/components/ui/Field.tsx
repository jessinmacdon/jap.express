import { ChevronDown, Check } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View, type TextInputProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, font, radius } from '@/theme/tokens';
import { Txt } from './Txt';

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <Txt size={13} w={700} c={color.body}>
      {children}
    </Txt>
  );
}

interface FieldProps extends TextInputProps {
  label?: string;
  prefix?: ReactNode; // e.g. "+237" or a MoMo badge
  suffix?: ReactNode; // e.g. "km", "FCFA"
  big?: boolean; // price inputs: 20/800 navy
  height?: number;
}

export function Field({ label, prefix, suffix, big, height = 52, style, multiline, ...rest }: FieldProps) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <View style={{ flexDirection: 'row', alignItems: 'stretch', minHeight: height, borderWidth: 1.5, borderColor: focus ? color.orange : color.ink, backgroundColor: color.white, borderRadius: radius.button, overflow: 'hidden' }}>
        {prefix ? <View style={{ justifyContent: 'center', paddingHorizontal: 12, borderRightWidth: 1.5, borderColor: color.ink, flexDirection: 'row', alignItems: 'center', gap: 8 }}>{typeof prefix === 'string' ? <Txt w={800}>{prefix}</Txt> : prefix}</View> : null}
        <TextInput
          placeholderTextColor={color.faint}
          onFocus={(e) => {
            setFocus(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            rest.onBlur?.(e);
          }}
          multiline={multiline}
          style={[
            {
              flex: 1,
              minWidth: 0,
              paddingHorizontal: 14,
              paddingVertical: multiline ? 12 : 0,
              minHeight: multiline ? 76 : undefined,
              textAlignVertical: multiline ? 'top' : 'center',
              fontFamily: big ? font.heavy : font.semibold,
              fontSize: big ? 20 : 16,
              color: big ? color.navy : color.ink,
              outlineStyle: 'none',
            } as never,
            style,
          ]}
          {...rest}
        />
        {suffix ? <View style={{ justifyContent: 'center', paddingHorizontal: 12 }}>{typeof suffix === 'string' ? <Txt size={13} c={color.muted} w={800}>{suffix}</Txt> : suffix}</View> : null}
      </View>
    </View>
  );
}

// Native <select> stand-in: tap opens a sheet with the options.
export function SelectField<T extends string>({ label, value, options, onChange, height = 46 }: { label?: string; value: T; options: { v: T; l: string }[]; onChange: (v: T) => void; height?: number }) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const cur = options.find((o) => o.v === value);
  return (
    <View style={{ gap: 5, flex: 1, minWidth: 0 }}>
      {label ? (
        <Txt size={12} c={color.body}>
          {label}
        </Txt>
      ) : null}
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => setOpen(true)} style={{ height, borderWidth: 1.5, borderColor: color.ink, backgroundColor: color.white, borderRadius: radius.input, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Txt size={15} w={700} numberOfLines={1} style={{ flex: 1 }}>
          {cur?.l ?? '—'}
        </Txt>
        <ChevronDown size={18} color={color.ink} />
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: color.scrim }} onPress={() => setOpen(false)} />
        <View style={{ backgroundColor: color.bg, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, borderTopWidth: 4, borderColor: color.orange, maxHeight: '60%', paddingBottom: insets.bottom + 12 }}>
          {label ? (
            <Txt size={18} w={800} style={{ padding: 16 }}>
              {label}
            </Txt>
          ) : null}
          <ScrollView>
            {options.map((o) => (
              <Pressable
                key={o.v}
                onPress={() => {
                  onChange(o.v);
                  setOpen(false);
                }}
                style={{ paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderColor: color.line, flexDirection: 'row', alignItems: 'center' }}>
                <Txt size={16} w={o.v === value ? 800 : 400} style={{ flex: 1 }}>
                  {o.l}
                </Txt>
                {o.v === value ? <Check size={18} color={color.orange} strokeWidth={3} /> : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
