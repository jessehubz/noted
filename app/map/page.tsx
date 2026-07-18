"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { PlaceSearch } from "@/components/place-search";
import { NotesPanel } from "@/components/notes-panel";
import { ComposeNote } from "@/components/compose-note";
import { FeaturedNote } from "@/components/featured-note";
import { TimeSlider } from "@/components/time-slider";
import { SpotifyBar } from "@/components/spotify-bar";
import type { Note, PlaceResult } from "@/lib/types";

const NoteMap = dynamic(
  () => import("@/components/note-map").then((mod) => mod.NoteMap),
  { ssr: false },
);

export default function MapPage() {
  const [selectedNotes, setSelectedNotes] = useState<Note[] | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [flyToPlace, setFlyToPlace] = useState<PlaceResult | null>(null);
  const [userCoords, setUserCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [since, setSince] = useState<string | null>(null);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => { },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  function handleSelectNotes(notes: Note[]) {
    setSelectedNotes(notes);
    // If the first note has a Spotify track, show the player.
    const firstTrack = notes.find((n) => n.spotify_track_id)?.spotify_track_id ?? null;
    setActiveTrackId(firstTrack);
  }

  function handleFeaturedSelect(note: Note) {
    handleSelectNotes([note]);
    setFlyToPlace({ id: note.id, label: "", latitude: note.latitude, longitude: note.longitude });
  }

  return (
    <div className="map-shell">
      <NoteMap
        onSelectNotes={handleSelectNotes}
        refreshToken={refreshToken}
        flyToPlace={flyToPlace}
        flyToCoords={userCoords}
        since={since}
      />

      {/* Top bar */}
      <div className="map-topbar">
        <Link href="/" className="map-wordmark" aria-label="Go to home">noted</Link>
        <div className="map-search">
          <PlaceSearch onSelect={setFlyToPlace} />
        </div>
      </div>

      {/* Featured note badge */}
      <FeaturedNote onSelect={handleFeaturedSelect} />

      {/* Time slider */}
      <TimeSlider onChange={setSince} />

      {/* Post button */}
      <div className="map-fab-wrap">
        <button onClick={() => setComposeOpen(true)} className="map-fab">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <path d="M7.5 1v13M1 7.5h13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          Leave a note
        </button>
      </div>

      <NotesPanel notes={selectedNotes} onClose={() => { setSelectedNotes(null); setActiveTrackId(null); }} />

      <ComposeNote
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onPosted={() => setRefreshToken((t) => t + 1)}
      />

      {/* Spotify mini player */}
      <SpotifyBar trackId={activeTrackId} onClose={() => setActiveTrackId(null)} />
    </div>
  );
}
