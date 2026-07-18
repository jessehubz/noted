"use server";

import { supabase } from "@/lib/supabase/client";
import { headers } from "next/headers";
import { createHash } from "crypto";

function hashVoter(ip: string, noteId: string): string {
  return createHash("sha256").update(`${ip}:${noteId}:noted-salt-v1`).digest("hex").slice(0, 32);
}

export async function vote(
  noteId: string,
  value: 1 | -1,
): Promise<{ success: boolean; error?: string }> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
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
