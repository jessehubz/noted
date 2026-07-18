"use client";

import { useEffect, useState } from "react";
import { getFlaggedNotes, deleteNote, resolveFlagApprove, type FlaggedNote } from "@/lib/admin-actions";

export default function AdminFlaggedPage() {
  const [flags, setFlags] = useState<FlaggedNote[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    getFlaggedNotes().then((f) => { setFlags(f); setLoading(false); });
  }

  useEffect(() => { load(); }, []);

  async function handleRemove(noteId: string) {
    if (!confirm("Delete this note and resolve the flag?")) return;
    await deleteNote(noteId);
    load();
  }

  async function handleApprove(noteId: string) {
    await resolveFlagApprove(noteId);
    load();
  }

  return (
    <div className="admin-page">
      <h1 className="admin-title">Flagged Notes</h1>
      <p className="admin-subtitle">{flags.length} pending review</p>

      {loading ? (
        <div className="admin-loading">Loading…</div>
      ) : flags.length === 0 ? (
        <div className="admin-empty">No flagged notes. All clear.</div>
      ) : (
        <div className="admin-flags-list">
          {flags.map((flag) => (
            <div key={flag.id} className="admin-flag-card">
              <div className="admin-flag-header">
                <span className="admin-flag-reason">Reason: {flag.reason}</span>
                <span className="admin-flag-date">{new Date(flag.created_at).toLocaleDateString()}</span>
              </div>
              {flag.note && (
                <div className="admin-flag-content">
                  <p className="admin-flag-note-text">{flag.note.content}</p>
                  <span className="admin-flag-meta">
                    by {flag.note.display_name ?? "anonymous"} · {flag.note.latitude.toFixed(3)}, {flag.note.longitude.toFixed(3)}
                  </span>
                </div>
              )}
              <div className="admin-flag-actions">
                <button onClick={() => handleApprove(flag.note_id)} className="admin-btn-sm admin-btn-sm--success">Approve (keep)</button>
                <button onClick={() => handleRemove(flag.note_id)} className="admin-btn-sm admin-btn-sm--danger">Remove note</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
