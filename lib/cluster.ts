import Supercluster from "supercluster";
import type { PointFeature, ClusterFeature } from "supercluster";
import { CLUSTER_MAX_ZOOM, CLUSTER_RADIUS_PX } from "@/lib/map-config";
import type { Note } from "@/lib/types";

export type NoteFeature = PointFeature<Note>;
export type NoteClusterFeature = ClusterFeature<Note> | NoteFeature;

function noteToFeature(note: Note): NoteFeature {
  return {
    type: "Feature",
    properties: note,
    geometry: {
      type: "Point",
      coordinates: [note.longitude, note.latitude],
    },
  };
}

/** Builds a fresh Supercluster index from the current set of notes. */
export function buildClusterIndex(notes: Note[]): Supercluster<Note> {
  const index = new Supercluster<Note>({
    radius: CLUSTER_RADIUS_PX,
    maxZoom: CLUSTER_MAX_ZOOM,
  });
  index.load(notes.map(noteToFeature));
  return index;
}

export function isCluster(
  feature: NoteClusterFeature,
): feature is ClusterFeature<Note> {
  return "cluster" in feature.properties && feature.properties.cluster === true;
}
