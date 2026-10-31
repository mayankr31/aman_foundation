/**
 * Small client-side reverse-geocoding helper with an in-memory cache.
 * Coordinates are rounded before caching so tiny GPS jitter still reuses
 * the same lookup. Requests are queued to respect Nominatim's rate limit.
 */

const cache = new Map();
let lastRequestAt = 0;
let requestQueue = Promise.resolve();

function cacheKey(lat, lng) {
  return `${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function enqueue(task) {
  const run = requestQueue.then(async () => {
    const delay = Math.max(0, 1100 - (Date.now() - lastRequestAt));
    if (delay > 0) await wait(delay);
    lastRequestAt = Date.now();
    return task();
  });
  requestQueue = run.catch(() => {});
  return run;
}

/**
 * Resolves a coordinate pair to a display address.
 * Returns `null` when the lookup fails so callers can show coordinates only.
 */
export async function reverseGeocode(lat, lng) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const key = cacheKey(latitude, longitude);
  if (cache.has(key)) return cache.get(key);

  return enqueue(async () => {
    if (cache.has(key)) return cache.get(key);

    try {
      const params = new URLSearchParams({
        format: "json",
        lat: String(latitude),
        lon: String(longitude),
        zoom: "18",
        addressdetails: "1",
        "accept-language": "en",
      });
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`Reverse geocode failed (${res.status})`);
      const data = await res.json();
      const address = data?.display_name || null;
      if (address) cache.set(key, address);
      return address;
    } catch (error) {
      console.warn("Reverse geocode failed:", error);
      return null;
    }
  });
}
