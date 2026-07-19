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
    <div ref={containerRef} className="search-container">
      <div className="search-bar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
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
          className="search-input"
        />
      </div>

      <AnimatePresence>
        {open && (query.trim().length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="search-dropdown"
          >
            {loading ? (
              <div className="search-status">Searching…</div>
            ) : results.length === 0 ? (
              <div className="search-status">No places found</div>
            ) : (
              results.map((place) => (
                <button
                  key={place.id}
                  onClick={() => {
                    onSelect(place);
                    setQuery(place.label);
                    setOpen(false);
                  }}
                  className="search-result"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="search-result-icon">
                    <path d="M12 21c0 0-7-7.6-7-12a7 7 0 0 1 14 0c0 4.4-7 12-7 12z" />
                    <circle cx="12" cy="9" r="2" />
                  </svg>
                  <span className="search-result-label">{place.label}</span>
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
