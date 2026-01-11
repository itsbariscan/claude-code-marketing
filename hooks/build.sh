#!/bin/bash
# Build hooks for Claude Code Marketing plugin

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "📦 Installing dependencies..."
npm install

echo "🔨 Compiling TypeScript..."
npx tsc

echo "📝 Renaming .js to .mjs..."
for f in dist/*.js; do
  if [ -f "$f" ]; then
    mv "$f" "${f%.js}.mjs"
  fi
done

echo "✅ Hooks built successfully!"
echo ""
echo "Files created:"
ls -la dist/
