"use client";

import { useEffect, useState } from "react";
import { getAdminStats, type AdminStats } from "@/lib/admin-actions";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats().then((s) => { setStats(s); setLoading(false); });
  }, []);

  if (loading) return <div className="admin-loading">Loading dashboard…</div>;
  if (!stats) return <div className="admin-loading">Failed to load stats.</div>;

  const maxCount = Math.max(...stats.notesLast7Days.map((d) => d.count), 1);

  return (
    <div className="admin-page">
      <h1 className="admin-title">Dashboard</h1>
      <p className="admin-subtitle">Overview of noted activity</p>

      {/* Stat cards */}
      <div className="admin-stats-grid">
        <StatCard label="Total Notes" value={stats.totalNotes} />
        <StatCard label="Notes Today" value={stats.notesToday} />
        <StatCard label="Comments" value={stats.totalComments} />
        <StatCard label="Users" value={stats.totalUsers} />
        <StatCard label="Flagged (pending)" value={stats.flaggedPending} highlight={stats.flaggedPending > 0} />
        <StatCard label="Banned Users" value={stats.bannedUsers} />
      </div>

      {/* Chart: Last 7 days */}
      <div className="admin-card">
        <h2 className="admin-card-title">Notes — Last 7 days</h2>
        <div className="admin-chart">
          {stats.notesLast7Days.map((d) => (
            <div key={d.day} className="admin-chart-bar-wrap">
              <div
                className="admin-chart-bar"
                style={{ height: `${Math.max((d.count / maxCount) * 100, 4)}%` }}
              />
              <span className="admin-chart-label">{d.day.slice(5)}</span>
              <span className="admin-chart-value">{d.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`admin-stat ${highlight ? "admin-stat--alert" : ""}`}>
      <span className="admin-stat-value">{value}</span>
      <span className="admin-stat-label">{label}</span>
    </div>
  );
}
