"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { reverseGeocode } from "@/lib/geocode";
import { formatCoordinates, hasAccuracy, isApproximateAccuracy } from "@/lib/geolocation";

/**
 * Renders the address, coordinates and accuracy for an attendance location.
 * Falls back to "Location not recorded" when no coordinates were captured.
 */
export default function AttendanceLocation({
  lat,
  lng,
  accuracy,
  className = "",
  loadingLabel = "Loading location...",
}) {
  const hasCoordinates =
    lat !== null && lat !== undefined && lng !== null && lng !== undefined;
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(hasCoordinates);

  useEffect(() => {
    if (!hasCoordinates) {
      setAddress(null);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    reverseGeocode(lat, lng)
      .then((value) => {
        if (!cancelled) setAddress(value);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasCoordinates, lat, lng]);

  if (!hasCoordinates) {
    return (
      <div className={`text-[10px] leading-tight text-slate-500 dark:text-slate-400 ${className}`}>
        Location not recorded
      </div>
    );
  }

  const approximate = isApproximateAccuracy(accuracy);
  const coordinates = formatCoordinates(lat, lng, accuracy);

  return (
    <div className={`space-y-1 text-[10px] leading-tight ${className}`}>
      <p className="break-words text-slate-500 dark:text-slate-400">
        {loading ? loadingLabel : address || "Address unavailable"}
      </p>
      {coordinates && (
        <p className="break-all font-medium text-slate-400 dark:text-slate-500">{coordinates}</p>
      )}
      {approximate && (
        <span className="inline-flex rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          Approximate location
        </span>
      )}
      {!hasAccuracy(accuracy) && (
        <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
          Accuracy not recorded
        </p>
      )}
    </div>
  );
}
