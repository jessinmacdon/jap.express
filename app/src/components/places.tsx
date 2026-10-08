import { MapPin, Navigation } from 'lucide-react-native';
import { Linking, Platform, Pressable, View } from 'react-native';
import type { Spot } from '@/api/types';
import { useSession } from '@/state/session';
import { color, radius } from '@/theme/tokens';
import { MapView, Txt } from './ui';

export const googleDirections = (s: Pick<Spot, 'lat' | 'lon'>) => `https://www.google.com/maps/dir/?api=1&destination=${s.lat.toFixed(5)},${s.lon.toFixed(5)}`;
export const appleDirections = (s: Pick<Spot, 'lat' | 'lon'>) => `https://maps.apple.com/?daddr=${s.lat.toFixed(5)},${s.lon.toFixed(5)}`;

// Map + address + "Google Maps / Apple Maps" turn-by-turn buttons.
export function SpotCard({ spot, address, note, height = 180 }: { spot: Spot; address: string; note?: string | null; height?: number }) {
  const { t } = useSession();
  return (
    <View style={{ gap: 12 }}>
      <MapView lat={spot.lat} lon={spot.lon} height={height} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <MapPin size={20} color={color.navy} />
        <View style={{ flex: 1 }}>
          <Txt w={800}>{address}</Txt>
          {note ? (
            <Txt size={13} c={color.body} lh={1.4} style={{ marginTop: 2 }}>
              {note}
            </Txt>
          ) : null}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <DirButton label={t.openGoogle} url={googleDirections(spot)} />
        {Platform.OS !== 'android' ? <DirButton label={t.openApple} url={appleDirections(spot)} /> : null}
      </View>
    </View>
  );
}

function DirButton({ label, url }: { label: string; url: string }) {
  return (
    <Pressable accessibilityRole="link" onPress={() => Linking.openURL(url)} style={({ pressed }) => ({ flex: 1, minWidth: 0, height: 46, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderWidth: 1.5, borderColor: color.ink, backgroundColor: pressed ? color.surface : color.white, borderRadius: radius.button })}>
      <Navigation size={18} color={color.ink} />
      <Txt size={14} w={800} numberOfLines={1}>
        {label}
      </Txt>
    </Pressable>
  );
}
