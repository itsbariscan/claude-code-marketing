/**
 * API Integration Base
 * Common utilities and types for API integrations
 */

// ============================================
// API CONFIGURATION
// ============================================

export interface ApiConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  configured: boolean;
}

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  source: 'api';
  cached?: boolean;
}

// ============================================
// API ERROR HANDLING
// ============================================

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public apiName?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ============================================
// CONFIGURATION HELPERS
// ============================================

/**
 * Check if an API is configured
 */
export function isApiConfigured(config: ApiConfig | undefined): boolean {
  return !!(config && config.configured && config.apiKey);
}

/**
 * Get API configuration from environment or config file
 */
export function getApiConfig(apiName: string): ApiConfig {
  // Check environment variables first
  const envKey = process.env[`${apiName.toUpperCase()}_API_KEY`];

  if (envKey) {
    return {
      apiKey: envKey,
      configured: true,
    };
  }

  // Return unconfigured
  return {
    configured: false,
  };
}

// ============================================
// RATE LIMITING
// ============================================

const rateLimits: Record<string, { lastCall: number; minInterval: number }> = {};

/**
 * Simple rate limiter
 */
export async function rateLimit(
  apiName: string,
  minIntervalMs: number = 1000
): Promise<void> {
  const now = Date.now();
  const limit = rateLimits[apiName];

  if (limit) {
    const elapsed = now - limit.lastCall;
    if (elapsed < limit.minInterval) {
      await new Promise((resolve) =>
        setTimeout(resolve, limit.minInterval - elapsed)
      );
    }
  }

  rateLimits[apiName] = { lastCall: Date.now(), minInterval: minIntervalMs };
}

// ============================================
// RESPONSE CACHING
// ============================================

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

const cache: Record<string, CacheEntry> = {};

/**
 * Get cached response
 */
export function getCached<T>(key: string): T | null {
  const entry = cache[key];
  if (!entry) return null;

  if (Date.now() - entry.timestamp > entry.ttl) {
    delete cache[key];
    return null;
  }

  return entry.data as T;
}

/**
 * Cache a response
 */
export function setCache(key: string, data: any, ttlMs: number = 300000): void {
  cache[key] = {
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  };
}

/**
 * Generate cache key
 */
export function cacheKey(api: string, method: string, params: object): string {
  return `${api}:${method}:${JSON.stringify(params)}`;
}
