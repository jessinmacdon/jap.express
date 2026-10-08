import { useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { Camera, Hand, List, LocateFixed, ShieldCheck } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { post } from '@/api/client';
import { useMakes } from '@/api/hooks';
import type { Condition, Fuel, PayMethod, Transmission } from '@/api/types';
import { MomoBadge } from '@/components/payments';
import { BackButton, Button, Calendar, CheckDot, Chip, Field, KV, Label, MapView, Note, Photo, Rule, Screen, Segmented, SelectField, Sheet, ToggleRow, Txt } from '@/components/ui';
import { fcfa, fmt, perDay } from '@/lib/format';
import { CITY_CENTRES } from '@/lib/places';
import { pickAndUpload } from '@/lib/upload';
import { useSession } from '@/state/session';
import { useUi } from '@/state/ui';
import { color, radius } from '@/theme/tokens';

type Kind = 'rent' | 'sell';
const PHOTO_SLOTS = ['ph_front', 'ph_rear', 'ph_left', 'ph_right', 'ph_intF', 'ph_intR', 'ph_dash', 'ph_odo', 'ph_engine'] as const;
const MIN_PHOTOS = 8;
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const PACKAGES = { basic: 5000, featured: 15000 } as const;
const digits = (s: string) => +(s.replace(/\D/g, '') || 0);
const THIS_YEAR = new Date().getFullYear();

export default function AddListing() {
  const { kind: kindParam } = useLocalSearchParams<{ kind?: Kind }>();
  const kind: Kind = kindParam === 'sell' ? 'sell' : 'rent';
  const rent = kind === 'rent';
  const { t, lang, me } = useSession();
  const { showToast } = useUi();
  const qc = useQueryClient();
  const makes = useMakes().data?.makes ?? {};
  const scroll = useRef<ScrollView>(null);

  const [step, setStep] = useState(0);
  const [checklist, setChecklist] = useState(false);
  const [busy, setBusy] = useState<number | 'submit' | null>(null);
  const [photos, setPhotos] = useState<(string | null)[]>(PHOTO_SLOTS.map(() => null));
  // Vehicle
  const [make, setMake] = useState('Kia');
  const [model, setModel] = useState('Sportage');
  const [variant, setVariant] = useState('');
  const [year, setYear] = useState('2019');
  const [km, setKm] = useState('64 000');
  const [fuel, setFuel] = useState<Fuel>('petrol');
  const [seats, setSeats] = useState('5');
  const [trans, setTrans] = useState<Transmission>('auto');
  const [cond, setCond] = useState<Condition>('good');
  const [colour, setColour] = useState('grey');
  const [desc, setDesc] = useState('');
  // Pricing
  const [rate, setRate] = useState('30 000');
  const [deposit, setDeposit] = useState('100 000');
  const [weekly, setWeekly] = useState(false);
  const [price, setPrice] = useState('9 800 000');
  const [neg, setNeg] = useState(true);
  // Location & availability
  const [city, setCity] = useState('Douala');
  const [spot, setSpot] = useState(CITY_CENTRES.Douala);
  const [mapKey, setMapKey] = useState(0);
  const [address, setAddress] = useState('Rue Joffre, Akwa, Douala');
  const [instr, setInstr] = useState('');
  const [blocked, setBlocked] = useState<string[]>([]);
  const [airport, setAirport] = useState(true);
  const [cityDeliv, setCityDeliv] = useState(false);
  const [viewDays, setViewDays] = useState<string[]>(['sat']);
  // Payout / package
  const [payMethod, setPayMethod] = useState<PayMethod>(me?.payout?.method ?? 'mtn_momo');
  const [msisdn, setMsisdn] = useState((me?.payout?.msisdn ?? me?.phone ?? '').replace(/^\+237/, ''));
  const [pkg, setPkg] = useState<'basic' | 'featured'>('basic');

  const photoCount = photos.filter(Boolean).length;
  const stepTitles = [t.st0, t.st1, t.st2, rent ? t.st3Rent : t.st3Sell, rent ? t.st4Rent : t.st4Sell];
  const stepSubs = [t.st0sub, t.st1sub, rent ? t.st2subRent : t.st2subSell, rent ? t.st3subRent : t.st3subSell, rent ? t.st4subRent : t.st4subSell];
  const stepOk = [photoCount >= MIN_PHOTOS, !!make && !!model && (rent || !!variant.trim()), rent ? digits(rate) > 0 : digits(price) > 0, address.trim().length > 2 && (rent || viewDays.length > 0), msisdn.replace(/\D/g, '').length >= 8];
  const canNext = stepOk[step];
  const need = MIN_PHOTOS - photoCount;
  const needMore = step === 0 && need > 0 ? (lang === 'fr' ? `Encore ${need} photo${need > 1 ? 's' : ''} pour continuer` : `Add ${need} more photo${need > 1 ? 's' : ''} to continue`) : '';

  const goStep = (i: number) => {
    setStep(i);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };

  const addPhoto = async (i: number) => {
    if (busy !== null) return;
    setBusy(i);
    try {
      const url = await pickAndUpload('listing_photo');
      if (url) setPhotos((p) => p.map((x, j) => (j === i ? url : x)));
    } catch (e) {
      showToast(e instanceof Error && e.message === 'permission_denied' ? t.pickerDenied : t.errGeneric);
    } finally {
      setBusy(null);
    }
  };

  const useMyLocation = async () => {
    const perm = await Location.requestForegroundPermissionsAsync().catch(() => null);
    if (!perm?.granted) return showToast(t.locDenied);
    const pos = await Location.getCurrentPositionAsync({}).catch(() => null);
    if (!pos) return showToast(t.errGeneric);
    setSpot({ lat: pos.coords.latitude, lon: pos.coords.longitude });
    setMapKey((k) => k + 1);
    showToast(t.locationUsed);
  };

  const submit = async () => {
    setBusy('submit');
    const vehicle = {
      make,
      model,
      year: +year,
      mileageKm: digits(km),
      fuel,
      transmission: trans,
      condition: cond,
      seats: digits(seats) || 5,
      city,
      photos: photos.filter(Boolean),
      description: desc.trim() || undefined,
      descriptionLang: lang,
      location: { lat: spot.lat, lon: spot.lon, address: address.trim(), note: instr.trim() || undefined },
    };
    const account = { method: payMethod, msisdn: `+237${msisdn.replace(/\D/g, '')}` };
    try {
      if (rent) await post('/listings/rental', { ...vehicle, dailyRate: digits(rate), deposit: digits(deposit), weeklyDiscount: weekly, deliveryAirport: airport, deliveryCity: cityDeliv, blockedDates: blocked, payout: account });
      else await post('/listings/sale', { ...vehicle, variant: variant.trim(), color: colour, price: digits(price), negotiable: neg, viewingDays: viewDays, package: pkg, payment: account });
      qc.invalidateQueries({ queryKey: ['host'] });
      qc.invalidateQueries({ queryKey: ['me'] });
      showToast(t.published);
      router.dismissTo({ pathname: '/activity', params: { tab: 'listings' } });
    } catch {
      showToast(t.errGeneric);
      setBusy(null);
    }
  };

  const next = () => {
    if (!canNext) return;
    if (step < 4) goStep(step + 1);
    else submit();
  };

  const header = (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingTop: 6, paddingBottom: 10 }}>
        <BackButton icon="close" />
        <Txt size={18} w={800} style={{ flex: 1 }} numberOfLines={1}>
          {rent ? t.headRent : t.headSell}
        </Txt>
        <Txt size={13} w={600} c={color.muted} style={{ paddingRight: 6 }}>
          {t.step} {step + 1} {t.of} 5
        </Txt>
      </View>
      <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: 16 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? color.orange : color.line }} />
        ))}
      </View>
      <Pressable onPress={() => setChecklist(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 }}>
        <List size={16} color={color.orangeText} />
        <Txt size={13.5} w={800} c={color.orangeText}>
          {t.viewSteps}
        </Txt>
      </Pressable>
    </View>
  );

  const footer = (
    <View style={{ gap: 8 }}>
      {needMore ? (
        <Txt size={12.5} w={700} c={color.orangeSoftText}>
          {needMore}
        </Txt>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button label={t.back} variant="outline" onPress={() => (step ? goStep(step - 1) : router.back())} />
        <Button
          label={step === 4 ? (rent ? t.publish : `${t.payPublish} · ${fcfa(PACKAGES[pkg])}`) : t.cont}
          arrow
          disabled={!canNext}
          loading={busy === 'submit'}
          onPress={next}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );

  return (
    <Screen ref={scroll} header={header} footer={footer}>
      <View style={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 14, borderBottomWidth: 2, borderColor: color.lineStrong }}>
        <Txt size={26} w={800} ls={-0.02}>
          {stepTitles[step]}
        </Txt>
        <Txt size={14} c={color.body} style={{ marginTop: 6 }}>
          {stepSubs[step]}
        </Txt>
      </View>

      {step === 0 ? (
        <View style={{ padding: 16, gap: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Label>{t.photosLbl}</Label>
            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.badge, backgroundColor: photoCount >= MIN_PHOTOS ? color.greenSoft : color.orangeSoft }}>
              <Txt size={13} w={800} c={photoCount >= MIN_PHOTOS ? color.green : color.orangeSoftText}>
                {photoCount} / {MIN_PHOTOS}
              </Txt>
            </View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {PHOTO_SLOTS.map((k, i) => (
              <Pressable key={k} accessibilityRole="button" accessibilityLabel={t[k]} onPress={() => addPhoto(i)} style={{ width: '32%', aspectRatio: 4 / 3 }}>
                {photos[i] ? (
                  <Photo uri={photos[i]} radius={radius.input} style={{ flex: 1 }}>
                    <View style={{ position: 'absolute', left: 5, bottom: 5, backgroundColor: 'rgba(248,249,250,.92)', paddingHorizontal: 5, paddingVertical: 1, borderRadius: radius.badge }}>
                      <Txt size={10} w={700}>
                        {t[k]}
                      </Txt>
                    </View>
                    {i === 0 ? (
                      <View style={{ position: 'absolute', top: 5, left: 5, backgroundColor: color.orange, paddingHorizontal: 5, paddingVertical: 2 }}>
                        <Txt size={9.5} w={800} c={color.white} upper ls={0.05}>
                          {t.cover}
                        </Txt>
                      </View>
                    ) : null}
                  </Photo>
                ) : (
                  <View style={{ flex: 1, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#8A94A6', backgroundColor: color.white, borderRadius: radius.input, padding: 7, justifyContent: 'space-between' }}>
                    <Camera size={18} color={color.navy} />
                    <Txt size={11} w={700} lh={1.15}>
                      {busy === i ? t.loading : t[k]}
                    </Txt>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={{ padding: 16, gap: 14 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <SelectField
              label={t.make}
              value={make}
              options={Object.keys(makes).map((m) => ({ v: m, l: m }))}
              onChange={(m) => {
                setMake(m);
                setModel(makes[m]?.[0] ?? '');
              }}
            />
            <SelectField label={t.model} value={model} options={(makes[make] ?? []).map((m) => ({ v: m, l: m }))} onChange={setModel} />
          </View>
          {!rent ? <Field label={t.variantLbl} value={variant} onChangeText={setVariant} placeholder={`${model} 1.6 …`} height={46} /> : null}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <SelectField label={t.year} value={year} options={Array.from({ length: THIS_YEAR - 1989 }, (_, i) => String(THIS_YEAR + 1 - i)).map((y) => ({ v: y, l: y }))} onChange={setYear} />
            <View style={{ flex: 1 }}>
              <Field label={t.mileage} value={km} onChangeText={(v) => setKm(fmt(digits(v)))} inputMode="numeric" suffix="km" height={46} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <SelectField label={t.fuel} value={fuel} options={(['petrol', 'diesel', 'hybrid', 'electric'] as const).map((f) => ({ v: f, l: t[f] }))} onChange={setFuel} />
            <SelectField label={t.seats} value={seats} options={['2', '4', '5', '7', '9'].map((s) => ({ v: s, l: s === '9' ? '9+' : s }))} onChange={setSeats} />
          </View>
          {!rent ? <SelectField label={t.colorLbl} value={colour} options={[['silver', 'Silver', 'Argent'], ['black', 'Black', 'Noir'], ['white', 'White', 'Blanc'], ['red', 'Red', 'Rouge'], ['blue', 'Blue', 'Bleu'], ['grey', 'Grey', 'Gris']].map(([v, en, fr]) => ({ v, l: lang === 'fr' ? fr : en }))} onChange={setColour} /> : null}
          <View style={{ gap: 6 }}>
            <Txt size={12} c={color.body}>
              {t.transmission}
            </Txt>
            <Segmented height={44} options={[['auto', t.auto], ['manual', t.manual]]} value={trans} onChange={setTrans} />
          </View>
          <View style={{ gap: 6 }}>
            <Txt size={12} c={color.body}>
              {t.condition}
            </Txt>
            <Segmented height={44} options={[['new', t.new], ['excellent', t.excellent], ['good', t.good], ['fair', t.fair]]} value={cond} onChange={setCond} />
          </View>
          <Field label={t.descLbl} value={desc} onChangeText={setDesc} placeholder={t.descPh} multiline />
        </View>
      ) : null}

      {step === 2 ? (
        <View style={{ padding: 16, gap: 14 }}>
          {rent ? (
            <>
              <Field label={t.dailyRateLbl} value={rate} onChangeText={(v) => setRate(fmt(digits(v)))} inputMode="numeric" big />
              <Note>{t.rateHint}</Note>
              <Field label={t.depositLbl} value={deposit} onChangeText={(v) => setDeposit(fmt(digits(v)))} inputMode="numeric" height={48} />
              <ToggleRow topRule title={t.weeklyDisc} sub={t.weeklySub} on={weekly} onPress={() => setWeekly(!weekly)} />
            </>
          ) : (
            <>
              <Field label={t.askingLbl} value={price} onChangeText={(v) => setPrice(fmt(digits(v)))} inputMode="numeric" big />
              <ToggleRow topRule title={t.negotiable} sub={t.negSub} on={neg} onPress={() => setNeg(!neg)} />
            </>
          )}
        </View>
      ) : null}

      {step === 3 ? (
        <View style={{ padding: 16, gap: 16 }}>
          <View style={{ gap: 12, paddingBottom: 16, borderBottomWidth: 2, borderColor: color.lineStrong }}>
            <Label>{rent ? t.locRent : t.locSell}</Label>
            <SelectField
              label={t.selectCity}
              value={city}
              options={Object.keys(CITY_CENTRES).map((c) => ({ v: c, l: c }))}
              onChange={(c) => {
                setCity(c);
                setSpot(CITY_CENTRES[c]);
                setMapKey((k) => k + 1);
              }}
            />
            <MapView key={mapKey} lat={spot.lat} lon={spot.lon} zoom={16} height={220} interactive onCenterChange={setSpot} />
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <Hand size={16} color={color.muted} />
              <Txt size={12.5} c={color.muted} style={{ flex: 1 }}>
                {t.pinHint}
              </Txt>
            </View>
            <Field label={t.addrLbl} value={address} onChangeText={setAddress} />
            <Pressable onPress={useMyLocation} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 2 }}>
              <LocateFixed size={18} color={color.orangeText} />
              <Txt size={14} w={800} c={color.orangeText}>
                {t.useMyLoc}
              </Txt>
            </Pressable>
            <Field label={t.instrLbl} value={instr} onChangeText={setInstr} placeholder={t.instrPh} multiline />
          </View>
          {rent ? (
            <View style={{ gap: 16 }}>
              <View>
                <Calendar mode="block" blocked={blocked} cellHeight={40} onPick={(d) => setBlocked((b) => (b.includes(d) ? b.filter((x) => x !== d) : [...b, d]))} />
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 8 }}>
                  <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: color.blocked }} />
                  <Txt size={12} c={color.muted}>
                    {t.blocked}
                  </Txt>
                </View>
              </View>
              <View style={{ borderTopWidth: 2, borderColor: color.lineStrong, paddingTop: 14, gap: 14 }}>
                <Label>{t.delivOpts}</Label>
                <ToggleRow title={t.airport} sub={t.airportSub} on={airport} onPress={() => setAirport(!airport)} />
                <ToggleRow topRule title={t.homeDeliv} sub={t.homeSub} on={cityDeliv} onPress={() => setCityDeliv(!cityDeliv)} />
              </View>
            </View>
          ) : (
            <View style={{ gap: 6 }}>
              <Txt size={12} c={color.body}>
                {t.viewingDays}
              </Txt>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {DAYS.map((d, i) => (
                  <Chip key={d} label={t.weekdayShort.split(',')[i]} on={viewDays.includes(d)} onPress={() => setViewDays((v) => (v.includes(d) ? v.filter((x) => x !== d) : [...v, d]))} />
                ))}
              </View>
            </View>
          )}
        </View>
      ) : null}

      {step === 4 ? (
        <View style={{ padding: 16, gap: 14 }}>
          {!rent ? (
            <>
              {(
                [
                  ['basic', t.pkgBasic, t.pkgBasicS],
                  ['featured', t.pkgFeat, t.pkgFeatS],
                ] as const
              ).map(([k, name, sub]) => (
                <Pressable key={k} accessibilityRole="radio" accessibilityState={{ checked: pkg === k }} onPress={() => setPkg(k)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: color.white, borderWidth: 2, borderColor: pkg === k ? color.orange : color.line, borderRadius: radius.button }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Txt size={16} w={800}>
                      {name}
                    </Txt>
                    <Txt size={12.5} c={color.muted} lh={1.35} style={{ marginTop: 2 }}>
                      {sub}
                    </Txt>
                  </View>
                  <Txt w={800} c={color.navy}>
                    {fcfa(PACKAGES[k])}
                  </Txt>
                  <CheckDot on={pkg === k} />
                </Pressable>
              ))}
              <Label style={{ marginTop: 8 }}>{t.payWith2}</Label>
            </>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(
              [
                ['mtn_momo', 'MTN MoMo'],
                ['orange_money', 'Orange Money'],
              ] as const
            ).map(([k, name]) => (
              <Pressable key={k} accessibilityRole="radio" accessibilityState={{ checked: payMethod === k }} onPress={() => setPayMethod(k)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 52, paddingHorizontal: 10, backgroundColor: color.white, borderWidth: 2, borderColor: payMethod === k ? color.orange : color.line, borderRadius: radius.button }}>
                <MomoBadge method={k} />
                <Txt size={13.5} w={800}>
                  {name}
                </Txt>
              </Pressable>
            ))}
          </View>
          <Field label={rent ? t.payoutTo : t.momoNumber} prefix="+237" value={msisdn} onChangeText={setMsisdn} inputMode="tel" keyboardType="phone-pad" height={50} />
          {rent ? (
            <>
              <Note icon={<ShieldCheck size={22} color={color.navy} />}>{t.payoutNote}</Note>
              <Rule style={{ marginTop: 4 }} />
              <Label>{t.summary}</Label>
              <View>
                <KV k={t.carLbl} v={`${make} ${model} ${year}`} />
                <KV k={t.dailyRateLbl} v={perDay(digits(rate), t)} />
                <KV k={t.depositLbl} v={fcfa(digits(deposit))} />
                <KV k={t.delivOpts} v={[airport ? t.airport : null, cityDeliv ? t.homeDeliv : null].filter(Boolean).join(' · ') || '—'} />
                <KV k={t.locRent} v={address} />
              </View>
            </>
          ) : null}
        </View>
      ) : null}

      <Sheet open={checklist} onClose={() => setChecklist(false)} title={t.stepsTitle}>
        {stepTitles.map((title, i) => {
          const done = i < step;
          const cur = i === step;
          const reachable = i <= step || stepOk.slice(0, i).every(Boolean);
          return (
            <Pressable
              key={title}
              disabled={!reachable}
              onPress={() => {
                goStep(i);
                setChecklist(false);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderColor: color.line }}>
              <View style={{ width: 32, height: 32, borderRadius: radius.input, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? color.green : cur ? color.orange : color.white, borderColor: done ? color.green : cur ? color.orange : color.ink }}>
                <Txt size={14} w={800} c={done || cur ? color.white : color.ink}>
                  {i + 1}
                </Txt>
              </View>
              <Txt w={700} style={{ flex: 1 }}>
                {title}
              </Txt>
              <Txt size={12.5} w={800} c={done ? color.green : cur ? color.orangeText : color.muted}>
                {done ? t.done : cur ? t.inProg : t.todo}
              </Txt>
            </Pressable>
          );
        })}
      </Sheet>
    </Screen>
  );
}
