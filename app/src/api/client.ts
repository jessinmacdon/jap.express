import Constants from 'expo-constants';
import { Platform } from 'react-native';

// EXPO_PUBLIC_API_URL wins. Otherwise use the dev machine that serves the JS
// bundle (works on simulators and on a phone running Expo Go on the same Wi-Fi).
function defaultBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (Platform.OS === 'web') return 'http://localhost:4000';
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:4000`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
}

export const API_URL = defaultBaseUrl();

export class ApiError extends Error {
  constructor(public status: number, public code: string, message?: string) {
    super(message ?? code);
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;
export const setAuthToken = (t: string | null) => {
  authToken = t;
};
export const setOnUnauthorized = (fn: () => void) => {
  onUnauthorized = fn;
};

type Query = Record<string, string | number | boolean | undefined | null | string[]>;
const qs = (q?: Query) => {
  if (!q) return '';
  const parts = Object.entries(q)
    .filter(([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(Array.isArray(v) ? v.join(',') : String(v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
};

export async function api<T>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, opts: { body?: unknown; query?: Query } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}${qs(opts.query)}`, {
      method,
      headers: {
        ...(opts.body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'network');
  }
  const data = res.headers.get('content-type')?.includes('application/json') ? await res.json() : null;
  if (!res.ok) {
    if (res.status === 401) onUnauthorized?.();
    throw new ApiError(res.status, data?.error ?? 'error', data?.message);
  }
  return data as T;
}

export const get = <T>(path: string, query?: Query) => api<T>('GET', path, { query });
export const post = <T>(path: string, body?: unknown) => api<T>('POST', path, { body: body ?? {} });
