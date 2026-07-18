"use client";

import { supabase } from "@/lib/supabase/client";
import type { BBox } from "@/lib/geo";
import { splitBboxLongitude } from "@/lib/geo";
import type { Note } from "@/lib/types";

/**
 * Fetches notes within a viewport bounding box directly from Supabase.
 * Runs client-side since notes are public (RLS allows anon select) and this
 * avoids an extra round trip through our own server for a simple read.
 * Handles the antimeridian-wrap case by querying up to two longitude ranges.
 */
export async function fetchNotesInBounds(bbox: BBox, since?: string | null): Promise<Note[]> {
  const ranges = splitBboxLongitude(bbox);
  const south = Math.max(-90, Math.min(bbox.south, bbox.north));
  const north = Math.min(90, Math.max(bbox.south, bbox.north));

  const results = await Promise.all(
    ranges.map(async ({ west, east }) => {
      let query = supabase
        .from("notes")
        .select("*")
        .gte("latitude", south)
        .lte("latitude", north)
        .gte("longitude", west)
        .lte("longitude", east);

      if (since) {
        query = query.gte("created_at", since);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) {
        console.error("Failed to fetch notes:", error.message);
        return [];
      }
      return (data ?? []) as Note[];
    }),
  );

  const seen = new Set<string>();
  const merged: Note[] = [];
  for (const note of results.flat()) {
    if (seen.has(note.id)) continue;
    seen.add(note.id);
    merged.push(note);
  }
  return merged;
}
