// Seeds the sample data from the Claude Design prototype (JapExpress v3).
// Dates are relative to "today" so the demo always has upcoming trips.
// Demo login: +237 6 77 12 34 56, code = OTP_DEV_CODE (482913).
import { prisma } from '../src/db.ts';
import type { Fuel, Lang, Transmission } from '../src/generated/prisma/client.ts';
import { CITIES, type City } from '../src/lib/places.ts';
import { quoteRental } from '../src/lib/pricing.ts';
import { DEMO_PHONE_PREFIX } from '../src/routes/conversations.ts';

const DAY = 86_400_000;
const today = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
const d = (offset: number) => new Date(today.getTime() + offset * DAY);
const at = (offsetDays: number, hh: number, mm: number) => new Date(d(offsetDays).getTime() + (hh * 60 + mm) * 60_000);
const img = (n: number) => `/static/img/car${n}.jpg`;
const year = (y: number) => new Date(Date.UTC(y, 2, 1));

const PICKUP: Record<City, { addr: string; note: { en: string; fr: string } }> = {
  Douala: { addr: 'Rue Joffre, Akwa, Douala', note: { en: 'Car park opposite Pharmacie du Centre. Call when you arrive.', fr: "Parking en face de la Pharmacie du Centre. Appelez à l'arrivée." } },
  'Yaoundé': { addr: 'Avenue Kennedy, Centre-ville, Yaoundé', note: { en: 'Underground car park, level -1.', fr: 'Parking souterrain, niveau -1.' } },
  Kribi: { addr: 'Boulevard de la Mer, Kribi', note: { en: 'In front of the Hôtel Ilomba gate.', fr: "Devant le portail de l'hôtel Ilomba." } },
  'Limbé': { addr: 'Down Beach, Limbé', note: { en: 'Next to the fish market.', fr: 'À côté du marché aux poissons.' } },
  Bafoussam: { addr: 'Marché A, Bafoussam', note: { en: 'Main entrance, blue gate.', fr: 'Entrée principale, portail bleu.' } },
};
const REGION: Record<City, [string, string]> = { Douala: ['Littoral', 'du Littoral'], 'Yaoundé': ['Centre', 'du Centre'], Kribi: ['South', 'du Sud'], 'Limbé': ['South-West', 'du Sud-Ouest'], Bafoussam: ['West', "de l'Ouest"] };
const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

async function reset() {
  // Children first.
  await prisma.$transaction([
    prisma.messageTranslation.deleteMany(),
    prisma.message.deleteMany(),
    prisma.participant.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.listingTranslation.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.favourite.deleteMany(),
    prisma.offer.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.payout.deleteMany(),
    prisma.booking.deleteMany(),
    prisma.blockedDate.deleteMany(),
    prisma.rentalListing.deleteMany(),
    prisma.saleListing.deleteMany(),
    prisma.verificationDocument.deleteMany(),
    prisma.otpCode.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

let demoN = 0;
const demoUser = (data: { firstName?: string; lastName?: string; businessName?: string; since: number; sellerType?: 'private' | 'dealer'; area?: string; lang?: Lang }) =>
  prisma.user.create({
    data: {
      phone: `${DEMO_PHONE_PREFIX}${String(++demoN).padStart(4, '0')}`,
      firstName: data.firstName,
      lastName: data.lastName,
      businessName: data.businessName,
      sellerType: data.sellerType ?? 'private',
      areaLabel: data.area,
      lang: data.lang ?? 'fr',
      phoneVerifiedAt: year(data.since),
      idStatus: 'done',
      licenceStatus: 'done',
      selfieStatus: 'done',
      responseNote: 'Usually replies in 10 min',
      createdAt: year(data.since),
    },
  });

async function main() {
  await reset();

  // ---- People ----
  const nadine = await prisma.user.create({
    data: {
      phone: '+237677123456',
      firstName: 'Nadine',
      lastName: 'Ekwalla',
      email: 'nadine@example.com',
      lang: 'en',
      goals: ['rent', 'host'],
      homeLabel: 'Paris → Douala',
      phoneVerifiedAt: year(2024),
      idStatus: 'done',
      licenceStatus: 'done',
      selfieStatus: 'done',
      payoutMethod: 'mtn_momo',
      payoutMsisdn: '+237677123456',
      createdAt: year(2024),
    },
  });
  const armel = await demoUser({ firstName: 'Armel', lastName: 'Nkoulou', since: 2023 });
  const brice = await demoUser({ firstName: 'Brice', lastName: 'Tchoua', since: 2022 });
  const carine = await demoUser({ firstName: 'Carine', lastName: 'Mbappe', since: 2024 });
  const serge = await demoUser({ firstName: 'Serge', lastName: 'Fotso', since: 2023 });
  const diane = await demoUser({ firstName: 'Diane', lastName: 'Eyenga', since: 2024 });
  const yannick = await demoUser({ firstName: 'Yannick', lastName: 'Bell', since: 2025 });
  const laure = await demoUser({ firstName: 'Laure', lastName: 'Mvogo', since: 2025 });
  const sellers = {
    bonapriso: await demoUser({ businessName: 'Auto Bonapriso', sellerType: 'dealer', since: 2021, area: 'Akwa, Douala', lang: 'en' }),
    akwa: await demoUser({ businessName: 'Akwa Motors', sellerType: 'dealer', since: 2019, area: 'Akwa, Douala', lang: 'en' }),
    prestige: await demoUser({ businessName: 'Prestige Auto Bastos', sellerType: 'dealer', since: 2020, area: 'Bastos, Yaoundé' }),
    mireille: await demoUser({ firstName: 'Mireille', lastName: 'Atangana', sellerType: 'private', since: 2024, area: 'Mvan, Yaoundé' }),
    paul: await demoUser({ firstName: 'Paul', lastName: 'Njoya', sellerType: 'private', since: 2023, area: 'Bonamoussadi, Douala', lang: 'en' }),
    ouest: await demoUser({ businessName: 'Ouest Auto', sellerType: 'dealer', since: 2020, area: 'Centre, Bafoussam' }),
  };

  // ---- Rentals ----
  type R = { key: string; host: string; make: string; model: string; year: number; city: City; rate: number; rating: number; trips: number; seats: number; trans: Transmission; fuel: Fuel; deliv: boolean; photos?: string[]; featured?: boolean; desc?: { en: string; fr: string } };
  const RENTALS: R[] = [
    { key: 'r1', host: armel.id, make: 'Toyota', model: 'RAV4', year: 2019, city: 'Douala', rate: 35000, rating: 4.9, trips: 38, seats: 5, trans: 'auto', fuel: 'petrol', deliv: true, featured: true, desc: { fr: "RAV4 bien entretenue, climatisation impeccable, idéale pour Douala et les routes vers Kribi ou Limbé. Vidange faite en septembre. Je peux vous accueillir à l'aéroport de Douala à votre arrivée.", en: 'Well-maintained RAV4 with excellent air conditioning, ideal for Douala and the roads to Kribi or Limbé. Oil changed in September. I can meet you at Douala airport when you land.' } },
    { key: 'r2', host: brice.id, make: 'Toyota', model: 'Corolla', year: 2017, city: 'Yaoundé', rate: 25000, rating: 4.8, trips: 61, seats: 5, trans: 'auto', fuel: 'petrol', deliv: true },
    { key: 'r3', host: carine.id, make: 'Renault', model: 'Scénic E-Tech', year: 2024, city: 'Douala', rate: 45000, rating: 4.9, trips: 22, seats: 5, trans: 'auto', fuel: 'electric', deliv: true, photos: [img(3)], featured: true },
    { key: 'r4', host: serge.id, make: 'Toyota', model: 'Prado', year: 2018, city: 'Yaoundé', rate: 65000, rating: 5.0, trips: 17, seats: 7, trans: 'auto', fuel: 'diesel', deliv: true },
    { key: 'r5', host: diane.id, make: 'Suzuki', model: 'Swift', year: 2021, city: 'Kribi', rate: 18000, rating: 4.7, trips: 30, seats: 5, trans: 'manual', fuel: 'petrol', deliv: false },
    { key: 'r6', host: armel.id, make: 'Toyota', model: 'Hiace', year: 2016, city: 'Douala', rate: 55000, rating: 4.8, trips: 44, seats: 14, trans: 'manual', fuel: 'diesel', deliv: true },
    // Nadine's own cars (she hosts too)
    { key: 'n1', host: nadine.id, make: 'Toyota', model: 'Yaris', year: 2018, city: 'Douala', rate: 20000, rating: 4.8, trips: 19, seats: 5, trans: 'auto', fuel: 'petrol', deliv: true },
    { key: 'n2', host: nadine.id, make: 'Kia', model: 'Sportage', year: 2019, city: 'Douala', rate: 30000, rating: 4.9, trips: 26, seats: 5, trans: 'auto', fuel: 'petrol', deliv: true },
  ];
  const rid: Record<string, string> = {};
  for (const [i, r] of RENTALS.entries()) {
    const c = CITIES[r.city];
    const desc = r.desc ?? {
      fr: `${r.make} ${r.model} propre et climatisée, parfaite pour la ville comme pour la route. Kilométrage illimité dans la région ${REGION[r.city][1]}. Remise des clés en main propre.`,
      en: `Clean, air-conditioned ${r.make} ${r.model}, great for the city and the open road. Unlimited mileage within the ${REGION[r.city][0]} region. Keys handed over in person.`,
    };
    const row = await prisma.rentalListing.create({
      data: {
        hostId: r.host,
        make: r.make,
        model: r.model,
        year: r.year,
        city: r.city,
        seats: r.seats,
        transmission: r.trans,
        fuel: r.fuel,
        dailyRate: r.rate,
        deliveryAirport: r.deliv,
        deliveryCity: r.deliv,
        pickupLat: c.lat + (i % 3) * 0.002,
        pickupLon: c.lon - (i % 2) * 0.002,
        pickupAddress: PICKUP[r.city].addr,
        pickupNote: PICKUP[r.city].note.fr,
        description: desc.fr,
        descriptionLang: 'fr',
        photos: r.photos ?? [],
        rating: r.rating,
        tripsCount: r.trips,
        featured: !!r.featured,
      },
    });
    rid[r.key] = row.id;
    await prisma.listingTranslation.create({ data: { listingKey: `rent:${row.id}`, lang: 'en', text: desc.en } });
  }
  // Already-taken days on the RAV4 (shown struck through on the calendar)
  for (const off of [0, 1, 12, 13, 14]) await prisma.blockedDate.create({ data: { rentalId: rid.r1, date: d(off) } });

  // ---- Sales ----
  type S = { key: string; seller: string; make: string; model: string; variant: string; year: number; km: number; fuel: Fuel; trans: Transmission; color: string; cond: 'new' | 'excellent' | 'good' | 'fair'; price: number; neg: boolean; city: City; seats: number; lang: Lang; photos?: string[]; featured?: boolean; desc?: { en: string; fr: string } };
  const SALES: S[] = [
    { key: 's1', seller: sellers.bonapriso.id, make: 'SEAT', model: 'Leon', variant: 'Leon SC 1.4 TSI FR', year: 2017, km: 86000, fuel: 'petrol', trans: 'manual', color: 'red', cond: 'excellent', price: 6900000, neg: true, city: 'Douala', seats: 5, lang: 'en', photos: [img(7), img(5), img(6), img(1)], featured: true, desc: { en: 'One owner since import in 2020. Full service history in Douala, new tyres, customs cleared and all papers in order (carte grise, insurance until March 2027). Viewing in Akwa any weekday.', fr: "Un seul propriétaire depuis l'importation en 2020. Carnet d'entretien complet à Douala, pneus neufs, dédouanée et papiers en règle (carte grise, assurance jusqu'en mars 2027). Visite à Akwa en semaine." } },
    { key: 's7', seller: sellers.akwa.id, make: 'Toyota', model: 'Corolla Cross', variant: 'Corolla Cross 1.8 Hybrid', year: 2026, km: 0, fuel: 'hybrid', trans: 'auto', color: 'white', cond: 'new', price: 24500000, neg: false, city: 'Douala', seats: 5, lang: 'en', featured: true },
    { key: 's2', seller: sellers.prestige.id, make: 'Porsche', model: 'Taycan', variant: 'Taycan 4S', year: 2021, km: 38000, fuel: 'electric', trans: 'auto', color: 'white', cond: 'excellent', price: 48500000, neg: false, city: 'Yaoundé', seats: 4, lang: 'fr', photos: [img(2), img(4)] },
    { key: 's3', seller: sellers.akwa.id, make: 'Toyota', model: 'Hilux', variant: 'Hilux 2.4 D-4D', year: 2016, km: 121000, fuel: 'diesel', trans: 'manual', color: 'white', cond: 'excellent', price: 14500000, neg: false, city: 'Douala', seats: 5, lang: 'fr' },
    { key: 's4', seller: sellers.mireille.id, make: 'Kia', model: 'Picanto', variant: 'Picanto 1.2', year: 2018, km: 54000, fuel: 'petrol', trans: 'manual', color: 'red', cond: 'excellent', price: 3500000, neg: true, city: 'Yaoundé', seats: 4, lang: 'fr' },
    { key: 's5', seller: sellers.paul.id, make: 'Hyundai', model: 'Elantra', variant: 'Elantra 1.6', year: 2017, km: 76000, fuel: 'petrol', trans: 'auto', color: 'blue', cond: 'good', price: 7200000, neg: true, city: 'Douala', seats: 5, lang: 'en' },
    { key: 's6', seller: sellers.ouest.id, make: 'Nissan', model: 'X-Trail', variant: 'X-Trail 2.0 dCi', year: 2012, km: 168000, fuel: 'diesel', trans: 'manual', color: 'grey', cond: 'fair', price: 5800000, neg: true, city: 'Bafoussam', seats: 7, lang: 'fr' },
    { key: 'n3', seller: nadine.id, make: 'Peugeot', model: '301', variant: '301 1.6 HDi', year: 2016, km: 98000, fuel: 'diesel', trans: 'manual', color: 'silver', cond: 'good', price: 4200000, neg: true, city: 'Douala', seats: 5, lang: 'en' },
  ];
  const sid: Record<string, string> = {};
  for (const [i, s] of SALES.entries()) {
    const c = CITIES[s.city];
    const seller = Object.values(sellers).find((u) => u.id === s.seller) ?? nadine;
    const desc = s.desc ?? {
      en: `${s.make} ${s.variant}, ${s.year}, ${fmt(s.km)} km. Regularly serviced, customs cleared, papers in order. Viewing in ${s.city}.`,
      fr: `${s.make} ${s.variant}, ${s.year}, ${fmt(s.km)} km. Entretien régulier, dédouanée, papiers en règle. Visite à ${s.city}.`,
    };
    const row = await prisma.saleListing.create({
      data: {
        sellerId: s.seller,
        make: s.make,
        model: s.model,
        variant: s.variant,
        year: s.year,
        mileageKm: s.km,
        fuel: s.fuel,
        transmission: s.trans,
        color: s.color,
        condition: s.cond,
        seats: s.seats,
        price: s.price,
        negotiable: s.neg,
        city: s.city,
        viewLat: c.lat + 0.004,
        viewLon: c.lon - 0.006,
        viewAddress: seller.areaLabel ?? `${s.city}`,
        viewingDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        description: desc[s.lang],
        descriptionLang: s.lang,
        photos: s.photos ?? [],
        views: 214 - i * 17,
        package: s.featured ? 'featured' : 'basic',
        expiresAt: d(27),
        createdAt: d(-3 - i),
      },
    });
    sid[s.key] = row.id;
    await prisma.listingTranslation.create({ data: { listingKey: `sale:${row.id}`, lang: s.lang === 'en' ? 'fr' : 'en', text: desc[s.lang === 'en' ? 'fr' : 'en'] } });
  }

  // ---- Bookings ----
  const booking = async (o: { rental: string; renter: string; start: number; days: number; status: 'requested' | 'confirmed' | 'completed'; delivery?: string; note?: string; ref: string; hostPayout?: number }) => {
    const r = await prisma.rentalListing.findUniqueOrThrow({ where: { id: o.rental } });
    const q = quoteRental({ dailyRate: r.dailyRate, deposit: r.deposit, days: o.days, weeklyDiscount: r.weeklyDiscount, deliveryFee: o.delivery ? r.deliveryAirportFee : 0 });
    return prisma.booking.create({
      data: {
        reference: o.ref,
        rentalId: o.rental,
        renterId: o.renter,
        status: o.status,
        startDate: d(o.start),
        endDate: d(o.start + o.days),
        days: q.days,
        delivery: !!o.delivery,
        deliveryTo: o.delivery,
        note: o.note,
        dailyRate: q.dailyRate,
        subtotal: q.subtotal,
        deliveryFee: q.deliveryFee,
        platformFee: q.platformFee,
        deposit: q.deposit,
        total: q.total,
        hostPayout: o.hostPayout ?? q.hostPayout,
      },
    });
  };
  // Nadine as renter: upcoming RAV4 with airport delivery, and a past Corolla trip.
  const trip = await booking({ rental: rid.r1, renter: nadine.id, start: 4, days: 3, status: 'confirmed', delivery: 'dla', ref: 'JX-48213' });
  await prisma.payment.create({ data: { userId: nadine.id, purpose: 'booking', bookingId: trip.id, method: 'mtn_momo', msisdn: '+237677123456', amount: trip.total, status: 'succeeded', providerRef: 'seed' } });
  await booking({ rental: rid.r2, renter: nadine.id, start: -66, days: 3, status: 'completed', ref: 'JX-31007' });

  // Nadine as host: pending requests…
  await booking({ rental: rid.n2, renter: yannick.id, start: 10, days: 4, status: 'requested', note: 'Visiting family in Bonamoussadi for the holidays.', ref: 'JX-50121' });
  await booking({ rental: rid.n1, renter: laure.id, start: 16, days: 2, status: 'requested', note: 'Wedding in Bonabéri, I need a car for the weekend.', ref: 'JX-50122' });
  // …a trip completed earlier this month (this month's earnings)…
  const monthStartOffset = 1 - today.getUTCDate();
  await booking({ rental: rid.n1, renter: yannick.id, start: monthStartOffset, days: 3, status: 'completed', ref: 'JX-49980', hostPayout: 485000 });
  // …and history that adds up to the dashboard figures (3 870 000 earned, 412 000 available).
  await booking({ rental: rid.n2, renter: laure.id, start: -120, days: 60, status: 'completed', ref: 'JX-20011', hostPayout: 3870000 - 485000 });
  await prisma.payout.create({ data: { hostId: nadine.id, amount: 3870000 - 412000, method: 'mtn_momo', msisdn: '+237677123456', status: 'sent', providerRef: 'seed' } });

  // ---- Offers ----
  await prisma.offer.create({ data: { saleListingId: sid.s3, buyerId: nadine.id, amount: 13500000, counterAmount: 14000000, status: 'countered' } });

  // ---- Favourites ----
  await prisma.favourite.createMany({ data: [{ userId: nadine.id, kind: 'rent', listingId: rid.r3 }, { userId: nadine.id, kind: 'sale', listingId: sid.s1 }, { userId: nadine.id, kind: 'sale', listingId: sid.s2 }] });

  // ---- Conversations ----
  const conv = async (kind: 'rent' | 'sale', listingId: string, a: string, b: string, msgs: { from: string; lang: Lang; t: Date; en: string; fr: string; img?: string }[]) => {
    const c = await prisma.conversation.create({ data: { kind, listingId, participants: { create: [{ userId: a, lastReadAt: d(-10) }, { userId: b }] }, updatedAt: msgs.at(-1)!.t } });
    for (const m of msgs) {
      const row = await prisma.message.create({ data: { conversationId: c.id, senderId: m.from, lang: m.lang, text: m[m.lang], imageUrl: m.img, createdAt: m.t } });
      await prisma.messageTranslation.create({ data: { messageId: row.id, lang: m.lang === 'en' ? 'fr' : 'en', text: m[m.lang === 'en' ? 'fr' : 'en'] } });
    }
  };
  await conv('rent', rid.r1, nadine.id, armel.id, [
    { from: armel.id, lang: 'fr', t: at(-1, 17, 58), fr: 'Bonjour Nadine ! Oui, la RAV4 est disponible pour vos dates.', en: 'Hi Nadine! Yes, the RAV4 is available for your dates.' },
    { from: nadine.id, lang: 'en', t: at(-1, 18, 1), en: 'Great. I land at Douala airport at 6 pm. Can you bring the car there?', fr: "Super. J'atterris à l'aéroport de Douala à 18 h. Pouvez-vous y amener la voiture ?" },
    { from: armel.id, lang: 'fr', t: at(-1, 18, 4), fr: "Pas de problème, je vous attendrai aux arrivées. La livraison à l'aéroport coûte 5 000 FCFA.", en: "No problem, I'll wait for you at arrivals. Airport delivery is 5 000 FCFA." },
    { from: armel.id, lang: 'fr', t: at(-1, 18, 5), fr: 'Voici la voiture, lavée ce matin.', en: "Here's the car, washed this morning.", img: img(3) },
  ]);
  await conv('sale', sid.s1, nadine.id, sellers.bonapriso.id, [
    { from: sellers.bonapriso.id, lang: 'en', t: at(-2, 9, 12), en: 'Hello, yes the Leon is still available. You can view it in Akwa any weekday from 9 am.', fr: 'Bonjour, oui la Leon est toujours disponible. Vous pouvez la voir à Akwa en semaine dès 9 h.' },
  ]);

  // ---- Notifications ----
  await prisma.notification.createMany({
    data: [
      { userId: nadine.id, type: 'booking_confirmed', titleEn: 'Booking confirmed', titleFr: 'Réservation confirmée', bodyEn: 'Toyota RAV4 2019 · Armel N.', bodyFr: 'Toyota RAV4 2019 · Armel N.', link: '/activity?tab=trips', createdAt: new Date(Date.now() - 2 * 3600_000) },
      { userId: nadine.id, type: 'offer_reply', titleEn: 'Akwa Motors replied to your offer', titleFr: 'Akwa Motors a répondu à votre offre', bodyEn: 'Toyota Hilux 2.4 D-4D · 14 000 000 FCFA', bodyFr: 'Toyota Hilux 2.4 D-4D · 14 000 000 FCFA', link: '/activity?tab=offers', createdAt: d(-1) },
      { userId: nadine.id, type: 'price_drop', titleEn: 'Price drop on a saved car', titleFr: 'Baisse de prix sur un favori', bodyEn: 'SEAT Leon SC 1.4 TSI FR · 6 900 000 FCFA', bodyFr: 'SEAT Leon SC 1.4 TSI FR · 6 900 000 FCFA', link: `/sale/${sid.s1}`, createdAt: d(-2), readAt: d(-1) },
      { userId: nadine.id, type: 'verification', titleEn: 'Licence verified', titleFr: 'Permis vérifié', bodyEn: 'You can now book instantly.', bodyFr: 'Vous pouvez réserver instantanément.', link: '/profile', createdAt: d(-5), readAt: d(-4) },
    ],
  });

  console.info(`Seeded ${RENTALS.length} rentals, ${SALES.length} sales. Demo login: +237 677123456 / code from OTP_DEV_CODE.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
