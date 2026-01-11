/**
 * Storage Module Tests
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Mock storage directory for tests
const TEST_STORAGE_DIR = path.join(os.tmpdir(), '.claude-marketing-test');

// Clean up before tests
beforeAll(() => {
  if (fs.existsSync(TEST_STORAGE_DIR)) {
    fs.rmSync(TEST_STORAGE_DIR, { recursive: true });
  }
});

// Clean up after tests
afterAll(() => {
  if (fs.existsSync(TEST_STORAGE_DIR)) {
    fs.rmSync(TEST_STORAGE_DIR, { recursive: true });
  }
});

describe('Storage Utilities', () => {
  describe('generateId', () => {
    // Import after mocking
    const { generateId } = require('../src/core/storage');

    test('converts name to lowercase kebab-case', () => {
      expect(generateId('Acme Corp')).toBe('acme-corp');
    });

    test('removes special characters', () => {
      expect(generateId('Tech & Co.')).toBe('tech-co');
    });

    test('truncates to 50 characters', () => {
      const longName = 'This is a very long brand name that exceeds fifty characters';
      expect(generateId(longName).length).toBeLessThanOrEqual(50);
    });

    test('removes leading and trailing hyphens', () => {
      expect(generateId('  -Test Brand-  ')).toBe('test-brand');
    });
  });

  describe('getTimestamp', () => {
    const { getTimestamp } = require('../src/core/storage');

    test('returns ISO format timestamp', () => {
      const timestamp = getTimestamp();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('getDateString', () => {
    const { getDateString } = require('../src/core/storage');

    test('returns YYYY-MM-DD format', () => {
      const date = getDateString();
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('generateUniqueId', () => {
    const { generateUniqueId } = require('../src/core/storage');

    test('generates unique IDs', () => {
      const id1 = generateUniqueId();
      const id2 = generateUniqueId();
      expect(id1).not.toBe(id2);
    });

    test('includes prefix when provided', () => {
      const id = generateUniqueId('test');
      expect(id.startsWith('test-')).toBe(true);
    });
  });
});

describe('YAML Operations', () => {
  const { readYaml, writeYaml } = require('../src/core/storage');
  const testFile = path.join(TEST_STORAGE_DIR, 'test.yaml');

  beforeEach(() => {
    if (!fs.existsSync(TEST_STORAGE_DIR)) {
      fs.mkdirSync(TEST_STORAGE_DIR, { recursive: true });
    }
  });

  test('writeYaml creates file and readYaml reads it', () => {
    const data = { name: 'Test', value: 123 };

    const writeResult = writeYaml(testFile, data);
    expect(writeResult).toBe(true);

    const readResult = readYaml(testFile);
    expect(readResult).toEqual(data);
  });

  test('readYaml returns null for non-existent file', () => {
    const result = readYaml(path.join(TEST_STORAGE_DIR, 'nonexistent.yaml'));
    expect(result).toBeNull();
  });

  test('writeYaml creates directories if needed', () => {
    const nestedFile = path.join(TEST_STORAGE_DIR, 'nested', 'dir', 'file.yaml');
    const data = { test: true };

    const result = writeYaml(nestedFile, data);
    expect(result).toBe(true);
    expect(fs.existsSync(nestedFile)).toBe(true);
  });
});
