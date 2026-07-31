"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import L from "leaflet";

// Fix Leaflet default icon issue in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface LeafletMapProps {
  center: [number, number];
  marker: [number, number] | null;
  onMapClick: (lat: number, lng: number) => void;
}

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LeafletMap({ center, marker, onMapClick }: LeafletMapProps) {
  return (
    <div className="h-80 rounded-lg overflow-hidden border border-steel-border/20 relative z-0">
      <MapContainer
        center={center}
        zoom={13}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {marker && <Marker position={marker} />}
        <ClickHandler onMapClick={onMapClick} />
      </MapContainer>
    </div>
  );
}
