import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { badRequest, forbidden, notFound, parse, userId } from '../lib/http.ts';
import { rentalCard, saleCard } from '../lib/serialize.ts';
import { notify } from '../services/notify.ts';
import { ensureConversation, postMessage } from './conversations.ts';

const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export default async function socialRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // ---- Favourites (rentals and sales saved together) ----
  app.get('/favourites', async (req) => {
    const favs = await prisma.favourite.findMany({ where: { userId: userId(req) }, orderBy: { createdAt: 'desc' } });
    const ids = (k: 'rent' | 'sale') => favs.filter((f) => f.kind === k).map((f) => f.listingId);
    const [rentals, sales] = await Promise.all([
      prisma.rentalListing.findMany({ where: { id: { in: ids('rent') } }, include: { host: true } }),
      prisma.saleListing.findMany({ where: { id: { in: ids('sale') } }, include: { seller: true } }),
    ]);
    const byId = new Map<string, ReturnType<typeof rentalCard> | ReturnType<typeof saleCard>>([
      ...rentals.map((r) => [r.id, rentalCard(r)] as const),
      ...sales.map((s) => [s.id, saleCard(s)] as const),
    ]);
    return { items: favs.map((f) => byId.get(f.listingId)).filter(Boolean), ids: favs.map((f) => `${f.kind}:${f.listingId}`) };
  });

  app.put('/favourites/:kind/:id', async (req) => {
    const p = parse(z.object({ kind: z.enum(['rent', 'sale']), id: z.string() }), req.params);
    await prisma.favourite.upsert({ where: { userId_kind_listingId: { userId: userId(req), kind: p.kind, listingId: p.id } }, create: { userId: userId(req), kind: p.kind, listingId: p.id }, update: {} });
    return { ok: true };
  });

  app.delete('/favourites/:kind/:id', async (req) => {
    const p = parse(z.object({ kind: z.enum(['rent', 'sale']), id: z.string() }), req.params);
    await prisma.favourite.deleteMany({ where: { userId: userId(req), kind: p.kind, listingId: p.id } });
    return { ok: true };
  });

  // ---- Offers on cars for sale ----
  app.post('/sales/:id/offers', async (req) => {
    const { id } = parse(z.object({ id: z.string() }), req.params);
    const { amount, lang } = parse(z.object({ amount: z.number().int().min(10000), lang: z.enum(['en', 'fr']).default('en') }), req.body);
    const uid = userId(req);
    const sale = await prisma.saleListing.findUnique({ where: { id } });
    if (!sale) throw notFound('sale');
    if (sale.sellerId === uid) throw forbidden('own_listing');
    if (amount > sale.price) throw badRequest('offer_above_price');
    const offer = await prisma.offer.create({ data: { saleListingId: id, buyerId: uid, amount } });
    const conv = await ensureConversation('sale', id, [uid, sale.sellerId]);
    const text = lang === 'fr' ? `Je vous propose ${fmt(amount)} FCFA pour la ${sale.make} ${sale.model}.` : `I'd like to offer ${fmt(amount)} FCFA for the ${sale.make} ${sale.model}.`;
    await postMessage(conv.id, uid, { text, lang });
    await notify(sale.sellerId, { type: 'offer', titleEn: 'New offer', titleFr: 'Nouvelle offre', bodyEn: `${sale.make} ${sale.variant} · ${fmt(amount)} FCFA`, bodyFr: `${sale.make} ${sale.variant} · ${fmt(amount)} FCFA`, link: `/chat/${conv.id}` });
    return { id: offer.id, status: offer.status, conversationId: conv.id };
  });

  app.get('/me/offers', async (req) => {
    const rows = await prisma.offer.findMany({ where: { buyerId: userId(req) }, include: { sale: { include: { seller: true } } }, orderBy: { createdAt: 'desc' } });
    return { items: rows.map((o) => ({ id: o.id, amount: o.amount, counterAmount: o.counterAmount, status: o.status, sale: saleCard(o.sale), createdAt: o.createdAt.toISOString() })) };
  });

  // Seller side. TODO: expose in the app's "My listings" once sellers need it.
  app.post('/offers/:id/respond', async (req) => {
    const { id } = parse(z.object({ id: z.string() }), req.params);
    const body = parse(z.object({ action: z.enum(['accept', 'decline', 'counter']), counterAmount: z.number().int().optional() }), req.body);
    const o = await prisma.offer.findUnique({ where: { id }, include: { sale: true } });
    if (!o) throw notFound('offer');
    if (o.sale.sellerId !== userId(req)) throw forbidden();
    if (body.action === 'counter' && !body.counterAmount) throw badRequest('counter_amount_required');
    const status = body.action === 'accept' ? 'accepted' : body.action === 'decline' ? 'declined' : 'countered';
    const updated = await prisma.offer.update({ where: { id }, data: { status, counterAmount: body.counterAmount } });
    return { id, status: updated.status, counterAmount: updated.counterAmount };
  });

  // ---- Notifications ----
  app.get('/notifications', async (req) => {
    const me = await prisma.user.findUniqueOrThrow({ where: { id: userId(req) } });
    const rows = await prisma.notification.findMany({ where: { userId: me.id }, orderBy: { createdAt: 'desc' }, take: 50 });
    return {
      items: rows.map((n) => ({ id: n.id, type: n.type, title: me.lang === 'fr' ? n.titleFr : n.titleEn, body: me.lang === 'fr' ? n.bodyFr : n.bodyEn, link: n.link, unread: !n.readAt, createdAt: n.createdAt.toISOString() })),
      unread: rows.filter((n) => !n.readAt).length,
    };
  });

  app.post('/notifications/read', async (req) => {
    await prisma.notification.updateMany({ where: { userId: userId(req), readAt: null }, data: { readAt: new Date() } });
    return { ok: true };
  });
}
