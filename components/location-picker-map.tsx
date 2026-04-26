"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl, { type StyleSpecification } from "maplibre-gl";

import { Input } from "@/components/ui/input";
import type { Address } from "@/domain/case";
import { reverseGeocodeNominatim, searchNominatim } from "@/service/nominatim";

const amsterdamCoordinates = { latitude: 52.3676, longitude: 4.9041 };
const mapStyle: StyleSpecification = {
  version: 8,
  sources: {
    "openstreetmap-tiles": {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: "openstreetmap-tiles",
      type: "raster",
      source: "openstreetmap-tiles",
    },
  ],
};

export function LocationPickerMap({
  country,
  coordinates,
  onLocationChange,
  title = "Set the location pin",
  description = "Drag the marker or tap the map to place it.",
  autoFillAddressDetails = false,
}: {
  country: Address["country"];
  coordinates: Address["coordinates"] | null | undefined;
  onLocationChange: (place: Partial<Address> & { coordinates: NonNullable<Address["coordinates"]> }) => void;
  title?: string;
  description?: string;
  autoFillAddressDetails?: boolean;
}) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const currentCoordinatesRef = useRef<Address["coordinates"]>(null);
  const onLocationChangeRef = useRef(onLocationChange);
  const reverseLookupIdRef = useRef(0);
  const [mapError, setMapError] = useState("");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    currentCoordinatesRef.current = coordinates ?? null;
  }, [coordinates]);

  const setPinFromCoordinates = useCallback(async (
    latitude: number,
    longitude: number,
    options?: { hydrateAddress?: boolean },
  ) => {
    const nextCoordinates = { latitude, longitude };
    const position: [number, number] = [longitude, latitude];

    markerRef.current?.setLngLat(position);
    mapRef.current?.setCenter(position);
    setMapError("");

    if (!options?.hydrateAddress) {
      onLocationChangeRef.current({ coordinates: nextCoordinates });
      return;
    }

    const lookupId = reverseLookupIdRef.current + 1;
    reverseLookupIdRef.current = lookupId;

    try {
      const place = await reverseGeocodeNominatim(nextCoordinates);

      if (reverseLookupIdRef.current !== lookupId) {
        return;
      }

      onLocationChangeRef.current(place);
    } catch {
      if (reverseLookupIdRef.current === lookupId) {
        onLocationChangeRef.current({ coordinates: nextCoordinates });
      }
    }
  }, []);

  const searchLocation = useCallback(async () => {
    const query = searchQuery.trim();

    if (!query) {
      setMapError("Enter an address, city, or place name to search.");
      return;
    }

    setIsSearching(true);
    setMapError("");

    try {
      const results = await searchNominatim(query, country);
      const result = results[0]?.place;

      if (!result?.coordinates) {
        setMapError("No matching location found. Try a more specific search.");
        return;
      }

      await setPinFromCoordinates(result.coordinates.latitude, result.coordinates.longitude, {
        hydrateAddress: autoFillAddressDetails,
      });
      mapRef.current?.flyTo({
        center: [result.coordinates.longitude, result.coordinates.latitude],
        zoom: 16,
      });
    } catch {
      setMapError("We couldn't search that address right now. Try again in a moment.");
    } finally {
      setIsSearching(false);
    }
  }, [autoFillAddressDetails, country, searchQuery, setPinFromCoordinates]);

  useEffect(() => {
    if (!mapElementRef.current) {
      return;
    }

    let ignore = false;
    const initialCoordinates = currentCoordinatesRef.current ?? amsterdamCoordinates;
    const initialCenter: [number, number] = [initialCoordinates.longitude, initialCoordinates.latitude];
    const map = new maplibregl.Map({
      container: mapElementRef.current,
      style: mapStyle,
      center: initialCenter,
      zoom: currentCoordinatesRef.current ? 16 : 12,
    });
    const marker = new maplibregl.Marker({
      draggable: true,
      color: "#d07b47",
    })
      .setLngLat(initialCenter)
      .addTo(map);

    mapRef.current = map;
    markerRef.current = marker;

    map.on("load", () => {
      if (ignore) {
        return;
      }

      setMapLoaded(true);
      setMapError("");
    });

    map.on("click", (event) => {
      void setPinFromCoordinates(event.lngLat.lat, event.lngLat.lng, {
        hydrateAddress: autoFillAddressDetails,
      });
    });

    marker.on("dragend", () => {
      const position = marker.getLngLat();

      void setPinFromCoordinates(position.lat, position.lng, {
        hydrateAddress: autoFillAddressDetails,
      });
    });

    if (!currentCoordinatesRef.current && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (ignore || currentCoordinatesRef.current) {
            return;
          }

          void setPinFromCoordinates(position.coords.latitude, position.coords.longitude, {
            hydrateAddress: autoFillAddressDetails,
          });
          map.flyTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: 16,
          });
        },
        () => {
          if (!ignore) {
            setMapError("We couldn't access your device location. Move the pin to the right spot.");
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        },
      );
    }

    return () => {
      ignore = true;
      markerRef.current = null;
      mapRef.current = null;
      map.remove();
    };
  }, [autoFillAddressDetails, setPinFromCoordinates]);

  useEffect(() => {
    if (!coordinates || !markerRef.current || !mapRef.current) {
      return;
    }

    const position: [number, number] = [coordinates.longitude, coordinates.latitude];
    markerRef.current.setLngLat(position);
    mapRef.current.setCenter(position);
  }, [coordinates]);

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-[#eadfce] bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-sm font-black text-[#2d251f]">{title}</p>
          <p className="text-xs font-semibold text-[#74675d]">{description}</p>
        </div>
      </div>
      <div ref={mapElementRef} className="h-64 w-full bg-[#efe5d8] sm:h-72" aria-label="Location picker" />
      <div className="px-4 py-3 text-xs font-semibold text-[#74675d]">
        {mapLoaded ? "The pin starts from the saved location or your device location when available." : "Loading interactive map..."}
      </div>
      <div className="flex flex-col gap-2 px-4 pb-3 sm:flex-row">
        <Input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void searchLocation();
            }
          }}
          placeholder="Search address or place"
          aria-label="Search for a location"
        />
        <button
          className="rounded-full bg-[#fff2d0] px-4 py-2 text-sm font-black text-[#7a4b21] hover:bg-[#ffe6a8] disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          onClick={() => void searchLocation()}
          disabled={isSearching}
        >
          {isSearching ? "Searching..." : "Search"}
        </button>
      </div>
      {coordinates ? (
        <p className="px-4 pb-3 text-xs font-semibold text-[#74675d]">
          Pin set at {coordinates.latitude.toFixed(5)}, {coordinates.longitude.toFixed(5)}.
        </p>
      ) : null}
      {mapError ? <p className="px-4 pb-3 text-xs font-bold text-red-600">{mapError}</p> : null}
    </div>
  );
}
