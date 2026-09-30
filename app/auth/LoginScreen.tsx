// app/auth/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { adminLogin, repLogin } from '../../lib/auth';
import { COLORS, RADIUS, SHADOW, FONTS } from '../../constants/theme';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type LoginMode = 'admin' | 'rep';

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const [mode, setMode] = useState<LoginMode>('rep');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!loginId.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your login ID and password.');
      return;
    }

    setLoading(true);

    if (mode === 'admin') {
      const result = await adminLogin(loginId.trim(), password);
      if (result.success) {
        navigation.replace('AdminTabs');
      } else {
        Alert.alert('Login failed', result.error ?? 'Invalid credentials');
      }
    } else {
      const result = await repLogin(loginId.trim(), password);
      if (result.success && result.session) {
        navigation.replace('RepTabs', { session: result.session });
      } else {
        Alert.alert('Login failed', result.error ?? 'Invalid credentials');
      }
    }

    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>⬅ Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.emoji}></Text>
        <Text style={styles.title}>Login</Text>
        <Text style={styles.subtitle}>Admin and section representatives only</Text>

        {/* Mode Toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'rep' && styles.modeBtnActive]}
            onPress={() => setMode('rep')}
          >
            <Text style={[styles.modeBtnText, mode === 'rep' && styles.modeBtnTextActive]}>
              Section Rep
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'admin' && styles.modeBtnActive]}
            onPress={() => setMode('admin')}
          >
            <Text style={[styles.modeBtnText, mode === 'admin' && styles.modeBtnTextActive]}>
              Admin
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fields */}
        <View style={styles.form}>
          <Text style={styles.label}>
            {mode === 'admin' ? 'Email' : 'Login ID'}
          </Text>
          <TextInput
            style={styles.input}
            value={loginId}
            onChangeText={setLoginId}
            placeholder={mode === 'admin' ? 'admin@school.com' : 'e.g. 28sec1rep'}
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
            keyboardType={mode === 'admin' ? 'email-address' : 'default'}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  backBtn: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 8 },
  backText: { color: COLORS.primary, fontSize: FONTS.sizes.base, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24, alignItems: 'center' },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginTop: 6, marginBottom: 28 },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    padding: 4,
    marginBottom: 28,
    width: '100%',
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: COLORS.surface, ...SHADOW.sm },
  modeBtnText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textMuted },
  modeBtnTextActive: { color: COLORS.primary },
  form: { width: '100%' },
  label: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    fontSize: FONTS.sizes.base,
    color: COLORS.textPrimary,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: 16,
    alignItems: 'center',
    marginTop: 28,
    ...SHADOW.md,
  },
  loginBtnText: { color: '#fff', fontSize: FONTS.sizes.base, fontWeight: '800' },
});
