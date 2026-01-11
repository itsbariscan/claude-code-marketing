#!/bin/bash
#
# Claude Code Marketing Plugin - Uninstaller
#

CLAUDE_DIR="$HOME/.claude"
CLAUDE_SETTINGS="$CLAUDE_DIR/settings.json"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗑️  Uninstalling Claude Code Marketing Plugin"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Remove hooks
echo "Removing hooks..."
rm -f "$CLAUDE_DIR/hooks/session-start.mjs"
rm -f "$CLAUDE_DIR/hooks/session-end.mjs"
rm -f "$CLAUDE_DIR/hooks/brand-detect.mjs"

# Remove skills
echo "Removing skills..."
rm -rf "$CLAUDE_DIR/skills/brand"
rm -rf "$CLAUDE_DIR/skills/marketing-seo"
rm -rf "$CLAUDE_DIR/skills/marketing-strategy"

# Remove hooks from settings.json
echo "Updating settings..."
if [ -f "$CLAUDE_SETTINGS" ]; then
    node -e "
    const fs = require('fs');
    const settings = JSON.parse(fs.readFileSync('$CLAUDE_SETTINGS', 'utf-8'));

    if (settings.hooks) {
        for (const event of Object.keys(settings.hooks)) {
            settings.hooks[event] = settings.hooks[event].filter(h =>
                !h.command?.includes('session-start.mjs') &&
                !h.command?.includes('session-end.mjs') &&
                !h.command?.includes('brand-detect.mjs')
            );
            if (settings.hooks[event].length === 0) {
                delete settings.hooks[event];
            }
        }
        if (Object.keys(settings.hooks).length === 0) {
            delete settings.hooks;
        }
    }

    fs.writeFileSync('$CLAUDE_SETTINGS', JSON.stringify(settings, null, 2));
    "
fi

echo ""
echo "✅ Plugin uninstalled."
echo ""
echo "Note: Your brand data in ~/.claude-marketing/ was NOT deleted."
echo "To remove data too: rm -rf ~/.claude-marketing/"
echo ""
