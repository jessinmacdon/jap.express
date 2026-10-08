import { router } from 'expo-router';
import { ArrowRight, Check, ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { MomoBadge } from '@/components/payments';
import { Avatar, Button, Label, Loading, PageTitle, Rule, Screen, Segmented, ToggleRow, Txt } from '@/components/ui';
import { useSession } from '@/state/session';
import { color, radius } from '@/theme/tokens';

export default function Profile() {
  const { t, me, lang, setLang, updateMe, signOut } = useSession();
  if (!me) return <Screen><Loading /></Screen>;
  const v = me.verification;
  const badges: [string, boolean][] = [
    [t.phone, v.phone === 'done'],
    [t.idDoc, v.id === 'done'],
    [t.licence, v.licence === 'done'],
  ];
  const allVerified = badges.every(([, on]) => on);

  return (
    <Screen>
      <PageTitle>{t.profile}</PageTitle>
      <Rule />
      <View style={{ padding: 16, paddingVertical: 18, gap: 14 }}>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <Avatar initials={me.initials} size={76} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt size={22} w={800} ls={-0.01}>
              {[me.firstName, me.lastName].filter(Boolean).join(' ')}
            </Txt>
            {me.homeLabel ? (
              <Txt size={13.5} c={color.body}>
                {me.homeLabel}
              </Txt>
            ) : null}
            <Txt size={13} c={color.muted}>
              {t.memberSince} {me.memberSince}
            </Txt>
          </View>
        </View>
        {/* TODO: edit-profile screen (name, photo, email, home label). */}
        <Button label={t.editProfile} variant="outline" trailing={<ChevronRight size={18} color={color.ink} />} height={46} onPress={() => router.push({ pathname: '/auth/details', params: { edit: '1' } })} />
      </View>

      <Rule />
      <View style={{ padding: 16, paddingVertical: 18 }}>
        <Label style={{ marginBottom: 10 }}>{t.verification}</Label>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {badges.map(([l, on]) => (
            <View key={l} style={{ flex: 1, padding: 12, paddingHorizontal: 10, gap: 8, borderRadius: radius.input, backgroundColor: on ? color.greenSoft : color.surface }}>
              <View style={{ width: 26, height: 26, borderRadius: radius.badge, backgroundColor: on ? color.green : color.track, alignItems: 'center', justifyContent: 'center' }}>
                <Check size={16} color={color.white} strokeWidth={3} />
              </View>
              <Txt size={14} w={800} lh={1.15} c={on ? color.greenText : color.muted}>
                {l}
              </Txt>
            </View>
          ))}
        </View>
        {!allVerified ? <Button label={t.vTitle} variant="link" onPress={() => router.push({ pathname: '/auth/verify', params: { edit: '1' } })} style={{ marginTop: 10 }} /> : null}
      </View>

      <Rule />
      <View style={{ padding: 16 }}>
        <Pressable accessibilityRole="button" onPress={() => router.push('/list')} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: pressed ? color.navyHover : color.navy, borderRadius: radius.button })}>
          <View style={{ flex: 1 }}>
            <Txt size={11} w={700} ls={0.1} upper c={color.peach}>
              {t.earnKicker}
            </Txt>
            <Txt size={18} w={800} c={color.white} style={{ marginTop: 4 }}>
              {t.earnTitle}
            </Txt>
            <Txt size={13} c="rgba(255,255,255,.85)" lh={1.4} style={{ marginTop: 4 }}>
              {t.earnSub}
            </Txt>
          </View>
          <ArrowRight size={20} color={color.white} />
        </Pressable>
      </View>

      <Rule />
      <View style={{ padding: 16, paddingVertical: 18, gap: 14 }}>
        <Label>{t.langTrans}</Label>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Txt w={800}>{t.appLang}</Txt>
          <View style={{ width: 110 }}>
            <Segmented options={[['en', 'EN'], ['fr', 'FR']]} value={lang} onChange={setLang} height={36} />
          </View>
        </View>
        <ToggleRow topRule title={t.autoTr} sub={t.autoTrSub} on={me.autoTranslate} onPress={() => updateMe({ autoTranslate: !me.autoTranslate })} />
      </View>

      <Rule />
      <Row label={t.payMethods} right={me.payout ? <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}><MomoBadge method={me.payout.method} /><Txt size={13} c={color.muted}>•• {me.payout.msisdn.slice(-2)}</Txt></View> : undefined} />
      <Row label={t.notifications} onPress={() => router.push('/inbox')} />
      {/* TODO: help centre, safety tips, settings (notifications, privacy, delete account). */}
      <Row label={t.help} />
      <Row label={t.settings} />
      <Pressable accessibilityRole="button" onPress={signOut} style={{ paddingHorizontal: 16, paddingTop: 15, paddingBottom: 28 }}>
        <Txt w={800} c={color.orangeText}>
          {t.logout}
        </Txt>
      </Pressable>
    </Screen>
  );
}

function Row({ label, right, onPress }: { label: string; right?: React.ReactNode; onPress?: () => void }) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 1, borderColor: color.line }}>
      <Txt w={600}>{label}</Txt>
      {right ?? <ChevronRight size={18} color={color.muted} />}
    </Pressable>
  );
}
