const API_BASE_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? "http://localhost:3334" : "");

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    const fallback = await response.json().catch(() => null);
    throw new Error(fallback?.message ?? "Falha ao carregar dados da API local.");
  }

  return response.json() as Promise<T>;
}
