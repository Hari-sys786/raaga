// Simple in-memory TTL cache to avoid hammering APIs

const cache = new Map<string, { data: any; expires: number }>();

export function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return undefined;
  }
  return entry.data as T;
}

export function setCached<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

export function deleteCached(key: string): void {
  cache.delete(key);
}

export function clearCache(): void {
  cache.clear();
}
