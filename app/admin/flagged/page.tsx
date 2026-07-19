"use client";

import { useEffect, useState } from "react";
import {
  getFlaggedNotes,
  deleteNote,
  resolveFlagApprove,
  rejectReport,
  type FlaggedNote,
} from "@/lib/admin-actions";

export default function AdminFlaggedPage() {
  const [flags, setFlags] = useState<FlaggedNote[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    getFlaggedNotes().then((f) => { setFlags(f); setLoading(false); });
  }

  useEffect(() => { load(); }, []);

  async function handleRemove(noteId: string) {
    if (!confirm("Delete this note and resolve the report?")) return;
    await deleteNote(noteId);
    load();
  }

  async function handleApprove(noteId: string) {
    await resolveFlagApprove(noteId);
    load();
  }

  async function handleReject(flagId: string) {
    await rejectReport(flagId);
    load();
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-title">Reported Notes</h1>
          <p className="admin-subtitle">{flags.length} pending review</p>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Loading…</div>
      ) : flags.length === 0 ? (
        <div className="admin-empty">No reported notes. All clear.</div>
      ) : (
        <div className="admin-flags-list">
          {flags.map((flag) => (
            <div key={flag.id} className="admin-flag-card">
              <div className="admin-flag-header">
                <span className="admin-flag-reason">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ display: "inline", verticalAlign: "-2px", marginRight: 6 }}>
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                    <path d="M4 22v-7" strokeLinecap="round" />
                  </svg>
                  {flag.reason}
                </span>
                <span className="admin-flag-date">
                  {new Date(flag.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {flag.note && (
                <div className="admin-flag-content">
                  <p className="admin-flag-note-text">&ldquo;{flag.note.content}&rdquo;</p>
                  <span className="admin-flag-meta">
                    by {flag.note.display_name ?? "anonymous"} · {flag.note.latitude.toFixed(3)}, {flag.note.longitude.toFixed(3)}
                    {flag.note.is_deleted && <span className="admin-badge-red" style={{ marginLeft: 8 }}>already deleted</span>}
                  </span>
                </div>
              )}

              <div className="admin-flag-actions">
                <button
                  onClick={() => handleReject(flag.id)}
                  className="admin-btn-sm"
                  title="Dismiss this report — the note is fine"
                >
                  Reject report
                </button>
                <button
                  onClick={() => handleApprove(flag.note_id)}
                  className="admin-btn-sm admin-btn-sm--success"
                  title="Mark as reviewed and keep the note"
                >
                  Approve (keep note)
                </button>
                <button
                  onClick={() => handleRemove(flag.note_id)}
                  className="admin-btn-sm admin-btn-sm--danger"
                  title="Delete the reported note from the map"
                >
                  Delete note
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
