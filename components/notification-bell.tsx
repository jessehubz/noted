"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase/client";
import { getUnreadCount, getNotifications, markAllRead, type Notification } from "@/lib/actions-notifications";

export function NotificationBell() {
  const { user } = useUser();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshCount = useCallback(() => {
    if (!user) return;
    getUnreadCount().then(setCount).catch(() => { });
  }, [user]);

  // Initial fetch
  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  // Real-time: listen for new notifications via Supabase channel
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const notif = payload.new as Notification;
          // Only count if it's for the current user
          if (notif.user_id === user.id) {
            setCount((c) => c + 1);
            // If dropdown is open, prepend it
            if (open) {
              setNotifications((prev) => [notif, ...prev]);
            }
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, open]);

  async function handleOpen() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setLoading(true);
    try {
      const notifs = await getNotifications();
      setNotifications(notifs);
      if (count > 0) {
        await markAllRead();
        setCount(0);
      }
    } catch {
      // notifications table might not exist yet
    }
    setLoading(false);
  }

  if (!user) return null;

  return (
    <div className="notif-wrap">
      <button className="notif-bell" onClick={handleOpen} aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ""}`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {count > 0 && <span className="notif-badge">{count > 9 ? "9+" : count}</span>}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="notif-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="notif-dropdown"
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="notif-header">Notifications</div>
              <div className="notif-list">
                {loading ? (
                  <p className="notif-empty">Loading…</p>
                ) : notifications.length === 0 ? (
                  <p className="notif-empty">No notifications yet</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={`notif-item${n.is_read ? "" : " unread"}`}>
                      <p className="notif-msg">{n.message}</p>
                      <span className="notif-time">{timeAgo(n.created_at)}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
