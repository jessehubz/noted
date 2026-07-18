"use client";

import { useEffect, useState } from "react";
import { getBannedUsers, banUser, unbanUser, getRecentCommenters, type BannedUser } from "@/lib/admin-actions";

export default function AdminUsersPage() {
  const [banned, setBanned] = useState<BannedUser[]>([]);
  const [commenters, setCommenters] = useState<{ user_id: string; comment_count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [banInput, setBanInput] = useState("");
  const [banReason, setBanReason] = useState("");

  function load() {
    setLoading(true);
    Promise.all([getBannedUsers(), getRecentCommenters()]).then(([b, c]) => {
      setBanned(b);
      setCommenters(c);
      setLoading(false);
    });
  }

  useEffect(() => { load(); }, []);

  async function handleBan(e: React.FormEvent) {
    e.preventDefault();
    if (!banInput.trim()) return;
    const result = await banUser(banInput.trim(), banReason.trim() || "Admin action");
    if (result.success) {
      setBanInput("");
      setBanReason("");
      load();
    } else {
      alert(result.error ?? "Failed to ban user.");
    }
  }

  async function handleUnban(userId: string) {
    if (!confirm(`Unban user ${userId}?`)) return;
    await unbanUser(userId);
    load();
  }

  async function handleBanFromList(userId: string) {
    const reason = prompt(`Reason for banning ${userId}:`);
    if (!reason) return;
    await banUser(userId, reason);
    load();
  }

  return (
    <div className="admin-page">
      <h1 className="admin-title">Users</h1>
      <p className="admin-subtitle">Manage bans and view active commenters</p>

      {/* Ban form */}
      <div className="admin-card">
        <h2 className="admin-card-title">Ban a user</h2>
        <form onSubmit={handleBan} className="admin-ban-form">
          <input
            type="text"
            placeholder="Clerk User ID (e.g. user_2abc...)"
            value={banInput}
            onChange={(e) => setBanInput(e.target.value)}
            className="admin-input"
          />
          <input
            type="text"
            placeholder="Reason"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            className="admin-input"
          />
          <button type="submit" className="admin-btn-sm admin-btn-sm--danger">Ban</button>
        </form>
      </div>

      {loading ? (
        <div className="admin-loading">Loading…</div>
      ) : (
        <>
          {/* Banned list */}
          <div className="admin-card">
            <h2 className="admin-card-title">Banned Users ({banned.length})</h2>
            {banned.length === 0 ? (
              <p className="admin-empty-inline">No banned users.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Reason</th>
                    <th>Banned</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {banned.map((b) => (
                    <tr key={b.id}>
                      <td className="admin-cell-mono">{b.user_id}</td>
                      <td>{b.reason ?? "—"}</td>
                      <td>{new Date(b.banned_at).toLocaleDateString()}</td>
                      <td>
                        <button onClick={() => handleUnban(b.user_id)} className="admin-btn-sm">Unban</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Active commenters */}
          <div className="admin-card">
            <h2 className="admin-card-title">Recent Active Users</h2>
            {commenters.length === 0 ? (
              <p className="admin-empty-inline">No recent activity.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Comments</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {commenters.map((c) => (
                    <tr key={c.user_id}>
                      <td className="admin-cell-mono">{c.user_id}</td>
                      <td>{c.comment_count}</td>
                      <td>
                        <button onClick={() => handleBanFromList(c.user_id)} className="admin-btn-sm admin-btn-sm--danger">Ban</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
