import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { supabase } from '../lib/supabase';
import { getLastSeenExam, setLastSeenExam } from '../lib/noticeReadStatus';

export function useUnreadExams(sectionId: string) {
  const [hasUnread, setHasUnread] = useState(false);

  const checkUnread = useCallback(async () => {
    const lastSeen = await getLastSeenExam(sectionId);
    let query = supabase
      .from('exam_schedule')
      .select('id', { count: 'exact', head: true })
      .eq('section_id', sectionId);
    if (lastSeen) query = query.gt('created_at', lastSeen);
    const { count } = await query;
    setHasUnread((count ?? 0) > 0);
  }, [sectionId]);

  // Called when the Exams tab is opened: save newest exam time, then re-check.
  const markSeen = useCallback(async () => {
    const { data } = await supabase
      .from('exam_schedule')
      .select('created_at')
      .eq('section_id', sectionId)
      .order('created_at', { ascending: false })
      .limit(1);
    const latest = data?.[0]?.created_at;
    if (latest) await setLastSeenExam(sectionId, latest);
    await checkUnread();
  }, [sectionId, checkUnread]);

  useEffect(() => {
    checkUnread();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') checkUnread();
    });
    return () => sub.remove();
  }, [checkUnread]);

  return { hasUnread, markSeen };
}