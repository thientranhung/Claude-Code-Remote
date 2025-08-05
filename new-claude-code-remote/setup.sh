#!/bin/bash

# Claude Code Remote Setup Script - Per-Project Installation
# This script should be run after copying the notification system next to your project

set -e

echo "🚀 Claude Code Remote Notification System Setup"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Check system requirements
echo "📋 Checking system requirements..."
echo ""

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node -v)
    print_success "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js is not installed"
    echo "   Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm -v)
    print_success "npm installed: $NPM_VERSION"
else
    print_error "npm is not installed"
    exit 1
fi

# Check tmux
if command_exists tmux; then
    TMUX_VERSION=$(tmux -V)
    print_success "tmux installed: $TMUX_VERSION"
else
    print_error "tmux is not installed"
    echo "   Install tmux:"
    echo "   - macOS: brew install tmux"
    echo "   - Ubuntu/Debian: sudo apt-get install tmux"
    echo "   - RHEL/CentOS: sudo yum install tmux"
    exit 1
fi

# Check Claude Code CLI
if command_exists claude; then
    print_success "Claude Code CLI is installed"
else
    print_error "Claude Code CLI is not installed"
    echo "   Install with: npm install -g @anthropic/claude-code"
    echo "   Or follow instructions at: https://docs.anthropic.com/claude-code"
    exit 1
fi

echo ""

# 2. Detect project structure
echo "📁 Detecting project structure..."
echo ""

# Look for common project indicators in parent directory
PROJECT_FOUND=false
PROJECT_NAME=""
PROJECT_PATH=""

# Check each directory in parent
for dir in "$PARENT_DIR"/*; do
    if [ -d "$dir" ] && [ "$dir" != "$SCRIPT_DIR" ]; then
        # Check for common project files
        if [ -f "$dir/package.json" ] || [ -f "$dir/.git/config" ] || [ -f "$dir/README.md" ]; then
            PROJECT_FOUND=true
            PROJECT_PATH="$dir"
            PROJECT_NAME=$(basename "$dir")
            break
        fi
    fi
done

if [ "$PROJECT_FOUND" = true ]; then
    print_success "Found project: $PROJECT_NAME"
    echo "   Path: $PROJECT_PATH"
else
    print_warning "No project detected in parent directory"
    echo "   Make sure this notification system is placed next to your project folder"
    echo ""
    echo "   Expected structure:"
    echo "   parent-folder/"
    echo "   ├── your-project/"
    echo "   └── $(basename "$SCRIPT_DIR")/"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""

# 3. Install dependencies
echo "📦 Installing dependencies..."
npm install
print_success "Dependencies installed"

echo ""

# 4. Setup .env file
echo "⚙️  Setting up environment configuration..."

if [ ! -f "$SCRIPT_DIR/.env" ]; then
    cp "$SCRIPT_DIR/env.example" "$SCRIPT_DIR/.env"
    print_success "Created .env file from template"
    
    # Auto-fill project name if detected
    if [ "$PROJECT_FOUND" = true ]; then
        # Update TMUX_SESSION_NAME with project name
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/TMUX_SESSION_NAME=claude-session/TMUX_SESSION_NAME=$PROJECT_NAME-claude/" "$SCRIPT_DIR/.env"
        else
            sed -i "s/TMUX_SESSION_NAME=claude-session/TMUX_SESSION_NAME=$PROJECT_NAME-claude/" "$SCRIPT_DIR/.env"
        fi
        print_success "Updated TMUX_SESSION_NAME to: $PROJECT_NAME-claude"
    fi
else
    print_warning ".env file already exists"
fi

echo ""

# 5. Make scripts executable
echo "🔧 Making scripts executable..."
chmod +x "$SCRIPT_DIR/notify.js"
chmod +x "$SCRIPT_DIR/generate-hooks-config.js"
chmod +x "$SCRIPT_DIR/notify-utils.js"
chmod +x "$SCRIPT_DIR/test-notification.js"
print_success "Scripts are now executable"

echo ""

# 6. Setup tmux session
echo "🖥️  Setting up tmux session..."

# Get session name from .env
TMUX_SESSION=$(grep TMUX_SESSION_NAME "$SCRIPT_DIR/.env" | cut -d'=' -f2)
TMUX_SESSION=${TMUX_SESSION:-claude-session}

# Check if session already exists
if tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
    print_warning "tmux session '$TMUX_SESSION' already exists"
else
    # Create new tmux session in detached mode
    tmux new-session -d -s "$TMUX_SESSION"
    print_success "Created tmux session: $TMUX_SESSION"
fi

echo ""

# 7. Generate hooks configuration
echo "🔨 Generating hooks configuration..."
node "$SCRIPT_DIR/generate-hooks-config.js" > /dev/null
print_success "Generated claude-hooks.json"

echo ""

# 8. Check for existing settings.local.json
echo "📋 Checking Claude Code configuration..."

CLAUDE_DIR="$PROJECT_PATH/.claude"
SETTINGS_FILE="$CLAUDE_DIR/settings.local.json"

if [ "$PROJECT_FOUND" = true ]; then
    if [ -f "$SETTINGS_FILE" ]; then
        print_warning "Found existing $SETTINGS_FILE"
        echo ""
        echo "   ⚠️  IMPORTANT: Your project already has Claude Code hooks configured!"
        echo ""
        echo "   To avoid overwriting your existing configuration:"
        echo "   1. Open the generated file: $SCRIPT_DIR/claude-hooks.json"
        echo "   2. Open your existing file: $SETTINGS_FILE"
        echo "   3. Manually merge the hooks configuration"
        echo ""
        echo "   The notification hooks you need to add are in the 'hooks' section."
    else
        # Create .claude directory if needed
        if [ ! -d "$CLAUDE_DIR" ]; then
            mkdir -p "$CLAUDE_DIR"
            print_success "Created $CLAUDE_DIR directory"
        fi
        
        echo ""
        echo "   To complete setup, copy the hooks configuration:"
        echo ""
        echo "   cp $SCRIPT_DIR/claude-hooks.json $SETTINGS_FILE"
        echo ""
    fi
else
    echo ""
    echo "   To complete setup:"
    echo "   1. Create .claude directory in your project"
    echo "   2. Copy claude-hooks.json to your-project/.claude/settings.local.json"
fi

echo ""

# 9. Gitignore reminder
echo "📝 Important: Update your project's .gitignore"
echo ""

NOTIFICATION_FOLDER_NAME=$(basename "$SCRIPT_DIR")

if [ "$PROJECT_FOUND" = true ] && [ -f "$PROJECT_PATH/.gitignore" ]; then
    # Check if already in gitignore
    if grep -q "$NOTIFICATION_FOLDER_NAME" "$PROJECT_PATH/.gitignore"; then
        print_success "Already in .gitignore: $NOTIFICATION_FOLDER_NAME/"
    else
        print_warning "Add this to $PROJECT_PATH/.gitignore:"
        echo ""
        echo "   # Claude Code Notification System"
        echo "   $NOTIFICATION_FOLDER_NAME/"
        echo ""
    fi
else
    print_warning "Don't forget to add this folder to your project's .gitignore:"
    echo ""
    echo "   # Claude Code Notification System"
    echo "   $NOTIFICATION_FOLDER_NAME/"
    echo ""
fi

echo "=============================================="
echo "✨ Setup Complete!"
echo ""
echo "📌 Next steps:"
echo ""
echo "1. Edit .env file with your email/telegram credentials:"
echo "   nano $SCRIPT_DIR/.env"
echo ""
echo "2. Test the notification system:"
echo "   cd $SCRIPT_DIR && npm test"
echo ""
echo "3. Copy hooks to your project (if not already configured):"
echo "   cp $SCRIPT_DIR/claude-hooks.json <your-project>/.claude/settings.local.json"
echo ""
echo "4. Add notification folder to .gitignore (if not done)"
echo ""
echo "5. Start Claude Code in the tmux session:"
echo "   tmux attach -t $TMUX_SESSION"
echo "   claude"
echo ""
echo "For more information, see README.md"