import type { Dict, Lang } from '@/i18n';

// "25 000" — FCFA amounts use a non-breaking space as thousands separator.
export const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
export const fcfa = (n: number) => `${fmt(n)} FCFA`;
export const perDay = (n: number, t: Dict) => `${fmt(n)} FCFA / ${t.day}`;

// ---- Calendar days as "YYYY-MM-DD" (UTC, no time) ----
export const DAY = 86_400_000;
export const toIso = (d: Date) => d.toISOString().slice(0, 10);
export const fromIso = (s: string) => new Date(`${s}T00:00:00.000Z`);
export const todayIso = () => toIso(new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())));
export const addDays = (s: string, n: number) => toIso(new Date(fromIso(s).getTime() + n * DAY));
export const diffDays = (a: string, b: string) => Math.round((fromIso(b).getTime() - fromIso(a).getTime()) / DAY);

const list = (s: string) => s.split(',');
export const monthName = (m: number, t: Dict) => list(t.monthNames)[m];
export const monthShort = (m: number, t: Dict) => list(t.monthShort)[m];
// Monday-first weekday index
export const weekdayIdx = (s: string) => (fromIso(s).getUTCDay() + 6) % 7;

// "Mon 12 Oct" / "lun. 12 oct."
export const dateLabel = (s: string, t: Dict) => {
  const d = fromIso(s);
  return `${list(t.weekdayShort)[weekdayIdx(s)]} ${d.getUTCDate()} ${monthShort(d.getUTCMonth(), t)}`;
};

// "12–15 Oct" or "30 Oct – 2 Nov"
export const rangeShort = (a: string, b: string, t: Dict) => {
  const da = fromIso(a);
  const db = fromIso(b);
  return da.getUTCMonth() === db.getUTCMonth()
    ? `${da.getUTCDate()}–${db.getUTCDate()} ${monthShort(db.getUTCMonth(), t)}`
    : `${da.getUTCDate()} ${monthShort(da.getUTCMonth(), t)} – ${db.getUTCDate()} ${monthShort(db.getUTCMonth(), t)}`;
};

export const daysWord = (n: number, t: Dict) => `${n} ${n === 1 ? t.dayS : t.days}`;

export const timeLabel = (iso: string, t: Dict, lang: Lang) => {
  const d = new Date(iso);
  const mins = (Date.now() - d.getTime()) / 60000;
  if (mins < 1) return t.now;
  const sameDay = new Date().toDateString() === d.toDateString();
  if (sameDay) return d.toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
  const days = Math.floor(mins / 1440);
  if (days <= 1) return t.yesterday;
  return `${days} ${t.daysShort}`;
};

export const clock = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
