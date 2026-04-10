import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: 600,       // 10 min default
  checkperiod: 120,  // check every 2 min
  useClones: false,
});

export function getCached<T>(key: string): T | undefined {
  return cache.get<T>(key);
}

export function setCached<T>(key: string, value: T, ttlSeconds?: number): boolean {
  if (ttlSeconds) {
    return cache.set(key, value, ttlSeconds);
  }
  return cache.set(key, value);
}

export function cacheKey(...parts: string[]): string {
  return parts.filter(Boolean).join(':');
}

export default cache;
