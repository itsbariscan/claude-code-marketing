# How to Connect MCP Tools

Enhance keyword analysis with live data from Ahrefs, SEMrush, or Google Search Console.

---

## Before You Start

The plugin works without MCP tools. You get reasoning-based analysis:

```
Data Source: Reasoning-based
Confidence: Medium
```

MCP tools add real metrics:

```
Data Source: Ahrefs MCP
Confidence: High
```

**You need:** Active subscriptions to the SEO tools you want to connect.

---

## Google Search Console (Free)

GSC provides your actual ranking data.

### 1. Add the MCP server

```bash
claude mcp add gsc
```

### 2. Authenticate

Follow the OAuth flow when prompted. Grant read access to your Search Console property.

### 3. Verify

```
You: what keywords am I ranking for?
```

Claude should show your actual positions, clicks, and impressions.

---

## Ahrefs

Ahrefs provides volume, keyword difficulty, and backlink data.

### 1. Get API access

Requires Ahrefs subscription with API access (check your plan).

### 2. Add the MCP server

```bash
claude mcp add ahrefs
```

### 3. Configure API key

When prompted, enter your Ahrefs API key.

### 4. Verify

```
You: analyze keyword difficulty for "hr software small business"
```

Response should include exact volume and KD score.

---

## SEMrush

SEMrush provides competitor keyword data.

### 1. Get API access

Requires SEMrush subscription with API access.

### 2. Add the MCP server

```bash
claude mcp add semrush https://mcp.semrush.com/v1/mcp -t http
```

### 3. Configure credentials

Enter your SEMrush API credentials when prompted.

### 4. Verify

```
You: what keywords is bamboohr.com ranking for?
```

Response should show competitor keyword data.

---

## How Detection Works

The plugin automatically detects available MCP tools:

```
IF tools contain "ahrefs_" → Use Ahrefs for volume/KD
IF tools contain "semrush_" → Use SEMrush for competitors
IF tools contain "gsc_" → Use GSC for rankings
IF none available → Use reasoning-based analysis
```

No configuration needed. Just add the MCP servers.

---

## Troubleshooting

**MCP server not detected**

Run `claude mcp list` to verify the server is installed.

**Authentication errors**

Re-authenticate: `claude mcp auth <server-name>`

**Data not appearing**

Check your subscription includes API access. Some plans don't.

---

## Related

- [Getting started tutorial](../tutorials/getting-started.md)
- [Architecture explanation](../explanation/architecture.md)
