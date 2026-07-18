"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "jdfrancisco5@up.edu.ph").split(",").map((e) => e.trim().toLowerCase());

/** Verify the current user is the admin. Throws if not. */
async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await currentUser();
  const userEmails = user?.emailAddresses?.map((e) => e.emailAddress?.toLowerCase()) ?? [];
  const isAdmin = userEmails.some((email) => email && ADMIN_EMAILS.includes(email));
  if (!isAdmin) throw new Error("Forbidden");

  return userId;
}

// ─── Analytics ───────────────────────────────────────────────────

export interface AdminStats {
  totalNotes: number;
  notesToday: number;
  totalComments: number;
  totalUsers: number;
  flaggedPending: number;
  bannedUsers: number;
  notesLast7Days: { day: string; count: number }[];
}

export async function getAdminStats(): Promise<AdminStats> {
  await requireAdmin();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();

  const [
    { count: totalNotes },
    { count: notesToday },
    { count: totalComments },
    { count: totalUsers },
    { count: flaggedPending },
    { count: bannedUsers },
    { data: dailyData },
  ] = await Promise.all([
    supabaseAdmin.from("notes").select("*", { count: "exact", head: true }).eq("is_deleted", false),
    supabaseAdmin.from("notes").select("*", { count: "exact", head: true }).eq("is_deleted", false).gte("created_at", todayISO),
    supabaseAdmin.from("comments").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("flagged_notes").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabaseAdmin.from("banned_users").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("notes").select("created_at").eq("is_deleted", false).gte("created_at", sevenDaysAgoISO).order("created_at", { ascending: true }),
  ]);

  // Aggregate daily counts
  const dayMap = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayMap.set(d.toISOString().slice(0, 10), 0);
  }
  if (dailyData) {
    for (const row of dailyData) {
      const day = row.created_at.slice(0, 10);
      dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
    }
  }

  return {
    totalNotes: totalNotes ?? 0,
    notesToday: notesToday ?? 0,
    totalComments: totalComments ?? 0,
    totalUsers: totalUsers ?? 0,
    flaggedPending: flaggedPending ?? 0,
    bannedUsers: bannedUsers ?? 0,
    notesLast7Days: Array.from(dayMap, ([day, count]) => ({ day, count })),
  };
}

// ─── Notes Management ────────────────────────────────────────────

export interface AdminNote {
  id: string;
  content: string;
  display_name: string | null;
  latitude: number;
  longitude: number;
  ip_hash: string | null;
  is_deleted: boolean;
  created_at: string;
}

export async function getAdminNotes(page: number = 0, showDeleted: boolean = false): Promise<{ notes: AdminNote[]; total: number }> {
  await requireAdmin();

  const pageSize = 20;
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabaseAdmin
    .from("notes")
    .select("id, content, display_name, latitude, longitude, ip_hash, is_deleted, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (!showDeleted) {
    query = query.eq("is_deleted", false);
  }

  const { data, count } = await query;
  return { notes: (data ?? []) as AdminNote[], total: count ?? 0 };
}

export async function deleteNote(noteId: string): Promise<{ success: boolean; error?: string }> {
  const adminId = await requireAdmin();

  const { error } = await supabaseAdmin
    .from("notes")
    .update({ is_deleted: true })
    .eq("id", noteId);

  if (error) return { success: false, error: error.message };

  // Also mark any pending flag as resolved
  await supabaseAdmin
    .from("flagged_notes")
    .update({ status: "removed", resolved_at: new Date().toISOString() })
    .eq("note_id", noteId)
    .eq("status", "pending");

  return { success: true };
}

export async function restoreNote(noteId: string): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  const { error } = await supabaseAdmin
    .from("notes")
    .update({ is_deleted: false })
    .eq("id", noteId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── Flagging ────────────────────────────────────────────────────

export interface FlaggedNote {
  id: string;
  note_id: string;
  reason: string;
  status: string;
  flagged_by: string | null;
  created_at: string;
  note?: AdminNote;
}

export async function flagNote(noteId: string, reason: string): Promise<{ success: boolean; error?: string }> {
  const adminId = await requireAdmin();

  const { error } = await supabaseAdmin
    .from("flagged_notes")
    .upsert(
      { note_id: noteId, reason, flagged_by: adminId, status: "pending" },
      { onConflict: "note_id,flagged_by" }
    );

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getFlaggedNotes(): Promise<FlaggedNote[]> {
  await requireAdmin();

  const { data: flags } = await supabaseAdmin
    .from("flagged_notes")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(50);

  if (!flags || flags.length === 0) return [];

  // Fetch associated notes
  const noteIds = flags.map((f: { note_id: string }) => f.note_id);
  const { data: notes } = await supabaseAdmin
    .from("notes")
    .select("id, content, display_name, latitude, longitude, ip_hash, is_deleted, created_at")
    .in("id", noteIds);

  const noteMap = new Map((notes ?? []).map((n: AdminNote) => [n.id, n]));

  return flags.map((f: FlaggedNote) => ({
    ...f,
    note: noteMap.get(f.note_id) ?? undefined,
  })) as FlaggedNote[];
}

export async function resolveFlagApprove(noteId: string): Promise<{ success: boolean }> {
  await requireAdmin();

  await supabaseAdmin
    .from("flagged_notes")
    .update({ status: "approved", resolved_at: new Date().toISOString() })
    .eq("note_id", noteId)
    .eq("status", "pending");

  return { success: true };
}

// ─── User / Ban Management ───────────────────────────────────────

export interface BannedUser {
  id: string;
  user_id: string;
  reason: string | null;
  banned_at: string;
}

export async function getBannedUsers(): Promise<BannedUser[]> {
  await requireAdmin();

  const { data } = await supabaseAdmin
    .from("banned_users")
    .select("*")
    .order("banned_at", { ascending: false });

  return (data ?? []) as BannedUser[];
}

export async function banUser(userId: string, reason: string): Promise<{ success: boolean; error?: string }> {
  const adminId = await requireAdmin();

  const { error } = await supabaseAdmin
    .from("banned_users")
    .upsert(
      { user_id: userId, reason, banned_by: adminId },
      { onConflict: "user_id" }
    );

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function unbanUser(userId: string): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  const { error } = await supabaseAdmin
    .from("banned_users")
    .delete()
    .eq("user_id", userId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getRecentCommenters(): Promise<{ user_id: string; comment_count: number }[]> {
  await requireAdmin();

  const { data } = await supabaseAdmin
    .from("comments")
    .select("user_id")
    .order("created_at", { ascending: false })
    .limit(200);

  if (!data) return [];

  // Count per user
  const counts = new Map<string, number>();
  for (const row of data) {
    counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);
  }

  return Array.from(counts, ([user_id, comment_count]) => ({ user_id, comment_count }))
    .sort((a, b) => b.comment_count - a.comment_count)
    .slice(0, 50);
}
