/**
 * Marketing Session End Hook
 *
 * Triggered on: Stop, SessionEnd
 * Purpose: Save session handoff for next time
 */

import * as fs from 'fs';
import * as path from 'path';
// Use JSON instead of YAML to avoid external dependencies

interface StopInput {
  stop_hook_active?: boolean;
  session_id: string;
}

interface SessionState {
  activeBrand?: string;
  currentSession?: {
    startTime: string;
    completed: string[];
    inProgress: string[];
    blockers: string[];
    decisions: string[];
  };
}

interface Handoff {
  brand: string;
  sessionId: string;
  timestamp: string;
  completed: string[];
  inProgress: string[];
  nextSteps: string[];
  blockers: string[];
  decisions: string[];
  summary: string;
}

// Storage paths
const MARKETING_DIR = path.join(process.env.HOME || '~', '.claude-marketing');
const STATE_FILE = path.join(MARKETING_DIR, 'state.json');
const HANDOFFS_DIR = path.join(MARKETING_DIR, 'handoffs');
const LEDGER_FILE = path.join(MARKETING_DIR, 'current-ledger.json');

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readJson<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

function writeJson(filePath: string, data: unknown): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function getTimestamp(): string {
  return new Date().toISOString();
}

function generateSummary(state: SessionState): string {
  const parts: string[] = [];

  if (state.currentSession?.completed?.length) {
    parts.push(`Completed ${state.currentSession.completed.length} task(s)`);
  }

  if (state.currentSession?.inProgress?.length) {
    parts.push(`${state.currentSession.inProgress.length} task(s) in progress`);
  }

  if (state.currentSession?.blockers?.length) {
    parts.push(`${state.currentSession.blockers.length} blocker(s)`);
  }

  if (parts.length === 0) {
    return 'Session ended';
  }

  return parts.join('. ') + '.';
}

async function main() {
  // Read input from stdin
  let input: StopInput;
  try {
    const rawInput = fs.readFileSync(0, 'utf-8');
    input = JSON.parse(rawInput);
  } catch {
    // Silent exit - no output needed
    return;
  }

  // Check if already processed
  if (input.stop_hook_active) {
    // Silent exit - no output needed
    return;
  }

  // Read current state
  const state = readJson<SessionState>(STATE_FILE);
  if (!state?.activeBrand) {
    // No active brand, nothing to save
    // Silent exit - no output needed
    return;
  }

  // Read current ledger if exists
  const ledger = readJson<{
    completed?: Array<{ task: string; result?: string }>;
    inProgress?: Array<{ task: string; context?: string }>;
    blockers?: Array<{ issue: string; context?: string }>;
    decisions?: Array<{ decision: string; reasoning?: string }>;
  }>(LEDGER_FILE);

  // Build handoff
  const handoff: Handoff = {
    brand: state.activeBrand,
    sessionId: input.session_id,
    timestamp: getTimestamp(),
    completed: ledger?.completed?.map(t => t.task) || state.currentSession?.completed || [],
    inProgress: ledger?.inProgress?.map(t => t.task) || state.currentSession?.inProgress || [],
    nextSteps: ledger?.inProgress?.map(t => t.task) || [], // In-progress becomes next steps
    blockers: ledger?.blockers?.map(b => b.issue) || state.currentSession?.blockers || [],
    decisions: ledger?.decisions?.map(d => d.decision) || state.currentSession?.decisions || [],
    summary: generateSummary(state)
  };

  // Only save if there's something to save
  if (handoff.completed.length === 0 &&
      handoff.inProgress.length === 0 &&
      handoff.blockers.length === 0 &&
      handoff.decisions.length === 0) {
    // Silent exit - no output needed
    return;
  }

  // Save handoff
  const brandHandoffDir = path.join(HANDOFFS_DIR, state.activeBrand);
  ensureDir(brandHandoffDir);

  const handoffFile = path.join(brandHandoffDir, `${getDateString()}-${input.session_id.slice(0, 8)}.json`);
  writeJson(handoffFile, handoff);

  // Clear current ledger
  if (fs.existsSync(LEDGER_FILE)) {
    fs.unlinkSync(LEDGER_FILE);
  }

  // Clear current session from state
  if (state.currentSession) {
    delete state.currentSession;
    writeJson(STATE_FILE, state);
  }

  // Plain text output - added as context
  console.log(`✅ **Session saved** for ${state.activeBrand}

📊 Progress: ${handoff.completed.length} completed, ${handoff.inProgress.length} in progress

💡 Next time you start Claude, I'll load this context automatically so you can pick up where you left off.`);
}

main().catch(err => {
  console.error('Marketing session end hook error:', err);
});
