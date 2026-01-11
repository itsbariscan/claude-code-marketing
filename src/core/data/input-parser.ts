/**
 * Data Input Parser
 * Handles various input formats: CSV, TSV, pasted tables, screenshot descriptions
 */

import { ParsedData, KeywordData } from '../../types';

// ============================================
// INPUT DETECTION
// ============================================

export type InputFormat = 'csv' | 'tsv' | 'table' | 'json' | 'text' | 'unknown';

/**
 * Detect the format of input data
 */
export function detectInputFormat(text: string): InputFormat {
  const trimmed = text.trim();

  // Check for JSON
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Not valid JSON
    }
  }

  // Check for TSV (tab-separated)
  const lines = trimmed.split('\n');
  const firstLine = lines[0];

  if (firstLine.includes('\t')) {
    return 'tsv';
  }

  // Check for CSV (comma-separated with consistent columns)
  const commaCount = (firstLine.match(/,/g) || []).length;
  if (commaCount > 0 && lines.length > 1) {
    const secondLineCommas = (lines[1].match(/,/g) || []).length;
    if (commaCount === secondLineCommas) {
      return 'csv';
    }
  }

  // Check for markdown/text table
  if (firstLine.includes('|') || trimmed.includes('---')) {
    return 'table';
  }

  // Default to text
  return 'text';
}

/**
 * Detect the data source from content patterns
 */
export function detectDataSource(
  text: string
): 'gsc' | 'ahrefs' | 'semrush' | 'ga4' | 'unknown' {
  const lower = text.toLowerCase();

  // Google Search Console patterns
  if (
    lower.includes('impressions') &&
    lower.includes('clicks') &&
    lower.includes('ctr')
  ) {
    return 'gsc';
  }

  // Ahrefs patterns
  if (
    lower.includes('keyword difficulty') ||
    lower.includes('kd') ||
    lower.includes('referring domains')
  ) {
    return 'ahrefs';
  }

  // SEMrush patterns
  if (
    lower.includes('keyword difficulty') ||
    (lower.includes('volume') && lower.includes('trend'))
  ) {
    return 'semrush';
  }

  // GA4 patterns
  if (
    lower.includes('sessions') ||
    lower.includes('users') ||
    lower.includes('engagement')
  ) {
    return 'ga4';
  }

  return 'unknown';
}

// ============================================
// CSV/TSV PARSING
// ============================================

export interface ParsedTable {
  headers: string[];
  rows: string[][];
  format: InputFormat;
}

/**
 * Parse CSV or TSV data
 */
export function parseDelimitedData(text: string): ParsedTable {
  const format = detectInputFormat(text);
  const delimiter = format === 'tsv' ? '\t' : ',';
  const lines = text.trim().split('\n');

  const headers = parseCSVLine(lines[0], delimiter);
  const rows: string[][] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      rows.push(parseCSVLine(line, delimiter));
    }
  }

  return { headers, rows, format };
}

/**
 * Parse a single CSV/TSV line, handling quoted values
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Parse markdown table
 */
export function parseMarkdownTable(text: string): ParsedTable {
  const lines = text
    .trim()
    .split('\n')
    .filter((l) => l.trim() && !l.trim().match(/^[-|]+$/));

  if (lines.length === 0) {
    return { headers: [], rows: [], format: 'table' };
  }

  const parseRow = (line: string): string[] =>
    line
      .split('|')
      .map((cell) => cell.trim())
      .filter((cell) => cell);

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map(parseRow);

  return { headers, rows, format: 'table' };
}

// ============================================
// KEYWORD DATA PARSING
// ============================================

/**
 * Parse keyword data from any format
 */
export function parseKeywordInput(text: string): ParsedData {
  const format = detectInputFormat(text);
  const source = detectDataSource(text);

  let table: ParsedTable;

  if (format === 'csv' || format === 'tsv') {
    table = parseDelimitedData(text);
  } else if (format === 'table') {
    table = parseMarkdownTable(text);
  } else {
    // Try to parse as space-separated or extract keywords
    return {
      source: 'paste',
      confidence: 'low',
      data: { rawText: text },
      limitations: ['Could not detect structured format'],
    };
  }

  // Map headers to standard fields
  const columnMapping = mapKeywordColumns(table.headers);

  const keywordCol = columnMapping.keyword ?? 0;

  const keywords: KeywordData[] = table.rows.map((row) => {
    const kw: KeywordData = {
      keyword: row[keywordCol] || '',
    };

    if (columnMapping.volume !== undefined) {
      kw.volume = parseNumericValue(row[columnMapping.volume]);
    }
    if (columnMapping.difficulty !== undefined) {
      kw.difficulty = parseNumericValue(row[columnMapping.difficulty]);
    }
    if (columnMapping.cpc !== undefined) {
      kw.cpc = parseNumericValue(row[columnMapping.cpc]);
    }
    if (columnMapping.position !== undefined) {
      kw.position = parseNumericValue(row[columnMapping.position]);
    }
    if (columnMapping.impressions !== undefined) {
      kw.impressions = parseNumericValue(row[columnMapping.impressions]);
    }
    if (columnMapping.clicks !== undefined) {
      kw.clicks = parseNumericValue(row[columnMapping.clicks]);
    }
    if (columnMapping.ctr !== undefined) {
      kw.ctr = parseNumericValue(row[columnMapping.ctr]);
    }

    return kw;
  }).filter(kw => kw.keyword);

  const limitations: string[] = [];
  if (source === 'unknown') {
    limitations.push('Could not identify data source');
  }

  return {
    source: 'paste',
    tool: source !== 'unknown' ? source : undefined,
    confidence: source !== 'unknown' ? 'high' : 'medium',
    data: { keywords },
    limitations,
  };
}

/**
 * Map column headers to standard keyword fields
 */
function mapKeywordColumns(
  headers: string[]
): Record<string, number | undefined> {
  const mapping: Record<string, number | undefined> = {};

  headers.forEach((header, index) => {
    const h = header.toLowerCase().trim();

    if (h.includes('keyword') || h.includes('query') || h.includes('term') || h === 'top queries') {
      mapping.keyword = index;
    }
    if (h.includes('volume') || h.includes('searches') || h === 'vol') {
      mapping.volume = index;
    }
    if (h.includes('difficult') || h === 'kd' || h === 'kw difficulty') {
      mapping.difficulty = index;
    }
    if (h.includes('cpc') || h.includes('cost')) {
      mapping.cpc = index;
    }
    if (h.includes('position') || h.includes('rank') || h === 'pos') {
      mapping.position = index;
    }
    if (h.includes('impression')) {
      mapping.impressions = index;
    }
    if (h.includes('click') && !h.includes('ctr')) {
      mapping.clicks = index;
    }
    if (h.includes('ctr')) {
      mapping.ctr = index;
    }
  });

  // Default first column to keyword if not found
  if (mapping.keyword === undefined) {
    mapping.keyword = 0;
  }

  return mapping;
}

/**
 * Parse numeric value from string
 */
function parseNumericValue(value: string | undefined): number | undefined {
  if (!value) return undefined;

  // Remove common formatting
  const cleaned = value
    .replace(/[,$%]/g, '')
    .replace(/k$/i, '000')
    .replace(/m$/i, '000000')
    .replace(/[<>~]/g, '')
    .trim();

  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

// ============================================
// SCREENSHOT DESCRIPTION PARSING
// ============================================

/**
 * Parse data from a screenshot description
 * Used when Claude describes what it sees in an image
 */
export function parseScreenshotDescription(
  description: string
): ParsedData {
  // This function helps structure data extracted from screenshots
  // The actual image analysis is done by Claude's vision capabilities

  const source = detectDataSource(description);
  const lines = description.split('\n').filter((l) => l.trim());

  // Try to extract tabular data if present
  const tableLines = lines.filter(
    (l) => l.includes(':') || l.includes('\t') || /\d/.test(l)
  );

  if (tableLines.length > 2) {
    // Attempt to parse as data
    const keywords: Partial<KeywordData>[] = [];

    for (const line of tableLines) {
      // Try various patterns
      const colonPattern = line.match(/^(.+?):\s*(.+)$/);
      if (colonPattern) {
        keywords.push({
          keyword: colonPattern[1].trim(),
        });
      }
    }

    if (keywords.length > 0) {
      return {
        source: 'screenshot',
        tool: source !== 'unknown' ? source : undefined,
        confidence: 'medium',
        data: { keywords, rawDescription: description },
        limitations: [
          'Data extracted from screenshot - verify accuracy',
          'Some metrics may not be visible',
        ],
      };
    }
  }

  // Return raw description if no structure found
  return {
    source: 'screenshot',
    tool: source !== 'unknown' ? source : undefined,
    confidence: 'low',
    data: { rawDescription: description },
    limitations: [
      'Could not extract structured data from screenshot',
      'Manual interpretation required',
    ],
  };
}

// ============================================
// CONFIDENCE ASSESSMENT
// ============================================

/**
 * Assess confidence level of parsed data
 */
export function assessDataConfidence(parsed: ParsedData): {
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
} {
  const reasons: string[] = [];
  let score = 0;

  // Source reliability
  if (parsed.source === 'api') {
    score += 3;
    reasons.push('Direct API data');
  } else if (parsed.source === 'paste') {
    score += 2;
    reasons.push('Pasted from tool');
  } else if (parsed.source === 'screenshot') {
    score += 1;
    reasons.push('Extracted from screenshot');
  }

  // Tool identification
  if (parsed.tool) {
    score += 1;
    reasons.push(`Identified as ${parsed.tool} data`);
  }

  // Data completeness
  if (parsed.data.keywords && Array.isArray(parsed.data.keywords)) {
    const keywords = parsed.data.keywords as KeywordData[];
    const hasVolume = keywords.some((k) => k.volume !== undefined);
    const hasDifficulty = keywords.some((k) => k.difficulty !== undefined);

    if (hasVolume) {
      score += 1;
      reasons.push('Has volume data');
    }
    if (hasDifficulty) {
      score += 1;
      reasons.push('Has difficulty data');
    }
  }

  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low';
  if (score >= 5) {
    confidence = 'high';
  } else if (score >= 3) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return { confidence, reasons };
}
