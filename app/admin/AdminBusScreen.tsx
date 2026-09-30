// app/admin/AdminBusScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { formatTime } from '../../lib/auth';
import { COLORS, RADIUS, SHADOW, FONTS } from '../../constants/theme';
import { BusDirection } from '../../types';

const DIRECTIONS: BusDirection[] = ['To University', 'From University'];

interface BusRoute {
  id: string;
  route_name: string;
  direction: BusDirection;
}

interface BusStop {
  id: string;
  route_id: string;
  stop_name: string;
  bus_number?: string;
  days_active?: string;
  departure_time: string;
}

const EMPTY_ROUTE_FORM = { route_name: '', direction: 'To University' as BusDirection };
const EMPTY_STOP_FORM = { stop_name: '', bus_number: '', days_active: '', departure_time: '' };

export default function AdminBusScreen() {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [stops, setStops] = useState<Record<string, BusStop[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [showAddStop, setShowAddStop] = useState<string | null>(null);
  const [routeForm, setRouteForm] = useState(EMPTY_ROUTE_FORM);
  const [stopForm, setStopForm] = useState(EMPTY_STOP_FORM);

  const fetchAll = useCallback(async () => {
    const [{ data: routeData }, { data: stopData }] = await Promise.all([
      supabase.from('bus_routes').select('*').order('direction').order('route_name'),
      supabase.from('bus_schedule').select('*').order('days_active').order('departure_time'),
    ]);
    setRoutes(routeData ?? []);
    const grouped: Record<string, BusStop[]> = {};
    (stopData ?? []).forEach((s: any) => {
      if (!grouped[s.route_id]) grouped[s.route_id] = [];
      grouped[s.route_id].push(s);
    });
    setStops(grouped);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function addRoute() {
    if (!routeForm.route_name.trim()) { Alert.alert('Required', 'Route name is required.'); return; }
    const { data, error } = await supabase.from('bus_routes').insert({ route_name: routeForm.route_name.trim(), direction: routeForm.direction }).select().single();
    if (error) { Alert.alert('Error', error.message); return; }
    setShowAddRoute(false);
    setRouteForm(EMPTY_ROUTE_FORM);
    setExpandedRoute(data.id);
    setShowAddStop(data.id);
    fetchAll();
  }

  async function deleteRoute(route: BusRoute) {
    Alert.alert('Delete Route', `Delete "${route.route_name}" and all stops?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('bus_routes').delete().eq('id', route.id); fetchAll(); } },
    ]);
  }

  async function addStop(routeId: string) {
    if (!stopForm.stop_name.trim() || !stopForm.departure_time.trim()) { Alert.alert('Required', 'Stop name and time required.'); return; }
    const route = routes.find(r => r.id === routeId);
    const { error } = await supabase.from('bus_schedule').insert({
      route_id: routeId,
      route_name: route?.route_name ?? '',
      direction: route?.direction ?? 'To University',
      stop_name: stopForm.stop_name.trim(),
      bus_number: stopForm.bus_number.trim() || null,
      days_active: stopForm.days_active.trim() || null,
      departure_time: stopForm.departure_time.trim(),
      sort_order: (stops[routeId] ?? []).length,
    });
    if (error) { Alert.alert('Error', error.message); return; }
    setStopForm(EMPTY_STOP_FORM);
    setShowAddStop(null);
    fetchAll();
  }

  async function deleteStop(stop: BusStop) {
    Alert.alert('Delete', `Remove "${stop.stop_name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('bus_schedule').delete().eq('id', stop.id); fetchAll(); } },
    ]);
  }

  function groupByDay(routeStops: BusStop[]) {
    return routeStops.reduce<Record<string, BusStop[]>>((acc, s) => {
      const day = s.days_active ?? 'All Days';
      if (!acc[day]) acc[day] = [];
      acc[day].push(s);
      return acc;
    }, {});
  }

  const toUni = routes.filter(r => r.direction === 'To University');
  const fromUni = routes.filter(r => r.direction === 'From University');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Bus Schedule</Text>
          <Text style={styles.headerSub}>{routes.length} routes</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddRoute(true)}>
          <Text style={styles.addBtnText}>+ Route</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} /> : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {routes.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🚌</Text>
              <Text style={styles.emptyText}>No routes yet. Tap '+Route' to add.</Text>
            </View>
          ) : (
            <>
              {toUni.length > 0 && <>
                <Text style={styles.dirLabel}>🏫 To University</Text>
                {toUni.map(route => (
                  <RouteCard key={route.id} route={route} routeStops={stops[route.id] ?? []} expanded={expandedRoute === route.id} onToggle={() => setExpandedRoute(expandedRoute === route.id ? null : route.id)} onDelete={() => deleteRoute(route)} onAddStop={() => { setExpandedRoute(route.id); setShowAddStop(route.id); }} showAddStop={showAddStop === route.id} stopForm={stopForm} setStopForm={setStopForm} onSubmitStop={() => addStop(route.id)} onCancelStop={() => { setShowAddStop(null); setStopForm(EMPTY_STOP_FORM); }} onDeleteStop={deleteStop} groupByDay={groupByDay} />
                ))}
              </>}
              {fromUni.length > 0 && <>
                <Text style={[styles.dirLabel, { marginTop: 16 }]}>🏠 From University</Text>
                {fromUni.map(route => (
                  <RouteCard key={route.id} route={route} routeStops={stops[route.id] ?? []} expanded={expandedRoute === route.id} onToggle={() => setExpandedRoute(expandedRoute === route.id ? null : route.id)} onDelete={() => deleteRoute(route)} onAddStop={() => { setExpandedRoute(route.id); setShowAddStop(route.id); }} showAddStop={showAddStop === route.id} stopForm={stopForm} setStopForm={setStopForm} onSubmitStop={() => addStop(route.id)} onCancelStop={() => { setShowAddStop(null); setStopForm(EMPTY_STOP_FORM); }} onDeleteStop={deleteStop} groupByDay={groupByDay} />
                ))}
              </>}
            </>
          )}
        </ScrollView>
        </KeyboardAvoidingView>
      )}

      <Modal visible={showAddRoute} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView keyboardShouldPersistTaps="handled" >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Route</Text>
            <Text style={styles.inputLabel}>Direction</Text>
            <View style={styles.dirToggle}>
              {DIRECTIONS.map(d => (
                <TouchableOpacity key={d} style={[styles.dirBtn, routeForm.direction === d && styles.dirBtnActive]} onPress={() => setRouteForm(f => ({ ...f, direction: d }))}>
                  <Text style={[styles.dirBtnText, routeForm.direction === d && styles.dirBtnTextActive]}>{d === 'To University' ? '🏫 To Uni' : '🏠 From Uni'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.inputLabel}>Route Name </Text>
            <TextInput style={styles.input} value={routeForm.route_name} onChangeText={v => setRouteForm(f => ({ ...f, route_name: v }))} placeholder="e.g. Route XYZ" placeholderTextColor={COLORS.textMuted} autoFocus />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setShowAddRoute(false)}>
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveModalBtn} onPress={addRoute}>
                <Text style={styles.saveModalText}>Create Route</Text>
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function RouteCard({ route, routeStops, expanded, onToggle, onDelete, onAddStop, showAddStop, stopForm, setStopForm, onSubmitStop, onCancelStop, onDeleteStop, groupByDay }: any) {
  const grouped = groupByDay(routeStops);
  return (
    <View style={styles.routeCard}>
      <TouchableOpacity style={styles.routeHeader} onPress={onToggle}>
        <Text style={styles.routeName}>{route.route_name}</Text>
        <View style={styles.routeActions}>
          <Text style={styles.stopCount}>{routeStops.length} stops</Text>
          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
          <TouchableOpacity  onPress={onDelete}><Text style={styles.deleteBtnText}>✕</Text></TouchableOpacity>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.routeBody}>
          {Object.entries(grouped).map(([day, dayStops]: [string, any]) => (
            <View key={day} style={styles.dayGroup}>
              <Text style={styles.dayLabel}>{day}</Text>
              {dayStops.map((stop: BusStop, i: number) => (
                <View key={stop.id} style={[styles.stopRow, i < dayStops.length - 1 && styles.stopBorder]}>
                  <Text style={styles.stopName}>{stop.stop_name}</Text>
                  {stop.bus_number && <View style={styles.busBadge}><Text style={styles.busNumber}>{stop.bus_number}</Text></View>}
                  <Text style={styles.stopTime}>{formatTime(stop.departure_time)}</Text>
                  <TouchableOpacity onPress={() => onDeleteStop(stop)}><Text style={styles.deleteStopText}>✕</Text></TouchableOpacity>
                </View>
              ))}
            </View>
          ))}

          {showAddStop ? (
            <View style={styles.addStopForm}>
              <TextInput style={styles.addStopInput} value={stopForm.stop_name} onChangeText={(v: string) => setStopForm((f: any) => ({ ...f, stop_name: v }))} placeholder="Station" placeholderTextColor={COLORS.textMuted} autoFocus />
              <TextInput style={[styles.addStopInput, { width: 65 }]} value={stopForm.bus_number} onChangeText={(v: string) => setStopForm((f: any) => ({ ...f, bus_number: v }))} placeholder="Bus No" placeholderTextColor={COLORS.textMuted} />
              <TextInput style={[styles.addStopInput, { width: 72 }]} value={stopForm.days_active} onChangeText={(v: string) => setStopForm((f: any) => ({ ...f, days_active: v }))} placeholder="Days" placeholderTextColor={COLORS.textMuted} />
              <TextInput style={[styles.addStopInput, { width: 65 }]} value={stopForm.departure_time} onChangeText={(v: string) => setStopForm((f: any) => ({ ...f, departure_time: v }))} placeholder="HH:MM" placeholderTextColor={COLORS.textMuted} />
              <TouchableOpacity style={styles.confirmBtn} onPress={onSubmitStop}><Text style={styles.confirmBtnText}>✓</Text></TouchableOpacity>
              <TouchableOpacity onPress={onCancelStop}><Text style={styles.cancelText}>✕</Text></TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addStopBtn} onPress={onAddStop}>
              <Text style={styles.addStopBtnText}>+ Add Stop</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: COLORS.surface, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', ...SHADOW.sm },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary },
  headerSub: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginTop: 2 },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.sm },
  scroll: { padding: 16, paddingBottom: 40 },
  dirLabel: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 10 },
  routeCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, marginBottom: 10, overflow: 'hidden', ...SHADOW.sm },
  routeHeader: { padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  routeName: { fontSize: FONTS.sizes.base, fontWeight: '800', color: COLORS.textPrimary, flex: 1 },
  routeActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stopCount: { fontSize: FONTS.sizes.xs, color: COLORS.primary, fontWeight: '600' },
  chevron: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  deleteBtnText: { color: COLORS.secondary, fontWeight: '700' },
  routeBody: { borderTopWidth: 1, borderTopColor: COLORS.border, padding: 12 },
  dayGroup: { marginBottom: 10 },
  dayLabel: { fontSize: FONTS.sizes.xs, fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, paddingLeft: 2 },
  stopRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
  stopBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  stopName: { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.textPrimary, fontWeight: '500' },
  busBadge: { backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2 },
  busNumber: { fontSize: FONTS.sizes.xs, color: COLORS.primary, fontWeight: '700' },
  stopTime: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textPrimary },
  deleteStopText: { color: COLORS.secondary },
  addStopForm: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, flexWrap: 'wrap' },
  addStopInput: { flex: 1, backgroundColor: COLORS.bg, borderRadius: RADIUS.md, padding: 7, borderWidth: 1, borderColor: COLORS.border, fontSize: FONTS.sizes.xs, color: COLORS.textPrimary, minWidth: 55 },
  confirmBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: 8, paddingHorizontal: 10 },
  confirmBtnText: { color: '#fff', fontWeight: '700' },
  cancelText: { color: COLORS.textMuted, fontSize: FONTS.sizes.md },
  addStopBtn: { borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: RADIUS.md, borderStyle: 'dashed', padding: 9, alignItems: 'center', marginTop: 6 },
  addStopBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: FONTS.sizes.sm },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: FONTS.sizes.base, textAlign: 'center' },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  inputLabel: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, marginTop: 14 },
  input: { backgroundColor: COLORS.bg, borderRadius: RADIUS.md, padding: 14, borderWidth: 1, borderColor: COLORS.border, fontSize: FONTS.sizes.base, color: COLORS.textPrimary },
  dirToggle: { flexDirection: 'row', gap: 8 },
  dirBtn: { flex: 1, padding: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  dirBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dirBtnText: { fontSize: FONTS.sizes.xs, fontWeight: '600', color: COLORS.textSecondary },
  dirBtnTextActive: { color: '#fff' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelModalBtn: { flex: 1, padding: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelModalText: { color: COLORS.textSecondary, fontWeight: '700' },
  saveModalBtn: { flex: 1, padding: 14, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveModalText: { color: '#fff', fontWeight: '700' },
});