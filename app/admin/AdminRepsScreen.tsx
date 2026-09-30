// app/admin/AdminRepsScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { COLORS, RADIUS, SHADOW, FONTS } from '../../constants/theme';
import { SectionRep, Section, Batch } from '../../types';

interface RepWithSection extends SectionRep {
  section_name: string;
  batch_name: string;
}

export default function AdminRepsScreen() {
  const [reps, setReps] = useState<RepWithSection[]>([]);
  const [sections, setSections] = useState<(Section & { batch?: Batch })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newLoginId, setNewLoginId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [showPasswords, setShowPasswords] = useState(false);

  const fetchAll = useCallback(async () => {
    const [{ data: repData }, { data: sectionData }] = await Promise.all([
      supabase.from('section_reps').select(`
        *, sections ( name, display_name, batches ( name ) )
      `).order('created_at', { ascending: false }),
      supabase.from('sections').select(`*, batches(*)`).order('name'),
    ]);

    const mapped = (repData ?? []).map((r: any) => ({
      ...r,
      section_name: r.sections?.display_name ?? r.sections?.name ?? '—',
      batch_name: r.sections?.batches?.name ?? '—',
    }));
    setReps(mapped);
    setSections(sectionData ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function addRep() {
    if (!newLoginId.trim() || !newPassword.trim() || !selectedSection) {
      Alert.alert('Missing fields', 'Please fill all fields and select a section.');
      return;
    }
    const { error } = await supabase.from('section_reps').insert({
      section_id: selectedSection,
      login_id: newLoginId.trim(),
      plain_password: newPassword.trim(),
      password_hash: newPassword.trim(), // In production use bcrypt
      is_active: true,
    });
    if (error) {
      Alert.alert('Error', error.message.includes('unique') ? 'Login ID already taken.' : error.message);
      return;
    }
    setNewLoginId('');
    setNewPassword('');
    setSelectedSection('');
    setShowAdd(false);
    fetchAll();
  }

  async function kickRep(rep: RepWithSection) {
    Alert.alert('Kick Rep', `Remove "${rep.login_id}" from ${rep.section_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Kick',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('section_reps').update({ is_active: false }).eq('id', rep.id);
          fetchAll();
        },
      },
    ]);
  }

  async function reinstateRep(rep: RepWithSection) {
    await supabase.from('section_reps').update({ is_active: true }).eq('id', rep.id);
    fetchAll();
  }

  async function deleteRep(rep: RepWithSection) {
    Alert.alert('Delete Rep', `Permanently delete rep "${rep.login_id}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('section_reps').delete().eq('id', rep.id);
          fetchAll();
        },
      },
    ]);
  }

  const activeReps = reps.filter(r => r.is_active);
  const kickedReps = reps.filter(r => !r.is_active);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Section Reps</Text>
          <Text style={styles.headerSub}>{activeReps.length} active reps</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconBtn, showPasswords && { backgroundColor: COLORS.warning + '30' }]}
            onPress={() => setShowPasswords(!showPasswords)}
          >
            <Text style={styles.iconBtnText}>{showPasswords ? 'Hide' : 'Password'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Password visibility notice */}
          {showPasswords && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningText}> Passwords visible — keep this screen private</Text>
            </View>
          )}

          {activeReps.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No reps added yet</Text>
            </View>
          ) : (
            activeReps.map(rep => (
              <View key={rep.id} style={styles.repCard}>
                <View style={styles.repInfo}>
                  <View style={[styles.activeDot, { backgroundColor: COLORS.accent }]} />
                  <View style={styles.repDetails}>
                    <Text style={styles.sectionLabel}>{rep.section_name}</Text>
                    <Text style={styles.loginId}>Login ID : {rep.login_id}</Text>
                    {showPasswords && (
                      <Text style={styles.passwordText}>Password : {rep.plain_password}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.repActions}>
                  <TouchableOpacity style={styles.kickBtn} onPress={() => kickRep(rep)}>
                    <Text style={styles.kickBtnText}>Kick</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          {kickedReps.length > 0 && (
            <>
              <Text style={styles.sectionHeader}>Kicked Reps</Text>
              {kickedReps.map(rep => (
                <View key={rep.id} style={[styles.repCard, { opacity: 0.9 }]}>
                  <View style={styles.repInfo}>
                    <View style={[styles.activeDot, { backgroundColor: COLORS.secondary }]} />
                    <View style={styles.repDetails}>
                      <Text style={styles.loginId}>{rep.login_id}</Text>
                      <Text style={styles.sectionLabel}>{rep.section_name}</Text>
                    </View>
                  </View>
                  <View style={styles.repActions}>
                    <TouchableOpacity style={styles.reinstateBtn} onPress={() => reinstateRep(rep)}>
                      <Text style={styles.reinstateBtnText}>Reinstate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteRepBtn} onPress={() => deleteRep(rep)}>
                      <Text style={styles.deleteRepBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}

      {/* Add Rep Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        
        <KeyboardAvoidingView
          style={styles.modal}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView keyboardShouldPersistTaps="handled" >
         
          
          <View style={styles.modalCard}>
             
            <Text style={styles.modalTitle}>Add Section Rep</Text>

            <Text style={styles.inputLabel}>Scroll Sections</Text>
            <ScrollView style={styles.sectionPicker} showsVerticalScrollIndicator={false}>
              {sections.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.sectionPickerRow, selectedSection === s.id && styles.sectionPickerRowActive]}
                  onPress={() => setSelectedSection(s.id)}
                >
                  <Text style={[styles.sectionPickerText, selectedSection === s.id && { color: COLORS.primary, fontWeight: '700' }]}>
                    {s.display_name ?? `${(s as any).batches?.name} - ${s.name}`}
                  </Text>
                  {selectedSection === s.id && <Text>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Login ID</Text>
            <TextInput
              style={styles.input}
              value={newLoginId}
              onChangeText={setNewLoginId}
              placeholder="e.g. 28sec2rep"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Set a password"
              placeholderTextColor={COLORS.textMuted}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setShowAdd(false)}>
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveModalBtn} onPress={addRep}>
                <Text style={styles.saveModalText}>Add Rep</Text>
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
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: COLORS.surface, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'flex-end', ...SHADOW.sm,
  },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary },
  headerSub: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  iconBtn: { padding: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#000302' },
  iconBtnText: { fontSize: 16 , color: '#1A1F36', fontWeight: '700'},
  addBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.sm },
  scroll: { padding: 16, paddingBottom: 40 },
  warningBanner: { backgroundColor: '#fadce7', borderRadius: RADIUS.md, padding: 14, marginBottom: 12 },
  warningText: { fontSize: FONTS.sizes.sm, color: '#92400e', fontWeight: '600' },
  repCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...SHADOW.sm,
  },
  repInfo: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, gap: 10 },
  activeDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  repDetails: { flex: 1 },
  loginId: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.textPrimary },
  sectionLabel: { fontSize: FONTS.sizes.xs, color: '#8f837d', marginTop: 2 },
  passwordText: { fontSize: FONTS.sizes.sm, color: COLORS.warning, fontWeight: '600', marginTop: 4 },
  repActions: { flexDirection: 'row', gap: 8 },
  kickBtn: { backgroundColor: COLORS.secondary + '15', borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 5,borderColor:'#000302', borderWidth: 1 },
  kickBtnText: { color: '#f70404', fontWeight: '700', fontSize: 14 },
  reinstateBtn: { backgroundColor: COLORS.accent + '20', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 5,borderColor:'#000302', borderWidth: 1 },
  reinstateBtnText: { color: '#089e4c', fontWeight: '700', fontSize: FONTS.sizes.xs },
  deleteRepBtn: { padding: 4,borderColor:'#000302', borderWidth: 1, borderRadius: RADIUS.full },
  deleteRepBtnText: { color: '#f70404', fontWeight: '700', fontSize: 14 },
  sectionHeader: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: '#181717', marginTop: 16, marginBottom: 8 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: FONTS.sizes.base },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '85%' },
  modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 16 },
  inputLabel: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, marginTop: 12 },
  sectionPicker: { maxHeight: 140, backgroundColor: COLORS.bg, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: 4 },
  sectionPickerRow: { padding: 12, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sectionPickerRowActive: { backgroundColor: COLORS.primaryLight },
  sectionPickerText: { fontSize: FONTS.sizes.sm, color: COLORS.textPrimary },
  input: { backgroundColor: COLORS.bg, borderRadius: RADIUS.md, padding: 14, borderWidth: 1, borderColor: COLORS.border, fontSize: FONTS.sizes.base, color: COLORS.textPrimary },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelModalBtn: { flex: 1, padding: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelModalText: { color: COLORS.textSecondary, fontWeight: '700' },
  saveModalBtn: { flex: 1, padding: 14, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveModalText: { color: '#fff', fontWeight: '700' },
});
