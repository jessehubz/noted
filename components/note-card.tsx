"use client";

import { useState } from "react";
import { formatRelativeTime } from "@/lib/geo";
import type { Note } from "@/lib/types";
import { SpotifyEmbed } from "@/components/spotify-embed";
import { vote } from "@/lib/actions-vote";

interface NoteCardProps {
  note: Note;
}

function formatFullDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    + " at " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function NoteCard({ note }: NoteCardProps) {
  const [score, setScore] = useState(note.score ?? 0);
  const [voted, setVoted] = useState<1 | -1 | null>(null);

  async function handleVote(value: 1 | -1) {
    if (voted === value) return; // already voted this direction
    setVoted(value);
    setScore((s) => s + value - (voted ?? 0));
    await vote(note.id, value);
  }

  return (
    <article className="note-card">
      <p className="note-card-content">{note.content}</p>

      {note.spotify_track_id && (
        <div className="note-card-spotify">
          <SpotifyEmbed trackId={note.spotify_track_id} />
        </div>
      )}

      <div className="note-card-footer">
        <div className="note-card-meta">
          <span className="note-card-author">{note.display_name ?? "anonymous"}</span>
          <span className="note-card-time" title={formatFullDate(note.created_at)}>
            {formatRelativeTime(note.created_at)} · {formatFullDate(note.created_at)}
          </span>
        </div>

        <div className="note-card-votes">
          <button
            className={`note-vote-btn ${voted === 1 ? "active" : ""}`}
            onClick={() => handleVote(1)}
            aria-label="Upvote"
          >▲</button>
          <span className="note-vote-score">{score}</span>
          <button
            className={`note-vote-btn ${voted === -1 ? "active" : ""}`}
            onClick={() => handleVote(-1)}
            aria-label="Downvote"
          >▼</button>
        </div>
      </div>
    </article>
  );
}
