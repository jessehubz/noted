"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  getOrCreateThread,
  getThreads,
  getMessages,
  sendMessage,
} from "@/lib/actions-dm";
import type { DmThread, DmMessage } from "@/lib/actions-dm";

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="msg-page"><div className="msg-empty">Loading…</div></div>}>
      <MessagesContent />
    </Suspense>
  );
}

function MessagesContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const noteId = searchParams.get("note");

  const [threads, setThreads] = useState<DmThread[]>([]);
  const [activeThread, setActiveThread] = useState<DmThread | null>(null);
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    if (user) getThreads(user.id).then((data) => { if (active) setThreads(data); });
    return () => { active = false; };
  }, [user]);

  // If ?note=xxx is present, open/create that thread.
  useEffect(() => {
    if (!noteId || !user) return;
    getOrCreateThread(noteId, user.id, "").then(({ thread }) => {
      if (thread) {
        setActiveThread(thread);
        getThreads(user.id).then(setThreads);
      }
    });
  }, [noteId, user]);

  // Load messages when active thread changes.
  useEffect(() => {
    if (!activeThread) return;
    getMessages(activeThread.id).then(setMessages);
  }, [activeThread]);

  async function handleSend() {
    if (!user || !activeThread || !text.trim()) return;
    setSending(true);
    await sendMessage(activeThread.id, user.id, text);
    setText("");
    setSending(false);
    const msgs = await getMessages(activeThread.id);
    setMessages(msgs);
  }

  if (authLoading) return <div className="msg-page"><div className="msg-empty">Loading…</div></div>;
  if (!user) {
    return (
      <div className="msg-page">
        <div className="msg-empty">
          <Link href="/auth" style={{ color: "#555", textDecoration: "underline" }}>Sign in</Link>&nbsp;to view messages
        </div>
      </div>
    );
  }

  return (
    <div className="msg-page">
      <div className="msg-header">
        <Link href="/map" className="msg-back">← Map</Link>
        <span className="msg-title">
          {activeThread ? "Conversation" : "Messages"}
        </span>
      </div>

      {!activeThread ? (
        threads.length === 0 ? (
          <div className="msg-empty">No conversations yet</div>
        ) : (
          <div className="msg-list">
            {threads.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveThread(t)}
                style={{
                  background: "#0a0a0a", border: "1px solid #111", borderRadius: 10,
                  padding: "12px 16px", textAlign: "left", cursor: "pointer",
                  color: "#ccc", fontSize: 13, width: "100%",
                }}
              >
                {t.note_preview || "Note conversation"}
                <span style={{ display: "block", fontSize: 11, color: "#333", marginTop: 4 }}>
                  {new Date(t.created_at).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        )
      ) : (
        <>
          <div className="msg-list">
            {messages.length === 0 && (
              <div style={{ color: "#222", fontSize: 13, textAlign: "center", marginTop: 40 }}>
                Start the conversation
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`msg-bubble ${m.sender_id === user.id ? "msg-bubble--mine" : "msg-bubble--theirs"}`}
              >
                {m.content}
              </div>
            ))}
          </div>
          <div className="msg-compose">
            <input
              className="msg-input"
              placeholder="Type a message…"
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 1000))}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />
            <button className="msg-send" onClick={handleSend} disabled={!text.trim() || sending}>↑</button>
          </div>
        </>
      )}
    </div>
  );
}
