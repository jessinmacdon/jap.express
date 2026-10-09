import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, normalize, resolve } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env } from '../env.ts';
import { badRequest, parse } from '../lib/http.ts';
import { createUploadTarget } from '../services/storage.ts';

export const UPLOAD_DIR = resolve(process.cwd(), env.UPLOAD_DIR);

export default async function uploadRoutes(app: FastifyInstance) {
  app.post('/uploads/presign', { preHandler: app.authenticate }, async (req) => {
    const body = parse(z.object({ kind: z.enum(['listing_photo', 'verification', 'chat_image']), contentType: z.string().regex(/^image\/(jpeg|png|webp|heic)$/) }), req.body);
    return createUploadTarget(body.kind, body.contentType);
  });

  // Local-disk stand-in for the object store (see services/storage.ts). Signed-in users only,
  // keys must come from /uploads/presign, and existing files are never overwritten.
  app.addContentTypeParser(/^image\//, { parseAs: 'buffer', bodyLimit: 15 * 1024 * 1024 }, (_req, body, done) => done(null, body));
  app.put('/uploads/*', { preHandler: app.authenticate }, async (req) => {
    const key = normalize((req.params as { '*': string })['*']);
    if (!/^(listing_photo|verification|chat_image)\/[0-9a-f-]{36}$/.test(key)) throw badRequest('bad_key');
    const file = join(UPLOAD_DIR, key);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, req.body as Buffer, { flag: 'wx' }).catch(() => {
      throw badRequest('already_uploaded');
    });
    return { ok: true };
  });
}
