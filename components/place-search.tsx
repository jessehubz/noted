"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { debounce } from "@/lib/geo";
import type { PlaceResult } from "@/lib/types";

interface PlaceSearchProps {
  onSelect: (place: PlaceResult) => void;
}

export function PlaceSearch({ onSelect }: PlaceSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useRef(
    debounce(async (value: string) => {
      if (!value.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search-places?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400),
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="flex items-center gap-2 rounded-full bg-black/50 px-4 py-2.5 shadow-lg ring-1 ring-white/10 backdrop-blur-xl">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="shrink-0 text-zinc-400"
          aria-hidden="true"
        >
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11.5 11.5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            search.current(e.target.value);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search a place…"
          className="w-full bg-transparent text-sm text-white placeholder:text-zinc-400 outline-none"
        />
      </div>

      <AnimatePresence>
        {open && (query.trim().length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute left-0 top-full mt-2 w-full overflow-hidden rounded-2xl bg-zinc-900/95 shadow-xl ring-1 ring-white/10 backdrop-blur-xl"
          >
            {loading ? (
              <div className="px-4 py-3 text-sm text-zinc-500">Searching…</div>
            ) : results.length === 0 ? (
              <div className="px-4 py-3 text-sm text-zinc-500">No places found</div>
            ) : (
              results.map((place) => (
                <button
                  key={place.id}
                  onClick={() => {
                    onSelect(place);
                    setQuery(place.label);
                    setOpen(false);
                  }}
                  className="block w-full truncate px-4 py-2.5 text-left text-sm text-zinc-200 hover:bg-white/5"
                >
                  {place.label}
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
