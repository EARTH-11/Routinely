// app/student/ExamTab.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  ActivityIndicator, TouchableOpacity
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { formatTime, formatDate } from '../../lib/auth';
import { COLORS, RADIUS, SHADOW, FONTS } from '../../constants/theme';
import { ExamScheduleItem, ExamType, StudentSession } from '../../types';
import { useOfflineData } from '../../hooks/useOfflineData';
import OfflineBanner from '../../components/OfflineBanner';

interface Props { session: StudentSession; }

const EXAM_TYPES: ExamType[] = ['Class Test', 'Mid Exam', 'Final Exam'];

export default function ExamTab({ session }: Props) {
  const [filter, setFilter] = useState<ExamType | 'All'>('All');

  const fetchExams = useCallback(async () => {
    let query = supabase
      .from('exam_schedule')
      .select('*')
      .eq('section_id', session.section_id)
      .order('exam_date')
      .order('start_time');

    if (filter !== 'All') {
      query = query.eq('exam_type', filter);
    }

    return query;
  }, [session.section_id, filter]);

  const {
    data, loading, refreshing, isOffline, lastSynced, refresh,
  } = useOfflineData<ExamScheduleItem[]>(
    `exams_${session.section_id}_${filter}`,
    fetchExams,
    [session.section_id, filter]
  );
  const items = data ?? [];

  function examEndDateTime(item: ExamScheduleItem) {
  const time = item.end_time || item.start_time;
  return new Date(`${item.exam_date}T${time}`);
}

const upcoming = items.filter(i => examEndDateTime(i) >= new Date());
const past = items.filter(i => examEndDateTime(i) < new Date());

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Exam Schedule</Text>
        <Text style={styles.headerSub}>{session.display_name}</Text>
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterInner}>
          {(['All', ...EXAM_TYPES] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterBtn, filter === type && styles.filterBtnActive]}
              onPress={() => setFilter(type)}
            >
              <Text style={[styles.filterText, filter === type && styles.filterTextActive]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <OfflineBanner isOffline={isOffline} lastSynced={lastSynced} />

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        >
          {upcoming.length > 0 && (
            <>
              <Text style={styles.sectionHeader}>Upcoming</Text>
              {upcoming.map(item => <ExamCard key={item.id} item={item} />)}
            </>
          )}
          {past.length > 0 && (
            <>
              <Text style={[styles.sectionHeader, { color: COLORS.textMuted }]}>Past</Text>
              {past.map(item => <ExamCard key={item.id} item={item} past />)}
            </>
          )}
          {items.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={styles.emptyText}>No exams scheduled</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function ExamCard({ item, past }: { item: ExamScheduleItem; past?: boolean }) {
  const colorMap: Record<ExamType, string> = {
    'Class Test': COLORS.accent,
    'Mid Exam': COLORS.warning,
    'Final Exam': COLORS.secondary,
  };
  const color = colorMap[item.exam_type];

  return (
    <View style={[styles.card, past && { opacity: 0.85 }]}>
      <View style={[styles.examTypeBadge, { backgroundColor: color + '22' }]}>
        <Text style={[styles.examTypeText, { color }]}>{item.exam_type}</Text>
      </View>
      <Text style={styles.subject}>{item.subject}</Text>

      <View style={styles.detailRow}>
        <DetailChip icon="📅" text={formatDate(item.exam_date)} />
        <DetailChip
          icon="🕐"
          text={`${formatTime(item.start_time)}${item.end_time ? ` – ${formatTime(item.end_time)}` : ''}`}
        />
        {item.place && <DetailChip icon="📍" text={item.place} />}
      </View>

      {item.notes && (
        <Text style={styles.notes}>{item.notes}</Text>
      )}
    </View>
  );
}

function DetailChip({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipIcon}>{icon}</Text>
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
  },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary },
  headerSub: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  filterRow: { backgroundColor: COLORS.surface, paddingBottom: 2, ...SHADOW.sm },
  filterInner: { paddingHorizontal: 16, gap: 8, paddingVertical: 12, flexDirection: 'row' },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },
  filterTextActive: { color: '#fff' },
  scroll: { padding: 16, paddingBottom: 32 },
  sectionHeader: {
    fontSize: FONTS.sizes.base,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 8,
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 12,
    ...SHADOW.sm,
  },
  examTypeBadge: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  examTypeText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  subject: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 16 },
  detailRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  chipIcon: { fontSize: 14},
  chipText: { fontSize: FONTS.sizes.xs, color: '#1E1E1E', fontWeight: '500' },
  notes: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: FONTS.sizes.base },
});
