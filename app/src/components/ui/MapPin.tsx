import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { color, radius } from '@/theme/tokens';

// Orange pin fixed at the map centre + the bordered map frame.
export function MapFrame({ height, children }: { height: number; children: ReactNode }) {
  return (
    <View style={{ height, borderRadius: radius.card, overflow: 'hidden', borderWidth: 1.5, borderColor: color.ink, backgroundColor: color.blocked }}>
      {children}
      <View pointerEvents="none" style={{ position: 'absolute', left: '50%', top: '50%', marginLeft: -20, marginTop: -40 }}>
        <Svg width={40} height={40} viewBox="0 0 24 24">
          <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" fill={color.orange} stroke={color.white} strokeWidth={1.6} strokeLinejoin="round" />
          <Circle cx={12} cy={10} r={3} fill={color.white} />
        </Svg>
      </View>
    </View>
  );
}
