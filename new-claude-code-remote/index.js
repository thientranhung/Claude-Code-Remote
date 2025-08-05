#!/usr/bin/env node

/**
 * New Claude Code Remote - Main Entry Point
 * Simplified notification system for Claude Code
 */

require('dotenv').config();
const Notifier = require('./src/notifier');

class NewClaudeCodeRemote {
    constructor() {
        this.notifier = new Notifier();
    }

    async start() {
        console.log('🤖 New Claude Code Remote');
        console.log('========================\n');

        try {
            // Initialize notifier
            const initialized = await this.notifier.initialize();
            
            if (!initialized) {
                console.log('❌ No notification channels available');
                console.log('\nPlease configure your .env file:');
                console.log('- Copy env.example to .env');
                console.log('- Set EMAIL_ENABLED=true and/or TELEGRAM_ENABLED=true');
                console.log('- Configure your credentials');
                process.exit(1);
            }

            console.log('✅ Notification system ready');
            console.log('\n📋 Available commands:');
            console.log('  node notify.js completed "message"');
            console.log('  node notify.js decision "message"');
            console.log('  node notify.js custom "message"');
            console.log('\n🔧 Configuration:');
            console.log('  npm run configure    # Configure Claude Code hooks');
            console.log('  npm test             # Test notification system');
            console.log('\n📖 Documentation: README.md');

        } catch (error) {
            console.error('❌ Startup error:', error.message);
            process.exit(1);
        }
    }
}

// Run the application
const app = new NewClaudeCodeRemote();
app.start().catch(error => {
    console.error('Application error:', error.message);
    process.exit(1);
}); 