// lib/auth.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { StudentSession, RepSession } from '../types';

const STUDENT_SESSION_KEY = 'student_session';
const REP_SESSION_KEY = 'rep_session';

// ─── Student Session ────────────────────────────────────────
export async function saveStudentSession(session: StudentSession) {
  await AsyncStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(session));
}

export async function getStudentSession(): Promise<StudentSession | null> {
  const raw = await AsyncStorage.getItem(STUDENT_SESSION_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}

export async function clearStudentSession() {
  await AsyncStorage.removeItem(STUDENT_SESSION_KEY);
}

// ─── Rep Session ────────────────────────────────────────────
export async function saveRepSession(session: RepSession) {
  await AsyncStorage.setItem(REP_SESSION_KEY, JSON.stringify(session));
}

export async function getRepSession(): Promise<RepSession | null> {
  const raw = await AsyncStorage.getItem(REP_SESSION_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}

export async function clearRepSession() {
  await AsyncStorage.removeItem(REP_SESSION_KEY);
}

// ─── Rep Login ──────────────────────────────────────────────
export async function repLogin(loginId: string, password: string): Promise<{ success: boolean; session?: RepSession; error?: string }> {
  const { data, error } = await supabase
    .from('section_reps')
    .select(`
      id, login_id, section_id, is_active,
      sections (
        id, name, display_name,
        batches ( name )
      )
    `)
    .eq('login_id', loginId)
    .eq('plain_password', password)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return { success: false, error: 'Invalid login ID or password' };
  }

  const section = data.sections as any;
  const batch = section?.batches as any;

  const session: RepSession = {
    rep_id: data.id,
    login_id: data.login_id,
    section_id: data.section_id,
    section_name: section?.name ?? '',
    batch_name: batch?.name ?? '',
  };

  await saveRepSession(session);
  return { success: true, session };
}

// ─── Admin Login ─────────────────────────────────────────────
export async function adminLogin(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function adminLogout() {
  await supabase.auth.signOut();
}

export async function getAdminSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ─── Format helpers ──────────────────────────────────────────
export function formatTime(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}
