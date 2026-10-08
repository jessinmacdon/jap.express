import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.ts';
import type { Prisma } from '../generated/prisma/client.ts';
import { isoDay, parseDay } from '../lib/dates.ts';
import { boolQ, csv, intQ, notFound, parse } from '../lib/http.ts';
import { assetUrl, days, publicUser, rentalCard, saleCard } from '../lib/serialize.ts';
import { translateListing } from '../services/translation.ts';
import { LOCATIONS, MAKES } from '../lib/places.ts';

const seatsWhere = (v?: string): Prisma.IntFilter | undefined =>
  v === '2' ? { lte: 2 } : v === '5' ? { gte: 4, lte: 5 } : v === '7' ? { gte: 7 } : undefined;

const common = {
  city: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  trans: z.enum(['auto', 'manual']).optional(),
  fuel: csv,
  seats: z.enum(['2', '5', '7']).optional(),
};

const rentalQuery = z.object({
  ...common,
  rateMin: intQ,
  rateMax: intQ,
  delivery: boolQ,
  from: z.string().date().optional(),
  to: z.string().date().optional(),
});

const saleQuery = z.object({
  ...common,
  priceMin: intQ,
  priceMax: intQ,
  kmMin: intQ,
  kmMax: intQ,
  yearMin: intQ,
  yearMax: intQ,
  cond: csv,
  seller: z.enum(['private', 'dealer']).optional(),
});

const descriptionFor = async (key: string, text: string | null, from: 'en' | 'fr', want?: 'en' | 'fr') => {
  if (!text) return null;
  const translated = want && want !== from ? await translateListing(key, text, from, want) : null;
  return { text, lang: from, translation: translated ? { text: translated, lang: want } : null };
};

export default async function catalogRoutes(app: FastifyInstance) {
  app.get('/rentals', async (req) => {
    const q = parse(rentalQuery, req.query);
    const where: Prisma.RentalListingWhereInput = {
      status: 'active',
      city: q.city || undefined,
      make: q.make || undefined,
      model: q.model || undefined,
      transmission: q.trans,
      fuel: q.fuel.length ? { in: q.fuel as never } : undefined,
      seats: seatsWhere(q.seats),
      dailyRate: { gte: q.rateMin, lte: q.rateMax },
      ...(q.delivery ? { OR: [{ deliveryAirport: true }, { deliveryCity: true }] } : {}),
    };
    // Exclude cars that are blocked or booked on any requested day.
    if (q.from && q.to) {
      const from = parseDay(q.from);
      const to = parseDay(q.to);
      where.blocked = { none: { date: { gte: from, lt: to } } };
      where.bookings = { none: { status: { in: ['accepted', 'confirmed', 'in_progress'] }, startDate: { lt: to }, endDate: { gt: from } } };
    }
    const rows = await prisma.rentalListing.findMany({ where, include: { host: true }, orderBy: [{ featured: 'desc' }, { rating: 'desc' }] });
    return { items: rows.map(rentalCard) };
  });

  app.get('/rentals/:id', { preHandler: app.optionalAuth }, async (req) => {
    const { id } = parse(z.object({ id: z.string() }), req.params);
    const { lang } = parse(z.object({ lang: z.enum(['en', 'fr']).optional() }), req.query);
    const r = await prisma.rentalListing.findUnique({
      where: { id },
      include: {
        host: true,
        blocked: { where: { date: { gte: parseDay(isoDay(new Date())) } } },
        bookings: { where: { status: { in: ['accepted', 'confirmed', 'in_progress'] } }, select: { startDate: true, endDate: true } },
      },
    });
    if (!r) throw notFound('rental');
    const booked = new Set(days(r.blocked));
    for (const b of r.bookings) for (let d = b.startDate; d < b.endDate; d = new Date(d.getTime() + 86_400_000)) booked.add(isoDay(d));
    return {
      ...rentalCard(r),
      host: publicUser(r.host),
      deposit: r.deposit,
      weeklyDiscount: r.weeklyDiscount,
      deliveryOptions: { airport: r.deliveryAirport, airportFee: r.deliveryAirportFee, city: r.deliveryCity, cityFee: r.deliveryCityFee },
      pickup: { lat: r.pickupLat, lon: r.pickupLon, address: r.pickupAddress, note: r.pickupNote },
      description: await descriptionFor(`rent:${r.id}`, r.description, r.descriptionLang, lang),
      unavailable: [...booked].sort(),
    };
  });

  app.get('/sales', async (req) => {
    const q = parse(saleQuery, req.query);
    const where: Prisma.SaleListingWhereInput = {
      status: 'active',
      city: q.city || undefined,
      make: q.make || undefined,
      model: q.model || undefined,
      transmission: q.trans,
      fuel: q.fuel.length ? { in: q.fuel as never } : undefined,
      condition: q.cond.length ? { in: q.cond as never } : undefined,
      seats: seatsWhere(q.seats),
      price: { gte: q.priceMin, lte: q.priceMax },
      mileageKm: { gte: q.kmMin, lte: q.kmMax },
      year: { gte: q.yearMin, lte: q.yearMax },
      seller: q.seller ? { sellerType: q.seller } : undefined,
    };
    const rows = await prisma.saleListing.findMany({ where, include: { seller: true }, orderBy: [{ package: 'desc' }, { createdAt: 'desc' }] });
    return { items: rows.map(saleCard) };
  });

  app.get('/sales/:id', { preHandler: app.optionalAuth }, async (req) => {
    const { id } = parse(z.object({ id: z.string() }), req.params);
    const { lang } = parse(z.object({ lang: z.enum(['en', 'fr']).optional() }), req.query);
    const s = await prisma.saleListing.update({ where: { id }, data: { views: { increment: 1 } }, include: { seller: true } }).catch(() => null);
    if (!s) throw notFound('sale');
    const [activeListings, similar] = await Promise.all([
      prisma.saleListing.count({ where: { sellerId: s.sellerId, status: 'active' } }),
      prisma.saleListing.findMany({
        where: { status: 'active', id: { not: s.id }, OR: [{ make: s.make }, { city: s.city }, { price: { gte: Math.round(s.price * 0.6), lte: Math.round(s.price * 1.4) } }] },
        include: { seller: true },
        take: 4,
      }),
    ]);
    return {
      ...saleCard(s),
      color: s.color,
      views: s.views,
      seller: { ...publicUser(s.seller), activeListings },
      viewing: { lat: s.viewLat, lon: s.viewLon, address: s.viewAddress, days: s.viewingDays },
      description: await descriptionFor(`sale:${s.id}`, s.description, s.descriptionLang, lang),
      similar: similar.map(saleCard),
    };
  });

  // Home hub: featured strip across both marketplaces.
  app.get('/home', async () => {
    const [rentals, sales] = await Promise.all([
      prisma.rentalListing.findMany({ where: { status: 'active', featured: true }, include: { host: true }, take: 4 }),
      prisma.saleListing.findMany({ where: { status: 'active', package: 'featured' }, include: { seller: true }, take: 4 }),
    ]);
    const featured: (ReturnType<typeof rentalCard> | ReturnType<typeof saleCard>)[] = [];
    for (let i = 0; i < Math.max(rentals.length, sales.length); i++) {
      if (rentals[i]) featured.push(rentalCard(rentals[i]));
      if (sales[i]) featured.push(saleCard(sales[i]));
    }
    return { featured, heroImage: assetUrl('/static/img/car3.jpg') };
  });

  app.get('/locations', async (req) => {
    const { q } = parse(z.object({ q: z.string().optional() }), req.query);
    const needle = q?.trim().toLowerCase();
    const items = LOCATIONS.filter((l) => !needle || l.en.toLowerCase().includes(needle) || l.fr.toLowerCase().includes(needle));
    return { items: items.slice(0, needle ? 5 : 4) };
  });

  app.get('/makes', async () => ({ makes: MAKES }));
}
