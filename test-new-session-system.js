#!/usr/bin/env node

/**
 * Test script for new session name system
 * Tests the simplified tmux session name approach
 */

const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Testing New Session Name System\n');

// Check environment variables
const tmuxSessionName = process.env.TMUX_SESSION_NAME || 'claude-session';
console.log(`📋 TMUX_SESSION_NAME: ${tmuxSessionName}`);

// Test tmux session existence
try {
    const sessionExists = execSync(`tmux has-session -t ${tmuxSessionName} 2>/dev/null`, { 
        stdio: 'ignore' 
    });
    console.log(`✅ Tmux session '${tmuxSessionName}' exists`);
} catch (error) {
    console.log(`❌ Tmux session '${tmuxSessionName}' not found`);
    console.log(`💡 Create it with: tmux new-session -d -s ${tmuxSessionName}`);
}

// Test command injection
console.log('\n🔧 Testing command injection...');
try {
    const testCommand = 'echo "Test command from new session system"';
    execSync(`tmux send-keys -t ${tmuxSessionName} '${testCommand}'`);
    execSync(`tmux send-keys -t ${tmuxSessionName} Enter`);
    console.log('✅ Command injection test successful');
} catch (error) {
    console.log('❌ Command injection test failed:', error.message);
}

// Test webhook handlers
console.log('\n🌐 Testing webhook handlers...');

// Test Telegram format
const telegramCommand = `/cmd ${tmuxSessionName} test command`;
console.log(`📱 Telegram format: ${telegramCommand}`);

// Test LINE format  
const lineCommand = `${tmuxSessionName} test command`;
console.log(`💬 LINE format: ${lineCommand}`);

// Test Email format
const emailSubject = `[Claude-Code-Remote Session: ${tmuxSessionName}]`;
console.log(`📧 Email subject format: ${emailSubject}`);

console.log('\n✅ New session name system test completed!');
console.log('\n📝 Usage Examples:');
console.log(`   Telegram: /cmd ${tmuxSessionName} analyze this code`);
console.log(`   LINE: ${tmuxSessionName} analyze this code`);
console.log(`   Email: Reply to notification with: ${tmuxSessionName} analyze this code`); 