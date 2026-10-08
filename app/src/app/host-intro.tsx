import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Lock, ShieldCheck, Users } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEstimate } from '@/api/hooks';
import { BackButton, Button, IconTile, Screen, Segmented, Txt } from '@/components/ui';
import { fcfa } from '@/lib/format';
import { useSession } from '@/state/session';
import { color, radius } from '@/theme/tokens';

export default function HostIntro() {
  const { t } = useSession();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<'compact' | 'suv' | 'van'>('suv');
  const [days, setDays] = useState(15);
  const est = useEstimate(type, days);

  return (
    <Screen noTopInset footer={<Button label={t.getStarted} arrow height={56} size={16} onPress={() => router.push({ pathname: '/add-listing', params: { kind: 'rent' } })} />}>
      <StatusBar style="light" />
      <View style={{ backgroundColor: color.navy, paddingTop: insets.top + 4, paddingHorizontal: 16, paddingBottom: 22, gap: 12 }}>
        <View style={{ marginLeft: -8 }}>
          <BackButton light />
        </View>
        <Txt size={11} w={700} ls={0.12} upper c={color.peach}>
          {t.hostKicker}
        </Txt>
        <Txt size={38} w={800} lh={1} ls={-0.03} c={color.white}>
          {t.introT}
        </Txt>
        <Txt size={15} lh={1.45} c="rgba(255,255,255,.88)">
          {t.introS}
        </Txt>
        <View style={{ borderTopWidth: 1, borderColor: 'rgba(255,255,255,.3)', marginTop: 4, paddingTop: 14, gap: 10 }}>
          <Txt size={12} w={700} ls={0.08} upper c="rgba(255,255,255,.85)">
            {t.estLbl}
          </Txt>
          <Segmented inverse height={40} options={[['compact', t.estCompact], ['suv', t.estSuv], ['van', t.estVan]]} value={type} onChange={setType} />
          <Txt size={12.5} c="rgba(255,255,255,.85)">
            {t.estDaysLbl}
          </Txt>
          <Segmented inverse height={40} options={[[5, '5'], [10, '10'], [15, '15'], [20, '20']]} value={days} onChange={setDays} />
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            <Txt size={32} w={800} ls={-0.02} c={color.white}>
              {est.data ? fcfa(est.data.monthly) : '—'}
            </Txt>
            <Txt size={14} c="rgba(255,255,255,.85)">
              {t.estPer}
            </Txt>
          </View>
          <Txt size={12} c="rgba(255,255,255,.78)">
            {t.estNote}
          </Txt>
        </View>
      </View>

      <Txt size={20} w={800} ls={-0.01} style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 6 }}>
        {t.protT}
      </Txt>
      <Point icon={<Lock size={20} color={color.green} />} title={t.prot1T} sub={t.prot1S} />
      <Point icon={<ShieldCheck size={20} color={color.green} />} title={t.prot2T} sub={t.prot2S} />
      <Point icon={<Users size={20} color={color.green} />} title={t.prot3T} sub={t.prot3S} />

      <View style={{ borderTopWidth: 2, borderColor: color.lineStrong, marginTop: 16, padding: 16, paddingTop: 18, paddingBottom: 24 }}>
        <Txt size={20} w={800} style={{ marginBottom: 6 }}>
          {t.howT}
        </Txt>
        {[t.how1, t.how2, t.how3].map((h, i) => (
          <View key={h} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: color.line }}>
            <View style={{ width: 32, height: 32, borderRadius: radius.input, backgroundColor: color.ink, alignItems: 'center', justifyContent: 'center' }}>
              <Txt size={14} w={800} c={color.white}>
                {i + 1}
              </Txt>
            </View>
            <Txt w={700} style={{ flex: 1 }}>
              {h}
            </Txt>
          </View>
        ))}
      </View>
    </Screen>
  );
}

function Point({ icon, title, sub }: { icon: ReactNode; title: string; sub: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: color.line }}>
      <IconTile size={40} bg={color.greenSoft}>
        {icon}
      </IconTile>
      <View style={{ flex: 1 }}>
        <Txt w={800}>{title}</Txt>
        <Txt size={13} c={color.body} lh={1.4} style={{ marginTop: 2 }}>
          {sub}
        </Txt>
      </View>
    </View>
  );
}
