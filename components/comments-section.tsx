"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getComments, createComment } from "@/lib/actions-comments";
import type { Comment } from "@/lib/actions-comments";
import { formatRelativeTime } from "@/lib/geo";

interface Props {
  noteId: string;
}

export function CommentsSection({ noteId }: Props) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    getComments(noteId).then((data) => { if (active) setComments(data); });
    return () => { active = false; };
  }, [noteId]);

  async function handleSend() {
    if (!user || !text.trim()) return;
    setSending(true);
    await createComment(noteId, user.id, text);
    setText("");
    setSending(false);
    getComments(noteId).then(setComments);
  }

  return (
    <div style={{ marginTop: 16 }}>
      {comments.length > 0 && (
        <div className="comments-list">
          {comments.map((c) => (
            <div key={c.id} className="comment-item">
              <div className="comment-author">
                {c.profiles?.display_name ?? "user"}
              </div>
              <div className="comment-body">{c.content}</div>
              <div className="comment-time">{formatRelativeTime(c.created_at)}</div>
            </div>
          ))}
        </div>
      )}

      {user ? (
        <div className="comment-form">
          <input
            className="comment-input"
            placeholder="Add a comment…"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 500))}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <button className="comment-send" onClick={handleSend} disabled={!text.trim() || sending}>
            ↑
          </button>
        </div>
      ) : (
        <p className="comment-auth-nudge">
          <Link href="/auth">Sign in</Link> to comment
        </p>
      )}
    </div>
  );
}
