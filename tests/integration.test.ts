/**
 * Integration Tests
 * Test real use case flows end-to-end
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Set test storage directory BEFORE importing modules
const TEST_STORAGE = path.join(os.tmpdir(), '.claude-marketing-integration-test');
process.env.CLAUDE_MARKETING_STORAGE = TEST_STORAGE;

// Clean up before all tests
beforeAll(() => {
  if (fs.existsSync(TEST_STORAGE)) {
    fs.rmSync(TEST_STORAGE, { recursive: true });
  }
  fs.mkdirSync(TEST_STORAGE, { recursive: true });
  fs.mkdirSync(path.join(TEST_STORAGE, 'brands'), { recursive: true });
  fs.mkdirSync(path.join(TEST_STORAGE, 'session'), { recursive: true });
  fs.mkdirSync(path.join(TEST_STORAGE, 'handoffs'), { recursive: true });
  fs.mkdirSync(path.join(TEST_STORAGE, 'memory'), { recursive: true });
  fs.mkdirSync(path.join(TEST_STORAGE, 'history'), { recursive: true });
  fs.mkdirSync(path.join(TEST_STORAGE, 'exports'), { recursive: true });

  // Create config file
  const configPath = path.join(TEST_STORAGE, 'config.yaml');
  fs.writeFileSync(configPath, 'preferences:\n  defaultDataMode: ask\n');

  // Create learnings file
  const learningsPath = path.join(TEST_STORAGE, 'memory', 'learnings.yaml');
  fs.writeFileSync(learningsPath, 'learnings: []\n');
});

// Clean up after all tests
afterAll(() => {
  if (fs.existsSync(TEST_STORAGE)) {
    fs.rmSync(TEST_STORAGE, { recursive: true });
  }
});

describe('Brand Management Flow', () => {
  // Need to use dynamic imports due to storage initialization
  let brandManager: any;
  const uniqueId = Date.now().toString(36);

  beforeAll(async () => {
    // Mock the PATHS to use test directory
    jest.doMock('../src/core/storage', () => {
      const actual = jest.requireActual('../src/core/storage');
      return {
        ...actual,
        PATHS: {
          root: TEST_STORAGE,
          brands: path.join(TEST_STORAGE, 'brands'),
          session: path.join(TEST_STORAGE, 'session'),
          handoffs: path.join(TEST_STORAGE, 'handoffs'),
          memory: path.join(TEST_STORAGE, 'memory'),
          history: path.join(TEST_STORAGE, 'history'),
          exports: path.join(TEST_STORAGE, 'exports'),
          config: path.join(TEST_STORAGE, 'config.yaml'),
          continuity: path.join(TEST_STORAGE, 'session', 'continuity.yaml'),
        },
      };
    });

    brandManager = await import('../src/core/brand/brand-manager');
  });

  test('creates a new brand', () => {
    const brandName = `Test Corp ${uniqueId}`;
    const brand = brandManager.createBrand({
      name: brandName,
      website: `testcorp-${uniqueId}.com`,
    });

    expect(brand).not.toBeNull();
    expect(brand.name).toBe(brandName);
  });

  test('retrieves created brand', () => {
    const brand = brandManager.getBrand(`test-corp-${uniqueId}`);

    expect(brand).not.toBeNull();
    expect(brand?.name).toBe(`Test Corp ${uniqueId}`);
  });

  test('lists all brands', () => {
    // Create another brand
    brandManager.createBrand({
      name: `Another Brand ${uniqueId}`,
      website: `another-${uniqueId}.io`,
    });

    const brands = brandManager.listBrands();

    expect(brands.length).toBeGreaterThanOrEqual(2);
  });

  test('updates brand', () => {
    const updated = brandManager.updateBrand(`test-corp-${uniqueId}`, {
      business: {
        industry: 'SaaS',
        product: 'Project Management',
        model: 'self-serve',
        usp: 'Best for small teams',
      },
    });

    expect(updated?.business.industry).toBe('SaaS');
    expect(updated?.business.product).toBe('Project Management');
  });

  test('adds competitor', () => {
    const updated = brandManager.addCompetitor(`test-corp-${uniqueId}`, {
      domain: `competitor-${uniqueId}.com`,
      yourAngle: 'We are simpler',
    });

    expect(updated?.competitors.length).toBeGreaterThanOrEqual(1);
  });

  test('adds note', () => {
    const updated = brandManager.addNote(`test-corp-${uniqueId}`, `Note ${uniqueId}`);

    expect(updated?.notes.length).toBeGreaterThanOrEqual(1);
  });

  test('sets and gets active brand', () => {
    brandManager.setActiveBrand(`test-corp-${uniqueId}`);

    const active = brandManager.getActiveBrand();

    expect(active).not.toBeNull();
    expect(active?.id).toBe(`test-corp-${uniqueId}`);
  });

  test('searches brands by name', () => {
    const results = brandManager.searchBrands(uniqueId);

    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  test('loads brand metadata (progressive disclosure)', () => {
    const metadata = brandManager.loadBrandMetadata(`test-corp-${uniqueId}`);

    expect(metadata).not.toBeNull();
    expect(metadata?.industry).toBe('SaaS');
  });

  test('loads brand instructions (progressive disclosure)', () => {
    const instructions = brandManager.loadBrandInstructions(`test-corp-${uniqueId}`);

    expect(instructions).not.toBeNull();
  });
});

describe('State Management Flow', () => {
  let continuityLedger: any;
  let handoffs: any;
  let memory: any;
  const stateUniqueId = Date.now().toString(36) + '-state';

  beforeAll(async () => {
    continuityLedger = await import('../src/core/state/continuity-ledger');
    handoffs = await import('../src/core/state/handoffs');
    memory = await import('../src/core/state/memory');
  });

  test('initializes continuity ledger', () => {
    const ledger = continuityLedger.initLedger(`brand-${stateUniqueId}`, 'Test Corp', 'Keyword research');

    expect(ledger).not.toBeNull();
    expect(ledger.brandId).toBe(`brand-${stateUniqueId}`);
    expect(ledger.goal).toBe('Keyword research');
  });

  test('tracks in-progress task', () => {
    continuityLedger.addInProgressTask('Research competitor keywords');

    const ledger = continuityLedger.getLedger();

    expect(ledger?.inProgress).toHaveLength(1);
    expect(ledger?.inProgress[0].task).toBe('Research competitor keywords');
  });

  test('completes task', () => {
    continuityLedger.completeTask('Research competitor keywords', 'Found 50 keywords');

    const ledger = continuityLedger.getLedger();

    expect(ledger?.completed).toHaveLength(1);
    expect(ledger?.completed[0].result).toBe('Found 50 keywords');
    expect(ledger?.inProgress).toHaveLength(0);
  });

  test('adds blocker', () => {
    continuityLedger.addBlocker('Need API access for volume data');

    const ledger = continuityLedger.getLedger();

    expect(ledger?.blockers).toContain('Need API access for volume data');
  });

  test('gets session summary', () => {
    const summary = continuityLedger.getSessionSummary();

    expect(summary).not.toBeNull();
    expect(summary?.completed).toBe(1);
    expect(summary?.blockers).toBe(1);
  });

  test('creates handoff from ledger', () => {
    const handoff = handoffs.createHandoff([
      { priority: 1, task: 'Continue keyword analysis' },
      { priority: 2, task: 'Create content brief' },
    ]);

    expect(handoff).not.toBeNull();
    expect(handoff?.nextSteps).toHaveLength(2);
    expect(handoff?.resumePrompt).toContain('Test Corp');
  });

  test('retrieves handoff', () => {
    const handoff = handoffs.getHandoff(`brand-${stateUniqueId}`);

    expect(handoff).not.toBeNull();
    expect(handoff?.lastSession.completed).toHaveLength(1);
  });

  test('formats handoff display', () => {
    const handoff = handoffs.getHandoff(`brand-${stateUniqueId}`);
    const display = handoffs.formatHandoffDisplay(handoff!);

    expect(display).toContain('RESUMING WORK');
    expect(display).toContain('COMPLETED');
    expect(display).toContain('NEXT STEPS');
  });

  test('stores learning', () => {
    const learning = memory.storeWhatWorked(
      `brand-${stateUniqueId}`,
      'keyword-research',
      'Long-tail keywords converted better',
      'Found during Q4 campaign'
    );

    expect(learning).not.toBeNull();
    expect(learning.type).toBe('what_worked');
  });

  test('retrieves brand learnings', () => {
    const learnings = memory.getBrandLearnings(`brand-${stateUniqueId}`);

    expect(learnings.length).toBeGreaterThanOrEqual(1);
  });

  test('gets relevant learnings', () => {
    const relevant = memory.getRelevantLearnings(`brand-${stateUniqueId}`, {
      category: 'keyword',
    });

    expect(relevant.length).toBeGreaterThanOrEqual(1);
  });
});

describe('SEO Plugin Flow', () => {
  let seoPlugin: any;

  beforeAll(async () => {
    seoPlugin = await import('../src/plugins/seo');
  });

  test('parses keyword CSV', () => {
    const csvData = `keyword,volume,kd
project management,12000,65
task tracking,5000,45
team collaboration,8000,55`;

    const result = seoPlugin.parseKeywordData(csvData);

    expect(result).toHaveLength(3);
    expect(result[0].keyword).toBe('project management');
    expect(result[0].volume).toBe(12000);
  });

  test('analyzes keywords', () => {
    const keywords = [
      { keyword: 'best project management software', volume: 5000, difficulty: 45 },
      { keyword: 'project management login', volume: 1000, difficulty: 10 },
    ];

    const analysis = seoPlugin.analyzeKeywords(keywords);

    expect(analysis[0].intent).toBe('commercial');
    expect(analysis[1].intent).toBe('navigational');
  });

  test('generates content ideas from keywords', () => {
    const keywords = [
      { keyword: 'how to manage projects', volume: 3000, difficulty: 30, intent: 'informational', relevance: 'high', priority: 'quick-win', reasoning: 'test' },
    ];

    const ideas = seoPlugin.generateContentIdeas(keywords);

    expect(ideas.length).toBeGreaterThanOrEqual(1);
    expect(ideas[0].type).toBe('how_to');
  });

  test('generates content brief', () => {
    const keyword = {
      keyword: 'best project management tools',
      intent: 'commercial' as const,
      difficulty: 'medium' as const,
      relevance: 'high' as const,
      priority: 'strategic' as const,
      reasoning: 'High commercial intent',
    };

    const brief = seoPlugin.generateContentBrief(keyword);

    expect(brief.title).toContain('Project Management');
    expect(brief.outline.length).toBeGreaterThan(0);
    expect(brief.wordCountRange.min).toBeGreaterThan(0);
  });
});

describe('Strategy Plugin Flow', () => {
  let strategyPlugin: any;

  beforeAll(async () => {
    strategyPlugin = await import('../src/plugins/strategy');
  });

  test('builds positioning statement', () => {
    const positioning = strategyPlugin.buildPositioningStatement({
      targetAudience: 'small business owners',
      need: 'need to manage projects efficiently',
      productCategory: 'project management tool',
      keyBenefit: 'saves 10 hours per week',
      competitor: 'complex enterprise tools',
      differentiator: 'are simple and affordable',
    });

    expect(positioning.for).toBe('small business owners');
    expect(positioning.differentiator).toBe('are simple and affordable');
  });

  test('formats positioning statement', () => {
    const positioning = strategyPlugin.buildPositioningStatement({
      targetAudience: 'marketers',
      need: 'need SEO insights',
      productCategory: 'SEO tool',
      keyBenefit: 'provides actionable recommendations',
      differentiator: 'use AI for analysis',
    });

    const formatted = strategyPlugin.formatPositioningStatement(positioning);

    expect(formatted).toContain('POSITIONING STATEMENT');
    expect(formatted).toContain('marketers');
  });

  test('builds persona', () => {
    const persona = strategyPlugin.buildPersona({
      name: 'Marketing Manager Maria',
      role: 'Marketing Manager',
      companySize: '50-200 employees',
      painPoints: ['Limited time', 'Budget constraints'],
      goals: ['Increase organic traffic', 'Generate leads'],
    });

    expect(persona.id).toBe('marketing-manager-maria');
    expect(persona.painPoints).toHaveLength(2);
    expect(persona.messaging.do.length).toBeGreaterThan(0);
  });

  test('assesses channel', () => {
    const assessment = strategyPlugin.assessChannel(
      'google_ads',
      'profitable',
      '$5000/month'
    );

    expect(assessment.isOptimized).toBe(true);
    expect(assessment.improvementPotential).toBe('medium');
  });

  test('generates channel recommendation', () => {
    const assessment = {
      isOptimized: false,
      improvementPotential: 'high' as const,
      issues: ['Not generating positive ROI'],
      opportunities: ['Optimize targeting'],
    };

    const recommendation = strategyPlugin.generateChannelRecommendation(
      'meta_ads',
      assessment,
      'break-even'
    );

    expect(recommendation.action).toBe('optimize');
  });

  test('checks if can recommend new channels', () => {
    const audits = [
      {
        channel: 'seo',
        isActive: true,
        performance: 'profitable',
        assessment: { isOptimized: true, improvementPotential: 'low', issues: [], opportunities: [] },
        recommendation: { name: 'SEO', action: 'scale', reason: 'Working well' },
      },
    ];

    const result = strategyPlugin.canRecommendNewChannels(audits);

    expect(result.ready).toBe(true);
  });
});

describe('Skill Commands Flow', () => {
  let brandSkill: any;
  let onboarding: any;

  beforeAll(async () => {
    brandSkill = await import('../src/skills/brand');
    onboarding = await import('../src/skills/onboarding');
  });

  test('handles /brand list command', () => {
    const result = brandSkill.handleBrandCommand('list');

    expect(result.success).toBe(true);
    expect(result.message).toContain('BRANDS');
  });

  test('handles /brand info command', () => {
    const result = brandSkill.handleBrandCommand('info');

    // Should succeed since we have an active brand from earlier tests
    expect(result.success).toBe(true);
  });

  test('detects brand intent from natural language', () => {
    const result1 = brandSkill.detectBrandIntent('working on Acme Corp');
    expect(result1.detected).toBe(true);
    expect(result1.action).toBe('switch');

    const result2 = brandSkill.detectBrandIntent('new client');
    expect(result2.detected).toBe(true);
    expect(result2.action).toBe('new');

    const result3 = brandSkill.detectBrandIntent('who am I working with');
    expect(result3.detected).toBe(true);
    expect(result3.action).toBe('status');
  });

  test('onboarding flow - gets next question', () => {
    const state = onboarding.initOnboarding();

    const question = onboarding.getNextQuestion(state);

    expect(question).not.toBeNull();
    expect(question?.field).toBe('name');
    expect(question?.optional).toBe(false);
  });

  test('onboarding flow - processes responses', () => {
    let state = onboarding.initOnboarding();

    // Answer name
    state = onboarding.processResponse(state, 'name', 'New Brand');
    expect(state.collected.name).toBe('New Brand');

    // Answer website
    state = onboarding.processResponse(state, 'website', 'https://newbrand.com');
    expect(state.collected.website).toBe('newbrand.com');

    // Can create brand now
    expect(onboarding.canCreateBrand(state)).toBe(true);
  });

  test('onboarding flow - extracts from natural language', () => {
    let state = onboarding.initOnboarding();

    state = onboarding.extractFromNaturalLanguage(
      'New client called TechFlow at techflow.io, they sell project management software',
      state
    );

    expect(state.collected.name).toBe('TechFlow');
    expect(state.collected.website).toBe('techflow.io');
  });
});

describe('Data Input Flow', () => {
  let dataParser: any;

  beforeAll(async () => {
    dataParser = await import('../src/core/data/input-parser');
  });

  test('parses GSC data', () => {
    const gscData = `query,clicks,impressions,ctr,position
project management,500,10000,5%,3.2
team tools,200,5000,4%,7.5`;

    const result = dataParser.parseKeywordInput(gscData);

    expect(result.source).toBe('paste');
    expect(result.tool).toBe('gsc');
    expect(result.confidence).toBe('high');
    expect(result.data.keywords).toHaveLength(2);
  });

  test('assesses data confidence', () => {
    const parsedData = {
      source: 'paste' as const,
      tool: 'ahrefs',
      confidence: 'high' as const,
      data: {
        keywords: [
          { keyword: 'test', volume: 1000, difficulty: 30 },
        ],
      },
    };

    const assessment = dataParser.assessDataConfidence(parsedData);

    expect(assessment.confidence).toBe('high');
    expect(assessment.reasons.length).toBeGreaterThan(0);
  });
});

describe('Export Flow', () => {
  let exporter: any;
  let brandManager: any;
  const exportUniqueId = Date.now().toString(36) + '-export';

  beforeAll(async () => {
    exporter = await import('../src/core/export/exporter');
    brandManager = await import('../src/core/brand/brand-manager');

    // Create a brand for export tests
    brandManager.createBrand({
      name: `Export Test ${exportUniqueId}`,
      website: `export-${exportUniqueId}.com`,
    });
    brandManager.updateBrand(`export-test-${exportUniqueId}`, {
      business: { industry: 'Tech', product: 'Software', model: 'SaaS', usp: 'Fast' },
    });
  });

  test('exports brand as markdown', () => {
    const markdown = exporter.exportBrand(`export-test-${exportUniqueId}`, { format: 'markdown' });

    expect(markdown).toContain(`Export Test ${exportUniqueId}`);
    expect(markdown).toContain('Website');
    expect(markdown).toContain('Tech');
  });

  test('exports brand as text', () => {
    const text = exporter.exportBrand(`export-test-${exportUniqueId}`, { format: 'text' });

    expect(text).toContain('BRAND PROFILE');
    expect(text).toContain(`Export Test ${exportUniqueId}`);
  });

  test('exports content brief', () => {
    const brief = {
      title: 'Best Project Management Tools',
      targetKeyword: 'best project management tools',
      outline: [{ heading: 'Introduction', level: 'h2' }],
      keyPointsToCover: ['Address search intent'],
      wordCountRange: { min: 1500, max: 2500 },
    };

    const markdown = exporter.exportContentBrief(brief);

    expect(markdown).toContain('Content Brief');
    expect(markdown).toContain('Best Project Management Tools');
    expect(markdown).toContain('1500-2500');
  });
});
