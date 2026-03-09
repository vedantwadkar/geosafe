import { fetch } from 'expo/fetch';
import { getApiUrl } from './query-client';

export interface SafetyPrediction {
  safety_score: number;
}

export async function fetchSafetyScore(lat: number, lng: number): Promise<SafetyPrediction> {
  const baseUrl = getApiUrl();
  const url = new URL('/api/predict', baseUrl);

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, long: lng }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch safety score: ${text}`);
  }

  return await res.json() as SafetyPrediction;
}

export function getSafetyLevel(score: number): { label: string; color: string; bg: string } {
  if (score >= 8) return { label: 'Safe Area', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.15)' };
  if (score >= 5) return { label: 'Moderate Risk', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
  return { label: 'High Risk Area', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
}
