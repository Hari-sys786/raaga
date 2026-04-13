import { API_BASE } from './config';

async function fetchJSON<T = any>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  search: (q: string, page = 1) =>
    fetchJSON(`${API_BASE}/search?q=${encodeURIComponent(q)}&type=song&page=${page}`),

  searchAll: (q: string) =>
    fetchJSON(`${API_BASE}/search?q=${encodeURIComponent(q)}&type=all`),

  trending: (lang = 'hindi') =>
    fetchJSON(`${API_BASE}/trending?lang=${lang}`),

  song: (id: string, source = 'jiosaavn') =>
    fetchJSON(`${API_BASE}/song/${id}?source=${source}`),

  streamUrl: (id: string, source = 'jiosaavn') =>
    `${API_BASE}/stream/${id}?source=${source}`,

  artist: (id: string) =>
    fetchJSON(`${API_BASE}/artist/${id}`),

  album: (id: string) =>
    fetchJSON(`${API_BASE}/album/${id}`),

  lyrics: (artist: string, track: string) =>
    fetchJSON(
      `${API_BASE}/lyrics?artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}`
    ),

  viral: () =>
    fetchJSON(`${API_BASE}/viral`),

  genre: (slug: string) =>
    fetchJSON(`${API_BASE}/genre/${encodeURIComponent(slug)}`),
};
