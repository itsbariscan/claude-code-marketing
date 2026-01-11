/**
 * Session Module
 */

export {
  beginSession,
  finishSession,
  getSessionState,
  hasActiveSession,
  getSessionBrand,
  getSessionContext,
  getStatusLine,
  logMarketingActivity,
  checkAndRestoreSession,
  type SessionState,
} from './session-manager';
