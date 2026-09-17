// app/rep/RepExamScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal,KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { formatTime, formatDate } from '../../lib/auth';
import { COLORS, RADIUS, SHADOW, FONTS } from '../../constants/theme';
import { ExamScheduleItem, ExamType, RepSession } from '../../types';

interface Props { session: RepSession; }

const EXAM_TYPES: ExamType[] = ['Class Test', 'Mid Exam', 'Final Exam'];

const EMPTY_FORM = {
  subject: '', exam_type: 'Class Test' as ExamType,
  exam_date: '', start_time: '', end_time: '', place: '', notes: '',
};

const COLOR_MAP: Record<ExamType, string> = {
  'Class Test': COLORS.accent,
  'Mid Exam': COLORS.warning,
  'Final Exam': COLORS.secondary,
};

export default function RepExamScreen({ session }: Props) {
  const [items, setItems] = useState<ExamScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from('exam_schedule')
      .select('*')
      .eq('section_id', session.section_id)
      .order('exam_date')
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

  function openEdit(item: ExamScheduleItem) {
    setForm({
      subject: item.subject,
      exam_type: item.exam_type,
      exam_date: item.exam_date,
      start_time: item.start_time,
      end_time: item.end_time ?? '',
      place: item.place ?? '',
      notes: item.notes ?? '',
    });
    setEditId(item.id);
    setShowModal(true);
  }

  async function save() {
    if (!form.subject || !form.exam_date || !form.start_time) {
      Alert.alert('Missing fields', 'Subject, date and start time are required.');
      return;
    }
    const payload = { ...form, section_id: session.section_id };
    const { error } = editId
      ? await supabase.from('exam_schedule').update(payload).eq('id', editId)
      : await supabase.from('exam_schedule').insert(payload);
    if (error) { Alert.alert('Error', error.message); return; }
    setShowModal(false);
    fetch();
  }

  async function deleteItem(item: ExamScheduleItem) {
    Alert.alert('Delete Exam', `Remove "${item.subject} - ${item.exam_type}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => { await supabase.from('exam_schedule').delete().eq('id', item.id); fetch(); },
      },
    ]);
  }

  const upcoming = items.filter(i => new Date(i.exam_date) >= new Date());
  const past = items.filter(i => new Date(i.exam_date) < new Date());

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Exam Schedule</Text>
          <Text style={styles.headerSub}>{session.batch_name} · {session.section_name}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Exam</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {items.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={styles.emptyText}>No exams yet. Tap '+Exam' to add one.</Text>
            </View>
          ) : (
            <>
              {upcoming.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>Upcoming</Text>
                  {upcoming.map(item => (
                    <ExamCard key={item.id} item={item} onEdit={() => openEdit(item)} onDelete={() => deleteItem(item)} />
                  ))}
                </>
              )}
              {past.length > 0 && (
                <>
                  <Text style={[styles.sectionLabel, { color: COLORS.textMuted }]}>Past</Text>
                  {past.map(item => (
                    <ExamCard key={item.id} item={item} past onEdit={() => openEdit(item)} onDelete={() => deleteItem(item)} />
                  ))}
                </>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* Add/Edit Modal */}
      <Modal visible={showModal} transparent animationType="slide">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios'?'padding' : 'height'} style={{flex:1}}>
             <ScrollView keyboardShouldPersistTaps="handled" >
        <View style={styles.modal}>
              
              
            <View style={styles.modalCard}>
             
              <Text style={styles.modalTitle}>{editId ? 'Edit Exam' : 'New Exam'}</Text>

              {/* Exam type selector */}
              <Text style={styles.inputLabel}>Exam Type</Text>
              <View style={styles.typeRow}>
                {EXAM_TYPES.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeBtn, form.exam_type === t && { backgroundColor: COLOR_MAP[t], borderColor: COLOR_MAP[t] }]}
                    onPress={() => setForm(f => ({ ...f, exam_type: t }))}
                  >
                    <Text style={[styles.typeBtnText, form.exam_type === t && { color: '#fff' }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {[
                { label: 'Subject ', key: 'subject', placeholder: 'e.g. Mathematics' },
                { label: 'Date (YYYY-MM-DD)', key: 'exam_date', placeholder: '2025-11-15' },
                { label: 'Start Time (In 24hr Timeline HH:MM)', key: 'start_time', placeholder: '09:00' },
                { label: 'End Time (In 24hr Timeline HH:MM)', key: 'end_time', placeholder: '14:30' },
                { label: 'Place / Venue', key: 'place', placeholder: 'e.g. Hall Room , Room 102' },
                { label: 'Notes (optional)', key: 'notes', placeholder: 'Any extra info...' },
              ].map(f => (
                <View key={f.key}>
                  <Text style={styles.inputLabel}>{f.label}</Text>
                  <TextInput
                    style={[styles.input, f.key === 'notes' && { height: 72, textAlignVertical: 'top' }]}
                    value={(form as any)[f.key]}
                    onChangeText={v => setForm(prev => ({ ...prev, [f.key]: v }))}
                    placeholder={f.placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    multiline={f.key === 'notes'}
                  />
                </View>
              ))}

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setShowModal(false)}>
                  <Text style={styles.cancelModalText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveModalBtn} onPress={save}>
                  <Text style={styles.saveModalText}>{editId ? 'Save Changes' : 'Add Exam'}</Text>
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

function ExamCard({ item, past, onEdit, onDelete }: {
  item: ExamScheduleItem; past?: boolean;
  onEdit: () => void; onDelete: () => void;
}) {
  const color = COLOR_MAP[item.exam_type];
  return (
    <View style={[styles.card, { borderLeftColor: color, borderLeftWidth: 0 }, past && { opacity: 0.6 }]}>
      <View style={styles.cardRow}>
        <View style={styles.cardInfo}>
          <View style={[styles.typeBadge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.typeBadgeText, { color }]}>{item.exam_type}</Text>
          </View>
          <Text style={styles.subject}>{item.subject}</Text>
          <View style={styles.detailsRow}>
            <Text style={styles.detail}>📅 {formatDate(item.exam_date)}</Text>
            <Text style={styles.detail}>🕐 {formatTime(item.start_time)}{item.end_time ? ` – ${formatTime(item.end_time)}` : ''}</Text>
            {item.place && <Text style={styles.detail}>📍 {item.place}</Text>}
          </View>
          {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
        </View>
        <View style={styles.actionCol}>
          <TouchableOpacity style={styles.iconBtn} onPress={onEdit}><Text style={{ color: '#1A1F36', fontWeight: '700' }}>Edit✏️</Text></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={onDelete}><Text style={{ color: '#1A1F36', fontWeight: '700' }}>Delete🗑️</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: COLORS.surface, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'flex-end', ...SHADOW.sm,
  },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary },
  headerSub: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.sm },
  scroll: { padding: 16, paddingBottom: 32 },
  sectionLabel: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10, marginTop: 4 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 14, marginBottom: 10, ...SHADOW.sm },
  cardRow: { flexDirection: 'row' },
  cardInfo: { flex: 1 },
  typeBadge: { alignSelf: 'flex-start', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 6 },
  typeBadgeText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  subject: { fontSize: FONTS.sizes.base, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  detailsRow: { gap: 4 },
  detail: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  notes: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 6, fontStyle: 'italic' },
  actionCol: { gap: 4, marginLeft: 8 },
  iconBtn: { padding: 6,backgroundColor: COLORS.bg, borderRadius: RADIUS.md, alignItems: 'center' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: FONTS.sizes.base, textAlign: 'center' },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  inputLabel: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, marginTop: 14 },
  input: { backgroundColor: COLORS.bg, borderRadius: RADIUS.md, padding: 14, borderWidth: 1, borderColor: COLORS.border, fontSize: FONTS.sizes.base, color: COLORS.textPrimary },
  typeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  typeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border },
  typeBtnText: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.textSecondary },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelModalBtn: { flex: 1, padding: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelModalText: { color: COLORS.textSecondary, fontWeight: '700' },
  saveModalBtn: { flex: 1, padding: 14, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveModalText: { color: '#fff', fontWeight: '700' },
});
