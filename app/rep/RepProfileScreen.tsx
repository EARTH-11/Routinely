// app/rep/RepProfileScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { clearRepSession } from '../../lib/auth';
import { COLORS, RADIUS, SHADOW, FONTS } from '../../constants/theme';
import { RepSession } from '../../types';
import { RootStackParamList } from '../../App';

interface Props { session: RepSession; }
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function RepProfileScreen({ session }: Props) {
  const navigation = useNavigation<Nav>();

  async function handleLogout() {
    Alert.alert('Logout', 'Log out of rep account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await clearRepSession();
          navigation.replace('SectionPicker');
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rep Profile</Text>
      </View>

      <View style={styles.content}>
        {/* Identity card */}
        <View style={styles.idCard}>
          <Text style={styles.avatarEmoji}>🎓</Text>
          <Text style={styles.loginId}>{session.login_id}</Text>
          <Text style={styles.sectionDisplay}>{session.batch_name} · {session.section_name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Section Representative</Text>
          </View>
        </View>

        {/* Permissions */}
        <View style={styles.permCard}>
          <Text style={styles.permLabel}>Your Permissions</Text>
          {[
            '✅ Manage class timeline',
            '✅ Add / edit exam schedule',
            '✅ Post notices to your section',
            '✅ Post emergency notices',
            '❌ Cannot manage other sections',
            '❌ Cannot manage bus schedule',
            '🩵 We respect you for doing This',
          ].map(p => (
            <Text key={p} style={styles.permItem}>{p}</Text>
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
  idCard: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    padding: 24, alignItems: 'center', ...SHADOW.md,
  },
  avatarEmoji: { fontSize: 48, marginBottom: 8 },
  loginId: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: '#fff' },
  sectionDisplay: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  roleBadge: {
    marginTop: 12, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 5,
  },
  roleBadgeText: { color: '#fff', fontSize: FONTS.sizes.xs, fontWeight: '700' },
  permCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 20, ...SHADOW.sm },
  permLabel: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  permItem: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginBottom: 6 },
  logoutBtn: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#000302',
    borderRadius: RADIUS.md, padding: 16, alignItems: 'center', marginTop: 4,
  },
  logoutBtnText: { color: COLORS.secondary, fontWeight: '800', fontSize: FONTS.sizes.base },
});
