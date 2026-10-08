// Mirrors server/src/lib/places.ts DELIVERY_SPOTS.
export const DELIVERY_SPOTS = [
  { id: 'dla', en: 'Douala Airport (DLA) · arrivals', fr: 'Aéroport de Douala (DLA) · arrivées' },
  { id: 'nsi', en: 'Yaoundé Nsimalen Airport (NSI)', fr: 'Aéroport de Yaoundé-Nsimalen (NSI)' },
  { id: 'bonapriso', en: 'Bonapriso, Douala', fr: 'Bonapriso, Douala' },
  { id: 'bonamoussadi', en: 'Bonamoussadi, Douala', fr: 'Bonamoussadi, Douala' },
  { id: 'hotel', en: 'My hotel (tell the host)', fr: 'Mon hôtel (à préciser)' },
] as const;

export const CITY_CENTRES: Record<string, { lat: number; lon: number }> = {
  Douala: { lat: 4.0469, lon: 9.6966 },
  'Yaoundé': { lat: 3.8667, lon: 11.5167 },
  Kribi: { lat: 2.9406, lon: 9.9087 },
  'Limbé': { lat: 4.013, lon: 9.205 },
  Bafoussam: { lat: 5.4781, lon: 10.4176 },
};
