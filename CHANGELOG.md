# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-11

### Added

#### Brand Management
- `/brand` - Show active brand status
- `/brand list` - List all brands with table display
- `/brand new` - Guided brand creation flow
- `/brand switch <name>` - Switch between brands
- `/brand info` - Detailed brand profile view
- `/brand update` - Update brand information
- `/brand add-note` - Add notes to brand
- Natural language detection ("I'm working on [brand]", "new client [name]")
- Session persistence - active brand persists across Claude Code restarts
- JSON storage in `~/.claude-marketing/brands/`

#### SEO & Content (`/marketing-seo`)
- Keyword analysis with intent classification
- Content brief generation with outlines
- Featured snippet targeting
- Data source declaration (reasoning vs MCP)
- Discovery gates - asks clarifying questions before advising
- Brand context integration in all recommendations

#### Strategy (`/marketing-strategy`)
- Positioning analysis with discovery questions
- Persona generation
- Channel strategy recommendations
- 90-day playbook creation
- Competitive differentiation guidance

#### MCP Integration
- Automatic detection of Ahrefs, SEMrush, GSC MCP tools
- Hybrid mode: reasoning-based by default, MCP-enhanced when available
- Confidence level indicators based on data source

#### Installation
- One-click `install.sh` with automatic hook building
- Settings.json backup before modification
- Safe error handling (aborts on parse errors, prevents data loss)
- Clean `uninstall.sh` that preserves user data

#### Developer Experience
- 84 passing tests
- TypeScript source for hooks
- Comprehensive documentation in `/docs`

### Technical Details

- Hooks: `session-start.mjs`, `session-end.mjs`, `brand-detect.mjs`
- Skills: `/brand`, `/marketing-seo`, `/marketing-strategy`
- Storage: JSON files in `~/.claude-marketing/`
- State: `state.json` tracks active brand

---

## [Unreleased]

### Planned
- Page optimization commands
- Automated competitor monitoring
- Content calendar generation
- Claude Code Marketplace listing
