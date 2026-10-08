import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { isoDay, parseDay } from '../lib/dates.ts';
import { badRequest, conflict, forbidden, notFound, parse, userId } from '../lib/http.ts';
import { CITIES } from '../lib/places.ts';
import { estimateMonthlyEarnings, LISTING_PACKAGES } from '../lib/pricing.ts';
import { assetUrl, displayName, initials } from '../lib/serialize.ts';
import { notify } from '../services/notify.ts';
import { createPaymentProvider, SANDBOX_CONFIRM_DELAY_MS } from '../services/payments.ts';
import { settlePayment } from './bookings.ts';

const payments = createPaymentProvider();
const EARNING = ['confirmed', 'in_progress', 'completed'] as const;

const vehicle = {
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1980).max(new Date().getFullYear() + 1),
  mileageKm: z.number().int().min(0),
  fuel: z.enum(['petrol', 'diesel', 'hybrid', 'electric']),
  transmission: z.enum(['auto', 'manual']),
  condition: z.enum(['new', 'excellent', 'good', 'fair']),
  seats: z.number().int().min(1).max(30),
  city: z.string().refine((c) => c in CITIES, 'unknown city'),
  photos: z.array(z.string()).min(8, 'At least 8 photos'),
  description: z.string().max(4000).optional(),
  descriptionLang: z.enum(['en', 'fr']).default('fr'),
  location: z.object({ lat: z.number(), lon: z.number(), address: z.string().min(3), note: z.string().max(500).optional() }),
};

export default async function hostRoutes(app: FastifyInstance) {
  // Public: "Estimate your earnings" on the hosting intro.
  app.get('/host/estimate', async (req) => {
    const q = parse(z.object({ type: z.enum(['compact', 'suv', 'van']), days: z.coerce.number().int().min(1).max(31) }), req.query);
    // TODO: derive from live listings in the host's city instead of fixed rates.
    const rate = { compact: 20000, suv: 35000, van: 55000 }[q.type];
    return { dailyRate: rate, monthly: estimateMonthlyEarnings(rate, q.days) };
  });

  app.register(async (auth) => {
    auth.addHook('preHandler', app.authenticate);

    auth.get('/host/dashboard', async (req) => {
      const uid = userId(req);
      const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
      const [earnedAll, earnedMonth, paidOut, requests, rentals, sales] = await Promise.all([
        prisma.booking.aggregate({ _sum: { hostPayout: true }, where: { rental: { hostId: uid }, status: { in: [...EARNING] } } }),
        prisma.booking.aggregate({ _sum: { hostPayout: true }, where: { rental: { hostId: uid }, status: { in: [...EARNING] }, startDate: { gte: monthStart } } }),
        prisma.payout.aggregate({ _sum: { amount: true }, where: { hostId: uid, status: { in: ['pending', 'sent'] } } }),
        prisma.booking.findMany({ where: {
            rental: { hostId: uid },
            startDate: { gte: parseDay(isoDay(new Date())) },
            // Pending requests, plus ones the host decided in the last day so the outcome stays visible.
            OR: [{ status: 'requested' }, { status: { in: ['confirmed', 'declined'] }, updatedAt: { gte: new Date(Date.now() - 86_400_000) } }],
          }, include: { renter: true, rental: true }, orderBy: { createdAt: 'desc' } }),
        prisma.rentalListing.findMany({ where: { hostId: uid }, include: { bookings: { where: { status: { in: ['confirmed', 'in_progress'] }, endDate: { gte: new Date() } }, orderBy: { startDate: 'asc' }, take: 1 } } }),
        prisma.saleListing.findMany({ where: { sellerId: uid } }),
      ]);
      const total = earnedAll._sum.hostPayout ?? 0;
      const me = await prisma.user.findUniqueOrThrow({ where: { id: uid } });
      return {
        earnings: { thisMonth: earnedMonth._sum.hostPayout ?? 0, total, available: Math.max(0, total - (paidOut._sum.amount ?? 0)) },
        payoutAccount: me.payoutMethod ? { method: me.payoutMethod, msisdn: me.payoutMsisdn } : null,
        requests: requests.map((b) => {
          const name = displayName(b.renter);
          return {
            id: b.id,
            status: b.status,
            renter: { name, initials: initials(name), idVerified: b.renter.idStatus === 'done', licenceVerified: b.renter.licenceStatus === 'done', phoneVerified: !!b.renter.phoneVerifiedAt },
            car: `${b.rental.make} ${b.rental.model} ${b.rental.year}`,
            start: isoDay(b.startDate),
            end: isoDay(b.endDate),
            days: b.days,
            note: b.note,
            payout: b.hostPayout,
          };
        }),
        listings: [
          ...rentals.map((r) => ({
            kind: 'rent' as const,
            id: r.id,
            name: `${r.make} ${r.model} ${r.year}`,
            price: r.dailyRate,
            status: r.bookings[0] ? 'booked' : r.status === 'active' ? 'available' : r.status,
            bookedFrom: r.bookings[0] ? isoDay(r.bookings[0].startDate) : null,
            bookedTo: r.bookings[0] ? isoDay(r.bookings[0].endDate) : null,
            photo: r.photos[0] ? assetUrl(r.photos[0]) : null,
            viewsWeek: null as number | null, // TODO: analytics
          })),
          ...sales.map((s) => ({ kind: 'sale' as const, id: s.id, name: `${s.make} ${s.variant} ${s.year}`, price: s.price, status: s.status === 'active' ? 'for_sale' : s.status, bookedFrom: null, bookedTo: null, photo: s.photos[0] ? assetUrl(s.photos[0]) : null, viewsWeek: s.views })),
        ],
      };
    });

    auth.post('/host/requests/:id/:action', async (req) => {
      const { id, action } = parse(z.object({ id: z.string(), action: z.enum(['accept', 'decline']) }), req.params);
      const b = await prisma.booking.findUnique({ where: { id }, include: { rental: true } });
      if (!b) throw notFound('booking');
      if (b.rental.hostId !== userId(req)) throw forbidden();
      if (b.status !== 'requested') throw conflict('not_pending');
      const status = action === 'accept' ? 'confirmed' : 'declined';
      await prisma.booking.update({ where: { id }, data: { status } });
      // TODO: on decline, refund the renter's payment through the provider.
      const car = `${b.rental.make} ${b.rental.model}`;
      await notify(b.renterId, {
        type: 'booking_confirmed',
        titleEn: action === 'accept' ? 'Booking confirmed' : 'Booking declined',
        titleFr: action === 'accept' ? 'Réservation confirmée' : 'Réservation refusée',
        bodyEn: `${car} · ${b.reference}`,
        bodyFr: `${car} · ${b.reference}`,
        link: '/activity?tab=trips',
      });
      return { id, status };
    });

    auth.post('/host/payouts', async (req) => {
      const uid = userId(req);
      const body = parse(z.object({ method: z.enum(['mtn_momo', 'orange_money']).optional(), msisdn: z.string().optional() }), req.body ?? {});
      const me = await prisma.user.findUniqueOrThrow({ where: { id: uid } });
      const method = body.method ?? me.payoutMethod;
      const msisdn = body.msisdn ?? me.payoutMsisdn;
      if (!method || !msisdn) throw badRequest('payout_account_missing');
      const [earned, paid] = await Promise.all([
        prisma.booking.aggregate({ _sum: { hostPayout: true }, where: { rental: { hostId: uid }, status: { in: [...EARNING] } } }),
        prisma.payout.aggregate({ _sum: { amount: true }, where: { hostId: uid, status: { in: ['pending', 'sent'] } } }),
      ]);
      const amount = (earned._sum.hostPayout ?? 0) - (paid._sum.amount ?? 0);
      if (amount <= 0) throw badRequest('nothing_to_pay_out');
      const r = await payments.payout({ method, amount, msisdn });
      const payout = await prisma.payout.create({ data: { hostId: uid, amount, method, msisdn, status: r.status, providerRef: r.providerRef } });
      return { id: payout.id, amount, method, msisdn, status: payout.status };
    });

    // ---- Listing creation (5-step flow in the app) ----
    auth.post('/listings/rental', async (req) => {
      const uid = userId(req);
      const body = parse(
        z.object({
          ...vehicle,
          dailyRate: z.number().int().min(1000),
          deposit: z.number().int().min(0),
          weeklyDiscount: z.boolean().default(false),
          deliveryAirport: z.boolean().default(false),
          deliveryCity: z.boolean().default(false),
          blockedDates: z.array(z.string().date()).default([]),
          payout: z.object({ method: z.enum(['mtn_momo', 'orange_money']), msisdn: z.string().min(6) }),
        }),
        req.body,
      );
      const r = await prisma.rentalListing.create({
        data: {
          hostId: uid,
          make: body.make,
          model: body.model,
          year: body.year,
          mileageKm: body.mileageKm,
          condition: body.condition,
          city: body.city,
          seats: body.seats,
          transmission: body.transmission,
          fuel: body.fuel,
          dailyRate: body.dailyRate,
          deposit: body.deposit,
          weeklyDiscount: body.weeklyDiscount,
          deliveryAirport: body.deliveryAirport,
          deliveryCity: body.deliveryCity,
          pickupLat: body.location.lat,
          pickupLon: body.location.lon,
          pickupAddress: body.location.address,
          pickupNote: body.location.note,
          description: body.description,
          descriptionLang: body.descriptionLang,
          photos: body.photos,
          blocked: { create: body.blockedDates.map((d) => ({ date: parseDay(d) })) },
        },
      });
      await prisma.user.update({ where: { id: uid }, data: { payoutMethod: body.payout.method, payoutMsisdn: body.payout.msisdn, goals: { push: 'host' } } });
      return { id: r.id, status: r.status };
    });

    auth.post('/listings/sale', async (req) => {
      const uid = userId(req);
      const body = parse(
        z.object({
          ...vehicle,
          variant: z.string().min(1),
          color: z.string().default('grey'),
          price: z.number().int().min(10000),
          negotiable: z.boolean().default(false),
          viewingDays: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])).min(1),
          package: z.enum(['basic', 'featured']),
          payment: z.object({ method: z.enum(['mtn_momo', 'orange_money']), msisdn: z.string().min(6) }),
        }),
        req.body,
      );
      const pkg = LISTING_PACKAGES[body.package];
      const s = await prisma.saleListing.create({
        data: {
          sellerId: uid,
          status: 'pending_payment',
          make: body.make,
          model: body.model,
          variant: body.variant,
          year: body.year,
          mileageKm: body.mileageKm,
          fuel: body.fuel,
          transmission: body.transmission,
          color: body.color,
          condition: body.condition,
          seats: body.seats,
          price: body.price,
          negotiable: body.negotiable,
          city: body.city,
          viewLat: body.location.lat,
          viewLon: body.location.lon,
          viewAddress: body.location.address,
          viewingDays: body.viewingDays,
          description: body.description,
          descriptionLang: body.descriptionLang,
          photos: body.photos,
          package: body.package,
          expiresAt: new Date(Date.now() + pkg.days * 86_400_000),
        },
      });
      const init = await payments.initiate({ method: body.payment.method, amount: pkg.price, msisdn: body.payment.msisdn, description: `JapExpress listing ${s.id}` });
      const p = await prisma.payment.create({ data: { userId: uid, purpose: 'listing_package', saleListingId: s.id, method: body.payment.method, msisdn: body.payment.msisdn, amount: pkg.price, providerRef: init.providerRef } });
      setTimeout(() => settlePayment(p.id, true).catch((e) => app.log.error(e)), SANDBOX_CONFIRM_DELAY_MS);
      return { id: s.id, status: s.status, paymentId: p.id, amount: pkg.price };
    });
  });
}
