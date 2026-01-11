/**
 * Marketing Session Start Hook
 *
 * Triggered on: SessionStart (startup, resume, clear, compact)
 * Purpose: Load active brand context and last handoff
 */

import * as fs from 'fs';
import * as path from 'path';
// Use JSON instead of YAML to avoid external dependencies

interface SessionStartInput {
  type?: string;
  source?: 'startup' | 'resume' | 'clear' | 'compact';
  session_id: string;
}

interface Brand {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  product?: string;
  audience?: string;
  competitors?: string[];
}

interface Handoff {
  brand: string;
  timestamp: string;
  completed: string[];
  inProgress: string[];
  nextSteps: string[];
  summary?: string;
}

// Storage paths
const MARKETING_DIR = path.join(process.env.HOME || '~', '.claude-marketing');
const BRANDS_DIR = path.join(MARKETING_DIR, 'brands');
const STATE_FILE = path.join(MARKETING_DIR, 'state.json');
const HANDOFFS_DIR = path.join(MARKETING_DIR, 'handoffs');

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readJson<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

function getActiveBrandId(): string | null {
  const state = readJson<{ activeBrand?: string }>(STATE_FILE);
  return state?.activeBrand || null;
}

function getBrand(brandId: string): Brand | null {
  const brandFile = path.join(BRANDS_DIR, `${brandId}.json`);
  return readJson<Brand>(brandFile);
}

function getLatestHandoff(brandId: string): Handoff | null {
  const handoffDir = path.join(HANDOFFS_DIR, brandId);
  if (!fs.existsSync(handoffDir)) return null;

  const files = fs.readdirSync(handoffDir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) return null;

  return readJson<Handoff>(path.join(handoffDir, files[0]));
}

function formatBrandContext(brand: Brand): string {
  const lines = [
    `📁 **Active Brand:** ${brand.name}`,
    ''
  ];

  if (brand.website) lines.push(`🌐 Website: ${brand.website}`);
  if (brand.industry) lines.push(`🏢 Industry: ${brand.industry}`);
  if (brand.product) lines.push(`📦 Product: ${brand.product}`);
  if (brand.audience) lines.push(`👥 Audience: ${brand.audience}`);
  if (brand.competitors?.length) {
    lines.push(`⚔️ Competitors: ${brand.competitors.join(', ')}`);
  }

  return lines.join('\n');
}

function formatHandoff(handoff: Handoff): string {
  const lines = [
    '',
    `📋 **Last Session:** ${new Date(handoff.timestamp).toLocaleDateString()}`,
    ''
  ];

  if (handoff.completed?.length) {
    lines.push('✅ **Completed:**');
    handoff.completed.forEach(t => lines.push(`   • ${t}`));
  }

  if (handoff.inProgress?.length) {
    lines.push('');
    lines.push('🔄 **In Progress:**');
    handoff.inProgress.forEach(t => lines.push(`   • ${t}`));
  }

  if (handoff.nextSteps?.length) {
    lines.push('');
    lines.push('📌 **Next Steps:**');
    handoff.nextSteps.forEach(t => lines.push(`   • ${t}`));
  }

  if (handoff.summary) {
    lines.push('');
    lines.push(`💡 **Summary:** ${handoff.summary}`);
  }

  return lines.join('\n');
}

async function main() {
  // Read input from stdin
  let input: SessionStartInput;
  try {
    const rawInput = fs.readFileSync(0, 'utf-8');
    input = JSON.parse(rawInput);
  } catch {
    // No input or invalid JSON - just exit silently
    // Silent exit - no output needed
    return;
  }

  const source = input.source || input.type || 'startup';

  // Ensure directories exist
  ensureDir(MARKETING_DIR);
  ensureDir(BRANDS_DIR);
  ensureDir(HANDOFFS_DIR);

  // Check for active brand
  const brandId = getActiveBrandId();

  if (!brandId) {
    // No active brand - provide welcoming guidance (hook only runs on startup via matcher)
    // Output plain text - it gets added as context to Claude
    console.log(`💡 **Marketing Plugin Ready**

No active brand set. Get started:
• \`/brand new\` - Create your first brand
• \`/brand list\` - See existing brands
• \`/brand switch [name]\` - Switch to a brand

Or just say "I'm working on [brand name]" and I'll find it.`);
    return;
  }

  // Load brand
  const brand = getBrand(brandId);
  if (!brand) {
    console.log(`⚠️ Brand "${brandId}" not found. Use \`/brand list\` to see available brands.`);
    return;
  }

  // Build context message
  let message = formatBrandContext(brand);

  // Load handoff if resuming or starting fresh
  const handoff = getLatestHandoff(brandId);
  if (handoff) {
    message += formatHandoff(handoff);
    message += '\n\n---\nReady to continue. What would you like to work on?';
  }

  // Output plain text - it gets added as context to Claude
  console.log(message);
}

main().catch(err => {
  console.error('Marketing session start hook error:', err);
  // Silent exit - no output needed
});
