import { prisma } from '../db.ts';

// In-app notifications. TODO: also send push (Expo push tokens) and SMS for
// booking-critical events.
export async function notify(userId: string, n: { type: string; titleEn: string; titleFr: string; bodyEn: string; bodyFr: string; link?: string }) {
  return prisma.notification.create({ data: { userId, ...n } });
}
