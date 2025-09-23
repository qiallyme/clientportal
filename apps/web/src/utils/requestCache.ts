// Simple request cache utility to prevent duplicate API calls
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class RequestCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Generate cache key from parameters
  generateKey(prefix: string, params: Record<string, any> = {}): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    return sortedParams ? `${prefix}?${sortedParams}` : prefix;
  }
}

// Export singleton instance
export const requestCache = new RequestCache();

// Helper function to wrap API calls with caching
export async function withCache<T>(
  key: string,
  apiCall: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Check cache first
  const cached = requestCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Make API call
  const result = await apiCall();
  
  // Cache the result
  requestCache.set(key, result, ttl);
  
  return result;
}
