"use client";

import { AnimatePresence, motion } from "motion/react";

interface SpotifyBarProps {
  trackId: string | null;
  onClose: () => void;
}

/**
 * Persistent mini Spotify player that sits at the bottom of the map.
 * Shows when a note with a Spotify track is selected.
 * Uses the compact embed (height 80) — plays 30s preview without auth,
 * full playback if user is logged into Spotify in their browser.
 */
export function SpotifyBar({ trackId, onClose }: SpotifyBarProps) {
  return (
    <AnimatePresence>
      {trackId && (
        <motion.div
          className="spotify-bar"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 280 }}
        >
          <button className="spotify-bar-close" onClick={onClose} aria-label="Close player">✕</button>
          <div className="spotify-bar-embed">
            <iframe
              title="Spotify"
              src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`}
              width="100%"
              height="80"
              style={{ borderRadius: 8, border: "none" }}
              loading="lazy"
              allow="encrypted-media; clipboard-write"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
