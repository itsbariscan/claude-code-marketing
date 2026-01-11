/**
 * Archival Memory - Layer 3 State Management
 * Stores learnings that persist across all sessions
 *
 * Types of learnings:
 * - what_worked: Successful strategies/tactics
 * - outcome: Results from past activities
 * - user_preference: How the user likes things done
 * - rejected: Ideas the user didn't like
 * - pattern: Recurring patterns observed
 * - mistake: Errors to avoid
 */

import {
  readYaml,
  writeYaml,
  getLearningsPath,
  getTimestamp,
  getDateString,
  generateUniqueId,
} from '../storage';
import { Learning, LearningType } from '../../types';

// ============================================
// LEARNING STORAGE
// ============================================

interface LearningsFile {
  learnings: Learning[];
}

/**
 * Load all learnings from disk
 */
function loadLearnings(): Learning[] {
  const file = readYaml<LearningsFile>(getLearningsPath());
  return file?.learnings || [];
}

/**
 * Save learnings to disk
 */
function saveLearnings(learnings: Learning[]): boolean {
  return writeYaml(getLearningsPath(), { learnings });
}

// ============================================
// LEARNING CREATION
// ============================================

/**
 * Store a new learning
 */
export function storeLearning(
  brand: string,
  type: LearningType,
  category: string,
  content: string,
  options?: {
    context?: string;
    confidence?: 'high' | 'medium' | 'low';
    metrics?: Record<string, string>;
  }
): Learning {
  const learning: Learning = {
    id: generateUniqueId('learn'),
    brand,
    date: getDateString(),
    type,
    category,
    content,
    context: options?.context,
    confidence: options?.confidence || 'medium',
    metrics: options?.metrics,
  };

  const learnings = loadLearnings();
  learnings.push(learning);
  saveLearnings(learnings);

  return learning;
}

/**
 * Store a "what worked" learning
 */
export function storeWhatWorked(
  brand: string,
  category: string,
  content: string,
  context?: string
): Learning {
  return storeLearning(brand, 'what_worked', category, content, { context });
}

/**
 * Store an outcome learning
 */
export function storeOutcome(
  brand: string,
  category: string,
  content: string,
  metrics?: Record<string, string>
): Learning {
  return storeLearning(brand, 'outcome', category, content, { metrics });
}

/**
 * Store a user preference
 */
export function storeUserPreference(
  brand: string,
  category: string,
  content: string
): Learning {
  return storeLearning(brand, 'user_preference', category, content, {
    confidence: 'high',
  });
}

/**
 * Store a rejected idea
 */
export function storeRejected(
  brand: string,
  category: string,
  content: string,
  reason?: string
): Learning {
  return storeLearning(brand, 'rejected', category, content, {
    context: reason,
  });
}

/**
 * Store a pattern observation
 */
export function storePattern(
  brand: string,
  category: string,
  content: string
): Learning {
  return storeLearning(brand, 'pattern', category, content);
}

/**
 * Store a mistake to avoid
 */
export function storeMistake(
  brand: string,
  category: string,
  content: string,
  context?: string
): Learning {
  return storeLearning(brand, 'mistake', category, content, { context });
}

// ============================================
// LEARNING RETRIEVAL
// ============================================

/**
 * Get all learnings
 */
export function getAllLearnings(): Learning[] {
  return loadLearnings();
}

/**
 * Get learnings for a specific brand
 */
export function getBrandLearnings(brandId: string): Learning[] {
  const learnings = loadLearnings();
  return learnings.filter(
    (l) => l.brand === brandId || l.brand === 'global'
  );
}

/**
 * Get global learnings (apply to all brands)
 */
export function getGlobalLearnings(): Learning[] {
  const learnings = loadLearnings();
  return learnings.filter((l) => l.brand === 'global');
}

/**
 * Get learnings by type
 */
export function getLearningsByType(type: LearningType): Learning[] {
  const learnings = loadLearnings();
  return learnings.filter((l) => l.type === type);
}

/**
 * Get learnings by category
 */
export function getLearningsByCategory(category: string): Learning[] {
  const learnings = loadLearnings();
  const lower = category.toLowerCase();
  return learnings.filter((l) => l.category.toLowerCase().includes(lower));
}

/**
 * Search learnings
 */
export function searchLearnings(query: string): Learning[] {
  const learnings = loadLearnings();
  const lower = query.toLowerCase();

  return learnings.filter(
    (l) =>
      l.content.toLowerCase().includes(lower) ||
      l.category.toLowerCase().includes(lower) ||
      l.context?.toLowerCase().includes(lower)
  );
}

/**
 * Get recent learnings
 */
export function getRecentLearnings(limit: number = 10): Learning[] {
  const learnings = loadLearnings();
  return learnings
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

// ============================================
// LEARNING APPLICATION
// ============================================

/**
 * Get relevant learnings for a context
 * This is the main entry point for applying learnings
 */
export function getRelevantLearnings(
  brandId: string,
  context: {
    activity?: string;
    category?: string;
    keywords?: string[];
  }
): Learning[] {
  const brandLearnings = getBrandLearnings(brandId);

  if (!context.activity && !context.category && !context.keywords?.length) {
    // Return recent learnings if no context
    return brandLearnings.slice(-5);
  }

  const relevant: Learning[] = [];
  const seen = new Set<string>();

  // Match by category
  if (context.category) {
    const categoryMatches = brandLearnings.filter((l) =>
      l.category.toLowerCase().includes(context.category!.toLowerCase())
    );
    for (const l of categoryMatches) {
      if (!seen.has(l.id)) {
        relevant.push(l);
        seen.add(l.id);
      }
    }
  }

  // Match by keywords
  if (context.keywords?.length) {
    for (const keyword of context.keywords) {
      const lower = keyword.toLowerCase();
      const keywordMatches = brandLearnings.filter(
        (l) =>
          !seen.has(l.id) &&
          (l.content.toLowerCase().includes(lower) ||
            l.category.toLowerCase().includes(lower))
      );
      for (const l of keywordMatches) {
        if (!seen.has(l.id)) {
          relevant.push(l);
          seen.add(l.id);
        }
      }
    }
  }

  // Match by activity type
  if (context.activity) {
    const activityMap: Record<string, string[]> = {
      keyword_research: ['keywords', 'seo', 'search'],
      content_planning: ['content', 'topics', 'calendar'],
      competitor_analysis: ['competitor', 'analysis', 'comparison'],
      strategy_creation: ['strategy', 'positioning', 'channels'],
    };

    const activityKeywords = activityMap[context.activity] || [];
    for (const keyword of activityKeywords) {
      const matches = brandLearnings.filter(
        (l) =>
          !seen.has(l.id) &&
          (l.content.toLowerCase().includes(keyword) ||
            l.category.toLowerCase().includes(keyword))
      );
      for (const l of matches) {
        if (!seen.has(l.id)) {
          relevant.push(l);
          seen.add(l.id);
        }
      }
    }
  }

  // Sort by confidence and recency
  return relevant.sort((a, b) => {
    // High confidence first
    const confOrder = { high: 0, medium: 1, low: 2 };
    const confDiff = confOrder[a.confidence] - confOrder[b.confidence];
    if (confDiff !== 0) return confDiff;

    // Then by date
    return b.date.localeCompare(a.date);
  });
}

/**
 * Format learnings for display
 */
export function formatLearnings(learnings: Learning[]): string {
  if (learnings.length === 0) {
    return 'No relevant learnings found.';
  }

  const typeEmoji: Record<LearningType, string> = {
    what_worked: '✅',
    outcome: '📊',
    user_preference: '👤',
    rejected: '❌',
    pattern: '🔄',
    mistake: '⚠️',
  };

  let output = '📚 RELEVANT LEARNINGS\n\n';

  for (const learning of learnings) {
    const emoji = typeEmoji[learning.type];
    output += `${emoji} [${learning.category}] ${learning.content}`;
    if (learning.context) {
      output += `\n   └─ ${learning.context}`;
    }
    if (learning.metrics) {
      const metricsStr = Object.entries(learning.metrics)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      output += `\n   📈 ${metricsStr}`;
    }
    output += `\n   (${learning.date}, ${learning.confidence} confidence)\n\n`;
  }

  return output;
}

// ============================================
// LEARNING MANAGEMENT
// ============================================

/**
 * Delete a learning
 */
export function deleteLearning(learningId: string): boolean {
  const learnings = loadLearnings();
  const index = learnings.findIndex((l) => l.id === learningId);

  if (index === -1) {
    return false;
  }

  learnings.splice(index, 1);
  return saveLearnings(learnings);
}

/**
 * Update learning confidence
 */
export function updateLearningConfidence(
  learningId: string,
  confidence: 'high' | 'medium' | 'low'
): Learning | null {
  const learnings = loadLearnings();
  const learning = learnings.find((l) => l.id === learningId);

  if (!learning) {
    return null;
  }

  learning.confidence = confidence;
  saveLearnings(learnings);
  return learning;
}

/**
 * Promote a brand-specific learning to global
 */
export function promoteToGlobal(learningId: string): Learning | null {
  const learnings = loadLearnings();
  const learning = learnings.find((l) => l.id === learningId);

  if (!learning) {
    return null;
  }

  learning.brand = 'global';
  saveLearnings(learnings);
  return learning;
}

/**
 * Get learning statistics
 */
export function getLearningStats(): {
  total: number;
  byType: Record<LearningType, number>;
  byBrand: Record<string, number>;
  byConfidence: Record<string, number>;
} {
  const learnings = loadLearnings();

  const byType: Record<LearningType, number> = {
    what_worked: 0,
    outcome: 0,
    user_preference: 0,
    rejected: 0,
    pattern: 0,
    mistake: 0,
  };

  const byBrand: Record<string, number> = {};
  const byConfidence: Record<string, number> = {
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const learning of learnings) {
    byType[learning.type]++;
    byBrand[learning.brand] = (byBrand[learning.brand] || 0) + 1;
    byConfidence[learning.confidence]++;
  }

  return {
    total: learnings.length,
    byType,
    byBrand,
    byConfidence,
  };
}
