import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(8),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  PUBLIC_URL: z.string().url().default('http://localhost:4000'),
  OTP_DEV_CODE: z.string().regex(/^\d{6}$/).optional(),
  DEMO_AUTOREPLY: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
});

export const env = schema.parse(process.env);
export const isProd = env.NODE_ENV === 'production';
