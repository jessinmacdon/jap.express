import type { PaymentMethod } from '../generated/prisma/client.ts';

// Collections (renter → JapExpress, seller → JapExpress for listing packages)
// and disbursements (JapExpress → host payouts).
//
// Real integrations to add:
//  - MTN MoMo Collection & Disbursement API (USSD approval *126#)
//  - Orange Money Web Payment / Cash-in API (#150*50#)
//  - Card: a PSP that settles in XAF and accepts EUR/USD/GBP cards
//  - PayPal Checkout for diaspora customers
// Providers confirm asynchronously, so the real flow is:
//   initiate() → status "pending" → provider webhook → POST /webhooks/payments/:provider
export interface InitiateResult {
  providerRef: string;
  status: 'pending' | 'succeeded' | 'failed';
  redirectUrl?: string; // card / PayPal hosted page
}

export interface PaymentProvider {
  initiate(input: { method: PaymentMethod; amount: number; msisdn?: string; description: string }): Promise<InitiateResult>;
  payout(input: { method: PaymentMethod; amount: number; msisdn: string }): Promise<{ providerRef: string; status: 'pending' | 'sent' | 'failed' }>;
}

class SandboxPaymentProvider implements PaymentProvider {
  async initiate({ method }: { method: PaymentMethod }) {
    // Mobile money needs the customer to approve on their phone; the sandbox
    // reports "pending" and the API confirms it after a short delay.
    const ref = `sbx_${method}_${Date.now().toString(36)}`;
    return { providerRef: ref, status: 'pending' as const };
  }
  async payout({ method }: { method: PaymentMethod }) {
    return { providerRef: `sbx_payout_${method}_${Date.now().toString(36)}`, status: 'sent' as const };
  }
}

export function createPaymentProvider(): PaymentProvider {
  return new SandboxPaymentProvider();
}

export const SANDBOX_CONFIRM_DELAY_MS = 1500;
