const LOG_STATUS = false;
const DISABLE_CACHE = false;
const CACHE_TTL_MS = 5 * 60 * 1000;

type FetchOptions = { signal?: AbortSignal };
type CacheEntry<T> = {
  data: T;
  cachedAt: number;
};
/**
 * createMemoryCachedFetcher - In-memory only cache wrapper (no IndexedDB)
 *
 * @param {Function} fetchFn - The API fetch function to wrap
 * @returns {Function} - Cached fetch function with signature: async (key, options) => data
 */
const createMemoryCachedFetcher = <T>(fetchFn: (key: string, options: FetchOptions) => Promise<T>) => {
  const cache = new Map<string, CacheEntry<T>>();
  return async (key: string, options: FetchOptions = {}): Promise<T> => {
    if (DISABLE_CACHE) {
      return await fetchFn(key, options);
    }

    // if (cache.has(key)) {
    //   if (LOG_STATUS) console.log(`[MemoryCache] Hit for key: ${key}`);
    //   return cache.get(key) as T;
    // }
    const cachedEntry = cache.get(key);
    if (cachedEntry) {
      const isFresh = Date.now() - cachedEntry.cachedAt < CACHE_TTL_MS;
      if (isFresh) {
        if (LOG_STATUS) console.log(`[MemoryCache] Hit for key: ${key}`);
        return cachedEntry.data;
      }
      cache.delete(key);
    }

    if (LOG_STATUS) console.log(`[MemoryCache] Network fetch for key: ${key}`);
    const data = await fetchFn(key, options);

    const { signal } = options;
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    cache.set(key, { data, cachedAt: Date.now() });
    return data;
  };
};

export default createMemoryCachedFetcher; 