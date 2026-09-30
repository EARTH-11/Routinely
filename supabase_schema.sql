-- ============================================================
-- CLASS APP - SUPABASE SCHEMA
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- BATCHES
-- ============================================================
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE, -- e.g. "28th Batch"
  year INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTIONS
-- ============================================================
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g. "Sec-1"
  display_name TEXT, -- e.g. "28th Batch - Sec 1"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(batch_id, name)
);

-- ============================================================
-- SECTION REPS (managed by admin, not Supabase Auth)
-- ============================================================
CREATE TABLE section_reps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  login_id TEXT NOT NULL UNIQUE, -- e.g. "28sec1rep"
  password_hash TEXT NOT NULL, -- store bcrypt hash; plain text shown in admin panel stored separately
  plain_password TEXT NOT NULL, -- admin-visible plain password (internal school use)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TIMELINE ITEMS (class schedule)
-- ============================================================
CREATE TABLE timeline_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL, -- e.g. "Math Class"
  teacher_name TEXT,
  teacher_detail TEXT, -- e.g. "Room 204 | Dept of Mathematics"
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  day_of_week INT, -- 0=Mon, 1=Tue ... 6=Sun, NULL=daily
  icon TEXT DEFAULT 'book',
  color TEXT DEFAULT '#4A90D9',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EXAM SCHEDULE
-- ============================================================
CREATE TABLE exam_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('Class Test', 'Mid Exam', 'Final Exam')),
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  place TEXT, -- e.g. "Exam Hall A", "Room 201"
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BUS SCHEDULE (shared across all sections)
-- ============================================================
CREATE TABLE bus_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_name TEXT NOT NULL, -- e.g. "Route A - City Center"
  bus_number TEXT,
  stop_name TEXT NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME,
  direction TEXT CHECK (direction IN ('To School', 'From School')),
  days_active TEXT DEFAULT 'Mon-Fri',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTICES / EMERGENCY NOTICES
-- ============================================================
CREATE TABLE notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE, -- NULL = all sections
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  notice_type TEXT DEFAULT 'general' CHECK (notice_type IN ('general', 'emergency', 'exam', 'event')),
  posted_by TEXT, -- rep login_id or "admin"
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MENTORS (batch-wise, shown in student Settings)
-- ============================================================
CREATE TABLE mentors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  designation TEXT, -- e.g. "Academic Mentor", optional
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ADMIN ACCOUNTS (stored in Supabase Auth separately)
-- This table just tracks which auth users are admins
-- ============================================================
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Public read access for students (no auth needed)
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Everyone can read public data
CREATE POLICY "Public read batches" ON batches FOR SELECT USING (true);
CREATE POLICY "Public read sections" ON sections FOR SELECT USING (true);
CREATE POLICY "Public read timeline" ON timeline_items FOR SELECT USING (true);
CREATE POLICY "Public read exams" ON exam_schedule FOR SELECT USING (true);
CREATE POLICY "Public read bus" ON bus_schedule FOR SELECT USING (true);
CREATE POLICY "Public read notices" ON notices FOR SELECT USING (is_active = true);
CREATE POLICY "Public read mentors" ON mentors FOR SELECT USING (true);

-- Only authenticated admins can write
CREATE POLICY "Admin full access batches" ON batches FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access sections" ON sections FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access timeline" ON timeline_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access exams" ON exam_schedule FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access bus" ON bus_schedule FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access notices" ON notices FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access mentors" ON mentors FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin read reps" ON section_reps FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin read admins" ON admins FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- SAMPLE DATA
-- ============================================================
INSERT INTO batches (name, year) VALUES ('28th Batch', 2024), ('29th Batch', 2025);

-- Sections will be added by admin via the app
