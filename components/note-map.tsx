"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { buildClusterIndex, isCluster } from "@/lib/cluster";
import type { NoteClusterFeature } from "@/lib/cluster";
import { fetchNotesInBounds } from "@/lib/notes-client";
import { supabase } from "@/lib/supabase/client";
import { MAP_STYLE_DARK, DEFAULT_CENTER, DEFAULT_ZOOM } from "@/lib/map-config";
import type { Note, PlaceResult } from "@/lib/types";

interface NoteMapProps {
  onSelectNotes: (notes: Note[]) => void;
  refreshToken: number;
  flyToPlace: PlaceResult | null;
  flyToCoords: { latitude: number; longitude: number } | null;
  since?: string | null;
}

export function NoteMap({ onSelectNotes, refreshToken, flyToPlace, flyToCoords, since }: NoteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  // Stable marker map: noteId (or cluster key) → Marker element
  const markerMapRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const userDotRef = useRef<maplibregl.Marker | null>(null);
  const notesRef = useRef<Note[]>([]);
  const pendingFlyRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const [ready, setReady] = useState(false);

  // ── Stable render: reconcile existing markers instead of destroy-recreate ──
  const render = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const index = buildClusterIndex(notesRef.current);
    const bounds = map.getBounds();
    const bbox: [number, number, number, number] = [
      bounds.getWest(), bounds.getSouth(),
      bounds.getEast(), bounds.getNorth(),
    ];
    const zoom = Math.round(map.getZoom());
    const features = index.getClusters(bbox, zoom) as NoteClusterFeature[];

    // Build the set of keys that should be visible this frame.
    const nextKeys = new Set<string>();

    for (const feature of features) {
      const [lng, lat] = feature.geometry.coordinates;
      let key: string;

      if (isCluster(feature)) {
        key = `cluster-${feature.properties.cluster_id}`;
      } else {
        key = `note-${feature.properties.id}`;
      }

      nextKeys.add(key);

      // Already rendered — just move it if somehow coords drifted (they won't).
      if (markerMapRef.current.has(key)) continue;

      // Build fresh marker element.
      const el = document.createElement("button");
      el.type = "button";
      el.className = "noted-marker";
      // Prevent map drag from being captured by the marker element.
      el.style.touchAction = "none";

      if (isCluster(feature)) {
        const count = feature.properties.point_count;
        el.setAttribute("aria-label", `${count} notes`);
        el.style.cssText = clusterStyle(clusterSize(count));
        el.textContent = String(count);
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          const leaves = index.getLeaves(feature.properties.cluster_id, Infinity);
          onSelectNotes(leaves.map((l) => l.properties));
        });
      } else {
        el.setAttribute("aria-label", "note");
        el.innerHTML = pinSVG;
        el.style.cssText = `
          background: none; border: none; padding: 0; cursor: pointer;
          width: 36px; height: 42px; display: block; touch-action: none;
          min-width: 36px; min-height: 42px;
        `;
        // When clicking a single pin, also grab any other notes at the exact same coordinate
        const noteLng = lng;
        const noteLat = lat;
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          const colocated = notesRef.current.filter(
            (n) => Math.abs(n.longitude - noteLng) < 0.00001 && Math.abs(n.latitude - noteLat) < 0.00001
          );
          if (colocated.length > 1) {
            onSelectNotes(colocated);
          } else {
            onSelectNotes([feature.properties]);
          }
        });
      }

      const marker = new maplibregl.Marker({
        element: el,
        anchor: isCluster(feature) ? "center" : "bottom",
        // Draggable = false is the default, but be explicit.
        draggable: false,
      })
        .setLngLat([lng, lat])
        .addTo(map);

      markerMapRef.current.set(key, marker);
    }

    // Remove markers that are no longer in view / in the cluster result.
    for (const [key, marker] of markerMapRef.current) {
      if (!nextKeys.has(key)) {
        marker.remove();
        markerMapRef.current.delete(key);
      }
    }
  }, [onSelectNotes]);

  const refetch = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = map.getBounds();
    const notes = await fetchNotesInBounds({
      west: bounds.getWest(), south: bounds.getSouth(),
      east: bounds.getEast(), north: bounds.getNorth(),
    }, since);
    notesRef.current = notes;
    render();
  }, [render, since]);

  // ── Map init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_DARK,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("load", () => {
      mapRef.current = map;
      setReady(true);
      if (pendingFlyRef.current) {
        const { latitude, longitude } = pendingFlyRef.current;
        map.flyTo({ center: [longitude, latitude], zoom: 14, essential: true });
        pendingFlyRef.current = null;
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Refetch on map move ───────────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;
    refetch();
    map.on("moveend", refetch);
    return () => { map.off("moveend", refetch); };
  }, [ready, refetch]);

  // ── External refresh token (after posting) ────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    refetch();
  }, [refreshToken, ready, refetch]);

  // ── Realtime: new notes from other users appear immediately ───────────────
  useEffect(() => {
    if (!ready) return;

    const channel = supabase
      .channel("notes-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notes" },
        (payload) => {
          const note = payload.new as Note;
          // Only add if not already present.
          if (notesRef.current.some((n) => n.id === note.id)) return;
          notesRef.current = [note, ...notesRef.current];
          render();
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ready, render]);

  // ── Fly to searched place ─────────────────────────────────────────────────
  useEffect(() => {
    if (!flyToPlace || !mapRef.current) return;
    mapRef.current.flyTo({ center: [flyToPlace.longitude, flyToPlace.latitude], zoom: 13, essential: true });
  }, [flyToPlace]);

  // ── Auto-locate: fly to user + plant white dot ────────────────────────────
  useEffect(() => {
    if (!flyToCoords) return;
    const { latitude, longitude } = flyToCoords;

    if (mapRef.current) {
      if (userDotRef.current) {
        userDotRef.current.setLngLat([longitude, latitude]);
      } else {
        const dot = document.createElement("div");
        dot.style.cssText = `
          width:14px;height:14px;border-radius:50%;
          background:#fff;border:2.5px solid #000;
          box-shadow:0 0 0 3px rgba(255,255,255,0.2),0 2px 6px rgba(0,0,0,0.5);
          pointer-events:none;
        `;
        userDotRef.current = new maplibregl.Marker({ element: dot, anchor: "center" })
          .setLngLat([longitude, latitude])
          .addTo(mapRef.current);
      }
    }

    if (mapRef.current && ready) {
      mapRef.current.flyTo({ center: [longitude, latitude], zoom: 14, essential: true });
    } else {
      pendingFlyRef.current = flyToCoords;
    }
  }, [flyToCoords, ready]);

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    />
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────

function clusterSize(count: number): number {
  if (count < 10) return 36;
  if (count < 50) return 44;
  if (count < 200) return 52;
  return 60;
}

function clusterStyle(size: number): string {
  return `
    width:${size}px;height:${size}px;border-radius:50%;
    background:#fff;color:#000;
    font-size:12px;font-weight:700;letter-spacing:-0.02em;
    display:flex;align-items:center;justify-content:center;
    cursor:pointer;border:none;padding:0;
    box-shadow:0 2px 12px rgba(0,0,0,0.4);
    touch-action:none;
  `;
}

// Minimal square-cornered pin: white fill, black outline, notch at bottom.
const pinSVG = `
<svg width="36" height="42" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="1" y="1" width="30" height="28" rx="5" fill="#fff" stroke="#000" stroke-width="1.5"/>
  <path d="M16 38 L11 29 H21 Z" fill="#fff" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/>
  <circle cx="16" cy="15" r="3.5" fill="#000"/>
</svg>`;
