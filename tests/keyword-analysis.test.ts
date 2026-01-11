/**
 * Keyword Analysis Tests
 */

import {
  classifyIntent,
  estimateDifficulty,
  determineKeywordPriority,
  analyzeKeywords,
} from '../src/plugins/seo/keyword-research';
import { KeywordData } from '../src/types';

describe('Intent Classification', () => {
  test('classifies transactional intent', () => {
    expect(classifyIntent('buy project management software')).toBe('transactional');
    expect(classifyIntent('pricing for asana')).toBe('transactional');
    expect(classifyIntent('free trial project manager')).toBe('transactional');
  });

  test('classifies commercial intent', () => {
    expect(classifyIntent('best project management tools')).toBe('commercial');
    expect(classifyIntent('asana vs monday')).toBe('commercial');
    expect(classifyIntent('top 10 seo tools')).toBe('commercial');
  });

  test('classifies navigational intent', () => {
    expect(classifyIntent('asana login')).toBe('navigational');
    expect(classifyIntent('trello.com')).toBe('navigational');
    expect(classifyIntent('monday app support')).toBe('navigational');
  });

  test('defaults to informational intent', () => {
    expect(classifyIntent('what is project management')).toBe('informational');
    expect(classifyIntent('how to manage tasks')).toBe('informational');
    expect(classifyIntent('project planning guide')).toBe('informational');
  });
});

describe('Difficulty Estimation', () => {
  test('uses provided difficulty score', () => {
    expect(estimateDifficulty('test', { difficulty: 20 })).toBe('easy');
    expect(estimateDifficulty('test', { difficulty: 45 })).toBe('medium');
    expect(estimateDifficulty('test', { difficulty: 75 })).toBe('hard');
  });

  test('infers from CPC when no difficulty', () => {
    expect(estimateDifficulty('test', { cpc: 2 })).toBe('easy');
    expect(estimateDifficulty('test', { cpc: 5 })).toBe('medium');
    expect(estimateDifficulty('test', { cpc: 15 })).toBe('hard');
  });

  test('infers from keyword length', () => {
    expect(estimateDifficulty('seo')).toBe('hard'); // Single word
    expect(estimateDifficulty('seo tools')).toBe('medium'); // Two words
    expect(estimateDifficulty('best seo tools for small business')).toBe('easy'); // Long tail
  });
});

describe('Priority Determination', () => {
  test('identifies quick wins', () => {
    const result = determineKeywordPriority('test keyword', {
      relevance: 'high',
      difficulty: 'easy',
      intent: 'informational',
    });
    expect(result).toBe('quick-win');
  });

  test('identifies strategic targets', () => {
    const result = determineKeywordPriority('test keyword', {
      relevance: 'high',
      difficulty: 'medium',
      intent: 'commercial',
    });
    expect(result).toBe('strategic');
  });

  test('identifies long-term targets', () => {
    const result = determineKeywordPriority('test keyword', {
      relevance: 'medium',
      difficulty: 'hard',
      intent: 'informational',
    });
    expect(result).toBe('long-term');
  });

  test('identifies keywords to avoid', () => {
    const result = determineKeywordPriority('test keyword', {
      relevance: 'low',
      difficulty: 'medium',
      intent: 'informational',
    });
    expect(result).toBe('avoid');
  });

  test('prioritizes ranking keywords with easy difficulty', () => {
    const result = determineKeywordPriority('test keyword', {
      relevance: 'medium',
      difficulty: 'easy',
      intent: 'informational',
      currentPosition: 15,
    });
    expect(result).toBe('quick-win');
  });
});

describe('Full Keyword Analysis', () => {
  test('analyzes array of keywords', () => {
    const keywords: KeywordData[] = [
      { keyword: 'best project management', volume: 5000, difficulty: 45 },
      { keyword: 'asana login', volume: 10000, difficulty: 10 },
      { keyword: 'what is agile methodology', volume: 3000, difficulty: 30 },
    ];

    const results = analyzeKeywords(keywords);

    expect(results).toHaveLength(3);
    expect(results[0].keyword).toBe('best project management');
    expect(results[0].intent).toBe('commercial');
    expect(results[1].intent).toBe('navigational');
    expect(results[2].intent).toBe('informational');
  });

  test('includes brand context in relevance', () => {
    const keywords: KeywordData[] = [
      { keyword: 'project management software', volume: 5000 },
    ];

    const results = analyzeKeywords(keywords, {
      product: 'project management',
      industry: 'software',
    });

    expect(results[0].relevance).toBe('high');
  });
});
