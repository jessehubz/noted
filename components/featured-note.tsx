"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getFeaturedNote } from "@/lib/actions";
import type { Note } from "@/lib/types";

interface Props {
  onSelect: (note: Note) => void;
}

export function FeaturedNote({ onSelect }: Props) {
  const [note, setNote] = useState<Note | null>(null);

  useEffect(() => {
    getFeaturedNote().then((n) => setNote(n));
    // Refresh every 10 minutes.
    const id = setInterval(() => getFeaturedNote().then((n) => setNote(n)), 600_000);
    return () => clearInterval(id);
  }, []);

  return (
    <AnimatePresence>
      {note && (
        <motion.button
          className="featured-badge"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ delay: 1.5, type: "spring", damping: 20 }}
          onClick={() => onSelect(note)}
        >
          <span className="featured-badge-dot" />
          Featured: &ldquo;{note.content.slice(0, 40)}{note.content.length > 40 ? "…" : ""}&rdquo;
        </motion.button>
      )}
    </AnimatePresence>
  );
}
