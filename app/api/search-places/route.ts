import { NextResponse } from "next/server";
import type { PlaceResult } from "@/lib/types";

/**
 * Proxies place search to OpenStreetMap's Nominatim API. Nominatim's usage
 * policy requires a descriptive User-Agent and no client-side heavy use, so
 * this route runs server-side and lets the browser avoid setting custom
 * headers cross-origin.
 * https://operations.osmfoundation.org/policies/nominatim/
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const nominatimUrl = new URL("https://nominatim.openstreetmap.org/search");
  nominatimUrl.searchParams.set("q", query);
  nominatimUrl.searchParams.set("format", "jsonv2");
  nominatimUrl.searchParams.set("limit", "6");

  try {
    const res = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "noted-app/1.0 (anonymous confessional map)",
        Accept: "application/json",
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = (await res.json()) as Array<{
      place_id: number;
      display_name: string;
      lat: string;
      lon: string;
    }>;

    const results: PlaceResult[] = data.map((place) => ({
      id: String(place.place_id),
      label: place.display_name,
      latitude: parseFloat(place.lat),
      longitude: parseFloat(place.lon),
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
