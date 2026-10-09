// Integration tests against a real Postgres (DATABASE_URL), reseeded first.
import { execSync } from 'node:child_process';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.ts';
import { prisma } from '../src/db.ts';

let app: FastifyInstance;
let token: string;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const call = async (method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string, payload?: unknown) => {
  const res = await app.inject({ method, url, payload: payload as object, headers: token ? { authorization: `Bearer ${token}` } : {} });
  return { status: res.statusCode, body: res.json() };
};
const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);

beforeAll(async () => {
  execSync('npx tsx prisma/seed.ts', { stdio: 'ignore' });
  app = await buildApp({ logger: false });
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe('auth', () => {
  it('rejects sign-in for unknown numbers', async () => {
    const r = await call('POST', '/auth/otp/request', { cc: '+33', phone: '612345678', flow: 'signin' });
    expect(r.status).toBe(404);
  });

  it('signs up a new diaspora user with the dev OTP', async () => {
    const r1 = await call('POST', '/auth/otp/request', { cc: '+33', phone: '6 12 34 56 78', flow: 'signup' });
    expect(r1.body.phone).toBe('+33612345678');
    const bad = await call('POST', '/auth/otp/verify', { phone: '+33612345678', code: '000000' });
    expect(bad.body.error).toBe('wrong_code');
    const r2 = await call('POST', '/auth/otp/verify', { phone: '+33612345678', code: '482913' });
    expect(r2.body.isNew).toBe(true);
    expect(r2.body.user.verification.phone).toBe('done');
  });

  it('signs in the seeded demo user', async () => {
    await call('POST', '/auth/otp/request', { cc: '+237', phone: '6 77 12 34 56', flow: 'signin' });
    const r = await call('POST', '/auth/otp/verify', { phone: '+237677123456', code: '482913' });
    expect(r.body.isNew).toBe(false);
    token = r.body.token;
    const me = await call('GET', '/me');
    expect(me.body.firstName).toBe('Nadine');
  });
});

describe('catalog', () => {
  it('filters rentals', async () => {
    const all = await call('GET', '/rentals');
    const seven = await call('GET', '/rentals?seats=7');
    const ev = await call('GET', '/rentals?fuel=electric&city=Douala');
    expect(all.body.items.length).toBeGreaterThan(seven.body.items.length);
    expect(seven.body.items.every((c: { seats: number }) => c.seats >= 7)).toBe(true);
    expect(ev.body.items.map((c: { model: string }) => c.model)).toEqual(['Scénic E-Tech']);
  });

  it('filters sales', async () => {
    const r = await call('GET', '/sales?cond=new');
    expect(r.body.items).toHaveLength(1);
    const dealer = await call('GET', '/sales?seller=dealer&priceMax=10000000');
    expect(dealer.body.items.every((c: { seller: { type: string }; price: number }) => c.seller.type === 'dealer' && c.price <= 10_000_000)).toBe(true);
  });

  it('returns rental detail with translation and unavailable days', async () => {
    const list = await call('GET', '/rentals?make=Toyota&model=RAV4');
    const r = await call('GET', `/rentals/${list.body.items[0].id}?lang=en`);
    expect(r.body.description.lang).toBe('fr');
    expect(r.body.description.translation.text).toMatch(/Well-maintained/);
    expect(r.body.unavailable).toContain(day(0));
  });
});

describe('booking and payment', () => {
  it('quotes, books, pays and confirms instantly for a verified renter', async () => {
    const r3 = (await call('GET', '/rentals?fuel=electric')).body.items[0];
    const trip = { rentalId: r3.id, start: day(20), end: day(23), delivery: true, deliveryTo: 'dla' };
    const q = await call('POST', '/bookings/quote', trip);
    expect(q.body).toMatchObject({ days: 3, subtotal: 135000, deliveryFee: 5000, platformFee: 10800, deposit: 100000, total: 250800 });
    const b = await call('POST', '/bookings', { ...trip, method: 'mtn_momo', msisdn: '+237677123456' });
    expect(b.body.payment.status).toBe('pending');
    await sleep(1800);
    const after = await call('GET', `/bookings/${b.body.id}`);
    expect(after.body.status).toBe('confirmed');
    const again = await call('POST', '/bookings', { ...trip, method: 'mtn_momo', msisdn: '+237677123456' });
    expect(again.body.error).toBe('dates_unavailable');
  });

  it('lists trips', async () => {
    const r = await call('GET', '/me/trips');
    expect(r.body.upcoming.length).toBeGreaterThanOrEqual(2);
    expect(r.body.past).toHaveLength(1);
  });
});

describe('host', () => {
  it('shows the dashboard figures from the design', async () => {
    const r = await call('GET', '/host/dashboard');
    expect(r.body.earnings).toEqual({ thisMonth: 485000, total: 3870000, available: 412000 });
    expect(r.body.requests.filter((x: { status: string }) => x.status === 'requested')).toHaveLength(2);
  });

  it('accepts a request and pays out', async () => {
    const dash = await call('GET', '/host/dashboard');
    const req = dash.body.requests.find((x: { status: string }) => x.status === 'requested');
    const a = await call('POST', `/host/requests/${req.id}/accept`);
    expect(a.body.status).toBe('confirmed');
    const p = await call('POST', '/host/payouts', {});
    expect(p.body.amount).toBeGreaterThanOrEqual(412000);
    const p2 = await call('POST', '/host/payouts', {});
    expect(p2.body.error).toBe('nothing_to_pay_out');
  });
});

describe('social', () => {
  it('toggles favourites', async () => {
    const before = await call('GET', '/favourites');
    expect(before.body.items).toHaveLength(3);
    const id = before.body.items[0].id;
    await call('DELETE', `/favourites/rent/${id}`);
    expect((await call('GET', '/favourites')).body.items).toHaveLength(2);
    await call('PUT', `/favourites/rent/${id}`);
    expect((await call('GET', '/favourites')).body.items).toHaveLength(3);
  });

  it('chats with auto-translation', async () => {
    const list = await call('GET', '/conversations');
    const armel = list.body.items.find((c: { listing: { kind: string } }) => c.listing.kind === 'rent');
    const thread = await call('GET', `/conversations/${armel.id}`);
    const first = thread.body.messages[0];
    expect(first.lang).toBe('fr');
    expect(first.translation).toMatch(/^Hi Nadine/);
    const sent = await call('POST', `/conversations/${armel.id}/messages`, { text: 'Can I pay with MoMo?', lang: 'en' });
    expect(sent.body.mine).toBe(true);
  });

  it('sends an offer that lands in the seller thread', async () => {
    const s = (await call('GET', '/sales?make=Kia')).body.items[0];
    const r = await call('POST', `/sales/${s.id}/offers`, { amount: 3200000, lang: 'en' });
    expect(r.body.status).toBe('pending');
    const offers = await call('GET', '/me/offers');
    expect(offers.body.items).toHaveLength(2);
  });
});

describe('uploads', () => {
  it('only accepts presigned keys from signed-in users, once', async () => {
    const t = await call('POST', '/uploads/presign', { kind: 'chat_image', contentType: 'image/jpeg' });
    const put = (headers: Record<string, string>) => app.inject({ method: 'PUT', url: `/uploads/${t.body.key}`, payload: Buffer.from('fake-jpeg'), headers: { 'content-type': 'image/jpeg', ...headers } });
    expect((await put({})).statusCode).toBe(401);
    expect((await put({ authorization: `Bearer ${token}` })).statusCode).toBe(200);
    expect((await put({ authorization: `Bearer ${token}` })).json().error).toBe('already_uploaded');
    const bad = await app.inject({ method: 'PUT', url: '/uploads/../../etc/x', payload: Buffer.from('x'), headers: { 'content-type': 'image/jpeg', authorization: `Bearer ${token}` } });
    expect(bad.statusCode).toBeGreaterThanOrEqual(400);
  });
});
