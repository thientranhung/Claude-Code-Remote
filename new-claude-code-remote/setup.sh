#!/bin/bash

# New Claude Code Remote Setup Script

echo "🚀 Setting up New Claude Code Remote..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created. Please edit it with your configuration."
else
    echo "ℹ️  .env file already exists."
fi

# Make notify.js executable
echo "🔧 Making notify.js executable..."
chmod +x notify.js

# Get absolute path for hooks configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NOTIFY_PATH="$SCRIPT_DIR/notify.js"

echo ""
echo "🎉 Setup completed!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your email/telegram configuration"
echo "2. Test the system: npm test"
echo "3. Configure Claude Code hooks:"
echo "   - Copy claude-hooks.json to ~/.claude/settings.json"
echo "   - Update the path in settings.json to: $NOTIFY_PATH"
echo "4. Start Claude Code in a tmux session"
echo ""
echo "For more information, see README.md" 