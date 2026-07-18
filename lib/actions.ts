"use server";

import { headers } from "next/headers";
import { createHash } from "crypto";
import { supabase } from "@/lib/supabase/client";
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

  const { data, error } = await supabase
    .from("notes")
    .insert({
      content,
      latitude: finalLat,
      longitude: finalLng,
      spotify_track_id: spotify_track_id ?? null,
      display_name: display_name ?? null,
      ip_hash: ipHash,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: "Couldn't post your note. Try again." };
  }

  return { success: true, note: data as Note };
}

/**
 * Gets the "featured note of the hour" — the most recent note that has
 * a Spotify track attached (making it richer content). Falls back to
 * the newest note overall if none have Spotify.
 */
export async function getFeaturedNote(): Promise<Note | null> {
  const oneHourAgo = new Date(Date.now() - 3600_000).toISOString();

  // Try: note with spotify from last hour.
  const { data: featured } = await supabase
    .from("notes")
    .select("*")
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
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return (latest as Note) ?? null;
}
