
import { useCallback, useEffect, useRef, useState } from 'react';
import { saveCache, loadCache } from '../lib/offlineCache';

export function useOfflineData<T>(
  cacheKey: string,
  fetchFn: () => Promise<{ data: T | null; error: any }>,
  deps: any[]
) {
  // Which key the current `data`/`loading` state actually belongs to.
  // Used to guard against ever showing one key's data under a different key.
  const [dataKey, setDataKey] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [lastSynced, setLastSynced] = useState<number | null>(null);

  // Always points at the cacheKey the most recent load()/effect run is for,
  // so a slow/late response for a stale key can't overwrite newer data.
  const activeKeyRef = useRef(cacheKey);

  const load = useCallback(async (isRefresh: boolean, keyForThisLoad: string) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data: fresh, error } = await fetchFn();
      if (error) throw error;
      if (activeKeyRef.current !== keyForThisLoad) return; // a newer key has since taken over
      setData(fresh);
      setDataKey(keyForThisLoad);
      setIsOffline(false);
      setLastSynced(Date.now());
      saveCache(keyForThisLoad, fresh);
    } catch {
      if (activeKeyRef.current !== keyForThisLoad) return;
      // Network failed. Only touch the screen if we don't already have this
      // key's data showing (the synchronous cache-read on switch handles that).
      setIsOffline(true);
      if (dataKey !== keyForThisLoad) {
        const cached = await loadCache<T>(keyForThisLoad);
        if (activeKeyRef.current !== keyForThisLoad) return;
        if (cached) {
          setData(cached.data);
          setDataKey(keyForThisLoad);
          setLastSynced(cached.cachedAt);
        } else {
          setData(null);
          setDataKey(keyForThisLoad);
          setLastSynced(null);
        }
      }
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
    setLoading(true);

    // Always re-read this key's cache immediately - fast (local disk), and
    // guarantees every switch shows the RIGHT data instantly, not just the
    // first time this key was ever visited this session.
    (async () => {
      const cached = await loadCache<T>(cacheKey);
      if (cancelled || activeKeyRef.current !== cacheKey) return;
      if (cached) {
        setData(cached.data);
        setDataKey(cacheKey);
        setLastSynced(cached.cachedAt);
        setLoading(false);
      } else {
        // Nothing cached yet for this key - don't show a stale previous
        // key's data while we wait on the network below.
        setData(null);
        setDataKey(cacheKey);
      }
      load(false, cacheKey);
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, ...deps]);

  return {
    // Never expose data that doesn't belong to the currently active key.
    data: dataKey === cacheKey ? data : null,
    loading,
    refreshing,
    isOffline,
    lastSynced,
    refresh: () => load(true, cacheKey),
  };
}