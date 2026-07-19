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
    getFeaturedNote().then((n) => setNote(n)).catch(() => { });
    const id = setInterval(() => getFeaturedNote().then((n) => setNote(n)).catch(() => { }), 600_000);
    return () => clearInterval(id);
  }, []);

  return (
    <AnimatePresence>
      {note && (
        <motion.button
          className="featured-badge"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 20, opacity: 0 }}
          transition={{ delay: 1.5, type: "spring", damping: 20 }}
          onClick={() => onSelect(note)}
          drag
          dragConstraints={{ top: 0, left: -200, right: 200, bottom: 400 }}
          dragElastic={0.1}
          whileDrag={{ scale: 1.05, cursor: "grabbing" }}
        >
          <span className="featured-badge-dot" />
          <span className="featured-badge-label">Featured</span>
          <span className="featured-badge-text">&ldquo;{note.content.slice(0, 50)}{note.content.length > 50 ? "…" : ""}&rdquo;</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
