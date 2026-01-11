/**
 * Brand Manager
 * Handles all brand CRUD operations and context management
 */

import {
  readYaml,
  writeYaml,
  deleteFile,
  getBrandPath,
  listBrandIds,
  generateId,
  getTimestamp,
  getDateString,
  PATHS,
  fileExists,
} from '../storage';
import { Brand, Config, BrandPreferences } from '../../types';

// ============================================
// BRAND CRUD OPERATIONS
// ============================================

/**
 * Create a new brand
 */
export function createBrand(data: Partial<Brand> & { name: string; website: string }): Brand | null {
  const id = generateId(data.name);

  // Check if brand already exists
  if (fileExists(getBrandPath(id))) {
    throw new Error(`Brand with ID "${id}" already exists`);
  }

  const now = getDateString();

  const brand: Brand = {
    id,
    name: data.name,
    website: data.website.replace(/^https?:\/\//, '').replace(/\/$/, ''),
    created: now,
    lastUpdated: now,

    business: data.business || {
      industry: '',
      product: '',
      model: '',
      usp: '',
    },

    audience: data.audience || {
      primary: { description: '' },
      geo: [],
      painPoints: [],
    },

    competitors: data.competitors || [],

    accounts: data.accounts || {},

    currentInvestments: data.currentInvestments || {},

    notes: data.notes || [],

    preferences: data.preferences || {
      dataMode: 'ask',
    },
  };

  const success = writeYaml(getBrandPath(id), brand);
  if (!success) {
    throw new Error('Failed to save brand');
  }

  // Set as active brand
  setActiveBrand(id);

  return brand;
}

/**
 * Read a brand by ID
 */
export function getBrand(brandId: string): Brand | null {
  return readYaml<Brand>(getBrandPath(brandId));
}

/**
 * Update an existing brand
 */
export function updateBrand(brandId: string, updates: Partial<Brand>): Brand | null {
  const brand = getBrand(brandId);
  if (!brand) {
    throw new Error(`Brand "${brandId}" not found`);
  }

  const updatedBrand: Brand = {
    ...brand,
    ...updates,
    id: brand.id, // Ensure ID is not changed
    created: brand.created, // Ensure created date is not changed
    lastUpdated: getDateString(),
  };

  const success = writeYaml(getBrandPath(brandId), updatedBrand);
  if (!success) {
    throw new Error('Failed to update brand');
  }

  return updatedBrand;
}

/**
 * Delete a brand
 */
export function deleteBrand(brandId: string): boolean {
  const brand = getBrand(brandId);
  if (!brand) {
    throw new Error(`Brand "${brandId}" not found`);
  }

  // Remove from active if it's the active brand
  const config = getConfig();
  if (config?.activeBrand === brandId) {
    setActiveBrand(undefined);
  }

  return deleteFile(getBrandPath(brandId));
}

/**
 * List all brands
 */
export function listBrands(): Brand[] {
  const ids = listBrandIds();
  return ids
    .map((id) => getBrand(id))
    .filter((b): b is Brand => b !== null)
    .sort((a, b) => {
      // Sort by last session date, most recent first
      const aDate = a.lastSession || a.lastUpdated;
      const bDate = b.lastSession || b.lastUpdated;
      return bDate.localeCompare(aDate);
    });
}

/**
 * Find brand by website domain
 */
export function findBrandByDomain(domain: string): Brand | null {
  const cleanDomain = domain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .toLowerCase();

  const brands = listBrands();
  return brands.find((b) => {
    const brandDomain = b.website
      .replace(/^www\./, '')
      .toLowerCase();
    return brandDomain === cleanDomain || brandDomain.includes(cleanDomain);
  }) || null;
}

/**
 * Search brands by name
 */
export function searchBrands(query: string): Brand[] {
  const q = query.toLowerCase();
  const brands = listBrands();
  return brands.filter(
    (b) =>
      b.name.toLowerCase().includes(q) ||
      b.website.toLowerCase().includes(q) ||
      b.business.industry?.toLowerCase().includes(q)
  );
}

// ============================================
// ACTIVE BRAND MANAGEMENT
// ============================================

/**
 * Get the currently active brand
 */
export function getActiveBrand(): Brand | null {
  const config = getConfig();
  if (!config?.activeBrand) {
    return null;
  }
  return getBrand(config.activeBrand);
}

/**
 * Set the active brand
 */
export function setActiveBrand(brandId: string | undefined): void {
  const config = getConfig() || getDefaultConfig();
  config.activeBrand = brandId;
  writeYaml(PATHS.config, config);

  // Update last session on the brand
  if (brandId) {
    const brand = getBrand(brandId);
    if (brand) {
      updateBrand(brandId, { lastSession: getDateString() });
    }
  }
}

/**
 * Get config
 */
function getConfig(): Config | null {
  return readYaml<Config>(PATHS.config);
}

/**
 * Get default config
 */
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
// BRAND CONTEXT LOADING (Progressive Disclosure)
// ============================================

/**
 * Brand metadata - always loaded (~50 tokens)
 */
export interface BrandMetadata {
  id: string;
  name: string;
  website: string;
  industry: string;
  lastActivity: string;
}

/**
 * Brand instructions - loaded on activation (~200 tokens)
 */
export interface BrandInstructions {
  audience: {
    primary: string;
    secondary?: string;
    geo: string[];
  };
  competitors: Array<{
    domain: string;
    yourAngle?: string;
  }>;
  positioning?: {
    tagline?: string;
    differentiator?: string;
  };
  currentInvestments: {
    active: string[];
    status: Record<string, string>;
  };
}

/**
 * Load brand metadata (Stage 1 - always loaded)
 */
export function loadBrandMetadata(brandId: string): BrandMetadata | null {
  const brand = getBrand(brandId);
  if (!brand) return null;

  return {
    id: brand.id,
    name: brand.name,
    website: brand.website,
    industry: brand.business.industry,
    lastActivity: brand.lastSession || brand.lastUpdated,
  };
}

/**
 * Load brand instructions (Stage 2 - on activation)
 */
export function loadBrandInstructions(brandId: string): BrandInstructions | null {
  const brand = getBrand(brandId);
  if (!brand) return null;

  const activeChannels: string[] = [];
  const channelStatus: Record<string, string> = {};

  if (brand.currentInvestments) {
    for (const [channel, investment] of Object.entries(brand.currentInvestments)) {
      if (investment?.active) {
        activeChannels.push(channel);
        channelStatus[channel] = investment.performance || 'unknown';
      }
    }
  }

  return {
    audience: {
      primary: brand.audience.primary.description,
      secondary: brand.audience.secondary?.description,
      geo: brand.audience.geo,
    },
    competitors: brand.competitors.map((c) => ({
      domain: c.domain,
      yourAngle: c.yourAngle,
    })),
    positioning: brand.strategy?.positioning
      ? {
          tagline: brand.strategy.positioning.tagline,
          differentiator: brand.strategy.positioning.differentiator,
        }
      : undefined,
    currentInvestments: {
      active: activeChannels,
      status: channelStatus,
    },
  };
}

/**
 * Load full brand (Stage 3 - on demand)
 */
export function loadFullBrand(brandId: string): Brand | null {
  return getBrand(brandId);
}

// ============================================
// BRAND UPDATES
// ============================================

/**
 * Add a competitor to a brand
 */
export function addCompetitor(
  brandId: string,
  competitor: { domain: string; name?: string; yourAngle?: string }
): Brand | null {
  const brand = getBrand(brandId);
  if (!brand) return null;

  // Check if competitor already exists
  const exists = brand.competitors.some(
    (c) => c.domain.toLowerCase() === competitor.domain.toLowerCase()
  );
  if (exists) {
    throw new Error(`Competitor "${competitor.domain}" already exists`);
  }

  const updatedCompetitors = [...brand.competitors, competitor];
  return updateBrand(brandId, { competitors: updatedCompetitors });
}

/**
 * Remove a competitor from a brand
 */
export function removeCompetitor(brandId: string, domain: string): Brand | null {
  const brand = getBrand(brandId);
  if (!brand) return null;

  const updatedCompetitors = brand.competitors.filter(
    (c) => c.domain.toLowerCase() !== domain.toLowerCase()
  );
  return updateBrand(brandId, { competitors: updatedCompetitors });
}

/**
 * Add a note to a brand
 */
export function addNote(brandId: string, content: string): Brand | null {
  const brand = getBrand(brandId);
  if (!brand) return null;

  const newNote = {
    date: getDateString(),
    content,
  };

  const updatedNotes = [...brand.notes, newNote];
  return updateBrand(brandId, { notes: updatedNotes });
}

/**
 * Update brand preferences
 */
export function updatePreferences(
  brandId: string,
  preferences: Partial<BrandPreferences>
): Brand | null {
  const brand = getBrand(brandId);
  if (!brand) return null;

  const updatedPreferences = {
    ...brand.preferences,
    ...preferences,
  };
  return updateBrand(brandId, { preferences: updatedPreferences });
}
