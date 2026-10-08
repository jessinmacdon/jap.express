import { router, useLocalSearchParams } from 'expo-router';
import { BadgeCheck, ImagePlus, Languages, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useConversation, useSendMessage } from '@/api/hooks';
import type { Message } from '@/api/types';
import { Avatar, BackButton, Button, Loading, Photo, Screen, Txt } from '@/components/ui';
import { clock, fcfa, perDay } from '@/lib/format';
import { pickAndUpload } from '@/lib/upload';
import { useSession } from '@/state/session';
import { useUi } from '@/state/ui';
import { color, font, radius } from '@/theme/tokens';

const QUICK = {
  rent: [
    { en: 'Can I pay with MoMo?', fr: 'Puis-je payer par MoMo ?' },
    { en: 'What documents do I need?', fr: 'Quels documents dois-je fournir ?' },
    { en: 'Perfect, see you then!', fr: 'Parfait, à bientôt !' },
  ],
  sale: [
    { en: 'Is the price negotiable?', fr: 'Le prix est-il négociable ?' },
    { en: 'Can you send photos of the papers?', fr: 'Pouvez-vous envoyer les papiers en photo ?' },
    { en: 'Can I see it on Saturday?', fr: 'Puis-je la voir samedi ?' },
  ],
};

export default function Chat() {
  const { id, draft: initialDraft } = useLocalSearchParams<{ id: string; draft?: string }>();
  const { t, lang } = useSession();
  const { showToast } = useUi();
  const q = useConversation(id);
  const send = useSendMessage(id);
  const [draft, setDraft] = useState(initialDraft ?? '');
  const scroll = useRef<ScrollView>(null);
  const c = q.data;
  const count = c?.messages.length ?? 0;

  useEffect(() => {
    setTimeout(() => scroll.current?.scrollToEnd({ animated: count > 0 }), 50);
  }, [count]);

  const submit = (text = draft) => {
    const v = text.trim();
    if (!v) return;
    send.mutate({ text: v });
    setDraft('');
  };

  const attach = async () => {
    try {
      const url = await pickAndUpload('chat_image');
      if (url) send.mutate({ imageUrl: url });
    } catch (e) {
      showToast(e instanceof Error && e.message === 'permission_denied' ? t.pickerDenied : t.errGeneric);
    }
  };

  const header = (
    <View style={{ backgroundColor: color.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingTop: 4, paddingBottom: 10, borderBottomWidth: 2, borderColor: color.lineStrong }}>
        <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/inbox'))} />
        {c?.partner ? <Avatar initials={c.partner.initials} size={40} /> : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Txt size={16} w={800} numberOfLines={1}>
              {c?.partner?.name ?? ''}
            </Txt>
            {c?.partner?.verified ? <BadgeCheck size={16} color={color.green} strokeWidth={2.2} /> : null}
          </View>
          {c ? (
            <Txt size={12} c={color.muted} numberOfLines={1}>
              {c.partnerRole === 'host' ? t.host : t[c.partnerRole]} · {t.repliesIn}
            </Txt>
          ) : null}
        </View>
      </View>
      {c?.listing ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderColor: color.line, backgroundColor: color.white }}>
          <Photo uri={c.listing.photo} radius={radius.input} style={{ width: 52, height: 38 }} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt size={14} w={800} numberOfLines={1}>
              {c.listing.title}
            </Txt>
            <Txt size={12} c={color.muted}>
              {c.listing.kind === 'rent' ? perDay(c.listing.price, t) : fcfa(c.listing.price)}
            </Txt>
          </View>
          <Button label={t.view} variant="white" height={34} size={13} onPress={() => router.push(c.listing!.kind === 'rent' ? `/rental/${c.listing!.id}` : `/sale/${c.listing!.id}`)} />
        </View>
      ) : null}
    </View>
  );

  const footer = (
    <View style={{ gap: 10, marginHorizontal: -16, marginTop: -2 }}>
      <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 12, flexWrap: 'nowrap' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }} keyboardShouldPersistTaps="handled">
          {(c ? QUICK[c.listing?.kind ?? 'rent'] : []).map((qr) => (
            <Pressable key={qr.en} onPress={() => submit(qr[lang])} style={{ height: 34, paddingHorizontal: 12, justifyContent: 'center', borderWidth: 1.5, borderColor: color.navy, backgroundColor: color.white, borderRadius: radius.button }}>
              <Txt size={13} w={700} c={color.navy}>
                {qr[lang]}
              </Txt>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 12 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={t.addPhoto} onPress={attach} style={{ width: 46, height: 46, borderWidth: 1.5, borderColor: color.ink, backgroundColor: color.white, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center' }}>
          <ImagePlus size={20} color={color.ink} />
        </Pressable>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={t.writeMsg}
          placeholderTextColor={color.faint}
          onSubmitEditing={() => submit()}
          returnKeyType="send"
          style={{ flex: 1, minWidth: 0, height: 46, borderWidth: 1.5, borderColor: color.ink, backgroundColor: color.white, borderRadius: radius.button, paddingHorizontal: 12, fontFamily: font.regular, fontSize: 15, color: color.ink, outlineStyle: 'none' } as never}
        />
        <Pressable accessibilityRole="button" accessibilityLabel="Send" onPress={() => submit()} style={{ width: 46, height: 46, backgroundColor: color.orange, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center' }}>
          <Send size={20} color={color.white} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <Screen ref={scroll} header={header} footer={footer} contentStyle={{ padding: 16, gap: 14 }}>
      {q.isLoading ? <Loading /> : null}
      {c && !c.messages.length ? (
        <Txt size={13} c={color.muted} center>
          {t.noMsgsYet}
        </Txt>
      ) : null}
      {c?.messages.map((m) => (m.mine ? <Outgoing key={m.id} m={m} /> : <Incoming key={m.id} m={m} />))}
    </Screen>
  );
}

function Incoming({ m }: { m: Message }) {
  const { t } = useSession();
  const [orig, setOrig] = useState(false);
  const translated = !!m.translation;
  return (
    <Pressable onLongPress={() => translated && setOrig((o) => !o)} delayLongPress={450} style={{ alignSelf: 'flex-start', maxWidth: '82%', gap: 4 }}>
      <View style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, paddingHorizontal: 12, paddingVertical: 10, borderRadius: radius.card }}>
        {m.imageUrl ? <Photo uri={m.imageUrl} radius={radius.input} style={{ width: 220, maxWidth: '100%', height: 140, marginBottom: m.text ? 8 : 0 }} /> : null}
        {m.text ? (
          <Txt size={15} lh={1.45}>
            {m.translation ?? m.text}
          </Txt>
        ) : null}
      </View>
      {orig ? (
        <View style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#9AA3B2', paddingHorizontal: 10, paddingVertical: 8, borderRadius: radius.input }}>
          <Txt size={10.5} w={700} c={color.muted} upper ls={0.06} style={{ marginBottom: 3 }}>
            {t.original} · {t[`lang${m.lang}`]}
          </Txt>
          <Txt size={13.5} c={color.body} lh={1.4}>
            {m.text}
          </Txt>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
        <Txt size={11} c={color.muted}>
          {clock(m.createdAt)}
        </Txt>
        {translated ? (
          <Pressable onPress={() => setOrig((o) => !o)} style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            <Languages size={12} color={color.muted} />
            <Txt size={11} c={color.muted}>
              {t[`trFrom${m.lang}`]} · {t.holdOrig}
            </Txt>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

function Outgoing({ m }: { m: Message }) {
  const { t } = useSession();
  return (
    <View style={{ alignSelf: 'flex-end', maxWidth: '82%', gap: 4, alignItems: 'flex-end' }}>
      <View style={{ backgroundColor: color.navy, paddingHorizontal: 12, paddingVertical: 10, borderRadius: radius.card }}>
        {m.imageUrl ? <Photo uri={m.imageUrl} radius={radius.input} dark style={{ width: 200, height: 130, marginBottom: m.text ? 8 : 0 }} /> : null}
        {m.text ? (
          <Txt size={15} lh={1.45} c={color.white}>
            {m.text}
          </Txt>
        ) : null}
      </View>
      <Txt size={11} c={color.muted}>
        {clock(m.createdAt)} · {t.read}
      </Txt>
    </View>
  );
}
