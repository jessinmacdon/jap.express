import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, normalize } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { isProd } from '../env.ts';
import { badRequest, parse } from '../lib/http.ts';
import { createUploadTarget } from '../services/storage.ts';

export const UPLOAD_DIR = join(process.cwd(), 'uploads');

export default async function uploadRoutes(app: FastifyInstance) {
  app.post('/uploads/presign', { preHandler: app.authenticate }, async (req) => {
    const body = parse(z.object({ kind: z.enum(['listing_photo', 'verification', 'chat_image']), contentType: z.string().regex(/^image\/(jpeg|png|webp|heic)$/) }), req.body);
    return createUploadTarget(body.kind, body.contentType);
  });

  // Dev-only stand-in for the object store.
  if (!isProd) {
    app.addContentTypeParser(/^image\//, { parseAs: 'buffer', bodyLimit: 15 * 1024 * 1024 }, (_req, body, done) => done(null, body));
    app.put('/uploads/*', async (req) => {
      const key = normalize((req.params as { '*': string })['*']);
      if (key.startsWith('..')) throw badRequest('bad_key');
      const file = join(UPLOAD_DIR, key);
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, req.body as Buffer);
      return { ok: true };
    });
  }
}
