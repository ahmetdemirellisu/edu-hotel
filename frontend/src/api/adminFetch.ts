/**
 * Wrapper around fetch that automatically attaches the admin JWT
 * from sessionStorage as a Bearer token.
 */
export function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = sessionStorage.getItem("adminToken");
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
