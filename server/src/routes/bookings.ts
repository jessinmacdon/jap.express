import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { dayDiff, isoDay, parseDay } from '../lib/dates.ts';
import { badRequest, conflict, forbidden, notFound, parse, userId } from '../lib/http.ts';
import { bookingReference } from '../lib/ids.ts';
import { DELIVERY_SPOTS } from '../lib/places.ts';
import { quoteRental } from '../lib/pricing.ts';
import { isVerified, publicUser, rentalCard } from '../lib/serialize.ts';
import { notify } from '../services/notify.ts';
import { createPaymentProvider, SANDBOX_CONFIRM_DELAY_MS } from '../services/payments.ts';

const payments = createPaymentProvider();

const tripInput = z.object({
  rentalId: z.string(),
  start: z.string().date(),
  end: z.string().date(),
  delivery: z.boolean().default(false),
  deliveryTo: z.string().max(120).optional(),
});

async function priceTrip(input: z.infer<typeof tripInput>) {
  const rental = await prisma.rentalListing.findUnique({ where: { id: input.rentalId }, include: { host: true } });
  if (!rental || rental.status !== 'active') throw notFound('rental');
  const start = parseDay(input.start);
  const end = parseDay(input.end);
  const days = dayDiff(start, end);
  if (days < 1) throw badRequest('invalid_dates', 'Return must be after pick-up');
  if (start < parseDay(isoDay(new Date()))) throw badRequest('invalid_dates', 'Pick-up is in the past');
  if (input.delivery && !rental.deliveryAirport && !rental.deliveryCity) throw badRequest('delivery_unavailable');
  const spot = DELIVERY_SPOTS.find((s) => s.id === input.deliveryTo);
  const deliveryFee = !input.delivery ? 0 : spot?.airport || !rental.deliveryCity ? rental.deliveryAirportFee : rental.deliveryCityFee;
  const quote = quoteRental({ dailyRate: rental.dailyRate, deposit: rental.deposit, days, weeklyDiscount: rental.weeklyDiscount, deliveryFee });
  return { rental, start, end, quote };
}

async function assertAvailable(rentalId: string, start: Date, end: Date) {
  const [blocked, overlapping] = await Promise.all([
    prisma.blockedDate.count({ where: { rentalId, date: { gte: start, lt: end } } }),
    prisma.booking.count({ where: { rentalId, status: { in: ['accepted', 'confirmed', 'in_progress'] }, startDate: { lt: end }, endDate: { gt: start } } }),
  ]);
  if (blocked || overlapping) throw conflict('dates_unavailable');
}

// Called by the sandbox timer or by a real provider webhook.
export async function settlePayment(paymentId: string, ok: boolean) {
  const p = await prisma.payment.findUnique({ where: { id: paymentId }, include: { booking: { include: { rental: true, renter: true } } } });
  if (!p || p.status !== 'pending') return;
  await prisma.payment.update({ where: { id: p.id }, data: { status: ok ? 'succeeded' : 'failed' } });
  if (p.purpose === 'listing_package' && p.saleListingId && ok) {
    await prisma.saleListing.update({ where: { id: p.saleListingId }, data: { status: 'active' } });
    return;
  }
  const b = p.booking;
  if (!b || !ok) return;
  // Verified renters book instantly; others wait for the host to accept.
  const instant = isVerified(b.renter) && b.renter.licenceStatus === 'done';
  await prisma.booking.update({ where: { id: b.id }, data: { status: instant ? 'confirmed' : 'requested' } });
  const car = `${b.rental.make} ${b.rental.model} ${b.rental.year}`;
  await notify(b.rental.hostId, {
    type: 'booking_request',
    titleEn: instant ? 'New booking' : 'New booking request',
    titleFr: instant ? 'Nouvelle réservation' : 'Nouvelle demande de réservation',
    bodyEn: `${car} · ${isoDay(b.startDate)} → ${isoDay(b.endDate)}`,
    bodyFr: `${car} · ${isoDay(b.startDate)} → ${isoDay(b.endDate)}`,
    link: '/activity?tab=listings',
  });
  if (instant)
    await notify(b.renterId, {
      type: 'booking_confirmed',
      titleEn: 'Booking confirmed',
      titleFr: 'Réservation confirmée',
      bodyEn: `${car} · ${b.reference}`,
      bodyFr: `${car} · ${b.reference}`,
      link: '/activity?tab=trips',
    });
}

const bookingView = (b: Awaited<ReturnType<typeof loadBooking>>) => ({
  id: b.id,
  reference: b.reference,
  status: b.status,
  start: isoDay(b.startDate),
  end: isoDay(b.endDate),
  days: b.days,
  delivery: b.delivery,
  deliveryTo: b.deliveryTo,
  price: { dailyRate: b.dailyRate, subtotal: b.subtotal, deliveryFee: b.deliveryFee, platformFee: b.platformFee, deposit: b.deposit, total: b.total },
  rental: { ...rentalCard(b.rental), pickup: { lat: b.rental.pickupLat, lon: b.rental.pickupLon, address: b.rental.pickupAddress, note: b.rental.pickupNote } },
  host: publicUser(b.rental.host),
  payment: b.payments[0] ? { id: b.payments[0].id, method: b.payments[0].method, status: b.payments[0].status } : null,
});

const loadBooking = async (id: string) => {
  const b = await prisma.booking.findUnique({ where: { id }, include: { rental: { include: { host: true } }, payments: { orderBy: { createdAt: 'desc' } } } });
  if (!b) throw notFound('booking');
  return b;
};

export default async function bookingRoutes(app: FastifyInstance) {
  app.post('/bookings/quote', async (req) => {
    const input = parse(tripInput, req.body);
    const { quote } = await priceTrip(input);
    return quote;
  });

  app.post('/bookings', { preHandler: app.authenticate }, async (req) => {
    const input = parse(
      tripInput.extend({
        method: z.enum(['mtn_momo', 'orange_money', 'card', 'paypal']),
        msisdn: z.string().max(20).optional(),
        note: z.string().max(500).optional(),
      }),
      req.body,
    );
    if ((input.method === 'mtn_momo' || input.method === 'orange_money') && !input.msisdn) throw badRequest('msisdn_required');
    const uid = userId(req);
    const { rental, start, end, quote } = await priceTrip(input);
    if (rental.hostId === uid) throw forbidden('own_listing');
    await assertAvailable(rental.id, start, end);

    const booking = await prisma.booking.create({
      data: {
        reference: bookingReference(),
        rentalId: rental.id,
        renterId: uid,
        status: 'accepted', // reserved while payment is pending
        startDate: start,
        endDate: end,
        days: quote.days,
        delivery: input.delivery,
        deliveryTo: input.delivery ? input.deliveryTo : null,
        note: input.note,
        dailyRate: quote.dailyRate,
        subtotal: quote.subtotal,
        deliveryFee: quote.deliveryFee,
        platformFee: quote.platformFee,
        deposit: quote.deposit,
        total: quote.total,
        hostPayout: quote.hostPayout,
      },
    });
    const init = await payments.initiate({ method: input.method, amount: quote.total, msisdn: input.msisdn, description: `JapExpress ${booking.reference}` });
    const payment = await prisma.payment.create({
      data: { userId: uid, purpose: 'booking', bookingId: booking.id, method: input.method, msisdn: input.msisdn, amount: quote.total, providerRef: init.providerRef },
    });
    // Sandbox: the "customer approves on their phone" after a short delay.
    setTimeout(() => settlePayment(payment.id, true).catch((e) => app.log.error(e)), SANDBOX_CONFIRM_DELAY_MS);
    return { ...bookingView(await loadBooking(booking.id)), redirectUrl: init.redirectUrl ?? null };
  });

  app.get('/bookings/:id', { preHandler: app.authenticate }, async (req) => {
    const { id } = parse(z.object({ id: z.string() }), req.params);
    const b = await loadBooking(id);
    if (b.renterId !== userId(req) && b.rental.hostId !== userId(req)) throw forbidden();
    return bookingView(b);
  });

  app.post('/bookings/:id/cancel', { preHandler: app.authenticate }, async (req) => {
    const { id } = parse(z.object({ id: z.string() }), req.params);
    const b = await loadBooking(id);
    if (b.renterId !== userId(req)) throw forbidden();
    if (!['requested', 'accepted', 'confirmed'].includes(b.status)) throw conflict('not_cancellable');
    // TODO: apply the cancellation policy and refund through the provider.
    await prisma.booking.update({ where: { id }, data: { status: 'cancelled' } });
    return bookingView(await loadBooking(id));
  });

  app.get('/me/trips', { preHandler: app.authenticate }, async (req) => {
    const rows = await prisma.booking.findMany({
      where: { renterId: userId(req), status: { notIn: ['cancelled', 'declined'] } },
      include: { rental: { include: { host: true } }, payments: { orderBy: { createdAt: 'desc' } } },
      orderBy: { startDate: 'desc' },
    });
    const today = parseDay(isoDay(new Date()));
    const views = rows.map(bookingView);
    return {
      upcoming: views.filter((_, i) => rows[i].endDate >= today && rows[i].status !== 'completed'),
      past: views.filter((_, i) => rows[i].endDate < today || rows[i].status === 'completed'),
    };
  });

  // Provider callbacks. TODO: verify signatures per provider before trusting the body.
  app.post('/webhooks/payments/:provider', async (req) => {
    const body = parse(z.object({ providerRef: z.string(), status: z.enum(['succeeded', 'failed']) }), req.body);
    const p = await prisma.payment.findFirst({ where: { providerRef: body.providerRef } });
    if (p) await settlePayment(p.id, body.status === 'succeeded');
    return { ok: true };
  });

}
