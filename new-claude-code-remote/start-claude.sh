#!/bin/bash

# Start Claude Code in TMUX Session Script

TMUX_SESSION=${TMUX_SESSION_NAME:-claude-session}

echo "🚀 Starting Claude Code in TMUX session: $TMUX_SESSION"

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo "❌ tmux is not installed. Please install tmux first."
    exit 1
fi

# Check if claude is installed
if ! command -v claude &> /dev/null; then
    echo "❌ claude is not installed. Please install Claude Code first."
    exit 1
fi

# Check if session already exists
if tmux has-session -t $TMUX_SESSION 2>/dev/null; then
    echo "⚠️  TMUX session '$TMUX_SESSION' already exists"
    read -p "Do you want to attach to existing session? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔗 Attaching to existing session..."
        tmux attach-session -t $TMUX_SESSION
        exit 0
    else
        echo "❌ Please manually manage the existing session"
        exit 1
    fi
fi

# Create new session
echo "📝 Creating new TMUX session: $TMUX_SESSION"
tmux new-session -d -s $TMUX_SESSION

# Send command to start Claude Code
echo "🤖 Starting Claude Code..."
tmux send-keys -t $TMUX_SESSION "claude" Enter

# Attach to session
echo "🔗 Attaching to session..."
echo "💡 Tips:"
echo "   - Press Ctrl+B, then D to detach"
echo "   - Use 'tmux attach-session -t $TMUX_SESSION' to reattach"
echo "   - Use 'tmux kill-session -t $TMUX_SESSION' to stop session"
echo ""

tmux attach-session -t $TMUX_SESSION 