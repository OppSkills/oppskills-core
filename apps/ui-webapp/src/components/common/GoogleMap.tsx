import React from "react";

interface GoogleMapProps {
  apiKey?: string;
  coords?: string | null;
  className?: string;
}

export function GoogleMap({ apiKey, coords, className }: GoogleMapProps) {
  if (!apiKey || !coords) {
    return null;
  }

  // Ensure it matches the coords format "lat,lng"
  const cleanCoords = coords.trim();
  if (!/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(cleanCoords)) {
    return null;
  }

  const encodedCoords = encodeURIComponent(cleanCoords);
  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedCoords}`;

  return (
    <div
      className={
        className ||
        "w-full h-[400px] rounded-2xl overflow-hidden border border-neutral-200 shadow-sm bg-neutral-50"
      }
    >
      <iframe
        title="Location Map"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        src={embedUrl}
      />
    </div>
  );
}
