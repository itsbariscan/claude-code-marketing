# How to Manage Multiple Clients

Switch between client brands without losing context.

---

## List Your Brands

```
/brand list
```

Output:

```
📁 Your Brands:
┌─────────────┬────────────────────┬──────────┐
│    Brand    │      Industry      │  Status  │
├─────────────┼────────────────────┼──────────┤
│ Acme Corp   │ B2B SaaS           │ ← active │
│ TechStartup │ Consumer Tech      │          │
│ LocalShop   │ E-commerce         │          │
└─────────────┴────────────────────┴──────────┘
```

---

## Switch Brands

### Using Commands

```
/brand switch techstartup
```

### Using Natural Language

```
You: I'm working on TechStartup now
Claude: Switched to TechStartup. What would you like to work on?
```

Both methods work. Natural language is detected automatically.

---

## Verify Active Brand

```
/brand
```

Shows current brand with full context:

```
📁 BRAND: TechStartup ← active

🌐 Website: https://techstartup.io
📅 Last session: 2025-01-11

Business:
- Industry: Consumer Tech
- Product: Productivity app
- Audience: Remote workers

Competitors:
- notion.so
- todoist.com
```

---

## Add a New Client

```
/brand new
```

Follow the guided flow. New brand becomes active automatically.

---

## Common Issues

**Brand not found when switching**

Check the exact name with `/brand list`. Names are case-insensitive but must match.

**Context not loading**

Run `/brand info` to verify the brand file exists. If empty, recreate with `/brand new`.

---

## Related

- [Commands reference](../reference/commands.md)
- [Brand JSON schema](../reference/brand-schema.md)
