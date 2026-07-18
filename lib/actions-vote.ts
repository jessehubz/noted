"use server";

import { supabase } from "@/lib/supabase/client";
import { headers } from "next/headers";
import { createHash } from "crypto";
import { voteRateLimit, checkRateLimit } from "@/lib/rate-limit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function hashVoter(ip: string, noteId: string): string {
  return createHash("sha256").update(`${ip}:${noteId}:noted-salt-v1`).digest("hex").slice(0, 32);
}

export async function vote(
  noteId: string,
  value: 1 | -1,
): Promise<{ success: boolean; error?: string }> {
  // Validate noteId format
  if (!UUID_RE.test(noteId)) {
    return { success: false, error: "Invalid note." };
  }

  // Validate vote value
  if (value !== 1 && value !== -1) {
    return { success: false, error: "Invalid vote value." };
  }

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // Rate limiting
  const rateCheck = await checkRateLimit(voteRateLimit, ip);
  if (!rateCheck.allowed) {
    return { success: false, error: "Too many votes. Slow down." };
  }

  const voterHash = hashVoter(ip, noteId);

  const { error } = await supabase
    .from("votes")
    .upsert(
      { note_id: noteId, value, voter_hash: voterHash },
      { onConflict: "note_id,voter_hash" },
    );

  if (error) {
    return { success: false, error: "Couldn't register your vote." };
  }
  return { success: true };
}
