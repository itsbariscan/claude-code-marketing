/**
 * Onboarding Flow
 * Guides users through setting up their first brand
 *
 * Progressive disclosure: Start minimal, expand based on user engagement
 */

import { createBrand, setActiveBrand } from '../core/brand/brand-manager';
import { initLedger } from '../core/state';
import { Brand, BusinessInfo, AudienceInfo } from '../types';

// ============================================
// ONBOARDING STATE
// ============================================

export interface OnboardingState {
  step: OnboardingStep;
  collected: Partial<OnboardingData>;
  skipped: string[];
}

export type OnboardingStep =
  | 'welcome'
  | 'name'
  | 'website'
  | 'industry'
  | 'product'
  | 'audience'
  | 'competitors'
  | 'current_marketing'
  | 'complete';

export interface OnboardingData {
  name: string;
  website: string;
  industry: string;
  product: string;
  businessModel: string;
  usp: string;
  audienceDescription: string;
  geo: string[];
  painPoints: string[];
  competitors: string[];
  currentChannels: string[];
}

// ============================================
// ONBOARDING PROMPTS (for Claude Code)
// ============================================

export const ONBOARDING_SKILL_PROMPT = `
## Brand Onboarding Flow

Guide users through creating a brand profile. Use progressive disclosure - start minimal, expand based on engagement.

### Required Fields (must ask)
1. Brand name
2. Website URL

### Optional Fields (ask if user seems engaged)
3. Industry/vertical
4. Main product/service
5. Target audience
6. Competitors

### Onboarding Style
- Ask ONE question at a time
- Accept minimal answers ("tech startup" is fine for industry)
- Offer to skip optional fields
- Don't overwhelm with questions
- Support "go back" / "wait" / "change that" to edit previous answers

### Example Flow

**Minimal Path (3 questions):**
User: "new brand"
→ "What's the brand name?"
User: "Acme Corp"
→ "What's the website?"
User: "acme.com"
→ "Got it! Acme Corp (acme.com) created. What would you like help with?"

**Engaged Path (5-7 questions):**
User: "I want to set up a new client"
→ "Let's set up your client. What's the brand name?"
User: "TechFlow - it's a B2B SaaS for project management"
→ [Detected: name + product] "Got TechFlow. What's the website?"
User: "techflow.io"
→ [Since they gave context] "What industry are they in? (skip if unsure)"
User: "Project management / productivity"
→ "Who's their target audience?"
User: "Engineering teams at mid-size companies"
→ "Any competitors I should know about?"
User: "Asana, Monday, Jira"
→ "Perfect! TechFlow is set up. Ready to help with SEO, content, or strategy?"

### Detection from Context

If user provides info naturally, extract it:
- "new brand called X" → name: X
- "for X company" → name: X
- "at X.com" / "website is X" → website: X
- "they sell Y" / "it's a Y product" → product: Y
- "B2B SaaS" / "ecommerce" → businessModel
- "targeting Z" / "for Z audience" → audience

### Completion

When done:
1. Create brand with collected data
2. Set as active brand
3. Initialize continuity ledger
4. Offer next actions
`;

// ============================================
// ONBOARDING FUNCTIONS
// ============================================

/**
 * Initialize onboarding state
 */
export function initOnboarding(): OnboardingState {
  return {
    step: 'welcome',
    collected: {},
    skipped: [],
  };
}

/**
 * Get the next question based on current state
 */
export function getNextQuestion(state: OnboardingState): {
  question: string;
  field: keyof OnboardingData;
  optional: boolean;
  hint?: string;
} | null {
  // Required fields first
  if (!state.collected.name) {
    return {
      question: "What's the brand name?",
      field: 'name',
      optional: false,
    };
  }

  if (!state.collected.website) {
    return {
      question: "What's the website URL?",
      field: 'website',
      optional: false,
      hint: 'Just the domain is fine (e.g., acme.com)',
    };
  }

  // At this point, brand can be created
  // Optional fields below - ask based on engagement

  if (
    !state.collected.industry &&
    !state.skipped.includes('industry')
  ) {
    return {
      question: 'What industry are they in?',
      field: 'industry',
      optional: true,
      hint: 'e.g., SaaS, ecommerce, consulting (or skip)',
    };
  }

  if (
    !state.collected.product &&
    !state.skipped.includes('product')
  ) {
    return {
      question: "What's their main product or service?",
      field: 'product',
      optional: true,
    };
  }

  if (
    !state.collected.audienceDescription &&
    !state.skipped.includes('audience')
  ) {
    return {
      question: "Who's their target audience?",
      field: 'audienceDescription',
      optional: true,
      hint: 'e.g., "engineering teams at startups"',
    };
  }

  if (
    state.collected.competitors === undefined &&
    !state.skipped.includes('competitors')
  ) {
    return {
      question: 'Any competitors I should know about?',
      field: 'competitors',
      optional: true,
      hint: 'List domains or names, separated by commas',
    };
  }

  return null; // All done
}

/**
 * Check if response is a go-back request
 */
export function isGoBackRequest(response: string): boolean {
  const goBackPatterns = [
    'go back',
    'wait',
    'change that',
    'fix that',
    'undo',
    'previous',
    'back',
    'correction',
    'let me correct',
    'actually no',
  ];
  const lower = response.toLowerCase().trim();
  return goBackPatterns.some(p => lower.includes(p));
}

/**
 * Get the previous step for going back
 */
export function getPreviousStep(currentStep: OnboardingStep): OnboardingStep | null {
  const stepOrder: OnboardingStep[] = [
    'welcome', 'name', 'website', 'industry', 'product', 'audience', 'competitors', 'current_marketing', 'complete'
  ];
  const currentIndex = stepOrder.indexOf(currentStep);
  if (currentIndex <= 1) return null; // Can't go back from welcome or name
  return stepOrder[currentIndex - 1];
}

/**
 * Go back to the previous field
 */
export function goBackOneStep(state: OnboardingState): { state: OnboardingState; message: string } | null {
  const previousStep = getPreviousStep(state.step);
  if (!previousStep) {
    return null;
  }

  // Get the field for the previous step
  const stepToField: Partial<Record<OnboardingStep, keyof OnboardingData>> = {
    name: 'name',
    website: 'website',
    industry: 'industry',
    product: 'product',
    audience: 'audienceDescription',
    competitors: 'competitors',
  };

  const previousField = stepToField[previousStep];
  const previousValue = previousField ? state.collected[previousField] : null;

  // Clear the previous field and go back
  const newCollected = { ...state.collected };
  if (previousField) {
    delete newCollected[previousField];
  }

  return {
    state: {
      ...state,
      step: previousStep,
      collected: newCollected,
      skipped: state.skipped.filter(s => s !== previousField),
    },
    message: previousValue
      ? `Going back. You entered "${previousValue}" - what would you like to change it to?`
      : `Going back. Let's try that question again.`
  };
}

/**
 * Process user response and update state
 */
export function processResponse(
  state: OnboardingState,
  field: keyof OnboardingData,
  response: string
): OnboardingState | { goBack: true; state: OnboardingState; message: string } {
  const lower = response.toLowerCase().trim();

  // Handle go-back requests
  if (isGoBackRequest(response)) {
    const result = goBackOneStep(state);
    if (result) {
      return { goBack: true, ...result };
    }
    // Can't go back further, continue with current flow
  }

  // Handle skip
  if (
    lower === 'skip' ||
    lower === 'no' ||
    lower === "don't know" ||
    lower === 'not sure'
  ) {
    return {
      ...state,
      skipped: [...state.skipped, field],
    };
  }

  // Process specific fields
  let value: any = response.trim();

  if (field === 'website') {
    // Clean up website
    value = value
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
  }

  if (field === 'competitors' || field === 'geo' || field === 'painPoints') {
    // Parse comma-separated lists
    value = response
      .split(/[,\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  if (field === 'currentChannels') {
    // Parse marketing channels
    value = response
      .split(/[,\n]+/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0);
  }

  return {
    ...state,
    collected: {
      ...state.collected,
      [field]: value,
    },
  };
}

/**
 * Check if we have enough to create brand
 */
export function canCreateBrand(state: OnboardingState): boolean {
  return !!(state.collected.name && state.collected.website);
}

/**
 * Create brand from onboarding data
 */
export function finishOnboarding(state: OnboardingState): Brand | null {
  if (!canCreateBrand(state)) {
    return null;
  }

  const data = state.collected;

  // Build business info
  const business: BusinessInfo = {
    industry: data.industry || '',
    product: data.product || '',
    model: data.businessModel || '',
    usp: data.usp || '',
  };

  // Build audience info
  const audience: AudienceInfo = {
    primary: {
      description: data.audienceDescription || '',
    },
    geo: data.geo || [],
    painPoints: data.painPoints || [],
  };

  // Build competitors
  const competitors = (data.competitors || []).map((domain: string) => ({
    domain: domain.replace(/^https?:\/\//, '').replace(/^www\./, ''),
  }));

  try {
    const brand = createBrand({
      name: data.name!,
      website: data.website!,
      business,
      audience,
      competitors,
    });

    if (brand) {
      // Initialize session
      initLedger(brand.id, brand.name, 'Initial setup');
    }

    return brand;
  } catch (error) {
    console.error('Failed to create brand:', error);
    return null;
  }
}

/**
 * Extract data from natural language
 */
export function extractFromNaturalLanguage(
  message: string,
  state: OnboardingState
): OnboardingState {
  let newState = { ...state, collected: { ...state.collected } };

  // Extract brand name
  // "brand called X" / "new client X" / "set up X"
  const namePatterns = [
    /(?:brand|client|company|project)(?:\s+(?:called|named))?\s+["']?([A-Z][a-zA-Z0-9\s]+?)["']?(?:\s|,|\.|\-|$)/,
    /(?:set up|create|add)\s+["']?([A-Z][a-zA-Z0-9\s]+?)["']?(?:\s|,|\.|\-|$)/,
  ];

  for (const pattern of namePatterns) {
    const match = message.match(pattern);
    if (match && !newState.collected.name) {
      newState.collected.name = match[1].trim();
      break;
    }
  }

  // Extract website
  const websiteMatch = message.match(
    /(?:website(?:\s+is)?|at|url:?)\s*["']?((?:https?:\/\/)?[\w.-]+\.[a-z]{2,})["']?/i
  );
  if (websiteMatch && !newState.collected.website) {
    newState.collected.website = websiteMatch[1]
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '');
  }

  // Also check for standalone domain mentions
  const domainMatch = message.match(/\b([\w-]+\.(?:com|io|co|org|net|app))\b/i);
  if (domainMatch && !newState.collected.website) {
    newState.collected.website = domainMatch[1];
  }

  // Extract industry/product context
  const contextPatterns = [
    /(?:it'?s?\s+a|they(?:'re|\s+are)\s+a)\s+([^.]+?)(?:\.|,|$)/i,
    /(?:B2B|B2C)\s+(\w+)/i,
    /(?:SaaS|ecommerce|e-commerce|agency|consultancy|startup)/i,
  ];

  for (const pattern of contextPatterns) {
    const match = message.match(pattern);
    if (match) {
      const context = match[1] || match[0];
      if (!newState.collected.product && context.length < 50) {
        newState.collected.product = context.trim();
      }
      break;
    }
  }

  // Extract audience
  const audienceMatch = message.match(
    /(?:target(?:ing)?|for|audience(?:\s+is)?)\s+["']?([^.,"]+)["']?/i
  );
  if (audienceMatch && !newState.collected.audienceDescription) {
    newState.collected.audienceDescription = audienceMatch[1].trim();
  }

  return newState;
}

// ============================================
// ONBOARDING DISPLAY
// ============================================

/**
 * Format welcome message
 */
export function getWelcomeMessage(): string {
  return `
👋 Let's set up your brand profile.

I'll ask a few quick questions to understand your brand. You can skip any optional questions.

**Required:** Brand name, website
**Optional:** Industry, audience, competitors

Let's start - what's the brand name?
`.trim();
}

/**
 * Format completion message
 */
export function getCompletionMessage(brand: Brand): string {
  let message = `
✅ **${brand.name}** is set up!

📁 Brand Profile:
• Website: ${brand.website}
`;

  if (brand.business.industry) {
    message += `• Industry: ${brand.business.industry}\n`;
  }
  if (brand.business.product) {
    message += `• Product: ${brand.business.product}\n`;
  }
  if (brand.audience.primary.description) {
    message += `• Audience: ${brand.audience.primary.description}\n`;
  }
  if (brand.competitors.length > 0) {
    message += `• Competitors: ${brand.competitors.map((c) => c.domain).join(', ')}\n`;
  }

  message += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What would you like to do?
• Ask about SEO strategy
• Research keywords
• Analyze competitors
• Build a content plan
• Audit current marketing
`;

  return message.trim();
}

/**
 * Format quick setup message (minimal path)
 */
export function getQuickSetupMessage(brand: Brand): string {
  return `
✅ **${brand.name}** created! (${brand.website})

You can add more details anytime with \`/brand update\`.

What would you like help with?
`.trim();
}
