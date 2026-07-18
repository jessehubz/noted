"use server";

import { supabase } from "@/lib/supabase/client";

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
  senderId: string,
  notePreview: string,
): Promise<{ thread: DmThread | null; error?: string }> {
  // Check existing.
  const { data: existing } = await supabase
    .from("dm_threads")
    .select("*")
    .eq("note_id", noteId)
    .eq("sender_id", senderId)
    .single();

  if (existing) return { thread: existing as DmThread };

  // Create.
  const { data, error } = await supabase
    .from("dm_threads")
    .insert({
      note_id: noteId,
      sender_id: senderId,
      note_preview: notePreview.slice(0, 100),
    })
    .select()
    .single();

  if (error) return { thread: null, error: error.message };
  return { thread: data as DmThread };
}

export async function getThreads(userId: string): Promise<DmThread[]> {
  const { data } = await supabase
    .from("dm_threads")
    .select("*")
    .eq("sender_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as DmThread[];
}

export async function getMessages(threadId: string): Promise<DmMessage[]> {
  const { data } = await supabase
    .from("dm_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(200);
  return (data ?? []) as DmMessage[];
}

export async function sendMessage(
  threadId: string,
  senderId: string,
  content: string,
): Promise<{ success: boolean; error?: string }> {
  if (!content.trim() || content.length > 1000) {
    return { success: false, error: "Message must be 1–1000 characters." };
  }
  const { error } = await supabase
    .from("dm_messages")
    .insert({ thread_id: threadId, sender_id: senderId, content: content.trim() });
  if (error) return { success: false, error: error.message };
  return { success: true };
}
