"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useSpotifyPreview } from "@/hooks/useSpotifyPreview";
import { createNote } from "@/lib/actions";
import { MAX_NOTE_LENGTH } from "@/lib/validation";
import type { Note } from "@/lib/types";
import { debounce } from "@/lib/geo";

interface ComposeNoteProps {
  open: boolean;
  onClose: () => void;
  onPosted: (note: Note) => void;
}

type Step = "locating" | "denied" | "writing" | "posting" | "posted";

export function ComposeNote({ open, onClose, onPosted }: ComposeNoteProps) {
  if (!open) return null;
  return <ComposeDialog onClose={onClose} onPosted={onPosted} />;
}

function ComposeDialog({ onClose, onPosted }: Omit<ComposeNoteProps, "open">) {
  const { locate } = useGeolocation();
  const spotify = useSpotifyPreview();

  const [step, setStep] = useState<Step>("locating");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [content, setContent] = useState("");
  const [name, setName] = useState("");
  const [fuzzy, setFuzzy] = useState(false);
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [locateError, setLocateError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const debouncedResolve = useRef(debounce(spotify.resolve, 500));

  useEffect(() => {
    let cancelled = false;
    locate()
      .then((c) => { if (!cancelled) { setCoords(c); setStep("writing"); } })
      .catch((err: Error) => { if (!cancelled) { setLocateError(err.message); setStep("denied"); } });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remaining = MAX_NOTE_LENGTH - content.length;
  const canSubmit = content.trim().length > 0 && remaining >= 0 && coords;

  async function handleSubmit() {
    if (!coords || !canSubmit) return;
    setStep("posting");
    setSubmitError(null);

    const result = await createNote({
      content: content.trim(),
      latitude: coords.latitude,
      longitude: coords.longitude,
      spotify_track_id: spotify.preview?.id ?? null,
      display_name: name.trim() || null,
      fuzzy_location: fuzzy,
    });

    if (!result.success || !result.note) {
      setSubmitError(result.error ?? "Something went wrong.");
      setStep("writing");
      return;
    }

    setStep("posted");
    onPosted(result.note);
    setTimeout(onClose, 1000);
  }

  return (
    <AnimatePresence>
      <motion.div
        className="compose-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget && step !== "posting") onClose(); }}
      >
        <motion.div
          className="compose-sheet"
          initial={{ y: 32, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 32, opacity: 0, scale: 0.97 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
        >
          {step === "locating" && (
            <motion.div className="compose-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="compose-spinner" />
              <p className="compose-hint">Getting your location…</p>
            </motion.div>
          )}

          {step === "denied" && (
            <motion.div className="compose-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="compose-error-text">{locateError}</p>
              <p className="compose-hint">Enable location access to pin a note.</p>
              <div className="compose-row">
                <button className="compose-btn-ghost" onClick={onClose}>Cancel</button>
                <button className="compose-btn-primary" onClick={() => {
                  setStep("locating");
                  locate()
                    .then((c) => { setCoords(c); setStep("writing"); })
                    .catch((err: Error) => { setLocateError(err.message); setStep("denied"); });
                }}>Try again</button>
              </div>
            </motion.div>
          )}

          {(step === "writing" || step === "posting") && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <div className="compose-header">
                <span className="compose-loc-badge">
                  <span className="compose-loc-dot" />
                  {fuzzy ? "Nearby location" : "Exact location"}
                </span>
                <button className="compose-close" onClick={onClose} disabled={step === "posting"} aria-label="Close">✕</button>
              </div>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 40))}
                disabled={step === "posting"}
                placeholder="Your name (optional)"
                className="compose-input"
              />

              <textarea
                autoFocus
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, MAX_NOTE_LENGTH))}
                disabled={step === "posting"}
                placeholder="What's on your mind here?"
                rows={4}
                className="compose-textarea"
              />

              <div className="compose-meta">
                <span>anonymous · permanent</span>
                <span className={remaining < 20 ? "compose-meta-warn" : ""}>{remaining}</span>
              </div>

              {/* Location precision toggle */}
              <label className="compose-toggle">
                <input
                  type="checkbox"
                  checked={fuzzy}
                  onChange={(e) => setFuzzy(e.target.checked)}
                  disabled={step === "posting"}
                />
                <span className="compose-toggle-label">
                  Hide exact location
                  <span className="compose-toggle-hint">Pin will be placed randomly within ~200m</span>
                </span>
              </label>

              {/* Spotify */}
              <input
                type="text"
                value={spotifyUrl}
                onChange={(e) => { setSpotifyUrl(e.target.value); debouncedResolve.current(e.target.value); }}
                disabled={step === "posting"}
                placeholder="Spotify link (optional)"
                className="compose-input"
              />
              {spotify.loading && <p className="compose-hint">Looking up track…</p>}
              {spotify.error && <p className="compose-error-text">{spotify.error}</p>}
              {spotify.preview && (
                <div className="compose-track">
                  {spotify.preview.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={spotify.preview.thumbnailUrl} alt="" className="compose-track-img" />
                  )}
                  <span className="compose-track-title">{spotify.preview.title}</span>
                </div>
              )}

              {submitError && <p className="compose-error-text">{submitError}</p>}

              <button
                onClick={handleSubmit}
                disabled={!canSubmit || step === "posting"}
                className="compose-btn-primary compose-submit"
              >
                {step === "posting"
                  ? <><span className="compose-spinner compose-spinner--sm" /> Pinning…</>
                  : "Pin it here"}
              </button>
            </motion.div>
          )}

          {step === "posted" && (
            <motion.div className="compose-center" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <div className="compose-check">✓</div>
              <p className="compose-hint">Your note is on the map.</p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
