// app/admin/AdminDashboard.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Modal, TextInput, Alert, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOW, FONTS } from '../../constants/theme';
import { Batch, Mentor, NoticeType } from '../../types';
import { NOTICE_TYPES as NOTICE_TYPE_OPTIONS } from '../../constants/noticeTypes';
import { addAdmin } from '../../lib/adminManagement';

interface Stats {
  batches: number;
  sections: number;
  reps: number;
  notices: number;
  mentors: number;
}

const EMPTY_NOTICE_FORM = { title: '', body: '', notice_type: 'general' as NoticeType };
const EMPTY_MENTOR_FORM = { name: '', phone: '', designation: '' };
const EMPTY_ADMIN_FORM = { email: '', name: '', password: '' };

function randomPassword() {
  return Math.random().toString(36).slice(-4) + Math.random().toString(36).slice(-4).toUpperCase() + '!' + Math.floor(Math.random() * 90 + 10);
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ batches: 0, sections: 0, reps: 0, notices: 0, mentors: 0 });
  const [loading, setLoading] = useState(true);
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  // Universal notice
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeForm, setNoticeForm] = useState(EMPTY_NOTICE_FORM);
  const [posting, setPosting] = useState(false);

  // Mentors
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [showAddMentorFor, setShowAddMentorFor] = useState<string | null>(null);
  const [mentorForm, setMentorForm] = useState(EMPTY_MENTOR_FORM);
  const [editMentorId, setEditMentorId] = useState<string | null>(null);

  // Add Admin
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState(EMPTY_ADMIN_FORM);
  const [makeCoOwner, setMakeCoOwner] = useState(false);
  const [addingAdmin, setAddingAdmin] = useState(false);

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    const [b, s, r, n, rn, m] = await Promise.all([
      supabase.from('batches').select('id', { count: 'exact', head: true }),
      supabase.from('sections').select('id', { count: 'exact', head: true }),
      supabase.from('section_reps').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('notices').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('notices').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(5),
      supabase.from('mentors').select('id', { count: 'exact', head: true }),
    ]);
    setStats({
      batches: b.count ?? 0,
      sections: s.count ?? 0,
      reps: r.count ?? 0,
      notices: n.count ?? 0,
      mentors: m.count ?? 0,
    });
    setRecentNotices(rn.data ?? []);
    setLoading(false);
  }

  const fetchBatches = useCallback(async () => {
    const { data } = await supabase.from('batches').select('*').order('year', { ascending: false });
    setBatches(data ?? []);
  }, []);

  const fetchMentors = useCallback(async () => {
    const { data } = await supabase.from('mentors').select('*').order('sort_order').order('name');
    setMentors(data ?? []);
  }, []);

  // ---------- Universal notice ----------
  function openNoticeModal() {
    setNoticeForm(EMPTY_NOTICE_FORM);
    setShowNoticeModal(true);
  }

  async function postUniversalNotice() {
    if (!noticeForm.title.trim() || !noticeForm.body.trim()) {
      Alert.alert('Missing fields', 'Title and message are required.');
      return;
    }
    setPosting(true);
    const { error } = await supabase.from('notices').insert({
      ...noticeForm,
      section_id: null, // NULL = all batches / sections
      posted_by: 'admin',
      is_active: true,
    });
    setPosting(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setShowNoticeModal(false);
    fetchStats();
  }

  // ---------- Mentors ----------
  function openMentorModal() {
    fetchBatches();
    fetchMentors();
    setShowMentorModal(true);
  }

  function openAddMentor(batchId: string) {
    setMentorForm(EMPTY_MENTOR_FORM);
    setEditMentorId(null);
    setShowAddMentorFor(batchId);
    setExpandedBatch(batchId);
  }

  function openEditMentor(mentor: Mentor) {
    setMentorForm({ name: mentor.name, phone: mentor.phone, designation: mentor.designation ?? '' });
    setEditMentorId(mentor.id);
    setShowAddMentorFor(mentor.batch_id);
    setExpandedBatch(mentor.batch_id);
  }

  async function saveMentor(batchId: string) {
    if (!mentorForm.name.trim() || !mentorForm.phone.trim()) {
      Alert.alert('Missing fields', 'Mentor name and phone number are required.');
      return;
    }
    const payload = {
      batch_id: batchId,
      name: mentorForm.name.trim(),
      phone: mentorForm.phone.trim(),
      designation: mentorForm.designation.trim() || null,
    };
    const { error } = editMentorId
      ? await supabase.from('mentors').update(payload).eq('id', editMentorId)
      : await supabase.from('mentors').insert(payload);
    if (error) { Alert.alert('Error', error.message); return; }
    setMentorForm(EMPTY_MENTOR_FORM);
    setEditMentorId(null);
    setShowAddMentorFor(null);
    fetchMentors();
    fetchStats();
  }

  async function deleteMentor(mentor: Mentor) {
    Alert.alert('Remove Mentor', `Remove "${mentor.name}" from this batch?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          await supabase.from('mentors').delete().eq('id', mentor.id);
          fetchMentors();
          fetchStats();
        },
      },
    ]);
  }

  async function deleteNotice(notice: any) {
    Alert.alert('Delete Notice', `Delete "${notice.title}"? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('notices').delete().eq('id', notice.id);
          if (error) { Alert.alert('Error', error.message); return; }
          fetchStats();
        },
      },
    ]);
  }

  // ---------- Add Admin ----------
  function openAdminModal() {
    setAdminForm({ ...EMPTY_ADMIN_FORM, password: randomPassword() });
    setMakeCoOwner(false);
    setShowAdminModal(true);
  }

  async function handleAddAdmin() {
    if (!adminForm.email.trim()) {
      Alert.alert('Missing info', 'Please enter an email address.');
      return;
    }
    setAddingAdmin(true);
    try {
      const res = await addAdmin({
        email: adminForm.email.trim(),
        password: adminForm.password.trim(),
        name: adminForm.name.trim(),
        role: makeCoOwner ? 'co_owner' : 'admin',
      });
      setShowAdminModal(false);
      Alert.alert(
        'Admin added',
        `Share these login details with them:\n\nEmail: ${res.email}\nPassword: ${res.password}`
      );
    } catch (e: any) {
      Alert.alert('Could not add admin', e.message);
    } finally {
      setAddingAdmin(false);
    }
  }

  const STAT_CARDS = [
    { label: 'Batches', value: stats.batches, icon:'auto-stories', color: COLORS.primary },
    { label: 'Sections', value: stats.sections, icon:'sell', color: COLORS.accent },
    { label: 'Active CR', value: stats.reps, icon:'groups', color: COLORS.purple },
    { label: 'Notices posted', value: stats.notices, icon:'campaign', color: COLORS.warning },
    { label: 'Mentors', value: stats.mentors, icon:'diversity-3', color: COLORS.accent },
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
           <Text style={styles.sectionTitle}>Post Notice</Text>
          {/* Quick actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionCard, { borderColor: COLORS.warning }]} onPress={openNoticeModal}>
              <MaterialIcons name="campaign" size={22} color={COLORS.warning} />
              <Text style={styles.actionText}>Post University{'\n'}Notice</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionCard, { borderColor: COLORS.accent }]} onPress={openMentorModal}>
              <MaterialIcons name="diversity-3" size={22} color={COLORS.accent} />
              <Text style={styles.actionText}>Manage{'\n'}Mentors</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionCard, { borderColor: COLORS.primary }]} onPress={openAdminModal}>
              <MaterialIcons name="person-add" size={22} color={COLORS.primary} />
              <Text style={styles.actionText}>Add New{'\n'}Admin</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionTitle}>Overall Summary</Text>
          {/* Stats grid */}
          <View style={styles.statsGrid}>
            {STAT_CARDS.map(card => (
              <View key={card.label} style={[styles.statCard, { borderTopColor: card.color, borderTopWidth: 0}]}>
                <MaterialIcons name={card.icon as any} size={28} color={card.color}/>
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
                {!n.section_id && (
                  <View style={styles.universalBadge}>
                    <Text style={styles.universalBadgeText}>UNIVERSITY</Text>
                  </View>
                )}
                <TouchableOpacity onPress={() => deleteNotice(n)} style={{ padding: 4 }}>
                  <MaterialIcons name="delete-outline" size={18} color={COLORS.secondary} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* ---------- University Notice Modal ---------- */}
      <Modal visible={showNoticeModal} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>University Notice</Text>
              <Text style={styles.modalHint}>This will be visible to every batch and section.</Text>

              <Text style={styles.inputLabel}>Notice Type</Text>
              <View style={styles.typeGrid}>
                {NOTICE_TYPE_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.type}
                    style={[
                      styles.typeBtn,
                      noticeForm.notice_type === opt.type && { backgroundColor: opt.color, borderColor: opt.color }
                    ]}
                    onPress={() => setNoticeForm(f => ({ ...f, notice_type: opt.type }))}
                  >
                    <Text style={styles.typeEmoji}>{opt.emoji}</Text>
                    <Text style={[styles.typeBtnText, noticeForm.notice_type === opt.type && { color: '#fff' }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Title </Text>
              <TextInput
                style={styles.input}
                value={noticeForm.title}
                onChangeText={v => setNoticeForm(f => ({ ...f, title: v }))}
                placeholder="Notice title"
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.inputLabel}>Message </Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={noticeForm.body}
                onChangeText={v => setNoticeForm(f => ({ ...f, body: v }))}
                placeholder="Write your notice here..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {noticeForm.notice_type === 'emergency' && (
                <View style={styles.emergencyWarning}>
                  <Text style={styles.emergencyWarningText}>
                    🚨 This will appear as an emergency notice for every batch and section.
                  </Text>
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setShowNoticeModal(false)}>
                  <Text style={styles.cancelModalText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveModalBtn, posting && { opacity: 0.6 }]}
                  onPress={postUniversalNotice}
                  disabled={posting}
                >
                  <Text style={styles.saveModalText}>{posting ? 'Posting…' : 'Post to All'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ---------- Manage Mentors Modal ---------- */}
      <Modal visible={showMentorModal} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.mentorModalCard}>
            <View style={styles.mentorModalHeader}>
              <Text style={styles.modalTitle}>Mentors by Batch</Text>
              <TouchableOpacity onPress={() => { setShowMentorModal(false); setShowAddMentorFor(null); }}>
                <MaterialIcons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" style={{ flexGrow: 0 }}>
              {batches.length === 0 ? (
                <Text style={styles.empty}>No batches yet. Add a batch first.</Text>
              ) : (
                batches.map(batch => {
                  const batchMentors = mentors.filter(m => m.batch_id === batch.id);
                  const expanded = expandedBatch === batch.id;
                  return (
                    <View key={batch.id} style={styles.batchCard}>
                      <TouchableOpacity
                        style={styles.batchHeader}
                        onPress={() => setExpandedBatch(expanded ? null : batch.id)}
                      >
                        <Text style={styles.batchName}>{batch.name}</Text>
                        <View style={styles.batchActions}>
                          <Text style={styles.mentorCount}>{batchMentors.length} mentor{batchMentors.length !== 1 ? 's' : ''}</Text>
                          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
                        </View>
                      </TouchableOpacity>

                      {expanded && (
                        <View style={styles.mentorList}>
                          {batchMentors.map(mentor => (
                            <View key={mentor.id} style={styles.mentorRow}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.mentorName}>{mentor.name}</Text>
                                <Text style={styles.mentorPhone}>{mentor.phone}</Text>
                                {!!mentor.designation && <Text style={styles.mentorDesignation}>{mentor.designation}</Text>}
                              </View>
                              <TouchableOpacity onPress={() => openEditMentor(mentor)} style={{ padding: 6 }}>
                                <MaterialIcons name="edit" size={18} color={COLORS.textMuted} />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => deleteMentor(mentor)} style={{ padding: 6 }}>
                                <MaterialIcons name="delete-outline" size={18} color={COLORS.secondary} />
                              </TouchableOpacity>
                            </View>
                          ))}

                          {showAddMentorFor === batch.id ? (
                            <View style={styles.addMentorForm}>
                              <TextInput
                                style={styles.smallInput}
                                value={mentorForm.name}
                                onChangeText={v => setMentorForm(f => ({ ...f, name: v }))}
                                placeholder="Mentor name"
                                placeholderTextColor={COLORS.textMuted}
                                autoFocus
                              />
                              <TextInput
                                style={styles.smallInput}
                                value={mentorForm.phone}
                                onChangeText={v => setMentorForm(f => ({ ...f, phone: v }))}
                                placeholder="Phone number"
                                placeholderTextColor={COLORS.textMuted}
                                keyboardType="phone-pad"
                              />
                              <TextInput
                                style={styles.smallInput}
                                value={mentorForm.designation}
                                onChangeText={v => setMentorForm(f => ({ ...f, designation: v }))}
                                placeholder="Designation (optional)"
                                placeholderTextColor={COLORS.textMuted}
                              />
                              <View style={styles.addMentorActions}>
                                <TouchableOpacity
                                  onPress={() => { setShowAddMentorFor(null); setMentorForm(EMPTY_MENTOR_FORM); setEditMentorId(null); }}
                                >
                                  <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.confirmBtn} onPress={() => saveMentor(batch.id)}>
                                  <Text style={styles.confirmBtnText}>{editMentorId ? 'Save' : 'Add'}</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          ) : (
                            <TouchableOpacity style={styles.addMentorBtn} onPress={() => openAddMentor(batch.id)}>
                              <Text style={styles.addMentorBtnText}>+ Add Mentor</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ---------- Add Admin Modal ---------- */}
      <Modal visible={showAdminModal} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Add New Admin</Text>

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={adminForm.email}
                onChangeText={v => setAdminForm(f => ({ ...f, email: v }))}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="name@school.edu"
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.inputLabel}>Name (optional)</Text>
              <TextInput
                style={styles.input}
                value={adminForm.name}
                onChangeText={v => setAdminForm(f => ({ ...f, name: v }))}
                placeholder="Full name"
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={adminForm.password}
                  onChangeText={v => setAdminForm(f => ({ ...f, password: v }))}
                />
                <TouchableOpacity
                  style={styles.genBtn}
                  onPress={() => setAdminForm(f => ({ ...f, password: randomPassword() }))}
                >
                  <MaterialIcons name="refresh" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.coOwnerRow}>
                <Text style={styles.inputLabel0}>Make this a Co-Owner</Text>
                <Switch value={makeCoOwner} onValueChange={setMakeCoOwner} />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setShowAdminModal(false)}>
                  <Text style={styles.cancelModalText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveModalBtn, addingAdmin && { opacity: 0.6 }]}
                  onPress={handleAddAdmin}
                  disabled={addingAdmin}
                >
                  <Text style={styles.saveModalText}>{addingAdmin ? 'Adding…' : 'Add Admin'}</Text>
                </TouchableOpacity>
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
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: COLORS.surface,
    ...SHADOW.sm,
  },
  greeting: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginTop: 4 },
  scroll: { padding: 20, paddingBottom: 40 },

  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  actionCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1.5,
    padding: 14, alignItems: 'center', gap: 6, ...SHADOW.sm,
  },
  actionText: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },

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
  universalBadge: {
    backgroundColor: COLORS.accent + '25', borderRadius: RADIUS.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  universalBadgeText: { fontSize: FONTS.sizes.xs, fontWeight: '800', color: COLORS.accent },

  // Modals (shared look with other admin screens)
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  modalHint: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: 8 },
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
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  genBtn: { padding: 12, borderRadius: RADIUS.md, backgroundColor: COLORS.primaryLight },
  coOwnerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 },
  inputLabel0: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textSecondary },
  cancelModalBtn: { flex: 1, padding: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelModalText: { color: COLORS.textSecondary, fontWeight: '700' },
  saveModalBtn: { flex: 1, padding: 14, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveModalText: { color: '#fff', fontWeight: '700' },

  // Mentor manager
  mentorModalCard: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 30, maxHeight: '85%' },
  mentorModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  batchCard: { backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, marginBottom: 10, overflow: 'hidden' },
  batchHeader: { padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  batchName: { fontSize: FONTS.sizes.base, fontWeight: '800', color: COLORS.textPrimary },
  batchActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mentorCount: { fontSize: FONTS.sizes.xs, color: COLORS.primary, fontWeight: '600' },
  chevron: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  mentorList: { borderTopWidth: 1, borderTopColor: COLORS.border, padding: 12 },
  mentorRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md, padding: 10, marginBottom: 8, ...SHADOW.sm,
  },
  mentorName: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textPrimary },
  mentorPhone: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  mentorDesignation: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  addMentorForm: { gap: 8, marginTop: 4 },
  smallInput: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 10,
    borderWidth: 1, borderColor: COLORS.border, fontSize: FONTS.sizes.sm, color: COLORS.textPrimary,
  },
  addMentorActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 4 },
  confirmBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 8, paddingHorizontal: 16 },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.sm },
  cancelText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  addMentorBtn: {
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: RADIUS.md, borderStyle: 'dashed',
    padding: 10, alignItems: 'center', marginTop: 4,
  },
  addMentorBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: FONTS.sizes.sm },
});
