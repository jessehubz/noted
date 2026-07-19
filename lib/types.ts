/** A single anonymous note pinned to a real-world location. */
export interface Note {
  id: string;
  content: string;
  latitude: number;
  longitude: number;
  spotify_track_id: string | null;
  display_name: string | null;
  score: number;
  created_at: string;
  user_id: string | null;
  is_deleted?: boolean;
}

/** Payload the client sends when creating a note. */
export interface CreateNoteInput {
  content: string;
  latitude: number;
  longitude: number;
  spotify_track_id?: string | null;
}

/** Minimal track metadata resolved from a Spotify share link via oEmbed. */
export interface SpotifyTrackPreview {
  id: string;
  title: string;
  thumbnailUrl: string | null;
}

/** A place result from the location search box. */
export interface PlaceResult {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
}
