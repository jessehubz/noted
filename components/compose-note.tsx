"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { createNote } from "@/lib/actions";
import { MAX_NOTE_LENGTH } from "@/lib/validation";
import type { Note } from "@/lib/types";

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

  const [step, setStep] = useState<Step>("locating");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [content, setContent] = useState("");
  const [name, setName] = useState("");
  const [fuzzy, setFuzzy] = useState(true);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    setTimeout(onClose, 1200);
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
              {/* Top row: location toggle + char count */}
              <div className="compose-top">
                <div className="compose-loc-indicator">
                  <span className="compose-loc-dot" />
                  <span>{fuzzy ? "Nearby" : "Exact spot"}</span>
                </div>
                <span className={`compose-char-count${remaining < 20 ? " warn" : ""}`}>{remaining}</span>
              </div>

              {/* Textarea */}
              <textarea
                autoFocus
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, MAX_NOTE_LENGTH))}
                disabled={step === "posting"}
                placeholder="Say what you couldn't."
                rows={5}
                className="compose-textarea"
              />

              {/* Location precision toggle — clear switch */}
              <div className="compose-location-row">
                <div className="compose-location-info">
                  <span className="compose-location-title">Hide exact location</span>
                  <span className="compose-location-desc">Pin placed randomly within ~200m</span>
                </div>
                <button
                  type="button"
                  className={`compose-switch ${fuzzy ? "on" : ""}`}
                  onClick={() => setFuzzy(!fuzzy)}
                  disabled={step === "posting"}
                  aria-label={fuzzy ? "Using nearby location" : "Using exact location"}
                >
                  <span className="compose-switch-thumb" />
                </button>
              </div>

              {/* Bottom labels */}
              <div className="compose-labels">
                <span>anonymous</span>
                <span>stays forever</span>
              </div>

              {/* Optional display name */}
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 40))}
                disabled={step === "posting"}
                placeholder="Sign your note (optional)"
                className="compose-name-input"
              />

              {submitError && <p className="compose-error-text">{submitError}</p>}

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || step === "posting"}
                className="compose-pin-btn"
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
