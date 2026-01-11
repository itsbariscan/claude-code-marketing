# Getting Started

Create your first brand and get keyword recommendations in 5 minutes.

**What you'll learn:**
- Install the plugin
- Create a brand profile
- Get your first keyword analysis

**Prerequisites:**
- Claude Code installed and working
- A client/brand you want to work on

---

## Step 1: Install the Plugin

```bash
git clone https://github.com/itsbariscan/claude-code-marketing.git
cd claude-code-marketing
./install.sh
```

You should see:

```
📦 Installing Claude Code Marketing Plugin
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 Building hooks...
📁 Creating directories...
🔗 Installing hooks...
📚 Installing skills...
⚙️  Configuring Claude Code...
   Backed up settings to ~/.claude/settings.json.backup
   Existing keys preserved: hooks, statusLine
   Settings updated
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Installation complete!
```

**Checkpoint:** Installation successful? Restart Claude Code before continuing.

---

## Step 2: Create Your First Brand

Open Claude Code and run:

```
/brand new
```

Claude will ask questions. Answer them:

```
Claude: Let's set up a new brand. What's the name and website?
You: Acme Corp, https://acme.com

Claude: What does Acme Corp sell?
You: HR management software for small businesses

Claude: What industry and who's the target audience?
You: B2B SaaS targeting SMB HR managers

Claude: Who are 2-3 main competitors?
You: BambooHR, Gusto, Zenefits

✅ Brand "Acme Corp" created and set as active.
```

**Checkpoint:** Run `/brand` to verify. You should see your brand details.

---

## Step 3: Get Keyword Recommendations

Now ask for keywords:

```
You: what keywords should I target for the homepage?
```

Claude responds with brand-aware recommendations:

```
Claude: 📊 KEYWORD ANALYSIS - Acme Corp Homepage

        Based on your positioning (simple HR for SMBs):

        🏆 PRIMARY
        • "hr software small business" - your core term
        • "simple hr system" - matches your USP

        🥈 SECONDARY
        • "bamboohr alternative" - competitor capture
        • "hr software pricing" - commercial intent

        Want a content brief for any of these?
```

**Checkpoint:** Did Claude use your brand context in the recommendations?

---

## Step 4: Create a Content Brief

Pick a keyword and request a brief:

```
You: create a content brief for "hr software small business"
```

Claude generates a detailed brief:

```
Claude: 📝 CONTENT BRIEF

        Target: "hr software small business"
        Intent: Commercial
        Word count: 2,500-3,500

        OUTLINE:
        H1: HR Software for Small Business: Complete Guide
        H2: What is HR Software?
        H2: Key Features to Look For
        H2: How Much Does HR Software Cost?
        H2: Top HR Software Compared
        H2: FAQs

        FEATURED SNIPPET TARGET:
        "HR software for small business typically costs..."
```

**Checkpoint:** Brief includes your competitors and positioning? Success.

---

## What You Learned

- Install the plugin with `./install.sh`
- Create brands with `/brand new`
- Get keyword recommendations using natural language
- Generate content briefs with brand context

---

## Next Steps

- [How to manage multiple clients](../how-to/manage-clients.md)
- [How to create content briefs](../how-to/content-briefs.md)
- [Commands reference](../reference/commands.md)
