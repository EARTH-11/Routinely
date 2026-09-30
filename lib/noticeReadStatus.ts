// lib/noticeReadStatus.ts
//
// There's no server-side "read" tracking for notices — this just remembers,
// per device and per section, the created_at of the most recent notice the
// student has actually opened the Notices tab to see. Used to decide whether
// to show the small red "unread" dot on the tab bar icon.

import AsyncStorage from '@react-native-async-storage/async-storage';

function storageKey(sectionId: string) {
  return `notices_last_seen_${sectionId}`;
}

export async function getLastSeenNotice(sectionId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(storageKey(sectionId));
  } catch {
    return null;
  }
}

export async function setLastSeenNotice(sectionId: string, createdAt: string): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(sectionId), createdAt);
  } catch {
    // Non-fatal — worst case the dot just doesn't clear until the next successful write.
  }
}

export async function getLastSeenExam(sectionId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(`exams_last_seen_${sectionId}`);
  } catch {
    return null;
  }
}

export async function setLastSeenExam(sectionId: string, createdAt: string): Promise<void> {
  try {
    await AsyncStorage.setItem(`exams_last_seen_${sectionId}`, createdAt);
  } catch {}
}