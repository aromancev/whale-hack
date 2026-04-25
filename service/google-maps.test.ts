import { describe, expect, it } from "vitest";
import type { Address } from "@/domain/case";
import { createAddressFromGeocoderResult, createGoogleMapsEmbedUrl, createGoogleMapsQuery, createGoogleMapsSearchUrl } from "./google-maps";

describe("google maps service", () => {
  it("builds a text query from address parts", () => {
    expect(createGoogleMapsQuery(createAddress())).toBe(
      "Near Vondelpark, Oud-West, Amsterdam, Noord-Holland, nl",
    );
  });

  it("prefers coordinates when they are available", () => {
    expect(createGoogleMapsQuery(createAddress({
      coordinates: {
        latitude: 52.3584,
        longitude: 4.8811,
      },
    }))).toBe("52.3584,4.8811");
  });

  it("builds reusable map urls", () => {
    expect(createGoogleMapsEmbedUrl(createAddress())).toContain("https://www.google.com/maps?output=embed&q=");
    expect(createGoogleMapsSearchUrl(createAddress())).toContain("https://www.google.com/maps/search/?api=1&query=");
  });

  it("uses the Maps Embed API when a key is provided", () => {
    expect(createGoogleMapsEmbedUrl(createAddress(), { apiKey: "test-key" })).toContain(
      "https://www.google.com/maps/embed/v1/place?key=test-key&q=",
    );
  });

  it("maps geocoder results back to intake address fields", () => {
    expect(createAddressFromGeocoderResult({
      formatted_address: "Vondelpark 1, 1071 AA Amsterdam, Netherlands",
      address_components: [
        { long_name: "1", short_name: "1", types: ["street_number"] },
        { long_name: "Vondelpark", short_name: "Vondelpark", types: ["route"] },
        { long_name: "Amsterdam", short_name: "Amsterdam", types: ["locality"] },
        { long_name: "Noord-Holland", short_name: "NH", types: ["administrative_area_level_1"] },
        { long_name: "Netherlands", short_name: "NL", types: ["country"] },
        { long_name: "1071 AA", short_name: "1071 AA", types: ["postal_code"] },
      ],
    }, { latitude: 52.3584, longitude: 4.8811 })).toEqual({
      country: "nl",
      city: "Amsterdam",
      region: "Noord-Holland",
      district: undefined,
      postal_code: "1071 AA",
      street: "Vondelpark",
      house_number: "1",
      full_address: "Vondelpark 1, 1071 AA Amsterdam, Netherlands",
      coordinates: { latitude: 52.3584, longitude: 4.8811 },
    });
  });
});

function createAddress(overrides: Partial<Address> = {}): Address {
  return {
    country: "nl",
    city: "Amsterdam",
    region: "Noord-Holland",
    district: "Oud-West",
    full_address: "Near Vondelpark",
    ...overrides,
  };
}
