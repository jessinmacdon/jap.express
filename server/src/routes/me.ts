import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { notFound, parse, userId } from '../lib/http.ts';
import { me } from '../lib/serialize.ts';

const VERIFICATION_FIELD = { id: 'idStatus', licence: 'licenceStatus', selfie: 'selfieStatus' } as const;

export default async function meRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/me', async (req) => {
    const u = await prisma.user.findUnique({ where: { id: userId(req) } });
    if (!u) throw notFound('user');
    return me(u);
  });

  app.patch('/me', async (req) => {
    const body = parse(
      z.object({
        firstName: z.string().trim().min(1).max(60).optional(),
        lastName: z.string().trim().max(60).optional(),
        email: z.string().email().or(z.literal('')).optional(),
        lang: z.enum(['en', 'fr']).optional(),
        autoTranslate: z.boolean().optional(),
        goals: z.array(z.enum(['rent', 'buy', 'host', 'sell'])).optional(),
        homeLabel: z.string().max(80).optional(),
        payoutMethod: z.enum(['mtn_momo', 'orange_money']).optional(),
        payoutMsisdn: z.string().max(20).optional(),
      }),
      req.body,
    );
    const u = await prisma.user.update({ where: { id: userId(req) }, data: { ...body, email: body.email === '' ? null : body.email } });
    return me(u);
  });

  // Upload ID / licence / selfie. Files are uploaded first via /uploads/presign.
  // TODO: hand off to a KYC provider (e.g. Smile ID, which covers Cameroon) and
  // update the status from its webhook. The dev flow approves after a delay.
  app.post('/me/verifications/:kind', async (req) => {
    const { kind } = parse(z.object({ kind: z.enum(['id', 'licence', 'selfie']) }), req.params);
    const { fileUrls } = parse(z.object({ fileUrls: z.array(z.string()).default([]) }), req.body ?? {});
    const uid = userId(req);
    await prisma.verificationDocument.create({ data: { userId: uid, kind, fileUrls } });
    const u = await prisma.user.update({ where: { id: uid }, data: { [VERIFICATION_FIELD[kind]]: 'checking' } });
    setTimeout(() => {
      prisma.user.update({ where: { id: uid }, data: { [VERIFICATION_FIELD[kind]]: 'done' } }).catch(() => undefined);
    }, 1300);
    return me(u);
  });
}
