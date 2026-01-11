/**
 * Competitor Analysis Module
 * Analyze competitors' SEO and content strategies
 */

import { getActiveBrand } from '../../core/brand/brand-manager';

// ============================================
// COMPETITOR ANALYSIS PROMPT
// ============================================

export const COMPETITOR_ANALYSIS_PROMPT = `
## Competitor Analysis

Analyze competitors with clear data source attribution.

---

## The Iron Law

\`\`\`
NO COMPETITOR CLAIMS WITHOUT SOURCE DECLARATION
\`\`\`

State where your competitor information comes from.
Violating the letter of this rule is violating the spirit.

---

## Data Source Gate

BEFORE analyzing any competitor:

1. **IDENTIFY data source**:
   - Ahrefs/SEMrush MCP (competitor keywords, traffic)
   - Pasted data (user-provided export)
   - Public analysis (visible on their site)
   - Reasoning-based (inferred from domain/industry)

2. **DECLARE confidence**:
   | Source | Confidence |
   |--------|------------|
   | MCP API data | High |
   | Pasted tool export | Medium |
   | Public site analysis | Medium |
   | Reasoning only | Low |

---

## Analysis Types

1. **SEO Gap Analysis** - Keywords they rank for that you don't
2. **Content Analysis** - Topics, formats, publishing frequency
3. **Positioning Analysis** - How they position, USP, messaging

---

## Output Format (exact structure)

\`\`\`
🔍 COMPETITOR ANALYSIS: [domain]

**Data Source:** [MCP/Pasted/Public/Reasoning]
**Confidence:** [High/Medium/Low]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 Positioning: [their positioning]

💪 STRENGTHS
• [strength]

📉 WEAKNESSES
• [weakness]

🎯 KEYWORD OPPORTUNITIES
• "[keyword]" - they rank #X

⚡ DIFFERENTIATION ANGLES
• [angle]

✅ ACTION ITEMS
• [action]

💡 For detailed competitor metrics, connect Ahrefs or SEMrush MCP.
\`\`\`

---

## Red Flags - STOP

If you catch yourself:
- Claiming competitor traffic numbers without MCP data
- Stating "they rank #X" without tool data
- Making up competitor keyword lists

**STOP. Analyze only what you can verify or mark as reasoning-based.**

---

## Natural Language Triggers

- "analyze [competitor]"
- "competitor analysis"
- "what is [competitor] doing"
- "how does [competitor] rank"
- "find competitor keywords"
`;

// ============================================
// COMPETITOR TYPES
// ============================================

export interface CompetitorProfile {
  domain: string;
  name?: string;
  positioning?: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  keywordOverlap?: number;
  estimatedTraffic?: string;
}

export interface CompetitorKeywordGap {
  keyword: string;
  competitorPosition: number;
  yourPosition?: number;
  volume?: number;
  difficulty?: string;
  opportunity: 'high' | 'medium' | 'low';
}

export interface CompetitorContentGap {
  topic: string;
  competitorCoverage: string;
  yourCoverage: 'none' | 'partial' | 'full';
  priority: 'high' | 'medium' | 'low';
  contentSuggestion: string;
}

export interface CompetitorAnalysisResult {
  competitor: CompetitorProfile;
  keywordGaps: CompetitorKeywordGap[];
  contentGaps: CompetitorContentGap[];
  actionItems: string[];
  differentiationAngles: string[];
  dataSource: 'mcp' | 'pasted' | 'public' | 'reasoning';
  confidence: 'high' | 'medium' | 'low';
}

// ============================================
// ANALYSIS FUNCTIONS
// ============================================

/**
 * Get competitors from active brand
 */
export function getBrandCompetitors(): { domain: string; yourAngle?: string }[] {
  const brand = getActiveBrand();
  if (!brand) return [];

  return brand.competitors.map((c) => ({
    domain: c.domain,
    yourAngle: c.yourAngle,
  }));
}

/**
 * Parse competitor keyword data
 */
export function parseCompetitorKeywords(
  text: string,
  competitorDomain: string
): CompetitorKeywordGap[] {
  const lines = text.trim().split('\n');
  const gaps: CompetitorKeywordGap[] = [];

  // Simple CSV/TSV parsing
  for (const line of lines.slice(1)) {
    const parts = line.split(/[,\t]/);
    if (parts.length >= 2) {
      const keyword = parts[0].trim();
      const position = parseInt(parts[1], 10);

      if (keyword && !isNaN(position)) {
        gaps.push({
          keyword,
          competitorPosition: position,
          volume: parts[2] ? parseInt(parts[2], 10) : undefined,
          difficulty: parts[3]?.trim(),
          opportunity: position <= 10 ? 'high' : position <= 20 ? 'medium' : 'low',
        });
      }
    }
  }

  return gaps;
}

/**
 * Identify content gaps based on competitor topics
 */
export function identifyContentGaps(
  competitorTopics: string[],
  yourTopics: string[]
): CompetitorContentGap[] {
  const gaps: CompetitorContentGap[] = [];
  const yourTopicsLower = yourTopics.map((t) => t.toLowerCase());

  for (const topic of competitorTopics) {
    const topicLower = topic.toLowerCase();
    const hasPartialMatch = yourTopicsLower.some(
      (t) => t.includes(topicLower) || topicLower.includes(t)
    );

    let coverage: 'none' | 'partial' | 'full' = 'none';
    if (yourTopicsLower.includes(topicLower)) {
      coverage = 'full';
    } else if (hasPartialMatch) {
      coverage = 'partial';
    }

    if (coverage !== 'full') {
      gaps.push({
        topic,
        competitorCoverage: 'Has content',
        yourCoverage: coverage,
        priority: coverage === 'none' ? 'high' : 'medium',
        contentSuggestion: suggestContentForGap(topic, coverage),
      });
    }
  }

  return gaps;
}

/**
 * Suggest content to fill a gap
 */
function suggestContentForGap(
  topic: string,
  currentCoverage: 'none' | 'partial'
): string {
  if (currentCoverage === 'none') {
    return `Create comprehensive content covering "${topic}"`;
  }
  return `Expand existing content to better cover "${topic}"`;
}

/**
 * Generate differentiation angles
 */
export function generateDifferentiationAngles(
  competitor: CompetitorProfile,
  brandContext?: {
    usp?: string;
    product?: string;
    audience?: string;
  }
): string[] {
  const angles: string[] = [];

  // Based on competitor weaknesses
  for (const weakness of competitor.weaknesses) {
    angles.push(`Highlight strength where competitor is weak: ${weakness}`);
  }

  // Based on brand USP
  if (brandContext?.usp) {
    angles.push(`Lead with your USP: ${brandContext.usp}`);
  }

  // Generic differentiation strategies
  if (competitor.domain) {
    angles.push(`Create "[your brand] vs ${competitor.domain}" comparison content`);
    angles.push(`Target "${competitor.domain} alternative" keywords`);
  }

  return angles;
}

/**
 * Format competitor analysis for display
 */
export function formatCompetitorAnalysis(result: CompetitorAnalysisResult): string {
  const sourceLabels = {
    mcp: 'MCP API',
    pasted: 'Pasted data',
    public: 'Public analysis',
    reasoning: 'Reasoning-based'
  };
  const confidenceLabels = {
    high: 'High',
    medium: 'Medium',
    low: 'Low'
  };

  let output = `🔍 COMPETITOR ANALYSIS: ${result.competitor.domain}\n\n`;
  output += `**Data Source:** ${sourceLabels[result.dataSource] || 'Reasoning-based'}\n`;
  output += `**Confidence:** ${confidenceLabels[result.confidence] || 'Medium'}\n\n`;
  output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Profile
  if (result.competitor.positioning) {
    output += `📌 Positioning: ${result.competitor.positioning}\n\n`;
  }

  // Strengths
  if (result.competitor.strengths.length > 0) {
    output += `💪 STRENGTHS\n`;
    for (const s of result.competitor.strengths) {
      output += `• ${s}\n`;
    }
    output += `\n`;
  }

  // Weaknesses
  if (result.competitor.weaknesses.length > 0) {
    output += `📉 WEAKNESSES\n`;
    for (const w of result.competitor.weaknesses) {
      output += `• ${w}\n`;
    }
    output += `\n`;
  }

  // Keyword gaps
  if (result.keywordGaps.length > 0) {
    output += `🎯 KEYWORD OPPORTUNITIES\n`;
    const topGaps = result.keywordGaps
      .filter((g) => g.opportunity === 'high')
      .slice(0, 5);
    for (const gap of topGaps) {
      output += `• "${gap.keyword}" - they rank #${gap.competitorPosition}`;
      if (gap.volume) output += ` (${gap.volume} vol)`;
      output += `\n`;
    }
    output += `\n`;
  }

  // Content gaps
  if (result.contentGaps.length > 0) {
    output += `📝 CONTENT GAPS\n`;
    const priorityGaps = result.contentGaps
      .filter((g) => g.priority === 'high')
      .slice(0, 5);
    for (const gap of priorityGaps) {
      output += `• ${gap.topic}: ${gap.contentSuggestion}\n`;
    }
    output += `\n`;
  }

  // Differentiation angles
  if (result.differentiationAngles.length > 0) {
    output += `⚡ DIFFERENTIATION ANGLES\n`;
    for (const angle of result.differentiationAngles.slice(0, 3)) {
      output += `• ${angle}\n`;
    }
    output += `\n`;
  }

  // Action items
  if (result.actionItems.length > 0) {
    output += `✅ ACTION ITEMS\n`;
    for (const item of result.actionItems) {
      output += `• ${item}\n`;
    }
    output += `\n`;
  }

  // MCP enhancement hint for reasoning-based analysis
  if (result.dataSource === 'reasoning') {
    output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    output += `💡 **Enhance with live metrics:**\n`;
    output += `   Connect Ahrefs or SEMrush MCP for competitor keywords and traffic data.\n`;
  }

  return output;
}
