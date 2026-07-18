import { z } from "zod";

export const MAX_NOTE_LENGTH = 300;

/** A Spotify track ID is a 22-character base62 string, but we accept a
 * slightly wider range since format has evolved over time. */
const spotifyTrackIdSchema = z
  .string()
  .regex(/^[A-Za-z0-9]{10,30}$/, "Invalid Spotify track ID");

export const createNoteSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Note can't be empty")
    .max(MAX_NOTE_LENGTH, `Note can't exceed ${MAX_NOTE_LENGTH} characters`),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  spotify_track_id: spotifyTrackIdSchema.nullable().optional(),
  display_name: z
    .string()
    .trim()
    .max(40, "Name can't exceed 40 characters")
    .nullable()
    .optional()
    .transform((v) => (!v ? null : v)),
  fuzzy_location: z.boolean().optional().default(false),
});

export type CreateNoteSchema = z.infer<typeof createNoteSchema>;

/**
 * Extracts a Spotify track ID from a share link or URI, e.g.:
 * - https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp?si=...
 * - spotify:track:3n3Ppam7vgaVa1iaRUc9Lp
 */
export function extractSpotifyTrackId(input: string): string | null {
  const trimmed = input.trim();

  const urlMatch = trimmed.match(
    /open\.spotify\.com\/(?:intl-[a-z]{2}\/)?track\/([A-Za-z0-9]+)/i,
  );
  if (urlMatch) return urlMatch[1];

  const uriMatch = trimmed.match(/^spotify:track:([A-Za-z0-9]+)$/i);
  if (uriMatch) return uriMatch[1];

  return null;
}
