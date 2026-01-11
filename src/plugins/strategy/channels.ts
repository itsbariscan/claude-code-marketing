/**
 * Channel Strategy Module
 * Audit and recommend marketing channels
 *
 * KEY PRINCIPLE: Optimize before expand
 * - Audit existing investments first
 * - Only recommend new channels if current ones are optimized
 */

import { getActiveBrand, loadBrandInstructions } from '../../core/brand/brand-manager';
import { ChannelStrategy, ChannelRecommendation, MarketingInvestments } from '../../types';

// ============================================
// CHANNEL STRATEGY PROMPT
// ============================================

export const CHANNEL_STRATEGY_PROMPT = `
## Channel Strategy

Audit and optimize marketing channels with mandatory gates.

---

## The Iron Law

\`\`\`
NO NEW CHANNEL RECOMMENDATIONS WITHOUT CURRENT CHANNEL AUDIT FIRST
\`\`\`

If you haven't audited existing investments, you CANNOT recommend new channels.
Recommending new channels without auditing current ones = wasting money.
Violating the letter of this rule is violating the spirit.

---

## Optimize Before Expand Gate (MANDATORY)

This gate is NON-NEGOTIABLE. You MUST complete it before ANY channel discussion.

### Step 1: Discover Current Investments (MUST ASK)

"What marketing channels are you currently investing in?"

Wait for answer. Do not proceed until you have this list:
- [ ] Google Ads?
- [ ] Meta Ads (Facebook/Instagram)?
- [ ] LinkedIn Ads?
- [ ] SEO/Content?
- [ ] Email marketing?
- [ ] Social media (organic)?
- [ ] Other paid channels?

### Step 2: Assess Each Active Channel (MUST ASK)

For EACH channel they mention, ask:

"For [channel], what's the performance?"
- Profitable (making money)?
- Break-even (covering costs)?
- Unprofitable (losing money)?
- Unknown (not tracking)?

### Step 3: Gate Check

**IF any channel is "unprofitable" or "break-even" or "unknown":**
\`\`\`
⛔ GATE BLOCKED: Cannot recommend new channels.

Current channel [X] needs attention first:
- Performance: [unprofitable/break-even/unknown]
- Recommendation: [Optimize/Pause/Set up tracking]

Let's fix this before considering new investments.
\`\`\`

**IF all channels are "profitable":**
\`\`\`
✅ GATE PASSED: Current channels healthy.

Now we can discuss:
1. Scaling existing profitable channels
2. Testing new channels
\`\`\`

---

## Channel Audit Output Format (exact structure)

\`\`\`
📊 CHANNEL AUDIT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Channel | Status | Performance | Action |
|---------|--------|-------------|--------|
| Google Ads | Active | Profitable | 📈 SCALE |
| Meta Ads | Active | Break-even | 🔧 OPTIMIZE |
| SEO | Active | Unknown | 📊 TRACK |
| LinkedIn | Inactive | - | - |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Recommendations (Priority Order)

### 🥇 Priority 1: [Channel]
- **Action:** [OPTIMIZE/SCALE/PAUSE]
- **Why:** [Specific reason]
- **Next Step:** [Specific action]

### 🥈 Priority 2: [Channel]
- **Action:** [OPTIMIZE/SCALE/PAUSE]
- **Why:** [Specific reason]
- **Next Step:** [Specific action]

### ⛔ Avoid/Pause:
- [Channel]: [Why to avoid]

## Gate Status
- Current channels audited: ✅
- All channels profitable: [Yes/No]
- Can recommend new channels: [Yes/No + reason]

## Data Sources
- Performance data from: [User reported / API / Assumption]
\`\`\`

---

## Recommendation Rules

| Performance | Recommendation | Reasoning |
|-------------|----------------|-----------|
| **Profitable** | SCALE or MAINTAIN | Working - invest more or hold |
| **Break-even** | OPTIMIZE | Has potential - fix before scaling |
| **Unprofitable** | PAUSE or OPTIMIZE | Losing money - stop the bleeding |
| **Unknown** | TRACK | Can't optimize what you can't measure |

### NEVER:
- Recommend new channels when existing ones are unprofitable
- Suggest "try everything" approaches
- Skip the audit because user asked about specific channel
- Assume channel will work because "it works for others"

---

## Red Flags - STOP

If you catch yourself:
- Recommending TikTok/LinkedIn/new channel without asking about current spend
- Saying "you should diversify channels" without auditing first
- Suggesting budget allocation without knowing current performance
- Skipping the gate because user seems eager to try something new

**STOP. Complete the audit. Then recommend.**

---

## Common Rationalization Patterns

| User Says | Tempted to Do | Correct Response |
|-----------|---------------|------------------|
| "Should I try TikTok?" | Discuss TikTok pros/cons | "First, what channels are you currently using? Let me audit those." |
| "I want to expand to LinkedIn" | Help with LinkedIn | "Before adding channels, are your current ones profitable?" |
| "What's the best channel for B2B?" | Recommend LinkedIn/Google | "Depends on your current situation. What are you already doing?" |
| "I have budget for new channels" | Suggest new channels | "Great! Let's make sure current channels are optimized first." |

---

## Verification Before Completion

BEFORE presenting channel recommendations:

1. ✅ Did I ask about current investments?
2. ✅ Did I assess performance of each active channel?
3. ✅ Did I complete the gate check?
4. ✅ Are recommendations in priority order?
5. ✅ Did I state gate status (can/cannot recommend new)?
6. ✅ Did I explain WHY for each recommendation?

If NO to any: Go back and complete.

---

## Natural Language Triggers

- "what channels should I focus on"
- "channel strategy"
- "should I try [channel]"
- "audit my marketing"
- "where should I advertise"
`;

// ============================================
// CHANNEL TYPES
// ============================================

export type MarketingChannel =
  | 'seo'
  | 'google_ads'
  | 'meta_ads'
  | 'linkedin_ads'
  | 'email'
  | 'content'
  | 'social_organic'
  | 'affiliate'
  | 'pr'
  | 'podcast'
  | 'events';

export interface ChannelAudit {
  channel: MarketingChannel;
  isActive: boolean;
  budget?: string;
  performance?: 'profitable' | 'unprofitable' | 'break-even' | 'unknown';
  assessment: ChannelAssessment;
  recommendation: ChannelRecommendation;
}

export interface ChannelAssessment {
  isOptimized: boolean;
  improvementPotential: 'high' | 'medium' | 'low';
  issues: string[];
  opportunities: string[];
}

// ============================================
// CHANNEL AUDIT FUNCTIONS
// ============================================

/**
 * Get current channel investments from brand
 */
export function getCurrentInvestments(brandId: string): MarketingInvestments | null {
  const brand = getActiveBrand();
  if (!brand || brand.id !== brandId) return null;

  return brand.currentInvestments;
}

/**
 * Determine if brand has active investments to audit
 */
export function hasActiveInvestments(brandId: string): boolean {
  const investments = getCurrentInvestments(brandId);
  if (!investments) return false;

  return Object.values(investments).some((inv) => inv?.active);
}

/**
 * Get list of active channels
 */
export function getActiveChannels(brandId: string): MarketingChannel[] {
  const investments = getCurrentInvestments(brandId);
  if (!investments) return [];

  const channels: MarketingChannel[] = [];

  if (investments.googleAds?.active) channels.push('google_ads');
  if (investments.metaAds?.active) channels.push('meta_ads');
  if (investments.seo?.active) channels.push('seo');
  if (investments.email?.active) channels.push('email');
  if (investments.social?.active) channels.push('social_organic');

  return channels;
}

/**
 * Assess a single channel
 */
export function assessChannel(
  channel: MarketingChannel,
  performance: 'profitable' | 'unprofitable' | 'break-even' | 'unknown',
  budget?: string
): ChannelAssessment {
  const issues: string[] = [];
  const opportunities: string[] = [];
  let isOptimized = false;
  let improvementPotential: 'high' | 'medium' | 'low' = 'medium';

  // Assess based on performance
  switch (performance) {
    case 'profitable':
      isOptimized = true;
      improvementPotential = 'medium';
      opportunities.push('Consider scaling investment');
      opportunities.push('Test new audiences/keywords');
      break;

    case 'break-even':
      isOptimized = false;
      improvementPotential = 'high';
      issues.push('Not generating positive ROI');
      opportunities.push('Optimize targeting');
      opportunities.push('Improve conversion rate');
      opportunities.push('Test new creative/messaging');
      break;

    case 'unprofitable':
      isOptimized = false;
      improvementPotential = 'high';
      issues.push('Losing money');
      issues.push('Needs immediate attention or pause');
      opportunities.push('Audit targeting and keywords');
      opportunities.push('Review landing pages');
      opportunities.push('Consider reducing spend while optimizing');
      break;

    case 'unknown':
      isOptimized = false;
      improvementPotential = 'high';
      issues.push('Performance not tracked');
      opportunities.push('Set up proper tracking');
      opportunities.push('Define KPIs and benchmarks');
      break;
  }

  return {
    isOptimized,
    improvementPotential,
    issues,
    opportunities,
  };
}

/**
 * Generate recommendation for a channel
 */
export function generateChannelRecommendation(
  channel: MarketingChannel,
  assessment: ChannelAssessment,
  performance: 'profitable' | 'unprofitable' | 'break-even' | 'unknown'
): ChannelRecommendation {
  const channelName = formatChannelName(channel);

  if (performance === 'profitable' && assessment.isOptimized) {
    return {
      name: channelName,
      action: 'scale',
      reason: 'Channel is performing well. Consider increasing investment.',
    };
  }

  if (performance === 'profitable') {
    return {
      name: channelName,
      action: 'maintain',
      reason: 'Channel is profitable. Optimize before scaling.',
    };
  }

  if (performance === 'break-even') {
    return {
      name: channelName,
      action: 'optimize',
      reason: 'Channel has potential but needs optimization to become profitable.',
    };
  }

  if (performance === 'unprofitable') {
    return {
      name: channelName,
      action: 'pause',
      reason: 'Channel is losing money. Pause and audit before continuing.',
    };
  }

  return {
    name: channelName,
    action: 'optimize',
    reason: 'Set up tracking to understand performance before deciding next steps.',
  };
}

/**
 * Format channel name for display
 */
function formatChannelName(channel: MarketingChannel): string {
  const names: Record<MarketingChannel, string> = {
    seo: 'SEO / Organic Search',
    google_ads: 'Google Ads',
    meta_ads: 'Meta Ads (Facebook/Instagram)',
    linkedin_ads: 'LinkedIn Ads',
    email: 'Email Marketing',
    content: 'Content Marketing',
    social_organic: 'Social Media (Organic)',
    affiliate: 'Affiliate Marketing',
    pr: 'PR / Press',
    podcast: 'Podcast',
    events: 'Events',
  };

  return names[channel] || channel;
}

// ============================================
// CHANNEL RECOMMENDATION ENGINE
// ============================================

/**
 * Build full channel strategy
 * Respects "optimize before expand" principle
 */
export function buildChannelStrategy(
  brandId: string,
  audits: ChannelAudit[]
): ChannelStrategy {
  const strategy: ChannelStrategy = {
    avoid: [],
  };

  // Separate recommendations by action type
  const toScale = audits.filter((a) => a.recommendation.action === 'scale');
  const toOptimize = audits.filter((a) => a.recommendation.action === 'optimize');
  const toPause = audits.filter((a) => a.recommendation.action === 'pause');

  // Priority 1: Scale what's working
  if (toScale.length > 0) {
    strategy.priority1 = toScale[0].recommendation;
  }

  // Priority 2: Optimize what needs work
  if (toOptimize.length > 0) {
    if (!strategy.priority1) {
      strategy.priority1 = toOptimize[0].recommendation;
    } else {
      strategy.priority2 = toOptimize[0].recommendation;
    }
  }

  // Avoid: Channels to pause
  strategy.avoid = toPause.map((a) => a.recommendation);

  return strategy;
}

/**
 * Check if ready to recommend new channels
 */
export function canRecommendNewChannels(audits: ChannelAudit[]): {
  ready: boolean;
  reason: string;
} {
  // No active channels = can recommend starting
  if (audits.length === 0) {
    return {
      ready: true,
      reason: 'No active channels. Ready to recommend starting investments.',
    };
  }

  // Check if any channels need optimization
  const needsOptimization = audits.some(
    (a) =>
      a.recommendation.action === 'optimize' ||
      a.recommendation.action === 'pause'
  );

  if (needsOptimization) {
    return {
      ready: false,
      reason: 'Current channels need optimization before expanding to new ones.',
    };
  }

  return {
    ready: true,
    reason: 'Current channels are performing well. Ready to consider expansion.',
  };
}

/**
 * Format channel audit for display
 */
export function formatChannelAudit(audit: ChannelAudit): string {
  const statusEmoji = {
    scale: '📈',
    optimize: '🔧',
    maintain: '✅',
    pause: '⏸️',
    avoid: '❌',
    start: '🚀',
  };

  let output = `${statusEmoji[audit.recommendation.action]} **${formatChannelName(audit.channel)}**\n`;
  output += `   Performance: ${audit.performance || 'Unknown'}\n`;
  output += `   Recommendation: ${audit.recommendation.action.toUpperCase()}\n`;
  output += `   ${audit.recommendation.reason}\n`;

  if (audit.assessment.issues.length > 0) {
    output += `   Issues: ${audit.assessment.issues.join(', ')}\n`;
  }

  if (audit.assessment.opportunities.length > 0) {
    output += `   Opportunities: ${audit.assessment.opportunities.slice(0, 2).join(', ')}\n`;
  }

  return output;
}

/**
 * Format full channel strategy
 */
export function formatChannelStrategy(strategy: ChannelStrategy): string {
  let output = `📊 CHANNEL STRATEGY\n\n`;
  output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (strategy.priority1) {
    output += `🥇 PRIORITY 1: ${strategy.priority1.name}\n`;
    output += `   Action: ${strategy.priority1.action.toUpperCase()}\n`;
    output += `   ${strategy.priority1.reason}\n\n`;
  }

  if (strategy.priority2) {
    output += `🥈 PRIORITY 2: ${strategy.priority2.name}\n`;
    output += `   Action: ${strategy.priority2.action.toUpperCase()}\n`;
    output += `   ${strategy.priority2.reason}\n\n`;
  }

  if (strategy.priority3) {
    output += `🥉 PRIORITY 3: ${strategy.priority3.name}\n`;
    output += `   Action: ${strategy.priority3.action.toUpperCase()}\n`;
    output += `   ${strategy.priority3.reason}\n\n`;
  }

  if (strategy.avoid.length > 0) {
    output += `⏸️ PAUSE/AVOID:\n`;
    for (const channel of strategy.avoid) {
      output += `   • ${channel.name}: ${channel.reason}\n`;
    }
  }

  return output;
}
