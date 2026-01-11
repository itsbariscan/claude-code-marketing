/**
 * Marketing Brand Detect Hook
 *
 * Triggered on: UserPromptSubmit
 * Purpose: Detect brand-related commands and inject context
 */

import * as fs from 'fs';
import * as path from 'path';
// Use JSON instead of YAML to avoid external dependencies

interface UserPromptInput {
  prompt: string;
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

interface SessionState {
  activeBrand?: string;
}

// Storage paths
const MARKETING_DIR = path.join(process.env.HOME || '~', '.claude-marketing');
const BRANDS_DIR = path.join(MARKETING_DIR, 'brands');
const STATE_FILE = path.join(MARKETING_DIR, 'state.json');

function readJson<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

function writeJson(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function listBrands(): Brand[] {
  if (!fs.existsSync(BRANDS_DIR)) return [];

  return fs.readdirSync(BRANDS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const brand = readJson<Brand>(path.join(BRANDS_DIR, f));
      return brand;
    })
    .filter((b): b is Brand => b !== null);
}

function findBrand(query: string): Brand | null {
  const brands = listBrands();
  const lower = query.toLowerCase();

  // Exact match first
  let brand = brands.find(b =>
    b.id.toLowerCase() === lower ||
    b.name.toLowerCase() === lower
  );

  if (brand) return brand;

  // Partial match
  brand = brands.find(b =>
    b.id.toLowerCase().includes(lower) ||
    b.name.toLowerCase().includes(lower)
  );

  return brand || null;
}

function setActiveBrand(brandId: string): void {
  const state = readJson<SessionState>(STATE_FILE) || {};
  state.activeBrand = brandId;
  writeJson(STATE_FILE, state);
}

function formatBrandContext(brand: Brand): string {
  const lines = [
    `✅ **Switched to:** ${brand.name}`,
    ''
  ];

  if (brand.website) lines.push(`🌐 Website: ${brand.website}`);
  if (brand.industry) lines.push(`🏢 Industry: ${brand.industry}`);
  if (brand.product) lines.push(`📦 Product: ${brand.product}`);
  if (brand.audience) lines.push(`👥 Audience: ${brand.audience}`);
  if (brand.competitors?.length) {
    lines.push(`⚔️ Competitors: ${brand.competitors.join(', ')}`);
  }

  lines.push('');
  lines.push('Ready to work on this brand. What would you like to do?');

  return lines.join('\n');
}

function formatBrandList(brands: Brand[]): string {
  if (brands.length === 0) {
    return '📁 **No brands yet.**\n\nUse `/brand new` to create your first brand.';
  }

  const state = readJson<SessionState>(STATE_FILE);
  const activeId = state?.activeBrand;

  const lines = ['📁 **Your Brands:**', ''];

  brands.forEach(b => {
    const active = b.id === activeId ? ' ← active' : '';
    lines.push(`• **${b.name}** (${b.id})${active}`);
    if (b.industry) lines.push(`  Industry: ${b.industry}`);
  });

  lines.push('');
  lines.push('Use `/brand switch [name]` to switch brands.');

  return lines.join('\n');
}

async function main() {
  // Read input from stdin
  let input: UserPromptInput;
  try {
    const rawInput = fs.readFileSync(0, 'utf-8');
    input = JSON.parse(rawInput);
  } catch {
    // Silent exit - no output means no context injection
    return;
  }

  // Guard: Check if prompt exists
  if (!input.prompt || typeof input.prompt !== 'string') {
    return;
  }

  const prompt = input.prompt.trim().toLowerCase();

  // Early exit: Only process if there's a /brand command OR brand-related keywords
  const hasBrandCommand = prompt.startsWith('/brand');
  const hasBrandKeywords = /\b(brand|working on|switch to|marketing|seo|keyword|competitor|content\s+plan)\b/i.test(prompt);
  const state = readJson<SessionState>(STATE_FILE);
  const hasActiveBrand = !!state?.activeBrand;

  // Skip processing if not marketing-related and no active brand
  if (!hasBrandCommand && !hasBrandKeywords && !hasActiveBrand) {
    return;
  }

  // Detect /brand commands
  if (prompt.startsWith('/brand')) {
    const parts = prompt.split(/\s+/);
    const command = parts[1] || '';
    const arg = parts.slice(2).join(' ');

    switch (command) {
      case 'list':
      case '': {
        const brands = listBrands();
        // Plain text output - added as context for Claude
        console.log(formatBrandList(brands));
        return;
      }

      case 'switch':
      case 'set': {
        if (!arg) {
          console.log('⚠️ Please specify a brand: `/brand switch [name]`');
          return;
        }

        const brand = findBrand(arg);
        if (!brand) {
          const brands = listBrands();
          const available = brands.map(b => b.name).join(', ') || 'none';
          console.log(`⚠️ Brand "${arg}" not found.\n\nAvailable: ${available}`);
          return;
        }

        setActiveBrand(brand.id);
        console.log(formatBrandContext(brand));
        return;
      }

      case 'info': {
        const currentState = readJson<SessionState>(STATE_FILE);
        if (!currentState?.activeBrand) {
          console.log('⚠️ No active brand. Use `/brand switch [name]` first.');
          return;
        }

        const brand = findBrand(currentState.activeBrand);
        if (!brand) {
          console.log(`⚠️ Active brand "${currentState.activeBrand}" not found.`);
          return;
        }

        console.log(formatBrandContext(brand));
        return;
      }

      default:
        // Let other /brand commands pass through to the skill
        return;
    }
  }

  // Detect natural language brand switches
  const switchPatterns = [
    /working on (\w+)/i,
    /switch to (\w+)/i,
    /let'?s work on (\w+)/i,
    /for (\w+) brand/i
  ];

  for (const pattern of switchPatterns) {
    const match = prompt.match(pattern);
    if (match) {
      const brandName = match[1];
      const brand = findBrand(brandName);
      if (brand) {
        setActiveBrand(brand.id);
        console.log(`🔄 Detected brand switch...\n\n${formatBrandContext(brand)}`);
        return;
      }
    }
  }

  // No brand command detected - no output needed
}

main().catch(err => {
  console.error('Marketing brand detect hook error:', err);
});
