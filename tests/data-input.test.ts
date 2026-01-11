/**
 * Data Input Parser Tests
 */

import {
  detectInputFormat,
  detectDataSource,
  parseDelimitedData,
  parseKeywordInput,
} from '../src/core/data/input-parser';

describe('Input Format Detection', () => {
  test('detects CSV format', () => {
    const csv = 'keyword,volume,difficulty\ntest keyword,1000,45';
    expect(detectInputFormat(csv)).toBe('csv');
  });

  test('detects TSV format', () => {
    const tsv = 'keyword\tvolume\tdifficulty\ntest keyword\t1000\t45';
    expect(detectInputFormat(tsv)).toBe('tsv');
  });

  test('detects JSON format', () => {
    const json = '{"keyword": "test", "volume": 1000}';
    expect(detectInputFormat(json)).toBe('json');
  });

  test('detects markdown table format', () => {
    const table = '| keyword | volume |\n|---------|--------|\n| test | 1000 |';
    expect(detectInputFormat(table)).toBe('table');
  });

  test('defaults to text for unknown formats', () => {
    const text = 'Some random text without structure';
    expect(detectInputFormat(text)).toBe('text');
  });
});

describe('Data Source Detection', () => {
  test('detects GSC data', () => {
    const gscData = 'keyword,impressions,clicks,ctr,position';
    expect(detectDataSource(gscData)).toBe('gsc');
  });

  test('detects Ahrefs data', () => {
    const ahrefsData = 'keyword,keyword difficulty,volume,cpc';
    expect(detectDataSource(ahrefsData)).toBe('ahrefs');
  });

  test('detects SEMrush data', () => {
    // SEMrush uses different patterns than Ahrefs
    const semrushData = 'keyword,volume,trend,competition';
    expect(detectDataSource(semrushData)).toBe('semrush');
  });

  test('detects GA4 data', () => {
    const ga4Data = 'page,sessions,users,engagement';
    expect(detectDataSource(ga4Data)).toBe('ga4');
  });

  test('returns unknown for unidentified sources', () => {
    const unknown = 'random,data,columns';
    expect(detectDataSource(unknown)).toBe('unknown');
  });
});

describe('CSV/TSV Parsing', () => {
  test('parses CSV with headers', () => {
    const csv = 'keyword,volume,difficulty\nseo tools,5000,30\ncontent marketing,8000,45';
    const result = parseDelimitedData(csv);

    expect(result.headers).toEqual(['keyword', 'volume', 'difficulty']);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual(['seo tools', '5000', '30']);
  });

  test('parses TSV with headers', () => {
    const tsv = 'keyword\tvolume\ntest\t1000';
    const result = parseDelimitedData(tsv);

    expect(result.headers).toEqual(['keyword', 'volume']);
    expect(result.rows[0]).toEqual(['test', '1000']);
  });

  test('handles quoted values with commas', () => {
    const csv = 'keyword,description\n"best seo, marketing tools","test, value"';
    const result = parseDelimitedData(csv);

    expect(result.rows[0][0]).toBe('best seo, marketing tools');
    expect(result.rows[0][1]).toBe('test, value');
  });
});

describe('Keyword Input Parsing', () => {
  test('parses keyword CSV from GSC', () => {
    const gscData = `query,clicks,impressions,ctr,position
seo tools,500,10000,5%,3.2
content marketing,300,8000,3.75%,5.1`;

    const result = parseKeywordInput(gscData);

    expect(result.source).toBe('paste');
    expect(result.tool).toBe('gsc');
    expect(result.data.keywords).toHaveLength(2);
    expect(result.data.keywords[0].keyword).toBe('seo tools');
    expect(result.data.keywords[0].clicks).toBe(500);
  });

  test('parses keyword data from Ahrefs format', () => {
    const ahrefsData = `Keyword,Volume,KD,CPC
project management,12000,65,4.50
task management,8000,52,3.20`;

    const result = parseKeywordInput(ahrefsData);

    expect(result.source).toBe('paste');
    expect(result.data.keywords).toHaveLength(2);
    expect(result.data.keywords[0].volume).toBe(12000);
    expect(result.data.keywords[0].difficulty).toBe(65);
  });

  test('handles missing columns gracefully', () => {
    const partialData = `keyword,volume
test keyword,1000`;

    const result = parseKeywordInput(partialData);

    expect(result.data.keywords[0].keyword).toBe('test keyword');
    expect(result.data.keywords[0].volume).toBe(1000);
    expect(result.data.keywords[0].difficulty).toBeUndefined();
  });

  test('parses numeric values with k suffix', () => {
    const formattedData = `keyword,volume,cpc
test1,5k,2.50
test2,10k,5.00`;

    const result = parseKeywordInput(formattedData);

    // 5k should parse as 5000, 10k as 10000
    expect(result.data.keywords).toHaveLength(2);
    expect(result.data.keywords[0].volume).toBe(5000);
    expect(result.data.keywords[1].volume).toBe(10000);
  });
});
