/**
 * Export Module
 * Export data in various formats (markdown, text)
 */

import * as fs from 'fs';
import * as path from 'path';
import { PATHS, getTimestamp, getDateString } from '../storage';
import { getBrand, loadBrandInstructions } from '../brand/brand-manager';
import { getHistorySummary, getBrandHistory } from '../history';
import { getBrandLearnings } from '../state';
import { Brand, Session, Learning } from '../../types';

// ============================================
// EXPORT FORMATS
// ============================================

export type ExportFormat = 'markdown' | 'text' | 'json';

export interface ExportOptions {
  format?: ExportFormat;
  includeHistory?: boolean;
  includeLearnings?: boolean;
  historyLimit?: number;
}

// ============================================
// BRAND EXPORT
// ============================================

/**
 * Export a brand profile
 */
export function exportBrand(
  brandId: string,
  options: ExportOptions = {}
): string {
  const brand = getBrand(brandId);
  if (!brand) {
    throw new Error(`Brand "${brandId}" not found`);
  }

  const format = options.format || 'markdown';

  switch (format) {
    case 'markdown':
      return exportBrandMarkdown(brand, options);
    case 'text':
      return exportBrandText(brand, options);
    case 'json':
      return JSON.stringify(brand, null, 2);
    default:
      return exportBrandMarkdown(brand, options);
  }
}

/**
 * Export brand as markdown
 */
function exportBrandMarkdown(brand: Brand, options: ExportOptions): string {
  const instructions = loadBrandInstructions(brand.id);
  let md = `# ${brand.name}\n\n`;
  md += `**Website:** ${brand.website}\n\n`;
  md += `**Created:** ${brand.created} | **Last Updated:** ${brand.lastUpdated}\n\n`;

  // Business Info
  md += `## Business\n\n`;
  md += `- **Industry:** ${brand.business.industry || 'Not set'}\n`;
  md += `- **Product:** ${brand.business.product || 'Not set'}\n`;
  md += `- **Model:** ${brand.business.model || 'Not set'}\n`;
  md += `- **USP:** ${brand.business.usp || 'Not set'}\n\n`;

  // Audience
  md += `## Audience\n\n`;
  md += `- **Primary:** ${brand.audience.primary.description || 'Not set'}\n`;
  if (brand.audience.secondary) {
    md += `- **Secondary:** ${brand.audience.secondary.description}\n`;
  }
  if (brand.audience.geo.length > 0) {
    md += `- **Geography:** ${brand.audience.geo.join(', ')}\n`;
  }
  if (brand.audience.painPoints.length > 0) {
    md += `- **Pain Points:**\n`;
    for (const pain of brand.audience.painPoints) {
      md += `  - ${pain}\n`;
    }
  }
  md += `\n`;

  // Competitors
  if (brand.competitors.length > 0) {
    md += `## Competitors\n\n`;
    for (const comp of brand.competitors) {
      md += `- **${comp.domain}**`;
      if (comp.yourAngle) md += ` - Your angle: ${comp.yourAngle}`;
      md += `\n`;
    }
    md += `\n`;
  }

  // Strategy
  if (brand.strategy) {
    md += `## Strategy\n\n`;

    if (brand.strategy.positioning) {
      md += `### Positioning\n\n`;
      const p = brand.strategy.positioning;
      md += `For **${p.for}** who **${p.who}**, `;
      md += `${brand.name} is a **${p.product}** that **${p.benefit}**. `;
      md += `Unlike ${p.unlike}, we **${p.differentiator}**.\n\n`;
      if (p.tagline) {
        md += `**Tagline:** ${p.tagline}\n\n`;
      }
    }

    if (brand.strategy.personas && brand.strategy.personas.length > 0) {
      md += `### Personas\n\n`;
      for (const persona of brand.strategy.personas) {
        md += `#### ${persona.name}\n`;
        md += `- **Role:** ${persona.role}\n`;
        if (persona.companySize) md += `- **Company Size:** ${persona.companySize}\n`;
        md += `- **Pain Points:** ${persona.painPoints.join(', ')}\n`;
        md += `- **Goals:** ${persona.goals.join(', ')}\n\n`;
      }
    }

    if (brand.strategy.contentPillars && brand.strategy.contentPillars.length > 0) {
      md += `### Content Pillars\n\n`;
      for (const pillar of brand.strategy.contentPillars) {
        md += `- ${pillar}\n`;
      }
      md += `\n`;
    }
  }

  // Current Investments
  if (brand.currentInvestments) {
    const investments = Object.entries(brand.currentInvestments).filter(
      ([, inv]) => inv?.active
    );
    if (investments.length > 0) {
      md += `## Current Investments\n\n`;
      for (const [channel, inv] of investments) {
        md += `- **${channel}:** ${inv?.performance || 'Unknown'} performance`;
        if (inv?.budget) md += ` (${inv.budget})`;
        md += `\n`;
      }
      md += `\n`;
    }
  }

  // Notes
  if (brand.notes.length > 0) {
    md += `## Notes\n\n`;
    for (const note of brand.notes) {
      md += `- [${note.date}] ${note.content}\n`;
    }
    md += `\n`;
  }

  // History summary
  if (options.includeHistory) {
    const history = getHistorySummary(brand.id);
    if (history.totalSessions > 0) {
      md += `## History Summary\n\n`;
      md += `- **Total Sessions:** ${history.totalSessions}\n`;
      md += `- **Total Activities:** ${history.totalActivities}\n`;
      md += `- **Last Session:** ${history.lastSession || 'N/A'}\n`;
      md += `- **Pending Action Items:** ${history.pendingActionItems}\n\n`;
    }
  }

  // Learnings
  if (options.includeLearnings) {
    const learnings = getBrandLearnings(brand.id);
    if (learnings.length > 0) {
      md += `## Learnings\n\n`;
      for (const learning of learnings.slice(0, 10)) {
        md += `- [${learning.type}] ${learning.content}`;
        if (learning.context) md += ` (${learning.context})`;
        md += `\n`;
      }
      md += `\n`;
    }
  }

  md += `---\n`;
  md += `*Exported on ${getDateString()} by Claude Code Marketing*\n`;

  return md;
}

/**
 * Export brand as plain text
 */
function exportBrandText(brand: Brand, options: ExportOptions): string {
  let text = `BRAND PROFILE: ${brand.name}\n`;
  text += `${'='.repeat(50)}\n\n`;

  text += `Website: ${brand.website}\n`;
  text += `Created: ${brand.created}\n`;
  text += `Last Updated: ${brand.lastUpdated}\n\n`;

  text += `BUSINESS\n${'-'.repeat(20)}\n`;
  text += `Industry: ${brand.business.industry || 'Not set'}\n`;
  text += `Product: ${brand.business.product || 'Not set'}\n`;
  text += `Model: ${brand.business.model || 'Not set'}\n`;
  text += `USP: ${brand.business.usp || 'Not set'}\n\n`;

  text += `AUDIENCE\n${'-'.repeat(20)}\n`;
  text += `Primary: ${brand.audience.primary.description || 'Not set'}\n`;
  if (brand.audience.geo.length > 0) {
    text += `Geography: ${brand.audience.geo.join(', ')}\n`;
  }
  text += `\n`;

  if (brand.competitors.length > 0) {
    text += `COMPETITORS\n${'-'.repeat(20)}\n`;
    for (const comp of brand.competitors) {
      text += `- ${comp.domain}\n`;
    }
    text += `\n`;
  }

  text += `\nExported on ${getDateString()}\n`;

  return text;
}

// ============================================
// SESSION EXPORT
// ============================================

/**
 * Export session history
 */
export function exportHistory(
  brandId: string,
  options: { format?: ExportFormat; limit?: number } = {}
): string {
  const sessions = getBrandHistory(brandId, { limit: options.limit || 10 });
  const format = options.format || 'markdown';

  if (sessions.length === 0) {
    return 'No session history found.';
  }

  switch (format) {
    case 'markdown':
      return exportHistoryMarkdown(brandId, sessions);
    case 'json':
      return JSON.stringify(sessions, null, 2);
    default:
      return exportHistoryText(brandId, sessions);
  }
}

/**
 * Export history as markdown
 */
function exportHistoryMarkdown(brandId: string, sessions: Session[]): string {
  let md = `# Session History: ${brandId}\n\n`;

  for (const session of sessions) {
    md += `## ${session.date}`;
    if (session.duration) md += ` (${session.duration})`;
    md += `\n\n`;

    if (session.activities.length > 0) {
      md += `### Activities\n\n`;
      for (const activity of session.activities) {
        md += `- **${activity.type}**`;
        if (activity.target) md += ` - ${activity.target}`;
        md += `\n`;
        if (activity.outputSummary) {
          md += `  - Result: ${activity.outputSummary}\n`;
        }
        if (activity.actionItems.length > 0) {
          md += `  - Action Items:\n`;
          for (const item of activity.actionItems) {
            const status = item.status === 'completed' ? '✓' : '○';
            md += `    - [${status}] ${item.task}\n`;
          }
        }
      }
      md += `\n`;
    }

    if (session.notes.length > 0) {
      md += `### Notes\n\n`;
      for (const note of session.notes) {
        md += `- ${note}\n`;
      }
      md += `\n`;
    }
  }

  return md;
}

/**
 * Export history as plain text
 */
function exportHistoryText(brandId: string, sessions: Session[]): string {
  let text = `SESSION HISTORY: ${brandId}\n`;
  text += `${'='.repeat(50)}\n\n`;

  for (const session of sessions) {
    text += `${session.date}`;
    if (session.duration) text += ` (${session.duration})`;
    text += `\n${'-'.repeat(30)}\n`;

    for (const activity of session.activities) {
      text += `[${activity.type}]`;
      if (activity.target) text += ` ${activity.target}`;
      text += `\n`;
    }

    text += `\n`;
  }

  return text;
}

// ============================================
// FILE EXPORT
// ============================================

/**
 * Save export to file
 */
export function saveExport(
  content: string,
  filename: string,
  brandId?: string
): string {
  const exportDir = brandId
    ? path.join(PATHS.exports, brandId)
    : PATHS.exports;

  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const timestamp = getDateString();
  const fullFilename = `${timestamp}-${filename}`;
  const filePath = path.join(exportDir, fullFilename);

  fs.writeFileSync(filePath, content, 'utf-8');

  return filePath;
}

/**
 * List exported files for a brand
 */
export function listExports(brandId?: string): string[] {
  const exportDir = brandId
    ? path.join(PATHS.exports, brandId)
    : PATHS.exports;

  if (!fs.existsSync(exportDir)) {
    return [];
  }

  return fs.readdirSync(exportDir).filter((f) => !f.startsWith('.'));
}

// ============================================
// CONTENT BRIEF EXPORT
// ============================================

/**
 * Export content brief as markdown
 */
export function exportContentBrief(brief: {
  title: string;
  targetKeyword: string;
  supportingKeywords?: string[];
  searchIntent?: string;
  outline?: Array<{ heading: string; level: string }>;
  keyPointsToCover?: string[];
  wordCountRange?: { min: number; max: number };
}): string {
  let md = `# Content Brief\n\n`;
  md += `**Title:** ${brief.title}\n\n`;
  md += `**Target Keyword:** ${brief.targetKeyword}\n\n`;

  if (brief.supportingKeywords && brief.supportingKeywords.length > 0) {
    md += `**Supporting Keywords:** ${brief.supportingKeywords.join(', ')}\n\n`;
  }

  if (brief.searchIntent) {
    md += `**Search Intent:** ${brief.searchIntent}\n\n`;
  }

  if (brief.wordCountRange) {
    md += `**Word Count:** ${brief.wordCountRange.min}-${brief.wordCountRange.max} words\n\n`;
  }

  if (brief.outline && brief.outline.length > 0) {
    md += `## Outline\n\n`;
    for (const section of brief.outline) {
      const indent = section.level === 'h3' ? '  ' : '';
      md += `${indent}- ${section.heading}\n`;
    }
    md += `\n`;
  }

  if (brief.keyPointsToCover && brief.keyPointsToCover.length > 0) {
    md += `## Key Points to Cover\n\n`;
    for (const point of brief.keyPointsToCover) {
      md += `- [ ] ${point}\n`;
    }
    md += `\n`;
  }

  md += `---\n`;
  md += `*Generated by Claude Code Marketing on ${getDateString()}*\n`;

  return md;
}
