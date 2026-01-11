# Commands Reference

All available commands and their behavior.

---

## Brand Commands

### `/brand`

Show active brand status.

```
/brand
```

**Output:** Brand name, website, industry, competitors, recent notes.

---

### `/brand list`

List all brands.

```
/brand list
```

**Output:** Table with brand name, industry, active status.

---

### `/brand new`

Create a new brand through guided flow.

```
/brand new
```

**Flow:**
1. Name and website
2. Product/service description
3. Industry and audience
4. Competitors (optional)

**Result:** Brand created and set as active.

---

### `/brand switch <name>`

Switch to a different brand.

```
/brand switch acme
```

**Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| name | Yes | Brand name (case-insensitive) |

**Result:** Brand loaded, context available for subsequent requests.

---

### `/brand info`

Show detailed brand profile.

```
/brand info
```

**Output:** Full brand data including:
- Basic info (website, created date)
- Business context (industry, product, model)
- Audience details
- Competitor list with notes
- SEO strategy if defined
- Historical notes

---

### `/brand update`

Update brand information.

```
/brand update
```

**Flow:** Claude asks what to update, then guides through changes.

---

### `/brand add-note`

Add a note to the brand.

```
/brand add-note
```

**Flow:** Claude prompts for note content, adds with timestamp.

---

## Skills

### `/marketing-seo`

Load SEO skill for keyword research and content planning.

```
/marketing-seo
```

**Capabilities:**
- Keyword analysis
- Content brief generation
- Competitor keyword research
- Search intent classification

---

### `/marketing-strategy`

Load strategy skill for positioning and planning.

```
/marketing-strategy
```

**Capabilities:**
- Positioning statements
- Persona development
- Channel strategy
- Competitive differentiation

---

## Natural Language Triggers

These phrases trigger brand actions without commands:

| Phrase | Action |
|--------|--------|
| "I'm working on [name]" | Switch to brand |
| "working on [name]" | Switch to brand |
| "switch to [name]" | Switch to brand |
| "new client [name]" | Create brand |
| "new brand [name]" | Create brand |

---

## File Locations

| Data | Location |
|------|----------|
| Brand files | `~/.claude-marketing/brands/<name>.json` |
| Active state | `~/.claude-marketing/state.json` |
| Handoffs | `~/.claude-marketing/handoffs/` |
