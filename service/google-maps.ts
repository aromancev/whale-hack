import type { Address } from "@/domain/case";

const googleMapsBaseUrl = "https://www.google.com/maps";
const googleMapsScriptId = "google-maps-js-api";

type GoogleMapsWindow = Window & {
  google?: {
    maps?: {
      ControlPosition: { TOP_CENTER: number };
      Geocoder: new () => GoogleMapsGeocoder;
      Map: new (element: HTMLElement, options: GoogleMapsMapOptions) => GoogleMapsMap;
      Marker: new (options: GoogleMapsMarkerOptions) => GoogleMapsMarker;
    };
  };
};

type GoogleMapsLatLng = {
  lat: () => number;
  lng: () => number;
};

type GoogleMapsLatLngLiteral = {
  lat: number;
  lng: number;
};

type GoogleMapsMap = {
  addListener: (eventName: "click", listener: (event: { latLng?: GoogleMapsLatLng }) => void) => { remove: () => void };
  controls: { push: (element: HTMLElement) => void }[];
  getCenter: () => GoogleMapsLatLng | null | undefined;
  setCenter: (position: GoogleMapsLatLngLiteral) => void;
};

type GoogleMapsMarker = {
  addListener: (eventName: "dragend", listener: (event: { latLng?: GoogleMapsLatLng }) => void) => { remove: () => void };
  setPosition: (position: GoogleMapsLatLngLiteral) => void;
};

type GoogleMapsMapOptions = {
  center: GoogleMapsLatLngLiteral;
  zoom: number;
  mapTypeControl: boolean;
  streetViewControl: boolean;
  fullscreenControl: boolean;
};

type GoogleMapsMarkerOptions = {
  draggable?: boolean;
  map: GoogleMapsMap;
  position: GoogleMapsLatLngLiteral;
};

type GoogleMapsGeocoder = {
  geocode: (request: { location: GoogleMapsLatLngLiteral }, callback: (results: GoogleMapsGeocoderResult[] | null, status: string) => void) => void;
};

export type GoogleMapsApi = NonNullable<NonNullable<GoogleMapsWindow["google"]>["maps"]>;

export type GoogleMapsGeocoderResult = {
  formatted_address?: string;
  address_components?: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
};

export function createGoogleMapsEmbedUrl(address: Address, options: { apiKey?: string } = {}) {
  const query = createGoogleMapsQuery(address);

  if (!query) {
    return null;
  }

  if (options.apiKey) {
    const params = new URLSearchParams({
      key: options.apiKey,
      q: query,
    });

    return `${googleMapsBaseUrl}/embed/v1/place?${params.toString()}`;
  }

  const params = new URLSearchParams({
    output: "embed",
    q: query,
  });

  return `${googleMapsBaseUrl}?${params.toString()}`;
}

export function createGoogleMapsSearchUrl(address: Address) {
  const query = createGoogleMapsQuery(address);

  if (!query) {
    return null;
  }

  const params = new URLSearchParams({
    api: "1",
    query,
  });

  return `${googleMapsBaseUrl}/search/?${params.toString()}`;
}

export function createGoogleMapsQuery(address: Address) {
  if (address.coordinates) {
    return `${address.coordinates.latitude},${address.coordinates.longitude}`;
  }

  return [
    address.full_address,
    address.street,
    address.house_number,
    address.district,
    address.city,
    address.region,
    address.postal_code,
    address.country,
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ") || null;
}

export function loadGoogleMapsApi(apiKey: string) {
  const win = window as GoogleMapsWindow;

  if (win.google?.maps) {
    return Promise.resolve(win.google.maps);
  }

  return new Promise<GoogleMapsApi>((resolve, reject) => {
    const existingScript = document.getElementById(googleMapsScriptId) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (win.google?.maps) {
          resolve(win.google.maps);
        } else {
          reject(new Error("Google Maps API loaded without maps support."));
        }
      });
      existingScript.addEventListener("error", () => reject(new Error("Google Maps API failed to load.")));
      return;
    }

    const script = document.createElement("script");
    script.id = googleMapsScriptId;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?${new URLSearchParams({ key: apiKey }).toString()}`;
    script.addEventListener("load", () => {
      if (win.google?.maps) {
        resolve(win.google.maps);
      } else {
        reject(new Error("Google Maps API loaded without maps support."));
      }
    });
    script.addEventListener("error", () => reject(new Error("Google Maps API failed to load.")));
    document.head.append(script);
  });
}

export function createAddressFromGeocoderResult(result: GoogleMapsGeocoderResult | null, coordinates: Address["coordinates"]): Partial<Address> {
  const components = result?.address_components ?? [];

  return {
    country: getSupportedCountry(getAddressComponent(components, "country", "short_name")),
    city: getAddressComponent(components, "locality") ?? getAddressComponent(components, "postal_town") ?? getAddressComponent(components, "administrative_area_level_2"),
    region: getAddressComponent(components, "administrative_area_level_1"),
    district: getAddressComponent(components, "sublocality") ?? getAddressComponent(components, "neighborhood"),
    postal_code: getAddressComponent(components, "postal_code"),
    street: getAddressComponent(components, "route"),
    house_number: getAddressComponent(components, "street_number"),
    full_address: result?.formatted_address,
    coordinates,
  };
}

export function reverseGeocodeLocation(maps: GoogleMapsApi, coordinates: NonNullable<Address["coordinates"]>) {
  const geocoder = new maps.Geocoder();

  return new Promise<Partial<Address>>((resolve) => {
    geocoder.geocode(
      { location: { lat: coordinates.latitude, lng: coordinates.longitude } },
      (results, status) => {
        if (status !== "OK") {
          resolve({ coordinates });
          return;
        }

        resolve(createAddressFromGeocoderResult(results?.[0] ?? null, coordinates));
      },
    );
  });
}

function getSupportedCountry(value: string | undefined): Address["country"] | undefined {
  return value?.toLowerCase() === "nl" ? "nl" : undefined;
}

function getAddressComponent(
  components: NonNullable<GoogleMapsGeocoderResult["address_components"]>,
  type: string,
  name: "long_name" | "short_name" = "long_name",
) {
  return components.find((component) => component.types.includes(type))?.[name];
}
