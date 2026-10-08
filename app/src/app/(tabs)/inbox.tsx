import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Bell, MessageCircle } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { post } from '@/api/client';
import { useConversations, useNotifications } from '@/api/hooks';
import { Avatar, Button, EmptyState, IconTile, Loading, PageTitle, Screen, Txt } from '@/components/ui';
import { timeLabel } from '@/lib/format';
import { useSearch } from '@/state/search';
import { useSession } from '@/state/session';
import { color } from '@/theme/tokens';

export default function Inbox() {
  const { t } = useSession();
  const [tab, setTab] = useState<'messages' | 'notifs'>('messages');
  return (
    <Screen>
      <PageTitle>{t.inboxTitle}</PageTitle>
      <View style={{ flexDirection: 'row', borderTopWidth: 2, borderBottomWidth: 2, borderColor: color.lineStrong }}>
        {(
          [
            ['messages', t.tabMsgs],
            ['notifs', t.tabNotifs],
          ] as const
        ).map(([k, l], i) => (
          <Pressable key={k} accessibilityRole="tab" accessibilityState={{ selected: tab === k }} onPress={() => setTab(k)} style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 12, borderLeftWidth: i ? 2 : 0, borderColor: color.lineStrong, borderBottomWidth: 4, borderBottomColor: tab === k ? color.orange : 'transparent', marginBottom: -2 }}>
            <Txt w={800} c={tab === k ? color.ink : color.muted}>
              {l}
            </Txt>
          </Pressable>
        ))}
      </View>
      {tab === 'messages' ? <Messages /> : <Notifications />}
    </Screen>
  );
}

function Messages() {
  const { t, lang } = useSession();
  const { setMode } = useSearch();
  const q = useConversations();
  if (q.isLoading) return <Loading />;
  const items = q.data?.items ?? [];
  if (!items.length)
    return (
      <EmptyState icon={<MessageCircle size={28} color={color.navy} />} title={t.msgsEmptyT} sub={t.msgsEmptyS}>
        <Button
          label={t.findCar}
          variant="outline"
          height={46}
          onPress={() => {
            setMode('rent');
            router.push('/results');
          }}
        />
      </EmptyState>
    );
  return (
    <View>
      {items.map((c) => {
        const last = c.last;
        const preview = !last ? '' : last.imageUrl && !last.text ? `📷 ${t.photoMsg}` : (last.translation ?? last.text ?? '');
        return (
          <Pressable key={c.id} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: c.id } })} style={({ pressed }) => ({ flexDirection: 'row', gap: 12, alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: color.line, backgroundColor: pressed ? color.surface : 'transparent' })}>
            <Avatar initials={c.partner?.initials ?? '?'} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt w={800}>{c.partner?.name}</Txt>
              <Txt size={12} c={color.muted}>
                {c.listing?.title}
              </Txt>
              <Txt size={13.5} c={color.body} numberOfLines={1} style={{ marginTop: 2 }}>
                {preview}
              </Txt>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Txt size={12} c={color.muted}>
                {last ? timeLabel(last.createdAt, t, lang) : ''}
              </Txt>
              {c.unread ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color.orange }} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function Notifications() {
  const { t, lang } = useSession();
  const qc = useQueryClient();
  const q = useNotifications();
  const hasUnread = (q.data?.unread ?? 0) > 0;
  // Viewing the list marks everything read (dots stay until the next visit).
  useEffect(() => {
    if (hasUnread) post('/notifications/read').then(() => qc.invalidateQueries({ queryKey: ['notifications'], refetchType: 'none' }));
  }, [hasUnread, qc]);
  if (q.isLoading) return <Loading />;
  const items = q.data?.items ?? [];
  if (!items.length) return <EmptyState icon={<Bell size={28} color={color.navy} />} title={t.notifsEmptyT} sub={t.notifsEmptyS} />;
  return (
    <View>
      {items.map((n) => (
        <Pressable key={n.id} onPress={() => n.link && router.push(n.link as never)} style={({ pressed }) => ({ flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: color.line, backgroundColor: pressed ? color.surface : 'transparent' })}>
          <IconTile size={40}>
            <Bell size={20} color={color.navy} />
          </IconTile>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt size={14.5} w={800} lh={1.3}>
              {n.title}
            </Txt>
            <Txt size={13} c={color.body} style={{ marginTop: 2 }}>
              {n.body}
            </Txt>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <Txt size={12} c={color.muted}>
              {timeLabel(n.createdAt, t, lang)}
            </Txt>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: n.unread ? color.orange : 'transparent' }} />
          </View>
        </Pressable>
      ))}
    </View>
  );
}
