# Brand JSON Schema

Structure of brand data files stored in `~/.claude-marketing/brands/`.

---

## File Location

```
~/.claude-marketing/brands/<brand-id>.json
```

Brand ID is generated from the name: lowercase, hyphens for spaces, special characters removed.

Example: "Acme Corp" → `acme-corp.json`

---

## Schema

```json
{
  "id": "acme-corp",
  "name": "Acme Corp",
  "website": "https://acme.com",
  "created": "2025-01-11",
  "last_session": "2025-01-11",
  "industry": "B2B SaaS",
  "product": "HR management software for small businesses",
  "model": "B2B SaaS",
  "stage": "Growth",
  "audience": "SMB HR managers, 10-200 employees",
  "competitors": [
    "bamboohr.com",
    "gusto.com",
    "zenefits.com"
  ],
  "usp": [
    "Simple setup, no IT required",
    "Transparent pricing"
  ],
  "seo_strategy": {
    "primary_focus": "Product-led content",
    "content_pillars": [
      "HR software guides",
      "Competitor comparisons",
      "SMB HR best practices"
    ],
    "quick_wins": [
      "bamboohr alternative",
      "hr software pricing"
    ]
  },
  "notes": [
    "2025-01-11: Initial setup. Focus on competitor comparison content.",
    "2025-01-11: CEO wants to emphasize ease of use angle."
  ]
}
```

---

## Field Reference

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (auto-generated from name) |
| `name` | string | Display name |
| `website` | string | Primary website URL |
| `created` | string | ISO date of creation |

### Business Context

| Field | Type | Description |
|-------|------|-------------|
| `industry` | string | Industry category |
| `product` | string | What the brand sells |
| `model` | string | Business model (B2B, B2C, etc.) |
| `stage` | string | Company stage (Pre-launch, Growth, etc.) |
| `audience` | string | Target audience description |

### Competitive Context

| Field | Type | Description |
|-------|------|-------------|
| `competitors` | string[] | List of competitor domains |
| `usp` | string[] | Unique selling propositions |

### SEO Strategy

| Field | Type | Description |
|-------|------|-------------|
| `seo_strategy.primary_focus` | string | Main SEO approach |
| `seo_strategy.content_pillars` | string[] | Core content themes |
| `seo_strategy.quick_wins` | string[] | Low-effort high-impact keywords |

### Metadata

| Field | Type | Description |
|-------|------|-------------|
| `last_session` | string | ISO date of last activity |
| `notes` | string[] | Timestamped notes |

---

## State File

Active brand tracked in `~/.claude-marketing/state.json`:

```json
{
  "activeBrand": "acme-corp"
}
```

---

## Manual Editing

Brand files are plain JSON. You can edit them directly:

```bash
# View brand
cat ~/.claude-marketing/brands/acme-corp.json | jq .

# Edit brand
code ~/.claude-marketing/brands/acme-corp.json
```

Changes take effect on next `/brand` command.

---

## Related

- [Commands reference](commands.md)
- [How to manage clients](../how-to/manage-clients.md)
