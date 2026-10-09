import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(8),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  // Public base URL used in photo links. On Railway it defaults to the service's public domain.
  PUBLIC_URL: z
    .string()
    .url()
    .default(process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : 'http://localhost:4000'),
  // Fixed OTP for demos and testing. Anyone who knows it can sign in to any number: never set it for real users.
  OTP_DEV_CODE: z.string().regex(/^\d{6}$/).optional(),
  // Where uploaded photos are stored until object storage (S3/R2) is wired up. Point it at a persistent volume.
  UPLOAD_DIR: z.string().default('uploads'),
  DEMO_AUTOREPLY: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
});

export const env = schema.parse(process.env);
export const isProd = env.NODE_ENV === 'production';
