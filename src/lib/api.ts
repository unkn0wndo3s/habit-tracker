import { AuthService } from '@/services/authService';

export type ApiError = { error: string };

// Simple helper to call our Next.js API with the JWT from localStorage
export async function apiFetch<T = unknown>(input: string, init: RequestInit = {}): Promise<T> {
  // Use the centralized auth storage to keep the token key consistent
  const token = AuthService.getToken();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(input, { ...init, headers });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (data && (data as ApiError).error) || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}
