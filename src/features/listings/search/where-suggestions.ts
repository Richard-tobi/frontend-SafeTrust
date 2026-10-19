import type { ApartmentListing } from "@/types/hotel";
import type { Location } from "@/types/destination";
import type { Place } from "@/types/destination";
import { DEMO_PLACES } from "@/lib/mockData/places";
import { normalizeSearchText } from "@/lib/text";

export type WhereSuggestion =
  | { kind: "province"; location: Location; label: string; count: number }
  | { kind: "place"; place: Place; label: string; count: number }
  | { kind: "listing"; id: string; label: string };

const MAX_SUGGESTIONS = 8;

const PROVINCES: Location[] = [
  "San José",
  "Alajuela",
  "Cartago",
  "Heredia",
  "Guanacaste",
  "Puntarenas",
  "Limón",
];

function matchRank(needle: string, values: string[]): number | null {
  if (!needle) return 0;
  let best: number | null = null;
  for (const raw of values) {
    const value = normalizeSearchText(raw);
    if (!value) continue;
    if (value.startsWith(needle)) {
      if (best === null || best > 1) best = 1;
    } else if (value.includes(needle)) {
      if (best === null) best = 2;
    }
  }
  return best;
}

function countForProvince(location: Location, listings: ApartmentListing[]): number {
  return listings.filter((l) => l.location === location).length;
}

function countForPlace(place: Place, listings: ApartmentListing[]): number {
  return listings.filter((l) => l.placeId === place.id).length;
}

export function whereSuggestions(
  text: string,
  listings: ApartmentListing[],
): WhereSuggestion[] {
  const needle = normalizeSearchText(text);

  const provinceResults: Array<{
    rank: number;
    suggestion: WhereSuggestion;
  }> = [];
  for (const location of PROVINCES) {
    const rank = matchRank(needle, [location]);
    if (rank === null) continue;
    const count = countForProvince(location, listings);
    if (count === 0) continue;
    provinceResults.push({
      rank,
      suggestion: { kind: "province", location, label: location, count },
    });
  }
  provinceResults.sort((a, b) => a.rank - b.rank);

  const placeResults: Array<{
    rank: number;
    suggestion: WhereSuggestion;
  }> = [];
  for (const place of DEMO_PLACES) {
    const rank = matchRank(needle, [place.name, ...(place.aliases ?? [])]);
    if (rank === null) continue;
    const count = countForPlace(place, listings);
    if (count === 0) continue;
    placeResults.push({
      rank,
      suggestion: { kind: "place", place, label: place.name, count },
    });
  }
  placeResults.sort((a, b) => a.rank - b.rank);

  const listingResults: Array<{
    rank: number;
    suggestion: WhereSuggestion;
  }> = [];
  for (const listing of listings) {
    const rank = matchRank(needle, [listing.name]);
    if (rank === null) continue;
    listingResults.push({
      rank,
      suggestion: { kind: "listing", id: listing.id, label: listing.name },
    });
  }
  listingResults.sort((a, b) => a.rank - b.rank);

  return [...provinceResults, ...placeResults, ...listingResults]
    .map((r) => r.suggestion)
    .slice(0, MAX_SUGGESTIONS);
}
