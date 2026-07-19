"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Show, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { PlaceSearch } from "@/components/place-search";
import { NotesPanel } from "@/components/notes-panel";
import { ComposeNote } from "@/components/compose-note";
import { FeaturedNote } from "@/components/featured-note";
import { TimeSlider } from "@/components/time-slider";
import { NotificationBell } from "@/components/notification-bell";
import type { Note, PlaceResult } from "@/lib/types";

const NoteMap = dynamic(
  () => import("@/components/note-map").then((mod) => mod.NoteMap),
  { ssr: false },
);

export default function MapPage() {
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Note[] | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [flyToPlace, setFlyToPlace] = useState<PlaceResult | null>(null);
  const [userCoords, setUserCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [since, setSince] = useState<string | null>(null);

  // Check admin status
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    fetch("/api/me").then((r) => r.json()).then((d) => setIsAdmin(d.isAdmin === true)).catch(() => { });
  }, [user]);

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
        <div className="map-topbar-right">
          <div className="map-search">
            <PlaceSearch onSelect={setFlyToPlace} />
          </div>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="map-signin-btn">Sign in</button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <div className="map-user-group">
              {isAdmin && <Link href="/admin" className="map-admin-btn">Admin</Link>}
              <NotificationBell />
              <UserButton />
            </div>
          </Show>
        </div>
      </div>

      {/* Featured note */}
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

      <NotesPanel
        notes={selectedNotes}
        onClose={() => setSelectedNotes(null)}
        onNoteDeleted={() => setRefreshToken((t) => t + 1)}
      />

      <ComposeNote
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onPosted={() => setRefreshToken((t) => t + 1)}
      />
    </div>
  );
}
