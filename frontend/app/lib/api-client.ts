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
    const body = await response.text();

    if (body) {
      throw new Error(body);
    }

    const readableMessage: Record<number, string> = {
      403: "Permission denied",
      404: "Not found",
      409: "Already exists",
    };

    throw new Error(readableMessage[response.status] ?? `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
