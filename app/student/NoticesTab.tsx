// app/student/NoticesTab.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { COLORS, RADIUS, SHADOW, FONTS } from '../../constants/theme';
import { Notice, NoticeType, StudentSession } from '../../types';
import { useOfflineData } from '../../hooks/useOfflineData';
import OfflineBanner from '../../components/OfflineBanner';

interface Props { session: StudentSession; }

const NOTICE_CONFIG: Record<NoticeType, { emoji: string; color: string; label: string }> = {
  emergency: { emoji: '🚨', color: COLORS.secondary, label: 'Emergency' },
  exam: { emoji: '📝', color: COLORS.warning, label: 'Assignment' },
  event: { emoji: '🎉', color: COLORS.accent, label: 'Event' },
  general: { emoji: '📢', color: COLORS.primary, label: 'Notice' },
};

export default function NoticesTab({ session }: Props) {
  const fetchNotices = useCallback(async () => {
    // Get notices for this section OR broadcast notices (null section_id)
    return supabase
      .from('notices')
      .select('*')
      .eq('is_active', true)
      .or(`section_id.eq.${session.section_id},section_id.is.null`)
      .order('created_at', { ascending: false });
  }, [session.section_id]);

  const {
    data, loading, refreshing, isOffline, lastSynced, refresh,
  } = useOfflineData<Notice[]>(
    `notices_${session.section_id}`,
    fetchNotices,
    [session.section_id]
  );
  const notices = data ?? [];

  // Realtime subscription — only fires while online; offline fallback is handled by the cache above.
  useEffect(() => {
    const channel = supabase
      .channel('notices-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notices' },
        () => refresh()
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const emergency = notices.filter(n => n.notice_type === 'emergency');
  const others = notices.filter(n => n.notice_type !== 'emergency');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notices</Text>
        <Text style={styles.headerSub}>{session.display_name}</Text>
      </View>

      <OfflineBanner isOffline={isOffline} lastSynced={lastSynced} />

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        >
          {emergency.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: COLORS.secondary }]}>🚨 Emergency</Text>
              {emergency.map(n => <NoticeCard key={n.id} notice={n} />)}
            </>
          )}
          {others.length > 0 && (
            <>
              {emergency.length > 0 && <Text style={styles.sectionLabel}>Other Notices</Text>}
              {others.map(n => <NoticeCard key={n.id} notice={n} />)}
            </>
          )}
          {notices.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>No notices yet</Text>
              <Text style={styles.emptySubText}>Notices from your section rep will appear here</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function NoticeCard({ notice }: { notice: Notice }) {
  const config = NOTICE_CONFIG[notice.notice_type] ?? NOTICE_CONFIG.general;
  const isEmergency = notice.notice_type === 'emergency';
  const timeAgo = getTimeAgo(notice.created_at);

  return (
    <View style={[
      styles.card,
      isEmergency && { borderLeftWidth:0, borderLeftColor: COLORS.secondary }
    ]}>
      <View style={styles.cardHeader}>
        <View style={[styles.badge, { backgroundColor: config.color + '20' }]}>
          <Text style={styles.badgeEmoji}>{config.emoji}</Text>
          <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
        </View>
        <Text style={styles.timeAgo}>{timeAgo}</Text>
      </View>
      <Text style={styles.noticeTitle}>{notice.title}</Text>
      <Text style={styles.noticeBody}>{notice.body}</Text>
      {notice.posted_by && (
        <Text style={styles.postedBy}>— {notice.posted_by}</Text>
      )}
    </View>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    ...SHADOW.sm,
  },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary },
  headerSub: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  scroll: { padding: 16, paddingBottom: 32 },
  sectionLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 8,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 12,
    ...SHADOW.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    gap: 4,
  },
  badgeEmoji: { fontSize: 12 },
  badgeText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  timeAgo: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  noticeTitle: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  noticeBody: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, lineHeight: 20 },
  postedBy: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 10, fontStyle: 'italic' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 6 },
  emptySubText: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, textAlign: 'center' },
});
