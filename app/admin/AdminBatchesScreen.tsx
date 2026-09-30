// app/admin/AdminBatchesScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { COLORS, RADIUS, SHADOW, FONTS } from '../../constants/theme';
import { Batch, Section } from '../../types';

export default function AdminBatchesScreen() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sections, setSections] = useState<Record<string, Section[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [showAddSection, setShowAddSection] = useState<string | null>(null);
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchYear, setNewBatchYear] = useState('');
  const [newSectionName, setNewSectionName] = useState('');

  const fetchAll = useCallback(async () => {
    const { data: batchData } = await supabase.from('batches').select('*').order('year', { ascending: false });
    setBatches(batchData ?? []);

    const { data: sectionData } = await supabase.from('sections').select('*').order('name');
    const grouped: Record<string, Section[]> = {};
    (sectionData ?? []).forEach(s => {
      if (!grouped[s.batch_id]) grouped[s.batch_id] = [];
      grouped[s.batch_id].push(s);
    });
    setSections(grouped);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function addBatch() {
    if (!newBatchName.trim()) return;
    const { error } = await supabase.from('batches').insert({
      name: newBatchName.trim(),
      year: newBatchYear ? parseInt(newBatchYear) : null,
    });
    if (error) { Alert.alert('Error', error.message); return; }
    setNewBatchName('');
    setNewBatchYear('');
    setShowAddBatch(false);
    fetchAll();
  }

  async function deleteBatch(batch: Batch) {
    Alert.alert('Delete Batch', `Delete "${batch.name}" and ALL its sections, schedules and notices?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('batches').delete().eq('id', batch.id);
          fetchAll();
        },
      },
    ]);
  }

  async function addSection(batchId: string) {
    if (!newSectionName.trim()) return;
    const batch = batches.find(b => b.id === batchId);
    const { error } = await supabase.from('sections').insert({
      batch_id: batchId,
      name: newSectionName.trim(),
      display_name: `${batch?.name} - ${newSectionName.trim()}`,
    });
    if (error) { Alert.alert('Error', error.message); return; }
    setNewSectionName('');
    setShowAddSection(null);
    fetchAll();
  }

  async function deleteSection(section: Section) {
    Alert.alert('Delete Section', `Delete "${section.name}"? This removes all its schedules and data.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('sections').delete().eq('id', section.id);
          fetchAll();
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Batches & Sections</Text>
          <Text style={styles.headerSub}>{batches.length} batches</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddBatch(true)}>
          <Text style={styles.addBtnText}>+ Batch</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {batches.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📚</Text>
              <Text style={styles.emptyText}>No batches yet. Add your first batch.</Text>
            </View>
          ) : (
            batches.map(batch => (
              <View key={batch.id} style={styles.batchCard}>
                <TouchableOpacity
                  style={styles.batchHeader}
                  onPress={() => setExpandedBatch(expandedBatch === batch.id ? null : batch.id)}
                >
                  <View>
                    <Text style={styles.batchName}>{batch.name}</Text>
                    {batch.year && <Text style={styles.batchYear}>{batch.year}</Text>}
                  </View>
                  <View style={styles.batchActions}>
                    <Text style={styles.sectionCount}>
                      {(sections[batch.id] ?? []).length} sections
                    </Text>
                    <Text style={styles.chevron}>{expandedBatch === batch.id ? '▲' : '▼'}</Text>
                    <TouchableOpacity onPress={() => deleteBatch(batch)} style={styles.deleteBtn}>
                      <Text style={styles.deleteBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>

                {expandedBatch === batch.id && (
                  <View style={styles.sectionList}>
                    {(sections[batch.id] ?? []).map(section => (
                      <View key={section.id} style={styles.sectionRow}>
                        <Text style={styles.sectionName}>{section.name}</Text>
                        <TouchableOpacity onPress={() => deleteSection(section)}>
                          <Text style={styles.sectionDelete}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}

                    {showAddSection === batch.id ? (
                      <View style={styles.addSectionRow}>
                        <TextInput
                          style={styles.smallInput}
                          value={newSectionName}
                          onChangeText={setNewSectionName}
                          placeholder="e.g. Sec-1"
                          placeholderTextColor={COLORS.textMuted}
                          autoFocus
                        />
                        <TouchableOpacity style={styles.confirmBtn} onPress={() => addSection(batch.id)}>
                          <Text style={styles.confirmBtnText}>Add</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowAddSection(null)}>
                          <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.addSectionBtn}
                        onPress={() => setShowAddSection(batch.id)}
                      >
                        <Text style={styles.addSectionBtnText}>+ Add Section</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Add Batch Modal */}
      <Modal visible={showAddBatch} transparent animationType="slide">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios'?'padding' : 'height'} >
           
        
          
          <View style={styles.modalCard}>
             <ScrollView keyboardShouldPersistTaps="handled" >
            <Text style={styles.modalTitle}>New Batch</Text>
            <Text style={styles.inputLabel}>Batch Name</Text>
            <TextInput
              style={styles.input}
              value={newBatchName}
              onChangeText={setNewBatchName}
              placeholder="e.g. 28th Batch"
              placeholderTextColor={COLORS.textMuted}
              autoFocus
            />
            <Text style={styles.inputLabel}>Year (optional)</Text>
            <TextInput
              style={styles.input}
              value={newBatchYear}
              onChangeText={setNewBatchYear}
              placeholder="e.g. 2025"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setShowAddBatch(false)}>
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveModalBtn} onPress={addBatch}>
                <Text style={styles.saveModalText}>Add Batch</Text>
              </TouchableOpacity>
            </View>
            </ScrollView>
          </View>  
        
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
    justifyContent: 'space-between', alignItems: 'flex-end',
    ...SHADOW.sm,
  },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary },
  headerSub: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginTop: 2 },
  addBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.sm },
  scroll: { padding: 16, paddingBottom: 40 },
  batchCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, marginBottom: 12, overflow: 'hidden', ...SHADOW.sm },
  batchHeader: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  batchName: { fontSize: FONTS.sizes.base, fontWeight: '800', color: COLORS.textPrimary },
  batchYear: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  batchActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionCount: { fontSize: FONTS.sizes.xs, color: COLORS.primary, fontWeight: '600' },
  chevron: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  deleteBtn: { padding: 4 },
  deleteBtnText: { color: COLORS.secondary, fontWeight: '700', fontSize: FONTS.sizes.sm },
  sectionList: { borderTopWidth: 1, borderTopColor: COLORS.border, padding: 12 },
  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.bg, borderRadius: RADIUS.md, padding: 10, marginBottom: 6,
  },
  sectionName: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary },
  sectionDelete: { color: COLORS.secondary, fontWeight: '700' },
  addSectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  smallInput: {
    flex: 1, backgroundColor: COLORS.bg, borderRadius: RADIUS.md, padding: 8,
    borderWidth: 1, borderColor: COLORS.border, fontSize: FONTS.sizes.sm, color: COLORS.textPrimary,
  },
  confirmBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: 8, paddingHorizontal: 12 },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.sm },
  cancelText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  addSectionBtn: {
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: RADIUS.md, borderStyle: 'dashed',
    padding: 10, alignItems: 'center', marginTop: 4,
  },
  addSectionBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: FONTS.sizes.sm },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: FONTS.sizes.base, textAlign: 'center' },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 20 },
  inputLabel: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: COLORS.bg, borderRadius: RADIUS.md, padding: 14,
    borderWidth: 1, borderColor: COLORS.border, fontSize: FONTS.sizes.base, color: COLORS.textPrimary,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelModalBtn: { flex: 1, padding: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelModalText: { color: COLORS.textSecondary, fontWeight: '700' },
  saveModalBtn: { flex: 1, padding: 14, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveModalText: { color: '#fff', fontWeight: '700' },
});
