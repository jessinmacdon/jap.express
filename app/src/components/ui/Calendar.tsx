import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useT } from '@/state/session';
import { color, radius } from '@/theme/tokens';
import { fromIso, monthName, todayIso, toIso, weekdayIdx } from '@/lib/format';
import { Txt } from './Txt';

interface Props {
  mode: 'range' | 'block';
  start?: string | null;
  end?: string | null;
  unavailable?: string[]; // struck through, not selectable (range mode)
  blocked?: string[]; // host-blocked days (block mode)
  onPick: (day: string) => void;
  cellHeight?: number;
  initialMonth?: string;
}

// Month grid with Monday-first weeks. Past days are disabled.
export function Calendar({ mode, start, end, unavailable = [], blocked = [], onPick, cellHeight = 42, initialMonth }: Props) {
  const { t } = useT();
  const today = todayIso();
  const first = fromIso((initialMonth ?? start ?? today).slice(0, 8) + '01');
  const [cursor, setCursor] = useState({ y: first.getUTCFullYear(), m: first.getUTCMonth() });
  const thisMonth = fromIso(today.slice(0, 8) + '01');
  const canPrev = cursor.y > thisMonth.getUTCFullYear() || (cursor.y === thisMonth.getUTCFullYear() && cursor.m > thisMonth.getUTCMonth());
  const shift = (n: number) => setCursor((c) => ({ y: c.y + Math.floor((c.m + n) / 12), m: (((c.m + n) % 12) + 12) % 12 }));

  const firstIso = toIso(new Date(Date.UTC(cursor.y, cursor.m, 1)));
  const lead = weekdayIdx(firstIso);
  const nDays = new Date(Date.UTC(cursor.y, cursor.m + 1, 0)).getUTCDate();
  const un = new Set(unavailable);
  const bl = new Set(blocked);
  const letters = t.weekdayLetters.split(',');

  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: nDays }, (_, i) => toIso(new Date(Date.UTC(cursor.y, cursor.m, i + 1))))];

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Txt size={17} w={800} style={{ flex: 1 }}>
          {monthName(cursor.m, t)} {cursor.y}
        </Txt>
        <Pressable accessibilityLabel={t.prevMonth} disabled={!canPrev} onPress={() => shift(-1)} style={{ padding: 6, opacity: canPrev ? 1 : 0.3 }}>
          <ChevronLeft size={20} color={color.ink} />
        </Pressable>
        <Pressable accessibilityLabel={t.nextMonth} onPress={() => shift(1)} style={{ padding: 6 }}>
          <ChevronRight size={20} color={color.ink} />
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderColor: color.line }}>
        {letters.map((w, i) => (
          <View key={`w${i}`} style={{ width: `${100 / 7}%`, paddingVertical: 8 }}>
            <Txt size={11} w={700} c={color.muted} center>
              {w}
            </Txt>
          </View>
        ))}
        {cells.map((d, i) => {
          if (!d) return <View key={`e${i}`} style={{ width: `${100 / 7}%`, height: cellHeight }} />;
          const past = d < today;
          const taken = mode === 'range' && un.has(d);
          const isBlocked = mode === 'block' && bl.has(d);
          const sel = mode === 'range' && (d === start || d === end);
          const inRange = mode === 'range' && !!start && !!end && d > start && d < end;
          const bg = sel ? color.navy : inRange ? color.rangeFill : isBlocked ? color.blocked : 'transparent';
          const fg = sel ? color.white : past || taken ? color.faint : isBlocked ? '#6B7586' : color.ink;
          return (
            <Pressable
              key={d}
              accessibilityRole="button"
              accessibilityState={{ disabled: past || taken, selected: sel || isBlocked }}
              disabled={past || taken}
              onPress={() => onPick(d)}
              style={{ width: `${100 / 7}%`, height: cellHeight, alignItems: 'center', justifyContent: 'center', backgroundColor: bg, borderRadius: radius.button }}>
              <Txt size={14} w={sel ? 800 : 400} c={fg} style={{ textDecorationLine: taken || isBlocked ? 'line-through' : 'none', fontVariant: ['tabular-nums'] }}>
                {fromIso(d).getUTCDate()}
              </Txt>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// Range-picking rule shared by listing and checkout: first tap = pick-up,
// second tap after it (with no taken day in between) = return.
export function nextRange(day: string, start: string | null, end: string | null, unavailable: string[]): [string, string | null] {
  if (!start || end) return [day, null];
  if (day > start && !unavailable.some((u) => u >= start && u < day)) return [start, day];
  return [day, null];
}
