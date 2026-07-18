import { NextResponse } from "next/server";
import { extractSpotifyTrackId } from "@/lib/validation";

/**
 * Resolves a Spotify share link/URI to basic track metadata using Spotify's
 * public oEmbed endpoint. No API key or auth is required for this call.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const trackId = extractSpotifyTrackId(url);
  if (!trackId) {
    return NextResponse.json(
      { error: "That doesn't look like a Spotify track link." },
      { status: 400 },
    );
  }

  const canonicalUrl = `https://open.spotify.com/track/${trackId}`;
  const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(canonicalUrl)}`;

  try {
    const res = await fetch(oembedUrl, {
      headers: { Accept: "application/json" },
      // Track metadata is effectively static; cache briefly to reduce load.
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Couldn't find that track on Spotify." },
        { status: 404 },
      );
    }

    const data = (await res.json()) as {
      title?: string;
      thumbnail_url?: string;
    };

    return NextResponse.json({
      id: trackId,
      title: data.title ?? "Unknown track",
      thumbnailUrl: data.thumbnail_url ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach Spotify. Try again." },
      { status: 502 },
    );
  }
}
