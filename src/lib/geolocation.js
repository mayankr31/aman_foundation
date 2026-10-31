/**
 * Client-side geolocation helpers.
 *
 * Browsers can return a coarse network-based fix (IP / Wi-Fi) when GPS is not
 * available. `getBestPosition` asks for a high-accuracy fix and keeps the most
 * accurate sample received during the collection window, so low-accuracy
 * fallbacks are not silently treated as exact locations.
 */

export const APPROXIMATE_ACCURACY_METERS = 500;

export function hasAccuracy(value) {
  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(Number(value))
  );
}

export function isApproximateAccuracy(accuracy) {
  return hasAccuracy(accuracy) && Number(accuracy) > APPROXIMATE_ACCURACY_METERS;
}

/** Human-readable coordinate label, e.g. `28.59827, 77.34032 · ±24 m`. */
export function formatCoordinates(lat, lng, accuracy) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return "";

  const coords = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  if (!hasAccuracy(accuracy)) return coords;

  return `${coords} · ±${Math.round(Number(accuracy))} m`;
}

/**
 * Collects the most accurate position available within `timeoutMs`.
 * Resolves with `{ position, error }` where position is
 * `{ lat, lng, accuracy }` or `null`.
 */
export function getBestPosition({
  timeoutMs = 12000,
  desiredAccuracy = 50,
} = {}) {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve({ position: null, error: "unsupported" });
  }

  return new Promise((resolve) => {
    let best = null;
    let settled = false;
    let watchId = null;
    let timer = null;

    const finish = (error = null) => {
      if (settled) return;
      settled = true;
      if (watchId !== null) {
        try {
          navigator.geolocation.clearWatch(watchId);
        } catch {
          // Ignore browsers that reject clearWatch for an already-cleared id.
        }
      }
      if (timer) clearTimeout(timer);
      resolve({ position: best, error: best ? null : error });
    };

    const onSuccess = (result) => {
      const coords = result?.coords;
      if (!coords) return;

      const candidate = {
        lat: Number(coords.latitude),
        lng: Number(coords.longitude),
        accuracy: Number(coords.accuracy),
      };
      if (!Number.isFinite(candidate.lat) || !Number.isFinite(candidate.lng)) return;

      if (!best || candidate.accuracy < best.accuracy) best = candidate;
      if (candidate.accuracy <= desiredAccuracy) finish();
    };

    const onError = (error) => {
      // Permission denied cannot improve by waiting.
      if (error?.code === 1) finish("denied");
    };

    try {
      watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: timeoutMs,
      });
    } catch {
      finish("unavailable");
      return;
    }

    timer = setTimeout(() => finish(best ? null : "timeout"), timeoutMs);
  });
}
