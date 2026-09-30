// app/admin/AdminManageScreen.tsx
import React, { useCallback, useEffect, useState,} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
  Modal, TextInput, ActivityIndicator, Switch, RefreshControl,
  KeyboardAvoidingView, Platform,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOW, FONTS } from '../../constants/theme';
import { listAdmins, addAdmin, removeAdmin, AdminRow, AdminRole } from '../../lib/adminManagement';

const ROLE_LABEL: Record<AdminRole, string> = {
  owner: 'Host',
  co_owner: 'Dept. Head',
  admin: 'Admin',
};

const ROLE_COLOR: Record<AdminRole, string> = {
  owner: COLORS.warning,
  co_owner: COLORS.purple,
  admin: COLORS.primary,
};

function randomPassword() {
  return Math.random().toString(36).slice(-4) + Math.random().toString(36).slice(-4).toUpperCase() + '!' + Math.floor(Math.random() * 90 + 10);
}

export default function AdminManageScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [yourRole, setYourRole] = useState<AdminRole | null>(null);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [forbidden, setForbidden] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [makeCoOwner, setMakeCoOwner] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setForbidden(false);
      const res = await listAdmins();
      setYourRole(res.yourRole);
      setAdmins(res.admins);
    } catch (e: any) {
      if (String(e.message).toLowerCase().includes('owner or a co-owner')) {
        setForbidden(true);
      } else {
        Alert.alert('Error', e.message || 'Could not load admins');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAddModal() {
    setEmail('');
    setName('');
    setPassword(randomPassword());
    setMakeCoOwner(false);
    setModalVisible(true);
  }

  async function handleAdd() {
    if (!email.trim()) {
      Alert.alert('Missing info', 'Please enter an email address.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await addAdmin({
        email: email.trim(),
        password: password.trim(),
        name: name.trim(),
        role: makeCoOwner ? 'co_owner' : 'admin',
      });
      setModalVisible(false);
      Alert.alert(
        'Admin added',
        `Share these login details with them:\n\nEmail: ${res.email}\nPassword: ${res.password}`
      );
      load();
    } catch (e: any) {
      Alert.alert('Could not add admin', e.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleRemove(row: AdminRow) {
    Alert.alert(
      'Remove admin',
      `Remove ${row.name || row.email} (${ROLE_LABEL[row.role]})? They will be logged out immediately and lose access.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeAdmin(row.user_id);
              load();
            } catch (e: any) {
              Alert.alert('Could not remove admin', e.message);
            }
          },
        },
      ]
    );
  }

  // Can the logged-in user remove this particular row?
  function canRemove(row: AdminRow): boolean {
    if (!yourRole) return false;
    if (row.role === 'owner') return false;
    if (row.role === 'co_owner') return yourRole === 'owner';
    return yourRole === 'owner' || yourRole === 'co_owner';
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (forbidden) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Admins</Text>
        </View>
        <View style={styles.centered}>
          <MaterialIcons name="lock-outline" size={40} color={COLORS.textMuted} />
          <Text style={styles.forbiddenText}>
            Only the owner/co-owner can manage admin accounts.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admins</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <MaterialIcons name="person-add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add Admin</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={admins}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <View style={styles.rowTop}>
                <View style={[styles.badge, { backgroundColor: ROLE_COLOR[item.role] }]}>
                  <Text style={styles.badgeText}>{ROLE_LABEL[item.role]}</Text>
                </View>
              </View>
              <Text style={styles.cardEmail}>{item.email}</Text>
            </View>
            {canRemove(item) && (
              <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item)}>
                <MaterialIcons name="delete-outline" size={22} color={COLORS.warning} />
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No admins found.</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
         <ScrollView keyboardShouldPersistTaps="handled" >
           <View style={styles.modalCard}>
             <Text style={styles.modalTitle}>Add New Admin</Text>

             <Text style={styles.fieldLabel}>Email</Text>
             <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="name@hamdarduniversity.edu.bd"
            />

             <Text style={styles.fieldLabel}>Name (optional)</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Full name" />

              <Text style={styles.fieldLabel}>Password</Text>
             <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity style={styles.genBtn} onPress={() => setPassword(randomPassword())}>
                <MaterialIcons name="refresh" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {yourRole === 'owner' && (
              <View style={styles.coOwnerRow}>
                <Text style={styles.fieldLabel}>Make this a Co-Owner</Text>
                <Switch value={makeCoOwner} onValueChange={setMakeCoOwner} />
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAdd} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Add Admin</Text>}
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  forbiddenText: { color: COLORS.textMuted, textAlign: 'center', fontSize: FONTS.sizes.base },
  header: {
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: COLORS.surface, ...SHADOW.sm,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.md,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.sm },
  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16,
    flexDirection: 'row', alignItems: 'center', ...SHADOW.sm,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardName: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.textPrimary },
  cardEmail: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full },
  badgeText: { color: '#fff', fontSize: FONTS.sizes.xs, fontWeight: '800' },
  removeBtn: { padding: 8 },
  emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: 24 },
  modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 16 },
  fieldLabel: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textMuted, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: FONTS.sizes.base,
    marginBottom: 14, color: COLORS.textPrimary,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  genBtn: { padding: 10, borderRadius: RADIUS.md, backgroundColor: COLORS.primaryLight },
  coOwnerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center' },
  cancelBtnText: { color: COLORS.textSecondary, fontWeight: '700' },
  confirmBtn: { flex: 1, padding: 14, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: '800' },
});
