import type { ApartmentListing } from "@/types/hotel";
import { STUB_HOTELS } from "@/lib/mockData/apartmentListings";
import type { HotelSearch } from "./search-params";

export function searchHotels({ where }: HotelSearch): ApartmentListing[] {
  const q = where.toLocaleLowerCase("es-CR");
  if (!q) return STUB_HOTELS;
  return STUB_HOTELS.filter((hotel) =>
    `${hotel.name} ${hotel.address} ${hotel.location}`
      .toLocaleLowerCase("es-CR")
      .includes(q),
  );
}
