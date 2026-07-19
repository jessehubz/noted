"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useUser, SignUpButton } from "@clerk/nextjs";
import type { Note } from "@/lib/types";
import { CommentsSection } from "@/components/comments-section";
import { StoryShare } from "@/components/story-share";
import { ReportFlow } from "@/components/report-flow";
import { deleteOwnNote } from "@/lib/actions";
import { formatRelativeTime } from "@/lib/geo";

interface NotesPanelProps {
  notes: Note[] | null;
  onClose: () => void;
  onNoteDeleted?: () => void;
}

export function NotesPanel({ notes, onClose, onNoteDeleted }: NotesPanelProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [shareNote, setShareNote] = useState<Note | null>(null);
  const [reportingNoteId, setReportingNoteId] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const { user } = useUser();

  const visibleNotes = notes?.filter((n) => !deletedIds.has(n.id)) ?? null;
  const note = visibleNotes?.[currentIdx] ?? visibleNotes?.[0] ?? null;

  async function handleDelete(noteId: string) {
    if (!confirm("Delete this note? This can't be undone.")) return;
    setDeletingId(noteId);
    const result = await deleteOwnNote(noteId);
    setDeletingId(null);
    if (result.success) {
      setDeletedIds((prev) => new Set([...prev, noteId]));
      onNoteDeleted?.();
    } else {
      alert(result.error ?? "Couldn't delete note.");
    }
  }

  return (
    <>
      <AnimatePresence>
        {note && (
          <>
            <motion.div
              key="bd"
              className="panel-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            <div className="note-popup-center">
              <motion.div
                key="note-popup"
                className="note-popup"
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.97 }}
                transition={{ type: "spring", damping: 28, stiffness: 350 }}
                role="dialog"
                aria-label="Note"
              >
                {/* Top row: author · time + share + close */}
                <div className="note-popup-top">
                  <span className="note-popup-meta">
                    {note.display_name?.toUpperCase() ?? "ANONYMOUS"} · {formatRelativeTime(note.created_at).toUpperCase()}
                  </span>
                  <div className="note-popup-actions-top">
                    <button
                      className="note-popup-icon-btn"
                      onClick={() => setShareNote(note)}
                      aria-label="Share"
                      title="Share as story"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                        <path d="M12 3v13M7 8l5-5 5 5M5 21h14" />
                      </svg>
                    </button>
                    <button
                      className="note-popup-icon-btn"
                      onClick={onClose}
                      aria-label="Close"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Note content */}
                <div className="note-popup-content">
                  <p className="note-popup-text">{note.content}</p>
                </div>

                {/* Bottom actions */}
                <div className="note-popup-bottom">
                  <CommentsSection noteId={note.id} />
                  {!user && (
                    <p className="note-popup-auth-hint">
                      <SignUpButton mode="modal">
                        <button className="note-popup-auth-link">Create an account</button>
                      </SignUpButton>{" "}to reply &amp; get notifications
                    </p>
                  )}
                </div>

                {/* Secondary actions (report, delete) */}
                <div className="note-popup-secondary">
                  <button
                    className="note-popup-link-btn"
                    onClick={() => setReportingNoteId(reportingNoteId === note.id ? null : note.id)}
                  >
                    Report
                  </button>
                  {user && note.user_id === user.id && (
                    <button
                      className="note-popup-link-btn danger"
                      onClick={() => handleDelete(note.id)}
                      disabled={deletingId === note.id}
                    >
                      {deletingId === note.id ? "Deleting…" : "Delete my note"}
                    </button>
                  )}
                  {visibleNotes && visibleNotes.length > 1 && (
                    <span className="note-popup-nav">
                      <button
                        className="note-popup-link-btn"
                        onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                        disabled={currentIdx === 0}
                      >← Prev</button>
                      <span className="note-popup-nav-count">{currentIdx + 1}/{visibleNotes.length}</span>
                      <button
                        className="note-popup-link-btn"
                        onClick={() => setCurrentIdx((i) => Math.min((visibleNotes?.length ?? 1) - 1, i + 1))}
                        disabled={currentIdx >= (visibleNotes?.length ?? 1) - 1}
                      >Next →</button>
                    </span>
                  )}
                </div>

                {/* Inline report */}
                {reportingNoteId === note.id && (
                  <ReportFlow noteId={note.id} onDone={() => setReportingNoteId(null)} />
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <StoryShare
        open={!!shareNote}
        initialText={shareNote?.content.slice(0, 140) ?? ""}
        author={shareNote?.display_name ?? undefined}
        onClose={() => setShareNote(null)}
      />
    </>
  );
}
