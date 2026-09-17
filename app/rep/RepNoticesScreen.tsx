// app/rep/RepNoticesScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal, Switch,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { COLORS, RADIUS, SHADOW, FONTS } from '../../constants/theme';
import { Notice, NoticeType, RepSession } from '../../types';

interface Props { session: RepSession; }

const TYPE_OPTIONS: { type: NoticeType; emoji: string; label: string; color: string }[] = [
  { type: 'general', emoji: '📢', label: 'General', color: COLORS.primary },
  { type: 'emergency', emoji: '🚨', label: 'Emergency', color: COLORS.secondary },
  { type: 'exam', emoji: '📝', label: 'Assignment', color: COLORS.warning },
  { type: 'event', emoji: '🎉', label: 'Event', color: COLORS.accent },
];

const EMPTY_FORM = { title: '', body: '', notice_type: 'general' as NoticeType };

export default function RepNoticesScreen({ session }: Props) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from('notices')
      .select('*')
      .eq('section_id', session.section_id)
      .order('created_at', { ascending: false });
    setNotices(data ?? []);
    setLoading(false);
  }, [session.section_id]);

  useEffect(() => { fetch(); }, [fetch]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowModal(true);
  }

  function openEdit(notice: Notice) {
    setForm({ title: notice.title, body: notice.body, notice_type: notice.notice_type });
    setEditId(notice.id);
    setShowModal(true);
  }

  async function save() {
    if (!form.title.trim() || !form.body.trim()) {
      Alert.alert('Missing fields', 'Title and message are required.');
      return;
    }
    const payload = {
      ...form,
      section_id: session.section_id,
      posted_by: session.login_id,
      is_active: true,
    };
    const { error } = editId
      ? await supabase.from('notices').update(payload).eq('id', editId)
      : await supabase.from('notices').insert(payload);
    if (error) { Alert.alert('Error', error.message); return; }
    setShowModal(false);
    fetch();
  }

  async function toggleActive(notice: Notice) {
    await supabase.from('notices').update({ is_active: !notice.is_active }).eq('id', notice.id);
    fetch();
  }

  async function deleteNotice(notice: Notice) {
    Alert.alert('Delete Notice', `Delete "${notice.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => { await supabase.from('notices').delete().eq('id', notice.id); fetch(); },
      },
    ]);
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
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notices</Text>
          <Text style={styles.headerSub}>{session.batch_name} · {session.section_name}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Notice</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {notices.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📢</Text>
              <Text style={styles.emptyText}>No notices yet. Tap '+Notice' to post one.</Text>
            </View>
          ) : (
            notices.map(notice => {
              const typeConfig = TYPE_OPTIONS.find(t => t.type === notice.notice_type) ?? TYPE_OPTIONS[0];
              return (
                <View key={notice.id} style={[
                  styles.card,
                  !notice.is_active && { opacity: 0.5 },
                  notice.notice_type === 'emergency' && { borderLeftWidth: 0, borderLeftColor: COLORS.secondary }
                ]}>
                  <View style={styles.cardTop}>
                    <View style={[styles.badge, { backgroundColor: typeConfig.color + '20' }]}>
                      <Text style={styles.badgeEmoji}>{typeConfig.emoji}</Text>
                      <Text style={[styles.badgeText, { color: typeConfig.color }]}>{typeConfig.label}</Text>
                    </View>
                    <Text style={styles.timeAgo}>{getTimeAgo(notice.created_at)}</Text>
                  </View>
                  <Text style={styles.noticeTitle}>{notice.title}</Text>
                  <Text style={styles.noticeBody} numberOfLines={2}>{notice.body}</Text>

                  <View style={styles.cardActions}>
                    <View style={styles.activeRow}>
                      <Text style={styles.activeLabel}>Active</Text>
                      <Switch
                        value={notice.is_active}
                        onValueChange={() => toggleActive(notice)}
                        trackColor={{ true: COLORS.accent }}
                        thumbColor="#fff"
                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                      />
                    </View>
                    <View style={styles.actionBtns}>
                      <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(notice)}>
                        <Text style={styles.editBtnText}>Edit✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteNotice(notice)}>
                        <Text style={styles.deleteBtnText}>Delete🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Add/Edit Modal */}
      <Modal visible={showModal} transparent animationType="slide">
         <ScrollView keyboardShouldPersistTaps="handled" >
         <View style={styles.modal}>

            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{editId ? 'Edit Notice' : 'New Notice'}</Text>

              <Text style={styles.inputLabel}>Notice Type</Text>
              <View style={styles.typeGrid}>
                {TYPE_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.type}
                    style={[
                      styles.typeBtn,
                      form.notice_type === opt.type && { backgroundColor: opt.color, borderColor: opt.color }
                    ]}
                    onPress={() => setForm(f => ({ ...f, notice_type: opt.type }))}
                  >
                    <Text style={styles.typeEmoji}>{opt.emoji}</Text>
                    <Text style={[styles.typeBtnText, form.notice_type === opt.type && { color: '#fff' }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.input}
                value={form.title}
                onChangeText={v => setForm(f => ({ ...f, title: v }))}
                placeholder="Notice title"
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.inputLabel}>Message</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={form.body}
                onChangeText={v => setForm(f => ({ ...f, body: v }))}
                placeholder="Write your notice here..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {form.notice_type === 'emergency' && (
                <View style={styles.emergencyWarning}>
                  <Text style={styles.emergencyWarningText}>
                    🚨 This will appear as an emergency notice for all students in your section.
                  </Text>
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setShowModal(false)}>
                  <Text style={styles.cancelModalText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveModalBtn, form.notice_type === 'emergency' && { backgroundColor: COLORS.secondary }]}
                  onPress={save}
                >
                  <Text style={styles.saveModalText}>{editId ? 'Save' : 'Post Notice'}</Text>
                </TouchableOpacity>
              </View>
            </View>

        </View>
      </ScrollView>
      </Modal>
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
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 14, marginBottom: 12, ...SHADOW.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 3, gap: 4 },
  badgeEmoji: { fontSize: 11 },
  badgeText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  timeAgo: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  noticeTitle: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  noticeBody: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, lineHeight: 18 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activeLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '600' },
  actionBtns: { flexDirection: 'row', gap: 8 },
  editBtn: { backgroundColor: COLORS.bg, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 5 },
  editBtnText: { fontSize:14, color: '#1A1F36', fontWeight: '700' },
  deleteBtn: { padding: 5, backgroundColor: COLORS.bg, borderRadius: RADIUS.full, paddingHorizontal: 12 },
  deleteBtnText: { fontSize: 14 , color: '#1A1F36', fontWeight: '700' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: FONTS.sizes.base, textAlign: 'center' },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  inputLabel: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, marginTop: 14 },
  input: { backgroundColor: COLORS.bg, borderRadius: RADIUS.md, padding: 14, borderWidth: 1, borderColor: COLORS.border, fontSize: FONTS.sizes.base, color: COLORS.textPrimary },
  textarea: { height: 100, textAlignVertical: 'top' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border },
  typeEmoji: { fontSize: 14 },
  typeBtnText: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.textSecondary },
  emergencyWarning: { backgroundColor: COLORS.secondary + '15', borderRadius: RADIUS.md, padding: 12, marginTop: 12 },
  emergencyWarningText: { fontSize: FONTS.sizes.sm, color: COLORS.secondary, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelModalBtn: { flex: 1, padding: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelModalText: { color: COLORS.textSecondary, fontWeight: '700' },
  saveModalBtn: { flex: 1, padding: 14, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveModalText: { color: '#fff', fontWeight: '700' },
});
