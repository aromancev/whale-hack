import { useCallback, useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import type { Address } from "@/domain/case";
import { createGoogleMapsEmbedUrl, type GoogleMapsApi, loadGoogleMapsApi, reverseGeocodeLocation } from "@/service/google-maps";

import { Field, TwoColumnFields } from "./fields";
import type { FieldErrorKey, UpdateLostPlace, UpdateLostPlaceFromMap } from "./types";

export function LastSeenStep({
  lostDate,
  lostTime,
  lostPlace,
  fieldErrors,
  updateLostDate,
  updateLostTime,
  updateLostPlace,
  updateLostPlaceFromMap,
}: {
  lostDate: string;
  lostTime: string;
  lostPlace: Address;
  fieldErrors: Partial<Record<FieldErrorKey, string>>;
  updateLostDate: (value: string) => void;
  updateLostTime: (value: string) => void;
  updateLostPlace: UpdateLostPlace;
  updateLostPlaceFromMap: UpdateLostPlaceFromMap;
}) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<{
    addListener: (eventName: "dragend", listener: (event: { latLng?: { lat: () => number; lng: () => number } }) => void) => { remove: () => void };
    setPosition: (position: { lat: number; lng: number }) => void;
  } | null>(null);
  const mapRef = useRef<{
    getCenter: () => { lat: () => number; lng: () => number } | null | undefined;
    setCenter: (position: { lat: number; lng: number }) => void;
  } | null>(null);
  const mapsApiRef = useRef<GoogleMapsApi | null>(null);
  const currentCoordinatesRef = useRef<Address["coordinates"]>(null);
  const updateLostPlaceFromMapRef = useRef(updateLostPlaceFromMap);
  const [mapError, setMapError] = useState("");
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapEmbedUrl = createGoogleMapsEmbedUrl(lostPlace, {
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  });
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const currentCoordinates = lostPlace.coordinates ?? null;
  const currentLatitude = currentCoordinates?.latitude;
  const currentLongitude = currentCoordinates?.longitude;

  useEffect(() => {
    updateLostPlaceFromMapRef.current = updateLostPlaceFromMap;
  }, [updateLostPlaceFromMap]);

  useEffect(() => {
    currentCoordinatesRef.current = currentCoordinates;
  }, [currentCoordinates]);

  const setPinFromCoordinates = useCallback((latitude: number, longitude: number) => {
    const coordinates = { latitude, longitude };
    const position = { lat: coordinates.latitude, lng: coordinates.longitude };

    markerRef.current?.setPosition(position);
    mapRef.current?.setCenter(position);
    setMapError("");

    if (!mapsApiRef.current) {
      updateLostPlaceFromMapRef.current({ coordinates });
      return;
    }

    reverseGeocodeLocation(mapsApiRef.current, coordinates)
      .then((place) => updateLostPlaceFromMapRef.current({ ...place, coordinates }))
      .catch(() => updateLostPlaceFromMapRef.current({ coordinates }));
  }, []);

  const setPinFromMapCenter = useCallback(() => {
    const center = mapRef.current?.getCenter();

    if (!center) {
      setMapError("Move the map first, then use the center as the pin.");
      return;
    }

    setPinFromCoordinates(center.lat(), center.lng());
  }, [setPinFromCoordinates]);

  useEffect(() => {
    if (!mapsApiKey || !mapElementRef.current) {
      return;
    }

    let ignore = false;
    const listeners: { remove: () => void }[] = [];

    loadGoogleMapsApi(mapsApiKey)
      .then((maps) => {
        if (ignore || !mapElementRef.current) {
          return;
        }

        const initialCoordinates = currentCoordinatesRef.current;
        const center = initialCoordinates
          ? { lat: initialCoordinates.latitude, lng: initialCoordinates.longitude }
          : { lat: 52.3676, lng: 4.9041 };
        const map = new maps.Map(mapElementRef.current, {
          center,
          zoom: initialCoordinates ? 16 : 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        const marker = new maps.Marker({ draggable: true, map, position: center });

        mapsApiRef.current = maps;
        mapRef.current = map;
        markerRef.current = marker;
        setMapLoaded(true);
        setMapError("");
        listeners.push(map.addListener("click", (event) => {
          if (!event.latLng) {
            return;
          }

          setPinFromCoordinates(event.latLng.lat(), event.latLng.lng());
        }));
        listeners.push(marker.addListener("dragend", (event) => {
          if (!event.latLng) {
            return;
          }

          setPinFromCoordinates(event.latLng.lat(), event.latLng.lng());
        }));
      })
      .catch(() => setMapError("We couldn't load Google Maps. Please check the API key and try again."));

    return () => {
      ignore = true;
      listeners.forEach((listener) => listener.remove());
    };
  }, [mapsApiKey, setPinFromCoordinates]);

  useEffect(() => {
    if (currentLatitude === undefined || currentLongitude === undefined || !markerRef.current || !mapRef.current) {
      return;
    }

    const position = { lat: currentLatitude, lng: currentLongitude };
    markerRef.current.setPosition(position);
    mapRef.current.setCenter(position);
  }, [currentLatitude, currentLongitude]);

  return (
    <div className="space-y-5">
      <TwoColumnFields>
        <Field label="Date last seen" required error={fieldErrors.lostDate}>
          <Input type="date" value={lostDate} onChange={(event) => updateLostDate(event.target.value)} aria-invalid={Boolean(fieldErrors.lostDate)} />
        </Field>
        <Field label="Approximate time">
          <Input type="time" value={lostTime} onChange={(event) => updateLostTime(event.target.value)} />
        </Field>
      </TwoColumnFields>
      <TwoColumnFields>
        <Field label="Country">
          <Input value={lostPlace.country.toUpperCase()} readOnly aria-readonly="true" className="bg-white/60 text-[#74675d]" />
        </Field>
        <Field label="City" required error={fieldErrors["lost_place.city"]}>
          <Input value={lostPlace.city} onChange={(event) => updateLostPlace("city", event.target.value)} placeholder="Brooklyn" aria-invalid={Boolean(fieldErrors["lost_place.city"])} />
        </Field>
      </TwoColumnFields>
      {mapsApiKey ? (
        <div className="overflow-hidden rounded-[1.5rem] border border-[#eadfce] bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-sm font-black text-[#2d251f]">Set the last-seen pin</p>
              <p className="text-xs font-semibold text-[#74675d]">Click the map, drag the pin, or use the center point.</p>
            </div>
          </div>
          <div className="relative">
            <div ref={mapElementRef} className="h-64 w-full bg-[#efe5d8] sm:h-72" aria-label="Last seen location picker" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-full flex-col items-center" aria-hidden="true">
              <div className="size-6 rounded-full border-4 border-white bg-[#d07b47] shadow-lg shadow-black/25" />
              <div className="h-5 w-1 bg-[#d07b47] shadow-lg shadow-black/20" />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <p className="text-xs font-semibold text-[#74675d]">
              {mapLoaded ? "Move the map until the crosshair is on the last-seen spot." : "Loading interactive map..."}
            </p>
            <button className="rounded-full bg-[#fff2d0] px-3 py-1.5 text-xs font-black text-[#7a4b21] hover:bg-[#ffe6a8]" type="button" onClick={setPinFromMapCenter}>
              Set pin at crosshair
            </button>
          </div>
          {currentCoordinates ? (
            <p className="px-4 pb-3 text-xs font-semibold text-[#74675d]">
              Pin set at {currentCoordinates.latitude.toFixed(5)}, {currentCoordinates.longitude.toFixed(5)}.
            </p>
          ) : null}
          {mapError ? <p className="px-4 pb-3 text-xs font-bold text-red-600">{mapError}</p> : null}
        </div>
      ) : mapEmbedUrl ? (
        <div className="overflow-hidden rounded-[1.5rem] border border-[#eadfce] bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-sm font-black text-[#2d251f]">Map preview</p>
            </div>
          </div>
          <iframe
            className="h-56 w-full border-0 sm:h-64"
            src={mapEmbedUrl}
            title="Last seen location map"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : null}
    </div>
  );
}
