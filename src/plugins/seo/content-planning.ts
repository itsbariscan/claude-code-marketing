/**
 * Content Planning Module
 * Plan content based on keywords, audience, and brand strategy
 */

import { getActiveBrand, loadBrandInstructions } from '../../core/brand/brand-manager';
import { KeywordAnalysis } from './keyword-research';

// ============================================
// CONTENT PLANNING PROMPT
// ============================================

export const CONTENT_PLANNING_PROMPT = `
## Content Planning

Plan content strategy with explicit requirements and granular, actionable briefs.

---

## The Iron Law

\`\`\`
NO CONTENT RECOMMENDATIONS WITHOUT KEYWORD ANALYSIS FIRST
\`\`\`

If you haven't analyzed keywords (with data source declared), you CANNOT recommend content.
Content planning without keyword data = guessing topics.

---

## Prerequisites Gate

BEFORE creating ANY content plan:

1. **CHECK keyword data exists**:
   - Has keyword analysis been done?
   - What data source was used?
   - If no keywords: "I need keyword data first. Run keyword research or paste data."

2. **CHECK brand context loaded**:
   - Is brand active? (/brand info)
   - Do I know audience, product, industry?
   - If no brand: "Load brand context first: /brand switch [name]"

3. **DECLARE what I know vs. don't know**:
   - Keyword data: [Yes/No] + source
   - Brand context: [Loaded/Not loaded]
   - Competitor content: [Analyzed/Not analyzed]

Skip prerequisites = hallucinating content strategy

---

## Content Brief Structure (exact format)

\`\`\`
📝 CONTENT BRIEF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Title:** [Working title - not placeholder]
🎯 **Target Keyword:** [exact keyword]
📊 **Word Count:** [min]-[max] words
⏱️ **Estimated Time:** [X hours to write]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Search Intent
[1-2 sentences: What does the searcher want? Why are they searching this?]

## Target Audience
[Specific persona or segment from brand context]

## Outline

### H2: [Actual heading - not "[Topic]"]
- Key point 1
- Key point 2

### H2: [Actual heading]
- Key point 1
- Key point 2

[Continue with real headings, not placeholders]

## Key Points to Cover
- [ ] [Specific point relevant to keyword]
- [ ] [Another specific point]
- [ ] [Include: statistic/data if available]
- [ ] [Address common question about topic]

## Competitor Reference
- [URL if known, or "No competitor data"]
- What they cover that we should too
- Gap we can fill

## Internal Links
- Link to: [existing content if known]
- Link from: [pages that should link here]

## Call to Action
[Specific CTA based on intent + brand's business model]

## Data Sources Used
- Keyword data: [source]
- Brand context: [loaded/not loaded]
- Competitor analysis: [done/not done]
\`\`\`

---

## Placeholder Prohibition

NEVER output placeholders like:
- "[Topic]"
- "[First Step]"
- "[Company]"
- "[Result]"
- "Main Point 1"

If you don't know the specific content, either:
1. Ask for the information
2. Generate a reasonable specific example
3. Mark as "TBD - needs [specific input]"

---

## Content Type Selection Rules

| Keyword Pattern | Content Type | Why |
|-----------------|--------------|-----|
| "how to [verb]" | How-to guide | Tutorial intent |
| "best [noun]" | Listicle | Comparison shopping |
| "[A] vs [B]" | Comparison | Direct comparison intent |
| "[noun] guide" | Pillar page | Comprehensive coverage |
| "[product] pricing" | Pricing page | Bottom-funnel |
| "what is [noun]" | Educational blog | Informational intent |

If keyword doesn't match patterns: Default to blog post, explain reasoning.

---

## Word Count Estimation

| Content Type | Base Range | +50% if Competitive |
|--------------|------------|---------------------|
| Blog post | 1,200-2,000 | 1,800-3,000 |
| How-to guide | 1,500-2,500 | 2,250-3,750 |
| Pillar page | 3,000-5,000 | 4,500-7,500 |
| Comparison | 2,000-3,500 | 3,000-5,250 |
| Product page | 500-1,000 | 750-1,500 |

State: "Word count based on [content type] + [difficulty level if known]"

---

## Red Flags - STOP

If you catch yourself:
- Creating a content calendar without keyword data
- Suggesting topics without knowing brand context
- Using placeholder headings like "[Topic]"
- Recommending word counts without explaining basis
- Claiming "this will rank" without difficulty data

**STOP. Gather requirements. Then plan.**

---

## Common Hallucination Patterns

| Tempted to Say | Say Instead |
|----------------|-------------|
| "Write about [trending topic]" | "Based on keyword [X] with [volume], write about..." |
| "This will rank well" | "Based on [difficulty data], this [may/should] compete" |
| "Your competitors write about X" | "Without competitor analysis, I'm inferring based on keyword patterns" |
| "Aim for 2,000 words" | "For [content type] targeting [difficulty], aim for [range] words" |

---

## Verification Before Completion

BEFORE presenting content plan:

1. ✅ Did I verify keyword data exists?
2. ✅ Did I check brand context is loaded?
3. ✅ Are all headings specific (no placeholders)?
4. ✅ Did I explain word count reasoning?
5. ✅ Did I state data sources used?

If NO to any: Fix before presenting.

---

## Natural Language Triggers

- "plan content for [topic]"
- "create content calendar"
- "content brief for [keyword]"
- "what should I write about"
- "content ideas"
`;

// ============================================
// CONTENT TYPES
// ============================================

export type ContentType =
  | 'blog_post'
  | 'landing_page'
  | 'pillar_page'
  | 'comparison'
  | 'how_to'
  | 'listicle'
  | 'case_study'
  | 'product_page';

export interface ContentIdea {
  title: string;
  type: ContentType;
  targetKeyword: string;
  supportingKeywords: string[];
  intent: 'informational' | 'navigational' | 'commercial' | 'transactional';
  priority: 'high' | 'medium' | 'low';
  wordCountEstimate: number;
  reasoning: string;
}

export interface ContentBrief {
  title: string;
  targetKeyword: string;
  supportingKeywords: string[];
  searchIntent: string;
  audienceSegment: string;
  outline: ContentOutlineSection[];
  keyPointsToCover: string[];
  competitorExamples: string[];
  wordCountRange: { min: number; max: number };
  internalLinkTargets: string[];
  callToAction: string;
}

export interface ContentOutlineSection {
  heading: string;
  level: 'h2' | 'h3';
  points?: string[];
}

export interface ContentCalendar {
  month: string;
  theme?: string;
  items: ContentCalendarItem[];
}

export interface ContentCalendarItem {
  week: number;
  title: string;
  type: ContentType;
  keyword: string;
  status: 'planned' | 'writing' | 'review' | 'published';
  priority: 'high' | 'medium' | 'low';
}

// ============================================
// CONTENT TYPE DETECTION
// ============================================

/**
 * Determine best content type for a keyword
 */
export function suggestContentType(
  keyword: string,
  intent: string
): ContentType {
  const lower = keyword.toLowerCase();

  // Commercial comparisons
  if (/\b(vs|versus|comparison|compare|alternative)\b/.test(lower)) {
    return 'comparison';
  }

  // How-to / tutorials
  if (/\b(how to|guide|tutorial|step|steps)\b/.test(lower)) {
    return 'how_to';
  }

  // Listicles
  if (/\b(best|top \d+|\d+ best|tips|ideas|examples|tools)\b/.test(lower)) {
    return 'listicle';
  }

  // Product-focused
  if (/\b(software|tool|app|platform|solution|service)\b/.test(lower)) {
    if (intent === 'transactional') {
      return 'product_page';
    }
    return 'landing_page';
  }

  // Broad topics = pillar
  const wordCount = keyword.split(/\s+/).length;
  if (wordCount <= 2) {
    return 'pillar_page';
  }

  // Default to blog post
  return 'blog_post';
}

/**
 * Estimate word count based on content type and competition
 */
export function estimateWordCount(
  type: ContentType,
  difficulty?: string
): { min: number; max: number } {
  const baseRanges: Record<ContentType, { min: number; max: number }> = {
    blog_post: { min: 1200, max: 2000 },
    landing_page: { min: 800, max: 1500 },
    pillar_page: { min: 3000, max: 5000 },
    comparison: { min: 2000, max: 3500 },
    how_to: { min: 1500, max: 2500 },
    listicle: { min: 1500, max: 3000 },
    case_study: { min: 1000, max: 2000 },
    product_page: { min: 500, max: 1000 },
  };

  const range = baseRanges[type];

  // Increase for competitive keywords
  if (difficulty === 'hard') {
    return {
      min: Math.round(range.min * 1.5),
      max: Math.round(range.max * 1.5),
    };
  }

  return range;
}

// ============================================
// CONTENT GENERATION
// ============================================

/**
 * Generate content ideas from keywords
 */
export function generateContentIdeas(
  keywords: KeywordAnalysis[]
): ContentIdea[] {
  const ideas: ContentIdea[] = [];

  for (const kw of keywords) {
    if (kw.priority === 'avoid') continue;

    const type = suggestContentType(kw.keyword, kw.intent);
    const wordCount = estimateWordCount(type, kw.difficulty);

    ideas.push({
      title: generateTitleIdea(kw.keyword, type),
      type,
      targetKeyword: kw.keyword,
      supportingKeywords: [],
      intent: kw.intent,
      priority: kw.priority === 'quick-win' ? 'high' : kw.priority === 'strategic' ? 'high' : 'medium',
      wordCountEstimate: Math.round((wordCount.min + wordCount.max) / 2),
      reasoning: kw.reasoning,
    });
  }

  // Sort by priority
  return ideas.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });
}

/**
 * Generate a title idea based on keyword and content type
 */
function generateTitleIdea(keyword: string, type: ContentType): string {
  const titleCase = keyword
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  switch (type) {
    case 'how_to':
      return keyword.toLowerCase().startsWith('how to')
        ? titleCase
        : `How to ${titleCase}: A Complete Guide`;

    case 'listicle':
      if (/^\d+/.test(keyword)) return titleCase;
      if (/best|top/i.test(keyword)) return `The ${titleCase} in 2024`;
      return `10 ${titleCase} You Should Know`;

    case 'comparison':
      return titleCase;

    case 'pillar_page':
      return `The Complete Guide to ${titleCase}`;

    case 'landing_page':
    case 'product_page':
      return titleCase;

    case 'case_study':
      return `How [Company] Achieved [Result] with ${titleCase}`;

    default:
      return titleCase;
  }
}

/**
 * Generate a content brief
 */
export function generateContentBrief(
  keyword: KeywordAnalysis,
  brandId?: string
): ContentBrief {
  const brand = getActiveBrand();
  const instructions = brandId ? loadBrandInstructions(brandId) : null;

  const type = suggestContentType(keyword.keyword, keyword.intent);
  const wordCount = estimateWordCount(type, keyword.difficulty);

  return {
    title: generateTitleIdea(keyword.keyword, type),
    targetKeyword: keyword.keyword,
    supportingKeywords: [],
    searchIntent: describeIntent(keyword.intent),
    audienceSegment: instructions?.audience.primary || 'General audience',
    outline: generateOutline(keyword.keyword, type),
    keyPointsToCover: generateKeyPoints(keyword.keyword, type),
    competitorExamples: [],
    wordCountRange: wordCount,
    internalLinkTargets: [],
    callToAction: suggestCTA(keyword.intent, brand?.business.model),
  };
}

/**
 * Describe search intent
 */
function describeIntent(intent: string): string {
  switch (intent) {
    case 'informational':
      return 'Searcher wants to learn or understand something';
    case 'commercial':
      return 'Searcher is researching options before buying';
    case 'transactional':
      return 'Searcher is ready to take action (buy, sign up, etc.)';
    case 'navigational':
      return 'Searcher looking for a specific website/page';
    default:
      return intent;
  }
}

/**
 * Generate a basic outline
 */
function generateOutline(
  keyword: string,
  type: ContentType
): ContentOutlineSection[] {
  const outline: ContentOutlineSection[] = [];

  switch (type) {
    case 'how_to':
      outline.push(
        { heading: 'What is [Topic]?', level: 'h2' },
        { heading: 'Why [Topic] Matters', level: 'h2' },
        { heading: 'Step-by-Step Guide', level: 'h2' },
        { heading: 'Step 1: [First Step]', level: 'h3' },
        { heading: 'Step 2: [Second Step]', level: 'h3' },
        { heading: 'Step 3: [Third Step]', level: 'h3' },
        { heading: 'Common Mistakes to Avoid', level: 'h2' },
        { heading: 'Tips for Success', level: 'h2' },
        { heading: 'FAQ', level: 'h2' }
      );
      break;

    case 'listicle':
      outline.push(
        { heading: 'Introduction', level: 'h2' },
        { heading: '1. [First Item]', level: 'h2' },
        { heading: '2. [Second Item]', level: 'h2' },
        { heading: '3. [Third Item]', level: 'h2' },
        { heading: 'How to Choose the Right [Item]', level: 'h2' },
        { heading: 'Conclusion', level: 'h2' }
      );
      break;

    case 'comparison':
      outline.push(
        { heading: 'Quick Comparison Table', level: 'h2' },
        { heading: '[Option A] Overview', level: 'h2' },
        { heading: '[Option B] Overview', level: 'h2' },
        { heading: 'Feature Comparison', level: 'h2' },
        { heading: 'Pricing Comparison', level: 'h2' },
        { heading: 'Which Should You Choose?', level: 'h2' },
        { heading: 'Final Verdict', level: 'h2' }
      );
      break;

    case 'pillar_page':
      outline.push(
        { heading: 'What is [Topic]?', level: 'h2' },
        { heading: 'Why [Topic] is Important', level: 'h2' },
        { heading: 'Types of [Topic]', level: 'h2' },
        { heading: 'How to Get Started with [Topic]', level: 'h2' },
        { heading: 'Best Practices', level: 'h2' },
        { heading: 'Common Challenges', level: 'h2' },
        { heading: 'Tools and Resources', level: 'h2' },
        { heading: 'FAQ', level: 'h2' }
      );
      break;

    default:
      outline.push(
        { heading: 'Introduction', level: 'h2' },
        { heading: 'Main Point 1', level: 'h2' },
        { heading: 'Main Point 2', level: 'h2' },
        { heading: 'Main Point 3', level: 'h2' },
        { heading: 'Conclusion', level: 'h2' }
      );
  }

  return outline;
}

/**
 * Generate key points to cover
 */
function generateKeyPoints(keyword: string, type: ContentType): string[] {
  const points = [
    'Address the primary search intent',
    'Include relevant statistics/data where possible',
    'Add internal links to related content',
    'Include a clear call-to-action',
  ];

  if (type === 'how_to') {
    points.push('Include step-by-step instructions with screenshots/visuals');
    points.push('Address common mistakes and how to avoid them');
  }

  if (type === 'comparison') {
    points.push('Create a comparison table near the top');
    points.push('Be objective - acknowledge strengths and weaknesses');
    points.push('Include pricing information');
  }

  if (type === 'listicle') {
    points.push('Make each item actionable');
    points.push('Include examples for each item');
  }

  return points;
}

/**
 * Suggest a call-to-action based on intent
 */
function suggestCTA(intent: string, businessModel?: string): string {
  if (intent === 'transactional') {
    if (businessModel === 'self-serve') {
      return 'Start free trial / Sign up free';
    }
    return 'Request a demo / Contact sales';
  }

  if (intent === 'commercial') {
    return 'Learn more about [product] / See pricing';
  }

  // Informational
  return 'Subscribe for more tips / Download our free guide';
}

/**
 * Format content brief for display
 */
export function formatContentBrief(brief: ContentBrief): string {
  let output = `📝 CONTENT BRIEF\n\n`;
  output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  output += `📌 Title: ${brief.title}\n`;
  output += `🎯 Target Keyword: ${brief.targetKeyword}\n`;
  output += `📊 Word Count: ${brief.wordCountRange.min}-${brief.wordCountRange.max}\n`;
  output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  output += `🔍 SEARCH INTENT\n`;
  output += `${brief.searchIntent}\n\n`;

  output += `👥 TARGET AUDIENCE\n`;
  output += `${brief.audienceSegment}\n\n`;

  output += `📋 OUTLINE\n`;
  for (const section of brief.outline) {
    const indent = section.level === 'h3' ? '  ' : '';
    output += `${indent}• ${section.heading}\n`;
  }
  output += `\n`;

  output += `✅ KEY POINTS TO COVER\n`;
  for (const point of brief.keyPointsToCover) {
    output += `• ${point}\n`;
  }
  output += `\n`;

  output += `🎬 CALL TO ACTION\n`;
  output += `${brief.callToAction}\n`;

  return output;
}
