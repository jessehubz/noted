"use client";

import { formatRelativeTime } from "@/lib/geo";
import type { Note } from "@/lib/types";

interface NoteCardProps {
  note: Note;
}

function formatFullDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    + " at " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function NoteCard({ note }: NoteCardProps) {
  return (
    <article className="note-card">
      <p className="note-card-content">{note.content}</p>
      <div className="note-card-footer">
        <span className="note-card-author">{note.display_name ?? "anonymous"}</span>
        <span className="note-card-time" title={formatFullDate(note.created_at)}>
          {formatRelativeTime(note.created_at)}
        </span>
      </div>
    </article>
  );
}
