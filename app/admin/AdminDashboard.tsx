// app/admin/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { COLORS, RADIUS, SHADOW, FONTS } from '../../constants/theme';

interface Stats {
  batches: number;
  sections: number;
  reps: number;
  notices: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ batches: 0, sections: 0, reps: 0, notices: 0 });
  const [loading, setLoading] = useState(true);
  const [recentNotices, setRecentNotices] = useState<any[]>([]);

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    const [b, s, r, n, rn] = await Promise.all([
      supabase.from('batches').select('id', { count: 'exact', head: true }),
      supabase.from('sections').select('id', { count: 'exact', head: true }),
      supabase.from('section_reps').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('notices').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('notices').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(5),
    ]);
    setStats({
      batches: b.count ?? 0,
      sections: s.count ?? 0,
      reps: r.count ?? 0,
      notices: n.count ?? 0,
    });
    setRecentNotices(rn.data ?? []);
    setLoading(false);
  }

  const STAT_CARDS = [
    { label: 'Batches', value: stats.batches, emoji: '📚', color: COLORS.primary },
    { label: 'Sections', value: stats.sections, emoji: '🏷️', color: COLORS.accent },
    { label: 'Active Reps', value: stats.reps, emoji: '👥', color: COLORS.purple },
    { label: 'Notices', value: stats.notices, emoji: '📢', color: COLORS.warning },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Admin Panel</Text>
        <Text style={styles.subtitle}>Overview of All Batches</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Stats grid */}
          <View style={styles.statsGrid}>
            {STAT_CARDS.map(card => (
              <View key={card.label} style={[styles.statCard, { borderTopColor: card.color, borderTopWidth: 0}]}>
                <Text style={styles.statEmoji}>{card.emoji}</Text>
                <Text style={[styles.statValue, { color: card.color }]}>{card.value}</Text>
                <Text style={styles.statLabel}>{card.label}</Text>
              </View>
            ))}
          </View>

          {/* Recent notices */}
          <Text style={styles.sectionTitle}>Active Notices</Text>
          {recentNotices.length === 0 ? (
            <Text style={styles.empty}>No notices posted yet</Text>
          ) : (
            recentNotices.map(n => (
              <View key={n.id} style={styles.noticeRow}>
                <Text style={styles.noticeType}>{n.notice_type.toUpperCase()}</Text>
                <Text style={styles.noticeTitle} numberOfLines={1}>{n.title}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: COLORS.surface,
    ...SHADOW.sm,
  },
  greeting: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginTop: 4 },
  scroll: { padding: 20, paddingBottom: 40 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  statCard: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    alignItems: 'center',
    ...SHADOW.sm,
    
  },
  statEmoji: { fontSize: 28, marginBottom: 8 },
  statValue: { fontSize: FONTS.sizes.xxl, fontWeight: '800' },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '600', marginTop: 2 },
  sectionTitle: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  empty: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  noticeRow: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...SHADOW.sm,
  },
  noticeType: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '800',
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  noticeTitle: { fontSize: FONTS.sizes.sm, color: COLORS.textPrimary, fontWeight: '500', flex: 1 },
});
