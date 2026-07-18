"use client";

import { useCallback, useState } from "react";

export interface GeoCoords {
  latitude: number;
  longitude: number;
}

export type GeolocationStatus = "idle" | "locating" | "success" | "error";

interface UseGeolocationResult {
  status: GeolocationStatus;
  coords: GeoCoords | null;
  error: string | null;
  /** Requests the current position once. Resolves with coords or throws. */
  locate: () => Promise<GeoCoords>;
}

/**
 * Wraps the browser Geolocation API for one-shot position requests.
 * Notes are pinned to wherever the user is standing at the moment they
 * post — this hook is the only source of that location, and callers must
 * not let it be edited afterward.
 */
export function useGeolocation(): UseGeolocationResult {
  const [status, setStatus] = useState<GeolocationStatus>("idle");
  const [coords, setCoords] = useState<GeoCoords | null>(null);
  const [error, setError] = useState<string | null>(null);

  const locate = useCallback((): Promise<GeoCoords> => {
    setStatus("locating");
    setError(null);

    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        const message = "Your browser doesn't support location access.";
        setError(message);
        setStatus("error");
        reject(new Error(message));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const next: GeoCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setCoords(next);
          setStatus("success");
          resolve(next);
        },
        (err) => {
          const message =
            err.code === err.PERMISSION_DENIED
              ? "Location access was denied. Enable it to post a note."
              : "Couldn't get your location. Try again.";
          setError(message);
          setStatus("error");
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        },
      );
    });
  }, []);

  return { status, coords, error, locate };
}
