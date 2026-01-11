/**
 * Handoffs - Layer 2 State Management
 * Preserves context between sessions for seamless continuity
 */

import {
  readYaml,
  writeYaml,
  getHandoffPath,
  getTimestamp,
  getDateString,
  deleteFile,
} from '../storage';
import { Handoff, HandoffTask, PrioritizedTask, ContinuityLedger } from '../../types';
import { getLedger, getSessionSummary } from './continuity-ledger';

// ============================================
// HANDOFF CREATION
// ============================================

/**
 * Create a handoff from the current session's continuity ledger
 * Call this when ending a session to preserve context
 */
export function createHandoff(
  nextSteps?: PrioritizedTask[],
  customResumePrompt?: string
): Handoff | null {
  const ledger = getLedger();
  if (!ledger) {
    return null;
  }

  const summary = getSessionSummary();

  // Convert ledger tasks to handoff format
  const completed: HandoffTask[] = ledger.completed.map((t) => ({
    task: t.task,
    result: t.result,
  }));

  const inProgress: HandoffTask[] = ledger.inProgress.map((t) => ({
    task: t.task,
    progress: t.result,
  }));

  // Blockers become deferred tasks
  const deferred: HandoffTask[] = ledger.blockers.map((b) => ({
    task: b,
    reason: 'Blocked - needs resolution',
  }));

  // Generate default next steps if not provided
  const steps = nextSteps || generateDefaultNextSteps(ledger);

  // Generate resume prompt
  const resumePrompt = customResumePrompt || generateResumePrompt(ledger, steps);

  const handoff: Handoff = {
    brandId: ledger.brandId,
    created: getTimestamp(),

    lastSession: {
      date: getDateString(),
      duration: summary?.duration,
      completed,
      inProgress,
      deferred,
    },

    nextSteps: steps,
    resumePrompt,
  };

  // Save handoff
  const success = writeYaml(getHandoffPath(ledger.brandId), handoff);
  if (!success) {
    return null;
  }

  return handoff;
}

/**
 * Generate default next steps from ledger state
 */
function generateDefaultNextSteps(ledger: ContinuityLedger): PrioritizedTask[] {
  const steps: PrioritizedTask[] = [];
  let priority = 1;

  // In-progress tasks are highest priority
  for (const task of ledger.inProgress) {
    steps.push({
      priority: priority++,
      task: `Continue: ${task.task}`,
      context: task.result,
    });
  }

  // Blockers need resolution
  for (const blocker of ledger.blockers) {
    steps.push({
      priority: priority++,
      task: `Resolve blocker: ${blocker}`,
    });
  }

  // If nothing in progress, suggest based on goal
  if (steps.length === 0 && ledger.goal) {
    steps.push({
      priority: 1,
      task: `Continue working on: ${ledger.goal}`,
    });
  }

  return steps;
}

/**
 * Generate a resume prompt for the next session
 */
function generateResumePrompt(
  ledger: ContinuityLedger,
  nextSteps: PrioritizedTask[]
): string {
  const parts: string[] = [];

  // Brand context
  parts.push(`Working with ${ledger.brandName}.`);

  // Session goal
  if (ledger.goal) {
    parts.push(`Goal: ${ledger.goal}`);
  }

  // What was accomplished
  if (ledger.completed.length > 0) {
    const completedList = ledger.completed
      .slice(-3) // Last 3 completed tasks
      .map((t) => t.task)
      .join(', ');
    parts.push(`Last session completed: ${completedList}`);
  }

  // What's in progress
  if (ledger.inProgress.length > 0) {
    const inProgressList = ledger.inProgress
      .map((t) => t.task)
      .join(', ');
    parts.push(`In progress: ${inProgressList}`);
  }

  // Blockers
  if (ledger.blockers.length > 0) {
    parts.push(`Blockers: ${ledger.blockers.join(', ')}`);
  }

  // Next steps
  if (nextSteps.length > 0) {
    const topSteps = nextSteps
      .slice(0, 3)
      .map((s) => s.task)
      .join('; ');
    parts.push(`Suggested next: ${topSteps}`);
  }

  return parts.join(' ');
}

// ============================================
// HANDOFF RETRIEVAL
// ============================================

/**
 * Load a handoff for a brand
 */
export function getHandoff(brandId: string): Handoff | null {
  return readYaml<Handoff>(getHandoffPath(brandId));
}

/**
 * Check if a brand has a pending handoff
 */
export function hasHandoff(brandId: string): boolean {
  const handoff = getHandoff(brandId);
  return handoff !== null;
}

/**
 * Delete a handoff (after it's been processed)
 */
export function clearHandoff(brandId: string): boolean {
  return deleteFile(getHandoffPath(brandId));
}

// ============================================
// HANDOFF DISPLAY
// ============================================

/**
 * Format handoff for display when resuming a session
 */
export function formatHandoffDisplay(handoff: Handoff): string {
  let output = `📋 RESUMING WORK: ${handoff.brandId}\n\n`;
  output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  output += `Last session: ${handoff.lastSession.date}`;
  if (handoff.lastSession.duration) {
    output += ` (${handoff.lastSession.duration})`;
  }
  output += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Completed tasks
  if (handoff.lastSession.completed.length > 0) {
    output += `✅ COMPLETED LAST SESSION:\n`;
    for (const task of handoff.lastSession.completed.slice(-5)) {
      output += `• ${task.task}`;
      if (task.result) output += ` → ${task.result}`;
      output += `\n`;
    }
    output += `\n`;
  }

  // In-progress tasks
  if (handoff.lastSession.inProgress.length > 0) {
    output += `🔄 LEFT IN PROGRESS:\n`;
    for (const task of handoff.lastSession.inProgress) {
      output += `• ${task.task}`;
      if (task.progress) output += ` - ${task.progress}`;
      output += `\n`;
    }
    output += `\n`;
  }

  // Deferred tasks
  if (handoff.lastSession.deferred.length > 0) {
    output += `⏸️ DEFERRED:\n`;
    for (const task of handoff.lastSession.deferred) {
      output += `• ${task.task}`;
      if (task.reason) output += ` (${task.reason})`;
      output += `\n`;
    }
    output += `\n`;
  }

  // Next steps
  if (handoff.nextSteps.length > 0) {
    output += `📌 SUGGESTED NEXT STEPS:\n`;
    for (const step of handoff.nextSteps) {
      output += `${step.priority}. ${step.task}`;
      if (step.context) output += `\n   └─ ${step.context}`;
      output += `\n`;
    }
    output += `\n`;
  }

  // Resume prompt
  output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  output += `💬 Resume: "${handoff.resumePrompt}"\n`;

  return output;
}

/**
 * Get a brief handoff summary (for notifications)
 */
export function getHandoffSummary(brandId: string): string | null {
  const handoff = getHandoff(brandId);
  if (!handoff) return null;

  const inProgress = handoff.lastSession.inProgress.length;
  const deferred = handoff.lastSession.deferred.length;
  const nextSteps = handoff.nextSteps.length;

  let summary = `Last worked: ${handoff.lastSession.date}`;
  if (inProgress > 0) summary += ` | ${inProgress} in progress`;
  if (deferred > 0) summary += ` | ${deferred} deferred`;
  if (nextSteps > 0) summary += ` | ${nextSteps} next steps`;

  return summary;
}

// ============================================
// HANDOFF UPDATES
// ============================================

/**
 * Add a next step to an existing handoff
 */
export function addNextStep(
  brandId: string,
  task: string,
  priority?: number,
  context?: string
): Handoff | null {
  const handoff = getHandoff(brandId);
  if (!handoff) return null;

  const newPriority = priority || handoff.nextSteps.length + 1;

  handoff.nextSteps.push({
    priority: newPriority,
    task,
    context,
  });

  // Re-sort by priority
  handoff.nextSteps.sort((a, b) => a.priority - b.priority);

  const success = writeYaml(getHandoffPath(brandId), handoff);
  return success ? handoff : null;
}

/**
 * Remove a next step from handoff
 */
export function removeNextStep(brandId: string, taskIndex: number): Handoff | null {
  const handoff = getHandoff(brandId);
  if (!handoff) return null;

  if (taskIndex >= 0 && taskIndex < handoff.nextSteps.length) {
    handoff.nextSteps.splice(taskIndex, 1);

    // Re-number priorities
    handoff.nextSteps.forEach((step, idx) => {
      step.priority = idx + 1;
    });

    const success = writeYaml(getHandoffPath(brandId), handoff);
    return success ? handoff : null;
  }

  return handoff;
}

/**
 * Update the resume prompt
 */
export function updateResumePrompt(brandId: string, prompt: string): Handoff | null {
  const handoff = getHandoff(brandId);
  if (!handoff) return null;

  handoff.resumePrompt = prompt;
  const success = writeYaml(getHandoffPath(brandId), handoff);
  return success ? handoff : null;
}
