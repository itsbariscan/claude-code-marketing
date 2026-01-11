/**
 * Strategy Plugin
 * Marketing strategy tools for Claude Code Marketing
 */

// Import prompts for use in combined prompt
import { POSITIONING_PROMPT, PERSONA_PROMPT } from './positioning';
import { CHANNEL_STRATEGY_PROMPT } from './channels';
import { PLAYBOOK_PROMPT } from './playbook';

// Positioning
export {
  POSITIONING_PROMPT,
  PERSONA_PROMPT,
  buildPositioningStatement,
  formatPositioningStatement,
  savePositioning,
  buildPersona,
  formatPersona,
  type PositioningInput,
  type PersonaInput,
} from './positioning';

// Channel Strategy
export {
  CHANNEL_STRATEGY_PROMPT,
  getCurrentInvestments,
  hasActiveInvestments,
  getActiveChannels,
  assessChannel,
  generateChannelRecommendation,
  buildChannelStrategy,
  canRecommendNewChannels,
  formatChannelAudit,
  formatChannelStrategy,
  type MarketingChannel,
  type ChannelAudit,
  type ChannelAssessment,
} from './channels';

// Playbook
export {
  PLAYBOOK_PROMPT,
  generatePlaybook,
  addPlaybookTask,
  updateTaskStatus,
  getPendingTasks,
  getCompletedTasks,
  formatPlaybook,
} from './playbook';

// ============================================
// STRATEGY PLUGIN METADATA
// ============================================

export const STRATEGY_PLUGIN = {
  name: 'Strategy',
  version: '0.1.0',
  description: 'Positioning, personas, channel strategy, and playbooks',
  skills: ['positioning', 'personas', 'channel-strategy', 'playbook'],
  triggers: [
    // Positioning
    'positioning', 'how should we position', 'messaging', 'tagline',
    'what makes us different', 'differentiation',

    // Personas
    'persona', 'audience', 'who are we targeting', 'buyer persona',

    // Channel strategy
    'channel', 'channels', 'where should we market', 'marketing mix',
    'audit my marketing', 'should I try',

    // Playbook
    'playbook', 'action plan', 'what should I do', 'marketing plan',
    'next steps', 'priorities',
  ],
};

// ============================================
// STRATEGY SKILL PROMPTS (combined)
// ============================================

export const STRATEGY_SYSTEM_PROMPT = `
# Strategy Plugin

You have access to strategic marketing capabilities.

## Available Features

### 1. Positioning & Messaging
${POSITIONING_PROMPT}

### 2. Persona Development
${PERSONA_PROMPT}

### 3. Channel Strategy
${CHANNEL_STRATEGY_PROMPT}

### 4. Marketing Playbook
${PLAYBOOK_PROMPT}

## Mandatory Gates

### Before Recommending New Channels
ALWAYS audit existing investments first. Ask:
1. "What marketing channels are you currently investing in?"
2. "How are they performing?"

Only recommend NEW channels if current ones are optimized.

## Always Consider

1. Brand context and positioning
2. Current investments and performance
3. Resource constraints
4. Actionable, prioritized output
`;
