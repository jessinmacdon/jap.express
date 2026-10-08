import { useRef } from 'react';
import { View, type GestureResponderEvent } from 'react-native';
import { color } from '@/theme/tokens';

interface Props {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
}

// Two-thumb range slider (price, mileage, daily rate). Drags the nearer thumb.
export function RangeSlider({ min, max, step, value, onChange }: Props) {
  const ref = useRef<View>(null);
  const drag = useRef({ left: 0, width: 1, which: 0 as 0 | 1 });
  const [lo, hi] = value;

  const toVal = (pageX: number) => {
    const r = Math.max(0, Math.min(1, (pageX - drag.current.left) / drag.current.width));
    return Math.round((min + r * (max - min)) / step) * step;
  };
  const apply = (v: number) => onChange(drag.current.which === 0 ? [Math.min(v, hi), hi] : [lo, Math.max(v, lo)]);

  const onGrant = (e: GestureResponderEvent) => {
    const x = e.nativeEvent.pageX;
    ref.current?.measureInWindow((left, _top, width) => {
      drag.current.left = left;
      drag.current.width = width || 1;
      const v = toVal(x);
      const dLo = Math.abs(v - lo);
      const dHi = Math.abs(v - hi);
      drag.current.which = dLo < dHi ? 0 : dLo > dHi ? 1 : v > hi ? 1 : 0;
      apply(v);
    });
  };

  const pct = (v: number) => `${((v - min) / (max - min)) * 100}%` as const;
  return (
    <View
      ref={ref}
      accessibilityRole="adjustable"
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={onGrant}
      onResponderMove={(e) => apply(toVal(e.nativeEvent.pageX))}
      style={{ height: 28, marginHorizontal: 10, justifyContent: 'center' }}>
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 13, height: 2, backgroundColor: color.track }} />
      <View pointerEvents="none" style={{ position: 'absolute', top: 12, height: 4, borderRadius: 2, backgroundColor: color.orange, left: pct(lo), width: `${((hi - lo) / (max - min)) * 100}%` }} />
      {[lo, hi].map((v, i) => (
        <View key={i} pointerEvents="none" style={{ position: 'absolute', top: 4, left: pct(v), marginLeft: -10, width: 20, height: 20, backgroundColor: color.white, borderWidth: 2, borderColor: color.navy }} />
      ))}
    </View>
  );
}
