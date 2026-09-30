// lib/offlineCache.ts
// Generic helpers for caching Supabase query results to AsyncStorage
// so student screens can fall back to the last-known data when offline.
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_VERSION = 1;
const PREFIX = `cache:${CACHE_VERSION}:`;

interface CacheEnvelope<T> {
  data: T;
  cachedAt: number; // ms since epoch
}

export async function saveCache<T>(key: string, data: T): Promise<void> {
  try {
    const envelope: CacheEnvelope<T> = { data, cachedAt: Date.now() };
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(envelope));
  } catch {
    // Best-effort cache; ignore write failures (e.g. storage full).
  }
}

export async function loadCache<T>(key: string): Promise<CacheEnvelope<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEnvelope<T>;
  } catch {
    return null;
  }
}

export function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
