/**
 * Claude Code Marketing - Type Definitions
 */

// ============================================
// BRAND TYPES
// ============================================

export interface Brand {
  id: string;
  name: string;
  website: string;
  created: string;
  lastUpdated: string;
  lastSession?: string;

  business: BusinessInfo;
  audience: AudienceInfo;
  competitors: Competitor[];
  accounts: ApiAccounts;
  currentInvestments: MarketingInvestments;
  strategy?: Strategy;
  notes: BrandNote[];
  preferences: BrandPreferences;
}

export interface BusinessInfo {
  industry: string;
  product: string;
  model: 'self-serve' | 'sales-led' | 'hybrid' | string;
  priceRange?: string;
  usp: string;
}

export interface AudienceInfo {
  primary: AudienceSegment;
  secondary?: AudienceSegment;
  geo: string[];
  painPoints: string[];
}

export interface AudienceSegment {
  description: string;
  role?: string;
  companySize?: string;
}

export interface Competitor {
  domain: string;
  name?: string;
  notes?: string;
  yourAngle?: string;
}

export interface ApiAccounts {
  googleAds?: string;
  metaAds?: string;
  gscProperty?: string;
  ga4Property?: string;
  ahrefsProject?: string;
  semrushProject?: string;
}

export interface MarketingInvestments {
  googleAds?: ChannelInvestment;
  metaAds?: ChannelInvestment;
  seo?: ChannelInvestment;
  email?: ChannelInvestment;
  social?: ChannelInvestment;
}

export interface ChannelInvestment {
  active: boolean;
  budget?: string;
  duration?: string;
  performance?: 'unknown' | 'profitable' | 'unprofitable' | 'break-even';
  notes?: string;
}

export interface BrandNote {
  date: string;
  content: string;
}

export interface BrandPreferences {
  dataMode: 'reasoning' | 'paste' | 'api' | 'ask';
  contactEmail?: string;
  timezone?: string;
}

// ============================================
// STRATEGY TYPES
// ============================================

export interface Strategy {
  generatedDate: string;
  lastUpdated?: string;

  positioning: PositioningStatement;
  personas: Persona[];
  channels: ChannelStrategy;
  contentPillars: string[];
  playbook: Playbook;
}

export interface PositioningStatement {
  for: string;
  who: string;
  product: string;
  benefit: string;
  unlike: string;
  differentiator: string;
  tagline?: string;
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  companySize?: string;
  painPoints: string[];
  goals: string[];
  contentTopics: string[];
  messaging: {
    do: string[];
    avoid: string[];
  };
}

export interface ChannelStrategy {
  priority1?: ChannelRecommendation;
  priority2?: ChannelRecommendation;
  priority3?: ChannelRecommendation;
  avoid: ChannelRecommendation[];
}

export interface ChannelRecommendation {
  name: string;
  action: 'start' | 'optimize' | 'scale' | 'maintain' | 'pause' | 'avoid';
  reason: string;
}

export interface Playbook {
  generated: string;
  tasks: PlaybookTask[];
}

export interface PlaybookTask {
  id: string;
  task: string;
  week?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'deferred';
  completedDate?: string;
  notes?: string;
}

// ============================================
// STATE MANAGEMENT TYPES
// ============================================

// Layer 1: Continuity Ledger (within session)
export interface ContinuityLedger {
  brandId: string;
  brandName: string;
  started: string;
  goal?: string;
  completed: SessionTask[];
  inProgress: SessionTask[];
  blockers: string[];
  notes: string[];
}

export interface SessionTask {
  task: string;
  timestamp: string;
  result?: string;
}

// Layer 2: Handoffs (between sessions)
export interface Handoff {
  brandId: string;
  created: string;

  lastSession: {
    date: string;
    duration?: string;
    completed: HandoffTask[];
    inProgress: HandoffTask[];
    deferred: HandoffTask[];
  };

  nextSteps: PrioritizedTask[];
  resumePrompt: string;
}

export interface HandoffTask {
  task: string;
  result?: string;
  keyword?: string;
  progress?: string;
  reason?: string;
}

export interface PrioritizedTask {
  priority: number;
  task: string;
  context?: string;
}

// Layer 3: Archival Memory (cross sessions)
export interface Learning {
  id: string;
  brand: string; // 'global' for cross-brand learnings
  date: string;
  type: LearningType;
  category: string;
  content: string;
  context?: string;
  confidence: 'high' | 'medium' | 'low';
  metrics?: Record<string, string>;
}

export type LearningType =
  | 'what_worked'
  | 'outcome'
  | 'user_preference'
  | 'rejected'
  | 'pattern'
  | 'mistake';

// ============================================
// SESSION & HISTORY TYPES
// ============================================

export interface Session {
  date: string;
  duration?: string;
  brandId: string;
  activities: Activity[];
  notes: string[];
}

export interface Activity {
  type: ActivityType;
  timestamp: string;
  inputMethod?: 'screenshot' | 'paste' | 'api' | 'reasoning';
  target?: string;
  outputSummary?: string;
  insights?: string[];
  actionItems: ActionItem[];
}

export type ActivityType =
  | 'keyword_research'
  | 'content_planning'
  | 'content_brief'
  | 'competitor_analysis'
  | 'page_optimization'
  | 'strategy_creation'
  | 'channel_audit'
  | 'playbook_update';

export interface ActionItem {
  id: string;
  task: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'deferred';
  created: string;
  completed?: string;
  outcome?: string;
  reason?: string;
}

// ============================================
// CONFIG TYPES
// ============================================

export interface Config {
  preferences: {
    defaultDataMode: 'reasoning' | 'paste' | 'api' | 'ask';
    showApiNudges: boolean;
    exportFormat: 'markdown' | 'pdf' | 'text';
  };
  apis: {
    ahrefs?: ApiConfig;
    semrush?: ApiConfig;
    gsc?: ApiConfig;
    ga4?: ApiConfig;
  };
  ui: {
    showConfidenceLevels: boolean;
    verboseExplanations: boolean;
    autoSuggestNextSteps: boolean;
  };
  activeBrand?: string;
}

export interface ApiConfig {
  configured: boolean;
  key?: string;
}

// ============================================
// DATA INPUT TYPES
// ============================================

export interface ParsedData {
  source: 'screenshot' | 'paste' | 'api' | 'reasoning';
  tool?: string; // 'gsc', 'ahrefs', 'ga4', etc.
  confidence: 'high' | 'medium' | 'low';
  data: Record<string, any>;
  limitations?: string[];
}

export interface KeywordData {
  keyword: string;
  volume?: number;
  difficulty?: number;
  cpc?: number;
  position?: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
}

// ============================================
// WORKFLOW TYPES
// ============================================

export interface Workflow {
  name: string;
  description: string;
  trigger: {
    naturalLanguage: string[];
    command?: string;
  };
  mandatoryGates?: WorkflowGate[];
  chain: WorkflowStep[];
}

export interface WorkflowGate {
  gate: string;
  message: string;
  condition?: string;
}

export interface WorkflowStep {
  step: string;
  description?: string;
  plugin?: string;
  input?: string | string[];
  output?: string;
  mandatoryCheck?: string;
}

// ============================================
// UI TYPES
// ============================================

export interface QuickAction {
  id: number;
  label: string;
  action: string;
  params?: Record<string, any>;
}

export interface ConfirmationState {
  success: boolean;
  message: string;
  details?: string[];
  nextActions?: QuickAction[];
}
