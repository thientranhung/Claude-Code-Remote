#!/usr/bin/env node

/**
 * Test script for notification with tmux scan
 */

require('dotenv').config();
const Notifier = require('./src/notifier');

async function testNotification() {
    console.log('🧪 Testing notification with tmux scan...');
    
    const notifier = new Notifier();
    await notifier.initialize();
    
    try {
        const success = await notifier.sendNotification({
            type: 'Test Notification',
            message: 'This is a test notification from test-notification.js',
            metadata: {
                project: process.cwd().split('/').pop(),
                directory: process.cwd(),
                timestamp: new Date().toISOString()
            }
        });
        
        if (success) {
            console.log('✅ Test notification sent successfully!');
        } else {
            console.error('❌ Test notification failed');
            process.exit(1);
        }
    } catch (error) {
        console.error('Test failed:', error.message);
        process.exit(1);
    }
}

// Run test if called directly
if (require.main === module) {
    testNotification();
}

module.exports = { testNotification }; 