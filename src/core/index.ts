/**
 * Core Module Exports
 */

// Storage utilities
export {
  initializeStorage,
  readYaml,
  writeYaml,
  deleteFile,
  listFiles,
  fileExists,
  getFileModTime,
  getBrandPath,
  listBrandIds,
  getHandoffPath,
  getHistoryPath,
  getCurrentYearMonth,
  getLearningsPath,
  generateId,
  getTimestamp,
  getDateString,
  generateUniqueId,
  PATHS,
} from './storage';

// Brand management
export {
  createBrand,
  getBrand,
  updateBrand,
  deleteBrand,
  listBrands,
  findBrandByDomain,
  searchBrands,
  getActiveBrand,
  setActiveBrand,
  loadBrandMetadata,
  loadBrandInstructions,
  loadFullBrand,
  addCompetitor,
  removeCompetitor,
  addNote,
  updatePreferences,
  type BrandMetadata,
  type BrandInstructions,
} from './brand/brand-manager';

// State management
export * from './state';

// History tracking
export * from './history';

// Session management
export * from './session';

// Data parsing
export * from './data';

// Export functionality
export * from './export';
