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

  // Track the last zoom level used to render so we use consistent flooring
  const lastZoomRef = useRef<number>(DEFAULT_ZOOM);

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
    // Use Math.floor for consistent clustering in both zoom directions.
    // Math.round caused asymmetric threshold changes (zooming in vs out crossed
    // different integer boundaries at different points).
    const zoom = Math.floor(map.getZoom());
    lastZoomRef.current = zoom;
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
          width: 30px; height: 40px; display: block; touch-action: none;
          min-width: 30px; min-height: 40px;
          filter: drop-shadow(0 8px 24px rgba(0,0,0,0.65));
          transition: transform 0.25s cubic-bezier(.22,1,.36,1);
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
    // Fade out markers instead of abrupt removal for smooth zoom transitions.
    for (const [key, marker] of markerMapRef.current) {
      if (!nextKeys.has(key)) {
        const el = marker.getElement();
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
        // Remove after transition completes
        setTimeout(() => {
          marker.remove();
        }, 200);
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

  // ── Re-render on zoom (without refetching) for smooth clustering transitions ──
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;
    // Render on every zoom change so clusters update smoothly in both directions
    const onZoom = () => {
      const newZoom = Math.floor(map.getZoom());
      if (newZoom !== lastZoomRef.current) {
        render();
      }
    };
    map.on("zoom", onZoom);
    return () => { map.off("zoom", onZoom); };
  }, [ready, render]);

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

  // ── Realtime: new notes appear + deleted notes disappear immediately ────────
  useEffect(() => {
    if (!ready) return;

    const channel = supabase
      .channel("notes-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notes" },
        (payload) => {
          const note = payload.new as Note;
          // Only add if not already present and not deleted.
          if (note.is_deleted) return;
          if (notesRef.current.some((n) => n.id === note.id)) return;
          notesRef.current = [note, ...notesRef.current];
          render();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notes" },
        (payload) => {
          const updated = payload.new as Note;
          // If note was soft-deleted, remove it from the map in real time
          if (updated.is_deleted) {
            const before = notesRef.current.length;
            notesRef.current = notesRef.current.filter((n) => n.id !== updated.id);
            if (notesRef.current.length !== before) {
              render();
            }
          }
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
  if (count < 50) return 46;
  if (count < 200) return 62;
  return 62;
}

function clusterStyle(size: number): string {
  // Matches design-preview.html: circular white badge with concentric ring borders
  const ring1 = size + 16;
  const ring2 = size + 36;
  return `
    width:${size}px;height:${size}px;border-radius:50%;
    background:#F5F3EE;color:#060606;
    font-family:"Space Mono",ui-monospace,monospace;
    font-size:${size > 50 ? 17 : size > 40 ? 14 : 12}px;font-weight:400;
    display:flex;align-items:center;justify-content:center;
    cursor:pointer;border:none;padding:0;
    box-shadow:0 10px 34px rgba(0,0,0,0.6),
      0 0 0 8px rgba(245,243,238,0.14),
      0 0 0 18px rgba(245,243,238,0.07);
    touch-action:none;
    transition:transform 0.25s cubic-bezier(.22,1,.36,1);
  `;
}

// Pin matching design-preview.html: rounded square head + triangle tail + center dot + halo
const pinSVG = `
<svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="30" height="30" rx="11" fill="#F5F3EE"/>
  <path d="M15 40 L10 30 H20 Z" fill="#F5F3EE"/>
  <circle cx="15" cy="15" r="3" fill="#060606"/>
</svg>`;

