#!/usr/bin/env node

/**
 * Migration script from token-based system to session name system
 * This script helps migrate existing configurations
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Migrating to Session Name System\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found');
    console.log('💡 Please create .env file with TMUX_SESSION_NAME configuration');
    process.exit(1);
}

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

// Check if TMUX_SESSION_NAME is already configured
let hasTmuxSessionName = false;
for (const line of lines) {
    if (line.trim().startsWith('TMUX_SESSION_NAME=')) {
        hasTmuxSessionName = true;
        break;
    }
}

if (!hasTmuxSessionName) {
    console.log('⚠️  TMUX_SESSION_NAME not found in .env file');
    console.log('💡 Adding TMUX_SESSION_NAME=claude-session to .env file');
    
    // Add TMUX_SESSION_NAME to .env file
    const newEnvContent = envContent + '\n# TMUX Session Configuration\nTMUX_SESSION_NAME=claude-session\n';
    fs.writeFileSync(envPath, newEnvContent);
    console.log('✅ Added TMUX_SESSION_NAME to .env file');
} else {
    console.log('✅ TMUX_SESSION_NAME already configured');
}

// Check session-map.json for cleanup
const sessionMapPath = path.join(__dirname, 'src/data/session-map.json');
if (fs.existsSync(sessionMapPath)) {
    console.log('\n📋 Found existing session-map.json');
    console.log('💡 Consider cleaning up old session data:');
    console.log('   - Old token-based sessions are no longer needed');
    console.log('   - You can safely delete or backup session-map.json');
    console.log('   - New system uses direct tmux session names');
}

// Check for tmux session
const tmuxSessionName = process.env.TMUX_SESSION_NAME || 'claude-session';
console.log(`\n🔧 Checking tmux session '${tmuxSessionName}'...`);

try {
    const { execSync } = require('child_process');
    execSync(`tmux has-session -t ${tmuxSessionName} 2>/dev/null`, { stdio: 'ignore' });
    console.log(`✅ Tmux session '${tmuxSessionName}' exists`);
} catch (error) {
    console.log(`❌ Tmux session '${tmuxSessionName}' not found`);
    console.log(`💡 Create it with: tmux new-session -d -s ${tmuxSessionName}`);
}

console.log('\n✅ Migration completed!');
console.log('\n📝 Next steps:');
console.log('   1. Set TMUX_SESSION_NAME in your .env file');
console.log('   2. Create tmux session: tmux new-session -d -s <session_name>');
console.log('   3. Test with: node test-new-session-system.js');
console.log('   4. Update your notification channels to use new format'); 