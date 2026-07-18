"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { dmRateLimit, checkRateLimit } from "@/lib/rate-limit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface DmThread {
  id: string;
  note_id: string;
  sender_id: string;
  note_preview: string | null;
  created_at: string;
}

export interface DmMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

/** Get or create a DM thread for a note. */
export async function getOrCreateThread(
  noteId: string,
  _senderId: string, // DEPRECATED — ignored, determined server-side
  notePreview: string,
): Promise<{ thread: DmThread | null; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { thread: null, error: "Sign in required." };
  if (!UUID_RE.test(noteId)) return { thread: null, error: "Invalid note." };

  // Check existing.
  const { data: existing } = await supabaseAdmin
    .from("dm_threads")
    .select("*")
    .eq("note_id", noteId)
    .eq("sender_id", userId)
    .single();

  if (existing) return { thread: existing as DmThread };

  // Create.
  const { data, error } = await supabaseAdmin
    .from("dm_threads")
    .insert({
      note_id: noteId,
      sender_id: userId,
      note_preview: (notePreview || "").slice(0, 100),
    })
    .select()
    .single();

  if (error) return { thread: null, error: "Couldn't create conversation." };
  return { thread: data as DmThread };
}

export async function getThreads(
  _userId: string, // DEPRECATED — ignored
): Promise<DmThread[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const { data } = await supabaseAdmin
    .from("dm_threads")
    .select("*")
    .eq("sender_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as DmThread[];
}

export async function getMessages(threadId: string): Promise<DmMessage[]> {
  const { userId } = await auth();
  if (!userId) return [];
  if (!UUID_RE.test(threadId)) return [];

  // Verify the user owns this thread before returning messages
  const { data: thread } = await supabaseAdmin
    .from("dm_threads")
    .select("sender_id")
    .eq("id", threadId)
    .single();

  if (!thread || thread.sender_id !== userId) return [];

  const { data } = await supabaseAdmin
    .from("dm_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(200);
  return (data ?? []) as DmMessage[];
}

export async function sendMessage(
  threadId: string,
  _senderId: string, // DEPRECATED — ignored
  content: string,
): Promise<{ success: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Sign in required." };
  if (!UUID_RE.test(threadId)) return { success: false, error: "Invalid thread." };

  // Rate limiting per user
  const rateCheck = await checkRateLimit(dmRateLimit, userId);
  if (!rateCheck.allowed) {
    return { success: false, error: "You're sending messages too fast. Wait a moment." };
  }

  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 1000) {
    return { success: false, error: "Message must be 1-1000 characters." };
  }

  // Verify the user owns this thread
  const { data: thread } = await supabaseAdmin
    .from("dm_threads")
    .select("sender_id")
    .eq("id", threadId)
    .single();

  if (!thread || thread.sender_id !== userId) {
    return { success: false, error: "Access denied." };
  }

  const { error } = await supabaseAdmin
    .from("dm_messages")
    .insert({ thread_id: threadId, sender_id: userId, content: trimmed });

  if (error) return { success: false, error: "Couldn't send message." };
  return { success: true };
}
