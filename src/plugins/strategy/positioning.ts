/**
 * Positioning Module
 * Build brand positioning statements and messaging frameworks
 */

import { getActiveBrand, loadBrandInstructions, updateBrand } from '../../core/brand/brand-manager';
import { PositioningStatement, Persona } from '../../types';

// ============================================
// POSITIONING PROMPT
// ============================================

export const POSITIONING_PROMPT = `
## Positioning & Messaging

Develop brand positioning through systematic discovery, not assumptions.

---

## The Iron Law

\`\`\`
NO POSITIONING WITHOUT DISCOVERY FIRST
\`\`\`

If you haven't gathered answers to discovery questions, you CANNOT write positioning.
Positioning based on assumptions = meaningless statements.

---

## Discovery Gate (Mandatory)

BEFORE writing ANY positioning statement:

### Phase 1: Understand the Brand (MUST complete)

Ask these questions ONE AT A TIME. Do not proceed until answered:

1. "What does [brand] sell? (specific product/service, not category)"
2. "Who buys it? (specific role/persona, not 'businesses')"
3. "What problem does it solve for them?"
4. "What happens if they don't solve this problem?"

### Phase 2: Understand the Market (MUST complete)

5. "Who are your main competitors? (name 2-3)"
6. "Why do customers choose you over them?"
7. "What can you claim that competitors cannot?"

### Phase 3: Validate Differentiation (MUST complete)

8. "Is this differentiator: Believable? Provable? Sustainable?"

**IF any answer is "I don't know"**: That's a gap to fill, not to assume.

---

## Positioning Statement Format (exact structure)

\`\`\`
📍 POSITIONING STATEMENT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For **[specific target audience]**
who **[specific need/problem]**,

**[Product name]** is a **[category]**
that **[key benefit - specific, not generic]**.

Unlike **[specific competitor or alternative]**,
we **[specific differentiator - provable claim]**.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Tagline:** "[Short, memorable version]"

**Elevator Pitch (30 seconds):**
[Full paragraph version for verbal delivery]

**Discovery Sources:**
- Target audience: [How we know this]
- Differentiator: [Evidence/proof point]
- Competitor comparison: [Based on what data]
\`\`\`

---

## Quality Gates for Each Element

| Element | Good | Bad (Reject) |
|---------|------|--------------|
| **Target Audience** | "Engineering managers at B2B SaaS companies with 50-200 employees" | "Businesses" / "Everyone" |
| **Need** | "Need to ship features faster without breaking production" | "Need better tools" |
| **Category** | "CI/CD platform" | "Software solution" |
| **Benefit** | "Reduces deployment time by 60%" | "Improves productivity" |
| **Differentiator** | "Only platform with automatic rollback based on error rates" | "Better than competitors" |

If ANY element is vague: Rewrite or ask for clarification.

---

## Red Flags - STOP and Ask

If you catch yourself writing:
- "Innovative" / "Leading" / "Best-in-class" → STOP: These are empty claims
- "Businesses of all sizes" → STOP: Be specific about who
- "Save time and money" → STOP: Generic benefit, be specific
- "Unlike traditional solutions" → STOP: Name the actual competitor
- "We provide quality" → STOP: What specific quality? Prove it.

**When you see a red flag: Ask the user for specifics.**

---

## Common Hallucination Patterns

| Tempted to Write | Reality Check |
|------------------|---------------|
| "Unlike competitors, we're faster" | Which competitors? Faster at what? By how much? |
| "For businesses who need growth" | Every business needs growth. Be specific. |
| "Our innovative platform" | "Innovative" is meaningless. What does it actually do differently? |
| "Best-in-class solution" | Says who? Based on what? |

---

## Verification Before Completion

BEFORE presenting positioning:

1. ✅ Did I complete discovery questions?
2. ✅ Is target audience specific (not "businesses")?
3. ✅ Is the benefit concrete (not "saves time")?
4. ✅ Is the differentiator provable?
5. ✅ Did I name a specific competitor/alternative?
6. ✅ Did I document discovery sources?

If NO to any: Go back and fix.

---

## Natural Language Triggers

- "help me position"
- "positioning statement"
- "how should we position"
- "what makes us different"
- "create messaging"
`;

// ============================================
// POSITIONING FUNCTIONS
// ============================================

export interface PositioningInput {
  targetAudience: string;
  need: string;
  productCategory: string;
  keyBenefit: string;
  competitor?: string;
  differentiator: string;
}

/**
 * Build a positioning statement
 */
export function buildPositioningStatement(input: PositioningInput): PositioningStatement {
  return {
    for: input.targetAudience,
    who: input.need,
    product: input.productCategory,
    benefit: input.keyBenefit,
    unlike: input.competitor || 'traditional alternatives',
    differentiator: input.differentiator,
    tagline: generateTagline(input),
  };
}

/**
 * Generate tagline options
 */
function generateTagline(input: PositioningInput): string {
  // Simple tagline based on benefit + differentiator
  const words = input.keyBenefit.split(' ').slice(0, 4);
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * Format positioning statement
 */
export function formatPositioningStatement(statement: PositioningStatement): string {
  let output = `📍 POSITIONING STATEMENT\n\n`;
  output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  output += `For **${statement.for}**\n`;
  output += `who **${statement.who}**,\n\n`;
  output += `**[Product]** is a **${statement.product}**\n`;
  output += `that **${statement.benefit}**.\n\n`;
  output += `Unlike **${statement.unlike}**,\n`;
  output += `we **${statement.differentiator}**.\n\n`;

  output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (statement.tagline) {
    output += `💬 Tagline: "${statement.tagline}"\n`;
  }

  return output;
}

/**
 * Save positioning to brand
 */
export function savePositioning(
  brandId: string,
  positioning: PositioningStatement
): boolean {
  const brand = getActiveBrand();
  if (!brand || brand.id !== brandId) return false;

  try {
    updateBrand(brandId, {
      strategy: {
        ...brand.strategy,
        generatedDate: brand.strategy?.generatedDate || new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0],
        positioning,
        personas: brand.strategy?.personas || [],
        channels: brand.strategy?.channels || { avoid: [] },
        contentPillars: brand.strategy?.contentPillars || [],
        playbook: brand.strategy?.playbook || { generated: '', tasks: [] },
      },
    });
    return true;
  } catch {
    return false;
  }
}

// ============================================
// PERSONA BUILDER
// ============================================

export const PERSONA_PROMPT = `
## Persona Development

Create buyer personas based on evidence, not stereotypes.

---

## The Iron Law

\`\`\`
NO PERSONA WITHOUT EVIDENCE SOURCE
\`\`\`

If you don't know WHERE the persona data comes from, you're inventing a stereotype.
Personas from assumptions = useless for targeting.

---

## Evidence Source Gate

BEFORE creating ANY persona:

1. **IDENTIFY evidence source**:
   - Customer interviews? (How many? When?)
   - Sales call data? (What patterns?)
   - Analytics data? (What signals?)
   - Brand context only? (State this limitation)
   - Pure assumption? (STOP - gather data first)

2. **DECLARE confidence level**:
   | Source | Confidence | Validity |
   |--------|------------|----------|
   | 10+ customer interviews | High | Use confidently |
   | Sales/support patterns | Medium | Use with caveats |
   | Brand context inference | Low | State assumptions |
   | No data (guessing) | Invalid | Don't create persona |

3. **STATE what you DON'T know**: "This persona assumes X, which we haven't validated."

---

## Persona Structure (exact format)

\`\`\`
👤 PERSONA: [Specific Name, not generic like "Marketing Mary"]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Profile
- **Role:** [Specific title, not just "Manager"]
- **Company:** [Size range + industry]
- **Reports to:** [Who they answer to]
- **Team size:** [If relevant]

## Pain Points (ranked by severity)
1. [Most painful - specific, not generic]
2. [Second most painful]
3. [Third]

## Goals (ranked by priority)
1. [Primary goal - specific outcome, not "be successful"]
2. [Secondary goal]
3. [Tertiary goal]

## Decision Process
- **Researches via:** [Where they look for solutions]
- **Influenced by:** [Who/what affects their decisions]
- **Budget authority:** [Yes/No/Partial]
- **Timeline:** [How long their buying cycle is]

## Messaging Guidelines

✅ **DO say:**
- [Specific message that resonates - based on evidence]
- [Another specific message]

❌ **DON'T say:**
- [What turns them off - based on evidence]
- [Another thing to avoid]

## Evidence Sources
- Pain points based on: [source]
- Goals based on: [source]
- Decision process based on: [source]
- Messaging tested via: [source or "not yet tested"]
\`\`\`

---

## Quality Gates for Persona Elements

| Element | Good | Bad (Reject) |
|---------|------|--------------|
| **Role** | "VP of Engineering at Series B SaaS" | "Technical person" |
| **Pain Point** | "Spends 10+ hours/week in status meetings" | "Too busy" |
| **Goal** | "Ship 2x more features without adding headcount" | "Be more productive" |
| **Research** | "Reads Hacker News, attends KubeCon" | "Uses the internet" |
| **Messaging** | "Mention: 'We reduced deploy time by 60%'" | "Talk about benefits" |

---

## Red Flags - STOP

If you catch yourself writing:
- Generic pain points like "too busy" or "needs efficiency" → STOP: Be specific
- Stereotypical names like "Marketing Mary" or "Developer Dave" → STOP: Use real names
- "They want quality" → STOP: Everyone wants quality, what specifically?
- Behaviors without evidence → STOP: How do you know they do this?

**When you see a red flag: Ask for evidence or state assumption.**

---

## Common Persona Hallucination Patterns

| Tempted to Write | Reality Check |
|------------------|---------------|
| "Busy professional who values efficiency" | Describes everyone. What SPECIFIC time sink do they have? |
| "Tech-savvy millennial" | Demographic stereotype, not persona. What do they actually do? |
| "Looking for best-in-class solutions" | Meaningless. What specific features do they evaluate? |
| "Values ROI" | Everyone values ROI. What specific metrics do THEY measure? |

---

## Persona Limit

Create **maximum 3 personas** for any brand:
- Primary (70%+ of customers)
- Secondary (20% of customers)
- Tertiary (10% - only if distinct)

More than 3 = you haven't prioritized. Ask: "Which ONE persona drives most revenue?"

---

## Verification Before Completion

BEFORE presenting persona:

1. ✅ Did I state the evidence source?
2. ✅ Is the role specific (not "manager")?
3. ✅ Are pain points specific (not "too busy")?
4. ✅ Are goals measurable outcomes?
5. ✅ Is messaging actionable (not "talk about benefits")?
6. ✅ Did I limit to 3 or fewer personas?

If NO to any: Fix before presenting.

---

## Natural Language Triggers

- "create persona"
- "who is our audience"
- "buyer persona"
- "target audience"
`;

export interface PersonaInput {
  name: string;
  role: string;
  companySize?: string;
  painPoints: string[];
  goals: string[];
  contentPreferences?: string[];
}

/**
 * Build a persona
 */
export function buildPersona(input: PersonaInput): Persona {
  return {
    id: input.name.toLowerCase().replace(/\s+/g, '-'),
    name: input.name,
    role: input.role,
    companySize: input.companySize,
    painPoints: input.painPoints,
    goals: input.goals,
    contentTopics: input.contentPreferences || suggestContentTopics(input),
    messaging: {
      do: generateMessagingDos(input),
      avoid: generateMessagingAvoids(input),
    },
  };
}

/**
 * Suggest content topics based on persona
 */
function suggestContentTopics(input: PersonaInput): string[] {
  const topics: string[] = [];

  // Based on pain points
  for (const pain of input.painPoints.slice(0, 2)) {
    topics.push(`How to overcome ${pain.toLowerCase()}`);
  }

  // Based on goals
  for (const goal of input.goals.slice(0, 2)) {
    topics.push(`Guide to achieving ${goal.toLowerCase()}`);
  }

  return topics;
}

/**
 * Generate messaging dos
 */
function generateMessagingDos(input: PersonaInput): string[] {
  const dos: string[] = [];

  dos.push(`Address their main pain: ${input.painPoints[0]}`);
  dos.push(`Connect to their goal: ${input.goals[0]}`);
  dos.push(`Speak to their role as ${input.role}`);

  if (input.companySize) {
    dos.push(`Reference ${input.companySize} company challenges`);
  }

  return dos;
}

/**
 * Generate messaging avoids
 */
function generateMessagingAvoids(input: PersonaInput): string[] {
  return [
    'Generic benefits that don\'t address their specific situation',
    'Technical jargon they don\'t use',
    'Promises that seem unrealistic',
  ];
}

/**
 * Format persona for display
 */
export function formatPersona(persona: Persona): string {
  let output = `👤 PERSONA: ${persona.name}\n\n`;
  output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  output += `📋 PROFILE\n`;
  output += `• Role: ${persona.role}\n`;
  if (persona.companySize) {
    output += `• Company Size: ${persona.companySize}\n`;
  }
  output += `\n`;

  output += `😫 PAIN POINTS\n`;
  for (const pain of persona.painPoints) {
    output += `• ${pain}\n`;
  }
  output += `\n`;

  output += `🎯 GOALS\n`;
  for (const goal of persona.goals) {
    output += `• ${goal}\n`;
  }
  output += `\n`;

  output += `📝 CONTENT TOPICS\n`;
  for (const topic of persona.contentTopics) {
    output += `• ${topic}\n`;
  }
  output += `\n`;

  output += `💬 MESSAGING\n`;
  output += `✅ Do:\n`;
  for (const d of persona.messaging.do) {
    output += `  • ${d}\n`;
  }
  output += `❌ Avoid:\n`;
  for (const a of persona.messaging.avoid) {
    output += `  • ${a}\n`;
  }

  return output;
}
