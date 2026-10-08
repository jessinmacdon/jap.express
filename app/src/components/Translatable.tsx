import { Languages } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import type { Description } from '@/api/types';
import { useSession } from '@/state/session';
import { color } from '@/theme/tokens';
import { Label, Txt } from './ui';

// Listing description in the author's language with an inline "Translate listing".
export function Translatable({ label, d }: { label: string; d: Description | null }) {
  const { t } = useSession();
  const [tr, setTr] = useState(false);
  if (!d) return null;
  const canTr = !!d.translation;
  const showing = tr && d.translation ? d.translation.text : d.text;
  return (
    <View style={{ padding: 16, paddingVertical: 18, gap: 10 }}>
      <Label>{label}</Label>
      <Txt size={15} lh={1.55}>
        {showing}
      </Txt>
      {canTr ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <Pressable accessibilityRole="button" onPress={() => setTr((x) => !x)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
            <Languages size={16} color={color.orangeText} />
            <Txt size={14} w={800} c={color.orangeText}>
              {tr ? t.showOriginal : t.translate}
            </Txt>
          </Pressable>
          {tr ? (
            <Txt size={12} c={color.muted}>
              {d.lang === 'fr' ? t.trFromfr : t.trFromen}
            </Txt>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
