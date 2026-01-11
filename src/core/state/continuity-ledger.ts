/**
 * Continuity Ledger - Layer 1 State Management
 * Tracks current session state in real-time
 */

import {
  readYaml,
  writeYaml,
  PATHS,
  getTimestamp,
  deleteFile,
} from '../storage';
import { ContinuityLedger, SessionTask } from '../../types';

// In-memory ledger for fast access
let currentLedger: ContinuityLedger | null = null;

// ============================================
// LEDGER INITIALIZATION
// ============================================

/**
 * Initialize a new continuity ledger for a session
 */
export function initLedger(brandId: string, brandName: string, goal?: string): ContinuityLedger {
  const ledger: ContinuityLedger = {
    brandId,
    brandName,
    started: getTimestamp(),
    goal,
    completed: [],
    inProgress: [],
    blockers: [],
    notes: [],
  };

  currentLedger = ledger;
  saveLedger();

  return ledger;
}

/**
 * Load existing ledger from disk
 */
export function loadLedger(): ContinuityLedger | null {
  if (currentLedger) {
    return currentLedger;
  }

  const ledger = readYaml<ContinuityLedger>(PATHS.continuity);
  if (ledger) {
    currentLedger = ledger;
  }
  return ledger;
}

/**
 * Save current ledger to disk
 */
export function saveLedger(): boolean {
  if (!currentLedger) {
    return false;
  }
  return writeYaml(PATHS.continuity, currentLedger);
}

/**
 * Clear the continuity ledger (end of session)
 */
export function clearLedger(): void {
  currentLedger = null;
  deleteFile(PATHS.continuity);
}

/**
 * Get current ledger
 */
export function getLedger(): ContinuityLedger | null {
  return currentLedger || loadLedger();
}

// ============================================
// TASK TRACKING
// ============================================

/**
 * Add a completed task to the ledger
 */
export function addCompletedTask(task: string, result?: string): void {
  const ledger = getLedger();
  if (!ledger) return;

  const sessionTask: SessionTask = {
    task,
    timestamp: getTimestamp(),
    result,
  };

  // Remove from in-progress if it was there
  ledger.inProgress = ledger.inProgress.filter(
    (t) => t.task.toLowerCase() !== task.toLowerCase()
  );

  ledger.completed.push(sessionTask);
  saveLedger();
}

/**
 * Add an in-progress task to the ledger
 */
export function addInProgressTask(task: string): void {
  const ledger = getLedger();
  if (!ledger) return;

  // Check if already in progress
  const exists = ledger.inProgress.some(
    (t) => t.task.toLowerCase() === task.toLowerCase()
  );
  if (exists) return;

  const sessionTask: SessionTask = {
    task,
    timestamp: getTimestamp(),
  };

  ledger.inProgress.push(sessionTask);
  saveLedger();
}

/**
 * Update an in-progress task's progress
 */
export function updateTaskProgress(task: string, result: string): void {
  const ledger = getLedger();
  if (!ledger) return;

  const taskIndex = ledger.inProgress.findIndex(
    (t) => t.task.toLowerCase() === task.toLowerCase()
  );

  if (taskIndex >= 0) {
    ledger.inProgress[taskIndex].result = result;
    saveLedger();
  }
}

/**
 * Mark a task as completed (move from in-progress to completed)
 */
export function completeTask(task: string, result?: string): void {
  const ledger = getLedger();
  if (!ledger) return;

  // Find and remove from in-progress
  const taskIndex = ledger.inProgress.findIndex(
    (t) => t.task.toLowerCase() === task.toLowerCase()
  );

  if (taskIndex >= 0) {
    const [completedTask] = ledger.inProgress.splice(taskIndex, 1);
    completedTask.result = result || completedTask.result;
    completedTask.timestamp = getTimestamp();
    ledger.completed.push(completedTask);
  } else {
    // Task wasn't in progress, add directly to completed
    addCompletedTask(task, result);
    return;
  }

  saveLedger();
}

// ============================================
// BLOCKERS AND NOTES
// ============================================

/**
 * Add a blocker
 */
export function addBlocker(blocker: string): void {
  const ledger = getLedger();
  if (!ledger) return;

  if (!ledger.blockers.includes(blocker)) {
    ledger.blockers.push(blocker);
    saveLedger();
  }
}

/**
 * Remove a blocker
 */
export function removeBlocker(blocker: string): void {
  const ledger = getLedger();
  if (!ledger) return;

  ledger.blockers = ledger.blockers.filter(
    (b) => b.toLowerCase() !== blocker.toLowerCase()
  );
  saveLedger();
}

/**
 * Add a note
 */
export function addLedgerNote(note: string): void {
  const ledger = getLedger();
  if (!ledger) return;

  if (!ledger.notes.includes(note)) {
    ledger.notes.push(note);
    saveLedger();
  }
}

// ============================================
// SESSION GOAL
// ============================================

/**
 * Set the session goal
 */
export function setGoal(goal: string): void {
  const ledger = getLedger();
  if (!ledger) return;

  ledger.goal = goal;
  saveLedger();
}

// ============================================
// SUMMARY
// ============================================

/**
 * Get a summary of the current session
 */
export function getSessionSummary(): {
  brandId: string;
  brandName: string;
  duration: string;
  completed: number;
  inProgress: number;
  blockers: number;
  notes: number;
} | null {
  const ledger = getLedger();
  if (!ledger) return null;

  const startTime = new Date(ledger.started).getTime();
  const now = Date.now();
  const durationMs = now - startTime;
  const minutes = Math.floor(durationMs / 60000);
  const duration = minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

  return {
    brandId: ledger.brandId,
    brandName: ledger.brandName,
    duration,
    completed: ledger.completed.length,
    inProgress: ledger.inProgress.length,
    blockers: ledger.blockers.length,
    notes: ledger.notes.length,
  };
}

/**
 * Get detailed session status for display
 */
export function getDetailedStatus(): string {
  const ledger = getLedger();
  if (!ledger) return 'No active session';

  const summary = getSessionSummary();
  if (!summary) return 'No active session';

  let output = `📋 CURRENT SESSION STATUS\n\n`;
  output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  output += `📁 Brand: ${summary.brandName}\n`;
  output += `⏱️ Session time: ${summary.duration}\n`;
  output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (ledger.goal) {
    output += `🎯 GOAL: ${ledger.goal}\n\n`;
  }

  if (ledger.completed.length > 0) {
    output += `✅ COMPLETED THIS SESSION:\n`;
    for (const task of ledger.completed) {
      output += `• ${task.task}`;
      if (task.result) output += ` (${task.result})`;
      output += `\n`;
    }
    output += `\n`;
  }

  if (ledger.inProgress.length > 0) {
    output += `🔄 IN PROGRESS:\n`;
    for (const task of ledger.inProgress) {
      output += `• ${task.task}`;
      if (task.result) output += ` - ${task.result}`;
      output += `\n`;
    }
    output += `\n`;
  }

  if (ledger.blockers.length > 0) {
    output += `⚠️ BLOCKERS:\n`;
    for (const blocker of ledger.blockers) {
      output += `• ${blocker}\n`;
    }
    output += `\n`;
  }

  if (ledger.notes.length > 0) {
    output += `📝 NOTES:\n`;
    for (const note of ledger.notes) {
      output += `• ${note}\n`;
    }
  }

  return output;
}
