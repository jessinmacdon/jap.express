import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Location } from '@/api/types';
import { addDays, todayIso } from '@/lib/format';

export type Mode = 'rent' | 'buy';

export interface Filters {
  rate: [number, number];
  price: [number, number];
  km: [number, number];
  make: string; // 'any'
  model: string;
  yMin: number;
  yMax: number;
  trans: 'any' | 'auto' | 'manual';
  fuel: string[];
  seats: 'any' | '2' | '5' | '7';
  cond: string[];
  seller: 'any' | 'private' | 'dealer';
  deliv: boolean;
}

export const SLIDERS = { price: [0, 30_000_000, 250_000], km: [0, 300_000, 5_000], rate: [10_000, 150_000, 5_000] } as const;
const THIS_YEAR = new Date().getFullYear();
export const DEFAULT_FILTERS: Filters = {
  rate: [10_000, 150_000],
  price: [0, 30_000_000],
  km: [0, 300_000],
  make: 'any',
  model: 'any',
  yMin: 2005,
  yMax: THIS_YEAR,
  trans: 'any',
  fuel: [],
  seats: 'any',
  cond: [],
  seller: 'any',
  deliv: false,
};

// A picked place: a known location, the user's position, or nothing (all of Cameroon).
export type Place = (Pick<Location, 'en' | 'fr' | 'city'> & { id: string }) | null;

interface Search {
  mode: Mode;
  setMode: (m: Mode) => void;
  place: Place;
  city: string | null;
  setPlace: (p: Place) => void;
  start: string;
  end: string | null;
  setDates: (start: string, end: string | null) => void;
  delivery: boolean;
  setDelivery: (v: boolean) => void;
  deliveryTo: string;
  setDeliveryTo: (v: string) => void;
  f: Filters;
  setF: <K extends keyof Filters>(k: K, v: Filters[K]) => void;
  toggleIn: (k: 'fuel' | 'cond', v: string) => void;
  resetFilters: () => void;
  filterCount: number;
  query: () => Record<string, string | number | boolean | string[] | undefined>;
}

const Ctx = createContext<Search | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>('rent');
  const [place, setPlace] = useState<Place>(null);
  // Default trip: pick-up in 4 days, 3 days long (matches the prototype's 12–15 Oct on 8 Oct).
  const [start, setStart] = useState(addDays(todayIso(), 4));
  const [end, setEnd] = useState<string | null>(addDays(todayIso(), 7));
  const [delivery, setDelivery] = useState(true);
  const [deliveryTo, setDeliveryTo] = useState('dla');
  const [f, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const setF = useCallback(<K extends keyof Filters>(k: K, v: Filters[K]) => setFilters((p) => ({ ...p, [k]: v, ...(k === 'make' ? { model: 'any' } : {}) })), []);
  const toggleIn = useCallback((k: 'fuel' | 'cond', v: string) => setFilters((p) => ({ ...p, [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v] })), []);
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPlace(null);
  }, []);
  const setDates = useCallback((s: string, e: string | null) => {
    setStart(s);
    setEnd(e);
  }, []);

  const D = DEFAULT_FILTERS;
  const ne = (a: [number, number], b: readonly [number, number]) => (a[0] !== b[0] || a[1] !== b[1] ? 1 : 0);
  const filterCount =
    (['make', 'model', 'trans', 'seats', 'seller'] as const).filter((k) => f[k] !== D[k]).length +
    (f.fuel.length ? 1 : 0) +
    (f.cond.length ? 1 : 0) +
    (f.deliv ? 1 : 0) +
    (mode === 'rent' ? ne(f.rate, D.rate) : ne(f.price, D.price) + ne(f.km, D.km) + (f.yMin !== D.yMin || f.yMax !== D.yMax ? 1 : 0));

  const city = place?.city ?? null;
  const query = useCallback(() => {
    const common = { city: city ?? undefined, make: f.make === 'any' ? undefined : f.make, model: f.model === 'any' ? undefined : f.model, trans: f.trans === 'any' ? undefined : f.trans, fuel: f.fuel, seats: f.seats === 'any' ? undefined : f.seats };
    return mode === 'rent'
      ? { ...common, rateMin: f.rate[0], rateMax: f.rate[1], delivery: f.deliv || undefined, from: end ? start : undefined, to: end ?? undefined }
      : { ...common, priceMin: f.price[0], priceMax: f.price[1], kmMin: f.km[0], kmMax: f.km[1], yearMin: f.yMin, yearMax: f.yMax, cond: f.cond, seller: f.seller === 'any' ? undefined : f.seller };
  }, [mode, city, f, start, end]);

  const value = useMemo<Search>(
    () => ({ mode, setMode, place, city, setPlace, start, end, setDates, delivery, setDelivery, deliveryTo, setDeliveryTo, f, setF, toggleIn, resetFilters, filterCount, query }),
    [mode, place, city, start, end, setDates, delivery, deliveryTo, f, setF, toggleIn, resetFilters, filterCount, query],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSearch = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error('useSearch outside SearchProvider');
  return s;
};
