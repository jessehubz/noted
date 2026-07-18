"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import type { Note } from "@/lib/types";
import { NoteCard } from "@/components/note-card";
import { CommentsSection } from "@/components/comments-section";
import { useAuth } from "@/lib/auth-context";

interface NotesPanelProps {
  notes: Note[] | null;
  onClose: () => void;
}

export function NotesPanel({ notes, onClose }: NotesPanelProps) {
  const [tab, setTab] = useState<"notes" | "comments">("notes");
  const { user } = useAuth();

  // Reset tab when panel opens with new notes.
  const firstNoteId = notes?.[0]?.id;

  return (
    <AnimatePresence>
      {notes && (
        <>
          <motion.div
            key="bd"
            className="panel-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            key="panel"
            className="panel"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            aria-label="Notes"
          >
            <div className="panel-header">
              <span className="panel-count">
                {notes.length} {notes.length === 1 ? "note" : "notes"}
              </span>
              <button className="panel-close" onClick={onClose} aria-label="Close">✕</button>
            </div>

            {/* Tabs */}
            <div className="panel-tabs">
              <button
                className={`panel-tab ${tab === "notes" ? "active" : ""}`}
                onClick={() => setTab("notes")}
              >Notes</button>
              <button
                className={`panel-tab ${tab === "comments" ? "active" : ""}`}
                onClick={() => setTab("comments")}
              >Comments</button>
            </div>

            <div className="panel-scroll">
              {tab === "notes" && (
                <>
                  {notes.map((note) => (
                    <div key={note.id}>
                      <NoteCard note={note} />
                      {/* DM button under each note */}
                      {user ? (
                        <Link href={`/messages?note=${note.id}`} className="dm-btn" style={{ margin: "8px 0 4px" }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                            <path d="M1 4.5C1 3.12 2.12 2 3.5 2h5C9.88 2 11 3.12 11 4.5v2C11 7.88 9.88 9 8.5 9H5L2.5 11V9H3.5C2.12 9 1 7.88 1 6.5v-2z" stroke="currentColor" strokeWidth="1.2" />
                          </svg>
                          Message
                        </Link>
                      ) : (
                        <p className="comment-auth-nudge" style={{ textAlign: "left", padding: "4px 0" }}>
                          <Link href="/auth">Sign in</Link> to message
                        </p>
                      )}
                    </div>
                  ))}
                </>
              )}

              {tab === "comments" && firstNoteId && (
                <CommentsSection noteId={firstNoteId} />
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
