#!/usr/bin/env node

/**
 * Configure Claude Code Settings Script
 * Automatically sets up Claude Code hooks configuration
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class ClaudeConfigurator {
    constructor() {
        this.claudeDir = path.join(os.homedir(), '.claude');
        this.settingsPath = path.join(this.claudeDir, 'settings.json');
        this.notifyPath = path.resolve(__dirname, 'notify.js');
    }

    async configure() {
        console.log('🔧 Configuring Claude Code settings...\n');

        try {
            // Create .claude directory if it doesn't exist
            if (!fs.existsSync(this.claudeDir)) {
                fs.mkdirSync(this.claudeDir, { recursive: true });
                console.log('✅ Created .claude directory');
            }

            // Read existing settings or create new
            let settings = {};
            if (fs.existsSync(this.settingsPath)) {
                try {
                    settings = JSON.parse(fs.readFileSync(this.settingsPath, 'utf8'));
                    console.log('📖 Found existing settings.json');
                } catch (error) {
                    console.log('⚠️  Existing settings.json is invalid, creating new one');
                }
            } else {
                console.log('📝 Creating new settings.json');
            }

            // Add hooks configuration
            settings.hooks = {
                "Stop": [{
                    "matcher": "*",
                    "hooks": [{
                        "type": "command",
                        "command": `node "${this.notifyPath}" completed`,
                        "timeout": 5
                    }]
                }],
                "SubagentStop": [{
                    "matcher": "*",
                    "hooks": [{
                        "type": "command",
                        "command": `node "${this.notifyPath}" completed`,
                        "timeout": 5
                    }]
                }],
                "Decision": [{
                    "matcher": "*",
                    "hooks": [{
                        "type": "command",
                        "command": `node "${this.notifyPath}" decision`,
                        "timeout": 5
                    }]
                }]
            };

            // Write settings
            fs.writeFileSync(this.settingsPath, JSON.stringify(settings, null, 2));
            console.log('✅ Updated settings.json with hooks configuration');

            console.log('\n📋 Configuration details:');
            console.log(`   Settings file: ${this.settingsPath}`);
            console.log(`   Notify script: ${this.notifyPath}`);
            console.log('\n🎉 Claude Code configuration completed!');
            console.log('\nNext steps:');
            console.log('1. Start Claude Code in a tmux session');
            console.log('2. Test with a simple task');
            console.log('3. Check your email/telegram for notifications');

        } catch (error) {
            console.error('❌ Configuration failed:', error.message);
            process.exit(1);
        }
    }

    showCurrentConfig() {
        console.log('📋 Current Claude Code configuration:');
        console.log(`   Settings file: ${this.settingsPath}`);
        console.log(`   Notify script: ${this.notifyPath}`);
        
        if (fs.existsSync(this.settingsPath)) {
            try {
                const settings = JSON.parse(fs.readFileSync(this.settingsPath, 'utf8'));
                if (settings.hooks) {
                    console.log('   ✅ Hooks configured');
                    Object.keys(settings.hooks).forEach(hook => {
                        console.log(`      - ${hook}`);
                    });
                } else {
                    console.log('   ❌ No hooks configured');
                }
            } catch (error) {
                console.log('   ❌ Invalid settings.json');
            }
        } else {
            console.log('   ❌ Settings file not found');
        }
    }
}

// Run the script
const configurator = new ClaudeConfigurator();

const command = process.argv[2];
if (command === 'show') {
    configurator.showCurrentConfig();
} else {
    configurator.configure().catch(error => {
        console.error('Configuration error:', error.message);
        process.exit(1);
    });
} 