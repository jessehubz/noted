"use server";

import { headers } from "next/headers";
import { createHash } from "crypto";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase/client";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Note } from "@/lib/types";
import { createNoteSchema } from "@/lib/validation";
import { moderateContent, fuzzyLocation } from "@/lib/moderation";
import { noteRateLimit, checkRateLimit } from "@/lib/rate-limit";

export interface CreateNoteResult {
  success: boolean;
  note?: Note;
  error?: string;
}

export async function createNote(input: unknown): Promise<CreateNoteResult> {
  // Anonymous posting is allowed — get userId if signed in (for optional ownership)
  let userId: string | null = null;
  try {
    const authResult = await auth();
    userId = authResult.userId ?? null;
  } catch {
    // Not signed in — that's fine, anonymous posting
  }

  // Rate limiting based on IP
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = createHash("sha256").update(`${ip}:noted-notes-v1`).digest("hex").slice(0, 32);

  const rateCheck = await checkRateLimit(noteRateLimit, ip);
  if (!rateCheck.allowed) {
    return { success: false, error: "You're posting too fast. Wait a minute and try again." };
  }

  const parsed = createNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid note" };
  }

  const { content, latitude, longitude, spotify_track_id, display_name, fuzzy_location } = parsed.data;

  // Content moderation check.
  const modResult = moderateContent(content);
  if (!modResult.allowed) {
    return { success: false, error: modResult.reason };
  }

  // Apply fuzzy offset if requested.
  let finalLat = latitude;
  let finalLng = longitude;
  if (fuzzy_location) {
    const fuzzy = fuzzyLocation(latitude, longitude);
    finalLat = fuzzy.latitude;
    finalLng = fuzzy.longitude;
  }

  // First try with user_id, fall back without it if column doesn't exist
  const baseData = {
    content,
    latitude: finalLat,
    longitude: finalLng,
    spotify_track_id: spotify_track_id ?? null,
    display_name: display_name ?? null,
    ip_hash: ipHash,
  };

  let data: unknown = null;
  let error: { message: string } | null = null;

  // Try insert with user_id first
  if (userId) {
    const result = await supabaseAdmin
      .from("notes")
      .insert({ ...baseData, user_id: userId })
      .select()
      .single();
    data = result.data;
    error = result.error;
  }

  // If no userId or if user_id column doesn't exist, try without it
  if (!userId || (error && error.message?.includes("user_id"))) {
    const result = await supabaseAdmin
      .from("notes")
      .insert(baseData)
      .select()
      .single();
    data = result.data;
    error = result.error;
  }

  if (error) {
    console.error("Note insert error:", error.message);
    return { success: false, error: "Couldn't post your note. Try again." };
  }

  return { success: true, note: data as Note };
}

/**
 * Allows a user to delete their own note. Soft-deletes by setting is_deleted = true.
 */
export async function deleteOwnNote(noteId: string): Promise<{ success: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "You must be signed in to delete a note." };
  }

  // Verify the note belongs to the current user
  const { data: note } = await supabaseAdmin
    .from("notes")
    .select("id, user_id")
    .eq("id", noteId)
    .single();

  if (!note) {
    return { success: false, error: "Note not found." };
  }

  if (note.user_id !== userId) {
    return { success: false, error: "You can only delete your own notes." };
  }

  const { error } = await supabaseAdmin
    .from("notes")
    .update({ is_deleted: true })
    .eq("id", noteId);

  if (error) {
    return { success: false, error: "Couldn't delete your note. Try again." };
  }

  return { success: true };
}

/**
 * Gets the "featured note of the hour" — the most recent note that has
 * a Spotify track attached (making it richer content). Falls back to
 * the newest note overall if none have Spotify.
 * If an admin has manually set a featured note, that takes priority.
 */
export async function getFeaturedNote(): Promise<Note | null> {
  // Check for admin-forced featured note
  const { data: forced } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "featured_note_id")
    .single();

  if (forced?.value) {
    const { data: forcedNote } = await supabase
      .from("notes")
      .select("*")
      .eq("id", forced.value)
      .eq("is_deleted", false)
      .single();

    if (forcedNote) return forcedNote as Note;
  }

  const oneHourAgo = new Date(Date.now() - 3600_000).toISOString();

  // Try: note with spotify from last hour.
  const { data: featured } = await supabase
    .from("notes")
    .select("*")
    .eq("is_deleted", false)
    .not("spotify_track_id", "is", null)
    .gte("created_at", oneHourAgo)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (featured) return featured as Note;

  // Fallback: newest note overall.
  const { data: latest } = await supabase
    .from("notes")
    .select("*")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return (latest as Note) ?? null;
}
