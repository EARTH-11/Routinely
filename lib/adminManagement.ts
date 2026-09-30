// lib/adminManagement.ts
import { supabase } from './supabase';

export type AdminRole = 'owner' | 'co_owner' | 'admin';

export interface AdminRow {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  role: AdminRole;
  created_at: string;
}

async function callManageAdmin(payload: Record<string, any>) {
  const { data, error } = await supabase.functions.invoke('manage-admin', {
    body: payload,
  });
  if (error) {
    // supabase-js only puts a generic "non-2xx status code" in error.message;
    // the actual { error: "..." } body the function sent is on error.context (a Response).
    let detail = error.message || 'Request failed';
    const ctx = (error as any)?.context;
    if (ctx && typeof ctx.json === 'function') {
      try {
        const body = await ctx.json();
        if (body?.error) detail = body.error;
      } catch {
        // response body wasn't JSON or already consumed — fall back to generic message
      }
    }
    throw new Error(detail);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function listAdmins(): Promise<{ yourRole: AdminRole; admins: AdminRow[] }> {
  return callManageAdmin({ action: 'list' });
}

export async function addAdmin(params: {
  email: string;
  password?: string;
  name?: string;
  role?: 'admin' | 'co_owner';
}): Promise<{ success: true; email: string; password: string; role: AdminRole }> {
  return callManageAdmin({ action: 'add', ...params });
}

export async function removeAdmin(targetUserId: string): Promise<{ success: true }> {
  return callManageAdmin({ action: 'remove', target_user_id: targetUserId });
}
