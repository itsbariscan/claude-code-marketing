/**
 * Claude Code Marketing
 * The first marketing-focused plugin for Claude Code
 *
 * @module claude-code-marketing
 */

// Initialize storage on import
import { initializeStorage } from './core/storage';
initializeStorage();

// Core exports
export * from './core';

// Skills exports
export * from './skills';

// Plugin exports
export * from './plugins';

// Integration exports (excluding ApiConfig to avoid conflict with types)
export {
  isApiConfigured,
  getApiConfig,
  rateLimit,
  getCached,
  setCache,
  cacheKey,
  ApiError,
  type ApiResult,
  getAhrefsConfig,
  isAhrefsConfigured,
  getAhrefsKeywords,
  getDomainBacklinks,
  getCompetingDomains,
  getSemrushConfig,
  isSemrushConfigured,
  getSemrushKeywords,
  getDomainOverview,
  getRelatedKeywords,
  getCompetitorKeywords,
  getGscConfig,
  isGscConfigured,
  getSearchAnalytics,
  getTopQueries,
  getPagePerformance,
  getApiStatus,
  getApiStatusMessage,
} from './integrations';

// Type exports
export * from './types';

// Version
export const VERSION = '0.1.0';

// Plugin metadata
export const PLUGIN_INFO = {
  name: 'Claude Code Marketing',
  version: VERSION,
  description: 'SEO, content marketing, and strategy tools for Claude Code',
  author: 'Marketing AI Community',
  repository: 'https://github.com/user/claude-code-marketing',
};
