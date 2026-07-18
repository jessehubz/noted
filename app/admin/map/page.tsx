"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { Note, PlaceResult } from "@/lib/types";
import { PlaceSearch } from "@/components/place-search";
import { getAdminNotes, type AdminNote } from "@/lib/admin-actions";

const NoteMap = dynamic(
  () => import("@/components/note-map").then((mod) => mod.NoteMap),
  { ssr: false },
);

export default function AdminMapPage() {
  const [selectedNotes, setSelectedNotes] = useState<Note[] | null>(null);
  const [flyToPlace, setFlyToPlace] = useState<PlaceResult | null>(null);
  const [stats, setStats] = useState<{ total: number; loaded: number }>({ total: 0, loaded: 0 });

  useEffect(() => {
    // Load a summary count
    getAdminNotes(0, false).then(({ total }) => setStats((s) => ({ ...s, total })));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="admin-title">Map View</h1>
          <p className="admin-subtitle">{stats.total} live notes on the map</p>
        </div>
        <div style={{ width: 240 }}>
          <PlaceSearch onSelect={setFlyToPlace} />
        </div>
      </div>

      <div style={{ position: "relative", width: "100%", height: "60vh", borderRadius: 12, overflow: "hidden", border: "1px solid #1a1a1a" }}>
        <NoteMap
          onSelectNotes={setSelectedNotes}
          refreshToken={0}
          flyToPlace={flyToPlace}
          flyToCoords={null}
          since={null}
        />
      </div>

      {/* Selected notes preview */}
      {selectedNotes && selectedNotes.length > 0 && (
        <div className="admin-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 className="admin-card-title" style={{ margin: 0 }}>Selected ({selectedNotes.length})</h2>
            <button onClick={() => setSelectedNotes(null)} className="admin-btn-sm">Close</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
            {selectedNotes.map((note) => (
              <div key={note.id} style={{ background: "#060606", border: "1px solid #111", borderRadius: 8, padding: 12 }}>
                <p style={{ margin: "0 0 6px", color: "#ddd", fontSize: 14, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{note.content}</p>
                <span style={{ fontSize: 11, color: "#555" }}>
                  {note.display_name ?? "anonymous"} · {note.latitude.toFixed(4)}, {note.longitude.toFixed(4)} · {new Date(note.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
