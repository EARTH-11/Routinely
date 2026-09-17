// app/rep/RepTimelineScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal,KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { formatTime } from '../../lib/auth';
import { COLORS, RADIUS, SHADOW, FONTS, ICON_MAP, DAY_NAMES } from '../../constants/theme';
import { TimelineItem, RepSession } from '../../types';

interface Props { session: RepSession; }

const ICONS = Object.keys(ICON_MAP);
const DAY_OPTIONS = [...DAY_NAMES.map((d, i) => ({ label: d, value: i })), { label: 'Daily', value: -1 }];
const PILL_COLORS = ['#5B8AF0', '#F87171', '#34D399', '#FBBF24', '#A78BFA', '#F472B6', '#38BDF8', '#FB923C'];

const EMPTY_FORM = {
  title: '', teacher_name: '', teacher_role: '', teacher_detail: '',
  start_time: '', end_time: '', day_of_week: -1, room: '',
  icon: 'book', color: PILL_COLORS[0],
};

export default function RepTimelineScreen({ session }: Props) {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from('timeline_items')
      .select('*')
      .eq('section_id', session.section_id)
      .order('start_time');
    setItems(data ?? []);
    setLoading(false);
  }, [session.section_id]);

  useEffect(() => { fetch(); }, [fetch]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowModal(true);
  }

  function openEdit(item: TimelineItem) {
    setForm({
      title: item.title,
      teacher_name: item.teacher_name ?? '',
      teacher_role: item.teacher_role ?? '',
      teacher_detail: item.teacher_detail ?? '',
      room: item.room ?? '',
      start_time: item.start_time,
      end_time: item.end_time,
      day_of_week: item.day_of_week ?? -1,
      icon: item.icon ?? 'book',
      color: item.color ?? PILL_COLORS[0],
    });
    setEditId(item.id);
    setShowModal(true);
  }

  async function save() {
    if (!form.title || !form.start_time || !form.end_time) {
      Alert.alert('Missing fields', 'Title, start time, and end time are required.');
      return;
    }
    const payload = {
      ...form,
      section_id: session.section_id,
      day_of_week: form.day_of_week === -1 ? null : form.day_of_week,
    };
    const { error } = editId
      ? await supabase.from('timeline_items').update(payload).eq('id', editId)
      : await supabase.from('timeline_items').insert(payload);
    if (error) { Alert.alert('Error', error.message); return; }
    setShowModal(false);
    fetch();
  }

  async function deleteItem(item: TimelineItem) {
    Alert.alert('Delete', `Remove "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('timeline_items').delete().eq('id', item.id); fetch(); } },
    ]);
  }

  const filteredItems = items.filter(i => i.day_of_week === null || i.day_of_week === selectedDay);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Timeline</Text>
          <Text style={styles.headerSub}>{session.batch_name} · {session.section_name}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Class</Text>
        </TouchableOpacity>
      </View>

      {/* Day filter */}
      <View style={styles.dayRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, flexDirection: 'row' }}>
          {DAY_NAMES.map((d, i) => (
            <TouchableOpacity
              key={d}
              style={[styles.dayBtn, selectedDay === i && styles.dayBtnActive]}
              onPress={() => setSelectedDay(i)}
            >
              <Text style={[styles.dayBtnText, selectedDay === i && styles.dayBtnTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {filteredItems.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📅</Text>
              <Text style={styles.emptyText}>No classes for {DAY_NAMES[selectedDay]}. Tap '+Class' to add.</Text>
            </View>
          ) : (
            filteredItems.map(item => (
              <View key={item.id} style={[styles.card, { borderLeftColor: item.color ?? COLORS.primary, borderLeftWidth: 0 }]}>
                <View style={styles.cardTop}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardTime}>{formatTime(item.start_time)} – {formatTime(item.end_time)}</Text>
                    {item.teacher_name && <Text style={styles.cardTeacher}>👤 {item.teacher_name}</Text>}
                    {item.day_of_week === null && <Text style={styles.dailyBadge}>Daily</Text>}
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                      <Text style={styles.editBtnText}>Edit✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteItemBtn} onPress={() => deleteItem(item)}>
                      <Text style={styles.deleteItemBtnText}>Delete🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Add/Edit Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios'?'padding' : 'height'} style={{flex:1}}>
          <ScrollView keyboardShouldPersistTaps="handled">
         <View style={styles.modal}>
         
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{editId ? 'Edit Class' : 'New Class'}</Text>

              {[
                { label: 'Class Title ', key: 'title', placeholder: 'e.g. Math Class' },
                { label: 'Teacher Name', key: 'teacher_name', placeholder: 'e.g. Mr. Rahman' },
                { label: 'Teacher Role', key: 'teacher_role', placeholder: 'e.g. Lecturer, Professor, Department' },
                { label: 'Room', key: 'room', placeholder: 'e.g. 204 ' },
                { label: 'Start Time (24hr timeline HH:MM)', key: 'start_time', placeholder: '09:00' },
                { label: 'End Time (24hr timeline HH:MM)', key: 'end_time', placeholder: '13:00' },
              ].map(f => (
                <View key={f.key}>
                  <Text style={styles.inputLabel}>{f.label}</Text>
                  <TextInput
                    style={styles.input}
                    value={(form as any)[f.key]}
                    onChangeText={v => setForm(prev => ({ ...prev, [f.key]: v }))}
                    placeholder={f.placeholder}
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              ))}

              {/* Day of week */}
              <Text style={styles.inputLabel}>Day</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                {DAY_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.dayChip, form.day_of_week === opt.value && styles.dayChipActive]}
                    onPress={() => setForm(prev => ({ ...prev, day_of_week: opt.value }))}
                  >
                    <Text style={[styles.dayChipText, form.day_of_week === opt.value && styles.dayChipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Icon picker */}
              <Text style={styles.inputLabel}>Icon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                {ICONS.map(icon => (
                  <TouchableOpacity
                    key={icon}
                    style={[styles.iconChip, form.icon === icon && styles.iconChipActive]}
                    onPress={() => setForm(prev => ({ ...prev, icon }))}
                  >
                    <Text style={{ fontSize: 20 }}>{ICON_MAP[icon]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Color picker */}
              <Text style={styles.inputLabel}>Color</Text>
              <View style={styles.colorRow}>
                {PILL_COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorDot, { backgroundColor: c }, form.color === c && styles.colorDotActive]}
                    onPress={() => setForm(prev => ({ ...prev, color: c }))}
                  />
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setShowModal(false)}>
                  <Text style={styles.cancelModalText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveModalBtn} onPress={save}>
                  <Text style={styles.saveModalText}>{editId ? 'Save Changes' : 'Add Class'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          
         </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14,
    backgroundColor: COLORS.surface, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'flex-end', ...SHADOW.sm,
  },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary },
  headerSub: { fontSize: FONTS.sizes.sm, color: COLORS.primary, marginTop: 2, fontWeight: '600' },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.sm },
  dayRow: { backgroundColor: COLORS.surface, paddingVertical: 10, ...SHADOW.sm },
  dayBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border },
  dayBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dayBtnText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },
  dayBtnTextActive: { color: '#fff' },
  scroll: { padding: 16, paddingBottom: 32 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 14, marginBottom: 10, ...SHADOW.sm },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.textPrimary },
  cardTime: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  cardTeacher: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 3 },
  dailyBadge: { fontSize: FONTS.sizes.xs, color: COLORS.accent, fontWeight: '700', marginTop: 4 },
  cardActions: { flexDirection: 'row', gap: 4 },
  editBtn: { padding: 6 , backgroundColor: COLORS.bg, borderRadius: RADIUS.md, alignItems: 'center' },
  editBtnText: { fontSize: 14, color: '#1A1F36', fontWeight: '700' },
  deleteItemBtn: { padding: 6, backgroundColor: COLORS.bg, borderRadius: RADIUS.md, alignItems: 'center' },
  deleteItemBtnText: { fontSize: 14 , color: '#1A1F36', fontWeight: '700'},
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: FONTS.sizes.base, textAlign: 'center' },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, },
  modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  inputLabel: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, marginTop: 14 },
  input: { backgroundColor: COLORS.bg, borderRadius: RADIUS.md, padding: 14, borderWidth: 1, borderColor: COLORS.border, fontSize: FONTS.sizes.base, color: COLORS.textPrimary },
  dayChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  dayChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dayChipText: { fontSize: FONTS.sizes.xs, fontWeight: '600', color: COLORS.textSecondary },
  dayChipTextActive: { color: '#fff' },
  iconChip: { width: 44, height: 44, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  iconChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  colorRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorDotActive: { borderWidth: 3, borderColor: COLORS.textPrimary },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelModalBtn: { flex: 1, padding: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelModalText: { color: COLORS.textSecondary, fontWeight: '700' },
  saveModalBtn: { flex: 1, padding: 14, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveModalText: { color: '#fff', fontWeight: '700' },
});
