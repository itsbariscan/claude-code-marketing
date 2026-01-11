/**
 * Storage Module
 * Handles YAML file operations for brands, handoffs, memory, and config
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import * as os from 'os';

// Base storage directory
const STORAGE_DIR = path.join(os.homedir(), '.claude-marketing');

// Storage subdirectories
export const PATHS = {
  root: STORAGE_DIR,
  brands: path.join(STORAGE_DIR, 'brands'),
  session: path.join(STORAGE_DIR, 'session'),
  handoffs: path.join(STORAGE_DIR, 'handoffs'),
  memory: path.join(STORAGE_DIR, 'memory'),
  history: path.join(STORAGE_DIR, 'history'),
  exports: path.join(STORAGE_DIR, 'exports'),
  config: path.join(STORAGE_DIR, 'config.yaml'),
  continuity: path.join(STORAGE_DIR, 'session', 'continuity.yaml'),
};

/**
 * Initialize storage directories
 * Creates all necessary directories if they don't exist
 */
export function initializeStorage(): void {
  const directories = [
    PATHS.root,
    PATHS.brands,
    PATHS.session,
    PATHS.handoffs,
    PATHS.memory,
    PATHS.history,
    PATHS.exports,
  ];

  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Initialize config if it doesn't exist
  if (!fs.existsSync(PATHS.config)) {
    writeYaml(PATHS.config, getDefaultConfig());
  }

  // Initialize memory file if it doesn't exist
  const memoryFile = path.join(PATHS.memory, 'learnings.yaml');
  if (!fs.existsSync(memoryFile)) {
    writeYaml(memoryFile, { learnings: [] });
  }
}

/**
 * Read YAML file and parse to object
 */
export function readYaml<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return yaml.parse(content) as T;
  } catch (error) {
    console.error(`Error reading YAML file ${filePath}:`, error);
    return null;
  }
}

/**
 * Write object to YAML file
 */
export function writeYaml<T>(filePath: string, data: T): boolean {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const content = yaml.stringify(data, { lineWidth: 0 });
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error writing YAML file ${filePath}:`, error);
    return false;
  }
}

/**
 * Delete a file
 */
export function deleteFile(filePath: string): boolean {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return true;
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
    return false;
  }
}

/**
 * List files in a directory
 */
export function listFiles(dirPath: string, extension?: string): string[] {
  try {
    if (!fs.existsSync(dirPath)) {
      return [];
    }
    let files = fs.readdirSync(dirPath);
    if (extension) {
      files = files.filter((f) => f.endsWith(extension));
    }
    return files;
  } catch (error) {
    console.error(`Error listing files in ${dirPath}:`, error);
    return [];
  }
}

/**
 * Check if file exists
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Get file modification time
 */
export function getFileModTime(filePath: string): Date | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const stats = fs.statSync(filePath);
    return stats.mtime;
  } catch (error) {
    return null;
  }
}

// ============================================
// BRAND STORAGE
// ============================================

/**
 * Get path to a brand file
 */
export function getBrandPath(brandId: string): string {
  return path.join(PATHS.brands, `${brandId}.yaml`);
}

/**
 * List all brand IDs
 */
export function listBrandIds(): string[] {
  const files = listFiles(PATHS.brands, '.yaml');
  return files.map((f) => f.replace('.yaml', ''));
}

// ============================================
// HANDOFF STORAGE
// ============================================

/**
 * Get path to a handoff file
 */
export function getHandoffPath(brandId: string): string {
  return path.join(PATHS.handoffs, `${brandId}.yaml`);
}

// ============================================
// HISTORY STORAGE
// ============================================

/**
 * Get path to history file for a brand and month
 */
export function getHistoryPath(brandId: string, yearMonth?: string): string {
  const ym = yearMonth || getCurrentYearMonth();
  const brandHistoryDir = path.join(PATHS.history, brandId);
  if (!fs.existsSync(brandHistoryDir)) {
    fs.mkdirSync(brandHistoryDir, { recursive: true });
  }
  return path.join(brandHistoryDir, `${ym}.yaml`);
}

/**
 * Get current year-month string (YYYY-MM)
 */
export function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// ============================================
// MEMORY STORAGE
// ============================================

/**
 * Get path to learnings file
 */
export function getLearningsPath(): string {
  return path.join(PATHS.memory, 'learnings.yaml');
}

// ============================================
// DEFAULT CONFIG
// ============================================

import { Config } from '../types';

function getDefaultConfig(): Config {
  return {
    preferences: {
      defaultDataMode: 'ask',
      showApiNudges: true,
      exportFormat: 'markdown',
    },
    apis: {},
    ui: {
      showConfidenceLevels: true,
      verboseExplanations: false,
      autoSuggestNextSteps: true,
    },
  };
}

// ============================================
// UTILITIES
// ============================================

/**
 * Generate a URL-safe ID from a name
 */
export function generateId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

/**
 * Get current ISO timestamp
 */
export function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Get current date string (YYYY-MM-DD)
 */
export function getDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Generate a unique ID
 */
export function generateUniqueId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}-${timestamp}${random}` : `${timestamp}${random}`;
}
