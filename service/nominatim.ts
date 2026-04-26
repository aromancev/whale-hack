import type { Address } from "@/domain/case";

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  suburb?: string;
  neighbourhood?: string;
  city_district?: string;
  road?: string;
  house_number?: string;
  postcode?: string;
  country_code?: string;
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name?: string;
  address?: NominatimAddress;
};

export async function searchNominatim(query: string, countryCode?: Address["country"]) {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    limit: "5",
  });

  if (countryCode) {
    params.set("countrycodes", countryCode);
  }

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Nominatim search failed.");
  }

  const results = await response.json() as NominatimResult[];
  return results.map((result) => ({
    label: result.display_name ?? `${result.lat}, ${result.lon}`,
    place: createAddressFromNominatimResult(result, {
      latitude: Number(result.lat),
      longitude: Number(result.lon),
    }),
  }));
}

export async function reverseGeocodeNominatim(coordinates: NonNullable<Address["coordinates"]>) {
  const params = new URLSearchParams({
    lat: String(coordinates.latitude),
    lon: String(coordinates.longitude),
    format: "jsonv2",
    addressdetails: "1",
    zoom: "18",
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Nominatim reverse geocode failed.");
  }

  const result = await response.json() as NominatimResult;
  return createAddressFromNominatimResult(result, coordinates);
}

export function createAddressFromNominatimResult(
  result: Pick<NominatimResult, "display_name" | "address">,
  coordinates: NonNullable<Address["coordinates"]>,
): Partial<Address> & { coordinates: NonNullable<Address["coordinates"]> } {
  const address = result.address ?? {};

  return {
    country: getSupportedCountry(address.country_code),
    city: address.city ?? address.town ?? address.village ?? address.municipality ?? address.county,
    region: address.state,
    district: address.suburb ?? address.neighbourhood ?? address.city_district,
    street: address.road,
    house_number: address.house_number,
    postal_code: address.postcode,
    full_address: result.display_name,
    coordinates,
  };
}

function getSupportedCountry(value?: string): Address["country"] | undefined {
  return value?.toLowerCase() === "nl" ? "nl" : undefined;
}
