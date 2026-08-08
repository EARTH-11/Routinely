// app/admin/AdminProfileScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { adminLogout } from '../../lib/auth';
import { COLORS, RADIUS, SHADOW, FONTS } from '../../constants/theme';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function AdminProfileScreen() {
  const navigation = useNavigation<Nav>();

  async function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await adminLogout();
          navigation.replace('SectionPicker');
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Profile</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.roleText}>Administrator</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Permissions</Text>
          {[
            '✅ Add / remove batches',
            '✅ Add / remove sections',
            '✅ Manage section reps',
            '✅ Edit all schedules',
            '✅ Post notices to any section',
            '✅ Manage bus schedule',
          ].map(item => (
            <Text key={item} style={styles.permItem}>{item}</Text>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: COLORS.surface, ...SHADOW.sm,
  },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary },
  content: { padding: 20, gap: 16 },
  card: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    padding: 24, alignItems: 'center', ...SHADOW.md,
  },
 
  roleText: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: '#fff' },
  roleDesc: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.8)', marginTop: 8, textAlign: 'center', lineHeight: 18 },
  infoCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 20, ...SHADOW.sm },
  infoLabel: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  permItem: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginBottom: 6 },
  logoutBtn: {
    backgroundColor:'#fff', borderWidth: 1.5, borderColor: '#000302',
    borderRadius: RADIUS.md, padding: 16, alignItems: 'center', marginTop: 8,
  },
  logoutBtnText: { color: COLORS.secondary, fontWeight: '800', fontSize: FONTS.sizes.base },
});
