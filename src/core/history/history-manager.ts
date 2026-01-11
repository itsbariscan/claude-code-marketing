/**
 * History Manager
 * Tracks activities and sessions for each brand
 */

import {
  readYaml,
  writeYaml,
  getHistoryPath,
  getCurrentYearMonth,
  getTimestamp,
  getDateString,
  generateUniqueId,
  listFiles,
  PATHS,
} from '../storage';
import { Session, Activity, ActivityType, ActionItem } from '../../types';
import * as path from 'path';
import * as fs from 'fs';

// ============================================
// HISTORY FILE STRUCTURE
// ============================================

interface HistoryFile {
  brandId: string;
  yearMonth: string;
  sessions: Session[];
}

// ============================================
// SESSION MANAGEMENT
// ============================================

let currentSession: Session | null = null;

/**
 * Start a new session for a brand
 */
export function startSession(brandId: string): Session {
  currentSession = {
    date: getDateString(),
    brandId,
    activities: [],
    notes: [],
  };

  return currentSession;
}

/**
 * End current session and save to history
 */
export function endSession(duration?: string): Session | null {
  if (!currentSession) return null;

  if (duration) {
    currentSession.duration = duration;
  }

  // Save to history
  saveSessionToHistory(currentSession);

  const session = currentSession;
  currentSession = null;

  return session;
}

/**
 * Get current session
 */
export function getCurrentSession(): Session | null {
  return currentSession;
}

/**
 * Save session to history file
 */
function saveSessionToHistory(session: Session): boolean {
  const yearMonth = getCurrentYearMonth();
  const historyPath = getHistoryPath(session.brandId, yearMonth);

  let history = readYaml<HistoryFile>(historyPath);

  if (!history) {
    history = {
      brandId: session.brandId,
      yearMonth,
      sessions: [],
    };
  }

  history.sessions.push(session);

  return writeYaml(historyPath, history);
}

// ============================================
// ACTIVITY TRACKING
// ============================================

/**
 * Log an activity to the current session
 */
export function logActivity(
  type: ActivityType,
  options?: {
    inputMethod?: Activity['inputMethod'];
    target?: string;
    outputSummary?: string;
    insights?: string[];
  }
): Activity | null {
  if (!currentSession) return null;

  const activity: Activity = {
    type,
    timestamp: getTimestamp(),
    inputMethod: options?.inputMethod,
    target: options?.target,
    outputSummary: options?.outputSummary,
    insights: options?.insights || [],
    actionItems: [],
  };

  currentSession.activities.push(activity);

  return activity;
}

/**
 * Add an action item to the last activity
 */
export function addActionItem(
  task: string,
  activityIndex?: number
): ActionItem | null {
  if (!currentSession || currentSession.activities.length === 0) return null;

  const idx = activityIndex ?? currentSession.activities.length - 1;
  const activity = currentSession.activities[idx];

  if (!activity) return null;

  const actionItem: ActionItem = {
    id: generateUniqueId('action'),
    task,
    status: 'pending',
    created: getDateString(),
  };

  activity.actionItems.push(actionItem);

  return actionItem;
}

/**
 * Update action item status
 */
export function updateActionItem(
  actionId: string,
  status: ActionItem['status'],
  outcome?: string
): boolean {
  if (!currentSession) return false;

  for (const activity of currentSession.activities) {
    const item = activity.actionItems.find((a) => a.id === actionId);
    if (item) {
      item.status = status;
      if (status === 'completed') {
        item.completed = getDateString();
      }
      if (outcome) {
        item.outcome = outcome;
      }
      return true;
    }
  }

  return false;
}

/**
 * Add a note to current session
 */
export function addSessionNote(note: string): boolean {
  if (!currentSession) return false;

  currentSession.notes.push(note);
  return true;
}

// ============================================
// HISTORY RETRIEVAL
// ============================================

/**
 * Get history for a brand
 */
export function getBrandHistory(
  brandId: string,
  options?: {
    yearMonth?: string;
    limit?: number;
  }
): Session[] {
  const yearMonth = options?.yearMonth || getCurrentYearMonth();
  const historyPath = getHistoryPath(brandId, yearMonth);

  const history = readYaml<HistoryFile>(historyPath);
  if (!history) return [];

  let sessions = history.sessions;

  if (options?.limit) {
    sessions = sessions.slice(-options.limit);
  }

  return sessions;
}

/**
 * Get all history months for a brand
 */
export function getHistoryMonths(brandId: string): string[] {
  const brandHistoryDir = path.join(PATHS.history, brandId);

  if (!fs.existsSync(brandHistoryDir)) {
    return [];
  }

  const files = listFiles(brandHistoryDir, '.yaml');
  return files.map((f) => f.replace('.yaml', '')).sort().reverse();
}

/**
 * Get recent activities across all sessions
 */
export function getRecentActivities(
  brandId: string,
  limit: number = 10
): Activity[] {
  const sessions = getBrandHistory(brandId, { limit: 5 });
  const activities: Activity[] = [];

  for (const session of sessions.reverse()) {
    for (const activity of session.activities.reverse()) {
      activities.push(activity);
      if (activities.length >= limit) {
        return activities;
      }
    }
  }

  return activities;
}

/**
 * Get pending action items
 */
export function getPendingActionItems(brandId: string): ActionItem[] {
  const sessions = getBrandHistory(brandId, { limit: 10 });
  const pending: ActionItem[] = [];

  for (const session of sessions) {
    for (const activity of session.activities) {
      for (const item of activity.actionItems) {
        if (item.status === 'pending' || item.status === 'in_progress') {
          pending.push(item);
        }
      }
    }
  }

  return pending;
}

// ============================================
// HISTORY DISPLAY
// ============================================

/**
 * Format session for display
 */
export function formatSession(session: Session): string {
  let output = `📅 SESSION: ${session.date}`;
  if (session.duration) {
    output += ` (${session.duration})`;
  }
  output += `\n`;
  output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (session.activities.length > 0) {
    output += `📊 ACTIVITIES\n`;
    for (const activity of session.activities) {
      output += formatActivity(activity);
    }
    output += `\n`;
  }

  if (session.notes.length > 0) {
    output += `📝 NOTES\n`;
    for (const note of session.notes) {
      output += `• ${note}\n`;
    }
  }

  return output;
}

/**
 * Format activity for display
 */
function formatActivity(activity: Activity): string {
  const typeLabels: Record<ActivityType, string> = {
    keyword_research: '🔍 Keyword Research',
    content_planning: '📝 Content Planning',
    content_brief: '📋 Content Brief',
    competitor_analysis: '⚔️ Competitor Analysis',
    page_optimization: '🔧 Page Optimization',
    strategy_creation: '🎯 Strategy Creation',
    channel_audit: '📊 Channel Audit',
    playbook_update: '📋 Playbook Update',
  };

  let output = `${typeLabels[activity.type]}`;
  if (activity.target) {
    output += ` - ${activity.target}`;
  }
  output += `\n`;

  if (activity.inputMethod) {
    output += `   Input: ${activity.inputMethod}\n`;
  }

  if (activity.outputSummary) {
    output += `   Result: ${activity.outputSummary}\n`;
  }

  if (activity.insights && activity.insights.length > 0) {
    output += `   Insights:\n`;
    for (const insight of activity.insights) {
      output += `   • ${insight}\n`;
    }
  }

  if (activity.actionItems.length > 0) {
    output += `   Action Items:\n`;
    for (const item of activity.actionItems) {
      const statusEmoji = {
        pending: '⬜',
        in_progress: '🔄',
        completed: '✅',
        cancelled: '❌',
        deferred: '⏸️',
      };
      output += `   ${statusEmoji[item.status]} ${item.task}\n`;
    }
  }

  return output;
}

/**
 * Get history summary for a brand
 */
export function getHistorySummary(brandId: string): {
  totalSessions: number;
  totalActivities: number;
  activitiesByType: Record<string, number>;
  pendingActionItems: number;
  lastSession?: string;
} {
  const months = getHistoryMonths(brandId);
  let totalSessions = 0;
  let totalActivities = 0;
  const activitiesByType: Record<string, number> = {};
  let lastSession: string | undefined;

  for (const month of months) {
    const sessions = getBrandHistory(brandId, { yearMonth: month });
    totalSessions += sessions.length;

    for (const session of sessions) {
      if (!lastSession || session.date > lastSession) {
        lastSession = session.date;
      }

      totalActivities += session.activities.length;

      for (const activity of session.activities) {
        activitiesByType[activity.type] =
          (activitiesByType[activity.type] || 0) + 1;
      }
    }
  }

  const pending = getPendingActionItems(brandId);

  return {
    totalSessions,
    totalActivities,
    activitiesByType,
    pendingActionItems: pending.length,
    lastSession,
  };
}
