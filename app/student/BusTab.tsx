// app/student/BusTab.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  ActivityIndicator, TouchableOpacity
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { formatTime } from '../../lib/auth';
import { COLORS, RADIUS, SHADOW, FONTS } from '../../constants/theme';
import { useOfflineData } from '../../hooks/useOfflineData';
import OfflineBanner from '../../components/OfflineBanner';
import { getFavoriteRouteIds, toggleFavoriteRoute } from '../../lib/favorites';

interface BusRoute {
  id: string;
  route_name: string;
  direction: string;
}

interface BusStop {
  id: string;
  route_id: string;
  stop_name: string;
  bus_number?: string;
  days_active?: string;
  departure_time: string;
}

interface BusData {
  routes: BusRoute[];
  stops: Record<string, BusStop[]>;
}

export default function BusTab() {
  const [direction, setDirection] = useState<'All' | 'To University' | 'From University'>('To University');
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    getFavoriteRouteIds().then(setFavorites);
  }, []);

  async function onToggleFavorite(routeId: string) {
    const next = await toggleFavoriteRoute(routeId);
    setFavorites(next);
  }

  const fetchAll = useCallback(async () => {
    const [{ data: routeData, error: routeError }, { data: stopData, error: stopError }] = await Promise.all([
      supabase.from('bus_routes').select('*').order('direction').order('route_name'),
      supabase.from('bus_schedule').select('*').order('days_active').order('departure_time'),
    ]);
    if (routeError || stopError) {
      return { data: null, error: routeError ?? stopError };
    }
    const grouped: Record<string, BusStop[]> = {};
    (stopData ?? []).forEach((s: any) => {
      if (!grouped[s.route_id]) grouped[s.route_id] = [];
      grouped[s.route_id].push(s);
    });
    return { data: { routes: routeData ?? [], stops: grouped }, error: null };
  }, []);

  const {
    data, loading, refreshing, isOffline, lastSynced, refresh,
  } = useOfflineData<BusData>('bus_schedule', fetchAll, []);

  const routes = data?.routes ?? [];
  const stops = data?.stops ?? {};

  function groupByDay(routeStops: BusStop[]) {
    return routeStops.reduce<Record<string, BusStop[]>>((acc, s) => {
      const day = s.days_active ?? 'All Days';
      if (!acc[day]) acc[day] = [];
      acc[day].push(s);
      return acc;
    }, {});
  }

  const filtered = direction === 'All' ? routes : routes.filter(r => r.direction === direction);
  const toUni = filtered.filter(r => r.direction === 'To University');
  const fromUni = filtered.filter(r => r.direction === 'From University');
  const showFavorites = direction !== 'All';
  const favoriteRoutes = showFavorites ? filtered.filter(r => favorites.includes(r.id)) : [];

  function renderRouteCard(route: BusRoute, showStar: boolean) {
    const routeStops = stops[route.id] ?? [];
    const grouped = groupByDay(routeStops);
    const isFav = favorites.includes(route.id);
    return (
      <View key={route.id} style={styles.routeCard}>
        <View style={styles.routeHeader}>
          <Text style={styles.routeName}>{route.route_name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {showStar && (
              <TouchableOpacity onPress={() => onToggleFavorite(route.id)} hitSlop={8}>
                <MaterialIcons
                  name={isFav ? 'favorite' : 'favorite-border'}
                  size={20}
                  color={isFav ? '#fd1509': COLORS.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {Object.entries(grouped).map(([day, dayStops]) => (
          <View key={day} style={styles.dayGroup}>
            <Text style={styles.dayLabel}>{day}</Text>
            {dayStops.map((stop, i) => (
              <View key={stop.id} style={[styles.stopRow, i < dayStops.length - 1 && styles.stopBorder]}>
                <View style={styles.stopDot} />
                <Text style={styles.stopName}>{stop.stop_name}</Text>
                {stop.bus_number && (
                  <View style={styles.busBadge}>
                    <Text style={styles.busNumber}> {stop.bus_number}</Text>
                  </View>
                )}
                <Text style={styles.stopTime}>{formatTime(stop.departure_time)}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bus Schedule</Text>
        <Text style={styles.headerSub}>Wishing safe travels!</Text>
      </View>

      {/* Direction filter */}
      <View style={styles.filterRow}>
        {(['All', 'To University', 'From University'] as const).map(d => (
          <TouchableOpacity
            key={d}
            style={[styles.filterBtn, direction === d && styles.filterBtnActive]}
            onPress={() => setDirection(d)}
          >
            <Text style={[styles.filterText, direction === d && styles.filterTextActive]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <OfflineBanner isOffline={isOffline} lastSynced={lastSynced} />

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        >
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🚌</Text>
              <Text style={styles.emptyText}>No bus schedules added yet</Text>
            </View>
          ) : (
            <>
              {favoriteRoutes.length > 0 && (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <MaterialIcons name="favorite" size={16} color={'#fd1509'} />
                    <Text style={[styles.favLabel, { marginBottom: 0 }]}>Favorite Route</Text>
                  </View>
                  {favoriteRoutes.map(route => renderRouteCard(route, true))}
                </>
              )}

              {toUni.length > 0 && (
                <>
                  <Text style={[styles.dirLabel, favoriteRoutes.length > 0 && { marginTop: 16 }]}>🏫 To University</Text>
                  {toUni.map(route => renderRouteCard(route, showFavorites))}
                </>
              )}

              {fromUni.length > 0 && (
                <>
                  <Text style={[styles.dirLabel, { marginTop: 16 }]}>🏠 From University</Text>
                  {fromUni.map(route => renderRouteCard(route, showFavorites))}
                </>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: COLORS.surface },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary },
  headerSub: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginTop: 2 },
  filterRow: { flexDirection: 'row', gap: 8, padding: 12, paddingHorizontal: 16, backgroundColor: COLORS.surface, ...SHADOW.sm },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: FONTS.sizes.xs, fontWeight: '600', color: COLORS.textSecondary },
  filterTextActive: { color: '#fff' },
  scroll: { padding: 16, paddingBottom: 32 },
  dirLabel: { fontSize: FONTS.sizes.md, fontWeight: '800', color: '#030303d8', marginBottom: 10 },
  favLabel: { fontSize: FONTS.sizes.md, fontWeight: '800', color: '#fd1509', marginBottom: 10 },
  routeCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, marginBottom: 12, overflow: 'hidden', ...SHADOW.sm },
  routeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  routeName: { fontSize: FONTS.sizes.base, fontWeight: '800', color: COLORS.textPrimary, flex: 1 },
  dayGroup: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4 },
  dayLabel: { fontSize: FONTS.sizes.xs, fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  stopRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
  stopBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  stopDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.primary },
  stopName: { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.textPrimary, fontWeight: '500' },
  busBadge: { backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2 },
  busNumber: { fontSize: FONTS.sizes.xs, color: COLORS.primary, fontWeight: '700' },
  stopTime: { fontSize: FONTS.sizes.sm, fontWeight: '700', color:'#1E1E1E' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: FONTS.sizes.base },
});
