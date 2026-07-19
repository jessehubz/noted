"use server";

import { headers } from "next/headers";
import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const REPORT_REASONS = [
  "spam",
  "harassment",
  "hate_speech",
  "violence",
  "personal_info",
  "inappropriate",
  "other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

/**
 * Allows any user to report a note. Uses IP hash as the reporter identifier
 * so duplicate reports from the same person are deduplicated.
 * No account required — anyone viewing the map can report.
 */
export async function reportNote(
  noteId: string,
  reason: ReportReason,
  details?: string,
): Promise<{ success: boolean; error?: string }> {
  // Validate noteId
  if (!UUID_RE.test(noteId)) {
    return { success: false, error: "Invalid note." };
  }

  // Validate reason
  if (!REPORT_REASONS.includes(reason)) {
    return { success: false, error: "Invalid report reason." };
  }

  // Get reporter identifier from IP
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const reporterHash = createHash("sha256").update(`${ip}:noted-report-v1`).digest("hex").slice(0, 32);

  // Build the reason string (include details if provided)
  const fullReason = details?.trim()
    ? `[${reason}] ${details.trim().slice(0, 200)}`
    : `[${reason}]`;

  // Check the note exists and is not already deleted
  const { data: note } = await supabaseAdmin
    .from("notes")
    .select("id")
    .eq("id", noteId)
    .eq("is_deleted", false)
    .single();

  if (!note) {
    return { success: false, error: "Note not found." };
  }

  // Upsert into flagged_notes — deduplicates by note_id + reporter
  const { error } = await supabaseAdmin
    .from("flagged_notes")
    .upsert(
      {
        note_id: noteId,
        reason: fullReason,
        flagged_by: reporterHash,
        status: "pending",
      },
      { onConflict: "note_id,flagged_by" }
    );

  if (error) {
    return { success: false, error: "Couldn't submit your report. Try again." };
  }

  return { success: true };
}
