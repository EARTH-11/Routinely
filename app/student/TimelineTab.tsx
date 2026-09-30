// app/student/TimelineTab.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  ActivityIndicator, TouchableOpacity
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { formatTime } from '../../lib/auth';
import { COLORS, RADIUS, SHADOW, FONTS, DAY_NAMES, ICON_MAP } from '../../constants/theme';
import { TimelineItem, StudentSession } from '../../types';
import { useOfflineData } from '../../hooks/useOfflineData';
import OfflineBanner from '../../components/OfflineBanner';

interface Props { session: StudentSession; }

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function TimelineTab({ session }: Props) {
  const [selectedDay, setSelectedDay] = useState(getCurrentDayIndex());

  function getCurrentDayIndex() {
    const d = new Date().getDay(); // 0=Sun
    return d === 0 ? 6 : d - 1; // Convert to Mon=0
  }

  const fetchItems = useCallback(async () => {
    return supabase
      .from('timeline_items')
      .select('*')
      .eq('section_id', session.section_id)
      .or(`day_of_week.eq.${selectedDay},day_of_week.is.null`)
      .order('start_time');
  }, [session.section_id, selectedDay]);

  const {
    data, loading, refreshing, isOffline, lastSynced, refresh,
  } = useOfflineData<TimelineItem[]>(
    `timeline_${session.section_id}_${selectedDay}`,
    fetchItems,
    [session.section_id, selectedDay]
  );
  const items = data ?? [];

  const isToday = selectedDay === getCurrentDayIndex();
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  function endMinutes(item: TimelineItem) {
    const [h, m] = item.end_time.split(':').map(Number);
    return h * 60 + m;
  }

  // Only reorder for "today" — for other days "past vs upcoming" isn't meaningful.
  const orderedItems = isToday
    ? [
        ...items.filter(i => endMinutes(i) > nowMinutes),
        ...items.filter(i => endMinutes(i) <= nowMinutes),
      ]
    : items;

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.dateText}>{dateStr}</Text>
          <Text style={styles.sectionText}>{session.display_name}</Text>
        </View>
      </View>

      {/* Day Selector */}
      <View style={styles.daySelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daySelectorInner}>
          {DAYS.map((day, i) => (
            <TouchableOpacity
              key={day}
              style={[styles.dayBtn, selectedDay === i && styles.dayBtnActive]}
              onPress={() => setSelectedDay(i)}
            >
              <Text style={[styles.dayBtnText, selectedDay === i && styles.dayBtnTextActive]}>
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <OfflineBanner isOffline={isOffline} lastSynced={lastSynced} />

      {/* Timeline */}
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        >
          {orderedItems.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>No classes scheduled for {DAYS[selectedDay]}</Text>
            </View>
          ) : (
            orderedItems.map((item, index) => {
              const isPast = isToday && endMinutes(item) <= nowMinutes;
              return (
                <TimelineCard key={item.id} item={item} index={index} isPast={isPast} />
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

function TimelineCard({ item, index, isPast }: { item: TimelineItem; index: number; isPast?: boolean }) {
  const color = item.color || COLORS.pills[index % COLORS.pills.length];
  const icon = ICON_MAP[item.icon ?? 'default'] ?? ICON_MAP.default;
  const duration = getDuration(item.start_time, item.end_time);

  return (
    <View style={styles.cardRow}>
      {/* Time column */}
      <View style={styles.timeCol}>
        <Text style={styles.timeText}>{formatTime(item.start_time)}</Text>
        <View style={[styles.timeLine, { backgroundColor: color }]} />
      </View>

      {/* Card */}
      <View style={[styles.card, isPast && styles.cardPast]}>
        
        <View style={styles.cardTop}>
          <View style={[styles.iconCircle, { backgroundColor: color }]}>
            <Text style={styles.iconEmoji}>{icon}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDuration}>
              {formatTime(item.start_time)} – {formatTime(item.end_time)} · {duration}
            </Text>
            {item.room && <Text style={styles.roomText}>Room: {item.room}</Text>}
          </View>
          
        </View>
        {(item.teacher_name || item.teacher_detail || item.teacher_role) && (
             <View style={styles.teacherRow}>
          <Text style={styles.teacherIcon}>👤</Text>
           <View>
            {item.teacher_name && (
               <Text style={styles.teacherName}>{item.teacher_name}</Text>
              )}
                {(item.teacher_role || item.teacher_detail) && (
             <Text style={styles.teacherDetail}>
             {[item.teacher_role, item.teacher_detail].filter(Boolean).join(', ')}
            </Text>
      )}
    </View>
  </View>
)}
      </View>
    </View>
  );
}

function getDuration(start: string, end: string): string {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 60) return `${diff} min`;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
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
  dateText: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  sectionText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  daySelector: {
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    ...SHADOW.sm,
  },
  daySelectorInner: {
    paddingHorizontal: 12,
    gap: 6,
    flexDirection: 'row',
  },
  dayBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayBtnText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  dayBtnTextActive: { color: '#fff' },
  scroll: { padding: 16, paddingBottom: 32 },
  cardRow: { flexDirection: 'row', marginBottom: 14, alignItems: 'flex-start' },
  cardPast: { opacity:0.89,backgroundColor:COLORS.bg,borderColor:'#fd0404',borderWidth:2},
  timeCol: { width: 60, alignItems: 'center', paddingTop: 8},
  timeText: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '600', textAlign: 'center' },
  timeLine: { width: 3, flex: 1, marginTop: 5, minHeight: 30, borderRadius: 1 },
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 8,
    marginLeft: 7,
    ...SHADOW.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  roomText: { fontSize: FONTS.sizes.sm, color:'#006064', fontWeight: '600', marginTop: 2 },
  iconEmoji: { fontSize: 18 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.textPrimary },
  cardDuration: { fontSize: FONTS.sizes.sm, color: '#816412', marginTop: 2 },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 10,
  },
  teacherIcon: { fontSize: 13, marginTop: 1 },
  teacherName: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },
  teacherRole: { fontSize: FONTS.sizes.sm, fontWeight: '400', color: COLORS.textMuted },
  teacherDetail: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 1 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: FONTS.sizes.base, textAlign: 'center' },
});
