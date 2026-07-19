"use client";

import { formatRelativeTime } from "@/lib/geo";
import type { Note } from "@/lib/types";

interface NoteCardProps {
  note: Note;
}

export function NoteCard({ note }: NoteCardProps) {
  return (
    <article className="nc-card">
      <div className="nc-head">
        <span className="nc-avatar" aria-hidden="true" />
        <div className="nc-who">
          <span className="nc-name">{note.display_name ?? "anonymous"}</span>
        </div>
        <span className="nc-time">{formatRelativeTime(note.created_at)}</span>
      </div>
      <div className="nc-body">
        <p className="nc-text">{note.content}</p>
      </div>
    </article>
  );
}
