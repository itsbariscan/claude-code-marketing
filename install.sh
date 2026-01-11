#!/bin/bash
#
# Claude Code Marketing Plugin - One-Click Installer
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$HOME/.claude"
CLAUDE_SETTINGS="$CLAUDE_DIR/settings.json"
MARKETING_DIR="$HOME/.claude-marketing"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Installing Claude Code Marketing Plugin"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: Build hooks (install deps + compile)
echo ""
echo "📥 Building hooks..."
cd "$SCRIPT_DIR/hooks"
npm install --silent
npm run build --silent 2>/dev/null || npm run build
cd "$SCRIPT_DIR"

# Step 2: Create directories
echo "📁 Creating directories..."
mkdir -p "$CLAUDE_DIR/hooks"
mkdir -p "$CLAUDE_DIR/skills"
mkdir -p "$MARKETING_DIR/brands"
mkdir -p "$MARKETING_DIR/handoffs"

# Step 3: Copy hooks
echo "🔗 Installing hooks..."
cp "$SCRIPT_DIR/hooks/dist/"*.mjs "$CLAUDE_DIR/hooks/"

# Step 4: Copy skills
echo "📚 Installing skills..."
cp -r "$SCRIPT_DIR/skills/"* "$CLAUDE_DIR/skills/"

# Step 5: Update settings.json with hooks
echo "⚙️  Configuring Claude Code..."

# Create settings.json if it doesn't exist
if [ ! -f "$CLAUDE_SETTINGS" ]; then
    echo '{}' > "$CLAUDE_SETTINGS"
fi

# Backup settings.json before modifying
if [ -f "$CLAUDE_SETTINGS" ]; then
    cp "$CLAUDE_SETTINGS" "$CLAUDE_SETTINGS.backup"
    echo "   Backed up settings to $CLAUDE_SETTINGS.backup"
fi

# Use node to merge hooks into settings (preserves existing settings)
node -e "
const fs = require('fs');
const settingsPath = '$CLAUDE_SETTINGS';
const hooksDir = '$CLAUDE_DIR/hooks';

let settings = {};
try {
    const content = fs.readFileSync(settingsPath, 'utf-8');
    settings = JSON.parse(content);
    console.log('   Existing keys preserved:', Object.keys(settings).join(', ') || 'none');
} catch (e) {
    // SAFETY: If we can't parse, don't wipe - abort instead
    if (fs.existsSync(settingsPath)) {
        console.error('   ERROR: Cannot parse existing settings.json');
        console.error('   Aborting to prevent data loss. Please fix settings.json manually.');
        process.exit(1);
    }
    // File doesn't exist - safe to start fresh
    settings = {};
}

// Define marketing hooks with explicit matchers
const marketingHooks = {
    SessionStart: [{
        matcher: 'startup',
        hooks: [{
            type: 'command',
            command: 'node ' + hooksDir + '/session-start.mjs',
            timeout: 5000
        }]
    }],
    Stop: [{
        hooks: [{
            type: 'command',
            command: 'node ' + hooksDir + '/session-end.mjs',
            timeout: 5000
        }]
    }],
    UserPromptSubmit: [{
        hooks: [{
            type: 'command',
            command: 'node ' + hooksDir + '/brand-detect.mjs',
            timeout: 3000
        }]
    }]
};

// Merge hooks (append to existing, avoid duplicates)
if (!settings.hooks) settings.hooks = {};

for (const [event, newHookGroups] of Object.entries(marketingHooks)) {
    if (!settings.hooks[event]) {
        settings.hooks[event] = newHookGroups;
    } else {
        // Check if marketing hooks already exist (look inside hooks arrays)
        const existingCommands = settings.hooks[event]
            .flatMap(g => (g.hooks || []).map(h => h.command || ''))
            .filter(c => c);

        const hasMarketing = existingCommands.some(cmd =>
            cmd.includes('session-start.mjs') ||
            cmd.includes('session-end.mjs') ||
            cmd.includes('brand-detect.mjs')
        );

        if (!hasMarketing) {
            settings.hooks[event] = settings.hooks[event].concat(newHookGroups);
        }
    }
}

fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
console.log('   Settings updated');
"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Installation complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Hooks installed to: $CLAUDE_DIR/hooks/"
echo "📍 Skills installed to: $CLAUDE_DIR/skills/"
echo "📍 Data stored in: $MARKETING_DIR/"
echo ""
echo "🚀 Restart Claude Code to activate the plugin."
echo ""
echo "Quick start:"
echo "  • Say: \"I'm working on [brand name]\""
echo "  • Or use: /brand new"
echo ""
