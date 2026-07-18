"use client";

import { useEffect, useState } from "react";
import { getAdminNotes, deleteNote, restoreNote, flagNote, type AdminNote } from "@/lib/admin-actions";

export default function AdminNotesPage() {
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [showDeleted, setShowDeleted] = useState(false);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    getAdminNotes(page, showDeleted).then(({ notes: n, total: t }) => {
      setNotes(n);
      setTotal(t);
      setLoading(false);
    });
  }

  useEffect(() => { load(); }, [page, showDeleted]);

  async function handleDelete(id: string) {
    if (!confirm("Soft-delete this note? It will be hidden from the map.")) return;
    await deleteNote(id);
    load();
  }

  async function handleRestore(id: string) {
    await restoreNote(id);
    load();
  }

  async function handleFlag(id: string) {
    const reason = prompt("Reason for flagging:");
    if (!reason) return;
    await flagNote(id, reason);
    alert("Flagged.");
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-title">Notes</h1>
          <p className="admin-subtitle">{total} total</p>
        </div>
        <label className="admin-toggle-label">
          <input type="checkbox" checked={showDeleted} onChange={(e) => { setShowDeleted(e.target.checked); setPage(0); }} />
          Show deleted
        </label>
      </div>

      {loading ? (
        <div className="admin-loading">Loading…</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Content</th>
                <th>Author</th>
                <th>Location</th>
                <th>Created</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((note) => (
                <tr key={note.id} className={note.is_deleted ? "admin-row-deleted" : ""}>
                  <td className="admin-cell-content">{note.content.slice(0, 80)}{note.content.length > 80 ? "…" : ""}</td>
                  <td>{note.display_name ?? "anon"}</td>
                  <td className="admin-cell-mono">{note.latitude.toFixed(3)}, {note.longitude.toFixed(3)}</td>
                  <td>{new Date(note.created_at).toLocaleDateString()}</td>
                  <td>{note.is_deleted ? <span className="admin-badge-red">deleted</span> : <span className="admin-badge-green">live</span>}</td>
                  <td className="admin-cell-actions">
                    {!note.is_deleted ? (
                      <>
                        <button onClick={() => handleFlag(note.id)} className="admin-btn-sm">Flag</button>
                        <button onClick={() => handleDelete(note.id)} className="admin-btn-sm admin-btn-sm--danger">Delete</button>
                      </>
                    ) : (
                      <button onClick={() => handleRestore(note.id)} className="admin-btn-sm">Restore</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="admin-pagination">
            <button disabled={page === 0} onClick={() => setPage(page - 1)} className="admin-btn-sm">← Prev</button>
            <span className="admin-pagination-info">Page {page + 1} of {totalPages || 1}</span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="admin-btn-sm">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
