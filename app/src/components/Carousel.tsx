import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { color, radius } from '@/theme/tokens';
import { Photo, Txt } from './ui';

const ANGLES = ['front ¾', 'rear ¾', 'left side', 'interior', 'dashboard', 'boot', 'right side', 'rear seats', 'wheels', 'engine', 'odometer', 'keys'];

// Full-width, Turo-style: tap left/right thirds to page, progress bars at the bottom.
export function Carousel({ photos, label, height, right }: { photos: string[]; label: string; height: number; right?: ReactNode }) {
  const [i, setI] = useState(0);
  const n = photos.length || ANGLES.length;
  const k = i % n;
  return (
    <Photo uri={photos[k]} caption={photos.length ? undefined : `${label} ${ANGLES[k]}`} style={{ height }}>
      <Pressable accessibilityLabel="Previous photo" onPress={() => setI((k + n - 1) % n)} style={{ position: 'absolute', left: 0, top: 64, bottom: 36, width: '35%' }} />
      <Pressable accessibilityLabel="Next photo" onPress={() => setI((k + 1) % n)} style={{ position: 'absolute', right: 0, top: 64, bottom: 36, width: '35%' }} />
      <View style={{ position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))} style={{ width: 40, height: 40, borderRadius: radius.button, backgroundColor: color.white, alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={22} color={color.ink} />
        </Pressable>
        {right}
      </View>
      <View style={{ position: 'absolute', right: 12, bottom: 22, backgroundColor: color.ink, borderRadius: radius.badge, paddingHorizontal: 8, paddingVertical: 3 }}>
        <Txt size={12} w={700} c={color.white}>
          {k + 1} / {n}
        </Txt>
      </View>
      <View style={{ position: 'absolute', left: 12, right: 12, bottom: 10, flexDirection: 'row', gap: 3 }}>
        {Array.from({ length: n }, (_, j) => (
          <View key={j} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: j === k ? color.white : 'rgba(255,255,255,.45)' }} />
        ))}
      </View>
    </Photo>
  );
}
