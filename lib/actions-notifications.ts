"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export interface Notification {
  id: string;
  user_id: string;
  note_id: string;
  comment_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Get unread notification count for the current user.
 */
export async function getUnreadCount(): Promise<number> {
  const { userId } = await auth();
  if (!userId) return 0;

  const { count } = await supabaseAdmin
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  return count ?? 0;
}

/**
 * Get recent notifications for the current user.
 */
export async function getNotifications(): Promise<Notification[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const { data } = await supabaseAdmin
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  return (data ?? []) as Notification[];
}

/**
 * Mark all notifications as read.
 */
export async function markAllRead(): Promise<void> {
  const { userId } = await auth();
  if (!userId) return;

  await supabaseAdmin
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
}

/**
 * Create a notification when someone replies to a note.
 * Called from createComment action.
 */
export async function notifyNoteOwner(noteId: string, commenterName: string): Promise<void> {
  // Find the note owner
  const { data: note } = await supabaseAdmin
    .from("notes")
    .select("user_id, content")
    .eq("id", noteId)
    .single();

  if (!note?.user_id) return; // Anonymous note or no owner — skip

  // Don't notify yourself
  const { userId } = await auth();
  if (userId === note.user_id) return;

  const preview = note.content.slice(0, 40) + (note.content.length > 40 ? "…" : "");

  await supabaseAdmin
    .from("notifications")
    .insert({
      user_id: note.user_id,
      note_id: noteId,
      message: `${commenterName || "Someone"} replied to your note: "${preview}"`,
      is_read: false,
    });
}
