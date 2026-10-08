// Dates are calendar days (no time) exchanged as "YYYY-MM-DD".
export const isoDay = (d: Date) => d.toISOString().slice(0, 10);
export const parseDay = (s: string) => new Date(`${s}T00:00:00.000Z`);
export const dayDiff = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86_400_000);

export function eachDay(start: Date, endExclusive: Date): Date[] {
  const out: Date[] = [];
  for (let d = new Date(start); d < endExclusive; d = new Date(d.getTime() + 86_400_000)) out.push(d);
  return out;
}
