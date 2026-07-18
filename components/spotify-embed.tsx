interface SpotifyEmbedProps {
  trackId: string;
}

/** Compact, lazy-loaded Spotify track player. No API key required. */
export function SpotifyEmbed({ trackId }: SpotifyEmbedProps) {
  return (
    <iframe
      title="Spotify track"
      src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`}
      width="100%"
      height="80"
      style={{ borderRadius: 12 }}
      loading="lazy"
      allow="encrypted-media; clipboard-write"
    />
  );
}
