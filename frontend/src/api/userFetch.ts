/**
 * Wrapper around fetch that automatically attaches the user JWT
 * from localStorage as a Bearer token.
 */
export function userFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem("authToken");
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
