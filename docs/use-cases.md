# Use Cases

How marketers use Claude Code Marketing in real workflows.

---

## Use Case Map

```
Claude Code Marketing
├── Core Use Cases (daily workflow)
│   ├── UC-001: Create Brand Profile
│   ├── UC-002: Switch Active Brand
│   ├── UC-003: Get Keyword Recommendations
│   └── UC-004: Generate Content Brief
├── Supporting Use Cases
│   ├── UC-010: View Brand Details
│   ├── UC-011: Add Brand Note
│   └── UC-012: List All Brands
├── Strategy Use Cases
│   ├── UC-021: Build Positioning Strategy
│   ├── UC-022: Build Buyer Personas
│   ├── UC-023: Plan Channel Strategy
│   └── UC-024: Create Marketing Playbook
└── Enhancement Use Cases
    └── UC-020: Connect MCP Tools
```

### Dependencies

```
UC-003 (Keywords) requires: UC-001 OR UC-002 (brand must be active)
UC-004 (Content Brief) requires: UC-001 OR UC-002 (brand context needed)
UC-021 (Positioning) requires: UC-001 OR UC-002 (brand + competitors needed)
UC-022 (Personas) requires: UC-001 OR UC-002 (brand context needed)
UC-023 (Channels) requires: UC-001 OR UC-002 (brand context needed)
UC-024 (Playbook) requires: UC-021 OR UC-022 OR UC-023 (strategy work completed)
UC-020 (MCP Tools) is independent (enhances SEO use cases)
```

---

## UC-001: Create Brand Profile

### Overview

| Attribute | Value |
|-----------|-------|
| **Actor** | Marketing Professional |
| **Goal** | Capture client context for future work |
| **Frequency** | Once per client (weekly for agencies) |
| **Priority** | Critical - enables all other use cases |

### Business Context

Every marketing recommendation depends on context: industry, audience, competitors. Without a brand profile, Claude gives generic advice. With a profile, recommendations are specific and actionable.

### Preconditions

- Plugin installed (`./install.sh` completed)
- Claude Code running

### Trigger

Marketer runs `/brand new` or says "new client [name]"

### Main Success Scenario

```
1. Marketer initiates brand creation
   → "/brand new" or "new client Acme"

2. System prompts for basic info
   → "What's the brand name and website?"

3. Marketer provides name and website
   → "Acme Corp, https://acme.com"

4. System prompts for business context
   → "What does Acme Corp sell?"

5. Marketer describes product/service
   → "HR management software for small businesses"

6. System prompts for audience
   → "What industry and who's the target audience?"

7. Marketer defines audience
   → "B2B SaaS, SMB HR managers"

8. System prompts for competitive context
   → "Who are 2-3 main competitors?"

9. Marketer lists competitors
   → "BambooHR, Gusto, Zenefits"

10. System creates brand and confirms
    → "✅ Brand 'Acme Corp' created and set as active."
```

### Alternative Flows

**8a. Marketer skips competitors**
```
8a1. Marketer responds "skip" or "none yet"
8a2. System creates brand without competitors
8a3. System notes competitors can be added later
8a4. Continue to step 10
```

**3a. Natural language input**
```
3a1. Marketer provides all info at once
     → "Acme Corp at acme.com, they sell HR software to small businesses"
3a2. System extracts structured data
3a3. System confirms extraction accuracy
3a4. Skip to step 8 (competitors)
```

### Exception Flows

**4a. Brand name already exists**
```
4a1. System detects duplicate name
4a2. System asks: "Brand 'Acme' exists. Update it or create 'Acme 2'?"
4a3. Marketer chooses action
4a4. System proceeds accordingly
```

### Postconditions (Success)

- Brand JSON file created at `~/.claude-marketing/brands/acme-corp.json`
- Brand set as active in `state.json`
- Context available for all subsequent requests

### Success Metrics

- Brand file contains: name, website, product, industry, audience
- Brand loads correctly on `/brand` command
- Context appears in keyword recommendations

---

## UC-002: Switch Active Brand

### Overview

| Attribute | Value |
|-----------|-------|
| **Actor** | Marketing Professional |
| **Goal** | Load different client context |
| **Frequency** | Multiple times daily |
| **Priority** | Critical - core workflow |

### Business Context

Freelancers and agencies work with multiple clients. Switching should be instant—no re-explaining, no setup. One command, full context.

### Preconditions

- At least 2 brands exist
- One brand is currently active

### Trigger

Marketer runs `/brand switch [name]` or says "I'm working on [name]"

### Main Success Scenario

```
1. Marketer indicates brand switch
   → "/brand switch techstartup" or "I'm working on TechStartup"

2. System locates brand file
   → Finds ~/.claude-marketing/brands/techstartup.json

3. System loads brand context
   → Reads all brand data into memory

4. System updates active state
   → Updates state.json with new active brand

5. System confirms switch with context summary
   → "Switched to TechStartup.
      Industry: Consumer Tech
      Audience: Remote workers
      Last session: 2025-01-10
      What would you like to work on?"
```

### Alternative Flows

**1a. Natural language detection**
```
1a1. Marketer mentions brand in conversation
     → "Let's do keyword research for TechStartup"
1a2. System detects brand name in prompt
1a3. System auto-switches and confirms
1a4. Continue with requested task
```

**5a. Brand has pending work**
```
5a1. System detects handoff from previous session
5a2. System shows: "Resuming TechStartup. Last session you were working on:
     - Content brief for 'remote productivity tools'
     Continue or start fresh?"
5a3. Marketer chooses
```

### Exception Flows

**2a. Brand not found**
```
2a1. System cannot locate brand file
2a2. System shows available brands: "Brand 'techstart' not found.
     Did you mean: TechStartup, TestBrand?"
2a3. Marketer clarifies
2a4. Return to step 2
```

### Postconditions (Success)

- `state.json` updated with new active brand
- Brand context loaded for subsequent requests
- Previous brand state preserved (not lost)

---

## UC-003: Get Keyword Recommendations

### Overview

| Attribute | Value |
|-----------|-------|
| **Actor** | Marketing Professional |
| **Goal** | Find SEO keyword opportunities |
| **Frequency** | Several times per session |
| **Priority** | High - primary SEO workflow |

### Business Context

Keyword research without context is useless. "Best keywords for a SaaS company" yields generic results. "Best keywords for Acme Corp competing against BambooHR" yields actionable strategy.

### Preconditions

- Brand is active (UC-001 or UC-002 completed)
- Brand has industry and competitors defined

### Trigger

Marketer asks for keywords: "what keywords should I target?" or specific request

### Main Success Scenario

```
1. Marketer requests keyword recommendations
   → "what keywords should I target for the homepage?"

2. System loads active brand context
   → Retrieves industry, audience, competitors

3. System analyzes keyword opportunities
   → Considers brand positioning, competitor gaps, search intent

4. System presents prioritized recommendations
   → "📊 KEYWORD ANALYSIS - Acme Corp

      Based on your positioning (simple HR for SMBs):

      🏆 PRIMARY
      • 'hr software small business' - core term, matches audience
      • 'simple hr system' - aligns with USP

      🥈 SECONDARY
      • 'bamboohr alternative' - competitor capture
      • 'hr software pricing' - commercial intent

      Data Source: Reasoning-based
      Confidence: Medium

      Want a content brief for any of these?"

5. Marketer reviews and may request follow-up
```

### Alternative Flows

**3a. MCP tools available**
```
3a1. System detects Ahrefs/SEMrush MCP
3a2. System fetches live volume and difficulty data
3a3. Output includes exact metrics:
     → "• 'hr software small business' - 8,100/mo, KD 34"
3a4. Confidence level: High
```

**1a. Specific keyword request**
```
1a1. Marketer asks about specific keyword
     → "analyze 'hr software for startups'"
1a2. System provides detailed analysis for that keyword
1a3. Includes: intent, difficulty assessment, content angle
```

**4a. Discovery gate triggered**
```
4a1. System determines it needs more context
4a2. System asks clarifying question:
     → "What's the main goal for this page?
        Lead generation, education, or comparison?"
4a3. Marketer answers
4a4. System provides more targeted recommendations
```

### Exception Flows

**2a. No brand active**
```
2a1. System detects no active brand
2a2. System prompts: "No brand selected. Which client are you working on?
     Run /brand switch [name] or /brand new"
2a3. Use case pauses until brand is active
```

### Postconditions (Success)

- Marketer has prioritized keyword list
- Keywords are contextualized to brand positioning
- Clear next action available (content brief)

---

## UC-004: Generate Content Brief

### Overview

| Attribute | Value |
|-----------|-------|
| **Actor** | Marketing Professional |
| **Goal** | Create writer-ready content specification |
| **Frequency** | 1-3 times per session |
| **Priority** | High - content workflow |

### Business Context

Content briefs bridge SEO strategy and content creation. A good brief means writers produce on-target content the first time. A bad brief means endless revisions.

### Preconditions

- Brand is active
- Target keyword identified (often from UC-003)

### Trigger

Marketer requests brief: "create a content brief for [keyword]"

### Main Success Scenario

```
1. Marketer requests content brief
   → "create a content brief for 'hr software for small business'"

2. System loads brand context
   → Retrieves competitors, audience, positioning

3. System analyzes search intent
   → Determines: commercial intent, buyer research stage

4. System generates structured brief
   → "📝 CONTENT BRIEF

      Target: 'hr software for small business'
      Intent: Commercial (comparison/evaluation stage)
      Word count: 2,500-3,500

      OUTLINE:
      H1: HR Software for Small Business: Complete Guide [2025]
      H2: What is HR Software?
          → Define for SMB context, not enterprise
      H2: Key Features Small Businesses Need
          → Focus on simplicity, not feature bloat
      H2: How Much Does HR Software Cost?
          → Price transparency (your USP)
      H2: Top HR Software Compared
          → Include Acme vs BambooHR, Gusto
      H2: How to Choose the Right HR Software
          → Decision framework for SMB buyers
      H2: FAQs
          → Schema markup opportunities

      FEATURED SNIPPET TARGET:
      'HR software for small business typically costs $5-15
      per employee per month. Key features include...'

      DIFFERENTIATION ANGLE:
      Emphasize simplicity vs BambooHR's complexity
      Highlight transparent pricing vs competitors

      INTERNAL LINKS:
      → Pricing page
      → BambooHR comparison
      → HR software demo"

5. Marketer uses brief for content creation or writer handoff
```

### Alternative Flows

**1a. Format-specific request**
```
1a1. Marketer specifies content type
     → "create a comparison brief for bamboohr vs gusto"
1a2. System adjusts outline structure for comparison format
1a3. Includes: side-by-side structure, winner recommendations
```

**4a. Multiple keyword targets**
```
4a1. Marketer requests brief for keyword cluster
     → "brief for 'hr software' and related terms"
4a2. System identifies primary and secondary keywords
4a3. Brief includes keyword mapping to sections
```

### Exception Flows

**3a. Ambiguous intent**
```
3a1. System cannot determine clear search intent
3a2. System asks: "This keyword has mixed intent.
     Focus on: Informational (education) or Commercial (comparison)?"
3a3. Marketer clarifies
3a4. System generates appropriate brief
```

### Postconditions (Success)

- Complete brief with outline, word count, angles
- Brief reflects brand positioning and competitors
- Writer can execute without additional context

---

## UC-010: View Brand Details

### Overview

| Attribute | Value |
|-----------|-------|
| **Actor** | Marketing Professional |
| **Goal** | Review complete brand profile |
| **Frequency** | Start of session, periodic review |
| **Priority** | Medium - supporting workflow |

### Main Success Scenario

```
1. Marketer requests brand details
   → "/brand info"

2. System retrieves full brand data

3. System displays comprehensive view
   → "📁 BRAND: Acme Corp

      🌐 Website: https://acme.com
      📅 Created: 2025-01-11
      📅 Last session: 2025-01-11

      BUSINESS:
      • Industry: B2B SaaS
      • Product: HR management software
      • Model: B2B SaaS
      • Stage: Growth

      AUDIENCE:
      • SMB HR managers, 10-200 employees

      COMPETITORS:
      • bamboohr.com
      • gusto.com
      • zenefits.com

      USP:
      • Simple setup, no IT required
      • Transparent pricing

      NOTES:
      • 2025-01-11: Focus on competitor comparison content
      • 2025-01-11: CEO wants ease-of-use angle

      ACTIONS:
      /brand update - Edit information
      /brand add-note - Add note"
```

---

## UC-011: Add Brand Note

### Overview

| Attribute | Value |
|-----------|-------|
| **Actor** | Marketing Professional |
| **Goal** | Capture insight for future reference |
| **Frequency** | As insights emerge |
| **Priority** | Medium - knowledge capture |

### Business Context

Client calls, stakeholder feedback, performance insights—capture them in context. Notes persist across sessions and inform future recommendations.

### Main Success Scenario

```
1. Marketer wants to record insight
   → "/brand add-note" or "note: pricing page converts best"

2. System prompts for note content (if not provided)
   → "What would you like to note?"

3. Marketer provides note
   → "CEO call: emphasize mobile-first for Q2 campaign"

4. System adds timestamped note to brand file
   → Appends to notes array with current date

5. System confirms
   → "✅ Note added to Acme Corp"
```

### Postconditions

- Note saved with timestamp
- Note appears in `/brand info`
- Note influences future recommendations (Claude sees it in context)

---

## UC-012: List All Brands

### Overview

| Attribute | Value |
|-----------|-------|
| **Actor** | Marketing Professional |
| **Goal** | See all clients at a glance |
| **Frequency** | Daily, session start |
| **Priority** | Medium - navigation |

### Main Success Scenario

```
1. Marketer requests brand list
   → "/brand list"

2. System scans brand directory
   → Reads ~/.claude-marketing/brands/*.json

3. System displays brand table
   → "📁 Your Brands:
      ┌─────────────┬────────────────────┬──────────┐
      │    Brand    │      Industry      │  Status  │
      ├─────────────┼────────────────────┼──────────┤
      │ Acme Corp   │ B2B SaaS           │ ← active │
      │ TechStartup │ Consumer Tech      │          │
      │ LocalShop   │ E-commerce         │          │
      └─────────────┴────────────────────┴──────────┘

      Commands:
      /brand switch [name] - Switch to a brand
      /brand new - Create a new brand"
```

### Alternative Flows

**3a. No brands exist**
```
3a1. System detects empty brands directory
3a2. System displays: "No brands yet. Create your first with /brand new"
```

### Postconditions

- Marketer sees all available brands
- Active brand clearly indicated
- Can navigate to switch or create

---

## UC-020: Connect MCP Tools

### Overview

| Attribute | Value |
|-----------|-------|
| **Actor** | Marketing Professional |
| **Goal** | Enhance analysis with live SEO data |
| **Frequency** | One-time setup |
| **Priority** | Low - enhancement |

### Business Context

The plugin works without SEO tool subscriptions. MCP connections add exact metrics for users who have them. Progressive enhancement, not requirement.

### Preconditions

- Active subscription to Ahrefs, SEMrush, or Google Search Console
- Claude Code MCP capability enabled

### Main Success Scenario

```
1. Marketer decides to connect SEO tool
   → Wants live volume data instead of estimates

2. Marketer adds MCP server
   → "claude mcp add ahrefs"

3. System prompts for authentication
   → OAuth flow or API key entry

4. Marketer completes authentication

5. System confirms connection
   → "Ahrefs MCP connected. Keyword analysis will now include
      exact volume and difficulty scores."

6. Subsequent keyword requests show live data
   → "Data Source: Ahrefs MCP | Confidence: High"
```

### Alternative Flows

**2a. GSC connection (free)**
```
2a1. Marketer connects Google Search Console
     → "claude mcp add gsc"
2a2. OAuth flow with Google account
2a3. Access to actual ranking data, clicks, impressions
```

---

## UC-021: Build Positioning Strategy

### Overview

| Attribute | Value |
|-----------|-------|
| **Actor** | Marketing Professional |
| **Goal** | Define competitive positioning |
| **Frequency** | Once per brand, periodic refresh |
| **Priority** | Medium - strategic workflow |

### Business Context

Positioning determines all marketing: messaging, content angles, competitive claims. Vague positioning leads to generic marketing. Sharp positioning cuts through noise.

### Preconditions

- Brand active with competitors defined
- Marketer has knowledge of differentiation

### Main Success Scenario

```
1. Marketer initiates strategy work
   → "/marketing-strategy" or "help me position against competitors"

2. System presents strategy options
   → "Strategy Options:
      • Positioning - differentiation vs competitors
      • Personas - buyer profile development
      • Channels - marketing channel prioritization"

3. Marketer selects positioning

4. System triggers discovery gate
   → "Before I write positioning, I need to understand:
      1. What problem does Acme solve that competitors don't?
      2. What can you claim that BambooHR cannot?
      3. Who specifically chooses you over them—and why?"

5. Marketer answers discovery questions

6. System generates positioning framework
   → "POSITIONING: Acme Corp

      FOR: SMB HR managers (10-200 employees)
      WHO: Need HR software without IT overhead
      ACME IS: The simplest HR platform for small teams
      THAT: Works out of the box, no implementation required
      UNLIKE: BambooHR (complex setup) and Gusto (payroll-first)
      BECAUSE: We built specifically for non-technical HR teams

      PROOF POINTS:
      • 15-minute setup vs industry average 2 weeks
      • No IT department required
      • Transparent pricing (no 'contact sales')

      MESSAGING ANGLE:
      'HR software that doesn't need an IT team to run it'"

7. Marketer refines or approves positioning
```

### Discovery Gate Questions

The system asks before generating strategy:

| Question | Purpose |
|----------|---------|
| What problem do you solve? | Core value proposition |
| What happens if they don't solve it? | Pain amplification |
| What can you claim competitors can't? | Differentiation |
| Who chooses you and why? | Actual buyer motivation |

### Postconditions (Success)

- Clear positioning statement
- Proof points identified
- Messaging angle defined
- Can inform all content and campaigns

---

## UC-022: Build Buyer Personas

### Overview

| Attribute | Value |
|-----------|-------|
| **Actor** | Marketing Professional |
| **Goal** | Define target buyer profiles |
| **Frequency** | Once per brand, periodic refresh |
| **Priority** | Medium - strategic workflow |

### Business Context

Personas sharpen all marketing decisions: messaging, channel selection, content topics. Vague personas ("businesses who need our product") lead to generic marketing. Specific personas drive specific, effective campaigns.

### Preconditions

- Brand is active
- Marketer has some knowledge of actual customers (or willing to state assumptions)

### Trigger

Marketer selects "Personas" from `/marketing-strategy` or asks "who is our audience?"

### Main Success Scenario

```
1. Marketer requests persona development
   → "help me define our target audience" or selects Personas option

2. System triggers evidence gate
   → "Before I create personas, I need to understand the evidence:

      Where does your customer knowledge come from?
      • Customer interviews (how many?)
      • Sales call patterns
      • Support ticket themes
      • Analytics data
      • Assumptions (specify)"

3. Marketer provides evidence source
   → "We've done 15 customer interviews and have sales call notes"

4. System asks persona discovery questions (one at a time)
   → "Who typically makes the buying decision? (Title, role)"
   → "What's their company size and industry?"
   → "What's their #1 pain point that leads them to us?"
   → "What happens if they don't solve this pain?"
   → "How do they find solutions like yours?"

5. Marketer answers each question

6. System generates persona
   → "👤 PERSONA: Sarah Chen, HR Director

      PROFILE:
      • Role: HR Director / Head of People
      • Company: 50-150 employee startup/scaleup
      • Reports to: CEO/COO
      • Budget authority: Yes for HR tools

      PAIN POINTS (ranked):
      1. Onboarding takes 2+ weeks, wastes everyone's time
      2. Compliance tracking is manual spreadsheets
      3. Employee data scattered across 5 tools

      GOALS:
      1. Get new hires productive in < 1 week
      2. Single source of truth for people data

      DECISION PROCESS:
      • Researches via: G2, peer recommendations, LinkedIn
      • Influenced by: HR communities, SHRM content
      • Timeline: 1-3 months from pain to purchase

      MESSAGING:
      ✅ DO say: 'Set up in 15 minutes, no IT needed'
      ❌ DON'T say: 'Enterprise-grade platform'

      Evidence Source: 15 customer interviews + sales calls"

7. Marketer refines or approves persona
```

### Alternative Flows

**2a. No evidence available**
```
2a1. Marketer admits "mostly assumptions"
2a2. System proceeds with clear caveat:
     → "I'll create a hypothesis persona. Mark assumptions to validate."
2a3. Output includes: "⚠️ ASSUMPTION - validate with customer research"
```

**6a. Multiple personas needed**
```
6a1. System asks: "Is there a distinctly different buyer type?"
6a2. If yes, repeat discovery for secondary persona
6a3. Maximum 3 personas enforced:
     → "More than 3 means you haven't prioritized. Which ONE drives most revenue?"
```

### Exception Flows

**4a. Generic answers**
```
4a1. Marketer gives vague answer: "Businesses that need HR software"
4a2. System pushes for specifics:
     → "Too broad. What SIZE business? What ROLE makes the decision?"
4a3. Repeat until specific
```

### Postconditions (Success)

- 1-3 specific, evidence-based personas
- Pain points ranked and quantified
- Messaging dos/don'ts defined
- Evidence source documented

---

## UC-023: Plan Channel Strategy

### Overview

| Attribute | Value |
|-----------|-------|
| **Actor** | Marketing Professional |
| **Goal** | Prioritize marketing channels |
| **Frequency** | Quarterly review |
| **Priority** | Medium - strategic workflow |

### Business Context

Most marketing fails not from wrong channels but from spreading too thin. The "optimize before expand" principle: fix what you have before adding more.

### Preconditions

- Brand is active
- Marketer knows current marketing activities (or willing to audit)

### Trigger

Marketer selects "Channels" from `/marketing-strategy` or asks "what channels should I focus on?"

### Main Success Scenario

```
1. Marketer requests channel guidance
   → "should I try LinkedIn ads?" or selects Channels option

2. System triggers audit gate (NON-NEGOTIABLE)
   → "Before discussing new channels, let's audit what you're doing now.

      What marketing channels are you currently investing in?
      • Google Ads?
      • Meta Ads (Facebook/Instagram)?
      • LinkedIn Ads?
      • SEO/Content?
      • Email marketing?
      • Social media (organic)?
      • Other?"

3. Marketer lists current channels
   → "Google Ads, SEO, and some LinkedIn organic"

4. System assesses each channel
   → "For each channel, what's the performance?

      Google Ads:
      • Profitable (making money)?
      • Break-even (covering costs)?
      • Unprofitable (losing money)?
      • Unknown (not tracking)?"

5. Marketer provides performance for each
   → "Google Ads: profitable. SEO: unknown. LinkedIn: break-even"

6. System applies gate logic
   → "📊 CHANNEL AUDIT

      ┌─────────────┬──────────┬─────────────┬──────────┐
      │   Channel   │  Status  │ Performance │  Action  │
      ├─────────────┼──────────┼─────────────┼──────────┤
      │ Google Ads  │ Active   │ Profitable  │ 📈 SCALE │
      │ SEO         │ Active   │ Unknown     │ 📊 TRACK │
      │ LinkedIn    │ Active   │ Break-even  │ 🔧 OPTIMIZE │
      └─────────────┴──────────┴─────────────┴──────────┘

      ⛔ GATE BLOCKED: Can't recommend new channels yet.

      RECOMMENDATIONS:

      🥇 Priority 1: SEO
      Action: SET UP TRACKING
      Why: Can't optimize what you can't measure
      Next step: Connect Google Search Console (15 min)

      🥈 Priority 2: LinkedIn
      Action: OPTIMIZE BEFORE EXPANDING
      Why: Break-even means there's improvement potential
      Next step: Audit top-performing posts, double down on format

      🥉 Priority 3: Google Ads
      Action: SCALE CAREFULLY
      Why: Already profitable, room to grow
      Next step: Increase budget 20%, monitor ROAS

      RE: Your LinkedIn Ads question
      Let's get LinkedIn organic profitable first. Adding paid on top
      of break-even organic often loses money."

7. Marketer follows prioritized recommendations
```

### Alternative Flows

**5a. All channels profitable**
```
5a1. System detects all channels performing well
5a2. Gate passes:
     → "✅ GATE PASSED: All channels healthy!

        Now we can discuss:
        1. Scaling existing channels (lower risk)
        2. Testing new channels (higher risk, higher reward)

        Given your B2B SaaS product, I'd suggest:
        • Scale: Google Ads (proven profitable)
        • Test: LinkedIn Ads (reaches your buyer persona)"
```

**2a. No current marketing**
```
2a1. Marketer has no active channels
2a2. System provides starting recommendation:
     → "Starting from zero. For B2B SaaS, I recommend:
        1. SEO/Content (compounds over time, low CAC)
        2. One paid channel to test messaging

        Which resonates more: Google Ads (intent) or LinkedIn (targeting)?"
```

### Exception Flows

**6a. Marketer insists on new channel**
```
6a1. Marketer pushes: "I really want to try TikTok"
6a2. System maintains gate but offers path:
     → "I hear you. TikTok could work, but with SEO untracked
        and LinkedIn at break-even, adding TikTok means:
        • More budget spread thin
        • More channels to manage
        • Unknown ROI on all three

        Proposal: Fix tracking on SEO (15 min). If LinkedIn
        doesn't improve in 2 weeks, pause it and test TikTok
        with that budget instead."
```

### Postconditions (Success)

- Current channels audited with performance status
- Clear prioritization: SCALE / OPTIMIZE / TRACK / PAUSE
- Next specific action identified for each
- Gate status documented (passed/blocked)

---

## UC-024: Create Marketing Playbook

### Overview

| Attribute | Value |
|-----------|-------|
| **Actor** | Marketing Professional |
| **Goal** | Get actionable 90-day plan |
| **Frequency** | After strategy work complete |
| **Priority** | Medium - action planning |

### Business Context

Strategy without action is useless. The playbook turns positioning, personas, and channel decisions into specific, time-bound tasks that drive results.

### Preconditions

- At least one strategy component complete (positioning, personas, or channels)
- Brand is active

### Trigger

Marketer asks "what should I do first?" or "create a playbook"

### Main Success Scenario

```
1. Marketer requests action plan
   → "what should I do first?" or "create a marketing playbook"

2. System reviews completed strategy work
   → Checks for positioning, personas, channel audit

3. System confirms strategy foundation
   → "Building playbook based on:
      ✅ Positioning: 'Simplest HR platform for small teams'
      ✅ Primary persona: Sarah Chen, HR Director
      ✅ Channel focus: Scale Google Ads, fix SEO tracking"

4. System generates prioritized playbook
   → "📋 PLAYBOOK: Acme Corp

      WEEK 1-2: QUICK WINS

      □ (15 min) Connect Google Search Console to track SEO
      □ (20 min) Audit top 5 Google Ads by spend, pause losers
      □ (10 min) Update homepage headline to positioning statement
      □ (30 min) Create 'BambooHR Alternative' landing page brief

      WEEK 3-4: FOUNDATION

      □ (2 hrs) Write 'BambooHR Alternative' comparison page
      □ (1 hr) Set up Google Ads conversion tracking properly
      □ (30 min) Create 3 LinkedIn posts testing positioning angles
      □ (1 hr) Document Sarah Chen persona for team alignment

      MONTH 2: GROWTH

      □ Publish 2 comparison pages (Gusto, Zenefits)
      □ Increase Google Ads budget 20% if ROAS holds
      □ Launch retargeting campaign for site visitors
      □ Create case study from recent customer win

      MONTH 3: SCALE

      □ Publish 4 more SEO pages from keyword research
      □ Test LinkedIn Ads with proven organic content
      □ Build email nurture sequence for leads
      □ Review and refresh positioning if needed

      PRIORITY FOCUS: SEO + Google Ads
      Based on: Channel audit showing these as strongest levers

      NEXT ACTION: Connect Google Search Console (15 min)"

5. Marketer executes playbook tasks
```

### Alternative Flows

**2a. No strategy work completed**
```
2a1. System detects missing strategy foundation
2a2. System guides to prerequisites:
     → "Before creating a playbook, I need strategic direction.

        Let's start with one of these:
        • Positioning (10-15 min) - defines your angle
        • Personas (15-20 min) - defines your audience
        • Channel audit (10 min) - defines your focus

        Which would be most valuable right now?"
```

**4a. Partial strategy available**
```
4a1. Only positioning complete (no personas/channels)
4a2. System creates focused playbook:
     → "Building playbook from positioning only.

        Note: Adding personas and channel audit would make
        this more targeted. For now, focusing on messaging tasks."
```

### Postconditions (Success)

- 90-day playbook with weekly breakdown
- Each task is specific (5-30 min, single action)
- Tasks linked to strategy decisions
- Clear "next action" identified

---

## Quality Checklist

For each use case:

- [ ] Goal is clear and singular
- [ ] Actor is specific (not generic "user")
- [ ] Main flow achieves the goal
- [ ] Alternative paths documented
- [ ] Exceptions handled gracefully
- [ ] Preconditions are testable
- [ ] Postconditions are verifiable
- [ ] Developer can implement from this
- [ ] QA can write tests from this
- [ ] Stakeholders understand the workflow

---

## Related Documentation

- [Getting Started Tutorial](tutorials/getting-started.md)
- [Commands Reference](reference/commands.md)
- [Architecture Explanation](explanation/architecture.md)
