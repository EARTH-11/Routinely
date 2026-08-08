// hooks/useOfflineData.ts
// Cache-first data hook for student screens:
// - Shows cached data instantly on mount/key-change (if any) so the UI isn't blank or stale.
// - Always tries the network in the background.
// - On success: updates the UI + refreshes the cache.
// - On failure (offline / network error): keeps showing the cached data and flags `isOffline`.
import { useCallback, useEffect, useRef, useState } from 'react';
import { saveCache, loadCache } from '../lib/offlineCache';

export function useOfflineData<T>(
  cacheKey: string,
  fetchFn: () => Promise<{ data: T | null; error: any }>,
  deps: any[]
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [lastSynced, setLastSynced] = useState<number | null>(null);

  // Track which cache keys we've already hydrated-from, so every new key
  // (e.g. switching days/filters) gets its own instant cache-first paint.
  const hydratedKeys = useRef<Set<string>>(new Set());
  // Always points at the cacheKey the in-flight load() call was started for,
  // so a slow/late response for a stale key can't overwrite newer data.
  const activeKeyRef = useRef(cacheKey);

  const load = useCallback(async (isRefresh: boolean, keyForThisLoad: string) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data: fresh, error } = await fetchFn();
      if (error) throw error;
      if (activeKeyRef.current !== keyForThisLoad) return; // a newer key has since taken over
      setData(fresh);
      setIsOffline(false);
      setLastSynced(Date.now());
      saveCache(keyForThisLoad, fresh);
    } catch {
      if (activeKeyRef.current !== keyForThisLoad) return;
      // Network failed — fall back to whatever is cached for this exact key.
      const cached = await loadCache<T>(keyForThisLoad);
      if (cached) {
        setData(cached.data);
        setLastSynced(cached.cachedAt);
      } else {
        setData(null);
        setLastSynced(null);
      }
      setIsOffline(true);
    } finally {
      if (activeKeyRef.current === keyForThisLoad) {
        setLoading(false);
        setRefreshing(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    let cancelled = false;
    activeKeyRef.current = cacheKey;

    (async () => {
      const alreadyHydrated = hydratedKeys.current.has(cacheKey);

      if (!alreadyHydrated) {
        // New key we haven't shown yet this session — reset first so we never
        // show the previous key's (e.g. previous day's) data while loading.
        setData(null);
        setLoading(true);

        const cached = await loadCache<T>(cacheKey);
        if (cancelled || activeKeyRef.current !== cacheKey) return;
        if (cached) {
          setData(cached.data);
          setLastSynced(cached.cachedAt);
          setLoading(false);
        }
        hydratedKeys.current.add(cacheKey);
      }

      load(false, cacheKey);
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, ...deps]);

  return {
    data,
    loading,
    refreshing,
    isOffline,
    lastSynced,
    refresh: () => load(true, cacheKey),
  };
}