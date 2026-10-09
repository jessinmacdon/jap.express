import { createHash, randomInt } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { env } from '../env.ts';
import { badRequest, HttpError, parse } from '../lib/http.ts';
import { phoneInput, toE164 } from '../lib/phone.ts';
import { me } from '../lib/serialize.ts';
import { createSmsProvider } from '../services/sms.ts';

const sms = createSmsProvider();
const OTP_TTL_MS = 10 * 60_000;
const OTP_RESEND_MS = 45_000;
const MAX_ATTEMPTS = 5;
const hash = (phone: string, code: string) => createHash('sha256').update(`${phone}:${code}:${env.JWT_SECRET}`).digest('hex');

export default async function authRoutes(app: FastifyInstance) {
  // Step 1 (sign up and sign in): send a 6-digit code by SMS / WhatsApp.
  app.post('/auth/otp/request', async (req) => {
    const body = parse(phoneInput.extend({ flow: z.enum(['signup', 'signin']), lang: z.enum(['en', 'fr']).default('en') }), req.body);
    let phone: string;
    try {
      phone = toE164(body.cc, body.phone);
    } catch {
      throw badRequest('invalid_phone');
    }
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (body.flow === 'signin' && !existing) throw new HttpError(404, 'no_account');

    const last = await prisma.otpCode.findFirst({ where: { phone }, orderBy: { createdAt: 'desc' } });
    if (last && Date.now() - last.createdAt.getTime() < OTP_RESEND_MS && !last.usedAt) {
      return { phone, resendInSec: Math.ceil((OTP_RESEND_MS - (Date.now() - last.createdAt.getTime())) / 1000) };
    }
    const code = env.OTP_DEV_CODE ?? String(randomInt(0, 1_000_000)).padStart(6, '0');
    await prisma.otpCode.create({ data: { phone, codeHash: hash(phone, code), expiresAt: new Date(Date.now() + OTP_TTL_MS) } });
    await sms.sendOtp(phone, code, body.lang);
    return { phone, resendInSec: OTP_RESEND_MS / 1000 };
  });

  // Step 2: verify the code. Creates the account on first sign-up.
  app.post('/auth/otp/verify', async (req) => {
    const body = parse(z.object({ phone: z.string(), code: z.string().regex(/^\d{6}$/), lang: z.enum(['en', 'fr']).optional() }), req.body);
    const otp = await prisma.otpCode.findFirst({ where: { phone: body.phone, usedAt: null }, orderBy: { createdAt: 'desc' } });
    if (!otp || otp.expiresAt < new Date()) throw badRequest('code_expired');
    if (otp.attempts >= MAX_ATTEMPTS) throw new HttpError(429, 'too_many_attempts');
    if (otp.codeHash !== hash(body.phone, body.code)) {
      await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
      throw badRequest('wrong_code');
    }
    await prisma.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } });

    let user = await prisma.user.findUnique({ where: { phone: body.phone } });
    const isNew = !user;
    if (!user) user = await prisma.user.create({ data: { phone: body.phone, phoneVerifiedAt: new Date(), lang: body.lang ?? 'en' } });
    const token = app.jwt.sign({ sub: user.id });
    return { token, isNew, user: me(user) };
  });
}
