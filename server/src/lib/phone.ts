import { z } from 'zod';

// Cameroon plus the diaspora countries offered at sign-up.
export const COUNTRY_CODES = ['+237', '+33', '+32', '+49', '+44', '+1'] as const;

export const phoneInput = z.object({
  cc: z.enum(COUNTRY_CODES),
  phone: z.string().min(6).max(20),
});

export function toE164(cc: string, phone: string) {
  const digits = phone.replace(/\D/g, '').replace(/^0+/, '');
  if (digits.length < 8 || digits.length > 12) throw new Error('invalid_phone');
  return `${cc}${digits}`;
}
