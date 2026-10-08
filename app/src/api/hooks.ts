import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/state/session';
import { useUi } from '@/state/ui';
import { api, get, post } from './client';
import type {
  AnyCard,
  Booking,
  Conversation,
  ConversationSummary,
  HostDashboard,
  Location,
  Message,
  Notification,
  Offer,
  Quote,
  RentalCard,
  RentalDetail,
  SaleCard,
  SaleDetail,
} from './types';

type Q = Record<string, string | number | boolean | string[] | undefined>;

// ---- Catalog (public) ----
export const useRentals = (q: Q, enabled = true) => useQuery({ queryKey: ['rentals', q], queryFn: () => get<{ items: RentalCard[] }>('/rentals', q), enabled, placeholderData: (p) => p });
export const useSales = (q: Q, enabled = true) => useQuery({ queryKey: ['sales', q], queryFn: () => get<{ items: SaleCard[] }>('/sales', q), enabled, placeholderData: (p) => p });

export const useRental = (id: string) => {
  const { lang } = useSession();
  return useQuery({ queryKey: ['rental', id, lang], queryFn: () => get<RentalDetail>(`/rentals/${id}`, { lang }) });
};
export const useSale = (id: string) => {
  const { lang } = useSession();
  return useQuery({ queryKey: ['sale', id, lang], queryFn: () => get<SaleDetail>(`/sales/${id}`, { lang }) });
};

export const useHome = () => useQuery({ queryKey: ['home'], queryFn: () => get<{ featured: AnyCard[]; heroImage: string }>('/home') });
export const useLocations = (q: string) => useQuery({ queryKey: ['locations', q], queryFn: () => get<{ items: Location[] }>('/locations', { q }), placeholderData: (p) => p });
export const useMakes = () => useQuery({ queryKey: ['makes'], queryFn: () => get<{ makes: Record<string, string[]> }>('/makes'), staleTime: Infinity });

export const useQuote = (body: { rentalId: string; start: string; end: string | null; delivery: boolean; deliveryTo?: string }) =>
  useQuery({
    queryKey: ['quote', body],
    queryFn: () => post<Quote>('/bookings/quote', body),
    enabled: !!body.end,
    placeholderData: (p) => p,
  });

export const useEstimate = (type: 'compact' | 'suv' | 'van', days: number) =>
  useQuery({ queryKey: ['estimate', type, days], queryFn: () => get<{ dailyRate: number; monthly: number }>('/host/estimate', { type, days }), placeholderData: (p) => p });

// ---- Favourites ----
const favKey = (c: { kind: 'rent' | 'sale'; id: string }) => `${c.kind}:${c.id}`;

export function useFavourites() {
  const { token } = useSession();
  return useQuery({ queryKey: ['favourites'], queryFn: () => get<{ items: AnyCard[]; ids: string[] }>('/favourites'), enabled: !!token });
}

export function useToggleFavourite() {
  const qc = useQueryClient();
  const { t } = useSession();
  const { showToast } = useUi();
  const favs = useFavourites();
  const ids = new Set(favs.data?.ids ?? []);
  const m = useMutation({
    mutationFn: ({ card, on }: { card: AnyCard; on: boolean }) => api(on ? 'PUT' : 'DELETE', `/favourites/${card.kind}/${card.id}`),
    onMutate: async ({ card, on }) => {
      await qc.cancelQueries({ queryKey: ['favourites'] });
      const prev = qc.getQueryData<{ items: AnyCard[]; ids: string[] }>(['favourites']);
      if (prev) {
        const k = favKey(card);
        qc.setQueryData(['favourites'], {
          items: on ? [card, ...prev.items] : prev.items.filter((x) => favKey(x) !== k),
          ids: on ? [k, ...prev.ids] : prev.ids.filter((x) => x !== k),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(['favourites'], ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['favourites'] }),
  });
  return {
    isFav: (c: { kind: 'rent' | 'sale'; id: string }) => ids.has(favKey(c)),
    toggle: (card: AnyCard) => {
      const on = !ids.has(favKey(card));
      m.mutate({ card, on });
      showToast(on ? t.saved : t.savedRemoved);
    },
  };
}

// ---- Trips, offers, hosting ----
export const useTrips = () => useQuery({ queryKey: ['trips'], queryFn: () => get<{ upcoming: Booking[]; past: Booking[] }>('/me/trips') });
export const useOffers = () => useQuery({ queryKey: ['offers'], queryFn: () => get<{ items: Offer[] }>('/me/offers') });
export const useHostDashboard = () => useQuery({ queryKey: ['host'], queryFn: () => get<HostDashboard>('/host/dashboard') });

export const useBooking = (id: string | null, poll: boolean) =>
  useQuery({ queryKey: ['booking', id], queryFn: () => get<Booking>(`/bookings/${id}`), enabled: !!id, refetchInterval: poll ? 1000 : false });

// ---- Inbox ----
export const useConversations = () => useQuery({ queryKey: ['conversations'], queryFn: () => get<{ items: ConversationSummary[] }>('/conversations'), refetchInterval: 10_000 });

// TODO: replace polling with a websocket / SSE channel.
export const useConversation = (id: string) => useQuery({ queryKey: ['conversation', id], queryFn: () => get<Conversation>(`/conversations/${id}`), refetchInterval: 2500 });

export function useSendMessage(id: string) {
  const qc = useQueryClient();
  const { lang } = useSession();
  return useMutation({
    mutationFn: (m: { text?: string; imageUrl?: string }) => post<Message>(`/conversations/${id}/messages`, { ...m, lang }),
    onSuccess: (msg) => {
      qc.setQueryData<Conversation>(['conversation', id], (c) => (c ? { ...c, messages: [...c.messages, msg] } : c));
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export const openConversation = (kind: 'rent' | 'sale', listingId: string) => post<{ id: string }>('/conversations', { kind, listingId });

export const useNotifications = () => useQuery({ queryKey: ['notifications'], queryFn: () => get<{ items: Notification[]; unread: number }>('/notifications') });
