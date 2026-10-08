import type { FastifyReply, FastifyRequest } from 'fastify';
import { z, type ZodTypeAny } from 'zod';

export class HttpError extends Error {
  constructor(public statusCode: number, public code: string, message?: string) {
    super(message ?? code);
  }
}

export const badRequest = (code: string, message?: string) => new HttpError(400, code, message);
export const notFound = (what = 'not_found') => new HttpError(404, what);
export const forbidden = (code = 'forbidden') => new HttpError(403, code);
export const conflict = (code: string) => new HttpError(409, code);

export function parse<S extends ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const r = schema.safeParse(data);
  if (!r.success) throw new HttpError(400, 'validation_error', r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
  return r.data;
}

export function userId(req: FastifyRequest): string {
  const u = req.user as { sub?: string } | undefined;
  if (!u?.sub) throw new HttpError(401, 'unauthorized');
  return u.sub;
}

export function errorHandler(err: Error & { statusCode?: number; code?: string }, _req: FastifyRequest, reply: FastifyReply) {
  if (err instanceof HttpError) return reply.status(err.statusCode).send({ error: err.code, message: err.message });
  const status = err.statusCode && err.statusCode < 500 ? err.statusCode : 500;
  if (status === 500) reply.log.error(err);
  return reply.status(status).send({ error: status === 500 ? 'internal_error' : (err.code ?? 'error'), message: status === 500 ? 'Something went wrong' : err.message });
}

// Query-string helpers
export const csv = z
  .string()
  .optional()
  .transform((v) => (v ? v.split(',').filter(Boolean) : []));
export const intQ = z.coerce.number().int().optional();
export const boolQ = z
  .enum(['true', 'false'])
  .optional()
  .transform((v) => v === 'true');
