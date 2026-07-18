"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminStats, type AdminStats } from "@/lib/admin-actions";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats().then((s) => { setStats(s); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">Loading dashboard…</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="admin-page">
        <div className="admin-loading">Failed to load. Make sure the database migration has been applied.</div>
      </div>
    );
  }

  const maxCount = Math.max(...stats.notesLast7Days.map((d) => d.count), 1);

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-title">Dashboard</h1>
          <p className="admin-subtitle">Real-time overview of noted</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/admin/notes" className="admin-btn-sm">View all notes →</Link>
          <Link href="/admin/flagged" className="admin-btn-sm" style={{ borderColor: stats.flaggedPending > 0 ? "#522" : undefined, color: stats.flaggedPending > 0 ? "#e55" : undefined }}>
            {stats.flaggedPending > 0 ? `${stats.flaggedPending} flagged` : "No flags"}
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat">
          <span className="admin-stat-value">{stats.totalNotes.toLocaleString()}</span>
          <span className="admin-stat-label">Total Notes</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-value">{stats.notesToday}</span>
          <span className="admin-stat-label">Today</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-value">{stats.totalComments}</span>
          <span className="admin-stat-label">Comments</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-value">{stats.totalUsers}</span>
          <span className="admin-stat-label">Users</span>
        </div>
        <div className={`admin-stat ${stats.flaggedPending > 0 ? "admin-stat--alert" : ""}`}>
          <span className="admin-stat-value">{stats.flaggedPending}</span>
          <span className="admin-stat-label">Flagged</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-value">{stats.bannedUsers}</span>
          <span className="admin-stat-label">Banned</span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="admin-grid-2">
        {/* Chart */}
        <div className="admin-card">
          <h2 className="admin-card-title">Activity — Last 7 days</h2>
          <div className="admin-chart">
            {stats.notesLast7Days.map((d) => (
              <div key={d.day} className="admin-chart-bar-wrap">
                <span className="admin-chart-value">{d.count}</span>
                <div
                  className="admin-chart-bar"
                  style={{ height: `${Math.max((d.count / maxCount) * 100, 6)}%` }}
                />
                <span className="admin-chart-label">{formatDay(d.day)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="admin-card">
          <h2 className="admin-card-title">Quick Actions</h2>
          <div className="admin-quick-actions">
            <Link href="/admin/notes" className="admin-action-item">
              <div className="admin-action-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </div>
              <div>
                <span className="admin-action-label">Review Notes</span>
                <span className="admin-action-desc">Browse, flag, or delete notes</span>
              </div>
            </Link>
            <Link href="/admin/flagged" className="admin-action-item">
              <div className="admin-action-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke="currentColor" strokeWidth="1.5" /><path d="M4 22v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </div>
              <div>
                <span className="admin-action-label">Flagged Queue</span>
                <span className="admin-action-desc">{stats.flaggedPending} pending review</span>
              </div>
            </Link>
            <Link href="/admin/users" className="admin-action-item">
              <div className="admin-action-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </div>
              <div>
                <span className="admin-action-label">Manage Users</span>
                <span className="admin-action-desc">{stats.bannedUsers} banned</span>
              </div>
            </Link>
            <Link href="/admin/map" className="admin-action-item">
              <div className="admin-action-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M8 2v16M16 6v16" stroke="currentColor" strokeWidth="1.5" /></svg>
              </div>
              <div>
                <span className="admin-action-label">Map View</span>
                <span className="admin-action-desc">Visual overview of all notes</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDay(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3);
}
