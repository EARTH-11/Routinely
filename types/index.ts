// types/index.ts

export type UserRole = 'student' | 'rep' | 'admin';

export interface Batch {
  id: string;
  name: string;
  year?: number;
  created_at?: string;
}

export interface Section {
  id: string;
  batch_id: string;
  name: string;
  display_name?: string;
  created_at?: string;
  batch?: Batch;
}

export interface SectionRep {
  id: string;
  section_id: string;
  login_id: string;
  plain_password: string;
  is_active: boolean;
  created_at?: string;
  section?: Section;
}

export interface TimelineItem {
  id: string;
  section_id: string;
  title: string;
  teacher_name?: string;
  teacher_role?: string;
  teacher_detail?: string;
  room?: string;
  start_time: string;
  end_time: string;
  day_of_week?: number | null;
  icon?: string;
  color?: string;
  sort_order?: number;
}

export type ExamType = 'Class Test' | 'Mid Exam' | 'Final Exam';

export interface ExamScheduleItem {
  id: string;
  section_id: string;
  subject: string;
  exam_type: ExamType;
  exam_date: string;
  start_time: string;
  end_time?: string;
  place?: string;
  notes?: string;
}

export type BusDirection = 'To University' | 'From University';

export interface BusScheduleItem {
  id: string;
  route_name: string;
  bus_number?: string;
  stop_name: string;
  departure_time: string;
  arrival_time?: string;
  direction: BusDirection;
  days_active?: string;
  sort_order?: number;
}

export type NoticeType = 'general' | 'emergency' | 'exam' | 'event';

export interface Notice {
  id: string;
  section_id?: string | null;
  title: string;
  body: string;
  notice_type: NoticeType;
  posted_by?: string;
  is_active: boolean;
  created_at: string;
}

export interface Mentor {
  id: string;
  batch_id: string;
  name: string;
  phone: string;
  designation?: string;
  sort_order?: number;
  created_at?: string;
}

export interface StudentSession {
  batch_id: string;
  batch_name: string;
  section_id: string;
  section_name: string;
  display_name: string;
}

export interface RepSession {
  rep_id: string;
  login_id: string;
  section_id: string;
  section_name: string;
  batch_name: string;
}
