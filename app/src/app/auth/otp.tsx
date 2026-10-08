import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { ApiError, post } from '@/api/client';
import type { Me } from '@/api/types';
import { AuthFrame } from '@/components/AuthFrame';
import { Button, Txt } from '@/components/ui';
import { useSession } from '@/state/session';
import { useUi } from '@/state/ui';
import { color, radius } from '@/theme/tokens';

export default function OtpStep() {
  const { t, lang, signIn } = useSession();
  const { showToast } = useUi();
  const p = useLocalSearchParams<{ flow: 'signup' | 'signin'; phone: string; display: string; resend?: string }>();
  const signin = p.flow === 'signin';
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [left, setLeft] = useState(Number(p.resend ?? 45));
  const input = useRef<TextInput>(null);

  useEffect(() => {
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const verify = async (code = otp) => {
    if (code.length !== 6 || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await post<{ token: string; isNew: boolean; user: Me }>('/auth/otp/verify', { phone: p.phone, code, lang });
      await signIn(r.token, r.user);
      if (r.user.profileComplete) {
        router.replace('/home');
        if (signin) showToast(`${t.welcomeBack}, ${r.user.firstName ?? ''}`.trim());
      } else router.replace('/auth/details');
    } catch (e) {
      const c = e instanceof ApiError ? e.code : '';
      setErr(c === 'wrong_code' ? t.errWrongCode : c === 'code_expired' ? t.errCodeExpired : c === 'network' ? t.errNetwork : t.errGeneric);
      setBusy(false);
    }
  };

  const paste = async () => {
    const s = (await Clipboard.getStringAsync().catch(() => '')).match(/\d{6}/)?.[0];
    if (s) {
      setOtp(s);
      verify(s);
    } else input.current?.focus();
  };

  const resend = async () => {
    const digits = p.phone.replace(/^\+\d{1,3}/, '');
    const cc = p.phone.slice(0, p.phone.length - digits.length);
    const r = await post<{ resendInSec: number }>('/auth/otp/request', { cc, phone: digits, flow: p.flow, lang }).catch(() => null);
    if (r) setLeft(r.resendInSec);
  };

  const mm = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  return (
    <AuthFrame
      step={signin ? undefined : 1}
      footer={
        <>
          <Button label={t.verifyBtn} onPress={() => verify()} disabled={otp.length !== 6} loading={busy} center height={56} size={16} style={{ borderRadius: 14 }} />
          <Button label={t.changeNum} variant="link" onPress={() => router.back()} style={{ alignSelf: 'center' }} />
        </>
      }>
      <View style={{ alignItems: 'center', gap: 8, paddingTop: 14, paddingBottom: 6 }}>
        <Txt size={28} w={800} ls={-0.02} center>
          {t.otpTitle}
        </Txt>
        <Txt size={15} c={color.body} lh={1.45} center>
          {t.otpSub} <Txt w={800}>{p.display}</Txt>
        </Txt>
      </View>
      <Pressable onPress={() => input.current?.focus()} style={{ flexDirection: 'row', gap: 8 }}>
        {Array.from({ length: 6 }, (_, i) => (
          <View key={i} style={{ flex: 1, height: 58, borderRadius: radius.button, backgroundColor: color.white, borderWidth: i === Math.min(otp.length, 5) ? 2 : 1.5, borderColor: i === Math.min(otp.length, 5) ? color.orange : color.ink, alignItems: 'center', justifyContent: 'center' }}>
            <Txt size={24} w={800} style={{ fontVariant: ['tabular-nums'] }}>
              {otp[i] ?? ''}
            </Txt>
          </View>
        ))}
        <TextInput
          ref={input}
          value={otp}
          onChangeText={(v) => {
            const d = v.replace(/\D/g, '').slice(0, 6);
            setOtp(d);
            if (d.length === 6) verify(d);
          }}
          autoFocus
          inputMode="numeric"
          keyboardType="number-pad"
          maxLength={6}
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          style={{ position: 'absolute', inset: 0, opacity: 0 } as never}
        />
      </Pressable>
      {err ? (
        <Txt size={13} w={700} c={color.orangeSoftText} center>
          {err}
        </Txt>
      ) : null}
      <Pressable onPress={paste} style={{ alignSelf: 'center', height: 40, paddingHorizontal: 14, borderWidth: 1.5, borderColor: color.ink, backgroundColor: color.white, borderRadius: radius.button, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <MessageCircle size={16} color={color.ink} />
        <Txt size={14} w={700}>
          {t.useSms}
        </Txt>
      </Pressable>
      {left > 0 ? (
        <Txt size={13.5} c={color.muted} center>
          {t.resendIn.replace(/\d+:\d+/, mm)}
        </Txt>
      ) : (
        <Button label={t.resend} variant="link" onPress={resend} style={{ alignSelf: 'center' }} />
      )}
    </AuthFrame>
  );
}
