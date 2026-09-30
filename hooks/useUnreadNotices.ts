// hooks/useUnreadNotices.ts
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getLastSeenNotice } from '../lib/noticeReadStatus';

export function useUnreadNotices(sectionId: string) {
  const [hasUnread, setHasUnread] = useState(false);

  const checkUnread = useCallback(async () => {
    const lastSeen = await getLastSeenNotice(sectionId);

    let query = supabase
      .from('notices')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .or(`section_id.eq.${sectionId},section_id.is.null`);

    if (lastSeen) {
      query = query.gt('created_at', lastSeen);
    }

    const { count } = await query;
    setHasUnread((count ?? 0) > 0);
  }, [sectionId]);

  useEffect(() => {
    checkUnread();

    // Live-update the dot if a new notice arrives while the app is open,
    // without the student needing to open the Notices tab first.
    const channel = supabase
      .channel('unread-notices-badge')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notices' },
        () => checkUnread()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [checkUnread]);

  return { hasUnread, recheckUnread: checkUnread };
}
