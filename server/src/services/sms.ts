// OTP delivery. Swap ConsoleSmsProvider for a real one (e.g. Twilio Verify,
// Africa's Talking, or the WhatsApp Business API) via createSmsProvider().
export interface SmsProvider {
  sendOtp(phoneE164: string, code: string, lang: 'en' | 'fr'): Promise<void>;
}

class ConsoleSmsProvider implements SmsProvider {
  async sendOtp(phone: string, code: string) {
    console.info(`[sms:dev] OTP for ${phone}: ${code}`);
  }
}

export function createSmsProvider(): SmsProvider {
  // TODO: read SMS_PROVIDER from env and return the real implementation.
  return new ConsoleSmsProvider();
}
