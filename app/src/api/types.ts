// Response shapes of the JapExpress API (server/src/lib/serialize.ts and routes).
export type Lang = 'en' | 'fr';
export type Transmission = 'auto' | 'manual';
export type Fuel = 'petrol' | 'diesel' | 'hybrid' | 'electric';
export type Condition = 'new' | 'excellent' | 'good' | 'fair';
export type SellerType = 'private' | 'dealer';
export type VStatus = 'todo' | 'checking' | 'done' | 'rejected';
export type PayMethod = 'mtn_momo' | 'orange_money' | 'card' | 'paypal';

export interface PublicUser {
  id: string;
  name: string;
  initials: string;
  memberSince: number;
  verified: boolean;
  sellerType: SellerType;
  area: string | null;
  responseNote: string | null;
}

export interface Me extends PublicUser {
  phone: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  lang: Lang;
  autoTranslate: boolean;
  goals: string[];
  homeLabel: string | null;
  verification: { phone: VStatus; id: VStatus; licence: VStatus; selfie: VStatus };
  payout: { method: PayMethod; msisdn: string } | null;
  profileComplete: boolean;
}

export interface RentalCard {
  kind: 'rent';
  id: string;
  make: string;
  model: string;
  year: number;
  city: string;
  dailyRate: number;
  rating: number;
  trips: number;
  seats: number;
  transmission: Transmission;
  fuel: Fuel;
  delivery: boolean;
  photos: string[];
  hostVerified: boolean;
  featured: boolean;
}

export interface Description {
  text: string;
  lang: Lang;
  translation: { text: string; lang: Lang } | null;
}

export interface Spot {
  lat: number;
  lon: number;
  address: string;
  note?: string | null;
}

export interface RentalDetail extends RentalCard {
  host: PublicUser;
  deposit: number;
  weeklyDiscount: boolean;
  deliveryOptions: { airport: boolean; airportFee: number; city: boolean; cityFee: number };
  pickup: Spot;
  description: Description | null;
  unavailable: string[]; // YYYY-MM-DD
}

export interface SaleCard {
  kind: 'sale';
  id: string;
  make: string;
  model: string;
  variant: string;
  year: number;
  km: number;
  fuel: Fuel;
  transmission: Transmission;
  condition: Condition;
  price: number;
  negotiable: boolean;
  city: string;
  seats: number;
  photos: string[];
  featured: boolean;
  seller: { type: SellerType; verified: boolean; name: string };
  createdAt: string;
}

export interface SaleDetail extends Omit<SaleCard, 'seller'> {
  color: string;
  views: number;
  seller: PublicUser & { activeListings: number };
  viewing: Spot & { days: string[] };
  description: Description | null;
  similar: SaleCard[];
}

export type AnyCard = RentalCard | SaleCard;

export interface Quote {
  days: number;
  dailyRate: number;
  gross: number;
  discount: number;
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  deposit: number;
  total: number;
}

export type BookingStatus = 'requested' | 'accepted' | 'confirmed' | 'declined' | 'cancelled' | 'in_progress' | 'completed';

export interface Booking {
  id: string;
  reference: string;
  status: BookingStatus;
  start: string;
  end: string;
  days: number;
  delivery: boolean;
  deliveryTo: string | null;
  price: { dailyRate: number; subtotal: number; deliveryFee: number; platformFee: number; deposit: number; total: number };
  rental: RentalCard & { pickup: Spot };
  host: PublicUser;
  payment: { id: string; method: PayMethod; status: 'pending' | 'succeeded' | 'failed' | 'refunded' } | null;
}

export interface HostDashboard {
  earnings: { thisMonth: number; total: number; available: number };
  payoutAccount: { method: PayMethod; msisdn: string } | null;
  requests: {
    id: string;
    status: BookingStatus;
    renter: { name: string; initials: string; idVerified: boolean; licenceVerified: boolean; phoneVerified: boolean };
    car: string;
    start: string;
    end: string;
    days: number;
    note: string | null;
    payout: number;
  }[];
  listings: {
    kind: 'rent' | 'sale';
    id: string;
    name: string;
    price: number;
    status: string;
    bookedFrom: string | null;
    bookedTo: string | null;
    photo: string | null;
    viewsWeek: number | null;
  }[];
}

export interface Offer {
  id: string;
  amount: number;
  counterAmount: number | null;
  status: 'pending' | 'countered' | 'accepted' | 'declined' | 'withdrawn';
  sale: SaleCard;
  createdAt: string;
}

export interface ListingSummary {
  kind: 'rent' | 'sale';
  id: string;
  title: string;
  price: number;
  photo: string | null;
}

export interface Message {
  id: string;
  mine: boolean;
  text: string | null;
  lang: Lang;
  translation: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  partner: PublicUser | null;
  listing: ListingSummary | null;
  last: Message | null;
  unread: boolean;
}

export interface Conversation {
  id: string;
  partner: PublicUser | null;
  partnerRole: 'host' | SellerType;
  listing: ListingSummary | null;
  messages: Message[];
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  unread: boolean;
  createdAt: string;
}

export interface Location {
  id: string;
  en: string;
  fr: string;
  city: string;
  sub: string;
  airport?: boolean;
}
