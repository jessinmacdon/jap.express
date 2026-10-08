// Reference data. TODO: move to a geocoding service (Google Places / Mapbox)
// once search needs to cover arbitrary addresses.
export const CITIES = {
  Douala: { lat: 4.0469, lon: 9.6966, region: { en: 'Littoral', fr: 'Littoral' } },
  'Yaoundé': { lat: 3.8667, lon: 11.5167, region: { en: 'Centre', fr: 'Centre' } },
  Kribi: { lat: 2.9406, lon: 9.9087, region: { en: 'South', fr: 'Sud' } },
  'Limbé': { lat: 4.013, lon: 9.205, region: { en: 'South-West', fr: 'Sud-Ouest' } },
  Bafoussam: { lat: 5.4781, lon: 10.4176, region: { en: 'West', fr: 'Ouest' } },
} as const;

export type City = keyof typeof CITIES;

export const LOCATIONS = [
  { id: 'dla', en: 'Douala Airport (DLA)', fr: 'Aéroport de Douala (DLA)', city: 'Douala', sub: 'Douala', airport: true },
  { id: 'nsi', en: 'Yaoundé Nsimalen Airport (NSI)', fr: 'Aéroport de Yaoundé-Nsimalen (NSI)', city: 'Yaoundé', sub: 'Yaoundé', airport: true },
  { id: 'douala', en: 'Douala', fr: 'Douala', city: 'Douala', sub: 'Littoral' },
  { id: 'yaounde', en: 'Yaoundé', fr: 'Yaoundé', city: 'Yaoundé', sub: 'Centre' },
  { id: 'bonapriso', en: 'Bonapriso, Douala', fr: 'Bonapriso, Douala', city: 'Douala', sub: 'Douala' },
  { id: 'akwa', en: 'Akwa, Douala', fr: 'Akwa, Douala', city: 'Douala', sub: 'Douala' },
  { id: 'bonamoussadi', en: 'Bonamoussadi, Douala', fr: 'Bonamoussadi, Douala', city: 'Douala', sub: 'Douala' },
  { id: 'bastos', en: 'Bastos, Yaoundé', fr: 'Bastos, Yaoundé', city: 'Yaoundé', sub: 'Yaoundé' },
  { id: 'kribi', en: 'Kribi', fr: 'Kribi', city: 'Kribi', sub: 'Sud' },
  { id: 'limbe', en: 'Limbé', fr: 'Limbé', city: 'Limbé', sub: 'Sud-Ouest' },
  { id: 'bafoussam', en: 'Bafoussam', fr: 'Bafoussam', city: 'Bafoussam', sub: 'Ouest' },
] as const;

export const DELIVERY_SPOTS = [
  { id: 'dla', en: 'Douala Airport (DLA) · arrivals', fr: 'Aéroport de Douala (DLA) · arrivées', airport: true },
  { id: 'nsi', en: 'Yaoundé Nsimalen Airport (NSI)', fr: 'Aéroport de Yaoundé-Nsimalen (NSI)', airport: true },
  { id: 'bonapriso', en: 'Bonapriso, Douala', fr: 'Bonapriso, Douala', airport: false },
  { id: 'bonamoussadi', en: 'Bonamoussadi, Douala', fr: 'Bonamoussadi, Douala', airport: false },
  { id: 'hotel', en: 'My hotel (tell the host)', fr: 'Mon hôtel (à préciser)', airport: false },
] as const;

export const MAKES: Record<string, string[]> = {
  SEAT: ['Leon', 'Ibiza'],
  Renault: ['Scénic E-Tech'],
  Porsche: ['Taycan'],
  Toyota: ['Corolla', 'Corolla Cross', 'RAV4', 'Hilux', 'Prado', 'Hiace', 'Yaris'],
  'Mercedes-Benz': ['C 200', 'E 300'],
  Hyundai: ['Tucson', 'Elantra'],
  Kia: ['Picanto', 'Sportage', 'Rio'],
  Nissan: ['X-Trail'],
  Suzuki: ['Swift'],
  Peugeot: ['301', '3008'],
};
