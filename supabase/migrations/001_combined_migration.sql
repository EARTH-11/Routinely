-- ============================================================
-- COMBINED MIGRATION — run this once in the Supabase SQL editor
-- Part 1: mentors table
-- Part 2: admin roles + self-service admin management
-- ============================================================

-- ============================================================
-- PART 1 — MENTORS
-- ============================================================

CREATE TABLE IF NOT EXISTS mentors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  designation TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read mentors" ON mentors;
CREATE POLICY "Public read mentors" ON mentors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full access mentors" ON mentors;
CREATE POLICY "Admin full access mentors" ON mentors FOR ALL USING (auth.role() = 'authenticated');


-- ============================================================
-- PART 2 — ADMIN ROLES & SELF-SERVICE ADMIN MANAGEMENT
-- ============================================================

-- 1. Link each admins row to its real Supabase Auth user, and add a role
ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin'
    CHECK (role IN ('owner', 'co_owner', 'admin')),
  ADD COLUMN IF NOT EXISTS added_by UUID REFERENCES admins(id) ON DELETE SET NULL;

-- 2. Backfill user_id for any admins you already created manually,
--    by matching their email to an existing auth.users row.
UPDATE admins a
SET user_id = u.id
FROM auth.users u
WHERE a.user_id IS NULL AND a.email = u.email;

-- 3. Only one row can ever be role = 'owner'
CREATE UNIQUE INDEX IF NOT EXISTS one_owner_only
  ON admins ((role = 'owner'))
  WHERE role = 'owner';

-- 4. Lock down the admins table so only the manage-admin Edge Function
--    (service_role key, never shipped in the app) can insert/delete rows.
--    Everyone authenticated can still read it.
DROP POLICY IF EXISTS "Admin read admins" ON admins;
CREATE POLICY "Admin read admins" ON admins
  FOR SELECT USING (auth.role() = 'authenticated');
-- No INSERT / UPDATE / DELETE policy is created on purpose — with RLS
-- enabled and no matching policy, those actions are denied for the
-- anon/authenticated roles and only work via service_role.


-- ============================================================
-- LAST MANUAL STEP — after this runs, verify then set yourself as owner:
--
--   SELECT email, user_id, role FROM admins;   -- check every row has a user_id
--
--   UPDATE admins SET role = 'owner' WHERE email = 'your-email@example.com';
-- ============================================================
