import { env } from '../env.ts';
import type { RentalListing, SaleListing, User } from '../generated/prisma/client.ts';
import { isoDay } from './dates.ts';

export const assetUrl = (u: string) => (u.startsWith('/') ? `${env.PUBLIC_URL}${u}` : u);

export const displayName = (u: Pick<User, 'firstName' | 'lastName' | 'businessName'>) =>
  u.businessName ?? ([u.firstName, u.lastName ? `${u.lastName[0]}.` : null].filter(Boolean).join(' ') || 'Member');

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .replace(/[^A-Za-zÀ-ÿ]/g, '')
    .slice(0, 2)
    .toUpperCase();

export const isVerified = (u: Pick<User, 'phoneVerifiedAt' | 'idStatus'>) => !!u.phoneVerifiedAt && u.idStatus === 'done';

export function publicUser(u: User) {
  const name = displayName(u);
  return {
    id: u.id,
    name,
    initials: initials(name),
    memberSince: u.createdAt.getUTCFullYear(),
    verified: isVerified(u),
    sellerType: u.sellerType,
    area: u.areaLabel,
    responseNote: u.responseNote,
  };
}

export function me(u: User) {
  return {
    ...publicUser(u),
    phone: u.phone,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    lang: u.lang,
    autoTranslate: u.autoTranslate,
    goals: u.goals,
    homeLabel: u.homeLabel,
    verification: { phone: u.phoneVerifiedAt ? 'done' : 'todo', id: u.idStatus, licence: u.licenceStatus, selfie: u.selfieStatus },
    payout: u.payoutMethod ? { method: u.payoutMethod, msisdn: u.payoutMsisdn } : null,
    profileComplete: !!u.firstName,
  };
}

export function rentalCard(r: RentalListing & { host?: User }) {
  return {
    kind: 'rent' as const,
    id: r.id,
    make: r.make,
    model: r.model,
    year: r.year,
    city: r.city,
    dailyRate: r.dailyRate,
    rating: r.rating,
    trips: r.tripsCount,
    seats: r.seats,
    transmission: r.transmission,
    fuel: r.fuel,
    delivery: r.deliveryAirport || r.deliveryCity,
    photos: r.photos.map(assetUrl),
    hostVerified: r.host ? isVerified(r.host) : true,
    featured: r.featured,
  };
}

export function saleCard(s: SaleListing & { seller: User }) {
  return {
    kind: 'sale' as const,
    id: s.id,
    make: s.make,
    model: s.model,
    variant: s.variant,
    year: s.year,
    km: s.mileageKm,
    fuel: s.fuel,
    transmission: s.transmission,
    condition: s.condition,
    price: s.price,
    negotiable: s.negotiable,
    city: s.city,
    seats: s.seats,
    photos: s.photos.map(assetUrl),
    featured: s.package === 'featured',
    seller: { type: s.seller.sellerType, verified: isVerified(s.seller), name: displayName(s.seller) },
    createdAt: s.createdAt.toISOString(),
  };
}

export const days = (ds: { date: Date }[]) => ds.map((d) => isoDay(d.date));
