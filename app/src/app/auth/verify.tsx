import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Camera, Check, IdCard, Lock, CreditCard } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { post } from '@/api/client';
import type { Me, VStatus } from '@/api/types';
import { AuthFrame } from '@/components/AuthFrame';
import { Button, Note, Txt } from '@/components/ui';
import { pickAndUpload } from '@/lib/upload';
import { useSession } from '@/state/session';
import { useUi } from '@/state/ui';
import { color, radius } from '@/theme/tokens';

const ITEMS = [
  { k: 'id', title: 'vId', sub: 'vIdS', Icon: IdCard },
  { k: 'licence', title: 'vLic', sub: 'vLicS', Icon: CreditCard },
  { k: 'selfie', title: 'vSelfie', sub: 'vSelfieS', Icon: Camera },
] as const;

// Phone is verified by the OTP; ID, licence and selfie are uploaded here.
export default function VerifyStep() {
  const { t, me } = useSession();
  const editing = useLocalSearchParams<{ edit?: string }>().edit === '1';
  const finish = (later: boolean) => (editing ? router.back() : router.replace({ pathname: '/auth/done', params: { later: later ? '1' : '0' } }));
  const { showToast } = useUi();
  const qc = useQueryClient();
  const v = me?.verification;
  const [busy, setBusy] = useState<string | null>(null);
  const checking = !!v && (['id', 'licence', 'selfie'] as const).some((k) => v[k] === 'checking');
  const allDone = !!v && v.id === 'done' && v.licence === 'done' && v.selfie === 'done';

  // While a document is being reviewed, refresh the profile until it settles.
  useEffect(() => {
    if (!checking) return;
    const id = setInterval(() => qc.invalidateQueries({ queryKey: ['me'] }), 1200);
    return () => clearInterval(id);
  }, [checking, qc]);

  const add = async (k: 'id' | 'licence' | 'selfie') => {
    if (!v || v[k] !== 'todo' || busy) return;
    setBusy(k);
    try {
      const url = await pickAndUpload('verification', { camera: k === 'selfie' });
      if (!url) return;
      const next = await post<Me>(`/me/verifications/${k}`, { fileUrls: [url] });
      qc.setQueryData(['me'], next);
    } catch (e) {
      showToast(e instanceof Error && e.message === 'permission_denied' ? t.pickerDenied : t.errGeneric);
    } finally {
      setBusy(null);
    }
  };

  const status = (st: VStatus) => (st === 'done' ? t.vDone : st === 'checking' ? t.vChecking : t.vAdd);
  const rows: { k: 'phone' | 'id' | 'licence' | 'selfie'; title: string; sub: string; st: VStatus; Icon: typeof Check }[] = [
    { k: 'phone', title: t.vPhone, sub: t.vPhoneS, st: 'done', Icon: Check },
    ...ITEMS.map((i) => ({ k: i.k, title: t[i.title], sub: t[i.sub], st: v?.[i.k] ?? 'todo', Icon: i.Icon })),
  ];

  return (
    <AuthFrame
      step={editing ? undefined : 3}
      onBack={editing ? undefined : () => router.replace('/auth/details')}
      footer={
        <>
          <Button label={t.vFinish} onPress={() => finish(false)} disabled={!allDone} center height={56} size={16} style={{ borderRadius: 14 }} />
          <Button label={t.vLater} variant="link" onPress={() => finish(!allDone)} style={{ alignSelf: 'center' }} />
        </>
      }>
      <View style={{ gap: 6, paddingTop: 8 }}>
        <Txt size={28} w={800} ls={-0.02}>
          {t.vTitle}
        </Txt>
        <Txt size={15} c={color.body} lh={1.45}>
          {t.vSub}
        </Txt>
      </View>
      <View style={{ gap: 10 }}>
        {rows.map((r) => {
          const done = r.st === 'done';
          const Icon = done ? Check : r.Icon;
          return (
            <Pressable key={r.k} accessibilityRole="button" disabled={r.k === 'phone' || r.st !== 'todo'} onPress={() => r.k !== 'phone' && add(r.k)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: color.white, borderWidth: 1.5, borderColor: done ? color.green : color.ink, borderRadius: radius.card }}>
              <View style={{ width: 48, height: 48, borderRadius: radius.button, backgroundColor: done ? color.green : color.surface, alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={22} color={done ? color.white : color.navy} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt size={15.5} w={800}>
                  {r.title}
                </Txt>
                <Txt size={12.5} c={color.muted} lh={1.35} style={{ marginTop: 2 }}>
                  {r.sub}
                </Txt>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.input, backgroundColor: done ? color.greenSoft : r.st === 'checking' || busy === r.k ? color.orangeSoft : color.orange }}>
                <Txt size={13} w={800} c={done ? color.green : r.st === 'checking' || busy === r.k ? color.orangeSoftText : color.white}>
                  {busy === r.k ? t.vChecking : status(r.st)}
                </Txt>
              </View>
            </Pressable>
          );
        })}
      </View>
      <Note icon={<Lock size={20} color={color.navy} />}>{t.vPrivacy}</Note>
    </AuthFrame>
  );
}
