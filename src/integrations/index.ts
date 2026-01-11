/**
 * API Integrations
 *
 * Stubs for SEO tool integrations.
 * Implement actual API calls when credentials are available.
 */

// Import for local use
import { isAhrefsConfigured } from './ahrefs';
import { isSemrushConfigured } from './semrush';
import { isGscConfigured } from './gsc';

// Base utilities
export {
  isApiConfigured,
  getApiConfig,
  rateLimit,
  getCached,
  setCache,
  cacheKey,
  ApiError,
  type ApiConfig,
  type ApiResult,
} from './api-base';

// Ahrefs
export {
  getAhrefsConfig,
  isAhrefsConfigured,
  getKeywordData as getAhrefsKeywords,
  getDomainBacklinks,
  getCompetingDomains,
  type AhrefsKeywordResult,
  type AhrefsBacklinkResult,
} from './ahrefs';

// SEMrush
export {
  getSemrushConfig,
  isSemrushConfigured,
  getKeywordOverview as getSemrushKeywords,
  getDomainOverview,
  getRelatedKeywords,
  getCompetitorKeywords,
  type SemrushKeywordResult,
  type SemrushDomainResult,
} from './semrush';

// Google Search Console
export {
  getGscConfig,
  isGscConfigured,
  getSearchAnalytics,
  getTopQueries,
  getPagePerformance,
  type GscConfig,
  type GscQueryResult,
  type GscPageResult,
} from './gsc';

// ============================================
// API STATUS CHECK
// ============================================

export interface ApiStatus {
  ahrefs: boolean;
  semrush: boolean;
  gsc: boolean;
}

/**
 * Check which APIs are configured
 */
export function getApiStatus(): ApiStatus {
  return {
    ahrefs: isAhrefsConfigured(),
    semrush: isSemrushConfigured(),
    gsc: isGscConfigured(),
  };
}

/**
 * Get message about API status
 */
export function getApiStatusMessage(): string {
  const status = getApiStatus();
  const configured = Object.entries(status)
    .filter(([, v]) => v)
    .map(([k]) => k);

  if (configured.length === 0) {
    return 'No APIs configured. Using Claude reasoning mode.';
  }

  return `APIs configured: ${configured.join(', ')}`;
}
