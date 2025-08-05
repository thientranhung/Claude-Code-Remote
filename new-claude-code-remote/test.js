#!/usr/bin/env node

/**
 * Test script for Claude Code Remote Notification System
 */

require('dotenv').config();
const Notifier = require('./src/notifier');

class TestScript {
    constructor() {
        this.notifier = new Notifier();
    }

    async run() {
        console.log('🧪 Testing Claude Code Remote Notification System\n');

        try {
            // Initialize notifier
            console.log('1. Initializing notification system...');
            const initialized = await this.notifier.initialize();
            
            if (!initialized) {
                console.error('❌ Failed to initialize notification system');
                console.log('\nPlease check your .env configuration:');
                console.log('- Copy env.example to .env');
                console.log('- Configure EMAIL_ENABLED and/or TELEGRAM_ENABLED');
                console.log('- Set up your credentials');
                process.exit(1);
            }

            console.log('✅ Notification system initialized successfully\n');

            // Test completion notification
            console.log('2. Testing completion notification...');
            const metadata = this.notifier.getMetadata();
            const completionSuccess = await this.notifier.sendCompletionNotification(
                'Test task completed successfully. This is a sample summary of what Claude Code has accomplished.',
                metadata
            );

            if (completionSuccess) {
                console.log('✅ Completion notification sent successfully');
            } else {
                console.log('❌ Failed to send completion notification');
            }

            console.log('');

            // Test decision notification
            console.log('3. Testing decision notification...');
            const decisionSuccess = await this.notifier.sendDecisionNotification(
                'Claude Code needs your input: Should I proceed with the refactoring?',
                metadata
            );

            if (decisionSuccess) {
                console.log('✅ Decision notification sent successfully');
            } else {
                console.log('❌ Failed to send decision notification');
            }

            console.log('\n🎉 Test completed!');
            console.log('\nNext steps:');
            console.log('1. Configure Claude Code hooks in ~/.claude/settings.json');
            console.log('2. Start Claude Code in a tmux session');
            console.log('3. Test with real notifications');

        } catch (error) {
            console.error('❌ Test failed:', error.message);
            process.exit(1);
        }
    }
}

// Run the test
const test = new TestScript();
test.run().catch(error => {
    console.error('Test error:', error.message);
    process.exit(1);
}); 