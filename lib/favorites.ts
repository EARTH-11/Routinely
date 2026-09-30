// lib/favorites.ts
// Student's favorite bus routes, stored locally on-device (per student, not synced to Supabase).
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'favorite_bus_routes';

export async function getFavoriteRouteIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function toggleFavoriteRoute(routeId: string): Promise<string[]> {
  const current = await getFavoriteRouteIds();
  const next = current.includes(routeId)
    ? current.filter(id => id !== routeId)
    : [...current, routeId];
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
