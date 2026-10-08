// Business rules for rental money flows. Every FCFA amount is an integer.
// TODO(business): confirm the real fee rates before launch.
export const RENTER_FEE_RATE = 0.08; // "Platform fee (8%)" shown at checkout
export const HOST_FEE_RATE = 0.15; // taken from the host's share ("after JapExpress fees")
export const WEEKLY_DISCOUNT_RATE = 0.1;
export const LISTING_PACKAGES = {
  basic: { price: 5000, days: 30 },
  featured: { price: 15000, days: 30 },
} as const;

export interface RentalPricingInput {
  dailyRate: number;
  deposit: number;
  days: number;
  weeklyDiscount: boolean;
  deliveryFee: number; // 0 when no delivery
}

export function quoteRental(i: RentalPricingInput) {
  const days = Math.max(1, i.days);
  const gross = i.dailyRate * days;
  const discount = i.weeklyDiscount && days >= 7 ? Math.round(gross * WEEKLY_DISCOUNT_RATE) : 0;
  const subtotal = gross - discount;
  const platformFee = Math.round(subtotal * RENTER_FEE_RATE);
  const total = subtotal + i.deliveryFee + platformFee + i.deposit;
  const hostPayout = Math.round(subtotal * (1 - HOST_FEE_RATE)) + i.deliveryFee;
  return { days, dailyRate: i.dailyRate, gross, discount, subtotal, deliveryFee: i.deliveryFee, platformFee, deposit: i.deposit, total, hostPayout };
}

export function estimateMonthlyEarnings(dailyRate: number, daysBooked: number) {
  return Math.round((dailyRate * daysBooked * (1 - HOST_FEE_RATE)) / 500) * 500;
}
