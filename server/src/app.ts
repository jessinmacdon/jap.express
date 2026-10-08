import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import { isProd } from './env.ts';
import auth from './lib/auth.ts';
import { errorHandler } from './lib/http.ts';
import authRoutes from './routes/auth.ts';
import bookingRoutes from './routes/bookings.ts';
import catalogRoutes from './routes/catalog.ts';
import conversationRoutes from './routes/conversations.ts';
import hostRoutes from './routes/host.ts';
import meRoutes from './routes/me.ts';
import socialRoutes from './routes/social.ts';
import uploadRoutes, { UPLOAD_DIR } from './routes/uploads.ts';

export async function buildApp(opts: { logger?: boolean } = {}) {
  const app = Fastify({ logger: opts.logger ?? (isProd ? true : { transport: undefined, level: 'info' }) });
  app.setErrorHandler(errorHandler);

  // TODO: restrict origins in production.
  await app.register(cors, { origin: true });
  await app.register(sensible);
  await app.register(auth);

  await app.register(fastifyStatic, { root: join(process.cwd(), 'public'), prefix: '/static/' });
  mkdirSync(UPLOAD_DIR, { recursive: true });
  await app.register(fastifyStatic, { root: UPLOAD_DIR, prefix: '/uploads/', decorateReply: false });

  app.get('/health', async () => ({ ok: true }));

  // Encapsulated route groups; each adds its own auth hooks where needed.
  for (const r of [authRoutes, meRoutes, catalogRoutes, bookingRoutes, hostRoutes, socialRoutes, conversationRoutes, uploadRoutes]) {
    await app.register(r);
  }
  return app;
}
