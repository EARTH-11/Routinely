// constants/noticeTypes.ts
// Single source of truth for how each notice_type is labeled, colored and
// emoji'd. Admin (posting), Rep (posting), and Student (viewing) screens all
// import from here so a relabel in one place shows up everywhere — this file
// exists because those three screens used to each keep their own separate
// hardcoded copy, which silently drifted out of sync.

import { COLORS } from './theme';
import { NoticeType } from '../types';

export interface NoticeTypeConfig {
  type: NoticeType;
  emoji: string;
  label: string;
  color: string;
}

export const NOTICE_TYPES: NoticeTypeConfig[] = [
  { type: 'general', emoji: '📢', label: 'All Section', color: COLORS.primary },
  { type: 'emergency', emoji: '🚨', label: 'From University', color: COLORS.secondary },
  { type: 'exam', emoji: '📝', label: 'From Club', color: COLORS.warning },
  { type: 'event', emoji: '🎉', label: 'Event', color: COLORS.accent },
];

export const NOTICE_TYPE_MAP: Record<NoticeType, NoticeTypeConfig> = NOTICE_TYPES.reduce(
  (acc, t) => {
    acc[t.type] = t;
    return acc;
  },
  {} as Record<NoticeType, NoticeTypeConfig>
);
