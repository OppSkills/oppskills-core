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

  // Ensure it matches the coords format "lat,lng" or "lat,lng,placeId"
  const cleanCoords = coords.trim();
  const parts = cleanCoords.split(",").map((p) => p.trim());
  const [lat, lng, placeId] = parts;
  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (isNaN(latNum) || isNaN(lngNum)) {
    return null;
  }

  let qValue = `${lat},${lng}`;
  if (placeId) {
    qValue = `place_id:${placeId}`;
  }
  const encodedQ = encodeURIComponent(qValue);
  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedQ}`;

  return (
    <div
      className={
        className ||
        "w-full aspect-[3/1] rounded-2xl overflow-hidden border border-neutral-200 shadow-sm bg-neutral-50"
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
