"use client";

import { useCallback, useState } from "react";
import type { SpotifyTrackPreview } from "@/lib/types";

interface UseSpotifyPreviewResult {
  preview: SpotifyTrackPreview | null;
  loading: boolean;
  error: string | null;
  resolve: (url: string) => Promise<void>;
  clear: () => void;
}

/** Resolves a Spotify link to track metadata via our server route. */
export function useSpotifyPreview(): UseSpotifyPreviewResult {
  const [preview, setPreview] = useState<SpotifyTrackPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolve = useCallback(async (url: string) => {
    if (!url.trim()) {
      setPreview(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/spotify-preview?url=${encodeURIComponent(url)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setPreview(null);
        setError(data.error ?? "Couldn't find that track.");
        return;
      }
      setPreview(data as SpotifyTrackPreview);
    } catch {
      setPreview(null);
      setError("Couldn't reach Spotify. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setPreview(null);
    setError(null);
  }, []);

  return { preview, loading, error, resolve, clear };
}
