/**
 * SEO Plugin
 * Comprehensive SEO tools for Claude Code Marketing
 */

// Import prompts for use in combined prompt
import { KEYWORD_RESEARCH_PROMPT } from './keyword-research';
import { CONTENT_PLANNING_PROMPT } from './content-planning';
import { COMPETITOR_ANALYSIS_PROMPT } from './competitor-analysis';

// Keyword Research
export {
  KEYWORD_RESEARCH_PROMPT,
  parseKeywordData,
  classifyIntent,
  estimateDifficulty,
  determineKeywordPriority,
  analyzeKeywords,
  suggestKeywords,
  type KeywordAnalysis,
  type KeywordResearchResult,
} from './keyword-research';

// Content Planning
export {
  CONTENT_PLANNING_PROMPT,
  suggestContentType,
  estimateWordCount,
  generateContentIdeas,
  generateContentBrief,
  formatContentBrief,
  type ContentType,
  type ContentIdea,
  type ContentBrief,
  type ContentOutlineSection,
  type ContentCalendar,
  type ContentCalendarItem,
} from './content-planning';

// Competitor Analysis
export {
  COMPETITOR_ANALYSIS_PROMPT,
  getBrandCompetitors,
  parseCompetitorKeywords,
  identifyContentGaps,
  generateDifferentiationAngles,
  formatCompetitorAnalysis,
  type CompetitorProfile,
  type CompetitorKeywordGap,
  type CompetitorContentGap,
  type CompetitorAnalysisResult,
} from './competitor-analysis';

// ============================================
// SEO PLUGIN METADATA
// ============================================

export const SEO_PLUGIN = {
  name: 'SEO',
  version: '0.1.0',
  description: 'Keyword research, content planning, and competitor analysis',
  skills: ['keyword-research', 'content-planning', 'competitor-analysis'],
  triggers: [
    // Keyword research
    'keyword', 'keywords', 'find keywords', 'keyword research',
    'what should I rank for', 'target keywords',

    // Content planning
    'content', 'content plan', 'content calendar', 'content brief',
    'what should I write', 'blog topics',

    // Competitor analysis
    'competitor', 'competitors', 'analyze competitor',
    'competitor keywords', 'what is [x] doing',
  ],
};

// ============================================
// SEO SKILL PROMPTS (combined)
// ============================================

export const SEO_SYSTEM_PROMPT = `
# SEO Plugin

You have access to SEO capabilities for marketing.

## Available Features

### 1. Keyword Research
${KEYWORD_RESEARCH_PROMPT}

### 2. Content Planning
${CONTENT_PLANNING_PROMPT}

### 3. Competitor Analysis
${COMPETITOR_ANALYSIS_PROMPT}

## Data Input Support

All features support multiple input methods:
- **Reasoning**: Use Claude's knowledge with brand context
- **Paste**: Parse data from SEO tools (Ahrefs, SEMrush, GSC)
- **Screenshot**: Analyze images of tool interfaces
- **API**: Direct integration (when configured)

## Always Consider

1. Brand context (industry, audience, competitors)
2. Search intent behind keywords
3. Current investments (don't add new channels unnecessarily)
4. Actionable output with clear next steps
`;
