"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type GeoPoint = { type: "Point"; coordinates: [number, number] } | null;

interface LocationPickerProps {
  value: GeoPoint;
  onChange: (value: GeoPoint) => void;
}

const defaultCenter: [number, number] = [35.6892, 51.3890];

const LeafletMap = dynamic(
  () => import("./leaflet-map"),
  { ssr: false, loading: () => (
    <div className="h-80 rounded-lg border border-steel-border/20 bg-white/[0.02] flex items-center justify-center">
      <span className="text-xs text-fog/40">بارگذاری نقشه...</span>
    </div>
  )}
);

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [marker, setMarker] = useState<[number, number] | null>(
    value ? [value.coordinates[1], value.coordinates[0]] : null
  );
  const [lngInput, setLngInput] = useState(value ? String(value.coordinates[0]) : "");
  const [latInput, setLatInput] = useState(value ? String(value.coordinates[1]) : "");

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setMarker([lat, lng]);
    setLngInput(String(lng));
    setLatInput(String(lat));
    onChange({ type: "Point", coordinates: [lng, lat] });
  }, [onChange]);

  const handleCoordinateChange = (lng: string, lat: string) => {
    setLngInput(lng);
    setLatInput(lat);
    const lngNum = parseFloat(lng);
    const latNum = parseFloat(lat);
    if (!isNaN(lngNum) && !isNaN(latNum)) {
      setMarker([latNum, lngNum]);
      onChange({ type: "Point", coordinates: [lngNum, latNum] });
    }
  };

  const handleLocateMe = () => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setMarker([lat, lng]);
          setLngInput(String(lng));
          setLatInput(String(lat));
          onChange({ type: "Point", coordinates: [lng, lat] });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-fog/50 mb-1 block">طول جغرافیایی (Longitude)</label>
            <Input
              value={lngInput}
              onChange={(e) => handleCoordinateChange(e.target.value, latInput)}
              placeholder="مثال: 51.3890"
              type="number"
              step="any"
              dir="ltr"
            />
          </div>
          <div>
            <label className="text-xs text-fog/50 mb-1 block">عرض جغرافیایی (Latitude)</label>
            <Input
              value={latInput}
              onChange={(e) => handleCoordinateChange(lngInput, e.target.value)}
              placeholder="مثال: 35.6892"
              type="number"
              step="any"
              dir="ltr"
            />
          </div>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={handleLocateMe} className="mt-5 shrink-0" title="موقعیت فعلی من">
          <Crosshair className="size-4" />
        </Button>
      </div>

      <LeafletMap
        center={marker || defaultCenter}
        marker={marker}
        onMapClick={handleMapClick}
      />
    </div>
  );
}

export type { GeoPoint };
