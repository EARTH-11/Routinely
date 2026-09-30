// supabase/functions/manage-admin/index.ts
//
// The ONLY code path allowed to create or delete admin accounts.
// Uses the service_role key (set as a function secret, never shipped
// in the app) so it can call the Supabase Auth admin API, and enforces
// every permission rule server-side so the rules can't be bypassed
// by calling the database directly from the client.
//
// Rules:
//  - owner        : can add/remove co-owners and regular admins. Can never be removed.
//  - co_owner     : can add/remove regular admins only. Can never be removed,
//                   except by the owner.
//  - admin        : cannot manage other admins at all.
//  - nobody can remove themselves.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function randomPassword() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json({ ok: true });

  try {
    // ── Identify the caller from their Supabase session token ──────
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace('Bearer ', '').trim();
    if (!jwt) return json({ error: 'Not authenticated' }, 401);

    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData?.user) return json({ error: 'Invalid session' }, 401);
    const callerAuthId = userData.user.id;

    const { data: callerAdmin, error: callerErr } = await admin
      .from('admins')
      .select('*')
      .eq('user_id', callerAuthId)
      .single();

    if (callerErr || !callerAdmin) return json({ error: 'Not an admin' }, 403);

    const { action, ...body } = await req.json();

    // ── LIST ─────────────────────────────────────────────────────
    if (action === 'list') {
      if (!['owner', 'co_owner'].includes(callerAdmin.role)) {
        return json({ error: 'Only the owner or a co-owner can view admin management' }, 403);
      }
      const { data, error } = await admin
        .from('admins')
        .select('id, user_id, email, name, role, created_at')
        .order('created_at', { ascending: true });
      if (error) return json({ error: error.message }, 400);
      return json({ yourRole: callerAdmin.role, admins: data });
    }

    // ── ADD ──────────────────────────────────────────────────────
    if (action === 'add') {
      if (!['owner', 'co_owner'].includes(callerAdmin.role)) {
        return json({ error: 'Only the owner or a co-owner can add admins' }, 403);
      }
      const { email, name } = body;
      let { password } = body;
      const wantRole = body.role === 'co_owner' ? 'co_owner' : 'admin';

      if (!email) return json({ error: 'Email is required' }, 400);
      if (wantRole === 'co_owner' && callerAdmin.role !== 'owner') {
        return json({ error: 'Only the owner can add a co-owner' }, 403);
      }
      if (!password) password = randomPassword();

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createErr || !created?.user) {
        return json({ error: createErr?.message || 'Could not create user' }, 400);
      }

      const { error: insertErr } = await admin.from('admins').insert({
        user_id: created.user.id,
        email,
        name: name || null,
        role: wantRole,
        added_by: callerAdmin.id,
      });
      if (insertErr) {
        // Roll back the auth user so we don't leave an orphaned login
        await admin.auth.admin.deleteUser(created.user.id);
        return json({ error: insertErr.message }, 400);
      }

      return json({ success: true, email, password, role: wantRole });
    }

    // ── REMOVE ───────────────────────────────────────────────────
    if (action === 'remove') {
      if (!['owner', 'co_owner'].includes(callerAdmin.role)) {
        return json({ error: 'Only the owner or a co-owner can remove admins' }, 403);
      }
      const { target_user_id } = body;
      if (!target_user_id) return json({ error: 'target_user_id is required' }, 400);
      if (target_user_id === callerAuthId) {
        return json({ error: "You can't remove your own account" }, 400);
      }

      const { data: target, error: targetErr } = await admin
        .from('admins')
        .select('*')
        .eq('user_id', target_user_id)
        .single();
      if (targetErr || !target) return json({ error: 'Admin not found' }, 404);

      if (target.role === 'owner') {
        return json({ error: 'The owner account can never be removed' }, 403);
      }
      if (target.role === 'co_owner' && callerAdmin.role !== 'owner') {
        return json({ error: 'Only the owner can remove a co-owner' }, 403);
      }

      const { error: delErr } = await admin.auth.admin.deleteUser(target_user_id);
      if (delErr) return json({ error: delErr.message }, 400);
      // The admins row is removed automatically via ON DELETE CASCADE on user_id.

      return json({ success: true });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Server error' }, 500);
  }
});
