/**
 * Session Manager
 * Coordinates all state management layers for a marketing session
 *
 * Layers:
 * 1. Continuity Ledger - Real-time within-session state
 * 2. Handoffs - Between-session context
 * 3. History - Activity logs and action items
 * 4. Memory - Cross-session learnings
 */

import {
  initLedger,
  clearLedger,
  getLedger,
  createHandoff,
  getHandoff,
  clearHandoff,
  hasHandoff,
  formatHandoffDisplay,
  getSessionSummary,
  getDetailedStatus,
} from '../state';
import {
  startSession,
  endSession,
  getCurrentSession,
  logActivity,
  getHistorySummary,
} from '../history/history-manager';
import {
  getActiveBrand,
  setActiveBrand,
  getBrand,
  loadBrandMetadata,
} from '../brand/brand-manager';
import { Brand, ActivityType, ContinuityLedger, Handoff } from '../../types';

// ============================================
// SESSION STATE
// ============================================

export interface SessionState {
  brand: Brand | null;
  ledger: ContinuityLedger | null;
  handoff: Handoff | null;
  isActive: boolean;
  startTime: Date | null;
}

let sessionState: SessionState = {
  brand: null,
  ledger: null,
  handoff: null,
  isActive: false,
  startTime: null,
};

// ============================================
// SESSION LIFECYCLE
// ============================================

/**
 * Start a marketing session for a brand
 */
export function beginSession(
  brandId: string,
  goal?: string
): {
  success: boolean;
  message: string;
  resumeContext?: string;
} {
  const brand = getBrand(brandId);
  if (!brand) {
    return {
      success: false,
      message: `Brand "${brandId}" not found`,
    };
  }

  // Set as active brand
  setActiveBrand(brandId);

  // Initialize continuity ledger
  initLedger(brandId, brand.name, goal);

  // Start history session
  startSession(brandId);

  // Check for handoff from previous session
  let resumeContext: string | undefined;
  if (hasHandoff(brandId)) {
    const handoff = getHandoff(brandId);
    if (handoff) {
      resumeContext = formatHandoffDisplay(handoff);
      sessionState.handoff = handoff;
    }
  }

  // Update state
  sessionState = {
    brand,
    ledger: getLedger(),
    handoff: sessionState.handoff,
    isActive: true,
    startTime: new Date(),
  };

  return {
    success: true,
    message: `Session started for ${brand.name}`,
    resumeContext,
  };
}

/**
 * End the current session
 */
export function finishSession(options?: {
  createHandoff?: boolean;
  nextSteps?: Array<{ priority: number; task: string; context?: string }>;
}): {
  success: boolean;
  message: string;
  summary?: string;
} {
  if (!sessionState.isActive || !sessionState.brand) {
    return {
      success: false,
      message: 'No active session',
    };
  }

  const brandId = sessionState.brand.id;

  // Calculate duration
  let duration: string | undefined;
  if (sessionState.startTime) {
    const durationMs = Date.now() - sessionState.startTime.getTime();
    const minutes = Math.floor(durationMs / 60000);
    duration =
      minutes < 60
        ? `${minutes} min`
        : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  }

  // Get session summary before clearing
  const summary = getSessionSummary();

  // Create handoff if requested (default: true)
  if (options?.createHandoff !== false) {
    createHandoff(options?.nextSteps);
  }

  // End history session
  endSession(duration);

  // Clear continuity ledger
  clearLedger();

  // Clear handoff (it's been processed)
  if (sessionState.handoff) {
    clearHandoff(brandId);
  }

  // Reset state
  sessionState = {
    brand: null,
    ledger: null,
    handoff: null,
    isActive: false,
    startTime: null,
  };

  let summaryText = `Session ended for ${brandId}`;
  if (summary) {
    summaryText += `\nDuration: ${summary.duration}`;
    summaryText += `\nCompleted: ${summary.completed} tasks`;
    if (summary.inProgress > 0) {
      summaryText += `\nIn progress: ${summary.inProgress} tasks`;
    }
  }

  return {
    success: true,
    message: 'Session ended successfully',
    summary: summaryText,
  };
}

/**
 * Get current session state
 */
export function getSessionState(): SessionState {
  return { ...sessionState };
}

/**
 * Check if there's an active session
 */
export function hasActiveSession(): boolean {
  return sessionState.isActive;
}

/**
 * Get the current session's brand
 */
export function getSessionBrand(): Brand | null {
  return sessionState.brand;
}

// ============================================
// SESSION CONTEXT
// ============================================

/**
 * Get full context for current session
 * Used to provide context to Claude
 */
export function getSessionContext(): string {
  if (!sessionState.isActive || !sessionState.brand) {
    return 'No active session. Use /brand to select a brand.';
  }

  const brand = sessionState.brand;
  const metadata = loadBrandMetadata(brand.id);
  const history = getHistorySummary(brand.id);

  let context = `# Current Session Context\n\n`;

  // Brand info
  context += `## Brand: ${brand.name}\n`;
  context += `- Website: ${brand.website}\n`;
  if (metadata?.industry) {
    context += `- Industry: ${metadata.industry}\n`;
  }
  context += `\n`;

  // Session status
  const ledger = getLedger();
  if (ledger) {
    if (ledger.goal) {
      context += `## Session Goal\n${ledger.goal}\n\n`;
    }

    if (ledger.completed.length > 0) {
      context += `## Completed This Session\n`;
      for (const task of ledger.completed.slice(-5)) {
        context += `- ${task.task}`;
        if (task.result) context += ` (${task.result})`;
        context += `\n`;
      }
      context += `\n`;
    }

    if (ledger.inProgress.length > 0) {
      context += `## In Progress\n`;
      for (const task of ledger.inProgress) {
        context += `- ${task.task}`;
        if (task.result) context += ` - ${task.result}`;
        context += `\n`;
      }
      context += `\n`;
    }

    if (ledger.blockers.length > 0) {
      context += `## Blockers\n`;
      for (const blocker of ledger.blockers) {
        context += `- ${blocker}\n`;
      }
      context += `\n`;
    }
  }

  // History summary
  if (history.totalSessions > 0) {
    context += `## History\n`;
    context += `- Total sessions: ${history.totalSessions}\n`;
    context += `- Last session: ${history.lastSession || 'N/A'}\n`;
    if (history.pendingActionItems > 0) {
      context += `- Pending action items: ${history.pendingActionItems}\n`;
    }
    context += `\n`;
  }

  return context;
}

/**
 * Get a brief status line for display
 */
export function getStatusLine(): string {
  if (!sessionState.isActive || !sessionState.brand) {
    return '⚪ No active session';
  }

  const summary = getSessionSummary();
  if (!summary) {
    return `🟢 ${sessionState.brand.name}`;
  }

  let status = `🟢 ${summary.brandName}`;

  if (summary.completed > 0) {
    status += ` | ✅ ${summary.completed}`;
  }

  if (summary.inProgress > 0) {
    status += ` | 🔄 ${summary.inProgress}`;
  }

  if (summary.blockers > 0) {
    status += ` | ⚠️ ${summary.blockers}`;
  }

  status += ` | ⏱️ ${summary.duration}`;

  return status;
}

// ============================================
// SESSION ACTIVITY LOGGING
// ============================================

/**
 * Log a marketing activity
 */
export function logMarketingActivity(
  type: ActivityType,
  options?: {
    inputMethod?: 'screenshot' | 'paste' | 'api' | 'reasoning';
    target?: string;
    outputSummary?: string;
    insights?: string[];
  }
): boolean {
  if (!sessionState.isActive) {
    return false;
  }

  logActivity(type, options);
  return true;
}

// ============================================
// SESSION INITIALIZATION CHECK
// ============================================

/**
 * Check and restore session on startup
 * Called when the plugin loads
 */
export function checkAndRestoreSession(): {
  hasSession: boolean;
  brandId?: string;
  brandName?: string;
} {
  const activeBrand = getActiveBrand();
  if (!activeBrand) {
    return { hasSession: false };
  }

  // Check if there's a ledger (session in progress)
  const ledger = getLedger();
  if (ledger) {
    sessionState = {
      brand: activeBrand,
      ledger,
      handoff: null,
      isActive: true,
      startTime: new Date(), // Approximate
    };

    return {
      hasSession: true,
      brandId: activeBrand.id,
      brandName: activeBrand.name,
    };
  }

  return { hasSession: false };
}
