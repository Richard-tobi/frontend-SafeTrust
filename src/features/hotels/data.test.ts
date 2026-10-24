import { STUB_HOTELS } from "@/lib/mockData/apartmentListings";
import { searchHotels } from "./data";

const ALL = { where: "", from: null, to: null };

describe("searchHotels", () => {
  it("returns every fixture without a destination", () => {
    expect(searchHotels(ALL)).toEqual(STUB_HOTELS);
  });

  it("matches name, address or location case-insensitively", () => {
    expect(
      searchHotels({ ...ALL, where: "ESCALANTE" }).map((hotel) => hotel.id),
    ).toEqual(["1"]);
    expect(searchHotels({ ...ALL, where: "heredia" }).length).toBeGreaterThan(
      0,
    );
    expect(searchHotels({ ...ALL, where: "cartago" }).length).toBeGreaterThan(
      0,
    );
  });

  it("returns no stays for an unmatched destination", () => {
    expect(searchHotels({ ...ALL, where: "Atlantis" })).toEqual([]);
  });
});
