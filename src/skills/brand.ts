/**
 * /brand Skill
 * Manages brand context for marketing sessions
 *
 * Commands:
 *   /brand                    - Show active brand or list all
 *   /brand list               - List all brands
 *   /brand new                - Create a new brand (starts onboarding)
 *   /brand switch <name>      - Switch to a different brand
 *   /brand info               - Show detailed brand info
 *   /brand update             - Update brand information
 *   /brand add-competitor     - Add a competitor
 *   /brand add-note           - Add a note to the brand
 */

import {
  createBrand,
  getBrand,
  listBrands,
  getActiveBrand,
  setActiveBrand,
  searchBrands,
  addCompetitor,
  addNote,
  loadBrandMetadata,
  loadBrandInstructions,
  updateBrand,
} from '../core/brand/brand-manager';
import { initLedger, getLedger, getDetailedStatus } from '../core/state';
import { getHandoff, formatHandoffDisplay, hasHandoff } from '../core/state';
import { Brand } from '../types';

// ============================================
// SKILL PROMPT (for Claude Code integration)
// ============================================

export const BRAND_SKILL_PROMPT = `
## /brand - Brand Management

Manage marketing brands and client context.

### Usage

When user invokes /brand, parse the command and execute the appropriate action:

| Command | Action |
|---------|--------|
| /brand | Show active brand summary or list brands if none active |
| /brand list | Show all brands with brief info |
| /brand new | Start onboarding flow to create a brand |
| /brand switch <name> | Switch to a different brand |
| /brand info | Show detailed info for active brand |
| /brand update | Interactive update of brand fields |
| /brand add-competitor <domain> | Add a competitor to track |
| /brand add-note <note> | Add a note to the brand |

### Natural Language Detection

Also detect these patterns and route to brand skill:
- "working on [brand]" → switch to brand
- "new client" / "new brand" → create brand
- "switch to [brand]" → switch
- "who am I working with" → show active

### Session Integration

When switching brands:
1. Create handoff for current brand (if any)
2. Load handoff for new brand (if exists)
3. Initialize continuity ledger
4. Show resume context if available
`;

// ============================================
// COMMAND HANDLERS
// ============================================

export interface BrandCommandResult {
  success: boolean;
  message: string;
  data?: any;
  nextActions?: string[];
}

/**
 * Main entry point for /brand skill
 */
export function handleBrandCommand(args: string): BrandCommandResult {
  const parts = args.trim().split(/\s+/);
  const subcommand = parts[0]?.toLowerCase() || '';
  const rest = parts.slice(1).join(' ');

  switch (subcommand) {
    case '':
      return handleBrandStatus();
    case 'list':
      return handleBrandList();
    case 'new':
      return handleBrandNew();
    case 'switch':
      return handleBrandSwitch(rest);
    case 'info':
      return handleBrandInfo();
    case 'update':
      return handleBrandUpdate(rest);
    case 'add-competitor':
      return handleAddCompetitor(rest);
    case 'add-note':
      return handleAddNote(rest);
    default:
      // Try to interpret as a brand name to switch to
      return handleBrandSwitch(args);
  }
}

/**
 * Show active brand status or list brands
 */
function handleBrandStatus(): BrandCommandResult {
  const active = getActiveBrand();

  if (active) {
    const ledger = getLedger();
    let message = `📁 Active Brand: ${active.name}\n`;
    message += `🌐 ${active.website}\n`;
    message += `🏢 ${active.business.industry || 'Industry not set'}\n`;

    if (ledger) {
      message += `\n${getDetailedStatus()}`;
    }

    return {
      success: true,
      message,
      data: { brand: active, ledger },
      nextActions: [
        '/brand info - See full details',
        '/brand switch <name> - Work on different brand',
        'Start asking marketing questions!',
      ],
    };
  }

  // No active brand - show list
  const brands = listBrands();
  if (brands.length === 0) {
    return {
      success: true,
      message: 'No brands yet. Create your first brand to get started.',
      nextActions: ['/brand new - Create a brand'],
    };
  }

  return handleBrandList();
}

/**
 * List all brands
 */
function handleBrandList(): BrandCommandResult {
  const brands = listBrands();
  const active = getActiveBrand();

  if (brands.length === 0) {
    return {
      success: true,
      message: 'No brands yet.',
      nextActions: ['/brand new - Create your first brand'],
    };
  }

  let message = '📋 YOUR BRANDS\n\n';

  for (const brand of brands) {
    const isActive = active?.id === brand.id;
    const marker = isActive ? '→ ' : '  ';
    const metadata = loadBrandMetadata(brand.id);

    message += `${marker}${brand.name}`;
    if (isActive) message += ' (active)';
    message += `\n`;
    message += `   ${brand.website}`;
    if (metadata?.industry) message += ` • ${metadata.industry}`;
    message += `\n`;

    // Show handoff status
    if (hasHandoff(brand.id)) {
      const handoff = getHandoff(brand.id);
      if (handoff) {
        message += `   📌 Last session: ${handoff.lastSession.date}`;
        if (handoff.lastSession.inProgress.length > 0) {
          message += ` (${handoff.lastSession.inProgress.length} in progress)`;
        }
        message += `\n`;
      }
    }

    message += `\n`;
  }

  return {
    success: true,
    message,
    data: { brands, activeId: active?.id },
    nextActions: [
      '/brand switch <name> - Work on a brand',
      '/brand new - Create a new brand',
    ],
  };
}

/**
 * Start brand creation (returns prompt for onboarding)
 */
function handleBrandNew(): BrandCommandResult {
  return {
    success: true,
    message: 'Let\'s set up a new brand. I\'ll need some basic information.',
    data: { action: 'start_onboarding' },
    nextActions: [
      'What\'s the brand name?',
      'What\'s the website URL?',
    ],
  };
}

/**
 * Switch to a different brand
 */
function handleBrandSwitch(nameOrId: string): BrandCommandResult {
  if (!nameOrId) {
    return {
      success: false,
      message: 'Please specify a brand name or ID.',
      nextActions: ['/brand list - See all brands'],
    };
  }

  // Try exact ID match first
  let brand = getBrand(nameOrId);

  // Try search if no exact match
  if (!brand) {
    const matches = searchBrands(nameOrId);
    if (matches.length === 1) {
      brand = matches[0];
    } else if (matches.length > 1) {
      const names = matches.map((b) => b.name).join(', ');
      return {
        success: false,
        message: `Multiple brands match "${nameOrId}": ${names}`,
        nextActions: matches.map((b) => `/brand switch ${b.id}`),
      };
    }
  }

  if (!brand) {
    return {
      success: false,
      message: `Brand "${nameOrId}" not found.`,
      nextActions: ['/brand list - See all brands', '/brand new - Create a brand'],
    };
  }

  // Switch to the brand
  setActiveBrand(brand.id);

  // Initialize continuity ledger for new session
  initLedger(brand.id, brand.name);

  let message = `✅ Switched to ${brand.name}\n\n`;

  // Check for handoff from previous session
  if (hasHandoff(brand.id)) {
    const handoff = getHandoff(brand.id);
    if (handoff) {
      message += formatHandoffDisplay(handoff);
    }
  } else {
    message += `No previous session context.\n`;
    message += `\n🎯 ${brand.name} (${brand.website})\n`;
    if (brand.business.industry) {
      message += `🏢 ${brand.business.industry}\n`;
    }
  }

  return {
    success: true,
    message,
    data: { brand, handoff: getHandoff(brand.id) },
    nextActions: [
      '/brand info - See full details',
      'Start asking marketing questions!',
    ],
  };
}

/**
 * Show detailed brand info
 */
function handleBrandInfo(): BrandCommandResult {
  const brand = getActiveBrand();

  if (!brand) {
    return {
      success: false,
      message: 'No active brand. Switch to a brand first.',
      nextActions: ['/brand list'],
    };
  }

  const instructions = loadBrandInstructions(brand.id);

  let message = `📁 BRAND DETAILS: ${brand.name}\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Basic info
  message += `🌐 Website: ${brand.website}\n`;
  message += `📅 Created: ${brand.created}\n`;
  message += `📅 Last updated: ${brand.lastUpdated}\n\n`;

  // Business info
  message += `📊 BUSINESS\n`;
  message += `• Industry: ${brand.business.industry || 'Not set'}\n`;
  message += `• Product: ${brand.business.product || 'Not set'}\n`;
  message += `• Model: ${brand.business.model || 'Not set'}\n`;
  message += `• USP: ${brand.business.usp || 'Not set'}\n\n`;

  // Audience
  if (instructions?.audience) {
    message += `👥 AUDIENCE\n`;
    message += `• Primary: ${instructions.audience.primary || 'Not set'}\n`;
    if (instructions.audience.secondary) {
      message += `• Secondary: ${instructions.audience.secondary}\n`;
    }
    if (instructions.audience.geo.length > 0) {
      message += `• Geography: ${instructions.audience.geo.join(', ')}\n`;
    }
    message += `\n`;
  }

  // Competitors
  if (brand.competitors.length > 0) {
    message += `⚔️ COMPETITORS\n`;
    for (const comp of brand.competitors) {
      message += `• ${comp.domain}`;
      if (comp.yourAngle) message += ` → ${comp.yourAngle}`;
      message += `\n`;
    }
    message += `\n`;
  }

  // Current investments
  if (instructions?.currentInvestments.active.length) {
    message += `💰 CURRENT INVESTMENTS\n`;
    for (const channel of instructions.currentInvestments.active) {
      const status = instructions.currentInvestments.status[channel] || 'unknown';
      message += `• ${channel}: ${status}\n`;
    }
    message += `\n`;
  }

  // Notes
  if (brand.notes.length > 0) {
    message += `📝 NOTES (${brand.notes.length})\n`;
    for (const note of brand.notes.slice(-3)) {
      message += `• [${note.date}] ${note.content}\n`;
    }
    message += `\n`;
  }

  return {
    success: true,
    message,
    data: { brand, instructions },
    nextActions: [
      '/brand update - Update information',
      '/brand add-competitor <domain>',
      '/brand add-note <note>',
    ],
  };
}

/**
 * Update brand information
 */
function handleBrandUpdate(field: string): BrandCommandResult {
  const brand = getActiveBrand();

  if (!brand) {
    return {
      success: false,
      message: 'No active brand.',
      nextActions: ['/brand list'],
    };
  }

  if (!field) {
    return {
      success: true,
      message: 'What would you like to update?',
      data: { action: 'prompt_update', brand },
      nextActions: [
        'Update industry',
        'Update audience',
        'Update USP',
        'Add competitor',
        'Add note',
      ],
    };
  }

  return {
    success: true,
    message: `Ready to update ${field}. What's the new value?`,
    data: { action: 'update_field', field, brand },
  };
}

/**
 * Add a competitor
 */
function handleAddCompetitor(domain: string): BrandCommandResult {
  const brand = getActiveBrand();

  if (!brand) {
    return {
      success: false,
      message: 'No active brand.',
      nextActions: ['/brand list'],
    };
  }

  if (!domain) {
    return {
      success: false,
      message: 'Please provide a competitor domain.',
      nextActions: ['Example: /brand add-competitor competitor.com'],
    };
  }

  try {
    addCompetitor(brand.id, { domain });
    return {
      success: true,
      message: `✅ Added competitor: ${domain}`,
      nextActions: [
        '/brand info - See all competitors',
        `Tell me about ${domain}'s strengths`,
      ],
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to add competitor',
    };
  }
}

/**
 * Add a note
 */
function handleAddNote(noteContent: string): BrandCommandResult {
  const brand = getActiveBrand();

  if (!brand) {
    return {
      success: false,
      message: 'No active brand.',
      nextActions: ['/brand list'],
    };
  }

  if (!noteContent) {
    return {
      success: false,
      message: 'Please provide a note.',
      nextActions: ['Example: /brand add-note Client prefers formal tone'],
    };
  }

  try {
    addNote(brand.id, noteContent);
    return {
      success: true,
      message: `✅ Note added`,
      nextActions: ['/brand info - See all notes'],
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to add note',
    };
  }
}

// ============================================
// NATURAL LANGUAGE DETECTION
// ============================================

/**
 * Detect brand-related intent from natural language
 */
export function detectBrandIntent(
  message: string
): { detected: boolean; action?: string; entity?: string } {
  const lower = message.toLowerCase();

  // "working on X" / "switch to X" / "let's work on X"
  const switchPatterns = [
    /(?:working on|switch to|let'?s work on|working with)\s+["']?([^"']+)["']?/i,
    /(?:open|load|activate)\s+["']?([^"']+)["']?(?:\s+brand)?/i,
  ];

  for (const pattern of switchPatterns) {
    const match = message.match(pattern);
    if (match) {
      return { detected: true, action: 'switch', entity: match[1].trim() };
    }
  }

  // "new client" / "new brand" / "create brand"
  if (
    /(?:new|create|add|setup|set up)\s+(?:client|brand|project)/i.test(lower)
  ) {
    return { detected: true, action: 'new' };
  }

  // "who am I working with" / "current brand" / "active brand"
  if (
    /(?:who am i|what'?s? (?:the )?(?:current|active)|which (?:brand|client))/i.test(
      lower
    )
  ) {
    return { detected: true, action: 'status' };
  }

  // "show brands" / "list brands" / "my brands"
  if (/(?:show|list|my|all)\s+(?:brands|clients)/i.test(lower)) {
    return { detected: true, action: 'list' };
  }

  return { detected: false };
}
