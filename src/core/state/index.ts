/**
 * State Management - Three-Layer System
 *
 * Layer 1: Continuity Ledger - Within-session tracking
 * Layer 2: Handoffs - Between-session context preservation
 * Layer 3: Archival Memory - Cross-session learnings
 */

// Layer 1: Continuity Ledger
export {
  initLedger,
  loadLedger,
  saveLedger,
  clearLedger,
  getLedger,
  addCompletedTask,
  addInProgressTask,
  updateTaskProgress,
  completeTask,
  addBlocker,
  removeBlocker,
  addLedgerNote,
  setGoal,
  getSessionSummary,
  getDetailedStatus,
} from './continuity-ledger';

// Layer 2: Handoffs
export {
  createHandoff,
  getHandoff,
  hasHandoff,
  clearHandoff,
  formatHandoffDisplay,
  getHandoffSummary,
  addNextStep,
  removeNextStep,
  updateResumePrompt,
} from './handoffs';

// Layer 3: Archival Memory
export {
  storeLearning,
  storeWhatWorked,
  storeOutcome,
  storeUserPreference,
  storeRejected,
  storePattern,
  storeMistake,
  getAllLearnings,
  getBrandLearnings,
  getGlobalLearnings,
  getLearningsByType,
  getLearningsByCategory,
  searchLearnings,
  getRecentLearnings,
  getRelevantLearnings,
  formatLearnings,
  deleteLearning,
  updateLearningConfidence,
  promoteToGlobal,
  getLearningStats,
} from './memory';
