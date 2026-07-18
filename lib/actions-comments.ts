"use server";

import { supabase } from "@/lib/supabase/client";

export interface Comment {
  id: string;
  note_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: { display_name: string | null } | null;
}

export async function getComments(noteId: string): Promise<Comment[]> {
  const { data } = await supabase
    .from("comments")
    .select("*, profiles(display_name)")
    .eq("note_id", noteId)
    .order("created_at", { ascending: true })
    .limit(100);
  return (data ?? []) as Comment[];
}

export async function createComment(
  noteId: string,
  userId: string,
  content: string,
): Promise<{ success: boolean; error?: string }> {
  if (!content.trim() || content.length > 500) {
    return { success: false, error: "Comment must be 1–500 characters." };
  }
  const { error } = await supabase
    .from("comments")
    .insert({ note_id: noteId, user_id: userId, content: content.trim() });
  if (error) return { success: false, error: error.message };
  return { success: true };
}
