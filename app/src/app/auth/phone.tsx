import { router, useLocalSearchParams } from 'expo-router';
import { MessageCircle, Smartphone } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { ApiError, post } from '@/api/client';
import { Button, Field, FieldLabel, IconTile, SelectField, Txt } from '@/components/ui';
import { useSession } from '@/state/session';
import { color } from '@/theme/tokens';
import { AuthFrame } from '@/components/AuthFrame';

const CODES = [
  { v: '+237', l: 'CM +237' },
  { v: '+33', l: 'FR +33' },
  { v: '+32', l: 'BE +32' },
  { v: '+49', l: 'DE +49' },
  { v: '+44', l: 'UK +44' },
  { v: '+1', l: 'US/CA +1' },
];

export default function PhoneStep() {
  const { t, lang } = useSession();
  const { flow = 'signup' } = useLocalSearchParams<{ flow?: 'signup' | 'signin' }>();
  const signin = flow === 'signin';
  const [cc, setCc] = useState('+237');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const ok = phone.replace(/\D/g, '').length >= 8;

  const send = async () => {
    if (!ok || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await post<{ phone: string; resendInSec: number }>('/auth/otp/request', { cc, phone, flow, lang });
      router.push({ pathname: '/auth/otp', params: { flow, phone: r.phone, display: `${cc} ${phone}`, resend: String(r.resendInSec) } });
    } catch (e) {
      const code = e instanceof ApiError ? e.code : '';
      setErr(code === 'no_account' ? t.errNoAccount : code === 'invalid_phone' || code === 'validation_error' ? t.errPhone : code === 'network' ? t.errNetwork : t.errGeneric);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthFrame
      step={signin ? undefined : 0}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))}
      footer={
        <>
          <Button label={t.sendCode} onPress={send} disabled={!ok} loading={busy} center height={56} size={16} style={{ borderRadius: 14 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Txt size={14.5} c={color.body}>
              {signin ? t.noAcc : t.haveAcc}{' '}
            </Txt>
            <Pressable onPress={() => router.setParams({ flow: signin ? 'signup' : 'signin' })} style={{ padding: 4 }}>
              <Txt size={14.5} w={800} c={color.orangeText}>
                {signin ? t.signUpLink : t.signInLink}
              </Txt>
            </Pressable>
          </View>
        </>
      }>
      <View style={{ alignItems: 'center', gap: 8, paddingTop: 14, paddingBottom: 6 }}>
        <IconTile size={64}>
          <Smartphone size={30} color={color.navy} />
        </IconTile>
        <Txt size={28} w={800} ls={-0.02} center style={{ marginTop: 8 }}>
          {signin ? t.siTitle : t.suTitle}
        </Txt>
        <Txt size={15} c={color.body} lh={1.45} center style={{ maxWidth: 300 }}>
          {signin ? t.siSub : t.suSub}
        </Txt>
      </View>
      <View style={{ gap: 6 }}>
        <FieldLabel>{t.phoneLbl}</FieldLabel>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
          <View style={{ width: 120 }}>
            <SelectField value={cc} options={CODES} onChange={setCc} height={52} />
          </View>
          <View style={{ flex: 1 }}>
            <Field value={phone} onChangeText={setPhone} inputMode="tel" keyboardType="phone-pad" placeholder="6 77 12 34 56" autoComplete="tel" onSubmitEditing={send} />
          </View>
        </View>
        {err ? (
          <Txt size={13} w={700} c={color.orangeSoftText}>
            {err}
          </Txt>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <MessageCircle size={16} color={color.muted} />
        <Txt size={13} c={color.muted} lh={1.45} style={{ flex: 1 }}>
          {t.smsNote}
        </Txt>
      </View>
    </AuthFrame>
  );
}
