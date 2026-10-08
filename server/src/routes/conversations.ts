import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { env } from '../env.ts';
import type { Lang, ListingKind } from '../generated/prisma/client.ts';
import { forbidden, notFound, parse, userId } from '../lib/http.ts';
import { assetUrl, publicUser } from '../lib/serialize.ts';
import { translateMessage } from '../services/translation.ts';

// Seeded demo hosts/sellers use this phone prefix; with DEMO_AUTOREPLY=true they answer.
export const DEMO_PHONE_PREFIX = '+2376990';

const DEMO_REPLIES: Record<ListingKind, { lang: Lang; en: string; fr: string }[]> = {
  rent: [
    { lang: 'fr', fr: 'Oui, MTN MoMo et Orange Money sont acceptés.', en: 'Yes, MTN MoMo and Orange Money are accepted.' },
    { lang: 'fr', fr: "Votre permis et une pièce d'identité suffisent.", en: 'Your licence and an ID are enough.' },
    { lang: 'fr', fr: 'Avec plaisir. Bon vol !', en: 'My pleasure. Safe flight!' },
  ],
  sale: [
    { lang: 'en', en: 'The price is slightly negotiable after viewing.', fr: 'Le prix est légèrement négociable après la visite.' },
    { lang: 'en', en: 'Sure, I can send the papers by photo this evening.', fr: 'Bien sûr, je peux envoyer les papiers en photo ce soir.' },
  ],
};

export async function ensureConversation(kind: ListingKind, listingId: string, userIds: string[]) {
  const existing = await prisma.conversation.findFirst({
    where: { kind, listingId, AND: userIds.map((u) => ({ participants: { some: { userId: u } } })) },
  });
  if (existing) return existing;
  return prisma.conversation.create({ data: { kind, listingId, participants: { create: userIds.map((u) => ({ userId: u })) } } });
}

export async function postMessage(conversationId: string, senderId: string, m: { text?: string; lang: Lang; imageUrl?: string; translation?: string }) {
  const msg = await prisma.message.create({ data: { conversationId, senderId, text: m.text, lang: m.lang, imageUrl: m.imageUrl } });
  if (m.translation) await prisma.messageTranslation.create({ data: { messageId: msg.id, lang: m.lang === 'en' ? 'fr' : 'en', text: m.translation } });
  await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
  await prisma.participant.updateMany({ where: { conversationId, userId: senderId }, data: { lastReadAt: new Date() } });
  return msg;
}

async function listingSummary(kind: ListingKind, id: string) {
  if (kind === 'rent') {
    const r = await prisma.rentalListing.findUnique({ where: { id } });
    return r && { kind, id, title: `${r.make} ${r.model} ${r.year}`, price: r.dailyRate, photo: r.photos[0] ? assetUrl(r.photos[0]) : null };
  }
  const s = await prisma.saleListing.findUnique({ where: { id } });
  return s && { kind, id, title: `${s.make} ${s.variant} ${s.year}`, price: s.price, photo: s.photos[0] ? assetUrl(s.photos[0]) : null };
}

async function messageView(m: { id: string; senderId: string; text: string | null; lang: Lang; imageUrl: string | null; createdAt: Date }, viewer: { id: string; lang: Lang; autoTranslate: boolean }) {
  const mine = m.senderId === viewer.id;
  const needs = !mine && viewer.autoTranslate && !!m.text && m.lang !== viewer.lang;
  return {
    id: m.id,
    mine,
    text: m.text,
    lang: m.lang,
    translation: needs ? await translateMessage(m.id, m.text!, m.lang, viewer.lang) : null,
    imageUrl: m.imageUrl ? assetUrl(m.imageUrl) : null,
    createdAt: m.createdAt.toISOString(),
  };
}

const replyCount = new Map<string, number>();
function scheduleDemoReply(conversationId: string, kind: ListingKind, partnerId: string) {
  const n = replyCount.get(conversationId) ?? 0;
  replyCount.set(conversationId, n + 1);
  const r = DEMO_REPLIES[kind][n % DEMO_REPLIES[kind].length];
  setTimeout(() => {
    postMessage(conversationId, partnerId, { text: r[r.lang], lang: r.lang, translation: r[r.lang === 'en' ? 'fr' : 'en'] }).catch(() => undefined);
  }, 2000);
}

export default async function conversationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/conversations', async (req) => {
    const viewer = await prisma.user.findUniqueOrThrow({ where: { id: userId(req) } });
    const rows = await prisma.conversation.findMany({
      where: { participants: { some: { userId: viewer.id } } },
      include: { participants: { include: { user: true } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' },
    });
    const items = await Promise.all(
      rows.map(async (c) => {
        const partner = c.participants.find((p) => p.userId !== viewer.id)?.user;
        const mePart = c.participants.find((p) => p.userId === viewer.id);
        const last = c.messages[0];
        return {
          id: c.id,
          partner: partner ? publicUser(partner) : null,
          listing: await listingSummary(c.kind, c.listingId),
          last: last ? await messageView(last, viewer) : null,
          unread: !!last && last.senderId !== viewer.id && (!mePart?.lastReadAt || mePart.lastReadAt < last.createdAt),
        };
      }),
    );
    return { items };
  });

  // Open (or reuse) the thread with a listing's host / seller.
  app.post('/conversations', async (req) => {
    const body = parse(z.object({ kind: z.enum(['rent', 'sale']), listingId: z.string() }), req.body);
    const uid = userId(req);
    const owner =
      body.kind === 'rent'
        ? (await prisma.rentalListing.findUnique({ where: { id: body.listingId } }))?.hostId
        : (await prisma.saleListing.findUnique({ where: { id: body.listingId } }))?.sellerId;
    if (!owner) throw notFound('listing');
    if (owner === uid) throw forbidden('own_listing');
    const c = await ensureConversation(body.kind, body.listingId, [uid, owner]);
    return { id: c.id };
  });

  app.get('/conversations/:id', async (req) => {
    const { id } = parse(z.object({ id: z.string() }), req.params);
    const { after } = parse(z.object({ after: z.string().datetime().optional() }), req.query);
    const viewer = await prisma.user.findUniqueOrThrow({ where: { id: userId(req) } });
    const c = await prisma.conversation.findUnique({ where: { id }, include: { participants: { include: { user: true } } } });
    if (!c) throw notFound('conversation');
    if (!c.participants.some((p) => p.userId === viewer.id)) throw forbidden();
    const msgs = await prisma.message.findMany({ where: { conversationId: id, createdAt: after ? { gt: new Date(after) } : undefined }, orderBy: { createdAt: 'asc' } });
    await prisma.participant.updateMany({ where: { conversationId: id, userId: viewer.id }, data: { lastReadAt: new Date() } });
    const partner = c.participants.find((p) => p.userId !== viewer.id)?.user;
    return {
      id: c.id,
      partner: partner ? publicUser(partner) : null,
      partnerRole: c.kind === 'rent' ? 'host' : partner?.sellerType ?? 'private',
      listing: await listingSummary(c.kind, c.listingId),
      messages: await Promise.all(msgs.map((m) => messageView(m, viewer))),
    };
  });

  app.post('/conversations/:id/messages', async (req) => {
    const { id } = parse(z.object({ id: z.string() }), req.params);
    const body = parse(z.object({ text: z.string().trim().min(1).max(2000).optional(), imageUrl: z.string().optional(), lang: z.enum(['en', 'fr']) }).refine((b) => b.text || b.imageUrl, 'text or imageUrl required'), req.body);
    const viewer = await prisma.user.findUniqueOrThrow({ where: { id: userId(req) } });
    const c = await prisma.conversation.findUnique({ where: { id }, include: { participants: { include: { user: true } } } });
    if (!c || !c.participants.some((p) => p.userId === viewer.id)) throw notFound('conversation');
    const msg = await postMessage(id, viewer.id, body);
    const partner = c.participants.find((p) => p.userId !== viewer.id)?.user;
    if (env.DEMO_AUTOREPLY && partner?.phone.startsWith(DEMO_PHONE_PREFIX)) scheduleDemoReply(id, c.kind, partner.id);
    // TODO: push notification to the partner.
    return messageView(msg, viewer);
  });
}
