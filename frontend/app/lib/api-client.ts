const API_URL = process.env.NEXT_PUBLIC_API_URL;

let authToken: string | null = null;

export function setAuthToken
(token: string | null) {
  authToken = token;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}): 
  Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
