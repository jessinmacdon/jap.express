import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { AuthFrame } from '@/components/AuthFrame';
import { Button, Chip, Field, Label, Txt } from '@/components/ui';
import { useSession } from '@/state/session';
import { color } from '@/theme/tokens';

const GOALS = [
  ['rent', 'goalRent'],
  ['buy', 'goalBuy'],
  ['host', 'goalHost'],
  ['sell', 'goalSell'],
] as const;

export default function DetailsStep() {
  const { t, me, updateMe } = useSession();
  const editing = useLocalSearchParams<{ edit?: string }>().edit === '1';
  const [first, setFirst] = useState(me?.firstName ?? '');
  const [last, setLast] = useState(me?.lastName ?? '');
  const [email, setEmail] = useState(me?.email ?? '');
  const [goals, setGoals] = useState<string[]>(me?.goals.length ? me.goals : ['rent']);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const ok = first.trim().length > 0;

  const save = async () => {
    if (!ok) return;
    setBusy(true);
    setErr(false);
    try {
      await updateMe({ firstName: first.trim(), lastName: last.trim(), email: email.trim(), goals });
      if (editing) router.back();
      else router.replace('/auth/verify');
    } catch {
      setErr(true);
      setBusy(false);
    }
  };

  return (
    <AuthFrame step={editing ? undefined : 2} onBack={editing ? undefined : () => router.replace('/welcome')} footer={<Button label={t.cont} onPress={save} disabled={!ok} loading={busy} center height={56} size={16} style={{ borderRadius: 14 }} />}>
      <View style={{ gap: 6, paddingTop: 8 }}>
        <Txt size={28} w={800} ls={-0.02}>
          {t.detTitle}
        </Txt>
        <Txt size={15} c={color.body} lh={1.45}>
          {t.detSub}
        </Txt>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label={t.firstName} value={first} onChangeText={setFirst} autoComplete="given-name" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label={t.lastName} value={last} onChangeText={setLast} autoComplete="family-name" />
        </View>
      </View>
      <Field label={t.emailOpt} value={email} onChangeText={setEmail} inputMode="email" autoCapitalize="none" autoComplete="email" placeholder="nadine@email.com" />
      <View style={{ gap: 8 }}>
        <Label>{t.hereTo}</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {GOALS.map(([k, key]) => (
            <Chip key={k} label={t[key]} on={goals.includes(k)} onPress={() => setGoals((g) => (g.includes(k) ? g.filter((x) => x !== k) : [...g, k]))} />
          ))}
        </View>
      </View>
      {err ? (
        <Txt size={13} w={700} c={color.orangeSoftText}>
          {t.errGeneric}
        </Txt>
      ) : null}
    </AuthFrame>
  );
}
