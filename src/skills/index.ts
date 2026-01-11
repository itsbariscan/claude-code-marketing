/**
 * Skills - User-invokable slash commands
 */

// /brand skill
export {
  handleBrandCommand,
  detectBrandIntent,
  BRAND_SKILL_PROMPT,
  type BrandCommandResult,
} from './brand';

// Onboarding flow
export {
  initOnboarding,
  getNextQuestion,
  processResponse,
  canCreateBrand,
  finishOnboarding,
  extractFromNaturalLanguage,
  getWelcomeMessage,
  getCompletionMessage,
  getQuickSetupMessage,
  ONBOARDING_SKILL_PROMPT,
  type OnboardingState,
  type OnboardingStep,
  type OnboardingData,
} from './onboarding';
