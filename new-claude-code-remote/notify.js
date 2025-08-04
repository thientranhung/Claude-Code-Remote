#!/usr/bin/env node

/**
 * Claude Code Remote Notification Script
 * This script is called by Claude Code hooks to send notifications
 */

require('dotenv').config();
const Notifier = require('./src/notifier');

class NotificationScript {
    constructor() {
        this.notifier = new Notifier();
    }

    async run() {
        const args = process.argv.slice(2);
        const command = args[0];
        const message = args.slice(1).join(' ');

        try {
            await this.notifier.initialize();

            if (!this.notifier.initialized) {
                console.error('No notification channels available');
                process.exit(1);
            }

            const metadata = this.notifier.getMetadata();

            switch (command) {
                case 'completed':
                    await this.handleCompleted(message, metadata);
                    break;
                case 'decision':
                    await this.handleDecision(message, metadata);
                    break;
                case 'custom':
                    await this.handleCustom(message, metadata);
                    break;
                default:
                    console.error(`Unknown command: ${command}`);
                    console.log('Available commands: completed, decision, custom');
                    process.exit(1);
            }
        } catch (error) {
            console.error('Notification error:', error.message);
            process.exit(1);
        }
    }

    async handleCompleted(summary, metadata) {
        if (!summary) {
            console.error('Summary message is required for completed command');
            process.exit(1);
        }

        const success = await this.notifier.sendCompletionNotification(summary, metadata);
        if (success) {
            console.log('Completion notification sent successfully');
        } else {
            console.error('Failed to send completion notification');
            process.exit(1);
        }
    }

    async handleDecision(message, metadata) {
        if (!message) {
            console.error('Message is required for decision command');
            process.exit(1);
        }

        const success = await this.notifier.sendDecisionNotification(message, metadata);
        if (success) {
            console.log('Decision notification sent successfully');
        } else {
            console.error('Failed to send decision notification');
            process.exit(1);
        }
    }

    async handleCustom(message, metadata) {
        if (!message) {
            console.error('Message is required for custom command');
            process.exit(1);
        }

        const notification = {
            type: 'Custom Notification',
            message: message,
            metadata: {
                ...metadata,
                timestamp: new Date().toISOString()
            }
        };

        const success = await this.notifier.sendNotification(notification);
        if (success) {
            console.log('Custom notification sent successfully');
        } else {
            console.error('Failed to send custom notification');
            process.exit(1);
        }
    }
}

// Run the script
const script = new NotificationScript();
script.run().catch(error => {
    console.error('Script error:', error.message);
    process.exit(1);
}); 