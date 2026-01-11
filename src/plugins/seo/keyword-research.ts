/**
 * Keyword Research Module
 * Supports: Claude reasoning, pasted data, screenshot analysis, API integration
 */

import { KeywordData, ParsedData } from '../../types';
import { getActiveBrand, loadBrandInstructions } from '../../core/brand/brand-manager';
import { storeWhatWorked } from '../../core/state';

// ============================================
// KEYWORD RESEARCH SKILL PROMPT
// ============================================

export const KEYWORD_RESEARCH_PROMPT = `
## Keyword Research

Analyze and prioritize keywords with explicit data sourcing and anti-hallucination gates.

---

## The Iron Law

\`\`\`
NO METRICS WITHOUT DATA SOURCE
\`\`\`

If you don't have actual data, you CANNOT state specific numbers.
Violating the letter of this rule is violating the spirit.

---

## Data Source Gate

BEFORE analyzing ANY keyword:

1. **IDENTIFY data source**: What data do I have?
   - API (configured integration)
   - Paste (user provided CSV/TSV)
   - Screenshot (extracted from image)
   - Reasoning-only (no external data)

2. **DECLARE confidence level**:
   | Source | Confidence | What You Can Claim |
   |--------|------------|-------------------|
   | API | High | Exact metrics with source |
   | Paste | Medium | Metrics as provided (may be outdated) |
   | Screenshot | Low-Medium | Visible metrics only |
   | Reasoning | Low | Qualitative assessments only |

3. **STATE limitations upfront**: What DON'T you know?

Skip any step = hallucinating data

---

## Analysis Framework (Per Keyword)

| Factor | With Data | Without Data |
|--------|-----------|--------------|
| **Volume** | State exact number + source | "Cannot quantify - need tool data" |
| **Difficulty** | State KD score + source | "Likely [easy/medium/hard] because: [structure reasoning]" |
| **Relevance** | Match against brand context | "Appears [high/medium/low] based on keyword terms" |
| **Position** | State rank from GSC | "Unknown current ranking" |
| **CPC** | State value + source | "Cannot estimate without data" |

---

## Output Format (use exactly)

\`\`\`
📊 KEYWORD ANALYSIS

**Data Source:** [API/Paste/Screenshot/Reasoning-only]
**Confidence:** [High/Medium/Low]
**Brand Context:** [Loaded/Not loaded]

| Priority | Keyword | Volume | KD | Intent | Reasoning |
|----------|---------|--------|----|---------| ----------|
| 🏆 Quick Win | "keyword" | [num or ?] | [num or ?] | [type] | [specific reason] |
| 🎯 Strategic | "keyword" | [num or ?] | [num or ?] | [type] | [specific reason] |
| ⏳ Long-term | "keyword" | [num or ?] | [num or ?] | [type] | [specific reason] |
| ❌ Avoid | "keyword" | [num or ?] | [num or ?] | [type] | [specific reason] |

⚠️ **Data Limitations:**
- [List what you don't know]
- [List assumptions made]
\`\`\`

---

## Priority Classification Rules

| Priority | Requirements (ALL must be true) |
|----------|--------------------------------|
| **Quick Win** | Relevance: High + Difficulty: Easy + (Position 11-30 OR no current ranking) |
| **Strategic** | Relevance: High + Intent: Commercial/Transactional + Worth investment |
| **Long-term** | Relevance: High + Difficulty: Hard + High potential value |
| **Avoid** | Relevance: Low OR Intent: Navigational (other brand) OR Difficulty: Impossible |

NEVER classify as "Quick Win" without knowing:
- Current ranking (from GSC) OR
- Explicit difficulty data showing easy

---

## Red Flags - STOP and Verify

If you catch yourself:
- Writing a specific number without stating source
- Saying "5,000 monthly searches" without data
- Claiming "this is a quick win" without ranking data
- Stating "difficulty is 45" without KD score
- Assuming relevance without checking brand context
- Saying "you should rank for this" without evidence

**STOP. Declare uncertainty. Ask for data.**

---

## Common Hallucination Patterns to Avoid

| Tempted to Say | Say Instead |
|----------------|-------------|
| "This keyword gets 5,000 searches/month" | "Without volume data, I cannot quantify demand" |
| "Difficulty is 45/100" | "No KD data. Based on keyword structure (X words, Y modifier), likely [easy/medium/hard]" |
| "You're ranking #15" | "I don't have GSC data. Do you know your current position?" |
| "This is definitely a quick win" | "Could be a quick win IF you're already ranking 11-30 and difficulty is low" |
| "Competitors are targeting this" | "Without competitor data, I'm inferring based on keyword commercial intent" |

---

## When You Don't Have Data

Instead of inventing metrics, respond:

\`\`\`
For "[keyword]":
- Volume: Unknown (need Ahrefs/SEMrush data)
- Difficulty: Likely [LEVEL] because [structural reasoning]
- Intent: [TYPE] based on keyword modifiers
- Priority: Cannot determine without [missing data]

**To improve this analysis, provide:**
- [ ] Paste keyword data from Ahrefs/SEMrush
- [ ] Share GSC query report for current rankings
- [ ] Confirm brand context is loaded (/brand switch)
\`\`\`

---

## Verification Before Completion

BEFORE presenting keyword analysis:

1. ✅ Did I state my data source?
2. ✅ Did I declare confidence level?
3. ✅ Did I list limitations?
4. ✅ Is every number sourced or marked "?"?
5. ✅ Did I avoid claiming "quick wins" without ranking data?

If NO to any: Fix before presenting.

---

## Natural Language Triggers

- "find keywords for [topic]"
- "keyword research"
- "what should I rank for"
- "analyze these keywords"
- "which keywords should we target"
`;

// ============================================
// KEYWORD ANALYSIS FUNCTIONS
// ============================================

export interface KeywordAnalysis {
  keyword: string;
  relevance: 'high' | 'medium' | 'low';
  intent: 'informational' | 'navigational' | 'commercial' | 'transactional';
  difficulty: 'easy' | 'medium' | 'hard';
  priority: 'quick-win' | 'strategic' | 'long-term' | 'avoid';
  reasoning: string;
  volume?: number;
  currentPosition?: number;
}

export interface KeywordResearchResult {
  source: ParsedData['source'];
  confidence: ParsedData['confidence'];
  keywords: KeywordAnalysis[];
  quickWins: KeywordAnalysis[];
  strategicTargets: KeywordAnalysis[];
  avoid: KeywordAnalysis[];
  suggestions: string[];
}

/**
 * Parse keyword data from pasted text
 */
export function parseKeywordData(text: string): KeywordData[] {
  const lines = text.trim().split('\n');
  const keywords: KeywordData[] = [];

  // Try to detect format
  const firstLine = lines[0].toLowerCase();
  const isCSV = text.includes(',');
  const isTSV = text.includes('\t');
  const delimiter = isTSV ? '\t' : isCSV ? ',' : /\s{2,}/;

  // Detect column positions
  const headers = firstLine.split(delimiter);
  const columnMap: Record<string, number> = {};

  headers.forEach((header, idx) => {
    const h = header.trim().toLowerCase();
    if (h.includes('keyword') || h.includes('query') || h.includes('term')) {
      columnMap.keyword = idx;
    }
    if (h.includes('volume') || h.includes('searches')) {
      columnMap.volume = idx;
    }
    if (h.includes('difficult') || h.includes('kd')) {
      columnMap.difficulty = idx;
    }
    if (h.includes('cpc') || h.includes('cost')) {
      columnMap.cpc = idx;
    }
    if (h.includes('position') || h.includes('rank')) {
      columnMap.position = idx;
    }
    if (h.includes('impression')) {
      columnMap.impressions = idx;
    }
    if (h.includes('click')) {
      columnMap.clicks = idx;
    }
    if (h.includes('ctr')) {
      columnMap.ctr = idx;
    }
  });

  // Parse data rows (skip header)
  const dataRows = lines.slice(1);

  for (const row of dataRows) {
    if (!row.trim()) continue;

    const cols = row.split(delimiter).map((c) =>
      typeof c === 'string' ? c.trim() : c
    );

    const keywordData: KeywordData = {
      keyword: cols[columnMap.keyword || 0] || '',
    };

    if (columnMap.volume !== undefined) {
      keywordData.volume = parseNumber(cols[columnMap.volume]);
    }
    if (columnMap.difficulty !== undefined) {
      keywordData.difficulty = parseNumber(cols[columnMap.difficulty]);
    }
    if (columnMap.cpc !== undefined) {
      keywordData.cpc = parseNumber(cols[columnMap.cpc]);
    }
    if (columnMap.position !== undefined) {
      keywordData.position = parseNumber(cols[columnMap.position]);
    }
    if (columnMap.impressions !== undefined) {
      keywordData.impressions = parseNumber(cols[columnMap.impressions]);
    }
    if (columnMap.clicks !== undefined) {
      keywordData.clicks = parseNumber(cols[columnMap.clicks]);
    }
    if (columnMap.ctr !== undefined) {
      keywordData.ctr = parseNumber(cols[columnMap.ctr]);
    }

    if (keywordData.keyword) {
      keywords.push(keywordData);
    }
  }

  return keywords;
}

/**
 * Parse a number from various formats
 */
function parseNumber(value: any): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const cleaned = String(value)
    .replace(/[,$%]/g, '')
    .replace(/k$/i, '000')
    .replace(/m$/i, '000000');

  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

/**
 * Classify keyword intent
 */
export function classifyIntent(
  keyword: string
): KeywordAnalysis['intent'] {
  const lower = keyword.toLowerCase();

  // Transactional signals
  if (
    /\b(buy|purchase|order|price|pricing|cost|cheap|discount|deal|coupon|free trial|demo|quote)\b/.test(
      lower
    )
  ) {
    return 'transactional';
  }

  // Commercial signals
  if (
    /\b(best|top|review|vs|versus|comparison|compare|alternative|like)\b/.test(
      lower
    )
  ) {
    return 'commercial';
  }

  // Navigational signals
  if (
    /\b(login|sign in|website|official|contact|support|app)\b/.test(lower) ||
    lower.includes('.com') ||
    lower.includes('.io')
  ) {
    return 'navigational';
  }

  // Default to informational
  return 'informational';
}

/**
 * Estimate difficulty bucket from various inputs
 */
export function estimateDifficulty(
  keyword: string,
  metrics?: {
    difficulty?: number;
    volume?: number;
    cpc?: number;
  }
): KeywordAnalysis['difficulty'] {
  // Use provided difficulty score
  if (metrics?.difficulty !== undefined) {
    if (metrics.difficulty <= 30) return 'easy';
    if (metrics.difficulty <= 60) return 'medium';
    return 'hard';
  }

  // Infer from CPC (high CPC = competitive)
  if (metrics?.cpc !== undefined) {
    if (metrics.cpc > 10) return 'hard';
    if (metrics.cpc > 3) return 'medium';
    return 'easy';
  }

  // Infer from keyword structure
  const words = keyword.split(/\s+/).length;
  if (words >= 4) return 'easy'; // Long-tail
  if (words === 1) return 'hard'; // Head term
  return 'medium';
}

/**
 * Determine keyword priority
 */
export function determineKeywordPriority(
  keyword: string,
  analysis: {
    relevance: KeywordAnalysis['relevance'];
    difficulty: KeywordAnalysis['difficulty'];
    intent: KeywordAnalysis['intent'];
    currentPosition?: number;
  }
): KeywordAnalysis['priority'] {
  const { relevance, difficulty, intent, currentPosition } = analysis;

  // Avoid: low relevance or wrong intent
  if (relevance === 'low') return 'avoid';
  if (intent === 'navigational' && relevance !== 'high') return 'avoid';

  // Quick win: already ranking + easy + relevant
  if (currentPosition && currentPosition <= 20 && difficulty === 'easy') {
    return 'quick-win';
  }

  // Quick win: easy + high relevance
  if (difficulty === 'easy' && relevance === 'high') {
    return 'quick-win';
  }

  // Strategic: high relevance + commercial/transactional
  if (
    relevance === 'high' &&
    (intent === 'commercial' || intent === 'transactional')
  ) {
    return 'strategic';
  }

  // Long-term: hard difficulty (already filtered out low relevance above)
  if (difficulty === 'hard') {
    return 'long-term';
  }

  return 'strategic';
}

/**
 * Analyze keywords with brand context
 */
export function analyzeKeywords(
  keywords: KeywordData[],
  brandContext?: {
    product?: string;
    audience?: string;
    industry?: string;
  }
): KeywordAnalysis[] {
  return keywords.map((kw) => {
    const intent = classifyIntent(kw.keyword);
    const difficulty = estimateDifficulty(kw.keyword, {
      difficulty: kw.difficulty,
      volume: kw.volume,
      cpc: kw.cpc,
    });

    // Estimate relevance based on brand context
    let relevance: KeywordAnalysis['relevance'] = 'medium';
    if (brandContext) {
      const lower = kw.keyword.toLowerCase();
      const hasProductMatch =
        brandContext.product &&
        (lower.includes(brandContext.product.toLowerCase()) ||
          brandContext.product.toLowerCase().includes(lower));
      const hasIndustryMatch =
        brandContext.industry &&
        lower.includes(brandContext.industry.toLowerCase());

      if (hasProductMatch) relevance = 'high';
      else if (hasIndustryMatch) relevance = 'medium';
    }

    const priority = determineKeywordPriority(kw.keyword, {
      relevance,
      difficulty,
      intent,
      currentPosition: kw.position,
    });

    return {
      keyword: kw.keyword,
      relevance,
      intent,
      difficulty,
      priority,
      reasoning: generateKeywordReasoning(kw, { relevance, intent, difficulty, priority }),
      volume: kw.volume,
      currentPosition: kw.position,
    };
  });
}

/**
 * Generate reasoning for keyword prioritization
 */
function generateKeywordReasoning(
  keyword: KeywordData,
  analysis: {
    relevance: string;
    intent: string;
    difficulty: string;
    priority: string;
  }
): string {
  const parts: string[] = [];

  if (analysis.priority === 'quick-win') {
    if (keyword.position && keyword.position <= 20) {
      parts.push(`Already ranking #${keyword.position}`);
    }
    parts.push(`${analysis.difficulty} difficulty`);
    parts.push(`${analysis.relevance} relevance`);
  } else if (analysis.priority === 'strategic') {
    parts.push(`${analysis.intent} intent (valuable)`);
    if (keyword.volume) {
      parts.push(`${keyword.volume.toLocaleString()} volume`);
    }
  } else if (analysis.priority === 'avoid') {
    if (analysis.relevance === 'low') {
      parts.push('Low relevance to brand');
    }
    if (analysis.intent === 'navigational') {
      parts.push('Navigational intent (brand search)');
    }
  } else {
    parts.push(`${analysis.difficulty} difficulty`);
    parts.push(`${analysis.intent} intent`);
  }

  return parts.join('; ');
}

/**
 * Generate keyword suggestions based on brand
 */
export function suggestKeywords(
  brandId: string
): string[] {
  const brand = getActiveBrand();
  if (!brand) return [];

  const suggestions: string[] = [];
  const instructions = loadBrandInstructions(brandId);

  // Product-based suggestions
  if (brand.business.product) {
    suggestions.push(`${brand.business.product} software`);
    suggestions.push(`best ${brand.business.product}`);
    suggestions.push(`${brand.business.product} for small business`);
    suggestions.push(`how to ${brand.business.product}`);
  }

  // Audience-based suggestions
  if (instructions?.audience.primary) {
    suggestions.push(`${brand.business.product} for ${instructions.audience.primary}`);
  }

  // Competitor-based suggestions
  for (const comp of brand.competitors.slice(0, 2)) {
    suggestions.push(`${comp.domain.replace('.com', '').replace('.io', '')} alternative`);
    suggestions.push(`${comp.domain.replace('.com', '').replace('.io', '')} vs`);
  }

  return suggestions;
}
