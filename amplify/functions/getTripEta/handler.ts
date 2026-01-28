/**
 * Get Trip ETA Lambda Handler
 * Returns driving ETA from origin (lat,lng) to destination (lat,lng) using OSRM.
 * Used by VehicleTrackingMap to show "ETA to dropoff" for active trips.
 */

import type { Handler } from 'aws-lambda';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
};

interface EtaResponse {
  durationMinutes: number;
  distanceKm: number;
}

interface EtaErrorResponse {
  error: string;
}

function parseParams(event: { queryStringParameters?: Record<string, string>; body?: string }): { originLat: number; originLng: number; destLat: number; destLng: number } | null {
  const q = event.queryStringParameters;
  if (q?.originLat != null && q?.originLng != null && q?.destLat != null && q?.destLng != null) {
    const originLat = parseFloat(q.originLat);
    const originLng = parseFloat(q.originLng);
    const destLat = parseFloat(q.destLat);
    const destLng = parseFloat(q.destLng);
    if (!Number.isNaN(originLat) && !Number.isNaN(originLng) && !Number.isNaN(destLat) && !Number.isNaN(destLng)) {
      return { originLat, originLng, destLat, destLng };
    }
  }
  if (event.body) {
    try {
      const b = JSON.parse(event.body) as Record<string, unknown>;
      const originLat = Number(b.originLat);
      const originLng = Number(b.originLng);
      const destLat = Number(b.destLat);
      const destLng = Number(b.destLng);
      if (!Number.isNaN(originLat) && !Number.isNaN(originLng) && !Number.isNaN(destLat) && !Number.isNaN(destLng)) {
        return { originLat, originLng, destLat, destLng };
      }
    } catch (_) {
      // ignore
    }
  }
  return null;
}

export const handler: Handler = async (event) => {
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const params = parseParams(event);
  if (!params) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Missing or invalid originLat, originLng, destLat, destLng' } as EtaErrorResponse),
    };
  }

  const { originLat, originLng, destLat, destLng } = params;
  // OSRM format: longitude,latitude;longitude,latitude
  const coords = `${originLng},${originLat};${destLng},${destLat}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=false`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'OnyxTransportationApp/1.0 (ETA)' },
    });

    if (!res.ok) {
      return {
        statusCode: 502,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: `OSRM returned ${res.status}` } as EtaErrorResponse),
      };
    }

    const data = (await res.json()) as { routes?: Array<{ duration: number; distance: number }>; code?: string };
    const route = data.routes?.[0];
    if (!route) {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'No route found' } as EtaErrorResponse),
      };
    }

    const durationMinutes = Math.round(route.duration / 60);
    const distanceKm = Math.round((route.distance / 1000) * 10) / 10;

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ durationMinutes, distanceKm } as EtaResponse),
    };
  } catch (err) {
    console.error('getTripEta error:', err);
    return {
      statusCode: 502,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err instanceof Error ? err.message : 'ETA request failed' } as EtaErrorResponse),
    };
  }
};
