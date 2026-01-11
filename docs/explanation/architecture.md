# Architecture

How the plugin is built and why.

---

## The Problem It Solves

Claude Code has no memory between sessions. Every time you ask for marketing advice, you start from zero. You re-explain your client, their industry, their competitors.

The plugin adds a memory layer specific to marketing work.

---

## Components

```
┌─────────────────────────────────────────────────────┐
│                   Claude Code                        │
├─────────────────────────────────────────────────────┤
│  Hooks                    │  Skills                  │
│  ├── session-start.mjs    │  ├── /brand             │
│  ├── brand-detect.mjs     │  ├── /marketing-seo     │
│  └── session-end.mjs      │  └── /marketing-strategy│
├─────────────────────────────────────────────────────┤
│                   Data Layer                         │
│  ~/.claude-marketing/                                │
│  ├── brands/           (brand JSON files)           │
│  ├── state.json        (active brand)               │
│  └── handoffs/         (session continuity)         │
└─────────────────────────────────────────────────────┘
```

---

## Hooks

Hooks run automatically at specific events.

### session-start.mjs

**When:** Claude Code starts

**What it does:**
1. Reads `state.json` to find active brand
2. Loads brand JSON if exists
3. Injects brand context into session

**Why:** So you don't have to run `/brand` manually every session.

### brand-detect.mjs

**When:** User submits a prompt

**What it does:**
1. Scans prompt for brand-related keywords
2. Detects phrases like "working on [name]"
3. Triggers brand switch if detected

**Why:** Natural language brand switching without commands.

### session-end.mjs

**When:** Claude Code session ends

**What it does:**
1. Saves any pending state
2. Updates `last_session` timestamp

**Why:** Session continuity.

---

## Skills

Skills are loaded on-demand via `/skill` commands.

### /brand

Brand management. CRUD operations for client profiles.

### /marketing-seo

SEO intelligence. Keyword analysis, content briefs, search intent.

### /marketing-strategy

Strategy development. Positioning, personas, channel planning.

---

## Data Storage

All data is local JSON files. No external servers.

**Why JSON over YAML?**
- Native to JavaScript (no dependencies)
- Easier to parse in hooks
- More portable

**Why local storage?**
- Privacy: Client data stays on your machine
- Speed: No network latency
- Control: You can edit files directly

---

## MCP Integration

The plugin detects MCP tools at runtime:

```
Check available tools
├── Contains "ahrefs_" → Use for volume/KD
├── Contains "semrush_" → Use for competitors
├── Contains "gsc_" → Use for rankings
└── None → Reasoning-based analysis
```

No configuration needed. Detection is automatic.

**Why this approach?**
- Works without any SEO subscriptions
- Upgrades automatically when tools are available
- No broken features for users without MCP

---

## Design Principles

### Progressive Enhancement

Core features work without setup. MCP tools enhance, not enable.

### Local First

Your data, your machine. No accounts, no sync, no vendor lock-in.

### Natural Language

Commands exist for power users. Natural language works for everyone.

### Discovery Gates

Claude asks clarifying questions before generic advice. Specific input → specific output.

---

## Related

- [Brand schema reference](../reference/brand-schema.md)
- [How MCP setup works](../how-to/mcp-setup.md)
