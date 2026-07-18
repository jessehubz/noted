"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { supabase } from "@/lib/supabase/client";
import { commentRateLimit, checkRateLimit } from "@/lib/rate-limit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface Comment {
  id: string;
  note_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: { display_name: string | null } | null;
}

export async function getComments(noteId: string): Promise<Comment[]> {
  if (!UUID_RE.test(noteId)) return [];

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
  _userId: string, // DEPRECATED param — kept for call-site compat, ignored
  content: string,
): Promise<{ success: boolean; error?: string }> {
  // Server-side auth check via Clerk
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "You must be signed in to comment." };
  }

  // Rate limiting per user
  const rateCheck = await checkRateLimit(commentRateLimit, userId);
  if (!rateCheck.allowed) {
    return { success: false, error: "You're commenting too fast. Wait a moment." };
  }

  if (!UUID_RE.test(noteId)) {
    return { success: false, error: "Invalid note." };
  }

  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 500) {
    return { success: false, error: "Comment must be 1-500 characters." };
  }

  // Use admin client to bypass RLS (auth verified above via Clerk)
  const { error } = await supabaseAdmin
    .from("comments")
    .insert({ note_id: noteId, user_id: userId, content: trimmed });

  if (error) return { success: false, error: "Couldn't post comment. Try again." };
  return { success: true };
}
