/**
 * Trip ETA utility - fetches driving ETA from origin to destination via getTripEta Lambda (OSRM).
 * Used by VehicleTrackingMap to show "ETA to dropoff".
 */

const ETA_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
const cache = new Map<string, { durationMinutes: number; fetchedAt: number }>();

function getEtaFunctionUrl(): string | null {
  if (import.meta.env.VITE_ETA_FUNCTION_URL) {
    return import.meta.env.VITE_ETA_FUNCTION_URL as string;
  }
  return null;
}

export interface EtaResult {
  durationMinutes: number;
  distanceKm: number;
}

/**
 * Fetch driving ETA from origin (lat, lng) to destination (lat, lng).
 * Returns null if URL not configured, request fails, or no route found.
 */
export async function fetchEtaToDropoff(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<EtaResult | null> {
  const url = getEtaFunctionUrl();
  if (!url) return null;

  const cacheKey = `${originLat.toFixed(4)},${originLng.toFixed(4)},${destLat.toFixed(4)},${destLng.toFixed(4)}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < ETA_CACHE_TTL_MS) {
    return { durationMinutes: cached.durationMinutes, distanceKm: 0 };
  }

  try {
    const params = new URLSearchParams({
      originLat: String(originLat),
      originLng: String(originLng),
      destLat: String(destLat),
      destLng: String(destLng),
    });
    const res = await fetch(`${url}?${params.toString()}`, { method: 'GET' });
    if (!res.ok) return null;
    const data = (await res.json()) as { durationMinutes?: number; distanceKm?: number; error?: string };
    if (data.error || data.durationMinutes == null) return null;
    const result: EtaResult = {
      durationMinutes: data.durationMinutes,
      distanceKm: data.distanceKm ?? 0,
    };
    cache.set(cacheKey, { durationMinutes: result.durationMinutes, fetchedAt: Date.now() });
    return result;
  } catch {
    return null;
  }
}
